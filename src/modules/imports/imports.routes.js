const express = require('express');
const multer = require('multer');
const { asyncHandler } = require('../../shared/errors');
const { requireAuth } = require('../auth/auth.middleware');
const permissions = require('../permissions/permissions.service');
const service = require('./imports.service');

const importRoutes = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

importRoutes.use(requireAuth);

importRoutes.get('/customers/template', asyncHandler(async (req, res) => {
  await permissions.assertModuleActionAllowed('customers', req.user, 'import');
  const workbook = await service.createCustomerTemplate(req.user);
  const buffer = service.writeWorkbook(workbook);
  res.setHeader('Content-Disposition', 'attachment; filename="crm-customer-import-template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
}));

importRoutes.get('/customers/export', asyncHandler(async (req, res) => {
  await permissions.assertModuleActionAllowed('customers', req.user, 'export');
  const workbook = await service.createCustomerExport(req.user);
  const buffer = service.writeWorkbook(workbook);
  res.setHeader('Content-Disposition', 'attachment; filename="crm-customers-export.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
}));

importRoutes.post('/customers', upload.single('file'), asyncHandler(async (req, res) => {
  await permissions.assertModuleActionAllowed('customers', req.user, 'import');
  const result = await service.importCustomers(req.file, req.user);
  res.status(201).json(result);
}));

module.exports = { importRoutes };
