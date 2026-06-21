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
  await ensureColumn(connection, 'users', 'custom_fields', 'custom_fields JSON NULL AFTER status');
  await ensureColumn(connection, 'customers', 'custom_fields', 'custom_fields JSON NULL AFTER notes');
  await ensureColumn(connection, 'crm_module_fields', 'field_table', "field_table ENUM('main', 'detail') NOT NULL DEFAULT 'main' AFTER field_type");
  await ensureColumn(connection, 'crm_module_fields', 'detail_table_name', 'detail_table_name VARCHAR(80) NULL AFTER field_table');
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
