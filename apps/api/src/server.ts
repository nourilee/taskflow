import { createApp } from './app.js';
import { createSystemClock } from './clock.js';
import { createPrismaClient } from './db/prisma-client.js';
import { PrismaTaskRepository } from './tasks/prisma-task-repository.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env.');
}

const port = Number(process.env.PORT ?? 3000);
const app = createApp({
  repository: new PrismaTaskRepository(createPrismaClient(databaseUrl)),
  clock: createSystemClock(process.env.APP_TIMEZONE ?? 'UTC'),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(','),
});

app.listen(port, () => {
  console.log(`TaskFlow API listening on port ${port}`);
});
