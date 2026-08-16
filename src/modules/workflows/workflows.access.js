const { AppError } = require('../../shared/errors');
const repository = require('./workflows.repository');
const permissions = require('../permissions/permissions.service');
const moduleConfig = require('../sysadmin/module-config.service');

function accessError(message, code) {
  return new AppError(message, 403, { code });
}

function redactSnapshot(snapshot, fields, permissionMap, presentationFieldKeys = null) {
  const presentationKeys = Array.isArray(presentationFieldKeys) ? new Set(presentationFieldKeys) : null;
  const visibleKeys = new Set((fields || []).filter(
    (field) => permissionMap.get(field.fieldKey)?.view && (!presentationKeys || presentationKeys.has(field.fieldKey) || presentationKeys.has(field.dataKey))
  ).flatMap((field) => [field.fieldKey, field.dataKey].filter(Boolean)));
  return Object.fromEntries(Object.entries(snapshot || {}).filter(([key]) => (
    ['id', 'createdAt', 'updatedAt'].includes(key) || visibleKeys.has(key)
  )));
}

function requestPresentation(instance, relationship, version) {
  const nodes = version?.snapshot?.builderGraph?.nodes || [];
  let node;
  if (relationship === 'requester') {
    node = ['approved', 'rejected', 'withdrawn', 'cancelled'].includes(instance.status)
      ? nodes.find((item) => item.type === 'end')
      : nodes.find((item) => item.type === 'start');
  } else if (instance.currentStageKey) {
    node = nodes.find((item) => item.type === 'approval' && item.stageKey === instance.currentStageKey);
  }
  node ||= nodes.find((item) => item.type === 'start');
  const presentation = node?.presentation;
  if (presentation) return { ...presentation, nodeId: node.id, stageKey: node.stageKey || '' };
  return {
    formKey: version?.snapshot?.requestFormKey || '',
    formName: version?.snapshot?.requestFormKey ? `${version.snapshot.requestFormKey} form` : 'Permitted fields',
    mode: node?.type === 'approval' ? 'review' : node?.type === 'end' ? 'result' : 'request',
    fieldKeys: null,
    inherited: true,
    nodeId: node?.id || '',
    stageKey: node?.stageKey || ''
  };
}

async function auditAccess(repo, instance, user, action, allowed, reasonCode) {
  await repo.appendAudit({
    workflowId: instance?.workflowId,
    instanceId: instance?.id,
    actorUserId: user?.id,
    action,
    targetType: 'workflow_instance',
    targetKey: instance?.requestKey,
    result: allowed ? 'allowed' : 'denied',
    reasonCode,
    metadata: { requestKey: instance?.requestKey || '' }
  });
}

async function authorizeRequest(instance, user, action = 'workflow.view', dependencies = {}) {
  const repo = dependencies.repository || repository;
  const permissionService = dependencies.permissions || permissions;
  if (!user?.id) throw new AppError('Authentication is required', 401, { code: 'WORKFLOW_PERMISSION_AUTH_REQUIRED' });
  let relationship = '';
  if (user.role === 'admin') relationship = 'admin';
  else if (Number(instance.requesterUserId) === Number(user.id)) relationship = 'requester';
  else if (await repo.userHasInstanceAssignment(instance.id, user.id)) relationship = 'approver';
  if (!relationship) {
    await auditAccess(repo, instance, user, action, false, 'WORKFLOW_PERMISSION_NOT_PARTICIPANT');
    throw accessError('You cannot access this workflow request.', 'WORKFLOW_PERMISSION_REQUEST_DENIED');
  }
  const modulePermissions = await permissionService.userModulePermissions(instance.sourceModuleKey, user);
  if (user.role !== 'admin' && !modulePermissions.view) {
    await auditAccess(repo, instance, user, action, false, 'WORKFLOW_PERMISSION_SOURCE_VIEW_DENIED');
    throw accessError('You cannot access the source record for this workflow request.', 'WORKFLOW_PERMISSION_SOURCE_VIEW_DENIED');
  }
  await auditAccess(repo, instance, user, action, true, `WORKFLOW_PERMISSION_${relationship.toUpperCase()}`);
  return { relationship, modulePermissions };
}

async function getRequestView(requestKey, user, dependencies = {}) {
  const repo = dependencies.repository || repository;
  const permissionService = dependencies.permissions || permissions;
  const configService = dependencies.moduleConfig || moduleConfig;
  const instance = await repo.findInstanceByRequestKey(requestKey);
  if (!instance) throw new AppError('Workflow request not found', 404, { code: 'WORKFLOW_STATE_REQUEST_NOT_FOUND' });
  const authorization = await authorizeRequest(instance, user, 'workflow.view', dependencies);
  const [snapshot, stages, timeline, config, version, attachments] = await Promise.all([
    repo.findLatestSnapshot(instance.id),
    repo.listInstanceStages(instance.id),
    repo.instanceTimeline(instance.id),
    configService.getModuleConfig(instance.sourceModuleKey),
    repo.findVersion(instance.workflowKey, instance.workflowVersionId),
    repo.listAttachments(instance.id)
  ]);
  const permissionMap = await permissionService.userFieldPermissions(
    instance.sourceModuleKey,
    user,
    config.fields || []
  );
  const safeTimeline = timeline.map((entry) => ({
    ...entry,
    responses: user.role === 'admin' || Number(entry.actorUserId) === Number(user.id) ? entry.responses : {},
    actorIdentity: entry.actorIdentity ? {
      userId: entry.actorIdentity.userId || entry.actorIdentity.id || null,
      staffId: entry.actorIdentity.staffId || '',
      name: entry.actorIdentity.name || ''
    } : {}
  }));
  const presentation = requestPresentation(instance, authorization.relationship, version);
  const activeNode = version?.snapshot?.builderGraph?.nodes?.find((node) => node.type === 'approval' && node.stageKey === instance.currentStageKey);
  const responseForm = authorization.relationship === 'approver' ? (activeNode?.responsePresentation || null) : null;
  const attachmentPolicy = authorization.relationship === 'approver'
    ? (version?.stages?.find((stage) => stage.stageKey === instance.currentStageKey)?.attachmentPolicy || { mode: 'disabled' })
    : (version?.snapshot?.builderGraph?.nodes?.find((node) => node.type === 'start')?.attachmentPolicy || { mode: 'disabled' });
  return {
    request: instance,
    relationship: authorization.relationship,
    snapshot: snapshot ? {
      ...snapshot,
      snapshot: redactSnapshot(snapshot.snapshot, config.fields || [], permissionMap, presentation.fieldKeys)
    } : null,
    presentation,
    responseForm,
    attachmentPolicy,
    attachments,
    stages,
    timeline: safeTimeline
  };
}

async function listRequestViews(filters, user, dependencies = {}) {
  const repo = dependencies.repository || repository;
  if (!user?.id) throw new AppError('Authentication is required', 401, { code: 'WORKFLOW_PERMISSION_AUTH_REQUIRED' });
  const candidates = await repo.listInstances({
    status: filters?.status || 'all',
    search: filters?.search || '',
    limit: filters?.limit,
    participantUserId: user.role === 'admin' ? null : user.id
  });
  const requests = [];
  for (const instance of candidates) {
    try {
      const authorization = await authorizeRequest(instance, user, 'workflow.list', dependencies);
      requests.push({ ...instance, relationship: authorization.relationship });
    } catch (error) {
      if (error.statusCode !== 403) throw error;
    }
  }
  return { requests };
}

function assertConfigurationAdmin(user) {
  if (!user?.id) throw new AppError('Authentication is required', 401, { code: 'WORKFLOW_PERMISSION_AUTH_REQUIRED' });
  if (user.role !== 'admin') throw accessError('Only administrators can configure approval workflows.', 'WORKFLOW_PERMISSION_CONFIGURE_DENIED');
}

module.exports = { assertConfigurationAdmin, authorizeRequest, getRequestView, listRequestViews, redactSnapshot, requestPresentation };
