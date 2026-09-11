const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'public/styles.css'), 'utf8');

assert.match(html, /id="workflowKeyboardHelp"/);
assert.match(html, /id="workflowCanvasAnnouncement"[^>]+aria-live="polite"/);
assert.match(script, /function moveWorkflowNodeByKeyboard\(/);
assert.match(script, /\['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'\]/);
assert.match(script, /event\.key === 'Escape'[\s\S]{0,120}cancelWorkflowCanvasMode\(\)/);
assert.match(script, /aria-describedby="workflowKeyboardHelp"/);
assert.match(script, /announceWorkflowCanvas\(`Connected/);
assert.match(script, /event\.key === 'Delete' \|\| event\.key === 'Backspace'/);
assert.match(styles, /\.workflow-canvas-node:focus-visible/);
assert.match(script, /#dashboardCanvas'[\s\S]+addEventListener\('keydown'/, 'Dashboard keyboard behavior must remain present');

console.log('Workflow keyboard builder smoke checks passed.');
