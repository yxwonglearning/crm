const { AppError } = require('../../shared/errors');
const repository = require('./module-config.repository');
const { customerModule, customerFields, userModule, userFields } = require('./module-config.defaults');

const defaultModules = new Map([
  [customerModule.moduleKey, { module: customerModule, fields: customerFields }],
  [userModule.moduleKey, { module: userModule, fields: userFields }]
]);
const fieldTypes = new Set([
  'textbox',
  'textarea',
  'checkbox',
  'dropdownbox',
  'int',
  'decimals',
  'browser_button',
  'date',
  'attach_document',
  'image',
  'text',
  'email',
  'phone',
  'password',
  'number',
  'select',
  'country',
  'owner'
]);
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

function moduleTableBase(moduleKey) {
  return String(moduleKey || 'module').replace(/s$/, '') || 'module';
}

async function resolveDetailTableName(moduleKey, moduleId, input = {}) {
  if (input.tableType !== 'detail') return null;
  if (input.detailTableName) return input.detailTableName;

  const existingFields = await repository.listFields(moduleKey);
  const existingDetailTable = existingFields.find((field) => field.tableType === 'detail' && field.detailTableName)?.detailTableName;
  if (existingDetailTable) return existingDetailTable;

  const allFields = await repository.listFields(moduleKey);
  const detailTableCount = new Set(allFields
    .filter((field) => field.tableType === 'detail' && field.detailTableName)
    .map((field) => field.detailTableName)).size;
  return `${moduleTableBase(moduleKey)}_dt${detailTableCount + 1}`;
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

  const tableType = input.tableType === 'detail' ? 'detail' : 'main';
  const detailTableName = await resolveDetailTableName(moduleKey, module.id, input);
  const field = {
    fieldKey,
    label: input.label,
    type: input.type,
    tableType,
    detailTableName,
    options: input.type === 'dropdownbox' ? normalizeOptions(input.options) : [],
    required: Boolean(input.required),
    showInTable: input.showInTable !== false,
    showInForm: Boolean(input.required) || input.showInForm !== false,
    showInImport: Boolean(input.showInImport),
    searchable: Boolean(input.searchable),
    sortOrder: await repository.nextSortOrder(module.id)
  };

  if (field.tableType === 'detail') {
    await repository.ensureDetailTableField(field.detailTableName, field.fieldKey, field.type);
  }

  await repository.createCustomField(module.id, field);

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
    options: input.options === undefined ? undefined : (input.type || field.type) === 'dropdownbox' ? normalizeOptions(input.options) : []
  };

  if (updates.required) {
    updates.showInForm = true;
  }

  if (field.locked) {
    delete updates.type;
    delete updates.tableType;
    delete updates.detailTableName;
  }

  if (updates.tableType === 'detail' && !updates.detailTableName) {
    const module = await repository.findModuleByKey(moduleKey);
    updates.detailTableName = await resolveDetailTableName(moduleKey, module.id, updates);
  }

  if (updates.tableType === 'main') {
    updates.detailTableName = null;
  }

  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) delete updates[key];
  });

  const nextTableType = updates.tableType || field.tableType;
  const nextDetailTableName = updates.detailTableName === undefined ? field.detailTableName : updates.detailTableName;
  const nextType = updates.type || field.type;
  if (nextTableType === 'detail') {
    await repository.ensureDetailTableField(nextDetailTableName, field.fieldKey, nextType);
  }

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
