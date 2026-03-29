# Code Style Rules

## TypeScript

### Use `type` for prop typing

Always use `type` instead of `interface` for typing component props and all other type definitions.

```ts
// ✅ Correct
type ButtonProps = {
  label: string;
  onClick: () => void;
};

// ❌ Incorrect
interface ButtonProps {
  label: string;
  onClick: () => void;
}
```

### Use `type` instead of `interface` everywhere

Prefer `type` over `interface` across the entire codebase — not just for props.

```ts
// ✅ Correct
type User = {
  id: string;
  name: string;
};

// ❌ Incorrect
interface User {
  id: string;
  name: string;
}
```

### Use `as const` instead of `enum`

Never use TypeScript `enum`. Use `as const` objects instead, combined with the shared `valueOf` utility type (`shared/types`) when needed.

```ts
// ✅ Correct
const Direction = {
  Up: 'up',
  Down: 'down',
} as const;

type Direction = valueOf<typeof Direction>;

// ❌ Incorrect
enum Direction {
  Up = 'up',
  Down = 'down',
}
```

---

## File & Folder Structure

### One component per file

Every component must be placed in its own dedicated file.

### `enums/` folder — `as const` objects only

The `enums/` folder must contain **only** `as const` objects. No plain constants.

```ts
// enums/status.ts ✅
export const Status = {
  Active: 'active',
  Inactive: 'inactive',
} as const;
```

### `constants/` folder — plain constants only

The `constants/` folder must contain **only** plain `const` declarations. No `as const` objects.

```ts
// constants/config.ts ✅
export const MAX_RETRIES = 3;
export const APP_TIMEOUT_MS = 5000;
```

---

## Exports

### No wildcard re-exports

Never use `export * from '...'`. Always re-export by name.

```ts
// ✅ Correct
export { APP_NAME } from './appName';

// ❌ Incorrect
export * from './appName';
```

### Always declare and export separately

Never use `export` directly on a declaration. Always declare first, then export in a separate `export { }` statement.

```ts
// ✅ Correct
const QUERY_STALE_TIME = 1000 * 60 * 5;
export { QUERY_STALE_TIME };

type ValueOf<T> = T[keyof T];
export { type ValueOf };

// ❌ Incorrect
export const QUERY_STALE_TIME = 1000 * 60 * 5;
export type ValueOf<T> = T[keyof T];
```

---

## Shared Utilities

### `valueOf` type

Use the `valueOf` utility type from `shared/types` when working with `as const` objects as types.

```ts
import { type valueOf } from 'shared/types';

const Color = {
  Red: 'red',
  Blue: 'blue',
} as const;

type Color = valueOf<typeof Color>; // 'red' | 'blue'
```

### Inline `type` imports

Always place the `type` keyword **inside** the curly braces, not before the `import` keyword. This applies to all type-only imports.

```ts
// ✅ Correct
import { type valueOf } from 'shared/types';
import { type FC, type ReactNode } from 'react';

// ❌ Incorrect
import type { valueOf } from 'shared/types';
import type { FC, ReactNode } from 'react';
```
