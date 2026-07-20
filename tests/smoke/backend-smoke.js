const http = require('http');
const assert = require('assert/strict');
const XLSX = require('xlsx');

const { createApp } = require('../../src/app');
const { pool } = require('../../src/database/pool');
const { config } = require('../../src/shared/config');

const runId = `smoke_${Date.now()}`;
const smokeAdminEmail = process.env.SMOKE_ADMIN_EMAIL || config.admin.email;
const smokeAdminPassword = process.env.SMOKE_ADMIN_PASSWORD || config.admin.password;
const createdCustomerIds = [];
const createdRecordIds = [];
let createdModuleKey = '';
let createdUserEmail = '';
let baseUrl = '';
let token = '';
let server;

function log(message) {
  process.stdout.write(`${message}\n`);
}

function expectStatus(response, expected, label) {
  const allowed = Array.isArray(expected) ? expected : [expected];
  assert.ok(
    allowed.includes(response.status),
    `${label} expected HTTP ${allowed.join(' or ')}, got ${response.status}: ${JSON.stringify(response.body)}`
  );
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const buffer = Buffer.from(await response.arrayBuffer());
  if (contentType.includes('application/json')) {
    return { body: JSON.parse(buffer.toString('utf8') || '{}'), buffer, contentType };
  }
  return { body: buffer.toString('utf8'), buffer, contentType };
}

async function request(method, path, options = {}) {
  const headers = { ...(options.headers || {}) };
  let body = options.body;

  if (token && options.auth !== false) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.json);
  }

  const response = await fetch(`${baseUrl}${path}`, { method, headers, body });
  const parsed = await parseResponse(response);
  return {
    status: response.status,
    headers: response.headers,
    ...parsed
  };
}

function findField(config, fieldKey) {
  const field = config.fields.find((item) => item.fieldKey === fieldKey);
  assert.ok(field, `Expected field ${fieldKey} to exist`);
  return field;
}

function workbookBuffer(rows, sheetName) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), sheetName);
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

async function uploadWorkbook(path, buffer, filename) {
  const form = new FormData();
  form.append(
    'file',
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    filename
  );
  return request('POST', path, { body: form });
}

async function smoke(label, fn) {
  log(`- ${label}`);
  await fn();
}

async function cleanup() {
  if (!baseUrl) return;

  try {
    if (createdRecordIds.length && createdModuleKey) {
      await request('DELETE', `/api/modules/${createdModuleKey}/records`, {
        json: { ids: createdRecordIds }
      });
    }
  } catch (_error) {
    // Cleanup is best-effort; the primary failure has more useful context.
  }

  try {
    if (createdModuleKey) {
      await request('DELETE', `/api/sysadmin/modules/${createdModuleKey}`);
    }
  } catch (_error) {
    // Best-effort.
  }

  try {
    if (createdCustomerIds.length) {
      await request('DELETE', '/api/customers', { json: { ids: createdCustomerIds } });
    }
  } catch (_error) {
    // Best-effort.
  }

  try {
    if (createdUserEmail) {
      await pool.execute('DELETE FROM users WHERE email = ?', [createdUserEmail]);
    }
  } catch (_error) {
    // Best-effort.
  }
}

async function main() {
  server = http.createServer(createApp());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;

  await smoke('health endpoint', async () => {
    const response = await request('GET', '/api/health', { auth: false });
    expectStatus(response, 200, 'health');
    assert.equal(response.body.ok, true);
  });

  await smoke('Phase 1 admin portal/auth smoke', async () => {
    const login = await request('POST', '/api/auth/login', {
      auth: false,
      json: {
        email: smokeAdminEmail,
        password: smokeAdminPassword
      }
    });
    if (login.status === 401) {
      throw new Error(
        `Smoke admin login failed for ${smokeAdminEmail}. Run npm.cmd run db:seed with the same ADMIN_EMAIL/ADMIN_PASSWORD, or set SMOKE_ADMIN_EMAIL and SMOKE_ADMIN_PASSWORD for this test.`
      );
    }
    expectStatus(login, 200, 'login');
    assert.ok(login.body.token, 'Login should return a token');
    token = login.body.token;

    const me = await request('GET', '/api/auth/me');
    expectStatus(me, 200, 'auth me');
    assert.equal(me.body.user.role, 'admin');

    const modules = await request('GET', '/api/sysadmin/modules');
    expectStatus(modules, 200, 'admin modules');
    assert.ok(modules.body.modules.some((entry) => entry.module.moduleKey === 'customers'));
    assert.ok(modules.body.modules.some((entry) => entry.module.moduleKey === 'users'));
  });

  let countries = [];
  await smoke('core reference data smoke', async () => {
    const response = await request('GET', '/api/countries');
    expectStatus(response, 200, 'countries');
    countries = response.body.countries;
    assert.ok(countries.length > 0, 'Expected seeded countries');
  });

  await smoke('customer CRUD, import template, import, and export smoke', async () => {
    const country = countries.find((item) => item.name === 'Malaysia') || countries[0];
    const create = await request('POST', '/api/customers', {
      json: {
        companyName: `${runId} Customer`,
        contactPerson: 'Smoke Tester',
        email: `${runId}@example.com`,
        countryId: country.id,
        phoneNumber: '0123456789',
        status: 'lead',
        notes: 'Created by backend smoke test'
      }
    });
    expectStatus(create, 201, 'create customer');
    createdCustomerIds.push(create.body.customer.id);

    const update = await request('PUT', `/api/customers/${create.body.customer.id}`, {
      json: {
        companyName: `${runId} Customer Updated`,
        contactPerson: 'Smoke Tester',
        email: `${runId}@example.com`,
        countryId: country.id,
        phoneNumber: '0123456789',
        status: 'active',
        notes: 'Updated by backend smoke test'
      }
    });
    expectStatus(update, 200, 'update customer');
    assert.equal(update.body.customer.status, 'active');

    const search = await request('GET', `/api/customers?search=${encodeURIComponent(runId)}`);
    expectStatus(search, 200, 'search customers');
    assert.ok(search.body.customers.some((customer) => customer.id === create.body.customer.id));

    const template = await request('GET', '/api/imports/customers/template');
    expectStatus(template, 200, 'customer import template');
    assert.ok(template.buffer.length > 1000, 'Template should be a non-empty workbook');

    const importBuffer = workbookBuffer([{
      'Company Name': `${runId} Imported Customer`,
      'Contact Person': 'Import Tester',
      Email: `${runId}.import@example.com`,
      Country: country.name,
      'Contact Number': '0111111111',
      Status: 'lead',
      Notes: 'Imported by backend smoke test'
    }], 'Customers');
    const imported = await uploadWorkbook('/api/imports/customers', importBuffer, 'customers.xlsx');
    expectStatus(imported, 201, 'import customers');
    assert.equal(imported.body.createdCount, 1);
    createdCustomerIds.push(imported.body.created[0].id);

    const exported = await request('GET', '/api/imports/customers/export');
    expectStatus(exported, 200, 'customer export');
    assert.ok(exported.buffer.length > 1000, 'Export should be a non-empty workbook');
  });

  await smoke('users backend smoke', async () => {
    createdUserEmail = `${runId}.user@example.com`;
    const create = await request('POST', '/api/users', {
      json: {
        name: 'Smoke User',
        email: createdUserEmail,
        password: 'SmokePass123!',
        role: 'user',
        status: 'active'
      }
    });
    expectStatus(create, 201, 'create user');
    assert.ok(create.body.user.id);

    const list = await request('GET', `/api/users?search=${encodeURIComponent(createdUserEmail)}`);
    expectStatus(list, 200, 'list users');
    const createdUser = list.body.users.find((user) => user.email === createdUserEmail);
    assert.ok(createdUser);
    assert.match(createdUser.staff_id, /^STF-[A-Z0-9]+-[A-Z0-9]{4}$/);

    const update = await request('PATCH', `/api/users/${create.body.user.id}`, {
      json: { status: 'inactive' }
    });
    expectStatus(update, 204, 'update user');
  });

  await smoke('Phase 2 module builder smoke', async () => {
    createdModuleKey = runId;
    const create = await request('POST', '/api/sysadmin/modules', {
      json: {
        name: 'Smoke Module',
        moduleKey: createdModuleKey,
        description: 'Temporary module created by backend smoke test',
        status: 'draft',
        showInMenu: false
      }
    });
    expectStatus(create, 201, 'create custom module');
    assert.equal(create.body.module.moduleKey, createdModuleKey);

    const publish = await request('PATCH', `/api/sysadmin/modules/${createdModuleKey}`, {
      json: {
        name: 'Smoke Module',
        status: 'published',
        showInMenu: true
      }
    });
    expectStatus(publish, 200, 'publish custom module');
    assert.equal(publish.body.module.status, 'published');
    assert.equal(publish.body.module.showInMenu, true);
  });

  let detailTableName = '';
  await smoke('Phase 3 form builder, formulas, layouts, and browser buttons smoke', async () => {
    let configResponse = await request('POST', `/api/sysadmin/modules/${createdModuleKey}/fields`, {
      json: {
        label: 'Title',
        type: 'textbox',
        required: true,
        showInImport: true,
        showInExport: true,
        searchable: true
      }
    });
    expectStatus(configResponse, 201, 'create title field');

    configResponse = await request('POST', `/api/sysadmin/modules/${createdModuleKey}/fields`, {
      json: {
        label: 'Amount',
        type: 'decimals',
        showInImport: true,
        showInExport: true
      }
    });
    expectStatus(configResponse, 201, 'create amount field');

    configResponse = await request('POST', `/api/sysadmin/modules/${createdModuleKey}/fields`, {
      json: {
        label: 'Amount Double',
        type: 'decimals',
        formulaExpression: '{amount} * 2',
        formulaEnabled: true,
        showInExport: true,
        disableManualInput: true
      }
    });
    expectStatus(configResponse, 201, 'create formula field');

    configResponse = await request('POST', `/api/sysadmin/modules/${createdModuleKey}/fields`, {
      json: {
        label: 'Line Note',
        type: 'textbox',
        tableType: 'detail',
        showInImport: true,
        showInExport: true
      }
    });
    expectStatus(configResponse, 201, 'create detail field');
    detailTableName = findField(configResponse.body, 'lineNote').detailTableName;
    assert.ok(detailTableName, 'Detail field should create a detail table');

    const layout = {
      order: ['title', 'amount', 'amountDouble', 'lineNote'],
      hidden: [],
      fieldSpans: { title: 2 },
      sections: [{ id: 'main', title: 'Main', columns: 2, fieldKeys: ['title', 'amount', 'amountDouble'] }]
    };
    const draft = await request('PUT', `/api/sysadmin/modules/${createdModuleKey}/form-layouts/draft/add`, { json: layout });
    expectStatus(draft, 200, 'save draft layout');
    const published = await request('POST', `/api/sysadmin/modules/${createdModuleKey}/form-layouts/publish/add`, { json: layout });
    expectStatus(published, 200, 'publish layout');

    const browsers = await request('GET', '/api/browser-buttons');
    expectStatus(browsers, 200, 'browser buttons list');
    assert.ok(browsers.body.browserButtons.some((browser) => browser.browserKey === 'countries'));

    const countrySearch = await request('GET', '/api/browser-buttons/countries/search?q=Malaysia');
    expectStatus(countrySearch, 200, 'browser button search');
    assert.ok(countrySearch.body.rows.length > 0);
  });

  await smoke('Phase 6 permissions smoke', async () => {
    const permissions = {
      view: { roles: ['admin'], users: [] },
      create: { roles: ['admin'], users: [] },
      edit: { roles: ['admin'], users: [] },
      delete: { roles: ['admin'], users: [] },
      import: { roles: ['admin'], users: [] },
      export: { roles: ['admin'], users: [] },
      configure: { roles: ['admin'], users: [] }
    };
    const saveModulePermissions = await request('PUT', `/api/sysadmin/modules/${createdModuleKey}/permissions`, {
      json: { permissions }
    });
    expectStatus(saveModulePermissions, 200, 'save module permissions');

    const fieldPermissions = await request('GET', `/api/sysadmin/modules/${createdModuleKey}/field-permissions`);
    expectStatus(fieldPermissions, 200, 'field permissions');
    const fields = fieldPermissions.body.fields.map((field) => ({
      fieldKey: field.fieldKey,
      permissions: {
        view: { roles: ['admin'], users: [] },
        create: { roles: ['admin'], users: [] },
        edit: { roles: ['admin'], users: [] },
        import: { roles: ['admin'], users: [] },
        export: { roles: ['admin'], users: [] }
      }
    }));
    const saveFieldPermissions = await request('PUT', `/api/sysadmin/modules/${createdModuleKey}/field-permissions`, {
      json: { fields }
    });
    expectStatus(saveFieldPermissions, 200, 'save field permissions');
  });

  await smoke('Phase 4 generated module page, record CRUD, filters, detail rows, and import/export smoke', async () => {
    const menu = await request('GET', '/api/modules');
    expectStatus(menu, 200, 'menu modules');
    assert.ok(menu.body.modules.some((entry) => entry.module.moduleKey === createdModuleKey));

    const configResponse = await request('GET', `/api/modules/${createdModuleKey}/config`);
    expectStatus(configResponse, 200, 'generated module config');
    assert.ok(configResponse.body.permissions.create);

    const create = await request('POST', `/api/modules/${createdModuleKey}/records`, {
      json: {
        title: `${runId} Record`,
        amount: 12.5,
        __detailTables: {
          [detailTableName]: [{ lineNote: 'Detail row smoke' }]
        }
      }
    });
    expectStatus(create, 201, 'create module record');
    const recordId = create.body.record.id;
    createdRecordIds.push(recordId);
    assert.equal(create.body.record.customFields.amountDouble, 25);
    assert.equal(create.body.record.detailTables[detailTableName][0].lineNote, 'Detail row smoke');

    const detail = await request('GET', `/api/modules/${createdModuleKey}/records/${recordId}`);
    expectStatus(detail, 200, 'get module record detail');
    assert.equal(detail.body.record.id, recordId);

    const update = await request('PUT', `/api/modules/${createdModuleKey}/records/${recordId}`, {
      json: {
        title: `${runId} Record Updated`,
        amount: 20,
        __detailTables: {
          [detailTableName]: [{ lineNote: 'Updated detail row smoke' }]
        }
      }
    });
    expectStatus(update, 200, 'update module record');
    assert.equal(update.body.record.customFields.amountDouble, 40);

    const search = await request('GET', `/api/modules/${createdModuleKey}/records?search=${encodeURIComponent(runId)}`);
    expectStatus(search, 200, 'generated module quick search');
    assert.ok(search.body.records.some((record) => record.id === recordId));

    const filter = await request('GET', `/api/modules/${createdModuleKey}/records?filterField=title&filterOperator=contains&filterValue=${encodeURIComponent('Updated')}`);
    expectStatus(filter, 200, 'generated module advanced filter');
    assert.ok(filter.body.records.some((record) => record.id === recordId));

    const template = await request('GET', `/api/imports/modules/${createdModuleKey}/template`);
    expectStatus(template, 200, 'module import template');
    assert.ok(template.buffer.length > 1000, 'Module template should be a non-empty workbook');

    const importWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(importWorkbook, XLSX.utils.json_to_sheet([{
      'Record Ref': 'REC-1',
      Title: `${runId} Imported Record`,
      Amount: 7.5
    }]), 'Smoke Module');
    XLSX.utils.book_append_sheet(importWorkbook, XLSX.utils.json_to_sheet([{
      'Record Ref': 'REC-1',
      'Line Note': 'Imported detail row smoke'
    }]), detailTableName.slice(0, 31));
    const importBuffer = XLSX.write(importWorkbook, { type: 'buffer', bookType: 'xlsx' });
    const imported = await uploadWorkbook(`/api/imports/modules/${createdModuleKey}`, importBuffer, 'module.xlsx');
    expectStatus(imported, 201, 'module import');
    assert.equal(imported.body.createdCount, 1);
    createdRecordIds.push(imported.body.created[0].id);

    const exported = await request('GET', `/api/imports/modules/${createdModuleKey}/export`);
    expectStatus(exported, 200, 'module export');
    assert.ok(exported.buffer.length > 1000, 'Module export should be a non-empty workbook');
  });

  await smoke('Phase 5 action flow management and REST connector smoke', async () => {
    const restCalls = [];
    const restServer = http.createServer(async (req, res) => {
      let body = '';
      req.setEncoding('utf8');
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        const parsed = body ? JSON.parse(body) : {};
        restCalls.push({ method: req.method, url: req.url, body: parsed });
        if (req.url === '/fail') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: { message: `Rejected ${parsed.title || 'record'}` } }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, echoedTitle: parsed.title || '', mappedAmount: 321 }));
      });
    });
    await new Promise((resolve) => restServer.listen(0, '127.0.0.1', resolve));
    const restBaseUrl = `http://127.0.0.1:${restServer.address().port}`;

    const connectorKey = `${runId}_connector`;
    const connector = await request('POST', '/api/action-flows/connectors', {
      json: {
        connectorKey,
        name: 'Smoke REST Connector',
        baseUrl: restBaseUrl,
        authType: 'none',
        authConfig: { runtime: { allowPrivateNetwork: true } },
        endpoints: [
          { key: 'extract', method: 'POST', path: '/extract' },
          { key: 'fail', method: 'POST', path: '/fail' }
        ],
        enabled: true
      }
    });
    try {
      expectStatus(connector, 201, 'save API connector');
      assert.equal(connector.body.connector.connectorKey, connectorKey);

      const flowKey = `${runId}_flow`;
      const createFlow = await request('POST', '/api/action-flows', {
        json: {
          flowKey,
          name: 'Smoke Action Flow',
          status: 'draft',
          triggerType: 'record_created',
          triggerModule: createdModuleKey,
          definition: {
            nodes: [
              { id: 'trigger_1', category: 'trigger', type: 'record_created', label: 'When Created', config: { moduleKey: createdModuleKey } },
              { id: 'api_1', category: 'restful_api', type: 'call_rest_api', label: 'Call REST API', config: { connectorKey, method: 'POST', endpointKey: 'extract', endpointPath: '/extract' } },
              { id: 'delete_1', category: 'record', type: 'delete_record', label: 'Delete Record', config: { target: 'current_record', confirmDelete: true } }
            ],
            edges: [{ from: 'trigger_1', to: 'api_1' }, { from: 'api_1', to: 'delete_1' }]
          }
        }
      });
      expectStatus(createFlow, 201, 'create action flow');
      assert.equal(createFlow.body.flow.flowKey, flowKey);

      const check = await request('POST', `/api/action-flows/${flowKey}/check`);
      expectStatus(check, 200, 'check action flow');
      assert.equal(check.body.check.valid, true);

      const list = await request('GET', `/api/action-flows?search=${encodeURIComponent(flowKey)}`);
      expectStatus(list, 200, 'list action flows');
      assert.ok(list.body.flows.some((flow) => flow.flowKey === flowKey));

      const runtimeFlowKey = `${runId}_runtime_flow`;
      const runtimeFlow = await request('POST', '/api/action-flows', {
        json: {
          flowKey: runtimeFlowKey,
          name: 'Smoke Runtime Flow',
          status: 'enabled',
          triggerType: 'record_created',
          triggerModule: createdModuleKey,
          definition: {
            nodes: [
              { id: 'trigger_1', category: 'trigger', type: 'record_created', label: 'When Created', config: { moduleKey: createdModuleKey } },
              { id: 'update_1', category: 'record', type: 'update_record', label: 'Update Record', config: { target: 'current_record', targetModule: createdModuleKey, fieldMappingText: 'amountDouble = 99' } },
              { id: 'end_1', category: 'end', type: 'end', label: 'End', config: {} }
            ],
            edges: [{ from: 'trigger_1', to: 'update_1' }, { from: 'update_1', to: 'end_1' }]
          }
        }
      });
      expectStatus(runtimeFlow, 201, 'create enabled runtime action flow');

      const restRuntimeFlowKey = `${runId}_rest_runtime_flow`;
      const restRuntimeFlow = await request('POST', '/api/action-flows', {
        json: {
          flowKey: restRuntimeFlowKey,
          name: 'Smoke REST Runtime Flow',
          status: 'enabled',
          triggerType: 'record_created',
          triggerModule: createdModuleKey,
          definition: {
            nodes: [
              { id: 'trigger_1', category: 'trigger', type: 'record_created', label: 'When Created', config: { moduleKey: createdModuleKey } },
              { id: 'api_1', category: 'restful_api', type: 'call_rest_api', label: 'Call REST API', config: { connectorKey, method: 'POST', endpointKey: 'extract', requestMapping: 'title = Current Record.title', responseMapping: 'amountDouble = response.mappedAmount', allowPrivateNetwork: true } },
              { id: 'end_1', category: 'end', type: 'end', label: 'End', config: {} }
            ],
            edges: [{ from: 'trigger_1', to: 'api_1' }, { from: 'api_1', to: 'end_1' }]
          }
        }
      });
      expectStatus(restRuntimeFlow, 201, 'create enabled REST runtime action flow');

      const restErrorFlowKey = `${runId}_rest_error_flow`;
      const restErrorFlow = await request('POST', '/api/action-flows', {
        json: {
          flowKey: restErrorFlowKey,
          name: 'Smoke REST Error Mapping Flow',
          status: 'enabled',
          triggerType: 'record_created',
          triggerModule: createdModuleKey,
          definition: {
            nodes: [
              { id: 'trigger_1', category: 'trigger', type: 'record_created', label: 'When Created', config: { moduleKey: createdModuleKey } },
              { id: 'api_1', category: 'restful_api', type: 'call_rest_api', label: 'Call Failing REST API', config: { connectorKey, method: 'POST', endpointKey: 'fail', requestMapping: 'title = Current Record.title', errorMapping: 'apiError = response.error.message', allowPrivateNetwork: true } },
              { id: 'end_1', category: 'end', type: 'end', label: 'End', config: {} }
            ],
            edges: [{ from: 'trigger_1', to: 'api_1' }, { from: 'api_1', to: 'end_1' }]
          }
        }
      });
      expectStatus(restErrorFlow, 201, 'create enabled REST error mapping flow');

      const runtimeRecord = await request('POST', `/api/modules/${createdModuleKey}/records`, {
        json: {
          title: `${runId} Runtime Record`,
          amount: 1
        }
      });
      expectStatus(runtimeRecord, 201, 'create generated module record with runtime flow');
      const runtimeRecordId = runtimeRecord.body.record.id;
      createdRecordIds.push(runtimeRecordId);

      const runtimeDetail = await request('GET', `/api/modules/${createdModuleKey}/records/${runtimeRecordId}`);
      expectStatus(runtimeDetail, 200, 'get runtime-mutated generated module record');
      assert.equal(runtimeDetail.body.record.customFields.amountDouble, 321);
      assert.equal(restCalls.length, 2);
      assert.equal(restCalls[0].method, 'POST');
      assert.equal(restCalls[0].url, '/extract');
      assert.equal(restCalls[0].body.title, `${runId} Runtime Record`);
      assert.equal(restCalls[1].url, '/fail');

      const executions = await request('GET', `/api/action-flows/executions?flowKey=${encodeURIComponent(runtimeFlowKey)}`);
      expectStatus(executions, 200, 'list action flow executions');
      assert.ok(executions.body.executions.some((execution) => execution.status === 'success'));

      const restExecutions = await request('GET', `/api/action-flows/executions?flowKey=${encodeURIComponent(restRuntimeFlowKey)}`);
      expectStatus(restExecutions, 200, 'list REST action flow executions');
      const restExecution = restExecutions.body.executions.find((execution) => execution.status === 'success');
      assert.ok(restExecution, 'REST runtime flow should record a successful execution');
      const restStep = restExecution.result.steps.find((step) => step.type === 'call_rest_api');
      assert.equal(restStep.httpStatus, 200);
      assert.equal(restStep.responseBody.echoedTitle, `${runId} Runtime Record`);
      assert.equal(restStep.mappedValues.amountDouble, 321);
      assert.deepEqual(restStep.mappedRecordFields, ['amountDouble']);

      const restErrorExecutions = await request('GET', `/api/action-flows/executions?flowKey=${encodeURIComponent(restErrorFlowKey)}`);
      expectStatus(restErrorExecutions, 200, 'list REST error mapping flow executions');
      const restErrorExecution = restErrorExecutions.body.executions.find((execution) => execution.status === 'failed');
      assert.ok(restErrorExecution, 'REST error mapping flow should record a failed execution');
      const restErrorStep = restErrorExecution.result.steps.find((step) => step.type === 'call_rest_api');
      assert.equal(restErrorStep.httpStatus, 400);
      assert.equal(restErrorStep.mappedValues.apiError, `Rejected ${runId} Runtime Record`);

      const deleteFlow = await request('DELETE', `/api/action-flows/${flowKey}`);
      expectStatus(deleteFlow, 200, 'delete action flow');
      const deleteRuntimeFlow = await request('DELETE', `/api/action-flows/${runtimeFlowKey}`);
      expectStatus(deleteRuntimeFlow, 200, 'delete runtime action flow');
      const deleteRestRuntimeFlow = await request('DELETE', `/api/action-flows/${restRuntimeFlowKey}`);
      expectStatus(deleteRestRuntimeFlow, 200, 'delete REST runtime action flow');
      const deleteRestErrorFlow = await request('DELETE', `/api/action-flows/${restErrorFlowKey}`);
      expectStatus(deleteRestErrorFlow, 200, 'delete REST error mapping flow');
      const deleteConnector = await request('DELETE', `/api/action-flows/connectors/${connectorKey}`);
      expectStatus(deleteConnector, 200, 'delete API connector');
    } finally {
      await new Promise((resolve) => restServer.close(resolve));
    }
  });

  await smoke('planned Phase 7/8/9 route absence smoke', async () => {
    const plannedRoutes = [
      ['/api/dashboards', 'Phase 7 Dashboard Builder'],
      ['/api/workflows', 'Phase 8 Workflow Module'],
      ['/api/ai/assistant', 'Phase 9 AI Agent Assistant']
    ];
    for (const [path, label] of plannedRoutes) {
      const response = await request('GET', path);
      expectStatus(response, 404, label);
    }
  });

  log('\nBackend smoke suite passed.');
}

main()
  .catch((error) => {
    console.error('\nBackend smoke suite failed.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await pool.end();
  });
