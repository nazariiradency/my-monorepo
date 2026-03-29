# Backend Project Guide

## Quick Project Overview

**Framework**: NestJS 11 + Fastify
**Database**: PostgreSQL via Prisma 7
**Architecture**: CQRS (Command/Query Responsibility Segregation)
**Shared library**: `@app/shared` — filters, interceptors, pipes, decorators, DTOs, types

## Core Technology Stack

- **Language**: TypeScript 5+
- **Framework**: NestJS 11 with `@nestjs/platform-fastify`
- **Pattern**: CQRS via `@nestjs/cqrs` (CommandBus + QueryBus)
- **ORM**: Prisma 7 (PostgreSQL + @prisma/adapter-pg)
- **Validation**: `class-validator` + `class-transformer`
- **Config**: `@nestjs/config` with typed config factory
- **API Docs**: Swagger (`@nestjs/swagger`) at `/docs`
- **Linting**: ESLint + Prettier

---

## Documentation Index

| File                                               | Topic                                                |
| -------------------------------------------------- | ---------------------------------------------------- |
| [CLAUDE.md](./CLAUDE.md)                           | Overview, project structure, conventions (this file) |
| [docs/app-module.md](./docs/app-module.md)         | AppModule — root application module                  |
| [docs/auth.md](./docs/auth.md)                     | Auth — JWT guards, @Public(), @CurrentUser()         |
| [docs/command.md](./docs/command.md)               | CQRS write side — commands and handlers              |
| [docs/config.md](./docs/config.md)                 | Typed config factories, environment variables        |
| [docs/controller.md](./docs/controller.md)         | HTTP layer — controllers                             |
| [docs/conventions.md](./docs/conventions.md)       | CQRS patterns, anti-patterns                         |
| [docs/dto-interfaces.md](./docs/dto-interfaces.md) | DTOs, input validation, domain contracts             |
| [docs/module-guide.md](./docs/module-guide.md)     | How to create a feature module                       |
| [docs/prisma-schema.md](./docs/prisma-schema.md)   | Prisma schema — database models                      |
| [docs/query.md](./docs/query.md)                   | CQRS read side — queries and handlers                |
| [docs/rabbitmq.md](./docs/rabbitmq.md)             | RabbitMQ — cross-service messaging                   |
| [docs/repository.md](./docs/repository.md)         | Repository — data access layer                       |
| [docs/shared.md](./docs/shared.md)                 | Shared library (@app/shared) — common primitives     |
| [docs/validation.md](./docs/validation.md)         | Validation — DTOs + class-validator                  |

---

## Project Structure

The backend is a **NestJS monorepo** managed by the NestJS CLI.

```
backend/
├── apps/
│   └── [app-name]/
│       └── src/
│           ├── main.ts                         # Bootstrap — Fastify, global pipes, filters, interceptors, Swagger
│           ├── app.module.ts                   # Root module
│           │
│           ├── infra/                          # Infrastructure layer
│           │   ├── database/
│           │   │   ├── database.module.ts      # Global DatabaseModule (@Global)
│           │   │   ├── prisma.service.ts       # PrismaService (extends PrismaClient)
│           │   │   └── index.ts
│           │   ├── prisma/
│           │   │   ├── schema.prisma           # Prisma schema
│           │   │   ├── prisma.config.ts        # Prisma v7 config (migrations + seed)
│           │   │   ├── seed.ts                 # Database seed script
│           │   │   ├── migrations/             # Migration history
│           │   │   └── generated/              # Generated Prisma client
│           │   └── repositories/
│           │       ├── [feature].repository.ts # Data access layer
│           │       ├── repositories.module.ts
│           │       └── index.ts
│           │
│           └── modules/                        # Feature modules (domain-driven)
│               └── [feature]/
│                   ├── index.ts
│                   ├── [feature].module.ts
│                   ├── [feature].controller.ts # HTTP layer — thin, delegates via buses
│                   ├── commands/               # Write-side: CQRS commands + handlers
│                   │   ├── [action]-[feature].command.ts
│                   │   └── index.ts
│                   ├── queries/                # Read-side: CQRS queries + handlers
│                   │   ├── get-[feature].query.ts
│                   │   └── index.ts
│                   ├── dto/
│                   │   ├── create-[feature].dto.ts
│                   │   ├── update-[feature].dto.ts
│                   │   └── index.ts
│                   └── interfaces/
│                       └── index.ts
│
└── libs/
    └── shared/
        └── src/
            ├── config/            # appConfig factory
            ├── decorators/        # @Trim()
            ├── dto/               # PaginationQueryDto
            ├── filters/           # HttpExceptionFilter
            ├── interceptors/      # LoggingInterceptor, TransformInterceptor
            ├── pipes/             # ParseUuidPipe
            └── types/             # ApiResponse, PaginatedResult
```

---

## Request Flow

```
HTTP Request
  → Fastify
    → ValidationPipe (class-validator on DTO)
      → Controller (thin — dispatch to CommandBus or QueryBus)
        → Command/Query Handler
          → Repository → PrismaService → PostgreSQL
        ← Handler returns domain object
      ← Controller returns response
    ← TransformInterceptor wraps in ApiResponse envelope
  ← HttpExceptionFilter formats errors
```

---

## Adding a New Feature Module

1. Create `src/modules/[feature]/` with the standard files (module, controller, commands/, queries/, dto/, interfaces/).
2. Create `src/infra/repositories/[feature].repository.ts`.
3. Register the repository in `RepositoriesModule`.
4. Add the Prisma model → run `pnpm [app]:prisma:migrate` → `pnpm [app]:prisma:generate`.
5. Register the feature module in `AppModule`.
