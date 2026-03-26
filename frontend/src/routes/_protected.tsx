import { createFileRoute } from '@tanstack/react-router';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';

export const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
});
