const { AppError } = require('../../shared/errors');
const repository = require('./dashboards.repository');
const departmentRepository = require('../departments/departments.repository');
const permissionRepository = require('../permissions/permissions.repository');
const permissionService = require('../permissions/permissions.service');

const dashboardStatuses = new Set(['draft', 'published', 'archived']);
const sourceTypes = new Set(['sql_view', 'select_query']);
const validationStatuses = new Set(['untested', 'valid', 'invalid']);
const subjectTypes = new Set(['role', 'user', 'department']);
const workspaceWidgetTypes = new Set(['approval_inbox', 'todo_list', 'calendar', 'quick_actions', 'recent_records', 'notifications']);

function stableKey(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80);
}

function requiredText(value, label, maxLength) {
  const text = String(value || '').trim();
  if (!text) throw new AppError(`${label} is required`, 422);
  if (text.length > maxLength) throw new AppError(`${label} must be ${maxLength} characters or fewer`, 422);
  return text;
}

function boundedInteger(value, fallback, min, max, label) {
  const number = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(number) || number < min || number > max) throw new AppError(`${label} must be from ${min} to ${max}`, 422);
  return number;
}

async function listDashboards(filters = {}) { return { dashboards: await repository.listDashboards(filters) }; }

async function getDashboard(dashboardKey) {
  const configuration = await repository.dashboardConfiguration(dashboardKey);
  if (!configuration) throw new AppError('Dashboard not found', 404);
  return configuration;
}

async function createDashboard(input, user) {
  const dashboardKey = stableKey(input.dashboardKey || input.name);
  if (!dashboardKey) throw new AppError('Dashboard key is required', 422);
  try {
    return { dashboard: await repository.createDashboard({ dashboardKey, name: requiredText(input.name, 'Dashboard name', 160), description: String(input.description || '').trim(), settings: input.settings || {} }, user?.id) };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw new AppError('A dashboard with this key already exists', 409);
    throw error;
  }
}

async function updateDashboard(dashboardKey, input, user) {
  if (input.dashboardKey !== undefined && stableKey(input.dashboardKey) !== dashboardKey) throw new AppError('Dashboard key cannot be changed', 409);
  if (input.status !== undefined && !dashboardStatuses.has(input.status)) throw new AppError('Unsupported dashboard status', 422);
  const existing = await repository.findDashboardByKey(dashboardKey);
  if (!existing) throw new AppError('Dashboard not found', 404);
  const dashboard = await repository.updateDashboard(dashboardKey, {
    name: input.name === undefined ? undefined : requiredText(input.name, 'Dashboard name', 160),
    description: input.description === undefined ? undefined : String(input.description || '').trim(),
    status: input.status, settings: input.settings
  }, user?.id);
  return { dashboard };
}

async function archiveDashboard(dashboardKey, user) { return updateDashboard(dashboardKey, { status: 'archived' }, user); }

async function reopenDashboard(dashboardKey, user) { return updateDashboard(dashboardKey, { status: 'draft' }, user); }

async function duplicateDashboard(dashboardKey, input, user) {
  const existing = await repository.findDashboardByKey(dashboardKey);
  if (!existing) throw new AppError('Dashboard not found', 404);
  const targetKey = stableKey(input.dashboardKey || input.name);
  if (!targetKey) throw new AppError('Dashboard key is required', 422);
  try {
    return { dashboard: await repository.duplicateDashboard(dashboardKey, {
      dashboardKey: targetKey,
      name: requiredText(input.name, 'Dashboard name', 160),
      description: input.description === undefined ? existing.description : String(input.description || '').trim()
    }, user?.id) };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw new AppError('A dashboard with this key already exists', 409);
    throw error;
  }
}

async function listDataSources(filters = {}) { return { dataSources: await repository.listDataSources(filters) }; }

async function getDataSource(dataSourceKey) {
  const dataSource = await repository.findDataSourceByKey(dataSourceKey);
  if (!dataSource) throw new AppError('Dashboard data source not found', 404);
  return { dataSource };
}

function normalizedDataSource(input) {
  const sourceType = input.sourceType || 'sql_view';
  if (!sourceTypes.has(sourceType)) throw new AppError('Unsupported dashboard data-source type', 422);
  if (sourceType === 'sql_view' && !String(input.viewName || '').trim()) throw new AppError('SQL view name is required', 422);
  if (sourceType === 'select_query' && !String(input.querySql || '').trim()) throw new AppError('SELECT query text is required', 422);
  return {
    name: requiredText(input.name, 'Data-source name', 160), description: String(input.description || '').trim(), sourceType,
    viewName: sourceType === 'sql_view' ? String(input.viewName).trim() : '', querySql: sourceType === 'select_query' ? String(input.querySql).trim() : '',
    columns: Array.isArray(input.columns) ? input.columns : [], parameters: Array.isArray(input.parameters) ? input.parameters : [],
    rowLimit: boundedInteger(input.rowLimit, 1000, 1, 10000, 'Row limit'), timeoutMs: boundedInteger(input.timeoutMs, 10000, 100, 60000, 'Timeout')
  };
}

async function createDataSource(input, user) {
  const dataSourceKey = stableKey(input.dataSourceKey || input.name);
  if (!dataSourceKey) throw new AppError('Data-source key is required', 422);
  try { return { dataSource: await repository.createDataSource({ dataSourceKey, ...normalizedDataSource(input) }, user?.id) }; }
  catch (error) { if (error.code === 'ER_DUP_ENTRY') throw new AppError('A dashboard data source with this key already exists', 409); throw error; }
}

async function updateDataSource(dataSourceKey, input, user) {
  if (input.dataSourceKey !== undefined && stableKey(input.dataSourceKey) !== dataSourceKey) throw new AppError('Data-source key cannot be changed', 409);
  const existing = await repository.findDataSourceByKey(dataSourceKey);
  if (!existing) throw new AppError('Dashboard data source not found', 404);
  const merged = normalizedDataSource({ ...existing, ...input });
  if (input.validationStatus !== undefined && !validationStatuses.has(input.validationStatus)) throw new AppError('Unsupported validation status', 422);
  return { dataSource: await repository.updateDataSource(dataSourceKey, { ...merged, columns: input.columns, parameters: input.parameters, validationStatus: input.validationStatus, validationMessage: input.validationMessage, lastTestedAt: input.lastTestedAt }, user?.id) };
}

async function archiveDataSource(dataSourceKey, user) {
  const existing = await repository.findDataSourceByKey(dataSourceKey);
  if (!existing) throw new AppError('Dashboard data source not found', 404);
  const usageCount = await repository.dataSourceUsageCount(existing.id);
  if (usageCount) throw new AppError('Remove this data source from active dashboard widgets before archiving it', 409);
  return { dataSource: await repository.updateDataSource(dataSourceKey, { archived: true }, user?.id) };
}

function validateConfiguration(input) {
  const unique = (items, key, label) => {
    const keys = items.map((item) => stableKey(item[key]));
    if (keys.some((item) => !item)) throw new AppError(`${label} key is required`, 422);
    if (new Set(keys).size !== keys.length) throw new AppError(`${label} keys must be unique`, 422);
  };
  const widgets = Array.isArray(input.widgets) ? input.widgets : [];
  const filters = Array.isArray(input.filters) ? input.filters : [];
  const permissions = Array.isArray(input.permissions) ? input.permissions : [];
  unique(widgets, 'widgetKey', 'Widget'); unique(filters, 'filterKey', 'Filter');
  permissions.forEach((permission) => {
    if (!subjectTypes.has(permission.subjectType)) throw new AppError('Unsupported dashboard permission subject type', 422);
    requiredText(permission.subjectKey, 'Permission subject key', 80);
  });
  return {
    widgets: widgets.map((widget, index) => ({ ...widget, widgetKey: stableKey(widget.widgetKey), type: requiredText(widget.type, 'Widget type', 40), title: requiredText(widget.title, 'Widget title', 160), sortOrder: boundedInteger(widget.sortOrder, index, 0, 100000, 'Widget sort order') })),
    filters: filters.map((filter, index) => ({ ...filter, filterKey: stableKey(filter.filterKey), name: requiredText(filter.name, 'Filter name', 160), type: requiredText(filter.type, 'Filter type', 40), sortOrder: boundedInteger(filter.sortOrder, index, 0, 100000, 'Filter sort order') })),
    permissions
  };
}

async function replaceConfiguration(dashboardKey, input, user) {
  if (!await repository.findDashboardByKey(dashboardKey)) throw new AppError('Dashboard not found', 404);
  const configuration = validateConfiguration(input);
  for (const filter of configuration.filters) {
    const sourceKey = filter.config?.dataSourceKey;
    const parameterNames = [filter.config?.parameterName, filter.config?.endParameterName].filter(Boolean);
    if (!sourceKey && !parameterNames.length) continue;
    if (!sourceKey || !parameterNames.length) throw new AppError(`Dashboard filter mapping is incomplete: ${filter.filterKey}`, 422);
    const source = await repository.findDataSourceByKey(sourceKey);
    if (!source || source.archived) throw new AppError(`Dashboard filter data source not found: ${sourceKey}`, 422);
    const allowed = new Set((source.parameters || []).map((parameter) => typeof parameter === 'string' ? parameter : parameter.name));
    const invalid = parameterNames.find((name) => !allowed.has(name));
    if (invalid) throw new AppError(`Dashboard filter parameter is not declared by ${sourceKey}: ${invalid}`, 422);
  }
  try { return await repository.replaceDashboardConfiguration(dashboardKey, configuration, user?.id); }
  catch (error) { if (error.code === 'DASHBOARD_DATA_SOURCE_NOT_FOUND') throw new AppError(error.message, 422); throw error; }
}

async function createVersion(dashboardKey, input = {}, user) {
  if (!await repository.findDashboardByKey(dashboardKey)) throw new AppError('Dashboard not found', 404);
  return { version: await repository.createDashboardVersion(dashboardKey, { action: input.action || 'checkpoint', name: input.name || '', remark: input.remark || '' }, user?.id) };
}

async function listVersions(dashboardKey) {
  const versions = await repository.listDashboardVersions(dashboardKey);
  if (!versions) throw new AppError('Dashboard not found', 404);
  return { versions };
}

async function checkConfiguration(dashboardKey, candidate) {
  const configuration = candidate ? validateConfiguration(candidate) : await getDashboard(dashboardKey);
  const issues = [];
  for (const widget of configuration.widgets || []) {
    if (workspaceWidgetTypes.has(widget.type)) continue;
    if (!widget.dataSourceKey) { issues.push({ area: 'widget', key: widget.widgetKey, message: 'Choose Dashboard Data.' }); continue; }
    const source = await repository.findDataSourceByKey(widget.dataSourceKey);
    if (!source || source.archived) { issues.push({ area: 'widget', key: widget.widgetKey, message: `Data source is unavailable: ${widget.dataSourceKey}` }); continue; }
    const columns = new Set((source.columns || []).map((column) => typeof column === 'string' ? column : column.name));
    const mapped = Object.values(widget.config?.mappings || {}).flat().filter(Boolean);
    const missing = mapped.find((column) => !columns.has(column));
    if (missing) issues.push({ area: 'widget', key: widget.widgetKey, message: `Mapped column is unavailable: ${missing}` });
    const drillDown = widget.config?.drillDown;
    if (drillDown?.type && !['module', 'dashboard'].includes(drillDown.type)) issues.push({ area: 'drillDown', key: widget.widgetKey, message: 'Unsupported drill-down destination.' });
    if (drillDown?.type && !stableKey(drillDown.targetKey)) issues.push({ area: 'drillDown', key: widget.widgetKey, message: 'Choose a drill-down destination.' });
  }
  for (const filter of configuration.filters || []) {
    if (!filter.config?.dataSourceKey) { issues.push({ area: 'filter', key: filter.filterKey, message: 'Choose a filter data source.' }); continue; }
    const source = await repository.findDataSourceByKey(filter.config?.dataSourceKey);
    if (!source || source.archived) issues.push({ area: 'filter', key: filter.filterKey, message: 'Filter data source is unavailable.' });
  }
  return { valid: issues.length === 0, issues };
}

async function restoreVersion(dashboardKey, versionId, input, user) {
  const version = await repository.findDashboardVersion(dashboardKey, versionId);
  if (!version) throw new AppError('Dashboard version not found', 404);
  const snapshot = version.snapshot || {};
  const checked = await checkConfiguration(dashboardKey, snapshot);
  if (!checked.valid) throw new AppError(`Version cannot be restored: ${checked.issues[0].message}`, 422);
  await repository.replaceDashboardConfiguration(dashboardKey, validateConfiguration(snapshot), user?.id);
  const restored = await repository.createDashboardVersion(dashboardKey, { action: 'restore', name: input.name || `Restored v${version.versionNumber}`, remark: input.remark || `Restored from version ${version.versionNumber}` }, user?.id);
  return { configuration: await getDashboard(dashboardKey), version: { id: restored.id, versionNumber: restored.versionNumber } };
}

async function exportConfiguration(dashboardKey) {
  const configuration = await getDashboard(dashboardKey);
  return { format: 'babyyy-dashboard', formatVersion: 1, exportedAt: new Date().toISOString(), dashboardKey, configuration: { widgets: configuration.widgets, filters: configuration.filters, permissions: configuration.permissions } };
}

async function importConfiguration(dashboardKey, payload, user) {
  if (payload?.format !== 'babyyy-dashboard' || payload?.formatVersion !== 1) throw new AppError('Unsupported dashboard configuration file', 422);
  if (!payload.configuration || typeof payload.configuration !== 'object') throw new AppError('Dashboard configuration is missing', 422);
  const checked = await checkConfiguration(dashboardKey, payload.configuration);
  if (!checked.valid) throw new AppError(`Import failed: ${checked.issues[0].message}`, 422);
  const configuration = await replaceConfiguration(dashboardKey, payload.configuration, user);
  const version = await repository.createDashboardVersion(dashboardKey, { action: 'import', name: 'Imported configuration', remark: `Imported format version ${payload.formatVersion}` }, user?.id);
  return { configuration, version: { id: version.id, versionNumber: version.versionNumber } };
}

async function publishDashboard(dashboardKey, user) {
  const configuration = await getDashboard(dashboardKey);
  const checked = await checkConfiguration(dashboardKey, configuration);
  if (!checked.valid) throw new AppError(`Dashboard check failed: ${checked.issues[0].message}`, 422);
  if (!configuration.widgets.length) throw new AppError('Add at least one widget before publishing', 422);
  const invalidWidget = configuration.widgets.find((widget) => !workspaceWidgetTypes.has(widget.type) && !widget.dataSourceKey);
  if (invalidWidget) throw new AppError(`Connect Dashboard Data to ${invalidWidget.title} before publishing`, 422);
  return repository.publishConfiguration(dashboardKey, configuration, user?.id);
}

async function resolveDrillDown(dashboardKey, widgetKey, parameters, user) {
  const configuration = await getPublishedDashboard(dashboardKey, user, { audit: false });
  const widget = configuration.widgets.find((item) => item.widgetKey === widgetKey && !item.archived);
  const drillDown = widget?.config?.drillDown;
  if (!drillDown?.type || !drillDown.targetKey) throw new AppError('Widget drill-down is not configured', 404);
  const allowed = new Set((drillDown.allowedParameters || []).map(String));
  const safeParameters = Object.fromEntries(Object.entries(parameters || {}).filter(([key]) => allowed.has(key)));
  if (drillDown.type === 'dashboard') {
    await getPublishedDashboard(drillDown.targetKey, user, { audit: false });
    return { type: 'dashboard', targetKey: drillDown.targetKey, parameters: safeParameters, resolvedAt: new Date().toISOString() };
  }
  if (drillDown.type === 'module') {
    await permissionService.assertModulePageActionAllowed(drillDown.targetKey, user, 'view');
    return { type: 'module', targetKey: drillDown.targetKey, parameters: safeParameters, resolvedAt: new Date().toISOString() };
  }
  throw new AppError('Unsupported drill-down destination', 422);
}

async function dashboardAccess(configuration, user, capability = 'view') {
  if (user?.role === 'admin') return { allowed: true, reason: 'admin_role' };
  const permissions = configuration?.permissions || [];
  const property = capability === 'configure' ? 'canConfigure' : 'canView';
  if (permissions.some((permission) => permission[property] && permission.subjectType === 'role' && permission.subjectKey === user?.role)) return { allowed: true, reason: 'role_permission' };
  if (permissions.some((permission) => permission[property] && permission.subjectType === 'user' && [String(user?.id), user?.email].includes(permission.subjectKey))) return { allowed: true, reason: 'user_permission' };
  const nodeId = await repository.userOrganizationNodeId(user?.id);
  const ancestors = nodeId ? await departmentRepository.ancestorIds(nodeId) : [];
  if (permissions.some((permission) => permission[property] && permission.subjectType === 'department' && ancestors.map(String).includes(permission.subjectKey))) return { allowed: true, reason: 'department_permission' };
  return { allowed: false, reason: permissions.length ? 'no_matching_permission' : 'no_permissions_configured' };
}

async function auditDashboardAccess(dashboardKey, user, action, decision) {
  await permissionRepository.createPermissionAuditLog({ userId: user?.id, moduleKey: `dashboard:${dashboardKey}`, action, allowed: decision.allowed, decisionReason: decision.reason });
}

async function listPublishedDashboards(user) {
  const configurations = await repository.listPublishedConfigurations();
  const dashboards = [];
  for (const configuration of configurations) {
    const decision = await dashboardAccess(configuration, user, 'view');
    if (decision.allowed) dashboards.push(configuration.dashboard);
  }
  return { dashboards };
}

async function getPublishedDashboard(dashboardKey, user, options = {}) {
  const configuration = await repository.publishedConfiguration(dashboardKey);
  if (!configuration) throw new AppError('Published dashboard not found', 404);
  const decision = await dashboardAccess(configuration, user, 'view');
  if (options.audit !== false) await auditDashboardAccess(dashboardKey, user, 'dashboard_view', decision);
  if (!decision.allowed) throw new AppError('You do not have permission to view this dashboard', 403);
  return { dashboard: configuration.dashboard, widgets: configuration.widgets || [], filters: configuration.filters || [] };
}

module.exports = {
  stableKey, listDashboards, getDashboard, createDashboard, updateDashboard, archiveDashboard, reopenDashboard, duplicateDashboard,
  listDataSources, getDataSource, createDataSource, updateDataSource, archiveDataSource,
  replaceConfiguration, createVersion, listVersions, checkConfiguration, restoreVersion, exportConfiguration, importConfiguration, publishDashboard,
  dashboardAccess, auditDashboardAccess, listPublishedDashboards, getPublishedDashboard, resolveDrillDown
};
