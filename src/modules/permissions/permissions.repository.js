const { pool } = require('../../database/pool');

async function listFieldPermissions(moduleKey) {
  const [rows] = await pool.execute(
    `SELECT p.*
     FROM crm_field_permissions p
     INNER JOIN crm_modules m ON m.id = p.module_id
     WHERE m.module_key = ?
     ORDER BY p.field_key ASC, p.subject_type ASC, p.subject_key ASC`,
    [moduleKey]
  );
  return rows;
}

async function permissionCount(moduleKey) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM crm_field_permissions p
     INNER JOIN crm_modules m ON m.id = p.module_id
     WHERE m.module_key = ?`,
    [moduleKey]
  );
  return Number(rows[0]?.count || 0);
}

async function replaceFieldPermissions(moduleId, permissions) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('DELETE FROM crm_field_permissions WHERE module_id = ?', [moduleId]);

    const rowsToInsert = permissions.length ? permissions : [{
      fieldKey: '__permissions_configured__',
      subjectType: 'role',
      subjectKey: 'admin',
      canView: false,
      canCreate: false,
      canEdit: false,
      canImport: false,
      canExport: false
    }];

    for (const permission of rowsToInsert) {
      await connection.execute(
        `INSERT INTO crm_field_permissions (
          module_id,
          field_key,
          subject_type,
          subject_key,
          can_view,
          can_create,
          can_edit,
          can_import,
          can_export
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          moduleId,
          permission.fieldKey,
          permission.subjectType,
          permission.subjectKey,
          permission.canView ? 1 : 0,
          permission.canCreate ? 1 : 0,
          permission.canEdit ? 1 : 0,
          permission.canImport ? 1 : 0,
          permission.canExport ? 1 : 0
        ]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function listModulePermissions(moduleKey) {
  const [rows] = await pool.execute(
    `SELECT p.*
     FROM crm_module_permissions p
     INNER JOIN crm_modules m ON m.id = p.module_id
     WHERE m.module_key = ?
     ORDER BY p.subject_type ASC, p.subject_key ASC`,
    [moduleKey]
  );
  return rows;
}

async function replaceModulePermissions(moduleId, permissions) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('DELETE FROM crm_module_permissions WHERE module_id = ?', [moduleId]);

    const rowsToInsert = permissions.length ? permissions : [{
      subjectType: 'role',
      subjectKey: 'admin',
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canImport: false,
      canExport: false,
      canConfigure: false
    }];

    for (const permission of rowsToInsert) {
      await connection.execute(
        `INSERT INTO crm_module_permissions (
          module_id,
          subject_type,
          subject_key,
          can_view,
          can_create,
          can_edit,
          can_delete,
          can_import,
          can_export,
          can_configure
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          moduleId,
          permission.subjectType,
          permission.subjectKey,
          permission.canView ? 1 : 0,
          permission.canCreate ? 1 : 0,
          permission.canEdit ? 1 : 0,
          permission.canDelete ? 1 : 0,
          permission.canImport ? 1 : 0,
          permission.canExport ? 1 : 0,
          permission.canConfigure ? 1 : 0
        ]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function listModuleDepartmentPermissions(moduleKey) {
  const [rows] = await pool.execute(
    `SELECT p.department_node_id
     FROM crm_module_department_permissions p
     INNER JOIN crm_modules m ON m.id = p.module_id
     WHERE m.module_key = ? AND p.can_view = 1
     ORDER BY p.department_node_id ASC`,
    [moduleKey]
  );
  return rows.map((row) => Number(row.department_node_id));
}

async function replaceModuleDepartmentPermissions(moduleId, departmentIds = []) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('DELETE FROM crm_module_department_permissions WHERE module_id = ?', [moduleId]);
    for (const departmentId of departmentIds) {
      await connection.execute(
        'INSERT INTO crm_module_department_permissions (module_id, department_node_id, can_view) VALUES (?, ?, 1)',
        [moduleId, departmentId]
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function createPermissionAuditLog({ userId, moduleKey, recordId, action, allowed, decisionReason }) {
  const [result] = await pool.execute(
    `INSERT INTO crm_permission_audit_logs (
      user_id, module_key, record_id, action, allowed, decision_reason
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId || null, moduleKey, recordId || null, action, allowed ? 1 : 0, decisionReason]
  );
  return result.insertId;
}

async function listPermissionAuditLogs({ moduleKey = '', action = '', allowed, limit = 100 } = {}) {
  const where = [];
  const values = [];
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
  if (moduleKey) {
    where.push('logs.module_key = ?');
    values.push(moduleKey);
  }
  if (action) {
    where.push('logs.action = ?');
    values.push(action);
  }
  if (allowed !== undefined) {
    where.push('logs.allowed = ?');
    values.push(allowed ? 1 : 0);
  }
  const [rows] = await pool.execute(
    `SELECT logs.id, logs.user_id, users.staff_id, users.name AS user_name,
            logs.module_key, logs.record_id, logs.action, logs.allowed,
            logs.decision_reason, logs.created_at
     FROM crm_permission_audit_logs logs
     LEFT JOIN users ON users.id = logs.user_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY logs.created_at DESC, logs.id DESC
     LIMIT ${safeLimit}`,
    values
  );
  return rows.map((row) => ({
    id: Number(row.id),
    userId: row.user_id ? Number(row.user_id) : null,
    staffId: row.staff_id || null,
    userName: row.user_name || null,
    moduleKey: row.module_key,
    recordId: row.record_id ? Number(row.record_id) : null,
    action: row.action,
    allowed: Boolean(row.allowed),
    decisionReason: row.decision_reason,
    createdAt: row.created_at
  }));
}

module.exports = {
  listFieldPermissions,
  permissionCount,
  replaceFieldPermissions,
  listModulePermissions,
  replaceModulePermissions,
  listModuleDepartmentPermissions,
  replaceModuleDepartmentPermissions,
  createPermissionAuditLog,
  listPermissionAuditLogs
};
