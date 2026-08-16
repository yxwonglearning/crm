const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const notifications = require('../../src/modules/notifications/notifications.service');
const email = require('../../src/modules/notifications/email.service');

async function main() {
  const created = []; const sent = [];
  const repository = {
    eventContext: async () => ({ requestKey: 'LEAVE-000001', workflowName: 'Leave approval', stageName: 'Supervisor', requesterUserId: 10,
      requester: { id: 10, email: 'requester@example.com', name: 'Requester' }, assignments: [{ userId: 20, email: 'approver@example.com', name: 'Approver' }],
      emailPolicy: { enabled: true, events: ['workflow.stage.started'], subject: '{{workflowName}} · {{requestId}}', message: 'Review {{requestId}} at {{stageName}}' } }),
    create: async (entry) => { created.push(entry); return created.length; }
  };
  const result = await notifications.handleWorkflowEvent({ eventKey: 'event-1', eventType: 'workflow.stage.started', instanceId: 1, instanceStageId: 2, payload: {} }, {
    repository, email: { send: async (message) => { sent.push(message); return { skipped: false, messageId: 'test' }; } }
  });
  assert.deepEqual(result, { notifications: 1, emails: 1 });
  assert.equal(created[0].recipientUserId, 20);
  assert.equal(created[0].requestKey, 'LEAVE-000001');
  assert.equal(sent[0].subject, 'Leave approval · LEAVE-000001');
  assert.equal(sent[0].text, 'Review LEAVE-000001 at Supervisor');
  const encrypted = email.encrypt('gmail-app-password');
  assert.notEqual(encrypted, 'gmail-app-password');
  assert.equal(email.decrypt(encrypted), 'gmail-app-password');
  const publicRoot = path.resolve(__dirname, '../../public');
  const html = fs.readFileSync(path.join(publicRoot, 'index.html'), 'utf8');
  const styles = fs.readFileSync(path.join(publicRoot, 'styles.css'), 'utf8');
  assert.match(html, /class="app-frame"/);
  assert.match(html, /class="app-header"[\s\S]*id="notificationHub"[\s\S]*class="workspace"/);
  assert.match(html, /class="app-footer"/);
  assert.match(styles, /\.app-frame\s*\{[\s\S]*grid-template-rows:\s*auto minmax\(0, 1fr\) auto/);
  assert.match(styles, /\.notification-hub\s*\{\s*position:\s*relative/);
  assert.doesNotMatch(styles, /\.notification-hub\s*\{[^}]*position:\s*fixed/);
  process.stdout.write('Notification centre and email policy smoke passed.\n');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
