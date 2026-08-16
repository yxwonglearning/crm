const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { pool } = require('../../database/pool');
const { config } = require('../../shared/config');
const { AppError } = require('../../shared/errors');

const key = crypto.createHash('sha256').update(config.emailSettingsEncryptionKey).digest();
function encrypt(value) { if (!value) return null; const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', key, iv); const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]); return `${iv.toString('base64')}.${cipher.getAuthTag().toString('base64')}.${encrypted.toString('base64')}`; }
function decrypt(value) { if (!value) return ''; const [iv, tag, data] = value.split('.').map((part) => Buffer.from(part, 'base64')); const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv); decipher.setAuthTag(tag); return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8'); }
function parse(value, fallback = {}) { if (!value) return fallback; if (typeof value === 'object') return value; try { return JSON.parse(value); } catch (_error) { return fallback; } }

function publicSettings(row) {
  if (!row) return { configured: false, enabled: false, provider: 'gmail', settings: {}, hasSecret: false, status: 'untested' };
  return { configured: Boolean(row.sender_email && row.secret_ciphertext), enabled: Boolean(row.is_enabled), provider: row.provider,
    senderName: row.sender_name || '', senderEmail: row.sender_email || '', replyTo: row.reply_to || '', settings: parse(row.settings_json),
    hasSecret: Boolean(row.secret_ciphertext), status: row.last_test_status, statusMessage: row.last_test_message || '', lastTestedAt: row.last_tested_at, updatedAt: row.updated_at };
}

async function row() { const [rows] = await pool.execute('SELECT * FROM crm_email_settings WHERE id = 1 LIMIT 1'); return rows[0] || null; }
async function get() { return publicSettings(await row()); }
async function save(input, userId) {
  const existing = await row(); const secret = input.secret ? encrypt(input.secret) : existing?.secret_ciphertext || null;
  await pool.execute(`INSERT INTO crm_email_settings (id, provider, is_enabled, sender_name, sender_email, reply_to, settings_json, secret_ciphertext, updated_by)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE provider=VALUES(provider), is_enabled=VALUES(is_enabled), sender_name=VALUES(sender_name),
    sender_email=VALUES(sender_email), reply_to=VALUES(reply_to), settings_json=VALUES(settings_json), secret_ciphertext=VALUES(secret_ciphertext), updated_by=VALUES(updated_by), last_test_status='untested'`,
  [input.provider, input.enabled ? 1 : 0, input.senderName || null, input.senderEmail || null, input.replyTo || null, JSON.stringify(input.settings || {}), secret, userId]);
  return get();
}

function transport(settingsRow) {
  const settings = parse(settingsRow.settings_json); const provider = settingsRow.provider;
  const defaults = provider === 'gmail' ? { host: 'smtp.gmail.com', port: 587, secure: false } : provider === 'google_workspace' ? { host: 'smtp-relay.gmail.com', port: 587, secure: false } : {};
  const host = settings.host || defaults.host; const port = Number(settings.port || defaults.port || 587); if (!host) throw new AppError('SMTP host is required', 422);
  return nodemailer.createTransport({ host, port, secure: settings.security === 'ssl' || port === 465, requireTLS: settings.security !== 'none' && port !== 465,
    auth: settingsRow.sender_email && settingsRow.secret_ciphertext ? { user: settings.username || settingsRow.sender_email, pass: decrypt(settingsRow.secret_ciphertext) } : undefined });
}

async function send(message, options = {}) {
  const settingsRow = await row(); if (!settingsRow || (!settingsRow.is_enabled && !options.force)) return { skipped: true, reason: 'EMAIL_PROVIDER_DISABLED' };
  if (settingsRow.provider === 'microsoft_365') {
    const settings = parse(settingsRow.settings_json); if (!settings.tenantId || !settings.clientId || !settingsRow.secret_ciphertext || !settingsRow.sender_email) throw new AppError('Microsoft 365 needs Tenant ID, Client ID, Client Secret, and sender mailbox.', 422);
    const tokenBody = new URLSearchParams({ client_id: settings.clientId, client_secret: decrypt(settingsRow.secret_ciphertext), scope: 'https://graph.microsoft.com/.default', grant_type: 'client_credentials' });
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(settings.tenantId)}/oauth2/v2.0/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: tokenBody });
    const token = await tokenResponse.json(); if (!tokenResponse.ok || !token.access_token) throw new Error(token.error_description || 'Microsoft 365 authentication failed');
    const mailResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(settingsRow.sender_email)}/sendMail`, { method: 'POST', headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: { subject: message.subject,
      body: { contentType: message.html ? 'HTML' : 'Text', content: message.html || message.text || '' }, toRecipients: [{ emailAddress: { address: message.to } }], ...(settingsRow.reply_to ? { replyTo: [{ emailAddress: { address: settingsRow.reply_to } }] } : {}) } }) });
    if (!mailResponse.ok) throw new Error(`Microsoft Graph rejected the email (${mailResponse.status})`); return { skipped: false, messageId: `graph:${Date.now()}` };
  }
  const info = await transport(settingsRow).sendMail({ from: { name: settingsRow.sender_name || config.appName, address: settingsRow.sender_email }, replyTo: settingsRow.reply_to || undefined,
    to: message.to, subject: message.subject, text: message.text, html: message.html });
  return { skipped: false, messageId: info.messageId };
}

async function sendWorkflowOnce(sourceEventKey, requestKey, message) {
  try { await pool.execute('INSERT INTO crm_email_deliveries (source_event_key, request_key, recipient_email) VALUES (?, ?, ?)', [sourceEventKey, requestKey || null, message.to]); }
  catch (error) { if (error.code !== 'ER_DUP_ENTRY') throw error; const [rows] = await pool.execute('SELECT delivery_status FROM crm_email_deliveries WHERE source_event_key = ? AND recipient_email = ? LIMIT 1', [sourceEventKey, message.to]); if (rows[0]?.delivery_status === 'sent') return { skipped: true, reason: 'EMAIL_ALREADY_SENT' }; }
  try { const result = await send(message); await pool.execute(`UPDATE crm_email_deliveries SET delivery_status = ?, attempt_count = attempt_count + 1,
      provider_message_id = ?, last_error_message = NULL, sent_at = IF(? = 'sent', CURRENT_TIMESTAMP, sent_at) WHERE source_event_key = ? AND recipient_email = ?`,
    [result.skipped ? 'skipped' : 'sent', result.messageId || null, result.skipped ? 'skipped' : 'sent', sourceEventKey, message.to]); return result;
  } catch (error) { await pool.execute("UPDATE crm_email_deliveries SET delivery_status='failed', attempt_count=attempt_count+1, last_error_message=? WHERE source_event_key=? AND recipient_email=?", [String(error.message).slice(0, 500), sourceEventKey, message.to]); throw error; }
}

async function test(input) {
  const settingsRow = await row(); if (!settingsRow) throw new AppError('Save Email Settings before sending a test.', 422);
  try { const result = await send({ to: input.to, subject: `${config.appName} email test`, text: 'Email delivery is configured correctly.' }, { force: true }); if (result.skipped) throw new Error('Email provider is not configured');
    await pool.execute("UPDATE crm_email_settings SET last_test_status='ready', last_test_message='Test email sent', last_tested_at=CURRENT_TIMESTAMP WHERE id=1"); return { ok: true };
  } catch (error) { await pool.execute("UPDATE crm_email_settings SET last_test_status='failed', last_test_message=?, last_tested_at=CURRENT_TIMESTAMP WHERE id=1", [String(error.message).slice(0, 500)]); throw new AppError(`Test email failed: ${error.message}`, 422); }
}

module.exports = { get, save, send, sendWorkflowOnce, test, encrypt, decrypt };
