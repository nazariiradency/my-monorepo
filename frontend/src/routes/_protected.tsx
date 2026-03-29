import { createFileRoute } from '@tanstack/react-router';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';

const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
});

export { Route };
