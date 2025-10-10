```markdown
# Dokument wymagań produktu (PRD) - SudokuSolver (MVP)

## 1. Przegląd produktu

SudokuSolver to webowa aplikacja umożliwiająca użytkownikom wprowadzanie, zapisywanie, edytowanie oraz rozwiązywanie diagramów sudoku w prostej formie tekstowej. Produkt ma pomóc osobom, które chcą szybko i bezbłędnie rozwiązywać łamigłówki sudoku bez potrzeby ręcznego analizowania układu.

Aplikacja w wersji MVP zostanie zrealizowana jako aplikacja webowa z backendem opartym o .NET 9 (C#). Rozwiązywanie sudoku odbywa się po stronie serwera, a interfejs użytkownika jest minimalistyczny i skoncentrowany na prostocie użytkowania.

## 2. Problem użytkownika

Rozwiązywanie sudoku może być dla wielu użytkowników czasochłonne i trudne, zwłaszcza gdy łamigłówki są bardziej złożone. Wprowadzenie cyfrowego narzędzia, które automatycznie rozwiązuje sudoku, pozwoli zaoszczędzić czas i zapewni satysfakcję z szybkiego uzyskania poprawnego wyniku. Dodatkowo, użytkownicy chcą móc przechowywać własne diagramy oraz mieć łatwy dostęp do ich edycji i usuwania.

Kluczowe potrzeby użytkownika:
- możliwość wprowadzenia własnego sudoku w prosty sposób (tekstowo),
- szybkie uzyskanie rozwiązania,
- przechowywanie i zarządzanie własnymi diagramami,
- prosty system logowania i bezpieczny dostęp do konta.

## 3. Wymagania funkcjonalne

### 3.1. Funkcje podstawowe
1. Rejestracja i logowanie użytkowników za pomocą e-maila i hasła.
2. Wprowadzanie diagramu sudoku w formacie 9x9 w polu tekstowym (cyfry 1–9, spacje jako puste pola).
3. Walidacja wprowadzonego diagramu (poprawność formatu, brak powtórzeń w wierszach i kolumnach).
4. Rozwiązywanie sudoku po stronie serwera (.NET 9) w czasie rzeczywistym (czas odpowiedzi < 1 sekundy).
5. Zapisywanie diagramów sudoku w bazie danych.
6. Przeglądanie listy zapisanych diagramów.
7. Edycja i usuwanie zapisanych diagramów.
8. Ograniczenie do maksymalnie 100 diagramów na użytkownika.
9. Wyświetlanie wyników rozwiązania bez przeładowania strony.
10. Minimalistyczny interfejs z jednym ekranem głównym zawierającym:
    - listę zapisanych diagramów,
    - pole tekstowe do wprowadzania sudoku,
    - przyciski „Rozwiąż” i „Zapisz”.

### 3.2. Walidacja i błędy
- Format wejściowy: 9 linii po 9 znaków (cyfry 1–9 lub spacje).
- Błędy formatowania (np. za dużo linii, nieprawidłowe znaki) zgłaszane w komunikatach użytkownika.
- Walidacja poprawności układu (brak duplikatów w wierszach i kolumnach).
- Komunikaty o błędach w formacie tekstowym, np. „Nieprawidłowy format – wprowadź 9 wierszy po 9 znaków”.

### 3.3. Techniczne wymagania
- Backend: .NET 9 (C#)
- Frontend: prosty interfejs HTML/CSS/JS (bez frameworków SPA)
- Baza danych: TBD (decyzja otwarta – relacyjna lub dokumentowa)
- Hosting: do ustalenia (brak decyzji o środowisku wdrożeniowym)
- Testy: minimalny zestaw testów jednostkowych logiki backendu

## 4. Granice produktu

### 4.1. Zakres MVP
- Webowa aplikacja (brak wersji mobilnej).
- Logowanie i przechowywanie danych użytkowników (e-mail + pseudonim).
- Wprowadzanie sudoku w postaci tekstowej.
- Rozwiązywanie sudoku po stronie serwera.
- Zarządzanie zapisanymi diagramami (dodawanie, edycja, usuwanie, przeglądanie).
- Limit diagramów: 100 na użytkownika.

### 4.2. Poza zakresem MVP
- Import diagramów ze zdjęć lub innych formatów.
- Współdzielenie diagramów między użytkownikami.
- System rankingowy, punkty, gamifikacja.
- Historia zmian diagramów.
- Eksport wyników lub diagramów.
- Interaktywny grid (planowany w późniejszej wersji).
- OCR i rozpoznawanie diagramów (planowane w przyszłości).
- Aplikacje mobilne.

### 4.3. Nierozwiązane kwestie
1. Brak decyzji o strukturze bazy danych.
2. Brak projektu interfejsu (wireframe/makiety).
3. Nieustalony zakres testów jednostkowych i framework testowy.
4. Nieokreślone środowisko wdrożeniowe i CI/CD.
5. Nieustalone, w jakim formacie (tekstowym czy tabelarycznym) backend zwraca wynik.

## 5. Historyjki użytkowników

### US-001
**Tytuł:** Rejestracja użytkownika  
**Opis:** Jako nowy użytkownik chcę móc zarejestrować się w aplikacji, aby przechowywać własne diagramy sudoku.  
**Kryteria akceptacji:**
- Użytkownik wprowadza e-mail, pseudonim i hasło.
- System waliduje poprawność e-maila i siłę hasła.
- Po rejestracji użytkownik może się zalogować.

### US-002
**Tytuł:** Logowanie użytkownika  
**Opis:** Jako zarejestrowany użytkownik chcę się zalogować przy użyciu e-maila i hasła, aby uzyskać dostęp do moich diagramów.  
**Kryteria akceptacji:**
- Logowanie działa tylko z poprawnym e-mailem i hasłem.
- W przypadku błędnych danych system zwraca komunikat o błędzie.
- Po zalogowaniu wyświetlana jest lista zapisanych diagramów.

### US-003
**Tytuł:** Wprowadzenie nowego diagramu sudoku  
**Opis:** Jako użytkownik chcę móc wprowadzić sudoku w formacie tekstowym 9x9, aby móc je rozwiązać.  
**Kryteria akceptacji:**
- Formularz akceptuje tylko 9 wierszy po 9 znaków (cyfry lub spacje).
- Nieprawidłowy format powoduje komunikat błędu.
- Diagram można zapisać lub rozwiązać.

### US-004
**Tytuł:** Walidacja diagramu sudoku  
**Opis:** Jako użytkownik chcę, aby aplikacja sprawdziła poprawność wprowadzonego sudoku, zanim zostanie zapisane lub rozwiązane.  
**Kryteria akceptacji:**
- Walidacja sprawdza brak powtórzeń w wierszach i kolumnach.
- W przypadku błędów wyświetlany jest komunikat, np. „W wierszu 4 (  9    9 ) powtarza się cyfra 9”.
- Użytkownik nie może zapisać błędnego diagramu.

### US-005
**Tytuł:** Rozwiązywanie sudoku  
**Opis:** Jako użytkownik chcę kliknąć przycisk „Rozwiąż”, aby uzyskać rozwiązanie mojego sudoku.  
**Kryteria akceptacji:**
- System rozwiązuje sudoku po stronie serwera w czasie <1 sekundy.
- Wynik jest wyświetlany na tej samej stronie.
- W przypadku nieistnienia rozwiązania zwracany jest komunikat „Nie można rozwiązać diagramu”.

### US-006
**Tytuł:** Zapisywanie diagramu sudoku  
**Opis:** Jako zalogowany użytkownik chcę zapisać wprowadzony diagram, aby móc do niego wrócić później.  
**Kryteria akceptacji:**
- Diagram jest zapisywany po kliknięciu „Zapisz”.
- Widoczny jest w liście zapisanych diagramów.
- System nie pozwala na przekroczenie limitu 100 diagramów.

### US-007
**Tytuł:** Edycja diagramu sudoku  
**Opis:** Jako użytkownik chcę móc edytować zapisany diagram sudoku, aby poprawić błędy lub zmienić układ.  
**Kryteria akceptacji:**
- Po kliknięciu „Edytuj” diagram wczytuje się do pola tekstowego.
- Użytkownik może zmienić treść i ponownie zapisać.

### US-008
**Tytuł:** Usuwanie diagramu sudoku  
**Opis:** Jako użytkownik chcę móc usuwać zapisane diagramy, aby zachować porządek w mojej liście.  
**Kryteria akceptacji:**
- Po kliknięciu „Usuń” system pyta o potwierdzenie.
- Diagram znika z listy po usunięciu.

### US-009
**Tytuł:** Przeglądanie listy zapisanych diagramów  
**Opis:** Jako użytkownik chcę widzieć listę wszystkich zapisanych diagramów, aby łatwo do nich wracać.  
**Kryteria akceptacji:**
- Lista zawiera wszystkie zapisane diagramy danego użytkownika.
- Widoczne są podstawowe informacje (np. data dodania, nazwa).
- Kliknięcie pozycji ładuje diagram do pola tekstowego.

### US-010
**Tytuł:** Wylogowanie użytkownika  
**Opis:** Jako użytkownik chcę móc się wylogować, aby chronić moje dane.  
**Kryteria akceptacji:**
- Po kliknięciu „Wyloguj” sesja zostaje zakończona.
- Użytkownik zostaje przekierowany na stronę logowania.

## 6. Metryki sukcesu

1. W bazie danych znajduje się co najmniej 20 poprawnych diagramów sudoku.
2. Czas odpowiedzi dla funkcji „Rozwiąż” jest krótszy niż 1 sekunda.
3. Brak krytycznych błędów walidacji lub awarii aplikacji.
4. 100% zapisanych diagramów jest poprawnie walidowanych.

```
