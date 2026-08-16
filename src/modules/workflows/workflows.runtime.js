const { AppError } = require('../../shared/errors');
const crypto = require('crypto');
const repository = require('./workflows.repository');
const approvers = require('./workflows.approvers');
const conditions = require('./workflows.conditions');
const graphRouting = require('./workflows.graph');
const sourceRecords = require('./workflows.source-records');
const permissionService = require('../permissions/permissions.service');
const attachmentService = require('./workflows.attachments');

function runtimeError(message, statusCode, code, details = {}) {
  return new AppError(message, statusCode, { code, ...details });
}

function sourceSnapshot(result) {
  const record = result?.record || result;
  if (!record) return null;
  return {
    ...(record.customFields || {}),
    id: record.id,
    createdBy: record.createdBy,
    updatedBy: record.updatedBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function dueAtFor(stage, now) {
  if (!stage.slaPolicy?.enabled) return null;
  const multipliers = { minutes: 60000, hours: 3600000, days: 86400000 };
  return new Date(now.getTime() + Number(stage.slaPolicy.duration) * multipliers[stage.slaPolicy.unit]);
}

function submissionHash(input) {
  return crypto.createHash('sha256').update(JSON.stringify({
    workflowKey: input.workflowKey || '',
    sourceModuleKey: input.sourceModuleKey,
    sourceRecordId: String(input.sourceRecordId),
    attachments: (input.attachments || []).map((file) => ({
      name: file.originalname || file.fileName,
      size: file.size || file.buffer?.length,
      checksum: crypto.createHash('sha256').update(file.buffer || file.data || Buffer.alloc(0)).digest('hex')
    }))
  })).digest('hex');
}

async function candidateDefinitions(input, snapshot, repo) {
  const definitions = input.workflowKey
    ? [await repo.findDefinitionByKey(input.workflowKey)].filter(Boolean)
    : await repo.listDefinitions({ status: 'published', sourceModuleKey: input.sourceModuleKey });
  const candidates = [];
  for (const definition of definitions) {
    if (definition.status !== 'published' || !definition.publishedVersionId) continue;
    if (definition.sourceModuleKey !== input.sourceModuleKey) continue;
    const version = await repo.findVersion(definition.workflowKey, definition.publishedVersionId);
    if (!version) continue;
    const routing = graphRouting.executableGraph(version.snapshot)
      ? { matched: conditions.evaluateCondition(version.snapshot.entryCondition, snapshot, 'entryCondition').matched, stages: [], blockedAt: null }
      : conditions.routeStages({ entryCondition: version.snapshot.entryCondition, stages: version.stages }, snapshot);
    if (routing.matched) candidates.push({ definition, version, routing });
  }
  return candidates;
}

async function submitRequest(input, user, dependencies = {}) {
  const repo = dependencies.repository || repository;
  const resolver = dependencies.approvers || approvers;
  const records = dependencies.moduleRecordsService || sourceRecords;
  const permissionChecker = dependencies.permissions || permissionService;
  if (!user?.id) throw runtimeError('Authentication is required', 401, 'WORKFLOW_PERMISSION_AUTH_REQUIRED');
  if (!input.sourceModuleKey || input.sourceRecordId === undefined || input.sourceRecordId === null) {
    throw runtimeError('Source module and record are required', 400, 'WORKFLOW_SUBMIT_SOURCE_REQUIRED');
  }
  const actorKey = String(user.id);
  const requestHash = submissionHash(input);
  if (input.idempotencyKey) {
    const prior = await repo.findIdempotency('workflow.submit', actorKey, input.idempotencyKey);
    if (prior) {
      if (prior.requestHash !== requestHash) {
        throw runtimeError('Idempotency key was already used for a different submission.', 409, 'WORKFLOW_CONFLICT_IDEMPOTENCY_MISMATCH');
      }
      const existing = prior.response?.requestKey
        ? await repo.findInstanceByRequestKey(prior.response.requestKey)
        : null;
      return { request: existing, snapshot: null, stages: [], replayed: true };
    }
  }

  let recordResult;
  try {
    recordResult = await records.getRecord(input.sourceModuleKey, Number(input.sourceRecordId), user);
  } catch (error) {
    if (error.statusCode === 403) throw runtimeError('You cannot submit this record for approval', 403, 'WORKFLOW_PERMISSION_SUBMIT_DENIED');
    throw error;
  }
  const snapshot = sourceSnapshot(recordResult);
  if (!snapshot) throw runtimeError('Source record not found', 404, 'WORKFLOW_SUBMIT_SOURCE_NOT_FOUND');

  const existingLock = await repo.findRecordLock(input.sourceModuleKey, input.sourceRecordId);
  if (existingLock) {
    throw runtimeError(`Record already has active request ${existingLock.requestKey}.`, 409, 'WORKFLOW_CONFLICT_ACTIVE_REQUEST', {
      requestKey: existingLock.requestKey
    });
  }
  const candidates = await candidateDefinitions(input, snapshot, repo);
  if (!candidates.length) {
    throw runtimeError('No published approval workflow matches this record.', 422, 'WORKFLOW_SUBMIT_NO_MATCH');
  }
  if (candidates.length > 1) {
    throw runtimeError('More than one published approval workflow matches this record.', 422, 'WORKFLOW_SUBMIT_MULTIPLE_MATCHES');
  }

  const { definition, version, routing } = candidates[0];
  const validatedAttachments = attachmentService.validateFiles(input.attachments || [], attachmentService.submissionPolicy(version), 'submission');
  const graphExecution = graphRouting.routeExecution({ ...version.snapshot, stages: version.stages }, snapshot);
  const selectedStageKeys = new Set((graphExecution?.stages || []).map((item) => item.stage.stageKey));
  const routedStages = graphExecution
    ? [...graphExecution.stages, ...version.stages.filter((stage) => stage.enabled !== false && !selectedStageKeys.has(stage.stageKey)).map((stage) => ({ stage, outcome: 'skipped', reasonCode: 'WORKFLOW_ROUTE_NOT_SELECTED', trace: [], incomingEdge: null }))]
    : routing.stages;
  if (routing.blockedAt) {
    throw runtimeError(`Workflow stage ${routing.blockedAt} is not applicable and skipping is disabled.`, 422, 'WORKFLOW_STAGE_CONDITION_NOT_MET', {
      stageKey: routing.blockedAt
    });
  }

  const now = dependencies.now ? new Date(dependencies.now) : new Date();
  const materialized = [];
  let activeAssigned = false;
  for (const [routeIndex, routed] of routedStages.entries()) {
    const stage = routed.stage;
    if (routed.outcome === 'disabled') continue;
    if (routed.outcome === 'skipped') {
      materialized.push({
        versionStageId: stage.id,
        stageKey: stage.stageKey,
        stageOrder: graphExecution ? routeIndex : stage.order,
        status: 'skipped',
        reasonCode: routed.reasonCode,
        reasonMessage: routed.reasonCode === 'WORKFLOW_ROUTE_NOT_SELECTED'
          ? 'Stage was not selected by the executable approval route.'
          : 'Stage condition was not met and configured skipping was applied.',
        completedAt: now,
        assignments: [],
        events: [{ eventType: 'workflow.stage.skipped', payload: { stageKey: stage.stageKey, reasonCode: routed.reasonCode, ...(routed.incomingEdge ? { connectionKey: routed.incomingEdge.id, outcome: routed.incomingEdge.outcome } : {}) } }]
      });
      continue;
    }

    const resolution = await resolver.resolveStageApprovers({
      stage,
      workflowKey: definition.workflowKey,
      requesterUserId: user.id,
      snapshot
    }, dependencies);
    for (const approver of resolution.approvers) {
      const approverPermissions = await permissionChecker.userModulePermissions(input.sourceModuleKey, {
        id: approver.userId,
        role: approver.role,
        organization_node_id: approver.organizationNodeId
      });
      if (!approverPermissions.view) {
        throw runtimeError(`Unable to submit: ${stage.name} has an approver without source-record access.`, 422, 'WORKFLOW_APPROVER_SOURCE_VIEW_DENIED', {
          stageKey: stage.stageKey,
          approverUserId: approver.userId
        });
      }
    }
    const autoApproved = resolution.stageAutoApproved;
    const status = autoApproved ? 'auto_approved' : (activeAssigned ? 'waiting' : 'active');
    if (!autoApproved && !activeAssigned) activeAssigned = true;
    const dueAt = status === 'active' ? dueAtFor(stage, now) : null;
    const assignments = resolution.approvers.map((approver) => ({
      approverRuleId: stage.approverRules.find((rule) => rule.ruleKey === approver.ruleKey)?.id || null,
      approverUserId: approver.userId,
      resolverType: approver.resolverType,
      resolverReference: approver.resolverReference,
      approverIdentity: approver,
      authorityEvaluation: { ruleKey: approver.ruleKey, resolvedAt: now.toISOString(), delegationId: approver.delegationId || null, originalApprover: approver.originalApprover || null },
      status: autoApproved ? 'approved' : 'pending',
      dueAt
    }));
    materialized.push({
      versionStageId: stage.id,
      stageKey: stage.stageKey,
      stageOrder: graphExecution ? routeIndex : stage.order,
      status,
      dueAt,
      activatedAt: status === 'active' ? now : null,
      completedAt: autoApproved ? now : null,
      assignments,
      autoDecisions: autoApproved ? [{
        assignmentIndex: 0,
        action: 'auto_approve',
        actorUserId: user.id,
        actorIdentity: resolution.approvers[0],
        remark: 'Automatically approved by configured self-approval policy.',
        instanceLockVersion: 0,
        assignmentLockVersion: 0
      }] : [],
      events: [...(status === 'waiting' ? [] : [{
        eventType: autoApproved ? 'workflow.stage.auto_approved' : (status === 'active' ? 'workflow.stage.started' : 'workflow.stage.waiting'),
        payload: { stageKey: stage.stageKey, stageStatus: status, ...(routed.incomingEdge ? { connectionKey: routed.incomingEdge.id, outcome: routed.incomingEdge.outcome } : {}) }
      }]), ...resolution.approvers.filter((approver) => approver.delegationId).map((approver) => ({
        eventType: 'workflow.assignment.delegated', payload: { stageKey: stage.stageKey, delegationId: approver.delegationId,
          originalApproverUserId: approver.originalApprover.userId, replacementApproverUserId: approver.userId }
      }))]
    });
  }

  const activeStage = materialized.find((stage) => stage.status === 'active');
  const immediatelyApproved = !activeStage;
  let bundle;
  try {
    bundle = await repo.createInstanceBundle({
    workflowKey: definition.workflowKey,
    workflowId: definition.id,
    workflowVersionId: version.id,
    sourceModuleKey: input.sourceModuleKey,
    sourceRecordId: input.sourceRecordId,
    sourceRecordVersion: String(snapshot.updatedAt || ''),
    requesterUserId: user.id,
    status: immediatelyApproved ? 'approved' : 'pending',
    currentStageKey: activeStage?.stageKey || null,
    submittedAt: now,
    completedAt: immediatelyApproved ? now : null,
    snapshot,
    attachments: validatedAttachments,
    stages: materialized,
    recordLock: immediatelyApproved ? null : {
      lockScope: version.snapshot.recordPolicy?.lockScope || 'record',
      lockedFields: version.snapshot.recordPolicy?.lockedFields || [],
      lockedBy: user.id
    },
    event: {
      eventType: immediatelyApproved ? 'workflow.completed' : 'workflow.submitted',
      payload: {
        workflowKey: definition.workflowKey,
        sourceModuleKey: input.sourceModuleKey,
        sourceRecordId: String(input.sourceRecordId),
        requestStatus: immediatelyApproved ? 'approved' : 'pending',
        ...(graphExecution?.selectedEdges?.[0] ? { connectionKey: graphExecution.selectedEdges[0].id, outcome: graphExecution.selectedEdges[0].outcome } : {})
      }
    },
    audit: {
      actorUserId: user.id,
      action: 'workflow.submit',
      targetType: 'workflow_instance',
      result: 'allowed',
      reasonCode: 'WORKFLOW_SUBMIT_ACCEPTED',
      correlationId: input.correlationId || null,
      metadata: { workflowVersion: version.versionNumber }
    },
    idempotency: input.idempotencyKey ? {
      commandScope: 'workflow.submit',
      actorUserId: user.id,
      actorKey,
      idempotencyKey: input.idempotencyKey,
      requestHash,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
    } : null
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' && String(error.message || '').includes('crm_workflow_record_locks_source_unique')) {
      throw runtimeError('This record already has an active approval request.', 409, 'WORKFLOW_CONFLICT_ACTIVE_REQUEST');
    }
    throw error;
  }
  return { request: bundle.instance, snapshot: bundle.snapshot, stages: bundle.stages, replayed: false };
}

module.exports = { candidateDefinitions, dueAtFor, sourceSnapshot, submissionHash, submitRequest };
