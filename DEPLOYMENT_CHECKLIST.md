# Checklist przed pierwszym deploymentem

## 1. Konfiguracja GitHub Secrets

### Repository Secrets (Settings → Secrets and variables → Actions → Repository secrets)

- [ ] **DIGITALOCEAN_ACCESS_TOKEN** - Token z DigitalOcean
  - Uzyskaj: https://cloud.digitalocean.com/account/api/tokens
  - Kliknij "Generate New Token"
  - Nazwa: `github-actions-deploy`
  - Uprawnienia: `read` i `write`
  
- [ ] **DIGITALOCEAN_APP_ID** - ID aplikacji z DigitalOcean App Platform
  - Najpierw utwórz aplikację w DigitalOcean (krok 2)
  - ID znajdziesz w URL: `https://cloud.digitalocean.com/apps/{APP_ID}`

- [ ] **SUPABASE_CONNECTION_STRING** - Connection string do PostgreSQL
  - Otwórz: Supabase Dashboard → Settings → Database
  - Skopiuj "Connection String" w formacie URI
  - Format: `postgresql://postgres:{PASSWORD}@db.xxxxx.supabase.co:5432/postgres`

- [ ] **JWT_SECRET** - Secret do weryfikacji JWT
  - Otwórz: Supabase Dashboard → Settings → API
  - Skopiuj "JWT Secret"

### Environment Secrets (Settings → Environments → production)

✅ Już skonfigurowane (potwierdzono):
- **PUBLIC_SUPABASE_URL**
- **PUBLIC_SUPABASE_KEY**

## 2. Utworzenie aplikacji w DigitalOcean

### Opcja A: Ręczne utworzenie przez Dashboard

1. [ ] Przejdź do: https://cloud.digitalocean.com/apps
2. [ ] Kliknij **"Create App"**
3. [ ] Wybierz **"Docker Hub or a container registry"**
4. [ ] Wybierz **"GitHub Container Registry (GHCR)"**
5. [ ] Konfiguracja:
   - **Registry URL:** `ghcr.io`
   - **Repository:** `michal-kozlik/sudoku-solver-frontend`
   - **Tag:** `latest`
6. [ ] Po utworzeniu, skopiuj **App ID** z URL
7. [ ] Dodaj **App ID** do GitHub Secrets jako `DIGITALOCEAN_APP_ID`

### Opcja B: Utworzenie przez CLI (zaawansowane)

```bash
# Zainstaluj doctl
# macOS
brew install doctl

# Windows (Chocolatey)
choco install doctl

# Linux
cd ~
wget https://github.com/digitalocean/doctl/releases/download/v1.98.1/doctl-1.98.1-linux-amd64.tar.gz
tar xf ~/doctl-1.98.1-linux-amd64.tar.gz
sudo mv ~/doctl /usr/local/bin

# Zaloguj się
doctl auth init

# Utwórz aplikację ze specyfikacji
doctl apps create --spec .do/app.yaml

# Pobierz App ID
doctl apps list
```

## 3. Konfiguracja sekretów w DigitalOcean

1. [ ] Przejdź do swojej aplikacji w DigitalOcean Dashboard
2. [ ] Settings → App-Level Environment Variables
3. [ ] Dodaj następujące zmienne (jako **encrypted**):
   - [ ] `PUBLIC_SUPABASE_URL` - URL Supabase
   - [ ] `PUBLIC_SUPABASE_KEY` - Anon key Supabase
   - [ ] `SUPABASE_CONNECTION_STRING` - Connection string PostgreSQL
   - [ ] `JWT_SECRET` - JWT secret z Supabase

## 4. Konfiguracja GHCR Access (GitHub Container Registry)

1. [ ] Przejdź do: https://github.com/settings/tokens
2. [ ] Generate new token (classic)
3. [ ] Zaznacz uprawnienia:
   - [ ] `read:packages`
   - [ ] `write:packages`
4. [ ] Skopiuj token
5. [ ] W DigitalOcean App Dashboard:
   - Settings → GitHub Container Registry
   - Username: `michal-kozlik`
   - Personal Access Token: [wklej token]

**LUB** ustaw pakiety jako publiczne:
1. [ ] Przejdź do: https://github.com/users/michal-kozlik/packages
2. [ ] Dla każdego pakietu (`sudoku-solver-frontend`, `sudoku-solver-backend`):
   - Package settings → Change visibility → Public

## 5. Weryfikacja konfiguracji backend

- [x] Endpoint `/health` został dodany do `backend/Program.cs`
- [ ] Backend buduje się poprawnie lokalnie:
  ```bash
  cd backend
  dotnet build
  dotnet test
  ```

## 6. Testowanie buildów Docker lokalnie

```bash
# Frontend
docker build -f Dockerfile.frontend -t test-frontend \
  --build-arg PUBLIC_SUPABASE_URL=your-url \
  --build-arg PUBLIC_SUPABASE_KEY=your-key \
  .

# Backend
docker build -f Dockerfile.backend -t test-backend .

# Test uruchomienia
docker run -p 8080:8080 test-frontend
docker run -p 8081:8080 test-backend
```

## 7. Pierwszy deployment

1. [ ] Upewnij się, że wszystkie sekrety są skonfigurowane
2. [ ] Commit wszystkie zmiany:
   ```bash
   git add .
   git commit -m "feat: add CI/CD pipeline for DigitalOcean deployment"
   git push origin master
   ```
3. [ ] Sprawdź GitHub Actions: https://github.com/michal-kozlik/10x-project/actions
4. [ ] Monitoruj deployment:
   - GitHub Actions - job "Deploy to DigitalOcean"
   - DigitalOcean Dashboard - zakładka "Activity"

## 8. Weryfikacja po deploymencie

- [ ] Sprawdź, czy obrazy zostały wypushowane do GHCR:
  - https://github.com/michal-kozlik?tab=packages
  
- [ ] Sprawdź logi w DigitalOcean:
  - Runtime logs - frontend
  - Runtime logs - backend
  
- [ ] Przetestuj aplikację:
  - [ ] Frontend jest dostępny pod URL aplikacji
  - [ ] Logowanie działa
  - [ ] Backend odpowiada na requesty

## 9. Troubleshooting

### Problem: Deployment Failed w GitHub Actions

- [ ] Sprawdź logi w Actions
- [ ] Zweryfikuj, czy wszystkie sekrety są ustawione
- [ ] Sprawdź składnię `.do/app.yaml`:
  ```bash
  doctl apps spec validate .do/app.yaml
  ```

### Problem: Images not found

- [ ] Upewnij się, że obrazy są publiczne lub DigitalOcean ma dostęp
- [ ] Sprawdź tagi obrazów w GHCR
- [ ] Zweryfikuj nazwy repozytoriów w `.do/app.yaml`

### Problem: Backend nie odpowiada

- [ ] Sprawdź logi backend w DigitalOcean
- [ ] Zweryfikuj connection string do Supabase
- [ ] Sprawdź, czy `/health` endpoint działa:
  ```bash
  curl https://your-app-url.ondigitalocean.app/api/health
  ```

### Problem: Frontend nie może połączyć się z backend

- [ ] Sprawdź zmienną `API_BASE_URL` w frontend env
- [ ] Zweryfikuj routing w `.do/app.yaml`
- [ ] Upewnij się, że backend service nazywa się `backend`

## 10. Następne kroki (opcjonalne)

- [ ] Skonfiguruj własną domenę w DigitalOcean
- [ ] Dodaj monitoring i alerty
- [ ] Skonfiguruj automatic backup
- [ ] Rozważ scaling (więcej instancji)
- [ ] Dodaj CDN dla statycznych assetów

---

## Użyteczne komendy

```bash
# Sprawdź status aplikacji
doctl apps list

# Sprawdź logi
doctl apps logs <APP_ID> --type run
doctl apps logs <APP_ID> --type build

# Sprawdź deployment
doctl apps list-deployments <APP_ID>

# Aktualizuj aplikację
doctl apps update <APP_ID> --spec .do/app.yaml
```

---

📚 **Pełna dokumentacja:** Zobacz `DEPLOYMENT.md` dla szczegółów
