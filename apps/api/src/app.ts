import cors from 'cors';
import express, { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import type { Clock } from './clock.js';
import { assignRequestId, handleErrors, handleUnknownRoute } from './middleware.js';
import { openApiDocument } from './openapi.js';
import { createHealthRouter } from './routes/health.js';
import { createTasksRouter } from './routes/tasks.js';
import type { TaskRepository } from './tasks/task-repository.js';
import { TaskService } from './tasks/task-service.js';

export interface AppDependencies {
  repository: TaskRepository;
  clock: Clock;
  corsOrigins?: string[];
}

export function createApp({ repository, clock, corsOrigins = [] }: AppDependencies): Express {
  const app = express();

  app.use(assignRequestId);
  app.use(cors({ origin: corsOrigins, exposedHeaders: ['X-Request-Id'] }));
  app.use(express.json());
  app.use('/api/v1/health', createHealthRouter(repository));
  app.use('/api/v1/tasks', createTasksRouter(new TaskService(repository, clock)));
  app.get('/api/v1/openapi.json', (_req, res) => {
    res.json(openApiDocument);
  });
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use(handleUnknownRoute);
  app.use(handleErrors);

  return app;
}
