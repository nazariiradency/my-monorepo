# State — Zustand

## Two Levels of State

| Level  | Location                | Owns                                              |
| ------ | ----------------------- | ------------------------------------------------- |
| Global | `shared/stores/`        | Auth session, sidebar open, theme, toasts         |
| Module | `modules/[name]/store/` | Dialog mode, selected item — scoped to one module |

> Never put server state (API data) in Zustand. Server state lives in TanStack Query cache.

---

## Global Store

Combines multiple slices into one `useAppStore`. Each slice is a separate file.

```
shared/stores/
├── authSlice.ts      # session, token, setSession, clearSession
├── uiSlice.ts        # sidebarOpen, theme, toast queue
└── index.ts          # combines slices → useAppStore
```

### Writing a slice

```ts
// shared/stores/authSlice.ts
import type { StateCreator } from 'zustand';
import type { User } from '@repo/types';

export interface AuthSlice {
  session: User | null;
  token: string | null;
  setSession: (user: User, token: string) => void;
  clearSession: () => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  session: null,
  token: null,
  setSession: (session, token) => set({ session, token }),
  clearSession: () => set({ session: null, token: null }),
});
```

### Combining slices

```ts
// shared/stores/index.ts
import { create } from 'zustand';
import { createAuthSlice, type AuthSlice } from './authSlice';
import { createUiSlice, type UiSlice } from './uiSlice';

type AppStore = AuthSlice & UiSlice;

export const useAppStore = create<AppStore>((...a) => ({
  ...createAuthSlice(...a),
  ...createUiSlice(...a),
}));
```

### Usage

```ts
// select only what you need — avoids unnecessary re-renders
const session = useAppStore((s) => s.session);
const clearSession = useAppStore((s) => s.clearSession);
```

---

## Module Store

Each module has its own isolated Zustand store for UI state that only makes sense inside that module.

```
modules/[name]/store/
├── [name]Slice.ts    # create<Store>(...) — not a StateCreator
└── index.ts          # re-exports the hook
```

```ts
// modules/products/store/productsSlice.ts
import { create } from 'zustand';
import type { Product } from '../schema';

type DialogMode = 'create' | 'edit' | 'delete' | null;

interface ProductsStore {
  selectedProduct: Product | null;
  dialogMode: DialogMode;
  openCreate: () => void;
  openEdit: (p: Product) => void;
  openDelete: (p: Product) => void;
  closeDialog: () => void;
}

export const useProductsStore = create<ProductsStore>((set) => ({
  selectedProduct: null,
  dialogMode: null,
  openCreate: () => set({ dialogMode: 'create', selectedProduct: null }),
  openEdit: (p) => set({ dialogMode: 'edit', selectedProduct: p }),
  openDelete: (p) => set({ dialogMode: 'delete', selectedProduct: p }),
  closeDialog: () => set({ dialogMode: null, selectedProduct: null }),
}));
```

```ts
// modules/products/store/index.ts
export { useProductsStore } from './productsSlice';
```

---

## Rules

- Module stores use `create<Store>()` directly — not `StateCreator`, because they don't combine with other slices.
- Global store slices use `StateCreator` because they're combined in `shared/stores/index.ts`.
- Never store API response data in Zustand — that's TanStack Query's job.
- Select only the fields you need: `useAppStore(s => s.session)` not `useAppStore()`.

---

## Anti-Patterns

```ts
// ❌ server state in Zustand
const useStore = create(() => ({ products: [], loading: false }));
// ✅ useQuery(productsListOptions())

// ❌ select entire store — causes re-render on every state change
const store = useProductsStore();
// ✅ const dialogMode = useProductsStore(s => s.dialogMode)

// ❌ module UI state in global store
const useAppStore = create(() => ({
  usersDialogMode: null,
  productsDialogMode: null,
}));
// ✅ each module owns its own store
```
