# Routes — File-Based Routing (TanStack Router)

Routes map **URL paths to page components**.

TanStack Router uses **file-based routing** — the folder and file structure directly defines the URL structure.

---

# File Structure

```text
src/
  routes/
    __root.tsx            ← root route with context
    index.tsx             ← / (redirect to default page)
    _protected.tsx        ← authenticated layout wrapper
    _protected/
      [entity]/
        index.tsx         ← /_protected/[entity]/
        [id].tsx          ← /_protected/[entity]/$id  (dynamic segment)
```

---

# File Naming Conventions

| File                 | URL             | Purpose                                |
| -------------------- | --------------- | -------------------------------------- |
| `__root.tsx`         | —               | root layout, provides context          |
| `index.tsx`          | `/`             | index of current segment               |
| `_protected.tsx`     | —               | pathless layout (no URL segment added) |
| `[entity]/index.tsx` | `/[entity]`     | list page                              |
| `[entity]/$id.tsx`   | `/[entity]/$id` | detail page                            |

✔ `__root` — double underscore = root route  
✔ `_name` — single underscore prefix = pathless layout route (not added to URL)  
✔ `$param` — dollar sign = dynamic route parameter  
✔ `index.tsx` — matches the parent segment exactly

---

# `__root.tsx` — Root Route

Wraps the entire app. Provides shared context (e.g. `QueryClient`) to all child routes.

```tsx
const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: () => <Outlet />,
});
export { Route };
```

Context is injected in `main.tsx`:

```tsx
const router = createRouter({
  routeTree,
  context: { queryClient },
});
```

✔ Always pass `queryClient` via context — makes it available in every route loader  
✔ Never add feature-specific logic here

---

# `index.tsx` (root) — Root Redirect

The root `/` immediately redirects to the app's default route:

```tsx
const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/todo' });
  },
});
export { Route };
```

✔ Use `beforeLoad` + `throw redirect` — runs before any rendering  
✔ Update `to` when the default landing route changes

---

# `_protected.tsx` — Pathless Layout Route

Renders a layout wrapper for all authenticated routes without adding a URL segment.

```tsx
const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
});
export { Route };
```

`ProtectedLayout` typically includes:

```text
ProtectedLayout
  ├── Sidebar
  ├── Topbar
  └── <Outlet />   ← child routes render here
```

✔ Underscore prefix keeps `_protected` out of the URL — routes are `/todo`, not `/_protected/todo`  
✔ Add auth guards here (redirect to login if unauthenticated)  
✔ Add other shared authenticated layouts (auth, onboarding) the same way

---

# Feature Route — `_protected/[entity]/index.tsx`

Connects a URL to a page component and prefetches data via loader.

```tsx
const Route = createFileRoute('/_protected/[entity]/')({
  component: [Entity]ListPage,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData([entity]ListOptions()),
});
export { Route };
```

## Key Parts

| Part                                       | Purpose                                |
| ------------------------------------------ | -------------------------------------- |
| `createFileRoute('/_protected/[entity]/')` | declares the URL                       |
| `component`                                | page component to render               |
| `loader`                                   | prefetches data before render          |
| `context.queryClient`                      | react-query client from root context   |
| `ensureQueryData`                          | fetches if not cached, reuses if fresh |

✔ Always use `ensureQueryData` in loaders — prevents redundant network requests when data is still fresh  
✔ Loader options (`[entity]ListOptions`) come from the feature module, not defined inline  
✔ The `component` is always a `Page` from `@/pages`

---

# Adding a New Route

1. Create the file at the correct path:

```text
routes/_protected/[entity]/index.tsx
```

2. Declare the route:

```tsx
const Route = createFileRoute('/_protected/[entity]/')({
  component: [Entity]ListPage,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData([entity]ListOptions()),
});
export { Route };
```

3. The route is automatically registered — no manual route tree editing needed.
