const assert = require('assert/strict');
const conditions = require('../../src/modules/workflows/workflows.conditions');

const snapshot = {
  amount: 1500,
  country: 'Malaysia',
  tags: ['urgent', 'payroll'],
  requester: { department: 'Finance' },
  empty_note: ''
};

const nested = {
  group: 'all',
  rules: [
    { fieldKey: 'amount', operator: 'greater_than_or_equal', value: 1000 },
    {
      group: 'any',
      rules: [
        { fieldKey: 'country', operator: 'equals', value: 'Singapore' },
        { fieldKey: 'tags', operator: 'contains', value: 'urgent' }
      ]
    }
  ]
};

assert.equal(conditions.evaluateCondition(nested, snapshot).matched, true);
assert.equal(conditions.evaluateCondition({ fieldKey: 'requester.department', operator: 'equals', value: 'finance' }, snapshot).matched, true);
assert.equal(conditions.evaluateCondition({ fieldKey: 'country', operator: 'in', value: ['Malaysia', 'Singapore'] }, snapshot).matched, true);
assert.equal(conditions.evaluateCondition({ fieldKey: 'empty_note', operator: 'is_empty' }, snapshot).matched, true);
assert.equal(conditions.evaluateCondition({ fieldKey: 'amount', operator: 'less_than', value: 100 }, snapshot).matched, false);

const routing = conditions.routeStages({
  entryCondition: { fieldKey: 'amount', operator: 'greater_than', value: 0 },
  stages: [
    { stageKey: 'manager', enabled: true, condition: null },
    { stageKey: 'hr', enabled: true, condition: { fieldKey: 'amount', operator: 'greater_than', value: 5000 }, skipWhenConditionFalse: true },
    { stageKey: 'finance', enabled: true, condition: { fieldKey: 'requester.department', operator: 'equals', value: 'Finance' } }
  ]
}, snapshot);
assert.equal(routing.matched, true);
assert.deepEqual(routing.stages.map((stage) => stage.outcome), ['applicable', 'skipped', 'applicable']);
assert.equal(routing.stages[1].reasonCode, 'WORKFLOW_STAGE_CONDITION_FALSE');

const blocked = conditions.routeStages({
  stages: [{ stageKey: 'hr', condition: { fieldKey: 'amount', operator: 'greater_than', value: 5000 }, skipWhenConditionFalse: false }]
}, snapshot);
assert.equal(blocked.blockedAt, 'hr');
assert.equal(blocked.stages[0].outcome, 'blocked');

const notMatched = conditions.routeStages({
  entryCondition: { fieldKey: 'amount', operator: 'less_than', value: 0 },
  stages: [{ stageKey: 'manager' }]
}, snapshot);
assert.equal(notMatched.matched, false);
assert.equal(notMatched.stages.length, 0);

assert.throws(
  () => conditions.evaluateCondition({ fieldKey: 'amount', operator: 'execute_sql', value: 'x' }, snapshot),
  (error) => error.statusCode === 422 && error.details.code === 'WORKFLOW_CONDITION_INVALID'
);

console.log('Workflow condition engine smoke passed.');
