import type { HealthResponse } from '@taskflow/shared';
import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  const body: HealthResponse = {
    status: 'ok',
    service: 'taskflow-api',
    uptimeSeconds: process.uptime(),
  };
  res.json(body);
});
