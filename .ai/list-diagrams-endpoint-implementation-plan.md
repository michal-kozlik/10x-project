# API Endpoint Implementation Plan: List Diagrams

## 1. Przegląd punktu końcowego

Endpoint `GET /diagrams` służy do pobierania listy diagramów sudoku użytkownika z obsługą paginacji, filtrowania i sortowania. Endpoint umożliwia użytkownikom przeglądanie swoich zapisanych diagramów w sposób uporządkowany i wydajny.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/diagrams`
- **Parametry:**
  - **Opcjonalne:**
    - `page` (number): Numer strony dla paginacji (domyślnie: 1)
    - `limit` (number): Liczba diagramów na stronę (domyślnie: 10, maksymalnie: 100)
    - `sortBy` (string): Pole do sortowania (dostępne: `created_at`, `name`, `id`)
    - `filter` (string): Filtr wyszukiwania po nazwie diagramu
- **Request Body:** Brak (GET request)
- **Headers wymagane:**
  - `Authorization: Bearer <token>` - Token JWT z Supabase Auth

## 3. Wykorzystywane typy

### DTOs (już zdefiniowane w `src/types.ts`):

- `ListDiagramsQuery` - parametry zapytania
- `ListDiagramsResponseDTO` - struktura odpowiedzi
- `DiagramListItemDTO` - pojedynczy element listy
- `PaginationMetaDTO` - metadane paginacji

### Nowe typy do utworzenia:

- `DiagramService` - serwis do operacji na diagramach
- `DiagramRepository` - repozytorium do dostępu do bazy danych
- `QueryValidationResult` - wynik walidacji parametrów

## 4. Szczegóły odpowiedzi

### Sukces (200 OK):

```json
{
  "data": [
    {
      "id": 1,
      "name": "Example Diagram",
      "definition": "123456789...",
      "solution": "987654321...",
      "created_at": "2025-10-13T12:00:00Z",
      "updated_at": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50
  }
}
```

### Błędy:

- **400 Bad Request:** Nieprawidłowe parametry zapytania
- **401 Unauthorized:** Brak lub nieprawidłowy token autoryzacji
- **500 Internal Server Error:** Błąd serwera lub bazy danych

## 5. Przepływ danych

1. **Walidacja żądania:**
   - Sprawdzenie tokenu autoryzacji
   - Walidacja parametrów zapytania
   - Ustawienie wartości domyślnych

2. **Autoryzacja:**
   - Weryfikacja tokenu JWT przez Supabase
   - Pobranie user_id z tokenu

3. **Przetwarzanie zapytania:**
   - Budowanie zapytania SQL z filtrami
   - Aplikacja paginacji i sortowania
   - Wykonanie zapytania do bazy danych

4. **Formatowanie odpowiedzi:**
   - Mapowanie wyników na DTOs
   - Obliczenie metadanych paginacji
   - Zwrócenie sformatowanej odpowiedzi

## 6. Względy bezpieczeństwa

### Uwierzytelnianie:

- Wymagany token JWT z Supabase Auth
- Weryfikacja tokenu na każdym żądaniu
- Automatyczne pobieranie user_id z tokenu

### Autoryzacja:

- Row Level Security (RLS) w Supabase
- Użytkownicy mogą widzieć tylko swoje diagramy
- Automatyczne filtrowanie po user_id

### Walidacja danych:

- Sanityzacja parametrów zapytania
- Walidacja zakresów wartości (page > 0, limit <= 100)
- Ochrona przed SQL injection przez parametryzowane zapytania

## 7. Obsługa błędów

### Scenariusze błędów:

1. **400 Bad Request:**
   - `page` < 1
   - `limit` > 100 lub < 1
   - Nieprawidłowy format `sortBy`
   - Zbyt długi `filter` (> 1000 znaków)

2. **401 Unauthorized:**
   - Brak tokenu autoryzacji
   - Nieprawidłowy token
   - Wygasły token

3. **500 Internal Server Error:**
   - Błąd połączenia z bazą danych
   - Błąd Supabase
   - Nieoczekiwany błąd serwera

### Logowanie błędów:

- Logowanie wszystkich błędów 500 z pełnym stack trace
- Logowanie prób nieautoryzowanego dostępu
- Monitoring wydajności zapytań

## 8. Rozważania dotyczące wydajności

### Optymalizacje bazy danych:

- Istniejący indeks na `user_id` dla szybkich wyszukiwań
- Paginacja ogranicza rozmiar wyników
- Efektywne zapytania z LIMIT i OFFSET

### Caching:

- Rozważenie cache'owania dla często używanych zapytań
- Cache metadanych paginacji dla dużych zbiorów danych

### Limity:

- Maksymalny limit 100 elementów na stronę
- Timeout dla długotrwałych zapytań wynosi 60 sekund
- Rate limiting dla zapobiegania nadużyciom

## 9. Etapy wdrożenia

### Etap 1: Przygotowanie infrastruktury

1. Dodanie pakietów NuGet:
   - `Supabase` - klient Supabase dla .NET
   - `Microsoft.AspNetCore.Authentication.JwtBearer` - obsługa JWT
   - `FluentValidation` - walidacja parametrów

2. Konfiguracja w `Program.cs`:
   - Rejestracja serwisów
   - Konfiguracja autoryzacji JWT
   - Konfiguracja Supabase

### Etap 2: Implementacja warstwy danych

1. Utworzenie `DiagramRepository`:
   - Metody do pobierania diagramów z filtrami
   - Implementacja paginacji
   - Obsługa sortowania

2. Implementacja `DiagramService`:
   - Logika biznesowa
   - Walidacja parametrów
   - Mapowanie na DTOs

### Etap 3: Implementacja kontrolera

1. Utworzenie `DiagramsController`:
   - Endpoint GET `/diagrams`
   - Walidacja parametrów
   - Obsługa błędów

2. Implementacja middleware:
   - Walidacja JWT
   - Logowanie żądań
   - Obsługa błędów globalnych

### Etap 4: Testy i walidacja

1. Testy jednostkowe:
   - Testy serwisu
   - Testy repozytorium
   - Testy kontrolera

2. Testy integracyjne:
   - Testy end-to-end
   - Testy autoryzacji
   - Testy wydajności

### Etap 5: Dokumentacja i wdrożenie

1. Dokumentacja API:
   - OpenAPI/Swagger
   - Przykłady użycia
   - Kody błędów

2. Wdrożenie:
   - Konfiguracja środowiska produkcyjnego
   - Monitoring i logowanie
   - Backup i recovery

### Etap 6: Optymalizacja

1. Analiza wydajności:
   - Profiling zapytań
   - Optymalizacja indeksów
   - Implementacja cache'owania

2. Monitoring:
   - Metryki wydajności
   - Alerty błędów
   - Analiza użycia
