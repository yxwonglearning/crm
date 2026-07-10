const { AppError } = require('./errors');

function extractFormulaDependencies(expression = '') {
  const dependencies = new Set();
  const pattern = /\{([a-zA-Z][a-zA-Z0-9_]*)\}/g;
  let match = pattern.exec(String(expression || ''));
  while (match) {
    dependencies.add(match[1]);
    match = pattern.exec(String(expression || ''));
  }
  return Array.from(dependencies);
}

function isFormulaEnabled(field) {
  return Boolean(field?.formulaEnabled && String(field.formulaExpression || '').trim());
}

function formulaCyclePath(startKey, graph) {
  const visiting = new Set();
  const visited = new Set();
  const stack = [];

  function visit(fieldKey) {
    if (visiting.has(fieldKey)) {
      return [...stack.slice(stack.indexOf(fieldKey)), fieldKey];
    }
    if (visited.has(fieldKey)) return null;

    visiting.add(fieldKey);
    stack.push(fieldKey);
    for (const dependency of graph.get(fieldKey) || []) {
      const cycle = visit(dependency);
      if (cycle) return cycle;
    }
    stack.pop();
    visiting.delete(fieldKey);
    visited.add(fieldKey);
    return null;
  }

  return visit(startKey);
}

function formulaDependencyGraph(fields = []) {
  const fieldKeys = new Set(fields.map((field) => field.fieldKey));
  const formulaKeys = new Set(fields.filter(isFormulaEnabled).map((field) => field.fieldKey));
  const graph = new Map();

  fields.filter(isFormulaEnabled).forEach((field) => {
    const dependencies = extractFormulaDependencies(field.formulaExpression);
    const unknown = dependencies.filter((fieldKey) => !fieldKeys.has(fieldKey));
    if (unknown.length) {
      throw new AppError(`Formula "${field.label || field.fieldKey}" references unknown field(s): ${unknown.join(', ')}`, 422);
    }
    if (dependencies.includes(field.fieldKey)) {
      throw new AppError(`Formula "${field.label || field.fieldKey}" cannot reference itself`, 422);
    }
    graph.set(field.fieldKey, dependencies.filter((fieldKey) => formulaKeys.has(fieldKey)));
  });

  for (const fieldKey of graph.keys()) {
    const cycle = formulaCyclePath(fieldKey, graph);
    if (cycle) {
      throw new AppError(`Formula circular reference detected: ${cycle.join(' -> ')}`, 422);
    }
  }

  return graph;
}

function orderedFormulaFields(fields = []) {
  const graph = formulaDependencyGraph(fields);
  const byKey = new Map(fields.map((field) => [field.fieldKey, field]));
  const ordered = [];
  const visited = new Set();

  function visit(fieldKey) {
    if (visited.has(fieldKey)) return;
    (graph.get(fieldKey) || []).forEach(visit);
    visited.add(fieldKey);
    ordered.push(byKey.get(fieldKey));
  }

  Array.from(graph.keys()).forEach(visit);
  return ordered.filter(Boolean);
}

module.exports = {
  extractFormulaDependencies,
  formulaDependencyGraph,
  orderedFormulaFields
};
