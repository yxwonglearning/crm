const { pool } = require('../../database/pool');

function toDbField(moduleId, field) {
  return [
    moduleId,
    field.fieldKey,
    field.dataKey || null,
    field.label,
    field.type,
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
      options_json,
      is_required,
      show_in_table,
      show_in_form,
      show_in_import,
      is_searchable,
      sort_order,
      is_locked
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      options_json,
      is_required,
      show_in_table,
      show_in_form,
      show_in_import,
      is_searchable,
      sort_order,
      is_locked
    ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      moduleId,
      field.fieldKey,
      field.label,
      field.type,
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

async function updateField(moduleKey, fieldKey, updates) {
  const module = await findModuleByKey(moduleKey);
  if (!module) return 0;

  const assignments = [];
  const values = [];
  const map = {
    label: 'label',
    type: 'field_type',
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
  updateField,
  deleteField
};
