# TanStack Query

## One Hook File Per Intent

Each hook file has one export and one purpose. Never mix queries and mutations.

```
hooks/
├── use[Names].ts        ← useQuery  — list
├── use[Name].ts         ← useQuery  — single item by id
├── useCreate[Name].ts   ← useMutation + useForm
├── useUpdate[Name].ts   ← useMutation + useForm (pre-filled defaults)
├── useDelete[Name].ts   ← useMutation only (no form)
└── index.ts             ← barrel re-exports all hooks
```

---

## Query Hooks

Read-only. Return the raw `useQuery` result so components get `data`, `isLoading`, `isError`.

```ts
// hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { productsListOptions } from '../api';

export function useProducts(filters?: ProductFilters) {
  return useQuery(productsListOptions(filters));
}
```

```ts
// hooks/useProduct.ts
import { useQuery } from '@tanstack/react-query';
import { productDetailOptions } from '../api';

export function useProduct(id: string) {
  return useQuery(productDetailOptions(id));
}
```

---

## Mutation + Form Hooks

Integration point for RHF + Zod + TanStack Query. The hook owns the form and the mutation together.

```ts
// hooks/useCreateProduct.ts
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
      qc.invalidateQueries({ queryKey: productsKeys.lists() });
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

```ts
// hooks/useUpdateProduct.ts — pre-fills form with existing data
export function useUpdateProduct(product: Product) {
  const qc = useQueryClient();
  const closeDialog = useProductsStore((s) => s.closeDialog);

  const form = useForm<CreateProductPayload>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: product.name,
      price: product.price,
      category: product.category,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateProductPayload) =>
      updateProduct({ id: product.id, ...data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productsKeys.lists() });
      qc.invalidateQueries({ queryKey: productsKeys.detail(product.id) });
      closeDialog();
    },
  });

  return {
    form,
    onSubmit: form.handleSubmit((data) => mutation.mutate(data)),
    isPending: mutation.isPending,
  };
}
```

---

## Mutation-Only Hook

No form needed — just confirm and fire.

```ts
// hooks/useDeleteProduct.ts
export function useDeleteProduct(productId: string) {
  const qc = useQueryClient();
  const closeDialog = useProductsStore((s) => s.closeDialog);

  const mutation = useMutation({
    mutationFn: () => deleteProduct(productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productsKeys.lists() });
      closeDialog();
    },
  });

  return { onConfirm: mutation.mutate, isPending: mutation.isPending };
}
```

---

## Query Client Config

```ts
// shared/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      retry: 1,
    },
  },
});
```

---

## Query Keys Pattern

Keys are defined in `api.ts` alongside fetchers — never scattered in hook files.

```ts
export const productsKeys = {
  all: () => ['products'] as const,
  lists: () => ['products', 'list'] as const,
  list: (f: unknown) => ['products', 'list', f] as const,
  detail: (id: string) => ['products', 'detail', id] as const,
};
```

Invalidate by scope:

```ts
// invalidate all product lists (any filter)
qc.invalidateQueries({ queryKey: productsKeys.lists() });

// invalidate one specific product
qc.invalidateQueries({ queryKey: productsKeys.detail(id) });
```

---

## Rules

- Components never call `useQuery` or `useMutation` directly — always wrap in a named hook.
- Server state lives in TanStack Query cache — never copy it into Zustand.
- `queryOptions()` wrappers in `api.ts` are reused in both hooks and route loaders.
- Invalidate the narrowest key possible after a mutation.
