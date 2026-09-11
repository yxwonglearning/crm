const express = require('express');
const { z } = require('zod');
const { asyncHandler, AppError } = require('../../shared/errors');
const { validate } = require('../../shared/validation');
const { requireAuth, requireRole } = require('../auth/auth.middleware');
const { key, templateSchema, contextSchema } = require('./document-templates.schema');
const repository = require('./document-templates.repository');
const service = require('./document-templates.service');
const renderer = require('./document-templates.renderer');
const multer = require('multer');
const importer = require('./document-pdf-importer');
const uploadPdf = multer({ storage: multer.memoryStorage(), limits: { fileSize: importer.MAX_PDF_BYTES, files: 1, fields: 0 } });
const receivePdf = (req, res, next) => uploadPdf.single('pdf')(req, res, (error) => {
  if (error?.code === 'LIMIT_FILE_SIZE') return next(new AppError('PDF exceeds the 10 MB import limit.', 413));
  if (error) return next(new AppError('The PDF upload could not be processed.', 422));
  next();
});

const documentTemplateRoutes = express.Router();
documentTemplateRoutes.use(requireAuth);
documentTemplateRoutes.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
documentTemplateRoutes.get('/', requireRole('admin'), asyncHandler(async (_req, res) => res.json({ templates: await repository.list() })));
documentTemplateRoutes.post('/import-pdf', requireRole('admin'), receivePdf, asyncHandler(async (req, res) => {
  importer.validatePdfUpload(req.file);
  res.json(await importer.analyzePdf(req.file.buffer, req.file.originalname));
}));
documentTemplateRoutes.put('/:templateKey/source-pdf', requireRole('admin'), receivePdf, asyncHandler(async (req, res) => {
  const templateKey = validate(key, req.params.templateKey); importer.validatePdfUpload(req.file);
  res.json(await repository.saveSourcePdf(templateKey, req.file));
}));
documentTemplateRoutes.get('/:templateKey/source-pdf', requireRole('admin'), asyncHandler(async (req, res) => {
  const source = await repository.findSourcePdf(validate(key, req.params.templateKey));
  if (!source) throw new AppError('Original PDF is not available for this template.', 404);
  res.set('Content-Type', 'application/pdf'); res.set('Content-Disposition', 'inline; filename="original.pdf"');
  res.set('X-Content-Type-Options', 'nosniff'); res.send(source.data);
}));
documentTemplateRoutes.post('/available', asyncHandler(async (req, res) => {
  const input = validate(contextSchema.extend({ moduleKey: z.string().regex(/^[a-zA-Z0-9_]+$/).optional() }), req.body);
  if (!input.recordId && !input.workflowRequestId) throw new AppError('Select a record or workflow request', 422);
  const candidates = await repository.list();
  const templates = [];
  for (const item of candidates) {
    if (input.moduleKey && item.template.source !== `module:${input.moduleKey}`) continue;
    try {
      await service.resolve(item.template.templateKey, input, req.user);
      templates.push({ templateKey: item.template.templateKey, name: item.template.name, revision: item.revision });
    } catch (error) { if (![403, 404, 422].includes(error.statusCode)) throw error; }
  }
  res.json({ templates });
}));
documentTemplateRoutes.put('/:templateKey', requireRole('admin'), asyncHandler(async (req, res) => {
  const input = validate(z.object({ template: templateSchema, revision: z.number().int().positive().optional() }).strict(), req.body);
  if (input.template.templateKey !== req.params.templateKey) throw new AppError('Template key mismatch', 422);
  res.json(await repository.save(input.template, input.revision, req.user));
}));
documentTemplateRoutes.post('/:templateKey/preview', asyncHandler(async (req, res) => {
  res.json(await service.resolve(validate(key, req.params.templateKey), validate(contextSchema, req.body), req.user));
}));
documentTemplateRoutes.post('/:templateKey/render-pdf', asyncHandler(async (req, res) => {
  const resolved = await service.resolve(validate(key, req.params.templateKey), validate(contextSchema, req.body), req.user);
  const pdf = await renderer.renderPdf(resolved.template, resolved.context, req.user.id);
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${service.filename(resolved.template.name, resolved.reference)}"`);
  res.send(pdf);
}));
module.exports = { documentTemplateRoutes };
