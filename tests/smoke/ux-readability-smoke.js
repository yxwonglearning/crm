const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const styles = fs.readFileSync(path.join(root, 'public/styles.css'), 'utf8');

for (const token of [
  '--type-body',
  '--type-action',
  '--type-support',
  '--type-caption',
  '--leading-body',
  '--leading-compact'
]) {
  assert.ok(styles.includes(token), `Expected semantic readability token ${token}`);
}

assert.match(styles, /html\s*\{[\s\S]*?font-size:\s*100%/, 'Root type must respect the browser default');
assert.match(styles, /text-size-adjust:\s*100%/, 'Mobile text scaling must remain enabled');
assert.match(
  styles,
  /body :is\(button, input, select, textarea, \.button-link\)[\s\S]*?font-size:\s*var\(--type-action\)/,
  'Interactive controls must use the 14px-equivalent action type floor'
);
assert.match(
  styles,
  /--type-action:\s*\.875rem/,
  'Action typography must remain at least 0.875rem'
);
assert.match(
  styles,
  /--type-support:\s*\.8125rem/,
  'Supporting typography must remain at least 0.8125rem'
);
assert.match(
  styles,
  /--type-caption:\s*\.75rem/,
  'Compact metadata must remain at least 0.75rem'
);
assert.match(styles, /overflow-wrap:\s*anywhere/, 'Dense surfaces must allow long text to wrap safely');

process.stdout.write('UX readability contract smoke passed.\n');
