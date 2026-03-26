# State — Zustand

## What Zustand Owns

Zustand manages **UI state only** — which dialog is open, which item is selected, sidebar visibility, auth session. Server data (API responses) always lives in the TanStack Query cache, never in Zustand.

```
shared/stores/         ← global UI state shared across the whole app
modules/[name]/store/  ← module-scoped UI state, isolated per feature
```

---

## Two Levels of State

| Level  | Location                | Examples                                              |
| ------ | ----------------------- | ----------------------------------------------------- |
| Global | `shared/stores/`        | Auth session, sidebar open/closed, theme, toast queue |
| Module | `modules/[name]/store/` | Dialog mode, selected item — scoped to one module     |

The difference: if state only makes sense inside one feature module, it belongs in that module's store. If it's shared app-wide, it belongs in `shared/stores/`.

---

## Global Store — Setup

The global store combines multiple slice files into one `useAppStore` hook. Each slice is a separate file using `StateCreator`.

### Folder structure

```
shared/stores/
├── authSlice.ts      # session, setSession, clearSession
├── uiSlice.ts        # sidebarOpen, toggleSidebar
└── index.ts          # combines slices → useAppStore
```

---

## Adding a Global Slice — Step by Step

### Step 1 — Write the slice file

Use `StateCreator<SliceType>` — not `create()`. The slice does not own the store; it contributes state and actions to the combined store.

```ts
// shared/stores/authSlice.ts
import type { StateCreator } from 'zustand';

export interface AuthSlice {
  // state
  session: { id: string; name: string } | null;
  // actions
  setSession: (user: { id: string; name: string }) => void;
  clearSession: () => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  session: null,
  setSession: (session) => set({ session }),
  clearSession: () => set({ session: null }),
});
```

```ts
// shared/stores/uiSlice.ts
import type { StateCreator } from 'zustand';

export interface UiSlice {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
});
```

### Step 2 — Register it in shared/stores/index.ts

Spread every slice into a single `create<AppStore>()` call:

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

When you add a new slice:

1. Create `shared/stores/[name]Slice.ts` following the pattern above.
2. Import it and spread it into `AppStore` + `create(...)` in `index.ts`.

### Step 3 — Use it in a component

Always select the minimum fields you need — never destructure or read the whole store:

```ts
// ✅ one selector per value
const session = useAppStore((s) => s.session);
const clearSession = useAppStore((s) => s.clearSession);

// ✅ read multiple values with one selector (use shallow for objects)
import { useShallow } from 'zustand/react/shallow';
const { sidebarOpen, toggleSidebar } = useAppStore(
  useShallow((s) => ({
    sidebarOpen: s.sidebarOpen,
    toggleSidebar: s.toggleSidebar,
  }))
);

// ❌ reads everything — re-renders on any state change
const store = useAppStore();
```

---

## Module Store — Setup

Each feature module has its own isolated Zustand store. It uses `create<Store>()` directly — not `StateCreator`, because it is never merged with another store.

### Folder structure

```
modules/[name]/store/
├── [name]Slice.ts    # create<Store>(...) — self-contained
└── index.ts          # re-exports the store hook
```

---

## Adding a Module Store — Step by Step

### Step 1 — Write the slice file

```ts
// modules/products/store/productsSlice.ts
import { create } from 'zustand';
import type { Product } from '../schema';

// Explicit union keeps the possible dialog states easy to reason about
type DialogMode = 'create' | 'edit' | 'delete' | null;

interface ProductsStore {
  // state
  selectedProduct: Product | null;
  dialogMode: DialogMode;
  page: number;
  // actions
  openCreate: () => void;
  openEdit: (product: Product) => void;
  openDelete: (product: Product) => void;
  closeDialog: () => void;
  setPage: (page: number) => void;
}

export const useProductsStore = create<ProductsStore>((set) => ({
  selectedProduct: null,
  dialogMode: null,
  page: 1,
  openCreate: () => set({ dialogMode: 'create', selectedProduct: null }),
  openEdit: (product) => set({ dialogMode: 'edit', selectedProduct: product }),
  openDelete: (product) =>
    set({ dialogMode: 'delete', selectedProduct: product }),
  closeDialog: () => set({ dialogMode: null, selectedProduct: null }),
  setPage: (page) => set({ page }),
}));
```

**What each action does:**

| Action          | Who calls it                            | What it sets                                      |
| --------------- | --------------------------------------- | ------------------------------------------------- |
| `openCreate`    | "New product" button                    | `dialogMode = 'create'`, clears `selectedProduct` |
| `openEdit(p)`   | Edit button in a table row              | `dialogMode = 'edit'`, stores the item            |
| `openDelete(p)` | Delete button in a table row            | `dialogMode = 'delete'`, stores the item          |
| `closeDialog`   | Dialog `onOpenChange`, hook `onSuccess` | Resets both fields to `null`                      |
| `setPage(n)`    | Pagination component                    | Updates the current page cursor                   |

### Step 2 — Write the barrel

```ts
// modules/products/store/index.ts
export { useProductsStore } from './productsSlice';
```

### Step 3 — Use it in components and hooks

In a table row (opening dialogs):

```tsx
// modules/products/components/ProductsTable/ProductsTable.tsx
export function ProductsTable() {
  const openEdit = useProductsStore((s) => s.openEdit);
  const openDelete = useProductsStore((s) => s.openDelete);

  const { data, isLoading } = useProducts();
  if (isLoading) return <Spinner />;

  return (
    <table>
      {data?.items.map((p) => (
        <tr key={p.id}>
          <td>{p.name}</td>
          <td>
            <Button onClick={() => openEdit(p)}>Edit</Button>
            <Button onClick={() => openDelete(p)}>Delete</Button>
          </td>
        </tr>
      ))}
    </table>
  );
}
```

In a page (rendering the right dialog):

```tsx
// pages/_protected/products/ProductsListPage/ProductsListPage.tsx
export function ProductsListPage() {
  const dialogMode = useProductsStore((s) => s.dialogMode);
  const selectedProduct = useProductsStore((s) => s.selectedProduct);
  const openCreate = useProductsStore((s) => s.openCreate);

  return (
    <>
      <Button onClick={openCreate}>New product</Button>
      <ProductsTable />

      {dialogMode === 'create' && <CreateProductDialog />}
      {dialogMode === 'edit' && selectedProduct && (
        <EditProductDialog product={selectedProduct} />
      )}
      {dialogMode === 'delete' && selectedProduct && (
        <DeleteProductDialog product={selectedProduct} />
      )}
    </>
  );
}
```

In a mutation hook (closing the dialog after success):

```ts
// modules/products/hooks/useCreateProduct.ts
const closeDialog = useProductsStore((s) => s.closeDialog);

const mutation = useMutation({
  mutationFn: createProduct,
  onSuccess: () => {
    void qc.invalidateQueries({ queryKey: productKeys.lists() });
    form.reset();
    closeDialog(); // ← store action, not a prop
  },
});
```

### Step 4 — Pagination with the store

Store the page cursor in the module store so the table and pagination component stay in sync without prop drilling:

```tsx
// components/ProductPagination
const page = useProductsStore((s) => s.page);
const setPage = useProductsStore((s) => s.setPage);

// components/ProductsTable
const page = useProductsStore((s) => s.page);
const { data } = useProducts(page);
```

---

## StateCreator vs create — When to Use Which

| Pattern                       | When         | Why                                         |
| ----------------------------- | ------------ | ------------------------------------------- |
| `create<Store>((set) => ...)` | Module store | Self-contained, never merged                |
| `StateCreator<Slice>`         | Global slice | Will be spread into the combined `AppStore` |

A module store never uses `StateCreator` because it will never be merged with another store. A global slice always uses `StateCreator` because it gets spread into the single `create<AppStore>()` call.

---

## Rules

- Module stores use `create<Store>()` directly — not `StateCreator`.
- Global slices use `StateCreator` — they are combined in `shared/stores/index.ts`.
- Never store API response data in Zustand — that belongs to TanStack Query.
- Always select with a selector `useAppStore(s => s.field)` — never read the whole store.
- `closeDialog` resets both `dialogMode` and `selectedProduct` together — never reset them separately.

---

## Anti-Patterns

```ts
// ❌ API response data in Zustand
const useProductsStore = create(() => ({
  products: [],
  loading: false,
  fetchProducts: async () => { /* ... */ },
}));
// ✅ use useQuery(productsListOptions()) — TanStack Query handles caching

// ❌ destructure the whole store — subscribes to every field
const { dialogMode, openCreate, selectedProduct } = useProductsStore();
// ✅ one selector per value
const dialogMode = useProductsStore((s) => s.dialogMode);

// ❌ module-scoped state in the global store
const useAppStore = create(() => ({
  productsDialogMode: null,
  todosDialogMode: null,
}));
// ✅ each module owns its own store in modules/[name]/store/

// ❌ module store written with StateCreator (it won't be merged)
export const createProductsSlice: StateCreator<ProductsStore> = (set) => ({ ... });
// ✅ export const useProductsStore = create<ProductsStore>((set) => ({ ... }))

// ❌ closing a dialog by resetting fields one at a time
set({ dialogMode: null });
set({ selectedProduct: null });
// ✅ closeDialog: () => set({ dialogMode: null, selectedProduct: null })
```
