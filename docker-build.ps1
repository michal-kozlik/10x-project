# Docker build script for Sudoku Solver application (PowerShell)
# Builds both frontend and backend images with proper tagging

$ErrorActionPreference = "Stop"

# Enable Docker BuildKit for better performance
$env:DOCKER_BUILDKIT = "1"

# Configuration
$REGISTRY = "ghcr.io"
$OWNER = "michal-kozlik"
$REPO = "sudoku-solver"
$GIT_SHA = (git rev-parse --short HEAD)
$TIMESTAMP = Get-Date -Format "yyyyMMdd-HHmmss"

Write-Host "Building Docker images for Sudoku Solver..." -ForegroundColor Blue
Write-Host "Git SHA: $GIT_SHA"
Write-Host "Timestamp: $TIMESTAMP"
Write-Host ""

# Build backend image
Write-Host "Building backend image..." -ForegroundColor Green
docker build `
  -f Dockerfile.backend `
  -t "${REGISTRY}/${OWNER}/${REPO}:backend-${GIT_SHA}" `
  -t "${REGISTRY}/${OWNER}/${REPO}:backend-latest" `
  --label "org.opencontainers.image.source=https://github.com/${OWNER}/${REPO}" `
  --label "org.opencontainers.image.revision=${GIT_SHA}" `
  --label "org.opencontainers.image.created=$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ' -AsUTC)" `
  .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Backend image built successfully!" -ForegroundColor Green
Write-Host ""

# Build frontend image
Write-Host "Building frontend image..." -ForegroundColor Green
docker build `
  -f Dockerfile.frontend `
  -t "${REGISTRY}/${OWNER}/${REPO}:frontend-${GIT_SHA}" `
  -t "${REGISTRY}/${OWNER}/${REPO}:frontend-latest" `
  --label "org.opencontainers.image.source=https://github.com/${OWNER}/${REPO}" `
  --label "org.opencontainers.image.revision=${GIT_SHA}" `
  --label "org.opencontainers.image.created=$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ' -AsUTC)" `
  .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Frontend image built successfully!" -ForegroundColor Green
Write-Host ""

# Display built images
Write-Host "Built images:" -ForegroundColor Blue
docker images | Select-String $REPO
Write-Host ""

Write-Host "Build completed! To push to registry, run:" -ForegroundColor Green
Write-Host "docker push ${REGISTRY}/${OWNER}/${REPO}:backend-${GIT_SHA}"
Write-Host "docker push ${REGISTRY}/${OWNER}/${REPO}:backend-latest"
Write-Host "docker push ${REGISTRY}/${OWNER}/${REPO}:frontend-${GIT_SHA}"
Write-Host "docker push ${REGISTRY}/${OWNER}/${REPO}:frontend-latest"
