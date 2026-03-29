import { Module } from '@nestjs/common';
import { TodosRepository } from './todos.repository';

@Module({
  providers: [TodosRepository],
  exports: [TodosRepository],
})
export class RepositoriesModule {}
