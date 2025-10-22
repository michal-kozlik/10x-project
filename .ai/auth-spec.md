# Specyfikacja modułu autentykacji (US-001 Rejestracja, US-002 Logowanie, US-010 Odzyskiwanie hasła)

Data: 2025-10-22
Autor: zespół 10x
Zakres: Frontend (Astro 5 + React 19 + Tailwind 4 + shadcn/ui), Backend API (.NET 9), Supabase (Auth + Postgres)

## Założenia i zgodność z PRD

Na podstawie US-001, US-002 i US-010 w @.ai/prd.md oraz @.ai/tech-stack.md przyjmujemy następujące realistyczne założenia (doprecyzowanie – jeśli PRD różni się istotnie, spec należy skorygować):

- US-001 (Rejestracja): użytkownik rejestruje się przy użyciu e-mail + hasło; wymagane akceptowanie regulaminu; opcjonalna weryfikacja e-mail (rekomendowana – przez Supabase). Po rejestracji użytkownik jest zalogowany lub oczekuje na potwierdzenie e-mail (zależnie od konfiguracji).
- US-002 (Logowanie): użytkownik loguje się e-mailem i hasłem; sesja utrzymywana (persistent) w przeglądarce; opcja wylogowania.
- US-010 (Odzyskiwanie hasła): użytkownik może wysłać link resetu hasła na e-mail; po wejściu w link może ustawić nowe hasło.

Nienaruszalność istniejącego działania:
- `src/pages/index.astro` nadal przekierowuje do `/app`.
- `src/pages/app.astro` (dashboard) pozostaje stroną główną aplikacji, ale będzie zabezpieczona strażnikiem sesji (SessionGuard) bez ingerencji w logikę paneli (`DiagramsPanel`, `EditorPanel`).
- Obecny backend .NET (endpoints `/diagrams`, `/diagrams/{id}`, itp.) działa jak dotychczas – wprowadzamy jedynie możliwość weryfikacji żądającego użytkownika i docelowo filtrację po `user_id`.

## 1. Architektura interfejsu użytkownika

### 1.1 Nowe i modyfikowane strony/layouty/komponenty

- Nowe strony Astro w `src/pages`:
  - `src/pages/login.astro` – ekran logowania (React form wewnątrz). Dostępna dla niezalogowanych; zalogowanych przekierowuje do `/app`.
  - `src/pages/register.astro` – ekran rejestracji.
  - `src/pages/reset-password.astro` – ekran inicjacji resetu (wysyłka maila) oraz obsługi linku z Supabase (ustawienie nowego hasła) – jeden widok z rozgałęzieniem po parametrach URL.
  - (opcjonalnie) `src/pages/auth/callback.astro` – jeśli włączymy alternatywne przepływy (np. magic link, SSO) – jako strona pośrednia.

- Nowy layout dla stron auth (lekki, bez nawigacji z aplikacji):
  - `src/layouts/AuthLayout.astro` – analogiczny do `Layout.astro`, ale uproszczony (tytuł, kontener formularza, brak głównego UI). Zapewnia spójność stylów i dołącza `<Toaster />`.

- Modyfikacje istniejących:
  - `src/pages/app.astro` – już opakowana w `<SessionGuard client:load>`. Rozszerzamy SessionGuard, by realnie weryfikował sesję i przekierowywał na `/login`.
  - `src/layouts/Layout.astro` – bez zmian funkcjonalnych; spec zaleca usunięcie globalnego „window.supabase = …” w kodzie końcowym na rzecz kontrolowanego providera (patrz 3.1), ale to zmiana porządkowa – nie wpływa na publiczne API UI.

- Nowe komponenty React w `src/components/auth` (z shadcn/ui):
  - `LoginForm.tsx` – pola: email, password; link „Zapomniałeś hasła?” do `/reset-password`; przyciski: Zaloguj, (opcjonalnie) Zaloguj przez dostawcę X.
  - `RegisterForm.tsx` – email, password, checkbox „Akceptuję regulamin”; info o polityce haseł; przycisk „Utwórz konto”.
  - `RequestResetForm.tsx` – email do wysłania linku resetu.
  - `SetNewPasswordForm.tsx` – nowe hasło + potwierdzenie; wywoływane po kliknięciu linku z e-maila (parametry z URL/fragmentu).
  - `AuthProvider.tsx` (opcjonalnie) – jeśli zdecydujemy się na kontekst z buforowaniem stanu użytkownika po stronie klienta.

- Rozszerzenia istniejących komponentów:
  - `src/components/SessionGuard.tsx` – faktyczna kontrola sesji (Supabase Auth) i przekierowanie do `/login` jeśli brak sesji. Obsługa stanu ładowania, błędów, oraz „happy path” gdy sesja istnieje.
  - Komponenty UI (shadcn): użycie `input.tsx`, `button.tsx`, `card.tsx`, `alert-dialog.tsx` w formularzach auth.

### 1.2 Relacje między `@app.astro` a komponentami

- `app.astro` pozostaje rootem widoku aplikacji (Dashboard). Cała zawartość jest wnętrzem `SessionGuard`, który:
  - na `client:load` sprawdza bieżącą sesję przez Supabase Auth;
  - jeśli brak sesji → `window.location.assign('/login?next=/app')`;
  - jeśli sesja jest, renderuje dzieci: `DiagramsPanel` i `EditorPanel` bez zmian.
- Dzięki temu nie naruszamy istniejącej logiki tych paneli; jedynie zmieniamy „kto ma dostęp”.

### 1.3 Walidacje i komunikaty błędów (frontend)

- Formularze wykorzystują Zod do walidacji client-side przed wywołaniem Supabase:
  - Email: poprawny format (RFC krotko), max 320 znaków, wymagane.
  - Password: min. 8 znaków, zalecane: wielka/mała litera, cyfra, znak specjalny; max 128 znaków.
  - Password confirm: musi się zgadzać z password.
  - Accept terms: wymagane przy rejestracji.

- Mapowanie błędów Supabase na przyjazne komunikaty (PL):
  - Invalid login credentials → „Nieprawidłowy e-mail lub hasło.”
  - User already registered → „Konto z tym adresem e‑mail już istnieje.”
  - Email not confirmed (jeśli włączone) → „Potwierdź swój adres e‑mail, aby się zalogować.”
  - Rate limited → „Zbyt wiele prób. Spróbuj ponownie za chwilę.”
  - Network/unknown → „Wystąpił błąd połączenia. Spróbuj ponownie.”

- Wyświetlanie błędów:
  - Inline pod polem (field error) + toast globalny dla błędów ogólnych.
  - Stany przycisków: loading, disabled, retry.

### 1.4 Obsługa kluczowych scenariuszy

- Nowy użytkownik:
  - przechodzi do `/register`, wypełnia formularz; po sukcesie:
    - jeśli wymagana weryfikacja e‑mail → strona z komunikatem „Sprawdź skrzynkę” i link do `/login`.
    - jeśli weryfikacja niewymagana → automatyczne zalogowanie i przekierowanie do `next` lub `/app`.

- Logowanie:
  - `/login` przyjmuje param `next`. Po udanym logowaniu → redirect do `next` (domyślnie `/app`).
  - Jeśli użytkownik już jest zalogowany i wejdzie na `/login`/`/register` → natychmiastowy redirect do `/app`.

- Reset hasła:
  - `/reset-password` bez tokenu → widok „Podaj e‑mail, wyślemy link do resetu”.
  - `/reset-password#access_token=…` (Supabase dostarcza fragment/parametry) → widok „Ustaw nowe hasło”, po sukcesie redirect do `/login` z komunikatem.

- Wylogowanie:
  - akcja z menu użytkownika (docelowo w globalnym headerze – poza zakresem tej spec) lub endpoint `/api/auth/logout`; po sukcesie → redirect do `/login`.

## 2. Logika backendowa

### 2.1 Astro API – kontrakty i routing

Nowe/ujednolicone endpoints po stronie Astro (w `src/pages/api`), zgodne ze wskazówkami projektu:

- `GET /api/auth/session` – zwraca aktualnego użytkownika (wyciągniętego z Supabase po stronie serwera) lub `401`.
  - Response 200: `{ user: { id, email, ... }, expiresAt, roles? }`
  - Response 401: `{ code: "UNAUTHORIZED", message: "Brak sesji" }`

- `POST /api/auth/logout` – wylogowanie serwerowe (czyszczenie cookies przez Supabase server client) + 204.

- Istniejące `GET/POST/PUT/DELETE /api/diagrams` – pozostają jako proxy do .NET API (lub bezpośrednie wywołania jeżeli tak jest już zrobione). Zmiana: dołączanie nagłówka `Authorization: Bearer <access_token>` jeśli użytkownik zalogowany. Dla niezalogowanych (jeżeli endpointy są publiczne) – brak nagłówka.

Walidacja danych wejściowych w Astro:
- Użycie Zod w endpointach, które przyjmują body/query od UI (np. filtry listy, payloady tworzenia/edycji jeżeli przechodzą przez Astro). Błędy formatu: 400 `{ code: "VALIDATION_ERROR", message, details }`.

Obsługa wyjątków:
- Spójne mapowanie: 400 (walidacja), 401 (brak sesji), 403 (brak uprawnień), 404 (nie znaleziono), 409 (konflikt), 429 (limit), 500 (ogólne). Format jak wyżej.

### 2.2 .NET API – autoryzacja i identyfikacja użytkownika

Konfiguracja walidacji JWT (Supabase) po stronie .NET, aby endpointy mogły rozróżniać użytkowników:

- Dodanie w `Program.cs` uwierzytelniania JWT Bearer z kluczami JWKS Supabase:
  - JWKS: `https://<PROJECT_REF>.supabase.co/auth/v1/jwks`
  - Authority (audience) – zgodnie z dokumentacją Supabase; weryfikujemy `aud`, `iss`, daty (`nbf`, `exp`) i podpis.
- Po pozytywnej walidacji tokenu, `HttpContext.User` zawiera `sub` (UUID użytkownika Supabase). Mapujemy `userId = sub` i przekazujemy go do `DiagramService` zamiast stałej `"public"`.
- Po stronie endpointów zamieniamy TODO na wyciągnięcie `userId` z kontekstu:
  - Gdy brak tokenu lub niepoprawny → 401.
  - W fazie przejściowej można dopuścić brak tokenu dla części endpointów (np. listy publicznej), zgodnie z polityką produktu.

Obsługa wyjątków w .NET – już istnieje spójny wzorzec (Validation/Conflict/NotFound). Po dodaniu auth:
- Brak/niepoprawny token → `Results.Unauthorized()` (401) z ciałem `{ code: "UNAUTHORIZED", message }`.
- Niewystarczające uprawnienia (jeśli wprowadzimy role) → 403.

### 2.3 Warstwa danych i migracje

- Tabela `diagrams` (Supabase Postgres):
  - Dodaj kolumnę `user_id uuid NULL` (etap 1), indeks na `user_id`.
  - Etap 2: zaczynamy zapisywać `user_id = <sub>` z JWT przy operacjach modyfikujących.
  - Etap 3 (opcjonalny): ustawiamy NOT NULL i migrujemy stare rekordy do specjalnego `user_id` (np. techniczne konto „public”) albo zostawiamy tryb mieszany, jeżeli „publiczne” mają pozostać.

- Filtracja per użytkownik:
  - `ListAsync`, `GetByIdForUserAsync`, `UpdateAsync`, `DeleteAsync` – docelowo filtrują po `user_id` (w repozytorium C# są już parametry `userId`; należy dodać warunek w SQL).

- RLS (Row Level Security):
  - Jeśli backend łączy się przez connection string z serwisowym uprawnieniem i RLS nie obowiązuje, filtracja pozostaje w naszej logice.
  - Jeżeli zdecydujemy o włączeniu RLS i użyciu tokenów użytkownika kontra DB – projekt wymaga przeprojektowania i nie jest częścią tej iteracji.

## 3. System autentykacji (Supabase + Astro + .NET)

### 3.1 Frontend (Astro + React) – Supabase Auth

- Klient przeglądarkowy: `createBrowserClient` (supabase-js). Przechowuje i odświeża sesję w local storage/cookie (domyślnie). Subskrypcja `onAuthStateChange` do reagowania na logowanie/wylogowanie.
- Klient serwerowy: `createServerClient` w Astro middleware (`src/middleware/index.ts`), przekazuje `request`/`response` do zarządzania cookie HTTP-only. Ustawiamy `context.locals.supabase` oraz (dla wygody) `context.locals.user` na podstawie `getUser()`.
- `SessionGuard.tsx` (client):
  - na montażu: `supabase.auth.getSession()`;
  - stan: `loading`, `authenticated`, `unauthenticated`;
  - `unauthenticated` → redirect do `/login?next=${currentPath}`;
  - `authenticated` → `children`.

- Formularze:
  - `LoginForm`: `supabase.auth.signInWithPassword({ email, password })`.
  - `RegisterForm`: `supabase.auth.signUp({ email, password, options: { emailRedirectTo: '<origin>/reset-password' } })` (jeśli włączona weryfikacja e-mail/ustawianie hasła przez link).
  - `RequestResetForm`: `supabase.auth.resetPasswordForEmail(email, { redirectTo: '<origin>/reset-password' })`.
  - `SetNewPasswordForm`: po wejściu z linku Supabase użytkownik ma sesję tymczasową; użycie `supabase.auth.updateUser({ password: newPassword })`.

- Wylogowanie:
  - `supabase.auth.signOut()` po stronie klienta; opcjonalnie wywołanie `/api/auth/logout` aby zsynchronizować cookie po stronie serwera.

- Bezpieczeństwo UI:
  - Brak wyświetlania wrażliwych danych bez sprawdzenia sesji.
  - Brak przechowywania haseł – tylko przekazywanie do Supabase SDK.

### 3.2 Przekazywanie tożsamości do .NET

- Każde żądanie z UI do Astro `/api/diagrams…` powinno dodawać `Authorization: Bearer <access_token>` jeżeli użytkownik jest zalogowany (pobieramy z `supabase.auth.getSession()`).
- Astro API (proxy) przekazuje ten sam nagłówek do .NET.
- .NET waliduje token (JWKS) i wyznacza `userId = sub`.
- `DiagramService` używa `userId` do operacji na danych (docelowo z filtracją per użytkownik).

### 3.3 .NET – konfiguracja JWT (wysoki poziom)

- `builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
  .AddJwtBearer(options => { options.TokenValidationParameters = new TokenValidationParameters { ... jwks ... }; options.Events = new JwtBearerEvents { OnMessageReceived = ctx => {/* czytaj Authorization */} }; });`
- `app.UseAuthentication(); app.UseAuthorization();`
- Atrybuty/policies przy mapowaniu endpointów lub warunki ręczne:
  - Endpoints modyfikujące: wymagają `[Authorize]` i odczytu `User.FindFirst(ClaimTypes.NameIdentifier) ?? sub`.
  - Ewentualnie lista – publiczna (bez [Authorize]) w etapie 1.

## 4. Zmiany w strukturze projektu

- Frontend:
  - `src/components/auth/` – nowe komponenty formularzy oraz (opcjonalnie) `AuthProvider`.
  - `src/pages/login.astro`, `src/pages/register.astro`, `src/pages/reset-password.astro`.
  - `src/layouts/AuthLayout.astro`.
  - `src/lib/auth.ts` – pomocnicze funkcje (np. mapowanie błędów Supabase na komunikaty PL, prosty adapter do pobierania `access_token`).
  - `src/middleware/index.ts` – aktualizacja do serwerowego klienta Supabase (z request/response cookies) oraz ustawianie `locals.user`.

- Backend (.NET):
  - Konfiguracja JWT w `Program.cs`.
  - Aktualizacje `SupabaseDiagramRepository` – klauzule WHERE po `user_id`.
  - Migracja SQL (Supabase): dodanie `user_id uuid` + indeks.

- Astro API:
  - `src/pages/api/auth/session.ts` (GET), `src/pages/api/auth/logout.ts` (POST) – zgodnie z wytycznymi w README i lint.
  - Aktualizacje istniejących handlerów `/api/diagrams*` – pobieranie `access_token` z Supabase (serwerowo) i ustawianie w nagłówkach.

## 5. Walidacja, błędy i UX (kontrakty)

- Standardowy format błędu (frontend i backend):
  ```json
  { "code": "<UPPER_SNAKE>", "message": "<PL komunikat>", "details": <opcjonalnie obiekt> }
  ```

- Przykłady kodów:
  - `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`.

- Minimalne kontrakty formularzy:
  - Login: `{ email: string, password: string }` → 200 bez ciała (SDK ustawia sesję) lub 401 z błędem.
  - Register: `{ email: string, password: string, acceptTerms: boolean }` → 200/202; komunikat o weryfikacji jeśli włączona.
  - Reset-init: `{ email: string }` → 204 / 200 z komunikatem „Jeśli e‑mail istnieje, wysłaliśmy link”.
  - Reset-final: `{ newPassword, confirmPassword }` → 200 i redirect do `/login`.

## 6. Scenariusze brzegowe i niezawodność

- Wygasła sesja: UI wykrywa `getSession()` → brak sesji, redirect do `/login`. Na serwerze Astro endpoints zwracają 401.
- Wygasły link resetu: komunikat „Link wygasł. Poproś o nowy.” i powrót do formularza resetu.
- Sieć/offline: formularze pokazują stan „Spróbuj ponownie” i nie czyszczą pól.
- Wielokrotne kliknięcia: przyciski w stanie loading z blokadą.
- Ochrona przed CSRF: żądania do .NET są autoryzowane poprzez Bearer JWT z Supabase – brak ciastek sesyjnych do .NET.
- Logowanie w wielu kartach: subskrypcja `onAuthStateChange` odświeża stan w UI.

## 7. Fazowanie wdrożenia (bez przestojów)

1) UI/UX auth: dodać strony i komponenty; `SessionGuard` jeszcze w trybie „przepuszczającym” (feature flag).  
2) Middleware Astro z `createServerClient` + endpointy `/api/auth/*`.  
3) Dołączenie Bearer do wywołań `/api/diagrams*`; .NET nadal akceptuje brak tokenu.  
4) Migracja DB: `user_id` + indeksy; repozytorium zaczyna uzupełniać `user_id` przy operacjach modyfikujących (jeśli zalogowany).  
5) .NET: włączenie walidacji JWT; endpointy modyfikujące wymagają tokenu; lista może zostać publiczna lub przełączona na per‑user.  
6) `SessionGuard` wymusza logowanie na `/app` (włączenie flagi).  

## 8. Metryki i logging

- Frontend: loguj zdarzenia auth (udane/nieudane logowania, rejestracje, resety) w konsoli tylko w DEV; w PROD – przez system telemetryczny (poza zakresem).
- Backend .NET: logi 401/403/5xx z korelacją `userId` (jeśli dostępny) i `diagramId`/ścieżką.

## 9. Bezpieczeństwo i konfiguracja

- Przechowuj `SUPABASE_URL` i `SUPABASE_KEY` w zmiennych środowiskowych Astro. Na serwerze używaj `createServerClient` (nie service role w kliencie!).
- .NET nie potrzebuje kluczy Supabase – tylko adres JWKS. Buforuj klucze (np. w pamięci) i egzekwuj weryfikację `iss`, `aud`, `exp`.
- Wymuś HTTPS w PROD (już aktywne w .NET).

## 10. Mapowanie wymagań → pokrycie

- US-001 Rejestracja – strony `/register`, walidacje Zod, `supabase.auth.signUp`, e-mail verification (opcjonalna), przekierowania. Status: ujęte w spec.
- US-002 Logowanie – strona `/login`, `SessionGuard`, utrzymanie sesji, `supabase.auth.signInWithPassword`, wylogowanie. Status: ujęte w spec.
- US-010 Odzyskiwanie hasła – strona `/reset-password`, `resetPasswordForEmail`, `updateUser` po linku, obsługa wygaśnięcia. Status: ujęte w spec.

Zgodność z resztą aplikacji: brak zmian w wewnętrznej logice `DiagramsPanel`/`EditorPanel`; `app.astro` wciąż root dashboardu; endpoints .NET nie tracą dotychczasowej funkcjonalności – otrzymują jedynie możliwość identyfikacji użytkownika.

---

Załącznik: skrócone „kontrakty” techniczne

- `SessionGuard` (client):
  - Wejście: `children`.
  - Działanie: sprawdza `supabase.auth.getSession()`; redirect gdy brak sesji; renderuje dzieci gdy jest sesja.
  - Błędy: pokazuje komunikat i link do `/login` przy błędach krytycznych.

- Astro middleware:
  - Ustawia `locals.supabase` (server client) i `locals.user` (lub `null`).

- Astro `/api/auth/session`:
  - 200 `{ user, expiresAt }` | 401.

- .NET auth:
  - Wymusza poprawny Bearer; mapuje `sub` → `userId`.
  - Błędy 401/403 zwracane w ujednoliconym formacie.
