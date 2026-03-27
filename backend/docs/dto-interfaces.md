# DTO & Interfaces — Input Validation and Domain Contracts

DTO validates **incoming data**.  
Interface describes **domain entity shape**.

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

## Naming Convention

```text
[Entity]         → the entity itself
[Entity]WithX    → entity with a relation included
```

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
