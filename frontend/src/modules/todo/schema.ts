import { z } from 'zod/v3';

export const todoSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const paginatedTodosSchema = z.object({
  items: z.array(todoSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
});

export const updateTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title is too long')
    .optional(),
  completed: z.boolean().optional(),
});

export type Todo = z.infer<typeof todoSchema>;
export type PaginatedTodos = z.infer<typeof paginatedTodosSchema>;
export type CreateTodoPayload = z.infer<typeof createTodoSchema>;
export type UpdateTodoPayload = z.infer<typeof updateTodoSchema>;
