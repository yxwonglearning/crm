const assert = require('assert/strict');
const { pool } = require('../../src/database/pool');
const repository = require('../../src/modules/workflows/workflows.repository');
const runtime = require('../../src/modules/workflows/workflows.runtime');
const decisions = require('../../src/modules/workflows/workflows.decisions');

const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const workflowKey = `decisions_${suffix}`;
let workflowId;
let versionId;
const instanceIds = [];

async function cleanup() {
  for (const instanceId of instanceIds) {
    await pool.execute('DELETE FROM crm_workflow_idempotency_keys WHERE instance_id = ?', [instanceId]);
    await pool.execute('DELETE FROM crm_workflow_audit_logs WHERE instance_id = ?', [instanceId]);
    await pool.execute('DELETE FROM crm_workflow_events WHERE instance_id = ?', [instanceId]);
    await pool.execute('DELETE FROM crm_workflow_record_locks WHERE instance_id = ?', [instanceId]);
    await pool.execute('DELETE FROM crm_workflow_attachments WHERE instance_id = ?', [instanceId]);
    await pool.execute('DELETE FROM crm_workflow_decisions WHERE instance_id = ?', [instanceId]);
    await pool.execute(
      `DELETE assignments FROM crm_workflow_assignments assignments
       INNER JOIN crm_workflow_instance_stages stages ON stages.id = assignments.instance_stage_id
       WHERE stages.instance_id = ?`,
      [instanceId]
    );
    await pool.execute('DELETE FROM crm_workflow_instance_stages WHERE instance_id = ?', [instanceId]);
    await pool.execute('DELETE FROM crm_workflow_instance_snapshots WHERE instance_id = ?', [instanceId]);
    await pool.execute('DELETE FROM crm_workflow_instances WHERE id = ?', [instanceId]);
  }
  if (versionId) {
    await pool.execute(
      `DELETE rules FROM crm_workflow_version_approver_rules rules
       INNER JOIN crm_workflow_version_stages stages ON stages.id = rules.version_stage_id
       WHERE stages.workflow_version_id = ?`,
      [versionId]
    );
    await pool.execute('DELETE FROM crm_workflow_version_stages WHERE workflow_version_id = ?', [versionId]);
  }
  if (workflowId) {
    await pool.execute('UPDATE crm_workflow_definitions SET published_version_id = NULL WHERE id = ?', [workflowId]);
    await pool.execute('DELETE FROM crm_workflow_versions WHERE workflow_id = ?', [workflowId]);
    await pool.execute('DELETE FROM crm_workflow_definitions WHERE id = ?', [workflowId]);
  }
}

async function main() {
  try {
    assert.throws(
      () => decisions.validateResponses({ fields: [{ fieldKey: 'assessment', label: 'Assessment', required: true }] }, {}, 'approve'),
      (error) => error.statusCode === 422 && error.details.code === 'WORKFLOW_RESPONSE_FIELD_REQUIRED'
    );
    assert.throws(
      () => decisions.validateResponses({ fields: [] }, { unexpected: 'value' }, 'approve'),
      (error) => error.statusCode === 422 && error.details.code === 'WORKFLOW_RESPONSE_FIELD_UNSUPPORTED'
    );
    const decisionTime = Math.floor(Date.now() / 1000) * 1000;
    const [users] = await pool.execute("SELECT id, staff_id, name, email, role, status FROM users WHERE status = 'active' ORDER BY id LIMIT 3");
    assert.equal(users.length, 3, 'Decision smoke requires three active users');
    const requester = users[0];
    const approver = users[1];
    const secondApprover = users[2];
    const definition = await repository.createDefinition({
      workflowKey,
      name: 'Decision runtime smoke',
      sourceModuleKey: 'customers',
      draftConfig: {}
    }, requester.id);
    workflowId = definition.id;
    const version = await repository.createVersion(workflowKey, {
      action: 'publish',
      snapshot: {
        workflowKey,
        sourceModuleKey: 'customers',
        builderGraph: {
          nodes: [
            { id: 'start', type: 'start' },
            {
              id: 'stage:manager', type: 'approval', stageKey: 'manager',
              responsePresentation: {
                formKey: 'manager_response', formName: 'Manager response',
                fields: [{ fieldKey: 'recommendation', label: 'Recommendation', type: 'textbox', required: false, storage: 'decision', targetFieldKey: 'recommendation' }]
              }
            },
            { id: 'stage:final_review', type: 'approval', stageKey: 'final_review' },
            { id: 'end', type: 'end' }
          ],
          edges: [
            { id: 'submit-manager', from: 'start', to: 'stage:manager', outcome: 'submit' },
            { id: 'manager-final', from: 'stage:manager', to: 'stage:final_review', outcome: 'approved' },
            { id: 'final-end', from: 'stage:final_review', to: 'end', outcome: 'approved' }
          ]
        },
        recordPolicy: { lockScope: 'record', lockedFields: [] },
        stages: [{
          stageKey: 'manager',
          name: 'Manager Approval',
          order: 0,
          approvalMode: 'all',
          selfApprovalPolicy: 'error',
          decisionPolicy: { approvalRemark: 'optional', rejectionRemark: 'required', returnRemark: 'required' },
          attachmentPolicy: { mode: 'optional', allowedTypes: ['text/plain'], maxFileSize: 1024, maxFileCount: 2, actions: ['approval', 'rejection', 'return'] },
          approverRules: [
            { ruleKey: 'manager', resolverType: 'user', resolverReference: String(approver.id) },
            { ruleKey: 'finance', resolverType: 'user', resolverReference: String(secondApprover.id) }
          ]
        }, {
          stageKey: 'final_review',
          name: 'Final Review',
          order: 1,
          approvalMode: 'all',
          selfApprovalPolicy: 'error',
          decisionPolicy: { approvalRemark: 'optional', rejectionRemark: 'required', returnRemark: 'required' },
          approverRules: [{ ruleKey: 'final_manager', resolverType: 'user', resolverReference: String(approver.id) }]
        }]
      }
    }, requester.id);
    versionId = version.id;

    async function submit(recordId) {
      const result = await runtime.submitRequest({
        workflowKey,
        sourceModuleKey: 'customers',
        sourceRecordId: recordId,
        idempotencyKey: `submit-${recordId}-${suffix}`
      }, requester, {
        moduleRecordsService: {
          getRecord: async () => ({ record: { id: recordId, customFields: { amount: 100 }, updatedAt: new Date() } })
        }
      });
      instanceIds.push(result.request.id);
      return result.request;
    }

    const approvedRequest = await submit(910001);
    await assert.rejects(
      decisions.decideRequest(approvedRequest.requestKey, {
        action: 'approve',
        idempotencyKey: `unauthorized-${suffix}`
      }, requester),
      (error) => error.statusCode === 403 && error.details.code === 'WORKFLOW_PERMISSION_NOT_ASSIGNEE'
    );
    const firstApproval = await decisions.decideRequest(approvedRequest.requestKey, {
      action: 'approve',
      responses: { recommendation: 'Proceed' },
      attachments: [{ originalname: 'approval-note.txt', mimetype: 'text/plain', buffer: Buffer.from('approved with evidence') }],
      idempotencyKey: `approve-first-${suffix}`
    }, approver, { now: new Date(decisionTime) });
    assert.equal(firstApproval.requestStatus, 'pending');
    assert.equal(firstApproval.currentStageKey, 'manager');
    assert.deepEqual(firstApproval.responseFieldKeys, ['recommendation']);
    const approvalAttachments = await repository.listAttachments(approvedRequest.id);
    assert.equal(approvalAttachments[0].fileName, 'approval-note.txt');
    assert.equal(approvalAttachments[0].purpose, 'approval');
    assert.equal((await repository.findAttachment(approvedRequest.id, approvalAttachments[0].id)).data.toString(), 'approved with evidence');
    const stageCompleted = await decisions.decideRequest(approvedRequest.requestKey, {
      action: 'approve',
      idempotencyKey: `approve-second-${suffix}`
    }, secondApprover, { now: new Date(decisionTime + 60 * 1000) });
    assert.equal(stageCompleted.requestStatus, 'pending');
    assert.equal(stageCompleted.currentStageKey, 'final_review');
    const approved = await decisions.decideRequest(approvedRequest.requestKey, {
      action: 'approve',
      idempotencyKey: `approve-final-${suffix}`
    }, approver, { now: new Date(decisionTime + 2 * 60 * 1000) });
    assert.equal(approved.requestStatus, 'approved');
    assert.equal(await repository.findRecordLock('customers', 910001), null);
    const replay = await decisions.decideRequest(approvedRequest.requestKey, {
      action: 'approve',
      idempotencyKey: `approve-final-${suffix}`
    }, approver);
    assert.equal(replay.replayed, true);
    assert.equal(replay.requestStatus, 'approved');

    const rejectedRequest = await submit(910002);
    await assert.rejects(
      decisions.decideRequest(rejectedRequest.requestKey, {
        action: 'reject',
        idempotencyKey: `reject-missing-${suffix}`
      }, approver),
      (error) => error.statusCode === 422 && error.details.code === 'WORKFLOW_STATE_REMARK_REQUIRED'
    );
    const rejected = await decisions.decideRequest(rejectedRequest.requestKey, {
      action: 'reject',
      remark: 'Supporting information is insufficient.',
      idempotencyKey: `reject-${suffix}`
    }, approver);
    assert.equal(rejected.requestStatus, 'rejected');
    assert.equal(await repository.findRecordLock('customers', 910002), null);

    const returnedRequest = await submit(910003);
    const returned = await decisions.decideRequest(returnedRequest.requestKey, {
      action: 'return',
      remark: 'Please correct the submitted amount.',
      idempotencyKey: `return-${suffix}`
    }, approver);
    assert.equal(returned.requestStatus, 'returned');
    assert.equal(returned.currentStageKey, 'manager');
    assert.equal(await repository.findRecordLock('customers', 910003), null);

    for (const request of [approvedRequest, rejectedRequest, returnedRequest]) {
      const instance = await repository.findInstanceByRequestKey(request.requestKey);
      const timeline = await repository.instanceTimeline(instance.id);
      assert.ok(timeline.some((entry) => entry.type === 'decision'));
      if (request.id === approvedRequest.id) assert.ok(timeline.some((entry) => entry.responses.recommendation === 'Proceed'));
    }
    console.log('Workflow decision runtime smoke passed.');
  } finally {
    await cleanup();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
