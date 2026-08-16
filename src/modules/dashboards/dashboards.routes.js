const express = require('express');
const { z } = require('zod');
const { asyncHandler } = require('../../shared/errors');
const { validate } = require('../../shared/validation');
const { requireAuth, requireRole } = require('../auth/auth.middleware');
const dashboardService = require('./dashboards.service');
const queryService = require('./dashboard-query.service');

const dashboardRoutes = express.Router();
const dataSourceSchema = z.object({
  dataSourceKey: z.string().trim().max(80).optional(),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(500).optional(),
  sourceType: z.enum(['sql_view', 'select_query']),
  viewName: z.string().trim().max(128).optional(),
  querySql: z.string().trim().max(50000).optional(),
  columns: z.array(z.object({}).passthrough()).optional(),
  parameters: z.array(z.object({}).passthrough()).optional(),
  rowLimit: z.coerce.number().int().min(1).max(10000).optional(),
  timeoutMs: z.coerce.number().int().min(100).max(60000).optional()
});
const executeSchema = z.object({
  parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])).max(100)])).default({}),
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().nonnegative().optional()
  ,forceRefresh: z.boolean().optional()
});
const dashboardSchema = z.object({
  dashboardKey: z.string().trim().max(80).optional(),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(500).optional(),
  settings: z.object({}).passthrough().optional()
});
const dashboardConfigurationSchema = z.object({
  widgets: z.array(z.object({
    widgetKey: z.string().trim().min(1).max(80),
    dataSourceKey: z.string().trim().max(80).optional(),
    type: z.string().trim().min(1).max(40),
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(500).optional(),
    sortOrder: z.coerce.number().int().nonnegative().optional(),
    layout: z.object({}).passthrough().default({}),
    config: z.object({}).passthrough().default({}),
    archived: z.boolean().optional()
  })).default([]),
  filters: z.array(z.object({}).passthrough()).default([]),
  permissions: z.array(z.object({}).passthrough()).default([])
});
const checkpointSchema = z.object({ name: z.string().trim().min(2).max(160), remark: z.string().trim().max(500).optional() });
const restoreSchema = z.object({ name: z.string().trim().max(160).optional(), remark: z.string().trim().max(500).optional() });
const importSchema = z.object({ format: z.literal('babyyy-dashboard'), formatVersion: z.literal(1), dashboardKey: z.string().optional(), exportedAt: z.string().optional(), configuration: dashboardConfigurationSchema });

dashboardRoutes.use(requireAuth, requireRole('admin'));

dashboardRoutes.get('/', asyncHandler(async (req, res) => res.json(await dashboardService.listDashboards({ status: req.query.status || 'all', search: req.query.search || '' }))));
dashboardRoutes.post('/', asyncHandler(async (req, res) => res.status(201).json(await dashboardService.createDashboard(validate(dashboardSchema, req.body), req.user))));
dashboardRoutes.get('/views', asyncHandler(async (_req, res) => res.json(await queryService.discoverViews())));
dashboardRoutes.get('/views/:viewName', asyncHandler(async (req, res) => res.json(await queryService.describeView(req.params.viewName))));
dashboardRoutes.get('/data-sources', asyncHandler(async (req, res) => res.json(await dashboardService.listDataSources({ archived: req.query.archived === 'true' ? true : req.query.archived === 'false' ? false : undefined }))));
dashboardRoutes.post('/data-sources', asyncHandler(async (req, res) => {
  const input = validate(dataSourceSchema, req.body);
  if (input.sourceType === 'sql_view') await queryService.describeView(input.viewName);
  else {
    const scanned = queryService.validateReadOnlySql(input.querySql);
    input.parameters = scanned.parameters.map((name) => ({ name, type: 'string', required: true }));
  }
  const created = await dashboardService.createDataSource(input, req.user);
  queryService.invalidateDataSourceCache(input.dataSourceKey || created.dataSource?.dataSourceKey);
  res.status(201).json(created);
}));
dashboardRoutes.get('/data-sources/:dataSourceKey', asyncHandler(async (req, res) => res.json(await dashboardService.getDataSource(req.params.dataSourceKey))));
dashboardRoutes.put('/data-sources/:dataSourceKey', asyncHandler(async (req, res) => {
  const input = validate(dataSourceSchema.partial(), req.body);
  const existing = (await dashboardService.getDataSource(req.params.dataSourceKey)).dataSource;
  const merged = { ...existing, ...input };
  if (merged.sourceType === 'sql_view') await queryService.describeView(merged.viewName);
  else {
    const scanned = queryService.validateReadOnlySql(merged.querySql);
    input.parameters = scanned.parameters.map((name) => ({ name, type: 'string', required: true }));
  }
  const updated = await dashboardService.updateDataSource(req.params.dataSourceKey, input, req.user);
  queryService.invalidateDataSourceCache(req.params.dataSourceKey);
  res.json(updated);
}));
dashboardRoutes.post('/data-sources/:dataSourceKey/archive', asyncHandler(async (req, res) => { const result = await dashboardService.archiveDataSource(req.params.dataSourceKey, req.user); queryService.invalidateDataSourceCache(req.params.dataSourceKey); res.json(result); }));
dashboardRoutes.post('/data-sources/:dataSourceKey/execute', asyncHandler(async (req, res) => res.json(await queryService.executeDataSource(req.params.dataSourceKey, validate(executeSchema, req.body || {}), { user: req.user, dashboardKey: req.body?.dashboardKey, widgetKey: req.body?.widgetKey }))));
dashboardRoutes.get('/:dashboardKey', asyncHandler(async (req, res) => res.json(await dashboardService.getDashboard(req.params.dashboardKey))));
dashboardRoutes.put('/:dashboardKey', asyncHandler(async (req, res) => res.json(await dashboardService.updateDashboard(req.params.dashboardKey, validate(dashboardSchema.partial(), req.body), req.user))));
dashboardRoutes.put('/:dashboardKey/configuration', asyncHandler(async (req, res) => res.json(await dashboardService.replaceConfiguration(req.params.dashboardKey, validate(dashboardConfigurationSchema, req.body), req.user))));
dashboardRoutes.post('/:dashboardKey/check', asyncHandler(async (req, res) => res.json(await dashboardService.checkConfiguration(req.params.dashboardKey))));
dashboardRoutes.get('/:dashboardKey/versions', asyncHandler(async (req, res) => res.json(await dashboardService.listVersions(req.params.dashboardKey))));
dashboardRoutes.post('/:dashboardKey/versions', asyncHandler(async (req, res) => res.status(201).json(await dashboardService.createVersion(req.params.dashboardKey, validate(checkpointSchema, req.body), req.user))));
dashboardRoutes.post('/:dashboardKey/versions/:versionId/restore', asyncHandler(async (req, res) => res.json(await dashboardService.restoreVersion(req.params.dashboardKey, Number(req.params.versionId), validate(restoreSchema, req.body || {}), req.user))));
dashboardRoutes.get('/:dashboardKey/export', asyncHandler(async (req, res) => res.json(await dashboardService.exportConfiguration(req.params.dashboardKey))));
dashboardRoutes.post('/:dashboardKey/import', asyncHandler(async (req, res) => res.json(await dashboardService.importConfiguration(req.params.dashboardKey, validate(importSchema, req.body), req.user))));
dashboardRoutes.post('/:dashboardKey/publish', asyncHandler(async (req, res) => res.json(await dashboardService.publishDashboard(req.params.dashboardKey, req.user))));
dashboardRoutes.post('/:dashboardKey/duplicate', asyncHandler(async (req, res) => res.status(201).json(await dashboardService.duplicateDashboard(req.params.dashboardKey, validate(dashboardSchema, req.body), req.user))));
dashboardRoutes.post('/:dashboardKey/archive', asyncHandler(async (req, res) => res.json(await dashboardService.archiveDashboard(req.params.dashboardKey, req.user))));
dashboardRoutes.post('/:dashboardKey/reopen', asyncHandler(async (req, res) => res.json(await dashboardService.reopenDashboard(req.params.dashboardKey, req.user))));

module.exports = { dashboardRoutes };
