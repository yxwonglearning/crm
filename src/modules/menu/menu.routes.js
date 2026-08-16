const express = require('express');
const { z } = require('zod');
const { asyncHandler } = require('../../shared/errors');
const { validate } = require('../../shared/validation');
const { requireAuth, requireRole } = require('../auth/auth.middleware');
const service = require('./menu.service');

const menuRoutes = express.Router();
const visibilitySchema = z.object({ roles: z.array(z.enum(['admin', 'manager', 'user'])).default([]), userIds: z.array(z.coerce.number().int().positive()).default([]), departmentIds: z.array(z.coerce.number().int().positive()).default([]) });
const itemSchema = z.object({ key: z.string().trim().min(2).max(80), type: z.enum(['group', 'item']), parentKey: z.string().trim().max(80).nullable().optional(), label: z.string().trim().min(1).max(80), icon: z.string().trim().max(30).optional(), enabled: z.boolean().optional(), order: z.coerce.number().int().min(0).max(10000), destination: z.object({ type: z.enum(['view', 'module', 'external']), key: z.string().trim().max(120).optional(), url: z.string().trim().max(2000).optional() }).nullable().optional(), visibility: visibilitySchema.optional(), systemKey: z.string().trim().max(40).optional() });
const configSchema = z.object({ schemaVersion: z.literal(1).optional(), defaultModuleGroupKey: z.string().trim().max(80).optional(), items: z.array(itemSchema).max(200) });

menuRoutes.get('/sidebar', requireAuth, asyncHandler(async (req, res) => res.json(await service.getSidebar(req.user))));
menuRoutes.use('/configuration', requireAuth, requireRole('admin'));
menuRoutes.get('/configuration', asyncHandler(async (_req, res) => res.json(await service.getConfig())));
menuRoutes.get('/configuration/catalog', asyncHandler(async (_req, res) => res.json(await service.getCatalog())));
menuRoutes.get('/configuration/versions', asyncHandler(async (_req, res) => res.json({ versions: await service.listVersions() })));
menuRoutes.post('/configuration/check', asyncHandler(async (req, res) => res.json({ check: service.validate(validate(configSchema, req.body)) })));
menuRoutes.put('/configuration/draft', asyncHandler(async (req, res) => res.json(await service.saveDraft(validate(configSchema, req.body), req.user.id))));
menuRoutes.post('/configuration/publish', asyncHandler(async (req, res) => res.json(await service.publish(validate(configSchema, req.body), req.user.id))));
menuRoutes.post('/configuration/reset', asyncHandler(async (req, res) => res.json(await service.saveDraft(service.defaultConfig(), req.user.id))));
menuRoutes.post('/configuration/versions/:id/restore', asyncHandler(async (req, res) => { const params = validate(z.object({ id: z.coerce.number().int().positive() }), req.params); res.json(await service.restore(params.id, req.user.id)); }));

module.exports = { menuRoutes };
