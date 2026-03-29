import { create } from 'zustand';
import { type Todo } from '../schema';

type DialogMode = 'create' | 'edit' | 'delete' | null;

type TodoStore = {
  selectedTodo: Todo | null;
  dialogMode: DialogMode;
  page: number;
  openCreate: () => void;
  openEdit: (todo: Todo) => void;
  openDelete: (todo: Todo) => void;
  closeDialog: () => void;
  setPage: (page: number) => void;
};

const useTodoStore = create<TodoStore>((set) => ({
  selectedTodo: null,
  dialogMode: null,
  page: 1,
  openCreate: () => set({ dialogMode: 'create', selectedTodo: null }),
  openEdit: (todo) => set({ dialogMode: 'edit', selectedTodo: todo }),
  openDelete: (todo) => set({ dialogMode: 'delete', selectedTodo: todo }),
  closeDialog: () => set({ dialogMode: null, selectedTodo: null }),
  setPage: (page) => set({ page }),
}));

export { useTodoStore };
