# Conventions

## CQRS Pattern

Controllers dispatch writes to `CommandBus` and reads to `QueryBus`. All business logic and data access live in handlers and repositories.

```
Controller → CommandBus.execute(new CreateXxxCommand(...)) → CreateXxxHandler → XxxRepository
Controller → QueryBus.execute(new GetXxxQuery(...))        → GetXxxHandler    → XxxRepository
```

---

## Controllers Are Thin

Map HTTP → bus dispatch. No business logic, no repository access, no branching.

```ts
@Post()
create(@Body() dto: CreateXxxDto): Promise<Xxx> {
  return this.commandBus.execute(new CreateXxxCommand(dto));
}

@Get()
findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResult<Xxx>> {
  return this.queryBus.execute(new GetAllXxxQuery(query.page, query.limit));
}

@Get(':id')
findOne(@Param('id', ParseUuidPipe) id: string): Promise<Xxx> {
  return this.queryBus.execute(new GetXxxByIdQuery(id));
}

@Patch(':id')
@HttpCode(HttpStatus.NO_CONTENT)
update(@Param('id', ParseUuidPipe) id: string, @Body() dto: UpdateXxxDto) {
  return this.commandBus.execute(new UpdateXxxCommand(id, dto));
}

@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)
delete(@Param('id', ParseUuidPipe) id: string): Promise<void> {
  return this.commandBus.execute(new DeleteXxxCommand(id));
}
```

---

## Command Handlers

Own write operations. Inject the repository, throw domain exceptions when needed.

```ts
export class CreateXxxCommand {
  constructor(public readonly dto: CreateXxxDto) {}
}

@CommandHandler(CreateXxxCommand)
export class CreateXxxHandler implements ICommandHandler<CreateXxxCommand> {
  constructor(private readonly xxxRepository: XxxRepository) {}

  execute(command: CreateXxxCommand): Promise<Xxx> {
    return this.xxxRepository.create(command.dto);
  }
}
```

---

## Query Handlers

Own read operations. Throw `NotFoundException` when a resource is not found.

```ts
export class GetXxxByIdQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetXxxByIdQuery)
export class GetXxxByIdHandler implements IQueryHandler<GetXxxByIdQuery> {
  constructor(private readonly xxxRepository: XxxRepository) {}

  async execute(query: GetXxxByIdQuery): Promise<Xxx> {
    const item = await this.xxxRepository.findById(query.id);
    if (!item) throw new NotFoundException(`${query.id} not found`);
    return item;
  }
}
```

---

## Naming Conventions

| Thing      | Pattern                         | Example                    |
| ---------- | ------------------------------- | -------------------------- |
| Module     | `[feature].module.ts`           | `orders.module.ts`         |
| Controller | `[feature].controller.ts`       | `orders.controller.ts`     |
| Command    | `[action]-[feature].command.ts` | `create-order.command.ts`  |
| Query      | `get-[feature].query.ts`        | `get-order-by-id.query.ts` |
| Create DTO | `create-[feature].dto.ts`       | `create-order.dto.ts`      |
| Update DTO | `update-[feature].dto.ts`       | `update-order.dto.ts`      |
| Repository | `[feature].repository.ts`       | `orders.repository.ts`     |
| Interface  | `[feature].interface.ts`        | `order.interface.ts`       |

---

## Anti-Patterns

```ts
// ❌ PrismaService directly in handlers    → ✅ inject the feature repository
// ❌ business logic or branching in controller → ✅ delegate to handler
// ❌ @Body() body: any                     → ✅ typed DTO with class-validator
// ❌ @Param('id') without ParseUuidPipe    → ✅ @Param('id', ParseUuidPipe)
// ❌ process.env in handlers               → ✅ typed config via ConfigService
// ❌ raw DDL in $executeRaw               → ✅ pnpm [app]:prisma:migrate
```
