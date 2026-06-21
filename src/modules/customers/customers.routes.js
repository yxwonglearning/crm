const express = require('express');
const { z } = require('zod');
const { asyncHandler } = require('../../shared/errors');
const { validate } = require('../../shared/validation');
const { requireAuth } = require('../auth/auth.middleware');
const service = require('./customers.service');

const customerRoutes = express.Router();

const customerSchema = z.object({
  companyName: z.string().trim().min(1).max(190),
  contactPerson: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(190).optional().or(z.literal('')),
  countryId: z.coerce.number().int().positive(),
  phoneNumber: z.string().trim().min(1).max(60),
  status: z.enum(['lead', 'active', 'inactive']).default('lead'),
  notes: z.string().trim().max(5000).optional().or(z.literal('')),
  ownerUserId: z.coerce.number().int().positive().optional().or(z.literal(''))
}).passthrough();

const deleteCustomersSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1).max(200)
});

customerRoutes.use(requireAuth);

customerRoutes.get('/config', asyncHandler(async (_req, res) => {
  res.json(await service.customerFieldConfig());
}));

customerRoutes.get('/', asyncHandler(async (req, res) => {
  const filters = {
    search: req.query.search || '',
    status: req.query.status || ''
  };
  res.json({ customers: await service.listCustomers(filters) });
}));

customerRoutes.post('/', asyncHandler(async (req, res) => {
  const input = validate(customerSchema, req.body);
  const customer = await service.createCustomer(input, req.user.id);
  res.status(201).json({ customer });
}));

customerRoutes.put('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const input = validate(customerSchema, req.body);
  const customer = await service.updateCustomer(id, input, req.user.id);
  res.json({ customer });
}));

customerRoutes.delete('/', asyncHandler(async (req, res) => {
  const input = validate(deleteCustomersSchema, req.body);
  const deletedCount = await service.deleteCustomers(input.ids);
  res.json({ deletedCount });
}));

module.exports = { customerRoutes };
