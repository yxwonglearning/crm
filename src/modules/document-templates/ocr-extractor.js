const { AppError } = require('../../shared/errors');

const OCR_RENDER_SCALE = 2;
const OCR_TIMEOUT_MS = 60_000;
const confidenceCategory = (value) => value >= 80 ? 'high' : value >= 55 ? 'medium' : 'low';

function normalizeOcrBlocks(blocks, viewport, renderedWidth, renderedHeight, pageNumber) {
  const scaleX = viewport.width / renderedWidth; const scaleY = viewport.height / renderedHeight;
  const lines = (blocks || []).flatMap((block) => block.paragraphs || []).flatMap((paragraph) => paragraph.lines || []).map((line) => {
    const words = (line.words || []).filter((word) => word.text?.trim() && word.bbox).map((word) => ({
      text: word.text.trim(), x: word.bbox.x0 * scaleX, y: word.bbox.y0 * scaleY,
      width: Math.max(1, (word.bbox.x1 - word.bbox.x0) * scaleX), height: Math.max(1, (word.bbox.y1 - word.bbox.y0) * scaleY),
      fontSize: Math.max(7, Math.min(48, (word.bbox.y1 - word.bbox.y0) * scaleY)), fontFamily: '',
      confidence: confidenceCategory(Number(word.confidence) || 0), confidenceScore: Number(word.confidence) || 0, pageNumber
    })).sort((left, right) => left.x - right.x);
    const items = [];
    for (const word of words) {
      const previous = items.at(-1); const gap = previous ? word.x - (previous.x + previous.width) : Infinity;
      if (previous && gap <= Math.max(18, Math.max(previous.height, word.height) * 1.8)) {
        previous.text += ` ${word.text}`; previous.width = word.x + word.width - previous.x; previous.height = Math.max(previous.height, word.height);
        previous.confidenceScore = (previous.confidenceScore * previous.wordCount + word.confidenceScore) / (previous.wordCount + 1); previous.wordCount += 1;
        previous.confidence = confidenceCategory(previous.confidenceScore);
      } else items.push({ ...word, wordCount: 1 });
    }
    if (!items.length) return null;
    const first = items[0]; const last = items.at(-1); const scores = items.map((item) => item.confidenceScore);
    return { ...first, text: items.map((item) => item.text).join(' '), width: last.x + last.width - first.x,
      height: Math.max(...items.map((item) => item.height)), confidenceScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      confidence: confidenceCategory(scores.reduce((sum, score) => sum + score, 0) / scores.length), items };
  }).filter(Boolean).sort((left, right) => left.y - right.y || left.x - right.x);
  return lines;
}

async function withTimeout(promise, milliseconds, pageNumber) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new AppError(`OCR timed out on page ${pageNumber}. No pages were imported.`, 422)), milliseconds); })]);
  } finally { clearTimeout(timer); }
}

class OCRExtractor {
  constructor(options = {}) { this.options = options; this.worker = null; this.queue = Promise.resolve(); }

  async getWorker() {
    if (this.worker) return this.worker;
    const { createWorker, OEM } = this.options.tesseract || require('tesseract.js');
    const language = this.options.language || require('@tesseract.js-data/eng');
    this.worker = await createWorker(language.code, OEM.LSTM_ONLY, { langPath: language.langPath, gzip: language.gzip, cacheMethod: 'none' });
    return this.worker;
  }

  extract(page, viewport, pageNumber) {
    const run = async () => {
      try {
        const { createCanvas } = this.options.canvas || require('@napi-rs/canvas');
        const renderedViewport = page.getViewport({ scale: OCR_RENDER_SCALE });
        const canvas = createCanvas(Math.ceil(renderedViewport.width), Math.ceil(renderedViewport.height));
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: renderedViewport }).promise;
        const worker = await this.getWorker();
        const result = await withTimeout(worker.recognize(canvas.toBuffer('image/png'), {}, { text: true, blocks: true }), OCR_TIMEOUT_MS, pageNumber);
        const lines = normalizeOcrBlocks(result.data.blocks, viewport, canvas.width, canvas.height, pageNumber);
        return { lines, confidenceScore: Number(result.data.confidence) || 0, confidence: confidenceCategory(Number(result.data.confidence) || 0) };
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(`OCR failed on page ${pageNumber}. No pages were imported.`, 422);
      }
    };
    const result = this.queue.then(run, run); this.queue = result.catch(() => {}); return result;
  }

  async close() { await this.worker?.terminate().catch(() => {}); this.worker = null; }
}

module.exports = { OCRExtractor, OCR_RENDER_SCALE, OCR_TIMEOUT_MS, confidenceCategory, normalizeOcrBlocks };
