## API Endpoint Implementation Plan: Solve Diagram (`POST /diagrams/{id}/solve`)

### 1. Przegląd punktu końcowego

Punkt końcowy generuje rozwiązanie dla istniejącego diagramu sudoku i zapisuje je w bazie danych. Użytkownik (uwierzytelniony) wywołuje operację solve dla konkretnego `diagram.id`. Usługa pobiera definicję diagramu, uruchamia solver, zapisuje `solution` i aktualizuje `updated_at`, a następnie zwraca pełny obiekt diagramu.

### 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **URL**: `/diagrams/{id}/solve`
- **Parametry**:
  - **Wymagane**:
    - `id` (number, route param) — identyfikator diagramu
  - **Opcjonalne**: brak
- **Nagłówki**:
  - `Authorization: Bearer <jwt>` (token Supabase Auth)
- **Body**: brak (solver działa na istniejącej definicji)

### 3. Wykorzystywane typy

- DTO (Response DTO):
  - `DiagramDto` (dla odpowiedzi 200):
    - `id: number`
    - `name?: string`
    - `definition: string`
    - `solution?: string`
    - `created_at: string (ISO)`
    - `updated_at: string (ISO)`
- Command modele:
  - `SolveDiagramCommand`:
    - `diagramId: number`
    - `userId: string | number` (z kontekstu auth)
  - `SolveResult` (warstwa serwisowa):
    - `diagram: Diagram` (model domenowy po zapisie)
    - `wasComputed: boolean` (np. false, gdy rozwiązanie już istniało i polityka pozwala na reużycie)

Uwagi: dopasować typy do istniejących modeli w `backend/Models` oraz kontraktów w `src/types.ts` (frontend). W razie rozbieżności dodać mapowanie domena → DTO.

### 4. Szczegóły odpowiedzi

- **200 OK** — sukces; zwracany `DiagramDto`:

```json
{
  "id": 1,
  "name": "Example Diagram",
  "definition": "...",
  "solution": "Generated solution content...",
  "created_at": "2025-10-13T12:00:00Z",
  "updated_at": "2025-10-13T12:15:00Z"
}
```

- **Kody błędów**:
  - `400 Bad Request` — niepoprawny `id` lub stan danych (np. zbyt długa `definition` vs kontrakt)
  - `401 Unauthorized` — brak/niepoprawny token
  - `404 Not Found` — brak diagramu lub nie należy do użytkownika
  - `409 Conflict` — (opcjonalnie) konflikt polityki zapisu, np. próba nadpisania rozwiązania, gdy polityka tego zabrania
  - `500 Internal Server Error` — błąd nieoczekiwany/solver/DB

### 5. Przepływ danych

1. Klient wywołuje `POST /diagrams/{id}/solve` z JWT (Supabase Auth).
2. Middleware auth weryfikuje token i ustala `userId`.
3. Handler pobiera `id` z trasy, waliduje.
4. `DiagramService.GenerateAndSaveSolutionAsync(command, ct)`:
   - Pobiera diagram przez repo (`IDiagramRepository.GetByIdForUserAsync(id, userId)`)
   - Waliduje spójność danych (np. długość `definition`)
   - Jeżeli rozwiązanie już istnieje:
     - wg polityki: zwraca istniejące lub nadpisuje (domyślnie: nadpisuje dozwolone)
   - Uruchamia solver sudoku na `definition`
   - Zapisuje `solution` i `updated_at` przez repo (`UpdateSolutionAsync(id, solution)`) w transakcji
   - Zwraca zaktualizowany model domenowy
5. Handler mapuje domenę → `DiagramDto` i zwraca 200.

Źródła danych: Postgres (Supabase). Warstwa repo: `SupabaseDiagramRepository` (produkcyjnie) i `InMemoryDiagramRepository` (testy/dev).

### 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wymagane JWT Supabase (middleware). Brak dostępu anonimowego.
- **Autoryzacja zasobowa**: Filtr po `userId` — użytkownik może rozwiązywać tylko swoje diagramy.
- **Walidacja danych**: Guard clauses dla `id`, stanu diagramu, długości pól. Odporność na injection (parametry bindowane, brak raw SQL).
- **Ochrona przed nadużyciami**: Rate limiting per user (np. `AspNetCoreRateLimit` lub prosty limiter w pamięci) — solver bywa kosztowny.
- **Obsługa czasu wykonania**: `CancellationToken` z requestu, timeout (np. 3-5s) na solver.
- **Logowanie i obserwowalność**: Strukturalne logi (korelacja `TraceId`, `userId`, `diagramId`). Brak logowania PII poza koniecznym `userId`.
- **Nagłówki**: `Cache-Control: no-store` (wynik jest per-resource i zmienny), `Content-Type: application/json; charset=utf-8`.

### 7. Obsługa błędów

- Walidacja wejścia: `400` z payloadem błędu `{ code, message, details? }`.
- Brak zasobu / brak dostępu: `404` (unikamy ujawniania istnienia zasobu innego użytkownika).
- Niepowodzenie solvera (niespełnialna definicja): `400` (business validation) z kodem `UNSOLVABLE`.
- Konflikt polityki nadpisu istniejącego rozwiązania: `409`.
- Błędy DB/nieoczekiwane wyjątki: `500`. Logowanie na poziomie `Error` z `Exception` i danymi korelacyjnymi.
- (Opcjonalnie) Tabela błędów: jeśli istnieje mechanizm, zapisywać skrót zdarzenia (hash requestu, userId, diagramId, kod) w dedykowanej tabeli audytowej. Brak — wystarczą logi aplikacyjne.

Standardowy kształt błędu:

```json
{
  "code": "UNSOLVABLE",
  "message": "Diagram jest nierozwiązywalny.",
  "details": null
}
```

### 8. Rozważania dotyczące wydajności

- Solver uruchamiać synchronicznie.
- Unikać wielokrotnych odczytów — repozytorium powinno pobierać i aktualizować w jednej transakcji.
- Indeks na `diagrams(id)` istnieje (PK). Dodatkowe indeksy nie wymagane dla tego endpointu.
- Rate limiting, ewentualnie quota per user.

### 9. Etapy wdrożenia

1. Dodaj kontrakty DTO/Command w backend:
   - `SolveDiagramCommand` (aplikacja/serwis)
   - `DiagramDto` (API)
2. Rozszerz serwis: `DiagramService`
   - `Task<Diagram> GenerateAndSaveSolutionAsync(SolveDiagramCommand command, CancellationToken ct)`
   - Obsłuż walidację, solver, zapis, mapowanie wyjątków na własne typy błędów.
3. Rozszerz repozytoria:
   - `IDiagramRepository.GetByIdForUserAsync(long id, long userId, CancellationToken ct)`
   - `IDiagramRepository.UpdateSolutionAsync(long id, string solution, CancellationToken ct)`
   - Implementacje: `SupabaseDiagramRepository`, `InMemoryDiagramRepository`.
4. Dodaj solver Sudoku (jeśli brak):
   - Interfejs `ISudokuSolver { string Solve(string definition); }`
   - Implementacja w `Services` (deterministyczna, bez zależności) lub jako osobna klasa.
5. Endpoint w `Program.cs` (Minimal API):
   - Mapowanie `POST /diagrams/{id:long}/solve`
   - Ekstrakcja `userId` z `HttpContext`/JWT (Supabase), walidacja `id`, `CancellationToken`.
   - Wywołanie serwisu, mapowanie do `DiagramDto`, zwrot `200`.
6. Middleware/filtry:
   - Wymuś autoryzację `[RequireAuthorization]` na trasie lub globalnie.
   - (Opcjonalnie) rate limiter na ten endpoint.
7. Obsługa błędów:
   - Globalny handler wyjątków → standaryzacja odpowiedzi błędów.
   - Mapowanie wyjątków domenowych na kody: `ValidationException → 400`, `NotFoundException → 404`, `ConflictException → 409`.
8. Testy:
   - Jednostkowe: solver, serwis (scenariusze: found/not found, already solved, unsolvable, save fail).
   - Integracyjne: endpoint z `InMemoryDiagramRepository`.
9. Dokumentacja:
   - Uzupełnij Swagger/OpenAPI (opis, kody, schematy DTO), przykład odpowiedzi.
10. Telemetria i logowanie:

- Dodaj logi `Information` (start/stop solve), `Warning` (unsolvable), `Error` (wyjątki) z `userId`, `diagramId`.
