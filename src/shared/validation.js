const { AppError } = require('./errors');

function validate(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError('Validation failed', 422, result.error.flatten());
  }
  return result.data;
}

module.exports = { validate };
