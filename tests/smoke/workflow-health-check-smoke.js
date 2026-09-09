const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const script = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'public/styles.css'), 'utf8');

assert.match(script, /function workflowCheckFindingView\(/);
assert.match(script, /Choose allowed file types for \$\{nodeLabel\}/);
assert.match(script, /Remove the connection entering Start/);
assert.match(script, /Fix routes leaving \$\{nodeLabel\}/);
assert.match(script, /Connect \$\{nodeLabel\} to the workflow/);
assert.match(script, /Choose an approver for \$\{nodeLabel\}/);
assert.doesNotMatch(script, /<code>\$\{escapeHtml\(finding\.path/);
assert.match(script, /data-workflow-check-target-type/);
assert.match(script, /openWorkflowCheckTarget/);
assert.match(styles, /\.workflow-check-list article/);
assert.match(styles, /@media \(max-width: 720px\)/);

console.log('Workflow health-check presentation smoke checks passed.');
