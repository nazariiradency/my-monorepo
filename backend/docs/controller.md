# Controller — HTTP Layer

Controller is responsible for **handling HTTP requests only**.

It is the **entry point** that maps routes to Commands and Queries.

# Naming Convention

## Pattern

```text
[Entity]sController
```

## Examples

```text
Todo  → TodosController
User  → UsersController
Order → OrdersController
```

✔ Always plural  
✔ Suffix `Controller`  
✔ One controller per entity

---

# Generic Controller Example

```ts
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
  update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: Update[Entity]Dto,
  ): Promise<[Entity]> {
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

# HTTP Method → Bus Mapping

| HTTP Method      | Bus          | Pattern                 |
| ---------------- | ------------ | ----------------------- |
| `@Post()`        | `CommandBus` | `Create[Entity]Command` |
| `@Get()`         | `QueryBus`   | `GetAll[Entities]Query` |
| `@Get(':id')`    | `QueryBus`   | `Get[Entity]ByIdQuery`  |
| `@Patch(':id')`  | `CommandBus` | `Update[Entity]Command` |
| `@Delete(':id')` | `CommandBus` | `Delete[Entity]Command` |

✔ Reads → `QueryBus`  
✔ Writes → `CommandBus`

---

# HTTP Status Codes

| Operation        | Default Status | Override                           |
| ---------------- | -------------- | ---------------------------------- |
| `@Post()`        | `201 Created`  | —                                  |
| `@Get()`         | `200 OK`       | —                                  |
| `@Get(':id')`    | `200 OK`       | —                                  |
| `@Patch(':id')`  | `200 OK`       | `@HttpCode(HttpStatus.NO_CONTENT)` |
| `@Delete(':id')` | `200 OK`       | `@HttpCode(HttpStatus.NO_CONTENT)` |

✔ Always add `@HttpCode(HttpStatus.NO_CONTENT)` on `update` and `delete`

---

# Input Extraction

## `@Body()` — request body for writes

```ts
@Post()
create(@Body() dto: CreateTodoDto): Promise<Todo> {
  return this.commandBus.execute(new CreateTodoCommand(dto.title));
}
```

## `@Query()` — query string for list reads

```ts
@Get()
findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResult<Todo>> {
  return this.queryBus.execute(new GetAllTodosQuery(query.page, query.limit));
}
```

## `@Param()` — route param, always with `ParseUuidPipe`

```ts
@Get(':id')
findOne(@Param('id', ParseUuidPipe) id: string): Promise<Todo> {
  return this.queryBus.execute(new GetTodoByIdQuery(id));
}
```

✔ Always use `ParseUuidPipe` for `:id` params — validates UUID format before reaching the handler

---

# Module Registration

```ts
@Module({
  imports: [CqrsModule, RepositoriesModule],
  controllers: [[Entity]sController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class [Entity]Module {}
```

---

# What Controller Does NOT Do

```ts
// ❌ Never call repository directly
constructor(private readonly repository: TodosRepository) {}

// ❌ Never add logic
if (dto.title.length > 100) { ... }

// ❌ Never transform response
return { ...todo, fullTitle: `[${todo.id}] ${todo.title}` };

// ❌ Never catch exceptions here (use global filters)
try { ... } catch (e) { ... }
```
