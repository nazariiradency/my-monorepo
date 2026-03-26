import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Todo } from '../interfaces';
import { TodosRepository } from 'apps/dashboard/src/infra/repositories';

export class UpdateTodoCommand {
  constructor(
    public readonly id: string,
    public readonly title?: string,
    public readonly completed?: boolean
  ) {}
}

@CommandHandler(UpdateTodoCommand)
export class UpdateTodoHandler implements ICommandHandler<
  UpdateTodoCommand,
  Todo
> {
  constructor(private readonly repository: TodosRepository) {}

  async execute(command: UpdateTodoCommand): Promise<Todo> {
    const existing = await this.repository.findById(command.id);
    if (!existing) {
      throw new NotFoundException(`Todo ${command.id} not found`);
    }
    return this.repository.update(command.id, {
      title: command.title,
      completed: command.completed,
    });
  }
}
