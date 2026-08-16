const assert = require('assert/strict');
const { pool } = require('../../src/database/pool');
const repository = require('../../src/modules/workflows/workflows.repository');
const runtime = require('../../src/modules/workflows/workflows.runtime');

const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const workflowKey = `submission_${suffix}`;
const sourceRecordId = Number(String(Date.now()).slice(-8));
let workflowId;
let versionId;
let instanceId;

async function cleanup() {
  if (instanceId) {
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
    const submittedAt = new Date(Math.floor(Date.now() / 1000) * 1000);
    const expectedDueAt = new Date(submittedAt.getTime() + 2 * 60 * 60 * 1000);
    const [users] = await pool.execute("SELECT id, name, email, role, status FROM users WHERE status = 'active' ORDER BY id LIMIT 2");
    assert.equal(users.length, 2, 'Submission smoke requires two active users');
    const requester = users[0];
    const approver = users[1];
    const definition = await repository.createDefinition({
      workflowKey,
      name: 'Submission runtime smoke',
      sourceModuleKey: 'customers',
      requestFormKey: 'customer_main',
      requestFormVersion: 1,
      draftConfig: {}
    }, requester.id);
    workflowId = definition.id;
    const version = await repository.createVersion(workflowKey, {
      action: 'publish',
      snapshot: {
        workflowKey,
        sourceModuleKey: 'customers',
        entryCondition: { fieldKey: 'amount', operator: 'greater_than', value: 0 },
        builderGraph: {
          nodes: [
            { id: 'start', type: 'start' },
            { id: 'stage:high_value_hr', type: 'approval', stageKey: 'high_value_hr' },
            { id: 'stage:manager', type: 'approval', stageKey: 'manager' },
            { id: 'end', type: 'end' }
          ],
          edges: [
            { id: 'high-value', from: 'start', to: 'stage:high_value_hr', outcome: 'condition_met', condition: { group: 'all', rules: [{ fieldKey: 'amount', operator: 'greater_than', value: 5000 }] } },
            { id: 'standard-value', from: 'start', to: 'stage:manager', outcome: 'condition_not_met', condition: { group: 'all', rules: [{ fieldKey: 'amount', operator: 'greater_than', value: 5000 }] } },
            { id: 'high-end', from: 'stage:high_value_hr', to: 'end', outcome: 'approved' },
            { id: 'manager-end', from: 'stage:manager', to: 'end', outcome: 'approved' }
          ]
        },
        recordPolicy: { lockScope: 'fields', lockedFields: ['amount'] },
        stages: [{
          stageKey: 'high_value_hr',
          name: 'High Value HR',
          order: 0,
          condition: { fieldKey: 'amount', operator: 'greater_than', value: 5000 },
          skipWhenConditionFalse: true,
          approvalMode: 'all',
          selfApprovalPolicy: 'error',
          approverRules: [{ ruleKey: 'hr', resolverType: 'user', resolverReference: String(approver.id) }]
        }, {
          stageKey: 'manager',
          name: 'Manager Approval',
          order: 1,
          condition: null,
          skipWhenConditionFalse: false,
          approvalMode: 'all',
          selfApprovalPolicy: 'error',
          slaPolicy: { enabled: true, duration: 2, unit: 'hours' },
          approverRules: [{ ruleKey: 'manager', resolverType: 'user', resolverReference: String(approver.id) }]
        }]
      }
    }, requester.id);
    versionId = version.id;

    const result = await runtime.submitRequest({
      workflowKey,
      sourceModuleKey: 'customers',
      sourceRecordId,
      idempotencyKey: `submit-${suffix}`,
      correlationId: `submission-smoke-${suffix}`
    }, requester, {
      moduleRecordsService: {
        getRecord: async () => ({
          record: {
            id: sourceRecordId,
            customFields: { amount: 1200, owner_id: approver.id },
            updatedAt: new Date('2026-07-24T00:00:00.000Z')
          }
        })
      },
      now: submittedAt
    });
    instanceId = result.request.id;
    assert.equal(result.request.requestKey.endsWith('-000001'), true);
    assert.equal(result.request.status, 'pending');
    assert.equal(result.request.currentStageKey, 'manager');

    const stages = await repository.listInstanceStages(instanceId);
    assert.equal(stages.find((stage) => stage.stageKey === 'high_value_hr').status, 'skipped');
    assert.equal(stages.find((stage) => stage.stageKey === 'high_value_hr').reasonCode, 'WORKFLOW_ROUTE_NOT_SELECTED');
    const managerStage = stages.find((stage) => stage.stageKey === 'manager');
    assert.equal(managerStage.status, 'active');
    assert.equal(new Date(managerStage.dueAt).toISOString(), expectedDueAt.toISOString());
    const assignments = await repository.listStageAssignments(managerStage.id);
    assert.deepEqual(assignments.map((assignment) => assignment.approverUserId), [Number(approver.id)]);
    assert.ok(await repository.findRecordLock('customers', sourceRecordId));
    const timeline = await repository.instanceTimeline(instanceId);
    assert.ok(timeline.some((entry) => entry.eventType === 'workflow.stage.skipped'));
    assert.ok(timeline.some((entry) => entry.eventType === 'workflow.stage.started'));
    assert.ok(timeline.some((entry) => entry.eventType === 'workflow.stage.started' && entry.payload.connectionKey === 'standard-value'));
    assert.ok(timeline.some((entry) => entry.eventType === 'workflow.submitted'));

    const [audits] = await pool.execute(
      "SELECT reason_code FROM crm_workflow_audit_logs WHERE instance_id = ? AND action = 'workflow.submit'",
      [instanceId]
    );
    assert.deepEqual(audits.map((audit) => audit.reason_code), ['WORKFLOW_SUBMIT_ACCEPTED']);

    const replay = await runtime.submitRequest({
      workflowKey,
      sourceModuleKey: 'customers',
      sourceRecordId,
      idempotencyKey: `submit-${suffix}`
    }, requester);
    assert.equal(replay.replayed, true);
    assert.equal(replay.request.requestKey, result.request.requestKey);

    await assert.rejects(
      runtime.submitRequest({
        workflowKey,
        sourceModuleKey: 'customers',
        sourceRecordId: sourceRecordId + 1,
        idempotencyKey: `submit-${suffix}`
      }, requester),
      (error) => error.statusCode === 409 && error.details.code === 'WORKFLOW_CONFLICT_IDEMPOTENCY_MISMATCH'
    );

    await assert.rejects(
      runtime.submitRequest({
        workflowKey,
        sourceModuleKey: 'customers',
        sourceRecordId
      }, requester, {
        moduleRecordsService: {
          getRecord: async () => ({ record: { id: sourceRecordId, customFields: { amount: 1200 } } })
        }
      }),
      (error) => error.statusCode === 409 && error.details.code === 'WORKFLOW_CONFLICT_ACTIVE_REQUEST'
    );

    console.log('Workflow submission runtime smoke passed.');
  } finally {
    await cleanup();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
