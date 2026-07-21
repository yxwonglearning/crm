const express = require('express');
const { z } = require('zod');
const { asyncHandler } = require('../../shared/errors');
const { validate } = require('../../shared/validation');
const { requireAuth, requireRole } = require('../auth/auth.middleware');
const service = require('./module-config.service');
const { listModuleTemplates } = require('./module-templates');
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
    browserButtonKey: z.string().trim().max(80).optional(),
    triggerField: z.string().trim().max(80).optional(),
    triggerCondition: z.enum(['on_change', 'on_select']).optional(),
    sourceModule: z.string().trim().max(80).optional(),
    sourceTable: z.string().trim().max(80).optional(),
    sourceTables: z.array(z.object({
      moduleKey: z.string().trim().max(80).optional(),
      tableName: z.string().trim().max(80),
      alias: z.string().trim().max(30)
    })).optional(),
    sourceJoins: z.array(z.object({
      leftField: z.string().trim().max(120),
      operator: z.enum(['=', '<>', '>', '>=', '<', '<=']).optional(),
      rightField: z.string().trim().max(120)
    })).optional(),
    primaryKeyField: z.string().trim().max(120).optional(),
    sourceWhere: z.string().trim().max(1000).optional(),
    clearOnEmpty: z.boolean().optional(),
    fieldMappings: z.array(z.object({
      sourceField: z.string().trim().max(120),
      targetField: z.string().trim().max(80),
      coerceType: z.enum(['auto', 'text', 'number', 'integer', 'boolean', 'date']).optional()
    })).optional()
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
  hidden: z.array(z.string().trim().min(1).max(80)).optional(),
  fieldSpans: z.record(z.string().trim().min(1).max(80), z.coerce.number().int().min(1).max(3)).optional(),
  sections: z.array(z.object({
    id: z.string().trim().min(1).max(80).optional(),
    title: z.string().trim().min(1).max(120).optional(),
    columns: z.coerce.number().int().min(1).max(3).optional(),
    fieldKeys: z.array(z.string().trim().min(1).max(80)).optional()
  })).optional()
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
  users: z.array(z.coerce.number().int().positive()).optional(),
  departments: z.array(z.coerce.number().int().positive()).optional()
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
const createConfigVersionSchema = z.object({
  remark: z.string().trim().max(255).optional()
});
const restoreConfigVersionSchema = z.object({
  remark: z.string().trim().max(255).optional()
});
const standaloneFormFieldSchema = z.object({
  label: z.string().trim().min(1).max(120),
  fieldKey: z.string().trim().min(1).max(80),
  databaseFieldName: z.string().trim().min(1).max(80),
  type: fieldTypeSchema,
  tableType: z.enum(['main', 'detail']).optional(),
  options: z.union([z.array(z.string()), z.string()]).optional(),
  showInTable: z.boolean().optional(),
  showInForm: z.boolean().optional(),
  showInImport: z.boolean().optional(),
  required: z.boolean().optional()
});
const standaloneFormSchema = z.object({
  name: z.string().trim().min(1).max(120),
  formKey: z.string().trim().min(1).max(80),
  description: z.string().trim().max(255).optional(),
  fields: z.array(standaloneFormFieldSchema).min(1)
});
const moduleSchema = z.object({
  name: z.string().trim().min(1).max(120),
  moduleKey: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(255).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  showInMenu: z.boolean().optional(),
  creationMode: z.enum(['scratch', 'existing_form', 'template']).optional(),
  sourceFormKey: z.string().trim().max(80).optional(),
  templateKey: z.string().trim().max(80).optional()
});
const updateModuleSchema = moduleSchema.omit({ moduleKey: true, creationMode: true, sourceFormKey: true, templateKey: true }).partial().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one module setting is required'
});

sysadminRoutes.use(requireAuth, requireRole('admin'));

sysadminRoutes.get('/modules', asyncHandler(async (_req, res) => {
  res.json({ modules: await service.listModules() });
}));

sysadminRoutes.post('/modules', asyncHandler(async (req, res) => {
  const input = validate(moduleSchema, req.body);
  res.status(201).json(await service.createModule(input, req.user));
}));

sysadminRoutes.patch('/modules/:moduleKey', asyncHandler(async (req, res) => {
  const input = validate(updateModuleSchema, req.body);
  res.json(await service.updateModule(req.params.moduleKey, input, req.user));
}));

sysadminRoutes.delete('/modules/:moduleKey', asyncHandler(async (req, res) => {
  res.json(await service.deleteModule(req.params.moduleKey, req.user));
}));

sysadminRoutes.get('/forms', asyncHandler(async (_req, res) => {
  res.json({ forms: await service.listStandaloneForms() });
}));

sysadminRoutes.post('/forms', asyncHandler(async (req, res) => {
  const input = validate(standaloneFormSchema, req.body);
  res.status(201).json(await service.createStandaloneForm(input, req.user));
}));

sysadminRoutes.delete('/forms/:formKey', asyncHandler(async (req, res) => {
  res.json(await service.deleteStandaloneForm(req.params.formKey));
}));

sysadminRoutes.patch('/forms/:formKey/fields/:fieldKey', asyncHandler(async (req, res) => {
  const input = validate(updateFieldSchema.pick({
    formulaExpression: true,
    formulaEnabled: true,
    formulaJs: true,
    formulaFunctionName: true,
    formulaFunctionBody: true,
    formulaSql: true
  }), req.body);
  res.json(await service.updateStandaloneFormField(req.params.formKey, req.params.fieldKey, input, req.user));
}));

sysadminRoutes.get('/modules/:moduleKey', asyncHandler(async (req, res) => {
  res.json(await service.getModuleConfig(req.params.moduleKey));
}));

sysadminRoutes.get('/modules/:moduleKey/config-history', asyncHandler(async (req, res) => {
  res.json(await service.listConfigHistory(req.params.moduleKey));
}));

sysadminRoutes.post('/modules/:moduleKey/config-history/versions', asyncHandler(async (req, res) => {
  const input = validate(createConfigVersionSchema, req.body);
  res.status(201).json(await service.createConfigVersion(req.params.moduleKey, req.user, input));
}));

sysadminRoutes.post('/modules/:moduleKey/config-history/:versionId/rollback', asyncHandler(async (req, res) => {
  const input = validate(restoreConfigVersionSchema, req.body);
  res.json(await service.rollbackConfigVersion(req.params.moduleKey, req.params.versionId, req.user, input));
}));

sysadminRoutes.get('/module-templates', asyncHandler(async (_req, res) => {
  res.json({ templates: listModuleTemplates() });
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
  res.status(201).json(await service.createField(req.params.moduleKey, input, req.user));
}));

sysadminRoutes.get('/modules/:moduleKey/fields/archived', asyncHandler(async (req, res) => {
  res.json({ fields: await service.listArchivedFields(req.params.moduleKey) });
}));

sysadminRoutes.patch('/modules/:moduleKey/fields/:fieldKey', asyncHandler(async (req, res) => {
  const input = validate(updateFieldSchema, req.body);
  res.json(await service.updateField(req.params.moduleKey, req.params.fieldKey, input, req.user));
}));

sysadminRoutes.patch('/modules/:moduleKey/detail-tables/:tableName', asyncHandler(async (req, res) => {
  const input = validate(detailTableSchema, req.body);
  res.json(await service.renameDetailTable(req.params.moduleKey, req.params.tableName, input, req.user));
}));

sysadminRoutes.put('/modules/:moduleKey/form-layouts/draft/:formType', asyncHandler(async (req, res) => {
  const formType = validate(formTypeSchema, req.params.formType);
  const input = validate(formLayoutSchema, req.body);
  res.json(await service.saveFormLayout(req.params.moduleKey, 'draft', formType, input, req.user));
}));

sysadminRoutes.post('/modules/:moduleKey/form-layouts/publish/:formType', asyncHandler(async (req, res) => {
  const formType = validate(formTypeSchema, req.params.formType);
  const input = validate(formLayoutSchema, req.body);
  res.json(await service.publishFormLayout(req.params.moduleKey, formType, input, req.user));
}));

sysadminRoutes.delete('/modules/:moduleKey/fields/:fieldKey', asyncHandler(async (req, res) => {
  res.json(await service.deleteField(req.params.moduleKey, req.params.fieldKey, req.user));
}));

sysadminRoutes.post('/modules/:moduleKey/fields/:fieldKey/archive', asyncHandler(async (req, res) => {
  res.json(await service.archiveField(req.params.moduleKey, req.params.fieldKey, req.user));
}));

sysadminRoutes.post('/modules/:moduleKey/fields/:fieldKey/unarchive', asyncHandler(async (req, res) => {
  res.json(await service.unarchiveField(req.params.moduleKey, req.params.fieldKey, req.user));
}));

module.exports = { sysadminRoutes };
