const { pool } = require('../../database/pool');

function toDbField(moduleId, field) {
  return [
    moduleId,
    field.fieldKey,
    field.dataKey || null,
    field.label,
    field.type,
    field.tableType || 'main',
    field.detailTableName || null,
    field.options ? JSON.stringify(field.options) : null,
    field.required ? 1 : 0,
    field.showInTable ? 1 : 0,
    field.showInForm ? 1 : 0,
    field.showInImport ? 1 : 0,
    field.searchable ? 1 : 0,
    field.sortOrder || 100,
    field.locked ? 1 : 0
  ];
}

function parseOptions(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return String(value)
      .split(',')
      .map((option) => option.trim())
      .filter(Boolean);
  }
}

function normalizeField(row) {
  return {
    id: row.id,
    moduleId: row.module_id,
    fieldKey: row.field_key,
    dataKey: row.data_key,
    label: row.label,
    type: row.field_type,
    tableType: row.field_table || 'main',
    detailTableName: row.detail_table_name,
    options: parseOptions(row.options_json),
    required: Boolean(row.is_required),
    showInTable: Boolean(row.show_in_table),
    showInForm: Boolean(row.show_in_form),
    showInImport: Boolean(row.show_in_import),
    searchable: Boolean(row.is_searchable),
    sortOrder: row.sort_order,
    locked: Boolean(row.is_locked),
    custom: !row.data_key
  };
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

async function upsertModule(module) {
  await pool.execute(
    `INSERT INTO crm_modules (module_key, name, description, is_enabled)
     VALUES (?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), is_enabled = 1`,
    [module.moduleKey, module.name, module.description || null]
  );
  return findModuleByKey(module.moduleKey);
}

async function upsertField(moduleId, field) {
  await pool.execute(
    `INSERT INTO crm_module_fields (
      module_id,
      field_key,
      data_key,
      label,
      field_type,
      field_table,
      detail_table_name,
      options_json,
      is_required,
      show_in_table,
      show_in_form,
      show_in_import,
      is_searchable,
      sort_order,
      is_locked
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE field_key = field_key`,
    toDbField(moduleId, field)
  );
}

async function findModuleByKey(moduleKey) {
  const [rows] = await pool.execute(
    'SELECT * FROM crm_modules WHERE module_key = ? LIMIT 1',
    [moduleKey]
  );
  return rows[0] || null;
}

async function listModules() {
  const [rows] = await pool.execute(
    'SELECT * FROM crm_modules ORDER BY name ASC'
  );
  return rows;
}

async function listFields(moduleKey) {
  const module = await findModuleByKey(moduleKey);
  if (!module) return [];
  const [rows] = await pool.execute(
    `SELECT * FROM crm_module_fields
     WHERE module_id = ?
     ORDER BY sort_order ASC, id ASC`,
    [module.id]
  );
  return rows.map(normalizeField);
}

async function findField(moduleKey, fieldKey) {
  const module = await findModuleByKey(moduleKey);
  if (!module) return null;
  const [rows] = await pool.execute(
    `SELECT * FROM crm_module_fields
     WHERE module_id = ? AND field_key = ?
     LIMIT 1`,
    [module.id, fieldKey]
  );
  return rows[0] ? normalizeField(rows[0]) : null;
}

async function createCustomField(moduleId, field) {
  const [result] = await pool.execute(
    `INSERT INTO crm_module_fields (
      module_id,
      field_key,
      data_key,
      label,
      field_type,
      field_table,
      detail_table_name,
      options_json,
      is_required,
      show_in_table,
      show_in_form,
      show_in_import,
      is_searchable,
      sort_order,
      is_locked
    ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      moduleId,
      field.fieldKey,
      field.label,
      field.type,
      field.tableType || 'main',
      field.detailTableName || null,
      field.options ? JSON.stringify(field.options) : null,
      field.required ? 1 : 0,
      field.showInTable ? 1 : 0,
      field.showInForm ? 1 : 0,
      field.showInImport ? 1 : 0,
      field.searchable ? 1 : 0,
      field.sortOrder || 100
    ]
  );
  return result.insertId;
}

async function ensureDetailTableField(tableName, fieldKey, fieldType) {
  assertSafeIdentifier(tableName);
  assertSafeIdentifier(fieldKey);
  const table = sqlIdentifier(tableName);
  await pool.query(
    `CREATE TABLE IF NOT EXISTS ${table} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      mainid BIGINT UNSIGNED NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY ${sqlIdentifier(`${tableName}_mainid_idx`)} (mainid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );

  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, fieldKey]
  );
  if (rows[0].count === 0) {
    await pool.query(`ALTER TABLE ${table} ADD COLUMN ${sqlIdentifier(fieldKey)} ${sqlTypeForFieldType(fieldType)}`);
  }
}

async function updateField(moduleKey, fieldKey, updates) {
  const module = await findModuleByKey(moduleKey);
  if (!module) return 0;

  const assignments = [];
  const values = [];
  const map = {
    label: 'label',
    type: 'field_type',
    tableType: 'field_table',
    detailTableName: 'detail_table_name',
    options: 'options_json',
    required: 'is_required',
    showInTable: 'show_in_table',
    showInForm: 'show_in_form',
    showInImport: 'show_in_import',
    searchable: 'is_searchable',
    sortOrder: 'sort_order'
  };

  Object.entries(map).forEach(([key, column]) => {
    if (!(key in updates)) return;
    assignments.push(`${column} = ?`);
    if (key === 'options') {
      values.push(updates.options ? JSON.stringify(updates.options) : null);
    } else if (typeof updates[key] === 'boolean') {
      values.push(updates[key] ? 1 : 0);
    } else {
      values.push(updates[key]);
    }
  });

  if (!assignments.length) return 0;
  values.push(module.id, fieldKey);
  const [result] = await pool.execute(
    `UPDATE crm_module_fields SET ${assignments.join(', ')}
     WHERE module_id = ? AND field_key = ?`,
    values
  );
  return result.affectedRows;
}

async function nextSortOrder(moduleId) {
  const [rows] = await pool.execute(
    'SELECT COALESCE(MAX(sort_order), 0) + 10 AS next_sort_order FROM crm_module_fields WHERE module_id = ?',
    [moduleId]
  );
  return rows[0]?.next_sort_order || 10;
}

async function deleteField(moduleKey, fieldKey) {
  const module = await findModuleByKey(moduleKey);
  if (!module) return 0;
  const [result] = await pool.execute(
    `DELETE FROM crm_module_fields
     WHERE module_id = ? AND field_key = ? AND is_locked = 0`,
    [module.id, fieldKey]
  );
  return result.affectedRows;
}

module.exports = {
  upsertModule,
  upsertField,
  findModuleByKey,
  listModules,
  listFields,
  findField,
  createCustomField,
  ensureDetailTableField,
  updateField,
  nextSortOrder,
  deleteField
};
