# Layout — Shell Wrapper Components (React + TanStack Router)

Persistent UI shell rendered around a group of routes.

```text
Layout (sidebar, header)
  └── <Outlet />   ← page renders here
```

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
      index.ts
```

---

# Naming

```text
[Name]Layout

ProtectedLayout   ← authenticated shell (sidebar + header)
AuthLayout        ← unauthenticated shell (centered card)
```

✔ Always suffixed with `Layout`

---

# How Layouts Connect to Routes

```tsx
// routes/_protected.tsx
export const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
});
```

Underscore prefix keeps `_protected` out of the URL.  
Routes become `/todo`, not `/_protected/todo`.

---

# Generic Layout Pattern

```tsx
export function [Name]Layout() {
  // read global UI state if needed
  const sidebarOpen  = useAppStore((s) => s.sidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  return (
    <div className="flex h-screen">

      {/* optional: sidebar, header, nav */}
      <aside>
        <nav>
          <Link
            to="/[entity]"
            onClick={() => { if (window.innerWidth < 768) toggleSidebar(); }}
          >
            [Label]
          </Link>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />  {/* ← always required */}
      </main>

    </div>
  );
}
```

✔ `<Outlet />` is mandatory — child routes render here  
✔ Use `<Link>` from `@tanstack/react-router` — never `<a>`  
✔ Sidebar state lives in global store — never in `useState`  
✔ Close sidebar on mobile after navigation

---

# Key Rules

✔ Never fetch data in a layout  
✔ Never render feature components directly — only via `<Outlet />`  
✔ One layout per context — add a new one only when routes need a structurally different shell
