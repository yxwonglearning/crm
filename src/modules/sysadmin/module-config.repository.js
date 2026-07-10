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
    field.showInExport !== false ? 1 : 0,
    field.importHeader || null,
    field.exportHeader || null,
    field.editable !== false ? 1 : 0,
    field.disableManualInput ? 1 : 0,
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

function parseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
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
    showInExport: row.show_in_export === undefined ? true : Boolean(row.show_in_export),
    importHeader: row.import_header || '',
    exportHeader: row.export_header || '',
    editable: row.is_editable === undefined ? true : Boolean(row.is_editable),
    disableManualInput: Boolean(row.disable_manual_input),
    searchable: Boolean(row.is_searchable),
    sortOrder: row.sort_order,
    locked: Boolean(row.is_locked),
    archived: Boolean(row.is_archived),
    custom: !row.data_key
  };
}

function normalizeStandaloneForm(row) {
  return {
    id: row.id,
    formKey: row.form_key,
    name: row.name,
    description: row.description || '',
    fields: parseJsonArray(row.fields_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at
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

function moduleFieldColumn(moduleKey, field) {
  const columns = {
    customers: {
      companyName: 'company_name',
      email: 'email',
      contactPerson: 'contact_person',
      phoneNumber: 'phone_number',
      countryId: 'country_id',
      status: 'status',
      ownerUserId: 'owner_user_id',
      notes: 'notes'
    },
    users: {
      name: 'name',
      email: 'email',
      password: 'password_hash',
      role: 'role',
      status: 'status'
    }
  };
  return columns[moduleKey]?.[field.fieldKey] || null;
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
    `INSERT INTO crm_modules (module_key, name, description, module_status, show_in_menu, is_system, is_enabled)
     VALUES (?, ?, ?, 'published', 1, 1, 1)
     ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      description = VALUES(description),
      module_status = IF(is_system = 1, VALUES(module_status), module_status),
      show_in_menu = IF(is_system = 1, VALUES(show_in_menu), show_in_menu),
      is_system = 1,
      is_enabled = 1`,
    [module.moduleKey, module.name, module.description || null]
  );
  return findModuleByKey(module.moduleKey);
}

async function createModuleDataTable(moduleKey) {
  assertSafeIdentifier(moduleKey);
  await pool.query(
    `CREATE TABLE IF NOT EXISTS ${sqlIdentifier(moduleKey)} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      custom_fields JSON NULL,
      created_by BIGINT UNSIGNED NULL,
      updated_by BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY (created_by),
      KEY (updated_by),
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
}

async function createModule(module) {
  await createModuleDataTable(module.moduleKey);
  const [result] = await pool.execute(
    `INSERT INTO crm_modules (
      module_key,
      name,
      description,
      module_status,
      show_in_menu,
      is_system,
      is_enabled
    ) VALUES (?, ?, ?, ?, ?, 0, ?)`,
    [
      module.moduleKey,
      module.name,
      module.description || null,
      module.status || 'draft',
      module.showInMenu ? 1 : 0,
      module.status === 'archived' ? 0 : 1
    ]
  );
  return result.insertId;
}

async function updateModule(moduleKey, updates) {
  const assignments = [];
  const values = [];
  const map = {
    name: 'name',
    description: 'description',
    status: 'module_status',
    showInMenu: 'show_in_menu',
    enabled: 'is_enabled'
  };

  Object.entries(map).forEach(([inputKey, column]) => {
    if (updates[inputKey] === undefined) return;
    assignments.push(`${column} = ?`);
    if (inputKey === 'showInMenu' || inputKey === 'enabled') {
      values.push(updates[inputKey] ? 1 : 0);
    } else {
      values.push(updates[inputKey] || null);
    }
  });

  if (!assignments.length) return 0;
  values.push(moduleKey);
  const [result] = await pool.execute(
    `UPDATE crm_modules
     SET ${assignments.join(', ')}
     WHERE module_key = ? AND is_system = 0`,
    values
  );
  return result.affectedRows;
}

async function deleteModule(moduleKey) {
  assertSafeIdentifier(moduleKey);
  const module = await findModuleByKey(moduleKey);
  if (!module || module.is_system) return 0;
  const fields = await listAllFields(moduleKey);
  const [result] = await pool.execute(
    'DELETE FROM crm_modules WHERE module_key = ? AND is_system = 0',
    [moduleKey]
  );
  if (result.affectedRows) {
    for (const field of fields) {
      if (field.tableType === 'detail' && field.detailTableName) {
        await pool.query(`DROP TABLE IF EXISTS ${sqlIdentifier(field.detailTableName)}`);
      }
    }
    await pool.query(`DROP TABLE IF EXISTS ${sqlIdentifier(moduleKey)}`);
  }
  return result.affectedRows;
}

async function moduleRecordCount(moduleKey) {
  assertSafeIdentifier(moduleKey);
  const [existsRows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [moduleKey]
  );
  if (Number(existsRows[0]?.count || 0) === 0) return 0;
  const [rows] = await pool.query(`SELECT COUNT(*) AS count FROM ${sqlIdentifier(moduleKey)}`);
  return Number(rows[0]?.count || 0);
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
      show_in_export,
      import_header,
      export_header,
      is_editable,
      disable_manual_input,
      is_searchable,
      sort_order,
      is_locked,
      is_archived
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

async function listStandaloneForms() {
  const [rows] = await pool.execute(
    `SELECT *
     FROM crm_forms
     ORDER BY name ASC`
  );
  return rows.map(normalizeStandaloneForm);
}

async function findStandaloneForm(formKey) {
  const [rows] = await pool.execute(
    `SELECT *
     FROM crm_forms
     WHERE form_key = ?
     LIMIT 1`,
    [formKey]
  );
  return rows[0] ? normalizeStandaloneForm(rows[0]) : null;
}

async function createStandaloneForm(form, userId = null) {
  const [result] = await pool.execute(
    `INSERT INTO crm_forms (
      form_key,
      name,
      description,
      fields_json,
      created_by,
      updated_by
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      form.formKey,
      form.name,
      form.description || null,
      JSON.stringify(form.fields || []),
      userId || null,
      userId || null
    ]
  );
  return result.insertId;
}

async function deleteStandaloneForm(formKey) {
  const [result] = await pool.execute(
    `DELETE FROM crm_forms
     WHERE form_key = ?`,
    [formKey]
  );
  return result.affectedRows;
}

async function deleteStandaloneFormIfExists(formKey) {
  const [result] = await pool.execute(
    `DELETE FROM crm_forms
     WHERE form_key = ?`,
    [formKey]
  );
  return result.affectedRows;
}

async function updateStandaloneFormFields(formKey, fields, userId = null) {
  const [result] = await pool.execute(
    `UPDATE crm_forms
     SET fields_json = ?, updated_by = ?
     WHERE form_key = ?`,
    [JSON.stringify(fields || []), userId || null, formKey]
  );
  return result.affectedRows;
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

async function listAllFields(moduleKey) {
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

async function replaceFormLayouts(moduleId, formLayouts = {}) {
  await pool.execute('DELETE FROM crm_module_form_layouts WHERE module_id = ?', [moduleId]);
  for (const [state, layoutsByType] of Object.entries(formLayouts || {})) {
    for (const [formType, layout] of Object.entries(layoutsByType || {})) {
      await pool.execute(
        `INSERT INTO crm_module_form_layouts (module_id, layout_state, form_type, layout_json)
         VALUES (?, ?, ?, ?)`,
        [moduleId, state, formType, JSON.stringify(layout || {})]
      );
    }
  }
}

async function replaceFieldDefinition(moduleId, field) {
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
      show_in_export,
      import_header,
      export_header,
      is_editable,
      disable_manual_input,
      is_searchable,
      sort_order,
      is_locked,
      is_archived
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      data_key = VALUES(data_key),
      label = VALUES(label),
      field_type = VALUES(field_type),
      field_table = VALUES(field_table),
      detail_table_name = VALUES(detail_table_name),
      options_json = VALUES(options_json),
      formula_expression = VALUES(formula_expression),
      formula_enabled = VALUES(formula_enabled),
      formula_js = VALUES(formula_js),
      formula_function_name = VALUES(formula_function_name),
      formula_function_body = VALUES(formula_function_body),
      formula_sql = VALUES(formula_sql),
      validation_json = VALUES(validation_json),
      lookup_json = VALUES(lookup_json),
      is_required = VALUES(is_required),
      show_in_table = VALUES(show_in_table),
      show_in_form = VALUES(show_in_form),
      show_in_import = VALUES(show_in_import),
      show_in_export = VALUES(show_in_export),
      import_header = VALUES(import_header),
      export_header = VALUES(export_header),
      is_editable = VALUES(is_editable),
      disable_manual_input = VALUES(disable_manual_input),
      is_searchable = VALUES(is_searchable),
      sort_order = VALUES(sort_order),
      is_locked = VALUES(is_locked),
      is_archived = VALUES(is_archived)`,
    toDbField(moduleId, field)
  );
}

async function restoreConfigSnapshot(moduleKey, snapshot) {
  const module = await findModuleByKey(moduleKey);
  if (!module) return 0;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const fieldKeys = (snapshot.fields || []).map((field) => field.fieldKey).filter(Boolean);
    if (fieldKeys.length) {
      await connection.execute(
        `UPDATE crm_module_fields
         SET is_archived = 1, show_in_table = 0, show_in_form = 0, show_in_import = 0
         WHERE module_id = ? AND is_locked = 0 AND field_key NOT IN (${fieldKeys.map(() => '?').join(', ')})`,
        [module.id, ...fieldKeys]
      );
    } else {
      await connection.execute(
        `UPDATE crm_module_fields
         SET is_archived = 1, show_in_table = 0, show_in_form = 0, show_in_import = 0
         WHERE module_id = ? AND is_locked = 0`,
        [module.id]
      );
    }
    await connection.execute('DELETE FROM crm_module_form_layouts WHERE module_id = ?', [module.id]);
    for (const field of snapshot.fields || []) {
      await connection.execute(
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
          show_in_export,
          import_header,
          export_header,
          is_editable,
          disable_manual_input,
          is_searchable,
          sort_order,
          is_locked,
          is_archived
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          data_key = VALUES(data_key),
          label = VALUES(label),
          field_type = VALUES(field_type),
          field_table = VALUES(field_table),
          detail_table_name = VALUES(detail_table_name),
          options_json = VALUES(options_json),
          formula_expression = VALUES(formula_expression),
          formula_enabled = VALUES(formula_enabled),
          formula_js = VALUES(formula_js),
          formula_function_name = VALUES(formula_function_name),
          formula_function_body = VALUES(formula_function_body),
          formula_sql = VALUES(formula_sql),
          validation_json = VALUES(validation_json),
          lookup_json = VALUES(lookup_json),
          is_required = VALUES(is_required),
          show_in_table = VALUES(show_in_table),
          show_in_form = VALUES(show_in_form),
          show_in_import = VALUES(show_in_import),
          show_in_export = VALUES(show_in_export),
          import_header = VALUES(import_header),
          export_header = VALUES(export_header),
          is_editable = VALUES(is_editable),
          disable_manual_input = VALUES(disable_manual_input),
          is_searchable = VALUES(is_searchable),
          sort_order = VALUES(sort_order),
          is_locked = VALUES(is_locked),
          is_archived = VALUES(is_archived)`,
        toDbField(module.id, field)
      );
    }
    for (const [state, layoutsByType] of Object.entries(snapshot.formLayouts || {})) {
      for (const [formType, layout] of Object.entries(layoutsByType || {})) {
        await connection.execute(
          `INSERT INTO crm_module_form_layouts (module_id, layout_state, form_type, layout_json)
           VALUES (?, ?, ?, ?)`,
          [module.id, state, formType, JSON.stringify(layout || {})]
        );
      }
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  for (const field of snapshot.fields || []) {
    if (field.tableType === 'detail' && field.detailTableName) {
      await ensureDetailTableField(field.detailTableName, field.fieldKey, field.type);
    }
  }
  return 1;
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
      show_in_export,
      import_header,
      export_header,
      is_editable,
      disable_manual_input,
      is_searchable,
      sort_order,
      is_locked,
      is_archived
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    toDbField(moduleId, {
      ...field,
      dataKey: null,
      locked: false,
      archived: false
    })
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
    showInExport: 'show_in_export',
    importHeader: 'import_header',
    exportHeader: 'export_header',
    editable: 'is_editable',
    disableManualInput: 'disable_manual_input',
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

  const column = moduleFieldColumn(moduleKey, field);
  if (column) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS count
       FROM ${sqlIdentifier(moduleDataTable(moduleKey))}
       WHERE ${nonEmptyColumnCondition(column, field.type)}`,
      []
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

async function listBrowserButtonsBySourceModule(moduleKey) {
  const [rows] = await pool.execute(
    `SELECT *
     FROM crm_browser_buttons
     WHERE source_module = ? AND is_system = 0`,
    [moduleKey]
  );
  return rows.map(normalizeBrowserButton);
}

async function clearBrowserButtonReferences(browserKeys = [], sourceModule = '') {
  const keys = browserKeys.map(String).filter(Boolean);
  let affectedRows = 0;
  if (keys.length) {
    const [result] = await pool.execute(
      `UPDATE crm_module_fields
       SET lookup_json = NULL
       WHERE JSON_UNQUOTE(JSON_EXTRACT(lookup_json, '$.browserButtonKey')) IN (${keys.map(() => '?').join(', ')})`,
      keys
    );
    affectedRows += result.affectedRows;
  }
  if (sourceModule) {
    const [result] = await pool.execute(
      `UPDATE crm_module_fields
       SET lookup_json = NULL
       WHERE JSON_UNQUOTE(JSON_EXTRACT(lookup_json, '$.sourceModule')) = ?`,
      [sourceModule]
    );
    affectedRows += result.affectedRows;
  }
  return affectedRows;
}

async function deleteBrowserButtonsBySourceModule(moduleKey) {
  const [result] = await pool.execute(
    `DELETE FROM crm_browser_buttons
     WHERE source_module = ? AND is_system = 0`,
    [moduleKey]
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

function parseSnapshot(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return {};
  }
}

function safeLimit(value, fallback) {
  const limit = Number(value);
  if (!Number.isFinite(limit)) return fallback;
  return Math.min(200, Math.max(1, Math.trunc(limit)));
}

async function createConfigVersion(moduleKey, entry) {
  const module = await findModuleByKey(moduleKey);
  if (!module) return null;
  const [rows] = await pool.execute(
    'SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version FROM crm_module_config_versions WHERE module_id = ?',
    [module.id]
  );
  const versionNumber = rows[0]?.next_version || 1;
  const [result] = await pool.execute(
    `INSERT INTO crm_module_config_versions (
      module_id,
      version_number,
      action,
      summary,
      snapshot_json,
      created_by
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      module.id,
      versionNumber,
      entry.action,
      entry.summary || null,
      JSON.stringify(entry.snapshot || {}),
      entry.userId || null
    ]
  );
  return {
    id: result.insertId,
    moduleId: module.id,
    versionNumber
  };
}

async function latestConfigVersion(moduleKey) {
  const module = await findModuleByKey(moduleKey);
  if (!module) return null;
  const [rows] = await pool.execute(
    `SELECT *
     FROM crm_module_config_versions
     WHERE module_id = ?
     ORDER BY version_number DESC
     LIMIT 1`,
    [module.id]
  );
  if (!rows[0]) return null;
  return {
    id: rows[0].id,
    moduleId: rows[0].module_id,
    versionNumber: rows[0].version_number,
    action: rows[0].action,
    summary: rows[0].summary || '',
    snapshot: parseSnapshot(rows[0].snapshot_json),
    createdAt: rows[0].created_at
  };
}

async function attachPendingAuditLogsToVersion(moduleKey, versionId) {
  const module = await findModuleByKey(moduleKey);
  if (!module) return 0;
  const [result] = await pool.execute(
    `UPDATE crm_module_config_audit_logs
     SET version_id = ?
     WHERE module_id = ? AND version_id IS NULL`,
    [versionId, module.id]
  );
  return result.affectedRows;
}

async function createConfigAuditLog(moduleKey, entry) {
  const module = await findModuleByKey(moduleKey);
  if (!module) return null;
  const [result] = await pool.execute(
    `INSERT INTO crm_module_config_audit_logs (
      module_id,
      version_id,
      action,
      target_type,
      target_key,
      summary,
      before_json,
      after_json,
      changed_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      module.id,
      entry.versionId || null,
      entry.action,
      entry.targetType,
      entry.targetKey || null,
      entry.summary || null,
      entry.before === undefined ? null : JSON.stringify(entry.before),
      entry.after === undefined ? null : JSON.stringify(entry.after),
      entry.userId || null
    ]
  );
  return result.insertId;
}

async function listConfigVersions(moduleKey, limit = 30) {
  const module = await findModuleByKey(moduleKey);
  if (!module) return [];
  const rowLimit = safeLimit(limit, 30);
  const [rows] = await pool.execute(
    `SELECT versions.id,
            versions.version_number,
            versions.action,
            versions.summary,
            versions.created_at,
            users.name AS created_by_name,
            users.email AS created_by_email
     FROM crm_module_config_versions versions
     LEFT JOIN users ON users.id = versions.created_by
     WHERE versions.module_id = ?
     ORDER BY versions.version_number DESC
     LIMIT ${rowLimit}`,
    [module.id]
  );
  return rows.map((row) => ({
    id: row.id,
    versionNumber: row.version_number,
    action: row.action,
    summary: row.summary || '',
    createdAt: row.created_at,
    createdBy: row.created_by_name ? {
      name: row.created_by_name,
      email: row.created_by_email
    } : null
  }));
}

async function getConfigVersion(moduleKey, versionId) {
  const module = await findModuleByKey(moduleKey);
  if (!module) return null;
  const [rows] = await pool.execute(
    `SELECT *
     FROM crm_module_config_versions
     WHERE module_id = ? AND id = ?
     LIMIT 1`,
    [module.id, versionId]
  );
  if (!rows[0]) return null;
  return {
    id: rows[0].id,
    versionNumber: rows[0].version_number,
    action: rows[0].action,
    summary: rows[0].summary || '',
    snapshot: parseSnapshot(rows[0].snapshot_json),
    createdAt: rows[0].created_at
  };
}

async function listConfigAuditLogs(moduleKey, limit = 50) {
  const module = await findModuleByKey(moduleKey);
  if (!module) return [];
  const rowLimit = safeLimit(limit, 50);
  const [rows] = await pool.execute(
    `SELECT logs.id,
            logs.version_id,
            logs.action,
            logs.target_type,
            logs.target_key,
            logs.summary,
            logs.created_at,
            versions.version_number,
            users.name AS changed_by_name,
            users.email AS changed_by_email
     FROM crm_module_config_audit_logs logs
     LEFT JOIN crm_module_config_versions versions ON versions.id = logs.version_id
     LEFT JOIN users ON users.id = logs.changed_by
     WHERE logs.module_id = ?
     ORDER BY logs.created_at DESC, logs.id DESC
     LIMIT ${rowLimit}`,
    [module.id]
  );
  return rows.map((row) => ({
    id: row.id,
    versionId: row.version_id || null,
    action: row.action,
    targetType: row.target_type,
    targetKey: row.target_key || '',
    summary: row.summary || '',
    versionNumber: row.version_number || null,
    createdAt: row.created_at,
    changedBy: row.changed_by_name ? {
      name: row.changed_by_name,
      email: row.changed_by_email
    } : null
  }));
}

module.exports = {
  upsertModule,
  createModule,
  updateModule,
  deleteModule,
  moduleRecordCount,
  upsertField,
  findModuleByKey,
  listModules,
  listStandaloneForms,
  findStandaloneForm,
  createStandaloneForm,
  deleteStandaloneForm,
  deleteStandaloneFormIfExists,
  updateStandaloneFormFields,
  listFields,
  listAllFields,
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
  listBrowserButtonsBySourceModule,
  clearBrowserButtonReferences,
  deleteBrowserButtonsBySourceModule,
  browserButtonUsageCount,
  createConfigVersion,
  latestConfigVersion,
  attachPendingAuditLogsToVersion,
  createConfigAuditLog,
  listConfigVersions,
  getConfigVersion,
  listConfigAuditLogs,
  restoreConfigSnapshot
};
