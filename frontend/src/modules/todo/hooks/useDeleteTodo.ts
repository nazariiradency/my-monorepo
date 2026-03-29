import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTodo, todoKeys } from '../api';
import { useTodoStore } from '../store';

function useDeleteTodo(todoId: string) {
  const qc = useQueryClient();
  const closeDialog = useTodoStore((s) => s.closeDialog);

  const mutation = useMutation({
    mutationFn: () => deleteTodo(todoId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: todoKeys.lists() });
      closeDialog();
    },
  });

  return { onConfirm: () => mutation.mutate(), isPending: mutation.isPending };
}

export { useDeleteTodo };
