# DTO & Interfaces — Input Validation and Domain Contracts

DTO validates **incoming data**.  
Interface describes **domain entity shape**.

---

# Core Idea

```text
HTTP Request → DTO (validate & sanitize) → Command/Query → Interface (typed result)
```

---

# Two Separate Concerns

|                | DTO                   | Interface                       |
| -------------- | --------------------- | ------------------------------- |
| Purpose        | validate input        | describe entity shape           |
| Used in        | Controllers, Commands | Handlers, Repository, responses |
| Has decorators | ✅                    | ❌                              |
| Has logic      | ❌                    | ❌                              |

---

# DTO

## What is a DTO?

DTO (Data Transfer Object) = validated input from the outside world.

It sits at the **boundary** between HTTP and application logic.

---

## Responsibilities

DTO MUST:

- declare expected input fields
- apply validation decorators (`class-validator`)
- apply sanitization decorators (e.g. `@Trim()`)

DTO MUST NOT:

- contain business logic
- reference domain interfaces
- be used as a return type

---

## Naming Convention

```text
Create[Entity]Dto
Update[Entity]Dto
```

✔ Always suffixed with `Dto`  
✔ Prefix = the action it serves

---

## Create DTO Pattern

All fields are **required**:

```ts
export class Create[Entity]Dto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;
}
```

---

## Update DTO Pattern

All fields are **optional** (`@IsOptional()` + `?`):

```ts
export class Update[Entity]Dto {
  @Trim()
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
```

---

## Common Validation Decorators

| Decorator       | Purpose                   |
| --------------- | ------------------------- |
| `@IsString()`   | must be a string          |
| `@IsNotEmpty()` | must not be empty         |
| `@IsOptional()` | field may be absent       |
| `@IsBoolean()`  | must be boolean           |
| `@MaxLength(n)` | max string length         |
| `@IsEmail()`    | valid email format        |
| `@IsUUID()`     | valid UUID format         |
| `@Trim()`       | strip whitespace (custom) |

---

## Decorator Order Convention

Apply decorators **bottom to top** — most specific first:

```ts
@Trim()         // 1. sanitize
@IsString()     // 2. type check
@IsNotEmpty()   // 3. presence check
@MaxLength(255) // 4. constraint
title: string;
```

---

# Interface

## What is an Interface?

Interface = the **shape of a domain entity** as returned from the database.

It is the contract between Repository, Handlers, and Controllers.

---

## Responsibilities

Interface MUST:

- reflect the exact fields the database returns
- use precise types (`string`, `boolean`, `Date`)

Interface MUST NOT:

- have methods
- have optional fields (unless truly nullable in DB)
- contain validation logic

---

## Naming Convention

```text
[Entity]         → the entity itself
[Entity]WithX    → entity with a relation included
```

## Examples

```text
Todo
User
Order
TodoWithUser
```

✔ No suffix, no prefix — just the entity name  
✔ Matches Prisma model shape

---

## Interface Pattern

```ts
export interface [Entity] {
  id: string;
  // ... domain fields
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Real Example

```ts
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

# File Structure

```text
[entity]/
  dto/
    create-[entity].dto.ts
    update-[entity].dto.ts
    index.ts
  interfaces/
    [entity].interface.ts
    index.ts
```

---

# Barrel Exports

```ts
// dto/index.ts
export { Create[Entity]Dto } from './create-[entity].dto';
export { Update[Entity]Dto } from './update-[entity].dto';

// interfaces/index.ts
export type { [Entity] } from './[entity].interface';
```

---

# How They Work Together

```ts
// 1. Controller receives and validates input via DTO
@Post()
create(@Body() dto: CreateTodoDto) {
  return this.commandBus.execute(new CreateTodoCommand(dto.title));
}

// 2. Command carries raw validated values
export class CreateTodoCommand {
  constructor(public readonly title: string) {}
}

// 3. Handler delegates to Repository, returns typed Interface
execute(command: CreateTodoCommand): Promise<Todo> {
  return this.repository.create({ title: command.title });
}

// 4. Repository returns the Interface shape from DB
create(data: CreateTodoDto): Promise<Todo> {
  return this.prisma.todo.create({ data });
}
```

---

# Architecture Role

```text
HTTP Request
  ↓
DTO  ← validation & sanitization layer
  ↓
Command / Query
  ↓
Handler  → returns: Interface
  ↓
Repository  → returns: Interface
  ↓
Database
```

---

# Key Principles

## 1. DTO = Boundary Guard

- validates and sanitizes at the edge
- never leaks into domain logic

---

## 2. Interface = Source of Truth for Shape

- every handler and repository return type references it
- keeps types consistent across the feature

---

## 3. Never Mix Them

- DTO is not a return type
- Interface has no validation decorators

---

# Summary

- DTO = input validation at the HTTP boundary, one per write operation
- Interface = domain entity shape, used as return type everywhere
- DTO fields are required in Create, optional in Update
- Interface fields mirror the database model exactly
- They are separate concerns and must never be merged
