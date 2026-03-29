# Feature Module — Step-by-Step Guide

Every feature lives in `src/modules/[name]/`. Self-contained — nothing leaks out except through `index.ts`.

---

## Folder Structure

```
modules/[name]/
├── components/
│   ├── [Name]Form/
│   ├── [Name]Table/
│   └── [Name]Dialogs/
│       ├── Create[Name]Dialog.tsx
│       ├── Edit[Name]Dialog.tsx
│       ├── Delete[Name]Dialog.tsx
│       └── index.ts
├── hooks/
│   ├── use[Names].ts
│   ├── useCreate[Name].ts
│   ├── useUpdate[Name].ts
│   ├── useDelete[Name].ts
│   └── index.ts
├── store/
│   ├── [name].store.ts
│   └── index.ts
├── schema.ts
├── api.ts
└── index.ts
```

---

## Step 1 — schema.ts

→ [feature-schema.md](./feature-schema.md)

```ts
const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const createProductSchema = z.object({
  name: z.string().min(2),
  price: z.number().positive(),
});

const updateProductSchema = createProductSchema.partial();

type Product = z.infer<typeof productSchema>;
type CreateProductPayload = z.infer<typeof createProductSchema>;
type UpdateProductPayload = z.infer<typeof updateProductSchema>;

export { productSchema, createProductSchema, updateProductSchema };
export { type Product, type CreateProductPayload, type UpdateProductPayload };
```

---

## Step 2 — api.ts

→ [feature-api.md](./feature-api.md)

```ts
const productKeys = {
  all: () => ['products'] as const,
  lists: () => ['products', 'list'] as const,
  list: (page: number, limit: number) =>
    ['products', 'list', { page, limit }] as const,
  detail: (id: string) => ['products', 'detail', id] as const,
};

const fetchProducts = (page = 1, limit = 10) =>
  api.get('/products', { params: { page, limit } }).then((r) => r.data);

const createProduct = (body: CreateProductPayload): Promise<Product> =>
  api.post('/products', body).then((r) => r.data);

const updateProduct = ({
  id,
  ...body
}: { id: string } & UpdateProductPayload): Promise<Product> =>
  api.patch(`/products/${id}`, body).then((r) => r.data);

const deleteProduct = (id: string): Promise<void> =>
  api.delete(`/products/${id}`).then(() => undefined);

const productsListOptions = (page = 1, limit = 10) =>
  queryOptions({
    queryKey: productKeys.list(page, limit),
    queryFn: () => fetchProducts(page, limit),
  });

export {
  productKeys,
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  productsListOptions,
};
```

---

## Step 3 — store/

UI state only — which dialog is open, selected item, pagination cursor. No server data here.

```ts
type ProductStore = {
  dialogMode: 'create' | 'edit' | 'delete' | null;
  selectedProduct: Product | null;
  page: number;
  openCreate: () => void;
  openEdit: (product: Product) => void;
  openDelete: (product: Product) => void;
  closeDialog: () => void;
  setPage: (page: number) => void;
};
```

---

## Step 4 — hooks/

→ [state.md](./state.md)

One hook per intent. Each hook owns exactly one concern.

| File                  | Uses                      | Returns                         |
| --------------------- | ------------------------- | ------------------------------- |
| `useProducts.ts`      | `useQuery`                | `{ data, isLoading, isError }`  |
| `useCreateProduct.ts` | `useMutation` + `useForm` | `{ form, onSubmit, isPending }` |
| `useUpdateProduct.ts` | `useMutation` + `useForm` | `{ form, onSubmit, isPending }` |
| `useDeleteProduct.ts` | `useMutation`             | `{ onConfirm, isPending }`      |

---

## Step 5 — components/

→ [feature-components.md](./feature-components.md)

Components call hooks and render. No direct `useQuery`/`useMutation`, no business logic.

---

## Step 6 — index.ts

Public barrel — the only import point for other modules and pages.

```ts
export { ProductsTable } from './components/ProductsTable';
export {
  CreateProductDialog,
  EditProductDialog,
  DeleteProductDialog,
} from './components/ProductDialogs';
export { useProductsStore } from './store';
export {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from './hooks';
export { productsListOptions } from './api';
export {
  type Product,
  type CreateProductPayload,
  type UpdateProductPayload,
} from './schema';
```

```ts
// ✅
import { ProductsTable } from '@/modules/products';

// ❌ never bypass the barrel
import { ProductsTable } from '@/modules/products/components/ProductsTable';
```

---

## Where Does Something Live?

| Question                 | Answer                      |
| ------------------------ | --------------------------- |
| Shape of API data?       | `schema.ts`                 |
| HTTP call / query key?   | `api.ts`                    |
| Server state / cache?    | `hooks/` via TanStack Query |
| Form state + validation? | `hooks/useCreate[Name].ts`  |
| Which dialog is open?    | `store/` via Zustand        |
| Domain UI component?     | `components/`               |
| Used by 2+ modules?      | promote to `@/shared`       |
