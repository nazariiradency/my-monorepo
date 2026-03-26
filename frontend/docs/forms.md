# Forms — React Hook Form + Zod + shadcn

## How They Connect

```
schema.ts          → defines Zod schema + inferred type
hooks/useCreate*.ts → useForm({ resolver: zodResolver(schema) }) + useMutation
components/*Form.tsx → <Form {...form}> from shadcn wires RHF context to UI
```

---

## Defining the Schema

Schemas live in `modules/[name]/schema.ts`. Types are always inferred from Zod — never written manually.

```ts
// modules/products/schema.ts
export const createProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  price: z.number().positive('Price must be positive'),
  category: z.enum(['electronics', 'clothing', 'general'], {
    required_error: 'Please select a category',
  }),
  description: z.string().optional(),
});

export type CreateProductPayload = z.infer<typeof createProductSchema>;
```

---

## Hook — Form + Mutation Together

The hook is the integration layer. The component just calls it.

```ts
// hooks/useCreateProduct.ts
export function useCreateProduct() {
  const qc = useQueryClient();
  const closeDialog = useProductsStore((s) => s.closeDialog);

  const form = useForm<CreateProductPayload>({
    resolver: zodResolver(createProductSchema),
    defaultValues: { name: '', price: 0, category: 'general' },
  });

  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productsKeys.lists() });
      form.reset();
      closeDialog();
    },
    onError: (error) => {
      // map server errors back to fields if needed
      form.setError('email', { message: error.message });
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

---

## Form Component — shadcn Form

Use shadcn's `Form` wrapper — it connects RHF's `formState` to `FormMessage` automatically.

```tsx
// modules/products/components/ProductForm.tsx
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import type { UseFormReturn } from 'react-hook-form';
import type { CreateProductPayload } from '../schema';

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

---

## Reusing the Form in Create vs Edit

The form component is shared. The hook provides pre-filled defaults for edit:

```tsx
// CreateProductDialog uses useCreateProduct
export function CreateProductDialog() {
  const { form, onSubmit, isPending } = useCreateProduct();
  return (
    <Dialog>
      <ProductForm
        form={form}
        onSubmit={onSubmit}
        isPending={isPending}
        submitLabel="Create"
      />
    </Dialog>
  );
}

// EditProductDialog uses useUpdateProduct (pre-filled)
export function EditProductDialog() {
  const product = useProductsStore((s) => s.selectedProduct);
  if (!product) return null;
  const { form, onSubmit, isPending } = useUpdateProduct(product);
  return (
    <Dialog>
      <ProductForm
        form={form}
        onSubmit={onSubmit}
        isPending={isPending}
        submitLabel="Save changes"
      />
    </Dialog>
  );
}
```

---

## shadcn/ui Components

Generated into `shared/ui/`. Never edit them directly — re-generate via CLI.

```bash
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add button
npx shadcn@latest add select
npx shadcn@latest add dialog
npx shadcn@latest add textarea
```

---

## Anti-Patterns

```ts
// ❌ TypeScript interface separate from Zod schema
interface CreateProductPayload { name: string; price: number }
const schema = z.object({ name: z.string(), price: z.number() })
// ✅ export type CreateProductPayload = z.infer<typeof createProductSchema>

// ❌ useForm + useMutation directly in component
function CreateProductForm() {
  const form     = useForm()
  const mutation = useMutation({ mutationFn: createProduct })
}
// ✅ extract to useCreateProduct() hook

// ❌ manual error display
{errors.name && <p>{errors.name.message}</p>}
// ✅ use shadcn <FormMessage /> — it reads from RHF formState automatically
```
