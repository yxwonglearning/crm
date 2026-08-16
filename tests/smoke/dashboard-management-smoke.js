const http = require('http');
const assert = require('assert/strict');
const { createApp } = require('../../src/app');
const { pool, dashboardPool } = require('../../src/database/pool');
const { config } = require('../../src/shared/config');
const repository = require('../../src/modules/dashboards/dashboards.repository');

const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const dashboardKey = `smoke_board_${suffix}`;
const duplicateKey = `${dashboardKey}_copy`;
let server;
let baseUrl = '';
let token = '';

async function request(method, path, json, auth = true) {
  const headers = {};
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  let body;
  if (json !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(json); }
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body });
  return { status: response.status, body: await response.json() };
}

async function main() {
  try {
    server = http.createServer(createApp());
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    const html = await (await fetch(`${baseUrl}/`)).text();
    const script = await (await fetch(`${baseUrl}/app.js`)).text();
    const css = await (await fetch(`${baseUrl}/styles.css`)).text();
    for (const marker of ['dashboardPagesView', 'publishedDashboardList', 'publishedDashboardCanvas', 'publishedDashboardNavigation', 'publishedDashboardSelector', 'adminDashboardBuilderSection', 'dashboardManagementRows', 'dashboardBuilderStudio', 'previewDashboardButton', 'dashboardAccessButton', 'publishDashboardButton', 'dashboardAccessDrawer', 'dashboardLifecycleButton', 'dashboardLifecycleDrawer', 'dashboardVersionList', 'dashboardCanvas', 'dashboardFilterBar', 'dashboardFilterDrawer', 'dashboardFilterForm', 'dashboardWidgetInspector', 'dashboardWidgetType', 'Pivot table', 'dashboardWidgetDataSource', 'dashboardWidgetMappingFields', 'exportDashboardWidgetExcelButton', 'dashboardFormModal']) assert.ok(html.includes(marker));
    for (const marker of ['crm:last-dashboard:', 'loadPublishedDashboards', 'openPublishedDashboard', 'renderPublishedDashboardCanvas', 'publishActiveDashboard', 'renderDashboardAccessRules', 'openDashboardLifecycleDrawer', 'createDashboardCheckpoint', 'restoreDashboardVersion', 'exportDashboardConfiguration', 'importDashboardConfiguration', 'checkActiveDashboard', 'loadDashboards', 'openDashboardBuilderStudio', 'renderDashboardCanvas', 'syncDashboardCanvasExtent', 'renderDashboardFilterBar', 'dashboardWidgetParameters', 'saveDashboardFilter', 'resetDashboardFilters', 'renderDashboardWidgetResult', 'buildDashboardPivot', 'renderDashboardPivot', 'dashboardPivotExportMatrix', 'exportSelectedDashboardPivotExcel', 'loadDashboardWidgetPreview', 'exportSelectedDashboardWidgetCsv', 'saveDashboardLayout', 'changeDashboardArchiveState']) assert.ok(script.includes(marker));
    assert.ok(!script.includes('`Published version ${configuration.dashboard.currentVersion}`'));
    assert.ok(css.includes('.dashboard-canvas.published-dashboard-canvas'));

    const unauthenticated = await request('GET', '/api/dashboards', undefined, false);
    assert.equal(unauthenticated.status, 401);
    const login = await request('POST', '/api/auth/login', { email: process.env.SMOKE_ADMIN_EMAIL || config.admin.email, password: process.env.SMOKE_ADMIN_PASSWORD || config.admin.password }, false);
    assert.equal(login.status, 200, JSON.stringify(login.body));
    token = login.body.token;

    const created = await request('POST', '/api/dashboards', { dashboardKey, name: 'Smoke dashboard', description: 'Management lifecycle smoke' });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    assert.equal(created.body.dashboard.status, 'draft');
    const initialCheck = await request('POST', `/api/dashboards/${dashboardKey}/check`, {});
    assert.equal(initialCheck.status, 200);
    assert.equal(initialCheck.body.valid, true);
    const checkpoint = await request('POST', `/api/dashboards/${dashboardKey}/versions`, { name: 'Empty baseline', remark: 'Before widgets are added' });
    assert.equal(checkpoint.status, 201, JSON.stringify(checkpoint.body));
    const checkpointId = checkpoint.body.version.id;
    const exported = await request('GET', `/api/dashboards/${dashboardKey}/export`);
    assert.equal(exported.body.format, 'babyyy-dashboard');
    assert.equal(exported.body.formatVersion, 1);
    assert.equal(exported.body.configuration.dashboard, undefined);
    const invalidImport = await request('POST', `/api/dashboards/${dashboardKey}/import`, { format: 'unknown', formatVersion: 1, configuration: {} });
    assert.equal(invalidImport.status, 422);
    const imported = await request('POST', `/api/dashboards/${dashboardKey}/import`, exported.body);
    assert.equal(imported.status, 200, JSON.stringify(imported.body));
    const configured = await request('PUT', `/api/dashboards/${dashboardKey}/configuration`, {
      widgets: [
        { widgetKey: 'sales_kpi', type: 'number', title: 'Sales KPI', layout: { desktop: { x: 1, y: 2, width: 4, height: 3 }, mobile: { x: 0, y: 1, width: 4, height: 2 } }, config: { mappings: { value: 'amount' }, aggregation: 'sum', numberFormat: 'currency', topN: 10 } },
        { widgetKey: 'sales_pivot', type: 'pivot', title: 'Sales Pivot', layout: { desktop: { x: 5, y: 2, width: 7, height: 5 }, mobile: { x: 0, y: 4, width: 4, height: 5 } }, config: { mappings: { pivotRows: ['region', 'owner'], pivotColumns: ['status'], pivotValues: ['amount', 'quantity'] }, aggregation: 'sum', numberFormat: 'currency', showSubtotals: true, showGrandTotals: true, sortDirection: 'desc', emptyLabel: '(empty)' } }
      ],
      filters: [{ filterKey: 'period', name: 'Period', type: 'date_range', config: {} }],
      permissions: [{ subjectType: 'role', subjectKey: 'admin', canView: true, canConfigure: true }]
    });
    assert.equal(configured.status, 200, JSON.stringify(configured.body));
    const configuredDashboard = await request('GET', `/api/dashboards/${dashboardKey}`);
    assert.deepEqual(configuredDashboard.body.widgets[0].layout.desktop, { x: 1, y: 2, width: 4, height: 3 });
    assert.deepEqual(configuredDashboard.body.widgets[0].layout.mobile, { x: 0, y: 1, width: 4, height: 2 });
    assert.equal(configuredDashboard.body.widgets[0].type, 'number');
    assert.equal(configuredDashboard.body.widgets[0].config.mappings.value, 'amount');
    assert.equal(configuredDashboard.body.widgets[0].config.numberFormat, 'currency');
    assert.equal(configuredDashboard.body.widgets[1].type, 'pivot');
    assert.deepEqual(configuredDashboard.body.widgets[1].config.mappings.pivotRows, ['region', 'owner']);
    assert.deepEqual(configuredDashboard.body.widgets[1].config.mappings.pivotValues, ['amount', 'quantity']);
    assert.equal(configuredDashboard.body.widgets[1].config.showGrandTotals, true);

    const list = await request('GET', `/api/dashboards?search=${encodeURIComponent(dashboardKey)}`);
    const listed = list.body.dashboards.find((dashboard) => dashboard.dashboardKey === dashboardKey);
    assert.equal(listed.widgetCount, 2);
    assert.equal(listed.filterCount, 1);

    const updated = await request('PUT', `/api/dashboards/${dashboardKey}`, { name: 'Updated smoke dashboard' });
    assert.equal(updated.body.dashboard.name, 'Updated smoke dashboard');
    const lockedKey = await request('PUT', `/api/dashboards/${dashboardKey}`, { dashboardKey: `${dashboardKey}_changed` });
    assert.equal(lockedKey.status, 409);

    const duplicated = await request('POST', `/api/dashboards/${dashboardKey}/duplicate`, { dashboardKey: duplicateKey, name: 'Smoke dashboard copy' });
    assert.equal(duplicated.status, 201, JSON.stringify(duplicated.body));
    assert.equal(duplicated.body.dashboard.status, 'draft');
    const duplicateConfig = await request('GET', `/api/dashboards/${duplicateKey}`);
    assert.equal(duplicateConfig.body.widgets.length, 2);
    assert.equal(duplicateConfig.body.filters.length, 1);
    assert.equal(duplicateConfig.body.permissions.length, 1);

    const versions = await request('GET', `/api/dashboards/${dashboardKey}/versions`);
    assert.ok(versions.body.versions.length >= 2);
    const restored = await request('POST', `/api/dashboards/${dashboardKey}/versions/${checkpointId}/restore`, { remark: 'Lifecycle smoke restore' });
    assert.equal(restored.status, 200, JSON.stringify(restored.body));
    assert.equal(restored.body.configuration.widgets.length, 0);
    const versionsAfterRestore = await request('GET', `/api/dashboards/${dashboardKey}/versions`);
    assert.equal(versionsAfterRestore.body.versions[0].action, 'restore');

    const archived = await request('POST', `/api/dashboards/${dashboardKey}/archive`);
    assert.equal(archived.body.dashboard.status, 'archived');
    const reopened = await request('POST', `/api/dashboards/${dashboardKey}/reopen`);
    assert.equal(reopened.body.dashboard.status, 'draft');
    process.stdout.write('Dashboard management smoke passed.\n');
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    for (const key of [dashboardKey, duplicateKey]) {
      const dashboard = await repository.findDashboardByKey(key);
      if (dashboard) {
        await pool.execute('UPDATE crm_dashboards SET published_version_id = NULL WHERE id = ?', [dashboard.id]);
        await pool.execute('DELETE FROM crm_dashboards WHERE id = ?', [dashboard.id]);
      }
    }
    await dashboardPool.end();
    await pool.end();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
