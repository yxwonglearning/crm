const { pool } = require('../../database/pool');

function publicNode(row) {
  return {
    id: Number(row.id),
    nodeKey: row.node_key,
    name: row.name,
    type: row.node_type,
    parentId: row.parent_id ? Number(row.parent_id) : null,
    parentName: row.parent_name || '',
    description: row.description || '',
    enabled: Boolean(row.is_enabled)
  };
}

async function listNodes() {
  const [rows] = await pool.execute(
    `SELECT n.*, p.name AS parent_name
     FROM crm_department_nodes n
     LEFT JOIN crm_department_nodes p ON p.id = n.parent_id
     ORDER BY FIELD(n.node_type, 'organization', 'department', 'group'), n.name ASC`
  );
  return rows.map(publicNode);
}

async function findById(id) {
  const [rows] = await pool.execute('SELECT * FROM crm_department_nodes WHERE id = ? LIMIT 1', [id]);
  return rows[0] ? publicNode(rows[0]) : null;
}

async function findOrganization() {
  const [rows] = await pool.execute("SELECT * FROM crm_department_nodes WHERE node_type = 'organization' ORDER BY id ASC LIMIT 1");
  return rows[0] ? publicNode(rows[0]) : null;
}

async function findByNameAndParent(name, type, parentId) {
  const [rows] = await pool.execute(
    'SELECT * FROM crm_department_nodes WHERE node_type = ? AND name = ? AND parent_id <=> ? LIMIT 1',
    [type, name, parentId || null]
  );
  return rows[0] ? publicNode(rows[0]) : null;
}

async function saveNode(input, userId = null) {
  const [result] = await pool.execute(
    `INSERT INTO crm_department_nodes (node_key, name, node_type, parent_id, description, is_enabled, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), description = VALUES(description), is_enabled = VALUES(is_enabled), updated_by = VALUES(updated_by)`,
    [input.nodeKey, input.name, input.type, input.parentId || null, input.description || '', input.enabled === false ? 0 : 1, userId, userId]
  );
  return findById(result.insertId || input.id);
}

async function updateNode(id, input, userId = null) {
  await pool.execute(
    'UPDATE crm_department_nodes SET name = ?, description = ?, is_enabled = ?, updated_by = ? WHERE id = ?',
    [input.name, input.description || '', input.enabled === false ? 0 : 1, userId, id]
  );
  return findById(id);
}

async function childCount(id) {
  const [rows] = await pool.execute('SELECT COUNT(*) AS count FROM crm_department_nodes WHERE parent_id = ?', [id]);
  return Number(rows[0]?.count || 0);
}

async function deleteNode(id) {
  const [result] = await pool.execute("DELETE FROM crm_department_nodes WHERE id = ? AND node_type <> 'organization'", [id]);
  return result.affectedRows;
}

async function ancestorIds(id) {
  const ids = [];
  let current = await findById(id);
  const visited = new Set();
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    ids.push(current.id);
    current = current.parentId ? await findById(current.parentId) : null;
  }
  return ids;
}

module.exports = { listNodes, findById, findOrganization, findByNameAndParent, saveNode, updateNode, childCount, deleteNode, ancestorIds };
