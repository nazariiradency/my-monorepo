import { queryOptions } from '@tanstack/react-query';
import { api } from '@/shared/lib';
import {
  type Todo,
  type PaginatedTodos,
  type CreateTodoPayload,
  type UpdateTodoPayload,
} from './schema';

const todoKeys = {
  all: () => ['todos'] as const,
  lists: () => ['todos', 'list'] as const,
  list: (page: number, limit: number) =>
    ['todos', 'list', { page, limit }] as const,
  detail: (id: string) => ['todos', 'detail', id] as const,
};

const fetchTodos = (page = 1, limit = 10): Promise<PaginatedTodos> =>
  api.get('/todos', { params: { page, limit } }).then((r) => r.data);

const fetchTodo = (id: string): Promise<Todo> =>
  api.get(`/todos/${id}`).then((r) => r.data);

const createTodo = (body: CreateTodoPayload): Promise<Todo> =>
  api.post('/todos', body).then((r) => r.data);

const updateTodo = ({
  id,
  ...body
}: { id: string } & UpdateTodoPayload): Promise<Todo> =>
  api.patch(`/todos/${id}`, body).then((r) => r.data);

const deleteTodo = (id: string): Promise<void> =>
  api.delete(`/todos/${id}`).then(() => undefined);

const todosListOptions = (page = 1, limit = 10) =>
  queryOptions({
    queryKey: todoKeys.list(page, limit),
    queryFn: () => fetchTodos(page, limit),
  });

const todoDetailOptions = (id: string) =>
  queryOptions({ queryKey: todoKeys.detail(id), queryFn: () => fetchTodo(id) });

export { todoKeys, fetchTodos, fetchTodo, createTodo, updateTodo, deleteTodo };
export { todosListOptions, todoDetailOptions };
