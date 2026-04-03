# Testing Locally

## Prerequisites

- Docker running (Docker Desktop or `sudo systemctl start docker`)
- Node.js 18+

## Step 1: Start Docker

Launch Docker Desktop or run:

```bash
sudo systemctl start docker
```

## Step 2: Start local Supabase

```bash
npx supabase start
```

This spins up Postgres + Supabase Auth in Docker. When it finishes, it prints your local credentials.

## Step 3: Configure environment

```bash
cp .env.local.example .env.local
```

Replace the placeholder value --caches with the output from `supabase start`:

- `NEXT_PUBLIC_SUPABASE_URL` — typically `http://localhost:54321`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the `anon key` from output
- `DATABASE_URL` — `postgres://postgres:postgres@localhost:54322/postgres` (correct by default)

## Step 4: Run migrations and seed

```bash
npx drizzle-kit migrate
npm run db:seed
```

## Step 5: Run the dev server

```bash
npm run dev
```

Visit `http://localhost:3000`. Sign up, then add/check/filter/delete todos.

## Step 6: Run tests

```bash
make test-unit           # Unit tests (no DB needed)
make test-integration    # Integration tests (needs Supabase running)
```

## Quick reference

| Step                  | Command                      | Requires Docker? |
| --------------------- | ---------------------------- | ---------------- |
| Start Supabase        | `npx supabase start`         | Yes              |
| Configure env         | Edit `.env.local`            | No               |
| Migrate DB            | `npx drizzle-kit migrate`    | Yes              |
| Seed data             | `npm run db:seed`            | Yes              |
| Dev server            | `npm run dev`                | Yes              |
| Unit tests            | `make test-unit`             | No               |
| Integration tests     | `make test-integration`      | Yes              |
| Full integration flow | `make test-integration-full` | Yes              |
| All checks            | `make verify`                | Yes              |
