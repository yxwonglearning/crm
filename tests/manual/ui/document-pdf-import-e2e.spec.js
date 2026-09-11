const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
require('dotenv').config();
const { pool } = require('../../../src/database/pool');
const { multiPageImagePdfFixture } = require('../../smoke/document-pdf-import-smoke');
const { config } = require('../../../src/shared/config');

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
let templateKey = '';

test.use({ channel: 'chrome', acceptDownloads: true });
test.setTimeout(60000);

async function openDocumentTemplates(page) {
  await page.locator('#accountMenuButton').click();
  await page.locator('#adminPortalAccountButton').click();
  await page.locator('[data-admin-section="adminDocumentTemplatesSection"]').click();
}

test.afterAll(async () => {
  if (templateKey) await pool.execute('DELETE FROM crm_document_templates WHERE template_key = ?', [templateKey]);
  await pool.end();
});

test('authenticated PDF import persists images and comparison source', async ({ page }) => {
  await page.goto(baseUrl);
  await page.locator('#loginForm input[name="email"]').fill(process.env.SMOKE_ADMIN_EMAIL || config.admin.email);
  await page.locator('#loginForm input[name="password"]').fill(process.env.SMOKE_ADMIN_PASSWORD || config.admin.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('#accountMenuButton')).toBeVisible();
  await openDocumentTemplates(page);
  await page.locator('#newDocumentTemplateButton').click();
  await page.locator('[data-document-start="pdf"]').click();
  await page.locator('#documentPdfFile').setInputFiles({ name: 'multi-page-invoice.pdf', mimeType: 'application/pdf', buffer: multiPageImagePdfFixture() });
  await page.locator('#documentPdfImportForm').getByRole('button', { name: /Analyze PDF/ }).click();
  await expect(page.locator('#documentImportSummary')).toContainText('2 pages'); await expect(page.locator('#documentImportSummary')).toContainText('2 imported');
  await page.locator('#importAnalyzedDocument').click();
  templateKey = await page.evaluate(() => state.activeDocumentTemplateKey);
  await expect(page.locator('.document-image-block img')).toBeVisible();
  await expect(page.locator('.document-table-block')).toBeVisible();
  await expect(page.locator('#documentPagePosition')).toHaveText('Page 1 of 2');
  await page.locator('#documentNextPage').click(); await expect(page.locator('#documentPagePosition')).toHaveText('Page 2 of 2');
  await expect(page.locator('.document-image-block img')).toBeVisible(); await expect(page.locator('.document-table-block')).toBeVisible();
  await page.locator('#documentTemplateSource').selectOption('module:procurement_requests');
  await page.locator('.document-text-block').click(); await expect(page.locator('.document-binding-suggestion')).toContainText('Request number');
  await page.locator('[data-document-suggestion-reject="workflow.request_number"]').click(); await expect(page.locator('.document-binding-suggestion')).toHaveCount(0);
  await expect(page.locator('.document-text-block')).toContainText('Req No: REQ-22');
  await page.locator('.document-cell').nth(0).click(); await expect(page.locator('.document-binding-suggestion')).toContainText('Description');
  await page.screenshot({ path: 'output/playwright/document-field-binding-suggestion.png', fullPage: false });
  await page.locator('[data-document-suggestion-bind="record.items.description"]').click();
  await page.locator('.document-cell').nth(1).click(); await expect(page.locator('.document-binding-suggestion')).toContainText('Amount');
  await page.locator('[data-document-suggestion-reject="record.items.amount"]').click(); await expect(page.locator('.document-binding-suggestion')).toHaveCount(0);
  await page.locator('.document-cell').nth(2).click(); await expect(page.locator('.document-binding-suggestion')).toContainText('Description');
  expect(await page.evaluate(() => activeDocumentTemplate().pages[1].regions.body.find((element) => element.type === 'table').rows[1].repeat)).toBe(false);
  await page.locator('[data-document-property="cellBinding"]').selectOption('record.items.quantity');
  await page.evaluate(() => { activeDocumentTemplate().pages.forEach((physical, index) => physical.regions.footer.push({ id: `page_number_${index}`, type: 'field', label: 'Page number', binding: 'system.page_number', column: 1, alignment: 'left', fontSize: 9, fontWeight: '400', padding: 1, leftIndent: 0, rightIndent: 0 }, { id: `total_pages_${index}`, type: 'field', label: 'Total pages', binding: 'system.total_pages', column: 1, alignment: 'right', fontSize: 9, fontWeight: '400', padding: 1, leftIndent: 0, rightIndent: 0 })); renderDocumentDesigner(); });
  await page.locator('#saveDocumentTemplate').click();
  await expect(page.locator('#saveDocumentTemplate')).toHaveText('Save');
  await page.reload();
  await expect(page.locator('#accountMenuButton')).toBeVisible();
  await openDocumentTemplates(page);
  await page.locator(`[data-open-document-template="${templateKey}"]`).click();
  await expect(page.locator('#documentPagePosition')).toHaveText('Page 1 of 2'); await page.locator('#documentNextPage').click();
  const reopenedBindings = await page.evaluate(() => activeDocumentTemplate().pages[1].regions.body.find((element) => element.type === 'table').rows.map((row) => row.cells.map((cell) => cell.binding)));
  expect(reopenedBindings[0][0]).toBe('record.items.description'); expect(reopenedBindings[0][1]).toBe(''); expect(reopenedBindings[1][0]).toBe('record.items.quantity');
  await expect(page.locator('#documentCompareControls')).toBeVisible();
  await page.locator('#documentCompareMode').selectOption('original');
  await expect(page.locator('#documentOriginalPdf')).toBeVisible();
  await expect(page.locator('#documentOriginalPdf')).toHaveAttribute('src', /#page=2&view=Fit$/);
  await page.locator('#documentCompareMode').selectOption('overlay');
  await expect(page.locator('#documentOriginalOpacityLabel')).toBeVisible();
  await page.screenshot({ path: 'output/playwright/document-pdf-import-persisted-overlay.png', fullPage: false });
  await page.locator('#documentPreviewMode').click();
  await expect(page.locator('#documentOutputPreview')).toBeVisible();
  await expect(page.frameLocator('#documentOutputPreview').locator('.output-image img')).toHaveCount(2);
  await expect(page.frameLocator('#documentOutputPreview').locator('.output-page')).toHaveCount(2);
  const readiness = await page.evaluate(() => { const template = activeDocumentTemplate(); const current = structuredClone(template); delete current.serverRevision; delete current.serverSnapshot; delete current.hasSourcePdf; return { revision: template.serverRevision, current: JSON.stringify(current), baseline: template.serverSnapshot, name: document.querySelector('#documentTemplateName').value, templateName: template.name }; });
  expect(readiness.current, JSON.stringify(readiness)).toBe(readiness.baseline); expect(readiness.name).toBe(readiness.templateName); expect(readiness.revision).toBeTruthy();
  const renderPromise = page.waitForResponse((response) => response.url().includes('/render-pdf'), { timeout: 30000 });
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#downloadDocumentPdf').click();
  const rendered = await renderPromise; expect(rendered.ok(), await rendered.text().catch(() => '')).toBe(true); expect(rendered.headers()['content-type']).toContain('application/pdf');
  const download = await downloadPromise; const renderedBody = await fs.readFile(await download.path());
  expect(Buffer.compare(renderedBody, multiPageImagePdfFixture())).not.toBe(0, 'final output must not be the stored comparison PDF');
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs'); const generated = await pdfjs.getDocument({ data: new Uint8Array(renderedBody), disableWorker: true }).promise; expect(generated.numPages).toBe(2);
  const generatedText = []; for (let pageNumber = 1; pageNumber <= generated.numPages; pageNumber++) generatedText.push((await (await generated.getPage(pageNumber)).getTextContent()).items.map((item) => item.str).filter(Boolean));
  expect(generatedText[0]).toEqual(expect.arrayContaining(['1', '2'])); expect(generatedText[1].filter((value) => value === '2').length).toBeGreaterThanOrEqual(2);
  await expect(page.locator('#documentOutputStatus')).toContainText('PDF downloaded', { timeout: 30000 });
});
