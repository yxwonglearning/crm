const express = require('express');
const { z } = require('zod');
const { asyncHandler } = require('../../shared/errors');
const { validate } = require('../../shared/validation');
const { requireAuth, requireRole } = require('../auth/auth.middleware');
const service = require('./module-config.service');

const sysadminRoutes = express.Router();

const fieldTypeSchema = z.enum(['text', 'email', 'phone', 'password', 'number', 'date', 'select', 'textarea', 'country', 'owner', 'checkbox']);
const fieldSchema = z.object({
  fieldKey: z.string().trim().max(80).optional(),
  label: z.string().trim().min(1).max(120),
  type: fieldTypeSchema,
  options: z.union([z.array(z.string()), z.string()]).optional(),
  required: z.boolean().optional(),
  showInTable: z.boolean().optional(),
  showInForm: z.boolean().optional(),
  showInImport: z.boolean().optional(),
  searchable: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(1).max(10000).optional()
});

const updateFieldSchema = fieldSchema.partial();

sysadminRoutes.use(requireAuth, requireRole('admin'));

sysadminRoutes.get('/modules', asyncHandler(async (_req, res) => {
  res.json({ modules: await service.listModules() });
}));

sysadminRoutes.get('/modules/:moduleKey', asyncHandler(async (req, res) => {
  res.json(await service.getModuleConfig(req.params.moduleKey));
}));

sysadminRoutes.post('/modules/:moduleKey/fields', asyncHandler(async (req, res) => {
  const input = validate(fieldSchema, req.body);
  res.status(201).json(await service.createField(req.params.moduleKey, input));
}));

sysadminRoutes.patch('/modules/:moduleKey/fields/:fieldKey', asyncHandler(async (req, res) => {
  const input = validate(updateFieldSchema, req.body);
  res.json(await service.updateField(req.params.moduleKey, req.params.fieldKey, input));
}));

sysadminRoutes.delete('/modules/:moduleKey/fields/:fieldKey', asyncHandler(async (req, res) => {
  res.json(await service.deleteField(req.params.moduleKey, req.params.fieldKey));
}));

module.exports = { sysadminRoutes };
