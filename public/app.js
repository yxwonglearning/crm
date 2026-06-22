const state = {
  token: localStorage.getItem('crm.token') || '',
  user: JSON.parse(localStorage.getItem('crm.user') || 'null'),
  countries: [],
  users: [],
  customers: [],
  customerFields: [],
  userFields: [],
  formDesignLayouts: {},
  activeAdminSection: 'adminModulesSection',
  adminMenuCollapsed: false,
  activeConfigModule: 'customers',
  formBuilderSearch: '',
  editingFieldKey: '',
  batchActiveTable: 'main',
  batchDetailTables: [],
  batchEditRows: [],
  batchDraftRows: [],
  batchSelectedRowIds: new Set(),
  batchDeletedFieldKeys: new Set(),
  editingFormulaFieldKey: '',
  activeFormDesignType: 'add',
  selectedFormDesignFieldKey: '',
  draggingFormDesignFieldKey: '',
  dragOverFormDesignFieldKey: '',
  draggingFormDesignDetailTable: '',
  dragOverFormDesignDetailTable: '',
  activeCustomerFormType: 'add',
  activeUserFormType: 'add',
  selectedCustomerIds: new Set()
};

const configModules = [
  { key: 'customers', name: 'Customers', description: 'Customer records and contact forms' },
  { key: 'users', name: 'Users', description: 'Team access and user profile forms' }
];

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

function formulaFields() {
  return activeConfigFields().filter((field) => field.tableType !== 'detail');
}

function formulaTargetFields() {
  const fields = formulaFields().filter((field) => !field.locked);
  return fields.length ? fields : formulaFields();
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
  return moduleKey === 'users' ? state.userFields : state.customerFields;
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
  return {
    order: defaultFormDesignOrder(moduleKey),
    hidden: defaultFormDesignHiddenFields(moduleKey)
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
      hidden: [...fallback.hidden]
    };
  }
  return {
    order: Array.isArray(layout?.order) ? layout.order : [...fallback.order],
    hidden: Array.isArray(layout?.hidden) ? layout.hidden : [...fallback.hidden]
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
  writeFormDesignLayouts(layouts);
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
  $$('[data-design-action="edit-field"], [data-design-action="formula"]').forEach((button) => {
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
  return `
    <article class="form-design-field form-design-preview-field ${field.fieldKey === state.selectedFormDesignFieldKey ? 'is-selected' : ''} ${field.fieldKey === state.draggingFormDesignFieldKey ? 'is-dragging' : ''} ${field.fieldKey === state.dragOverFormDesignFieldKey ? 'is-drag-over' : ''}" data-design-field="${escapeHtml(field.fieldKey)}" draggable="true" title="Drag to reorder. Double-click to configure formula.">
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
    return `<button type="button" class="secondary browser-field-button" disabled>Browse</button>`;
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
    hidden: [...(layouts.draft[sourceType]?.hidden || [])]
  };
  writeFormDesignLayouts(layouts);
  renderFormDesignDrawer();
  toast(`Copied ${titleCaseMessage(sourceType)} layout.`);
}

function activeFormDesignLayout() {
  const layouts = readFormDesignLayouts();
  return layouts.draft[state.activeFormDesignType] || defaultFormDesignLayout();
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
    hidden: [...(layouts.draft[state.activeFormDesignType]?.hidden || [])]
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
    id: `existing-${field.fieldKey}`,
    existing: true,
    locked: Boolean(field.locked),
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
    || state.batchDraftRows.find((row) => row.id === rowId);
}

function canDeleteBatchRow(row) {
  if (!row) return false;
  if (!row.existing) return true;
  return !row.locked && Number(row.dataCount || 0) === 0;
}

function createBatchDraftRow(tableKey = state.batchActiveTable) {
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
    required: false
  });
}

function renderBatchTabs() {
  const tabs = $('#batchTableTabs');
  if (!tabs) return;
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
  $('#batchActiveTableLabel').textContent = tableLabel(state.batchActiveTable);
}

function renderBatchRows() {
  const body = $('#batchFieldRows');
  if (!body) return;
  const rows = batchRowsForActiveTable();
  const selectableRows = rows.filter((item) => canDeleteBatchRow(item.row));
  const selectedSelectableRows = selectableRows.filter((item) => state.batchSelectedRowIds.has(item.row.id));
  const selectAll = $('#selectAllBatchFields');
  if (selectAll) {
    selectAll.disabled = selectableRows.length === 0;
    selectAll.checked = selectableRows.length > 0 && selectedSelectableRows.length === selectableRows.length;
    selectAll.indeterminate = selectedSelectableRows.length > 0 && selectedSelectableRows.length < selectableRows.length;
  }
  const deleteButton = $('#deleteSelectedBatchFields');
  if (deleteButton) {
    deleteButton.disabled = selectedSelectableRows.length === 0;
  }
  body.innerHTML = rows.map((item) => {
    const row = item.row;
    const isExisting = item.existing;
    const canDelete = canDeleteBatchRow(row);
    const deleteTitle = row.locked
      ? 'System field cannot be deleted'
      : (Number(row.dataCount || 0) > 0 ? 'Field has data and cannot be deleted' : 'Select field for delete');
    return `
      <tr class="${isExisting ? 'is-existing' : ''}" data-batch-row="${escapeHtml(row.id)}" ${isExisting ? 'data-existing-batch-row="true"' : ''}>
        <td class="batch-select-column">
          <input name="deleteRow" type="checkbox" aria-label="Select ${escapeHtml(row.label || row.fieldKey || 'field')} for delete" title="${escapeHtml(deleteTitle)}" ${state.batchSelectedRowIds.has(row.id) ? 'checked' : ''} ${canDelete ? '' : 'disabled'}>
        </td>
        <td><input name="label" value="${escapeHtml(row.label)}" placeholder="Field name"></td>
        <td><input name="fieldKey" value="${escapeHtml(row.fieldKey)}" placeholder="Auto" ${isExisting ? 'readonly' : ''}></td>
        <td><input name="databaseFieldName" value="${escapeHtml(row.databaseFieldName || row.fieldKey)}" placeholder="Auto" readonly></td>
        <td><select name="type" ${row.locked ? 'disabled' : ''}>${renderFieldTypeOptions(row.type, isExisting)}</select></td>
        <td><input name="options" value="${escapeHtml(row.options)}" placeholder="Option A, Option B" ${isDropdownOptionFieldType(row.type) ? '' : 'hidden'}></td>
        <td>${batchEditableCheckbox('showInTable', row.showInTable)}</td>
        <td>${batchEditableCheckbox('showInForm', row.showInForm)}</td>
        <td>${batchEditableCheckbox('showInImport', row.showInImport)}</td>
        <td>${batchEditableCheckbox('required', row.required)}</td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="10">No fields in this table yet.</td></tr>';
}

function batchEditableCheckbox(name, checked) {
  return `<input name="${escapeHtml(name)}" type="checkbox" ${checked ? 'checked' : ''}>`;
}

function renderBatchFieldModal() {
  renderBatchTabs();
  renderBatchRows();
}

function openBatchFieldModal() {
  state.batchActiveTable = 'main';
  state.batchDetailTables = activeConfigFields()
    .filter((field) => field.tableType === 'detail' && field.detailTableName)
    .map((field) => field.detailTableName)
    .filter((value, index, list) => list.indexOf(value) === index);
  state.batchEditRows = activeConfigFields().map(batchRowFromField);
  state.batchDraftRows = [];
  state.batchSelectedRowIds = new Set();
  state.batchDeletedFieldKeys = new Set();
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
        <td>${propertyCheckbox('editable', true)}</td>
        <td>${propertyCheckbox('required', field.required)}</td>
        <td>${propertyCheckbox('disableManualInput', false)}</td>
      </tr>
    `;
  }).join('');
}

function propertyCheckbox(name, checked, disabled = false) {
  return `<input name="${escapeHtml(name)}" type="checkbox" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}>`;
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

function renderFormulaTargets(selectedFieldKey = '') {
  const select = $('#formulaBuilderForm')?.elements.targetField;
  if (!select) return;
  const fields = formulaTargetFields();
  select.innerHTML = fields.map((field) => (
    `<option value="${escapeHtml(field.fieldKey)}" ${field.fieldKey === selectedFieldKey ? 'selected' : ''}>${escapeHtml(field.label)}</option>`
  )).join('');
}

function renderFormulaVariables(targetFieldKey = '') {
  const container = $('#formulaVariableList');
  if (!container) return;
  container.innerHTML = formulaFields()
    .filter((field) => field.fieldKey !== targetFieldKey)
    .map((field) => `
      <button type="button" class="link-button" data-insert-formula="{${escapeHtml(field.fieldKey)}}">${escapeHtml(field.label)}</button>
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
    toast('Add A Custom Field Before Creating A Formula.', 'error');
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
  const card = modal?.querySelector('.modal-card, .form-design-drawer');
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
  const card = button.closest('.modal-card, .form-design-drawer');
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
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, { ...options, headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(payload.error || 'Request failed');
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}

function serializeForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function showView(id) {
  closeCustomerModal();
  closeImportModal();
  closeDeleteCustomerModal();
  closeUserModal();
  closeFieldConfigModal();
  closeFormDesignDrawer();
  closeFormulaBuilderModal();
  $('#loginView').hidden = id !== 'loginView';
  $$('.view').forEach((view) => {
    view.hidden = view.id !== id;
  });
  $$('.nav-button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.view === id);
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
}

function toggleAdminMenu() {
  state.adminMenuCollapsed = !state.adminMenuCollapsed;
  document.body.classList.toggle('admin-nav-collapsed', state.adminMenuCollapsed);
  $('#toggleAdminMenu').textContent = state.adminMenuCollapsed ? '›' : '‹';
  $('#toggleAdminMenu').setAttribute('aria-label', state.adminMenuCollapsed ? 'Expand admin menu' : 'Collapse admin menu');
}

function setSession(token, user) {
  state.token = token;
  state.user = user;
  document.body.classList.remove('is-auth');
  document.body.classList.add('is-app');
  localStorage.setItem('crm.token', token);
  localStorage.setItem('crm.user', JSON.stringify(user));
  $('#sessionLabel').textContent = `${user.name} · ${user.role}`;
  $('#logoutButton').hidden = false;
  $('[data-view="usersView"]').hidden = user.role !== 'admin';
  $('[data-view="sysadminView"]').hidden = user.role !== 'admin';
}

function clearSession() {
  state.token = '';
  state.user = null;
  document.body.classList.remove('is-app');
  document.body.classList.add('is-auth');
  localStorage.removeItem('crm.token');
  localStorage.removeItem('crm.user');
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
  return state.customerFields.filter((field) => field.showInTable);
}

function formFields() {
  return customerPublishedFormFields(state.activeCustomerFormType);
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

function renderCustomerFieldInput(field, value = '', options = {}) {
  const required = options.enforceRequired === false ? '' : (field.required ? 'required' : '');
  const binding = options.detailField
    ? `data-detail-field="${escapeHtml(field.fieldKey)}"`
    : `name="${escapeHtml(field.fieldKey)}"`;
  const formulaReadonly = field.formulaEnabled && field.formulaExpression && !options.detailField
    ? 'readonly data-formula-field="true"'
    : '';

  if (field.type === 'textarea') {
    return `<textarea ${binding} rows="4" ${required} ${formulaReadonly}>${escapeHtml(value)}</textarea>`;
  }

  if (field.type === 'select' || field.type === 'dropdownbox') {
    const options = (field.options || []).map((option) => (
      `<option value="${escapeHtml(option)}" ${String(value) === String(option) ? 'selected' : ''}>${escapeHtml(titleCaseMessage(option))}</option>`
    )).join('');
    return `<select ${binding} ${required}>${options}</select>`;
  }

  if (field.type === 'country') {
    const options = state.countries.map((country) => (
      `<option value="${country.id}" ${Number(value) === Number(country.id) ? 'selected' : ''}>${escapeHtml(country.name)}</option>`
    )).join('');
    return `<select ${binding} ${required}>${options}</select>`;
  }

  if (field.type === 'owner') {
    const options = '<option value="">Unassigned</option>' + state.users
      .filter((user) => user.status === 'active')
      .map((user) => `<option value="${user.id}" ${Number(value) === Number(user.id) ? 'selected' : ''}>${escapeHtml(user.name)}</option>`)
      .join('');
    return `<select ${binding}>${options}</select>`;
  }

  if (field.type === 'checkbox') {
    return `<input ${binding} type="checkbox" value="true" ${value ? 'checked' : ''}>`;
  }

  if (field.type === 'browser_button') {
    return `<button type="button" class="secondary browser-field-button" disabled>Browse</button>`;
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
  return `<input ${binding} type="${escapeHtml(inputType)}" value="${escapeHtml(value)}" ${step} ${required} ${formulaReadonly}>`;
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
    values[input.dataset.detailField] = input.type === 'checkbox' ? input.checked : input.value;
  });
  return values;
}

function clearDetailRow(row) {
  row.querySelector('[data-select-detail-row]').checked = false;
  row.querySelectorAll('[data-detail-field]').forEach((input) => {
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
  const mainFields = mainFormFields().map((field) => renderMainCustomerField(field, customer)).join('');
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
      <td><button class="link-button" data-edit-customer="${customer.id}">Edit</button></td>
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
  const formulaReadonly = field.formulaEnabled && field.formulaExpression ? 'readonly data-formula-field="true"' : '';

  if (field.type === 'textarea') {
    return `<textarea ${name} rows="4" ${required} ${formulaReadonly}>${escapeHtml(value)}</textarea>`;
  }
  if (field.type === 'select' || field.type === 'dropdownbox') {
    const options = (field.options || []).map((option) => (
      `<option value="${escapeHtml(option)}" ${String(value) === String(option) ? 'selected' : ''}>${escapeHtml(titleCaseMessage(option))}</option>`
    )).join('');
    return `<select ${name} ${required}>${options}</select>`;
  }
  if (field.type === 'checkbox') {
    return `<input ${name} type="checkbox" value="true" ${value ? 'checked' : ''}>`;
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
  return `<input ${name} type="${escapeHtml(inputType)}" value="${escapeHtml(value)}" ${step} ${minlength} ${required} ${autocomplete} ${formulaReadonly}>`;
}

function renderUserFormFields(user = null) {
  const editing = Boolean(user);
  $('#userFormFields').innerHTML = userFormFields().map((field) => {
    const input = `
      <label>
        ${labelTextWithRequired(field)}
        ${renderGenericFieldInput(field, valueForUserForm(user, field), editing)}
      </label>
    `;
    if (field.fieldKey !== 'password') {
      return input;
    }
    const required = editing ? '' : 'required';
    return `${input}
      <label>
        Confirm Password
        <input name="confirmPassword" type="password" minlength="8" ${required} autocomplete="new-password">
      </label>
    `;
  }).join('');
}

function renderFieldConfig() {
  const body = $('#fieldConfigRows');
  if (!body) return;
  const fields = activeConfigFields();
  const module = configModules.find((item) => item.key === state.activeConfigModule);

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
      <td><button type="button" class="link-button" data-edit-field="${escapeHtml(field.fieldKey)}">Edit</button></td>
    </tr>
  `).join('') || `<tr><td colspan="8">No fields found for ${escapeHtml(module?.name || 'this form')}.</td></tr>`;
  renderFormModuleList();
}
function moduleFieldCount(moduleKey) {
  return moduleKey === 'users' ? state.userFields.length : state.customerFields.length;
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
  `).join('') || '<p class="muted module-list-empty">No forms found.</p>';
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
      </div>
    </div>
    <div class="form-design-workspace">
      <div class="form-design-section form-design-dropzone" data-design-dropzone="form">
        <div class="form-design-preview-card">
          <div class="form-design-section-heading">
            <strong>${escapeHtml(titleCaseMessage(state.activeFormDesignType))} Form</strong>
            <span>${mainFields.length} main fields</span>
          </div>
          <div class="form-design-grid">
            ${fields.map(formDesignFieldCard).join('') || '<p class="muted">No fields available for this form.</p>'}
          </div>
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

function openFormDesignDrawer() {
  state.activeFormDesignType = state.activeFormDesignType || 'add';
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

function activeConfigFields() {
  return state.activeConfigModule === 'users' ? state.userFields : state.customerFields;
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
  form.elements.browserModulePreview.value = '';
  form.elements.type.disabled = false;
  form.elements.tableType.disabled = false;
  form.elements.label.disabled = false;
  form.elements.showInTable.checked = true;
  form.elements.showInForm.checked = true;
  form.elements.showInImport.checked = false;
  form.elements.required.checked = false;
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
    form.elements.showInTable.checked = field.showInTable;
    form.elements.showInForm.checked = field.showInForm;
    form.elements.showInImport.checked = field.showInImport;
    form.elements.required.checked = field.required;
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
  } else {
    state.customerFields = fields;
    renderCustomerFormFields();
    renderCustomers();
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
  const [countries, users, customerConfig, userConfig] = await Promise.all([
    api('/api/countries'),
    api('/api/users').catch((error) => {
      if (state.user?.role === 'admin') throw error;
      return { users: [] };
    }),
    api('/api/customers/config'),
    api('/api/users/config').catch((error) => {
      if (state.user?.role === 'admin') throw error;
      return { fields: [] };
    })
  ]);

  state.countries = countries.countries;
  state.users = users.users;
  state.customerFields = customerConfig.fields;
  state.userFields = userConfig.fields;
  rememberModuleConfig('customers', customerConfig);
  rememberModuleConfig('users', userConfig);
  renderCountries();
  renderUsers();
  renderOwners();
  renderUserFormFields();
  renderFieldConfig();
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

function openDeleteCustomerModal() {
  const ids = selectedCustomerIds();
  if (!ids.length) {
    toast('Select At Least One Customer To Delete.', 'error');
    return;
  }

  $('#deleteCustomerMessage').textContent = `Delete ${ids.length} selected customer${ids.length === 1 ? '' : 's'}? This cannot be undone.`;
  $('#deleteCustomerModal').hidden = false;
  document.body.classList.add('modal-open');
}

function closeDeleteCustomerModal() {
  const modal = $('#deleteCustomerModal');
  if (!modal) return;
  resetModalFullscreen(modal);
  modal.hidden = true;
  document.body.classList.remove('modal-open');
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

function bindEvents() {
  $('#loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const result = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(serializeForm(event.currentTarget))
      });
      setSession(result.token, result.user);
      showView('customersView');
      await loadBootstrap();
      toast('Signed In.');
    } catch (error) {
      toast(titleCaseMessage(error.message), 'error');
    }
  });

  $('#logoutButton').addEventListener('click', clearSession);

  $('#templateLink').addEventListener('click', async (event) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/imports/customers/template', {
        headers: { Authorization: `Bearer ${state.token}` }
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

  $$('.admin-section-button').forEach((button) => {
    button.addEventListener('click', () => {
      showAdminSection(button.dataset.adminSection);
    });
  });
  $('#toggleAdminMenu').addEventListener('click', toggleAdminMenu);

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
    if (event.target.name === 'countryId') {
      updateDialCode();
      applyCustomerFormulas();
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
    applyCustomerFormulas();
  });
  $('#customerFormFields').addEventListener('input', () => {
    applyCustomerFormulas();
  });
  $('#customerFormFields').addEventListener('click', (event) => {
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
  $('#closeDeleteCustomerModal').addEventListener('click', closeDeleteCustomerModal);
  $('#cancelDeleteCustomers').addEventListener('click', closeDeleteCustomerModal);
  $('#deleteCustomerModal').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      closeDeleteCustomerModal();
    }
  });
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
  document.addEventListener('click', (event) => {
    const fullscreenButton = event.target.closest('[data-modal-fullscreen]');
    if (!fullscreenButton) return;
    toggleModalFullscreen(fullscreenButton);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!$('#customerModal').hidden) {
      closeCustomerModal();
    }
    if (!$('#importModal').hidden) {
      closeImportModal();
    }
    if (!$('#deleteCustomerModal').hidden) {
      closeDeleteCustomerModal();
    }
    if (!$('#userModal').hidden) {
      closeUserModal();
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
    if (!$('#formDesignDrawer').hidden) {
      closeFormDesignDrawer();
    }
    if (!$('#formulaBuilderModal').hidden) {
      closeFormulaBuilderModal();
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

  $('#addFieldButton').addEventListener('click', () => openFieldConfigModal());
  $('#formulaButton').addEventListener('click', () => openFormulaBuilderModal());
  $('#formDesignButton').addEventListener('click', openFormDesignDrawer);
  $('#batchAddFieldsButton').addEventListener('click', openBatchFieldModal);
  $('#fieldPropertiesButton').addEventListener('click', openFieldPropertiesModal);
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
  $('#selectAllBatchFields').addEventListener('change', (event) => {
    const rows = batchRowsForActiveTable().map((item) => item.row).filter(canDeleteBatchRow);
    rows.forEach((row) => {
      if (event.target.checked) {
        state.batchSelectedRowIds.add(row.id);
      } else {
        state.batchSelectedRowIds.delete(row.id);
      }
    });
    renderBatchRows();
  });
  $('#deleteSelectedBatchFields').addEventListener('click', () => {
    const selectedIds = new Set(state.batchSelectedRowIds);
    if (!selectedIds.size) return;
    const deletableSelectedRows = [
      ...state.batchEditRows,
      ...state.batchDraftRows
    ].filter((row) => selectedIds.has(row.id) && canDeleteBatchRow(row));
    deletableSelectedRows.forEach((row) => {
      if (row.existing) {
        state.batchDeletedFieldKeys.add(row.fieldKey);
      }
    });
    state.batchEditRows = state.batchEditRows.filter((row) => !selectedIds.has(row.id) || !canDeleteBatchRow(row));
    state.batchDraftRows = state.batchDraftRows.filter((row) => !selectedIds.has(row.id) || !canDeleteBatchRow(row));
    state.batchSelectedRowIds = new Set();
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
  $('#closeFormDesignDrawer').addEventListener('click', closeFormDesignDrawer);
  $('#cancelFormDesignButton').addEventListener('click', closeFormDesignDrawer);
  $('#saveFormDesignDraftButton').addEventListener('click', saveFormDesignDraft);
  $('#publishFormDesignButton').addEventListener('click', publishFormDesign);
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
    if (!input) return;
    const oldTableName = input.dataset.detailTableNameInput;
    const nextTableName = normalizeDetailTableNamePreview(input.value);
    input.value = nextTableName || oldTableName;
    renameFormDesignDetailTable(oldTableName, input.value);
  });
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
    delete data.browserModulePreview;
    data.required = form.elements.required.checked;
    data.showInTable = form.elements.showInTable.checked;
    data.showInForm = form.elements.showInForm.checked;
    data.showInImport = form.elements.showInImport.checked;
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
    const existingRows = state.batchEditRows.filter((row) => row.label.trim());
    const newRows = state.batchDraftRows.filter((row) => row.label.trim());
    const deletedFieldKeys = Array.from(state.batchDeletedFieldKeys);
    if (!existingRows.length && !newRows.length && !deletedFieldKeys.length) {
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
      const changeCount = savedCount + deletedFieldKeys.length;
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
        const required = showInForm && row.querySelector('[name="required"]').checked;
        visibilityByFieldKey[field.fieldKey] = showInForm;
        latestConfig = await api(`/api/sysadmin/modules/${state.activeConfigModule}/fields/${field.fieldKey}`, {
          method: 'PATCH',
          body: JSON.stringify({
            showInForm,
            required
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

  $('#confirmDeleteCustomers').addEventListener('click', async (event) => {
    const ids = selectedCustomerIds();
    if (!ids.length) {
      closeDeleteCustomerModal();
      return;
    }

    event.currentTarget.disabled = true;
      event.currentTarget.textContent = 'Deleting...';
    try {
      const result = await api('/api/customers', {
        method: 'DELETE',
        body: JSON.stringify({ ids })
      });
      state.selectedCustomerIds.clear();
      closeDeleteCustomerModal();
      await loadCustomers();
      toast(`Deleted ${result.deletedCount} Customer${result.deletedCount === 1 ? '' : 's'}.`);
    } catch (error) {
      toast(titleCaseMessage(error.message), 'error');
    } finally {
      event.currentTarget.disabled = false;
      event.currentTarget.textContent = 'Delete';
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
  bindEvents();
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
