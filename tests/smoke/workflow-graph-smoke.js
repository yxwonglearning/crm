const assert = require('assert/strict');
const graph = require('../../src/modules/workflows/workflows.graph');

const stages = [
  { stageKey: 'manager', name: 'Manager', enabled: true, condition: null, skipWhenConditionFalse: false },
  { stageKey: 'finance', name: 'Finance', enabled: true, condition: null, skipWhenConditionFalse: false }
];
const condition = { group: 'all', rules: [{ fieldKey: 'amount', operator: 'greater_than', value: 1000 }] };
const builderGraph = {
  nodes: [
    { id: 'start', type: 'start' },
    { id: 'manager', type: 'approval', stageKey: 'manager' },
    { id: 'finance', type: 'approval', stageKey: 'finance' },
    { id: 'end', type: 'end' }
  ],
  edges: [
    { id: 'start-high', from: 'start', to: 'finance', outcome: 'condition_met', condition },
    { id: 'start-low', from: 'start', to: 'manager', outcome: 'condition_not_met', condition },
    { id: 'manager-end', from: 'manager', to: 'end', outcome: 'approved' },
    { id: 'finance-end', from: 'finance', to: 'end', outcome: 'approved' }
  ]
};

const high = graph.routeExecution({ builderGraph, stages }, { amount: 1500 });
assert.deepEqual(high.stages.map((item) => item.stage.stageKey), ['finance']);
assert.deepEqual(high.selectedEdges.map((edge) => edge.id), ['start-high', 'finance-end']);

const low = graph.routeExecution({ builderGraph, stages }, { amount: 500 });
assert.deepEqual(low.stages.map((item) => item.stage.stageKey), ['manager']);
assert.deepEqual(low.selectedEdges.map((edge) => edge.id), ['start-low', 'manager-end']);

const next = graph.nextRouteTarget({ builderGraph }, 'manager', { amount: 500 }, [
  { stageKey: 'manager', status: 'approved' }
]);
assert.equal(next.type, 'end');
assert.equal(next.selectedEdges[0].id, 'manager-end');

assert.throws(
  () => graph.selectOutgoingEdge({ edges: [
    { id: 'a', from: 'start', to: 'manager', outcome: 'submit' },
    { id: 'b', from: 'start', to: 'finance', outcome: 'continue' }
  ] }, 'start', {}),
  (error) => error.details.code === 'WORKFLOW_ROUTE_AMBIGUOUS'
);

assert.throws(
  () => graph.selectOutgoingEdge({ edges: [{ id: 'a', from: 'start', to: 'manager', outcome: 'condition_met', condition }] }, 'start', { amount: 10 }),
  (error) => error.details.code === 'WORKFLOW_ROUTE_NO_MATCH'
);

console.log('Workflow executable graph smoke passed.');
