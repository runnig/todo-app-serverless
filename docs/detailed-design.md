# TODO App — Detailed Design

## 1. Overview

A multi-user TODO app built as a learning project and a foundation for future apps. Serverless architecture with Supabase as the primary platform.

**Tech stack:**

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS + Shadcn/ui |
| Backend | Next.js API Routes (serverless functions) |
| Database | Supabase (Postgres) |
| ORM | Drizzle ORM |
| Auth | Supabase Auth (client SDK) |
| Validation | Zod |
| Testing | Vitest + React Testing Library |
| Deployment | Vercel (frontend/API) + Supabase (DB/Auth) |

## 2. Architecture

```
┌─────────────────────────────────────────────┐
│                  Browser                    │
│           Next.js (React UI)                │
│  ┌─────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Login   │  │ Todo List│  │ Todo Edit  │  │
│  │ Page    │  │ Page     │  │ Page       │  │
│  └────┬────┘  └─────┬────┘  └─────┬──────┘  │
│       │             │             │         │
│       ▼             ▼             ▼         │
│  ┌──────────────────────────────────────┐   │
│  │   Typed API Client (shared types)    │   │
│  └──────────────────┬───────────────────┘   │
└─────────────────────┼───────────────────────┘
                      │ fetch()
                      ▼
┌─────────────────────────────────────────────┐
│          Next.js API Routes                 │
│              /api/todos/*                   │
│  ┌──────────────────────────────────┐       │
│  │ Todo CRUD (validate, query)      │       │
│  └──────────────┬───────────────────┘       │
│                 │                           │
│       ┌─────────┴──────────┐                │
│       ▼                    ▼                │
│  ┌──────────┐   ┌───────────────┐           │
│  │ Supabase │   │ Drizzle ORM   │           │
│  │ Auth SDK │   │ (type-safe)   │           │
│  └──────────┘   └───────┬───────┘           │
└─────────────────────────┼──────────────────┘
                          │ SQL
                          ▼
                  ┌─────────────────┐
                  │   PostgreSQL    │
                  │  (Supabase or   │
                  │   local Docker) │
                  └─────────────────┘
```

- Monorepo: single Next.js app containing both UI and API routes
- Shared types via a `src/lib/types.ts` module used by both API routes and frontend components
- Drizzle ORM talks to standard Postgres (works identically locally and in production)
- Supabase Auth handles user registration, login, sessions via client SDK
- API routes validate JWTs from Supabase Auth and extract `user_id`

## 3. Data Model

```sql
-- Users are managed by Supabase Auth (auth.users)
-- App-specific user data lives in profiles

profiles:
  id          uuid    PK, FK → auth.users.id
  email       varchar NOT NULL
  created_at  timestamptz  default now()

todos:
  id          uuid    PK (default gen_random_uuid())
  user_id     uuid    FK → profiles.id, NOT NULL
  title       varchar(200) NOT NULL
  description text
  done        boolean default false
  created_at  timestamptz  default now()
  updated_at  timestamptz  default now()
```

- `profiles` extends Supabase's `auth.users` with app-specific fields, created automatically via a database trigger on user signup
- `todos` belongs to a user via `user_id`; all queries are scoped to the authenticated user
- Indexes on `todos.user_id` and `todos.created_at` for list query performance

## 4. Repository Pattern (Persistence Abstraction)

All database access goes through a `TodoRepository` interface, enabling different storage backends for testing and production.

```typescript
interface TodoRepository {
  findAll(userId: string): Promise<Todo[]>;
  findById(id: string, userId: string): Promise<Todo | null>;
  create(data: Omit<NewTodo, "id" | "createdAt" | "updatedAt"> & { userId: string }): Promise<Todo>;
  update(id: string, userId: string, data: Partial<UpdateTodoInput>): Promise<Todo | null>;
  delete(id: string, userId: string): Promise<Todo | null>;
}
```

**Implementations:**
- `InMemoryTodoRepository` — in-memory store for unit tests, zero dependencies
- `DrizzleTodoRepository` — wraps Drizzle ORM, used for local Postgres (integration tests) and production

API routes receive a `TodoRepository` via dependency injection rather than calling Drizzle directly. This makes unit tests fast (no DB needed) while integration tests use real Postgres.

## 5. API Design

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/todos` | List all todos for authenticated user |
| `POST` | `/api/todos` | Create a new todo |
| `PATCH` | `/api/todos/:id` | Update title, description, or done status |
| `DELETE` | `/api/todos/:id` | Delete a todo |

### Authentication

Supabase Auth SDK handles all auth flows directly from the frontend (`signUp`, `signInWithPassword`, `signOut`). No custom auth API routes needed.

The JWT is sent with requests to our API routes. A Next.js middleware validates the JWT on every request and extracts `user_id`. Unauthenticated requests return `401`.

### Validation

Zod schemas at API boundaries validate request bodies and return `400` with clear error messages.

### Response Format

```json
{ "data": [...], "error": null }
{ "data": null, "error": { "code": "...", "message": "..." } }
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `NOT_FOUND` | 404 | Todo not found |
| `FORBIDDEN` | 403 | Todo belongs to another user |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## 6. Frontend / UI

### Pages

- `/login` — Email/password login form + sign-up link
- `/signup` — Registration form
- `/` — Todo list (protected, requires auth)

### Components

- `TodoList` — Displays all todos, supports filtering (all/active/done)
- `TodoItem` — Single todo row with inline mark-as-done toggle, edit/delete buttons
- `TodoForm` — Create/edit form (title + optional description)
- `AuthGuard` — Redirects unauthenticated users to `/login`

### Styling

Tailwind CSS for layout and custom styles. Shadcn/ui for interactive components:
- `Button` — actions
- `Input` / `Textarea` — todo form fields
- `Checkbox` — mark-as-done toggle
- `Card` — todo item container
- `Dialog` or `Sheet` — edit mode
- `DropdownMenu` — todo actions (edit/delete)
- `Sonner` — toast notifications for API errors

### State Management

React's built-in `useState`/`useEffect` with the Supabase client for auth state. No global state library. Server-side fetching via Next.js for the todo list, optimistic updates on mutations.

## 7. Error Handling

**API errors** use the consistent response format above with specific error codes.

**Frontend errors** — toast notifications via Shadcn/ui `Sonner` for API failures. Form validation errors shown inline next to fields.

**Auth errors** — handled by Supabase SDK (invalid credentials, expired sessions). The `AuthGuard` component listens for auth state changes and redirects to `/login` on session expiry.

## 8. Testing Strategy

| Layer | Tool | What it tests |
|-------|------|---------------|
| Unit | Vitest | Zod schemas, utility functions, business logic |
| Component | Vitest + React Testing Library | UI components render correctly, user interactions work |
| API integration | Vitest + fetch mocks | API routes validate input, return correct responses |
| E2E / integration | Vitest + real DB | Full CRUD flow against local Supabase (Docker) |

### Local Testing Flow

1. `supabase start` — spins up local Postgres + Auth
2. `supabase db reset` — applies schema + seed data
3. `vitest` — runs all tests against local instance

### CI Testing

Same test suite runs against a remote Supabase test project by swapping environment variables.

## 9. Project Structure

```
todo-app-serverless/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Home (todo list)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── api/
│   │       └── todos/
│   │           ├── route.ts        # GET, POST
│   │           └── [id]/route.ts   # PATCH, DELETE
│   ├── components/
│   │   ├── ui/                  # Shadcn/ui components
│   │   ├── TodoList.tsx
│   │   ├── TodoItem.tsx
│   │   ├── TodoForm.tsx
│   │   └── AuthGuard.tsx
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client init
│   │   ├── db/                 # Drizzle schema + connection
│   │   │   ├── schema.ts
│   │   │   └── index.ts
│   │   ├── repositories/       # Repository pattern
│   │   │   ├── todo-repository.ts  # Abstract interface
│   │   │   ├── in-memory.ts       # InMemoryTodoRepository (unit tests)
│   │   │   └── drizzle.ts         # DrizzleTodoRepository (integration/prod)
│   │   ├── types.ts            # Shared types
│   │   └── api.ts              # Typed API client for frontend
│   └── middleware.ts            # Auth check on protected routes
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   └── seed.sql
├── docs/
├── drizzle.config.ts
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── vitest.config.ts
```

## 10. Migration Paths

This architecture supports evolving into other approaches:

- **To Supabase client-side (RLS):** Replace API route calls with Supabase client SDK calls. Add RLS policies. Delete API routes incrementally.
- **To tRPC + Prisma + NextAuth:** Swap Drizzle for Prisma, Supabase Auth for NextAuth.js, wrap API logic in tRPC routers. Business logic and DB are portable.
