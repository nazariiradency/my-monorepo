# Config — Typed Config Factory

## Pattern

Every config domain uses `registerAs` to define a typed factory. Config lives in `libs/shared/src/config/` and is exported from `@app/shared`. Never read `process.env` inside handlers, repositories, or services.

```ts
// libs/shared/src/config/app.config.ts
export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  globalPrefix: process.env.GLOBAL_PREFIX ?? 'api/v1',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') ?? [
    'http://localhost:5173',
  ],
}));

export type AppConfig = ReturnType<typeof appConfig>;
```

---

## Register in AppModule

```ts
import { appConfig } from '@app/shared';

ConfigModule.forRoot({
  isGlobal: true,
  load: [appConfig],
});
```

Add additional config factories to `load: []` as new domains are introduced (e.g. `authConfig`, `redisConfig`).

---

## Accessing Config

In `main.ts` (before DI is available):

```ts
const configService = app.get(ConfigService);
const config = configService.get<AppConfig>('app')!;
```

In providers and services:

```ts
@Injectable()
export class XxxService {
  constructor(private readonly configService: ConfigService) {}

  someMethod() {
    const config = this.configService.get<AppConfig>('app')!;
    return config.port;
  }
}
```

---

## Adding a New Config Domain

1. Create `libs/shared/src/config/[domain].config.ts` with `registerAs`.
2. Export the factory and its type from `libs/shared/src/index.ts`.
3. Add it to `ConfigModule.forRoot({ load: [...] })` in `AppModule`.
4. Add the required env vars to `.env.example`.

---

## Environment Variables

```bash
PORT=3000
NODE_ENV=development
GLOBAL_PREFIX=api/v1
CORS_ORIGINS=http://localhost:5173
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb?schema=public
```

---

## Anti-Patterns

```ts
// ❌ process.env.PORT inside a service     → ✅ ConfigService.get<AppConfig>('app')
// ❌ hardcoded values (port = 3000)        → ✅ always read from config
// ❌ config factories defined per-app      → ✅ define in libs/shared, export from @app/shared
```
