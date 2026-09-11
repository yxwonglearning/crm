const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const script = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'public/styles.css'), 'utf8');

assert.match(script, /function workflowRubberBand\(/);
assert.match(script, /function workflowDragPosition\(/);
assert.match(script, /grabOffsetX:/);
assert.match(script, /grabOffsetY:/);
assert.match(script, /distance < 8/);
assert.match(script, /requestAnimationFrame\(renderWorkflowDragFrame\)/);
assert.match(script, /translate3d\(/);
assert.match(script, /updateWorkflowConnectedEdges/);
assert.match(script, /node\.x = Math\.round/);
assert.match(script, /window\.addEventListener\('pointercancel', finishWorkflowCanvasInteraction\)/);
assert.doesNotMatch(script, /node\.x = Math\.max\(0, drag\.x[\s\S]{0,300}renderWorkflowCanvas\(\)/);
assert.match(styles, /\.workflow-canvas-node\.is-dragging/);
assert.match(styles, /will-change:\s*transform/);

console.log('Workflow canvas fluidity smoke checks passed.');
