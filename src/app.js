const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { errorHandler, notFoundHandler } = require('./shared/errors');
const { authRoutes } = require('./modules/auth/auth.routes');
const { userRoutes } = require('./modules/users/users.routes');
const { countryRoutes } = require('./modules/countries/countries.routes');
const { customerRoutes } = require('./modules/customers/customers.routes');
const { importRoutes } = require('./modules/imports/imports.routes');
const { sysadminRoutes } = require('./modules/sysadmin/module-config.routes');
const { browserButtonRoutes } = require('./modules/browser-buttons/browser-buttons.routes');
const { moduleRecordRoutes } = require('./modules/module-records/module-records.routes');
const { actionFlowRoutes } = require('./modules/action-flows/action-flows.routes');

function createApp() {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: false
  }));
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'crm-api' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/countries', countryRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/imports', importRoutes);
  app.use('/api/browser-buttons', browserButtonRoutes);
  app.use('/api/modules', moduleRecordRoutes);
  app.use('/api/action-flows', actionFlowRoutes);
  app.use('/api/sysadmin', sysadminRoutes);
  app.use('/api', notFoundHandler);

  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
