const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..', '..');
const routes = fs.readFileSync(path.join(root, 'src/modules/account/account.routes.js'), 'utf8');
const service = fs.readFileSync(path.join(root, 'src/modules/account/account.service.js'), 'utf8');
const middleware = fs.readFileSync(path.join(root, 'src/modules/auth/auth.middleware.js'), 'utf8');
const frontend = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');

assert.match(routes, /accountRoutes\.use\(requireAuth\)/, 'all account routes must require authentication');
assert.match(routes, /limits: \{ files: 1, fileSize: 5 \* 1024 \* 1024 \}/, 'avatar upload must be size limited');
assert.match(service, /validImageSignature/, 'avatar uploads must validate file signatures');
assert.match(service, /bcrypt\.compare\(input\.currentPassword/, 'password change must verify the current password');
assert.match(middleware, /decoded\.authVersion/, 'tokens must be invalidated when the account auth version changes');
assert.match(html, /id="accountSettingsView"/, 'dedicated account settings page must exist');
assert.match(html, /id="accountMenu"/, 'header account menu must exist');
assert.match(html, /id="adminPortalAccountButton" data-open-admin-portal hidden/, 'Admin Portal must be a hidden-by-default account-menu action');
assert.doesNotMatch(html, /<aside class="sidebar">[\s\S]*?<button[^>]+data-view="sysadminView"/, 'Admin Portal must not remain as a duplicate sidebar action');
assert.doesNotMatch(html, /<aside class="sidebar">[\s\S]*?<button id="logoutButton"/, 'sign out must not remain in the sidebar');
assert.match(frontend, /loadAccountAvatar/, 'authenticated avatar loading must be wired');
assert.match(frontend, /adminPortalAccountButton'\)\.hidden = user\.role !== 'admin'/, 'Admin Portal account action must be restricted to the admin role');

console.log('Account settings smoke test passed.');
