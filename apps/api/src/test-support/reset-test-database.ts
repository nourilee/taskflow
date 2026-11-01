import { createPrismaClient } from '../db/prisma-client.js';
import { seedTasks } from './seed-tasks.js';
import { assertTestDatabase, prepareTestDatabase } from './test-database.js';

// Run with: NODE_ENV=test ENABLE_TEST_UTILITIES=true pnpm db:test:reset
const target = assertTestDatabase(process.env);
prepareTestDatabase(process.env);

const prisma = createPrismaClient(`file:${target}`);
await prisma.task.deleteMany();
await seedTasks(prisma);
await prisma.$disconnect();
console.log(`Reset and seeded ${target}`);
