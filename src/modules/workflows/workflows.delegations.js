const crypto = require('crypto');
const { AppError } = require('../../shared/errors');
const repository = require('./workflows.repository');
const usersRepository = require('../users/users.repository');
const permissions = require('../permissions/permissions.service');
const departmentsRepository = require('../departments/departments.repository');

function assertAdmin(user) {
  if (!user?.id) throw new AppError('Authentication is required', 401, { code: 'WORKFLOW_PERMISSION_AUTH_REQUIRED' });
  if (user.role !== 'admin') throw new AppError('Only administrators can manage approval delegation.', 403, { code: 'WORKFLOW_PERMISSION_DELEGATION_DENIED' });
}

async function activeUser(id) {
  const user = await usersRepository.findUserById(Number(id));
  return user?.status === 'active' ? user : null;
}

async function list(filters, user) { assertAdmin(user); return { delegations: await repository.listDelegations(filters) }; }

async function create(input, user) {
  assertAdmin(user);
  const delegator = await activeUser(input.delegatorUserId);
  const delegate = await activeUser(input.delegateUserId);
  if (!delegator || !delegate) throw new AppError('Both delegation users must be active.', 422, { code: 'WORKFLOW_DELEGATION_USER_INACTIVE' });
  if (Number(delegator.id) === Number(delegate.id)) throw new AppError('An approver cannot delegate to themselves.', 422, { code: 'WORKFLOW_DELEGATION_SELF_DENIED' });
  if (input.scopeRole) {
    const users = await usersRepository.listUsers({});
    if (!users.some((item) => item.status === 'active' && item.role === input.scopeRole)) throw new AppError('Delegation role scope is unavailable.', 422, { code: 'WORKFLOW_DELEGATION_ROLE_INVALID' });
  }
  if (input.scopeDepartmentId) {
    const department = await departmentsRepository.findById(input.scopeDepartmentId);
    if (!department?.enabled) throw new AppError('Delegation department scope is unavailable.', 422, { code: 'WORKFLOW_DELEGATION_DEPARTMENT_INVALID' });
  }
  const startsAt = new Date(input.startsAt); const endsAt = new Date(input.endsAt);
  if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) throw new AppError('Delegation end must be after its start.', 422, { code: 'WORKFLOW_DELEGATION_PERIOD_INVALID' });
  const existing = await repository.listDelegations({});
  const overlapping = existing.filter((item) => item.status === 'active' && new Date(item.startsAt) <= endsAt && new Date(item.endsAt) >= startsAt);
  const edges = new Map();
  for (const item of overlapping) { edges.set(Number(item.delegatorUserId), Number(item.delegateUserId)); }
  edges.set(Number(delegator.id), Number(delegate.id));
  const visited = new Set();
  let cursor = Number(delegator.id);
  while (edges.has(cursor)) {
    if (visited.has(cursor)) throw new AppError('This delegation would create a delegation loop.', 409, { code: 'WORKFLOW_DELEGATION_LOOP' });
    visited.add(cursor); cursor = edges.get(cursor);
  }
  const id = await repository.createDelegation({ ...input, startsAt, endsAt, createdBy: user.id });
  await repository.appendAudit({ actorUserId: user.id, action: 'workflow.delegation.created', targetType: 'workflow_delegation', targetKey: String(id), result: 'allowed', reasonCode: 'WORKFLOW_DELEGATION_CREATED', metadata: { delegatorUserId: delegator.id, delegateUserId: delegate.id, workflowKey: input.workflowKey || '' } });
  return { delegationId: id };
}

async function cancel(id, user) {
  assertAdmin(user);
  if (!await repository.cancelDelegation(Number(id), user.id)) throw new AppError('Active delegation not found.', 404, { code: 'WORKFLOW_DELEGATION_NOT_FOUND' });
  await repository.appendAudit({ actorUserId: user.id, action: 'workflow.delegation.cancelled', targetType: 'workflow_delegation', targetKey: String(id), result: 'allowed', reasonCode: 'WORKFLOW_DELEGATION_CANCELLED' });
  return { delegationId: Number(id), status: 'cancelled' };
}

async function reassign(assignmentId, input, user) {
  assertAdmin(user);
  const replacement = await activeUser(input.replacementUserId);
  if (!replacement) throw new AppError('Replacement approver must be active.', 422, { code: 'WORKFLOW_REASSIGN_USER_INACTIVE' });
  const hash = crypto.createHash('sha256').update(JSON.stringify({ assignmentId, replacementUserId: replacement.id, reason: input.reason })).digest('hex');
  return repository.withTransaction(async (connection) => {
    const replay = await repository.findIdempotency('workflow.reassign', `user:${user.id}`, input.idempotencyKey, connection);
    if (replay) {
      if (replay.requestHash !== hash) throw new AppError('Idempotency key was already used for different reassignment input.', 409, { code: 'WORKFLOW_CONFLICT_IDEMPOTENCY_MISMATCH' });
      return replay.response;
    }
    const original = await repository.findAssignmentById(Number(assignmentId), connection, { forUpdate: true });
    if (!original || original.status !== 'pending' || original.stageStatus !== 'active' || original.requestStatus !== 'pending') throw new AppError('Only an active pending assignment can be reassigned.', 409, { code: 'WORKFLOW_REASSIGN_ASSIGNMENT_INACTIVE' });
    if (Number(original.approverUserId) === Number(replacement.id)) throw new AppError('Choose a different replacement approver.', 422, { code: 'WORKFLOW_REASSIGN_SAME_USER' });
    const moduleAccess = await permissions.userModulePermissions(original.sourceModuleKey, replacement);
    if (!moduleAccess.view) throw new AppError('Replacement approver cannot view the source record.', 422, { code: 'WORKFLOW_REASSIGN_SOURCE_VIEW_DENIED' });
    if (await repository.findAssignmentForApprover(original.instanceStageId, replacement.id, connection, { forUpdate: true })) throw new AppError('Replacement approver is already assigned to this stage.', 409, { code: 'WORKFLOW_REASSIGN_DUPLICATE' });
    await repository.transitionAssignment(original.id, original.lockVersion, { status: 'cancelled', decidedAt: new Date() }, connection);
    const [replacementId] = await repository.createAssignments(original.instanceStageId, [{ approverRuleId: original.approverRuleId,
      approverUserId: replacement.id, resolverType: 'reassignment', resolverReference: String(original.id),
      approverIdentity: { userId: replacement.id, staffId: replacement.staff_id || '', name: replacement.name, email: replacement.email, role: replacement.role },
      authorityEvaluation: { reassignedBy: user.id, originalAssignmentId: original.id, reason: input.reason }, status: 'pending', dueAt: original.dueAt }], connection);
    await repository.appendAssignmentTransfer({ instanceId: original.instanceId, instanceStageId: original.instanceStageId,
      originalAssignmentId: original.id, replacementAssignmentId: replacementId, transferType: 'reassignment',
      originalApproverUserId: original.approverUserId, replacementApproverUserId: replacement.id, reason: input.reason, transferredBy: user.id }, connection);
    const response = { requestKey: original.requestKey, assignmentId: replacementId, replacementUserId: replacement.id };
    await repository.appendEvent({ eventKey: `workflow-reassigned:${replacementId}`, eventType: 'workflow.assignment.reassigned', instanceId: original.instanceId, instanceStageId: original.instanceStageId,
      payload: { requestKey: original.requestKey, stageKey: original.stageKey, originalApproverUserId: original.approverUserId, replacementApproverUserId: replacement.id, actorId: user.id, reason: input.reason } }, connection);
    await repository.appendAudit({ workflowId: original.workflowId, instanceId: original.instanceId, instanceStageId: original.instanceStageId, actorUserId: user.id,
      action: 'workflow.assignment.reassigned', targetType: 'workflow_assignment', targetKey: String(original.id), result: 'allowed', reasonCode: 'WORKFLOW_ASSIGNMENT_REASSIGNED', metadata: response }, connection);
    await repository.storeIdempotency({ commandScope: 'workflow.reassign', actorUserId: user.id, actorKey: `user:${user.id}`, idempotencyKey: input.idempotencyKey,
      requestHash: hash, instanceId: original.instanceId, responseStatus: 200, response, expiresAt: new Date(Date.now() + 7 * 86400000) }, connection);
    return response;
  });
}

module.exports = { assertAdmin, list, create, cancel, reassign };
