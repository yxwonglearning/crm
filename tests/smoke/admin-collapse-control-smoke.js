const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'public', 'styles.css'), 'utf8');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(html.includes('id="adminMenu"'), 'Admin navigation needs a stable controlled region.');
assert(html.includes('aria-controls="adminMenu"'), 'Collapse control must identify the navigation it controls.');
assert(html.includes('aria-expanded="true"'), 'Collapse control must expose its initial expanded state.');
assert(app.includes("button.setAttribute('aria-expanded', String(!state.adminMenuCollapsed))"), 'Collapsed state must update aria-expanded.');
assert(/\.admin-menu\s*\{[\s\S]*?padding:\s*clamp\(56px/.test(styles), 'Admin navigation must reserve a dedicated top control lane.');
assert(/\.admin-collapse-button\s*\{[\s\S]*?top:\s*clamp\(12px/.test(styles), 'Collapse control must sit in the top rail lane instead of overlapping the first item.');
assert(/\.admin-collapse-button\s*\{[\s\S]*?right:\s*11px/.test(styles), 'Collapse control must remain visually owned by the admin rail and center when collapsed.');
assert(/\.admin-collapse-button\s*\{[\s\S]*?border-radius:\s*50%/.test(styles), 'Collapse control should read as a compact sidebar-toolbar control.');
assert(/@media \(max-width: 900px\)[\s\S]*?\.admin-collapse-button\s*\{\s*display:\s*none;/.test(styles), 'Collapse control must remain hidden in the single-column mobile layout.');

process.stdout.write('Admin collapse control smoke passed.\n');
