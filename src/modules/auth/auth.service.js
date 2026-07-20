const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { config } = require('../../shared/config');
const { AppError } = require('../../shared/errors');
const { findUserByEmail } = require('./auth.repository');

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
  };
}

async function login(email, password, options = {}) {
  const user = await findUserByEmail(email);
  if (!user || user.status !== 'active') {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.password_hash) {
    throw new AppError('Invalid email or password', 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    throw new AppError('Invalid email or password', 401);
  }

  const tokenUser = publicUser(user);
  const token = jwt.sign(tokenUser, config.jwtSecret, {
    algorithm: 'HS256',
    audience: config.jwtAudience,
    expiresIn: options.rememberMe ? config.jwtRememberExpiresIn : config.jwtExpiresIn,
    issuer: config.jwtIssuer,
    subject: String(user.id)
  });

  return { token, user: tokenUser };
}

module.exports = { login };
