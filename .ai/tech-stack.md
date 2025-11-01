Frontend - Astro z React dla komponentów interaktywnych:

- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - .NET 9 daje solidne możliwości budowy API, a Supabase upraszcza operacje na bazie danych:

- .NET 9 daje solidne możliwości budowy API i oferuje solidne mechanizmy zabezpieczeń
- Supabase zapewnia bazę danych PostgreSQL, upraszcza operacje na niej i daje bezpieczny dostęp do danych
- Supabase posiada wbudowaną autentykację użytkowników
- .NET 9 jest skalowalne, a Supabase radzi sobie dobrze z rosnącym obciążeniem
- Supabase jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- .NET 9 można skonfigurować do współpracy z Supabase (np. poprzez klienckie biblioteki do PostgreSQL)
- Obecny wybór pozwala na wyraźny podział logiki frontend i backend, co daje lepsze możliwości rozwoju

Testing - Kompleksowe narzędzia do testowania:

- Vitest dla testów jednostkowych i integracyjnych komponentów React
- @testing-library/react i @testing-library/dom dla testowania komponentów UI
- MSW (Mock Service Worker) do mockowania żądań sieciowych i Supabase
- Playwright do testów E2E z możliwością nagrywania trace, wideo i zrzutów ekranu
- axe-core do automatycznych testów dostępności (a11y)
- k6/Artillery do testów wydajnościowych API
- Lighthouse do analizy metryk wydajności UI
- c8/istanbul do mierzenia pokrycia kodu testami

CI/CD i Hosting:

- Github Actions do tworzenia pipeline'ów CI/CD i automatyzacji testów
- DigitalOcean do hostowania aplikacji za pośrednictwem obrazu docker
