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

## Layouts

Layouts are shell components that wrap pages. They own the persistent UI frame — sidebar, header, top nav, auth redirect logic.

```
layouts/
├── AuthLayout.tsx          # Unauthenticated shell — centered card, no nav
└── ProtectedLayout.tsx     # Authenticated shell — sidebar + header + outlet
```

```tsx
// layouts/ProtectedLayout.tsx
import { Outlet, useNavigate } from '@tanstack/react-router';
import { useAppStore } from '@/shared/stores';
import { Sidebar } from '@/shared/ui/sidebar';
import { Header } from '@/shared/ui/header';

export function ProtectedLayout() {
  const session = useAppStore((s) => s.session);
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) navigate({ to: '/login' });
  }, [session]);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

```tsx
// layouts/AuthLayout.tsx
import { Outlet } from '@tanstack/react-router';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
```

---

## Pages

Pages compose module components into a complete view. They read route params, handle dialog state, and render. No business logic.

```
pages/
├── _auth/
│   ├── LoginPage.tsx
│   └── RegisterPage.tsx
└── _protected/
    └── users/
        ├── UsersListPage.tsx
        ├── UserDetailPage.tsx
        └── UserCreatePage.tsx
```

```tsx
// pages/_protected/users/UsersListPage.tsx
import {
  UsersTable,
  CreateUserDialog,
  EditUserDialog,
  DeleteUserDialog,
  useUsersStore,
} from '@/modules/users';

export function UsersListPage() {
  const { dialogMode, openCreate } = useUsersStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Users</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your team members.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          + New user
        </button>
      </div>

      <UsersTable />

      {dialogMode === 'create' && <CreateUserDialog />}
      {dialogMode === 'edit' && <EditUserDialog />}
      {dialogMode === 'delete' && <DeleteUserDialog />}
    </div>
  );
}
```

```tsx
// pages/_protected/users/UserDetailPage.tsx
import { useParams } from '@tanstack/react-router';
import { UserDetail } from '@/modules/users';

export function UserDetailPage() {
  const { userId } = useParams({ from: '/_protected/users/$userId' });
  return <UserDetail userId={userId} />;
}
```

---

## Routes

Route files are thin. They declare the route with `createFileRoute` and render the page. Nothing else.

```
routes/
├── __root.tsx                  # Root route
├── _auth.tsx                   # Layout route → AuthLayout
├── _auth/
│   ├── login.tsx               # → LoginPage
│   └── register.tsx            # → RegisterPage
├── _protected.tsx              # Layout route → ProtectedLayout
└── _protected/
    └── users/
        ├── index.tsx           # → UsersListPage
        └── $userId.tsx         # → UserDetailPage
```

### Layout routes

Layout routes render the layout with `<Outlet />` — TanStack Router injects child routes into the outlet:

```ts
// routes/_protected.tsx
export const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
});

// routes/_auth.tsx
export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
});
```

### Page routes

```ts
// routes/_protected/users/index.tsx
export const Route = createFileRoute('/_protected/users/')({
  component: UsersListPage,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(usersListOptions()),
});

// routes/_protected/users/$userId.tsx
export const Route = createFileRoute('/_protected/users/$userId')({
  component: UserDetailPage,
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(userDetailOptions(params.userId)),
});
```

### Auth route

```ts
// routes/_auth/login.tsx
export const Route = createFileRoute('/_auth/login')({
  component: LoginPage,
});
```

---

## Type-Safe Navigation

```ts
import { useNavigate, Link } from "@tanstack/react-router"

// imperative
const navigate = useNavigate()
navigate({ to: "/_protected/users/$userId", params: { userId: user.id } })

// declarative
<Link to="/_protected/users/$userId" params={{ userId: user.id }}>
  View profile
</Link>
```

---

## Route Context (queryClient)

Pass `queryClient` through router context so loaders can prefetch:

```ts
// main.tsx
const router = createRouter({
  routeTree,
  context: { queryClient },
});
```

```ts
// Declare context type in __root.tsx
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: RootComponent,
  }
);
```

---

## Rules

- Route files render exactly one page component — no JSX logic in route files.
- Layouts live in `layouts/` — never inline layout JSX in a route file.
- Pages live in `pages/` — they are the only place that composes multiple module components together.
- Use loaders to prefetch data — prefer `ensureQueryData` over `fetchQuery` so cached data is reused.
- Always mirror the folder structure: `pages/_protected/users/` ↔ `routes/_protected/users/`.
