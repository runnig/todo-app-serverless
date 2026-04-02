# TODO App — Design Spec

See [docs/detailed-design.md](../../detailed-design.md) for the full design document.

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Cloud provider | Supabase (all-in-one) | User preference, covers DB + Auth + hosting |
| Frontend | Next.js 14 (App Router) | Best DX for serverless, largest ecosystem |
| Styling | Tailwind CSS + Shadcn/ui | Utility-first + polished components |
| Backend | Next.js API Routes | Serverless, colocated with frontend |
| Database | Supabase Postgres | Standard SQL, generous free tier |
| ORM | Drizzle ORM | Lightweight, type-safe, no code generation |
| Auth | Supabase Auth SDK | Zero custom auth code, handles all flows |
| Validation | Zod | Runtime validation + TypeScript types |
| Testing | Vitest + RTL | Fast, native ESM, good Next.js support |
| Deployment | Supabase | One platform for everything |
