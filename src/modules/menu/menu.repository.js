const { pool } = require('../../database/pool');

async function findDefinition() {
  const [rows] = await pool.execute('SELECT * FROM crm_menu_definitions WHERE menu_key = ? LIMIT 1', ['main_sidebar']);
  return rows[0] || null;
}

async function saveDraft(config, userId) {
  await pool.execute(
    `INSERT INTO crm_menu_definitions (menu_key, draft_json, updated_by)
     VALUES ('main_sidebar', ?, ?)
     ON DUPLICATE KEY UPDATE draft_json = VALUES(draft_json), updated_by = VALUES(updated_by)`,
    [JSON.stringify(config), userId]
  );
  return findDefinition();
}

async function publish(config, userId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT * FROM crm_menu_definitions WHERE menu_key = ? FOR UPDATE', ['main_sidebar']);
    const nextVersion = Number(rows[0]?.published_version || 0) + 1;
    const json = JSON.stringify(config);
    await connection.execute(
      `INSERT INTO crm_menu_definitions (menu_key, draft_json, published_json, published_version, updated_by, published_by, published_at)
       VALUES ('main_sidebar', ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE draft_json = VALUES(draft_json), published_json = VALUES(published_json), published_version = VALUES(published_version), updated_by = VALUES(updated_by), published_by = VALUES(published_by), published_at = NOW()`,
      [json, json, nextVersion, userId, userId]
    );
    await connection.execute(
      'INSERT INTO crm_menu_versions (menu_key, version_number, config_json, created_by) VALUES (?, ?, ?, ?)',
      ['main_sidebar', nextVersion, json, userId]
    );
    await connection.commit();
    return { version: nextVersion };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function listVersions() {
  const [rows] = await pool.execute(
    `SELECT v.id, v.version_number, v.created_at, u.name AS created_by_name
     FROM crm_menu_versions v LEFT JOIN users u ON u.id = v.created_by
     WHERE v.menu_key = ? ORDER BY v.version_number DESC LIMIT 25`,
    ['main_sidebar']
  );
  return rows;
}

async function findVersion(id) {
  const [rows] = await pool.execute('SELECT * FROM crm_menu_versions WHERE id = ? AND menu_key = ? LIMIT 1', [id, 'main_sidebar']);
  return rows[0] || null;
}

async function catalog() {
  const [modules] = await pool.execute("SELECT module_key, name FROM crm_modules WHERE module_status = 'published' AND show_in_menu = 1 AND is_system = 0 ORDER BY name");
  const [users] = await pool.execute("SELECT id, name, email, role, organization_node_id FROM users WHERE status = 'active' ORDER BY name");
  const [departments] = await pool.execute("SELECT id, name, node_type FROM crm_department_nodes WHERE is_enabled = 1 ORDER BY name");
  return { modules, users, departments };
}

module.exports = { findDefinition, saveDraft, publish, listVersions, findVersion, catalog };
