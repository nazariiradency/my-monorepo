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

---

# Step 1 — Add Prisma Model

→ See [prisma-schema.md](./prisma-schema.md)

Add the model to `prisma/schema.prisma`:

```prisma
model [Entity] {
  id        String   @id @default(uuid())
  // domain fields
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("[entities]")
}
```

Then run:

```bash
npx prisma migrate dev --name add-[entity]
npx prisma generate
```

---

# Step 2 — Define Interface & DTOs

→ See [dto-interfaces.md](./dto-interfaces.md)

**Interface** — mirrors the Prisma model exactly:

```ts
// interfaces/[entity].interface.ts
export interface [Entity] {
  id: string;
  // domain fields
  createdAt: Date;
  updatedAt: Date;
}
```

**Create DTO** — all fields required:

```ts
// dto/create-[entity].dto.ts
export class Create[Entity]Dto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;
}
```

**Update DTO** — all fields optional:

```ts
// dto/update-[entity].dto.ts
export class Update[Entity]Dto {
  @IsString()
  @IsOptional()
  title?: string;
}
```

---

# Step 3 — Create Repository

→ See [repository.md](./repository.md)

```ts
// infra/repositories/[entities].repository.ts
@Injectable()
export class [Entity]sRepository {
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
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  findById(id: string): Promise<[Entity] | null> {
    return this.prisma.[entity].findUnique({ where: { id } });
  }

  create(data: Create[Entity]Dto): Promise<[Entity]> {
    return this.prisma.[entity].create({ data });
  }

  update(id: string, data: Update[Entity]Dto): Promise<[Entity]> {
    return this.prisma.[entity].update({ where: { id }, data });
  }

  delete(id: string): Promise<[Entity]> {
    return this.prisma.[entity].delete({ where: { id } });
  }
}
```

Export from `infra/repositories/index.ts`:

```ts
export { [Entity]sRepository } from './[entities].repository';
```

---

# Step 4 — Create Commands

→ See [command.md](./command.md)

```ts
// commands/create-[entity].command.ts
export class Create[Entity]Command {
  constructor(public readonly data: Create[Entity]Dto) {}
}

@CommandHandler(Create[Entity]Command)
export class Create[Entity]Handler implements ICommandHandler<Create[Entity]Command, [Entity]> {
  constructor(private readonly repository: [Entity]sRepository) {}

  execute(command: Create[Entity]Command): Promise<[Entity]> {
    return this.repository.create(command.data);
  }
}
```

```ts
// commands/update-[entity].command.ts
export class Update[Entity]Command {
  constructor(public readonly id: string, public readonly data: Update[Entity]Dto) {}
}

@CommandHandler(Update[Entity]Command)
export class Update[Entity]Handler implements ICommandHandler<Update[Entity]Command, [Entity]> {
  constructor(private readonly repository: [Entity]sRepository) {}

  async execute(command: Update[Entity]Command): Promise<[Entity]> {
    const existing = await this.repository.findById(command.id);
    if (!existing) throw new NotFoundException(`[Entity] ${command.id} not found`);
    return this.repository.update(command.id, command.data);
  }
}
```

```ts
// commands/delete-[entity].command.ts
export class Delete[Entity]Command {
  constructor(public readonly id: string) {}
}

@CommandHandler(Delete[Entity]Command)
export class Delete[Entity]Handler implements ICommandHandler<Delete[Entity]Command, void> {
  constructor(private readonly repository: [Entity]sRepository) {}

  async execute(command: Delete[Entity]Command): Promise<void> {
    const existing = await this.repository.findById(command.id);
    if (!existing) throw new NotFoundException(`[Entity] ${command.id} not found`);
    await this.repository.delete(command.id);
  }
}
```

Barrel `commands/index.ts`:

```ts
export { Create[Entity]Command } from './create-[entity].command';
export { Update[Entity]Command } from './update-[entity].command';
export { Delete[Entity]Command } from './delete-[entity].command';

import { Create[Entity]Handler } from './create-[entity].command';
import { Update[Entity]Handler } from './update-[entity].command';
import { Delete[Entity]Handler } from './delete-[entity].command';

export const CommandHandlers = [Create[Entity]Handler, Update[Entity]Handler, Delete[Entity]Handler];
```

---

# Step 5 — Create Queries

→ See [query.md](./query.md)

```ts
// queries/get-all-[entities].query.ts
export class GetAll[Entities]Query {
  constructor(public readonly page: number, public readonly limit: number) {}
}

@QueryHandler(GetAll[Entities]Query)
export class GetAll[Entities]Handler implements IQueryHandler<GetAll[Entities]Query, PaginatedResult<[Entity]>> {
  constructor(private readonly repository: [Entity]sRepository) {}

  execute(query: GetAll[Entities]Query): Promise<PaginatedResult<[Entity]>> {
    return this.repository.findAll(query.page, query.limit);
  }
}
```

```ts
// queries/get-[entity]-by-id.query.ts
export class Get[Entity]ByIdQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(Get[Entity]ByIdQuery)
export class Get[Entity]ByIdHandler implements IQueryHandler<Get[Entity]ByIdQuery, [Entity]> {
  constructor(private readonly repository: [Entity]sRepository) {}

  async execute(query: Get[Entity]ByIdQuery): Promise<[Entity]> {
    const item = await this.repository.findById(query.id);
    if (!item) throw new NotFoundException(`[Entity] ${query.id} not found`);
    return item;
  }
}
```

Barrel `queries/index.ts`:

```ts
export { GetAll[Entities]Query } from './get-all-[entities].query';
export { Get[Entity]ByIdQuery } from './get-[entity]-by-id.query';

import { GetAll[Entities]Handler } from './get-all-[entities].query';
import { Get[Entity]ByIdHandler } from './get-[entity]-by-id.query';

export const QueryHandlers = [GetAll[Entities]Handler, Get[Entity]ByIdHandler];
```

---

# Step 6 — Create Controller

→ See [controller.md](./controller.md)

```ts
// [entities].controller.ts
@Controller('[entities]')
export class [Entity]sController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  create(@Body() dto: Create[Entity]Dto): Promise<[Entity]> {
    return this.commandBus.execute(new Create[Entity]Command(dto));
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResult<[Entity]>> {
    return this.queryBus.execute(new GetAll[Entities]Query(query.page, query.limit));
  }

  @Get(':id')
  findOne(@Param('id', ParseUuidPipe) id: string): Promise<[Entity]> {
    return this.queryBus.execute(new Get[Entity]ByIdQuery(id));
  }

  @Patch(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  update(@Param('id', ParseUuidPipe) id: string, @Body() dto: Update[Entity]Dto): Promise<[Entity]> {
    return this.commandBus.execute(new Update[Entity]Command(id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseUuidPipe) id: string): Promise<void> {
    return this.commandBus.execute(new Delete[Entity]Command(id));
  }
}
```

---

# Step 7 — Create Feature Module

```ts
// [entities].module.ts
@Module({
  imports: [CqrsModule, RepositoriesModule],
  controllers: [[Entity]sController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class [Entity]sModule {}
```

---

# Step 8 — Register in AppModule

→ See [app-module.md](./app-module.md)

```ts
// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    DatabaseModule,
    [Entity]sModule, // ← add here
  ],
})
export class AppModule {}
```

---

# Full Data Flow

```text
HTTP Request
  ↓
[Entity]sController   (@Body / @Param / @Query)
  ↓
CommandBus / QueryBus
  ↓
CommandHandler / QueryHandler
  ↓
[Entity]sRepository
  ↓
PrismaService
  ↓
PostgreSQL
```

---

# Checklist

```text
[ ] prisma model added + migrated + generated
[ ] interface created
[ ] create DTO + update DTO created
[ ] repository created + exported from infra/repositories/index.ts
[ ] commands created + CommandHandlers barrel exported
[ ] queries created + QueryHandlers barrel exported
[ ] controller created
[ ] feature module created
[ ] feature module imported in AppModule
```
