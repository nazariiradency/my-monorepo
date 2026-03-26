import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@/shared/ui';
import { TodoForm } from '../TodoForm';
import { useCreateTodo, useUpdateTodo, useDeleteTodo } from '../../hooks';
import { useTodoStore } from '../../store';
import type { Todo } from '../../schema';

export function CreateTodoDialog() {
  const closeDialog = useTodoStore((s) => s.closeDialog);
  const { form, onSubmit, isPending } = useCreateTodo();

  return (
    <Dialog open onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Todo</DialogTitle>
          <DialogDescription>Add a new task to your list.</DialogDescription>
        </DialogHeader>
        <TodoForm
          form={form}
          onSubmit={onSubmit}
          isPending={isPending}
          submitLabel="Create"
        />
      </DialogContent>
    </Dialog>
  );
}

interface EditTodoDialogProps {
  todo: Todo;
}

export function EditTodoDialog({ todo }: EditTodoDialogProps) {
  const closeDialog = useTodoStore((s) => s.closeDialog);
  const { form, onSubmit, isPending } = useUpdateTodo(todo);

  return (
    <Dialog open onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Todo</DialogTitle>
          <DialogDescription>Update the task title.</DialogDescription>
        </DialogHeader>
        <TodoForm
          form={form}
          onSubmit={onSubmit}
          isPending={isPending}
          submitLabel="Save changes"
        />
      </DialogContent>
    </Dialog>
  );
}

interface DeleteTodoDialogProps {
  todo: Todo;
}

export function DeleteTodoDialog({ todo }: DeleteTodoDialogProps) {
  const closeDialog = useTodoStore((s) => s.closeDialog);
  const { onConfirm, isPending } = useDeleteTodo(todo.id);

  return (
    <Dialog open onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Todo</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{todo.title}&rdquo;? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={closeDialog} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
