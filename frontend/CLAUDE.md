# Frontend Project Guide

## Overview

This React project follows a module-based architecture. Each feature module is self-contained and owns its schema, API layer, store, hooks, and components. Routes stay thin — they compose module pieces and nothing else.

## Technology Stack

- **React** 19+ / **TypeScript** 5+
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

| File                                                       | What it covers                                                   | Read when you need to…                              |
| ---------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------- |
| [docs/feature-module.md](./docs/feature-module.md)         | Feature module — step-by-step guide, folder structure, barrel    | Create a new feature module end-to-end              |
| [docs/feature-schema.md](./docs/feature-schema.md)         | Zod schemas — validation, inferred types, single source of truth | Define or update data shapes for a module           |
| [docs/feature-api.md](./docs/feature-api.md)               | Module HTTP layer — fetchers, queryKeys, queryOptions            | Add API calls, query keys, or query options         |
| [docs/feature-components.md](./docs/feature-components.md) | Module-scoped UI components — hooks, store, rendering            | Build or modify a feature component                 |
| [docs/page.md](./docs/page.md)                             | Page components — composing feature components into a screen     | Add or change a route-level page                    |
| [docs/routes.md](./docs/routes.md)                         | TanStack Router — file-based routing, URL structure, navigation  | Add a new route or wire a page to a URL             |
| [docs/layouts.md](./docs/layouts.md)                       | Layout shell components — sidebar, header, Outlet                | Add or modify a layout wrapper                      |
| [docs/query.md](./docs/query.md)                           | TanStack Query — server state, caching, hooks, invalidation      | Fetch data, write mutations, or prefetch in loaders |
| [docs/state.md](./docs/state.md)                           | Zustand — UI state only, slices, selectors                       | Manage dialog state, auth session, or sidebar       |
| [docs/styling.md](./docs/styling.md)                       | SCSS, Tailwind, shadcn/ui — design tokens, animations, mixins    | Style a component, add a token, or install shadcn   |
| [docs/shared.md](./docs/shared.md)                         | Shared library — UI primitives, axios, global store, utilities   | Use or add a cross-module utility or component      |

---

## Project Structure

```
src/
├── modules/                        # Feature modules (domain-driven)
│   └── [module-name]/
│       ├── components/             # UI components scoped to this module
│       │   └── [Name]/
│       │       ├── [Name].tsx
│       │       ├── [Name].module.scss
│       │       └── index.ts
│       ├── hooks/                  # TanStack Query hooks (one file per intent)
│       ├── store/                  # Zustand UI state
│       ├── schema.ts               # Zod schemas + inferred TS types
│       ├── api.ts                  # fetchers + queryKeys + queryOptions
│       └── index.ts                # public barrel — only export what others need
│
├── styles/                         # Global SCSS
│   ├── globals.scss                # Entry point — imports all partials
│   ├── _variables.scss             # CSS custom properties (design tokens)
│   ├── _typography.scss
│   ├── _animations.scss
│   ├── _reset.scss
│   └── _mixins.scss
│
├── shared/
│   ├── ui/                         # shadcn-generated components (never edit directly)
│   ├── components/                 # Common cross-module components
│   ├── hooks/                      # Cross-module hooks (useDebounce, useMediaQuery…)
│   ├── lib/
│   │   ├── queryClient.ts
│   │   └── axios.ts                # axios instance + interceptors
│   ├── stores/                     # Global Zustand store
│   │   ├── authSlice.ts
│   │   ├── uiSlice.ts
│   │   └── index.ts                # combines slices → useAppStore
│   ├── types/
│   └── constants/
│
├── pages/                          # Page components (composed from module pieces)
│   ├── _auth/
│   └── _protected/
│
├── layouts/                        # Layout shell components
│   ├── AuthLayout/
│   └── ProtectedLayout/
│
├── routes/                         # TanStack Router file-based routes (thin)
│   ├── __root.tsx
│   ├── _auth.tsx / _auth/
│   └── _protected.tsx / _protected/
│
└── main.tsx                        # QueryClientProvider + RouterProvider
```

---

## Layer Responsibilities

| Layer                   | Lives in                     | Responsibility                              |
| ----------------------- | ---------------------------- | ------------------------------------------- |
| Schema                  | `modules/[name]/schema.ts`   | Zod schemas, inferred types                 |
| API                     | `modules/[name]/api.ts`      | fetchers, queryKeys, queryOptions           |
| Store                   | `modules/[name]/store/`      | UI state — dialog mode, selected item       |
| Hooks                   | `modules/[name]/hooks/`      | Query + mutation + form integration         |
| Components              | `modules/[name]/components/` | Render, call hooks, no logic                |
| Pages                   | `pages/`                     | Compose module components into a full page  |
| Layouts                 | `layouts/`                   | Shell UI — sidebar, header, nav             |
| UI primitives           | `shared/ui/` (shadcn)        | Never edit generated files                  |
| Shared components       | `shared/components/`         | Common components reused across modules     |
| Styling (components)    | Tailwind utilities           | `className` on JSX elements                 |
| Styling (scoped)        | `[Name].module.scss`         | Complex selectors, animations per component |
| Styling (global/tokens) | `styles/*.scss`              | CSS variables, keyframes, mixins            |

---

## Data Flow

```
User interaction
  → Component calls hook
    → Hook (useForm + useMutation / useQuery)
      → api.ts fetcher → Server
      ← TanStack Query caches response
    ← Hook returns { data, isPending, form, onSubmit }
  ← Component renders
```

Form submission:

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

1. Create `src/modules/[name]/` — `schema.ts`, `api.ts`, `store/`, `hooks/`, `components/`, `index.ts`. See [docs/modules.md](./docs/modules.md).
2. Create `src/pages/_protected/[name]/[Name]ListPage.tsx` — compose module components. See [docs/routing.md](./docs/routing.md).
3. Create `src/routes/_protected/[name]/index.tsx` — wire route to page. See [docs/routing.md](./docs/routing.md).
4. Export everything public through `modules/[name]/index.ts`.
