# Query — CQRS Read Side

Query is responsible for **reading state only**.

It is the **single entry point for read operations** inside a feature module.

---

# Core Idea

Query = intent to read something

```text
Controller → QueryBus → QueryHandler → Repository
```

---

# Responsibilities

Query MUST:

- carry parameters needed to perform a read
- be a plain class with no logic
- be immutable (readonly properties)

QueryHandler MUST:

- fetch data via Repository
- throw `NotFoundException` if a single entity is not found
- return a typed result

---

# What Query / QueryHandler MUST NOT Do

Query is NOT allowed to:

- contain logic
- mutate any state

QueryHandler is NOT allowed to:

- write to the database
- call CommandBus
- emit events
- call other QueryHandlers

---

# Naming Convention

## Pattern

```text
Get[Entity|Entities][Qualifier?]Query
Get[Entity|Entities][Qualifier?]Handler
```

## What is `[Qualifier]`?

Optional suffix that narrows the read:

```text
ById / ByEmail / BySlug / WithRelations
```

## Examples

```text
GetAllTodos        → GetAllTodosQuery        + GetAllTodosHandler
GetTodoById        → GetTodoByIdQuery        + GetTodoByIdHandler
GetUserByEmail     → GetUserByEmailQuery     + GetUserByEmailHandler
```

✔ Always starts with `Get`  
✔ Query and Handler live in the same file  
✔ One query per read operation

---

# Generic List Query (Paginated)

```ts
export class GetAll[Entities]Query {
  constructor(
    public readonly page: number,
    public readonly limit: number,
  ) {}
}

@QueryHandler(GetAll[Entities]Query)
export class GetAll[Entities]Handler implements IQueryHandler<
  GetAll[Entities]Query,
  PaginatedResult<[Entity]>
> {
  constructor(private readonly repository: [Name]Repository) {}

  execute(query: GetAll[Entities]Query): Promise<PaginatedResult<[Entity]>> {
    return this.repository.findAll(query.page, query.limit);
  }
}
```

---

# Generic Single Entity Query

When fetching one entity — always verify it exists:

```ts
export class Get[Entity]ByIdQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(Get[Entity]ByIdQuery)
export class Get[Entity]ByIdHandler implements IQueryHandler<
  Get[Entity]ByIdQuery,
  [Entity]
> {
  constructor(private readonly repository: [Name]Repository) {}

  async execute(query: Get[Entity]ByIdQuery): Promise<[Entity]> {
    const item = await this.repository.findById(query.id);
    if (!item) {
      throw new NotFoundException(`[Entity] ${query.id} not found`);
    }
    return item;
  }
}
```

---

# File Structure

```text
queries/
  get-all-[entities].query.ts
  get-[entity]-by-id.query.ts
  index.ts
```

Each file contains **both** the Query class and its Handler.

---

# Barrel Exports — index.ts

```ts
// queries/index.ts

export { GetAll[Entities]Query } from './get-all-[entities].query';
export { Get[Entity]ByIdQuery } from './get-[entity]-by-id.query';

import { GetAll[Entities]Handler } from './get-all-[entities].query';
import { Get[Entity]ByIdHandler } from './get-[entity]-by-id.query';

export const QueryHandlers = [
  GetAll[Entities]Handler,
  Get[Entity]ByIdHandler,
];
```

---

# Module Registration

```ts
@Module({
  imports: [CqrsModule, RepositoriesModule],
  providers: [...QueryHandlers],
})
export class [Entity]Module {}
```

✔ `CqrsModule` must be imported  
✔ `QueryHandlers` array is spread into `providers`

---

# Where Queries Are Dispatched

```text
Controller ✅  ← dispatches via QueryBus
Service    ✅  ← dispatches via QueryBus
QueryHandler ❌  ← never dispatches other queries
```

```ts
// Controller usage
async findAll(@Query('page') page: number, @Query('limit') limit: number) {
  return this.queryBus.execute(new GetAllTodosQuery(page, limit));
}

async findOne(@Param('id') id: string) {
  return this.queryBus.execute(new GetTodoByIdQuery(id));
}
```

---

# Architecture Role

```text
Controller
  ↓
QueryBus.execute(new XxxQuery(...))
  ↓
QueryHandler
  ↓
Repository
  ↓
Database
```

---

# Return Types

| Operation        | Return Type                        |
| ---------------- | ---------------------------------- |
| list (paginated) | `Promise<PaginatedResult<Entity>>` |
| single by id     | `Promise<Entity>` (or throw)       |
| single optional  | `Promise<Entity \| null>`          |

---

# Query vs Command

|                 | Query             | Command            |
| --------------- | ----------------- | ------------------ |
| Intent          | read              | write              |
| Mutates state   | ❌                | ✅                 |
| Returns data    | ✅                | optional           |
| Throws NotFound | ✅ (single fetch) | ✅ (before mutate) |
| Bus             | `QueryBus`        | `CommandBus`       |

---

# Key Principles

## 1. Query = Data Bag

- no methods
- no logic
- only `readonly` constructor properties

---

## 2. Handler = Thin Reader

- fetch → check existence → return
- no writes, no side effects
- no direct DB calls (use Repository)

---

## 3. One Query = One Read Intent

- `GetTodoById` ≠ `GetTodoByIdWithRelations`
- keep queries granular and explicit

---

# Summary

- Query = immutable object describing a read intent
- Handler = thin executor that delegates to Repository
- Always throw `NotFoundException` when a single entity is not found
- One Query + Handler per read operation
- Register all handlers via `QueryHandlers` array in `index.ts`
