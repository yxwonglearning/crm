const assert = require('assert/strict');
const approvers = require('../../src/modules/workflows/workflows.approvers');

const users = [
  { id: 1, staff_id: 'REQ-1', name: 'Requester', email: 'requester@example.com', role: 'user', status: 'active', organization_node_id: 20, custom_fields: { reporting_manager_user_id: 2 } },
  { id: 2, staff_id: 'MGR-1', name: 'Manager', email: 'manager@example.com', role: 'manager', status: 'active', organization_node_id: 10, custom_fields: {} },
  { id: 3, staff_id: 'HR-1', name: 'HR', email: 'hr@example.com', role: 'admin', status: 'active', organization_node_id: 20, custom_fields: {} },
  { id: 4, staff_id: 'OLD-1', name: 'Inactive', email: 'inactive@example.com', role: 'manager', status: 'inactive', organization_node_id: 20, custom_fields: {} }
];
const nodes = [
  { id: 10, parentId: null, enabled: true },
  { id: 20, parentId: 10, enabled: true }
];
const dependencies = {
  usersRepository: { listUsers: async () => users },
  departmentsRepository: {
    findById: async (id) => nodes.find((node) => node.id === Number(id)) || null,
    listNodes: async () => nodes
  }
};

function stage(rule, selfApprovalPolicy = 'error') {
  return {
    stageKey: 'supervisor',
    name: 'Supervisor Approval',
    selfApprovalPolicy,
    approverRules: [{ ruleKey: 'primary', resolverConfig: {}, ...rule }]
  };
}

async function run() {
  const direct = await approvers.resolveStageApprovers({
    stage: stage({ resolverType: 'user', resolverReference: '2' }),
    requesterUserId: 1
  }, dependencies);
  assert.deepEqual(direct.approvers.map((item) => item.userId), [2]);

  const delegated = await approvers.resolveStageApprovers({
    stage: stage({ resolverType: 'user', resolverReference: '2' }), workflowKey: 'leave_approval', requesterUserId: 1
  }, { ...dependencies, workflowRepository: { findActiveDelegation: async () => ({ id: 91, reason: 'Leave coverage', delegate: users[2] }) } });
  assert.deepEqual(delegated.approvers.map((item) => item.userId), [3]);
  assert.equal(delegated.approvers[0].originalApprover.userId, 2);
  assert.equal(delegated.approvers[0].delegationId, 91);

  const role = await approvers.resolveStageApprovers({
    stage: stage({ resolverType: 'role', resolverReference: 'manager' }),
    requesterUserId: 1
  }, dependencies);
  assert.deepEqual(role.approvers.map((item) => item.userId), [2]);

  const manager = await approvers.resolveStageApprovers({
    stage: stage({ resolverType: 'reporting_manager' }),
    requesterUserId: 1
  }, dependencies);
  assert.deepEqual(manager.approvers.map((item) => item.userId), [2]);

  const organization = await approvers.resolveStageApprovers({
    stage: stage({ resolverType: 'organization_responsibility', resolverReference: '10', resolverConfig: { includeDescendants: true, role: 'admin' } }),
    requesterUserId: 1
  }, dependencies);
  assert.deepEqual(organization.approvers.map((item) => item.userId), [3]);

  const mixed = await approvers.resolveStageApprovers({
    stage: {
      stageKey: 'mixed', name: 'Mixed Approval', selfApprovalPolicy: 'error',
      approverRules: [
        { ruleKey: 'specific_manager', resolverType: 'user', resolverReference: '2', resolverConfig: {} },
        { ruleKey: 'admin_role', resolverType: 'role', resolverReference: 'admin', resolverConfig: {} },
        { ruleKey: 'department', resolverType: 'organization_responsibility', resolverReference: '20', resolverConfig: { includeDescendants: true, role: 'admin' } }
      ]
    },
    requesterUserId: 1
  }, dependencies);
  assert.deepEqual(mixed.approvers.map((item) => item.userId), [2, 3], 'Mixed selections must resolve all users and deduplicate overlaps');

  const recordField = await approvers.resolveStageApprovers({
    stage: stage({ resolverType: 'record_user_field', resolverReference: 'owner_id' }),
    requesterUserId: 1,
    snapshot: { owner_id: 'MGR-1' }
  }, dependencies);
  assert.deepEqual(recordField.approvers.map((item) => item.userId), [2]);

  const authorityFiltered = await approvers.resolveStageApprovers({
    stage: {
      stageKey: 'authority',
      name: 'Authority Approval',
      selfApprovalPolicy: 'error',
      approverRules: [
        { ruleKey: 'not_applicable', resolverType: 'user', resolverReference: '3', resolverConfig: {}, authorityCondition: { fieldKey: 'amount', operator: 'greater_than', value: 5000 } },
        { ruleKey: 'applicable', resolverType: 'user', resolverReference: '2', resolverConfig: {}, authorityCondition: { fieldKey: 'amount', operator: 'less_than_or_equal', value: 5000 } }
      ]
    },
    requesterUserId: 1,
    snapshot: { amount: 1200 }
  }, dependencies);
  assert.deepEqual(authorityFiltered.approvers.map((item) => item.userId), [2]);

  const autoApproved = await approvers.resolveStageApprovers({
    stage: stage({ resolverType: 'record_user_field', resolverReference: 'owner_id' }, 'auto_approve'),
    requesterUserId: 1,
    snapshot: { owner_id: 1 }
  }, dependencies);
  assert.equal(autoApproved.stageAutoApproved, true);
  assert.deepEqual(autoApproved.autoApproveUserIds, [1]);

  await assert.rejects(
    approvers.resolveStageApprovers({
      stage: stage({ resolverType: 'record_user_field', resolverReference: 'owner_id' }),
      requesterUserId: 1,
      snapshot: { owner_id: 1 }
    }, dependencies),
    (error) => error.statusCode === 422 && error.details.code === 'WORKFLOW_APPROVER_SELF_APPROVAL_BLOCKED'
  );
  await assert.rejects(
    approvers.resolveStageApprovers({
      stage: stage({ resolverType: 'user', resolverReference: '4' }),
      requesterUserId: 1
    }, dependencies),
    (error) => error.statusCode === 422 && error.details.code === 'WORKFLOW_APPROVER_NONE_ELIGIBLE'
  );

  console.log('Workflow approver resolution smoke passed.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
