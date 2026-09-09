const { pool } = require('../../database/pool');

function taskRow(row) {
  return {
    id: Number(row.id), title: row.title, description: row.description || '',
    dueAt: row.due_at, priority: row.priority, status: row.task_status,
    createdAt: row.created_at, updatedAt: row.updated_at
  };
}

async function listTasks(userId, filters = {}) {
  const where = ['assignee_user_id = ?'];
  const values = [userId];
  if (filters.status && filters.status !== 'all') {
    where.push('task_status = ?'); values.push(filters.status);
  }
  const limit = Math.min(Math.max(Number(filters.limit) || 30, 1), 100);
  const [rows] = await pool.execute(`SELECT * FROM crm_tasks WHERE ${where.join(' AND ')}
    ORDER BY task_status = 'completed', due_at IS NULL, due_at, created_at DESC LIMIT ${limit}`, values);
  return rows.map(taskRow);
}

async function createTask(userId, input) {
  const [result] = await pool.execute(`INSERT INTO crm_tasks
    (title, description, assignee_user_id, due_at, priority, task_status, created_by)
    VALUES (?, ?, ?, ?, ?, 'open', ?)`, [input.title, input.description || null, userId, input.dueAt || null, input.priority, userId]);
  const [rows] = await pool.execute('SELECT * FROM crm_tasks WHERE id = ? LIMIT 1', [result.insertId]);
  return taskRow(rows[0]);
}

async function updateTask(id, userId, input) {
  const fields = []; const values = [];
  [['title', 'title'], ['description', 'description'], ['due_at', 'dueAt'], ['priority', 'priority'], ['task_status', 'status']].forEach(([column, key]) => {
    if (input[key] !== undefined) { fields.push(`${column} = ?`); values.push(input[key] || null); }
  });
  if (!fields.length) return null;
  values.push(id, userId);
  const [result] = await pool.execute(`UPDATE crm_tasks SET ${fields.join(', ')} WHERE id = ? AND assignee_user_id = ?`, values);
  if (!result.affectedRows) return null;
  const [rows] = await pool.execute('SELECT * FROM crm_tasks WHERE id = ? LIMIT 1', [id]);
  return taskRow(rows[0]);
}

async function listCalendar(userId, start, end) {
  const [taskRows] = await pool.execute(`SELECT * FROM crm_tasks WHERE assignee_user_id = ? AND due_at >= ? AND due_at < ? AND task_status = 'open' ORDER BY due_at`, [userId, start, end]);
  const [approvalRows] = await pool.execute(`SELECT assignments.id, assignments.due_at, instances.request_key,
      version_stages.name AS stage_name, definitions.name AS workflow_name
    FROM crm_workflow_assignments assignments
    INNER JOIN crm_workflow_instance_stages stages ON stages.id = assignments.instance_stage_id
    INNER JOIN crm_workflow_instances instances ON instances.id = stages.instance_id
    INNER JOIN crm_workflow_definitions definitions ON definitions.id = instances.workflow_id
    INNER JOIN crm_workflow_version_stages version_stages ON version_stages.id = stages.version_stage_id
    WHERE assignments.approver_user_id = ? AND assignments.assignment_status = 'pending'
      AND assignments.due_at >= ? AND assignments.due_at < ? ORDER BY assignments.due_at`, [userId, start, end]);
  return [
    ...taskRows.map((row) => ({ id: `task-${row.id}`, type: 'task', title: row.title, date: row.due_at, status: row.task_status, priority: row.priority })),
    ...approvalRows.map((row) => ({ id: `approval-${row.id}`, type: 'approval', title: `${row.workflow_name} - ${row.stage_name}`, date: row.due_at, requestKey: row.request_key }))
  ].sort((a, b) => new Date(a.date) - new Date(b.date));
}

module.exports = { listTasks, createTask, updateTask, listCalendar };
