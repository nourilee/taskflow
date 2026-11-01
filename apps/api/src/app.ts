import express, { type Express } from 'express';
import { healthRouter } from './routes/health.js';

export function createApp(): Express {
  const app = express();
  app.use('/api/v1/health', healthRouter);
  return app;
}
