const { AppError } = require('../../shared/errors');
const repository = require('./workflows.repository');

function sameValue(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function detailContainsField(detailTables, fieldKey) {
  return Object.values(detailTables || {}).some((rows) => (rows || []).some(
    (row) => Object.prototype.hasOwnProperty.call(row || {}, fieldKey)
  ));
}

function protectionError(lock, operation, fields = []) {
  return new AppError(
    `Record is protected by pending approval request ${lock.requestKey}.`,
    409,
    {
      code: operation === 'delete' ? 'WORKFLOW_CONFLICT_RECORD_DELETE_LOCKED' : 'WORKFLOW_CONFLICT_RECORD_EDIT_LOCKED',
      requestKey: lock.requestKey,
      lockScope: lock.lockScope,
      lockedFields: fields
    }
  );
}

async function assertUpdateAllowed(moduleKey, recordId, existingFields, nextFields, detailTables, dependencies = {}) {
  const repo = dependencies.repository || repository;
  const lock = await repo.findRecordLock(moduleKey, recordId);
  if (!lock) return { allowed: true, lock: null };
  if (lock.lockScope === 'record') throw protectionError(lock, 'edit');
  const changedLockedFields = (lock.lockedFields || []).filter((fieldKey) => (
    !sameValue(existingFields?.[fieldKey], nextFields?.[fieldKey])
    || detailContainsField(detailTables, fieldKey)
  ));
  if (changedLockedFields.length) throw protectionError(lock, 'edit', changedLockedFields);
  return { allowed: true, lock };
}

async function assertDeleteAllowed(moduleKey, recordId, dependencies = {}) {
  const repo = dependencies.repository || repository;
  const lock = await repo.findRecordLock(moduleKey, recordId);
  if (lock) throw protectionError(lock, 'delete');
  return { allowed: true };
}

module.exports = { assertDeleteAllowed, assertUpdateAllowed, detailContainsField, sameValue };
