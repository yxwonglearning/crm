require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const config = {
  appName: process.env.APP_NAME || 'Self Hosted CRM',
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  jwtSecret: required('JWT_SECRET', 'dev-only-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: required('DB_USER', 'crm_app'),
    password: required('DB_PASSWORD', 'crm_app_password'),
    database: required('DB_NAME', 'crm')
  },
  admin: {
    name: process.env.ADMIN_NAME || 'System Admin',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'ChangeMe123!'
  }
};

module.exports = { config };
