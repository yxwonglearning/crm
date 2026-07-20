const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');
const { config } = require('../shared/config');

async function ensureColumn(connection, tableName, columnName, definition) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [config.db.database, tableName, columnName]
  );

  if (rows[0].count === 0) {
    await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${definition}`);
  }
}

async function ensureIndex(connection, tableName, indexName, definition) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [config.db.database, tableName, indexName]
  );

  if (rows[0].count === 0) {
    await connection.query(`ALTER TABLE \`${tableName}\` ADD ${definition}`);
  }
}

async function dropIndexIfExists(connection, tableName, indexName) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [config.db.database, tableName, indexName]
  );

  if (rows[0].count > 0) {
    await connection.query(`ALTER TABLE \`${tableName}\` DROP INDEX \`${indexName}\``);
  }
}

async function dropColumnIfExists(connection, tableName, columnName) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [config.db.database, tableName, columnName]
  );

  if (rows[0].count > 0) {
    await connection.query(`ALTER TABLE \`${tableName}\` DROP COLUMN \`${columnName}\``);
  }
}

function assertSafeIdentifier(identifier) {
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(String(identifier || ''))) {
    throw new Error(`Unsafe database identifier: ${identifier}`);
  }
}

function sqlIdentifier(identifier) {
  assertSafeIdentifier(identifier);
  return `\`${identifier}\``;
}

function sqlTypeForFieldType(type) {
  const map = {
    textbox: 'VARCHAR(255) NULL',
    text: 'VARCHAR(255) NULL',
    email: 'VARCHAR(190) NULL',
    phone: 'VARCHAR(60) NULL',
    password: 'VARCHAR(255) NULL',
    textarea: 'TEXT NULL',
    dropdownbox: 'VARCHAR(190) NULL',
    select: 'VARCHAR(190) NULL',
    checkbox: 'TINYINT(1) NOT NULL DEFAULT 0',
    int: 'INT NULL',
    number: 'INT NULL',
    decimals: 'DECIMAL(18, 4) NULL',
    date: 'DATE NULL',
    browser_button: 'BIGINT UNSIGNED NULL',
    attach_document: 'VARCHAR(500) NULL',
    image: 'VARCHAR(500) NULL',
    country: 'BIGINT UNSIGNED NULL',
    owner: 'BIGINT UNSIGNED NULL'
  };
  return map[type] || 'VARCHAR(255) NULL';
}

async function ensureDetailTables(connection) {
  const [fields] = await connection.execute(
    `SELECT detail_table_name, field_key, field_type
     FROM crm_module_fields
     WHERE field_table = 'detail' AND detail_table_name IS NOT NULL`
  );

  for (const field of fields) {
    const tableName = field.detail_table_name;
    const fieldKey = field.field_key;
    const table = sqlIdentifier(tableName);
    await connection.query(
      `CREATE TABLE IF NOT EXISTS ${table} (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        mainid BIGINT UNSIGNED NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY ${sqlIdentifier(`${tableName}_mainid_idx`)} (mainid)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );
    await ensureColumn(connection, tableName, fieldKey, `${sqlIdentifier(fieldKey)} ${sqlTypeForFieldType(field.field_type)}`);
  }
}

async function main() {
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\``);
  } catch (error) {
    if (error.code !== 'ER_DBACCESS_DENIED_ERROR') {
      throw error;
    }
    console.warn('Database user cannot create databases; using existing database.');
  }
  await connection.query(`USE \`${config.db.database}\``);

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = await fs.readFile(schemaPath, 'utf8');
  await connection.query(schema);
  await dropIndexIfExists(connection, 'users', 'users_clerk_user_id_unique');
  await dropColumnIfExists(connection, 'users', 'clerk_user_id');
  await ensureColumn(connection, 'users', 'staff_id', 'staff_id VARCHAR(80) NULL AFTER id');
  await ensureIndex(connection, 'users', 'users_staff_id_unique', 'UNIQUE KEY users_staff_id_unique (staff_id)');
  await connection.query('ALTER TABLE `users` MODIFY `password_hash` VARCHAR(255) NULL');
  await ensureColumn(connection, 'users', 'custom_fields', 'custom_fields JSON NULL AFTER status');
  await ensureColumn(connection, 'customers', 'custom_fields', 'custom_fields JSON NULL AFTER notes');
  await ensureColumn(connection, 'crm_modules', 'module_status', "module_status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft' AFTER description");
  await ensureColumn(connection, 'crm_modules', 'show_in_menu', 'show_in_menu TINYINT(1) NOT NULL DEFAULT 0 AFTER module_status');
  await ensureColumn(connection, 'crm_modules', 'is_system', 'is_system TINYINT(1) NOT NULL DEFAULT 0 AFTER show_in_menu');
  await ensureColumn(connection, 'crm_module_fields', 'field_table', "field_table ENUM('main', 'detail') NOT NULL DEFAULT 'main' AFTER field_type");
  await ensureColumn(connection, 'crm_module_fields', 'detail_table_name', 'detail_table_name VARCHAR(80) NULL AFTER field_table');
  await ensureColumn(connection, 'crm_module_fields', 'formula_expression', 'formula_expression TEXT NULL AFTER options_json');
  await ensureColumn(connection, 'crm_module_fields', 'formula_enabled', 'formula_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER formula_expression');
  await ensureColumn(connection, 'crm_module_fields', 'formula_js', 'formula_js TEXT NULL AFTER formula_enabled');
  await ensureColumn(connection, 'crm_module_fields', 'formula_function_name', 'formula_function_name VARCHAR(80) NULL AFTER formula_js');
  await ensureColumn(connection, 'crm_module_fields', 'formula_function_body', 'formula_function_body TEXT NULL AFTER formula_function_name');
  await ensureColumn(connection, 'crm_module_fields', 'formula_sql', 'formula_sql TEXT NULL AFTER formula_function_body');
  await ensureColumn(connection, 'crm_module_fields', 'validation_json', 'validation_json JSON NULL AFTER formula_sql');
  await ensureColumn(connection, 'crm_module_fields', 'lookup_json', 'lookup_json JSON NULL AFTER validation_json');
  await ensureColumn(connection, 'crm_module_fields', 'show_in_export', 'show_in_export TINYINT(1) NOT NULL DEFAULT 1 AFTER show_in_import');
  await ensureColumn(connection, 'crm_module_fields', 'import_header', 'import_header VARCHAR(160) NULL AFTER show_in_export');
  await ensureColumn(connection, 'crm_module_fields', 'export_header', 'export_header VARCHAR(160) NULL AFTER import_header');
  await ensureColumn(connection, 'crm_module_fields', 'is_editable', 'is_editable TINYINT(1) NOT NULL DEFAULT 1 AFTER show_in_import');
  await ensureColumn(connection, 'crm_module_fields', 'disable_manual_input', 'disable_manual_input TINYINT(1) NOT NULL DEFAULT 0 AFTER is_editable');
  await ensureColumn(connection, 'crm_module_fields', 'is_archived', 'is_archived TINYINT(1) NOT NULL DEFAULT 0 AFTER is_locked');
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_forms (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      form_key VARCHAR(80) NOT NULL,
      name VARCHAR(120) NOT NULL,
      description VARCHAR(255) NULL,
      fields_json JSON NULL,
      created_by BIGINT UNSIGNED NULL,
      updated_by BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_forms_key_unique (form_key),
      KEY crm_forms_created_by_fk (created_by),
      KEY crm_forms_updated_by_fk (updated_by),
      CONSTRAINT crm_forms_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT crm_forms_updated_by_fk FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_module_config_versions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      module_id BIGINT UNSIGNED NOT NULL,
      version_number INT NOT NULL,
      action VARCHAR(80) NOT NULL,
      summary VARCHAR(255) NULL,
      snapshot_json JSON NOT NULL,
      created_by BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_module_config_versions_number_unique (module_id, version_number),
      KEY crm_module_config_versions_module_id_idx (module_id),
      KEY crm_module_config_versions_created_by_fk (created_by),
      CONSTRAINT crm_module_config_versions_module_id_fk FOREIGN KEY (module_id) REFERENCES crm_modules(id) ON DELETE CASCADE,
      CONSTRAINT crm_module_config_versions_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_module_config_audit_logs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      module_id BIGINT UNSIGNED NOT NULL,
      version_id BIGINT UNSIGNED NULL,
      action VARCHAR(80) NOT NULL,
      target_type VARCHAR(80) NOT NULL,
      target_key VARCHAR(120) NULL,
      summary VARCHAR(255) NULL,
      before_json JSON NULL,
      after_json JSON NULL,
      changed_by BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY crm_module_config_audit_logs_module_id_idx (module_id),
      KEY crm_module_config_audit_logs_version_id_idx (version_id),
      KEY crm_module_config_audit_logs_changed_by_fk (changed_by),
      CONSTRAINT crm_module_config_audit_logs_module_id_fk FOREIGN KEY (module_id) REFERENCES crm_modules(id) ON DELETE CASCADE,
      CONSTRAINT crm_module_config_audit_logs_version_id_fk FOREIGN KEY (version_id) REFERENCES crm_module_config_versions(id) ON DELETE SET NULL,
      CONSTRAINT crm_module_config_audit_logs_changed_by_fk FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_field_permissions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      module_id BIGINT UNSIGNED NOT NULL,
      field_key VARCHAR(80) NOT NULL,
      subject_type ENUM('role', 'user') NOT NULL,
      subject_key VARCHAR(80) NOT NULL,
      can_view TINYINT(1) NOT NULL DEFAULT 0,
      can_create TINYINT(1) NOT NULL DEFAULT 0,
      can_edit TINYINT(1) NOT NULL DEFAULT 0,
      can_import TINYINT(1) NOT NULL DEFAULT 0,
      can_export TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_field_permissions_subject_unique (module_id, field_key, subject_type, subject_key),
      KEY crm_field_permissions_module_id_fk (module_id),
      CONSTRAINT crm_field_permissions_module_id_fk FOREIGN KEY (module_id) REFERENCES crm_modules(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_module_permissions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      module_id BIGINT UNSIGNED NOT NULL,
      subject_type ENUM('role', 'user') NOT NULL,
      subject_key VARCHAR(80) NOT NULL,
      can_view TINYINT(1) NOT NULL DEFAULT 0,
      can_create TINYINT(1) NOT NULL DEFAULT 0,
      can_edit TINYINT(1) NOT NULL DEFAULT 0,
      can_delete TINYINT(1) NOT NULL DEFAULT 0,
      can_import TINYINT(1) NOT NULL DEFAULT 0,
      can_export TINYINT(1) NOT NULL DEFAULT 0,
      can_configure TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_module_permissions_subject_unique (module_id, subject_type, subject_key),
      KEY crm_module_permissions_module_id_fk (module_id),
      CONSTRAINT crm_module_permissions_module_id_fk FOREIGN KEY (module_id) REFERENCES crm_modules(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_api_connectors (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      connector_key VARCHAR(80) NOT NULL,
      name VARCHAR(120) NOT NULL,
      base_url VARCHAR(500) NOT NULL,
      auth_type ENUM('none', 'api_key', 'bearer', 'basic', 'oauth') NOT NULL DEFAULT 'none',
      auth_config_json JSON NULL,
      default_headers_json JSON NULL,
      endpoints_json JSON NULL,
      is_enabled TINYINT(1) NOT NULL DEFAULT 1,
      created_by BIGINT UNSIGNED NULL,
      updated_by BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_api_connectors_key_unique (connector_key),
      KEY crm_api_connectors_created_by_fk (created_by),
      KEY crm_api_connectors_updated_by_fk (updated_by),
      CONSTRAINT crm_api_connectors_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT crm_api_connectors_updated_by_fk FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_action_flows (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      flow_key VARCHAR(80) NOT NULL,
      name VARCHAR(160) NOT NULL,
      description VARCHAR(255) NULL,
      flow_status ENUM('draft', 'enabled', 'disabled') NOT NULL DEFAULT 'draft',
      current_version INT NOT NULL DEFAULT 1,
      trigger_category VARCHAR(80) NOT NULL DEFAULT 'record',
      trigger_type VARCHAR(80) NOT NULL DEFAULT 'record_created',
      trigger_module VARCHAR(80) NULL,
      flow_json JSON NULL,
      created_by BIGINT UNSIGNED NULL,
      updated_by BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_action_flows_key_unique (flow_key),
      KEY crm_action_flows_status_idx (flow_status),
      KEY crm_action_flows_trigger_module_idx (trigger_module),
      KEY crm_action_flows_created_by_fk (created_by),
      KEY crm_action_flows_updated_by_fk (updated_by),
      CONSTRAINT crm_action_flows_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT crm_action_flows_updated_by_fk FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_action_flow_executions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      flow_id BIGINT UNSIGNED NOT NULL,
      flow_version INT NOT NULL,
      execution_status ENUM('queued', 'running', 'success', 'failed', 'skipped') NOT NULL DEFAULT 'queued',
      trigger_payload_json JSON NULL,
      result_json JSON NULL,
      started_at TIMESTAMP NULL,
      finished_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY crm_action_flow_executions_flow_id_idx (flow_id),
      CONSTRAINT crm_action_flow_executions_flow_id_fk FOREIGN KEY (flow_id) REFERENCES crm_action_flows(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  try {
    await connection.query(
      "ALTER TABLE crm_module_fields MODIFY field_type ENUM('textbox', 'textarea', 'checkbox', 'dropdownbox', 'int', 'decimals', 'browser_button', 'date', 'attach_document', 'image', 'text', 'email', 'phone', 'password', 'number', 'select', 'country', 'owner') NOT NULL DEFAULT 'textbox'"
    );
  } catch (error) {
    if (error.code !== 'ER_NO_SUCH_TABLE') throw error;
  }
  await ensureDetailTables(connection);
  await connection.end();

  console.log('Database migration complete.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
