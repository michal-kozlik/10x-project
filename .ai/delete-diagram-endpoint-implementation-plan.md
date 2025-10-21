# API Endpoint Implementation Plan: Delete Diagram

## 1. Przegląd punktu końcowego
Endpoint służy do usuwania diagramu sudoku na podstawie podanego identyfikatora. Po pomyślnym usunięciu zwracany jest komunikat potwierdzający działanie operacji.

## 2. Szczegóły żądania
- **Metoda HTTP:** DELETE
- **Struktura URL:** `/diagrams/{id}`
- **Parametry URL:**
  - `id` (number, wymagany): Unikalny identyfikator diagramu
- **Request Body:** Brak

## 3. Wykorzystywane typy
- **Command Model:**
  - Model komendy do operacji usunięcia, ew. `DeleteDiagramCommand` zawierający pole `id` oraz informacje o użytkowniku (np. `user_id`) jeśli będzie wymagana autoryzacja.

## 4. Szczegóły odpowiedzi
- **Kod 200 OK:** Diagram został usunięty pomyślnie
  - Payload: `{ "message": "Diagram został usunięty." }`
- **Kod 404 Not Found:** Diagram o podanym identyfikatorze nie został znaleziony
- **Kod 500 Internal Server Error:** Wystąpił błąd po stronie serwera
- (Opcjonalnie) **Kod 401 Unauthorized:** Dostęp nieautoryzowany, jeśli użytkownik nie spełnia wymogów autoryzacji

## 5. Przepływ danych
1. Odbiór żądania DELETE na endpoint `/diagrams/{id}`.
2. Walidacja parametru `id` (czy jest liczbą, oraz czy spełnia warunki brzegowe).
3. Autoryzacja: Sprawdzenie, czy użytkownik jest zalogowany i ma prawo do usunięcia diagramu (np. poprzez weryfikację `user_id` powiązanego w tabeli `diagrams`).
4. Wywołanie warstwy serwisowej odpowiedzialnej za usuwanie diagramu.
5. Warstwa serwisowa komunikuje się z bazą danych, wykonując operację DELETE na tabeli `diagrams`.
6. Na podstawie wyniku operacji, zwrot odpowiedniego statusu oraz komunikatu.

## 6. Względy bezpieczeństwa
- **Autoryzacja:** Upewnić się, że użytkownik jest zalogowany (Supabase Auth) oraz sprawdzić, czy diagram należy do niego przed usunięciem.
- **Walidacja:** Sprawdzić poprawność parametru `id`, aby zapobiec atakom typu SQL Injection lub nieprawidłowym operacjom.
- **Ochrona danych:** Upewnić się, że operacja usunięcia przestrzega reguł ON DELETE CASCADE na kluczach obcych.

## 7. Obsługa błędów
- **Brak diagramu:** Zwrócić 404, jeśli diagram o podanym identyfikatorze nie istnieje.
- **Błąd walidacji:** Zwrócić 400 dla nieprawidłowych danych wejściowych.
- **Błąd serwera:** Zwrócić 500 w przypadku problemów wewnętrznych lub niespodziewanych wyjątków.
- (Opcjonalnie) **Błąd autoryzacji:** Zwrócić 401, jeśli użytkownik nie jest uprawniony do usunięcia danego diagramu.

## 8. Rozważania dotyczące wydajności
- Indeksacja kolumny `id` w tabeli `diagrams` zapewniająca szybki dostęp.
- Logika usuwania powinna być zoptymalizowana, aby nie wpływała negatywnie na ogólną wydajność bazy danych.

## 9. Etapy wdrożenia
1. **Implementacja walidacji:** Sprawdzić, czy `id` jest przekazane i czy jest liczbą.
2. **Autoryzacja:** Dodać logikę weryfikującą, czy użytkownik jest uprawniony do usunięcia danego diagramu.
3. **Implementacja logiki serwisowej:** Utworzyć lub rozszerzyć istniejący serwis o metodę do usunięcia diagramu z bazy danych.
4. **Obsługa błędów:** Implementować odpowiednie wyjątki i mechanizmy ich przechwytywania, zwracając przy tym właściwe kody statusu.
5. **Testy jednostkowe i integracyjne:** Przetestować wszystkie scenariusze, w tym scenariusze błędne (Diagram nie istnieje, brak uprawnień, nieprawidłowe dane wejściowe, itp.).
6. **Dokumentacja:** Zaktualizować dokumentację API endpointów i schematy bazy danych.
7. **Przegląd kodu:** Upewnić się, że implementacja spełnia zasady bezpieczeństwa i wydajności oraz jest zgodna z regułami implementacji.
8. **Deploy:** Wdrożyć zmiany na środowisku testowym a następnie produkcyjnym.
