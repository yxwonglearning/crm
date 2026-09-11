const assert = require('node:assert/strict');
const express = require('express');
const { fixture } = require('./document-pdf-smoke');
const { pdfFixture, imagePdfFixture, multiPagePdfFixture } = require('./document-pdf-import-smoke');
const { AppError, errorHandler } = require('../../src/shared/errors');
const { pool } = require('../../src/database/pool');
const auth = require('../../src/modules/auth/auth.middleware');
const repo = require('../../src/modules/document-templates/document-templates.repository');
const renderer = require('../../src/modules/document-templates/document-templates.renderer');
const permissions = require('../../src/modules/permissions/permissions.service');
const source = require('../../src/modules/workflows/workflows.source-records');
const config = require('../../src/modules/sysadmin/module-config.service');
const departments = require('../../src/modules/departments/departments.repository');
const access = require('../../src/modules/workflows/workflows.access');

// Isolated HTTP fixture: production token authentication is not replaced in the app.
const originalAuth = auth.requireAuth;
auth.requireAuth = (req, res, next) => {
  if (!['admin', 'viewer'].includes(req.headers['x-test-role'])) return res.status(401).json({ error: 'Authentication required' });
  req.user = { id: req.headers['x-test-role'] === 'admin' ? 1 : 2, role: req.headers['x-test-role'] === 'admin' ? 'admin' : 'user', name: 'Fixture user' };
  next();
};
const { documentTemplateRoutes } = require('../../src/modules/document-templates/document-templates.routes');
auth.requireAuth = originalAuth;
let saved = { template: fixture(), revision: 1 };
let savedSource = null;
let renders = 0;
repo.find = async (key) => key === saved.template.templateKey ? saved : null;
repo.list = async () => [saved];
repo.save = async (template, revision) => { if (revision && revision !== saved.revision) throw new AppError('Conflict', 409); saved = { template, revision: (revision || 0) + 1 }; return saved; };
repo.saveSourcePdf = async (key, file) => { if (key !== saved.template.templateKey) throw new AppError('Missing', 404); savedSource = { data: file.buffer, name: file.originalname }; return { hasSourcePdf: true }; };
repo.findSourcePdf = async (key) => key === saved.template.templateKey ? savedSource : null;
renderer.renderPdf = async (template, context) => { renders++; assert.equal(context.record.secret, undefined); assert.equal(Object.hasOwn(template, 'sourcePdf'), false, 'comparison PDF is never passed to the final renderer'); return Buffer.from('%PDF-fixture'); };
permissions.assertModulePageActionAllowed = async (_key, _user, _action, context) => { if (context.recordId !== 10) throw new AppError('Record denied', 403); };
permissions.userFieldPermissions = async () => new Map([['name', { view: true }]]);
source.getRecord = async () => ({ record: { id: 10, customFields: { name: 'Allowed', secret: 'Hidden' } } });
config.getModuleConfig = async () => ({ fields: [{ fieldKey: 'name' }, { fieldKey: 'secret' }] });
departments.findOrganization = async () => null;
access.getRequestView = async () => { throw new AppError('Workflow denied', 403); };

async function run() {
  const app = express(); app.use(express.json()); app.use('/api/document-templates', documentTemplateRoutes); app.use(errorHandler);
  const server = await new Promise((resolve) => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
  const base = `http://127.0.0.1:${server.address().port}/api/document-templates`;
  const request = (suffix, method = 'POST', role = 'viewer', data = {}) => fetch(base + suffix, { method, headers: { 'Content-Type': 'application/json', ...(role ? { 'x-test-role': role } : {}) }, ...(method === 'GET' ? {} : { body: JSON.stringify(data) }) });
  const importRequest = (role, contents = pdfFixture()) => { const body = new FormData(); body.append('pdf', new Blob([contents], { type: 'application/pdf' }), 'invoice.pdf'); return fetch(base + '/import-pdf', { method: 'POST', headers: role ? { 'x-test-role': role } : {}, body }); };
  try {
    assert.equal((await request('/pdf_test/render-pdf', 'POST', '')).status, 401);
    assert.equal((await request('', 'GET')).status, 403);
    assert.equal((await request('/pdf_test', 'PUT', 'viewer', { template: saved.template, revision: 1 })).status, 403);
    assert.equal((await importRequest('')).status, 401);
    assert.equal((await importRequest('viewer')).status, 403);
    assert.equal((await importRequest('admin', Buffer.from('not-pdf'))).status, 422);
    assert.equal((await request('/pdf_test/render-pdf')).status, 403);
    assert.equal((await request('/pdf_test/render-pdf', 'POST', 'viewer', { recordId: 11 })).status, 403);
    assert.equal((await request('/pdf_test/render-pdf', 'POST', 'viewer', { workflowRequestId: 'DENIED' })).status, 403);
    assert.equal((await request('/pdf_test/render-pdf', 'POST', 'viewer', { recordId: 10, record: { name: 'Injected' } })).status, 422);
    assert.equal((await request('/pdf_test/render-pdf', 'POST', 'viewer', { recordId: 10, zoom: 150 })).status, 422);
    assert.equal((await request('/missing/render-pdf', 'POST', 'viewer', { recordId: 10 })).status, 404);
    assert.equal(renders, 0, 'Rejected requests never invoke Chromium');
    const preview = await request('/pdf_test/preview', 'POST', 'viewer', { recordId: 10 });
    assert.deepEqual((await preview.json()).context.record, { id: 10, name: 'Allowed' });
    const pdf = await request('/pdf_test/render-pdf', 'POST', 'viewer', { recordId: 10, revision: 1 });
    assert.equal(pdf.status, 200); assert.match(pdf.headers.get('content-type'), /application\/pdf/);
    assert.equal(pdf.headers.get('content-disposition'), 'attachment; filename="Generic-document-test-10.pdf"');
    assert.equal(pdf.headers.get('cache-control'), 'no-store'); assert.equal(await pdf.text(), '%PDF-fixture');
    assert.equal((await request('/pdf_test/render-pdf', 'POST', 'admin')).status, 200);
    assert.equal((await request(`/${saved.template.templateKey}`, 'PUT', 'admin', { template: saved.template, revision: 1 })).status, 200);
    assert.equal((await request(`/${saved.template.templateKey}/render-pdf`, 'POST', 'viewer', { recordId: 10, revision: 1 })).status, 409);
    const imported = await importRequest('admin'); assert.equal(imported.status, 200); const importedPayload = await imported.json(); assert.equal(importedPayload.template.page.size, 'A4');
    const importedKey = importedPayload.template.templateKey;
    assert.equal((await request(`/${importedKey}`, 'PUT', 'admin', { template: importedPayload.template })).status, 200, 'imported canonical template saves normally');
    assert.equal((await request(`/${importedKey}/preview`, 'POST', 'admin')).status, 200, 'saved import uses existing Preview');
    assert.equal((await request(`/${importedKey}/render-pdf`, 'POST', 'admin', { revision: 1 })).status, 200, 'saved import uses existing PDF renderer');
    const sourceBody = new FormData(); sourceBody.append('pdf', new Blob([pdfFixture()], { type: 'application/pdf' }), 'original.pdf');
    assert.equal((await fetch(`${base}/${importedKey}/source-pdf`, { method: 'PUT', headers: { 'x-test-role': 'viewer' }, body: sourceBody })).status, 403, 'source PDF storage is admin-only');
    const adminBody = new FormData(); adminBody.append('pdf', new Blob([pdfFixture()], { type: 'application/pdf' }), 'original.pdf');
    assert.equal((await fetch(`${base}/${importedKey}/source-pdf`, { method: 'PUT', headers: { 'x-test-role': 'admin' }, body: adminBody })).status, 200);
    assert.equal((await fetch(`${base}/${importedKey}/source-pdf`, { headers: { 'x-test-role': 'viewer' } })).status, 403, 'source PDF retrieval is admin-only');
    const original = await fetch(`${base}/${importedKey}/source-pdf`, { headers: { 'x-test-role': 'admin' } }); assert.equal(original.status, 200); assert.match(original.headers.get('content-type'), /application\/pdf/);
    const imageImport = await importRequest('admin', imagePdfFixture()); const imageTemplate = (await imageImport.json()).template;
    assert.equal(Object.values(imageTemplate.regions).flat().some((element) => element.type === 'image'), true, 'HTTP import returns editable image elements');
    const multiImport = await importRequest('admin', multiPagePdfFixture([[['Page one']], [['Page two']]])); const multiTemplate = (await multiImport.json()).template;
    assert.equal(multiTemplate.pages.length, 2); assert.equal((await request(`/${multiTemplate.templateKey}`, 'PUT', 'admin', { template: multiTemplate })).status, 200);
    assert.equal((await repo.find(multiTemplate.templateKey)).template.pages.length, 2, 'multi-page count survives save and reopen');
    console.log('PDF HTTP fixture checks passed: admin management, view access, negative inputs, revision conflicts, PDF headers and no-store.');
  } finally { await new Promise((resolve) => server.close(resolve)); }
}
run().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => pool.end());
