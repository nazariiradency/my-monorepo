# Routing — TanStack Router + Pages + Layouts

## Three-Layer Model

Routing is split across three folders with distinct responsibilities:

```
layouts/    ← shell UI — sidebar, header, nav, auth wrapper
pages/      ← full page composition — assembles module components
routes/     ← TanStack Router wiring — connects URL to layout + page
```

A route file does **one thing**: declare the route and render the right page. All UI lives in `pages/` and `layouts/`.

---

## Folder Structure

```
src/
├── layouts/
│   ├── AuthLayout/
│   │   ├── AuthLayout.tsx
│   │   ├── AuthLayout.module.scss
│   │   └── index.ts
│   └── ProtectedLayout/
│       ├── ProtectedLayout.tsx
│       ├── ProtectedLayout.module.scss
│       └── index.ts
│
├── pages/
│   ├── _auth/
│   │   ├── LoginPage/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── LoginPage.module.scss
│   │   │   └── index.ts
│   │   └── RegisterPage/
│   │       ├── RegisterPage.tsx
│   │       └── index.ts
│   └── _protected/
│       └── [module]/
│           ├── [Module]ListPage/
│           │   ├── [Module]ListPage.tsx
│           │   └── index.ts
│           └── [Module]DetailPage/
│               ├── [Module]DetailPage.tsx
│               └── index.ts
│
└── routes/
    ├── __root.tsx                  # Root route — declares QueryClient context
    ├── index.tsx                   # Redirect from / to first protected page
    ├── _auth.tsx                   # Layout route → AuthLayout
    ├── _auth/
    │   ├── login.tsx               # → LoginPage
    │   └── register.tsx            # → RegisterPage
    ├── _protected.tsx              # Layout route → ProtectedLayout
    └── _protected/
        └── [module]/
            ├── index.tsx           # → [Module]ListPage  +  loader
            └── $[id].tsx           # → [Module]DetailPage  +  loader
```

---

## Adding a Route — Step by Step

### Step 1 — Create the page component

Pages live in `pages/_protected/[module]/` or `pages/_auth/`. They compose module components — no business logic, no direct hooks other than the store.

```tsx
// pages/_protected/products/ProductsListPage/ProductsListPage.tsx
import { Plus } from 'lucide-react';
import { Button } from '@/shared/ui';
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
  const openCreate = useProductsStore((s) => s.openCreate);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Products</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your product catalog.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          New product
        </Button>
      </div>

      <ProductsTable />

      {dialogMode === 'create' && <CreateProductDialog />}
      {dialogMode === 'edit' && selectedProduct && (
        <EditProductDialog product={selectedProduct} />
      )}
      {dialogMode === 'delete' && selectedProduct && (
        <DeleteProductDialog product={selectedProduct} />
      )}
    </div>
  );
}
```

Add the barrel:

```ts
// pages/_protected/products/ProductsListPage/index.ts
export { ProductsListPage } from './ProductsListPage';
```

---

### Step 2 — Create the route file

Route files are thin. They call `createFileRoute`, set a `component`, and optionally add a `loader` to prefetch data.

```ts
// routes/_protected/products/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { ProductsListPage } from '@/pages/_protected/products/ProductsListPage';
import { productsListOptions } from '@/modules/products';

export const Route = createFileRoute('/_protected/products/')({
  component: ProductsListPage,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(productsListOptions()),
});
```

The file path **is** the URL — `routes/_protected/products/index.tsx` → `/products`.

---

### Step 3 — Verify the route tree is regenerated

TanStack Router auto-generates `src/routeTree.gen.ts` when the dev server is running. After creating the file, confirm the route appears in `routeTree.gen.ts`. You do not edit that file manually.

---

### Step 4 — Add a nav link in the layout (if needed)

Add a `<Link>` in `ProtectedLayout.tsx` for the new section:

```tsx
// layouts/ProtectedLayout/ProtectedLayout.tsx
import { Link } from '@tanstack/react-router';

// inside the <nav>
<Link
  to="/products"
  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100"
>
  <Package className="h-4 w-4" />
  Products
</Link>;
```

---

## Dynamic Routes (with params)

### Detail page

```tsx
// pages/_protected/products/ProductDetailPage/ProductDetailPage.tsx
import { useParams } from '@tanstack/react-router';
import { ProductDetail } from '@/modules/products';

export function ProductDetailPage() {
  const { productId } = useParams({ from: '/_protected/products/$productId' });
  return <ProductDetail productId={productId} />;
}
```

### Detail route

```ts
// routes/_protected/products/$productId.tsx
import { createFileRoute } from '@tanstack/react-router';
import { ProductDetailPage } from '@/pages/_protected/products/ProductDetailPage';
import { productDetailOptions } from '@/modules/products';

export const Route = createFileRoute('/_protected/products/$productId')({
  component: ProductDetailPage,
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(productDetailOptions(params.productId)),
});
```

The `$` prefix in the filename becomes the param name (`$productId` → `params.productId`).

---

## Root and Layout Routes

These are set up once and almost never changed.

### \_\_root.tsx — declares QueryClient context

```ts
// routes/__root.tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: () => <Outlet />,
});
```

### Layout routes — connect layouts to URL prefixes

```ts
// routes/_protected.tsx
import { createFileRoute } from '@tanstack/react-router';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';

export const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
});

// routes/_auth.tsx
import { createFileRoute } from '@tanstack/react-router';
import { AuthLayout } from '@/layouts/AuthLayout';

export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
});
```

All routes nested under `/_protected/` automatically render inside `ProtectedLayout`. The layout renders `<Outlet />` where child pages appear.

### index.tsx — redirect from root

```ts
// routes/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/products' });
  },
});
```

---

## Loaders

Loaders run before the component renders. Use `ensureQueryData` — it serves cached data when available and only fetches when the cache is stale.

```ts
// ✅ prefer ensureQueryData — reuses TanStack Query cache
loader: ({ context: { queryClient } }) =>
  queryClient.ensureQueryData(productsListOptions()),

// ❌ avoid fetchQuery in loaders — always goes to the network
loader: ({ context: { queryClient } }) =>
  queryClient.fetchQuery(productsListOptions()),
```

The `queryOptions` objects used in loaders come from `modules/[name]/api.ts` and are re-exported through the module's `index.ts`.

---

## Type-Safe Navigation

```ts
import { useNavigate, Link } from '@tanstack/react-router';

// imperative — navigate programmatically
const navigate = useNavigate();
navigate({ to: '/_protected/products/$productId', params: { productId: product.id } });

// declarative — render a link
<Link to="/_protected/products/$productId" params={{ productId: product.id }}>
  View product
</Link>
```

TypeScript will error if `params` is missing or the route path is wrong.

---

## Rules

- Route files render exactly one page component — no JSX logic in route files.
- Layouts live in `layouts/` — never inline layout JSX in a route file.
- Pages live in `pages/` — they are the only place that composes multiple module components together.
- Always use `ensureQueryData` in loaders — not `fetchQuery`.
- Mirror folder structure: `pages/_protected/products/` ↔ `routes/_protected/products/`.
- Never import from `@/modules/[name]/internal/path` — use the module barrel only.

---

## Anti-Patterns

```ts
// ❌ business logic or hooks in a route file
export const Route = createFileRoute('/_protected/products/')({
  component: () => {
    const { data } = useProducts(); // ← no
    return <div>{data?.map(...)}</div>;
  },
});
// ✅ extract to a page component in pages/

// ❌ inline layout in a route file
export const Route = createFileRoute('/_protected')({
  component: () => (
    <div className="flex h-screen">
      <Sidebar />
      <Outlet />
    </div>
  ),
});
// ✅ move to layouts/ProtectedLayout/ProtectedLayout.tsx

// ❌ navigate by string concatenation
window.location.href = '/products/' + id;
// ✅ navigate({ to: '/_protected/products/$productId', params: { productId: id } })
```
