const { AppError } = require('../../shared/errors');
const repository = require('./module-config.repository');
const { customerModule, customerFields, userModule, userFields } = require('./module-config.defaults');

const defaultModules = new Map([
  [customerModule.moduleKey, { module: customerModule, fields: customerFields }],
  [userModule.moduleKey, { module: userModule, fields: userFields }]
]);
const fieldTypes = new Set(['text', 'email', 'phone', 'password', 'number', 'date', 'select', 'textarea', 'country', 'owner', 'checkbox']);
const lockedRequiredFields = new Map(Array.from(defaultModules.entries()).map(([moduleKey, config]) => [
  moduleKey,
  new Set(config.fields.filter((field) => field.required).map((field) => field.fieldKey))
]));

function slugFieldKey(label) {
  return String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+([a-z0-9])/g, (_match, letter) => letter.toUpperCase());
}

function modulePayload(module, fields) {
  return {
    module: {
      id: module.id,
      moduleKey: module.module_key,
      name: module.name,
      description: module.description,
      enabled: Boolean(module.is_enabled)
    },
    fields
  };
}

async function ensureDefaultConfig(moduleKey) {
  const config = defaultModules.get(moduleKey);
  if (!config) {
    throw new AppError('Module not found', 404);
  }

  const module = await repository.upsertModule(config.module);
  for (const field of config.fields) {
    await repository.upsertField(module.id, field);
  }
  return module;
}

async function ensureDefaultCustomerConfig() {
  return ensureDefaultConfig(customerModule.moduleKey);
}

async function ensureDefaultUserConfig() {
  return ensureDefaultConfig(userModule.moduleKey);
}

async function ensureAllDefaultConfigs() {
  await ensureDefaultCustomerConfig();
  await ensureDefaultUserConfig();
}

async function getModuleConfig(moduleKey) {
  if (defaultModules.has(moduleKey)) {
    await ensureDefaultConfig(moduleKey);
  }

  const module = await repository.findModuleByKey(moduleKey);
  if (!module) {
    throw new AppError('Module not found', 404);
  }

  const fields = await repository.listFields(moduleKey);
  return modulePayload(module, fields);
}

async function listModules() {
  await ensureAllDefaultConfigs();
  const modules = await repository.listModules();
  return Promise.all(modules.map(async (module) => ({
    ...modulePayload(module, await repository.listFields(module.module_key))
  })));
}

function normalizeOptions(input) {
  if (Array.isArray(input)) {
    return input.map((option) => String(option).trim()).filter(Boolean);
  }

  return String(input || '')
    .split(',')
    .map((option) => option.trim())
    .filter(Boolean);
}

async function createField(moduleKey, input) {
  const module = await repository.findModuleByKey(moduleKey);
  if (!module) throw new AppError('Module not found', 404);

  const fieldKey = slugFieldKey(input.fieldKey || input.label);
  if (!fieldKey) throw new AppError('Field label is required', 422);
  if (await repository.findField(moduleKey, fieldKey)) {
    throw new AppError('Field key already exists', 409);
  }
  if (!fieldTypes.has(input.type)) {
    throw new AppError('Unsupported field type', 422);
  }

  await repository.createCustomField(module.id, {
    fieldKey,
    label: input.label,
    type: input.type,
    options: normalizeOptions(input.options),
    required: Boolean(input.required),
    showInTable: input.showInTable !== false,
    showInForm: Boolean(input.required) || input.showInForm !== false,
    showInImport: Boolean(input.showInImport),
    searchable: Boolean(input.searchable),
    sortOrder: input.sortOrder || 100
  });

  return getModuleConfig(moduleKey);
}

async function updateField(moduleKey, fieldKey, input) {
  const field = await repository.findField(moduleKey, fieldKey);
  if (!field) throw new AppError('Field not found', 404);
  if (!fieldTypes.has(input.type || field.type)) {
    throw new AppError('Unsupported field type', 422);
  }

  const updates = {
    ...input,
    options: input.options === undefined ? undefined : normalizeOptions(input.options)
  };

  if (updates.required) {
    updates.showInForm = true;
  }

  if (field.locked) {
    delete updates.type;
    if (lockedRequiredFields.get(moduleKey)?.has(fieldKey)) {
      updates.required = true;
      updates.showInForm = true;
    }
  }

  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) delete updates[key];
  });

  await repository.updateField(moduleKey, fieldKey, updates);
  return getModuleConfig(moduleKey);
}

async function deleteField(moduleKey, fieldKey) {
  const field = await repository.findField(moduleKey, fieldKey);
  if (!field) throw new AppError('Field not found', 404);
  if (field.locked) throw new AppError('System fields cannot be deleted', 422);
  await repository.deleteField(moduleKey, fieldKey);
  return getModuleConfig(moduleKey);
}

module.exports = {
  ensureDefaultCustomerConfig,
  ensureDefaultUserConfig,
  ensureAllDefaultConfigs,
  getModuleConfig,
  listModules,
  createField,
  updateField,
  deleteField
};
