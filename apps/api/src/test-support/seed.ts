import { createPrismaClient } from '../db/prisma-client.js';
import { seedTasks } from './seed-tasks.js';

if (process.env.NODE_ENV === 'production') {
  throw new Error('Refusing to seed: NODE_ENV is "production".');
}
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env.');
}

const prisma = createPrismaClient(process.env.DATABASE_URL);
await seedTasks(prisma);
await prisma.$disconnect();
console.log('Seeded tasks. Existing tasks with other IDs were left in place.');
