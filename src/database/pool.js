const mysql = require('mysql2/promise');
const { config } = require('../shared/config');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true
});

module.exports = { pool };
