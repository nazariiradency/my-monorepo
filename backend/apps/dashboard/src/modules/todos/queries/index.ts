export { GetAllTodosQuery } from './get-all-todos.query';
export { GetTodoByIdQuery } from './get-todo-by-id.query';

import { GetAllTodosHandler } from './get-all-todos.query';
import { GetTodoByIdHandler } from './get-todo-by-id.query';

export const QueryHandlers = [GetAllTodosHandler, GetTodoByIdHandler];
