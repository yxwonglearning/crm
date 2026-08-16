const assert = require('assert/strict');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '../../public/app.js'), 'utf8');

function functionSource(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} must exist`);
  const brace = source.indexOf('{', start);
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = brace; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
    if (char === '{') depth += 1;
    if (char === '}' && --depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Could not parse ${name}`);
}

const context = { Intl, Map, Set, Number, String, Math };
vm.createContext(context);
for (const name of ['dashboardWidgetConfig', 'formatDashboardDimension', 'aggregateDashboardValues', 'buildDashboardPivot']) {
  vm.runInContext(`${functionSource(name)}; this.${name} = ${name};`, context);
}

const rows = [
  { region: 'North', owner: 'Amy', status: 'Open', amount: 10, quantity: 2 },
  { region: 'North', owner: 'Amy', status: 'Won', amount: 20, quantity: 3 },
  { region: 'North', owner: 'Ben', status: 'Open', amount: 5, quantity: 1 },
  { region: 'South', owner: null, status: 'Won', amount: 40, quantity: 4 }
];
const widget = { config: { mappings: { pivotRows: ['region', 'owner'], pivotColumns: ['status'], pivotValues: ['amount', 'quantity'] }, aggregation: 'sum', topN: 10, emptyLabel: '(none)', sortDirection: 'desc' } };
const pivot = context.buildDashboardPivot(widget, rows);
assert.deepEqual([...pivot.columnKeys], ['Open', 'Won']);
assert.equal(pivot.valueFields.length, 2);
assert.equal(pivot.rows[0].labels[0], 'South');
assert.equal(pivot.rows.find((row) => row.labels[0] === 'South').labels[1], '(none)');
assert.equal(context.aggregateDashboardValues([10, 20, 5], 'sum'), 35);
assert.equal(context.aggregateDashboardValues([10, 20, 5], 'average'), 35 / 3);
assert.equal(context.aggregateDashboardValues([10, 20, 5], 'minimum'), 5);
assert.equal(context.aggregateDashboardValues([10, 20, 5], 'maximum'), 20);
assert.equal(context.aggregateDashboardValues(['a', 'b'], 'count'), 2);

const tooWide = context.buildDashboardPivot({ config: { mappings: { pivotRows: ['region'], pivotColumns: ['status'], pivotValues: Array.from({ length: 51 }, (_, index) => `value_${index}`) } } }, rows);
assert.match(tooWide.error, /more than 100 value columns/);
process.stdout.write('Dashboard pivot smoke passed.\n');
