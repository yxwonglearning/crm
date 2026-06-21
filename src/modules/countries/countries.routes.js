const express = require('express');
const { asyncHandler } = require('../../shared/errors');
const { requireAuth } = require('../auth/auth.middleware');
const repository = require('./countries.repository');

const countryRoutes = express.Router();

countryRoutes.use(requireAuth);

countryRoutes.get('/', asyncHandler(async (_req, res) => {
  res.json({ countries: await repository.listCountries() });
}));

module.exports = { countryRoutes };
