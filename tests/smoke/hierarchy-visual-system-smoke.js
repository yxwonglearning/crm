const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..', '..');
const frontend = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'public/styles.css'), 'utf8');
const apiRoutes = fs.readFileSync(path.join(root, 'src/modules/action-flows/action-flows.routes.js'), 'utf8');
const permissionHierarchySource = frontend.slice(frontend.indexOf('function renderPermissionPicker'), frontend.indexOf('function renderFieldPermissionCell'));

assert.match(frontend, /function hierarchyChildrenIndex\(/, 'hierarchy renderers must share a lightweight child-index helper');
assert.match(frontend, /function hierarchyPathKeys\(/, 'hierarchy renderers must share cycle-safe ancestor path calculation');
assert.match(frontend, /function hierarchyNodePathClasses\(/, 'hierarchy renderers must distinguish path entries from rail-through siblings');
assert.match(styles, /--hierarchy-connector-width:\s*1\.5px/, 'hierarchies must share canonical connector thickness');
assert.match(styles, /--hierarchy-connector-radius:\s*8px/, 'hierarchies must share canonical branch curvature');
assert.match(styles, /pointer-events:\s*none/, 'connector layers must not intercept hierarchy interactions');
assert.match(styles, /--hierarchy-branch-indent:\s*clamp\(/, 'hierarchy depth must progressively compress');
assert.doesNotMatch(styles, /hierarchy-(?:level|depth)-(?:2|3|4)/, 'connector geometry must not use level-specific classes');

assert.match(frontend, /class="hierarchy-node department-tree-node/, 'Organization Structure must use recursive hierarchy nodes');
assert.match(frontend, /children\.length \? `<div class="hierarchy-branch">\$\{renderNodes\(children, depth \+ 1\)\}/, 'Organization Structure must recursively reuse the same branch treatment');
assert.doesNotMatch(frontend, /departmentChildren\(node\.id\)\.length \? '▾ '/, 'static Organization Structure must not display a false disclosure glyph');

assert.match(frontend, /class="hierarchy-node permission-department-entry/, 'department permission choices must use recursive hierarchy nodes');
assert.match(frontend, /parentValue:\s*node\.parentId/, 'permission hierarchy entries must preserve their parent relationship');
assert.match(frontend, /entry\.parentElement\?\.closest\('\.permission-department-entry'\)/, 'permission search and selection paths must retain visible ancestors');
assert.match(frontend, /syncPermissionHierarchyState\(picker\)/, 'permission connector state must update independently after checkbox changes');
assert.doesNotMatch(permissionHierarchySource, /\.indeterminate\s*=|checked\s*=\s*true/, 'the rollout must not introduce cascading or indeterminate department permissions');

assert.match(frontend, /class="hierarchy-node api-tree-child-node/, 'existing API category children must use the canonical connector primitive');
assert.match(frontend, /api-tree-group[^`]+has-selected-descendant/, 'API roots must distinguish selected descendants from expansion');
assert.match(frontend, /aria-controls="\$\{regionId\}"/, 'API disclosures must retain an explicit controlled region');
assert.doesNotMatch(apiRoutes, /parentCategoryKey/, 'the visual rollout must not add nested API category behavior');

assert.match(frontend, /class="hierarchy-node menu-tree-node/, 'Menu Configuration must use hierarchy wrappers behind draggable rows');
assert.match(frontend, /draggable="true" class="menu-tree-item/, 'Menu Configuration rows must remain draggable');
assert.match(frontend, /addEventListener\('pointerdown'/, 'touch and pointer reordering must remain available');
assert.match(styles, /\.menu-tree-item \{ position: relative; z-index: 1;/, 'menu rows must remain above connector layers');
assert.match(styles, /\.menu-tree-item\.is-drop-before::before/, 'before-drop feedback must remain present');
assert.match(styles, /\.menu-tree-item\.is-drop-inside/, 'inside-group drop feedback must remain present');

assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.hierarchy-node::before,[\s\S]*\.hierarchy-node::after \{ transition: none !important; \}/, 'connector state changes must honor reduced motion');

console.log('Hierarchy visual system smoke test passed.');
