const { AppError } = require('../../shared/errors');
const countries = require('../countries/countries.repository');
const moduleConfig = require('../sysadmin/module-config.service');
const repository = require('./customers.repository');
const { normalizePhone } = require('./phone');

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

async function hydrateDetailValues(customer) {
  if (!customer) return null;
  const config = await customerFieldConfig();
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

async function customerFieldConfig() {
  return moduleConfig.getModuleConfig('customers');
}

async function customFieldsFromInput(input) {
  const config = await customerFieldConfig();
  const customFields = {};

  config.fields
    .filter((field) => !systemFieldKeys.has(field.fieldKey) && field.tableType !== 'detail')
    .forEach((field) => {
      const value = input[field.fieldKey];
      if (field.required && (value === undefined || value === null || String(value).trim() === '')) {
        throw new AppError(`${field.label} is required`, 422);
      }
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
  const config = await customerFieldConfig();
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

  fieldsByTable.forEach((fields, tableName) => {
    const rows = normalizeDetailRows(inputTables[tableName], fields);
    rows.forEach((row) => {
      fields.forEach((field) => {
        const value = row[field.fieldKey];
        if (field.required && (value === undefined || value === null || String(value).trim() === '')) {
          throw new AppError(`${field.label} is required`, 422);
        }
      });
    });
    detailTables[tableName] = rows;
  });

  return detailTables;
}

async function hydrateCustomerInput(input, userId) {
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
    customFields: await customFieldsFromInput(input),
    detailTables: await detailTablesFromInput(input),
    ownerUserId: input.ownerUserId || null,
    userId
  };
}

async function listCustomers(filters) {
  const customers = await repository.listCustomers(filters);
  return Promise.all(customers.map(async (customer) => hydrateDetailValues(normalizeCustomer(customer))));
}

async function createCustomer(input, userId) {
  const customer = await hydrateCustomerInput(input, userId);
  const id = await repository.createCustomer(customer);
  await repository.upsertDetailRows(id, (await customerFieldConfig()).fields, customer.detailTables || {});
  return hydrateDetailValues(normalizeCustomer(await repository.findCustomerById(id)));
}

async function updateCustomer(id, input, userId) {
  const existing = await repository.findCustomerById(id);
  if (!existing) {
    throw new AppError('Customer not found', 404);
  }

  const customer = await hydrateCustomerInput(input, userId);
  customer.customFields = {
    ...parseCustomFields(existing.custom_fields),
    ...customer.customFields
  };
  await repository.updateCustomer(id, customer);
  await repository.upsertDetailRows(id, (await customerFieldConfig()).fields, customer.detailTables || {});
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
