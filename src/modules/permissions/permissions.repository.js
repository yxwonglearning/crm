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

module.exports = {
  listFieldPermissions,
  permissionCount,
  replaceFieldPermissions,
  listModulePermissions,
  replaceModulePermissions
};
