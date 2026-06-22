const { AppError } = require('./errors');

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function sameValue(left, right) {
  return String(left ?? '').trim().toLowerCase() === String(right ?? '').trim().toLowerCase();
}

function isConditionMet(rules, values) {
  if (!rules?.conditionalRequiredField) return false;
  const value = values[rules.conditionalRequiredField];
  if (rules.conditionalRequiredValue === undefined || rules.conditionalRequiredValue === '') {
    return !isBlank(value);
  }
  return sameValue(value, rules.conditionalRequiredValue);
}

function numberValue(value) {
  if (isBlank(value)) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

async function validateFieldValue(field, value, values, options = {}) {
  const rules = field.validationRules || {};
  const required = field.required || isConditionMet(rules, values);
  if (required && isBlank(value)) {
    throw new AppError(`${field.label} is required`, 422);
  }
  if (isBlank(value)) return;

  const text = String(value);
  if (rules.minLength !== undefined && text.length < Number(rules.minLength)) {
    throw new AppError(`${field.label} must be at least ${rules.minLength} characters`, 422);
  }
  if (rules.maxLength !== undefined && text.length > Number(rules.maxLength)) {
    throw new AppError(`${field.label} must be ${rules.maxLength} characters or fewer`, 422);
  }

  if (rules.minValue !== undefined || rules.maxValue !== undefined) {
    const number = numberValue(value);
    if (number === null) {
      throw new AppError(`${field.label} must be a number`, 422);
    }
    if (rules.minValue !== undefined && number < Number(rules.minValue)) {
      throw new AppError(`${field.label} must be at least ${rules.minValue}`, 422);
    }
    if (rules.maxValue !== undefined && number > Number(rules.maxValue)) {
      throw new AppError(`${field.label} must be at most ${rules.maxValue}`, 422);
    }
  }

  if (rules.regex && !RegExp(rules.regex).test(text)) {
    throw new AppError(`${field.label} format is invalid`, 422);
  }

  if (rules.unique && options.uniqueChecker) {
    const duplicateCount = await options.uniqueChecker(field, value);
    if (duplicateCount > 0) {
      throw new AppError(`${field.label} must be unique`, 422);
    }
  }
}

module.exports = { isBlank, validateFieldValue };
