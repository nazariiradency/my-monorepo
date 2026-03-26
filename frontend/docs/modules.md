# Modules — Step-by-Step Guide

Every feature lives in `src/modules/[name]/`. The module is self-contained — it owns its schema, API layer, store, hooks, and components. Nothing leaks out except through `index.ts`.

---

## Folder Structure

```
modules/[name]/
├── components/
│   ├── [Name]Form/
│   │   ├── [Name]Form.tsx          # Form component (RHF + Zod)
│   │   ├── [Name]Form.module.scss
│   │   └── index.ts
│   ├── [Name]Table/
│   │   ├── [Name]Table.tsx         # List view
│   │   ├── [Name]Table.module.scss
│   │   └── index.ts
│   └── [Name]Dialogs/
│       ├── [Name]Dialogs.tsx       # Create / Edit / Delete dialogs
│       ├── [Name]Dialogs.module.scss
│       └── index.ts
├── hooks/
│   ├── use[Names].ts               # useQuery — list
│   ├── use[Name].ts                # useQuery — single item
│   ├── useCreate[Name].ts          # useMutation + useForm
│   ├── useUpdate[Name].ts          # useMutation + useForm (pre-filled)
│   ├── useDelete[Name].ts          # useMutation only
│   └── index.ts                    # barrel re-exports
├── store/
│   ├── [name]Slice.ts              # Zustand slice
│   └── index.ts                    # re-exports the store hook
├── schema.ts                       # Zod schemas + inferred TS types
├── api.ts                          # fetchers + queryKeys + queryOptions
└── index.ts                        # public barrel — module boundary
```

---

## Creating a Module — Step by Step

### Step 1 — schema.ts

Define all Zod schemas here. Infer every TypeScript type from them — never write separate interfaces.

```ts
// modules/products/schema.ts
import { z } from 'zod/v3';

// Entity schema — mirrors the API response shape
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  category: z.enum(['electronics', 'clothing', 'general']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Paginated list wrapper
export const paginatedProductsSchema = z.object({
  items: z.array(productSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

// Mutation payloads — only the fields the user submits
export const createProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  price: z.number().positive('Price must be positive'),
  category: z.enum(['electronics', 'clothing', 'general']),
});

export const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  price: z.number().positive().optional(),
  category: z.enum(['electronics', 'clothing', 'general']).optional(),
});

// Infer types — never write these by hand
export type Product = z.infer<typeof productSchema>;
export type PaginatedProducts = z.infer<typeof paginatedProductsSchema>;
export type CreateProductPayload = z.infer<typeof createProductSchema>;
export type UpdateProductPayload = z.infer<typeof updateProductSchema>;
```

---

### Step 2 — api.ts

All HTTP calls and cache key definitions live here. No hooks, no side effects — plain async functions only.

```ts
// modules/products/api.ts
import { queryOptions } from '@tanstack/react-query';
import { api } from '@/shared/lib';
import type {
  Product,
  PaginatedProducts,
  CreateProductPayload,
  UpdateProductPayload,
} from './schema';

// Query key factory — keeps cache invalidation consistent
export const productKeys = {
  all: () => ['products'] as const,
  lists: () => ['products', 'list'] as const,
  list: (page: number, limit: number) =>
    ['products', 'list', { page, limit }] as const,
  detail: (id: string) => ['products', 'detail', id] as const,
};

// Fetchers — one function per endpoint
export const fetchProducts = (
  page = 1,
  limit = 10
): Promise<PaginatedProducts> =>
  api.get('/products', { params: { page, limit } }).then((r) => r.data);

export const fetchProduct = (id: string): Promise<Product> =>
  api.get(`/products/${id}`).then((r) => r.data);

export const createProduct = (body: CreateProductPayload): Promise<Product> =>
  api.post('/products', body).then((r) => r.data);

export const updateProduct = ({
  id,
  ...body
}: { id: string } & UpdateProductPayload): Promise<Product> =>
  api.patch(`/products/${id}`, body).then((r) => r.data);

export const deleteProduct = (id: string): Promise<void> =>
  api.delete(`/products/${id}`).then(() => undefined);

// queryOptions — wrap fetchers for use in loaders and prefetch
export const productsListOptions = (page = 1, limit = 10) =>
  queryOptions({
    queryKey: productKeys.list(page, limit),
    queryFn: () => fetchProducts(page, limit),
  });

export const productDetailOptions = (id: string) =>
  queryOptions({
    queryKey: productKeys.detail(id),
    queryFn: () => fetchProduct(id),
  });
```

---

### Step 3 — store/[name]Slice.ts

Zustand slice for UI state: which dialog is open, the selected item, pagination cursor, filters. No server data here — that belongs to TanStack Query.

See the [full guide below](#creating-a-store-slice).

---

### Step 4 — hooks/

One hook file per intent. Each hook owns exactly one concern.

| File                  | Uses                      | Returns                         |
| --------------------- | ------------------------- | ------------------------------- |
| `useProducts.ts`      | `useQuery`                | `{ data, isLoading, isError }`  |
| `useProduct.ts`       | `useQuery`                | `{ data, isLoading, isError }`  |
| `useCreateProduct.ts` | `useMutation` + `useForm` | `{ form, onSubmit, isPending }` |
| `useUpdateProduct.ts` | `useMutation` + `useForm` | `{ form, onSubmit, isPending }` |
| `useDeleteProduct.ts` | `useMutation`             | `{ onConfirm, isPending }`      |

See the [full guide below](#creating-a-mutation-hook).

---

### Step 5 — components/

Components call hooks and render. No direct `useQuery`/`useMutation`, no business logic.

See the [full guide below](#creating-a-component).

---

### Step 6 — index.ts (module boundary)

The public barrel. Other modules and pages import **only** from `modules/[name]/index.ts`. Never from internal paths.

```ts
// modules/products/index.ts
export { ProductsTable } from './components/ProductsTable';
export { ProductPagination } from './components/ProductPagination';
export {
  CreateProductDialog,
  EditProductDialog,
  DeleteProductDialog,
} from './components/ProductDialogs';
export { useProductsStore } from './store';
export {
  useProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from './hooks';
export { productsListOptions, productDetailOptions } from './api';
export type {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  PaginatedProducts,
} from './schema';
```

```ts
// ✅ correct — imports from the module barrel
import { ProductsTable } from '@/modules/products';

// ❌ wrong — bypasses the module boundary
import { ProductsTable } from '@/modules/products/components/ProductsTable';
```

---

## Creating a Component

Each component lives in its own folder with three files: the component, optional SCSS module, and a barrel `index.ts`.

### Folder layout

```
components/ProductDialogs/
├── ProductDialogs.tsx
├── ProductDialogs.module.scss   # only if needed
└── index.ts
```

### The component file

The `[Name]Dialogs` component is split into one export per dialog variant. Each dialog reads from the store to know whether it is open, and calls the relevant hook for its form/mutation logic.

```tsx
// modules/products/components/ProductDialogs/ProductDialogs.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@/shared/ui';
import { ProductForm } from '../ProductForm';
import {
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '../../hooks';
import { useProductsStore } from '../../store';
import type { Product } from '../../schema';

export function CreateProductDialog() {
  const closeDialog = useProductsStore((s) => s.closeDialog);
  const { form, onSubmit, isPending } = useCreateProduct();

  return (
    <Dialog open onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Product</DialogTitle>
          <DialogDescription>
            Fill in the details for the new product.
          </DialogDescription>
        </DialogHeader>
        <ProductForm
          form={form}
          onSubmit={onSubmit}
          isPending={isPending}
          submitLabel="Create"
        />
      </DialogContent>
    </Dialog>
  );
}

interface EditProductDialogProps {
  product: Product;
}

export function EditProductDialog({ product }: EditProductDialogProps) {
  const closeDialog = useProductsStore((s) => s.closeDialog);
  const { form, onSubmit, isPending } = useUpdateProduct(product);

  return (
    <Dialog open onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Update the product details.</DialogDescription>
        </DialogHeader>
        <ProductForm
          form={form}
          onSubmit={onSubmit}
          isPending={isPending}
          submitLabel="Save changes"
        />
      </DialogContent>
    </Dialog>
  );
}

interface DeleteProductDialogProps {
  product: Product;
}

export function DeleteProductDialog({ product }: DeleteProductDialogProps) {
  const closeDialog = useProductsStore((s) => s.closeDialog);
  const { onConfirm, isPending } = useDeleteProduct(product.id);

  return (
    <Dialog open onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{product.name}&rdquo;? This
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
```

### The barrel index.ts

Re-export every named export from the component file:

```ts
// modules/products/components/ProductDialogs/index.ts
export {
  CreateProductDialog,
  EditProductDialog,
  DeleteProductDialog,
} from './ProductDialogs';
```

Consumers import from the folder, not the file:

```ts
// ✅ correct
import { CreateProductDialog } from '../components/ProductDialogs';

// ❌ wrong — import from the file directly
import { CreateProductDialog } from '../components/ProductDialogs/ProductDialogs';
```

---

## Creating a Mutation Hook

Mutation hooks (`useCreate`, `useUpdate`, `useDelete`) combine `useMutation` with `useForm`. They own the full submit lifecycle: validation → mutate → invalidate cache → close dialog → reset form.

### useCreate[Name].ts

```ts
// modules/products/hooks/useCreateProduct.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProduct, productKeys } from '../api';
import { createProductSchema, type CreateProductPayload } from '../schema';
import { useProductsStore } from '../store';

export function useCreateProduct() {
  const qc = useQueryClient();
  const closeDialog = useProductsStore((s) => s.closeDialog);

  const form = useForm<CreateProductPayload>({
    resolver: zodResolver(createProductSchema),
    defaultValues: { name: '', price: 0, category: 'general' },
  });

  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: productKeys.lists() });
      form.reset();
      closeDialog();
    },
  });

  return {
    form,
    onSubmit: form.handleSubmit((data) => mutation.mutate(data)),
    isPending: mutation.isPending,
    isError: mutation.isError,
  };
}
```

**What each part does:**

| Part                                   | Purpose                                                  |
| -------------------------------------- | -------------------------------------------------------- |
| `useForm` + `zodResolver`              | Validates input before the mutation fires                |
| `mutationFn`                           | The `api.ts` fetcher — no HTTP logic in hooks            |
| `invalidateQueries`                    | Forces TanStack Query to re-fetch the list after a write |
| `form.reset()`                         | Clears the form fields after success                     |
| `closeDialog()`                        | Dismisses the dialog via the Zustand store               |
| Return `{ form, onSubmit, isPending }` | The component only needs these — keep the surface small  |

### useUpdate[Name].ts — pre-filled form

Same pattern, but `defaultValues` is seeded from the existing item passed in:

```ts
// modules/products/hooks/useUpdateProduct.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProduct, productKeys } from '../api';
import {
  updateProductSchema,
  type UpdateProductPayload,
  type Product,
} from '../schema';
import { useProductsStore } from '../store';

export function useUpdateProduct(product: Product) {
  const qc = useQueryClient();
  const closeDialog = useProductsStore((s) => s.closeDialog);

  const form = useForm<UpdateProductPayload>({
    resolver: zodResolver(updateProductSchema),
    defaultValues: {
      name: product.name,
      price: product.price,
      category: product.category,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: UpdateProductPayload) =>
      updateProduct({ id: product.id, ...data }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: productKeys.lists() });
      void qc.invalidateQueries({ queryKey: productKeys.detail(product.id) });
      closeDialog();
    },
  });

  return {
    form,
    onSubmit: form.handleSubmit((data) => mutation.mutate(data)),
    isPending: mutation.isPending,
    isError: mutation.isError,
  };
}
```

### useDelete[Name].ts — no form

Delete has no form, just a confirmation callback:

```ts
// modules/products/hooks/useDeleteProduct.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteProduct, productKeys } from '../api';
import { useProductsStore } from '../store';

export function useDeleteProduct(id: string) {
  const qc = useQueryClient();
  const closeDialog = useProductsStore((s) => s.closeDialog);

  const mutation = useMutation({
    mutationFn: () => deleteProduct(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: productKeys.lists() });
      closeDialog();
    },
  });

  return {
    onConfirm: () => mutation.mutate(),
    isPending: mutation.isPending,
    isError: mutation.isError,
  };
}
```

### hooks/index.ts — barrel

```ts
// modules/products/hooks/index.ts
export { useProducts } from './useProducts';
export { useProduct } from './useProduct';
export { useCreateProduct } from './useCreateProduct';
export { useUpdateProduct } from './useUpdateProduct';
export { useDeleteProduct } from './useDeleteProduct';
```

---

## Creating a Store Slice

The Zustand slice manages UI state: which dialog is open, which item is selected, the current page. No server data — that lives in TanStack Query.

### store/[name]Slice.ts

```ts
// modules/products/store/productsSlice.ts
import { create } from 'zustand';
import type { Product } from '../schema';

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

**What each part does:**

| Part                             | Purpose                                                                  |
| -------------------------------- | ------------------------------------------------------------------------ |
| `DialogMode`                     | Union type that encodes exactly which dialog can be open                 |
| `selectedProduct`                | The item being edited or deleted — `null` when no dialog is open         |
| `openCreate/openEdit/openDelete` | Called from table action buttons                                         |
| `closeDialog`                    | Resets both `dialogMode` and `selectedProduct` at once                   |
| `setPage`                        | Pagination cursor — components read this and pass it to their query hook |

### store/index.ts — barrel

```ts
// modules/products/store/index.ts
export { useProductsStore } from './productsSlice';
```

### Consuming the store in a component

Read only the selector you need — never destructure the whole store:

```tsx
// ✅ correct — selector keeps re-renders focused
const openCreate = useProductsStore((s) => s.openCreate);
const dialogMode = useProductsStore((s) => s.dialogMode);

// ❌ wrong — subscribes to every field, re-renders on any change
const store = useProductsStore();
```

### Wiring dialogs from a page

A typical list page reads `dialogMode` and `selectedProduct` from the store, then renders the appropriate dialog:

```tsx
// pages/_protected/products/ProductsListPage/ProductsListPage.tsx
import {
  ProductsTable,
  CreateProductDialog,
  EditProductDialog,
  DeleteProductDialog,
  useProductsStore,
} from '@/modules/products';

export function ProductsListPage() {
  const dialogMode = useProductsStore((s) => s.dialogMode);
  const selectedProduct = useProductsStore((s) => s.selectedProduct);

  return (
    <>
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

---

## Where Does Something Live?

| Question                 | Answer                            |
| ------------------------ | --------------------------------- |
| Shape of API data?       | `schema.ts` — Zod schema          |
| Fetch / API call?        | `api.ts` — plain async function   |
| Query key?               | `api.ts` — `[module]Keys` object  |
| Server state / cache?    | TanStack Query hook in `hooks/`   |
| Form state + validation? | RHF in `hooks/useCreate[Name].ts` |
| Which dialog is open?    | Zustand in `store/[name]Slice.ts` |
| Domain UI component?     | `components/[Name]/`              |
| Used by 2+ modules?      | Promote to `shared/`              |
