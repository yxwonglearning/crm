const { dashboardPool } = require('../../database/pool');
const crypto = require('crypto');
const { config } = require('../../shared/config');
const { AppError } = require('../../shared/errors');
const repository = require('./dashboards.repository');

const blockedKeywords = new Set([
  'insert', 'update', 'delete', 'replace', 'merge', 'drop', 'alter', 'create', 'truncate',
  'rename', 'grant', 'revoke', 'call', 'execute', 'prepare', 'deallocate', 'handler',
  'load', 'outfile', 'dumpfile', 'into', 'lock', 'unlock', 'set', 'use'
]);
const blockedFunctions = new Set(['sleep', 'benchmark', 'get_lock', 'release_lock', 'is_free_lock', 'load_file']);
const identifierPattern = /^[a-zA-Z_][a-zA-Z0-9_$]*$/;
const activeExecutions = { count: 0 };
const maximumConcurrentQueries = 4;
const resultCache = new Map();
const maximumCacheEntries = 200;
const cacheTtlMs = 30_000;
const staleAfterMs = 60_000;
const slowQueryMs = 2_000;

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  return value;
}

function executionIdentity(context = {}) {
  const user = context.user || {};
  return {
    userId: String(user.id || user.userId || ''),
    role: String(user.role || ''),
    staffId: String(user.staffId || user.staff_id || ''),
    departmentId: String(user.departmentId || user.department_id || ''),
    departmentIds: [...(user.departmentIds || user.department_ids || [])].map(String).sort()
  };
}

function cacheKey(dataSourceKey, input, context) {
  return crypto.createHash('sha256').update(JSON.stringify(stableValue({
    dataSourceKey,
    parameters: input.parameters || {},
    limit: input.limit || null,
    offset: input.offset || 0,
    dashboardKey: context.dashboardKey || '',
    widgetKey: context.widgetKey || '',
    identity: executionIdentity(context)
  }))).digest('hex');
}

function invalidateDataSourceCache(dataSourceKey) {
  for (const [key, entry] of resultCache) if (!dataSourceKey || entry.dataSourceKey === dataSourceKey) resultCache.delete(key);
}

function storeCache(key, dataSourceKey, result) {
  while (resultCache.size >= maximumCacheEntries) resultCache.delete(resultCache.keys().next().value);
  resultCache.set(key, { dataSourceKey, storedAt: Date.now(), result });
}

function quotedIdentifier(identifier) {
  if (!identifierPattern.test(String(identifier || ''))) throw new AppError('Unsafe database identifier', 422);
  return `\`${identifier}\``;
}

function scanSql(sql) {
  const text = String(sql || '').trim();
  if (!text) throw new AppError('Dashboard query is empty', 422);
  const tokens = [];
  const parameters = [];
  let code = '';
  let index = 0;
  let state = 'code';
  let quote = '';
  while (index < text.length) {
    const char = text[index];
    const next = text[index + 1] || '';
    if (state === 'quoted') {
      if (char === '\\') { index += 2; continue; }
      if (char === quote) {
        if (text[index + 1] === quote) { index += 2; continue; }
        state = 'code'; quote = '';
      }
      code += ' ';
      index += 1;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      state = 'quoted'; quote = char; code += char === '`' ? '`' : ' '; index += 1; continue;
    }
    if ((char === '-' && next === '-') || char === '#' || (char === '/' && next === '*')) {
      throw new AppError('SQL comments are not allowed in dashboard queries', 422);
    }
    if (char === ';') throw new AppError('SQL statement separators are not allowed in dashboard queries', 422);
    if (char === '@' && next === '@') throw new AppError('SQL system variables are not allowed in dashboard queries', 422);
    if (char === ':' && /[a-zA-Z_]/.test(next)) {
      let end = index + 2;
      while (/[a-zA-Z0-9_]/.test(text[end] || '')) end += 1;
      parameters.push(text.slice(index + 1, end));
      code += ` ${text.slice(index, end)} `;
      index = end;
      continue;
    }
    code += char;
    index += 1;
  }
  if (state === 'quoted') throw new AppError('Dashboard query contains an unterminated quoted value', 422);

  const tokenPattern = /`([^`]+)`|:([a-zA-Z_][a-zA-Z0-9_]*)|([a-zA-Z_][a-zA-Z0-9_$]*)|([().,*])/g;
  let match;
  while ((match = tokenPattern.exec(code))) {
    tokens.push({ value: match[1] || match[2] || match[3] || match[4], parameter: Boolean(match[2]), position: match.index });
  }
  return { text, code, tokens, parameters: [...new Set(parameters)] };
}

function validateReadOnlySql(sql) {
  const scanned = scanSql(sql);
  const words = scanned.tokens.filter((token) => !token.parameter && /^[a-zA-Z_]/.test(token.value)).map((token) => token.value.toLowerCase());
  if (!['select', 'with'].includes(words[0])) throw new AppError('Dashboard queries must start with SELECT or WITH', 422);
  for (const word of words) {
    if (blockedKeywords.has(word)) throw new AppError(`Dashboard query contains prohibited SQL: ${word.toUpperCase()}`, 422);
  }
  for (let index = 0; index < scanned.tokens.length - 1; index += 1) {
    const token = scanned.tokens[index];
    const next = scanned.tokens[index + 1];
    if (blockedFunctions.has(token.value.toLowerCase()) && next.value === '(') {
      throw new AppError(`Dashboard query contains prohibited function: ${token.value}`, 422);
    }
    if (['from', 'join'].includes(token.value.toLowerCase())) {
      const tableToken = scanned.tokens[index + 1];
      const separator = scanned.tokens[index + 2];
      if (tableToken && separator?.value === '.') {
        const schema = tableToken.value.toLowerCase();
        if (schema !== config.db.database.toLowerCase()) throw new AppError(`Dashboard queries cannot access schema: ${tableToken.value}`, 422);
      }
    }
  }
  return scanned;
}

function safeParameterValue(value, name) {
  const scalar = (item) => item === null || ['string', 'number', 'boolean'].includes(typeof item);
  if (Array.isArray(value)) {
    if (value.length > 100 || !value.every(scalar)) throw new AppError(`Invalid dashboard parameter: ${name}`, 422);
    return value;
  }
  if (!scalar(value)) throw new AppError(`Invalid dashboard parameter: ${name}`, 422);
  return value;
}

function bindParameters(required, supplied = {}) {
  const allowed = new Set(required);
  const missing = required.filter((name) => supplied[name] === undefined);
  if (missing.length) throw new AppError(`Missing dashboard parameter: ${missing[0]}`, 422);
  for (const name of Object.keys(supplied)) {
    if (!allowed.has(name)) throw new AppError(`Unrecognized dashboard parameter: ${name}`, 422);
  }
  return Object.fromEntries(required.map((name) => [name, safeParameterValue(supplied[name], name)]));
}

async function discoverViews() {
  const [rows] = await dashboardPool.execute(
    `SELECT TABLE_NAME, VIEW_DEFINITION, CHECK_OPTION, IS_UPDATABLE
     FROM information_schema.VIEWS WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME`,
    [config.db.database]
  );
  return {
    views: rows.map((row) => ({
      name: row.TABLE_NAME,
      definitionAvailable: Boolean(row.VIEW_DEFINITION),
      checkOption: row.CHECK_OPTION,
      updatable: String(row.IS_UPDATABLE).toUpperCase() === 'YES'
    }))
  };
}

async function describeView(viewName) {
  if (!identifierPattern.test(String(viewName || ''))) throw new AppError('Unsafe SQL view name', 422);
  const [views] = await dashboardPool.execute(
    'SELECT TABLE_NAME FROM information_schema.VIEWS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? LIMIT 1',
    [config.db.database, viewName]
  );
  if (!views[0]) throw new AppError('SQL view not found in the CRM database', 404);
  const [columns] = await dashboardPool.execute(
    `SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, ORDINAL_POSITION
     FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
    [config.db.database, viewName]
  );
  return {
    view: {
      name: viewName,
      columns: columns.map((column) => ({ name: column.COLUMN_NAME, dataType: column.DATA_TYPE, columnType: column.COLUMN_TYPE, nullable: column.IS_NULLABLE === 'YES', position: Number(column.ORDINAL_POSITION) }))
    }
  };
}

async function executeDataSource(dataSourceKey, input = {}, context = {}) {
  const source = await repository.findDataSourceByKey(dataSourceKey);
  if (!source || source.archived) throw new AppError('Dashboard data source not found', 404);
  const limit = Math.min(Math.max(Number(input.limit) || source.rowLimit, 1), source.rowLimit);
  const offset = Math.max(Number(input.offset) || 0, 0);
  if (!Number.isInteger(limit) || !Number.isInteger(offset)) throw new AppError('Dashboard pagination must use whole numbers', 422);
  const normalizedInput = { ...input, limit, offset };
  const key = cacheKey(dataSourceKey, normalizedInput, context);
  const cached = resultCache.get(key);
  if (!input.forceRefresh && cached && Date.now() - cached.storedAt <= cacheTtlMs) {
    return { ...cached.result, cache: { status: 'hit', refreshedAt: new Date(cached.storedAt).toISOString(), staleAt: new Date(cached.storedAt + staleAfterMs).toISOString() } };
  }
  if (activeExecutions.count >= maximumConcurrentQueries) throw new AppError('Dashboard query capacity is busy; try again shortly', 429);
  activeExecutions.count += 1;

  let sql;
  let parameters = {};
  if (source.sourceType === 'sql_view') {
    await describeView(source.viewName);
    sql = `SELECT * FROM ${quotedIdentifier(source.viewName)} LIMIT ${limit} OFFSET ${offset}`;
  } else {
    const scanned = validateReadOnlySql(source.querySql);
    parameters = bindParameters(scanned.parameters, input.parameters || {});
    sql = `SELECT * FROM (${scanned.text}) AS dashboard_source LIMIT ${limit} OFFSET ${offset}`;
  }

  let connection;
  const startedAt = Date.now();
  try {
    connection = await dashboardPool.getConnection();
    await connection.query('SET TRANSACTION READ ONLY');
    await connection.beginTransaction();
    const [rows, fields] = await connection.query({ sql, values: parameters, timeout: source.timeoutMs });
    await connection.rollback();
    const columns = fields.map((field) => ({ name: field.name, table: field.table || '', type: Number(field.type) }));
    await repository.updateDataSource(dataSourceKey, { validationStatus: 'valid', validationMessage: '', lastTestedAt: new Date() });
    const durationMs = Date.now() - startedAt;
    if (durationMs >= slowQueryMs) console.warn(`[dashboard-query] slow source=${dataSourceKey} durationMs=${durationMs} rows=${rows.length}`);
    const refreshedAt = new Date().toISOString();
    const result = { dataSourceKey, rows, columns, page: { limit, offset, returned: rows.length, hasMore: rows.length === limit, nextOffset: rows.length === limit ? offset + rows.length : null }, durationMs };
    storeCache(key, dataSourceKey, result);
    return { ...result, cache: { status: input.forceRefresh ? 'refreshed' : 'miss', refreshedAt, staleAt: new Date(Date.now() + staleAfterMs).toISOString() } };
  } catch (error) {
    try { await connection.rollback(); } catch (_rollbackError) { /* connection cleanup only */ }
    if (error instanceof AppError) throw error;
    await repository.updateDataSource(dataSourceKey, { validationStatus: 'invalid', validationMessage: 'Execution failed', lastTestedAt: new Date() });
    const safeError = new AppError(error.code === 'PROTOCOL_SEQUENCE_TIMEOUT' ? 'Dashboard query timed out' : 'Dashboard query could not be executed', error.code === 'PROTOCOL_SEQUENCE_TIMEOUT' ? 408 : 422);
    throw safeError;
  } finally {
    activeExecutions.count -= 1;
    if (connection) connection.release();
  }
}

module.exports = { scanSql, validateReadOnlySql, bindParameters, discoverViews, describeView, executeDataSource, cacheKey, invalidateDataSourceCache };
