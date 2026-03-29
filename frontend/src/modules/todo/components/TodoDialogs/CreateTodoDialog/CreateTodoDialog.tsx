import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui';
import { TodoForm } from '@/modules/todo/components/TodoForm';
import { useCreateTodo } from '@/modules/todo/hooks';
import { useTodoStore } from '@/modules/todo/store';

function CreateTodoDialog() {
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

export { CreateTodoDialog };
