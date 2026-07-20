const dns = require('dns').promises;
const net = require('net');
const crypto = require('crypto');
const { AppError } = require('../../shared/errors');
const moduleConfig = require('../sysadmin/module-config.service');
const moduleRecords = require('../module-records/module-records.repository');
const repository = require('./action-flows.repository');

const REST_TIMEOUT_MS = 15000;
const REST_MAX_RESPONSE_BYTES = 1024 * 1024;
const oauth2TokenCache = new Map();

function recordValues(record = {}) {
  return {
    id: record.id,
    ...(record.customFields || record.custom_fields || {})
  };
}

function valueAtPath(source, path) {
  const parts = String(path || '').split('.').filter(Boolean);
  let value = source;
  for (const part of parts) {
    if (value === null || value === undefined) return '';
    value = value[part];
  }
  return value ?? '';
}

function setValueAtPath(target, path, value) {
  const parts = String(path || '').split('.').filter(Boolean);
  if (!parts.length) return;
  let cursor = target;
  parts.slice(0, -1).forEach((part) => {
    if (!cursor[part] || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) {
      cursor[part] = {};
    }
    cursor = cursor[part];
  });
  cursor[parts[parts.length - 1]] = value;
}

function resolveToken(rawValue, context) {
  const value = String(rawValue || '').trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  if (/^current record\./i.test(value)) {
    return valueAtPath(context.currentRecord, value.replace(/^current record\./i, ''));
  }
  if (/^trigger\./i.test(value)) {
    return valueAtPath(context.trigger, value.replace(/^trigger\./i, ''));
  }
  if (/^outputs\./i.test(value)) {
    return valueAtPath(context.outputs, value.replace(/^outputs\./i, ''));
  }
  return value;
}

function resolveRestMappingSource(rawValue, source) {
  const value = String(rawValue || '').trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  if (/^response\./i.test(value)) {
    return valueAtPath(source.responseBody, value.replace(/^response\./i, ''));
  }
  if (/^(body|responseBody)\./i.test(value)) {
    return valueAtPath(source.responseBody, value.replace(/^(body|responseBody)\./i, ''));
  }
  if (/^(header|headers|responseHeaders)\./i.test(value)) {
    return valueAtPath(source.responseHeaders, value.replace(/^(header|headers|responseHeaders)\./i, '').toLowerCase());
  }
  return valueAtPath(source, value);
}

function parseMappingText(text = '', context) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((mapping, line) => {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex <= 0) return mapping;
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (key) mapping[key] = resolveToken(value, context);
      return mapping;
    }, {});
}

function parseRestMappingText(text = '', source = {}) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((mapping, line) => {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex <= 0) return mapping;
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (key) setValueAtPath(mapping, key, resolveRestMappingSource(value, source));
      return mapping;
    }, {});
}

function parseHeaderText(text = '', context) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((headers, line) => {
      const separatorIndex = line.indexOf(':') > -1 ? line.indexOf(':') : line.indexOf('=');
      if (separatorIndex <= 0) return headers;
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (key) headers[key] = String(resolveToken(value, context));
      return headers;
    }, {});
}

function isPrivateIp(address) {
  if (!address) return true;
  if (net.isIPv4(address)) {
    const parts = address.split('.').map(Number);
    return (
      parts[0] === 10
      || parts[0] === 127
      || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
      || (parts[0] === 192 && parts[1] === 168)
      || (parts[0] === 169 && parts[1] === 254)
      || address === '0.0.0.0'
    );
  }
  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase();
    return (
      normalized === '::1'
      || normalized === '::'
      || normalized.startsWith('fc')
      || normalized.startsWith('fd')
      || normalized.startsWith('fe80:')
    );
  }
  return true;
}

async function assertRestUrlAllowed(url, allowPrivateNetwork) {
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new AppError('REST connector URL must use http or https', 422);
  }
  if (allowPrivateNetwork) return;
  const addresses = await dns.lookup(url.hostname, { all: true });
  if (addresses.some((item) => isPrivateIp(item.address))) {
    throw new AppError('REST connector blocked private or internal network target', 422);
  }
}

function joinUrl(baseUrl, endpointPath) {
  const base = String(baseUrl || '').trim();
  const path = String(endpointPath || '').trim();
  if (!base) throw new AppError('REST connector base URL is required', 422);
  if (/^https?:\/\//i.test(path)) return new URL(path);
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = path.replace(/^\/+/, '');
  return new URL(normalizedPath, normalizedBase);
}

function endpointForNode(connector, nodeConfig) {
  return (connector.endpoints || []).find((item) => (
    item.key === nodeConfig.endpointKey
    || item.path === nodeConfig.endpointPath
  )) || {};
}

function connectorTimeout(connector, nodeConfig) {
  const connection = connector.authConfig?.connection || {};
  const seconds = Number(nodeConfig.timeoutSeconds || connection.responseTimeout || connection.connectionTimeout || 0);
  return Math.min(Math.max(seconds > 0 ? seconds * 1000 : REST_TIMEOUT_MS, 1000), 60000);
}

function authHeaders(connector) {
  const authConfig = connector.authConfig || {};
  const authType = connector.authType || authConfig.authType || authConfig.connection?.authMethod || 'none';
  if (authType === 'bearer') {
    const token = authConfig.bearerToken || authConfig.token || authConfig.accessToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  if (authType === 'basic') {
    const username = authConfig.username || authConfig.basicUsername;
    const password = authConfig.password || authConfig.basicPassword;
    return username || password
      ? { Authorization: `Basic ${Buffer.from(`${username || ''}:${password || ''}`).toString('base64')}` }
      : {};
  }
  if (authType === 'api_key') {
    const name = authConfig.apiKeyName || authConfig.headerName || 'X-API-Key';
    const value = authConfig.apiKeyValue || authConfig.apiKey || '';
    const location = authConfig.apiKeyLocation || 'header';
    return value && location === 'header' ? { [name]: value } : {};
  }
  return {};
}

function applyApiKeyQuery(url, connector) {
  const authConfig = connector.authConfig || {};
  const authType = connector.authType || authConfig.authType || authConfig.connection?.authMethod || 'none';
  if (authType !== 'api_key' || authConfig.apiKeyLocation !== 'query') return;
  const name = authConfig.apiKeyName || 'api_key';
  const value = authConfig.apiKeyValue || authConfig.apiKey || '';
  if (value) url.searchParams.set(name, value);
}

function connectorAuthType(connector) {
  const config = connector.authConfig || {};
  const type = connector.authType || config.authType || config.connection?.authMethod || 'none';
  return type === 'oauth' ? 'oauth2' : type;
}

function oauthEncode(value) {
  return encodeURIComponent(String(value ?? '')).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

function oauth1Authorization(connector, method, url, body, headers) {
  const config = connector.authConfig || {};
  if (!config.consumerKey || !config.consumerSecret) throw new AppError('OAuth 1.0 requires a Consumer Key and Consumer Secret', 422);
  const signatureMethod = config.signatureMethod === 'HMAC-SHA256' ? 'HMAC-SHA256' : 'HMAC-SHA1';
  const oauth = {
    oauth_consumer_key: config.consumerKey,
    oauth_nonce: crypto.randomBytes(18).toString('hex'),
    oauth_signature_method: signatureMethod,
    oauth_timestamp: Math.floor(Date.now() / 1000),
    oauth_version: '1.0'
  };
  if (config.accessToken) oauth.oauth_token = config.accessToken;
  const parameters = [...url.searchParams.entries(), ...Object.entries(oauth)];
  const contentType = String(headers['Content-Type'] || headers['content-type'] || '').toLowerCase();
  if (contentType.includes('application/x-www-form-urlencoded') && typeof body === 'string') {
    parameters.push(...new URLSearchParams(body).entries());
  }
  const normalized = parameters
    .map(([key, value]) => [oauthEncode(key), oauthEncode(value)])
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => leftKey.localeCompare(rightKey) || leftValue.localeCompare(rightValue))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  const baseUrl = `${url.protocol}//${url.host}${url.pathname}`;
  const signatureBase = [method.toUpperCase(), oauthEncode(baseUrl), oauthEncode(normalized)].join('&');
  const signingKey = `${oauthEncode(config.consumerSecret)}&${oauthEncode(config.tokenSecret || '')}`;
  oauth.oauth_signature = crypto
    .createHmac(signatureMethod === 'HMAC-SHA256' ? 'sha256' : 'sha1', signingKey)
    .update(signatureBase)
    .digest('base64');
  const values = Object.entries(oauth).map(([key, value]) => `${oauthEncode(key)}="${oauthEncode(value)}"`);
  if (config.realm) values.unshift(`realm="${oauthEncode(config.realm)}"`);
  return `OAuth ${values.join(', ')}`;
}

async function oauth2AccessToken(connector, allowPrivateNetwork) {
  const config = connector.authConfig || {};
  if (config.accessToken) return config.accessToken;
  if ((config.grantType || 'client_credentials') !== 'client_credentials') {
    throw new AppError('OAuth 2.0 Debug currently supports Client Credentials. Authorization Code, Password, and Refresh Token require their additional grant values.', 422);
  }
  if (!config.accessTokenUrl || !config.clientId || !config.clientSecret) {
    throw new AppError('OAuth 2.0 requires an Access Token URL, Client ID, and Client Secret', 422);
  }
  const cacheIdentity = crypto.createHash('sha256').update(JSON.stringify({
    accessTokenUrl: config.accessTokenUrl,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    scope: config.scope || '',
    clientAuthentication: config.clientAuthentication || 'basic'
  })).digest('hex');
  const cacheKey = `${connector.connectorKey}:${cacheIdentity}`;
  const cached = oauth2TokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 30000) return cached.token;
  const tokenUrl = new URL(config.accessTokenUrl);
  await assertRestUrlAllowed(tokenUrl, allowPrivateNetwork);
  const tokenBody = new URLSearchParams({ grant_type: 'client_credentials' });
  if (config.scope) tokenBody.set('scope', config.scope);
  const tokenHeaders = { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' };
  if (config.clientAuthentication === 'body') {
    tokenBody.set('client_id', config.clientId);
    tokenBody.set('client_secret', config.clientSecret);
  } else {
    tokenHeaders.Authorization = `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`;
  }
  let response;
  try {
    response = await fetch(tokenUrl, {
      method: 'POST',
      headers: tokenHeaders,
      body: tokenBody.toString(),
      signal: AbortSignal.timeout(connectorTimeout(connector, {}))
    });
  } catch (error) {
    throw new AppError(`OAuth 2.0 token request failed: ${error.message}`, 502);
  }
  const text = await response.text();
  let payload;
  try { payload = JSON.parse(text); } catch (_error) { payload = {}; }
  if (!response.ok || !payload.access_token) {
    const detail = payload.error_description || payload.error || text || `HTTP ${response.status}`;
    throw new AppError(`OAuth 2.0 token request was rejected: ${String(detail).slice(0, 300)}`, 502);
  }
  const token = String(payload.access_token);
  const expiresIn = Math.max(Number(payload.expires_in || 3600), 60);
  oauth2TokenCache.set(cacheKey, { token, expiresAt: Date.now() + expiresIn * 1000 });
  return token;
}

async function applyConnectorAuthentication(connector, method, url, headers, body, allowPrivateNetwork) {
  const type = connectorAuthType(connector);
  if (type === 'api_key') {
    applyApiKeyQuery(url, connector);
    Object.assign(headers, authHeaders(connector));
  } else if (type === 'basic' || type === 'bearer') {
    Object.assign(headers, authHeaders(connector));
  } else if (type === 'oauth1') {
    headers.Authorization = oauth1Authorization(connector, method, url, body, headers);
  } else if (type === 'oauth2') {
    const config = connector.authConfig || {};
    const token = await oauth2AccessToken(connector, allowPrivateNetwork);
    if (config.authorizationLocation === 'query') url.searchParams.set(config.tokenName || 'access_token', token);
    else headers.Authorization = `${config.headerPrefix || 'Bearer'} ${token}`.trim();
  }
}

function parseRestBody(endpoint, nodeConfig, context) {
  const mapping = parseMappingText(nodeConfig.requestMapping, context);
  if (Object.keys(mapping).length) return mapping;
  const content = endpoint.testBody?.content || nodeConfig.requestBodyText || '';
  if (!String(content || '').trim()) return null;
  if ((endpoint.testBody?.format || nodeConfig.requestBodyFormat || 'json') === 'json') {
    try {
      return JSON.parse(content);
    } catch (_error) {
      return content;
    }
  }
  return content;
}

function parseResponseBody(text, contentType) {
  if (!text) return null;
  if (String(contentType || '').includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch (_error) {
      return text;
    }
  }
  return text;
}

function xmlEscape(value) {
  return String(value ?? '').replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
  }[character]));
}

function objectToXml(value, rootName = 'request') {
  const render = (name, item) => {
    if (Array.isArray(item)) return item.map((entry) => render(name, entry)).join('');
    if (item && typeof item === 'object') {
      return `<${name}>${Object.entries(item).map(([key, entry]) => render(key, entry)).join('')}</${name}>`;
    }
    return `<${name}>${xmlEscape(item)}</${name}>`;
  };
  return render(rootName, value || {});
}

function debugRequestBody(request = {}, headers = {}) {
  const values = request.body || {};
  if (!Object.keys(values).length) return null;
  const format = String(request.bodyFormat || 'application/json').toLowerCase();
  if (format === 'none') return null;
  if (format.includes('json')) {
    if (!headers['Content-Type'] && !headers['content-type']) headers['Content-Type'] = 'application/json';
    return JSON.stringify(values);
  }
  if (format.includes('xml')) {
    if (!headers['Content-Type'] && !headers['content-type']) headers['Content-Type'] = 'application/xml';
    return objectToXml(values);
  }
  if (format.includes('x-www-form-urlencoded')) {
    if (!headers['Content-Type'] && !headers['content-type']) headers['Content-Type'] = 'application/x-www-form-urlencoded';
    return new URLSearchParams(Object.entries(values).map(([key, value]) => [key, String(value ?? '')])).toString();
  }
  if (format.includes('multipart/form-data')) {
    const form = new FormData();
    Object.entries(values).forEach(([key, value]) => form.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')));
    return form;
  }
  const text = Object.keys(values).length === 1 ? Object.values(values)[0] : JSON.stringify(values);
  if (!headers['Content-Type'] && !headers['content-type']) headers['Content-Type'] = format;
  return format.includes('octet-stream') ? Buffer.from(String(text ?? '')) : String(text ?? '');
}

function statusMatchesRule(status, rule) {
  const source = String(rule || '200-299').trim();
  return source.split(',').some((part) => {
    const value = part.trim();
    const range = value.match(/^(\d{3})\s*-\s*(\d{3})$/);
    if (range) return status >= Number(range[1]) && status <= Number(range[2]);
    return /^\d{3}$/.test(value) && status === Number(value);
  });
}

function redactedHeaders(headers = {}) {
  return Object.entries(headers).reduce((result, [key, value]) => {
    result[key] = /authorization|api[-_]?key|token|secret/i.test(key) ? '[redacted]' : value;
    return result;
  }, {});
}

function redactedRequestUrl(url, connector) {
  const safeUrl = new URL(url.toString());
  const config = connector.authConfig || {};
  if (connectorAuthType(connector) === 'api_key' && config.apiKeyLocation === 'query') {
    safeUrl.searchParams.set(config.apiKeyName || 'api_key', '[redacted]');
  }
  if (connectorAuthType(connector) === 'oauth2' && config.authorizationLocation === 'query') {
    safeUrl.searchParams.set(config.tokenName || 'access_token', '[redacted]');
  }
  return safeUrl.toString();
}

async function debugConnectorRequest(connector, endpoint = {}) {
  if (!connector || !connector.enabled) throw new AppError('API connector is missing or disabled', 422);
  const method = String(endpoint.method || 'GET').toUpperCase();
  const request = endpoint.interfaceConfig?.request || {};
  const outcome = endpoint.interfaceConfig?.outcome || {};
  const url = joinUrl(connector.baseUrl, endpoint.path);
  await assertRestUrlAllowed(url, Boolean(connector.authConfig?.runtime?.allowPrivateNetwork));
  Object.entries(request.params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  });
  const headers = { ...(connector.defaultHeaders || {}), ...(request.headers || {}) };
  let body = null;
  if (!['GET', 'HEAD'].includes(method)) {
    body = debugRequestBody(request, headers);
  }
  await applyConnectorAuthentication(connector, method, url, headers, body, Boolean(connector.authConfig?.runtime?.allowPrivateNetwork));
  const options = { method, headers, signal: AbortSignal.timeout(connectorTimeout(connector, {})) };
  if (body !== null) options.body = body;
  const startedAt = Date.now();
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    const timedOut = error.name === 'TimeoutError' || error.name === 'AbortError';
    throw new AppError(timedOut ? (outcome.timeoutMessage || 'The request timed out.') : (outcome.exceptionMessage || error.message || 'The request could not be completed.'), timedOut ? 504 : 502);
  }
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > REST_MAX_RESPONSE_BYTES) throw new AppError('API response exceeded the 1 MB test limit', 502);
  const { text, truncated } = await readResponseTextLimited(response);
  const responseHeaders = Object.fromEntries(response.headers.entries());
  return {
    request: { method, url: redactedRequestUrl(url, connector), headers: redactedHeaders(headers), bodyFormat: request.bodyFormat || 'application/json' },
    response: {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: parseResponseBody(text, response.headers.get('content-type') || ''),
      contentType: response.headers.get('content-type') || '',
      sizeBytes: Buffer.byteLength(text),
      truncated,
      durationMs: Date.now() - startedAt
    },
    outcome: {
      success: statusMatchesRule(response.status, outcome.successStatuses),
      rule: outcome.successStatuses || '200-299',
      message: statusMatchesRule(response.status, outcome.successStatuses) ? '' : (outcome.failureMessage || 'The response did not meet the success condition.')
    }
  };
}

async function readResponseTextLimited(response) {
  if (!response.body?.getReader) {
    const text = await response.text();
    return {
      text: text.slice(0, REST_MAX_RESPONSE_BYTES),
      truncated: text.length > REST_MAX_RESPONSE_BYTES
    };
  }
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  let truncated = false;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (total + value.length > REST_MAX_RESPONSE_BYTES) {
      chunks.push(value.slice(0, REST_MAX_RESPONSE_BYTES - total));
      truncated = true;
      break;
    }
    chunks.push(value);
    total += value.length;
  }
  if (truncated) {
    await reader.cancel().catch(() => {});
  }
  return {
    text: Buffer.concat(chunks).toString('utf8'),
    truncated
  };
}

function evaluateRestSuccess(successBasis, response) {
  const basis = String(successBasis || '').trim();
  if (!basis) return response.status >= 200 && response.status < 300;
  const match = basis.match(/^status\s*(=|==|!=|>=|<=|>|<)\s*(\d{3})$/i);
  if (!match) return response.status >= 200 && response.status < 300;
  const expected = Number(match[2]);
  if (match[1] === '=' || match[1] === '==') return response.status === expected;
  if (match[1] === '!=') return response.status !== expected;
  if (match[1] === '>=') return response.status >= expected;
  if (match[1] === '<=') return response.status <= expected;
  if (match[1] === '>') return response.status > expected;
  if (match[1] === '<') return response.status < expected;
  return false;
}

function flattenTopLevelMapping(mapping = {}) {
  return Object.entries(mapping || {}).reduce((flat, [key, value]) => {
    flat[key] = value;
    return flat;
  }, {});
}

async function applyRestRecordMapping(nodeConfig, context, mappedValues) {
  const targetModule = nodeConfig.targetModule || nodeConfig.appType || context.trigger.moduleKey;
  const targetId = nodeConfig.target === 'related_record'
    ? Number(resolveToken(nodeConfig.basisValueFormula, context))
    : context.trigger.recordId;
  if (!targetModule || !targetId || !mappedValues || !Object.keys(mappedValues).length) {
    return { targetModule, recordId: targetId || null, fields: [] };
  }

  const config = await assertRuntimeModule(targetModule);
  const mainFieldKeys = new Set((config.fields || [])
    .filter((field) => field.tableType !== 'detail')
    .map((field) => field.fieldKey));
  const recordFields = Object.entries(flattenTopLevelMapping(mappedValues))
    .filter(([fieldKey]) => mainFieldKeys.has(fieldKey))
    .reduce((fields, [fieldKey, value]) => {
      fields[fieldKey] = value;
      return fields;
    }, {});

  if (!Object.keys(recordFields).length) {
    return { targetModule, recordId: targetId, fields: [] };
  }

  const existing = await moduleRecords.findRecordById(targetModule, targetId);
  if (!existing) throw new AppError('REST mapping target record not found', 404);
  await moduleRecords.updateRecord(targetModule, targetId, {
    ...existing.customFields,
    ...recordFields
  }, context.trigger.userId || null);
  if (targetModule === context.trigger.moduleKey && Number(targetId) === Number(context.trigger.recordId)) {
    context.currentRecord = {
      ...context.currentRecord,
      ...recordFields
    };
  }
  return { targetModule, recordId: targetId, fields: Object.keys(recordFields) };
}

async function applyRestMappings(node, context, restResult) {
  const nodeConfig = node.config || {};
  const mappingSource = {
    ...restResult,
    response: restResult.responseBody,
    responseBody: restResult.responseBody,
    body: restResult.responseBody,
    responseHeaders: restResult.responseHeaders || {},
    headers: restResult.responseHeaders || {}
  };
  const mappingText = restResult.status === 'failed' || restResult.error
    ? nodeConfig.errorMapping
    : nodeConfig.responseMapping;
  const mappedValues = parseRestMappingText(mappingText, mappingSource);
  const recordMapping = await applyRestRecordMapping(nodeConfig, context, mappedValues);
  return {
    ...restResult,
    mappedValues,
    mappedRecordFields: recordMapping.fields,
    mappedRecordId: recordMapping.recordId,
    mappedRecordModule: recordMapping.targetModule
  };
}

async function executeRestAction(node, context) {
  const nodeConfig = node.config || {};
  const connector = await repository.findConnectorByKey(nodeConfig.connectorKey);
  if (!connector || !connector.enabled) throw new AppError('REST connector is missing or disabled', 422);
  const endpoint = endpointForNode(connector, nodeConfig);
  const endpointPath = nodeConfig.endpointPath || endpoint.path;
  const method = String(nodeConfig.method || endpoint.method || 'GET').toUpperCase();
  const url = joinUrl(connector.baseUrl, endpointPath);
  const requestValues = parseRestBody(endpoint, nodeConfig, context);
  const allowPrivateNetwork = Boolean(nodeConfig.allowPrivateNetwork || connector.authConfig?.runtime?.allowPrivateNetwork);
  await assertRestUrlAllowed(url, allowPrivateNetwork);

  if (['GET', 'DELETE'].includes(method) && requestValues && typeof requestValues === 'object' && !Array.isArray(requestValues)) {
    Object.entries(requestValues).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    });
  }

  const headers = {
    ...(connector.defaultHeaders || {}),
    ...parseHeaderText(nodeConfig.requestHeadersText, context)
  };
  let requestBody = null;
  if (!['GET', 'HEAD', 'DELETE'].includes(method) && requestValues !== null) {
    if (!headers['Content-Type'] && !headers['content-type'] && typeof requestValues === 'object') {
      headers['Content-Type'] = 'application/json';
    }
    requestBody = typeof requestValues === 'string' ? requestValues : JSON.stringify(requestValues);
  }
  await applyConnectorAuthentication(connector, method, url, headers, requestBody, allowPrivateNetwork);
  const fetchOptions = {
    method,
    headers,
    signal: AbortSignal.timeout(connectorTimeout(connector, nodeConfig))
  };
  if (requestBody !== null) fetchOptions.body = requestBody;

  const startedAt = Date.now();
  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (error) {
    const failedResult = {
      action: node.type,
      status: 'failed',
      connectorKey: connector.connectorKey,
      endpointKey: nodeConfig.endpointKey || endpoint.key || '',
      endpointPath: endpointPath || '',
      method,
      url: url.toString(),
      durationMs: Date.now() - startedAt,
      error: error.name === 'TimeoutError' ? 'REST request timed out' : (error.message || 'REST request failed')
    };
    return applyRestMappings(node, context, failedResult);
  }

  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > REST_MAX_RESPONSE_BYTES) {
    const failedResult = {
      action: node.type,
      status: 'failed',
      connectorKey: connector.connectorKey,
      endpointPath: endpointPath || '',
      method,
      url: url.toString(),
      httpStatus: response.status,
      durationMs: Date.now() - startedAt,
      error: 'REST response exceeded size limit'
    };
    return applyRestMappings(node, context, failedResult);
  }

  const { text, truncated } = await readResponseTextLimited(response);
  const responseBody = parseResponseBody(text, response.headers.get('content-type') || '');
  const restResult = {
    action: node.type,
    connectorKey: connector.connectorKey,
    endpointKey: nodeConfig.endpointKey || endpoint.key || '',
    endpointPath: endpointPath || '',
    method,
    url: url.toString(),
    httpStatus: response.status,
    ok: response.ok,
    durationMs: Date.now() - startedAt,
    responseHeaders: Object.fromEntries(response.headers.entries()),
    responseBody,
    responseTruncated: truncated
  };
  const success = evaluateRestSuccess(connector.authConfig?.successBasis || nodeConfig.successBasis, response);
  const mappedResult = await applyRestMappings(
    node,
    context,
    success ? restResult : { ...restResult, status: 'failed', error: `REST request returned HTTP ${response.status}` }
  );
  context.outputs[node.id] = mappedResult;
  return mappedResult;
}

function compareValues(left, operator, right) {
  const leftText = String(left ?? '').toLowerCase();
  const rightText = String(right ?? '').toLowerCase();
  if (['=', '==', 'equals', 'is'].includes(operator)) return leftText === rightText;
  if (['!=', '<>', 'not_equals', 'is_not'].includes(operator)) return leftText !== rightText;
  if (operator === 'contains') return leftText.includes(rightText);
  if (operator === 'starts_with') return leftText.startsWith(rightText);
  if (operator === 'ends_with') return leftText.endsWith(rightText);
  if (operator === 'empty') return leftText.trim() === '';
  if (operator === 'not_empty') return leftText.trim() !== '';
  if (operator === 'greater_than') return Number(left) > Number(right);
  if (operator === 'less_than') return Number(left) < Number(right);
  return false;
}

function evaluateCondition(condition = '', context) {
  const text = String(condition || '').trim();
  if (!text) return true;
  const match = text.match(/^(.+?)\s+(equals|is|not_equals|is_not|contains|starts_with|ends_with|empty|not_empty|greater_than|less_than|=|==|!=|<>)\s*(.*)$/i);
  if (!match) return false;
  const left = resolveToken(match[1], context);
  const operator = match[2].toLowerCase();
  const right = resolveToken(match[3], context);
  return compareValues(left, operator, right);
}

function nextNode(definition, nodeId) {
  const edge = (definition.edges || []).find((item) => item.from === nodeId && item.kind !== 'loop_body');
  if (!edge) return null;
  return (definition.nodes || []).find((node) => node.id === edge.to) || null;
}

function triggerNode(definition) {
  return (definition.nodes || []).find((node) => node.category === 'trigger') || null;
}

async function assertRuntimeModule(moduleKey) {
  const config = await moduleConfig.getModuleConfig(moduleKey);
  if (!config?.module || config.module.system || config.module.status !== 'published') {
    throw new AppError('Action Flow runtime only supports published custom modules in this slice', 422);
  }
  return config;
}

async function executeRecordAction(node, context) {
  const config = node.config || {};
  const targetModule = config.targetModule || config.appType || context.trigger.moduleKey;
  await assertRuntimeModule(targetModule);

  if (node.type === 'add_record') {
    const customFields = parseMappingText(config.fieldMappingText, context);
    const id = await moduleRecords.createRecord(targetModule, customFields, context.trigger.userId || null);
    return { action: node.type, targetModule, recordId: id };
  }

  if (node.type === 'update_record' || node.type === 'assign_owner' || node.type === 'change_status') {
    const targetId = config.target === 'current_record' ? context.trigger.recordId : Number(resolveToken(config.basisValueFormula, context));
    if (!targetId) throw new AppError('Update action needs a target record id', 422);
    const existing = await moduleRecords.findRecordById(targetModule, targetId);
    if (!existing) throw new AppError('Target record not found', 404);
    const mappedFields = parseMappingText(config.fieldMappingText, context);
    if (node.type === 'assign_owner' && config.operatorValue) {
      mappedFields.ownerUserId = resolveToken(config.operatorValue, context);
    }
    if (node.type === 'change_status' && config.basisValueFormula) {
      mappedFields.status = resolveToken(config.basisValueFormula, context);
    }
    await moduleRecords.updateRecord(targetModule, targetId, {
      ...existing.customFields,
      ...mappedFields
    }, context.trigger.userId || null);
    return { action: node.type, targetModule, recordId: targetId, fields: Object.keys(mappedFields) };
  }

  if (node.type === 'delete_record') {
    if (!config.confirmDelete) throw new AppError('Delete action needs confirmation enabled', 422);
    const targetId = config.target === 'current_record' ? context.trigger.recordId : Number(resolveToken(config.basisValueFormula, context));
    if (!targetId) throw new AppError('Delete action needs a target record id', 422);
    const deletedCount = await moduleRecords.deleteRecords(targetModule, [targetId]);
    return { action: node.type, targetModule, recordId: targetId, deletedCount };
  }

  return { action: node.type, skipped: true, reason: 'Record action is not implemented in runtime yet' };
}

async function executeNode(node, context) {
  if (node.category === 'record') return executeRecordAction(node, context);
  if (node.type === 'condition') {
    const matched = evaluateCondition(node.config?.condition, context);
    return { action: node.type, matched, skipped: !matched };
  }
  if (node.type === 'call_rest_api') return executeRestAction(node, context);
  if (node.category === 'end') return { action: node.type };
  return { action: node.type, skipped: true, reason: 'Action type is not implemented in runtime yet' };
}

async function executeFlow(flow, trigger) {
  const executionId = await repository.createExecution(flow, trigger);
  const definition = flow.definition || {};
  const start = triggerNode(definition);
  const steps = [];
  const executionStartedAt = new Date();
  const context = {
    trigger,
    currentRecord: recordValues(trigger.record),
    outputs: {}
  };

  try {
    let node = start ? nextNode(definition, start.id) : null;
    const visited = new Set();
    while (node && !visited.has(node.id)) {
      visited.add(node.id);
      const stepStartedAt = new Date();
      let result;
      let stepFinishedAt;
      try {
        result = await executeNode(node, context);
        stepFinishedAt = new Date();
      } catch (error) {
        stepFinishedAt = new Date();
        steps.push({
          nodeId: node.id,
          label: node.label || node.type,
          category: node.category || '',
          type: node.type,
          status: 'failed',
          startedAt: stepStartedAt.toISOString(),
          finishedAt: stepFinishedAt.toISOString(),
          durationMs: stepFinishedAt.getTime() - stepStartedAt.getTime(),
          error: error.message || 'Action Flow step failed'
        });
        throw error;
      }
      steps.push({
        nodeId: node.id,
        label: node.label || node.type,
        category: node.category || '',
        type: node.type,
        status: result.skipped ? 'skipped' : 'success',
        startedAt: stepStartedAt.toISOString(),
        finishedAt: stepFinishedAt.toISOString(),
        durationMs: stepFinishedAt.getTime() - stepStartedAt.getTime(),
        ...result
      });
      context.outputs[node.id] = result;
      if (result.status === 'failed') break;
      if (result.skipped && node.type === 'condition') break;
      if (node.category === 'end') break;
      node = nextNode(definition, node.id);
    }
    const status = steps.some((step) => step.status === 'failed')
      ? 'failed'
      : (steps.some((step) => step.reason?.includes('not enabled yet')) ? 'skipped' : 'success');
    await repository.finishExecution(executionId, status, {
      flowKey: flow.flowKey,
      flowName: flow.name,
      triggerType: trigger.triggerType,
      moduleKey: trigger.moduleKey,
      recordId: trigger.recordId,
      startedAt: executionStartedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      steps
    });
    return { executionId, status, steps };
  } catch (error) {
    await repository.finishExecution(executionId, 'failed', {
      flowKey: flow.flowKey,
      flowName: flow.name,
      triggerType: trigger.triggerType,
      moduleKey: trigger.moduleKey,
      recordId: trigger.recordId,
      startedAt: executionStartedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      steps,
      error: error.message || 'Action Flow execution failed'
    });
    throw error;
  }
}

async function runRecordTrigger(triggerType, payload) {
  const trigger = {
    triggerType,
    moduleKey: payload.moduleKey,
    recordId: payload.recordId,
    record: payload.record,
    previousRecord: payload.previousRecord || null,
    userId: payload.userId || null
  };
  const flows = await repository.listEnabledFlowsForTrigger(triggerType, payload.moduleKey);
  const results = [];
  for (const flow of flows) {
    try {
      results.push(await executeFlow(flow, trigger));
    } catch (error) {
      results.push({ flowKey: flow.flowKey, status: 'failed', error: error.message });
    }
  }
  return results;
}

module.exports = {
  runRecordTrigger,
  debugConnectorRequest
};
