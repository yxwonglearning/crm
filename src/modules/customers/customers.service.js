const { AppError } = require('../../shared/errors');
const countries = require('../countries/countries.repository');
const moduleConfig = require('../sysadmin/module-config.service');
const permissions = require('../permissions/permissions.service');
const repository = require('./customers.repository');
const { normalizePhone } = require('./phone');
const { validateFieldValue } = require('../../shared/field-validation');

const systemFieldKeys = new Set([
  'companyName',
  'contactPerson',
  'email',
  'countryId',
  'phoneNumber',
  'status',
  'notes',
  'ownerUserId'
]);

function parseCustomFields(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return {};
  }
}

function normalizeCustomer(row) {
  if (!row) return null;
  return {
    ...row,
    custom_fields: parseCustomFields(row.custom_fields)
  };
}

async function baseCustomerFieldConfig() {
  return moduleConfig.getModuleConfig('customers');
}

async function customerFieldConfig(user = null) {
  const config = await baseCustomerFieldConfig();
  if (!user) return config;
  return {
    ...config,
    permissions: await permissions.userModulePermissions('customers', user),
    fields: await permissions.decorateFieldsForUser('customers', user, config.fields)
  };
}

async function hydrateDetailValues(customer) {
  if (!customer) return null;
  const config = await baseCustomerFieldConfig();
  const detailTables = await repository.detailRowsByCustomerId(customer.id, config.fields);
  const detailValues = {};
  Object.values(detailTables).forEach((rows) => {
    const firstRow = rows[0];
    if (!firstRow) return;
    Object.keys(firstRow)
      .filter((key) => !['id', 'mainid'].includes(key))
      .forEach((key) => {
        detailValues[key] = firstRow[key];
      });
  });
  return {
    ...customer,
    detail_tables: detailTables,
    custom_fields: {
      ...customer.custom_fields,
      ...detailValues
    }
  };
}

function normalizeCustomFieldValue(field, value) {
  if (field.type === 'checkbox') return Boolean(value);
  if (field.type === 'int') {
    if (value === '' || value === null || value === undefined) return '';
    return Number.parseInt(value, 10);
  }
  if (field.type === 'decimals') {
    if (value === '' || value === null || value === undefined) return '';
    return Number(value);
  }
  return value;
}

function numericValue(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

function coerceFormulaValue(value) {
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value === null || value === undefined || value === '') return '';
  const number = Number(value);
  return Number.isFinite(number) && String(value).trim() !== '' ? number : value;
}

function buildCustomFormulaFunctions(source = '', name = '', body = '') {
  const functions = {};
  try {
    if (String(source || '').trim()) {
      const sourceFunctions = Function(`"use strict"; ${source}`)();
      if (!sourceFunctions || typeof sourceFunctions !== 'object' || Array.isArray(sourceFunctions)) {
        throw new AppError('Custom formula code must return functions', 422);
      }
      Object.assign(functions, sourceFunctions);
    }
    const functionName = String(name || '').trim().toUpperCase();
    const functionBody = String(body || '').trim();
    if (functionName && functionBody) {
      functions[functionName] = Function('value', `"use strict"; ${functionBody}`);
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
  let compiled = String(expression)
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
  fields
    .filter((field) => field.tableType !== 'detail' && field.formulaEnabled && field.formulaExpression)
    .forEach((field) => {
      values[field.fieldKey] = evaluateFormulaExpression(field.formulaExpression, values, field.formulaJs, field.formulaFunctionName, field.formulaFunctionBody, fields);
    });
  return values;
}

async function validateConfiguredFields(input, fields, excludeId = null) {
  for (const field of fields.filter((item) => item.tableType !== 'detail')) {
    await validateFieldValue(field, input[field.fieldKey], input, {
      uniqueChecker: field.validationRules?.unique
        ? (uniqueField, value) => repository.countFieldValue(uniqueField, value, excludeId)
        : null
    });
  }
}

function customFieldsFromInput(input, fields) {
  const customFields = {};

  fields
    .filter((field) => !systemFieldKeys.has(field.fieldKey) && field.tableType !== 'detail')
    .forEach((field) => {
      const value = input[field.fieldKey];
      if (value !== undefined) {
        customFields[field.fieldKey] = normalizeCustomFieldValue(field, value);
      }
    });

  return customFields;
}

function normalizeDetailRows(inputRows, fields) {
  if (!Array.isArray(inputRows)) return [];
  return inputRows
    .map((row) => {
      const normalized = {};
      fields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(row, field.fieldKey)) {
          normalized[field.fieldKey] = normalizeCustomFieldValue(field, row[field.fieldKey]);
        }
      });
      return normalized;
    })
    .filter((row) => fields.some((field) => {
      const value = row[field.fieldKey];
      if (field.type === 'checkbox') return Boolean(value);
      return value !== undefined && value !== null && String(value).trim() !== '';
    }));
}

async function detailTablesFromInput(input) {
  const config = await baseCustomerFieldConfig();
  const detailTables = {};
  const inputTables = input.__detailTables || {};
  const fieldsByTable = new Map();

  config.fields
    .filter((field) => !systemFieldKeys.has(field.fieldKey) && field.tableType === 'detail' && field.detailTableName)
    .forEach((field) => {
      if (!fieldsByTable.has(field.detailTableName)) {
        fieldsByTable.set(field.detailTableName, []);
      }
      fieldsByTable.get(field.detailTableName).push(field);
    });

  for (const [tableName, fields] of fieldsByTable.entries()) {
    const rows = normalizeDetailRows(inputTables[tableName], fields);
    for (const row of rows) {
      for (const field of fields) {
        await validateFieldValue(field, row[field.fieldKey], row);
      }
    }
    detailTables[tableName] = rows;
  }

  return detailTables;
}

async function assertSubmittedFieldsAllowed(input, fields, user, action) {
  const submittedKeys = new Set(Object.keys(input || {}));
  Object.values(input.__detailTables || {}).forEach((rows) => {
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      Object.keys(row || {}).forEach((key) => submittedKeys.add(key));
    });
  });

  for (const field of fields) {
    if (submittedKeys.has(field.fieldKey)) {
      await permissions.assertFieldActionAllowed('customers', user, fields, field.fieldKey, action);
    }
  }
}

function sanitizeCustomerForUser(customer, fields, permissionMap) {
  if (!customer || !permissionMap.size) return customer;
  const allowedFields = fields.filter((field) => permissionMap.get(field.fieldKey)?.view);
  const allowedFieldKeys = new Set(allowedFields.map((field) => field.fieldKey));
  const allowedDataKeys = new Set(allowedFields.map((field) => field.dataKey).filter(Boolean));
  const sanitized = {
    ...customer,
    custom_fields: Object.fromEntries(
      Object.entries(customer.custom_fields || {}).filter(([key]) => allowedFieldKeys.has(key))
    )
  };

  fields.forEach((field) => {
    if (field.dataKey && !allowedDataKeys.has(field.dataKey)) {
      delete sanitized[field.dataKey];
    }
  });

  return sanitized;
}

async function hydrateCustomerInput(input, user, options = {}) {
  const config = await baseCustomerFieldConfig();
  await assertSubmittedFieldsAllowed(input, config.fields, user, options.action || 'create');
  const formulaInput = applyFormulaFields(input, config.fields);
  await validateConfiguredFields(formulaInput, config.fields, options.excludeId || null);
  const country = await countries.findCountryById(input.countryId);
  if (!country) {
    throw new AppError('Selected country does not exist', 422);
  }

  const phone = normalizePhone(country.dial_code, input.phoneNumber);
  if (!phone.phoneNumber) {
    throw new AppError('Contact number is required', 422);
  }

  return {
    companyName: input.companyName,
    contactPerson: input.contactPerson,
    email: input.email || null,
    countryId: input.countryId,
    phoneCountryCode: phone.phoneCountryCode,
    phoneNumber: phone.phoneNumber,
    status: input.status || 'lead',
    notes: input.notes || null,
    customFields: customFieldsFromInput(formulaInput, config.fields),
    detailTables: await detailTablesFromInput(input),
    ownerUserId: input.ownerUserId || null,
    userId: user.id
  };
}

async function listCustomers(filters, user) {
  const config = await baseCustomerFieldConfig();
  const permissionMap = await permissions.userFieldPermissions('customers', user, config.fields);
  const customers = await repository.listCustomers(filters);
  const hydrated = await Promise.all(customers.map(async (customer) => hydrateDetailValues(normalizeCustomer(customer))));
  return hydrated.map((customer) => sanitizeCustomerForUser(customer, config.fields, permissionMap));
}

async function createCustomer(input, user) {
  const customer = await hydrateCustomerInput(input, user, { action: 'create' });
  const id = await repository.createCustomer(customer);
  await repository.upsertDetailRows(id, (await baseCustomerFieldConfig()).fields, customer.detailTables || {});
  return hydrateDetailValues(normalizeCustomer(await repository.findCustomerById(id)));
}

async function updateCustomer(id, input, user) {
  const existing = await repository.findCustomerById(id);
  if (!existing) {
    throw new AppError('Customer not found', 404);
  }

  const customer = await hydrateCustomerInput(input, user, { excludeId: id, action: 'edit' });
  customer.customFields = {
    ...parseCustomFields(existing.custom_fields),
    ...customer.customFields
  };
  await repository.updateCustomer(id, customer);
  await repository.upsertDetailRows(id, (await baseCustomerFieldConfig()).fields, customer.detailTables || {});
  return hydrateDetailValues(normalizeCustomer(await repository.findCustomerById(id)));
}

async function deleteCustomers(ids) {
  if (!ids.length) {
    throw new AppError('Select at least one customer to delete', 422);
  }

  return repository.deleteCustomers(ids);
}

module.exports = {
  customerFieldConfig,
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomers,
  hydrateCustomerInput
};
