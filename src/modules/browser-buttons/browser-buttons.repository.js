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

async function findBrowserButton(browserKey) {
  const [rows] = await pool.execute(
    `SELECT
       browser_key,
       name,
       source_module,
       source_table,
       value_field,
       display_field,
       search_fields_json,
       return_fields_json,
       filter_json,
       is_enabled
     FROM crm_browser_buttons
     WHERE browser_key = ?
     LIMIT 1`,
    [browserKey]
  );
  return rows[0] || null;
}

async function listEnabledBrowserButtons() {
  const [rows] = await pool.execute(
    `SELECT
       browser_key,
       name,
       source_module,
       source_table,
       value_field,
       display_field,
       search_fields_json,
       return_fields_json,
       filter_json,
       is_enabled
     FROM crm_browser_buttons
     WHERE is_enabled = 1
     ORDER BY name ASC`
  );
  return rows;
}

async function searchBrowserRows(browser, columns, searchFields, query) {
  const selectedColumns = columns.map(sqlIdentifier).join(', ');
  const where = [];
  const values = [];

  if (browser.filter?.where) {
    where.push(`(${browser.filter.where})`);
  }

  if (query && searchFields.length) {
    where.push(`(${searchFields.map((field) => `${sqlIdentifier(field)} LIKE ?`).join(' OR ')})`);
    searchFields.forEach(() => values.push(`%${query}%`));
  }

  const sql = `
    SELECT ${selectedColumns}
    FROM ${sqlIdentifier(browser.sourceTable)}
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY ${sqlIdentifier(browser.displayField)} ASC
    LIMIT 30
  `;

  const [rows] = await pool.execute(sql, values);
  return rows;
}

module.exports = { findBrowserButton, listEnabledBrowserButtons, searchBrowserRows };
