# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
└────────────┬────────────────────────────────────┬────────────────┘
             │                                     │
             │ HTTP Requests                       │ Auth Requests
             │                                     │
             ▼                                     ▼
┌────────────────────────┐              ┌─────────────────────────┐
│   Frontend Container   │              │   Supabase Auth API     │
│   (Astro + React)      │              │   (External Service)    │
│   Port 3000 → 8080     │◄─────────────┤   Authentication Only   │
└────────────┬───────────┘              └─────────────────────────┘
             │
             │ /api/diagrams/* requests
             │ (proxied to backend)
             │
             ▼
┌────────────────────────┐
│   Backend Container    │
│   (.NET 9 API)         │
│   Port 5149 → 8080     │
└────────────┬───────────┘
             │
             │ Direct PostgreSQL
             │ Connection
             │
             ▼
┌────────────────────────┐
│   Supabase Database    │
│   (PostgreSQL)         │
│   External Service     │
└────────────────────────┘
```

## Key Points

### Frontend (Astro + React)
- **Purpose**: User interface and authentication
- **Supabase Usage**: Authentication ONLY (login, signup, session management)
- **Environment Variables**: 
  - `PUBLIC_SUPABASE_URL` - Supabase project URL for auth
  - `PUBLIC_SUPABASE_KEY` - Anonymous key for auth
- **Data Access**: None - all data operations go through backend API
- **Proxy**: `/api/diagrams/*` requests are proxied to backend

### Backend (.NET 9 API)
- **Purpose**: Business logic and data operations
- **Supabase Usage**: Direct PostgreSQL connection (no Supabase client library)
- **Environment Variables**:
  - `ConnectionStrings__SupabaseDb` - PostgreSQL connection string
- **Data Access**: Direct database queries using Npgsql
- **Endpoints**: CRUD operations for diagrams, sudoku solving

### Supabase
- **Authentication**: Used by frontend for user management
- **Database**: PostgreSQL accessed directly by backend
- **Benefits**: 
  - Managed auth with cookies and sessions
  - Reliable PostgreSQL hosting
  - No need for separate auth implementation

## Why This Architecture?

1. **Separation of Concerns**: Frontend handles UI and auth, backend handles business logic
2. **Security**: Database credentials never exposed to client
3. **Flexibility**: Can easily switch auth providers or databases
4. **Performance**: Direct SQL queries are faster than going through Supabase client
5. **Simplicity**: Backend doesn't need Supabase SDK, just standard PostgreSQL driver

## Docker Configuration

Both services run in separate containers and communicate over a Docker bridge network. This allows:
- Independent scaling
- Separate deployment cycles
- Clear network boundaries
- Easy local development with docker-compose
