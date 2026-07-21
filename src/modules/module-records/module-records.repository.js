const { pool } = require('../../database/pool');

function assertSafeIdentifier(identifier) {
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(String(identifier || ''))) {
    throw new Error(`Unsafe database identifier: ${identifier}`);
  }
}

function sqlIdentifier(identifier) {
  assertSafeIdentifier(identifier);
  return `\`${identifier}\``;
}

function jsonPath(fieldKey) {
  return `$.${JSON.stringify(String(fieldKey || ''))}`;
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

function normalizeRecord(row) {
  return {
    id: row.id,
    customFields: parseJsonObject(row.custom_fields),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function fieldValueExpression() {
  return "COALESCE(JSON_UNQUOTE(JSON_EXTRACT(custom_fields, ?)), '')";
}

function addFieldFilter(where, values, fields, filters = {}) {
  const fieldKey = String(filters.filterField || '');
  const operator = String(filters.filterOperator || 'contains');
  const value = filters.filterValue;
  if (!fieldKey || !operator) return;

  const field = fields.find((item) => (
    item.fieldKey === fieldKey
    && item.tableType !== 'detail'
    && item.permissions?.view !== false
  ));
  if (!field) return;

  values.push(jsonPath(field.fieldKey));
  const expression = fieldValueExpression();
  if (operator === 'empty') {
    where.push(`${expression} = ''`);
    return;
  }
  if (operator === 'not_empty') {
    where.push(`${expression} <> ''`);
    return;
  }

  const textValue = String(value ?? '');
  if (textValue.trim() === '') return;

  if (operator === 'equals') {
    values.push(textValue);
    where.push(`LOWER(${expression}) = LOWER(?)`);
    return;
  }
  if (operator === 'not_equals') {
    values.push(textValue);
    where.push(`LOWER(${expression}) <> LOWER(?)`);
    return;
  }
  if (operator === 'starts_with') {
    values.push(`${textValue}%`);
    where.push(`${expression} LIKE ?`);
    return;
  }
  values.push(`%${textValue}%`);
  where.push(`${expression} LIKE ?`);
}

async function listRecords(moduleKey, fields, filters = {}) {
  assertSafeIdentifier(moduleKey);
  const values = [];
  const where = [];
  const searchableFields = fields.filter((field) => (
    field.tableType !== 'detail'
    && (field.showInTable || field.searchable)
    && field.type !== 'checkbox'
    && field.permissions?.view !== false
  ));

  if (filters.search && searchableFields.length) {
    const searchConditions = searchableFields.map((field) => {
      values.push(jsonPath(field.fieldKey), `%${filters.search}%`);
      return `${fieldValueExpression()} LIKE ?`;
    });
    where.push(`(${searchConditions.join(' OR ')})`);
  }

  addFieldFilter(where, values, fields, filters);

  const [rows] = await pool.execute(
    `SELECT id, custom_fields, created_by, updated_by, created_at, updated_at
     FROM ${sqlIdentifier(moduleKey)}
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY updated_at DESC
     LIMIT 200`,
    values
  );
  return rows.map(normalizeRecord);
}

async function findRecordById(moduleKey, id) {
  assertSafeIdentifier(moduleKey);
  const [rows] = await pool.execute(
    `SELECT id, custom_fields, created_by, updated_by, created_at, updated_at
     FROM ${sqlIdentifier(moduleKey)}
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] ? normalizeRecord(rows[0]) : null;
}

async function createRecord(moduleKey, customFields, userId) {
  assertSafeIdentifier(moduleKey);
  const [result] = await pool.execute(
    `INSERT INTO ${sqlIdentifier(moduleKey)} (custom_fields, created_by, updated_by)
     VALUES (?, ?, ?)`,
    [JSON.stringify(customFields || {}), userId || null, userId || null]
  );
  return result.insertId;
}

async function updateRecord(moduleKey, id, customFields, userId) {
  assertSafeIdentifier(moduleKey);
  const [result] = await pool.execute(
    `UPDATE ${sqlIdentifier(moduleKey)}
     SET custom_fields = ?, updated_by = ?
     WHERE id = ?`,
    [JSON.stringify(customFields || {}), userId || null, id]
  );
  return result.affectedRows;
}

async function deleteRecords(moduleKey, ids) {
  assertSafeIdentifier(moduleKey);
  if (!ids.length) return 0;
  const placeholders = ids.map(() => '?').join(', ');
  const [result] = await pool.execute(
    `DELETE FROM ${sqlIdentifier(moduleKey)} WHERE id IN (${placeholders})`,
    ids
  );
  return result.affectedRows;
}

async function countFieldValue(moduleKey, field, value, excludeId = null) {
  assertSafeIdentifier(moduleKey);
  const values = [jsonPath(field.fieldKey), String(value)];
  let condition = "LOWER(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(custom_fields, ?)), '')) = LOWER(?)";
  if (excludeId) {
    condition += ' AND id <> ?';
    values.push(excludeId);
  }
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count FROM ${sqlIdentifier(moduleKey)} WHERE ${condition}`,
    values
  );
  return Number(rows[0]?.count || 0);
}

async function detailRowsByRecordId(recordId, fields) {
  const detailFields = fields.filter((field) => field.tableType === 'detail' && field.detailTableName);
  const tables = Array.from(new Set(detailFields.map((field) => field.detailTableName)));
  const detailTables = {};

  for (const tableName of tables) {
    assertSafeIdentifier(tableName);
    const tableFields = detailFields.filter((field) => field.detailTableName === tableName);
    const columns = ['id', 'mainid', ...tableFields.map((field) => field.fieldKey)].map(sqlIdentifier).join(', ');
    const [rows] = await pool.execute(
      `SELECT ${columns} FROM ${sqlIdentifier(tableName)} WHERE mainid = ? ORDER BY id ASC`,
      [recordId]
    );
    detailTables[tableName] = rows;
  }

  return detailTables;
}

function normalizeDetailValue(field, value) {
  if (field.type === 'checkbox') return value ? 1 : 0;
  return value === '' || value === undefined ? null : value;
}

function rowHasValue(row, fields) {
  return fields.some((field) => {
    const value = row[field.fieldKey];
    if (field.type === 'checkbox') return Boolean(value);
    return value !== undefined && value !== null && String(value).trim() !== '';
  });
}

async function replaceDetailRows(recordId, fields, detailTables = {}) {
  const detailFields = fields.filter((field) => field.tableType === 'detail' && field.detailTableName);
  const tableNames = Array.from(new Set(detailFields.map((field) => field.detailTableName)));
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    for (const tableName of tableNames) {
      assertSafeIdentifier(tableName);
      const tableFields = detailFields.filter((field) => field.detailTableName === tableName);
      const rows = (Array.isArray(detailTables[tableName]) ? detailTables[tableName] : [])
        .filter((row) => rowHasValue(row, tableFields));

      await connection.execute(`DELETE FROM ${sqlIdentifier(tableName)} WHERE mainid = ?`, [recordId]);

      for (const row of rows) {
        const columns = ['mainid', ...tableFields.map((field) => field.fieldKey)];
        const values = [recordId, ...tableFields.map((field) => normalizeDetailValue(field, row[field.fieldKey]))];
        await connection.execute(
          `INSERT INTO ${sqlIdentifier(tableName)} (${columns.map(sqlIdentifier).join(', ')})
           VALUES (${columns.map(() => '?').join(', ')})`,
          values
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
}

module.exports = {
  listRecords,
  findRecordById,
  createRecord,
  updateRecord,
  deleteRecords,
  countFieldValue,
  detailRowsByRecordId,
  replaceDetailRows
};
