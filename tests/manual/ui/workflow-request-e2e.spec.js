const { test, expect } = require('@playwright/test');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { pool } = require('../../../src/database/pool');
const workflowRepository = require('../../../src/modules/workflows/workflows.repository');
const workflowDispatcher = require('../../../src/modules/workflows/workflows.dispatcher');
const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';

const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const workflowKey = `playwright_request_${suffix}`;
const approverEmail = `phase8.approver.${suffix}@example.test`;
const approverPassword = 'Phase8Playwright123!';
const backupEmail = `phase8.backup.${suffix}@example.test`;
let approverId;
let backupId;
let workflowId;
let workflowVersionId;
let instanceId;

test.use({ channel: 'chrome' });

async function login(page, email, password) {
  await page.goto(`${baseUrl}/`);
  await page.locator('#loginForm input[name="email"]').fill(email);
  await page.locator('#loginForm input[name="password"]').fill(password);
  const catalogLoaded = page.waitForResponse((response) => response.url().includes('/api/workflows/catalog') && response.ok());
  await page.getByRole('button', { name: 'Sign In' }).click();
  const catalogResponse = await catalogLoaded;
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  return catalogResponse.json();
}

async function cleanup() {
  const [instances] = await pool.execute(
    'SELECT id, request_key FROM crm_workflow_instances WHERE workflow_id = ?',
    [workflowId || 0]
  );
  for (const instance of instances) {
    instanceId = instance.id;
    await pool.execute('DELETE FROM crm_notifications WHERE request_key = ?', [instance.request_key]);
    await pool.execute('DELETE FROM crm_workflow_idempotency_keys WHERE instance_id = ?', [instanceId]);
    await pool.execute('DELETE FROM crm_workflow_audit_logs WHERE instance_id = ?', [instanceId]);
    await pool.execute('DELETE FROM crm_workflow_events WHERE instance_id = ?', [instanceId]);
    await pool.execute('DELETE FROM crm_workflow_record_locks WHERE instance_id = ?', [instanceId]);
    await pool.execute('DELETE FROM crm_workflow_attachments WHERE instance_id = ?', [instanceId]);
    await pool.execute('DELETE FROM crm_workflow_decisions WHERE instance_id = ?', [instanceId]);
    await pool.execute('DELETE FROM crm_workflow_assignment_transfers WHERE instance_id = ?', [instanceId]);
    await pool.execute(
      `DELETE assignments FROM crm_workflow_assignments assignments
       INNER JOIN crm_workflow_instance_stages stages ON stages.id = assignments.instance_stage_id
       WHERE stages.instance_id = ?`,
      [instanceId]
    );
    await pool.execute('DELETE FROM crm_workflow_instance_stages WHERE instance_id = ?', [instanceId]);
    await pool.execute('DELETE FROM crm_workflow_instance_snapshots WHERE instance_id = ?', [instanceId]);
    await pool.execute('DELETE FROM crm_workflow_instances WHERE id = ?', [instanceId]);
  }
  if (workflowVersionId) {
    await pool.execute(
      `DELETE rules FROM crm_workflow_version_approver_rules rules
       INNER JOIN crm_workflow_version_stages stages ON stages.id = rules.version_stage_id
       WHERE stages.workflow_version_id = ?`,
      [workflowVersionId]
    );
    await pool.execute('DELETE FROM crm_workflow_version_stages WHERE workflow_version_id = ?', [workflowVersionId]);
  }
  if (workflowId) {
    await pool.execute('UPDATE crm_workflow_definitions SET published_version_id = NULL WHERE id = ?', [workflowId]);
    await pool.execute('DELETE FROM crm_workflow_versions WHERE workflow_id = ?', [workflowId]);
    await pool.execute('DELETE FROM crm_workflow_definitions WHERE id = ?', [workflowId]);
  }
  if (approverId || backupId) await pool.query('DELETE FROM crm_workflow_delegations WHERE delegator_user_id IN (?) OR delegate_user_id IN (?)', [[approverId, backupId].filter(Boolean), [approverId, backupId].filter(Boolean)]);
  if (approverId) await pool.execute('DELETE FROM users WHERE id = ?', [approverId]);
  if (backupId) await pool.execute('DELETE FROM users WHERE id = ?', [backupId]);
}

test.beforeAll(async () => {
  const passwordHash = await bcrypt.hash(approverPassword, 10);
  const [userResult] = await pool.execute(
    `INSERT INTO users (staff_id, name, email, password_hash, role, status, custom_fields)
     VALUES (?, ?, ?, ?, 'user', 'active', JSON_OBJECT())`,
    [`PW-${suffix}`, 'Phase 8 Playwright Approver', approverEmail, passwordHash]
  );
  approverId = userResult.insertId;
  const [backupResult] = await pool.execute(
    `INSERT INTO users (staff_id, name, email, password_hash, role, status, custom_fields)
     VALUES (?, ?, ?, ?, 'user', 'active', JSON_OBJECT())`,
    [`PWB-${suffix}`, 'Phase 8 Backup Approver', backupEmail, passwordHash]
  );
  backupId = backupResult.insertId;
  const [admins] = await pool.execute("SELECT id FROM users WHERE role = 'admin' AND status = 'active' ORDER BY id LIMIT 1");
  const adminId = admins[0].id;
  const definition = await workflowRepository.createDefinition({
    workflowKey,
    name: 'Phase 8 Playwright Request',
    sourceModuleKey: 'customers',
    requestFormKey: null,
    requestFormVersion: null,
    draftConfig: {}
  }, adminId);
  workflowId = definition.id;
  const version = await workflowRepository.createVersion(workflowKey, {
    action: 'publish',
    snapshot: {
      workflowKey,
      sourceModuleKey: 'customers',
      builderGraph: {
        nodes: [
          { id: 'start', type: 'start', attachmentPolicy: { mode: 'required', allowedTypes: ['text/plain'], maxFileSize: 1024, maxFileCount: 2, actions: ['submission'] } },
          { id: 'stage:review', type: 'approval', stageKey: 'review' },
          { id: 'end', type: 'end' }
        ],
        edges: [
          { id: 'submit-review', from: 'start', to: 'stage:review', outcome: 'submit' },
          { id: 'review-approved', from: 'stage:review', to: 'end', outcome: 'approved' }
        ]
      },
      recordPolicy: { lockScope: 'record', allowAuthorizedCancel: true },
      stages: [{
        stageKey: 'review',
        name: 'Playwright Approval',
        order: 0,
        approvalMode: 'all',
        selfApprovalPolicy: 'error',
        decisionPolicy: { approvalRemark: 'optional', rejectionRemark: 'required', returnRemark: 'required' },
        attachmentPolicy: { mode: 'required', allowedTypes: ['text/plain'], maxFileSize: 1024, maxFileCount: 2, actions: ['approval'] },
        slaPolicy: { enabled: true, duration: 2, unit: 'hours', reminderOffsets: [1], escalationMode: 'notify' },
        approverRules: [{ ruleKey: 'approver', resolverType: 'user', resolverReference: String(approverId) }]
      }]
    }
  }, adminId);
  workflowVersionId = version.id;
});

test.afterAll(async () => {
  await cleanup();
  await pool.end();
});

test('requester submits and assigned approver approves through the UI', async ({ page }) => {
  const adminCatalog = await login(page, process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
  expect(adminCatalog.definitions.map((definition) => definition.workflowKey)).toContain(workflowKey);
  await page.waitForFunction((key) => state.workflowDefinitions.some((definition) => definition.workflowKey === key), workflowKey);
  await page.getByRole('button', { name: 'Admin Portal' }).click();
  const settingsLoaded = page.waitForResponse((response) => response.url().endsWith('/api/notifications/email-settings/current') && response.ok());
  await page.getByRole('button', { name: /Email Settings/ }).click();
  await settingsLoaded;
  await expect(page.locator('#emailSettingsForm input[name="host"]')).toHaveAttribute('placeholder', 'smtp.gmail.com');
  await expect(page.locator('#emailSettingsForm input[name="secret"]')).toHaveAttribute('placeholder', '16-character Google App Password');
  await page.getByRole('button', { name: 'Approval Delegation' }).click();
  await page.getByRole('button', { name: 'Create delegation' }).click();
  await page.locator('#workflowDelegationForm select[name="delegatorUserId"]').selectOption(String(approverId));
  await page.locator('#workflowDelegationForm select[name="delegateUserId"]').selectOption(String(backupId));
  await page.locator('#workflowDelegationForm select[name="workflowKey"]').selectOption(workflowKey);
  await page.locator('#workflowDelegationForm textarea[name="reason"]').fill('Scheduled coverage test');
  const delegationCreated = page.waitForResponse((response) => response.url().endsWith('/api/workflows/delegations') && response.request().method() === 'POST');
  await page.locator('#workflowDelegationForm button[type="submit"]').click();
  expect((await delegationCreated).status()).toBe(201);
  await expect(page.locator('#workflowDelegationList')).toContainText('Phase 8 Backup Approver');
  await page.getByRole('button', { name: 'Approval Requests' }).click();
  await page.getByRole('button', { name: 'New approval request' }).click();
  await expect(page.locator('#workflowSubmitModal')).toBeVisible();
  await page.locator('#workflowSubmitForm select[name="workflowKey"]').selectOption(workflowKey);
  await page.locator('#workflowSubmitForm input[name="sourceRecordId"]').fill('1');
  await page.locator('#workflowSubmitAttachments input[type="file"]').setInputFiles({ name: 'request-evidence.txt', mimeType: 'text/plain', buffer: Buffer.from('request evidence') });
  const submitted = page.waitForResponse((response) => response.url().endsWith('/api/workflows/requests') && response.request().method() === 'POST');
  await page.locator('#workflowSubmitForm button[type="submit"]').click();
  const submitResponse = await submitted;
  expect(submitResponse.status(), await submitResponse.text()).toBe(201);
  await expect(page.locator('#workflowRequestDetail')).toContainText('Pending');
  await expect(page.locator('#workflowRequestDetail')).toContainText('Playwright Approval');
  await expect(page.locator('#workflowRequestDetail')).toContainText('request-evidence.txt');
  const requestKey = (await page.locator('#workflowRequestDetail h2').textContent()).trim();
  expect(requestKey).toMatch(/-000001$/);
  const [fixtureInstances] = await pool.execute('SELECT id FROM crm_workflow_instances WHERE request_key = ? LIMIT 1', [requestKey]);
  instanceId = fixtureInstances[0].id;
  const fixtureEvents = (await workflowRepository.listPendingEvents(200)).filter((event) => Number(event.instanceId) === Number(instanceId));
  for (const event of fixtureEvents) await workflowDispatcher.dispatchEvent(event);
  const notificationsLoaded = page.waitForResponse((response) => response.url().includes('/api/notifications?') && response.ok());
  await page.locator('#notificationBell').click();
  await notificationsLoaded;
  await expect(page.locator('#notificationList')).toContainText(requestKey);
  await page.locator('#notificationBell').click();

  const monitoringLoaded = page.waitForResponse((response) => response.url().includes('/api/workflows/monitoring?') && response.ok());
  await page.getByRole('button', { name: 'Workflow Monitoring' }).click();
  await monitoringLoaded;
  await expect(page.locator('#workflowMonitoringRows')).toContainText(requestKey);
  await expect(page.locator('#workflowMonitoringRows')).toContainText('Playwright Approval');
  const historyLoaded = page.waitForResponse((response) => response.url().includes('/api/workflows/monitoring?') && response.url().includes('limit=500') && response.ok());
  await page.getByRole('tab', { name: 'History & reports' }).click();
  await historyLoaded;
  await page.locator('#workflowReportSearch').fill(requestKey);
  await expect(page.locator('#workflowReportRows')).toContainText(requestKey);
  const historyDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  expect((await historyDownload).suggestedFilename()).toMatch(/^workflow-history-\d{4}-\d{2}-\d{2}\.csv$/);
  await page.locator('#workflowReportRows').getByRole('button', { name: 'View timeline' }).click();
  await expect(page.locator('#workflowRequestDetail')).toContainText('Decision history');
  await page.getByRole('button', { name: 'Workflow Monitoring' }).click();
  await page.getByRole('tab', { name: 'Live monitoring' }).click();
  await expect(page.locator('#workflowMonitoringRows')).toContainText(requestKey);
  const reminded = page.waitForResponse((response) => response.url().endsWith(`/api/workflows/requests/${requestKey}/remind`) && response.request().method() === 'POST');
  await page.locator(`[data-monitoring-remind="${requestKey}"]`).click();
  expect((await reminded).status()).toBe(200);
  await page.locator(`[data-monitoring-reassign="${requestKey}"]`).click();
  await page.locator('#workflowReassignForm select[name="replacementUserId"]').selectOption(String(backupId));
  await page.locator('#workflowReassignForm textarea[name="reason"]').fill('Approver unavailable for this request');
  const reassigned = page.waitForResponse((response) => /\/api\/workflows\/assignments\/\d+\/reassign$/.test(response.url()) && response.request().method() === 'POST');
  await page.locator('#workflowReassignForm button[type="submit"]').click();
  const reassignResponse = await reassigned;
  expect(reassignResponse.status(), await reassignResponse.text()).toBe(200);

  await page.getByRole('button', { name: 'Sign out' }).click();
  await login(page, backupEmail, approverPassword);
  await page.getByRole('button', { name: 'Approval Requests' }).click();
  await page.getByRole('button', { name: 'Awaiting my approval' }).click();
  await page.getByRole('button', { name: new RegExp(requestKey) }).click();
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await page.locator('#workflowDecisionAttachments input[type="file"]').setInputFiles({ name: 'approval-evidence.txt', mimeType: 'text/plain', buffer: Buffer.from('approval evidence') });
  await page.locator('#workflowDecisionForm button[type="submit"]').click();
  await expect(page.locator('#workflowRequestDetail')).toContainText('Approved');
  await expect(page.locator('#workflowRequestDetail')).toContainText('approval-evidence.txt');
  await expect(page.locator('#workflowRequestDetail')).toContainText('Decision history');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /request-evidence\.txt/ }).click();
  expect((await download).suggestedFilename()).toBe('request-evidence.txt');
});
