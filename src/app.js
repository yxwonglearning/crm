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
const { departmentRoutes } = require('./modules/departments/departments.routes');
const { dashboardRoutes } = require('./modules/dashboards/dashboards.routes');
const { dashboardPageRoutes } = require('./modules/dashboards/dashboard-pages.routes');
const { workflowRoutes } = require('./modules/workflows/workflows.routes');
const { notificationRoutes } = require('./modules/notifications/notifications.routes');
const { menuRoutes } = require('./modules/menu/menu.routes');
const { accountRoutes } = require('./modules/account/account.routes');
const { dashboardWorkspaceRoutes } = require('./modules/dashboard-workspace/dashboard-workspace.routes');
const { documentTemplateRoutes } = require('./modules/document-templates/document-templates.routes');

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
  app.use('/api/departments', departmentRoutes);
  app.use('/api/dashboards', dashboardRoutes);
  app.use('/api/dashboard-pages', dashboardPageRoutes);
  app.use('/api/workflows', workflowRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/menu', menuRoutes);
  app.use('/api/account', accountRoutes);
  app.use('/api/dashboard-workspace', dashboardWorkspaceRoutes);
  app.use('/api/document-templates', documentTemplateRoutes);
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
