const crypto = require('crypto');
const { AppError } = require('../../shared/errors');
const repository = require('./workflows.repository');
const usersRepository = require('../users/users.repository');
const { dueAtFor } = require('./workflows.runtime');
const graphRouting = require('./workflows.graph');
const permissionService = require('../permissions/permissions.service');
const moduleConfigService = require('../sysadmin/module-config.service');
const attachmentService = require('./workflows.attachments');

const actions = new Set(['approve', 'reject', 'return']);

function decisionError(message, statusCode, code, details = {}) {
  return new AppError(message, statusCode, { code, ...details });
}

function requestHash(requestKey, input) {
  return crypto.createHash('sha256').update(JSON.stringify({
    requestKey,
    action: input.action,
    remark: String(input.remark || '').trim(),
    responses: input.responses || {},
    attachments: (input.attachments || []).map((file) => ({
      name: file.originalname || file.fileName,
      size: file.size || file.buffer?.length,
      checksum: crypto.createHash('sha256').update(file.buffer || file.data || Buffer.alloc(0)).digest('hex')
    }))
  })).digest('hex');
}

function responseConfiguration(version, stageKey) {
  return version?.snapshot?.builderGraph?.nodes?.find((node) => node.type === 'approval' && node.stageKey === stageKey)?.responsePresentation || null;
}

function stageDecisionOutcome(approvalMode, configuredQuorum, counts, action) {
  const mode = ['all', 'any', 'quorum'].includes(approvalMode) ? approvalMode : 'all';
  const threshold = mode === 'quorum' ? Math.max(1, Number(configuredQuorum || 1)) : (mode === 'any' ? 1 : Math.max(1, counts.total - (counts.cancelled || 0)));
  return {
    threshold,
    approved: action === 'approve' && counts.approved >= threshold,
    rejected: action === 'reject' && (mode === 'all' || counts.approved + counts.pending < threshold)
  };
}

function validateResponses(config, inputResponses, action, responseAttachments = {}) {
  const supplied = inputResponses && typeof inputResponses === 'object' ? inputResponses : {};
  const allowed = new Map((config?.fields || []).map((field) => [field.fieldKey, field]));
  for (const key of Object.keys(supplied)) {
    if (!allowed.has(key)) throw decisionError(`Response field ${key} is not configured for this approval stage.`, 422, 'WORKFLOW_RESPONSE_FIELD_UNSUPPORTED', { fieldKey: key });
  }
  const responses = {};
  for (const field of allowed.values()) {
    const attachment = responseAttachments[field.fieldKey];
    const value = field.type === 'attachment' && attachment ? { fileName: attachment.originalname, contentType: attachment.mimetype, fileSize: attachment.size || attachment.buffer?.length } : supplied[field.fieldKey];
    const empty = value === undefined || value === null || String(value).trim() === '';
    if (action === 'approve' && field.required && empty) throw decisionError(`${field.label || field.fieldKey} is required.`, 422, 'WORKFLOW_RESPONSE_FIELD_REQUIRED', { fieldKey: field.fieldKey });
    if (!empty) responses[field.fieldKey] = typeof value === 'string' ? value.trim().slice(0, 5000) : value;
  }
  return responses;
}

function actorIdentity(user) {
  return {
    userId: Number(user.id),
    staffId: user.staff_id || user.staffId || '',
    name: user.name || '',
    email: user.email || '',
    role: user.role || ''
  };
}

async function decideRequest(requestKey, input, user, dependencies = {}) {
  const repo = dependencies.repository || repository;
  const userRepo = dependencies.usersRepository || usersRepository;
  const permissionChecker = dependencies.permissions || permissionService;
  const configService = dependencies.moduleConfig || moduleConfigService;
  const action = input.action === 'return_for_correction' ? 'return' : input.action;
  if (!user?.id) throw decisionError('Authentication is required', 401, 'WORKFLOW_PERMISSION_AUTH_REQUIRED');
  if (!actions.has(action)) throw decisionError('Decision action is invalid', 400, 'WORKFLOW_STATE_ACTION_INVALID');
  if (!input.idempotencyKey) throw decisionError('Idempotency key is required', 400, 'WORKFLOW_CONFLICT_IDEMPOTENCY_REQUIRED');
  const remark = String(input.remark || '').trim();
  if (['reject', 'return'].includes(action) && !remark) {
    throw decisionError('A remark is required for rejection or return.', 422, 'WORKFLOW_STATE_REMARK_REQUIRED', { action });
  }
  const hash = requestHash(requestKey, { action, remark, responses: input.responses || {}, attachments: input.attachments || [] });
  const actorKey = String(user.id);
  const now = dependencies.now ? new Date(dependencies.now) : new Date();

  return repo.withTransaction(async (connection) => {
    const prior = await repo.findIdempotency('workflow.decision', actorKey, input.idempotencyKey, connection);
    if (prior) {
      if (prior.requestHash !== hash) {
        throw decisionError('Idempotency key was already used for a different decision.', 409, 'WORKFLOW_CONFLICT_IDEMPOTENCY_MISMATCH');
      }
      return { ...prior.response, replayed: true };
    }

    const instance = await repo.findInstanceByRequestKey(requestKey, connection, { forUpdate: true });
    if (!instance) throw decisionError('Workflow request not found', 404, 'WORKFLOW_STATE_REQUEST_NOT_FOUND');
    if (instance.status !== 'pending') {
      throw decisionError(`Request ${requestKey} is no longer pending.`, 409, 'WORKFLOW_STATE_REQUEST_NOT_PENDING', { status: instance.status });
    }
    const activeUser = await userRepo.findUserById(Number(user.id));
    if (!activeUser || activeUser.status !== 'active') {
      throw decisionError('Only an active assigned approver may decide this request.', 403, 'WORKFLOW_PERMISSION_APPROVER_INACTIVE');
    }
    const sourcePermissions = await permissionChecker.userModulePermissions(instance.sourceModuleKey, activeUser);
    if (!sourcePermissions.view) {
      throw decisionError('You cannot view the source record for this approval.', 403, 'WORKFLOW_PERMISSION_SOURCE_VIEW_DENIED');
    }
    const stage = await repo.findActiveStage(instance.id, connection, { forUpdate: true });
    if (!stage) throw decisionError('Request has no active approval stage.', 409, 'WORKFLOW_STATE_ACTIVE_STAGE_MISSING');
    const assignment = await repo.findAssignmentForApprover(stage.id, user.id, connection, { forUpdate: true });
    if (!assignment) throw decisionError('You are not assigned to the active approval stage.', 403, 'WORKFLOW_PERMISSION_NOT_ASSIGNEE');
    if (assignment.status !== 'pending') {
      throw decisionError('This assignment has already been decided.', 409, 'WORKFLOW_STATE_ASSIGNMENT_DECIDED', { status: assignment.status });
    }
    if (action === 'approve' && stage.decisionPolicy?.approvalRemark === 'required' && !remark) {
      throw decisionError('An approval remark is required for this stage.', 422, 'WORKFLOW_STATE_REMARK_REQUIRED', { action });
    }

    const version = await repo.findVersion(instance.workflowKey, instance.workflowVersionId, connection);
    const responseConfig = responseConfiguration(version, stage.stageKey);
    const responses = validateResponses(responseConfig, input.responses, action, input.responseAttachments || {});
    const purpose = action === 'approve' ? 'approval' : action;
    const validatedAttachments = await attachmentService.validateAndScanFiles(input.attachments || [], stage.attachmentPolicy || {}, purpose, dependencies.attachmentScanner || {});
    const automationResponses = Object.fromEntries((responseConfig?.fields || []).filter((field) => field.exposeToAutomation && responses[field.fieldKey] !== undefined).map((field) => [field.fieldKey, responses[field.fieldKey]]));
    const sourceMappings = (responseConfig?.fields || []).filter((field) => field.storage === 'source' && responses[field.fieldKey] !== undefined);
    if (sourceMappings.length && action === 'approve') {
      const moduleConfig = await configService.getModuleConfig(instance.sourceModuleKey);
      const fieldPermissions = await permissionChecker.userFieldPermissions(instance.sourceModuleKey, activeUser, moduleConfig.fields || []);
      const sourceUpdates = {};
      for (const mapping of sourceMappings) {
        const targetFieldKey = mapping.targetFieldKey || mapping.fieldKey;
        if (!moduleConfig.fields?.some((field) => field.fieldKey === targetFieldKey && field.tableType !== 'detail')) throw decisionError(`Mapped source field ${targetFieldKey} is unavailable.`, 422, 'WORKFLOW_RESPONSE_MAPPING_INVALID', { fieldKey: mapping.fieldKey, targetFieldKey });
        if (fieldPermissions.get(targetFieldKey)?.edit === false) throw decisionError(`You cannot update ${targetFieldKey} through this approval.`, 403, 'WORKFLOW_PERMISSION_RESPONSE_FIELD_EDIT_DENIED', { targetFieldKey });
        sourceUpdates[targetFieldKey] = responses[mapping.fieldKey];
      }
      if (!await repo.updateWorkflowSourceFields(instance.sourceModuleKey, instance.sourceRecordId, sourceUpdates, user.id, connection)) throw decisionError('The mapped source record could not be updated.', 409, 'WORKFLOW_RESPONSE_SOURCE_UPDATE_FAILED');
    }
    const detailMappings = (responseConfig?.fields || []).filter((field) => field.storage === 'detail' && responses[field.fieldKey] !== undefined);
    if (detailMappings.length && action === 'approve') {
      const moduleConfig = await configService.getModuleConfig(instance.sourceModuleKey);
      const fieldPermissions = await permissionChecker.userFieldPermissions(instance.sourceModuleKey, activeUser, moduleConfig.fields || []);
      const rowsByTable = {};
      for (const mapping of detailMappings) {
        const targetFieldKey = mapping.targetFieldKey || mapping.fieldKey;
        const target = moduleConfig.fields?.find((field) => field.fieldKey === targetFieldKey && field.tableType === 'detail' && field.detailTableName);
        if (!target) throw decisionError(`Mapped detail field ${targetFieldKey} is unavailable.`, 422, 'WORKFLOW_RESPONSE_DETAIL_MAPPING_INVALID', { fieldKey: mapping.fieldKey, targetFieldKey });
        if (fieldPermissions.get(targetFieldKey)?.edit === false) throw decisionError(`You cannot append ${targetFieldKey} through this approval.`, 403, 'WORKFLOW_PERMISSION_RESPONSE_FIELD_EDIT_DENIED', { targetFieldKey });
        rowsByTable[target.detailTableName] ||= {};
        rowsByTable[target.detailTableName][targetFieldKey] = responses[mapping.fieldKey];
      }
      await repo.appendWorkflowDetailRows(instance.sourceRecordId, rowsByTable, connection);
    }

    const decisionId = await repo.appendDecision({
      instanceId: instance.id,
      instanceStageId: stage.id,
      assignmentId: assignment.id,
      snapshotId: stage.snapshotId,
      action,
      actorUserId: user.id,
      actorIdentity: actorIdentity(activeUser),
      remark,
      responses,
      instanceLockVersion: instance.lockVersion,
      assignmentLockVersion: assignment.lockVersion,
      idempotencyKey: `${requestKey}:${input.idempotencyKey}`
    }, connection);
    for (const attachment of validatedAttachments) {
      await repo.appendAttachment({ ...attachment, instanceId: instance.id, decisionId, uploadedBy: user.id }, connection);
    }
    const assignmentStatus = action === 'return' ? 'returned' : (action === 'reject' ? 'rejected' : 'approved');
    if (!await repo.transitionAssignment(assignment.id, assignment.lockVersion, {
      status: assignmentStatus,
      decidedAt: now
    }, connection)) {
      throw decisionError('Assignment changed before this decision completed.', 409, 'WORKFLOW_CONFLICT_STALE_ASSIGNMENT');
    }

    let requestStatus = 'pending';
    let currentStageKey = stage.stageKey;
    const counts = await repo.assignmentCounts(stage.id, connection);
    const approvalMode = stage.approvalMode || 'all';
    const outcome = stageDecisionOutcome(approvalMode, stage.decisionPolicy?.quorum, counts, action);
    const stageApproved = outcome.approved;
    const stageRejected = outcome.rejected;
    if (action === 'return' || stageRejected) {
      await repo.cancelPendingAssignments(stage.id, now, connection);
      await repo.transitionInstanceStage(stage.id, stage.lockVersion, {
        status: action === 'return' ? 'returned' : 'rejected',
        reasonCode: action === 'return' ? 'WORKFLOW_RETURNED_FOR_CORRECTION' : 'WORKFLOW_REJECTED',
        reasonMessage: remark,
        completedAt: now
      }, connection);
      requestStatus = action === 'return' ? 'returned' : 'rejected';
      await repo.transitionInstance(instance.id, instance.lockVersion, {
        status: requestStatus,
        currentStageKey: action === 'return' ? stage.stageKey : null,
        terminalReasonCode: action === 'reject' ? 'WORKFLOW_REJECTED' : null,
        terminalRemark: remark,
        completedAt: action === 'reject' ? now : null
      }, connection);
      await repo.releaseRecordLock(instance.id, connection);
      await repo.appendEvent({
        eventKey: `${requestKey}:${input.idempotencyKey}:${action}`,
        eventType: action === 'return' ? 'workflow.returned' : 'workflow.rejected',
        instanceId: instance.id,
        instanceStageId: stage.id,
        decisionId,
        payload: { requestKey, stageKey: stage.stageKey, requestStatus, actorId: Number(user.id), remark, responseFieldKeys: Object.keys(responses), responses: automationResponses }
      }, connection);
    } else if (stageApproved) {
      if (approvalMode !== 'all') await repo.cancelPendingAssignments(stage.id, now, connection);
      await repo.transitionInstanceStage(stage.id, stage.lockVersion, {
        status: 'approved',
        completedAt: now
      }, connection);
      await repo.appendEvent({
        eventKey: `${requestKey}:${stage.stageKey}:approved`,
        eventType: 'workflow.stage.approved',
        instanceId: instance.id,
        instanceStageId: stage.id,
        decisionId,
        payload: { requestKey, stageKey: stage.stageKey, stageStatus: 'approved', responseFieldKeys: Object.keys(responses), responses: automationResponses }
      }, connection);
      let routeSelection = null;
      let nextStage = null;
      if (graphRouting.executableGraph(version.snapshot)) {
        const [latestSnapshot, instanceStages] = await Promise.all([
          repo.findLatestSnapshot(instance.id, connection),
          repo.listInstanceStages(instance.id, connection)
        ]);
        routeSelection = graphRouting.nextRouteTarget(version.snapshot, stage.stageKey, latestSnapshot?.snapshot || {}, instanceStages);
        if (routeSelection?.type === 'approval') {
          const versionStage = version.stages.find((item) => item.stageKey === routeSelection.stage.stageKey);
          nextStage = { ...routeSelection.stage, decisionPolicy: versionStage?.decisionPolicy || {}, slaPolicy: versionStage?.slaPolicy || {} };
        }
      } else {
        nextStage = await repo.findNextWaitingStage(instance.id, stage.stageOrder, connection, { forUpdate: true });
      }
      if (nextStage) {
        const dueAt = dueAtFor(nextStage, now);
        await repo.transitionInstanceStage(nextStage.id, nextStage.lockVersion, {
          status: 'active',
          activatedAt: now,
          dueAt
        }, connection);
        currentStageKey = nextStage.stageKey;
        await repo.transitionInstance(instance.id, instance.lockVersion, {
          status: 'pending',
          currentStageKey
        }, connection);
        await repo.appendEvent({
          eventKey: `${requestKey}:${nextStage.stageKey}:started`,
          eventType: 'workflow.stage.started',
          instanceId: instance.id,
          instanceStageId: nextStage.id,
          payload: { requestKey, stageKey: nextStage.stageKey, stageStatus: 'active', ...(routeSelection?.selectedEdges?.at(-1) ? { connectionKey: routeSelection.selectedEdges.at(-1).id, outcome: routeSelection.selectedEdges.at(-1).outcome } : {}) }
        }, connection);
      } else {
        requestStatus = 'approved';
        currentStageKey = null;
        await repo.transitionInstance(instance.id, instance.lockVersion, {
          status: 'approved',
          currentStageKey: null,
          completedAt: now
        }, connection);
        await repo.releaseRecordLock(instance.id, connection);
        await repo.appendEvent({
          eventKey: `${requestKey}:approved`,
          eventType: 'workflow.approved',
          instanceId: instance.id,
          instanceStageId: stage.id,
          payload: { requestKey, requestStatus: 'approved', completedAt: now.toISOString(), ...(routeSelection?.selectedEdges?.at(-1) ? { connectionKey: routeSelection.selectedEdges.at(-1).id, outcome: routeSelection.selectedEdges.at(-1).outcome } : {}) }
        }, connection);
      }
    }

    const response = { requestKey, action, requestStatus, currentStageKey, responseFieldKeys: Object.keys(responses) };
    await repo.appendAudit({
      workflowId: instance.workflowId,
      instanceId: instance.id,
      instanceStageId: stage.id,
      actorUserId: user.id,
      action: `workflow.${action}`,
      targetType: 'workflow_assignment',
      targetKey: String(assignment.id),
      result: 'allowed',
      reasonCode: `WORKFLOW_${action.toUpperCase()}_ACCEPTED`,
      metadata: { requestKey, priorStatus: instance.status, requestStatus },
      correlationId: input.correlationId || null
    }, connection);
    await repo.storeIdempotency({
      commandScope: 'workflow.decision',
      actorUserId: user.id,
      actorKey,
      idempotencyKey: input.idempotencyKey,
      requestHash: hash,
      instanceId: instance.id,
      responseStatus: 200,
      response,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
    }, connection);
    return { ...response, replayed: false };
  });
}

module.exports = { actorIdentity, decideRequest, requestHash, responseConfiguration, stageDecisionOutcome, validateResponses };
