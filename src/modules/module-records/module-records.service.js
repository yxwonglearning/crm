const { AppError } = require('../../shared/errors');
const { validateFieldValue } = require('../../shared/field-validation');
const { orderedFormulaFields } = require('../../shared/formula-dependencies');
const moduleConfig = require('../sysadmin/module-config.service');
const permissions = require('../permissions/permissions.service');
const repository = require('./module-records.repository');
const actionFlowRuntime = require('../action-flows/action-flows.runtime');
const vm = require('vm');

function assertCustomPublishedModule(config) {
  const module = config?.module;
  if (!module) throw new AppError('Module not found', 404);
  if (module.system) throw new AppError('System modules use dedicated pages', 422);
  if (module.status !== 'published') throw new AppError('Module is not published', 404);
  return module;
}

function normalizeValue(field, value) {
  if (field.type === 'checkbox') return Boolean(value);
  if (field.type === 'int' || field.type === 'number') {
    if (value === '' || value === null || value === undefined) return '';
    return Number.parseInt(value, 10);
  }
  if (field.type === 'decimals') {
    if (value === '' || value === null || value === undefined) return '';
    return Number(value);
  }
  return value ?? '';
}

function activeFields(config) {
  return (config.fields || []).filter((field) => !field.archived);
}

function mainFields(config) {
  return activeFields(config).filter((field) => field.tableType !== 'detail');
}

function customFieldsFromInput(input, fields) {
  const customFields = {};
  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(input, field.fieldKey)) {
      customFields[field.fieldKey] = normalizeValue(field, input[field.fieldKey]);
    }
  });
  return customFields;
}

function coerceFormulaValue(value) {
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value === null || value === undefined || value === '') return '';
  const number = Number(value);
  return Number.isFinite(number) && String(value).trim() !== '' ? number : value;
}

const customFormulaForbiddenPattern = /\b(?:constructor|eval|Function|global|globalThis|process|require|module|exports|import|this|prototype|__proto__|while|for|setTimeout|setInterval|Promise|fetch|XMLHttpRequest|document|window|localStorage|sessionStorage)\b/;

function assertCustomFormulaBodySafe(body) {
  if (customFormulaForbiddenPattern.test(String(body || ''))) {
    throw new AppError('Custom formula function contains unsupported code', 422);
  }
}

function runCustomFormulaBody(body, value) {
  assertCustomFormulaBodySafe(body);
  const context = vm.createContext({
    value,
    Math,
    Number,
    String,
    Boolean,
    parseFloat,
    parseInt,
    isFinite,
    isNaN
  }, {
    codeGeneration: {
      strings: false,
      wasm: false
    }
  });
  return vm.runInContext(`"use strict"; (() => { ${body} })()`, context, { timeout: 50 });
}

function buildCustomFormulaFunctions(source = '', name = '', body = '') {
  const functions = {};
  try {
    if (String(source || '').trim()) {
      throw new AppError('Custom formula source code is no longer supported. Use Function Name and Function Body.', 422);
    }
    const functionName = String(name || '').trim().toUpperCase();
    const functionBody = String(body || '').trim();
    if (functionName && functionBody) {
      assertCustomFormulaBodySafe(functionBody);
      functions[functionName] = (value) => runCustomFormulaBody(functionBody, value);
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Custom formula JS could not be loaded', 422);
  }
  Object.entries(functions).forEach(([name, fn]) => {
    if (!/^[A-Z][A-Z0-9_]*$/.test(name) || typeof fn !== 'function') {
      throw new AppError('Custom formula functions must use uppercase names', 422);
    }
  });
  return functions;
}

function buildAvailableFormulaFunctions(fields = [], customFunctionSource = '', customFunctionName = '', customFunctionBody = '') {
  const savedFunctions = fields.reduce((functions, field) => ({
    ...functions,
    ...buildCustomFormulaFunctions(field.formulaJs, field.formulaFunctionName, field.formulaFunctionBody)
  }), {});
  return {
    ...savedFunctions,
    ...buildCustomFormulaFunctions(customFunctionSource, customFunctionName, customFunctionBody)
  };
}

function evaluateFormulaExpression(expression, values, customFunctionSource = '', customFunctionName = '', customFunctionBody = '', customFunctionFields = []) {
  if (!String(expression || '').trim()) return '';
  const customFunctions = buildAvailableFormulaFunctions(customFunctionFields, customFunctionSource, customFunctionName, customFunctionBody);
  const functionNames = new Set(['ABS', 'ROUND', 'MIN', 'MAX', ...Object.keys(customFunctions)]);
  const compiled = String(expression)
    .replace(/\b([a-zA-Z][a-zA-Z0-9_]*)\s*\(/g, (_match, name) => `${name.toUpperCase()}(`)
    .replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (_match, key) => `coerceValue(values[${JSON.stringify(key)}])`)
    .replace(/\b(ABS|ROUND|MIN|MAX)\b/g, (name) => `Math.${name.toLowerCase()}`);

  if (/[^0-9+\-*/().,\sA-Za-z_$[\]"']/.test(compiled)) {
    throw new AppError('Formula contains unsupported characters', 422);
  }

  const words = compiled.match(/[A-Za-z_]+/g) || [];
  const allowedWords = new Set(['Math', 'abs', 'round', 'min', 'max', 'values', 'coerceValue', ...Object.keys(values), ...functionNames]);
  if (words.some((word) => !allowedWords.has(word))) {
    throw new AppError('Formula contains unsupported words', 422);
  }

  let result;
  try {
    result = Function('values', 'customFunctions', 'coerceValue', `"use strict"; const { ${Object.keys(customFunctions).join(', ')} } = customFunctions; return (${compiled});`)(values, customFunctions, coerceFormulaValue);
  } catch (_error) {
    throw new AppError('Formula could not be calculated', 422);
  }
  if (typeof result === 'number') {
    if (!Number.isFinite(result)) return '';
    return Number.isInteger(result) ? result : Number(result.toFixed(4));
  }
  return result ?? '';
}

function applyFormulaFields(input, fields) {
  const values = { ...input };
  orderedFormulaFields(fields)
    .forEach((field) => {
      values[field.fieldKey] = evaluateFormulaExpression(field.formulaExpression, values, field.formulaJs, field.formulaFunctionName, field.formulaFunctionBody, fields);
    });
  return values;
}

function applyDetailTableFormulaFields(detailTables, fields, mainValues) {
  const result = {};
  const detailFields = fields.filter((field) => field.tableType === 'detail' && field.detailTableName);
  const tableNames = Array.from(new Set(detailFields.map((field) => field.detailTableName)));
  const orderedFields = orderedFormulaFields(fields);

  tableNames.forEach((tableName) => {
    const tableFields = detailFields.filter((field) => field.detailTableName === tableName);
    const tableFieldKeys = new Set(tableFields.map((field) => field.fieldKey));
    const tableFormulaFields = orderedFields.filter((field) => tableFieldKeys.has(field.fieldKey));
    const rows = Array.isArray(detailTables?.[tableName]) ? detailTables[tableName] : [];
    result[tableName] = rows.map((row) => {
      const values = {
        ...mainValues,
        ...customFieldsFromInput(row || {}, tableFields)
      };
      tableFormulaFields.forEach((field) => {
        values[field.fieldKey] = evaluateFormulaExpression(field.formulaExpression, values, field.formulaJs, field.formulaFunctionName, field.formulaFunctionBody, fields);
      });
      return Object.fromEntries(tableFields.map((field) => [field.fieldKey, values[field.fieldKey]]));
    });
  });

  return result;
}

async function validateFields(moduleKey, input, fields, excludeId = null) {
  for (const field of fields) {
    await validateFieldValue(field, input[field.fieldKey], input, {
      uniqueChecker: field.validationRules?.unique
        ? (uniqueField, value) => repository.countFieldValue(moduleKey, uniqueField, value, excludeId)
        : null
    });
  }
}

function normalizeRecord(record, detailTables = {}) {
  if (!record) return null;
  return {
    id: record.id,
    customFields: record.customFields || {},
    detailTables,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

async function moduleRecordConfig(moduleKey, user) {
  const config = await moduleConfig.getModuleConfig(moduleKey);
  assertCustomPublishedModule(config);
  const userPermissions = await permissions.userModulePagePermissions(moduleKey, user);
  if (!userPermissions.view) throw new AppError('You do not have access to this page', 403);
  return {
    ...config,
    permissions: userPermissions,
    fields: await permissions.decorateFieldsForUser(moduleKey, user, activeFields(config))
  };
}

async function listMenuModules(user) {
  const configs = await moduleConfig.listModules();
  const modules = [];
  for (const config of configs) {
    const module = config.module;
    if (!module || module.system || module.status !== 'published' || !module.showInMenu) continue;
    if (!await permissions.userModulePageAccessAllowed(module.moduleKey, user)) continue;
    modules.push(config);
  }
  return { modules };
}

async function listRecords(moduleKey, filters, user) {
  const config = await moduleRecordConfig(moduleKey, user);
  const records = await repository.listRecords(moduleKey, config.fields, filters);
  return {
    module: config.module,
    fields: config.fields,
    formLayouts: config.formLayouts,
    permissions: config.permissions,
    records: records.map((record) => normalizeRecord(record))
  };
}

async function getRecord(moduleKey, id, user) {
  const config = await moduleRecordConfig(moduleKey, user);
  const record = await repository.findRecordById(moduleKey, id);
  if (!record) throw new AppError('Record not found', 404);
  const detailTables = await repository.detailRowsByRecordId(record.id, config.fields);
  return { record: normalizeRecord(record, detailTables) };
}

async function createRecord(moduleKey, input, user) {
  const config = await moduleRecordConfig(moduleKey, user);
  if (!config.permissions.create) throw new AppError('You do not have create permission for this page', 403);
  const fields = mainFields(config).filter((field) => field.permissions?.create !== false);
  const customFields = applyFormulaFields(customFieldsFromInput(input, fields), fields);
  await validateFields(moduleKey, customFields, fields);
  const id = await repository.createRecord(moduleKey, customFields, user?.id);
  const detailTables = applyDetailTableFormulaFields(input.__detailTables || {}, config.fields, customFields);
  await repository.replaceDetailRows(id, config.fields, detailTables);
  const record = await repository.findRecordById(moduleKey, id);
  await actionFlowRuntime.runRecordTrigger('record_created', {
    moduleKey,
    recordId: id,
    record,
    userId: user?.id
  });
  return getRecord(moduleKey, id, user);
}

async function updateRecord(moduleKey, id, input, user) {
  const config = await moduleRecordConfig(moduleKey, user);
  if (!config.permissions.edit) throw new AppError('You do not have edit permission for this page', 403);
  const existing = await repository.findRecordById(moduleKey, id);
  if (!existing) throw new AppError('Record not found', 404);
  const fields = mainFields(config).filter((field) => field.permissions?.edit !== false);
  const customFields = applyFormulaFields({
    ...existing.customFields,
    ...customFieldsFromInput(input, fields)
  }, fields);
  await validateFields(moduleKey, customFields, fields, id);
  await repository.updateRecord(moduleKey, id, customFields, user?.id);
  const detailTables = applyDetailTableFormulaFields(input.__detailTables || {}, config.fields, customFields);
  await repository.replaceDetailRows(id, config.fields, detailTables);
  const updated = await repository.findRecordById(moduleKey, id);
  await actionFlowRuntime.runRecordTrigger('record_updated', {
    moduleKey,
    recordId: id,
    record: updated,
    previousRecord: existing,
    userId: user?.id
  });
  if (existing.customFields?.status !== updated.customFields?.status) {
    await actionFlowRuntime.runRecordTrigger('status_changed', {
      moduleKey,
      recordId: id,
      record: updated,
      previousRecord: existing,
      userId: user?.id
    });
  }
  return getRecord(moduleKey, id, user);
}

async function deleteRecords(moduleKey, ids, user) {
  const config = await moduleRecordConfig(moduleKey, user);
  assertCustomPublishedModule(config);
  if (!config.permissions.delete) throw new AppError('You do not have delete permission for this page', 403);
  const existingRecords = [];
  for (const id of ids) {
    const record = await repository.findRecordById(moduleKey, id);
    if (record) existingRecords.push(record);
  }
  const deletedCount = await repository.deleteRecords(moduleKey, ids);
  for (const record of existingRecords) {
    await actionFlowRuntime.runRecordTrigger('record_deleted', {
      moduleKey,
      recordId: record.id,
      record,
      userId: user?.id
    });
  }
  return { deletedCount };
}

module.exports = {
  listMenuModules,
  moduleRecordConfig,
  listRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecords
};
