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

const permissionPreviewFeatures = {
  recordAccess: false
};

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
  moduleTemplates: [],
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
  dashboardDataSources: [],
  dashboardViews: [],
  activeDashboardSourceKey: '',
  dashboardSourceSearch: '',
  dashboardPreview: null,
  dashboardSourcesLoading: false,
  dashboards: [],
  dashboardStatusFilter: 'all',
  dashboardManagementSearch: '',
  activeDashboardKey: '',
  dashboardManagementMode: 'list',
  dashboardConfiguration: null,
  dashboardLayoutViewport: 'desktop',
  selectedDashboardWidgetKey: '',
  dashboardLayoutHistory: [],
  dashboardLayoutFuture: [],
  dashboardLayoutDirty: false,
  dashboardLayoutInteraction: null,
  dashboardWidgetResults: {},
  dashboardCalendarMonths: {},
  dashboardCalendarOpen: null,
  dashboardFilterValues: {},
  publishedDashboards: [],
  activePublishedDashboardKey: '',
  dashboardAccessDraft: [],
  dashboardPreviewMode: false,
  actionFlows: [],
  activeActionFlowKey: '',
  actionFlowMode: 'management',
  actionFlowStatusFilter: 'all',
  selectedActionFlowNodeId: '',
  actionFlowSearch: '',
  actionFlowZoom: 1,
  actionFlowDirty: false,
  actionFlowDrag: null,
  actionFlowPan: null,
  actionFlowRun: null,
  actionFlowVersions: null,
  actionFlowVersionsLoading: false,
  workflowDefinitions: [],
  activeWorkflowKey: '',
  workflowDefinitionSearch: '',
  workflowDraftStages: [],
  workflowBuilderGraph: { nodes: [], edges: [] },
  selectedWorkflowNodeId: '',
  selectedWorkflowEdgeId: '',
  workflowCanvasZoom: 1,
  workflowCanvasDrag: null,
  workflowCanvasDragFrame: null,
  workflowCanvasSuppressClick: false,
  workflowCanvasPan: null,
  workflowConnectFrom: '',
  workflowRouteDesignerOpen: false,
  workflowInspectorCollapsed: false,
  workflowRouteReturnScrollY: 0,
  workflowRouteSaveNoticeTimer: null,
  documentTemplates: [],
  activeDocumentTemplateKey: '',
  documentDesignerMode: 'design',
  documentSelectedRegion: 'body',
  documentSelectedColumn: 1,
  documentSelectedElementId: '',
  documentSelectedCell: null,
  documentHistory: [],
  documentFuture: [],
  documentDirty: false,
  documentPropertiesTab: 'properties',
  documentPaletteTab: 'fields',
  documentFieldQuery: '',
  documentMarginDrag: null,
  documentRulerDrag: null,
  documentModeBeforePrint: null,
  documentImportResult: null,
  documentOriginalPdfUrl: '',
  documentOriginalPdfFile: null,
  documentCompareMode: 'generated',
  documentPageIndex: 0,
  documentRejectedSuggestions: new Set(),
  workflowDocumentOutputs: {},
  workflowRequests: [],
  workflowInbox: [],
  workflowRequestMode: 'requests',
  workflowRequestStatus: 'all',
  workflowRequestSearch: '',
  activeWorkflowRequestKey: '',
  activeWorkflowRequest: null,
  workflowMonitoring: { summary: {}, items: [], generatedAt: null },
  workflowMonitoringSearch: '',
  workflowMonitoringStatus: 'all',
  workflowMonitoringSla: 'all',
  workflowMonitoringTab: 'live',
  workflowReport: { items: [], generatedAt: null },
  workflowReportFilters: { search: '', workflowKey: '', status: 'all', requester: '', approver: '', departmentId: '', dateFrom: '', dateTo: '' },
  workflowMonitoringTimer: null,
  notifications: [],
  notificationUnreadCount: 0,
  notificationUnreadOnly: false,
  notificationTimer: null,
  emailSettings: null,
  account: null,
  accountAvatarUrl: '',
  activeAccountTab: 'profile',
  accountReturnView: 'customersView',
  sidebarMenu: [],
  sidebarCompact: false,
  menuConfigDraft: null,
  menuConfigCatalog: { destinations: [], users: [], departments: [] },
  menuConfigVersions: [],
  selectedMenuItemKey: '',
  draggingMenuItemKey: '',
  menuDropTarget: null,
  menuPointerDrag: null,
  workflowDelegations: [],
  workflowDelegationStatus: 'all',
  workflowDelegationSearch: '',
  permissionMatrix: null,
  fieldPermissionMatrix: null,
  activePermissionModule: 'customers',
  permissionAuditLogs: [],
  permissionAuditLoading: false,
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
  formDesignDropPlacement: '',
  formDesignPointerDrag: null,
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
  layouts.draft[type].sections.forEach((section) => {
    section.fieldKeys.sort((a, b) => layouts.draft[type].order.indexOf(a) - layouts.draft[type].order.indexOf(b));
  });
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
  const fields = formDesignReorderPeers(findConfigField(fieldKey));
  const index = fields.findIndex((field) => field.fieldKey === fieldKey);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= fields.length) return;
  reorderFormDesignFieldAt(fieldKey, fields[nextIndex].fieldKey, direction < 0 ? 'before' : 'after');
  const button = $(`#formDesignCanvas [data-design-action="move-${direction < 0 ? 'up' : 'down'}"]`);
  if (button && !button.disabled) button.focus();
  else $$('#formDesignCanvas [data-design-field]').find((card) => card.dataset.designField === fieldKey)?.focus();
}

function formDesignReorderPeers(selected) {
  if (!selected || !isFormDesignFieldVisible(selected)) return [];
  return orderedFormDesignFields().filter((field) => isFormDesignFieldVisible(field)
    && (selected.tableType === 'detail'
      ? field.tableType === 'detail' && field.detailTableName === selected.detailTableName
      : field.tableType !== 'detail' && formDesignSectionForField(field.fieldKey)?.id === formDesignSectionForField(selected.fieldKey)?.id));
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
  const fields = formDesignReorderPeers(selectedField);
  const index = fields.findIndex((field) => field.fieldKey === selectedField?.fieldKey);
  $('#formDesignCanvas [data-design-action="move-up"]').disabled = index <= 0;
  $('#formDesignCanvas [data-design-action="move-down"]').disabled = index < 0 || index >= fields.length - 1;
  const section = $('#formDesignCanvas [data-selected-field-section]');
  const span = $('#formDesignCanvas [data-selected-field-span]');
  if (section) {
    section.disabled = !selectedField || selectedField.tableType === 'detail';
    section.value = selectedField ? formDesignSectionForField(selectedField.fieldKey)?.id || '' : '';
  }
  if (span) {
    span.disabled = !selectedField || selectedField.tableType === 'detail';
    span.value = selectedField ? String(activeFormDesignLayout().fieldSpans?.[selectedField.fieldKey] || 1) : '1';
  }
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
        <span class="form-reorder-grip" aria-hidden="true" title="Drag to reorder">⋮⋮</span>
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
                    <span class="form-reorder-grip" aria-hidden="true" title="Drag to reorder">⋮⋮</span>
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
    markFormLayoutSaved();
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
    markFormLayoutSaved();
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
const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
const preferredScrollBehavior = () => prefersReducedMotion() ? 'auto' : 'smooth';

const modalSurfaceState = new WeakMap();
let modalSurfaceStack = [];
let modalInteractionSource = null;

function modalSurfaceCard(modal) {
  return modal?.querySelector([
    '.modal-card',
    '.form-builder-tool-drawer',
    '.form-design-drawer',
    '.version-history-drawer',
    '.page-permission-drawer',
    '.permission-audit-drawer',
    '.api-connector-drawer',
    '.api-interface-drawer',
    '.dashboard-source-drawer'
  ].join(', ')) || modal?.firstElementChild || null;
}

function formDesignDropPlacement(card, clientY) {
  if (!card) return 'after';
  const bounds = card.getBoundingClientRect();
  return clientY < bounds.top + (bounds.height / 2) ? 'before' : 'after';
}

function reorderFormDesignFieldAt(draggedFieldKey, targetFieldKey, placement = 'before') {
  if (!draggedFieldKey || !targetFieldKey || draggedFieldKey === targetFieldKey) return;
  const fields = orderedFormDesignFields();
  const fromIndex = fields.findIndex((field) => field.fieldKey === draggedFieldKey);
  const targetIndex = fields.findIndex((field) => field.fieldKey === targetFieldKey);
  if (fromIndex < 0 || targetIndex < 0) return;
  const source = fields[fromIndex];
  const target = fields[targetIndex];
  if (!isFormDesignFieldVisible(source) || !isFormDesignFieldVisible(target)) return;
  if ((source.tableType === 'detail' || target.tableType === 'detail')
      && (source.tableType !== target.tableType || source.detailTableName !== target.detailTableName)) return;
  if (source.tableType !== 'detail') {
    const layouts = readFormDesignLayouts();
    const layout = layouts.draft[state.activeFormDesignType];
    const destination = layout.sections.find((section) => section.fieldKeys.includes(targetFieldKey));
    if (destination) {
      layout.sections.forEach((section) => { section.fieldKeys = section.fieldKeys.filter((key) => key !== draggedFieldKey); });
      destination.fieldKeys.push(draggedFieldKey);
      writeFormDesignLayouts(layouts);
    }
  }
  const nextFields = [...fields];
  const [draggedField] = nextFields.splice(fromIndex, 1);
  const adjustedTarget = nextFields.findIndex((field) => field.fieldKey === targetFieldKey);
  nextFields.splice(adjustedTarget + (placement === 'after' ? 1 : 0), 0, draggedField);
  state.selectedFormDesignFieldKey = draggedFieldKey;
  updateFormDesignDraftOrder(state.activeFormDesignType, nextFields);
  renderFormDesignDrawer();
  announceFormDesign(`${draggedField.label} moved ${placement} ${fields[targetIndex].label}.`);
}

function announceFormDesign(message) {
  const output = $('#formDesignAnnouncement');
  if (output) requestAnimationFrame(() => { output.textContent = message; });
}

function modalSurfaceTitle(modal) {
  return String(modal?.id || 'dialog')
    .replace(/(Modal|Drawer|Prompt)$/i, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim() || 'Dialog';
}

function configureModalSurface(modal) {
  const card = modalSurfaceCard(modal);
  if (!card) return;
  if (!card.hasAttribute('role')) card.setAttribute('role', modal.id === 'confirmationModal' ? 'alertdialog' : 'dialog');
  card.setAttribute('aria-modal', 'true');
  if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '-1');

  const heading = card.querySelector('h1, h2, h3');
  if (heading) {
    if (!heading.id) heading.id = `${modal.id || 'modal'}Title`;
    card.setAttribute('aria-labelledby', heading.id);
    card.removeAttribute('aria-label');
  } else if (!card.hasAttribute('aria-label')) {
    card.setAttribute('aria-label', modalSurfaceTitle(modal));
  }

  let description = card.querySelector('.modal-header p, :scope > p, .field-hint, .muted');
  if (!description) {
    description = document.createElement('p');
    description.className = 'sr-only modal-generated-description';
    description.textContent = card.matches('form')
      ? `Complete the ${modalSurfaceTitle(modal)} form, then save or cancel.`
      : `${modalSurfaceTitle(modal)} dialog.`;
    card.prepend(description);
  }
  if (!description.id) description.id = `${modal.id || 'modal'}Description`;
  card.setAttribute('aria-describedby', description.id);
  modal.dataset.modalSurface = 'true';
}

function modalFocusableElements(modal) {
  return Array.from(modal.querySelectorAll([
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', '))).filter((element) => {
    const style = getComputedStyle(element);
    return !element.hidden && style.display !== 'none' && style.visibility !== 'hidden';
  });
}

function topmostModalSurface() {
  modalSurfaceStack = modalSurfaceStack.filter((modal) => modal.isConnected && !modal.hidden);
  return modalSurfaceStack.at(-1) || $$('.modal-backdrop:not([hidden])').at(-1) || null;
}

function syncModalSurfaceState() {
  const openModals = $$('.modal-backdrop:not([hidden])');
  document.body.classList.toggle('modal-open', openModals.length > 0);
  const topmost = topmostModalSurface();
  openModals.forEach((modal) => {
    const isTopmost = modal === topmost;
    modal.setAttribute('aria-hidden', String(!isTopmost));
    modal.inert = !isTopmost;
  });
}

function focusModalSurface(modal) {
  if (!modal) return;
  requestAnimationFrame(() => {
    if (!modal.isConnected || modal.hidden || modal.contains(document.activeElement)) return;
    const preferred = modal.querySelector('[autofocus], [data-modal-initial-focus]');
    (preferred || modalFocusableElements(modal)[0] || modalSurfaceCard(modal))?.focus();
  });
}

function handleModalSurfaceOpened(modal) {
  configureModalSurface(modal);
  const opener = modalInteractionSource?.isConnected
    ? modalInteractionSource
    : (!modal.contains(document.activeElement) ? document.activeElement : null);
  modalSurfaceState.set(modal, { opener });
  modalSurfaceStack = modalSurfaceStack.filter((item) => item !== modal);
  modalSurfaceStack.push(modal);
  syncModalSurfaceState();
  focusModalSurface(modal);
}

function handleModalSurfaceClosed(modal) {
  const { opener } = modalSurfaceState.get(modal) || {};
  modalSurfaceStack = modalSurfaceStack.filter((item) => item !== modal);
  modal.removeAttribute('aria-hidden');
  modal.inert = false;
  syncModalSurfaceState();
  requestAnimationFrame(() => {
    if (opener?.isConnected && !opener.closest('[hidden]')) opener.focus();
    else focusModalSurface(topmostModalSurface());
  });
}

function requestModalSurfaceDismiss(modal) {
  const dismissControl = modal.querySelector([
    '[data-modal-dismiss]',
    'button[id^="cancel"]',
    'button[id^="close"]:not([data-modal-fullscreen])'
  ].join(', '));
  if (dismissControl) dismissControl.click();
  else modal.hidden = true;
}

function trapModalSurfaceFocus(event, modal) {
  const focusable = modalFocusableElements(modal);
  if (!focusable.length) {
    event.preventDefault();
    modalSurfaceCard(modal)?.focus();
    return;
  }
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
    event.preventDefault();
    first.focus();
  }
}

function initializeModalSurfaces() {
  const modals = $$('.modal-backdrop');
  modals.forEach((modal) => {
    modal.dataset.surfaceKind = 'modal';
    configureModalSurface(modal);
  });
  const observer = new MutationObserver((records) => {
    records.forEach(({ target }) => {
      if (target.hidden) handleModalSurfaceClosed(target);
      else handleModalSurfaceOpened(target);
    });
  });
  modals.forEach((modal) => {
    observer.observe(modal, { attributes: true, attributeFilter: ['hidden'] });
    modal.addEventListener('click', (event) => {
      if (event.target === modal && modal === topmostModalSurface()) requestModalSurfaceDismiss(modal);
    });
  });
  document.addEventListener('click', (event) => {
    const control = event.target.closest('button, a[href], input, select, textarea, [tabindex]');
    if (control) modalInteractionSource = control;
  }, true);
  document.addEventListener('keydown', (event) => {
    const modal = topmostModalSurface();
    if (!modal) return;
    if (event.key === 'Tab') trapModalSurfaceFocus(event, modal);
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      requestModalSurfaceDismiss(modal);
    }
  }, true);
}

function initializeParallelInspectors() {
  $$('#menuConfigInspector, #actionFlowInspector, #workflowCanvasInspector, #dashboardWidgetInspector').forEach((inspector) => {
    inspector.classList.add('parallel-inspector');
    inspector.dataset.surfaceKind = 'parallel';
    inspector.setAttribute('aria-modal', 'false');
  });
}

function setModalFullscreen(modal, enabled) {
  const card = modal?.querySelector('.modal-card, .form-design-drawer, .version-history-drawer, .page-permission-drawer, .permission-audit-drawer, .api-connector-drawer, .api-interface-drawer, .dashboard-source-drawer');
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
  const card = button.closest('.modal-card, .form-design-drawer, .version-history-drawer, .page-permission-drawer, .permission-audit-drawer, .api-connector-drawer, .api-interface-drawer, .dashboard-source-drawer');
  if (!modal || !card) return;
  setModalFullscreen(modal, !card.classList.contains('is-fullscreen'));
}

const toastState = { timer: null, remaining: 4200, startedAt: 0 };

function dismissToast() {
  window.clearTimeout(toastState.timer);
  toastState.timer = null;
  $('#toast').hidden = true;
}

function scheduleToastDismiss(delay = 4200) {
  window.clearTimeout(toastState.timer);
  toastState.remaining = delay;
  toastState.startedAt = Date.now();
  toastState.timer = window.setTimeout(dismissToast, delay);
}

function pauseToastDismiss() {
  if (!toastState.timer) return;
  window.clearTimeout(toastState.timer);
  toastState.timer = null;
  toastState.remaining = Math.max(250, toastState.remaining - (Date.now() - toastState.startedAt));
}

function resumeToastDismiss() {
  const element = $('#toast');
  if (!element.hidden && !element.classList.contains('error') && !element.matches(':hover, :focus-within')) {
    scheduleToastDismiss(toastState.remaining);
  }
}

function activeFeedbackForm() {
  return document.querySelector('form[aria-busy="true"]') || document.activeElement?.closest?.('form') || null;
}

function clearFormErrorSummary(form) {
  form?.querySelector(':scope > .form-error-summary')?.remove();
}

function showFormErrorSummary(form, message) {
  if (!form) return;
  clearFormErrorSummary(form);
  const summary = document.createElement('div');
  summary.className = 'form-error-summary';
  summary.setAttribute('role', 'alert');
  summary.textContent = message;
  form.prepend(summary);
}

function toast(message, type = 'ok') {
  const element = $('#toast');
  const isError = type === 'error';
  const form = activeFeedbackForm();
  window.clearTimeout(toastState.timer);
  toastState.timer = null;
  $('#toastMessage').textContent = message;
  element.className = `toast ${isError ? 'error' : ''}`;
  element.setAttribute('role', isError ? 'alert' : 'status');
  element.setAttribute('aria-live', isError ? 'assertive' : 'polite');
  element.setAttribute('aria-atomic', 'true');
  element.hidden = false;
  $('#dismissToast').hidden = !isError;
  if (isError) showFormErrorSummary(form, message);
  else {
    clearFormErrorSummary(form);
    scheduleToastDismiss();
  }
}

function clearFieldError(input) {
  const errorId = input.dataset.validationErrorId;
  if (errorId) document.getElementById(errorId)?.remove();
  delete input.dataset.validationErrorId;
  input.removeAttribute('aria-invalid');
  const describedBy = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter((id) => id && id !== errorId);
  if (describedBy.length) input.setAttribute('aria-describedby', describedBy.join(' '));
  else input.removeAttribute('aria-describedby');
}

function showFieldError(input) {
  clearFieldError(input);
  const id = `field-error-${input.id || input.name || Date.now()}`.replace(/[^a-zA-Z0-9_-]/g, '-');
  const error = document.createElement('span');
  error.id = id;
  error.className = 'field-error';
  error.textContent = input.validationMessage;
  input.insertAdjacentElement('afterend', error);
  input.dataset.validationErrorId = id;
  input.setAttribute('aria-invalid', 'true');
  input.setAttribute('aria-describedby', [input.getAttribute('aria-describedby'), id].filter(Boolean).join(' '));
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
    const error = new Error(payload.error || 'Request failed');
    error.status = response.status;
    error.details = payload.details || {};
    error.code = payload.details?.code || '';
    throw error;
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}

function renderNotifications() {
  $('#notificationBadge').hidden = !state.notificationUnreadCount;
  $('#notificationBadge').textContent = state.notificationUnreadCount > 99 ? '99+' : String(state.notificationUnreadCount);
  $('#notificationList').innerHTML = state.notifications.map((item) => `<button type="button" class="notification-item ${item.read ? '' : 'is-unread'}" data-notification-id="${item.id}" data-notification-request="${escapeHtml(item.requestKey || '')}"><span class="notification-item-mark"></span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.message)}</small><time>${escapeHtml(new Date(item.createdAt).toLocaleString())}</time></span></button>`).join('') || '<div class="notification-empty"><strong>You are all caught up</strong><span>Workflow updates will appear here automatically.</span></div>';
}

const floatingSurfaceTimers = new WeakMap();

function positionAnchoredSurface(surface, trigger, container = trigger?.offsetParent) {
  if (!surface || !trigger || !container) return;
  const triggerBounds = trigger.getBoundingClientRect();
  const surfaceBounds = surface.getBoundingClientRect();
  const anchorX = triggerBounds.left + (triggerBounds.width / 2) - surfaceBounds.left;
  surface.style.setProperty('--popover-origin-x', `${Math.round(anchorX)}px`);
}

function setFloatingSurfaceOpen(surface, trigger, open, options = {}) {
  if (!surface) return;
  clearTimeout(floatingSurfaceTimers.get(surface));
  if (open) {
    surface.hidden = false;
    positionAnchoredSurface(surface, trigger, options.container);
    surface.dataset.floatingState = 'closed';
    requestAnimationFrame(() => {
      if (!surface.hidden) surface.dataset.floatingState = 'open';
    });
    return;
  }
  surface.dataset.floatingState = 'closed';
  const finish = () => {
    surface.hidden = true;
    delete surface.dataset.floatingState;
    options.onClosed?.();
  };
  if (prefersReducedMotion()) finish();
  else floatingSurfaceTimers.set(surface, setTimeout(finish, 160));
}

async function loadNotifications() {
  if (!state.user) return;
  const payload = await api(`/api/notifications?unread=${state.notificationUnreadOnly}&limit=50`);
  state.notifications = payload.notifications || []; state.notificationUnreadCount = payload.unreadCount || 0; renderNotifications();
}

function toggleNotificationDrawer(force) {
  const drawer = $('#notificationDrawer'); const bell = $('#notificationBell');
  const open = force ?? bell.getAttribute('aria-expanded') !== 'true';
  setFloatingSurfaceOpen(drawer, bell, open, { container: $('#notificationHub') });
  bell.setAttribute('aria-expanded', String(open)); if (open) runWorkflowUi(loadNotifications);
}

async function openNotification(item) {
  if (!item.read) await api(`/api/notifications/${item.id}/read`, { method: 'POST', body: '{}' });
  toggleNotificationDrawer(false); await loadNotifications();
  if (item.requestKey) await openMonitoredWorkflowRequest(item.requestKey);
}

function emailProviderDefaults(provider) {
  return {
    gmail: { host: 'smtp.gmail.com', port: 587, sender: 'yourname@gmail.com', secret: '16-character Google App Password', help: 'For Gmail, use a Google App Password instead of your normal password.' },
    google_workspace: { host: 'smtp-relay.gmail.com', port: 587, sender: 'workflow@company.com', secret: 'Google Workspace relay password', help: 'Configure SMTP Relay in Google Admin, then enter its authenticated sender details.' },
    microsoft_365: { host: '', port: '', sender: 'workflow@company.com', secret: 'Microsoft Entra client secret', help: 'Register an Entra application with Mail.Send application permission, then enter its Tenant ID, Client ID, secret, and sender mailbox.' },
    generic_smtp: { host: 'mail.company.com', port: 587, sender: 'workflow@company.com', secret: 'SMTP password', help: 'Use the SMTP host and credentials supplied by your email administrator.' }
  }[provider];
}

function syncEmailProviderExamples() { const form = $('#emailSettingsForm'); if (!form) return; const provider = form.elements.provider.value; const examples = emailProviderDefaults(provider); const graph = provider === 'microsoft_365';
  $$('[data-email-smtp]').forEach((field) => { field.hidden = graph; }); $$('[data-email-graph]').forEach((field) => { field.hidden = !graph; }); $('#emailSecretLabel').textContent = graph ? 'Client secret' : 'App password / SMTP password';
  form.elements.host.placeholder = examples.host; form.elements.port.placeholder = String(examples.port); form.elements.senderEmail.placeholder = examples.sender; form.elements.username.placeholder = examples.sender; form.elements.secret.placeholder = examples.secret; $('#emailProviderHelp').textContent = examples.help; }

function renderEmailSettings() { const settings = state.emailSettings || {}; const form = $('#emailSettingsForm'); if (!form) return;
  form.elements.provider.value = settings.provider || 'gmail'; form.elements.enabled.checked = Boolean(settings.enabled); form.elements.senderName.value = settings.senderName || ''; form.elements.senderEmail.value = settings.senderEmail || ''; form.elements.replyTo.value = settings.replyTo || ''; form.elements.host.value = settings.settings?.host || ''; form.elements.port.value = settings.settings?.port || ''; form.elements.security.value = settings.settings?.security || 'starttls'; form.elements.username.value = settings.settings?.username || ''; form.elements.tenantId.value = settings.settings?.tenantId || ''; form.elements.clientId.value = settings.settings?.clientId || ''; form.elements.secret.value = '';
  $('#emailSecretHint').textContent = settings.hasSecret ? 'A password is saved. Leave blank to keep it.' : 'No password is saved yet.'; const status = settings.status === 'ready' ? 'Ready' : settings.status === 'failed' ? 'Test failed' : settings.configured ? 'Saved · not tested' : 'Not configured'; $('#emailSettingsStatus').className = `email-settings-status is-${settings.status || 'untested'}`; $('#emailSettingsStatus').textContent = status; syncEmailProviderExamples(); }
async function loadEmailSettings() { const payload = await api('/api/notifications/email-settings/current'); state.emailSettings = payload.emailSettings; renderEmailSettings(); }
async function saveEmailSettings(event) { event.preventDefault(); const form = event.currentTarget; const value = Object.fromEntries(new FormData(form)); const payload = { provider: value.provider, enabled: form.elements.enabled.checked, senderName: value.senderName.trim(), senderEmail: value.senderEmail.trim(), replyTo: value.replyTo.trim(), secret: value.secret, settings: { host: value.host.trim(), port: value.port ? Number(value.port) : undefined, security: value.security, username: value.username.trim(), tenantId: value.tenantId.trim(), clientId: value.clientId.trim() } }; state.emailSettings = (await api('/api/notifications/email-settings/current', { method: 'PUT', body: JSON.stringify(payload) })).emailSettings; renderEmailSettings(); toast('Email Settings Saved.'); }
async function sendEmailSettingsTest() { const to = $('#emailTestRecipient').value.trim(); if (!to) throw new Error('Enter a test recipient email address.'); await api('/api/notifications/email-settings/test', { method: 'POST', body: JSON.stringify({ to }) }); await loadEmailSettings(); toast('Test Email Sent.'); }

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

function showConfirmationModal({ title = 'Confirm action', message = '', confirmLabel = 'Confirm', cancelLabel = 'Cancel' } = {}) {
  if (confirmationResolver) closeConfirmationModal(false);
  $('#confirmationModalTitle').textContent = title;
  $('#confirmationModalMessage').textContent = message;
  $('#confirmModalAction').textContent = confirmLabel;
  $('#cancelConfirmationModal').textContent = cancelLabel;
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

function hierarchyChildrenIndex(items, getParentKey) {
  const childrenByParent = new Map();
  items.forEach((item) => {
    const parentKey = String(getParentKey(item) ?? '');
    if (!childrenByParent.has(parentKey)) childrenByParent.set(parentKey, []);
    childrenByParent.get(parentKey).push(item);
  });
  return childrenByParent;
}

function hierarchyPathKeys(items, selectedKeys, getKey, getParentKey) {
  const itemsByKey = new Map(items.map((item) => [String(getKey(item)), item]));
  const pathKeys = new Set();
  (selectedKeys || []).forEach((selectedKey) => {
    let current = itemsByKey.get(String(selectedKey));
    const visited = new Set();
    while (current && !visited.has(String(getKey(current)))) {
      const key = String(getKey(current));
      visited.add(key);
      pathKeys.add(key);
      const parentKey = getParentKey(current);
      current = parentKey === null || parentKey === undefined || parentKey === '' ? null : itemsByKey.get(String(parentKey));
    }
  });
  return pathKeys;
}

function hierarchyNodePathClasses(siblings, index, pathKeys, getKey) {
  const key = String(getKey(siblings[index]));
  const isPath = pathKeys.has(key);
  const hasLaterPath = siblings.slice(index + 1).some((item) => pathKeys.has(String(getKey(item))));
  return [
    isPath ? 'is-hierarchy-path is-hierarchy-rail-entry' : '',
    hasLaterPath ? 'is-hierarchy-rail-through' : ''
  ].filter(Boolean).join(' ');
}

const actionFlowPaletteItems = [
  { category: 'record', type: 'add_record', label: 'Add record', icon: 'A', help: 'Create a new record' },
  { category: 'record', type: 'update_record', label: 'Update record', icon: 'U', help: 'Change fields on a record' },
  { category: 'logic', type: 'condition', label: 'Condition', icon: '?', help: 'Split into Yes and No paths' },
  { category: 'logic', type: 'loop', label: 'Loop', icon: 'L', help: 'Repeat steps for each item' },
  { category: 'logic', type: 'parallel_branch', label: 'Parallel', icon: 'P', help: 'Run paths together' },
  { category: 'task_notification', type: 'create_task', label: 'Create task', icon: 'T', help: 'Create follow-up work' },
  { category: 'task_notification', type: 'send_notification', label: 'Notification', icon: 'N', help: 'Notify a person or role' },
  { category: 'restful_api', type: 'call_rest_api', label: 'Call API', icon: '↗', help: 'Run a connector interface' },
  { category: 'data_mapping', type: 'set_variable', label: 'Set value', icon: '=', help: 'Prepare data for later steps' },
  { category: 'data_mapping', type: 'transform_value', label: 'Transform value', icon: 'ƒ', help: 'Clean or convert a value' },
  { category: 'workflow', type: 'run_flow', label: 'Run flow', icon: 'R', help: 'Start another published flow' },
  { category: 'end', type: 'end', label: 'End', icon: 'E', help: 'Finish this path' }
];

function activeActionFlow() {
  return state.actionFlows.find((flow) => flow.flowKey === state.activeActionFlowKey) || null;
}

function actionFlowDefinition(flow = activeActionFlow()) {
  if (!flow) return { nodes: [], edges: [] };
  if (!flow.definition || typeof flow.definition !== 'object') flow.definition = {};
  if (!Array.isArray(flow.definition.nodes)) flow.definition.nodes = [];
  if (!Array.isArray(flow.definition.edges)) flow.definition.edges = [];
  return flow.definition;
}

function actionFlowNodeGlyph(node) {
  if (node.category === 'trigger') return '▶';
  return actionFlowPaletteItems.find((item) => item.type === node.type)?.icon || String(node.label || node.type || 'A').slice(0, 1).toUpperCase();
}

function actionFlowNodeKind(node) {
  if (node.category === 'trigger') return 'Trigger';
  if (node.category === 'logic') return 'Logic';
  return titleCaseMessage(String(node.category || 'action').replaceAll('_', ' '));
}

function actionFlowNodePosition(node, index) {
  return {
    x: Number.isFinite(Number(node.x)) ? Number(node.x) : 190 + (index * 210),
    y: Number.isFinite(Number(node.y)) ? Number(node.y) : 380
  };
}

function actionFlowCanvasBounds(definition = actionFlowDefinition()) {
  const positions = (definition.nodes || []).map((node, index) => actionFlowNodePosition(node, index));
  const farthestX = positions.length ? Math.max(...positions.map((position) => position.x)) : 0;
  const farthestY = positions.length ? Math.max(...positions.map((position) => position.y)) : 0;
  return {
    width: Math.max(1400, Math.ceil((farthestX + 220) / 200) * 200),
    height: Math.max(900, Math.ceil((farthestY + 190) / 150) * 150)
  };
}

function actionFlowEdgePath(from, to) {
  const bend = Math.max(70, Math.abs(to.x - from.x) * .46);
  return `M ${from.x + 40} ${from.y} C ${from.x + bend} ${from.y}, ${to.x - bend} ${to.y}, ${to.x - 40} ${to.y}`;
}

function actionFlowEdgeLabel(edge, from, to) {
  const outcome = String(edge.outcome || edge.label || '').toLowerCase();
  if (!['yes', 'no', 'error', 'body', 'done'].includes(outcome) && !outcome.startsWith('branch')) return '';
  const x = (from.x + to.x) / 2;
  const y = (from.y + to.y) / 2 - 13;
  const label = outcome === 'yes' ? 'Yes' : outcome === 'no' ? 'No' : outcome === 'error' ? 'Error' : outcome === 'body' ? 'Body' : outcome === 'done' ? 'Done' : titleCaseMessage(outcome.replace('_', ' '));
  const width = Math.max(38, label.length * 7 + 14);
  return `<g class="action-flow-edge-label is-${outcome}" transform="translate(${x} ${y})"><rect x="-${width / 2}" y="-10" width="${width}" height="20" rx="10"></rect><text y="4">${label}</text></g>`;
}

function actionFlowUpdatedLabel(value) {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) return 'Not available';
  return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function renderActionFlowManagement() {
  const rows = $('#actionFlowManagementRows');
  if (!rows) return;
  const query = state.actionFlowSearch.trim().toLowerCase();
  const filtered = state.actionFlows.filter((flow) => {
    const statusMatches = state.actionFlowStatusFilter === 'all' || flow.status === state.actionFlowStatusFilter;
    const searchMatches = !query || `${flow.name} ${flow.flowKey} ${flow.triggerType} ${flow.triggerModule}`.toLowerCase().includes(query);
    return statusMatches && searchMatches;
  });
  $('#actionFlowTotalCount').textContent = state.actionFlows.length;
  $('#actionFlowEnabledCount').textContent = state.actionFlows.filter((flow) => flow.status === 'enabled').length;
  $('#actionFlowDraftCount').textContent = state.actionFlows.filter((flow) => flow.status === 'draft').length;
  $('#actionFlowDisabledCount').textContent = state.actionFlows.filter((flow) => flow.status === 'disabled').length;
  $$('.action-flow-filter-tabs [data-action-flow-filter]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.actionFlowFilter === state.actionFlowStatusFilter);
  });
  rows.innerHTML = filtered.map((flow) => {
    const definition = flow.definition && typeof flow.definition === 'object' ? flow.definition : {};
    const stepCount = Array.isArray(definition.nodes) ? definition.nodes.length : 0;
    return `<tr data-managed-action-flow="${escapeHtml(flow.flowKey)}">
      <td><div class="action-flow-name-cell"><span class="action-flow-name-icon">↗</span><span><strong>${escapeHtml(flow.name)}</strong><small>${escapeHtml(flow.description || flow.flowKey)}</small></span></div></td>
      <td><span class="action-flow-trigger-cell"><i></i>${escapeHtml(titleCaseMessage(flow.triggerType || 'manual'))}</span></td>
      <td>${escapeHtml(titleCaseMessage(flow.triggerModule || 'Any module'))}</td>
      <td>${stepCount}</td>
      <td><span class="action-flow-management-status status-${escapeHtml(flow.status || 'draft')}">${escapeHtml(titleCaseMessage(flow.status || 'draft'))}</span></td>
      <td>${escapeHtml(actionFlowUpdatedLabel(flow.updatedAt))}</td>
      <td><div class="action-flow-management-actions"><button type="button" class="secondary" data-check-managed-flow="${escapeHtml(flow.flowKey)}">Check</button><button type="button" class="open-flow-canvas-button" data-open-flow-canvas="${escapeHtml(flow.flowKey)}">Open canvas →</button><button type="button" class="link-button danger-link" data-delete-managed-flow="${escapeHtml(flow.flowKey)}">Delete</button></div></td>
    </tr>`;
  }).join('') || '<tr><td colspan="7" class="action-flow-management-empty"><strong>No Automation Flows found</strong><span>Change the filter or create a new automation.</span></td></tr>';
}

function showActionFlowManagement() {
  if (deferBuilderLeave(['automation'], showActionFlowManagement)) return;
  state.actionFlowMode = 'management';
  state.selectedActionFlowNodeId = '';
  state.actionFlowDirty = false;
  state.actionFlowRun = null;
  $('#actionFlowManagement').hidden = false;
  $('#actionFlowStudio').hidden = true;
  renderActionFlowManagement();
}

function openActionFlowCanvas(flowKey) {
  if (deferBuilderLeave(['automation'], () => openActionFlowCanvas(flowKey))) return;
  const flow = state.actionFlows.find((item) => item.flowKey === flowKey);
  if (!flow) return;
  state.activeActionFlowKey = flow.flowKey;
  state.actionFlowMode = 'canvas';
  state.selectedActionFlowNodeId = flow.definition?.nodes?.[0]?.id || '';
  state.actionFlowDirty = false;
  state.actionFlowRun = null;
  $('#actionFlowManagement').hidden = true;
  $('#actionFlowStudio').hidden = false;
  renderActionFlowStudio();
  beginBuilderDraft('automation');
  requestAnimationFrame(() => {
    const viewport = $('#actionFlowCanvasViewport');
    if (viewport) viewport.scrollTo({ left: 100, top: 0 });
  });
}

function renderActionFlowList() {
  const list = $('#actionFlowList');
  if (!list) return;
  const query = state.actionFlowSearch.trim().toLowerCase();
  const flows = state.actionFlows.filter((flow) => !query || `${flow.name} ${flow.flowKey}`.toLowerCase().includes(query));
  list.innerHTML = flows.map((flow) => `
    <button type="button" class="action-flow-list-button ${flow.flowKey === state.activeActionFlowKey ? 'is-active' : ''}" data-action-flow-key="${escapeHtml(flow.flowKey)}">
      <span><strong>${escapeHtml(flow.name)}</strong><small>${escapeHtml(titleCaseMessage(flow.triggerType || 'manual'))}</small></span>
      <i class="status-${escapeHtml(flow.status || 'draft')}" aria-label="${escapeHtml(flow.status || 'draft')}"></i>
    </button>
  `).join('') || '<div class="action-flow-list-empty">No matching flows</div>';
}

function renderActionFlowPalette() {
  const palette = $('#actionFlowPalette');
  if (!palette) return;
  const disabled = !activeActionFlow();
  palette.innerHTML = actionFlowPaletteItems.map((item) => `
    <button type="button" class="action-flow-palette-button" data-flow-node-type="${item.type}" data-flow-node-category="${item.category}" ${disabled ? 'disabled' : ''}>
      <i class="action-flow-palette-icon" aria-hidden="true">${item.icon}</i>
      <span><strong>${item.label}</strong><small>${item.help}</small></span>
    </button>
  `).join('');
}

const actionFlowConditionOperatorLabels = {
  equals: 'Equals',
  not_equals: 'Does not equal',
  contains: 'Contains',
  starts_with: 'Starts with',
  ends_with: 'Ends with',
  greater_than: 'Greater than',
  less_than: 'Less than',
  empty: 'Is empty',
  not_empty: 'Is not empty'
};

function actionFlowConditionOperators(type = 'text') {
  if (['int', 'integer', 'decimal', 'decimals', 'number', 'date', 'datetime'].includes(type)) {
    return ['equals', 'not_equals', 'greater_than', 'less_than', 'empty', 'not_empty'];
  }
  if (['checkbox', 'boolean'].includes(type)) return ['equals', 'not_equals'];
  if (['select', 'dropdownbox', 'owner', 'browser_button'].includes(type)) {
    return ['equals', 'not_equals', 'empty', 'not_empty'];
  }
  return ['equals', 'not_equals', 'contains', 'starts_with', 'ends_with', 'empty', 'not_empty'];
}

function actionFlowConditionSources(node) {
  const flow = activeActionFlow();
  const moduleKey = flow?.triggerModule || actionFlowDefinition().nodes.find((item) => item.category === 'trigger')?.config?.moduleKey || 'customers';
  const fields = moduleFields(moduleKey).filter((field) => !field.archived && field.tableType !== 'detail');
  const sources = [
    { value: 'trigger.recordId', label: 'Trigger · Record ID', type: 'number', group: 'Trigger' },
    { value: 'trigger.userId', label: 'Trigger · User ID', type: 'number', group: 'Trigger' },
    ...fields.map((field) => ({
      value: `current record.${field.fieldKey}`,
      label: `Current record · ${field.label || titleCaseMessage(field.fieldKey)}`,
      type: field.type || 'text',
      group: 'Current record'
    }))
  ];
  const nodes = actionFlowDefinition().nodes;
  const selectedIndex = nodes.findIndex((item) => item.id === node.id);
  nodes.slice(0, Math.max(0, selectedIndex)).filter((item) => item.category !== 'trigger').forEach((item) => {
    const prefix = item.label || titleCaseMessage(item.type);
    sources.push({ value: `outputs.${item.id}.status`, label: `${prefix} · Status`, type: 'text', group: 'Previous modules' });
    if (item.type === 'condition') sources.push({ value: `outputs.${item.id}.matched`, label: `${prefix} · Matched`, type: 'boolean', group: 'Previous modules' });
    if (['add_record', 'update_record'].includes(item.type)) sources.push({ value: `outputs.${item.id}.recordId`, label: `${prefix} · Record ID`, type: 'number', group: 'Previous modules' });
    if (item.type === 'call_rest_api') sources.push({ value: `outputs.${item.id}.httpStatus`, label: `${prefix} · Response status`, type: 'number', group: 'Previous modules' });
    if (item.type === 'transform_value' && item.config?.outputName) sources.push({ value: `outputs.${item.id}.values.${item.config.outputName}`, label: `${prefix} · ${titleCaseMessage(item.config.outputName)}`, type: 'text', group: 'Previous modules' });
    if (item.type === 'create_task') sources.push({ value: `outputs.${item.id}.taskId`, label: `${prefix} · Task ID`, type: 'number', group: 'Previous modules' });
    if (item.type === 'send_notification') sources.push({ value: `outputs.${item.id}.notificationId`, label: `${prefix} · Notification ID`, type: 'number', group: 'Previous modules' });
  });
  return sources;
}

const actionFlowMappingNodeTypes = new Set(['add_record', 'update_record', 'set_variable', 'call_rest_api', 'run_flow']);

function actionFlowMappingSources(node) {
  const sources = actionFlowConditionSources(node);
  const nodes = actionFlowDefinition().nodes;
  const selectedIndex = nodes.findIndex((item) => item.id === node.id);
  nodes.slice(0, Math.max(0, selectedIndex)).filter((item) => item.category !== 'trigger').forEach((item) => {
    const prefix = item.label || titleCaseMessage(item.type);
    if (item.type === 'call_rest_api') {
      sources.push({ value: `outputs.${item.id}.responseBody`, label: `${prefix} · Response body`, type: 'object', group: prefix });
      sources.push({ value: `outputs.${item.id}.responseHeaders`, label: `${prefix} · Response headers`, type: 'object', group: prefix });
    }
    if (item.type === 'transform_value' && item.config?.outputName) {
      sources.push({ value: `outputs.${item.id}.values.${item.config.outputName}`, label: `${prefix} · ${titleCaseMessage(item.config.outputName)}`, type: 'text', group: prefix });
    }
    if (item.type === 'create_task') sources.push({ value: `outputs.${item.id}.taskId`, label: `${prefix} · Task ID`, type: 'number', group: prefix });
    if (item.type === 'send_notification') sources.push({ value: `outputs.${item.id}.notificationId`, label: `${prefix} · Notification ID`, type: 'number', group: prefix });
    const mappings = Array.isArray(item.config?.fieldMappings) ? item.config.fieldMappings : [];
    mappings.filter((mapping) => mapping.target).forEach((mapping) => {
      sources.push({
        value: `outputs.${item.id}.values.${mapping.target}`,
        label: `${prefix} · ${titleCaseMessage(mapping.target)}`,
        type: 'text',
        group: prefix
      });
    });
  });
  return sources.filter((source, index, items) => items.findIndex((item) => item.value === source.value) === index);
}

function actionFlowMappingTextKey(node) {
  return node.type === 'call_rest_api' ? 'requestMapping' : 'fieldMappingText';
}

function parseLegacyActionFlowMappings(node) {
  const text = node.config?.[actionFlowMappingTextKey(node)] || '';
  return String(text).split(/\r?\n/).map((line, index) => {
    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) return null;
    const target = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    const expression = /^(trigger\.|current record\.|outputs\.|\{\{)/i.test(value);
    if (!expression && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) value = value.slice(1, -1);
    return { id: `mapping_legacy_${index + 1}`, target, mode: expression ? 'expression' : 'fixed', value };
  }).filter(Boolean);
}

function actionFlowMappingState(node) {
  const configured = Array.isArray(node.config?.fieldMappings) ? node.config.fieldMappings : [];
  return (configured.length ? configured : parseLegacyActionFlowMappings(node)).map((mapping, index) => ({
    id: mapping.id || `mapping_${index + 1}`,
    target: mapping.target || '',
    mode: mapping.mode === 'expression' ? 'expression' : 'fixed',
    value: mapping.value ?? ''
  }));
}

function serializeActionFlowMappings(mappings) {
  return mappings.filter((mapping) => mapping.target).map((mapping) => {
    const rawValue = String(mapping.value ?? '');
    const value = mapping.mode === 'expression' ? rawValue : JSON.stringify(rawValue);
    return `${mapping.target} = ${value}`;
  }).join('\n');
}

function saveActionFlowMappingState(node, mappings) {
  node.config = node.config || {};
  node.config.fieldMappings = mappings;
  node.config[actionFlowMappingTextKey(node)] = serializeActionFlowMappings(mappings);
  state.actionFlowDirty = true;
  $('#actionFlowSaveState').textContent = 'Unsaved canvas changes';
  $('#saveActionFlowButton').disabled = false;
}

function selectedActionFlowMappingNode() {
  const node = actionFlowDefinition().nodes.find((item) => item.id === state.selectedActionFlowNodeId);
  return actionFlowMappingNodeTypes.has(node?.type) ? node : null;
}

function addActionFlowMapping() {
  const node = selectedActionFlowMappingNode();
  if (!node) return;
  const mappings = actionFlowMappingState(node);
  mappings.push({ id: `mapping_${Date.now().toString(36)}`, target: '', mode: 'expression', value: '' });
  saveActionFlowMappingState(node, mappings);
  renderActionFlowInspector();
}

function removeActionFlowMapping(mappingId) {
  const node = selectedActionFlowMappingNode();
  if (!node) return;
  saveActionFlowMappingState(node, actionFlowMappingState(node).filter((mapping) => mapping.id !== mappingId));
  renderActionFlowInspector();
}

function updateActionFlowMapping(mappingId, field, value, rerender = false) {
  const node = selectedActionFlowMappingNode();
  if (!node || !['target', 'mode', 'value', 'targetModule'].includes(field)) return;
  if (field === 'targetModule') {
    node.config = node.config || {};
    node.config.targetModule = value;
    node.config.target = 'current_record';
    state.actionFlowDirty = true;
    renderActionFlowInspector();
    return;
  }
  const mappings = actionFlowMappingState(node);
  const mapping = mappings.find((item) => item.id === mappingId);
  if (!mapping) return;
  mapping[field] = value;
  saveActionFlowMappingState(node, mappings);
  if (rerender) renderActionFlowInspector();
}

function renderActionFlowMappingBuilder(node) {
  const mappings = actionFlowMappingState(node);
  const sources = actionFlowMappingSources(node);
  const sourceSuggestions = sources.map((source) => `<option value="${escapeHtml(source.value)}">${escapeHtml(`${source.group} · ${source.label}`)}</option>`).join('');
  const targetModule = node.config?.targetModule || activeActionFlow()?.triggerModule || 'customers';
  const targetFields = moduleFields(targetModule).filter((field) => !field.archived && field.tableType !== 'detail');
  const targetControl = (mapping) => ['add_record', 'update_record'].includes(node.type)
    ? `<select data-mapping-field="target" aria-label="Target field"><option value="">Choose target field</option>${targetFields.map((field) => `<option value="${escapeHtml(field.fieldKey)}" ${mapping.target === field.fieldKey ? 'selected' : ''}>${escapeHtml(field.label || titleCaseMessage(field.fieldKey))}</option>`).join('')}</select>`
    : `<input data-mapping-field="target" value="${escapeHtml(mapping.target)}" placeholder="${node.type === 'call_rest_api' ? 'Request field' : 'Variable name'}">`;
  const rows = mappings.map((mapping) => `<div class="action-flow-mapping-row" data-action-flow-mapping-id="${escapeHtml(mapping.id)}">
    <div class="action-flow-mapping-row-heading"><strong>Map field</strong><button type="button" data-remove-action-flow-mapping="${escapeHtml(mapping.id)}" aria-label="Remove mapping">×</button></div>
    ${targetControl(mapping)}
    <div class="action-flow-mapping-mode" role="group" aria-label="Value mode"><button type="button" data-set-mapping-mode="fixed" class="${mapping.mode === 'fixed' ? 'is-active' : ''}">Fixed</button><button type="button" data-set-mapping-mode="expression" class="${mapping.mode === 'expression' ? 'is-active' : ''}">Expression</button></div>
    ${mapping.mode === 'expression'
      ? `<input data-mapping-field="value" list="actionFlowMappingSources_${escapeHtml(mapping.id)}" value="${escapeHtml(mapping.value)}" placeholder="Choose or type an output path" aria-label="Source value"><datalist id="actionFlowMappingSources_${escapeHtml(mapping.id)}">${sourceSuggestions}</datalist>`
      : `<input data-mapping-field="value" value="${escapeHtml(mapping.value)}" placeholder="Enter a value">`}
  </div>`).join('');
  const moduleOptions = configModules.map((module) => `<option value="${escapeHtml(module.key)}" ${module.key === targetModule ? 'selected' : ''}>${escapeHtml(module.name)}</option>`).join('');
  return `<div class="action-flow-inspector-section action-flow-mapping-builder">
    <span>Field mapping</span>
    ${['add_record', 'update_record'].includes(node.type) ? `<label>Target module<select data-mapping-field="targetModule">${moduleOptions}</select></label>` : ''}
    <p class="action-flow-mapping-help">Map fixed values or data from the trigger, current record, and previous modules.</p>
    <div class="action-flow-mapping-rows">${rows || '<div class="action-flow-mapping-empty">No mappings yet. Add one to pass data into this module.</div>'}</div>
    <button type="button" class="secondary action-flow-add-mapping" id="addActionFlowMapping">+ Add mapping</button>
    <details class="action-flow-mapping-preview"><summary>Expression preview</summary><code>${escapeHtml(serializeActionFlowMappings(mappings) || 'No mapping expressions')}</code></details>
  </div>`;
}

function parseLegacyActionFlowCondition(condition = '') {
  const match = String(condition).trim().match(/^(.+?)\s+(equals|is|not_equals|is_not|contains|starts_with|ends_with|empty|not_empty|greater_than|less_than|=|==|!=|<>)\s*(.*)$/i);
  if (!match) return null;
  const aliases = { is: 'equals', '=': 'equals', '==': 'equals', is_not: 'not_equals', '!=': 'not_equals', '<>': 'not_equals' };
  let value = match[3] || '';
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  return { id: 'rule_legacy_1', left: match[1].trim(), operator: aliases[match[2].toLowerCase()] || match[2].toLowerCase(), value };
}

function actionFlowConditionState(node) {
  const configuredRules = Array.isArray(node.config?.conditionRules) ? node.config.conditionRules : [];
  const legacyRule = !configuredRules.length ? parseLegacyActionFlowCondition(node.config?.condition) : null;
  const rules = (configuredRules.length ? configuredRules : (legacyRule ? [legacyRule] : []))
    .map((rule, index) => ({ id: rule.id || `rule_${index + 1}`, left: rule.left || '', operator: rule.operator || 'equals', value: rule.value ?? '' }));
  return { combinator: node.config?.conditionCombinator === 'or' ? 'or' : 'and', rules };
}

function serializeActionFlowConditionRule(rule) {
  if (!rule?.left || !rule.operator) return '';
  if (['empty', 'not_empty'].includes(rule.operator)) return `${rule.left} ${rule.operator}`;
  const rawValue = String(rule.value ?? '').trim();
  const value = /^-?\d+(\.\d+)?$/.test(rawValue) || ['true', 'false'].includes(rawValue.toLowerCase())
    ? rawValue
    : JSON.stringify(rawValue);
  return `${rule.left} ${rule.operator} ${value}`;
}

function actionFlowConditionSummary(node, conditionState = actionFlowConditionState(node)) {
  const sources = actionFlowConditionSources(node);
  const summaries = conditionState.rules.map((rule) => {
    const source = sources.find((item) => item.value === rule.left);
    const operator = actionFlowConditionOperatorLabels[rule.operator] || titleCaseMessage(rule.operator);
    const value = ['empty', 'not_empty'].includes(rule.operator) ? '' : ` “${rule.value ?? ''}”`;
    return `${source?.label || rule.left || 'Choose a field'} ${operator.toLowerCase()}${value}`;
  });
  return summaries.length ? summaries.join(` ${conditionState.combinator.toUpperCase()} `) : 'Add a rule to define the Yes path.';
}

function saveActionFlowConditionState(node, conditionState) {
  node.config = node.config || {};
  node.config.conditionRules = conditionState.rules;
  node.config.conditionCombinator = conditionState.combinator;
  node.config.condition = serializeActionFlowConditionRule(conditionState.rules[0]);
  state.actionFlowDirty = true;
  $('#actionFlowSaveState').textContent = 'Unsaved canvas changes';
  $('#saveActionFlowButton').disabled = false;
}

function selectedActionFlowConditionNode() {
  const node = actionFlowDefinition().nodes.find((item) => item.id === state.selectedActionFlowNodeId);
  return node?.type === 'condition' ? node : null;
}

function refreshActionFlowConditionSummary(node, conditionState) {
  const summary = $('#actionFlowConditionSummary');
  if (summary) summary.textContent = actionFlowConditionSummary(node, conditionState);
}

function addActionFlowConditionRule() {
  const node = selectedActionFlowConditionNode();
  if (!node) return;
  const conditionState = actionFlowConditionState(node);
  conditionState.rules.push({ id: `rule_${Date.now().toString(36)}_${conditionState.rules.length + 1}`, left: '', operator: 'equals', value: '' });
  saveActionFlowConditionState(node, conditionState);
  renderActionFlowInspector();
}

function removeActionFlowConditionRule(ruleId) {
  const node = selectedActionFlowConditionNode();
  if (!node) return;
  const conditionState = actionFlowConditionState(node);
  conditionState.rules = conditionState.rules.filter((rule) => rule.id !== ruleId);
  saveActionFlowConditionState(node, conditionState);
  renderActionFlowInspector();
}

function setActionFlowConditionCombinator(combinator) {
  const node = selectedActionFlowConditionNode();
  if (!node || !['and', 'or'].includes(combinator)) return;
  const conditionState = actionFlowConditionState(node);
  conditionState.combinator = combinator;
  saveActionFlowConditionState(node, conditionState);
  renderActionFlowInspector();
}

function updateActionFlowConditionRule(ruleId, field, value, rerender = false) {
  const node = selectedActionFlowConditionNode();
  if (!node) return;
  const conditionState = actionFlowConditionState(node);
  const rule = conditionState.rules.find((item) => item.id === ruleId);
  if (!rule || !['left', 'operator', 'value'].includes(field)) return;
  rule[field] = value;
  if (field === 'left') {
    const sourceType = actionFlowConditionSources(node).find((source) => source.value === value)?.type || 'text';
    const operators = actionFlowConditionOperators(sourceType);
    if (!operators.includes(rule.operator)) rule.operator = operators[0];
    if (sourceType === 'boolean' && !['true', 'false'].includes(String(rule.value))) rule.value = 'true';
  }
  saveActionFlowConditionState(node, conditionState);
  if (rerender) renderActionFlowInspector();
  else refreshActionFlowConditionSummary(node, conditionState);
}

function renderActionFlowConditionBuilder(node) {
  const conditionState = actionFlowConditionState(node);
  const sources = actionFlowConditionSources(node);
  const sourceGroups = [...new Set(sources.map((source) => source.group))];
  const sourceOptions = (selectedValue) => sourceGroups.map((group) => `<optgroup label="${escapeHtml(group)}">${sources
    .filter((source) => source.group === group)
    .map((source) => `<option value="${escapeHtml(source.value)}" ${source.value === selectedValue ? 'selected' : ''}>${escapeHtml(source.label)}</option>`)
    .join('')}</optgroup>`).join('');
  const rows = conditionState.rules.map((rule, index) => {
    const sourceType = sources.find((source) => source.value === rule.left)?.type || 'text';
    const operators = actionFlowConditionOperators(sourceType);
    const operator = operators.includes(rule.operator) ? rule.operator : operators[0];
    const needsValue = !['empty', 'not_empty'].includes(operator);
    const valueControl = sourceType === 'boolean'
      ? `<select data-condition-rule-field="value"><option value="true" ${String(rule.value) === 'true' ? 'selected' : ''}>True</option><option value="false" ${String(rule.value) === 'false' ? 'selected' : ''}>False</option></select>`
      : `<input data-condition-rule-field="value" type="${['int', 'integer', 'decimal', 'decimals', 'number'].includes(sourceType) ? 'number' : (['date', 'datetime'].includes(sourceType) ? 'date' : 'text')}" value="${escapeHtml(rule.value ?? '')}" placeholder="Comparison value">`;
    return `<div class="action-flow-condition-rule" data-condition-rule-id="${escapeHtml(rule.id)}">
      <div class="action-flow-condition-rule-heading"><strong>${index ? conditionState.combinator.toUpperCase() : 'IF'}</strong><button type="button" data-remove-condition-rule="${escapeHtml(rule.id)}" aria-label="Remove condition">×</button></div>
      <select data-condition-rule-field="left" aria-label="Condition field"><option value="">Choose a field</option>${sourceOptions(rule.left)}</select>
      <select data-condition-rule-field="operator" aria-label="Condition operator">${operators.map((item) => `<option value="${item}" ${item === operator ? 'selected' : ''}>${actionFlowConditionOperatorLabels[item]}</option>`).join('')}</select>
      <div class="action-flow-condition-value" ${needsValue ? '' : 'hidden'}>${valueControl}</div>
    </div>`;
  }).join('');
  return `<div class="action-flow-inspector-section action-flow-condition-builder">
    <span>Condition rules</span>
    <div class="action-flow-condition-match"><small>Match</small><div role="group" aria-label="Condition matching"><button type="button" data-condition-combinator="and" class="${conditionState.combinator === 'and' ? 'is-active' : ''}">All</button><button type="button" data-condition-combinator="or" class="${conditionState.combinator === 'or' ? 'is-active' : ''}">Any</button></div></div>
    <div class="action-flow-condition-rules">${rows || '<div class="action-flow-condition-empty">No rules yet. Add one to configure this branch.</div>'}</div>
    <button type="button" class="secondary action-flow-add-condition" id="addActionFlowConditionRule">+ Add condition</button>
    <div class="action-flow-condition-summary"><small>Yes when</small><p id="actionFlowConditionSummary">${escapeHtml(actionFlowConditionSummary(node, conditionState))}</p></div>
  </div>`;
}

function actionFlowUserOptions(selectedValue = '') {
  const selected = String(selectedValue || '');
  return [
    `<option value="trigger.userId" ${selected === 'trigger.userId' ? 'selected' : ''}>User who triggered the flow</option>`,
    ...state.users.map((user) => {
      const value = String(user.id);
      const label = user.name || user.fullName || user.email || `User ${user.id}`;
      return `<option value="${escapeHtml(value)}" ${selected === value ? 'selected' : ''}>${escapeHtml(label)}</option>`;
    })
  ].join('');
}

function renderActionFlowTriggerConfig(node) {
  if (node.category !== 'trigger') return '';
  const flow = activeActionFlow();
  const triggerType = flow?.triggerType || node.type || 'record_created';
  const triggerModule = flow?.triggerModule || node.config?.moduleKey || 'customers';
  const triggerOptions = [
    ['record_created', 'When a record is created'],
    ['record_updated', 'When a record is updated'],
    ['status_changed', 'When status changes'],
    ['record_deleted', 'When a record is deleted'],
    ['workflow_event', 'When an approval workflow event occurs'],
    ['manual', 'Manually'],
    ['scheduled', 'On a schedule']
  ];
  const moduleOptions = configModules.map((module) => `<option value="${escapeHtml(module.key)}" ${module.key === triggerModule ? 'selected' : ''}>${escapeHtml(module.name)}</option>`).join('');
  const workflowOptions = state.workflowDefinitions.map((workflow) => `<option value="${escapeHtml(workflow.workflowKey)}" ${workflow.workflowKey === triggerModule ? 'selected' : ''}>${escapeHtml(workflow.name)}</option>`).join('');
  const workflowEvents = ['workflow.submitted', 'workflow.completed', 'workflow.stage.started', 'workflow.stage.waiting', 'workflow.stage.skipped', 'workflow.stage.auto_approved', 'workflow.stage.approved', 'workflow.reminder_due', 'workflow.escalated', 'workflow.assignment.delegated', 'workflow.assignment.reassigned', 'workflow.approved', 'workflow.rejected', 'workflow.returned', 'workflow.resubmitted', 'workflow.withdrawn', 'workflow.cancelled'];
  const selectedEvent = node.config?.eventTypes?.[0] || '';
  return `<div class="action-flow-inspector-section action-flow-operation-config">
    <span>Start settings</span>
    <label>Start when<select data-trigger-config-field="triggerType">${triggerOptions.map(([value, label]) => `<option value="${value}" ${value === triggerType ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
    ${triggerType === 'workflow_event' ? `
      <label>Approval workflow<select data-trigger-config-field="triggerModule"><option value="">Any workflow</option>${workflowOptions}</select></label>
      <label>Event<select data-trigger-config-field="workflowEventType"><option value="">Any event</option>${workflowEvents.map((eventType) => `<option value="${eventType}" ${selectedEvent === eventType ? 'selected' : ''}>${escapeHtml(titleCaseMessage(eventType.replace('workflow.', '')))}</option>`).join('')}</select></label>
      <label>Stage key <span class="muted">(optional)</span><input data-trigger-config-field="stageKey" value="${escapeHtml(node.config?.stageKey || '')}" placeholder="manager_approval"></label>
      <label>Connection / outcome <span class="muted">(optional)</span><input data-trigger-config-field="connectionKey" value="${escapeHtml(node.config?.connectionKey || '')}" placeholder="approved"></label>
    ` : `<label>Source module<select data-trigger-config-field="triggerModule">${moduleOptions}</select></label>`}
    ${triggerType === 'scheduled' ? `<div class="action-flow-schedule-grid">
      <label>Run every<input data-trigger-config-field="scheduleEvery" type="number" min="1" max="1000" value="${escapeHtml(node.config?.scheduleEvery || 1)}"></label>
      <label>Interval<select data-trigger-config-field="scheduleUnit"><option value="minutes" ${node.config?.scheduleUnit === 'minutes' ? 'selected' : ''}>Minutes</option><option value="hours" ${!node.config?.scheduleUnit || node.config?.scheduleUnit === 'hours' ? 'selected' : ''}>Hours</option><option value="days" ${node.config?.scheduleUnit === 'days' ? 'selected' : ''}>Days</option></select></label>
      <label class="action-flow-schedule-start">Start at <span class="muted">(optional)</span><input data-trigger-config-field="scheduleStartAt" type="datetime-local" value="${escapeHtml(node.config?.scheduleStartAt || '')}"></label>
    </div>` : ''}
    <p class="action-flow-config-help">This controls which event starts the entire flow.</p>
  </div>`;
}

function renderActionFlowOperationalConfig(node) {
  const config = node.config || {};
  if (node.type === 'create_task') {
    return `<div class="action-flow-inspector-section action-flow-operation-config">
      <span>Task details</span>
      <label>Title<input data-action-config-field="title" value="${escapeHtml(config.title || '')}" placeholder="Follow up with {{ current record.company }}"></label>
      <label>Description<textarea data-action-config-field="description" rows="3" placeholder="What needs to be done">${escapeHtml(config.description || '')}</textarea></label>
      <label>Assignee<select data-action-config-field="assignee">${actionFlowUserOptions(config.assignee)}</select></label>
      <label>Due date<input data-action-config-field="dueDate" value="${escapeHtml(config.dueDate || '')}" placeholder="2026-07-30 or an expression"></label>
      <label>Priority<select data-action-config-field="priority"><option value="low" ${config.priority === 'low' ? 'selected' : ''}>Low</option><option value="normal" ${!config.priority || config.priority === 'normal' ? 'selected' : ''}>Normal</option><option value="high" ${config.priority === 'high' ? 'selected' : ''}>High</option><option value="urgent" ${config.priority === 'urgent' ? 'selected' : ''}>Urgent</option></select></label>
      <p class="action-flow-config-help">Text fields accept current-record and previous-module expressions.</p>
    </div>`;
  }
  if (node.type === 'send_notification') {
    return `<div class="action-flow-inspector-section action-flow-operation-config">
      <span>Notification details</span>
      <label>Recipient<select data-action-config-field="recipient">${actionFlowUserOptions(config.recipient)}</select></label>
      <label>Title<input data-action-config-field="title" value="${escapeHtml(config.title || '')}" placeholder="Record needs attention"></label>
      <label>Message<textarea data-action-config-field="message" rows="4" placeholder="Write the notification message">${escapeHtml(config.message || '')}</textarea></label>
      <p class="action-flow-config-help">This creates an in-app notification for the selected user.</p>
    </div>`;
  }
  if (node.type === 'transform_value') {
    const sourceMode = config.sourceMode === 'fixed' ? 'fixed' : 'expression';
    const sourceSuggestions = actionFlowMappingSources(node).map((source) => `<option value="${escapeHtml(source.value)}">${escapeHtml(source.label)}</option>`).join('');
    const operations = [
      ['trim', 'Trim spaces'], ['uppercase', 'Uppercase'], ['lowercase', 'Lowercase'],
      ['number', 'Convert to number'], ['boolean', 'Convert to Yes/No'], ['json_parse', 'Parse JSON']
    ];
    return `<div class="action-flow-inspector-section action-flow-operation-config">
      <span>Transformation</span>
      <label>Source value</label>
      <div class="action-flow-mapping-mode" role="group" aria-label="Source value mode"><button type="button" data-set-transform-source-mode="fixed" class="${sourceMode === 'fixed' ? 'is-active' : ''}">Fixed</button><button type="button" data-set-transform-source-mode="expression" class="${sourceMode === 'expression' ? 'is-active' : ''}">Expression</button></div>
      ${sourceMode === 'expression'
        ? `<input data-action-config-field="sourceValue" list="actionFlowTransformSources_${escapeHtml(node.id)}" value="${escapeHtml(config.sourceValue || '')}" placeholder="Choose or type an output path"><datalist id="actionFlowTransformSources_${escapeHtml(node.id)}">${sourceSuggestions}</datalist>`
        : `<input data-action-config-field="sourceValue" value="${escapeHtml(config.sourceValue || '')}" placeholder="Enter a fixed value">`}
      <label>Operation<select data-action-config-field="operation">${operations.map(([value, label]) => `<option value="${value}" ${config.operation === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
      <label>Save result as<input data-action-config-field="outputName" value="${escapeHtml(config.outputName || '')}" placeholder="cleanCompany"></label>
      <div class="action-flow-transform-output"><small>Use in later modules</small><code>outputs.${escapeHtml(node.id)}.values.${escapeHtml(config.outputName || 'output')}</code></div>
    </div>`;
  }
  if (node.type === 'loop') {
    const sourceSuggestions = actionFlowMappingSources(node).map((source) => `<option value="${escapeHtml(source.value)}">${escapeHtml(source.label)}</option>`).join('');
    return `<div class="action-flow-inspector-section action-flow-operation-config">
      <span>Loop settings</span>
      <label>Array source<input data-action-config-field="sourceValue" list="actionFlowLoopSources_${escapeHtml(node.id)}" value="${escapeHtml(config.sourceValue || '')}" placeholder="outputs.api_1.values.items"></label>
      <datalist id="actionFlowLoopSources_${escapeHtml(node.id)}">${sourceSuggestions}</datalist>
      <label>Maximum items<input data-action-config-field="maxIterations" type="number" min="1" max="1000" value="${escapeHtml(config.maxIterations || 100)}"></label>
      <div class="action-flow-transform-output"><small>Available inside Body</small><code>loop.item · loop.index · loop.number</code></div>
      <p class="action-flow-config-help">Body runs once per item. Done continues after every item finishes.</p>
    </div>`;
  }
  if (node.type === 'parallel_branch') {
    const definition = actionFlowDefinition();
    const branches = definition.edges
      .filter((edge) => edge.from === node.id && String(edge.outcome || '').toLowerCase().startsWith('branch'))
      .sort((left, right) => String(left.outcome).localeCompare(String(right.outcome), undefined, { numeric: true }));
    const branchCount = Math.max(2, Number(config.branchCount || 0), branches.length);
    const branchRows = Array.from({ length: branchCount }, (_unused, index) => {
      const branchNumber = index + 1;
      const edge = branches.find((item) => String(item.outcome || '').toLowerCase() === `branch_${branchNumber}`);
      const target = edge ? definition.nodes.find((item) => item.id === edge.to) : null;
      return `<div class="action-flow-node-meta"><span>Branch ${branchNumber}</span><strong>${escapeHtml(target?.label || 'Empty')}</strong></div>`;
    }).join('');
    return `<div class="action-flow-inspector-section action-flow-operation-config">
      <span>Parallel paths</span>
      <div class="action-flow-parallel-branches">${branchRows || '<div class="action-flow-condition-empty">No branches added yet.</div>'}</div>
      <button type="button" class="secondary action-flow-add-condition" id="addActionFlowParallelBranch">+ Add branch</button>
      <p class="action-flow-config-help">Each Branch path starts together. This module waits until every path finishes.</p>
    </div>`;
  }
  if (node.type === 'run_flow') {
    const flowOptions = state.actionFlows
      .filter((flow) => flow.flowKey !== activeActionFlow()?.flowKey && flow.publishedVersion)
      .map((flow) => `<option value="${escapeHtml(flow.flowKey)}" ${config.flowKey === flow.flowKey ? 'selected' : ''}>${escapeHtml(flow.name)} · Published v${flow.publishedVersion}</option>`).join('');
    return `<div class="action-flow-inspector-section action-flow-operation-config">
      <span>Flow orchestration</span>
      <label>Published flow<select data-action-config-field="flowKey"><option value="">Choose a flow</option>${flowOptions}</select></label>
      <p class="action-flow-config-help">Mapped fields become the child flow's trigger data. Execution waits for that flow to finish.</p>
    </div>`;
  }
  return '';
}

function renderActionFlowReliabilityConfig(node) {
  if (node.category === 'trigger' || node.category === 'end') return '';
  const config = node.config || {};
  const attempts = Number(config.retryAttempts || 1);
  const onError = config.onError || 'stop';
  return `<div class="action-flow-inspector-section action-flow-operation-config">
    <span>Reliability</span>
    <div class="action-flow-retry-grid">
      <label>Attempts<select data-action-config-field="retryAttempts">${[1, 2, 3, 4, 5].map((value) => `<option value="${value}" ${value === attempts ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
      <label>Delay (ms)<input data-action-config-field="retryDelayMs" type="number" min="0" max="60000" step="100" value="${escapeHtml(config.retryDelayMs || 0)}"></label>
    </div>
    <label>If all attempts fail<select data-action-config-field="onError"><option value="stop" ${onError === 'stop' ? 'selected' : ''}>Stop the flow</option><option value="continue" ${onError === 'continue' ? 'selected' : ''}>Continue to next module</option><option value="error_branch" ${onError === 'error_branch' ? 'selected' : ''}>Follow an Error branch</option></select></label>
    ${onError === 'error_branch' ? '<p class="action-flow-error-branch-help">Connect the red Error path on the canvas to the recovery action.</p>' : ''}
  </div>`;
}

function updateActionFlowOperationalConfig(field, value) {
  const node = actionFlowDefinition().nodes.find((item) => item.id === state.selectedActionFlowNodeId);
  if (!node || !field) return;
  node.config = { ...(node.config || {}), [field]: value };
  state.actionFlowDirty = true;
  $('#actionFlowSaveState').textContent = 'Unsaved canvas changes';
  $('#saveActionFlowButton').disabled = false;
}

function updateActionFlowTriggerConfig(field, value) {
  const flow = activeActionFlow();
  const node = actionFlowDefinition(flow).nodes.find((item) => item.id === state.selectedActionFlowNodeId && item.category === 'trigger');
  if (!flow || !node || !['triggerType', 'triggerModule', 'workflowEventType', 'stageKey', 'connectionKey', 'scheduleEvery', 'scheduleUnit', 'scheduleStartAt'].includes(field)) return;
  if (field === 'triggerType') {
    flow.triggerType = value;
    node.type = value;
    if (value === 'scheduled') node.config = { scheduleEvery: 1, scheduleUnit: 'hours', ...(node.config || {}) };
    if (value === 'workflow_event') {
      flow.triggerModule = '';
      node.config = { workflowKey: '', eventTypes: [], stageKey: '', connectionKey: '' };
    }
  } else if (field === 'triggerModule') {
    flow.triggerModule = value;
    node.config = { ...(node.config || {}), moduleKey: value };
  } else if (field === 'workflowEventType') {
    node.config = { ...(node.config || {}), eventTypes: value ? [value] : [] };
  } else {
    node.config = { ...(node.config || {}), [field]: value };
  }
  state.actionFlowDirty = true;
  $('#actionFlowSaveState').textContent = 'Unsaved canvas changes';
  $('#saveActionFlowButton').disabled = false;
  renderActionFlowCanvas();
  renderActionFlowInspector();
}

function renderActionFlowInspector() {
  const inspector = $('#actionFlowInspector');
  if (!inspector) return;
  const definition = actionFlowDefinition();
  const node = definition.nodes.find((item) => item.id === state.selectedActionFlowNodeId);
  if (!node) {
    inspector.innerHTML = '<div class="action-flow-inspector-empty"><span>◎</span><strong>Select a module</strong><p>Choose a module on the canvas to review its role in this flow.</p></div>';
    return;
  }
  inspector.innerHTML = `
    <div class="action-flow-inspector-heading">
      <i class="action-flow-palette-icon" aria-hidden="true">${escapeHtml(actionFlowNodeGlyph(node))}</i>
      <div><strong>${escapeHtml(node.label || titleCaseMessage(node.type))}</strong><small>${escapeHtml(actionFlowNodeKind(node))}</small></div>
    </div>
    <div class="action-flow-inspector-section">
      <span>Module details</span>
      <label>Label<input id="actionFlowNodeLabel" value="${escapeHtml(node.label || '')}" maxlength="80"></label>
      <div class="action-flow-node-meta"><span>Type</span><strong>${escapeHtml(titleCaseMessage(node.type || 'action'))}</strong></div>
      <div class="action-flow-node-meta"><span>Node ID</span><strong>${escapeHtml(node.id)}</strong></div>
    </div>
    ${node.type === 'condition' ? renderActionFlowConditionBuilder(node) : ''}
    ${renderActionFlowTriggerConfig(node)}
    ${actionFlowMappingNodeTypes.has(node.type) ? renderActionFlowMappingBuilder(node) : ''}
    ${renderActionFlowOperationalConfig(node)}
    ${renderActionFlowReliabilityConfig(node)}
    ${renderActionFlowExecutionResult(node)}
    <div class="action-flow-inspector-section">
      <span>Connection</span>
      <div class="action-flow-node-meta"><span>Incoming</span><strong>${definition.edges.filter((edge) => edge.to === node.id).length}</strong></div>
      <div class="action-flow-node-meta"><span>Outgoing</span><strong>${definition.edges.filter((edge) => edge.from === node.id).length}</strong></div>
    </div>
    ${node.category === 'trigger' ? '' : '<button type="button" class="secondary action-flow-remove-node" id="removeActionFlowNode">Remove module</button>'}
  `;
}

function actionFlowNodeRunState(node) {
  const run = state.actionFlowRun;
  if (!run) return null;
  if (node.category === 'trigger') return { status: run.status === 'running' ? 'running' : 'success', durationMs: 0 };
  const step = (run.steps || []).find((item) => item.nodeId === node.id);
  if (step) return step;
  if (run.status === 'running') {
    const start = actionFlowDefinition().nodes.find((item) => item.category === 'trigger');
    const firstNodeId = actionFlowDefinition().edges.find((edge) => edge.from === start?.id)?.to;
    return { status: node.id === firstNodeId ? 'running' : 'queued' };
  }
  return { status: 'not_run' };
}

function actionFlowRunStatusIcon(status) {
  return { success: '✓', failed: '!', skipped: '–', running: '•', queued: '…', not_run: '–' }[status] || '';
}

function renderActionFlowExecutionResult(node) {
  const result = actionFlowNodeRunState(node);
  if (!result || state.actionFlowRun?.status === 'running') return '';
  const output = { ...result };
  delete output.startedAt;
  delete output.finishedAt;
  return `<div class="action-flow-inspector-section action-flow-execution-result is-${escapeHtml(result.status)}">
    <span>Last test run</span>
    <div class="action-flow-execution-summary"><i>${actionFlowRunStatusIcon(result.status)}</i><div><strong>${escapeHtml(titleCaseMessage(result.status || 'not_run'))}</strong><small>${Number.isFinite(Number(result.durationMs)) ? `${Number(result.durationMs)} ms` : 'This path did not run'}</small></div></div>
    ${result.error ? `<p class="action-flow-execution-error">${escapeHtml(result.error)}</p>` : ''}
    ${node.category === 'trigger' || result.status === 'not_run' ? '' : `<details class="action-flow-execution-output"><summary>View output</summary><pre>${escapeHtml(JSON.stringify(output, null, 2))}</pre></details>`}
  </div>`;
}

function renderActionFlowCanvas() {
  const canvas = $('#actionFlowCanvas');
  if (!canvas) return;
  const flow = activeActionFlow();
  const definition = actionFlowDefinition(flow);
  if (!flow) {
    canvas.innerHTML = '<div class="action-flow-empty-canvas"><span>+</span><strong>Build your first automation</strong><p>Create a flow, then add modules from the library. Every connection uses the same dotted path language.</p></div>';
    return;
  }
  const bounds = actionFlowCanvasBounds(definition);
  const positions = new Map(definition.nodes.map((node, index) => [node.id, actionFlowNodePosition(node, index)]));
  const edgeMarkup = definition.edges.map((edge) => {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) return '';
    const outcome = String(edge.outcome || edge.label || '').toLowerCase();
    const targetRun = actionFlowNodeRunState(definition.nodes.find((node) => node.id === edge.to));
    const runClass = targetRun && !['queued', 'not_run'].includes(targetRun.status) ? `is-run-${targetRun.status}` : '';
    return `<path class="action-flow-edge ${['yes', 'no', 'error'].includes(outcome) ? `is-${outcome}` : ''} ${runClass}" d="${actionFlowEdgePath(from, to)}"></path>${actionFlowEdgeLabel(edge, from, to)}`;
  }).join('');
  const nodeMarkup = definition.nodes.map((node, index) => {
    const position = positions.get(node.id);
    const runState = actionFlowNodeRunState(node);
    const classes = [node.category === 'trigger' ? 'is-trigger' : '', node.category === 'logic' ? 'is-logic' : '', node.category === 'end' ? 'is-end' : '', node.id === state.selectedActionFlowNodeId ? 'is-selected' : '', runState ? `run-${runState.status}` : ''].filter(Boolean).join(' ');
    return `<div class="action-flow-node-wrap ${classes}" data-flow-node-wrap="${escapeHtml(node.id)}" style="left:${position.x}px;top:${position.y}px">
      <span class="action-flow-port input" aria-hidden="true"></span>
      <button type="button" class="action-flow-node" data-select-flow-node="${escapeHtml(node.id)}" aria-label="Configure ${escapeHtml(node.label || node.type)}"><span class="action-flow-node-glyph">${escapeHtml(actionFlowNodeGlyph(node))}</span></button>
      <span class="action-flow-port output" aria-hidden="true"></span>
      ${runState ? `<span class="action-flow-node-run-badge" aria-label="${escapeHtml(titleCaseMessage(runState.status))}">${actionFlowRunStatusIcon(runState.status)}</span>` : ''}
      <strong class="action-flow-node-name">${escapeHtml(node.label || titleCaseMessage(node.type))}</strong>
      <small class="action-flow-node-kind">${escapeHtml(actionFlowNodeKind(node))}</small>
    </div>`;
  }).join('');
  const missingBranchMarkup = definition.nodes.filter((node) => node.type === 'condition').map((node) => {
    const position = positions.get(node.id);
    const connectedOutcomes = new Set(definition.edges
      .filter((edge) => edge.from === node.id)
      .map((edge) => String(edge.outcome || edge.label || '').toLowerCase()));
    return ['yes', 'no'].filter((outcome) => !connectedOutcomes.has(outcome)).map((outcome) => {
      const isYes = outcome === 'yes';
      const offsetY = isYes ? -55 : 55;
      const labelY = position.y + (isYes ? -43 : 43);
      return {
        line: `<path class="action-flow-edge is-${outcome}" d="M ${position.x + 40} ${position.y} C ${position.x + 72} ${position.y}, ${position.x + 66} ${position.y + offsetY}, ${position.x + 106} ${position.y + offsetY}"></path><g class="action-flow-edge-label is-${outcome}" transform="translate(${position.x + 72} ${labelY})"><rect x="-19" y="-10" width="38" height="20" rx="10"></rect><text y="4">${isYes ? 'Yes' : 'No'}</text></g>`,
        button: `<button type="button" class="action-flow-add-step" data-flow-add-branch="${outcome}" data-flow-branch-node="${escapeHtml(node.id)}" style="left:${position.x + 118}px;top:${position.y + offsetY}px" aria-label="Add ${isYes ? 'Yes' : 'No'} step">+</button>`
      };
    });
  }).flat();
  const missingLoopBranchMarkup = definition.nodes.filter((node) => node.type === 'loop').map((node) => {
    const position = positions.get(node.id);
    const connected = new Set(definition.edges.filter((edge) => edge.from === node.id).map((edge) => String(edge.outcome || '').toLowerCase()));
    return ['body', 'done'].filter((outcome) => !connected.has(outcome)).map((outcome) => {
      const offsetY = outcome === 'body' ? -55 : 55;
      return {
        line: `<path class="action-flow-edge is-${outcome}" d="M ${position.x + 40} ${position.y} C ${position.x + 72} ${position.y}, ${position.x + 66} ${position.y + offsetY}, ${position.x + 106} ${position.y + offsetY}"></path><g class="action-flow-edge-label is-${outcome}" transform="translate(${position.x + 72} ${position.y + offsetY - 13})"><rect x="-22" y="-10" width="44" height="20" rx="10"></rect><text y="4">${titleCaseMessage(outcome)}</text></g>`,
        button: `<button type="button" class="action-flow-add-step" data-flow-add-branch="${outcome}" data-flow-branch-node="${escapeHtml(node.id)}" style="left:${position.x + 118}px;top:${position.y + offsetY}px" aria-label="Add ${titleCaseMessage(outcome)} step">+</button>`
      };
    });
  }).flat();
  const missingParallelBranchMarkup = definition.nodes.filter((node) => node.type === 'parallel_branch').map((node) => {
    const position = positions.get(node.id);
    const connectedOutcomes = new Set(definition.edges
      .filter((edge) => edge.from === node.id && String(edge.outcome || '').toLowerCase().startsWith('branch'))
      .map((edge) => String(edge.outcome).toLowerCase()));
    const branchCount = Math.max(2, Number(node.config?.branchCount || 0), connectedOutcomes.size);
    return Array.from({ length: branchCount }, (_unused, index) => index + 1).filter((branchNumber) => (
      !connectedOutcomes.has(`branch_${branchNumber}`)
    )).map((branchNumber) => {
      const outcome = `branch_${branchNumber}`;
      const offsetY = (branchNumber - 1.5) * 110;
      return {
        line: `<path class="action-flow-edge" d="M ${position.x + 40} ${position.y} C ${position.x + 72} ${position.y}, ${position.x + 66} ${position.y + offsetY}, ${position.x + 106} ${position.y + offsetY}"></path><g class="action-flow-edge-label" transform="translate(${position.x + 72} ${position.y + offsetY - 13})"><rect x="-30" y="-10" width="60" height="20" rx="10"></rect><text y="4">Branch ${branchNumber}</text></g>`,
        button: `<button type="button" class="action-flow-add-step" data-flow-add-branch="${outcome}" data-flow-branch-node="${escapeHtml(node.id)}" style="left:${position.x + 118}px;top:${position.y + offsetY}px" aria-label="Add Branch ${branchNumber} step">+</button>`
      };
    });
  }).flat();
  const missingErrorBranchMarkup = definition.nodes.filter((node) => (
    node.category !== 'trigger'
    && node.category !== 'end'
    && node.config?.onError === 'error_branch'
    && !definition.edges.some((edge) => edge.from === node.id && String(edge.outcome || edge.label || '').toLowerCase() === 'error')
  )).map((node) => {
    const position = positions.get(node.id);
    const offsetY = node.type === 'condition' ? 115 : 78;
    return {
      line: `<path class="action-flow-edge is-error" d="M ${position.x + 40} ${position.y} C ${position.x + 72} ${position.y}, ${position.x + 66} ${position.y + offsetY}, ${position.x + 106} ${position.y + offsetY}"></path><g class="action-flow-edge-label is-error" transform="translate(${position.x + 73} ${position.y + offsetY - 13})"><rect x="-23" y="-10" width="46" height="20" rx="10"></rect><text y="4">Error</text></g>`,
      button: `<button type="button" class="action-flow-add-step is-error" data-flow-add-branch="error" data-flow-branch-node="${escapeHtml(node.id)}" style="left:${position.x + 118}px;top:${position.y + offsetY}px" aria-label="Add Error step">+</button>`
    };
  });
  const allMissingBranches = [...missingBranchMarkup, ...missingLoopBranchMarkup, ...missingParallelBranchMarkup, ...missingErrorBranchMarkup];
  const branchLines = allMissingBranches.map((branch) => branch.line).join('');
  const branchButtons = allMissingBranches.map((branch) => branch.button).join('');
  canvas.style.width = `${bounds.width}px`;
  canvas.style.height = `${bounds.height}px`;
  canvas.innerHTML = `<svg class="action-flow-edges" width="${bounds.width}" height="${bounds.height}" viewBox="0 0 ${bounds.width} ${bounds.height}" preserveAspectRatio="xMinYMin meet" style="width:${bounds.width}px;height:${bounds.height}px" aria-hidden="true">${edgeMarkup}${branchLines}</svg>${nodeMarkup}${branchButtons}`;
  canvas.style.transform = `scale(${state.actionFlowZoom})`;
}

function renderActionFlowStudio() {
  const flow = activeActionFlow();
  renderActionFlowList();
  renderActionFlowPalette();
  renderActionFlowCanvas();
  renderActionFlowInspector();
  $('#actionFlowTitle').textContent = flow?.name || 'Automation Flow';
  $('#actionFlowSaveState').textContent = flow
    ? (state.actionFlowDirty
      ? 'Unsaved draft changes'
      : `Draft version ${flow.currentVersion || 1} saved · ${flow.publishedVersion ? `Published version ${flow.publishedVersion}` : 'Not published'}`)
    : 'Select a flow to begin';
  $('#actionFlowStatus').textContent = flow?.publishedVersion ? `Published v${flow.publishedVersion}` : titleCaseMessage(flow?.status || 'draft');
  $('#actionFlowStatus').className = `action-flow-status status-${flow?.status || 'draft'}`;
  $('#saveActionFlowButton').disabled = !flow || !state.actionFlowDirty;
  $('#checkActionFlowButton').disabled = !flow;
  $('#actionFlowVersionsButton').disabled = !flow;
  $('#publishActionFlowButton').disabled = !flow;
  $('#publishActionFlowButton').textContent = flow?.publishedVersion ? 'Publish new version' : 'Publish';
  $('#runActionFlowButton').disabled = !flow || state.actionFlowRun?.status === 'running';
  $('#clearActionFlowRunButton').hidden = !state.actionFlowRun;
  $('#actionFlowZoomLabel').textContent = `${Math.round(state.actionFlowZoom * 100)}%`;
}

async function loadActionFlows() {
  const result = await api('/api/action-flows');
  state.actionFlows = result.flows || [];
  if (!state.actionFlows.some((flow) => flow.flowKey === state.activeActionFlowKey)) {
    state.activeActionFlowKey = state.actionFlows[0]?.flowKey || '';
  }
  state.selectedActionFlowNodeId = '';
  state.actionFlowDirty = false;
  state.actionFlowMode = 'management';
  $('#actionFlowManagement').hidden = false;
  $('#actionFlowStudio').hidden = true;
  renderActionFlowManagement();
}

function closeActionFlowCreateModal() {
  const modal = $('#actionFlowCreateModal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  $('#actionFlowCreateForm').reset();
  if ($$('.modal-backdrop').every((item) => item.hidden)) document.body.classList.remove('modal-open');
}

function createActionFlow() {
  const modal = $('#actionFlowCreateModal');
  const form = $('#actionFlowCreateForm');
  form.reset();
  modal.hidden = false;
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => form.elements.name.focus());
}

async function saveNewActionFlow(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form.elements.name.value.trim();
  if (!name) return form.elements.name.focus();
  const submitButton = $('#confirmCreateActionFlow');
  submitButton.disabled = true;
  try {
    const result = await api('/api/action-flows', {
      method: 'POST',
      body: JSON.stringify({ name, status: 'draft', triggerType: 'record_created', triggerModule: 'customers' })
    });
    closeActionFlowCreateModal();
    state.actionFlows.unshift(result.flow);
    state.activeActionFlowKey = result.flow.flowKey;
    state.selectedActionFlowNodeId = result.flow.definition?.nodes?.[0]?.id || '';
    state.actionFlowDirty = false;
    openActionFlowCanvas(result.flow.flowKey);
  } finally {
    submitButton.disabled = false;
  }
}

function addActionFlowNode(item, sourceNodeId = '', outcome = '') {
  const flow = activeActionFlow();
  if (!flow) return;
  const definition = actionFlowDefinition(flow);
  const source = definition.nodes.find((node) => node.id === sourceNodeId)
    || definition.nodes.find((node) => node.id === state.selectedActionFlowNodeId)
    || definition.nodes.at(-1);
  if (source?.category === 'end') {
    toast('End is the last module in a path. Select another module to continue.', 'error');
    return;
  }
  const sourceIndex = Math.max(0, definition.nodes.indexOf(source));
  const sourcePosition = source ? actionFlowNodePosition(source, sourceIndex) : { x: 190, y: 380 };
  let edgeOutcome = outcome;
  if (!edgeOutcome && source?.type === 'condition') {
    edgeOutcome = definition.edges.some((edge) => edge.from === source.id && String(edge.outcome).toLowerCase() === 'yes') ? 'no' : 'yes';
  }
  if (!edgeOutcome && source?.type === 'loop') {
    edgeOutcome = definition.edges.some((edge) => edge.from === source.id && String(edge.outcome).toLowerCase() === 'body') ? 'done' : 'body';
  }
  if (!edgeOutcome && source?.type === 'parallel_branch') {
    const branchCount = definition.edges.filter((edge) => edge.from === source.id && String(edge.outcome || '').toLowerCase().startsWith('branch')).length;
    edgeOutcome = `branch_${branchCount + 1}`;
  }
  const id = `${item.type}_${Date.now().toString(36)}`;
  const branchNumber = edgeOutcome?.startsWith('branch_') ? Number(edgeOutcome.split('_')[1]) : 0;
  const branchOffset = edgeOutcome === 'yes' || edgeOutcome === 'body' ? -125 : edgeOutcome === 'no' || edgeOutcome === 'done' ? 125 : edgeOutcome === 'error' ? 185 : branchNumber ? (branchNumber - 1.5) * 150 : 0;
  const node = { id, category: item.category, type: item.type, label: item.label, x: sourcePosition.x + 220, y: Math.max(110, sourcePosition.y + branchOffset), config: {} };
  definition.nodes.push(node);
  if (source) definition.edges.push({ from: source.id, to: id, ...(edgeOutcome ? { outcome: edgeOutcome } : {}) });
  state.selectedActionFlowNodeId = id;
  state.actionFlowDirty = true;
  renderActionFlowStudio();
}

function addActionFlowParallelBranch() {
  const definition = actionFlowDefinition();
  const parallel = definition.nodes.find((node) => node.id === state.selectedActionFlowNodeId && node.type === 'parallel_branch');
  if (!parallel) return;
  const connectedBranchCount = definition.edges.filter((edge) => edge.from === parallel.id && String(edge.outcome || '').toLowerCase().startsWith('branch')).length;
  parallel.config = {
    ...(parallel.config || {}),
    branchCount: Math.max(2, Number(parallel.config?.branchCount || 0), connectedBranchCount) + 1
  };
  state.actionFlowDirty = true;
  renderActionFlowStudio();
}

function removeSelectedActionFlowNode() {
  const definition = actionFlowDefinition();
  const id = state.selectedActionFlowNodeId;
  const node = definition.nodes.find((item) => item.id === id);
  if (!node || node.category === 'trigger') return;

  const nodeIndex = definition.nodes.indexOf(node);
  const removedPosition = actionFlowNodePosition(node, nodeIndex);
  const incomingEdges = definition.edges.filter((edge) => edge.to === id);
  const outgoingEdges = definition.edges.filter((edge) => edge.from === id);
  const successorIds = [...new Set(outgoingEdges.map((edge) => edge.to))]
    .filter((successorId) => definition.nodes.some((item) => item.id === successorId));

  // Pull each continuing branch, including all of its downstream nodes, into
  // the space left by the removed module so the canvas does not retain a gap.
  const movedNodeIds = new Set();
  successorIds.forEach((successorId, successorIndex) => {
    const successor = definition.nodes.find((item) => item.id === successorId);
    if (!successor) return;
    const successorPosition = actionFlowNodePosition(successor, definition.nodes.indexOf(successor));
    const targetY = removedPosition.y + ((successorIndex - ((successorIds.length - 1) / 2)) * 170);
    const deltaX = removedPosition.x - successorPosition.x;
    const deltaY = targetY - successorPosition.y;
    const queue = [successorId];
    const branchNodeIds = new Set();

    while (queue.length) {
      const currentId = queue.shift();
      if (currentId === id || branchNodeIds.has(currentId)) continue;
      branchNodeIds.add(currentId);
      definition.edges
        .filter((edge) => edge.from === currentId && edge.to !== id)
        .forEach((edge) => queue.push(edge.to));
    }

    branchNodeIds.forEach((branchNodeId) => {
      if (movedNodeIds.has(branchNodeId)) return;
      const branchNode = definition.nodes.find((item) => item.id === branchNodeId);
      if (!branchNode) return;
      const position = actionFlowNodePosition(branchNode, definition.nodes.indexOf(branchNode));
      branchNode.x = Math.max(90, position.x + deltaX);
      branchNode.y = Math.max(90, position.y + deltaY);
      movedNodeIds.add(branchNodeId);
    });
  });

  const survivingEdges = definition.edges.filter((edge) => edge.from !== id && edge.to !== id);
  const bridgedEdges = [];
  incomingEdges.forEach((incomingEdge) => {
    outgoingEdges.forEach((outgoingEdge) => {
      if (incomingEdge.from === outgoingEdge.to) return;
      const incomingOutcome = String(incomingEdge.outcome || incomingEdge.label || '').toLowerCase();
      const outgoingOutcome = String(outgoingEdge.outcome || outgoingEdge.label || '').toLowerCase();
      const outcome = ['yes', 'no', 'error'].includes(incomingOutcome)
        ? incomingOutcome
        : (['yes', 'no', 'error'].includes(outgoingOutcome) ? outgoingOutcome : '');
      const duplicate = [...survivingEdges, ...bridgedEdges].some((edge) => (
        edge.from === incomingEdge.from
        && edge.to === outgoingEdge.to
        && String(edge.outcome || edge.label || '').toLowerCase() === outcome
      ));
      if (!duplicate) {
        bridgedEdges.push({ from: incomingEdge.from, to: outgoingEdge.to, ...(outcome ? { outcome } : {}) });
      }
    });
  });

  definition.nodes = definition.nodes.filter((item) => item.id !== id);
  definition.edges = [...survivingEdges, ...bridgedEdges];
  state.selectedActionFlowNodeId = successorIds[0] || incomingEdges[0]?.from || '';
  state.actionFlowDirty = true;
  renderActionFlowStudio();
}

async function saveActiveActionFlow() {
  const flow = activeActionFlow();
  if (!flow) return;
  const result = await api(`/api/action-flows/${encodeURIComponent(flow.flowKey)}`, {
    method: 'PUT',
    body: JSON.stringify({
      triggerType: flow.triggerType,
      triggerModule: flow.triggerModule,
      definition: actionFlowDefinition(flow)
    })
  });
  const index = state.actionFlows.findIndex((item) => item.flowKey === flow.flowKey);
  state.actionFlows[index] = result.flow;
  state.actionFlowDirty = false;
  beginBuilderDraft('automation');
  renderActionFlowStudio();
  toast('Automation Flow Saved.');
}

function renderActionFlowVersions() {
  const flow = activeActionFlow();
  const list = $('#actionFlowVersionsList');
  if (!list) return;
  $('#actionFlowVersionsTitle').textContent = `Version History - ${flow?.name || 'Automation Flow'}`;
  if (state.actionFlowVersionsLoading) {
    list.innerHTML = '<div class="version-history-empty">Loading version history...</div>';
    return;
  }
  const versions = state.actionFlowVersions?.versions || [];
  $('#actionFlowVersionsCount').textContent = `${versions.length} version${versions.length === 1 ? '' : 's'}`;
  list.innerHTML = versions.map((version) => {
    const isPublished = Number(version.versionNumber) === Number(state.actionFlowVersions?.publishedVersion);
    const isCurrent = Number(version.versionNumber) === Number(state.actionFlowVersions?.currentVersion);
    const author = version.createdBy?.name || version.createdBy?.email || 'System';
    return `<article class="version-timeline-item ${isCurrent ? 'is-current' : ''}">
      <span class="version-timeline-marker" aria-hidden="true"></span>
      <div class="version-timeline-card">
        <div class="section-heading-row"><strong>Version ${version.versionNumber}</strong><span>${isPublished ? 'Published' : isCurrent ? 'Current draft' : titleCaseMessage(version.action || 'checkpoint')}</span></div>
        <p>${escapeHtml(version.summary || 'Saved Automation Flow checkpoint')}</p>
        <div class="version-timeline-meta"><span>${escapeHtml(author)}</span><span>${escapeHtml(versionHistoryDate(version.createdAt))}</span></div>
        ${isCurrent ? '' : `<div class="form-actions end-actions"><button type="button" class="secondary" data-restore-action-flow-version="${version.id}" data-version-number="${version.versionNumber}">Restore as New Version</button></div>`}
      </div>
    </article>`;
  }).join('') || '<div class="version-history-empty"><strong>No saved versions yet.</strong><span>Save the current draft as your first checkpoint.</span></div>';
}

async function loadActionFlowVersions() {
  const flow = activeActionFlow();
  if (!flow) return;
  state.actionFlowVersionsLoading = true;
  renderActionFlowVersions();
  try {
    state.actionFlowVersions = await api(`/api/action-flows/${encodeURIComponent(flow.flowKey)}/versions`);
  } finally {
    state.actionFlowVersionsLoading = false;
    renderActionFlowVersions();
  }
}

async function openActionFlowVersionsDrawer() {
  if (state.actionFlowDirty) await saveActiveActionFlow();
  state.actionFlowVersions = null;
  $('#actionFlowVersionRemark').value = '';
  $('#actionFlowVersionsDrawer').hidden = false;
  document.body.classList.add('modal-open');
  await loadActionFlowVersions();
}

function closeActionFlowVersionsDrawer() {
  $('#actionFlowVersionsDrawer').hidden = true;
  if ($$('.modal-backdrop').every((item) => item.hidden)) document.body.classList.remove('modal-open');
}

async function createActionFlowVersion() {
  const flow = activeActionFlow();
  if (!flow) return;
  if (state.actionFlowDirty) await saveActiveActionFlow();
  const result = await api(`/api/action-flows/${encodeURIComponent(flow.flowKey)}/versions`, {
    method: 'POST', body: JSON.stringify({ remark: $('#actionFlowVersionRemark').value.trim() })
  });
  state.actionFlowVersions = { ...state.actionFlowVersions, versions: result.versions, currentVersion: result.flow.currentVersion, publishedVersion: result.flow.publishedVersion };
  const index = state.actionFlows.findIndex((item) => item.flowKey === flow.flowKey);
  state.actionFlows[index] = result.flow;
  $('#actionFlowVersionRemark').value = '';
  renderActionFlowVersions();
  renderActionFlowStudio();
  toast('Automation Flow Version Saved.');
}

async function publishActiveActionFlow() {
  const flow = activeActionFlow();
  if (!flow) return;
  if (state.actionFlowDirty) await saveActiveActionFlow();
  const confirmed = await showConfirmationModal({
    title: flow.publishedVersion ? 'Publish New Version' : 'Publish Automation Flow',
    message: 'Publish this saved draft? The published version will be used for live and scheduled executions.',
    confirmLabel: 'Publish'
  });
  if (!confirmed) return;
  const result = await api(`/api/action-flows/${encodeURIComponent(flow.flowKey)}/publish`, { method: 'POST', body: '{}' });
  const index = state.actionFlows.findIndex((item) => item.flowKey === flow.flowKey);
  state.actionFlows[index] = result.flow;
  state.actionFlowVersions = { versions: result.versions, currentVersion: result.flow.currentVersion, publishedVersion: result.flow.publishedVersion };
  renderActionFlowStudio();
  toast(`Automation Flow Version ${result.flow.publishedVersion} Published.`);
}

async function restoreActionFlowVersion(versionId, versionNumber) {
  const flow = activeActionFlow();
  if (!flow) return;
  const confirmed = await showConfirmationModal({ title: `Restore Version ${versionNumber}`, message: 'Restore this snapshot as a new draft version? The currently published version will remain live.', confirmLabel: 'Restore Version' });
  if (!confirmed) return;
  const result = await api(`/api/action-flows/${encodeURIComponent(flow.flowKey)}/versions/${encodeURIComponent(versionId)}/restore`, { method: 'POST', body: JSON.stringify({ remark: $('#actionFlowVersionRemark').value.trim() }) });
  const index = state.actionFlows.findIndex((item) => item.flowKey === flow.flowKey);
  state.actionFlows[index] = result.flow;
  state.actionFlowVersions = { versions: result.versions, currentVersion: result.flow.currentVersion, publishedVersion: result.flow.publishedVersion };
  state.selectedActionFlowNodeId = result.flow.definition?.nodes?.[0]?.id || '';
  state.actionFlowDirty = false;
  $('#actionFlowVersionRemark').value = '';
  renderActionFlowVersions();
  renderActionFlowStudio();
  beginBuilderDraft('automation');
  toast(`Version ${versionNumber} Restored As A New Draft.`);
}

function closeActionFlowRunModal() {
  const modal = $('#actionFlowRunModal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  $('#actionFlowRunJsonError').hidden = true;
  if ($$('.modal-backdrop').every((item) => item.hidden)) document.body.classList.remove('modal-open');
}

function openActionFlowRunModal() {
  const flow = activeActionFlow();
  if (!flow) return;
  const form = $('#actionFlowRunForm');
  form.reset();
  form.elements.recordJson.value = '{}';
  $('#actionFlowRunTitle').textContent = `Run ${flow.name} once`;
  $('#actionFlowRunJsonError').hidden = true;
  $('#actionFlowRunModal').hidden = false;
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => form.elements.recordId.focus());
}

async function runActiveActionFlowOnce(event) {
  event.preventDefault();
  const flow = activeActionFlow();
  if (!flow) return;
  const form = event.currentTarget;
  const errorElement = $('#actionFlowRunJsonError');
  let record;
  try {
    record = JSON.parse(form.elements.recordJson.value || '{}');
    if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error('Trigger data must be a JSON object.');
  } catch (error) {
    errorElement.textContent = error.message || 'Enter valid JSON trigger data.';
    errorElement.hidden = false;
    return;
  }
  errorElement.hidden = true;
  const submitButton = $('#confirmRunActionFlow');
  submitButton.disabled = true;
  try {
    if (state.actionFlowDirty) await saveActiveActionFlow();
    closeActionFlowRunModal();
    state.actionFlowRun = { status: 'running', steps: [] };
    renderActionFlowStudio();
    const recordId = Number(form.elements.recordId.value) || null;
    const result = await api(`/api/action-flows/${encodeURIComponent(flow.flowKey)}/run-once`, {
      method: 'POST',
      body: JSON.stringify({ recordId, record: { ...(recordId ? { id: recordId } : {}), ...record } })
    });
    state.actionFlowRun = result.execution || { status: 'failed', steps: [], error: 'No execution result returned' };
    const failedStep = state.actionFlowRun.steps?.find((step) => step.status === 'failed');
    if (failedStep) state.selectedActionFlowNodeId = failedStep.nodeId;
    renderActionFlowStudio();
    toast(state.actionFlowRun.status === 'success' ? 'Test Run Completed.' : 'Test Run Failed.', state.actionFlowRun.status === 'success' ? 'success' : 'error');
  } finally {
    submitButton.disabled = false;
  }
}

function clearActionFlowRun() {
  state.actionFlowRun = null;
  renderActionFlowStudio();
}

async function checkActiveActionFlow() {
  const flow = activeActionFlow();
  if (!flow) return;
  if (state.actionFlowDirty) await saveActiveActionFlow();
  const result = await api(`/api/action-flows/${encodeURIComponent(flow.flowKey)}/check`, { method: 'POST' });
  if (result.check?.valid) return toast('Automation Flow Check Passed.');
  toast(titleCaseMessage(result.check?.errors?.[0] || 'Automation Flow Needs Attention.'), 'error');
}

async function deleteManagedActionFlow(flowKey) {
  const flow = state.actionFlows.find((item) => item.flowKey === flowKey);
  if (!flow) return;
  const confirmed = await showConfirmationModal({
    title: 'Delete Automation Flow',
    message: `Delete ${flow.name}? This removes the automation and cannot be undone.`,
    confirmLabel: 'Delete Automation Flow'
  });
  if (!confirmed) return;
  await api(`/api/action-flows/${encodeURIComponent(flowKey)}`, { method: 'DELETE' });
  await loadActionFlows();
  toast('Automation Flow Deleted.');
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

const builderDrafts = new Map();
let builderLeavePending = false;

function builderDraftAdapter(name) {
  if (name === 'menu') return {
    root: '#adminMenuConfigurationSection', label: 'Menu',
    read: () => state.menuConfigDraft,
    restore: value => { state.menuConfigDraft = value; renderMenuConfig(); }
  };
  if (name === 'automation') return {
    root: '#actionFlowStudio', label: 'Automation flow',
    read: () => { const flow = activeActionFlow(); return flow ? { definition: flow.definition, triggerType: flow.triggerType, triggerModule: flow.triggerModule } : null; },
    restore: value => { Object.assign(activeActionFlow(), value); state.selectedActionFlowNodeId = ''; renderActionFlowStudio(); }
  };
  if (name === 'workflow') return {
    root: '#workflowDefinitionForm', label: 'Workflow',
    read: () => ({ graph: state.workflowBuilderGraph, stages: state.workflowDraftStages, fields: Array.from($('#workflowDefinitionForm').elements)
      .filter(field => field.name && !field.closest('#workflowCanvasInspector'))
      .map(field => [field.name, field.type === 'checkbox' ? field.checked : field.value]) }),
    restore: value => {
      state.workflowBuilderGraph = value.graph; state.workflowDraftStages = value.stages;
      for (const [name, val] of value.fields) { const field = $('#workflowDefinitionForm').elements.namedItem(name); if (field) { if (field.type === 'checkbox') field.checked = val; else field.value = val; } }
      state.selectedWorkflowNodeId = ''; state.selectedWorkflowEdgeId = ''; state.workflowConnectFrom = '';
      renderWorkflowStages(); renderWorkflowCheck(null);
    }
  };
  if (name === 'form') return {
    root: '#formDesignDrawer', label: 'Form layout',
    read: () => readFormDesignLayouts().draft,
    restore: value => { const layouts = readFormDesignLayouts(); layouts.draft = value; writeFormDesignLayouts(layouts); renderFormDesignDrawer(); }
  };
  if (name === 'dashboard') return {
    root: '#dashboardBuilderStudio', label: 'Dashboard',
    read: () => state.dashboardConfiguration,
    restore: value => { state.dashboardConfiguration = value; state.dashboardLayoutHistory = []; state.dashboardLayoutFuture = []; state.dashboardLayoutDirty = false; renderDashboardCanvas(); }
  };
}

function beginBuilderDraft(name) {
  const adapter = builderDraftAdapter(name);
  builderDrafts.set(name, new DraftHistory(adapter.read()));
  refreshBuilderDraftFeedback(name);
}

function markFormLayoutSaved() {
  const history = builderDrafts.get('form');
  if (!history) return beginBuilderDraft('form');
  const current = builderDraftAdapter('form').read();
  const saved = JSON.parse(history.saved);
  saved[state.activeFormDesignType] = current[state.activeFormDesignType];
  history.saved = JSON.stringify(saved);
  history.current = JSON.stringify(current);
  history.past = []; history.future = [];
  refreshBuilderDraftFeedback('form');
}

function captureBuilderDraft(name) {
  const history = builderDrafts.get(name);
  if (!history) return;
  history.record(builderDraftAdapter(name).read());
  refreshBuilderDraftFeedback(name);
}

function refreshBuilderDraftFeedback(name) {
  const history = builderDrafts.get(name);
  if (!history) return;
  $$(`[data-builder-history="${name}"]`).forEach(bar => {
    bar.querySelector('[data-draft-undo]').disabled = !history.past.length;
    bar.querySelector('[data-draft-redo]').disabled = !history.future.length;
    const status = bar.querySelector('[data-draft-status]');
    const text = history.dirty ? 'Unsaved changes' : 'No unsaved changes';
    if (status.textContent !== text) status.textContent = text;
    bar.classList.toggle('is-dirty', history.dirty);
  });
  if (name === 'automation') {
    state.actionFlowDirty = history.dirty;
    $('#saveActionFlowButton').disabled = !history.dirty;
    $('#actionFlowSaveState').textContent = history.dirty ? 'Unsaved draft changes' : 'No unsaved changes';
  }
  if (name === 'dashboard') {
    state.dashboardLayoutDirty = history.dirty;
    $('#dashboardStudioSaveState').textContent = history.dirty ? 'Unsaved changes' : 'No unsaved changes';
  }
}

function restoreBuilderHistory(name, redo = false) {
  captureBuilderDraft(name);
  const history = builderDrafts.get(name);
  const value = redo ? history?.redo() : history?.undo();
  if (!value) return;
  builderDraftAdapter(name).restore(value);
  refreshBuilderDraftFeedback(name);
  $$(`[data-builder-history="${name}"] [data-draft-status]`).forEach(status => { status.textContent = `${redo ? 'Redone' : 'Undone'}. ${history.dirty ? 'Unsaved changes' : 'No unsaved changes'}`; });
}

function visibleDirtyBuilders(names = [...builderDrafts.keys()]) {
  return names.filter(name => {
    const root = $(builderDraftAdapter(name).root);
    if (!root || root.closest('[hidden]')) return false;
    captureBuilderDraft(name);
    return builderDrafts.get(name)?.dirty;
  });
}

// Keep navigation synchronous when clean. Dirty navigation is resumed only after
// an explicit discard; cancelling does not mutate the draft or change selection.
function deferBuilderLeave(names, proceed) {
  const dirty = visibleDirtyBuilders(names);
  if (!dirty.length) return false;
  if (builderLeavePending) return true;
  builderLeavePending = true;
  showConfirmationModal({ title: 'Leave without saving?', message: `${dirty.map(name => builderDraftAdapter(name).label).join(', ')} has unsaved changes. Stay to save your work, or discard these draft changes. Published versions are unchanged.`, confirmLabel: 'Discard changes', cancelLabel: 'Keep editing' })
    .then(discard => {
      if (!discard) return;
      for (const name of dirty) {
        const history = builderDrafts.get(name);
        const saved = JSON.parse(history.saved);
        builderDraftAdapter(name).restore(saved);
        history.markSaved(saved);
        refreshBuilderDraftFeedback(name);
      }
      proceed();
    }).finally(() => { builderLeavePending = false; });
  return true;
}

function initializeBuilderDraftControls() {
  document.addEventListener('click', event => {
    const navigation = event.target.closest?.('[data-view], [data-module-view], .admin-section-button, [data-workflow-definition], #newWorkflowDefinitionButton, #emptyNewWorkflowDefinitionButton, [data-action-flow-key], [data-open-flow-canvas], [data-open-dashboard], [data-open-account-settings], #logoutButton');
    if (navigation && deferBuilderLeave(undefined, () => navigation.click())) {
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }, true);
  for (const [name, selector] of [['menu', '#menuConfigStatus'], ['automation', '.action-flow-context-toolbar'], ['workflow', '.workflow-definition-header'], ['workflow', '.workflow-canvas-toolbar'], ['form', '#formDesignDrawer .form-design-toolbar']]) {
    const anchor = $(selector);
    if (!anchor) continue;
    const bar = document.createElement('div');
    bar.className = 'builder-history-bar'; bar.dataset.builderHistory = name;
    bar.innerHTML = '<button type="button" class="secondary" data-draft-undo disabled>Undo</button><button type="button" class="secondary" data-draft-redo disabled>Redo</button><span data-draft-status role="status" aria-live="polite">No unsaved changes</span>';
    if (name === 'form' || name === 'automation' || selector === '.workflow-canvas-toolbar') anchor.append(bar);
    else anchor.after(bar);
    bar.addEventListener('click', event => { if (event.target.closest('[data-draft-undo], [data-draft-redo]')) restoreBuilderHistory(name, Boolean(event.target.closest('[data-draft-redo]'))); });
  }
  // Observe completed user transactions, not pointermove frames. Native input
  // undo remains untouched; builder undo is an explicit toolbar action.
  for (const type of ['click', 'change', 'input', 'pointerup', 'drop', 'keyup']) {
    document.addEventListener(type, event => {
      if (event.target.closest?.('[data-builder-history]')) return;
      setTimeout(() => { if (!builderLeavePending) visibleDirtyBuilders(); }, 0);
    }, true);
  }
  window.addEventListener('beforeunload', event => {
    if (!visibleDirtyBuilders().length) return;
    event.preventDefault(); event.returnValue = '';
  });
}

function showView(id) {
  if (id === 'loginView') builderDrafts.clear();
  if (id !== 'loginView' && deferBuilderLeave(undefined, () => showView(id))) return;
  closeCustomerModal();
  closeImportModal();
  closeConfirmationModal(false);
  closeActionFlowCreateModal();
  closeUserModal();
  closeModuleRecordModal();
  closeApiConnectorModal();
  closeApiInterfaceModal();
  closeDepartmentNodeModal();
  closeDashboardSourceDrawer();
  closeDashboardFilterDrawer();
  closeDashboardFormModal();
  closeWorkflowModal('workflowSubmitModal');
  closeWorkflowModal('workflowDecisionModal');
  closeWorkflowModal('workflowLifecycleModal');
  closeWorkflowModal('workflowDelegationModal');
  closeWorkflowModal('workflowReassignModal');
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
  syncSidebarCurrentState();
  window.clearInterval(state.workflowMonitoringTimer);
  state.workflowMonitoringTimer = id === 'workflowMonitoringView'
    ? window.setInterval(() => runWorkflowUi(loadWorkflowMonitoring), 30000)
    : null;
}

function showAdminSection(id) {
  if (id !== state.activeAdminSection && deferBuilderLeave(undefined, () => showAdminSection(id))) return;
  state.activeAdminSection = id;
  if (id !== 'adminDocumentTemplatesSection') document.body.classList.remove('document-designer-open');
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
  if (id === 'adminEmailSettingsSection' && state.user?.role === 'admin') runWorkflowUi(loadEmailSettings);
  if (id === 'adminMenuConfigurationSection' && state.user?.role === 'admin') runWorkflowUi(loadMenuConfiguration);
}

function workflowStatusClass(status) {
  if (['approved', 'published', 'auto-approved'].includes(status)) return 'status-published';
  if (['rejected', 'cancelled', 'archived'].includes(status)) return 'status-archived';
  if (['pending', 'active'].includes(status)) return 'status-live';
  return 'status-draft';
}

function workflowIdempotencyKey(action, requestKey = '') {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `ui:${action}:${requestKey}:${random}`.slice(0, 120);
}

function closeWorkflowModal(id) {
  const modal = $(`#${id}`);
  if (!modal) return;
  resetModalFullscreen(modal);
  modal.hidden = true;
  if ($$('.modal-backdrop').every((item) => item.hidden)) document.body.classList.remove('modal-open');
}

async function runWorkflowUi(action) {
  try {
    await action();
  } catch (error) {
    toast(titleCaseMessage(error.message), 'error');
  }
}

function bindAsyncSubmit(form, handler) {
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (form.dataset.submitting === 'true') return;

    const submitButton = event.submitter instanceof HTMLButtonElement
      ? event.submitter
      : form.querySelector('button[type="submit"], input[type="submit"]');
    const wasDisabled = Boolean(submitButton?.disabled);
    form.dataset.submitting = 'true';
    form.setAttribute('aria-busy', 'true');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.classList.add('is-busy');
      submitButton.setAttribute('aria-busy', 'true');
    }

    try {
      await handler(event);
    } finally {
      delete form.dataset.submitting;
      form.removeAttribute('aria-busy');
      if (submitButton?.isConnected) {
        submitButton.disabled = wasDisabled;
        submitButton.classList.remove('is-busy');
        submitButton.removeAttribute('aria-busy');
      }
    }
  });
}

function openWorkflowModal(id, focusSelector = 'input, select, textarea, button') {
  const modal = $(`#${id}`);
  if (!modal) return;
  modal.hidden = false;
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => modal.querySelector(focusSelector)?.focus());
}

function workflowModuleOptions(selected = '') {
  return configModules.filter((module) => module.status === 'published').map((module) => (
    `<option value="${escapeHtml(module.key)}" ${module.key === selected ? 'selected' : ''}>${escapeHtml(module.name)}</option>`
  )).join('');
}

function workflowStableKeyFromName(name, editingKey = '') {
  let base = String(name || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!base) return '';
  if (!/^[a-z]/.test(base)) base = `workflow_${base}`;
  if (base.length < 2) base = `${base}_workflow`;
  base = base.slice(0, 80).replace(/_+$/g, '');
  const used = new Set(state.workflowDefinitions.map((definition) => definition.workflowKey).filter((key) => key !== editingKey));
  if (!used.has(base)) return base;
  for (let suffix = 2; suffix < 10000; suffix += 1) {
    const tail = `_${suffix}`;
    const candidate = `${base.slice(0, 80 - tail.length).replace(/_+$/g, '')}${tail}`;
    if (!used.has(candidate)) return candidate;
  }
  return base;
}

function syncWorkflowStableKey() {
  const form = $('#workflowDefinitionForm');
  if (!form || form.elements.editingWorkflowKey.value) return;
  form.elements.workflowKey.value = workflowStableKeyFromName(form.elements.name.value);
}

function workflowRequestFormOptions(selected = '') {
  const systemForms = [['', 'Use all source-module fields'], ['add', 'Add form'], ['edit', 'Edit form'], ['detail', 'Detail form']];
  const standalone = workflowCompatibleStandaloneForms().map((form) => [form.formKey, form.name]);
  return [...systemForms, ...standalone.filter(([key]) => !systemForms.some(([systemKey]) => systemKey === key))]
    .map(([value, label]) => `<option value="${escapeHtml(value)}" ${value === selected ? 'selected' : ''}>${escapeHtml(label)}${value ? ` · ${escapeHtml(value)}` : ''}</option>`).join('');
}

function workflowCompatibleStandaloneForms() {
  const moduleKey = $('#workflowDefinitionForm')?.elements.sourceModuleKey.value || '';
  const sourceKeys = new Set(moduleFields(moduleKey).map((field) => field.fieldKey));
  return state.standaloneForms.filter((form) => (form.fields || []).every((field) => sourceKeys.has(field.fieldKey)));
}

function workflowFieldsForForm(formKey = '') {
  const form = $('#workflowDefinitionForm');
  const moduleKey = form?.elements.sourceModuleKey.value || '';
  const standalone = state.standaloneForms.find((item) => item.formKey === formKey);
  if (standalone) return (standalone.fields || []).filter((field) => !field.archived);
  const fields = moduleFields(moduleKey).filter((field) => field.tableType !== 'detail' && !field.archived);
  if (!formKey || !formDesignTypes.includes(formKey)) return fields;
  const layout = moduleConfigByKey(moduleKey)?.formLayouts?.published?.[formKey]
    || readFormDesignLayouts(moduleKey)?.published?.[formKey]
    || {};
  const hidden = new Set(layout.hidden || []);
  const order = Array.isArray(layout.order) ? layout.order : [];
  return fields.filter((field) => field.showInForm !== false && !hidden.has(field.fieldKey)).sort((left, right) => {
    const leftIndex = order.indexOf(left.fieldKey);
    const rightIndex = order.indexOf(right.fieldKey);
    return (leftIndex < 0 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex < 0 ? Number.MAX_SAFE_INTEGER : rightIndex);
  });
}

function workflowBoundFormFields() {
  const formKey = $('#workflowDefinitionForm')?.elements.requestFormKey.value || '';
  return workflowFieldsForForm(formKey);
}

function workflowNodePresentation(node) {
  const defaultFormKey = $('#workflowDefinitionForm')?.elements.requestFormKey.value || '';
  const inherited = !node?.presentation || node.presentation.inheritDefault === true;
  const formKey = inherited ? defaultFormKey : (node.presentation.formKey || '');
  return { ...(node?.presentation || {}), formKey, inherited };
}

function workflowNodeFormOptions(node) {
  const presentation = workflowNodePresentation(node);
  const defaultFormKey = $('#workflowDefinitionForm')?.elements.requestFormKey.value || '';
  const defaultLabel = defaultFormKey
    ? (state.standaloneForms.find((form) => form.formKey === defaultFormKey)?.name || titleCaseMessage(defaultFormKey))
    : 'All source-module fields';
  const choices = [['__all__', 'Use all source-module fields'], ['add', 'Add form'], ['edit', 'Edit form'], ['detail', 'Detail form'], ...workflowCompatibleStandaloneForms().map((form) => [form.formKey, form.name])];
  const selectedValue = presentation.formKey || '__all__';
  return `<option value="__inherit__" ${presentation.inherited ? 'selected' : ''}>Use default form · ${escapeHtml(defaultLabel)}</option>${choices.filter(([key], index) => choices.findIndex(([candidate]) => candidate === key) === index).map(([value, label]) => `<option value="${escapeHtml(value)}" ${!presentation.inherited && value === selectedValue ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('')}`;
}

function setWorkflowNodeForm(node, selectedValue) {
  if (selectedValue === '__inherit__') {
    node.presentation = { inheritDefault: true };
    return;
  }
  const formKey = selectedValue === '__all__' ? '' : selectedValue;
  const standalone = state.standaloneForms.find((form) => form.formKey === formKey);
  const label = standalone?.name || (formKey ? `${titleCaseMessage(formKey)} form` : 'All source-module fields');
  node.presentation = {
    formKey,
    formName: label,
    inheritDefault: false,
    mode: node.type === 'start' ? 'request' : node.type === 'approval' ? 'review' : 'result',
    fieldKeys: workflowFieldsForForm(formKey).map((field) => field.fieldKey).filter(Boolean)
  };
}

function workflowResponseFormOptions(selected = '') {
  const choices = [['', 'No response form'], ['add', 'Add form'], ['edit', 'Edit form'], ['detail', 'Detail form'], ...workflowCompatibleStandaloneForms().map((form) => [form.formKey, form.name])];
  return choices.filter(([key], index) => choices.findIndex(([candidate]) => candidate === key) === index).map(([value, label]) => `<option value="${escapeHtml(value)}" ${value === selected ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('');
}

function setWorkflowResponseForm(node, formKey) {
  if (!formKey) {
    delete node.responsePresentation;
    return;
  }
  const standalone = state.standaloneForms.find((form) => form.formKey === formKey);
  node.responsePresentation = {
    formKey,
    formName: standalone?.name || `${titleCaseMessage(formKey)} form`,
    fields: workflowFieldsForForm(formKey).map((field) => ({
      fieldKey: field.fieldKey,
      label: field.label || titleCaseMessage(field.fieldKey),
      type: field.type || 'textbox',
      options: Array.isArray(field.options) ? structuredClone(field.options) : [],
      required: Boolean(field.required),
      storage: 'decision',
      targetFieldKey: field.fieldKey,
      exposeToAutomation: false
    }))
  };
}

function renderWorkflowResponseMappings(node) {
  const response = node.responsePresentation;
  if (!response?.fields?.length) return '<p class="muted">Choose a response form to collect structured information with the decision.</p>';
  const sourceFields = moduleFields($('#workflowDefinitionForm')?.elements.sourceModuleKey.value || '').filter((field) => !field.archived);
  if (response.fields.length) {
    return `<div class="workflow-response-mappings">${response.fields.map((field, index) => `<article data-workflow-response-index="${index}"><div><strong>${escapeHtml(field.label)}</strong><small>${escapeHtml(field.fieldKey)}${field.required ? ' · Required' : ''}</small></div><label>Store response<select data-workflow-response-field="storage"><option value="decision" ${field.storage === 'decision' ? 'selected' : ''}>Decision history only</option><option value="source" ${field.storage === 'source' ? 'selected' : ''}>Update main record</option><option value="detail" ${field.storage === 'detail' ? 'selected' : ''}>Append detail-table row</option></select></label>${field.storage !== 'decision' ? `<label>Target field<select data-workflow-response-field="targetFieldKey">${sourceFields.filter((target) => field.storage === 'detail' ? target.tableType === 'detail' : target.tableType !== 'detail').map((target) => `<option value="${escapeHtml(target.fieldKey)}" ${target.fieldKey === (field.targetFieldKey || field.fieldKey) ? 'selected' : ''}>${escapeHtml(target.label || titleCaseMessage(target.fieldKey))}${target.detailTableName ? ` · ${escapeHtml(target.detailTableName)}` : ''}</option>`).join('')}</select></label>` : ''}<label class="checkbox-label"><input type="checkbox" data-workflow-response-field="exposeToAutomation" ${field.exposeToAutomation ? 'checked' : ''}> Include this value in Automation Flow events</label></article>`).join('')}</div>`;
  }
  return `<div class="workflow-response-mappings">${response.fields.map((field, index) => `<article data-workflow-response-index="${index}"><div><strong>${escapeHtml(field.label)}</strong><small>${escapeHtml(field.fieldKey)}${field.required ? ' · Required' : ''}</small></div><label>Store response<select data-workflow-response-field="storage"><option value="decision" ${field.storage !== 'source' ? 'selected' : ''}>Decision history only</option><option value="source" ${field.storage === 'source' ? 'selected' : ''}>Update source record</option></select></label>${field.storage === 'source' ? `<label>Source field<select data-workflow-response-field="targetFieldKey">${sourceFields.map((target) => `<option value="${escapeHtml(target.fieldKey)}" ${target.fieldKey === (field.targetFieldKey || field.fieldKey) ? 'selected' : ''}>${escapeHtml(target.label || titleCaseMessage(target.fieldKey))}</option>`).join('')}</select></label>` : ''}<label class="checkbox-label"><input type="checkbox" data-workflow-response-field="exposeToAutomation" ${field.exposeToAutomation ? 'checked' : ''}> Include this value in Automation Flow events</label></article>`).join('')}</div>`;
}

function workflowGraphForSave() {
  const defaultFormKey = $('#workflowDefinitionForm')?.elements.requestFormKey.value || '';
  const defaultStandalone = state.standaloneForms.find((form) => form.formKey === defaultFormKey);
  return {
    ...structuredClone(state.workflowBuilderGraph),
    nodes: state.workflowBuilderGraph.nodes.map((node) => {
      const presentation = workflowNodePresentation(node);
      const formKey = presentation.inherited ? defaultFormKey : presentation.formKey;
      return {
        ...structuredClone(node),
        presentation: {
          formKey,
          formName: presentation.inherited
            ? (defaultStandalone?.name || (formKey ? `${titleCaseMessage(formKey)} form` : 'All source-module fields'))
            : presentation.formName,
          mode: node.type === 'start' ? 'request' : node.type === 'approval' ? 'review' : 'result',
          fieldKeys: workflowFieldsForForm(formKey).map((field) => field.fieldKey).filter(Boolean),
          inheritDefault: presentation.inherited
        }
      };
    })
  };
}

function workflowBoundFormFieldOptions(selected = '') {
  const fields = workflowBoundFormFields();
  const missing = selected && !fields.some((field) => field.fieldKey === selected)
    ? `<option value="${escapeHtml(selected)}" selected>${escapeHtml(selected)} · not available in selected form</option>`
    : '';
  return `<option value="">Choose a field</option>${missing}${fields.map((field) => `<option value="${escapeHtml(field.fieldKey)}" ${field.fieldKey === selected ? 'selected' : ''}>${escapeHtml(field.label || titleCaseMessage(field.fieldKey))} · ${escapeHtml(field.fieldKey)}</option>`).join('')}`;
}

function defaultWorkflowStage(index = 0) {
  return {
    stageKey: `approval_${index + 1}`,
    name: `Approval ${index + 1}`,
    order: index,
    enabled: true,
    approvalMode: 'all',
    selfApprovalPolicy: 'error',
    skipWhenConditionFalse: false,
    condition: null,
    decisionPolicy: { approvalRemark: 'optional', quorum: 1 },
    attachmentPolicy: { mode: 'disabled', allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'], maxFileSize: 5242880, maxFileCount: 3, actions: ['approval', 'rejection', 'return'], malwareScanRequired: false },
    approverRules: [],
    slaPolicy: { enabled: false, duration: 24, unit: 'hours', reminderOffsets: [], escalationMode: 'notify', recurringOverdueReminder: { enabled: false, every: 1, unit: 'days', maxOccurrences: 3 }, businessCalendar: { enabled: false, weekdays: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '17:00', holidays: [] } },
    emailPolicy: { enabled: false, events: ['workflow.stage.started', 'workflow.reminder_due', 'workflow.escalated'], subject: '{{workflowName}} · {{requestId}}', message: 'Action is required for {{requestId}} at {{stageName}}.' }
  };
}

function renderWorkflowStagesLegacy() {
  const editor = $('#workflowStageEditor');
  if (!editor) return;
  editor.innerHTML = state.workflowDraftStages.map((stage, index) => {
    const rule = stage.approverRules?.[0] || {};
    const references = (stage.approverRules || []).map((item) => item.resolverReference).filter(Boolean).join(', ');
    return `<article class="workflow-stage-editor-card" data-workflow-stage-index="${index}">
      <div class="workflow-stage-order"><span>${String(index + 1).padStart(2, '0')}</span><i></i></div>
      <div class="workflow-stage-editor-body">
        <div class="workflow-stage-editor-heading"><div><strong>${escapeHtml(stage.name || `Stage ${index + 1}`)}</strong><small>${escapeHtml(stage.stageKey || '')}</small></div><div class="table-action-group">${index ? '<button type="button" class="secondary" data-move-workflow-stage="-1">↑</button>' : ''}${index < state.workflowDraftStages.length - 1 ? '<button type="button" class="secondary" data-move-workflow-stage="1">↓</button>' : ''}<button type="button" class="secondary danger-link" data-remove-workflow-stage>Remove</button></div></div>
        <div class="workflow-stage-fields">
          <label>Stage name<input data-stage-field="name" value="${escapeHtml(stage.name || '')}" maxlength="160" required></label>
          <label>Stable key<input data-stage-field="stageKey" value="${escapeHtml(stage.stageKey || '')}" maxlength="80" required></label>
          <label>Approver type<select data-stage-field="resolverType">
            ${[['user', 'Specific user ID'], ['role', 'User role'], ['reporting_manager', 'Requester reporting manager'], ['organization_responsibility', 'Organization responsibility ID'], ['record_user_field', 'User ID from record field']].map(([value, label]) => `<option value="${value}" ${rule.resolverType === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select></label>
          <label>Approver reference${['reporting_manager'].includes(rule.resolverType) ? ' (not required)' : ''}<input data-stage-field="resolverReferences" value="${escapeHtml(references)}" placeholder="IDs or roles, separated by commas"></label>
          <label>Condition field <span class="muted">(optional)</span><input data-stage-field="conditionField" value="${escapeHtml(stage.condition?.fieldKey || '')}" placeholder="amount"></label>
          <label>Condition operator<select data-stage-field="conditionOperator">${['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal', 'contains', 'is_empty', 'is_not_empty'].map((operator) => `<option value="${operator}" ${stage.condition?.operator === operator ? 'selected' : ''}>${escapeHtml(titleCaseMessage(operator))}</option>`).join('')}</select></label>
          <label>Condition value<input data-stage-field="conditionValue" value="${escapeHtml(stage.condition?.value ?? '')}"></label>
          <label>Approval remark<select data-stage-field="approvalRemark"><option value="optional" ${stage.decisionPolicy?.approvalRemark !== 'required' ? 'selected' : ''}>Optional</option><option value="required" ${stage.decisionPolicy?.approvalRemark === 'required' ? 'selected' : ''}>Required</option></select></label>
          <label>SLA duration<input data-stage-field="slaDuration" type="number" min="1" value="${Number(stage.slaPolicy?.duration) || 24}"></label>
          <label>SLA unit<select data-stage-field="slaUnit"><option value="hours" ${stage.slaPolicy?.unit !== 'days' ? 'selected' : ''}>Hours</option><option value="days" ${stage.slaPolicy?.unit === 'days' ? 'selected' : ''}>Days</option></select></label>
        </div>
        <div class="workflow-stage-switches">
          <label class="checkbox-label"><input data-stage-field="enabled" type="checkbox" ${stage.enabled !== false ? 'checked' : ''}> Stage enabled</label>
          <label class="checkbox-label"><input data-stage-field="skipWhenConditionFalse" type="checkbox" ${stage.skipWhenConditionFalse ? 'checked' : ''}> Skip when condition is not met</label>
          <label class="checkbox-label"><input data-stage-field="autoApprove" type="checkbox" ${stage.selfApprovalPolicy === 'auto_approve' ? 'checked' : ''}> Auto-approve eligible self-approval</label>
          <label class="checkbox-label"><input data-stage-field="slaEnabled" type="checkbox" ${stage.slaPolicy?.enabled ? 'checked' : ''}> Track due date</label>
          <label>Remind before due<input data-stage-field="slaReminderOffsets" value="${escapeHtml((stage.slaPolicy?.reminderOffsets || []).join(', '))}" placeholder="For example: 12, 2"></label>
          <label>When overdue<select data-stage-field="slaEscalationMode"><option value="notify" ${stage.slaPolicy?.escalationMode !== 'none' ? 'selected' : ''}>Notify through Automation Flow</option><option value="none" ${stage.slaPolicy?.escalationMode === 'none' ? 'selected' : ''}>Mark overdue only</option></select></label>
        </div>
      </div>
    </article>`;
  }).join('') || '<div class="empty-state"><h3>No approval stages</h3><p>Add at least one enabled stage before checking or publishing this workflow.</p></div>';
}

function captureWorkflowStagesLegacy() {
  state.workflowDraftStages = $$('#workflowStageEditor [data-workflow-stage-index]').map((card, index) => {
    const value = (name) => card.querySelector(`[data-stage-field="${name}"]`)?.value?.trim() || '';
    const checked = (name) => Boolean(card.querySelector(`[data-stage-field="${name}"]`)?.checked);
    const conditionField = value('conditionField');
    const operator = value('conditionOperator');
    const rawConditionValue = value('conditionValue');
    const conditionValue = rawConditionValue !== '' && Number.isFinite(Number(rawConditionValue)) ? Number(rawConditionValue) : rawConditionValue;
    const resolverType = value('resolverType');
    const references = value('resolverReferences').split(',').map((item) => item.trim()).filter(Boolean);
    const effectiveReferences = references.length ? references : [''];
    return {
      stageKey: value('stageKey'),
      name: value('name'),
      order: index,
      enabled: checked('enabled'),
      approvalMode: 'all',
      selfApprovalPolicy: checked('autoApprove') ? 'auto_approve' : 'error',
      skipWhenConditionFalse: checked('skipWhenConditionFalse'),
      condition: conditionField ? {
        fieldKey: conditionField,
        operator,
        ...(!['is_empty', 'is_not_empty'].includes(operator) ? { value: conditionValue } : {})
      } : null,
      decisionPolicy: { approvalRemark: value('approvalRemark') || 'optional' },
      attachmentPolicy: { mode: 'disabled' },
      slaPolicy: {
        enabled: checked('slaEnabled'),
        duration: Number(value('slaDuration')) || 24,
        unit: value('slaUnit') || 'hours',
        reminderOffsets: value('slaReminderOffsets').split(',').map(Number).filter((item) => Number.isFinite(item) && item >= 0),
        escalationMode: value('slaEscalationMode') || 'notify'
      },
      emailPolicy: state.workflowDraftStages[index]?.emailPolicy || { enabled: false, events: ['workflow.stage.started', 'workflow.reminder_due', 'workflow.escalated'], subject: '{{workflowName}} · {{requestId}}', message: 'Action is required for {{requestId}} at {{stageName}}.' },
      approverRules: effectiveReferences.map((reference, ruleIndex) => ({
        ruleKey: `${value('stageKey') || `stage_${index + 1}`}_approver_${ruleIndex + 1}`,
        resolverType,
        resolverReference: reference
      }))
    };
  });
  return state.workflowDraftStages;
}

function defaultWorkflowBuilderGraph(stages = state.workflowDraftStages) {
  const nodes = [{ id: 'start', type: 'start', label: 'Request submitted', x: 60, y: 230 }];
  stages.forEach((stage, index) => nodes.push({ id: `stage:${stage.stageKey}`, type: 'approval', stageKey: stage.stageKey, x: 300 + (index * 245), y: 210 }));
  nodes.push({ id: 'end', type: 'end', label: 'Request complete', x: 300 + (stages.length * 245), y: 230 });
  return {
    nodes,
    edges: nodes.slice(0, -1).map((node, index) => ({ id: `edge:${node.id}:${nodes[index + 1].id}`, from: node.id, to: nodes[index + 1].id, label: index ? 'Approved' : 'Submit', outcome: index ? 'approved' : 'submit' }))
  };
}

function normalizeWorkflowBuilderGraph(graph, stages = state.workflowDraftStages) {
  if (!graph?.nodes?.length) return defaultWorkflowBuilderGraph(stages);
  const stageKeys = new Set(stages.map((stage) => stage.stageKey));
  const nodes = graph.nodes.filter((node) => node.type !== 'approval' || stageKeys.has(node.stageKey)).map((node) => ({ ...node, x: Number(node.x) || 80, y: Number(node.y) || 180 }));
  stages.forEach((stage, index) => {
    if (!nodes.some((node) => node.type === 'approval' && node.stageKey === stage.stageKey)) nodes.push({ id: `stage:${stage.stageKey}`, type: 'approval', stageKey: stage.stageKey, x: 300 + (index * 245), y: 210 });
  });
  if (!nodes.some((node) => node.type === 'start')) nodes.unshift({ id: 'start', type: 'start', label: 'Request submitted', x: 60, y: 230 });
  if (!nodes.some((node) => node.type === 'end')) nodes.push({ id: 'end', type: 'end', label: 'Request complete', x: 300 + (stages.length * 245), y: 230 });
  const ids = new Set(nodes.map((node) => node.id));
  const edges = (graph.edges || []).filter((edge) => ids.has(edge.from) && ids.has(edge.to));
  return { nodes, edges: edges.length ? edges : defaultWorkflowBuilderGraph(stages).edges };
}

function workflowStageForNode(node) {
  return node?.type === 'approval' ? state.workflowDraftStages.find((stage) => stage.stageKey === node.stageKey) : null;
}

function workflowNodeCenter(node) {
  return { x: Number(node.x) + 92, y: Number(node.y) + 44 };
}

function workflowEdgePath(from, to) {
  const start = workflowNodeCenter(from);
  const end = workflowNodeCenter(to);
  const bend = Math.max(55, Math.abs(end.x - start.x) * .42);
  return `M ${start.x} ${start.y} C ${start.x + bend} ${start.y}, ${end.x - bend} ${end.y}, ${end.x} ${end.y}`;
}

function workflowRubberBand(value, minimum, maximum, dimension = 160) {
  if (value >= minimum && value <= maximum) return value;
  const boundary = value < minimum ? minimum : maximum;
  const overshoot = value - boundary;
  return boundary + ((overshoot * dimension * .55) / (dimension + (.55 * Math.abs(overshoot))));
}

function workflowDragPosition(drag, clientX, clientY) {
  const canvas = $('#workflowCanvas');
  const bounds = canvas.getBoundingClientRect();
  const nodeWidth = drag.width / state.workflowCanvasZoom;
  const nodeHeight = drag.height / state.workflowCanvasZoom;
  const rawX = ((clientX - bounds.left) / state.workflowCanvasZoom) - drag.grabOffsetX;
  const rawY = ((clientY - bounds.top) / state.workflowCanvasZoom) - drag.grabOffsetY;
  return {
    x: workflowRubberBand(rawX, 0, 1600 - nodeWidth),
    y: workflowRubberBand(rawY, 0, 820 - nodeHeight),
    maxX: 1600 - nodeWidth,
    maxY: 820 - nodeHeight
  };
}

function updateWorkflowConnectedEdges(nodeId, x, y) {
  const graph = state.workflowBuilderGraph;
  const draggedNode = graph.nodes.find((node) => node.id === nodeId);
  if (!draggedNode) return;
  graph.edges.filter((edge) => edge.from === nodeId || edge.to === nodeId).forEach((edge) => {
    const group = $(`#workflowCanvas [data-workflow-edge-group="${CSS.escape(edge.id)}"]`);
    if (!group) return;
    const from = graph.nodes.find((node) => node.id === edge.from);
    const to = graph.nodes.find((node) => node.id === edge.to);
    if (!from || !to) return;
    const previewFrom = from.id === nodeId ? { ...from, x, y } : from;
    const previewTo = to.id === nodeId ? { ...to, x, y } : to;
    const a = workflowNodeCenter(previewFrom);
    const b = workflowNodeCenter(previewTo);
    const middleX = (a.x + b.x) / 2;
    const middleY = (a.y + b.y) / 2;
    group.querySelector('path')?.setAttribute('d', workflowEdgePath(previewFrom, previewTo));
    const circle = group.querySelector('circle');
    const text = group.querySelector('text');
    const label = group.querySelector('foreignObject');
    circle?.setAttribute('cx', middleX); circle?.setAttribute('cy', middleY);
    text?.setAttribute('x', middleX); text?.setAttribute('y', middleY + 3);
    label?.setAttribute('x', middleX - 46); label?.setAttribute('y', middleY + 16);
  });
}

function renderWorkflowDragFrame() {
  state.workflowCanvasDragFrame = null;
  const drag = state.workflowCanvasDrag;
  if (!drag?.dragging) return;
  const button = $(`#workflowCanvas [data-workflow-node-id="${CSS.escape(drag.nodeId)}"]`);
  if (!button) return;
  button.classList.add('is-dragging');
  button.style.transform = `translate3d(${drag.previewX - drag.x}px, ${drag.previewY - drag.y}px, 0)`;
  updateWorkflowConnectedEdges(drag.nodeId, drag.previewX, drag.previewY);
}

function queueWorkflowDragFrame() {
  if (!state.workflowCanvasDragFrame) state.workflowCanvasDragFrame = requestAnimationFrame(renderWorkflowDragFrame);
}

function finishWorkflowCanvasInteraction(event) {
  const drag = state.workflowCanvasDrag;
  if (drag && (!event || event.pointerId === drag.pointerId)) {
    if (state.workflowCanvasDragFrame) cancelAnimationFrame(state.workflowCanvasDragFrame);
    state.workflowCanvasDragFrame = null;
    if (drag.dragging) {
      const node = state.workflowBuilderGraph.nodes.find((item) => item.id === drag.nodeId);
      if (node) {
        node.x = Math.round(Math.min(drag.maxX, Math.max(0, drag.previewX)));
        node.y = Math.round(Math.min(drag.maxY, Math.max(0, drag.previewY)));
      }
      state.workflowCanvasSuppressClick = true;
      renderWorkflowCanvas();
    }
    state.workflowCanvasDrag = null;
  }
  state.workflowCanvasPan = null;
  $('#workflowCanvasViewport')?.classList.remove('is-panning');
}

function announceWorkflowCanvas(message) {
  const status = $('#workflowCanvasAnnouncement');
  if (!status) return;
  status.textContent = '';
  requestAnimationFrame(() => { status.textContent = message; });
}

function workflowNodeAccessibleLabel(node, label) {
  const position = `${Math.round(Number(node.x))} pixels from left, ${Math.round(Number(node.y))} pixels from top`;
  return `${label}, ${titleCaseMessage(node.type)} node, ${position}. Use arrow keys to move, Enter to select${node.type === 'start' ? '' : ', or Delete to remove'}.`;
}

function moveWorkflowNodeByKeyboard(nodeId, key, accelerated = false) {
  const node = state.workflowBuilderGraph.nodes.find((item) => item.id === nodeId);
  if (!node) return;
  const step = accelerated ? 20 : 5;
  const delta = { ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] }[key];
  if (!delta) return;
  node.x = Math.round(Math.min(1600 - 184, Math.max(0, Number(node.x) + delta[0])));
  node.y = Math.round(Math.min(820 - 88, Math.max(0, Number(node.y) + delta[1])));
  state.selectedWorkflowNodeId = node.id;
  state.selectedWorkflowEdgeId = '';
  const stage = workflowStageForNode(node);
  const label = stage?.name || node.label || titleCaseMessage(node.type);
  renderWorkflowCanvas(node.id);
  announceWorkflowCanvas(`${label} moved to ${node.x} pixels from left and ${node.y} pixels from top.`);
}

function cancelWorkflowCanvasMode() {
  const wasConnecting = Boolean(state.workflowConnectFrom);
  const wasDragging = Boolean(state.workflowCanvasDrag || state.workflowCanvasPan);
  if (!wasConnecting && !wasDragging) return false;
  state.workflowConnectFrom = '';
  if (state.workflowCanvasDragFrame) cancelAnimationFrame(state.workflowCanvasDragFrame);
  state.workflowCanvasDragFrame = null;
  state.workflowCanvasDrag = null;
  state.workflowCanvasPan = null;
  $('#workflowCanvasViewport')?.classList.remove('is-panning');
  renderWorkflowCanvas(state.selectedWorkflowNodeId);
  announceWorkflowCanvas(wasConnecting ? 'Connection cancelled.' : 'Movement cancelled.');
  return true;
}

function renderWorkflowCanvas(focusNodeId = '') {
  const canvas = $('#workflowCanvas');
  if (!canvas) return;
  const graph = state.workflowBuilderGraph;
  const edges = graph.edges.map((edge) => {
    const from = graph.nodes.find((node) => node.id === edge.from);
    const to = graph.nodes.find((node) => node.id === edge.to);
    if (!from || !to) return '';
    const a = workflowNodeCenter(from);
    const b = workflowNodeCenter(to);
    const x = (a.x + b.x) / 2;
    const y = (a.y + b.y) / 2;
    return `<g class="workflow-canvas-edge ${state.selectedWorkflowEdgeId === edge.id ? 'is-selected' : ''}" data-workflow-edge-group="${escapeHtml(edge.id)}"><path d="${workflowEdgePath(from, to)}"></path><circle cx="${x}" cy="${y}" r="12"></circle><text x="${x}" y="${y + 3}">›</text><foreignObject x="${x - 46}" y="${y + 16}" width="92" height="26"><button type="button" data-workflow-edge-id="${escapeHtml(edge.id)}">${escapeHtml(edge.label || edge.outcome || 'Continue')}</button></foreignObject></g>`;
  }).join('');
  const nodes = graph.nodes.map((node) => {
    const stage = workflowStageForNode(node);
    const label = stage?.name || node.label || titleCaseMessage(node.type);
    const detail = stage ? (stage.condition ? 'Conditional approval' : 'All approvers') : (node.type === 'start' ? 'Request enters here' : 'Route finishes here');
    return `<button type="button" class="workflow-canvas-node is-${node.type} ${state.selectedWorkflowNodeId === node.id ? 'is-selected' : ''} ${state.workflowConnectFrom === node.id ? 'is-connecting' : ''}" data-workflow-node-id="${escapeHtml(node.id)}" aria-label="${escapeHtml(workflowNodeAccessibleLabel(node, label))}" aria-describedby="workflowKeyboardHelp" style="left:${Number(node.x)}px;top:${Number(node.y)}px"><span class="workflow-node-glyph">${node.type === 'start' ? 'S' : node.type === 'end' ? 'E' : 'A'}</span><span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(detail)}</small></span><i></i></button>`;
  }).join('');
  canvas.style.transform = `scale(${state.workflowCanvasZoom})`;
  canvas.innerHTML = `<svg class="workflow-canvas-edges" width="1600" height="820" viewBox="0 0 1600 820">${edges}</svg>${nodes}`;
  $('#workflowZoomLabel').textContent = `${Math.round(state.workflowCanvasZoom * 100)}%`;
  $('#workflowConnectButton').classList.toggle('is-active', Boolean(state.workflowConnectFrom));
  $('#workflowConnectButton').setAttribute('aria-pressed', String(Boolean(state.workflowConnectFrom)));
  $('#workflowCanvasSaveState').textContent = state.workflowConnectFrom ? 'Choose a destination node' : `${state.workflowDraftStages.length} approval stage${state.workflowDraftStages.length === 1 ? '' : 's'}`;
  $('#workflowRouteStageCount').textContent = String(state.workflowDraftStages.length);
  $('#workflowRouteConnectionCount').textContent = String(graph.edges.length);
  $('#workflowRouteConditionCount').textContent = String(graph.edges.filter((edge) => edge.condition?.rules?.length).length);
  renderWorkflowCanvasInspector();
  if (focusNodeId) requestAnimationFrame(() => $(`#workflowCanvas [data-workflow-node-id="${CSS.escape(focusNodeId)}"]`)?.focus());
}

function setWorkflowInspectorCollapsed(collapsed) {
  state.workflowInspectorCollapsed = Boolean(collapsed);
  const card = $('.workflow-visual-builder-card');
  const button = $('#workflowInspectorToggle');
  card?.classList.toggle('is-inspector-collapsed', state.workflowInspectorCollapsed);
  if (button) {
    button.textContent = state.workflowInspectorCollapsed ? 'Show settings' : 'Hide settings';
    button.setAttribute('aria-expanded', String(!state.workflowInspectorCollapsed));
  }
}

function openWorkflowRouteDesigner() {
  const card = $('.workflow-visual-builder-card');
  if (!card || state.workflowRouteDesignerOpen) return;
  state.workflowRouteDesignerOpen = true;
  state.workflowRouteReturnScrollY = window.scrollY;
  document.body.classList.add('workflow-route-designer-open');
  card.classList.add('is-designer-open');
  setWorkflowInspectorCollapsed(false);
  renderWorkflowCanvas();
  requestAnimationFrame(() => fitWorkflowCanvas());
  $('#closeWorkflowRouteDesigner')?.focus();
}

function closeWorkflowRouteDesigner() {
  const card = $('.workflow-visual-builder-card');
  if (!card || !state.workflowRouteDesignerOpen) return;
  state.workflowRouteDesignerOpen = false;
  document.body.classList.remove('workflow-route-designer-open');
  card.classList.remove('is-designer-open', 'is-inspector-collapsed');
  window.scrollTo({ top: state.workflowRouteReturnScrollY, behavior: 'auto' });
  $('#openWorkflowRouteDesigner')?.focus();
}

async function saveWorkflowRouteDesigner() {
  const button = $('#saveWorkflowRouteDesigner');
  button.disabled = true;
  button.textContent = 'Saving…';
  try {
    await saveWorkflowDefinition();
    openWorkflowRouteDesigner();
    const notice = $('#workflowRouteSaveNotice');
    clearTimeout(state.workflowRouteSaveNoticeTimer);
    notice.classList.remove('is-visible');
    void notice.offsetWidth;
    notice.classList.add('is-visible');
    state.workflowRouteSaveNoticeTimer = setTimeout(() => notice.classList.remove('is-visible'), 4000);
  } finally {
    button.disabled = false;
    button.textContent = 'Save changes';
  }
}

function workflowInspectorInput(label, field, value, type = 'text', extra = '') {
  return `<label>${label}<input type="${type}" data-workflow-node-field="${field}" value="${escapeHtml(value ?? '')}" ${extra}></label>`;
}

function workflowApproverRuleKey(stageKey, resolverType, resolverReference = '') {
  const suffix = String(resolverReference || 'requester').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'requester';
  return `${String(stageKey || 'stage').toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${resolverType}_${suffix}`.slice(0, 80);
}

function workflowApproverOption(stage, resolverType, resolverReference, label, detail = '', resolverConfig = {}) {
  const selected = (stage.approverRules || []).some((rule) => rule.resolverType === resolverType && String(rule.resolverReference || '') === String(resolverReference || ''));
  return `<label class="workflow-approver-option" data-workflow-approver-search="${escapeHtml(`${label} ${detail} ${resolverReference}`.toLowerCase())}"><input type="checkbox" data-workflow-approver-type="${escapeHtml(resolverType)}" data-workflow-approver-reference="${escapeHtml(resolverReference)}" data-workflow-approver-config="${escapeHtml(JSON.stringify(resolverConfig))}" ${selected ? 'checked' : ''}><span><strong>${escapeHtml(label)}</strong>${detail ? `<small>${escapeHtml(detail)}</small>` : ''}</span></label>`;
}

function renderWorkflowApproverPicker(stage) {
  const activeUsers = (state.users || []).filter((user) => user.status === 'active');
  const roles = [...new Set(activeUsers.map((user) => String(user.role || '').trim()).filter(Boolean))].sort();
  const departments = (state.departmentNodes || []).filter((node) => node.enabled !== false && node.type !== 'organization');
  const selectedRules = stage.approverRules || [];
  const known = new Set([
    ...activeUsers.map((user) => `user:${user.id}`),
    ...roles.map((role) => `role:${role}`),
    ...departments.map((node) => `organization_responsibility:${node.id}`),
    'reporting_manager:'
  ]);
  const unavailable = selectedRules.filter((rule) => rule.resolverReference && !known.has(`${rule.resolverType}:${rule.resolverReference}`) && rule.resolverType !== 'record_user_field');
  return `<div class="workflow-approver-picker">
    <p class="muted">Select any combination. Every resolved approver must approve; duplicate people are counted once.</p>
    <label class="workflow-approver-search"><span aria-hidden="true">⌕</span><input type="search" data-workflow-approver-search-input placeholder="Search users, roles, departments" autocomplete="off"><button type="button" data-clear-workflow-approver-search aria-label="Clear approver search">×</button></label>
    <p class="workflow-approver-search-empty" data-workflow-approver-search-empty hidden>No matching users, roles, or departments.</p>
    <details open data-workflow-approver-group><summary>Users <small>${activeUsers.length}</small></summary><div class="workflow-approver-options">${activeUsers.map((user) => workflowApproverOption(stage, 'user', String(user.id), user.name || user.email || `User ${user.id}`, [user.staffId || user.staff_id, user.email].filter(Boolean).join(' · '))).join('') || '<small class="muted">No active users.</small>'}</div></details>
    <details data-workflow-approver-group><summary>Roles <small>${roles.length}</small></summary><div class="workflow-approver-options">${roles.map((role) => workflowApproverOption(stage, 'role', role, titleCaseMessage(role), 'All active users with this role')).join('') || '<small class="muted">No active roles.</small>'}</div></details>
    <details data-workflow-approver-group><summary>Departments <small>${departments.length}</small></summary><div class="workflow-approver-options">${departments.map((node) => workflowApproverOption(stage, 'organization_responsibility', String(node.id), node.name, `${titleCaseMessage(node.type)}${node.parentName ? ` · ${node.parentName}` : ''}`, { includeDescendants: true })).join('') || '<small class="muted">No enabled departments.</small>'}</div></details>
    <details><summary>Dynamic approvers</summary><div class="workflow-approver-options">${workflowApproverOption(stage, 'reporting_manager', '', 'Requester reporting manager', 'Resolved when the request is submitted')}<label>Users from form fields<select multiple size="4" data-workflow-record-approver-fields>${workflowBoundFormFields().map((field) => `<option value="${escapeHtml(field.fieldKey)}" ${selectedRules.some((rule) => rule.resolverType === 'record_user_field' && rule.resolverReference === field.fieldKey) ? 'selected' : ''}>${escapeHtml(field.label || titleCaseMessage(field.fieldKey))}</option>`).join('')}</select><small>Use Ctrl/Cmd to select more than one field.</small></label></div></details>
    ${unavailable.length ? `<div class="workflow-approver-unavailable"><strong>Unavailable saved selections</strong>${unavailable.map((rule) => `<small>${escapeHtml(titleCaseMessage(rule.resolverType))}: ${escapeHtml(rule.resolverReference || 'dynamic')}</small>`).join('')}</div>` : ''}
  </div>`;
}

function filterWorkflowApproverOptions(input) {
  const inspector = input.closest('#workflowCanvasInspector');
  const query = input.value.trim().toLowerCase();
  let matchCount = 0;
  inspector?.querySelectorAll('[data-workflow-approver-group]').forEach((group) => {
    let groupMatches = 0;
    group.querySelectorAll('[data-workflow-approver-search]').forEach((option) => {
      const selected = Boolean(option.querySelector('input:checked'));
      const matches = !query || option.dataset.workflowApproverSearch.includes(query);
      option.hidden = !matches && !selected;
      if (matches) groupMatches += 1;
    });
    group.hidden = Boolean(query) && groupMatches === 0 && !group.querySelector('input:checked');
    if (query && groupMatches) group.open = true;
    matchCount += groupMatches;
  });
  const empty = inspector?.querySelector('[data-workflow-approver-search-empty]');
  if (empty) empty.hidden = !query || matchCount > 0;
  const clear = inspector?.querySelector('[data-clear-workflow-approver-search]');
  if (clear) clear.classList.toggle('is-visible', Boolean(query));
}

function toggleWorkflowApproverRule(target) {
  const node = state.workflowBuilderGraph.nodes.find((item) => item.id === state.selectedWorkflowNodeId);
  const stage = workflowStageForNode(node);
  if (!stage) return;
  const resolverType = target.dataset.workflowApproverType;
  const resolverReference = target.dataset.workflowApproverReference || '';
  stage.approverRules ||= [];
  stage.approverRules = stage.approverRules.filter((rule) => rule.resolverReference || rule.resolverType === 'reporting_manager').filter((rule) => !(rule.resolverType === resolverType && String(rule.resolverReference || '') === resolverReference));
  if (target.checked) {
    let resolverConfig = {};
    try { resolverConfig = JSON.parse(target.dataset.workflowApproverConfig || '{}'); } catch (_error) { resolverConfig = {}; }
    stage.approverRules.push({ ruleKey: workflowApproverRuleKey(stage.stageKey, resolverType, resolverReference), resolverType, resolverReference, resolverConfig });
  }
  renderWorkflowCanvas();
}

function updateWorkflowRecordApproverFields(target) {
  const node = state.workflowBuilderGraph.nodes.find((item) => item.id === state.selectedWorkflowNodeId);
  const stage = workflowStageForNode(node);
  if (!stage) return;
  const selected = [...target.selectedOptions].map((option) => option.value);
  stage.approverRules = (stage.approverRules || []).filter((rule) => rule.resolverType !== 'record_user_field');
  selected.forEach((resolverReference) => stage.approverRules.push({ ruleKey: workflowApproverRuleKey(stage.stageKey, 'record_user_field', resolverReference), resolverType: 'record_user_field', resolverReference, resolverConfig: {} }));
  renderWorkflowCanvas();
}

function renderWorkflowEdgeCondition(edge) {
  if (!['condition_met', 'condition_not_met'].includes(edge.outcome)) return '';
  const condition = edge.condition || { group: 'all', rules: [{ fieldKey: '', operator: 'equals', value: '' }] };
  const operators = ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal', 'is_empty', 'is_not_empty', 'in', 'not_in'];
  const rows = condition.rules.map((rule, index) => `<article class="workflow-edge-condition-rule" data-workflow-edge-condition-index="${index}"><div><strong>Rule ${index + 1}</strong>${condition.rules.length > 1 ? `<button type="button" class="link-button" data-remove-workflow-edge-condition="${index}">Remove</button>` : ''}</div><label>Form field<select data-workflow-edge-condition-field="fieldKey">${workflowBoundFormFieldOptions(rule.fieldKey || '')}</select></label><label>Operator<select data-workflow-edge-condition-field="operator">${operators.map((operator) => `<option value="${operator}" ${rule.operator === operator ? 'selected' : ''}>${escapeHtml(titleCaseMessage(operator))}</option>`).join('')}</select></label>${['is_empty', 'is_not_empty'].includes(rule.operator) ? '' : `<label>Value<input data-workflow-edge-condition-field="value" value="${escapeHtml(rule.value ?? '')}" placeholder="1000"></label>`}</article>`).join('');
  return `<div class="workflow-inspector-section workflow-edge-condition-builder"><span>${edge.outcome === 'condition_met' ? 'Continue when' : 'Continue when not'}</span><div class="workflow-condition-match"><small>Match</small><div><button type="button" data-workflow-edge-condition-group="all" class="${condition.group !== 'any' ? 'is-active' : ''}">All rules</button><button type="button" data-workflow-edge-condition-group="any" class="${condition.group === 'any' ? 'is-active' : ''}">Any rule</button></div></div>${rows}<button type="button" class="secondary" data-add-workflow-edge-condition>+ Add rule</button><p class="muted">${edge.outcome === 'condition_met' ? 'This line matches when the configured rules pass.' : 'This line matches when the configured rules do not pass.'}</p></div>`;
}

const workflowAttachmentFileTypes = [
  { value: 'application/pdf', label: 'PDF', extension: '.pdf' },
  { value: 'image/jpeg', label: 'JPG / JPEG image', extension: '.jpg, .jpeg' },
  { value: 'image/png', label: 'PNG image', extension: '.png' },
  { value: 'text/plain', label: 'Plain text', extension: '.txt' },
  { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word document', extension: '.docx' },
  { value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel spreadsheet', extension: '.xlsx' }
];

function workflowAttachmentTypeSummary(count) {
  return count === 1 ? '1 file type selected' : `${count} file types selected`;
}

function renderWorkflowAttachmentTypePicker(selectedTypes = []) {
  const selected = new Set(selectedTypes);
  const known = new Set(workflowAttachmentFileTypes.map((type) => type.value));
  const legacyTypes = selectedTypes.filter((type) => !known.has(type));
  const options = [
    ...workflowAttachmentFileTypes,
    ...legacyTypes.map((value) => ({ value, label: 'Previously configured type', extension: value }))
  ];
  return `<div class="workflow-file-type-field"><span>Allowed file types</span><details class="workflow-file-type-picker"><summary><span data-workflow-file-type-summary>${workflowAttachmentTypeSummary(selected.size)}</span><i aria-hidden="true">⌄</i></summary><div class="workflow-file-type-options" role="group" aria-label="Allowed file types">${options.map((type) => `<label><input type="checkbox" data-workflow-node-field="attachmentType:${escapeHtml(type.value)}" ${selected.has(type.value) ? 'checked' : ''}><span><strong>${escapeHtml(type.label)}</strong><small>${escapeHtml(type.extension)}</small></span></label>`).join('')}</div></details><small>Choose one or more file types people can upload.</small></div>`;
}

function syncWorkflowAttachmentTypeSummary(target) {
  const field = target.closest('.workflow-file-type-field');
  const summary = field?.querySelector('[data-workflow-file-type-summary]');
  const count = field?.querySelectorAll('[data-workflow-node-field^="attachmentType:"]:checked').length || 0;
  if (summary) summary.textContent = workflowAttachmentTypeSummary(count);
}

function renderWorkflowAttachmentPolicy(policy = {}, nodeType = 'approval') {
  const current = {
    mode: policy.mode || 'disabled',
    allowedTypes: policy.allowedTypes?.length ? policy.allowedTypes : ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSize: Number(policy.maxFileSize) || 5242880,
    maxFileCount: Number(policy.maxFileCount) || 3,
    actions: policy.actions?.length ? policy.actions : (nodeType === 'start' ? ['submission'] : ['approval', 'rejection', 'return']),
    malwareScanRequired: Boolean(policy.malwareScanRequired)
  };
  const actions = nodeType === 'start' ? [['submission', 'Submission']] : [['approval', 'Approval'], ['rejection', 'Rejection'], ['return', 'Return']];
  return `<div class="workflow-inspector-section"><span>File upload rules</span><p class="muted workflow-upload-rules-intro">These rules apply to Attachment fields in the selected form.</p>${renderWorkflowAttachmentTypePicker(current.allowedTypes)}${workflowInspectorInput('Maximum size per file (MB)', 'attachmentMaxSizeMb', Math.max(1, Math.round(current.maxFileSize / 1048576)), 'number', 'min="1" max="25"')}${workflowInspectorInput('Maximum files per action', 'attachmentMaxCount', current.maxFileCount, 'number', 'min="1" max="20"')}<label>Additional supporting files<select data-workflow-node-field="attachmentMode"><option value="disabled" ${current.mode === 'disabled' ? 'selected' : ''}>Do not allow</option><option value="optional" ${current.mode === 'optional' ? 'selected' : ''}>Allow, optional</option><option value="required" ${current.mode === 'required' ? 'selected' : ''}>Allow, required</option></select><small>Shows a separate upload area for files not requested by the form.</small></label><div class="workflow-stage-switches">${current.mode === 'disabled' ? '' : actions.map(([value, label]) => `<label class="checkbox-label"><input type="checkbox" data-workflow-node-field="attachmentAction:${value}" ${current.actions.includes(value) ? 'checked' : ''}> Allow additional files on ${label.toLowerCase()}</label>`).join('')}<label class="checkbox-label"><input type="checkbox" data-workflow-node-field="attachmentMalwareScan" ${current.malwareScanRequired ? 'checked' : ''}> Require malware scan before accepting files</label></div><p class="muted">Scanning uses the configured ClamAV service and fails closed. Files are never downloadable unless clean.</p></div>`;
}

function renderWorkflowCanvasInspector() {
  const inspector = $('#workflowCanvasInspector');
  if (!inspector) return;
  const edge = state.workflowBuilderGraph.edges.find((item) => item.id === state.selectedWorkflowEdgeId);
  if (edge) {
    inspector.innerHTML = `<div class="workflow-inspector-heading"><span class="workflow-palette-glyph is-connection">↗</span><div><strong>Connection</strong><small>${escapeHtml(edge.from)} → ${escapeHtml(edge.to)}</small></div></div><div class="workflow-inspector-section"><span>Route</span>${workflowInspectorInput('Line label', 'edgeLabel', edge.label || '')}<label>Outcome<select data-workflow-node-field="edgeOutcome">${['continue', 'submit', 'approved', 'condition_met', 'condition_not_met', 'rejected', 'returned'].map((value) => `<option value="${value}" ${edge.outcome === value ? 'selected' : ''}>${escapeHtml(titleCaseMessage(value))}</option>`).join('')}</select></label></div>${renderWorkflowEdgeCondition(edge)}<button type="button" class="secondary danger-link workflow-inspector-remove" data-remove-workflow-edge>Remove connection</button>`;
    return;
  }
  const node = state.workflowBuilderGraph.nodes.find((item) => item.id === state.selectedWorkflowNodeId);
  if (!node) {
    inspector.innerHTML = '<div class="workflow-canvas-inspector-empty"><span>◇</span><strong>Select a node or line</strong><p>Configure the selected item here. Use Connect, then choose a source and destination.</p></div>';
    return;
  }
  const stage = workflowStageForNode(node);
  if (!stage) {
    const presentation = workflowNodePresentation(node);
    inspector.innerHTML = `<div class="workflow-inspector-heading"><span class="workflow-palette-glyph is-${node.type}">${node.type === 'start' ? 'S' : 'E'}</span><div><strong>${escapeHtml(node.label || titleCaseMessage(node.type))}</strong><small>${node.type === 'start' ? 'Begins the request' : 'Finishes this route'}</small></div></div><div class="workflow-inspector-section"><span>Node</span>${workflowInspectorInput('Label', 'nodeLabel', node.label || '')}</div><div class="workflow-inspector-section"><span>${node.type === 'start' ? 'Requester form' : 'Result form'}</span><label>Form layout<select data-workflow-node-field="nodeFormKey">${workflowNodeFormOptions(node)}</select></label><p class="muted">${presentation.inherited ? 'Inherits the workflow default form.' : `${presentation.fieldKeys?.length || 0} visible fields captured with this node.`}</p></div>${node.type === 'start' ? renderWorkflowAttachmentPolicy(node.attachmentPolicy, 'start') : '<button type="button" class="secondary danger-link workflow-inspector-remove" data-remove-workflow-node>Remove node</button>'}`;
    return;
  }
  inspector.innerHTML = `<div class="workflow-inspector-heading"><span class="workflow-palette-glyph is-approval">A</span><div><strong>${escapeHtml(stage.name)}</strong><small>${escapeHtml(stage.stageKey)}</small></div></div>
    <div class="workflow-inspector-section"><span>Approval node</span>${workflowInspectorInput('Stage name', 'name', stage.name)}${workflowInspectorInput('Stable key', 'stageKey', stage.stageKey)}</div>
    <div class="workflow-inspector-section"><span>Review form</span><label>Form layout<select data-workflow-node-field="nodeFormKey">${workflowNodeFormOptions(node)}</select></label><p class="muted">${workflowNodePresentation(node).inherited ? 'Inherits the workflow default form.' : `${workflowNodePresentation(node).fieldKeys?.length || 0} visible fields captured for this stage.`}</p></div>
    <div class="workflow-inspector-section"><span>Approver response</span><label>Response form<select data-workflow-node-field="responseFormKey">${workflowResponseFormOptions(node.responsePresentation?.formKey || '')}</select></label>${renderWorkflowResponseMappings(node)}</div>
    <div class="workflow-inspector-section"><span>Approvers · ${(stage.approverRules || []).length} selected</span>${renderWorkflowApproverPicker(stage)}</div>
    <div class="workflow-inspector-section"><span>Condition</span><label>Form field<select data-workflow-node-field="conditionField">${workflowBoundFormFieldOptions(stage.condition?.fieldKey || '')}</select></label><label>Operator<select data-workflow-node-field="conditionOperator">${['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal', 'contains', 'is_empty', 'is_not_empty'].map((value) => `<option value="${value}" ${stage.condition?.operator === value ? 'selected' : ''}>${escapeHtml(titleCaseMessage(value))}</option>`).join('')}</select></label>${workflowInspectorInput('Value', 'conditionValue', stage.condition?.value ?? '')}<label class="checkbox-label"><input type="checkbox" data-workflow-node-field="skipWhenConditionFalse" ${stage.skipWhenConditionFalse ? 'checked' : ''}> Skip stage when false</label></div>
    <div class="workflow-inspector-section"><span>Decision</span><label>Approval mode<select data-workflow-node-field="approvalMode"><option value="all" ${stage.approvalMode === 'all' ? 'selected' : ''}>Every approver</option><option value="any" ${stage.approvalMode === 'any' ? 'selected' : ''}>Any one approver</option><option value="quorum" ${stage.approvalMode === 'quorum' ? 'selected' : ''}>Approval quorum</option></select></label>${stage.approvalMode === 'quorum' ? workflowInspectorInput('Approvals required', 'approvalQuorum', Number(stage.decisionPolicy?.quorum) || 1, 'number', 'min="1"') : ''}<label>Approval remark<select data-workflow-node-field="approvalRemark"><option value="optional" ${stage.decisionPolicy?.approvalRemark !== 'required' ? 'selected' : ''}>Optional</option><option value="required" ${stage.decisionPolicy?.approvalRemark === 'required' ? 'selected' : ''}>Required</option></select></label><label class="checkbox-label"><input type="checkbox" data-workflow-node-field="autoApprove" ${stage.selfApprovalPolicy === 'auto_approve' ? 'checked' : ''}> Auto-approve eligible self-approval</label><label class="checkbox-label"><input type="checkbox" data-workflow-node-field="enabled" ${stage.enabled !== false ? 'checked' : ''}> Stage enabled</label></div>
    ${renderWorkflowAttachmentPolicy(stage.attachmentPolicy, 'approval')}
    <div class="workflow-inspector-section"><span>SLA</span><label class="checkbox-label"><input type="checkbox" data-workflow-node-field="slaEnabled" ${stage.slaPolicy?.enabled ? 'checked' : ''}> Track due date</label>${workflowInspectorInput('Duration', 'slaDuration', Number(stage.slaPolicy?.duration) || 24, 'number', 'min="1"')}<label>Unit<select data-workflow-node-field="slaUnit"><option value="minutes" ${stage.slaPolicy?.unit === 'minutes' ? 'selected' : ''}>Minutes</option><option value="hours" ${!['minutes', 'days'].includes(stage.slaPolicy?.unit) ? 'selected' : ''}>Hours</option><option value="days" ${stage.slaPolicy?.unit === 'days' ? 'selected' : ''}>Days</option></select></label>${workflowInspectorInput('Remind before due', 'slaReminderOffsets', (stage.slaPolicy?.reminderOffsets || []).join(', '), 'text', 'placeholder="For example: 12, 2"')}<label>When overdue<select data-workflow-node-field="slaEscalationMode"><option value="notify" ${stage.slaPolicy?.escalationMode !== 'none' ? 'selected' : ''}>Send built-in notification</option><option value="none" ${stage.slaPolicy?.escalationMode === 'none' ? 'selected' : ''}>Mark overdue only</option></select></label><label class="checkbox-label"><input type="checkbox" data-workflow-node-field="slaRecurringEnabled" ${stage.slaPolicy?.recurringOverdueReminder?.enabled ? 'checked' : ''}> Repeat reminders while overdue</label>${workflowInspectorInput('Repeat every', 'slaRecurringEvery', Number(stage.slaPolicy?.recurringOverdueReminder?.every) || 1, 'number', 'min="1"')}${workflowInspectorInput('Maximum repeats', 'slaRecurringMax', Number(stage.slaPolicy?.recurringOverdueReminder?.maxOccurrences) || 3, 'number', 'min="1" max="100"')}<label class="checkbox-label"><input type="checkbox" data-workflow-node-field="slaBusinessCalendar" ${stage.slaPolicy?.businessCalendar?.enabled ? 'checked' : ''}> Count business hours only</label>${workflowInspectorInput('Working days (0=Sun)', 'slaBusinessWeekdays', (stage.slaPolicy?.businessCalendar?.weekdays || [1,2,3,4,5]).join(', '))}${workflowInspectorInput('Working hours', 'slaBusinessHours', `${stage.slaPolicy?.businessCalendar?.startTime || '09:00'}-${stage.slaPolicy?.businessCalendar?.endTime || '17:00'}`)}${workflowInspectorInput('Holiday dates', 'slaBusinessHolidays', (stage.slaPolicy?.businessCalendar?.holidays || []).join(', '), 'text', 'placeholder="2026-01-01, 2026-05-01"')}</div>
    <div class="workflow-inspector-section"><span>Email (optional)</span><label class="checkbox-label"><input type="checkbox" data-workflow-node-field="emailEnabled" ${stage.emailPolicy?.enabled ? 'checked' : ''}> Send approval emails</label><p class="muted">Uses central Email Settings. Internal bell notifications are always created.</p><div class="workflow-email-events">${[['workflow.stage.started','Approver assigned'],['workflow.reminder_due','Reminder due'],['workflow.escalated','Escalated'],['workflow.returned','Returned'],['workflow.rejected','Rejected'],['workflow.approved','Approved']].map(([eventType,label]) => `<label class="checkbox-label"><input type="checkbox" value="${eventType}" data-workflow-node-field="emailEvent" ${(stage.emailPolicy?.events || ['workflow.stage.started','workflow.reminder_due','workflow.escalated']).includes(eventType) ? 'checked' : ''}> ${label}</label>`).join('')}</div>${workflowInspectorInput('Subject', 'emailSubject', stage.emailPolicy?.subject || '{{workflowName}} · {{requestId}}', 'text', 'placeholder="{{workflowName}} · {{requestId}}"')}<label>Message<textarea data-workflow-node-field="emailMessage" rows="4" placeholder="Action is required for {{requestId}} at {{stageName}}.">${escapeHtml(stage.emailPolicy?.message || '')}</textarea></label></div>
    <div class="workflow-inspector-section"><span>Automation</span><p class="muted">Before and after actions are attached through linked Automation Flows using this stage key and its workflow events.</p></div><button type="button" class="secondary danger-link workflow-inspector-remove" data-remove-workflow-node>Remove approval node</button>`;
}

function renderWorkflowStages() {
  renderWorkflowCanvas();
}

function captureWorkflowStages() {
  state.workflowDraftStages.forEach((stage, index) => { stage.order = index; });
  return state.workflowDraftStages;
}

function addWorkflowCanvasNode(type) {
  if (type === 'start' && state.workflowBuilderGraph.nodes.some((node) => node.type === 'start')) return toast('This workflow already has a Start node.', 'error');
  const id = `${type}:${Date.now().toString(36)}`;
  const viewport = $('#workflowCanvasViewport');
  const x = Math.max(70, ((viewport?.scrollLeft || 0) + 360) / state.workflowCanvasZoom);
  const y = Math.max(90, ((viewport?.scrollTop || 0) + 220) / state.workflowCanvasZoom);
  const node = { id, type, label: type === 'start' ? 'Request submitted' : 'Request complete', x, y };
  if (type === 'approval') {
    const stage = defaultWorkflowStage(state.workflowDraftStages.length);
    while (state.workflowDraftStages.some((item) => item.stageKey === stage.stageKey)) stage.stageKey = `approval_${Date.now().toString(36).slice(-5)}`;
    node.stageKey = stage.stageKey;
    state.workflowDraftStages.push(stage);
  }
  state.workflowBuilderGraph.nodes.push(node);
  state.selectedWorkflowNodeId = id;
  state.selectedWorkflowEdgeId = '';
  renderWorkflowCanvas();
}

function connectWorkflowNodes(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return;
  if (state.workflowBuilderGraph.edges.some((edge) => edge.from === fromId && edge.to === toId)) return toast('These nodes are already connected.', 'error');
  const from = state.workflowBuilderGraph.nodes.find((node) => node.id === fromId);
  const outcome = from?.type === 'start' ? 'submit' : 'approved';
  const edge = { id: `edge:${Date.now().toString(36)}`, from: fromId, to: toId, label: titleCaseMessage(outcome), outcome };
  state.workflowBuilderGraph.edges.push(edge);
  state.workflowConnectFrom = '';
  state.selectedWorkflowNodeId = '';
  state.selectedWorkflowEdgeId = edge.id;
  renderWorkflowCanvas();
  const fromLabel = workflowStageForNode(from)?.name || from?.label || titleCaseMessage(from?.type || 'source');
  const to = state.workflowBuilderGraph.nodes.find((node) => node.id === toId);
  const toLabel = workflowStageForNode(to)?.name || to?.label || titleCaseMessage(to?.type || 'destination');
  announceWorkflowCanvas(`Connected ${fromLabel} to ${toLabel}.`);
}

function removeSelectedWorkflowNode() {
  const id = state.selectedWorkflowNodeId;
  const node = state.workflowBuilderGraph.nodes.find((item) => item.id === id);
  if (!node || node.type === 'start') return;
  const label = workflowStageForNode(node)?.name || node.label || titleCaseMessage(node.type);
  if (node.type === 'approval') state.workflowDraftStages = state.workflowDraftStages.filter((stage) => stage.stageKey !== node.stageKey);
  state.workflowBuilderGraph.nodes = state.workflowBuilderGraph.nodes.filter((item) => item.id !== id);
  state.workflowBuilderGraph.edges = state.workflowBuilderGraph.edges.filter((edge) => edge.from !== id && edge.to !== id);
  state.selectedWorkflowNodeId = '';
  renderWorkflowCanvas();
  announceWorkflowCanvas(`${label} removed from the workflow.`);
}

function updateWorkflowInspectorField(field, target) {
  const edge = state.workflowBuilderGraph.edges.find((item) => item.id === state.selectedWorkflowEdgeId);
  if (edge) {
    if (field === 'edgeLabel') edge.label = target.value;
    if (field === 'edgeOutcome') {
      edge.outcome = target.value;
      if (['condition_met', 'condition_not_met'].includes(edge.outcome) && !edge.condition) edge.condition = { group: 'all', rules: [{ fieldKey: '', operator: 'equals', value: '' }] };
    }
    renderWorkflowCanvas();
    return;
  }
  const node = state.workflowBuilderGraph.nodes.find((item) => item.id === state.selectedWorkflowNodeId);
  if (!node) return;
  if (field === 'nodeLabel') node.label = target.value;
  if (field === 'nodeFormKey') setWorkflowNodeForm(node, target.value);
  if (field === 'responseFormKey') setWorkflowResponseForm(node, target.value);
  const stage = workflowStageForNode(node);
  const attachmentOwner = stage || (node.type === 'start' ? node : null);
  if (attachmentOwner && field.startsWith('attachment')) {
    attachmentOwner.attachmentPolicy ||= { mode: 'disabled', allowedTypes: [], maxFileSize: 5242880, maxFileCount: 3, actions: [] };
    const policy = attachmentOwner.attachmentPolicy;
    if (field === 'attachmentMode') policy.mode = target.value;
    if (field.startsWith('attachmentType:')) {
      const contentType = field.slice('attachmentType:'.length).trim().toLowerCase();
      const allowedTypes = new Set(policy.allowedTypes || []);
      target.checked ? allowedTypes.add(contentType) : allowedTypes.delete(contentType);
      policy.allowedTypes = [...allowedTypes];
      syncWorkflowAttachmentTypeSummary(target);
      return;
    }
    if (field === 'attachmentMaxSizeMb') policy.maxFileSize = Math.min(25, Math.max(1, Number(target.value) || 5)) * 1024 * 1024;
    if (field === 'attachmentMaxCount') policy.maxFileCount = Math.min(20, Math.max(1, Number(target.value) || 3));
    if (field === 'attachmentMalwareScan') policy.malwareScanRequired = target.checked;
    if (field.startsWith('attachmentAction:')) {
      const action = field.split(':')[1];
      const actions = new Set(policy.actions || []);
      target.checked ? actions.add(action) : actions.delete(action);
      policy.actions = [...actions];
    }
  }
  if (!stage) return renderWorkflowCanvas();
  const checked = target.type === 'checkbox' ? target.checked : null;
  if (field === 'name') stage.name = target.value;
  if (field === 'stageKey') {
    const previous = stage.stageKey;
    stage.stageKey = target.value.trim();
    node.stageKey = stage.stageKey;
    if (node.id === `stage:${previous}`) node.id = `stage:${stage.stageKey}`;
    state.workflowBuilderGraph.edges.forEach((item) => {
      if (item.from === `stage:${previous}`) item.from = node.id;
      if (item.to === `stage:${previous}`) item.to = node.id;
    });
    state.selectedWorkflowNodeId = node.id;
  }
  if (['conditionField', 'conditionOperator', 'conditionValue'].includes(field)) {
    const current = stage.condition || { fieldKey: '', operator: 'equals', value: '' };
    if (field === 'conditionField') current.fieldKey = target.value.trim();
    if (field === 'conditionOperator') current.operator = target.value;
    if (field === 'conditionValue') current.value = target.value !== '' && Number.isFinite(Number(target.value)) ? Number(target.value) : target.value;
    stage.condition = current.fieldKey ? current : null;
  }
  if (field === 'skipWhenConditionFalse') stage.skipWhenConditionFalse = checked;
  if (field === 'approvalRemark') stage.decisionPolicy = { ...(stage.decisionPolicy || {}), approvalRemark: target.value };
  if (field === 'approvalMode') stage.approvalMode = target.value;
  if (field === 'approvalQuorum') stage.decisionPolicy = { ...(stage.decisionPolicy || {}), quorum: Math.max(1, Number(target.value) || 1) };
  if (field === 'autoApprove') stage.selfApprovalPolicy = checked ? 'auto_approve' : 'error';
  if (field === 'enabled') stage.enabled = checked;
  if (field === 'slaEnabled') stage.slaPolicy = { ...(stage.slaPolicy || {}), enabled: checked };
  if (field === 'slaDuration') stage.slaPolicy = { ...(stage.slaPolicy || {}), duration: Number(target.value) || 24 };
  if (field === 'slaUnit') stage.slaPolicy = { ...(stage.slaPolicy || {}), unit: target.value };
  if (field === 'slaReminderOffsets') stage.slaPolicy = { ...(stage.slaPolicy || {}), reminderOffsets: target.value.split(',').map(Number).filter((item) => Number.isFinite(item) && item >= 0) };
  if (field === 'slaEscalationMode') stage.slaPolicy = { ...(stage.slaPolicy || {}), escalationMode: target.value };
  if (field === 'slaRecurringEnabled') stage.slaPolicy = { ...(stage.slaPolicy || {}), recurringOverdueReminder: { ...(stage.slaPolicy?.recurringOverdueReminder || {}), enabled: checked } };
  if (field === 'slaRecurringEvery') stage.slaPolicy = { ...(stage.slaPolicy || {}), recurringOverdueReminder: { ...(stage.slaPolicy?.recurringOverdueReminder || {}), every: Math.max(1, Number(target.value) || 1), unit: stage.slaPolicy?.unit || 'hours' } };
  if (field === 'slaRecurringMax') stage.slaPolicy = { ...(stage.slaPolicy || {}), recurringOverdueReminder: { ...(stage.slaPolicy?.recurringOverdueReminder || {}), maxOccurrences: Math.min(100, Math.max(1, Number(target.value) || 3)) } };
  if (field === 'slaBusinessCalendar') stage.slaPolicy = { ...(stage.slaPolicy || {}), businessCalendar: { ...(stage.slaPolicy?.businessCalendar || {}), enabled: checked } };
  if (field === 'slaBusinessWeekdays') stage.slaPolicy = { ...(stage.slaPolicy || {}), businessCalendar: { ...(stage.slaPolicy?.businessCalendar || {}), weekdays: target.value.split(',').map(Number).filter((value) => Number.isInteger(value) && value >= 0 && value <= 6) } };
  if (field === 'slaBusinessHours') { const [startTime, endTime] = target.value.split('-').map((value) => value.trim()); stage.slaPolicy = { ...(stage.slaPolicy || {}), businessCalendar: { ...(stage.slaPolicy?.businessCalendar || {}), startTime: startTime || '09:00', endTime: endTime || '17:00' } }; }
  if (field === 'slaBusinessHolidays') stage.slaPolicy = { ...(stage.slaPolicy || {}), businessCalendar: { ...(stage.slaPolicy?.businessCalendar || {}), holidays: target.value.split(',').map((value) => value.trim()).filter(Boolean) } };
  if (field === 'emailEnabled') stage.emailPolicy = { ...(stage.emailPolicy || {}), enabled: checked };
  if (field === 'emailSubject') stage.emailPolicy = { ...(stage.emailPolicy || {}), subject: target.value };
  if (field === 'emailMessage') stage.emailPolicy = { ...(stage.emailPolicy || {}), message: target.value };
  if (field === 'emailEvent') { const events = new Set(stage.emailPolicy?.events || []); if (checked) events.add(target.value); else events.delete(target.value); stage.emailPolicy = { ...(stage.emailPolicy || {}), events: [...events] }; }
  renderWorkflowCanvas();
}

function updateWorkflowResponseMapping(target) {
  const node = state.workflowBuilderGraph.nodes.find((item) => item.id === state.selectedWorkflowNodeId);
  const row = target.closest('[data-workflow-response-index]');
  const field = node?.responsePresentation?.fields?.[Number(row?.dataset.workflowResponseIndex)];
  if (!field) return;
  field[target.dataset.workflowResponseField] = target.type === 'checkbox' ? target.checked : target.value;
  if (target.dataset.workflowResponseField === 'storage' && target.value === 'source' && !field.targetFieldKey) field.targetFieldKey = field.fieldKey;
  renderWorkflowCanvas();
}

function updateWorkflowEdgeCondition(target) {
  const edge = state.workflowBuilderGraph.edges.find((item) => item.id === state.selectedWorkflowEdgeId);
  const row = target.closest('[data-workflow-edge-condition-index]');
  if (!edge || !row) return;
  edge.condition ||= { group: 'all', rules: [{ fieldKey: '', operator: 'equals', value: '' }] };
  const rule = edge.condition.rules[Number(row.dataset.workflowEdgeConditionIndex)];
  const field = target.dataset.workflowEdgeConditionField;
  if (!rule || !field) return;
  rule[field] = field === 'value' && target.value !== '' && Number.isFinite(Number(target.value)) ? Number(target.value) : target.value;
  renderWorkflowCanvas();
}

function fitWorkflowCanvas() {
  const viewport = $('#workflowCanvasViewport');
  if (!viewport || !state.workflowBuilderGraph.nodes.length) return;
  const nodes = state.workflowBuilderGraph.nodes;
  const minX = Math.min(...nodes.map((node) => Number(node.x)));
  const maxX = Math.max(...nodes.map((node) => Number(node.x) + 184));
  const minY = Math.min(...nodes.map((node) => Number(node.y)));
  const maxY = Math.max(...nodes.map((node) => Number(node.y) + 88));
  state.workflowCanvasZoom = Math.min(1.2, Math.max(.45, Math.min((viewport.clientWidth - 80) / (maxX - minX), (viewport.clientHeight - 80) / (maxY - minY))));
  renderWorkflowCanvas();
  requestAnimationFrame(() => viewport.scrollTo({ left: Math.max(0, (minX * state.workflowCanvasZoom) - 40), top: Math.max(0, (minY * state.workflowCanvasZoom) - 40), behavior: preferredScrollBehavior() }));
}

function activeWorkflowDefinition() {
  return state.workflowDefinitions.find((definition) => definition.workflowKey === state.activeWorkflowKey) || null;
}

function renderWorkflowDefinitionList() {
  const query = state.workflowDefinitionSearch.toLowerCase();
  const definitions = state.workflowDefinitions.filter((definition) => (
    !query || [definition.name, definition.workflowKey, definition.sourceModuleKey].some((value) => String(value || '').toLowerCase().includes(query))
  ));
  $('#workflowDefinitionList').innerHTML = definitions.map((definition) => `<button type="button" class="workflow-definition-item ${definition.workflowKey === state.activeWorkflowKey ? 'is-active' : ''}" data-workflow-definition="${escapeHtml(definition.workflowKey)}"><span><strong>${escapeHtml(definition.name)}</strong><small>${escapeHtml(definition.sourceModuleKey)} · ${escapeHtml(definition.requestPrefix || 'Prefix pending')}</small></span><em class="status-pill ${workflowStatusClass(definition.status)}">${escapeHtml(titleCaseMessage(definition.status))}</em></button>`).join('') || '<div class="empty-state"><p>No workflow definitions match this view.</p></div>';
}

function showWorkflowDefinition(definition) {
  closeWorkflowRouteDesigner();
  const form = $('#workflowDefinitionForm');
  $('#workflowDefinitionEmpty').hidden = true;
  form.hidden = false;
  form.reset();
  form.elements.editingWorkflowKey.value = definition?.workflowKey || '';
  form.elements.name.value = definition?.name || '';
  form.elements.workflowKey.value = definition?.workflowKey || '';
  form.elements.workflowKey.readOnly = true;
  form.elements.description.value = definition?.description || '';
  form.elements.sourceModuleKey.innerHTML = workflowModuleOptions(definition?.sourceModuleKey);
  form.elements.sourceModuleKey.value = definition?.sourceModuleKey || configModules.find((module) => module.status === 'published')?.key || '';
  form.elements.requestFormKey.innerHTML = workflowRequestFormOptions(definition?.requestFormKey || '');
  form.elements.requestFormKey.value = definition?.requestFormKey || '';
  form.elements.lockScope.value = definition?.draftConfig?.recordPolicy?.lockScope || 'record';
  form.elements.lockedFields.value = (definition?.draftConfig?.recordPolicy?.lockedFields || []).join(', ');
  form.elements.snapshotFields.value = (definition?.draftConfig?.recordPolicy?.snapshotFields || []).join(', ');
  form.elements.allowCancellation.checked = definition?.draftConfig?.recordPolicy?.allowAuthorizedCancel !== false;
  state.workflowDraftStages = structuredClone(definition?.draftConfig?.stages?.length ? definition.draftConfig.stages : [defaultWorkflowStage()]);
  state.workflowBuilderGraph = normalizeWorkflowBuilderGraph(structuredClone(definition?.draftConfig?.builderGraph || null), state.workflowDraftStages);
  state.selectedWorkflowNodeId = state.workflowBuilderGraph.nodes.find((node) => node.type === 'start')?.id || '';
  state.selectedWorkflowEdgeId = '';
  state.workflowConnectFrom = '';
  state.workflowCanvasZoom = 1;
  $('#workflowDefinitionTitle').textContent = definition?.name || 'New workflow';
  $('#workflowDefinitionLifecycle').textContent = definition ? `${titleCaseMessage(definition.status)} definition` : 'New draft';
  $('#workflowDefinitionPrefix').textContent = definition?.requestPrefix ? `New requests will use ${definition.requestPrefix}-000001 and continue in sequence.` : 'The readable request prefix is assigned automatically from the workflow key.';
  $('#workflowDefinitionStatus').textContent = titleCaseMessage(definition?.status || 'draft');
  $('#workflowDefinitionStatus').className = `status-pill ${workflowStatusClass(definition?.status || 'draft')}`;
  $('#archiveWorkflowDefinitionButton').hidden = !definition || definition.status === 'archived';
  $('#publishWorkflowDefinitionButton').disabled = definition?.status === 'archived';
  $('#saveWorkflowDefinitionButton').disabled = definition?.status === 'archived';
  renderWorkflowStages();
  renderWorkflowLinkedAutomationFlows(definition);
  renderWorkflowDocumentOutput(definition);
  renderWorkflowCheck(null);
  beginBuilderDraft('workflow');
}

function renderWorkflowLinkedAutomationFlows(definition = activeWorkflowDefinition()) {
  const panel = $('#workflowLinkedAutomationFlows');
  if (!panel) return;
  if (!definition?.workflowKey) {
    panel.innerHTML = '<div class="empty-state"><p>Save the workflow before linking an Automation Flow.</p></div>';
    return;
  }
  const linked = state.actionFlows.filter((flow) => flow.triggerType === 'workflow_event' && (!flow.triggerModule || flow.triggerModule === definition.workflowKey));
  panel.innerHTML = linked.map((flow) => {
    const trigger = (flow.definition?.nodes || []).find((node) => node.category === 'trigger');
    const events = trigger?.config?.eventTypes?.length ? trigger.config.eventTypes.join(', ') : 'Any workflow event';
    return `<article class="workflow-stage-card"><div class="workflow-stage-header"><div><span class="workflow-stage-order">Automation</span><h4>${escapeHtml(flow.name)}</h4><p>${escapeHtml(events)}${trigger?.config?.stageKey ? ` · Stage ${escapeHtml(trigger.config.stageKey)}` : ''}</p></div><span class="status-pill ${workflowStatusClass(flow.status)}">${escapeHtml(titleCaseMessage(flow.status))}</span></div></article>`;
  }).join('') || '<div class="empty-state"><p>No Automation Flow is linked yet. In Automation Flow, choose “When an approval workflow event occurs”.</p></div>';
}

function workflowCheckNodeLabel(node) {
  if (!node) return 'Workflow item';
  const stage = workflowStageForNode(node);
  return stage?.name || node.label || (node.type === 'start' ? 'Start' : node.type === 'end' ? 'End' : 'Approval step');
}

function workflowCheckFindingContext(finding) {
  const path = String(finding.path || '');
  const graph = state.workflowBuilderGraph;
  const indexedNode = path.match(/builderGraph\.nodes\[(\d+)\]/);
  const identifiedNode = path.match(/builderGraph\.nodes\.([^\.]+)/);
  const indexedEdge = path.match(/builderGraph\.edges\[(\d+)\]/);
  const indexedStage = path.match(/stages\[(\d+)\]/);
  let node = indexedNode ? graph.nodes[Number(indexedNode[1])] : null;
  if (!node && identifiedNode) node = graph.nodes.find((item) => item.id === identifiedNode[1]);
  if (!node && indexedStage) {
    const stage = state.workflowDraftStages[Number(indexedStage[1])];
    node = graph.nodes.find((item) => item.stageKey === stage?.stageKey);
  }
  const edge = indexedEdge ? graph.edges[Number(indexedEdge[1])] : null;
  return { node, edge };
}

function workflowCheckPlainText(value, context) {
  let text = String(value || '').replace(/_/g, ' ');
  for (const node of state.workflowBuilderGraph.nodes) text = text.split(node.id).join(workflowCheckNodeLabel(node));
  if (context.node) text = text.split(context.node.id).join(workflowCheckNodeLabel(context.node));
  return text.replace(/\s+/g, ' ').trim();
}

function workflowCheckFindingView(finding) {
  const context = workflowCheckFindingContext(finding);
  const code = String(finding.code || '');
  const nodeLabel = workflowCheckNodeLabel(context.node);
  const edgeLabel = context.edge
    ? `${workflowCheckNodeLabel(state.workflowBuilderGraph.nodes.find((node) => node.id === context.edge.from))} to ${workflowCheckNodeLabel(state.workflowBuilderGraph.nodes.find((node) => node.id === context.edge.to))}`
    : 'connection';
  const views = {
    WORKFLOW_CONFIG_ATTACHMENT_TYPES_REQUIRED: { title: `Choose allowed file types for ${nodeLabel}`, detail: 'Select at least one file type people can upload.', action: 'Review upload rules' },
    WORKFLOW_CONFIG_ATTACHMENT_COUNT_INVALID: { title: `Check the file limit for ${nodeLabel}`, detail: 'Choose how many files people may upload at once.', action: 'Review upload rules' },
    WORKFLOW_CONFIG_ATTACHMENT_SIZE_INVALID: { title: `Check the file-size limit for ${nodeLabel}`, detail: 'Choose a supported maximum size for each uploaded file.', action: 'Review upload rules' },
    WORKFLOW_CONFIG_ATTACHMENT_ACTION_REQUIRED: { title: `Choose when ${nodeLabel} accepts extra files`, detail: 'Select at least one action where supporting files may be added.', action: 'Review upload rules' },
    WORKFLOW_CONFIG_ROUTE_START_INCOMING: { title: 'Remove the connection entering Start', detail: `The ${edgeLabel} connection points into Start, which must always be the first step.`, action: 'Show connection' },
    WORKFLOW_CONFIG_ROUTE_END_OUTGOING: { title: 'Remove the connection leaving End', detail: `The ${edgeLabel} connection continues after End, which must always be the last step.`, action: 'Show connection' },
    WORKFLOW_CONFIG_ROUTE_BRANCH_AMBIGUOUS: { title: `Fix routes leaving ${nodeLabel}`, detail: 'Use one normal route, or matching “Condition met” and “Condition not met” routes.', action: 'Review routes' },
    WORKFLOW_CONFIG_ROUTE_BRANCH_INCOMPLETE: { title: `Complete the condition routes for ${nodeLabel}`, detail: 'Add the matching opposite route so every condition has a clear outcome.', action: 'Review routes' },
    WORKFLOW_CONFIG_ROUTE_NODE_UNREACHABLE: { title: `Connect ${nodeLabel} to the workflow`, detail: `${nodeLabel} cannot currently be reached from Start. Connect it to the route or remove it.`, action: 'Show node' },
    WORKFLOW_CONFIG_ROUTE_OUTGOING_REQUIRED: { title: `Choose what follows ${nodeLabel}`, detail: `Connect ${nodeLabel} to an Approval or End step.`, action: 'Show node' },
    WORKFLOW_CONFIG_APPROVER_REQUIRED: { title: `Choose an approver for ${nodeLabel}`, detail: 'Select at least one user, role, department, or reporting manager.', action: 'Choose approver' }
  };
  const configured = views[code];
  const title = configured?.title || workflowCheckPlainText(finding.message, context) || 'Review this workflow setting';
  const detail = configured?.detail || workflowCheckPlainText(finding.remediation, context) || 'Open the related setting and review its configuration.';
  const targetType = context.edge ? 'edge' : context.node ? 'node' : '';
  return { title, detail, action: configured?.action || (targetType ? 'Review setting' : ''), targetType, targetId: context.edge?.id || context.node?.id || '' };
}

function openWorkflowCheckTarget(button) {
  const { workflowCheckTargetType: type, workflowCheckTargetId: id } = button.dataset;
  if (type === 'edge') {
    state.selectedWorkflowEdgeId = id;
    state.selectedWorkflowNodeId = '';
  } else if (type === 'node') {
    state.selectedWorkflowNodeId = id;
    state.selectedWorkflowEdgeId = '';
  } else return;
  openWorkflowRouteDesigner();
  renderWorkflowCanvas(type === 'node' ? id : '');
  requestAnimationFrame(() => {
    if (type === 'edge') $(`#workflowCanvas [data-workflow-edge-id="${CSS.escape(id)}"]`)?.focus();
    else $(`#workflowCanvas [data-workflow-node-id="${CSS.escape(id)}"]`)?.focus();
  });
}

function renderWorkflowCheck(check) {
  const panel = $('#workflowCheckPanel');
  if (!check) {
    panel.hidden = true;
    panel.innerHTML = '';
    return;
  }
  panel.hidden = false;
  panel.className = `workflow-check-panel ${check.valid ? 'is-valid' : 'is-invalid'}`;
  const findings = (check.findings || []).map(workflowCheckFindingView);
  panel.innerHTML = `<div class="workflow-check-heading"><div><span class="workflow-check-eyebrow">Workflow health check</span><strong>${check.valid ? 'Ready to publish' : `${check.errors?.length || 0} item${check.errors?.length === 1 ? '' : 's'} to fix before publishing`}</strong><p>${check.valid ? 'This workflow passed all publishing checks.' : 'Work through each item below, then check the workflow again.'}</p></div><div class="workflow-check-heading-actions"><button type="button" class="secondary" data-check-workflow-again>Check again</button><span class="workflow-check-result-icon" aria-hidden="true">${check.valid ? '✓' : '!'}</span></div></div>${findings.length ? `<div class="workflow-check-list">${findings.map((finding, index) => `<article><span class="workflow-check-number" aria-hidden="true">${index + 1}</span><div><span class="workflow-check-severity">Must fix</span><strong>${escapeHtml(finding.title)}</strong><p>${escapeHtml(finding.detail)}</p></div>${finding.action ? `<button type="button" class="secondary workflow-check-action" data-workflow-check-target-type="${escapeHtml(finding.targetType)}" data-workflow-check-target-id="${escapeHtml(finding.targetId)}">${escapeHtml(finding.action)} <span aria-hidden="true">→</span></button>` : ''}</article>`).join('')}</div>` : ''}`;
}

const documentTemplateStorageKey = 'crm:document-templates:prototype:v1';
const workflowDocumentStorageKey = 'crm:workflow-document-output:prototype:v1';
const documentPageSizesCm = { A4: { portrait: { width: 21, height: 29.7 }, landscape: { width: 29.7, height: 21 } } };
const documentMinimumContentCm = { horizontal: 3, vertical: 5 };
const prototypeDocumentContexts = [{ key: 'procurement_requests', name: 'Procurement requests · sample data', fields: [['Company', 'record.company'], ['Contact', 'record.contact'], ['Description', 'record.items.description'], ['Quantity', 'record.items.quantity'], ['Unit price', 'record.items.unit_price'], ['Amount', 'record.items.amount']] }];

function documentId(prefix = 'block') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function documentText(content, options = {}) {
  return { id: documentId('text'), type: 'text', content, column: options.column || 1, leftIndent: options.leftIndent || 0, rightIndent: options.rightIndent || 0, alignment: options.alignment || 'left', fontSize: options.fontSize || 11, fontWeight: options.fontWeight || '400', padding: options.padding ?? 4 };
}

function documentField(label, binding, options = {}) {
  return { id: documentId('field'), type: 'field', label, binding, column: options.column || 1, leftIndent: options.leftIndent || 0, rightIndent: options.rightIndent || 0, alignment: options.alignment || 'left', fontSize: options.fontSize || 11, fontWeight: options.fontWeight || '600', padding: options.padding ?? 3 };
}

function documentTable(columns = 3, rows = 3) {
  const safeColumns = Math.min(12, Math.max(2, Number(columns) || 3));
  const equalWidth = Number((100 / safeColumns).toFixed(3));
  return {
    id: documentId('table'), type: 'table', printableBorders: true, repeatingSource: '',
    width: 100,
    columns: Array.from({ length: safeColumns }, (_, index) => ({ id: documentId('col'), width: Number((index === safeColumns - 1 ? 100 - (equalWidth * index) : equalWidth).toFixed(3)), label: `Column ${index + 1}` })),
    rows: Array.from({ length: rows }, (_, rowIndex) => ({ id: documentId('row'), heightCm: .9, repeat: rowIndex === 1, cells: Array.from({ length: safeColumns }, (_, columnIndex) => ({ id: documentId('cell'), content: rowIndex === 0 ? `Column ${columnIndex + 1}` : '', binding: '', alignment: columnIndex ? 'right' : 'left', padding: 6, colSpan: 1 })) }))
  };
}

function sampleDocumentTemplate() {
  const table = documentTable(4, 3);
  table.repeatingSource = 'record.items';
  ['Description', 'Quantity', 'Unit price', 'Amount'].forEach((label, index) => { table.rows[0].cells[index].content = label; });
  ['record.items.description', 'record.items.quantity', 'record.items.unit_price', 'record.items.amount'].forEach((binding, index) => { table.rows[1].cells[index].binding = binding; table.rows[1].cells[index].content = binding.split('.').pop().replaceAll('_', ' '); });
  return {
    templateKey: 'sample_purchase_order', name: 'Purchase Order — sample', status: 'sample', source: 'module:procurement_requests', updatedAt: new Date().toISOString(),
    page: { size: 'A4', orientation: 'portrait', margins: { top: 2, right: 2, bottom: 2, left: 2 }, headerFromTop: 1.25, footerFromBottom: 1.25, showMarginGuides: true, showGrid: false, headerColumns: 3, footerColumns: 3 },
    regions: {
      header: [documentText('NORTHSTAR OPERATIONS', { fontSize: 10, fontWeight: '700', column: 1 }), documentText('PURCHASE ORDER', { fontSize: 18, fontWeight: '700', alignment: 'center', column: 2 }), documentField('Request number', 'workflow.request_number', { alignment: 'right', column: 3 })],
      body: [documentText('Prepared for', { fontSize: 9, fontWeight: '700' }), documentField('Company', 'record.company', { fontSize: 14 }), documentField('Request number', 'workflow.request_number'), documentField('Submitted date', 'workflow.submitted_date'), table, documentText('Terms and notes may be added here. This sample demonstrates a generic template configured with procurement-related bindings.')],
      footer: [documentText('Generated by Babyyy', { fontSize: 9, column: 1 }), documentText('Confidential', { fontSize: 9, alignment: 'center', column: 2 }), documentField('Page number', 'system.page_number', { alignment: 'right', fontSize: 9, column: 3 })]
    }
  };
}

function blankDocumentTemplate() {
  return { templateKey: documentId('template'), name: 'Untitled document', status: 'draft', source: 'module:customers', updatedAt: new Date().toISOString(), page: { size: 'A4', orientation: 'portrait', margins: { top: 2, right: 2, bottom: 2, left: 2 }, headerFromTop: 1.25, footerFromBottom: 1.25, showMarginGuides: true, showGrid: false, headerColumns: 1, footerColumns: 3 }, regions: { header: [documentText('Document header', { fontSize: 10, fontWeight: '600' })], body: [documentText('Start writing your document here.')], footer: [documentText('Generated by Babyyy', { fontSize: 9, column: 1 }), documentText('Confidential', { fontSize: 9, alignment: 'center', column: 2 }), documentField('Page number', 'system.page_number', { alignment: 'right', fontSize: 9, column: 3 })] } };
}

function duplicateDocumentTemplate(source = state.documentTemplates[0]) {
  const template = structuredClone(source || blankDocumentTemplate());
  delete template.serverRevision; delete template.serverSnapshot;
  template.templateKey = documentId('template'); template.name = `${template.name || 'Document'} — copy`; template.status = 'draft'; template.updatedAt = new Date().toISOString();
  Object.values(template.regions || {}).flat().forEach((element) => { element.id = documentId(element.type); if (element.type === 'table') { element.columns.forEach((column) => { column.id = documentId('col'); }); element.rows.forEach((row) => { row.id = documentId('row'); row.cells.forEach((cell) => { cell.id = documentId('cell'); }); }); } });
  return template;
}

function documentBindingOptions(selected = '') {
  return Object.entries(documentFieldsForSource()).map(([group, fields]) => `<optgroup label="${group === 'record' ? 'Record / Form Fields' : `${titleCaseMessage(group)} Fields`}">${fields.map(([label, binding]) => `<option value="${escapeHtml(binding)}" ${binding === selected ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('')}</optgroup>`).join('');
}

function renderDocumentImportSummary(summary) {
  const imageStatus = summary.images ? `${summary.importedImages || 0} imported${summary.skippedImages ? ` · ${summary.skippedImages} unsupported` : ''}` : 'None detected';
  const entries = [[`${summary.pageCount || 1} page${(summary.pageCount || 1) === 1 ? '' : 's'} · ${summary.page.size} ${titleCaseMessage(summary.page.orientation)}`, 'Detected'], [`${summary.textBlocks} text blocks`, 'Detected'], [`${summary.images} images`, imageStatus], [`${summary.lines} lines / borders`, summary.lines ? 'Detected' : 'None detected'], [`${summary.tables} tables`, summary.tables ? 'Review recommended' : 'None detected'], ['Possible header', summary.possibleHeader ? 'Review recommended' : 'Not detected'], ['Possible footer', summary.possibleFooter ? 'Review recommended' : 'Not detected'], ['Possible repeating row', summary.possibleRepeatingRow ? 'Review recommended' : 'Not assumed']];
  $('#documentImportSummary').innerHTML = `<strong>Detected structure</strong>${entries.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><small>${escapeHtml(value)}</small></div>`).join('')}`;
}

async function analyzeDocumentPdf(event) {
  event.preventDefault(); const file = $('#documentPdfFile').files[0]; if (!file) return;
  const button = $('#analyzeDocumentPdf'); button.disabled = true; button.textContent = 'Analyzing PDF…'; $('#importAnalyzedDocument').hidden = true;
  try {
    const body = new FormData(); body.append('pdf', file);
    state.documentImportResult = await api('/api/document-templates/import-pdf', { method: 'POST', body });
    if (state.documentOriginalPdfUrl) URL.revokeObjectURL(state.documentOriginalPdfUrl);
    state.documentOriginalPdfUrl = URL.createObjectURL(file); state.documentOriginalPdfFile = file; renderDocumentImportSummary(state.documentImportResult.detectedLayout);
    $('#importAnalyzedDocument').hidden = false; button.textContent = 'Analyze again';
  } catch (error) { state.documentImportResult = null; $('#documentImportSummary').innerHTML = `<p class="error-message">${escapeHtml(error.message)}</p>`; button.textContent = 'Analyze PDF'; }
  finally { button.disabled = false; }
}

function importAnalyzedDocument() {
  if (!state.documentImportResult?.template) return;
  const template = state.documentImportResult.template; state.documentTemplates.unshift(template); state.documentCompareMode = 'generated';
  $('#documentCreateDialog').close(); openDocumentDesigner(template.templateKey);
}

function loadDocumentPrototypeState() {
  const templates = parseStoredJson(localStorage.getItem(documentTemplateStorageKey));
  state.documentRecoveredTemplateKeys = new Set(Array.isArray(templates) ? templates.map((template) => template.templateKey) : []);
  state.documentTemplates = Array.isArray(templates) && templates.length ? templates : [sampleDocumentTemplate()];
  state.documentTemplates.forEach((template) => {
    template.page ||= {}; template.page.size ||= 'A4'; template.page.orientation ||= 'portrait'; template.page.margins ||= { top: 2, right: 2, bottom: 2, left: 2 };
    for (const side of ['top', 'right', 'bottom', 'left']) if (Number(template.page.margins[side]) > 5) template.page.margins[side] = Number(template.page.margins[side]) / 10;
    template.page.headerFromTop = Math.min(3, Math.max(.5, Number(template.page.headerFromTop) || 1.25)); template.page.footerFromBottom = Math.min(3, Math.max(.5, Number(template.page.footerFromBottom) || 1.25));
    template.page.showMarginGuides ??= true; template.page.showGrid ??= false; template.page.headerColumns ||= 3; template.page.footerColumns ||= 3;
    for (const region of ['header', 'body', 'footer']) (template.regions?.[region] || []).forEach((element) => { if (element.type === 'table') { element.width = 100; fitDocumentColumnWidths(element, 0, normalizedDocumentColumnWidths(element)[0]); element.rows.forEach((row) => { row.heightCm = Math.min(3.2, Math.max(.65, Number(row.heightCm) || ((Number(element.rowHeight) || 34) / (96 / 2.54)))); }); delete element.rowHeight; } else { element.column ||= 1; element.leftIndent = Math.max(0, Number(element.leftIndent) || 0); element.rightIndent = Math.max(0, Number(element.rightIndent) || 0); } });
  });
  state.workflowDocumentOutputs = parseStoredJson(localStorage.getItem(workflowDocumentStorageKey)) || {};
}

function activeDocumentTemplate() {
  return state.documentTemplates.find((template) => template.templateKey === state.activeDocumentTemplateKey) || null;
}

function documentSourceOptions(selected = '') {
  const moduleOptions = configModules.map((module) => `<option value="module:${escapeHtml(module.key)}" ${selected === `module:${module.key}` ? 'selected' : ''}>Module · ${escapeHtml(module.name)}</option>`);
  const formOptions = state.standaloneForms.map((form) => `<option value="form:${escapeHtml(form.formKey)}" ${selected === `form:${form.formKey}` ? 'selected' : ''}>Form · ${escapeHtml(form.name)}</option>`);
  const prototypeOptions = prototypeDocumentContexts.map((context) => `<option value="module:${escapeHtml(context.key)}" ${selected === `module:${context.key}` ? 'selected' : ''}>Module · ${escapeHtml(context.name)}</option>`);
  return [...moduleOptions, ...formOptions, ...prototypeOptions, `<option value="workflow" ${selected === 'workflow' ? 'selected' : ''}>Workflow context</option>`].join('');
}

function documentFieldsForSource(source = activeDocumentTemplate()?.source) {
  const generic = { workflow: [
    ['Request number', 'workflow.request_number'], ['Submitted by', 'workflow.submitted_by'], ['Submitted date', 'workflow.submitted_date'], ['Approved by', 'workflow.approved_by'], ['Approved date', 'workflow.approved_date'], ['Approval status', 'workflow.status']
  ], system: [['Generated date', 'system.generated_date'], ['Generated time', 'system.generated_time'], ['Page number', 'system.page_number'], ['Total pages', 'system.total_pages'], ['Organization name', 'system.organization_name'], ['Current user', 'system.current_user']] };
  const [kind, key] = String(source || '').split(':');
  let record = [];
  if (kind === 'module') {
    const config = moduleConfigByKey(key);
    record = (config?.fields || config?.module?.fields || []).map((field) => [field.label || field.name || titleCaseMessage(field.fieldKey), `record.${field.fieldKey}`]);
    if (!record.length) record = prototypeDocumentContexts.find((context) => context.key === key)?.fields || [];
    if (!record.length && key === 'customers') record = [['Company', 'record.company'], ['Contact', 'record.contact'], ['Email', 'record.email'], ['Phone', 'record.phone']];
  } else if (kind === 'form') {
    const form = state.standaloneForms.find((item) => item.formKey === key);
    record = (form?.fields || []).map((field) => [field.label || titleCaseMessage(field.fieldKey), `record.${field.fieldKey}`]);
  }
  return { record, ...generic };
}

function documentFieldSemanticType(label = '', binding = '') {
  const value = `${label} ${binding}`.toLowerCase();
  if (/company|organization|organisation/.test(value)) return 'organization';
  if (/submitted_by|approved_by|current_user|contact|person|owner|assignee|user/.test(value)) return 'person';
  if (/date/.test(value) && /time/.test(value)) return 'datetime';
  if (/date/.test(value)) return 'date';
  if (/time/.test(value)) return 'time';
  if (/price|amount|currency|cost|total_value/.test(value)) return 'currency';
  if (/status|approved|active|enabled|boolean/.test(value)) return 'status';
  if (/email/.test(value)) return 'email';
  if (/phone|mobile|telephone/.test(value)) return 'phone';
  if (/number|quantity|count|total_pages|page_number|_id\b|\bid\b/.test(value)) return 'number';
  if (/description|notes|comment|address|multiline/.test(value)) return 'multiline';
  if (/reference|link|url/.test(value)) return 'reference';
  return 'text';
}

function documentFieldIcon(type) {
  const paths = {
    organization: '<path d="M4 20V6l8-3 8 3v14M8 8h1m3 0h1m3 0h1M8 12h1m3 0h1m3 0h1M9 20v-4h6v4"/>',
    person: '<circle cx="12" cy="8" r="3"/><path d="M5 20c.6-4 3-6 7-6s6.4 2 7 6"/>',
    date: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
    datetime: '<rect x="3" y="5" width="14" height="14" rx="2"/><path d="M7 3v4m6-4v4M3 10h14"/><circle cx="17" cy="17" r="4"/><path d="M17 15v2l1.5 1"/>',
    time: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    currency: '<path d="M16 7.5c-1-1-2.2-1.5-4-1.5-2.2 0-4 1.1-4 3s1.5 2.6 4 3 4 1.1 4 3-1.8 3-4 3c-1.8 0-3.3-.6-4.5-1.8M12 3v18"/>',
    status: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
    email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
    phone: '<path d="M7 3h3l1 5-2 1c1 3 3 5 6 6l1-2 5 1v3c0 2-2 4-4 4C9 20 4 15 3 7c0-2 2-4 4-4Z"/>',
    number: '<path d="M9 3 7 21m10-18-2 18M4 9h16M3 15h16"/>',
    multiline: '<path d="M4 5h16M4 10h16M4 15h11M4 20h8"/>',
    reference: '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>',
    text: '<path d="M5 5h14M12 5v14M8 19h8"/>'
  };
  return `<span class="document-field-icon is-${type}" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">${paths[type] || paths.text}</svg></span>`;
}

function documentPreviewValues() {
  return {
    'record.company': 'Aster & Pine Manufacturing', 'record.contact': 'Mei Lin Tan', 'record.email': 'meilin@example.test', 'record.phone': '+60 3 5550 0188',
    'workflow.request_number': 'REQ-2026-00418', 'workflow.submitted_by': 'Nadia Rahman', 'workflow.submitted_date': '8 September 2026', 'workflow.approved_by': 'Daniel Wong', 'workflow.approved_date': '9 September 2026', 'workflow.status': 'Approved',
    'system.generated_date': '9 September 2026', 'system.generated_time': '10:42 AM', 'system.page_number': 'Page 1', 'system.total_pages': '1', 'system.organization_name': 'Northstar Operations', 'system.current_user': 'System Admin',
    'record.items.description': 'Workspace materials', 'record.items.quantity': '12', 'record.items.unit_price': 'RM 48.00', 'record.items.amount': 'RM 576.00'
  };
}

function renderDocumentTemplateList() {
  const list = $('#documentTemplateList');
  if (!list) return;
  $('#documentTemplateCount').textContent = state.documentTemplates.length;
  list.innerHTML = state.documentTemplates.map((template) => `<article class="document-template-card"><div class="document-template-card-preview" aria-hidden="true"><span></span><i></i><i></i><b></b></div><div><span class="eyebrow">${escapeHtml(template.page?.size || 'A4')} · ${escapeHtml(titleCaseMessage(template.status || 'draft'))}</span><h3>${escapeHtml(template.name)}</h3><p>${escapeHtml(documentSourceLabel(template.source))}</p>${/— imported$/.test(template.name) ? '<div class="document-import-review">Imported from PDF · Review recommended</div>' : ''}<small>Updated ${escapeHtml(new Date(template.updatedAt).toLocaleString())}</small><div class="form-actions"><button type="button" data-open-document-template="${escapeHtml(template.templateKey)}">Open designer</button><button type="button" class="secondary" data-preview-document-template="${escapeHtml(template.templateKey)}">Preview</button></div></div></article>`).join('');
}

function documentSourceLabel(source) {
  const [kind, key] = String(source || 'workflow').split(':');
  if (kind === 'module') return `Module data · ${configModules.find((item) => item.key === key)?.name || prototypeDocumentContexts.find((item) => item.key === key)?.name || titleCaseMessage(key)}`;
  if (kind === 'form') return `Form data · ${state.standaloneForms.find((item) => item.formKey === key)?.name || titleCaseMessage(key)}`;
  return 'Workflow data context';
}

function documentPhysicalPages(template = activeDocumentTemplate()) {
  return template?.pages?.length ? template.pages : template ? [{ page: template.page, regions: template.regions }] : [];
}

function activeDocumentPhysicalPage(template = activeDocumentTemplate()) {
  const pages = documentPhysicalPages(template);
  state.documentPageIndex = Math.min(Math.max(0, state.documentPageIndex), Math.max(0, pages.length - 1));
  return pages[state.documentPageIndex];
}

async function loadDocumentOriginalPdf(template) {
  if (state.documentOriginalPdfUrl) { URL.revokeObjectURL(state.documentOriginalPdfUrl); state.documentOriginalPdfUrl = ''; }
  state.documentOriginalPdfFile = null;
  if (!template?.hasSourcePdf) return;
  const response = await fetch(`/api/document-templates/${encodeURIComponent(template.templateKey)}/source-pdf`, { headers: { Authorization: `Bearer ${await currentAuthToken()}` } });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Unable to load the original PDF.');
  state.documentOriginalPdfUrl = URL.createObjectURL(await response.blob());
  if (state.activeDocumentTemplateKey === template.templateKey) { $('#documentCompareControls').hidden = false; $('#documentOriginalPdf').src = state.documentOriginalPdfUrl; renderDocumentDesigner(); }
}

function openDocumentDesigner(templateKey, preview = false) {
  state.activeDocumentTemplateKey = templateKey;
  const template = activeDocumentTemplate();
  if (!template) return;
  state.documentDesignerMode = preview ? 'preview' : 'design';
  state.documentPageIndex = 0; state.documentSelectedRegion = 'body'; state.documentSelectedElementId = ''; state.documentSelectedCell = null;
  state.documentHistory = []; state.documentFuture = []; state.documentDirty = false;
  $('#documentTemplateManagement').hidden = true; $('#documentDesignerWorkspace').hidden = false;
  document.body.classList.add('document-designer-open');
  $('#documentTemplateName').value = template.name;
  $('#documentTemplateSource').innerHTML = documentSourceOptions(template.source);
  $('#documentZoom').value = 100;
  $('#documentOutputRecordId').value = '';
  $('#documentOutputWorkflowId').value = '';
  const canCompare = /— imported$/.test(template.name) && Boolean(state.documentOriginalPdfUrl);
  $('#documentCompareControls').hidden = !canCompare; $('#documentOriginalPdf').src = canCompare ? state.documentOriginalPdfUrl : '';
  renderDocumentDesigner();
  if (template.hasSourcePdf && !canCompare) void loadDocumentOriginalPdf(template).catch((error) => { $('#documentOutputStatus').textContent = error.message; });
}

function closeDocumentDesigner() {
  $('#documentDesignerWorkspace').hidden = true; $('#documentTemplateManagement').hidden = false;
  document.body.classList.remove('document-designer-open', 'document-print-portrait', 'document-print-landscape');
  state.activeDocumentTemplateKey = ''; renderDocumentTemplateList();
}

function captureDocumentHistory() {
  const template = activeDocumentTemplate();
  if (!template) return;
  state.documentHistory.push(structuredClone(template));
  if (state.documentHistory.length > 40) state.documentHistory.shift();
  state.documentFuture = []; state.documentDirty = true;
}

function restoreDocumentHistory(redo = false) {
  const from = redo ? state.documentFuture : state.documentHistory;
  const to = redo ? state.documentHistory : state.documentFuture;
  const previous = from.pop(); const current = activeDocumentTemplate();
  if (!previous || !current) return;
  to.push(structuredClone(current));
  state.documentTemplates[state.documentTemplates.findIndex((item) => item.templateKey === current.templateKey)] = previous;
  renderDocumentDesigner();
}

function resolveDocumentValue(binding, fallback = '') {
  return documentPreviewValues()[binding] || fallback || titleCaseMessage(String(binding || '').split('.').pop());
}

function renderDocumentElement(element, preview) {
  if (element.type === 'table') return renderDocumentTable(element, preview);
  const selected = element.id === state.documentSelectedElementId;
  const value = element.type === 'field' && preview ? resolveDocumentValue(element.binding, element.label) : element.type === 'field' ? `{ ${element.label} }` : element.content;
  const placement = `grid-column:${Math.max(1, Number(element.column) || 1)};width:auto;text-align:${element.alignment};padding:${element.padding}px;margin-left:${Math.max(0, Number(element.leftIndent) || 0)}cm;margin-right:${Math.max(0, Number(element.rightIndent) || 0)}cm`;
  if (element.type === 'image') { const size = element.imageWidthCm ? `width:${element.imageWidthCm}cm;height:${element.imageHeightCm || 'auto'}cm` : ''; return `<button type="button" class="document-block document-image-block ${selected ? 'is-selected' : ''}" data-document-element="${element.id}" style="${placement};${size}">${element.source ? `<img src="${escapeHtml(element.source)}" alt="${escapeHtml(element.content || 'Imported image')}">` : '<span aria-hidden="true">◇</span>'}<strong ${element.source ? 'class="visually-hidden"' : ''}>${escapeHtml(element.content || 'Organization logo')}</strong></button>`; }
  return `<button type="button" class="document-block document-${element.type}-block ${selected ? 'is-selected' : ''}" data-document-element="${element.id}" style="${placement};font-size:${element.fontSize}pt;font-weight:${element.fontWeight}">${escapeHtml(value)}</button>`;
}

function renderDocumentTable(table, preview) {
  const selected = table.id === state.documentSelectedElementId;
  const widths = normalizedDocumentColumnWidths(table);
  const rows = table.rows.map((row, rowIndex) => `<tr data-document-row="${table.id}:${rowIndex}" class="${row.repeat && !preview ? 'is-repeating' : ''}" style="height:${Math.min(3.2, Math.max(.65, Number(row.heightCm) || .9))}cm">${row.cells.map((cell, columnIndex) => cell.hidden ? '' : `<td colspan="${cell.colSpan || 1}" style="text-align:${cell.alignment};padding:${cell.padding}px"><button type="button" data-document-cell="${table.id}:${rowIndex}:${columnIndex}" class="document-cell ${state.documentSelectedCell?.tableId === table.id && state.documentSelectedCell.row === rowIndex && state.documentSelectedCell.column === columnIndex ? 'is-selected' : ''}">${escapeHtml(preview && cell.binding ? resolveDocumentValue(cell.binding, cell.content) : cell.binding ? `{ ${cell.content || titleCaseMessage(cell.binding.split('.').pop())} }` : cell.content || 'Empty cell')}</button>${row.repeat && columnIndex === 0 && !preview ? '<span class="document-repeat-badge">↻ Repeating row</span>' : ''}</td>`).join('')}</tr>`).join('');
  return `<div class="document-table-block ${selected ? 'is-selected' : ''} ${table.printableBorders ? 'has-print-borders' : ''}" data-document-element="${table.id}"><table><colgroup>${widths.map((width) => `<col style="width:${width}%">`).join('')}</colgroup><tbody>${rows}</tbody></table></div>`;
}

function normalizedDocumentColumnWidths(table) {
  const raw = table.columns.map((column) => Math.max(8, Number(column.width) || 1));
  const total = raw.reduce((sum, width) => sum + width, 0) || 1;
  return raw.map((width) => Number(((width / total) * 100).toFixed(3)));
}

function fitDocumentColumnWidths(table, selectedIndex, requestedWidth) {
  const count = table.columns.length; const minimum = Math.min(8, 100 / count); const maximum = 100 - (minimum * (count - 1));
  const selected = Math.min(maximum, Math.max(minimum, Number(requestedWidth) || minimum)); const remaining = 100 - selected;
  const others = table.columns.map((column, index) => ({ index, weight: index === selectedIndex ? 0 : Math.max(minimum, Number(column.width) || minimum) })).filter((column) => column.index !== selectedIndex);
  let available = remaining; let active = [...others]; const widths = Array(count).fill(minimum); widths[selectedIndex] = selected;
  while (active.length) {
    const weightTotal = active.reduce((sum, column) => sum + column.weight, 0) || active.length; const belowMinimum = active.filter((column) => available * (column.weight / weightTotal) < minimum);
    if (!belowMinimum.length) { active.forEach((column) => { widths[column.index] = available * (column.weight / weightTotal); }); break; }
    belowMinimum.forEach((column) => { widths[column.index] = minimum; available -= minimum; }); active = active.filter((column) => !belowMinimum.includes(column));
  }
  table.columns.forEach((column, index) => { column.width = Number(widths[index].toFixed(3)); });
}

function documentPageGeometry(page = activeDocumentTemplate()?.page) {
  return DocumentOutput.geometry(page || {});
}

function clampDocumentMargin(page, side, requested) {
  const { width, height } = documentPageGeometry(page);
  const opposite = side === 'left' ? 'right' : side === 'right' ? 'left' : side === 'top' ? 'bottom' : 'top';
  const axisSize = ['left', 'right'].includes(side) ? width : height;
  const minimumContent = ['left', 'right'].includes(side) ? documentMinimumContentCm.horizontal : documentMinimumContentCm.vertical;
  const oppositeBoundary = side === 'top' ? Math.max(Number(page.margins.bottom) || 0, Number(page.footerFromBottom) + 2.1) : side === 'bottom' ? Math.max(Number(page.margins.top) || 0, Number(page.headerFromTop) + 2.1) : Number(page.margins[opposite] || 0);
  return Math.min(Math.max(.5, axisSize - oppositeBoundary - minimumContent), Math.max(.5, Number(requested) || .5));
}

function documentMarginHandles(page, widthCm, heightCm) {
  const horizontal = [['left', page.margins.left / widthCm], ['right', (widthCm - page.margins.right) / widthCm]];
  const vertical = [['top', page.margins.top / heightCm], ['bottom', (heightCm - page.margins.bottom) / heightCm]];
  $('#documentRulerTicks').insertAdjacentHTML('beforeend', horizontal.map(([side, ratio]) => `<button type="button" class="document-margin-handle is-${side}" data-document-margin-handle="${side}" style="--handle-position:${ratio * 100}%" aria-label="Adjust ${side} margin" title="${titleCaseMessage(side)} margin: ${page.margins[side]} cm"></button>`).join(''));
  $('#documentVerticalRulerTicks').insertAdjacentHTML('beforeend', vertical.map(([side, ratio]) => `<button type="button" class="document-margin-handle is-${side}" data-document-margin-handle="${side}" style="--handle-position:${ratio * 100}%" aria-label="Adjust ${side} margin" title="${titleCaseMessage(side)} margin: ${page.margins[side]} cm"></button>`).join(''));
  $('#documentVerticalRulerTicks').insertAdjacentHTML('beforeend', `<span class="document-region-ruler-marker is-header" style="--handle-position:${(page.headerFromTop / heightCm) * 100}%" title="Header from top: ${page.headerFromTop} cm"></span><span class="document-region-ruler-marker is-footer" style="--handle-position:${((heightCm - page.footerFromBottom) / heightCm) * 100}%" title="Footer from bottom: ${page.footerFromBottom} cm"></span>`);
}

function documentContextualRulerMarkers(page, widthCm) {
  const { element, table } = selectedDocumentTarget(); if (!element) return '';
  const contentWidth = widthCm - page.margins.left - page.margins.right;
  if (element.type !== 'table') {
    const left = page.margins.left + (Number(element.leftIndent) || 0); const right = widthCm - page.margins.right - (Number(element.rightIndent) || 0);
    return `<span class="document-ruler-context-label">Paragraph</span><button type="button" class="document-context-marker is-indent is-left" data-document-indent-handle="left" style="--handle-position:${(left / widthCm) * 100}%" aria-label="Adjust paragraph left indent" title="Left indent: ${element.leftIndent || 0} cm"></button><button type="button" class="document-context-marker is-indent is-right" data-document-indent-handle="right" style="--handle-position:${(right / widthCm) * 100}%" aria-label="Adjust paragraph right indent" title="Right indent: ${element.rightIndent || 0} cm"></button>`;
  }
  const widths = normalizedDocumentColumnWidths(table); let cumulative = page.margins.left;
  const markers = [`<span class="document-ruler-context-label">Table</span><span class="document-context-marker is-table-edge" style="--handle-position:${(page.margins.left / widthCm) * 100}%"></span>`];
  widths.slice(0, -1).forEach((columnWidth, index) => { cumulative += contentWidth * columnWidth / 100; markers.push(`<button type="button" class="document-context-marker is-column" data-document-column-marker="${index}" data-document-table-id="${table.id}" style="--handle-position:${(cumulative / widthCm) * 100}%" aria-label="Resize table column ${index + 1}" title="Column ${index + 1} boundary"></button>`); });
  markers.push(`<span class="document-context-marker is-table-edge" style="--handle-position:${((widthCm - page.margins.right) / widthCm) * 100}%"></span>`); return markers.join('');
}

function documentVerticalContextualRulerMarkers(page, heightCm) {
  if (state.documentPropertiesTab === 'page') return '';
  const { element, table } = selectedDocumentTarget();
  let target = element ? $(`[data-document-element="${element.id}"]`) : null;
  let kind = element?.type === 'table' ? 'table' : element ? 'paragraph' : '';
  let rowIndex = null;
  if (table && state.documentSelectedCell) { rowIndex = state.documentSelectedCell.row; target = $(`[data-document-row="${table.id}:${rowIndex}"]`); kind = 'row'; }
  if (!target && ['header', 'footer'].includes(state.documentSelectedRegion)) { target = $(`.document-${state.documentSelectedRegion}`); kind = state.documentSelectedRegion; }
  if (!target) return '';
  const pageElement = $('#documentPage'); const pageBounds = pageElement.getBoundingClientRect(); const bounds = target.getBoundingClientRect();
  const topCm = Math.min(heightCm, Math.max(0, ((bounds.top - pageBounds.top) / Math.max(1, pageBounds.height)) * heightCm));
  const bottomCm = Math.min(heightCm, Math.max(topCm, ((bounds.bottom - pageBounds.top) / Math.max(1, pageBounds.height)) * heightCm));
  if (kind === 'paragraph') return `<span class="document-vertical-context-label" style="--handle-position:${(topCm / heightCm) * 100}%">Selected</span><span class="document-vertical-context-marker is-position" style="--handle-position:${(topCm / heightCm) * 100}%" title="Selected block at ${topCm.toFixed(1)} cm"></span>`;
  const label = kind === 'row' ? 'Row' : titleCaseMessage(kind);
  const bottom = kind === 'row' ? `<button type="button" class="document-vertical-context-marker is-boundary is-bottom" data-document-row-height-handle="${rowIndex}" data-document-row-top-cm="${topCm}" style="--handle-position:${(bottomCm / heightCm) * 100}%" aria-label="Adjust selected row height" title="Row height: ${(bottomCm - topCm).toFixed(2)} cm"></button>` : `<span class="document-vertical-context-marker is-boundary is-bottom" style="--handle-position:${(bottomCm / heightCm) * 100}%"></span>`;
  return `<span class="document-vertical-context-label" style="--handle-position:${(topCm / heightCm) * 100}%">${label}</span><span class="document-vertical-context-range" style="--range-top:${(topCm / heightCm) * 100}%;--range-height:${((bottomCm - topCm) / heightCm) * 100}%"></span><span class="document-vertical-context-marker is-boundary is-top" style="--handle-position:${(topCm / heightCm) * 100}%"></span>${bottom}`;
}

function renderDocumentDesigner() {
  const template = activeDocumentTemplate(); if (!template) return;
  const physicalPages = documentPhysicalPages(template); const physical = activeDocumentPhysicalPage(template);
  const preview = state.documentDesignerMode === 'preview';
  $('#documentPageViewport').hidden = preview;
  $('#documentOutputPreview').hidden = !preview;
  if (preview) void updateDocumentOutputPreview().catch((error) => { $('#documentOutputStatus').textContent = error.message; });
  $('#documentDesignMode').setAttribute('aria-pressed', String(!preview)); $('#documentPreviewMode').setAttribute('aria-pressed', String(preview));
  $('#documentDesignMode').classList.toggle('is-active', !preview); $('#documentPreviewMode').classList.toggle('is-active', preview);
  $('.document-designer-workspace').classList.toggle('is-preview', preview);
  const zoom = Number($('#documentZoom').value || 100); $('#documentZoomLabel').value = `${zoom}%`;
  const page = physical.page; const { width: widthCm, height: heightCm } = documentPageGeometry(page);
  document.body.classList.toggle('document-print-portrait', page.orientation === 'portrait'); document.body.classList.toggle('document-print-landscape', page.orientation === 'landscape');
  const geometry = $('#documentCoordinateSystem');
  const compareMode = $('#documentCompareControls').hidden ? 'generated' : state.documentCompareMode;
  geometry.classList.toggle('is-original', compareMode === 'original'); geometry.classList.toggle('is-overlay', compareMode === 'overlay');
  $('#documentOriginalPdf').hidden = compareMode === 'generated'; $('#documentOriginalOpacityLabel').hidden = compareMode !== 'overlay';
  if (state.documentOriginalPdfUrl) $('#documentOriginalPdf').src = `${state.documentOriginalPdfUrl}#page=${state.documentPageIndex + 1}&view=Fit`;
  $('#documentPageNavigation').hidden = physicalPages.length < 2;
  $('#documentPagePosition').textContent = `Page ${state.documentPageIndex + 1} of ${physicalPages.length}`;
  $('#documentPreviousPage').disabled = state.documentPageIndex === 0; $('#documentNextPage').disabled = state.documentPageIndex === physicalPages.length - 1;
  geometry.style.setProperty('--original-opacity', `${Number($('#documentOriginalOpacity').value || 40) / 100}`);
  const scale = zoom / 100;
  for (const [property, value] of Object.entries({ '--document-zoom': scale, '--page-width': `${widthCm}cm`, '--page-height': `${heightCm}cm`, '--display-page-width': `${widthCm * scale}cm`, '--display-page-height': `${heightCm * scale}cm`, '--margin-top': `${page.margins.top}cm`, '--margin-right': `${page.margins.right}cm`, '--margin-bottom': `${page.margins.bottom}cm`, '--margin-left': `${page.margins.left}cm`, '--header-from-top': `${page.headerFromTop}cm`, '--footer-from-bottom': `${page.footerFromBottom}cm`, '--print-page-width': `${widthCm}cm`, '--print-page-height': `${heightCm}cm`, '--print-margin-top': `${page.margins.top}cm`, '--print-margin-right': `${page.margins.right}cm`, '--print-margin-bottom': `${page.margins.bottom}cm`, '--print-margin-left': `${page.margins.left}cm`, '--header-columns': page.headerColumns, '--footer-columns': page.footerColumns })) geometry.style.setProperty(property, value);
  $('#documentRulerTicks').innerHTML = Array.from({ length: Math.ceil(widthCm) + 1 }, (_, index) => `<i><span>${index}</span></i>`).join('');
  $('#documentVerticalRulerTicks').innerHTML = Array.from({ length: Math.ceil(heightCm) + 1 }, (_, index) => `<i><span>${index}</span></i>`).join('');
  if (!preview && state.documentPropertiesTab === 'page') documentMarginHandles(page, widthCm, heightCm);
  if (!preview && state.documentPropertiesTab !== 'page') $('#documentRulerTicks').insertAdjacentHTML('beforeend', documentContextualRulerMarkers(page, widthCm));
  $('#documentPage').className = `document-page ${preview ? 'is-preview' : 'is-design'} is-${page.orientation}`;
  $('#documentPage').classList.toggle('show-margin-guides', !preview && page.showMarginGuides); $('#documentPage').classList.toggle('show-layout-grid', !preview && page.showGrid);
  $('#documentPage').innerHTML = `<div class="document-margin-guide" aria-hidden="true"></div>${['header', 'body', 'footer'].map((region) => `<section class="document-region document-${region} ${state.documentSelectedRegion === region ? 'is-selected' : ''}" style="--region-columns:${region === 'header' ? page.headerColumns : region === 'footer' ? page.footerColumns : 1}" data-document-region="${region}" aria-label="${titleCaseMessage(region)} region"><span class="document-region-label">${titleCaseMessage(region)}</span>${physical.regions[region].map((element) => renderDocumentElement(element, preview)).join('') || `<button type="button" class="document-empty-region">Add content to ${region}</button>`}</section>`).join('')}<span class="document-body-overflow-warning" role="status">Body content exceeds this page. Reduce content or add another page.</span>`;
  if (!preview && state.documentPropertiesTab !== 'page') $('#documentVerticalRulerTicks').insertAdjacentHTML('beforeend', documentVerticalContextualRulerMarkers(page, heightCm));
  const body = $('#documentPage .document-body'); $('#documentPage').classList.toggle('has-body-overflow', body.scrollHeight > body.clientHeight + 1);
  renderDocumentFieldPalette(); renderDocumentProperties();
  $('#documentUndo').disabled = !state.documentHistory.length; $('#documentRedo').disabled = !state.documentFuture.length;
}

function renderDocumentFieldPalette() {
  const fields = documentFieldsForSource();
  const fieldsTab = state.documentPaletteTab === 'fields'; const query = state.documentFieldQuery.trim().toLowerCase();
  $('#documentFieldsTab').setAttribute('aria-selected', String(fieldsTab)); $('#documentElementsTab').setAttribute('aria-selected', String(!fieldsTab));
  $('#documentFieldSearch').hidden = !fieldsTab; $('#documentFieldSearch').value = state.documentFieldQuery;
  if (!fieldsTab) { $('#documentFieldPalette').innerHTML = '<section class="document-element-list"><button type="button" data-add-document-element="text"><span aria-hidden="true">T</span><strong>Text</strong><small>Add editable copy</small></button><button type="button" data-add-document-element="image"><span aria-hidden="true">◇</span><strong>Image</strong><small>Add an image placeholder</small></button><button type="button" data-add-document-element="table"><span aria-hidden="true">▦</span><strong>Table</strong><small>Fit a table to the content width</small></button></section>'; return; }
  $('#documentFieldPalette').innerHTML = Object.entries(fields).map(([group, items]) => { const matches = items.filter(([label, binding]) => `${label} ${binding}`.toLowerCase().includes(query)); return `<section class="document-field-group"><h4>${group === 'record' ? 'Form / record fields' : `${titleCaseMessage(group)} fields`}</h4>${matches.length ? matches.map(([label, binding]) => { const type = documentFieldSemanticType(label, binding); return `<button type="button" draggable="true" data-insert-document-field="${escapeHtml(binding)}" data-document-field-label="${escapeHtml(label)}">${documentFieldIcon(type)}<strong>${escapeHtml(label)}</strong></button>`; }).join('') : '<p>No matching fields.</p>'}</section>`; }).join('');
}

function selectedDocumentTarget() {
  const template = activeDocumentTemplate();
  const regions = activeDocumentPhysicalPage(template)?.regions || {};
  const element = Object.values(regions).flat().find((item) => item.id === state.documentSelectedElementId);
  const table = element?.type === 'table' ? element : Object.values(regions).flat().find((item) => item.type === 'table' && item.id === state.documentSelectedCell?.tableId);
  const cell = table && state.documentSelectedCell ? table.rows[state.documentSelectedCell.row]?.cells[state.documentSelectedCell.column] : null;
  return { template, element, table, cell };
}

function documentSuggestionFields() {
  const source = activeDocumentTemplate()?.source || ''; const [kind, key] = source.split(':');
  const metadata = kind === 'module' ? (moduleConfigByKey(key)?.fields || moduleConfigByKey(key)?.module?.fields || []) : kind === 'form' ? (state.standaloneForms.find((form) => form.formKey === key)?.fields || []) : [];
  const types = new Map(metadata.map((field) => [`record.${field.fieldKey}`, String(field.type || '').toLowerCase()]));
  return Object.values(documentFieldsForSource()).flat().map(([label, binding]) => { const declared = types.get(binding) || ''; const type = /date/.test(declared) ? 'date' : /currency|money/.test(declared) ? 'currency' : /number|integer|decimal/.test(declared) ? 'number' : documentFieldSemanticType(label, binding); return { label, binding, type }; });
}

function documentSuggestionTarget(element, table, cell) {
  const raw = cell || element; if (!raw) return null;
  let label = '';
  if (cell && state.documentSelectedCell?.row > 0) label = table.rows[0]?.cells[state.documentSelectedCell.column]?.content || '';
  if (element) { const regions = activeDocumentPhysicalPage().regions; const region = Object.values(regions).find((items) => items.includes(element)); const index = region?.indexOf(element) ?? -1; const previous = index > 0 ? region[index - 1] : null; if (previous?.type === 'text' && /:\s*$/.test(previous.content || '') && !/:/.test(element.content || '')) label = previous.content.replace(/:\s*$/, ''); }
  return { id: `${activeDocumentTemplate().templateKey}:${state.documentPageIndex}:${raw.id}`, text: cell ? cell.content : element.content, label, binding: cell ? cell.binding : element.binding, tableHeader: Boolean(cell && state.documentSelectedCell?.row === 0), tableId: table?.id };
}

function documentSuggestionMarkup(element, table, cell) {
  if (!/— imported$/.test(activeDocumentTemplate()?.name || '') || (element && !cell && element.type !== 'text') || (!element && !cell)) return '';
  const match = DocumentBindingSuggestions.suggest(documentSuggestionTarget(element, table, cell), documentSuggestionFields(), state.documentRejectedSuggestions)[0];
  if (!match || match.confidence === 'low') return '';
  return `<section class="document-binding-suggestion"><span class="eyebrow">Suggested field</span><strong>${escapeHtml(match.label)}</strong><small>${titleCaseMessage(match.confidence)} confidence · ${escapeHtml(match.reasons.join(' and '))}</small><button type="button" data-document-suggestion-bind="${escapeHtml(match.binding)}">Bind to ${escapeHtml(match.label)}</button><button type="button" class="secondary" data-document-suggestion-reject="${escapeHtml(match.binding)}">Keep static</button></section>`;
}

function renderDocumentProperties() {
  const { element, table, cell } = selectedDocumentTarget();
  const panel = $('#documentProperties');
  const pageTab = state.documentPropertiesTab === 'page';
  $('#documentPropertiesTab').setAttribute('aria-selected', String(!pageTab)); $('#documentPageTab').setAttribute('aria-selected', String(pageTab));
  $('#documentPropertiesTitle').textContent = pageTab ? 'Page setup' : 'Properties';
  if (pageTab) {
    const page = activeDocumentPhysicalPage().page;
    $('#documentSelectionHelp').textContent = 'Page geometry controls Design, Preview, and Print.';
    panel.innerHTML = `<section class="document-page-properties"><label>Page size<select data-document-page-property="size"><option value="A4">A4 — 210 × 297 mm</option></select></label><fieldset><legend>Orientation</legend><div class="document-orientation-options"><label><input type="radio" name="documentOrientation" value="portrait" data-document-page-property="orientation" ${page.orientation === 'portrait' ? 'checked' : ''}> Portrait</label><label><input type="radio" name="documentOrientation" value="landscape" data-document-page-property="orientation" ${page.orientation === 'landscape' ? 'checked' : ''}> Landscape</label></div></fieldset><fieldset><legend>Margins (cm)</legend><div class="document-margin-inputs">${['top', 'bottom', 'left', 'right'].map((side) => `<label>${titleCaseMessage(side)}<input type="number" min="0.5" max="5" step="0.1" value="${page.margins[side]}" data-document-page-property="margin" data-document-margin-side="${side}"></label>`).join('')}</div></fieldset><label class="checkbox-label"><input type="checkbox" data-document-page-property="showMarginGuides" ${page.showMarginGuides ? 'checked' : ''}> Show margin guides</label><label class="checkbox-label"><input type="checkbox" data-document-page-property="showGrid" ${page.showGrid ? 'checked' : ''}> Show layout grid</label><fieldset><legend>Header &amp; footer</legend><label>Header from top (cm)<input type="number" min="0.5" max="3" step="0.1" value="${page.headerFromTop}" data-document-page-property="headerFromTop"></label><label>Footer from bottom (cm)<input type="number" min="0.5" max="3" step="0.1" value="${page.footerFromBottom}" data-document-page-property="footerFromBottom"></label><label>Header layout<select data-document-page-property="headerColumns"><option value="1">1 column</option><option value="2">2 columns</option><option value="3">3 columns</option></select></label><label>Footer layout<select data-document-page-property="footerColumns"><option value="1">1 column</option><option value="2">2 columns</option><option value="3">3 columns</option></select></label></fieldset></section>`;
    panel.querySelector('[data-document-page-property="headerColumns"]').value = String(page.headerColumns); panel.querySelector('[data-document-page-property="footerColumns"]').value = String(page.footerColumns);
    return;
  }
  if (!element && !cell) { const anchored = ['header', 'footer'].includes(state.documentSelectedRegion); $('#documentSelectionHelp').textContent = `Editing the ${state.documentSelectedRegion} region.`; panel.innerHTML = anchored ? `<div class="document-property-empty"><strong>${titleCaseMessage(state.documentSelectedRegion)} region active</strong><p>This region is anchored to the physical page and supports independent column content.</p><button type="button" class="secondary" data-open-document-page-settings>Adjust ${state.documentSelectedRegion} position</button></div>` : '<div class="document-property-empty"><strong>Select content to format</strong><p>Choose a block or table cell on the page. New content is inserted in the active region.</p></div>'; return; }
  $('#documentSelectionHelp').textContent = cell ? 'Table cell selected.' : `${titleCaseMessage(element.type)} selected.`;
  if (cell) {
    const maximumColumnWidth = 100 - (Math.min(8, 100 / table.columns.length) * (table.columns.length - 1));
    const row = table.rows[state.documentSelectedCell.row];
    panel.innerHTML = `<label>Cell content<input data-document-property="cellContent" value="${escapeHtml(cell.content)}"></label><label>Bind to field<select data-document-property="cellBinding"><option value="">Keep as static text</option>${documentBindingOptions(cell.binding)}</select></label><label>Alignment<select data-document-property="cellAlignment"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label><label>Padding<input type="number" min="0" max="24" data-document-property="cellPadding" value="${cell.padding}"></label><label>Row height (cm)<input type="number" min="0.65" max="3.2" step="0.05" data-document-property="rowHeightCm" value="${Number(row.heightCm || .9).toFixed(2)}"></label><label>Column width (%)<input type="number" min="${Math.min(8, 100 / table.columns.length)}" max="${maximumColumnWidth}" data-document-property="columnWidth" value="${table.columns[state.documentSelectedCell.column]?.width || 25}"></label><div class="document-property-actions"><button type="button" class="secondary" data-document-table-action="toggle-repeat">${row.repeat ? 'Keep as static row' : 'Set as repeating row'}</button><button type="button" class="secondary" data-document-table-action="add-row">Add row</button><button type="button" class="secondary" data-document-table-action="add-column" ${table.columns.length >= 12 ? 'disabled title="Maximum 12 columns"' : ''}>Add column</button><button type="button" class="secondary" data-document-table-action="merge-right">Merge right</button></div>`;
    panel.insertAdjacentHTML('afterbegin', documentSuggestionMarkup(element, table, cell));
    panel.querySelector('[data-document-property="cellAlignment"]').value = cell.alignment;
    return;
  }
  if (element.type === 'table') { panel.innerHTML = `<label class="checkbox-label"><input type="checkbox" data-document-property="printableBorders" ${element.printableBorders ? 'checked' : ''}> Printable borders</label><label>Repeating source<input data-document-property="repeatingSource" value="${escapeHtml(element.repeatingSource || '')}" placeholder="record.collection"></label><p class="muted">Editing guides are always visible in Design mode. Only printable borders appear in Preview and print.</p>`; return; }
  const currentPage = activeDocumentPhysicalPage(); const regionColumns = state.documentSelectedRegion === 'header' ? currentPage.page.headerColumns : state.documentSelectedRegion === 'footer' ? currentPage.page.footerColumns : 1;
  const columnControl = regionColumns > 1 ? `<label>Region column<select data-document-property="column">${Array.from({ length: regionColumns }, (_, index) => `<option value="${index + 1}">Column ${index + 1}</option>`).join('')}</select></label>` : '';
  panel.innerHTML = `${element.type === 'field' ? `<label>Field binding<select data-document-property="binding">${documentBindingOptions(element.binding)}</select></label><button type="button" class="secondary" data-document-static-text>Keep as static text</button>` : `<label>${element.type === 'image' ? 'Image label' : 'Text'}<textarea rows="4" data-document-property="content">${escapeHtml(element.content || '')}</textarea></label>${element.type === 'text' ? `<label>Bind to field<select data-document-property="bindText"><option value="">Keep as static text</option>${documentBindingOptions('')}</select></label>` : ''}`}${columnControl}<fieldset><legend>Paragraph</legend><div class="document-indent-inputs"><label>Left indent (cm)<input type="number" min="0" max="12" step="0.1" data-document-property="leftIndent" value="${element.leftIndent || 0}"></label><label>Right indent (cm)<input type="number" min="0" max="12" step="0.1" data-document-property="rightIndent" value="${element.rightIndent || 0}"></label></div></fieldset><label>Alignment<select data-document-property="alignment"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>${element.type !== 'image' ? `<label>Font size<input type="number" min="7" max="48" data-document-property="fontSize" value="${element.fontSize}"></label><label>Weight<select data-document-property="fontWeight"><option value="400">Regular</option><option value="600">Semibold</option><option value="700">Bold</option></select></label>` : ''}<label>Padding<input type="number" min="0" max="40" data-document-property="padding" value="${element.padding}"></label><button type="button" class="danger-button" data-remove-document-element>Remove element</button>`;
  panel.insertAdjacentHTML('afterbegin', documentSuggestionMarkup(element, table, cell));
  panel.querySelector('[data-document-property="alignment"]').value = element.alignment;
  panel.querySelector('[data-document-property="column"]') && (panel.querySelector('[data-document-property="column"]').value = String(element.column || 1));
  panel.querySelector('[data-document-property="fontWeight"]') && (panel.querySelector('[data-document-property="fontWeight"]').value = element.fontWeight);
}

function insertDocumentElement(type) {
  const template = activeDocumentTemplate(); if (!template) return;
  captureDocumentHistory();
  const element = type === 'table' ? documentTable() : type === 'image' ? { id: documentId('image'), type: 'image', content: 'Organization logo', column: state.documentSelectedColumn, alignment: 'left', padding: 6, source: '' } : documentText('New text block', { column: state.documentSelectedColumn });
  activeDocumentPhysicalPage(template).regions[state.documentSelectedRegion].push(element); state.documentSelectedElementId = element.id; state.documentSelectedCell = null; renderDocumentDesigner();
}

function prepareDocumentPrint() {
  if (!activeDocumentTemplate() || $('#documentDesignerWorkspace')?.hidden) return;
  if (state.documentModeBeforePrint === null) state.documentModeBeforePrint = state.documentDesignerMode;
  state.documentDesignerMode = 'preview'; renderDocumentDesigner();
}

function restoreDocumentAfterPrint() {
  if (state.documentModeBeforePrint === null) return;
  state.documentDesignerMode = state.documentModeBeforePrint; state.documentModeBeforePrint = null; renderDocumentDesigner();
}

function insertDocumentField(binding, label) {
  const { template, cell } = selectedDocumentTarget(); if (!template) return;
  captureDocumentHistory();
  if (cell) { cell.binding = binding; cell.content = label; } else { const element = documentField(label, binding, { column: state.documentSelectedColumn }); activeDocumentPhysicalPage(template).regions[state.documentSelectedRegion].push(element); state.documentSelectedElementId = element.id; }
  renderDocumentDesigner(); $('#documentDesignerAnnouncement').textContent = `${label} inserted.`;
}

function updateDocumentProperty(target) {
  const { element, table, cell } = selectedDocumentTarget(); const property = target.dataset.documentProperty; if (!property) return;
  captureDocumentHistory(); const value = target.type === 'checkbox' ? target.checked : target.value;
  if (cell) {
    if (property === 'cellContent') { cell.content = value; cell.binding = ''; }
    if (property === 'cellBinding') cell.binding = value;
    if (property === 'cellAlignment') cell.alignment = value;
    if (property === 'cellPadding') cell.padding = Number(value);
    if (property === 'rowHeightCm') table.rows[state.documentSelectedCell.row].heightCm = Math.min(3.2, Math.max(.65, Number(value) || .9));
    if (property === 'columnWidth') {
      fitDocumentColumnWidths(table, state.documentSelectedCell.column, value);
    }
  } else if (element) {
    if (property === 'bindText' && value) { element.type = 'field'; element.binding = value; element.label = target.selectedOptions[0]?.textContent || element.content; }
    else if (property === 'binding') { element.binding = value; element.label = target.selectedOptions[0]?.textContent || element.label; }
    else if (['leftIndent', 'rightIndent'].includes(property)) { const page = activeDocumentPhysicalPage().page; const width = documentPageGeometry(page).width - page.margins.left - page.margins.right; const opposite = property === 'leftIndent' ? 'rightIndent' : 'leftIndent'; element[property] = Math.min(Math.max(0, width - Number(element[opposite] || 0) - 1), Math.max(0, Number(value) || 0)); }
    else element[property] = ['fontSize', 'padding', 'column'].includes(property) ? Number(value) : value;
  }
  renderDocumentDesigner();
}

function updateDocumentPageProperty(target) {
  const property = target.dataset.documentPageProperty; const template = activeDocumentTemplate(); if (!property || !template) return;
  captureDocumentHistory(); const page = activeDocumentPhysicalPage(template).page;
  if (property === 'margin') page.margins[target.dataset.documentMarginSide] = clampDocumentMargin(page, target.dataset.documentMarginSide, target.value);
  else if (['headerColumns', 'footerColumns'].includes(property)) page[property] = Number(target.value);
  else if (['headerFromTop', 'footerFromBottom'].includes(property)) page[property] = Math.min(3, Math.max(.5, Number(target.value) || 1.25));
  else page[property] = target.type === 'checkbox' ? target.checked : target.value;
  renderDocumentDesigner();
}

function updateDocumentMarginDrag(event) {
  const drag = state.documentMarginDrag; if (!drag) return;
  const page = activeDocumentTemplate()?.page; if (!page) return;
  const ruler = $(['left', 'right'].includes(drag.side) ? '.document-horizontal-ruler' : '.document-vertical-ruler'); const bounds = ruler.getBoundingClientRect(); const geometry = documentPageGeometry(page);
  const pointer = ['left', 'right'].includes(drag.side) ? event.clientX - bounds.left : event.clientY - bounds.top; const ratio = Math.min(1, Math.max(0, pointer / (['left', 'right'].includes(drag.side) ? bounds.width : bounds.height)));
  const raw = drag.side === 'left' ? ratio * geometry.width : drag.side === 'right' ? (1 - ratio) * geometry.width : drag.side === 'top' ? ratio * geometry.height : (1 - ratio) * geometry.height;
  page.margins[drag.side] = Number(clampDocumentMargin(page, drag.side, raw).toFixed(1));
  const coordinateSystem = $('#documentCoordinateSystem'); coordinateSystem.style.setProperty(`--margin-${drag.side}`, `${page.margins[drag.side]}cm`); coordinateSystem.style.setProperty(`--print-margin-${drag.side}`, `${page.margins[drag.side]}cm`);
  const handle = $(`[data-document-margin-handle="${drag.side}"]`); const axisSize = ['left', 'right'].includes(drag.side) ? geometry.width : geometry.height; const handleRatio = ['left', 'top'].includes(drag.side) ? page.margins[drag.side] / axisSize : (axisSize - page.margins[drag.side]) / axisSize;
  if (handle) { handle.style.setProperty('--handle-position', `${handleRatio * 100}%`); handle.title = `${titleCaseMessage(drag.side)} margin: ${page.margins[drag.side]} cm`; }
  const input = $(`[data-document-margin-side="${drag.side}"]`); if (input) input.value = page.margins[drag.side];
}

function updateDocumentRulerDrag(event) {
  const drag = state.documentRulerDrag; if (!drag) return; const { template, element, table } = selectedDocumentTarget(); if (!template || !element) return;
  if (drag.kind === 'row-height' && table && state.documentSelectedCell) {
    const ruler = $('.document-vertical-ruler'); const bounds = ruler.getBoundingClientRect(); const height = documentPageGeometry(activeDocumentPhysicalPage(template).page).height; const pointerCm = Math.min(height, Math.max(0, ((event.clientY - bounds.top) / Math.max(1, bounds.height)) * height));
    const row = table.rows[state.documentSelectedCell.row]; row.heightCm = Number(Math.min(3.2, Math.max(.65, pointerCm - drag.rowTopCm)).toFixed(2));
    const rowElement = $(`[data-document-row="${table.id}:${state.documentSelectedCell.row}"]`); if (rowElement) rowElement.style.height = `${row.heightCm}cm`;
    const handle = $('[data-document-row-height-handle]'); if (handle) { handle.style.setProperty('--handle-position', `${(Math.min(height, drag.rowTopCm + row.heightCm) / height) * 100}%`); handle.title = `Row height: ${row.heightCm.toFixed(2)} cm`; }
    const input = $('[data-document-property="rowHeightCm"]'); if (input) input.value = row.heightCm.toFixed(2);
    return;
  }
  const ruler = $('.document-horizontal-ruler'); const bounds = ruler.getBoundingClientRect(); const page = activeDocumentPhysicalPage(template).page; const width = documentPageGeometry(page).width; const pointerCm = Math.min(width, Math.max(0, ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * width)); const contentWidth = width - page.margins.left - page.margins.right;
  if (drag.kind === 'indent') { const opposite = drag.side === 'left' ? Number(element.rightIndent) || 0 : Number(element.leftIndent) || 0; element[`${drag.side}Indent`] = Number(Math.min(contentWidth - opposite - 1, Math.max(0, drag.side === 'left' ? pointerCm - page.margins.left : width - page.margins.right - pointerCm)).toFixed(1)); const block = $(`[data-document-element="${element.id}"]`); if (block) block.style[`margin${titleCaseMessage(drag.side)}`] = `${element[`${drag.side}Indent`]}cm`; const input = $(`[data-document-property="${drag.side}Indent"]`); if (input) input.value = element[`${drag.side}Indent`]; }
  if (drag.kind === 'column' && table) { const widths = normalizedDocumentColumnWidths(table); const before = widths.slice(0, drag.index).reduce((sum, value) => sum + value, 0); const pair = widths[drag.index] + widths[drag.index + 1]; const desired = ((pointerCm - page.margins.left) / contentWidth) * 100 - before; const left = Math.min(pair - 8, Math.max(8, desired)); table.columns[drag.index].width = Number(left.toFixed(3)); table.columns[drag.index + 1].width = Number((pair - left).toFixed(3)); }
  const handle = drag.kind === 'indent' ? $(`[data-document-indent-handle="${drag.side}"]`) : $(`[data-document-column-marker="${drag.index}"]`); if (handle) handle.style.setProperty('--handle-position', `${(pointerCm / width) * 100}%`);
  if (drag.kind === 'column' && table) { const columns = $$(`[data-document-element="${table.id}"] col`); normalizedDocumentColumnWidths(table).forEach((value, index) => { if (columns[index]) columns[index].style.width = `${value}%`; }); const input = $('[data-document-property="columnWidth"]'); if (input && state.documentSelectedCell?.column === drag.index) input.value = table.columns[drag.index].width; }
}

function documentTableAction(action) {
  const { table, cell } = selectedDocumentTarget(); if (!table || !cell) return;
  captureDocumentHistory();
  if (action === 'add-row') table.rows.push({ id: documentId('row'), heightCm: .9, repeat: false, cells: table.columns.map(() => ({ id: documentId('cell'), content: '', binding: '', alignment: 'left', padding: 6, colSpan: 1 })) });
  if (action === 'toggle-repeat') table.rows[state.documentSelectedCell.row].repeat = !table.rows[state.documentSelectedCell.row].repeat;
  if (action === 'add-column' && table.columns.length < 12) { table.columns.push({ id: documentId('col'), width: 8, label: `Column ${table.columns.length + 1}` }); table.rows.forEach((row) => row.cells.push({ id: documentId('cell'), content: '', binding: '', alignment: 'left', padding: 6, colSpan: 1 })); fitDocumentColumnWidths(table, table.columns.length - 1, 8); }
  if (action === 'merge-right') { const next = table.rows[state.documentSelectedCell.row].cells[state.documentSelectedCell.column + 1]; if (next && !next.hidden) { cell.colSpan = (cell.colSpan || 1) + (next.colSpan || 1); next.hidden = true; } }
  renderDocumentDesigner();
}

async function saveDocumentTemplate() {
  const template = activeDocumentTemplate(); if (!template) return;
  const button = $('#saveDocumentTemplate'); if (button.disabled) return;
  template.name = $('#documentTemplateName').value.trim() || 'Untitled document'; template.source = $('#documentTemplateSource').value; template.updatedAt = new Date().toISOString(); template.status = template.status === 'sample' ? 'draft' : template.status;
  if (template.pages?.length) { template.page = structuredClone(template.pages[0].page); template.regions = structuredClone(template.pages[0].regions); }
  localStorage.setItem(documentTemplateStorageKey, JSON.stringify(state.documentTemplates));
  button.disabled = true; button.textContent = 'Saving…';
  const snapshot = structuredClone(template);
  try {
    const saved = await api(`/api/document-templates/${encodeURIComponent(template.templateKey)}`, { method: 'PUT', body: JSON.stringify({ template: snapshot, revision: snapshot.serverRevision }) });
    if (state.documentOriginalPdfFile) {
      const sourceBody = new FormData(); sourceBody.append('pdf', state.documentOriginalPdfFile);
      await api(`/api/document-templates/${encodeURIComponent(template.templateKey)}/source-pdf`, { method: 'PUT', body: sourceBody });
      template.hasSourcePdf = true; state.documentOriginalPdfFile = null;
    }
    // Keep edits made while the request was in flight; they remain unsaved.
    const currentDefinition = structuredClone(template); delete currentDefinition.serverRevision; delete currentDefinition.serverSnapshot; delete currentDefinition.hasSourcePdf;
    const savedDefinition = structuredClone(snapshot); delete savedDefinition.serverRevision; delete savedDefinition.serverSnapshot; delete savedDefinition.hasSourcePdf;
    const unchanged = JSON.stringify(currentDefinition) === JSON.stringify(savedDefinition);
    template.serverRevision = saved.revision;
    template.serverSnapshot = JSON.stringify(savedDefinition);
    state.documentDirty = !unchanged;
    localStorage.setItem(documentTemplateStorageKey, JSON.stringify(state.documentTemplates));
    toast(unchanged ? 'Document template saved to server.' : 'Saved. Newer edits remain unsaved.');
    renderDocumentDesigner();
  } catch (error) { $('#documentOutputStatus').textContent = `Server save failed: ${error.message}. Local draft retained.`; }
  finally { button.disabled = false; button.textContent = 'Save'; }
}

async function loadServerDocumentTemplates() {
  const payload = await api('/api/document-templates');
  for (const entry of payload.templates) {
    const index = state.documentTemplates.findIndex((item) => item.templateKey === entry.template.templateKey);
    const serverCopy = { ...entry.template, hasSourcePdf: entry.hasSourcePdf, serverRevision: entry.revision, serverSnapshot: JSON.stringify(entry.template) };
    if (index < 0) state.documentTemplates.push(serverCopy);
    else {
      if (state.activeDocumentTemplateKey === entry.template.templateKey) continue;
      const local = structuredClone(state.documentTemplates[index]); const baseline = local.serverSnapshot;
      delete local.serverRevision; delete local.serverSnapshot; delete local.hasSourcePdf;
      // Refresh unchanged server copies; never overwrite a local draft.
      if (JSON.stringify(local) === baseline || (local.status === 'sample' && !state.documentRecoveredTemplateKeys.has(local.templateKey))) state.documentTemplates[index] = serverCopy;
    }
  }
  renderDocumentTemplateList();
}

function documentOutputContext() {
  const record = $('#documentOutputRecordId').value;
  const workflow = $('#documentOutputWorkflowId').value.trim();
  return { ...(record ? { recordId: Number(record) } : {}), ...(workflow ? { workflowRequestId: workflow } : {}) };
}

let documentPreviewSequence = 0;
async function mountDocumentOutputFrame(frame, template, context, zoom = 100) {
  frame.hidden = false;
  await new Promise((resolve) => { frame.onload = resolve; frame.srcdoc = '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'"></head><body><main></main></body></html>'; });
  const host = frame.contentDocument.querySelector('main');
  const count = await DocumentOutput.mount(host, template, context);
  const geometry = DocumentOutput.geometry(template.page);
  host.style.transformOrigin = 'top left'; host.style.transform = `scale(${zoom / 100})`;
  frame.style.width = `${geometry.width * zoom / 100}cm`; frame.style.height = `${geometry.height * count * zoom / 100}cm`;
  const printStyle = frame.contentDocument.createElement('style'); printStyle.textContent = '@media screen{html,body{overflow:hidden}}@media print{main{transform:none!important}}'; host.append(printStyle);
  return count;
}

async function updateDocumentOutputPreview() {
  const sequence = ++documentPreviewSequence;
  $('#documentOutputPreview').hidden = true;
  $('#documentOutputStatus').textContent = 'Preparing preview…';
  const template = structuredClone(activeDocumentTemplate()); if (!template) return;
  const input = documentOutputContext();
  let context = { system: { current_user: state.user?.name || '' } };
  if (template.serverRevision) {
    if ((input.recordId || input.workflowRequestId) && JSON.parse(template.serverSnapshot || '{}').source !== template.source) throw new Error('Save the changed data context before previewing record data.');
    const resolved = await api(`/api/document-templates/${encodeURIComponent(template.templateKey)}/preview`, { method: 'POST', body: JSON.stringify({ ...input, revision: template.serverRevision }) });
    context = resolved.context;
  } else if (input.recordId || input.workflowRequestId) throw new Error('Save this template to the server before previewing record data.');
  if (sequence !== documentPreviewSequence || state.documentDesignerMode !== 'preview') return;
  const count = await mountDocumentOutputFrame($('#documentOutputPreview'), template, context, Number($('#documentZoom').value));
  $('#documentOutputStatus').textContent = `${count} page${count === 1 ? '' : 's'} · ${input.recordId || input.workflowRequestId ? 'Authorized data' : 'Template-only preview; unbound fields are blank'} · Download PDF is the formal output.`;
}

async function downloadSavedDocumentPdf(templateKey, input, button) {
  if (button.disabled) return;
  const label = button.textContent; button.disabled = true; button.textContent = 'Generating PDF…'; button.setAttribute('aria-busy', 'true');
  try {
    const response = await fetch(`/api/document-templates/${encodeURIComponent(templateKey)}/render-pdf`, { method: 'POST', headers: { Authorization: `Bearer ${await currentAuthToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'PDF generation failed');
    if (!response.headers.get('content-type')?.includes('application/pdf')) throw new Error('Server did not return a PDF.');
    const url = URL.createObjectURL(await response.blob()); const link = document.createElement('a');
    link.href = url; link.download = response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] || 'document.pdf';
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  } finally { button.disabled = false; button.textContent = label; button.removeAttribute('aria-busy'); }
}

let recordDocumentContext = {};
async function openRecordDocumentOutput(input) {
  recordDocumentContext = input;
  const dialog = $('#recordDocumentDialog'); if (!dialog.open) dialog.showModal();
  $('#recordDocumentFrame').hidden = true; $('#recordDocumentStatus').textContent = 'Loading available templates…';
  $('#recordDocumentTemplate').replaceChildren();
  try {
    const payload = await api('/api/document-templates/available', { method: 'POST', body: JSON.stringify(input) });
    $('#recordDocumentTemplate').innerHTML = payload.templates.map((template) => `<option value="${escapeHtml(template.templateKey)}">${escapeHtml(template.name)}</option>`).join('');
    $('#recordDocumentStatus').textContent = payload.templates.length ? 'Preview or download the selected document.' : 'No saved templates are available for this context.';
  } catch (error) { $('#recordDocumentStatus').textContent = error.message; }
}

function renderWorkflowDocumentOutput(definition = activeWorkflowDefinition()) {
  const key = definition?.workflowKey || $('#workflowDefinitionForm')?.elements.workflowKey?.value || 'new'; const output = state.workflowDocumentOutputs[key] || { enabled: false, templateKey: '', trigger: 'final_approval', format: 'pdf' };
  $('#workflowDocumentEnabled').checked = output.enabled; $('#workflowDocumentTemplate').innerHTML = `<option value="">Select document template</option>${state.documentTemplates.map((template) => `<option value="${escapeHtml(template.templateKey)}">${escapeHtml(template.name)}</option>`).join('')}`; $('#workflowDocumentTemplate').value = output.templateKey || '';
  $('#workflowDocumentTrigger').value = output.trigger; $('#workflowDocumentFormat').value = output.format; $('#workflowDocumentTemplate').disabled = !output.enabled; $('#workflowDocumentTrigger').disabled = !output.enabled; $('#workflowDocumentFormat').disabled = !output.enabled; $('#openWorkflowDocumentDesigner').disabled = !output.templateKey; $('#previewWorkflowDocument').disabled = !output.templateKey;
}

function saveWorkflowDocumentOutput() {
  const key = activeWorkflowDefinition()?.workflowKey || $('#workflowDefinitionForm').elements.workflowKey.value || 'new';
  state.workflowDocumentOutputs[key] = { enabled: $('#workflowDocumentEnabled').checked, templateKey: $('#workflowDocumentTemplate').value, trigger: $('#workflowDocumentTrigger').value, format: $('#workflowDocumentFormat').value };
  localStorage.setItem(workflowDocumentStorageKey, JSON.stringify(state.workflowDocumentOutputs)); renderWorkflowDocumentOutput(activeWorkflowDefinition());
}

async function loadWorkflowDefinitions(selectKey = state.activeWorkflowKey) {
  if (state.user?.role !== 'admin') return;
  const [payload, formsPayload] = await Promise.all([
    api('/api/workflows/definitions?status=all'),
    api('/api/sysadmin/forms').catch(() => ({ forms: [] }))
  ]);
  state.standaloneForms = formsPayload.forms || [];
  state.workflowDefinitions = payload.definitions || [];
  state.activeWorkflowKey = state.workflowDefinitions.some((item) => item.workflowKey === selectKey) ? selectKey : '';
  renderWorkflowDefinitionList();
  if (state.activeWorkflowKey) showWorkflowDefinition(activeWorkflowDefinition());
}

function workflowDefinitionPayload(form) {
  const csv = (name) => form.elements[name].value.split(',').map((item) => item.trim()).filter(Boolean);
  return {
    workflowKey: form.elements.workflowKey.value.trim(),
    name: form.elements.name.value.trim(),
    description: form.elements.description.value.trim(),
    sourceModuleKey: form.elements.sourceModuleKey.value,
    requestFormKey: form.elements.requestFormKey.value.trim() || undefined,
    config: {
      trigger: { type: 'manual_submit' },
      recordPolicy: {
        lockScope: form.elements.lockScope.value,
        lockedFields: csv('lockedFields'),
        snapshotFields: csv('snapshotFields'),
        allowAuthorizedCancel: form.elements.allowCancellation.checked
      },
      stages: captureWorkflowStages(),
      builderGraph: workflowGraphForSave(),
      eventPolicy: {
        events: ['workflow.submitted', 'workflow.approved', 'workflow.rejected', 'workflow.returned', 'workflow.resubmitted', 'workflow.withdrawn', 'workflow.cancelled'],
        payloadFields: ['workflowKey', 'requestKey', 'sourceModuleKey', 'sourceRecordId', 'requestStatus', 'stageKey']
      }
    }
  };
}

async function saveWorkflowDefinition(event) {
  event?.preventDefault();
  const form = $('#workflowDefinitionForm');
  const editingKey = form.elements.editingWorkflowKey.value;
  const payload = workflowDefinitionPayload(form);
  const result = await api(editingKey ? `/api/workflows/definitions/${encodeURIComponent(editingKey)}` : '/api/workflows/definitions', {
    method: editingKey ? 'PUT' : 'POST',
    body: JSON.stringify(payload)
  });
  state.activeWorkflowKey = result.definition.workflowKey;
  await loadWorkflowDefinitions(state.activeWorkflowKey);
  renderWorkflowCheck(result.check);
  toast(editingKey ? 'Workflow Draft Saved.' : 'Workflow Created.');
  return result;
}

async function checkWorkflowDefinition() {
  const saved = await saveWorkflowDefinition();
  const result = await api(`/api/workflows/definitions/${encodeURIComponent(saved.definition.workflowKey)}/check`, { method: 'POST', body: '{}' });
  renderWorkflowCheck(result.check);
  toast(result.check.valid ? 'Workflow Check Passed.' : 'Workflow Needs Attention.', result.check.valid ? 'success' : 'error');
}

async function publishWorkflowDefinition() {
  const saved = await saveWorkflowDefinition();
  if (!saved.check.valid) {
    renderWorkflowCheck(saved.check);
    return toast('Workflow Needs Attention Before Publishing.', 'error');
  }
  const confirmed = await showConfirmationModal({ title: 'Publish workflow', message: 'Publish this immutable version for new approval requests?', confirmLabel: 'Publish' });
  if (!confirmed) return;
  await api(`/api/workflows/definitions/${encodeURIComponent(saved.definition.workflowKey)}/publish`, { method: 'POST', body: JSON.stringify({ summary: 'Published from Workflow Builder' }) });
  await loadWorkflowDefinitions(saved.definition.workflowKey);
  toast('Workflow Published.');
}

async function checkpointWorkflowDefinition() {
  const saved = await saveWorkflowDefinition();
  await api(`/api/workflows/definitions/${encodeURIComponent(saved.definition.workflowKey)}/checkpoints`, { method: 'POST', body: JSON.stringify({ summary: 'Workflow Builder checkpoint' }) });
  await loadWorkflowDefinitions(saved.definition.workflowKey);
  toast('Workflow Checkpoint Saved.');
}

async function cloneWorkflowDefinition() {
  const definition = activeWorkflowDefinition();
  if (!definition) return;
  const key = `${definition.workflowKey}_copy_${String(Date.now()).slice(-5)}`.slice(0, 80);
  const result = await api(`/api/workflows/definitions/${encodeURIComponent(definition.workflowKey)}/clone`, { method: 'POST', body: JSON.stringify({ workflowKey: key, name: `${definition.name} Copy` }) });
  state.activeWorkflowKey = result.definition.workflowKey;
  await loadWorkflowDefinitions(state.activeWorkflowKey);
  toast('Workflow Cloned.');
}

async function archiveWorkflowDefinition() {
  const definition = activeWorkflowDefinition();
  if (!definition) return;
  const confirmed = await showConfirmationModal({ title: 'Archive workflow', message: `Archive ${definition.name}? Existing requests keep their original version.`, confirmLabel: 'Archive' });
  if (!confirmed) return;
  await api(`/api/workflows/definitions/${encodeURIComponent(definition.workflowKey)}/archive`, { method: 'POST', body: '{}' });
  await loadWorkflowDefinitions(definition.workflowKey);
  toast('Workflow Archived.');
}

function workflowRequestItems() {
  if (state.workflowRequestMode === 'inbox') {
    return state.workflowInbox.filter((item) => state.workflowRequestStatus === 'all' || item.requestStatus === state.workflowRequestStatus);
  }
  return state.workflowRequests.filter((item) => (
    (state.user?.role === 'admin' || item.relationship === 'requester')
    && (state.workflowRequestStatus === 'all' || item.status === state.workflowRequestStatus)
    && (!state.workflowRequestSearch || [item.requestKey, item.workflowName].some((value) => String(value || '').toLowerCase().includes(state.workflowRequestSearch.toLowerCase())))
  ));
}

function renderWorkflowRequestList() {
  const items = workflowRequestItems();
  $('#workflowRequestList').innerHTML = items.map((item) => {
    const requestKey = item.requestKey;
    const status = item.requestStatus || item.status || 'pending';
    return `<button type="button" class="workflow-request-item ${requestKey === state.activeWorkflowRequestKey ? 'is-active' : ''}" data-workflow-request="${escapeHtml(requestKey)}"><span class="workflow-request-item-top"><strong>${escapeHtml(requestKey)}</strong><em class="status-pill ${workflowStatusClass(status)}">${escapeHtml(titleCaseMessage(status))}</em></span><span>${escapeHtml(item.workflowName || item.stageName || item.sourceModuleKey || 'Approval request')}</span><small>${state.workflowRequestMode === 'inbox' ? `${escapeHtml(item.stageName || item.stageKey)} · ` : ''}${escapeHtml(item.sourceModuleKey)} #${escapeHtml(String(item.sourceRecordId))}</small></button>`;
  }).join('') || `<div class="empty-state"><h3>${state.workflowRequestMode === 'inbox' ? 'Inbox clear' : 'No requests yet'}</h3><p>${state.workflowRequestMode === 'inbox' ? 'New assignments appear here when an approval stage reaches you.' : 'Send an existing CRM record through a published approval workflow.'}</p></div>`;
  const mine = state.workflowRequests.filter((item) => state.user?.role === 'admin' || item.relationship === 'requester');
  const pending = mine.filter((item) => item.status === 'pending').length;
  const returned = mine.filter((item) => item.status === 'returned').length;
  $('#workflowRequestSummary').innerHTML = [
    [state.user?.role === 'admin' ? 'Visible requests' : 'My requests', mine.length, state.user?.role === 'admin' ? 'All requests across configured workflows' : 'All requests you raised'],
    ['In progress', pending, 'Currently moving through approval'],
    ['Returned', returned, 'Waiting for your correction'],
    ['My approvals', state.workflowInbox.filter((item) => item.status === 'pending').length, 'Assignments needing a decision']
  ].map(([label, value, help]) => `<article><span>${escapeHtml(label)}</span><strong>${value}</strong><small>${escapeHtml(help)}</small></article>`).join('');
}

function workflowStageTone(stage) {
  if (stage.status === 'active') return 'is-active';
  if (['approved', 'auto-approved'].includes(stage.status)) return 'is-complete';
  if (stage.status === 'skipped') return 'is-skipped';
  if (['rejected', 'returned', 'cancelled'].includes(stage.status)) return 'is-stopped';
  return 'is-waiting';
}

function renderWorkflowRequestDetail(payload) {
  const request = payload.request;
  const canDecide = payload.relationship === 'approver'
    && request.status === 'pending'
    && state.workflowInbox.some((assignment) => assignment.requestKey === request.requestKey && assignment.status === 'pending');
  const actions = [];
  if (canDecide) actions.push('<button type="button" data-workflow-decision="approve">Approve</button>', '<button type="button" class="secondary" data-workflow-decision="return">Return for correction</button>', '<button type="button" class="secondary danger-link" data-workflow-decision="reject">Reject</button>');
  if (payload.relationship === 'requester' && request.status === 'pending') actions.push('<button type="button" class="secondary danger-link" data-workflow-lifecycle="withdraw">Withdraw</button>');
  if (payload.relationship === 'requester' && request.status === 'returned') actions.push('<button type="button" data-workflow-lifecycle="resubmit">Resubmit amended record</button>');
  if (state.user?.role === 'admin' && request.status === 'pending') actions.push('<button type="button" class="secondary danger-link" data-workflow-lifecycle="cancel">Cancel request</button>');
  const snapshot = payload.snapshot?.snapshot || {};
  const attachmentSection = `<section class="workflow-detail-section"><div class="workflow-detail-section-heading"><h3>Attachments</h3><span>${payload.attachments?.length || 0} files</span></div><div class="workflow-attachment-list">${(payload.attachments || []).map((attachment) => `<button type="button" class="secondary" data-workflow-attachment-download="${attachment.id}"><strong>${escapeHtml(attachment.fileName)}</strong><small>${escapeHtml(titleCaseMessage(attachment.purpose))} · ${Math.max(1, Math.ceil(attachment.fileSize / 1024))} KB</small></button>`).join('') || '<p class="muted">No attachments were added to this request.</p>'}</div></section>`;
  $('#workflowRequestDetail').innerHTML = `<header class="workflow-request-detail-header"><div><span class="eyebrow">${escapeHtml(request.workflowName || request.workflowKey)}</span><h2>${escapeHtml(request.requestKey)}</h2><p>${escapeHtml(titleCaseMessage(payload.relationship))} view · ${escapeHtml(request.sourceModuleKey)} record #${escapeHtml(String(request.sourceRecordId))}</p><button type="button" class="secondary" data-workflow-document-output>Document PDF</button></div><span class="status-pill ${workflowStatusClass(request.status)}">${escapeHtml(titleCaseMessage(request.status))}</span></header>
    <div class="workflow-request-actionbar">${actions.join('')}</div>${attachmentSection}
    <section class="workflow-detail-section"><div class="workflow-detail-section-heading"><h3>Approval rail</h3><span>Version ${request.workflowVersion}</span></div><div class="workflow-approval-rail">${payload.stages.map((stage, index) => `<article class="${workflowStageTone(stage)}"><span class="workflow-rail-marker">${['approved', 'auto-approved'].includes(stage.status) ? '✓' : index + 1}</span><div><strong>${escapeHtml(stage.name || stage.stageKey)}</strong><small>${escapeHtml(titleCaseMessage(stage.status))}${stage.dueAt ? ` · Due ${escapeHtml(new Date(stage.dueAt).toLocaleString())}` : ''}</small>${stage.reasonMessage ? `<p>${escapeHtml(stage.reasonMessage)}</p>` : ''}</div></article>`).join('')}</div></section>
    <section class="workflow-detail-section"><div class="workflow-detail-section-heading"><h3>Protected snapshot</h3><span>${escapeHtml(payload.presentation?.formName || 'Permitted fields')} · Revision ${payload.snapshot?.revisionNumber || 1}</span></div><dl class="workflow-snapshot-grid">${Object.entries(snapshot).map(([key, value]) => `<div><dt>${escapeHtml(titleCaseMessage(key))}</dt><dd>${escapeHtml(typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—'))}</dd></div>`).join('') || '<div><dt>Visible fields</dt><dd>No fields are available in this node form under your field permissions.</dd></div>'}</dl></section>
    <section class="workflow-detail-section"><div class="workflow-detail-section-heading"><h3>Decision history</h3><span>${payload.timeline.length} entries</span></div><div class="workflow-timeline">${payload.timeline.slice().reverse().map((entry) => `<article><span></span><div><strong>${escapeHtml(titleCaseMessage(entry.action || entry.eventType || entry.type))}</strong><small>${escapeHtml(entry.stageName || entry.stageKey || 'Request')} · ${escapeHtml(new Date(entry.createdAt).toLocaleString())}</small>${entry.actorIdentity?.name ? `<p>${escapeHtml(entry.actorIdentity.name)}${entry.remark ? ` — ${escapeHtml(entry.remark)}` : ''}</p>` : entry.remark ? `<p>${escapeHtml(entry.remark)}</p>` : ''}${Object.keys(entry.responses || {}).length ? `<dl class="workflow-response-history">${Object.entries(entry.responses).map(([key, value]) => `<div><dt>${escapeHtml(titleCaseMessage(key))}</dt><dd>${escapeHtml(String(value ?? '—'))}</dd></div>`).join('')}</dl>` : ''}</div></article>`).join('') || '<div class="empty-state"><p>No history entries are available.</p></div>'}</div></section>`;
}

async function openWorkflowRequest(requestKey) {
  state.activeWorkflowRequestKey = requestKey;
  renderWorkflowRequestList();
  $('#workflowRequestDetail').innerHTML = '<div class="empty-state"><p>Loading request history…</p></div>';
  const payload = await api(`/api/workflows/requests/${encodeURIComponent(requestKey)}`);
  state.activeWorkflowRequest = payload;
  renderWorkflowRequestDetail(payload);
}

async function downloadWorkflowAttachment(attachmentId) {
  const requestKey = state.activeWorkflowRequestKey;
  const attachment = state.activeWorkflowRequest?.attachments?.find((item) => Number(item.id) === Number(attachmentId));
  if (!requestKey || !attachment) return;
  const response = await fetch(`/api/workflows/requests/${encodeURIComponent(requestKey)}/attachments/${attachment.id}`, {
    headers: { Authorization: `Bearer ${await currentAuthToken()}` }
  });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Unable to download attachment');
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = attachment.fileName;
  link.click();
  URL.revokeObjectURL(url);
}

async function loadWorkflowRequests() {
  const [requests, inbox] = await Promise.all([
    api('/api/workflows/requests?status=all&limit=100'),
    api('/api/workflows/inbox?status=pending&limit=100')
  ]);
  state.workflowRequests = requests.requests || [];
  state.workflowInbox = inbox.assignments || [];
  renderWorkflowRequestList();
  if (state.activeWorkflowRequestKey && state.workflowRequests.some((item) => item.requestKey === state.activeWorkflowRequestKey)) {
    await openWorkflowRequest(state.activeWorkflowRequestKey);
  }
}

function workflowMonitoringTiming(item) {
  if (!item.dueAt) return '<strong>Not tracked</strong><small>No SLA on this stage</small>';
  const due = new Date(item.dueAt);
  const remaining = due.getTime() - Date.now();
  const hours = Math.max(1, Math.ceil(Math.abs(remaining) / 3600000));
  return `<strong>${remaining < 0 ? `${hours}h overdue` : `${hours}h remaining`}</strong><small>Due ${escapeHtml(due.toLocaleString())}</small>`;
}

function renderWorkflowMonitoring() {
  const { summary = {}, items = [], generatedAt } = state.workflowMonitoring;
  $('#workflowMonitoringUpdated').textContent = generatedAt ? `Updated ${new Date(generatedAt).toLocaleTimeString()}` : '';
  $('#workflowMonitoringSummary').innerHTML = [
    ['Open routes', summary.active || 0, 'active'],
    ['Due within 24h', summary.dueSoon || 0, 'due_soon'],
    ['Overdue', summary.overdue || 0, 'overdue'],
    ['Completed in view', summary.completed || 0, 'completed']
  ].map(([label, value, tone]) => `<button type="button" class="workflow-monitoring-metric is-${tone}" data-monitoring-sla-filter="${tone === 'active' || tone === 'completed' ? 'all' : tone}"><span>${escapeHtml(label)}</span><strong>${value}</strong></button>`).join('');
  $('#workflowMonitoringRows').innerHTML = items.map((item) => `<tr class="is-${escapeHtml(item.slaStatus)}">
    <td><button type="button" class="workflow-monitoring-request-link" data-monitoring-request="${escapeHtml(item.requestKey)}"><strong>${escapeHtml(item.requestKey)}</strong><small>${escapeHtml(item.workflowName)}</small></button></td>
    <td><strong>${escapeHtml(item.stageName || titleCaseMessage(item.status))}</strong><small>${escapeHtml(item.sourceModuleKey)} #${escapeHtml(String(item.sourceRecordId))}</small></td>
    <td><strong>${escapeHtml(item.approverNames?.join(', ') || 'No active approver')}</strong><small>Requested by ${escapeHtml(item.requesterName || 'Unknown')}</small></td>
    <td>${workflowMonitoringTiming(item)}</td>
    <td><span class="workflow-sla-badge is-${escapeHtml(item.slaStatus)}">${escapeHtml(titleCaseMessage(item.slaStatus))}</span></td>
    <td>${item.status === 'pending' && item.stageId ? `<div class="workflow-monitoring-actions"><button type="button" class="secondary compact-button" data-monitoring-remind="${escapeHtml(item.requestKey)}">Send reminder</button>${item.assignments?.length ? `<button type="button" class="secondary compact-button" data-monitoring-reassign="${escapeHtml(item.requestKey)}">Reassign</button>` : ''}</div>` : ''}</td>
  </tr>`).join('') || '<tr><td colspan="6"><div class="empty-state"><h3>No workflow requests match</h3><p>Adjust the request or SLA filters to widen this operational view.</p></div></td></tr>';
}

async function loadWorkflowMonitoring() {
  const params = new URLSearchParams({ status: state.workflowMonitoringStatus, sla: state.workflowMonitoringSla, search: state.workflowMonitoringSearch, limit: '300' });
  state.workflowMonitoring = await api(`/api/workflows/monitoring?${params}`);
  renderWorkflowMonitoring();
}

function workflowReportParams() {
  const filters = state.workflowReportFilters;
  return new URLSearchParams({ ...filters, limit: '500' });
}

function syncWorkflowReportOptions() {
  const workflow = $('#workflowReportWorkflow');
  const department = $('#workflowReportDepartment');
  if (workflow) workflow.innerHTML = `<option value="">All workflows</option>${state.workflowDefinitions.map((item) => `<option value="${escapeHtml(item.workflowKey)}">${escapeHtml(item.name)}</option>`).join('')}`;
  if (department) department.innerHTML = `<option value="">All departments</option>${state.departmentNodes.filter((node) => node.enabled !== false).map((node) => `<option value="${node.id}">${escapeHtml(node.name)}</option>`).join('')}`;
  const controls = { search: 'Search', workflowKey: 'Workflow', status: 'Status', requester: 'Requester', approver: 'Approver', departmentId: 'Department', dateFrom: 'DateFrom', dateTo: 'DateTo' };
  Object.entries(controls).forEach(([key, suffix]) => { const control = $(`#workflowReport${suffix}`); if (control) control.value = state.workflowReportFilters[key]; });
}

function renderWorkflowReport() {
  const items = state.workflowReport.items || [];
  $('#workflowReportCount').textContent = `${items.length} request${items.length === 1 ? '' : 's'}`;
  $('#workflowReportRows').innerHTML = items.map((item) => `<tr>
    <td><button type="button" class="workflow-monitoring-request-link" data-monitoring-request="${escapeHtml(item.requestKey)}"><strong>${escapeHtml(item.requestKey)}</strong><small>${escapeHtml(item.workflowName)}</small></button></td>
    <td><strong>${escapeHtml(item.requesterName || 'Unknown')}</strong><small>${escapeHtml(item.requesterEmail || '')}</small></td>
    <td>${escapeHtml(item.requesterDepartmentName || 'Not assigned')}</td>
    <td><span class="status-pill status-${escapeHtml(item.status)}">${escapeHtml(titleCaseMessage(item.status))}</span></td>
    <td>${escapeHtml(item.submittedAt ? new Date(item.submittedAt).toLocaleString() : 'Draft')}</td>
    <td>${escapeHtml(item.completedAt ? new Date(item.completedAt).toLocaleString() : '—')}</td>
    <td><button type="button" class="secondary compact-button" data-monitoring-request="${escapeHtml(item.requestKey)}">View timeline</button></td>
  </tr>`).join('') || '<tr><td colspan="7"><div class="empty-state"><h3>No request history matches</h3><p>Clear one or more filters to widen this report.</p></div></td></tr>';
}

async function loadWorkflowReport() {
  state.workflowReport = await api(`/api/workflows/monitoring?${workflowReportParams()}`);
  renderWorkflowReport();
}

async function selectWorkflowMonitoringTab(tab) {
  state.workflowMonitoringTab = tab;
  $$('[data-workflow-monitoring-tab]').forEach((button) => {
    const active = button.dataset.workflowMonitoringTab === tab;
    button.classList.toggle('is-active', active); button.setAttribute('aria-selected', String(active));
  });
  $('#workflowMonitoringLivePanel').hidden = tab !== 'live';
  $('#workflowMonitoringHistoryPanel').hidden = tab !== 'history';
  if (tab === 'history') { syncWorkflowReportOptions(); await loadWorkflowReport(); } else await loadWorkflowMonitoring();
}

async function exportWorkflowReport() {
  const authToken = await currentAuthToken();
  const response = await fetch(`/api/workflows/monitoring/export.csv?${workflowReportParams()}`, { headers: authToken ? { Authorization: `Bearer ${authToken}` } : {} });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Unable to export workflow history');
  const url = URL.createObjectURL(await response.blob()); const link = document.createElement('a');
  link.href = url; link.download = `workflow-history-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  toast('Workflow History Exported.');
}

function clearWorkflowReportFilters() {
  state.workflowReportFilters = { search: '', workflowKey: '', status: 'all', requester: '', approver: '', departmentId: '', dateFrom: '', dateTo: '' };
  syncWorkflowReportOptions(); runWorkflowUi(loadWorkflowReport);
}

async function runWorkflowSlaCheck() {
  const result = await api('/api/workflows/monitoring/run', { method: 'POST', body: '{}' });
  await loadWorkflowMonitoring();
  toast(`Deadline Check Complete: ${result.reminders} Reminder(s), ${result.escalations} Escalation(s).`);
}

async function sendWorkflowReminder(requestKey) {
  await api(`/api/workflows/requests/${encodeURIComponent(requestKey)}/remind`, {
    method: 'POST', headers: { 'Idempotency-Key': workflowIdempotencyKey('reminder') }, body: '{}'
  });
  toast(`Reminder Queued For ${requestKey}.`);
}

async function openMonitoredWorkflowRequest(requestKey) {
  showView('workflowRequestsView');
  await loadWorkflowRequests();
  await openWorkflowRequest(requestKey);
}

function workflowUserOptions(selected = '') {
  return state.users.filter((user) => user.status === 'active').map((user) => `<option value="${user.id}" ${Number(selected) === Number(user.id) ? 'selected' : ''}>${escapeHtml(user.name)} · ${escapeHtml(user.email)}</option>`).join('');
}

function delegationDisplayStatus(item) {
  if (item.status === 'cancelled') return 'cancelled';
  const now = Date.now();
  if (new Date(item.startsAt).getTime() > now) return 'scheduled';
  if (new Date(item.endsAt).getTime() < now) return 'expired';
  return 'active';
}

function renderWorkflowDelegations() {
  $('#workflowDelegationList').innerHTML = state.workflowDelegations.map((item) => {
    const status = delegationDisplayStatus(item);
    const scope = [item.workflowKey || 'All workflows', item.scopeRole ? `Role: ${item.scopeRole}` : '', item.scopeDepartmentId ? `Department #${item.scopeDepartmentId}` : ''].filter(Boolean).join(' · ');
    return `<article class="workflow-delegation-card is-${status}"><div class="workflow-delegation-route"><div><span>Original</span><strong>${escapeHtml(item.delegatorName)}</strong><small>${escapeHtml(item.delegatorEmail)}</small></div><b aria-hidden="true">→</b><div><span>Replacement</span><strong>${escapeHtml(item.delegateName)}</strong><small>${escapeHtml(item.delegateEmail)}</small></div></div><div class="workflow-delegation-window"><span class="workflow-sla-badge is-${status === 'active' ? 'on_track' : status}">${escapeHtml(titleCaseMessage(status))}</span><strong>${escapeHtml(new Date(item.startsAt).toLocaleString())} — ${escapeHtml(new Date(item.endsAt).toLocaleString())}</strong><small>${escapeHtml(scope)} · ${escapeHtml(item.reason)}</small></div>${item.status === 'active' ? `<button type="button" class="secondary danger-link" data-cancel-workflow-delegation="${item.id}">Cancel delegation</button>` : ''}</article>`;
  }).join('') || '<div class="empty-state"><h3>No delegation schedules</h3><p>Normal workflow approvers remain in control until an optional coverage schedule is created.</p></div>';
}

async function loadWorkflowDelegations() {
  const params = new URLSearchParams({ status: state.workflowDelegationStatus, search: state.workflowDelegationSearch });
  const payload = await api(`/api/workflows/delegations?${params}`);
  state.workflowDelegations = payload.delegations || [];
  renderWorkflowDelegations();
}

function openWorkflowDelegationModal() {
  const form = $('#workflowDelegationForm'); form.reset();
  form.elements.delegatorUserId.innerHTML = workflowUserOptions();
  form.elements.delegateUserId.innerHTML = workflowUserOptions();
  form.elements.workflowKey.innerHTML = `<option value="">All workflows</option>${state.workflowDefinitions.filter((item) => item.status === 'published').map((item) => `<option value="${escapeHtml(item.workflowKey)}">${escapeHtml(item.name)}</option>`).join('')}`;
  form.elements.scopeRole.innerHTML = `<option value="">Any role</option>${[...new Set(state.users.map((user) => user.role).filter(Boolean))].sort().map((role) => `<option value="${escapeHtml(role)}">${escapeHtml(titleCaseMessage(role))}</option>`).join('')}`;
  form.elements.scopeDepartmentId.innerHTML = `<option value="">Any department</option>${state.departmentNodes.filter((node) => node.enabled !== false).map((node) => `<option value="${node.id}">${escapeHtml(node.name)}</option>`).join('')}`;
  const start = new Date(Date.now() + 3600000); const end = new Date(start.getTime() + 86400000);
  const localValue = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  form.elements.startsAt.value = localValue(start); form.elements.endsAt.value = localValue(end);
  openWorkflowModal('workflowDelegationModal', 'select');
}

async function saveWorkflowDelegation(event) {
  event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form));
  await api('/api/workflows/delegations', { method: 'POST', body: JSON.stringify({ ...values, delegatorUserId: Number(values.delegatorUserId), delegateUserId: Number(values.delegateUserId), scopeDepartmentId: values.scopeDepartmentId ? Number(values.scopeDepartmentId) : null, startsAt: new Date(values.startsAt).toISOString(), endsAt: new Date(values.endsAt).toISOString() }) });
  closeWorkflowModal('workflowDelegationModal'); await loadWorkflowDelegations(); toast('Delegation Created.');
}

async function cancelWorkflowDelegation(id) {
  const confirmed = await showConfirmationModal({ title: 'Cancel delegation', message: 'Stop this coverage schedule? Existing decisions remain in the audit history.', confirmLabel: 'Cancel delegation' });
  if (!confirmed) return; await api(`/api/workflows/delegations/${id}/cancel`, { method: 'POST', body: '{}' }); await loadWorkflowDelegations(); toast('Delegation Cancelled.');
}

function openWorkflowReassignModal(requestKey) {
  const item = state.workflowMonitoring.items.find((entry) => entry.requestKey === requestKey); if (!item) return;
  const form = $('#workflowReassignForm'); form.reset(); form.elements.requestKey.value = requestKey;
  form.elements.assignmentId.innerHTML = item.assignments.map((assignment) => `<option value="${assignment.id}">${escapeHtml(assignment.approverName)}</option>`).join('');
  form.elements.replacementUserId.innerHTML = workflowUserOptions(); openWorkflowModal('workflowReassignModal', 'select');
}

async function reassignWorkflowAssignment(event) {
  event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form));
  await api(`/api/workflows/assignments/${Number(values.assignmentId)}/reassign`, { method: 'POST', headers: { 'Idempotency-Key': workflowIdempotencyKey('reassign') }, body: JSON.stringify({ replacementUserId: Number(values.replacementUserId), reason: values.reason }) });
  closeWorkflowModal('workflowReassignModal'); await loadWorkflowMonitoring(); toast(`Approval ${values.requestKey} Reassigned.`);
}

async function openWorkflowSubmitModal(context = {}) {
  const published = state.workflowDefinitions.filter((definition) => definition.status === 'published');
  const form = $('#workflowSubmitForm');
  form.reset();
  form.elements.workflowKey.innerHTML = published.map((definition) => `<option value="${escapeHtml(definition.workflowKey)}">${escapeHtml(definition.name)} · ${escapeHtml(definition.sourceModuleKey)}</option>`).join('');
  if (!published.length) return toast('No Published Workflow Is Available. Contact An Administrator.', 'error');
  const matched = context.moduleKey ? published.find((definition) => definition.sourceModuleKey === context.moduleKey) : null;
  if (matched) form.elements.workflowKey.value = matched.workflowKey;
  form.dataset.preferredRecordId = context.recordId ? String(context.recordId) : '';
  syncWorkflowSubmitBinding();
  openWorkflowModal('workflowSubmitModal', 'select');
  await loadWorkflowSourceRecords(context.recordId || '');
}

function configureWorkflowAttachmentInput(container, policy = {}, purpose) {
  const input = container?.querySelector('input[type="file"]');
  if (!container || !input) return;
  const enabled = policy.mode && policy.mode !== 'disabled' && (!policy.actions?.length || policy.actions.includes(purpose));
  container.hidden = !enabled;
  input.required = enabled && policy.mode === 'required';
  input.accept = (policy.allowedTypes || []).join(',');
  input.value = '';
  container.querySelector('small').textContent = enabled ? `${titleCaseMessage(policy.mode)} · up to ${policy.maxFileCount || 1} file(s), ${Math.max(1, Math.round((policy.maxFileSize || 5242880) / 1048576))} MB each.` : '';
}

function workflowAttachmentFieldRules(policy = {}) {
  return {
    accept: (policy.allowedTypes || []).join(','),
    helper: `Allowed formats apply · up to ${Math.max(1, Math.round((policy.maxFileSize || 5242880) / 1048576))} MB.`
  };
}

function syncWorkflowSubmitBinding() {
  const definition = state.workflowDefinitions.find((item) => item.workflowKey === $('#workflowSubmitForm').elements.workflowKey.value);
  $('#workflowSubmitBinding').innerHTML = definition ? `<strong>${escapeHtml(definition.sourceModuleKey)}</strong><span>New request ID will begin with ${escapeHtml(definition.requestPrefix)}.</span>` : 'Choose a workflow.';
  configureWorkflowAttachmentInput($('#workflowSubmitAttachments'), definition?.submissionAttachmentPolicy, 'submission');
}

function selectWorkflowSourceRecord(recordId) {
  const form = $('#workflowSubmitForm');
  form.elements.sourceRecordId.value = String(recordId || '');
  $$('[data-workflow-source-record]').forEach((button) => {
    const selected = button.dataset.workflowSourceRecord === String(recordId);
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-selected', String(selected));
  });
}

async function loadWorkflowSourceRecords(preferredRecordId = '') {
  const form = $('#workflowSubmitForm');
  const workflowKey = form.elements.workflowKey.value;
  const search = $('#workflowSourceRecordSearch').value.trim();
  const status = $('#workflowSourceRecordStatus');
  const options = $('#workflowSourceRecordOptions');
  form.elements.sourceRecordId.value = '';
  status.textContent = 'Loading available records...';
  options.innerHTML = '';
  const payload = await api(`/api/workflows/source-records?workflowKey=${encodeURIComponent(workflowKey)}&search=${encodeURIComponent(search)}`);
  const records = payload.records || [];
  status.textContent = records.length ? `${records.length} record${records.length === 1 ? '' : 's'} available` : 'No matching records are available.';
  options.innerHTML = records.map((record) => `<button type="button" data-workflow-source-record="${escapeHtml(record.id)}" role="option" aria-selected="false"><span><strong>${escapeHtml(record.label)}</strong>${record.secondary ? `<small>${escapeHtml(record.secondary)}</small>` : ''}</span><i aria-hidden="true">✓</i></button>`).join('');
  const preferred = records.find((record) => String(record.id) === String(preferredRecordId || form.dataset.preferredRecordId));
  if (preferred) selectWorkflowSourceRecord(preferred.id);
  else if (records.length === 1) selectWorkflowSourceRecord(records[0].id);
}

async function submitWorkflowRequest(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.elements.sourceRecordId.value) return toast('Choose the record that needs approval.', 'error');
  const definition = state.workflowDefinitions.find((item) => item.workflowKey === form.elements.workflowKey.value);
  const body = new FormData(form);
  body.set('sourceModuleKey', definition.sourceModuleKey);
  const result = await api('/api/workflows/requests', {
    method: 'POST',
    headers: { 'Idempotency-Key': workflowIdempotencyKey('submit') },
    body
  });
  closeWorkflowModal('workflowSubmitModal');
  await loadWorkflowRequests();
  await openWorkflowRequest(result.request.requestKey);
  toast(`Request ${result.request.requestKey} Sent For Approval.`);
}

function openWorkflowDecision(action) {
  const form = $('#workflowDecisionForm');
  form.reset();
  form.elements.requestKey.value = state.activeWorkflowRequestKey;
  form.elements.action.value = action;
  const labels = { approve: 'Approve request', reject: 'Reject request', return: 'Return for correction' };
  $('#workflowDecisionTitle').textContent = labels[action];
  $('#workflowDecisionHelp').textContent = action === 'approve' ? 'Confirm that this request meets the required approval criteria.' : 'A clear remark is required so the requester knows what happens next.';
  $('#confirmWorkflowDecisionButton').textContent = action === 'return' ? 'Return for correction' : titleCaseMessage(action);
  form.elements.remark.required = action !== 'approve';
  configureWorkflowAttachmentInput($('#workflowDecisionAttachments'), state.activeWorkflowRequest?.attachmentPolicy, action === 'approve' ? 'approval' : action);
  const responseForm = state.activeWorkflowRequest?.responseForm;
  const attachmentRules = workflowAttachmentFieldRules(state.activeWorkflowRequest?.attachmentPolicy);
  const responsePanel = $('#workflowDecisionResponseFields');
  responsePanel.innerHTML = responseForm?.fields?.length ? `<div class="workflow-command-note"><strong>${escapeHtml(responseForm.formName || 'Approval response')}</strong><span>These answers are saved with your decision.</span></div>${responseForm.fields.map((field) => {
    const type = ['number', 'int', 'decimals'].includes(field.type) ? 'number' : field.type === 'date' ? 'date' : field.type === 'checkbox' ? 'checkbox' : field.type === 'attachment' ? 'file' : 'text';
    if (type === 'file') return `<label>${escapeHtml(field.label)}<input type="file" name="responseAttachment:${escapeHtml(field.fieldKey)}" data-workflow-response-input="${escapeHtml(field.fieldKey)}" accept="${escapeHtml(attachmentRules.accept)}" ${action === 'approve' && field.required ? 'required' : ''}><small>${escapeHtml(attachmentRules.helper)}</small></label>`;
    if (type === 'checkbox') return `<label class="checkbox-label"><input type="checkbox" data-workflow-response-input="${escapeHtml(field.fieldKey)}"> ${escapeHtml(field.label)}${field.required ? ' *' : ''}</label>`;
    if (['dropdownbox', 'select'].includes(field.type)) return `<label>${escapeHtml(field.label)}<select data-workflow-response-input="${escapeHtml(field.fieldKey)}" ${action === 'approve' && field.required ? 'required' : ''}><option value="">Choose an option</option>${(field.options || []).map((option) => { const value = typeof option === 'object' ? (option.value ?? option.label) : option; const label = typeof option === 'object' ? (option.label ?? option.value) : option; return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`; }).join('')}</select></label>`;
    if (field.type === 'textarea') return `<label>${escapeHtml(field.label)}<textarea rows="3" data-workflow-response-input="${escapeHtml(field.fieldKey)}" ${action === 'approve' && field.required ? 'required' : ''}></textarea></label>`;
    return `<label>${escapeHtml(field.label)}<input type="${type}" data-workflow-response-input="${escapeHtml(field.fieldKey)}" ${action === 'approve' && field.required ? 'required' : ''}></label>`;
  }).join('')}` : '';
  openWorkflowModal('workflowDecisionModal', responseForm?.fields?.length ? '[data-workflow-response-input]' : 'textarea');
}

async function decideWorkflowRequest(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const action = form.elements.action.value;
  const responses = Object.fromEntries([...form.querySelectorAll('[data-workflow-response-input]')].filter((input) => input.type !== 'file').map((input) => [input.dataset.workflowResponseInput, input.type === 'checkbox' ? input.checked : input.value]));
  const body = new FormData(form);
  body.set('responses', JSON.stringify(responses));
  await api(`/api/workflows/requests/${encodeURIComponent(form.elements.requestKey.value)}/decisions`, {
    method: 'POST',
    headers: { 'Idempotency-Key': workflowIdempotencyKey(action, form.elements.requestKey.value) },
    body
  });
  closeWorkflowModal('workflowDecisionModal');
  await loadWorkflowRequests();
  await openWorkflowRequest(form.elements.requestKey.value);
  toast(action === 'return' ? 'Request Returned For Correction.' : `Request ${titleCaseMessage(action)}d.`);
}

function openWorkflowLifecycle(action) {
  const form = $('#workflowLifecycleForm');
  form.reset();
  form.elements.requestKey.value = state.activeWorkflowRequestKey;
  form.elements.action.value = action;
  const content = {
    withdraw: ['Withdraw request', 'This ends the current request and preserves its complete history.', 'Withdraw'],
    resubmit: ['Resubmit amended record', 'The source record will be read again, a new snapshot created, and approval will resume from the returning stage.', 'Resubmit'],
    cancel: ['Cancel request', 'Administrative cancellation is recorded permanently and must include a reason.', 'Cancel request']
  }[action];
  $('#workflowLifecycleTitle').textContent = content[0];
  $('#workflowLifecycleHelp').textContent = content[1];
  $('#confirmWorkflowLifecycleButton').textContent = content[2];
  form.elements.remark.required = action === 'cancel';
  openWorkflowModal('workflowLifecycleModal', 'textarea');
}

async function runWorkflowLifecycle(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const action = form.elements.action.value;
  const requestKey = form.elements.requestKey.value;
  await api(`/api/workflows/requests/${encodeURIComponent(requestKey)}/${action}`, {
    method: 'POST',
    headers: { 'Idempotency-Key': workflowIdempotencyKey(action, requestKey) },
    body: JSON.stringify({ remark: form.elements.remark.value.trim() || undefined })
  });
  closeWorkflowModal('workflowLifecycleModal');
  await loadWorkflowRequests();
  await openWorkflowRequest(requestKey);
  toast(`Request ${titleCaseMessage(action)} Action Completed.`);
}

function activeDashboardSource() {
  return state.dashboardDataSources.find((source) => source.dataSourceKey === state.activeDashboardSourceKey) || null;
}

function activeDashboard() {
  return state.dashboards.find((dashboard) => dashboard.dashboardKey === state.activeDashboardKey) || null;
}

function filteredDashboards() {
  const query = state.dashboardManagementSearch.trim().toLowerCase();
  return state.dashboards.filter((dashboard) => (
    (state.dashboardStatusFilter === 'all' || dashboard.status === state.dashboardStatusFilter)
    && (!query || [dashboard.name, dashboard.dashboardKey, dashboard.description].some((value) => String(value || '').toLowerCase().includes(query)))
  ));
}

function dashboardStatusCounts() {
  return Object.fromEntries(['draft', 'published', 'archived'].map((status) => [status, state.dashboards.filter((dashboard) => dashboard.status === status).length]));
}

function renderDashboardManagement() {
  const counts = dashboardStatusCounts();
  $('#dashboardAllCount').textContent = state.dashboards.length;
  $('#dashboardDraftCount').textContent = counts.draft;
  $('#dashboardPublishedCount').textContent = counts.published;
  $('#dashboardArchivedCount').textContent = counts.archived;
  $('#dashboardSummaryTiles').innerHTML = [
    ['Total', state.dashboards.length], ['Draft', counts.draft], ['Published', counts.published], ['Archived', counts.archived]
  ].map(([label, value]) => `<div class="dashboard-summary-tile"><strong>${value}</strong><span>${label}</span></div>`).join('');
  $$('.dashboard-status-filter [data-dashboard-status]').forEach((button) => button.classList.toggle('is-active', button.dataset.dashboardStatus === state.dashboardStatusFilter));
  const rows = filteredDashboards();
  $('#dashboardManagementRows').innerHTML = rows.map((dashboard) => `
    <tr>
      <td><strong>${escapeHtml(dashboard.name)}</strong><small>${escapeHtml(dashboard.dashboardKey)}${dashboard.description ? ` · ${escapeHtml(dashboard.description)}` : ''}</small></td>
      <td><span class="status-pill status-${escapeHtml(dashboard.status)}">${escapeHtml(titleCaseMessage(dashboard.status))}</span></td>
      <td>${dashboard.widgetCount || 0}</td>
      <td>${dashboard.filterCount || 0}</td>
      <td>${dashboard.updatedAt ? escapeHtml(new Date(dashboard.updatedAt).toLocaleString()) : '—'}</td>
      <td><div class="table-action-group">
        ${dashboard.status !== 'archived' ? `<button type="button" class="link-button" data-open-dashboard="${escapeHtml(dashboard.dashboardKey)}">Open builder</button><button type="button" class="link-button" data-edit-dashboard="${escapeHtml(dashboard.dashboardKey)}">Edit</button><button type="button" class="link-button" data-duplicate-dashboard="${escapeHtml(dashboard.dashboardKey)}">Duplicate</button><button type="button" class="link-button danger-link" data-archive-dashboard="${escapeHtml(dashboard.dashboardKey)}">Archive</button>` : `<button type="button" class="link-button" data-reopen-dashboard="${escapeHtml(dashboard.dashboardKey)}">Reopen as draft</button>`}
      </div></td>
    </tr>
  `).join('') || '<tr><td colspan="6"><div class="empty-state"><h3>No dashboards in this view</h3><p>Create a dashboard or choose another lifecycle filter.</p></div></td></tr>';
}

async function loadDashboards() {
  const payload = await api('/api/dashboards');
  state.dashboards = payload.dashboards || [];
  renderDashboardManagement();
}

function showDashboardManagement() {
  if (deferBuilderLeave(['dashboard'], showDashboardManagement)) return;
  state.dashboardManagementMode = 'list';
  $('#dashboardManagement').hidden = false;
  $('#dashboardBuilderStudio').hidden = true;
}

function dashboardAccessSelected(subjectType, permission) {
  return (state.dashboardAccessDraft || [])
    .filter((rule) => rule.subjectType === subjectType && rule[permission])
    .map((rule) => String(rule.subjectKey));
}

function renderDashboardAccessRules() {
  const roles = [...new Set(['admin', 'user', ...state.users.map((user) => user.role).filter(Boolean)])].map((value) => ({ value, label: titleCaseMessage(value), search: value }));
  const users = permissionUserItems().filter((item) => state.users.some((user) => String(user.id) === item.value && user.status === 'active'));
  const departments = permissionDepartmentItems();
  const accessCard = (permission, title, description) => `
    <section class="dashboard-access-card" data-dashboard-access-permission="${escapeHtml(permission)}">
      <div class="dashboard-access-card-header"><h3>${escapeHtml(title)}</h3><small>${escapeHtml(description)}</small></div>
      <div class="dashboard-access-audiences">
        <section class="page-permission-access-column"><strong>Departments</strong>${renderPermissionPicker('departments', `dashboard_${permission}`, departments, dashboardAccessSelected('department', permission))}<small class="permission-inheritance-note">Selecting a unit includes users assigned to that unit and its descendants.</small></section>
        <section class="page-permission-access-column"><strong>Roles</strong>${renderPermissionPicker('roles', `dashboard_${permission}`, roles, dashboardAccessSelected('role', permission))}</section>
        <section class="page-permission-access-column"><strong>Specific users</strong>${renderPermissionPicker('users', `dashboard_${permission}`, users, dashboardAccessSelected('user', permission))}</section>
      </div>
    </section>`;
  $('#dashboardAccessRules').innerHTML = `${accessCard('canView', 'View access', 'Controls who can discover and open the published dashboard.')}${accessCard('canConfigure', 'Configure access', 'Controls who can change this dashboard. Administrators always retain access.')}`;
}

function openDashboardAccessDrawer() {
  state.dashboardAccessDraft = JSON.parse(JSON.stringify(state.dashboardConfiguration?.permissions || []));
  renderDashboardAccessRules();
  $('#dashboardAccessDrawer').hidden = false;
  document.body.classList.add('modal-open');
}

function closeDashboardAccessDrawer() {
  const drawer = $('#dashboardAccessDrawer');
  if (!drawer || drawer.hidden) return;
  drawer.hidden = true;
  document.body.classList.remove('modal-open');
}

function renderDashboardVersions(versions = []) {
  const list = $('#dashboardVersionList');
  if (!list) return;
  list.innerHTML = versions.map((version) => `<article class="version-timeline-card"><div class="version-timeline-heading"><div><strong>v${version.versionNumber} - ${escapeHtml(version.name || titleCaseMessage(version.action))}</strong><small>${escapeHtml(version.remark || 'No remark')}</small></div><time>${escapeHtml(new Date(version.createdAt).toLocaleString())}</time></div><div class="form-actions"><span class="status-pill">${escapeHtml(titleCaseMessage(version.action))}</span><button type="button" class="secondary" data-restore-dashboard-version="${version.id}">Restore as draft</button></div></article>`).join('') || '<div class="empty-state"><p>No checkpoints yet. Create one before making a major change.</p></div>';
}

async function loadDashboardVersions() {
  const result = await api(`/api/dashboards/${encodeURIComponent(state.activeDashboardKey)}/versions`);
  renderDashboardVersions(result.versions || []);
}

async function openDashboardLifecycleDrawer() {
  $('#dashboardLifecycleForm').reset();
  $('#dashboardVersionList').innerHTML = '<p class="muted">Loading versions...</p>';
  $('#dashboardLifecycleDrawer').hidden = false;
  document.body.classList.add('modal-open');
  await loadDashboardVersions();
}

function closeDashboardLifecycleDrawer() {
  const drawer = $('#dashboardLifecycleDrawer');
  if (!drawer || drawer.hidden) return;
  drawer.hidden = true;
  document.body.classList.remove('modal-open');
}

async function createDashboardCheckpoint(event) {
  event.preventDefault();
  if (state.dashboardLayoutDirty) await saveDashboardLayout();
  const form = event.currentTarget;
  await api(`/api/dashboards/${encodeURIComponent(state.activeDashboardKey)}/versions`, { method: 'POST', body: JSON.stringify({ name: form.elements.name.value, remark: form.elements.remark.value }) });
  form.reset();
  await loadDashboardVersions();
  toast('Dashboard Checkpoint Created.');
}

async function checkActiveDashboard() {
  if (state.dashboardLayoutDirty) await saveDashboardLayout();
  const result = await api(`/api/dashboards/${encodeURIComponent(state.activeDashboardKey)}/check`, { method: 'POST', body: '{}' });
  if (result.valid) toast('Dashboard Check Passed.');
  else toast(`Dashboard Check Failed: ${result.issues[0]?.message || 'Review the configuration.'}`, 'error');
}

function toggleDashboardPreview() {
  state.dashboardPreviewMode = !state.dashboardPreviewMode;
  $('#dashboardBuilderStudio').classList.toggle('is-previewing', state.dashboardPreviewMode);
  $('#previewDashboardButton').textContent = state.dashboardPreviewMode ? 'Exit preview' : 'Preview';
  state.selectedDashboardWidgetKey = '';
  renderDashboardCanvas();
}

async function restoreDashboardVersion(versionId) {
  const confirmed = await showConfirmationModal({ title: 'Restore dashboard version', message: 'Restore this version as the current draft? The published dashboard will remain unchanged.', confirmLabel: 'Restore as draft' });
  if (!confirmed) return;
  await api(`/api/dashboards/${encodeURIComponent(state.activeDashboardKey)}/versions/${encodeURIComponent(versionId)}/restore`, { method: 'POST', body: '{}' });
  await openDashboardBuilderStudio(state.activeDashboardKey);
  await loadDashboardVersions();
  toast('Dashboard Version Restored As Draft.');
}

async function exportDashboardConfiguration() {
  const payload = await api(`/api/dashboards/${encodeURIComponent(state.activeDashboardKey)}/export`);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  link.download = `${state.activeDashboardKey}-dashboard-v${payload.formatVersion}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function importDashboardConfiguration(file) {
  if (!file) return;
  let payload;
  try { payload = JSON.parse(await file.text()); } catch (_error) { throw new Error('Configuration file is not valid JSON'); }
  const confirmed = await showConfirmationModal({ title: 'Import dashboard configuration', message: 'Replace the current draft with this validated configuration? The published dashboard will remain unchanged.', confirmLabel: 'Import draft' });
  if (!confirmed) return;
  await api(`/api/dashboards/${encodeURIComponent(state.activeDashboardKey)}/import`, { method: 'POST', body: JSON.stringify(payload) });
  await openDashboardBuilderStudio(state.activeDashboardKey);
  await loadDashboardVersions();
  toast('Dashboard Configuration Imported.');
}

async function saveDashboardAccess(event) {
  event.preventDefault();
  const rules = new Map();
  const subjectTypes = { departments: 'department', roles: 'role', users: 'user' };
  $$('#dashboardAccessRules [data-dashboard-access-permission]').forEach((card) => {
    const permission = card.dataset.dashboardAccessPermission;
    card.querySelectorAll('[data-permission-picker]').forEach((picker) => {
      const subjectType = subjectTypes[picker.dataset.permissionPicker];
      checkedValues(picker).forEach((subjectKey) => {
        const key = `${subjectType}:${subjectKey}`;
        const rule = rules.get(key) || { subjectType, subjectKey, canView: false, canConfigure: false };
        rule[permission] = true;
        rules.set(key, rule);
      });
    });
  });
  state.dashboardAccessDraft = [...rules.values()];
  state.dashboardConfiguration.permissions = state.dashboardAccessDraft;
  state.dashboardLayoutDirty = true;
  closeDashboardAccessDrawer();
  renderDashboardCanvas();
  await saveDashboardLayout();
}

async function publishActiveDashboard() {
  if (state.dashboardLayoutDirty) await saveDashboardLayout();
  const confirmed = await showConfirmationModal({ title: 'Publish dashboard', message: 'Publish an immutable snapshot of this dashboard? Later draft edits will not change the CRM page until you publish again.', confirmLabel: 'Publish dashboard' });
  if (!confirmed) return;
  const result = await api(`/api/dashboards/${encodeURIComponent(state.activeDashboardKey)}/publish`, { method: 'POST' });
  await loadDashboards();
  await openDashboardBuilderStudio(result.dashboard.dashboardKey);
  toast(`Dashboard Published As Version ${result.version.versionNumber}.`);
}

async function loadPublishedDashboards() {
  const result = await api('/api/dashboard-pages');
  state.publishedDashboards = result.dashboards || [];
  if (state.publishedDashboards.length) {
    const rememberedKey = localStorage.getItem(`crm:last-dashboard:${state.user?.id || 'user'}`);
    const primary = state.publishedDashboards.find((dashboard) => dashboard.dashboardKey === rememberedKey) || state.publishedDashboards[0];
    await openPublishedDashboard(primary.dashboardKey);
    return;
  }
  renderPublishedDashboardList();
}

function renderPublishedDashboardList() {
  $('#publishedDashboardList').hidden = false;
  $('#publishedDashboardPage').hidden = true;
  $('#publishedDashboardNavigation').hidden = true;
  $('#publishedDashboardPageTitle').textContent = 'Dashboards';
  $('#publishedDashboardPageDescription').textContent = 'Published reporting available to your account.';
  $('#publishedDashboardPageDescription').hidden = false;
  $('#publishedDashboardList').innerHTML = state.publishedDashboards.map((dashboard) => `<button type="button" class="published-dashboard-card" data-open-published-dashboard="${escapeHtml(dashboard.dashboardKey)}"><span class="eyebrow">Published dashboard</span><strong>${escapeHtml(dashboard.name)}</strong><small>${escapeHtml(dashboard.description || dashboard.dashboardKey)}</small><em>Open dashboard &rarr;</em></button>`).join('') || '<div class="empty-state"><h3>No dashboards available</h3><p>Published dashboards appear here when a role, user, or department rule grants access.</p></div>';
}

async function loadPublishedDashboardWidget(widget, force = false) {
  if (isDashboardWorkspaceWidget(widget)) return loadDashboardWorkspaceWidget(widget, force, true);
  const parameters = dashboardWidgetParameters(widget);
  const signature = JSON.stringify({ source: widget.dataSourceKey, config: widget.config, parameters, published: state.activePublishedDashboardKey });
  if (!force && state.dashboardWidgetResults[widget.widgetKey]?.signature === signature && ['loading', 'ready', 'error'].includes(state.dashboardWidgetResults[widget.widgetKey].status)) return;
  state.dashboardWidgetResults[widget.widgetKey] = { status: 'loading', signature };
  renderPublishedDashboardCanvas();
  try {
    const result = await api(`/api/dashboard-pages/${encodeURIComponent(state.activePublishedDashboardKey)}/widgets/${encodeURIComponent(widget.widgetKey)}/execute`, { method: 'POST', body: JSON.stringify({ parameters, limit: widget.type === 'table' ? Math.min(100, dashboardWidgetConfig(widget).topN) : 500, forceRefresh: force }) });
    state.dashboardWidgetResults[widget.widgetKey] = { status: 'ready', signature, ...result };
    scheduleDashboardStaleRender(result.cache?.staleAt, true);
  } catch (error) { state.dashboardWidgetResults[widget.widgetKey] = { status: 'error', signature, message: titleCaseMessage(error.message) }; }
  renderPublishedDashboardCanvas();
}

function renderPublishedDashboardCanvas() {
  const canvas = $('#publishedDashboardCanvas');
  const widgets = state.dashboardConfiguration?.widgets || [];
  const viewport = window.innerWidth <= 720 ? 'mobile' : 'desktop';
  canvas.dataset.viewport = viewport;
  canvas.innerHTML = widgets.map((widget) => { const layout = dashboardLayout(widget, viewport); const result = state.dashboardWidgetResults[widget.widgetKey]; const refreshed = result?.cache?.refreshedAt ? new Date(result.cache.refreshedAt).toLocaleTimeString() : ''; const stale = result?.cache?.staleAt && Date.now() >= new Date(result.cache.staleAt).getTime(); const drillDown = widget.config?.drillDown?.targetKey ? `<button type="button" class="link-button" data-dashboard-drill-down="${escapeHtml(widget.widgetKey)}">Open details</button>` : ''; return `<article class="dashboard-widget-frame" data-dashboard-widget-key="${escapeHtml(widget.widgetKey)}" style="grid-column:${layout.x + 1} / span ${layout.width};grid-row:${layout.y + 1} / span ${layout.height}"><header class="dashboard-widget-frame-header"><strong>${escapeHtml(widget.title)}</strong><span><small aria-live="polite">${refreshed ? `${stale ? 'Stale' : 'Updated'} ${escapeHtml(refreshed)}${result.cache?.status === 'hit' ? ' (cached)' : ''}` : ''}</small>${drillDown}<button type="button" class="link-button" data-refresh-published-widget="${escapeHtml(widget.widgetKey)}">Refresh</button></span></header><div class="dashboard-widget-frame-body" aria-busy="${result?.status === 'loading'}">${renderDashboardWidgetResult(widget)}</div></article>`; }).join('');
  const deepest = widgets.reduce((max, widget) => Math.max(max, dashboardLayout(widget, viewport).y + dashboardLayout(widget, viewport).height), 0);
  canvas.style.height = `${Math.max(180, deepest * 88)}px`;
  activateDashboardCalendarPopover();
  widgets.forEach((widget) => loadPublishedDashboardWidget(widget).catch(() => {}));
}

function scheduleDashboardStaleRender(staleAt, published = false) {
  const delay = new Date(staleAt || 0).getTime() - Date.now();
  if (!Number.isFinite(delay) || delay <= 0) return;
  setTimeout(() => published ? renderPublishedDashboardCanvas() : renderDashboardCanvas(), delay + 50);
}

async function openDashboardWidgetDrillDown(widgetKey) {
  const result = await api(`/api/dashboard-pages/${encodeURIComponent(state.activePublishedDashboardKey)}/widgets/${encodeURIComponent(widgetKey)}/drill-down`, { method: 'POST', body: JSON.stringify({ parameters: state.dashboardFilterValues }) });
  if (result.type === 'dashboard') {
    await openPublishedDashboard(result.targetKey);
    Object.entries(result.parameters || {}).forEach(([key, value]) => { if (state.dashboardConfiguration.filters.some((filter) => filter.filterKey === key)) state.dashboardFilterValues[key] = value; });
    state.dashboardWidgetResults = {};
    renderPublishedDashboardCanvas();
    return;
  }
  await openRuntimeModulePage(result.targetKey);
}

async function openPublishedDashboard(dashboardKey) {
  const configuration = await api(`/api/dashboard-pages/${encodeURIComponent(dashboardKey)}`);
  state.activePublishedDashboardKey = dashboardKey;
  localStorage.setItem(`crm:last-dashboard:${state.user?.id || 'user'}`, dashboardKey);
  state.dashboardConfiguration = { ...configuration, widgets: normalizeDashboardWidgets(configuration.widgets) };
  state.dashboardLayoutViewport = 'desktop';
  state.dashboardWidgetResults = {};
  initializeDashboardFilterValues(configuration.filters || []);
  $('#publishedDashboardList').hidden = true;
  $('#publishedDashboardPage').hidden = false;
  $('#publishedDashboardNavigation').hidden = false;
  $('#publishedDashboardSelector').innerHTML = state.publishedDashboards.map((dashboard) => `<option value="${escapeHtml(dashboard.dashboardKey)}" ${dashboard.dashboardKey === dashboardKey ? 'selected' : ''}>${escapeHtml(dashboard.name)}</option>`).join('');
  $('#publishedDashboardPageTitle').textContent = configuration.dashboard.name;
  $('#publishedDashboardPageDescription').textContent = configuration.dashboard.description || '';
  $('#publishedDashboardPageDescription').hidden = !configuration.dashboard.description;
  const filters = configuration.filters || [];
  $('#publishedDashboardFilters').hidden = !filters.length;
  $('#publishedDashboardFilters').innerHTML = filters.map((filter) => `<div class="dashboard-filter-control"><label>${escapeHtml(filter.name)}</label>${dashboardFilterControl(filter)}</div>`).join('') + (filters.length ? '<button type="button" class="secondary" id="resetPublishedDashboardFilters">Reset filters</button>' : '');
  renderPublishedDashboardCanvas();
}

const dashboardLayoutColumns = { desktop: 12, mobile: 4 };
const dashboardWorkspaceWidgetTypes = new Set(['approval_inbox', 'todo_list', 'calendar', 'quick_actions', 'recent_records', 'notifications']);

function isDashboardWorkspaceWidget(widget) { return dashboardWorkspaceWidgetTypes.has(widget?.type); }
function dashboardWidgetTypeLabel(type) { return ({ approval_inbox: 'Approval inbox', todo_list: 'To-do list', quick_actions: 'Quick actions', recent_records: 'Recent records' }[type] || titleCaseMessage(type)); }

function dashboardLocalDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dashboardCalendarMonth(widgetKey) {
  const stored = state.dashboardCalendarMonths[widgetKey];
  const month = stored ? new Date(`${stored}T12:00:00`) : new Date();
  month.setDate(1); month.setHours(12, 0, 0, 0);
  return month;
}

function dashboardCalendarRange(widgetKey) {
  const month = dashboardCalendarMonth(widgetKey);
  const start = new Date(month);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start); end.setDate(end.getDate() + 42);
  return { start: dashboardLocalDateKey(start), end: dashboardLocalDateKey(end) };
}

function dashboardCalendarEventDateKey(item) {
  const date = new Date(item?.date);
  return Number.isNaN(date.getTime()) ? String(item?.date || '').slice(0, 10) : dashboardLocalDateKey(date);
}

async function loadDashboardWorkspaceWidget(widget, force = false, published = false) {
  const config = dashboardWidgetConfig(widget);
  const calendarMonth = widget.type === 'calendar' ? dashboardLocalDateKey(dashboardCalendarMonth(widget.widgetKey)) : '';
  const signature = JSON.stringify({ type: widget.type, config, published, user: state.user?.id, calendarMonth });
  if (!force && state.dashboardWidgetResults[widget.widgetKey]?.signature === signature && ['loading', 'ready', 'error'].includes(state.dashboardWidgetResults[widget.widgetKey].status)) return;
  state.dashboardWidgetResults[widget.widgetKey] = { status: 'loading', signature };
  published ? renderPublishedDashboardCanvas() : renderDashboardCanvas();
  try {
    let data;
    if (widget.type === 'approval_inbox') data = await api(`/api/workflows/inbox?status=${encodeURIComponent(config.status || 'pending')}&limit=${config.topN}`);
    else if (widget.type === 'todo_list') data = await api(`/api/dashboard-workspace/tasks?status=${encodeURIComponent(config.status || 'open')}&limit=${config.topN}`);
    else if (widget.type === 'calendar') { const range = dashboardCalendarRange(widget.widgetKey); data = await api(`/api/dashboard-workspace/calendar?start=${range.start}&end=${range.end}`); }
    else if (widget.type === 'notifications') data = await api(`/api/notifications?limit=${config.topN}${config.unreadOnly ? '&unread=true' : ''}`);
    else if (widget.type === 'recent_records') data = await api('/api/customers');
    else data = { actions: config.actions || ['customersView', 'workflowRequestsView', 'publishedDashboardsView'] };
    state.dashboardWidgetResults[widget.widgetKey] = { status: 'ready', signature, data, refreshedAt: new Date().toISOString() };
  } catch (error) { state.dashboardWidgetResults[widget.widgetKey] = { status: 'error', signature, message: titleCaseMessage(error.message) }; }
  published ? renderPublishedDashboardCanvas() : renderDashboardCanvas();
}

function dashboardLayout(widget, viewport = state.dashboardLayoutViewport) {
  const columns = dashboardLayoutColumns[viewport];
  const source = widget.layout?.[viewport] || widget.layout || {};
  const width = Math.max(1, Math.min(columns, Number(source.width) || (viewport === 'mobile' ? 4 : 4)));
  return {
    x: Math.max(0, Math.min(columns - width, Number(source.x) || 0)),
    y: Math.max(0, Number(source.y) || 0),
    width,
    height: Math.max(1, Math.min(20, Number(source.height) || 3))
  };
}

function normalizeDashboardWidgets(widgets = []) {
  return widgets.map((widget, index) => ({
    ...widget,
    widgetKey: widget.widgetKey || `widget_${Date.now()}_${index}`,
    type: widget.type || 'placeholder',
    title: widget.title || `Widget ${index + 1}`,
    config: widget.config || {},
    layout: {
      desktop: dashboardLayout(widget, 'desktop'),
      mobile: dashboardLayout(widget, 'mobile')
    }
  }));
}

function selectedDashboardWidget() {
  return state.dashboardConfiguration?.widgets.find((widget) => widget.widgetKey === state.selectedDashboardWidgetKey) || null;
}

function dashboardSourceColumns(source) {
  return (source?.columns || []).map((column) => column.name || column.key).filter(Boolean);
}

function dashboardSourceParameterNames(source) {
  return (source?.parameters || []).map((parameter) => typeof parameter === 'string' ? parameter : parameter.name).filter(Boolean);
}

function dashboardFilterOptions(filter) {
  return Array.isArray(filter.config?.options) ? filter.config.options : [];
}

function dashboardFilterValue(filter) {
  if (filter.type === 'current_user') return state.user?.staffId || state.user?.id || '';
  return state.dashboardFilterValues[filter.filterKey];
}

function dashboardWidgetParameters(widget) {
  const source = state.dashboardDataSources.find((item) => item.dataSourceKey === widget.dataSourceKey);
  const required = dashboardSourceParameterNames(source);
  const parameters = {};
  required.forEach((parameterName) => {
    const filter = (state.dashboardConfiguration?.filters || []).find((item) => item.config?.dataSourceKey === widget.dataSourceKey && [item.config?.parameterName, item.config?.endParameterName].includes(parameterName));
    if (!filter) return;
    const value = dashboardFilterValue(filter);
    const resolved = parameterName === filter.config.endParameterName ? value?.end : filter.type === 'date_range' ? value?.start : value;
    parameters[parameterName] = (resolved === '' || (Array.isArray(resolved) && !resolved.length)) && !filter.config?.required ? null : resolved;
  });
  return parameters;
}

function updateDashboardFilterUrl() {
  const url = new URL(window.location.href);
  (state.dashboardConfiguration?.filters || []).forEach((filter) => {
    const key = `dashboard_filter_${filter.filterKey}`;
    const value = dashboardFilterValue(filter);
    if (filter.config?.shareInUrl && value !== undefined && value !== '' && filter.type !== 'current_user') url.searchParams.set(key, JSON.stringify(value));
    else url.searchParams.delete(key);
  });
  window.history.replaceState({}, '', url);
}

function initializeDashboardFilterValues(filters = []) {
  const url = new URL(window.location.href);
  state.dashboardFilterValues = {};
  filters.forEach((filter) => {
    const shared = filter.config?.shareInUrl ? url.searchParams.get(`dashboard_filter_${filter.filterKey}`) : null;
    if (shared !== null) {
      try { state.dashboardFilterValues[filter.filterKey] = JSON.parse(shared); return; } catch (_error) { /* use configured default */ }
    }
    if (filter.type === 'date_range') state.dashboardFilterValues[filter.filterKey] = filter.config?.defaultValue || { start: '', end: '' };
    else if (filter.type === 'multi_select') state.dashboardFilterValues[filter.filterKey] = Array.isArray(filter.config?.defaultValue) ? filter.config.defaultValue : [];
    else state.dashboardFilterValues[filter.filterKey] = filter.config?.defaultValue ?? '';
  });
}

function dashboardFilterControl(filter) {
  const value = dashboardFilterValue(filter);
  const options = dashboardFilterOptions(filter);
  if (filter.type === 'date_range') return `<div class="dashboard-filter-date-range"><input type="date" aria-label="${escapeHtml(filter.name)} start" data-dashboard-filter-key="${escapeHtml(filter.filterKey)}" data-dashboard-filter-part="start" value="${escapeHtml(value?.start || '')}"><span>to</span><input type="date" aria-label="${escapeHtml(filter.name)} end" data-dashboard-filter-key="${escapeHtml(filter.filterKey)}" data-dashboard-filter-part="end" value="${escapeHtml(value?.end || '')}"></div>`;
  if (filter.type === 'dropdown') return `<select data-dashboard-filter-key="${escapeHtml(filter.filterKey)}"><option value="">All</option>${options.map((option) => `<option value="${escapeHtml(option.value)}" ${option.value === value ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}</select>`;
  if (filter.type === 'multi_select') return `<select multiple size="${Math.min(4, Math.max(2, options.length))}" data-dashboard-filter-key="${escapeHtml(filter.filterKey)}">${options.map((option) => `<option value="${escapeHtml(option.value)}" ${(value || []).includes(option.value) ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}</select>`;
  if (filter.type === 'organization_unit') return `<select data-dashboard-filter-key="${escapeHtml(filter.filterKey)}"><option value="">All departments</option>${state.departmentNodes.filter((node) => node.enabled !== false).map((node) => `<option value="${node.id}" ${String(node.id) === String(value) ? 'selected' : ''}>${escapeHtml(node.name)}</option>`).join('')}</select>`;
  if (filter.type === 'current_user') return `<span class="dashboard-filter-readonly">${escapeHtml(state.user?.name || 'Current user')}</span>`;
  return `<input type="search" data-dashboard-filter-key="${escapeHtml(filter.filterKey)}" value="${escapeHtml(value || '')}" placeholder="Search value">`;
}

function renderDashboardFilterBar() {
  const bar = $('#dashboardFilterBar');
  if (!bar || !state.dashboardConfiguration) return;
  const filters = state.dashboardConfiguration.filters || [];
  bar.hidden = !filters.length;
  bar.innerHTML = filters.map((filter) => `<div class="dashboard-filter-control"><div><label>${escapeHtml(filter.name)}${filter.config?.required ? ' *' : ''}</label><button type="button" class="link-button" data-edit-dashboard-filter="${escapeHtml(filter.filterKey)}">Edit</button></div>${dashboardFilterControl(filter)}</div>`).join('') + (filters.length ? '<button type="button" class="secondary dashboard-filter-reset" id="resetDashboardFiltersButton">Reset filters</button>' : '');
}

function refreshWidgetsForDashboardFilter(filter) {
  state.dashboardConfiguration.widgets.filter((widget) => widget.dataSourceKey === filter.config?.dataSourceKey).forEach((widget) => {
    delete state.dashboardWidgetResults[widget.widgetKey];
  });
  updateDashboardFilterUrl();
  renderDashboardCanvas();
}

function dashboardWidgetConfig(widget) {
  const config = widget.config || {};
  return { mappings: config.mappings || {}, aggregation: config.aggregation || 'sum', topN: Math.max(1, Math.min(100, Number(config.topN) || 10)), numberFormat: config.numberFormat || 'number', dateFormat: config.dateFormat || 'medium', color: config.color || '#6d50df', showLegend: config.showLegend !== false, showSubtotals: config.showSubtotals !== false, showGrandTotals: config.showGrandTotals !== false, sortDirection: config.sortDirection || 'desc', emptyLabel: config.emptyLabel || '(empty)', refreshSeconds: Number(config.refreshSeconds) || 0, ...config };
}

function formatDashboardValue(value, format = 'number') {
  const number = Number(value);
  if (!Number.isFinite(number)) return value ?? 'â€”';
  if (format === 'currency') return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'MYR', maximumFractionDigits: 2 }).format(number);
  if (format === 'percentage') return new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 }).format(number / 100);
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(number);
}

function formatDashboardDimension(value, format = 'medium', empty = '(empty)') {
  if (value === null || value === undefined || value === '') return empty;
  const text = String(value);
  if (!/^\d{4}-\d{2}-\d{2}/.test(text)) return text;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return new Intl.DateTimeFormat(undefined, format === 'month' ? { month: 'short', year: 'numeric' } : format === 'year' ? { year: 'numeric' } : { dateStyle: format === 'long' ? 'long' : 'medium' }).format(date);
}

function aggregateDashboardRows(rows, labelKey, valueKey, aggregation) {
  const groups = new Map();
  rows.forEach((row) => {
    const label = labelKey ? String(row[labelKey] ?? 'Empty') : 'Total';
    const value = Number(row[valueKey]);
    const current = groups.get(label) || [];
    if (Number.isFinite(value)) current.push(value);
    else if (aggregation === 'count') current.push(1);
    groups.set(label, current);
  });
  return [...groups].map(([label, values]) => ({ label, value: aggregation === 'count' ? values.length : aggregation === 'average' ? values.reduce((a, b) => a + b, 0) / (values.length || 1) : aggregation === 'minimum' ? Math.min(...values) : aggregation === 'maximum' ? Math.max(...values) : values.reduce((a, b) => a + b, 0) }));
}

function aggregateDashboardValues(values, aggregation) {
  const numeric = values.map(Number).filter(Number.isFinite);
  if (aggregation === 'count') return values.length;
  if (!numeric.length) return 0;
  if (aggregation === 'average') return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
  if (aggregation === 'minimum') return Math.min(...numeric);
  if (aggregation === 'maximum') return Math.max(...numeric);
  return numeric.reduce((sum, value) => sum + value, 0);
}

function buildDashboardPivot(widget, rows) {
  const config = dashboardWidgetConfig(widget);
  const mappings = config.mappings || {};
  const rowFields = mappings.pivotRows || [];
  const columnFields = mappings.pivotColumns || [];
  const valueFields = mappings.pivotValues || [];
  if (!rowFields.length || !valueFields.length) return { error: 'Choose at least one row field and one value field.' };
  const empty = config.emptyLabel || '(empty)';
  const labelFor = (row, fields) => fields.map((field) => formatDashboardDimension(row[field], config.dateFormat, empty));
  const columnKeys = [...new Set(rows.map((row) => labelFor(row, columnFields).join(' / ') || 'Value'))].sort((a, b) => a.localeCompare(b));
  if (columnKeys.length * valueFields.length > 100) return { error: 'This pivot would create more than 100 value columns. Reduce the source or column fields.' };
  const rowMap = new Map();
  rows.forEach((row) => {
    const labels = labelFor(row, rowFields);
    const rowKey = labels.join(' / ');
    const columnKey = labelFor(row, columnFields).join(' / ') || 'Value';
    if (!rowMap.has(rowKey)) rowMap.set(rowKey, { labels, cells: new Map(), raw: [] });
    const target = rowMap.get(rowKey); target.raw.push(row);
    valueFields.forEach((field) => {
      const key = `${columnKey}\u001f${field}`;
      if (!target.cells.has(key)) target.cells.set(key, []);
      target.cells.get(key).push(row[field]);
    });
  });
  let pivotRows = [...rowMap.entries()].map(([key, entry]) => ({ key, ...entry }));
  const rowTotal = (entry) => valueFields.reduce((sum, field) => sum + aggregateDashboardValues(entry.raw.map((row) => row[field]), config.aggregation), 0);
  pivotRows.sort((a, b) => config.sortDirection === 'asc' ? rowTotal(a) - rowTotal(b) : rowTotal(b) - rowTotal(a));
  pivotRows = pivotRows.slice(0, config.topN);
  return { config, rowFields, columnFields, valueFields, columnKeys, rows: pivotRows, rowTotal, allRows: rows };
}

function renderDashboardPivot(widget, rows) {
  const pivot = buildDashboardPivot(widget, rows);
  if (pivot.error) return `<div class="dashboard-widget-message is-error"><strong>Invalid pivot mapping</strong><span>${escapeHtml(pivot.error)}</span></div>`;
  const { config, rowFields, valueFields, columnKeys } = pivot;
  const collapsed = new Set(config.collapsedRows || []);
  const headers = columnKeys.flatMap((column) => valueFields.map((field) => ({ column, field })));
  let previousGroup = null;
  const body = [];
  pivot.rows.forEach((entry) => {
    const group = entry.labels[0];
    if (group !== previousGroup) {
      const groupRows = pivot.rows.filter((row) => row.labels[0] === group);
      const canCollapse = rowFields.length > 1;
      body.push(`<tr class="dashboard-pivot-group"><th colspan="${headers.length + 2}">${canCollapse ? `<button type="button" data-dashboard-pivot-toggle="${escapeHtml(group)}" aria-expanded="${!collapsed.has(group)}">${collapsed.has(group) ? '+' : 'âˆ’'}</button>` : ''}${escapeHtml(group)} <small>${groupRows.length} combination${groupRows.length === 1 ? '' : 's'}</small></th></tr>`);
      previousGroup = group;
    }
    if (collapsed.has(group) && rowFields.length > 1) return;
    const cells = headers.map(({ column, field }) => aggregateDashboardValues(entry.cells.get(`${column}\u001f${field}`) || [], config.aggregation));
    body.push(`<tr><th>${escapeHtml(entry.labels.slice(rowFields.length > 1 ? 1 : 0).join(' / ') || entry.labels[0])}</th>${cells.map((value) => `<td>${escapeHtml(formatDashboardValue(value, config.numberFormat))}</td>`).join('')}${config.showGrandTotals ? `<td class="is-total">${escapeHtml(formatDashboardValue(pivot.rowTotal(entry), config.numberFormat))}</td>` : ''}</tr>`);
    if (config.showSubtotals && rowFields.length > 1) {
      const next = pivot.rows[pivot.rows.indexOf(entry) + 1];
      if (!next || next.labels[0] !== group) {
        const groupRows = pivot.rows.filter((row) => row.labels[0] === group);
        body.push(`<tr class="dashboard-pivot-subtotal"><th>${escapeHtml(group)} subtotal</th>${headers.map(({ column, field }) => `<td>${escapeHtml(formatDashboardValue(aggregateDashboardValues(groupRows.flatMap((row) => row.cells.get(`${column}\u001f${field}`) || []), config.aggregation), config.numberFormat))}</td>`).join('')}${config.showGrandTotals ? `<td class="is-total">${escapeHtml(formatDashboardValue(groupRows.reduce((sum, row) => sum + pivot.rowTotal(row), 0), config.numberFormat))}</td>` : ''}</tr>`);
      }
    }
  });
  const grand = config.showGrandTotals ? `<tfoot><tr><th>Grand total</th>${headers.map(({ column, field }) => `<td>${escapeHtml(formatDashboardValue(aggregateDashboardValues(pivot.rows.flatMap((row) => row.cells.get(`${column}\u001f${field}`) || []), config.aggregation), config.numberFormat))}</td>`).join('')}<td>${escapeHtml(formatDashboardValue(valueFields.reduce((sum, field) => sum + aggregateDashboardValues(rows.map((row) => row[field]), config.aggregation), 0), config.numberFormat))}</td></tr></tfoot>` : '';
  return `<div class="dashboard-widget-table dashboard-pivot-table"><table><thead><tr><th>${escapeHtml(rowFields.join(' / '))}</th>${headers.map(({ column, field }) => `<th>${escapeHtml(column)}<small>${escapeHtml(field)} - ${escapeHtml(config.aggregation)}</small></th>`).join('')}${config.showGrandTotals ? '<th>Row total</th>' : ''}</tr></thead><tbody>${body.join('')}</tbody>${grand}</table></div>`;
}

function renderDashboardWorkspaceWidget(widget, result) {
  if (!result || result.status === 'loading') return '<div class="dashboard-widget-message is-loading"><strong>Loading...</strong><span>Refreshing your workspace.</span></div>';
  if (result.status === 'error') return `<div class="dashboard-widget-message is-error"><strong>Unable to load</strong><span>${escapeHtml(result.message)}</span></div>`;
  const data = result.data || {};
  const config = dashboardWidgetConfig(widget);
  if (widget.type === 'approval_inbox') {
    const items = data.assignments || data.inbox || [];
    return `<div class="dashboard-work-list"><div class="dashboard-widget-tabs"><span class="is-active">${escapeHtml(titleCaseMessage(config.status || 'pending'))}</span><em>${items.length}</em></div>${items.slice(0, config.topN).map((item) => `<button type="button" data-dashboard-request="${escapeHtml(item.requestKey)}"><span><strong>${escapeHtml(item.requestKey)}</strong><small>${escapeHtml(item.stageName || item.stageKey || 'Approval')}</small></span><time>${item.dueAt ? `Due ${escapeHtml(new Date(item.dueAt).toLocaleDateString())}` : 'No due date'}</time></button>`).join('') || '<p class="dashboard-work-empty">No approval requests in this tab.</p>'}</div>`;
  }
  if (widget.type === 'todo_list') {
    const items = data.tasks || [];
    return `<div class="dashboard-work-list"><form class="dashboard-task-add" data-dashboard-task-form><input name="title" maxlength="190" placeholder="Add a task..." required><button type="submit">Add</button></form>${items.slice(0, config.topN).map((item) => `<label class="dashboard-task-row"><input type="checkbox" data-dashboard-task-id="${item.id}" ${item.status === 'completed' ? 'checked' : ''}><span><strong>${escapeHtml(item.title)}</strong><small>${item.dueAt ? escapeHtml(new Date(item.dueAt).toLocaleDateString()) : 'No due date'} · ${escapeHtml(titleCaseMessage(item.priority))}</small></span></label>`).join('') || '<p class="dashboard-work-empty">No tasks yet. Add your first one above.</p>'}</div>`;
  }
  if (widget.type === 'calendar') {
    const events = data.events || [];
    const month = dashboardCalendarMonth(widget.widgetKey);
    const range = dashboardCalendarRange(widget.widgetKey);
    const firstDate = new Date(`${range.start}T12:00:00`);
    const todayKey = dashboardLocalDateKey(new Date());
    const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(month);
    const eventsByDate = events.reduce((groups, item) => {
      const key = dashboardCalendarEventDateKey(item);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {});
    const cells = Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstDate); date.setDate(firstDate.getDate() + index);
      const dateKey = dashboardLocalDateKey(date);
      const items = eventsByDate[dateKey] || [];
      const currentMonth = date.getMonth() === month.getMonth();
      const accessibleLabel = `${date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}${items.length ? `, ${items.length} scheduled item${items.length === 1 ? '' : 's'}` : ''}`;
      const preview = items.length ? `<span class="dashboard-calendar-tooltip" role="tooltip"><strong>${escapeHtml(date.toLocaleDateString(undefined, { day: 'numeric', month: 'long' }))} · ${items.length} item${items.length === 1 ? '' : 's'}</strong>${items.slice(0, 3).map((item) => `<span><i class="is-${escapeHtml(item.type)}"></i>${escapeHtml(item.title)}</span>`).join('')}${items.length > 3 ? `<small>+${items.length - 3} more</small>` : ''}</span>` : '';
      const dots = [...new Set(items.map((item) => dateKey < todayKey ? 'overdue' : item.type))].slice(0, 3).map((type) => `<i class="is-${escapeHtml(type)}"></i>`).join('');
      return `<button type="button" class="dashboard-calendar-day${currentMonth ? '' : ' is-adjacent'}${dateKey === todayKey ? ' is-today' : ''}${items.length ? ' has-events' : ''}" data-dashboard-calendar-date="${dateKey}" aria-label="${escapeHtml(accessibleLabel)}" aria-haspopup="${items.length ? 'dialog' : 'false'}"><span>${date.getDate()}</span>${dots ? `<em>${dots}</em>` : ''}${preview}</button>`;
    }).join('');
    const open = state.dashboardCalendarOpen?.widgetKey === widget.widgetKey ? state.dashboardCalendarOpen : null;
    const selectedItems = open ? (eventsByDate[open.date] || []) : [];
    const popover = open && selectedItems.length ? `<section class="dashboard-calendar-popover" role="dialog" aria-modal="false" aria-label="Scheduled items for ${escapeHtml(open.date)}"><header><span><strong>${escapeHtml(new Date(`${open.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }))}</strong><small>${selectedItems.length} scheduled item${selectedItems.length === 1 ? '' : 's'}</small></span><button type="button" class="dashboard-calendar-close" data-dashboard-calendar-close aria-label="Close calendar details">×</button></header><div>${selectedItems.map((item) => item.requestKey ? `<button type="button" class="dashboard-calendar-event is-approval" data-dashboard-request="${escapeHtml(item.requestKey)}"><span><i></i><strong>${escapeHtml(item.title)}</strong><small>Approval · ${escapeHtml(item.requestKey)}</small></span><b>Open</b></button>` : `<label class="dashboard-calendar-event is-task"><input type="checkbox" data-dashboard-task-id="${escapeHtml(String(item.id).replace(/^task-/, ''))}" ${item.status === 'completed' ? 'checked' : ''}><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(titleCaseMessage(item.priority || 'normal'))} priority</small></span></label>`).join('')}</div></section>` : '';
    return `<div class="dashboard-calendar"><header class="dashboard-calendar-toolbar"><strong>${escapeHtml(monthLabel)}</strong><span><button type="button" class="secondary" data-dashboard-calendar-today>Today</button><button type="button" class="secondary" data-dashboard-calendar-shift="-1" aria-label="Previous month">‹</button><button type="button" class="secondary" data-dashboard-calendar-shift="1" aria-label="Next month">›</button></span></header><div class="dashboard-calendar-weekdays" aria-hidden="true">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => `<span>${day}</span>`).join('')}</div><div class="dashboard-calendar-grid">${cells}</div><footer><span><i class="is-approval"></i>Approval</span><span><i class="is-task"></i>Task</span><span><i class="is-overdue"></i>Overdue</span></footer>${popover}</div>`;
  }
  if (widget.type === 'quick_actions') {
    const labels = { customersView: 'Customers', workflowRequestsView: 'Approval requests', publishedDashboardsView: 'Dashboards', adminView: 'Admin Portal' };
    return `<div class="dashboard-quick-actions">${(data.actions || []).filter((key) => key !== 'adminView' || state.user?.role === 'admin').map((key) => `<button type="button" class="secondary" data-dashboard-view="${escapeHtml(key)}"><span>+</span>${escapeHtml(labels[key] || titleCaseMessage(key.replace(/View$/, '')))}</button>`).join('')}</div>`;
  }
  if (widget.type === 'recent_records') {
    const items = data.customers || [];
    return `<div class="dashboard-work-list">${items.slice(0, config.topN).map((item) => `<button type="button" data-dashboard-view="customersView"><span><strong>${escapeHtml(item.companyName || item.name || `Customer ${item.id}`)}</strong><small>${escapeHtml(item.contactPerson || item.email || '')}</small></span><em class="status-pill">${escapeHtml(titleCaseMessage(item.status || 'active'))}</em></button>`).join('') || '<p class="dashboard-work-empty">No recent records available.</p>'}</div>`;
  }
  const items = data.notifications || [];
  return `<div class="dashboard-work-list">${items.slice(0, config.topN).map((item) => `<button type="button" ${item.requestKey ? `data-dashboard-request="${escapeHtml(item.requestKey)}"` : ''}><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.message)}</small></span>${item.read ? '' : '<i class="dashboard-unread-dot"></i>'}</button>`).join('') || '<p class="dashboard-work-empty">You are all caught up.</p>'}</div>`;
}

function activateDashboardCalendarPopover() {
  const open = state.dashboardCalendarOpen;
  if (!open) return;
  requestAnimationFrame(() => {
    const popover = $('.dashboard-calendar-popover');
    const widget = $(`[data-dashboard-widget-key="${CSS.escape(open.widgetKey)}"]`);
    const trigger = widget?.querySelector(`[data-dashboard-calendar-date="${CSS.escape(open.date)}"]`);
    const calendar = popover?.closest('.dashboard-calendar');
    if (!popover || !trigger || !calendar) return;
    popover.classList.add('anchored-popover');
    popover.dataset.surfaceKind = 'parallel';
    popover.dataset.floatingState = 'closed';
    const triggerBounds = trigger.getBoundingClientRect();
    const calendarBounds = calendar.getBoundingClientRect();
    const width = Math.min(310, Math.max(220, calendarBounds.width - 8));
    const desiredLeft = triggerBounds.left - calendarBounds.left + (triggerBounds.width / 2) - (width / 2);
    const left = Math.max(4, Math.min(desiredLeft, calendarBounds.width - width - 4));
    popover.style.setProperty('--popover-left', `${Math.round(left)}px`);
    popover.style.setProperty('--popover-top', `${Math.round(triggerBounds.bottom - calendarBounds.top + 8)}px`);
    positionAnchoredSurface(popover, trigger, calendar);
    requestAnimationFrame(() => { popover.dataset.floatingState = 'open'; });
  });
}

function closeDashboardCalendarPopover(render) {
  const popover = $('.dashboard-calendar-popover');
  if (!popover || prefersReducedMotion()) {
    state.dashboardCalendarOpen = null;
    render();
    return;
  }
  setFloatingSurfaceOpen(popover, null, false, { onClosed: () => {
    state.dashboardCalendarOpen = null;
    render();
  } });
}

function renderDashboardWidgetResult(widget) {
  const result = state.dashboardWidgetResults[widget.widgetKey];
  if (isDashboardWorkspaceWidget(widget)) return renderDashboardWorkspaceWidget(widget, result);
  if (!widget.dataSourceKey) return '<div class="dashboard-widget-message"><strong>Choose Dashboard Data</strong><span>Connect this widget in the settings panel.</span></div>';
  if (!result || result.status === 'loading') return '<div class="dashboard-widget-message is-loading"><strong>Loading dataâ€¦</strong><span>Running the bounded saved source.</span></div>';
  if (result.status === 'error') return `<div class="dashboard-widget-message is-error"><strong>Query failed</strong><span>${escapeHtml(result.message)}</span></div>`;
  const rows = result.rows || [];
  if (!rows.length) return '<div class="dashboard-widget-message"><strong>No results</strong><span>The data source returned no rows.</span></div>';
  const config = dashboardWidgetConfig(widget);
  if (widget.type === 'pivot') return renderDashboardPivot(widget, rows);
  const { label, value, date, tableFields = [] } = config.mappings;
  if (widget.type === 'table') {
    const fields = tableFields.length ? tableFields : Object.keys(rows[0]).slice(0, 6);
    const pageSize = Math.min(25, config.topN);
    const page = Math.max(0, Math.min(Number(config.tablePage) || 0, Math.ceil(rows.length / pageSize) - 1));
    const visible = rows.slice(page * pageSize, page * pageSize + pageSize);
    return `<div class="dashboard-widget-table"><table><thead><tr>${fields.map((field) => `<th>${escapeHtml(field)}</th>`).join('')}</tr></thead><tbody>${visible.map((row) => `<tr>${fields.map((field) => `<td>${escapeHtml(row[field] ?? 'â€”')}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="dashboard-widget-table-pager"><button type="button" class="secondary" data-dashboard-table-page="${page - 1}" ${page <= 0 ? 'disabled' : ''}>Previous</button><span>${page + 1} / ${Math.max(1, Math.ceil(rows.length / pageSize))}</span><button type="button" class="secondary" data-dashboard-table-page="${page + 1}" ${page >= Math.ceil(rows.length / pageSize) - 1 ? 'disabled' : ''}>Next</button></div></div>`;
  }
  const valueKey = value || Object.keys(rows[0]).find((key) => Number.isFinite(Number(rows[0][key])));
  if (!valueKey) return '<div class="dashboard-widget-message is-error"><strong>Invalid mapping</strong><span>Choose a numeric value column.</span></div>';
  if (widget.type === 'number') {
    const items = aggregateDashboardRows(rows, '', valueKey, config.aggregation);
    return `<div class="dashboard-kpi"><strong>${escapeHtml(formatDashboardValue(items[0]?.value || 0, config.numberFormat))}</strong><span>${escapeHtml(config.aggregation)} of ${escapeHtml(valueKey)}</span></div>`;
  }
  const labelKey = widget.type === 'line' ? (date || label) : label;
  if (!labelKey) return '<div class="dashboard-widget-message is-error"><strong>Invalid mapping</strong><span>Choose a label or date column.</span></div>';
  const items = aggregateDashboardRows(rows, labelKey, valueKey, config.aggregation).sort((a, b) => widget.type === 'line' ? String(a.label).localeCompare(String(b.label)) : b.value - a.value).slice(0, config.topN);
  const max = Math.max(...items.map((item) => Math.abs(item.value)), 1);
  if (widget.type === 'bar') return `<div class="dashboard-bar-chart">${items.map((item) => `<div><label title="${escapeHtml(item.label)}">${escapeHtml(item.label)}</label><span><i style="width:${Math.max(2, Math.abs(item.value) / max * 100)}%;background:${escapeHtml(config.color)}"></i></span><b>${escapeHtml(formatDashboardValue(item.value, config.numberFormat))}</b></div>`).join('')}</div>`;
  if (widget.type === 'donut') {
    const total = items.reduce((sum, item) => sum + Math.max(0, item.value), 0) || 1;
    let offset = 0;
    const colors = [config.color, '#2da6a6', '#f39a2e', '#d7678a', '#7c8799'];
    const stops = items.map((item, index) => { const start = offset; offset += Math.max(0, item.value) / total * 100; return `${colors[index % colors.length]} ${start}% ${offset}%`; });
    return `<div class="dashboard-donut"><div class="dashboard-donut-ring" style="background:conic-gradient(${stops.join(',')})"><span>${items.length}</span></div>${config.showLegend ? `<div class="dashboard-chart-legend">${items.map((item, index) => `<span><i style="background:${colors[index % colors.length]}"></i>${escapeHtml(item.label)}</span>`).join('')}</div>` : ''}</div>`;
  }
  const points = items.map((item, index) => `${items.length === 1 ? 50 : index / (items.length - 1) * 100},${92 - Math.max(0, item.value) / max * 82}`).join(' ');
  return `<div class="dashboard-line-chart"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Line chart"><polyline points="${points}" fill="none" stroke="${escapeHtml(config.color)}" stroke-width="3" vector-effect="non-scaling-stroke"></polyline></svg><div>${items.map((item) => `<span>${escapeHtml(item.label)}</span>`).join('')}</div></div>`;
}

async function loadDashboardWidgetPreview(widgetKey, force = false) {
  const widget = state.dashboardConfiguration?.widgets.find((item) => item.widgetKey === widgetKey);
  if (isDashboardWorkspaceWidget(widget)) return loadDashboardWorkspaceWidget(widget, force, false);
  if (!widget?.dataSourceKey) return;
  const parameters = dashboardWidgetParameters(widget);
  const source = state.dashboardDataSources.find((item) => item.dataSourceKey === widget.dataSourceKey);
  const missing = dashboardSourceParameterNames(source).find((name) => parameters[name] === undefined || parameters[name] === '' || (Array.isArray(parameters[name]) && !parameters[name].length));
  const signature = JSON.stringify({ source: widget.dataSourceKey, config: widget.config, parameters });
  if (missing) {
    state.dashboardWidgetResults[widgetKey] = { status: 'error', signature, message: `Set the dashboard filter mapped to ${missing}.` };
    renderDashboardCanvas();
    return;
  }
  if (!force && state.dashboardWidgetResults[widgetKey]?.signature === signature && ['loading', 'ready', 'error'].includes(state.dashboardWidgetResults[widgetKey]?.status)) return;
  state.dashboardWidgetResults[widgetKey] = { status: 'loading', signature };
  renderDashboardCanvas();
  try {
    const config = dashboardWidgetConfig(widget);
    const result = await api(`/api/dashboards/data-sources/${encodeURIComponent(widget.dataSourceKey)}/execute`, { method: 'POST', body: JSON.stringify({ parameters, limit: widget.type === 'table' ? Math.min(100, config.topN) : 500, forceRefresh: force, dashboardKey: state.activeDashboardKey, widgetKey }) });
    state.dashboardWidgetResults[widgetKey] = { status: 'ready', signature, ...result };
    scheduleDashboardStaleRender(result.cache?.staleAt);
  } catch (error) {
    state.dashboardWidgetResults[widgetKey] = { status: 'error', signature, message: titleCaseMessage(error.message) };
  }
  renderDashboardCanvas();
}

function dashboardLayoutSnapshot() {
  return JSON.stringify(state.dashboardConfiguration?.widgets || []);
}

function markDashboardLayoutChanged(previousSnapshot) {
  const current = dashboardLayoutSnapshot();
  if (previousSnapshot && previousSnapshot !== current) {
    state.dashboardLayoutHistory.push(previousSnapshot);
    state.dashboardLayoutHistory = state.dashboardLayoutHistory.slice(-50);
    state.dashboardLayoutFuture = [];
  }
  state.dashboardLayoutDirty = true;
  renderDashboardCanvas();
}

function dashboardLayoutsOverlap(candidate, other) {
  return candidate.x < other.x + other.width && candidate.x + candidate.width > other.x
    && candidate.y < other.y + other.height && candidate.y + candidate.height > other.y;
}

function canPlaceDashboardWidget(widgetKey, layout) {
  return !state.dashboardConfiguration.widgets.some((widget) => widget.widgetKey !== widgetKey
    && dashboardLayoutsOverlap(layout, dashboardLayout(widget)));
}

function updateSelectedDashboardLayout(changes, record = true) {
  const widget = selectedDashboardWidget();
  if (!widget) return false;
  const previous = dashboardLayoutSnapshot();
  const columns = dashboardLayoutColumns[state.dashboardLayoutViewport];
  const current = dashboardLayout(widget);
  const width = Math.max(1, Math.min(columns, Number(changes.width ?? current.width)));
  const candidate = {
    x: Math.max(0, Math.min(columns - width, Number(changes.x ?? current.x))),
    y: Math.max(0, Number(changes.y ?? current.y)),
    width,
    height: Math.max(1, Math.min(20, Number(changes.height ?? current.height)))
  };
  if (!canPlaceDashboardWidget(widget.widgetKey, candidate)) return false;
  widget.layout[state.dashboardLayoutViewport] = candidate;
  if (record) markDashboardLayoutChanged(previous); else renderDashboardCanvas();
  return true;
}

function syncDashboardCanvasExtent() {
  const canvas = $('#dashboardCanvas');
  if (!canvas || !state.dashboardConfiguration) return;
  const widgets = state.dashboardConfiguration.widgets || [];
  const deepestRow = widgets.reduce((maximum, widget) => {
    const layout = dashboardLayout(widget);
    return Math.max(maximum, layout.y + layout.height);
  }, 0);
  const stageHeight = Math.max(0, canvas.parentElement?.clientHeight - 48 || 0);
  const contentHeight = (deepestRow + 3) * 88 + 20;
  canvas.style.minHeight = `${Math.max(720, stageHeight, contentHeight)}px`;
  canvas.dataset.rows = String(Math.max(8, deepestRow + 3));
}

function renderDashboardCanvas() {
  const canvas = $('#dashboardCanvas');
  if (!canvas || !state.dashboardConfiguration) return;
  const widgets = state.dashboardConfiguration.widgets;
  renderDashboardFilterBar();
  canvas.dataset.viewport = state.dashboardLayoutViewport;
  canvas.innerHTML = widgets.map((widget) => {
    const layout = dashboardLayout(widget);
    return `<article class="dashboard-widget-frame ${widget.widgetKey === state.selectedDashboardWidgetKey ? 'is-selected' : ''}" data-dashboard-widget-key="${escapeHtml(widget.widgetKey)}" tabindex="0" style="grid-column:${layout.x + 1} / span ${layout.width};grid-row:${layout.y + 1} / span ${layout.height}"><header class="dashboard-widget-frame-header"><span class="dashboard-widget-grip" aria-hidden="true">&#8942;&#8942;</span><strong>${escapeHtml(widget.title)}</strong><code>${escapeHtml(dashboardWidgetTypeLabel(widget.type))} &middot; ${layout.width} &times; ${layout.height}</code></header><div class="dashboard-widget-frame-body">${renderDashboardWidgetResult(widget)}</div><button type="button" class="dashboard-widget-resize-handle" aria-label="Resize ${escapeHtml(widget.title)}"></button></article>`;
  }).join('');
  activateDashboardCalendarPopover();
  syncDashboardCanvasExtent();
  $('#dashboardCanvasEmpty').hidden = widgets.length > 0;
  $('#dashboardStudioSaveState').textContent = state.dashboardLayoutDirty ? 'Unsaved changes' : 'Saved';
  $('#dashboardStudioSaveState').className = `dashboard-save-state${state.dashboardLayoutDirty ? ' is-dirty' : ''}`;
  $('#undoDashboardLayoutButton').disabled = !state.dashboardLayoutHistory.length;
  $('#redoDashboardLayoutButton').disabled = !state.dashboardLayoutFuture.length;
  $$('[data-dashboard-viewport]').forEach((button) => button.classList.toggle('is-active', button.dataset.dashboardViewport === state.dashboardLayoutViewport));
  const selected = selectedDashboardWidget();
  $('#dashboardWidgetInspectorEmpty').hidden = Boolean(selected);
  $('#dashboardWidgetInspectorForm').hidden = !selected;
  if (selected) {
    const layout = dashboardLayout(selected);
    $('#dashboardSelectedWidgetKey').textContent = selected.widgetKey;
    $('#dashboardWidgetTitle').value = selected.title;
    $('#dashboardWidgetWidth').value = layout.width;
    $('#dashboardWidgetWidth').max = dashboardLayoutColumns[state.dashboardLayoutViewport];
    $('#dashboardWidgetHeight').value = layout.height;
    renderDashboardWidgetInspector(selected);
  }
  widgets.filter((widget) => widget.dataSourceKey || isDashboardWorkspaceWidget(widget)).forEach((widget) => loadDashboardWidgetPreview(widget.widgetKey).catch(() => {}));
}

function dashboardColumnOptions(columns, selected = '', allowEmpty = true) {
  return `${allowEmpty ? '<option value="">Choose a column</option>' : ''}${columns.map((column) => `<option value="${escapeHtml(column)}" ${column === selected ? 'selected' : ''}>${escapeHtml(column)}</option>`).join('')}`;
}

function renderDashboardWidgetInspector(widget) {
  const source = state.dashboardDataSources.find((item) => item.dataSourceKey === widget.dataSourceKey);
  const columns = dashboardSourceColumns(source);
  const config = dashboardWidgetConfig(widget);
  const mappings = config.mappings;
  $('#dashboardWidgetType').value = ['number', 'donut', 'bar', 'line', 'table', 'pivot', ...dashboardWorkspaceWidgetTypes].includes(widget.type) ? widget.type : 'number';
  $('#dashboardWidgetDataSource').innerHTML = `<option value="">Choose a data source</option>${state.dashboardDataSources.filter((item) => !item.archived).map((item) => `<option value="${escapeHtml(item.dataSourceKey)}" ${item.dataSourceKey === widget.dataSourceKey ? 'selected' : ''}>${escapeHtml(item.name)} - ${escapeHtml(item.dataSourceKey)}</option>`).join('')}`;
  $('#dashboardWidgetDataSourceField').hidden = isDashboardWorkspaceWidget(widget);
  const field = (label, key) => `<label>${label}<select data-dashboard-mapping="${key}">${dashboardColumnOptions(columns, mappings[key] || '')}</select></label>`;
  const multiField = (label, key, help) => `<label>${label}<select multiple size="${Math.min(6, Math.max(3, columns.length))}" data-dashboard-mapping="${key}">${columns.map((column) => `<option value="${escapeHtml(column)}" ${(mappings[key] || []).includes(column) ? 'selected' : ''}>${escapeHtml(column)}</option>`).join('')}</select>${help ? `<small>${help}</small>` : ''}</label>`;
  $('#dashboardWidgetMappingFields').hidden = isDashboardWorkspaceWidget(widget);
  $('#dashboardWidgetMappingFields').innerHTML = !widget.dataSourceKey ? '<p class="muted">Choose Dashboard Data to map its columns.</p>'
    : widget.type === 'number' ? field('Value column', 'value')
      : widget.type === 'line' ? `${field('Date / X-axis column', 'date')}${field('Value / Y-axis column', 'value')}`
        : widget.type === 'table' ? `<label>Table columns<select multiple size="${Math.min(6, Math.max(3, columns.length))}" data-dashboard-mapping="tableFields">${columns.map((column) => `<option value="${escapeHtml(column)}" ${(mappings.tableFields || []).includes(column) ? 'selected' : ''}>${escapeHtml(column)}</option>`).join('')}</select></label>`
          : widget.type === 'pivot' ? `${multiField('Row fields', 'pivotRows', 'Select in hierarchy order.')}${multiField('Column fields', 'pivotColumns', 'Optional. Leave empty for one Value column.')}${multiField('Value fields', 'pivotValues', 'Select one or more numeric fields.')}`
          : `${field('Label column', 'label')}${field('Value column', 'value')}`;
  $('#dashboardWidgetDisplayFields').innerHTML = `<label>Aggregation<select data-dashboard-config="aggregation"><option value="sum">Sum</option><option value="count">Count</option><option value="average">Average</option><option value="minimum">Minimum</option><option value="maximum">Maximum</option></select></label><label>Top rows<input type="number" min="1" max="100" value="${config.topN}" data-dashboard-config="topN"></label><label>Number format<select data-dashboard-config="numberFormat"><option value="number">Number</option><option value="currency">Currency (MYR)</option><option value="percentage">Percentage</option></select></label>${widget.type === 'pivot' ? `<label>Date labels<select data-dashboard-config="dateFormat"><option value="medium">Medium date</option><option value="long">Long date</option><option value="month">Month</option><option value="year">Year</option></select></label><label>Sort totals<select data-dashboard-config="sortDirection"><option value="desc">Largest first</option><option value="asc">Smallest first</option></select></label><label>Empty values<input maxlength="40" value="${escapeHtml(config.emptyLabel)}" data-dashboard-config="emptyLabel"></label><label class="checkbox-label"><input type="checkbox" ${config.showSubtotals ? 'checked' : ''} data-dashboard-config="showSubtotals"> Show subtotals</label><label class="checkbox-label"><input type="checkbox" ${config.showGrandTotals ? 'checked' : ''} data-dashboard-config="showGrandTotals"> Show grand totals</label>` : `<label>Colour<input type="color" value="${escapeHtml(config.color)}" data-dashboard-config="color"></label><label class="checkbox-label"><input type="checkbox" ${config.showLegend ? 'checked' : ''} data-dashboard-config="showLegend"> Show legend</label>`}<label>Drill-down type<select data-dashboard-config="drillDownType"><option value="">None</option><option value="module">CRM module page</option><option value="dashboard">Published dashboard</option></select></label><label>Drill-down stable key<input value="${escapeHtml(config.drillDown?.targetKey || '')}" data-dashboard-config="drillDownTarget" placeholder="customers"></label><label>Allowed filter keys<input value="${escapeHtml((config.drillDown?.allowedParameters || []).join(', '))}" data-dashboard-config="drillDownParameters" placeholder="status, owner"></label>`;
  if (isDashboardWorkspaceWidget(widget)) {
    const statusOptions = widget.type === 'approval_inbox' ? [['pending', 'Pending'], ['approved', 'Approved']]
      : widget.type === 'todo_list' ? [['open', 'To do'], ['in_progress', 'In progress'], ['completed', 'Completed']] : [];
    $('#dashboardWidgetDisplayFields').innerHTML = `${statusOptions.length ? `<label>Default tab<select data-dashboard-config="status">${statusOptions.map(([value, label]) => `<option value="${value}" ${config.status === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>` : ''}<label>Items shown<input type="number" min="1" max="30" value="${Math.min(30, config.topN)}" data-dashboard-config="topN"></label>${widget.type === 'notifications' ? `<label class="checkbox-label"><input type="checkbox" ${config.unreadOnly ? 'checked' : ''} data-dashboard-config="unreadOnly"> Unread only</label>` : ''}${widget.type === 'quick_actions' ? '<p class="muted">Shows Customers, Approval requests and Dashboards. Admin Portal is added for administrators.</p>' : ''}`;
  }
  const aggregation = $('[data-dashboard-config="aggregation"]'); if (aggregation) aggregation.value = config.aggregation;
  const numberFormat = $('[data-dashboard-config="numberFormat"]'); if (numberFormat) numberFormat.value = config.numberFormat;
  const sortDirection = $('[data-dashboard-config="sortDirection"]'); if (sortDirection) sortDirection.value = config.sortDirection;
  const dateFormat = $('[data-dashboard-config="dateFormat"]'); if (dateFormat) dateFormat.value = config.dateFormat;
  const drillDownType = $('[data-dashboard-config="drillDownType"]'); if (drillDownType) drillDownType.value = config.drillDown?.type || '';
  const result = state.dashboardWidgetResults[widget.widgetKey];
  const stale = result?.cache?.staleAt && Date.now() >= new Date(result.cache.staleAt).getTime();
  $('#dashboardWidgetPreviewStatus').textContent = result?.status === 'ready' ? (isDashboardWorkspaceWidget(widget) ? `Updated ${new Date(result.refreshedAt).toLocaleTimeString()}` : `${result.page.returned} rows - ${result.durationMs} ms - ${stale ? 'Stale' : result.cache?.status === 'hit' ? 'Cached' : 'Updated'} ${result.cache?.refreshedAt ? new Date(result.cache.refreshedAt).toLocaleTimeString() : ''}`) : result?.status === 'error' ? 'Preview failed' : (widget.dataSourceKey || isDashboardWorkspaceWidget(widget)) ? 'Loading...' : 'Not connected';
  $('#exportDashboardWidgetButton').hidden = !['table', 'pivot'].includes(widget.type) || result?.status !== 'ready';
  $('#exportDashboardWidgetExcelButton').hidden = widget.type !== 'pivot' || result?.status !== 'ready';
}

function updateSelectedDashboardWidgetConfiguration(mutator) {
  const widget = selectedDashboardWidget();
  if (!widget) return;
  const previous = dashboardLayoutSnapshot();
  mutator(widget);
  delete state.dashboardWidgetResults[widget.widgetKey];
  markDashboardLayoutChanged(previous);
}

function exportSelectedDashboardWidgetCsv() {
  const widget = selectedDashboardWidget();
  const result = widget && state.dashboardWidgetResults[widget.widgetKey];
  if (!widget || !['table', 'pivot'].includes(widget.type) || result?.status !== 'ready') return;
  const config = dashboardWidgetConfig(widget);
  const safeCell = (value) => {
    let text = String(value ?? '');
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  let matrix;
  if (widget.type === 'pivot') matrix = dashboardPivotExportMatrix(widget, result.rows);
  else {
    const fields = config.mappings.tableFields?.length ? config.mappings.tableFields : Object.keys(result.rows[0] || {}).slice(0, 6);
    matrix = [fields, ...result.rows.slice(0, 100).map((row) => fields.map((field) => row[field]))];
  }
  const csv = matrix.map((row) => row.map(safeCell).join(',')).join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  link.download = `${widget.widgetKey}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function dashboardPivotExportMatrix(widget, rows) {
  const pivot = buildDashboardPivot(widget, rows);
  if (pivot.error) return [['Pivot configuration error'], [pivot.error]];
  const headers = pivot.columnKeys.flatMap((column) => pivot.valueFields.map((field) => ({ column, field })));
  const matrix = [[pivot.rowFields.join(' / '), ...headers.map(({ column, field }) => `${column} - ${field}`), ...(pivot.config.showGrandTotals ? ['Row total'] : [])]];
  pivot.rows.forEach((entry) => {
    const values = headers.map(({ column, field }) => aggregateDashboardValues(entry.cells.get(`${column}\u001f${field}`) || [], pivot.config.aggregation));
    matrix.push([entry.labels.join(' / '), ...values, ...(pivot.config.showGrandTotals ? [pivot.rowTotal(entry)] : [])]);
  });
  if (pivot.config.showGrandTotals) matrix.push(['Grand total', ...headers.map(({ column, field }) => aggregateDashboardValues(pivot.rows.flatMap((row) => row.cells.get(`${column}\u001f${field}`) || []), pivot.config.aggregation)), pivot.valueFields.reduce((sum, field) => sum + aggregateDashboardValues(rows.map((row) => row[field]), pivot.config.aggregation), 0)]);
  return matrix;
}

function exportSelectedDashboardPivotExcel() {
  const widget = selectedDashboardWidget();
  const result = widget && state.dashboardWidgetResults[widget.widgetKey];
  if (!widget || widget.type !== 'pivot' || result?.status !== 'ready') return;
  const matrix = dashboardPivotExportMatrix(widget, result.rows);
  const safeExcelCell = (cell) => /^[=+\-@]/.test(String(cell ?? '')) ? `'${cell}` : cell;
  const html = `<html><head><meta charset="utf-8"></head><body><table>${matrix.map((row, rowIndex) => `<tr>${row.map((cell) => `<${rowIndex ? 'td' : 'th'}>${escapeHtml(safeExcelCell(cell))}</${rowIndex ? 'td' : 'th'}>`).join('')}</tr>`).join('')}</table></body></html>`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' }));
  link.download = `${widget.widgetKey}.xls`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function addDashboardWidget() {
  const previous = dashboardLayoutSnapshot();
  const index = state.dashboardConfiguration.widgets.length + 1;
  const widgetKey = `widget_${Date.now().toString(36)}`;
  const bottom = (viewport) => state.dashboardConfiguration.widgets.reduce((max, widget) => Math.max(max, dashboardLayout(widget, viewport).y + dashboardLayout(widget, viewport).height), 0);
  state.dashboardConfiguration.widgets.push({ widgetKey, type: 'number', title: `Widget ${index}`, config: { mappings: {}, aggregation: 'sum', topN: 10, numberFormat: 'number', color: '#6d50df', showLegend: true }, layout: { desktop: { x: 0, y: bottom('desktop'), width: 4, height: 3 }, mobile: { x: 0, y: bottom('mobile'), width: 4, height: 3 } } });
  state.selectedDashboardWidgetKey = widgetKey;
  markDashboardLayoutChanged(previous);
}

function dashboardWidgetFromEvent(event) {
  const key = event.target.closest('[data-dashboard-widget-key]')?.dataset.dashboardWidgetKey;
  return state.dashboardConfiguration?.widgets.find((item) => item.widgetKey === key);
}

async function handleDashboardWorkspaceClick(event) {
  const widget = dashboardWidgetFromEvent(event);
  const published = Boolean(event.target.closest('#publishedDashboardCanvas'));
  const render = () => published ? renderPublishedDashboardCanvas() : renderDashboardCanvas();
  const closeCalendar = event.target.closest('[data-dashboard-calendar-close]');
  if (closeCalendar) { closeDashboardCalendarPopover(render); return; }
  const today = event.target.closest('[data-dashboard-calendar-today]');
  const shift = event.target.closest('[data-dashboard-calendar-shift]');
  if ((today || shift) && widget?.type === 'calendar') {
    const month = today ? new Date() : dashboardCalendarMonth(widget.widgetKey);
    if (shift) month.setMonth(month.getMonth() + Number(shift.dataset.dashboardCalendarShift));
    month.setDate(1);
    state.dashboardCalendarMonths[widget.widgetKey] = dashboardLocalDateKey(month);
    state.dashboardCalendarOpen = null;
    await loadDashboardWorkspaceWidget(widget, true, published);
    return;
  }
  const date = event.target.closest('[data-dashboard-calendar-date]');
  if (date && widget?.type === 'calendar') {
    const items = state.dashboardWidgetResults[widget.widgetKey]?.data?.events?.filter((item) => dashboardCalendarEventDateKey(item) === date.dataset.dashboardCalendarDate) || [];
    state.dashboardCalendarOpen = items.length ? { widgetKey: widget.widgetKey, date: date.dataset.dashboardCalendarDate, published } : null;
    render();
    return;
  }
  const request = event.target.closest('[data-dashboard-request]');
  if (request) { state.dashboardCalendarOpen = null; showView('workflowRequestsView'); await openWorkflowRequest(request.dataset.dashboardRequest); return; }
  const destination = event.target.closest('[data-dashboard-view]');
  if (destination) showView(destination.dataset.dashboardView);
}

async function handleDashboardTaskSubmit(event) {
  const form = event.target.closest('[data-dashboard-task-form]');
  if (!form) return;
  event.preventDefault();
  const title = new FormData(form).get('title')?.trim();
  if (!title) return;
  await api('/api/dashboard-workspace/tasks', { method: 'POST', body: JSON.stringify({ title, priority: 'normal' }) });
  const widget = dashboardWidgetFromEvent(event);
  if (widget) await loadDashboardWorkspaceWidget(widget, true, Boolean(event.target.closest('#publishedDashboardCanvas')));
  toast('Task added', 'success');
}

async function handleDashboardTaskChange(event) {
  const input = event.target.closest('[data-dashboard-task-id]');
  if (!input) return;
  await api(`/api/dashboard-workspace/tasks/${input.dataset.dashboardTaskId}`, { method: 'PATCH', body: JSON.stringify({ status: input.checked ? 'completed' : 'open' }) });
  const widget = dashboardWidgetFromEvent(event);
  if (widget) await loadDashboardWorkspaceWidget(widget, true, Boolean(event.target.closest('#publishedDashboardCanvas')));
}

function undoDashboardLayout() {
  const snapshot = state.dashboardLayoutHistory.pop();
  if (!snapshot) return;
  state.dashboardLayoutFuture.push(dashboardLayoutSnapshot());
  state.dashboardConfiguration.widgets = JSON.parse(snapshot);
  if (!selectedDashboardWidget()) state.selectedDashboardWidgetKey = '';
  state.dashboardLayoutDirty = true;
  renderDashboardCanvas();
}

function redoDashboardLayout() {
  const snapshot = state.dashboardLayoutFuture.pop();
  if (!snapshot) return;
  state.dashboardLayoutHistory.push(dashboardLayoutSnapshot());
  state.dashboardConfiguration.widgets = JSON.parse(snapshot);
  if (!selectedDashboardWidget()) state.selectedDashboardWidgetKey = '';
  state.dashboardLayoutDirty = true;
  renderDashboardCanvas();
}

function duplicateSelectedDashboardWidget() {
  const source = selectedDashboardWidget();
  if (!source) return;
  const previous = dashboardLayoutSnapshot();
  const copy = JSON.parse(JSON.stringify(source));
  copy.widgetKey = `${source.widgetKey}_copy_${Date.now().toString(36)}`;
  copy.title = `${source.title} Copy`;
  ['desktop', 'mobile'].forEach((viewport) => {
    const layout = dashboardLayout(copy, viewport);
    copy.layout[viewport] = { ...layout, x: 0, y: state.dashboardConfiguration.widgets.reduce((max, widget) => Math.max(max, dashboardLayout(widget, viewport).y + dashboardLayout(widget, viewport).height), 0) };
  });
  state.dashboardConfiguration.widgets.push(copy);
  state.selectedDashboardWidgetKey = copy.widgetKey;
  markDashboardLayoutChanged(previous);
}

function removeSelectedDashboardWidget() {
  if (!selectedDashboardWidget()) return;
  const previous = dashboardLayoutSnapshot();
  state.dashboardConfiguration.widgets = state.dashboardConfiguration.widgets.filter((widget) => widget.widgetKey !== state.selectedDashboardWidgetKey);
  state.selectedDashboardWidgetKey = '';
  markDashboardLayoutChanged(previous);
}

function startDashboardLayoutInteraction(event) {
  const frame = event.target.closest('[data-dashboard-widget-key]');
  if (!frame || event.button !== 0 || event.target.closest('button')) return;
  state.selectedDashboardWidgetKey = frame.dataset.dashboardWidgetKey;
  renderDashboardCanvas();
  const widget = selectedDashboardWidget();
  state.dashboardLayoutInteraction = {
    widgetKey: widget.widgetKey,
    mode: event.target.closest('.dashboard-widget-resize-handle') ? 'resize' : 'move',
    startX: event.clientX,
    startY: event.clientY,
    startLayout: dashboardLayout(widget),
    previousSnapshot: dashboardLayoutSnapshot()
  };
  event.preventDefault();
}

function moveDashboardLayoutInteraction(event) {
  const interaction = state.dashboardLayoutInteraction;
  if (!interaction) return;
  const canvas = $('#dashboardCanvas');
  const columns = dashboardLayoutColumns[state.dashboardLayoutViewport];
  const gap = 10;
  const cellWidth = (canvas.getBoundingClientRect().width - gap * (columns - 1)) / columns;
  const deltaX = Math.round((event.clientX - interaction.startX) / (cellWidth + gap));
  const deltaY = Math.round((event.clientY - interaction.startY) / 88);
  state.selectedDashboardWidgetKey = interaction.widgetKey;
  const changes = interaction.mode === 'resize'
    ? { width: interaction.startLayout.width + deltaX, height: interaction.startLayout.height + deltaY }
    : { x: interaction.startLayout.x + deltaX, y: interaction.startLayout.y + deltaY };
  updateSelectedDashboardLayout(changes, false);
}

function endDashboardLayoutInteraction() {
  const interaction = state.dashboardLayoutInteraction;
  if (!interaction) return;
  state.dashboardLayoutInteraction = null;
  if (interaction.previousSnapshot !== dashboardLayoutSnapshot()) markDashboardLayoutChanged(interaction.previousSnapshot);
}

async function saveDashboardLayout() {
  if (!state.dashboardConfiguration || !state.dashboardLayoutDirty) return;
  const saveState = $('#dashboardStudioSaveState');
  saveState.textContent = 'Savingâ€¦';
  saveState.className = 'dashboard-save-state';
  try {
    const result = await api(`/api/dashboards/${encodeURIComponent(state.activeDashboardKey)}/configuration`, { method: 'PUT', body: JSON.stringify({ widgets: state.dashboardConfiguration.widgets, filters: state.dashboardConfiguration.filters || [], permissions: state.dashboardConfiguration.permissions || [] }) });
    state.dashboardConfiguration = { ...state.dashboardConfiguration, ...result, widgets: normalizeDashboardWidgets(result.widgets || state.dashboardConfiguration.widgets) };
    state.dashboardLayoutDirty = false;
    state.dashboardLayoutHistory = [];
    state.dashboardLayoutFuture = [];
    beginBuilderDraft('dashboard');
    renderDashboardCanvas();
    await loadDashboards();
    toast('Dashboard Layout Saved.');
  } catch (error) {
    saveState.textContent = 'Save failed';
    saveState.className = 'dashboard-save-state is-error';
    throw error;
  }
}

async function openDashboardBuilderStudio(dashboardKey) {
  state.dashboardManagementMode = 'studio';
  $('#dashboardManagement').hidden = true;
  $('#dashboardBuilderStudio').hidden = false;
  $('#dashboardBuilderStudioTitle').textContent = 'Loading dashboardâ€¦';
  $('#dashboardBuilderStudioKey').textContent = '';
  $('#dashboardStudioSaveState').textContent = 'Loadingâ€¦';
  $('#dashboardCanvas').innerHTML = '<div class="dashboard-canvas-loading">Loading saved layoutâ€¦</div>';
  const [configuration, sources] = await Promise.all([
    api(`/api/dashboards/${encodeURIComponent(dashboardKey)}`),
    api('/api/dashboards/data-sources?archived=false')
  ]);
  state.dashboardDataSources = sources.dataSources || [];
  state.activeDashboardKey = dashboardKey;
  const dashboard = configuration.dashboard;
  state.dashboardConfiguration = { ...configuration, widgets: normalizeDashboardWidgets(configuration.widgets) };
  state.dashboardLayoutViewport = 'desktop';
  state.selectedDashboardWidgetKey = '';
  state.dashboardLayoutHistory = [];
  state.dashboardLayoutFuture = [];
  state.dashboardLayoutDirty = false;
  state.dashboardPreviewMode = false;
  $('#dashboardBuilderStudio').classList.remove('is-previewing');
  $('#previewDashboardButton').textContent = 'Preview';
  state.dashboardWidgetResults = {};
  initializeDashboardFilterValues(configuration.filters || []);
  $('#dashboardBuilderStudioTitle').textContent = dashboard.name;
  $('#dashboardBuilderStudioKey').textContent = `${dashboard.dashboardKey} · ${titleCaseMessage(dashboard.status)}`;
  renderDashboardCanvas();
  beginBuilderDraft('dashboard');
}

function dashboardFilterParameterOptions(sourceKey, selected = '') {
  const source = state.dashboardDataSources.find((item) => item.dataSourceKey === sourceKey);
  return `<option value="">Choose a declared parameter</option>${dashboardSourceParameterNames(source).map((name) => `<option value="${escapeHtml(name)}" ${name === selected ? 'selected' : ''}>:${escapeHtml(name)}</option>`).join('')}`;
}

function updateDashboardFilterFormFields() {
  const form = $('#dashboardFilterForm');
  if (!form) return;
  const type = form.elements.type.value;
  const sourceKey = form.elements.dataSourceKey.value;
  const currentParameter = form.elements.parameterName.value;
  const currentEnd = form.elements.endParameterName.value;
  form.elements.parameterName.innerHTML = dashboardFilterParameterOptions(sourceKey, currentParameter);
  form.elements.endParameterName.innerHTML = dashboardFilterParameterOptions(sourceKey, currentEnd);
  form.querySelector('.dashboard-filter-end-parameter').hidden = type !== 'date_range';
  form.querySelector('.dashboard-filter-options-field').hidden = !['dropdown', 'multi_select'].includes(type);
  form.querySelector('.dashboard-filter-default-field').hidden = ['current_user'].includes(type);
  form.elements.endParameterName.required = type === 'date_range';
  if (type === 'current_user') { form.elements.shareInUrl.checked = false; form.elements.shareInUrl.disabled = true; }
  else form.elements.shareInUrl.disabled = false;
}

function openDashboardFilterDrawer(filterKey = '') {
  const form = $('#dashboardFilterForm');
  const filter = (state.dashboardConfiguration?.filters || []).find((item) => item.filterKey === filterKey) || null;
  form.reset();
  form.elements.editingFilterKey.value = filter?.filterKey || '';
  form.elements.name.value = filter?.name || '';
  form.elements.filterKey.value = filter?.filterKey || '';
  form.elements.filterKey.readOnly = Boolean(filter);
  form.elements.type.value = filter?.type || 'date_range';
  form.elements.dataSourceKey.innerHTML = `<option value="">Choose Dashboard Data</option>${state.dashboardDataSources.filter((source) => !source.archived && dashboardSourceParameterNames(source).length).map((source) => `<option value="${escapeHtml(source.dataSourceKey)}" ${source.dataSourceKey === filter?.config?.dataSourceKey ? 'selected' : ''}>${escapeHtml(source.name)} - ${dashboardSourceParameterNames(source).map((name) => `:${name}`).join(', ')}</option>`).join('')}`;
  form.elements.parameterName.innerHTML = dashboardFilterParameterOptions(filter?.config?.dataSourceKey, filter?.config?.parameterName);
  form.elements.endParameterName.innerHTML = dashboardFilterParameterOptions(filter?.config?.dataSourceKey, filter?.config?.endParameterName);
  form.elements.optionsText.value = dashboardFilterOptions(filter || {}).map((option) => option.value === option.label ? option.value : `${option.value}=${option.label}`).join('\n');
  const defaultValue = filter?.config?.defaultValue;
  form.elements.defaultValue.value = Array.isArray(defaultValue) ? defaultValue.join(', ') : typeof defaultValue === 'object' ? '' : defaultValue || '';
  form.elements.required.checked = Boolean(filter?.config?.required);
  form.elements.shareInUrl.checked = filter?.config?.shareInUrl !== false;
  $('#dashboardFilterFormTitle').textContent = filter ? 'Edit filter' : 'Add filter';
  $('#removeDashboardFilterButton').hidden = !filter;
  updateDashboardFilterFormFields();
  $('#dashboardFilterDrawer').hidden = false;
  document.body.classList.add('modal-open');
  form.elements.name.focus();
}

function closeDashboardFilterDrawer() {
  const drawer = $('#dashboardFilterDrawer');
  if (!drawer || drawer.hidden) return;
  drawer.hidden = true;
  document.body.classList.remove('modal-open');
}

function saveDashboardFilter(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const editingKey = form.elements.editingFilterKey.value;
  const type = form.elements.type.value;
  const options = form.elements.optionsText.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => { const [value, ...label] = line.split('='); return { value, label: label.join('=') || value }; });
  const rawDefault = form.elements.defaultValue.value.trim();
  const defaultValue = type === 'date_range' ? { start: '', end: '' } : type === 'multi_select' ? rawDefault.split(',').map((value) => value.trim()).filter(Boolean) : rawDefault;
  const filter = {
    filterKey: editingKey || form.elements.filterKey.value.trim(),
    name: form.elements.name.value.trim(),
    type,
    config: { dataSourceKey: form.elements.dataSourceKey.value, parameterName: form.elements.parameterName.value, endParameterName: type === 'date_range' ? form.elements.endParameterName.value : '', options, defaultValue, required: form.elements.required.checked, shareInUrl: form.elements.shareInUrl.checked }
  };
  const filters = state.dashboardConfiguration.filters || [];
  const index = filters.findIndex((item) => item.filterKey === editingKey);
  if (index >= 0) filters[index] = filter; else filters.push(filter);
  state.dashboardFilterValues[filter.filterKey] = defaultValue;
  state.dashboardLayoutDirty = true;
  closeDashboardFilterDrawer();
  closeDashboardAccessDrawer();
  refreshWidgetsForDashboardFilter(filter);
  toast(editingKey ? 'Dashboard Filter Updated.' : 'Dashboard Filter Added.');
}

function removeDashboardFilter() {
  const key = $('#dashboardFilterForm').elements.editingFilterKey.value;
  const filter = state.dashboardConfiguration.filters.find((item) => item.filterKey === key);
  if (!filter) return;
  state.dashboardConfiguration.filters = state.dashboardConfiguration.filters.filter((item) => item.filterKey !== key);
  delete state.dashboardFilterValues[key];
  state.dashboardLayoutDirty = true;
  closeDashboardFilterDrawer();
  refreshWidgetsForDashboardFilter(filter);
  toast('Dashboard Filter Removed.');
}

function resetDashboardFilters() {
  initializeDashboardFilterValues(state.dashboardConfiguration.filters || []);
  state.dashboardWidgetResults = {};
  updateDashboardFilterUrl();
  renderDashboardCanvas();
}

function openDashboardForm(mode = 'create', dashboardKey = '') {
  const form = $('#dashboardForm');
  const source = state.dashboards.find((dashboard) => dashboard.dashboardKey === dashboardKey) || null;
  form.reset();
  form.elements.mode.value = mode;
  form.elements.sourceDashboardKey.value = source?.dashboardKey || '';
  form.elements.name.value = mode === 'duplicate' ? `${source?.name || 'Dashboard'} Copy` : source?.name || '';
  form.elements.dashboardKey.value = mode === 'duplicate' ? `${source?.dashboardKey || 'dashboard'}_copy` : source?.dashboardKey || '';
  form.elements.dashboardKey.readOnly = mode === 'edit';
  form.elements.description.value = source?.description || '';
  $('#dashboardFormTitle').textContent = mode === 'edit' ? 'Dashboard settings' : mode === 'duplicate' ? 'Duplicate dashboard' : 'New dashboard';
  $('#dashboardFormHelp').textContent = mode === 'duplicate' ? 'Copy the draft widgets, filters, permissions, and layout into a separate dashboard.' : mode === 'edit' ? 'Rename or describe this dashboard. Its stable key stays protected.' : 'Create a draft dashboard. Widgets and layouts are added in the builder.';
  $('#saveDashboardButton').textContent = mode === 'edit' ? 'Save changes' : mode === 'duplicate' ? 'Duplicate dashboard' : 'Create dashboard';
  $('#dashboardFormModal').hidden = false;
  document.body.classList.add('modal-open');
  form.elements.name.focus();
}

function closeDashboardFormModal() {
  const modal = $('#dashboardFormModal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

async function saveDashboard(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const mode = form.elements.mode.value;
  const sourceKey = form.elements.sourceDashboardKey.value;
  const payload = { dashboardKey: form.elements.dashboardKey.value.trim() || undefined, name: form.elements.name.value.trim(), description: form.elements.description.value.trim() };
  const path = mode === 'edit' ? `/api/dashboards/${encodeURIComponent(sourceKey)}` : mode === 'duplicate' ? `/api/dashboards/${encodeURIComponent(sourceKey)}/duplicate` : '/api/dashboards';
  const result = await api(path, { method: mode === 'edit' ? 'PUT' : 'POST', body: JSON.stringify(payload) });
  closeDashboardFormModal();
  state.activeDashboardKey = result.dashboard.dashboardKey;
  await loadDashboards();
  if (state.dashboardManagementMode === 'studio') await openDashboardBuilderStudio(result.dashboard.dashboardKey);
  toast(mode === 'edit' ? 'Dashboard Settings Saved.' : mode === 'duplicate' ? 'Dashboard Duplicated.' : 'Dashboard Draft Created.');
}

async function changeDashboardArchiveState(dashboardKey, reopen = false) {
  const dashboard = state.dashboards.find((item) => item.dashboardKey === dashboardKey);
  if (!dashboard) return;
  if (!reopen) {
    const confirmed = await showConfirmationModal({ title: 'Archive dashboard', message: `Archive ${dashboard.name}? It will leave the active dashboard list. Reopening creates a draft; it does not automatically republish the dashboard.`, confirmLabel: 'Archive dashboard' });
    if (!confirmed) return;
  }
  await api(`/api/dashboards/${encodeURIComponent(dashboardKey)}/${reopen ? 'reopen' : 'archive'}`, { method: 'POST' });
  await loadDashboards();
  toast(reopen ? 'Dashboard Reopened As Draft.' : 'Dashboard Archived.');
}

function filteredDashboardSources() {
  const query = state.dashboardSourceSearch.trim().toLowerCase();
  return state.dashboardDataSources.filter((source) => !source.archived && (!query || [source.name, source.dataSourceKey, source.viewName, source.description].some((value) => String(value || '').toLowerCase().includes(query))));
}

function renderDashboardSourceList() {
  const list = $('#dashboardSourceList');
  if (!list) return;
  const sources = filteredDashboardSources();
  $('#dashboardSourceCounts').textContent = state.dashboardSourcesLoading
    ? 'Loading data sources…'
    : `${sources.length} active source${sources.length === 1 ? '' : 's'} · ${state.dashboardViews.length} database view${state.dashboardViews.length === 1 ? '' : 's'}`;
  list.innerHTML = state.dashboardSourcesLoading
    ? '<div class="empty-state"><p>Loading registered sources…</p></div>'
    : sources.map((source) => `
      <button type="button" class="dashboard-source-list-item ${source.dataSourceKey === state.activeDashboardSourceKey ? 'is-selected' : ''}" data-dashboard-source-key="${escapeHtml(source.dataSourceKey)}">
        <span><strong>${escapeHtml(source.name)}</strong><small>${escapeHtml(source.sourceType === 'sql_view' ? source.viewName : 'Guarded SELECT query')}</small></span>
        <code>${escapeHtml(source.validationStatus || 'untested')}</code>
      </button>
    `).join('') || '<div class="empty-state"><h3>No registered sources</h3><p>Register a SQL view to make it available to dashboard widgets.</p></div>';
}

function dashboardColumnType(column) {
  return column.dataType || column.columnType || column.type || 'unknown';
}

function renderDashboardPreview() {
  const container = $('#dashboardPreviewResult');
  const meta = $('#dashboardPreviewMeta');
  if (!container || !meta) return;
  const preview = state.dashboardPreview;
  if (!preview) {
    meta.textContent = '';
    container.innerHTML = '<p class="muted">Run preview to inspect returned rows.</p>';
    return;
  }
  meta.textContent = `${preview.page.returned} row${preview.page.returned === 1 ? '' : 's'} returned · ${preview.durationMs} ms · limit ${preview.page.limit}`;
  if (!preview.rows.length) {
    container.innerHTML = '<p class="muted">The source ran successfully but returned no rows.</p>';
    return;
  }
  const columns = preview.columns.map((column) => column.name);
  container.innerHTML = `<table><thead><tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${preview.rows.map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column] === null || row[column] === undefined ? '—' : typeof row[column] === 'object' ? JSON.stringify(row[column]) : row[column])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function renderDashboardSourceDetail() {
  const source = activeDashboardSource();
  $('#dashboardSourceEmpty').hidden = Boolean(source);
  $('#dashboardSourceDetail').hidden = !source;
  if (!source) return;
  $('#dashboardSourceTypeLabel').textContent = source.sourceType === 'sql_view' ? 'Registered SQL view' : 'Advanced guarded query';
  $('#dashboardSourceTitle').textContent = source.name;
  $('#dashboardSourceDescription').textContent = source.description || source.dataSourceKey;
  $('#dashboardContractSource').textContent = source.sourceType === 'sql_view' ? source.viewName : 'Guarded SELECT';
  $('#dashboardContractColumns').textContent = source.columns?.length ? `${source.columns.length} detected` : 'Not inspected';
  $('#dashboardContractPreview').textContent = state.dashboardPreview ? `${state.dashboardPreview.page.returned} rows · ${state.dashboardPreview.durationMs} ms` : source.validationStatus === 'valid' ? 'Previously validated' : 'Not run';
  $('#dashboardPreviewParametersLabel').hidden = source.sourceType !== 'select_query';
  const columns = source.columns || [];
  $('#dashboardSourceColumns').innerHTML = columns.map((column) => `<div class="dashboard-column-chip"><code title="${escapeHtml(column.name || column.key)}">${escapeHtml(column.name || column.key)}</code><span>${escapeHtml(dashboardColumnType(column))}</span></div>`).join('') || '<div class="empty-state"><p>No column metadata saved yet. Refresh columns to inspect this source.</p></div>';
  renderDashboardPreview();
}

function renderDashboardSources() {
  renderDashboardSourceList();
  renderDashboardSourceDetail();
}

async function loadDashboardSources() {
  state.dashboardSourcesLoading = true;
  renderDashboardSourceList();
  try {
    const [sources, views] = await Promise.all([api('/api/dashboards/data-sources?archived=false'), api('/api/dashboards/views')]);
    state.dashboardDataSources = sources.dataSources || [];
    state.dashboardViews = views.views || [];
    if (!state.dashboardDataSources.some((source) => source.dataSourceKey === state.activeDashboardSourceKey)) {
      state.activeDashboardSourceKey = state.dashboardDataSources[0]?.dataSourceKey || '';
    }
  } finally {
    state.dashboardSourcesLoading = false;
    renderDashboardSources();
  }
}

function dashboardViewOptions(selected = '') {
  return `<option value="">Choose a database view</option>${state.dashboardViews.map((view) => `<option value="${escapeHtml(view.name)}" ${view.name === selected ? 'selected' : ''}>${escapeHtml(view.name)}</option>`).join('')}`;
}

function updateDashboardSourceFormMode() {
  const form = $('#dashboardSourceForm');
  if (!form) return;
  const isView = form.elements.sourceType.value === 'sql_view';
  form.querySelector('.dashboard-view-field').hidden = !isView;
  form.querySelector('.dashboard-query-field').hidden = isView;
  form.elements.viewName.required = isView;
  form.elements.querySql.required = !isView;
}

function openDashboardSourceDrawer(dataSourceKey = '') {
  const form = $('#dashboardSourceForm');
  const source = state.dashboardDataSources.find((item) => item.dataSourceKey === dataSourceKey) || null;
  form.reset();
  form.elements.editingDataSourceKey.value = source?.dataSourceKey || '';
  form.elements.sourceType.value = source?.sourceType || 'sql_view';
  form.elements.name.value = source?.name || '';
  form.elements.dataSourceKey.value = source?.dataSourceKey || '';
  form.elements.dataSourceKey.readOnly = Boolean(source);
  form.elements.viewName.innerHTML = dashboardViewOptions(source?.viewName || '');
  form.elements.querySql.value = source?.querySql || '';
  form.elements.rowLimit.value = source?.rowLimit || 1000;
  form.elements.timeoutMs.value = source?.timeoutMs || 10000;
  form.elements.description.value = source?.description || '';
  $('#dashboardSourceFormTitle').textContent = source ? 'Edit data source' : 'Register data source';
  updateDashboardSourceFormMode();
  $('#dashboardSourceDrawer').hidden = false;
  document.body.classList.add('modal-open');
  form.elements.name.focus();
}

function closeDashboardSourceDrawer() {
  const drawer = $('#dashboardSourceDrawer');
  if (!drawer || drawer.hidden) return;
  resetModalFullscreen(drawer);
  drawer.hidden = true;
  document.body.classList.remove('modal-open');
}

async function saveDashboardSource(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const editingKey = form.elements.editingDataSourceKey.value;
  const payload = {
    dataSourceKey: form.elements.dataSourceKey.value.trim() || undefined,
    name: form.elements.name.value.trim(),
    description: form.elements.description.value.trim(),
    sourceType: form.elements.sourceType.value,
    viewName: form.elements.sourceType.value === 'sql_view' ? form.elements.viewName.value : undefined,
    querySql: form.elements.sourceType.value === 'select_query' ? form.elements.querySql.value.trim() : undefined,
    rowLimit: Number(form.elements.rowLimit.value),
    timeoutMs: Number(form.elements.timeoutMs.value)
  };
  const result = await api(editingKey ? `/api/dashboards/data-sources/${encodeURIComponent(editingKey)}` : '/api/dashboards/data-sources', { method: editingKey ? 'PUT' : 'POST', body: JSON.stringify(payload) });
  state.activeDashboardSourceKey = result.dataSource.dataSourceKey;
  state.dashboardPreview = null;
  closeDashboardSourceDrawer();
  await loadDashboardSources();
  toast(editingKey ? 'Dashboard Data Source Updated.' : 'Dashboard Data Source Registered.');
}

async function runDashboardSourcePreview(refreshColumns = false) {
  const source = activeDashboardSource();
  if (!source) return;
  let parameters = {};
  if (source.sourceType === 'select_query') {
    try { parameters = JSON.parse($('#dashboardPreviewParameters').value || '{}'); }
    catch (_error) { throw new Error('Preview parameters must be valid JSON.'); }
  }
  const result = await api(`/api/dashboards/data-sources/${encodeURIComponent(source.dataSourceKey)}/execute`, { method: 'POST', body: JSON.stringify({ parameters, limit: Math.min(source.rowLimit || 1000, 50) }) });
  state.dashboardPreview = result;
  const columns = result.columns.map((column) => ({ name: column.name, type: column.type, table: column.table || '' }));
  if (refreshColumns || !source.columns?.length) {
    const updated = await api(`/api/dashboards/data-sources/${encodeURIComponent(source.dataSourceKey)}`, { method: 'PUT', body: JSON.stringify({ columns }) });
    const index = state.dashboardDataSources.findIndex((item) => item.dataSourceKey === source.dataSourceKey);
    if (index >= 0) state.dashboardDataSources[index] = updated.dataSource;
  }
  renderDashboardSourceDetail();
  toast(refreshColumns ? 'Columns Refreshed.' : 'Preview Ready.');
}

async function archiveDashboardSource() {
  const source = activeDashboardSource();
  if (!source) return;
  const confirmed = await showConfirmationModal({ title: 'Archive data source', message: `Archive ${source.name}? It will no longer be available for new dashboard widgets.`, confirmLabel: 'Archive source' });
  if (!confirmed) return;
  await api(`/api/dashboards/data-sources/${encodeURIComponent(source.dataSourceKey)}/archive`, { method: 'POST' });
  state.activeDashboardSourceKey = '';
  state.dashboardPreview = null;
  await loadDashboardSources();
  toast('Dashboard Data Source Archived.');
}

function toggleAdminMenu() {
  state.adminMenuCollapsed = !state.adminMenuCollapsed;
  document.body.classList.toggle('admin-nav-collapsed', state.adminMenuCollapsed);
  const button = $('#toggleAdminMenu');
  const label = state.adminMenuCollapsed ? 'Expand admin menu' : 'Collapse admin menu';
  button.textContent = state.adminMenuCollapsed ? '›' : '‹';
  button.setAttribute('aria-label', label);
  button.setAttribute('aria-expanded', String(!state.adminMenuCollapsed));
  button.title = label;
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
  $('#notificationHub').hidden = false;
  $('#accountHub').hidden = false;
  $('#adminPortalAccountButton').hidden = user.role !== 'admin';
  $('[data-view="usersView"]').hidden = user.role !== 'admin';
  $('[data-view="workflowMonitoringView"]').hidden = user.role !== 'admin';
  $('[data-view="workflowDelegationView"]').hidden = user.role !== 'admin';
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
  $('#notificationHub').hidden = true;
  $('#accountHub').hidden = true;
  toggleAccountMenu(false);
  if (state.accountAvatarUrl) URL.revokeObjectURL(state.accountAvatarUrl);
  state.accountAvatarUrl = ''; state.account = null;
  $('#adminPortalAccountButton').hidden = true;
  window.clearInterval(state.notificationTimer); state.notificationTimer = null;
  $('[data-view="usersView"]').hidden = false;
  $('[data-view="workflowMonitoringView"]').hidden = false;
  $('[data-view="workflowDelegationView"]').hidden = false;
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
  syncSidebarCurrentState();
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
  const departmentTree = kind === 'departments' ? (() => {
    const childrenByParent = hierarchyChildrenIndex(items, (item) => item.parentValue);
    const selectedPath = hierarchyPathKeys(items, selected, (item) => item.value, (item) => item.parentValue);
    const renderNodes = (nodes, depth = 0) => nodes.map((item, index) => {
      const children = childrenByParent.get(String(item.value)) || [];
      const pathClasses = hierarchyNodePathClasses(nodes, index, selectedPath, (node) => node.value);
      return `<div class="hierarchy-node permission-department-entry ${pathClasses}" data-hierarchy-key="${escapeHtml(item.value)}" style="--hierarchy-depth:${depth}">
        <label class="permission-check permission-department-node" data-permission-option data-search="${escapeHtml(item.search || item.label)}" title="${escapeHtml(item.meta || item.label)}">
          <input type="checkbox" value="${escapeHtml(item.value)}" ${selected.has(String(item.value)) ? 'checked' : ''}>
          <span>
            <strong>${escapeHtml(item.label)}</strong><small class="permission-unit-badge">${escapeHtml(item.type === 'organization' ? 'ORG' : item.type === 'department' ? 'DEPT' : 'GROUP')}</small>
          </span>
        </label>
        ${children.length ? `<div class="hierarchy-branch">${renderNodes(children, depth + 1)}</div>` : ''}
      </div>`;
    }).join('');
    return renderNodes(childrenByParent.get('') || []);
  })() : '';
  return `
    <div class="permission-picker" data-permission-picker="${escapeHtml(kind)}" data-permission-action="${escapeHtml(action)}">
      <div class="permission-picker-toolbar">
        <input type="search" data-permission-search placeholder="Search ${kind}" aria-label="Search ${kind} for ${escapeHtml(permissionActionLabel(action))}">
        <span>${selectedCount}/${items.length}</span>
      </div>
      <div class="permission-check-list ${kind === 'departments' ? 'hierarchy permission-department-tree' : ''}">
        ${kind === 'departments' ? departmentTree : items.map((item) => `
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

function renderRecordAccessPreview() {
  const panel = $('#recordAccessPreviewPanel');
  const body = $('#recordAccessPreviewBody');
  if (!panel || !body) return;
  panel.hidden = !permissionPreviewFeatures.recordAccess;
  if (panel.hidden) return;
  const scopes = [
    ['all', 'All records', 'Full access across this module.'],
    ['own', 'Own records', 'Records created or owned by the current user.'],
    ['assigned', 'Assigned records', 'Records assigned directly to the current user.'],
    ['department', 'Department records', 'Records owned inside the user\'s department.'],
    ['descendants', 'Department + children', 'Includes child departments and groups.'],
    ['custom', 'Custom rules', 'Combine ownership, fields, and conditions.']
  ];
  body.innerHTML = `
    <div class="record-access-preview-grid">
      <section class="record-access-card record-access-scope-card">
        <div class="record-access-card-heading"><strong>1. Access scope</strong><small>Choose the broadest set of records this rule allows.</small></div>
        <div class="record-scope-options">
          ${scopes.map(([value, label, description], index) => `
            <label class="record-scope-option ${index === 3 ? 'is-selected' : ''}">
              <input type="radio" name="recordAccessPreviewScope" value="${value}" ${index === 3 ? 'checked' : ''}>
              <span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(description)}</small></span>
            </label>
          `).join('')}
        </div>
      </section>
      <section class="record-access-card">
        <div class="record-access-card-heading"><strong>2. Apply to</strong><small>Select who receives this record-access rule.</small></div>
        <div class="record-access-subjects">
          <div><strong>Roles</strong>${renderPermissionPicker('roles', 'record', permissionRoleItems(), ['manager', 'user'])}</div>
          <div><strong>Departments</strong>${renderPermissionPicker('departments', 'record', permissionDepartmentItems(), [])}</div>
          <div><strong>Specific users</strong>${renderPermissionPicker('users', 'record', permissionUserItems(), [])}</div>
        </div>
      </section>
      <section class="record-access-card record-access-actions-card">
        <div class="record-access-card-heading"><strong>3. Allowed actions</strong><small>Page and field permissions must also allow the action.</small></div>
        <div class="record-access-action-options">
          ${['View', 'Create', 'Edit', 'Delete', 'Import', 'Export'].map((action, index) => `<label><input type="checkbox" ${index < 3 ? 'checked' : ''}> <span>${action}</span></label>`).join('')}
        </div>
      </section>
      <aside class="record-access-preview-note">
        <strong>Preview only</strong>
        <span>This interface is not saved or enforced yet. It can be hidden without deleting the implementation.</span>
      </aside>
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
  renderRecordAccessPreview();

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
  if (picker.dataset.permissionPicker === 'departments') {
    const entries = Array.from(picker.querySelectorAll('.permission-department-entry'));
    entries.forEach((entry) => { entry.hidden = Boolean(query); });
    picker.querySelectorAll('[data-permission-option]').forEach((option) => {
      if (query && !String(option.dataset.search || '').toLowerCase().includes(query)) return;
      let entry = option.closest('.permission-department-entry');
      while (entry) {
        entry.hidden = false;
        entry = entry.parentElement?.closest('.permission-department-entry');
      }
    });
    syncPermissionHierarchyState(picker);
    return;
  }
  picker.querySelectorAll('[data-permission-option]').forEach((option) => {
    option.hidden = Boolean(query) && !String(option.dataset.search || '').toLowerCase().includes(query);
  });
}

function syncPermissionHierarchyState(picker) {
  if (!picker || picker.dataset.permissionPicker !== 'departments') return;
  const entries = Array.from(picker.querySelectorAll('.permission-department-entry'));
  entries.forEach((entry) => entry.classList.remove('is-hierarchy-path', 'is-hierarchy-rail-through', 'is-hierarchy-rail-entry', 'is-hierarchy-visible-last'));
  picker.querySelectorAll('.permission-department-entry:not([hidden]) > .permission-department-node input:checked').forEach((checkbox) => {
    let entry = checkbox.closest('.permission-department-entry');
    while (entry && !entry.hidden) {
      entry.classList.add('is-hierarchy-path');
      entry = entry.parentElement?.closest('.permission-department-entry');
    }
  });
  picker.querySelectorAll('.hierarchy-branch').forEach((branch) => {
    const visibleEntries = Array.from(branch.children).filter((entry) => !entry.hidden);
    visibleEntries.at(-1)?.classList.add('is-hierarchy-visible-last');
    visibleEntries.forEach((entry, index) => {
      const hasLaterPath = visibleEntries.slice(index + 1).some((candidate) => candidate.classList.contains('is-hierarchy-path'));
      if (entry.classList.contains('is-hierarchy-path')) entry.classList.add('is-hierarchy-rail-entry');
      if (hasLaterPath) entry.classList.add('is-hierarchy-rail-through');
    });
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

function permissionAuditReasonLabel(reason) {
  const labels = {
    admin_role: 'Admin role',
    module_permission_grant: 'Module permission grant',
    page_permission_grant: 'Page permission grant',
    no_module_permission_grant: 'No module permission grant',
    no_page_permission_grant: 'No page permission grant'
  };
  return labels[reason] || titleCaseMessage(String(reason || 'Permission decision').replaceAll('_', ' '));
}

function renderPermissionAuditModuleFilter() {
  const select = $('#permissionAuditModuleFilter');
  if (!select) return;
  const selected = select.value || state.activePermissionModule || '';
  select.innerHTML = [
    '<option value="">All modules</option>',
    ...state.adminModules.map((entry) => {
      const module = entry.module || entry;
      const key = module.moduleKey || module.key;
      return `<option value="${escapeHtml(key)}">${escapeHtml(module.name || titleCaseMessage(key))}</option>`;
    })
  ].join('');
  select.value = [...select.options].some((option) => option.value === selected) ? selected : '';
}

function renderPermissionAudit() {
  const list = $('#permissionAuditList');
  if (!list) return;
  if (state.permissionAuditLoading) {
    list.innerHTML = '<div class="permission-audit-empty">Loading audit decisions...</div>';
    return;
  }
  const logs = state.permissionAuditLogs || [];
  $('#permissionAuditCount').textContent = `${logs.length} decision${logs.length === 1 ? '' : 's'}`;
  list.innerHTML = logs.map((entry) => {
    const user = entry.userName || entry.staffId || (entry.userId ? `User ${entry.userId}` : 'Former or system user');
    const identity = entry.staffId && entry.userName ? `${entry.userName} · ${entry.staffId}` : user;
    return `
      <article class="permission-audit-entry ${entry.allowed ? 'is-allowed' : 'is-denied'}">
        <div class="permission-audit-entry-head">
          <div>
            <span class="permission-result-badge">${entry.allowed ? 'Allowed' : 'Denied'}</span>
            <strong>${escapeHtml(permissionActionLabel(entry.action))}</strong>
          </div>
          <time>${escapeHtml(versionHistoryDate(entry.createdAt))}</time>
        </div>
        <div class="permission-audit-entry-grid">
          <div><span>User</span><strong>${escapeHtml(identity)}</strong></div>
          <div><span>Module</span><strong>${escapeHtml(titleCaseMessage(entry.moduleKey))}</strong></div>
          <div><span>Record</span><strong>${entry.recordId ? `#${escapeHtml(entry.recordId)}` : 'Not applicable'}</strong></div>
          <div><span>Reason</span><strong>${escapeHtml(permissionAuditReasonLabel(entry.decisionReason))}</strong></div>
        </div>
      </article>
    `;
  }).join('') || '<div class="permission-audit-empty"><strong>No audit decisions found</strong><span>Try changing the filters or perform an action in a module.</span></div>';
}

async function loadPermissionAudit() {
  const params = new URLSearchParams({ limit: '200' });
  const moduleKey = $('#permissionAuditModuleFilter')?.value || '';
  const action = $('#permissionAuditActionFilter')?.value || '';
  const allowed = $('#permissionAuditResultFilter')?.value || '';
  if (moduleKey) params.set('moduleKey', moduleKey);
  if (action) params.set('action', action);
  if (allowed) params.set('allowed', allowed);
  state.permissionAuditLoading = true;
  renderPermissionAudit();
  try {
    const payload = await api(`/api/sysadmin/permission-audit?${params.toString()}`);
    state.permissionAuditLogs = payload.auditLogs || [];
  } catch (error) {
    state.permissionAuditLogs = [];
    toast(titleCaseMessage(error.message), 'error');
  } finally {
    state.permissionAuditLoading = false;
    renderPermissionAudit();
  }
}

async function openPermissionAuditDrawer() {
  renderPermissionAuditModuleFilter();
  $('#permissionAuditActionFilter').value = '';
  $('#permissionAuditResultFilter').value = '';
  const drawer = $('#permissionAuditDrawer');
  drawer.hidden = false;
  document.body.classList.add('modal-open');
  await loadPermissionAudit();
}

function closePermissionAuditDrawer() {
  const drawer = $('#permissionAuditDrawer');
  if (!drawer) return;
  resetModalFullscreen(drawer);
  drawer.hidden = true;
  document.body.classList.remove('modal-open');
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
      parentValue: node.parentId ? String(node.parentId) : '',
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
  $$('#pageModulePermissionRows [data-permission-picker="departments"]').forEach(syncPermissionHierarchyState);
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
            ${systemView ? `<button type="button" class="link-button table-primary-action" data-open-module-page="${escapeHtml(systemView)}">Open Page</button>` : ''}
            ${runtimeModule ? `<button type="button" class="link-button table-primary-action" data-open-runtime-module="${escapeHtml(module.key)}">Open Page</button>` : ''}
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

function renderModuleCreationSources() {
  const form = $('#moduleForm');
  if (!form) return;
  const reusableForms = state.adminModules.filter((config) => (config.module?.moduleKey || config.moduleKey));
  form.elements.sourceFormKey.innerHTML = reusableForms.length
    ? `<option value="">Choose a Form Builder form</option>${reusableForms.map((config) => {
      const module = config.module || config;
      return `<option value="${escapeHtml(module.moduleKey || module.key)}">${escapeHtml(module.name)} · ${config.fields?.length || 0} fields</option>`;
    }).join('')}`
    : '<option value="">No Form Builder forms available</option>';
  form.elements.templateKey.innerHTML = `<option value="">Choose a template</option>${state.moduleTemplates.map((template) => `<option value="${escapeHtml(template.key)}">${escapeHtml(template.name)} · ${template.fieldCount} fields</option>`).join('')}`;
}

function syncModuleCreationMode() {
  const form = $('#moduleForm');
  if (!form) return;
  const editing = Boolean(form.elements.editingModuleKey.value);
  const mode = form.elements.creationMode?.value || 'scratch';
  $('#moduleCreationModeFields').hidden = editing;
  $('#moduleExistingFormRow').hidden = editing || mode !== 'existing_form';
  $('#moduleTemplateRow').hidden = editing || mode !== 'template';
  form.elements.sourceFormKey.required = !editing && mode === 'existing_form';
  form.elements.templateKey.required = !editing && mode === 'template';
  $$('.module-creation-route').forEach((route) => {
    route.classList.toggle('is-selected', route.querySelector('input')?.checked);
  });
  const template = state.moduleTemplates.find((item) => item.key === form.elements.templateKey.value);
  $('#moduleTemplateDescription').textContent = template?.description || 'Choose a template to preview its purpose.';
}

async function openModuleModal(moduleKey = '') {
  const form = $('#moduleForm');
  const modal = $('#moduleModal');
  if (!form || !modal) return;
  const module = moduleKey ? moduleByKey(moduleKey) : null;
  if (!module) {
    const [modules, templates] = await Promise.all([
      api('/api/sysadmin/modules'),
      api('/api/sysadmin/module-templates')
    ]);
    state.adminModules = modules.modules || [];
    syncConfigModuleCatalog();
    state.moduleTemplates = templates.templates || [];
  }
  form.reset();
  form.dataset.moduleKeyEdited = module ? 'true' : 'false';
  form.elements.editingModuleKey.value = module?.key || '';
  form.elements.name.value = module?.name || '';
  form.elements.moduleKey.value = module?.key || '';
  form.elements.moduleKey.readOnly = Boolean(module);
  form.elements.description.value = module?.description || '';
  form.elements.status.value = module?.status || 'draft';
  form.elements.showInMenu.checked = Boolean(module?.showInMenu);
  renderModuleCreationSources();
  syncModuleCreationMode();
  $('#moduleFormTitle').textContent = module ? 'Edit Module' : 'New Module';
  $('#moduleFormDescription').textContent = module
    ? 'Update publishing, menu visibility, and module details.'
    : 'Choose a starting point, then define how this module should appear.';
  $('#saveModuleButton').textContent = module ? 'Save Module' : 'Create Module';
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
    showInMenu: form.elements.showInMenu.checked,
    creationMode: form.elements.creationMode?.value || 'scratch',
    sourceFormKey: form.elements.sourceFormKey?.value || undefined,
    templateKey: form.elements.templateKey?.value || undefined
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
  container.classList.add('hierarchy');
  const query = state.apiCategorySearch.trim().toLowerCase();
  const categories = [...state.apiConnectorCategories, { categoryKey: '', name: 'Uncategorized', description: '' }]
    .filter((category) => !query || category.name.toLowerCase().includes(query) || category.description?.toLowerCase().includes(query));
  const groupHtml = (scope, label) => {
    const connectors = scope === 'connectors' ? state.apiConnectors : state.apiConnectors.filter((connector) => connectorEndpoints(connector).length);
    const total = scope === 'connectors' ? connectors.length : connectors.reduce((count, connector) => count + connectorEndpoints(connector).length, 0);
    const expanded = state.apiTreeExpanded[scope] || Boolean(query);
    const selectedCategory = state.activeApiTab === scope && state.activeApiCategory !== 'all' ? String(state.activeApiCategory) : null;
    const selectedPath = new Set(selectedCategory === null ? [] : [selectedCategory]);
    const children = categories.map((category, index) => {
      const categoryConnectors = state.apiConnectors.filter((connector) => (connector.categoryKey || '') === category.categoryKey);
      const count = scope === 'connectors' ? categoryConnectors.length : categoryConnectors.reduce((sum, connector) => sum + connectorEndpoints(connector).length, 0);
      const pathClasses = hierarchyNodePathClasses(categories, index, selectedPath, (item) => item.categoryKey);
      return `<div class="hierarchy-node api-tree-child-node ${pathClasses}" style="--hierarchy-depth:1"><button type="button" class="api-tree-node api-tree-child ${state.activeApiTab === scope && state.activeApiCategory === category.categoryKey ? 'is-selected' : ''}" data-api-category="${escapeHtml(category.categoryKey)}" data-api-category-scope="${scope}" title="${escapeHtml(category.description || category.name)}"><span class="api-tree-label">${escapeHtml(category.name)}</span><small class="api-tree-count">${count}</small></button></div>`;
    }).join('');
    const regionId = `api-tree-${scope}-categories`;
    return `<section class="api-tree-group ${expanded ? 'is-expanded' : ''} ${selectedPath.size ? 'has-selected-descendant' : ''}">
      <div class="api-tree-root-row"><button type="button" class="api-tree-toggle" data-api-tree-toggle="${scope}" aria-expanded="${expanded}" aria-controls="${regionId}" aria-label="${expanded ? 'Collapse' : 'Expand'} ${label}">${expanded ? '⌄' : '›'}</button><button type="button" class="api-tree-node api-tree-root ${state.activeApiTab === scope && state.activeApiCategory === 'all' ? 'is-selected' : ''}" data-api-tab="${scope}" data-api-category="all"><span class="api-tree-label">${label}</span><small class="api-tree-count">${total}</small></button></div>
      <div class="hierarchy-branch api-tree-children" id="${regionId}" ${expanded ? '' : 'hidden'}>${children || '<p class="api-tree-empty">No matching categories</p>'}</div>
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
  const childrenByParent = hierarchyChildrenIndex(state.departmentNodes, (node) => node.parentId);
  const selectedPath = hierarchyPathKeys(state.departmentNodes, [state.activeDepartmentNodeId], (node) => node.id, (node) => node.parentId);
  const renderNodes = (nodes, depth = 0) => nodes.map((node, index) => {
    const children = childrenByParent.get(String(node.id)) || [];
    const pathClasses = hierarchyNodePathClasses(nodes, index, selectedPath, (item) => item.id);
    return `<div class="hierarchy-node department-tree-node ${pathClasses}" data-hierarchy-key="${node.id}" style="--hierarchy-depth:${depth}">
      <button type="button" class="department-tree-item ${node.id === state.activeDepartmentNodeId ? 'is-active' : ''}" data-department-node="${node.id}" title="${escapeHtml(node.name)}">
        <span>${escapeHtml(node.name)}</span>
        <small aria-label="${children.length} child items">${children.length}</small>
      </button>
      ${children.length ? `<div class="hierarchy-branch">${renderNodes(children, depth + 1)}</div>` : ''}
    </div>`;
  }).join('');
  tree.classList.add('hierarchy');
  tree.innerHTML = organization ? renderNodes([organization]) : '<p class="muted">Loading organization...</p>';
  const active = departmentNode(state.activeDepartmentNodeId) || organization;
  const visible = departmentChildren(active?.id);
  rows.innerHTML = visible.map((node) => `
    <tr><td><strong>${escapeHtml(node.name)}</strong></td><td>${escapeHtml(titleCaseMessage(node.type))}</td><td>${escapeHtml(node.parentName || '—')}</td><td>${escapeHtml(node.description || '—')}</td><td><span class="status-pill ${node.enabled ? 'status-live' : 'status-draft'}">${node.enabled ? 'Enabled' : 'Disabled'}</span></td><td><button type="button" class="link-button" data-edit-department-node="${node.id}">Edit</button> <button type="button" class="link-button danger-link" data-delete-department-node="${node.id}">Delete</button></td></tr>`).join('') || '<tr><td colspan="6" class="muted">No child units yet.</td></tr>';
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
  const reorderPeers = formDesignReorderPeers(selectedField);
  const selectedIndex = reorderPeers.findIndex((field) => field.fieldKey === state.selectedFormDesignFieldKey);
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
        <button type="button" class="secondary small-button" data-design-action="move-up" ${selectedField && selectedIndex > 0 ? '' : 'disabled'}>Move up</button>
        <button type="button" class="secondary small-button" data-design-action="move-down" ${selectedField && selectedIndex >= 0 && selectedIndex < reorderPeers.length - 1 ? '' : 'disabled'}>Move down</button>
        <button type="button" class="secondary small-button" data-design-action="add-field">Add Field</button>
        <button type="button" class="secondary small-button" data-design-action="edit-field" ${selectedField ? '' : 'disabled'}>Edit Field</button>
        <button type="button" class="secondary small-button" data-design-action="formula" ${selectedField ? '' : 'disabled'}>Formula</button>
        <button type="button" class="secondary small-button" data-design-action="field-linkage" ${selectedField ? '' : 'disabled'}>Field Linkage</button>
      </div>
    </div>
    <p id="formDesignAnnouncement" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p>
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
  canvas.querySelectorAll('[data-design-field]').forEach((card) => {
    card.tabIndex = 0;
    card.setAttribute('aria-label', `${findConfigField(card.dataset.designField)?.label || 'Field'}. Press Enter for arrangement controls.`);
  });
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
  beginBuilderDraft('form');
  document.body.classList.add('modal-open');
}

function closeFormDesignDrawer() {
  if (deferBuilderLeave(['form'], closeFormDesignDrawer)) return;
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
  const [countries, users, customerConfig, userConfig, browserButtons, adminModules, publishedModules, departments, workflowCatalog] = await Promise.all([
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
    state.user?.role === 'admin' ? api('/api/departments') : Promise.resolve({ nodes: [] }),
    api('/api/workflows/catalog').catch(() => ({ definitions: [] }))
  ]);

  state.countries = countries.countries;
  state.users = users.users;
  state.browserButtons = browserButtons.browserButtons || [];
  state.adminModules = adminModules.modules || [];
  state.publishedModules = publishedModules.modules || [];
  state.departmentNodes = departments.nodes || [];
  state.workflowDefinitions = workflowCatalog.definitions || [];
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
  await loadSidebarMenu();
  await loadAccount();
  await loadNotifications();
  window.clearInterval(state.notificationTimer);
  state.notificationTimer = window.setInterval(() => runWorkflowUi(loadNotifications), 30000);
}

function menuStableKey(label, existingKey = '') {
  if (existingKey) return existingKey;
  const base = String(label || 'menu_item').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 68) || 'menu_item';
  const used = new Set((state.menuConfigDraft?.items || []).map((item) => item.key));
  let key = base; let number = 2;
  while (used.has(key)) key = `${base}_${number++}`;
  return key;
}

function menuItemVisibleForPreview(item) {
  if (!item.enabled) return false;
  const role = $('#menuPreviewRole')?.value || 'admin';
  const visibility = item.visibility || {};
  if (!(visibility.roles?.length || visibility.userIds?.length || visibility.departmentIds?.length)) return true;
  return visibility.roles?.includes(role);
}

function menuIcon(icon) {
  const icons = { users: 'U', dashboard: 'D', approval: 'A', module: 'M', settings: 'S', link: '↗', none: '' };
  return Object.prototype.hasOwnProperty.call(icons, icon) ? icons[icon] : String(icon || '').slice(0, 1).toUpperCase();
}

function renderSidebarMenu() {
  const nav = $('#mainSidebarNav');
  if (!nav || !state.sidebarMenu.length) return;
  nav.classList.add('hierarchy');
  const itemsByKey = new Map(state.sidebarMenu.map((item) => [item.key, item]));
  const childrenByParent = new Map();
  state.sidebarMenu.forEach((item) => {
    const parentKey = item.parentKey || '';
    if (!childrenByParent.has(parentKey)) childrenByParent.set(parentKey, []);
    childrenByParent.get(parentKey).push(item);
  });
  childrenByParent.forEach((items) => items.sort((a, b) => a.order - b.order));
  const activeView = Array.from(document.querySelectorAll('.view')).find((view) => !view.hidden)?.id || '';
  const activeEntry = state.sidebarMenu.find((item) => item.type !== 'group' && (item.destination?.type === 'module'
    ? activeView === 'moduleRuntimeView' && item.destination.key === state.activeRuntimeModuleKey
    : item.destination?.key === activeView));
  const currentPath = new Set();
  let current = activeEntry;
  while (current) {
    currentPath.add(current.key);
    current = current.parentKey ? itemsByKey.get(current.parentKey) : null;
  }
  const storageKey = (groupKey) => `crm:navigation-group:${state.user?.id || 'user'}:${groupKey}`;
  const groupOpen = (groupKey) => localStorage.getItem(storageKey(groupKey)) !== 'closed';
  const itemHtml = (item) => {
    const icon = menuIcon(item.icon);
    const visibleIcon = icon || String(item.label || '?').trim().slice(0, 1).toUpperCase();
    if (item.destination?.type === 'external') return `<a class="nav-button nav-link" href="${escapeHtml(item.destination.url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(item.label)}"><span class="nav-menu-icon" aria-hidden="true">${escapeHtml(visibleIcon)}</span><span class="nav-button-label">${escapeHtml(item.label)}</span><span class="external-link-mark" aria-label="External link">↗</span></a>`;
    const displayLabel = item.destination?.type === 'view' && item.destination?.key === 'dashboardPagesView' ? 'Homepage' : item.label;
    const attribute = item.destination?.type === 'module' ? `data-module-view="${escapeHtml(item.destination.key)}"` : `data-view="${escapeHtml(item.destination?.key)}"`;
    return `<button class="nav-button" ${attribute} title="${escapeHtml(displayLabel)}"><span class="nav-menu-icon" aria-hidden="true">${escapeHtml(visibleIcon)}</span><span class="nav-button-label">${escapeHtml(displayLabel)}</span></button>`;
  };
  const renderEntry = (entry, depth = 0) => {
    const children = childrenByParent.get(entry.key) || [];
    const pathClass = currentPath.has(entry.key) ? ' is-current-path' : '';
    if (entry.type !== 'group') {
      return `<div class="hierarchy-node nav-node nav-leaf${pathClass}" data-nav-depth="${depth}" style="--nav-depth:${depth}">${itemHtml(entry)}</div>`;
    }
    const expanded = currentPath.has(entry.key) || groupOpen(entry.key);
    const regionId = `nav-children-${entry.key}`;
    const childHtml = children.map((child) => renderEntry(child, depth + 1)).join('');
    return `<div class="hierarchy-node nav-node nav-group${pathClass}${expanded ? ' is-expanded' : ''}" data-nav-group-key="${escapeHtml(entry.key)}" data-nav-depth="${depth}" style="--nav-depth:${depth}"><button type="button" class="nav-group-trigger" aria-expanded="${expanded}" aria-controls="${escapeHtml(regionId)}" title="${escapeHtml(entry.label)}"><span class="nav-menu-icon" aria-hidden="true">${escapeHtml(menuIcon(entry.icon) || String(entry.label || '?').trim().slice(0, 1).toUpperCase())}</span><span class="nav-group-label">${escapeHtml(entry.label)}</span><span class="nav-disclosure" aria-hidden="true"></span></button><div class="nav-children" id="${escapeHtml(regionId)}" aria-hidden="${!expanded}"><div class="hierarchy-branch nav-branch">${childHtml}</div></div></div>`;
  };
  nav.innerHTML = (childrenByParent.get('') || []).map((entry) => renderEntry(entry)).join('');
  nav.querySelectorAll('.nav-children[aria-hidden="true"]').forEach((region) => { region.inert = true; });
  syncSidebarCurrentState();
}

function setSidebarGroupExpanded(group, expanded, persist = true) {
  if (!group) return;
  const open = Boolean(expanded);
  group.classList.toggle('is-expanded', open);
  group.querySelector(':scope > .nav-group-trigger')?.setAttribute('aria-expanded', String(open));
  const region = group.querySelector(':scope > .nav-children');
  if (region) {
    region.setAttribute('aria-hidden', String(!open));
    region.inert = !open;
  }
  if (persist) localStorage.setItem(`crm:navigation-group:${state.user?.id || 'user'}:${group.dataset.navGroupKey}`, open ? 'open' : 'closed');
}

function syncSidebarCurrentState() {
  const nav = $('#mainSidebarNav');
  if (!nav) return;
  const activeView = Array.from(document.querySelectorAll('.view')).find((view) => !view.hidden)?.id || '';
  nav.querySelectorAll('.nav-node').forEach((node) => node.classList.remove('is-current-path', 'is-current-rail-through', 'is-current-rail-entry'));
  nav.querySelectorAll('.nav-button').forEach((button) => {
    const active = button.dataset.moduleView
      ? activeView === 'moduleRuntimeView' && button.dataset.moduleView === state.activeRuntimeModuleKey
      : button.dataset.view === activeView;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-current', button.classList.contains('is-active') ? 'page' : 'false');
  });
  let pathNode = nav.querySelector('.nav-button.is-active')?.closest('.nav-node');
  while (pathNode) {
    pathNode.classList.add('is-current-path');
    const branch = pathNode.parentElement;
    if (!branch?.classList.contains('nav-branch')) break;
    for (const sibling of branch.children) {
      if (sibling === pathNode) {
        sibling.classList.add('is-current-rail-entry');
        break;
      }
      sibling.classList.add('is-current-rail-through');
    }
    pathNode = branch.closest('.nav-node');
  }
  nav.querySelectorAll('.nav-group').forEach((group) => {
    const active = Boolean(group.querySelector('.nav-button.is-active'));
    group.classList.toggle('has-current-page', active);
    if (active) setSidebarGroupExpanded(group, true, false);
  });
}

function setMainSidebarCompact(compact, persist = true) {
  state.sidebarCompact = Boolean(compact);
  document.body.classList.toggle('main-sidebar-compact', state.sidebarCompact);
  const button = $('#toggleMainSidebar');
  if (button) {
    button.setAttribute('aria-pressed', String(state.sidebarCompact));
    button.setAttribute('aria-label', state.sidebarCompact ? 'Use expanded navigation' : 'Use compact navigation');
    button.title = state.sidebarCompact ? 'Use expanded navigation' : 'Use compact navigation';
    button.querySelector('span').textContent = state.sidebarCompact ? '»' : '«';
  }
  if (persist) localStorage.setItem(`crm:navigation-compact:${state.user?.id || 'user'}`, String(state.sidebarCompact));
}

async function loadSidebarMenu() {
  const payload = await api('/api/menu/sidebar').catch(() => ({ items: [] }));
  state.sidebarMenu = payload.items || [];
  setMainSidebarCompact(localStorage.getItem(`crm:navigation-compact:${state.user?.id || 'user'}`) === 'true', false);
  renderSidebarMenu();
}

function menuVisibilityChecks(kind, values, selected) {
  return values.map((value) => `<label class="menu-visibility-option"><input type="checkbox" data-menu-visibility="${kind}" value="${escapeHtml(value.id ?? value.value)}" ${(selected || []).map(String).includes(String(value.id ?? value.value)) ? 'checked' : ''}><span><strong>${escapeHtml(value.name ?? value.label)}</strong>${value.email ? `<small>${escapeHtml(value.email)}</small>` : ''}</span></label>`).join('') || '<p class="muted">No options available.</p>';
}

function renderMenuConfigInspector() {
  const inspector = $('#menuConfigInspector');
  if (!inspector) return;
  const item = state.menuConfigDraft?.items?.find((entry) => entry.key === state.selectedMenuItemKey);
  if (!item) { inspector.innerHTML = '<div class="empty-state"><h3>Select an entry</h3><p>Choose a group or menu item to configure it.</p></div>'; return; }
  const destinationValue = item.destination?.type === 'external' ? 'external' : `${item.destination?.type || 'view'}:${item.destination?.key || ''}`;
  const groups = state.menuConfigDraft.items.filter((group) => {
    if (group.type !== 'group' || group.key === item.key || group.key === item.parentKey) return false;
    let ancestor = group;
    const seen = new Set();
    while (ancestor?.parentKey && !seen.has(ancestor.key)) {
      seen.add(ancestor.key);
      if (ancestor.parentKey === item.key) return false;
      ancestor = state.menuConfigDraft.items.find((entry) => entry.key === ancestor.parentKey);
    }
    return true;
  });
  inspector.innerHTML = `<div class="menu-inspector-title"><span class="menu-tree-symbol">${item.type === 'group' ? 'G' : 'I'}</span><div><h3>${escapeHtml(item.label)}</h3><small>${escapeHtml(item.key)} · automatic</small></div></div>
    <label>Label<input data-menu-field="label" value="${escapeHtml(item.label)}"></label>
    <label>Stable key (automatic)<input value="${escapeHtml(item.key)}" disabled></label>
    <label>Icon<select data-menu-field="icon">${['none','users','dashboard','approval','module','settings','link'].map((icon) => `<option value="${icon}" ${item.icon === icon ? 'selected' : ''}>${icon === 'none' ? 'No icon' : icon[0].toUpperCase() + icon.slice(1)}</option>`).join('')}</select></label>
    <label class="checkbox-label"><input type="checkbox" data-menu-field="enabled" ${item.enabled ? 'checked' : ''} ${item.systemKey === 'admin_portal' ? 'disabled' : ''}><span><strong>Show this entry</strong><small>Visibility never grants backend permission.</small></span></label>
    ${item.type === 'item' ? `<label>Destination<select data-menu-field="destination" ${item.systemKey === 'admin_portal' ? 'disabled' : ''}>${state.menuConfigCatalog.destinations.map((destination) => `<option value="${destination.type}:${destination.key}" ${destinationValue === `${destination.type}:${destination.key}` ? 'selected' : ''}>${escapeHtml(destination.label)}</option>`).join('')}<option value="external" ${destinationValue === 'external' ? 'selected' : ''}>External HTTPS link</option></select></label>${destinationValue === 'external' ? `<label>HTTPS URL<input type="url" data-menu-field="externalUrl" value="${escapeHtml(item.destination?.url || '')}" placeholder="https://example.com"></label>` : ''}` : ''}
    <label>Move to group<select id="menuMoveGroup" ${!groups.length || item.systemKey === 'admin_portal' ? 'disabled' : ''}><option value="">Choose a group</option>${groups.map((group) => `<option value="${escapeHtml(group.key)}">${escapeHtml(group.label)}</option>`).join('')}</select></label>
    <div class="menu-move-controls" aria-label="Move ${escapeHtml(item.label)}"><button type="button" class="secondary" data-move-menu="up" ${item.systemKey === 'admin_portal' || menuSiblings(item.parentKey)[0]?.key === item.key ? 'disabled' : ''}>Move up</button><button type="button" class="secondary" data-move-menu="down" ${item.systemKey === 'admin_portal' || menuSiblings(item.parentKey).at(-1)?.key === item.key ? 'disabled' : ''}>Move down</button><button type="button" class="secondary" data-move-menu="into" disabled>Move into group</button><button type="button" class="secondary" data-move-menu="out" ${!item.parentKey || item.systemKey === 'admin_portal' ? 'disabled' : ''}>Move out of group</button></div>
    ${item.systemKey === 'admin_portal' ? '<div class="menu-config-notice">Admin Portal is protected so administrators cannot be locked out.</div>' : `<details open><summary>Visibility rules</summary><p class="muted">Leave all choices empty to show this entry to everyone with permission.</p><h4>Roles</h4><div class="menu-visibility-grid">${menuVisibilityChecks('roles', [{value:'admin',label:'Admin'},{value:'manager',label:'Manager'},{value:'user',label:'User'}], item.visibility?.roles)}</div><h4>Users</h4><div class="menu-visibility-scroll">${menuVisibilityChecks('userIds', state.menuConfigCatalog.users, item.visibility?.userIds)}</div><h4>Departments</h4><div class="menu-visibility-scroll">${menuVisibilityChecks('departmentIds', state.menuConfigCatalog.departments, item.visibility?.departmentIds)}</div></details><button type="button" class="danger-button full-width" data-remove-menu-item>Remove entry</button>`}`;
}

function menuSiblings(parentKey, excludeKey = '') {
  return (state.menuConfigDraft?.items || []).filter((item) => (item.parentKey || null) === (parentKey || null) && item.key !== excludeKey).sort((a, b) => a.order - b.order);
}

function menuDescendantKeys(parentKey) {
  const descendants = new Set();
  const visit = (key) => {
    (state.menuConfigDraft?.items || []).filter((item) => item.parentKey === key).forEach((item) => {
      if (descendants.has(item.key)) return;
      descendants.add(item.key);
      visit(item.key);
    });
  };
  visit(parentKey);
  return descendants;
}

function announceMenuMove(message) {
  const output = $('#menuConfigAnnouncement');
  if (output) output.textContent = message;
}

function normalizeMenuSiblingOrders(parentKey) {
  menuSiblings(parentKey).forEach((item, index) => { item.order = index + 1; });
}

function moveMenuItem(sourceKey, targetKey, placement = 'before') {
  const items = state.menuConfigDraft?.items || [];
  const source = items.find((item) => item.key === sourceKey);
  const target = items.find((item) => item.key === targetKey);
  if (!source || !target || source === target || source.systemKey === 'admin_portal') return false;
  let ancestor = target;
  while (ancestor?.parentKey) {
    if (ancestor.parentKey === source.key) return false;
    ancestor = items.find((item) => item.key === ancestor.parentKey);
  }
  const oldParent = source.parentKey || null;
  const nextParent = placement === 'inside' && target.type === 'group' ? target.key : (target.parentKey || null);
  source.parentKey = nextParent;
  const siblings = menuSiblings(nextParent, source.key);
  const targetIndex = siblings.findIndex((item) => item.key === target.key);
  const insertionIndex = placement === 'inside' ? siblings.length : Math.max(0, targetIndex + (placement === 'after' ? 1 : 0));
  siblings.splice(insertionIndex, 0, source);
  siblings.forEach((item, index) => { item.order = index + 1; });
  normalizeMenuSiblingOrders(oldParent);
  state.selectedMenuItemKey = source.key;
  announceMenuMove(`${source.label} moved ${placement === 'inside' ? `into ${target.label}` : `${placement} ${target.label}`}.`);
  renderMenuConfig();
  return true;
}

function menuDropPlacement(row, clientY) {
  const target = state.menuConfigDraft?.items?.find((item) => item.key === row?.dataset.menuItemKey);
  if (!row || !target) return 'after';
  const bounds = row.getBoundingClientRect();
  const ratio = (clientY - bounds.top) / Math.max(1, bounds.height);
  if (target.type === 'group' && ratio >= .3 && ratio <= .7) return 'inside';
  return ratio < .5 ? 'before' : 'after';
}

function showMenuDropTarget(row, placement) {
  $$('#menuConfigTree [data-menu-item-key]').forEach((item) => item.classList.remove('is-drop-before', 'is-drop-inside', 'is-drop-after'));
  row?.classList.add(`is-drop-${placement}`);
  state.menuDropTarget = row ? { key: row.dataset.menuItemKey, placement } : null;
}

let reorderScrollFrame = null;
function stopReorderAutoScroll() {
  cancelAnimationFrame(reorderScrollFrame);
  reorderScrollFrame = null;
}

function autoScrollReorderSurface(surface, clientY, clientX) {
  stopReorderAutoScroll();
  if (!surface) return;
  while (surface && surface.scrollHeight <= surface.clientHeight) surface = surface.parentElement;
  if (!surface) return;
  const bounds = surface.getBoundingClientRect();
  const edge = Math.min(56, bounds.height * .18);
  const delta = clientY < bounds.top + edge ? -Math.min(16, Math.ceil((bounds.top + edge - clientY) / 4)) : clientY > bounds.bottom - edge ? Math.min(16, Math.ceil((clientY - (bounds.bottom - edge)) / 4)) : 0;
  if (!delta) return;
  const scroll = () => {
    const previous = surface.scrollTop;
    surface.scrollTop += delta;
    if (surface.scrollTop === previous) { reorderScrollFrame = null; return; }
    if (Number.isFinite(clientX)) {
      const hit = document.elementFromPoint(clientX, clientY);
      if (state.draggingMenuItemKey) {
        const row = hit?.closest('#menuConfigTree [data-menu-item-key]');
        showMenuDropTarget(row, menuDropPlacement(row, clientY));
      } else if (state.draggingFormDesignFieldKey) {
        const card = hit?.closest('#formDesignCanvas [data-design-field]');
        state.dragOverFormDesignFieldKey = card?.dataset.designField || '';
        state.formDesignDropPlacement = formDesignDropPlacement(card, clientY);
        $$('#formDesignCanvas [data-design-field]').forEach((item) => {
          item.classList.toggle('is-drop-before', item === card && state.formDesignDropPlacement === 'before');
          item.classList.toggle('is-drop-after', item === card && state.formDesignDropPlacement === 'after');
        });
      }
    }
    reorderScrollFrame = requestAnimationFrame(scroll);
  };
  reorderScrollFrame = requestAnimationFrame(scroll);
}

function renderMenuConfig() {
  const tree = $('#menuConfigTree');
  if (!tree || !state.menuConfigDraft) return;
  const items = state.menuConfigDraft.items || [];
  const row = (item, depth = 0) => `<button type="button" role="treeitem" draggable="true" class="menu-tree-item ${depth ? 'is-nested' : ''} ${item.key === state.selectedMenuItemKey ? 'is-selected' : ''} ${!menuItemVisibleForPreview(item) ? 'is-preview-hidden' : ''}" data-menu-item-key="${escapeHtml(item.key)}" aria-grabbed="${item.key === state.draggingMenuItemKey}"><span class="menu-tree-grip" aria-hidden="true">⋮⋮</span><span class="menu-tree-symbol">${item.type === 'group' ? 'G' : menuIcon(item.icon) || 'I'}</span><span><strong>${escapeHtml(item.label)}</strong><small>${item.type === 'group' ? 'Group · drop here to add inside' : item.destination?.type === 'external' ? 'External link' : item.destination?.key || 'Choose destination'}</small></span><span class="menu-tree-state">${item.enabled ? '' : 'Hidden'}</span></button>`;
  const roots = items.filter((item) => !item.parentKey).sort((a,b) => a.order-b.order);
  const childrenByParent = hierarchyChildrenIndex(items, (item) => item.parentKey);
  childrenByParent.forEach((children) => children.sort((a, b) => a.order - b.order));
  const selectedPath = hierarchyPathKeys(items, [state.selectedMenuItemKey], (item) => item.key, (item) => item.parentKey);
  const renderTreeEntries = (siblings, depth = 0) => siblings.map((item, index) => {
    const children = item.type === 'group' ? childrenByParent.get(String(item.key)) || [] : [];
    const pathClasses = hierarchyNodePathClasses(siblings, index, selectedPath, (entry) => entry.key);
    return `<div class="hierarchy-node menu-tree-node ${pathClasses}" style="--hierarchy-depth:${depth}">${row(item, depth)}${children.length ? `<div class="hierarchy-branch">${renderTreeEntries(children, depth + 1)}</div>` : ''}</div>`;
  }).join('');
  tree.classList.add('hierarchy');
  tree.innerHTML = renderTreeEntries(roots) || '<div class="empty-state"><h3>No menu entries</h3><p>Add a group or item to begin.</p></div>';
  const groupSelect = $('#menuDefaultGroup');
  if (groupSelect) { groupSelect.innerHTML = `<option value="">Top level</option>${items.filter((item) => item.type === 'group').map((group) => `<option value="${escapeHtml(group.key)}" ${state.menuConfigDraft.defaultModuleGroupKey === group.key ? 'selected' : ''}>${escapeHtml(group.label)}</option>`).join('')}`; }
  renderMenuConfigInspector();
}

function renderMenuVersions() {
  const target = $('#menuConfigVersions'); if (!target) return;
  target.innerHTML = state.menuConfigVersions.map((version) => `<div class="menu-version-row"><span><strong>Version ${version.version_number}</strong><small>${escapeHtml(version.created_by_name || 'System')} · ${escapeHtml(versionHistoryDate(version.created_at))}</small></span><button type="button" class="secondary" data-restore-menu-version="${version.id}">Restore to draft</button></div>`).join('') || '<p class="muted">No menu has been published yet.</p>';
}

async function loadMenuConfiguration() {
  const [configuration, catalog, versions] = await Promise.all([api('/api/menu/configuration'), api('/api/menu/configuration/catalog'), api('/api/menu/configuration/versions')]);
  state.menuConfigDraft = configuration.draft;
  state.menuConfigCatalog = catalog;
  state.menuConfigVersions = versions.versions || [];
  state.selectedMenuItemKey = state.menuConfigDraft.items?.[0]?.key || '';
  $('#menuConfigStatus').textContent = `Draft loaded · Published version ${configuration.publishedVersion || 0}`;
  renderMenuConfig(); renderMenuVersions();
  beginBuilderDraft('menu');
}

async function saveMenuConfiguration(publish = false) {
  const path = publish ? '/api/menu/configuration/publish' : '/api/menu/configuration/draft';
  const payload = await api(path, { method: publish ? 'POST' : 'PUT', body: JSON.stringify(state.menuConfigDraft) });
  state.menuConfigDraft = payload.config;
  beginBuilderDraft('menu');
  if (publish) { await loadSidebarMenu(); await loadMenuConfiguration(); }
  toast(publish ? 'Sidebar Menu Published.' : 'Menu Draft Saved.');
}

function accountInitials(name = state.account?.name || state.user?.name || 'A') {
  return String(name).trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase() || 'A';
}

function setAccountAvatarElements(url = '') {
  ['header', 'menu', 'settings', 'profile'].forEach((prefix) => {
    const image = $(`#${prefix}AvatarImage`); const initials = $(`#${prefix}AvatarInitials`);
    if (!image || !initials) return;
    image.hidden = !url; initials.hidden = Boolean(url);
    if (url) image.src = url; else image.removeAttribute('src');
    initials.textContent = accountInitials();
  });
}

async function loadAccountAvatar() {
  if (state.accountAvatarUrl) { URL.revokeObjectURL(state.accountAvatarUrl); state.accountAvatarUrl = ''; }
  if (!state.account?.hasAvatar) { setAccountAvatarElements(''); return; }
  const response = await fetch('/api/account/avatar', { headers: { Authorization: `Bearer ${await currentAuthToken()}` } });
  if (!response.ok) { setAccountAvatarElements(''); return; }
  state.accountAvatarUrl = URL.createObjectURL(await response.blob());
  setAccountAvatarElements(state.accountAvatarUrl);
}

function renderAccount() {
  const account = state.account; if (!account) return;
  state.user = { ...state.user, name: account.name };
  const storage = state.rememberSession ? localStorage : sessionStorage;
  storage.setItem(authStorageKeys.user, JSON.stringify(state.user));
  $('#sessionLabel').textContent = `${account.name} · ${account.role}`;
  $('#headerAccountName').textContent = account.name;
  $('#headerAccountRole').textContent = account.role;
  $('#menuAccountName').textContent = account.name; $('#menuAccountEmail').textContent = account.email;
  $('#settingsAccountName').textContent = account.name; $('#settingsAccountEmail').textContent = account.email;
  const profile = $('#accountProfileForm'); profile.elements.name.value = account.name; profile.elements.phone.value = account.phone; profile.elements.jobTitle.value = account.jobTitle;
  $('#accountManagedEmail').textContent = account.email; $('#accountManagedStaffId').textContent = account.staffId || 'Not assigned'; $('#accountManagedRole').textContent = account.role; $('#accountManagedDepartment').textContent = account.departmentName; $('#accountManagedStatus').textContent = account.status;
  const preferences = $('#accountPreferencesForm'); preferences.elements.language.value = account.language; preferences.elements.timezone.value = account.timezone; preferences.elements.dateFormat.value = account.dateFormat; preferences.elements.timeFormat.value = account.timeFormat;
  setAccountAvatarElements(state.accountAvatarUrl);
}

async function loadAccount() {
  const payload = await api('/api/account'); state.account = payload.account; renderAccount(); await loadAccountAvatar();
}

function toggleAccountMenu(force) {
  const menu = $('#accountMenu'); const button = $('#accountMenuButton');
  const open = force === undefined ? button.getAttribute('aria-expanded') !== 'true' : Boolean(force);
  setFloatingSurfaceOpen(menu, button, open, { container: $('#accountHub') });
  button.setAttribute('aria-expanded', String(open));
  if (open) toggleNotificationDrawer(false);
}

function selectAccountTab(tab) {
  state.activeAccountTab = tab;
  const ids = { profile: 'accountProfilePanel', security: 'accountSecurityPanel', preferences: 'accountPreferencesPanel' };
  Object.entries(ids).forEach(([key, id]) => { $(`#${id}`).hidden = key !== tab; });
  $$('[data-account-tab]').forEach((button) => button.classList.toggle('is-active', button.dataset.accountTab === tab));
}

async function openAccountSettings(tab = 'profile') {
  const visible = $$('.view').find((view) => !view.hidden && view.id !== 'accountSettingsView');
  if (visible) state.accountReturnView = visible.id;
  toggleAccountMenu(false); showView('accountSettingsView'); selectAccountTab(tab); await loadAccount();
}

async function saveAccountProfile(event) {
  event.preventDefault(); const payload = await api('/api/account/profile', { method: 'PATCH', body: JSON.stringify(serializeForm(event.currentTarget)) });
  state.account = payload.account; renderAccount(); toast('Profile Saved.');
}

async function saveAccountPreferences(event) {
  event.preventDefault(); const payload = await api('/api/account/preferences', { method: 'PUT', body: JSON.stringify(serializeForm(event.currentTarget)) });
  state.account = payload.account; renderAccount(); toast('Preferences Saved.');
}

async function changeAccountPassword(event) {
  event.preventDefault(); await api('/api/account/password', { method: 'POST', body: JSON.stringify(serializeForm(event.currentTarget)) });
  event.currentTarget.reset(); clearSession(); configureAuthUi(); toast('Password Changed. Sign In Again.');
}

async function uploadAccountAvatar(file) {
  if (!file) return; const body = new FormData(); body.append('avatar', file);
  const payload = await api('/api/account/avatar', { method: 'POST', body }); state.account = payload.account; await loadAccountAvatar(); renderAccount(); toast('Profile Photo Updated.');
}

async function removeAccountAvatar() {
  await api('/api/account/avatar', { method: 'DELETE' }); state.account.hasAvatar = false; await loadAccountAvatar(); renderAccount(); toast('Profile Photo Removed.');
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
  initializeBuilderDraftControls();
  ['pointerup', 'pointercancel', 'drop', 'dragend'].forEach((type) => window.addEventListener(type, stopReorderAutoScroll));
  window.addEventListener('blur', stopReorderAutoScroll);
  $('#dismissToast')?.addEventListener('click', dismissToast);
  $('#toast')?.addEventListener('mouseenter', pauseToastDismiss);
  $('#toast')?.addEventListener('mouseleave', resumeToastDismiss);
  $('#toast')?.addEventListener('focusin', pauseToastDismiss);
  $('#toast')?.addEventListener('focusout', resumeToastDismiss);
  document.addEventListener('invalid', (event) => {
    if (event.target.matches('input, select, textarea')) showFieldError(event.target);
  }, true);
  document.addEventListener('input', (event) => {
    if (event.target.matches('input, select, textarea') && event.target.validity.valid) clearFieldError(event.target);
  });
  document.addEventListener('change', (event) => {
    if (event.target.matches('select, input[type="checkbox"], input[type="radio"]') && event.target.validity.valid) clearFieldError(event.target);
  });
  $('#notificationBell')?.addEventListener('click', () => toggleNotificationDrawer());
  $('#accountMenuButton')?.addEventListener('click', () => toggleAccountMenu());
  $('#accountMenu')?.addEventListener('click', (event) => {
    const settingsButton = event.target.closest('[data-open-account-settings]');
    if (settingsButton) return runWorkflowUi(() => openAccountSettings(settingsButton.dataset.openAccountSettings));
    if (event.target.closest('[data-open-admin-portal]') && state.user?.role === 'admin') { toggleAccountMenu(false); showView('sysadminView'); }
  });
  $$('[data-account-tab]').forEach((button) => button.addEventListener('click', () => selectAccountTab(button.dataset.accountTab)));
  $('#backFromAccountSettings')?.addEventListener('click', () => showView(state.accountReturnView || 'customersView'));
  bindAsyncSubmit($('#accountProfileForm'), (event) => runWorkflowUi(() => saveAccountProfile(event)));
  bindAsyncSubmit($('#accountPreferencesForm'), (event) => runWorkflowUi(() => saveAccountPreferences(event)));
  bindAsyncSubmit($('#accountPasswordForm'), (event) => runWorkflowUi(() => changeAccountPassword(event)));
  $('#accountAvatarInput')?.addEventListener('change', (event) => runWorkflowUi(() => uploadAccountAvatar(event.target.files?.[0])));
  $('#removeAccountAvatar')?.addEventListener('click', () => runWorkflowUi(removeAccountAvatar));
  $('#notificationUnreadOnly')?.addEventListener('change', (event) => { state.notificationUnreadOnly = event.target.checked; runWorkflowUi(loadNotifications); });
  $('#markAllNotificationsRead')?.addEventListener('click', () => runWorkflowUi(async () => { await api('/api/notifications/read-all', { method: 'POST', body: '{}' }); await loadNotifications(); }));
  $('#notificationList')?.addEventListener('click', (event) => { const button = event.target.closest('[data-notification-id]'); if (!button) return; const item = state.notifications.find((entry) => entry.id === Number(button.dataset.notificationId)); if (item) runWorkflowUi(() => openNotification(item)); });
  bindAsyncSubmit($('#emailSettingsForm'), (event) => runWorkflowUi(() => saveEmailSettings(event)));
  $('#emailSettingsForm select[name="provider"]')?.addEventListener('change', syncEmailProviderExamples);
  $('#sendTestEmail')?.addEventListener('click', () => runWorkflowUi(sendEmailSettingsTest));
  bindAsyncSubmit($('#loginForm'), async (event) => {
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

  $('#mainSidebarNav')?.addEventListener('click', (event) => {
    const groupTrigger = event.target.closest('.nav-group-trigger');
    if (groupTrigger) {
      const group = groupTrigger.closest('[data-nav-group-key]');
      const expanded = groupTrigger.getAttribute('aria-expanded') === 'true';
      if (group?.classList.contains('has-current-page') && expanded) return;
      setSidebarGroupExpanded(group, !expanded);
      return;
    }
    const button = event.target.closest('[data-module-view]');
    if (button && state.token) return openRuntimeModulePage(button.dataset.moduleView).catch((error) => toast(titleCaseMessage(error.message), 'error'));
    const viewButton = event.target.closest('[data-view]');
    if (!viewButton) return;
    if (!state.token) return showView('loginView');
    showView(viewButton.dataset.view);
    if (viewButton.dataset.view === 'dashboardPagesView') loadPublishedDashboards().catch((error) => toast(titleCaseMessage(error.message), 'error'));
    if (viewButton.dataset.view === 'workflowRequestsView') runWorkflowUi(loadWorkflowRequests);
    if (viewButton.dataset.view === 'workflowMonitoringView') runWorkflowUi(loadWorkflowMonitoring);
    if (viewButton.dataset.view === 'workflowDelegationView') runWorkflowUi(loadWorkflowDelegations);
  });
  $('#toggleMainSidebar')?.addEventListener('click', () => setMainSidebarCompact(!state.sidebarCompact));
  document.addEventListener('click', (event) => {
    if (!event.target.closest('#accountHub')) toggleAccountMenu(false);
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
      if (button.dataset.adminSection === 'adminDashboardSourcesSection') {
        try {
          await loadDashboardSources();
        } catch (error) {
          toast(titleCaseMessage(error.message), 'error');
        }
      }
      if (button.dataset.adminSection === 'adminDashboardBuilderSection') {
        try {
          showDashboardManagement();
          await loadDashboards();
        } catch (error) {
          toast(titleCaseMessage(error.message), 'error');
        }
      }
      if (button.dataset.adminSection === 'adminActionFlowSection') {
        try {
          await loadActionFlows();
        } catch (error) {
          toast(titleCaseMessage(error.message), 'error');
        }
      }
      if (button.dataset.adminSection === 'adminWorkflowSection') {
        try {
          await loadWorkflowDefinitions();
        } catch (error) {
          toast(titleCaseMessage(error.message), 'error');
        }
      }
      if (button.dataset.adminSection === 'adminDocumentTemplatesSection') {
        closeDocumentDesigner();
        renderDocumentTemplateList();
        await loadServerDocumentTemplates().catch((error) => toast(error.message, 'error'));
      }
    });
  });
  $('#newDocumentTemplateButton')?.addEventListener('click', () => {
    state.documentImportResult = null; $('#documentPdfImportForm').hidden = true; $('#documentImportSummary').innerHTML = ''; $('#importAnalyzedDocument').hidden = true; $('#documentCreateDialog').showModal();
  });
  $('#closeDocumentCreateDialog')?.addEventListener('click', () => $('#documentCreateDialog').close());
  $('#documentCreateDialog')?.addEventListener('click', (event) => {
    const start = event.target.closest('[data-document-start]'); if (!start) return;
    if (start.dataset.documentStart === 'pdf') { $('#documentPdfImportForm').hidden = false; $('#documentPdfFile').focus(); return; }
    const template = start.dataset.documentStart === 'duplicate' ? duplicateDocumentTemplate() : blankDocumentTemplate();
    state.documentTemplates.unshift(template); $('#documentCreateDialog').close(); openDocumentDesigner(template.templateKey);
  });
  $('#documentPdfImportForm')?.addEventListener('submit', analyzeDocumentPdf);
  $('#importAnalyzedDocument')?.addEventListener('click', importAnalyzedDocument);
  $('#documentTemplateList')?.addEventListener('click', (event) => {
    const open = event.target.closest('[data-open-document-template]'); const preview = event.target.closest('[data-preview-document-template]');
    if (open) openDocumentDesigner(open.dataset.openDocumentTemplate);
    if (preview) openDocumentDesigner(preview.dataset.previewDocumentTemplate, true);
  });
  $('#closeDocumentDesigner')?.addEventListener('click', closeDocumentDesigner);
  $('#documentDesignMode')?.addEventListener('click', () => { state.documentDesignerMode = 'design'; renderDocumentDesigner(); });
  $('#documentPreviewMode')?.addEventListener('click', () => { state.documentDesignerMode = 'preview'; renderDocumentDesigner(); });
  $('#documentCompareMode')?.addEventListener('change', (event) => { state.documentCompareMode = event.target.value; renderDocumentDesigner(); });
  $('#documentOriginalOpacity')?.addEventListener('input', renderDocumentDesigner);
  $('#documentPreviousPage')?.addEventListener('click', () => { state.documentPageIndex = Math.max(0, state.documentPageIndex - 1); state.documentSelectedElementId = ''; state.documentSelectedCell = null; renderDocumentDesigner(); });
  $('#documentNextPage')?.addEventListener('click', () => { state.documentPageIndex = Math.min(documentPhysicalPages().length - 1, state.documentPageIndex + 1); state.documentSelectedElementId = ''; state.documentSelectedCell = null; renderDocumentDesigner(); });
  for (const id of ['documentOutputRecordId', 'documentOutputWorkflowId']) $(`#${id}`)?.addEventListener('change', () => { if (state.documentDesignerMode === 'preview') renderDocumentDesigner(); });
  $('#downloadDocumentPdf')?.addEventListener('click', async () => {
    const template = activeDocumentTemplate(); if (!template) return;
    const current = structuredClone(template); delete current.serverRevision; delete current.serverSnapshot; delete current.hasSourcePdf;
    if (!template.serverRevision || JSON.stringify(current) !== template.serverSnapshot || $('#documentTemplateName').value.trim() !== template.name) { $('#documentOutputStatus').textContent = 'Save your current template to the server before downloading.'; return; }
    try { await downloadSavedDocumentPdf(template.templateKey, { ...documentOutputContext(), revision: template.serverRevision }, $('#downloadDocumentPdf')); $('#documentOutputStatus').textContent = 'PDF downloaded. Your draft is unchanged.'; }
    catch (error) { $('#documentOutputStatus').textContent = error.message; }
  });
  $('#documentZoom')?.addEventListener('input', renderDocumentDesigner);
  $('#saveDocumentTemplate')?.addEventListener('click', saveDocumentTemplate);
  $('#printDocumentTemplate')?.addEventListener('click', async () => {
    state.documentDesignerMode = 'preview'; renderDocumentDesigner();
    try { await updateDocumentOutputPreview(); $('#documentOutputPreview').contentWindow.print(); }
    catch (error) { $('#documentOutputStatus').textContent = error.message; }
  });
  $('#closeRecordDocument')?.addEventListener('click', () => $('#recordDocumentDialog').close());
  $('#recordDocumentTemplate')?.addEventListener('change', () => { $('#recordDocumentFrame').hidden = true; });
  $('#recordDocumentPreview')?.addEventListener('click', async () => {
    const key = $('#recordDocumentTemplate').value; if (!key) return;
    const { moduleKey, ...input } = recordDocumentContext;
    try { const resolved = await api(`/api/document-templates/${encodeURIComponent(key)}/preview`, { method: 'POST', body: JSON.stringify(input) }); await mountDocumentOutputFrame($('#recordDocumentFrame'), resolved.template, resolved.context, 75); $('#recordDocumentStatus').textContent = 'Preview uses the same renderer as Download PDF.'; }
    catch (error) { $('#recordDocumentStatus').textContent = error.message; }
  });
  $('#recordDocumentDownload')?.addEventListener('click', async () => {
    const key = $('#recordDocumentTemplate').value; if (!key) return;
    const { moduleKey, ...input } = recordDocumentContext;
    try { await downloadSavedDocumentPdf(key, input, $('#recordDocumentDownload')); $('#recordDocumentStatus').textContent = 'PDF downloaded.'; }
    catch (error) { $('#recordDocumentStatus').textContent = error.message; }
  });
  $('#customerDocumentOutput')?.addEventListener('click', () => { const recordId = Number($('#customerForm').elements.id.value); if (recordId) void openRecordDocumentOutput({ moduleKey: 'customers', recordId }); else toast('Save the record first.'); });
  $('#moduleDocumentOutput')?.addEventListener('click', () => { const recordId = Number($('#moduleRecordForm').elements.id.value); if (recordId) void openRecordDocumentOutput({ moduleKey: state.activeRuntimeModuleKey, recordId }); else toast('Save the record first.'); });
  $('#workflowRequestDetail')?.addEventListener('click', (event) => { if (event.target.closest('[data-workflow-document-output]')) void openRecordDocumentOutput({ workflowRequestId: state.activeWorkflowRequestKey }); });
  $('#documentUndo')?.addEventListener('click', () => restoreDocumentHistory(false));
  $('#documentRedo')?.addEventListener('click', () => restoreDocumentHistory(true));
  $$('#documentDesignerWorkspace [data-add-document-element]').forEach((button) => button.addEventListener('click', () => insertDocumentElement(button.dataset.addDocumentElement)));
  $('#documentTemplateSource')?.addEventListener('change', (event) => { const template = activeDocumentTemplate(); if (!template) return; captureDocumentHistory(); template.source = event.target.value; renderDocumentDesigner(); });
  $('#documentPage')?.addEventListener('click', (event) => {
    if (state.documentDesignerMode === 'preview') return;
    const cell = event.target.closest('[data-document-cell]'); const element = event.target.closest('[data-document-element]'); const region = event.target.closest('[data-document-region]');
    if (region) {
      state.documentSelectedRegion = region.dataset.documentRegion;
      const page = activeDocumentPhysicalPage().page; const columns = state.documentSelectedRegion === 'header' ? page.headerColumns : state.documentSelectedRegion === 'footer' ? page.footerColumns : 1; const bounds = region.getBoundingClientRect();
      state.documentSelectedColumn = Math.min(columns, Math.max(1, Math.floor(((event.clientX - bounds.left) / Math.max(1, bounds.width)) * columns) + 1));
    }
    if (cell) { const [tableId, row, column] = cell.dataset.documentCell.split(':'); state.documentSelectedElementId = tableId; state.documentSelectedCell = { tableId, row: Number(row), column: Number(column) }; }
    else if (element) { state.documentSelectedElementId = element.dataset.documentElement; state.documentSelectedCell = null; }
    else { state.documentSelectedElementId = ''; state.documentSelectedCell = null; }
    renderDocumentDesigner();
  });
  $('#documentFieldPalette')?.addEventListener('click', (event) => { const field = event.target.closest('[data-insert-document-field]'); const element = event.target.closest('[data-add-document-element]'); if (field) insertDocumentField(field.dataset.insertDocumentField, field.dataset.documentFieldLabel); if (element) insertDocumentElement(element.dataset.addDocumentElement); });
  $('#documentFieldPalette')?.addEventListener('dragstart', (event) => { const field = event.target.closest('[data-insert-document-field]'); if (!field) return; event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData('application/x-babyyy-document-field', JSON.stringify({ binding: field.dataset.insertDocumentField, label: field.dataset.documentFieldLabel })); });
  $('#documentPage')?.addEventListener('dragover', (event) => { if (event.dataTransfer.types.includes('application/x-babyyy-document-field')) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; } });
  $('#documentPage')?.addEventListener('drop', (event) => { const payload = event.dataTransfer.getData('application/x-babyyy-document-field'); if (!payload) return; event.preventDefault(); const region = event.target.closest('[data-document-region]'); if (region) { state.documentSelectedRegion = region.dataset.documentRegion; const columns = state.documentSelectedRegion === 'header' ? activeDocumentTemplate().page.headerColumns : state.documentSelectedRegion === 'footer' ? activeDocumentTemplate().page.footerColumns : 1; const bounds = region.getBoundingClientRect(); state.documentSelectedColumn = Math.min(columns, Math.max(1, Math.floor(((event.clientX - bounds.left) / Math.max(1, bounds.width)) * columns) + 1)); } const field = parseStoredJson(payload); if (field?.binding) insertDocumentField(field.binding, field.label); });
  $('#documentFieldsTab')?.addEventListener('click', () => { state.documentPaletteTab = 'fields'; renderDocumentFieldPalette(); });
  $('#documentElementsTab')?.addEventListener('click', () => { state.documentPaletteTab = 'elements'; renderDocumentFieldPalette(); });
  $('#documentFieldSearch')?.addEventListener('input', (event) => { state.documentFieldQuery = event.target.value; renderDocumentFieldPalette(); $('#documentFieldSearch').focus(); });
  $('#documentCoordinateSystem')?.addEventListener('pointerdown', (event) => { if (state.documentDesignerMode === 'preview') return; const margin = event.target.closest('[data-document-margin-handle]'); const indent = event.target.closest('[data-document-indent-handle]'); const column = event.target.closest('[data-document-column-marker]'); const rowHeight = event.target.closest('[data-document-row-height-handle]'); if (!(margin || indent || column || rowHeight)) return; event.preventDefault(); event.target.setPointerCapture?.(event.pointerId); captureDocumentHistory(); if (margin) { state.documentMarginDrag = { side: margin.dataset.documentMarginHandle, pointerId: event.pointerId }; updateDocumentMarginDrag(event); } else if (rowHeight) { state.documentRulerDrag = { kind: 'row-height', rowTopCm: Number(rowHeight.dataset.documentRowTopCm), pointerId: event.pointerId }; updateDocumentRulerDrag(event); } else { state.documentRulerDrag = indent ? { kind: 'indent', side: indent.dataset.documentIndentHandle, pointerId: event.pointerId } : { kind: 'column', index: Number(column.dataset.documentColumnMarker), pointerId: event.pointerId }; updateDocumentRulerDrag(event); } });
  document.addEventListener('pointermove', (event) => { if (state.documentMarginDrag) updateDocumentMarginDrag(event); if (state.documentRulerDrag) updateDocumentRulerDrag(event); });
  document.addEventListener('pointerup', () => { if (state.documentMarginDrag) { state.documentMarginDrag = null; renderDocumentDesigner(); $('#documentDesignerAnnouncement').textContent = 'Page margin updated.'; } if (state.documentRulerDrag) { state.documentRulerDrag = null; renderDocumentDesigner(); $('#documentDesignerAnnouncement').textContent = 'Selected content geometry updated.'; } });
  $('#documentProperties')?.addEventListener('change', (event) => updateDocumentProperty(event.target));
  window.addEventListener('beforeprint', prepareDocumentPrint);
  window.addEventListener('afterprint', restoreDocumentAfterPrint);
  $('#documentProperties')?.addEventListener('change', (event) => updateDocumentPageProperty(event.target));
  $('#documentPropertiesTab')?.addEventListener('click', () => { state.documentPropertiesTab = 'properties'; renderDocumentDesigner(); });
  $('#documentPageTab')?.addEventListener('click', () => { state.documentPropertiesTab = 'page'; renderDocumentDesigner(); });
  $('#documentProperties')?.addEventListener('click', (event) => {
    const suggestionBind = event.target.closest('[data-document-suggestion-bind]');
    if (suggestionBind) { const { element, cell } = selectedDocumentTarget(); const binding = suggestionBind.dataset.documentSuggestionBind; const label = documentSuggestionFields().find((field) => field.binding === binding)?.label || titleCaseMessage(binding.split('.').pop()); captureDocumentHistory(); if (cell) cell.binding = binding; else if (element) { element.type = 'field'; element.binding = binding; element.label = label; } renderDocumentDesigner(); return; }
    const suggestionReject = event.target.closest('[data-document-suggestion-reject]');
    if (suggestionReject) { const { element, table, cell } = selectedDocumentTarget(); const target = documentSuggestionTarget(element, table, cell); state.documentRejectedSuggestions.add(`${target.id}:${suggestionReject.dataset.documentSuggestionReject}`); renderDocumentDesigner(); return; }
    const action = event.target.closest('[data-document-table-action]'); if (action) return documentTableAction(action.dataset.documentTableAction);
    if (event.target.closest('[data-open-document-page-settings]')) { state.documentPropertiesTab = 'page'; renderDocumentDesigner(); return; }
    if (event.target.closest('[data-document-static-text]')) { const { element } = selectedDocumentTarget(); if (!element) return; captureDocumentHistory(); element.type = 'text'; element.content = element.label || titleCaseMessage(element.binding); delete element.binding; delete element.label; renderDocumentDesigner(); return; }
    if (event.target.closest('[data-remove-document-element]')) { const { template, element } = selectedDocumentTarget(); if (!element) return; captureDocumentHistory(); const regions = activeDocumentPhysicalPage(template).regions; regions[state.documentSelectedRegion] = regions[state.documentSelectedRegion].filter((item) => item.id !== element.id); state.documentSelectedElementId = ''; renderDocumentDesigner(); }
  });
  for (const id of ['workflowDocumentEnabled', 'workflowDocumentTemplate', 'workflowDocumentTrigger', 'workflowDocumentFormat']) $(`#${id}`)?.addEventListener('change', saveWorkflowDocumentOutput);
  $('#openWorkflowDocumentDesigner')?.addEventListener('click', () => { const key = $('#workflowDocumentTemplate').value; if (key) { showAdminSection('adminDocumentTemplatesSection'); openDocumentDesigner(key); } });
  $('#previewWorkflowDocument')?.addEventListener('click', () => { const key = $('#workflowDocumentTemplate').value; if (key) { showAdminSection('adminDocumentTemplatesSection'); openDocumentDesigner(key, true); } });
  $('#addMenuGroup')?.addEventListener('click', () => {
    const label = 'New group'; const key = menuStableKey(label);
    state.menuConfigDraft.items.push({ key, type: 'group', parentKey: null, label, icon: 'none', enabled: true, order: state.menuConfigDraft.items.length + 1, destination: null, visibility: { roles: [], userIds: [], departmentIds: [] } });
    state.selectedMenuItemKey = key; renderMenuConfig();
  });
  $('#addMenuItem')?.addEventListener('click', () => {
    const label = 'New menu item'; const key = menuStableKey(label); const destination = state.menuConfigCatalog.destinations[0] || { type: 'view', key: 'customersView' };
    state.menuConfigDraft.items.push({ key, type: 'item', parentKey: null, label, icon: 'none', enabled: true, order: state.menuConfigDraft.items.length + 1, destination: { type: destination.type, key: destination.key }, visibility: { roles: [], userIds: [], departmentIds: [] } });
    state.selectedMenuItemKey = key; renderMenuConfig();
  });
  $('#menuPreviewRole')?.addEventListener('change', renderMenuConfig);
  $('#menuDefaultGroup')?.addEventListener('change', (event) => { state.menuConfigDraft.defaultModuleGroupKey = event.target.value; });
  $('#checkMenuConfig')?.addEventListener('click', () => runWorkflowUi(async () => { const result = await api('/api/menu/configuration/check', { method: 'POST', body: JSON.stringify(state.menuConfigDraft) }); if (!result.check.valid) throw new Error(result.check.errors[0]); toast('Menu Configuration Check Passed.'); }));
  $('#saveMenuConfig')?.addEventListener('click', () => runWorkflowUi(() => saveMenuConfiguration(false)));
  $('#publishMenuConfig')?.addEventListener('click', () => runWorkflowUi(() => saveMenuConfiguration(true)));
  $('#resetMenuConfig')?.addEventListener('click', () => runWorkflowUi(async () => { const confirmed = await showConfirmationModal({ title: 'Reset menu draft', message: 'Replace the current draft with the safe default sidebar? The published menu remains unchanged until you publish.', confirmLabel: 'Reset draft' }); if (!confirmed) return; const payload = await api('/api/menu/configuration/reset', { method: 'POST' }); state.menuConfigDraft = payload.config; state.selectedMenuItemKey = state.menuConfigDraft.items[0]?.key || ''; renderMenuConfig(); toast('Menu Draft Reset.'); }));
  $('#menuConfigTree')?.addEventListener('click', (event) => { const row = event.target.closest('[data-menu-item-key]'); if (!row) return; state.selectedMenuItemKey = row.dataset.menuItemKey; renderMenuConfig(); });
  $('#menuConfigTree')?.addEventListener('dragstart', (event) => { const row = event.target.closest('[data-menu-item-key]'); if (!row) return; state.draggingMenuItemKey = row.dataset.menuItemKey; event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', state.draggingMenuItemKey); });
  $('#menuConfigTree')?.addEventListener('dragover', (event) => { const row = event.target.closest('[data-menu-item-key]'); if (!row) return; event.preventDefault(); event.dataTransfer.dropEffect = 'move'; showMenuDropTarget(row, menuDropPlacement(row, event.clientY)); autoScrollReorderSurface($('#menuConfigTree'), event.clientY, event.clientX); });
  $('#menuConfigTree')?.addEventListener('drop', (event) => {
    event.preventDefault(); const targetRow = event.target.closest('[data-menu-item-key]'); const placement = state.menuDropTarget?.placement || menuDropPlacement(targetRow, event.clientY); moveMenuItem(event.dataTransfer.getData('text/plain') || state.draggingMenuItemKey, targetRow?.dataset.menuItemKey, placement); state.draggingMenuItemKey = ''; state.menuDropTarget = null;
  });
  $('#menuConfigTree')?.addEventListener('dragend', () => { state.draggingMenuItemKey = ''; state.menuDropTarget = null; showMenuDropTarget(null, 'after'); });
  $('#menuConfigTree')?.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' || !event.target.closest('.menu-tree-grip')) return;
    const row = event.target.closest('[data-menu-item-key]');
    if (!row) return;
    state.menuPointerDrag = { pointerId: event.pointerId, key: row.dataset.menuItemKey, startX: event.clientX, startY: event.clientY, active: false };
    row.setPointerCapture?.(event.pointerId);
  });
  window.addEventListener('pointermove', (event) => {
    const drag = state.menuPointerDrag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!drag.active && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 10) return;
    drag.active = true;
    state.draggingMenuItemKey = drag.key;
    const row = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('[data-menu-item-key]');
    showMenuDropTarget(row?.closest('#menuConfigTree') ? row : null, menuDropPlacement(row, event.clientY));
    autoScrollReorderSurface($('#menuConfigTree'), event.clientY, event.clientX);
    event.preventDefault();
  }, { passive: false });
  const finishMenuPointerDrag = (event) => {
    const drag = state.menuPointerDrag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const row = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('#menuConfigTree [data-menu-item-key]');
    if (event.type === 'pointerup' && drag.active && row) moveMenuItem(drag.key, row.dataset.menuItemKey, menuDropPlacement(row, event.clientY));
    state.menuPointerDrag = null; state.draggingMenuItemKey = ''; state.menuDropTarget = null; showMenuDropTarget(null, 'after');
  };
  window.addEventListener('pointerup', finishMenuPointerDrag);
  window.addEventListener('pointercancel', finishMenuPointerDrag);
  $('#menuConfigInspector')?.addEventListener('input', (event) => {
    if (event.target.id === 'menuMoveGroup') return;
    const item = state.menuConfigDraft?.items?.find((entry) => entry.key === state.selectedMenuItemKey); if (!item) return;
    const field = event.target.dataset.menuField;
    if (field === 'label') item.label = event.target.value;
    if (field === 'icon') item.icon = event.target.value;
    if (field === 'enabled') item.enabled = event.target.checked;
    if (field === 'externalUrl') item.destination = { type: 'external', url: event.target.value };
    if (event.target.dataset.menuVisibility) { const kind = event.target.dataset.menuVisibility; const cast = kind === 'roles' ? String : Number; item.visibility[kind] = [...$('#menuConfigInspector').querySelectorAll(`[data-menu-visibility="${kind}"]:checked`)].map((input) => cast(input.value)); }
    if (field !== 'label' && field !== 'externalUrl') renderMenuConfig();
  });
  $('#menuConfigInspector')?.addEventListener('change', (event) => {
    if (event.target.id === 'menuMoveGroup') { $('#menuConfigInspector [data-move-menu="into"]').disabled = !event.target.value; return; }
    const item = state.menuConfigDraft?.items?.find((entry) => entry.key === state.selectedMenuItemKey); if (!item || event.target.dataset.menuField !== 'destination') return;
    const value = event.target.value; item.destination = value === 'external' ? { type: 'external', url: 'https://' } : { type: value.split(':')[0], key: value.split(':').slice(1).join(':') }; renderMenuConfig();
  });
  $('#menuConfigInspector')?.addEventListener('click', async (event) => {
    const move = event.target.closest('[data-move-menu]');
    if (move) {
      const item = state.menuConfigDraft.items.find((entry) => entry.key === state.selectedMenuItemKey);
      if (!item || item.systemKey === 'admin_portal') return;
      const siblings = menuSiblings(item.parentKey, item.key);
      const ordered = menuSiblings(item.parentKey);
      const index = ordered.findIndex((entry) => entry.key === item.key);
      if (move.dataset.moveMenu === 'up' && index > 0) moveMenuItem(item.key, ordered[index - 1].key, 'before');
      if (move.dataset.moveMenu === 'down' && index < ordered.length - 1) moveMenuItem(item.key, ordered[index + 1].key, 'after');
      if (move.dataset.moveMenu === 'out' && item.parentKey) moveMenuItem(item.key, state.menuConfigDraft.items.find((entry) => entry.key === item.parentKey)?.key, 'after');
      if (move.dataset.moveMenu === 'into') { const groupKey = $('#menuMoveGroup')?.value; if (groupKey) moveMenuItem(item.key, groupKey, 'inside'); }
      $('#menuConfigInspector [data-move-menu="' + move.dataset.moveMenu + '"]:not(:disabled)')?.focus();
      return;
    }
    if (!event.target.closest('[data-remove-menu-item]')) return;
    const key = state.selectedMenuItemKey;
    const item = state.menuConfigDraft.items.find((entry) => entry.key === key);
    const descendants = menuDescendantKeys(key);
    if (descendants.size) {
      const confirmed = await showConfirmationModal({
        title: 'Remove Menu Branch',
        message: `Remove ${item?.label || 'this group'} and all ${descendants.size} descendant ${descendants.size === 1 ? 'entry' : 'entries'}? This only changes the draft until you publish.`,
        confirmLabel: `Remove ${descendants.size + 1} Entries`
      });
      if (!confirmed) return;
    }
    descendants.add(key);
    if (descendants.has(state.menuConfigDraft.defaultModuleGroupKey)) state.menuConfigDraft.defaultModuleGroupKey = '';
    state.menuConfigDraft.items = state.menuConfigDraft.items.filter((entry) => !descendants.has(entry.key));
    state.selectedMenuItemKey = state.menuConfigDraft.items[0]?.key || '';
    renderMenuConfig();
  });
  $('#menuConfigVersions')?.addEventListener('click', (event) => { const button = event.target.closest('[data-restore-menu-version]'); if (!button) return; runWorkflowUi(async () => { const payload = await api(`/api/menu/configuration/versions/${button.dataset.restoreMenuVersion}/restore`, { method: 'POST' }); state.menuConfigDraft = payload.config; state.selectedMenuItemKey = state.menuConfigDraft.items[0]?.key || ''; renderMenuConfig(); toast('Menu Version Restored To Draft.'); }); });
  $('#newWorkflowRequestButton')?.addEventListener('click', () => openWorkflowSubmitModal().catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#refreshWorkflowMonitoring')?.addEventListener('click', () => runWorkflowUi(state.workflowMonitoringTab === 'history' ? loadWorkflowReport : loadWorkflowMonitoring));
  $('#runWorkflowSlaButton')?.addEventListener('click', () => runWorkflowUi(runWorkflowSlaCheck));
  $('#workflowMonitoringStatus')?.addEventListener('change', (event) => { state.workflowMonitoringStatus = event.target.value; runWorkflowUi(loadWorkflowMonitoring); });
  $('#workflowMonitoringSla')?.addEventListener('change', (event) => { state.workflowMonitoringSla = event.target.value; runWorkflowUi(loadWorkflowMonitoring); });
  $('#workflowMonitoringSearch')?.addEventListener('input', (event) => { state.workflowMonitoringSearch = event.target.value.trim(); window.clearTimeout(event.target.workflowSearchTimer); event.target.workflowSearchTimer = window.setTimeout(() => runWorkflowUi(loadWorkflowMonitoring), 250); });
  $$('[data-workflow-monitoring-tab]').forEach((button) => button.addEventListener('click', () => runWorkflowUi(() => selectWorkflowMonitoringTab(button.dataset.workflowMonitoringTab))));
  ['Search', 'Requester', 'Approver'].forEach((name) => $(`#workflowReport${name}`)?.addEventListener('input', debounce((event) => { state.workflowReportFilters[name.charAt(0).toLowerCase() + name.slice(1)] = event.target.value.trim(); runWorkflowUi(loadWorkflowReport); }, 250)));
  [['Workflow', 'workflowKey'], ['Status', 'status'], ['Department', 'departmentId'], ['DateFrom', 'dateFrom'], ['DateTo', 'dateTo']].forEach(([name, key]) => $(`#workflowReport${name}`)?.addEventListener('change', (event) => { state.workflowReportFilters[key] = event.target.value; runWorkflowUi(loadWorkflowReport); }));
  $('#exportWorkflowHistory')?.addEventListener('click', () => runWorkflowUi(exportWorkflowReport));
  $('#clearWorkflowReportFilters')?.addEventListener('click', clearWorkflowReportFilters);
  $('#workflowMonitoringView')?.addEventListener('click', (event) => {
    const request = event.target.closest('[data-monitoring-request]');
    const reminder = event.target.closest('[data-monitoring-remind]');
    const reassign = event.target.closest('[data-monitoring-reassign]');
    const filter = event.target.closest('[data-monitoring-sla-filter]');
    if (request) runWorkflowUi(() => openMonitoredWorkflowRequest(request.dataset.monitoringRequest));
    if (reminder) runWorkflowUi(() => sendWorkflowReminder(reminder.dataset.monitoringRemind));
    if (reassign) openWorkflowReassignModal(reassign.dataset.monitoringReassign);
    if (filter) { state.workflowMonitoringSla = filter.dataset.monitoringSlaFilter; $('#workflowMonitoringSla').value = state.workflowMonitoringSla; runWorkflowUi(loadWorkflowMonitoring); }
  });
  $('#newWorkflowDelegationButton')?.addEventListener('click', openWorkflowDelegationModal);
  bindAsyncSubmit($('#workflowDelegationForm'), (event) => runWorkflowUi(() => saveWorkflowDelegation(event)));
  $('#closeWorkflowDelegationModal')?.addEventListener('click', () => closeWorkflowModal('workflowDelegationModal'));
  $('#cancelWorkflowDelegationModal')?.addEventListener('click', () => closeWorkflowModal('workflowDelegationModal'));
  $('#workflowDelegationStatus')?.addEventListener('change', (event) => { state.workflowDelegationStatus = event.target.value; runWorkflowUi(loadWorkflowDelegations); });
  $('#workflowDelegationSearch')?.addEventListener('input', debounce((event) => { state.workflowDelegationSearch = event.target.value.trim(); runWorkflowUi(loadWorkflowDelegations); }, 200));
  $('#workflowDelegationList')?.addEventListener('click', (event) => { const button = event.target.closest('[data-cancel-workflow-delegation]'); if (button) runWorkflowUi(() => cancelWorkflowDelegation(button.dataset.cancelWorkflowDelegation)); });
  bindAsyncSubmit($('#workflowReassignForm'), (event) => runWorkflowUi(() => reassignWorkflowAssignment(event)));
  $('#closeWorkflowReassignModal')?.addEventListener('click', () => closeWorkflowModal('workflowReassignModal'));
  $('#cancelWorkflowReassignModal')?.addEventListener('click', () => closeWorkflowModal('workflowReassignModal'));
  $('#workflowSubmitForm')?.elements.workflowKey.addEventListener('change', () => {
    syncWorkflowSubmitBinding();
    $('#workflowSourceRecordSearch').value = '';
    $('#workflowSubmitForm').dataset.preferredRecordId = '';
    loadWorkflowSourceRecords().catch((error) => toast(titleCaseMessage(error.message), 'error'));
  });
  $('#workflowSourceRecordSearch')?.addEventListener('input', debounce(() => loadWorkflowSourceRecords().catch((error) => toast(titleCaseMessage(error.message), 'error')), 250));
  $('#workflowSourceRecordOptions')?.addEventListener('click', (event) => {
    const record = event.target.closest('[data-workflow-source-record]');
    if (record) selectWorkflowSourceRecord(record.dataset.workflowSourceRecord);
  });
  bindAsyncSubmit($('#workflowSubmitForm'), (event) => runWorkflowUi(() => submitWorkflowRequest(event)));
  $('#closeWorkflowSubmitModal')?.addEventListener('click', () => closeWorkflowModal('workflowSubmitModal'));
  $('#cancelWorkflowSubmitModal')?.addEventListener('click', () => closeWorkflowModal('workflowSubmitModal'));
  bindAsyncSubmit($('#workflowDecisionForm'), (event) => runWorkflowUi(() => decideWorkflowRequest(event)));
  $('#closeWorkflowDecisionModal')?.addEventListener('click', () => closeWorkflowModal('workflowDecisionModal'));
  $('#cancelWorkflowDecisionModal')?.addEventListener('click', () => closeWorkflowModal('workflowDecisionModal'));
  bindAsyncSubmit($('#workflowLifecycleForm'), (event) => runWorkflowUi(() => runWorkflowLifecycle(event)));
  $('#closeWorkflowLifecycleModal')?.addEventListener('click', () => closeWorkflowModal('workflowLifecycleModal'));
  $('#cancelWorkflowLifecycleModal')?.addEventListener('click', () => closeWorkflowModal('workflowLifecycleModal'));
  $('#workflowRequestList')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-workflow-request]');
    if (button) runWorkflowUi(() => openWorkflowRequest(button.dataset.workflowRequest));
  });
  $('#workflowRequestDetail')?.addEventListener('click', (event) => {
    const decision = event.target.closest('[data-workflow-decision]');
    const lifecycle = event.target.closest('[data-workflow-lifecycle]');
    const attachment = event.target.closest('[data-workflow-attachment-download]');
    if (decision) openWorkflowDecision(decision.dataset.workflowDecision);
    if (lifecycle) openWorkflowLifecycle(lifecycle.dataset.workflowLifecycle);
    if (attachment) runWorkflowUi(() => downloadWorkflowAttachment(attachment.dataset.workflowAttachmentDownload));
  });
  $$('.workflow-request-tabs [data-workflow-request-mode]').forEach((button) => button.addEventListener('click', () => {
    state.workflowRequestMode = button.dataset.workflowRequestMode;
    $$('.workflow-request-tabs [data-workflow-request-mode]').forEach((item) => item.classList.toggle('is-active', item === button));
    renderWorkflowRequestList();
  }));
  $('#workflowRequestStatus')?.addEventListener('change', (event) => {
    state.workflowRequestStatus = event.target.value;
    renderWorkflowRequestList();
  });
  $('#workflowRequestSearch')?.addEventListener('input', debounce((event) => {
    state.workflowRequestSearch = event.target.value.trim();
    renderWorkflowRequestList();
  }, 180));
  $('#newWorkflowDefinitionButton')?.addEventListener('click', () => {
    state.activeWorkflowKey = '';
    renderWorkflowDefinitionList();
    showWorkflowDefinition(null);
  });
  $('#emptyNewWorkflowDefinitionButton')?.addEventListener('click', () => {
    state.activeWorkflowKey = '';
    showWorkflowDefinition(null);
  });
  $('#workflowDefinitionSearch')?.addEventListener('input', debounce((event) => {
    state.workflowDefinitionSearch = event.target.value.trim();
    renderWorkflowDefinitionList();
  }, 180));
  $('#workflowDefinitionList')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-workflow-definition]');
    if (!button) return;
    state.activeWorkflowKey = button.dataset.workflowDefinition;
    renderWorkflowDefinitionList();
    showWorkflowDefinition(activeWorkflowDefinition());
  });
  bindAsyncSubmit($('#workflowDefinitionForm'), (event) => runWorkflowUi(() => saveWorkflowDefinition(event)));
  $('#workflowDefinitionForm')?.elements.name.addEventListener('input', syncWorkflowStableKey);
  $('#workflowDefinitionForm')?.elements.sourceModuleKey.addEventListener('change', () => renderWorkflowCanvasInspector());
  $('#workflowDefinitionForm')?.elements.requestFormKey.addEventListener('change', () => renderWorkflowCanvasInspector());
  $$('[data-add-workflow-node]').forEach((button) => button.addEventListener('click', () => addWorkflowCanvasNode(button.dataset.addWorkflowNode)));
  $('#workflowConnectButton')?.addEventListener('click', () => {
    state.workflowConnectFrom = state.workflowConnectFrom ? '' : state.selectedWorkflowNodeId;
    if (!state.workflowConnectFrom) toast('Select a source node, then click Connect.', 'error');
    else announceWorkflowCanvas('Connection mode started. Tab to a destination node and press Enter. Press Escape to cancel.');
    renderWorkflowCanvas();
  });
  $('#workflowZoomOut')?.addEventListener('click', () => { state.workflowCanvasZoom = Math.max(.4, state.workflowCanvasZoom - .1); renderWorkflowCanvas(); });
  $('#workflowZoomIn')?.addEventListener('click', () => { state.workflowCanvasZoom = Math.min(1.6, state.workflowCanvasZoom + .1); renderWorkflowCanvas(); });
  $('#workflowFitCanvas')?.addEventListener('click', fitWorkflowCanvas);
  $('#openWorkflowRouteDesigner')?.addEventListener('click', openWorkflowRouteDesigner);
  $('#closeWorkflowRouteDesigner')?.addEventListener('click', closeWorkflowRouteDesigner);
  $('#saveWorkflowRouteDesigner')?.addEventListener('click', () => runWorkflowUi(saveWorkflowRouteDesigner));
  $('#workflowInspectorToggle')?.addEventListener('click', () => setWorkflowInspectorCollapsed(!state.workflowInspectorCollapsed));
  $('#workflowCanvas')?.addEventListener('click', (event) => {
    if (state.workflowCanvasSuppressClick) {
      state.workflowCanvasSuppressClick = false;
      return;
    }
    const nodeButton = event.target.closest('[data-workflow-node-id]');
    const edgeButton = event.target.closest('[data-workflow-edge-id]');
    if (nodeButton) {
      const nodeId = nodeButton.dataset.workflowNodeId;
      if (state.workflowConnectFrom && state.workflowConnectFrom !== nodeId) return connectWorkflowNodes(state.workflowConnectFrom, nodeId);
      state.selectedWorkflowNodeId = nodeId;
      state.selectedWorkflowEdgeId = '';
      if (state.workflowRouteDesignerOpen) setWorkflowInspectorCollapsed(false);
      renderWorkflowCanvas();
    } else if (edgeButton) {
      state.selectedWorkflowEdgeId = edgeButton.dataset.workflowEdgeId;
      state.selectedWorkflowNodeId = '';
      if (state.workflowRouteDesignerOpen) setWorkflowInspectorCollapsed(false);
      renderWorkflowCanvas();
    }
  });
  $('#workflowCanvas')?.addEventListener('keydown', (event) => {
    const nodeButton = event.target.closest('[data-workflow-node-id]');
    if (!nodeButton) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      moveWorkflowNodeByKeyboard(nodeButton.dataset.workflowNodeId, event.key, event.shiftKey);
      event.preventDefault();
      return;
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && nodeButton.dataset.workflowNodeId === state.selectedWorkflowNodeId) {
      const node = state.workflowBuilderGraph.nodes.find((item) => item.id === nodeButton.dataset.workflowNodeId);
      if (node?.type !== 'start') {
        removeSelectedWorkflowNode();
        event.preventDefault();
      }
    }
  });
  $('#workflowCanvas')?.addEventListener('pointerdown', (event) => {
    const button = event.target.closest('[data-workflow-node-id]');
    if (!button || state.workflowConnectFrom) return;
    const node = state.workflowBuilderGraph.nodes.find((item) => item.id === button.dataset.workflowNodeId);
    if (!node) return;
    const bounds = button.getBoundingClientRect();
    state.workflowCanvasDrag = {
      nodeId: node.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: Number(node.x),
      y: Number(node.y),
      previewX: Number(node.x),
      previewY: Number(node.y),
      maxX: 1600 - (bounds.width / state.workflowCanvasZoom),
      maxY: 820 - (bounds.height / state.workflowCanvasZoom),
      width: bounds.width,
      height: bounds.height,
      grabOffsetX: (event.clientX - bounds.left) / state.workflowCanvasZoom,
      grabOffsetY: (event.clientY - bounds.top) / state.workflowCanvasZoom,
      dragging: false
    };
    button.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });
  $('#workflowCanvasViewport')?.addEventListener('pointerdown', (event) => {
    if (event.target.closest('[data-workflow-node-id], [data-workflow-edge-id]')) return;
    const viewport = event.currentTarget;
    state.workflowCanvasPan = { startX: event.clientX, startY: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    viewport.classList.add('is-panning');
    viewport.setPointerCapture?.(event.pointerId);
  });
  window.addEventListener('pointermove', (event) => {
    if (state.workflowCanvasDrag && event.pointerId === state.workflowCanvasDrag.pointerId) {
      const drag = state.workflowCanvasDrag;
      const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
      if (!drag.dragging && distance < 8) return;
      drag.dragging = true;
      const position = workflowDragPosition(drag, event.clientX, event.clientY);
      Object.assign(drag, { previewX: position.x, previewY: position.y, maxX: position.maxX, maxY: position.maxY });
      queueWorkflowDragFrame();
    }
    if (state.workflowCanvasPan) {
      const viewport = $('#workflowCanvasViewport');
      viewport.scrollLeft = state.workflowCanvasPan.left - (event.clientX - state.workflowCanvasPan.startX);
      viewport.scrollTop = state.workflowCanvasPan.top - (event.clientY - state.workflowCanvasPan.startY);
    }
  });
  window.addEventListener('pointerup', finishWorkflowCanvasInteraction);
  window.addEventListener('pointercancel', finishWorkflowCanvasInteraction);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.workflowRouteDesignerOpen && cancelWorkflowCanvasMode()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
  $('#workflowCanvasInspector')?.addEventListener('change', (event) => {
    if (event.target.dataset.workflowNodeField) updateWorkflowInspectorField(event.target.dataset.workflowNodeField, event.target);
    if (event.target.dataset.workflowEdgeConditionField) updateWorkflowEdgeCondition(event.target);
    if (event.target.dataset.workflowApproverType) toggleWorkflowApproverRule(event.target);
    if (event.target.matches('[data-workflow-record-approver-fields]')) updateWorkflowRecordApproverFields(event.target);
    if (event.target.dataset.workflowResponseField) updateWorkflowResponseMapping(event.target);
  });
  $('#workflowCanvasInspector')?.addEventListener('input', (event) => {
    if (event.target.matches('[data-workflow-approver-search-input]')) filterWorkflowApproverOptions(event.target);
  });
  $('#workflowCanvasInspector')?.addEventListener('click', (event) => {
    if (event.target.closest('[data-clear-workflow-approver-search]')) {
      const input = $('#workflowCanvasInspector [data-workflow-approver-search-input]');
      if (input) {
        input.value = '';
        filterWorkflowApproverOptions(input);
        input.focus();
      }
    }
    if (event.target.closest('[data-remove-workflow-node]')) removeSelectedWorkflowNode();
    if (event.target.closest('[data-remove-workflow-edge]')) {
      state.workflowBuilderGraph.edges = state.workflowBuilderGraph.edges.filter((edge) => edge.id !== state.selectedWorkflowEdgeId);
      state.selectedWorkflowEdgeId = '';
      renderWorkflowCanvas();
    }
    const group = event.target.closest('[data-workflow-edge-condition-group]');
    const edge = state.workflowBuilderGraph.edges.find((item) => item.id === state.selectedWorkflowEdgeId);
    if (group && edge) {
      edge.condition ||= { group: 'all', rules: [{ fieldKey: '', operator: 'equals', value: '' }] };
      edge.condition.group = group.dataset.workflowEdgeConditionGroup;
      renderWorkflowCanvas();
    }
    if (event.target.closest('[data-add-workflow-edge-condition]') && edge) {
      edge.condition ||= { group: 'all', rules: [] };
      edge.condition.rules.push({ fieldKey: '', operator: 'equals', value: '' });
      renderWorkflowCanvas();
    }
    const removeRule = event.target.closest('[data-remove-workflow-edge-condition]');
    if (removeRule && edge) {
      edge.condition.rules.splice(Number(removeRule.dataset.removeWorkflowEdgeCondition), 1);
      renderWorkflowCanvas();
    }
  });
  $('#checkWorkflowDefinitionButton')?.addEventListener('click', () => runWorkflowUi(checkWorkflowDefinition));
  $('#workflowCheckPanel')?.addEventListener('click', (event) => {
    const target = event.target.closest('[data-workflow-check-target-type]');
    if (target) openWorkflowCheckTarget(target);
    if (event.target.closest('[data-check-workflow-again]')) runWorkflowUi(checkWorkflowDefinition);
  });
  $('#publishWorkflowDefinitionButton')?.addEventListener('click', () => runWorkflowUi(publishWorkflowDefinition));
  $('#checkpointWorkflowDefinitionButton')?.addEventListener('click', () => runWorkflowUi(checkpointWorkflowDefinition));
  $('#cloneWorkflowDefinitionButton')?.addEventListener('click', () => runWorkflowUi(cloneWorkflowDefinition));
  $('#archiveWorkflowDefinitionButton')?.addEventListener('click', () => runWorkflowUi(archiveWorkflowDefinition));
  $('#newDashboardSourceButton')?.addEventListener('click', () => openDashboardSourceDrawer());
  $('#emptyNewDashboardSourceButton')?.addEventListener('click', () => openDashboardSourceDrawer());
  $('#editDashboardSourceButton')?.addEventListener('click', () => openDashboardSourceDrawer(state.activeDashboardSourceKey));
  $('#closeDashboardSourceDrawer')?.addEventListener('click', closeDashboardSourceDrawer);
  $('#cancelDashboardSourceDrawer')?.addEventListener('click', closeDashboardSourceDrawer);
  $('#dashboardSourceDrawer')?.addEventListener('click', (event) => { if (event.target === event.currentTarget) closeDashboardSourceDrawer(); });
  bindAsyncSubmit($('#dashboardSourceForm'), (event) => saveDashboardSource(event).catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#dashboardSourceForm [name="sourceType"]')?.addEventListener('change', updateDashboardSourceFormMode);
  $('#dashboardSourceSearch')?.addEventListener('input', (event) => { state.dashboardSourceSearch = event.currentTarget.value; renderDashboardSourceList(); });
  $('#dashboardSourceList')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-dashboard-source-key]');
    if (!button) return;
    state.activeDashboardSourceKey = button.dataset.dashboardSourceKey;
    state.dashboardPreview = null;
    renderDashboardSources();
  });
  $('#runDashboardPreviewButton')?.addEventListener('click', () => runDashboardSourcePreview(false).catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#refreshDashboardColumnsButton')?.addEventListener('click', () => runDashboardSourcePreview(true).catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#archiveDashboardSourceButton')?.addEventListener('click', () => archiveDashboardSource().catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#newDashboardButton')?.addEventListener('click', () => openDashboardForm('create'));
  $('#closeDashboardFormModal')?.addEventListener('click', closeDashboardFormModal);
  $('#cancelDashboardFormModal')?.addEventListener('click', closeDashboardFormModal);
  $('#dashboardFormModal')?.addEventListener('click', (event) => { if (event.target === event.currentTarget) closeDashboardFormModal(); });
  bindAsyncSubmit($('#dashboardForm'), (event) => saveDashboard(event).catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#dashboardManagementSearch')?.addEventListener('input', (event) => { state.dashboardManagementSearch = event.currentTarget.value; renderDashboardManagement(); });
  $('.dashboard-status-filter')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-dashboard-status]');
    if (!button) return;
    state.dashboardStatusFilter = button.dataset.dashboardStatus;
    renderDashboardManagement();
  });
  $('#dashboardManagementRows')?.addEventListener('click', (event) => {
    const open = event.target.closest('[data-open-dashboard]');
    const edit = event.target.closest('[data-edit-dashboard]');
    const duplicate = event.target.closest('[data-duplicate-dashboard]');
    const archive = event.target.closest('[data-archive-dashboard]');
    const reopen = event.target.closest('[data-reopen-dashboard]');
    if (open) openDashboardBuilderStudio(open.dataset.openDashboard).catch((error) => toast(titleCaseMessage(error.message), 'error'));
    else if (edit) openDashboardForm('edit', edit.dataset.editDashboard);
    else if (duplicate) openDashboardForm('duplicate', duplicate.dataset.duplicateDashboard);
    else if (archive) changeDashboardArchiveState(archive.dataset.archiveDashboard).catch((error) => toast(titleCaseMessage(error.message), 'error'));
    else if (reopen) changeDashboardArchiveState(reopen.dataset.reopenDashboard, true).catch((error) => toast(titleCaseMessage(error.message), 'error'));
  });
  $('#backToDashboardManagement')?.addEventListener('click', showDashboardManagement);
  $('#dashboardStudioEditButton')?.addEventListener('click', () => openDashboardForm('edit', state.activeDashboardKey));
  $('#dashboardStudioPreviewButton')?.addEventListener('click', () => toast('Dashboard Preview Will Be Available After Widgets Are Added.', 'error'));
  $('#dashboardStudioDataButton')?.addEventListener('click', () => {
    showAdminSection('adminDashboardSourcesSection');
    loadDashboardSources().catch((error) => toast(titleCaseMessage(error.message), 'error'));
  });
  $('#dashboardAccessButton')?.addEventListener('click', openDashboardAccessDrawer);
  $('#previewDashboardButton')?.addEventListener('click', toggleDashboardPreview);
  $('#checkDashboardButton')?.addEventListener('click', () => checkActiveDashboard().catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#dashboardLifecycleButton')?.addEventListener('click', () => openDashboardLifecycleDrawer().catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#closeDashboardLifecycleDrawer')?.addEventListener('click', closeDashboardLifecycleDrawer);
  $('#cancelDashboardLifecycleDrawer')?.addEventListener('click', closeDashboardLifecycleDrawer);
  $('#dashboardLifecycleDrawer')?.addEventListener('click', (event) => { if (event.target === event.currentTarget) closeDashboardLifecycleDrawer(); });
  bindAsyncSubmit($('#dashboardLifecycleForm'), (event) => createDashboardCheckpoint(event).catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#dashboardVersionList')?.addEventListener('click', (event) => { const button = event.target.closest('[data-restore-dashboard-version]'); if (button) restoreDashboardVersion(button.dataset.restoreDashboardVersion).catch((error) => toast(titleCaseMessage(error.message), 'error')); });
  $('#exportDashboardConfigurationButton')?.addEventListener('click', () => exportDashboardConfiguration().catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#importDashboardConfigurationInput')?.addEventListener('change', (event) => importDashboardConfiguration(event.target.files?.[0]).catch((error) => toast(titleCaseMessage(error.message), 'error')).finally(() => { event.target.value = ''; }));
  $('#closeDashboardAccessDrawer')?.addEventListener('click', closeDashboardAccessDrawer);
  $('#cancelDashboardAccessDrawer')?.addEventListener('click', closeDashboardAccessDrawer);
  $('#dashboardAccessDrawer')?.addEventListener('click', (event) => { if (event.target === event.currentTarget) closeDashboardAccessDrawer(); });
  bindAsyncSubmit($('#dashboardAccessForm'), (event) => saveDashboardAccess(event).catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#dashboardAccessRules')?.addEventListener('input', (event) => {
    const search = event.target.closest('[data-permission-search]');
    if (search) filterPermissionPicker(search.closest('[data-permission-picker]'));
  });
  $('#dashboardAccessRules')?.addEventListener('change', (event) => {
    const checkbox = event.target.closest('[data-permission-picker] input[type="checkbox"]');
    if (checkbox) updatePermissionPickerCount(checkbox.closest('[data-permission-picker]'));
  });
  $('#publishDashboardButton')?.addEventListener('click', () => publishActiveDashboard().catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#addDashboardFilterButton')?.addEventListener('click', () => openDashboardFilterDrawer());
  $('#closeDashboardFilterDrawer')?.addEventListener('click', closeDashboardFilterDrawer);
  $('#cancelDashboardFilterDrawer')?.addEventListener('click', closeDashboardFilterDrawer);
  $('#dashboardFilterDrawer')?.addEventListener('click', (event) => { if (event.target === event.currentTarget) closeDashboardFilterDrawer(); });
  bindAsyncSubmit($('#dashboardFilterForm'), saveDashboardFilter);
  $('#dashboardFilterForm [name="type"]')?.addEventListener('change', updateDashboardFilterFormFields);
  $('#dashboardFilterForm [name="dataSourceKey"]')?.addEventListener('change', updateDashboardFilterFormFields);
  $('#removeDashboardFilterButton')?.addEventListener('click', removeDashboardFilter);
  $('#dashboardFilterBar')?.addEventListener('click', (event) => {
    const edit = event.target.closest('[data-edit-dashboard-filter]');
    if (edit) openDashboardFilterDrawer(edit.dataset.editDashboardFilter);
    if (event.target.closest('#resetDashboardFiltersButton')) resetDashboardFilters();
  });
  $('#dashboardFilterBar')?.addEventListener('change', (event) => {
    const control = event.target.closest('[data-dashboard-filter-key]');
    if (!control) return;
    const filter = state.dashboardConfiguration.filters.find((item) => item.filterKey === control.dataset.dashboardFilterKey);
    if (!filter) return;
    if (control.dataset.dashboardFilterPart) state.dashboardFilterValues[filter.filterKey] = { ...(state.dashboardFilterValues[filter.filterKey] || {}), [control.dataset.dashboardFilterPart]: control.value };
    else state.dashboardFilterValues[filter.filterKey] = control.multiple ? [...control.selectedOptions].map((option) => option.value) : control.value;
    refreshWidgetsForDashboardFilter(filter);
  });
  $('#addDashboardWidgetButton')?.addEventListener('click', addDashboardWidget);
  $('#emptyAddDashboardWidgetButton')?.addEventListener('click', addDashboardWidget);
  $('#saveDashboardLayoutButton')?.addEventListener('click', () => saveDashboardLayout().catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#undoDashboardLayoutButton')?.addEventListener('click', undoDashboardLayout);
  $('#redoDashboardLayoutButton')?.addEventListener('click', redoDashboardLayout);
  $('.dashboard-viewport-switch')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-dashboard-viewport]');
    if (!button) return;
    state.dashboardLayoutViewport = button.dataset.dashboardViewport;
    renderDashboardCanvas();
  });
  $('#dashboardCanvas')?.addEventListener('click', (event) => {
    handleDashboardWorkspaceClick(event).catch((error) => toast(titleCaseMessage(error.message), 'error'));
    if (event.target.closest('[data-dashboard-task-form], [data-dashboard-task-id], [data-dashboard-request], [data-dashboard-view], [data-dashboard-calendar-date], [data-dashboard-calendar-shift], [data-dashboard-calendar-today], [data-dashboard-calendar-close], .dashboard-calendar-popover')) return;
    const pageButton = event.target.closest('[data-dashboard-table-page]');
    const pivotToggle = event.target.closest('[data-dashboard-pivot-toggle]');
    const frame = event.target.closest('[data-dashboard-widget-key]');
    if (!frame) return;
    state.selectedDashboardWidgetKey = frame.dataset.dashboardWidgetKey;
    if (pivotToggle) {
      const widget = selectedDashboardWidget();
      const config = dashboardWidgetConfig(widget);
      const collapsed = new Set(config.collapsedRows || []);
      if (collapsed.has(pivotToggle.dataset.dashboardPivotToggle)) collapsed.delete(pivotToggle.dataset.dashboardPivotToggle); else collapsed.add(pivotToggle.dataset.dashboardPivotToggle);
      const previous = dashboardLayoutSnapshot();
      widget.config = { ...config, collapsedRows: [...collapsed] };
      markDashboardLayoutChanged(previous);
      return;
    }
    if (pageButton) {
      updateSelectedDashboardWidgetConfiguration((widget) => { widget.config = { ...dashboardWidgetConfig(widget), tablePage: Number(pageButton.dataset.dashboardTablePage) }; });
      return;
    }
    renderDashboardCanvas();
  });
  $('#dashboardCanvas')?.addEventListener('pointerdown', startDashboardLayoutInteraction);
  bindAsyncSubmit($('#dashboardCanvas'), (event) => handleDashboardTaskSubmit(event).catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#dashboardCanvas')?.addEventListener('change', (event) => handleDashboardTaskChange(event).catch((error) => toast(titleCaseMessage(error.message), 'error')));
  document.addEventListener('pointermove', moveDashboardLayoutInteraction);
  document.addEventListener('pointerup', endDashboardLayoutInteraction);
  window.addEventListener('resize', debounce(() => {
    syncDashboardCanvasExtent();
    if (!$('#publishedDashboardPage')?.hidden && state.dashboardConfiguration) renderPublishedDashboardCanvas();
  }, 120));
  $('#dashboardCanvas')?.addEventListener('keydown', (event) => {
    const frame = event.target.closest('[data-dashboard-widget-key]');
    if (!frame || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    state.selectedDashboardWidgetKey = frame.dataset.dashboardWidgetKey;
    const layout = dashboardLayout(selectedDashboardWidget());
    const delta = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[event.key];
    updateSelectedDashboardLayout(event.shiftKey ? { width: layout.width + delta[0], height: layout.height + delta[1] } : { x: layout.x + delta[0], y: layout.y + delta[1] });
    event.preventDefault();
  });
  $('#dashboardWidgetTitle')?.addEventListener('change', (event) => {
    const widget = selectedDashboardWidget();
    const title = event.currentTarget.value.trim();
    if (!widget || !title || widget.title === title) return;
    const previous = dashboardLayoutSnapshot();
    widget.title = title;
    markDashboardLayoutChanged(previous);
  });
  $('#dashboardWidgetWidth')?.addEventListener('change', (event) => updateSelectedDashboardLayout({ width: event.currentTarget.value }));
  $('#dashboardWidgetHeight')?.addEventListener('change', (event) => updateSelectedDashboardLayout({ height: event.currentTarget.value }));
  $('.dashboard-widget-keyboard-controls')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-dashboard-move]');
    const widget = selectedDashboardWidget();
    if (!button || !widget) return;
    const layout = dashboardLayout(widget);
    const changes = { up: { y: layout.y - 1 }, down: { y: layout.y + 1 }, left: { x: layout.x - 1 }, right: { x: layout.x + 1 } }[button.dataset.dashboardMove];
    updateSelectedDashboardLayout(changes);
  });
  $('#duplicateDashboardWidgetButton')?.addEventListener('click', duplicateSelectedDashboardWidget);
  $('#removeDashboardWidgetButton')?.addEventListener('click', removeSelectedDashboardWidget);
  $('#dashboardWidgetType')?.addEventListener('change', (event) => updateSelectedDashboardWidgetConfiguration((widget) => {
    widget.type = event.currentTarget.value;
    if (isDashboardWorkspaceWidget(widget)) widget.dataSourceKey = '';
    widget.config = { ...dashboardWidgetConfig(widget), mappings: {}, status: widget.type === 'approval_inbox' ? 'pending' : widget.type === 'todo_list' ? 'open' : undefined };
  }));
  $('#dashboardWidgetDataSource')?.addEventListener('change', (event) => updateSelectedDashboardWidgetConfiguration((widget) => { widget.dataSourceKey = event.currentTarget.value; widget.config = { ...dashboardWidgetConfig(widget), mappings: {} }; }));
  $('#dashboardWidgetMappingFields')?.addEventListener('change', (event) => {
    const control = event.target.closest('[data-dashboard-mapping]');
    if (!control) return;
    updateSelectedDashboardWidgetConfiguration((widget) => {
      const config = dashboardWidgetConfig(widget);
      config.mappings[control.dataset.dashboardMapping] = control.multiple ? [...control.selectedOptions].map((option) => option.value) : control.value;
      widget.config = config;
    });
  });
  $('#dashboardWidgetDisplayFields')?.addEventListener('change', (event) => {
    const control = event.target.closest('[data-dashboard-config]');
    if (!control) return;
    updateSelectedDashboardWidgetConfiguration((widget) => {
      const config = dashboardWidgetConfig(widget);
      const key = control.dataset.dashboardConfig;
      if (key === 'drillDownType') config.drillDown = { ...(config.drillDown || {}), type: control.value };
      else if (key === 'drillDownTarget') config.drillDown = { ...(config.drillDown || {}), targetKey: control.value.trim() };
      else if (key === 'drillDownParameters') config.drillDown = { ...(config.drillDown || {}), allowedParameters: control.value.split(',').map((value) => value.trim()).filter(Boolean) };
      else config[key] = control.type === 'checkbox' ? control.checked : control.type === 'number' ? Number(control.value) : control.value;
      widget.config = config;
    });
  });
  $('#refreshDashboardWidgetButton')?.addEventListener('click', () => {
    const widget = selectedDashboardWidget();
    if (widget) loadDashboardWidgetPreview(widget.widgetKey, true).catch((error) => toast(titleCaseMessage(error.message), 'error'));
  });
  $('#exportDashboardWidgetButton')?.addEventListener('click', exportSelectedDashboardWidgetCsv);
  $('#exportDashboardWidgetExcelButton')?.addEventListener('click', exportSelectedDashboardPivotExcel);
  $('#publishedDashboardList')?.addEventListener('click', (event) => {
    const open = event.target.closest('[data-open-published-dashboard]');
    if (open) openPublishedDashboard(open.dataset.openPublishedDashboard).catch((error) => toast(titleCaseMessage(error.message), 'error'));
  });
  $('#backToPublishedDashboardList')?.addEventListener('click', renderPublishedDashboardList);
  $('#publishedDashboardSelector')?.addEventListener('change', (event) => openPublishedDashboard(event.currentTarget.value).catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#publishedDashboardCanvas')?.addEventListener('click', (event) => {
    handleDashboardWorkspaceClick(event).catch((error) => toast(titleCaseMessage(error.message), 'error'));
    if (event.target.closest('[data-dashboard-task-form], [data-dashboard-task-id], [data-dashboard-request], [data-dashboard-view], [data-dashboard-calendar-date], [data-dashboard-calendar-shift], [data-dashboard-calendar-today], [data-dashboard-calendar-close], .dashboard-calendar-popover')) return;
    const refresh = event.target.closest('[data-refresh-published-widget]');
    if (refresh) {
      const widget = state.dashboardConfiguration?.widgets.find((item) => item.widgetKey === refresh.dataset.refreshPublishedWidget);
      if (widget) loadPublishedDashboardWidget(widget, true).catch((error) => toast(titleCaseMessage(error.message), 'error'));
      return;
    }
    const drillDown = event.target.closest('[data-dashboard-drill-down]');
    if (drillDown) openDashboardWidgetDrillDown(drillDown.dataset.dashboardDrillDown).catch((error) => toast(titleCaseMessage(error.message), 'error'));
  });
  bindAsyncSubmit($('#publishedDashboardCanvas'), (event) => handleDashboardTaskSubmit(event).catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#publishedDashboardCanvas')?.addEventListener('change', (event) => handleDashboardTaskChange(event).catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#publishedDashboardFilters')?.addEventListener('change', (event) => {
    const control = event.target.closest('[data-dashboard-filter-key]');
    if (!control) return;
    const filter = state.dashboardConfiguration.filters.find((item) => item.filterKey === control.dataset.dashboardFilterKey);
    if (!filter) return;
    if (control.dataset.dashboardFilterPart) state.dashboardFilterValues[filter.filterKey] = { ...(state.dashboardFilterValues[filter.filterKey] || {}), [control.dataset.dashboardFilterPart]: control.value };
    else state.dashboardFilterValues[filter.filterKey] = control.multiple ? [...control.selectedOptions].map((option) => option.value) : control.value;
    state.dashboardWidgetResults = {};
    renderPublishedDashboardCanvas();
  });
  $('#publishedDashboardFilters')?.addEventListener('click', (event) => {
    if (!event.target.closest('#resetPublishedDashboardFilters')) return;
    initializeDashboardFilterValues(state.dashboardConfiguration.filters || []);
    state.dashboardWidgetResults = {};
    renderPublishedDashboardCanvas();
  });
  $('#newActionFlowButton')?.addEventListener('click', createActionFlow);
  $('#createManagedActionFlowButton')?.addEventListener('click', createActionFlow);
  bindAsyncSubmit($('#actionFlowCreateForm'), (event) => saveNewActionFlow(event).catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#closeActionFlowCreateModal')?.addEventListener('click', closeActionFlowCreateModal);
  $('#cancelActionFlowCreateModal')?.addEventListener('click', closeActionFlowCreateModal);
  $('#actionFlowCreateModal')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeActionFlowCreateModal();
  });
  $('#backToActionFlowManagement')?.addEventListener('click', showActionFlowManagement);
  $('#actionFlowManagementSearch')?.addEventListener('input', (event) => {
    state.actionFlowSearch = event.currentTarget.value;
    renderActionFlowManagement();
  });
  $('.action-flow-filter-tabs')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action-flow-filter]');
    if (!button) return;
    state.actionFlowStatusFilter = button.dataset.actionFlowFilter;
    renderActionFlowManagement();
  });
  $('#actionFlowManagementRows')?.addEventListener('click', (event) => {
    const openButton = event.target.closest('[data-open-flow-canvas]');
    const checkButton = event.target.closest('[data-check-managed-flow]');
    const deleteButton = event.target.closest('[data-delete-managed-flow]');
    if (openButton) openActionFlowCanvas(openButton.dataset.openFlowCanvas);
    if (deleteButton) {
      deleteManagedActionFlow(deleteButton.dataset.deleteManagedFlow)
        .catch((error) => toast(titleCaseMessage(error.message), 'error'));
      return;
    }
    if (checkButton) {
      api(`/api/action-flows/${encodeURIComponent(checkButton.dataset.checkManagedFlow)}/check`, { method: 'POST' })
        .then((result) => {
          if (result.check?.valid) toast('Automation Flow Check Passed.');
          else toast(titleCaseMessage(result.check?.errors?.[0] || 'Automation Flow Needs Attention.'), 'error');
        })
        .catch((error) => toast(titleCaseMessage(error.message), 'error'));
    }
  });
  $('#saveActionFlowButton')?.addEventListener('click', () => saveActiveActionFlow().catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#checkActionFlowButton')?.addEventListener('click', () => checkActiveActionFlow().catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#actionFlowVersionsButton')?.addEventListener('click', () => openActionFlowVersionsDrawer().catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#publishActionFlowButton')?.addEventListener('click', () => publishActiveActionFlow().catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#createActionFlowVersionButton')?.addEventListener('click', () => createActionFlowVersion().catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#closeActionFlowVersionsDrawer')?.addEventListener('click', closeActionFlowVersionsDrawer);
  $('#closeActionFlowVersionsFooter')?.addEventListener('click', closeActionFlowVersionsDrawer);
  $('#actionFlowVersionsDrawer')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) return closeActionFlowVersionsDrawer();
    const restoreButton = event.target.closest('[data-restore-action-flow-version]');
    if (restoreButton) restoreActionFlowVersion(restoreButton.dataset.restoreActionFlowVersion, restoreButton.dataset.versionNumber).catch((error) => toast(titleCaseMessage(error.message), 'error'));
  });
  $('#runActionFlowButton')?.addEventListener('click', openActionFlowRunModal);
  $('#clearActionFlowRunButton')?.addEventListener('click', clearActionFlowRun);
  bindAsyncSubmit($('#actionFlowRunForm'), (event) => runActiveActionFlowOnce(event).catch((error) => {
    state.actionFlowRun = { status: 'failed', steps: [], error: error.message };
    renderActionFlowStudio();
    toast(titleCaseMessage(error.message), 'error');
  }));
  $('#closeActionFlowRunModal')?.addEventListener('click', closeActionFlowRunModal);
  $('#cancelActionFlowRunModal')?.addEventListener('click', closeActionFlowRunModal);
  $('#actionFlowSearch')?.addEventListener('input', (event) => {
    state.actionFlowSearch = event.currentTarget.value;
    renderActionFlowList();
  });
  $('#actionFlowList')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action-flow-key]');
    if (!button) return;
    openActionFlowCanvas(button.dataset.actionFlowKey);
  });
  $('#actionFlowPalette')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-flow-node-type]');
    if (!button) return;
    const item = actionFlowPaletteItems.find((entry) => entry.type === button.dataset.flowNodeType);
    if (item) addActionFlowNode(item);
  });
  $('#actionFlowCanvas')?.addEventListener('click', (event) => {
    const nodeButton = event.target.closest('[data-select-flow-node]');
    const addBranch = event.target.closest('[data-flow-add-branch]');
    if (nodeButton) {
      state.selectedActionFlowNodeId = nodeButton.dataset.selectFlowNode;
      renderActionFlowStudio();
    } else if (addBranch) {
      state.selectedActionFlowNodeId = addBranch.dataset.flowBranchNode;
      const item = actionFlowPaletteItems.find((entry) => entry.type === 'update_record');
      addActionFlowNode(item, addBranch.dataset.flowBranchNode, addBranch.dataset.flowAddBranch);
    }
  });
  $('#actionFlowCanvas')?.addEventListener('pointerdown', (event) => {
    const button = event.target.closest('[data-select-flow-node]');
    if (!button || event.button !== 0) return;
    const definition = actionFlowDefinition();
    const node = definition.nodes.find((item) => item.id === button.dataset.selectFlowNode);
    if (!node) return;
    const position = actionFlowNodePosition(node, definition.nodes.indexOf(node));
    state.actionFlowDrag = {
      nodeId: node.id,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startX: position.x,
      startY: position.y,
      moved: false
    };
    button.setPointerCapture?.(event.pointerId);
  });
  $('#actionFlowCanvasViewport')?.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('button, input, select, textarea, a')) return;
    const viewport = event.currentTarget;
    state.actionFlowPan = {
      pointerId: event.pointerId,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startScrollLeft: viewport.scrollLeft,
      startScrollTop: viewport.scrollTop
    };
    viewport.classList.add('is-panning');
    viewport.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });
  document.addEventListener('pointermove', (event) => {
    const pan = state.actionFlowPan;
    if (pan) {
      const viewport = $('#actionFlowCanvasViewport');
      if (!viewport) return;
      viewport.scrollLeft = pan.startScrollLeft - (event.clientX - pan.startPointerX);
      viewport.scrollTop = pan.startScrollTop - (event.clientY - pan.startPointerY);
      return;
    }
    const drag = state.actionFlowDrag;
    if (!drag) return;
    const dx = (event.clientX - drag.startPointerX) / state.actionFlowZoom;
    const dy = (event.clientY - drag.startPointerY) / state.actionFlowZoom;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    const node = actionFlowDefinition().nodes.find((item) => item.id === drag.nodeId);
    if (!node) return;
    node.x = Math.max(80, Math.round(drag.startX + dx));
    node.y = Math.max(80, Math.round(drag.startY + dy));
    const wrap = $(`[data-flow-node-wrap="${drag.nodeId}"]`);
    if (wrap) {
      wrap.style.left = `${node.x}px`;
      wrap.style.top = `${node.y}px`;
    }
  });
  document.addEventListener('pointerup', () => {
    if (state.actionFlowPan) {
      state.actionFlowPan = null;
      $('#actionFlowCanvasViewport')?.classList.remove('is-panning');
    }
    const drag = state.actionFlowDrag;
    if (!drag) return;
    state.actionFlowDrag = null;
    if (!drag.moved) return;
    state.selectedActionFlowNodeId = drag.nodeId;
    state.actionFlowDirty = true;
    renderActionFlowStudio();
  });
  document.addEventListener('pointercancel', () => {
    state.actionFlowPan = null;
    state.actionFlowDrag = null;
    $('#actionFlowCanvasViewport')?.classList.remove('is-panning');
  });
  $('#actionFlowInspector')?.addEventListener('input', (event) => {
    if (event.target.id === 'actionFlowNodeLabel') {
      const node = actionFlowDefinition().nodes.find((item) => item.id === state.selectedActionFlowNodeId);
      if (!node) return;
      node.label = event.target.value;
      state.actionFlowDirty = true;
      renderActionFlowCanvas();
      $('#actionFlowSaveState').textContent = 'Unsaved canvas changes';
      $('#saveActionFlowButton').disabled = false;
      return;
    }
    const actionConfigField = event.target.dataset.actionConfigField;
    if (actionConfigField && ['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
      updateActionFlowOperationalConfig(actionConfigField, event.target.value);
      return;
    }
    const mappingField = event.target.dataset.mappingField;
    const mappingRow = event.target.closest('[data-action-flow-mapping-id]');
    if (mappingRow && ['target', 'value'].includes(mappingField) && event.target.tagName === 'INPUT') {
      updateActionFlowMapping(mappingRow.dataset.actionFlowMappingId, mappingField, event.target.value);
      return;
    }
    const ruleField = event.target.dataset.conditionRuleField;
    const ruleRow = event.target.closest('[data-condition-rule-id]');
    if (ruleField === 'value' && ruleRow && event.target.tagName === 'INPUT') {
      updateActionFlowConditionRule(ruleRow.dataset.conditionRuleId, ruleField, event.target.value);
    }
  });
  $('#actionFlowInspector')?.addEventListener('change', (event) => {
    const triggerConfigField = event.target.dataset.triggerConfigField;
    if (triggerConfigField) {
      updateActionFlowTriggerConfig(triggerConfigField, event.target.value);
      return;
    }
    const actionConfigField = event.target.dataset.actionConfigField;
    if (actionConfigField) {
      updateActionFlowOperationalConfig(actionConfigField, event.target.value);
      if (actionConfigField === 'onError') renderActionFlowStudio();
      else if (event.target.tagName === 'SELECT' && actionConfigField === 'operation') renderActionFlowInspector();
      return;
    }
    const mappingField = event.target.dataset.mappingField;
    const mappingRow = event.target.closest('[data-action-flow-mapping-id]');
    if (mappingField === 'targetModule') {
      updateActionFlowMapping('', mappingField, event.target.value, true);
      return;
    }
    if (mappingRow && ['target', 'value'].includes(mappingField)) {
      updateActionFlowMapping(mappingRow.dataset.actionFlowMappingId, mappingField, event.target.value);
      return;
    }
    const ruleField = event.target.dataset.conditionRuleField;
    const ruleRow = event.target.closest('[data-condition-rule-id]');
    if (!ruleField || !ruleRow) return;
    updateActionFlowConditionRule(
      ruleRow.dataset.conditionRuleId,
      ruleField,
      event.target.value,
      ['left', 'operator'].includes(ruleField)
    );
  });
  $('#actionFlowInspector')?.addEventListener('click', (event) => {
    if (event.target.closest('#removeActionFlowNode')) return removeSelectedActionFlowNode();
    if (event.target.closest('#addActionFlowConditionRule')) return addActionFlowConditionRule();
    if (event.target.closest('#addActionFlowParallelBranch')) return addActionFlowParallelBranch();
    if (event.target.closest('#addActionFlowMapping')) return addActionFlowMapping();
    const transformSourceMode = event.target.closest('[data-set-transform-source-mode]');
    if (transformSourceMode) {
      updateActionFlowOperationalConfig('sourceMode', transformSourceMode.dataset.setTransformSourceMode);
      renderActionFlowInspector();
      return;
    }
    const removeMapping = event.target.closest('[data-remove-action-flow-mapping]');
    if (removeMapping) return removeActionFlowMapping(removeMapping.dataset.removeActionFlowMapping);
    const mappingMode = event.target.closest('[data-set-mapping-mode]');
    if (mappingMode) {
      const mappingRow = mappingMode.closest('[data-action-flow-mapping-id]');
      if (mappingRow) updateActionFlowMapping(mappingRow.dataset.actionFlowMappingId, 'mode', mappingMode.dataset.setMappingMode, true);
      return;
    }
    const removeRule = event.target.closest('[data-remove-condition-rule]');
    if (removeRule) return removeActionFlowConditionRule(removeRule.dataset.removeConditionRule);
    const combinator = event.target.closest('[data-condition-combinator]');
    if (combinator) setActionFlowConditionCombinator(combinator.dataset.conditionCombinator);
  });
  $('#actionFlowZoomIn')?.addEventListener('click', () => {
    state.actionFlowZoom = Math.min(1.4, Number((state.actionFlowZoom + .1).toFixed(1)));
    renderActionFlowCanvas();
    $('#actionFlowZoomLabel').textContent = `${Math.round(state.actionFlowZoom * 100)}%`;
  });
  $('#actionFlowZoomOut')?.addEventListener('click', () => {
    state.actionFlowZoom = Math.max(.4, Number((state.actionFlowZoom - .1).toFixed(1)));
    renderActionFlowCanvas();
    $('#actionFlowZoomLabel').textContent = `${Math.round(state.actionFlowZoom * 100)}%`;
  });
  $('#actionFlowFit')?.addEventListener('click', () => {
    const viewport = $('#actionFlowCanvasViewport');
    const bounds = actionFlowCanvasBounds();
    const horizontalFit = (viewport.clientWidth - 80) / bounds.width;
    const verticalFit = (viewport.clientHeight - 80) / bounds.height;
    state.actionFlowZoom = Math.max(.4, Math.min(1, Number(Math.min(horizontalFit, verticalFit).toFixed(2))));
    renderActionFlowCanvas();
    $('#actionFlowZoomLabel').textContent = `${Math.round(state.actionFlowZoom * 100)}%`;
    viewport.scrollTo({ left: 0, top: 0, behavior: preferredScrollBehavior() });
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
  bindAsyncSubmit($('#departmentNodeForm'), (event) => saveDepartmentNode(event).catch((error) => toast(titleCaseMessage(error.message), 'error')));
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
  bindAsyncSubmit($('#formBuilderCreateForm'), (event) => {
    return saveFormBuilderCreate(event).catch((error) => toast(titleCaseMessage(error.message), 'error'));
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
  $('#newModuleButton')?.addEventListener('click', () => openModuleModal().catch((error) => toast(titleCaseMessage(error.message), 'error')));
  $('#moduleForm')?.addEventListener('change', (event) => {
    if (event.target.matches('[name="creationMode"], [name="templateKey"]')) syncModuleCreationMode();
  });
  $('#closeModuleModal')?.addEventListener('click', closeModuleModal);
  $('#cancelModuleButton')?.addEventListener('click', closeModuleModal);
  bindAsyncSubmit($('#moduleForm'), (event) => {
    return saveModule(event).catch((error) => toast(titleCaseMessage(error.message), 'error'));
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
      openModuleModal(editButton.dataset.editModule).catch((error) => toast(titleCaseMessage(error.message), 'error'));
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
      openModuleModal(editButton.dataset.editModule).catch((error) => toast(titleCaseMessage(error.message), 'error'));
    }
  });
  bindAsyncSubmit($('#pageViewPermissionForm'), (event) => {
    return savePageViewPermission(event);
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
    if (checkbox) {
      const picker = checkbox.closest('[data-permission-picker]');
      updatePermissionPickerCount(picker);
      syncPermissionHierarchyState(picker);
    }
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
  bindAsyncSubmit($('#moduleRecordForm'), (event) => {
    return saveModuleRecord(event).catch((error) => toast(titleCaseMessage(error.message), 'error'));
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
  bindAsyncSubmit($('#apiCategoryForm'), (event) => {
    return saveApiCategory(event).catch((error) => toast(titleCaseMessage(error.message), 'error'));
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
  bindAsyncSubmit($('#apiConnectorForm'), (event) => {
    return saveApiConnector(event).catch((error) => toast(titleCaseMessage(error.message), 'error'));
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
  bindAsyncSubmit($('#apiInterfaceForm'), (event) => {
    return saveApiInterface(event).catch((error) => toast(titleCaseMessage(error.message), 'error'));
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
  $('#viewPermissionAuditButton').addEventListener('click', () => {
    openPermissionAuditDrawer().catch((error) => toast(titleCaseMessage(error.message), 'error'));
  });
  $('#refreshPermissionAuditButton').addEventListener('click', loadPermissionAudit);
  $('#permissionAuditModuleFilter').addEventListener('change', loadPermissionAudit);
  $('#permissionAuditActionFilter').addEventListener('change', loadPermissionAudit);
  $('#permissionAuditResultFilter').addEventListener('change', loadPermissionAudit);
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

  bindAsyncSubmit($('#browserButtonForm'), async (event) => {
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
  $('#recordAccessPreviewBody')?.addEventListener('change', (event) => {
    const scope = event.target.closest('[name="recordAccessPreviewScope"]');
    if (scope) {
      $$('#recordAccessPreviewBody .record-scope-option').forEach((option) => {
        option.classList.toggle('is-selected', option.querySelector('input')?.checked);
      });
    }
    const checkbox = event.target.closest('.permission-check input[type="checkbox"]');
    if (checkbox) updatePermissionPickerCount(checkbox.closest('[data-permission-picker]'));
  });
  $('#recordAccessPreviewBody')?.addEventListener('input', (event) => {
    const search = event.target.closest('[data-permission-search]');
    if (search) filterPermissionPicker(search.closest('[data-permission-picker]'));
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
    if (event.key === 'Escape' && state.workflowRouteDesignerOpen) {
      closeWorkflowRouteDesigner();
      return;
    }
    if (event.key !== 'Escape') return;
    if (!$('#notificationDrawer').hidden) {
      toggleNotificationDrawer(false);
      $('#notificationBell').focus();
      return;
    }
    if (!$('#actionFlowCreateModal').hidden) {
      closeActionFlowCreateModal();
      return;
    }
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
    if (!$('#permissionAuditDrawer').hidden) {
      closePermissionAuditDrawer();
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
  $('#closePermissionAuditDrawer').addEventListener('click', closePermissionAuditDrawer);
  $('#closePermissionAuditFooter').addEventListener('click', closePermissionAuditDrawer);
  $('#permissionAuditDrawer').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closePermissionAuditDrawer();
  });
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
    if (actionButton.dataset.designAction === 'move-up') {
      moveFormDesignField(field.fieldKey, -1);
      return;
    }
    if (actionButton.dataset.designAction === 'move-down') {
      moveFormDesignField(field.fieldKey, 1);
      return;
    }
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
    const card = event.target.closest('[data-design-field]');
    if (card && event.target === card && ['Enter', ' '].includes(event.key)) {
      event.preventDefault();
      selectFormDesignField(card.dataset.designField);
      $('#formDesignCanvas [data-design-action="move-up"]:not(:disabled), #formDesignCanvas [data-design-action="move-down"]:not(:disabled)')?.focus();
      return;
    }
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
    state.formDesignDropPlacement = fieldCard ? formDesignDropPlacement(fieldCard, event.clientY) : '';
    if (state.dragOverFormDesignFieldKey !== nextDragOver) {
      state.dragOverFormDesignFieldKey = nextDragOver;
      $$('#formDesignCanvas [data-design-field]').forEach((card) => {
        card.classList.toggle('is-drag-over', card.dataset.designField === state.dragOverFormDesignFieldKey);
      });
    }
    $$('#formDesignCanvas [data-design-field]').forEach((card) => {
      card.classList.toggle('is-drop-before', card === fieldCard && state.formDesignDropPlacement === 'before');
      card.classList.toggle('is-drop-after', card === fieldCard && state.formDesignDropPlacement === 'after');
    });
    autoScrollReorderSurface($('#formDesignCanvas'), event.clientY, event.clientX);
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
      reorderFormDesignFieldAt(draggedFieldKey, fieldCard.dataset.designField, state.formDesignDropPlacement || 'before');
    } else if (dropzone?.dataset.designDropzone === 'form') {
      await setFormDesignFieldVisibility(draggedFieldKey, true);
    }
  });
  $('#formDesignCanvas').addEventListener('dragend', () => {
    state.draggingFormDesignFieldKey = '';
    state.dragOverFormDesignFieldKey = '';
    state.draggingFormDesignDetailTable = '';
    state.dragOverFormDesignDetailTable = '';
    state.formDesignDropPlacement = '';
    $$('#formDesignCanvas [data-design-field]').forEach((card) => {
      card.classList.remove('is-dragging', 'is-drag-over', 'is-drop-before', 'is-drop-after');
    });
    $$('#formDesignCanvas [data-design-detail-table]').forEach((table) => {
      table.classList.remove('is-dragging', 'is-drag-over');
    });
    $$('#formDesignCanvas [data-design-dropzone]').forEach((zone) => zone.classList.remove('is-drop-active'));
  });
  $('#formDesignCanvas').addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' || !event.target.closest('.form-reorder-grip')) return;
    const card = event.target.closest('[data-design-field]');
    if (!card) return;
    state.formDesignPointerDrag = { pointerId: event.pointerId, key: card.dataset.designField, startX: event.clientX, startY: event.clientY, active: false };
    card.setPointerCapture?.(event.pointerId);
  });
  window.addEventListener('pointermove', (event) => {
    const drag = state.formDesignPointerDrag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!drag.active && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 10) return;
    drag.active = true;
    state.draggingFormDesignFieldKey = drag.key;
    const card = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('[data-design-field]');
    const placement = card ? formDesignDropPlacement(card, event.clientY) : '';
    state.dragOverFormDesignFieldKey = card?.dataset.designField || '';
    state.formDesignDropPlacement = placement;
    $$('#formDesignCanvas [data-design-field]').forEach((item) => {
      item.classList.toggle('is-dragging', item.dataset.designField === drag.key);
      item.classList.toggle('is-drop-before', item === card && placement === 'before');
      item.classList.toggle('is-drop-after', item === card && placement === 'after');
    });
    autoScrollReorderSurface($('#formDesignCanvas'), event.clientY, event.clientX);
    event.preventDefault();
  }, { passive: false });
  const finishFormDesignPointerDrag = (event) => {
    const drag = state.formDesignPointerDrag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const card = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('#formDesignCanvas [data-design-field]');
    if (event.type === 'pointerup' && drag.active && card) reorderFormDesignFieldAt(drag.key, card.dataset.designField, formDesignDropPlacement(card, event.clientY));
    state.formDesignPointerDrag = null; state.draggingFormDesignFieldKey = ''; state.dragOverFormDesignFieldKey = ''; state.formDesignDropPlacement = '';
    $$('#formDesignCanvas [data-design-field]').forEach((card) => card.classList.remove('is-dragging', 'is-drop-before', 'is-drop-after'));
  };
  window.addEventListener('pointerup', finishFormDesignPointerDrag);
  window.addEventListener('pointercancel', finishFormDesignPointerDrag);
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    stopReorderAutoScroll();
    if (state.menuPointerDrag) finishMenuPointerDrag({ type: 'pointercancel', pointerId: state.menuPointerDrag.pointerId, clientX: 0, clientY: 0 });
    if (state.formDesignPointerDrag) finishFormDesignPointerDrag({ type: 'pointercancel', pointerId: state.formDesignPointerDrag.pointerId, clientX: 0, clientY: 0 });
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
  bindAsyncSubmit($('#fieldLinkageForm'), async (event) => {
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
  bindAsyncSubmit($('#formulaBuilderForm'), async (event) => {
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

  bindAsyncSubmit($('#fieldConfigForm'), async (event) => {
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

  bindAsyncSubmit($('#batchFieldForm'), async (event) => {
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

  bindAsyncSubmit($('#fieldPropertiesForm'), async (event) => {
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

  bindAsyncSubmit($('#importExportMappingForm'), async (event) => {
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

  bindAsyncSubmit($('#customerForm'), async (event) => {
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

  bindAsyncSubmit($('#userForm'), async (event) => {
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

  bindAsyncSubmit($('#importForm'), async (event) => {
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
  loadDocumentPrototypeState();
  try {
    await loadAuthConfig();
  } catch (error) {
    toast(titleCaseMessage(error.message), 'error');
  }
  initializeScrollableModalFrames();
  initializeModalSurfaces();
  initializeParallelInspectors();
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
