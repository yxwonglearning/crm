const { AppError } = require('../../shared/errors');
const moduleRecords = require('../module-records/module-records.service');
const customerRepository = require('../customers/customers.repository');
const userRepository = require('../users/users.repository');
const permissions = require('../permissions/permissions.service');

function parseJson(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch (_error) { return {}; }
}

async function requireView(moduleKey, user) {
  const access = await permissions.userModulePermissions(moduleKey, user);
  if (!access.view) throw new AppError('You do not have permission to view this record', 403);
}

function customerRecord(row) {
  return {
    id: row.id,
    customFields: {
      ...parseJson(row.custom_fields),
      companyName: row.company_name,
      contactPerson: row.contact_person,
      email: row.email,
      countryId: row.country_id,
      phoneNumber: row.international_phone,
      status: row.status,
      notes: row.notes,
      ownerUserId: row.owner_user_id
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function userRecord(row) {
  return {
    id: row.id,
    customFields: {
      ...parseJson(row.custom_fields),
      staffId: row.staff_id,
      name: row.name,
      email: row.email,
      role: row.role,
      status: row.status,
      organizationNodeId: row.organization_node_id
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function getRecord(moduleKey, id, user) {
  if (moduleKey === 'customers') {
    await requireView(moduleKey, user);
    const row = await customerRepository.findCustomerById(id);
    return { record: row ? customerRecord(row) : null };
  }
  if (moduleKey === 'users') {
    await requireView(moduleKey, user);
    const row = await userRepository.findUserById(id);
    return { record: row ? userRecord(row) : null };
  }
  return moduleRecords.getRecord(moduleKey, id, user);
}

function recordText(values = []) {
  return values.filter((value) => value !== undefined && value !== null && String(value).trim()).map(String);
}

async function listSelectableRecords(moduleKey, search, user) {
  if (moduleKey === 'customers') {
    await requireView(moduleKey, user);
    const rows = await customerRepository.listCustomers({ search: String(search || '').trim() });
    return rows.slice(0, 50).map((row) => ({ id: Number(row.id), label: row.company_name || `Customer ${row.id}`, secondary: recordText([row.contact_person, row.email]).join(' · ') }));
  }
  if (moduleKey === 'users') {
    await requireView(moduleKey, user);
    const rows = await userRepository.listUsers({ search: String(search || '').trim() });
    return rows.slice(0, 50).map((row) => ({ id: Number(row.id), label: row.name || row.staff_id || `User ${row.id}`, secondary: recordText([row.staff_id, row.email]).join(' · ') }));
  }
  const payload = await moduleRecords.listRecords(moduleKey, { search: String(search || '').trim() }, user);
  const displayFields = (payload.fields || []).filter((field) => field.tableType !== 'detail' && field.archived !== true)
    .sort((left, right) => Number(right.showInTable) - Number(left.showInTable)).slice(0, 3);
  return (payload.records || []).slice(0, 50).map((record) => {
    const values = recordText(displayFields.map((field) => record.customFields?.[field.fieldKey]));
    return { id: Number(record.id), label: values[0] || `${payload.module?.name || moduleKey} record`, secondary: values.slice(1).join(' · ') };
  });
}

module.exports = { customerRecord, getRecord, listSelectableRecords, userRecord };
