const jwt = require('jsonwebtoken');
const { config } = require('../../shared/config');
const { AppError } = require('../../shared/errors');

function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    next(new AppError('Authentication required', 401));
    return;
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch (_error) {
    next(new AppError('Invalid or expired token', 401));
  }
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
