const { z } = require('zod');

const key = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const binding = z.string().max(200).regex(/^(?!.*(?:__proto__|prototype|constructor))[a-zA-Z0-9_.]*$/);
const alignment = z.enum(['left', 'center', 'right']).default('left');
const cell = z.object({
  id: key, content: z.string().max(10000).default(''), binding: binding.default(''),
  alignment, padding: z.number().min(0).max(24).default(6),
  colSpan: z.number().int().min(1).max(12).default(1), hidden: z.boolean().optional()
});
const element = z.object({
  id: key, type: z.enum(['text', 'field', 'image', 'table']),
  content: z.string().max(20000).optional(), label: z.string().max(200).optional(), binding: binding.optional(),
  column: z.number().int().min(1).max(3).default(1),
  leftIndent: z.number().min(0).max(28).default(0), rightIndent: z.number().min(0).max(28).default(0),
  alignment, fontSize: z.number().min(7).max(48).default(11), fontWeight: z.enum(['400', '600', '700']).default('400'),
  padding: z.number().min(0).max(40).default(4),
  spacingBefore: z.number().min(0).max(2).default(0),
  source: z.string().max(700000).regex(/^(?:data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+)?$/).optional(),
  imageWidthCm: z.number().min(.1).max(28).optional(), imageHeightCm: z.number().min(.1).max(15).optional(),
  width: z.literal(100).optional(), printableBorders: z.boolean().optional(), layoutRole: z.enum(['data', 'form']).optional(), repeatingSource: binding.optional(),
  columns: z.array(z.object({ id: key, label: z.string().max(200), width: z.number().min(8).max(100) })).min(2).max(12).optional(),
  rows: z.array(z.object({ id: key, heightCm: z.number().min(.65).max(3.2), repeat: z.boolean().default(false), cells: z.array(cell).min(2).max(12) })).min(1).max(100).optional()
}).superRefine((item, ctx) => {
  if (item.type === 'image' && item.source) {
    const bytes = Buffer.from(item.source.split(',')[1] || '', 'base64');
    const png = item.source.startsWith('data:image/png;');
    const valid = png
      ? bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(16) <= 4096 && bytes.readUInt32BE(20) > 0 && bytes.readUInt32BE(20) <= 4096
      : bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217;
    if (!valid) ctx.addIssue({ code: 'custom', message: 'Invalid or oversized PNG/JPEG image.' });
  }
  if (item.type !== 'table') return;
  if (!item.columns || !item.rows) return ctx.addIssue({ code: 'custom', message: 'Table columns and rows are required.' });
  for (const row of item.rows) {
    const spans = row.cells.filter((entry) => !entry.hidden).reduce((sum, entry) => sum + entry.colSpan, 0);
    if (row.cells.length !== item.columns.length || spans !== item.columns.length) ctx.addIssue({ code: 'custom', message: 'Invalid merged table cells.' });
  }
});
const pageSchema = z.object({
  size: z.enum(['A4', 'custom']), orientation: z.enum(['portrait', 'landscape']),
  widthCm: z.number().min(7).max(43.2).optional(), heightCm: z.number().min(7).max(43.2).optional(),
  margins: z.object({ top: z.number().min(0).max(15), bottom: z.number().min(0).max(15), left: z.number().min(0).max(26), right: z.number().min(0).max(26) }),
  headerFromTop: z.number().min(.5).max(3), footerFromBottom: z.number().min(.5).max(3),
  headerColumns: z.number().int().min(1).max(3), footerColumns: z.number().int().min(1).max(3),
  showMarginGuides: z.boolean().default(true), showGrid: z.boolean().default(false)
});
const regionsSchema = z.object({ header: z.array(element).max(30), body: z.array(element).max(200), footer: z.array(element).max(30) });
const physicalPageSchema = z.object({ page: pageSchema, regions: regionsSchema });
const templateSchema = z.object({
  templateKey: key, name: z.string().trim().min(1).max(160), status: z.enum(['draft', 'sample', 'published']).default('draft'),
  source: z.string().regex(/^(?:module:[a-zA-Z0-9_]+|form:[a-zA-Z0-9_-]+|workflow)$/), updatedAt: z.string().optional(),
  page: pageSchema,
  regions: regionsSchema,
  pages: z.array(physicalPageSchema).min(2).max(25).optional()
}).superRefine((template, ctx) => {
  const pages = template.pages || [{ page: template.page, regions: template.regions }];
  for (const physicalPage of pages) {
  const p = physicalPage.page;
  const width = p.size === 'custom' ? p.widthCm : (p.orientation === 'portrait' ? 21 : 29.7);
  const height = p.size === 'custom' ? p.heightCm : (p.orientation === 'portrait' ? 29.7 : 21);
  if (!Number.isFinite(width) || !Number.isFinite(height)) { ctx.addIssue({ code: 'custom', message: 'Custom page dimensions are required.' }); continue; }
  if (width - p.margins.left - p.margins.right < 3 || height - Math.max(p.margins.top, p.headerFromTop + 2.1) - Math.max(p.margins.bottom, p.footerFromBottom + 2.1) < 5) ctx.addIssue({ code: 'custom', message: 'Margins leave insufficient body space.' });
  for (const [region, elements] of Object.entries(physicalPage.regions)) {
    const columns = region === 'body' ? 1 : p[`${region}Columns`];
    for (const item of elements) if (item.type !== 'table' && (item.column > columns || item.leftIndent + item.rightIndent >= (width - p.margins.left - p.margins.right) / columns - .3)) ctx.addIssue({ code: 'custom', message: 'Element column or indents exceed the region.' });
  }
  }
});
const contextSchema = z.object({
  recordId: z.number().int().positive().safe().optional(), workflowRequestId: z.string().min(1).max(100).optional(),
  revision: z.number().int().positive().optional()
}).strict();
module.exports = { key, templateSchema, contextSchema };
