import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTodo, todoKeys } from '../api';

export function useToggleTodo() {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      updateTodo({ id, completed }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });

  return { toggle: mutation.mutate, isPending: mutation.isPending };
}
