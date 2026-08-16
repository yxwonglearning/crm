const repository = require('./notifications.repository');
const email = require('./email.service');

const requesterEvents = new Set(['workflow.submitted', 'workflow.resubmitted', 'workflow.returned', 'workflow.rejected', 'workflow.approved', 'workflow.cancelled', 'workflow.withdrawn']);
const approverEvents = new Set(['workflow.stage.started', 'workflow.reminder_due', 'workflow.escalated']);

function copy(event, context) {
  const eventName = String(event.eventType || '').replace('workflow.', '').replaceAll('_', ' ');
  const action = eventName.charAt(0).toUpperCase() + eventName.slice(1);
  return { title: `${action}: ${context.requestKey}`, message: `${context.workflowName}${context.stageName ? ` · ${context.stageName}` : ''}`, type: event.eventType,
    requestKey: context.requestKey, sourceEventKey: event.eventKey, metadata: { eventType: event.eventType, stageName: context.stageName } };
}

function recipients(event, context) {
  const ids = new Set();
  if (requesterEvents.has(event.eventType) && context.requesterUserId) ids.add(context.requesterUserId);
  if (approverEvents.has(event.eventType)) context.assignments.forEach((item) => ids.add(item.userId));
  const payload = event.payload || {};
  if (['workflow.assignment.delegated', 'workflow.assignment.reassigned'].includes(event.eventType)) {
    [payload.originalApproverUserId, payload.replacementApproverUserId].filter(Boolean).forEach((id) => ids.add(Number(id)));
  }
  return [...ids];
}

function emailEnabled(event, policy = {}) {
  if (!policy.enabled) return false;
  const events = Array.isArray(policy.events) ? policy.events : [];
  return !events.length || events.includes(event.eventType);
}

function template(value, event, context) { return String(value || '').replaceAll('{{requestId}}', context.requestKey).replaceAll('{{workflowName}}', context.workflowName).replaceAll('{{stageName}}', context.stageName || '').replaceAll('{{event}}', event.eventType); }

async function handleWorkflowEvent(event, dependencies = {}) {
  const repo = dependencies.repository || repository; const mailer = dependencies.email || email;
  const context = await repo.eventContext(event); if (!context) return { notifications: 0, emails: 0 };
  const ids = recipients(event, context); const content = copy(event, context); let notifications = 0;
  for (const recipientUserId of ids) if (await repo.create({ ...content, recipientUserId }) !== null) notifications += 1;
  let emails = 0;
  if (emailEnabled(event, context.emailPolicy)) {
    const users = [...context.assignments, ...(context.requester ? [{ userId: Number(context.requester.id), email: context.requester.email, name: context.requester.name }] : [])];
    for (const id of ids) { const recipient = users.find((item) => item.userId === id); if (!recipient?.email) continue;
      try { const sender = mailer.sendWorkflowOnce ? (message) => mailer.sendWorkflowOnce(event.eventKey, context.requestKey, message) : mailer.send.bind(mailer); const result = await sender({ to: recipient.email, subject: template(context.emailPolicy.subject || '{{workflowName}} · {{requestId}}', event, context),
        text: template(context.emailPolicy.message || `${content.title}\n${content.message}`, event, context) }); if (!result.skipped) emails += 1; } catch (error) { console.error(`Workflow email failed for ${context.requestKey}:`, error.message); }
    }
  }
  return { notifications, emails };
}

module.exports = { handleWorkflowEvent, recipients, emailEnabled };
