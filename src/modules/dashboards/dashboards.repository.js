const { pool } = require('../../database/pool');

function parseJson(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch (_error) { return fallback; }
}

function dashboardRow(row) {
  return {
    id: Number(row.id), dashboardKey: row.dashboard_key, name: row.name,
    description: row.description || '', status: row.dashboard_status,
    currentVersion: Number(row.current_version || 0),
    publishedVersionId: row.published_version_id ? Number(row.published_version_id) : null,
    settings: parseJson(row.settings_json, {}),
    widgetCount: Number(row.widget_count || 0), filterCount: Number(row.filter_count || 0),
    createdAt: row.created_at, updatedAt: row.updated_at
  };
}

function dataSourceRow(row) {
  return {
    id: Number(row.id), dataSourceKey: row.data_source_key, name: row.name,
    description: row.description || '', sourceType: row.source_type,
    viewName: row.view_name || '', querySql: row.query_sql || '',
    columns: parseJson(row.columns_json, []), parameters: parseJson(row.parameters_json, []),
    rowLimit: Number(row.row_limit), timeoutMs: Number(row.timeout_ms),
    validationStatus: row.validation_status, validationMessage: row.validation_message || '',
    lastTestedAt: row.last_tested_at, archived: Boolean(row.is_archived),
    createdAt: row.created_at, updatedAt: row.updated_at
  };
}

async function listDashboards(filters = {}) {
  const where = [];
  const values = [];
  if (filters.status && filters.status !== 'all') { where.push('dashboard_status = ?'); values.push(filters.status); }
  if (filters.search) {
    const search = `%${filters.search}%`;
    where.push('(dashboard_key LIKE ? OR name LIKE ?)'); values.push(search, search);
  }
  const [rows] = await pool.execute(
    `SELECT d.*,
            (SELECT COUNT(*) FROM crm_dashboard_widgets w WHERE w.dashboard_id = d.id AND w.is_archived = 0) AS widget_count,
            (SELECT COUNT(*) FROM crm_dashboard_filters f WHERE f.dashboard_id = d.id AND f.is_archived = 0) AS filter_count
     FROM crm_dashboards d ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY d.updated_at DESC, d.id DESC`, values
  );
  return rows.map(dashboardRow);
}

async function findDashboardByKey(dashboardKey, connection = pool) {
  const [rows] = await connection.execute('SELECT * FROM crm_dashboards WHERE dashboard_key = ? LIMIT 1', [dashboardKey]);
  return rows[0] ? dashboardRow(rows[0]) : null;
}

async function createDashboard(input, userId = null) {
  await pool.execute(
    `INSERT INTO crm_dashboards (dashboard_key, name, description, dashboard_status, settings_json, created_by, updated_by)
     VALUES (?, ?, ?, 'draft', ?, ?, ?)`,
    [input.dashboardKey, input.name, input.description || null, JSON.stringify(input.settings || {}), userId, userId]
  );
  return findDashboardByKey(input.dashboardKey);
}

async function updateDashboard(dashboardKey, input, userId = null) {
  const fields = [];
  const values = [];
  for (const [key, column] of Object.entries({ name: 'name', description: 'description', status: 'dashboard_status' })) {
    if (input[key] !== undefined) { fields.push(`${column} = ?`); values.push(input[key] || null); }
  }
  if (input.settings !== undefined) { fields.push('settings_json = ?'); values.push(JSON.stringify(input.settings || {})); }
  fields.push('updated_by = ?'); values.push(userId);
  values.push(dashboardKey);
  await pool.execute(`UPDATE crm_dashboards SET ${fields.join(', ')} WHERE dashboard_key = ?`, values);
  return findDashboardByKey(dashboardKey);
}

async function duplicateDashboard(sourceKey, target, userId = null) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const source = await findDashboardByKey(sourceKey, connection);
    if (!source) { await connection.rollback(); return null; }
    const [result] = await connection.execute(
      `INSERT INTO crm_dashboards (dashboard_key, name, description, dashboard_status, current_version, settings_json, created_by, updated_by)
       VALUES (?, ?, ?, 'draft', 0, ?, ?, ?)`,
      [target.dashboardKey, target.name, target.description || null, JSON.stringify(source.settings || {}), userId, userId]
    );
    const targetId = result.insertId;
    await connection.execute(
      `INSERT INTO crm_dashboard_widgets (dashboard_id, widget_key, data_source_id, widget_type, title, description, sort_order, layout_json, config_json, is_archived)
       SELECT ?, widget_key, data_source_id, widget_type, title, description, sort_order, layout_json, config_json, is_archived
       FROM crm_dashboard_widgets WHERE dashboard_id = ?`, [targetId, source.id]
    );
    await connection.execute(
      `INSERT INTO crm_dashboard_filters (dashboard_id, filter_key, name, filter_type, sort_order, config_json, is_archived)
       SELECT ?, filter_key, name, filter_type, sort_order, config_json, is_archived
       FROM crm_dashboard_filters WHERE dashboard_id = ?`, [targetId, source.id]
    );
    await connection.execute(
      `INSERT INTO crm_dashboard_permissions (dashboard_id, subject_type, subject_key, can_view, can_configure)
       SELECT ?, subject_type, subject_key, can_view, can_configure
       FROM crm_dashboard_permissions WHERE dashboard_id = ?`, [targetId, source.id]
    );
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  return findDashboardByKey(target.dashboardKey);
}

async function listDataSources(filters = {}) {
  const where = [];
  const values = [];
  if (filters.archived !== undefined) { where.push('is_archived = ?'); values.push(filters.archived ? 1 : 0); }
  if (filters.sourceType) { where.push('source_type = ?'); values.push(filters.sourceType); }
  const [rows] = await pool.execute(
    `SELECT * FROM crm_dashboard_data_sources ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY updated_at DESC, id DESC`, values
  );
  return rows.map(dataSourceRow);
}

async function findDataSourceByKey(dataSourceKey) {
  const [rows] = await pool.execute('SELECT * FROM crm_dashboard_data_sources WHERE data_source_key = ? LIMIT 1', [dataSourceKey]);
  return rows[0] ? dataSourceRow(rows[0]) : null;
}

async function createDataSource(input, userId = null) {
  await pool.execute(
    `INSERT INTO crm_dashboard_data_sources
     (data_source_key, name, description, source_type, view_name, query_sql, columns_json, parameters_json, row_limit, timeout_ms, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [input.dataSourceKey, input.name, input.description || null, input.sourceType, input.viewName || null,
      input.querySql || null, JSON.stringify(input.columns || []), JSON.stringify(input.parameters || []),
      input.rowLimit, input.timeoutMs, userId, userId]
  );
  return findDataSourceByKey(input.dataSourceKey);
}

async function updateDataSource(dataSourceKey, input, userId = null) {
  const fields = [];
  const values = [];
  const scalar = { name: 'name', description: 'description', sourceType: 'source_type', viewName: 'view_name', querySql: 'query_sql', rowLimit: 'row_limit', timeoutMs: 'timeout_ms', validationStatus: 'validation_status', validationMessage: 'validation_message', archived: 'is_archived' };
  for (const [key, column] of Object.entries(scalar)) {
    if (input[key] !== undefined) { fields.push(`${column} = ?`); values.push(key === 'archived' ? (input[key] ? 1 : 0) : (input[key] || null)); }
  }
  for (const [key, column] of Object.entries({ columns: 'columns_json', parameters: 'parameters_json' })) {
    if (input[key] !== undefined) { fields.push(`${column} = ?`); values.push(JSON.stringify(input[key] || [])); }
  }
  if (input.lastTestedAt !== undefined) { fields.push('last_tested_at = ?'); values.push(input.lastTestedAt); }
  fields.push('updated_by = ?'); values.push(userId); values.push(dataSourceKey);
  await pool.execute(`UPDATE crm_dashboard_data_sources SET ${fields.join(', ')} WHERE data_source_key = ?`, values);
  return findDataSourceByKey(dataSourceKey);
}

async function dataSourceUsageCount(dataSourceId) {
  const [rows] = await pool.execute('SELECT COUNT(*) AS count FROM crm_dashboard_widgets WHERE data_source_id = ? AND is_archived = 0', [dataSourceId]);
  return Number(rows[0]?.count || 0);
}

async function dashboardConfiguration(dashboardKey, connection = pool) {
  const dashboard = await findDashboardByKey(dashboardKey, connection);
  if (!dashboard) return null;
  const [widgets] = await connection.execute(
    `SELECT w.*, d.data_source_key FROM crm_dashboard_widgets w
     LEFT JOIN crm_dashboard_data_sources d ON d.id = w.data_source_id
     WHERE w.dashboard_id = ? ORDER BY w.sort_order, w.id`, [dashboard.id]
  );
  const [filters] = await connection.execute('SELECT * FROM crm_dashboard_filters WHERE dashboard_id = ? ORDER BY sort_order, id', [dashboard.id]);
  const [permissions] = await connection.execute('SELECT * FROM crm_dashboard_permissions WHERE dashboard_id = ? ORDER BY subject_type, subject_key', [dashboard.id]);
  return {
    dashboard,
    widgets: widgets.map((row) => ({ id: Number(row.id), widgetKey: row.widget_key, dataSourceKey: row.data_source_key || '', type: row.widget_type, title: row.title, description: row.description || '', sortOrder: Number(row.sort_order), layout: parseJson(row.layout_json, {}), config: parseJson(row.config_json, {}), archived: Boolean(row.is_archived) })),
    filters: filters.map((row) => ({ id: Number(row.id), filterKey: row.filter_key, name: row.name, type: row.filter_type, sortOrder: Number(row.sort_order), config: parseJson(row.config_json, {}), archived: Boolean(row.is_archived) })),
    permissions: permissions.map((row) => ({ id: Number(row.id), subjectType: row.subject_type, subjectKey: row.subject_key, canView: Boolean(row.can_view), canConfigure: Boolean(row.can_configure) }))
  };
}

async function replaceDashboardConfiguration(dashboardKey, input, userId = null) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const dashboard = await findDashboardByKey(dashboardKey, connection);
    if (!dashboard) { await connection.rollback(); return null; }
    await connection.execute('DELETE FROM crm_dashboard_widgets WHERE dashboard_id = ?', [dashboard.id]);
    await connection.execute('DELETE FROM crm_dashboard_filters WHERE dashboard_id = ?', [dashboard.id]);
    await connection.execute('DELETE FROM crm_dashboard_permissions WHERE dashboard_id = ?', [dashboard.id]);
    for (const [index, widget] of (input.widgets || []).entries()) {
      let dataSourceId = null;
      if (widget.dataSourceKey) {
        const [sources] = await connection.execute('SELECT id FROM crm_dashboard_data_sources WHERE data_source_key = ? AND is_archived = 0 LIMIT 1', [widget.dataSourceKey]);
        if (!sources[0]) { const error = new Error(`Dashboard data source not found: ${widget.dataSourceKey}`); error.code = 'DASHBOARD_DATA_SOURCE_NOT_FOUND'; throw error; }
        dataSourceId = sources[0].id;
      }
      await connection.execute(
        `INSERT INTO crm_dashboard_widgets (dashboard_id, widget_key, data_source_id, widget_type, title, description, sort_order, layout_json, config_json, is_archived)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [dashboard.id, widget.widgetKey, dataSourceId, widget.type, widget.title, widget.description || null, widget.sortOrder ?? index, JSON.stringify(widget.layout || {}), JSON.stringify(widget.config || {}), widget.archived ? 1 : 0]
      );
    }
    for (const [index, filter] of (input.filters || []).entries()) {
      await connection.execute(
        `INSERT INTO crm_dashboard_filters (dashboard_id, filter_key, name, filter_type, sort_order, config_json, is_archived)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [dashboard.id, filter.filterKey, filter.name, filter.type, filter.sortOrder ?? index, JSON.stringify(filter.config || {}), filter.archived ? 1 : 0]
      );
    }
    for (const permission of (input.permissions || [])) {
      await connection.execute(
        `INSERT INTO crm_dashboard_permissions (dashboard_id, subject_type, subject_key, can_view, can_configure)
         VALUES (?, ?, ?, ?, ?)`,
        [dashboard.id, permission.subjectType, permission.subjectKey, permission.canView ? 1 : 0, permission.canConfigure ? 1 : 0]
      );
    }
    await connection.execute('UPDATE crm_dashboards SET updated_by = ? WHERE id = ?', [userId, dashboard.id]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
  return dashboardConfiguration(dashboardKey);
}

async function createDashboardVersion(dashboardKey, entry, userId = null) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const configuration = await dashboardConfiguration(dashboardKey, connection);
    if (!configuration) { await connection.rollback(); return null; }
    const [rows] = await connection.execute('SELECT COALESCE(MAX(version_number), 0) AS latest FROM crm_dashboard_versions WHERE dashboard_id = ? FOR UPDATE', [configuration.dashboard.id]);
    const versionNumber = Number(rows[0]?.latest || 0) + 1;
    const snapshot = entry.snapshot || configuration;
    const [result] = await connection.execute(
      `INSERT INTO crm_dashboard_versions (dashboard_id, version_number, version_action, name, remark, snapshot_json, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [configuration.dashboard.id, versionNumber, entry.action || 'checkpoint', entry.name || null, entry.remark || null, JSON.stringify(snapshot), userId]
    );
    await connection.execute('UPDATE crm_dashboards SET current_version = ?, updated_by = ? WHERE id = ?', [versionNumber, userId, configuration.dashboard.id]);
    await connection.commit();
    return { id: Number(result.insertId), versionNumber, snapshot };
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}

async function listDashboardVersions(dashboardKey) {
  const dashboard = await findDashboardByKey(dashboardKey);
  if (!dashboard) return null;
  const [rows] = await pool.execute(
    `SELECT id, version_number, version_action, name, remark, created_by, created_at
     FROM crm_dashboard_versions WHERE dashboard_id = ? ORDER BY version_number DESC`, [dashboard.id]
  );
  return rows.map((row) => ({ id: Number(row.id), versionNumber: Number(row.version_number), action: row.version_action, name: row.name || '', remark: row.remark || '', createdBy: row.created_by ? Number(row.created_by) : null, createdAt: row.created_at }));
}

async function findDashboardVersion(dashboardKey, versionId) {
  const [rows] = await pool.execute(
    `SELECT v.*, d.dashboard_key FROM crm_dashboard_versions v
     INNER JOIN crm_dashboards d ON d.id = v.dashboard_id
     WHERE d.dashboard_key = ? AND v.id = ? LIMIT 1`, [dashboardKey, versionId]
  );
  if (!rows[0]) return null;
  return { id: Number(rows[0].id), versionNumber: Number(rows[0].version_number), action: rows[0].version_action, name: rows[0].name || '', remark: rows[0].remark || '', snapshot: parseJson(rows[0].snapshot_json, {}), createdAt: rows[0].created_at };
}

async function setPublishedVersion(dashboardKey, versionId, userId = null) {
  const [result] = await pool.execute(
    `UPDATE crm_dashboards d INNER JOIN crm_dashboard_versions v ON v.dashboard_id = d.id
     SET d.published_version_id = v.id, d.dashboard_status = 'published', d.updated_by = ?
     WHERE d.dashboard_key = ? AND v.id = ?`, [userId, dashboardKey, versionId]
  );
  return result.affectedRows ? findDashboardByKey(dashboardKey) : null;
}

async function publishConfiguration(dashboardKey, configuration, userId = null) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const dashboard = await findDashboardByKey(dashboardKey, connection);
    if (!dashboard) { await connection.rollback(); return null; }
    const [rows] = await connection.execute('SELECT COALESCE(MAX(version_number), 0) AS latest FROM crm_dashboard_versions WHERE dashboard_id = ? FOR UPDATE', [dashboard.id]);
    const versionNumber = Number(rows[0]?.latest || 0) + 1;
    const [result] = await connection.execute(
      `INSERT INTO crm_dashboard_versions (dashboard_id, version_number, version_action, name, remark, snapshot_json, created_by)
       VALUES (?, ?, 'publish', ?, ?, ?, ?)`,
      [dashboard.id, versionNumber, `Published v${versionNumber}`, `Published version ${versionNumber}`, JSON.stringify(configuration), userId]
    );
    await connection.execute("UPDATE crm_dashboards SET current_version = ?, published_version_id = ?, dashboard_status = 'published', updated_by = ? WHERE id = ?", [versionNumber, result.insertId, userId, dashboard.id]);
    await connection.commit();
    return { dashboard: await findDashboardByKey(dashboardKey), version: { id: Number(result.insertId), versionNumber } };
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}

async function publishedConfiguration(dashboardKey) {
  const [rows] = await pool.execute(
    `SELECT d.dashboard_key, d.name, d.description, d.dashboard_status, v.id AS version_id, v.version_number, v.snapshot_json, v.created_at AS published_at
     FROM crm_dashboards d INNER JOIN crm_dashboard_versions v ON v.id = d.published_version_id
     WHERE d.dashboard_key = ? AND d.dashboard_status = 'published' LIMIT 1`, [dashboardKey]
  );
  if (!rows[0]) return null;
  const snapshot = parseJson(rows[0].snapshot_json, {});
  return { ...snapshot, dashboard: { ...(snapshot.dashboard || {}), dashboardKey: rows[0].dashboard_key, name: rows[0].name, description: rows[0].description || '', status: 'published', publishedVersionId: Number(rows[0].version_id), currentVersion: Number(rows[0].version_number), publishedAt: rows[0].published_at } };
}

async function listPublishedConfigurations() {
  const [rows] = await pool.execute("SELECT dashboard_key FROM crm_dashboards WHERE dashboard_status = 'published' AND published_version_id IS NOT NULL ORDER BY name");
  return Promise.all(rows.map((row) => publishedConfiguration(row.dashboard_key)));
}

async function userOrganizationNodeId(userId) {
  const [rows] = await pool.execute('SELECT organization_node_id FROM users WHERE id = ? AND status = \'active\' LIMIT 1', [userId]);
  return rows[0]?.organization_node_id ? Number(rows[0].organization_node_id) : null;
}

module.exports = {
  listDashboards, findDashboardByKey, createDashboard, updateDashboard, duplicateDashboard,
  listDataSources, findDataSourceByKey, createDataSource, updateDataSource, dataSourceUsageCount,
  dashboardConfiguration, replaceDashboardConfiguration,
  createDashboardVersion, listDashboardVersions, findDashboardVersion, setPublishedVersion, publishConfiguration,
  publishedConfiguration, listPublishedConfigurations, userOrganizationNodeId
};
