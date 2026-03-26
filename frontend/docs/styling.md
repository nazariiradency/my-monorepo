# Styling — SCSS + Tailwind + shadcn/ui

## Three Tools, Three Jobs

| Tool          | Use for                                                        | Never use for                                         |
| ------------- | -------------------------------------------------------------- | ----------------------------------------------------- |
| **Tailwind**  | Component-level utilities, layout, spacing, color, responsive  | Global styles, complex animations, design tokens      |
| **SCSS**      | Global styles, CSS variables, design tokens, keyframes, mixins | Styling individual components (use Tailwind instead)  |
| **shadcn/ui** | Base UI primitives (Button, Input, Dialog, Select…)            | Custom one-off components (build those with Tailwind) |

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

Both entry points are imported once in `main.tsx`:

```ts
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

Tailwind v4 uses a CSS-first configuration. The `@theme` block registers custom design tokens as Tailwind utilities. There is no `tailwind.config.ts`.

```css
/* styles/tailwind.css */
@import 'tailwindcss';

@theme inline {
  /* Wire CSS variables from _variables.scss as Tailwind utilities */
  --color-primary: var(--color-primary);
  --color-primary-hover: var(--color-primary-hover);
  --color-danger: var(--color-danger);
  --color-surface: var(--color-surface);
  --color-border: var(--color-border);
  --color-text: var(--color-text);
  --color-text-muted: var(--color-text-muted);

  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);

  --shadow-card: var(--shadow-card);
}
```

The `inline` keyword tells Tailwind to resolve the CSS variable at runtime (enabling dark mode token swaps) rather than inlining the raw value at build time.

---

## Adding a Design Token — Step by Step

A design token is a named CSS variable. Define it once; use it everywhere.

### Step 1 — Add to `_variables.scss`

```scss
// styles/_variables.scss
:root {
  --color-warning: #d97706; // amber-600
  --color-warning-subtle: #fef3c7; // amber-100
}

[data-theme='dark'] {
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

### Step 2 — Register in `tailwind.css`

```css
@theme inline {
  --color-warning: var(--color-warning);
  --color-warning-subtle: var(--color-warning-subtle);
}
```

### Step 3 — Use as a Tailwind utility

```tsx
<div className="bg-warning-subtle border border-warning text-warning rounded-md px-3 py-2">
  Warning message
</div>
```

---

## Adding an Animation — Step by Step

### Step 1 — Define `@keyframes` in `_animations.scss`

```scss
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
```

### Step 2 — Register in `tailwind.css`

```css
@theme inline {
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

In Tailwind v4, `--animate-*` keys generate `animate-*` utilities. `@keyframes` defined outside `@theme` are bundled automatically.

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

Mixins are for multi-property patterns reused across multiple SCSS files that Tailwind cannot express.

### Step 1 — Add to `_mixins.scss`

```scss
@mixin focus-ring {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

### Step 2 — Use in a `.module.scss` file

```scss
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

## When to Use `.module.scss`

Most components need only Tailwind. Add a `.module.scss` file **only** when you need:

- Complex pseudo-selectors (`::before`/`::after` with generated `content`)
- `:focus-within` combined with sibling selectors
- Multi-step CSS animations tied specifically to this component
- `:global()` overrides for deeply nested third-party elements

```scss
// ProductCard/ProductCard.module.scss
@use '@/styles/mixins' as *;

// animated underline — not expressible in Tailwind
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

---

## CSS Variables in Components

Design tokens from `_variables.scss` are available everywhere as CSS custom properties.

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

Never hardcode raw values in either place. If the token doesn't exist yet, add it first (see [Adding a Design Token](#adding-a-design-token--step-by-step)).

---

## shadcn/ui

Components are generated into `src/shared/ui/`. **Never edit generated files** — regenerate via CLI when you need a new one.

### Adding a new shadcn component

**Step 1 — run the CLI** (from the `frontend/` directory):

```bash
pnpm dlx shadcn@latest add <component-name>
```

Examples:

```bash
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add dropdown-menu
pnpm dlx shadcn@latest add tooltip
```

The CLI writes the file to `src/shared/ui/<component-name>.tsx` and installs any required `@radix-ui/react-*` package.

**Step 2 — re-export from the barrel**

Open `src/shared/ui/index.ts` and add an export line for every named export the new file contains:

```ts
// src/shared/ui/index.ts
export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from './select';
```

**Step 3 — use it**

Import from the barrel, never from the generated file directly:

```tsx
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/ui';
```

### Extending shadcn components

Never modify generated files. Create a wrapper in `shared/components/` instead. See [docs/primitives.md](./primitives.md).

---

## Decision Guide — Which Tool to Use

| Situation                                        | Tool                                       |
| ------------------------------------------------ | ------------------------------------------ |
| Layout, spacing, color, typography               | Tailwind                                   |
| Responsive variants (`md:`, `lg:`)               | Tailwind                                   |
| State variants (`hover:`, `focus:`, `disabled:`) | Tailwind                                   |
| `::before` / `::after` with `content`            | `.module.scss`                             |
| `:focus-within` + child selector                 | `.module.scss`                             |
| Design token (new color, radius, spacing)        | `_variables.scss` → `tailwind.css @theme`  |
| Keyframe animation                               | `_animations.scss` → `tailwind.css @theme` |
| Reusable multi-property SCSS rule                | `_mixins.scss`                             |
| Standard UI primitive (button, input, dialog)    | shadcn                                     |
| Domain-specific component or simple pattern      | Tailwind + `shared/components/`            |

---

## Anti-Patterns

```scss
// ❌ style a component in SCSS
.product-card { border-radius: 8px; padding: 1rem; }
// ✅ className="rounded-lg p-4" directly on the element

// ❌ hardcode a raw color
.badge { color: #4f46e5; }
// ✅ add token to _variables.scss → register in @theme → text-primary

// ❌ define a keyframe inline in a component
<style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
// ✅ _animations.scss → @theme → animate-spin
```

```tsx
// ❌ edit a shadcn-generated file
// shared/ui/button.tsx  ← never touch this
// ✅ create a wrapper in shared/components/

// ❌ arbitrary Tailwind value when a token exists
<div className="text-[#4f46e5]">
// ✅ register token → text-primary

// ❌ CSS variable without @theme registration
<div className="bg-(--color-primary)">
// ✅ register --color-primary in @theme inline → bg-primary
```
