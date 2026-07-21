const { pool } = require('../../database/pool');

function parseJson(value, fallback) {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

function normalizeFlow(row) {
  return {
    id: row.id,
    flowKey: row.flow_key,
    name: row.name,
    description: row.description || '',
    status: row.flow_status,
    currentVersion: row.current_version,
    publishedVersion: row.published_version || null,
    triggerCategory: row.trigger_category,
    triggerType: row.trigger_type,
    triggerModule: row.trigger_module || '',
    definition: parseJson(row.flow_json, {}),
    updatedAt: row.updated_at,
    createdAt: row.created_at
  };
}

function normalizeRuntimeFlow(row) {
  const flow = normalizeFlow(row);
  flow.definition = parseJson(row.published_flow_json, flow.definition);
  flow.currentVersion = row.published_version || row.current_version;
  return flow;
}

function normalizeConnector(row) {
  return {
    id: row.id,
    connectorKey: row.connector_key,
    name: row.name,
    baseUrl: row.base_url,
    categoryKey: row.category_key || '',
    authType: row.auth_type,
    authConfig: parseJson(row.auth_config_json, {}),
    defaultHeaders: parseJson(row.default_headers_json, {}),
    endpoints: parseJson(row.endpoints_json, []),
    enabled: Boolean(row.is_enabled),
    updatedAt: row.updated_at,
    createdAt: row.created_at
  };
}

function normalizeExecution(row) {
  return {
    id: row.id,
    flowId: row.flow_id,
    flowKey: row.flow_key || '',
    flowName: row.flow_name || '',
    flowVersion: row.flow_version,
    status: row.execution_status,
    triggerPayload: parseJson(row.trigger_payload_json, {}),
    result: parseJson(row.result_json, {}),
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    createdAt: row.created_at
  };
}

async function listFlows(filters = {}) {
  const where = [];
  const values = [];
  if (filters.status && filters.status !== 'all') {
    where.push('flow_status = ?');
    values.push(filters.status);
  }
  if (filters.search) {
    where.push('(name LIKE ? OR flow_key LIKE ? OR trigger_module LIKE ?)');
    const search = `%${filters.search}%`;
    values.push(search, search, search);
  }
  const [rows] = await pool.execute(
    `SELECT *
     FROM crm_action_flows
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY updated_at DESC, id DESC`,
    values
  );
  return rows.map(normalizeFlow);
}

async function findFlowByKey(flowKey) {
  const [rows] = await pool.execute(
    'SELECT * FROM crm_action_flows WHERE flow_key = ? LIMIT 1',
    [flowKey]
  );
  return rows[0] ? normalizeFlow(rows[0]) : null;
}

async function findPublishedFlowByKey(flowKey) {
  const [rows] = await pool.execute(
    "SELECT * FROM crm_action_flows WHERE flow_key = ? AND flow_status = 'enabled' AND published_flow_json IS NOT NULL LIMIT 1",
    [flowKey]
  );
  return rows[0] ? normalizeRuntimeFlow(rows[0]) : null;
}

async function listEnabledFlowsForTrigger(triggerType, triggerModule) {
  const [rows] = await pool.execute(
    `SELECT *
     FROM crm_action_flows
     WHERE flow_status = 'enabled'
       AND trigger_type = ?
       AND (trigger_module = ? OR trigger_module IS NULL OR trigger_module = '')
     ORDER BY id ASC`,
    [triggerType, triggerModule || null]
  );
  return rows.map(normalizeRuntimeFlow);
}

async function listEnabledScheduledFlows() {
  const [rows] = await pool.execute(
    `SELECT * FROM crm_action_flows
     WHERE flow_status = 'enabled' AND trigger_type = 'scheduled'
     ORDER BY id ASC`
  );
  return rows.map(normalizeRuntimeFlow);
}

async function findLatestScheduledExecution(flowId) {
  const [rows] = await pool.execute(
    `SELECT * FROM crm_action_flow_executions
     WHERE flow_id = ? AND JSON_UNQUOTE(JSON_EXTRACT(trigger_payload_json, '$.triggerType')) = 'scheduled'
     ORDER BY created_at DESC, id DESC LIMIT 1`,
    [flowId]
  );
  return rows[0] ? normalizeExecution(rows[0]) : null;
}

async function createFlow(flow, userId) {
  await pool.execute(
    `INSERT INTO crm_action_flows
     (flow_key, name, description, flow_status, current_version, trigger_category, trigger_type, trigger_module, flow_json, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      flow.flowKey,
      flow.name,
      flow.description || null,
      flow.status,
      1,
      flow.triggerCategory,
      flow.triggerType,
      flow.triggerModule || null,
      JSON.stringify(flow.definition || {}),
      userId || null,
      userId || null
    ]
  );
  return findFlowByKey(flow.flowKey);
}

async function updateFlow(flowKey, flow, userId) {
  const fields = [];
  const values = [];
  const columnMap = {
    name: 'name',
    description: 'description',
    status: 'flow_status',
    triggerCategory: 'trigger_category',
    triggerType: 'trigger_type',
    triggerModule: 'trigger_module'
  };
  Object.entries(columnMap).forEach(([key, column]) => {
    if (flow[key] !== undefined) {
      fields.push(`${column} = ?`);
      values.push(flow[key] || null);
    }
  });
  if (flow.definition !== undefined) {
    fields.push('flow_json = ?');
    values.push(JSON.stringify(flow.definition || {}));
  }
  if (flow.bumpVersion) {
    fields.push('current_version = current_version + 1');
  }
  if (flow.currentVersion !== undefined) {
    fields.push('current_version = ?');
    values.push(flow.currentVersion);
  }
  fields.push('updated_by = ?');
  values.push(userId || null);
  values.push(flowKey);
  await pool.execute(`UPDATE crm_action_flows SET ${fields.join(', ')} WHERE flow_key = ?`, values);
  return findFlowByKey(flowKey);
}

async function createFlowVersion(flowKey, entry, userId) {
  const flow = await findFlowByKey(flowKey);
  if (!flow) return null;
  const [rows] = await pool.execute(
    'SELECT COALESCE(MAX(version_number), 0) AS latest_version FROM crm_action_flow_versions WHERE flow_id = ?',
    [flow.id]
  );
  const versionNumber = Math.max(Number(rows[0]?.latest_version || 0), Number(flow.currentVersion || 0)) + (entry.useCurrentVersion ? 0 : 1);
  const [result] = await pool.execute(
    `INSERT INTO crm_action_flow_versions (flow_id, version_number, action, summary, snapshot_json, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [flow.id, versionNumber, entry.action, entry.summary || null, JSON.stringify(entry.snapshot), userId || null]
  );
  await pool.execute('UPDATE crm_action_flows SET current_version = ?, updated_by = ? WHERE id = ?', [versionNumber, userId || null, flow.id]);
  return { id: result.insertId, versionNumber };
}

async function listFlowVersions(flowKey, limit = 30) {
  const flow = await findFlowByKey(flowKey);
  if (!flow) return null;
  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);
  const [rows] = await pool.execute(
    `SELECT versions.id, versions.version_number, versions.action, versions.summary, versions.created_at,
            users.name AS created_by_name, users.email AS created_by_email
     FROM crm_action_flow_versions versions
     LEFT JOIN users ON users.id = versions.created_by
     WHERE versions.flow_id = ? ORDER BY versions.version_number DESC LIMIT ${safeLimit}`,
    [flow.id]
  );
  return rows.map((row) => ({
    id: row.id,
    versionNumber: row.version_number,
    action: row.action,
    summary: row.summary || '',
    createdAt: row.created_at,
    createdBy: { name: row.created_by_name || '', email: row.created_by_email || '' }
  }));
}

async function findFlowVersion(flowKey, versionId) {
  const flow = await findFlowByKey(flowKey);
  if (!flow) return null;
  const [rows] = await pool.execute(
    'SELECT * FROM crm_action_flow_versions WHERE flow_id = ? AND id = ? LIMIT 1',
    [flow.id, versionId]
  );
  if (!rows[0]) return null;
  return { id: rows[0].id, versionNumber: rows[0].version_number, snapshot: parseJson(rows[0].snapshot_json, {}) };
}

async function publishFlow(flowKey, versionNumber, userId) {
  await pool.execute(
    `UPDATE crm_action_flows
     SET published_flow_json = flow_json, published_version = ?, current_version = ?, flow_status = 'enabled', updated_by = ?
     WHERE flow_key = ?`,
    [versionNumber, versionNumber, userId || null, flowKey]
  );
  return findFlowByKey(flowKey);
}

async function deleteFlow(flowKey) {
  const [result] = await pool.execute('DELETE FROM crm_action_flows WHERE flow_key = ?', [flowKey]);
  return result.affectedRows;
}

async function listConnectors() {
  const [rows] = await pool.execute('SELECT * FROM crm_api_connectors ORDER BY name ASC');
  return rows.map(normalizeConnector);
}

function normalizeConnectorCategory(row) {
  return { id: row.id, categoryKey: row.category_key, name: row.name, description: row.description || '', updatedAt: row.updated_at, createdAt: row.created_at };
}

async function listConnectorCategories() {
  const [rows] = await pool.execute('SELECT * FROM crm_api_connector_categories ORDER BY name ASC');
  return rows.map(normalizeConnectorCategory);
}

async function findConnectorCategoryByKey(categoryKey) {
  const [rows] = await pool.execute('SELECT * FROM crm_api_connector_categories WHERE category_key = ? LIMIT 1', [categoryKey]);
  return rows[0] ? normalizeConnectorCategory(rows[0]) : null;
}

async function saveConnectorCategory(category, userId) {
  await pool.execute(
    `INSERT INTO crm_api_connector_categories (category_key, name, description, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), updated_by = VALUES(updated_by)`,
    [category.categoryKey, category.name, category.description || null, userId || null, userId || null]
  );
  return findConnectorCategoryByKey(category.categoryKey);
}

async function countConnectorsByCategory(categoryKey) {
  const [rows] = await pool.execute('SELECT COUNT(*) AS count FROM crm_api_connectors WHERE category_key = ?', [categoryKey]);
  return Number(rows[0]?.count || 0);
}

async function deleteConnectorCategory(categoryKey) {
  const [result] = await pool.execute('DELETE FROM crm_api_connector_categories WHERE category_key = ?', [categoryKey]);
  return result.affectedRows;
}

async function findConnectorByKey(connectorKey) {
  const [rows] = await pool.execute(
    'SELECT * FROM crm_api_connectors WHERE connector_key = ? LIMIT 1',
    [connectorKey]
  );
  return rows[0] ? normalizeConnector(rows[0]) : null;
}

async function saveConnector(connector, userId) {
  await pool.execute(
    `INSERT INTO crm_api_connectors
     (connector_key, name, base_url, category_key, auth_type, auth_config_json, default_headers_json, endpoints_json, is_enabled, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       base_url = VALUES(base_url),
       category_key = VALUES(category_key),
       auth_type = VALUES(auth_type),
       auth_config_json = VALUES(auth_config_json),
       default_headers_json = VALUES(default_headers_json),
       endpoints_json = VALUES(endpoints_json),
       is_enabled = VALUES(is_enabled),
       updated_by = VALUES(updated_by)`,
    [
      connector.connectorKey,
      connector.name,
      connector.baseUrl,
      connector.categoryKey || null,
      connector.authType,
      JSON.stringify(connector.authConfig || {}),
      JSON.stringify(connector.defaultHeaders || {}),
      JSON.stringify(connector.endpoints || []),
      connector.enabled === false ? 0 : 1,
      userId || null,
      userId || null
    ]
  );
  return findConnectorByKey(connector.connectorKey);
}

async function deleteConnector(connectorKey) {
  const [result] = await pool.execute('DELETE FROM crm_api_connectors WHERE connector_key = ?', [connectorKey]);
  return result.affectedRows;
}

async function createExecution(flow, triggerPayload = {}) {
  const [result] = await pool.execute(
    `INSERT INTO crm_action_flow_executions
     (flow_id, flow_version, execution_status, trigger_payload_json, started_at)
     VALUES (?, ?, 'running', ?, CURRENT_TIMESTAMP)`,
    [
      flow.id,
      flow.currentVersion || 1,
      JSON.stringify(triggerPayload || {})
    ]
  );
  return result.insertId;
}

async function finishExecution(executionId, status, result = {}) {
  await pool.execute(
    `UPDATE crm_action_flow_executions
     SET execution_status = ?, result_json = ?, finished_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [status, JSON.stringify(result || {}), executionId]
  );
}

async function listExecutions(flowKey, limit = 50) {
  const values = [];
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  let where = '';
  if (flowKey) {
    where = 'WHERE flows.flow_key = ?';
    values.push(flowKey);
  }
  const [rows] = await pool.execute(
    `SELECT executions.*, flows.flow_key, flows.name AS flow_name
     FROM crm_action_flow_executions executions
     INNER JOIN crm_action_flows flows ON flows.id = executions.flow_id
     ${where}
     ORDER BY executions.created_at DESC, executions.id DESC
     LIMIT ${safeLimit}`,
    values
  );
  return rows.map(normalizeExecution);
}

async function createTask(task) {
  const [result] = await pool.execute(
    `INSERT INTO crm_tasks
     (title, description, assignee_user_id, due_at, priority, source_flow_id, source_execution_id, source_node_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      task.title,
      task.description || null,
      task.assigneeUserId || null,
      task.dueAt || null,
      task.priority || 'normal',
      task.sourceFlowId || null,
      task.sourceExecutionId || null,
      task.sourceNodeId || null,
      task.createdBy || null
    ]
  );
  return result.insertId;
}

async function createNotification(notification) {
  const [result] = await pool.execute(
    `INSERT INTO crm_notifications
     (recipient_user_id, title, message, source_flow_id, source_execution_id, source_node_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      notification.recipientUserId,
      notification.title,
      notification.message,
      notification.sourceFlowId || null,
      notification.sourceExecutionId || null,
      notification.sourceNodeId || null
    ]
  );
  return result.insertId;
}

module.exports = {
  listFlows,
  findFlowByKey,
  findPublishedFlowByKey,
  listEnabledFlowsForTrigger,
  listEnabledScheduledFlows,
  findLatestScheduledExecution,
  createFlow,
  updateFlow,
  createFlowVersion,
  listFlowVersions,
  findFlowVersion,
  publishFlow,
  deleteFlow,
  listConnectors,
  listConnectorCategories,
  saveConnectorCategory,
  countConnectorsByCategory,
  deleteConnectorCategory,
  findConnectorByKey,
  saveConnector,
  deleteConnector,
  createExecution,
  finishExecution,
  listExecutions,
  createTask,
  createNotification
};
