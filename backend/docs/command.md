# Command — CQRS Write Side

Command is responsible for **mutating state only**.

It is the **single entry point for write operations** inside a feature module.

---

# Core Idea

Command = intent to change something

```text
Controller → CommandBus → CommandHandler → Repository
```

---

# Responsibilities

Command MUST:

- carry data needed to perform an action
- be a plain class with no logic
- be immutable (readonly properties)

CommandHandler MUST:

- validate existence of entities (throw if not found)
- delegate persistence to Repository
- return a result or void

---

# What Command / CommandHandler MUST NOT Do

Command is NOT allowed to:

- contain business logic
- call services directly
- emit events (do it in the service layer above, if needed)

CommandHandler is NOT allowed to:

- call other CommandHandlers
- use QueryBus inside itself
- contain complex branching logic

---

# Naming Convention

## Pattern

```text
[Action][Entity]Command
[Action][Entity]Handler
```

## What is `[Action]`?

Use a verb that describes the mutation:

```text
Create / Update / Delete / Publish / Archive / Approve
```

## Examples

```text
CreateTodo   → CreateTodoCommand   + CreateTodoHandler
UpdateTodo   → UpdateTodoCommand   + UpdateTodoHandler
DeleteTodo   → DeleteTodoCommand   + DeleteTodoHandler
```

✔ Always `[Action][Entity]` — verb first, then entity  
✔ Command and Handler live in the same file  
✔ One command per operation

---

# Generic Command Example

```ts
export class Create[Entity]Command {
  constructor(public readonly data: Create[Entity]Dto) {}
}

@CommandHandler(Create[Entity]Command)
export class Create[Entity]Handler implements ICommandHandler<
  Create[Entity]Command,
  [Entity]
> {
  constructor(private readonly repository: [Name]Repository) {}

  execute(command: Create[Entity]Command): Promise<[Entity]> {
    return this.repository.create(command.data);
  }
}
```

---

# Command with Existence Check

When mutating or deleting — always verify the entity exists first:

```ts
export class Update[Entity]Command {
  constructor(
    public readonly id: string,
    public readonly data: Update[Entity]Dto,
  ) {}
}

@CommandHandler(Update[Entity]Command)
export class Update[Entity]Handler implements ICommandHandler<
  Update[Entity]Command,
  [Entity]
> {
  constructor(private readonly repository: [Name]Repository) {}

  async execute(command: Update[Entity]Command): Promise<[Entity]> {
    const existing = await this.repository.findById(command.id);
    if (!existing) {
      throw new NotFoundException(`[Entity] ${command.id} not found`);
    }
    return this.repository.update(command.id, command.data);
  }
}
```

---

# Delete Command Pattern

```ts
export class Delete[Entity]Command {
  constructor(public readonly id: string) {}
}

@CommandHandler(Delete[Entity]Command)
export class Delete[Entity]Handler implements ICommandHandler<
  Delete[Entity]Command,
  void
> {
  constructor(private readonly repository: [Name]Repository) {}

  async execute(command: Delete[Entity]Command): Promise<void> {
    const existing = await this.repository.findById(command.id);
    if (!existing) {
      throw new NotFoundException(`[Entity] ${command.id} not found`);
    }
    await this.repository.delete(command.id);
  }
}
```

---

# File Structure

```text
commands/
  create-[entity].command.ts
  update-[entity].command.ts
  delete-[entity].command.ts
  index.ts
```

Each file contains **both** the Command class and its Handler.

---

# Barrel Exports — index.ts

```ts
// commands/index.ts

export { Create[Entity]Command } from './create-[entity].command';
export { Update[Entity]Command } from './update-[entity].command';
export { Delete[Entity]Command } from './delete-[entity].command';

import { Create[Entity]Handler } from './create-[entity].command';
import { Update[Entity]Handler } from './update-[entity].command';
import { Delete[Entity]Handler } from './delete-[entity].command';

export const CommandHandlers = [
  Create[Entity]Handler,
  Update[Entity]Handler,
  Delete[Entity]Handler,
];
```

---

# Module Registration

```ts
@Module({
  imports: [CqrsModule, RepositoriesModule],
  providers: [...CommandHandlers],
})
export class [Entity]Module {}
```

✔ `CqrsModule` must be imported  
✔ `CommandHandlers` array is spread into `providers`

---

# Where Commands Are Dispatched

```text
Controller ✅  ← dispatches via CommandBus
Service    ✅  ← dispatches via CommandBus
CommandHandler ❌  ← never dispatches other commands
```

```ts
// Controller usage
async create(@Body() dto: CreateTodoDto) {
  return this.commandBus.execute(new CreateTodoCommand(dto.title));
}
```

---

# Architecture Role

```text
Controller
  ↓
CommandBus.execute(new XxxCommand(...))
  ↓
CommandHandler
  ↓
Repository
  ↓
Database
```

---

# Return Types

| Operation | Return Type       |
| --------- | ----------------- |
| create    | `Promise<Entity>` |
| update    | `Promise<Entity>` |
| delete    | `Promise<void>`   |

---

# Key Principles

## 1. Command = Data Bag

- no methods
- no logic
- only `readonly` constructor properties

---

## 2. Handler = Thin Orchestrator

- check existence → delegate → return
- no business rules
- no direct DB calls (use Repository)

---

## 3. One Command = One Intent

- `CreateTodo` ≠ `CreateOrUpdateTodo`
- keep commands granular and explicit

---

# Summary

- Command = immutable data object describing a write intent
- Handler = thin executor that delegates to Repository
- Always throw `NotFoundException` before mutating
- One Command + Handler per operation
- Register all handlers via `CommandHandlers` array in `index.ts`
