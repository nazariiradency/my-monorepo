import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@app/shared';
import { Todo } from '../interfaces';
import { TodosRepository } from 'apps/dashboard/src/infra/repositories';

export class GetAllTodosQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number
  ) {}
}

@QueryHandler(GetAllTodosQuery)
export class GetAllTodosHandler implements IQueryHandler<
  GetAllTodosQuery,
  PaginatedResult<Todo>
> {
  constructor(private readonly repository: TodosRepository) {}

  execute(query: GetAllTodosQuery): Promise<PaginatedResult<Todo>> {
    return this.repository.findAll(query.page, query.limit);
  }
}
