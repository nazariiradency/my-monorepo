import { create } from 'zustand';
import { createAuthSlice, type AuthSlice } from './authSlice';
import { createUiSlice, type UiSlice } from './uiSlice';

type AppStore = AuthSlice & UiSlice;

export const useAppStore = create<AppStore>((...a) => ({
  ...createAuthSlice(...a),
  ...createUiSlice(...a),
}));
