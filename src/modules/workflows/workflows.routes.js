const express = require('express');
const multer = require('multer');
const { z } = require('zod');
const { AppError, asyncHandler } = require('../../shared/errors');
const { validate } = require('../../shared/validation');
const { requireAuth, requireRole } = require('../auth/auth.middleware');
const configuration = require('./workflows.service');
const runtime = require('./workflows.runtime');
const decisions = require('./workflows.decisions');
const lifecycle = require('./workflows.lifecycle');
const access = require('./workflows.access');
const repository = require('./workflows.repository');
const monitoring = require('./workflows.monitoring');
const workflowSla = require('./workflows.sla');
const delegations = require('./workflows.delegations');

const workflowRoutes = express.Router();
function monitoringFilters(req) {
  const date = (value) => (/^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : '');
  const departmentId = Number(req.query.departmentId);
  return {
    status: req.query.status || 'all', workflowKey: req.query.workflowKey || '', sla: req.query.sla || 'all',
    search: req.query.search || '', requester: req.query.requester || '', approver: req.query.approver || '',
    departmentId: Number.isSafeInteger(departmentId) && departmentId > 0 ? departmentId : null,
    dateFrom: date(req.query.dateFrom), dateTo: date(req.query.dateTo), limit: req.query.limit
  };
}
const attachmentUpload = multer({ storage: multer.memoryStorage(), limits: { files: 20, fileSize: 25 * 1024 * 1024 } });
function uploadAttachments(req, res, next) {
  attachmentUpload.array('attachments', 20)(req, res, (error) => {
    if (!error) return next();
    const tooLarge = ['LIMIT_FILE_SIZE', 'LIMIT_FILE_COUNT', 'LIMIT_UNEXPECTED_FILE'].includes(error.code);
    return next(new AppError(
      tooLarge ? 'Workflow attachment upload exceeds the allowed limit' : 'Unable to process workflow attachments',
      tooLarge ? 413 : 422,
      { code: 'WORKFLOW_ATTACHMENT_UPLOAD_LIMIT', uploadCode: error.code || 'UPLOAD_INVALID' }
    ));
  });
}
const keySchema = z.string().trim().min(2).max(80).regex(/^[a-z][a-z0-9_]*$/);
const configSchema = z.object({}).passthrough();
const definitionSchema = z.object({
  workflowKey: keySchema.optional(),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(500).optional(),
  sourceModuleKey: keySchema,
  requestFormKey: z.string().trim().max(80).optional(),
  requestFormVersion: z.coerce.number().int().positive().nullable().optional(),
  config: configSchema.optional(),
  draftConfig: configSchema.optional()
});
const cloneSchema = z.object({
  workflowKey: keySchema,
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(500).optional()
});
const summarySchema = z.object({ summary: z.string().trim().min(2).max(500).optional() });
const submitSchema = z.object({
  workflowKey: keySchema.optional(),
  sourceModuleKey: keySchema,
  sourceRecordId: z.coerce.number().int().positive(),
  correlationId: z.string().trim().max(120).optional(),
  idempotencyKey: z.string().trim().max(120).optional()
});
const decisionSchema = z.object({
  action: z.enum(['approve', 'reject', 'return', 'return_for_correction']),
  remark: z.string().trim().max(2000).optional(),
  responses: z.record(z.string().max(80), z.union([z.string().max(5000), z.number(), z.boolean(), z.null()])).optional(),
  correlationId: z.string().trim().max(120).optional(),
  idempotencyKey: z.string().trim().max(120).optional()
});
const lifecycleSchema = z.object({
  remark: z.string().trim().max(2000).optional(),
  correlationId: z.string().trim().max(120).optional(),
  idempotencyKey: z.string().trim().max(120).optional()
});
const delegationSchema = z.object({
  delegatorUserId: z.coerce.number().int().positive(), delegateUserId: z.coerce.number().int().positive(),
  workflowKey: keySchema.optional().or(z.literal('')), scopeRole: z.string().trim().max(40).optional(),
  scopeDepartmentId: z.coerce.number().int().positive().nullable().optional(), startsAt: z.string().datetime(),
  endsAt: z.string().datetime(), reason: z.string().trim().min(2).max(500)
});
const reassignSchema = z.object({ replacementUserId: z.coerce.number().int().positive(), reason: z.string().trim().min(2).max(500), idempotencyKey: z.string().trim().max(120).optional() });

function withIdempotency(req, input) {
  const key = String(req.get('Idempotency-Key') || input.idempotencyKey || '').trim();
  if (!key) throw new AppError('Idempotency-Key header is required', 400, { code: 'WORKFLOW_CONFLICT_IDEMPOTENCY_REQUIRED' });
  return { ...input, idempotencyKey: key };
}

function parseJsonField(value, fallback) {
  if (typeof value !== 'string') return value ?? fallback;
  try { return JSON.parse(value); } catch (_error) { throw new AppError('Invalid JSON form field', 400, { code: 'WORKFLOW_ATTACHMENT_FORM_INVALID' }); }
}

workflowRoutes.use(requireAuth);

workflowRoutes.get('/catalog', asyncHandler(async (_req, res) => {
  const definitions = await repository.listDefinitions({ status: 'published' });
  res.json({
    definitions: await Promise.all(definitions.map(async (definition) => {
      const version = await repository.findVersion(definition.workflowKey, definition.publishedVersionId);
      return {
        workflowKey: definition.workflowKey,
        requestPrefix: definition.requestPrefix,
        name: definition.name,
        description: definition.description,
        sourceModuleKey: definition.sourceModuleKey,
        requestFormKey: definition.requestFormKey,
        status: definition.status,
        submissionAttachmentPolicy: version?.snapshot?.builderGraph?.nodes?.find((node) => node.type === 'start')?.attachmentPolicy || { mode: 'disabled' }
      };
    }))
  });
}));
workflowRoutes.get('/definitions', requireRole('admin'), asyncHandler(async (req, res) => {
  res.json(await configuration.listDefinitions({ status: req.query.status || 'all', sourceModuleKey: req.query.sourceModuleKey || '', search: req.query.search || '' }));
}));
workflowRoutes.post('/definitions', requireRole('admin'), asyncHandler(async (req, res) => {
  res.status(201).json(await configuration.createDefinition(validate(definitionSchema, req.body), req.user));
}));
workflowRoutes.get('/definitions/:workflowKey', requireRole('admin'), asyncHandler(async (req, res) => {
  res.json(await configuration.getDefinition(req.params.workflowKey));
}));
workflowRoutes.put('/definitions/:workflowKey', requireRole('admin'), asyncHandler(async (req, res) => {
  res.json(await configuration.updateDefinition(req.params.workflowKey, validate(definitionSchema.partial(), req.body), req.user));
}));
workflowRoutes.post('/definitions/:workflowKey/clone', requireRole('admin'), asyncHandler(async (req, res) => {
  res.status(201).json(await configuration.cloneDefinition(req.params.workflowKey, validate(cloneSchema, req.body), req.user));
}));
workflowRoutes.post('/definitions/:workflowKey/archive', requireRole('admin'), asyncHandler(async (req, res) => {
  res.json(await configuration.archiveDefinition(req.params.workflowKey, req.user));
}));
workflowRoutes.post('/definitions/:workflowKey/check', requireRole('admin'), asyncHandler(async (req, res) => {
  res.json(await configuration.checkDefinition(req.params.workflowKey));
}));
workflowRoutes.post('/definitions/:workflowKey/checkpoints', requireRole('admin'), asyncHandler(async (req, res) => {
  res.status(201).json(await configuration.checkpointDefinition(req.params.workflowKey, validate(summarySchema, req.body || {}), req.user));
}));
workflowRoutes.post('/definitions/:workflowKey/publish', requireRole('admin'), asyncHandler(async (req, res) => {
  res.json(await configuration.publishDefinition(req.params.workflowKey, validate(summarySchema, req.body || {}), req.user));
}));
workflowRoutes.get('/definitions/:workflowKey/versions', requireRole('admin'), asyncHandler(async (req, res) => {
  res.json(await configuration.listVersions(req.params.workflowKey, req.query.limit));
}));
workflowRoutes.get('/definitions/:workflowKey/versions/:versionId', requireRole('admin'), asyncHandler(async (req, res) => {
  res.json(await configuration.getVersion(req.params.workflowKey, Number(req.params.versionId)));
}));

workflowRoutes.get('/inbox', asyncHandler(async (req, res) => {
  res.json({ assignments: await repository.listApproverInbox(req.user.id, {
    status: req.query.status || 'pending',
    overdue: req.query.overdue === 'true',
    limit: req.query.limit
  }) });
}));
workflowRoutes.get('/monitoring', requireRole('admin'), asyncHandler(async (req, res) => {
  res.json(await monitoring.list(monitoringFilters(req), req.user));
}));
workflowRoutes.get('/monitoring/export.csv', requireRole('admin'), asyncHandler(async (req, res) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="workflow-history.csv"');
  res.send(await monitoring.exportCsv(monitoringFilters(req), req.user));
}));
workflowRoutes.get('/delegations', requireRole('admin'), asyncHandler(async (req, res) => {
  res.json(await delegations.list({ status: req.query.status || 'all', search: req.query.search || '' }, req.user));
}));
workflowRoutes.post('/delegations', requireRole('admin'), asyncHandler(async (req, res) => {
  res.status(201).json(await delegations.create(validate(delegationSchema, req.body), req.user));
}));
workflowRoutes.post('/delegations/:id/cancel', requireRole('admin'), asyncHandler(async (req, res) => {
  res.json(await delegations.cancel(Number(req.params.id), req.user));
}));
workflowRoutes.post('/assignments/:id/reassign', requireRole('admin'), asyncHandler(async (req, res) => {
  res.json(await delegations.reassign(Number(req.params.id), withIdempotency(req, validate(reassignSchema, req.body)), req.user));
}));
workflowRoutes.post('/monitoring/run', requireRole('admin'), asyncHandler(async (_req, res) => {
  res.json(await workflowSla.processDueStages());
}));
workflowRoutes.post('/requests/:requestKey/remind', requireRole('admin'), asyncHandler(async (req, res) => {
  res.json(await monitoring.sendReminder(req.params.requestKey, withIdempotency(req, validate(lifecycleSchema, req.body || {})), req.user));
}));
workflowRoutes.get('/requests', asyncHandler(async (req, res) => {
  res.json(await access.listRequestViews({ status: req.query.status || 'all', search: req.query.search || '', limit: req.query.limit }, req.user));
}));
workflowRoutes.post('/requests', uploadAttachments, asyncHandler(async (req, res) => {
  res.status(201).json(await runtime.submitRequest({ ...withIdempotency(req, validate(submitSchema, req.body)), attachments: req.files || [] }, req.user));
}));
workflowRoutes.get('/requests/:requestKey', asyncHandler(async (req, res) => {
  res.json(await access.getRequestView(req.params.requestKey, req.user));
}));
workflowRoutes.post('/requests/:requestKey/decisions', uploadAttachments, asyncHandler(async (req, res) => {
  const body = { ...req.body, responses: parseJsonField(req.body.responses, {}) };
  res.json(await decisions.decideRequest(req.params.requestKey, { ...withIdempotency(req, validate(decisionSchema, body)), attachments: req.files || [] }, req.user));
}));
workflowRoutes.get('/requests/:requestKey/attachments/:attachmentId', asyncHandler(async (req, res) => {
  const attachmentId = Number(req.params.attachmentId);
  if (!Number.isSafeInteger(attachmentId) || attachmentId < 1) throw new AppError('Workflow attachment not found', 404, { code: 'WORKFLOW_ATTACHMENT_NOT_FOUND' });
  const instance = await repository.findInstanceByRequestKey(req.params.requestKey);
  if (!instance) throw new AppError('Workflow request not found', 404, { code: 'WORKFLOW_STATE_REQUEST_NOT_FOUND' });
  await access.authorizeRequest(instance, req.user, 'workflow.attachment.download');
  const attachment = await repository.findAttachment(instance.id, attachmentId);
  if (!attachment || !attachment.data) throw new AppError('Workflow attachment not found', 404, { code: 'WORKFLOW_ATTACHMENT_NOT_FOUND' });
  res.setHeader('Content-Type', attachment.contentType);
  res.setHeader('Content-Length', String(attachment.fileSize));
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.send(attachment.data);
}));
workflowRoutes.post('/requests/:requestKey/withdraw', asyncHandler(async (req, res) => {
  res.json(await lifecycle.withdrawRequest(req.params.requestKey, withIdempotency(req, validate(lifecycleSchema, req.body || {})), req.user));
}));
workflowRoutes.post('/requests/:requestKey/resubmit', asyncHandler(async (req, res) => {
  res.json(await lifecycle.resubmitRequest(req.params.requestKey, withIdempotency(req, validate(lifecycleSchema, req.body || {})), req.user));
}));
workflowRoutes.post('/requests/:requestKey/cancel', requireRole('admin'), asyncHandler(async (req, res) => {
  res.json(await lifecycle.cancelRequest(req.params.requestKey, withIdempotency(req, validate(lifecycleSchema, req.body || {})), req.user));
}));

module.exports = { workflowRoutes };
