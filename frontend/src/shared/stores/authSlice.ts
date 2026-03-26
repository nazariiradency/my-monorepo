import type { StateCreator } from 'zustand';

export interface AuthSlice {
  session: { id: string; name: string } | null;
  setSession: (user: { id: string; name: string }) => void;
  clearSession: () => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  session: null,
  setSession: (session) => set({ session }),
  clearSession: () => set({ session: null }),
});
