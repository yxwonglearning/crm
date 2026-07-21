const http = require('http');
const assert = require('assert/strict');
const XLSX = require('xlsx');

const { createApp } = require('../../src/app');
const { pool } = require('../../src/database/pool');
const { config } = require('../../src/shared/config');
const actionFlowRuntime = require('../../src/modules/action-flows/action-flows.runtime');

const runId = `smoke_${Date.now()}`;
const smokeAdminEmail = process.env.SMOKE_ADMIN_EMAIL || config.admin.email;
const smokeAdminPassword = process.env.SMOKE_ADMIN_PASSWORD || config.admin.password;
const createdCustomerIds = [];
const createdRecordIds = [];
const createdTaskIds = [];
const createdNotificationIds = [];
let createdModuleKey = '';
const creationModeModuleKeys = [];
let createdUserEmail = '';
let createdUserId = 0;
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

  for (const moduleKey of creationModeModuleKeys) {
    try {
      await request('DELETE', `/api/sysadmin/modules/${moduleKey}`);
    } catch (_error) {
      // Best-effort.
    }
  }

  try {
    if (createdCustomerIds.length) {
      await request('DELETE', '/api/customers', { json: { ids: createdCustomerIds } });
    }
  } catch (_error) {
    // Best-effort.
  }

  try {
    if (createdTaskIds.length) await pool.query('DELETE FROM crm_tasks WHERE id IN (?)', [createdTaskIds]);
    if (createdNotificationIds.length) await pool.query('DELETE FROM crm_notifications WHERE id IN (?)', [createdNotificationIds]);
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
    createdUserId = create.body.user.id;

    const list = await request('GET', `/api/users?search=${encodeURIComponent(createdUserEmail)}`);
    expectStatus(list, 200, 'list users');
    const createdUser = list.body.users.find((user) => user.email === createdUserEmail);
    assert.ok(createdUser);
    assert.match(createdUser.staff_id, /^STF-[A-Z0-9]+-[A-Z0-9]{4}$/);

  });

  await smoke('department hierarchy CRUD and Excel import smoke', async () => {
    const initial = await request('GET', '/api/departments');
    expectStatus(initial, 200, 'list department hierarchy');
    const organization = initial.body.nodes.find((node) => node.type === 'organization');
    assert.ok(organization, 'default Organization root should exist');

    const department = await request('POST', '/api/departments', { json: { name: `${runId} Finance`, type: 'department', parentId: organization.id, description: 'Smoke department', enabled: true } });
    expectStatus(department, 201, 'create department');
    const group = await request('POST', '/api/departments', { json: { name: `${runId} Accounts`, type: 'group', parentId: department.body.node.id, description: 'Smoke group', enabled: true } });
    expectStatus(group, 201, 'create department group');
    const rootGroup = await request('POST', '/api/departments', { json: { name: `${runId} Shared Services`, type: 'group', parentId: organization.id, description: 'Direct organization group', enabled: true } });
    expectStatus(rootGroup, 201, 'create group directly under organization');
    const nestedDepartment = await request('POST', '/api/departments', { json: { name: `${runId} Billing`, type: 'department', parentId: group.body.node.id, description: 'Department nested below group', enabled: true } });
    expectStatus(nestedDepartment, 201, 'create department below group');

    const template = await request('GET', '/api/departments/import/template');
    expectStatus(template, 200, 'download department import template');
    assert.ok(template.buffer.length > 1000);
    const importResult = await uploadWorkbook('/api/departments/import', workbookBuffer([
      { 'Parent Path': `Organization/${runId} Operations`, Name: `${runId} Support`, Type: 'Group', Description: 'Imported nested group' },
      { 'Parent Path': 'Organization', Name: `${runId} Operations`, Type: 'Department', Description: 'Imported department' }
    ], 'Departments'), 'departments.xlsx');
    expectStatus(importResult, 201, 'import department hierarchy');
    assert.equal(importResult.body.departmentsCreated, 1);
    assert.equal(importResult.body.groupsCreated, 1);

    const importedNodes = importResult.body.hierarchy.nodes;
    const importedGroup = importedNodes.find((node) => node.name === `${runId} Support`);
    const importedDepartment = importedNodes.find((node) => node.name === `${runId} Operations`);
    for (const node of [nestedDepartment.body.node, group.body.node, department.body.node, rootGroup.body.node, importedGroup, importedDepartment]) {
      const deleted = await request('DELETE', `/api/departments/${node.id}`);
      expectStatus(deleted, 200, `delete ${node.type}`);
    }
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

    configResponse = await request('POST', `/api/sysadmin/modules/${createdModuleKey}/fields`, {
      json: {
        label: 'Line Amount Double',
        type: 'decimals',
        tableType: 'detail',
        detailTableName,
        formulaExpression: '{amount} * 2',
        formulaEnabled: true,
        disableManualInput: true
      }
    });
    expectStatus(configResponse, 201, 'create detail formula field');

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

    const versionHistory = await request('GET', `/api/sysadmin/modules/${createdModuleKey}/config-history`);
    expectStatus(versionHistory, 200, 'list configuration versions');
    assert.ok(versionHistory.body.versions.length >= 1, 'Configuration history should include a baseline');
    const savedVersion = await request('POST', `/api/sysadmin/modules/${createdModuleKey}/config-history/versions`, {
      json: { remark: 'Smoke checkpoint before title update' }
    });
    expectStatus(savedVersion, 201, 'save configuration version');
    assert.equal(savedVersion.body.versions[0].summary, 'Smoke checkpoint before title update');
    const savedVersionId = savedVersion.body.versions[0].id;
    const savedVersionNumber = savedVersion.body.versions[0].versionNumber;

    const changedTitle = await request('PATCH', `/api/sysadmin/modules/${createdModuleKey}/fields/title`, {
      json: { label: 'Changed Title' }
    });
    expectStatus(changedTitle, 200, 'change field after version checkpoint');
    assert.equal(findField(changedTitle.body, 'title').label, 'Changed Title');

    const restoredConfig = await request('POST', `/api/sysadmin/modules/${createdModuleKey}/config-history/${savedVersionId}/rollback`, {
      json: { remark: 'Smoke restore verification' }
    });
    expectStatus(restoredConfig, 200, 'restore configuration version');
    assert.equal(findField(restoredConfig.body, 'title').label, 'Title');
    const historyAfterRestore = await request('GET', `/api/sysadmin/modules/${createdModuleKey}/config-history`);
    expectStatus(historyAfterRestore, 200, 'list history after restore');
    assert.equal(historyAfterRestore.body.versions[0].action, 'version.restore');
    assert.equal(historyAfterRestore.body.versions[0].summary, `Restored version ${savedVersionNumber}: Smoke restore verification`);
    assert.notEqual(historyAfterRestore.body.versions[0].id, savedVersionId, 'Restore should create a new immutable version');

    const browsers = await request('GET', '/api/browser-buttons');
    expectStatus(browsers, 200, 'browser buttons list');
    assert.ok(browsers.body.browserButtons.some((browser) => browser.browserKey === 'countries'));

    const countrySearch = await request('GET', '/api/browser-buttons/countries/search?q=Malaysia');
    expectStatus(countrySearch, 200, 'browser button search');
    assert.ok(countrySearch.body.rows.length > 0);
  });

  await smoke('Phase 6 permissions smoke', async () => {
    const hierarchy = await request('GET', '/api/departments');
    const organization = hierarchy.body.nodes.find((node) => node.type === 'organization');
    const permissionDepartment = await request('POST', '/api/departments', { json: { name: `${runId} Permission Department`, type: 'department', parentId: organization.id, enabled: true } });
    expectStatus(permissionDepartment, 201, 'create permission department');
    const permissionGroup = await request('POST', '/api/departments', { json: { name: `${runId} Permission Group`, type: 'group', parentId: permissionDepartment.body.node.id, enabled: true } });
    expectStatus(permissionGroup, 201, 'create nested permission group');
    const assignMembership = await request('PATCH', `/api/users/${createdUserId}`, { json: { organizationNodeId: permissionGroup.body.node.id } });
    expectStatus(assignMembership, 204, 'assign user organization membership');
    const permissions = {
      view: { roles: ['admin'], users: [], departments: [permissionDepartment.body.node.id] },
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
    assert.deepEqual(saveModulePermissions.body.permissions.view.departments, [String(permissionDepartment.body.node.id)]);

    const adminToken = token;
    const userLogin = await request('POST', '/api/auth/login', { auth: false, json: { email: createdUserEmail, password: 'SmokePass123!' } });
    expectStatus(userLogin, 200, 'login department member');
    token = userLogin.body.token;
    const memberMenu = await request('GET', '/api/modules');
    expectStatus(memberMenu, 200, 'department member module menu');
    assert.ok(memberMenu.body.modules.some((entry) => entry.module.moduleKey === createdModuleKey), 'ancestor department View grant should include nested group member');
    const allowedRecords = await request('GET', `/api/modules/${createdModuleKey}/records`);
    expectStatus(allowedRecords, 200, 'allow record list with department view permission');
    const deniedCreate = await request('POST', `/api/modules/${createdModuleKey}/records`, {
      json: {}
    });
    expectStatus(deniedCreate, 403, 'deny record create without page create permission');
    token = adminToken;

    const permissionAudit = await request(
      'GET',
      `/api/sysadmin/permission-audit?moduleKey=${encodeURIComponent(createdModuleKey)}&limit=20`
    );
    expectStatus(permissionAudit, 200, 'permission audit review');
    assert.ok(permissionAudit.body.auditLogs.some((entry) => (
      entry.action === 'create'
      && entry.allowed === false
      && entry.userId === createdUserId
    )), 'denied record create should be audited');
    assert.ok(permissionAudit.body.auditLogs.some((entry) => (
      entry.action === 'view'
      && entry.allowed === true
      && entry.userId === createdUserId
    )), 'allowed module view should be audited');

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
    token = userLogin.body.token;
    const fieldRestrictedRecords = await request('GET', `/api/modules/${createdModuleKey}/records`);
    expectStatus(fieldRestrictedRecords, 200, 'list records with field restrictions');
    assert.ok(fieldRestrictedRecords.body.records.every((record) => (
      Object.keys(record.customFields || {}).length === 0
    )), 'record list must not expose fields without view permission');
    token = adminToken;
    await request('PATCH', `/api/users/${createdUserId}`, { json: { organizationNodeId: null, status: 'inactive' } });
    await request('DELETE', `/api/departments/${permissionGroup.body.node.id}`);
    await request('DELETE', `/api/departments/${permissionDepartment.body.node.id}`);
  });

  await smoke('module creation routes and templates smoke', async () => {
    const templates = await request('GET', '/api/sysadmin/module-templates');
    expectStatus(templates, 200, 'list module templates');
    assert.deepEqual(templates.body.templates.map((template) => template.key), ['companies', 'contacts', 'sales_opportunities']);
    assert.ok(templates.body.templates.every((template) => template.fieldCount > 0));

    const templateModuleKey = `${runId}_companies`;
    creationModeModuleKeys.push(templateModuleKey);
    const fromTemplate = await request('POST', '/api/sysadmin/modules', {
      json: {
        name: 'Smoke Companies',
        moduleKey: templateModuleKey,
        creationMode: 'template',
        templateKey: 'companies',
        status: 'draft'
      }
    });
    expectStatus(fromTemplate, 201, 'create module from template');
    assert.ok(findField(fromTemplate.body, 'companyName'), 'Companies template should create Company Name');
    assert.ok(findField(fromTemplate.body, 'status'), 'Companies template should create Status');

    const copiedModuleKey = `${runId}_copied_form`;
    creationModeModuleKeys.push(copiedModuleKey);
    const fromExistingForm = await request('POST', '/api/sysadmin/modules', {
      json: {
        name: 'Smoke Copied Form Module',
        moduleKey: copiedModuleKey,
        creationMode: 'existing_form',
        sourceFormKey: createdModuleKey,
        status: 'draft'
      }
    });
    expectStatus(fromExistingForm, 201, 'create module from existing form');
    assert.equal(findField(fromExistingForm.body, 'title').required, true);
    assert.notEqual(findField(fromExistingForm.body, 'lineNote').detailTableName, detailTableName, 'Copied form must own a new detail table');
    assert.deepEqual(fromExistingForm.body.formLayouts.published.add.order, ['title', 'amount', 'amountDouble', 'lineNote']);

    const blankModuleKey = `${runId}_blank`;
    creationModeModuleKeys.push(blankModuleKey);
    const fromScratch = await request('POST', '/api/sysadmin/modules', {
      json: {
        name: 'Smoke Blank Module',
        moduleKey: blankModuleKey,
        creationMode: 'scratch',
        status: 'draft'
      }
    });
    expectStatus(fromScratch, 201, 'create blank module');
    assert.equal(fromScratch.body.fields.length, 0);
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
    assert.equal(Number(create.body.record.detailTables[detailTableName][0].lineAmountDouble), 25);

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
    assert.equal(Number(update.body.record.detailTables[detailTableName][0].lineAmountDouble), 40);

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
        const contentType = String(req.headers['content-type'] || '');
        const parsed = body
          ? (contentType.includes('application/json') ? JSON.parse(body) : Object.fromEntries(new URLSearchParams(body)))
          : {};
        restCalls.push({ method: req.method, url: req.url, body: parsed, headers: req.headers });
        if (req.url === '/oauth2/token') {
          const expected = `Basic ${Buffer.from('smoke-client:smoke-secret').toString('base64')}`;
          if (req.headers.authorization !== expected || parsed.grant_type !== 'client_credentials') {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'invalid_client' }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ access_token: 'smoke-oauth2-token', token_type: 'Bearer', expires_in: 3600 }));
          return;
        }
        if (req.url === '/oauth2/resource') {
          const authorized = req.headers.authorization === 'Bearer smoke-oauth2-token';
          res.writeHead(authorized ? 200 : 401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ authorized, scheme: 'oauth2' }));
          return;
        }
        if (req.url === '/oauth1/resource?check=yes') {
          const authorization = String(req.headers.authorization || '');
          const authorized = authorization.startsWith('OAuth ')
            && authorization.includes('oauth_consumer_key="smoke-consumer"')
            && authorization.includes('oauth_token="smoke-access-token"')
            && authorization.includes('oauth_signature_method="HMAC-SHA256"')
            && authorization.includes('oauth_signature=');
          res.writeHead(authorized ? 200 : 401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ authorized, scheme: 'oauth1' }));
          return;
        }
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

    const categoryKey = `${runId}_category`;
    const category = await request('POST', '/api/action-flows/connector-categories', {
      json: { categoryKey, name: 'Smoke API Category', description: 'Groups smoke-test connectors.' }
    });
    expectStatus(category, 201, 'save connector category');
    assert.equal(category.body.category.categoryKey, categoryKey);

    const connectorKey = `${runId}_connector`;
    const oauth1ConnectorKey = `${runId}_oauth1_connector`;
    const oauth2ConnectorKey = `${runId}_oauth2_connector`;
    const connector = await request('POST', '/api/action-flows/connectors', {
      json: {
        connectorKey,
        categoryKey,
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
      assert.equal(connector.body.connector.categoryKey, categoryKey);

      const categories = await request('GET', '/api/action-flows/connector-categories');
      expectStatus(categories, 200, 'list connector categories');
      assert.ok(categories.body.categories.some((item) => item.categoryKey === categoryKey));

      const debugRequest = await request('POST', `/api/action-flows/connectors/${connectorKey}/debug`, {
        json: {
          key: 'extract',
          name: 'Debug Extract',
          method: 'POST',
          path: '/extract',
          interfaceConfig: {
            request: {
              params: { source: 'interface-test' },
              headers: { 'X-Smoke-Test': 'debug' },
              body: { title: `${runId} Debug Request` },
              bodyFormat: 'application/json'
            },
            outcome: { successStatuses: '200-299' }
          }
        }
      });
      expectStatus(debugRequest, 200, 'debug API interface');
      assert.equal(debugRequest.body.response.status, 200);
      assert.equal(debugRequest.body.response.body.echoedTitle, `${runId} Debug Request`);
      assert.equal(debugRequest.body.outcome.success, true);
      assert.equal(debugRequest.body.request.method, 'POST');
      assert.match(debugRequest.body.request.url, /source=interface-test/);

      const oauth1Connector = await request('POST', '/api/action-flows/connectors', {
        json: {
          connectorKey: oauth1ConnectorKey,
          name: 'Smoke OAuth 1 Connector',
          baseUrl: restBaseUrl,
          authType: 'oauth1',
          authConfig: {
            consumerKey: 'smoke-consumer',
            consumerSecret: 'smoke-consumer-secret',
            accessToken: 'smoke-access-token',
            tokenSecret: 'smoke-token-secret',
            signatureMethod: 'HMAC-SHA256',
            runtime: { allowPrivateNetwork: true }
          },
          enabled: true
        }
      });
      expectStatus(oauth1Connector, 201, 'save OAuth 1 connector');
      const oauth1Debug = await request('POST', `/api/action-flows/connectors/${oauth1ConnectorKey}/debug`, {
        json: {
          method: 'GET',
          path: '/oauth1/resource',
          interfaceConfig: { request: { params: { check: 'yes' } }, outcome: { successStatuses: '200-299' } }
        }
      });
      expectStatus(oauth1Debug, 200, 'debug OAuth 1 interface');
      assert.equal(oauth1Debug.body.response.status, 200);
      assert.equal(oauth1Debug.body.response.body.authorized, true);
      assert.equal(oauth1Debug.body.request.headers.Authorization, '[redacted]');

      const oauth2Connector = await request('POST', '/api/action-flows/connectors', {
        json: {
          connectorKey: oauth2ConnectorKey,
          name: 'Smoke OAuth 2 Connector',
          baseUrl: restBaseUrl,
          authType: 'oauth2',
          authConfig: {
            grantType: 'client_credentials',
            accessTokenUrl: `${restBaseUrl}/oauth2/token`,
            clientId: 'smoke-client',
            clientSecret: 'smoke-secret',
            scope: 'read',
            clientAuthentication: 'basic',
            authorizationLocation: 'header',
            headerPrefix: 'Bearer',
            runtime: { allowPrivateNetwork: true }
          },
          enabled: true
        }
      });
      expectStatus(oauth2Connector, 201, 'save OAuth 2 connector');
      const oauth2Debug = await request('POST', `/api/action-flows/connectors/${oauth2ConnectorKey}/debug`, {
        json: { method: 'GET', path: '/oauth2/resource', interfaceConfig: { request: {}, outcome: { successStatuses: '200-299' } } }
      });
      expectStatus(oauth2Debug, 200, 'debug OAuth 2 interface');
      assert.equal(oauth2Debug.body.response.status, 200);
      assert.equal(oauth2Debug.body.response.body.authorized, true);
      assert.equal(oauth2Debug.body.request.headers.Authorization, '[redacted]');
      const oauth2DebugCached = await request('POST', `/api/action-flows/connectors/${oauth2ConnectorKey}/debug`, {
        json: { method: 'GET', path: '/oauth2/resource', interfaceConfig: { request: {}, outcome: { successStatuses: '200-299' } } }
      });
      expectStatus(oauth2DebugCached, 200, 'reuse cached OAuth 2 token');
      assert.equal(restCalls.filter((call) => call.url === '/oauth2/token').length, 1);

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

      const structuredConditionDefinition = {
        nodes: [
          { id: 'trigger_1', category: 'trigger', type: 'record_created', label: 'When Created', config: { moduleKey: createdModuleKey } },
          {
            id: 'condition_1',
            category: 'logic',
            type: 'condition',
            label: 'Amount and title match',
            config: {
              condition: 'current record.amount greater_than 10',
              conditionCombinator: 'and',
              conditionRules: [
                { id: 'rule_1', left: 'current record.amount', operator: 'greater_than', value: '10' },
                { id: 'rule_2', left: 'current record.title', operator: 'contains', value: 'Priority' }
              ]
            }
          },
          { id: 'api_1', category: 'restful_api', type: 'call_rest_api', label: 'Call REST API', config: { connectorKey, method: 'POST', endpointKey: 'extract', endpointPath: '/extract' } },
          { id: 'delete_1', category: 'record', type: 'delete_record', label: 'Delete Record', config: { target: 'current_record', confirmDelete: true } }
        ],
        edges: [
          { from: 'trigger_1', to: 'condition_1' },
          { from: 'condition_1', to: 'api_1', outcome: 'yes' },
          { from: 'condition_1', to: 'delete_1', outcome: 'no' }
        ]
      };
      const saveStructuredCondition = await request('PUT', `/api/action-flows/${flowKey}`, {
        json: { definition: structuredConditionDefinition, bumpVersion: true }
      });
      expectStatus(saveStructuredCondition, 200, 'save structured condition builder settings');
      assert.equal(saveStructuredCondition.body.flow.definition.nodes[1].config.conditionRules.length, 2);
      const structuredConditionCheck = await request('POST', `/api/action-flows/${flowKey}/check`);
      expectStatus(structuredConditionCheck, 200, 'check structured conditions');
      assert.equal(structuredConditionCheck.body.check.valid, true);

      structuredConditionDefinition.nodes[1].config.conditionRules[1].value = '';
      const saveIncompleteCondition = await request('PUT', `/api/action-flows/${flowKey}`, {
        json: { definition: structuredConditionDefinition, bumpVersion: true }
      });
      expectStatus(saveIncompleteCondition, 200, 'save incomplete structured condition');
      const incompleteConditionCheck = await request('POST', `/api/action-flows/${flowKey}/check`);
      expectStatus(incompleteConditionCheck, 200, 'reject incomplete structured condition');
      assert.equal(incompleteConditionCheck.body.check.valid, false);
      assert.ok(incompleteConditionCheck.body.check.errors.some((error) => error.includes('needs a comparison value')));

      structuredConditionDefinition.nodes[1].config.conditionRules[1].value = 'Priority';
      structuredConditionDefinition.edges = structuredConditionDefinition.edges.filter((edge) => edge.outcome !== 'no');
      const saveMissingNoBranch = await request('PUT', `/api/action-flows/${flowKey}`, {
        json: { definition: structuredConditionDefinition, bumpVersion: true }
      });
      expectStatus(saveMissingNoBranch, 200, 'save condition missing No branch');
      const missingNoBranchCheck = await request('POST', `/api/action-flows/${flowKey}/check`);
      expectStatus(missingNoBranchCheck, 200, 'reject condition missing No branch');
      assert.equal(missingNoBranchCheck.body.check.valid, false);
      assert.ok(missingNoBranchCheck.body.check.errors.some((error) => error.includes('needs a No branch')));

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

      const initialFlowVersions = await request('GET', `/api/action-flows/${runtimeFlowKey}/versions`);
      expectStatus(initialFlowVersions, 200, 'list initial action flow versions');
      assert.equal(initialFlowVersions.body.versions.length, 1);
      const baselineFlowVersionId = initialFlowVersions.body.versions[0].id;
      const checkpointFlowVersion = await request('POST', `/api/action-flows/${runtimeFlowKey}/versions`, {
        json: { remark: 'Smoke draft checkpoint' }
      });
      expectStatus(checkpointFlowVersion, 201, 'save action flow version checkpoint');
      assert.equal(checkpointFlowVersion.body.versions[0].action, 'checkpoint');
      const publishFlowVersion = await request('POST', `/api/action-flows/${runtimeFlowKey}/publish`, {
        json: { remark: 'Smoke published version' }
      });
      expectStatus(publishFlowVersion, 200, 'publish action flow version');
      assert.equal(publishFlowVersion.body.flow.status, 'enabled');
      assert.equal(publishFlowVersion.body.flow.publishedVersion, publishFlowVersion.body.flow.currentVersion);
      const publishedVersionNumber = publishFlowVersion.body.flow.publishedVersion;
      const restoreFlowVersion = await request('POST', `/api/action-flows/${runtimeFlowKey}/versions/${baselineFlowVersionId}/restore`, {
        json: { remark: 'Smoke restore verification' }
      });
      expectStatus(restoreFlowVersion, 200, 'restore action flow version');
      assert.equal(restoreFlowVersion.body.versions[0].action, 'restored');
      assert.equal(restoreFlowVersion.body.flow.publishedVersion, publishedVersionNumber, 'restore should leave the published version live');
      assert.ok(restoreFlowVersion.body.flow.currentVersion > publishedVersionNumber, 'restore should create a new draft version');

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

      const mappingFlowKey = `${runId}_mapping_flow`;
      const mappingFlow = await request('POST', '/api/action-flows', {
        json: {
          flowKey: mappingFlowKey,
          name: 'Smoke Previous Output Mapping Flow',
          status: 'enabled',
          triggerType: 'record_created',
          triggerModule: createdModuleKey,
          definition: {
            nodes: [
              { id: 'trigger_1', category: 'trigger', type: 'record_created', label: 'When Created', config: { moduleKey: createdModuleKey } },
              {
                id: 'set_1',
                category: 'data_mapping',
                type: 'set_variable',
                label: 'Prepare values',
                config: {
                  fieldMappings: [
                    { id: 'mapping_1', target: 'copiedAmount', mode: 'expression', value: 'current record.amount' },
                    { id: 'mapping_2', target: 'sourceLabel', mode: 'fixed', value: 'mapped' }
                  ],
                  fieldMappingText: 'copiedAmount = {{ current record.amount }}\nsourceLabel = "mapped"'
                }
              },
              {
                id: 'condition_1',
                category: 'logic',
                type: 'condition',
                label: 'Mapped amount exists',
                config: {
                  condition: 'outputs.set_1.values.copiedAmount greater_than 0',
                  conditionRules: [{ id: 'mapped_rule', left: 'outputs.set_1.values.copiedAmount', operator: 'greater_than', value: '0' }]
                }
              },
              { id: 'end_yes', category: 'end', type: 'end', label: 'Mapped', config: {} },
              { id: 'end_no', category: 'end', type: 'end', label: 'Missing', config: {} }
            ],
            edges: [
              { from: 'trigger_1', to: 'set_1' },
              { from: 'set_1', to: 'condition_1' },
              { from: 'condition_1', to: 'end_yes', outcome: 'yes' },
              { from: 'condition_1', to: 'end_no', outcome: 'no' }
            ]
          }
        }
      });
      expectStatus(mappingFlow, 201, 'create previous-output mapping flow');
      const mappingFlowCheck = await request('POST', `/api/action-flows/${mappingFlowKey}/check`);
      expectStatus(mappingFlowCheck, 200, 'check previous-output mapping flow');
      assert.equal(mappingFlowCheck.body.check.valid, true);
      const mappingRunOnce = await request('POST', `/api/action-flows/${mappingFlowKey}/run-once`, {
        json: { recordId: 9001, record: { id: 9001, title: 'Run Once', amount: 8 } }
      });
      expectStatus(mappingRunOnce, 200, 'run action flow once');
      assert.equal(mappingRunOnce.body.execution.status, 'success');
      assert.ok(mappingRunOnce.body.execution.executionId);
      assert.equal(mappingRunOnce.body.execution.trigger.runOnce, true);
      assert.equal(mappingRunOnce.body.execution.steps.find((step) => step.nodeId === 'set_1').values.copiedAmount, 8);
      assert.equal(mappingRunOnce.body.execution.steps.find((step) => step.nodeId === 'condition_1').selectedOutcome, 'yes');

      const operationalFlowKey = `${runId}_operational_flow`;
      const operationalFlow = await request('POST', '/api/action-flows', {
        json: {
          flowKey: operationalFlowKey,
          name: 'Smoke Task Notification Transform Flow',
          status: 'enabled',
          triggerType: 'record_created',
          triggerModule: createdModuleKey,
          definition: {
            nodes: [
              { id: 'trigger_1', category: 'trigger', type: 'record_created', label: 'When Created', config: { moduleKey: createdModuleKey } },
              { id: 'transform_1', category: 'data_mapping', type: 'transform_value', label: 'Normalize title', config: { outputName: 'cleanTitle', sourceValue: 'current record.title', operation: 'uppercase' } },
              { id: 'task_1', category: 'task_notification', type: 'create_task', label: 'Create follow-up task', config: { title: 'Review {{ outputs.transform_1.values.cleanTitle }}', description: 'Created by action flow', assignee: String(createdUserId), priority: 'high' } },
              { id: 'notification_1', category: 'task_notification', type: 'send_notification', label: 'Notify owner', config: { recipient: String(createdUserId), title: 'Task created', message: 'Review {{ outputs.transform_1.values.cleanTitle }}' } },
              { id: 'end_1', category: 'end', type: 'end', label: 'End', config: {} }
            ],
            edges: [
              { from: 'trigger_1', to: 'transform_1' },
              { from: 'transform_1', to: 'task_1' },
              { from: 'task_1', to: 'notification_1' },
              { from: 'notification_1', to: 'end_1' }
            ]
          }
        }
      });
      expectStatus(operationalFlow, 201, 'create task notification transform flow');
      const operationalFlowCheck = await request('POST', `/api/action-flows/${operationalFlowKey}/check`);
      expectStatus(operationalFlowCheck, 200, 'check task notification transform flow');
      assert.equal(operationalFlowCheck.body.check.valid, true);

      const recoveryFlowKey = `${runId}_recovery_flow`;
      const recoveryFlow = await request('POST', '/api/action-flows', {
        json: {
          flowKey: recoveryFlowKey,
          name: 'Smoke Retry Error Branch Flow',
          status: 'enabled',
          triggerType: 'record_created',
          triggerModule: createdModuleKey,
          definition: {
            nodes: [
              { id: 'trigger_1', category: 'trigger', type: 'record_created', label: 'When Created', config: { moduleKey: createdModuleKey } },
              { id: 'api_fail', category: 'restful_api', type: 'call_rest_api', label: 'Retry failing API', config: { connectorKey, endpointKey: 'fail', method: 'POST', allowPrivateNetwork: true, retryAttempts: 2, retryDelayMs: 0, onError: 'error_branch' } },
              { id: 'recover_1', category: 'data_mapping', type: 'set_variable', label: 'Recover', config: { fieldMappings: [{ id: 'recovered', target: 'recovered', mode: 'fixed', value: 'yes' }], onError: 'stop' } },
              { id: 'end_1', category: 'end', type: 'end', label: 'End', config: {} }
            ],
            edges: [
              { from: 'trigger_1', to: 'api_fail' },
              { from: 'api_fail', to: 'recover_1', outcome: 'error' },
              { from: 'recover_1', to: 'end_1' }
            ]
          }
        }
      });
      expectStatus(recoveryFlow, 201, 'create retry error branch flow');
      const recoveryFlowCheck = await request('POST', `/api/action-flows/${recoveryFlowKey}/check`);
      expectStatus(recoveryFlowCheck, 200, 'check retry error branch flow');
      assert.equal(recoveryFlowCheck.body.check.valid, true);

      const scheduledFlowKey = `${runId}_scheduled_flow`;
      const scheduledFlow = await request('POST', '/api/action-flows', {
        json: {
          flowKey: scheduledFlowKey,
          name: 'Smoke Scheduled Flow',
          status: 'enabled',
          triggerType: 'scheduled',
          triggerModule: createdModuleKey,
          definition: {
            nodes: [
              { id: 'trigger_1', category: 'trigger', type: 'scheduled', label: 'Every hour', config: { moduleKey: createdModuleKey, scheduleEvery: 1, scheduleUnit: 'hours' } },
              { id: 'set_1', category: 'data_mapping', type: 'set_variable', label: 'Scheduled value', config: { fieldMappings: [{ id: 'scheduled', target: 'scheduled', mode: 'fixed', value: 'yes' }] } },
              { id: 'end_1', category: 'end', type: 'end', label: 'End', config: {} }
            ],
            edges: [{ from: 'trigger_1', to: 'set_1' }, { from: 'set_1', to: 'end_1' }]
          }
        }
      });
      expectStatus(scheduledFlow, 201, 'create scheduled flow');
      const scheduledResults = await actionFlowRuntime.runScheduledFlows(new Date());
      assert.ok(scheduledResults.some((result) => result.status === 'success'));
      const scheduledRepeat = await actionFlowRuntime.runScheduledFlows(new Date());
      assert.ok(!scheduledRepeat.some((result) => result.executionId === scheduledResults[0]?.executionId));

      const loopFlowKey = `${runId}_loop_flow`;
      const loopFlow = await request('POST', '/api/action-flows', { json: {
        flowKey: loopFlowKey, name: 'Smoke Loop Flow', status: 'draft', triggerType: 'manual', triggerModule: createdModuleKey,
        definition: {
          nodes: [
            { id: 'trigger_1', category: 'trigger', type: 'manual', label: 'Start', config: { moduleKey: createdModuleKey } },
            { id: 'loop_1', category: 'logic', type: 'loop', label: 'For each item', config: { sourceValue: '["alpha","beta","gamma"]', maxIterations: 10 } },
            { id: 'transform_1', category: 'data_mapping', type: 'transform_value', label: 'Read item', config: { sourceValue: 'loop.item', sourceMode: 'expression', operation: 'uppercase', outputName: 'item' } },
            { id: 'body_end', category: 'end', type: 'end', label: 'Body end', config: {} },
            { id: 'done_end', category: 'end', type: 'end', label: 'Done', config: {} }
          ],
          edges: [
            { from: 'trigger_1', to: 'loop_1' }, { from: 'loop_1', to: 'transform_1', outcome: 'body' },
            { from: 'transform_1', to: 'body_end' }, { from: 'loop_1', to: 'done_end', outcome: 'done' }
          ]
        }
      } });
      expectStatus(loopFlow, 201, 'create loop flow');
      const loopRun = await request('POST', `/api/action-flows/${loopFlowKey}/run-once`, { json: { record: {} } });
      expectStatus(loopRun, 200, 'run loop flow');
      assert.equal(loopRun.body.execution.status, 'success');
      assert.equal(loopRun.body.execution.steps.find((step) => step.nodeId === 'loop_1').iterations, 3);
      assert.equal(loopRun.body.execution.steps.filter((step) => step.nodeId === 'transform_1').length, 3);

      const parallelFlowKey = `${runId}_parallel_flow`;
      const parallelFlow = await request('POST', '/api/action-flows', { json: {
        flowKey: parallelFlowKey, name: 'Smoke Parallel Flow', status: 'draft', triggerType: 'manual', triggerModule: createdModuleKey,
        definition: {
          nodes: [
            { id: 'trigger_1', category: 'trigger', type: 'manual', label: 'Start', config: { moduleKey: createdModuleKey } },
            { id: 'parallel_1', category: 'logic', type: 'parallel_branch', label: 'Run together', config: {} },
            { id: 'end_a', category: 'end', type: 'end', label: 'Branch A', config: {} },
            { id: 'end_b', category: 'end', type: 'end', label: 'Branch B', config: {} }
          ],
          edges: [{ from: 'trigger_1', to: 'parallel_1' }, { from: 'parallel_1', to: 'end_a', outcome: 'branch_1' }, { from: 'parallel_1', to: 'end_b', outcome: 'branch_2' }]
        }
      } });
      expectStatus(parallelFlow, 201, 'create parallel flow');
      const parallelRun = await request('POST', `/api/action-flows/${parallelFlowKey}/run-once`, { json: { record: {} } });
      expectStatus(parallelRun, 200, 'run parallel flow');
      assert.equal(parallelRun.body.execution.status, 'success');
      assert.equal(parallelRun.body.execution.steps.find((step) => step.nodeId === 'parallel_1').branches.length, 2);

      const childFlowKey = `${runId}_child_flow`;
      const childFlow = await request('POST', '/api/action-flows', { json: {
        flowKey: childFlowKey, name: 'Smoke Child Flow', status: 'draft', triggerType: 'manual', triggerModule: createdModuleKey,
        definition: { nodes: [
          { id: 'trigger_1', category: 'trigger', type: 'manual', label: 'Start', config: { moduleKey: createdModuleKey } },
          { id: 'end_1', category: 'end', type: 'end', label: 'End', config: {} }
        ], edges: [{ from: 'trigger_1', to: 'end_1' }] }
      } });
      expectStatus(childFlow, 201, 'create child flow');
      const publishChildFlow = await request('POST', `/api/action-flows/${childFlowKey}/publish`, { json: { remark: 'Publish child for orchestration' } });
      expectStatus(publishChildFlow, 200, 'publish child flow');
      const parentFlowKey = `${runId}_parent_flow`;
      const parentFlow = await request('POST', '/api/action-flows', { json: {
        flowKey: parentFlowKey, name: 'Smoke Parent Flow', status: 'draft', triggerType: 'manual', triggerModule: createdModuleKey,
        definition: { nodes: [
          { id: 'trigger_1', category: 'trigger', type: 'manual', label: 'Start', config: { moduleKey: createdModuleKey } },
          { id: 'run_1', category: 'workflow', type: 'run_flow', label: 'Run child', config: { flowKey: childFlowKey, fieldMappings: [{ target: 'source', mode: 'fixed', value: 'parent' }] } },
          { id: 'end_1', category: 'end', type: 'end', label: 'End', config: {} }
        ], edges: [{ from: 'trigger_1', to: 'run_1' }, { from: 'run_1', to: 'end_1' }] }
      } });
      expectStatus(parentFlow, 201, 'create parent orchestration flow');
      const parentRun = await request('POST', `/api/action-flows/${parentFlowKey}/run-once`, { json: { record: {} } });
      expectStatus(parentRun, 200, 'run parent orchestration flow');
      assert.equal(parentRun.body.execution.status, 'success');
      assert.equal(parentRun.body.execution.steps.find((step) => step.nodeId === 'run_1').childStatus, 'success');

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
      const extractCalls = restCalls.filter((call) => call.url.startsWith('/extract'));
      assert.equal(extractCalls.length, 2);
      assert.equal(extractCalls[1].method, 'POST');
      assert.equal(extractCalls[1].url, '/extract');
      assert.equal(extractCalls[1].body.title, `${runId} Runtime Record`);
      assert.ok(restCalls.some((call) => call.url === '/fail'));

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

      const mappingExecutions = await request('GET', `/api/action-flows/executions?flowKey=${encodeURIComponent(mappingFlowKey)}`);
      expectStatus(mappingExecutions, 200, 'list previous-output mapping executions');
      const mappingExecution = mappingExecutions.body.executions.find((execution) => execution.status === 'success');
      assert.ok(mappingExecution, 'previous-output mapping flow should record a successful execution');
      const setValueStep = mappingExecution.result.steps.find((step) => step.nodeId === 'set_1');
      const mappedConditionStep = mappingExecution.result.steps.find((step) => step.nodeId === 'condition_1');
      assert.equal(setValueStep.values.copiedAmount, 1);
      assert.equal(setValueStep.values.sourceLabel, 'mapped');
      assert.equal(mappedConditionStep.selectedOutcome, 'yes');

      const operationalExecutions = await request('GET', `/api/action-flows/executions?flowKey=${encodeURIComponent(operationalFlowKey)}`);
      expectStatus(operationalExecutions, 200, 'list task notification transform executions');
      const operationalExecution = operationalExecutions.body.executions.find((execution) => execution.status === 'success');
      assert.ok(operationalExecution, 'task notification transform flow should record a successful execution');
      const transformStep = operationalExecution.result.steps.find((step) => step.nodeId === 'transform_1');
      const taskStep = operationalExecution.result.steps.find((step) => step.nodeId === 'task_1');
      const notificationStep = operationalExecution.result.steps.find((step) => step.nodeId === 'notification_1');
      assert.equal(transformStep.values.cleanTitle, `${runId} RUNTIME RECORD`.toUpperCase());
      assert.ok(taskStep.taskId);
      assert.ok(notificationStep.notificationId);
      createdTaskIds.push(taskStep.taskId);
      createdNotificationIds.push(notificationStep.notificationId);
      const [taskRows] = await pool.execute('SELECT * FROM crm_tasks WHERE id = ?', [taskStep.taskId]);
      const [notificationRows] = await pool.execute('SELECT * FROM crm_notifications WHERE id = ?', [notificationStep.notificationId]);
      assert.equal(taskRows[0].title, `Review ${`${runId} Runtime Record`.toUpperCase()}`);
      assert.equal(taskRows[0].priority, 'high');
      assert.equal(Number(taskRows[0].assignee_user_id), createdUserId);
      assert.equal(notificationRows[0].message, `Review ${`${runId} Runtime Record`.toUpperCase()}`);
      assert.equal(Number(notificationRows[0].recipient_user_id), createdUserId);

      const recoveryExecutions = await request('GET', `/api/action-flows/executions?flowKey=${encodeURIComponent(recoveryFlowKey)}`);
      expectStatus(recoveryExecutions, 200, 'list retry error branch executions');
      const recoveryExecution = recoveryExecutions.body.executions.find((execution) => execution.status === 'success');
      assert.ok(recoveryExecution, 'handled Error branch should finish successfully');
      const failedApiStep = recoveryExecution.result.steps.find((step) => step.nodeId === 'api_fail');
      const recoveryStep = recoveryExecution.result.steps.find((step) => step.nodeId === 'recover_1');
      assert.equal(failedApiStep.status, 'failed');
      assert.equal(failedApiStep.handled, true);
      assert.equal(failedApiStep.attempts, 2);
      assert.equal(recoveryStep.values.recovered, 'yes');

      const branchFlowKey = `${runId}_condition_branch_flow`;
      const branchFlow = await request('POST', '/api/action-flows', {
        json: {
          flowKey: branchFlowKey,
          name: 'Smoke Condition Branch Flow',
          status: 'enabled',
          triggerType: 'record_created',
          triggerModule: createdModuleKey,
          definition: {
            nodes: [
              { id: 'trigger_1', category: 'trigger', type: 'record_created', label: 'When Created', config: { moduleKey: createdModuleKey } },
              {
                id: 'condition_amount',
                category: 'logic',
                type: 'condition',
                label: 'Amount is eligible',
                config: {
                  condition: 'current record.amount greater_than 10',
                  conditionCombinator: 'and',
                  conditionRules: [
                    { id: 'amount_rule', left: 'current record.amount', operator: 'greater_than', value: '10' },
                    { id: 'title_rule', left: 'current record.title', operator: 'not_empty', value: '' }
                  ]
                }
              },
              {
                id: 'condition_priority',
                category: 'logic',
                type: 'condition',
                label: 'Priority match',
                config: {
                  condition: 'current record.title contains VIP',
                  conditionCombinator: 'or',
                  conditionRules: [
                    { id: 'vip_rule', left: 'current record.title', operator: 'contains', value: 'VIP' },
                    { id: 'large_rule', left: 'current record.amount', operator: 'greater_than', value: '100' }
                  ]
                }
              },
              { id: 'yes_yes_action', category: 'record', type: 'update_record', label: 'VIP branch', config: { target: 'current_record', targetModule: createdModuleKey, fieldMappingText: 'amountDouble = 111' } },
              { id: 'yes_no_action', category: 'record', type: 'update_record', label: 'Regular branch', config: { target: 'current_record', targetModule: createdModuleKey, fieldMappingText: 'amountDouble = 222' } },
              { id: 'no_action', category: 'record', type: 'update_record', label: 'Ineligible branch', config: { target: 'current_record', targetModule: createdModuleKey, fieldMappingText: 'amountDouble = 333' } }
            ],
            edges: [
              { from: 'trigger_1', to: 'condition_amount' },
              { from: 'condition_amount', to: 'condition_priority', outcome: 'yes' },
              { from: 'condition_amount', to: 'no_action', outcome: 'no' },
              { from: 'condition_priority', to: 'yes_yes_action', outcome: 'yes' },
              { from: 'condition_priority', to: 'yes_no_action', outcome: 'no' }
            ]
          }
        }
      });
      expectStatus(branchFlow, 201, 'create enabled condition branch flow');
      const branchCheck = await request('POST', `/api/action-flows/${branchFlowKey}/check`);
      expectStatus(branchCheck, 200, 'check condition branch routing');
      assert.equal(branchCheck.body.check.valid, true);

      const branchCases = [
        { title: `${runId} VIP`, amount: 20, outcomes: ['yes', 'yes'], actionId: 'yes_yes_action', excluded: ['yes_no_action', 'no_action'] },
        { title: `${runId} Regular`, amount: 20, outcomes: ['yes', 'no'], actionId: 'yes_no_action', excluded: ['yes_yes_action', 'no_action'] },
        { title: `${runId} Low`, amount: 2, outcomes: ['no'], actionId: 'no_action', excluded: ['yes_yes_action', 'yes_no_action', 'condition_priority'] }
      ];
      for (const branchCase of branchCases) {
        const record = await request('POST', `/api/modules/${createdModuleKey}/records`, {
          json: { title: branchCase.title, amount: branchCase.amount }
        });
        expectStatus(record, 201, `create ${branchCase.title} condition record`);
        createdRecordIds.push(record.body.record.id);
        const branchExecutions = await request('GET', `/api/action-flows/executions?flowKey=${encodeURIComponent(branchFlowKey)}`);
        expectStatus(branchExecutions, 200, 'list condition branch executions');
        const execution = branchExecutions.body.executions.find((item) => Number(item.result.recordId) === Number(record.body.record.id));
        assert.ok(execution, `condition execution should exist for record ${record.body.record.id}`);
        const conditionSteps = execution.result.steps.filter((step) => step.type === 'condition');
        assert.deepEqual(conditionSteps.map((step) => step.selectedOutcome), branchCase.outcomes);
        assert.ok(conditionSteps.every((step) => step.rules.every((rule) => typeof rule.matched === 'boolean')));
        assert.ok(execution.result.steps.some((step) => step.nodeId === branchCase.actionId));
        branchCase.excluded.forEach((nodeId) => assert.ok(!execution.result.steps.some((step) => step.nodeId === nodeId), `${nodeId} must not execute`));
      }

      const deleteFlow = await request('DELETE', `/api/action-flows/${flowKey}`);
      expectStatus(deleteFlow, 200, 'delete action flow');
      const deleteRuntimeFlow = await request('DELETE', `/api/action-flows/${runtimeFlowKey}`);
      expectStatus(deleteRuntimeFlow, 200, 'delete runtime action flow');
      const deleteRestRuntimeFlow = await request('DELETE', `/api/action-flows/${restRuntimeFlowKey}`);
      expectStatus(deleteRestRuntimeFlow, 200, 'delete REST runtime action flow');
      const deleteRestErrorFlow = await request('DELETE', `/api/action-flows/${restErrorFlowKey}`);
      expectStatus(deleteRestErrorFlow, 200, 'delete REST error mapping flow');
      const deleteMappingFlow = await request('DELETE', `/api/action-flows/${mappingFlowKey}`);
      expectStatus(deleteMappingFlow, 200, 'delete previous-output mapping flow');
      const deleteOperationalFlow = await request('DELETE', `/api/action-flows/${operationalFlowKey}`);
      expectStatus(deleteOperationalFlow, 200, 'delete task notification transform flow');
      const deleteRecoveryFlow = await request('DELETE', `/api/action-flows/${recoveryFlowKey}`);
      expectStatus(deleteRecoveryFlow, 200, 'delete retry error branch flow');
      const deleteScheduledFlow = await request('DELETE', `/api/action-flows/${scheduledFlowKey}`);
      expectStatus(deleteScheduledFlow, 200, 'delete scheduled flow');
      for (const advancedFlowKey of [loopFlowKey, parallelFlowKey, parentFlowKey, childFlowKey]) {
        const deletedAdvancedFlow = await request('DELETE', `/api/action-flows/${advancedFlowKey}`);
        expectStatus(deletedAdvancedFlow, 200, `delete advanced flow ${advancedFlowKey}`);
      }
      const deleteBranchFlow = await request('DELETE', `/api/action-flows/${branchFlowKey}`);
      expectStatus(deleteBranchFlow, 200, 'delete condition branch flow');
      const deleteConnector = await request('DELETE', `/api/action-flows/connectors/${connectorKey}`);
      expectStatus(deleteConnector, 200, 'delete API connector');
      const deleteOauth1Connector = await request('DELETE', `/api/action-flows/connectors/${oauth1ConnectorKey}`);
      expectStatus(deleteOauth1Connector, 200, 'delete OAuth 1 connector');
      const deleteOauth2Connector = await request('DELETE', `/api/action-flows/connectors/${oauth2ConnectorKey}`);
      expectStatus(deleteOauth2Connector, 200, 'delete OAuth 2 connector');
      const deleteCategory = await request('DELETE', `/api/action-flows/connector-categories/${categoryKey}`);
      expectStatus(deleteCategory, 200, 'delete connector category');
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
