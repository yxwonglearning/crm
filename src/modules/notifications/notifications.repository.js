const { pool } = require('../../database/pool');

function parseJson(value, fallback = {}) { if (!value) return fallback; if (typeof value === 'object') return value; try { return JSON.parse(value); } catch (_error) { return fallback; } }

async function listForUser(userId, filters = {}) {
  const where = ['recipient_user_id = ?']; const values = [userId];
  if (filters.unread) where.push('is_read = 0');
  const limit = Math.min(Math.max(Number(filters.limit) || 50, 1), 100);
  const [rows] = await pool.execute(`SELECT * FROM crm_notifications WHERE ${where.join(' AND ')} ORDER BY created_at DESC, id DESC LIMIT ${limit}`, values);
  const [[count]] = await pool.execute('SELECT COUNT(*) AS total FROM crm_notifications WHERE recipient_user_id = ? AND is_read = 0', [userId]);
  return { unreadCount: Number(count.total), notifications: rows.map((row) => ({ id: Number(row.id), title: row.title, message: row.message,
    type: row.notification_type, requestKey: row.request_key || '', metadata: parseJson(row.metadata_json), read: Boolean(row.is_read), createdAt: row.created_at, readAt: row.read_at })) };
}

async function markRead(id, userId) {
  const [result] = await pool.execute('UPDATE crm_notifications SET is_read = 1, read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE id = ? AND recipient_user_id = ?', [id, userId]);
  return result.affectedRows;
}

async function markAllRead(userId) {
  const [result] = await pool.execute('UPDATE crm_notifications SET is_read = 1, read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE recipient_user_id = ? AND is_read = 0', [userId]);
  return result.affectedRows;
}

async function create(entry) {
  try {
    const [result] = await pool.execute(`INSERT INTO crm_notifications
      (recipient_user_id, title, message, notification_type, request_key, source_event_key, metadata_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)`, [entry.recipientUserId, entry.title, entry.message, entry.type || 'workflow', entry.requestKey || null,
      entry.sourceEventKey || null, JSON.stringify(entry.metadata || {})]);
    return Number(result.insertId);
  } catch (error) { if (error.code === 'ER_DUP_ENTRY') return null; throw error; }
}

async function eventContext(event) {
  const [rows] = await pool.execute(`SELECT instances.request_key, instances.requester_user_id, instances.workflow_version_id,
      definitions.name AS workflow_name, version_stages.name AS stage_name, version_stages.email_policy_json
    FROM crm_workflow_instances instances
    INNER JOIN crm_workflow_definitions definitions ON definitions.id = instances.workflow_id
    LEFT JOIN crm_workflow_instance_stages stages ON stages.id = ?
    LEFT JOIN crm_workflow_version_stages version_stages ON version_stages.id = stages.version_stage_id
    WHERE instances.id = ? LIMIT 1`, [event.instanceStageId || null, event.instanceId]);
  if (!rows[0]) return null;
  const [assignments] = event.instanceStageId ? await pool.execute(`SELECT assignments.approver_user_id, users.email, users.name
    FROM crm_workflow_assignments assignments INNER JOIN users ON users.id = assignments.approver_user_id
    WHERE assignments.instance_stage_id = ? AND assignments.assignment_status = 'pending'`, [event.instanceStageId]) : [[]];
  const [requesterRows] = rows[0].requester_user_id ? await pool.execute('SELECT id, name, email FROM users WHERE id = ? LIMIT 1', [rows[0].requester_user_id]) : [[]];
  return { requestKey: rows[0].request_key, requesterUserId: rows[0].requester_user_id ? Number(rows[0].requester_user_id) : null,
    requester: requesterRows[0] || null, workflowName: rows[0].workflow_name, stageName: rows[0].stage_name || '',
    emailPolicy: parseJson(rows[0].email_policy_json), assignments: assignments.map((row) => ({ userId: Number(row.approver_user_id), email: row.email, name: row.name })) };
}

module.exports = { listForUser, markRead, markAllRead, create, eventContext };
