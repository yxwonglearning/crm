const { pool } = require('../../database/pool');

function assertSafeIdentifier(identifier) {
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(String(identifier || ''))) {
    throw new Error(`Unsafe database identifier: ${identifier}`);
  }
}

function sqlIdentifier(identifier) {
  assertSafeIdentifier(identifier);
  return `\`${identifier}\``;
}

const systemFieldColumns = {
  name: 'name',
  email: 'email',
  role: 'role',
  status: 'status'
};

async function listUsers() {
  const [rows] = await pool.execute(
    `SELECT id, name, email, role, status, custom_fields, created_at, updated_at
     FROM users
     ORDER BY name ASC`
  );
  return rows;
}

async function findUserById(id) {
  const [rows] = await pool.execute(
    `SELECT id, name, email, role, status, custom_fields, created_at, updated_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function findUserCredentialsById(id) {
  const [rows] = await pool.execute(
    `SELECT id, password_hash
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function createUser(user) {
  const [result] = await pool.execute(
    `INSERT INTO users (name, email, password_hash, role, status, custom_fields)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [user.name, user.email.toLowerCase(), user.passwordHash, user.role, user.status, JSON.stringify(user.customFields || {})]
  );
  return result.insertId;
}

async function updateUser(id, user) {
  const fields = [];
  const values = [];

  for (const [column, value] of Object.entries(user)) {
    fields.push(`${column} = ?`);
    values.push(value);
  }

  if (!fields.length) {
    return;
  }

  values.push(id);
  await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
}

async function countFieldValue(field, value, excludeId = null) {
  const values = [];
  let condition;
  const column = systemFieldColumns[field.fieldKey];
  if (column) {
    condition = `LOWER(COALESCE(CAST(${sqlIdentifier(column)} AS CHAR), '')) = LOWER(?)`;
    values.push(String(value));
  } else {
    condition = `LOWER(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(custom_fields, ?)), '')) = LOWER(?)`;
    values.push(`$.${JSON.stringify(String(field.fieldKey || ''))}`, String(value));
  }
  if (excludeId) {
    condition += ' AND id <> ?';
    values.push(excludeId);
  }
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count FROM users WHERE ${condition}`,
    values
  );
  return Number(rows[0]?.count || 0);
}

module.exports = { listUsers, findUserById, findUserCredentialsById, createUser, updateUser, countFieldValue };
