import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TodosRepository } from 'apps/dashboard/src/infra/repositories';

export class DeleteTodoCommand {
  constructor(public readonly id: string) {}
}

@CommandHandler(DeleteTodoCommand)
export class DeleteTodoHandler implements ICommandHandler<
  DeleteTodoCommand,
  void
> {
  constructor(private readonly repository: TodosRepository) {}

  async execute(command: DeleteTodoCommand): Promise<void> {
    const existing = await this.repository.findById(command.id);
    if (!existing) {
      throw new NotFoundException(`Todo ${command.id} not found`);
    }
    await this.repository.delete(command.id);
  }
}
