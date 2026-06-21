const bcrypt = require('bcryptjs');
const { AppError } = require('../../shared/errors');
const moduleConfig = require('../sysadmin/module-config.service');
const repository = require('./users.repository');

const systemFieldKeys = new Set(['name', 'email', 'password', 'role', 'status']);

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

async function userFieldConfig() {
  return moduleConfig.getModuleConfig('users');
}

async function customFieldsFromInput(input) {
  const config = await userFieldConfig();
  const customFields = {};

  config.fields
    .filter((field) => !systemFieldKeys.has(field.fieldKey))
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

async function listUsers() {
  const users = await repository.listUsers();
  return users.map(normalizeUser);
}

async function createUser(input) {
  const password = String(input.password).trim();
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const id = await repository.createUser({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      status: input.status,
      customFields: await customFieldsFromInput(input)
    });
    const created = await repository.findUserCredentialsById(id);
    if (!created || !await bcrypt.compare(password, created.password_hash)) {
      throw new AppError('User password could not be saved correctly', 500);
    }
    return { id };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError('A user with this email already exists', 409);
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
  if (input.name) updates.name = input.name;
  if (input.email) updates.email = input.email.toLowerCase();
  if (input.role) updates.role = input.role;
  if (input.status) updates.status = input.status;
  if (input.password) {
    const password = String(input.password).trim();
    updates.password_hash = await bcrypt.hash(password, 12);
  }
  updates.custom_fields = JSON.stringify({
    ...parseCustomFields(existing.custom_fields),
    ...await customFieldsFromInput(input)
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
      throw new AppError('A user with this email already exists', 409);
    }
    throw error;
  }
}

module.exports = { userFieldConfig, listUsers, createUser, updateUser };
