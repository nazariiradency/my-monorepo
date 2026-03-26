# Shared — Common Primitives Library (@app/shared)

Shared is a **reusable library** of cross-cutting concerns.

It is imported by any module that needs config, validation, pipes, filters, or decorators — without duplicating code.

---

# What Shared Contains

| Primitive    | Purpose                                    | Doc                           |
| ------------ | ------------------------------------------ | ----------------------------- |
| Config       | typed app configuration                    | [Config](#config)             |
| Decorators   | reusable property decorators               | [Decorators](#decorators)     |
| DTO          | shared input DTOs (e.g. pagination)        | [DTO](#dto)                   |
| Filters      | global exception filters                   | [Filters](#filters)           |
| Interceptors | cross-cutting request/response logic       | [Interceptors](#interceptors) |
| Pipes        | reusable input transformation & validation | [Pipes](#pipes)               |
| Types        | shared generic TypeScript types            | [Types](#types)               |

---

# File Structure

```text
libs/
  shared/
    src/
      config/
        app.config.ts
      decorators/
        trim.decorator.ts
      dto/
        pagination-query.dto.ts
      filters/
        http-exception.filter.ts
      interceptors/
        logging.interceptor.ts
      pipes/
        parse-uuid.pipe.ts
      types/
        paginated-result.type.ts
      index.ts           ← single barrel export
```

---

# Barrel Export — index.ts

Everything is re-exported from a single entry point:

```ts
// libs/shared/src/index.ts
export { default as appConfig } from './config/app.config';
export type { AppConfig } from './config/app.config';

export { Trim } from './decorators/trim.decorator';

export { PaginationQueryDto } from './dto/pagination-query.dto';

export { HttpExceptionFilter } from './filters/http-exception.filter';

export { LoggingInterceptor } from './interceptors/logging.interceptor';

export { ParseUuidPipe } from './pipes/parse-uuid.pipe';

export type { PaginatedResult } from './types/paginated-result.type';
```

Usage anywhere in the app:

```ts
import {
  appConfig,
  Trim,
  PaginationQueryDto,
  HttpExceptionFilter,
  LoggingInterceptor,
  ParseUuidPipe,
  type PaginatedResult,
} from '@app/shared';
```

---

# Config

## Purpose

Typed, factory-based configuration loaded from environment variables.

## Pattern

```ts
export interface [Name]Config {
  field: type;
}

export default registerAs('[namespace]', (): [Name]Config => ({
  field: process.env.FIELD ?? 'default',
}));
```

## Real Example

```ts
export interface AppConfig {
  port: number;
  globalPrefix: string;
  corsOrigins: string[];
}

export default registerAs(
  'app',
  (): AppConfig => ({
    port: parseInt(process.env.PORT ?? '3000', 10),
    globalPrefix: process.env.GLOBAL_PREFIX ?? 'api/v1',
    corsOrigins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:5173'],
  })
);
```

## Usage in AppModule

```ts
ConfigModule.forRoot({
  isGlobal: true,
  load: [appConfig],
});
```

## Usage in a Service

```ts
constructor(private readonly config: ConfigService) {}

const port = this.config.get<AppConfig>('app').port;
```

## Rules

✔ Always export both the factory (`default`) and the interface (named)  
✔ Always provide a fallback default for every field  
✔ Never use `process.env` directly outside of config factories  
✔ Use `parseInt` for numeric env vars — all env values are strings

---

# Decorators

## Purpose

Reusable property decorators for DTO sanitization.

## `@Trim()`

Strips leading and trailing whitespace from string fields before validation runs.

```ts
export const Trim = (): PropertyDecorator =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));
```

## Usage

```ts
export class CreateTodoDto {
  @Trim() // ← sanitize first
  @IsString()
  @IsNotEmpty()
  title: string;
}
```

## Rules

✔ Always place `@Trim()` as the first decorator on string fields  
✔ Safe on non-strings — passes through non-string values unchanged  
✔ Add new decorators here when the same transform is needed in 2+ DTOs

---

# DTO

## Purpose

Shared input DTOs used across multiple feature modules.

## `PaginationQueryDto`

Standard query string params for paginated list endpoints.

```ts
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}
```

## Key Details

| Field   | Default | Constraint         |
| ------- | ------- | ------------------ |
| `page`  | `1`     | min `1`            |
| `limit` | `10`    | min `1`, max `100` |

✔ `@Type(() => Number)` is required — query strings are always plain text, this coerces them to numbers before validation  
✔ Both fields have defaults — calling `GET /todos` without params returns page 1 with 10 items

## Usage in Controller

```ts
@Get()
findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResult<Todo>> {
  return this.queryBus.execute(new GetAllTodosQuery(query.page, query.limit));
}
```

---

# Filters

## Purpose

Global exception filter that intercepts `HttpException` and returns a consistent error shape.

## Error Response Shape

Every error in the application returns this structure:

```json
{
  "statusCode": 404,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/todos/abc",
  "message": "Todo abc not found"
}
```

## Pattern

```ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    // extract status, message, log, respond
  }
}
```

## What It Does

1. Extracts HTTP status from the exception
2. Extracts message (handles both string and object responses)
3. Logs `METHOD /path — status: message` via `Logger`
4. Returns a consistent JSON error body

## Registration in main.ts

```ts
app.useGlobalFilters(new HttpExceptionFilter());
```

✔ Register globally in `main.ts` — applies to every route automatically  
✔ Never register per-controller — that defeats the purpose

## Rules

✔ Never catch exceptions in controllers — let them bubble to this filter  
✔ Always throw `HttpException` subclasses (`NotFoundException`, `BadRequestException`, etc.) — they are handled here  
✔ Unhandled errors (non-`HttpException`) fall through as `500 Internal Server Error`

---

# Interceptors

## Purpose

Cross-cutting logic that wraps every request/response cycle — runs before and after the handler.

Add to this folder anything that needs to observe or transform the request pipeline uniformly across all routes.

## `LoggingInterceptor`

Logs the incoming request and the outgoing response with elapsed time.

```ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // logs "→ METHOD /url" before handler
    // logs "← METHOD /url +Xms" after handler
  }
}
```

Log output:

```text
→ POST /api/v1/todos
← POST /api/v1/todos +12ms
```

## Registration in main.ts

```ts
app.useGlobalInterceptors(new LoggingInterceptor());
```

✔ Register globally in `main.ts` — applies to every route automatically  
✔ Never register per-controller

## Rules

✔ Interceptors in shared must be stateless and route-agnostic  
✔ Use `tap()` for side effects (logging) — never modify the response stream here  
✔ Feature-specific interceptors (e.g. response transform for one module) stay inside the feature

---

# Pipes

## Purpose

Reusable input transformation and validation applied to route params, query strings, or body fields before they reach the handler.

Add to this folder any pipe that is used in 2+ controllers.

## `ParseUuidPipe`

Validates that a route param is a valid UUID. Throws `BadRequestException` immediately if not.

```ts
@Injectable()
export class ParseUuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!UUID_REGEX.test(value)) {
      throw new BadRequestException(`"${value}" is not a valid UUID`);
    }
    return value;
  }
}
```

## Usage

```ts
@Get(':id')
findOne(@Param('id', ParseUuidPipe) id: string): Promise<Todo> { ... }

@Delete(':id')
delete(@Param('id', ParseUuidPipe) id: string): Promise<void> { ... }
```

✔ Always apply to every `:id` route param — fails fast before the handler runs  
✔ Returns the original value unchanged if valid — no transformation, only validation

## Rules

✔ Pipes in shared must be stateless and generic  
✔ Never hardcode entity names or messages inside shared pipes  
✔ Feature-specific pipes stay inside the feature

---

# Types

## Purpose

Shared generic TypeScript types and interfaces used as return types across repositories, handlers, and controllers.

Add to this folder any type that appears in the signature of 2+ files across different modules.

## `PaginatedResult<T>`

Standard return shape for all paginated list operations.

```ts
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

## Usage

```ts
// Repository
findAll(page: number, limit: number): Promise<PaginatedResult<Todo>>

// QueryHandler
execute(query: GetAllTodosQuery): Promise<PaginatedResult<Todo>>

// Controller
findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResult<Todo>>
```

✔ Always import as a type: `import type { PaginatedResult } from '@app/shared'`  
✔ The generic `<T>` keeps it reusable across all entities — never create entity-specific paginated types

---
