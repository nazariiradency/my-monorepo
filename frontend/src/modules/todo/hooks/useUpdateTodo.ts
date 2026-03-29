import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateTodo, todoKeys } from '../api';
import { createTodoSchema, type CreateTodoPayload, type Todo } from '../schema';
import { useTodoStore } from '../store';

function useUpdateTodo(todo: Todo) {
  const qc = useQueryClient();
  const closeDialog = useTodoStore((s) => s.closeDialog);

  const form = useForm<CreateTodoPayload>({
    resolver: zodResolver(createTodoSchema),
    defaultValues: { title: todo.title },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateTodoPayload) =>
      updateTodo({ id: todo.id, ...data }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: todoKeys.lists() });
      void qc.invalidateQueries({ queryKey: todoKeys.detail(todo.id) });
      closeDialog();
    },
  });

  return {
    form,
    onSubmit: form.handleSubmit((data) => mutation.mutate(data)),
    isPending: mutation.isPending,
  };
}

export { useUpdateTodo };
