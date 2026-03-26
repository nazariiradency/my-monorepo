# Frontend Project Guide

## Overview

This React project follows a module-based architecture. Each feature module is self-contained and owns its schema, API layer, store, hooks, and components. Routes stay thin — they compose module pieces and nothing else.

## Technology Stack

- **React** 18+
- **TypeScript** 5+
- **TanStack Router** — file-based routing, type-safe navigation
- **TanStack Query** — server state, caching, background refetching
- **Zustand** — client UI state, slice-based
- **React Hook Form** — form state and submission
- **Zod** — schema definition and runtime validation
- **shadcn/ui** — base UI primitives (Button, Input, Dialog, Select…)
- **Tailwind CSS** — component-level utility classes
- **SCSS** — global styles, design tokens (CSS variables), keyframe animations
- **Vite** — build tool

---

## Documentation Index

| File                                         | Topic                                                              |
| -------------------------------------------- | ------------------------------------------------------------------ |
| [CLAUDE.md](./CLAUDE.md)                     | Overview, project structure, data flow (this file)                 |
| [docs/modules.md](./docs/modules.md)         | Module architecture, schema, api, hooks, store, components, barrel |
| [docs/routing.md](./docs/routing.md)         | TanStack Router, pages, layouts, route groups, loaders, navigation |
| [docs/state.md](./docs/state.md)             | Zustand — global store, module store, slices, rules                |
| [docs/forms.md](./docs/forms.md)             | React Hook Form + Zod — schemas, resolvers, shadcn Form usage      |
| [docs/query.md](./docs/query.md)             | TanStack Query — queryKeys, queryOptions, hooks per intent         |
| [docs/styling.md](./docs/styling.md)         | SCSS, Tailwind, shadcn/ui — three tools, three jobs                |
| [docs/conventions.md](./docs/conventions.md) | Naming conventions, anti-patterns                                  |

---

## Project Structure

```
src/
├── modules/                        # Feature modules (domain-driven)
│   └── [module-name]/
│       ├── components/             # UI components scoped to this module
│       │   ├── [Name]Form/
│       │   │   ├── [Name]Form.tsx          # Form component (RHF + Zod)
│       │   │   ├── [Name]Form.module.scss  # Component-scoped styles
│       │   │   └── index.ts                # re-exports component
│       │   ├── [Name]Table/
│       │   │   ├── [Name]Table.tsx         # List view
│       │   │   ├── [Name]Table.module.scss
│       │   │   └── index.ts
│       │   └── [Name]Dialogs/
│       │       ├── [Name]Dialogs.tsx       # Create / Edit / Delete dialogs
│       │       ├── [Name]Dialogs.module.scss
│       │       └── index.ts
│       ├── hooks/                  # TanStack Query hooks
│       │   ├── use[Names].ts       # useQuery — list
│       │   ├── use[Name].ts        # useQuery — single item
│       │   ├── useCreate[Name].ts  # useMutation + useForm
│       │   ├── useUpdate[Name].ts  # useMutation + useForm
│       │   ├── useDelete[Name].ts  # useMutation only
│       │   └── index.ts            # barrel re-exports
│       ├── store/                  # Zustand UI state
│       │   ├── [module]Slice.ts    # slice definition
│       │   └── index.ts            # re-exports store hook
│       ├── schema.ts               # Zod schemas + inferred TS types
│       ├── api.ts                  # fetchers + queryKeys + queryOptions
│       └── index.ts                # public barrel — only export what others need
│
├── styles/                         # Global SCSS
│   ├── globals.scss                # Entry point — imports all partials + Tailwind directives
│   ├── _variables.scss             # CSS custom properties (design tokens)
│   ├── _typography.scss            # Font-face, base type scale
│   ├── _animations.scss            # @keyframes definitions
│   ├── _reset.scss                 # Base resets
│   └── _mixins.scss                # SCSS mixins and functions
│
├── shared/
│   ├── index.ts                    # Barrel — re-exports all shared utilities
│   ├── ui/                         # shadcn-generated components (never edit directly)
│   │   └── index.ts                # Barrel — re-exports all UI components
│   ├── hooks/                      # cross-module hooks (useDebounce, useMediaQuery etc.)
│   │   └── index.ts
│   ├── lib/
│   │   ├── index.ts                # Barrel — re-exports api, queryClient
│   │   ├── queryClient.ts          # TanStack Query client config
│   │   └── axios.ts                # axios instance + interceptors
│   ├── stores/                     # global Zustand store
│   │   ├── authSlice.ts
│   │   ├── uiSlice.ts
│   │   └── index.ts                # combines slices → useAppStore
│   ├── types/                      # global TypeScript types
│   │   └── index.ts
│   └── constants/
│       └── index.ts
│
├── pages/                          # Page components (composed from module pieces)
│   ├── _auth/
│   │   ├── LoginPage/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── LoginPage.module.scss
│   │   │   └── index.ts
│   │   └── RegisterPage/
│   │       ├── RegisterPage.tsx
│   │       ├── RegisterPage.module.scss
│   │       └── index.ts
│   └── _protected/
│       └── [module]/
│           ├── [Module]ListPage/
│           │   ├── [Module]ListPage.tsx
│           │   ├── [Module]ListPage.module.scss
│           │   └── index.ts
│           ├── [Module]DetailPage/
│           │   ├── [Module]DetailPage.tsx
│           │   ├── [Module]DetailPage.module.scss
│           │   └── index.ts
│           └── [Module]CreatePage/
│               ├── [Module]CreatePage.tsx
│               ├── [Module]CreatePage.module.scss
│               └── index.ts
│
├── layouts/                        # Layout shell components
│   ├── AuthLayout/
│   │   ├── AuthLayout.tsx          # Unauthenticated shell (centered card)
│   │   ├── AuthLayout.module.scss
│   │   └── index.ts
│   └── ProtectedLayout/
│       ├── ProtectedLayout.tsx     # Authenticated shell (sidebar + header)
│       ├── ProtectedLayout.module.scss
│       └── index.ts
│
├── routes/                         # TanStack Router file-based routes (thin)
│   ├── __root.tsx                  # Root route — wraps RouterProvider
│   ├── _auth.tsx                   # Auth layout route — renders AuthLayout
│   ├── _auth/
│   │   ├── login.tsx               # → renders LoginPage
│   │   └── register.tsx            # → renders RegisterPage
│   ├── _protected.tsx              # Protected layout route — renders ProtectedLayout
│   └── _protected/
│       └── [module]/
│           └── index.tsx           # → renders [Module]ListPage
│
└── main.tsx                        # QueryClientProvider + RouterProvider
```

---

## Layer Responsibilities

| Layer                    | Lives in                     | Responsibility                              |
| ------------------------ | ---------------------------- | ------------------------------------------- |
| Schema                   | `modules/[name]/schema.ts`   | Zod schemas, inferred types                 |
| API                      | `modules/[name]/api.ts`      | fetchers, queryKeys, queryOptions           |
| Store                    | `modules/[name]/store/`      | UI state — dialog mode, selected item       |
| Hooks                    | `modules/[name]/hooks/`      | Query + mutation + form integration         |
| Components               | `modules/[name]/components/` | Render, call hooks, no logic                |
| Pages                    | `pages/`                     | Compose module components into a full page  |
| Layouts                  | `layouts/`                   | Shell UI — sidebar, header, nav             |
| Styling (components)     | Tailwind utilities           | `className` on JSX elements                 |
| Styling (scoped)         | `[Name].module.scss`         | Complex selectors, animations per component |
| Styling (globals/tokens) | `styles/*.scss`              | CSS variables, keyframes, mixins            |
| UI primitives            | `shared/ui/` (shadcn)        | Never edit generated files                  |

---

## Data Flow

```
User interaction
  → Component calls hook
    → Hook (useForm + useMutation / useQuery)
      → api.ts fetcher
        → Server
      ← TanStack Query caches response
    ← Hook returns { data, isPending, form, onSubmit }
  ← Component renders
```

Form submission flow:

```
onSubmit (RHF handleSubmit)
  → Zod validation (zodResolver)
    ✗ fails  → form.setError, component re-renders
    ✓ passes → mutation.mutate(data)
      → api.ts mutationFn → Server
      ← onSuccess: invalidateQueries + closeDialog + form.reset
```

---

## Adding a New Feature Module

1. Create `src/modules/[name]/` with `schema.ts`, `api.ts`, `store/`, `hooks/`, `components/`, `index.ts`.
2. Create `src/pages/_protected/[name]/[Name]ListPage.tsx` — compose module components.
3. Create `src/routes/_protected/[name]/index.tsx` — wire route to page. See [docs/routing.md](./docs/routing.md).
4. Export everything public through `modules/[name]/index.ts`.

---

## CSS Module Scope Rules

Each component folder contains a `.module.scss` file. Use it only when Tailwind cannot express the style cleanly.

**Use `.module.scss` for:**

- Complex pseudo-selectors (`:nth-child`, `::before`, `::after` with content)
- Multi-step CSS animations tied to one component
- Styles on third-party DOM elements you cannot add `className` to
- `:global()` overrides for deeply nested third-party components

**Use Tailwind for everything else** — layout, spacing, color, typography, hover, focus, responsive.

**Never use `.module.scss` for:**

- Colors, spacing, or radius that have tokens — use `text-primary`, `rounded-lg`, etc.
- Simple hover/focus states — Tailwind `hover:` and `focus:` cover these
- Reusable design tokens — those belong in `styles/_variables.scss`

```tsx
// UserForm/UserForm.tsx
import styles from './UserForm.module.scss';

export function UserForm({ form, onSubmit, isPending, submitLabel }) {
  return (
    // Tailwind for layout and spacing
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Tailwind for most styles, module class for the complex part */}
      <div className={`relative ${styles.fieldWrapper}`}>
        <input className="w-full rounded-lg border px-3 py-2 text-sm" />
      </div>
    </form>
  );
}
```

```scss
// UserForm/UserForm.module.scss
.fieldWrapper {
  // only what Tailwind cannot express
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: var(--color-primary);
    transform: scaleX(0);
    transition: transform var(--transition-base);
  }

  &:focus-within::after {
    transform: scaleX(1);
  }
}
```

Component `index.ts` re-exports the component so imports from outside remain clean:

```ts
// UserForm/index.ts
export { UserForm } from './UserForm';
```

```ts
// consumers import from the folder, not the file
import { UserForm } from '../components/UserForm';
```

---

## main.tsx Setup

```tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { queryClient } from '@/shared/lib/queryClient';

const router = createRouter({
  routeTree,
  context: { queryClient },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
);
```
