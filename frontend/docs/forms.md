# Forms — React Hook Form + Zod + shadcn/ui

## How the Three Parts Connect

```
schema.ts              → Zod schema defines shape + validation rules + inferred type
hooks/useCreate*.ts    → useForm({ resolver: zodResolver(schema) }) + useMutation
components/*Form.tsx   → receives { form, onSubmit, isPending } — renders only
```

The component never touches validation or mutation logic. The hook owns the full lifecycle.

---

## Creating a Form — Step by Step

### Step 1 — Define the schema in schema.ts

Mutation payload schemas live in `modules/[name]/schema.ts`. Always infer the TypeScript type from Zod — never write a separate interface.

```ts
// modules/products/schema.ts
import { z } from 'zod/v3';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  price: z.number().positive('Price must be positive'),
  category: z.enum(['electronics', 'clothing', 'general'], {
    required_error: 'Please select a category',
  }),
  description: z.string().max(500).optional(),
});

// ✅ type is always inferred — never written by hand
export type CreateProductPayload = z.infer<typeof createProductSchema>;
```

---

### Step 2 — Create the hook

The hook owns `useForm`, `useMutation`, and the success/error lifecycle. The component receives a clean interface: `{ form, onSubmit, isPending }`.

```ts
// modules/products/hooks/useCreateProduct.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProduct, productKeys } from '../api';
import { createProductSchema, type CreateProductPayload } from '../schema';
import { useProductsStore } from '../store';

export function useCreateProduct() {
  const qc = useQueryClient();
  const closeDialog = useProductsStore((s) => s.closeDialog);

  const form = useForm<CreateProductPayload>({
    resolver: zodResolver(createProductSchema),
    defaultValues: { name: '', price: 0, category: 'general', description: '' },
  });

  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: productKeys.lists() });
      form.reset();
      closeDialog();
    },
  });

  return {
    form,
    onSubmit: form.handleSubmit((data) => mutation.mutate(data)),
    isPending: mutation.isPending,
    isError: mutation.isError,
  };
}
```

**What each part does:**

| Part                               | Purpose                                                    |
| ---------------------------------- | ---------------------------------------------------------- |
| `zodResolver(createProductSchema)` | Runs Zod validation on submit — blocks mutation if invalid |
| `defaultValues`                    | Pre-fills the form; must match every field in the schema   |
| `form.handleSubmit(...)`           | Calls the callback only when validation passes             |
| `invalidateQueries`                | Tells TanStack Query to re-fetch the list after the write  |
| `form.reset()`                     | Clears fields after success                                |
| `closeDialog()`                    | Dismisses the dialog via Zustand                           |

---

### Step 3 — Create the form component

The form component receives `form`, `onSubmit`, `isPending`, and `submitLabel` as props. It uses shadcn's `Form` wrapper, which connects RHF's `formState` to `FormMessage` automatically.

```tsx
// modules/products/components/ProductForm/ProductForm.tsx
import type { UseFormReturn } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui';
import type { CreateProductPayload } from '../../schema';

interface ProductFormProps {
  form: UseFormReturn<CreateProductPayload>;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  submitLabel: string;
}

export function ProductForm({
  form,
  onSubmit,
  isPending,
  submitLabel,
}: ProductFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Product name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Saving…' : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
```

Add the barrel:

```ts
// modules/products/components/ProductForm/index.ts
export { ProductForm } from './ProductForm';
```

---

### Step 4 — Use the form in a dialog

The dialog calls the hook, receives `{ form, onSubmit, isPending }`, and passes them straight into the form component.

```tsx
// modules/products/components/ProductDialogs/ProductDialogs.tsx
export function CreateProductDialog() {
  const closeDialog = useProductsStore((s) => s.closeDialog);
  const { form, onSubmit, isPending } = useCreateProduct();

  return (
    <Dialog open onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Product</DialogTitle>
        </DialogHeader>
        <ProductForm
          form={form}
          onSubmit={onSubmit}
          isPending={isPending}
          submitLabel="Create"
        />
      </DialogContent>
    </Dialog>
  );
}
```

For edit dialogs, `useUpdateProduct(product)` seeds `defaultValues` from the passed-in item:

```ts
const form = useForm<UpdateProductPayload>({
  resolver: zodResolver(updateProductSchema),
  defaultValues: {
    name: product.name,
    price: product.price,
    category: product.category,
  },
});
```

---

## Field Types — Patterns per Input Kind

### Text / number input

```tsx
<FormField
  control={form.control}
  name="name"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Name</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Select

```tsx
<FormField
  control={form.control}
  name="category"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Category</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Pick one" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
          <SelectItem value="b">Option B</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Textarea

```tsx
<FormField
  control={form.control}
  name="description"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Description</FormLabel>
      <FormControl>
        <Textarea rows={4} {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Checkbox

```tsx
<FormField
  control={form.control}
  name="completed"
  render={({ field }) => (
    <FormItem className="flex items-center gap-2">
      <FormControl>
        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
      </FormControl>
      <FormLabel>Mark as completed</FormLabel>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## Server-Side Errors

Map server errors back to specific fields in `onError`:

```ts
const mutation = useMutation({
  mutationFn: createProduct,
  onSuccess: () => {
    /* ... */
  },
  onError: (error) => {
    if (error.field === 'name') {
      form.setError('name', { message: error.message });
    }
  },
});
```

---

## Required shadcn Components

Install these before building forms:

```bash
cd frontend
pnpm dlx shadcn@latest add form
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add textarea
pnpm dlx shadcn@latest add checkbox
pnpm dlx shadcn@latest add dialog
```

Import from the barrel, never from the generated file directly:

```ts
// ✅
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/shared/ui';

// ❌
import { Form } from '@/shared/ui/form';
```

---

## Anti-Patterns

```ts
// ❌ TypeScript interface separate from Zod schema
interface CreateProductPayload { name: string }
const schema = z.object({ name: z.string() })
// ✅ export type CreateProductPayload = z.infer<typeof createProductSchema>

// ❌ useForm + useMutation directly in the component
function CreateProductForm() {
  const form = useForm();
  const mutation = useMutation({ mutationFn: createProduct });
}
// ✅ extract to useCreateProduct() — component only receives { form, onSubmit, isPending }

// ❌ manual error display
{errors.name && <p className="text-red-500">{errors.name.message}</p>}
// ✅ <FormMessage /> — reads from RHF formState automatically

// ❌ missing defaultValues
const form = useForm<CreateProductPayload>({ resolver: zodResolver(schema) });
// ✅ provide defaultValues for every field — avoids uncontrolled→controlled warnings

// ❌ calling mutation directly from JSX
<button onClick={() => mutation.mutate(form.getValues())}>Submit</button>
// ✅ use form.handleSubmit — it runs Zod validation first
<form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
```
