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
