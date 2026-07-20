const express = require('express');
const multer = require('multer');
const { z } = require('zod');
const { asyncHandler } = require('../../shared/errors');
const { validate } = require('../../shared/validation');
const { requireAuth, requireRole } = require('../auth/auth.middleware');
const service = require('./departments.service');

const departmentRoutes = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const nodeSchema = z.object({ id: z.number().int().positive().optional(), name: z.string().trim().min(1).max(120), type: z.enum(['organization', 'department', 'group']), parentId: z.number().int().positive().nullable().optional(), description: z.string().trim().max(255).optional(), enabled: z.boolean().optional() });

departmentRoutes.use(requireAuth, requireRole('admin'));
departmentRoutes.get('/', asyncHandler(async (req, res) => res.json(await service.listHierarchy(req.user.id))));
departmentRoutes.post('/', asyncHandler(async (req, res) => res.status(201).json(await service.saveNode(validate(nodeSchema, req.body), req.user.id))));
departmentRoutes.delete('/:id', asyncHandler(async (req, res) => res.json(await service.deleteNode(Number(req.params.id)))));
departmentRoutes.get('/import/template', asyncHandler(async (_req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="department-hierarchy-import-template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(service.createTemplate());
}));
departmentRoutes.post('/import', upload.single('file'), asyncHandler(async (req, res) => res.status(201).json(await service.importHierarchy(req.file, req.user.id))));

module.exports = { departmentRoutes };
