# Architektura UI dla SudokuSolver (MVP)

## 1. Przegląd struktury UI

Minimalistyczna aplikacja webowa z trzema głównymi widokami: **Rejestracja**, **Logowanie**, **Dashboard**. Dashboard łączy **listę zapisanych diagramów** i **edytor sudoku** (monospace textarea) z przyciskami **„Rozwiąż”** i **„Zapisz”**. Komunikacja z backendem odbywa się przez REST API (`/diagrams`), autoryzacja tokenem (JWT/Supabase). Walidacja inline w edytorze + toasty dla błędów globalnych. Całość projektowana jako prosta aplikacja wielostronicowa bez SPA (routing po stronie przeglądarki/przeładowania ograniczone do minimum – wynik „Rozwiąż” renderowany bez przeładowania).

---

## 2. Lista widoków

### Widok: Rejestracja

- **Ścieżka widoku:** `/register`
- **Główny cel:** Utworzenie nowego konta (email, pseudonim, hasło) oraz przejście do logowania.
- **Kluczowe informacje do wyświetlenia:**
  - Formularz: _E-mail_, _Pseudonim_, _Hasło_.
  - Link do logowania („Masz konto? Zaloguj się”).
  - Komunikaty walidacji (format e-mail, siła hasła).

- **Kluczowe komponenty widoku:**
  - `AuthForm` (tryb _register_)
  - `InlineFieldErrors`
  - `SubmitButton` (z blokadą i spinnerem)
  - `AuthToast` (błędy globalne)

- **UX, dostępność i względy bezpieczeństwa:**
  - Klawiaturowa nawigacja po polach; focus management po błędach.
  - Nie wyświetlać reguł tworzenia hasła wrażliwych dla ataków; zamiast tego ogólne wskazówki.
  - Maskowanie hasła, opcja „pokaż/ukryj”.
  - Po sukcesie przekierowanie do `/login`.

---

### Widok: Logowanie

- **Ścieżka widoku:** `/login`
- **Główny cel:** Uwierzytelnienie i przejście do dashboardu.
- **Kluczowe informacje do wyświetlenia:**
  - Formularz: _E-mail_, _Hasło_.
  - Link do rejestracji.
  - Komunikaty o błędnych danych logowania.

- **Kluczowe komponenty widoku:**
  - `AuthForm` (tryb _login_)
  - `InlineFieldErrors`
  - `SubmitButton` (z blokadą i spinnerem)
  - `AuthToast`

- **UX, dostępność i względy bezpieczeństwa:**
  - Zabezpieczenie przed ujawnieniem, czy e-mail istnieje (ogólny komunikat o błędzie).
  - Przechowywanie tokenu w `HttpOnly` cookie lub bezpiecznie w pamięci (zgodnie z integracją Supabase Auth).

---

### Widok: Dashboard (Lista + Edytor)

- **Ścieżka widoku:** `/app`
- **Główny cel:** Zarządzanie diagramami i praca na edytorze.
- **Kluczowe informacje do wyświetlenia:**
  - **Panel listy diagramów**:
    - Kolumny: _Nazwa_, _Utworzono_, _Zaktualizowano_, _Definicja (81 znaków)_, _Status rozwiązania (ikona)_.
    - Pasek filtrów po nazwie, sortowanie po kolumnach, paginacja (serwerowa).
    - Pusta lista → komunikat „Brak zapisanych diagramów”.

  - **Panel edytora sudoku**:
    - `textarea` monospace z licznikami wierszy/kolumn.
    - Placeholder z przykładem wejścia 9×9.
    - Walidacja inline (format, wiersze, kolumny, podsiatki 3×3).
    - Komunikaty globalne w toastach.

  - **Przyciski akcji**:
    - „Zapisz” (dezaktywowany przy limicie 100).
    - „Rozwiąż” (blokada + spinner podczas żądania).
    - „Edytuj”/„Usuń” w wierszach tabeli (z potwierdzeniem).

- **Kluczowe komponenty widoku:**
  - `SessionGuard` (sprawdzenie tokenu, przekierowanie do `/login` gdy brak)
  - `DiagramsTable` (sort, filter, pagination – po stronie serwera)
  - `FilterBar`, `PaginationControls`, `SortHeader`
  - `StatusBadge`/`SolutionIcon` (na bazie `solution != null`)
  - `SudokuTextarea` (monospace, liczniki, walidacja inline)
  - `ValidationHints` (np. „W wierszu 4 powtarza się 9”)
  - `PrimaryActions` (`SaveButton`, `SolveButton`)
  - `ConfirmDialog` (usuwanie; przeładowanie edytora przy stanie _dirty_)
  - `Toasts` (błędy globalne)
  - `EmptyState`

- **UX, dostępność i względy bezpieczeństwa:**
  - **Dirty state guard**: przy zmianie wyboru w tabeli lub opuszczaniu edytora — okno potwierdzenia.
  - Brak automatycznego przycinania — edytor wyświetla niezgodności i pomaga je poprawić.
  - Wynik „Rozwiąż” renderowany tabelarycznie 9×9 obok/poniżej edytora (czytelna siatka).
  - Ochrona akcji mutujących (Save/Delete/Solve) wymaga aktywnej sesji (token).
  - Ograniczenie do 100 pozycji: UI dezaktywuje „Zapisz” i informuje dlaczego.

---

## 3. Mapa podróży użytkownika

### Główne przepływy

**A. Rejestracja → Logowanie → Dashboard**

1. `/register` – użytkownik podaje e-mail, pseudonim, hasło → _Zarejestruj_.
2. Po sukcesie przekierowanie do `/login`.
3. `/login` – wprowadzenie danych → _Zaloguj_.
4. Po sukcesie przekierowanie do `/app` (Dashboard).

**B. Wprowadzenie i zapis nowego diagramu**

1. W Dashboardzie użytkownik w edytorze wkleja/ wpisuje 9×9 (cyfry/spacje).
2. Walidacja inline:
   - format (9 linii × 9 znaków),
   - konflikt wierszy/kolumn/podsiatek 3×3.

3. _Zapisz_ (aktywny, jeśli < 100 pozycji) → tworzy rekord; tabela się odświeża.

**C. Rozwiązywanie diagramu**

1. Użytkownik wybiera istniejący diagram lub zapisuje nowy.
2. Klik _Rozwiąż_ → przycisk blokowany + spinner.
3. Po sukcesie UI prezentuje **siatkę 9×9** z rozwiązaniem w tym samym widoku.
4. Przy braku rozwiązania: toast „Nie można rozwiązać diagramu”.

**D. Edycja istniejącego diagramu**

1. Klik wiersz w tabeli → ładuje definicję do edytora.
2. Zmiana treści → stan _dirty_.
3. _Zapisz_ nadpisuje definicję, tabela aktualizuje _Zaktualizowano_.

**E. Usuwanie diagramu**

1. Klik _Usuń_ w wierszu → `ConfirmDialog`.
2. Po potwierdzeniu element znika, paginacja/indeksacja aktualizuje się.

**F. Wylogowanie**

1. Akcja w nagłówku/stopce: _Wyloguj_ → usunięcie sesji, redirect do `/login`.

---

## 4. Układ i struktura nawigacji

- **Routing stron:**
  - `/register` ↔ `/login` (linki wzajemne).
  - `/login` → (po sukcesie) → `/app`.
  - `/app` chroniony przez `SessionGuard` (gdy brak/przeterminowany token → `/login`).

- **Nawigacja wewnątrz Dashboardu:**
  - Panel **Lista** po lewej/górze (w zależności od dostępnej szerokości) + Panel **Edytor** po prawej/poniżej.
  - Wiersz tabeli = akcja załadowania do edytora (z potwierdzeniem przy _dirty_).
  - Pasek filtrów nad tabelą; paginacja pod tabelą.
  - Brak przeładowań strony przy akcji _Rozwiąż_ — odświeżany jest tylko panel wyniku.

- **Stany specjalne:**
  - _Empty state_ listy (pierwsze uruchomienie).
  - _Disabled state_ dla „Zapisz” (limit 100).
  - _Loading state_ dla żądań API (spinner w przyciskach, opcjonalnie „loading overlay” dla listy).

---

## 5. Kluczowe komponenty

- **Autoryzacja i sesja**
  - `SessionGuard` – ochrona `/app`, odświeżanie/wylogowanie przy błędach 401/403.
  - `AuthForm` – wspólny formularz dla `/register` i `/login`.

- **Zarządzanie diagramami**
  - `DiagramsTable` – tabela z kolumnami (_Nazwa_, _Utworzono_, _Zaktualizowano_, _Definicja 81_, _Status_), akcje _Edytuj/Usuń_, sort/filter/pagination (parametry do API).
  - `FilterBar` – pole tekstowe do filtra po nazwie + reset.
  - `PaginationControls` – obsługa `page`, `limit`.

- **Edytor i walidacja**
  - `SudokuTextarea` – monospace, liczniki wierszy/kolumn, wskaźniki niezgodności bez przycinania.
  - `ValidationHints` – kontekstowe podpowiedzi/ostrzeżenia (format, duplikaty, 3×3).
  - `SolutionGrid` – render siatki 9×9 (tylko odczyt).
  - `PrimaryActions` – `SaveButton` (limit 100), `SolveButton` (blokada + spinner).

- **Informowanie i bezpieczeństwo**
  - `Toasts` – błędy globalne, sukcesy (standaryzowany format `{code,message,details[]}`).
  - `ConfirmDialog` – potwierdzenia: _Usuń_, przełączenie wiersza przy _dirty state_.
  - `ErrorBoundary` – awarie niekrytyczne w obrębie paneli.

---

### Mapowanie na API (zgodność interakcji)

- **Lista**: `GET /diagrams?page=&limit=&sortBy=&filter=` → render `DiagramsTable`.
- **Pobranie pojedynczego**: `GET /diagrams/{id}` → wczytanie do `SudokuTextarea`.
- **Utworzenie**: `POST /diagrams` (body: `{ name, definition }`) → odświeżenie listy; enforce limit 100 (400/422 → toast + disabled „Zapisz” przy >99).
- **Aktualizacja**: `PUT/PATCH /diagrams/{id}` → aktualizacja wiersza (kolumna „Zaktualizowano”).
- **Usunięcie**: `DELETE /diagrams/{id}` → aktualizacja listy/paginacji.
- **Rozwiązanie**: `POST /diagrams/{id}/solve` → render `SolutionGrid`; brak rozwiązania → toast „Nie można rozwiązać diagramu”.
- **Autoryzacja**: nagłówki `Authorization: Bearer <token>` dla operacji mutujących oraz listowania użytkownika.

---

### Przypadki brzegowe i stany błędów

- **Walidacja edytora**:
  - Format ≠ 9×9, znaki inne niż `1–9`/spacja → komunikat inline + dezaktywacja „Rozwiąż/Zapisz”.
  - Konflikty w wierszach/kolumnach/3×3 → komunikaty inline; „Zapisz” zablokowany do czasu poprawy (zgodnie z PRD).

- **Limit 100**:
  - Gdy `count === 100` → `SaveButton` disabled + tooltip/toast z informacją.
  - Serwer zwraca 400/422 przy próbie przekroczenia → toast zgodny z `{code,message,details[]}`.

- **Błędy sieci/serwera (5xx)** → globalny toast + opcja retry (np. przy `SolveButton`).
- **Sesja wygasła (401/403)** → `SessionGuard` wylogowuje i przenosi do `/login` z komunikatem.
- **Dirty state**:
  - Zmiana wyboru w tabeli lub próba opuszczenia `/app` → `ConfirmDialog`.

- **Pusta lista**:
  - `EmptyState` z krótką instrukcją wklejenia 9×9 i zapisania pierwszego diagramu.

---

### Mapowanie historyjek użytkownika (US-001 … US-010) → UI

- **US-001 Rejestracja** → `/register`, `AuthForm`, walidacja inline, redirect do `/login`.
- **US-002 Logowanie** → `/login`, `AuthForm`, obsługa błędnych danych, redirect do `/app`, `DiagramsTable` po zalogowaniu.
- **US-003 Wprowadzenie nowego diagramu** → `SudokuTextarea` (9×9, walidacja formatu), akcje „Zapisz”/„Rozwiąż”.
- **US-004 Walidacja** → `ValidationHints` (wiersze/kolumny/3×3), blokada zapisu przy błędach.
- **US-005 Rozwiązywanie** → `SolveButton` (spinner), `SolutionGrid` (9×9), toast „Nie można rozwiązać…” gdy brak rozwiązania.
- **US-006 Zapisywanie** → `SaveButton`, odświeżenie `DiagramsTable`, egzekwowanie limitu 100.
- **US-007 Edycja** → klik w wiersz → wczytanie do `SudokuTextarea`, zapis nadpisuje; `Dirty state` guard.
- **US-008 Usuwanie** → `ConfirmDialog` + `DELETE /diagrams/{id}`, aktualizacja tabeli.
- **US-009 Przeglądanie listy** → `DiagramsTable` z paginacją/sortem/filtrem; klik ładuje do edytora.
- **US-010 Wylogowanie** → akcja „Wyloguj” (nagłówek/stopka), powrót do `/login`.

---

### Mapowanie wymagań → elementy UI (wybór kluczowy)

| Wymaganie                              | Element UI                                         |
| -------------------------------------- | -------------------------------------------------- |
| Wprowadzanie 9×9 tekstowo              | `SudokuTextarea`, `ValidationHints`                |
| Walidacja format + wiersze/kolumny/3×3 | Inline błędy + blokady akcji                       |
| Rozwiązanie < 1s, bez przeładowania    | `SolveButton` (spinner) + `SolutionGrid`           |
| Lista z sort/filter/pagination         | `DiagramsTable`, `FilterBar`, `PaginationControls` |
| Limit 100                              | `SaveButton` disabled + toasty/tooltipy            |
| Edycja/Usuwanie                        | Akcje wierszy + `ConfirmDialog` + dirty guard      |
| Logowanie/Rejestracja                  | `AuthForm`, `SessionGuard`, przekierowania         |
| Ikona „ma rozwiązanie”                 | `SolutionIcon` (na podstawie `solution !== null`)  |
| Standaryzowane błędy                   | `Toasts` + `InlineFieldErrors`                     |

---

### Potencjalne punkty bólu i ich adresowanie

- **Błędy formatu i długie poprawki** → wyraźne _ValidationHints_, licznik wierszy/kolumn, monospace, brak automatycznego przycinania (pełna kontrola).
- **Niepewność, czy diagram ma rozwiązanie** → ikona statusu w tabeli + szybka akcja _Rozwiąż_.
- **Utrata pracy przy przełączaniu elementów** → _dirty state_ z potwierdzeniem.
- **Przeciążenie listą** → serwerowe sortowanie, filtr, paginacja; stan pusty z instrukcją.
- **Frustracja przy limitach** → natychmiastowe, czytelne wyjaśnienie dezaktywacji „Zapisz” i link/tooltip „Dlaczego?”.

---
