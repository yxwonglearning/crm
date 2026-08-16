const repository = require('./workflows.repository');
const actionFlowRepository = require('../action-flows/action-flows.repository');
const actionFlowRuntime = require('../action-flows/action-flows.runtime');
const notifications = require('../notifications/notifications.service');

const MAX_ATTEMPTS = 5;
let dispatcherTimer = null;
let dispatching = false;

function triggerNode(flow) {
  return (flow.definition?.nodes || []).find((node) => node.category === 'trigger');
}

function matches(flow, event) {
  const config = triggerNode(flow)?.config || {};
  const eventTypes = Array.isArray(config.eventTypes) ? config.eventTypes.filter(Boolean) : [];
  if (eventTypes.length && !eventTypes.includes(event.eventType)) return false;
  const stageKey = event.payload?.stageKey || '';
  if (config.stageKey && config.stageKey !== stageKey) return false;
  const connectionKey = event.payload?.connectionKey || event.payload?.outcome || '';
  return !config.connectionKey || config.connectionKey === connectionKey;
}

async function dispatchEvent(event) {
  if (!await repository.claimEvent(event.id)) return { eventKey: event.eventKey, status: 'claimed_elsewhere' };
  try {
    const instance = await repository.findInstanceById(event.instanceId);
    if (!instance) throw new Error(`Workflow instance ${event.instanceId} was not found`);
    const builtIn = await notifications.handleWorkflowEvent(event);
    const flows = (await actionFlowRepository.listEnabledFlowsForWorkflowEvent(instance.workflowKey))
      .filter((flow) => matches(flow, event));
    const results = [];
    for (const flow of flows) {
      const result = await actionFlowRuntime.executeFlow(flow, {
        triggerType: 'workflow_event',
        eventKey: event.eventKey,
        eventType: event.eventType,
        schemaVersion: event.schemaVersion,
        workflowKey: instance.workflowKey,
        requestKey: instance.requestKey,
        moduleKey: instance.sourceModuleKey,
        recordId: instance.sourceRecordId,
        record: { ...event.payload, workflowKey: instance.workflowKey, requestKey: instance.requestKey },
        workflow: instance,
        userId: null
      });
      results.push({ flowKey: flow.flowKey, ...result });
      if (result.status === 'failed') throw new Error(`Automation Flow ${flow.flowKey} failed`);
    }
    await repository.markEventDelivered(event.id);
    return { eventKey: event.eventKey, status: 'delivered', builtIn, flows: results };
  } catch (error) {
    const attempt = Number(event.attemptCount || 0) + 1;
    const nextAttemptAt = attempt < MAX_ATTEMPTS
      ? new Date(Date.now() + Math.min(60000 * (2 ** (attempt - 1)), 3600000))
      : null;
    await repository.markEventFailed(event.id, error.message, nextAttemptAt);
    return { eventKey: event.eventKey, status: 'failed', terminal: !nextAttemptAt, error: error.message };
  }
}

async function dispatchPendingEvents(limit = 50) {
  if (dispatching) return [];
  dispatching = true;
  try {
    const events = await repository.listPendingEvents(limit);
    const results = [];
    for (const event of events) results.push(await dispatchEvent(event));
    return results;
  } finally {
    dispatching = false;
  }
}

function startDispatcher(intervalMs = 10000) {
  if (dispatcherTimer) return dispatcherTimer;
  dispatcherTimer = setInterval(() => {
    dispatchPendingEvents().catch((error) => console.error('Workflow event dispatcher failed:', error.message));
  }, Math.max(Number(intervalMs) || 10000, 1000));
  dispatcherTimer.unref?.();
  dispatchPendingEvents().catch((error) => console.error('Workflow event dispatcher failed:', error.message));
  return dispatcherTimer;
}

module.exports = { dispatchEvent, dispatchPendingEvents, startDispatcher, matches };
