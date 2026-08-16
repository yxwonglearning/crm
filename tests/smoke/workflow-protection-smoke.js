const assert = require('assert/strict');
const protection = require('../../src/modules/workflows/workflows.protection');

function dependencies(lock) {
  return { repository: { findRecordLock: async () => lock } };
}

async function main() {
  assert.equal((await protection.assertUpdateAllowed(
    'leave',
    1,
    { amount: 100 },
    { amount: 200 },
    {},
    dependencies(null)
  )).allowed, true);

  const fieldLock = {
    requestKey: 'LEAVE-000001',
    lockScope: 'fields',
    lockedFields: ['amount', 'line_amount']
  };
  assert.equal((await protection.assertUpdateAllowed(
    'leave',
    1,
    { amount: 100, note: 'old' },
    { amount: 100, note: 'new' },
    {},
    dependencies(fieldLock)
  )).allowed, true);
  await assert.rejects(
    protection.assertUpdateAllowed(
      'leave',
      1,
      { amount: 100 },
      { amount: 200 },
      {},
      dependencies(fieldLock)
    ),
    (error) => error.statusCode === 409
      && error.details.code === 'WORKFLOW_CONFLICT_RECORD_EDIT_LOCKED'
      && error.details.requestKey === 'LEAVE-000001'
      && error.details.lockedFields[0] === 'amount'
  );
  await assert.rejects(
    protection.assertUpdateAllowed(
      'leave',
      1,
      { amount: 100 },
      { amount: 100 },
      { lines: [{ line_amount: 20 }] },
      dependencies(fieldLock)
    ),
    (error) => error.details.lockedFields.includes('line_amount')
  );

  const recordLock = { requestKey: 'LEAVE-000002', lockScope: 'record', lockedFields: [] };
  await assert.rejects(
    protection.assertUpdateAllowed('leave', 2, {}, {}, {}, dependencies(recordLock)),
    (error) => error.details.code === 'WORKFLOW_CONFLICT_RECORD_EDIT_LOCKED'
  );
  await assert.rejects(
    protection.assertDeleteAllowed('leave', 2, dependencies(recordLock)),
    (error) => error.details.code === 'WORKFLOW_CONFLICT_RECORD_DELETE_LOCKED'
      && error.message.includes('LEAVE-000002')
  );

  console.log('Workflow record protection smoke passed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
