# Database — Prisma + PostgreSQL

Prisma is the ORM for every app. Each app has its own schema, its own migrations, and its own generated client. Never share schemas between apps.

---

## Adding Database Support — Step by Step

---

### Step 1 — Install dependencies

```bash
pnpm --filter backend add prisma @prisma/client @prisma/adapter-pg
```

---

### Step 2 — Create the schema

Each app keeps its schema under `apps/[app-name]/src/infra/prisma/`. The generated client is output to a local `generated/` folder so each app has an isolated client.

```prisma
// apps/[app-name]/src/infra/prisma/schema.prisma
generator client {
  provider     = "prisma-client-js"
  output       = "./generated/prisma"
  moduleFormat = "cjs"
}

datasource db {
  provider = "postgresql"
}

model Product {
  id        String   @id @default(uuid())
  name      String
  price     Float
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("products")
}
```

---

### Step 3 — Create prisma.config.ts

Prisma v7 reads migration and seed config from `prisma.config.ts` — not from `package.json`.

```ts
// apps/[app-name]/src/infra/prisma/prisma.config.ts
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: './schema.prisma',
  migrations: {
    path: './migrations',
    seed: 'tsx apps/[app-name]/src/infra/prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

The `schema` and `migrations.path` are relative to the `prisma.config.ts` file itself.

---

### Step 4 — Add scripts to backend/package.json

Prefix every script with the app name to distinguish apps in the monorepo:

```json
{
  "scripts": {
    "[app]:prisma:format": "prisma format --config apps/[app-name]/src/infra/prisma/prisma.config.ts",
    "[app]:prisma:migrate": "prisma migrate dev --config apps/[app-name]/src/infra/prisma/prisma.config.ts",
    "[app]:prisma:generate": "prisma generate --config apps/[app-name]/src/infra/prisma/prisma.config.ts",
    "[app]:prisma:reset": "prisma migrate reset --config apps/[app-name]/src/infra/prisma/prisma.config.ts",
    "[app]:prisma:seed": "prisma db seed --config apps/[app-name]/src/infra/prisma/prisma.config.ts"
  }
}
```

Run from the workspace root with the `--filter backend` flag or directly inside `backend/`.

---

### Step 5 — Create PrismaService

`PrismaService` extends `PrismaClient` and uses `PrismaPg` as the driver adapter. It reads `DATABASE_URL` via `ConfigService` — never from `process.env` directly.

```ts
// apps/[app-name]/src/infra/database/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../prisma/generated/prisma';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: configService.getOrThrow<string>('DATABASE_URL'),
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

```ts
// apps/[app-name]/src/infra/database/index.ts
export { PrismaService } from './prisma.service';
export { DatabaseModule } from './database.module';
```

---

### Step 6 — Create DatabaseModule

`@Global()` makes `PrismaService` available everywhere without importing `DatabaseModule` in every feature module.

```ts
// apps/[app-name]/src/infra/database/database.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
```

Import `DatabaseModule` once in `AppModule` — that is all.

---

### Step 7 — Create a repository

Repositories are the **only** place that uses `PrismaService`. Command/query handlers inject repositories, never `PrismaService` directly.

```ts
// apps/[app-name]/src/infra/repositories/products.repository.ts
import { Injectable } from '@nestjs/common';
import { PaginatedResult } from '@app/shared';
import { PrismaService } from '../database';
import {
  CreateProductDto,
  UpdateProductDto,
  Product,
} from '../../modules/products';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    page: number,
    limit: number
  ): Promise<PaginatedResult<Product>> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count(),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  findById(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { id } });
  }

  create(data: CreateProductDto): Promise<Product> {
    return this.prisma.product.create({ data });
  }

  update(id: string, data: UpdateProductDto): Promise<Product> {
    return this.prisma.product.update({ where: { id }, data });
  }

  delete(id: string): Promise<Product> {
    return this.prisma.product.delete({ where: { id } });
  }
}
```

Use `$transaction([findMany, count])` for paginated queries — it runs both in one round-trip.

---

### Step 8 — Register in RepositoriesModule

```ts
// apps/[app-name]/src/infra/repositories/repositories.module.ts
import { Module } from '@nestjs/common';
import { ProductsRepository } from './products.repository';

@Module({
  providers: [ProductsRepository],
  exports: [ProductsRepository],
})
export class RepositoriesModule {}
```

Import `RepositoriesModule` in `AppModule`. Feature modules that need a repository import `RepositoriesModule`.

---

## Adding a New Model — Step by Step

1. Add the model to `schema.prisma`
2. `pnpm [app]:prisma:migrate` — creates and applies the migration
3. `pnpm [app]:prisma:generate` — regenerates the client
4. Create `src/infra/repositories/[feature].repository.ts`
5. Register it in `RepositoriesModule`

---

## Seed File

The seed script runs outside NestJS — instantiate `PrismaClient` directly with `PrismaPg`. Always use `upsert` so the script is safe to re-run.

```ts
// apps/[app-name]/src/infra/prisma/seed.ts
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.product.upsert({
    where: { id: 'seed-product-1' },
    update: {},
    create: { id: 'seed-product-1', name: 'Example product', price: 9.99 },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
```

Run with: `pnpm [app]:prisma:seed`

---

## Environment Variable

```bash
# .env
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb?schema=public
```

---

## Rules

- Never instantiate `PrismaClient` directly in app code — inject `PrismaService`.
- `PrismaService` is only used inside repositories — never in command/query handlers.
- Each app has its own `schema.prisma` and generated client — never share between apps.
- Use `$transaction([findMany, count])` for paginated queries.
- Seed scripts use `upsert` — `create` breaks on re-run.
- `prisma.config.ts` owns migration and seed config — not `package.json`.

---

## Anti-Patterns

```ts
// ❌ instantiate PrismaClient directly in app code
const prisma = new PrismaClient();
// ✅ inject PrismaService via constructor

// ❌ inject PrismaService in a command/query handler
@CommandHandler(CreateProductCommand)
export class CreateProductHandler {
  constructor(private readonly prisma: PrismaService) {} // ❌
}
// ✅ inject the repository: constructor(private readonly productsRepository: ProductsRepository)

// ❌ raw DDL via $executeRaw to alter schema
await this.prisma.$executeRaw`ALTER TABLE products ADD COLUMN sku TEXT`;
// ✅ add the field in schema.prisma → pnpm [app]:prisma:migrate

// ❌ create() in seed — fails on re-run
await prisma.product.create({ data: { name: 'Example' } });
// ✅ await prisma.product.upsert({ where: { id: 'seed-1' }, update: {}, create: { ... } })

// ❌ separate count query outside a transaction
const items = await this.prisma.product.findMany({ skip, take });
const total = await this.prisma.product.count(); // two round-trips
// ✅ await this.prisma.$transaction([findMany(...), count()])
```
