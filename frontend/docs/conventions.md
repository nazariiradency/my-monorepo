# Conventions

## Naming

| Thing                 | Convention               | Example                                |
| --------------------- | ------------------------ | -------------------------------------- |
| Query hook — list     | `use[Plural]`            | `useProducts`                          |
| Query hook — single   | `use[Singular]`          | `useProduct`                           |
| Create mutation hook  | `useCreate[Name]`        | `useCreateProduct`                     |
| Update mutation hook  | `useUpdate[Name]`        | `useUpdateProduct`                     |
| Delete mutation hook  | `useDelete[Name]`        | `useDeleteProduct`                     |
| Zustand module store  | `use[Module]Store`       | `useProductsStore`                     |
| Zustand global store  | `useAppStore`            | `useAppStore`                          |
| Zustand slice creator | `create[Name]Slice`      | `createAuthSlice`                      |
| Query key factory     | `[module]Keys`           | `productsKeys`                         |
| Zod create schema     | `create[Name]Schema`     | `createProductSchema`                  |
| Inferred payload type | `Create[Name]Payload`    | `CreateProductPayload`                 |
| Form values type      | `Create[Name]FormValues` | `CreateProductFormValues`              |
| Component             | PascalCase               | `ProductsTable`, `CreateProductDialog` |
| Page component        | `[Name]Page`             | `UsersListPage`, `UserDetailPage`      |
| Layout component      | `[Name]Layout`           | `ProtectedLayout`, `AuthLayout`        |
| Route file            | lowercase with hyphens   | `product-detail.tsx`                   |
| Module folder         | kebab-case               | `modules/product-categories/`          |

---

## File Placement Rules

| If you're creating...                  | It goes in...                |
| -------------------------------------- | ---------------------------- |
| Zod schema + inferred types            | `modules/[name]/schema.ts`   |
| API fetcher / queryKeys                | `modules/[name]/api.ts`      |
| Query or mutation hook                 | `modules/[name]/hooks/`      |
| Module UI state                        | `modules/[name]/store/`      |
| Feature UI component                   | `modules/[name]/components/` |
| Page assembled from module components  | `pages/[group]/[module]/`    |
| Layout shell (sidebar, header)         | `layouts/`                   |
| TanStack Router route declaration      | `routes/`                    |
| Global UI state (auth, sidebar, theme) | `shared/stores/`             |
| Reusable hook (2+ modules)             | `shared/hooks/`              |
| shadcn component                       | `shared/ui/`                 |

---

## Anti-Patterns — Never Do These

```ts
// ❌ server state in Zustand
const useStore = create(() => ({ products: [] }))
// ✅ useQuery(productsListOptions())

// ❌ useQuery or useMutation directly in a component
function ProductsPage() {
  const { data } = useQuery(productsListOptions())
  const mutation = useMutation({ mutationFn: createProduct })
}
// ✅ wrap in named hooks — useProducts(), useCreateProduct()

// ❌ TypeScript interface separate from Zod schema
interface Product { id: string; name: string }
const productSchema = z.object({ id: z.string(), name: z.string() })
// ✅ export type Product = z.infer<typeof productSchema>

// ❌ import from internal module path
import { ProductsTable } from "@/modules/products/components/ProductsTable"
// ✅ import from barrel
import { ProductsTable } from "@/modules/products"

// ❌ business logic in a page component
export function ProductsListPage() {
  const mutation = useMutation({ mutationFn: createProduct })
}
// ✅ logic lives in hooks, pages just compose

// ❌ layout JSX inside a route file
export const Route = createFileRoute("/_protected")({
  component: () => (
    <div className="flex h-screen">
      <Sidebar />
      <Outlet />
    </div>
  ),
})
// ✅ layouts/ProtectedLayout.tsx — route just references it

// ❌ page JSX inside a route file
export const Route = createFileRoute("/_protected/products/")({
  component: () => (
    <div>
      <h1>Products</h1>
      <ProductsTable />
    </div>
  ),
})
// ✅ pages/_protected/products/ProductsListPage.tsx — route just renders it

// ❌ select the entire Zustand store
const store = useProductsStore()
// ✅ const dialogMode = useProductsStore(s => s.dialogMode)

// ❌ style a component in SCSS instead of Tailwind
// users-table.scss → .users-table { border-radius: 8px; padding: 1rem; }
// ✅ className="rounded-lg p-4" directly on the element

// ❌ hardcode a color in SCSS or Tailwind arbitrary value
<div className="text-[#4f46e5]">
// ✅ define token in _variables.scss + tailwind.config.ts → className="text-primary"

// ❌ edit a shadcn-generated file in shared/ui/
// ✅ create a wrapper component alongside it
```
