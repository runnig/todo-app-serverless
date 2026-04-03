# Deployment Guide

Production deployment for the todo-app-serverless: **Vercel** (hosting), **Supabase Cloud** (database + auth), **GitHub Actions** (CI/CD).

CI/CD workflows are pre-configured in `.github/workflows/`. This guide covers the manual setup a human operator needs to perform.

---

## 1. Create a Supabase Cloud Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name:** e.g. `todo-app-production`
   - **Database Password:** generate a strong password — **save it, you'll need it later**
   - **Region:** closest to your users
4. Leave **"Enable RLS"** disabled — the app uses Drizzle ORM with a direct Postgres connection that bypasses RLS; auth protection is handled at the Next.js middleware level
5. Wait ~2 minutes for provisioning
6. Go to **Settings → General** and note the **Project ID** (also called "Reference ID")

## 2. Link Local Project and Push Migrations

Run these commands in the repo root:

```bash
npx supabase login                          # opens browser to authenticate
npx supabase link --project-ref <PROJECT_ID> # connects local supabase/ to cloud
npx supabase db push                         # applies migrations to cloud DB
```

After `db push`, verify in the Supabase dashboard → **Table Editor** that `profiles` and `todos` tables exist.

Then commit the link metadata:

```bash
git add supabase/.branches/
git commit -m "chore: link supabase cloud project"
```

## 3. Deploy to Vercel

### 3a. Install Vercel CLI and deploy

```bash
npm install -g vercel
vercel                    # follow prompts (use defaults)
```

The first deploy may fail because env vars aren't set yet — that's expected.

### 3b. Set environment variables

Set all 3 variables for the **Production** environment:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add DATABASE_URL production
```

When prompted, paste the values:

| Variable                        | Where to find it                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase dashboard → Settings → API → **Project URL** (`https://<ref>.supabase.co`)                                                                                                                                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API → **anon / public** key                                                                                                                                                         |
| `DATABASE_URL`                  | Supabase dashboard → Settings → Database → **Connection string** (URI mode). **Use the connection pooler URL** (port `6543`, host contains `pooler.supabase.com`). Replace `[YOUR-PASSWORD]` with your DB password. |

> **Why the pooler URL?** Vercel runs serverless functions that open many short-lived connections. The Supabase connection pooler (PgBouncer on port 6543) prevents exhausting the database's connection limit. Do not use the direct connection (port 5432).

### 3c. Redeploy with env vars

```bash
vercel --prod
```

Visit the deployment URL. You should see the login page.

## 4. Configure Supabase Auth URLs

In the Supabase dashboard → **Authentication → URL Configuration**:

- Set **Site URL** to your Vercel URL (e.g. `https://todo-app-serverless.vercel.app`)
- Add that same URL to **Redirect URLs**

This ensures Supabase Auth redirects users back to your app after login/signup instead of rejecting the callback.

## 5. Verify the Production App

Test these flows:

1. Sign up a new user
2. Confirm the user appears in Supabase dashboard → Authentication → Users
3. Confirm a `profiles` row was auto-created (Table Editor → `profiles`)
4. Create a todo, mark it done, delete it
5. Log out and log back in

## 6. Configure GitHub Actions Secrets

Go to [GitHub repo settings → Secrets → Actions](https://github.com/runnig/todo-app-serverless/settings/secrets/actions) and add these 5 secrets:

| Secret                  | Where to get it                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `SUPABASE_ACCESS_TOKEN` | Supabase dashboard → Account (top-left avatar) → Access Tokens → Generate new token |
| `SUPABASE_DB_PASSWORD`  | The database password you set in step 1                                             |
| `VERCEL_TOKEN`          | Vercel dashboard → Settings → Tokens → Create                                       |
| `VERCEL_ORG_ID`         | Run `cat .vercel/project.json` locally → copy `orgId`                               |
| `VERCEL_PROJECT_ID`     | Run `cat .vercel/project.json` locally → copy `projectId`                           |

Once these secrets are set, the CI/CD workflows will work:

- **CI workflow** (`.github/workflows/ci.yml`) — runs lint, typecheck, unit tests, and build on every PR and push to `main`
- **Deploy workflow** (`.github/workflows/deploy.yml`) — pushes Supabase migrations and deploys to Vercel on every push to `main`

## 7. Verify CI/CD Pipeline

1. Create a test branch: `git checkout -b test/ci-pipeline`
2. Make a trivial change, commit, and push
3. Open a PR against `main`
4. Verify the **CI** workflow runs on the PR (green check)
5. Merge the PR
6. Verify the **Deploy** workflow runs and the app is updated on Vercel
