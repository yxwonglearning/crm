const bcrypt = require('bcryptjs');
const { pool } = require('./pool');
const { config } = require('../shared/config');
const { ensureAllDefaultConfigs } = require('../modules/sysadmin/module-config.service');

const countries = [
  ['Malaysia', 'MY', '+60'],
  ['Singapore', 'SG', '+65'],
  ['Indonesia', 'ID', '+62'],
  ['Thailand', 'TH', '+66'],
  ['Vietnam', 'VN', '+84'],
  ['Philippines', 'PH', '+63'],
  ['China', 'CN', '+86'],
  ['Hong Kong', 'HK', '+852'],
  ['Taiwan', 'TW', '+886'],
  ['Japan', 'JP', '+81'],
  ['South Korea', 'KR', '+82'],
  ['India', 'IN', '+91'],
  ['United States', 'US', '+1'],
  ['United Kingdom', 'GB', '+44'],
  ['Australia', 'AU', '+61']
];

async function seedCountries(connection) {
  for (const [name, iso2, dialCode] of countries) {
    await connection.execute(
      `INSERT INTO countries (name, iso2, dial_code)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), dial_code = VALUES(dial_code)`,
      [name, iso2, dialCode]
    );
  }
}

async function seedAdmin(connection) {
  const passwordHash = await bcrypt.hash(config.admin.password, 12);
  await connection.execute(
    `INSERT INTO users (name, email, password_hash, role, status)
     VALUES (?, ?, ?, 'admin', 'active')
     ON DUPLICATE KEY UPDATE name = VALUES(name), role = 'admin', status = 'active'`,
    [config.admin.name, config.admin.email.toLowerCase(), passwordHash]
  );
}

async function main() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await seedCountries(connection);
    await seedAdmin(connection);
    await connection.commit();
    await ensureAllDefaultConfigs();
    console.log('Database seed complete.');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
