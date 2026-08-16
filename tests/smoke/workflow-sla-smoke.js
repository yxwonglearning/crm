const assert = require('assert/strict');
const sla = require('../../src/modules/workflows/workflows.sla');
const monitoring = require('../../src/modules/workflows/workflows.monitoring');

async function main() {
  const now = new Date('2026-08-15T06:00:00.000Z');
  const events = new Map();
  const overdue = [];
  const repository = {
    listSlaCandidates: async () => [{
      id: 10, instanceId: 20, workflowId: 30, workflowKey: 'leave_approval', workflowName: 'Leave approval',
      requestKey: 'LEAVEAPPROVAL-000001', sourceModuleKey: 'customers', sourceRecordId: '1',
      stageKey: 'manager', activatedAt: new Date('2026-08-15T03:00:00.000Z'), dueAt: new Date('2026-08-15T07:00:00.000Z'),
      slaPolicy: { enabled: true, unit: 'hours', reminderOffsets: [2], escalationMode: 'notify' }
    }, {
      id: 11, instanceId: 21, workflowId: 31, workflowKey: 'expense_approval', workflowName: 'Expense approval',
      requestKey: 'EXPENSEAPPROVAL-000001', sourceModuleKey: 'customers', sourceRecordId: '2',
      stageKey: 'finance', activatedAt: new Date('2026-08-15T01:00:00.000Z'), dueAt: new Date('2026-08-15T05:00:00.000Z'),
      slaPolicy: { enabled: true, unit: 'hours', reminderOffsets: [2], escalationMode: 'notify' }
    }],
    appendEvent: async (entry) => {
      if (events.has(entry.eventKey)) { const error = new Error('duplicate'); error.code = 'ER_DUP_ENTRY'; throw error; }
      events.set(entry.eventKey, entry);
    },
    markStageOverdue: async (stageId) => overdue.push(stageId)
  };

  const first = await sla.processDueStages({ now, repository });
  assert.deepEqual(first, { scanned: 2, reminders: 1, escalations: 1 });
  assert.equal(events.get('workflow-sla-reminder:10:2').eventType, 'workflow.reminder_due');
  assert.equal(events.get('workflow-sla-escalated:11').eventType, 'workflow.escalated');
  const replay = await sla.processDueStages({ now, repository });
  assert.deepEqual(replay, { scanned: 2, reminders: 0, escalations: 0 });
  assert.deepEqual(overdue, [11, 11]);

  assert.equal(monitoring.slaStatus({ status: 'pending', dueAt: new Date('2026-08-15T05:00:00Z') }, now), 'overdue');
  assert.equal(monitoring.slaStatus({ status: 'pending', dueAt: new Date('2026-08-15T07:00:00Z') }, now), 'due_soon');
  assert.equal(monitoring.slaStatus({ status: 'pending', dueAt: new Date('2026-08-17T07:00:00Z') }, now), 'on_track');
  assert.throws(() => monitoring.assertMonitor({ id: 2, role: 'user' }), (error) => error.statusCode === 403);
  const reportCsv = await monitoring.exportCsv({ status: 'all' }, { id: 1, role: 'admin' }, { now, repository: {
    listWorkflowMonitoring: async () => [{ requestKey: 'LEAVE-000001', workflowName: 'Leave approval', status: 'approved', requesterName: 'Ada', requesterEmail: 'ada@example.com', requesterDepartmentName: 'People', stageName: 'Manager', approverNames: ['Grace'], sourceModuleKey: 'leave', sourceRecordId: 7, submittedAt: now, completedAt: now }]
  } });
  assert.match(reportCsv, /"Request ID","Workflow"/);
  assert.match(reportCsv, /"LEAVE-000001","Leave approval"/);

  process.stdout.write('Workflow SLA worker and monitoring smoke passed.\n');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
