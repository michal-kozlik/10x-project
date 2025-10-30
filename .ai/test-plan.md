1. Wprowadzenie i cele testowania
   - Celem jest potwierdzenie jakości funkcjonalnej i niefunkcjonalnej aplikacji opartej na Astro 5, TypeScript 5, React 19, Tailwind 4, shadcn/ui oraz Supabase (auth/DB).
   - Weryfikacja krytycznych przepływów: autoryzacja, reset/zmiana hasła (POST /api/auth/set-new-password), renderowanie i interakcje UI, poprawne kody statusu oraz komunikaty w języku polskim.
   - Zapobieganie regresjom poprzez automatyzację testów i monitoring jakości w CI.

2. Zakres testów
   - Backend (Astro API): walidacja wejścia (Zod), kontrola sesji (Supabase auth.getSession), aktualizacja hasła (auth.updateUser), poprawność statusów i nagłówków (Content-Type: application/json).
   - Frontend (Astro/React): formularze auth/reset hasła, walidacja klienta, zarządzanie stanem i błędami, dostępność (a11y), i18n (PL), nawigacja i zachowanie UI.
   - Integracje: Supabase (sesja i operacje na użytkowniku), obsługa cookies/nagłówków, konfiguracja środowisk (import.meta.env).
   - Niefunkcjonalne: wydajność API/UI, bezpieczeństwo (OWASP dla auth), zgodność przeglądarek i responsywność.

3. Typy testów do przeprowadzenia
   - Jednostkowe: schematy Zod (reguły hasła: min 8, mała/duża litera i cyfra), funkcje pomocnicze, logika komponentów React w izolacji.
   - Integracyjne (API): wywołania Astro POST/GET z mockowanym Supabase, asercje na statusy, treść JSON, nagłówki, błędy.
   - E2E (przeglądarkowe): pełny przepływ resetu hasła z linkiem odzyskiwania, logowanie/wylogowanie, błędy sesji.
   - Kontraktowe: stabilność schematów odpowiedzi (JSON Schema) i komunikatów błędów.
   - Bezpieczeństwa: podstawowe skany (nagłówki, brak wycieku danych w odpowiedziach/logach), weryfikacja polityk sesji.
   - Wydajnościowe: czas odpowiedzi endpointów (p95/p99), smoke perf po wdrożeniu.
   - A11y i wizualne: automatyczne testy dostępności (axe) i regresji wizualnej dla kluczowych widoków.

4. Scenariusze testowe dla kluczowych funkcjonalności
   - POST /api/auth/set-new-password:
     - 200: ważna sesja, hasło spełnia reguły; JSON z message="Hasło zostało pomyślnie zmienione", nagłówek Content-Type.
     - 400: nieudana walidacja Zod (za krótkie/bez złożoności); error="Hasło nie spełnia wymagań bezpieczeństwa".
     - 401: brak lub błąd sesji; error="Brak autoryzacji. Link mógł wygasnąć.".
     - 400: błąd Supabase updateUser → zwrócony message z błędu w polu error.
     - 500: nieparsowalny JSON/nieoczekiwany wyjątek; error="Wystąpił nieoczekiwany błąd".
   - UI reset/zmiany hasła:
     - Walidacja klienta spójna z backendem (PL komunikaty), blokada submitu do spełnienia reguł.
     - Stany: loading, sukces (informacja zwrotna), obsługa błędów 400/401/500.
     - A11y: aria-invalid/aria-describedby, focus management, nawigacja klawiaturą.
   - Przepływy auth:
     - Wejście z linku odzyskiwania tworzy sesję; brak sesji → informacja i CTA ponownej prośby o link.
     - Po zmianie hasła: oczekiwane zachowanie sesji (relog/odświeżenie), brak ujawniania PII.

    - Diagramy Sudoku (MVP):
       - Wprowadzenie diagramu (US-003):
          - UI: pole tekstowe przyjmuje dokładnie siatkę 9×9 (cyfry 1–9 lub spacje/puste). Przekroczenie formatu (za dużo/za mało znaków, inne znaki) → komunikat „Nieprawidłowy format – wprowadź 9 wierszy po 9 znaków”.
          - Backend (.NET): nieprawidłowy input → 400 z kodem walidacji i czytelnym komunikatem; prawidłowy input przechodzi dalej.
       - Walidacja układu (US-004):
          - Duplikaty w wierszu/kolumnie/bloku 3×3 w predefiniowanych polach → blokada zapisu/rozwiązania; komunikat np. „W wierszu 4 powtarza się cyfra 9”.
          - UI nie pozwala zapisać błędnego diagramu; błąd widoczny w obrębie formularza (PL), focus na komunikacie.
       - Rozwiązywanie (US-005):
          - Wywołanie backendowego endpointu rozwiązywania dla istniejącego diagramu → < 1 s (p95) otrzymujemy 81-znakowy string rozwiązania (1–9), bez przeładowania strony; rozwiązanie jest prezentowane w widoku „rozwiązanie”.
          - Diagram nierozwiązywalny → status 400/422, komunikat „Nie można rozwiązać diagramu”; UI pokazuje błąd bez przeładowania.
          - Błędny identyfikator (id ≤ 0 lub brak) → 400 z komunikatem walidacyjnym.
       - Zapisywanie (US-006):
          - POST /diagrams: 200/201 z obiektem {id, name, definition, solution: null, created_at}; UI dodaje rekord do listy bez odświeżania strony i pokazuje potwierdzenie.
          - Limit 100 diagramów na użytkownika: przy próbie utworzenia 101. → 409/403 i komunikat „Przekroczono limit 100 diagramów na użytkownika”.
          - Brak definition lub za długi payload (>10000 znaków) → 400 z komunikatem walidacyjnym.
       - Edycja (US-007):
          - PUT /diagrams/{id}: 200 z uaktualnionym rekordem; pole solution resetowane do null; UI aktualizuje listę i pole edycji.
          - Brak rekordu → 404 „Diagram nie istnieje”. Błędny format/układ → 400 z komunikatem jak przy tworzeniu.
       - Usuwanie (US-008):
          - DELETE /diagrams/{id}: 200 z message „Diagram został usunięty.” po potwierdzeniu w UI; element znika z listy bez przeładowania.
          - Brak rekordu → 404; brak uprawnień (gdy auth zostanie włączone) → 403.
       - Lista i wczytanie do edycji (US-009):
          - GET /diagrams: 200 z tablicą rekordów {id, name, created_at, definition?, solution?} oraz metadanymi paginacji; sortowanie po created_at/name/id i filtrowanie po name działają w granicach walidacji zapytań.
          - Kliknięcie wiersza na liście ładuje diagram do pola tekstowego; nazwa i daty są widoczne.
       - Doświadczenie UI (łączone):
          - Operacje „Zapisz” i „Rozwiąż” aktualizują interfejs bez przeładowania całej strony (SPA-like w obrębie komponentu) i pokazują czytelne komunikaty PL.
          - Błędy sieci/500 → ogólny komunikat „Wystąpił nieoczekiwany błąd” z możliwością ponowienia.

5. Środowisko testowe
   - Node.js 20 LTS (Windows 10/11), pnpm/npm, VS Code.
   - Oddzielne zmienne środowiskowe dla testów (import.meta.env), osobny projekt Supabase test lub pełne mocki w testach automatycznych.
   - Przeglądarki Playwright: Chromium, Firefox, WebKit; viewporty mobile/desktop.
   - Dane testowe: konta użytkowników testowych, polityka czyszczenia/seed po testach.

6. Narzędzia do testowania
   - Jednostkowe/integracyjne: Vitest, @testing-library/react, @testing-library/dom, MSW do mockowania sieci/Supabase.
   - E2E: Playwright (trace, video, screenshot), axe-core dla a11y.
   - Wydajność: k6 lub Artillery dla API; Lighthouse dla metryk UI.
   - Jakość: ESLint, TypeScript --noEmit, pokrycie c8/istanbul, Prettier.
   - CI/CD: GitHub Actions (matryca Node 20, cache, artefakty E2E).

7. Harmonogram testów
   - Na każdy PR: lint + testy jednostkowe/integracyjne + szybki zestaw E2E smoke (auth/reset).
   - Dziennie: pełny pakiet integracyjny API, a11y automatyczne, zrzuty wizualne.
   - Tygodniowo: regresja E2E, podstawowe testy wydajności, skan bezpieczeństwa.
   - Przed wydaniem: komplet E2E, testy kontraktowe API, perf p95/p99, sanity security.
   - Po wydaniu: monitoringi syntetyczne kluczowych endpointów/stron.

8. Kryteria akceptacji testów
   - 100% zielonych testów w ścieżkach krytycznych (auth/reset), brak defektów Severity Critical/Major otwartych.
   - Pokrycie min. 80% linii/gałęzi w src/pages/api oraz kluczowych komponentach UI.
   - API: stabilne statusy i komunikaty PL; nagłówki Content-Type obecne dla odpowiedzi JSON.
   - Wydajność: p95 < 300 ms dla POST /api/auth/set-new-password w środowisku test.
   - A11y: brak błędów axe „serious/critical” na krytycznych widokach.

9. Role i odpowiedzialności
   - QA: definicja strategii i scenariuszy, automatyzacja E2E/integracja, analiza defektów, metryki jakości.
   - Dev: testy jednostkowe/integracyjne, utrzymanie mocków Supabase, szybka naprawa regresji.
   - DevOps: konfiguracja CI/CD, tajemnice środowisk, artefakty i monitoringi.
   - PO/PM: priorytetyzacja, akceptacja releasów, decyzje go/no-go.

10. Procedury raportowania błędów
   - Zgłoszenie (GitHub Issues): tytuł, wersja/commit, środowisko, kroki odtworzenia, oczekiwane vs rzeczywiste, logi/trace/screenshoty/video.
   - Klasyfikacja: Severity (Blocker/Critical/Major/Minor), Priority (P0–P3), komponent (API/UI/Auth/Supabase).
   - Triage w 24h, przypisanie, SLA naprawy wg Priority, weryfikacja fixu przez QA (retasty + regresja).
   - Wymagane artefakty: Playwright trace/video, zrzuty błędów, payload/odpowiedź API (bez wrażliwych danych).
   - Retrospekcja: opis przyczyny źródłowej, aktualizacja testów/monitoringu, zapobieganie ponownym wystąpieniom.