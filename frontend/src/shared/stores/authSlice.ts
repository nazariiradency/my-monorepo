import { type StateCreator } from 'zustand';

type AuthSlice = {
  session: { id: string; name: string } | null;
  setSession: (user: { id: string; name: string }) => void;
  clearSession: () => void;
};

const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  session: null,
  setSession: (session) => set({ session }),
  clearSession: () => set({ session: null }),
});

export { type AuthSlice, createAuthSlice };
