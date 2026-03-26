# Feature Components — Module-Scoped UI (React)

Feature components are **UI building blocks that belong to a specific module**.

They encapsulate all visual and interactive logic for one domain entity.

---

# Naming Convention

## Pattern

```text
[Entity][Role]
```

## Examples

```text
TodoTable       ← displays list of todos
TodoForm        ← shared form for create/edit
TodoPagination  ← pagination controls
TodoDialogs     ← create, edit, delete dialogs
```

✔ Always prefixed with the entity name  
✔ Suffix describes the role: `Table`, `Form`, `Dialog`, `Pagination`, `Card`, `Filter`

---

# File Structure

```text
modules/
  [entity]/
    components/
      [Entity]Table/
        [Entity]Table.tsx
        [Entity]Table.module.scss
        index.ts
      [Entity]Form/
        [Entity]Form.tsx
        index.ts
      [Entity]Dialogs/
        [Entity]Dialogs.tsx
        index.ts
```

Each component lives in its own folder with an `index.ts` barrel.

---

# What Feature Components Import

```text
✅ @/shared/ui          ← shadcn primitives (Button, Dialog, Input…)
✅ Feature hooks        ← from ../../hooks
✅ Feature store        ← from ../../store
✅ Feature schema types ← from ../../schema
✅ Sibling components   ← from ../[Entity]Form etc.
✅ lucide-react         ← icons

❌ Other module's components
❌ @/pages
❌ Raw API calls
```
