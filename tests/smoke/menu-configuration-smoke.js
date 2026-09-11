const fs = require('fs');
const path = require('path');
const assert = require('assert');
const service = require('../../src/modules/menu/menu.service');

const root = path.resolve(__dirname, '..', '..');
const defaults = service.defaultConfig();
assert.equal(service.validate(defaults).valid, true, 'safe default menu must validate');
assert.ok(defaults.items.some((item) => item.systemKey === 'admin_portal'), 'safe default must retain Admin Portal');

const unsafeExternal = structuredClone(defaults);
unsafeExternal.items.push({ key: 'unsafe_link', type: 'item', parentKey: null, label: 'Unsafe', enabled: true, order: 99, destination: { type: 'external', url: 'http://example.com' }, visibility: { roles: [], userIds: [], departmentIds: [] } });
assert.equal(service.validate(unsafeExternal).valid, false, 'external destinations must require HTTPS');

const lockedOut = structuredClone(defaults);
lockedOut.items.find((item) => item.systemKey === 'admin_portal').enabled = false;
assert.equal(service.validate(lockedOut).valid, false, 'Admin Portal cannot be disabled');

const deepHierarchy = structuredClone(defaults);
['deep_one', 'deep_two', 'deep_three', 'deep_four'].forEach((key, index, keys) => deepHierarchy.items.push({
  key, type: 'group', parentKey: index ? keys[index - 1] : null, label: `Deep ${index + 1}`, icon: 'none', enabled: true, order: 20 + index,
  destination: null, visibility: { roles: [], userIds: [], departmentIds: [] }
}));
deepHierarchy.items.push({ key: 'deep_leaf', type: 'item', parentKey: 'deep_four', label: 'Deep Leaf', icon: 'none', enabled: true, order: 1, destination: { type: 'view', key: 'customersView' }, visibility: { roles: [], userIds: [], departmentIds: [] } });
assert.equal(service.validate(deepHierarchy).valid, true, 'valid menus must support more than three nested hierarchy levels');

const orphaned = structuredClone(deepHierarchy);
orphaned.items.find((item) => item.key === 'deep_leaf').parentKey = 'missing_group';
assert.equal(service.validate(orphaned).valid, false, 'orphaned parent references must remain invalid');

const cyclic = structuredClone(deepHierarchy);
cyclic.items.find((item) => item.key === 'deep_one').parentKey = 'deep_four';
assert.equal(service.validate(cyclic).valid, false, 'circular parent paths must remain invalid after removing the depth cap');

const routes = fs.readFileSync(path.join(root, 'src/modules/menu/menu.routes.js'), 'utf8');
assert.match(routes, /requireRole\('admin'\)/, 'configuration endpoints must require admin');
assert.match(routes, /configuration\/publish/, 'publish endpoint must exist');
const frontend = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
assert.match(frontend, /loadSidebarMenu/, 'published sidebar must load at runtime');
assert.match(frontend, /data-menu-visibility/, 'visibility editor must be present');
assert.match(frontend, /dragstart/, 'menu structure must support drag ordering');
assert.match(frontend, /function menuDescendantKeys\(parentKey\)/, 'menu deletion must collect descendants recursively');
assert.match(frontend, /Remove Menu Branch/, 'deep branch deletion must require clear confirmation');
assert.match(frontend, /!descendants\.has\(entry\.key\)/, 'confirmed branch deletion must remove every descendant deterministically');

console.log('Menu configuration smoke test passed.');
