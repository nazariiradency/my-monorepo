import { createFileRoute } from '@tanstack/react-router';
import { TodoListPage } from '@/pages/_protected/todo/TodoListPage';
import { todosListOptions } from '@/modules/todo';

export const Route = createFileRoute('/_protected/todo/')({
  component: TodoListPage,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(todosListOptions()),
});
