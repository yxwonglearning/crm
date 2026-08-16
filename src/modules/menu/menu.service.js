const { AppError } = require('../../shared/errors');
const repository = require('./menu.repository');

const coreDestinations = [
  ['customersView', 'Customers'], ['usersView', 'Users'], ['dashboardPagesView', 'Dashboards'],
  ['workflowRequestsView', 'Approval Requests'], ['workflowMonitoringView', 'Workflow Monitoring'],
  ['workflowDelegationView', 'Approval Delegation'], ['sysadminView', 'Admin Portal']
].map(([key, label]) => ({ type: 'view', key, label }));

function defaultConfig() {
  return {
    schemaVersion: 1,
    defaultModuleGroupKey: '',
    items: coreDestinations.map((destination, index) => ({
      key: destination.key.replace(/View$/, '').replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
      type: 'item', parentKey: null, label: destination.label, icon: 'none', enabled: true, order: index + 1,
      destination: { type: 'view', key: destination.key }, visibility: { roles: [], userIds: [], departmentIds: [] },
      systemKey: destination.key === 'sysadminView' ? 'admin_portal' : undefined
    }))
  };
}

function parse(value, fallback = null) {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch (_error) { return fallback; }
}

function validate(config) {
  const errors = [];
  const items = Array.isArray(config?.items) ? config.items : [];
  const keys = new Set();
  items.forEach((item) => {
    if (!/^[a-z][a-z0-9_]{1,79}$/.test(item.key || '')) errors.push(`Invalid stable key: ${item.key || '(blank)'}`);
    if (keys.has(item.key)) errors.push(`Duplicate stable key: ${item.key}`);
    keys.add(item.key);
    if (!String(item.label || '').trim()) errors.push(`Label is required for ${item.key || 'an item'}.`);
    if (item.parentKey && !items.some((candidate) => candidate.key === item.parentKey && candidate.type === 'group')) errors.push(`${item.key} has an unavailable parent group.`);
    if (item.type === 'item' && !item.destination?.type) errors.push(`${item.label || item.key} needs a destination.`);
    if (item.destination?.type === 'external') {
      try { if (new URL(item.destination.url).protocol !== 'https:') throw new Error(); } catch (_error) { errors.push(`${item.label || item.key} must use a valid HTTPS URL.`); }
    }
  });
  items.forEach((item) => {
    let current = item; let depth = 0; const visited = new Set([item.key]);
    while (current.parentKey) {
      depth += 1;
      if (visited.has(current.parentKey)) { errors.push(`${item.key} has a circular parent path.`); break; }
      visited.add(current.parentKey);
      current = items.find((candidate) => candidate.key === current.parentKey);
      if (!current) break;
    }
    if (depth > 2) errors.push(`${item.label || item.key} exceeds the maximum of two submenu levels.`);
  });
  const admin = items.find((item) => item.systemKey === 'admin_portal');
  if (!admin || !admin.enabled || admin.destination?.key !== 'sysadminView') errors.push('Admin Portal must remain enabled and linked to the Admin Portal.');
  if (admin && (admin.visibility?.roles?.length || admin.visibility?.userIds?.length || admin.visibility?.departmentIds?.length)) errors.push('Admin Portal cannot have restrictive visibility rules.');
  return { valid: errors.length === 0, errors };
}

function normalize(config) {
  const clean = { schemaVersion: 1, defaultModuleGroupKey: config?.defaultModuleGroupKey || '', items: [] };
  clean.items = (config?.items || []).map((item, index) => ({
    key: String(item.key || '').trim(), type: item.type === 'group' ? 'group' : 'item', parentKey: item.parentKey || null,
    label: String(item.label || '').trim().slice(0, 80), icon: String(item.icon || 'none').slice(0, 30), enabled: item.enabled !== false,
    order: Number(item.order || index + 1), destination: item.type === 'group' ? null : item.destination,
    visibility: { roles: item.visibility?.roles || [], userIds: (item.visibility?.userIds || []).map(Number), departmentIds: (item.visibility?.departmentIds || []).map(Number) },
    systemKey: item.systemKey || undefined
  }));
  return clean;
}

function visibleTo(item, user) {
  if (!item.enabled) return false;
  if (item.systemKey === 'admin_portal' || ['usersView', 'workflowMonitoringView', 'workflowDelegationView'].includes(item.destination?.key)) return user.role === 'admin';
  const visibility = item.visibility || {};
  const constrained = (visibility.roles?.length || visibility.userIds?.length || visibility.departmentIds?.length);
  if (!constrained) return true;
  return visibility.roles?.includes(user.role) || visibility.userIds?.includes(Number(user.id)) || visibility.departmentIds?.includes(Number(user.organization_node_id));
}

async function getConfig() {
  const row = await repository.findDefinition();
  return { draft: parse(row?.draft_json, defaultConfig()), published: parse(row?.published_json, defaultConfig()), publishedVersion: Number(row?.published_version || 0) };
}

async function getSidebar(user) {
  const row = await repository.findDefinition();
  const config = parse(row?.published_json, defaultConfig());
  const catalog = await repository.catalog();
  const represented = new Set(config.items.filter((item) => item.destination?.type === 'module').map((item) => item.destination.key));
  catalog.modules.forEach((module, index) => {
    if (!represented.has(module.module_key)) config.items.push({ key: `module_${module.module_key}`, type: 'item', parentKey: config.defaultModuleGroupKey || null, label: module.name, icon: 'module', enabled: true, order: 1000 + index, destination: { type: 'module', key: module.module_key }, visibility: { roles: [], userIds: [], departmentIds: [] } });
  });
  const availableModules = new Set(catalog.modules.map((module) => module.module_key));
  const visible = config.items.filter((item) => visibleTo(item, user) && (item.destination?.type !== 'module' || availableModules.has(item.destination.key)));
  const visibleGroups = new Set();
  visible.filter((item) => item.type === 'item').forEach((item) => { let parentKey = item.parentKey; while (parentKey) { visibleGroups.add(parentKey); parentKey = config.items.find((candidate) => candidate.key === parentKey)?.parentKey || null; } });
  return { version: Number(row?.published_version || 0), items: visible.filter((item) => item.type !== 'group' || visibleGroups.has(item.key)).sort((a, b) => a.order - b.order) };
}

async function saveDraft(input, userId) {
  const config = normalize(input);
  const check = validate(config);
  if (!check.valid) throw new AppError(check.errors[0], 400, { errors: check.errors });
  await repository.saveDraft(config, userId);
  return { config, check };
}

async function publish(input, userId) {
  const config = normalize(input);
  const check = validate(config);
  if (!check.valid) throw new AppError(check.errors[0], 400, { errors: check.errors });
  const result = await repository.publish(config, userId);
  return { config, check, ...result };
}

async function restore(id, userId) {
  const version = await repository.findVersion(id);
  if (!version) throw new AppError('Menu version not found', 404);
  return saveDraft(parse(version.config_json, defaultConfig()), userId);
}

async function getCatalog() {
  const data = await repository.catalog();
  return { destinations: [...coreDestinations, ...data.modules.map((module) => ({ type: 'module', key: module.module_key, label: module.name }))], users: data.users.map((u) => ({ id: Number(u.id), name: u.name, email: u.email, role: u.role })), departments: data.departments.map((d) => ({ id: Number(d.id), name: d.name, type: d.node_type })) };
}

module.exports = { defaultConfig, validate, getConfig, getSidebar, saveDraft, publish, restore, getCatalog, listVersions: repository.listVersions };
