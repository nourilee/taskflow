import type { HealthResponse } from '@taskflow/shared';
import { Router } from 'express';
import { ApiError } from '../errors.js';
import type { TaskRepository } from '../tasks/task-repository.js';

export function createHealthRouter(repository: TaskRepository): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    try {
      await repository.ping();
    } catch (error) {
      console.error('Health check could not reach the database', error);
      throw new ApiError(503, 'SERVICE_UNAVAILABLE', 'The database is unavailable.');
    }

    const body: HealthResponse = {
      status: 'ok',
      service: 'taskflow-api',
      database: 'ok',
      uptimeSeconds: process.uptime(),
    };
    res.json(body);
  });

  return router;
}
