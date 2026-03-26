import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTodo, todoKeys } from '../api';
import { createTodoSchema, type CreateTodoPayload } from '../schema';
import { useTodoStore } from '../store';

export function useCreateTodo() {
  const qc = useQueryClient();
  const closeDialog = useTodoStore((s) => s.closeDialog);

  const form = useForm<CreateTodoPayload>({
    resolver: zodResolver(createTodoSchema),
    defaultValues: { title: '' },
  });

  const mutation = useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: todoKeys.lists() });
      form.reset();
      closeDialog();
    },
  });

  return {
    form,
    onSubmit: form.handleSubmit((data) => mutation.mutate(data)),
    isPending: mutation.isPending,
    isError: mutation.isError,
  };
}
