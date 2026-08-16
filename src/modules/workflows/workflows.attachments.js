const crypto = require('crypto');
const path = require('path');
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

function submissionPolicy(version) {
  return version?.snapshot?.builderGraph?.nodes?.find((node) => node.type === 'start')?.attachmentPolicy || { mode: 'disabled' };
}

module.exports = { cleanFileName, policyAllows, safeMimeTypes, submissionPolicy, validateFiles };
