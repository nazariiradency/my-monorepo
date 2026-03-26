# Repository — Data Access Layer

Repository is responsible for **database access only**.

It is the **single source of truth for persistence** inside a service.

---

# Core Idea

Repository = abstraction over database

```text
CommandHandler → Repository → Database
```

---

# Responsibilities

Repository MUST:

- read data from DB
- write data to DB
- handle pagination
- return domain entities

---

# What Repository MUST NOT Do

Repository is NOT allowed to:

- contain business logic
- call other services
- emit events (RabbitMQ)
- use CommandBus / QueryBus

---

# Naming Convention

## Pattern

```ts
export class [Name]Repository {}
```

## What is `[Name]`?

`[Name]` = **domain entity name**

It represents **what data this repository works with**

---

## Examples

```text
Todo  → TodosRepository
User  → UsersRepository
Order → OrdersRepository
```

✔ Always plural
✔ One repository per entity

---

# Generic Repository Example

```ts
@Injectable()
export class [Name]Repository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number, limit: number): Promise<PaginatedResult<[Entity]>> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.[entity].findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.[entity].count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  findById(id: string): Promise<[Entity] | null> {
    return this.prisma.[entity].findUnique({
      where: { id },
    });
  }

  create(data: Create[Entity]Dto): Promise<[Entity]> {
    return this.prisma.[entity].create({
      data,
    });
  }

  update(id: string, data: Update[Entity]Dto): Promise<[Entity]> {
    return this.prisma.[entity].update({
      where: { id },
      data,
    });
  }

  delete(id: string): Promise<[Entity]> {
    return this.prisma.[entity].delete({
      where: { id },
    });
  }
}
```

---

# Where Repository is Used

```text
Controller ❌
CommandHandler ✅
QueryHandler ✅
```

---

# Correct Usage

```ts
@CommandHandler(Create[Entity]Command)
export class Create[Entity]Handler {
  constructor(private readonly repository: [Name]Repository) {}

  async execute(command: Create[Entity]Command) {
    return this.repository.create(command.data);
  }
}
```

---

# Pagination Pattern

```ts
type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
```

---

# Transactions

```ts
await this.prisma.$transaction([
  this.prisma.[entity].create(...),
  this.prisma.log.create(...),
]);
```

---

# Repository Module

```ts
@Module({
  providers: [[Name]Repository],
  exports: [[Name]Repository],
})
export class RepositoriesModule {}
```

---

# Architecture Role

```text
Controller
  ↓
CommandHandler / QueryHandler
  ↓
Repository
  ↓
Database
```

---

# Key Principles

## 1. Thin Layer

- no decisions
- no conditions
- just data access

---

## 2. One Responsibility

Repository = only persistence

---

## 3. No Side Effects

- no events
- no emails
- no jobs

---

# Summary

- Repository = DB access only
- One per entity
- No business logic
- No events
- No external calls

---

# Final Flow

```text
Controller
  ↓
CommandHandler
  ↓
Repository
  ↓
Database
  ↓
emit(event)
```
