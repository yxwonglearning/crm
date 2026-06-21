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

async function customerFieldConfig() {
  return moduleConfig.getModuleConfig('customers');
}

async function customFieldsFromInput(input) {
  const config = await customerFieldConfig();
  const customFields = {};

  config.fields
    .filter((field) => !systemFieldKeys.has(field.fieldKey))
    .forEach((field) => {
      const value = input[field.fieldKey];
      if (field.required && (value === undefined || value === null || String(value).trim() === '')) {
        throw new AppError(`${field.label} is required`, 422);
      }
      if (value !== undefined) {
        customFields[field.fieldKey] = field.type === 'checkbox' ? Boolean(value) : value;
      }
    });

  return customFields;
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
    ownerUserId: input.ownerUserId || null,
    userId
  };
}

async function listCustomers(filters) {
  const customers = await repository.listCustomers(filters);
  return customers.map(normalizeCustomer);
}

async function createCustomer(input, userId) {
  const customer = await hydrateCustomerInput(input, userId);
  const id = await repository.createCustomer(customer);
  return normalizeCustomer(await repository.findCustomerById(id));
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
  return normalizeCustomer(await repository.findCustomerById(id));
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
