const state = {
  token: localStorage.getItem('crm.token') || '',
  user: JSON.parse(localStorage.getItem('crm.user') || 'null'),
  countries: [],
  users: [],
  customers: [],
  customerFields: [],
  userFields: [],
  activeConfigModule: 'customers',
  editingFieldKey: '',
  selectedCustomerIds: new Set()
};

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

function renderCustomerFieldInput(field, value = '') {
  const required = field.required ? 'required' : '';
  const name = `name="${escapeHtml(field.fieldKey)}"`;

  if (field.type === 'textarea') {
    return `<textarea ${name} rows="4" ${required}>${escapeHtml(value)}</textarea>`;
  }

  if (field.type === 'select') {
    const options = (field.options || []).map((option) => (
      `<option value="${escapeHtml(option)}" ${String(value) === String(option) ? 'selected' : ''}>${escapeHtml(titleCaseMessage(option))}</option>`
    )).join('');
    return `<select ${name} ${required}>${options}</select>`;
  }

  if (field.type === 'country') {
    const options = state.countries.map((country) => (
      `<option value="${country.id}" ${Number(value) === Number(country.id) ? 'selected' : ''}>${escapeHtml(country.name)}</option>`
    )).join('');
    return `<select ${name} ${required}>${options}</select>`;
  }

  if (field.type === 'owner') {
    const options = '<option value="">Unassigned</option>' + state.users
      .filter((user) => user.status === 'active')
      .map((user) => `<option value="${user.id}" ${Number(value) === Number(user.id) ? 'selected' : ''}>${escapeHtml(user.name)}</option>`)
      .join('');
    return `<select ${name}>${options}</select>`;
  }

  if (field.type === 'checkbox') {
    return `<input ${name} type="checkbox" value="true" ${value ? 'checked' : ''}>`;
  }

  const inputType = field.type === 'phone' ? 'tel' : field.type;
  return `<input ${name} type="${escapeHtml(inputType)}" value="${escapeHtml(value)}" ${required}>`;
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

function renderCustomerFormFields(customer = null) {
  const fields = formFields();
  const malaysia = malaysiaCountry();
  $('#customerFormFields').innerHTML = fields.map((field) => {
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
  }).join('');
  updateDialCode();
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
    return `<td>${value ? 'Yes' : 'No'}</td>`;
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
    return `<td>${value ? 'Yes' : 'No'}</td>`;
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
  if (field.type === 'select') {
    const options = (field.options || []).map((option) => (
      `<option value="${escapeHtml(option)}" ${String(value) === String(option) ? 'selected' : ''}>${escapeHtml(titleCaseMessage(option))}</option>`
    )).join('');
    return `<select ${name} ${required}>${options}</select>`;
  }
  if (field.type === 'checkbox') {
    return `<input ${name} type="checkbox" value="true" ${value ? 'checked' : ''}>`;
  }

  const inputType = field.type === 'phone' ? 'tel' : field.type;
  const minlength = field.fieldKey === 'password' ? 'minlength="8"' : '';
  return `<input ${name} type="${escapeHtml(inputType)}" value="${escapeHtml(value)}" ${minlength} ${required} ${autocomplete}>`;
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

  body.innerHTML = fields.map((field) => `
    <tr data-field-key="${escapeHtml(field.fieldKey)}">
      <td>
        <strong>${escapeHtml(field.label)}</strong>
        <div class="muted">${escapeHtml(field.fieldKey)}${field.locked ? ' · system' : ''}</div>
      </td>
      <td>${escapeHtml(field.type)}</td>
      <td>${field.showInTable ? 'Yes' : 'No'}</td>
      <td>${field.showInForm ? 'Yes' : 'No'}</td>
      <td>${field.showInImport ? 'Yes' : 'No'}</td>
      <td>${field.required ? 'Yes' : 'No'}</td>
      <td>${field.sortOrder}</td>
      <td><button type="button" class="link-button" data-edit-field="${escapeHtml(field.fieldKey)}">Edit</button></td>
    </tr>
  `).join('');
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
  form.elements.type.disabled = false;
  form.elements.label.disabled = false;
  form.elements.showInTable.checked = true;
  form.elements.showInForm.checked = true;
  form.elements.showInImport.checked = false;
  form.elements.required.checked = false;
  form.elements.showInForm.disabled = false;
  form.elements.required.disabled = false;
  form.elements.sortOrder.value = 100;
  state.editingFieldKey = '';
  $('#fieldConfigFormTitle').textContent = 'Add Field';
  $('#saveFieldConfigButton').textContent = 'Add Field';
  $('#clearFieldConfigForm').hidden = false;
  $('#deleteFieldConfigButton').hidden = true;
}

function openFieldConfigModal(field = null) {
  clearFieldConfigForm();
  if (field) {
    const form = $('#fieldConfigForm');
    state.editingFieldKey = field.fieldKey;
    form.elements.fieldKey.value = field.fieldKey;
    form.elements.label.value = field.label;
    form.elements.type.value = field.type;
    form.elements.options.value = (field.options || []).join(', ');
    form.elements.sortOrder.value = field.sortOrder;
    form.elements.showInTable.checked = field.showInTable;
    form.elements.showInForm.checked = field.showInForm;
    form.elements.showInImport.checked = field.showInImport;
    form.elements.required.checked = field.required;
    form.elements.type.disabled = field.locked;
    form.elements.showInForm.disabled = field.locked && field.required;
    form.elements.required.disabled = field.locked && field.required;
    $('#fieldConfigFormTitle').textContent = 'Edit Field';
    $('#saveFieldConfigButton').textContent = 'Save Field';
    $('#clearFieldConfigForm').hidden = true;
    $('#deleteFieldConfigButton').hidden = field.locked;
  }
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
  formFields().forEach((field) => {
    if (field.type === 'checkbox') {
      data[field.fieldKey] = Boolean(form.elements[field.fieldKey]?.checked);
    }
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

  $('#customerFormFields').addEventListener('change', (event) => {
    if (event.target.name === 'countryId') {
      updateDialCode();
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

  $('#fieldConfigForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = serializeForm(form);
    const moduleKey = state.activeConfigModule;
    const fieldKey = data.fieldKey;
    delete data.fieldKey;
    data.required = form.elements.required.checked;
    data.showInTable = form.elements.showInTable.checked;
    data.showInForm = form.elements.showInForm.checked;
    data.showInImport = form.elements.showInImport.checked;
    data.sortOrder = Number(data.sortOrder || 100);
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

  $('#fieldConfigModule').addEventListener('change', (event) => {
    state.activeConfigModule = event.target.value;
    renderFieldConfig();
  });

  $('#fieldConfigRows').addEventListener('click', async (event) => {
    const button = event.target.closest('[data-edit-field]');
    if (!button) return;
    const field = findConfigField(button.dataset.editField);
    if (field) openFieldConfigModal(field);
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
