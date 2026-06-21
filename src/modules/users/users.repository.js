const { pool } = require('../../database/pool');

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

module.exports = { listUsers, findUserById, findUserCredentialsById, createUser, updateUser };
