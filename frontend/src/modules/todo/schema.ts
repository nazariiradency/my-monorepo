import { z } from 'zod/v3';

const todoSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const paginatedTodosSchema = z.object({
  items: z.array(todoSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
});

const updateTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title is too long')
    .optional(),
  completed: z.boolean().optional(),
});

type Todo = z.infer<typeof todoSchema>;
type PaginatedTodos = z.infer<typeof paginatedTodosSchema>;
type CreateTodoPayload = z.infer<typeof createTodoSchema>;
type UpdateTodoPayload = z.infer<typeof updateTodoSchema>;

export { todoSchema, paginatedTodosSchema, createTodoSchema, updateTodoSchema };
export {
  type Todo,
  type PaginatedTodos,
  type CreateTodoPayload,
  type UpdateTodoPayload,
};
