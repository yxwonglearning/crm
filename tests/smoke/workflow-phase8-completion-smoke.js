const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const attachments = require('../../src/modules/workflows/workflows.attachments');
const approvers = require('../../src/modules/workflows/workflows.approvers');
const decisions = require('../../src/modules/workflows/workflows.decisions');
const runtime = require('../../src/modules/workflows/workflows.runtime');
const sla = require('../../src/modules/workflows/workflows.sla');

async function main() {
  const frontend = fs.readFileSync(path.resolve(__dirname, '..', '..', 'public', 'app.js'), 'utf8');
  for (const label of ['Any one approver', 'Approval quorum', 'Require malware scan before accepting files', 'Repeat reminders while overdue', 'Count business hours only', 'Append detail-table row', 'responseAttachment:']) assert.ok(frontend.includes(label), `Route Designer is missing ${label}.`);
  const businessDue = runtime.addBusinessMinutes(new Date('2026-08-14T16:00:00.000Z'), 120, {
    weekdays: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '17:00', holidays: []
  });
  assert.equal(businessDue.toISOString(), '2026-08-17T10:00:00.000Z');

  const policy = { mode: 'optional', actions: ['approval'], allowedTypes: ['text/plain'], maxFileCount: 2, maxFileSize: 1000, malwareScanRequired: true };
  const files = [{ originalname: 'note.txt', mimetype: 'text/plain', buffer: Buffer.from('safe') }];
  const clean = await attachments.validateAndScanFiles(files, policy, 'approval', { scan: async () => ({ status: 'clean', engine: 'test', result: 'OK' }) });
  assert.equal(clean[0].scanStatus, 'clean');
  await assert.rejects(() => attachments.validateAndScanFiles(files, policy, 'approval', { scan: async () => ({ status: 'infected', result: 'EICAR FOUND' }) }), (error) => error.details.code === 'WORKFLOW_ATTACHMENT_INFECTED');
  await assert.rejects(() => attachments.validateAndScanFiles(files, policy, 'approval', { scan: async () => { throw new Error('offline'); } }), (error) => error.details.code === 'WORKFLOW_ATTACHMENT_SCAN_UNAVAILABLE');

  assert.equal(decisions.stageDecisionOutcome('any', null, { total: 3, approved: 1, pending: 2 }, 'approve').approved, true);
  assert.equal(decisions.stageDecisionOutcome('all', null, { total: 2, approved: 1, pending: 0, cancelled: 1 }, 'approve').approved, true);
  assert.equal(decisions.stageDecisionOutcome('quorum', 2, { total: 3, approved: 1, pending: 1 }, 'reject').rejected, false);
  assert.equal(decisions.stageDecisionOutcome('quorum', 2, { total: 3, approved: 1, pending: 0 }, 'reject').rejected, true);

  const users = [
    { id: 1, name: 'Requester', email: 'requester@example.com', role: 'user', status: 'active' },
    { id: 2, name: 'Approver', email: 'approver@example.com', role: 'manager', status: 'active' },
    { id: 3, name: 'Substitute', email: 'substitute@example.com', role: 'manager', status: 'active' },
    { id: 4, name: 'Final substitute', email: 'final@example.com', role: 'manager', status: 'active' }
  ];
  const resolved = await approvers.resolveStageApprovers({ workflowKey: 'leave', requesterUserId: 1, snapshot: {}, stage: {
    stageKey: 'manager', name: 'Manager', approvalMode: 'any', selfApprovalPolicy: 'error', approverRules: [{ ruleKey: 'manager', resolverType: 'user', resolverReference: '2' }]
  } }, { usersRepository: { listUsers: async () => users }, workflowRepository: { findActiveDelegation: async ({ id }) => id === 2 ? { id: 10, reason: 'first', delegate: users[2] } : id === 3 ? { id: 11, reason: 'second', delegate: users[3] } : null } });
  assert.equal(resolved.approvers[0].userId, 4);
  assert.equal(resolved.approvers[0].delegationChain.length, 2);

  const events = new Set();
  const stage = { id: 8, instanceId: 9, workflowKey: 'leave', requestKey: 'LEAVE-000001', sourceModuleKey: 'leave', sourceRecordId: 1,
    stageKey: 'manager', activatedAt: new Date('2026-08-10T09:00:00Z'), dueAt: new Date('2026-08-10T10:00:00Z'),
    slaPolicy: { enabled: true, escalationMode: 'notify', recurringOverdueReminder: { enabled: true, every: 1, unit: 'hours', maxOccurrences: 3 } } };
  const result = await sla.processStage(stage, new Date('2026-08-10T12:30:00Z'), {
    appendEvent: async (entry) => { if (events.has(entry.eventKey)) { const error = new Error('duplicate'); error.code = 'ER_DUP_ENTRY'; throw error; } events.add(entry.eventKey); },
    markStageOverdue: async () => true
  });
  assert.equal(result.reminders, 3);
  assert.equal(result.escalated, true);

  const started = Date.now();
  for (let index = 0; index < 25000; index += 1) {
    decisions.stageDecisionOutcome(index % 2 ? 'quorum' : 'any', 3, { total: 10, approved: index % 5, pending: 5, cancelled: 0 }, index % 3 ? 'approve' : 'reject');
  }
  assert.ok(Date.now() - started < 2000, 'Decision-threshold evaluation should remain bounded at operational volume.');

  console.log('Phase 8 completion smoke passed.');
}

main().catch((error) => { console.error(error); process.exit(1); });
