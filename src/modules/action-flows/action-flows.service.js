const { AppError } = require('../../shared/errors');
const repository = require('./action-flows.repository');
const runtime = require('./action-flows.runtime');

const actionCategories = {
  record: ['add_record', 'update_record', 'delete_record', 'assign_owner', 'change_status', 'obtain_record_data', 'restore_record', 'data_source_query'],
  task_notification: ['create_task', 'send_notification', 'send_email', 'schedule_follow_up'],
  workflow: ['new_workflow', 'save_workflow', 'submit_workflow', 'delete_workflow', 'cc_workflow'],
  logic: ['condition', 'branch', 'parallel_branch', 'delay', 'stop_flow', 'loop'],
  restful_api: ['call_rest_api', 'parse_response', 'success_failure_branch'],
  data_mapping: ['set_variable', 'transform_value', 'merge_data', 'extract_json_value', 'formula_calculation', 'data_source_query'],
  end: ['end']
};

const triggerTypes = ['record_created', 'record_updated', 'status_changed', 'record_deleted', 'manual'];
const statuses = ['draft', 'enabled', 'disabled'];

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
    if (node.category !== 'trigger' && actionCategories[node.category] && !actionCategories[node.category].includes(node.type)) {
      errors.push(`Node ${node.label || node.id} has an unsupported action type.`);
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
    if (['add_record', 'update_record'].includes(node.type) && !node.config?.fieldMappingText) {
      errors.push(`Data operation node ${node.label || node.id} needs field mapping.`);
    }
    if (node.type === 'data_source_query' && !node.config?.queryRule) {
      errors.push(`Data Source Query node ${node.label || node.id} needs a filter or match rule.`);
    }
    if (node.type === 'condition' && !node.config?.condition) {
      errors.push(`Condition node ${node.label || node.id} needs condition settings.`);
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
  listConnectors,
  listConnectorCategories,
  saveConnectorCategory,
  deleteConnectorCategory,
  listExecutions,
  saveConnector,
  deleteConnector,
  debugConnector
};
