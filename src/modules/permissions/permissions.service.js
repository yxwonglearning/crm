const { AppError } = require('../../shared/errors');
const moduleConfig = require('../sysadmin/module-config.service');
const moduleRepository = require('../sysadmin/module-config.repository');
const repository = require('./permissions.repository');
const departmentRepository = require('../departments/departments.repository');

const roles = ['admin', 'manager', 'user'];
const actions = ['view', 'create', 'edit', 'import', 'export'];
const moduleActions = ['view', 'create', 'edit', 'delete', 'import', 'export', 'configure'];
const actionColumns = {
  view: 'can_view',
  create: 'can_create',
  edit: 'can_edit',
  delete: 'can_delete',
  import: 'can_import',
  export: 'can_export',
  configure: 'can_configure'
};

function blankActionSubjects(actionList = actions) {
  return actionList.reduce((result, action) => ({
    ...result,
    [action]: { roles: [], users: [] }
  }), {});
}

function defaultSubjectsForModule() {
  return moduleActions.reduce((result, action) => ({
    ...result,
    [action]: { roles: [...roles], users: [] }
  }), {});
}

function defaultSubjectsForField(field) {
  const defaults = blankActionSubjects();
  defaults.view.roles = [...roles];
  if (field.showInForm) {
    defaults.create.roles = [...roles];
    defaults.edit.roles = [...roles];
  }
  if (field.showInImport) {
    defaults.import.roles = [...roles];
  }
  if (field.showInExport !== false) {
    defaults.export.roles = [...roles];
  }
  return defaults;
}

function rowAllows(row, action) {
  return Boolean(row[actionColumns[action]]);
}

function subjectsFromRows(actionList, rows, hasStoredRules, defaultSubjects = defaultSubjectsForModule()) {
  const subjects = hasStoredRules ? blankActionSubjects(actionList) : defaultSubjects;
  rows.forEach((row) => {
    actionList.forEach((action) => {
      if (!rowAllows(row, action)) return;
      const bucket = row.subject_type === 'user' ? 'users' : 'roles';
      subjects[action][bucket].push(String(row.subject_key));
    });
  });
  return subjects;
}

function matrixFromRows(fields, rows, hasStoredRules) {
  const byField = new Map(fields.map((field) => [
    field.fieldKey,
    {
      fieldKey: field.fieldKey,
      label: field.label,
      type: field.type,
      tableType: field.tableType,
      detailTableName: field.detailTableName,
      permissions: hasStoredRules ? blankActionSubjects() : defaultSubjectsForField(field)
    }
  ]));

  rows.forEach((row) => {
    const entry = byField.get(row.field_key);
    if (!entry) return;
    actions.forEach((action) => {
      if (!rowAllows(row, action)) return;
      const bucket = row.subject_type === 'user' ? 'users' : 'roles';
      entry.permissions[action][bucket].push(String(row.subject_key));
    });
  });

  return Array.from(byField.values());
}

function normalizeSelectedSubjects(value = {}) {
  const selectedRoles = Array.isArray(value.roles) ? value.roles : [];
  const selectedUsers = Array.isArray(value.users) ? value.users : [];
  return {
    roles: selectedRoles.filter((role) => roles.includes(role)),
    users: selectedUsers
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0)
      .map(String)
  };
}

function flattenActionSubjects(subjects = {}, actionList = moduleActions) {
  const grants = new Map();
  actionList.forEach((action) => {
    const selected = normalizeSelectedSubjects(subjects[action]);
    [
      ...selected.roles.map((subjectKey) => ({ subjectType: 'role', subjectKey })),
      ...selected.users.map((subjectKey) => ({ subjectType: 'user', subjectKey }))
    ].forEach((subject) => {
      const key = `${subject.subjectType}:${subject.subjectKey}`;
      if (!grants.has(key)) {
        grants.set(key, {
          subjectType: subject.subjectType,
          subjectKey: subject.subjectKey,
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canImport: false,
          canExport: false,
          canConfigure: false
        });
      }
      grants.get(key)[`can${action[0].toUpperCase()}${action.slice(1)}`] = true;
    });
  });
  return Array.from(grants.values());
}

function flattenMatrix(fields, matrix) {
  const knownFields = new Set(fields.map((field) => field.fieldKey));
  const grants = new Map();

  (matrix || []).forEach((entry) => {
    if (!knownFields.has(entry.fieldKey)) return;
    actions.forEach((action) => {
      const subjects = normalizeSelectedSubjects(entry.permissions?.[action]);
      [
        ...subjects.roles.map((subjectKey) => ({ subjectType: 'role', subjectKey })),
        ...subjects.users.map((subjectKey) => ({ subjectType: 'user', subjectKey }))
      ].forEach((subject) => {
        const key = `${entry.fieldKey}:${subject.subjectType}:${subject.subjectKey}`;
        if (!grants.has(key)) {
          grants.set(key, {
            fieldKey: entry.fieldKey,
            subjectType: subject.subjectType,
            subjectKey: subject.subjectKey,
            canView: false,
            canCreate: false,
            canEdit: false,
            canImport: false,
            canExport: false
          });
        }
        grants.get(key)[`can${action[0].toUpperCase()}${action.slice(1)}`] = true;
      });
    });
  });

  return Array.from(grants.values());
}

async function listFieldPermissionMatrix(moduleKey) {
  const config = await moduleConfig.getModuleConfig(moduleKey);
  const rows = await repository.listFieldPermissions(moduleKey);
  return {
    module: config.module,
    roles,
    actions,
    fields: matrixFromRows(config.fields, rows, rows.length > 0)
  };
}

async function saveFieldPermissionMatrix(moduleKey, matrix) {
  const module = await moduleRepository.findModuleByKey(moduleKey);
  if (!module) throw new AppError('Module not found', 404);
  const config = await moduleConfig.getModuleConfig(moduleKey);
  await repository.replaceFieldPermissions(module.id, flattenMatrix(config.fields, matrix));
  return listFieldPermissionMatrix(moduleKey);
}

async function listModulePermissionMatrix(moduleKey) {
  const config = await moduleConfig.getModuleConfig(moduleKey);
  const [rows, departmentIds] = await Promise.all([
    repository.listModulePermissions(moduleKey),
    repository.listModuleDepartmentPermissions(moduleKey)
  ]);
  const defaultSubjects = config.module?.system ? defaultSubjectsForModule() : blankActionSubjects(moduleActions);
  const permissions = subjectsFromRows(moduleActions, rows, rows.length > 0 || departmentIds.length > 0, defaultSubjects);
  permissions.view.departments = departmentIds.map(String);
  return {
    module: config.module,
    roles,
    actions: moduleActions,
    permissions
  };
}

async function saveModulePermissionMatrix(moduleKey, permissions) {
  const module = await moduleRepository.findModuleByKey(moduleKey);
  if (!module) throw new AppError('Module not found', 404);
  const departmentIds = [...new Set((permissions.view?.departments || []).map(Number).filter((id) => Number.isInteger(id) && id > 0))];
  for (const id of departmentIds) {
    if (!await departmentRepository.findById(id)) throw new AppError('Organization unit not found', 422);
  }
  await repository.replaceModulePermissions(module.id, flattenActionSubjects(permissions, moduleActions));
  await repository.replaceModuleDepartmentPermissions(module.id, departmentIds);
  return listModulePermissionMatrix(moduleKey);
}

async function departmentViewAllowed(moduleKey, user) {
  if (!user?.organization_node_id) return false;
  const [allowedIds, membershipIds] = await Promise.all([
    repository.listModuleDepartmentPermissions(moduleKey),
    departmentRepository.ancestorIds(Number(user.organization_node_id))
  ]);
  const allowed = new Set(allowedIds);
  return membershipIds.some((id) => allowed.has(id));
}

async function userModulePermissions(moduleKey, user) {
  if (!user) return {};
  const rows = await repository.listModulePermissions(moduleKey);
  if (user.role === 'admin' || rows.length === 0) {
    return moduleActions.reduce((result, action) => ({ ...result, [action]: true }), {});
  }

  const userId = String(user.id);
  const role = String(user.role);
  const matchingRows = rows.filter((row) => (
    (row.subject_type === 'role' && row.subject_key === role)
    || (row.subject_type === 'user' && row.subject_key === userId)
  ));

  const result = moduleActions.reduce((result, action) => ({
    ...result,
    [action]: matchingRows.some((row) => rowAllows(row, action))
  }), {});
  if (!result.view) result.view = await departmentViewAllowed(moduleKey, user);
  return result;
}

async function userModulePageAccessAllowed(moduleKey, user) {
  const pagePermissions = await userModulePagePermissions(moduleKey, user);
  return Boolean(pagePermissions.view);
}

async function userModulePagePermissions(moduleKey, user) {
  const empty = moduleActions.reduce((result, action) => ({ ...result, [action]: false }), {});
  if (!user) return empty;
  const rows = await repository.listModulePermissions(moduleKey);
  const hasDepartmentView = await departmentViewAllowed(moduleKey, user);
  if (!rows.length && !hasDepartmentView) return empty;

  const userId = String(user.id);
  const role = String(user.role);
  const matchingRows = rows.filter((row) => (
    (row.subject_type === 'role' && row.subject_key === role)
    || (row.subject_type === 'user' && row.subject_key === userId)
  ));

  return moduleActions.reduce((result, action) => ({
    ...result,
    [action]: action === 'view' ? hasDepartmentView || matchingRows.some((row) => rowAllows(row, action)) : matchingRows.some((row) => rowAllows(row, action))
  }), {});
}

async function assertModuleActionAllowed(moduleKey, user, action, context = {}) {
  const userPermissions = await userModulePermissions(moduleKey, user);
  const allowed = Boolean(userPermissions[action]);
  await repository.createPermissionAuditLog({
    userId: user?.id,
    moduleKey,
    recordId: context.recordId,
    action,
    allowed,
    decisionReason: allowed
      ? (user?.role === 'admin' ? 'admin_role' : 'module_permission_grant')
      : 'no_module_permission_grant'
  });
  if (!allowed) {
    throw new AppError(`You do not have ${action} permission for this module`, 403);
  }
}

async function assertModulePageActionAllowed(moduleKey, user, action, context = {}) {
  const userPermissions = await userModulePagePermissions(moduleKey, user);
  const allowed = Boolean(userPermissions.view && (action === 'view' || userPermissions[action]));
  await repository.createPermissionAuditLog({
    userId: user?.id,
    moduleKey,
    recordId: context.recordId,
    action,
    allowed,
    decisionReason: allowed
      ? (user?.role === 'admin' ? 'admin_role' : 'page_permission_grant')
      : 'no_page_permission_grant'
  });
  if (!allowed) {
    throw new AppError(`You do not have ${action} permission for this page`, 403);
  }
  return userPermissions;
}

async function listPermissionAuditLogs(filters = {}) {
  return repository.listPermissionAuditLogs(filters);
}

async function userFieldPermissions(moduleKey, user, fields) {
  if (!user) return new Map();
  const rows = await repository.listFieldPermissions(moduleKey);
  if (user.role === 'admin' || rows.length === 0) {
    return new Map(fields.map((field) => [
      field.fieldKey,
      { view: true, create: true, edit: true, import: true, export: true }
    ]));
  }

  const userId = String(user.id);
  const role = String(user.role);
  return new Map(fields.map((field) => {
    const matchingRows = rows.filter((row) => (
      row.field_key === field.fieldKey
      && (
        (row.subject_type === 'role' && row.subject_key === role)
        || (row.subject_type === 'user' && row.subject_key === userId)
      )
    ));
    return [
      field.fieldKey,
      actions.reduce((result, action) => ({
        ...result,
        [action]: matchingRows.some((row) => rowAllows(row, action))
      }), {})
    ];
  }));
}

async function decorateFieldsForUser(moduleKey, user, fields) {
  const permissions = await userFieldPermissions(moduleKey, user, fields);
  return fields.map((field) => ({
    ...field,
    permissions: permissions.get(field.fieldKey) || {}
  })).filter((field) => (
    field.permissions.view
    || field.permissions.create
    || field.permissions.edit
    || field.permissions.import
    || field.permissions.export
  ));
}

async function assertFieldActionAllowed(moduleKey, user, fields, fieldKey, action) {
  const permissions = await userFieldPermissions(moduleKey, user, fields);
  if (!permissions.get(fieldKey)?.[action]) {
    throw new AppError(`You do not have ${action} permission for this field`, 403);
  }
}

module.exports = {
  actions,
  moduleActions,
  roles,
  listModulePermissionMatrix,
  saveModulePermissionMatrix,
  userModulePermissions,
  userModulePageAccessAllowed,
  userModulePagePermissions,
  assertModuleActionAllowed,
  assertModulePageActionAllowed,
  listPermissionAuditLogs,
  listFieldPermissionMatrix,
  saveFieldPermissionMatrix,
  userFieldPermissions,
  decorateFieldsForUser,
  assertFieldActionAllowed
};
