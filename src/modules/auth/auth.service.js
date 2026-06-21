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

async function login(email, password) {
  const user = await findUserByEmail(email);
  if (!user || user.status !== 'active') {
    throw new AppError('Invalid email or password', 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = jwt.sign(publicUser(user), config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });

  return { token, user: publicUser(user) };
}

module.exports = { login };
