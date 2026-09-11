const path = require('path');
const fs = require('fs/promises');
const { chromium } = require('playwright');
const { AppError } = require('../../shared/errors');
const { geometry } = require('../../../public/document-output');

const activeUsers = new Set();
async function renderPdf(template, context, userId) {
  if (activeUsers.has(userId) || activeUsers.size >= 2) throw new AppError('PDF renderer is busy. Try again shortly.', 429);
  activeUsers.add(userId);
  let browser;
  let deadline;
  let expired = false;
  try {
    browser = await chromium.launch({ headless: true, chromiumSandbox: true, timeout: 15000 });
    deadline = setTimeout(() => { expired = true; void browser.close().catch(() => {}); }, 30000);
    const isolated = await browser.newContext({ serviceWorkers: 'block', acceptDownloads: false });
    await isolated.route('**/*', (route) => route.abort());
    const page = await isolated.newPage();
    page.setDefaultTimeout(15000);
    await page.setContent('<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\';"></head><body><main id="output"></main></body></html>');
    // Trusted code only. Template and record values are arguments, never executable HTML/JS.
    await page.evaluate(await fs.readFile(path.join(__dirname, '../../../public/document-output.js'), 'utf8'));
    await page.evaluate(({ template: definition, context: values }) => DocumentOutput.mount(document.querySelector('#output'), definition, values), { template, context });
    const size = geometry(template.page);
    const pdf = await page.pdf({ width: `${size.width}cm`, height: `${size.height}cm`, preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false, margin: { top: 0, bottom: 0, left: 0, right: 0 }, scale: 1 });
    if (pdf.length > 20 * 1024 * 1024) throw new AppError('Generated PDF exceeds the 20 MB limit', 422);
    return pdf;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (/taller than|exceeds a page|100-page|500 rows|Repeating source/.test(error.message)) throw new AppError('Document content does not fit. Split oversized blocks/rows or reduce content.', 422);
    throw new AppError(expired ? 'PDF generation timed out. Reduce document size and retry.' : 'PDF generation failed. Check the server Chromium installation or document content.', 503);
  } finally {
    clearTimeout(deadline);
    if (browser) await browser.close().catch(() => {});
    activeUsers.delete(userId);
  }
}
module.exports = { renderPdf };
