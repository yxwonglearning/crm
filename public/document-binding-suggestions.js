(function (root) {
  'use strict';
  const abbreviations = new Map([['no', 'number'], ['num', 'number'], ['inv', 'invoice'], ['req', 'request'], ['qty', 'quantity']]);
  const staticLabels = /^(?:invoice|purchase order|quotation|delivery order|claim|approval form|prepared for|description|quantity|terms(?: and conditions)?|thank you)$/i;
  const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean).map((word) => abbreviations.get(word) || word).join(' ');
  function valueType(value) {
    const text = String(value || '').trim();
    if (/^(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{1,2}-\d{1,2})$/.test(text)) return 'date';
    if (/^(?:RM|MYR|USD|EUR|GBP|[$€£])\s*[-+]?\d[\d,.]*(?:\.\d+)?$/i.test(text)) return 'currency';
    if (/^[-+]?\d[\d,.]*(?:\.\d+)?%?$/.test(text)) return 'number';
    if (/^[A-Z]{2,8}[-/]?\d[-A-Z0-9/]*$/i.test(text) && /\d/.test(text)) return 'reference';
    return 'text';
  }
  function targetParts(target) {
    const text = String(target.text || '').trim(); const colon = text.match(/^(.{2,60}?)\s*:\s*(.+)$/);
    return { label: normalize(target.label || colon?.[1] || (target.tableHeader ? text : '')), value: colon?.[2] || (target.tableHeader ? '' : text) };
  }
  function score(target, field) {
    const parts = targetParts(target); const fieldLabel = normalize(field.label); const fieldKey = normalize(field.binding.split('.').pop());
    let points = 0; const reasons = [];
    if (parts.label && (parts.label === fieldLabel || parts.label === fieldKey)) { points += 100; reasons.push('label match'); }
    else if (parts.label && (fieldLabel.includes(parts.label) || parts.label.includes(fieldLabel) || fieldKey.includes(parts.label))) { points += 68; reasons.push('similar label'); }
    else if (parts.label) {
      const words = new Set(parts.label.split(' ')); const overlap = fieldLabel.split(' ').filter((word) => words.has(word)).length;
      if (overlap) { points += overlap * 24; reasons.push('shared label words'); }
    }
    const detected = valueType(parts.value); const expected = field.type || 'text';
    const compatible = detected === expected || (detected === 'currency' && expected === 'number') || (detected === 'reference' && expected === 'number');
    if (parts.value && compatible) { points += detected === expected ? (parts.label ? 18 : 45) : (parts.label ? 10 : 25); reasons.push(`${detected} value`); }
    else if (parts.value && ['date', 'currency', 'number'].includes(detected)) points -= 55;
    if (target.tableHeader && parts.label) points += 12;
    return { points, reasons, detected };
  }
  function suggest(target, fields, rejected = new Set()) {
    if (!target || target.binding || !String(target.text || '').trim()) return [];
    const parts = targetParts(target); if (!parts.label && staticLabels.test(String(target.text).trim())) return [];
    return fields.map((field) => ({ ...field, ...score(target, field) }))
      .filter((match) => match.points >= 42 && !rejected.has(`${target.id}:${match.binding}`))
      .sort((left, right) => right.points - left.points || left.label.localeCompare(right.label))
      .map((match) => ({ ...match, confidence: match.points >= 90 ? 'high' : match.points >= 60 ? 'medium' : 'low' }));
  }
  function all(template, fields, rejected = new Set()) {
    const pages = template.pages?.length ? template.pages : [{ page: template.page, regions: template.regions }]; const results = [];
    pages.forEach((page, pageIndex) => Object.values(page.regions).forEach((elements) => elements.forEach((element) => {
      if (element.type === 'text') results.push({ target: { id: element.id, text: element.content, binding: '', page: pageIndex + 1 }, matches: suggest({ id: element.id, text: element.content, binding: '', page: pageIndex + 1 }, fields, rejected) });
      if (element.type === 'table') element.rows.forEach((row, rowIndex) => row.cells.forEach((cell, columnIndex) => { if (!cell.hidden) { const target = { id: cell.id, text: cell.content, binding: cell.binding, page: pageIndex + 1, tableHeader: rowIndex === 0, tableId: element.id, rowIndex, columnIndex }; results.push({ target, matches: suggest(target, fields, rejected) }); } }));
    })));
    const highUse = new Map(); results.forEach((entry) => { const match = entry.matches[0]; if (match?.confidence === 'high') highUse.set(match.binding, (highUse.get(match.binding) || 0) + 1); });
    results.forEach((entry) => { if (entry.matches[0]?.confidence === 'high' && highUse.get(entry.matches[0].binding) > 1) entry.matches[0].confidence = 'medium'; });
    return results.filter((entry) => entry.matches.length);
  }
  const api = { normalize, valueType, suggest, all };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DocumentBindingSuggestions = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
