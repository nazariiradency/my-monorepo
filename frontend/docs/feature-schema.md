# Feature Schema — Validation & Types (Zod)

Feature schema is the **single source of truth for data shapes in a module**.

It defines runtime validation schemas and derives all TypeScript types from them.

---

# File Location

```text
modules/
  [entity]/
    schema.ts     ← this file
```

One file per module. All schemas and types for the entity live here.

---

# Schema Types

| Schema                      | Purpose                           | Used in               |
| --------------------------- | --------------------------------- | --------------------- |
| `[entity]Schema`            | shape of entity returned from API | API functions, hooks  |
| `paginated[Entities]Schema` | shape of paginated list response  | API functions         |
| `create[Entity]Schema`      | payload for create operation      | forms, mutation hooks |
| `update[Entity]Schema`      | payload for update operation      | forms, mutation hooks |

---

# Pattern

```ts
import { z } from 'zod/v3';

// Entity shape — mirrors API response
const [entity]Schema = z.object({
  id: z.string(),
  // domain fields
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Paginated list shape
const paginated[Entities]Schema = z.object({
  items: z.array([entity]Schema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

// Create payload — validation rules for forms
const create[Entity]Schema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
});

// Update payload — all fields optional
const update[Entity]Schema = z.object({
  title: z.string().min(1).max(255).optional(),
  // other updatable fields
});

// Derived TypeScript types
type [Entity]            = z.infer<typeof [entity]Schema>;
type Paginated[Entities] = z.infer<typeof paginated[Entities]Schema>;
type Create[Entity]Payload = z.infer<typeof create[Entity]Schema>;
type Update[Entity]Payload = z.infer<typeof update[Entity]Schema>;

export { [entity]Schema, paginated[Entities]Schema, create[Entity]Schema, update[Entity]Schema };
export { type [Entity], type Paginated[Entities], type Create[Entity]Payload, type Update[Entity]Payload };
```

---

# Two Responsibilities of One Schema

Create and update schemas serve double duty:

```text
1. Form validation  → passed to useForm({ resolver: zodResolver(create[Entity]Schema) })
2. TypeScript type  → exported as Create[Entity]Payload, used in api.ts and hooks
```

✔ Define the schema once — types and validation rules stay in sync automatically

---

# Entity Schema vs Payload Schema

|                         | Entity schema                  | Payload schema                 |
| ----------------------- | ------------------------------ | ------------------------------ |
| Purpose                 | describes what the API returns | describes what the API accepts |
| Has `id`                | ✅                             | ❌                             |
| Has timestamps          | ✅                             | ❌                             |
| Has validation messages | ❌                             | ✅                             |
| Used in forms           | ❌                             | ✅                             |

---

# Update Schema Convention

All fields in the update schema are optional:

```ts
const update[Entity]Schema = z.object({
  field: z.string().optional(),
});
export { update[Entity]Schema };
```

✔ Mirrors the backend `UpdateDto` where all fields are optional (PATCH semantics)

---

# Where Types Are Used

```text
schema.ts
  ↓ exports types
  ├── api.ts          ← function signatures: Promise<Todo>, CreateTodoPayload
  ├── hooks/          ← useQuery<Todo>, useMutation<Todo, UpdateTodoPayload>
  └── components/     ← props: { todo: Todo }, form: UseFormReturn<CreateTodoPayload>
```

✔ Always import types from `./schema` or `../../schema` within the module  
✔ Never redefine types that already exist in the schema
