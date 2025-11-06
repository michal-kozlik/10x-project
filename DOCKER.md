# Docker Deployment Guide

This guide covers building, running, and deploying the Sudoku Solver application using Docker.

## Prerequisites

- Docker Engine 20.10+ installed
- Docker Compose 2.0+ installed (for local development)
- Git (for versioning images)
- Access to GitHub Container Registry (GHCR) for pushing images

## Project Structure

```
.
├── Dockerfile.frontend          # Multi-stage Dockerfile for Astro + React frontend
├── Dockerfile.backend           # Multi-stage Dockerfile for .NET 9 API
├── docker-compose.yml           # Orchestration file for local development
├── .dockerignore                # Files to exclude from Docker context
├── docker-build.sh              # Build script for Linux/Mac
├── docker-build.ps1             # Build script for Windows PowerShell
└── .env.example                 # Example environment variables
```

## Building Images

### Using Build Scripts (Recommended)

**Windows (PowerShell):**
```powershell
.\docker-build.ps1
```

**Linux/Mac:**
```bash
chmod +x docker-build.sh
./docker-build.sh
```

These scripts will:
- Build both frontend and backend images
- Tag with Git commit SHA and `latest`
- Add OCI labels for metadata
- Display built images

### Manual Build

**Backend:**
```bash
docker build -f Dockerfile.backend -t ghcr.io/michal-kozlik/sudoku-solver:backend-latest .
```

**Frontend:**
```bash
docker build -f Dockerfile.frontend -t ghcr.io/michal-kozlik/sudoku-solver:frontend-latest .
```

## Running with Docker Compose (Local Development)

### 1. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
# Frontend - Supabase Auth (PUBLIC_ prefix required)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_KEY=your-anon-key-here

# Backend - PostgreSQL Connection String
SUPABASE_CONNECTION_STRING=Host=db.your-project.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=your-password
```

**Important**: 
- Frontend uses Supabase ONLY for authentication
- Backend connects directly to PostgreSQL database
- No Supabase client library needed in backend

### 2. Start Services

```bash
docker-compose up -d
```

This will:
- Build images if not already built
- Start backend on http://localhost:5149
- Start frontend on http://localhost:3000
- Create a shared network for service communication

### 3. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
```

### 4. Stop Services

```bash
docker-compose down
```

## Running Standalone Containers

### Backend

```bash
docker run -d \
  --name sudoku-backend \
  -p 5149:8080 \
  -e ASPNETCORE_URLS=http://0.0.0.0:8080 \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e ConnectionStrings__SupabaseDb="Host=db.xxx.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=xxx" \
  ghcr.io/michal-kozlik/sudoku-solver:backend-latest
```

### Frontend

```bash
docker run -d \
  --name sudoku-frontend \
  -p 3000:8080 \
  -e HOST=0.0.0.0 \
  -e PORT=8080 \
  -e PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  -e PUBLIC_SUPABASE_KEY=your-anon-key \
  --link sudoku-backend:backend \
  ghcr.io/michal-kozlik/sudoku-solver:frontend-latest
```

## Pushing to GitHub Container Registry

### 1. Authenticate with GHCR

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u michal-kozlik --password-stdin
```

### 2. Push Images

```bash
# Push with specific version
docker push ghcr.io/michal-kozlik/sudoku-solver:backend-abc1234
docker push ghcr.io/michal-kozlik/sudoku-solver:frontend-abc1234

# Push latest
docker push ghcr.io/michal-kozlik/sudoku-solver:backend-latest
docker push ghcr.io/michal-kozlik/sudoku-solver:frontend-latest
```

## Deploying to DigitalOcean

### Using DigitalOcean App Platform

1. Create a new App in DigitalOcean
2. Choose "Container" as the source
3. Configure services:

**Backend Service:**
- Image: `ghcr.io/michal-kozlik/sudoku-solver:backend-latest`
- Port: 8080
- Environment Variables: Set Supabase credentials

**Frontend Service:**
- Image: `ghcr.io/michal-kozlik/sudoku-solver:frontend-latest`
- Port: 8080
- Environment Variables: Set Supabase credentials + API_BASE_URL

### Using DigitalOcean Droplet

1. SSH into your droplet
2. Install Docker and Docker Compose
3. Clone repository or copy docker-compose.yml
4. Configure .env file
5. Run `docker-compose up -d`

## Environment Variables Reference

### Frontend (Astro + React)

| Variable | Description | Example |
|----------|-------------|---------|
| `HOST` | Bind address | `0.0.0.0` |
| `PORT` | Listen port | `8080` |
| `NODE_ENV` | Runtime environment | `production` |
| `PUBLIC_SUPABASE_URL` | Supabase project URL (for auth) | `https://xxx.supabase.co` |
| `PUBLIC_SUPABASE_KEY` | Supabase anonymous key (for auth) | `eyJ...` |

**Note**: Frontend uses Supabase **ONLY for authentication** (login, signup, session). It does NOT directly access the database. All data operations go through the backend API.

### Backend (.NET 9 API)

| Variable | Description | Example |
|----------|-------------|---------|
| `ASPNETCORE_URLS` | Bind address and port | `http://0.0.0.0:8080` |
| `ASPNETCORE_ENVIRONMENT` | Runtime environment | `Production` |
| `ConnectionStrings__SupabaseDb` | PostgreSQL connection string | `Host=db.xxx.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=xxx` |

**Note**: Backend connects **directly to PostgreSQL database** for all diagram operations. It does not use Supabase client libraries.

## Troubleshooting

### Frontend can't reach backend

Check that:
1. Both containers are on the same Docker network
2. `API_BASE_URL` uses the correct backend service name
3. Backend is healthy and responding

### Backend database connection fails

Verify:
1. Supabase credentials are correct
2. Connection string format is valid
3. Network allows outbound PostgreSQL connections (port 5432)

### Images are too large

Check:
1. `.dockerignore` is properly configured
2. Multi-stage builds are working correctly
3. No unnecessary files in build context

### Permission errors

If running containers as non-root, ensure:
1. File ownership is correct
2. Required directories are writable

## Best Practices

1. **Version Control**: Always tag images with Git commit SHA
2. **Secrets**: Never commit `.env` files with real credentials
3. **Updates**: Regularly update base images for security patches
4. **Monitoring**: Implement proper logging and monitoring
5. **Resource Limits**: Set memory and CPU limits in production
6. **Health Checks**: Monitor container health and restart policies

## CI/CD Integration

For GitHub Actions, use this workflow:

```yaml
name: Build and Push Docker Images

on:
  push:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push backend
        run: |
          docker build -f Dockerfile.backend \
            -t ghcr.io/michal-kozlik/sudoku-solver:backend-${{ github.sha }} \
            -t ghcr.io/michal-kozlik/sudoku-solver:backend-latest \
            .
          docker push ghcr.io/michal-kozlik/sudoku-solver:backend-${{ github.sha }}
          docker push ghcr.io/michal-kozlik/sudoku-solver:backend-latest
      
      - name: Build and push frontend
        run: |
          docker build -f Dockerfile.frontend \
            -t ghcr.io/michal-kozlik/sudoku-solver:frontend-${{ github.sha }} \
            -t ghcr.io/michal-kozlik/sudoku-solver:frontend-latest \
            .
          docker push ghcr.io/michal-kozlik/sudoku-solver:frontend-${{ github.sha }}
          docker push ghcr.io/michal-kozlik/sudoku-solver:frontend-latest
```

## Support

For issues or questions, please open an issue on GitHub.
