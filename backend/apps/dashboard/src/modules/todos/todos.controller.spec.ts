import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { TodosController } from './todos.controller';
import { CreateTodoCommand } from './commands';
import { GetAllTodosQuery, GetTodoByIdQuery } from './queries';
import { UpdateTodoCommand, DeleteTodoCommand } from './commands';
import type { Todo } from './interfaces';
import type { PaginatedResult } from '@app/shared';

const TODO_STUB: Todo = {
  id: '00000000-0000-0000-0000-000000000001',
  title: 'Test todo',
  completed: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('TodosController', () => {
  let controller: TodosController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodosController],
      providers: [
        { provide: CommandBus, useValue: { execute: jest.fn() } },
        { provide: QueryBus, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get(TodosController);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  describe('create', () => {
    it('executes CreateTodoCommand and returns the created todo', async () => {
      commandBus.execute.mockResolvedValue(TODO_STUB);

      const result = await controller.create({ title: 'Test todo' });

      expect(commandBus.execute).toHaveBeenCalledWith(
        new CreateTodoCommand('Test todo')
      );
      expect(result).toEqual(TODO_STUB);
    });
  });

  describe('findAll', () => {
    it('executes GetAllTodosQuery with pagination params', async () => {
      const paginated: PaginatedResult<Todo> = {
        items: [TODO_STUB],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      queryBus.execute.mockResolvedValue(paginated);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetAllTodosQuery(1, 10)
      );
      expect(result).toEqual(paginated);
    });
  });

  describe('findOne', () => {
    it('executes GetTodoByIdQuery and returns the todo', async () => {
      queryBus.execute.mockResolvedValue(TODO_STUB);

      const result = await controller.findOne(TODO_STUB.id);

      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetTodoByIdQuery(TODO_STUB.id)
      );
      expect(result).toEqual(TODO_STUB);
    });
  });

  describe('update', () => {
    it('executes UpdateTodoCommand with id and dto fields', async () => {
      const updated = { ...TODO_STUB, title: 'Updated', completed: true };
      commandBus.execute.mockResolvedValue(updated);

      const result = await controller.update(TODO_STUB.id, {
        title: 'Updated',
        completed: true,
      });

      expect(commandBus.execute).toHaveBeenCalledWith(
        new UpdateTodoCommand(TODO_STUB.id, 'Updated', true)
      );
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('executes DeleteTodoCommand with the given id', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await controller.delete(TODO_STUB.id);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new DeleteTodoCommand(TODO_STUB.id)
      );
    });
  });
});
