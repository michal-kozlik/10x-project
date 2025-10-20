# Plan implementacji widoku Dashboard

## 1. Przegląd
Widok Dashboard to główny interfejs aplikacji do zarządzania diagramami Sudoku. Składa się z dwóch głównych paneli: listy istniejących diagramów oraz edytora do tworzenia, modyfikowania i rozwiązywania diagramów. Widok ten zapewnia pełen cykl życia pracy z diagramem, od jego stworzenia, przez walidację, zapis, aż po uzyskanie rozwiązania.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką `/app`. Dostęp do tej ścieżki będzie chroniony i będzie wymagał aktywnej sesji użytkownika. Niezalogowani użytkownicy zostaną automatycznie przekierowani na stronę logowania (`/login`).

## 3. Struktura komponentów
Hierarchia komponentów dla widoku Dashboard zostanie zorganizowana w następujący sposób, aby zapewnić reużywalność i separację odpowiedzialności:

```
/src/pages/app.astro
└── SessionGuard.tsx
    └── DashboardLayout (div)
        ├── DiagramsPanel
        │   ├── FilterBar.tsx
        │   ├── DiagramsTable.tsx
        │   │   ├── SortableHeader.tsx
        │   │   └── DiagramRow
        │   └── Pagination.tsx
        └── EditorPanel
            ├── SudokuEditor.tsx
            │   ├── SudokuTextarea.tsx
            │   ├── ValidationHints.tsx
            │   └── PrimaryActions.tsx
            │       ├── SaveButton.tsx
            │       └── SolveButton.tsx
            └── SolvedDiagramView.tsx
```

## 4. Szczegóły komponentów

### `SessionGuard.tsx`
- **Opis:** Komponent wyższego rzędu (HOC) lub wrapper, który sprawdza, czy użytkownik ma aktywną sesję. Jeśli nie, przekierowuje na stronę logowania.
- **Główne elementy:** Renderuje `children`, jeśli sesja jest aktywna, w przeciwnym razie zarządza przekierowaniem.
- **Obsługiwane interakcje:** Brak bezpośrednich interakcji użytkownika.
- **Obsługiwana walidacja:** Sprawdzenie istnienia i ważności tokenu sesji.
- **Typy:** `Supabase.Session`
- **Propsy:** `children: React.ReactNode`

### `DiagramsTable.tsx`
- **Opis:** Główny komponent do wyświetlania listy diagramów. Integruje filtrowanie, sortowanie i paginację.
- **Główne elementy:** `<table>` z `<thead>` i `<tbody>`. Wykorzystuje `SortableHeader` dla nagłówków i renderuje wiersze z danymi diagramów.
- **Obsługiwane interakcje:** Kliknięcie wiersza w celu załadowania diagramu do edytora.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `Diagram[]`, `Pagination`
- **Propsy:** `diagrams: Diagram[]`, `pagination: Pagination`, `onSelect: (diagram: Diagram) => void`, `onSort: (sortBy: string) => void`, `onPageChange: (page: number) => void`

### `SudokuEditor.tsx`
- **Opis:** Kontener dla edytora Sudoku, zarządzający stanem edytowanego diagramu, walidacją i akcjami.
- **Główne elementy:** `SudokuTextarea`, `ValidationHints`, `PrimaryActions`.
- **Obsługiwane interakcje:** Wprowadzanie danych, zapisywanie, rozwiązywanie.
- **Obsługiwana walidacja:** Zarządza stanem walidacji pochodzącym z `SudokuTextarea`.
- **Typy:** `Diagram`, `EditorState`
- **Propsy:** `diagram: Diagram | null`, `onSave: (data: { name: string; definition: string }) => void`, `onSolve: (id: number) => void`

### `SudokuTextarea.tsx`
- **Opis:** Pole tekstowe (`<textarea>`) z czcionką monospace, zintegrowane z logiką walidacji w locie.
- **Główne elementy:** `<textarea>`, liczniki wierszy/kolumn.
- **Obsługiwane interakcje:** Wprowadzanie i modyfikacja tekstu definicji Sudoku.
- **Obsługiwana walidacja:**
  - Sprawdzenie formatu: dozwolone tylko cyfry `1-9` i znaki `.`
  - Sprawdzenie długości: dokładnie 81 znaków.
  - Sprawdzenie duplikatów w wierszach.
  - Sprawdzenie duplikatów w kolumnach.
  - Sprawdzenie duplikatów w podsiatkach 3x3.
- **Typy:** `ValidationResult`
- **Propsy:** `value: string`, `onChange: (value: string) => void`, `validationResult: ValidationResult`

## 5. Typy

- **`Diagram` (DTO, z `src/types.ts`)**:
  ```typescript
  interface Diagram {
    id: number;
    name: string;
    definition: string;
    solution: string | null;
    created_at: string;
    updated_at: string;
  }
  ```
- **`Pagination` (DTO)**:
  ```typescript
  interface Pagination {
    page: number;
    limit: number;
    total: number;
  }
  ```
- **`TableState` (ViewModel)**:
  ```typescript
  interface TableState {
    page: number;
    limit: number;
    sortBy: string;
    filter: string;
  }
  ```
- **`EditorState` (ViewModel)**:
  ```typescript
  interface EditorState {
    diagram: Diagram | null;
    isDirty: boolean;
    validationErrors: string[];
  }
  ```

## 6. Zarządzanie stanem
Zarządzanie stanem zostanie podzielone na dwa główne obszary, obsługiwane przez dedykowane custom hooki:

- **`useDiagrams`**: Hook odpowiedzialny za stan listy diagramów. Będzie zarządzał `TableState` (paginacja, sortowanie, filtrowanie), stanem ładowania (`isLoading`) i błędami (`error`). Będzie zawierał funkcję do pobierania danych z API (`GET /api/diagrams`) i aktualizowania stanu.

- **`useSudokuEditor`**: Hook do zarządzania stanem edytora (`EditorState`). Będzie śledził aktualnie edytowany diagram, jego wartość w `textarea`, stan `isDirty` (czy dokonano zmian) oraz błędy walidacji. Będzie również obsługiwał logikę "dirty state guard", wyświetlając ostrzeżenie przy próbie opuszczenia widoku z niezapisanymi zmianami.

## 7. Integracja API

- **`GET /api/diagrams`**:
  - **Cel:** Pobranie listy diagramów.
  - **Typ żądania:** `?page={number}&limit={number}&sortBy={string}&filter={string}`
  - **Typ odpowiedzi:** `{ data: Diagram[]; pagination: Pagination; }`
  - **Użycie:** Wywoływane przez hook `useDiagrams` przy inicjalizacji i zmianie parametrów tabeli.

- **`POST /api/diagrams`**:
  - **Cel:** Zapis nowego diagramu.
  - **Typ żądania (body):** `{ name: string; definition: string; }`
  - **Typ odpowiedzi:** `Diagram`
  - **Użycie:** Wywoływane z `SudokuEditor` po kliknięciu "Zapisz" dla nowego diagramu.

- **`PUT /api/diagrams/{id}`**:
  - **Cel:** Aktualizacja istniejącego diagramu.
  - **Typ żądania (body):** `{ name: string; definition: string; }`
  - **Typ odpowiedzi:** `Diagram`
  - **Użycie:** Wywoływane z `SudokuEditor` po kliknięciu "Zapisz" dla istniejącego diagramu.

- **`POST /api/diagrams/{id}/solve`**:
  - **Cel:** Wygenerowanie rozwiązania dla diagramu.
  - **Typ odpowiedzi:** `Diagram` (z wypełnionym polem `solution`)
  - **Użycie:** Wywoływane z `SudokuEditor` po kliknięciu "Rozwiąż".

- **`DELETE /api/diagrams/{id}`**:
  - **Cel:** Usunięcie diagramu.
  - **Typ odpowiedzi:** `204 No Content`
  - **Użycie:** Wywoływane po potwierdzeniu w dialogu usunięcia.

## 8. Interakcje użytkownika
- **Wybór diagramu z listy:** Kliknięcie wiersza w `DiagramsTable` powoduje załadowanie danych diagramu do `SudokuEditor`. Jeśli edytor jest w stanie `isDirty`, wyświetlany jest dialog z prośbą o potwierdzenie.
- **Edycja w `textarea`:** Każda zmiana w `SudokuTextarea` aktualizuje stan, ustawia `isDirty` na `true` i uruchamia walidację w locie.
- **Kliknięcie "Zapisz":** Jeśli diagram jest poprawny, wysyłane jest żądanie `POST` lub `PUT` do API. Po pomyślnym zapisie lista diagramów jest odświeżana.
- **Kliknięcie "Rozwiąż":** Przycisk jest aktywny tylko dla zapisanego i poprawnego diagramu. Wysyła żądanie `POST .../solve`, a otrzymane rozwiązanie jest wyświetlane.
- **Filtrowanie/Sortowanie/Paginacja:** Interakcje z `FilterBar`, `SortableHeader` lub `Pagination` wywołują ponowne pobranie danych z API z odpowiednimi parametrami.

## 9. Warunki i walidacja
- **Ochrona akcji (Save/Solve/Delete):** Wszystkie akcje modyfikujące dane wymagają aktywnej sesji użytkownika.
- **Walidacja `SudokuTextarea`:** Komponent `SudokuTextarea` na bieżąco waliduje wprowadzane dane. Przycisk "Zapisz" jest nieaktywny, jeśli definicja jest nieprawidłowa.
- **Limit 100 diagramów:** Przycisk "Zapisz" (dla nowego diagramu) jest dezaktywowany, gdy liczba diagramów użytkownika osiągnie 100. Informacja o limicie jest wyświetlana.
- **"Dirty State Guard":** Hook `useSudokuEditor` będzie monitorował stan `isDirty`. Przy próbie nawigacji (np. zmiana diagramu, zamknięcie karty) z niezapisanymi zmianami, użytkownik zobaczy systemowe okno dialogowe z prośbą o potwierdzenie.

## 10. Obsługa błędów
- **Błędy API (np. 500, 404):** Błędy serwera będą przechwytywane, a użytkownik zostanie poinformowany za pomocą globalnych komponentów typu "toast" (np. z biblioteki `react-hot-toast`).
- **Błędy walidacji (klient):** Błędy wykryte w `SudokuTextarea` będą wyświetlane w komponencie `ValidationHints` bezpośrednio pod polem tekstowym, np. "W wierszu 4 powtarza się cyfra 9".
- **Brak rozwiązania:** Jeśli API zwróci błąd informujący o braku rozwiązania dla danego Sudoku, odpowiedni komunikat zostanie wyświetlony w toaście.
- **Brak sesji:** `SessionGuard` obsłuży ten przypadek, przekierowując użytkownika.

## 11. Kroki implementacji
1.  **Utworzenie struktury plików:** Stworzenie plików dla wszystkich zdefiniowanych komponentów (`.tsx`) i strony (`.astro`) w odpowiednich katalogach (`/src/components`, `/src/pages`).
2.  **Implementacja `SessionGuard`:** Zaimplementowanie logiki sprawdzania sesji i przekierowania.
3.  **Stworzenie layoutu strony:** W pliku `/src/pages/app.astro` zintegrowanie `SessionGuard` i stworzenie dwukolumnowego układu dla listy i edytora.
4.  **Implementacja `useDiagrams` hook:** Stworzenie logiki do pobierania i zarządzania danymi listy diagramów, w tym obsługa parametrów API.
5.  **Implementacja komponentów listy:** Zbudowanie `DiagramsTable`, `FilterBar`, `SortableHeader` i `Pagination`, a następnie połączenie ich z hookiem `useDiagrams`.
6.  **Implementacja `useSudokuEditor` hook:** Stworzenie logiki do zarządzania stanem edytora, w tym walidacji i "dirty state".
7.  **Implementacja komponentów edytora:** Zbudowanie `SudokuEditor`, `SudokuTextarea`, `ValidationHints` i `PrimaryActions`.
8.  **Integracja API:** Podłączenie akcji (zapis, rozwiązanie, usunięcie) do odpowiednich endpointów API.
9.  **Obsługa interakcji:** Zaimplementowanie logiki interakcji między listą a edytorem (ładowanie diagramu po kliknięciu).
10. **Obsługa błędów i przypadków brzegowych:** Dodanie obsługi błędów (toasty) i przypadków brzegowych (pusta lista, limit diagramów).
11. **Styling:** Dopracowanie wyglądu za pomocą Tailwind CSS i komponentów Shadcn/ui, zgodnie z wytycznymi projektu.
12. **Testowanie:** Ręczne przetestowanie wszystkich historyjek użytkownika i kryteriów akceptacji.
