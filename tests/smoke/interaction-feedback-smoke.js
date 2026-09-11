const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'public', 'styles.css'), 'utf8');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const submitBindings = (app.match(/bindAsyncSubmit\(\$\(/g) || []).length;
const rawSubmitBindings = (app.match(/addEventListener\('submit'/g) || []).length;

assert(submitBindings >= 35, `Expected all application forms to use shared feedback; found ${submitBindings}.`);
assert(rawSubmitBindings === 1, 'A form bypasses the shared submission wrapper.');
assert(app.includes("form.dataset.submitting === 'true'"), 'Duplicate-submit guard is missing.');
assert(app.includes("form.setAttribute('aria-busy', 'true')"), 'Forms must expose their busy state.');
assert(app.includes("submitButton.classList.add('is-busy')"), 'Submit controls must receive a visible busy state.');
assert(app.includes('await handler(event)'), 'Busy state must remain until the asynchronous handler settles.');
assert(app.includes('finally {'), 'Busy state must be restored on both success and failure.');
assert(styles.includes(':not(:disabled):active'), 'Immediate pressed feedback is missing.');
assert(styles.includes('button.is-busy::before'), 'Visible loading indicator styling is missing.');
assert(styles.includes('@media (pointer: coarse)'), 'Coarse-pointer touch target rules are missing.');
assert(styles.includes('min-height: 44px'), 'Touch targets must reach 44px on coarse pointers.');
assert(styles.includes('touch-action: manipulation'), 'Tap responsiveness optimization is missing.');

process.stdout.write(`Interaction feedback contract smoke passed for ${submitBindings} forms.\n`);
