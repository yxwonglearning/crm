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

const systemFieldColumns = {
  companyName: 'company_name',
  contactPerson: 'contact_person',
  email: 'email',
  countryId: 'country_id',
  phoneNumber: 'phone_number',
  status: 'status',
  notes: 'notes',
  ownerUserId: 'owner_user_id'
};

const filterFieldExpressions = {
  companyName: 'c.company_name',
  contactPerson: 'c.contact_person',
  email: 'c.email',
  countryId: 'countries.name',
  phoneNumber: 'CONCAT(c.phone_country_code, c.phone_number)',
  status: 'c.status',
  notes: 'c.notes',
  ownerUserId: 'owner.name'
};

function baseSelect() {
  return `SELECT
      c.id,
      c.company_name,
      c.contact_person,
      c.email,
      c.phone_country_code,
      c.phone_number,
      CONCAT(c.phone_country_code, c.phone_number) AS international_phone,
      c.status,
      c.notes,
      c.custom_fields,
      c.country_id,
      countries.name AS country_name,
      countries.iso2 AS country_iso2,
      c.owner_user_id,
      owner.name AS owner_name,
      c.created_at,
      c.updated_at
    FROM customers c
    INNER JOIN countries ON countries.id = c.country_id
    LEFT JOIN users owner ON owner.id = c.owner_user_id`;
}

function jsonPath(fieldKey) {
  return `$.${JSON.stringify(String(fieldKey || ''))}`;
}

function fieldFilterExpression(field) {
  const column = filterFieldExpressions[field.fieldKey];
  if (column) return `COALESCE(CAST(${column} AS CHAR), '')`;
  return "COALESCE(JSON_UNQUOTE(JSON_EXTRACT(c.custom_fields, ?)), '')";
}

function addFieldFilter(where, values, fields = [], filters = {}) {
  const fieldKey = String(filters.filterField || '');
  const operator = String(filters.filterOperator || 'contains');
  if (!fieldKey || !operator) return;

  const field = fields.find((item) => (
    item.fieldKey === fieldKey
    && item.tableType !== 'detail'
    && item.permissions?.view !== false
  ));
  if (!field) return;

  const expression = fieldFilterExpression(field);
  if (!filterFieldExpressions[field.fieldKey]) {
    values.push(jsonPath(field.fieldKey));
  }
  if (operator === 'empty') {
    where.push(`${expression} = ''`);
    return;
  }
  if (operator === 'not_empty') {
    where.push(`${expression} <> ''`);
    return;
  }

  const textValue = String(filters.filterValue ?? '');
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

async function listCustomers(filters, fields = []) {
  const where = [];
  const values = [];

  if (filters.search) {
    where.push('(c.company_name LIKE ? OR c.contact_person LIKE ? OR c.email LIKE ?)');
    const search = `%${filters.search}%`;
    values.push(search, search, search);
  }

  if (filters.status) {
    where.push('c.status = ?');
    values.push(filters.status);
  }

  addFieldFilter(where, values, fields, filters);

  const sql = `${baseSelect()}
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY c.updated_at DESC
    LIMIT 200`;

  const [rows] = await pool.execute(sql, values);
  return rows;
}

async function findCustomerById(id) {
  const [rows] = await pool.execute(`${baseSelect()} WHERE c.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function detailRowsByCustomerId(customerId, fields) {
  const detailFields = fields.filter((field) => field.tableType === 'detail' && field.detailTableName);
  const tables = Array.from(new Set(detailFields.map((field) => field.detailTableName)));
  const values = {};

  for (const tableName of tables) {
    const tableFields = detailFields.filter((field) => field.detailTableName === tableName);
    const columns = ['id', 'mainid', ...tableFields.map((field) => field.fieldKey)].map(sqlIdentifier).join(', ');
    if (!columns) continue;
    const [rows] = await pool.execute(
      `SELECT ${columns} FROM ${sqlIdentifier(tableName)} WHERE mainid = ? ORDER BY id ASC`,
      [customerId]
    );
    values[tableName] = rows;
  }

  return values;
}

async function detailValuesByCustomerId(customerId, fields) {
  const detailRows = await detailRowsByCustomerId(customerId, fields);
  const values = {};
  Object.values(detailRows).forEach((rows) => {
    const firstRow = rows[0];
    if (!firstRow) return;
    Object.keys(firstRow)
      .filter((key) => !['id', 'mainid'].includes(key))
      .forEach((key) => {
        values[key] = firstRow[key];
      });
  });
  return values;
}

async function createCustomer(customer) {
  const [result] = await pool.execute(
    `INSERT INTO customers (
      company_name,
      contact_person,
      email,
      country_id,
      phone_country_code,
      phone_number,
      status,
      notes,
      custom_fields,
      owner_user_id,
      created_by,
      updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      customer.companyName,
      customer.contactPerson,
      customer.email || null,
      customer.countryId,
      customer.phoneCountryCode,
      customer.phoneNumber,
      customer.status,
      customer.notes || null,
      JSON.stringify(customer.customFields || {}),
      customer.ownerUserId || null,
      customer.userId,
      customer.userId
    ]
  );
  return result.insertId;
}

async function updateCustomer(id, customer) {
  await pool.execute(
    `UPDATE customers
     SET company_name = ?,
         contact_person = ?,
         email = ?,
         country_id = ?,
         phone_country_code = ?,
         phone_number = ?,
         status = ?,
         notes = ?,
         custom_fields = ?,
         owner_user_id = ?,
         updated_by = ?
     WHERE id = ?`,
    [
      customer.companyName,
      customer.contactPerson,
      customer.email || null,
      customer.countryId,
      customer.phoneCountryCode,
      customer.phoneNumber,
      customer.status,
      customer.notes || null,
      JSON.stringify(customer.customFields || {}),
      customer.ownerUserId || null,
      customer.userId,
      id
    ]
  );
}

async function countFieldValue(field, value, excludeId = null) {
  if (field.tableType === 'detail') return 0;
  const values = [];
  let condition;
  const column = systemFieldColumns[field.fieldKey];
  if (column) {
    condition = `LOWER(COALESCE(CAST(${column} AS CHAR), '')) = LOWER(?)`;
    values.push(String(value));
  } else {
    condition = `LOWER(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(custom_fields, ?)), '')) = LOWER(?)`;
    values.push(`$.${JSON.stringify(String(field.fieldKey || ''))}`, String(value));
  }
  if (excludeId) {
    condition += ' AND id <> ?';
    values.push(excludeId);
  }
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count FROM customers WHERE ${condition}`,
    values
  );
  return Number(rows[0]?.count || 0);
}

function normalizeDetailValue(field, value) {
  if (field.type === 'checkbox') return value ? 1 : 0;
  return value === '' ? null : value;
}

function rowHasValue(row, fields) {
  return fields.some((field) => {
    const value = row[field.fieldKey];
    if (field.type === 'checkbox') return Boolean(value);
    return value !== undefined && value !== null && String(value).trim() !== '';
  });
}

async function upsertDetailRows(customerId, fields, detailTables) {
  const detailFields = fields.filter((field) => field.tableType === 'detail' && field.detailTableName);
  const tables = Array.from(new Set(detailFields.map((field) => field.detailTableName)));
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    for (const tableName of tables) {
      const tableFields = detailFields.filter((field) => field.detailTableName === tableName);
      const inputRows = Array.isArray(detailTables?.[tableName]) ? detailTables[tableName] : [];
      const rows = inputRows.filter((row) => rowHasValue(row, tableFields));

      await connection.execute(
        `DELETE FROM ${sqlIdentifier(tableName)} WHERE mainid = ?`,
        [customerId]
      );

      for (const row of rows) {
        const columns = ['mainid', ...tableFields.map((field) => field.fieldKey)];
        const values = [customerId, ...tableFields.map((field) => normalizeDetailValue(field, row[field.fieldKey]))];
        const placeholders = columns.map(() => '?').join(', ');
        await connection.execute(
          `INSERT INTO ${sqlIdentifier(tableName)} (${columns.map(sqlIdentifier).join(', ')}) VALUES (${placeholders})`,
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

async function upsertDetailValues(customerId, fields, values) {
  const detailFields = fields.filter((field) => field.tableType === 'detail' && field.detailTableName);
  const detailTables = {};
  detailFields.forEach((field) => {
    if (!Object.prototype.hasOwnProperty.call(values, field.fieldKey)) return;
    if (!detailTables[field.detailTableName]) {
      detailTables[field.detailTableName] = [{}];
    }
    detailTables[field.detailTableName][0][field.fieldKey] = values[field.fieldKey];
  });
  await upsertDetailRows(customerId, fields, detailTables);
}

async function deleteCustomers(ids) {
  const placeholders = ids.map(() => '?').join(', ');
  const [result] = await pool.execute(
    `DELETE FROM customers WHERE id IN (${placeholders})`,
    ids
  );
  return result.affectedRows;
}

module.exports = {
  listCustomers,
  findCustomerById,
  detailRowsByCustomerId,
  detailValuesByCustomerId,
  createCustomer,
  updateCustomer,
  countFieldValue,
  upsertDetailRows,
  upsertDetailValues,
  deleteCustomers
};
