const crypto = require('crypto');
const { AppError } = require('../../shared/errors');
const repository = require('./workflows.repository');

let timer = null;
let running = false;
const unitMs = { minutes: 60000, hours: 3600000, days: 86400000 };

async function appendEventOnce(repo, entry, db) {
  try { await repo.appendEvent(entry, db); return true; }
  catch (error) { if (error.code === 'ER_DUP_ENTRY') return false; throw error; }
}

function eventPayload(stage, extra = {}) {
  return {
    workflowKey: stage.workflowKey, requestKey: stage.requestKey,
    sourceModuleKey: stage.sourceModuleKey, sourceRecordId: stage.sourceRecordId,
    requestStatus: 'pending', stageKey: stage.stageKey, stageStatus: 'active',
    dueAt: stage.dueAt, ...extra
  };
}

async function processStage(stage, now, repo = repository) {
  const policy = stage.slaPolicy || {};
  if (!policy.enabled || !stage.activatedAt || !stage.dueAt) return { reminders: 0, escalated: false };
  let reminders = 0;
  const scale = unitMs[policy.unit] || unitMs.hours;
  for (const offset of [...new Set((policy.reminderOffsets || []).map(Number).filter((value) => Number.isFinite(value) && value >= 0))]) {
    const reminderAt = new Date(new Date(stage.dueAt).getTime() - offset * scale);
    if (now < reminderAt || now >= new Date(stage.dueAt)) continue;
    const created = await appendEventOnce(repo, {
      eventKey: `workflow-sla-reminder:${stage.id}:${offset}`,
      eventType: 'workflow.reminder_due', instanceId: stage.instanceId, instanceStageId: stage.id,
      payload: eventPayload(stage, { reminderOffset: offset, reminderUnit: policy.unit, reminderAt })
    });
    if (created) reminders += 1;
  }
  let escalated = false;
  if (now >= new Date(stage.dueAt)) {
    await repo.markStageOverdue(stage.id, now);
    if ((policy.escalationMode || 'notify') !== 'none') {
      escalated = await appendEventOnce(repo, {
        eventKey: `workflow-sla-escalated:${stage.id}`,
        eventType: 'workflow.escalated', instanceId: stage.instanceId, instanceStageId: stage.id,
        payload: eventPayload(stage, { escalationMode: policy.escalationMode || 'notify', overdueAt: now })
      });
    }
    const recurring = policy.recurringOverdueReminder || {};
    if (recurring.enabled) {
      const repeatScale = unitMs[recurring.unit] || unitMs.hours;
      const elapsed = now.getTime() - new Date(stage.dueAt).getTime();
      const occurrence = Math.floor(elapsed / (Math.max(1, Number(recurring.every)) * repeatScale)) + 1;
      const maxOccurrences = Math.min(Math.max(Number(recurring.maxOccurrences) || 1, 1), 100);
      for (let index = 1; index <= Math.min(occurrence, maxOccurrences); index += 1) {
        const created = await appendEventOnce(repo, {
          eventKey: `workflow-sla-overdue-reminder:${stage.id}:${index}`,
          eventType: 'workflow.reminder_due', instanceId: stage.instanceId, instanceStageId: stage.id,
          payload: eventPayload(stage, { overdue: true, recurring: true, occurrence: index })
        });
        if (created) reminders += 1;
      }
    }
  }
  return { reminders, escalated };
}

async function processDueStages(options = {}) {
  if (running) return { scanned: 0, reminders: 0, escalations: 0, skipped: true };
  running = true;
  const repo = options.repository || repository;
  const now = options.now || new Date();
  try {
    const stages = await repo.listSlaCandidates(options.limit || 200);
    const summary = { scanned: stages.length, reminders: 0, escalations: 0 };
    for (const stage of stages) {
      const result = await processStage(stage, now, repo);
      summary.reminders += result.reminders;
      summary.escalations += result.escalated ? 1 : 0;
    }
    return summary;
  } finally { running = false; }
}

async function sendManualReminder(requestKey, input, user, repo = repository) {
  if (user?.role !== 'admin') throw new AppError('Only administrators can send workflow reminders.', 403, { code: 'WORKFLOW_PERMISSION_MONITOR_DENIED' });
  const instance = await repo.findInstanceByRequestKey(requestKey);
  if (!instance || instance.status !== 'pending' || !instance.currentStageKey) throw new AppError('An active workflow stage was not found.', 409, { code: 'WORKFLOW_SLA_STAGE_INACTIVE' });
  const stage = await repo.findActiveStage(instance.id);
  const fingerprint = crypto.createHash('sha256').update(String(input?.idempotencyKey || crypto.randomUUID())).digest('hex').slice(0, 32);
  const eventKey = `workflow-sla-manual:${stage.id}:${fingerprint}`;
  const created = await appendEventOnce(repo, { eventKey, eventType: 'workflow.reminder_due', instanceId: instance.id, instanceStageId: stage.id,
    payload: eventPayload({ ...instance, ...stage }, { manual: true, actorId: user.id }) });
  if (created) await repo.appendAudit({ workflowId: instance.workflowId, instanceId: instance.id, instanceStageId: stage.id,
    actorUserId: user.id, action: 'workflow.reminder.sent', targetType: 'workflow_instance', targetKey: requestKey,
    result: 'allowed', reasonCode: 'WORKFLOW_SLA_MANUAL_REMINDER', metadata: { eventKey } });
  return { requestKey, eventKey, status: created ? 'queued' : 'already_queued' };
}

function startWorker(intervalMs = 30000) {
  if (timer) return timer;
  timer = setInterval(() => processDueStages().catch((error) => console.error('Workflow SLA worker failed:', error.message)), Math.max(Number(intervalMs) || 30000, 5000));
  timer.unref?.();
  processDueStages().catch((error) => console.error('Workflow SLA worker failed:', error.message));
  return timer;
}

module.exports = { appendEventOnce, processStage, processDueStages, sendManualReminder, startWorker };
