# Database — Prisma + PostgreSQL

## Prisma Setup

- Schema: `apps/[app-name]/src/infra/prisma/schema.prisma`
- Config: `apps/[app-name]/src/infra/prisma/prisma.config.ts` (Prisma v7)
- `PrismaService` extends `PrismaClient`, provided globally via `DatabaseModule`
- Never instantiate `PrismaClient` directly — inject `PrismaService`

```ts
// infra/database/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}

// infra/database/database.module.ts
@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class DatabaseModule {}
```

---

## Repository Layer

Every feature has a repository under `src/infra/repositories/`. Repositories are the **only** place that uses `PrismaService`. Command/query handlers inject repositories, not `PrismaService` directly.

```ts
// infra/repositories/[feature].repository.ts
@Injectable()
export class XxxRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(page: number, limit: number): Promise<PaginatedResult<Xxx>> {
    // use $transaction for count + findMany together
  }

  findById(id: string): Promise<Xxx | null> {
    return this.prisma.xxx.findUnique({ where: { id } });
  }

  create(data: CreateXxxDto): Promise<Xxx> {
    return this.prisma.xxx.create({ data });
  }

  update(id: string, data: UpdateXxxDto): Promise<Xxx> {
    return this.prisma.xxx.update({ where: { id }, data });
  }

  delete(id: string): Promise<Xxx> {
    return this.prisma.xxx.delete({ where: { id } });
  }
}
```

Register all repositories in `RepositoriesModule` and export them.

---

## Migration Commands

```bash
pnpm [app]:prisma:format     # format schema
pnpm [app]:prisma:migrate    # generate + apply migration (dev)
pnpm [app]:prisma:generate   # regenerate client after schema change
pnpm [app]:prisma:reset      # drop + re-apply all migrations (dev only)
pnpm [app]:prisma:seed       # seed — must run explicitly
```

---

## Adding a New Model

1. Add the model to `schema.prisma`
2. `pnpm [app]:prisma:migrate`
3. `pnpm [app]:prisma:generate`
4. Create `src/infra/repositories/[feature].repository.ts`
5. Register it in `RepositoriesModule`

---

## Seeding (Prisma v7+)

Seed is configured in `prisma.config.ts` — **not** `package.json`. Never auto-runs — always explicit.

```ts
// prisma.config.ts
export default defineConfig({
  schema: 'apps/[app-name]/src/infra/prisma/schema.prisma',
  migrations: {
    path: 'apps/[app-name]/src/infra/prisma/migrations',
    seed: 'tsx apps/[app-name]/src/infra/prisma/seed.ts',
  },
  datasource: { url: env('DATABASE_URL') },
});
```

Always use `upsert` in seed files — `create` breaks on re-run:

```ts
await prisma.xxx.upsert({
  where: { id: 'seed-1' },
  update: {},
  create: { id: 'seed-1', name: 'Example' },
});
```

---

## Anti-Patterns

```ts
// ❌ PrismaClient directly                  → ✅ inject PrismaService
// ❌ PrismaService in command/query handlers → ✅ inject repository
// ❌ raw DDL via $executeRaw                 → ✅ pnpm [app]:prisma:migrate
// ❌ create() in seed scripts               → ✅ upsert()
// ❌ seed config in package.json            → ✅ prisma.config.ts migrations.seed
```
