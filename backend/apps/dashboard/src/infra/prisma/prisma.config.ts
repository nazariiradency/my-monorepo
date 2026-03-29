import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: './schema.prisma',
  migrations: {
    path: './migrations',
    seed: 'tsx apps/dashboard/src/infra/prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
