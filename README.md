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

## Available Scripts

### Frontend (package.json)

- **`dev`**: Starts the development server.
- **`build`**: Builds the project for production.
- **`start`**: Runs the production build.

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

## Project Scope

- **Sudoku API:** Provides endpoints for generating, solving, and validating Sudoku puzzles.
- **User Interface:** An engaging, responsive UI built with Astro and React to interact with the API.
- **Extensibility:** Designed to allow integration of additional features and improvements.

## Project Status

This project is currently under active development. Future updates will include enhanced API functionality, improved UI components, and additional documentation.

## License

This project is licensed under the MIT License.

Enjoy exploring **SudokuSolver** and thank you for your interest!
