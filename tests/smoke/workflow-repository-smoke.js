const assert = require('assert/strict');
const { pool } = require('../../src/database/pool');
const repository = require('../../src/modules/workflows/workflows.repository');

const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const workflowKey = `smoke_workflow_${suffix}`;
const requestPrefix = workflowKey.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 20);
const requestKey = `${requestPrefix}-000001`;
const sourceRecordId = `smoke_record_${suffix}`;

let workflowId = null;
let workflowVersionId = null;
let instanceId = null;

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
  if (workflowVersionId) {
    await pool.execute(
      `DELETE rules FROM crm_workflow_version_approver_rules rules
       INNER JOIN crm_workflow_version_stages stages ON stages.id = rules.version_stage_id
       WHERE stages.workflow_version_id = ?`,
      [workflowVersionId]
    );
    await pool.execute('DELETE FROM crm_workflow_version_stages WHERE workflow_version_id = ?', [workflowVersionId]);
  }
  if (workflowId) {
    await pool.execute('UPDATE crm_workflow_definitions SET published_version_id = NULL WHERE id = ?', [workflowId]);
    await pool.execute('DELETE FROM crm_workflow_versions WHERE workflow_id = ?', [workflowId]);
    await pool.execute('DELETE FROM crm_workflow_definitions WHERE id = ?', [workflowId]);
  }
}

async function main() {
  try {
    const [users] = await pool.execute(
      "SELECT id, name, email FROM users WHERE status = 'active' ORDER BY id LIMIT 1"
    );
    assert.ok(users[0], 'Workflow repository smoke requires one active user');
    const user = users[0];

    const definition = await repository.createDefinition({
      workflowKey,
      name: 'Workflow repository smoke',
      sourceModuleKey: 'customers',
      requestFormKey: 'customer_main',
      requestFormVersion: 1,
      draftConfig: {
        trigger: { type: 'manual_submit' },
        stages: [{
          stageKey: 'supervisor',
          name: 'Supervisor Approval',
          approvalMode: 'all',
          selfApprovalPolicy: 'error',
          approverRules: [{
            ruleKey: 'specific_user',
            resolverType: 'user',
            resolverReference: String(user.id)
          }]
        }]
      }
    }, user.id);
    workflowId = definition.id;
    assert.equal(definition.status, 'draft');

    const listedDefinitions = await repository.listDefinitions({ search: workflowKey });
    assert.equal(listedDefinitions.length, 1);

    const version = await repository.createVersion(workflowKey, {
      action: 'publish',
      summary: 'Repository smoke publish',
      snapshot: definition.draftConfig
    }, user.id);
    workflowVersionId = version.id;
    assert.equal(version.versionNumber, 1);
    assert.equal(version.stages.length, 1);
    assert.equal(version.stages[0].approverRules[0].resolverType, 'user');

    const refreshedDefinition = await repository.findDefinitionByKey(workflowKey);
    assert.equal(refreshedDefinition.status, 'published');
    assert.equal(refreshedDefinition.publishedVersionId, workflowVersionId);

    const versionStage = version.stages[0];
    const approverRule = versionStage.approverRules[0];
    const bundle = await repository.createInstanceBundle({
      workflowKey,
      workflowId,
      workflowVersionId,
      sourceModuleKey: 'customers',
      sourceRecordId,
      sourceRecordVersion: '1',
      requesterUserId: user.id,
      status: 'pending',
      currentStageKey: versionStage.stageKey,
      submittedAt: new Date(),
      snapshot: { customerName: 'Repository smoke customer', amount: 100 },
      stages: [{
        versionStageId: versionStage.id,
        stageKey: versionStage.stageKey,
        stageOrder: versionStage.order,
        status: 'active',
        activatedAt: new Date(),
        assignments: [{
          approverRuleId: approverRule.id,
          approverUserId: user.id,
          resolverType: 'user',
          resolverReference: String(user.id),
          approverIdentity: { id: user.id, name: user.name, email: user.email }
        }]
      }],
      recordLock: {
        lockScope: 'fields',
        lockedFields: ['customerName', 'amount'],
        lockedBy: user.id
      },
      event: {
        eventKey: `${requestKey}:submitted`,
        eventType: 'workflow.submitted',
        payload: { requestKey }
      }
    });
    instanceId = bundle.instance.id;
    assert.equal(bundle.instance.requestKey, requestKey);
    assert.equal(bundle.instance.status, 'pending');
    assert.equal(bundle.snapshot.revisionNumber, 1);

    const recordLock = await repository.findRecordLock('customers', sourceRecordId);
    assert.equal(recordLock.instanceId, instanceId);
    assert.deepEqual(recordLock.lockedFields, ['customerName', 'amount']);

    const stages = await repository.listInstanceStages(instanceId);
    assert.equal(stages.length, 1);
    assert.equal(stages[0].status, 'active');
    const assignments = await repository.listStageAssignments(stages[0].id);
    assert.equal(assignments.length, 1);

    const inbox = await repository.listApproverInbox(user.id, { status: 'pending' });
    assert.ok(inbox.some((item) => item.requestKey === requestKey));

    const idempotencyKey = `${requestKey}:approve`;
    let decisionId;
    await repository.withTransaction(async (connection) => {
      decisionId = await repository.appendDecision({
        instanceId,
        instanceStageId: stages[0].id,
        assignmentId: assignments[0].id,
        snapshotId: bundle.snapshot.id,
        action: 'approve',
        actorUserId: user.id,
        actorIdentity: { id: user.id, name: user.name, email: user.email },
        remark: 'Repository smoke approval',
        instanceLockVersion: 0,
        assignmentLockVersion: 0,
        idempotencyKey
      }, connection);
      assert.equal(
        await repository.transitionAssignment(assignments[0].id, 0, { status: 'approved', decidedAt: new Date() }, connection),
        true
      );
      assert.equal(
        await repository.transitionInstanceStage(stages[0].id, 0, { status: 'approved', completedAt: new Date() }, connection),
        true
      );
      assert.equal(
        await repository.transitionInstance(instanceId, 0, { status: 'approved', currentStageKey: null, completedAt: new Date() }, connection),
        true
      );
      await repository.appendEvent({
        eventKey: `${requestKey}:completed`,
        eventType: 'workflow.completed',
        instanceId,
        instanceStageId: stages[0].id,
        decisionId,
        payload: { requestKey, status: 'approved' }
      }, connection);
      await repository.storeIdempotency({
        commandScope: 'workflow.decision',
        actorUserId: user.id,
        actorKey: `user:${user.id}`,
        idempotencyKey,
        requestHash: repository.checksum({ action: 'approve', instanceId }),
        instanceId,
        decisionId,
        responseStatus: 200,
        response: { requestKey, status: 'approved' },
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      }, connection);
      await repository.appendAudit({
        workflowId,
        instanceId,
        instanceStageId: stages[0].id,
        actorUserId: user.id,
        action: 'workflow.approve',
        targetType: 'workflow_request',
        targetKey: requestKey,
        result: 'allowed',
        reasonCode: 'WORKFLOW_DECISION_RECORDED',
        correlationId: idempotencyKey
      }, connection);
    });

    assert.equal(await repository.transitionAssignment(assignments[0].id, 0, { status: 'approved' }), false);
    await assert.rejects(
      repository.appendDecision({
        instanceId,
        instanceStageId: stages[0].id,
        assignmentId: assignments[0].id,
        snapshotId: bundle.snapshot.id,
        action: 'approve',
        actorUserId: user.id,
        actorIdentity: { id: user.id },
        instanceLockVersion: 0,
        assignmentLockVersion: 0,
        idempotencyKey
      }),
      (error) => error.code === 'ER_DUP_ENTRY'
    );

    const idempotency = await repository.findIdempotency('workflow.decision', `user:${user.id}`, idempotencyKey);
    assert.equal(idempotency.decisionId, decisionId);
    assert.equal(idempotency.response.status, 'approved');

    const pendingEvents = await repository.listPendingEvents();
    assert.ok(pendingEvents.some((event) => event.eventKey === `${requestKey}:submitted`));
    assert.ok(pendingEvents.some((event) => event.eventKey === `${requestKey}:completed`));

    const timeline = await repository.instanceTimeline(instanceId);
    assert.ok(timeline.some((entry) => entry.type === 'decision' && entry.action === 'approve'));
    assert.ok(timeline.some((entry) => entry.type === 'event' && entry.eventType === 'workflow.completed'));

    assert.equal(await repository.releaseRecordLock(instanceId), 1);
    assert.equal(await repository.findRecordLock('customers', sourceRecordId), null);

    process.stdout.write('Workflow repository smoke passed.\n');
  } finally {
    await cleanup();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
