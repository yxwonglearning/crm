const { pool } = require('../../database/pool');

async function findAccount(id, includeAvatar = false) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.staff_id, u.name, u.email, u.role, u.status, u.organization_node_id,
            u.profile_phone, u.job_title, u.preferred_language, u.preferred_timezone,
            u.preferred_date_format, u.preferred_time_format, u.avatar_mime,
            ${includeAvatar ? 'u.avatar_blob,' : ''} d.name AS department_name
     FROM users u
     LEFT JOIN crm_department_nodes d ON d.id = u.organization_node_id
     WHERE u.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function updateProfile(id, input) {
  await pool.execute(
    'UPDATE users SET name = ?, profile_phone = ?, job_title = ? WHERE id = ?',
    [input.name, input.phone || null, input.jobTitle || null, id]
  );
  return findAccount(id);
}

async function updatePreferences(id, input) {
  await pool.execute(
    `UPDATE users SET preferred_language = ?, preferred_timezone = ?, preferred_date_format = ?, preferred_time_format = ?
     WHERE id = ?`,
    [input.language, input.timezone, input.dateFormat, input.timeFormat, id]
  );
  return findAccount(id);
}

async function saveAvatar(id, buffer, mime) {
  await pool.execute('UPDATE users SET avatar_blob = ?, avatar_mime = ? WHERE id = ?', [buffer, mime, id]);
}

async function removeAvatar(id) {
  await pool.execute('UPDATE users SET avatar_blob = NULL, avatar_mime = NULL WHERE id = ?', [id]);
}

async function credentials(id) {
  const [rows] = await pool.execute('SELECT id, password_hash, auth_version FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function changePassword(id, passwordHash) {
  await pool.execute('UPDATE users SET password_hash = ?, auth_version = auth_version + 1 WHERE id = ?', [passwordHash, id]);
}

module.exports = { findAccount, updateProfile, updatePreferences, saveAvatar, removeAvatar, credentials, changePassword };
