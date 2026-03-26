import { Pencil, Trash2 } from 'lucide-react';
import { Button, Badge, Checkbox } from '@/shared/ui';
import { useTodos, useToggleTodo } from '../../hooks';
import { useTodoStore } from '../../store';
import type { Todo } from '../../schema';
import { TodoPagination } from '../TodoPagination';
import styles from './TodoTable.module.scss';

export function TodoTable() {
  const page = useTodoStore((s) => s.page);
  const setPage = useTodoStore((s) => s.setPage);
  const { data, isLoading, isError } = useTodos(page, 3);
  const { toggle } = useToggleTodo();
  const { openEdit, openDelete } = useTodoStore();

  const renderBody = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
            Loading…
          </td>
        </tr>
      );
    }

    if (isError) {
      return (
        <tr>
          <td colSpan={5} className="px-4 py-12 text-center text-red-500">
            Failed to load todos.
          </td>
        </tr>
      );
    }

    if (!data?.items.length) {
      return (
        <tr>
          <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
            No todos yet. Create one!
          </td>
        </tr>
      );
    }

    return data.items.map((todo: Todo) => (
      <tr key={todo.id} className="hover:bg-zinc-50 transition-colors">
        <td className="px-4 py-3">
          <Checkbox
            checked={todo.completed}
            onCheckedChange={(checked) =>
              toggle({ id: todo.id, completed: checked === true })
            }
          />
        </td>
        <td className="px-4 py-3 text-zinc-900">
          <span className={todo.completed ? 'line-through text-zinc-400' : ''}>
            {todo.title}
          </span>
        </td>
        <td className="px-4 py-3">
          <Badge variant={todo.completed ? 'success' : 'secondary'}>
            {todo.completed ? 'Done' : 'Pending'}
          </Badge>
        </td>
        <td className="hidden sm:table-cell px-4 py-3 text-zinc-500">
          {new Date(todo.createdAt).toLocaleDateString()}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEdit(todo)}
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openDelete(todo)}
              aria-label="Delete"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <div
      className={`rounded-lg border border-zinc-200 overflow-hidden ${styles['table-wrapper']}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="w-10 px-4 py-3 text-left font-medium text-zinc-500"></th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">
                Title
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">
                Status
              </th>
              <th className="hidden sm:table-cell px-4 py-3 text-left font-medium text-zinc-500">
                Created
              </th>
              <th className="w-24 px-4 py-3 text-right font-medium text-zinc-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">{renderBody()}</tbody>
        </table>
      </div>
      <TodoPagination
        page={data?.page ?? page}
        totalPages={data?.totalPages ?? 1}
        total={data?.total ?? 0}
        onPage={setPage}
      />
    </div>
  );
}
