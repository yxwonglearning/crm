const express = require('express');
const { z } = require('zod');
const { asyncHandler, AppError } = require('../../shared/errors');
const { validate } = require('../../shared/validation');
const { requireAuth } = require('../auth/auth.middleware');
const dashboardService = require('./dashboards.service');
const queryService = require('./dashboard-query.service');

const dashboardPageRoutes = express.Router();
const executeSchema = z.object({
  parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])).max(100)])).default({}),
  limit: z.coerce.number().int().positive().max(1000).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  forceRefresh: z.boolean().optional()
});

dashboardPageRoutes.use(requireAuth);
dashboardPageRoutes.get('/', asyncHandler(async (req, res) => res.json(await dashboardService.listPublishedDashboards(req.user))));
dashboardPageRoutes.get('/:dashboardKey', asyncHandler(async (req, res) => res.json(await dashboardService.getPublishedDashboard(req.params.dashboardKey, req.user))));
dashboardPageRoutes.post('/:dashboardKey/widgets/:widgetKey/execute', asyncHandler(async (req, res) => {
  const configuration = await dashboardService.getPublishedDashboard(req.params.dashboardKey, req.user);
  const widget = configuration.widgets.find((item) => item.widgetKey === req.params.widgetKey && !item.archived);
  if (!widget?.dataSourceKey) throw new AppError('Published dashboard widget not found', 404);
  const result = await queryService.executeDataSource(widget.dataSourceKey, validate(executeSchema, req.body || {}), { user: req.user, dashboardKey: req.params.dashboardKey, widgetKey: req.params.widgetKey });
  await dashboardService.auditDashboardAccess(req.params.dashboardKey, req.user, 'dashboard_widget_execute', { allowed: true, reason: 'published_dashboard_permission' });
  res.json(result);
}));
dashboardPageRoutes.post('/:dashboardKey/widgets/:widgetKey/drill-down', asyncHandler(async (req, res) => {
  res.json(await dashboardService.resolveDrillDown(req.params.dashboardKey, req.params.widgetKey, req.body?.parameters || {}, req.user));
}));

module.exports = { dashboardPageRoutes };
