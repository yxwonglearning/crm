const express = require('express');
const { asyncHandler } = require('../../shared/errors');
const { requireAuth } = require('../auth/auth.middleware');
const service = require('./browser-buttons.service');

const browserButtonRoutes = express.Router();

browserButtonRoutes.use(requireAuth);

browserButtonRoutes.get('/', asyncHandler(async (_req, res) => {
  res.json({ browserButtons: await service.listBrowserButtons() });
}));

browserButtonRoutes.get('/:browserKey/search', asyncHandler(async (req, res) => {
  res.json(await service.searchBrowserButton(req.params.browserKey, req.query.q || ''));
}));

browserButtonRoutes.post('/field-linkage/resolve', asyncHandler(async (req, res) => {
  res.json(await service.resolveFieldLinkage(req.body || {}));
}));

module.exports = { browserButtonRoutes };
