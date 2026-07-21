const authStorageKeys = {
  token: 'crm.token',
  user: 'crm.user',
  remembered: 'crm.remembered'
};

function parseStoredJson(value) {
  try {
    return JSON.parse(value || 'null');
  } catch (_error) {
    return null;
  }
}

function readStoredSession() {
  const remembered = localStorage.getItem(authStorageKeys.remembered) === 'true';
  const storage = remembered ? localStorage : sessionStorage;
  return {
    token: storage.getItem(authStorageKeys.token) || '',
    user: parseStoredJson(storage.getItem(authStorageKeys.user)),
    remembered
  };
}

const storedSession = readStoredSession();

const state = {
  token: storedSession.token,
  user: storedSession.user,
  rememberSession: storedSession.remembered,
  authConfig: null,
  countries: [],
  users: [],
  customers: [],
  customerFields: [],
  customerPermissions: {},
  userFields: [],
  adminModules: [],
  standaloneForms: [],
  publishedModules: [],
  moduleRuntimeConfigs: {},
  moduleRuntimeRecords: {},
  activeRuntimeModuleKey: '',
  moduleRuntimeSearch: '',
  browserButtons: [],
  apiConnectors: [],
  apiConnectorCategories: [],
  departmentNodes: [],
  activeDepartmentNodeId: 0,
  activeApiTab: 'connectors',
  activeApiCategory: 'all',
  apiCategorySearch: '',
  apiTreeExpanded: { connectors: true, interfaces: true },
  activeApiInterfaceStep: 0,
  apiInterfaceDefinitions: { request: { params: [], headers: [], body: [] }, response: { params: [], headers: [], body: [] } },
  activeApiDefinitionTabs: { request: 'params', response: 'params' },
  apiInterfaceBodyFormats: { request: 'application/json', response: 'application/json' },
  apiDefinitionBatchTarget: null,
  permissionMatrix: null,
  fieldPermissionMatrix: null,
  activePermissionModule: 'customers',
  pageViewPermissionModule: '',
  pageViewPermissionMatrix: null,
  activeBrowserSource: '',
  browserSourceSearch: '',
  formDesignLayouts: {},
  configHistory: null,
  configHistoryLoading: false,
  activeAdminSection: 'adminModulesSection',
  adminMenuCollapsed: false,
  activeConfigModule: 'customers',
  formBuilderSearch: '',
  modulePageSearch: '',
  editingFieldKey: '',
  batchActiveTable: 'main',
  batchDetailTables: [],
  batchEditRows: [],
  batchDraftRows: [],
  batchArchivedRows: [],
  batchSelectedRowIds: new Set(),
  batchDeletedFieldKeys: new Set(),
  batchArchivedFieldKeys: new Set(),
  batchRestoredFieldKeys: new Set(),
  batchShowingArchived: false,
  editingFormulaFieldKey: '',
  activeFormDesignType: 'add',
  selectedFormDesignFieldKey: '',
  draggingFormDesignFieldKey: '',
  dragOverFormDesignFieldKey: '',
  draggingFormDesignDetailTable: '',
  dragOverFormDesignDetailTable: '',
  editingFieldLinkageFieldKey: '',
  activeCustomerFormType: 'add',
  activeUserFormType: 'add',
  activeBrowserLookup: null,
  selectedCustomerIds: new Set()
};

const configModules = [
  { key: 'customers', name: 'Customers', description: 'Customer records and contact forms' },
  { key: 'users', name: 'Users', description: 'Team access and user profile forms' }
];

function moduleCatalogItem(config) {
  const module = config.module || config;
  return {
    key: module.moduleKey || module.key,
    name: module.name,
    description: module.description || '',
    status: module.status || (module.enabled === false ? 'archived' : 'published'),
    showInMenu: Boolean(module.showInMenu),
    system: Boolean(module.system),
    enabled: module.enabled !== false
  };
}

function syncConfigModuleCatalog(modules = state.adminModules) {
  const nextModules = modules.map(moduleCatalogItem).filter((module) => module.key);
  configModules.splice(0, configModules.length, ...nextModules);
  if (!configModules.some((module) => module.key === state.activeConfigModule)) {
    state.activeConfigModule = configModules[0]?.key || 'customers';
  }
  if (!configModules.some((module) => module.key === state.activePermissionModule)) {
    state.activePermissionModule = configModules[0]?.key || 'customers';
  }
}

function moduleConfigByKey(moduleKey) {
  return state.adminModules.find((config) => (config.module?.moduleKey || config.moduleKey) === moduleKey) || null;
}

const editableFieldTypes = [
  { value: 'textbox', label: 'Textbox' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'dropdownbox', label: 'Dropdownbox' },
  { value: 'int', label: 'Int' },
  { value: 'decimals', label: 'Decimals' },
  { value: 'browser_button', label: 'Browser Button' },
  { value: 'date', label: 'Date' },
  { value: 'attach_document', label: 'Attach Document' },
  { value: 'image', label: 'Image' }
];

const fieldTypeLabels = {
  textbox: 'Textbox',
  text: 'Textbox',
  textarea: 'Textarea',
  checkbox: 'Checkbox',
  dropdownbox: 'Dropdownbox',
  select: 'Dropdownbox',
  int: 'Int',
  number: 'Int',
  decimals: 'Decimals',
  browser_button: 'Browser Button',
  date: 'Date',
  attach_document: 'Attach Document',
  image: 'Image',
  email: 'Email',
  phone: 'Phone',
  password: 'Password',
  country: 'Country',
  owner: 'Owner'
};

function slugFieldKeyPreview(label) {
  return String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+([a-z0-9])/g, (_match, letter) => letter.toUpperCase());
}

function normalizeDetailTableNamePreview(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
  if (!normalized) return '';
  return /^[a-z]/.test(normalized) ? normalized : `${activeModuleKeyBase()}_${normalized}`;
}

function tableKeySuffix(tableKey) {
  if (!tableKey || tableKey === 'main') return '';
  return titleCaseMessage(tableKey).replace(/[^A-Za-z0-9]/g, '');
}

function allDraftAndSavedFieldKeys(excludeRowId = '') {
  return new Set([
    ...activeConfigFields().map((field) => field.fieldKey),
    ...state.batchDraftRows
      .filter((row) => row.id !== excludeRowId)
      .map((row) => row.fieldKey)
      .filter(Boolean)
  ]);
}

function uniqueFieldKeyForLabel(label, tableKey = 'main', excludeRowId = '') {
  const baseKey = slugFieldKeyPreview(label);
  if (!baseKey) return '';
  const usedKeys = allDraftAndSavedFieldKeys(excludeRowId);
  const tableKeyCandidate = `${baseKey}${tableKeySuffix(tableKey)}`;
  let candidate = usedKeys.has(baseKey) && tableKeyCandidate !== baseKey ? tableKeyCandidate : baseKey;
  let index = 2;
  while (usedKeys.has(candidate)) {
    candidate = `${tableKeyCandidate}${index}`;
    index += 1;
  }
  return candidate;
}

function renderReadonlyCheckbox(checked) {
  return `<input class="readonly-checkbox" type="checkbox" ${checked ? 'checked' : ''} disabled aria-label="${checked ? 'Checked' : 'Unchecked'}">`;
}

function browserButtonForField(field) {
  const browserKey = field.lookupConfig?.browserButtonKey;
  return browserKey ? state.browserButtons.find((browser) => browser.browserKey === browserKey && browser.enabled) : null;
}

function fieldInputState(field) {
  const locked = field.editable === false;
  const manualDisabled = field.disableManualInput && field.type !== 'browser_button';
  return {
    locked,
    manualDisabled,
    readonly: locked || manualDisabled || Boolean(field.formulaEnabled && field.formulaExpression),
    disabled: locked || manualDisabled
  };
}

function hiddenPreservedInput(binding, value) {
  const detailMatch = binding.match(/data-detail-field="([^"]+)"/);
  const nameMatch = binding.match(/name="([^"]+)"/);
  if (detailMatch) {
    return `<input type="hidden" data-detail-field="${detailMatch[1]}" data-preserved-field="true" value="${escapeHtml(value)}">`;
  }
  if (nameMatch) {
    return `<input type="hidden" name="${nameMatch[1]}" data-preserved-field="true" value="${escapeHtml(value)}">`;
  }
  return '';
}

function fieldControlStateAttributes(field, value, binding, options = {}) {
  const state = fieldInputState(field);
  const attrs = [];
  const preserve = state.disabled ? hiddenPreservedInput(binding, value) : '';
  if (state.disabled && options.disableInsteadOfReadonly) {
    attrs.push('disabled');
  } else if (state.readonly && options.readonly !== false) {
    attrs.push('readonly');
  }
  if (field.formulaEnabled && field.formulaExpression) {
    attrs.push('data-formula-field="true"');
  }
  return { attrs: attrs.join(' '), preserve, state };
}

function renderBrowserFieldInput(field, value = '', { detailField = false } = {}) {
  const browser = browserButtonForField(field);
  const inputState = fieldInputState(field);
  const binding = detailField
    ? `data-detail-field="${escapeHtml(field.fieldKey)}"`
    : `name="${escapeHtml(field.fieldKey)}"`;
  const target = detailField ? 'detail' : 'main';
  const disabled = browser && !inputState.locked ? '' : 'disabled';
  const buttonText = browser ? 'Browse' : 'Select Browser Button';
  return `
    <div class="browser-field-control">
      <input ${binding} type="hidden" value="${escapeHtml(value)}">
      <button type="button" class="secondary browser-field-button" ${disabled} data-open-browser-lookup="${escapeHtml(browser?.browserKey || '')}" data-browser-target="${target}" data-browser-field="${escapeHtml(field.fieldKey)}">${buttonText}</button>
      <span class="browser-field-display">${escapeHtml(value || '')}</span>
    </div>
  `;
}

function formulaFields() {
  return activeConfigFields();
}

function formulaTargetFields() {
  return formulaFields();
}

function formulaFieldGroups(fields = formulaFields()) {
  const groups = [{ key: 'main', label: 'Main Table', fields: fields.filter((field) => field.tableType !== 'detail') }];
  const detailTableNames = Array.from(new Set(
    fields
      .filter((field) => field.tableType === 'detail')
      .map((field) => field.detailTableName || 'detail')
  ));
  detailTableNames.forEach((tableName, index) => {
    groups.push({
      key: tableName,
      label: `DT${index + 1}`,
      fields: fields.filter((field) => field.tableType === 'detail' && (field.detailTableName || 'detail') === tableName)
    });
  });
  return groups.filter((group) => group.fields.length);
}

function insertAtCursor(input, text) {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  input.value = `${input.value.slice(0, start)}${text}${input.value.slice(end)}`;
  input.focus();
  input.setSelectionRange(start + text.length, start + text.length);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function valuesFromCustomerForm(form) {
  const values = {};
  mainFormFields().forEach((field) => {
    const input = form.elements[field.fieldKey];
    if (!input) return;
    values[field.fieldKey] = input.type === 'checkbox' ? input.checked : input.value;
  });
  return values;
}

function coerceFormulaValue(value) {
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value === null || value === undefined || value === '') return '';
  const number = Number(value);
  return Number.isFinite(number) && String(value).trim() !== '' ? number : value;
}

function buildCustomFormulaFunctions(source = '', name = '', body = '') {
  const functions = {};
  if (String(source || '').trim()) {
    const factory = Function(`"use strict"; ${source}`);
    const sourceFunctions = factory();
    if (!sourceFunctions || typeof sourceFunctions !== 'object' || Array.isArray(sourceFunctions)) {
      throw new Error('Custom formula code must return an object of functions.');
    }
    Object.assign(functions, sourceFunctions);
  }
  const functionName = String(name || '').trim().toUpperCase();
  const functionBody = String(body || '').trim();
  if (functionName && functionBody) {
    functions[functionName] = Function('value', `"use strict"; ${functionBody}`);
  }
  Object.entries(functions).forEach(([name, fn]) => {
    if (!/^[A-Z][A-Z0-9_]*$/.test(name) || typeof fn !== 'function') {
      throw new Error('Custom function names must be uppercase functions.');
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
    .replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (_match, key) => `coerceValue(values[${JSON.stringify(key)}])`);

  compiled = compiled.replace(/\b(ABS|ROUND|MIN|MAX)\b/g, (name) => `Math.${name.toLowerCase()}`);
  if (/[^0-9+\-*/().,\sA-Za-z_$[\]"']/.test(compiled)) {
    throw new Error('Formula contains unsupported characters.');
  }

  const bareWords = compiled.match(/[A-Za-z_]+/g) || [];
  const allowedWords = new Set(['Math', 'abs', 'round', 'min', 'max', 'values', 'coerceValue', ...Object.keys(values), ...functionNames]);
  if (bareWords.some((word) => !allowedWords.has(word))) {
    throw new Error('Formula contains unsupported words.');
  }

  const result = Function('values', 'customFunctions', 'coerceValue', `"use strict"; const { ${Object.keys(customFunctions).join(', ')} } = customFunctions; return (${compiled});`)(values, customFunctions, coerceFormulaValue);
  if (typeof result === 'number') {
    if (!Number.isFinite(result)) return '';
    return Number.isInteger(result) ? String(result) : String(Number(result.toFixed(4)));
  }
  return result ?? '';
}

function applyCustomerFormulas() {
  const form = $('#customerForm');
  if (!form) return;
  const values = valuesFromCustomerForm(form);
  mainFormFields()
    .filter((field) => field.formulaEnabled && field.formulaExpression)
    .forEach((field) => {
      const input = form.elements[field.fieldKey];
      if (!input) return;
      try {
        const value = evaluateFormulaExpression(field.formulaExpression, values, field.formulaJs, field.formulaFunctionName, field.formulaFunctionBody, state.customerFields);
        input.value = value;
        values[field.fieldKey] = value;
      } catch (_error) {
        input.value = '';
        values[field.fieldKey] = '';
      }
    });
}

function fieldTypeLabel(type) {
  return fieldTypeLabels[type] || titleCaseMessage(type);
}

function renderFieldTypeOptions(selected = 'textbox', includeSelected = true) {
  const options = includeSelected && !editableFieldTypes.some((type) => type.value === selected)
    ? [{ value: selected, label: fieldTypeLabel(selected) }, ...editableFieldTypes]
    : editableFieldTypes;

  return options.map((type) => (
    `<option value="${escapeHtml(type.value)}" ${type.value === selected ? 'selected' : ''}>${escapeHtml(type.label)}</option>`
  )).join('');
}

function isDropdownOptionFieldType(type) {
  return type === 'dropdownbox' || type === 'select';
}

function activeModuleKeyBase() {
  return state.activeConfigModule.replace(/s$/, '') || 'module';
}

function generatedDetailTableName() {
  const fields = activeConfigFields();
  const existingDetail = fields.find((field) => field.tableType === 'detail' && field.detailTableName)?.detailTableName;
  return existingDetail || `${activeModuleKeyBase()}_dt1`;
}

function syncFieldConfigTypeRows() {
  const form = $('#fieldConfigForm');
  if (!form) return;
  const type = form.elements.type.value;
  const tableType = form.elements.tableType.value;

  $('#dropdownOptionsRow').hidden = !isDropdownOptionFieldType(type);
  $('#browserButtonRow').hidden = type !== 'browser_button';
  form.elements.browserButtonKey.innerHTML = renderBrowserButtonOptions(form.elements.browserButtonKey.value);
  $('#detailTableNameRow').hidden = tableType !== 'detail';
  form.elements.detailTableName.value = tableType === 'detail'
    ? (form.elements.detailTableName.value || generatedDetailTableName())
    : '';
}

function tableLabel(tableKey) {
  if (tableKey === 'main') return 'Main Table';
  return tableKey;
}

function tableKeyForField(field) {
  return field.tableType === 'detail' ? field.detailTableName || generatedDetailTableName() : 'main';
}

const formDesignTypes = ['add', 'edit', 'detail'];

function formDesignStorageKey(moduleKey = state.activeConfigModule) {
  return `crm.formDesign.${moduleKey}`;
}

function moduleFields(moduleKey = state.activeConfigModule) {
  if (moduleKey === 'users') return state.userFields;
  if (moduleKey === 'customers') return state.customerFields;
  return moduleConfigByKey(moduleKey)?.fields || [];
}

function defaultFormDesignOrder(moduleKey = state.activeConfigModule) {
  return moduleFields(moduleKey).map((field) => field.fieldKey);
}

function defaultFormDesignHiddenFields(moduleKey = state.activeConfigModule) {
  return moduleFields(moduleKey)
    .filter((field) => !field.showInForm)
    .map((field) => field.fieldKey);
}

function defaultFormDesignLayout(moduleKey = state.activeConfigModule) {
  const fields = moduleFields(moduleKey);
  const mainFieldKeys = fields.filter((field) => field.tableType !== 'detail').map((field) => field.fieldKey);
  return {
    order: defaultFormDesignOrder(moduleKey),
    hidden: defaultFormDesignHiddenFields(moduleKey),
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

function defaultFormDesignLayouts(moduleKey = state.activeConfigModule) {
  return {
    draft: {
      add: defaultFormDesignLayout(moduleKey),
      edit: defaultFormDesignLayout(moduleKey),
      detail: defaultFormDesignLayout(moduleKey)
    },
    published: {
      add: defaultFormDesignLayout(moduleKey),
      edit: defaultFormDesignLayout(moduleKey),
      detail: defaultFormDesignLayout(moduleKey)
    }
  };
}

function normalizeFormDesignLayout(layout, fallback = defaultFormDesignLayout()) {
  if (Array.isArray(layout)) {
    return {
      order: layout,
      hidden: [...fallback.hidden],
      fieldSpans: { ...(fallback.fieldSpans || {}) },
      sections: (fallback.sections || []).map((section) => ({ ...section, fieldKeys: [...(section.fieldKeys || [])] }))
    };
  }
  const fallbackSections = Array.isArray(fallback.sections) && fallback.sections.length
    ? fallback.sections
    : [{ id: 'section_general', title: 'General', columns: 1, fieldKeys: [...(fallback.order || [])] }];
  const sections = Array.isArray(layout?.sections) && layout.sections.length
    ? layout.sections
    : fallbackSections;
  return {
    order: Array.isArray(layout?.order) ? layout.order : [...fallback.order],
    hidden: Array.isArray(layout?.hidden) ? layout.hidden : [...fallback.hidden],
    fieldSpans: { ...(fallback.fieldSpans || {}), ...(layout?.fieldSpans || {}) },
    sections: sections.map((section, index) => ({
      id: String(section?.id || `section_${index + 1}`),
      title: String(section?.title || `Section ${index + 1}`),
      columns: Math.min(3, Math.max(1, Number(section?.columns) || 1)),
      fieldKeys: Array.isArray(section?.fieldKeys) ? [...section.fieldKeys] : []
    }))
  };
}

function readFormDesignLayouts(moduleKey = state.activeConfigModule) {
  const defaults = defaultFormDesignLayouts(moduleKey);
  const saved = state.formDesignLayouts[moduleKey] || JSON.parse(localStorage.getItem(formDesignStorageKey(moduleKey)) || 'null') || {};
  formDesignTypes.forEach((type) => {
    defaults.draft[type] = normalizeFormDesignLayout(saved.draft?.[type], defaults.draft[type]);
    defaults.published[type] = normalizeFormDesignLayout(saved.published?.[type], defaults.published[type]);
  });
  return defaults;
}

function writeFormDesignLayouts(layouts, moduleKey = state.activeConfigModule) {
  state.formDesignLayouts[moduleKey] = layouts;
  localStorage.setItem(formDesignStorageKey(moduleKey), JSON.stringify(layouts));
}

function formDesignLayoutsEqual(left, right) {
  return JSON.stringify(left || {}) === JSON.stringify(right || {});
}

function localFormDesignLayouts(moduleKey = state.activeConfigModule) {
  return JSON.parse(localStorage.getItem(formDesignStorageKey(moduleKey)) || 'null') || null;
}

function rememberModuleConfig(moduleKey, config) {
  if (config.formLayouts) {
    const localLayouts = localFormDesignLayouts(moduleKey);
    const defaultLayouts = defaultFormDesignLayouts(moduleKey);
    const serverLooksDefault = formDesignLayoutsEqual(config.formLayouts, defaultLayouts);
    writeFormDesignLayouts(localLayouts && serverLooksDefault ? localLayouts : config.formLayouts, moduleKey);
  } else if (!state.formDesignLayouts[moduleKey]) {
    writeFormDesignLayouts(readFormDesignLayouts(moduleKey), moduleKey);
  }
}

function orderedFormDesignFields(type = state.activeFormDesignType) {
  const layouts = readFormDesignLayouts();
  const order = layouts.draft[type]?.order || [];
  const fields = activeConfigFields();
  const byKey = new Map(fields.map((field) => [field.fieldKey, field]));
  return [
    ...order.map((fieldKey) => byKey.get(fieldKey)).filter(Boolean),
    ...fields.filter((field) => !order.includes(field.fieldKey))
  ];
}

function updateFormDesignDraftOrder(type, fields) {
  const layouts = readFormDesignLayouts();
  layouts.draft[type].order = fields.map((field) => field.fieldKey);
  syncFormDesignSectionsWithOrder(layouts.draft[type]);
  writeFormDesignLayouts(layouts);
}

function syncFormDesignSectionsWithOrder(layout) {
  const currentFieldKeys = activeConfigFields().map((field) => field.fieldKey);
  const currentFieldKeySet = new Set(currentFieldKeys);
  const savedOrder = Array.isArray(layout.order) ? layout.order : [];
  layout.order = [
    ...savedOrder.filter((fieldKey, index) => currentFieldKeySet.has(fieldKey) && savedOrder.indexOf(fieldKey) === index),
    ...currentFieldKeys.filter((fieldKey) => !savedOrder.includes(fieldKey))
  ];
  const mainFieldKeys = (layout.order || [])
    .map((fieldKey) => findConfigField(fieldKey))
    .filter((field) => field && field.tableType !== 'detail')
    .map((field) => field.fieldKey);
  const knownMain = new Set(mainFieldKeys);
  const seen = new Set();
  layout.sections = (layout.sections || []).map((section, index) => {
    const fieldKeys = (section.fieldKeys || []).filter((fieldKey) => {
      if (!knownMain.has(fieldKey) || seen.has(fieldKey)) return false;
      seen.add(fieldKey);
      return true;
    });
    return {
      id: section.id || `section_${index + 1}`,
      title: section.title || `Section ${index + 1}`,
      columns: Math.min(3, Math.max(1, Number(section.columns) || 1)),
      fieldKeys
    };
  });
  if (!layout.sections.length) {
    layout.sections.push({ id: 'section_general', title: 'General', columns: 1, fieldKeys: [] });
  }
  const missing = mainFieldKeys.filter((fieldKey) => !seen.has(fieldKey));
  layout.sections[0].fieldKeys.push(...missing);
  layout.fieldSpans = Object.fromEntries(Object.entries(layout.fieldSpans || {})
    .filter(([fieldKey]) => knownMain.has(fieldKey))
    .map(([fieldKey, span]) => [fieldKey, Math.min(3, Math.max(1, Number(span) || 1))]));
}

function formDesignHiddenFieldKeys(type = state.activeFormDesignType) {
  const layouts = readFormDesignLayouts();
  const hidden = new Set(layouts.draft[type]?.hidden || []);
  activeConfigFields()
    .filter((field) => !field.showInForm)
    .forEach((field) => hidden.add(field.fieldKey));
  return hidden;
}

function isFormDesignFieldVisible(field, type = state.activeFormDesignType) {
  return Boolean(field.showInForm) && !formDesignHiddenFieldKeys(type).has(field.fieldKey);
}

function updateFormDesignFieldVisibility(fieldKeys, showInForm, type = state.activeFormDesignType) {
  const layouts = readFormDesignLayouts();
  const hidden = new Set(layouts.draft[type]?.hidden || []);
  fieldKeys.forEach((fieldKey) => {
    if (showInForm) {
      hidden.delete(fieldKey);
    } else {
      hidden.add(fieldKey);
    }
  });
  layouts.draft[type].hidden = Array.from(hidden);
  writeFormDesignLayouts(layouts);
}

function syncFormDesignDisplayVisibility(visibilityByFieldKey, moduleKey = state.activeConfigModule) {
  const layouts = readFormDesignLayouts(moduleKey);
  ['draft', 'published'].forEach((stateKey) => {
    formDesignTypes.forEach((type) => {
      const hidden = new Set(layouts[stateKey]?.[type]?.hidden || []);
      Object.entries(visibilityByFieldKey).forEach(([fieldKey, showInForm]) => {
        if (showInForm) {
          hidden.delete(fieldKey);
        } else {
          hidden.add(fieldKey);
        }
      });
      layouts[stateKey][type].hidden = Array.from(hidden);
    });
  });
  writeFormDesignLayouts(layouts, moduleKey);
}

function moveFormDesignField(fieldKey, direction) {
  let fields = orderedFormDesignFields();
  const index = fields.findIndex((field) => field.fieldKey === fieldKey);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= fields.length) return;
  const nextFields = [...fields];
  [nextFields[index], nextFields[nextIndex]] = [nextFields[nextIndex], nextFields[index]];
  updateFormDesignDraftOrder(state.activeFormDesignType, nextFields);
  renderFormDesignDrawer();
}

function detailTableKeysFromFields(fields) {
  return Array.from(new Set(fields
    .filter((field) => field.tableType === 'detail' && field.detailTableName)
    .map((field) => field.detailTableName)));
}

function applyDetailTableOrder(tableNames) {
  const fields = orderedFormDesignFields();
  const nonDetailFields = fields.filter((field) => field.tableType !== 'detail');
  const detailFields = tableNames.flatMap((tableName) => fields.filter((field) => field.detailTableName === tableName));
  updateFormDesignDraftOrder(state.activeFormDesignType, [...nonDetailFields, ...detailFields]);
  renderFormDesignDrawer();
}

function moveFormDesignDetailTable(tableName, direction) {
  const tableNames = detailTableKeysFromFields(orderedFormDesignFields().filter((field) => isFormDesignFieldVisible(field)));
  const index = tableNames.indexOf(tableName);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= tableNames.length) return;
  [tableNames[index], tableNames[nextIndex]] = [tableNames[nextIndex], tableNames[index]];
  applyDetailTableOrder(tableNames);
}

function reorderFormDesignDetailTable(draggedTableName, targetTableName) {
  if (!draggedTableName || !targetTableName || draggedTableName === targetTableName) return;
  const tableNames = detailTableKeysFromFields(orderedFormDesignFields().filter((field) => isFormDesignFieldVisible(field)));
  const fromIndex = tableNames.indexOf(draggedTableName);
  const toIndex = tableNames.indexOf(targetTableName);
  if (fromIndex < 0 || toIndex < 0) return;
  const [draggedTable] = tableNames.splice(fromIndex, 1);
  tableNames.splice(toIndex, 0, draggedTable);
  state.draggingFormDesignDetailTable = '';
  state.dragOverFormDesignDetailTable = '';
  applyDetailTableOrder(tableNames);
}

function moveFormDesignDetailField(fieldKey, direction) {
  const fields = orderedFormDesignFields();
  const field = fields.find((item) => item.fieldKey === fieldKey);
  if (!field?.detailTableName) return;
  const tableFields = fields.filter((item) => item.detailTableName === field.detailTableName);
  const index = tableFields.findIndex((item) => item.fieldKey === fieldKey);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= tableFields.length) return;
  [tableFields[index], tableFields[nextIndex]] = [tableFields[nextIndex], tableFields[index]];
  const nextFields = fields.map((item) => {
    if (item.detailTableName !== field.detailTableName) return item;
    return tableFields.shift();
  });
  state.selectedFormDesignFieldKey = fieldKey;
  updateFormDesignDraftOrder(state.activeFormDesignType, nextFields);
  renderFormDesignDrawer();
}

function reorderFormDesignField(draggedFieldKey, targetFieldKey) {
  if (!draggedFieldKey || !targetFieldKey || draggedFieldKey === targetFieldKey) return;
  const fields = orderedFormDesignFields();
  const fromIndex = fields.findIndex((field) => field.fieldKey === draggedFieldKey);
  const toIndex = fields.findIndex((field) => field.fieldKey === targetFieldKey);
  if (fromIndex < 0 || toIndex < 0) return;
  const nextFields = [...fields];
  const [draggedField] = nextFields.splice(fromIndex, 1);
  nextFields.splice(toIndex, 0, draggedField);
  state.selectedFormDesignFieldKey = draggedFieldKey;
  state.draggingFormDesignFieldKey = '';
  state.dragOverFormDesignFieldKey = '';
  updateFormDesignDraftOrder(state.activeFormDesignType, nextFields);
  renderFormDesignDrawer();
}

function selectedFormDesignField() {
  return findConfigField(state.selectedFormDesignFieldKey);
}

function formDesignAllowsFieldProperties() {
  return state.activeFormDesignType !== 'detail';
}

function formDesignSelectedHelpText(selectedField) {
  if (!formDesignAllowsFieldProperties()) {
    return selectedField
      ? 'Detail layout is display-only for field properties.'
      : 'Click a field to arrange the detail layout.';
  }
  if (!selectedField) return 'Click a field to arrange or edit it.';
  return 'Use the actions, double-click for formula, or right-click for field settings.';
}

function updateFormDesignSelectionUI() {
  const selectedField = selectedFormDesignField();
  $$('#formDesignCanvas [data-design-field]').forEach((card) => {
    card.classList.toggle('is-selected', card.dataset.designField === state.selectedFormDesignFieldKey);
  });
  const label = $('#formDesignSelectedLabel');
  const help = $('#formDesignSelectedHelp');
  if (label) label.textContent = selectedField ? selectedField.label : 'Select a field';
  if (help) {
    help.textContent = formDesignSelectedHelpText(selectedField);
  }
  $$('[data-design-action="edit-field"], [data-design-action="formula"], [data-design-action="field-linkage"]').forEach((button) => {
    button.disabled = !selectedField;
  });
}

function selectFormDesignField(fieldKey) {
  state.selectedFormDesignFieldKey = fieldKey;
  updateFormDesignSelectionUI();
}

function requiredFieldMarker(field) {
  return field.required ? ' <span class="required-text">*</span>' : '';
}

function labelTextWithRequired(field) {
  return `${escapeHtml(field.label)}${requiredFieldMarker(field)}`;
}

function formLabelText(field) {
  return `<span class="field-label-text">${labelTextWithRequired(field)}</span>`;
}

function formDesignFieldCard(field) {
  const layout = activeFormDesignLayout();
  const span = Math.min(layout.sections?.find((section) => (section.fieldKeys || []).includes(field.fieldKey))?.columns || 1, Number(layout.fieldSpans?.[field.fieldKey] || 1));
  return `
    <article class="form-design-field form-design-preview-field ${field.fieldKey === state.selectedFormDesignFieldKey ? 'is-selected' : ''} ${field.fieldKey === state.draggingFormDesignFieldKey ? 'is-dragging' : ''} ${field.fieldKey === state.dragOverFormDesignFieldKey ? 'is-drag-over' : ''}" data-design-field="${escapeHtml(field.fieldKey)}" draggable="true" title="Drag to reorder. Double-click to configure formula." style="grid-column: span ${span};">
      ${renderFormDesignMainField(field)}
      <div class="form-design-field-meta">
        ${field.formulaEnabled ? '<span class="formula-badge">fx</span>' : ''}
      </div>
    </article>
  `;
}

function formDesignPaletteField(field) {
  return `
    <article class="form-design-field is-hidden ${field.fieldKey === state.draggingFormDesignFieldKey ? 'is-dragging' : ''}" data-design-field="${escapeHtml(field.fieldKey)}" data-design-palette-field="true" draggable="true" title="Drag onto the form to show this field.">
      <div>
        <strong>${escapeHtml(field.label)}</strong>
        <span>${escapeHtml(fieldTypeLabel(field.type))}</span>
      </div>
      <div class="form-design-field-meta">
        <span class="status-pill muted-pill">Hidden</span>
        ${field.required ? '<span class="status-pill required-pill">Required</span>' : ''}
        ${field.formulaEnabled ? '<span class="formula-badge">fx</span>' : ''}
      </div>
    </article>
  `;
}

function hiddenDetailTableGroups(fields) {
  return groupedHiddenDesignFields(fields).filter((group) => group.key.startsWith('detail:'));
}

function groupedHiddenDesignFields(fields) {
  const groups = new Map();
  const addFieldToGroup = (key, label, field) => {
    if (!groups.has(key)) {
      groups.set(key, { key, label, fields: [] });
    }
    groups.get(key).fields.push(field);
  };

  fields.forEach((field) => {
    if (field.tableType === 'detail') {
      const tableName = field.detailTableName || generatedDetailTableName();
      addFieldToGroup(`detail:${tableName}`, tableLabel(tableName), field);
      return;
    }
    addFieldToGroup('main', 'Main Table', field);
  });

  return Array.from(groups.values());
}

function renderHiddenFormDesignGroups(fields) {
  if (!fields.length) {
    return '<p class="muted">Every field is on this form.</p>';
  }

  return groupedHiddenDesignFields(fields).map((group) => `
    <section class="form-design-palette-group">
      <div class="form-design-palette-group-heading">
        <strong>${escapeHtml(group.label)}</strong>
        <span>${group.fields.length} fields</span>
      </div>
      <div class="form-design-palette-list">
        ${group.fields.map(formDesignPaletteField).join('')}
      </div>
    </section>
  `).join('');
}

function renderHiddenDetailTableInsertions(fields) {
  const groups = hiddenDetailTableGroups(fields);
  if (!groups.length) return '';
  return `
    <div class="form-design-detail-insertions">
      ${groups.map((group) => {
        const tableName = group.key.replace(/^detail:/, '');
        return `
          <button type="button" class="secondary small-button" data-show-detail-table="${escapeHtml(tableName)}">
            Insert ${escapeHtml(group.label)}
          </button>
        `;
      }).join('')}
    </div>
  `;
}

function renderFormDesignPreviewControl(field) {
  const formulaReadonly = field.formulaEnabled && field.formulaExpression
    ? 'readonly data-formula-field="true"'
    : '';
  const placeholder = escapeHtml(field.label);
  if (field.type === 'textarea') {
    return `<textarea rows="4" placeholder="${placeholder}" ${formulaReadonly} disabled></textarea>`;
  }

  if (field.type === 'select' || field.type === 'dropdownbox') {
    const options = (field.options?.length ? field.options : ['Select']).map((option, index) => (
      `<option value="${escapeHtml(option)}" ${index === 0 ? 'selected' : ''}>${escapeHtml(titleCaseMessage(option))}</option>`
    )).join('');
    return `<select disabled>${options}</select>`;
  }

  if (field.type === 'country') {
    const malaysia = malaysiaCountry();
    const countries = state.countries.length ? state.countries : [{ id: '', name: 'Malaysia' }];
    const options = countries.map((country) => (
      `<option value="${country.id}" ${malaysia && Number(country.id) === Number(malaysia.id) ? 'selected' : ''}>${escapeHtml(country.name)}</option>`
    )).join('');
    return `<select disabled>${options}</select>`;
  }

  if (field.type === 'owner') {
    const users = state.users.filter((user) => user.status === 'active');
    const options = '<option value="">Unassigned</option>' + users
      .map((user) => `<option value="${user.id}">${escapeHtml(user.name)}</option>`)
      .join('');
    return `<select disabled>${options}</select>`;
  }

  if (field.type === 'checkbox') {
    return `<input type="checkbox" disabled>`;
  }
  if (field.type === 'browser_button') {
    return renderBrowserFieldInput(field, '', { detailField: false });
  }
  if (field.type === 'attach_document') {
    return `<input type="file" disabled>`;
  }
  if (field.type === 'image') {
    return `<input type="file" accept="image/*" disabled>`;
  }
  const inputType = {
    phone: 'tel',
    textbox: 'text',
    int: 'number',
    decimals: 'number'
  }[field.type] || field.type;
  const step = field.type === 'int' ? 'step="1"' : field.type === 'decimals' ? 'step="any"' : '';
  return `<input type="${escapeHtml(inputType)}" placeholder="${placeholder}" ${step} ${formulaReadonly} disabled>`;
}

function renderFormDesignMainField(field) {
  const control = renderFormDesignPreviewControl(field);
  if (field.type === 'country') {
    return `
      <div class="grid-two">
        <label>
          <span>${labelTextWithRequired(field)}</span>
          ${control}
        </label>
        <label>
          <span>Code</span>
          <input value="+60" readonly disabled>
        </label>
      </div>
    `;
  }
  return `
    <label>
      <span>${labelTextWithRequired(field)}</span>
      ${control}
    </label>
  `;
}

function renderFormDesignDetailTable(group) {
  const visibleTableNames = detailTableKeysFromFields(orderedFormDesignFields().filter((field) => isFormDesignFieldVisible(field)));
  const tableIndex = visibleTableNames.indexOf(group.tableName);
  return `
    <section class="form-design-detail-table ${group.tableName === state.draggingFormDesignDetailTable ? 'is-dragging' : ''} ${group.tableName === state.dragOverFormDesignDetailTable ? 'is-drag-over' : ''}" data-design-detail-table="${escapeHtml(group.tableName)}">
      <div class="form-design-detail-header">
        <div class="form-design-detail-title">
          <button type="button" class="detail-table-drag-handle" draggable="true" data-design-detail-table-handle="${escapeHtml(group.tableName)}" aria-label="Drag ${escapeHtml(group.tableName)} detail table">::</button>
          <label>
            <span>Detail Table Name</span>
            <input value="${escapeHtml(group.tableName)}" data-detail-table-name-input="${escapeHtml(group.tableName)}" aria-label="Detail table name">
          </label>
        </div>
        <div class="form-design-detail-actions">
          <span>${group.fields.length} fields</span>
          <button type="button" class="secondary small-button" data-move-detail-table="${escapeHtml(group.tableName)}" data-direction="-1" ${tableIndex <= 0 ? 'disabled' : ''}>Up</button>
          <button type="button" class="secondary small-button" data-move-detail-table="${escapeHtml(group.tableName)}" data-direction="1" ${tableIndex === visibleTableNames.length - 1 ? 'disabled' : ''}>Down</button>
          <button type="button" class="secondary small-button" data-hide-detail-table="${escapeHtml(group.tableName)}">Hide</button>
        </div>
      </div>
      <div class="table-wrap form-design-detail-preview">
        <table>
          <thead>
            <tr>
              <th class="select-cell"><input type="checkbox" disabled></th>
              <th>No.</th>
              ${group.fields.map((field, index) => `
                <th>
                  <div class="form-design-detail-column-head">
                    <span>${labelTextWithRequired(field)}</span>
                    <span class="form-design-column-actions">
                      <button type="button" class="secondary small-button" data-move-detail-field="${escapeHtml(field.fieldKey)}" data-direction="-1" ${index <= 0 ? 'disabled' : ''}>Left</button>
                      <button type="button" class="secondary small-button" data-move-detail-field="${escapeHtml(field.fieldKey)}" data-direction="1" ${index === group.fields.length - 1 ? 'disabled' : ''}>Right</button>
                    </span>
                  </div>
                </th>
              `).join('')}
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="select-cell"><input type="checkbox" disabled></td>
              <td>1</td>
              ${group.fields.map((field) => `
                <td>
                  <div class="form-design-detail-cell ${field.fieldKey === state.selectedFormDesignFieldKey ? 'is-selected' : ''} ${field.fieldKey === state.draggingFormDesignFieldKey ? 'is-dragging' : ''} ${field.fieldKey === state.dragOverFormDesignFieldKey ? 'is-drag-over' : ''}" data-design-field="${escapeHtml(field.fieldKey)}" draggable="true" title="Drag to reorder. Double-click to configure formula.">
                    ${renderFormDesignPreviewControl(field)}
                  </div>
                </td>
              `).join('')}
              <td><button type="button" class="secondary small-button" disabled>Remove</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function groupedDetailDesignFields(fields) {
  const groups = new Map();
  fields
    .filter((field) => field.tableType === 'detail')
    .forEach((field) => {
      const tableName = field.detailTableName || generatedDetailTableName();
      if (!groups.has(tableName)) {
        groups.set(tableName, []);
      }
      groups.get(tableName).push(field);
    });
  return Array.from(groups.entries()).map(([tableName, groupFields]) => ({ tableName, fields: groupFields }));
}

function copyFormDesignLayout(sourceType) {
  if (!formDesignTypes.includes(sourceType) || sourceType === state.activeFormDesignType) return;
  const layouts = readFormDesignLayouts();
  layouts.draft[state.activeFormDesignType] = {
    order: [...(layouts.draft[sourceType]?.order || defaultFormDesignOrder())],
    hidden: [...(layouts.draft[sourceType]?.hidden || [])],
    fieldSpans: { ...(layouts.draft[sourceType]?.fieldSpans || {}) },
    sections: (layouts.draft[sourceType]?.sections || []).map((section) => ({ ...section, fieldKeys: [...(section.fieldKeys || [])] }))
  };
  writeFormDesignLayouts(layouts);
  renderFormDesignDrawer();
  toast(`Copied ${titleCaseMessage(sourceType)} layout.`);
}

function activeFormDesignLayout() {
  const layouts = readFormDesignLayouts();
  const layout = layouts.draft[state.activeFormDesignType] || defaultFormDesignLayout();
  syncFormDesignSectionsWithOrder(layout);
  return layout;
}

async function saveFormDesignDraft() {
  const fields = orderedFormDesignFields();
  updateFormDesignDraftOrder(state.activeFormDesignType, fields);
  const formName = titleCaseMessage(state.activeFormDesignType);
  try {
    const config = await api(`/api/sysadmin/modules/${state.activeConfigModule}/form-layouts/draft/${state.activeFormDesignType}`, {
      method: 'PUT',
      body: JSON.stringify(activeFormDesignLayout())
    });
    setModuleConfig(state.activeConfigModule, config.fields, config.formLayouts);
    showSuccessPrompt('Draft Saved', `${formName} form draft saved successfully.`);
    toast(`${formName} Form Draft Saved Successfully.`);
  } catch (error) {
    toast(titleCaseMessage(error.message), 'error');
  }
}

async function publishFormDesign() {
  const layouts = readFormDesignLayouts();
  layouts.published[state.activeFormDesignType] = {
    order: [...(layouts.draft[state.activeFormDesignType]?.order || defaultFormDesignOrder())],
    hidden: [...(layouts.draft[state.activeFormDesignType]?.hidden || [])],
    fieldSpans: { ...(layouts.draft[state.activeFormDesignType]?.fieldSpans || {}) },
    sections: (layouts.draft[state.activeFormDesignType]?.sections || []).map((section) => ({ ...section, fieldKeys: [...(section.fieldKeys || [])] }))
  };
  writeFormDesignLayouts(layouts);
  const formName = titleCaseMessage(state.activeFormDesignType);
  try {
    const config = await api(`/api/sysadmin/modules/${state.activeConfigModule}/form-layouts/publish/${state.activeFormDesignType}`, {
      method: 'POST',
      body: JSON.stringify(layouts.draft[state.activeFormDesignType])
    });
    setModuleConfig(state.activeConfigModule, config.fields, config.formLayouts);
    showSuccessPrompt('Form Published', `${formName} form published successfully.`);
    toast(`${formName} Form Published Successfully.`);
  } catch (error) {
    toast(titleCaseMessage(error.message), 'error');
  }
}

async function setFormDesignFieldVisibility(fieldKey, showInForm) {
  const field = findConfigField(fieldKey);
  if (!field) return;
  updateFormDesignFieldVisibility([fieldKey], showInForm);
  if (field.showInForm !== showInForm) {
    try {
      const config = await api(`/api/sysadmin/modules/${state.activeConfigModule}/fields/${fieldKey}`, {
        method: 'PATCH',
        body: JSON.stringify({ showInForm })
      });
      syncFormDesignDisplayVisibility({ [fieldKey]: showInForm });
      setModuleConfig(state.activeConfigModule, config.fields, config.formLayouts);
    } catch (error) {
      toast(titleCaseMessage(error.message), 'error');
      renderFormDesignDrawer();
      return;
    }
  }
  state.selectedFormDesignFieldKey = fieldKey;
  renderFormDesignDrawer();
  toast(showInForm ? 'Field Added To This Form.' : 'Field Removed From This Form.');
}

async function setFormDesignDetailTableVisibility(tableName, showInForm) {
  const fields = activeConfigFields()
    .filter((field) => field.tableType === 'detail' && field.detailTableName === tableName && isFormDesignFieldVisible(field) !== showInForm);
  if (!fields.length) return;
  updateFormDesignFieldVisibility(fields.map((field) => field.fieldKey), showInForm);
  try {
    let latestConfig = null;
    for (const field of fields) {
      if (field.showInForm === showInForm) continue;
      latestConfig = await api(`/api/sysadmin/modules/${state.activeConfigModule}/fields/${field.fieldKey}`, {
        method: 'PATCH',
        body: JSON.stringify({ showInForm })
      });
    }
    syncFormDesignDisplayVisibility(Object.fromEntries(fields.map((field) => [field.fieldKey, showInForm])));
    if (latestConfig) {
      setModuleConfig(state.activeConfigModule, latestConfig.fields, latestConfig.formLayouts);
    }
  } catch (error) {
    toast(titleCaseMessage(error.message), 'error');
    renderFormDesignDrawer();
    return;
  }
  renderFormDesignDrawer();
  toast(showInForm ? 'Detail Table Added To This Form.' : 'Detail Table Hidden From This Form.');
}

async function renameFormDesignDetailTable(oldTableName, newTableName) {
  const nextTableName = normalizeDetailTableNamePreview(newTableName);
  if (!nextTableName) {
    toast('Detail Table Name is required.', 'error');
    renderFormDesignDrawer();
    return;
  }
  if (nextTableName === oldTableName) {
    renderFormDesignDrawer();
    return;
  }
  try {
    const config = await api(`/api/sysadmin/modules/${state.activeConfigModule}/detail-tables/${encodeURIComponent(oldTableName)}`, {
      method: 'PATCH',
      body: JSON.stringify({ detailTableName: nextTableName })
    });
    setModuleConfig(state.activeConfigModule, config.fields, config.formLayouts);
    toast('Detail Table Renamed.');
  } catch (error) {
    toast(titleCaseMessage(error.message), 'error');
    renderFormDesignDrawer();
  }
}

function batchExistingTables() {
  const detailTables = activeConfigFields()
    .filter((field) => field.tableType === 'detail' && field.detailTableName)
    .map((field) => field.detailTableName);
  return ['main', ...Array.from(new Set([...detailTables, ...state.batchDetailTables]))];
}

function nextBatchDetailTableName() {
  const existing = batchExistingTables().filter((table) => table !== 'main');
  let index = existing.length + 1;
  let tableName = `${activeModuleKeyBase()}_dt${index}`;
  while (existing.includes(tableName)) {
    index += 1;
    tableName = `${activeModuleKeyBase()}_dt${index}`;
  }
  return tableName;
}

function batchRowsForActiveTable() {
  if (state.batchShowingArchived) {
    return state.batchArchivedRows.map((row) => ({ existing: true, row }));
  }
  const existingRows = state.batchEditRows
    .filter((row) => row.tableKey === state.batchActiveTable)
    .map((row) => ({ existing: true, row }));
  const draftRows = state.batchDraftRows
    .filter((row) => row.tableKey === state.batchActiveTable)
    .map((row) => ({ existing: false, row }));
  return [...existingRows, ...draftRows];
}

function batchRowFromField(field) {
  return {
    id: `${field.archived ? 'archived' : 'existing'}-${field.fieldKey}`,
    existing: true,
    locked: Boolean(field.locked),
    archived: Boolean(field.archived),
    dataCount: Number(field.dataCount || 0),
    tableKey: tableKeyForField(field),
    fieldKey: field.fieldKey,
    databaseFieldName: field.dataKey || field.fieldKey,
    label: field.label,
    type: field.type,
    options: (field.options || []).join(', '),
    showInTable: field.showInTable,
    showInForm: field.showInForm,
    showInImport: field.showInImport,
    required: field.required
  };
}

function findBatchRow(rowId) {
  return state.batchEditRows.find((row) => row.id === rowId)
    || state.batchArchivedRows.find((row) => row.id === rowId)
    || state.batchDraftRows.find((row) => row.id === rowId);
}

function canDeleteBatchRow(row) {
  if (!row) return false;
  if (!row.existing) return true;
  return !row.locked && Number(row.dataCount || 0) === 0;
}

function canSelectBatchRow(row) {
  return Boolean(row && !row.locked);
}

function canArchiveBatchRow(row) {
  return Boolean(row && row.existing && !row.locked);
}

function canDuplicateBatchRow(row) {
  return Boolean(row && !row.locked && !row.archived);
}

function canRestoreBatchRow(row) {
  return Boolean(row && row.archived && !row.locked);
}

function selectedBatchRows() {
  return [
    ...state.batchEditRows,
    ...state.batchArchivedRows,
    ...state.batchDraftRows
  ].filter((row) => state.batchSelectedRowIds.has(row.id));
}

function selectedActionRows(predicate) {
  return selectedBatchRows().filter(predicate);
}

function createBatchDraftRow(tableKey = state.batchActiveTable, overrides = {}) {
  const id = `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  state.batchDraftRows.push({
    id,
    tableKey,
    label: '',
    fieldKey: '',
    databaseFieldName: '',
    type: 'textbox',
    options: '',
    showInTable: true,
    showInForm: true,
    showInImport: false,
    required: false,
    ...overrides,
    id,
    tableKey
  });
}

function duplicateBatchRows(rows) {
  rows.forEach((row) => {
    const label = `${row.label || 'Field'} Copy`;
    const fieldKey = uniqueFieldKeyForLabel(label, row.tableKey);
    createBatchDraftRow(row.tableKey, {
      label,
      fieldKey,
      databaseFieldName: fieldKey,
      type: editableFieldTypes.some((type) => type.value === row.type) ? row.type : 'textbox',
      options: row.options || '',
      showInTable: row.showInTable,
      showInForm: row.showInForm,
      showInImport: row.showInImport,
      required: row.required
    });
  });
}

function renderBatchTabs() {
  const tabs = $('#batchTableTabs');
  if (!tabs) return;
  tabs.hidden = state.batchShowingArchived;
  const addDetailButton = $('#addDetailTableTab');
  if (addDetailButton) addDetailButton.hidden = state.batchShowingArchived;
  tabs.innerHTML = batchExistingTables().map((tableKey) => {
    const hasSavedFields = activeConfigFields().some((field) => tableKeyForField(field) === tableKey);
    const canRemove = tableKey !== 'main' && !hasSavedFields;
    return `
      <span class="tab-item ${state.batchActiveTable === tableKey ? 'is-active' : ''}">
        <button type="button" class="tab-button ${state.batchActiveTable === tableKey ? 'is-active' : ''}" data-batch-table="${escapeHtml(tableKey)}">
          ${escapeHtml(tableLabel(tableKey))}
        </button>
        ${canRemove ? `<button type="button" class="tab-remove-button" data-remove-batch-table="${escapeHtml(tableKey)}" aria-label="Remove ${escapeHtml(tableLabel(tableKey))}">x</button>` : ''}
      </span>
    `;
  }).join('');
  $('#batchActiveTableLabel').textContent = state.batchShowingArchived ? 'Archived Fields' : tableLabel(state.batchActiveTable);
}

function renderBatchRows() {
  const body = $('#batchFieldRows');
  if (!body) return;
  const rows = batchRowsForActiveTable();
  const selectableRows = rows.filter((item) => canSelectBatchRow(item.row));
  const selectedSelectableRows = selectableRows.filter((item) => state.batchSelectedRowIds.has(item.row.id));
  const selectedRows = selectedBatchRows();
  const showingArchived = state.batchShowingArchived;
  const selectAll = $('#selectAllBatchFields');
  if (selectAll) {
    selectAll.disabled = selectableRows.length === 0;
    selectAll.checked = selectableRows.length > 0 && selectedSelectableRows.length === selectableRows.length;
    selectAll.indeterminate = selectedSelectableRows.length > 0 && selectedSelectableRows.length < selectableRows.length;
  }
  const deleteButton = $('#deleteSelectedBatchFields');
  if (deleteButton) {
    deleteButton.hidden = showingArchived;
    deleteButton.disabled = !selectedRows.some(canDeleteBatchRow);
  }
  const archiveButton = $('#archiveSelectedBatchFields');
  if (archiveButton) {
    archiveButton.hidden = showingArchived;
    archiveButton.disabled = !selectedRows.some(canArchiveBatchRow);
  }
  const duplicateButton = $('#duplicateSelectedBatchFields');
  if (duplicateButton) {
    duplicateButton.hidden = showingArchived;
    duplicateButton.disabled = !selectedRows.some(canDuplicateBatchRow);
  }
  const restoreButton = $('#restoreSelectedBatchFields');
  if (restoreButton) {
    restoreButton.hidden = !showingArchived;
    restoreButton.disabled = !selectedRows.some(canRestoreBatchRow);
  }
  const addButton = $('#addBatchFieldRow');
  if (addButton) addButton.hidden = showingArchived;
  const archivedButton = $('#showArchivedBatchFields');
  if (archivedButton) {
    archivedButton.textContent = showingArchived ? 'Active Fields' : 'Archived';
  }
  body.innerHTML = rows.map((item) => {
    const row = item.row;
    const isExisting = item.existing;
    const canDelete = canDeleteBatchRow(row);
    const canSelect = canSelectBatchRow(row);
    const deleteTitle = row.locked
      ? 'System field cannot be selected'
      : (Number(row.dataCount || 0) > 0 ? 'Select field to archive or duplicate. Delete is blocked because it has data.' : 'Select field');
    return `
      <tr class="${isExisting ? 'is-existing' : ''}" data-batch-row="${escapeHtml(row.id)}" ${isExisting ? 'data-existing-batch-row="true"' : ''}>
        <td class="batch-select-column">
          <input name="deleteRow" type="checkbox" aria-label="Select ${escapeHtml(row.label || row.fieldKey || 'field')}" title="${escapeHtml(deleteTitle)}" ${state.batchSelectedRowIds.has(row.id) ? 'checked' : ''} ${canSelect ? '' : 'disabled'} data-can-delete="${canDelete ? 'true' : 'false'}">
        </td>
        <td><input name="label" value="${escapeHtml(row.label)}" placeholder="Field name" ${showingArchived ? 'readonly' : ''}></td>
        <td><input name="fieldKey" value="${escapeHtml(row.fieldKey)}" placeholder="Auto" ${isExisting ? 'readonly' : ''}></td>
        <td><input name="databaseFieldName" value="${escapeHtml(row.databaseFieldName || row.fieldKey)}" placeholder="Auto" readonly></td>
        <td><select name="type" ${row.locked || showingArchived ? 'disabled' : ''}>${renderFieldTypeOptions(row.type, isExisting)}</select></td>
        <td><input name="options" value="${escapeHtml(row.options)}" placeholder="Option A, Option B" ${isDropdownOptionFieldType(row.type) ? '' : 'hidden'} ${showingArchived ? 'readonly' : ''}></td>
        <td>${batchEditableCheckbox('showInTable', row.showInTable, showingArchived)}</td>
        <td>${batchEditableCheckbox('showInForm', row.showInForm, showingArchived)}</td>
        <td>${batchEditableCheckbox('showInImport', row.showInImport, showingArchived)}</td>
        <td>${batchEditableCheckbox('required', row.required, showingArchived)}</td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="10">No fields in this table yet.</td></tr>';
}

function batchEditableCheckbox(name, checked, disabled = false) {
  return `<input name="${escapeHtml(name)}" type="checkbox" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}>`;
}

function renderBatchFieldModal() {
  renderBatchTabs();
  renderBatchRows();
}

async function openBatchFieldModal() {
  state.batchActiveTable = 'main';
  state.batchShowingArchived = false;
  state.batchDetailTables = activeConfigFields()
    .filter((field) => field.tableType === 'detail' && field.detailTableName)
    .map((field) => field.detailTableName)
    .filter((value, index, list) => list.indexOf(value) === index);
  state.batchEditRows = activeConfigFields().map(batchRowFromField);
  state.batchDraftRows = [];
  state.batchArchivedRows = [];
  state.batchSelectedRowIds = new Set();
  state.batchDeletedFieldKeys = new Set();
  state.batchArchivedFieldKeys = new Set();
  state.batchRestoredFieldKeys = new Set();
  try {
    const archived = await api(`/api/sysadmin/modules/${state.activeConfigModule}/fields/archived`);
    state.batchArchivedRows = (archived.fields || []).map(batchRowFromField);
  } catch (error) {
    toast(titleCaseMessage(error.message), 'error');
  }
  renderBatchFieldModal();
  $('#batchFieldModal').hidden = false;
  document.body.classList.add('modal-open');
}

function closeBatchFieldModal() {
  const modal = $('#batchFieldModal');
  if (!modal) return;
  resetModalFullscreen(modal);
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

function renderFieldProperties(fieldKey = '') {
  const body = $('#fieldPropertiesRows');
  if (!body) return;
  const selectedFieldKey = typeof fieldKey === 'string' ? fieldKey : '';
  const fields = selectedFieldKey
    ? activeConfigFields().filter((field) => field.fieldKey === selectedFieldKey)
    : activeConfigFields();
  body.innerHTML = fields.map((field) => {
    return `
      <tr data-properties-field="${escapeHtml(field.fieldKey)}">
        <td>
          <strong>${escapeHtml(field.label)}</strong>
          <div class="muted">${escapeHtml(field.fieldKey)}</div>
        </td>
        <td>${escapeHtml(fieldTypeLabel(field.type))}</td>
        <td>${propertyCheckbox('showInForm', field.showInForm)}</td>
        <td>${propertyCheckbox('editable', field.editable !== false)}</td>
        <td>${propertyCheckbox('required', field.required)}</td>
        <td>${propertyCheckbox('disableManualInput', Boolean(field.disableManualInput))}</td>
      </tr>
    `;
  }).join('');
}

function propertyCheckbox(name, checked, disabled = false) {
  return `<input name="${escapeHtml(name)}" type="checkbox" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}>`;
}

function renderConditionalRequiredOptions(selected = '', currentFieldKey = '') {
  return [
    '<option value="">None</option>',
    ...activeConfigFields()
      .filter((field) => field.fieldKey !== currentFieldKey)
      .map((field) => `<option value="${escapeHtml(field.fieldKey)}" ${field.fieldKey === selected ? 'selected' : ''}>${escapeHtml(field.label)}</option>`)
  ].join('');
}

function openFieldPropertiesModal(fieldKey = '') {
  renderFieldProperties(typeof fieldKey === 'string' ? fieldKey : '');
  $('#fieldPropertiesModal').hidden = false;
  document.body.classList.add('modal-open');
}

function closeFieldPropertiesModal() {
  const modal = $('#fieldPropertiesModal');
  if (!modal) return;
  resetModalFullscreen(modal);
  modal.classList.remove('is-over-drawer');
  modal.hidden = true;
  if ($('#formDesignDrawer')?.hidden !== false) {
    document.body.classList.remove('modal-open');
  }
}

function mappingHeaderPlaceholder(field, direction) {
  const systemHeaders = {
    companyName: 'Company Name',
    contactPerson: 'Contact Person',
    email: 'Email',
    countryId: 'Country',
    phoneNumber: 'Contact Number',
    status: 'Status',
    notes: 'Notes',
    ownerUserId: 'Owner'
  };
  return systemHeaders[field.fieldKey] || field.label || direction;
}

function renderImportExportMapping() {
  const body = $('#importExportMappingRows');
  if (!body) return;
  body.innerHTML = activeConfigFields().map((field) => `
    <tr data-mapping-field="${escapeHtml(field.fieldKey)}">
      <td>
        <strong>${escapeHtml(field.label)}</strong>
        <small>${escapeHtml(field.fieldKey)}</small>
      </td>
      <td>${propertyCheckbox('showInImport', field.showInImport)}</td>
      <td>
        <input name="importHeader" type="text" value="${escapeHtml(field.importHeader || '')}" placeholder="${escapeHtml(mappingHeaderPlaceholder(field, 'Import Header'))}">
      </td>
      <td>${propertyCheckbox('showInExport', field.showInExport !== false)}</td>
      <td>
        <input name="exportHeader" type="text" value="${escapeHtml(field.exportHeader || '')}" placeholder="${escapeHtml(mappingHeaderPlaceholder(field, 'Export Header'))}">
      </td>
    </tr>
  `).join('');
}

function openImportExportMappingModal() {
  renderImportExportMapping();
  $('#importExportMappingModal').hidden = false;
  document.body.classList.add('modal-open');
}

function closeImportExportMappingModal() {
  const modal = $('#importExportMappingModal');
  if (!modal) return;
  resetModalFullscreen(modal);
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

function renderFormulaTargets(selectedFieldKey = '') {
  const select = $('#formulaBuilderForm')?.elements.targetField;
  if (!select) return;
  select.innerHTML = formulaFieldGroups(formulaTargetFields()).map((group) => `
    <optgroup label="${escapeHtml(group.label)}">
      ${group.fields.map((field) => `<option value="${escapeHtml(field.fieldKey)}" ${field.fieldKey === selectedFieldKey ? 'selected' : ''}>${escapeHtml(field.label)}</option>`).join('')}
    </optgroup>
  `).join('');
}

function renderFormulaVariables(targetFieldKey = '') {
  const container = $('#formulaVariableList');
  if (!container) return;
  const groups = formulaFieldGroups(formulaFields().filter((field) => field.fieldKey !== targetFieldKey));
  container.innerHTML = groups.map((group) => `
    <section class="formula-variable-group">
      <div class="formula-variable-group-label">${escapeHtml(group.label)}</div>
      ${group.fields.map((field) => `
        <button type="button" class="link-button" data-insert-formula="{${escapeHtml(field.fieldKey)}}">${escapeHtml(field.label)}</button>
      `).join('')}
    </section>
  `).join('') || '<p class="muted">No source fields available.</p>';
}

function customFormulaFunctionNames(source = '', name = '', body = '') {
  try {
    return Object.keys(buildAvailableFormulaFunctions(activeConfigFields(), source, name, body));
  } catch (_error) {
    return [];
  }
}

function renderFormulaFunctions(source = '', name = '', body = '') {
  const container = $('#formulaFunctionList');
  if (!container) return;
  const builtIns = [
    ['ROUND(', 'ROUND(value)'],
    ['ABS(', 'ABS(value)'],
    ['MIN(', 'MIN(value1, value2)'],
    ['MAX(', 'MAX(value1, value2)']
  ];
  const builtInNames = new Set(builtIns.map(([_insert, label]) => label.split('(')[0]));
  const custom = customFormulaFunctionNames(source, name, body)
    .filter((functionName) => !builtInNames.has(functionName))
    .map((functionName) => [`${functionName}(`, `${functionName}(value)`]);
  container.innerHTML = [...builtIns, ...custom].map(([insert, label]) => (
    `<button type="button" class="link-button" data-insert-formula="${escapeHtml(insert)}">${escapeHtml(label)}</button>`
  )).join('');
}

const formulaFunctionPresets = {
  TRIM: "return String(value || '').trim();",
  LTRIM: "return String(value || '').replace(/^\\s+/, '');",
  RTRIM: "return String(value || '').replace(/\\s+$/, '');",
  UPPER: "return String(value || '').toUpperCase();",
  LOWER: "return String(value || '').toLowerCase();"
};

function savedFormulaFunctionPresets() {
  return activeConfigFields().reduce((presets, field) => {
    const functionName = String(field.formulaFunctionName || '').trim().toUpperCase();
    const functionBody = String(field.formulaFunctionBody || '').trim();
    if (functionName && functionBody) {
      presets[functionName] = functionBody;
    }
    return presets;
  }, {});
}

function renderFormulaPresetButtons() {
  const container = $('#formulaPresetButtons');
  if (!container) return;
  const presets = { ...formulaFunctionPresets, ...savedFormulaFunctionPresets() };
  container.innerHTML = Object.keys(presets).map((name) => (
    `<button type="button" class="secondary" data-function-preset="${escapeHtml(name)}">${escapeHtml(name)}</button>`
  )).join('');
}

function applyFormulaFunctionPreset(name) {
  const form = $('#formulaBuilderForm');
  const body = { ...formulaFunctionPresets, ...savedFormulaFunctionPresets() }[name];
  if (!form || !body) return;
  form.elements.formulaFunctionName.value = name;
  form.elements.formulaFunctionBody.value = body;
  renderFormulaFunctions(form.elements.formulaJs.value, name, body);
  updateFormulaPreview();
}

function syncFormulaBuilderField(fieldKey) {
  const form = $('#formulaBuilderForm');
  const field = findConfigField(fieldKey) || formulaTargetFields()[0];
  if (!form || !field) return;
  state.editingFormulaFieldKey = field.fieldKey;
  form.elements.fieldKey.value = field.fieldKey;
  form.elements.targetField.value = field.fieldKey;
  form.elements.formulaExpression.value = field.formulaExpression || '';
  form.elements.formulaJs.value = '';
  form.elements.formulaFunctionName.value = field.formulaFunctionName || '';
  form.elements.formulaFunctionBody.value = field.formulaFunctionBody || '';
  form.elements.formulaSql.value = field.formulaSql || '';
  form.elements.formulaEnabled.checked = Boolean(field.formulaEnabled);
  $('#formulaTargetLabel').textContent = `${field.label} =`;
  renderFormulaVariables(field.fieldKey);
  renderFormulaFunctions(field.formulaJs || '', field.formulaFunctionName || '', field.formulaFunctionBody || '');
  renderFormulaPresetButtons();
  updateFormulaPreview();
}

function updateFormulaPreview() {
  const form = $('#formulaBuilderForm');
  const preview = $('#formulaPreview');
  if (!form || !preview) return;
  const sampleValues = {};
  formulaFields().forEach((field, index) => {
    sampleValues[field.fieldKey] = index + 1;
  });
  try {
    const value = evaluateFormulaExpression(
      form.elements.formulaExpression.value,
      sampleValues,
      form.elements.formulaJs.value,
      form.elements.formulaFunctionName.value,
      form.elements.formulaFunctionBody.value,
      activeConfigFields()
    );
    preview.textContent = value === '' ? 'Preview: blank' : `Preview: ${value}`;
  } catch (error) {
    preview.textContent = error.message;
  }
}

function showFormulaTab(paneId) {
  $$('.formula-tab-pane').forEach((pane) => {
    pane.hidden = pane.id !== paneId;
  });
  $$('[data-formula-tab]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.formulaTab === paneId);
  });
}

function openFormulaBuilderModal(fieldKey = '') {
  if (!formulaTargetFields().length) {
    toast('Add A Field Before Creating A Formula.', 'error');
    return;
  }
  renderFormulaTargets(fieldKey);
  syncFormulaBuilderField(fieldKey || formulaTargetFields()[0]?.fieldKey || '');
  showFormulaTab('formulaExpressionPane');
  $('#formulaBuilderModal').hidden = false;
  document.body.classList.add('modal-open');
  $('#formulaBuilderForm [name="formulaExpression"]').focus();
}

function closeFormulaBuilderModal() {
  const modal = $('#formulaBuilderModal');
  if (!modal) return;
  resetModalFullscreen(modal);
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function setModalFullscreen(modal, enabled) {
  const card = modal?.querySelector('.modal-card, .form-design-drawer, .version-history-drawer, .page-permission-drawer, .api-connector-drawer, .api-interface-drawer');
  const button = card?.querySelector('[data-modal-fullscreen]');
  if (!card || !button) return;
  modal.classList.toggle('is-fullscreen', enabled);
  card.classList.toggle('is-fullscreen', enabled);
  button.setAttribute('aria-pressed', String(enabled));
  button.setAttribute('aria-label', enabled ? 'Restore popup size' : 'Enlarge to full screen');
  button.setAttribute('title', enabled ? 'Restore popup size' : 'Enlarge to full screen');
}

function resetModalFullscreen(modal) {
  setModalFullscreen(modal, false);
}

function toggleModalFullscreen(button) {
  const modal = button.closest('.modal-backdrop');
  const card = button.closest('.modal-card, .form-design-drawer, .version-history-drawer, .page-permission-drawer, .api-connector-drawer, .api-interface-drawer');
  if (!modal || !card) return;
  setModalFullscreen(modal, !card.classList.contains('is-fullscreen'));
}

function toast(message, type = 'ok') {
  const element = $('#toast');
  element.textContent = message;
  element.className = `toast ${type === 'error' ? 'error' : ''}`;
  element.hidden = false;
  setTimeout(() => {
    element.hidden = true;
  }, 4200);
}

function showSuccessPrompt(title, message) {
  $('#successPromptTitle').textContent = title;
  $('#successPromptMessage').textContent = message;
  $('#successPrompt').hidden = false;
  document.body.classList.add('modal-open');
}

function closeSuccessPrompt() {
  $('#successPrompt').hidden = true;
  if ($$('.modal-backdrop').every((modal) => modal.id === 'successPrompt' || modal.hidden)) {
    document.body.classList.remove('modal-open');
  }
}

async function api(path, options = {}) {
  const headers = options.headers || {};
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const authToken = await currentAuthToken();
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(path, { ...options, headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Request failed' }));
    if (response.status === 401 && path !== '/api/auth/login') {
      clearSession();
    }
    throw new Error(payload.error || 'Request failed');
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}

function initializeScrollableModalFrames() {
  const cards = $$('.modal-card:not(.compact-modal):not(.success-prompt-card):not(.confirmation-modal-card)');
  cards.forEach((card) => {
    if (card.classList.contains('has-fixed-modal-regions')) return;

    const header = Array.from(card.children).find((child) => child.classList?.contains('modal-header'));
    if (!header) return;

    const footer = Array.from(card.children).find((child) => child.classList?.contains('form-actions')) || null;
    const body = document.createElement('div');
    body.className = 'modal-scroll-body';

    let current = header.nextElementSibling;
    while (current && current !== footer) {
      const next = current.nextElementSibling;
      body.appendChild(current);
      current = next;
    }

    card.insertBefore(body, footer);
    card.classList.add('has-fixed-modal-regions');
  });
}

let confirmationResolver = null;

function closeConfirmationModal(confirmed = false) {
  const modal = $('#confirmationModal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  const resolve = confirmationResolver;
  confirmationResolver = null;
  if ($$('.modal-backdrop').every((item) => item.hidden)) document.body.classList.remove('modal-open');
  resolve?.(confirmed);
}

function showConfirmationModal({ title = 'Confirm action', message = '', confirmLabel = 'Confirm' } = {}) {
  if (confirmationResolver) closeConfirmationModal(false);
  $('#confirmationModalTitle').textContent = title;
  $('#confirmationModalMessage').textContent = message;
  $('#confirmModalAction').textContent = confirmLabel;
  $('#confirmationModal').hidden = false;
  document.body.classList.add('modal-open');
  return new Promise((resolve) => {
    confirmationResolver = resolve;
    requestAnimationFrame(() => $('#cancelConfirmationModal').focus());
  });
}

async function currentAuthToken() {
  return state.token;
}

async function loadAuthConfig() {
  const response = await fetch('/api/auth/config');
  if (!response.ok) {
    throw new Error('Unable to load auth configuration');
  }
  state.authConfig = await response.json();
}

function serializeForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function browserKeyPreview(label) {
  return String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function stringList(value) {
  if (Array.isArray(value)) return value.join(', ');
  return String(value || '');
}

function checkedValues(container) {
  return Array.from(container?.querySelectorAll('input[type="checkbox"]:checked') || [])
    .map((checkbox) => checkbox.value)
    .filter(Boolean);
}

function selectedOptionValues(select) {
  return Array.from(select?.selectedOptions || []).map((option) => option.value).filter(Boolean);
}

const permissionActions = ['view', 'create', 'edit', 'delete', 'import', 'export', 'configure'];
const workspacePermissionActions = ['configure'];
const fieldPermissionActions = ['view', 'create', 'edit', 'import', 'export'];

function browserFieldValue(field) {
  return field.dataKey || field.fieldKey;
}

function browserSourceKey(moduleKey, tableName) {
  return `${moduleKey}::${tableName}`;
}

function parseBrowserSourceKey(sourceKey = '') {
  const [moduleKey = '', tableName = ''] = String(sourceKey).split('::');
  return { moduleKey, tableName };
}

function browserCatalogModules() {
  const modules = new Map();
  state.adminModules.forEach((config) => {
    const module = config.module;
    if (module?.moduleKey) {
      modules.set(module.moduleKey, {
        key: module.moduleKey,
        name: module.name || titleCaseMessage(module.moduleKey),
        fields: config.fields || []
      });
    }
  });
  state.browserButtons.forEach((browser) => {
    if (!modules.has(browser.sourceModule)) {
      modules.set(browser.sourceModule, {
        key: browser.sourceModule,
        name: titleCaseMessage(browser.sourceModule),
        fields: []
      });
    }
  });
  if (!modules.has('countries')) {
    modules.set('countries', { key: 'countries', name: 'Countries', fields: [] });
  }
  return Array.from(modules.values()).sort((left, right) => left.name.localeCompare(right.name));
}

function browserTablesForModule(moduleKey) {
  const module = browserCatalogModules().find((item) => item.key === moduleKey);
  const tables = new Set([moduleKey]);
  module?.fields
    .filter((field) => field.tableType === 'detail' && field.detailTableName)
    .forEach((field) => tables.add(field.detailTableName));
  state.browserButtons
    .filter((browser) => browser.sourceModule === moduleKey)
    .forEach((browser) => tables.add(browser.sourceTable));
  return Array.from(tables).sort();
}

function browserCatalogSources() {
  return browserCatalogModules().map((module) => {
    const tables = browserTablesForModule(module.key);
    return {
      key: module.key,
      moduleKey: module.key,
      moduleName: module.name,
      tables,
      count: state.browserButtons.filter((browser) => browser.sourceModule === module.key).length
    };
  });
}

function activeBrowserSource() {
  if (!state.activeBrowserSource) return null;
  const { moduleKey } = parseBrowserSourceKey(state.activeBrowserSource);
  const activeModuleKey = moduleKey || state.activeBrowserSource;
  return browserCatalogSources().find((source) => source.moduleKey === activeModuleKey) || null;
}

function browserButtonsForActiveSource() {
  const source = activeBrowserSource();
  if (!source) return [];
  return state.browserButtons
    .filter((browser) => browser.sourceModule === source.moduleKey)
    .sort((left, right) => (
      left.sourceTable.localeCompare(right.sourceTable) ||
      left.name.localeCompare(right.name)
    ));
}

function renderBrowserSources() {
  const container = $('#browserSourceRows');
  if (!container) return;
  const search = state.browserSourceSearch.trim().toLowerCase();
  const sources = browserCatalogSources().filter((source) => (
    !search ||
    source.moduleName.toLowerCase().includes(search) ||
    source.moduleKey.toLowerCase().includes(search) ||
    source.tables.some((tableName) => tableName.toLowerCase().includes(search))
  ));
  const activeSource = activeBrowserSource();

  container.innerHTML = sources.map((source) => `
    <button type="button" class="browser-source-button ${source.key === activeSource?.key ? 'is-active' : ''}" data-browser-source="${escapeHtml(source.key)}">
      <span>
        <strong>${escapeHtml(source.moduleName)}</strong>
        <small>${escapeHtml(source.moduleKey)} &middot; ${source.tables.length} table${source.tables.length === 1 ? '' : 's'}</small>
      </span>
      <em>${source.count}</em>
    </button>
  `).join('') || '<p class="muted browser-source-empty">No modules found.</p>';
}

function renderBrowserSourceHeader() {
  const source = activeBrowserSource();
  const title = $('#activeBrowserSourceTitle');
  const meta = $('#activeBrowserSourceMeta');
  const newButton = $('#newBrowserButton');
  if (!title || !meta || !newButton) return;
  if (!source) {
    title.textContent = 'Select a module';
    meta.textContent = 'Choose a module to manage its browser buttons.';
    newButton.disabled = true;
    return;
  }
  title.textContent = source.moduleName;
  meta.textContent = `${source.count} browser button${source.count === 1 ? '' : 's'} configured across ${source.tables.length} table${source.tables.length === 1 ? '' : 's'}.`;
  newButton.disabled = false;
}

function selectBrowserSource(sourceKey) {
  state.activeBrowserSource = sourceKey;
  renderBrowserSources();
  renderBrowserButtons();
  clearBrowserButtonForm();
}

function browserFieldsForSource(moduleKey, tableName) {
  if (moduleKey === 'countries') {
    return ['id', 'name', 'iso2', 'dial_code'];
  }
  const module = browserCatalogModules().find((item) => item.key === moduleKey);
  const fields = module?.fields || [];
  const matchingFields = fields.filter((field) => (
    tableName === moduleKey
      ? field.tableType !== 'detail'
      : field.tableType === 'detail' && field.detailTableName === tableName
  ));
  return Array.from(new Set(['id', ...matchingFields.map(browserFieldValue).filter(Boolean)])).sort();
}

function renderSelectOptions(values, selected = '', placeholder = '') {
  const selectedSet = new Set(Array.isArray(selected) ? selected : [selected].filter(Boolean));
  const normalizedValues = Array.from(new Set([...values, ...selectedSet].filter(Boolean)));
  return [
    placeholder ? `<option value="">${escapeHtml(placeholder)}</option>` : '',
    ...normalizedValues.map((value) => `<option value="${escapeHtml(value)}" ${selectedSet.has(value) ? 'selected' : ''}>${escapeHtml(value)}</option>`)
  ].join('');
}

function renderCheckboxOptions(values, selected = []) {
  const selectedSet = new Set(selected);
  return values.map((value) => `
    <label class="browser-checkbox-option">
      <input type="checkbox" value="${escapeHtml(value)}" ${selectedSet.has(value) ? 'checked' : ''}>
      <span>${escapeHtml(value)}</span>
    </label>
  `).join('') || '<p class="muted browser-checkbox-empty">No fields available.</p>';
}

function syncBrowserSourceSelectors({
  sourceModule = '',
  sourceTable = '',
  valueField = '',
  displayField = '',
  searchFields = [],
  returnFields = []
} = {}) {
  const form = $('#browserButtonForm');
  if (!form) return;
  const source = activeBrowserSource();
  const moduleKey = sourceModule || source?.moduleKey || form.elements.sourceModule.value || '';
  const moduleTables = moduleKey ? browserTablesForModule(moduleKey) : [];
  const selectedTable = sourceTable || form.elements.sourceTable.value || moduleTables[0] || moduleKey;
  const tableName = moduleTables.includes(selectedTable) ? selectedTable : moduleTables[0] || selectedTable;
  form.elements.sourceModule.value = moduleKey;
  form.elements.sourceTable.value = tableName;
  form.elements.sourcePreview.innerHTML = renderSelectOptions(moduleTables, tableName, 'Select table');
  form.elements.sourcePreview.disabled = !moduleKey || moduleTables.length <= 1;

  const fields = browserFieldsForSource(moduleKey, tableName);
  const currentValue = form.elements.valueField.value;
  const currentDisplay = form.elements.displayField.value;
  const fallbackValue = valueField || (fields.includes(currentValue) ? currentValue : '') || (fields.includes('id') ? 'id' : fields[0] || '');
  const fallbackDisplay = displayField || (fields.includes(currentDisplay) ? currentDisplay : '') || fields.find((field) => field !== fallbackValue) || fallbackValue;
  const selectedSearch = searchFields.length
    ? searchFields
    : checkedValues(form.querySelector('[data-browser-field-list="searchFields"]')).filter((field) => fields.includes(field));
  const selectedReturn = returnFields.length
    ? returnFields
    : checkedValues(form.querySelector('[data-browser-field-list="returnFields"]')).filter((field) => fields.includes(field));
  form.elements.valueField.innerHTML = renderSelectOptions(fields, fallbackValue, 'Select value field');
  form.elements.displayField.innerHTML = renderSelectOptions(fields, fallbackDisplay, 'Select display field');
  form.querySelector('[data-browser-field-list="searchFields"]').innerHTML = renderCheckboxOptions(fields, selectedSearch);
  form.querySelector('[data-browser-field-list="returnFields"]').innerHTML = renderCheckboxOptions(fields, selectedReturn);
}

function renderBrowserButtonOptions(selected = '') {
  return [
    '<option value="">Select browser button</option>',
    ...state.browserButtons
      .filter((browser) => browser.enabled)
      .map((browser) => `<option value="${escapeHtml(browser.browserKey)}" ${browser.browserKey === selected ? 'selected' : ''}>${escapeHtml(browser.name)}</option>`)
  ].join('');
}

function clearBrowserButtonForm() {
  const form = $('#browserButtonForm');
  if (!form) return;
  form.reset();
  form.hidden = true;
  form.elements.editingBrowserKey.value = '';
  form.elements.browserKey.readOnly = false;
  form.elements.browserKey.value = '';
  form.elements.sourcePreview.disabled = true;
  form.elements.enabled.checked = true;
  syncBrowserSourceSelectors();
  $('#saveBrowserButton').textContent = 'Save Browser';
}

function openNewBrowserButtonForm() {
  const form = $('#browserButtonForm');
  const source = activeBrowserSource();
  if (!form || !source) return;
  form.reset();
  form.hidden = false;
  form.elements.editingBrowserKey.value = '';
  form.elements.browserKey.readOnly = false;
  form.elements.browserKey.value = '';
  form.elements.enabled.checked = true;
  syncBrowserSourceSelectors({
    sourceModule: source.moduleKey,
    sourceTable: source.tables[0] || source.moduleKey,
    valueField: 'id'
  });
  $('#saveBrowserButton').textContent = 'Save Browser';
}

function fillBrowserButtonForm(browser) {
  const form = $('#browserButtonForm');
  if (!form || !browser) return;
  state.activeBrowserSource = browser.sourceModule;
  renderBrowserSources();
  renderBrowserSourceHeader();
  form.hidden = false;
  form.elements.editingBrowserKey.value = browser.browserKey;
  form.elements.name.value = browser.name;
  form.elements.browserKey.value = browser.browserKey;
  form.elements.browserKey.readOnly = true;
  syncBrowserSourceSelectors(browser);
  form.elements.sqlWhere.value = browser.filter?.where || '';
  form.elements.enabled.checked = browser.enabled;
  $('#saveBrowserButton').textContent = 'Save Browser';
}

function renderBrowserButtons() {
  const body = $('#browserButtonRows');
  if (!body) return;
  renderBrowserSourceHeader();
  const source = activeBrowserSource();
  if (!source) {
    body.innerHTML = '<tr><td colspan="6">Select a module to view its browser buttons.</td></tr>';
    return;
  }
  body.innerHTML = browserButtonsForActiveSource().map((browser) => `
    <tr data-browser-key="${escapeHtml(browser.browserKey)}">
      <td>
        <strong>${escapeHtml(browser.name)}</strong>
        <div class="muted">${escapeHtml(browser.sourceTable)}</div>
        <div class="muted">${escapeHtml(browser.browserKey)}${browser.system ? ' &middot; system' : ''}</div>
      </td>
      <td>${escapeHtml(browser.valueField)}</td>
      <td>${escapeHtml(browser.displayField)}</td>
      <td>${escapeHtml(stringList(browser.searchFields))}</td>
      <td>${escapeHtml(browser.filter?.where || '')}</td>
      <td>
        <button type="button" class="link-button" data-edit-browser="${escapeHtml(browser.browserKey)}">Edit</button>
        ${browser.system ? '<span class="muted">Preset</span>' : `<button type="button" class="link-button danger-link" data-delete-browser="${escapeHtml(browser.browserKey)}">Delete</button>`}
      </td>
    </tr>
  `).join('') || '<tr><td colspan="6">No browser buttons configured for this module.</td></tr>';
}

async function refreshBrowserButtons() {
  if (state.user?.role !== 'admin') return;
  const [payload, modulePayload] = await Promise.all([
    api('/api/sysadmin/browser-buttons'),
    api('/api/sysadmin/modules')
  ]);
  state.browserButtons = payload.browserButtons || [];
  state.adminModules = modulePayload.modules || [];
  renderBrowserSources();
  renderBrowserButtons();
}

function closeBrowserLookupModal() {
  const modal = $('#browserLookupModal');
  if (!modal) return;
  resetModalFullscreen(modal);
  modal.hidden = true;
  if ($$('.modal-backdrop:not([hidden])').length === 0) {
    document.body.classList.remove('modal-open');
  }
  state.activeBrowserLookup = null;
  $('#browserLookupSearch').value = '';
  $('#browserLookupHead').innerHTML = '';
  $('#browserLookupRows').innerHTML = '';
}

function browserLookupTargetInput() {
  const lookup = state.activeBrowserLookup;
  if (!lookup) return null;
  if (lookup.target === 'detail') {
    return Array.from(lookup.row?.querySelectorAll('[data-detail-field]') || [])
      .find((input) => input.dataset.detailField === lookup.fieldKey) || null;
  }
  return lookup.form?.elements[lookup.fieldKey] || null;
}

function setBrowserLookupValue(result) {
  const input = browserLookupTargetInput();
  if (!input) return;
  const lookup = state.activeBrowserLookup;
  input.value = result.value ?? '';
  const display = input.closest('.browser-field-control')?.querySelector('.browser-field-display');
  if (display) {
    display.textContent = result.display || result.value || '';
  }
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  closeBrowserLookupModal();
}

async function applyFieldLinkageFromLookup(lookup, result) {
  if (!lookup?.fieldKey) return applyFieldLinkagesForTrigger('', result?.value, lookup);
  return applyFieldLinkagesForTrigger(lookup.fieldKey, result?.value, lookup);
}

async function resolveFieldLinkageConfig(config, value) {
  const mappings = Array.isArray(config.fieldMappings) ? config.fieldMappings : [];
  if (!config.primaryKeyField || !mappings.length) return;
  if (value === undefined || value === null || String(value).trim() === '') {
    return { columns: {}, rows: [] };
  }
  return api('/api/browser-buttons/field-linkage/resolve', {
    method: 'POST',
    body: JSON.stringify({
      ...config,
      sourceFields: Array.from(new Set(mappings.map((mapping) => mapping.sourceField).filter(Boolean))),
      value
    })
  });
}

function setLinkedTargetValue(target, value) {
  if (!target) return;
  if (target.type === 'checkbox') {
    target.checked = Boolean(value);
  } else {
    target.value = value ?? '';
  }
  target.dispatchEvent(new Event('input', { bubbles: true }));
}

function linkedTargetInput(context, targetField) {
  const resolvedTargetField = resolveLinkedTargetFieldKey(targetField);
  if (context?.target === 'detail') {
    return Array.from(context.row?.querySelectorAll('[data-detail-field]') || [])
      .find((item) => item.dataset.detailField === resolvedTargetField) || null;
  }
  return context?.form?.elements?.[resolvedTargetField] || $('#customerForm')?.elements?.[resolvedTargetField] || null;
}

async function applyFieldLinkageConfig(config, triggerValue, context = {}) {
  const mappings = Array.isArray(config.fieldMappings) ? config.fieldMappings : [];
  if (!mappings.length) return;
  if ((triggerValue === undefined || triggerValue === null || String(triggerValue).trim() === '') && config.clearOnEmpty !== false) {
    mappings.forEach((mapping) => {
      if (!mapping.targetField || mapping.targetField.startsWith('__')) return;
      setLinkedTargetValue(linkedTargetInput(context, mapping.targetField), '');
    });
    return;
  }
  const payload = await api('/api/browser-buttons/field-linkage/resolve', {
    method: 'POST',
    body: JSON.stringify({
      ...config,
      sourceFields: Array.from(new Set(mappings.map((mapping) => mapping.sourceField).filter(Boolean))),
      value: triggerValue
    })
  });
  const row = payload.rows?.[0]?.columns || payload.columns || {};
  mappings.forEach((mapping) => {
    if (!mapping.targetField || mapping.targetField.startsWith('__')) return;
    setLinkedTargetValue(
      linkedTargetInput(context, mapping.targetField),
      coerceLinkedValue(row[mapping.sourceField], mapping.coerceType)
    );
  });
}

async function applyFieldLinkagesForTrigger(triggerField, triggerValue, context = {}) {
  const configs = (context.fields || activeConfigFields())
    .map((field) => field.lookupConfig ? { field, config: field.lookupConfig } : null)
    .filter(Boolean)
    .filter(({ field, config }) => (config.triggerField || field.fieldKey) === triggerField);
  for (const { config } of configs) {
    await applyFieldLinkageConfig(config, triggerValue, context);
  }
}

function changedFormFieldContext(target, form, fields) {
  const detailField = target.closest('[data-detail-field]');
  const fieldKey = detailField?.dataset.detailField || target.name || '';
  if (!fieldKey || !fields.some((field) => field.fieldKey === fieldKey)) return null;
  return {
    fieldKey,
    value: target.type === 'checkbox' ? target.checked : target.value,
    target: detailField ? 'detail' : 'main',
    form,
    row: target.closest('[data-detail-row]'),
    fields
  };
}

function renderBrowserLookupResults(payload) {
  const browser = payload.browser;
  const returnFields = browser.returnFields || [];
  $('#browserLookupTitle').textContent = browser.name || 'Lookup';
  $('#browserLookupHead').innerHTML = `
    <tr>
      <th>${escapeHtml(browser.displayField || 'Display')}</th>
      ${returnFields.map((field) => `<th>${escapeHtml(field)}</th>`).join('')}
      <th></th>
    </tr>
  `;
  $('#browserLookupRows').innerHTML = (payload.rows || []).map((row) => `
    <tr>
      <td><strong>${escapeHtml(row.display ?? '')}</strong></td>
      ${returnFields.map((field) => `<td>${escapeHtml(row.columns?.[field] ?? '')}</td>`).join('')}
      <td>
        <button type="button" class="link-button" data-select-browser-row="${escapeHtml(JSON.stringify({
          value: row.value,
          display: row.display
        }))}">Select</button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="${returnFields.length + 2}">No results found.</td></tr>`;
}

async function searchActiveBrowserLookup() {
  const lookup = state.activeBrowserLookup;
  if (!lookup?.browserKey) return;
  const params = new URLSearchParams({ q: $('#browserLookupSearch').value.trim() });
  $('#browserLookupRows').innerHTML = '<tr><td>Searching...</td></tr>';
  const payload = await api(`/api/browser-buttons/${encodeURIComponent(lookup.browserKey)}/search?${params.toString()}`);
  renderBrowserLookupResults(payload);
}

async function openBrowserLookup(button) {
  const browserKey = button.dataset.openBrowserLookup;
  if (!browserKey) return;
  state.activeBrowserLookup = {
    browserKey,
    fieldKey: button.dataset.browserField,
    target: button.dataset.browserTarget,
    form: button.closest('form'),
    row: button.closest('[data-detail-row]')
  };
  $('#browserLookupModal').hidden = false;
  document.body.classList.add('modal-open');
  $('#browserLookupSearch').focus();
  try {
    await searchActiveBrowserLookup();
  } catch (error) {
    toast(titleCaseMessage(error.message), 'error');
    closeBrowserLookupModal();
  }
}

function fieldValidationRulesFromForm(form) {
  return {
    minLength: form.elements.validationMinLength.value,
    maxLength: form.elements.validationMaxLength.value,
    minValue: form.elements.validationMinValue.value,
    maxValue: form.elements.validationMaxValue.value,
    regex: form.elements.validationRegex.value.trim(),
    conditionalRequiredField: form.elements.conditionalRequiredField.value,
    conditionalRequiredValue: form.elements.conditionalRequiredValue.value.trim(),
    unique: form.elements.validationUnique.checked
  };
}

function showView(id) {
  closeCustomerModal();
  closeImportModal();
  closeConfirmationModal(false);
  closeUserModal();
  closeModuleRecordModal();
  closeApiConnectorModal();
  closeApiInterfaceModal();
  closeDepartmentNodeModal();
  closeFormBuilderCreateModal();
  closeFieldConfigModal();
  closeFormDesignDrawer();
  closeVersionHistoryDrawer();
  closeFormulaBuilderModal();
  $('#loginView').hidden = id !== 'loginView';
  $$('.view').forEach((view) => {
    view.hidden = view.id !== id;
  });
  $$('.nav-button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.view === id && !button.dataset.moduleView);
  });
}

function showAdminSection(id) {
  state.activeAdminSection = id;
  $$('.admin-section').forEach((section) => {
    section.hidden = section.id !== id;
  });
  $$('.admin-section-button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.adminSection === id);
  });
  if (id === 'adminPermissionsSection' && state.user?.role === 'admin') {
    loadPermissionMatrix(state.activePermissionModule).catch((error) => {
      toast(titleCaseMessage(error.message), 'error');
    });
  }
}

function toggleAdminMenu() {
  state.adminMenuCollapsed = !state.adminMenuCollapsed;
  document.body.classList.toggle('admin-nav-collapsed', state.adminMenuCollapsed);
  $('#toggleAdminMenu').textContent = state.adminMenuCollapsed ? '›' : '‹';
  $('#toggleAdminMenu').setAttribute('aria-label', state.adminMenuCollapsed ? 'Expand admin menu' : 'Collapse admin menu');
}

function clearStoredSession() {
  [localStorage, sessionStorage].forEach((storage) => {
    storage.removeItem(authStorageKeys.token);
    storage.removeItem(authStorageKeys.user);
  });
  localStorage.removeItem(authStorageKeys.remembered);
}

function writeStoredSession(token, user, rememberSession) {
  clearStoredSession();
  const storage = rememberSession ? localStorage : sessionStorage;
  storage.setItem(authStorageKeys.token, token);
  storage.setItem(authStorageKeys.user, JSON.stringify(user));
  if (rememberSession) {
    localStorage.setItem(authStorageKeys.remembered, 'true');
  }
}

function setSession(token, user, rememberSession = state.rememberSession) {
  state.token = token;
  state.user = user;
  state.rememberSession = Boolean(rememberSession);
  document.body.classList.remove('is-auth');
  document.body.classList.add('is-app');
  writeStoredSession(token, user, state.rememberSession);
  $('#sessionLabel').textContent = `${user.name} · ${user.role}`;
  $('#logoutButton').hidden = false;
  $('[data-view="usersView"]').hidden = user.role !== 'admin';
  $('[data-view="sysadminView"]').hidden = user.role !== 'admin';
}

function clearSession() {
  state.token = '';
  state.user = null;
  state.rememberSession = false;
  document.body.classList.remove('is-app');
  document.body.classList.add('is-auth');
  clearStoredSession();
  $('#sessionLabel').textContent = 'Not signed in';
  $('#logoutButton').hidden = true;
  $('[data-view="usersView"]').hidden = false;
  $('[data-view="sysadminView"]').hidden = false;
  showView('loginView');
}

function currentCountry() {
  const countryId = Number($('[name="countryId"]')?.value);
  return state.countries.find((country) => country.id === countryId);
}

function malaysiaCountry() {
  return state.countries.find((country) => (
    country.iso2 === 'MY' || country.name.toLowerCase() === 'malaysia'
  ));
}

function renderCountries() {
  renderCustomerFormFields();
  updateDialCode();
}

function renderOwners() {
  renderCustomerFormFields();
}

function updateDialCode() {
  const country = currentCountry();
  const dialCode = $('#dialCode');
  if (dialCode) {
    dialCode.value = country ? country.dial_code : '';
  }
}

function fieldValue(customer, field) {
  if (!field.dataKey) {
    return customer.custom_fields?.[field.fieldKey] ?? '';
  }
  if (field.fieldKey === 'ownerUserId') {
    return customer.owner_name || 'Unassigned';
  }
  return customer[field.dataKey] ?? '';
}

function tableFields() {
  return state.customerFields.filter((field) => field.showInTable && field.permissions?.view !== false);
}

function formFields() {
  const action = state.activeCustomerFormType === 'edit' ? 'edit' : 'create';
  return customerPublishedFormFields(state.activeCustomerFormType)
    .filter((field) => field.permissions?.[action] !== false);
}

function mainFormFields() {
  return formFields().filter((field) => field.tableType !== 'detail');
}

function detailFormGroups() {
  const groups = new Map();
  formFields()
    .filter((field) => field.tableType === 'detail' && field.detailTableName)
    .forEach((field) => {
      if (!groups.has(field.detailTableName)) {
        groups.set(field.detailTableName, []);
      }
      groups.get(field.detailTableName).push(field);
    });
  return Array.from(groups.entries()).map(([tableName, fields]) => ({ tableName, fields }));
}

function customerPublishedFormFields(type = 'add') {
  const fields = state.customerFields;
  const defaults = {
    order: fields.map((field) => field.fieldKey),
    hidden: fields.filter((field) => !field.showInForm).map((field) => field.fieldKey)
  };
  const saved = readFormDesignLayouts('customers');
  const rawLayout = saved.published?.[type];
  const layout = Array.isArray(rawLayout)
    ? { order: rawLayout, hidden: defaults.hidden }
    : {
      order: Array.isArray(rawLayout?.order) ? rawLayout.order : defaults.order,
      hidden: Array.isArray(rawLayout?.hidden) ? rawLayout.hidden : defaults.hidden
    };
  const hidden = new Set(layout.hidden);
  fields
    .filter((field) => !field.showInForm)
    .forEach((field) => hidden.add(field.fieldKey));
  const byKey = new Map(fields.map((field) => [field.fieldKey, field]));
  return [
    ...layout.order.map((fieldKey) => byKey.get(fieldKey)).filter(Boolean),
    ...fields.filter((field) => !layout.order.includes(field.fieldKey))
  ].filter((field) => !hidden.has(field.fieldKey));
}

function publishedFormLayout(moduleKey, type = 'add') {
  return readFormDesignLayouts(moduleKey).published?.[type] || defaultFormDesignLayout(moduleKey);
}

function renderPublishedMainSections(fields, layout, renderer) {
  const fieldByKey = new Map(fields.filter((field) => field.tableType !== 'detail').map((field) => [field.fieldKey, field]));
  const rendered = new Set();
  const sections = Array.isArray(layout?.sections) && layout.sections.length
    ? layout.sections
    : [{ id: 'section_general', title: 'General', columns: 1, fieldKeys: fields.map((field) => field.fieldKey) }];
  const sectionHtml = sections.map((section) => {
    const columns = Math.min(3, Math.max(1, Number(section.columns) || 1));
    const sectionFields = (section.fieldKeys || []).map((fieldKey) => fieldByKey.get(fieldKey)).filter(Boolean);
    sectionFields.forEach((field) => rendered.add(field.fieldKey));
    if (!sectionFields.length) return '';
    return `
      <section class="runtime-form-section">
        <div class="runtime-form-section-heading">${escapeHtml(section.title || 'General')}</div>
        <div class="runtime-form-section-grid" style="grid-template-columns: repeat(${columns}, minmax(0, 1fr));">
          ${sectionFields.map((field) => {
            const span = Math.min(columns, Math.max(1, Number(layout?.fieldSpans?.[field.fieldKey] || 1)));
            return `<div class="runtime-form-field" style="grid-column: span ${span};">${renderer(field)}</div>`;
          }).join('')}
        </div>
      </section>
    `;
  }).join('');
  const leftovers = fields.filter((field) => field.tableType !== 'detail' && !rendered.has(field.fieldKey));
  if (!leftovers.length) return sectionHtml;
  return `${sectionHtml}
    <section class="runtime-form-section">
      <div class="runtime-form-section-heading">Other Fields</div>
      <div class="runtime-form-section-grid">
        ${leftovers.map((field) => `<div class="runtime-form-field">${renderer(field)}</div>`).join('')}
      </div>
    </section>`;
}

function userTableFields() {
  return state.userFields.filter((field) => field.showInTable);
}

function userFormFields() {
  const fields = state.userFields;
  const layout = readFormDesignLayouts('users').published?.[state.activeUserFormType] || defaultFormDesignLayout('users');
  const hidden = new Set(layout.hidden || []);
  fields
    .filter((field) => !field.showInForm)
    .forEach((field) => hidden.add(field.fieldKey));
  const byKey = new Map(fields.map((field) => [field.fieldKey, field]));
  return [
    ...(layout.order || []).map((fieldKey) => byKey.get(fieldKey)).filter(Boolean),
    ...fields.filter((field) => !(layout.order || []).includes(field.fieldKey))
  ].filter((field) => !hidden.has(field.fieldKey));
}

function renderCustomerTableHead() {
  $('#customerTableHead').innerHTML = `
    <th class="select-cell">
      <input id="selectAllCustomers" type="checkbox" aria-label="Select all customers">
    </th>
    ${tableFields().map((field) => `<th>${escapeHtml(field.label)}</th>`).join('')}
    <th></th>
  `;
}

function validationAttributes(field) {
  const rules = field.validationRules || {};
  const attrs = [];
  if (rules.minLength !== undefined) attrs.push(`minlength="${escapeHtml(rules.minLength)}"`);
  if (rules.maxLength !== undefined) attrs.push(`maxlength="${escapeHtml(rules.maxLength)}"`);
  if (rules.minValue !== undefined) attrs.push(`min="${escapeHtml(rules.minValue)}"`);
  if (rules.maxValue !== undefined) attrs.push(`max="${escapeHtml(rules.maxValue)}"`);
  if (rules.regex) {
    attrs.push(`pattern="${escapeHtml(rules.regex)}"`);
    attrs.push(`title="${escapeHtml(`${field.label} format is invalid.`)}"`);
  }
  return attrs.join(' ');
}

function renderCustomerFieldInput(field, value = '', options = {}) {
  const required = options.enforceRequired === false ? '' : (field.required ? 'required' : '');
  const validation = validationAttributes(field);
  const binding = options.detailField
    ? `data-detail-field="${escapeHtml(field.fieldKey)}"`
    : `name="${escapeHtml(field.fieldKey)}"`;
  const controlState = fieldControlStateAttributes(field, value, binding, {
    readonly: field.type !== 'checkbox'
  });

  if (field.type === 'textarea') {
    return `${controlState.preserve}<textarea ${binding} rows="4" ${required} ${validation} ${controlState.attrs}>${escapeHtml(value)}</textarea>`;
  }

  if (field.type === 'select' || field.type === 'dropdownbox') {
    const options = (field.options || []).map((option) => (
      `<option value="${escapeHtml(option)}" ${String(value) === String(option) ? 'selected' : ''}>${escapeHtml(titleCaseMessage(option))}</option>`
    )).join('');
    const selectState = fieldControlStateAttributes(field, value, binding, { disableInsteadOfReadonly: true });
    return `${selectState.preserve}<select ${binding} ${required} ${selectState.attrs}>${options}</select>`;
  }

  if (field.type === 'country') {
    const options = state.countries.map((country) => (
      `<option value="${country.id}" ${Number(value) === Number(country.id) ? 'selected' : ''}>${escapeHtml(country.name)}</option>`
    )).join('');
    const selectState = fieldControlStateAttributes(field, value, binding, { disableInsteadOfReadonly: true });
    return `${selectState.preserve}<select ${binding} ${required} ${selectState.attrs}>${options}</select>`;
  }

  if (field.type === 'owner') {
    const options = '<option value="">Unassigned</option>' + state.users
      .filter((user) => user.status === 'active')
      .map((user) => `<option value="${user.id}" ${Number(value) === Number(user.id) ? 'selected' : ''}>${escapeHtml(user.name)}</option>`)
      .join('');
    const selectState = fieldControlStateAttributes(field, value, binding, { disableInsteadOfReadonly: true });
    return `${selectState.preserve}<select ${binding} ${selectState.attrs}>${options}</select>`;
  }

  if (field.type === 'checkbox') {
    const checkboxState = fieldControlStateAttributes(field, value ? 'true' : '', binding, { disableInsteadOfReadonly: true });
    return `${checkboxState.preserve}<input ${binding} type="checkbox" value="true" ${value ? 'checked' : ''} ${checkboxState.attrs}>`;
  }

  if (field.type === 'browser_button') {
    return renderBrowserFieldInput(field, value);
  }

  if (field.type === 'attach_document') {
    return `<input ${binding} type="file" ${required}>`;
  }

  if (field.type === 'image') {
    return `<input ${binding} type="file" accept="image/*" ${required}>`;
  }

  const inputType = {
    phone: 'tel',
    textbox: 'text',
    int: 'number',
    decimals: 'number'
  }[field.type] || field.type;
  const step = field.type === 'int' ? 'step="1"' : field.type === 'decimals' ? 'step="any"' : '';
  return `${controlState.preserve}<input ${binding} type="${escapeHtml(inputType)}" value="${escapeHtml(value)}" ${step} ${required} ${validation} ${controlState.attrs}>`;
}

function valueForForm(customer, field) {
  if (!customer) return '';
  const values = {
    companyName: customer.company_name,
    contactPerson: customer.contact_person,
    email: customer.email || '',
    countryId: customer.country_id,
    phoneNumber: customer.phone_number,
    status: customer.status,
    ownerUserId: customer.owner_user_id || '',
    notes: customer.notes || ''
  };
  return field.fieldKey in values ? values[field.fieldKey] : customer.custom_fields?.[field.fieldKey] ?? '';
}

function renderMainCustomerField(field, customer = null) {
  const malaysia = malaysiaCountry();
  const value = customer
    ? valueForForm(customer, field)
    : (field.fieldKey === 'countryId' && malaysia ? malaysia.id : '');
  const control = renderCustomerFieldInput(field, value);
  if (field.type === 'country') {
    return `
      <div class="grid-two">
        <label>
          ${formLabelText(field)}
          ${control}
        </label>
        <label>
          <span class="field-label-text">Code</span>
          <input id="dialCode" readonly>
        </label>
      </div>
    `;
  }
  return `
    <label>
      ${formLabelText(field)}
      ${control}
    </label>
  `;
}

function detailRowsForCustomer(customer, tableName) {
  const rows = customer?.detail_tables?.[tableName] || [];
  return rows.length ? rows : [{}];
}

function renderDetailRow(tableName, fields, row = {}, index = 0) {
  return `
    <tr data-detail-row data-detail-table="${escapeHtml(tableName)}">
      <td class="select-cell">
        <input type="checkbox" data-select-detail-row aria-label="Select detail row ${index + 1}">
      </td>
      <td data-detail-row-number>${index + 1}</td>
      ${fields.map((field) => `
        <td>${renderCustomerFieldInput(field, row[field.fieldKey] ?? '', {
          detailField: true,
          enforceRequired: false
        })}</td>
      `).join('')}
      <td>
        <button type="button" class="secondary small-button" data-remove-detail-row>Remove</button>
      </td>
    </tr>
  `;
}

function renderDetailTableSection(tableName, fields, customer = null) {
  const rows = detailRowsForCustomer(customer, tableName);
  return `
    <section class="detail-table-section" data-detail-table-section="${escapeHtml(tableName)}">
      <div class="detail-table-header">
        <div class="detail-table-title">${escapeHtml(tableLabel(tableName))}</div>
        <div class="detail-table-actions">
          <button type="button" class="secondary detail-table-add" data-add-detail-row="${escapeHtml(tableName)}">+ Add</button>
          <button type="button" class="secondary detail-table-bulk" data-duplicate-detail-rows disabled>Duplicate</button>
          <button type="button" class="danger-button detail-table-bulk" data-delete-detail-rows disabled>Delete</button>
        </div>
      </div>
      <div class="table-wrap detail-entry-wrap">
        <table class="detail-entry-table">
          <thead>
            <tr>
              <th class="select-cell">
                <input type="checkbox" data-select-all-detail-rows aria-label="Select all ${escapeHtml(tableLabel(tableName))} rows">
              </th>
              <th>No.</th>
              ${fields.map((field) => `<th>${escapeHtml(field.label)}</th>`).join('')}
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row, index) => renderDetailRow(tableName, fields, row, index)).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renumberDetailRows(section) {
  section.querySelectorAll('[data-detail-row]').forEach((row, index) => {
    const numberCell = row.querySelector('[data-detail-row-number]');
    if (numberCell) numberCell.textContent = String(index + 1);
    const checkbox = row.querySelector('[data-select-detail-row]');
    if (checkbox) checkbox.setAttribute('aria-label', `Select detail row ${index + 1}`);
  });
}

function selectedDetailRows(section) {
  return Array.from(section.querySelectorAll('[data-detail-row]'))
    .filter((row) => row.querySelector('[data-select-detail-row]')?.checked);
}

function syncDetailTableControls(section) {
  const rows = Array.from(section.querySelectorAll('[data-detail-row]'));
  const selectedRows = selectedDetailRows(section);
  const selectAll = section.querySelector('[data-select-all-detail-rows]');
  const duplicateButton = section.querySelector('[data-duplicate-detail-rows]');
  const deleteButton = section.querySelector('[data-delete-detail-rows]');
  const selectedCount = selectedRows.length;

  rows.forEach((row) => {
    row.classList.toggle('is-selected', row.querySelector('[data-select-detail-row]')?.checked);
  });
  if (selectAll) {
    selectAll.checked = rows.length > 0 && selectedCount === rows.length;
    selectAll.indeterminate = selectedCount > 0 && selectedCount < rows.length;
  }
  if (duplicateButton) {
    duplicateButton.disabled = selectedCount === 0;
    duplicateButton.textContent = selectedCount ? `Duplicate (${selectedCount})` : 'Duplicate';
  }
  if (deleteButton) {
    deleteButton.disabled = selectedCount === 0;
    deleteButton.textContent = selectedCount ? `Delete (${selectedCount})` : 'Delete';
  }
}

function syncAllDetailTableControls() {
  $$('#customerFormFields [data-detail-table-section]').forEach(syncDetailTableControls);
}

function detailRowValues(row) {
  const values = {};
  row.querySelectorAll('[data-detail-field]').forEach((input) => {
    if (input.disabled) return;
    values[input.dataset.detailField] = input.type === 'checkbox' ? input.checked : input.value;
  });
  return values;
}

function clearDetailRow(row) {
  row.querySelector('[data-select-detail-row]').checked = false;
  row.querySelectorAll('[data-detail-field]').forEach((input) => {
    if (input.disabled || input.readOnly || input.dataset.preservedField) return;
    if (input.type === 'checkbox') {
      input.checked = false;
    } else {
      input.value = '';
    }
  });
}

function duplicateSelectedDetailRows(section) {
  const tableName = section.dataset.detailTableSection;
  const group = detailFormGroups().find((detailGroup) => detailGroup.tableName === tableName);
  const body = section.querySelector('tbody');
  if (!group || !body) return;

  const rowsToDuplicate = selectedDetailRows(section).map(detailRowValues);
  rowsToDuplicate.forEach((values) => {
    body.insertAdjacentHTML('beforeend', renderDetailRow(tableName, group.fields, values, body.children.length));
  });
  section.querySelectorAll('[data-select-detail-row]').forEach((checkbox) => {
    checkbox.checked = false;
  });
  renumberDetailRows(section);
  syncDetailTableControls(section);
}

function deleteSelectedDetailRows(section) {
  const tableName = section.dataset.detailTableSection;
  const group = detailFormGroups().find((detailGroup) => detailGroup.tableName === tableName);
  const body = section.querySelector('tbody');
  if (!group || !body) return;

  const rowsToDelete = selectedDetailRows(section);
  if (rowsToDelete.length === 0) return;
  if (rowsToDelete.length >= body.children.length) {
    body.innerHTML = renderDetailRow(tableName, group.fields, {}, 0);
  } else {
    rowsToDelete.forEach((row) => row.remove());
  }
  renumberDetailRows(section);
  syncDetailTableControls(section);
}

function renderCustomerFormFields(customer = null) {
  const layout = publishedFormLayout('customers', state.activeCustomerFormType);
  const mainFields = renderPublishedMainSections(mainFormFields(), layout, (field) => renderMainCustomerField(field, customer));
  const detailTables = detailFormGroups()
    .map((group) => renderDetailTableSection(group.tableName, group.fields, customer))
    .join('');
  $('#customerFormFields').innerHTML = `${mainFields}${detailTables}`;
  updateDialCode();
  syncAllDetailTableControls();
  applyCustomerFormulas();
}

function renderCustomerCell(customer, field) {
  const value = fieldValue(customer, field);
  if (field.fieldKey === 'companyName') {
    return `<td class="company-cell"><strong>${escapeHtml(value)}</strong></td>`;
  }
  if (field.fieldKey === 'status') {
    return `<td><span class="status ${escapeHtml(value)}">${escapeHtml(value)}</span></td>`;
  }
  if (field.type === 'checkbox') {
    return `<td>${renderReadonlyCheckbox(Boolean(value))}</td>`;
  }
  return `<td>${escapeHtml(value)}</td>`;
}

function runtimeModuleConfigs() {
  return state.publishedModules;
}

function renderPublishedModuleNav() {
  const container = $('#publishedModuleNav');
  if (!container) return;
  container.innerHTML = runtimeModuleConfigs().map((config) => {
    const module = config.module || config;
    return `<button class="nav-button module-nav-button" data-module-view="${escapeHtml(module.moduleKey || module.key)}">${escapeHtml(module.name)}</button>`;
  }).join('');
}

function activeRuntimeConfig() {
  return state.moduleRuntimeConfigs[state.activeRuntimeModuleKey] || null;
}

function runtimeMainFields(config = activeRuntimeConfig()) {
  return (config?.fields || []).filter((field) => !field.archived && field.tableType !== 'detail');
}

function runtimeTableFields(config = activeRuntimeConfig()) {
  const shown = runtimeMainFields(config).filter((field) => field.showInTable);
  return shown.length ? shown : runtimeMainFields(config).slice(0, 6);
}

function runtimeFormFields(config = activeRuntimeConfig()) {
  const fields = runtimeMainFields(config);
  const layout = config?.formLayouts?.published?.add || {};
  const hidden = new Set(layout.hidden || []);
  fields
    .filter((field) => !field.showInForm)
    .forEach((field) => hidden.add(field.fieldKey));
  const byKey = new Map(fields.map((field) => [field.fieldKey, field]));
  return [
    ...(layout.order || []).map((fieldKey) => byKey.get(fieldKey)).filter(Boolean),
    ...fields.filter((field) => !(layout.order || []).includes(field.fieldKey))
  ].filter((field) => !hidden.has(field.fieldKey));
}

function runtimeRecords() {
  return state.moduleRuntimeRecords[state.activeRuntimeModuleKey] || [];
}

function runtimeRecordValue(record, field) {
  return record?.customFields?.[field.fieldKey] ?? '';
}

function renderModuleRuntimeTableHead() {
  const head = $('#moduleRecordTableHead');
  if (!head) return;
  head.innerHTML = `
    ${runtimeTableFields().map((field) => `<th>${escapeHtml(field.label)}</th>`).join('')}
    <th></th>
  `;
}

function formDesignSectionOptions(selectedId = '') {
  return (activeFormDesignLayout().sections || []).map((section) => (
    `<option value="${escapeHtml(section.id)}" ${section.id === selectedId ? 'selected' : ''}>${escapeHtml(section.title || section.id)}</option>`
  )).join('');
}

function formDesignSectionForField(fieldKey) {
  return (activeFormDesignLayout().sections || []).find((section) => (section.fieldKeys || []).includes(fieldKey)) || null;
}

function formDesignMainFieldMap(fields) {
  return new Map(fields.filter((field) => field.tableType !== 'detail').map((field) => [field.fieldKey, field]));
}

function renderFormDesignSection(section, index, mainFieldByKey, totalSections) {
  const fields = (section.fieldKeys || []).map((fieldKey) => mainFieldByKey.get(fieldKey)).filter(Boolean);
  const columns = Math.min(3, Math.max(1, Number(section.columns) || 1));
  return `
    <section class="form-layout-section" data-form-layout-section="${escapeHtml(section.id)}">
      <div class="form-layout-section-header">
        <label>
          <span>Section</span>
          <input value="${escapeHtml(section.title || '')}" data-form-section-title="${escapeHtml(section.id)}" aria-label="Section title">
        </label>
        <label>
          <span>Columns</span>
          <select data-form-section-columns="${escapeHtml(section.id)}">
            ${[1, 2, 3].map((value) => `<option value="${value}" ${columns === value ? 'selected' : ''}>${value}</option>`).join('')}
          </select>
        </label>
        <button type="button" class="secondary small-button" data-move-form-section="${escapeHtml(section.id)}" data-direction="-1" ${index <= 0 ? 'disabled' : ''}>Up</button>
        <button type="button" class="secondary small-button" data-move-form-section="${escapeHtml(section.id)}" data-direction="1" ${index >= totalSections - 1 ? 'disabled' : ''}>Down</button>
        <button type="button" class="secondary small-button" data-delete-form-section="${escapeHtml(section.id)}" ${totalSections <= 1 ? 'disabled' : ''}>Remove</button>
      </div>
      <div class="form-design-grid" style="grid-template-columns: repeat(${columns}, minmax(0, 1fr));">
        ${fields.map(formDesignFieldCard).join('') || '<p class="muted form-layout-empty">No fields in this section.</p>'}
      </div>
    </section>
  `;
}

function renderFormDesignSections(mainFields) {
  const layout = activeFormDesignLayout();
  syncFormDesignSectionsWithOrder(layout);
  const mainFieldByKey = formDesignMainFieldMap(mainFields);
  return (layout.sections || []).map((section, index, sections) => (
    renderFormDesignSection(section, index, mainFieldByKey, sections.length)
  )).join('');
}

function updateActiveFormDesignLayout(mutator) {
  const layouts = readFormDesignLayouts();
  const layout = layouts.draft[state.activeFormDesignType] || defaultFormDesignLayout();
  mutator(layout);
  syncFormDesignSectionsWithOrder(layout);
  layouts.draft[state.activeFormDesignType] = layout;
  writeFormDesignLayouts(layouts);
  renderFormDesignDrawer();
}

function setFormDesignSectionColumns(sectionId, columns) {
  updateActiveFormDesignLayout((layout) => {
    const section = (layout.sections || []).find((item) => item.id === sectionId);
    if (section) section.columns = Math.min(3, Math.max(1, Number(columns) || 1));
  });
}

function renameFormDesignSection(sectionId, title) {
  updateActiveFormDesignLayout((layout) => {
    const section = (layout.sections || []).find((item) => item.id === sectionId);
    if (section) section.title = String(title || '').trim() || 'Untitled Section';
  });
}

function addFormDesignSection() {
  updateActiveFormDesignLayout((layout) => {
    const next = (layout.sections || []).length + 1;
    layout.sections = layout.sections || [];
    layout.sections.push({ id: `section_${Date.now()}`, title: `Section ${next}`, columns: 1, fieldKeys: [] });
  });
}

function moveFormDesignSection(sectionId, direction) {
  updateActiveFormDesignLayout((layout) => {
    const sections = layout.sections || [];
    const index = sections.findIndex((section) => section.id === sectionId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= sections.length) return;
    [sections[index], sections[nextIndex]] = [sections[nextIndex], sections[index]];
  });
}

function deleteFormDesignSection(sectionId) {
  updateActiveFormDesignLayout((layout) => {
    const sections = layout.sections || [];
    if (sections.length <= 1) return;
    const index = sections.findIndex((section) => section.id === sectionId);
    if (index < 0) return;
    const [removed] = sections.splice(index, 1);
    sections[0].fieldKeys.push(...(removed.fieldKeys || []));
  });
}

function moveFormDesignSelectedFieldToSection(sectionId) {
  const fieldKey = state.selectedFormDesignFieldKey;
  if (!fieldKey || !sectionId) return;
  updateActiveFormDesignLayout((layout) => {
    (layout.sections || []).forEach((section) => {
      section.fieldKeys = (section.fieldKeys || []).filter((key) => key !== fieldKey);
    });
    const target = (layout.sections || []).find((section) => section.id === sectionId);
    if (target) target.fieldKeys.push(fieldKey);
  });
}

function setFormDesignSelectedFieldSpan(span) {
  const fieldKey = state.selectedFormDesignFieldKey;
  if (!fieldKey) return;
  updateActiveFormDesignLayout((layout) => {
    layout.fieldSpans = layout.fieldSpans || {};
    layout.fieldSpans[fieldKey] = Math.min(3, Math.max(1, Number(span) || 1));
  });
}

function renderModuleRuntimeRows() {
  const body = $('#moduleRecordRows');
  if (!body) return;
  const fields = runtimeTableFields();
  body.innerHTML = runtimeRecords().map((record) => `
    <tr data-module-record-id="${escapeHtml(record.id)}">
      ${fields.map((field) => {
        const value = runtimeRecordValue(record, field);
        return `<td>${field.type === 'checkbox' ? renderReadonlyCheckbox(Boolean(value)) : escapeHtml(value)}</td>`;
      }).join('')}
      <td>
        <div class="table-action-group">
          <button type="button" class="link-button" data-edit-module-record="${escapeHtml(record.id)}">Edit</button>
          <button type="button" class="link-button danger-link" data-delete-module-record="${escapeHtml(record.id)}">Delete</button>
        </div>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="${fields.length + 1}">No records found.</td></tr>`;
}

function renderModuleRuntimeView() {
  const config = activeRuntimeConfig();
  if (!config) return;
  const module = config.module;
  $('#moduleRuntimeTitle').textContent = module.name;
  $('#moduleRuntimeDescription').textContent = module.description || 'Generated module page.';
  $('#moduleRuntimeSearch').value = state.moduleRuntimeSearch;
  const templateLink = $('#moduleImportTemplateLink');
  const exportLink = $('#moduleExportLink');
  const moduleKey = encodeURIComponent(module.moduleKey);
  templateLink.href = `/api/imports/modules/${moduleKey}/template`;
  templateLink.hidden = false;
  exportLink.href = `/api/imports/modules/${moduleKey}/export`;
  exportLink.hidden = false;
  renderModuleRuntimeTableHead();
  renderModuleRuntimeRows();
  $$('.nav-button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.moduleView === module.moduleKey);
  });
}

async function loadPublishedModules() {
  const payload = await api('/api/modules').catch(() => ({ modules: [] }));
  state.publishedModules = payload.modules || [];
  renderPublishedModuleNav();
}

async function loadModuleRuntimeRecords(moduleKey = state.activeRuntimeModuleKey) {
  const params = new URLSearchParams();
  if (state.moduleRuntimeSearch.trim()) params.set('search', state.moduleRuntimeSearch.trim());
  const query = params.toString();
  const payload = await api(`/api/modules/${encodeURIComponent(moduleKey)}/records${query ? `?${query}` : ''}`);
  state.moduleRuntimeRecords[moduleKey] = payload.records || [];
  if (payload.module && payload.fields) {
    state.moduleRuntimeConfigs[moduleKey] = payload;
  }
  renderModuleRuntimeView();
}

async function openRuntimeModulePage(moduleKey) {
  state.activeRuntimeModuleKey = moduleKey;
  state.moduleRuntimeSearch = '';
  const config = await api(`/api/modules/${encodeURIComponent(moduleKey)}/config`);
  state.moduleRuntimeConfigs[moduleKey] = config;
  showView('moduleRuntimeView');
  await loadModuleRuntimeRecords(moduleKey);
}

function renderModuleRecordForm(record = null) {
  const container = $('#moduleRecordFormFields');
  if (!container) return;
  container.innerHTML = runtimeFormFields().map((field) => `
    <label>
      ${formLabelText(field)}
      ${renderCustomerFieldInput(field, runtimeRecordValue(record, field))}
    </label>
  `).join('');
}

function openModuleRecordModal(recordId = '') {
  const form = $('#moduleRecordForm');
  const modal = $('#moduleRecordModal');
  if (!form || !modal) return;
  const record = runtimeRecords().find((item) => String(item.id) === String(recordId)) || null;
  form.reset();
  form.elements.id.value = record?.id || '';
  $('#moduleRecordFormTitle').textContent = record ? 'Edit Record' : 'Add Record';
  $('#saveModuleRecordButton').textContent = record ? 'Save Record' : 'Create Record';
  renderModuleRecordForm(record);
  modal.hidden = false;
  document.body.classList.add('modal-open');
}

function closeModuleRecordModal() {
  const modal = $('#moduleRecordModal');
  if (!modal) return;
  resetModalFullscreen(modal);
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

function collectModuleRecordForm() {
  const form = $('#moduleRecordForm');
  const input = serializeForm(form);
  runtimeFormFields().forEach((field) => {
    if (field.type === 'checkbox') {
      input[field.fieldKey] = form.elements[field.fieldKey]?.checked || false;
    }
  });
  return input;
}

async function saveModuleRecord(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const id = form.elements.id.value;
  const moduleKey = state.activeRuntimeModuleKey;
  const endpoint = id
    ? `/api/modules/${encodeURIComponent(moduleKey)}/records/${encodeURIComponent(id)}`
    : `/api/modules/${encodeURIComponent(moduleKey)}/records`;
  await api(endpoint, {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(collectModuleRecordForm())
  });
  closeModuleRecordModal();
  await loadModuleRuntimeRecords(moduleKey);
  toast(id ? 'Record Saved.' : 'Record Created.');
}

async function deleteModuleRecord(recordId) {
  const moduleKey = state.activeRuntimeModuleKey;
  if (!recordId) return;
  const confirmed = await showConfirmationModal({
    title: 'Delete Record',
    message: 'Delete this record? This cannot be undone.',
    confirmLabel: 'Delete Record'
  });
  if (!confirmed) return;
  await api(`/api/modules/${encodeURIComponent(moduleKey)}/records`, {
    method: 'DELETE',
    body: JSON.stringify({ ids: [Number(recordId)] })
  });
  await loadModuleRuntimeRecords(moduleKey);
  toast('Record Deleted.');
}

function userFieldValue(user, field) {
  if (!field.dataKey) {
    return user.custom_fields?.[field.fieldKey] ?? '';
  }
  if (field.fieldKey === 'password') {
    return '';
  }
  return user[field.dataKey] ?? '';
}

function renderUserTableHead() {
  $('#userTableHead').innerHTML = `
    ${userTableFields().map((field) => `<th>${escapeHtml(field.label)}</th>`).join('')}
    <th></th>
  `;
}

function renderUserCell(user, field) {
  const value = userFieldValue(user, field);
  if (field.fieldKey === 'name') {
    return `<td><strong>${escapeHtml(value)}</strong></td>`;
  }
  if (field.type === 'checkbox') {
    return `<td>${renderReadonlyCheckbox(Boolean(value))}</td>`;
  }
  return `<td>${escapeHtml(value)}</td>`;
}

function renderCustomers() {
  renderCustomerTableHead();
  const fields = tableFields();
  const rows = state.customers.map((customer) => `
    <tr>
      <td class="select-cell">
        <input type="checkbox" data-select-customer="${customer.id}" ${state.selectedCustomerIds.has(customer.id) ? 'checked' : ''} aria-label="Select ${escapeHtml(customer.company_name)}">
      </td>
      ${fields.map((field) => renderCustomerCell(customer, field)).join('')}
      <td>${state.customerPermissions.edit ? `<button class="link-button" data-edit-customer="${customer.id}">Edit</button>` : ''}</td>
    </tr>
  `).join('');

  $('#customerRows').innerHTML = rows || `<tr><td colspan="${fields.length + 2}">No customers found.</td></tr>`;
  syncCustomerSelectionControls();
}

function selectedCustomerIds() {
  return Array.from(state.selectedCustomerIds);
}

function syncCustomerSelectionControls() {
  const visibleIds = state.customers.map((customer) => customer.id);
  const selectedVisibleCount = visibleIds.filter((id) => state.selectedCustomerIds.has(id)).length;
  const selectAll = $('#selectAllCustomers');
  const deleteButton = $('#deleteCustomersButton');

  if (!selectAll || !deleteButton) return;
  selectAll.checked = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;
  selectAll.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;
  deleteButton.disabled = state.selectedCustomerIds.size === 0;
  deleteButton.hidden = state.customerPermissions.delete === false;
  deleteButton.textContent = state.selectedCustomerIds.size
    ? `Delete Selected (${state.selectedCustomerIds.size})`
    : 'Delete Selected';
}

function renderUsers() {
  renderUserTableHead();
  const fields = userTableFields();
  const rows = state.users.map((user) => `
    <tr>
      ${fields.map((field) => renderUserCell(user, field)).join('')}
      <td><button class="link-button" data-edit-user="${user.id}">Edit</button></td>
    </tr>
  `).join('');

  $('#userRows').innerHTML = rows || `<tr><td colspan="${fields.length + 1}">No users found.</td></tr>`;
}

function valueForUserForm(user, field) {
  if (!user) return '';
  const values = {
    name: user.name,
    staffId: user.staff_id,
    email: user.email,
    password: '',
    role: user.role,
    status: user.status
  };
  return field.fieldKey in values ? values[field.fieldKey] : user.custom_fields?.[field.fieldKey] ?? '';
}

function renderGenericFieldInput(field, value = '', editing = false) {
  const required = field.required && !(field.fieldKey === 'password' && editing) ? 'required' : '';
  const name = `name="${escapeHtml(field.fieldKey)}"`;
  const autocomplete = field.fieldKey === 'password' ? 'autocomplete="new-password"' : '';
  const controlState = fieldControlStateAttributes(field, value, name, {
    readonly: field.type !== 'checkbox'
  });
  const validation = validationAttributes(field);

  if (field.type === 'textarea') {
    return `${controlState.preserve}<textarea ${name} rows="4" ${required} ${validation} ${controlState.attrs}>${escapeHtml(value)}</textarea>`;
  }
  if (field.type === 'select' || field.type === 'dropdownbox') {
    const options = (field.options || []).map((option) => (
      `<option value="${escapeHtml(option)}" ${String(value) === String(option) ? 'selected' : ''}>${escapeHtml(titleCaseMessage(option))}</option>`
    )).join('');
    const selectState = fieldControlStateAttributes(field, value, name, { disableInsteadOfReadonly: true });
    return `${selectState.preserve}<select ${name} ${required} ${selectState.attrs}>${options}</select>`;
  }
  if (field.type === 'checkbox') {
    const checkboxState = fieldControlStateAttributes(field, value ? 'true' : '', name, { disableInsteadOfReadonly: true });
    return `${checkboxState.preserve}<input ${name} type="checkbox" value="true" ${value ? 'checked' : ''} ${checkboxState.attrs}>`;
  }

  if (field.type === 'browser_button') {
    return `<button type="button" class="secondary browser-field-button" disabled>Browse</button>`;
  }

  if (field.type === 'attach_document') {
    return `<input ${name} type="file" ${required}>`;
  }

  if (field.type === 'image') {
    return `<input ${name} type="file" accept="image/*" ${required}>`;
  }

  const inputType = {
    phone: 'tel',
    textbox: 'text',
    int: 'number',
    decimals: 'number'
  }[field.type] || field.type;
  const minlength = field.fieldKey === 'password' ? 'minlength="8"' : '';
  const step = field.type === 'int' ? 'step="1"' : field.type === 'decimals' ? 'step="any"' : '';
  return `${controlState.preserve}<input ${name} type="${escapeHtml(inputType)}" value="${escapeHtml(value)}" ${step} ${minlength} ${required} ${autocomplete} ${validation} ${controlState.attrs}>`;
}

function renderUserFormFields(user = null) {
  const editing = Boolean(user);
  const layout = publishedFormLayout('users', state.activeUserFormType);
  const configuredFields = renderPublishedMainSections(userFormFields(), layout, (field) => {
    const input = `
      <label>
        ${formLabelText(field)}
        ${renderGenericFieldInput(field, valueForUserForm(user, field), editing)}
      </label>
    `;
    if (field.fieldKey !== 'password') {
      return input;
    }
    const required = editing ? '' : 'required';
    return `${input}
      <label>
        <span class="field-label-text">Confirm Password${editing ? '' : ' <span class="required-text">*</span>'}</span>
        <input name="confirmPassword" type="password" minlength="8" ${required} autocomplete="new-password">
      </label>
    `;
  });
  const defaultOrganizationId = state.departmentNodes.find((node) => node.type === 'organization')?.id || 0;
  const selectedOrganizationId = Number(user?.organization_node_id || defaultOrganizationId);
  const organizationOptions = permissionDepartmentItems().map((item) => {
    const branch = item.depth > 0 ? `${'\u00a0\u00a0\u00a0'.repeat(item.depth - 1)}└─ ` : '';
    const type = item.type === 'organization' ? 'ORG' : item.type === 'department' ? 'DEPT' : 'GROUP';
    return `<option value="${escapeHtml(item.value)}" ${selectedOrganizationId === Number(item.value) ? 'selected' : ''}>${escapeHtml(`${branch}${item.label} [${type}]`)}</option>`;
  }).join('');
  $('#userFormFields').innerHTML = `${configuredFields}
    <section class="runtime-form-section">
      <div class="runtime-form-section-grid">
        <div class="runtime-form-field">
          <label><span class="field-label-text">Organization Unit <span class="required-text">*</span></span><select name="organizationNodeId" required>${organizationOptions}</select></label>
        </div>
      </div>
    </section>`;
}

function renderFieldConfig() {
  const body = $('#fieldConfigRows');
  if (!body) return;
  const fields = activeConfigFields();
  const module = configModules.find((item) => item.key === state.activeConfigModule);
  const moduleName = module?.name || titleCaseMessage(state.activeConfigModule);
  const fieldCount = fields.length;

  const activeTitle = $('#formBuilderActiveTitle');
  if (activeTitle) activeTitle.textContent = moduleName;

  const activeMeta = $('#formBuilderActiveMeta');
  if (activeMeta) {
    activeMeta.textContent = `${state.activeConfigModule} module - ${fieldCount} field${fieldCount === 1 ? '' : 's'} across main/detail tables.`;
  }

  body.innerHTML = fields.map((field) => `
    <tr data-field-key="${escapeHtml(field.fieldKey)}">
      <td>
        <strong>${escapeHtml(field.label)}</strong>
        <div class="muted">${field.tableType === 'detail' ? escapeHtml(field.detailTableName || 'Detail Table') : 'Main Table'}</div>
        <div class="muted">${escapeHtml(field.fieldKey)}${field.locked ? ' · system' : ''}</div>
      </td>
      <td>${escapeHtml(fieldTypeLabel(field.type))}</td>
      <td>${renderReadonlyCheckbox(field.showInTable)}</td>
      <td>${renderReadonlyCheckbox(field.showInForm)}</td>
      <td>${renderReadonlyCheckbox(field.showInImport)}</td>
      <td>${renderReadonlyCheckbox(field.required)}</td>
      <td>${field.formulaEnabled ? '<span class="formula-badge">fx</span>' : ''}</td>
      <td>
        <div class="table-action-group">
          <button type="button" class="link-button" data-edit-field="${escapeHtml(field.fieldKey)}">Edit</button>
          <button type="button" class="link-button" data-open-field-linkage="${escapeHtml(field.fieldKey)}">Field Linkage</button>
        </div>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="8">No fields found for ${escapeHtml(moduleName)}.</td></tr>`;
  renderFormModuleList();
}

function openDefaultFieldLinkage() {
  const field = activeConfigFields()[0];
  if (!field) {
    toast('Add a field before configuring Field Linkage.', 'error');
    return;
  }
  openFieldLinkageModal(field.fieldKey);
}

function permissionModuleName() {
  return configModules.find((module) => module.key === state.activePermissionModule)?.name || titleCaseMessage(state.activePermissionModule);
}

function permissionActionLabel(action) {
  return titleCaseMessage(action);
}

function permissionRoleItems() {
  return (state.permissionMatrix?.roles || state.fieldPermissionMatrix?.roles || ['admin', 'manager', 'user'])
    .map((role) => ({
      value: role,
      label: titleCaseMessage(role),
      search: role
    }));
}

function permissionUserItems() {
  return state.users.map((user) => ({
    value: String(user.id),
    label: user.name,
    meta: user.email,
    search: `${user.name} ${user.email} ${user.role}`
  }));
}

function renderPermissionPicker(kind, action, items, selectedValues = []) {
  const selected = new Set((selectedValues || []).map(String));
  const selectedCount = items.filter((item) => selected.has(String(item.value))).length;
  return `
    <div class="permission-picker" data-permission-picker="${escapeHtml(kind)}" data-permission-action="${escapeHtml(action)}">
      <div class="permission-picker-toolbar">
        <input type="search" data-permission-search placeholder="Search ${kind}" aria-label="Search ${kind} for ${escapeHtml(permissionActionLabel(action))}">
        <span>${selectedCount}/${items.length}</span>
      </div>
      <div class="permission-check-list ${kind === 'departments' ? 'permission-department-tree' : ''}">
        ${items.map((item) => `
          <label class="permission-check ${kind === 'departments' ? 'permission-department-node' : ''}" data-permission-option data-search="${escapeHtml(item.search || item.label)}" ${kind === 'departments' ? `style="--permission-tree-depth:${Number(item.depth || 0)}"` : ''}>
            ${kind === 'departments' ? `<span class="permission-tree-branch" aria-hidden="true">${item.hasChildren ? '▾' : ''}</span>` : ''}
            <input type="checkbox" value="${escapeHtml(item.value)}" ${selected.has(String(item.value)) ? 'checked' : ''}>
            <span>
              <strong>${escapeHtml(item.label)}</strong>${kind === 'departments' ? `<small class="permission-unit-badge">${escapeHtml(item.type === 'organization' ? 'ORG' : item.type === 'department' ? 'DEPT' : 'GROUP')}</small>` : ''}
              ${item.meta && kind !== 'departments' ? `<small>${escapeHtml(item.meta)}</small>` : ''}
            </span>
          </label>
        `).join('') || '<p class="muted permission-empty">No options found.</p>'}
      </div>
    </div>
  `;
}

function renderFieldPermissionCell(field, action) {
  return `
    <div class="field-permission-cell" data-field-permission-action="${escapeHtml(action)}">
      ${renderPermissionPicker('roles', action, permissionRoleItems(), field.permissions?.[action]?.roles)}
      ${renderPermissionPicker('users', action, permissionUserItems(), field.permissions?.[action]?.users)}
    </div>
  `;
}

function renderPermissions() {
  const body = $('#permissionRows');
  if (!body) return;
  const fieldBody = $('#fieldPermissionRows');
  const selector = $('#permissionModuleSelect');
  if (selector) selector.value = state.activePermissionModule;
  const permissions = state.permissionMatrix?.permissions || {};

  body.innerHTML = workspacePermissionActions.map((action) => `
    <tr data-permission-action-row="${escapeHtml(action)}">
      <td>
        <strong>${escapeHtml(permissionActionLabel(action))}</strong>
      </td>
      <td>
        ${renderPermissionPicker('roles', action, permissionRoleItems(), permissions[action]?.roles)}
      </td>
      <td>
        ${renderPermissionPicker('users', action, permissionUserItems(), permissions[action]?.users)}
      </td>
    </tr>
  `).join('');

  if (!fieldBody) return;
  const fields = state.fieldPermissionMatrix?.fields || [];
  fieldBody.innerHTML = fields.map((field) => `
    <tr data-field-permission-row="${escapeHtml(field.fieldKey)}">
      <td>
        <strong>${escapeHtml(field.label)}</strong>
        <small>${escapeHtml(field.fieldKey)}${field.tableType === 'detail' && field.detailTableName ? ` / ${escapeHtml(field.detailTableName)}` : ''}</small>
      </td>
      ${fieldPermissionActions.map((action) => `<td>${renderFieldPermissionCell(field, action)}</td>`).join('')}
    </tr>
  `).join('') || '<tr><td colspan="6">No fields found for this module.</td></tr>';
}

function updatePermissionPickerCount(picker) {
  const count = picker.querySelectorAll('input[type="checkbox"]:checked').length;
  const total = picker.querySelectorAll('input[type="checkbox"]').length;
  const badge = picker.querySelector('.permission-picker-toolbar span');
  if (badge) badge.textContent = `${count}/${total}`;
}

function filterPermissionPicker(picker) {
  const query = picker.querySelector('[data-permission-search]')?.value.trim().toLowerCase() || '';
  picker.querySelectorAll('[data-permission-option]').forEach((option) => {
    option.hidden = Boolean(query) && !String(option.dataset.search || '').toLowerCase().includes(query);
  });
}

function collectPermissionMatrix() {
  const permissions = Object.fromEntries(permissionActions.map((action) => {
    const existing = state.permissionMatrix?.permissions?.[action] || {};
    return [action, {
      roles: [...(existing.roles || [])],
      users: [...(existing.users || [])],
      departments: action === 'view' ? [...(existing.departments || [])] : []
    }];
  }));
  $$('#permissionRows [data-permission-action-row]').forEach((row) => {
    const action = row.dataset.permissionActionRow;
    permissions[action] = {
      roles: checkedValues(row.querySelector('[data-permission-picker="roles"]')),
      users: checkedValues(row.querySelector('[data-permission-picker="users"]')),
      departments: action === 'view' ? (state.permissionMatrix?.permissions?.view?.departments || []) : []
    };
  });
  return permissions;
}

function collectFieldPermissionMatrix() {
  const fields = [];
  $$('#fieldPermissionRows [data-field-permission-row]').forEach((row) => {
    const permissions = {};
    row.querySelectorAll('[data-field-permission-action]').forEach((cell) => {
      const action = cell.dataset.fieldPermissionAction;
      permissions[action] = {
        roles: checkedValues(cell.querySelector('[data-permission-picker="roles"]')),
        users: checkedValues(cell.querySelector('[data-permission-picker="users"]'))
      };
    });
    fields.push({
      fieldKey: row.dataset.fieldPermissionRow,
      permissions
    });
  });
  return fields;
}

async function loadPermissionMatrix(moduleKey = state.activePermissionModule) {
  if (state.user?.role !== 'admin') return;
  state.activePermissionModule = moduleKey;
  const [modulePayload, fieldPayload] = await Promise.all([
    api(`/api/sysadmin/modules/${moduleKey}/permissions`),
    api(`/api/sysadmin/modules/${moduleKey}/field-permissions`)
  ]);
  state.permissionMatrix = modulePayload;
  state.fieldPermissionMatrix = fieldPayload;
  renderPermissions();
}

async function savePermissionMatrix() {
  const button = $('#savePermissionsButton');
  if (!button) return;
  button.disabled = true;
  button.textContent = 'Saving...';
  try {
    const [modulePayload, fieldPayload] = await Promise.all([
      api(`/api/sysadmin/modules/${state.activePermissionModule}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissions: collectPermissionMatrix() })
      }),
      api(`/api/sysadmin/modules/${state.activePermissionModule}/field-permissions`, {
        method: 'PUT',
        body: JSON.stringify({ fields: collectFieldPermissionMatrix() })
      })
    ]);
    state.permissionMatrix = modulePayload;
    state.fieldPermissionMatrix = fieldPayload;
    renderPermissions();
    if (state.activePermissionModule === 'customers') {
      await refreshCustomerConfig();
      renderCustomers();
      renderCustomerFormFields();
    }
    toast('Permissions Saved.');
  } catch (error) {
    toast(titleCaseMessage(error.message), 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Save Permissions';
  }
}

function permissionDepartmentItems() {
  const items = [];
  const root = state.departmentNodes.find((node) => node.type === 'organization');
  function append(node, depth = 0, path = '') {
    const nodePath = path ? `${path} / ${node.name}` : node.name;
    items.push({
      value: String(node.id),
      label: node.name,
      meta: node.type === 'organization' ? 'All organization units' : nodePath,
      search: `${node.name} ${node.type} ${nodePath}`,
      depth,
      type: node.type,
      hasChildren: departmentChildren(node.id).length > 0
    });
    departmentChildren(node.id).forEach((child) => append(child, depth + 1, nodePath));
  }
  if (root) append(root);
  return items;
}

function closePageViewPermissionModal() {
  const modal = $('#pageViewPermissionModal');
  if (!modal) return;
  resetModalFullscreen(modal);
  modal.hidden = true;
  state.pageViewPermissionModule = '';
  state.pageViewPermissionMatrix = null;
  if ($$('.modal-backdrop').every((item) => item.hidden)) {
    document.body.classList.remove('modal-open');
  }
}

function renderPageViewPermissionModal() {
  const matrix = state.pageViewPermissionMatrix;
  if (!matrix) return;
  const module = configModules.find((item) => item.key === state.pageViewPermissionModule);
  const roleItems = (matrix.roles || ['admin', 'manager', 'user']).map((role) => ({
    value: role,
    label: titleCaseMessage(role),
    search: role
  }));
  const permissions = matrix.permissions || {};
  const actions = (matrix.actions || permissionActions).filter((action) => action !== 'configure');
  const viewPermission = permissions.view || { roles: [], users: [] };
  const otherActions = actions.filter((action) => action !== 'view');
  $('#pageViewPermissionTitle').textContent = `Page Permissions - ${module?.name || matrix.module?.name || titleCaseMessage(state.pageViewPermissionModule)}`;
  $('#pageModulePermissionRows').innerHTML = `
    <section class="page-view-access-card" data-page-permission-action="view">
      <div class="page-permission-card-header">
        <div>
          <span class="eyebrow">Primary access</span>
          <h3>View Access</h3>
        </div>
        <small>Controls whether this page appears and can be opened.</small>
      </div>
      <div class="page-view-access-grid">
        <section class="page-permission-access-column">
          <strong>Departments</strong>
          ${renderPermissionPicker('departments', 'view', permissionDepartmentItems(), viewPermission.departments)}
          <small class="permission-inheritance-note">Selecting a unit includes users assigned to that unit and its descendants.</small>
        </section>
        <section class="page-permission-access-column">
          <strong>Roles</strong>
          ${renderPermissionPicker('roles', 'view', roleItems, viewPermission.roles)}
        </section>
        <section class="page-permission-access-column">
          <strong>Specific Users</strong>
          ${renderPermissionPicker('users', 'view', permissionUserItems(), viewPermission.users)}
        </section>
      </div>
    </section>

    <div class="page-other-actions-heading">
      <div>
        <span class="eyebrow">Other actions</span>
        <h3>Action Permissions</h3>
      </div>
      <small>Expand an action to change its role and user access.</small>
    </div>
    <div class="page-permission-accordions">
      ${otherActions.map((action) => {
        const actionPermission = permissions[action] || { roles: [], users: [] };
        const roleCount = actionPermission.roles?.length || 0;
        const userCount = actionPermission.users?.length || 0;
        return `
          <details class="page-permission-action-card" data-page-permission-action="${escapeHtml(action)}" open>
            <summary>
              <strong>${escapeHtml(permissionActionLabel(action))}</strong>
              <span>${roleCount} roles · ${userCount} users</span>
            </summary>
            <div class="page-action-permission-grid">
              <section class="page-permission-access-column">
                <strong>Roles</strong>
                ${renderPermissionPicker('roles', action, roleItems, actionPermission.roles)}
              </section>
              <section class="page-permission-access-column">
                <strong>Specific Users</strong>
                ${renderPermissionPicker('users', action, permissionUserItems(), actionPermission.users)}
              </section>
            </div>
          </details>
        `;
      }).join('')}
    </div>
  `;
}

async function openPageViewPermissionModal(moduleKey) {
  const modal = $('#pageViewPermissionModal');
  const saveButton = $('#savePageViewPermissionButton');
  state.pageViewPermissionModule = moduleKey;
  state.pageViewPermissionMatrix = null;
  $('#pageViewPermissionTitle').textContent = `Page Permissions - ${moduleByKey(moduleKey)?.name || titleCaseMessage(moduleKey)}`;
  $('#pageModulePermissionRows').innerHTML = '<p class="muted">Loading permissions...</p>';
  saveButton.disabled = true;
  modal.hidden = false;
  document.body.classList.add('modal-open');
  try {
    state.pageViewPermissionMatrix = await api(`/api/sysadmin/modules/${moduleKey}/permissions`);
    renderPageViewPermissionModal();
    saveButton.disabled = false;
  } catch (error) {
    closePageViewPermissionModal();
    throw error;
  }
}

async function savePageViewPermission(event) {
  event.preventDefault();
  const matrix = state.pageViewPermissionMatrix;
  const moduleKey = state.pageViewPermissionModule;
  if (!matrix || !moduleKey) return;
  const button = $('#savePageViewPermissionButton');
  button.disabled = true;
  button.textContent = 'Saving...';
  try {
    const permissions = { ...(matrix.permissions || {}) };
    $$('#pageModulePermissionRows [data-page-permission-action]').forEach((row) => {
      const action = row.dataset.pagePermissionAction;
      permissions[action] = {
        roles: checkedValues(row.querySelector('[data-permission-picker="roles"]')),
        users: checkedValues(row.querySelector('[data-permission-picker="users"]')),
        departments: action === 'view' ? checkedValues(row.querySelector('[data-permission-picker="departments"]')) : []
      };
    });
    const saved = await api(`/api/sysadmin/modules/${moduleKey}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions })
    });
    if (state.activePermissionModule === moduleKey) {
      state.permissionMatrix = saved;
      renderPermissions();
    }
    await loadPublishedModules();
    closePageViewPermissionModal();
    toast('Page Permissions Saved.');
  } catch (error) {
    toast(titleCaseMessage(error.message), 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Save Permissions';
  }
}

function moduleFieldCount(moduleKey) {
  if (moduleKey === 'users') return state.userFields.length;
  if (moduleKey === 'customers') return state.customerFields.length;
  return moduleConfigByKey(moduleKey)?.fields?.length || 0;
}

function moduleStatusLabel(status) {
  return titleCaseMessage(status || 'draft');
}

function moduleStatusClass(status) {
  return `status-${String(status || 'draft').toLowerCase()}`;
}

function renderAdminModules() {
  const rows = $('#moduleBuilderRows');
  const summary = $('#moduleSummaryTiles');
  if (!rows) return;
  const modules = configModules;
  if (summary) {
    const published = modules.filter((module) => module.status === 'published').length;
    const custom = modules.filter((module) => !module.system).length;
    summary.innerHTML = [
      ['Total Modules', modules.length],
      ['Published', published],
      ['Custom Modules', custom]
    ].map(([label, value]) => `
      <div class="summary-tile">
        <strong>${escapeHtml(value)}</strong>
        <span>${escapeHtml(label)}</span>
      </div>
    `).join('');
  }

  rows.innerHTML = modules.map((module) => `
    <tr data-module-row="${escapeHtml(module.key)}">
      <td>
        <strong>${escapeHtml(module.name)}</strong>
        <div class="muted">${escapeHtml(module.key)}</div>
        <div class="muted">${escapeHtml(module.description || 'No description')}</div>
      </td>
      <td><span class="status-pill ${escapeHtml(moduleStatusClass(module.status))}">${escapeHtml(moduleStatusLabel(module.status))}</span></td>
      <td>${module.showInMenu ? 'Visible' : 'Hidden'}</td>
      <td>${moduleFieldCount(module.key)}</td>
      <td>${module.system ? 'System' : 'Custom'}</td>
      <td>
        <div class="table-action-group">
          <button type="button" class="link-button" data-edit-module-fields="${escapeHtml(module.key)}">Edit Form Fields</button>
          ${module.system ? '' : `<button type="button" class="link-button" data-edit-module="${escapeHtml(module.key)}">Edit</button>`}
          ${module.system ? '' : `<button type="button" class="link-button danger-link" data-delete-module="${escapeHtml(module.key)}">Delete</button>`}
        </div>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="6">No modules configured yet.</td></tr>';
}

function modulePageState(module) {
  if (module.status === 'archived' || module.enabled === false) {
    return { label: 'Archived', className: 'status-archived' };
  }
  if (module.status !== 'published') {
    return { label: 'Draft', className: 'status-draft' };
  }
  if (!module.showInMenu) {
    return { label: 'Published, Menu Hidden', className: 'status-draft' };
  }
  return { label: 'Published Live', className: 'status-published' };
}

function publishedLayoutCount(moduleKey) {
  const published = readFormDesignLayouts(moduleKey).published || {};
  return formDesignTypes.filter((type) => (published[type]?.order || []).length).length;
}

function modulePagePath(module) {
  if (module.key === 'customers') return 'Customers';
  if (module.key === 'users') return 'Users';
  return module.showInMenu ? module.name : 'Menu hidden';
}

function renderAdminModulePages() {
  const rows = $('#modulePageRows');
  const summary = $('#modulePageSummaryTiles');
  if (!rows) return;
  const search = state.modulePageSearch.trim().toLowerCase();
  const modules = configModules.filter((module) => (
    !search ||
    module.name.toLowerCase().includes(search) ||
    module.description.toLowerCase().includes(search) ||
    module.key.toLowerCase().includes(search)
  ));

  if (summary) {
    const live = configModules.filter((module) => module.status === 'published' && module.showInMenu).length;
    const hidden = configModules.filter((module) => module.status === 'published' && !module.showInMenu).length;
    const draft = configModules.filter((module) => module.status !== 'published').length;
    summary.innerHTML = [
      ['Live Pages', live],
      ['Menu Hidden', hidden],
      ['Draft Modules', draft]
    ].map(([label, value]) => `
      <div class="summary-tile">
        <strong>${escapeHtml(value)}</strong>
        <span>${escapeHtml(label)}</span>
      </div>
    `).join('');
  }

  rows.innerHTML = modules.map((module) => {
    const pageState = modulePageState(module);
    const systemView = module.key === 'customers' ? 'customersView' : module.key === 'users' ? 'usersView' : '';
    const runtimeModule = !module.system && module.status === 'published';
    return `
      <tr data-module-page-row="${escapeHtml(module.key)}">
        <td>
          <strong>${escapeHtml(module.name)}</strong>
          <div class="muted">${escapeHtml(module.key)}</div>
          <div class="muted">${escapeHtml(module.description || 'No description')}</div>
        </td>
        <td><span class="status-pill ${escapeHtml(pageState.className)}">${escapeHtml(pageState.label)}</span></td>
        <td>${escapeHtml(modulePagePath(module))}</td>
        <td>${moduleFieldCount(module.key)}</td>
        <td>${publishedLayoutCount(module.key)} / ${formDesignTypes.length}</td>
        <td>
          <div class="table-action-group">
            ${systemView ? `<button type="button" class="link-button" data-open-module-page="${escapeHtml(systemView)}">Open Page</button>` : ''}
            ${runtimeModule ? `<button type="button" class="link-button" data-open-runtime-module="${escapeHtml(module.key)}">Open Page</button>` : ''}
            <button type="button" class="link-button" data-edit-module-fields="${escapeHtml(module.key)}">Edit Form Fields</button>
            <button type="button" class="link-button" data-edit-page-permissions="${escapeHtml(module.key)}">Permissions</button>
            ${module.system ? '' : `<button type="button" class="link-button" data-edit-module="${escapeHtml(module.key)}">Publish Settings</button>`}
          </div>
        </td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="6">No pages found.</td></tr>';
}

function slugModuleKeyPreview(value) {
  const key = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
  return /^[a-z]/.test(key) ? key : key ? `m_${key}` : '';
}

function slugFormKeyPreview(value) {
  return slugModuleKeyPreview(value);
}

function moduleByKey(moduleKey) {
  return configModules.find((module) => module.key === moduleKey) || null;
}

function openModuleModal(moduleKey = '') {
  const form = $('#moduleForm');
  const modal = $('#moduleModal');
  if (!form || !modal) return;
  const module = moduleKey ? moduleByKey(moduleKey) : null;
  form.reset();
  form.dataset.moduleKeyEdited = module ? 'true' : 'false';
  form.elements.editingModuleKey.value = module?.key || '';
  form.elements.name.value = module?.name || '';
  form.elements.moduleKey.value = module?.key || '';
  form.elements.moduleKey.readOnly = Boolean(module);
  form.elements.description.value = module?.description || '';
  form.elements.status.value = module?.status || 'draft';
  form.elements.showInMenu.checked = Boolean(module?.showInMenu);
  $('#moduleFormTitle').textContent = module ? 'Edit Module' : 'New Module';
  modal.hidden = false;
  document.body.classList.add('modal-open');
  form.elements.name.focus();
}

function closeModuleModal() {
  const modal = $('#moduleModal');
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

function syncFormBuilderCreateFields() {
  const form = $('#formBuilderCreateForm');
  if (!form) return;
  const isWorkflow = form.elements.formType.value === 'workflow';
  $$('.form-builder-workflow-field').forEach((field) => {
    field.hidden = !isWorkflow;
  });
  form.elements.starterFieldLabel.required = isWorkflow;
}

function openFormBuilderCreateModal() {
  const form = $('#formBuilderCreateForm');
  const modal = $('#formBuilderCreateModal');
  if (!form || !modal) return;
  form.reset();
  form.dataset.formKeyEdited = 'false';
  syncFormBuilderCreateFields();
  modal.hidden = false;
  document.body.classList.add('modal-open');
  form.elements.name.focus();
}

function closeFormBuilderCreateModal() {
  const modal = $('#formBuilderCreateModal');
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

async function saveFormBuilderCreate(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formType = form.elements.formType.value;
  const name = form.elements.name.value.trim();
  const formKey = form.elements.formKey.value.trim();
  const description = form.elements.description.value.trim();
  if (formType === 'module') {
    await api('/api/sysadmin/modules', {
      method: 'POST',
      body: JSON.stringify({
        name,
        moduleKey: formKey,
        description,
        status: 'draft',
        showInMenu: false
      })
    });
    state.activeConfigModule = formKey;
    await refreshAdminModules();
    showAdminSection('adminFormsSection');
    renderFieldConfig();
    closeFormBuilderCreateModal();
    toast('Module Form Created.');
    return;
  }

  const starterLabel = form.elements.starterFieldLabel.value.trim() || 'Title';
  const starterFieldKey = slugFieldKeyPreview(starterLabel) || 'title';
  const payload = await api('/api/sysadmin/forms', {
    method: 'POST',
    body: JSON.stringify({
      name,
      formKey,
      description,
      fields: [{
        label: starterLabel,
        fieldKey: starterFieldKey,
        databaseFieldName: starterFieldKey,
        type: form.elements.starterFieldType.value,
        tableType: 'main',
        showInTable: true,
        showInForm: true,
        showInImport: true,
        required: false
      }]
    })
  });
  state.standaloneForms = payload.forms || [];
  closeFormBuilderCreateModal();
  toast('Workflow Form Created.');
}

async function refreshAdminModules() {
  const payload = await api('/api/sysadmin/modules');
  state.adminModules = payload.modules || [];
  syncConfigModuleCatalog();
  renderAdminModules();
  renderAdminModulePages();
  renderFormModuleList();
  renderBrowserSources();
  renderPermissions();
  await loadPublishedModules();
}

async function saveModule(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const editingModuleKey = form.elements.editingModuleKey.value;
  const body = {
    name: form.elements.name.value.trim(),
    moduleKey: form.elements.moduleKey.value.trim(),
    description: form.elements.description.value.trim(),
    status: form.elements.status.value,
    showInMenu: form.elements.showInMenu.checked
  };
  if (body.status !== 'published') body.showInMenu = false;
  const endpoint = editingModuleKey
    ? `/api/sysadmin/modules/${encodeURIComponent(editingModuleKey)}`
    : '/api/sysadmin/modules';
  const method = editingModuleKey ? 'PATCH' : 'POST';
  await api(endpoint, {
    method,
    body: JSON.stringify(editingModuleKey ? {
      name: body.name,
      description: body.description,
      status: body.status,
      showInMenu: body.showInMenu
    } : body)
  });
  closeModuleModal();
  await refreshAdminModules();
  toast(editingModuleKey ? 'Module Saved.' : 'Module Created.');
}

async function deleteModule(moduleKey) {
  const module = moduleByKey(moduleKey);
  if (!module || module.system) return;
  const confirmed = await showConfirmationModal({
    title: 'Delete Module',
    message: `Delete ${module.name}? This cannot be undone.`,
    confirmLabel: 'Delete Module'
  });
  if (!confirmed) return;
  await api(`/api/sysadmin/modules/${encodeURIComponent(moduleKey)}`, { method: 'DELETE' });
  await refreshAdminModules();
  toast('Module Deleted.');
}

function slugApiKeyPreview(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

function parseConnectorJson(value, label) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return {};
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      throw new Error(`${label} must be a JSON object.`);
    }
    return parsed;
  } catch (error) {
    throw new Error(error.message.includes('JSON') ? error.message : `${label} must be valid JSON.`);
  }
}

function connectorEndpoints(connector) {
  return Array.isArray(connector?.endpoints) ? connector.endpoints : [];
}

function renderApiTabs() {
  $$('.builder-list [data-api-tab]').forEach((button) => {
    const active = button.dataset.apiTab === state.activeApiTab;
    button.classList.toggle('is-active', active);
    button.closest('.tab-item')?.classList.toggle('is-active', active);
  });
  $('#apiInterfacesTab').hidden = state.activeApiTab !== 'interfaces';
  $('#apiConnectorsTab').hidden = state.activeApiTab !== 'connectors';
  $('#apiCategoriesTab').hidden = state.activeApiTab !== 'categories';
  const content = {
    categories: ['Connector Categories', 'Create categories used to organize connectors and their inherited interfaces.'],
    connectors: ['API Connectors', 'Configure reusable connections, network settings, timeouts, and authentication.'],
    interfaces: ['API Interfaces', 'Define connector endpoints, request and response data, success rules, and test requests.']
  }[state.activeApiTab] || [];
  $('#apiWorkspaceTitle').textContent = content[0] || 'API';
  $('#apiWorkspaceDescription').textContent = content[1] || '';
}

function categoryName(categoryKey) {
  return state.apiConnectorCategories.find((item) => item.categoryKey === categoryKey)?.name || 'Uncategorized';
}

function renderApiCategoryNavigation() {
  const container = $('#apiHierarchyNav');
  if (!container) return;
  const query = state.apiCategorySearch.trim().toLowerCase();
  const categories = [...state.apiConnectorCategories, { categoryKey: '', name: 'Uncategorized', description: '' }]
    .filter((category) => !query || category.name.toLowerCase().includes(query) || category.description?.toLowerCase().includes(query));
  const groupHtml = (scope, label) => {
    const connectors = scope === 'connectors' ? state.apiConnectors : state.apiConnectors.filter((connector) => connectorEndpoints(connector).length);
    const total = scope === 'connectors' ? connectors.length : connectors.reduce((count, connector) => count + connectorEndpoints(connector).length, 0);
    const expanded = state.apiTreeExpanded[scope] || Boolean(query);
    const children = categories.map((category) => {
      const categoryConnectors = state.apiConnectors.filter((connector) => (connector.categoryKey || '') === category.categoryKey);
      const count = scope === 'connectors' ? categoryConnectors.length : categoryConnectors.reduce((sum, connector) => sum + connectorEndpoints(connector).length, 0);
      return `<button type="button" class="api-tree-node api-tree-child ${state.activeApiTab === scope && state.activeApiCategory === category.categoryKey ? 'is-selected' : ''}" data-api-category="${escapeHtml(category.categoryKey)}" data-api-category-scope="${scope}" title="${escapeHtml(category.description || category.name)}"><span class="api-tree-label">${escapeHtml(category.name)}</span><small class="api-tree-count">${count}</small></button>`;
    }).join('');
    return `<section class="api-tree-group ${expanded ? 'is-expanded' : ''}">
      <div class="api-tree-root-row"><button type="button" class="api-tree-toggle" data-api-tree-toggle="${scope}" aria-expanded="${expanded}" aria-label="${expanded ? 'Collapse' : 'Expand'} ${label}">${expanded ? '⌄' : '›'}</button><button type="button" class="api-tree-node api-tree-root ${state.activeApiTab === scope && state.activeApiCategory === 'all' ? 'is-selected' : ''}" data-api-tab="${scope}" data-api-category="all"><span class="api-tree-label">${label}</span><small class="api-tree-count">${total}</small></button></div>
      <div class="api-tree-children" ${expanded ? '' : 'hidden'}>${children || '<p class="api-tree-empty">No matching categories</p>'}</div>
    </section>`;
  };
  container.innerHTML = `${groupHtml('connectors', 'Connectors')}${groupHtml('interfaces', 'Interfaces')}`;
}

function connectorMatchesActiveCategory(connector) {
  return state.activeApiCategory === 'all' || (connector.categoryKey || '') === state.activeApiCategory;
}

function renderApiInterfaces() {
  const rows = $('#apiInterfaceRows');
  if (!rows) return;
  const interfaces = state.apiConnectors.filter(connectorMatchesActiveCategory).flatMap((connector) => (
    connectorEndpoints(connector).map((endpoint) => ({ connector, endpoint }))
  ));
  rows.innerHTML = interfaces.map(({ connector, endpoint }) => `
    <tr data-api-interface="${escapeHtml(endpoint.key || '')}" data-api-interface-connector="${escapeHtml(connector.connectorKey)}">
      <td>
        <strong>${escapeHtml(endpoint.name || endpoint.key || endpoint.path || 'Endpoint')}</strong>
        <div class="muted">${escapeHtml(endpoint.key || '')}</div>
      </td>
      <td>
        <strong>${escapeHtml(connector.name)}</strong>
        <div class="muted">${escapeHtml(connector.connectorKey)}</div>
      </td>
      <td>${escapeHtml(categoryName(connector.categoryKey))}</td>
      <td>${escapeHtml(endpoint.method || 'GET')}</td>
      <td>${escapeHtml(endpoint.path || '/')}</td>
      <td><span class="status-pill ${connector.enabled === false || endpoint.enabled === false ? 'status-draft' : 'status-published'}">${connector.enabled === false || endpoint.enabled === false ? 'Disabled' : 'Active'}</span></td>
      <td><button type="button" class="link-button" data-edit-api-interface="${escapeHtml(endpoint.key || '')}" data-interface-connector="${escapeHtml(connector.connectorKey)}">Edit</button></td>
    </tr>
  `).join('') || '<tr><td colspan="7">No API interfaces configured yet. Create an interface to get started.</td></tr>';
}

function renderApiConnectors() {
  const rows = $('#apiConnectorRows');
  if (!rows) return;
  rows.innerHTML = state.apiConnectors.filter(connectorMatchesActiveCategory).map((connector) => `
    <tr data-api-connector="${escapeHtml(connector.connectorKey)}">
      <td>
        <strong>${escapeHtml(connector.name)}</strong>
        <div class="muted">${escapeHtml(connector.connectorKey)}</div>
      </td>
      <td>${escapeHtml(connector.baseUrl)}</td>
      <td>${escapeHtml(categoryName(connector.categoryKey))}</td>
      <td>${escapeHtml(titleCaseMessage(connector.authType || 'none'))}</td>
      <td>${connectorEndpoints(connector).length}</td>
      <td><span class="status-pill ${connector.enabled === false ? 'status-draft' : 'status-published'}">${connector.enabled === false ? 'Disabled' : 'Enabled'}</span></td>
      <td>
        <div class="table-action-group">
          <button type="button" class="link-button" data-edit-api-connector="${escapeHtml(connector.connectorKey)}">Edit</button>
          <button type="button" class="link-button danger-link" data-delete-api-connector="${escapeHtml(connector.connectorKey)}">Delete</button>
        </div>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="7">No API connectors configured yet.</td></tr>';
}

function renderApiCategories() {
  const rows = $('#apiCategoryRows');
  if (!rows) return;
  rows.innerHTML = state.apiConnectorCategories.map((category) => {
    const connectors = state.apiConnectors.filter((connector) => connector.categoryKey === category.categoryKey);
    const interfaces = connectors.reduce((total, connector) => total + connectorEndpoints(connector).length, 0);
    return `<tr><td><strong>${escapeHtml(category.name)}</strong><div class="muted">${escapeHtml(category.categoryKey)}</div></td><td>${escapeHtml(category.description || '—')}</td><td>${connectors.length}</td><td>${interfaces}</td><td><div class="table-action-group"><button type="button" class="link-button" data-edit-api-category="${escapeHtml(category.categoryKey)}">Edit</button><button type="button" class="link-button danger-link" data-delete-api-category="${escapeHtml(category.categoryKey)}">Delete</button></div></td></tr>`;
  }).join('') || '<tr><td colspan="5">No categories yet. Create one to organize your connectors.</td></tr>';
}

function renderApiWorkspace() {
  renderApiTabs();
  renderApiInterfaces();
  renderApiConnectors();
  renderApiCategories();
  renderApiCategoryNavigation();
}

async function refreshApiConnectors() {
  const [connectorPayload, categoryPayload] = await Promise.all([
    api('/api/action-flows/connectors'),
    api('/api/action-flows/connector-categories')
  ]);
  state.apiConnectors = connectorPayload.connectors || [];
  state.apiConnectorCategories = categoryPayload.categories || [];
  renderApiWorkspace();
}

function apiCategoryOptions(selected = '') {
  return `<option value="">Uncategorized</option>${state.apiConnectorCategories.map((category) => `<option value="${escapeHtml(category.categoryKey)}" ${category.categoryKey === selected ? 'selected' : ''}>${escapeHtml(category.name)}</option>`).join('')}`;
}

function openApiConnectorModal(connectorKey = '') {
  const form = $('#apiConnectorForm');
  const modal = $('#apiConnectorModal');
  if (!form || !modal) return;
  const connector = state.apiConnectors.find((item) => item.connectorKey === connectorKey) || null;
  form.reset();
  form.elements.editingConnectorKey.value = connector?.connectorKey || '';
  form.elements.name.value = connector?.name || '';
  form.elements.connectorKey.value = connector?.connectorKey || '';
  form.elements.connectorKey.readOnly = true;
  const connection = connector?.authConfig?.connection || {};
  let parsedBaseUrl = null;
  try {
    parsedBaseUrl = connector?.baseUrl ? new URL(connector.baseUrl) : null;
  } catch (_error) {
    parsedBaseUrl = null;
  }
  form.elements.description.value = connection.description || '';
  form.elements.categoryKey.innerHTML = apiCategoryOptions(connector?.categoryKey || '');
  form.elements.protocol.value = connection.protocol || parsedBaseUrl?.protocol?.replace(':', '') || 'https';
  form.elements.protocolVersion.value = connection.protocolVersion || 'default';
  form.elements.bypassCertificate.checked = Boolean(connection.bypassCertificate);
  form.elements.domainAddress.value = connection.domainAddress || (parsedBaseUrl ? `${parsedBaseUrl.host}${parsedBaseUrl.pathname === '/' ? '' : parsedBaseUrl.pathname}` : '');
  form.elements.encoding.value = connection.encoding || 'UTF-8';
  form.elements.connectionTimeout.value = connection.connectionTimeout || 60;
  form.elements.responseTimeout.value = connection.responseTimeout || 60;
  form.elements.authType.value = connector?.authType === 'oauth' ? 'oauth2' : connector?.authType || 'none';
  form.elements.enabled.checked = connector?.enabled !== false;
  const authDetails = { ...(connector?.authConfig || {}) };
  delete authDetails.connection;
  renderApiConnectorAuthFields(form.elements.authType.value, authDetails);
  $('#apiConnectorFormTitle').textContent = connector ? 'Edit Connector' : 'New Connector';
  updateApiConnectorConditionalFields();
  modal.hidden = false;
  document.body.classList.add('modal-open');
  form.elements.name.focus();
}

function normalizedConnectorDomain(value) {
  return String(value || '').trim().replace(/^https?:\/\//i, '').replace(/^\/+/, '').replace(/\/+$/, '');
}

function apiAuthInput(name, label, value = '', type = 'text', required = false) {
  return `<label>${escapeHtml(label)}${required ? ' *' : ''}<input name="${escapeHtml(name)}" type="${escapeHtml(type)}" value="${escapeHtml(value)}" ${required ? 'required' : ''}></label>`;
}

function renderApiConnectorAuthFields(authType = 'none', values = {}) {
  const container = $('#apiConnectorAuthFields');
  if (!container) return;
  const type = authType === 'oauth' ? 'oauth2' : authType;
  const templates = {
    api_key: `
      ${apiAuthInput('apiKeyName', 'Key Name', values.apiKeyName || 'X-API-Key', 'text', true)}
      ${apiAuthInput('apiKeyValue', 'Key Value', values.apiKeyValue || values.apiKey || '', 'password', true)}
      <label>Send API Key In<select name="apiKeyLocation"><option value="header" ${values.apiKeyLocation !== 'query' ? 'selected' : ''}>Request Header</option><option value="query" ${values.apiKeyLocation === 'query' ? 'selected' : ''}>Request URL</option></select></label>`,
    bearer: apiAuthInput('bearerToken', 'Token', values.bearerToken || values.token || values.accessToken || '', 'password', true),
    basic: `
      ${apiAuthInput('username', 'User Name', values.username || '', 'text', true)}
      ${apiAuthInput('password', 'Password', values.password || '', 'password', true)}
      ${apiAuthInput('domain', 'Domain', values.domain || '')}`,
    oauth1: `
      ${apiAuthInput('consumerKey', 'Consumer Key', values.consumerKey || '', 'text', true)}
      ${apiAuthInput('consumerSecret', 'Consumer Secret', values.consumerSecret || '', 'password', true)}
      ${apiAuthInput('accessToken', 'Access Token', values.accessToken || '', 'password')}
      ${apiAuthInput('tokenSecret', 'Token Secret', values.tokenSecret || '', 'password')}
      <label>Signature Method<select name="signatureMethod"><option value="HMAC-SHA1" ${values.signatureMethod !== 'HMAC-SHA256' ? 'selected' : ''}>HMAC-SHA1</option><option value="HMAC-SHA256" ${values.signatureMethod === 'HMAC-SHA256' ? 'selected' : ''}>HMAC-SHA256</option></select></label>
      ${apiAuthInput('realm', 'Realm', values.realm || '')}`,
    oauth2: `
      <label>Add Authorization Data To<select name="authorizationLocation"><option value="header" ${values.authorizationLocation !== 'query' ? 'selected' : ''}>Request Headers</option><option value="query" ${values.authorizationLocation === 'query' ? 'selected' : ''}>Request URL</option></select></label>
      ${apiAuthInput('headerPrefix', 'Header Prefix', values.headerPrefix || 'Bearer')}
      ${apiAuthInput('tokenName', 'Token Name', values.tokenName || 'access_token')}
      <label>Grant Type<select name="grantType"><option value="client_credentials" ${values.grantType === 'client_credentials' ? 'selected' : ''}>Client Credentials</option><option value="authorization_code" ${values.grantType === 'authorization_code' ? 'selected' : ''}>Authorization Code</option><option value="password" ${values.grantType === 'password' ? 'selected' : ''}>Password</option><option value="refresh_token" ${values.grantType === 'refresh_token' ? 'selected' : ''}>Refresh Token</option></select></label>
      ${apiAuthInput('accessTokenUrl', 'Access Token URL', values.accessTokenUrl || '', 'url', true)}
      ${apiAuthInput('clientId', 'Client ID', values.clientId || '', 'text', true)}
      ${apiAuthInput('clientSecret', 'Client Secret', values.clientSecret || '', 'password', true)}
      ${apiAuthInput('scope', 'Scope', values.scope || '')}
      <label>Client Authentication<select name="clientAuthentication"><option value="basic" ${values.clientAuthentication !== 'body' ? 'selected' : ''}>Send as Basic Auth header</option><option value="body" ${values.clientAuthentication === 'body' ? 'selected' : ''}>Send credentials in body</option></select></label>`
  };
  container.innerHTML = templates[type] || '';
  container.hidden = type === 'none';
  container.dataset.authType = type;
}

function collectApiConnectorAuth(form, authType) {
  const value = (name) => form.elements[name]?.value?.trim() || '';
  if (authType === 'api_key') return { apiKeyName: value('apiKeyName'), apiKeyValue: value('apiKeyValue'), apiKeyLocation: value('apiKeyLocation') || 'header' };
  if (authType === 'bearer') return { bearerToken: value('bearerToken') };
  if (authType === 'basic') return { username: value('username'), password: value('password'), domain: value('domain') };
  if (authType === 'oauth1') return { consumerKey: value('consumerKey'), consumerSecret: value('consumerSecret'), accessToken: value('accessToken'), tokenSecret: value('tokenSecret'), signatureMethod: value('signatureMethod'), realm: value('realm') };
  if (authType === 'oauth2') return { authorizationLocation: value('authorizationLocation'), headerPrefix: value('headerPrefix'), tokenName: value('tokenName'), grantType: value('grantType'), accessTokenUrl: value('accessTokenUrl'), clientId: value('clientId'), clientSecret: value('clientSecret'), scope: value('scope'), clientAuthentication: value('clientAuthentication') };
  return {};
}

function updateApiConnectorConditionalFields() {
  const form = $('#apiConnectorForm');
  if (!form) return;
  const protocol = form.elements.protocol.value || 'https';
  $('#apiConnectorProtocolPrefix').textContent = `${protocol}://`;
  if ($('#apiConnectorAuthFields').dataset.authType !== form.elements.authType.value) {
    renderApiConnectorAuthFields(form.elements.authType.value);
  }
}

function closeApiConnectorModal() {
  const modal = $('#apiConnectorModal');
  if (!modal) return;
  resetModalFullscreen(modal);
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

async function saveApiConnector(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = serializeForm(form);
  const protocol = form.elements.protocol.value || 'https';
  const domainAddress = normalizedConnectorDomain(data.domainAddress);
  const authDetails = collectApiConnectorAuth(form, data.authType || 'none');
  const existingConnector = state.apiConnectors.find((item) => item.connectorKey === data.editingConnectorKey);
  const body = {
    connectorKey: data.connectorKey || slugApiKeyPreview(data.name),
    name: data.name.trim(),
    baseUrl: `${protocol}://${domainAddress}`,
    categoryKey: data.categoryKey || '',
    authType: data.authType || 'none',
    enabled: form.elements.enabled.checked,
    authConfig: {
      ...authDetails,
      connection: {
        description: data.description.trim(),
        protocol,
        protocolVersion: data.protocolVersion || 'default',
        bypassCertificate: form.elements.bypassCertificate.checked,
        domainAddress,
        encoding: data.encoding || 'UTF-8',
        connectionTimeout: Number(data.connectionTimeout || 60),
        responseTimeout: Number(data.responseTimeout || 60),
        authMethod: data.authType || 'none'
      }
    },
    defaultHeaders: existingConnector?.defaultHeaders || {},
    endpoints: connectorEndpoints(existingConnector)
  };
  await api('/api/action-flows/connectors', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  closeApiConnectorModal();
  await refreshApiConnectors();
  state.activeApiTab = 'connectors';
  renderApiWorkspace();
  toast(data.editingConnectorKey ? 'Connector Saved.' : 'Connector Created.');
}

async function deleteApiConnector(connectorKey) {
  if (!connectorKey) return;
  const connector = state.apiConnectors.find((item) => item.connectorKey === connectorKey);
  const confirmed = await showConfirmationModal({
    title: 'Delete Connector',
    message: `Delete ${connector?.name || 'this connector'}? Its configured interfaces will also be removed. This cannot be undone.`,
    confirmLabel: 'Delete Connector'
  });
  if (!confirmed) return;
  await api(`/api/action-flows/connectors/${encodeURIComponent(connectorKey)}`, { method: 'DELETE' });
  await refreshApiConnectors();
  toast('Connector Deleted.');
}

function openApiCategoryModal(categoryKey = '') {
  const form = $('#apiCategoryForm');
  const modal = $('#apiCategoryModal');
  const category = state.apiConnectorCategories.find((item) => item.categoryKey === categoryKey) || null;
  form.reset();
  form.elements.editingCategoryKey.value = category?.categoryKey || '';
  form.elements.name.value = category?.name || '';
  form.elements.description.value = category?.description || '';
  $('#apiCategoryFormTitle').textContent = category ? 'Edit Category' : 'New Category';
  modal.hidden = false;
  document.body.classList.add('modal-open');
  form.elements.name.focus();
}

function closeApiCategoryModal() {
  $('#apiCategoryModal').hidden = true;
  if ($$('.modal-backdrop').every((item) => item.hidden)) document.body.classList.remove('modal-open');
}

async function saveApiCategory(event) {
  event.preventDefault();
  const form = event.currentTarget;
  await api('/api/action-flows/connector-categories', { method: 'POST', body: JSON.stringify({ categoryKey: form.elements.editingCategoryKey.value || undefined, name: form.elements.name.value.trim(), description: form.elements.description.value.trim() }) });
  closeApiCategoryModal();
  await refreshApiConnectors();
  state.activeApiTab = 'categories';
  renderApiWorkspace();
  toast(form.elements.editingCategoryKey.value ? 'Category Saved.' : 'Category Created.');
}

async function deleteApiCategory(categoryKey) {
  const category = state.apiConnectorCategories.find((item) => item.categoryKey === categoryKey);
  const confirmed = await showConfirmationModal({
    title: 'Delete Category',
    message: `Delete ${category?.name || 'this category'}? This cannot be undone.`,
    confirmLabel: 'Delete Category'
  });
  if (!confirmed) return;
  await api(`/api/action-flows/connector-categories/${encodeURIComponent(categoryKey)}`, { method: 'DELETE' });
  if (state.activeApiCategory === categoryKey) state.activeApiCategory = 'all';
  await refreshApiConnectors();
  toast('Category Deleted.');
}

function departmentNode(id) {
  return state.departmentNodes.find((node) => node.id === Number(id));
}

function departmentChildren(parentId) {
  return state.departmentNodes.filter((node) => Number(node.parentId || 0) === Number(parentId || 0));
}

function renderDepartmentWorkspace() {
  const tree = $('#departmentTree');
  const rows = $('#departmentRows');
  if (!tree || !rows) return;
  const organization = state.departmentNodes.find((node) => node.type === 'organization');
  if (!state.activeDepartmentNodeId && organization) state.activeDepartmentNodeId = organization.id;
  const treeRows = [];
  function appendTree(node, depth = 0) {
    treeRows.push({ node, depth });
    departmentChildren(node.id).forEach((child) => appendTree(child, depth + 1));
  }
  if (organization) appendTree(organization);
  tree.innerHTML = treeRows.map(({ node, depth }) => `
    <button type="button" class="department-tree-item ${node.id === state.activeDepartmentNodeId ? 'is-active' : ''}" data-department-node="${node.id}" style="--tree-depth:${depth}">
      <span>${departmentChildren(node.id).length ? '▾ ' : ''}${escapeHtml(node.name)}</span>
      <small>${departmentChildren(node.id).length}</small>
    </button>`).join('') || '<p class="muted">Loading organization...</p>';
  const active = departmentNode(state.activeDepartmentNodeId) || organization;
  const visible = departmentChildren(active?.id);
  rows.innerHTML = visible.map((node) => `
    <tr><td><strong>${escapeHtml(node.name)}</strong></td><td>${escapeHtml(titleCaseMessage(node.type))}</td><td>${escapeHtml(node.parentName || '—')}</td><td>${escapeHtml(node.description || '—')}</td><td><span class="status-pill ${node.enabled ? 'status-live' : 'status-draft'}">${node.enabled ? 'Enabled' : 'Disabled'}</span></td><td><button type="button" class="link-button" data-edit-department-node="${node.id}">Edit</button> <button type="button" class="link-button" data-delete-department-node="${node.id}">Delete</button></td></tr>`).join('') || '<tr><td colspan="6" class="muted">No child units yet.</td></tr>';
  $('#newDepartmentNodeButton').disabled = active?.enabled === false;
  $('#newGroupNodeButton').disabled = active?.enabled === false;
}

async function loadDepartmentHierarchy() {
  const result = await api('/api/departments');
  state.departmentNodes = result.nodes || [];
  if (!departmentNode(state.activeDepartmentNodeId)) state.activeDepartmentNodeId = state.departmentNodes.find((node) => node.type === 'organization')?.id || 0;
  renderDepartmentWorkspace();
}

function closeDepartmentNodeModal() {
  $('#departmentNodeModal').hidden = true;
  if ($$('.modal-backdrop').every((item) => item.hidden)) document.body.classList.remove('modal-open');
}

function openDepartmentNodeModal(nodeId = 0, requestedType = 'department') {
  const form = $('#departmentNodeForm');
  const node = departmentNode(nodeId);
  const active = departmentNode(state.activeDepartmentNodeId) || state.departmentNodes.find((item) => item.type === 'organization');
  const type = node?.type || requestedType;
  const parents = state.departmentNodes.filter((item) => item.enabled && item.id !== node?.id);
  form.reset();
  form.elements.id.value = node?.id || '';
  form.elements.type.value = type;
  form.elements.type.disabled = Boolean(node);
  form.elements.parentId.innerHTML = parents.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('');
  form.elements.parentId.value = String(node?.parentId || (parents.some((item) => item.id === active?.id) ? active.id : parents[0]?.id || ''));
  form.elements.parentId.disabled = Boolean(node);
  form.elements.name.value = node?.name || '';
  form.elements.description.value = node?.description || '';
  form.elements.enabled.checked = node?.enabled !== false;
  $('#departmentNodeFormTitle').textContent = node ? `Edit ${titleCaseMessage(type)}` : `New ${titleCaseMessage(type)}`;
  $('#departmentNodeModal').hidden = false;
  document.body.classList.add('modal-open');
  form.elements.name.focus();
}

async function saveDepartmentNode(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const existing = departmentNode(form.elements.id.value);
  await api('/api/departments', { method: 'POST', body: JSON.stringify({
    id: existing?.id,
    type: existing?.type || form.elements.type.value,
    parentId: existing?.parentId || Number(form.elements.parentId.value),
    name: form.elements.name.value.trim(),
    description: form.elements.description.value.trim(),
    enabled: form.elements.enabled.checked
  }) });
  closeDepartmentNodeModal();
  await loadDepartmentHierarchy();
  toast(existing ? 'Department Item Saved.' : 'Department Item Created.');
}

async function deleteDepartmentNode(id) {
  const node = departmentNode(id);
  if (!node) return;
  const confirmed = await showConfirmationModal({ title: `Delete ${titleCaseMessage(node.type)}`, message: `Delete ${node.name}? This cannot be undone.`, confirmLabel: `Delete ${titleCaseMessage(node.type)}` });
  if (!confirmed) return;
  await api(`/api/departments/${id}`, { method: 'DELETE' });
  state.activeDepartmentNodeId = node.parentId || 0;
  await loadDepartmentHierarchy();
  toast(`${titleCaseMessage(node.type)} Deleted.`);
}

async function importDepartments(file) {
  const body = new FormData();
  body.append('file', file);
  const result = await api('/api/departments/import', { method: 'POST', body });
  await loadDepartmentHierarchy();
  toast(`Imported ${result.departmentsCreated} Department${result.departmentsCreated === 1 ? '' : 's'} And ${result.groupsCreated} Group${result.groupsCreated === 1 ? '' : 's'}.`);
}

async function downloadDepartmentTemplate() {
  const response = await fetch('/api/departments/import/template', { headers: { Authorization: `Bearer ${await currentAuthToken()}` } });
  if (!response.ok) throw new Error('Unable to download department template');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(await response.blob());
  link.download = 'department-hierarchy-import-template.xlsx';
  link.click();
  URL.revokeObjectURL(link.href);
}

function interfaceConnectorOptions(selected = '') {
  return `<option value="">Select a connector</option>${state.apiConnectors.map((connector) => (
    `<option value="${escapeHtml(connector.connectorKey)}" ${connector.connectorKey === selected ? 'selected' : ''}>${escapeHtml(connector.name)}</option>`
  )).join('')}`;
}

function renderApiInterfaceConnectorChoices(selected = '') {
  const container = $('#apiInterfaceConnectorChoices');
  if (!container) return;
  if (!state.apiConnectors.length) {
    container.innerHTML = '<div class="api-connector-choice-empty"><strong>No connectors available</strong><p>Create a connector before adding an interface.</p></div>';
    return;
  }
  container.innerHTML = state.apiConnectors.map((connector) => {
    const active = connector.connectorKey === selected;
    const auth = connector.authType && connector.authType !== 'none' ? titleCaseMessage(connector.authType) : 'No authentication';
    return `<button type="button" class="api-connector-choice ${active ? 'is-selected' : ''}" data-select-interface-connector="${escapeHtml(connector.connectorKey)}" aria-pressed="${active}">
      <span class="api-connector-choice-icon" aria-hidden="true">↗</span>
      <span><strong>${escapeHtml(connector.name)}</strong><small>${escapeHtml(connector.baseUrl || 'No base URL')}</small></span>
      <span class="api-connector-choice-meta">${escapeHtml(auth)}</span>
      <span class="api-connector-choice-check" aria-hidden="true">${active ? '✓' : ''}</span>
    </button>`;
  }).join('');
}

function setApiInterfaceStep(step) {
  state.activeApiInterfaceStep = Math.max(0, Math.min(5, Number(step) || 0));
  $$('[data-interface-step]').forEach((panel) => {
    panel.hidden = Number(panel.dataset.interfaceStep) !== state.activeApiInterfaceStep;
  });
  $$('[data-interface-step-button]').forEach((button) => {
    const buttonStep = Number(button.dataset.interfaceStepButton);
    button.classList.toggle('is-active', buttonStep === state.activeApiInterfaceStep);
    button.classList.toggle('is-complete', buttonStep < state.activeApiInterfaceStep);
  });
  $('#backApiInterfaceButton').hidden = state.activeApiInterfaceStep === 0;
  $('#nextApiInterfaceButton').hidden = state.activeApiInterfaceStep === 5;
  $('#saveApiInterfaceButton').hidden = state.activeApiInterfaceStep !== 5;
  if (state.activeApiInterfaceStep === 5) updateApiInterfaceTestPreview();
}

function endpointInterfaceConfig(endpoint = {}) {
  return endpoint?.interfaceConfig || {};
}

function apiDefinitionRowsFromObject(value, prefix = '') {
  if (!value || typeof value !== 'object') return [];
  const rows = [];
  Object.entries(value).forEach(([key, item]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (item && typeof item === 'object' && !Array.isArray(item) && !('type' in item) && !('value' in item)) {
      rows.push(...apiDefinitionRowsFromObject(item, path));
      return;
    }
    const descriptor = item && typeof item === 'object' && !Array.isArray(item) ? item : {};
    const rawValue = Object.prototype.hasOwnProperty.call(descriptor, 'value') ? descriptor.value : item;
    rows.push({
      name: path,
      displayName: descriptor.displayName || key,
      description: descriptor.description || '',
      parameterType: descriptor.parameterType || (typeof rawValue === 'string' ? 'text' : typeof rawValue) || 'text',
      dataType: descriptor.dataType || 'property',
      required: descriptor.required !== false,
      array: Boolean(descriptor.array || Array.isArray(rawValue)),
      value: rawValue === null || typeof rawValue === 'object' ? JSON.stringify(rawValue ?? '') : String(rawValue ?? '')
    });
  });
  return rows;
}

function apiDefinitionRows(scope, tab) {
  return state.apiInterfaceDefinitions[scope]?.[tab] || [];
}

function renderApiDefinitionEditor(scope) {
  const editor = $(`[data-definition-editor="${scope}"]`);
  if (!editor) return;
  const tab = state.activeApiDefinitionTabs[scope] || 'params';
  const rows = apiDefinitionRows(scope, tab);
  editor.innerHTML = `
    <div class="api-definition-actions"><div><strong>${escapeHtml(titleCaseMessage(tab))}</strong>${tab === 'body' ? `<label class="api-body-format">Data Format<select data-body-format="${scope}">${['none', 'application/json', 'application/xml', 'application/x-www-form-urlencoded', 'multipart/form-data', 'application/octet-stream', 'text/plain'].map((format) => `<option value="${format}" ${state.apiInterfaceBodyFormats[scope] === format ? 'selected' : ''}>${format}</option>`).join('')}</select></label>` : ''}</div><span><button type="button" class="secondary small-button" data-add-definition-row="${scope}">Add Row</button><button type="button" class="secondary small-button" data-batch-definition="${scope}">Batch Add</button></span></div>
    <div class="table-wrap"><table class="config-table api-definition-table"><thead><tr><th>#</th><th>Parameter Name</th><th>Display Name</th><th>Description</th><th>Parameter Type</th><th>Data Type</th><th>Value</th><th>Required</th><th>Array</th><th></th></tr></thead><tbody>
      ${rows.map((row, index) => `<tr data-definition-row="${index}"><td>${index + 1}</td><td><input name="definitionName" value="${escapeHtml(row.name)}"></td><td><input name="definitionDisplayName" value="${escapeHtml(row.displayName)}"></td><td><input name="definitionDescription" value="${escapeHtml(row.description)}"></td><td><select name="definitionParameterType">${['text', 'number', 'boolean', 'object'].map((type) => `<option value="${type}" ${row.parameterType === type ? 'selected' : ''}>${titleCaseMessage(type)}</option>`).join('')}</select></td><td><select name="definitionDataType"><option value="property" ${row.dataType === 'property' ? 'selected' : ''}>Property</option><option value="node" ${row.dataType === 'node' ? 'selected' : ''}>Node</option></select></td><td><input name="definitionValue" value="${escapeHtml(row.value)}"></td><td><input name="definitionRequired" type="checkbox" ${row.required ? 'checked' : ''}></td><td><input name="definitionArray" type="checkbox" ${row.array ? 'checked' : ''}></td><td><button type="button" class="link-button danger-link" data-remove-definition-row>Remove</button></td></tr>`).join('') || '<tr><td colspan="10" class="muted">No fields yet. Add a row or batch add JSON/XML.</td></tr>'}
    </tbody></table></div>`;
}

function renderAllApiDefinitionEditors() {
  renderApiDefinitionEditor('request');
  renderApiDefinitionEditor('response');
  $$('[data-definition-tabs]').forEach((tabs) => {
    Array.from(tabs.querySelectorAll('[data-definition-tab]')).forEach((button) => button.classList.toggle('is-active', button.dataset.definitionTab === state.activeApiDefinitionTabs[tabs.dataset.definitionTabs]));
  });
}

function initializeApiInterfaceDefinitions(config = {}) {
  const savedRequest = config.request?.definitions || {};
  const savedResponse = config.response?.definitions || {};
  state.apiInterfaceDefinitions = {
    request: {
      params: savedRequest.params || apiDefinitionRowsFromObject(config.request?.params || {}),
      headers: savedRequest.headers || apiDefinitionRowsFromObject(config.request?.headers || {}),
      body: savedRequest.body || apiDefinitionRowsFromObject(config.request?.body || {})
    },
    response: {
      params: savedResponse.params || [],
      headers: savedResponse.headers || [],
      body: savedResponse.body || apiDefinitionRowsFromObject(config.response?.schema || {})
    }
  };
  state.activeApiDefinitionTabs = { request: 'params', response: 'params' };
  state.apiInterfaceBodyFormats = {
    request: config.request?.bodyFormat || 'application/json',
    response: config.response?.format === 'xml' ? 'application/xml' : config.response?.format === 'text' ? 'text/plain' : config.response?.bodyFormat || 'application/json'
  };
  renderAllApiDefinitionEditors();
}

function apiRowsToObject(rows) {
  const output = {};
  rows.forEach((row) => {
    if (!row.name) return;
    const keys = row.name.split('.').filter(Boolean);
    let target = output;
    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        let value = row.value;
        if (row.parameterType === 'number' && value !== '') value = Number(value);
        if (row.parameterType === 'boolean') value = value === true || String(value).toLowerCase() === 'true';
        if (row.parameterType === 'object' && typeof value === 'string' && value.trim()) {
          try { value = JSON.parse(value); } catch (_error) { value = row.value; }
        }
        target[key] = value;
      }
      else target = target[key] ||= {};
    });
  });
  return output;
}

function updateApiDefinitionRow(target) {
  const editor = target.closest('[data-definition-editor]');
  const rowElement = target.closest('[data-definition-row]');
  if (!editor || !rowElement) return;
  const scope = editor.dataset.definitionEditor;
  const row = apiDefinitionRows(scope, state.activeApiDefinitionTabs[scope])[Number(rowElement.dataset.definitionRow)];
  if (!row) return;
  const propertyMap = {
    definitionName: 'name', definitionDisplayName: 'displayName', definitionDescription: 'description',
    definitionParameterType: 'parameterType', definitionDataType: 'dataType', definitionValue: 'value',
    definitionRequired: 'required', definitionArray: 'array'
  };
  const property = propertyMap[target.name];
  if (property) row[property] = target.type === 'checkbox' ? target.checked : target.value;
}

function xmlBatchObject(text) {
  const documentNode = new DOMParser().parseFromString(text, 'application/xml');
  const parseError = documentNode.querySelector('parsererror');
  if (parseError) throw new Error('XML is not valid.');
  const convert = (element) => {
    const children = Array.from(element.children);
    if (!children.length) return element.textContent || '';
    return children.reduce((result, child) => {
      const value = convert(child);
      if (Object.prototype.hasOwnProperty.call(result, child.tagName)) {
        result[child.tagName] = Array.isArray(result[child.tagName]) ? [...result[child.tagName], value] : [result[child.tagName], value];
      } else result[child.tagName] = value;
      return result;
    }, {});
  };
  return { [documentNode.documentElement.tagName]: convert(documentNode.documentElement) };
}

function openApiDefinitionBatch(scope) {
  state.apiDefinitionBatchTarget = { scope, tab: state.activeApiDefinitionTabs[scope] };
  const input = $('#apiDefinitionBatchInput');
  const bodyFormat = state.apiInterfaceBodyFormats[scope] || '';
  input.value = '';
  input.placeholder = state.apiDefinitionBatchTarget.tab === 'body' && bodyFormat.includes('xml')
    ? '<customer><name>Example</name><active>true</active></customer>'
    : '{"customer":{"name":"Example","active":true}}';
  $('#apiDefinitionBatchPanel').hidden = false;
  input.focus();
}

function closeApiDefinitionBatch() {
  $('#apiDefinitionBatchPanel').hidden = true;
  state.apiDefinitionBatchTarget = null;
}

function applyApiDefinitionBatch() {
  const target = state.apiDefinitionBatchTarget;
  if (!target) return;
  const text = $('#apiDefinitionBatchInput').value.trim();
  if (!text) throw new Error('Paste JSON or XML before adding fields.');
  let parsed;
  const selectedBodyFormat = target.tab === 'body' ? state.apiInterfaceBodyFormats[target.scope] : '';
  const format = selectedBodyFormat.includes('xml') || text.startsWith('<') ? 'xml' : 'json';
  if (format === 'xml') parsed = xmlBatchObject(text);
  else {
    try { parsed = JSON.parse(text); } catch (_error) { throw new Error('JSON is not valid.'); }
  }
  state.apiInterfaceDefinitions[target.scope][target.tab].push(...apiDefinitionRowsFromObject(parsed));
  closeApiDefinitionBatch();
  renderApiDefinitionEditor(target.scope);
}

function openApiInterfaceModal(connectorKey = '', interfaceKey = '') {
  const form = $('#apiInterfaceForm');
  const modal = $('#apiInterfaceModal');
  if (!form || !modal) return;
  const field = (name) => form.querySelector(`[name="${name}"]`);
  const connector = state.apiConnectors.find((item) => item.connectorKey === connectorKey) || null;
  const endpoint = connectorEndpoints(connector).find((item) => item.key === interfaceKey) || null;
  const config = endpointInterfaceConfig(endpoint);
  form.reset();
  field('connectorKey').innerHTML = interfaceConnectorOptions(connector?.connectorKey || '');
  renderApiInterfaceConnectorChoices(connector?.connectorKey || '');
  field('editingConnectorKey').value = endpoint ? connector?.connectorKey || '' : '';
  field('editingInterfaceKey').value = endpoint?.key || '';
  field('name').value = endpoint?.name || '';
  field('key').value = endpoint?.key || '';
  field('key').readOnly = Boolean(endpoint);
  field('group').value = config.group || '';
  field('method').value = endpoint?.method || 'GET';
  field('path').value = endpoint?.path || '';
  field('description').value = config.description || '';
  field('enabled').checked = endpoint?.enabled !== false;
  initializeApiInterfaceDefinitions(config);
  field('successStatuses').value = config.outcome?.successStatuses || '';
  field('cacheResult').checked = Boolean(config.outcome?.cacheResult);
  field('failureMessage').value = config.outcome?.failureMessage || '';
  field('timeoutMessage').value = config.outcome?.timeoutMessage || '';
  field('exceptionMessage').value = config.outcome?.exceptionMessage || '';
  $('#apiInterfaceFormTitle').textContent = endpoint ? 'Edit Interface' : 'New Interface';
  $('#apiInterfaceTestResult').textContent = 'The test result will appear here.';
  setApiInterfaceStep(endpoint ? 1 : 0);
  modal.hidden = false;
  document.body.classList.add('modal-open');
  if (endpoint) field('name').focus();
  else containerFocus($('#apiInterfaceConnectorChoices'));
}

function containerFocus(container) {
  container?.querySelector('button, input, select, textarea')?.focus();
}

function closeApiInterfaceModal() {
  const modal = $('#apiInterfaceModal');
  if (!modal) return;
  resetModalFullscreen(modal);
  closeApiDefinitionBatch();
  modal.hidden = true;
  if ($$('.modal-backdrop').every((item) => item.hidden)) document.body.classList.remove('modal-open');
}

function collectApiInterface(form) {
  const data = serializeForm(form);
  const requestDefinitions = state.apiInterfaceDefinitions.request;
  const responseDefinitions = state.apiInterfaceDefinitions.response;
  return {
    key: data.key || slugApiKeyPreview(data.name),
    name: data.name.trim(),
    method: data.method || 'GET',
    path: data.path.trim(),
    enabled: form.elements.enabled.checked,
    interfaceConfig: {
      group: data.group.trim(),
      description: data.description.trim(),
      request: {
        params: apiRowsToObject(requestDefinitions.params),
        headers: apiRowsToObject(requestDefinitions.headers),
        body: apiRowsToObject(requestDefinitions.body),
        bodyFormat: state.apiInterfaceBodyFormats.request,
        definitions: requestDefinitions
      },
      response: {
        format: state.apiInterfaceBodyFormats.response.includes('xml') ? 'xml' : state.apiInterfaceBodyFormats.response.includes('text') ? 'text' : 'json',
        bodyFormat: state.apiInterfaceBodyFormats.response,
        array: responseDefinitions.body.some((row) => row.array),
        schema: apiRowsToObject(responseDefinitions.body),
        definitions: responseDefinitions
      },
      outcome: {
        successStatuses: data.successStatuses.trim(),
        cacheResult: form.elements.cacheResult.checked,
        failureMessage: data.failureMessage.trim(),
        timeoutMessage: data.timeoutMessage.trim(),
        exceptionMessage: data.exceptionMessage.trim()
      }
    }
  };
}

function connectorSavePayload(connector, endpoints) {
  return {
    connectorKey: connector.connectorKey,
    name: connector.name,
    baseUrl: connector.baseUrl,
    categoryKey: connector.categoryKey || '',
    authType: connector.authType || 'none',
    authConfig: connector.authConfig || {},
    defaultHeaders: connector.defaultHeaders || {},
    enabled: connector.enabled !== false,
    endpoints
  };
}

async function saveApiInterface(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const endpoint = collectApiInterface(form);
  const targetKey = form.elements.connectorKey.value;
  const originalConnectorKey = form.elements.editingConnectorKey.value;
  const originalKey = form.elements.editingInterfaceKey.value;
  const targetConnector = state.apiConnectors.find((item) => item.connectorKey === targetKey);
  if (!targetConnector) throw new Error('Select a valid Connector.');
  if (originalConnectorKey && originalConnectorKey !== targetKey) {
    const originalConnector = state.apiConnectors.find((item) => item.connectorKey === originalConnectorKey);
    await api('/api/action-flows/connectors', { method: 'POST', body: JSON.stringify(connectorSavePayload(
      originalConnector,
      connectorEndpoints(originalConnector).filter((item) => item.key !== originalKey)
    )) });
  }
  const endpoints = connectorEndpoints(targetConnector).filter((item) => item.key !== (originalKey || endpoint.key));
  if (endpoints.some((item) => item.key === endpoint.key)) throw new Error('Interface key already exists on this Connector.');
  endpoints.push(endpoint);
  await api('/api/action-flows/connectors', {
    method: 'POST',
    body: JSON.stringify(connectorSavePayload(targetConnector, endpoints))
  });
  closeApiInterfaceModal();
  await refreshApiConnectors();
  state.activeApiTab = 'interfaces';
  renderApiWorkspace();
  toast(originalKey ? 'Interface Saved.' : 'Interface Created.');
}

function updateApiInterfaceTestPreview() {
  const form = $('#apiInterfaceForm');
  if (!form) return;
  const connector = state.apiConnectors.find((item) => item.connectorKey === form.elements.connectorKey.value);
  const base = String(connector?.baseUrl || '').replace(/\/$/, '');
  const path = String(form.elements.path.value || '').replace(/^\/?/, '/');
  $('#apiInterfaceTestMethod').textContent = form.elements.method.value || 'GET';
  $('#apiInterfaceTestUrl').textContent = base ? `${base}${path}` : 'Select a connector and enter a path';
}

async function testApiInterface() {
  const form = $('#apiInterfaceForm');
  const output = $('#apiInterfaceTestResult');
  const connectorKey = form.elements.connectorKey.value;
  const endpoint = collectApiInterface(form);
  if (!connectorKey) throw new Error('Select a Connector first.');
  if (!endpoint.path) throw new Error('Enter an Interface Path first.');
  output.textContent = 'Sending request...';
  const result = await api(`/api/action-flows/connectors/${encodeURIComponent(connectorKey)}/debug`, {
    method: 'POST',
    body: JSON.stringify(endpoint)
  });
  const responseBody = typeof result.response.body === 'string'
    ? result.response.body
    : JSON.stringify(result.response.body, null, 2);
  const responseHeaders = Object.entries(result.response.headers || {}).map(([key, value]) => `${key}: ${value}`).join('\n');
  output.textContent = [
    `HTTP ${result.response.status} ${result.response.statusText || ''}`.trim(),
    `${result.response.durationMs} ms · ${result.response.sizeBytes} bytes · ${result.outcome.success ? 'Success' : 'Failed'} (${result.outcome.rule})`,
    result.outcome.message || '',
    '',
    responseHeaders || '(no response headers)',
    '',
    responseBody || '(empty response)',
    result.response.truncated ? '\n[Response truncated at 1 MB]' : ''
  ].filter((line, index) => line || index >= 3).join('\n');
}

function renderFormModuleList() {
  const container = $('#formModuleRows');
  if (!container) return;
  const search = state.formBuilderSearch.trim().toLowerCase();
  const modules = configModules.filter((module) => (
    !search ||
    module.name.toLowerCase().includes(search) ||
    module.description.toLowerCase().includes(search) ||
    module.key.toLowerCase().includes(search)
  ));

  container.innerHTML = modules.map((module) => `
    <button type="button" class="module-list-button ${module.key === state.activeConfigModule ? 'is-active' : ''}" data-config-module="${escapeHtml(module.key)}">
      <span>
        <strong>${escapeHtml(module.name)}</strong>
        <small>${escapeHtml(module.description)}</small>
      </span>
      <em>${moduleFieldCount(module.key)}</em>
    </button>
  `).join('') || '<p class="muted module-list-empty">No modules found.</p>';
}

function renderFormDesignDrawer() {
  const canvas = $('#formDesignCanvas');
  if (!canvas) return;
  const module = configModules.find((item) => item.key === state.activeConfigModule);
  let fields = orderedFormDesignFields();
  if (state.selectedFormDesignFieldKey && !fields.some((field) => field.fieldKey === state.selectedFormDesignFieldKey)) {
    state.selectedFormDesignFieldKey = '';
  }
  const selectedField = selectedFormDesignField();
  const selectedSection = selectedField ? formDesignSectionForField(selectedField.fieldKey) : null;
  const selectedSpan = selectedField ? Number(activeFormDesignLayout().fieldSpans?.[selectedField.fieldKey] || 1) : 1;
  const selectedIndex = fields.findIndex((field) => field.fieldKey === state.selectedFormDesignFieldKey);
  const hiddenFields = fields.filter((field) => !isFormDesignFieldVisible(field));
  const visibleFields = fields.filter((field) => isFormDesignFieldVisible(field));
  const mainFields = visibleFields.filter((field) => field.tableType !== 'detail');
  const detailGroups = groupedDetailDesignFields(visibleFields);
  const allFields = fields;
  fields = mainFields;
  $('#formDesignTitle').textContent = `Form Design - ${module?.name || titleCaseMessage(state.activeConfigModule)}`;
  $$('[data-form-design-type]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.formDesignType === state.activeFormDesignType);
  });
  const source = $('#copyFormDesignSource');
  if (source) {
    source.value = formDesignTypes.find((type) => type !== state.activeFormDesignType) || 'add';
    Array.from(source.options).forEach((option) => {
      option.disabled = option.value === state.activeFormDesignType;
    });
  }
  canvas.innerHTML = `
    <div class="form-design-actionbar">
      <div>
        <strong id="formDesignSelectedLabel">${selectedField ? escapeHtml(selectedField.label) : 'Select a field'}</strong>
        <span id="formDesignSelectedHelp">${escapeHtml(formDesignSelectedHelpText(selectedField))}</span>
      </div>
      <div class="form-design-actions">
        <button type="button" class="secondary small-button" data-design-action="add-field">Add Field</button>
        <button type="button" class="secondary small-button" data-design-action="edit-field" ${selectedField ? '' : 'disabled'}>Edit Field</button>
        <button type="button" class="secondary small-button" data-design-action="formula" ${selectedField ? '' : 'disabled'}>Formula</button>
        <button type="button" class="secondary small-button" data-design-action="field-linkage" ${selectedField ? '' : 'disabled'}>Field Linkage</button>
      </div>
    </div>
    <div class="form-layout-toolbar">
      <button type="button" class="secondary small-button" data-add-form-section>Add Section</button>
      <label>
        <span>Selected Section</span>
        <select data-selected-field-section ${selectedField && selectedField.tableType !== 'detail' ? '' : 'disabled'}>
          ${formDesignSectionOptions(selectedSection?.id || '')}
        </select>
      </label>
      <label>
        <span>Field Span</span>
        <select data-selected-field-span ${selectedField && selectedField.tableType !== 'detail' ? '' : 'disabled'}>
          ${[1, 2, 3].map((value) => `<option value="${value}" ${selectedSpan === value ? 'selected' : ''}>${value}</option>`).join('')}
        </select>
      </label>
    </div>
    <div class="form-design-workspace">
      <div class="form-design-section form-design-dropzone" data-design-dropzone="form">
        <div class="form-design-preview-card">
          <div class="form-design-section-heading">
            <strong>${escapeHtml(titleCaseMessage(state.activeFormDesignType))} Form</strong>
            <span>${mainFields.length} main fields</span>
          </div>
          ${renderFormDesignSections(fields)}
          <div class="form-design-detail-area form-design-dropzone" data-design-dropzone="form">
            <div class="form-design-section-heading">
              <strong>Detail Tables</strong>
              <span>${detailGroups.length} tables</span>
            </div>
            ${renderHiddenDetailTableInsertions(hiddenFields)}
            ${detailGroups.map(renderFormDesignDetailTable).join('') || '<p class="muted">No detail tables yet. Add a field and set Table Type to Detail Table.</p>'}
          </div>
        </div>
      </div>
      <aside class="form-design-palette" data-design-dropzone="palette">
        <div class="form-design-section-heading">
          <strong>Not On Form</strong>
          <span>${hiddenFields.length} fields</span>
        </div>
        <div class="form-design-palette-groups">
          ${renderHiddenFormDesignGroups(hiddenFields)}
        </div>
      </aside>
    </div>
  `;
}

function fieldLinkageConfig(field) {
  return field?.lookupConfig || {};
}

function fieldLinkageSourceRows(config = {}) {
  const rows = Array.isArray(config.sourceTables) && config.sourceTables.length
    ? config.sourceTables
    : [{ moduleKey: config.sourceModule || state.activeConfigModule, tableName: config.sourceTable || activeModuleKeyBase(), alias: 'a' }];
  return rows.map((row, index) => ({
    moduleKey: row.moduleKey || config.sourceModule || state.activeConfigModule,
    tableName: row.tableName || '',
    alias: row.alias || String.fromCharCode(97 + index)
  }));
}

function fieldLinkageJoinRows(config = {}) {
  return Array.isArray(config.sourceJoins) && config.sourceJoins.length
    ? config.sourceJoins
    : [{ leftField: '', operator: '=', rightField: '' }];
}

function fieldLinkageMappingRows(config = {}) {
  return Array.isArray(config.fieldMappings) && config.fieldMappings.length
    ? config.fieldMappings
    : [{ sourceField: '', targetField: '', coerceType: 'auto' }];
}

function renderFieldLinkageTriggerOptions(selected = '') {
  return activeConfigFields().map((field) => (
    `<option value="${escapeHtml(field.fieldKey)}" ${field.fieldKey === selected ? 'selected' : ''}>${escapeHtml(field.label)}</option>`
  )).join('');
}

function fieldLinkageTargetLabel(field) {
  const keys = [field.fieldKey, field.dataKey].filter(Boolean);
  const suffix = keys.length ? ` (${keys.join(' / ')})` : '';
  return `${field.label}${suffix}`;
}

function resolveLinkedTargetFieldKey(targetField) {
  const field = activeConfigFields().find((item) => (
    item.fieldKey === targetField || item.dataKey === targetField
  ));
  return field?.fieldKey || targetField;
}

function renderFieldLinkageTargetOptions(selected = '') {
  return activeConfigFields().map((field) => {
    const isSelected = field.fieldKey === selected || field.dataKey === selected;
    return `<option value="${escapeHtml(field.fieldKey)}" ${isSelected ? 'selected' : ''}>${escapeHtml(fieldLinkageTargetLabel(field))}</option>`;
  }).join('');
}

function renderFieldLinkageRows(rows, type) {
  if (type === 'source') {
    return rows.map((row) => `
      <tr data-linkage-source-row>
        <td><input name="sourceModule" value="${escapeHtml(row.moduleKey || '')}" placeholder="${escapeHtml(state.activeConfigModule)}"></td>
        <td><input name="sourceTable" value="${escapeHtml(row.tableName || '')}" placeholder="customers"></td>
        <td><input name="sourceAlias" value="${escapeHtml(row.alias || '')}" placeholder="a"></td>
        <td><button type="button" class="link-button danger-link" data-remove-linkage-row>Remove</button></td>
      </tr>
    `).join('');
  }
  if (type === 'join') {
    return rows.map((row) => `
      <tr data-linkage-join-row>
        <td><input name="joinLeftField" value="${escapeHtml(row.leftField || '')}" placeholder="a.id"></td>
        <td>
          <select name="joinOperator">
            ${['=', '<>', '>', '>=', '<', '<='].map((operator) => `<option value="${escapeHtml(operator)}" ${operator === (row.operator || '=') ? 'selected' : ''}>${escapeHtml(operator)}</option>`).join('')}
          </select>
        </td>
        <td><input name="joinRightField" value="${escapeHtml(row.rightField || '')}" placeholder="b.mainid"></td>
        <td><button type="button" class="link-button danger-link" data-remove-linkage-row>Remove</button></td>
      </tr>
    `).join('');
  }
  return rows.map((row) => `
    <tr data-linkage-mapping-row>
      <td><input name="mappingSourceField" value="${escapeHtml(row.sourceField || '')}" placeholder="a.name"></td>
      <td>
        <select name="mappingTargetField">
          <option value="">Select field</option>
          ${renderFieldLinkageTargetOptions(row.targetField)}
          <option value="__lookupDisplay" ${row.targetField === '__lookupDisplay' ? 'selected' : ''}>Lookup Display</option>
          <option value="__dialCodeDisplay" ${row.targetField === '__dialCodeDisplay' ? 'selected' : ''}>Dial Code Display</option>
        </select>
      </td>
      <td>
        <select name="mappingCoerceType">
          ${['auto', 'text', 'number', 'integer', 'boolean', 'date'].map((typeValue) => `<option value="${typeValue}" ${typeValue === (row.coerceType || 'auto') ? 'selected' : ''}>${titleCaseMessage(typeValue)}</option>`).join('')}
        </select>
      </td>
      <td><button type="button" class="link-button danger-link" data-remove-linkage-row>Remove</button></td>
    </tr>
  `).join('');
}

function renderFieldLinkageModal(field) {
  const form = $('#fieldLinkageForm');
  if (!form || !field) return;
  const config = fieldLinkageConfig(field);
  const triggerField = config.triggerField || field.fieldKey;
  state.editingFieldLinkageFieldKey = field.fieldKey;
  form.elements.fieldKey.value = field.fieldKey;
  form.elements.triggerField.innerHTML = renderFieldLinkageTriggerOptions(triggerField);
  form.elements.triggerCondition.value = config.triggerCondition || 'on_change';
  form.elements.primaryKeyField.value = config.primaryKeyField || '';
  form.elements.sourceWhere.value = config.sourceWhere || '';
  form.elements.clearOnEmpty.checked = config.clearOnEmpty !== false;
  $('#fieldLinkageTitle').textContent = `Field Linkage - ${field.label}`;
  $('#fieldLinkageSourceRows').innerHTML = renderFieldLinkageRows(fieldLinkageSourceRows(config), 'source');
  $('#fieldLinkageJoinRows').innerHTML = renderFieldLinkageRows(fieldLinkageJoinRows(config), 'join');
  $('#fieldLinkageMappingRows').innerHTML = renderFieldLinkageRows(fieldLinkageMappingRows(config), 'mapping');
}

function openFieldLinkageModal(fieldKey = state.selectedFormDesignFieldKey) {
  const field = findConfigField(fieldKey);
  if (!field) return;
  renderFieldLinkageModal(field);
  $('#fieldLinkageModal').hidden = false;
  document.body.classList.add('modal-open');
}

function closeFieldLinkageModal() {
  const modal = $('#fieldLinkageModal');
  if (!modal) return;
  resetModalFullscreen(modal);
  modal.hidden = true;
  state.editingFieldLinkageFieldKey = '';
  if ($('#formDesignDrawer')?.hidden !== false) {
    document.body.classList.remove('modal-open');
  }
}

function addFieldLinkageRow(type) {
  const rowMap = {
    source: ['#fieldLinkageSourceRows', renderFieldLinkageRows([{ moduleKey: state.activeConfigModule, tableName: '', alias: '' }], 'source')],
    join: ['#fieldLinkageJoinRows', renderFieldLinkageRows([{ leftField: '', operator: '=', rightField: '' }], 'join')],
    mapping: ['#fieldLinkageMappingRows', renderFieldLinkageRows([{ sourceField: '', targetField: '', coerceType: 'auto' }], 'mapping')]
  };
  const [selector, html] = rowMap[type] || [];
  if (selector) $(selector).insertAdjacentHTML('beforeend', html);
}

function collectFieldLinkageConfig(form) {
  const sourceTables = $$('#fieldLinkageSourceRows [data-linkage-source-row]').map((row, index) => ({
    moduleKey: row.querySelector('[name="sourceModule"]').value.trim(),
    tableName: row.querySelector('[name="sourceTable"]').value.trim(),
    alias: row.querySelector('[name="sourceAlias"]').value.trim() || String.fromCharCode(97 + index)
  })).filter((row) => row.tableName);
  const sourceJoins = $$('#fieldLinkageJoinRows [data-linkage-join-row]').map((row) => ({
    leftField: row.querySelector('[name="joinLeftField"]').value.trim(),
    operator: row.querySelector('[name="joinOperator"]').value,
    rightField: row.querySelector('[name="joinRightField"]').value.trim()
  })).filter((row) => row.leftField && row.rightField);
  const fieldMappings = $$('#fieldLinkageMappingRows [data-linkage-mapping-row]').map((row) => ({
    sourceField: row.querySelector('[name="mappingSourceField"]').value.trim(),
    targetField: resolveLinkedTargetFieldKey(row.querySelector('[name="mappingTargetField"]').value),
    coerceType: row.querySelector('[name="mappingCoerceType"]').value
  })).filter((row) => row.sourceField && row.targetField);
  const field = findConfigField(form.elements.fieldKey.value);
  return {
    browserButtonKey: field?.lookupConfig?.browserButtonKey || '',
    triggerField: form.elements.triggerField.value,
    triggerCondition: form.elements.triggerCondition.value,
    sourceModule: sourceTables[0]?.moduleKey || state.activeConfigModule,
    sourceTable: sourceTables[0]?.tableName || '',
    sourceTables,
    sourceJoins,
    primaryKeyField: form.elements.primaryKeyField.value.trim(),
    sourceWhere: form.elements.sourceWhere.value.trim(),
    clearOnEmpty: form.elements.clearOnEmpty.checked,
    fieldMappings
  };
}

function coerceLinkedValue(value, type = 'auto') {
  if (value === undefined || value === null) return '';
  if (type === 'number') return Number(value);
  if (type === 'integer') return parseInt(value, 10);
  if (type === 'boolean') return ['true', '1', 'yes', 'y'].includes(String(value).toLowerCase());
  return value;
}

function openFormDesignDrawer() {
  state.activeFormDesignType = state.activeFormDesignType || 'add';
  renderFieldConfig();
  renderFormDesignDrawer();
  $('#formDesignDrawer').hidden = false;
  document.body.classList.add('modal-open');
}

function closeFormDesignDrawer() {
  const drawer = $('#formDesignDrawer');
  if (!drawer) return;
  resetModalFullscreen(drawer);
  state.draggingFormDesignFieldKey = '';
  state.dragOverFormDesignFieldKey = '';
  state.draggingFormDesignDetailTable = '';
  state.dragOverFormDesignDetailTable = '';
  drawer.hidden = true;
  document.body.classList.remove('modal-open');
}

function versionHistoryDate(value) {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function renderVersionHistory() {
  const list = $('#versionHistoryList');
  if (!list) return;
  const module = configModules.find((item) => item.key === state.activeConfigModule);
  $('#versionHistoryTitle').textContent = `Version History - ${module?.name || titleCaseMessage(state.activeConfigModule)}`;
  if (state.configHistoryLoading) {
    list.innerHTML = '<div class="version-history-empty">Loading version history...</div>';
    return;
  }
  const versions = state.configHistory?.versions || [];
  $('#versionHistoryCount').textContent = `${versions.length} version${versions.length === 1 ? '' : 's'}`;
  list.innerHTML = versions.map((version, index) => {
    const isLatest = index === 0;
    const author = version.createdBy?.name || version.createdBy?.email || 'System';
    return `
      <article class="version-timeline-item ${isLatest ? 'is-current' : ''}">
        <span class="version-timeline-marker" aria-hidden="true"></span>
        <div class="version-timeline-card">
          <div class="version-timeline-heading">
            <div><strong>Version ${version.versionNumber}</strong>${isLatest ? '<span class="status-pill status-live">Latest</span>' : ''}</div>
            <time>${escapeHtml(versionHistoryDate(version.createdAt))}</time>
          </div>
          <p>${escapeHtml(version.summary || 'Saved configuration checkpoint')}</p>
          <div class="version-timeline-meta"><span>${escapeHtml(author)}</span><span>${escapeHtml(titleCaseMessage(String(version.action || 'version').replaceAll('.', ' ')))}</span></div>
          ${isLatest ? '' : `<div class="form-actions end-actions"><button type="button" class="secondary" data-restore-config-version="${version.id}" data-version-number="${version.versionNumber}">Restore as New Version</button></div>`}
        </div>
      </article>`;
  }).join('') || '<div class="version-history-empty"><strong>No saved versions yet.</strong><span>Add a remark and save the current configuration as your first checkpoint.</span></div>';
}

async function loadConfigHistory() {
  state.configHistoryLoading = true;
  renderVersionHistory();
  try {
    state.configHistory = await api(`/api/sysadmin/modules/${encodeURIComponent(state.activeConfigModule)}/config-history`);
  } finally {
    state.configHistoryLoading = false;
    renderVersionHistory();
  }
}

async function openVersionHistoryDrawer() {
  state.configHistory = null;
  $('#versionHistoryRemark').value = '';
  $('#versionHistoryDrawer').hidden = false;
  document.body.classList.add('modal-open');
  await loadConfigHistory();
}

function closeVersionHistoryDrawer() {
  const drawer = $('#versionHistoryDrawer');
  if (!drawer) return;
  resetModalFullscreen(drawer);
  drawer.hidden = true;
  document.body.classList.remove('modal-open');
}

async function createConfigVersionCheckpoint() {
  const remark = $('#versionHistoryRemark').value.trim();
  const button = $('#createConfigVersionButton');
  button.disabled = true;
  try {
    state.configHistory = await api(`/api/sysadmin/modules/${encodeURIComponent(state.activeConfigModule)}/config-history/versions`, {
      method: 'POST', body: JSON.stringify({ remark })
    });
    $('#versionHistoryRemark').value = '';
    renderVersionHistory();
    toast('Configuration Version Saved.');
  } finally {
    button.disabled = false;
  }
}

async function restoreConfigVersion(versionId, versionNumber) {
  const confirmed = await showConfirmationModal({
    title: `Restore Version ${versionNumber}`,
    message: 'Restore this snapshot as a new version? Existing history will be kept.',
    confirmLabel: 'Restore Version'
  });
  if (!confirmed) return;
  const remark = $('#versionHistoryRemark').value.trim();
  await api(`/api/sysadmin/modules/${encodeURIComponent(state.activeConfigModule)}/config-history/${encodeURIComponent(versionId)}/rollback`, {
    method: 'POST', body: JSON.stringify({ remark })
  });
  await refreshAdminModules();
  renderFieldConfig();
  await loadConfigHistory();
  $('#versionHistoryRemark').value = '';
  toast(`Version ${versionNumber} Restored As A New Version.`);
}

function activeConfigFields() {
  if (state.activeConfigModule === 'users') return state.userFields;
  if (state.activeConfigModule === 'customers') return state.customerFields;
  return moduleConfigByKey(state.activeConfigModule)?.fields || [];
}

function findConfigField(fieldKey) {
  return activeConfigFields().find((field) => field.fieldKey === fieldKey);
}

function clearFieldConfigForm() {
  const form = $('#fieldConfigForm');
  form.reset();
  form.elements.fieldKey.value = '';
  form.elements.type.innerHTML = renderFieldTypeOptions('textbox', false);
  form.elements.dataKeyPreview.value = '';
  form.elements.databaseFieldName.value = '';
  form.elements.dataKeyPreview.readOnly = false;
  form.elements.tableType.value = 'main';
  form.elements.detailTableName.value = '';
  form.elements.browserButtonKey.innerHTML = renderBrowserButtonOptions();
  form.elements.type.disabled = false;
  form.elements.tableType.disabled = false;
  form.elements.label.disabled = false;
  form.elements.showInTable.checked = true;
  form.elements.showInForm.checked = true;
  form.elements.showInImport.checked = false;
  form.elements.required.checked = false;
  form.elements.validationMinLength.value = '';
  form.elements.validationMaxLength.value = '';
  form.elements.validationMinValue.value = '';
  form.elements.validationMaxValue.value = '';
  form.elements.validationRegex.value = '';
  form.elements.conditionalRequiredField.innerHTML = renderConditionalRequiredOptions();
  form.elements.conditionalRequiredValue.value = '';
  form.elements.validationUnique.checked = false;
  form.elements.showInForm.disabled = false;
  form.elements.required.disabled = false;
  state.editingFieldKey = '';
  $('#fieldConfigFormTitle').textContent = 'Add Field';
  $('#saveFieldConfigButton').textContent = 'Add Field';
  $('#clearFieldConfigForm').hidden = false;
  $('#deleteFieldConfigButton').hidden = true;
  syncFieldConfigTypeRows();
}

function openFieldConfigModal(field = null) {
  clearFieldConfigForm();
  if (field) {
    const form = $('#fieldConfigForm');
    state.editingFieldKey = field.fieldKey;
    form.elements.fieldKey.value = field.fieldKey;
    form.elements.label.value = field.label;
    form.elements.dataKeyPreview.value = field.fieldKey;
    form.elements.databaseFieldName.value = field.dataKey || field.fieldKey;
    form.elements.dataKeyPreview.readOnly = true;
    form.elements.tableType.value = field.tableType || 'main';
    form.elements.detailTableName.value = field.detailTableName || '';
    form.elements.type.innerHTML = renderFieldTypeOptions(field.type);
    form.elements.type.value = field.type;
    form.elements.options.value = (field.options || []).join(', ');
    form.elements.browserButtonKey.innerHTML = renderBrowserButtonOptions(field.lookupConfig?.browserButtonKey || '');
    form.elements.showInTable.checked = field.showInTable;
    form.elements.showInForm.checked = field.showInForm;
    form.elements.showInImport.checked = field.showInImport;
    form.elements.required.checked = field.required;
    form.elements.validationMinLength.value = field.validationRules?.minLength ?? '';
    form.elements.validationMaxLength.value = field.validationRules?.maxLength ?? '';
    form.elements.validationMinValue.value = field.validationRules?.minValue ?? '';
    form.elements.validationMaxValue.value = field.validationRules?.maxValue ?? '';
    form.elements.validationRegex.value = field.validationRules?.regex || '';
    form.elements.conditionalRequiredField.innerHTML = renderConditionalRequiredOptions(field.validationRules?.conditionalRequiredField || '', field.fieldKey);
    form.elements.conditionalRequiredValue.value = field.validationRules?.conditionalRequiredValue || '';
    form.elements.validationUnique.checked = Boolean(field.validationRules?.unique);
    form.elements.type.disabled = field.locked;
    form.elements.tableType.disabled = field.locked;
    form.elements.showInForm.disabled = false;
    form.elements.required.disabled = false;
    $('#fieldConfigFormTitle').textContent = 'Edit Field';
    $('#saveFieldConfigButton').textContent = 'Save Field';
    $('#clearFieldConfigForm').hidden = true;
    $('#deleteFieldConfigButton').hidden = field.locked;
  }
  syncFieldConfigTypeRows();
  $('#fieldConfigModal').hidden = false;
  document.body.classList.add('modal-open');
  $('#fieldConfigForm [name="label"]').focus();
}

function closeFieldConfigModal() {
  const modal = $('#fieldConfigModal');
  if (!modal) return;
  resetModalFullscreen(modal);
  modal.classList.remove('is-over-drawer');
  modal.hidden = true;
  if ($('#formDesignDrawer')?.hidden !== false) {
    document.body.classList.remove('modal-open');
  }
}

function setModuleConfig(moduleKey, fields, formLayouts = null) {
  if (formLayouts) {
    writeFormDesignLayouts(formLayouts, moduleKey);
  }
  if (moduleKey === 'users') {
    state.userFields = fields;
    renderUserFormFields();
    renderUsers();
  } else if (moduleKey === 'customers') {
    state.customerFields = fields;
    renderCustomerFormFields();
    renderCustomers();
  } else {
    const config = moduleConfigByKey(moduleKey);
    if (config) {
      config.fields = fields;
      config.formLayouts = formLayouts || config.formLayouts;
    }
  }
  renderFieldConfig();
  if (!$('#formDesignDrawer')?.hidden) {
    renderFormDesignDrawer();
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function titleCaseMessage(message) {
  const acronyms = new Set(['api', 'crm', 'jwt', 'url', 'id', 'excel']);
  return String(message || '')
    .split(' ')
    .map((word) => {
      const lower = word.toLowerCase();
      const letters = lower.replace(/[^a-z0-9]/g, '');
      if (acronyms.has(letters)) {
        return word.replace(/[a-z0-9]+/i, letters.toUpperCase());
      }
      return word.replace(/[a-z]/i, (match) => match.toUpperCase());
    })
    .join(' ');
}

function formatImportResult(result, refreshFailed = false) {
  const lines = [
    `Created: ${result.createdCount}`,
    `Errors: ${result.errorCount}`
  ];

  if (result.errors?.length) {
    lines.push('', 'Rows with errors:');
    result.errors.forEach((error) => {
      lines.push(`Row ${error.row}: ${error.message}`);
    });
  }

  if (refreshFailed) {
    lines.push('', 'Import Completed, But The Customer Table Could Not Refresh Automatically. Please Close This Popup And Refresh The Page.');
  }

  return lines.join('\n');
}

async function loadBootstrap() {
  const [countries, users, customerConfig, userConfig, browserButtons, adminModules, publishedModules, departments] = await Promise.all([
    api('/api/countries'),
    api('/api/users').catch((error) => {
      if (state.user?.role === 'admin') throw error;
      return { users: [] };
    }),
    api('/api/customers/config'),
    api('/api/users/config').catch((error) => {
      if (state.user?.role === 'admin') throw error;
      return { fields: [] };
    }),
    api(state.user?.role === 'admin' ? '/api/sysadmin/browser-buttons' : '/api/browser-buttons'),
    state.user?.role === 'admin' ? api('/api/sysadmin/modules') : Promise.resolve({ modules: [] }),
    api('/api/modules').catch(() => ({ modules: [] })),
    state.user?.role === 'admin' ? api('/api/departments') : Promise.resolve({ nodes: [] })
  ]);

  state.countries = countries.countries;
  state.users = users.users;
  state.browserButtons = browserButtons.browserButtons || [];
  state.adminModules = adminModules.modules || [];
  state.publishedModules = publishedModules.modules || [];
  state.departmentNodes = departments.nodes || [];
  syncConfigModuleCatalog();
  state.customerFields = customerConfig.fields;
  state.customerPermissions = customerConfig.permissions || {};
  state.userFields = userConfig.fields;
  rememberModuleConfig('customers', customerConfig);
  rememberModuleConfig('users', userConfig);
  renderCountries();
  renderUsers();
  renderOwners();
  renderUserFormFields();
  renderAdminModules();
  renderAdminModulePages();
  renderPublishedModuleNav();
  renderBrowserSources();
  renderBrowserButtons();
  renderFieldConfig();
  syncCustomerModuleActions();
  await loadCustomers();
}

async function loadCustomers() {
  const params = new URLSearchParams({
    search: $('#customerSearch').value,
    status: $('#statusFilter').value
  });
  const payload = await api(`/api/customers?${params.toString()}`);
  state.customers = payload.customers;
  const visibleIds = new Set(state.customers.map((customer) => customer.id));
  state.selectedCustomerIds.forEach((id) => {
    if (!visibleIds.has(id)) {
      state.selectedCustomerIds.delete(id);
    }
  });
  renderCustomers();
}

function clearCustomerForm() {
  state.activeCustomerFormType = 'add';
  $('#customerForm').reset();
  $('#customerForm [name="id"]').value = '';
  $('#customerFormTitle').textContent = 'Add Customer';
  renderCustomerFormFields();
}

function syncCustomerModuleActions() {
  const canCreate = state.customerPermissions.create !== false;
  const canImport = state.customerPermissions.import !== false;
  const canExport = state.customerPermissions.export !== false;
  $('#addCustomerButton').hidden = !canCreate;
  $('#openImportButton').hidden = !canImport;
  $('#exportCustomersButton').hidden = !canExport;
  $('#deleteCustomersButton').hidden = state.customerPermissions.delete === false;
}

function openCustomerModal() {
  $('#customerModal').hidden = false;
  document.body.classList.add('modal-open');
  $('#customerFormFields input, #customerFormFields select, #customerFormFields textarea')?.focus();
}

function closeCustomerModal() {
  const modal = $('#customerModal');
  if (!modal) return;
  resetModalFullscreen(modal);
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

function openImportModal() {
  $('#importResult').hidden = true;
  $('#importResult').textContent = '';
  $('#importModal').hidden = false;
  document.body.classList.add('modal-open');
  $('#importForm [name="file"]').focus();
}

function closeImportModal() {
  const modal = $('#importModal');
  if (!modal) return;
  resetModalFullscreen(modal);
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

async function downloadCustomerExport() {
  try {
    const response = await fetch('/api/imports/customers/export', {
      headers: { Authorization: `Bearer ${await currentAuthToken()}` }
    });
    if (!response.ok) throw new Error('Unable To Download Export');
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'crm-customers-export.xlsx';
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (error) {
    toast(titleCaseMessage(error.message), 'error');
  }
}

async function openDeleteCustomerModal() {
  const ids = selectedCustomerIds();
  if (!ids.length) {
    toast('Select At Least One Customer To Delete.', 'error');
    return;
  }

  const confirmed = await showConfirmationModal({
    title: `Delete Customer${ids.length === 1 ? '' : 's'}`,
    message: `Delete ${ids.length} selected customer${ids.length === 1 ? '' : 's'}? This cannot be undone.`,
    confirmLabel: `Delete Customer${ids.length === 1 ? '' : 's'}`
  });
  if (!confirmed) return;
  try {
    const result = await api('/api/customers', { method: 'DELETE', body: JSON.stringify({ ids }) });
    state.selectedCustomerIds.clear();
    await loadCustomers();
    toast(`Deleted ${result.deletedCount} Customer${result.deletedCount === 1 ? '' : 's'}.`);
  } catch (error) {
    toast(titleCaseMessage(error.message), 'error');
  }
}

function clearUserForm() {
  const form = $('#userForm');
  state.activeUserFormType = 'add';
  form.reset();
  form.elements.id.value = '';
  renderUserFormFields();
  $('#userFormTitle').textContent = 'Add User';
  $('#saveUserButton').textContent = 'Create User';
}

function openUserModal() {
  $('#userModal').hidden = false;
  document.body.classList.add('modal-open');
  $('#userFormFields input, #userFormFields select, #userFormFields textarea')?.focus();
}

function closeUserModal() {
  const modal = $('#userModal');
  if (!modal) return;
  resetModalFullscreen(modal);
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

function editCustomer(id) {
  const customer = state.customers.find((item) => item.id === id);
  if (!customer) return;

  const form = $('#customerForm');
  state.activeCustomerFormType = 'edit';
  form.elements.id.value = customer.id;
  renderCustomerFormFields(customer);
  $('#customerFormTitle').textContent = 'Edit Customer';
  openCustomerModal();
}

function editUser(id) {
  const user = state.users.find((item) => item.id === id);
  if (!user) return;

  const form = $('#userForm');
  state.activeUserFormType = 'edit';
  form.elements.id.value = user.id;
  renderUserFormFields(user);
  $('#userFormTitle').textContent = 'Edit User';
  $('#saveUserButton').textContent = 'Save User';
  openUserModal();
}

async function refreshCustomerConfig() {
  const config = await api('/api/customers/config');
  setModuleConfig('customers', config.fields, config.formLayouts);
  state.customerPermissions = config.permissions || {};
  syncCustomerModuleActions();
}

async function refreshModuleConfig(moduleKey) {
  const config = await api(`/api/${moduleKey}/config`);
  setModuleConfig(moduleKey, config.fields, config.formLayouts);
}

function customerFormData(form) {
  const data = serializeForm(form);
  mainFormFields().forEach((field) => {
    if (field.type === 'checkbox') {
      data[field.fieldKey] = Boolean(form.elements[field.fieldKey]?.checked);
    }
  });
  data.__detailTables = {};
  form.querySelectorAll('[data-detail-table-section]').forEach((section) => {
    const tableName = section.dataset.detailTableSection;
    const rows = [];
    section.querySelectorAll('[data-detail-row]').forEach((row) => {
      const values = {};
      row.querySelectorAll('[data-detail-field]').forEach((input) => {
        if (input.disabled) return;
        values[input.dataset.detailField] = input.type === 'checkbox' ? input.checked : input.value;
      });
      rows.push(values);
    });
    data.__detailTables[tableName] = rows;
  });
  return data;
}

function userFormData(form) {
  const data = serializeForm(form);
  data.organizationNodeId = data.organizationNodeId ? Number(data.organizationNodeId) : null;
  if (data.password) {
    data.password = data.password.trim();
  }
  if (data.confirmPassword) {
    data.confirmPassword = data.confirmPassword.trim();
  }
  userFormFields().forEach((field) => {
    if (field.type === 'checkbox') {
      data[field.fieldKey] = Boolean(form.elements[field.fieldKey]?.checked);
    }
  });
  return data;
}

function setAuthHelp(message = '') {
  const help = $('#authHelpText');
  if (help) help.textContent = message;
}

function configureAuthUi() {
  $('#localLoginFields').hidden = false;
  setAuthHelp('');
}

function bindEvents() {
  $('#loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const rememberMe = Boolean(event.currentTarget.elements.rememberMe?.checked);
    try {
      const result = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          ...serializeForm(event.currentTarget),
          rememberMe
        })
      });
      setSession(result.token, result.user, rememberMe);
      showView('customersView');
      await loadBootstrap();
      toast('Signed In.');
    } catch (error) {
      toast(titleCaseMessage(error.message), 'error');
    }
  });

  $('#logoutButton').addEventListener('click', () => {
    clearSession();
    configureAuthUi();
  });

  $('#templateLink').addEventListener('click', async (event) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/imports/customers/template', {
        headers: { Authorization: `Bearer ${await currentAuthToken()}` }
      });
      if (!response.ok) throw new Error('Unable To Download Template');
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'crm-customer-import-template.xlsx';
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      toast(titleCaseMessage(error.message), 'error');
    }
  });

  $$('.nav-button').forEach((button) => {
    button.addEventListener('click', () => {
      if (!state.token) return showView('loginView');
      showView(button.dataset.view);
    });
  });
  $('#publishedModuleNav')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-module-view]');
    if (!button || !state.token) return;
    openRuntimeModulePage(button.dataset.moduleView)
      .catch((error) => toast(titleCaseMessage(error.message), 'error'));
  });

  $$('.admin-section-button').forEach((button) => {
    button.addEventListener('click', async () => {
      showAdminSection(button.dataset.adminSection);
      if (button.dataset.adminSection === 'adminModulesSection') {
        try {
          await refreshAdminModules();
        } catch (error) {
          toast(titleCaseMessage(error.message), 'error');
        }
      }
      if (button.dataset.adminSection === 'adminPagesSection') {
        try {
          await refreshAdminModules();
        } catch (error) {
          toast(titleCaseMessage(error.message), 'error');
        }
      }
      if (button.dataset.adminSection === 'adminBrowserButtonsSection') {
        try {
          await refreshBrowserButtons();
        } catch (error) {
          toast(titleCaseMessage(error.message), 'error');
        }
      }
      if (button.dataset.adminSection === 'adminApiSection') {
        try {
          await refreshApiConnectors();
        } catch (error) {
          toast(titleCaseMessage(error.message), 'error');
        }
      }
      if (button.dataset.adminSection === 'adminDepartmentsSection') {
        try {
          await loadDepartmentHierarchy();
        } catch (error) {
          toast(titleCaseMessage(error.message), 'error');
        }
      }
    });
  });
  $('#departmentTree')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-department-node]');
    if (!button) return;
    state.activeDepartmentNodeId = Number(button.dataset.departmentNode);
    renderDepartmentWorkspace();
  });
  $('#departmentRows')?.addEventListener('click', (event) => {
    const edit = event.target.closest('[data-edit-department-node]');
    const remove = event.target.closest('[data-delete-department-node]');
    if (edit) openDepartmentNodeModal(Number(edit.dataset.editDepartmentNode));
    if (remove) deleteDepartmentNode(Number(remove.dataset.deleteDepartmentNode)).catch((error) => toast(titleCaseMessage(error.message), 'error'));
  });
  $('#newDepartmentNodeButton')?.addEventListener('click', () => openDepartmentNodeModal(0, 'department'));
  $('#newGroupNodeButton')?.addEventListener('click', () => openDepartmentNodeModal(0, 'group'));
  $('#closeDepartmentNodeModal')?.addEventListener('click', closeDepartmentNodeModal);
  $('#cancelDepartmentNodeModal')?.addEventListener('click', closeDepartmentNodeModal);
  $('#departmentNodeModal')?.addEventListener('click', (event) => { if (event.target === event.currentTarget) closeDepartmentNodeModal(); });
  $('#departmentNodeForm')?.addEventListener('submit', (event) => saveDepartmentNode(event).catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#departmentNodeForm select[name="type"]')?.addEventListener('change', (event) => {
    if (!$('#departmentNodeForm').elements.id.value) $('#departmentNodeFormTitle').textContent = `New ${titleCaseMessage(event.target.value)}`;
  });
  $('#importDepartmentsButton')?.addEventListener('click', () => $('#departmentImportFile').click());
  $('#departmentImportFile')?.addEventListener('change', (event) => {
    const file = event.currentTarget.files?.[0];
    if (file) importDepartments(file).catch((error) => toast(titleCaseMessage(error.message), 'error'));
    event.currentTarget.value = '';
  });
  $('#downloadDepartmentTemplate')?.addEventListener('click', (event) => {
    event.preventDefault();
    downloadDepartmentTemplate().catch((error) => toast(titleCaseMessage(error.message), 'error'));
  });
  $('#toggleAdminMenu').addEventListener('click', toggleAdminMenu);
  $('#addFormBuilderButton')?.addEventListener('click', openFormBuilderCreateModal);
  $('#closeFormBuilderCreateModal')?.addEventListener('click', closeFormBuilderCreateModal);
  $('#cancelFormBuilderCreateButton')?.addEventListener('click', closeFormBuilderCreateModal);
  $('#formBuilderCreateModal')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeFormBuilderCreateModal();
  });
  $('#formBuilderCreateForm')?.addEventListener('submit', (event) => {
    saveFormBuilderCreate(event).catch((error) => toast(titleCaseMessage(error.message), 'error'));
  });
  $('#formBuilderCreateForm [name="formType"]')?.addEventListener('change', syncFormBuilderCreateFields);
  $('#formBuilderCreateForm [name="name"]')?.addEventListener('input', (event) => {
    const form = $('#formBuilderCreateForm');
    if (form.dataset.formKeyEdited === 'true') return;
    form.elements.formKey.value = slugFormKeyPreview(event.currentTarget.value);
  });
  $('#formBuilderCreateForm [name="formKey"]')?.addEventListener('input', (event) => {
    const form = $('#formBuilderCreateForm');
    form.dataset.formKeyEdited = 'true';
    event.currentTarget.value = slugFormKeyPreview(event.currentTarget.value);
  });
  $('#newModuleButton')?.addEventListener('click', () => openModuleModal());
  $('#closeModuleModal')?.addEventListener('click', closeModuleModal);
  $('#cancelModuleButton')?.addEventListener('click', closeModuleModal);
  $('#moduleForm')?.addEventListener('submit', (event) => {
    saveModule(event).catch((error) => toast(titleCaseMessage(error.message), 'error'));
  });
  $('#moduleModal')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeModuleModal();
  });
  $('#moduleForm [name="name"]')?.addEventListener('input', (event) => {
    const form = $('#moduleForm');
    if (form.elements.editingModuleKey.value || form.dataset.moduleKeyEdited === 'true') return;
    form.elements.moduleKey.value = slugModuleKeyPreview(event.target.value);
  });
  $('#moduleForm [name="moduleKey"]')?.addEventListener('input', (event) => {
    $('#moduleForm').dataset.moduleKeyEdited = 'true';
    event.target.value = slugModuleKeyPreview(event.target.value);
  });
  $('#moduleForm [name="status"]')?.addEventListener('change', (event) => {
    if (event.target.value !== 'published') {
      $('#moduleForm').elements.showInMenu.checked = false;
    }
  });
  $('#moduleBuilderRows')?.addEventListener('click', (event) => {
    const fieldsButton = event.target.closest('[data-edit-module-fields]');
    if (fieldsButton) {
      state.activeConfigModule = fieldsButton.dataset.editModuleFields;
      showAdminSection('adminFormsSection');
      renderFieldConfig();
      return;
    }
    const editButton = event.target.closest('[data-edit-module]');
    if (editButton) {
      openModuleModal(editButton.dataset.editModule);
      return;
    }
    const deleteButton = event.target.closest('[data-delete-module]');
    if (deleteButton) {
      deleteModule(deleteButton.dataset.deleteModule)
        .catch((error) => toast(titleCaseMessage(error.message), 'error'));
    }
  });
  $('#modulePageSearch')?.addEventListener('input', (event) => {
    state.modulePageSearch = event.currentTarget.value;
    renderAdminModulePages();
  });
  $('#modulePageRows')?.addEventListener('click', (event) => {
    const openButton = event.target.closest('[data-open-module-page]');
    if (openButton) {
      showView(openButton.dataset.openModulePage);
      return;
    }
    const runtimeOpenButton = event.target.closest('[data-open-runtime-module]');
    if (runtimeOpenButton) {
      openRuntimeModulePage(runtimeOpenButton.dataset.openRuntimeModule)
        .catch((error) => toast(titleCaseMessage(error.message), 'error'));
      return;
    }
    const fieldsButton = event.target.closest('[data-edit-module-fields]');
    if (fieldsButton) {
      state.activeConfigModule = fieldsButton.dataset.editModuleFields;
      showAdminSection('adminFormsSection');
      renderFieldConfig();
      return;
    }
    const permissionsButton = event.target.closest('[data-edit-page-permissions]');
    if (permissionsButton) {
      openPageViewPermissionModal(permissionsButton.dataset.editPagePermissions)
        .catch((error) => toast(titleCaseMessage(error.message), 'error'));
      return;
    }
    const editButton = event.target.closest('[data-edit-module]');
    if (editButton) {
      openModuleModal(editButton.dataset.editModule);
    }
  });
  $('#pageViewPermissionForm')?.addEventListener('submit', (event) => {
    savePageViewPermission(event);
  });
  $('#closePageViewPermissionModal')?.addEventListener('click', closePageViewPermissionModal);
  $('#cancelPageViewPermissionButton')?.addEventListener('click', closePageViewPermissionModal);
  $('#pageViewPermissionModal')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closePageViewPermissionModal();
  });
  $('#pageViewPermissionForm')?.addEventListener('input', (event) => {
    const search = event.target.closest('[data-permission-search]');
    if (search) filterPermissionPicker(search.closest('[data-permission-picker]'));
  });
  $('#pageViewPermissionForm')?.addEventListener('change', (event) => {
    const checkbox = event.target.closest('.permission-check input[type="checkbox"]');
    if (checkbox) updatePermissionPickerCount(checkbox.closest('[data-permission-picker]'));
  });
  $('#moduleRuntimeSearchButton')?.addEventListener('click', () => {
    state.moduleRuntimeSearch = $('#moduleRuntimeSearch').value;
    loadModuleRuntimeRecords().catch((error) => toast(titleCaseMessage(error.message), 'error'));
  });
  $('#moduleRuntimeSearch')?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    state.moduleRuntimeSearch = event.currentTarget.value;
    loadModuleRuntimeRecords().catch((error) => toast(titleCaseMessage(error.message), 'error'));
  });
  $('#addModuleRecordButton')?.addEventListener('click', () => openModuleRecordModal());
  $('#closeModuleRecordModal')?.addEventListener('click', closeModuleRecordModal);
  $('#cancelModuleRecordButton')?.addEventListener('click', closeModuleRecordModal);
  $('#moduleRecordModal')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeModuleRecordModal();
  });
  $('#moduleRecordForm')?.addEventListener('submit', (event) => {
    saveModuleRecord(event).catch((error) => toast(titleCaseMessage(error.message), 'error'));
  });
  $('#moduleRecordRows')?.addEventListener('click', (event) => {
    const editButton = event.target.closest('[data-edit-module-record]');
    if (editButton) {
      openModuleRecordModal(editButton.dataset.editModuleRecord);
      return;
    }
    const deleteButton = event.target.closest('[data-delete-module-record]');
    if (deleteButton) {
      deleteModuleRecord(deleteButton.dataset.deleteModuleRecord)
        .catch((error) => toast(titleCaseMessage(error.message), 'error'));
    }
  });
  $('#adminApiSection .builder-list')?.addEventListener('click', (event) => {
    const toggleButton = event.target.closest('[data-api-tree-toggle]');
    if (toggleButton) {
      const scope = toggleButton.dataset.apiTreeToggle;
      state.apiTreeExpanded[scope] = !state.apiTreeExpanded[scope];
      renderApiCategoryNavigation();
      return;
    }
    const navigationButton = event.target.closest('[data-api-tab], [data-api-category]');
    if (!navigationButton) return;
    const tab = navigationButton.dataset.apiCategoryScope || navigationButton.dataset.apiTab;
    if (navigationButton.hasAttribute('data-api-category')) state.activeApiCategory = navigationButton.dataset.apiCategory;
    state.activeApiTab = tab;
    renderApiWorkspace();
  });
  $('#apiCategorySearch')?.addEventListener('input', (event) => {
    state.apiCategorySearch = event.currentTarget.value;
    renderApiCategoryNavigation();
  });
  $('#newApiCategoryButton')?.addEventListener('click', () => openApiCategoryModal());
  $('#closeApiCategoryModal')?.addEventListener('click', closeApiCategoryModal);
  $('#cancelApiCategoryButton')?.addEventListener('click', closeApiCategoryModal);
  $('#apiCategoryModal')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeApiCategoryModal();
  });
  $('#apiCategoryForm')?.addEventListener('submit', (event) => {
    saveApiCategory(event).catch((error) => toast(titleCaseMessage(error.message), 'error'));
  });
  $('#apiCategoryRows')?.addEventListener('click', (event) => {
    const editButton = event.target.closest('[data-edit-api-category]');
    if (editButton) return openApiCategoryModal(editButton.dataset.editApiCategory);
    const deleteButton = event.target.closest('[data-delete-api-category]');
    if (deleteButton) deleteApiCategory(deleteButton.dataset.deleteApiCategory).catch((error) => toast(titleCaseMessage(error.message), 'error'));
  });
  $('#newApiConnectorButton')?.addEventListener('click', () => {
    openApiConnectorModal();
  });
  $('#newApiInterfaceButton')?.addEventListener('click', () => {
    try {
      openApiInterfaceModal();
    } catch (error) {
      toast(titleCaseMessage(error.message || 'Unable to open Interface editor.'), 'error');
    }
  });
  $('#closeApiConnectorModal')?.addEventListener('click', closeApiConnectorModal);
  $('#cancelApiConnectorButton')?.addEventListener('click', closeApiConnectorModal);
  $('#apiConnectorModal')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeApiConnectorModal();
  });
  $('#apiConnectorForm')?.addEventListener('submit', (event) => {
    saveApiConnector(event).catch((error) => toast(titleCaseMessage(error.message), 'error'));
  });
  $('#apiConnectorForm [name="name"]')?.addEventListener('input', (event) => {
    const form = event.currentTarget.form;
    if (form.elements.editingConnectorKey.value) return;
    form.elements.connectorKey.value = slugApiKeyPreview(event.currentTarget.value);
  });
  $('#apiConnectorForm [name="connectorKey"]')?.addEventListener('input', (event) => {
    event.currentTarget.value = slugApiKeyPreview(event.currentTarget.value);
  });
  $('#apiConnectorForm')?.addEventListener('change', (event) => {
    if (event.target.name === 'protocol' || event.target.name === 'authType') {
      updateApiConnectorConditionalFields();
    }
  });
  $('#apiConnectorRows')?.addEventListener('click', (event) => {
    const editButton = event.target.closest('[data-edit-api-connector]');
    if (editButton) {
      openApiConnectorModal(editButton.dataset.editApiConnector);
      return;
    }
    const deleteButton = event.target.closest('[data-delete-api-connector]');
    if (deleteButton) {
      deleteApiConnector(deleteButton.dataset.deleteApiConnector)
        .catch((error) => toast(titleCaseMessage(error.message), 'error'));
    }
  });
  $('#apiInterfaceRows')?.addEventListener('click', (event) => {
    const editButton = event.target.closest('[data-edit-api-interface]');
    if (editButton) {
      try {
        openApiInterfaceModal(editButton.dataset.interfaceConnector, editButton.dataset.editApiInterface);
      } catch (error) {
        toast(titleCaseMessage(error.message || 'Unable to open Interface editor.'), 'error');
      }
    }
  });
  $('#closeApiInterfaceModal')?.addEventListener('click', closeApiInterfaceModal);
  $('#cancelApiInterfaceButton')?.addEventListener('click', closeApiInterfaceModal);
  $('#apiInterfaceModal')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeApiInterfaceModal();
  });
  $('#apiInterfaceForm')?.addEventListener('submit', (event) => {
    saveApiInterface(event).catch((error) => toast(titleCaseMessage(error.message), 'error'));
  });
  $('#apiInterfaceForm')?.addEventListener('input', (event) => updateApiDefinitionRow(event.target));
  $('#apiInterfaceForm')?.addEventListener('change', (event) => {
    updateApiDefinitionRow(event.target);
    if (event.target.matches('[data-body-format]')) {
      state.apiInterfaceBodyFormats[event.target.dataset.bodyFormat] = event.target.value;
    }
  });
  $('#apiInterfaceForm')?.addEventListener('click', (event) => {
    const connectorButton = event.target.closest('[data-select-interface-connector]');
    if (connectorButton) {
      const form = $('#apiInterfaceForm');
      form.elements.connectorKey.value = connectorButton.dataset.selectInterfaceConnector;
      renderApiInterfaceConnectorChoices(form.elements.connectorKey.value);
      return;
    }
    const tabButton = event.target.closest('[data-definition-tab]');
    if (tabButton) {
      const scope = tabButton.closest('[data-definition-tabs]').dataset.definitionTabs;
      state.activeApiDefinitionTabs[scope] = tabButton.dataset.definitionTab;
      renderAllApiDefinitionEditors();
      return;
    }
    const addButton = event.target.closest('[data-add-definition-row]');
    if (addButton) {
      const scope = addButton.dataset.addDefinitionRow;
      apiDefinitionRows(scope, state.activeApiDefinitionTabs[scope]).push({ name: '', displayName: '', description: '', parameterType: 'text', dataType: 'property', required: true, array: false, value: '' });
      renderApiDefinitionEditor(scope);
      return;
    }
    const batchButton = event.target.closest('[data-batch-definition]');
    if (batchButton) {
      openApiDefinitionBatch(batchButton.dataset.batchDefinition);
      return;
    }
    const removeButton = event.target.closest('[data-remove-definition-row]');
    if (removeButton) {
      const editor = removeButton.closest('[data-definition-editor]');
      const scope = editor.dataset.definitionEditor;
      const index = Number(removeButton.closest('[data-definition-row]').dataset.definitionRow);
      apiDefinitionRows(scope, state.activeApiDefinitionTabs[scope]).splice(index, 1);
      renderApiDefinitionEditor(scope);
    }
  });
  $('#applyApiDefinitionBatchButton')?.addEventListener('click', () => {
    try { applyApiDefinitionBatch(); } catch (error) { toast(titleCaseMessage(error.message), 'error'); }
  });
  $('#cancelApiDefinitionBatchButton')?.addEventListener('click', closeApiDefinitionBatch);
  $('#closeApiDefinitionBatchButton')?.addEventListener('click', closeApiDefinitionBatch);
  $('#apiInterfaceForm [name="name"]')?.addEventListener('input', (event) => {
    const form = event.currentTarget.form;
    if (form.elements.editingInterfaceKey.value || form.elements.key.value) return;
    form.elements.key.value = slugApiKeyPreview(event.currentTarget.value);
  });
  $('#apiInterfaceForm [name="key"]')?.addEventListener('input', (event) => {
    event.currentTarget.value = slugApiKeyPreview(event.currentTarget.value);
  });
  $$('[data-interface-step-button]').forEach((button) => {
    button.addEventListener('click', () => {
      const form = $('#apiInterfaceForm');
      const nextStep = Number(button.dataset.interfaceStepButton);
      if (nextStep > 0 && !form.elements.connectorKey.value) {
        toast('Select a connector before continuing.', 'error');
        setApiInterfaceStep(0);
        return;
      }
      setApiInterfaceStep(nextStep);
    });
  });
  $('#backApiInterfaceButton')?.addEventListener('click', () => setApiInterfaceStep(state.activeApiInterfaceStep - 1));
  $('#nextApiInterfaceButton')?.addEventListener('click', () => {
    const form = $('#apiInterfaceForm');
    if (state.activeApiInterfaceStep === 0 && !form.elements.connectorKey.value) {
      toast('Select a connector before continuing.', 'error');
      return;
    }
    if (state.activeApiInterfaceStep === 1) {
      const requiredFields = $$('[data-interface-step="1"] [required]');
      if (requiredFields.some((field) => !field.reportValidity())) return;
    }
    setApiInterfaceStep(state.activeApiInterfaceStep + 1);
  });
  $('#testApiInterfaceButton')?.addEventListener('click', () => {
    testApiInterface().catch((error) => {
      $('#apiInterfaceTestResult').textContent = `Request failed: ${error.message}`;
    });
  });
  $('#permissionModuleSelect').addEventListener('change', async (event) => {
    try {
      await loadPermissionMatrix(event.currentTarget.value);
    } catch (error) {
      toast(titleCaseMessage(error.message), 'error');
    }
  });
  $('#savePermissionsButton').addEventListener('click', savePermissionMatrix);
  $('#permissionRows').addEventListener('input', (event) => {
    const search = event.target.closest('[data-permission-search]');
    if (!search) return;
    filterPermissionPicker(search.closest('[data-permission-picker]'));
  });
  $('#permissionRows').addEventListener('change', (event) => {
    const checkbox = event.target.closest('.permission-check input[type="checkbox"]');
    if (!checkbox) return;
    updatePermissionPickerCount(checkbox.closest('[data-permission-picker]'));
  });
  $('#fieldPermissionRows').addEventListener('input', (event) => {
    const search = event.target.closest('[data-permission-search]');
    if (!search) return;
    filterPermissionPicker(search.closest('[data-permission-picker]'));
  });
  $('#fieldPermissionRows').addEventListener('change', (event) => {
    const checkbox = event.target.closest('.permission-check input[type="checkbox"]');
    if (!checkbox) return;
    updatePermissionPickerCount(checkbox.closest('[data-permission-picker]'));
  });

  $('#browserButtonForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = serializeForm(form);
    const editingKey = data.editingBrowserKey;
    delete data.editingBrowserKey;
    data.enabled = form.elements.enabled.checked;
    data.searchFields = checkedValues(form.querySelector('[data-browser-field-list="searchFields"]'));
    data.returnFields = checkedValues(form.querySelector('[data-browser-field-list="returnFields"]'));
    data.filter = form.elements.sqlWhere.value.trim()
      ? { where: form.elements.sqlWhere.value.trim() }
      : {};
    delete data.sourcePreview;
    delete data.sqlWhere;
    if (!data.browserKey) {
      data.browserKey = browserKeyPreview(data.name);
    }
    const submitButton = $('#saveBrowserButton');
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';
    try {
      const payload = await api(editingKey
        ? `/api/sysadmin/browser-buttons/${editingKey}`
        : '/api/sysadmin/browser-buttons', {
        method: editingKey ? 'PATCH' : 'POST',
        body: JSON.stringify(data)
      });
      state.browserButtons = payload.browserButtons || [];
      renderBrowserSources();
      renderBrowserButtons();
      clearBrowserButtonForm();
      toast('Browser Button Saved.');
    } catch (error) {
      toast(titleCaseMessage(error.message), 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Save Browser';
    }
  });
  $('#clearBrowserButtonForm').addEventListener('click', clearBrowserButtonForm);
  $('#browserSourceSearch').addEventListener('input', (event) => {
    state.browserSourceSearch = event.currentTarget.value;
    renderBrowserSources();
  });
  $('#browserSourceRows').addEventListener('click', (event) => {
    const button = event.target.closest('[data-browser-source]');
    if (!button) return;
    selectBrowserSource(button.dataset.browserSource);
  });
  $('#newBrowserButton').addEventListener('click', openNewBrowserButtonForm);
  $('#browserButtonForm [name="name"]').addEventListener('input', (event) => {
    const form = event.currentTarget.form;
    if (form.elements.editingBrowserKey.value || form.elements.browserKey.value) return;
    form.elements.browserKey.value = browserKeyPreview(event.currentTarget.value);
  });
  $('#browserButtonForm [name="sourcePreview"]').addEventListener('change', (event) => {
    const form = event.currentTarget.form;
    form.elements.sourceTable.value = event.currentTarget.value;
    syncBrowserSourceSelectors({ sourceTable: event.currentTarget.value });
  });
  $('#browserButtonRows').addEventListener('click', async (event) => {
    const editButton = event.target.closest('[data-edit-browser]');
    if (editButton) {
      const browser = state.browserButtons.find((item) => item.browserKey === editButton.dataset.editBrowser);
      fillBrowserButtonForm(browser);
      return;
    }
    const deleteButton = event.target.closest('[data-delete-browser]');
    if (!deleteButton) return;
    try {
      const payload = await api(`/api/sysadmin/browser-buttons/${deleteButton.dataset.deleteBrowser}`, {
        method: 'DELETE'
      });
      state.browserButtons = payload.browserButtons || [];
      renderBrowserSources();
      renderBrowserButtons();
      clearBrowserButtonForm();
      toast('Browser Button Deleted.');
    } catch (error) {
      toast(titleCaseMessage(error.message), 'error');
    }
  });

  $('#formBuilderSearch').addEventListener('input', (event) => {
    state.formBuilderSearch = event.target.value;
    renderFormModuleList();
  });

  $('#formModuleRows').addEventListener('click', (event) => {
    const button = event.target.closest('[data-config-module]');
    if (!button) return;
    state.activeConfigModule = button.dataset.configModule;
    renderFieldConfig();
  });

  $('#customerFormFields').addEventListener('change', (event) => {
    const changedField = changedFormFieldContext(event.target, $('#customerForm'), state.customerFields);
    if (event.target.name === 'countryId') {
      updateDialCode();
      applyCustomerFormulas();
      if (changedField) {
        applyFieldLinkagesForTrigger(changedField.fieldKey, changedField.value, changedField)
          .catch((error) => toast(titleCaseMessage(error.message), 'error'));
      }
      return;
    }

    const selectAll = event.target.closest('[data-select-all-detail-rows]');
    if (selectAll) {
      const section = selectAll.closest('[data-detail-table-section]');
      section?.querySelectorAll('[data-select-detail-row]').forEach((checkbox) => {
        checkbox.checked = selectAll.checked;
      });
      if (section) syncDetailTableControls(section);
      return;
    }

    const detailRowCheckbox = event.target.closest('[data-select-detail-row]');
    if (detailRowCheckbox) {
      const section = detailRowCheckbox.closest('[data-detail-table-section]');
      if (section) syncDetailTableControls(section);
    }
    if (changedField) {
      applyFieldLinkagesForTrigger(changedField.fieldKey, changedField.value, changedField)
        .catch((error) => toast(titleCaseMessage(error.message), 'error'));
    }
    applyCustomerFormulas();
  });
  $('#customerFormFields').addEventListener('input', () => {
    applyCustomerFormulas();
  });
  $('#customerFormFields').addEventListener('click', (event) => {
    const browserButton = event.target.closest('[data-open-browser-lookup]');
    if (browserButton) {
      openBrowserLookup(browserButton);
      return;
    }

    const addButton = event.target.closest('[data-add-detail-row]');
    if (addButton) {
      const tableName = addButton.dataset.addDetailRow;
      const group = detailFormGroups().find((detailGroup) => detailGroup.tableName === tableName);
      const section = addButton.closest('[data-detail-table-section]');
      const body = section?.querySelector('tbody');
      if (!group || !section || !body) return;
      body.insertAdjacentHTML('beforeend', renderDetailRow(tableName, group.fields, {}, body.children.length));
      renumberDetailRows(section);
      syncDetailTableControls(section);
      return;
    }

    const duplicateButton = event.target.closest('[data-duplicate-detail-rows]');
    if (duplicateButton) {
      const section = duplicateButton.closest('[data-detail-table-section]');
      if (section) duplicateSelectedDetailRows(section);
      return;
    }

    const deleteButton = event.target.closest('[data-delete-detail-rows]');
    if (deleteButton) {
      const section = deleteButton.closest('[data-detail-table-section]');
      if (section) deleteSelectedDetailRows(section);
      return;
    }

    const removeButton = event.target.closest('[data-remove-detail-row]');
    if (removeButton) {
      const section = removeButton.closest('[data-detail-table-section]');
      const row = removeButton.closest('[data-detail-row]');
      const body = section?.querySelector('tbody');
      if (!section || !row || !body) return;
      if (body.children.length > 1) {
        row.remove();
      } else {
        clearDetailRow(row);
      }
      renumberDetailRows(section);
      syncDetailTableControls(section);
    }
  });
  $('#customerSearch').addEventListener('input', debounce(loadCustomers, 250));
  $('#statusFilter').addEventListener('change', loadCustomers);
  $('#clearCustomerForm').addEventListener('click', clearCustomerForm);
  $('#openImportButton').addEventListener('click', openImportModal);
  $('#deleteCustomersButton').addEventListener('click', openDeleteCustomerModal);
  $('#closeImportModal').addEventListener('click', closeImportModal);
  $('#importModal').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      closeImportModal();
    }
  });
  $('#addCustomerButton').addEventListener('click', () => {
    clearCustomerForm();
    openCustomerModal();
  });
  $('#closeCustomerModal').addEventListener('click', closeCustomerModal);
  $('#customerModal').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      closeCustomerModal();
    }
  });
  $('#closeBrowserLookupModal').addEventListener('click', closeBrowserLookupModal);
  $('#browserLookupModal').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      closeBrowserLookupModal();
    }
  });
  $('#browserLookupSearchButton').addEventListener('click', () => {
    searchActiveBrowserLookup().catch((error) => toast(titleCaseMessage(error.message), 'error'));
  });
  $('#browserLookupSearch').addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    searchActiveBrowserLookup().catch((error) => toast(titleCaseMessage(error.message), 'error'));
  });
  $('#browserLookupRows').addEventListener('click', (event) => {
    const button = event.target.closest('[data-select-browser-row]');
    if (!button) return;
    setBrowserLookupValue(JSON.parse(button.dataset.selectBrowserRow));
  });
  document.addEventListener('click', (event) => {
    const fullscreenButton = event.target.closest('[data-modal-fullscreen]');
    if (!fullscreenButton) return;
    toggleModalFullscreen(fullscreenButton);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!$('#confirmationModal').hidden) {
      closeConfirmationModal(false);
      return;
    }
    if (!$('#departmentNodeModal').hidden) {
      closeDepartmentNodeModal();
      return;
    }
    if (!$('#customerModal').hidden) {
      closeCustomerModal();
    }
    if (!$('#importModal').hidden) {
      closeImportModal();
    }
    if (!$('#userModal').hidden) {
      closeUserModal();
    }
    if (!$('#browserLookupModal').hidden) {
      closeBrowserLookupModal();
    }
    if (!$('#formBuilderCreateModal').hidden) {
      closeFormBuilderCreateModal();
    }
    if (!$('#fieldConfigModal').hidden) {
      closeFieldConfigModal();
    }
    if (!$('#batchFieldModal').hidden) {
      closeBatchFieldModal();
    }
    if (!$('#fieldPropertiesModal').hidden) {
      closeFieldPropertiesModal();
    }
    if (!$('#importExportMappingModal').hidden) {
      closeImportExportMappingModal();
    }
    if (!$('#formDesignDrawer').hidden) {
      closeFormDesignDrawer();
    }
    if (!$('#versionHistoryDrawer').hidden) {
      closeVersionHistoryDrawer();
    }
    if (!$('#formulaBuilderModal').hidden) {
      closeFormulaBuilderModal();
    }
    if (!$('#fieldLinkageModal')?.hidden) {
      closeFieldLinkageModal();
    }
  });

  $('#customerRows').addEventListener('click', (event) => {
    const checkbox = event.target.closest('[data-select-customer]');
    if (checkbox) {
      const id = Number(checkbox.dataset.selectCustomer);
      if (checkbox.checked) {
        state.selectedCustomerIds.add(id);
      } else {
        state.selectedCustomerIds.delete(id);
      }
      syncCustomerSelectionControls();
      return;
    }

    const button = event.target.closest('[data-edit-customer]');
    if (button) editCustomer(Number(button.dataset.editCustomer));
  });

  $('#customerTableHead').addEventListener('change', (event) => {
    if (event.target.id !== 'selectAllCustomers') return;
    if (event.target.checked) {
      state.customers.forEach((customer) => state.selectedCustomerIds.add(customer.id));
    } else {
      state.customers.forEach((customer) => state.selectedCustomerIds.delete(customer.id));
    }
    renderCustomers();
  });

  $('#adminFormsSection').addEventListener('click', (event) => {
    const actionButton = event.target.closest('button');
    if (!actionButton) return;
    if (actionButton.id === 'addFieldButton') openFieldConfigModal();
    if (actionButton.id === 'formulaButton') openFormulaBuilderModal();
    if (actionButton.id === 'formDesignButton') openFormDesignDrawer();
    if (actionButton.id === 'versionHistoryButton') openVersionHistoryDrawer().catch((error) => toast(error.message, 'error'));
    if (actionButton.id === 'fieldLinkageButton') openDefaultFieldLinkage();
    if (actionButton.id === 'batchAddFieldsButton') openBatchFieldModal();
    if (actionButton.id === 'fieldPropertiesButton') openFieldPropertiesModal();
    if (actionButton.id === 'importExportMappingButton') openImportExportMappingModal();
  });
  $('#formDesignButton')?.addEventListener('click', (event) => {
    event.stopPropagation();
    openFormDesignDrawer();
  });
  $('#versionHistoryButton')?.addEventListener('click', (event) => {
    event.stopPropagation();
    openVersionHistoryDrawer().catch((error) => toast(error.message, 'error'));
  });
  $('#exportCustomersButton').addEventListener('click', downloadCustomerExport);
  $('#closeSuccessPrompt').addEventListener('click', closeSuccessPrompt);
  $('#successPrompt').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      closeSuccessPrompt();
    }
  });
  $('#closeFieldConfigModal').addEventListener('click', closeFieldConfigModal);
  $('#clearFieldConfigForm').addEventListener('click', clearFieldConfigForm);
  $('#deleteFieldConfigButton').addEventListener('click', async () => {
    const fieldKey = $('#fieldConfigForm').elements.fieldKey.value;
    if (!fieldKey) return;
    const moduleKey = state.activeConfigModule;
    try {
      const field = activeConfigFields().find((item) => item.fieldKey === fieldKey);
      const confirmed = await showConfirmationModal({
        title: 'Delete Field',
        message: `Delete ${field?.label || fieldKey}? This cannot be undone.`,
        confirmLabel: 'Delete Field'
      });
      if (!confirmed) return;
      const config = await api(`/api/sysadmin/modules/${moduleKey}/fields/${fieldKey}`, {
        method: 'DELETE'
      });
      setModuleConfig(moduleKey, config.fields, config.formLayouts);
      closeFieldConfigModal();
      toast('Field Deleted.');
    } catch (error) {
      toast(titleCaseMessage(error.message), 'error');
    }
  });
  $('#fieldConfigModal').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      closeFieldConfigModal();
    }
  });
  $('#closeBatchFieldModal').addEventListener('click', closeBatchFieldModal);
  $('#cancelBatchFieldsButton').addEventListener('click', closeBatchFieldModal);
  $('#batchFieldModal').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      closeBatchFieldModal();
    }
  });
  $('#batchTableTabs').addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-remove-batch-table]');
    if (removeButton) {
      const tableName = removeButton.dataset.removeBatchTable;
      state.batchDetailTables = state.batchDetailTables.filter((name) => name !== tableName);
      state.batchDraftRows = state.batchDraftRows.filter((row) => row.tableKey !== tableName);
      if (state.batchActiveTable === tableName) {
        state.batchActiveTable = 'main';
      }
      renderBatchFieldModal();
      return;
    }

    const button = event.target.closest('[data-batch-table]');
    if (!button) return;
    state.batchActiveTable = button.dataset.batchTable;
    renderBatchFieldModal();
  });
  $('#addDetailTableTab').addEventListener('click', () => {
    const tableName = nextBatchDetailTableName();
    state.batchDetailTables.push(tableName);
    state.batchActiveTable = tableName;
    createBatchDraftRow(tableName);
    renderBatchFieldModal();
  });
  $('#addBatchFieldRow').addEventListener('click', () => {
    createBatchDraftRow();
    renderBatchRows();
  });
  $('#showArchivedBatchFields').addEventListener('click', () => {
    state.batchShowingArchived = !state.batchShowingArchived;
    state.batchSelectedRowIds = new Set();
    renderBatchFieldModal();
  });
  $('#restoreSelectedBatchFields').addEventListener('click', () => {
    const restorableRows = selectedActionRows(canRestoreBatchRow);
    if (!restorableRows.length) return;
    restorableRows.forEach((row) => {
      state.batchRestoredFieldKeys.add(row.fieldKey);
    });
    const restoredIds = new Set(restorableRows.map((row) => row.id));
    state.batchArchivedRows = state.batchArchivedRows.filter((row) => !restoredIds.has(row.id));
    state.batchSelectedRowIds = new Set();
    renderBatchFieldModal();
  });
  $('#selectAllBatchFields').addEventListener('change', (event) => {
    const rows = batchRowsForActiveTable().map((item) => item.row).filter(canSelectBatchRow);
    rows.forEach((row) => {
      if (event.target.checked) {
        state.batchSelectedRowIds.add(row.id);
      } else {
        state.batchSelectedRowIds.delete(row.id);
      }
    });
    renderBatchRows();
  });
  $('#duplicateSelectedBatchFields').addEventListener('click', () => {
    const duplicableRows = selectedActionRows(canDuplicateBatchRow);
    if (!duplicableRows.length) return;
    duplicateBatchRows(duplicableRows);
    state.batchSelectedRowIds = new Set();
    renderBatchFieldModal();
  });
  $('#archiveSelectedBatchFields').addEventListener('click', () => {
    const archivableRows = selectedActionRows(canArchiveBatchRow);
    if (!archivableRows.length) return;
    archivableRows.forEach((row) => {
      state.batchArchivedFieldKeys.add(row.fieldKey);
    });
    const archivedIds = new Set(archivableRows.map((row) => row.id));
    state.batchEditRows = state.batchEditRows.filter((row) => !archivedIds.has(row.id));
    state.batchSelectedRowIds = new Set();
    renderBatchFieldModal();
  });
  $('#deleteSelectedBatchFields').addEventListener('click', () => {
    const deletableSelectedRows = selectedActionRows(canDeleteBatchRow);
    if (!deletableSelectedRows.length) return;
    const selectedIds = new Set(deletableSelectedRows.map((row) => row.id));
    deletableSelectedRows.forEach((row) => {
      if (row.existing) {
        state.batchDeletedFieldKeys.add(row.fieldKey);
      }
    });
    state.batchEditRows = state.batchEditRows.filter((row) => !selectedIds.has(row.id) || !canDeleteBatchRow(row));
    state.batchDraftRows = state.batchDraftRows.filter((row) => !selectedIds.has(row.id) || !canDeleteBatchRow(row));
    state.batchSelectedRowIds = new Set([...state.batchSelectedRowIds].filter((id) => !selectedIds.has(id)));
    renderBatchRows();
  });
  $('#batchFieldRows').addEventListener('input', (event) => {
    const rowElement = event.target.closest('[data-batch-row]');
    if (!rowElement) return;
    const row = findBatchRow(rowElement.dataset.batchRow);
    if (!row) return;
    if (event.target.name === 'label') {
      row.label = event.target.value;
      if (!row.existing) {
        row.fieldKey = uniqueFieldKeyForLabel(row.label, row.tableKey, row.id);
        row.databaseFieldName = row.fieldKey;
        rowElement.querySelector('[name="fieldKey"]').value = row.fieldKey;
        rowElement.querySelector('[name="databaseFieldName"]').value = row.fieldKey;
      }
    } else if (event.target.name === 'fieldKey' && !row.existing) {
      row.fieldKey = slugFieldKeyPreview(event.target.value);
      row.databaseFieldName = row.fieldKey;
      event.target.value = row.fieldKey;
      rowElement.querySelector('[name="databaseFieldName"]').value = row.fieldKey;
    } else if (event.target.name === 'options') {
      row.options = event.target.value;
    }
  });
  $('#batchFieldRows').addEventListener('change', (event) => {
    const rowElement = event.target.closest('[data-batch-row]');
    if (!rowElement) return;
    const row = findBatchRow(rowElement.dataset.batchRow);
    if (!row) return;
    if (event.target.name === 'deleteRow') {
      if (event.target.checked) {
        state.batchSelectedRowIds.add(row.id);
      } else {
        state.batchSelectedRowIds.delete(row.id);
      }
      renderBatchRows();
      return;
    }
    if (event.target.name === 'type') {
      row.type = event.target.value;
      renderBatchRows();
      return;
    }
    if (event.target.type === 'checkbox') {
      row[event.target.name] = event.target.checked;
    }
  });
  $('#batchFieldRows').addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-batch-row]');
    if (!button) return;
    state.batchDraftRows = state.batchDraftRows.filter((row) => row.id !== button.dataset.removeBatchRow);
    renderBatchRows();
  });
  $('#closeFieldPropertiesModal').addEventListener('click', closeFieldPropertiesModal);
  $('#cancelFieldPropertiesButton').addEventListener('click', closeFieldPropertiesModal);
  $('#fieldPropertiesModal').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      closeFieldPropertiesModal();
    }
  });
  $('#closeImportExportMappingModal').addEventListener('click', closeImportExportMappingModal);
  $('#cancelImportExportMappingButton').addEventListener('click', closeImportExportMappingModal);
  $('#importExportMappingModal').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      closeImportExportMappingModal();
    }
  });
  $('#closeFormDesignDrawer').addEventListener('click', closeFormDesignDrawer);
  $('#cancelFormDesignButton').addEventListener('click', closeFormDesignDrawer);
  $('#saveFormDesignDraftButton').addEventListener('click', saveFormDesignDraft);
  $('#publishFormDesignButton').addEventListener('click', publishFormDesign);
  $('#closeVersionHistoryDrawer').addEventListener('click', closeVersionHistoryDrawer);
  $('#closeVersionHistoryFooter').addEventListener('click', closeVersionHistoryDrawer);
  $('#createConfigVersionButton').addEventListener('click', () => {
    createConfigVersionCheckpoint().catch((error) => toast(error.message, 'error'));
  });
  $('#versionHistoryDrawer').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      closeVersionHistoryDrawer();
      return;
    }
    const restoreButton = event.target.closest('[data-restore-config-version]');
    if (restoreButton) {
      restoreConfigVersion(restoreButton.dataset.restoreConfigVersion, restoreButton.dataset.versionNumber)
        .catch((error) => toast(error.message, 'error'));
    }
  });
  $('#copyFormDesignButton').addEventListener('click', () => {
    copyFormDesignLayout($('#copyFormDesignSource').value);
  });
  $('#formDesignDrawer').addEventListener('click', async (event) => {
    if (event.target === event.currentTarget) {
      closeFormDesignDrawer();
    }
  });
  $('#formDesignDrawer').addEventListener('click', async (event) => {
    const typeButton = event.target.closest('[data-form-design-type]');
    if (typeButton) {
      state.activeFormDesignType = typeButton.dataset.formDesignType;
      renderFormDesignDrawer();
      return;
    }
    const showDetailButton = event.target.closest('[data-show-detail-table]');
    if (showDetailButton) {
      await setFormDesignDetailTableVisibility(showDetailButton.dataset.showDetailTable, true);
      return;
    }
    const hideDetailButton = event.target.closest('[data-hide-detail-table]');
    if (hideDetailButton) {
      await setFormDesignDetailTableVisibility(hideDetailButton.dataset.hideDetailTable, false);
      return;
    }
    const moveDetailTableButton = event.target.closest('[data-move-detail-table]');
    if (moveDetailTableButton) {
      moveFormDesignDetailTable(moveDetailTableButton.dataset.moveDetailTable, Number(moveDetailTableButton.dataset.direction || 0));
      return;
    }
    const moveDetailFieldButton = event.target.closest('[data-move-detail-field]');
    if (moveDetailFieldButton) {
      moveFormDesignDetailField(moveDetailFieldButton.dataset.moveDetailField, Number(moveDetailFieldButton.dataset.direction || 0));
      return;
    }
    const addSectionButton = event.target.closest('[data-add-form-section]');
    if (addSectionButton) {
      addFormDesignSection();
      return;
    }
    const moveSectionButton = event.target.closest('[data-move-form-section]');
    if (moveSectionButton) {
      moveFormDesignSection(moveSectionButton.dataset.moveFormSection, Number(moveSectionButton.dataset.direction || 0));
      return;
    }
    const deleteSectionButton = event.target.closest('[data-delete-form-section]');
    if (deleteSectionButton) {
      deleteFormDesignSection(deleteSectionButton.dataset.deleteFormSection);
      return;
    }
    const fieldCard = event.target.closest('[data-design-field]');
    if (fieldCard) {
      selectFormDesignField(fieldCard.dataset.designField);
      return;
    }
    const actionButton = event.target.closest('[data-design-action]');
    if (!actionButton) return;
    const field = selectedFormDesignField();
    if (actionButton.dataset.designAction === 'add-field') {
      openFieldConfigModal();
      $('#fieldConfigModal').classList.add('is-over-drawer');
      return;
    }
    if (!field) return;
    if (actionButton.dataset.designAction === 'edit-field') {
      openFieldConfigModal(field);
      $('#fieldConfigModal').classList.add('is-over-drawer');
      return;
    }
    if (actionButton.dataset.designAction === 'formula') {
      openFormulaBuilderModal(field.fieldKey);
      return;
    }
    if (actionButton.dataset.designAction === 'field-linkage') {
      openFieldLinkageModal(field.fieldKey);
    }
  });
  $('#formDesignCanvas').addEventListener('keydown', (event) => {
    const input = event.target.closest('[data-detail-table-name-input]');
    if (!input) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      input.blur();
    } else if (event.key === 'Escape') {
      input.value = input.dataset.detailTableNameInput;
      input.blur();
    }
  });
  $('#formDesignCanvas').addEventListener('change', (event) => {
    const input = event.target.closest('[data-detail-table-name-input]');
    if (!input) {
      const sectionColumns = event.target.closest('[data-form-section-columns]');
      if (sectionColumns) {
        setFormDesignSectionColumns(sectionColumns.dataset.formSectionColumns, sectionColumns.value);
        return;
      }
      const selectedSection = event.target.closest('[data-selected-field-section]');
      if (selectedSection) {
        moveFormDesignSelectedFieldToSection(selectedSection.value);
        return;
      }
      const selectedSpan = event.target.closest('[data-selected-field-span]');
      if (selectedSpan) {
        setFormDesignSelectedFieldSpan(selectedSpan.value);
      }
      return;
    }
    const oldTableName = input.dataset.detailTableNameInput;
    const nextTableName = normalizeDetailTableNamePreview(input.value);
    input.value = nextTableName || oldTableName;
    renameFormDesignDetailTable(oldTableName, input.value);
  });
  $('#confirmModalAction').addEventListener('click', () => closeConfirmationModal(true));
  $('#closeConfirmationModal').addEventListener('click', () => closeConfirmationModal(false));
  $('#cancelConfirmationModal').addEventListener('click', () => closeConfirmationModal(false));
  $('#confirmationModal').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeConfirmationModal(false);
  });
  $('#formDesignCanvas').addEventListener('blur', (event) => {
    const sectionTitle = event.target.closest('[data-form-section-title]');
    if (sectionTitle) {
      renameFormDesignSection(sectionTitle.dataset.formSectionTitle, sectionTitle.value);
    }
  }, true);
  $('#formDesignCanvas').addEventListener('contextmenu', (event) => {
    const fieldCard = event.target.closest('[data-design-field]');
    if (!fieldCard) return;
    event.preventDefault();
    if (!formDesignAllowsFieldProperties()) {
      return;
    }
    const field = findConfigField(fieldCard.dataset.designField);
    if (!field) return;
    state.selectedFormDesignFieldKey = field.fieldKey;
    renderFormDesignDrawer();
    openFieldPropertiesModal(field.fieldKey);
    $('#fieldPropertiesModal').classList.add('is-over-drawer');
  });
  $('#formDesignCanvas').addEventListener('dragstart', (event) => {
    const detailTableHandle = event.target.closest('[data-design-detail-table-handle]');
    if (detailTableHandle) {
      state.draggingFormDesignDetailTable = detailTableHandle.dataset.designDetailTableHandle;
      state.dragOverFormDesignDetailTable = '';
      state.draggingFormDesignFieldKey = '';
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/x-detail-table', state.draggingFormDesignDetailTable);
      detailTableHandle.closest('[data-design-detail-table]')?.classList.add('is-dragging');
      return;
    }
    const fieldCard = event.target.closest('[data-design-field]');
    if (!fieldCard) return;
    state.draggingFormDesignFieldKey = fieldCard.dataset.designField;
    state.selectedFormDesignFieldKey = fieldCard.dataset.designField;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', fieldCard.dataset.designField);
    fieldCard.classList.add('is-dragging');
  });
  $('#formDesignCanvas').addEventListener('dragover', (event) => {
    if (state.draggingFormDesignDetailTable) {
      const detailTable = event.target.closest('[data-design-detail-table]');
      if (!detailTable) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      const nextDragOver = detailTable.dataset.designDetailTable || '';
      if (state.dragOverFormDesignDetailTable !== nextDragOver) {
        state.dragOverFormDesignDetailTable = nextDragOver;
        $$('#formDesignCanvas [data-design-detail-table]').forEach((table) => {
          table.classList.toggle('is-drag-over', table.dataset.designDetailTable === state.dragOverFormDesignDetailTable);
        });
      }
      return;
    }
    const fieldCard = event.target.closest('[data-design-field]');
    const dropzone = event.target.closest('[data-design-dropzone]');
    if ((!fieldCard && !dropzone) || !state.draggingFormDesignFieldKey) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const nextDragOver = fieldCard?.dataset.designField || '';
    if (state.dragOverFormDesignFieldKey !== nextDragOver) {
      state.dragOverFormDesignFieldKey = nextDragOver;
      $$('#formDesignCanvas [data-design-field]').forEach((card) => {
        card.classList.toggle('is-drag-over', card.dataset.designField === state.dragOverFormDesignFieldKey);
      });
    }
    $$('#formDesignCanvas [data-design-dropzone]').forEach((zone) => {
      zone.classList.toggle('is-drop-active', zone === dropzone && !fieldCard);
    });
  });
  $('#formDesignCanvas').addEventListener('dragleave', (event) => {
    if (!event.relatedTarget || $('#formDesignCanvas').contains(event.relatedTarget)) return;
    state.dragOverFormDesignFieldKey = '';
    state.dragOverFormDesignDetailTable = '';
    $$('#formDesignCanvas [data-design-field]').forEach((card) => card.classList.remove('is-drag-over'));
    $$('#formDesignCanvas [data-design-detail-table]').forEach((table) => table.classList.remove('is-drag-over'));
    $$('#formDesignCanvas [data-design-dropzone]').forEach((zone) => zone.classList.remove('is-drop-active'));
  });
  $('#formDesignCanvas').addEventListener('drop', async (event) => {
    if (state.draggingFormDesignDetailTable) {
      const detailTable = event.target.closest('[data-design-detail-table]');
      if (!detailTable) return;
      event.preventDefault();
      const draggedTableName = event.dataTransfer.getData('text/x-detail-table') || state.draggingFormDesignDetailTable;
      reorderFormDesignDetailTable(draggedTableName, detailTable.dataset.designDetailTable);
      return;
    }
    const fieldCard = event.target.closest('[data-design-field]');
    const dropzone = event.target.closest('[data-design-dropzone]');
    if (!fieldCard && !dropzone) return;
    event.preventDefault();
    const draggedFieldKey = event.dataTransfer.getData('text/plain') || state.draggingFormDesignFieldKey;
    const draggedField = findConfigField(draggedFieldKey);
    if (!draggedField) return;
    if (dropzone?.dataset.designDropzone === 'palette' || fieldCard?.dataset.designPaletteField) {
      await setFormDesignFieldVisibility(draggedFieldKey, false);
    } else if (fieldCard) {
      if (!isFormDesignFieldVisible(draggedField)) {
        await setFormDesignFieldVisibility(draggedFieldKey, true);
      }
      reorderFormDesignField(draggedFieldKey, fieldCard.dataset.designField);
    } else if (dropzone?.dataset.designDropzone === 'form') {
      await setFormDesignFieldVisibility(draggedFieldKey, true);
    }
  });
  $('#formDesignCanvas').addEventListener('dragend', () => {
    state.draggingFormDesignFieldKey = '';
    state.dragOverFormDesignFieldKey = '';
    state.draggingFormDesignDetailTable = '';
    state.dragOverFormDesignDetailTable = '';
    $$('#formDesignCanvas [data-design-field]').forEach((card) => {
      card.classList.remove('is-dragging', 'is-drag-over');
    });
    $$('#formDesignCanvas [data-design-detail-table]').forEach((table) => {
      table.classList.remove('is-dragging', 'is-drag-over');
    });
    $$('#formDesignCanvas [data-design-dropzone]').forEach((zone) => zone.classList.remove('is-drop-active'));
  });
  $('#formDesignCanvas').addEventListener('dblclick', (event) => {
    const fieldCard = event.target.closest('[data-design-field]');
    if (!fieldCard) return;
    event.preventDefault();
    state.selectedFormDesignFieldKey = fieldCard.dataset.designField;
    updateFormDesignSelectionUI();
    openFormulaBuilderModal(fieldCard.dataset.designField);
  });
  $('#closeFieldLinkageModal')?.addEventListener('click', closeFieldLinkageModal);
  $('#cancelFieldLinkageButton')?.addEventListener('click', closeFieldLinkageModal);
  $('#fieldLinkageModal')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      closeFieldLinkageModal();
    }
  });
  $('#fieldLinkageForm')?.addEventListener('click', (event) => {
    const addButton = event.target.closest('[data-add-linkage-row]');
    if (addButton) {
      addFieldLinkageRow(addButton.dataset.addLinkageRow);
      return;
    }
    const removeButton = event.target.closest('[data-remove-linkage-row]');
    if (removeButton) {
      removeButton.closest('tr')?.remove();
    }
  });
  $('#fieldLinkageForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fieldKey = form.elements.fieldKey.value;
    const field = findConfigField(fieldKey);
    if (!field) return;
    const submitButton = $('#saveFieldLinkageButton');
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';
    try {
      const config = await api(`/api/sysadmin/modules/${state.activeConfigModule}/fields/${fieldKey}`, {
        method: 'PATCH',
        body: JSON.stringify({
          lookupConfig: collectFieldLinkageConfig(form)
        })
      });
      setModuleConfig(state.activeConfigModule, config.fields, config.formLayouts);
      closeFieldLinkageModal();
      toast('Field Linkage Saved.');
    } catch (error) {
      toast(titleCaseMessage(error.message), 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Save Linkage';
    }
  });
  $('#closeFormulaBuilderModal').addEventListener('click', closeFormulaBuilderModal);
  $('#cancelFormulaButton').addEventListener('click', closeFormulaBuilderModal);
  $('#clearFormulaButton').addEventListener('click', () => {
    const form = $('#formulaBuilderForm');
    form.elements.formulaExpression.value = '';
    form.elements.formulaJs.value = '';
    form.elements.formulaFunctionName.value = '';
    form.elements.formulaFunctionBody.value = '';
    form.elements.formulaSql.value = '';
    form.elements.formulaEnabled.checked = false;
    renderFormulaFunctions('');
    renderFormulaPresetButtons();
    updateFormulaPreview();
  });
  $('#formulaBuilderModal').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      closeFormulaBuilderModal();
    }
  });
  $('#formulaBuilderForm [name="targetField"]').addEventListener('change', (event) => {
    syncFormulaBuilderField(event.target.value);
  });
  $('#formulaBuilderForm [name="formulaExpression"]').addEventListener('input', updateFormulaPreview);
  $('#formulaBuilderForm [name="formulaJs"]').addEventListener('input', (event) => {
    const form = event.target.form;
    renderFormulaFunctions(event.target.value, form.elements.formulaFunctionName.value, form.elements.formulaFunctionBody.value);
    updateFormulaPreview();
  });
  $('#formulaBuilderForm [name="formulaFunctionName"]').addEventListener('input', (event) => {
    event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    const form = event.target.form;
    renderFormulaFunctions(form.elements.formulaJs.value, event.target.value, form.elements.formulaFunctionBody.value);
    updateFormulaPreview();
  });
  $('#formulaBuilderForm [name="formulaFunctionBody"]').addEventListener('input', (event) => {
    const form = event.target.form;
    renderFormulaFunctions(form.elements.formulaJs.value, form.elements.formulaFunctionName.value, event.target.value);
    updateFormulaPreview();
  });
  $('#formulaBuilderForm').addEventListener('click', (event) => {
    const tabButton = event.target.closest('[data-formula-tab]');
    if (!tabButton) return;
    showFormulaTab(tabButton.dataset.formulaTab);
  });
  $('#formulaBuilderForm').addEventListener('click', (event) => {
    const presetButton = event.target.closest('[data-function-preset]');
    if (!presetButton) return;
    applyFormulaFunctionPreset(presetButton.dataset.functionPreset);
  });
  $('#formulaBuilderForm').addEventListener('click', (event) => {
    const button = event.target.closest('[data-insert-formula]');
    if (!button) return;
    insertAtCursor($('#formulaBuilderForm').elements.formulaExpression, button.dataset.insertFormula);
  });
  $('#formulaBuilderForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fieldKey = form.elements.fieldKey.value;
    const field = findConfigField(fieldKey);
    if (!field) return;
    const formulaExpression = form.elements.formulaExpression.value.trim();
    const formulaJs = form.elements.formulaJs.value.trim();
    const formulaFunctionName = form.elements.formulaFunctionName.value.trim().toUpperCase();
    const formulaFunctionBody = form.elements.formulaFunctionBody.value.trim();
    const formulaSql = form.elements.formulaSql.value.trim();
    const formulaEnabled = form.elements.formulaEnabled.checked && Boolean(formulaExpression);
    const submitButton = $('#saveFormulaButton');
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';
    try {
      const config = await api(`/api/sysadmin/modules/${state.activeConfigModule}/fields/${fieldKey}`, {
        method: 'PATCH',
        body: JSON.stringify({
          formulaExpression,
          formulaEnabled,
          formulaJs,
          formulaFunctionName,
          formulaFunctionBody,
          formulaSql
        })
      });
      setModuleConfig(state.activeConfigModule, config.fields, config.formLayouts);
      closeFormulaBuilderModal();
      toast('Formula Saved.');
    } catch (error) {
      toast(titleCaseMessage(error.message), 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Save';
    }
  });

  $('#fieldConfigForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = serializeForm(form);
    const moduleKey = state.activeConfigModule;
    const fieldKey = data.fieldKey;
    if (!fieldKey) {
      data.fieldKey = slugFieldKeyPreview(data.dataKeyPreview || data.label);
      if (!data.fieldKey) {
        toast('Data Key is required.', 'error');
        return;
      }
      if (findConfigField(data.fieldKey)) {
        toast(`Data Key ${data.fieldKey} already exists. Use a different key.`, 'error');
        return;
      }
    }
    if (fieldKey) {
      delete data.fieldKey;
    }
    delete data.dataKeyPreview;
    delete data.databaseFieldName;
    const existingLookupConfig = findConfigField(fieldKey)?.lookupConfig || {};
    data.lookupConfig = data.type === 'browser_button'
      ? { ...existingLookupConfig, browserButtonKey: form.elements.browserButtonKey.value }
      : { ...existingLookupConfig, browserButtonKey: existingLookupConfig.browserButtonKey || '' };
    delete data.browserButtonKey;
    data.required = form.elements.required.checked;
    data.showInTable = form.elements.showInTable.checked;
    data.showInForm = form.elements.showInForm.checked;
    data.showInImport = form.elements.showInImport.checked;
    data.validationRules = fieldValidationRulesFromForm(form);
    if (!isDropdownOptionFieldType(data.type)) {
      data.options = [];
    }
    if (data.tableType !== 'detail') {
      delete data.detailTableName;
    }
    try {
      const config = await api(fieldKey
        ? `/api/sysadmin/modules/${moduleKey}/fields/${fieldKey}`
        : `/api/sysadmin/modules/${moduleKey}/fields`, {
        method: fieldKey ? 'PATCH' : 'POST',
        body: JSON.stringify(data)
      });
      setModuleConfig(moduleKey, config.fields, config.formLayouts);
      closeFieldConfigModal();
      toast(fieldKey ? 'Field Saved.' : 'Field Added.');
    } catch (error) {
      toast(titleCaseMessage(error.message), 'error');
    }
  });

  $('#fieldConfigRows').addEventListener('click', async (event) => {
    const linkageButton = event.target.closest('[data-open-field-linkage]');
    if (linkageButton) {
      openFieldLinkageModal(linkageButton.dataset.openFieldLinkage);
      return;
    }
    const button = event.target.closest('[data-edit-field]');
    if (!button) return;
    const field = findConfigField(button.dataset.editField);
    if (field) openFieldConfigModal(field);
  });

  $('#fieldConfigForm [name="label"]').addEventListener('input', (event) => {
    const form = event.currentTarget.form;
    if (form.elements.fieldKey.value) return;
    const tableKey = form.elements.tableType.value === 'detail'
      ? (form.elements.detailTableName.value || generatedDetailTableName())
      : 'main';
    const preview = uniqueFieldKeyForLabel(event.currentTarget.value, tableKey);
    form.elements.dataKeyPreview.value = preview;
    form.elements.databaseFieldName.value = preview;
  });
  $('#fieldConfigForm [name="dataKeyPreview"]').addEventListener('input', (event) => {
    const form = event.currentTarget.form;
    if (form.elements.fieldKey.value) return;
    const preview = slugFieldKeyPreview(event.currentTarget.value);
    event.currentTarget.value = preview;
    form.elements.databaseFieldName.value = preview;
  });
  $('#fieldConfigForm [name="type"]').addEventListener('change', syncFieldConfigTypeRows);
  $('#fieldConfigForm [name="tableType"]').addEventListener('change', (event) => {
    syncFieldConfigTypeRows();
    const form = event.currentTarget.form;
    if (form.elements.fieldKey.value || !form.elements.label.value.trim()) return;
    const tableKey = form.elements.tableType.value === 'detail'
      ? (form.elements.detailTableName.value || generatedDetailTableName())
      : 'main';
    const preview = uniqueFieldKeyForLabel(form.elements.label.value, tableKey);
    form.elements.dataKeyPreview.value = preview;
    form.elements.databaseFieldName.value = preview;
  });
  $('#fieldConfigForm [name="detailTableName"]').addEventListener('input', (event) => {
    const form = event.currentTarget.form;
    if (form.elements.fieldKey.value || form.elements.tableType.value !== 'detail' || !form.elements.label.value.trim()) return;
    const preview = uniqueFieldKeyForLabel(form.elements.label.value, event.currentTarget.value || generatedDetailTableName());
    form.elements.dataKeyPreview.value = preview;
    form.elements.databaseFieldName.value = preview;
  });

  $('#batchFieldForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const existingRows = state.batchShowingArchived ? [] : state.batchEditRows.filter((row) => row.label.trim());
    const newRows = state.batchDraftRows.filter((row) => row.label.trim());
    const deletedFieldKeys = Array.from(state.batchDeletedFieldKeys);
    const archivedFieldKeys = Array.from(state.batchArchivedFieldKeys);
    const restoredFieldKeys = Array.from(state.batchRestoredFieldKeys);
    if (!existingRows.length && !newRows.length && !deletedFieldKeys.length && !archivedFieldKeys.length && !restoredFieldKeys.length) {
      toast('Add or edit at least one field.', 'error');
      return;
    }
    for (const row of newRows) {
      row.fieldKey = slugFieldKeyPreview(row.fieldKey || row.label);
      row.databaseFieldName = row.fieldKey;
      if (!row.fieldKey) {
        toast('Data Key is required for every new field.', 'error');
        return;
      }
    }
    const newFieldKeys = new Set();
    const savedFieldKeys = new Set(activeConfigFields().map((field) => field.fieldKey));
    for (const row of newRows) {
      if (savedFieldKeys.has(row.fieldKey) || newFieldKeys.has(row.fieldKey)) {
        toast(`Data Key ${row.fieldKey} already exists. Use a different key.`, 'error');
        return;
      }
      newFieldKeys.add(row.fieldKey);
    }

    const submitButton = $('#saveBatchFieldsButton');
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';
    try {
      let latestConfig = null;
      for (const fieldKey of deletedFieldKeys) {
        latestConfig = await api(`/api/sysadmin/modules/${state.activeConfigModule}/fields/${fieldKey}`, {
          method: 'DELETE'
        });
      }
      for (const fieldKey of archivedFieldKeys) {
        latestConfig = await api(`/api/sysadmin/modules/${state.activeConfigModule}/fields/${fieldKey}/archive`, {
          method: 'POST'
        });
      }
      for (const fieldKey of restoredFieldKeys) {
        latestConfig = await api(`/api/sysadmin/modules/${state.activeConfigModule}/fields/${fieldKey}/unarchive`, {
          method: 'POST'
        });
      }
      for (const row of existingRows) {
        latestConfig = await api(`/api/sysadmin/modules/${state.activeConfigModule}/fields/${row.fieldKey}`, {
          method: 'PATCH',
          body: JSON.stringify({
            label: row.label,
            type: row.type,
            options: isDropdownOptionFieldType(row.type) ? row.options : [],
            showInTable: row.showInTable,
            showInForm: row.showInForm,
            showInImport: row.showInImport,
            required: row.required
          })
        });
      }
      for (const row of newRows) {
        latestConfig = await api(`/api/sysadmin/modules/${state.activeConfigModule}/fields`, {
          method: 'POST',
          body: JSON.stringify({
            label: row.label,
            fieldKey: row.fieldKey || slugFieldKeyPreview(row.label),
            type: row.type,
            tableType: row.tableKey === 'main' ? 'main' : 'detail',
            detailTableName: row.tableKey === 'main' ? '' : row.tableKey,
            options: isDropdownOptionFieldType(row.type) ? row.options : [],
            showInTable: row.showInTable,
            showInForm: row.showInForm,
            showInImport: row.showInImport,
            required: row.required
          })
        });
      }
      if (latestConfig) {
        setModuleConfig(state.activeConfigModule, latestConfig.fields, latestConfig.formLayouts);
      }
      closeBatchFieldModal();
      const savedCount = existingRows.length + newRows.length;
      const changeCount = savedCount + deletedFieldKeys.length + archivedFieldKeys.length + restoredFieldKeys.length;
      toast(`Saved ${changeCount} Field${changeCount === 1 ? '' : 's'}.`);
    } catch (error) {
      toast(titleCaseMessage(error.message), 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Save Changes';
    }
  });

  $('#fieldPropertiesForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const rows = Array.from($('#fieldPropertiesRows').querySelectorAll('[data-properties-field]'));
    const submitButton = $('#saveFieldPropertiesButton');
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';
    try {
      let latestConfig = null;
      const visibilityByFieldKey = {};
      for (const row of rows) {
        const field = findConfigField(row.dataset.propertiesField);
        if (!field) continue;
        const showInForm = row.querySelector('[name="showInForm"]').checked;
        const editable = row.querySelector('[name="editable"]').checked;
        const required = showInForm && row.querySelector('[name="required"]').checked;
        const disableManualInput = row.querySelector('[name="disableManualInput"]').checked;
        visibilityByFieldKey[field.fieldKey] = showInForm;
        latestConfig = await api(`/api/sysadmin/modules/${state.activeConfigModule}/fields/${field.fieldKey}`, {
          method: 'PATCH',
          body: JSON.stringify({
            showInForm,
            editable,
            required,
            disableManualInput
          })
        });
      }
      syncFormDesignDisplayVisibility(visibilityByFieldKey);
      if (latestConfig) {
        setModuleConfig(state.activeConfigModule, latestConfig.fields, latestConfig.formLayouts);
      }
      closeFieldPropertiesModal();
      toast('Field Properties Saved.');
    } catch (error) {
      toast(titleCaseMessage(error.message), 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Save';
    }
  });

  $('#importExportMappingForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const rows = Array.from($('#importExportMappingRows').querySelectorAll('[data-mapping-field]'));
    const submitButton = $('#saveImportExportMappingButton');
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';
    try {
      let latestConfig = null;
      for (const row of rows) {
        const field = findConfigField(row.dataset.mappingField);
        if (!field) continue;
        latestConfig = await api(`/api/sysadmin/modules/${state.activeConfigModule}/fields/${field.fieldKey}`, {
          method: 'PATCH',
          body: JSON.stringify({
            showInImport: row.querySelector('[name="showInImport"]').checked,
            showInExport: row.querySelector('[name="showInExport"]').checked,
            importHeader: row.querySelector('[name="importHeader"]').value.trim(),
            exportHeader: row.querySelector('[name="exportHeader"]').value.trim()
          })
        });
      }
      if (latestConfig) {
        setModuleConfig(state.activeConfigModule, latestConfig.fields, latestConfig.formLayouts);
        renderFieldConfig();
      }
      closeImportExportMappingModal();
      toast('Import/Export Mapping Saved.');
    } catch (error) {
      toast(titleCaseMessage(error.message), 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Save';
    }
  });

  $('#fieldPropertiesRows').addEventListener('change', (event) => {
    if (event.target.name !== 'showInForm') return;
    const row = event.target.closest('[data-properties-field]');
    const requiredInput = row?.querySelector('[name="required"]');
    if (!requiredInput || event.target.checked) return;
    requiredInput.checked = false;
  });

  $('#addUserButton').addEventListener('click', () => {
    clearUserForm();
    openUserModal();
  });
  $('#clearUserForm').addEventListener('click', clearUserForm);
  $('#closeUserModal').addEventListener('click', closeUserModal);
  $('#userModal').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      closeUserModal();
    }
  });
  $('#userFormFields').addEventListener('click', (event) => {
    const browserButton = event.target.closest('[data-open-browser-lookup]');
    if (browserButton) {
      openBrowserLookup(browserButton);
    }
  });
  $('#userRows').addEventListener('click', (event) => {
    const button = event.target.closest('[data-edit-user]');
    if (button) editUser(Number(button.dataset.editUser));
  });

  $('#customerForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = customerFormData(form);
    const id = data.id;
    delete data.id;

    try {
      await api(id ? `/api/customers/${id}` : '/api/customers', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(data)
      });
      clearCustomerForm();
      closeCustomerModal();
      await loadCustomers();
      toast('Customer Saved.');
    } catch (error) {
      toast(titleCaseMessage(error.message), 'error');
    }
  });

  $('#userForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const form = event.currentTarget;
      const data = userFormData(form);
      const id = data.id;
      delete data.id;
      if ((data.password || data.confirmPassword) && data.password !== data.confirmPassword) {
        toast('Passwords Do Not Match.', 'error');
        return;
      }
      delete data.confirmPassword;
      if (id && !data.password) {
        delete data.password;
      }

      await api(id ? `/api/users/${id}` : '/api/users', {
        method: id ? 'PATCH' : 'POST',
        body: JSON.stringify(data)
      });
      clearUserForm();
      closeUserModal();
      const payload = await api('/api/users');
      state.users = payload.users;
      renderUsers();
      renderOwners();
      toast(id ? 'User Saved.' : 'User Created.');
    } catch (error) {
      toast(titleCaseMessage(error.message), 'error');
    }
  });

  $('#importForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = event.currentTarget.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Importing...';

    try {
      const formData = new FormData(event.currentTarget);
      const result = await api('/api/imports/customers', {
        method: 'POST',
        body: formData
      });
      event.currentTarget.reset();
      let refreshFailed = false;
      try {
        await loadCustomers();
      } catch (_error) {
        refreshFailed = true;
      }
      $('#importResult').textContent = formatImportResult(result, refreshFailed);
      $('#importResult').hidden = false;
      toast(`Imported ${result.createdCount} Customer${result.createdCount === 1 ? '' : 's'}.`);
    } catch (error) {
      toast(titleCaseMessage(error.message), 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Import';
    }
  });
}

function debounce(fn, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

async function init() {
  try {
    await loadAuthConfig();
  } catch (error) {
    toast(titleCaseMessage(error.message), 'error');
  }
  initializeScrollableModalFrames();
  bindEvents();
  configureAuthUi();

  if (!state.token || !state.user) {
    clearSession();
    return;
  }

  setSession(state.token, state.user);
  showView('customersView');
  try {
    await loadBootstrap();
  } catch (error) {
    clearSession();
    toast(titleCaseMessage(error.message), 'error');
  }
}

init();
