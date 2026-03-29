# How to Create a Feature Module

This document describes the full process of adding a new feature module from scratch.

Each section links to a dedicated primitive doc for details.

---

# Overview

A feature module consists of these primitives:

| Primitive       | Responsibility                            | Doc                                      |
| --------------- | ----------------------------------------- | ---------------------------------------- |
| Prisma Model    | database schema & table                   | [prisma-schema.md](./prisma-schema.md)   |
| DTO & Interface | input validation, entity shape            | [dto-interfaces.md](./dto-interfaces.md) |
| Repository      | database access layer                     | [repository.md](./repository.md)         |
| Commands        | write operations (create, update, delete) | [command.md](./command.md)               |
| Queries         | read operations (list, find by id)        | [query.md](./query.md)                   |
| Controller      | HTTP routes                               | [controller.md](./controller.md)         |
| AppModule       | root wiring                               | [app-module.md](./app-module.md)         |

---

# File Structure

```text
prisma/
  schema.prisma                         ← add model here

src/
  modules/
    [entities]/
      dto/
        create-[entity].dto.ts
        update-[entity].dto.ts
        index.ts
      interfaces/
        [entity].interface.ts
        index.ts
      commands/
        create-[entity].command.ts
        update-[entity].command.ts
        delete-[entity].command.ts
        index.ts
      queries/
        get-all-[entities].query.ts
        get-[entity]-by-id.query.ts
        index.ts
      [entities].controller.ts
      [entities].module.ts
  infra/
    repositories/
      [entities].repository.ts
      index.ts
  app.module.ts                         ← import new module here
```
