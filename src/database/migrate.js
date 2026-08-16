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

async function ensureForeignKey(connection, tableName, constraintName, definition) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.REFERENTIAL_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?`,
    [config.db.database, tableName, constraintName]
  );

  if (rows[0].count === 0) {
    await connection.query(`ALTER TABLE \`${tableName}\` ADD CONSTRAINT \`${constraintName}\` ${definition}`);
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
  await ensureColumn(connection, 'users', 'profile_phone', 'profile_phone VARCHAR(40) NULL AFTER custom_fields');
  await ensureColumn(connection, 'users', 'job_title', 'job_title VARCHAR(120) NULL AFTER profile_phone');
  await ensureColumn(connection, 'users', 'preferred_language', "preferred_language VARCHAR(12) NOT NULL DEFAULT 'en' AFTER job_title");
  await ensureColumn(connection, 'users', 'preferred_timezone', "preferred_timezone VARCHAR(80) NOT NULL DEFAULT 'Asia/Singapore' AFTER preferred_language");
  await ensureColumn(connection, 'users', 'preferred_date_format', "preferred_date_format VARCHAR(20) NOT NULL DEFAULT 'DD/MM/YYYY' AFTER preferred_timezone");
  await ensureColumn(connection, 'users', 'preferred_time_format', "preferred_time_format VARCHAR(8) NOT NULL DEFAULT '24h' AFTER preferred_date_format");
  await ensureColumn(connection, 'users', 'avatar_blob', 'avatar_blob MEDIUMBLOB NULL AFTER preferred_time_format');
  await ensureColumn(connection, 'users', 'avatar_mime', 'avatar_mime VARCHAR(40) NULL AFTER avatar_blob');
  await ensureColumn(connection, 'users', 'auth_version', 'auth_version INT UNSIGNED NOT NULL DEFAULT 0 AFTER avatar_mime');
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
    `CREATE TABLE IF NOT EXISTS crm_permission_audit_logs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NULL,
      module_key VARCHAR(80) NOT NULL,
      record_id BIGINT UNSIGNED NULL,
      action VARCHAR(40) NOT NULL,
      allowed TINYINT(1) NOT NULL,
      decision_reason VARCHAR(120) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY crm_permission_audit_logs_module_created_idx (module_key, created_at),
      KEY crm_permission_audit_logs_user_created_idx (user_id, created_at),
      KEY crm_permission_audit_logs_allowed_created_idx (allowed, created_at),
      CONSTRAINT crm_permission_audit_logs_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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
    `CREATE TABLE IF NOT EXISTS crm_api_connector_categories (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      category_key VARCHAR(80) NOT NULL,
      name VARCHAR(120) NOT NULL,
      description VARCHAR(255) NULL,
      created_by BIGINT UNSIGNED NULL,
      updated_by BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_api_connector_categories_key_unique (category_key),
      CONSTRAINT crm_api_connector_categories_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT crm_api_connector_categories_updated_by_fk FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_api_connectors (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      connector_key VARCHAR(80) NOT NULL,
      name VARCHAR(120) NOT NULL,
      base_url VARCHAR(500) NOT NULL,
      category_key VARCHAR(80) NULL,
      auth_type ENUM('none', 'api_key', 'bearer', 'basic', 'oauth', 'oauth1', 'oauth2') NOT NULL DEFAULT 'none',
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
  await ensureColumn(connection, 'crm_api_connectors', 'category_key', '`category_key` VARCHAR(80) NULL AFTER `base_url`');
  await connection.execute("ALTER TABLE crm_api_connectors MODIFY COLUMN auth_type ENUM('none', 'api_key', 'bearer', 'basic', 'oauth', 'oauth1', 'oauth2') NOT NULL DEFAULT 'none'");
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_department_nodes (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      node_key VARCHAR(80) NOT NULL,
      name VARCHAR(120) NOT NULL,
      node_type ENUM('organization', 'department', 'group') NOT NULL,
      parent_id BIGINT UNSIGNED NULL,
      description VARCHAR(255) NULL,
      is_enabled TINYINT(1) NOT NULL DEFAULT 1,
      created_by BIGINT UNSIGNED NULL,
      updated_by BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_department_nodes_key_unique (node_key),
      UNIQUE KEY crm_department_nodes_parent_name_unique (parent_id, node_type, name),
      KEY crm_department_nodes_parent_fk (parent_id),
      CONSTRAINT crm_department_nodes_parent_fk FOREIGN KEY (parent_id) REFERENCES crm_department_nodes(id) ON DELETE RESTRICT,
      CONSTRAINT crm_department_nodes_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT crm_department_nodes_updated_by_fk FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await ensureColumn(connection, 'users', 'organization_node_id', '`organization_node_id` BIGINT UNSIGNED NULL AFTER `status`');
  await ensureIndex(connection, 'users', 'users_organization_node_idx', 'INDEX `users_organization_node_idx` (`organization_node_id`)');
  await connection.execute(
    `INSERT INTO crm_department_nodes (node_key, name, node_type, parent_id, description, is_enabled)
     VALUES ('organization', 'Organization', 'organization', NULL, 'Default organization root.', 1)
     ON DUPLICATE KEY UPDATE is_enabled = 1`
  );
  await connection.execute(
    `UPDATE users
     SET organization_node_id = (
       SELECT id FROM crm_department_nodes WHERE node_type = 'organization' ORDER BY id ASC LIMIT 1
     )
     WHERE organization_node_id IS NULL`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_module_department_permissions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      module_id BIGINT UNSIGNED NOT NULL,
      department_node_id BIGINT UNSIGNED NOT NULL,
      can_view TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_module_department_permissions_unique (module_id, department_node_id),
      CONSTRAINT crm_module_department_permissions_module_fk FOREIGN KEY (module_id) REFERENCES crm_modules(id) ON DELETE CASCADE,
      CONSTRAINT crm_module_department_permissions_node_fk FOREIGN KEY (department_node_id) REFERENCES crm_department_nodes(id) ON DELETE CASCADE
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
      published_flow_json JSON NULL,
      published_version INT NULL,
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
  await ensureColumn(connection, 'crm_action_flows', 'published_flow_json', '`published_flow_json` JSON NULL AFTER `flow_json`');
  await ensureColumn(connection, 'crm_action_flows', 'published_version', '`published_version` INT NULL AFTER `published_flow_json`');
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_action_flow_versions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      flow_id BIGINT UNSIGNED NOT NULL,
      version_number INT NOT NULL,
      action VARCHAR(40) NOT NULL,
      summary VARCHAR(255) NULL,
      snapshot_json JSON NOT NULL,
      created_by BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_action_flow_versions_number_unique (flow_id, version_number),
      KEY crm_action_flow_versions_flow_id_idx (flow_id),
      KEY crm_action_flow_versions_created_by_fk (created_by),
      CONSTRAINT crm_action_flow_versions_flow_id_fk FOREIGN KEY (flow_id) REFERENCES crm_action_flows(id) ON DELETE CASCADE,
      CONSTRAINT crm_action_flow_versions_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
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
      trigger_event_key VARCHAR(120) NULL,
      started_at TIMESTAMP NULL,
      finished_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY crm_action_flow_executions_flow_id_idx (flow_id),
      UNIQUE KEY crm_action_flow_executions_event_unique (flow_id, trigger_event_key),
      CONSTRAINT crm_action_flow_executions_flow_id_fk FOREIGN KEY (flow_id) REFERENCES crm_action_flows(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await ensureColumn(connection, 'crm_action_flow_executions', 'trigger_event_key', '`trigger_event_key` VARCHAR(120) NULL AFTER `trigger_payload_json`');
  await ensureIndex(connection, 'crm_action_flow_executions', 'crm_action_flow_executions_event_unique', 'UNIQUE KEY `crm_action_flow_executions_event_unique` (`flow_id`, `trigger_event_key`)');
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_tasks (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      title VARCHAR(190) NOT NULL,
      description TEXT NULL,
      assignee_user_id BIGINT UNSIGNED NULL,
      due_at DATETIME NULL,
      priority ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
      task_status ENUM('open', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'open',
      source_flow_id BIGINT UNSIGNED NULL,
      source_execution_id BIGINT UNSIGNED NULL,
      source_node_id VARCHAR(120) NULL,
      created_by BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY crm_tasks_assignee_idx (assignee_user_id),
      KEY crm_tasks_source_execution_idx (source_execution_id),
      CONSTRAINT crm_tasks_assignee_fk FOREIGN KEY (assignee_user_id) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT crm_tasks_source_flow_fk FOREIGN KEY (source_flow_id) REFERENCES crm_action_flows(id) ON DELETE SET NULL,
      CONSTRAINT crm_tasks_source_execution_fk FOREIGN KEY (source_execution_id) REFERENCES crm_action_flow_executions(id) ON DELETE SET NULL,
      CONSTRAINT crm_tasks_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_notifications (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      recipient_user_id BIGINT UNSIGNED NOT NULL,
      title VARCHAR(190) NOT NULL,
      message TEXT NOT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      source_flow_id BIGINT UNSIGNED NULL,
      source_execution_id BIGINT UNSIGNED NULL,
      source_node_id VARCHAR(120) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      read_at TIMESTAMP NULL,
      PRIMARY KEY (id),
      KEY crm_notifications_recipient_idx (recipient_user_id, is_read, created_at),
      KEY crm_notifications_source_execution_idx (source_execution_id),
      CONSTRAINT crm_notifications_recipient_fk FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT crm_notifications_source_flow_fk FOREIGN KEY (source_flow_id) REFERENCES crm_action_flows(id) ON DELETE SET NULL,
      CONSTRAINT crm_notifications_source_execution_fk FOREIGN KEY (source_execution_id) REFERENCES crm_action_flow_executions(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await ensureColumn(connection, 'crm_notifications', 'notification_type', "`notification_type` VARCHAR(80) NOT NULL DEFAULT 'general' AFTER `message`");
  await ensureColumn(connection, 'crm_notifications', 'request_key', '`request_key` VARCHAR(100) NULL AFTER `notification_type`');
  await ensureColumn(connection, 'crm_notifications', 'source_event_key', '`source_event_key` VARCHAR(190) NULL AFTER `request_key`');
  await ensureColumn(connection, 'crm_notifications', 'metadata_json', '`metadata_json` JSON NULL AFTER `source_event_key`');
  await ensureIndex(connection, 'crm_notifications', 'crm_notifications_event_recipient_unique', 'UNIQUE KEY `crm_notifications_event_recipient_unique` (`source_event_key`, `recipient_user_id`)');
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_email_settings (
      id TINYINT UNSIGNED NOT NULL DEFAULT 1,
      provider VARCHAR(40) NOT NULL DEFAULT 'gmail',
      is_enabled TINYINT(1) NOT NULL DEFAULT 0,
      sender_name VARCHAR(160) NULL,
      sender_email VARCHAR(190) NULL,
      reply_to VARCHAR(190) NULL,
      settings_json JSON NULL,
      secret_ciphertext TEXT NULL,
      last_test_status ENUM('untested', 'ready', 'failed') NOT NULL DEFAULT 'untested',
      last_test_message VARCHAR(500) NULL,
      last_tested_at TIMESTAMP NULL,
      updated_by BIGINT UNSIGNED NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      CONSTRAINT crm_email_settings_updated_by_fk FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_email_deliveries (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      source_event_key VARCHAR(190) NOT NULL,
      request_key VARCHAR(100) NULL,
      recipient_email VARCHAR(190) NOT NULL,
      delivery_status ENUM('pending', 'sent', 'failed', 'skipped') NOT NULL DEFAULT 'pending',
      attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
      provider_message_id VARCHAR(255) NULL,
      last_error_message VARCHAR(500) NULL,
      sent_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_email_deliveries_event_recipient_unique (source_event_key, recipient_email),
      KEY crm_email_deliveries_status_idx (delivery_status, updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_dashboard_data_sources (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      data_source_key VARCHAR(80) NOT NULL,
      name VARCHAR(160) NOT NULL,
      description VARCHAR(500) NULL,
      source_type ENUM('sql_view', 'select_query') NOT NULL DEFAULT 'sql_view',
      view_name VARCHAR(128) NULL,
      query_sql TEXT NULL,
      columns_json JSON NULL,
      parameters_json JSON NULL,
      row_limit INT UNSIGNED NOT NULL DEFAULT 1000,
      timeout_ms INT UNSIGNED NOT NULL DEFAULT 10000,
      validation_status ENUM('untested', 'valid', 'invalid') NOT NULL DEFAULT 'untested',
      validation_message VARCHAR(500) NULL,
      last_tested_at TIMESTAMP NULL,
      is_archived TINYINT(1) NOT NULL DEFAULT 0,
      created_by BIGINT UNSIGNED NULL,
      updated_by BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_dashboard_data_sources_key_unique (data_source_key),
      KEY crm_dashboard_data_sources_type_archived_idx (source_type, is_archived),
      CONSTRAINT crm_dashboard_data_sources_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT crm_dashboard_data_sources_updated_by_fk FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_dashboards (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      dashboard_key VARCHAR(80) NOT NULL,
      name VARCHAR(160) NOT NULL,
      description VARCHAR(500) NULL,
      dashboard_status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
      current_version INT UNSIGNED NOT NULL DEFAULT 0,
      published_version_id BIGINT UNSIGNED NULL,
      settings_json JSON NULL,
      created_by BIGINT UNSIGNED NULL,
      updated_by BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_dashboards_key_unique (dashboard_key),
      KEY crm_dashboards_status_updated_idx (dashboard_status, updated_at),
      KEY crm_dashboards_published_version_idx (published_version_id),
      CONSTRAINT crm_dashboards_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT crm_dashboards_updated_by_fk FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_dashboard_widgets (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      dashboard_id BIGINT UNSIGNED NOT NULL,
      widget_key VARCHAR(80) NOT NULL,
      data_source_id BIGINT UNSIGNED NULL,
      widget_type VARCHAR(40) NOT NULL,
      title VARCHAR(160) NOT NULL,
      description VARCHAR(500) NULL,
      sort_order INT UNSIGNED NOT NULL DEFAULT 0,
      layout_json JSON NOT NULL,
      config_json JSON NOT NULL,
      is_archived TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_dashboard_widgets_key_unique (dashboard_id, widget_key),
      KEY crm_dashboard_widgets_source_idx (data_source_id),
      CONSTRAINT crm_dashboard_widgets_dashboard_fk FOREIGN KEY (dashboard_id) REFERENCES crm_dashboards(id) ON DELETE CASCADE,
      CONSTRAINT crm_dashboard_widgets_source_fk FOREIGN KEY (data_source_id) REFERENCES crm_dashboard_data_sources(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_dashboard_filters (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      dashboard_id BIGINT UNSIGNED NOT NULL,
      filter_key VARCHAR(80) NOT NULL,
      name VARCHAR(160) NOT NULL,
      filter_type VARCHAR(40) NOT NULL,
      sort_order INT UNSIGNED NOT NULL DEFAULT 0,
      config_json JSON NOT NULL,
      is_archived TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_dashboard_filters_key_unique (dashboard_id, filter_key),
      CONSTRAINT crm_dashboard_filters_dashboard_fk FOREIGN KEY (dashboard_id) REFERENCES crm_dashboards(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_dashboard_permissions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      dashboard_id BIGINT UNSIGNED NOT NULL,
      subject_type ENUM('role', 'user', 'department') NOT NULL,
      subject_key VARCHAR(80) NOT NULL,
      can_view TINYINT(1) NOT NULL DEFAULT 0,
      can_configure TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_dashboard_permissions_subject_unique (dashboard_id, subject_type, subject_key),
      CONSTRAINT crm_dashboard_permissions_dashboard_fk FOREIGN KEY (dashboard_id) REFERENCES crm_dashboards(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_dashboard_versions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      dashboard_id BIGINT UNSIGNED NOT NULL,
      version_number INT UNSIGNED NOT NULL,
      version_action VARCHAR(40) NOT NULL,
      name VARCHAR(160) NULL,
      remark VARCHAR(500) NULL,
      snapshot_json JSON NOT NULL,
      created_by BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_dashboard_versions_number_unique (dashboard_id, version_number),
      KEY crm_dashboard_versions_created_by_fk (created_by),
      CONSTRAINT crm_dashboard_versions_dashboard_fk FOREIGN KEY (dashboard_id) REFERENCES crm_dashboards(id) ON DELETE CASCADE,
      CONSTRAINT crm_dashboard_versions_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await ensureForeignKey(
    connection,
    'crm_dashboards',
    'crm_dashboards_published_version_fk',
    'FOREIGN KEY (`published_version_id`) REFERENCES `crm_dashboard_versions` (`id`) ON DELETE RESTRICT'
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_workflow_definitions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      workflow_key VARCHAR(80) NOT NULL,
      request_prefix VARCHAR(20) NOT NULL,
      next_request_number BIGINT UNSIGNED NOT NULL DEFAULT 1,
      name VARCHAR(160) NOT NULL,
      description VARCHAR(500) NULL,
      workflow_status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
      schema_version INT UNSIGNED NOT NULL DEFAULT 1,
      current_version INT UNSIGNED NOT NULL DEFAULT 0,
      published_version_id BIGINT UNSIGNED NULL,
      source_module_key VARCHAR(80) NOT NULL,
      request_form_key VARCHAR(80) NULL,
      request_form_version INT UNSIGNED NULL,
      draft_config_json JSON NULL,
      created_by BIGINT UNSIGNED NULL,
      updated_by BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_workflow_definitions_key_unique (workflow_key),
      UNIQUE KEY crm_workflow_definitions_request_prefix_unique (request_prefix),
      KEY crm_workflow_definitions_status_source_idx (workflow_status, source_module_key),
      KEY crm_workflow_definitions_published_version_idx (published_version_id),
      CONSTRAINT crm_workflow_definitions_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT crm_workflow_definitions_updated_by_fk FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await ensureColumn(connection, 'crm_workflow_definitions', 'request_prefix', '`request_prefix` VARCHAR(20) NULL AFTER `workflow_key`');
  await connection.query(
    `UPDATE crm_workflow_definitions
     SET request_prefix = UPPER(LEFT(REPLACE(workflow_key, '_', ''), 20))
     WHERE request_prefix IS NULL OR request_prefix = ''`
  );
  await connection.query(
    'ALTER TABLE crm_workflow_definitions MODIFY request_prefix VARCHAR(20) NOT NULL'
  );
  await ensureColumn(connection, 'crm_workflow_definitions', 'next_request_number', '`next_request_number` BIGINT UNSIGNED NOT NULL DEFAULT 1 AFTER `request_prefix`');
  await ensureIndex(
    connection,
    'crm_workflow_definitions',
    'crm_workflow_definitions_request_prefix_unique',
    'UNIQUE KEY `crm_workflow_definitions_request_prefix_unique` (`request_prefix`)'
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_workflow_versions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      workflow_id BIGINT UNSIGNED NOT NULL,
      version_number INT UNSIGNED NOT NULL,
      schema_version INT UNSIGNED NOT NULL DEFAULT 1,
      version_action VARCHAR(40) NOT NULL,
      summary VARCHAR(500) NULL,
      snapshot_json JSON NOT NULL,
      snapshot_checksum CHAR(64) NOT NULL,
      created_by BIGINT UNSIGNED NULL,
      published_by BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      published_at TIMESTAMP NULL,
      PRIMARY KEY (id),
      UNIQUE KEY crm_workflow_versions_number_unique (workflow_id, version_number),
      KEY crm_workflow_versions_checksum_idx (workflow_id, snapshot_checksum),
      KEY crm_workflow_versions_published_at_idx (workflow_id, published_at),
      CONSTRAINT crm_workflow_versions_workflow_fk FOREIGN KEY (workflow_id) REFERENCES crm_workflow_definitions(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_versions_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT crm_workflow_versions_published_by_fk FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await dropIndexIfExists(connection, 'crm_workflow_versions', 'crm_workflow_versions_checksum_unique');
  await ensureIndex(
    connection,
    'crm_workflow_versions',
    'crm_workflow_versions_checksum_idx',
    'INDEX `crm_workflow_versions_checksum_idx` (`workflow_id`, `snapshot_checksum`)'
  );
  await ensureForeignKey(
    connection,
    'crm_workflow_definitions',
    'crm_workflow_definitions_published_version_fk',
    'FOREIGN KEY (`published_version_id`) REFERENCES `crm_workflow_versions` (`id`) ON DELETE RESTRICT'
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_workflow_version_stages (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      workflow_version_id BIGINT UNSIGNED NOT NULL,
      stage_key VARCHAR(80) NOT NULL,
      name VARCHAR(160) NOT NULL,
      stage_order INT UNSIGNED NOT NULL,
      is_enabled TINYINT(1) NOT NULL DEFAULT 1,
      condition_json JSON NULL,
      skip_when_condition_false TINYINT(1) NOT NULL DEFAULT 0,
      approval_mode ENUM('all') NOT NULL DEFAULT 'all',
      self_approval_policy ENUM('error', 'auto_approve') NOT NULL DEFAULT 'error',
      decision_policy_json JSON NULL,
      attachment_policy_json JSON NULL,
      sla_policy_json JSON NULL,
      event_policy_json JSON NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_workflow_version_stages_key_unique (workflow_version_id, stage_key),
      UNIQUE KEY crm_workflow_version_stages_order_unique (workflow_version_id, stage_order),
      CONSTRAINT crm_workflow_version_stages_version_fk FOREIGN KEY (workflow_version_id) REFERENCES crm_workflow_versions(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await ensureColumn(connection, 'crm_workflow_version_stages', 'email_policy_json', '`email_policy_json` JSON NULL AFTER `sla_policy_json`');
  await connection.query("ALTER TABLE crm_workflow_version_stages MODIFY approval_mode ENUM('all', 'any', 'quorum') NOT NULL DEFAULT 'all'");
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_workflow_version_approver_rules (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      version_stage_id BIGINT UNSIGNED NOT NULL,
      rule_key VARCHAR(80) NOT NULL,
      rule_order INT UNSIGNED NOT NULL DEFAULT 0,
      resolver_type ENUM('user', 'role', 'reporting_manager', 'organization_responsibility', 'record_user_field') NOT NULL,
      resolver_reference VARCHAR(190) NULL,
      resolver_config_json JSON NULL,
      authority_condition_json JSON NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_workflow_approver_rules_key_unique (version_stage_id, rule_key),
      UNIQUE KEY crm_workflow_approver_rules_order_unique (version_stage_id, rule_order),
      KEY crm_workflow_approver_rules_resolver_idx (resolver_type, resolver_reference),
      CONSTRAINT crm_workflow_approver_rules_stage_fk FOREIGN KEY (version_stage_id) REFERENCES crm_workflow_version_stages(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_workflow_instances (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      request_key VARCHAR(100) NOT NULL,
      workflow_id BIGINT UNSIGNED NOT NULL,
      workflow_version_id BIGINT UNSIGNED NOT NULL,
      source_module_key VARCHAR(80) NOT NULL,
      source_record_id VARCHAR(100) NOT NULL,
      source_record_version VARCHAR(100) NULL,
      requester_user_id BIGINT UNSIGNED NULL,
      request_status ENUM('draft', 'pending', 'returned', 'approved', 'rejected', 'withdrawn', 'cancelled') NOT NULL DEFAULT 'draft',
      current_stage_key VARCHAR(80) NULL,
      lock_version INT UNSIGNED NOT NULL DEFAULT 0,
      terminal_reason_code VARCHAR(80) NULL,
      terminal_remark VARCHAR(1000) NULL,
      submitted_at TIMESTAMP NULL,
      completed_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_workflow_instances_request_key_unique (request_key),
      KEY crm_workflow_instances_source_status_idx (source_module_key, source_record_id, request_status),
      KEY crm_workflow_instances_requester_status_idx (requester_user_id, request_status, updated_at),
      KEY crm_workflow_instances_workflow_status_idx (workflow_id, request_status, updated_at),
      KEY crm_workflow_instances_current_stage_idx (workflow_version_id, current_stage_key, request_status),
      CONSTRAINT crm_workflow_instances_workflow_fk FOREIGN KEY (workflow_id) REFERENCES crm_workflow_definitions(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_instances_version_fk FOREIGN KEY (workflow_version_id) REFERENCES crm_workflow_versions(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_instances_requester_fk FOREIGN KEY (requester_user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_workflow_instance_snapshots (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      instance_id BIGINT UNSIGNED NOT NULL,
      revision_number INT UNSIGNED NOT NULL,
      source_record_version VARCHAR(100) NULL,
      snapshot_json JSON NOT NULL,
      snapshot_checksum CHAR(64) NOT NULL,
      created_by BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_workflow_snapshots_revision_unique (instance_id, revision_number),
      UNIQUE KEY crm_workflow_snapshots_checksum_unique (instance_id, snapshot_checksum),
      CONSTRAINT crm_workflow_snapshots_instance_fk FOREIGN KEY (instance_id) REFERENCES crm_workflow_instances(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_snapshots_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_workflow_instance_stages (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      instance_id BIGINT UNSIGNED NOT NULL,
      version_stage_id BIGINT UNSIGNED NOT NULL,
      snapshot_id BIGINT UNSIGNED NOT NULL,
      stage_key VARCHAR(80) NOT NULL,
      stage_order INT UNSIGNED NOT NULL,
      stage_status ENUM('waiting', 'active', 'approved', 'rejected', 'returned', 'skipped', 'auto_approved', 'cancelled') NOT NULL DEFAULT 'waiting',
      lock_version INT UNSIGNED NOT NULL DEFAULT 0,
      reason_code VARCHAR(80) NULL,
      reason_message VARCHAR(500) NULL,
      due_at TIMESTAMP NULL,
      overdue_at TIMESTAMP NULL,
      activated_at TIMESTAMP NULL,
      completed_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_workflow_instance_stages_key_unique (instance_id, stage_key),
      UNIQUE KEY crm_workflow_instance_stages_order_unique (instance_id, stage_order),
      KEY crm_workflow_instance_stages_status_due_idx (stage_status, due_at),
      CONSTRAINT crm_workflow_instance_stages_instance_fk FOREIGN KEY (instance_id) REFERENCES crm_workflow_instances(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_instance_stages_version_stage_fk FOREIGN KEY (version_stage_id) REFERENCES crm_workflow_version_stages(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_instance_stages_snapshot_fk FOREIGN KEY (snapshot_id) REFERENCES crm_workflow_instance_snapshots(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_workflow_assignments (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      instance_stage_id BIGINT UNSIGNED NOT NULL,
      approver_rule_id BIGINT UNSIGNED NULL,
      approver_user_id BIGINT UNSIGNED NULL,
      resolver_type VARCHAR(40) NOT NULL,
      resolver_reference VARCHAR(190) NULL,
      approver_identity_json JSON NOT NULL,
      assignment_status ENUM('pending', 'approved', 'rejected', 'returned', 'cancelled') NOT NULL DEFAULT 'pending',
      authority_evaluation_json JSON NULL,
      lock_version INT UNSIGNED NOT NULL DEFAULT 0,
      due_at TIMESTAMP NULL,
      escalated_at TIMESTAMP NULL,
      decided_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_workflow_assignments_stage_user_unique (instance_stage_id, approver_user_id),
      KEY crm_workflow_assignments_inbox_idx (approver_user_id, assignment_status, due_at),
      KEY crm_workflow_assignments_stage_status_idx (instance_stage_id, assignment_status),
      CONSTRAINT crm_workflow_assignments_stage_fk FOREIGN KEY (instance_stage_id) REFERENCES crm_workflow_instance_stages(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_assignments_rule_fk FOREIGN KEY (approver_rule_id) REFERENCES crm_workflow_version_approver_rules(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_assignments_user_fk FOREIGN KEY (approver_user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_workflow_decisions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      instance_id BIGINT UNSIGNED NOT NULL,
      instance_stage_id BIGINT UNSIGNED NOT NULL,
      assignment_id BIGINT UNSIGNED NULL,
      snapshot_id BIGINT UNSIGNED NOT NULL,
      decision_action ENUM('approve', 'reject', 'return', 'withdraw', 'cancel', 'skip', 'auto_approve') NOT NULL,
      actor_user_id BIGINT UNSIGNED NULL,
      actor_identity_json JSON NOT NULL,
      remark VARCHAR(2000) NULL,
      response_json JSON NULL,
      instance_lock_version INT UNSIGNED NOT NULL,
      assignment_lock_version INT UNSIGNED NULL,
      idempotency_key VARCHAR(120) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_workflow_decisions_idempotency_unique (idempotency_key),
      KEY crm_workflow_decisions_instance_time_idx (instance_id, created_at),
      KEY crm_workflow_decisions_stage_time_idx (instance_stage_id, created_at),
      CONSTRAINT crm_workflow_decisions_instance_fk FOREIGN KEY (instance_id) REFERENCES crm_workflow_instances(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_decisions_stage_fk FOREIGN KEY (instance_stage_id) REFERENCES crm_workflow_instance_stages(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_decisions_assignment_fk FOREIGN KEY (assignment_id) REFERENCES crm_workflow_assignments(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_decisions_snapshot_fk FOREIGN KEY (snapshot_id) REFERENCES crm_workflow_instance_snapshots(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_decisions_actor_fk FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await ensureColumn(connection, 'crm_workflow_decisions', 'response_json', '`response_json` JSON NULL AFTER `remark`');
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_workflow_attachments (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      instance_id BIGINT UNSIGNED NOT NULL,
      decision_id BIGINT UNSIGNED NULL,
      uploaded_by BIGINT UNSIGNED NULL,
      attachment_purpose ENUM('submission', 'approval', 'rejection', 'return') NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      content_type VARCHAR(160) NOT NULL,
      file_size BIGINT UNSIGNED NOT NULL,
      storage_key VARCHAR(500) NOT NULL,
      file_checksum CHAR(64) NOT NULL,
      file_data LONGBLOB NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_workflow_attachments_storage_unique (storage_key),
      KEY crm_workflow_attachments_instance_time_idx (instance_id, created_at),
      KEY crm_workflow_attachments_decision_idx (decision_id),
      CONSTRAINT crm_workflow_attachments_instance_fk FOREIGN KEY (instance_id) REFERENCES crm_workflow_instances(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_attachments_decision_fk FOREIGN KEY (decision_id) REFERENCES crm_workflow_decisions(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_attachments_uploaded_by_fk FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await ensureColumn(connection, 'crm_workflow_attachments', 'file_data', '`file_data` LONGBLOB NULL AFTER `file_checksum`');
  await ensureColumn(connection, 'crm_workflow_attachments', 'scan_status', "`scan_status` ENUM('quarantined', 'clean', 'infected', 'error', 'not_required') NOT NULL DEFAULT 'not_required' AFTER `file_data`");
  await ensureColumn(connection, 'crm_workflow_attachments', 'scan_engine', '`scan_engine` VARCHAR(80) NULL AFTER `scan_status`');
  await ensureColumn(connection, 'crm_workflow_attachments', 'scan_result', '`scan_result` VARCHAR(500) NULL AFTER `scan_engine`');
  await ensureColumn(connection, 'crm_workflow_attachments', 'scanned_at', '`scanned_at` TIMESTAMP NULL AFTER `scan_result`');
  await connection.query("ALTER TABLE crm_workflow_attachments MODIFY scan_status ENUM('quarantined', 'clean', 'infected', 'error', 'not_required') NOT NULL DEFAULT 'not_required'");
  await connection.query("UPDATE crm_workflow_attachments SET scan_status = 'not_required' WHERE scan_status = 'quarantined' AND scan_engine IS NULL AND scanned_at IS NULL");
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_workflow_record_locks (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      source_module_key VARCHAR(80) NOT NULL,
      source_record_id VARCHAR(100) NOT NULL,
      instance_id BIGINT UNSIGNED NOT NULL,
      lock_scope ENUM('record', 'fields') NOT NULL DEFAULT 'record',
      locked_fields_json JSON NULL,
      locked_by BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_workflow_record_locks_source_unique (source_module_key, source_record_id),
      UNIQUE KEY crm_workflow_record_locks_instance_unique (instance_id),
      CONSTRAINT crm_workflow_record_locks_instance_fk FOREIGN KEY (instance_id) REFERENCES crm_workflow_instances(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_record_locks_user_fk FOREIGN KEY (locked_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_workflow_events (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      event_key VARCHAR(120) NOT NULL,
      event_type VARCHAR(80) NOT NULL,
      event_schema_version INT UNSIGNED NOT NULL DEFAULT 1,
      instance_id BIGINT UNSIGNED NOT NULL,
      instance_stage_id BIGINT UNSIGNED NULL,
      decision_id BIGINT UNSIGNED NULL,
      payload_json JSON NOT NULL,
      delivery_status ENUM('pending', 'processing', 'delivered', 'failed') NOT NULL DEFAULT 'pending',
      attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
      next_attempt_at TIMESTAMP NULL,
      delivered_at TIMESTAMP NULL,
      last_error_code VARCHAR(80) NULL,
      last_error_message VARCHAR(500) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_workflow_events_key_unique (event_key),
      KEY crm_workflow_events_delivery_idx (delivery_status, next_attempt_at, created_at),
      KEY crm_workflow_events_instance_time_idx (instance_id, created_at),
      CONSTRAINT crm_workflow_events_instance_fk FOREIGN KEY (instance_id) REFERENCES crm_workflow_instances(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_events_stage_fk FOREIGN KEY (instance_stage_id) REFERENCES crm_workflow_instance_stages(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_events_decision_fk FOREIGN KEY (decision_id) REFERENCES crm_workflow_decisions(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_workflow_idempotency_keys (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      command_scope VARCHAR(80) NOT NULL,
      actor_user_id BIGINT UNSIGNED NULL,
      actor_key VARCHAR(100) NOT NULL,
      idempotency_key VARCHAR(120) NOT NULL,
      request_hash CHAR(64) NOT NULL,
      instance_id BIGINT UNSIGNED NULL,
      decision_id BIGINT UNSIGNED NULL,
      response_status SMALLINT UNSIGNED NULL,
      response_json JSON NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_workflow_idempotency_scope_unique (command_scope, actor_key, idempotency_key),
      KEY crm_workflow_idempotency_expiry_idx (expires_at),
      CONSTRAINT crm_workflow_idempotency_actor_fk FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT crm_workflow_idempotency_instance_fk FOREIGN KEY (instance_id) REFERENCES crm_workflow_instances(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_idempotency_decision_fk FOREIGN KEY (decision_id) REFERENCES crm_workflow_decisions(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_workflow_audit_logs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      workflow_id BIGINT UNSIGNED NULL,
      instance_id BIGINT UNSIGNED NULL,
      instance_stage_id BIGINT UNSIGNED NULL,
      actor_user_id BIGINT UNSIGNED NULL,
      action VARCHAR(80) NOT NULL,
      target_type VARCHAR(80) NULL,
      target_key VARCHAR(190) NULL,
      result ENUM('allowed', 'denied', 'failed') NOT NULL,
      reason_code VARCHAR(80) NOT NULL,
      metadata_json JSON NULL,
      correlation_id VARCHAR(120) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY crm_workflow_audit_instance_time_idx (instance_id, created_at),
      KEY crm_workflow_audit_workflow_time_idx (workflow_id, created_at),
      KEY crm_workflow_audit_actor_result_idx (actor_user_id, result, created_at),
      KEY crm_workflow_audit_correlation_idx (correlation_id),
      CONSTRAINT crm_workflow_audit_workflow_fk FOREIGN KEY (workflow_id) REFERENCES crm_workflow_definitions(id) ON DELETE SET NULL,
      CONSTRAINT crm_workflow_audit_instance_fk FOREIGN KEY (instance_id) REFERENCES crm_workflow_instances(id) ON DELETE SET NULL,
      CONSTRAINT crm_workflow_audit_stage_fk FOREIGN KEY (instance_stage_id) REFERENCES crm_workflow_instance_stages(id) ON DELETE SET NULL,
      CONSTRAINT crm_workflow_audit_actor_fk FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_workflow_delegations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      delegator_user_id BIGINT UNSIGNED NOT NULL,
      delegate_user_id BIGINT UNSIGNED NOT NULL,
      workflow_key VARCHAR(80) NULL,
      scope_role VARCHAR(40) NULL,
      scope_department_id BIGINT UNSIGNED NULL,
      starts_at DATETIME NOT NULL,
      ends_at DATETIME NOT NULL,
      reason VARCHAR(500) NOT NULL,
      delegation_status ENUM('active', 'cancelled') NOT NULL DEFAULT 'active',
      created_by BIGINT UNSIGNED NOT NULL,
      cancelled_by BIGINT UNSIGNED NULL,
      cancelled_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY crm_workflow_delegations_lookup_idx (delegator_user_id, delegation_status, starts_at, ends_at),
      CONSTRAINT crm_workflow_delegations_delegator_fk FOREIGN KEY (delegator_user_id) REFERENCES users(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_delegations_delegate_fk FOREIGN KEY (delegate_user_id) REFERENCES users(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_delegations_creator_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_delegations_canceller_fk FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_workflow_assignment_transfers (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      instance_id BIGINT UNSIGNED NOT NULL,
      instance_stage_id BIGINT UNSIGNED NOT NULL,
      original_assignment_id BIGINT UNSIGNED NOT NULL,
      replacement_assignment_id BIGINT UNSIGNED NOT NULL,
      transfer_type ENUM('delegation', 'reassignment') NOT NULL,
      delegation_id BIGINT UNSIGNED NULL,
      original_approver_user_id BIGINT UNSIGNED NULL,
      replacement_approver_user_id BIGINT UNSIGNED NOT NULL,
      reason VARCHAR(500) NOT NULL,
      transferred_by BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crm_workflow_assignment_transfers_replacement_unique (replacement_assignment_id),
      KEY crm_workflow_assignment_transfers_instance_idx (instance_id, created_at),
      CONSTRAINT crm_workflow_assignment_transfers_instance_fk FOREIGN KEY (instance_id) REFERENCES crm_workflow_instances(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_assignment_transfers_stage_fk FOREIGN KEY (instance_stage_id) REFERENCES crm_workflow_instance_stages(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_assignment_transfers_original_fk FOREIGN KEY (original_assignment_id) REFERENCES crm_workflow_assignments(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_assignment_transfers_replacement_fk FOREIGN KEY (replacement_assignment_id) REFERENCES crm_workflow_assignments(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_assignment_transfers_delegation_fk FOREIGN KEY (delegation_id) REFERENCES crm_workflow_delegations(id) ON DELETE SET NULL,
      CONSTRAINT crm_workflow_assignment_transfers_original_user_fk FOREIGN KEY (original_approver_user_id) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT crm_workflow_assignment_transfers_replacement_user_fk FOREIGN KEY (replacement_approver_user_id) REFERENCES users(id) ON DELETE RESTRICT,
      CONSTRAINT crm_workflow_assignment_transfers_actor_fk FOREIGN KEY (transferred_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_menu_definitions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      menu_key VARCHAR(80) NOT NULL,
      draft_json JSON NOT NULL,
      published_json JSON NULL,
      published_version INT UNSIGNED NOT NULL DEFAULT 0,
      updated_by BIGINT UNSIGNED NULL,
      published_by BIGINT UNSIGNED NULL,
      published_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id), UNIQUE KEY crm_menu_definitions_key_unique (menu_key),
      CONSTRAINT crm_menu_definitions_updated_by_fk FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT crm_menu_definitions_published_by_fk FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await connection.query(
    `CREATE TABLE IF NOT EXISTS crm_menu_versions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      menu_key VARCHAR(80) NOT NULL,
      version_number INT UNSIGNED NOT NULL,
      config_json JSON NOT NULL,
      created_by BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id), UNIQUE KEY crm_menu_versions_number_unique (menu_key, version_number),
      CONSTRAINT crm_menu_versions_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
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
