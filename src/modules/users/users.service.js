const bcrypt = require('bcryptjs');
const { AppError } = require('../../shared/errors');
const moduleConfig = require('../sysadmin/module-config.service');
const repository = require('./users.repository');
const { validateFieldValue } = require('../../shared/field-validation');

const systemFieldKeys = new Set(['name', 'staffId', 'email', 'password', 'role', 'status']);

function parseCustomFields(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return {};
  }
}

function normalizeUser(row) {
  if (!row) return null;
  return {
    ...row,
    custom_fields: parseCustomFields(row.custom_fields)
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

function generatedStaffId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `STF-${timestamp}-${suffix}`;
}

function normalizedStaffId(input) {
  return String(input?.staffId || '').trim() || generatedStaffId();
}

async function userFieldConfig() {
  return moduleConfig.getModuleConfig('users');
}

async function validateConfiguredFields(input, fields, excludeId = null) {
  for (const field of fields) {
    if (excludeId && field.fieldKey === 'password' && (input.password === undefined || String(input.password).trim() === '')) {
      continue;
    }
    await validateFieldValue(field, input[field.fieldKey], input, {
      uniqueChecker: field.validationRules?.unique
        ? (uniqueField, value) => repository.countFieldValue(uniqueField, value, excludeId)
        : null
    });
  }
}

async function customFieldsFromInput(input, fields) {
  const config = await userFieldConfig();
  const customFields = {};

  (fields || config.fields)
    .filter((field) => !systemFieldKeys.has(field.fieldKey))
    .forEach((field) => {
      const value = input[field.fieldKey];
      if (value !== undefined) {
        customFields[field.fieldKey] = normalizeCustomFieldValue(field, value);
      }
    });

  return customFields;
}

async function listUsers(filters = {}) {
  const config = await userFieldConfig();
  const users = await repository.listUsers(filters, config.fields);
  return users.map(normalizeUser);
}

async function createUser(input) {
  const fieldConfig = await userFieldConfig();
  const staffId = normalizedStaffId(input);
  const normalizedInput = {
    ...input,
    staffId
  };
  await validateConfiguredFields(normalizedInput, fieldConfig.fields);
  const password = String(input.password).trim();
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const id = await repository.createUser({
      name: normalizedInput.name,
      staffId,
      email: normalizedInput.email,
      passwordHash,
      role: normalizedInput.role,
      status: normalizedInput.status,
      customFields: await customFieldsFromInput(normalizedInput, fieldConfig.fields)
    });
    const created = await repository.findUserCredentialsById(id);
    if (!created || !await bcrypt.compare(password, created.password_hash)) {
      throw new AppError('User password could not be saved correctly', 500);
    }
    return { id, user: { id } };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError('A user with this email or staff ID already exists', 409);
    }
    throw error;
  }
}

async function updateUser(id, input) {
  const existing = await repository.findUserById(id);
  if (!existing) {
    throw new AppError('User not found', 404);
  }

  const updates = {};
  const config = await userFieldConfig();
  const existingCustomFields = parseCustomFields(existing.custom_fields);
  await validateConfiguredFields({
    ...existing,
    ...existingCustomFields,
    ...input
  }, config.fields, id);
  if (input.name) updates.name = input.name;
  if (input.staffId !== undefined) updates.staff_id = input.staffId || null;
  if (input.email) updates.email = input.email.toLowerCase();
  if (input.role) updates.role = input.role;
  if (input.status) updates.status = input.status;
  if (input.password) {
    const password = String(input.password).trim();
    updates.password_hash = await bcrypt.hash(password, 12);
  }
  updates.custom_fields = JSON.stringify({
    ...existingCustomFields,
    ...await customFieldsFromInput(input, config.fields)
  });

  try {
    await repository.updateUser(id, updates);
    if (input.password) {
      const updated = await repository.findUserCredentialsById(id);
      if (!updated || !await bcrypt.compare(String(input.password).trim(), updated.password_hash)) {
        throw new AppError('User password could not be saved correctly', 500);
      }
    }
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError('A user with this email or staff ID already exists', 409);
    }
    throw error;
  }
}

module.exports = { userFieldConfig, listUsers, createUser, updateUser };
