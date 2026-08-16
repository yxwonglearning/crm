const { AppError } = require('../../shared/errors');
const repository = require('./workflows.repository');
const sla = require('./workflows.sla');

function assertMonitor(user) {
  if (!user?.id) throw new AppError('Authentication is required', 401, { code: 'WORKFLOW_PERMISSION_AUTH_REQUIRED' });
  if (user.role !== 'admin') throw new AppError('Only administrators can monitor all workflow requests.', 403, { code: 'WORKFLOW_PERMISSION_MONITOR_DENIED' });
}

function slaStatus(item, now = new Date()) {
  if (item.status !== 'pending' || !item.dueAt) return item.status === 'pending' ? 'not_tracked' : 'completed';
  if (item.escalatedAt || item.overdueAt || new Date(item.dueAt) < now) return 'overdue';
  if (new Date(item.dueAt).getTime() - now.getTime() <= 24 * 3600000) return 'due_soon';
  return 'on_track';
}

async function list(filters, user, dependencies = {}) {
  assertMonitor(user);
  const repo = dependencies.repository || repository;
  const now = dependencies.now || new Date();
  const items = (await repo.listWorkflowMonitoring(filters)).map((item) => ({ ...item, slaStatus: slaStatus(item, now) }));
  return {
    generatedAt: now,
    summary: {
      total: items.length,
      active: items.filter((item) => item.status === 'pending').length,
      dueSoon: items.filter((item) => item.slaStatus === 'due_soon').length,
      overdue: items.filter((item) => item.slaStatus === 'overdue').length,
      completed: items.filter((item) => item.slaStatus === 'completed').length
    },
    items
  };
}

function csvCell(value) {
  const text = Array.isArray(value) ? value.join('; ') : String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

async function exportCsv(filters, user, dependencies = {}) {
  const result = await list({ ...filters, limit: 500 }, user, dependencies);
  const headings = ['Request ID', 'Workflow', 'Status', 'Requester', 'Requester email', 'Department', 'Current stage', 'Approvers', 'Source module', 'Source record', 'Submitted at', 'Completed at', 'SLA status', 'Due at'];
  const rows = result.items.map((item) => [item.requestKey, item.workflowName, item.status, item.requesterName,
    item.requesterEmail, item.requesterDepartmentName, item.stageName, item.approverNames, item.sourceModuleKey,
    item.sourceRecordId, item.submittedAt, item.completedAt, item.slaStatus, item.dueAt]);
  return `\ufeff${[headings, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
}

async function sendReminder(requestKey, input, user, dependencies = {}) {
  assertMonitor(user);
  return (dependencies.sla || sla).sendManualReminder(requestKey, input, user, dependencies.repository || repository);
}

module.exports = { assertMonitor, slaStatus, list, exportCsv, sendReminder };
