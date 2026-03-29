import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@/shared/ui';
import { useDeleteTodo } from '@/modules/todo/hooks';
import { useTodoStore } from '@/modules/todo/store';
import { type Todo } from '@/modules/todo/schema';

type DeleteTodoDialogProps = {
  todo: Todo;
};

function DeleteTodoDialog({ todo }: DeleteTodoDialogProps) {
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

export { DeleteTodoDialog };
