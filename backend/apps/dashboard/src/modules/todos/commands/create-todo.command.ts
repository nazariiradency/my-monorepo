import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Todo } from '../interfaces';
import { TodosRepository } from 'apps/dashboard/src/infra/repositories';

export class CreateTodoCommand {
  constructor(public readonly title: string) {}
}

@CommandHandler(CreateTodoCommand)
export class CreateTodoHandler implements ICommandHandler<
  CreateTodoCommand,
  Todo
> {
  constructor(private readonly repository: TodosRepository) {}

  execute(command: CreateTodoCommand): Promise<Todo> {
    return this.repository.create({ title: command.title });
  }
}
