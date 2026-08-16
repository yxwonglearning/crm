const http = require('http');
const assert = require('assert/strict');

const { createApp } = require('../../src/app');
const { pool, dashboardPool } = require('../../src/database/pool');
const { config } = require('../../src/shared/config');

const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const workflowKey = `smoke_api_${suffix}`;
const cloneKey = `smoke_api_clone_${suffix}`;
let baseUrl = '';
let token = '';
let server;

async function request(method, path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (token && options.auth !== false) headers.Authorization = `Bearer ${token}`;
  const init = { method, headers };
  if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(options.json);
  }
  const response = await fetch(`${baseUrl}${path}`, init);
  const body = response.headers.get('content-type')?.includes('application/json') ? await response.json() : await response.text();
  return { status: response.status, body };
}

function expectStatus(response, expected, label) {
  assert.equal(
    response.status,
    expected,
    `${label} expected HTTP ${expected}, got ${response.status}: ${JSON.stringify(response.body)}`
  );
}

async function deleteDefinition(key) {
  const [definitions] = await pool.execute(
    'SELECT id FROM crm_workflow_definitions WHERE workflow_key = ? LIMIT 1',
    [key]
  );
  if (!definitions[0]) return;
  const workflowId = definitions[0].id;
  const [versions] = await pool.execute(
    'SELECT id FROM crm_workflow_versions WHERE workflow_id = ?',
    [workflowId]
  );
  const versionIds = versions.map((version) => version.id);
  if (versionIds.length) {
    await pool.query(
      `DELETE rules FROM crm_workflow_version_approver_rules rules
       INNER JOIN crm_workflow_version_stages stages ON stages.id = rules.version_stage_id
       WHERE stages.workflow_version_id IN (?)`,
      [versionIds]
    );
    await pool.query(
      'DELETE FROM crm_workflow_version_stages WHERE workflow_version_id IN (?)',
      [versionIds]
    );
  }
  await pool.execute(
    'UPDATE crm_workflow_definitions SET published_version_id = NULL WHERE id = ?',
    [workflowId]
  );
  await pool.execute('DELETE FROM crm_workflow_versions WHERE workflow_id = ?', [workflowId]);
  await pool.execute('DELETE FROM crm_workflow_definitions WHERE id = ?', [workflowId]);
}

async function main() {
  server = http.createServer(createApp());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const unauthenticated = await request('GET', '/api/workflows/definitions', { auth: false });
    expectStatus(unauthenticated, 401, 'unauthenticated workflow definitions');

    const login = await request('POST', '/api/auth/login', {
      auth: false,
      json: {
        email: process.env.SMOKE_ADMIN_EMAIL || config.admin.email,
        password: process.env.SMOKE_ADMIN_PASSWORD || config.admin.password
      }
    });
    expectStatus(login, 200, 'admin login');
    token = login.body.token;

    const catalog = await request('GET', '/api/workflows/catalog');
    expectStatus(catalog, 200, 'published workflow catalog');
    assert.ok(Array.isArray(catalog.body.definitions));

    const list = await request('GET', '/api/workflows/definitions');
    expectStatus(list, 200, 'list workflow definitions');
    assert.ok(Array.isArray(list.body.definitions));

    const created = await request('POST', '/api/workflows/definitions', {
      json: {
        workflowKey,
        name: 'Workflow API smoke',
        description: 'Invalid draft used to exercise the HTTP contract.',
        sourceModuleKey: 'customers',
        config: { trigger: { type: 'manual_submit' }, stages: [] }
      }
    });
    expectStatus(created, 201, 'create workflow definition');
    assert.equal(created.body.definition.workflowKey, workflowKey);
    assert.equal(created.body.check.valid, false);

    const detail = await request('GET', `/api/workflows/definitions/${workflowKey}`);
    expectStatus(detail, 200, 'get workflow definition');

    const updated = await request('PUT', `/api/workflows/definitions/${workflowKey}`, {
      json: { description: 'Updated through the authenticated HTTP API.' }
    });
    expectStatus(updated, 200, 'update workflow definition');

    const checked = await request('POST', `/api/workflows/definitions/${workflowKey}/check`, {
      json: {}
    });
    expectStatus(checked, 200, 'check workflow definition');
    assert.equal(checked.body.check.valid, false);

    const checkpoint = await request('POST', `/api/workflows/definitions/${workflowKey}/checkpoints`, {
      json: { summary: 'API smoke checkpoint' }
    });
    expectStatus(checkpoint, 201, 'checkpoint workflow definition');
    const versionId = checkpoint.body.version.id;

    const versions = await request('GET', `/api/workflows/definitions/${workflowKey}/versions`);
    expectStatus(versions, 200, 'list workflow versions');
    assert.equal(versions.body.versions.length, 1);

    const version = await request('GET', `/api/workflows/definitions/${workflowKey}/versions/${versionId}`);
    expectStatus(version, 200, 'get workflow version');

    const publish = await request('POST', `/api/workflows/definitions/${workflowKey}/publish`, {
      json: { summary: 'Must not publish an invalid workflow' }
    });
    expectStatus(publish, 422, 'reject invalid workflow publication');

    const cloned = await request('POST', `/api/workflows/definitions/${workflowKey}/clone`, {
      json: { workflowKey: cloneKey, name: 'Workflow API smoke clone' }
    });
    expectStatus(cloned, 201, 'clone workflow definition');

    const archived = await request('POST', `/api/workflows/definitions/${cloneKey}/archive`, {
      json: {}
    });
    expectStatus(archived, 200, 'archive workflow definition');
    assert.equal(archived.body.definition.status, 'archived');

    const inbox = await request('GET', '/api/workflows/inbox');
    expectStatus(inbox, 200, 'workflow inbox');
    assert.ok(Array.isArray(inbox.body.assignments));

    const requests = await request('GET', '/api/workflows/requests');
    expectStatus(requests, 200, 'workflow request list');
    assert.ok(Array.isArray(requests.body.requests));

    const monitoring = await request('GET', '/api/workflows/monitoring');
    expectStatus(monitoring, 200, 'workflow monitoring');
    assert.ok(Array.isArray(monitoring.body.items));
    assert.equal(typeof monitoring.body.summary.overdue, 'number');

    const historyExport = await request('GET', '/api/workflows/monitoring/export.csv?status=all');
    expectStatus(historyExport, 200, 'workflow history CSV export');

    const notificationCentre = await request('GET', '/api/notifications');
    expectStatus(notificationCentre, 200, 'notification centre');
    assert.equal(typeof notificationCentre.body.unreadCount, 'number');
    const emailSettings = await request('GET', '/api/notifications/email-settings/current');
    expectStatus(emailSettings, 200, 'admin email settings');
    assert.equal(typeof emailSettings.body.emailSettings.enabled, 'boolean');

    const slaRun = await request('POST', '/api/workflows/monitoring/run', { json: {} });
    expectStatus(slaRun, 200, 'workflow SLA worker run');
    assert.equal(typeof slaRun.body.scanned, 'number');

    const noIdempotency = await request('POST', '/api/workflows/requests', {
      json: { sourceModuleKey: 'customers', sourceRecordId: 1 }
    });
    expectStatus(noIdempotency, 400, 'workflow submission idempotency requirement');
    assert.equal(noIdempotency.body.details?.code, 'WORKFLOW_CONFLICT_IDEMPOTENCY_REQUIRED');

    process.stdout.write('Workflow HTTP API smoke passed.\n');
  } finally {
    await deleteDefinition(cloneKey);
    await deleteDefinition(workflowKey);
    if (server) await new Promise((resolve) => server.close(resolve));
    await pool.end();
    await dashboardPool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
