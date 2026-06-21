const express = require('express');
const { z } = require('zod');
const { asyncHandler } = require('../../shared/errors');
const { validate } = require('../../shared/validation');
const { requireAuth, requireRole } = require('../auth/auth.middleware');
const service = require('./users.service');

const usersRoutes = express.Router();

const roleSchema = z.enum(['admin', 'manager', 'user']);
const statusSchema = z.enum(['active', 'inactive']);

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(190),
  password: z.string().trim().min(8).max(72),
  role: roleSchema.default('user'),
  status: statusSchema.default('active')
}).passthrough();

const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(190).optional(),
  password: z.string().trim().min(8).max(72).optional(),
  role: roleSchema.optional(),
  status: statusSchema.optional()
}).passthrough();

usersRoutes.use(requireAuth, requireRole('admin'));

usersRoutes.get('/config', asyncHandler(async (_req, res) => {
  res.json(await service.userFieldConfig());
}));

usersRoutes.get('/', asyncHandler(async (_req, res) => {
  res.json({ users: await service.listUsers() });
}));

usersRoutes.post('/', asyncHandler(async (req, res) => {
  const input = validate(createUserSchema, req.body);
  const result = await service.createUser(input);
  res.status(201).json(result);
}));

usersRoutes.patch('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const input = validate(updateUserSchema, req.body);
  await service.updateUser(id, input);
  res.status(204).send();
}));

module.exports = { userRoutes: usersRoutes };
