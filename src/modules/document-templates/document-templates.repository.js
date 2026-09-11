const { pool } = require('../../database/pool');
const { AppError } = require('../../shared/errors');
const crypto = require('node:crypto');
function entry(row) {
  return row ? { template: typeof row.definition === 'string' ? JSON.parse(row.definition) : row.definition, revision: Number(row.revision), hasSourcePdf: Boolean(row.has_source_pdf) } : null;
}
async function find(key) {
  const [rows] = await pool.execute('SELECT definition, revision, source_pdf IS NOT NULL AS has_source_pdf FROM crm_document_templates WHERE template_key = ?', [key]);
  return entry(rows[0]);
}
async function list() {
  const [rows] = await pool.execute('SELECT definition, revision, source_pdf IS NOT NULL AS has_source_pdf FROM crm_document_templates ORDER BY updated_at DESC LIMIT 500');
  return rows.map(entry);
}
async function save(template, revision, user) {
  if (revision) {
    const [result] = await pool.execute('UPDATE crm_document_templates SET definition = ?, revision = revision + 1, updated_by = ? WHERE template_key = ? AND revision = ?', [JSON.stringify(template), user.id, template.templateKey, revision]);
    if (!result.affectedRows) throw new AppError('Template changed on the server. Reload before saving.', 409);
  } else {
    try { await pool.execute('INSERT INTO crm_document_templates (template_key, definition, updated_by) VALUES (?, ?, ?)', [template.templateKey, JSON.stringify(template), user.id]); }
    catch (error) { if (error.code === 'ER_DUP_ENTRY') throw new AppError('Template already exists on the server. Reload before saving.', 409); throw error; }
  }
  return { template, revision: (revision || 0) + 1 };
}
async function saveSourcePdf(templateKey, file) {
  const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');
  const [result] = await pool.execute('UPDATE crm_document_templates SET source_pdf = ?, source_pdf_name = ?, source_pdf_checksum = ? WHERE template_key = ?', [file.buffer, String(file.originalname || 'source.pdf').slice(0, 255), checksum, templateKey]);
  if (!result.affectedRows) throw new AppError('Save the imported template before storing its source PDF.', 404);
  return { hasSourcePdf: true, checksum };
}
async function findSourcePdf(templateKey) {
  const [rows] = await pool.execute('SELECT source_pdf, source_pdf_name, source_pdf_checksum FROM crm_document_templates WHERE template_key = ? AND source_pdf IS NOT NULL', [templateKey]);
  return rows[0] ? { data: rows[0].source_pdf, name: rows[0].source_pdf_name, checksum: rows[0].source_pdf_checksum } : null;
}
module.exports = { find, list, save, saveSourcePdf, findSourcePdf };
