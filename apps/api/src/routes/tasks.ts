import {
  changeTaskStatusSchema,
  createTaskSchema,
  listTasksQuerySchema,
  updateTaskSchema,
} from '@taskflow/shared';
import { Router } from 'express';
import { parseOrThrow } from '../errors.js';
import type { TaskService } from '../tasks/task-service.js';

export function createTasksRouter(service: TaskService): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json(await service.list(parseOrThrow(listTasksQuerySchema, req.query)));
  });

  router.post('/', async (req, res) => {
    res.status(201).json(await service.create(parseOrThrow(createTaskSchema, req.body)));
  });

  router.get('/:id', async (req, res) => {
    res.json(await service.get(req.params.id));
  });

  router.put('/:id', async (req, res) => {
    res.json(await service.update(req.params.id, parseOrThrow(updateTaskSchema, req.body)));
  });

  router.patch('/:id/status', async (req, res) => {
    const { status } = parseOrThrow(changeTaskStatusSchema, req.body);
    res.json(await service.changeStatus(req.params.id, status));
  });

  router.delete('/:id', async (req, res) => {
    await service.delete(req.params.id);
    res.status(204).end();
  });

  return router;
}
