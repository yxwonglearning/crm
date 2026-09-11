const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'public/styles.css'), 'utf8');

const modalBackdrops = [...html.matchAll(/<div\s+id="([^"]+)"\s+class="[^"]*modal-backdrop[^"]*"\s+hidden>/g)].map((match) => match[1]);
assert.ok(modalBackdrops.length >= 30, 'Expected the shared controller to cover every modal and drawer surface');
assert.equal(new Set(modalBackdrops).size, modalBackdrops.length, 'Modal backdrop IDs must be unique');

for (const functionName of [
  'configureModalSurface',
  'modalFocusableElements',
  'topmostModalSurface',
  'syncModalSurfaceState',
  'focusModalSurface',
  'handleModalSurfaceOpened',
  'handleModalSurfaceClosed',
  'requestModalSurfaceDismiss',
  'trapModalSurfaceFocus',
  'initializeModalSurfaces'
]) {
  assert.match(script, new RegExp(`function ${functionName}\\(`), `Expected shared modal function ${functionName}`);
}

assert.match(script, /card\.setAttribute\('aria-modal', 'true'\)/, 'Every modal card must receive modal semantics');
assert.match(script, /card\.setAttribute\('aria-labelledby', heading\.id\)/, 'Dialogs with headings must use them as accessible names');
assert.match(script, /card\.setAttribute\('aria-describedby', description\.id\)/, 'Every dialog must expose descriptive context');
assert.match(script, /modal\.inert = !isTopmost/, 'Only the topmost modal may remain interactive');
assert.match(script, /if \(event\.key === 'Tab'\) trapModalSurfaceFocus/, 'Tab must remain inside the topmost modal');
assert.match(script, /if \(event\.key === 'Escape'\)/, 'Escape dismissal must be centralized');
assert.match(script, /event\.target === modal && modal === topmostModalSurface\(\)/, 'Only the topmost backdrop may dismiss on click');
assert.match(script, /opener\.focus\(\)/, 'Closing a modal must restore focus to its opener');
assert.match(script, /initializeScrollableModalFrames\(\);\s*initializeModalSurfaces\(\);/, 'Modal accessibility must initialize after modal frames are normalized');
assert.match(styles, /\.sr-only\s*\{/, 'Generated accessible descriptions must have a visually hidden utility');

process.stdout.write(`Modal accessibility contract smoke passed for ${modalBackdrops.length} surfaces.\n`);
