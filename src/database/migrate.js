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
  try {
    await connection.query(
      "ALTER TABLE crm_module_fields MODIFY field_type ENUM('text', 'email', 'phone', 'password', 'number', 'date', 'select', 'textarea', 'country', 'owner', 'checkbox') NOT NULL DEFAULT 'text'"
    );
  } catch (error) {
    if (error.code !== 'ER_NO_SUCH_TABLE') throw error;
  }
  await connection.end();

  console.log('Database migration complete.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
