# Modules

Every feature lives in `src/modules/[name]/`. The module is self-contained — it owns its schema, API layer, store, hooks, and components. Nothing leaks out except through `index.ts`.

---

## Module Structure

```
modules/[name]/
├── components/
│   ├── [Name]Form.tsx       # Form — uses RHF + Zod
│   ├── [Name]Table.tsx      # List view
│   └── [Name]Dialogs.tsx    # Create / Edit / Delete dialogs
├── hooks/
│   ├── use[Names].ts        # useQuery — list
│   ├── use[Name].ts         # useQuery — single
│   ├── useCreate[Name].ts   # useMutation + useForm
│   ├── useUpdate[Name].ts   # useMutation + useForm (pre-filled)
│   ├── useDelete[Name].ts   # useMutation only
│   └── index.ts             # barrel
├── store/
│   ├── [name]Slice.ts       # Zustand slice
│   └── index.ts             # re-exports useStore hook
├── schema.ts                # Zod schemas + inferred types
├── api.ts                   # fetchers + queryKeys + queryOptions
└── index.ts                 # public barrel — module boundary
```

---

## schema.ts — single source of truth

Define Zod schemas here. Infer all TypeScript types from them — never write separate interfaces.

```ts
// modules/products/schema.ts
import { z } from 'zod';

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  category: z.enum(['electronics', 'clothing', 'general']),
  createdAt: z.string(),
});

export const createProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  price: z.number().positive('Price must be positive'),
  category: z.enum(['electronics', 'clothing', 'general']),
});

export type Product = z.infer<typeof productSchema>;
export type CreateProductPayload = z.infer<typeof createProductSchema>;
```

---

## api.ts — queryKeys + fetchers + queryOptions

All HTTP calls and cache key definitions live here. No hooks, no side effects — plain async functions only.

```ts
// modules/products/api.ts
import { queryOptions } from '@tanstack/react-query';
import type { Product, CreateProductPayload } from './schema';

export const productsKeys = {
  all: () => ['products'] as const,
  lists: () => ['products', 'list'] as const,
  detail: (id: string) => ['products', 'detail', id] as const,
};

export const fetchProducts = (): Promise<Product[]> =>
  fetch('/api/v1/products').then((r) => r.json());

export const fetchProduct = (id: string): Promise<Product> =>
  fetch(`/api/v1/products/${id}`).then((r) => r.json());

export const createProduct = (body: CreateProductPayload): Promise<Product> =>
  fetch('/api/v1/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json());

export const productsListOptions = () =>
  queryOptions({ queryKey: productsKeys.lists(), queryFn: fetchProducts });

export const productDetailOptions = (id: string) =>
  queryOptions({
    queryKey: productsKeys.detail(id),
    queryFn: () => fetchProduct(id),
  });
```

---

## index.ts — module boundary

Other modules and pages import **only** from `modules/[name]/index.ts`. Never from internal paths.

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
export type { Product, CreateProductPayload } from './schema';
```

```ts
// ✅ correct — imports from barrel
import { ProductsTable } from '@/modules/products';

// ❌ wrong — bypasses module boundary
import { ProductsTable } from '@/modules/products/components/ProductsTable';
```

---

## Components

Components call hooks and render. No business logic, no direct `useQuery`/`useMutation`.

```tsx
// modules/products/components/ProductsTable.tsx
import { useProducts } from '../hooks';
import { useProductsStore } from '../store';

export function ProductsTable() {
  const { data: products, isLoading } = useProducts();
  const { openEdit, openDelete } = useProductsStore();

  if (isLoading) return <Spinner />;

  return (
    <table>
      {products?.map((p) => (
        <tr key={p.id}>
          <td>{p.name}</td>
          <td>
            <button onClick={() => openEdit(p)}>Edit</button>
            <button onClick={() => openDelete(p)}>Delete</button>
          </td>
        </tr>
      ))}
    </table>
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
| Server state cache?      | TanStack Query hook in `hooks/`   |
| Form state + validation? | RHF in `hooks/useCreate[Name].ts` |
| Which dialog is open?    | Zustand in `store/[name]Slice.ts` |
| Used by 2+ modules?      | Promote to `shared/`              |
