import { Plus } from 'lucide-react';
import { Button } from '@/shared/ui';
import {
  TodoTable,
  CreateTodoDialog,
  EditTodoDialog,
  DeleteTodoDialog,
  useTodoStore,
} from '@/modules/todo';

export function TodoListPage() {
  const dialogMode = useTodoStore((s) => s.dialogMode);
  const selectedTodo = useTodoStore((s) => s.selectedTodo);
  const openCreate = useTodoStore((s) => s.openCreate);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Todos</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your tasks.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          New todo
        </Button>
      </div>

      <TodoTable />

      {dialogMode === 'create' && <CreateTodoDialog />}
      {dialogMode === 'edit' && selectedTodo && (
        <EditTodoDialog todo={selectedTodo} />
      )}
      {dialogMode === 'delete' && selectedTodo && (
        <DeleteTodoDialog todo={selectedTodo} />
      )}
    </div>
  );
}
