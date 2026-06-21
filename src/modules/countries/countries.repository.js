const { pool } = require('../../database/pool');

async function listCountries() {
  const [rows] = await pool.execute(
    `SELECT id, name, iso2, dial_code
     FROM countries
     ORDER BY name ASC`
  );
  return rows;
}

async function findCountryById(id) {
  const [rows] = await pool.execute(
    `SELECT id, name, iso2, dial_code
     FROM countries
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

module.exports = { listCountries, findCountryById };
