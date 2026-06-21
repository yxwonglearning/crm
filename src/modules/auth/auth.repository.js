const { pool } = require('../../database/pool');

async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT id, name, email, password_hash, role, status
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email.toLowerCase()]
  );
  return rows[0] || null;
}

module.exports = { findUserByEmail };
