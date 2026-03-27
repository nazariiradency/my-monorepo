# Shared — Common Primitives Library (@app/shared)

Reusable library of cross-cutting concerns imported by any feature module.

```text
@app/shared → any feature module
```

---

# File Structure

```text
libs/shared/src/
  config/         ← typed env config
  decorators/     ← DTO sanitization decorators
  dto/            ← shared input DTOs
  filters/        ← global exception filters
  interceptors/   ← global request/response wrappers
  pipes/          ← reusable param validators
  types/          ← shared generic TypeScript types
  index.ts
```

---

# Barrel Export

```ts
import {
  appConfig,
  type AppConfig,
  Trim,
  PaginationQueryDto,
  HttpExceptionFilter,
  LoggingInterceptor,
  ParseUuidPipe,
  type PaginatedResult,
} from '@app/shared';
```

✔ Always import from `@app/shared` — never from deep paths

---

# config/

Typed factory loaded from env. Registered once in `AppModule`.

```ts
export default registerAs(
  'app',
  (): AppConfig => ({
    port: parseInt(process.env.PORT ?? '3000', 10),
    globalPrefix: process.env.GLOBAL_PREFIX ?? 'api/v1',
  })
);

// AppModule
ConfigModule.forRoot({ isGlobal: true, load: [appConfig] });
```

✔ Never use `process.env` outside config factories

---

# decorators/

Property decorators for DTO sanitization — run before `class-validator`.

```ts
// Usage in DTO
@Trim()        // ← always first on string fields
@IsString()
@IsNotEmpty()
title: string;
```

---

# dto/

Shared DTOs used across multiple feature modules.

```ts
// PaginationQueryDto
@IsOptional() @Type(() => Number) @IsInt() @Min(1)
page: number = 1;

@IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
limit: number = 10;

// Usage in controller
findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResult<Todo>>
```

✔ `@Type(() => Number)` is required — query strings are always plain text

---

# filters/

Global exception filter. Registered in `main.ts`.

```ts
// main.ts
app.useGlobalFilters(new HttpExceptionFilter());

// Error response shape
{
  "statusCode": 404,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/todos/abc",
  "message": "Todo abc not found"
}
```

✔ Never register per-controller  
✔ Never catch exceptions in controllers — let them bubble here

---

# interceptors/

Cross-cutting request/response logic. Registered in `main.ts`.

```ts
// main.ts
app.useGlobalInterceptors(new LoggingInterceptor());

// Log output
→ POST /api/v1/todos
← POST /api/v1/todos +12ms
```

✔ Must be stateless and route-agnostic

---

# pipes/

Reusable param validation. Applied at controller level.

```ts
// Usage
@Get(':id')
findOne(@Param('id', ParseUuidPipe) id: string): Promise<Todo>

// Throws on invalid UUID
throw new BadRequestException(`"abc" is not a valid UUID`)
```

✔ Always apply `ParseUuidPipe` to every `:id` route param

---

# types/

Generic TypeScript types used as return types across repositories, handlers, and controllers.

```ts
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Usage
findAll(): Promise<PaginatedResult<Todo>>
execute(): Promise<PaginatedResult<Todo>>
```

✔ Import as a type: `import type { PaginatedResult } from '@app/shared'`

---

# Key Rules

✔ Add to shared only when used in **2+ modules**  
✔ No business logic — infrastructure utilities only  
✔ `filters/` and `interceptors/` → registered in `main.ts`  
✔ `pipes/` and `decorators/` → applied at controller/DTO level
