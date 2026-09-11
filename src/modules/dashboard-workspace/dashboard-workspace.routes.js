const express = require('express');
const { z } = require('zod');
const { asyncHandler, AppError } = require('../../shared/errors');
const { requireAuth } = require('../auth/auth.middleware');
const { validate } = require('../../shared/validation');
const repository = require('./dashboard-workspace.repository');

const dashboardWorkspaceRoutes = express.Router();
dashboardWorkspaceRoutes.use(requireAuth);

const status = z.enum(['open', 'in_progress', 'completed', 'cancelled']);
const taskInput = z.object({
  title: z.string().trim().min(1).max(190), description: z.string().trim().max(4000).optional(),
  dueAt: z.string().datetime({ offset: true }).nullable().optional(), priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal')
});

dashboardWorkspaceRoutes.get('/tasks', asyncHandler(async (req, res) => {
  const filterStatus = req.query.status && req.query.status !== 'all' ? status.parse(req.query.status) : 'all';
  res.json({ tasks: await repository.listTasks(req.user.id, { status: filterStatus, limit: req.query.limit }) });
}));
dashboardWorkspaceRoutes.post('/tasks', asyncHandler(async (req, res) => res.status(201).json({ task: await repository.createTask(req.user.id, validate(taskInput, req.body)) })));
dashboardWorkspaceRoutes.patch('/tasks/:id', asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const input = validate(taskInput.partial().extend({ status: status.optional() }), req.body);
  const task = await repository.updateTask(id, req.user.id, input);
  if (!task) throw new AppError('Task not found', 404);
  res.json({ task });
}));
dashboardWorkspaceRoutes.get('/calendar', asyncHandler(async (req, res) => {
  const query = z.object({ start: z.string().date(), end: z.string().date() }).parse(req.query);
  res.json({ events: await repository.listCalendar(req.user.id, `${query.start} 00:00:00`, `${query.end} 00:00:00`) });
}));

module.exports = { dashboardWorkspaceRoutes };
