const { AppError } = require('../../shared/errors');
const usersRepository = require('../users/users.repository');
const departmentsRepository = require('../departments/departments.repository');
const { evaluateCondition } = require('./workflows.conditions');
const workflowRepository = require('./workflows.repository');

function parseJson(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

function resolverError(message, code, details = {}) {
  return new AppError(message, 422, { code, ...details });
}

function publicIdentity(user) {
  return {
    userId: Number(user.id),
    staffId: user.staff_id || user.staffId || '',
    name: user.name || '',
    email: user.email || '',
    role: user.role || '',
    organizationNodeId: user.organization_node_id
      ? Number(user.organization_node_id)
      : (user.organizationNodeId ? Number(user.organizationNodeId) : null)
  };
}

function referenceValues(value) {
  const values = Array.isArray(value) ? value : [value];
  return values
    .flatMap((item) => typeof item === 'string' ? item.split(',') : [item])
    .map((item) => String(item ?? '').trim())
    .filter(Boolean);
}

function findReferencedUsers(users, value) {
  const references = new Set(referenceValues(value).map((item) => item.toLowerCase()));
  return users.filter((user) => references.has(String(user.id).toLowerCase())
    || references.has(String(user.email || '').toLowerCase())
    || references.has(String(user.staff_id || user.staffId || '').toLowerCase()));
}

function descendantNodeIds(nodes, rootId) {
  const result = new Set([Number(rootId)]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of nodes) {
      if (node.parentId && result.has(Number(node.parentId)) && !result.has(Number(node.id))) {
        result.add(Number(node.id));
        changed = true;
      }
    }
  }
  return result;
}

async function resolveRule(rule, context, dependencies = {}) {
  const userRepo = dependencies.usersRepository || usersRepository;
  const departmentRepo = dependencies.departmentsRepository || departmentsRepository;
  const activeUsers = context.activeUsers;
  const reference = String(rule.resolverReference || '').trim();
  const config = rule.resolverConfig || {};
  let users = [];

  if (rule.resolverType === 'user') {
    users = findReferencedUsers(activeUsers, reference);
  } else if (rule.resolverType === 'role') {
    users = activeUsers.filter((user) => String(user.role) === reference);
  } else if (rule.resolverType === 'reporting_manager') {
    const requester = activeUsers.find((user) => Number(user.id) === Number(context.requesterUserId));
    if (!requester) {
      throw resolverError('Unable to resolve approver: requester is not an active user.', 'WORKFLOW_APPROVER_REQUESTER_INACTIVE', {
        stageKey: context.stageKey,
        ruleKey: rule.ruleKey
      });
    }
    const managerFieldKey = String(config.requesterFieldKey || reference || 'reporting_manager_user_id');
    const requesterFields = parseJson(requester.custom_fields || requester.customFields);
    users = findReferencedUsers(activeUsers, requesterFields[managerFieldKey]);
  } else if (rule.resolverType === 'organization_responsibility') {
    const rootId = Number(reference || config.organizationNodeId);
    const root = rootId ? await departmentRepo.findById(rootId) : null;
    if (!root || !root.enabled) {
      throw resolverError('Unable to resolve approver: organization responsibility is not available.', 'WORKFLOW_APPROVER_ORGANIZATION_INVALID', {
        stageKey: context.stageKey,
        ruleKey: rule.ruleKey
      });
    }
    const nodeIds = config.includeDescendants
      ? descendantNodeIds(await departmentRepo.listNodes(), rootId)
      : new Set([rootId]);
    users = activeUsers.filter((user) => nodeIds.has(Number(user.organization_node_id || user.organizationNodeId))
      && (!config.role || String(user.role) === String(config.role)));
  } else if (rule.resolverType === 'record_user_field') {
    users = findReferencedUsers(activeUsers, context.snapshot?.[reference]);
  } else {
    throw resolverError('Unable to resolve approver: resolver type is unsupported.', 'WORKFLOW_APPROVER_TYPE_UNSUPPORTED', {
      stageKey: context.stageKey,
      ruleKey: rule.ruleKey,
      resolverType: rule.resolverType
    });
  }

  const unique = [...new Map(users.map((user) => [Number(user.id), user])).values()];
  if (!unique.length) {
    throw resolverError(`Unable to submit: ${context.stageName} has no eligible approver. Contact the workflow administrator.`, 'WORKFLOW_APPROVER_NONE_ELIGIBLE', {
      stageKey: context.stageKey,
      ruleKey: rule.ruleKey,
      resolverType: rule.resolverType
    });
  }
  return unique.map((user) => ({
    ...publicIdentity(user),
    ruleKey: rule.ruleKey,
    resolverType: rule.resolverType,
    resolverReference: reference
  }));
}

async function resolveStageApprovers(input, dependencies = {}) {
  const stage = input.stage || {};
  const userRepo = dependencies.usersRepository || usersRepository;
  const activeUsers = (await userRepo.listUsers({})).filter((user) => user.status === 'active');
  const context = {
    activeUsers,
    requesterUserId: Number(input.requesterUserId),
    snapshot: input.snapshot || {},
    stageKey: stage.stageKey || '',
    stageName: stage.name || stage.stageKey || 'Approval stage'
  };
  const resolved = [];
  for (const rule of stage.approverRules || []) {
    if (!evaluateCondition(rule.authorityCondition, context.snapshot, `stages.${context.stageKey}.approverRules.${rule.ruleKey}.authorityCondition`).matched) {
      continue;
    }
    resolved.push(...await resolveRule(rule, context, dependencies));
  }
  const directApprovers = [...new Map(resolved.map((approver) => [approver.userId, approver])).values()];
  const workflowRepo = dependencies.workflowRepository || workflowRepository;
  const effective = [];
  for (const approver of directApprovers) {
    const delegation = input.workflowKey
      ? await workflowRepo.findActiveDelegation({ id: approver.userId, role: approver.role, organizationNodeId: approver.organizationNodeId }, input.workflowKey, dependencies.now || new Date())
      : null;
    if (!delegation) { effective.push(approver); continue; }
    const delegate = publicIdentity(delegation.delegate);
    effective.push({ ...approver, ...delegate, userId: delegate.userId, originalApprover: approver,
      delegationId: delegation.id, delegationReason: delegation.reason });
  }
  const approvers = [...new Map(effective.map((approver) => [approver.userId, approver])).values()];
  if (!approvers.length) {
    throw resolverError(`Unable to submit: ${context.stageName} has no eligible approver. Contact the workflow administrator.`, 'WORKFLOW_APPROVER_NONE_ELIGIBLE', {
      stageKey: context.stageKey
    });
  }

  const requesterAssignment = approvers.find((approver) => approver.userId === context.requesterUserId);
  const autoApproveUserIds = requesterAssignment && stage.selfApprovalPolicy === 'auto_approve'
    ? [context.requesterUserId]
    : [];
  if (requesterAssignment && stage.selfApprovalPolicy !== 'auto_approve') {
    throw resolverError(`Unable to submit: ${context.stageName} resolves to the requester and self-approval is disabled.`, 'WORKFLOW_APPROVER_SELF_APPROVAL_BLOCKED', {
      stageKey: context.stageKey,
      requesterUserId: context.requesterUserId
    });
  }

  return {
    stageKey: context.stageKey,
    approvalMode: 'all',
    approvers,
    autoApproveUserIds,
    stageAutoApproved: approvers.length === 1 && autoApproveUserIds.length === 1
  };
}

module.exports = {
  descendantNodeIds,
  findReferencedUsers,
  resolveRule,
  resolveStageApprovers
};
