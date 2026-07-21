const { AppError } = require('../../shared/errors');
const { formulaDependencyGraph } = require('../../shared/formula-dependencies');
const repository = require('./module-config.repository');
const { findModuleTemplate } = require('./module-templates');
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
    returnFields: ['name', 'iso2', 'dial_code'],
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
const moduleStatuses = new Set(['draft', 'published', 'archived']);

function slugModuleKey(label) {
  return slugBrowserKey(label);
}

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
  const mainFieldKeys = fields
    .filter((field) => field.tableType !== 'detail')
    .map((field) => field.fieldKey);
  return {
    order: fields.map((field) => field.fieldKey),
    hidden: fields.filter((field) => !field.showInForm).map((field) => field.fieldKey),
    fieldSpans: {},
    sections: [
      {
        id: 'section_general',
        title: 'General',
        columns: 1,
        fieldKeys: mainFieldKeys
      }
    ]
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
      hidden: [...fallback.hidden],
      fieldSpans: { ...(fallback.fieldSpans || {}) },
      sections: [...fallback.sections]
    };
  }
  const fallbackSection = fallback.sections[0] || {
    id: 'section_general',
    title: 'General',
    columns: 1,
    fieldKeys: []
  };
  const sections = Array.isArray(layout?.sections) && layout.sections.length
    ? layout.sections.map((section, index) => ({
      id: String(section?.id || `section_${index + 1}`).trim().slice(0, 80) || `section_${index + 1}`,
      title: String(section?.title || `Section ${index + 1}`).trim().slice(0, 120) || `Section ${index + 1}`,
      columns: Math.min(3, Math.max(1, Number(section?.columns) || 1)),
      fieldKeys: Array.isArray(section?.fieldKeys) ? section.fieldKeys.map(String) : []
    }))
    : [{ ...fallbackSection, fieldKeys: [...fallbackSection.fieldKeys] }];
  return {
    order: Array.isArray(layout?.order) ? layout.order.map(String) : [...fallback.order],
    hidden: Array.isArray(layout?.hidden) ? layout.hidden.map(String) : [...fallback.hidden],
    fieldSpans: Object.fromEntries(Object.entries(layout?.fieldSpans || fallback.fieldSpans || {})
      .map(([fieldKey, span]) => [fieldKey, Math.min(3, Math.max(1, Number(span) || 1))])),
    sections
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
      status: module.module_status || (module.is_enabled ? 'published' : 'archived'),
      showInMenu: Boolean(module.show_in_menu),
      system: Boolean(module.is_system),
      enabled: Boolean(module.is_enabled)
    },
    fields,
    formLayouts
  };
}

async function configSnapshot(moduleKey) {
  const module = await repository.findModuleByKey(moduleKey);
  if (!module) throw new AppError('Module not found', 404);
  return {
    module: {
      moduleKey: module.module_key,
      name: module.name,
      description: module.description,
      status: module.module_status || (module.is_enabled ? 'published' : 'archived'),
      showInMenu: Boolean(module.show_in_menu),
      system: Boolean(module.is_system),
      enabled: Boolean(module.is_enabled)
    },
    fields: await repository.listAllFields(moduleKey),
    formLayouts: (await repository.listFormLayouts(moduleKey)).reduce((layouts, saved) => {
      if (!layouts[saved.state]) layouts[saved.state] = {};
      layouts[saved.state][saved.formType] = saved.layout;
      return layouts;
    }, {})
  };
}

async function recordConfigChange(moduleKey, details) {
  const versionId = details.versionId || (await ensureInitialConfigVersion(moduleKey))?.id || null;
  return repository.createConfigAuditLog(moduleKey, {
    versionId,
    action: details.action,
    targetType: details.targetType,
    targetKey: details.targetKey,
    summary: details.summary,
    before: details.before,
    after: details.after,
    userId: details.user?.id
  });
}

async function ensureInitialConfigVersion(moduleKey) {
  const existing = await repository.latestConfigVersion(moduleKey);
  if (existing) return existing;
  const snapshot = await configSnapshot(moduleKey);
  const version = await repository.createConfigVersion(moduleKey, {
    action: 'version.baseline',
    summary: 'Initial form version',
    snapshot
  });
  await repository.createConfigAuditLog(moduleKey, {
    versionId: version?.id,
    action: 'version.baseline',
    targetType: 'config_version',
    targetKey: String(version?.versionNumber || 1),
    summary: `Created baseline version ${version?.versionNumber || 1}`,
    before: null,
    after: snapshot
  });
  return version;
}

async function createConfigVersion(moduleKey, user = null, input = {}) {
  if (defaultModules.has(moduleKey)) {
    await ensureDefaultConfig(moduleKey);
  }
  const module = await repository.findModuleByKey(moduleKey);
  if (!module) throw new AppError('Module not found', 404);
  await ensureInitialConfigVersion(moduleKey);
  const snapshot = await configSnapshot(moduleKey);
  const remark = String(input.remark || '').trim();
  const version = await repository.createConfigVersion(moduleKey, {
    action: 'version.create',
    summary: remark || 'Created version snapshot',
    snapshot,
    userId: user?.id
  });
  await repository.createConfigAuditLog(moduleKey, {
    versionId: version.id,
    action: 'version.create',
    targetType: 'config_version',
    targetKey: String(version.versionNumber),
    summary: remark || `Created version ${version.versionNumber}`,
    before: null,
    after: snapshot,
    userId: user?.id
  });
  return listConfigHistory(moduleKey);
}

async function withFieldDataCounts(moduleKey, fields) {
  return Promise.all(fields.map(async (field) => ({
    ...field,
    dataCount: await repository.fieldDataCount(moduleKey, field)
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
  if (moduleKey === 'customers') {
    const countryField = await repository.findField(moduleKey, 'countryId');
    const countryMappings = Array.isArray(countryField?.lookupConfig?.fieldMappings)
      ? countryField.lookupConfig.fieldMappings
      : [];
    const countryMappingTargets = new Set(countryMappings.map((mapping) => mapping.targetField));
    if (
      countryField &&
      (
        countryField.type === 'country' ||
        countryField.lookupConfig?.browserButtonKey !== 'countries' ||
        !countryField.lookupConfig?.sourceTable ||
        !countryField.lookupConfig?.primaryKeyField ||
        !Array.isArray(countryField.lookupConfig?.fieldMappings) ||
        !countryMappingTargets.has('__lookupDisplay') ||
        !countryMappingTargets.has('__dialCodeDisplay')
      )
    ) {
      const mergedMappings = [
        ...countryMappings.filter((mapping) => mapping?.sourceField && mapping?.targetField),
        !countryMappingTargets.has('__lookupDisplay')
          ? { sourceField: 'name', targetField: '__lookupDisplay' }
          : null,
        !countryMappingTargets.has('__dialCodeDisplay')
          ? { sourceField: 'dial_code', targetField: '__dialCodeDisplay' }
          : null
      ].filter(Boolean);
      await repository.updateField(moduleKey, 'countryId', {
        type: 'browser_button',
        lookupConfig: {
          browserButtonKey: 'countries',
          triggerCondition: 'on_select',
          sourceModule: 'countries',
          sourceTable: 'countries',
          sourceTables: [
            { moduleKey: 'countries', tableName: 'countries', alias: 'a' }
          ],
          primaryKeyField: 'id',
          sourceWhere: '',
          fieldMappings: mergedMappings
        }
      });
    }
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
    } else if (existing.system) {
      await repository.upsertBrowserButton({
        ...browser,
        enabled: existing.enabled
      });
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

function normalizeModuleStatus(input) {
  const status = String(input || 'draft').trim().toLowerCase();
  if (!moduleStatuses.has(status)) throw new AppError('Unsupported module status', 422);
  return status;
}

function normalizeModuleInput(input, { creating = false } = {}) {
  const name = String(input.name || '').trim();
  if (!name) throw new AppError('Module name is required', 422);
  const moduleKey = creating
    ? String(input.moduleKey || slugModuleKey(name)).trim()
    : undefined;
  if (creating) {
    assertConfigKey(moduleKey, 'Module key');
    if (defaultModules.has(moduleKey) || ['countries', 'crm_modules', 'crm_forms'].includes(moduleKey)) {
      throw new AppError('Module key is reserved', 422);
    }
  }
  const status = normalizeModuleStatus(input.status || 'draft');
  return {
    moduleKey,
    name,
    description: String(input.description || '').trim().slice(0, 255),
    status,
    showInMenu: Boolean(input.showInMenu && status === 'published'),
    enabled: status !== 'archived'
  };
}

async function createModule(input, user = null) {
  await ensureAllDefaultConfigs();
  const module = normalizeModuleInput(input, { creating: true });
  const existing = await repository.findModuleByKey(module.moduleKey);
  if (existing) throw new AppError('Module key already exists', 409);
  const creationMode = input.creationMode || 'scratch';
  let sourceFields = [];
  let sourceLayouts = null;
  if (creationMode === 'existing_form') {
    if (!input.sourceFormKey) throw new AppError('Choose an existing form', 422);
    const sourceModule = await repository.findModuleByKey(input.sourceFormKey);
    if (!sourceModule) throw new AppError('Form Builder form not found', 404);
    const sourceConfig = await getModuleConfig(input.sourceFormKey);
    sourceFields = sourceConfig.fields || [];
    sourceLayouts = sourceConfig.formLayouts || null;
  } else if (creationMode === 'template') {
    if (!input.templateKey) throw new AppError('Choose a module template', 422);
    const template = findModuleTemplate(input.templateKey);
    if (!template) throw new AppError('Module template not found', 404);
    sourceFields = template.fields;
  }
  await repository.createModule(module);
  try {
    const copiedDetailTables = new Map();
    for (const field of sourceFields) {
      let detailTableName = field.detailTableName;
      if (creationMode === 'existing_form' && field.tableType === 'detail') {
        const sourceTableKey = field.detailTableName || '__default_detail_table__';
        if (!copiedDetailTables.has(sourceTableKey)) {
          copiedDetailTables.set(sourceTableKey, `${moduleTableBase(module.moduleKey)}_dt${copiedDetailTables.size + 1}`);
        }
        detailTableName = copiedDetailTables.get(sourceTableKey);
      }
      await createField(module.moduleKey, {
        ...field,
        tableType: field.tableType || 'main',
        detailTableName,
        showInTable: field.showInTable !== false,
        showInForm: field.showInForm !== false,
        showInImport: field.showInImport !== false,
        showInExport: field.showInExport !== false
      }, user);
    }
    if (sourceLayouts) {
      for (const [state, layoutsByType] of Object.entries(sourceLayouts)) {
        for (const [formType, layout] of Object.entries(layoutsByType || {})) {
          await repository.upsertFormLayout(module.moduleKey, state, formType, layout);
        }
      }
    }
  } catch (error) {
    await repository.deleteModule(module.moduleKey);
    throw error;
  }
  await recordConfigChange(module.moduleKey, {
    action: 'module.create',
    targetType: 'module',
    targetKey: module.moduleKey,
    summary: `Created module ${module.name}`,
    before: null,
    after: { ...module, creationMode, sourceFormKey: input.sourceFormKey || null, templateKey: input.templateKey || null },
    user
  });
  return getModuleConfig(module.moduleKey);
}

async function updateModule(moduleKey, input, user = null) {
  await ensureAllDefaultConfigs();
  assertConfigKey(moduleKey, 'Module key');
  const existing = await repository.findModuleByKey(moduleKey);
  if (!existing) throw new AppError('Module not found', 404);
  if (existing.is_system) throw new AppError('System modules cannot be edited here', 422);
  const next = normalizeModuleInput({
    name: input.name ?? existing.name,
    description: input.description ?? existing.description,
    status: input.status ?? existing.module_status ?? (existing.is_enabled ? 'published' : 'archived'),
    showInMenu: input.showInMenu ?? existing.show_in_menu
  });
  await repository.updateModule(moduleKey, next);
  const updated = await repository.findModuleByKey(moduleKey);
  await recordConfigChange(moduleKey, {
    action: 'module.update',
    targetType: 'module',
    targetKey: moduleKey,
    summary: `Updated module ${updated?.name || existing.name}`,
    before: {
      moduleKey: existing.module_key,
      name: existing.name,
      description: existing.description,
      status: existing.module_status,
      showInMenu: Boolean(existing.show_in_menu),
      enabled: Boolean(existing.is_enabled)
    },
    after: {
      moduleKey: updated.module_key,
      name: updated.name,
      description: updated.description,
      status: updated.module_status,
      showInMenu: Boolean(updated.show_in_menu),
      enabled: Boolean(updated.is_enabled)
    },
    user
  });
  return getModuleConfig(moduleKey);
}

async function deleteModule(moduleKey, user = null) {
  await ensureAllDefaultConfigs();
  assertConfigKey(moduleKey, 'Module key');
  const existing = await repository.findModuleByKey(moduleKey);
  if (!existing) throw new AppError('Module not found', 404);
  if (existing.is_system) throw new AppError('System modules cannot be deleted', 422);
  const recordCount = await repository.moduleRecordCount(moduleKey);
  if (recordCount > 0) {
    throw new AppError('Modules with saved records cannot be deleted. Archive the module instead.', 422);
  }
  const snapshot = await configSnapshot(moduleKey);
  await recordConfigChange(moduleKey, {
    action: 'module.delete',
    targetType: 'module',
    targetKey: moduleKey,
    summary: `Deleted module ${existing.name}`,
    before: snapshot,
    after: null,
    user
  });
  const ownedBrowserButtons = await repository.listBrowserButtonsBySourceModule(moduleKey);
  const ownedBrowserKeys = ownedBrowserButtons.map((browser) => browser.browserKey);
  await repository.clearBrowserButtonReferences(ownedBrowserKeys, moduleKey);
  await repository.deleteBrowserButtonsBySourceModule(moduleKey);
  await repository.deleteStandaloneFormIfExists(moduleKey);
  await repository.deleteModule(moduleKey);
  return { moduleKey, deleted: true };
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

function normalizeStandaloneFormField(input = {}, index = 0) {
  const label = String(input.label || '').trim();
  const fieldKey = String(input.fieldKey || '').trim();
  const databaseFieldName = String(input.databaseFieldName || '').trim();
  const type = String(input.type || 'textbox').trim();
  if (!label) throw new AppError(`Field name is required at row ${index + 1}`, 422);
  assertConfigKey(fieldKey, `Data key at row ${index + 1}`);
  assertConfigKey(databaseFieldName, `Database field name at row ${index + 1}`);
  if (!fieldTypes.has(type)) throw new AppError(`Unsupported field type at row ${index + 1}`, 422);
  return {
    fieldKey,
    databaseFieldName,
    label,
    type,
    tableType: input.tableType === 'detail' ? 'detail' : 'main',
    options: isDropdownOptionFieldType(type) ? normalizeOptions(input.options) : [],
    showInTable: input.showInTable !== false,
    showInForm: input.showInForm !== false,
    showInImport: Boolean(input.showInImport),
    required: Boolean(input.required)
  };
}

function normalizeStandaloneForm(input = {}) {
  const formKey = String(input.formKey || '').trim();
  const name = String(input.name || '').trim();
  if (!name) throw new AppError('Form name is required', 422);
  assertConfigKey(formKey, 'Database name');
  const fields = (input.fields || []).map(normalizeStandaloneFormField);
  if (!fields.length) throw new AppError('Add at least one field', 422);
  const fieldKeys = new Set();
  const databaseNames = new Set();
  fields.forEach((field) => {
    if (fieldKeys.has(field.fieldKey)) throw new AppError(`Duplicate data key: ${field.fieldKey}`, 422);
    if (databaseNames.has(field.databaseFieldName)) throw new AppError(`Duplicate database field name: ${field.databaseFieldName}`, 422);
    fieldKeys.add(field.fieldKey);
    databaseNames.add(field.databaseFieldName);
  });
  return {
    formKey,
    name,
    description: String(input.description || '').trim(),
    fields
  };
}

async function listStandaloneForms() {
  return repository.listStandaloneForms();
}

async function createStandaloneForm(input, user = null) {
  const form = normalizeStandaloneForm(input);
  if (await repository.findStandaloneForm(form.formKey)) {
    throw new AppError('Form key already exists', 409);
  }
  await repository.createStandaloneForm(form, user?.id);
  return { forms: await listStandaloneForms() };
}

async function deleteStandaloneForm(formKey) {
  const existing = await repository.findStandaloneForm(formKey);
  if (!existing) throw new AppError('Form not found', 404);
  await repository.deleteStandaloneForm(formKey);
  return { forms: await listStandaloneForms() };
}

async function updateStandaloneFormField(formKey, fieldKey, input = {}, user = null) {
  const form = await repository.findStandaloneForm(formKey);
  if (!form) throw new AppError('Form not found', 404);
  const fieldIndex = form.fields.findIndex((field) => field.fieldKey === fieldKey);
  if (fieldIndex === -1) throw new AppError('Field not found', 404);
  const formulaFunctionName = input.formulaFunctionName === undefined ? undefined : normalizeFormulaFunctionName(input.formulaFunctionName);
  assertFormulaFunctionName(formulaFunctionName);
  const formulaJs = input.formulaJs === undefined ? undefined : normalizeFormulaScript(input.formulaJs);
  assertFormulaSourceDisabled(formulaJs);
  const formulaFunctionBody = input.formulaFunctionBody === undefined ? undefined : normalizeFormulaScript(input.formulaFunctionBody);
  assertCustomFormulaBodySafe(formulaFunctionBody);
  const updates = {
    formulaExpression: input.formulaExpression === undefined ? undefined : normalizeFormulaExpression(input.formulaExpression),
    formulaEnabled: input.formulaEnabled === undefined ? undefined : Boolean(input.formulaEnabled && normalizeFormulaExpression(input.formulaExpression ?? form.fields[fieldIndex].formulaExpression)),
    formulaJs,
    formulaFunctionName,
    formulaFunctionBody,
    formulaSql: input.formulaSql === undefined ? undefined : normalizeFormulaScript(input.formulaSql)
  };
  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) delete updates[key];
  });
  const fields = form.fields.map((field, index) => (
    index === fieldIndex ? { ...field, ...updates } : field
  ));
  formulaDependencyGraph(fields);
  await repository.updateStandaloneFormFields(formKey, fields, user?.id);
  return { forms: await listStandaloneForms() };
}

function assertQualifiedField(value, label) {
  if (!/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)?$/.test(String(value || ''))) {
    throw new AppError(`${label} must use field or alias.field format`, 422);
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

function normalizeLookupConfig(input = {}, _type = '') {
  const browserButtonKey = String(input.browserButtonKey || '').trim();
  const triggerField = String(input.triggerField || '').trim();
  const sourceModule = String(input.sourceModule || '').trim();
  const sourceTable = String(input.sourceTable || '').trim();
  const sourceTables = Array.isArray(input.sourceTables)
    ? input.sourceTables
      .map((source, index) => ({
        moduleKey: String(source?.moduleKey || sourceModule || '').trim(),
        tableName: String(source?.tableName || '').trim(),
        alias: String(source?.alias || String.fromCharCode(97 + index)).trim()
      }))
      .filter((source) => source.tableName && source.alias)
    : [];
  const triggerCondition = input.triggerCondition === 'on_select' ? 'on_select' : 'on_change';
  const primaryKeyField = String(input.primaryKeyField || '').trim();
  const sourceWhere = String(input.sourceWhere || '').trim();
  const sourceJoins = Array.isArray(input.sourceJoins)
    ? input.sourceJoins
      .map((join) => ({
        leftField: String(join?.leftField || '').trim(),
        operator: ['=', '<>', '>', '>=', '<', '<='].includes(join?.operator) ? join.operator : '=',
        rightField: String(join?.rightField || '').trim()
      }))
      .filter((join) => join.leftField && join.rightField)
    : [];
  const fieldMappings = Array.isArray(input.fieldMappings)
    ? input.fieldMappings
      .map((mapping) => ({
        sourceField: String(mapping?.sourceField || '').trim(),
        targetField: String(mapping?.targetField || '').trim(),
        coerceType: ['auto', 'text', 'number', 'integer', 'boolean', 'date'].includes(mapping?.coerceType) ? mapping.coerceType : 'auto'
      }))
      .filter((mapping) => mapping.sourceField && mapping.targetField)
    : [];
  [...sourceTables.map((source) => source.tableName), ...sourceTables.map((source) => source.alias).filter(Boolean)].forEach((value) => {
    assertConfigKey(value, 'Field linkage source settings');
  });
  if (sourceTable) assertConfigKey(sourceTable, 'Field linkage source table');
  [triggerField, primaryKeyField, ...sourceJoins.flatMap((join) => [join.leftField, join.rightField]), ...fieldMappings.map((mapping) => mapping.sourceField)]
    .filter(Boolean)
    .forEach((value) => assertQualifiedField(value, 'Field linkage field'));
  if (sourceWhere && (/[;]/.test(sourceWhere) || /--|\/\*/.test(sourceWhere))) {
    throw new AppError('Field linkage SQL WHERE cannot include statement separators or comments', 422);
  }
  if (!browserButtonKey && !sourceTable && !sourceTables.length && !fieldMappings.length) return {};
  return {
    browserButtonKey,
    triggerField,
    triggerCondition,
    sourceModule,
    sourceTable,
    sourceTables,
    sourceJoins,
    primaryKeyField,
    sourceWhere,
    clearOnEmpty: input.clearOnEmpty !== false,
    fieldMappings
  };
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

const customFormulaForbiddenPattern = /\b(?:constructor|eval|Function|global|globalThis|process|require|module|exports|import|this|prototype|__proto__|while|for|setTimeout|setInterval|Promise|fetch|XMLHttpRequest|document|window|localStorage|sessionStorage)\b/;

function assertCustomFormulaBodySafe(body) {
  if (customFormulaForbiddenPattern.test(String(body || ''))) {
    throw new AppError('Custom formula function contains unsupported code', 422);
  }
}

function assertFormulaSourceDisabled(source) {
  if (String(source || '').trim()) {
    throw new AppError('Custom formula source code is no longer supported. Use Function Name and Function Body.', 422);
  }
}

function normalizeMappingHeader(input) {
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

async function assertValidFormulaDependencies(moduleKey, nextField) {
  const fields = await repository.listFields(moduleKey);
  const fieldIndex = fields.findIndex((field) => field.fieldKey === nextField.fieldKey);
  const nextFields = fieldIndex === -1
    ? [...fields, nextField]
    : fields.map((field, index) => (index === fieldIndex ? { ...field, ...nextField } : field));
  formulaDependencyGraph(nextFields);
}

async function createField(moduleKey, input, user = null) {
  const module = await repository.findModuleByKey(moduleKey);
  if (!module) throw new AppError('Module not found', 404);

  const requestedFieldKey = String(input.fieldKey || '').trim();
  if (requestedFieldKey) assertConfigKey(requestedFieldKey, 'Field key');
  const fieldKey = requestedFieldKey || slugFieldKey(input.label);
  if (!fieldKey) throw new AppError('Field label is required', 422);
  if (await repository.findField(moduleKey, fieldKey)) {
    throw new AppError('Field key already exists', 409);
  }
  if (!fieldTypes.has(input.type)) {
    throw new AppError('Unsupported field type', 422);
  }
  const formulaFunctionName = normalizeFormulaFunctionName(input.formulaFunctionName);
  assertFormulaFunctionName(formulaFunctionName);
  const formulaJs = normalizeFormulaScript(input.formulaJs);
  assertFormulaSourceDisabled(formulaJs);
  const formulaFunctionBody = normalizeFormulaScript(input.formulaFunctionBody);
  assertCustomFormulaBodySafe(formulaFunctionBody);

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
    formulaJs,
    formulaFunctionName,
    formulaFunctionBody,
    formulaSql: normalizeFormulaScript(input.formulaSql),
    validationRules: normalizeValidationRules(input.validationRules),
    lookupConfig: normalizeLookupConfig(input.lookupConfig, input.type),
    required: Boolean(input.required),
    showInTable: input.showInTable !== false,
    showInForm: Boolean(input.required) || input.showInForm !== false,
    showInImport: Boolean(input.showInImport),
    showInExport: input.showInExport !== false,
    importHeader: normalizeMappingHeader(input.importHeader),
    exportHeader: normalizeMappingHeader(input.exportHeader),
    editable: input.editable !== false,
    disableManualInput: Boolean(input.disableManualInput),
    searchable: Boolean(input.searchable),
    sortOrder: await repository.nextSortOrder(module.id)
  };
  await assertValidFormulaDependencies(moduleKey, field);

  if (field.tableType === 'detail') {
    await repository.ensureDetailTableField(field.detailTableName, field.fieldKey, field.type);
  }

  await repository.createCustomField(module.id, field);
  await recordConfigChange(moduleKey, {
    action: 'field.create',
    targetType: 'field',
    targetKey: field.fieldKey,
    summary: `Created field ${field.label}`,
    before: null,
    after: field,
    user
  });

  return getModuleConfig(moduleKey);
}

async function updateField(moduleKey, fieldKey, input, user = null) {
  const field = await repository.findField(moduleKey, fieldKey);
  if (!field) throw new AppError('Field not found', 404);
  if (!fieldTypes.has(input.type || field.type)) {
    throw new AppError('Unsupported field type', 422);
  }
  const formulaFunctionName = input.formulaFunctionName === undefined ? undefined : normalizeFormulaFunctionName(input.formulaFunctionName);
  assertFormulaFunctionName(formulaFunctionName);
  const formulaJs = input.formulaJs === undefined ? undefined : normalizeFormulaScript(input.formulaJs);
  assertFormulaSourceDisabled(formulaJs);
  const formulaFunctionBody = input.formulaFunctionBody === undefined ? undefined : normalizeFormulaScript(input.formulaFunctionBody);
  assertCustomFormulaBodySafe(formulaFunctionBody);

  const updates = {
    ...input,
    options: input.options === undefined ? undefined : isDropdownOptionFieldType(input.type || field.type) ? normalizeOptions(input.options) : [],
    formulaExpression: input.formulaExpression === undefined ? undefined : normalizeFormulaExpression(input.formulaExpression),
    formulaEnabled: input.formulaEnabled === undefined ? undefined : Boolean(input.formulaEnabled && normalizeFormulaExpression(input.formulaExpression ?? field.formulaExpression)),
    formulaJs,
    formulaFunctionName,
    formulaFunctionBody,
    formulaSql: input.formulaSql === undefined ? undefined : normalizeFormulaScript(input.formulaSql),
    validationRules: input.validationRules === undefined ? undefined : normalizeValidationRules(input.validationRules),
    lookupConfig: input.lookupConfig === undefined ? undefined : normalizeLookupConfig(input.lookupConfig, input.type || field.type),
    importHeader: input.importHeader === undefined ? undefined : normalizeMappingHeader(input.importHeader),
    exportHeader: input.exportHeader === undefined ? undefined : normalizeMappingHeader(input.exportHeader)
  };

  if (updates.required) {
    updates.showInForm = true;
  }

  if (field.locked) {
    delete updates.type;
    delete updates.tableType;
    delete updates.detailTableName;
  }

  const fieldHasData = field.type === 'browser_button'
    ? await repository.fieldDataCount(moduleKey, field) > 0
    : false;
  const existingBrowserButtonKey = field.lookupConfig?.browserButtonKey || '';
  const nextBrowserButtonKey = updates.lookupConfig === undefined
    ? existingBrowserButtonKey
    : updates.lookupConfig?.browserButtonKey || '';
  if (fieldHasData && updates.type && updates.type !== field.type) {
    throw new AppError('Browser Button fields with saved data cannot change type', 422);
  }
  if (
    field.type === 'browser_button'
    && existingBrowserButtonKey
    && nextBrowserButtonKey !== existingBrowserButtonKey
    && fieldHasData
  ) {
    throw new AppError('Browser Button cannot be changed because this field already has saved data', 422);
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
  await assertValidFormulaDependencies(moduleKey, { ...field, ...updates });
  if (nextTableType === 'detail') {
    await repository.ensureDetailTableField(nextDetailTableName, field.fieldKey, nextType);
  }

  await repository.updateField(moduleKey, fieldKey, updates);
  const updatedField = await repository.findField(moduleKey, fieldKey);
  await recordConfigChange(moduleKey, {
    action: 'field.update',
    targetType: 'field',
    targetKey: fieldKey,
    summary: `Updated field ${updatedField?.label || field.label}`,
    before: field,
    after: updatedField,
    user
  });
  return getModuleConfig(moduleKey);
}

async function renameDetailTable(moduleKey, oldTableName, input, user = null) {
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
  await recordConfigChange(moduleKey, {
    action: 'detail_table.rename',
    targetType: 'detail_table',
    targetKey: newTableName,
    summary: `Renamed detail table ${oldTableName} to ${newTableName}`,
    before: { detailTableName: oldTableName },
    after: { detailTableName: newTableName },
    user
  });
  return getModuleConfig(moduleKey);
}

async function saveFormLayout(moduleKey, state, formType, input, user = null, options = {}) {
  if (!layoutStates.includes(state)) throw new AppError('Unsupported layout state', 422);
  if (!formTypes.includes(formType)) throw new AppError('Unsupported form type', 422);

  const module = await repository.findModuleByKey(moduleKey);
  if (!module) throw new AppError('Module not found', 404);

  const fields = await repository.listFields(moduleKey);
  const fallback = defaultFormLayout(fields);
  const layout = normalizeLayout(input, fallback);
  const knownFieldKeys = new Set(fields.map((field) => field.fieldKey));
  const knownMainFieldKeys = new Set(fields.filter((field) => field.tableType !== 'detail').map((field) => field.fieldKey));
  layout.order = layout.order.filter((fieldKey, index, list) => knownFieldKeys.has(fieldKey) && list.indexOf(fieldKey) === index);
  layout.hidden = layout.hidden.filter((fieldKey, index, list) => knownFieldKeys.has(fieldKey) && list.indexOf(fieldKey) === index);
  layout.fieldSpans = Object.fromEntries(Object.entries(layout.fieldSpans || {})
    .filter(([fieldKey]) => knownMainFieldKeys.has(fieldKey))
    .map(([fieldKey, span]) => [fieldKey, Math.min(3, Math.max(1, Number(span) || 1))]));
  const sectionFieldKeys = new Set();
  layout.sections = layout.sections.map((section) => {
    const fieldKeys = section.fieldKeys.filter((fieldKey) => {
      if (!knownMainFieldKeys.has(fieldKey) || sectionFieldKeys.has(fieldKey)) return false;
      sectionFieldKeys.add(fieldKey);
      return true;
    });
    return { ...section, fieldKeys };
  });
  const missingMainFieldKeys = layout.order.filter((fieldKey) => knownMainFieldKeys.has(fieldKey) && !sectionFieldKeys.has(fieldKey));
  if (!layout.sections.length) {
    layout.sections = [{ id: 'section_general', title: 'General', columns: 1, fieldKeys: [] }];
  }
  layout.sections[0].fieldKeys.push(...missingMainFieldKeys);

  const beforeLayout = (await repository.listFormLayouts(moduleKey))
    .find((saved) => saved.state === state && saved.formType === formType)?.layout || null;
  await repository.upsertFormLayout(moduleKey, state, formType, layout);
  if (!options.skipAudit) {
    const action = options.action || `layout.${state}.save`;
    await recordConfigChange(moduleKey, {
      action,
      targetType: 'form_layout',
      targetKey: `${state}:${formType}`,
      summary: action === 'layout.publish'
        ? `Published ${formType} form layout`
        : `Saved ${formType} form ${state} layout`,
      before: beforeLayout,
      after: layout,
      user
    });
  }
  return getModuleConfig(moduleKey);
}

async function publishFormLayout(moduleKey, formType, input, user = null) {
  await saveFormLayout(moduleKey, 'draft', formType, input, user, { skipAudit: true });
  return saveFormLayout(moduleKey, 'published', formType, input, user, {
    action: 'layout.publish'
  });
}

async function deleteField(moduleKey, fieldKey, user = null) {
  const field = await repository.findField(moduleKey, fieldKey);
  if (!field) throw new AppError('Field not found', 404);
  if (field.locked) throw new AppError('System fields cannot be deleted', 422);
  const dataCount = await repository.fieldDataCount(moduleKey, field);
  if (dataCount > 0) {
    throw new AppError('Fields with data cannot be deleted', 422);
  }
  await repository.deleteField(moduleKey, fieldKey);
  await recordConfigChange(moduleKey, {
    action: 'field.delete',
    targetType: 'field',
    targetKey: fieldKey,
    summary: `Deleted field ${field.label}`,
    before: field,
    after: null,
    user
  });
  return getModuleConfig(moduleKey);
}

async function archiveField(moduleKey, fieldKey, user = null) {
  const field = await repository.findField(moduleKey, fieldKey);
  if (!field) throw new AppError('Field not found', 404);
  if (field.locked) throw new AppError('System fields cannot be archived', 422);
  await repository.archiveField(moduleKey, fieldKey);
  await recordConfigChange(moduleKey, {
    action: 'field.archive',
    targetType: 'field',
    targetKey: fieldKey,
    summary: `Archived field ${field.label}`,
    before: field,
    after: { ...field, archived: true, showInTable: false, showInForm: false, showInImport: false },
    user
  });
  return getModuleConfig(moduleKey);
}

async function unarchiveField(moduleKey, fieldKey, user = null) {
  const field = await repository.findField(moduleKey, fieldKey);
  if (!field) throw new AppError('Field not found', 404);
  if (field.locked) throw new AppError('System fields cannot be restored', 422);
  await repository.unarchiveField(moduleKey, fieldKey);
  await recordConfigChange(moduleKey, {
    action: 'field.unarchive',
    targetType: 'field',
    targetKey: fieldKey,
    summary: `Restored field ${field.label}`,
    before: field,
    after: { ...field, archived: false },
    user
  });
  return getModuleConfig(moduleKey);
}

async function listConfigHistory(moduleKey) {
  if (defaultModules.has(moduleKey)) {
    await ensureDefaultConfig(moduleKey);
  }
  const module = await repository.findModuleByKey(moduleKey);
  if (!module) throw new AppError('Module not found', 404);
  const currentVersion = await ensureInitialConfigVersion(moduleKey);
  await repository.attachPendingAuditLogsToVersion(moduleKey, currentVersion.id);
  const [versions, auditLogs] = await Promise.all([
    repository.listConfigVersions(moduleKey),
    repository.listConfigAuditLogs(moduleKey)
  ]);
  return { versions, auditLogs, currentVersionId: currentVersion?.id || versions[0]?.id || null };
}

async function rollbackConfigVersion(moduleKey, versionId, user = null, input = {}) {
  if (defaultModules.has(moduleKey)) {
    await ensureDefaultConfig(moduleKey);
  }
  const version = await repository.getConfigVersion(moduleKey, versionId);
  if (!version) throw new AppError('Config version not found', 404);
  const before = await configSnapshot(moduleKey);
  await repository.restoreConfigSnapshot(moduleKey, version.snapshot);
  const after = await configSnapshot(moduleKey);
  const remark = String(input.remark || '').trim();
  const summary = remark
    ? `Restored version ${version.versionNumber}: ${remark}`
    : `Restored version ${version.versionNumber}`;
  const restoredVersion = await repository.createConfigVersion(moduleKey, {
    action: 'version.restore',
    summary,
    snapshot: after,
    userId: user?.id
  });
  await repository.createConfigAuditLog(moduleKey, {
    versionId: restoredVersion.id,
    action: 'version.restore',
    targetType: 'config_version',
    targetKey: String(version.versionNumber),
    summary,
    before,
    after,
    userId: user?.id
  });
  return getModuleConfig(moduleKey);
}

module.exports = {
  ensureDefaultCustomerConfig,
  ensureDefaultUserConfig,
  ensureAllDefaultConfigs,
  getModuleConfig,
  listModules,
  createModule,
  updateModule,
  deleteModule,
  listStandaloneForms,
  createStandaloneForm,
  deleteStandaloneForm,
  updateStandaloneFormField,
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
  unarchiveField,
  createConfigVersion,
  listConfigHistory,
  rollbackConfigVersion
};
