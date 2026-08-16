const express = require('express');
const { z } = require('zod');
const { asyncHandler, AppError } = require('../../shared/errors');
const { requireAuth, requireRole } = require('../auth/auth.middleware');
const { validate } = require('../../shared/validation');
const repository = require('./notifications.repository');
const email = require('./email.service');

const notificationRoutes = express.Router();
notificationRoutes.use(requireAuth);
notificationRoutes.get('/', asyncHandler(async (req, res) => res.json(await repository.listForUser(req.user.id, { unread: req.query.unread === 'true', limit: req.query.limit }))));
notificationRoutes.post('/read-all', asyncHandler(async (req, res) => res.json({ updated: await repository.markAllRead(req.user.id) })));
notificationRoutes.post('/:id/read', asyncHandler(async (req, res) => { const updated = await repository.markRead(Number(req.params.id), req.user.id); if (!updated) throw new AppError('Notification not found', 404); res.json({ updated }); }));

const providerSchema = z.enum(['gmail', 'google_workspace', 'microsoft_365', 'generic_smtp']);
const settingsSchema = z.object({ provider: providerSchema, enabled: z.boolean().default(false), senderName: z.string().trim().max(160).optional(), senderEmail: z.string().trim().email().optional().or(z.literal('')),
  replyTo: z.string().trim().email().optional().or(z.literal('')), secret: z.string().max(500).optional(), settings: z.object({ host: z.string().trim().max(255).optional(), port: z.coerce.number().int().min(1).max(65535).optional(), security: z.enum(['starttls', 'ssl', 'none']).optional(), username: z.string().trim().max(190).optional(), tenantId: z.string().trim().max(100).optional(), clientId: z.string().trim().max(100).optional() }).default({}) });
notificationRoutes.get('/email-settings/current', requireRole('admin'), asyncHandler(async (_req, res) => res.json({ emailSettings: await email.get() })));
notificationRoutes.put('/email-settings/current', requireRole('admin'), asyncHandler(async (req, res) => res.json({ emailSettings: await email.save(validate(settingsSchema, req.body), req.user.id) })));
notificationRoutes.post('/email-settings/test', requireRole('admin'), asyncHandler(async (req, res) => res.json(await email.test(validate(z.object({ to: z.string().trim().email() }), req.body)))));

module.exports = { notificationRoutes };
