const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'public/styles.css'), 'utf8');

assert.match(html, /id="menuConfigAnnouncement"[^>]+aria-live="polite"/);
assert.match(script, /function moveMenuItem\(/);
assert.match(script, /function menuDropPlacement\(/);
assert.match(script, /function autoScrollReorderSurface\(/);
assert.match(script, /pointerType === 'mouse'/);
assert.match(script, /data-move-menu="up"/);
assert.match(script, /data-move-menu="down"/);
assert.match(script, /data-move-menu="into"/);
assert.match(script, /data-move-menu="out"/);
assert.match(script, /function reorderFormDesignFieldAt\(/);
assert.match(script, /data-design-action="move-up"/);
assert.match(script, /data-design-action="move-down"/);
assert.match(script, /formDesignAnnouncement/);
assert.match(styles, /\.menu-tree-item\.is-drop-inside/);
assert.match(styles, /\.menu-tree-item\.is-drop-before::before/);
assert.match(styles, /\.form-design-field\.is-drop-after::after/);
assert.match(script, /item\.visibility/, 'Menu visibility configuration must remain part of the unchanged draft item');

console.log('Menu and form accessible reordering smoke checks passed.');

// Execute production helpers against isolated fixtures; regex checks alone cannot
// catch a saved order that disagrees with the visible section order.
const vm = require('node:vm');
function helper(name) {
  const start = script.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `Missing ${name}`);
  const end = script.indexOf('\nfunction ', start + 1);
  return script.slice(start, end < 0 ? undefined : end);
}
const fields = [
  { fieldKey: 'a', label: 'Alpha', showInForm: true },
  { fieldKey: 'hidden', label: 'Hidden', showInForm: false },
  { fieldKey: 'b', label: 'Beta', showInForm: true },
  { fieldKey: 'c', label: 'Gamma', showInForm: true },
  { fieldKey: 'detail', tableType: 'detail', detailTableName: 'lines', showInForm: true }
];
let layouts = { draft: { add: { order: fields.map(f => f.fieldKey), hidden: ['hidden'], sections: [
  { id: 'one', fieldKeys: ['a', 'b'] }, { id: 'two', fieldKeys: ['c'] }
] } } };
let announcement = '';
const context = vm.createContext({
  state: { activeFormDesignType: 'add' },
  orderedFormDesignFields: () => layouts.draft.add.order.map(key => fields.find(f => f.fieldKey === key)),
  readFormDesignLayouts: () => structuredClone(layouts),
  writeFormDesignLayouts: value => { layouts = structuredClone(value); },
  syncFormDesignSectionsWithOrder: () => {},
  renderFormDesignDrawer: () => {},
  announceFormDesign: message => { announcement = message; },
  isFormDesignFieldVisible: field => field.showInForm,
  formDesignSectionForField: key => layouts.draft.add.sections.find(s => s.fieldKeys.includes(key))
});
vm.runInContext(['updateFormDesignDraftOrder', 'reorderFormDesignFieldAt', 'formDesignReorderPeers'].map(helper).join('\n'), context);
context.reorderFormDesignFieldAt('b', 'a', 'before');
assert.deepEqual(layouts.draft.add.sections[0].fieldKeys, ['b', 'a']);
assert.equal(announcement, 'Beta moved before Alpha.');
context.reorderFormDesignFieldAt('b', 'c', 'after');
assert.deepEqual(layouts.draft.add.sections[0].fieldKeys, ['a']);
assert.deepEqual(layouts.draft.add.sections[1].fieldKeys, ['c', 'b']);
assert.deepEqual(Array.from(context.formDesignReorderPeers(fields[2]), f => f.fieldKey), ['c', 'b']);
const beforeInvalid = JSON.stringify(layouts);
context.reorderFormDesignFieldAt('hidden', 'a', 'after');
context.reorderFormDesignFieldAt('a', 'detail', 'before');
assert.equal(JSON.stringify(layouts), beforeInvalid, 'Rearrangement cannot unhide fields or change table ownership');
assert.deepEqual(layouts.draft.add.hidden, ['hidden']);
console.log('Form order, section membership, announcements, and visibility behavior passed.');

const menuItems = [
  { key: 'a', label: 'Alpha', order: 1, visibility: { roles: ['admin'] }, destination: { key: 'customers' } },
  { key: 'b', label: 'Beta', order: 2, enabled: false },
  { key: 'group', label: 'Group', type: 'group', order: 3 },
  { key: 'child', label: 'Child group', type: 'group', parentKey: 'group', order: 1 },
  { key: 'admin', systemKey: 'admin_portal', order: 4 }
];
const menuContext = vm.createContext({ state: { menuConfigDraft: { items: menuItems } }, renderMenuConfig: () => {}, announceMenuMove: () => {} });
vm.runInContext(['menuSiblings', 'normalizeMenuSiblingOrders', 'moveMenuItem'].map(helper).join('\n'), menuContext);
const policy = JSON.stringify(menuItems.map(({ order, parentKey, ...rest }) => rest));
assert.equal(menuContext.moveMenuItem('a', 'group', 'inside'), true);
assert.equal(menuItems[0].parentKey, 'group');
assert.equal(menuContext.moveMenuItem('group', 'child', 'inside'), false, 'Prevent ancestor cycles');
assert.equal(menuContext.moveMenuItem('admin', 'group', 'inside'), false, 'Protect admin entry');
assert.equal(menuContext.moveMenuItem('a', 'group', 'after'), true);
assert.equal(menuItems[0].parentKey, null);
assert.equal(JSON.stringify(menuItems.map(({ order, parentKey, ...rest }) => rest)), policy, 'Moves preserve visibility, destination and enabled flags');
console.log('Menu hierarchy, cycle protection, admin protection and policy preservation passed.');
