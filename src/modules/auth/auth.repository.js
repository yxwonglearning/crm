const { pool } = require('../../database/pool');

async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT id, clerk_user_id, name, email, password_hash, role, status
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email.toLowerCase()]
  );
  return rows[0] || null;
}

async function findUserById(id) {
  const [rows] = await pool.execute(
    `SELECT id, clerk_user_id, name, email, role, status
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function findUserByClerkId(clerkUserId) {
  const [rows] = await pool.execute(
    `SELECT id, clerk_user_id, name, email, role, status
     FROM users
     WHERE clerk_user_id = ?
     LIMIT 1`,
    [clerkUserId]
  );
  return rows[0] || null;
}

async function updateUserClerkId(id, clerkUserId) {
  await pool.execute(
    `UPDATE users
     SET clerk_user_id = ?
     WHERE id = ?`,
    [clerkUserId, id]
  );
}

module.exports = { findUserByEmail, findUserById, findUserByClerkId, updateUserClerkId };
