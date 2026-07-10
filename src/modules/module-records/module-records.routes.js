const express = require('express');
const { z } = require('zod');
const { asyncHandler } = require('../../shared/errors');
const { validate } = require('../../shared/validation');
const { requireAuth } = require('../auth/auth.middleware');
const service = require('./module-records.service');

const moduleRecordRoutes = express.Router();

const recordSchema = z.object({
  __detailTables: z.record(z.string(), z.array(z.record(z.string(), z.any()))).optional()
}).passthrough();

const deleteRecordsSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1).max(200)
});

moduleRecordRoutes.use(requireAuth);

moduleRecordRoutes.get('/', asyncHandler(async (req, res) => {
  res.json(await service.listMenuModules(req.user));
}));

moduleRecordRoutes.get('/:moduleKey/config', asyncHandler(async (req, res) => {
  res.json(await service.moduleRecordConfig(req.params.moduleKey, req.user));
}));

moduleRecordRoutes.get('/:moduleKey/records', asyncHandler(async (req, res) => {
  res.json(await service.listRecords(req.params.moduleKey, {
    search: req.query.search || '',
    filterField: req.query.filterField || '',
    filterOperator: req.query.filterOperator || '',
    filterValue: req.query.filterValue || ''
  }, req.user));
}));

moduleRecordRoutes.get('/:moduleKey/records/:id', asyncHandler(async (req, res) => {
  res.json(await service.getRecord(req.params.moduleKey, Number(req.params.id), req.user));
}));

moduleRecordRoutes.post('/:moduleKey/records', asyncHandler(async (req, res) => {
  const input = validate(recordSchema, req.body);
  res.status(201).json(await service.createRecord(req.params.moduleKey, input, req.user));
}));

moduleRecordRoutes.put('/:moduleKey/records/:id', asyncHandler(async (req, res) => {
  const input = validate(recordSchema, req.body);
  res.json(await service.updateRecord(req.params.moduleKey, Number(req.params.id), input, req.user));
}));

moduleRecordRoutes.delete('/:moduleKey/records', asyncHandler(async (req, res) => {
  const input = validate(deleteRecordsSchema, req.body);
  res.json(await service.deleteRecords(req.params.moduleKey, input.ids, req.user));
}));

module.exports = { moduleRecordRoutes };
