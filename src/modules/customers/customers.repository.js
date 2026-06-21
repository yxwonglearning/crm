const { pool } = require('../../database/pool');

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

async function listCustomers(filters) {
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

async function deleteCustomers(ids) {
  const placeholders = ids.map(() => '?').join(', ');
  const [result] = await pool.execute(
    `DELETE FROM customers WHERE id IN (${placeholders})`,
    ids
  );
  return result.affectedRows;
}

module.exports = { listCustomers, findCustomerById, createCustomer, updateCustomer, deleteCustomers };
