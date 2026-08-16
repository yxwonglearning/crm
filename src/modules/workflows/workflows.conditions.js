const { AppError } = require('../../shared/errors');

const groups = new Set(['all', 'any']);
const operators = new Set([
  'equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with',
  'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal',
  'is_empty', 'is_not_empty', 'in', 'not_in'
]);

function conditionError(message, details = {}) {
  return new AppError(message, 422, { code: 'WORKFLOW_CONDITION_INVALID', ...details });
}

function valueAtPath(source, fieldKey) {
  if (source && Object.prototype.hasOwnProperty.call(source, fieldKey)) return source[fieldKey];
  return String(fieldKey || '').split('.').reduce(
    (value, part) => value !== null && value !== undefined ? value[part] : undefined,
    source
  );
}

function isEmpty(value) {
  return value === null || value === undefined || value === ''
    || (Array.isArray(value) && value.length === 0);
}

function scalar(value) {
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value.getTime();
  const text = String(value ?? '').trim();
  if (text !== '' && Number.isFinite(Number(text))) return Number(text);
  if (/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(text)) {
    const timestamp = Date.parse(text);
    if (Number.isFinite(timestamp)) return timestamp;
  }
  return text.toLowerCase();
}

function list(value) {
  return (Array.isArray(value) ? value : [value]).map(scalar);
}

function compare(actual, operator, expected) {
  if (operator === 'is_empty') return isEmpty(actual);
  if (operator === 'is_not_empty') return !isEmpty(actual);
  const left = scalar(actual);
  const right = scalar(expected);
  if (operator === 'equals') return left === right;
  if (operator === 'not_equals') return left !== right;
  if (operator === 'greater_than') return left > right;
  if (operator === 'greater_than_or_equal') return left >= right;
  if (operator === 'less_than') return left < right;
  if (operator === 'less_than_or_equal') return left <= right;
  if (operator === 'starts_with') return String(actual ?? '').toLowerCase().startsWith(String(expected ?? '').toLowerCase());
  if (operator === 'ends_with') return String(actual ?? '').toLowerCase().endsWith(String(expected ?? '').toLowerCase());
  if (operator === 'contains' || operator === 'not_contains') {
    const matched = Array.isArray(actual)
      ? list(actual).includes(right)
      : String(actual ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase());
    return operator === 'contains' ? matched : !matched;
  }
  if (operator === 'in' || operator === 'not_in') {
    const matched = list(expected).includes(left);
    return operator === 'in' ? matched : !matched;
  }
  return false;
}

function evaluateCondition(condition, snapshot = {}, path = 'condition') {
  if (!condition) return { matched: true, trace: [] };
  if (typeof condition !== 'object' || Array.isArray(condition)) {
    throw conditionError('Workflow condition must be a structured object.', { path });
  }
  if (condition.group !== undefined || condition.rules !== undefined) {
    if (!groups.has(condition.group) || !Array.isArray(condition.rules) || !condition.rules.length) {
      throw conditionError('Workflow condition group is invalid.', { path });
    }
    const results = condition.rules.map((rule, index) => evaluateCondition(rule, snapshot, `${path}.rules[${index}]`));
    const matched = condition.group === 'all'
      ? results.every((result) => result.matched)
      : results.some((result) => result.matched);
    return { matched, trace: results.flatMap((result) => result.trace) };
  }
  const fieldKey = String(condition.fieldKey || '').trim();
  const operator = String(condition.operator || '').trim();
  if (!fieldKey || !operators.has(operator)) {
    throw conditionError('Workflow condition rule is invalid.', { path, fieldKey, operator });
  }
  const matched = compare(valueAtPath(snapshot, fieldKey), operator, condition.value);
  return { matched, trace: [{ path, fieldKey, operator, matched }] };
}

function routeStages(config, snapshot = {}) {
  const entry = evaluateCondition(config?.entryCondition, snapshot, 'entryCondition');
  if (!entry.matched) return { matched: false, entry, stages: [], blockedAt: null };
  const stages = [];
  let blockedAt = null;
  for (const [index, stage] of (config?.stages || []).entries()) {
    if (stage.enabled === false) {
      stages.push({ stage, outcome: 'disabled', reasonCode: 'WORKFLOW_STAGE_DISABLED', trace: [] });
      continue;
    }
    const result = evaluateCondition(stage.condition, snapshot, `stages[${index}].condition`);
    if (result.matched) {
      stages.push({ stage, outcome: 'applicable', reasonCode: '', trace: result.trace });
    } else if (stage.skipWhenConditionFalse) {
      stages.push({ stage, outcome: 'skipped', reasonCode: 'WORKFLOW_STAGE_CONDITION_FALSE', trace: result.trace });
    } else {
      stages.push({ stage, outcome: 'blocked', reasonCode: 'WORKFLOW_STAGE_CONDITION_NOT_MET', trace: result.trace });
      blockedAt = stage.stageKey;
      break;
    }
  }
  return { matched: true, entry, stages, blockedAt };
}

module.exports = { compare, evaluateCondition, routeStages, valueAtPath };
