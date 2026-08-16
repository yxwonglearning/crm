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

const routes = fs.readFileSync(path.join(root, 'src/modules/menu/menu.routes.js'), 'utf8');
assert.match(routes, /requireRole\('admin'\)/, 'configuration endpoints must require admin');
assert.match(routes, /configuration\/publish/, 'publish endpoint must exist');
const frontend = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
assert.match(frontend, /loadSidebarMenu/, 'published sidebar must load at runtime');
assert.match(frontend, /data-menu-visibility/, 'visibility editor must be present');
assert.match(frontend, /dragstart/, 'menu structure must support drag ordering');

console.log('Menu configuration smoke test passed.');
