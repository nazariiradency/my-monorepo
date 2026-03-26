# my-monorepo

A pnpm workspaces monorepo with a React frontend and a NestJS backend.

## Structure

```
/
├── backend/          # NestJS monorepo (apps/ + libs/)
├── frontend/         # React + Vite + TanStack Router
├── docker-compose.yml
└── package.json
```

---

## Prerequisites

- **Node.js** `>=24.10.0 <25.0.0`
- **pnpm** `10.32.1` — `npm install -g pnpm@10.32.1`
- **Docker** — required to run PostgreSQL

---

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Register git hooks (run once after cloning)
pnpm git:hooks:prepare

# 3. Copy and configure environment variables
cp backend/.env.example backend/.env

# 4. Start the database
docker compose up -d

# 5. Run migrations
pnpm dev:migrate

# 6. (Optional) Seed the database
pnpm dev:seed
```

> Re-run `pnpm git:hooks:prepare` any time the hooks config in `package.json` changes.

---

## Running the Apps

```bash
pnpm dev:frontend   # Vite dev server → http://localhost:5173
pnpm dev:<app>      # NestJS app in watch mode → http://localhost:3000/api/v1
                    # Swagger at http://localhost:3000/docs
```

### Adding a new backend app to the dev scripts

The backend is a NestJS monorepo — `backend/apps/` can contain multiple apps (HTTP services, microservices). Each app is a separate NestJS CLI project but shares the same `backend/package.json`.

To make an app runnable from the repo root, two steps are required:

**1. Add a per-app start script to `backend/package.json`:**

```json
"start:dev:<app>": "nest start <app> --watch"
```

`nest start <app>` targets the project by name as registered in `nest-cli.json`. Without a name it starts the default app (`sourceRoot` in `nest-cli.json`).

**2. Add a convenience alias to the root `package.json`:**

```json
"dev:<app>": "pnpm --filter backend start:dev:<app>"
```

`--filter backend` targets the `backend/` workspace package. The script name (`start:dev:<app>`) is then run inside it.

---

## Testing

```bash
pnpm test:frontend      # Vitest (React)
pnpm test:dashboard     # Jest — dashboard app only
```

### Backend (Jest)

Tests live next to the source files as `*.spec.ts` and are picked up automatically.

```bash
# From the repo root
pnpm test:dashboard          # run dashboard tests once
pnpm --filter backend test   # run all backend tests

# From inside backend/
cd backend
pnpm test             # all tests
pnpm test:watch       # watch mode
pnpm test:cov         # with coverage report
pnpm test:dashboard   # dashboard app only
```

---

## Linting

```bash
pnpm lint:editor     # EditorConfig compliance
pnpm lint:files      # File naming conventions
pnpm lint:format     # Prettier check
pnpm format          # Auto-fix formatting
pnpm lint:unused     # Unused exports and dependencies
```

---

## Committing

Enforces [Conventional Commits](https://www.conventionalcommits.org/) via commitlint.

```
<type>(<scope>): <subject>
```

**Types:** `feat` · `fix` · `docs` · `style` · `refactor` · `perf` · `test` · `build` · `ci` · `chore` · `revert`

**Scopes:** `root` · `frontend` · `backend` · `release`

Commits that do not match the format are rejected by the `commit-msg` hook.

---

## Database (Prisma)

Prisma scripts are defined per app in `backend/package.json` using the pattern `<app>:prisma:<action>`.

From the repo root:

```bash
pnpm --filter backend <app>:prisma:migrate
pnpm --filter backend <app>:prisma:seed
pnpm --filter backend <app>:prisma:generate
pnpm --filter backend <app>:prisma:reset
```

Or from inside `backend/`:

```bash
cd backend
pnpm <app>:prisma:migrate
```

---

## Docker

```bash
docker compose up -d     # start PostgreSQL
docker compose down -v   # stop and remove volumes
```

---

## Adding a Dependency

```bash
pnpm --filter frontend add <package>    # frontend
pnpm --filter backend add <package>     # backend
pnpm add -D <package> -w               # root dev dependency
```
