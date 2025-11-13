# Quick Reference - Deployment Commands

## GitHub Actions

### Trigger Manual Deployment
```bash
# Via GitHub CLI
gh workflow run master-docker.yml

# Via GitHub Web UI
# Go to: Actions → Master Docker - Build & Deploy → Run workflow
```

### Check Workflow Status
```bash
gh run list --workflow=master-docker.yml
gh run view {RUN_ID}
```

## DigitalOcean App Platform (doctl)

### Prerequisites
```bash
# Install doctl
brew install doctl  # macOS
choco install doctl # Windows

# Authenticate
doctl auth init
```

### App Management
```bash
# List all apps
doctl apps list

# Get app details
doctl apps get {APP_ID}

# Create app from spec
doctl apps create --spec .do/app.yaml

# Update app with new spec
doctl apps update {APP_ID} --spec .do/app.yaml

# Delete app
doctl apps delete {APP_ID}
```

### Deployment Management
```bash
# List deployments
doctl apps list-deployments {APP_ID}

# Get deployment details
doctl apps get-deployment {APP_ID} {DEPLOYMENT_ID}

# Get latest deployment
doctl apps list-deployments {APP_ID} --format ID --no-header | head -n 1
```

### Logs
```bash
# Tail runtime logs (all services)
doctl apps logs {APP_ID} --type run --follow

# Frontend logs only
doctl apps logs {APP_ID} --type run --component frontend --follow

# Backend logs only
doctl apps logs {APP_ID} --type run --component backend --follow

# Build logs
doctl apps logs {APP_ID} --type build

# Deploy logs
doctl apps logs {APP_ID} --type deploy
```

### App Spec
```bash
# Get current app spec
doctl apps spec get {APP_ID}

# Validate app spec
doctl apps spec validate .do/app.yaml

# Get app spec as YAML
doctl apps spec get {APP_ID} --format yaml > current-spec.yaml
```

## Docker & GitHub Container Registry

### Local Build & Test
```bash
# Build frontend image
docker build -f Dockerfile.frontend -t test-frontend \
  --build-arg PUBLIC_SUPABASE_URL={URL} \
  --build-arg PUBLIC_SUPABASE_KEY={KEY} \
  .

# Build backend image
docker build -f Dockerfile.backend -t test-backend .

# Run frontend
docker run -p 8080:8080 \
  -e BACKEND_URL=http://localhost:5149 \
  test-frontend

# Run backend
docker run -p 5149:8080 \
  -e SUPABASE_CONNECTION_STRING={CONN_STRING} \
  -e Jwt__Secret={JWT_SECRET} \
  test-backend
```

### GHCR Management
```bash
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull images
docker pull ghcr.io/michal-kozlik/sudoku-solver-frontend:latest
docker pull ghcr.io/michal-kozlik/sudoku-solver-backend:latest

# List packages
gh api user/packages?package_type=container

# Delete old package versions (via GitHub web UI)
# Go to: Profile → Packages → {package} → Package settings
```

## Git & GitHub

### Secrets Management
```bash
# List secrets
gh secret list

# Set secret
gh secret set SECRET_NAME

# Delete secret
gh secret delete SECRET_NAME
```

### Environment Management
```bash
# List environments
gh api repos/{OWNER}/{REPO}/environments | jq '.environments[].name'

# Create environment
gh api -X PUT repos/{OWNER}/{REPO}/environments/production
```

## Supabase

### Get Configuration Values
```bash
# Dashboard URLs
# Project URL: https://supabase.com/dashboard/project/{PROJECT_ID}/settings/api
# Database: https://supabase.com/dashboard/project/{PROJECT_ID}/settings/database
# Auth: https://supabase.com/dashboard/project/{PROJECT_ID}/auth/users

# Connection string format:
postgresql://postgres:{PASSWORD}@db.{PROJECT_REF}.supabase.co:5432/postgres
```

## Monitoring & Diagnostics

### Check Service Health
```bash
# Frontend health (via app URL)
curl https://{APP_NAME}.ondigitalocean.app/

# Backend health (internal, via frontend proxy)
curl https://{APP_NAME}.ondigitalocean.app/api/health

# Or check backend health directly if you expose it temporarily
curl http://backend:8080/health  # Only works from inside DO network
```

### Resource Usage
```bash
# Via DigitalOcean Dashboard
# Go to: Apps → {APP_NAME} → Insights

# Check app metrics
doctl apps list-metrics {APP_ID}
```

### Debugging Failed Deployments
```bash
# 1. Check GitHub Actions logs
gh run view --log

# 2. Check DigitalOcean deployment logs
doctl apps logs {APP_ID} --type deploy

# 3. Check runtime logs for errors
doctl apps logs {APP_ID} --type run --follow

# 4. Validate app spec
doctl apps spec validate .do/app.yaml

# 5. Check image availability
docker pull ghcr.io/michal-kozlik/sudoku-solver-frontend:latest
docker pull ghcr.io/michal-kozlik/sudoku-solver-backend:latest
```

## Common Workflows

### Update Environment Variable
```bash
# Option 1: Via Dashboard
# Apps → {APP} → Settings → App-Level Environment Variables

# Option 2: Update app.yaml and redeploy
# 1. Edit .do/app.yaml
# 2. Run: doctl apps update {APP_ID} --spec .do/app.yaml
```

### Rollback to Previous Version
```bash
# 1. Find working commit SHA
git log --oneline

# 2. Update app.yaml with old image tag
sed -i 's/tag: .*/tag: {OLD_SHA}/' .do/app.yaml

# 3. Deploy
doctl apps update {APP_ID} --spec .do/app.yaml

# Or manually trigger GitHub Actions with old commit
git revert {BAD_COMMIT}
git push origin master
```

### Scale Application
```bash
# Edit .do/app.yaml:
# - Change instance_count for horizontal scaling
# - Change instance_size_slug for vertical scaling

# Available sizes:
# - basic-xxs: 512MB RAM, 0.5 vCPU (~$5/mo)
# - basic-xs:  1GB RAM, 1 vCPU (~$10/mo)
# - basic-s:   2GB RAM, 1 vCPU (~$15/mo)
# - basic-m:   4GB RAM, 2 vCPU (~$40/mo)

# Apply changes
doctl apps update {APP_ID} --spec .do/app.yaml
```

### Add Custom Domain
```bash
# Via Dashboard:
# Apps → {APP} → Settings → Domains → Add Domain

# Via CLI:
doctl apps create-domain {APP_ID} --domain yourdomain.com

# List domains
doctl apps list-domains {APP_ID}
```

## Environment Variables Reference

### Required GitHub Secrets
- `DIGITALOCEAN_ACCESS_TOKEN` - DO API token
- `DIGITALOCEAN_APP_ID` - App ID from DO
- `SUPABASE_CONNECTION_STRING` - PostgreSQL connection
- `JWT_SECRET` - JWT signing secret
- `PUBLIC_SUPABASE_URL` - Supabase project URL (in environment)
- `PUBLIC_SUPABASE_KEY` - Supabase anon key (in environment)

### Optional GitHub Secrets
- `CODECOV_TOKEN` - Codecov integration (already configured)

## Useful Links

- **GitHub Actions:** https://github.com/michal-kozlik/10x-project/actions
- **GitHub Packages:** https://github.com/michal-kozlik?tab=packages
- **DigitalOcean Dashboard:** https://cloud.digitalocean.com/apps
- **Supabase Dashboard:** https://supabase.com/dashboard

## Emergency Contacts

- **GitHub Actions Issues:** Check workflow logs first
- **DigitalOcean Support:** https://cloud.digitalocean.com/support
- **Supabase Support:** https://supabase.com/dashboard/support

---

💡 **Tip:** Bookmark this file for quick reference during deployments!
