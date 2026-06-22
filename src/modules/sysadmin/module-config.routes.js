const express = require('express');
const { z } = require('zod');
const { asyncHandler } = require('../../shared/errors');
const { validate } = require('../../shared/validation');
const { requireAuth, requireRole } = require('../auth/auth.middleware');
const service = require('./module-config.service');
const permissions = require('../permissions/permissions.service');

const sysadminRoutes = express.Router();

const fieldTypeSchema = z.enum([
  'textbox',
  'textarea',
  'checkbox',
  'dropdownbox',
  'int',
  'decimals',
  'browser_button',
  'date',
  'attach_document',
  'image',
  'text',
  'email',
  'phone',
  'password',
  'number',
  'select',
  'country',
  'owner'
]);
const fieldSchema = z.object({
  fieldKey: z.string().trim().max(80).optional(),
  label: z.string().trim().min(1).max(120),
  type: fieldTypeSchema,
  options: z.union([z.array(z.string()), z.string()]).optional(),
  formulaExpression: z.string().max(5000).optional(),
  formulaEnabled: z.boolean().optional(),
  formulaJs: z.string().max(10000).optional(),
  formulaFunctionName: z.string().trim().max(80).optional(),
  formulaFunctionBody: z.string().max(10000).optional(),
  formulaSql: z.string().max(10000).optional(),
  lookupConfig: z.object({
    browserButtonKey: z.string().trim().max(80).optional()
  }).optional(),
  validationRules: z.object({
    minLength: z.union([z.literal(''), z.coerce.number().int().min(0).max(10000)]).optional(),
    maxLength: z.union([z.literal(''), z.coerce.number().int().min(0).max(10000)]).optional(),
    minValue: z.union([z.literal(''), z.coerce.number()]).optional(),
    maxValue: z.union([z.literal(''), z.coerce.number()]).optional(),
    regex: z.string().max(1000).optional(),
    conditionalRequiredField: z.string().trim().max(80).optional(),
    conditionalRequiredValue: z.string().trim().max(255).optional(),
    unique: z.boolean().optional()
  }).optional(),
  tableType: z.enum(['main', 'detail']).optional(),
  detailTableName: z.string().trim().max(80).optional().or(z.literal('')),
  required: z.boolean().optional(),
  showInTable: z.boolean().optional(),
  showInForm: z.boolean().optional(),
  showInImport: z.boolean().optional(),
  showInExport: z.boolean().optional(),
  importHeader: z.string().trim().max(160).optional(),
  exportHeader: z.string().trim().max(160).optional(),
  editable: z.boolean().optional(),
  disableManualInput: z.boolean().optional(),
  searchable: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(1).max(10000).optional()
});

const updateFieldSchema = fieldSchema.partial();
const detailTableSchema = z.object({
  detailTableName: z.string().trim().min(1).max(80)
});
const formLayoutSchema = z.object({
  order: z.array(z.string().trim().min(1).max(80)).optional(),
  hidden: z.array(z.string().trim().min(1).max(80)).optional()
});
const formTypeSchema = z.enum(['add', 'edit', 'detail']);
const browserFilterSchema = z.object({
  where: z.string().trim().max(2000).optional()
}).optional();
const browserButtonSchema = z.object({
  browserKey: z.string().trim().max(80).optional(),
  name: z.string().trim().min(1).max(120),
  sourceModule: z.string().trim().min(1).max(80),
  sourceTable: z.string().trim().min(1).max(80),
  valueField: z.string().trim().min(1).max(80),
  displayField: z.string().trim().min(1).max(80),
  searchFields: z.union([z.array(z.string()), z.string()]).optional(),
  returnFields: z.union([z.array(z.string()), z.string()]).optional(),
  filter: browserFilterSchema,
  enabled: z.boolean().optional()
});
const updateBrowserButtonSchema = browserButtonSchema.partial();
const permissionSubjectSchema = z.object({
  roles: z.array(z.enum(['admin', 'manager', 'user'])).optional(),
  users: z.array(z.coerce.number().int().positive()).optional()
});
const fieldPermissionSchema = z.object({
  fieldKey: z.string().trim().min(1).max(80),
  permissions: z.object({
    view: permissionSubjectSchema.optional(),
    create: permissionSubjectSchema.optional(),
    edit: permissionSubjectSchema.optional(),
    import: permissionSubjectSchema.optional(),
    export: permissionSubjectSchema.optional()
  }).optional()
});
const fieldPermissionMatrixSchema = z.object({
  fields: z.array(fieldPermissionSchema)
});
const modulePermissionMatrixSchema = z.object({
  permissions: z.object({
    view: permissionSubjectSchema.optional(),
    create: permissionSubjectSchema.optional(),
    edit: permissionSubjectSchema.optional(),
    delete: permissionSubjectSchema.optional(),
    import: permissionSubjectSchema.optional(),
    export: permissionSubjectSchema.optional(),
    configure: permissionSubjectSchema.optional()
  })
});

sysadminRoutes.use(requireAuth, requireRole('admin'));

sysadminRoutes.get('/modules', asyncHandler(async (_req, res) => {
  res.json({ modules: await service.listModules() });
}));

sysadminRoutes.get('/modules/:moduleKey', asyncHandler(async (req, res) => {
  res.json(await service.getModuleConfig(req.params.moduleKey));
}));

sysadminRoutes.get('/modules/:moduleKey/field-permissions', asyncHandler(async (req, res) => {
  res.json(await permissions.listFieldPermissionMatrix(req.params.moduleKey));
}));

sysadminRoutes.get('/modules/:moduleKey/permissions', asyncHandler(async (req, res) => {
  res.json(await permissions.listModulePermissionMatrix(req.params.moduleKey));
}));

sysadminRoutes.put('/modules/:moduleKey/permissions', asyncHandler(async (req, res) => {
  const input = validate(modulePermissionMatrixSchema, req.body);
  res.json(await permissions.saveModulePermissionMatrix(req.params.moduleKey, input.permissions));
}));

sysadminRoutes.put('/modules/:moduleKey/field-permissions', asyncHandler(async (req, res) => {
  const input = validate(fieldPermissionMatrixSchema, req.body);
  res.json(await permissions.saveFieldPermissionMatrix(req.params.moduleKey, input.fields));
}));

sysadminRoutes.get('/browser-buttons', asyncHandler(async (_req, res) => {
  res.json({ browserButtons: await service.listBrowserButtons() });
}));

sysadminRoutes.post('/browser-buttons', asyncHandler(async (req, res) => {
  const input = validate(browserButtonSchema, req.body);
  res.status(201).json({ browserButtons: await service.saveBrowserButton(input) });
}));

sysadminRoutes.patch('/browser-buttons/:browserKey', asyncHandler(async (req, res) => {
  const input = validate(updateBrowserButtonSchema, req.body);
  res.json({ browserButtons: await service.updateBrowserButton(req.params.browserKey, input) });
}));

sysadminRoutes.delete('/browser-buttons/:browserKey', asyncHandler(async (req, res) => {
  res.json({ browserButtons: await service.deleteBrowserButton(req.params.browserKey) });
}));

sysadminRoutes.post('/modules/:moduleKey/fields', asyncHandler(async (req, res) => {
  const input = validate(fieldSchema, req.body);
  res.status(201).json(await service.createField(req.params.moduleKey, input));
}));

sysadminRoutes.get('/modules/:moduleKey/fields/archived', asyncHandler(async (req, res) => {
  res.json({ fields: await service.listArchivedFields(req.params.moduleKey) });
}));

sysadminRoutes.patch('/modules/:moduleKey/fields/:fieldKey', asyncHandler(async (req, res) => {
  const input = validate(updateFieldSchema, req.body);
  res.json(await service.updateField(req.params.moduleKey, req.params.fieldKey, input));
}));

sysadminRoutes.patch('/modules/:moduleKey/detail-tables/:tableName', asyncHandler(async (req, res) => {
  const input = validate(detailTableSchema, req.body);
  res.json(await service.renameDetailTable(req.params.moduleKey, req.params.tableName, input));
}));

sysadminRoutes.put('/modules/:moduleKey/form-layouts/draft/:formType', asyncHandler(async (req, res) => {
  const formType = validate(formTypeSchema, req.params.formType);
  const input = validate(formLayoutSchema, req.body);
  res.json(await service.saveFormLayout(req.params.moduleKey, 'draft', formType, input));
}));

sysadminRoutes.post('/modules/:moduleKey/form-layouts/publish/:formType', asyncHandler(async (req, res) => {
  const formType = validate(formTypeSchema, req.params.formType);
  const input = validate(formLayoutSchema, req.body);
  res.json(await service.publishFormLayout(req.params.moduleKey, formType, input));
}));

sysadminRoutes.delete('/modules/:moduleKey/fields/:fieldKey', asyncHandler(async (req, res) => {
  res.json(await service.deleteField(req.params.moduleKey, req.params.fieldKey));
}));

sysadminRoutes.post('/modules/:moduleKey/fields/:fieldKey/archive', asyncHandler(async (req, res) => {
  res.json(await service.archiveField(req.params.moduleKey, req.params.fieldKey));
}));

sysadminRoutes.post('/modules/:moduleKey/fields/:fieldKey/unarchive', asyncHandler(async (req, res) => {
  res.json(await service.unarchiveField(req.params.moduleKey, req.params.fieldKey));
}));

module.exports = { sysadminRoutes };
