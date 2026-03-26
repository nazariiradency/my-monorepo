# Routing — Navigation Architecture (TanStack Router)

Routing defines **how URLs map to layouts and pages**.

It is built on TanStack Router with file-based routing — the folder structure is the route tree.

---

# Core Idea

```text
URL → Route file → Layout → Page
```

---

# Three Primitives

| Primitive | Responsibility                                  | Doc                        |
| --------- | ----------------------------------------------- | -------------------------- |
| Layouts   | persistent shell (sidebar, header) around pages | [layouts.md](./layouts.md) |
| Pages     | route-level screen, composes feature components | [page.md](./page.md)       |
| Routes    | map URLs to pages, prefetch data                | [routes.md](./routes.md)   |

---

# File Structure

```text
src/
  layouts/
    ProtectedLayout/    ← sidebar + header shell
    AuthLayout/         ← centered card shell
  pages/
    _protected/
      [entity]/
        [Entity]ListPage/  ← screen component
  routes/
    __root.tsx          ← root route, provides QueryClient context
    index.tsx           ← / redirect to default route
    _protected.tsx      ← pathless layout route → ProtectedLayout
    _protected/
      [entity]/
        index.tsx       ← /_protected/[entity]/ → [Entity]ListPage
```

---

# How They Work Together

```text
__root.tsx                    (bare Outlet, injects QueryClient)
  ↓
_protected.tsx                (ProtectedLayout — sidebar + header)
  ↓
_protected/[entity]/index.tsx (loader prefetches data)
  ↓
[Entity]ListPage              (composes feature components + dialogs)
  ↓
[Entity]Table, Dialogs        (feature components from @/modules/[entity])
```

Each layer has exactly one responsibility:

```text
Layout  → chrome (sidebar, header)
Page    → composition (feature components, dialogs)
Route   → wiring (URL, loader, component assignment)
```

---

# Adding a New Feature

1. Create the page component → see [page.md](./page.md)
2. Create the route file → see [routes.md](./routes.md)
3. Create a new layout only if a different shell is needed → see [layouts.md](./layouts.md)

For most features only steps 1 and 2 are needed — the layout already exists.

---

# Key Rules

✔ File path = URL path — never register routes manually  
✔ Layouts use `_` prefix — keeps them out of the URL  
✔ Data prefetching belongs in route `loader`, not in the page  
✔ Pages never fetch data — they consume what the loader put in cache  
✔ `queryClient` flows from `__root.tsx` context — never imported directly in route files
