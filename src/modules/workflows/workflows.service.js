const { AppError } = require('../../shared/errors');
const repository = require('./workflows.repository');
const moduleRepository = require('../sysadmin/module-config.repository');
const usersRepository = require('../users/users.repository');
const departmentsRepository = require('../departments/departments.repository');
const { assertConfigurationAdmin } = require('./workflows.access');

const keyPattern = /^[a-z][a-z0-9_]{1,79}$/;
const requestPrefixPattern = /^[A-Z][A-Z0-9]{1,19}$/;
const conditionGroups = new Set(['all', 'any']);
const conditionOperators = new Set([
  'equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with',
  'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal',
  'is_empty', 'is_not_empty', 'in', 'not_in'
]);
const approverTypes = new Set([
  'user', 'role', 'reporting_manager', 'organization_responsibility', 'record_user_field'
]);
const attachmentModes = new Set(['disabled', 'optional', 'required']);
const safeAttachmentTypes = new Set([
  'application/pdf', 'image/jpeg', 'image/png', 'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]);
const selfApprovalPolicies = new Set(['error', 'auto_approve']);
const approvalModes = new Set(['all', 'any', 'quorum']);
const allowedEvents = new Set([
  'workflow.submitted', 'workflow.stage.started', 'workflow.stage.skipped',
  'workflow.stage.auto_approved', 'workflow.stage.approved', 'workflow.approved', 'workflow.rejected',
  'workflow.returned', 'workflow.resubmitted', 'workflow.withdrawn',
  'workflow.cancelled', 'workflow.reminder_due', 'workflow.escalated', 'workflow.completed'
  , 'workflow.assignment.delegated', 'workflow.assignment.reassigned'
]);
const allowedEventFields = new Set([
  'workflowKey', 'requestKey', 'sourceModuleKey', 'sourceRecordId', 'requestStatus',
  'stageKey', 'stageStatus', 'actorId', 'decision', 'remark', 'snapshotRevision',
  'submittedAt', 'completedAt', 'connectionKey', 'outcome'
]);

function slugKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

function requestPrefixFromKey(workflowKey) {
  return String(workflowKey || '').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 20);
}

async function nextAvailableRequestPrefix(workflowKey) {
  const base = requestPrefixFromKey(workflowKey) || 'WORKFLOW';
  const used = new Set((await repository.listDefinitions({})).map((definition) => definition.requestPrefix));
  if (!used.has(base)) return base;
  for (let suffix = 2; suffix < 10000; suffix += 1) {
    const text = String(suffix);
    const candidate = `${base.slice(0, 20 - text.length)}${text}`;
    if (!used.has(candidate)) return candidate;
  }
  throw workflowError('Unable to allocate a unique workflow request prefix', 409, 'WORKFLOW_CONFIG_REQUEST_PREFIX_CONFLICT');
}

function errorFinding(code, path, message, remediation) {
  return { code, severity: 'error', path, message, remediation };
}

function warningFinding(code, path, message, remediation) {
  return { code, severity: 'warning', path, message, remediation };
}

function normalizeApproverRule(rule = {}, index = 0) {
  return {
    ruleKey: String(rule.ruleKey || `approver_${index + 1}`).trim(),
    order: Number.isInteger(Number(rule.order)) ? Number(rule.order) : index,
    resolverType: String(rule.resolverType || '').trim(),
    resolverReference: String(rule.resolverReference || '').trim(),
    resolverConfig: rule.resolverConfig && typeof rule.resolverConfig === 'object' ? rule.resolverConfig : {},
    authorityCondition: rule.authorityCondition || null
  };
}

function normalizeAttachmentPolicy(policy = {}) {
  return {
    mode: String(policy.mode || 'disabled').trim().toLowerCase(),
    allowedTypes: Array.isArray(policy.allowedTypes)
      ? [...new Set(policy.allowedTypes.map((value) => String(value).trim().toLowerCase()).filter(Boolean))]
      : [],
    maxFileSize: Number(policy.maxFileSize || 0),
    maxFileCount: Number(policy.maxFileCount || 0),
    actions: Array.isArray(policy.actions)
      ? [...new Set(policy.actions.map((value) => String(value).trim().toLowerCase()).filter(Boolean))]
      : [],
    malwareScanRequired: Boolean(policy.malwareScanRequired)
  };
}

function normalizeStage(stage = {}, index = 0) {
  return {
    stageKey: String(stage.stageKey || `stage_${index + 1}`).trim(),
    name: String(stage.name || `Approval Stage ${index + 1}`).trim(),
    order: Number.isInteger(Number(stage.order)) ? Number(stage.order) : index,
    enabled: stage.enabled !== false,
    condition: stage.condition || null,
    skipWhenConditionFalse: Boolean(stage.skipWhenConditionFalse),
    approvalMode: String(stage.approvalMode || 'all'),
    selfApprovalPolicy: String(stage.selfApprovalPolicy || 'error'),
    approverRules: (stage.approverRules || []).map(normalizeApproverRule),
    decisionPolicy: {
      approvalRemark: stage.decisionPolicy?.approvalRemark === 'required' ? 'required' : 'optional',
      rejectionRemark: 'required',
      returnRemark: 'required',
      quorum: Math.max(1, Number(stage.decisionPolicy?.quorum || stage.quorum || 1))
    },
    attachmentPolicy: normalizeAttachmentPolicy(stage.attachmentPolicy),
    slaPolicy: {
      enabled: Boolean(stage.slaPolicy?.enabled),
      duration: Number(stage.slaPolicy?.duration || 0),
      unit: stage.slaPolicy?.unit || 'hours',
      reminderOffsets: Array.isArray(stage.slaPolicy?.reminderOffsets)
        ? stage.slaPolicy.reminderOffsets.map(Number)
        : [],
      escalationMode: ['none', 'notify'].includes(stage.slaPolicy?.escalationMode) ? stage.slaPolicy.escalationMode : 'notify',
      escalationApproverRule: stage.slaPolicy?.escalationApproverRule || null,
      recurringOverdueReminder: {
        enabled: Boolean(stage.slaPolicy?.recurringOverdueReminder?.enabled),
        every: Math.max(1, Number(stage.slaPolicy?.recurringOverdueReminder?.every || 1)),
        unit: ['minutes', 'hours', 'days'].includes(stage.slaPolicy?.recurringOverdueReminder?.unit) ? stage.slaPolicy.recurringOverdueReminder.unit : 'hours',
        maxOccurrences: Math.min(100, Math.max(1, Number(stage.slaPolicy?.recurringOverdueReminder?.maxOccurrences || 3)))
      },
      businessCalendar: {
        enabled: Boolean(stage.slaPolicy?.businessCalendar?.enabled),
        weekdays: Array.isArray(stage.slaPolicy?.businessCalendar?.weekdays) ? stage.slaPolicy.businessCalendar.weekdays.map(Number) : [1, 2, 3, 4, 5],
        startTime: String(stage.slaPolicy?.businessCalendar?.startTime || '09:00'),
        endTime: String(stage.slaPolicy?.businessCalendar?.endTime || '17:00'),
        holidays: Array.isArray(stage.slaPolicy?.businessCalendar?.holidays) ? stage.slaPolicy.businessCalendar.holidays.map(String) : []
      }
    },
    emailPolicy: {
      enabled: Boolean(stage.emailPolicy?.enabled),
      events: Array.isArray(stage.emailPolicy?.events) ? [...new Set(stage.emailPolicy.events.map(String).filter(Boolean))] : ['workflow.stage.started', 'workflow.reminder_due', 'workflow.escalated'],
      subject: String(stage.emailPolicy?.subject || '{{workflowName}} · {{requestId}}').trim().slice(0, 190),
      message: String(stage.emailPolicy?.message || 'Action is required for {{requestId}} at {{stageName}}.').trim().slice(0, 5000)
    },
    eventPolicy: {
      events: Array.isArray(stage.eventPolicy?.events) ? stage.eventPolicy.events : [],
      payloadFields: Array.isArray(stage.eventPolicy?.payloadFields) ? stage.eventPolicy.payloadFields : []
    }
  };
}

function normalizeConfig(input = {}) {
  return {
    trigger: {
      type: input.trigger?.type || 'manual_submit',
      actionKey: String(input.trigger?.actionKey || '').trim(),
      requiredPermission: String(input.trigger?.requiredPermission || 'workflow.submit').trim()
    },
    entryCondition: input.entryCondition || null,
    recordPolicy: {
      lockScope: input.recordPolicy?.lockScope === 'fields' ? 'fields' : 'record',
      lockedFields: Array.isArray(input.recordPolicy?.lockedFields) ? input.recordPolicy.lockedFields : [],
      snapshotFields: Array.isArray(input.recordPolicy?.snapshotFields) ? input.recordPolicy.snapshotFields : [],
      allowAuthorizedCancel: input.recordPolicy?.allowAuthorizedCancel !== false
    },
    stages: (input.stages || []).map(normalizeStage),
    builderGraph: input.builderGraph && typeof input.builderGraph === 'object'
      ? {
          nodes: Array.isArray(input.builderGraph.nodes) ? input.builderGraph.nodes.map((node) => ({
            ...node,
            ...(node.type === 'start' ? { attachmentPolicy: normalizeAttachmentPolicy(node.attachmentPolicy) } : {}),
            ...(node.presentation && typeof node.presentation === 'object' ? {
              presentation: {
                formKey: String(node.presentation.formKey || '').trim(),
                formName: String(node.presentation.formName || '').trim().slice(0, 160),
                inheritDefault: Boolean(node.presentation.inheritDefault),
                mode: ['request', 'review', 'result'].includes(node.presentation.mode) ? node.presentation.mode : (node.type === 'start' ? 'request' : node.type === 'approval' ? 'review' : 'result'),
                fieldKeys: Array.isArray(node.presentation.fieldKeys) ? [...new Set(node.presentation.fieldKeys.map(String).filter(Boolean))] : []
              }
            } : {}),
            ...(node.responsePresentation && typeof node.responsePresentation === 'object' ? {
              responsePresentation: {
                formKey: String(node.responsePresentation.formKey || '').trim(),
                formName: String(node.responsePresentation.formName || '').trim().slice(0, 160),
                fields: Array.isArray(node.responsePresentation.fields) ? node.responsePresentation.fields.map((field) => ({
                  fieldKey: String(field.fieldKey || '').trim(),
                  label: String(field.label || field.fieldKey || '').trim().slice(0, 160),
                  type: String(field.type || 'textbox').trim(),
                  options: Array.isArray(field.options) ? field.options.slice(0, 200) : [],
                  required: Boolean(field.required),
                  storage: ['source', 'detail'].includes(field.storage) ? field.storage : 'decision',
                  targetFieldKey: String(field.targetFieldKey || field.fieldKey || '').trim(),
                  exposeToAutomation: Boolean(field.exposeToAutomation)
                })).filter((field) => field.fieldKey) : []
              }
            } : {})
          })) : [],
          edges: Array.isArray(input.builderGraph.edges) ? input.builderGraph.edges.map((edge, index) => ({
            id: String(edge.id || `edge_${index + 1}`).trim().slice(0, 160),
            from: String(edge.from || '').trim().slice(0, 160),
            to: String(edge.to || '').trim().slice(0, 160),
            label: String(edge.label || '').trim().slice(0, 160),
            outcome: String(edge.outcome || 'continue').trim().toLowerCase(),
            ...(['condition_met', 'condition_not_met'].includes(edge.outcome) && edge.condition ? { condition: edge.condition } : {})
          })) : []
        }
      : { nodes: [], edges: [] },
    eventPolicy: {
      events: Array.isArray(input.eventPolicy?.events) ? input.eventPolicy.events : [],
      payloadFields: Array.isArray(input.eventPolicy?.payloadFields) ? input.eventPolicy.payloadFields : []
    }
  };
}

function configurationSnapshot(definition) {
  return {
    schemaVersion: definition.schemaVersion,
    workflowKey: definition.workflowKey,
    requestPrefix: definition.requestPrefix,
    name: definition.name,
    description: definition.description,
    sourceModuleKey: definition.sourceModuleKey,
    requestFormKey: definition.requestFormKey,
    requestFormVersion: definition.requestFormVersion,
    ...definition.draftConfig
  };
}

function workflowError(message, statusCode, code, extra = {}) {
  return new AppError(message, statusCode, { code, ...extra });
}

function fieldKeys(fields) {
  const keys = new Set();
  for (const field of fields) {
    if (field.fieldKey || field.field_key) keys.add(field.fieldKey || field.field_key);
    if (field.dataKey || field.data_key) keys.add(field.dataKey || field.data_key);
  }
  return keys;
}

function validateCondition(condition, path, availableFieldKeys, findings) {
  if (!condition) return;
  if (!condition || typeof condition !== 'object' || Array.isArray(condition)) {
    findings.push(errorFinding('WORKFLOW_CONFIG_CONDITION_INVALID', path, 'Condition must be a structured object.', 'Use a structured all/any condition group.'));
    return;
  }
  if (condition.group !== undefined || Array.isArray(condition.rules)) {
    if (!conditionGroups.has(condition.group)) {
      findings.push(errorFinding('WORKFLOW_CONFIG_CONDITION_GROUP_INVALID', `${path}.group`, 'Condition group must be all or any.', 'Select an allowlisted condition group.'));
    }
    if (!Array.isArray(condition.rules) || !condition.rules.length) {
      findings.push(errorFinding('WORKFLOW_CONFIG_CONDITION_RULES_REQUIRED', `${path}.rules`, 'Condition group needs at least one rule.', 'Add a field rule or remove the condition.'));
      return;
    }
    condition.rules.forEach((rule, index) => validateCondition(rule, `${path}.rules[${index}]`, availableFieldKeys, findings));
    return;
  }
  const fieldKey = String(condition.fieldKey || '').trim();
  const operator = String(condition.operator || '').trim();
  if (!fieldKey || !availableFieldKeys.has(fieldKey)) {
    findings.push(errorFinding('WORKFLOW_CONFIG_CONDITION_FIELD_INVALID', `${path}.fieldKey`, `Condition field ${fieldKey || '(empty)'} is not available.`, 'Select a stable field data key from the source module.'));
  }
  if (!conditionOperators.has(operator)) {
    findings.push(errorFinding('WORKFLOW_CONFIG_CONDITION_OPERATOR_INVALID', `${path}.operator`, `Condition operator ${operator || '(empty)'} is unsupported.`, 'Select an allowlisted typed operator.'));
  }
  if (!['is_empty', 'is_not_empty'].includes(operator) && condition.value === undefined) {
    findings.push(errorFinding('WORKFLOW_CONFIG_CONDITION_VALUE_REQUIRED', `${path}.value`, 'Condition value is required.', 'Enter a typed comparison value.'));
  }
}

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])]));
}

function validateAttachmentPolicy(policy = {}, path, findings, allowedActions) {
  const mode = policy.mode || 'disabled';
  if (!attachmentModes.has(mode)) findings.push(errorFinding('WORKFLOW_CONFIG_ATTACHMENT_MODE_INVALID', `${path}.mode`, 'Attachment mode is invalid.', 'Select disabled, optional, or required.'));
  if (mode !== 'disabled') {
    const maxFileSize = Number(policy.maxFileSize || 0);
    const maxFileCount = Number(policy.maxFileCount || 0);
    if (maxFileSize <= 0 || maxFileSize > 25 * 1024 * 1024) findings.push(errorFinding('WORKFLOW_CONFIG_ATTACHMENT_SIZE_INVALID', `${path}.maxFileSize`, 'Attachment size must be between 1 byte and 25 MB.', 'Set an allowed maximum file size.'));
    if (maxFileCount < 1 || maxFileCount > 20) findings.push(errorFinding('WORKFLOW_CONFIG_ATTACHMENT_COUNT_INVALID', `${path}.maxFileCount`, 'Attachment count must be between 1 and 20.', 'Set an allowed maximum file count.'));
    if (!Array.isArray(policy.allowedTypes) || !policy.allowedTypes.length) findings.push(errorFinding('WORKFLOW_CONFIG_ATTACHMENT_TYPES_REQUIRED', `${path}.allowedTypes`, 'Enabled attachments need at least one allowed file type.', 'Select one or more supported file types.'));
    for (const [index, contentType] of (policy.allowedTypes || []).entries()) {
      if (!safeAttachmentTypes.has(contentType)) findings.push(errorFinding('WORKFLOW_CONFIG_ATTACHMENT_TYPE_UNSAFE', `${path}.allowedTypes[${index}]`, `File type ${contentType} is unsupported.`, 'Use PDF, JPEG, PNG, plain text, DOCX, or XLSX.'));
    }
    const actionSet = new Set(allowedActions || []);
    if (!Array.isArray(policy.actions) || !policy.actions.length) findings.push(errorFinding('WORKFLOW_CONFIG_ATTACHMENT_ACTION_REQUIRED', `${path}.actions`, 'Enabled attachments must apply to at least one action.', 'Select an attachment action.'));
    for (const [index, action] of (policy.actions || []).entries()) {
      if (!actionSet.has(action)) findings.push(errorFinding('WORKFLOW_CONFIG_ATTACHMENT_ACTION_INVALID', `${path}.actions[${index}]`, `Attachment action ${action} is unsupported here.`, 'Select an action supported by this node.'));
    }
  }
}

function validateBuilderGraph(config, availableFieldKeys, findings) {
  const graph = config.builderGraph;
  if (!graph?.nodes?.length) return;
  const nodeIds = new Set();
  const nodes = new Map();
  const starts = graph.nodes.filter((node) => node.type === 'start');
  const ends = graph.nodes.filter((node) => node.type === 'end');
  if (starts.length !== 1) findings.push(errorFinding('WORKFLOW_CONFIG_ROUTE_START_INVALID', 'builderGraph.nodes', 'Executable routes require exactly one Start node.', 'Keep one Start node and remove any duplicates.'));
  if (!ends.length) findings.push(errorFinding('WORKFLOW_CONFIG_ROUTE_END_REQUIRED', 'builderGraph.nodes', 'Executable routes require at least one End node.', 'Add and connect an End node.'));
  for (const [index, node] of graph.nodes.entries()) {
    const path = `builderGraph.nodes[${index}]`;
    if (!node.id || nodeIds.has(node.id)) findings.push(errorFinding('WORKFLOW_CONFIG_ROUTE_NODE_ID_INVALID', `${path}.id`, 'Route node IDs must be present and unique.', 'Remove the duplicate node and add it again.'));
    nodeIds.add(node.id);
    nodes.set(node.id, node);
    if (!['start', 'approval', 'end'].includes(node.type)) findings.push(errorFinding('WORKFLOW_CONFIG_ROUTE_NODE_TYPE_INVALID', `${path}.type`, `Node type ${node.type || '(empty)'} is unsupported.`, 'Use Start, Approval, or End nodes.'));
    if (node.type === 'start') validateAttachmentPolicy(node.attachmentPolicy, `${path}.attachmentPolicy`, findings, ['submission']);
  }
  const stageKeys = new Set(config.stages.filter((stage) => stage.enabled !== false).map((stage) => stage.stageKey));
  const graphStageKeys = new Set();
  for (const [index, node] of graph.nodes.entries()) {
    if (node.type !== 'approval') continue;
    if (!stageKeys.has(node.stageKey) || graphStageKeys.has(node.stageKey)) findings.push(errorFinding('WORKFLOW_CONFIG_ROUTE_STAGE_INVALID', `builderGraph.nodes[${index}].stageKey`, `Approval node stage ${node.stageKey || '(empty)'} is missing, disabled, or duplicated.`, 'Use one Approval node for every enabled stage.'));
    graphStageKeys.add(node.stageKey);
  }
  for (const stageKey of stageKeys) if (!graphStageKeys.has(stageKey)) findings.push(errorFinding('WORKFLOW_CONFIG_ROUTE_STAGE_MISSING', 'builderGraph.nodes', `Enabled stage ${stageKey} is not present on the route.`, 'Add its Approval node to the canvas.'));

  const edgeIds = new Set();
  for (const [index, edge] of graph.edges.entries()) {
    const path = `builderGraph.edges[${index}]`;
    if (!edge.id || edgeIds.has(edge.id)) findings.push(errorFinding('WORKFLOW_CONFIG_ROUTE_EDGE_ID_INVALID', `${path}.id`, 'Connection IDs must be present and unique.', 'Remove the duplicate connection and reconnect the nodes.'));
    edgeIds.add(edge.id);
    if (!nodes.has(edge.from) || !nodes.has(edge.to) || edge.from === edge.to) findings.push(errorFinding('WORKFLOW_CONFIG_ROUTE_EDGE_TARGET_INVALID', path, 'Connections must link two different existing nodes.', 'Reconnect the line between valid nodes.'));
    if (nodes.get(edge.from)?.type === 'end') findings.push(errorFinding('WORKFLOW_CONFIG_ROUTE_END_OUTGOING', path, 'End nodes cannot have outgoing connections.', 'Remove the connection leaving the End node.'));
    if (nodes.get(edge.to)?.type === 'start') findings.push(errorFinding('WORKFLOW_CONFIG_ROUTE_START_INCOMING', path, 'Start nodes cannot have incoming connections.', 'Remove the connection entering the Start node.'));
    if (['condition_met', 'condition_not_met'].includes(edge.outcome)) validateCondition(edge.condition, `${path}.condition`, availableFieldKeys, findings);
  }

  for (const node of graph.nodes.filter((item) => item.type !== 'end')) {
    const outgoing = graph.edges.filter((edge) => edge.from === node.id);
    if (!outgoing.length) findings.push(errorFinding('WORKFLOW_CONFIG_ROUTE_OUTGOING_REQUIRED', `builderGraph.nodes.${node.id}`, `Node ${node.id} has no outgoing connection.`, 'Connect it to an Approval or End node.'));
    if (outgoing.length > 1) {
      const outcomes = outgoing.map((edge) => edge.outcome).sort();
      const paired = outgoing.length === 2 && outcomes[0] === 'condition_met' && outcomes[1] === 'condition_not_met';
      const conditionsMatch = paired && JSON.stringify(canonicalValue(outgoing[0].condition)) === JSON.stringify(canonicalValue(outgoing[1].condition));
      if (!paired || !conditionsMatch) findings.push(errorFinding('WORKFLOW_CONFIG_ROUTE_BRANCH_AMBIGUOUS', `builderGraph.nodes.${node.id}`, `Node ${node.id} has routes that are not an exclusive condition pair.`, 'Use one route, or one Condition met and one Condition not met route with the same rules.'));
    } else if (outgoing[0] && ['condition_met', 'condition_not_met'].includes(outgoing[0].outcome)) {
      findings.push(errorFinding('WORKFLOW_CONFIG_ROUTE_BRANCH_INCOMPLETE', `builderGraph.nodes.${node.id}`, `Node ${node.id} has no opposite condition route.`, 'Add the matching Condition met or Condition not met connection.'));
    }
  }

  if (starts.length === 1) {
    const visited = new Set();
    const visiting = new Set();
    let cycle = false;
    const walk = (nodeId) => {
      if (visiting.has(nodeId)) { cycle = true; return; }
      if (visited.has(nodeId)) return;
      visiting.add(nodeId);
      for (const edge of graph.edges.filter((item) => item.from === nodeId)) walk(edge.to);
      visiting.delete(nodeId);
      visited.add(nodeId);
    };
    walk(starts[0].id);
    if (cycle) findings.push(errorFinding('WORKFLOW_CONFIG_ROUTE_CYCLE', 'builderGraph', 'Executable approval routes cannot contain cycles.', 'Remove the connection that loops to an earlier node.'));
    for (const node of graph.nodes) if (!visited.has(node.id)) findings.push(errorFinding('WORKFLOW_CONFIG_ROUTE_NODE_UNREACHABLE', `builderGraph.nodes.${node.id}`, `Node ${node.id} cannot be reached from Start.`, 'Connect it to the executable route or remove it.'));
  }
}

async function validateConfiguration(definition) {
  const findings = [];
  if (!keyPattern.test(definition.workflowKey)) {
    findings.push(errorFinding('WORKFLOW_CONFIG_KEY_INVALID', 'workflowKey', 'Workflow key must start with a letter and contain only lowercase letters, numbers, and underscores.', 'Choose a stable key such as leave_approval.'));
  }
  if (!String(definition.name || '').trim()) {
    findings.push(errorFinding('WORKFLOW_CONFIG_NAME_REQUIRED', 'name', 'Workflow name is required.', 'Enter a user-facing workflow name.'));
  }
  if (!requestPrefixPattern.test(String(definition.requestPrefix || ''))) {
    findings.push(errorFinding('WORKFLOW_CONFIG_REQUEST_PREFIX_INVALID', 'requestPrefix', 'Request prefix must contain 2 to 20 uppercase letters or numbers and start with a letter.', 'Choose a prefix such as LEAVE or PURCHASE.'));
  }

  const sourceModule = await moduleRepository.findModuleByKey(definition.sourceModuleKey);
  const sourceStatus = sourceModule?.module_status || (sourceModule?.is_enabled ? 'published' : 'archived');
  if (!sourceModule || sourceStatus !== 'published') {
    findings.push(errorFinding('WORKFLOW_CONFIG_SOURCE_MODULE_UNPUBLISHED', 'sourceModuleKey', 'Source module must exist and be published.', 'Publish the source module or select another module.'));
  }
  const fields = sourceModule ? await moduleRepository.listFields(definition.sourceModuleKey) : [];
  const availableFields = fieldKeys(fields);
  const layouts = sourceModule ? await moduleRepository.listFormLayouts(definition.sourceModuleKey) : [];
  const requestStandaloneForm = definition.requestFormKey && !layouts.some((layout) => layout.state === 'published' && layout.formType === definition.requestFormKey)
    ? await moduleRepository.findStandaloneForm(definition.requestFormKey)
    : null;
  if (definition.requestFormKey && !layouts.some((layout) => layout.state === 'published' && layout.formType === definition.requestFormKey) && !requestStandaloneForm) {
    findings.push(errorFinding('WORKFLOW_CONFIG_FORM_UNPUBLISHED', 'requestFormKey', 'Referenced request form layout is not published.', 'Publish the matching Form Builder layout.'));
  }
  if (definition.requestFormVersion !== null && definition.requestFormVersion !== undefined && Number(definition.requestFormVersion) < 1) {
    findings.push(errorFinding('WORKFLOW_CONFIG_FORM_VERSION_INVALID', 'requestFormVersion', 'Request form version must be a positive number.', 'Select a valid Form Builder configuration version.'));
  }

  for (const [nodeIndex, node] of (definition.draftConfig?.builderGraph?.nodes || []).entries()) {
    if (!node.presentation) continue;
    const nodePath = `builderGraph.nodes[${nodeIndex}].presentation`;
    const formKey = node.presentation.formKey;
    const moduleLayout = !formKey || layouts.some((layout) => layout.state === 'published' && layout.formType === formKey);
    const standaloneForm = formKey && !moduleLayout ? await moduleRepository.findStandaloneForm(formKey) : null;
    if (formKey && !moduleLayout && !standaloneForm) {
      findings.push(errorFinding('WORKFLOW_CONFIG_NODE_FORM_UNAVAILABLE', `${nodePath}.formKey`, 'The selected node form is not available.', 'Select an available published form from the node inspector.'));
    }
    for (const fieldKey of node.presentation.fieldKeys || []) {
      if (!availableFields.has(fieldKey)) findings.push(errorFinding('WORKFLOW_CONFIG_NODE_FORM_FIELD_INVALID', `${nodePath}.fieldKeys`, `Node form field ${fieldKey} does not exist in the source module.`, 'Select a form whose fields belong to the workflow source module.'));
    }
    if (node.responsePresentation) {
      const responsePath = `builderGraph.nodes[${nodeIndex}].responsePresentation`;
      const responseFormKey = node.responsePresentation.formKey;
      const responseModuleLayout = !responseFormKey || layouts.some((layout) => layout.state === 'published' && layout.formType === responseFormKey);
      const responseStandaloneForm = responseFormKey && !responseModuleLayout ? await moduleRepository.findStandaloneForm(responseFormKey) : null;
      if (node.type !== 'approval') findings.push(errorFinding('WORKFLOW_CONFIG_RESPONSE_FORM_NODE_INVALID', responsePath, 'Response forms can only be attached to Approval nodes.', 'Remove the response form or attach it to an Approval node.'));
      if (responseFormKey && !responseModuleLayout && !responseStandaloneForm) findings.push(errorFinding('WORKFLOW_CONFIG_RESPONSE_FORM_UNAVAILABLE', `${responsePath}.formKey`, 'The selected response form is not available.', 'Select an available response form from the Approval node inspector.'));
      const responseKeys = new Set();
      for (const field of node.responsePresentation.fields || []) {
        if (!availableFields.has(field.fieldKey) || responseKeys.has(field.fieldKey)) findings.push(errorFinding('WORKFLOW_CONFIG_RESPONSE_FIELD_INVALID', `${responsePath}.fields`, `Response field ${field.fieldKey} is unavailable or duplicated.`, 'Choose unique fields from a compatible source-module form.'));
        responseKeys.add(field.fieldKey);
        if (field.storage === 'source' && !fields.some((sourceField) => sourceField.fieldKey === field.targetFieldKey && sourceField.tableType !== 'detail')) findings.push(errorFinding('WORKFLOW_CONFIG_RESPONSE_MAPPING_INVALID', `${responsePath}.fields.${field.fieldKey}.targetFieldKey`, `Mapped source field ${field.targetFieldKey} does not exist or is not a main field.`, 'Choose an existing main source-module field.'));
        if (field.storage === 'detail' && !fields.some((sourceField) => sourceField.fieldKey === field.targetFieldKey && sourceField.tableType === 'detail' && sourceField.detailTableName)) findings.push(errorFinding('WORKFLOW_CONFIG_RESPONSE_DETAIL_MAPPING_INVALID', `${responsePath}.fields.${field.fieldKey}.targetFieldKey`, `Mapped detail field ${field.targetFieldKey} is unavailable.`, 'Choose an existing detail-table field.'));
      }
    }
  }

  const config = definition.draftConfig;
  validateBuilderGraph(config, availableFields, findings);
  if (!['manual_submit', 'module_action'].includes(config.trigger.type)) {
    findings.push(errorFinding('WORKFLOW_CONFIG_TRIGGER_INVALID', 'trigger.type', 'Trigger must be manual_submit or module_action.', 'Select an initial supported trigger.'));
  }
  if (config.trigger.type === 'module_action' && !config.trigger.actionKey) {
    findings.push(errorFinding('WORKFLOW_CONFIG_TRIGGER_ACTION_REQUIRED', 'trigger.actionKey', 'Module action trigger needs an action key.', 'Select a configured module action.'));
  }
  validateCondition(config.entryCondition, 'entryCondition', availableFields, findings);

  for (const [index, fieldKey] of config.recordPolicy.lockedFields.entries()) {
    if (!availableFields.has(fieldKey)) {
      findings.push(errorFinding('WORKFLOW_CONFIG_LOCK_FIELD_INVALID', `recordPolicy.lockedFields[${index}]`, `Lock field ${fieldKey} does not exist.`, 'Select a source-module field data key.'));
    }
  }
  for (const [index, fieldKey] of config.recordPolicy.snapshotFields.entries()) {
    if (!availableFields.has(fieldKey)) {
      findings.push(errorFinding('WORKFLOW_CONFIG_SNAPSHOT_FIELD_INVALID', `recordPolicy.snapshotFields[${index}]`, `Snapshot field ${fieldKey} does not exist.`, 'Select a source-module field data key.'));
    }
  }

  const enabledStages = config.stages.filter((stage) => stage.enabled);
  if (!enabledStages.length) {
    findings.push(errorFinding('WORKFLOW_CONFIG_STAGE_REQUIRED', 'stages', 'Workflow needs at least one enabled approval stage.', 'Add and enable an approval stage.'));
  }
  const stageKeys = new Set();
  const stageOrders = new Set();
  const users = await usersRepository.listUsers({});
  const activeUsers = users.filter((user) => user.status === 'active');
  const activeRoles = new Set(activeUsers.map((user) => user.role));

  for (const [stageIndex, stage] of config.stages.entries()) {
    const stagePath = `stages[${stageIndex}]`;
    if (!keyPattern.test(stage.stageKey)) {
      findings.push(errorFinding('WORKFLOW_CONFIG_STAGE_KEY_INVALID', `${stagePath}.stageKey`, 'Stage key format is invalid.', 'Use lowercase letters, numbers, and underscores.'));
    } else if (stageKeys.has(stage.stageKey)) {
      findings.push(errorFinding('WORKFLOW_CONFIG_STAGE_KEY_DUPLICATE', `${stagePath}.stageKey`, `Stage key ${stage.stageKey} is duplicated.`, 'Give every stage a unique stable key.'));
    }
    stageKeys.add(stage.stageKey);
    if (stageOrders.has(stage.order)) {
      findings.push(errorFinding('WORKFLOW_CONFIG_STAGE_ORDER_DUPLICATE', `${stagePath}.order`, `Stage order ${stage.order} is duplicated.`, 'Give every stage a unique order.'));
    }
    stageOrders.add(stage.order);
    if (!approvalModes.has(stage.approvalMode)) findings.push(errorFinding('WORKFLOW_CONFIG_APPROVAL_MODE_UNSUPPORTED', `${stagePath}.approvalMode`, 'Approval mode must be all, any, or quorum.', 'Select a supported approval mode.'));
    if (stage.approvalMode === 'quorum' && (!Number.isInteger(stage.decisionPolicy.quorum) || stage.decisionPolicy.quorum < 1 || stage.decisionPolicy.quorum > 100)) findings.push(errorFinding('WORKFLOW_CONFIG_QUORUM_INVALID', `${stagePath}.decisionPolicy.quorum`, 'Quorum must be between 1 and 100.', 'Choose a positive approval threshold; submission also verifies it against resolved approvers.'));
    if (!selfApprovalPolicies.has(stage.selfApprovalPolicy)) {
      findings.push(errorFinding('WORKFLOW_CONFIG_SELF_APPROVAL_INVALID', `${stagePath}.selfApprovalPolicy`, 'Self-approval policy is invalid.', 'Select error or auto_approve.'));
    }
    validateCondition(stage.condition, `${stagePath}.condition`, availableFields, findings);
    if (stage.skipWhenConditionFalse && !stage.condition) {
      findings.push(errorFinding('WORKFLOW_CONFIG_SKIP_CONDITION_REQUIRED', `${stagePath}.skipWhenConditionFalse`, 'Conditional skipping requires a stage condition.', 'Add a condition or disable skipping.'));
    }
    if (stage.enabled && !stage.approverRules.length) {
      findings.push(errorFinding('WORKFLOW_CONFIG_APPROVER_REQUIRED', `${stagePath}.approverRules`, `Stage ${stage.name} has no approver rule.`, 'Configure at least one eligible approver rule.'));
    }
    const ruleKeys = new Set();
    for (const [ruleIndex, rule] of stage.approverRules.entries()) {
      const rulePath = `${stagePath}.approverRules[${ruleIndex}]`;
      if (!keyPattern.test(rule.ruleKey) || ruleKeys.has(rule.ruleKey)) {
        findings.push(errorFinding('WORKFLOW_CONFIG_APPROVER_KEY_INVALID', `${rulePath}.ruleKey`, 'Approver rule key is invalid or duplicated.', 'Use a unique lowercase stable rule key.'));
      }
      ruleKeys.add(rule.ruleKey);
      if (!approverTypes.has(rule.resolverType)) {
        findings.push(errorFinding('WORKFLOW_CONFIG_APPROVER_TYPE_UNSUPPORTED', `${rulePath}.resolverType`, 'Approver resolver type is unsupported.', 'Select an initial supported resolver.'));
        continue;
      }
      if (rule.resolverType === 'user') {
        const user = await usersRepository.findUserById(Number(rule.resolverReference));
        if (!user || user.status !== 'active') {
          findings.push(errorFinding('WORKFLOW_CONFIG_APPROVER_USER_INACTIVE', `${rulePath}.resolverReference`, 'Specific approver must be an active user.', 'Select an active user.'));
        }
      }
      if (rule.resolverType === 'role') {
        if (!rule.resolverReference) {
          findings.push(errorFinding('WORKFLOW_CONFIG_APPROVER_ROLE_REQUIRED', `${rulePath}.resolverReference`, 'Role approver needs a role key.', 'Select a role.'));
        } else if (!activeRoles.has(rule.resolverReference)) {
          findings.push(warningFinding('WORKFLOW_CONFIG_APPROVER_ROLE_EMPTY', `${rulePath}.resolverReference`, `Role ${rule.resolverReference} currently has no active user.`, 'Assign an active user before requests are submitted.'));
        }
      }
      if (rule.resolverType === 'organization_responsibility') {
        const nodeId = Number(rule.resolverReference || rule.resolverConfig.organizationNodeId);
        const node = nodeId ? await departmentsRepository.findById(nodeId) : null;
        if (!node || !node.enabled) {
          findings.push(errorFinding('WORKFLOW_CONFIG_APPROVER_ORGANIZATION_INVALID', `${rulePath}.resolverReference`, 'Organization responsibility must reference an enabled organization node.', 'Select an enabled organization node.'));
        }
      }
      if (rule.resolverType === 'record_user_field' && !availableFields.has(rule.resolverReference)) {
        findings.push(errorFinding('WORKFLOW_CONFIG_APPROVER_FIELD_INVALID', `${rulePath}.resolverReference`, 'Record-user approver field does not exist.', 'Select a stable user/owner field from the source module.'));
      }
      validateCondition(rule.authorityCondition, `${rulePath}.authorityCondition`, availableFields, findings);
    }

    validateAttachmentPolicy(stage.attachmentPolicy, `${stagePath}.attachmentPolicy`, findings, ['approval', 'rejection', 'return']);
    if (stage.slaPolicy.enabled) {
      if (stage.slaPolicy.duration <= 0 || !['minutes', 'hours', 'days'].includes(stage.slaPolicy.unit)) {
        findings.push(errorFinding('WORKFLOW_CONFIG_SLA_INVALID', `${stagePath}.slaPolicy`, 'Enabled SLA needs a positive duration in minutes, hours, or days.', 'Set a valid SLA duration and unit.'));
      }
      if (stage.slaPolicy.reminderOffsets.some((offset) => !Number.isFinite(offset) || offset < 0 || offset >= stage.slaPolicy.duration)) {
        findings.push(errorFinding('WORKFLOW_CONFIG_SLA_REMINDER_INVALID', `${stagePath}.slaPolicy.reminderOffsets`, 'Reminder offsets must be non-negative and less than the SLA duration.', 'Adjust reminder offsets.'));
      }
      const calendar = stage.slaPolicy.businessCalendar;
      if (calendar?.enabled && (!calendar.weekdays.length || calendar.weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6) || !/^\d{2}:\d{2}$/.test(calendar.startTime) || !/^\d{2}:\d{2}$/.test(calendar.endTime) || calendar.startTime >= calendar.endTime)) {
        findings.push(errorFinding('WORKFLOW_CONFIG_SLA_CALENDAR_INVALID', `${stagePath}.slaPolicy.businessCalendar`, 'Business calendar needs working weekdays and a valid opening time before closing time.', 'Choose weekdays and working hours such as 09:00-17:00.'));
      }
    }
    for (const [eventIndex, eventName] of stage.eventPolicy.events.entries()) {
      if (!allowedEvents.has(eventName)) {
        findings.push(errorFinding('WORKFLOW_CONFIG_EVENT_INVALID', `${stagePath}.eventPolicy.events[${eventIndex}]`, `Lifecycle event ${eventName} is unsupported.`, 'Select an allowlisted Workflow event.'));
      }
    }
    for (const [fieldIndex, payloadField] of stage.eventPolicy.payloadFields.entries()) {
      if (!allowedEventFields.has(payloadField)) {
        findings.push(errorFinding('WORKFLOW_CONFIG_EVENT_FIELD_INVALID', `${stagePath}.eventPolicy.payloadFields[${fieldIndex}]`, `Event payload field ${payloadField} is not allowlisted.`, 'Remove the field or select an approved payload field.'));
      }
    }
  }

  for (const [eventIndex, eventName] of config.eventPolicy.events.entries()) {
    if (!allowedEvents.has(eventName)) {
      findings.push(errorFinding('WORKFLOW_CONFIG_EVENT_INVALID', `eventPolicy.events[${eventIndex}]`, `Lifecycle event ${eventName} is unsupported.`, 'Select an allowlisted Workflow event.'));
    }
  }
  for (const [fieldIndex, payloadField] of config.eventPolicy.payloadFields.entries()) {
    if (!allowedEventFields.has(payloadField)) {
      findings.push(errorFinding('WORKFLOW_CONFIG_EVENT_FIELD_INVALID', `eventPolicy.payloadFields[${fieldIndex}]`, `Event payload field ${payloadField} is not allowlisted.`, 'Remove the field or select an approved payload field.'));
    }
  }

  const errors = findings.filter((finding) => finding.severity === 'error');
  const warnings = findings.filter((finding) => finding.severity === 'warning');
  return { valid: errors.length === 0, errors, warnings, findings };
}

async function getDefinition(workflowKey) {
  const definition = await repository.findDefinitionByKey(workflowKey);
  if (!definition) throw workflowError('Workflow definition not found', 404, 'WORKFLOW_CONFIG_NOT_FOUND');
  return { definition, check: await validateConfiguration(definition) };
}

async function listDefinitions(filters = {}) {
  return { definitions: await repository.listDefinitions(filters) };
}

async function createDefinition(input, user) {
  assertConfigurationAdmin(user);
  const workflowKey = String(input.workflowKey || slugKey(input.name)).trim();
  if (await repository.findDefinitionByKey(workflowKey)) {
    throw workflowError('A workflow with this key already exists', 409, 'WORKFLOW_CONFIG_KEY_CONFLICT');
  }
  const draftConfig = normalizeConfig(input.config || input.draftConfig || {});
  let definition;
  for (let attempt = 0; attempt < 5 && !definition; attempt += 1) {
    const requestPrefix = await nextAvailableRequestPrefix(workflowKey);
    try {
      definition = await repository.createDefinition({
        workflowKey,
        requestPrefix,
        name: String(input.name || '').trim(),
        description: String(input.description || '').trim(),
        sourceModuleKey: String(input.sourceModuleKey || '').trim(),
        requestFormKey: String(input.requestFormKey || '').trim(),
        requestFormVersion: input.requestFormVersion || null,
        schemaVersion: 1,
        draftConfig
      }, user?.id);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' && String(error.message || '').includes('request_prefix')) continue;
      if (error.code === 'ER_DUP_ENTRY') {
        throw workflowError('A workflow with this key already exists', 409, 'WORKFLOW_CONFIG_KEY_CONFLICT');
      }
      throw error;
    }
  }
  if (!definition) throw workflowError('Unable to allocate a unique workflow request prefix', 409, 'WORKFLOW_CONFIG_REQUEST_PREFIX_CONFLICT');
  return { definition, check: await validateConfiguration(definition) };
}

async function updateDefinition(workflowKey, input, user) {
  assertConfigurationAdmin(user);
  const current = await repository.findDefinitionByKey(workflowKey);
  if (!current) throw workflowError('Workflow definition not found', 404, 'WORKFLOW_CONFIG_NOT_FOUND');
  if (input.workflowKey && input.workflowKey !== workflowKey) {
    throw workflowError('Workflow key cannot be changed', 409, 'WORKFLOW_CONFIG_KEY_IMMUTABLE');
  }
  if (current.status === 'archived') {
    throw workflowError('Archived workflow definitions cannot be edited', 409, 'WORKFLOW_CONFIG_ARCHIVED');
  }
  const draftConfig = input.config !== undefined || input.draftConfig !== undefined
    ? normalizeConfig(input.config || input.draftConfig)
    : current.draftConfig;
  const definition = await repository.updateDefinition(workflowKey, {
    name: input.name,
    description: input.description,
    sourceModuleKey: input.sourceModuleKey,
    requestFormKey: input.requestFormKey,
    requestFormVersion: input.requestFormVersion,
    draftConfig
  }, user?.id);
  return { definition, check: await validateConfiguration(definition) };
}

async function cloneDefinition(workflowKey, input, user) {
  assertConfigurationAdmin(user);
  const source = await repository.findDefinitionByKey(workflowKey);
  if (!source) throw workflowError('Workflow definition not found', 404, 'WORKFLOW_CONFIG_NOT_FOUND');
  const targetKey = String(input.workflowKey || slugKey(input.name)).trim();
  if (!targetKey || await repository.findDefinitionByKey(targetKey)) {
    throw workflowError('Clone workflow key is missing or already exists', 409, 'WORKFLOW_CONFIG_KEY_CONFLICT');
  }
  const definition = await repository.createDefinition({
    workflowKey: targetKey,
    requestPrefix: await nextAvailableRequestPrefix(targetKey),
    name: String(input.name || `${source.name} Copy`).trim(),
    description: input.description === undefined ? source.description : String(input.description || '').trim(),
    sourceModuleKey: source.sourceModuleKey,
    requestFormKey: source.requestFormKey,
    requestFormVersion: source.requestFormVersion,
    schemaVersion: source.schemaVersion,
    draftConfig: source.draftConfig
  }, user?.id);
  return { definition, check: await validateConfiguration(definition) };
}

async function archiveDefinition(workflowKey, user) {
  assertConfigurationAdmin(user);
  const definition = await repository.findDefinitionByKey(workflowKey);
  if (!definition) throw workflowError('Workflow definition not found', 404, 'WORKFLOW_CONFIG_NOT_FOUND');
  return {
    definition: await repository.updateDefinition(workflowKey, { status: 'archived' }, user?.id)
  };
}

async function checkDefinition(workflowKey) {
  const definition = await repository.findDefinitionByKey(workflowKey);
  if (!definition) throw workflowError('Workflow definition not found', 404, 'WORKFLOW_CONFIG_NOT_FOUND');
  return { check: await validateConfiguration(definition) };
}

async function checkpointDefinition(workflowKey, input, user) {
  assertConfigurationAdmin(user);
  const definition = await repository.findDefinitionByKey(workflowKey);
  if (!definition) throw workflowError('Workflow definition not found', 404, 'WORKFLOW_CONFIG_NOT_FOUND');
  if (definition.status === 'archived') {
    throw workflowError('Archived workflow definitions cannot be versioned', 409, 'WORKFLOW_CONFIG_ARCHIVED');
  }
  const version = await repository.createVersion(workflowKey, {
    action: 'checkpoint',
    summary: String(input.summary || 'Workflow configuration checkpoint').trim(),
    snapshot: configurationSnapshot(definition)
  }, user?.id);
  return { definition: await repository.findDefinitionByKey(workflowKey), version };
}

async function publishDefinition(workflowKey, input, user) {
  assertConfigurationAdmin(user);
  const definition = await repository.findDefinitionByKey(workflowKey);
  if (!definition) throw workflowError('Workflow definition not found', 404, 'WORKFLOW_CONFIG_NOT_FOUND');
  if (definition.status === 'archived') {
    throw workflowError('Archived workflow definitions cannot be published', 409, 'WORKFLOW_CONFIG_ARCHIVED');
  }
  const check = await validateConfiguration(definition);
  if (!check.valid) {
    throw workflowError('Workflow configuration needs attention before publishing', 422, 'WORKFLOW_PUBLISH_VALIDATION_FAILED', { check });
  }
  const version = await repository.createVersion(workflowKey, {
    action: 'publish',
    summary: String(input.summary || 'Published workflow configuration').trim(),
    snapshot: configurationSnapshot(definition)
  }, user?.id);
  return { definition: await repository.findDefinitionByKey(workflowKey), version, check };
}

async function listVersions(workflowKey, limit) {
  if (!await repository.findDefinitionByKey(workflowKey)) {
    throw workflowError('Workflow definition not found', 404, 'WORKFLOW_CONFIG_NOT_FOUND');
  }
  return { versions: await repository.listVersions(workflowKey, limit) };
}

async function getVersion(workflowKey, versionId) {
  const version = await repository.findVersion(workflowKey, versionId);
  if (!version) throw workflowError('Workflow version not found', 404, 'WORKFLOW_CONFIG_VERSION_NOT_FOUND');
  return { version };
}

module.exports = {
  normalizeConfig,
  validateConfiguration,
  configurationSnapshot,
  listDefinitions,
  getDefinition,
  createDefinition,
  updateDefinition,
  cloneDefinition,
  archiveDefinition,
  checkDefinition,
  checkpointDefinition,
  publishDefinition,
  listVersions,
  getVersion
};
