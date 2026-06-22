const { AppError } = require('../../shared/errors');
const repository = require('./browser-buttons.repository');
const configService = require('../sysadmin/module-config.service');

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function parseJsonObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function assertConfigKey(value, label) {
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(String(value || ''))) {
    throw new AppError(`${label} must start with a letter and use only letters, numbers, or underscores`, 422);
  }
}

function normalizeBrowser(row) {
  if (!row) return null;
  const browser = {
    browserKey: row.browser_key,
    name: row.name,
    sourceModule: row.source_module,
    sourceTable: row.source_table,
    valueField: row.value_field,
    displayField: row.display_field,
    searchFields: parseJsonArray(row.search_fields_json).map(String),
    returnFields: parseJsonArray(row.return_fields_json).map(String),
    filter: parseJsonObject(row.filter_json),
    enabled: Boolean(row.is_enabled)
  };
  [
    browser.sourceTable,
    browser.valueField,
    browser.displayField,
    ...browser.searchFields,
    ...browser.returnFields
  ].forEach((value) => assertConfigKey(value, 'Browser lookup setting'));
  return browser;
}

function browserColumns(browser) {
  return Array.from(new Set([
    browser.valueField,
    browser.displayField,
    ...browser.returnFields,
    ...browser.searchFields
  ].filter(Boolean)));
}

async function searchBrowserButton(browserKey, query = '') {
  await configService.listBrowserButtons();
  const browser = normalizeBrowser(await repository.findBrowserButton(browserKey));
  if (!browser) throw new AppError('Browser button not found', 404);
  if (!browser.enabled) throw new AppError('Browser button is disabled', 422);

  const rows = await repository.searchBrowserRows(
    browser,
    browserColumns(browser),
    browser.searchFields,
    String(query || '').trim()
  );

  return {
    browser: {
      browserKey: browser.browserKey,
      name: browser.name,
      valueField: browser.valueField,
      displayField: browser.displayField,
      returnFields: browser.returnFields
    },
    rows: rows.map((row) => ({
      value: row[browser.valueField],
      display: row[browser.displayField],
      columns: browser.returnFields.reduce((columns, field) => ({
        ...columns,
        [field]: row[field]
      }), {})
    }))
  };
}

async function listBrowserButtons() {
  await configService.listBrowserButtons();
  const browsers = (await repository.listEnabledBrowserButtons()).map(normalizeBrowser);
  return browsers.map((browser) => ({
    browserKey: browser.browserKey,
    name: browser.name,
    sourceModule: browser.sourceModule,
    sourceTable: browser.sourceTable,
    valueField: browser.valueField,
    displayField: browser.displayField,
    searchFields: browser.searchFields,
    returnFields: browser.returnFields,
    enabled: browser.enabled
  }));
}

module.exports = { listBrowserButtons, searchBrowserButton };
