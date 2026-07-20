require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function jwtSecret() {
  const value = required('JWT_SECRET', 'dev-only-change-me');
  if (process.env.NODE_ENV === 'production' && (value === 'dev-only-change-me' || value.length < 32)) {
    throw new Error('JWT_SECRET must be a strong production secret with at least 32 characters');
  }
  return value;
}

const config = {
  appName: process.env.APP_NAME || 'Self Hosted CRM',
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  appBaseUrl: process.env.APP_BASE_URL || `http://localhost:${Number(process.env.PORT || 3000)}`,
  jwtSecret: jwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  jwtRememberExpiresIn: process.env.JWT_REMEMBER_EXPIRES_IN || '30d',
  jwtIssuer: process.env.JWT_ISSUER || 'self-hosted-crm',
  jwtAudience: process.env.JWT_AUDIENCE || 'self-hosted-crm-users',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: required('DB_USER', 'crm_app'),
    password: required('DB_PASSWORD', 'crm_app_password'),
    database: required('DB_NAME', 'crm')
  },
  admin: {
    name: process.env.ADMIN_NAME || 'System Admin',
    email: required('ADMIN_EMAIL'),
    password: required('ADMIN_PASSWORD')
  }
};

module.exports = { config };
