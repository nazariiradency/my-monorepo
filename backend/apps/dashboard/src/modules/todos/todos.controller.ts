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
import { Todo } from './interfaces';
import { CreateTodoDto, UpdateTodoDto } from './dto';
import {
  CreateTodoCommand,
  DeleteTodoCommand,
  UpdateTodoCommand,
} from './commands';
import { GetAllTodosQuery, GetTodoByIdQuery } from './queries';

@Controller('todos')
export class TodosController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  create(@Body() dto: CreateTodoDto): Promise<Todo> {
    return this.commandBus.execute(new CreateTodoCommand(dto.title));
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResult<Todo>> {
    return this.queryBus.execute(new GetAllTodosQuery(query.page, query.limit));
  }

  @Get(':id')
  findOne(@Param('id', ParseUuidPipe) id: string): Promise<Todo> {
    return this.queryBus.execute(new GetTodoByIdQuery(id));
  }

  @Patch(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateTodoDto
  ): Promise<Todo> {
    return this.commandBus.execute(
      new UpdateTodoCommand(id, dto.title, dto.completed)
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseUuidPipe) id: string): Promise<void> {
    return this.commandBus.execute(new DeleteTodoCommand(id));
  }
}
