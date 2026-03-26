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
│   ├── globals.scss          # Entry point — imports all partials
│   ├── _variables.scss       # CSS custom properties (design tokens)
│   ├── _typography.scss      # Font-face, base type scale
│   ├── _animations.scss      # @keyframes definitions
│   ├── _reset.scss           # Base resets (on top of Tailwind preflight)
│   └── _mixins.scss          # SCSS mixins and functions
│
├── shared/
│   └── ui/                   # shadcn-generated components (never edit)
│
└── main.tsx                  # imports styles/globals.scss
```

---

## globals.scss — entry point

```scss
// styles/globals.scss
@use 'variables';
@use 'reset';
@use 'typography';
@use 'animations';

// Tailwind directives
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## \_variables.scss — design tokens as CSS custom properties

Define all design tokens here. Tailwind config reads them so both systems stay in sync.

```scss
// styles/_variables.scss
:root {
  // colors
  --color-primary: #4f46e5; // indigo-600
  --color-primary-hover: #4338ca; // indigo-700
  --color-danger: #dc2626; // red-600
  --color-surface: #ffffff;
  --color-surface-subtle: #f4f4f5; // zinc-100
  --color-border: #e4e4e7; // zinc-200
  --color-text: #18181b; // zinc-900
  --color-text-muted: #71717a; // zinc-500

  // spacing
  --spacing-page-x: 1.5rem; // horizontal page padding
  --spacing-section: 2.5rem; // between page sections

  // radius
  --radius-sm: 0.375rem; // 6px
  --radius-md: 0.5rem; // 8px  — matches shadcn default
  --radius-lg: 0.75rem; // 12px
  --radius-xl: 1rem; // 16px

  // shadows
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}

[data-theme='dark'] {
  --color-surface: #18181b;
  --color-surface-subtle: #27272a;
  --color-border: #3f3f46;
  --color-text: #fafafa;
  --color-text-muted: #a1a1aa;
}
```

Wire tokens into Tailwind so you can use them as utilities:

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        danger: 'var(--color-danger)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
      },
    },
  },
};
```

Now you can write `bg-surface`, `text-primary`, `rounded-lg`, `shadow-card` as Tailwind classes.

---

## \_animations.scss — keyframes only

Define `@keyframes` here. Apply them via Tailwind `animate-*` utilities or inline `animation` classes.

```scss
// styles/_animations.scss
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-in-right {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

Register them in Tailwind config to use as utilities:

```ts
// tailwind.config.ts
theme: {
  extend: {
    animation: {
      "fade-in":       "fade-in 0.2s ease",
      "slide-in-right":"slide-in-right 0.25s ease",
    },
    keyframes: {
      "fade-in": {
        from: { opacity: "0", transform: "translateY(4px)" },
        to:   { opacity: "1", transform: "translateY(0)" },
      },
    },
  },
},
```

Usage in JSX:

```tsx
<div className="animate-fade-in">...</div>
```

---

## \_mixins.scss — reusable SCSS logic

Keep mixins small and purposeful. Use them only when a pattern cannot be expressed as a Tailwind utility.

```scss
// styles/_mixins.scss

// responsive container padding
@mixin page-container {
  padding-left: var(--spacing-page-x);
  padding-right: var(--spacing-page-x);
  max-width: 80rem;
  margin: 0 auto;
}

// visually hidden (accessible)
@mixin sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

// truncate text with ellipsis
@mixin truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

---

## shadcn/ui

Components are generated into `shared/ui/`. **Never edit them directly** — re-generate via CLI when you need a new one.

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add form
npx shadcn@latest add dialog
npx shadcn@latest add select
npx shadcn@latest add dropdown-menu
npx shadcn@latest add table
npx shadcn@latest add badge
```

shadcn uses CSS variables internally (e.g. `--radius`, `--background`, `--foreground`). Keep `components.json` and `_variables.scss` in sync — if you change `--radius-md`, update `components.json` `radius` too.

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
.users-table {
  border-radius: 8px;
  padding: 1rem;
}
// ✅ use Tailwind utilities directly on the element: className="rounded-lg p-4"

// ❌ hardcode a color value in SCSS
.badge { color: #4f46e5; }
// ✅ define it as a CSS variable in _variables.scss, then use via Tailwind: text-primary

// ❌ define a one-off keyframe inline in a component file
<style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
// ✅ define in _animations.scss, register in tailwind.config.ts, use animate-spin
```

```tsx
// ❌ edit a shadcn-generated file
// shared/ui/button.tsx  ← never touch this
// ✅ create a wrapper: shared/ui/danger-button.tsx

// ❌ mix inline style with Tailwind for the same property
<div style={{ borderRadius: "8px" }} className="rounded-lg">
// ✅ pick one — prefer Tailwind

// ❌ use arbitrary Tailwind values when a token exists
<div className="text-[#4f46e5]">
// ✅ add the color to _variables.scss + tailwind.config.ts, then: text-primary
```
