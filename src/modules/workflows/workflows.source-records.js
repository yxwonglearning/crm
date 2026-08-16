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

module.exports = { customerRecord, getRecord, userRecord };
