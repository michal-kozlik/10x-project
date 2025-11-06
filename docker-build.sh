#!/bin/bash

# Docker build script for Sudoku Solver application
# Builds both frontend and backend images with proper tagging

set -e  # Exit on error

# Enable Docker BuildKit for better performance
export DOCKER_BUILDKIT=1

# Configuration
REGISTRY="ghcr.io"
OWNER="michal-kozlik"
REPO="sudoku-solver"
GIT_SHA=$(git rev-parse --short HEAD)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Building Docker images for Sudoku Solver...${NC}"
echo "Git SHA: $GIT_SHA"
echo "Timestamp: $TIMESTAMP"
echo ""

# Build backend image
echo -e "${GREEN}Building backend image...${NC}"
docker build \
  -f Dockerfile.backend \
  -t ${REGISTRY}/${OWNER}/${REPO}:backend-${GIT_SHA} \
  -t ${REGISTRY}/${OWNER}/${REPO}:backend-latest \
  --label "org.opencontainers.image.source=https://github.com/${OWNER}/${REPO}" \
  --label "org.opencontainers.image.revision=${GIT_SHA}" \
  --label "org.opencontainers.image.created=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
  .

echo -e "${GREEN}Backend image built successfully!${NC}"
echo ""

# Build frontend image
echo -e "${GREEN}Building frontend image...${NC}"
docker build \
  -f Dockerfile.frontend \
  -t ${REGISTRY}/${OWNER}/${REPO}:frontend-${GIT_SHA} \
  -t ${REGISTRY}/${OWNER}/${REPO}:frontend-latest \
  --label "org.opencontainers.image.source=https://github.com/${OWNER}/${REPO}" \
  --label "org.opencontainers.image.revision=${GIT_SHA}" \
  --label "org.opencontainers.image.created=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
  .

echo -e "${GREEN}Frontend image built successfully!${NC}"
echo ""

# Display built images
echo -e "${BLUE}Built images:${NC}"
docker images | grep "${REPO}"
echo ""

echo -e "${GREEN}Build completed! To push to registry, run:${NC}"
echo "docker push ${REGISTRY}/${OWNER}/${REPO}:backend-${GIT_SHA}"
echo "docker push ${REGISTRY}/${OWNER}/${REPO}:backend-latest"
echo "docker push ${REGISTRY}/${OWNER}/${REPO}:frontend-${GIT_SHA}"
echo "docker push ${REGISTRY}/${OWNER}/${REPO}:frontend-latest"
