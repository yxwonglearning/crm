const express = require('express');
const { z } = require('zod');
const { asyncHandler } = require('../../shared/errors');
const { validate } = require('../../shared/validation');
const { login } = require('./auth.service');
const { requireAuth } = require('./auth.middleware');

const authRoutes = express.Router();

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().trim().min(1)
});

authRoutes.post('/login', asyncHandler(async (req, res) => {
  const input = validate(loginSchema, req.body);
  const result = await login(input.email, input.password);
  res.json(result);
}));

authRoutes.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = { authRoutes };
