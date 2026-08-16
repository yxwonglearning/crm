const assert = require('assert/strict');
const { pool, dashboardPool } = require('../../src/database/pool');
const service = require('../../src/modules/dashboards/dashboards.service');
const repository = require('../../src/modules/dashboards/dashboards.repository');

const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const dashboardKey = `smoke_dashboard_${suffix}`;
const dataSourceKey = `smoke_source_${suffix}`;

async function main() {
  try {
    const createdSource = await service.createDataSource({
      dataSourceKey,
      name: 'Persistence smoke source',
      sourceType: 'sql_view',
      viewName: 'vw_dashboard_smoke',
      columns: [{ key: 'label', type: 'string' }, { key: 'value', type: 'number' }],
      rowLimit: 500,
      timeoutMs: 5000
    });
    assert.equal(createdSource.dataSource.dataSourceKey, dataSourceKey);
    assert.equal(createdSource.dataSource.validationStatus, 'untested');

    const createdDashboard = await service.createDashboard({
      dashboardKey,
      name: 'Persistence smoke dashboard',
      settings: { columns: 12 }
    });
    assert.equal(createdDashboard.dashboard.status, 'draft');

    await assert.rejects(
      service.updateDashboard(dashboardKey, { dashboardKey: `${dashboardKey}_changed` }),
      (error) => error.statusCode === 409
    );

    const configuration = await service.replaceConfiguration(dashboardKey, {
      widgets: [{
        widgetKey: 'customers_by_status',
        dataSourceKey,
        type: 'donut',
        title: 'Customers by status',
        layout: { x: 0, y: 0, width: 4, height: 3 },
        config: { labelField: 'label', valueField: 'value', drillDown: { type: 'dashboard', targetKey: dashboardKey, allowedParameters: ['status'] } }
      }],
      filters: [],
      permissions: [{ subjectType: 'role', subjectKey: 'manager', canView: true, canConfigure: false }]
    });
    assert.equal(configuration.widgets.length, 1);
    assert.equal(configuration.filters.length, 0);
    assert.equal(configuration.permissions.length, 1);

    await assert.rejects(
      service.archiveDataSource(dataSourceKey),
      (error) => error.statusCode === 409
    );

    const version = await service.createVersion(dashboardKey, { name: 'Initial draft', remark: 'Persistence smoke checkpoint' });
    assert.equal(version.version.versionNumber, 1);
    assert.equal(version.version.snapshot.widgets[0].widgetKey, 'customers_by_status');
    const published = await service.publishDashboard(dashboardKey);
    assert.equal(published.dashboard.status, 'published');
    assert.equal(published.dashboard.publishedVersionId, published.version.id);
    const managerPage = await service.getPublishedDashboard(dashboardKey, { id: null, role: 'manager', email: 'manager@example.com' }, { audit: false });
    assert.equal(managerPage.dashboard.dashboardKey, dashboardKey);
    assert.equal(managerPage.widgets[0].title, 'Customers by status');
    const drillDown = await service.resolveDrillDown(dashboardKey, 'customers_by_status', { status: 'active', injected: 'blocked' }, { id: null, role: 'manager', email: 'manager@example.com' });
    assert.equal(drillDown.type, 'dashboard');
    assert.deepEqual(drillDown.parameters, { status: 'active' });
    await assert.rejects(service.getPublishedDashboard(dashboardKey, { id: null, role: 'user', email: 'user@example.com' }, { audit: false }), (error) => error.statusCode === 403);
    const managerList = await service.listPublishedDashboards({ id: null, role: 'manager' });
    assert.ok(managerList.dashboards.some((dashboard) => dashboard.dashboardKey === dashboardKey));
    const userList = await service.listPublishedDashboards({ id: null, role: 'user' });
    assert.ok(!userList.dashboards.some((dashboard) => dashboard.dashboardKey === dashboardKey));
    await service.replaceConfiguration(dashboardKey, { widgets: [{ ...configuration.widgets[0], title: 'Changed draft title' }], filters: configuration.filters, permissions: configuration.permissions });
    const isolatedPublishedPage = await service.getPublishedDashboard(dashboardKey, { id: null, role: 'manager' }, { audit: false });
    assert.equal(isolatedPublishedPage.widgets[0].title, 'Customers by status');

    const versions = await service.listVersions(dashboardKey);
    assert.equal(versions.versions.length, 2);
    await service.archiveDashboard(dashboardKey);
    const archived = await service.getDashboard(dashboardKey);
    assert.equal(archived.dashboard.status, 'archived');

    process.stdout.write('Dashboard persistence smoke passed.\n');
  } finally {
    const dashboard = await repository.findDashboardByKey(dashboardKey);
    if (dashboard) {
      await pool.execute('UPDATE crm_dashboards SET published_version_id = NULL WHERE id = ?', [dashboard.id]);
      await pool.execute('DELETE FROM crm_dashboards WHERE id = ?', [dashboard.id]);
    }
    const source = await repository.findDataSourceByKey(dataSourceKey);
    if (source) await pool.execute('DELETE FROM crm_dashboard_data_sources WHERE id = ?', [source.id]);
    await dashboardPool.end();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
