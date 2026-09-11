const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const { analyzePdf, groupTextItems, requiresOcr, MAX_PDF_PAGES } = require('../../src/modules/document-templates/document-pdf-importer');
const { OCRExtractor, normalizeOcrBlocks, confidenceCategory, OCR_RENDER_SCALE } = require('../../src/modules/document-templates/ocr-extractor');
const { pdfFixture } = require('./document-pdf-import-smoke');
const { templateSchema } = require('../../src/modules/document-templates/document-templates.schema');
const suggestions = require('../../public/document-binding-suggestions');
const { renderPdf } = require('../../src/modules/document-templates/document-templates.renderer');
const fs = require('node:fs');

function scannedPdfFixture(pages) {
  const bodies = [Buffer.from('<< /Type /Catalog /Pages 2 0 R >>'), Buffer.from(`<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 3} 0 R`).join(' ')}] /Count ${pages.length} >>`)];
  pages.forEach((source, index) => {
    const canvas = createCanvas(1240, 1754); const context = canvas.getContext('2d'); context.fillStyle = '#fff'; context.fillRect(0, 0, 1240, 1754); context.fillStyle = '#111';
    let y = 150; context.font = 'bold 46px Arial'; context.fillText(source.title, 105, y); y += 105; context.font = '28px Arial';
    for (const line of source.lines || []) { context.fillText(line, 105, y); y += 60; }
    for (const row of source.rows || []) { context.fillText(row[0], 105, y); context.fillText(row[1], 760, y); y += 60; }
    const jpeg = canvas.toBuffer('image/jpeg', 92); const pageId = 3 + index * 3; const imageId = pageId + 1; const contentId = pageId + 2;
    const content = Buffer.from('q 595.28 0 0 841.89 0 0 cm /Im1 Do Q');
    bodies.push(Buffer.from(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im1 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`));
    bodies.push(Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width 1240 /Height 1754 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`), jpeg, Buffer.from('\nendstream')]));
    bodies.push(Buffer.concat([Buffer.from(`<< /Length ${content.length} >>\nstream\n`), content, Buffer.from('\nendstream')]));
  });
  const chunks = [Buffer.from('%PDF-1.4\n')]; const offsets = [0]; let length = chunks[0].length;
  bodies.forEach((body, index) => { offsets.push(length); const object = Buffer.concat([Buffer.from(`${index + 1} 0 obj\n`), body, Buffer.from('\nendobj\n')]); chunks.push(object); length += object.length; });
  const xref = length; chunks.push(Buffer.from(`xref\n0 ${bodies.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${bodies.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`));
  return Buffer.concat(chunks);
}

async function run() {
  assert.equal(OCR_RENDER_SCALE, 2, 'OCR uses a controlled 144-DPI-equivalent render scale');
  assert.equal(confidenceCategory(90), 'high'); assert.equal(confidenceCategory(65), 'medium'); assert.equal(confidenceCategory(30), 'low');
  assert.equal(requiresOcr([], 1), true, 'image-only pages are OCR candidates');
  assert.equal(requiresOcr([{ text: 'x' }], 1), true, 'negligible extracted text with a scanned image safely falls back to OCR');
  assert.equal(requiresOcr([], 0), false, 'empty pages without an image signal are not sent to OCR');
  assert.equal(requiresOcr([{ text: 'Invoice number INV-001' }], 1), false, 'useful digital text is never OCR duplicated');
  const normalized = normalizeOcrBlocks([{ paragraphs: [{ lines: [{ words: [
    { text: 'Invoice', confidence: 91, bbox: { x0: 100, y0: 200, x1: 220, y1: 240 } },
    { text: 'No', confidence: 62, bbox: { x0: 240, y0: 200, x1: 280, y1: 240 } }
  ] }] }] }], { width: 595, height: 842 }, 1190, 1684, 2);
  assert.equal(normalized[0].text, 'Invoice No'); assert.equal(normalized[0].items[0].pageNumber, 2);
  assert.ok(Math.abs(normalized[0].x - 50) < .1 && Math.abs(normalized[0].y - 100) < .1, 'pixel boxes normalize into page points independently of browser zoom');
  assert.equal(normalized[0].confidence, 'medium', 'line confidence conservatively combines word confidence');
  const low = normalizeOcrBlocks([{ paragraphs: [{ lines: [{ words: [{ text: 'Blurred', confidence: 31, bbox: { x0: 10, y0: 10, x1: 80, y1: 30 } }] }] }] }], { width: 595, height: 842 }, 1190, 1684, 1);
  assert.equal(low[0].confidence, 'low', 'usable low-confidence text remains editable and reviewable');
  const failingExtractor = new OCRExtractor();
  await assert.rejects(failingExtractor.extract({ getViewport: () => ({ width: 595, height: 842 }), render: () => ({ promise: Promise.reject(new Error('bad raster')) }) }, { width: 595, height: 842 }, 2), /page 2/i, 'page-level OCR failure identifies the failed page');

  const digital = await analyzePdf(pdfFixture(), 'digital-regression.pdf');
  assert.equal(digital.detectedLayout.pages[0].extractionMethod, 'digital'); assert.equal(digital.detectedLayout.ocr, null);
  assert.equal(digital.template.regions.body.at(-1).rows[2].cells[0].content, 'Product A', 'digital reconstruction remains stable');

  const scanned = await analyzePdf(scannedPdfFixture([{ title: 'INVOICE', lines: ['Invoice No: INV-2026-001'], rows: [['Description', 'Amount'], ['Consulting services', '500.00'], ['Support', '75.00']] }]), 'scanned-invoice.pdf');
  assert.equal(scanned.detectedLayout.pages[0].extractionMethod, 'ocr'); assert.ok(scanned.detectedLayout.textBlocks >= 3);
  assert.ok(scanned.template.regions.body.some((element) => element.type === 'table'), 'aligned OCR text reuses table reconstruction');
  assert.equal(templateSchema.safeParse(scanned.template).success, true, 'OCR produces the canonical editable template model');
  assert.equal(Object.values(scanned.template.regions).flat().every((element) => element.type !== 'image'), true, 'the scanned page is not duplicated as a template background');
  assert.equal(JSON.stringify(scanned.template).includes('data:image'), false, 'comparison source is excluded from the generated template');
  const suggested = suggestions.all(scanned.template, [{ label: 'Invoice Number', binding: 'record.invoice_number', type: 'text' }]);
  assert.ok(suggested.some((entry) => entry.matches[0]?.binding === 'record.invoice_number'), 'OCR text feeds the existing deterministic field suggestions');
  const rendered = await renderPdf(scanned.template, {}, 9001);
  assert.equal(rendered.subarray(0, 5).toString(), '%PDF-', 'OCR template uses the existing PDF renderer');

  const multi = await analyzePdf(scannedPdfFixture([
    { title: 'PURCHASE ORDER', lines: ['PO No: PO-001'], rows: [['Item', 'Qty'], ['Paper', '10'], ['Pens', '20']] },
    { title: 'PURCHASE ORDER PAGE 2', lines: ['Delivery: Main office'], rows: [['Item', 'Amount'], ['Shipping', '25.00'], ['Total', '125.00']] }
  ]), 'scanned-po.pdf');
  assert.equal(multi.detectedLayout.pageCount, 2); assert.equal(multi.template.pages.length, 2);
  assert.deepEqual(multi.detectedLayout.pages.map((page) => page.pageNumber), [1, 2], 'OCR page ordering is preserved');
  assert.equal(multi.detectedLayout.pages.every((page) => page.extractionMethod === 'ocr'), true);
  assert.equal(templateSchema.safeParse(JSON.parse(JSON.stringify(multi.template))).success, true, 'OCR save/reopen JSON remains canonical');
  assert.equal(MAX_PDF_PAGES, 25, 'OCR retains the existing page-count safety limit');
  const frontend = fs.readFileSync(require.resolve('../../public/app.js'), 'utf8');
  assert.match(frontend, /Scanned document detected/); assert.match(frontend, /OCR completed/); assert.match(frontend, /Careful review required/);
  console.log('PDF OCR checks passed: detection, real extraction, normalized boxes, confidence, editable tables, multi-page order, canonical persistence and digital regression.');
}

if (require.main === module) run().catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = { scannedPdfFixture };
