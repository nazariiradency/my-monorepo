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

| File                                             | Topic                                                |
| ------------------------------------------------ | ---------------------------------------------------- |
| [CLAUDE.md](./CLAUDE.md)                         | Overview, project structure, conventions (this file) |
| [docs/database.md](./docs/database.md)           | Prisma setup, pgvector, migrations, adding models    |
| [docs/auth.md](./docs/auth.md)                   | Auth0, JwtAuthGuard, @Public(), @CurrentUser()       |
| [docs/bullmq.md](./docs/bullmq.md)               | BullMQ queues — producers, consumers, registration   |
| [docs/rabbitmq.md](./docs/rabbitmq.md)           | RabbitMQ — exchanges, publishing, listeners          |
| [docs/microservices.md](./docs/microservices.md) | Microservice rules, inter-service communication      |
| [docs/validation.md](./docs/validation.md)       | DTOs, class-validator, ValidationPipe                |
| [docs/config.md](./docs/config.md)               | Typed config factories, environment variables        |
| [docs/conventions.md](./docs/conventions.md)     | Controllers, services, anti-patterns                 |

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

---

## main.ts Bootstrap

```ts
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import {
  AppConfig,
  HttpExceptionFilter,
  LoggingInterceptor,
  TransformInterceptor,
} from '@app/shared';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true })
  );

  const configService = app.get(ConfigService);
  const appConfig = configService.get<AppConfig>('app')!;

  app.enableCors({ origin: appConfig.corsOrigins, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor()
  );
  app.setGlobalPrefix(appConfig.globalPrefix);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API')
    .setDescription('Backend REST API')
    .setVersion('1.0')
    .build();

  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig)
  );

  await app.listen(appConfig.port, '0.0.0.0');
}
bootstrap();
```
