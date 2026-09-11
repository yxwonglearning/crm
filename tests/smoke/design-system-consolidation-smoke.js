const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'styles.css'), 'utf8');

function expect(pattern, message) {
  if (!pattern.test(css)) throw new Error(message);
}

const globalRoots = css.match(/^:root\s*\{/gm) || [];
if (globalRoots.length !== 1) throw new Error(`Expected one canonical global :root block, found ${globalRoots.length}.`);

[
  '--type-body', '--type-action', '--type-support', '--type-caption',
  '--space-1', '--space-2', '--space-3', '--space-4', '--space-5',
  '--control-height', '--control-pad-x',
  '--motion-instant', '--motion-fast', '--motion-standard', '--motion-ease',
  '--radius-control', '--radius-compact', '--radius-panel', '--radius-dialog', '--radius-pill',
  '--border-standard', '--focus-ring', '--focus-offset',
  '--control-shadow', '--theme-shadow', '--material-shadow-popover', '--material-shadow-inspector', '--material-shadow-modal'
].forEach((token) => {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const count = (css.match(new RegExp(`^\\s*${escaped}\\s*:`, 'gm')) || []).length;
  if (count !== 1) throw new Error(`${token} must have exactly one canonical definition; found ${count}.`);
});

expect(/button,\s*\n\.button-link\s*\{[\s\S]*?border-radius: var\(--radius-control\)/, 'Shared controls must consume the control-radius token.');
expect(/transition: color var\(--motion-fast\)/, 'Shared interaction feedback must consume semantic motion tokens.');
expect(/:is\(button, \.button-link\):focus-visible\s*\{[\s\S]*?outline: var\(--focus-ring\)/, 'Shared controls must consume the focus-ring token.');
expect(/\.panel,[\s\S]*?border-radius: var\(--radius-panel\);[\s\S]*?box-shadow: var\(--theme-shadow\);/, 'Shared panels must consume semantic radius and shadow tokens.');
expect(/@media \(prefers-contrast: more\)\s*\{[\s\S]*?--focus:/, 'Higher-contrast preference must continue to override semantic focus color.');

console.log('Design-system consolidation smoke checks passed.');
