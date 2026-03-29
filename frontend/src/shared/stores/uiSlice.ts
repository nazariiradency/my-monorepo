import { type StateCreator } from 'zustand';

type UiSlice = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
};

const createUiSlice: StateCreator<UiSlice> = (set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
});

export { type UiSlice, createUiSlice };
