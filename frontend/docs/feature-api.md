# Feature API — Module HTTP Layer (TanStack Query)

Feature API is the **data access layer for one module**.

It defines all HTTP calls, query keys, and query options for a single domain entity.

---

# File Location

```text
modules/
  [entity]/
    api.ts     ← this file
```

One file per module. Everything API-related for this entity lives here.

---

# Query Key Factory

Structured, hierarchical keys that allow precise cache invalidation.

## Pattern

```ts
const [entity]Keys = {
  all:    ()                     => ['[entities]'] as const,
  lists:  ()                     => ['[entities]', 'list'] as const,
  list:   (page: number, limit: number) => ['[entities]', 'list', { page, limit }] as const,
  detail: (id: string)           => ['[entities]', 'detail', id] as const,
};
export { [entity]Keys };
```

## Key Hierarchy

```text
['todos']                          ← invalidates everything
['todos', 'list']                  ← invalidates all list pages
['todos', 'list', { page, limit }] ← invalidates one specific page
['todos', 'detail', id]            ← invalidates one entity
```

✔ Always use `as const` — preserves literal types for type inference  
✔ Use `keys.lists()` to invalidate all pages after a mutation  
✔ Never write raw string arrays in hooks — always reference the key factory

---

# HTTP Functions

Plain async functions that call the API and return typed data.

## Pattern

```ts
// GET list
const fetch[Entities] = (page = 1, limit = 10): Promise<Paginated[Entities]> =>
  api.get('/[entities]', { params: { page, limit } }).then((r) => r.data);

// GET single
const fetch[Entity] = (id: string): Promise<[Entity]> =>
  api.get(`/[entities]/${id}`).then((r) => r.data);

// POST
const create[Entity] = (body: Create[Entity]Payload): Promise<[Entity]> =>
  api.post('/[entities]', body).then((r) => r.data);

// PATCH
const update[Entity] = ({ id, ...body }: { id: string } & Update[Entity]Payload): Promise<[Entity]> =>
  api.patch(`/[entities]/${id}`, body).then((r) => r.data);

// DELETE
const delete[Entity] = (id: string): Promise<void> =>
  api.delete(`/[entities]/${id}`).then(() => undefined);

export { fetch[Entities], fetch[Entity], create[Entity], update[Entity], delete[Entity] };
```

✔ Always return typed Promises — never `any`  
✔ `delete` returns `Promise<void>` — there is no response body  
✔ `update` destructures `id` from the payload — `id` goes in the URL, rest goes in the body

---

# Query Options

`queryOptions()` factories used in hooks and route loaders.

## Pattern

```ts
const [entities]ListOptions = (page = 1, limit = 10) =>
  queryOptions({
    queryKey: [entity]Keys.list(page, limit),
    queryFn: () => fetch[Entities](page, limit),
  });

const [entity]DetailOptions = (id: string) =>
  queryOptions({
    queryKey: [entity]Keys.detail(id),
    queryFn: () => fetch[Entity](id),
  });

export { [entities]ListOptions, [entity]DetailOptions };
```

✔ Export `queryOptions` factories, not raw `useQuery` calls — they work in both hooks and route loaders  
✔ Route loaders call `queryClient.ensureQueryData([entity]ListOptions())` for prefetching

## Usage in Hook

```ts
const { data } = useQuery([entities]ListOptions(page, limit));
```

## Usage in Route Loader

```ts
loader: ({ context: { queryClient } }) =>
  queryClient.ensureQueryData([entities]ListOptions()),
```

---

# Cache Invalidation in Mutations

After a successful mutation, invalidate the relevant list cache:

```ts
queryClient.invalidateQueries({ queryKey: [entity]Keys.lists() });
```

✔ `keys.lists()` — invalidates all list pages, not just the current one  
✔ Never invalidate `keys.all()` unless necessary — it also clears detail cache
