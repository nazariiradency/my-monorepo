# Monorepo Project Guide

## Structure

```
/
├── backend/                    # NestJS monorepo
│   ├── apps/                   # NestJS applications (HTTP services + microservices)
│   └── libs/
│       └── shared/             # Shared utilities — exported as @app/shared
│
├── frontend/                   # React frontend (Vite + TanStack Router)
│
├── pnpm-workspace.yaml
├── package.json                # Root scripts and dev dependencies
└── docker-compose.yml
```

---

## Workspace Config

```yaml
# pnpm-workspace.yaml
packages:
  - 'backend'
  - 'frontend'
```

Filter targets by the `name` field in each `package.json`:

- `backend` — the NestJS monorepo
- `frontend` — the React app

---

## Apps

### `frontend/`

Full guide: `docs/frontend/CLAUDE.md`

Stack: React + Vite + TanStack Router + TanStack Query + Zustand + React Hook Form + Zod + shadcn/ui + Tailwind

### `backend/`

Full guide: `docs/backend/CLAUDE.md`

A NestJS monorepo managed by the NestJS CLI.

- `apps/` — HTTP services and microservices, each independently deployable
- `libs/shared/` — decorators, filters, interceptors, pipes, DTOs, types (`@app/shared`)

Stack: NestJS 11 + Fastify + CQRS + Prisma 7 + PostgreSQL + `@nestjs/microservices`

---

## Common Commands

```bash
# Dev — root scripts per app (defined in root package.json)
pnpm dev:<app-name>

# Test
pnpm test:<app-name>

# Prisma — scripts defined in backend/package.json, prefixed by app name
pnpm --filter backend <app-name>:prisma:migrate
pnpm --filter backend <app-name>:prisma:seed

# Lint / format
pnpm lint:editor
pnpm lint:files
pnpm lint:format
pnpm format
pnpm lint:unused
```

Install a dependency:

```bash
pnpm --filter frontend add <package>
pnpm --filter backend add <package>
pnpm add -D <package> -w             # root dev dependency
```

---

## Adding a New Backend App

```bash
cd backend
nest generate app [name]
```

Each app has its own Prisma schema — never share schemas between apps.

## Adding a New Shared Library

```bash
cd backend
nest generate library [name]
```

Only add to `libs/` when used by two or more apps. Import via `@app/[name]`.
