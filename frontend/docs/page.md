# Page — Route-Level Component (React)

Page is the **top-level component rendered for a route**.

It is responsible for **composing feature components and dialogs** into a complete screen.

---

# Naming Convention

## Pattern

```text
[Entity]ListPage     ← list screen
[Entity]DetailPage   ← single entity screen
[Entity]CreatePage   ← dedicated create screen (if not a dialog)
```

---

# File Structure

```text
pages/
  _protected/               ← authenticated routes
    [entity]/
      [Entity]ListPage/
        [Entity]ListPage.tsx
        [Entity]ListPage.module.scss
        index.ts
```

Each page lives in its own folder.  
`index.ts` re-exports the component for clean imports.

---

# index.ts

```ts
export { [Entity]ListPage } from './[Entity]ListPage';
```

---

# Generic Page Pattern

```tsx
export function [Entity]ListPage() {
  const dialogMode = use[Entity]Store((s) => s.dialogMode);
  const selected[Entity] = use[Entity]Store((s) => s.selected[Entity]);
  const openCreate = use[Entity]Store((s) => s.openCreate);

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">[Entities]</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your [entities].</p>
        </div>
        <Button onClick={openCreate} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          New [entity]
        </Button>
      </div>

      {/* Main feature component */}
      <[Entity]Table />

      {/* Dialogs — driven by store state */}
      {dialogMode === 'create' && <Create[Entity]Dialog />}
      {dialogMode === 'edit' && selected[Entity] && (
        <Edit[Entity]Dialog [entity]={selected[Entity]} />
      )}
      {dialogMode === 'delete' && selected[Entity] && (
        <Delete[Entity]Dialog [entity]={selected[Entity]} />
      )}

    </div>
  );
}
```
