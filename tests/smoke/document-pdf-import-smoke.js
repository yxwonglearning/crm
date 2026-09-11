const assert = require('node:assert/strict');
const fs = require('node:fs');
const { analyzePdf, validatePdfUpload, inferTable, inferVectorTables, inferAlignedTables, inferRuledTables, inferFormTables, mergeParagraphLines } = require('../../src/modules/document-templates/document-pdf-importer');
const { templateSchema } = require('../../src/modules/document-templates/document-templates.schema');
const documentOutput = require('../../public/document-output');

function pdfFixture(width = 595.28, height = 841.89, rows = [['Invoice No:', 'INV-001'], ['Description', 'Amount'], ['Product A', '100.00']]) {
  const content = rows.map((row, rowIndex) => row.map((value, columnIndex) => `BT /F1 11 Tf ${50 + (columnIndex * 220)} ${height - 200 - (rowIndex * 28)} Td (${String(value).replace(/[()\\]/g, '\\$&')}) Tj ET`).join('\n')).join('\n');
  const bodies = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`];
  let source = '%PDF-1.4\n'; const offsets = [0];
  bodies.forEach((body, index) => { offsets.push(Buffer.byteLength(source)); source += `${index + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = Buffer.byteLength(source); source += `xref\n0 ${bodies.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${bodies.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(source);
}

function imagePdfFixture() {
  const content = 'q 100 0 0 50 50 740 cm /Im1 Do Q\nBT /F1 11 Tf 50 700 Td (Invoice) Tj ET\nBT /F1 11 Tf 50 650 Td (Description) Tj ET\nBT /F1 11 Tf 270 650 Td (Amount) Tj ET\nBT /F1 11 Tf 50 622 Td (Product A) Tj ET\nBT /F1 11 Tf 270 622 Td (100.00) Tj ET';
  const bodies = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R >> /XObject << /Im1 6 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`, '<< /Type /XObject /Subtype /Image /Width 2 /Height 1 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /ASCIIHexDecode /Length 13 >>\nstream\nFF000000FF00>\nendstream'];
  let source = '%PDF-1.4\n'; const offsets = [0];
  bodies.forEach((body, index) => { offsets.push(Buffer.byteLength(source)); source += `${index + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = Buffer.byteLength(source); source += `xref\n0 ${bodies.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${bodies.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(source);
}

function tablePdfFixture(tableSpecs) {
  const height = 841.89; const commands = [];
  for (const table of tableSpecs) {
    const { x, top, widths, rowHeight, rows, missingVerticals = [], partialBorders = false } = table;
    const xs = [x]; widths.forEach((width) => xs.push(xs.at(-1) + width));
    const bottom = top - (rows.length * rowHeight);
    for (let row = 0; row <= rows.length; row++) commands.push(`${x} ${top - row * rowHeight} m ${xs.at(-1)} ${top - row * rowHeight} l S`);
    commands.push(`${x} ${bottom} m ${x} ${top} l S`, `${xs.at(-1)} ${bottom} m ${xs.at(-1)} ${top} l S`);
    for (let column = 1; column < xs.length - 1 && !partialBorders; column++) {
      for (let row = 0; row < rows.length; row++) if (!missingVerticals.some((gap) => gap.row === row && gap.column === column)) commands.push(`${xs[column]} ${top - (row + 1) * rowHeight} m ${xs[column]} ${top - row * rowHeight} l S`);
    }
    rows.forEach((cells, row) => cells.forEach((value, column) => {
      if (value == null) return;
      commands.push(`BT /F1 10 Tf ${xs[column] + 6} ${top - row * rowHeight - 18} Td (${String(value).replace(/[()\\]/g, '\\$&')}) Tj ET`);
    }));
  }
  const content = commands.join('\n');
  const bodies = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 ${height}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`];
  let source = '%PDF-1.4\n'; const offsets = [0];
  bodies.forEach((body, index) => { offsets.push(Buffer.byteLength(source)); source += `${index + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = Buffer.byteLength(source); source += `xref\n0 ${bodies.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${bodies.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(source);
}

function multiPagePdfFixture(pageRows, options = {}) {
  const widths = options.widths || pageRows.map(() => 595.28); const heights = options.heights || pageRows.map(() => 841.89);
  const pageIds = pageRows.map((_, index) => 4 + index * 2); const bodies = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageRows.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  ];
  pageRows.forEach((rows, pageIndex) => {
    const contentId = pageIds[pageIndex] + 1; const height = heights[pageIndex];
    const content = options.corruptPage === pageIndex + 1 ? 'BT /F1 broken-content' : rows.map((row, rowIndex) => row.map((value, columnIndex) => `BT /F1 11 Tf ${50 + columnIndex * 220} ${height - 150 - rowIndex * 28} Td (${String(value).replace(/[()\\]/g, '\\$&')}) Tj ET`).join('\n')).join('\n');
    bodies.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${widths[pageIndex]} ${height}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
    bodies.push(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`);
  });
  let source = '%PDF-1.4\n'; const offsets = [0];
  bodies.forEach((body, index) => { offsets.push(Buffer.byteLength(source)); source += `${index + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = Buffer.byteLength(source); source += `xref\n0 ${bodies.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${bodies.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(source);
}

function multiPageImagePdfFixture() {
  const pageContents = [
    'q 80 0 0 40 50 720 cm /Im1 Do Q\nBT /F1 11 Tf 50 650 Td (Description) Tj ET\nBT /F1 11 Tf 270 650 Td (Amount) Tj ET\nBT /F1 11 Tf 50 622 Td (Page one item) Tj ET\nBT /F1 11 Tf 270 622 Td (10.00) Tj ET',
    'q 120 0 0 30 90 700 cm /Im1 Do Q\nBT /F1 11 Tf 50 690 Td (Req No: REQ-22) Tj ET\nBT /F1 11 Tf 50 650 Td (Description) Tj ET\nBT /F1 11 Tf 270 650 Td (Amount) Tj ET\nBT /F1 11 Tf 50 622 Td (Page two item) Tj ET\nBT /F1 11 Tf 270 622 Td (20.00) Tj ET'
  ];
  const image = '<< /Type /XObject /Subtype /Image /Width 2 /Height 1 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /ASCIIHexDecode /Length 13 >>\nstream\nFF000000FF00>\nendstream';
  const bodies = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [6 0 R 8 0 R] /Count 2 >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', image, image];
  pageContents.forEach((content, index) => { const pageId = 6 + index * 2; bodies.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 3 0 R >> /XObject << /Im1 ${4 + index} 0 R >> >> /Contents ${pageId + 1} 0 R >>`, `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`); });
  let source = '%PDF-1.4\n'; const offsets = [0]; bodies.forEach((body, index) => { offsets.push(Buffer.byteLength(source)); source += `${index + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = Buffer.byteLength(source); source += `xref\n0 ${bodies.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${bodies.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(source);
}

async function run() {
  const html = fs.readFileSync(require.resolve('../../public/index.html'), 'utf8'); const frontend = fs.readFileSync(require.resolve('../../public/app.js'), 'utf8');
  assert.match(html, /Import from PDF/); assert.match(html, /Generated[\s\S]*Original[\s\S]*Overlay/); assert.match(html, /maximum 10 MB/);
  assert.match(frontend, /data-document-property="bindText"/); assert.match(frontend, /Set as repeating row/); assert.match(frontend, /\/api\/document-templates\/import-pdf/);
  const upload = (buffer, overrides = {}) => ({ buffer, mimetype: 'application/pdf', originalname: 'invoice.pdf', ...overrides });
  assert.doesNotThrow(() => validatePdfUpload(upload(pdfFixture())));
  assert.throws(() => validatePdfUpload(upload(Buffer.from('not a pdf'))), { statusCode: 422 });
  assert.throws(() => validatePdfUpload(upload(pdfFixture(), { mimetype: 'text/plain' })), { statusCode: 422 });
  assert.throws(() => validatePdfUpload(upload(pdfFixture(), { originalname: '../invoice.txt' })), { statusCode: 422 });
  const portrait = await analyzePdf(pdfFixture(), 'invoice.pdf');
  assert.equal(portrait.detectedLayout.page.orientation, 'portrait'); assert.equal(portrait.detectedLayout.page.size, 'A4'); assert.ok(portrait.detectedLayout.textBlocks >= 3);
  assert.equal(portrait.detectedLayout.tables, 1); assert.equal(portrait.template.regions.body.at(-1).type, 'table');
  assert.equal(portrait.template.regions.body.at(-1).rows[2].cells[0].content, 'Product A');
  assert.equal(portrait.template.regions.body.at(-1).rows.some((row) => row.repeat), false, 'repeating rows require user confirmation');
  assert.equal(templateSchema.safeParse(portrait.template).success, true, 'import creates the canonical editable template model');
  const withLogo = await analyzePdf(imagePdfFixture(), 'logo.pdf'); const logo = Object.values(withLogo.template.regions).flat().find((element) => element.type === 'image');
  assert.equal(withLogo.detectedLayout.importedImages, 1); assert.match(logo.source, /^data:image\/png;base64,/);
  assert.ok(Math.abs(logo.imageWidthCm - 3.53) < .1 && Math.abs(logo.imageHeightCm - 1.76) < .1, 'image display geometry is preserved');
  assert.ok(logo.leftIndent >= .7 && logo.leftIndent <= .8, 'image horizontal position becomes a document indent');
  assert.equal(templateSchema.safeParse(withLogo.template).success, true, 'imported image persists through the canonical template schema');
  assert.equal(inferTable([{ y: 10, items: [{ x: 10, text: 'One' }, { x: 24, text: 'Two' }] }, { y: 30, items: [{ x: 11, text: ' prose' }, { x: 25, text: 'continues' }] }]), null, 'closely spaced prose is not inferred as a table');
  const invoiceTable = portrait.template.regions.body.at(-1); assert.equal(Math.round(invoiceTable.columns.reduce((sum, column) => sum + column.width, 0)), 100); assert.ok(Math.abs(invoiceTable.columns[0].width - invoiceTable.columns[1].width) < 2, 'invoice column widths follow the detected visual spacing');
  assert.equal(invoiceTable.rows[2].cells[1].alignment, 'right', 'straightforward numeric invoice columns preserve right alignment');
  const structured = await analyzePdf(tablePdfFixture([
    { x: 50, top: 700, widths: [210, 100], rowHeight: 30, rows: [['ITEMS', null], ['Widget', '2'], ['Subtotal', '200.00']], missingVerticals: [{ row: 0, column: 1 }, { row: 2, column: 1 }] },
    { x: 70, top: 430, widths: [150, 130], rowHeight: 30, rows: [['Tax', '12.00'], ['Shipping', '8.00'], ['Total', '220.00']] }
  ]), 'structured-tables.pdf');
  const structuredTables = structured.template.regions.body.filter((element) => element.type === 'table');
  assert.equal(structured.detectedLayout.tables, 2, 'spatially separate grids become separate editable tables');
  assert.equal(structuredTables.every((table) => table.printableBorders), true, 'detected vector borders map to printable borders');
  assert.equal(structuredTables[0].rows[0].cells[0].colSpan, 2, 'a missing header divider becomes a merged header cell');
  assert.equal(structuredTables[0].rows[0].cells[1].hidden, true, 'the covered header cell is hidden in the canonical model');
  assert.equal(structuredTables[0].rows[2].cells[0].colSpan, 2, 'a missing subtotal divider becomes a merged subtotal cell');
  assert.equal(templateSchema.safeParse(structured.template).success, true, 'vector tables remain canonical editable template data');
  const partial = await analyzePdf(tablePdfFixture([{ x: 50, top: 620, widths: [210, 100], rowHeight: 30, partialBorders: true, rows: [['Description', 'Amount'], ['Consulting', '500.00'], ['Support', '75.00']] }]), 'partial-border.pdf');
  const partialTable = partial.template.regions.body.find((element) => element.type === 'table');
  assert.equal(partial.detectedLayout.tables, 1, 'partial borders plus repeated alignment reconstruct a table');
  assert.equal(partialTable.printableBorders, true, 'available partial vector rules map to the closest editable border model');
  const wrappedLines = [
    { y: 100, x: 50, width: 270, height: 10, fontSize: 10, items: [{ x: 50, width: 150, text: 'Description' }, { x: 270, width: 50, text: 'Amount' }] },
    { y: 120, x: 50, width: 270, height: 10, fontSize: 10, items: [{ x: 50, width: 150, text: 'Long consulting' }, { x: 270, width: 50, text: '500.00' }] },
    { y: 134, x: 50, width: 130, height: 10, fontSize: 10, text: 'engagement phase two', items: [{ x: 50, width: 130, text: 'engagement phase two' }] },
    { y: 148, x: 50, width: 270, height: 10, fontSize: 10, items: [{ x: 50, width: 150, text: 'Support' }, { x: 270, width: 50, text: '75.00' }] }
  ];
  const wrapped = inferAlignedTables(wrappedLines);
  assert.equal(wrapped.length, 1); assert.match(wrapped[0].rows[1].items[0].text, /phase two/, 'wrapped descriptions remain in their logical table row');
  const uneven = inferAlignedTables([100, 124, 157].map((y, row) => ({ y, x: 50, width: 270, height: 10, fontSize: 10, items: [{ x: 50, width: 150, text: `Line ${row}` }, { x: 270, width: 50, text: `${row}.00` }] })));
  assert.equal(uneven.length, 1, 'uneven but unambiguous row spacing remains one table');
  assert.equal(inferVectorTables([], [{ axis: 'h', p: 100, start: 40, end: 400 }, { axis: 'h', p: 180, start: 40, end: 400 }]).length, 0, 'decorative separators alone never create a table');
  const businessLines = [
    { y: 60, x: 30, width: 500, height: 10, fontSize: 10, items: [{ x: 30, width: 70, text: 'Supplier' }, { x: 145, width: 120, text: 'Example Trading' }, { x: 300, width: 80, text: 'Document No' }, { x: 415, width: 100, text: 'DOC-1001' }] },
    { y: 76, x: 30, width: 490, height: 10, fontSize: 10, items: [{ x: 30, width: 70, text: 'Address' }, { x: 145, width: 190, text: '10 Sample Road' }, { x: 300, width: 60, text: 'Date' }, { x: 415, width: 90, text: '01/01/2026' }] },
    { y: 90, x: 145, width: 130, height: 10, fontSize: 10, items: [{ x: 145, width: 130, text: 'Example City' }] },
    { y: 170, x: 30, width: 520, height: 10, fontSize: 10, items: [{ x: 30, width: 20, text: 'No.' }, { x: 55, width: 120, text: 'Description' }, { x: 220, width: 30, text: 'Qty' }, { x: 275, width: 55, text: 'Unit Price' }, { x: 350, width: 45, text: 'Tax' }, { x: 440, width: 50, text: 'Total' }] },
    { y: 190, x: 30, width: 500, height: 10, fontSize: 10, items: [{ x: 30, width: 10, text: '1' }, { x: 55, width: 150, text: 'Editable service item' }, { x: 220, width: 12, text: '2' }, { x: 275, width: 35, text: '50.00' }, { x: 350, width: 30, text: '6.00' }, { x: 440, width: 45, text: '106.00' }] },
    { y: 204, x: 55, width: 145, height: 10, fontSize: 10, items: [{ x: 55, width: 145, text: 'with wrapped detail' }] },
    { y: 240, x: 300, width: 190, height: 10, fontSize: 10, items: [{ x: 300, width: 60, text: 'Subtotal' }, { x: 440, width: 50, text: '106.00' }] },
    { y: 298, x: 30, width: 460, height: 10, fontSize: 10, items: [{ x: 30, width: 80, text: 'Tax Type' }, { x: 155, width: 70, text: 'Tax Rate' }, { x: 255, width: 80, text: 'Tax Amount' }, { x: 355, width: 100, text: 'Total incl tax' }] },
    { y: 322, x: 30, width: 450, height: 10, fontSize: 10, items: [{ x: 30, width: 90, text: 'Standard tax' }, { x: 155, width: 45, text: '6.00%' }, { x: 255, width: 40, text: '6.00' }, { x: 355, width: 45, text: '106.00' }] }
  ];
  const businessRules = [40, 145, 225, 260].map((p) => ({ axis: 'h', p, start: 28, end: 550 }))
    .concat([291, 315, 340].map((p) => ({ axis: 'h', p, start: 28, end: 350 })));
  const forms = inferFormTables(businessLines, businessRules, 595.28);
  const metadataForm = forms.find((table) => table.rows[0]?.cells[0]?.content === 'Supplier');
  assert.ok(metadataForm, 'synthetic two-sided metadata reconstructs as an editable form table');
  assert.match(metadataForm.rows[1].cells[1].content, /Example City/, 'multi-line address stays in its value column');
  const ruled = inferRuledTables(businessLines, businessRules, 595.28);
  assert.equal(ruled.length, 2, 'separate product and tax rule bands remain separate editable tables');
  assert.match(ruled[0].rows[1].cells[1].content, /wrapped detail/, 'wrapped descriptions stay in the product row');
  const paragraphs = mergeParagraphLines([
    { y: 700, x: 30, width: 480, height: 10, fontSize: 9, text: 'This synthetic notice continues', items: [{ x: 30, width: 480, text: 'This synthetic notice continues' }] },
    { y: 712, x: 30, width: 470, height: 10, fontSize: 9, text: 'without colliding with the footer.', items: [{ x: 30, width: 470, text: 'without colliding with the footer.' }] }
  ]);
  assert.equal(paragraphs[0].text, 'This synthetic notice continues\nwithout colliding with the footer.', 'long notices retain explicit line structure');
  const prose = await analyzePdf(pdfFixture(595.28, 841.89, [['Bill to', 'Acme Ltd'], ['123 Main Street'], ['Kuala Lumpur'], ['Terms', 'Due on receipt']]), 'metadata.pdf');
  assert.equal(prose.detectedLayout.tables, 0, 'address and header metadata are not promoted into a table');
  const landscape = await analyzePdf(pdfFixture(841.89, 595.28), 'landscape.pdf');
  assert.equal(landscape.template.page.orientation, 'landscape'); assert.equal(templateSchema.safeParse(landscape.template).success, true);
  const multi = await analyzePdf(multiPagePdfFixture([
    [['Page one heading'], ['Description', 'Amount'], ['First item', '10.00']],
    [['Page two heading'], ['Description', 'Amount'], ['Second item', '20.00']],
    [['Page three heading'], ['Description', 'Amount'], ['Third item', '30.00']]
  ]), 'three-pages.pdf');
  assert.equal(multi.detectedLayout.pageCount, 3); assert.equal(multi.template.pages.length, 3);
  assert.deepEqual(multi.template.pages.map((page) => page.regions.body.find((element) => element.type === 'text')?.content), ['Page one heading', 'Page two heading', 'Page three heading'], 'page text and ordering are preserved');
  assert.equal(multi.template.pages.every((page) => page.regions.body.some((element) => element.type === 'table')), true, 'tables reconstruct independently on every page');
  assert.equal(templateSchema.safeParse(multi.template).success, true, 'multi-page imports persist in the backward-compatible schema');
  const multiImages = await analyzePdf(multiPageImagePdfFixture(), 'two-page-images.pdf');
  assert.equal(multiImages.template.pages.length, 2); assert.equal(multiImages.template.pages.every((page) => page.regions.body.some((element) => element.type === 'image')), true, 'images remain associated with each source page');
  await assert.rejects(analyzePdf(multiPagePdfFixture(Array.from({ length: 26 }, (_, index) => [[`Page ${index + 1}`]])), 'too-many.pdf'), /limited to 25 pages/);
  await assert.rejects(analyzePdf(multiPagePdfFixture([[['Portrait']], [['Landscape']]], { widths: [595.28, 841.89], heights: [841.89, 595.28] }), 'mixed.pdf'), /Mixed page sizes/);
  await assert.rejects(analyzePdf(multiPagePdfFixture([[['Valid page']], [['Broken page']]], { corruptPage: 2 }), 'corrupt-page.pdf'), /Page 2/, 'one invalid page rejects the complete import with its page number');
  const letter = await analyzePdf(pdfFixture(612, 792), 'letter.pdf');
  assert.deepEqual(letter.template.page, { ...letter.template.page, size: 'custom', widthCm: 21.59, heightCm: 27.94 });
  assert.deepEqual(documentOutput.geometry(letter.template.page), { width: 21.59, height: 27.94 }, 'designer, preview and PDF output share imported physical geometry');
  const letterMulti = await analyzePdf(multiPagePdfFixture([[['Page one']], [['Page two']], [['Page three']]], { widths: [612, 612, 612], heights: [792, 792, 792] }), 'letter-multi.pdf');
  assert.equal(letterMulti.template.pages.length, 3); assert.equal(letterMulti.template.pages.every((page) => page.page.widthCm === 21.59 && page.page.heightCm === 27.94), true, 'multi-page custom geometry persists per page');
  await assert.rejects(analyzePdf(pdfFixture(1500, 100), 'extreme.pdf'), /Unsupported page size: 529 × 35 mm/);
  await assert.rejects(analyzePdf(multiPagePdfFixture([[['Letter']], [['A4']]], { widths: [612, 595.28], heights: [792, 841.89] }), 'mixed-size.pdf'), /Mixed page sizes/);
  await assert.rejects(analyzePdf(pdfFixture(595.28, 841.89, []), 'scan.pdf'), { statusCode: 422 });
  await assert.rejects(analyzePdf(Buffer.from('%PDF-corrupted'), 'bad.pdf'), { statusCode: 422 });
  console.log('PDF import checks passed: validation, A4 geometry, text, table conversion, canonical schema, landscape, scanned and corrupted handling.');
}
if (require.main === module) run().catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = { pdfFixture, imagePdfFixture, tablePdfFixture, multiPagePdfFixture, multiPageImagePdfFixture };
