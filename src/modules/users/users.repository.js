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
  staffId: 'staff_id',
  name: 'name',
  email: 'email',
  role: 'role',
  status: 'status'
};

function jsonPath(fieldKey) {
  return `$.${JSON.stringify(String(fieldKey || ''))}`;
}

function fieldFilterExpression(field) {
  const column = systemFieldColumns[field.fieldKey];
  if (column) return `COALESCE(CAST(${sqlIdentifier(column)} AS CHAR), '')`;
  return "COALESCE(JSON_UNQUOTE(JSON_EXTRACT(custom_fields, ?)), '')";
}

function addFieldFilter(where, values, fields = [], filters = {}) {
  const fieldKey = String(filters.filterField || '');
  const operator = String(filters.filterOperator || 'contains');
  if (!fieldKey || !operator) return;

  const field = fields.find((item) => item.fieldKey === fieldKey && item.tableType !== 'detail' && item.fieldKey !== 'password');
  if (!field) return;

  const expression = fieldFilterExpression(field);
  if (!systemFieldColumns[field.fieldKey]) {
    values.push(jsonPath(field.fieldKey));
  }
  if (operator === 'empty') {
    where.push(`${expression} = ''`);
    return;
  }
  if (operator === 'not_empty') {
    where.push(`${expression} <> ''`);
    return;
  }

  const textValue = String(filters.filterValue ?? '');
  if (textValue.trim() === '') return;
  if (operator === 'equals') {
    values.push(textValue);
    where.push(`LOWER(${expression}) = LOWER(?)`);
    return;
  }
  if (operator === 'not_equals') {
    values.push(textValue);
    where.push(`LOWER(${expression}) <> LOWER(?)`);
    return;
  }
  if (operator === 'starts_with') {
    values.push(`${textValue}%`);
    where.push(`${expression} LIKE ?`);
    return;
  }
  values.push(`%${textValue}%`);
  where.push(`${expression} LIKE ?`);
}

async function listUsers(filters = {}, fields = []) {
  const where = [];
  const values = [];

  if (filters.search) {
    const search = `%${filters.search}%`;
    where.push('(staff_id LIKE ? OR name LIKE ? OR email LIKE ? OR role LIKE ? OR status LIKE ?)');
    values.push(search, search, search, search, search);
  }

  addFieldFilter(where, values, fields, filters);

  const [rows] = await pool.execute(
    `SELECT id, staff_id, name, email, role, status, custom_fields, created_at, updated_at
     FROM users
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY name ASC`,
    values
  );
  return rows;
}

async function findUserById(id) {
  const [rows] = await pool.execute(
    `SELECT id, staff_id, name, email, role, status, custom_fields, created_at, updated_at
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
    `INSERT INTO users (staff_id, name, email, password_hash, role, status, custom_fields)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [user.staffId || null, user.name, user.email.toLowerCase(), user.passwordHash, user.role, user.status, JSON.stringify(user.customFields || {})]
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
