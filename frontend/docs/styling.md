# Styling — SCSS + Tailwind + shadcn/ui

## Three Tools, Three Jobs

Each tool has a distinct role. Never use them interchangeably.

| Tool          | Use for                                                                  | Never use for                                                  |
| ------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------- |
| **Tailwind**  | Component-level utility classes, layout, spacing, color, responsive      | Global styles, complex animations, design tokens               |
| **SCSS**      | Global styles, CSS variables, design tokens, keyframe animations, mixins | Styling individual components (use Tailwind instead)           |
| **shadcn/ui** | Base UI primitives (Button, Input, Dialog, Select…)                      | Custom one-off components (build those yourself with Tailwind) |

---

## Folder Structure

```
src/
├── styles/
│   ├── tailwind.css          # Tailwind v4 entry — @import 'tailwindcss' + @theme blocks
│   ├── globals.scss          # SCSS entry — imports all partials
│   ├── _variables.scss       # CSS custom properties (design tokens)
│   ├── _typography.scss      # Font-face, base type scale
│   ├── _animations.scss      # @keyframes definitions
│   ├── _reset.scss           # Base resets
│   └── _mixins.scss          # SCSS mixins and functions
│
├── shared/
│   └── ui/                   # shadcn-generated components (never edit)
│
└── main.tsx                  # imports tailwind.css and globals.scss
```

Both style entry points are imported once in `main.tsx`:

```ts
// main.tsx
import '@/styles/tailwind.css';
import '@/styles/globals.scss';
```

Tailwind is loaded as a Vite plugin — no PostCSS config needed:

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), react(), TanStackRouterVite(...)],
});
```

---

## SCSS Global Files

### globals.scss — entry point

Imports all SCSS partials in order. Add new partials here when you create one.

```scss
// styles/globals.scss
@use 'variables';
@use 'reset';
@use 'typography';
@use 'animations';
@use 'mixins';
```

### tailwind.css — Tailwind v4 entry

Tailwind v4 uses a CSS-first configuration. The `@theme` block is where you register custom design tokens as Tailwind utilities. There is no `tailwind.config.ts`.

```css
/* styles/tailwind.css */
@import 'tailwindcss';

@theme inline {
  /* Wire CSS variables from _variables.scss as Tailwind utilities */
  --color-primary: var(--color-primary);
  --color-primary-hover: var(--color-primary-hover);
  --color-danger: var(--color-danger);
  --color-surface: var(--color-surface);
  --color-surface-subtle: var(--color-surface-subtle);
  --color-border: var(--color-border);
  --color-text: var(--color-text);
  --color-text-muted: var(--color-text-muted);

  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
  --radius-xl: var(--radius-xl);

  --shadow-card: var(--shadow-card);
}
```

The `inline` keyword tells Tailwind to use the CSS variable reference at runtime (enabling dark mode token swaps) rather than inlining the raw value at build time.

---

## Adding a Design Token — Step by Step

A design token is a named CSS variable that represents a raw value (color, spacing, radius). Define it once; use it everywhere.

### Step 1 — Add the variable to `_variables.scss`

```scss
// styles/_variables.scss
:root {
  /* existing tokens... */

  // ✅ add your new token here
  --color-warning: #d97706; // amber-600
  --color-warning-subtle: #fef3c7; // amber-100
}

[data-theme='dark'] {
  // override for dark mode if needed
  --color-warning: #fbbf24; // amber-400
}
```

**Naming conventions:**

| Category      | Pattern                    | Example                  |
| ------------- | -------------------------- | ------------------------ |
| Color         | `--color-[role]`           | `--color-warning`        |
| Color variant | `--color-[role]-[variant]` | `--color-warning-subtle` |
| Spacing       | `--spacing-[name]`         | `--spacing-page-x`       |
| Border radius | `--radius-[size]`          | `--radius-lg`            |
| Shadow        | `--shadow-[name]`          | `--shadow-card`          |
| Transition    | `--transition-[name]`      | `--transition-base`      |

### Step 2 — Register it in `tailwind.css`

Add a matching entry in the `@theme inline` block so the token becomes a Tailwind utility:

```css
/* styles/tailwind.css */
@theme inline {
  /* existing entries... */
  --color-warning: var(--color-warning);
  --color-warning-subtle: var(--color-warning-subtle);
}
```

### Step 3 — Use as a Tailwind utility

Tailwind generates utilities from `@theme` entries automatically:

```tsx
// bg-warning, text-warning, border-warning, etc. are now available
<div className="bg-warning-subtle border border-warning text-warning rounded-md px-3 py-2">
  Warning message
</div>
```

---

## Adding an Animation — Step by Step

### Step 1 — Define the `@keyframes` in `_animations.scss`

```scss
// styles/_animations.scss

@keyframes slide-in-right {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
```

### Step 2 — Register it in `tailwind.css`

Add the animation and its keyframes to the `@theme` block:

```css
/* styles/tailwind.css */
@theme inline {
  /* existing tokens... */

  --animate-slide-in-right: slide-in-right 0.25s ease;
}

@keyframes slide-in-right {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
```

In Tailwind v4, `--animate-*` keys in `@theme` generate `animate-*` utility classes, and `@keyframes` defined outside `@theme` are bundled automatically.

### Step 3 — Use in JSX

```tsx
<div className="animate-slide-in-right">...</div>
```

### Existing animations

| Class             | Effect                           |
| ----------------- | -------------------------------- |
| `animate-fade-in` | Fades in with a 4px upward drift |
| `animate-spin`    | Continuous 360° rotation         |

---

## Adding a Mixin — Step by Step

Mixins are for patterns that cannot be expressed as a Tailwind utility — complex multi-property rules reused across multiple SCSS contexts.

### Step 1 — Add the mixin to `_mixins.scss`

```scss
// styles/_mixins.scss

// existing mixins...

// focus ring consistent with design system
@mixin focus-ring {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

### Step 2 — Use it in a `.module.scss` file

```scss
// modules/products/components/ProductCard/ProductCard.module.scss
@use '@/styles/mixins' as *;

.card:focus-visible {
  @include focus-ring;
}
```

### Existing mixins

| Mixin            | What it does                                          |
| ---------------- | ----------------------------------------------------- |
| `page-container` | Horizontal page padding + max-width + centered margin |
| `truncate`       | Single-line text truncation with ellipsis             |

---

## Styling a Component — Step by Step

Most components need only Tailwind. Reach for a `.module.scss` file only when Tailwind cannot express the style.

### Step 1 — Use Tailwind utilities directly in JSX

Tailwind handles layout, spacing, color, typography, responsive, hover, focus:

```tsx
// modules/products/components/ProductCard/ProductCard.tsx
export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-sm font-semibold text-zinc-900 truncate">
        {product.name}
      </h3>
      <p className="mt-1 text-xs text-zinc-500">{product.category}</p>
    </div>
  );
}
```

No `.module.scss` file needed — Tailwind covers everything here.

### Step 2 — Add a `.module.scss` only for what Tailwind cannot express

Create `[Name].module.scss` in the same folder **only** when you need:

- Complex pseudo-selectors (`:nth-child`, `::before`/`::after` with generated content)
- `:focus-within` combined with sibling selectors
- Multi-step CSS animations tied specifically to this component
- `:global()` overrides for deeply nested third-party elements

```scss
// ProductCard/ProductCard.module.scss
@use '@/styles/mixins' as *;
@use '@/styles/variables' as *;

// animated underline on the card title — not expressible in Tailwind
.title::after {
  content: '';
  display: block;
  height: 2px;
  background: var(--color-primary);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--transition-base);
}

.card:hover .title::after {
  transform: scaleX(1);
}
```

```tsx
// ProductCard/ProductCard.tsx
import styles from './ProductCard.module.scss';

export function ProductCard({ product }: { product: Product }) {
  return (
    <div
      className={`rounded-lg border border-zinc-200 bg-white p-4 ${styles.card}`}
    >
      <h3 className={`text-sm font-semibold text-zinc-900 ${styles.title}`}>
        {product.name}
      </h3>
    </div>
  );
}
```

### Step 3 — Add the barrel index.ts

```ts
// ProductCard/index.ts
export { ProductCard } from './ProductCard';
```

### When to reach for each tool

| Situation                                              | Tool           |
| ------------------------------------------------------ | -------------- |
| Layout, spacing, color, typography                     | Tailwind       |
| Responsive variants (`md:`, `lg:`)                     | Tailwind       |
| State variants (`hover:`, `focus:`, `disabled:`)       | Tailwind       |
| `::before` / `::after` with `content`                  | `.module.scss` |
| `:focus-within` + child selector                       | `.module.scss` |
| Animate a third-party element you can't add a class to | `.module.scss` |

---

## CSS Variables in Components

Design tokens from `_variables.scss` are available everywhere as CSS custom properties. In Tailwind utilities they map to the classes registered in `@theme`. In `.module.scss` files use them directly via `var()`.

```scss
// .module.scss — use var() directly
.badge {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  transition: background var(--transition-base);
}
```

```tsx
// JSX — use the Tailwind utility class (registered in @theme)
<span className="border border-border rounded-sm">...</span>
```

Never hardcode raw values in either place — if the token doesn't exist yet, add it first (see [Adding a Design Token](#adding-a-design-token--step-by-step)).

---

## shadcn/ui

Components are generated into `src/shared/ui/`. **Never edit generated files directly** — re-generate via CLI when you need a new one.

### Adding a new shadcn component — step by step

**Step 1 — find the component name**

Browse the shadcn catalog at [ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components). Note the slug used in the CLI command (e.g. `select`, `dropdown-menu`, `tooltip`).

**Step 2 — run the CLI**

From the `frontend/` directory:

```bash
cd frontend
pnpm dlx shadcn@latest add <component-name>
```

Examples:

```bash
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add dropdown-menu
pnpm dlx shadcn@latest add tooltip
```

The CLI will:

- Write the component file to `src/shared/ui/<component-name>.tsx`
- Install any required `@radix-ui/react-*` package into `frontend/package.json` automatically

**Step 3 — re-export from the barrel**

Open `src/shared/ui/index.ts` and add an export line for every named export the new file contains. Check the generated file to see what it exports.

```ts
// src/shared/ui/index.ts

// example: after adding select
export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './select';
```

**Step 4 — use it**

Import from the barrel, never from the file directly:

```tsx
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/ui';
```

---

### Extending shadcn components

Never modify the generated file. Create a wrapper instead:

```tsx
// shared/ui/danger-button.tsx  ← your wrapper
import { Button, type ButtonProps } from './button';

export function DangerButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      variant="outline"
      className={`border-red-200 text-red-500 hover:bg-red-50 ${className ?? ''}`}
      {...props}
    />
  );
}
```

Export the wrapper from `index.ts` the same way as any other component.

---

## Decision Guide — Which Tool to Use

**Use Tailwind when:**

- Styling a component (layout, spacing, color, typography, responsive)
- The style is one-off and local to that component
- You need responsive variants (`md:`, `lg:`)
- You need state variants (`hover:`, `focus:`, `disabled:`)

**Use SCSS when:**

- Defining a design token (add to `_variables.scss`)
- Writing a `@keyframes` animation (add to `_animations.scss`)
- Writing a reusable mixin (add to `_mixins.scss`)
- Styling third-party elements you cannot add classes to

**Use shadcn when:**

- You need a standard UI primitive (button, input, dialog, select, dropdown)
- The component already exists in the shadcn catalog

**Build with Tailwind (not shadcn) when:**

- The component is domain-specific (e.g. `UserRoleBadge`, `StatusIndicator`)
- No equivalent exists in shadcn
- The component is too simple to warrant a full shadcn primitive

---

## Anti-Patterns — Never Do These

```scss
// ❌ style a specific component in SCSS
.product-card {
  border-radius: 8px;
  padding: 1rem;
}
// ✅ use Tailwind utilities directly on the element: className="rounded-lg p-4"

// ❌ hardcode a raw color value in SCSS
.badge { color: #4f46e5; }
// ✅ define it as a CSS variable in _variables.scss, wire it in tailwind.css @theme,
//    then use the Tailwind utility: text-primary

// ❌ define a one-off keyframe inline in a component file
<style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
// ✅ define in _animations.scss, register in tailwind.css @theme, use animate-spin
```

```tsx
// ❌ edit a shadcn-generated file
// shared/ui/button.tsx  ← never touch this
// ✅ create a wrapper: shared/ui/danger-button.tsx

// ❌ mix inline style with Tailwind for the same property
<div style={{ borderRadius: '8px' }} className="rounded-lg">
// ✅ pick one — prefer Tailwind

// ❌ use arbitrary Tailwind values when a token exists
<div className="text-[#4f46e5]">
// ✅ add the color to _variables.scss → register in tailwind.css @theme → text-primary

// ❌ use a Tailwind utility that has no token backing it
<div className="bg-[var(--color-primary)]">
// ✅ register --color-primary in @theme inline, then: bg-primary
```
