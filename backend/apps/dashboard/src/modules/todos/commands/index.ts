export { CreateTodoCommand } from './create-todo.command';
export { UpdateTodoCommand } from './update-todo.command';
export { DeleteTodoCommand } from './delete-todo.command';

import { CreateTodoHandler } from './create-todo.command';
import { UpdateTodoHandler } from './update-todo.command';
import { DeleteTodoHandler } from './delete-todo.command';

export const CommandHandlers = [
  CreateTodoHandler,
  UpdateTodoHandler,
  DeleteTodoHandler,
];
