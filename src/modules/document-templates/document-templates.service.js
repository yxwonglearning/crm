const { AppError } = require('../../shared/errors');
const repository = require('./document-templates.repository');
const sourceRecords = require('../workflows/workflows.source-records');
const access = require('../workflows/workflows.access');
const permissions = require('../permissions/permissions.service');
const moduleConfig = require('../sysadmin/module-config.service');
const departments = require('../departments/departments.repository');
const customerRepository = require('../customers/customers.repository');
const dateValue = (value) => value instanceof Date ? value.toISOString() : (value || '');

// Only include configured, viewable fields. Never pass full DB rows to Chromium.
function visibleRecord(record, fields, permissionMap) {
  const result = { id: record.id };
  const allowed = fields.filter((field) => permissionMap.get(field.fieldKey)?.view);
  for (const field of allowed.filter((field) => field.tableType !== 'detail')) {
    const value = record.customFields?.[field.fieldKey];
    if (value !== undefined) result[field.fieldKey] = value instanceof Date ? dateValue(value) : value;
  }
  for (const table of new Set(allowed.filter((field) => field.tableType === 'detail').map((field) => field.detailTableName))) {
    const keys = allowed.filter((field) => field.detailTableName === table).map((field) => field.fieldKey);
    result[table] = (record.detailTables?.[table] || []).map((row) => Object.fromEntries(keys.filter((key) => Object.hasOwn(row, key)).map((key) => [key, row[key] instanceof Date ? dateValue(row[key]) : row[key]])));
  }
  return result;
}
async function resolve(templateKey, input, user, deps = {}) {
  if (!user?.id) throw new AppError('Authentication required', 401);
  const saved = await (deps.repository || repository).find(templateKey);
  if (!saved) throw new AppError('Document template not found', 404);
  if (input.revision && input.revision !== saved.revision) throw new AppError('Template changed. Refresh Preview before downloading.', 409);
  const { template } = saved;
  let record = {}, workflow = {};
  const [kind, key] = template.source.split(':');
  if (input.workflowRequestId) {
    const view = await (deps.access || access).getRequestView(input.workflowRequestId, user);
    const request = view.request;
    if ((kind === 'module' && request.sourceModuleKey !== key) || (kind === 'form' && view.presentation?.formKey !== key) || (input.recordId && Number(request.sourceRecordId) !== input.recordId)) throw new AppError('Template and workflow context do not match', 422);
    record = view.snapshot?.snapshot || {};
    const approval = [...view.timeline].reverse().find((event) => event.action === 'approved' || event.action === 'approve');
    workflow = { request_number: request.requestKey, status: request.status, submitted_by: request.requesterName || '', submitted_date: dateValue(request.submittedAt), approved_by: approval?.actorIdentity?.name || '', approved_date: dateValue(approval?.createdAt) };
  } else if (input.recordId) {
    if (kind !== 'module') throw new AppError('This template requires a workflow request', 422);
    const permissionService = deps.permissions || permissions;
    await permissionService.assertModulePageActionAllowed(key, user, 'view', { recordId: input.recordId });
    const { record: source } = await (deps.sourceRecords || sourceRecords).getRecord(key, input.recordId, user);
    if (!source) throw new AppError('Record not found', 404);
    const config = await (deps.moduleConfig || moduleConfig).getModuleConfig(key);
    const map = await permissionService.userFieldPermissions(key, user, config.fields || []);
    if (key === 'customers') source.detailTables = await (deps.customerRepository || customerRepository).detailRowsByCustomerId(source.id, (config.fields || []).filter((field) => map.get(field.fieldKey)?.view));
    record = visibleRecord(source, config.fields || [], map);
  } else if (user.role !== 'admin') {
    throw new AppError('An authorized record or workflow context is required', 403);
  }
  const organization = await (deps.departments || departments).findOrganization();
  const now = new Date();
  const context = { record, workflow, system: { generated_date: now.toISOString().slice(0, 10), generated_time: now.toISOString().slice(11, 19) + ' UTC', organization_name: organization?.name || '', current_user: user.name || '' } };
  return { ...saved, context, reference: workflow.request_number || record.id || 'template' };
}
function filename(name, reference) {
  const safe = `${name}-${reference}`.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^[.-]+|[.-]+$/g, '').slice(0, 150);
  return `${safe || 'document'}.pdf`;
}
module.exports = { resolve, visibleRecord, filename };
