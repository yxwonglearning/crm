const express = require('express');
const { z } = require('zod');
const { asyncHandler } = require('../../shared/errors');
const { validate } = require('../../shared/validation');
const { requireAuth, requireRole } = require('../auth/auth.middleware');
const service = require('./action-flows.service');

const actionFlowRoutes = express.Router();

const flowSchema = z.object({
  flowKey: z.string().trim().max(80).optional(),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(255).optional(),
  status: z.enum(['draft', 'enabled', 'disabled']).default('draft'),
  triggerCategory: z.string().trim().max(80).default('record'),
  triggerType: z.enum(['record_created', 'record_updated', 'status_changed', 'record_deleted', 'manual']).default('record_created'),
  triggerModule: z.string().trim().max(80).optional(),
  definition: z.object({}).passthrough().optional(),
  bumpVersion: z.boolean().optional()
});

const connectorSchema = z.object({
  connectorKey: z.string().trim().max(80).optional(),
  name: z.string().trim().min(2).max(120),
  baseUrl: z.string().trim().min(1).max(500),
  authType: z.enum(['none', 'api_key', 'bearer', 'basic', 'oauth', 'oauth1', 'oauth2']).default('none'),
  authConfig: z.object({}).passthrough().optional(),
  defaultHeaders: z.object({}).passthrough().optional(),
  endpoints: z.array(z.object({}).passthrough()).optional(),
  enabled: z.boolean().optional(),
  categoryKey: z.string().trim().max(80).optional()
});

const connectorCategorySchema = z.object({
  categoryKey: z.string().trim().max(80).optional(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(255).optional()
});

const connectorDebugSchema = z.object({
  key: z.string().trim().max(80).optional(),
  name: z.string().trim().max(160).optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']).default('GET'),
  path: z.string().trim().min(1).max(1000),
  interfaceConfig: z.object({}).passthrough().optional()
});

actionFlowRoutes.use(requireAuth, requireRole('admin'));

actionFlowRoutes.get('/', asyncHandler(async (req, res) => {
  res.json(await service.listFlows({
    status: req.query.status || 'all',
    search: req.query.search || ''
  }));
}));

actionFlowRoutes.post('/', asyncHandler(async (req, res) => {
  const input = validate(flowSchema, req.body);
  res.status(201).json(await service.createFlow(input, req.user));
}));

actionFlowRoutes.get('/connectors', asyncHandler(async (_req, res) => {
  res.json(await service.listConnectors());
}));

actionFlowRoutes.get('/connector-categories', asyncHandler(async (_req, res) => {
  res.json(await service.listConnectorCategories());
}));

actionFlowRoutes.post('/connector-categories', asyncHandler(async (req, res) => {
  const input = validate(connectorCategorySchema, req.body);
  res.status(201).json(await service.saveConnectorCategory(input, req.user));
}));

actionFlowRoutes.delete('/connector-categories/:categoryKey', asyncHandler(async (req, res) => {
  res.json(await service.deleteConnectorCategory(req.params.categoryKey));
}));

actionFlowRoutes.get('/executions', asyncHandler(async (req, res) => {
  res.json(await service.listExecutions({
    flowKey: req.query.flowKey || '',
    limit: req.query.limit || 50
  }));
}));

actionFlowRoutes.post('/connectors', asyncHandler(async (req, res) => {
  const input = validate(connectorSchema, req.body);
  res.status(201).json(await service.saveConnector(input, req.user));
}));

actionFlowRoutes.post('/connectors/:connectorKey/debug', asyncHandler(async (req, res) => {
  const endpoint = validate(connectorDebugSchema, req.body);
  res.json(await service.debugConnector(req.params.connectorKey, endpoint));
}));

actionFlowRoutes.delete('/connectors/:connectorKey', asyncHandler(async (req, res) => {
  res.json(await service.deleteConnector(req.params.connectorKey));
}));

actionFlowRoutes.get('/:flowKey', asyncHandler(async (req, res) => {
  res.json(await service.getFlow(req.params.flowKey));
}));

actionFlowRoutes.put('/:flowKey', asyncHandler(async (req, res) => {
  const input = validate(flowSchema.partial(), req.body);
  res.json(await service.updateFlow(req.params.flowKey, input, req.user));
}));

actionFlowRoutes.post('/:flowKey/check', asyncHandler(async (req, res) => {
  res.json(await service.checkFlow(req.params.flowKey));
}));

actionFlowRoutes.delete('/:flowKey', asyncHandler(async (req, res) => {
  res.json(await service.deleteFlow(req.params.flowKey));
}));

module.exports = { actionFlowRoutes };
