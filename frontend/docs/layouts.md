# Layout — Shell Wrapper Components (React + TanStack Router)

Layout is a **persistent UI shell** rendered around a group of routes.

It is responsible for **structural chrome** — sidebar, header, navigation — that stays constant while page content changes.

---

# Core Idea

Layout = persistent shell + `<Outlet />`

```text
Layout (sidebar, header)
  └── <Outlet />   ← page renders here
```

---

# Responsibilities

Layout MUST:

- render structural chrome (sidebar, header, nav, footer)
- render `<Outlet />` where child routes appear
- read global UI state from shared store (sidebar open/close)

Layout MUST NOT:

- fetch data
- contain page-specific logic
- render feature components directly (only via `<Outlet />`)
- manage feature state

---

# Naming Convention

## Pattern

```text
[Name]Layout
```

## Examples

```text
ProtectedLayout   ← authenticated app shell (sidebar + header)
AuthLayout        ← unauthenticated shell (centered card)
OnboardingLayout  ← step-by-step wrapper
```

✔ Always suffixed with `Layout`  
✔ Name describes the context, not the feature

---

# File Structure

```text
src/
  layouts/
    ProtectedLayout/
      ProtectedLayout.tsx
      ProtectedLayout.module.scss
      index.ts
    AuthLayout/
      AuthLayout.tsx
      AuthLayout.module.scss
      index.ts
```

Each layout lives in its own folder with an `index.ts` barrel.

---

# index.ts

```ts
export { [Name]Layout } from './[Name]Layout';
```

---

# How Layouts Connect to Routes

Layouts are assigned to pathless layout routes in TanStack Router:

```tsx
// routes/_protected.tsx
export const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
});
```

The underscore prefix (`_protected`) means the layout wraps routes without adding a URL segment.

---

# `ProtectedLayout` — Authenticated App Shell

Wraps all authenticated routes. Provides sidebar + topbar + main content area.

## Structure

```text
ProtectedLayout
  ├── Mobile overlay      ← closes sidebar on mobile tap
  ├── <aside>             ← sidebar with nav links
  │     ├── Logo / brand
  │     └── <nav>         ← feature nav links
  ├── <header>            ← topbar with menu toggle
  └── <main>
        └── <Outlet />    ← page renders here
```

## Sidebar State

Sidebar open/close is driven by global store — not local state:

```ts
const sidebarOpen = useAppStore((s) => s.sidebarOpen);
const toggleSidebar = useAppStore((s) => s.toggleSidebar);
```

✔ Store-driven state persists across route navigations  
✔ Mobile: sidebar slides in as overlay, closed on nav link click  
✔ Desktop: sidebar is static, always visible

## Adding a Nav Link

```tsx
<Link
  to="/[entity]"
  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
            text-zinc-700 hover:bg-zinc-100 transition-colors"
  onClick={() => {
    if (window.innerWidth < 768) toggleSidebar();
  }}
>
  <[Icon] className="h-4 w-4" />
  [Label]
</Link>
```

✔ Always close sidebar on mobile after navigation  
✔ Use `<Link>` from `@tanstack/react-router` — never `<a>`

---

# `AuthLayout` — Unauthenticated Shell

Centers content for login, register, and forgot-password pages.

## Structure

```text
AuthLayout
  └── centered container (max-w-md)
        └── <Outlet />   ← auth page renders here
```

## Pattern

```tsx
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

✔ No state, no store — purely structural  
✔ `max-w-md` keeps auth forms narrow and centered

---

# Generic Layout Pattern

```tsx
export function [Name]Layout() {
  return (
    <div className="[root layout classes]">

      {/* Optional: sidebar, header, nav */}

      <main className="[content area classes]">
        <Outlet />  {/* ← always present */}
      </main>

    </div>
  );
}
```

---

# Layout Comparison

|             | `ProtectedLayout`    | `AuthLayout`           |
| ----------- | -------------------- | ---------------------- |
| For         | authenticated routes | unauthenticated routes |
| Has sidebar | ✅                   | ❌                     |
| Has header  | ✅                   | ❌                     |
| Uses store  | ✅ (`sidebarOpen`)   | ❌                     |
| Complexity  | medium               | minimal                |
