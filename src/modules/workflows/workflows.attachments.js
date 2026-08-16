const crypto = require('crypto');
const path = require('path');
const net = require('net');
const { AppError } = require('../../shared/errors');

const safeMimeTypes = new Set([
  'application/pdf', 'image/jpeg', 'image/png', 'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]);

function attachmentError(message, code, details = {}) {
  return new AppError(message, 422, { code, ...details });
}

function cleanFileName(value) {
  return path.basename(String(value || 'attachment')).replace(/[\x00-\x1f<>:"/\\|?*]+/g, '_').slice(0, 255);
}

function policyAllows(policy, purpose) {
  return !policy?.actions?.length || policy.actions.includes(purpose);
}

function validateFiles(files = [], policy = {}, purpose) {
  const mode = policy.mode || 'disabled';
  const applicable = policyAllows(policy, purpose);
  if ((!applicable || mode === 'disabled') && files.length) throw attachmentError('Attachments are not enabled for this workflow action.', 'WORKFLOW_ATTACHMENT_DISABLED', { purpose });
  if (applicable && mode === 'required' && !files.length) throw attachmentError('At least one attachment is required for this workflow action.', 'WORKFLOW_ATTACHMENT_REQUIRED', { purpose });
  if (!files.length) return [];
  const maxFileCount = Number(policy.maxFileCount || 1);
  const maxFileSize = Number(policy.maxFileSize || 5 * 1024 * 1024);
  if (files.length > maxFileCount) throw attachmentError(`A maximum of ${maxFileCount} attachment(s) is allowed.`, 'WORKFLOW_ATTACHMENT_COUNT_EXCEEDED');
  const allowedTypes = new Set((policy.allowedTypes || []).length ? policy.allowedTypes : [...safeMimeTypes]);
  return files.map((file) => {
    const contentType = String(file.mimetype || file.contentType || '').toLowerCase();
    const data = Buffer.isBuffer(file.buffer) ? file.buffer : Buffer.from(file.data || '');
    if (!safeMimeTypes.has(contentType) || !allowedTypes.has(contentType)) throw attachmentError(`File type ${contentType || 'unknown'} is not allowed.`, 'WORKFLOW_ATTACHMENT_TYPE_DENIED', { contentType });
    if (!data.length || data.length > maxFileSize) throw attachmentError(`Attachment size must be between 1 byte and ${maxFileSize} bytes.`, 'WORKFLOW_ATTACHMENT_SIZE_EXCEEDED', { fileSize: data.length });
    return { purpose, fileName: cleanFileName(file.originalname || file.fileName), contentType, fileSize: data.length,
      storageKey: `workflow/${crypto.randomUUID()}`, checksum: crypto.createHash('sha256').update(data).digest('hex'), data };
  });
}

function scanWithClamAv(data, options = {}) {
  const host = options.host || process.env.WORKFLOW_CLAMAV_HOST || '127.0.0.1';
  const port = Number(options.port || process.env.WORKFLOW_CLAMAV_PORT || 3310);
  const timeoutMs = Number(options.timeoutMs || process.env.WORKFLOW_CLAMAV_TIMEOUT_MS || 15000);
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const chunks = [];
    socket.setTimeout(timeoutMs);
    socket.on('connect', () => {
      socket.write('zINSTREAM\0');
      for (let offset = 0; offset < data.length; offset += 65536) {
        const chunk = data.subarray(offset, offset + 65536);
        const length = Buffer.alloc(4); length.writeUInt32BE(chunk.length); socket.write(length); socket.write(chunk);
      }
      socket.end(Buffer.alloc(4));
    });
    socket.on('data', (chunk) => chunks.push(chunk));
    socket.on('timeout', () => socket.destroy(new Error('Malware scanner timed out')));
    socket.on('error', reject);
    socket.on('close', () => {
      const response = Buffer.concat(chunks).toString('utf8').replace(/\0/g, '').trim();
      if (/\bOK$/.test(response)) resolve({ status: 'clean', engine: 'clamav', result: response });
      else if (/FOUND$/.test(response)) resolve({ status: 'infected', engine: 'clamav', result: response });
      else reject(new Error(response || 'Malware scanner returned no result'));
    });
  });
}

async function validateAndScanFiles(files = [], policy = {}, purpose, options = {}) {
  const validated = validateFiles(files, policy, purpose);
  if (!policy.malwareScanRequired) return validated.map((file) => ({ ...file, scanStatus: 'not_required', scanEngine: null, scanResult: null, scannedAt: null }));
  const scan = options.scan || scanWithClamAv;
  const results = [];
  for (const file of validated) {
    let verdict;
    try { verdict = await scan(file.data, options); }
    catch (error) { throw attachmentError('Attachment remains quarantined because malware scanning is unavailable.', 'WORKFLOW_ATTACHMENT_SCAN_UNAVAILABLE', { reason: error.message }); }
    if (verdict.status !== 'clean') throw attachmentError('Attachment was quarantined because malware was detected.', 'WORKFLOW_ATTACHMENT_INFECTED', { result: verdict.result });
    results.push({ ...file, scanStatus: 'clean', scanEngine: verdict.engine || 'configured', scanResult: verdict.result || 'OK', scannedAt: new Date() });
  }
  return results;
}

function submissionPolicy(version) {
  return version?.snapshot?.builderGraph?.nodes?.find((node) => node.type === 'start')?.attachmentPolicy || { mode: 'disabled' };
}

module.exports = { cleanFileName, policyAllows, safeMimeTypes, scanWithClamAv, submissionPolicy, validateAndScanFiles, validateFiles };
