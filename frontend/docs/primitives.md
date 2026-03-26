# Primitives — Shared UI Components

Two sources of reusable UI exist in this project:

| Source            | Location             | Rule                                                                                         |
| ----------------- | -------------------- | -------------------------------------------------------------------------------------------- |
| **shadcn/ui**     | `shared/ui/`         | Generated — never edit. Add via `pnpm dlx shadcn@latest add`.                                |
| **Custom shared** | `shared/components/` | Hand-built with Tailwind. Use when shadcn has no equivalent or for domain-agnostic patterns. |

See [docs/styling.md](./styling.md) for adding shadcn components.

---

## When to Build a Custom Primitive

Build in `shared/components/` when:

- No equivalent exists in the shadcn catalog.
- The component is a thin composition of Tailwind utilities.
- The component is used in **two or more** modules.

Keep it inside `modules/[name]/components/` when only one module uses it. Promote to `shared/components/` when a second module needs it.

---

## Component Folder Structure

Every shared component follows the three-file pattern:

```
shared/components/[Name]/
├── [Name].tsx
├── [Name].module.scss   # only if Tailwind can't express the style
└── index.ts
```

Register in the barrel:

```ts
// shared/components/index.ts
export { Badge } from './Badge';
export { Card, CardHeader, CardBody } from './Card';
export { EmptyState } from './EmptyState';
export { PageHeader } from './PageHeader';
export { Spinner } from './Spinner';
```

Import from the barrel, never from the file directly:

```ts
// ✅
import { Badge, Spinner } from '@/shared/components';

// ❌
import { Badge } from '@/shared/components/Badge/Badge';
```

---

## Badge

A pill label with color variants for status, categories, or counts.

```tsx
// shared/components/Badge/Badge.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-zinc-100 text-zinc-700',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        danger: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span className={badgeVariants({ variant, className })}>{children}</span>
  );
}
```

```ts
// shared/components/Badge/index.ts
export { Badge } from './Badge';
```

Usage:

```tsx
<Badge variant="success">Active</Badge>
<Badge variant="danger">Archived</Badge>
```

---

## Spinner

```tsx
// shared/components/Spinner/Spinner.tsx
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-700 ${sizeMap[size]} ${className}`}
    />
  );
}
```

Usage:

```tsx
if (isLoading) return <Spinner />;

if (isLoading)
  return (
    <div className="flex justify-center py-8">
      <Spinner size="lg" />
    </div>
  );
```

---

## EmptyState

```tsx
// shared/components/EmptyState/EmptyState.tsx
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
      {icon && <div className="mb-4 text-zinc-400">{icon}</div>}
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

Usage:

```tsx
<EmptyState
  title="No products yet"
  description="Get started by creating your first product."
  icon={<Package className="h-8 w-8" />}
  action={<Button onClick={openCreate}>New product</Button>}
/>
```

---

## Card

```tsx
// shared/components/Card/Card.tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-zinc-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={`border-b border-zinc-100 px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }: CardProps) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}
```

```ts
// shared/components/Card/index.ts
export { Card, CardHeader, CardBody } from './Card';
```

Usage:

```tsx
<Card>
  <CardHeader>
    <h2 className="text-sm font-semibold text-zinc-900">Summary</h2>
  </CardHeader>
  <CardBody>
    <p className="text-sm text-zinc-500">Card content goes here.</p>
  </CardBody>
</Card>
```

---

## PageHeader

Consistent page title + description + optional action slot used at the top of list pages:

```tsx
// shared/components/PageHeader/PageHeader.tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        )}
      </div>
      {action && <div className="self-start sm:self-auto">{action}</div>}
    </div>
  );
}
```

Usage:

```tsx
<PageHeader
  title="Products"
  description="Manage your product catalog."
  action={
    <Button onClick={openCreate} className="gap-2">
      <Plus className="h-4 w-4" /> New product
    </Button>
  }
/>
```

---

## Extending a shadcn Component

Never modify generated shadcn files. Create a wrapper in `shared/components/`:

```tsx
// shared/components/DangerButton/DangerButton.tsx
import { Button, type ButtonProps } from '@/shared/ui';

export function DangerButton({
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <Button
      variant="outline"
      className={`border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}
```

```ts
// shared/components/DangerButton/index.ts
export { DangerButton } from './DangerButton';
```

---

## Using cva for Variants

`class-variance-authority` (cva) is available via shadcn. Use it when a component has multiple visual states — avoids manual conditional string concatenation:

```tsx
import { cva, type VariantProps } from 'class-variance-authority';

const alertVariants = cva('rounded-md border px-4 py-3 text-sm', {
  variants: {
    variant: {
      info: 'border-blue-200 bg-blue-50 text-blue-800',
      warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
      error: 'border-red-200 bg-red-50 text-red-800',
    },
  },
  defaultVariants: { variant: 'info' },
});

interface AlertProps extends VariantProps<typeof alertVariants> {
  children: React.ReactNode;
}

export function Alert({ variant, children }: AlertProps) {
  return <div className={alertVariants({ variant })}>{children}</div>;
}
```

---

## Rules

- Never edit files in `shared/ui/` — those are shadcn-generated.
- Always re-export from `shared/components/index.ts` — consumers import from the barrel.
- Module-specific components stay in `modules/[name]/components/` — only promote when a second module needs it.
- Use Tailwind utilities first; reach for `.module.scss` only for pseudo-elements and `:focus-within` selectors. See [docs/styling.md](./styling.md).
- Use `cva` for components with multiple visual variants — avoid building variant strings manually.
