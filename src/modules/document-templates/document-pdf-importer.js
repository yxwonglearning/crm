const { AppError } = require('../../shared/errors');
const zlib = require('node:zlib');

const POINTS_PER_CM = 72 / 2.54;
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_PDF_PAGES = 25;
const round = (value, digits = 2) => Number(Number(value).toFixed(digits));
const safeId = (prefix, index) => `${prefix}_${index + 1}`;

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  const result = Buffer.alloc(4); result.writeUInt32BE((crc ^ 0xffffffff) >>> 0); return result;
}

function pngChunk(type, data) {
  const name = Buffer.from(type); const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  return Buffer.concat([length, name, data, crc32(Buffer.concat([name, data]))]);
}

function imageDataUrl(image) {
  const width = Number(image?.width); const height = Number(image?.height);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 4096 || height > 4096 || !image.data) return '';
  const source = Buffer.from(image.data.buffer, image.data.byteOffset, image.data.byteLength);
  const channels = source.length === width * height * 4 ? 4 : source.length === width * height * 3 ? 3 : 0;
  if (!channels) return '';
  const rows = []; const stride = width * channels;
  for (let row = 0; row < height; row++) rows.push(Buffer.concat([Buffer.from([0]), source.subarray(row * stride, (row + 1) * stride)]));
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = channels === 4 ? 6 : 2;
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk('IHDR', header), pngChunk('IDAT', zlib.deflateSync(Buffer.concat(rows))), pngChunk('IEND', Buffer.alloc(0))]);
  const result = `data:image/png;base64,${png.toString('base64')}`;
  return result.length <= 700000 ? result : '';
}

function multiply(left, right) {
  return [left[0] * right[0] + left[2] * right[1], left[1] * right[0] + left[3] * right[1], left[0] * right[2] + left[2] * right[3], left[1] * right[2] + left[3] * right[3], left[0] * right[4] + left[2] * right[5] + left[4], left[1] * right[4] + left[3] * right[5] + left[5]];
}

function pdfObject(objects, id) {
  return new Promise((resolve) => { const timeout = setTimeout(() => resolve(null), 2000); const done = (value) => { clearTimeout(timeout); resolve(value); }; try { const value = objects.get(id, done); if (value) done(value); } catch { done(null); } });
}

async function extractImages(page, operators, pdfjs, viewport, imageCache = new Map()) {
  const images = []; const stack = []; let transform = [1, 0, 0, 1, 0, 0];
  for (let index = 0; index < operators.fnArray.length; index++) {
    const operation = operators.fnArray[index]; const args = operators.argsArray[index] || [];
    if (operation === pdfjs.OPS.save) stack.push([...transform]);
    else if (operation === pdfjs.OPS.restore) transform = stack.pop() || [1, 0, 0, 1, 0, 0];
    else if (operation === pdfjs.OPS.transform) transform = multiply(transform, args);
    else if ([pdfjs.OPS.paintImageXObject, pdfjs.OPS.paintInlineImageXObject].includes(operation)) {
      let image = operation === pdfjs.OPS.paintInlineImageXObject ? args[0] : imageCache.get(args[0]);
      if (!image && operation !== pdfjs.OPS.paintInlineImageXObject) { image = await pdfObject(page.objs, args[0]); if (image) imageCache.set(args[0], image); }
      const source = imageDataUrl(image); if (!source) continue;
      const points = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => [transform[0] * x + transform[2] * y + transform[4], transform[1] * x + transform[3] * y + transform[5]]);
      const xs = points.map(([x]) => x); const ys = points.map(([, y]) => y); const width = Math.max(...xs) - Math.min(...xs); const height = Math.max(...ys) - Math.min(...ys);
      if (width < 2 || height < 2) continue;
      images.push({ source, x: Math.min(...xs), y: viewport.height - Math.max(...ys), width, height });
    }
  }
  return images;
}

function validatePdfUpload(file) {
  if (!file?.buffer?.length) throw new AppError('Choose a PDF file to import.', 422);
  if (file.buffer.length > MAX_PDF_BYTES) throw new AppError('PDF exceeds the 10 MB import limit.', 413);
  if (file.mimetype !== 'application/pdf' || !/\.pdf$/i.test(file.originalname || '')) throw new AppError('Upload a PDF file.', 422);
  if (file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-') throw new AppError('The uploaded file does not have a valid PDF signature.', 422);
}

function groupTextItems(items, pageHeight) {
  const blocks = items.filter((item) => item.str?.trim()).map((item) => {
    const fontSize = Math.max(7, Math.min(48, Math.abs(item.transform?.[3] || item.height || 11)));
    return {
      text: item.str.trim(), x: item.transform?.[4] || 0,
      y: pageHeight - (item.transform?.[5] || 0) - fontSize,
      width: Math.max(item.width || 0, fontSize), height: Math.max(item.height || fontSize, fontSize),
      fontSize, fontFamily: item.fontName || '', confidence: 'high'
    };
  }).sort((a, b) => a.y - b.y || a.x - b.x);
  const lines = [];
  for (const block of blocks) {
    const line = lines.find((candidate) => Math.abs(candidate.y - block.y) <= Math.max(2.5, block.fontSize * .35));
    if (line) line.items.push(block);
    else lines.push({ y: block.y, items: [block] });
  }
  return lines.map((line) => {
    line.items.sort((a, b) => a.x - b.x);
    const first = line.items[0]; const last = line.items.at(-1);
    return { ...first, text: line.items.map((item) => item.text).join(' '), width: last.x + last.width - first.x, items: line.items };
  });
}

function inferTable(lines) {
  const candidates = lines.filter((line) => line.items.length >= 2);
  if (candidates.length < 2) return null;
  const columnCount = Math.min(12, Math.max(...candidates.map((line) => line.items.length)));
  const rows = candidates.filter((line) => Math.abs(line.items.length - columnCount) <= 1);
  if (rows.length < 2) return null;
  const starts = Array.from({ length: columnCount }, (_, index) => {
    const values = rows.map((row) => row.items[index]?.x).filter(Number.isFinite).sort((a, b) => a - b);
    return values[Math.floor(values.length / 2)] || 0;
  });
  const aligned = rows.every((row) => row.items.every((item, index) => index >= starts.length || Math.abs(item.x - starts[index]) < 10));
  if (!aligned) return null;
  const gaps = starts.slice(1).map((start, index) => start - starts[index]);
  if (gaps.some((gap) => gap < 28) || rows.length / candidates.length < .7) return null;
  const typicalGap = gaps.slice().sort((a, b) => a - b)[Math.floor(gaps.length / 2)] || 72;
  const widths = starts.map((start, index) => index < starts.length - 1 ? starts[index + 1] - start : Math.max(typicalGap, ...rows.map((row) => (row.items[index]?.x || start) + (row.items[index]?.width || 0) - start)));
  const total = widths.reduce((sum, width) => sum + Math.max(width, 1), 0);
  return { rows, columnCount, y: rows[0].y, widths: widths.map((width) => round((Math.max(width, 1) / total) * 100, 3)), confidence: 'medium' };
}

const near = (left, right, tolerance = 3) => Math.abs(left - right) <= tolerance;
const overlap = (a1, a2, b1, b2, tolerance = 3) => Math.min(a2, b2) + tolerance >= Math.max(a1, b1);
function point(matrix, x, y, pageHeight) {
  return { x: matrix[0] * x + matrix[2] * y + matrix[4], y: pageHeight - (matrix[1] * x + matrix[3] * y + matrix[5]) };
}

function extractVectorSegments(operators, pdfjs, viewport) {
  const result = []; const stack = []; let matrix = [1, 0, 0, 1, 0, 0]; let current = null;
  const add = (left, right) => {
    if (near(left.y, right.y, 1.5) && Math.abs(left.x - right.x) >= 8) result.push({ axis: 'h', p: (left.y + right.y) / 2, start: Math.min(left.x, right.x), end: Math.max(left.x, right.x) });
    if (near(left.x, right.x, 1.5) && Math.abs(left.y - right.y) >= 8) result.push({ axis: 'v', p: (left.x + right.x) / 2, start: Math.min(left.y, right.y), end: Math.max(left.y, right.y) });
  };
  for (let index = 0; index < operators.fnArray.length; index++) {
    const operation = operators.fnArray[index]; const args = operators.argsArray[index] || [];
    if (operation === pdfjs.OPS.save) stack.push([...matrix]);
    else if (operation === pdfjs.OPS.restore) matrix = stack.pop() || [1, 0, 0, 1, 0, 0];
    else if (operation === pdfjs.OPS.transform) matrix = multiply(matrix, args);
    else if (operation === pdfjs.OPS.constructPath) {
      if (Array.isArray(args[1])) {
        for (const encodedPath of args[1]) {
          const values = Array.from(encodedPath); let cursor = 0; let pathPoint = null;
          while (cursor < values.length) {
            const pathOp = values[cursor++];
            if (pathOp === 0) { pathPoint = point(matrix, values[cursor], values[cursor + 1], viewport.height); cursor += 2; }
            else if (pathOp === 1) { const next = point(matrix, values[cursor], values[cursor + 1], viewport.height); cursor += 2; if (pathPoint) add(pathPoint, next); pathPoint = next; }
            else break;
          }
        }
        continue;
      }
      const pathOps = Array.from(args[0] || []); const coords = Array.from(args[1] || []); let cursor = 0;
      for (const pathOp of pathOps) {
        if (pathOp === pdfjs.OPS.moveTo) { current = point(matrix, coords[cursor], coords[cursor + 1], viewport.height); cursor += 2; }
        else if (pathOp === pdfjs.OPS.lineTo) { const next = point(matrix, coords[cursor], coords[cursor + 1], viewport.height); cursor += 2; if (current) add(current, next); current = next; }
        else if (pathOp === pdfjs.OPS.rectangle) {
          const [x, y, width, height] = coords.slice(cursor, cursor + 4); cursor += 4;
          const corners = [point(matrix, x, y, viewport.height), point(matrix, x + width, y, viewport.height), point(matrix, x + width, y + height, viewport.height), point(matrix, x, y + height, viewport.height)];
          for (let side = 0; side < 4; side++) add(corners[side], corners[(side + 1) % 4]); current = corners[0];
        } else if (pathOp === pdfjs.OPS.curveTo) cursor += 6;
        else if (pathOp === pdfjs.OPS.curveTo2 || pathOp === pdfjs.OPS.curveTo3) cursor += 4;
      }
    }
  }
  const merged = [];
  for (const segment of result.sort((a, b) => a.axis.localeCompare(b.axis) || a.p - b.p || a.start - b.start)) {
    const match = merged.find((item) => item.axis === segment.axis && near(item.p, segment.p) && overlap(item.start, item.end, segment.start, segment.end, 4));
    if (match) { match.p = (match.p + segment.p) / 2; match.start = Math.min(match.start, segment.start); match.end = Math.max(match.end, segment.end); }
    else merged.push({ ...segment });
  }
  return merged;
}

function clusters(values, tolerance = 3) {
  const result = [];
  for (const value of [...values].sort((a, b) => a - b)) { const group = result.find((items) => near(items[0], value, tolerance)); if (group) group.push(value); else result.push([value]); }
  return result.map((items) => items.reduce((sum, value) => sum + value, 0) / items.length);
}

function vectorComponents(segments) {
  const pending = [...segments]; const components = [];
  while (pending.length) {
    const component = [pending.shift()];
    for (let changed = true; changed;) {
      changed = false;
      for (let index = pending.length - 1; index >= 0; index--) {
        const candidate = pending[index];
        const connected = component.some((item) => item.axis !== candidate.axis && (item.axis === 'h'
          ? overlap(item.start, item.end, candidate.p, candidate.p) && overlap(candidate.start, candidate.end, item.p, item.p)
          : overlap(candidate.start, candidate.end, item.p, item.p) && overlap(item.start, item.end, candidate.p, candidate.p)));
        if (connected) { component.push(...pending.splice(index, 1)); changed = true; }
      }
    }
    components.push(component);
  }
  return components;
}

function textForCell(lines, left, right, top, bottom) {
  const items = lines.flatMap((line) => line.items).filter((item) => {
    const centerX = item.x + item.width / 2; const centerY = item.y + item.height / 2;
    return centerX >= left - 2 && centerX <= right + 2 && centerY >= top - 2 && centerY <= bottom + 2;
  }).sort((a, b) => a.y - b.y || a.x - b.x);
  return items.map((item) => item.text).join(' ').trim();
}

function inferVectorTables(lines, segments) {
  const tables = [];
  for (const component of vectorComponents(segments)) {
    const horizontal = component.filter((item) => item.axis === 'h'); const vertical = component.filter((item) => item.axis === 'v');
    const xs = clusters(vertical.map((item) => item.p)); const ys = clusters(horizontal.map((item) => item.p));
    if (xs.length < 3 || ys.length < 3 || xs.length > 13 || ys.length > 101) continue;
    const minX = xs[0]; const maxX = xs.at(-1); const minY = ys[0]; const maxY = ys.at(-1);
    const outerCoverage = [ys.every((y) => horizontal.some((line) => near(line.p, y) && line.start <= minX + 4 && line.end >= maxX - 4)), xs.slice(0, 1).concat(xs.slice(-1)).every((x) => vertical.some((line) => near(line.p, x) && line.start <= minY + 4 && line.end >= maxY - 4))];
    if (!outerCoverage.every(Boolean)) continue;
    const tableLines = lines.filter((line) => line.y + line.height >= minY - 3 && line.y <= maxY + 3 && line.x + line.width >= minX - 3 && line.x <= maxX + 3);
    if (tableLines.length < 2) continue;
    const rows = [];
    for (let row = 0; row < ys.length - 1; row++) {
      const cells = []; let column = 0;
      while (column < xs.length - 1) {
        let span = 1;
        while (column + span < xs.length - 1 && !vertical.some((line) => near(line.p, xs[column + span]) && line.start <= ys[row] + 3 && line.end >= ys[row + 1] - 3)) span++;
        const content = textForCell(tableLines, xs[column], xs[column + span], ys[row], ys[row + 1]);
        cells.push({ column, span, content }); column += span;
      }
      rows.push({ top: ys[row], bottom: ys[row + 1], cells });
    }
    if (rows.filter((row) => row.cells.some((cell) => cell.content)).length < 2) continue;
    tables.push({ y: minY, rows, columnCount: xs.length - 1, widths: xs.slice(0, -1).map((x, index) => round((xs[index + 1] - x) / (maxX - minX) * 100, 3)), confidence: 'high', printableBorders: true, sourceLines: tableLines });
  }
  return tables.sort((a, b) => a.y - b.y);
}

function alignedGroups(lines) {
  const groups = []; let current = [];
  for (const line of [...lines].sort((a, b) => a.y - b.y)) {
    const gap = current.length ? line.y - current.at(-1).y : 0;
    if (current.length && gap > Math.max(36, current.at(-1).fontSize * 2.8)) { groups.push(current); current = []; }
    current.push(line);
  }
  if (current.length) groups.push(current);
  return groups;
}

function inferAlignedTables(lines, segments = []) {
  const tables = [];
  for (const group of alignedGroups(lines)) {
    const multi = group.filter((line) => line.items.length >= 2);
    const strongTwoRowTable = multi.length === 2
      && multi[0].items.some((item) => /^(?:item|description|product|service|qty|quantity|unit price|amount|total)$/i.test(item.text.trim()))
      && multi[1].items.slice(1).some((item) => /^[-+]?[$€£RM\s]*[\d,.%]+$/i.test(item.text.trim()));
    if (multi.length < 3 && !strongTwoRowTable) continue;
    const table = inferTable(multi); if (!table) continue;
    const sourceLines = [...table.rows];
    for (const line of group.filter((entry) => entry.items.length === 1)) {
      const previous = sourceLines.filter((entry) => entry.y < line.y).at(-1); const next = sourceLines.find((entry) => entry.y > line.y);
      if (previous && next && line.y - previous.y < 22 && near(line.x, previous.items[0].x, 10)) { previous.items[0].text += ` ${line.text}`; previous.text += ` ${line.text}`; previous.height = Math.max(previous.height, line.y + line.height - previous.y); sourceLines.push(line); }
    }
    const left = Math.min(...table.rows.flatMap((row) => row.items.map((item) => item.x)));
    const right = Math.max(...table.rows.flatMap((row) => row.items.map((item) => item.x + item.width)));
    const top = Math.min(...table.rows.map((row) => row.y)); const bottom = Math.max(...table.rows.map((row) => row.y + row.height));
    const nearbyBorders = segments.filter((segment) => segment.axis === 'h' ? segment.p >= top - 18 && segment.p <= bottom + 18 && overlap(segment.start, segment.end, left, right) : segment.p >= left - 8 && segment.p <= right + 80 && overlap(segment.start, segment.end, top, bottom));
    table.sourceLines = sourceLines; table.printableBorders = nearbyBorders.filter((segment) => segment.axis === 'h').length >= 2; tables.push(table);
  }
  return tables;
}

function textElement(line, index, pageWidth, margins) {
  const contentWidth = pageWidth - margins.left - margins.right;
  const left = Math.max(0, (line.x / POINTS_PER_CM) - margins.left);
  const right = Math.max(0, contentWidth - left - (line.width / POINTS_PER_CM));
  return {
    id: safeId('imported_text', index), type: 'text', content: line.text, column: 1,
    leftIndent: round(Math.min(Math.max(0, contentWidth - 1), left), 1),
    rightIndent: round(Math.min(Math.max(0, contentWidth - left - 4), right), 1),
    alignment: left > contentWidth * .55 ? 'right' : (left > contentWidth * .25 && right > contentWidth * .25 ? 'center' : 'left'),
    fontSize: round(line.fontSize, 1), fontWeight: /bold|black|heavy/i.test(line.fontFamily) ? '700' : '400', padding: 1
  };
}

function tableElement(table, index) {
  const rows = table.rows.map((line, row) => {
    if (!line.cells) return { id: safeId(`imported_row_${index + 1}`, row), heightCm: round(Math.max(.65, Math.min(3.2, line.height / POINTS_PER_CM + .25)), 2), repeat: false,
      cells: Array.from({ length: table.columnCount }, (_, column) => ({ id: safeId(`imported_cell_${index + 1}_${row + 1}`, column), content: line.items[column]?.text || '', binding: '', alignment: column > 0 && /^[-+]?[$€£RM\s]*[\d,.%]+$/i.test(line.items[column]?.text || '') ? 'right' : 'left', padding: 4, colSpan: 1 })) };
    const cells = Array.from({ length: table.columnCount }, (_, column) => ({ id: safeId(`imported_cell_${index + 1}_${row + 1}`, column), content: '', binding: '', alignment: 'left', padding: 4, colSpan: 1 }));
    for (const cell of line.cells) { cells[cell.column].content = cell.content; cells[cell.column].colSpan = cell.span; cells[cell.column].alignment = cell.column > 0 && /^[-+]?[$€£RM\s]*[\d,.%]+$/i.test(cell.content) ? 'right' : 'left'; for (let hidden = 1; hidden < cell.span; hidden++) cells[cell.column + hidden].hidden = true; }
    return { id: safeId(`imported_row_${index + 1}`, row), heightCm: round(Math.max(.65, Math.min(3.2, (line.bottom - line.top) / POINTS_PER_CM)), 2), repeat: false, cells };
  });
  return {
    id: safeId('imported_table', index), type: 'table', column: 1, width: 100, printableBorders: table.printableBorders !== false, repeatingSource: '',
    columns: table.widths.map((width, column) => ({ id: safeId(`imported_col_${index + 1}`, column), label: `Column ${column + 1}`, width })),
    rows
  };
}

function imageElement(image, index, pageWidth, margins) {
  const contentWidth = pageWidth - margins.left - margins.right;
  const left = Math.max(0, image.x / POINTS_PER_CM - margins.left); const widthCm = Math.min(contentWidth, image.width / POINTS_PER_CM);
  return { id: safeId('imported_image', index), type: 'image', content: `Imported image ${index + 1}`, source: image.source, column: 1,
    leftIndent: round(Math.min(Math.max(0, contentWidth - .5), left), 1), rightIndent: 0, alignment: 'left', padding: 1,
    imageWidthCm: round(widthCm, 2), imageHeightCm: round(Math.min(15, image.height / POINTS_PER_CM), 2) };
}

async function analyzePdf(buffer, name = 'Imported PDF') {
  let pdf; let loadingTask; let pdfjs;
  try {
    pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer), disableWorker: true, isEvalSupported: false, useSystemFonts: true, stopAtErrors: true, maxImageSize: 10_000_000 });
    pdf = await loadingTask.promise;
  } catch (error) {
    const message = /password/i.test(error?.name || error?.message || '') ? 'This PDF is password-protected and cannot be imported.' : 'The PDF is corrupted or unsupported.';
    throw new AppError(message, 422);
  }
  try {
    if (pdf.numPages > MAX_PDF_PAGES) throw new AppError(`PDF import is limited to ${MAX_PDF_PAGES} pages. No pages were imported.`, 422);
    const imageCache = new Map();
    const analyzePage = async (pageNumber) => {
    let page;
    try { page = await pdf.getPage(pageNumber); } catch { throw new AppError(`Page ${pageNumber} is corrupted or unsupported. No pages were imported.`, 422); }
    const viewport = page.getViewport({ scale: 1 });
    const widthCm = viewport.width / POINTS_PER_CM; const heightCm = viewport.height / POINTS_PER_CM;
    const orientation = widthCm > heightCm ? 'landscape' : 'portrait';
    const expected = orientation === 'portrait' ? [21, 29.7] : [29.7, 21];
    if (Math.abs(widthCm - expected[0]) > .8 || Math.abs(heightCm - expected[1]) > .8) throw new AppError(`Page ${pageNumber} is not A4. No pages were imported.`, 422);
    let text; let operators;
    try { text = await page.getTextContent({ disableNormalization: false }); operators = await page.getOperatorList(); } catch { throw new AppError(`Page ${pageNumber} is corrupted or unsupported. No pages were imported.`, 422); }
    const OPS = pdfjs.OPS;
    const imageCount = operators.fnArray.filter((operation) => [OPS.paintImageXObject, OPS.paintInlineImageXObject, OPS.paintImageMaskXObject].includes(operation)).length;
    const extractedImages = await extractImages(page, operators, pdfjs, viewport, imageCache);
    const vectorSegments = extractVectorSegments(operators, pdfjs, viewport);
    const lineCount = operators.fnArray.filter((operation) => operation === OPS.constructPath || operation === OPS.stroke).length;
    const lines = groupTextItems(text.items, viewport.height);
    if (!lines.length) throw new AppError(`Page ${pageNumber} appears scanned or image-only. No pages were imported.`, 422);
    const margins = { top: 1, right: 1, bottom: 1, left: 1 };
    const possibleHeader = lines.filter((line) => line.y < viewport.height * .14); const possibleFooter = lines.filter((line) => line.y > viewport.height * .86);
    const headerLines = lines.filter((line) => line.y < viewport.height * .08);
    const footerLines = lines.filter((line) => line.y > viewport.height * .92);
    let bodyLines = lines.filter((line) => !headerLines.includes(line) && !footerLines.includes(line));
    const vectorTables = inferVectorTables(bodyLines, vectorSegments);
    const vectorLines = new Set(vectorTables.flatMap((table) => table.sourceLines));
    bodyLines = bodyLines.filter((line) => !vectorLines.has(line));
    const alignedTables = inferAlignedTables(bodyLines, vectorSegments);
    const alignedLines = new Set(alignedTables.flatMap((table) => table.sourceLines));
    bodyLines = bodyLines.filter((line) => !alignedLines.has(line));
    const detectedTables = [...vectorTables, ...alignedTables].sort((left, right) => left.y - right.y);
    const pageCm = orientation === 'portrait' ? { width: 21, height: 29.7 } : { width: 29.7, height: 21 };
    const regionForY = (y) => y < viewport.height * .08 ? 'header' : y > viewport.height * .92 ? 'footer' : 'body';
    const regions = { header: [], body: [], footer: [] };
    const idOffset = pageNumber * 10000;
    for (const [prefix, source] of [[1, headerLines], [2, bodyLines], [3, footerLines]]) source.forEach((line, index) => regions[regionForY(line.y)].push({ y: line.y, element: textElement(line, idOffset + index + prefix * 100, pageCm.width, margins) }));
    extractedImages.forEach((image, index) => regions[regionForY(image.y)].push({ y: image.y, element: imageElement(image, idOffset + index, pageCm.width, margins) }));
    detectedTables.forEach((table, index) => regions.body.push({ y: table.y, element: tableElement(table, idOffset + index) }));
    for (const region of Object.keys(regions)) regions[region] = regions[region].sort((a, b) => a.y - b.y).map((entry) => entry.element);
    return { page: { size: 'A4', orientation, margins, headerFromTop: .7, footerFromBottom: .7, showMarginGuides: true, showGrid: false, headerColumns: 1, footerColumns: 1 }, regions,
      summary: { pageNumber, page: { width: round(widthCm), height: round(heightCm), size: 'A4', orientation }, textBlocks: lines.length, images: imageCount, importedImages: extractedImages.length, skippedImages: Math.max(0, imageCount - extractedImages.length), lines: lineCount, tables: detectedTables.length, possibleHeader: possibleHeader.length ? { confidence: headerLines.length ? 'high' : 'medium' } : null, possibleFooter: possibleFooter.length ? { confidence: footerLines.length ? 'high' : 'medium' } : null, possibleRepeatingRow: detectedTables.length ? { confidence: 'low' } : null } };
    };
    const physicalPages = [];
    for (let start = 1; start <= pdf.numPages; start += 4) {
      const batch = Array.from({ length: Math.min(4, pdf.numPages - start + 1) }, (_, index) => analyzePage(start + index));
      physicalPages.push(...await Promise.all(batch));
    }
    const orientations = new Set(physicalPages.map((entry) => entry.page.orientation));
    if (orientations.size > 1) throw new AppError('Mixed portrait and landscape pages are not supported. No pages were imported.', 422);
    const first = physicalPages[0];
    const template = {
      templateKey: `template_${Date.now()}`, name: `${String(name).replace(/\.pdf$/i, '').slice(0, 145)} — imported`, status: 'draft', source: 'module:customers', updatedAt: new Date().toISOString(),
      page: first.page, regions: first.regions,
      ...(physicalPages.length > 1 ? { pages: physicalPages.map(({ page, regions }) => ({ page, regions })) } : {})
    };
    const summaries = physicalPages.map((entry) => entry.summary);
    return { template, detectedLayout: { ...summaries[0], pageCount: summaries.length, pages: summaries, textBlocks: summaries.reduce((sum, page) => sum + page.textBlocks, 0), images: summaries.reduce((sum, page) => sum + page.images, 0), importedImages: summaries.reduce((sum, page) => sum + page.importedImages, 0), skippedImages: summaries.reduce((sum, page) => sum + page.skippedImages, 0), lines: summaries.reduce((sum, page) => sum + page.lines, 0), tables: summaries.reduce((sum, page) => sum + page.tables, 0) } };
  } finally { await loadingTask?.destroy().catch(() => {}); }
}

module.exports = { MAX_PDF_BYTES, MAX_PDF_PAGES, validatePdfUpload, groupTextItems, inferTable, extractVectorSegments, inferVectorTables, inferAlignedTables, imageDataUrl, analyzePdf };
