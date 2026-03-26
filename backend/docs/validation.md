# Validation — DTOs + class-validator

## Global ValidationPipe

Registered once in `main.ts` — applies to every controller automatically:

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // strip fields not in DTO
    forbidNonWhitelisted: true, // throw if unknown fields sent
    transform: true, // auto-transform to DTO class instances
  })
);
```

---

## Writing DTOs

Every `@Body()` parameter must be a typed DTO class — never `any` or plain `object`.

```ts
// modules/[feature]/dto/create-[feature].dto.ts
export class CreateXxxDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Trim()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
```

Update DTOs always extend `PartialType` — never rewrite decorators manually:

```ts
// modules/[feature]/dto/update-[feature].dto.ts
export class UpdateXxxDto extends PartialType(CreateXxxDto) {}
```

---

## Shared from @app/shared

| Export               | Use for                                            |
| -------------------- | -------------------------------------------------- |
| `PaginationQueryDto` | `@Query()` on list endpoints                       |
| `ParseUuidPipe`      | Every `@Param('id')` that expects a UUID           |
| `@Trim()`            | String fields — strips leading/trailing whitespace |

```ts
@Get()
findAll(@Query() query: PaginationQueryDto) { ... }

@Get(':id')
findOne(@Param('id', ParseUuidPipe) id: string) { ... }
```

---

## Rules

- `@Body()` always a typed DTO — never `any`
- `@Param('id')` always uses `ParseUuidPipe`
- Update DTOs always use `PartialType`
- `@IsOptional()` only on genuinely optional fields, not to silence errors
- String fields should use `@Trim()` to prevent whitespace-only values

---

## Anti-Patterns

```ts
// ❌ @Post() create(@Body() body: any)
// ✅ @Post() create(@Body() dto: CreateXxxDto)

// ❌ export class UpdateXxxDto { @IsOptional() @IsString() name?: string }
// ✅ export class UpdateXxxDto extends PartialType(CreateXxxDto) {}

// ❌ @Get(':id') findOne(@Param('id') id: string)
// ✅ @Get(':id') findOne(@Param('id', ParseUuidPipe) id: string)
```
