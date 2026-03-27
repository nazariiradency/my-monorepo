# Feature Components — Module-Scoped UI (React)

UI building blocks that belong to a specific module.

```text
Page → Feature Component → hook (data) + store (state)
```

---

# File Structure

```text
modules/[entity]/
  components/
    [Entity]Table/
    [Entity]Form/
    [Entity]Pagination/
    [Entity]Dialogs/
      Create[Entity]Dialog.tsx
      Edit[Entity]Dialog.tsx
      Delete[Entity]Dialog.tsx
      index.ts
```

✔ One component per file  
✔ Each folder has `index.ts` barrel

---

# Naming

```text
[Entity][Role]          → TodoTable, TodoForm, TodoPagination
[Action][Entity][Role]  → CreateTodoDialog, EditTodoDialog
```

---

# Generic Component Pattern

```tsx
// [Entity][Role].tsx

// — Presentational: receives everything via props
interface [Entity][Role]Props {
  data: [Entity];
  onAction: (id: string) => void;
  isPending: boolean;
}

export function [Entity][Role]({ data, onAction, isPending }: [Entity][Role]Props) {
  return (
    // render using @/shared/ui primitives
  );
}

// — Connected: reads from store and hooks directly
export function [Entity][Role]() {
  // 1. read UI state from feature store
  const page    = use[Entity]Store((s) => s.page);
  const openEdit = use[Entity]Store((s) => s.openEdit);

  // 2. fetch data via feature hook (React Query under the hood)
  const { data, isLoading, isError } = use[Entities](page);

  // 3. render — always handle loading / error / empty
  if (isLoading) return <LoadingState />;
  if (isError)   return <ErrorState />;
  if (!data?.items.length) return <EmptyState />;

  return (
    // render rows, cards, etc.
    // call openEdit(item) on action buttons — never manage dialog state locally
  );
}
```

---

# Zustand in a Component

```tsx
// read single value
const page = use[Entity]Store((s) => s.page);

// read action
const openEdit = use[Entity]Store((s) => s.openEdit);

// use
<Button onClick={() => openEdit(item)}>Edit</Button>
```

✔ Always select granularly `(s) => s.field` — never spread the whole store

---

# React Query in a Component

```tsx
// via feature hook — never call queryOptions directly in components
const { data, isLoading, isError } = use[Entities](page, limit);

// mutation
const { mutate, isPending } = use[Action][Entity]();
<Button onClick={() => mutate(id)} disabled={isPending}>
  Delete
</Button>;
```

✔ Always go through a feature hook — never `useQuery` directly in a component

---

# Key Rules

✔ Connected component — uses hooks and store, minimal props  
✔ Presentational component — no hooks, no store, all data via props  
✔ Always handle loading / error / empty in connected components  
✔ Never manage dialog open state locally — delegate to store  
✔ Never cross module boundaries
