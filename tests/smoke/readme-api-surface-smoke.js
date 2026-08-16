const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..');
const readme = fs.readFileSync(path.join(projectRoot, 'README.md'), 'utf8');
const routeGroups = [
  ['src/modules/dashboards/dashboards.routes.js', 'dashboardRoutes', '/api/dashboards'],
  ['src/modules/dashboards/dashboard-pages.routes.js', 'dashboardPageRoutes', '/api/dashboard-pages'],
  ['src/modules/action-flows/action-flows.routes.js', 'actionFlowRoutes', '/api/action-flows'],
  ['src/modules/workflows/workflows.routes.js', 'workflowRoutes', '/api/workflows'],
  ['src/modules/notifications/notifications.routes.js', 'notificationRoutes', '/api/notifications'],
  ['src/modules/menu/menu.routes.js', 'menuRoutes', '/api/menu'],
  ['src/modules/account/account.routes.js', 'accountRoutes', '/api/account']
];

const missing = [];

for (const [relativeFile, routerName, basePath] of routeGroups) {
  const source = fs.readFileSync(path.join(projectRoot, relativeFile), 'utf8');
  const routePattern = new RegExp(`${routerName}\\.(get|post|put|patch|delete)\\(\\s*['\"\\\`]([^'\"\\\`]+)['\"\\\`]`, 'g');
  let match;

  while ((match = routePattern.exec(source)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2] === '/' ? '' : match[2];
    const documentedRoute = `\`${method} ${basePath}${routePath}\``;

    if (!readme.includes(documentedRoute)) {
      missing.push(`${relativeFile}: ${documentedRoute}`);
    }
  }
}

if (!readme.includes('API documentation contract:')) {
  missing.push('README.md: API documentation contract');
}

if (missing.length > 0) {
  console.error('README API surface is missing mounted routes or its maintenance contract:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('README API surface smoke test passed.');
