const http = require('http');
const assert = require('assert/strict');
const { createApp } = require('../../src/app');
const { pool, dashboardPool } = require('../../src/database/pool');
const { config } = require('../../src/shared/config');
const queryService = require('../../src/modules/dashboards/dashboard-query.service');

const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const viewName = `vw_dashboard_smoke_${suffix}`;
const viewSourceKey = `smoke_view_${suffix}`;
const querySourceKey = `smoke_query_${suffix}`;
const filterDashboardKey = `smoke_filter_dashboard_${suffix}`;
let server;
let baseUrl = '';
let token = '';

async function request(method, path, json, auth = true) {
  const headers = {};
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  let body;
  if (json !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(json); }
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body });
  const payload = await response.json();
  return { status: response.status, body: payload };
}

async function main() {
  try {
    assert.deepEqual(queryService.validateReadOnlySql("SELECT 'delete; -- safe literal' AS label").parameters, []);
    assert.throws(() => queryService.validateReadOnlySql('DELETE FROM customers'), /must start/i);
    assert.throws(() => queryService.validateReadOnlySql('SELECT * FROM customers; SELECT 1'), /separators/i);
    assert.throws(() => queryService.validateReadOnlySql('SELECT * FROM customers -- comment'), /comments/i);
    assert.throws(() => queryService.validateReadOnlySql('SELECT SLEEP(2)'), /prohibited function/i);
    assert.throws(() => queryService.validateReadOnlySql('SELECT * FROM mysql.user'), /cannot access schema/i);
    assert.doesNotThrow(() => queryService.validateReadOnlySql('SELECT c.id FROM customers c WHERE c.id = :customer_id'));

    await pool.query(`CREATE OR REPLACE VIEW \`${viewName}\` AS SELECT 'Active' AS label, 3 AS value UNION ALL SELECT 'Inactive', 1`);
    server = http.createServer(createApp());
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    const adminHtml = await (await fetch(`${baseUrl}/`)).text();
    const adminScript = await (await fetch(`${baseUrl}/app.js`)).text();
    for (const marker of ['adminDashboardSourcesSection', 'dashboardSourceList', 'dashboardSourceDrawer', 'dashboardPreviewResult']) {
      assert.ok(adminHtml.includes(marker), `Admin UI should include ${marker}`);
    }
    for (const marker of ['loadDashboardSources', 'runDashboardSourcePreview', 'archiveDashboardSource']) {
      assert.ok(adminScript.includes(marker), `Admin UI script should include ${marker}`);
    }

    const unauthenticated = await request('GET', '/api/dashboards/views', undefined, false);
    assert.equal(unauthenticated.status, 401);
    const login = await request('POST', '/api/auth/login', { email: process.env.SMOKE_ADMIN_EMAIL || config.admin.email, password: process.env.SMOKE_ADMIN_PASSWORD || config.admin.password }, false);
    assert.equal(login.status, 200, JSON.stringify(login.body));
    token = login.body.token;

    const views = await request('GET', '/api/dashboards/views');
    assert.equal(views.status, 200);
    assert.ok(views.body.views.some((view) => view.name === viewName));
    const described = await request('GET', `/api/dashboards/views/${viewName}`);
    assert.deepEqual(described.body.view.columns.map((column) => column.name), ['label', 'value']);

    const missingView = await request('POST', '/api/dashboards/data-sources', { dataSourceKey: `${viewSourceKey}_missing`, name: 'Missing view', sourceType: 'sql_view', viewName: `${viewName}_missing` });
    assert.equal(missingView.status, 404);
    const unsafeSource = await request('POST', '/api/dashboards/data-sources', { dataSourceKey: `${querySourceKey}_unsafe`, name: 'Unsafe source', sourceType: 'select_query', querySql: 'SELECT SLEEP(2)' });
    assert.equal(unsafeSource.status, 422);

    const viewSource = await request('POST', '/api/dashboards/data-sources', { dataSourceKey: viewSourceKey, name: 'Smoke SQL view', sourceType: 'sql_view', viewName, rowLimit: 10, timeoutMs: 5000 });
    assert.equal(viewSource.status, 201, JSON.stringify(viewSource.body));
    const viewResult = await request('POST', `/api/dashboards/data-sources/${viewSourceKey}/execute`, { limit: 1 });
    assert.equal(viewResult.status, 200, JSON.stringify(viewResult.body));
    assert.equal(viewResult.body.rows.length, 1);
    assert.deepEqual(viewResult.body.columns.map((column) => column.name), ['label', 'value']);
    assert.equal(viewResult.body.cache.status, 'miss');
    assert.equal(viewResult.body.page.hasMore, true);
    const cachedViewResult = await request('POST', `/api/dashboards/data-sources/${viewSourceKey}/execute`, { limit: 1 });
    assert.equal(cachedViewResult.body.cache.status, 'hit');
    const refreshedViewResult = await request('POST', `/api/dashboards/data-sources/${viewSourceKey}/execute`, { limit: 1, forceRefresh: true });
    assert.equal(refreshedViewResult.body.cache.status, 'refreshed');
    assert.notEqual(queryService.cacheKey(viewSourceKey, { limit: 1 }, { user: { id: 1, role: 'user', departmentId: 10 } }), queryService.cacheKey(viewSourceKey, { limit: 1 }, { user: { id: 2, role: 'user', departmentId: 10 } }));

    const querySource = await request('POST', '/api/dashboards/data-sources', { dataSourceKey: querySourceKey, name: 'Smoke guarded query', sourceType: 'select_query', querySql: 'SELECT company_name AS label, id AS value FROM customers WHERE id >= :minimum_id ORDER BY id', rowLimit: 5, timeoutMs: 5000 });
    assert.equal(querySource.status, 201, JSON.stringify(querySource.body));
    assert.deepEqual(querySource.body.dataSource.parameters.map((parameter) => parameter.name), ['minimum_id']);
    const missingParameter = await request('POST', `/api/dashboards/data-sources/${querySourceKey}/execute`, { parameters: {} });
    assert.equal(missingParameter.status, 422);
    const unknownParameter = await request('POST', `/api/dashboards/data-sources/${querySourceKey}/execute`, { parameters: { minimum_id: 1, injected: 2 } });
    assert.equal(unknownParameter.status, 422);
    const queryResult = await request('POST', `/api/dashboards/data-sources/${querySourceKey}/execute`, { parameters: { minimum_id: 1 }, limit: 2 });
    assert.equal(queryResult.status, 200, JSON.stringify(queryResult.body));
    assert.ok(queryResult.body.rows.length <= 2);
    assert.equal(queryResult.body.page.limit, 2);

    const dashboard = await request('POST', '/api/dashboards', { dashboardKey: filterDashboardKey, name: 'Filter smoke dashboard' });
    assert.equal(dashboard.status, 201, JSON.stringify(dashboard.body));
    const configured = await request('PUT', `/api/dashboards/${filterDashboardKey}/configuration`, {
      widgets: [{ widgetKey: 'filtered_table', dataSourceKey: querySourceKey, type: 'table', title: 'Filtered table', layout: {}, config: { mappings: { tableFields: ['label', 'value'] } } }],
      filters: [{ filterKey: 'minimum_id', name: 'Minimum ID', type: 'search', config: { dataSourceKey: querySourceKey, parameterName: 'minimum_id', required: true, defaultValue: 1, shareInUrl: true } }],
      permissions: []
    });
    assert.equal(configured.status, 200, JSON.stringify(configured.body));
    assert.equal(configured.body.filters[0].config.parameterName, 'minimum_id');
    const invalidMapping = await request('PUT', `/api/dashboards/${filterDashboardKey}/configuration`, {
      widgets: [], filters: [{ filterKey: 'bad', name: 'Bad mapping', type: 'search', config: { dataSourceKey: querySourceKey, parameterName: 'not_declared' } }], permissions: []
    });
    assert.equal(invalidMapping.status, 422);

    const unregistered = await request('POST', '/api/dashboards/data-sources/not_registered/execute', {});
    assert.equal(unregistered.status, 404);
    process.stdout.write('Dashboard guarded-query smoke passed.\n');
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await pool.execute('DELETE FROM crm_dashboards WHERE dashboard_key = ?', [filterDashboardKey]);
    await pool.execute('DELETE FROM crm_dashboard_data_sources WHERE data_source_key IN (?, ?)', [viewSourceKey, querySourceKey]);
    await pool.query(`DROP VIEW IF EXISTS \`${viewName}\``);
    await dashboardPool.end();
    await pool.end();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
