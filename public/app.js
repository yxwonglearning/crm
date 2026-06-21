const state = {
  token: localStorage.getItem('crm.token') || '',
  user: JSON.parse(localStorage.getItem('crm.user') || 'null'),
  countries: [],
  users: [],
  customers: [],
  customerFields: [],
  userFields: [],
  activeAdminSection: 'adminModulesSection',
  adminMenuCollapsed: false,
  activeConfigModule: 'customers',
  formBuilderSearch: '',
  editingFieldKey: '',
  batchActiveTable: 'main',
  batchDetailTables: [],
  batchDraftRows: [],
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

function renderReadonlyCheckbox(checked) {
  return `<input class="readonly-checkbox" type="checkbox" ${checked ? 'checked' : ''} disabled aria-label="${checked ? 'Checked' : 'Unchecked'}">`;
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

  $('#dropdownOptionsRow').hidden = type !== 'dropdownbox';
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
  const existingRows = activeConfigFields()
    .filter((field) => tableKeyForField(field) === state.batchActiveTable)
    .map((field) => ({ existing: true, field }));
  const draftRows = state.batchDraftRows
    .filter((row) => row.tableKey === state.batchActiveTable)
    .map((row) => ({ existing: false, row }));
  return [...existingRows, ...draftRows];
}

function createBatchDraftRow(tableKey = state.batchActiveTable) {
  const id = `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  state.batchDraftRows.push({
    id,
    tableKey,
    label: '',
    fieldKey: '',
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
  body.innerHTML = rows.map((item) => {
    if (item.existing) {
      const field = item.field;
      return `
        <tr class="is-existing">
          <td><strong>${escapeHtml(field.label)}</strong></td>
          <td>${escapeHtml(field.fieldKey)}</td>
          <td>${escapeHtml(field.dataKey || field.fieldKey)}</td>
          <td>${escapeHtml(fieldTypeLabel(field.type))}</td>
          <td>${escapeHtml((field.options || []).join(', '))}</td>
          <td>${renderReadonlyCheckbox(field.showInTable)}</td>
          <td>${renderReadonlyCheckbox(field.showInForm)}</td>
          <td>${renderReadonlyCheckbox(field.showInImport)}</td>
          <td>${renderReadonlyCheckbox(field.required)}</td>
          <td><span class="muted">Saved</span></td>
        </tr>
      `;
    }

    const row = item.row;
    return `
      <tr data-batch-row="${escapeHtml(row.id)}">
        <td><input name="label" value="${escapeHtml(row.label)}" placeholder="Field name"></td>
        <td><input name="fieldKey" value="${escapeHtml(row.fieldKey)}" placeholder="Auto" readonly></td>
        <td><input name="databaseFieldName" value="${escapeHtml(row.fieldKey)}" placeholder="Auto" readonly></td>
        <td><select name="type">${renderFieldTypeOptions(row.type, false)}</select></td>
        <td><input name="options" value="${escapeHtml(row.options)}" placeholder="Option A, Option B" ${row.type === 'dropdownbox' ? '' : 'hidden'}></td>
        <td>${batchEditableCheckbox('showInTable', row.showInTable)}</td>
        <td>${batchEditableCheckbox('showInForm', row.showInForm)}</td>
        <td>${batchEditableCheckbox('showInImport', row.showInImport)}</td>
        <td>${batchEditableCheckbox('required', row.required)}</td>
        <td><button type="button" class="link-button" data-remove-batch-row="${escapeHtml(row.id)}">Remove</button></td>
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
  state.batchDraftRows = [];
  renderBatchFieldModal();
  $('#batchFieldModal').hidden = false;
  document.body.classList.add('modal-open');
}

function closeBatchFieldModal() {
  const modal = $('#batchFieldModal');
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

function renderFieldProperties() {
  const body = $('#fieldPropertiesRows');
  if (!body) return;
  body.innerHTML = activeConfigFields().map((field) => {
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

function openFieldPropertiesModal() {
  renderFieldProperties();
  $('#fieldPropertiesModal').hidden = false;
  document.body.classList.add('modal-open');
}

function closeFieldPropertiesModal() {
  const modal = $('#fieldPropertiesModal');
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function toast(message, type = 'ok') {
  const element = $('#toast');
  element.textContent = message;
  element.className = `toast ${type === 'error' ? 'error' : ''}`;
  element.hidden = false;
  setTimeout(() => {
    element.hidden = true;
  }, 4200);
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
  return state.customerFields.filter((field) => field.showInForm);
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

function userTableFields() {
  return state.userFields.filter((field) => field.showInTable);
}

function userFormFields() {
  return state.userFields.filter((field) => field.showInForm);
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

  if (field.type === 'textarea') {
    return `<textarea ${binding} rows="4" ${required}>${escapeHtml(value)}</textarea>`;
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
  return `<input ${binding} type="${escapeHtml(inputType)}" value="${escapeHtml(value)}" ${step} ${required}>`;
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
          ${escapeHtml(field.label)}
          ${control}
        </label>
        <label>
          Code
          <input id="dialCode" readonly>
        </label>
      </div>
    `;
  }
  return `
    <label>
      ${escapeHtml(field.label)}
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

  if (field.type === 'textarea') {
    return `<textarea ${name} rows="4" ${required}>${escapeHtml(value)}</textarea>`;
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
  return `<input ${name} type="${escapeHtml(inputType)}" value="${escapeHtml(value)}" ${step} ${minlength} ${required} ${autocomplete}>`;
}

function renderUserFormFields(user = null) {
  const editing = Boolean(user);
  $('#userFormFields').innerHTML = userFormFields().map((field) => {
    const input = `
      <label>
        ${escapeHtml(field.label)}
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
      <td><button type="button" class="link-button" data-edit-field="${escapeHtml(field.fieldKey)}">Edit</button></td>
    </tr>
  `).join('') || `<tr><td colspan="7">No fields found for ${escapeHtml(module?.name || 'this form')}.</td></tr>`;
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
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

function setModuleConfig(moduleKey, fields) {
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
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

function clearUserForm() {
  const form = $('#userForm');
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
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

function editCustomer(id) {
  const customer = state.customers.find((item) => item.id === id);
  if (!customer) return;

  const form = $('#customerForm');
  form.elements.id.value = customer.id;
  renderCustomerFormFields(customer);
  $('#customerFormTitle').textContent = 'Edit Customer';
  openCustomerModal();
}

function editUser(id) {
  const user = state.users.find((item) => item.id === id);
  if (!user) return;

  const form = $('#userForm');
  form.elements.id.value = user.id;
  renderUserFormFields(user);
  $('#userFormTitle').textContent = 'Edit User';
  $('#saveUserButton').textContent = 'Save User';
  openUserModal();
}

async function refreshCustomerConfig() {
  const config = await api('/api/customers/config');
  setModuleConfig('customers', config.fields);
}

async function refreshModuleConfig(moduleKey) {
  const config = await api(`/api/${moduleKey}/config`);
  setModuleConfig(moduleKey, config.fields);
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
  $('#batchAddFieldsButton').addEventListener('click', openBatchFieldModal);
  $('#fieldPropertiesButton').addEventListener('click', openFieldPropertiesModal);
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
      setModuleConfig(moduleKey, config.fields);
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
  $('#batchFieldRows').addEventListener('input', (event) => {
    const rowElement = event.target.closest('[data-batch-row]');
    if (!rowElement) return;
    const row = state.batchDraftRows.find((item) => item.id === rowElement.dataset.batchRow);
    if (!row) return;
    if (event.target.name === 'label') {
      row.label = event.target.value;
      row.fieldKey = slugFieldKeyPreview(row.label);
      rowElement.querySelector('[name="fieldKey"]').value = row.fieldKey;
      rowElement.querySelector('[name="databaseFieldName"]').value = row.fieldKey;
    } else if (event.target.name === 'options') {
      row.options = event.target.value;
    }
  });
  $('#batchFieldRows').addEventListener('change', (event) => {
    const rowElement = event.target.closest('[data-batch-row]');
    if (!rowElement) return;
    const row = state.batchDraftRows.find((item) => item.id === rowElement.dataset.batchRow);
    if (!row) return;
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

  $('#fieldConfigForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = serializeForm(form);
    const moduleKey = state.activeConfigModule;
    const fieldKey = data.fieldKey;
    delete data.fieldKey;
    delete data.dataKeyPreview;
    delete data.databaseFieldName;
    delete data.browserModulePreview;
    data.required = form.elements.required.checked;
    data.showInTable = form.elements.showInTable.checked;
    data.showInForm = form.elements.showInForm.checked;
    data.showInImport = form.elements.showInImport.checked;
    if (data.type !== 'dropdownbox') {
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
      setModuleConfig(moduleKey, config.fields);
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
    const preview = slugFieldKeyPreview(event.currentTarget.value);
    form.elements.dataKeyPreview.value = preview;
    form.elements.databaseFieldName.value = preview;
  });
  $('#fieldConfigForm [name="type"]').addEventListener('change', syncFieldConfigTypeRows);
  $('#fieldConfigForm [name="tableType"]').addEventListener('change', syncFieldConfigTypeRows);

  $('#batchFieldForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const rows = state.batchDraftRows.filter((row) => row.label.trim());
    if (!rows.length) {
      toast('Add at least one field.', 'error');
      return;
    }

    const submitButton = $('#saveBatchFieldsButton');
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';
    try {
      let latestConfig = null;
      for (const row of rows) {
        latestConfig = await api(`/api/sysadmin/modules/${state.activeConfigModule}/fields`, {
          method: 'POST',
          body: JSON.stringify({
            label: row.label,
            fieldKey: row.fieldKey || slugFieldKeyPreview(row.label),
            type: row.type,
            tableType: row.tableKey === 'main' ? 'main' : 'detail',
            detailTableName: row.tableKey === 'main' ? '' : row.tableKey,
            options: row.type === 'dropdownbox' ? row.options : [],
            showInTable: row.showInTable,
            showInForm: row.showInForm,
            showInImport: row.showInImport,
            required: row.required
          })
        });
      }
      if (latestConfig) {
        setModuleConfig(state.activeConfigModule, latestConfig.fields);
      }
      closeBatchFieldModal();
      toast(`Added ${rows.length} Field${rows.length === 1 ? '' : 's'}.`);
    } catch (error) {
      toast(titleCaseMessage(error.message), 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Confirm';
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
      for (const row of rows) {
        const field = findConfigField(row.dataset.propertiesField);
        if (!field) continue;
        const showInForm = row.querySelector('[name="showInForm"]').checked;
        const required = row.querySelector('[name="required"]').checked;
        latestConfig = await api(`/api/sysadmin/modules/${state.activeConfigModule}/fields/${field.fieldKey}`, {
          method: 'PATCH',
          body: JSON.stringify({
            showInForm,
            required
          })
        });
      }
      if (latestConfig) {
        setModuleConfig(state.activeConfigModule, latestConfig.fields);
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
