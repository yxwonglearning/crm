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
    field.formulaExpression || null,
    field.formulaEnabled ? 1 : 0,
    field.formulaJs || null,
    field.formulaFunctionName || null,
    field.formulaFunctionBody || null,
    field.formulaSql || null,
    field.validationRules ? JSON.stringify(field.validationRules) : null,
    field.lookupConfig ? JSON.stringify(field.lookupConfig) : null,
    field.required ? 1 : 0,
    field.showInTable ? 1 : 0,
    field.showInForm ? 1 : 0,
    field.showInImport ? 1 : 0,
    field.searchable ? 1 : 0,
    field.sortOrder || 100,
    field.locked ? 1 : 0,
    field.archived ? 1 : 0
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

function parseJsonObject(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (_error) {
    return {};
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
    formulaExpression: row.formula_expression || '',
    formulaEnabled: Boolean(row.formula_enabled),
    formulaJs: row.formula_js || '',
    formulaFunctionName: row.formula_function_name || '',
    formulaFunctionBody: row.formula_function_body || '',
    formulaSql: row.formula_sql || '',
    validationRules: parseJsonObject(row.validation_json),
    lookupConfig: parseJsonObject(row.lookup_json),
    required: Boolean(row.is_required),
    showInTable: Boolean(row.show_in_table),
    showInForm: Boolean(row.show_in_form),
    showInImport: Boolean(row.show_in_import),
    searchable: Boolean(row.is_searchable),
    sortOrder: row.sort_order,
    locked: Boolean(row.is_locked),
    archived: Boolean(row.is_archived),
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

function moduleDataTable(moduleKey) {
  const tables = {
    customers: 'customers',
    users: 'users'
  };
  return tables[moduleKey] || moduleKey;
}

function nonEmptyColumnCondition(column, type) {
  const identifier = sqlIdentifier(column);
  if (type === 'checkbox') {
    return `${identifier} = 1`;
  }
  return `${identifier} IS NOT NULL AND TRIM(CAST(${identifier} AS CHAR)) <> ''`;
}

function customFieldJsonPath(fieldKey) {
  return `$.${JSON.stringify(String(fieldKey || ''))}`;
}

function nonEmptyCustomFieldCondition(type) {
  if (type === 'checkbox') {
    return `JSON_UNQUOTE(JSON_EXTRACT(custom_fields, ?)) IN ('true', '1')`;
  }
  return `JSON_EXTRACT(custom_fields, ?) IS NOT NULL
    AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(custom_fields, ?)), '') NOT IN ('', 'null')`;
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
      formula_expression,
      formula_enabled,
      formula_js,
      formula_function_name,
      formula_function_body,
      formula_sql,
      validation_json,
      lookup_json,
      is_required,
      show_in_table,
      show_in_form,
      show_in_import,
      is_searchable,
      sort_order,
      is_locked,
      is_archived
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
     WHERE module_id = ? AND is_archived = 0
     ORDER BY sort_order ASC, id ASC`,
    [module.id]
  );
  return rows.map(normalizeField);
}

async function listArchivedFields(moduleKey) {
  const module = await findModuleByKey(moduleKey);
  if (!module) return [];
  const [rows] = await pool.execute(
    `SELECT * FROM crm_module_fields
     WHERE module_id = ? AND is_archived = 1
     ORDER BY updated_at DESC, sort_order ASC, id ASC`,
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

async function listFormLayouts(moduleKey) {
  const module = await findModuleByKey(moduleKey);
  if (!module) return [];
  const [rows] = await pool.execute(
    `SELECT layout_state, form_type, layout_json
     FROM crm_module_form_layouts
     WHERE module_id = ?`,
    [module.id]
  );
  return rows.map((row) => ({
    state: row.layout_state,
    formType: row.form_type,
    layout: parseJsonObject(row.layout_json)
  }));
}

async function upsertFormLayout(moduleKey, layoutState, formType, layout) {
  const module = await findModuleByKey(moduleKey);
  if (!module) return 0;
  const [result] = await pool.execute(
    `INSERT INTO crm_module_form_layouts (module_id, layout_state, form_type, layout_json)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE layout_json = VALUES(layout_json)`,
    [module.id, layoutState, formType, JSON.stringify(layout || {})]
  );
  return result.affectedRows;
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
      formula_expression,
      formula_enabled,
      formula_js,
      formula_function_name,
      formula_function_body,
      formula_sql,
      validation_json,
      lookup_json,
      is_required,
      show_in_table,
      show_in_form,
      show_in_import,
      is_searchable,
      sort_order,
      is_locked,
      is_archived
    ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
    [
      moduleId,
      field.fieldKey,
      field.label,
      field.type,
      field.tableType || 'main',
      field.detailTableName || null,
      field.options ? JSON.stringify(field.options) : null,
      field.formulaExpression || null,
      field.formulaEnabled ? 1 : 0,
      field.formulaJs || null,
      field.formulaFunctionName || null,
      field.formulaFunctionBody || null,
      field.formulaSql || null,
      field.validationRules ? JSON.stringify(field.validationRules) : null,
      field.lookupConfig ? JSON.stringify(field.lookupConfig) : null,
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

async function detailTableExists(tableName) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  return Number(rows[0]?.count || 0) > 0;
}

async function renameDetailTable(moduleKey, oldTableName, newTableName) {
  assertSafeIdentifier(oldTableName);
  assertSafeIdentifier(newTableName);
  const module = await findModuleByKey(moduleKey);
  if (!module) return 0;

  const oldExists = await detailTableExists(oldTableName);
  const newExists = await detailTableExists(newTableName);
  if (oldExists && !newExists) {
    await pool.query(`RENAME TABLE ${sqlIdentifier(oldTableName)} TO ${sqlIdentifier(newTableName)}`);
  }

  const [result] = await pool.execute(
    `UPDATE crm_module_fields
     SET detail_table_name = ?
     WHERE module_id = ? AND field_table = 'detail' AND detail_table_name = ?`,
    [newTableName, module.id, oldTableName]
  );
  return result.affectedRows;
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
    formulaExpression: 'formula_expression',
    formulaEnabled: 'formula_enabled',
    formulaJs: 'formula_js',
    formulaFunctionName: 'formula_function_name',
    formulaFunctionBody: 'formula_function_body',
    formulaSql: 'formula_sql',
    validationRules: 'validation_json',
    lookupConfig: 'lookup_json',
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
    if (key === 'options' || key === 'validationRules' || key === 'lookupConfig') {
      values.push(updates[key] ? JSON.stringify(updates[key]) : null);
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

async function archiveField(moduleKey, fieldKey) {
  const module = await findModuleByKey(moduleKey);
  if (!module) return 0;
  const [result] = await pool.execute(
    `UPDATE crm_module_fields
     SET is_archived = 1, show_in_table = 0, show_in_form = 0, show_in_import = 0
     WHERE module_id = ? AND field_key = ? AND is_locked = 0`,
    [module.id, fieldKey]
  );
  return result.affectedRows;
}

async function unarchiveField(moduleKey, fieldKey) {
  const module = await findModuleByKey(moduleKey);
  if (!module) return 0;
  const [result] = await pool.execute(
    `UPDATE crm_module_fields
     SET is_archived = 0
     WHERE module_id = ? AND field_key = ? AND is_locked = 0`,
    [module.id, fieldKey]
  );
  return result.affectedRows;
}

async function fieldDataCount(moduleKey, field) {
  if (!field) return 0;

  if (field.tableType === 'detail' && field.detailTableName) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS count
       FROM ${sqlIdentifier(field.detailTableName)}
       WHERE ${nonEmptyColumnCondition(field.fieldKey, field.type)}`,
      []
    );
    return Number(rows[0]?.count || 0);
  }

  if (!field.dataKey) {
    const jsonPath = customFieldJsonPath(field.fieldKey);
    const values = field.type === 'checkbox' ? [jsonPath] : [jsonPath, jsonPath];
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS count
       FROM ${sqlIdentifier(moduleDataTable(moduleKey))}
       WHERE ${nonEmptyCustomFieldCondition(field.type)}`,
      values
    );
    return Number(rows[0]?.count || 0);
  }

  return 0;
}

function normalizeBrowserButton(row) {
  return {
    id: row.id,
    browserKey: row.browser_key,
    name: row.name,
    sourceModule: row.source_module,
    sourceTable: row.source_table,
    valueField: row.value_field,
    displayField: row.display_field,
    searchFields: parseOptions(row.search_fields_json),
    returnFields: parseOptions(row.return_fields_json),
    filter: parseJsonObject(row.filter_json),
    system: Boolean(row.is_system),
    enabled: Boolean(row.is_enabled)
  };
}

function toDbBrowserButton(browser) {
  return [
    browser.browserKey,
    browser.name,
    browser.sourceModule,
    browser.sourceTable,
    browser.valueField || 'id',
    browser.displayField,
    JSON.stringify(browser.searchFields || []),
    JSON.stringify(browser.returnFields || []),
    browser.filter ? JSON.stringify(browser.filter) : null,
    browser.system ? 1 : 0,
    browser.enabled !== false ? 1 : 0
  ];
}

async function upsertBrowserButton(browser) {
  await pool.execute(
    `INSERT INTO crm_browser_buttons (
      browser_key,
      name,
      source_module,
      source_table,
      value_field,
      display_field,
      search_fields_json,
      return_fields_json,
      filter_json,
      is_system,
      is_enabled
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      source_module = VALUES(source_module),
      source_table = VALUES(source_table),
      value_field = VALUES(value_field),
      display_field = VALUES(display_field),
      search_fields_json = VALUES(search_fields_json),
      return_fields_json = VALUES(return_fields_json),
      filter_json = VALUES(filter_json),
      is_system = VALUES(is_system),
      is_enabled = VALUES(is_enabled)`,
    toDbBrowserButton(browser)
  );
}

async function listBrowserButtons() {
  const [rows] = await pool.execute(
    `SELECT * FROM crm_browser_buttons
     ORDER BY is_system DESC, name ASC`
  );
  return rows.map(normalizeBrowserButton);
}

async function findBrowserButton(browserKey) {
  const [rows] = await pool.execute(
    `SELECT * FROM crm_browser_buttons
     WHERE browser_key = ?
     LIMIT 1`,
    [browserKey]
  );
  return rows[0] ? normalizeBrowserButton(rows[0]) : null;
}

async function deleteBrowserButton(browserKey) {
  const [result] = await pool.execute(
    `DELETE FROM crm_browser_buttons
     WHERE browser_key = ? AND is_system = 0`,
    [browserKey]
  );
  return result.affectedRows;
}

async function browserButtonUsageCount(browserKey) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM crm_module_fields
     WHERE JSON_UNQUOTE(JSON_EXTRACT(lookup_json, '$.browserButtonKey')) = ?`,
    [browserKey]
  );
  return Number(rows[0]?.count || 0);
}

module.exports = {
  upsertModule,
  upsertField,
  findModuleByKey,
  listModules,
  listFields,
  listArchivedFields,
  findField,
  listFormLayouts,
  upsertFormLayout,
  createCustomField,
  ensureDetailTableField,
  renameDetailTable,
  updateField,
  nextSortOrder,
  deleteField,
  archiveField,
  unarchiveField,
  fieldDataCount,
  upsertBrowserButton,
  listBrowserButtons,
  findBrowserButton,
  deleteBrowserButton,
  browserButtonUsageCount
};
