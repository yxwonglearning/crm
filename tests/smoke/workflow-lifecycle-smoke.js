const assert = require('assert/strict');
const { pool } = require('../../src/database/pool');
const repository = require('../../src/modules/workflows/workflows.repository');
const runtime = require('../../src/modules/workflows/workflows.runtime');
const decisions = require('../../src/modules/workflows/workflows.decisions');
const lifecycle = require('../../src/modules/workflows/workflows.lifecycle');

const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const workflowKey = `lifecycle_${suffix}`;
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
    const [users] = await pool.execute("SELECT id, staff_id, name, email, role, status FROM users WHERE status = 'active' ORDER BY id");
    const admin = users.find((user) => user.role === 'admin');
    const requester = users.find((user) => user.role !== 'admin');
    const approver = users.find((user) => Number(user.id) !== Number(requester?.id));
    assert.ok(admin && requester && approver, 'Lifecycle smoke requires admin, requester, and approver users');
    const definition = await repository.createDefinition({
      workflowKey,
      name: 'Lifecycle runtime smoke',
      sourceModuleKey: 'customers',
      draftConfig: {}
    }, admin.id);
    workflowId = definition.id;
    const version = await repository.createVersion(workflowKey, {
      action: 'publish',
      snapshot: {
        workflowKey,
        sourceModuleKey: 'customers',
        recordPolicy: { lockScope: 'fields', lockedFields: ['amount'], allowAuthorizedCancel: true },
        stages: [{
          stageKey: 'manager',
          name: 'Manager Approval',
          order: 0,
          approvalMode: 'all',
          selfApprovalPolicy: 'error',
          decisionPolicy: { approvalRemark: 'optional', rejectionRemark: 'required', returnRemark: 'required' },
          approverRules: [{ ruleKey: 'manager', resolverType: 'user', resolverReference: String(approver.id) }]
        }]
      }
    }, admin.id);
    versionId = version.id;
    const recordAmounts = new Map();
    const records = {
      getRecord: async (_moduleKey, recordId) => ({
        record: {
          id: recordId,
          customFields: { amount: recordAmounts.get(Number(recordId)) },
          updatedAt: new Date(`2026-07-24T0${recordAmounts.get(Number(recordId)) / 100}:00:00.000Z`)
        }
      })
    };
    async function submit(recordId, amount) {
      recordAmounts.set(recordId, amount);
      const result = await runtime.submitRequest({
        workflowKey,
        sourceModuleKey: 'customers',
        sourceRecordId: recordId,
        idempotencyKey: `submit-${recordId}-${suffix}`
      }, requester, { moduleRecordsService: records });
      instanceIds.push(result.request.id);
      return result.request;
    }

    const withdrawnRequest = await submit(920001, 100);
    await assert.rejects(
      lifecycle.withdrawRequest(withdrawnRequest.requestKey, { idempotencyKey: `withdraw-denied-${suffix}` }, approver),
      (error) => error.statusCode === 403 && error.details.code === 'WORKFLOW_PERMISSION_REQUESTER_REQUIRED'
    );
    const withdrawn = await lifecycle.withdrawRequest(withdrawnRequest.requestKey, {
      remark: 'No longer required.',
      idempotencyKey: `withdraw-${suffix}`
    }, requester);
    assert.equal(withdrawn.requestStatus, 'withdrawn');
    assert.equal(await repository.findRecordLock('customers', 920001), null);

    const cancelledRequest = await submit(920002, 200);
    await assert.rejects(
      lifecycle.cancelRequest(cancelledRequest.requestKey, { remark: 'Attempted cancellation.', idempotencyKey: `cancel-denied-${suffix}` }, requester),
      (error) => error.statusCode === 403 && error.details.code === 'WORKFLOW_PERMISSION_CANCEL_DENIED'
    );
    const cancelled = await lifecycle.cancelRequest(cancelledRequest.requestKey, {
      remark: 'Administrative cancellation.',
      idempotencyKey: `cancel-${suffix}`
    }, admin);
    assert.equal(cancelled.requestStatus, 'cancelled');
    assert.equal(await repository.findRecordLock('customers', 920002), null);

    const returnedRequest = await submit(920003, 300);
    await decisions.decideRequest(returnedRequest.requestKey, {
      action: 'return',
      remark: 'Correct the amount.',
      idempotencyKey: `return-${suffix}`
    }, approver);
    recordAmounts.set(920003, 400);
    const resubmitted = await lifecycle.resubmitRequest(returnedRequest.requestKey, {
      idempotencyKey: `resubmit-${suffix}`
    }, requester, {
      moduleRecordsService: records,
      now: new Date(Math.floor(Date.now() / 1000) * 1000)
    });
    assert.equal(resubmitted.requestStatus, 'pending');
    assert.equal(resubmitted.currentStageKey, 'manager');
    assert.equal(resubmitted.snapshotRevision, 2);
    assert.ok(await repository.findRecordLock('customers', 920003));
    const stages = await repository.listInstanceStages(returnedRequest.id);
    assert.equal(stages[0].status, 'active');
    const assignments = await repository.listStageAssignments(stages[0].id);
    assert.equal(assignments[0].status, 'pending');
    const replay = await lifecycle.resubmitRequest(returnedRequest.requestKey, {
      idempotencyKey: `resubmit-${suffix}`
    }, requester, { moduleRecordsService: records });
    assert.equal(replay.replayed, true);
    assert.equal(replay.snapshotRevision, 2);

    console.log('Workflow lifecycle runtime smoke passed.');
  } finally {
    await cleanup();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
