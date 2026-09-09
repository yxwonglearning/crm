const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'public/styles.css'), 'utf8');

for (const id of [
  'workflowRequestsView',
  'workflowRequestList',
  'workflowRequestDetail',
  'workflowMonitoringView',
  'workflowMonitoringSummary',
  'workflowMonitoringRows',
  'workflowMonitoringHistoryPanel',
  'workflowReportRows',
  'exportWorkflowHistory',
  'notificationHub',
  'notificationBell',
  'notificationDrawer',
  'adminEmailSettingsSection',
  'emailSettingsForm',
  'workflowDelegationView',
  'workflowDelegationList',
  'workflowDelegationModal',
  'workflowReassignModal',
  'workflowSubmitModal',
  'workflowSourceRecordSearch',
  'workflowSourceRecordOptions',
  'workflowDecisionModal',
  'workflowLifecycleModal',
  'adminWorkflowSection',
  'workflowDefinitionForm',
  'workflowStageEditor',
  'workflowCanvasViewport',
  'workflowCanvas',
  'workflowCanvasInspector',
  'openWorkflowRouteDesigner',
  'closeWorkflowRouteDesigner',
  'workflowInspectorToggle',
  'saveWorkflowRouteDesigner',
  'workflowRouteSaveNotice',
  'workflowLinkedAutomationFlows',
  'workflowCheckPanel'
]) {
  assert.match(html, new RegExp(`id="${id}"`), `Expected Workflow frontend element #${id}`);
}

for (const functionName of [
  'loadWorkflowDefinitions',
  'saveWorkflowDefinition',
  'workflowStableKeyFromName',
  'syncWorkflowStableKey',
  'publishWorkflowDefinition',
  'renderWorkflowLinkedAutomationFlows',
  'renderWorkflowCanvas',
  'fitWorkflowCanvas',
  'loadWorkflowRequests',
  'loadWorkflowMonitoring',
  'runWorkflowSlaCheck',
  'loadWorkflowDelegations',
  'reassignWorkflowAssignment',
  'openWorkflowRequest',
  'submitWorkflowRequest',
  'loadWorkflowSourceRecords',
  'decideWorkflowRequest',
  'runWorkflowLifecycle'
]) {
  assert.match(script, new RegExp(`function ${functionName}\\(`), `Expected Workflow UI function ${functionName}`);
}

for (const endpoint of [
  '/api/workflows/catalog',
  '/api/workflows/definitions',
  '/api/workflows/inbox',
  '/api/workflows/requests'
]) {
  assert.ok(script.includes(endpoint), `Expected frontend API integration for ${endpoint}`);
}

assert.ok(script.includes("'Idempotency-Key'"), 'Workflow runtime commands must send idempotency keys');
assert.ok(!html.includes('Source record ID'), 'workflow submission must not expose the internal source record ID');
assert.ok(script.includes('/api/workflows/source-records'), 'workflow submission must load readable source-record choices');
assert.ok(script.includes('data-workflow-decision'), 'Request detail must expose decision controls');
assert.ok(script.includes('data-workflow-lifecycle'), 'Request detail must expose lifecycle controls');
assert.ok(script.includes('data-monitoring-remind'), 'Monitoring must expose manual reminder controls');
assert.ok(script.includes('data-monitoring-reassign'), 'Monitoring must expose one-request reassignment');
assert.ok(script.includes('exportWorkflowReport'), 'Monitoring must expose the admin history CSV export');
assert.ok(script.includes('selectWorkflowMonitoringTab'), 'Monitoring must separate live operations from history reports');
assert.ok(script.includes('loadNotifications'), 'Signed-in users must receive built-in notification centre updates');
assert.ok(script.includes('loadEmailSettings'), 'Admins must be able to configure the central email provider');
assert.ok(script.includes('emailEnabled'), 'Approval nodes must expose optional email delivery');
assert.ok(script.includes('data-cancel-workflow-delegation'), 'Delegation schedules must support cancellation');
assert.ok(script.includes('workflow.reminder_due'), 'Automation Flow must expose SLA reminder events');
assert.ok(script.includes('workflow.escalated'), 'Automation Flow must expose SLA escalation events');
assert.ok(script.includes("['workflow_event', 'When an approval workflow event occurs']"), 'Automation Flow must expose Workflow events as a trigger');
assert.ok(script.includes('data-trigger-config-field="workflowEventType"'), 'Workflow event trigger must expose event filtering');
assert.ok(script.includes('builderGraph: workflowGraphForSave()'), 'Workflow save payload must persist the visual graph and captured node forms');
assert.ok(script.includes('data-workflow-node-id'), 'Workflow canvas must render selectable nodes');
assert.ok(script.includes('connectWorkflowNodes'), 'Workflow canvas must support configurable connections');
assert.ok(script.includes('renderWorkflowEdgeCondition'), 'Conditional connections must expose a structured rule builder');
assert.ok(script.includes('data-workflow-edge-condition-group'), 'Conditional connections must support all/any rule matching');
assert.ok(script.includes('data-workflow-edge-condition-field'), 'Conditional connections must persist field/operator/value rules');
assert.ok(script.includes('workflowBoundFormFields'), 'Workflow conditions must resolve fields from the selected request form');
assert.ok(script.includes('workflowBoundFormFieldOptions'), 'Workflow condition fields must render as selected-form options');
assert.ok(script.includes('renderWorkflowApproverPicker'), 'Approval nodes must expose a mixed approver picker');
assert.ok(script.includes('data-workflow-approver-type'), 'Approver picker must support multi-select users, roles, and departments');
assert.ok(script.includes('data-workflow-record-approver-fields'), 'Approver picker must retain dynamic record-user field resolvers');
assert.ok(script.includes('filterWorkflowApproverOptions'), 'Approver picker must support user, role, and department search');
assert.ok(script.includes('data-workflow-approver-search-input'), 'Approver picker must expose a shared search input');
assert.ok(script.includes('workflowNodeFormOptions'), 'Workflow nodes must expose auto-populated form selectors');
assert.ok(script.includes("data-workflow-node-field=\"nodeFormKey\""), 'Start, approval, and end inspectors must bind node forms without manual keys');
assert.ok(script.includes('responseFormKey'), 'Approval nodes must expose response-form selection');
assert.ok(script.includes('data-workflow-response-field'), 'Response fields must support decision/source storage mapping');
assert.ok(script.includes('data-workflow-response-input'), 'Decision modal must render configured structured response inputs');
assert.ok(script.includes("api('/api/sysadmin/forms')"), 'Workflow Builder must load standalone Form Builder definitions');
assert.match(styles, /\.workflow-builder-shell/, 'Expected visual Workflow Builder shell styling');
assert.match(styles, /\.workflow-canvas-node/, 'Expected draggable Workflow node styling');
assert.match(styles, /\.workflow-edge-condition-rule/, 'Expected conditional connection rule styling');
assert.match(styles, /\.workflow-approver-picker/, 'Expected mixed approver picker styling');
assert.match(
  html,
  /id="saveActionFlowButton"[^>]*>Save changes<\/button>\s*<\/div>\s*<\/div>\s*<div class="action-flow-workspace">/,
  'Automation Flow toolbar must close before the full-width canvas workspace begins'
);
assert.match(styles, /\.workflow-approval-rail/, 'Expected approval-rail styling');
assert.match(styles, /\.workflow-monitoring-board/, 'Expected monitoring control-tower styling');
assert.match(styles, /\.workflow-report-filters/, 'Expected responsive workflow report filters');
assert.match(styles, /\.notification-drawer/, 'Expected top-right notification drawer styling');
assert.match(styles, /\.email-settings-shell/, 'Expected dedicated email settings workspace');
assert.match(styles, /\.workflow-delegation-card/, 'Expected dedicated delegation schedule styling');
assert.match(styles, /@media \(max-width: 760px\)/, 'Expected mobile Workflow layout coverage');

process.stdout.write('Workflow frontend contract smoke passed.\n');
