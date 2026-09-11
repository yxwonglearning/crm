const assert = require('node:assert/strict');
const suggestions = require('../../public/document-binding-suggestions');

const fields = [
  { label: 'Invoice Number', binding: 'record.invoice_number', type: 'number' },
  { label: 'Request Number', binding: 'workflow.request_number', type: 'number' },
  { label: 'Invoice Date', binding: 'record.invoice_date', type: 'date' },
  { label: 'Total Amount', binding: 'record.total_amount', type: 'currency' },
  { label: 'Description', binding: 'record.items.description', type: 'multiline' },
  { label: 'Quantity', binding: 'record.items.quantity', type: 'number' }
];

const best = (target, available = fields, rejected) => suggestions.suggest(target, available, rejected)[0];
assert.equal(best({ id: 'a', text: 'Invoice Number: INV-001' }).binding, 'record.invoice_number', 'exact labels match');
assert.equal(best({ id: 'b', text: 'Invoice No.: INV-001' }).binding, 'record.invoice_number', 'Invoice No normalizes to Invoice Number');
assert.equal(best({ id: 'c', text: 'Req No: REQ-22' }).binding, 'workflow.request_number', 'Req No normalizes to Request Number');
assert.equal(best({ id: 'd', text: '10/09/2026' }).binding, 'record.invoice_date', 'date shapes prefer date fields');
assert.equal(best({ id: 'e', text: 'RM 2,500.00' }).binding, 'record.total_amount', 'currency shapes prefer currency fields');
assert.equal(suggestions.suggest({ id: 'f', text: 'INVOICE' }, fields).length, 0, 'static headings are not suggested');
assert.notEqual(best({ id: 'g', text: 'Date: 10/09/2026' }).confidence, 'high', 'ambiguous generic labels are not overstated');
assert.equal(suggestions.suggest({ id: 'h', text: 'Secret: ABC' }, fields).some((match) => match.binding === 'record.secret'), false, 'fields absent from the authorized set cannot be suggested');
const rejected = new Set(['i:record.invoice_number']); assert.equal(suggestions.suggest({ id: 'i', text: 'Invoice No: INV-1' }, fields, rejected).some((match) => match.binding === 'record.invoice_number'), false, 'rejected matches stay suppressed for the session');
assert.equal(best({ id: 'j', text: 'Description', tableHeader: true }).binding, 'record.items.description', 'table headings suggest column fields');
assert.equal(best({ id: 'k', text: '12', label: 'Qty' }).binding, 'record.items.quantity', 'repeating-row values use their column heading without setting repeat state');
const template = { page: {}, regions: {}, pages: [1, 2].map((page) => ({ page: {}, regions: { header: [], body: [{ id: `p${page}`, type: 'text', content: 'Invoice No: INV-1' }], footer: [] } })) };
const multi = suggestions.all(template, fields); assert.deepEqual(multi.map((entry) => entry.target.page), [1, 2]); assert.equal(multi.every((entry) => entry.matches[0].confidence === 'medium'), true, 'duplicate high-confidence fields across pages are downgraded');
console.log('Document binding suggestion checks passed: labels, abbreviations, types, static/authorization guards, rejection, tables, multi-page and conflicts.');
