import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Todo } from '../interfaces';
import { TodosRepository } from 'apps/dashboard/src/infra/repositories';

export class GetTodoByIdQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetTodoByIdQuery)
export class GetTodoByIdHandler implements IQueryHandler<
  GetTodoByIdQuery,
  Todo
> {
  constructor(private readonly repository: TodosRepository) {}

  async execute(query: GetTodoByIdQuery): Promise<Todo> {
    const todo = await this.repository.findById(query.id);
    if (!todo) {
      throw new NotFoundException(`Todo ${query.id} not found`);
    }
    return todo;
  }
}
