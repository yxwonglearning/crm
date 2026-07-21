const { AppError } = require('../../shared/errors');
const repository = require('./action-flows.repository');
const runtime = require('./action-flows.runtime');

const actionCategories = {
  record: ['add_record', 'update_record', 'delete_record', 'assign_owner', 'change_status', 'obtain_record_data', 'restore_record', 'data_source_query'],
  task_notification: ['create_task', 'send_notification', 'send_email', 'schedule_follow_up'],
  workflow: ['new_workflow', 'save_workflow', 'submit_workflow', 'delete_workflow', 'cc_workflow', 'run_flow'],
  logic: ['condition', 'branch', 'parallel_branch', 'delay', 'stop_flow', 'loop'],
  restful_api: ['call_rest_api', 'parse_response', 'success_failure_branch'],
  data_mapping: ['set_variable', 'transform_value', 'merge_data', 'extract_json_value', 'formula_calculation', 'data_source_query'],
  end: ['end']
};

const triggerTypes = ['record_created', 'record_updated', 'status_changed', 'record_deleted', 'manual', 'scheduled'];
const statuses = ['draft', 'enabled', 'disabled'];
const conditionOperators = ['equals', 'not_equals', 'contains', 'starts_with', 'ends_with', 'greater_than', 'less_than', 'empty', 'not_empty'];

function slugKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

function defaultDefinition(input = {}) {
  const moduleKey = input.triggerModule || 'customers';
  return {
    nodes: [
      {
        id: 'start_1',
        category: 'trigger',
        type: input.triggerType || 'manual',
        label: 'Start',
        x: 520,
        y: 80,
        config: { moduleKey }
      }
    ],
    edges: []
  };
}

function normalizeDefinition(definition, fallback = {}) {
  const next = definition && typeof definition === 'object' ? definition : fallback;
  return {
    nodes: Array.isArray(next.nodes) ? next.nodes : [],
    edges: Array.isArray(next.edges) ? next.edges : []
  };
}

function flowSnapshot(flow) {
  return {
    name: flow.name,
    description: flow.description || '',
    triggerCategory: flow.triggerCategory,
    triggerType: flow.triggerType,
    triggerModule: flow.triggerModule || '',
    definition: normalizeDefinition(flow.definition)
  };
}

function validateDefinition(definition) {
  const normalized = normalizeDefinition(definition);
  const errors = [];
  const nodes = normalized.nodes;
  if (!nodes.length) errors.push('Add at least one trigger node and one action node.');
  const triggerNodes = nodes.filter((node) => node.category === 'trigger');
  if (triggerNodes.length !== 1) errors.push('Action Flow needs exactly one trigger node.');
  nodes.forEach((node) => {
    if (!node.id) errors.push('Every node needs an id.');
    if (!node.category) errors.push(`Node ${node.label || node.id || ''} needs a category.`);
    if (node.category === 'trigger' && !triggerTypes.includes(node.type)) {
      errors.push(`Trigger node ${node.label || node.id} has an unsupported type.`);
    }
    if (node.type === 'scheduled') {
      const every = Number(node.config?.scheduleEvery);
      if (!Number.isInteger(every) || every < 1 || every > 1000) errors.push(`Scheduled trigger ${node.label || node.id} needs an interval from 1 to 1000.`);
      if (!['minutes', 'hours', 'days'].includes(node.config?.scheduleUnit)) errors.push(`Scheduled trigger ${node.label || node.id} needs minutes, hours, or days.`);
      if (node.config?.scheduleStartAt && Number.isNaN(new Date(node.config.scheduleStartAt).getTime())) errors.push(`Scheduled trigger ${node.label || node.id} has an invalid start time.`);
    }
    if (node.category !== 'trigger' && actionCategories[node.category] && !actionCategories[node.category].includes(node.type)) {
      errors.push(`Node ${node.label || node.id} has an unsupported action type.`);
    }
    if (node.category === 'end' && normalized.edges.some((edge) => edge.from === node.id)) {
      errors.push(`End node ${node.label || node.id} cannot have outgoing connections.`);
    }
    if (node.type === 'call_rest_api' && !node.config?.connectorKey) {
      errors.push(`REST API node ${node.label || node.id} needs a connector.`);
    }
    if (node.type === 'call_rest_api' && !node.config?.endpointPath && !node.config?.endpointKey) {
      errors.push(`REST API node ${node.label || node.id} needs an endpoint.`);
    }
    if (node.type === 'delete_record' && !node.config?.confirmDelete) {
      errors.push(`Delete Record node ${node.label || node.id} needs delete confirmation enabled.`);
    }
    const hasFieldMappings = Boolean(node.config?.fieldMappingText) || (Array.isArray(node.config?.fieldMappings) && node.config.fieldMappings.some((mapping) => mapping?.target));
    if (['add_record', 'update_record', 'set_variable'].includes(node.type) && !hasFieldMappings) {
      errors.push(`Data operation node ${node.label || node.id} needs field mapping.`);
    }
    if (node.type === 'create_task') {
      if (!String(node.config?.title || '').trim()) errors.push(`Create Task node ${node.label || node.id} needs a title.`);
      if (!['low', 'normal', 'high', 'urgent'].includes(node.config?.priority || 'normal')) {
        errors.push(`Create Task node ${node.label || node.id} has an unsupported priority.`);
      }
    }
    if (node.type === 'send_notification') {
      if (!String(node.config?.recipient || '').trim()) errors.push(`Notification node ${node.label || node.id} needs a recipient.`);
      if (!String(node.config?.title || '').trim()) errors.push(`Notification node ${node.label || node.id} needs a title.`);
      if (!String(node.config?.message || '').trim()) errors.push(`Notification node ${node.label || node.id} needs a message.`);
    }
    if (node.type === 'transform_value') {
      if (!String(node.config?.outputName || '').trim()) errors.push(`Transform Value node ${node.label || node.id} needs an output name.`);
      if (!String(node.config?.sourceValue || '').trim()) errors.push(`Transform Value node ${node.label || node.id} needs a source value.`);
      if (!['trim', 'uppercase', 'lowercase', 'number', 'boolean', 'json_parse'].includes(node.config?.operation || 'trim')) {
        errors.push(`Transform Value node ${node.label || node.id} has an unsupported operation.`);
      }
    }
    if (node.type === 'data_source_query' && !node.config?.queryRule) {
      errors.push(`Data Source Query node ${node.label || node.id} needs a filter or match rule.`);
    }
    if (node.type === 'condition' && !node.config?.condition) {
      errors.push(`Condition node ${node.label || node.id} needs condition settings.`);
    }
    if (node.type === 'condition' && Array.isArray(node.config?.conditionRules)) {
      if (!['and', 'or'].includes(node.config?.conditionCombinator || 'and')) {
        errors.push(`Condition node ${node.label || node.id} needs a valid All or Any match setting.`);
      }
      node.config.conditionRules.forEach((rule, index) => {
        const ruleLabel = `Condition ${index + 1} in ${node.label || node.id}`;
        if (!String(rule?.left || '').trim()) errors.push(`${ruleLabel} needs a field.`);
        if (!conditionOperators.includes(rule?.operator)) errors.push(`${ruleLabel} has an unsupported operator.`);
        if (!['empty', 'not_empty'].includes(rule?.operator) && String(rule?.value ?? '').trim() === '') {
          errors.push(`${ruleLabel} needs a comparison value.`);
        }
      });
    }
    if (node.type === 'condition') {
      const branchEdges = normalized.edges.filter((edge) => edge.from === node.id && edge.kind !== 'loop_body' && String(edge.outcome || edge.label || '').toLowerCase() !== 'error');
      const branchOutcomes = branchEdges.map((edge) => String(edge.outcome || edge.label || '').trim().toLowerCase());
      ['yes', 'no'].forEach((outcome) => {
        const count = branchOutcomes.filter((item) => item === outcome).length;
        if (!count) errors.push(`Condition node ${node.label || node.id} needs a ${outcome === 'yes' ? 'Yes' : 'No'} branch.`);
        if (count > 1) errors.push(`Condition node ${node.label || node.id} has more than one ${outcome === 'yes' ? 'Yes' : 'No'} branch.`);
      });
      if (branchOutcomes.some((outcome) => !['yes', 'no'].includes(outcome))) {
        errors.push(`Every branch from condition node ${node.label || node.id} must be labelled Yes or No.`);
      }
      branchEdges.forEach((edge) => {
        if (!nodes.some((target) => target.id === edge.to)) {
          errors.push(`Condition node ${node.label || node.id} has a branch connected to a missing node.`);
        }
      });
    }
    if (node.type === 'loop') {
      if (!String(node.config?.sourceValue || '').trim()) errors.push(`Loop node ${node.label || node.id} needs an array source.`);
      const loopEdges = normalized.edges.filter((edge) => edge.from === node.id && ['body', 'done'].includes(String(edge.outcome || edge.label || '').toLowerCase()));
      ['body', 'done'].forEach((outcome) => {
        if (loopEdges.filter((edge) => String(edge.outcome || edge.label || '').toLowerCase() === outcome).length !== 1) errors.push(`Loop node ${node.label || node.id} needs exactly one ${outcome === 'body' ? 'Body' : 'Done'} path.`);
      });
    }
    if (node.type === 'parallel_branch') {
      const branches = normalized.edges.filter((edge) => edge.from === node.id && String(edge.outcome || edge.label || '').toLowerCase().startsWith('branch'));
      if (branches.length < 2) errors.push(`Parallel node ${node.label || node.id} needs at least two branches.`);
    }
    if (node.type === 'run_flow') {
      if (!String(node.config?.flowKey || '').trim()) errors.push(`Run Flow node ${node.label || node.id} needs a target flow.`);
    }
    if (node.category !== 'trigger' && node.category !== 'end') {
      const attempts = Number(node.config?.retryAttempts || 1);
      const delayMs = Number(node.config?.retryDelayMs || 0);
      if (!Number.isInteger(attempts) || attempts < 1 || attempts > 5) errors.push(`Node ${node.label || node.id} needs retry attempts from 1 to 5.`);
      if (!Number.isInteger(delayMs) || delayMs < 0 || delayMs > 60000) errors.push(`Node ${node.label || node.id} needs a retry delay from 0 to 60000 milliseconds.`);
      const onError = node.config?.onError || 'stop';
      if (!['stop', 'continue', 'error_branch'].includes(onError)) errors.push(`Node ${node.label || node.id} has an unsupported error action.`);
      if (onError === 'error_branch') {
        const errorEdges = normalized.edges.filter((edge) => edge.from === node.id && String(edge.outcome || edge.label || '').toLowerCase() === 'error');
        if (errorEdges.length !== 1) errors.push(`Node ${node.label || node.id} needs exactly one Error branch.`);
        if (errorEdges.some((edge) => !nodes.some((target) => target.id === edge.to))) errors.push(`Node ${node.label || node.id} has an Error branch connected to a missing node.`);
      }
    }
  });
  return { valid: errors.length === 0, errors };
}

async function listFlows(filters = {}) {
  return {
    flows: await repository.listFlows(filters),
    actionCategories,
    triggerTypes
  };
}

async function getFlow(flowKey) {
  const flow = await repository.findFlowByKey(flowKey);
  if (!flow) throw new AppError('Action Flow not found', 404);
  return { flow, check: validateDefinition(flow.definition) };
}

async function createFlow(input, user) {
  const flowKey = slugKey(input.flowKey || input.name);
  if (!flowKey) throw new AppError('Flow key is required', 422);
  if (!statuses.includes(input.status || 'draft')) throw new AppError('Unsupported Action Flow status', 422);
  if (!triggerTypes.includes(input.triggerType || 'record_created')) throw new AppError('Unsupported trigger type', 422);
  const definition = normalizeDefinition(input.definition, defaultDefinition(input));
  let flow;
  try {
    flow = await repository.createFlow({
      flowKey,
      name: input.name,
      description: input.description || '',
      status: input.status || 'draft',
      triggerCategory: input.triggerCategory || 'record',
      triggerType: input.triggerType || 'record_created',
      triggerModule: input.triggerModule || '',
      definition
    }, user?.id);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError('An Action Flow with this name already exists', 409);
    }
    throw error;
  }
  await repository.createFlowVersion(flow.flowKey, {
    action: 'created',
    summary: 'Initial Action Flow draft',
    snapshot: flowSnapshot(flow),
    useCurrentVersion: true
  }, user?.id);
  flow = await repository.findFlowByKey(flow.flowKey);
  return { flow, check: validateDefinition(flow.definition) };
}

async function updateFlow(flowKey, input, user) {
  const existing = await repository.findFlowByKey(flowKey);
  if (!existing) throw new AppError('Action Flow not found', 404);
  if (input.status && !statuses.includes(input.status)) throw new AppError('Unsupported Action Flow status', 422);
  if (input.triggerType && !triggerTypes.includes(input.triggerType)) throw new AppError('Unsupported trigger type', 422);
  const flow = await repository.updateFlow(flowKey, {
    name: input.name,
    description: input.description,
    status: input.status,
    triggerCategory: input.triggerCategory,
    triggerType: input.triggerType,
    triggerModule: input.triggerModule,
    definition: input.definition === undefined ? undefined : normalizeDefinition(input.definition),
    bumpVersion: Boolean(input.bumpVersion)
  }, user?.id);
  return { flow, check: validateDefinition(flow.definition) };
}

async function deleteFlow(flowKey) {
  const deletedCount = await repository.deleteFlow(flowKey);
  if (!deletedCount) throw new AppError('Action Flow not found', 404);
  return { deletedCount };
}

async function checkFlow(flowKey) {
  const flow = await repository.findFlowByKey(flowKey);
  if (!flow) throw new AppError('Action Flow not found', 404);
  return { check: validateDefinition(flow.definition) };
}

async function ensureInitialFlowVersion(flow, userId = null) {
  const versions = await repository.listFlowVersions(flow.flowKey);
  if (versions?.length) return versions;
  await repository.createFlowVersion(flow.flowKey, {
    action: 'created',
    summary: 'Initial Action Flow draft',
    snapshot: flowSnapshot(flow),
    useCurrentVersion: true
  }, userId);
  return repository.listFlowVersions(flow.flowKey);
}

async function listFlowVersions(flowKey) {
  const flow = await repository.findFlowByKey(flowKey);
  if (!flow) throw new AppError('Action Flow not found', 404);
  return { versions: await ensureInitialFlowVersion(flow), currentVersion: flow.currentVersion, publishedVersion: flow.publishedVersion };
}

async function createFlowVersion(flowKey, input, user) {
  const flow = await repository.findFlowByKey(flowKey);
  if (!flow) throw new AppError('Action Flow not found', 404);
  await ensureInitialFlowVersion(flow, user?.id);
  await repository.createFlowVersion(flowKey, {
    action: 'checkpoint',
    summary: input.remark || 'Saved Action Flow checkpoint',
    snapshot: flowSnapshot(flow)
  }, user?.id);
  const updated = await repository.findFlowByKey(flowKey);
  return { flow: updated, versions: await repository.listFlowVersions(flowKey) };
}

async function publishFlow(flowKey, input, user) {
  const flow = await repository.findFlowByKey(flowKey);
  if (!flow) throw new AppError('Action Flow not found', 404);
  const check = validateDefinition(flow.definition);
  if (!check.valid) throw new AppError(check.errors[0] || 'Action Flow needs attention before publishing', 422);
  await ensureInitialFlowVersion(flow, user?.id);
  const version = await repository.createFlowVersion(flowKey, {
    action: 'published',
    summary: input.remark || 'Published Action Flow',
    snapshot: flowSnapshot(flow)
  }, user?.id);
  const published = await repository.publishFlow(flowKey, version.versionNumber, user?.id);
  return { flow: published, check, versions: await repository.listFlowVersions(flowKey) };
}

async function restoreFlowVersion(flowKey, versionId, input, user) {
  const current = await repository.findFlowByKey(flowKey);
  if (!current) throw new AppError('Action Flow not found', 404);
  const version = await repository.findFlowVersion(flowKey, versionId);
  if (!version) throw new AppError('Action Flow version not found', 404);
  const snapshot = version.snapshot || {};
  const restored = await repository.updateFlow(flowKey, {
    name: snapshot.name,
    description: snapshot.description,
    triggerCategory: snapshot.triggerCategory,
    triggerType: snapshot.triggerType,
    triggerModule: snapshot.triggerModule,
    definition: normalizeDefinition(snapshot.definition)
  }, user?.id);
  await repository.createFlowVersion(flowKey, {
    action: 'restored',
    summary: `Restored version ${version.versionNumber}${input.remark ? `: ${input.remark}` : ''}`,
    snapshot: flowSnapshot(restored)
  }, user?.id);
  const updated = await repository.findFlowByKey(flowKey);
  return { flow: updated, check: validateDefinition(updated.definition), versions: await repository.listFlowVersions(flowKey) };
}

async function listConnectors() {
  return { connectors: await repository.listConnectors() };
}

async function listConnectorCategories() {
  return { categories: await repository.listConnectorCategories() };
}

async function saveConnectorCategory(input, user) {
  const categoryKey = slugKey(input.categoryKey || input.name);
  if (!categoryKey) throw new AppError('Category key is required', 422);
  return { category: await repository.saveConnectorCategory({ categoryKey, name: input.name, description: input.description || '' }, user?.id) };
}

async function deleteConnectorCategory(categoryKey) {
  const usageCount = await repository.countConnectorsByCategory(categoryKey);
  if (usageCount) throw new AppError('Move connectors out of this category before deleting it', 409);
  const deletedCount = await repository.deleteConnectorCategory(categoryKey);
  if (!deletedCount) throw new AppError('Connector category not found', 404);
  return { deletedCount };
}

async function listExecutions(filters = {}) {
  return {
    executions: await repository.listExecutions(filters.flowKey || '', filters.limit || 50)
  };
}

async function runFlowOnce(flowKey, input = {}, user) {
  const flow = await repository.findFlowByKey(flowKey);
  if (!flow) throw new AppError('Action Flow not found', 404);
  const check = validateDefinition(flow.definition);
  if (!check.valid) throw new AppError(check.errors[0] || 'Action Flow needs attention before it can run', 422);
  const trigger = {
    triggerType: 'manual',
    moduleKey: flow.triggerModule || '',
    recordId: input.recordId || input.record?.id || null,
    record: input.record || {},
    previousRecord: input.previousRecord || null,
    userId: user?.id || null,
    runOnce: true
  };
  try {
    const result = await runtime.executeFlow(flow, trigger);
    return { execution: { ...result, trigger } };
  } catch (error) {
    const executions = await repository.listExecutions(flowKey, 1);
    const execution = executions[0];
    return {
      execution: execution
        ? { executionId: execution.id, status: execution.status, steps: execution.result?.steps || [], trigger, error: execution.result?.error || error.message }
        : { status: 'failed', steps: [], trigger, error: error.message }
    };
  }
}

async function saveConnector(input, user) {
  const connectorKey = slugKey(input.connectorKey || input.name);
  if (!connectorKey) throw new AppError('Connector key is required', 422);
  const connector = await repository.saveConnector({
    connectorKey,
    name: input.name,
    baseUrl: input.baseUrl,
    categoryKey: input.categoryKey || '',
    authType: input.authType || 'none',
    authConfig: input.authConfig || {},
    defaultHeaders: input.defaultHeaders || {},
    endpoints: input.endpoints || [],
    enabled: input.enabled !== false
  }, user?.id);
  return { connector };
}

async function deleteConnector(connectorKey) {
  const deletedCount = await repository.deleteConnector(connectorKey);
  if (!deletedCount) throw new AppError('API Connector not found', 404);
  return { deletedCount };
}

async function debugConnector(connectorKey, endpoint) {
  const connector = await repository.findConnectorByKey(connectorKey);
  if (!connector) throw new AppError('API Connector not found', 404);
  return runtime.debugConnectorRequest(connector, endpoint);
}

module.exports = {
  actionCategories,
  listFlows,
  getFlow,
  createFlow,
  updateFlow,
  deleteFlow,
  checkFlow,
  listFlowVersions,
  createFlowVersion,
  publishFlow,
  restoreFlowVersion,
  listConnectors,
  listConnectorCategories,
  saveConnectorCategory,
  deleteConnectorCategory,
  listExecutions,
  runFlowOnce,
  saveConnector,
  deleteConnector,
  debugConnector
};
