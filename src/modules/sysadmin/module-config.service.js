const { AppError } = require('../../shared/errors');
const repository = require('./module-config.repository');
const { customerModule, customerFields, userModule, userFields } = require('./module-config.defaults');

const defaultModules = new Map([
  [customerModule.moduleKey, { module: customerModule, fields: customerFields }],
  [userModule.moduleKey, { module: userModule, fields: userFields }]
]);
const formTypes = ['add', 'edit', 'detail'];
const layoutStates = ['draft', 'published'];
const defaultBrowserButtons = [
  {
    browserKey: 'countries',
    name: 'Countries',
    sourceModule: 'countries',
    sourceTable: 'countries',
    valueField: 'id',
    displayField: 'name',
    searchFields: ['name', 'iso2', 'dial_code'],
    returnFields: ['name', 'dial_code'],
    system: true
  },
  {
    browserKey: 'users',
    name: 'Users / Owners',
    sourceModule: 'users',
    sourceTable: 'users',
    valueField: 'id',
    displayField: 'name',
    searchFields: ['name', 'email'],
    returnFields: ['name', 'email', 'role'],
    system: true
  },
  {
    browserKey: 'customers',
    name: 'Customers',
    sourceModule: 'customers',
    sourceTable: 'customers',
    valueField: 'id',
    displayField: 'company_name',
    searchFields: ['company_name', 'email', 'contact_person'],
    returnFields: ['company_name', 'email', 'contact_person'],
    system: true
  }
];
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

function slugBrowserKey(label) {
  return String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function defaultFormLayout(fields) {
  return {
    order: fields.map((field) => field.fieldKey),
    hidden: fields.filter((field) => !field.showInForm).map((field) => field.fieldKey)
  };
}

function defaultFormLayouts(fields) {
  const defaults = {};
  layoutStates.forEach((state) => {
    defaults[state] = {};
    formTypes.forEach((type) => {
      defaults[state][type] = defaultFormLayout(fields);
    });
  });
  return defaults;
}

function normalizeLayout(layout, fallback) {
  if (Array.isArray(layout)) {
    return {
      order: layout.map(String),
      hidden: [...fallback.hidden]
    };
  }
  return {
    order: Array.isArray(layout?.order) ? layout.order.map(String) : [...fallback.order],
    hidden: Array.isArray(layout?.hidden) ? layout.hidden.map(String) : [...fallback.hidden]
  };
}

async function moduleFormLayouts(moduleKey, fields) {
  const layouts = defaultFormLayouts(fields);
  const globallyHiddenFieldKeys = fields.filter((field) => !field.showInForm).map((field) => field.fieldKey);
  const savedLayouts = await repository.listFormLayouts(moduleKey);
  savedLayouts.forEach((saved) => {
    if (!layoutStates.includes(saved.state) || !formTypes.includes(saved.formType)) return;
    layouts[saved.state][saved.formType] = normalizeLayout(saved.layout, layouts[saved.state][saved.formType]);
  });
  layoutStates.forEach((state) => {
    formTypes.forEach((type) => {
      const hidden = new Set(layouts[state][type].hidden);
      globallyHiddenFieldKeys.forEach((fieldKey) => hidden.add(fieldKey));
      layouts[state][type].hidden = Array.from(hidden);
    });
  });
  return layouts;
}

function modulePayload(module, fields, formLayouts) {
  return {
    module: {
      id: module.id,
      moduleKey: module.module_key,
      name: module.name,
      description: module.description,
      enabled: Boolean(module.is_enabled)
    },
    fields,
    formLayouts
  };
}

async function withFieldDataCounts(moduleKey, fields) {
  return Promise.all(fields.map(async (field) => ({
    ...field,
    dataCount: field.locked ? 0 : await repository.fieldDataCount(moduleKey, field)
  })));
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

async function ensureDefaultBrowserButtons() {
  for (const browser of defaultBrowserButtons) {
    const existing = await repository.findBrowserButton(browser.browserKey);
    if (!existing) {
      await repository.upsertBrowserButton(browser);
    }
  }
}

async function getModuleConfig(moduleKey) {
  if (defaultModules.has(moduleKey)) {
    await ensureDefaultConfig(moduleKey);
  }

  const module = await repository.findModuleByKey(moduleKey);
  if (!module) {
    throw new AppError('Module not found', 404);
  }

  const fields = await withFieldDataCounts(moduleKey, await repository.listFields(moduleKey));
  return modulePayload(module, fields, await moduleFormLayouts(moduleKey, fields));
}

async function listModules() {
  await ensureAllDefaultConfigs();
  const modules = await repository.listModules();
  return Promise.all(modules.map(async (module) => {
    const fields = await withFieldDataCounts(module.module_key, await repository.listFields(module.module_key));
    return modulePayload(module, fields, await moduleFormLayouts(module.module_key, fields));
  }));
}

function normalizeStringList(input) {
  if (Array.isArray(input)) {
    return input.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(input || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function assertConfigKey(value, label) {
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(String(value || ''))) {
    throw new AppError(`${label} must start with a letter and use only letters, numbers, or underscores`, 422);
  }
}

function normalizeBrowserFilter(input = {}, existing = {}) {
  const where = String(input?.where ?? existing?.where ?? '').trim();
  if (!where) return {};
  if (/[;]/.test(where) || /--|\/\*/.test(where)) {
    throw new AppError('SQL WHERE condition cannot include statement separators or comments', 422);
  }
  return { where };
}

function normalizeBrowserButton(input = {}, existing = null) {
  const browserKey = existing?.browserKey || slugBrowserKey(input.browserKey || input.name);
  if (!browserKey) throw new AppError('Browser key is required', 422);
  assertConfigKey(browserKey, 'Browser key');

  const name = String(input.name ?? existing?.name ?? '').trim();
  const sourceModule = String(input.sourceModule ?? existing?.sourceModule ?? '').trim();
  const sourceTable = String(input.sourceTable ?? existing?.sourceTable ?? '').trim();
  const valueField = String(input.valueField ?? existing?.valueField ?? 'id').trim();
  const displayField = String(input.displayField ?? existing?.displayField ?? '').trim();
  if (!name || !sourceModule || !sourceTable || !valueField || !displayField) {
    throw new AppError('Browser name, source, value field, and display field are required', 422);
  }
  [sourceModule, sourceTable, valueField, displayField].forEach((value) => assertConfigKey(value, 'Browser source settings'));

  return {
    browserKey,
    name,
    sourceModule,
    sourceTable,
    valueField,
    displayField,
    searchFields: normalizeStringList(input.searchFields ?? existing?.searchFields),
    returnFields: normalizeStringList(input.returnFields ?? existing?.returnFields),
    filter: normalizeBrowserFilter(input.filter, input.filter === undefined ? existing?.filter : {}),
    system: Boolean(existing?.system || input.system),
    enabled: input.enabled === undefined ? existing?.enabled !== false : Boolean(input.enabled)
  };
}

function normalizeLookupConfig(input = {}, type = '') {
  if (type !== 'browser_button') return {};
  const browserButtonKey = String(input.browserButtonKey || '').trim();
  return browserButtonKey ? { browserButtonKey } : {};
}

async function listBrowserButtons() {
  await ensureDefaultBrowserButtons();
  return repository.listBrowserButtons();
}

async function saveBrowserButton(input) {
  await ensureDefaultBrowserButtons();
  const browser = normalizeBrowserButton(input);
  const existing = await repository.findBrowserButton(browser.browserKey);
  if (existing && existing.system) {
    throw new AppError('System browser buttons cannot be replaced', 422);
  }
  await repository.upsertBrowserButton(browser);
  return listBrowserButtons();
}

async function updateBrowserButton(browserKey, input) {
  await ensureDefaultBrowserButtons();
  const existing = await repository.findBrowserButton(browserKey);
  if (!existing) throw new AppError('Browser button not found', 404);
  const browser = normalizeBrowserButton(input, existing);
  await repository.upsertBrowserButton(browser);
  return listBrowserButtons();
}

async function deleteBrowserButton(browserKey) {
  const existing = await repository.findBrowserButton(browserKey);
  if (!existing) throw new AppError('Browser button not found', 404);
  if (existing.system) throw new AppError('System browser buttons cannot be deleted', 422);
  const usageCount = await repository.browserButtonUsageCount(browserKey);
  if (usageCount > 0) {
    throw new AppError('Browser button is used by fields and cannot be deleted', 422);
  }
  await repository.deleteBrowserButton(browserKey);
  return listBrowserButtons();
}

async function listArchivedFields(moduleKey) {
  const module = await repository.findModuleByKey(moduleKey);
  if (!module) throw new AppError('Module not found', 404);
  return withFieldDataCounts(moduleKey, await repository.listArchivedFields(moduleKey));
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

function isDropdownOptionFieldType(type) {
  return type === 'dropdownbox' || type === 'select';
}

function normalizeFormulaExpression(input) {
  return String(input || '').trim();
}

function normalizeFormulaScript(input) {
  return String(input || '').trim();
}

function optionalNumber(value) {
  if (value === '' || value === null || value === undefined) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function normalizeValidationRules(input = {}) {
  const rules = {};
  const minLength = optionalNumber(input.minLength);
  const maxLength = optionalNumber(input.maxLength);
  const minValue = optionalNumber(input.minValue);
  const maxValue = optionalNumber(input.maxValue);
  if (minLength !== undefined) rules.minLength = Math.trunc(minLength);
  if (maxLength !== undefined) rules.maxLength = Math.trunc(maxLength);
  if (minValue !== undefined) rules.minValue = minValue;
  if (maxValue !== undefined) rules.maxValue = maxValue;
  if (rules.minLength !== undefined && rules.maxLength !== undefined && rules.minLength > rules.maxLength) {
    throw new AppError('Minimum length cannot be greater than maximum length', 422);
  }
  if (rules.minValue !== undefined && rules.maxValue !== undefined && rules.minValue > rules.maxValue) {
    throw new AppError('Minimum value cannot be greater than maximum value', 422);
  }

  const regex = String(input.regex || '').trim();
  if (regex) {
    try {
      RegExp(regex);
    } catch (_error) {
      throw new AppError('Validation regex is invalid', 422);
    }
    rules.regex = regex;
  }

  const conditionalRequiredField = String(input.conditionalRequiredField || '').trim();
  if (conditionalRequiredField) {
    rules.conditionalRequiredField = conditionalRequiredField;
    rules.conditionalRequiredValue = String(input.conditionalRequiredValue || '').trim();
  }
  if (input.unique) rules.unique = true;
  return rules;
}

function normalizeFormulaFunctionName(input) {
  return String(input || '').trim().toUpperCase();
}

function assertFormulaFunctionName(name) {
  if (name && !/^[A-Z][A-Z0-9_]*$/.test(name)) {
    throw new AppError('Formula function name must use uppercase letters, numbers, or underscores', 422);
  }
}

function moduleTableBase(moduleKey) {
  return String(moduleKey || 'module').replace(/s$/, '') || 'module';
}

function assertDetailTableName(name) {
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(String(name || ''))) {
    throw new AppError('Detail table name must start with a letter and use only letters, numbers, or underscores', 422);
  }
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
  const formulaFunctionName = normalizeFormulaFunctionName(input.formulaFunctionName);
  assertFormulaFunctionName(formulaFunctionName);

  const tableType = input.tableType === 'detail' ? 'detail' : 'main';
  const detailTableName = await resolveDetailTableName(moduleKey, module.id, input);
  const field = {
    fieldKey,
    label: input.label,
    type: input.type,
    tableType,
    detailTableName,
    options: isDropdownOptionFieldType(input.type) ? normalizeOptions(input.options) : [],
    formulaExpression: normalizeFormulaExpression(input.formulaExpression),
    formulaEnabled: Boolean(input.formulaEnabled && normalizeFormulaExpression(input.formulaExpression)),
    formulaJs: normalizeFormulaScript(input.formulaJs),
    formulaFunctionName,
    formulaFunctionBody: normalizeFormulaScript(input.formulaFunctionBody),
    formulaSql: normalizeFormulaScript(input.formulaSql),
    validationRules: normalizeValidationRules(input.validationRules),
    lookupConfig: normalizeLookupConfig(input.lookupConfig, input.type),
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
  const formulaFunctionName = input.formulaFunctionName === undefined ? undefined : normalizeFormulaFunctionName(input.formulaFunctionName);
  assertFormulaFunctionName(formulaFunctionName);

  const updates = {
    ...input,
    options: input.options === undefined ? undefined : isDropdownOptionFieldType(input.type || field.type) ? normalizeOptions(input.options) : [],
    formulaExpression: input.formulaExpression === undefined ? undefined : normalizeFormulaExpression(input.formulaExpression),
    formulaEnabled: input.formulaEnabled === undefined ? undefined : Boolean(input.formulaEnabled && normalizeFormulaExpression(input.formulaExpression ?? field.formulaExpression)),
    formulaJs: input.formulaJs === undefined ? undefined : normalizeFormulaScript(input.formulaJs),
    formulaFunctionName,
    formulaFunctionBody: input.formulaFunctionBody === undefined ? undefined : normalizeFormulaScript(input.formulaFunctionBody),
    formulaSql: input.formulaSql === undefined ? undefined : normalizeFormulaScript(input.formulaSql),
    validationRules: input.validationRules === undefined ? undefined : normalizeValidationRules(input.validationRules),
    lookupConfig: input.lookupConfig === undefined ? undefined : normalizeLookupConfig(input.lookupConfig, input.type || field.type)
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

async function renameDetailTable(moduleKey, oldTableName, input) {
  const newTableName = String(input.detailTableName || '').trim();
  assertDetailTableName(oldTableName);
  assertDetailTableName(newTableName);
  if (oldTableName === newTableName) return getModuleConfig(moduleKey);

  const fields = await repository.listFields(moduleKey);
  const tableFields = fields.filter((field) => field.tableType === 'detail' && field.detailTableName === oldTableName);
  if (!tableFields.length) throw new AppError('Detail table not found', 404);

  const nameUsedByAnotherTable = fields.some((field) => (
    field.tableType === 'detail'
    && field.detailTableName === newTableName
    && field.detailTableName !== oldTableName
  ));
  if (nameUsedByAnotherTable) {
    throw new AppError('Detail table name already exists', 409);
  }

  await repository.renameDetailTable(moduleKey, oldTableName, newTableName);
  return getModuleConfig(moduleKey);
}

async function saveFormLayout(moduleKey, state, formType, input) {
  if (!layoutStates.includes(state)) throw new AppError('Unsupported layout state', 422);
  if (!formTypes.includes(formType)) throw new AppError('Unsupported form type', 422);

  const module = await repository.findModuleByKey(moduleKey);
  if (!module) throw new AppError('Module not found', 404);

  const fields = await repository.listFields(moduleKey);
  const fallback = defaultFormLayout(fields);
  const layout = normalizeLayout(input, fallback);
  const knownFieldKeys = new Set(fields.map((field) => field.fieldKey));
  layout.order = layout.order.filter((fieldKey, index, list) => knownFieldKeys.has(fieldKey) && list.indexOf(fieldKey) === index);
  layout.hidden = layout.hidden.filter((fieldKey, index, list) => knownFieldKeys.has(fieldKey) && list.indexOf(fieldKey) === index);

  await repository.upsertFormLayout(moduleKey, state, formType, layout);
  return getModuleConfig(moduleKey);
}

async function publishFormLayout(moduleKey, formType, input) {
  await saveFormLayout(moduleKey, 'draft', formType, input);
  return saveFormLayout(moduleKey, 'published', formType, input);
}

async function deleteField(moduleKey, fieldKey) {
  const field = await repository.findField(moduleKey, fieldKey);
  if (!field) throw new AppError('Field not found', 404);
  if (field.locked) throw new AppError('System fields cannot be deleted', 422);
  const dataCount = await repository.fieldDataCount(moduleKey, field);
  if (dataCount > 0) {
    throw new AppError('Fields with data cannot be deleted', 422);
  }
  await repository.deleteField(moduleKey, fieldKey);
  return getModuleConfig(moduleKey);
}

async function archiveField(moduleKey, fieldKey) {
  const field = await repository.findField(moduleKey, fieldKey);
  if (!field) throw new AppError('Field not found', 404);
  if (field.locked) throw new AppError('System fields cannot be archived', 422);
  await repository.archiveField(moduleKey, fieldKey);
  return getModuleConfig(moduleKey);
}

async function unarchiveField(moduleKey, fieldKey) {
  const field = await repository.findField(moduleKey, fieldKey);
  if (!field) throw new AppError('Field not found', 404);
  if (field.locked) throw new AppError('System fields cannot be restored', 422);
  await repository.unarchiveField(moduleKey, fieldKey);
  return getModuleConfig(moduleKey);
}

module.exports = {
  ensureDefaultCustomerConfig,
  ensureDefaultUserConfig,
  ensureAllDefaultConfigs,
  getModuleConfig,
  listModules,
  listArchivedFields,
  listBrowserButtons,
  saveBrowserButton,
  updateBrowserButton,
  deleteBrowserButton,
  createField,
  updateField,
  renameDetailTable,
  saveFormLayout,
  publishFormLayout,
  deleteField,
  archiveField,
  unarchiveField
};
