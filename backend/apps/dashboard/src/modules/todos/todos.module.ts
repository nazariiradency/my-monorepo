import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TodosController } from './todos.controller';
import { TodosRepository } from '../../infra/repositories';
import { QueryHandlers } from './queries';
import { CommandHandlers } from './commands';

@Module({
  imports: [CqrsModule],
  controllers: [TodosController],
  providers: [TodosRepository, ...CommandHandlers, ...QueryHandlers],
})
export class TodosModule {}
