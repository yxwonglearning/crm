const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..', '..');
const routes = fs.readFileSync(path.join(root, 'src/modules/dashboard-workspace/dashboard-workspace.routes.js'), 'utf8');
const repository = fs.readFileSync(path.join(root, 'src/modules/dashboard-workspace/dashboard-workspace.repository.js'), 'utf8');
const dashboardService = fs.readFileSync(path.join(root, 'src/modules/dashboards/dashboards.service.js'), 'utf8');
const frontend = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');

assert.match(routes, /dashboardWorkspaceRoutes\.use\(requireAuth\)/, 'workspace widget APIs must require authentication');
assert.match(repository, /assignee_user_id = \?/, 'tasks must be scoped to the signed-in assignee');
assert.match(repository, /assignments\.approver_user_id = \?/, 'calendar approvals must be scoped to the signed-in approver');
assert.match(repository, /task_status = 'open'/, 'calendar reminders must only include pending tasks');
assert.match(dashboardService, /workspaceWidgetTypes/, 'workspace widgets must publish without SQL Dashboard Data');
['approval_inbox', 'todo_list', 'calendar', 'quick_actions', 'recent_records', 'notifications'].forEach((type) => {
  assert.ok(html.includes(`value="${type}"`), `${type} must be available in Dashboard Builder`);
  assert.ok(frontend.includes(`widget.type === '${type}'`), `${type} must have runtime behavior`);
});
assert.match(frontend, /data-dashboard-task-form/, 'to-do widget must support direct task creation');
assert.match(frontend, /dashboard-calendar-grid/, 'calendar widget must render a month grid');
assert.match(frontend, /dashboard-calendar-tooltip/, 'calendar dates must offer hover and keyboard previews');
assert.match(frontend, /dashboard-calendar-popover/, 'calendar dates must open a detailed pop-out');
assert.match(frontend, /renderPublishedDashboardCanvas/, 'workspace widgets must render on published dashboards');

console.log('Dashboard workspace widgets smoke test passed.');
