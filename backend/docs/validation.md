# Validation — DTOs + class-validator

Every incoming HTTP value is validated at the controller boundary. Nothing reaches a command handler unvalidated.

---

## How It Works

```
HTTP request
  → ValidationPipe (main.ts) — strips unknown fields, validates DTO
    → Controller — @Body() typed DTO, @Param() with ParseUuidPipe, @Query() PaginationQueryDto
      → CommandBus / QueryBus — handler receives already-validated values
```

---

## Adding Validation — Step by Step

---

### Step 1 — Confirm ValidationPipe is registered globally

Registered once in `main.ts` — applies to every controller automatically:

```ts
// apps/[app-name]/src/main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // strip fields not declared in the DTO
    forbidNonWhitelisted: true, // throw 400 if unknown fields are sent
    transform: true, // auto-transform query strings to their declared types
  })
);
```

No per-controller setup needed.

---

### Step 2 — Write the create DTO

One file per operation. Decorators run top-to-bottom — put `@Trim()` first so whitespace is stripped before validators run.

```ts
// modules/products/dto/create-product.dto.ts
import { Trim } from '@app/shared';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateProductDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsNumber()
  @IsPositive()
  price: number;
}
```

---

### Step 3 — Write the update DTO

Update DTOs use `PartialType` from `@nestjs/mapped-types` — all fields become optional automatically. Never rewrite the decorators by hand.

```ts
// modules/products/dto/update-product.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

---

### Step 4 — Barrel the DTOs

```ts
// modules/products/dto/index.ts
export { CreateProductDto } from './create-product.dto';
export { UpdateProductDto } from './update-product.dto';
```

---

### Step 5 — Use DTOs and shared utilities in the controller

```ts
// modules/products/products.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  PaginatedResult,
  PaginationQueryDto,
  ParseUuidPipe,
} from '@app/shared';
import { CreateProductDto, UpdateProductDto } from './dto';
import { Product } from './interfaces';
import {
  CreateProductCommand,
  UpdateProductCommand,
  DeleteProductCommand,
} from './commands';
import { GetAllProductsQuery, GetProductByIdQuery } from './queries';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  create(@Body() dto: CreateProductDto): Promise<Product> {
    return this.commandBus.execute(new CreateProductCommand(dto));
  }

  @Get()
  findAll(
    @Query() query: PaginationQueryDto
  ): Promise<PaginatedResult<Product>> {
    return this.queryBus.execute(
      new GetAllProductsQuery(query.page, query.limit)
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUuidPipe) id: string): Promise<Product> {
    return this.queryBus.execute(new GetProductByIdQuery(id));
  }

  @Patch(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateProductDto
  ): Promise<Product> {
    return this.commandBus.execute(new UpdateProductCommand(id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseUuidPipe) id: string): Promise<void> {
    return this.commandBus.execute(new DeleteProductCommand(id));
  }
}
```

---

## Shared Utilities from @app/shared

| Export               | What it does                                                        | Where to use                     |
| -------------------- | ------------------------------------------------------------------- | -------------------------------- |
| `ParseUuidPipe`      | Throws `400` if the value is not a valid UUID                       | Every `@Param('id')`             |
| `PaginationQueryDto` | `page` (default 1) + `limit` (default 10, max 100), both auto-typed | Every list `@Query()`            |
| `@Trim()`            | Strips leading/trailing whitespace before validators run            | Every user-facing `string` field |

`@Trim()` is a `class-transformer` transform — it only works when `transform: true` is set in `ValidationPipe`.

---

## Common Decorator Combinations

```ts
// required string field
@Trim()
@IsString()
@IsNotEmpty()
@MaxLength(255)
name: string;

// optional string field
@Trim()
@IsString()
@IsOptional()
@MaxLength(1000)
description?: string;

// boolean toggle
@IsBoolean()
@IsOptional()
completed?: boolean;

// numeric value (body)
@IsNumber()
@IsPositive()
price: number;

// numeric value from query string — @Type() needed because query params are strings
@IsOptional()
@Type(() => Number)
@IsInt()
@Min(0)
offset?: number;
```

---

## Rules

- `@Body()` must always be a typed DTO class — never `any` or plain `object`.
- `@Param('id')` always uses `ParseUuidPipe`.
- `@Query()` on list endpoints always uses `PaginationQueryDto`.
- Update DTOs always use `PartialType` — never rewrite decorators manually.
- Put `@Trim()` first on string fields — it transforms before validators run.
- `@IsOptional()` only on genuinely optional fields — never to silence a failing validator.
- Query string numbers need `@Type(() => Number)` because all query params arrive as strings.

---

## Anti-Patterns

```ts
// ❌ untyped body
@Post() create(@Body() body: any) {}
// ✅ @Post() create(@Body() dto: CreateProductDto)

// ❌ unvalidated param
@Get(':id') findOne(@Param('id') id: string) {}
// ✅ @Get(':id') findOne(@Param('id', ParseUuidPipe) id: string)

// ❌ manual PartialType — duplicates decorators and drifts from create DTO
export class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsNumber() price?: number;
}
// ✅ export class UpdateProductDto extends PartialType(CreateProductDto) {}

// ❌ @IsOptional() used to suppress a real validation error
@IsOptional()
@IsString()
name: string; // field is actually required — @IsOptional silences the missing-value error
// ✅ remove @IsOptional() from required fields

// ❌ @Type() missing on a numeric query param
@IsInt() page: number; // arrives as string "1" — IsInt fails
// ✅ @Type(() => Number) @IsInt() page: number;
```
