class AppError extends Error {
  constructor(message, statusCode = 500, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function notFoundHandler(_req, _res, next) {
  next(new AppError('Route not found', 404));
}

function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  const payload = {
    error: error.message || 'Unexpected server error'
  };

  if (error.details) {
    payload.details = error.details;
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json(payload);
}

module.exports = { AppError, asyncHandler, notFoundHandler, errorHandler };
