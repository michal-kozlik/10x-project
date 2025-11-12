# Deployment Configuration Guide

## Required GitHub Secrets

Configure the following secrets in your GitHub repository:

### Repository Secrets (Settings → Secrets and variables → Actions)

1. **DIGITALOCEAN_ACCESS_TOKEN**
   - Your DigitalOcean Personal Access Token
   - Get it from: https://cloud.digitalocean.com/account/api/tokens
   - Required permissions: `read` and `write` for Apps
   
2. **DIGITALOCEAN_APP_ID**
   - The ID of your DigitalOcean App Platform application
   - Find it in the URL when viewing your app: `https://cloud.digitalocean.com/apps/{APP_ID}`
   - Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

3. **SUPABASE_CONNECTION_STRING**
   - PostgreSQL connection string for backend
   - Format: `postgresql://postgres:{PASSWORD}@{HOST}:5432/postgres`
   - Get it from: Supabase Dashboard → Settings → Database → Connection String
   - Example: `postgresql://postgres:password123@db.xxxxx.supabase.co:5432/postgres`

4. **JWT_SECRET**
   - JWT Secret for backend authentication
   - Get it from: Supabase Dashboard → Settings → API → JWT Secret
   - Example: `jo6vDQVX5kRc9H9BsO4MCvQBgTgVStDpMgSHv4U9Pb0yWNaV6wJEPhh0rk1JybXjSjsPQYE11ykgJX4059GiKA==`

### Environment Secrets (Settings → Environments → production)

5. **PUBLIC_SUPABASE_URL**
   - Your Supabase project URL
   - Get it from: Supabase Dashboard → Settings → API → Project URL
   - Example: `https://htxfsiqfmtzgrcxwoxco.supabase.co`

6. **PUBLIC_SUPABASE_KEY**
   - Supabase anonymous key (public, safe to expose to frontend)
   - Get it from: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

7. **PUBLIC_ENV_NAME**
   - Environment name for the application
   - Value: `production`

## DigitalOcean App Platform Setup

### Step 1: Create Application Manually

1. Go to DigitalOcean Dashboard: https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. Choose **"Docker Hub or a container registry"** as the source
4. Select **"GitHub Container Registry (GHCR)"**
5. Configure access:
   - Registry URL: `ghcr.io`
   - Repository: `michal-kozlik/sudoku-solver-frontend` (for frontend service)
   - You'll need to add backend service manually after creation

### Step 2: Configure App from Spec

After creating the app manually:

1. Note your **App ID** from the URL
2. Add it to GitHub Secrets as `DIGITALOCEAN_APP_ID`
3. The GitHub Actions workflow will automatically update the app using `.do/app.yaml`

**OR** use `doctl` CLI to create app from spec:

```bash
# Install doctl
# macOS
brew install doctl

# Windows (using Chocolatey)
choco install doctl

# Login
doctl auth init

# Create app from spec
doctl apps create --spec .do/app.yaml
```

### Step 3: Configure App Secrets in DigitalOcean

Go to your app → Settings → App-Level Environment Variables and add:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_KEY`
- `SUPABASE_CONNECTION_STRING`
- `JWT_SECRET`

These will be referenced in `.do/app.yaml` via `${SECRET_NAME}` syntax.

## Architecture Overview

### Communication Flow

```
User Request to / (static pages)
    ↓
[Frontend Service - Astro] → Returns HTML/CSS/JS

User Request to /api/* (API calls)
    ↓
[Frontend Service - Astro API Route]
    ↓ (proxies to)
[Backend Service via http://backend:8080]
    ↓
[Supabase PostgreSQL]
```

### Key Points

1. **Frontend Service:**
   - Publicly accessible at `/`
   - Serves Astro + React application (static and SSR)
   - Has API proxy routes in `src/pages/api/*`
   - Proxies API requests to backend via internal network
   - Uses Supabase for authentication only
   - Example: User calls `/api/diagrams` → Astro proxies to `http://backend:8080/diagrams`

2. **Backend Service:**
   - **Internal only** (not publicly accessible)
   - Accessible from frontend via `http://backend:8080`
   - Direct connection to Supabase PostgreSQL
   - Handles all business logic and database operations
   - Example endpoints: `/diagrams`, `/health` (no /api prefix needed)

3. **Image Tags:**
   - Production images tagged with commit SHA: `ghcr.io/michal-kozlik/sudoku-solver-frontend:{SHA}`
   - Also tagged as `latest` for convenience

**Important:** 
- Backend is NOT publicly accessible, only frontend can reach it via internal network
- All user requests go through frontend's Astro API routes at `/api/*`
- Astro strips `/api` prefix and forwards to backend root endpoints
- This provides an extra security layer and allows for request/response transformation

## CI/CD Workflow

### Trigger

The workflow runs automatically on every push to `master` branch:

```yaml
on:
  push:
    branches:
      - master
```

### Stages

1. **Build & Push Images** (parallel for frontend and backend)
   - Builds Docker images using Dockerfiles
   - Pushes to GitHub Container Registry (GHCR)
   - Tags with commit SHA and `latest`

2. **Deploy to DigitalOcean**
   - Updates `.do/app.yaml` with new image tags
   - Deploys to DigitalOcean App Platform
   - Waits for deployment to complete (max 10 minutes)
   - Reports deployment status

### Manual Trigger

You can also trigger the workflow manually:

1. Go to: Actions → Master Docker - Build & Deploy
2. Click "Run workflow"
3. Select branch: `master`
4. Click "Run workflow"

## Health Checks

Both services have health checks configured:

### Frontend
- Path: `/`
- Initial delay: 30 seconds
- Check every: 10 seconds

### Backend
- Path: `/health` ⚠️ **Make sure this endpoint exists in your backend!**
- Initial delay: 30 seconds
- Check every: 10 seconds

If `/health` doesn't exist, update `.do/app.yaml` to use a different path or create the endpoint.

## Troubleshooting

### Deployment Failed

1. Check GitHub Actions logs for build errors
2. Verify all secrets are configured correctly
3. Check DigitalOcean App Platform logs
4. Ensure app.yaml is valid: `doctl apps spec validate .do/app.yaml`

### Images Not Found

1. Verify images were pushed to GHCR: https://github.com/michal-kozlik?tab=packages
2. Ensure images are public or DigitalOcean has access
3. Check image tags match in app.yaml

### Backend Not Responding

1. Check backend logs in DigitalOcean dashboard
2. Verify `SUPABASE_CONNECTION_STRING` is correct
3. Ensure `/health` endpoint exists
4. Check internal networking configuration

### Frontend Can't Reach Backend

1. Verify `BACKEND_URL=http://backend:8080` in frontend environment
2. Check that backend service name is `backend` in app.yaml
3. Ensure both services are in the same DigitalOcean app
4. Check backend logs for incoming requests
5. Test backend health: Check if frontend can reach `http://backend:8080/health`

## Useful Commands

### View App Status
```bash
doctl apps list
doctl apps get <APP_ID>
```

### View Deployments
```bash
doctl apps list-deployments <APP_ID>
doctl apps get-deployment <APP_ID> <DEPLOYMENT_ID>
```

### View Logs
```bash
doctl apps logs <APP_ID> --type run
doctl apps logs <APP_ID> --type build
```

### Update App Spec
```bash
doctl apps update <APP_ID> --spec .do/app.yaml
```

### Validate Spec
```bash
doctl apps spec validate .do/app.yaml
```

## Next Steps

1. ✅ Configure all GitHub Secrets
2. ✅ Create DigitalOcean App manually or via `doctl`
3. ✅ Add `DIGITALOCEAN_APP_ID` to GitHub Secrets
4. ✅ Configure App Secrets in DigitalOcean Dashboard
5. ✅ Ensure backend has `/health` endpoint
6. ✅ Push to master branch to trigger deployment
7. ✅ Monitor deployment in GitHub Actions and DigitalOcean Dashboard

## Resources

- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [App Spec Reference](https://docs.digitalocean.com/products/app-platform/reference/app-spec/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [doctl CLI Reference](https://docs.digitalocean.com/reference/doctl/)
