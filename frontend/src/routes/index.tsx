import { createFileRoute, redirect } from '@tanstack/react-router';

const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/todo' });
  },
});

export { Route };
