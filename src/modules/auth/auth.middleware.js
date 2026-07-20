const jwt = require('jsonwebtoken');
const { config } = require('../../shared/config');
const { AppError } = require('../../shared/errors');
const { findUserById } = require('./auth.repository');

function tokenFromRequest(req) {
  const header = req.headers.authorization || '';
  const bearerToken = header.startsWith('Bearer ') ? header.slice(7) : null;
  const cookieToken = String(req.headers.cookie || '')
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith('__session='))
    ?.slice('__session='.length);
  return bearerToken || cookieToken || null;
}

async function authenticateLocalToken(token) {
  const decoded = jwt.verify(token, config.jwtSecret, {
    algorithms: ['HS256'],
    audience: config.jwtAudience,
    issuer: config.jwtIssuer
  });
  const userId = decoded.sub || decoded.id;
  const user = userId ? await findUserById(userId) : null;
  if (!user || user.status !== 'active') {
    throw new AppError('Invalid or expired token', 401);
  }
  return user;
}

function requireAuth(req, _res, next) {
  const token = tokenFromRequest(req);
  if (!token) {
    next(new AppError('Authentication required', 401));
    return;
  }

  Promise.resolve()
    .then(async () => {
      const user = await authenticateLocalToken(token);
      req.user = user;
      next();
    })
    .catch((error) => {
      next(error instanceof AppError ? error : new AppError('Invalid or expired token', 401));
    });
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new AppError('You do not have permission to perform this action', 403));
      return;
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
