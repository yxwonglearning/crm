/* Canonical output renderer, shared by Preview and the server's Chromium worker. */
(function (root) {
  'use strict';
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const number = (value, fallback, min, max) => Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : fallback));
  function geometry(page) {
    if (page.size === 'custom' && Number.isFinite(Number(page.widthCm)) && Number.isFinite(Number(page.heightCm))) return { width: Number(page.widthCm), height: Number(page.heightCm) };
    return page.orientation === 'landscape' ? { width: 29.7, height: 21 } : { width: 21, height: 29.7 };
  }
  function lookup(object, path) {
    return String(path || '').split('.').reduce((value, key) => (
      value && !['__proto__', 'prototype', 'constructor'].includes(key) && Object.hasOwn(value, key) ? value[key] : undefined
    ), object);
  }
  function value(binding, context, item, source) {
    const resolved = item && source && binding.startsWith(`${source}.`)
      ? lookup(item, binding.slice(source.length + 1)) : lookup(context, binding);
    return resolved == null || typeof resolved === 'object' ? '' : String(resolved);
  }
  function field(binding, context, item, source) {
    if (binding === 'system.page_number' || binding === 'system.total_pages') {
      return `<span data-page-value="${binding.split('.').pop()}">000</span>`;
    }
    return escape(value(binding, context, item, source));
  }
  const alignment = (v) => ['left', 'center', 'right'].includes(v) ? v : 'left';
  function block(element, context) {
    const style = `grid-column:${number(element.column, 1, 1, 3)};text-align:${alignment(element.alignment)};padding:${number(element.padding, 4, 0, 40)}px;margin-top:${number(element.spacingBefore, 0, 0, 2)}cm;margin-left:${number(element.leftIndent, 0, 0, 28)}cm;margin-right:${number(element.rightIndent, 0, 0, 28)}cm;font-size:${number(element.fontSize, 11, 7, 48)}pt;font-weight:${['400', '600', '700'].includes(String(element.fontWeight)) ? element.fontWeight : '400'}`;
    if (element.type === 'image') {
      const source = String(element.source || '');
      const content = /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(source)
        ? `<img src="${escape(source)}" alt="${escape(element.content)}" style="${element.imageWidthCm ? `width:${number(element.imageWidthCm, 1, .1, 28)}cm;height:${number(element.imageHeightCm, 1, .1, 15)}cm` : ''}">`
        : `<span class="image-placeholder">◇</span><strong>${escape(element.content || 'Organization logo')}</strong>`;
      return `<div class="output-block output-image" style="${style}">${content}</div>`;
    }
    return `<div class="output-block" style="${style}">${element.type === 'field' ? field(element.binding, context) : escape(element.content)}</div>`;
  }
  function tableRows(table, context) {
    const rows = [];
    for (const row of table.rows) {
      const items = row.repeat && table.repeatingSource ? lookup(context, table.repeatingSource) : null;
      if (items !== null && items !== undefined && !Array.isArray(items)) throw new Error('Repeating source must be a collection.');
      const instances = row.repeat && table.repeatingSource ? (items || []) : [null];
      if (instances.length > 500) throw new Error('A repeating table is limited to 500 rows.');
      for (const item of instances) {
        rows.push(`<tr style="height:${number(row.heightCm, .9, .65, 3.2)}cm">${row.cells.filter((cell) => !cell.hidden).map((cell) => `<td colspan="${number(cell.colSpan, 1, 1, 12)}" style="padding:${number(cell.padding, 6, 0, 24)}px;text-align:${alignment(cell.alignment)}"><div class="output-cell">${cell.binding ? field(cell.binding, context, item, table.repeatingSource) : escape(cell.content)}</div></td>`).join('')}</tr>`);
      }
    }
    return rows;
  }
  function tableShell(table) {
    const sum = table.columns.reduce((total, col) => total + number(col.width, 8, 8, 100), 0);
    return `<div class="output-table ${table.printableBorders ? 'with-borders' : ''}" style="margin-top:${number(table.spacingBefore, 0, 0, 2)}cm"><table><colgroup>${table.columns.map((col) => `<col style="width:${number(col.width, 8, 8, 100) / sum * 100}%">`).join('')}</colgroup><tbody></tbody></table></div>`;
  }
  const css = `
    *{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff}
    .output-page{position:relative;overflow:hidden;color:#242129;background:#fff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:11pt;line-height:1.35;break-after:page;break-inside:avoid}
    .output-page:last-child{break-after:auto}
    .output-region{position:absolute;display:grid;align-content:start;min-width:0;padding:5px;border:1px solid transparent;overflow-wrap:anywhere}
    .output-header,.output-footer{height:2.1cm;align-items:center}
    .output-body{padding-top:12px;padding-bottom:12px}
    .output-block{display:block;min-width:0;min-height:24px;border:1px solid transparent;border-radius:2px;white-space:pre-line;overflow-wrap:anywhere;line-height:1.25}
    .output-image{display:flex;gap:8px;align-items:center;color:#6d6678}.output-image img{max-width:100%;object-fit:contain}.image-placeholder{display:grid;place-items:center;width:40px;height:40px;border:1px solid #a9a2b2;font-size:22px}
    .output-table{grid-column:1/-1;width:100%;min-width:0;margin:10px 0;padding:2px;border:2px solid transparent}
    .output-table table{width:100%;min-width:0;max-width:100%;table-layout:fixed;border-collapse:collapse}
    .output-table td{border:1px solid transparent;overflow-wrap:anywhere;word-break:break-word;vertical-align:middle}
    .output-table.with-borders td{border-color:#4f4b55}.output-cell{min-height:28px;font-size:9pt;line-height:1.25;white-space:pre-line;overflow-wrap:anywhere}
    [data-page-value]{display:inline-block;min-width:3ch;font-variant-numeric:tabular-nums}
    @media print{html,body{margin:0!important;padding:0!important}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  `;
  async function mount(host, template, context = {}) {
    const doc = host.ownerDocument;
    const definitions = template.pages?.length ? template.pages : [{ page: template.page, regions: template.regions }];
    const size = geometry(definitions[0].page);
    host.replaceChildren();
    const style = doc.createElement('style');
    style.textContent = `${css}@page{size:${size.width}cm ${size.height}cm;margin:0}`;
    host.append(style);
    const makeNode = (html) => { const wrapper = doc.createElement('div'); wrapper.innerHTML = html; return wrapper.firstElementChild; };
    const pages = [];
    let body; let currentPage; let currentRegions;
    function newPage(page = currentPage, regions = currentRegions) {
      if (pages.length >= 100) throw new Error('Document exceeds the 100-page limit.');
      currentPage = page; currentRegions = regions;
      const pageSize = geometry(page); const top = Math.max(page.margins.top, page.headerFromTop + 2.1); const bottom = Math.max(page.margins.bottom, page.footerFromBottom + 2.1);
      const sheet = doc.createElement('article');
      sheet.className = 'output-page'; sheet.style.cssText = `width:${pageSize.width}cm;height:${pageSize.height}cm`;
      for (const region of ['header', 'body', 'footer']) {
        const section = doc.createElement('section'); section.className = `output-region output-${region}`;
        const columns = region === 'body' ? 1 : page[`${region}Columns`];
        section.style.cssText = `left:${page.margins.left}cm;right:${page.margins.right}cm;grid-template-columns:repeat(${columns},minmax(0,1fr));` + (region === 'body' ? `top:${top}cm;bottom:${bottom}cm` : region === 'header' ? `top:${page.headerFromTop}cm` : `bottom:${page.footerFromBottom}cm`);
        if (region === 'body') body = section;
        else for (const element of regions[region]) {
          if (element.type === 'table') {
            const node = makeNode(tableShell(element)); node.querySelector('tbody').innerHTML = tableRows(element, context).join(''); section.append(node);
          } else section.insertAdjacentHTML('beforeend', block(element, context));
        }
        sheet.append(section);
      }
      host.append(sheet); pages.push(sheet);
    }
    const fits = () => body.scrollHeight <= body.clientHeight + 1;
    for (const [definitionIndex, definition] of definitions.entries()) {
    const explicitPage = definitions.length > 1; newPage(definition.page, definition.regions);
    for (const element of definition.regions.body) {
      if (element.type !== 'table') {
        const node = makeNode(block(element, context)); body.append(node);
        if (!fits() && !explicitPage) { node.remove(); newPage(); body.append(node); }
        if (!fits()) throw new Error('A text/image block is taller than the body region. Split it into smaller blocks.');
      } else {
        const rows = tableRows(element, context);
        if (!rows.length) continue;
        let table = makeNode(tableShell(element)); body.append(table);
        // The first non-repeating row is the existing table heading convention.
        const header = !element.rows[0]?.repeat ? rows[0] : null;
        let count = 0;
        for (let index = 0; index < rows.length; index++) {
          let row = makeNode(`<table><tbody>${rows[index]}</tbody></table>`).querySelector('tr');
          table.querySelector('tbody').append(row);
          if (!fits()) {
            row.remove();
            if (!count || (header && count === 1 && index === 1)) table.remove();
            if (explicitPage) throw new Error(`Imported page ${definitionIndex + 1} content exceeds its physical page.`);
            newPage(); table = makeNode(tableShell(element)); body.append(table); count = 0;
            if (header && index > 0) table.querySelector('tbody').insertAdjacentHTML('beforeend', header);
            table.querySelector('tbody').append(row);
            if (!fits()) throw new Error('A table row is taller than the body region. Reduce its content or split the row.');
          }
          count++;
        }
      }
    }
    }
    await Promise.all(Array.from(host.querySelectorAll('img'), (img) => img.decode()));
    for (let index = 0; index < pages.length; index++) {
      const sheet = pages[index];
      sheet.querySelectorAll('[data-page-value]').forEach((node) => { node.textContent = node.dataset.pageValue === 'page_number' ? index + 1 : pages.length; });
      for (const region of sheet.querySelectorAll('.output-region')) {
        if (region.scrollHeight > region.clientHeight + 1 || region.scrollWidth > region.clientWidth + 1) throw new Error('Content exceeds a page region. Reduce content, indents, or formatting.');
      }
    }
    return pages.length;
  }
  const api = { geometry, lookup, value, mount, css };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DocumentOutput = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
