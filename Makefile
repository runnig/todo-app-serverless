.PHONY: help dev build lint lint-fast format format-check typecheck test test-unit test-integration test-watch test-integration-full verify db-start db-stop db-reset db-seed db-generate db-migrate db-push db-studio supabase-init setup clean install

DATABASE_URL:="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
NEXT_PUBLIC_SUPABASE_URL:="http://localhost:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY:="sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"

VARS = \
  DATABASE_URL=$(DATABASE_URL) \
  NEXT_PUBLIC_SUPABASE_URL=$(NEXT_PUBLIC_SUPABASE_URL) \
  NEXT_PUBLIC_SUPABASE_ANON_KEY=$(NEXT_PUBLIC_SUPABASE_ANON_KEY)


help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# --- Development ---

dev: ## Start Next.js dev server
	npm run dev

build: ## Build the Next.js production bundle
	npm run build

# --- Testing ---

test: test-unit test-integration ## Run all tests

test-unit: ## Run unit tests only
	npm run test:unit

test-integration: ## Run integration tests (requires local Supabase running)
	npm run test:integration

test-watch: ## Run tests in watch mode
	npm run test:watch

# --- Code Quality ---

lint: ## Run ESLint
	npx eslint

lint-fast: ## Run Oxlint for a fast lint pass
	npx run lint:fast

typecheck: ## Run TypeScript type checking
	npm run typecheck

format: ## Format code with Prettier
	npx prettier --write "src/**/*.{ts,tsx}" "tests/**/*.{ts,tsx}"

format-check: ## Check formatting
	npx prettier --check "src/**/*.{ts,tsx}" "tests/**/*.{ts,tsx}"

verify: lint typecheck test-unit build ## Run all checks (lint, typecheck, unit tests, build)

# --- Database ---

db-start: ## Start local Supabase (Postgres + Auth)
	npx supabase start

db-stop: ## Stop local Supabase
	npx supabase stop

db-reset: ## Reset local database (applies all migrations)
	npx supabase db reset

db-seed: ## Seed local database with sample data
	$(VARS) npm run db:seed

db-generate: ## Generate Drizzle migration from schema changes
	npx drizzle-kit generate

db-migrate: ## Apply pending Drizzle migrations
	npx drizzle-kit migrate

db-push: ## Push schema changes to local DB (no migration file)
	npx drizzle-kit push

db-studio: ## Open Drizzle Studio (DB GUI)
	npx drizzle-kit studio

# --- Supabase ---

supabase-init: ## Initialize Supabase local config
	npx supabase init

# --- Full Integration Test Flow ---

test-integration-full: db-reset db-seed test-integration ## Reset DB, seed, and run integration tests

# --- Setup ---

setup: ## First-time setup: install deps, init Supabase, start DB, migrate, seed
	npm install
	npx supabase start
	npx drizzle-kit migrate
	npm run db:seed
	@echo "Setup complete! Run 'make dev' to start the development server."

clean:  ## clean node_modules
	rm -rf node_modules package-lock.json

install:  ## install node dependencies
	npm install
