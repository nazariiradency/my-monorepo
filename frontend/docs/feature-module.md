# Feature Module — Frontend Domain Unit (React)

A feature module is a **self-contained unit** for one domain entity.

It owns everything needed to display, mutate, and manage that entity — components, hooks, store, API, and schema.

---

# What a Module Contains

| Folder / File | Responsibility                           | Doc                                              |
| ------------- | ---------------------------------------- | ------------------------------------------------ |
| `components/` | UI building blocks for this entity       | [feature-components.md](./feature-components.md) |
| `hooks/`      | data fetching and mutation hooks         | —                                                |
| `store/`      | feature-scoped Zustand state             | —                                                |
| `api.ts`      | HTTP functions, query keys, queryOptions | [feature-api.md](./feature-api.md)               |
| `schema.ts`   | Zod schemas and derived TypeScript types | [feature-schema.md](./feature-schema.md)         |
| `index.ts`    | public barrel export                     | —                                                |

---

# File Structure

```text
modules/
  [entity]/
    components/
      [Entity]Table/
      [Entity]Form/
      [Entity]Dialogs/
      [Entity]Pagination/
    hooks/
      use[Entities].ts         ← list query hook
      use[Entity].ts           ← detail query hook
      useCreate[Entity].ts     ← create mutation hook
      useUpdate[Entity].ts     ← update mutation hook
      useDelete[Entity].ts     ← delete mutation hook
      index.ts
    store/
      [entity].store.ts        ← dialog mode, selected entity, pagination state
      index.ts
    api.ts                     ← HTTP functions + query keys + queryOptions
    schema.ts                  ← Zod schemas + TypeScript types
    index.ts                   ← public exports
```

---

# Data Flow

```text
Route loader
  └── queryClient.ensureQueryData([entities]ListOptions())   ← api.ts
        ↓ (cache warm)
Page
  └── [Entity]Table
        └── useQuery([entities]ListOptions(page))            ← hooks/
              └── fetch[Entities]()                         ← api.ts
                    └── api.get('/[entities]')              ← @/shared/lib
```

---

# Mutation Flow

```text
User clicks "Create"
  ↓
[Entity]Table → openCreate()    ← store/
  ↓
Page renders <Create[Entity]Dialog />
  ↓
useCreate[Entity]()             ← hooks/
  ├── useForm({ resolver: zodResolver(create[Entity]Schema) })  ← schema.ts
  └── useMutation → create[Entity]()                           ← api.ts
        ↓ on success
  invalidateQueries([entity]Keys.lists())                      ← api.ts
```

---

# index.ts — Public API

The module exposes only what the page needs:

```ts
// components
export { [Entity]Table } from './components/[Entity]Table';
export { [Entity]Dialogs } from './components/[Entity]Dialogs';

// store
export { use[Entity]Store } from './store';

// query options (for route loader)
export { [entities]ListOptions } from './api';
```

✔ Never export `api.ts` functions or `schema.ts` types directly from `index.ts`  
✔ Only export what the page and route loader actually need  
✔ Internal hooks, store slices, and schema stay private to the module

---

# Adding a New Module

1. Create `schema.ts` — define Zod schemas and derive types → [feature-schema.md](./feature-schema.md)
2. Create `api.ts` — define HTTP functions, query keys, queryOptions → [feature-api.md](./feature-api.md)
3. Create `hooks/` — data fetching and mutation hooks
4. Create `store/` — dialog mode, selected entity, pagination state
5. Create `components/` — table, form, dialogs, pagination → [feature-components.md](./feature-components.md)
6. Create `index.ts` — export only what the page needs
7. Create the page → [page.md](./page.md)
8. Create the route → [routes.md](./routes.md)
