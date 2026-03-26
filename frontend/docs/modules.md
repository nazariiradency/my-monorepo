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

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  category: z.enum(['electronics', 'clothing', 'general']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

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
  CreateProductPayload,
  UpdateProductPayload,
} from './schema';

export const productKeys = {
  all: () => ['products'] as const,
  lists: () => ['products', 'list'] as const,
  list: (page: number, limit: number) =>
    ['products', 'list', { page, limit }] as const,
  detail: (id: string) => ['products', 'detail', id] as const,
};

export const fetchProducts = (page = 1, limit = 10) =>
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

// queryOptions — wrap fetchers for use in hooks and route loaders
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

### Step 3 — store/

Zustand slice for UI state: which dialog is open, the selected item, pagination cursor. No server data here — that belongs to TanStack Query.

See [docs/state.md](./state.md) for the full guide.

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

See [docs/query.md](./query.md) and [docs/forms.md](./forms.md) for full implementation examples.

---

### Step 5 — components/

Components call hooks and render. No direct `useQuery`/`useMutation`, no business logic.

See [Creating a Component](#creating-a-component) below.

---

### Step 6 — index.ts (module boundary)

The public barrel. Other modules and pages import **only** from `modules/[name]/index.ts`. Never from internal paths.

```ts
// modules/products/index.ts
export { ProductsTable } from './components/ProductsTable';
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

The `[Name]Dialogs` component exports one named export per dialog variant. Each dialog reads from the store to know whether it is open, and calls the relevant hook.

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
import { useCreateProduct, useDeleteProduct } from '../../hooks';
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

export function DeleteProductDialog({ product }: { product: Product }) {
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

`EditProductDialog` follows the same pattern as `CreateProductDialog` but accepts a `product` prop and calls `useUpdateProduct(product)` instead.

### The barrel index.ts

```ts
// modules/products/components/ProductDialogs/index.ts
export {
  CreateProductDialog,
  EditProductDialog,
  DeleteProductDialog,
} from './ProductDialogs';
```

```ts
// ✅ import from the folder, not the file
import { CreateProductDialog } from '../components/ProductDialogs';

// ❌ import from the file directly
import { CreateProductDialog } from '../components/ProductDialogs/ProductDialogs';
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
