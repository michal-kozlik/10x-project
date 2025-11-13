# SudokuSolver

Welcome to **SudokuSolver**, a full-stack web application that combines a powerful .NET-based Sudoku API with a sleek, modern frontend built using Astro, React, and Tailwind CSS.

## Table of Contents

- Project Name
- Project Description
- Tech Stack
- Getting Started Locally
- Available Scripts
- Project Scope
- Project Status
- License

## Project Description

**SudokuSolver** is a comprehensive solution designed to deliver a fast and reliable Sudoku API along with an engaging user interface. The backend, built with .NET, ensures robust performance and scalability, while the frontend leverages modern web technologies to provide an intuitive user experience.

## Tech Stack

- **Frontend:**
  - Astro 5
  - TypeScript 5
  - React 19
  - Tailwind CSS 4
  - Shadcn/ui
- **Backend:**
  - .NET (C#)
- **Testing:**
  - Vitest (Unit & Integration testing)
  - Testing Library (React components)
  - MSW (API mocking)
  - Playwright (E2E testing)
  - axe-core (Accessibility testing)
  - k6/Artillery (Performance testing)
  - Lighthouse (UI metrics)
  - c8/istanbul (Code coverage)
- **Additional Tools:**
  - Node.js (as specified by the .nvmrc and package.json)

## Getting Started Locally

### Prerequisites

- [Node.js](https://nodejs.org) (version as specified in .nvmrc)
- [.NET SDK](https://dotnet.microsoft.com/download)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/michal-kozlik/10x-project.git
   cd 10x-project
   ```
2. **Install frontend dependencies:**
   ```bash
   npm install
   ```
3. **Build the backend:**
   ```bash
   dotnet build ./backend/SudokuApi.sln
   ```

### Running the Application

- **Frontend (Astro):**
  ```bash
  npm run dev
  ```
- **Backend (.NET):**
  You can use the provided tasks from your IDE or run:
  ```bash
  dotnet watch run --project ./backend/SudokuApi.sln
  ```

### Running with Docker (Production-like)

The easiest way to run the application with Docker is using docker-compose:

```bash
# Make sure .env.docker is configured with your Supabase credentials
# Then start both frontend and backend:
docker-compose up

# Or run in detached mode:
docker-compose up -d

# View logs:
docker-compose logs -f

# Stop containers:
docker-compose down
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5149

#### Building Images Individually

If you need to build the Docker images separately:

```bash
# Build frontend image
docker build -f Dockerfile.frontend -t sudoku-frontend \
  --build-arg PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg PUBLIC_SUPABASE_KEY=your-anon-key \
  .

# Build backend image
docker build -f Dockerfile.backend -t sudoku-backend .
```

#### Running Containers Individually

```bash
# Run backend (requires Npgsql connection string format)
docker run -p 5149:8080 \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e ConnectionStrings__Supabase="Host=aws-1-eu-central-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.yourproject;Password=your-password" \
  -e Jwt__Secret=your-jwt-secret \
  -e Jwt__Issuer=https://your-project.supabase.co/auth/v1 \
  -e Jwt__Audience=authenticated \
  sudoku-backend

# Run frontend
docker run -p 3000:8080 \
  -e NODE_ENV=production \
  -e BACKEND_URL=http://localhost:5149 \
  sudoku-frontend
```

**Note:** When running with docker-compose, all environment variables are loaded from `.env.docker`, so you don't need to specify them manually.

## Available Scripts

### Frontend (package.json)

- **`dev`**: Starts the development server.
- **`build`**: Builds the project for production.
- **`start`**: Runs the production build.
- **`test`**: Runs unit tests.
- **`test:coverage`**: Runs unit tests with coverage.
- **`test:e2e`**: Runs end-to-end tests.
- **`lint`**: Runs ESLint.

### Backend (.NET CLI)

- **Build**:
  ```bash
  dotnet build ./backend/SudokuApi.sln
  ```
- **Publish**:
  ```bash
  dotnet publish ./backend/SudokuApi.sln
  ```
- **Watch**:
  ```bash
  dotnet watch run --project ./backend/SudokuApi.sln
  ```
- **Test**:
  ```bash
  dotnet test ./backend/SudokuApi.sln
  ```

## Deployment

This project uses GitHub Actions for continuous deployment to DigitalOcean App Platform.

### Automated Deployment

Every push to the `master` branch triggers an automated deployment:

1. **Build Docker images** for frontend and backend
2. **Push images** to GitHub Container Registry (GHCR)
3. **Deploy** to DigitalOcean App Platform

### Quick Start

To set up deployment for your environment:

1. **Configure GitHub Secrets** - See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for step-by-step instructions
2. **Create DigitalOcean App** - Follow the checklist to set up your app
3. **Push to master** - Deployment happens automatically!

### Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide with architecture details
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Step-by-step setup checklist

## Project Scope

- **Sudoku API:** Provides endpoints for generating, solving, and validating Sudoku puzzles.
- **User Interface:** An engaging, responsive UI built with Astro and React to interact with the API.
- **Extensibility:** Designed to allow integration of additional features and improvements.

## Project Status

This project is currently under active development. Future updates will include enhanced API functionality, improved UI components, and additional documentation.

## License

This project is licensed under the MIT License.

Enjoy exploring **SudokuSolver** and thank you for your interest!
