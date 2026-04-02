.PHONY: help dev build lint format format-check test test-unit test-integration test-watch test-integration-full db-start db-stop db-reset db-seed db-migrate db-push db-studio supabase-init setup

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

format: ## Format code with Prettier
	npx prettier --write "src/**/*.{ts,tsx}" "tests/**/*.{ts,tsx}"

format-check: ## Check formatting
	npx prettier --check "src/**/*.{ts,tsx}" "tests/**/*.{ts,tsx}"

# --- Database ---

db-start: ## Start local Supabase (Postgres + Auth)
	npx supabase start

db-stop: ## Stop local Supabase
	npx supabase stop

db-reset: ## Reset local database (applies all migrations)
	npx supabase db reset

db-seed: ## Seed local database with sample data
	npm run db:seed

db-migrate: ## Generate Drizzle migration from schema changes
	npx drizzle-kit generate

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
	npx drizzle-kit generate
	npx drizzle-kit migrate
	npm run db:seed
	@echo "Setup complete! Run 'make dev' to start the development server."
