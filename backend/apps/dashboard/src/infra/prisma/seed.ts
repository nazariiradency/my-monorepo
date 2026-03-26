import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const todos = [
  {
    id: 'a1b2c3d4-0001-4000-8000-000000000001',
    title: 'Set up the project',
    completed: true,
  },
  {
    id: 'a1b2c3d4-0002-4000-8000-000000000002',
    title: 'Configure the database',
    completed: true,
  },
  {
    id: 'a1b2c3d4-0003-4000-8000-000000000003',
    title: 'Write the first feature',
  },
  {
    id: 'a1b2c3d4-0004-4000-8000-000000000004',
    title: 'Add tests',
  },
  {
    id: 'a1b2c3d4-0005-4000-8000-000000000005',
    title: 'Deploy to staging',
  },
];

async function main() {
  for (const todo of todos) {
    await prisma.todo.upsert({
      where: { id: todo.id },
      update: {},
      create: todo,
    });
  }

  console.log(`Seeded ${todos.length} todos`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
