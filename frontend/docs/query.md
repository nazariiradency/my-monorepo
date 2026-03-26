# TanStack Query — Server State, Caching, Hooks

## What TanStack Query Owns

TanStack Query is the single source of truth for all server data. It handles fetching, caching, background refetching, and invalidation. Zustand never stores API response data.

```
api.ts         → queryKeys + fetchers + queryOptions
hooks/*.ts     → useQuery / useMutation wrappers — one file per intent
queryClient.ts → global QueryClient instance + default options
```

---

## Setup — queryClient.ts

The `QueryClient` is configured once in `shared/lib/queryClient.ts` and passed into `QueryClientProvider` in `main.tsx`.

```ts
// shared/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // cache is fresh for 5 minutes
      retry: 1, // retry failed requests once before showing an error
    },
  },
});
```

```tsx
// main.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { queryClient } from '@/shared/lib/queryClient';

const router = createRouter({ routeTree, context: { queryClient } });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
);
```

**`staleTime` explained:**

- `0` (default) — data is immediately stale; refetch on every component mount
- `1000 * 60 * 5` — data stays fresh for 5 minutes; no network request if cached

---

## api.ts — queryKeys + fetchers + queryOptions

All three live together in `modules/[name]/api.ts`. Nothing else goes here.

### Query key factory

Keys are hierarchical arrays. This lets you invalidate by any level of specificity.

```ts
export const productKeys = {
  all: () => ['products'] as const, // invalidates everything in this module
  lists: () => ['products', 'list'] as const, // invalidates all list variants
  list: (page: number, limit: number) =>
    ['products', 'list', { page, limit }] as const,
  detail: (id: string) => ['products', 'detail', id] as const,
};
```

### Fetchers

Plain async functions — no hooks, no side effects:

```ts
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
```

### queryOptions wrappers

Wrap fetchers in `queryOptions()` so they can be shared between hooks and route loaders without duplication:

```ts
import { queryOptions } from '@tanstack/react-query';

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

These are re-exported through the module's `index.ts` so route loaders can use them:

```ts
// routes/_protected/products/index.tsx
loader: ({ context: { queryClient } }) =>
  queryClient.ensureQueryData(productsListOptions()),
```

---

## Hook Files — One File Per Intent

```
hooks/
├── useProducts.ts       ← useQuery — list (paginated)
├── useProduct.ts        ← useQuery — single item by id
├── useCreateProduct.ts  ← useMutation + useForm
├── useUpdateProduct.ts  ← useMutation + useForm (pre-filled)
├── useDeleteProduct.ts  ← useMutation only
└── index.ts             ← barrel re-exports all hooks
```

Components never call `useQuery` or `useMutation` directly — always through a named hook.

---

## Query Hooks — useQuery

```ts
// modules/products/hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { productsListOptions } from '../api';

export function useProducts(page = 1, limit = 10) {
  return useQuery(productsListOptions(page, limit));
}
```

```ts
// modules/products/hooks/useProduct.ts
import { useQuery } from '@tanstack/react-query';
import { productDetailOptions } from '../api';

export function useProduct(id: string) {
  return useQuery(productDetailOptions(id));
}
```

Usage in a component:

```tsx
function ProductsTable() {
  const { data, isLoading, isError } = useProducts();

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorMessage />;

  return (
    <table>
      {data?.items.map((p) => (
        <ProductRow key={p.id} product={p} />
      ))}
    </table>
  );
}
```

---

## Mutation Hooks — useMutation

### Create — useMutation + useForm

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

### Update — pre-filled form

Same pattern as Create, but `defaultValues` is seeded from the existing item and both list and detail caches are invalidated on success. See [docs/forms.md](./forms.md) for full example.

### Delete — no form, just a confirm callback

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

## Cache Invalidation

Invalidate the narrowest key that covers what changed.

```ts
// after create — any list may be affected (page counts change)
void qc.invalidateQueries({ queryKey: productKeys.lists() });

// after update — the list and the specific detail
void qc.invalidateQueries({ queryKey: productKeys.lists() });
void qc.invalidateQueries({ queryKey: productKeys.detail(product.id) });

// after delete — only lists (the detail no longer exists)
void qc.invalidateQueries({ queryKey: productKeys.lists() });
```

Key hierarchy:

```
['products']                           ← productKeys.all()   — matches everything
['products', 'list']                   ← productKeys.lists() — matches all paginated lists
['products', 'list', { page, limit }]  ← productKeys.list()  — matches one specific page
['products', 'detail', id]             ← productKeys.detail() — matches one item
```

`invalidateQueries` matches by prefix, so `productKeys.lists()` catches all variants regardless of page/limit params.

---

## axios Instance — shared/lib/axios.ts

```ts
// shared/lib/axios.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Unwraps the backend envelope: { data, statusCode, timestamp } → data
api.interceptors.response.use(
  (response) => {
    if (
      response.data !== null &&
      typeof response.data === 'object' &&
      'statusCode' in response.data &&
      'data' in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  (error: unknown) => Promise.reject(error)
);
```

Set `VITE_API_URL` in `.env.local` to point at a different backend in development.

---

## Rules

- Never call `useQuery` or `useMutation` directly in a component — always wrap in a named hook.
- Never copy server data into Zustand — server state lives in the TanStack Query cache.
- All query keys live in `api.ts` alongside their fetchers — never define keys inside hook files.
- Always use `queryOptions()` so the same definition is shared between hooks and route loaders.
- Invalidate by the narrowest key that covers what changed.
- Prefix `invalidateQueries` calls with `void` — the returned promise is intentionally unhandled.

---

## Anti-Patterns

```ts
// ❌ useQuery called directly in a component
function ProductsTable() {
  const { data } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
}
// ✅ const { data } = useProducts();

// ❌ query key defined inline in the hook
const mutation = useMutation({
  onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'list'] }),
});
// ✅ qc.invalidateQueries({ queryKey: productKeys.lists() })

// ❌ server data copied into Zustand
const useProductsStore = create(() => ({ products: [], loading: false }));
// ✅ useQuery — TanStack Query is the cache

// ❌ fetchQuery in a route loader — always hits the network
loader: ({ context: { queryClient } }) =>
  queryClient.fetchQuery(productsListOptions());
// ✅ queryClient.ensureQueryData(productsListOptions()) — reuses cache when fresh

// ❌ queryOptions defined twice (once in hook, once in loader)
// ✅ define once in api.ts as productsListOptions(), import everywhere
```
