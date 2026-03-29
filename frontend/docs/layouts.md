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
    [Name]Layout/
      [Name]Layout.tsx
      [Name]Layout.module.scss  ← optional
      index.ts
```

---

# Naming

```text
[Name]Layout
```

✔ Always suffixed with `Layout`

---

# How Layouts Connect to Routes

```tsx
// routes/_protected.tsx
const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
});
export { Route };
```

Underscore prefix keeps `_protected` out of the URL.  
Routes become `/todo`, not `/_protected/todo`.

---

# Generic Layout Pattern

```tsx
function [Name]Layout() {
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
export { [Name]Layout };
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
