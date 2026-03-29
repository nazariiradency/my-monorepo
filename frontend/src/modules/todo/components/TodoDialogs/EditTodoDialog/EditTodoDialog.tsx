import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui';
import { TodoForm } from '@/modules/todo/components/TodoForm';
import { useUpdateTodo } from '@/modules/todo/hooks';
import { useTodoStore } from '@/modules/todo/store';
import { type Todo } from '@/modules/todo/schema';

type EditTodoDialogProps = {
  todo: Todo;
};

function EditTodoDialog({ todo }: EditTodoDialogProps) {
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

export { EditTodoDialog };
