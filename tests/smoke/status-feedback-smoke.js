const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'public/styles.css'), 'utf8');

assert.match(html, /id="toast"[^>]*tabindex="-1"[\s\S]*id="toastMessage"[\s\S]*id="dismissToast"/);
assert.match(script, /isError \? 'alert' : 'status'/);
assert.match(script, /isError \? 'assertive' : 'polite'/);
assert.match(script, /mouseenter', pauseToastDismiss/);
assert.match(script, /focusin', pauseToastDismiss/);
assert.match(script, /if \(isError\) showFormErrorSummary/);
assert.match(script, /document\.addEventListener\('invalid',[\s\S]*showFieldError\(event\.target\)/);
assert.match(script, /input\.setAttribute\('aria-describedby'/);
assert.match(styles, /\.field-error\s*\{/);
assert.match(styles, /\.form-error-summary\s*\{/);
assert.match(styles, /\[aria-invalid="true"\]/);

console.log('Status feedback smoke checks passed.');
