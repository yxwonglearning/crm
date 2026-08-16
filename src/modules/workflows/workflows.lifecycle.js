const crypto = require('crypto');
const { AppError } = require('../../shared/errors');
const repository = require('./workflows.repository');
const approvers = require('./workflows.approvers');
const conditions = require('./workflows.conditions');
const graphRouting = require('./workflows.graph');
const sourceRecords = require('./workflows.source-records');
const { dueAtFor, sourceSnapshot } = require('./workflows.runtime');
const permissionService = require('../permissions/permissions.service');

function lifecycleError(message, statusCode, code, details = {}) {
  return new AppError(message, statusCode, { code, ...details });
}

function hash(command, requestKey, input) {
  return crypto.createHash('sha256').update(JSON.stringify({
    command,
    requestKey,
    remark: String(input.remark || '').trim(),
    sourceRecordVersion: String(input.sourceRecordVersion || '')
  })).digest('hex');
}

async function replayOrConflict(repo, scope, actorKey, key, requestHash, connection) {
  const prior = await repo.findIdempotency(scope, actorKey, key, connection);
  if (!prior) return null;
  if (prior.requestHash !== requestHash) {
    throw lifecycleError('Idempotency key was already used with different input.', 409, 'WORKFLOW_CONFLICT_IDEMPOTENCY_MISMATCH');
  }
  return { ...prior.response, replayed: true };
}

async function endRequest(requestKey, input, user, action, dependencies = {}) {
  const repo = dependencies.repository || repository;
  if (!user?.id) throw lifecycleError('Authentication is required', 401, 'WORKFLOW_PERMISSION_AUTH_REQUIRED');
  if (!input.idempotencyKey) throw lifecycleError('Idempotency key is required', 400, 'WORKFLOW_CONFLICT_IDEMPOTENCY_REQUIRED');
  const remark = String(input.remark || '').trim();
  if (action === 'cancel' && !remark) {
    throw lifecycleError('A cancellation remark is required.', 422, 'WORKFLOW_STATE_REMARK_REQUIRED');
  }
  const actorKey = String(user.id);
  const requestHash = hash(action, requestKey, input);
  const now = dependencies.now ? new Date(dependencies.now) : new Date();
  return repo.withTransaction(async (connection) => {
    const replay = await replayOrConflict(repo, `workflow.${action}`, actorKey, input.idempotencyKey, requestHash, connection);
    if (replay) return replay;
    const instance = await repo.findInstanceByRequestKey(requestKey, connection, { forUpdate: true });
    if (!instance) throw lifecycleError('Workflow request not found', 404, 'WORKFLOW_STATE_REQUEST_NOT_FOUND');
    if (instance.status !== 'pending') {
      throw lifecycleError('Only a pending request can be ended.', 409, 'WORKFLOW_STATE_REQUEST_NOT_PENDING', { status: instance.status });
    }
    if (action === 'withdraw' && Number(instance.requesterUserId) !== Number(user.id)) {
      throw lifecycleError('Only the requester can withdraw this request.', 403, 'WORKFLOW_PERMISSION_REQUESTER_REQUIRED');
    }
    if (action === 'cancel' && user.role !== 'admin') {
      throw lifecycleError('Only an administrator can cancel this request.', 403, 'WORKFLOW_PERMISSION_CANCEL_DENIED');
    }
    if (action === 'cancel') {
      const version = await repo.findVersion(instance.workflowKey, instance.workflowVersionId, connection);
      if (version?.snapshot?.recordPolicy?.allowAuthorizedCancel === false) {
        throw lifecycleError('Administrative cancellation is disabled for this workflow.', 403, 'WORKFLOW_PERMISSION_CANCEL_DISABLED');
      }
    }
    await repo.cancelOpenInstanceWork(instance.id, now, connection);
    const status = action === 'withdraw' ? 'withdrawn' : 'cancelled';
    if (!await repo.transitionInstance(instance.id, instance.lockVersion, {
      status,
      currentStageKey: null,
      terminalReasonCode: action === 'withdraw' ? 'WORKFLOW_WITHDRAWN' : 'WORKFLOW_CANCELLED',
      terminalRemark: remark,
      completedAt: now
    }, connection)) throw lifecycleError('Request changed before the action completed.', 409, 'WORKFLOW_CONFLICT_STALE_INSTANCE');
    await repo.releaseRecordLock(instance.id, connection);
    await repo.appendEvent({
      eventKey: `${requestKey}:${input.idempotencyKey}:${action}`,
      eventType: action === 'withdraw' ? 'workflow.withdrawn' : 'workflow.cancelled',
      instanceId: instance.id,
      payload: { requestKey, requestStatus: status, actorId: Number(user.id), remark }
    }, connection);
    await repo.appendAudit({
      workflowId: instance.workflowId,
      instanceId: instance.id,
      actorUserId: user.id,
      action: `workflow.${action}`,
      targetType: 'workflow_instance',
      targetKey: requestKey,
      result: 'allowed',
      reasonCode: action === 'withdraw' ? 'WORKFLOW_WITHDRAW_ACCEPTED' : 'WORKFLOW_CANCEL_ACCEPTED',
      metadata: { priorStatus: instance.status, requestStatus: status },
      correlationId: input.correlationId || null
    }, connection);
    const response = { requestKey, requestStatus: status };
    await repo.storeIdempotency({
      commandScope: `workflow.${action}`,
      actorUserId: user.id,
      actorKey,
      idempotencyKey: input.idempotencyKey,
      requestHash,
      instanceId: instance.id,
      responseStatus: 200,
      response,
      expiresAt: new Date(now.getTime() + 86400000)
    }, connection);
    return { ...response, replayed: false };
  });
}

async function resubmitRequest(requestKey, input, user, dependencies = {}) {
  const repo = dependencies.repository || repository;
  const resolver = dependencies.approvers || approvers;
  const records = dependencies.moduleRecordsService || sourceRecords;
  const permissionChecker = dependencies.permissions || permissionService;
  if (!user?.id) throw lifecycleError('Authentication is required', 401, 'WORKFLOW_PERMISSION_AUTH_REQUIRED');
  if (!input.idempotencyKey) throw lifecycleError('Idempotency key is required', 400, 'WORKFLOW_CONFLICT_IDEMPOTENCY_REQUIRED');
  const initial = await repo.findInstanceByRequestKey(requestKey);
  if (!initial) throw lifecycleError('Workflow request not found', 404, 'WORKFLOW_STATE_REQUEST_NOT_FOUND');
  if (Number(initial.requesterUserId) !== Number(user.id)) {
    throw lifecycleError('Only the requester can resubmit this request.', 403, 'WORKFLOW_PERMISSION_REQUESTER_REQUIRED');
  }
  const actorKey = String(user.id);
  const requestHash = hash('resubmit', requestKey, input);
  const prior = await repo.findIdempotency('workflow.resubmit', actorKey, input.idempotencyKey);
  if (prior) {
    if (prior.requestHash !== requestHash) {
      throw lifecycleError('Idempotency key was already used with different input.', 409, 'WORKFLOW_CONFLICT_IDEMPOTENCY_MISMATCH');
    }
    return { ...prior.response, replayed: true };
  }
  if (initial.status !== 'returned') throw lifecycleError('Only a returned request can be resubmitted.', 409, 'WORKFLOW_STATE_REQUEST_NOT_RETURNED');
  const recordResult = await records.getRecord(initial.sourceModuleKey, Number(initial.sourceRecordId), user);
  const snapshot = sourceSnapshot(recordResult);
  const version = await repo.findVersion(initial.workflowKey, initial.workflowVersionId);
  if (!version) throw lifecycleError('Workflow version is unavailable.', 409, 'WORKFLOW_STATE_VERSION_MISSING');
  const graphExecution = graphRouting.routeExecution({ ...version.snapshot, stages: version.stages }, snapshot);
  const routing = graphExecution || conditions.routeStages({ entryCondition: version.snapshot.entryCondition, stages: version.stages }, snapshot);
  if (!graphExecution && !routing.matched) throw lifecycleError('Amended record no longer matches the workflow.', 422, 'WORKFLOW_SUBMIT_NO_MATCH');
  const routedStageIndex = graphExecution?.stages.findIndex((item) => item.stage.stageKey === initial.currentStageKey);
  const returnOrder = version.stages.find((stage) => stage.stageKey === initial.currentStageKey)?.order;
  if (graphExecution && routedStageIndex < 0) throw lifecycleError('The amended record no longer follows the returned approval path.', 422, 'WORKFLOW_ROUTE_RETURN_PATH_CHANGED', { stageKey: initial.currentStageKey });
  if (!graphExecution && returnOrder === undefined) throw lifecycleError('Returning stage is unavailable.', 409, 'WORKFLOW_STATE_RETURN_STAGE_MISSING');
  const plans = [];
  let activeAssigned = false;
  const resubmitStages = graphExecution
    ? graphExecution.stages.slice(routedStageIndex)
    : routing.stages.filter((item) => item.stage.order >= returnOrder && item.outcome !== 'disabled');
  for (const routed of resubmitStages) {
    if (routed.outcome === 'blocked') {
      throw lifecycleError('A resubmission stage is inapplicable and skipping is disabled.', 422, 'WORKFLOW_STAGE_CONDITION_NOT_MET', { stageKey: routed.stage.stageKey });
    }
    if (routed.outcome === 'skipped') {
      plans.push({ stage: routed.stage, status: 'skipped', resolution: null, reasonCode: routed.reasonCode, incomingEdge: routed.incomingEdge });
      continue;
    }
    const resolution = await resolver.resolveStageApprovers({ stage: routed.stage, workflowKey: initial.workflowKey, requesterUserId: user.id, snapshot }, dependencies);
    for (const approver of resolution.approvers) {
      const sourcePermissions = await permissionChecker.userModulePermissions(initial.sourceModuleKey, {
        id: approver.userId,
        role: approver.role,
        organization_node_id: approver.organizationNodeId
      });
      if (!sourcePermissions.view) {
        throw lifecycleError('A resolved approver cannot view the source record.', 422, 'WORKFLOW_APPROVER_SOURCE_VIEW_DENIED', {
          stageKey: routed.stage.stageKey,
          approverUserId: approver.userId
        });
      }
    }
    const status = resolution.stageAutoApproved ? 'auto_approved' : (activeAssigned ? 'waiting' : 'active');
    if (status === 'active') activeAssigned = true;
    plans.push({ stage: routed.stage, status, resolution, reasonCode: '', incomingEdge: routed.incomingEdge });
  }
  const now = dependencies.now ? new Date(dependencies.now) : new Date();

  return repo.withTransaction(async (connection) => {
    const replay = await replayOrConflict(repo, 'workflow.resubmit', actorKey, input.idempotencyKey, requestHash, connection);
    if (replay) return replay;
    const instance = await repo.findInstanceByRequestKey(requestKey, connection, { forUpdate: true });
    if (!instance || instance.status !== 'returned' || Number(instance.requesterUserId) !== Number(user.id)) {
      throw lifecycleError('Request is no longer eligible for resubmission.', 409, 'WORKFLOW_STATE_REQUEST_NOT_RETURNED');
    }
    const newSnapshot = await repo.appendSnapshot(instance.id, {
      sourceRecordVersion: String(snapshot.updatedAt || ''),
      snapshot,
      createdBy: user.id
    }, connection);
    const runtimeStages = await repo.listInstanceStages(instance.id, connection);
    for (const plan of plans) {
      const runtimeStage = runtimeStages.find((stage) => stage.stageKey === plan.stage.stageKey);
      if (!runtimeStage) throw lifecycleError('Runtime stage is unavailable.', 409, 'WORKFLOW_STATE_STAGE_MISSING');
      const dueAt = plan.status === 'active' ? dueAtFor(plan.stage, now) : null;
      const existingAssignments = await repo.listStageAssignments(runtimeStage.id, connection, { forUpdate: true });
      const eligibleIds = new Set((plan.resolution?.approvers || []).map((item) => Number(item.userId)));
      for (const assignment of existingAssignments) {
        if (!eligibleIds.has(assignment.approverUserId)) {
          if (assignment.status === 'pending') await repo.transitionAssignment(assignment.id, assignment.lockVersion, { status: 'cancelled', decidedAt: now }, connection);
          continue;
        }
        const identity = plan.resolution.approvers.find((item) => item.userId === assignment.approverUserId);
        await repo.resetAssignment(assignment.id, {
          approverRuleId: plan.stage.approverRules.find((rule) => rule.ruleKey === identity.ruleKey)?.id,
          resolverType: identity.resolverType,
          resolverReference: identity.resolverReference,
          approverIdentity: identity,
          authorityEvaluation: { ruleKey: identity.ruleKey, resolvedAt: now.toISOString(), resubmitted: true, delegationId: identity.delegationId || null, originalApprover: identity.originalApprover || null },
          status: plan.status === 'auto_approved' ? 'approved' : 'pending',
          dueAt,
          decidedAt: plan.status === 'auto_approved' ? now : null
        }, connection);
      }
      const existingIds = new Set(existingAssignments.map((item) => item.approverUserId));
      const newAssignments = (plan.resolution?.approvers || []).filter((item) => !existingIds.has(item.userId)).map((identity) => ({
        approverRuleId: plan.stage.approverRules.find((rule) => rule.ruleKey === identity.ruleKey)?.id,
        approverUserId: identity.userId,
        resolverType: identity.resolverType,
        resolverReference: identity.resolverReference,
        approverIdentity: identity,
        authorityEvaluation: { ruleKey: identity.ruleKey, resolvedAt: now.toISOString(), resubmitted: true, delegationId: identity.delegationId || null, originalApprover: identity.originalApprover || null },
        status: plan.status === 'auto_approved' ? 'approved' : 'pending',
        dueAt
      }));
      await repo.createAssignments(runtimeStage.id, newAssignments, connection);
      await repo.transitionInstanceStage(runtimeStage.id, runtimeStage.lockVersion, {
        status: plan.status,
        snapshotId: newSnapshot.id,
        reasonCode: plan.reasonCode || null,
        reasonMessage: plan.status === 'skipped' ? 'Stage condition was not met after amendment.' : null,
        dueAt,
        activatedAt: plan.status === 'active' ? now : null,
        completedAt: ['skipped', 'auto_approved'].includes(plan.status) ? now : null
      }, connection);
      if (plan.status === 'auto_approved') {
        const refreshedAssignments = await repo.listStageAssignments(runtimeStage.id, connection);
        const selfAssignment = refreshedAssignments.find((assignment) => assignment.approverUserId === Number(user.id));
        await repo.appendDecision({
          instanceId: instance.id,
          instanceStageId: runtimeStage.id,
          assignmentId: selfAssignment?.id || null,
          snapshotId: newSnapshot.id,
          action: 'auto_approve',
          actorUserId: user.id,
          actorIdentity: plan.resolution.approvers.find((item) => item.userId === Number(user.id)) || { userId: Number(user.id) },
          remark: 'Automatically approved by configured self-approval policy after resubmission.',
          instanceLockVersion: instance.lockVersion,
          assignmentLockVersion: selfAssignment?.lockVersion ?? null,
          idempotencyKey: `${requestKey}:resubmit:${newSnapshot.revisionNumber}:${plan.stage.stageKey}:auto_approve`
        }, connection);
      }
      if (['skipped', 'auto_approved', 'active'].includes(plan.status)) {
        const eventTypes = {
          skipped: 'workflow.stage.skipped',
          auto_approved: 'workflow.stage.auto_approved',
          active: 'workflow.stage.started'
        };
        await repo.appendEvent({
          eventKey: `${requestKey}:resubmit:${newSnapshot.revisionNumber}:${plan.stage.stageKey}:${plan.status}`,
          eventType: eventTypes[plan.status],
          instanceId: instance.id,
          instanceStageId: runtimeStage.id,
          payload: { requestKey, stageKey: plan.stage.stageKey, stageStatus: plan.status, snapshotRevision: newSnapshot.revisionNumber, ...(plan.incomingEdge ? { connectionKey: plan.incomingEdge.id, outcome: plan.incomingEdge.outcome } : {}) }
        }, connection);
      }
    }
    const activePlan = plans.find((plan) => plan.status === 'active');
    const requestStatus = activePlan ? 'pending' : 'approved';
    if (!await repo.transitionInstance(instance.id, instance.lockVersion, {
      status: requestStatus,
      currentStageKey: activePlan?.stage.stageKey || null,
      terminalReasonCode: null,
      terminalRemark: null,
      completedAt: requestStatus === 'approved' ? now : null
    }, connection)) throw lifecycleError('Request changed before resubmission completed.', 409, 'WORKFLOW_CONFLICT_STALE_INSTANCE');
    if (activePlan) {
      await repo.acquireRecordLock({
        sourceModuleKey: instance.sourceModuleKey,
        sourceRecordId: instance.sourceRecordId,
        instanceId: instance.id,
        lockScope: version.snapshot.recordPolicy?.lockScope || 'record',
        lockedFields: version.snapshot.recordPolicy?.lockedFields || [],
        lockedBy: user.id
      }, connection);
    }
    await repo.appendEvent({
      eventKey: `${requestKey}:${input.idempotencyKey}:resubmit`,
      eventType: 'workflow.resubmitted',
      instanceId: instance.id,
      payload: { requestKey, requestStatus, snapshotRevision: newSnapshot.revisionNumber, stageKey: activePlan?.stage.stageKey || '' }
    }, connection);
    await repo.appendAudit({
      workflowId: instance.workflowId,
      instanceId: instance.id,
      actorUserId: user.id,
      action: 'workflow.resubmit',
      targetType: 'workflow_instance',
      targetKey: requestKey,
      result: 'allowed',
      reasonCode: 'WORKFLOW_RESUBMIT_ACCEPTED',
      metadata: { snapshotRevision: newSnapshot.revisionNumber, requestStatus },
      correlationId: input.correlationId || null
    }, connection);
    const response = { requestKey, requestStatus, currentStageKey: activePlan?.stage.stageKey || null, snapshotRevision: newSnapshot.revisionNumber };
    await repo.storeIdempotency({
      commandScope: 'workflow.resubmit',
      actorUserId: user.id,
      actorKey,
      idempotencyKey: input.idempotencyKey,
      requestHash,
      instanceId: instance.id,
      responseStatus: 200,
      response,
      expiresAt: new Date(now.getTime() + 86400000)
    }, connection);
    return { ...response, replayed: false };
  });
}

module.exports = {
  cancelRequest: (requestKey, input, user, dependencies) => endRequest(requestKey, input, user, 'cancel', dependencies),
  resubmitRequest,
  withdrawRequest: (requestKey, input, user, dependencies) => endRequest(requestKey, input, user, 'withdraw', dependencies)
};
