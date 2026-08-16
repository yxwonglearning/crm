const assert = require('assert/strict');
const access = require('../../src/modules/workflows/workflows.access');

const audits = [];
const instance = {
  id: 10,
  requestKey: 'LEAVE-000001',
  workflowId: 2,
  workflowKey: 'leave_approval',
  workflowVersionId: 4,
  sourceModuleKey: 'leave',
  sourceRecordId: '44',
  requesterUserId: 1,
  status: 'pending',
  currentStageKey: 'manager'
};
const repository = {
  findInstanceByRequestKey: async () => instance,
  userHasInstanceAssignment: async (_instanceId, userId) => Number(userId) === 2,
  appendAudit: async (entry) => audits.push(entry),
  findLatestSnapshot: async () => ({
    id: 5,
    revisionNumber: 1,
    snapshot: { id: 44, leave_type: 'Annual', medical_note: 'Sensitive', createdAt: 'today' }
  }),
  listInstanceStages: async () => [{ id: 8, stageKey: 'manager', status: 'active' }],
  listAttachments: async () => [{ id: 12, fileName: 'request.pdf', purpose: 'submission', fileSize: 12 }],
  instanceTimeline: async () => [{
    id: 1,
    type: 'decision',
    actorIdentity: { userId: 2, staffId: 'MGR-1', name: 'Manager', email: 'private@example.com', role: 'manager' }
  }],
  findVersion: async () => ({
    snapshot: {
      requestFormKey: 'add',
      builderGraph: {
        nodes: [
          { id: 'start', type: 'start', presentation: { formKey: 'add', formName: 'Leave request', mode: 'request', fieldKeys: ['leave_type'] } },
          { id: 'stage:manager', type: 'approval', stageKey: 'manager', presentation: { formKey: 'detail', formName: 'Manager review', mode: 'review', fieldKeys: ['leave_type', 'medical_note'] }, responsePresentation: { formKey: 'manager_response', formName: 'Manager response', fields: [{ fieldKey: 'leave_type', label: 'Recommendation', storage: 'decision' }] } }
        ]
      }
    }
  })
};
const moduleConfig = {
  getModuleConfig: async () => ({
    fields: [
      { fieldKey: 'leave_type', dataKey: 'leave_type' },
      { fieldKey: 'medical_note', dataKey: 'medical_note' }
    ]
  })
};
function permissionService(view, medicalView = false) {
  return {
    userModulePermissions: async () => ({ view }),
    userFieldPermissions: async () => new Map([
      ['leave_type', { view: true }],
      ['medical_note', { view: medicalView }]
    ])
  };
}

async function main() {
  assert.doesNotThrow(() => access.assertConfigurationAdmin({ id: 99, role: 'admin' }));
  assert.throws(
    () => access.assertConfigurationAdmin({ id: 1, role: 'manager' }),
    (error) => error.statusCode === 403 && error.details.code === 'WORKFLOW_PERMISSION_CONFIGURE_DENIED'
  );

  const requesterView = await access.getRequestView('LEAVE-000001', { id: 1, role: 'user' }, {
    repository,
    moduleConfig,
    permissions: permissionService(true)
  });
  assert.equal(requesterView.relationship, 'requester');
  assert.equal(requesterView.snapshot.snapshot.leave_type, 'Annual');
  assert.equal(requesterView.snapshot.snapshot.medical_note, undefined);
  assert.equal(requesterView.presentation.formName, 'Leave request');
  assert.equal(requesterView.attachments[0].fileName, 'request.pdf');
  assert.equal(requesterView.timeline[0].actorIdentity.email, undefined);
  assert.equal(requesterView.timeline[0].actorIdentity.role, undefined);

  const approverView = await access.getRequestView('LEAVE-000001', { id: 2, role: 'manager' }, {
    repository,
    moduleConfig,
    permissions: permissionService(true, true)
  });
  assert.equal(approverView.presentation.formName, 'Manager review');
  assert.equal(approverView.responseForm.formName, 'Manager response');
  assert.equal(approverView.snapshot.snapshot.medical_note, 'Sensitive');

  const approverAuthorization = await access.authorizeRequest(instance, { id: 2, role: 'manager' }, 'workflow.view', {
    repository,
    permissions: permissionService(true)
  });
  assert.equal(approverAuthorization.relationship, 'approver');

  await assert.rejects(
    access.authorizeRequest(instance, { id: 3, role: 'user' }, 'workflow.view', {
      repository,
      permissions: permissionService(true)
    }),
    (error) => error.statusCode === 403 && error.details.code === 'WORKFLOW_PERMISSION_REQUEST_DENIED'
  );
  await assert.rejects(
    access.authorizeRequest(instance, { id: 2, role: 'manager' }, 'workflow.view', {
      repository,
      permissions: permissionService(false)
    }),
    (error) => error.statusCode === 403 && error.details.code === 'WORKFLOW_PERMISSION_SOURCE_VIEW_DENIED'
  );
  assert.ok(audits.some((audit) => audit.result === 'allowed' && audit.reasonCode === 'WORKFLOW_PERMISSION_REQUESTER'));
  assert.ok(audits.some((audit) => audit.result === 'denied' && audit.reasonCode === 'WORKFLOW_PERMISSION_NOT_PARTICIPANT'));
  assert.ok(audits.some((audit) => audit.result === 'denied' && audit.reasonCode === 'WORKFLOW_PERMISSION_SOURCE_VIEW_DENIED'));

  console.log('Workflow access and redaction smoke passed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
