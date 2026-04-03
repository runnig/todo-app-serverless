# Todo App (Serverless)

A multi-user todo application built with Next.js, Supabase, and Drizzle ORM.

## Tech Stack

| Layer      | Technology                       |
| ---------- | -------------------------------- |
| Frontend   | Next.js (App Router) + Shadcn/ui |
| Backend    | Next.js API Routes               |
| Database   | Supabase (Postgres)              |
| ORM        | Drizzle ORM                      |
| Auth       | Supabase Auth                    |
| Validation | Zod                              |
| Testing    | Vitest + React Testing Library   |

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (for local Supabase)

### Setup

```bash
make setup
```

This installs dependencies, starts local Supabase, runs migrations, and seeds the database.

### Configure environment

```bash
cp .env.local.example .env.local
```

Update `.env.local` with the values printed by `supabase start`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`

### Run the dev server

```bash
make dev
```

Visit `http://localhost:3000`. Sign up, then add/check/filter/delete todos.

## Common Commands

| Command                 | Description                               |
| ----------------------- | ----------------------------------------- |
| `make dev`              | Start Next.js dev server                  |
| `make build`            | Build for production                      |
| `make lint`             | Run ESLint                                |
| `make typecheck`        | Run TypeScript type checking              |
| `make test-unit`        | Run unit tests (no DB needed)             |
| `make test-integration` | Run integration tests (needs Supabase)    |
| `make verify`           | Run lint + typecheck + unit tests + build |
| `make db-generate`      | Generate migration from schema changes    |
| `make db-migrate`       | Apply pending migrations                  |
| `make db-seed`          | Seed the database                         |
| `make db-reset`         | Reset DB and reapply migrations           |
| `make help`             | Show all available targets                |

## Project Structure

```
src/
├── app/                    # Next.js App Router (pages + API routes)
│   ├── api/todos/          # REST API: GET, POST, PATCH, DELETE
│   ├── login/              # Login page
│   └── signup/             # Signup page
├── components/             # React components (TodoList, TodoItem, etc.)
├── lib/
│   ├── handlers/           # Route handler logic with DI
│   ├── repositories/       # Repository pattern (in-memory + Drizzle)
│   ├── db/                 # Drizzle schema, connection, seed
│   ├── supabase/           # Supabase client/server/middleware
│   ├── types.ts            # Shared types and constants
│   ├── schemas.ts          # Zod validation schemas
│   └── api.ts              # Typed API client
└── tests/
    ├── unit/               # Unit and component tests
    └── integration/        # Integration tests (real DB)
```

## Architecture

- **Repository pattern**: All DB access goes through a `TodoRepository` interface. `InMemoryTodoRepository` for unit tests, `DrizzleTodoRepository` for integration/production.
- **Dependency injection**: Route handlers receive dependencies (`getAuthUser`, `repo`) via `RouteDeps`, making them easy to test without HTTP.
- **Shared types**: `src/lib/types.ts` defines the API response envelope, error codes, and todo response shape used by both frontend and backend.
- **Schema validation**: Zod schemas at API boundaries validate request bodies and UUID parameters.

## Documentation

- [Detailed Design](docs/detailed-design.md)
- [Manual Testing Guide](docs/manual-testing.md)
- [Improvement Recommendations](docs/improvements.md)
