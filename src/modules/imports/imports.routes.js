const express = require('express');
const multer = require('multer');
const { asyncHandler } = require('../../shared/errors');
const { requireAuth } = require('../auth/auth.middleware');
const service = require('./imports.service');

const importRoutes = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

importRoutes.use(requireAuth);

importRoutes.get('/customers/template', asyncHandler(async (_req, res) => {
  const workbook = await service.createCustomerTemplate();
  const buffer = service.writeWorkbook(workbook);
  res.setHeader('Content-Disposition', 'attachment; filename="crm-customer-import-template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
}));

importRoutes.post('/customers', upload.single('file'), asyncHandler(async (req, res) => {
  const result = await service.importCustomers(req.file, req.user.id);
  res.status(201).json(result);
}));

module.exports = { importRoutes };
