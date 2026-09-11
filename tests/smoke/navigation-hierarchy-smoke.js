const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..', '..');
const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const frontend = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'public/styles.css'), 'utf8');

assert.match(html, /id="toggleMainSidebar"[^>]+aria-pressed="false"/, 'desktop navigation must expose an accessible compact-mode control');
assert.doesNotMatch(frontend, /renderIntent\(|administrativeViews|nav-subintent-label/, 'sidebar must retain the configured hierarchy without inferred Work or Administration areas');
assert.match(frontend, /childrenByParent = new Map/, 'published navigation must index arbitrary-depth parent-child relationships');
assert.match(frontend, /renderEntry\(child, depth \+ 1/, 'published navigation must recursively reuse one renderer at every depth');
assert.match(frontend, /setAttribute\('aria-current', button\.classList\.contains\('is-active'\) \? 'page' : 'false'\)/, 'the current destination must expose aria-current');
assert.match(frontend, /while \(pathNode\)/, 'active route state must traverse every rendered ancestor');
assert.match(frontend, /setSidebarGroupExpanded\(group, true, false\)/, 'active route ancestors must open at arbitrary depth');
assert.match(frontend, /class="nav-group-trigger" aria-expanded="\$\{expanded\}" aria-controls=/, 'group controls must expose native button keyboard behavior and disclosure state');
assert.match(frontend, /region\.inert = !open/, 'collapsed descendants must be removed from keyboard focus order');
assert.match(frontend, /crm:navigation-group:\$\{state\.user\?\.id \|\| 'user'\}/, 'group expansion must be persisted per user');
assert.match(frontend, /crm:navigation-compact:\$\{state\.user\?\.id \|\| 'user'\}/, 'compact navigation preference must be persisted per user');
assert.match(styles, /@media \(min-width: 901px\)[\s\S]*body\.main-sidebar-compact \.app-shell/, 'compact mode must only alter the desktop layout');
assert.match(styles, /@media \(max-width: 900px\)[\s\S]*\.sidebar-compact-button \{ display: none; \}/, 'tablet and mobile navigation must retain their responsive presentation');
assert.match(frontend, /hierarchy-node nav-node/, 'sidebar nodes must opt into the shared hierarchy primitive');
assert.match(frontend, /hierarchy-branch nav-branch/, 'sidebar branches must opt into the shared hierarchy primitive');
assert.match(styles, /\.hierarchy-branch > \.hierarchy-node::after/, 'each recursive child must render a shared flow-based curved connector');
assert.match(styles, /\.is-current-rail-through::after \{ border-left-color:/, 'preceding siblings may carry only the active vertical ancestry rail');
assert.match(styles, /\.is-current-rail-entry::after \{ border-left-color:/, 'the active node must receive the entering vertical rail segment');
assert.match(styles, /\.is-current-path::after \{ border-bottom-color:/, 'only a node on the active route may color its own horizontal branch');
assert.doesNotMatch(styles, /is-current-rail-(?:through|entry)::after[^}]*border-color:/, 'rail propagation must not color inactive sibling branches');
assert.match(styles, /--hierarchy-branch-indent: clamp\(var\(--hierarchy-indent-min\)/, 'deep hierarchy indentation must progressively compress to a safe minimum');
assert.match(styles, /\.nav-button\[aria-current="page"\] \.nav-menu-icon/, 'the current location must have a reinforced visual indicator');
assert.match(styles, /--app-sidebar-w:\s*clamp\(268px, 22vw, 288px\)/, 'expanded desktop navigation must provide a consistent width for workflow labels');
assert.match(styles, /\.nav-button-label, \.nav-group-label \{[^}]*white-space: nowrap;/, 'navigation labels must remain aligned on one line');
assert.match(styles, /body\.main-sidebar-compact \.nav-children \{ display: none; \}/, 'compact mode must hide recursive labels and connectors');
assert.match(styles, /body\.main-sidebar-compact \.nav-group\.has-current-page > \.nav-group-trigger[^}]*box-shadow: inset 0 0 0 2px var\(--primary\)/, 'compact mode must retain an active ancestor icon state');
assert.match(styles, /@media \(max-width: 900px\)[\s\S]*\.sidebar \.nav[\s\S]*overflow-x: auto/, 'mobile must preserve the existing horizontal top-navigation shell');
assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.nav-children/, 'recursive disclosure motion must have a reduced-motion fallback');

console.log('Navigation hierarchy smoke test passed.');
