const express = require('express');
const { z } = require('zod');
const { AppError, asyncHandler } = require('../../shared/errors');
const { validate } = require('../../shared/validation');
const { login } = require('./auth.service');
const { requireAuth } = require('./auth.middleware');

const authRoutes = express.Router();
const loginAttempts = new Map();
const loginWindowMs = 15 * 60 * 1000;
const maxLoginFailures = 5;

function loginAttemptKey(req, email) {
  return `${req.ip || 'unknown'}:${String(email || '').trim().toLowerCase()}`;
}

function checkLoginThrottle(req, email) {
  const key = loginAttemptKey(req, email);
  const now = Date.now();
  const attempt = loginAttempts.get(key);
  if (!attempt || attempt.resetAt <= now) {
    loginAttempts.delete(key);
    return key;
  }
  if (attempt.count >= maxLoginFailures) {
    const retryAfterSeconds = Math.max(1, Math.ceil((attempt.resetAt - now) / 1000));
    const error = new AppError('Too many failed sign-in attempts. Try again later.', 429, {
      retryAfterSeconds
    });
    throw error;
  }
  return key;
}

function recordLoginFailure(key) {
  const now = Date.now();
  const attempt = loginAttempts.get(key);
  if (!attempt || attempt.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + loginWindowMs });
    return;
  }
  attempt.count += 1;
  loginAttempts.set(key, attempt);
}

function clearLoginFailures(key) {
  loginAttempts.delete(key);
}

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().trim().min(1),
  rememberMe: z.boolean().optional().default(false)
});

authRoutes.post('/login', asyncHandler(async (req, res) => {
  const input = validate(loginSchema, req.body);
  const attemptKey = checkLoginThrottle(req, input.email);
  let result;
  try {
    result = await login(input.email, input.password, { rememberMe: input.rememberMe });
  } catch (error) {
    if (error.statusCode === 401) {
      recordLoginFailure(attemptKey);
    }
    throw error;
  }
  clearLoginFailures(attemptKey);
  res.json(result);
}));

authRoutes.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = { authRoutes };
