const { AppError } = require('../../shared/errors');
const { evaluateCondition } = require('./workflows.conditions');

function graphError(message, code, details = {}) {
  return new AppError(message, 422, { code, ...details });
}

function executableGraph(config = {}) {
  const graph = config.builderGraph;
  return graph && Array.isArray(graph.nodes) && graph.nodes.length ? graph : null;
}

function outgoingEdges(graph, nodeId) {
  return (graph.edges || []).filter((edge) => edge.from === nodeId);
}

function edgeMatches(edge, snapshot) {
  if (edge.outcome === 'condition_met') return evaluateCondition(edge.condition, snapshot, `builderGraph.edges.${edge.id}.condition`).matched;
  if (edge.outcome === 'condition_not_met') return !evaluateCondition(edge.condition, snapshot, `builderGraph.edges.${edge.id}.condition`).matched;
  return true;
}

function selectOutgoingEdge(graph, nodeId, snapshot = {}) {
  const candidates = outgoingEdges(graph, nodeId);
  const matching = candidates.filter((edge) => edgeMatches(edge, snapshot));
  if (!matching.length) throw graphError(`No route matches node ${nodeId}.`, 'WORKFLOW_ROUTE_NO_MATCH', { nodeId });
  if (matching.length > 1) throw graphError(`More than one route matches node ${nodeId}.`, 'WORKFLOW_ROUTE_AMBIGUOUS', { nodeId, edgeIds: matching.map((edge) => edge.id) });
  return matching[0];
}

function routeExecution(config, snapshot = {}) {
  const graph = executableGraph(config);
  if (!graph) return null;
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const stages = new Map((config.stages || []).map((stage) => [stage.stageKey, stage]));
  const start = graph.nodes.find((node) => node.type === 'start');
  if (!start) throw graphError('Workflow route has no Start node.', 'WORKFLOW_ROUTE_START_MISSING');
  const visited = new Set([start.id]);
  const routedStages = [];
  const selectedEdges = [];
  let current = start;
  while (current.type !== 'end') {
    const edge = selectOutgoingEdge(graph, current.id, snapshot);
    selectedEdges.push(edge);
    const target = nodes.get(edge.to);
    if (!target) throw graphError(`Route ${edge.id} points to a missing node.`, 'WORKFLOW_ROUTE_TARGET_MISSING', { edgeId: edge.id });
    if (visited.has(target.id)) throw graphError(`Workflow route contains a cycle at ${target.id}.`, 'WORKFLOW_ROUTE_CYCLE', { nodeId: target.id });
    visited.add(target.id);
    if (target.type === 'approval') {
      const stage = stages.get(target.stageKey);
      if (!stage) throw graphError(`Approval node ${target.id} has no configured stage.`, 'WORKFLOW_ROUTE_STAGE_MISSING', { nodeId: target.id, stageKey: target.stageKey });
      if (stage.enabled !== false) {
        const condition = evaluateCondition(stage.condition, snapshot, `stages.${stage.stageKey}.condition`);
        if (!condition.matched && !stage.skipWhenConditionFalse) {
          throw graphError(`Workflow stage ${stage.stageKey} is not applicable and skipping is disabled.`, 'WORKFLOW_STAGE_CONDITION_NOT_MET', { stageKey: stage.stageKey });
        }
        routedStages.push({
          stage,
          outcome: condition.matched ? 'applicable' : 'skipped',
          reasonCode: condition.matched ? '' : 'WORKFLOW_STAGE_CONDITION_FALSE',
          trace: condition.trace,
          incomingEdge: edge
        });
      }
    }
    current = target;
  }
  return { stages: routedStages, selectedEdges, endNode: current };
}

function nextRouteTarget(config, fromStageKey, snapshot = {}, instanceStages = []) {
  const graph = executableGraph(config);
  if (!graph) return null;
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const current = graph.nodes.find((node) => node.type === 'approval' && node.stageKey === fromStageKey);
  if (!current) throw graphError(`Active stage ${fromStageKey} has no route node.`, 'WORKFLOW_ROUTE_ACTIVE_NODE_MISSING', { stageKey: fromStageKey });
  const instanceByKey = new Map(instanceStages.map((stage) => [stage.stageKey, stage]));
  const visited = new Set([current.id]);
  const selectedEdges = [];
  let node = current;
  while (node.type !== 'end') {
    const edge = selectOutgoingEdge(graph, node.id, snapshot);
    selectedEdges.push(edge);
    node = nodes.get(edge.to);
    if (!node) throw graphError(`Route ${edge.id} points to a missing node.`, 'WORKFLOW_ROUTE_TARGET_MISSING', { edgeId: edge.id });
    if (visited.has(node.id)) throw graphError(`Workflow route contains a cycle at ${node.id}.`, 'WORKFLOW_ROUTE_CYCLE', { nodeId: node.id });
    visited.add(node.id);
    if (node.type === 'approval') {
      const instanceStage = instanceByKey.get(node.stageKey);
      if (!instanceStage) throw graphError(`Routed stage ${node.stageKey} was not materialized.`, 'WORKFLOW_ROUTE_INSTANCE_STAGE_MISSING', { stageKey: node.stageKey });
      if (instanceStage.status === 'waiting') return { type: 'approval', node, stage: instanceStage, selectedEdges };
      if (!['skipped', 'auto_approved', 'approved'].includes(instanceStage.status)) {
        throw graphError(`Routed stage ${node.stageKey} is not available.`, 'WORKFLOW_ROUTE_STAGE_STATE_INVALID', { stageKey: node.stageKey, status: instanceStage.status });
      }
    }
  }
  return { type: 'end', node, selectedEdges };
}

module.exports = { edgeMatches, executableGraph, nextRouteTarget, outgoingEdges, routeExecution, selectOutgoingEdge };
