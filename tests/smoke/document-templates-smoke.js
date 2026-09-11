const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'public/styles.css'), 'utf8');

for (const id of [
  'adminDocumentTemplatesSection', 'documentTemplateList', 'newDocumentTemplateButton',
  'documentDesignerWorkspace', 'documentPage', 'documentFieldPalette', 'documentProperties',
  'documentCoordinateSystem', 'documentRulerTicks', 'documentVerticalRulerTicks', 'documentPageTab',
  'documentFieldsTab', 'documentElementsTab', 'documentFieldSearch',
  'documentDesignMode', 'documentPreviewMode', 'printDocumentTemplate',
  'workflowDocumentEnabled', 'workflowDocumentTemplate', 'openWorkflowDocumentDesigner'
]) assert.match(html, new RegExp(`id="${id}"`), `Expected document prototype element #${id}`);

for (const name of [
  'sampleDocumentTemplate', 'blankDocumentTemplate', 'documentTable', 'documentFieldsForSource',
  'openDocumentDesigner', 'renderDocumentDesigner', 'insertDocumentField', 'documentTableAction',
  'saveDocumentTemplate', 'renderWorkflowDocumentOutput', 'documentPageGeometry', 'clampDocumentMargin',
  'documentMarginHandles', 'updateDocumentMarginDrag', 'fitDocumentColumnWidths',
  'documentFieldSemanticType', 'documentFieldIcon', 'documentContextualRulerMarkers',
  'documentVerticalContextualRulerMarkers', 'updateDocumentRulerDrag', 'prepareDocumentPrint', 'restoreDocumentAfterPrint'
]) assert.match(script, new RegExp(`function ${name}\\(`), `Expected generic document function ${name}`);

assert.match(script, /regions:\s*\{\s*header:/, 'document model must separate header, body, and footer regions');
assert.match(script, /documentPhysicalPages/, 'designer must adapt legacy and explicit physical-page templates');
assert.match(html, /document-binding-suggestions\.js/, 'the deterministic field-suggestion engine must load before the designer');
assert.match(script, /documentSuggestionMarkup/, 'selected imported content must expose suggestions in the existing Properties panel');
assert.match(script, /data-document-suggestion-reject/, 'users must be able to keep suggested content static');
assert.match(script, /documentPageIndex/, 'designer must track the selected physical page');
assert.match(html, /documentPreviousPage[\s\S]*documentPagePosition[\s\S]*documentNextPage/, 'multi-page designer must provide accessible page navigation');
assert.match(script, /#page=\$\{state\.documentPageIndex \+ 1\}/, 'original PDF comparison must follow the selected source page');
assert.match(script, /type: 'field'.*binding/s, 'dynamic fields must use binding identifiers');
assert.match(script, /repeatingSource/, 'tables must support a generic repeating source');
assert.match(script, /normalizedDocumentColumnWidths/, 'table columns must normalize inside the available document width');
assert.match(script, /documentPageSizesCm = \{ A4: \{ portrait: \{ width: 21, height: 29\.7 \}/, 'A4 portrait must have fixed canonical centimetre geometry');
assert.match(script, /--page-width.*--display-page-width.*--margin-top/s, 'document dimensions, display dimensions, and margins must remain separate');
assert.match(script, /application\/x-babyyy-document-field/, 'field controls must support drag insertion');
assert.match(script, /data-document-margin-handle/, 'rulers must expose interactive margin handles');
assert.match(script, /table\.columns\.length < 12/, 'table insertion must retain a practical minimum column width');
assert.match(script, /width: 100,[\s\S]*100 - \(equalWidth \* index\)/, 'new tables must fill their region with evenly distributed columns totalling 100 percent');
assert.match(script, /Organization name.*Current user/, 'the generic System field group must include the complete requested field set');
assert.match(script, /headerFromTop: 1\.25, footerFromBottom: 1\.25/, 'templates must persist canonical header and footer offsets');
assert.match(script, /--header-from-top.*--footer-from-bottom/, 'header and footer offsets must flow into the document coordinate system');
assert.match(script, /documentFieldSemanticType\(label, binding\)/, 'field icons must derive from generic field semantics');
assert.match(script, /paths\[type\] \|\| paths\.text/, 'unknown fields must use a generic text icon fallback');
assert.match(script, /leftIndent: options\.leftIndent \|\| 0, rightIndent: options\.rightIndent \|\| 0/, 'paragraph indents must persist in canonical document data');
assert.match(script, /data-document-indent-handle="left"[\s\S]*data-document-indent-handle="right"/, 'selected paragraphs must expose left and right ruler indents');
assert.match(script, /data-document-column-marker/, 'selected tables must expose ruler column boundaries');
assert.match(script, /kind === 'paragraph'[\s\S]*Selected block at/, 'selected flowing text must expose an informational vertical position marker');
assert.match(script, /data-document-row-height-handle[\s\S]*Row height:/, 'selected rows must expose a draggable bottom boundary on the vertical ruler');
assert.match(script, /heightCm: \.9/, 'table rows must store canonical centimetre heights independently');
assert.match(script, /drag\.kind === 'row-height'[\s\S]*const row = table\.rows\[state\.documentSelectedCell\.row\]; row\.heightCm/, 'vertical row resizing must change only the selected row');
assert.match(script, /state\.documentPropertiesTab === 'page'[\s\S]*documentMarginHandles/, 'page margin markers must be limited to Page context');
assert.match(script, /drag\.kind === 'column'[\s\S]*table\.columns\[drag\.index \+ 1\]/, 'table ruler resizing must redistribute width to the adjacent column');
assert.match(script, /if \(margin\)[\s\S]*state\.documentMarginDrag[\s\S]*else[\s\S]*state\.documentRulerDrag/, 'page margins and contextual ruler edits must use separate state paths');
assert.match(script, /event\.target\.setPointerCapture\?\.\(event\.pointerId\)/, 'ruler drags must retain pointer capture outside a marker');
assert.match(script, /oppositeBoundary = side === 'top'[\s\S]*page\.footerFromBottom[\s\S]*page\.headerFromTop/, 'vertical margin clamping must respect independent header and footer boundaries');
assert.match(script, /--print-margin-left/, 'print and editor geometry must derive from the same page margins');
assert.match(script, /documentTemplateStorageKey/, 'prototype template drafts must persist');
assert.match(script, /beforeprint[\s\S]*prepareDocumentPrint[\s\S]*afterprint[\s\S]*restoreDocumentAfterPrint/, 'browser printing must use the shared preview renderer and restore the prior editor mode');
assert.match(script, /workflowDocumentOutputs\[key\].*templateKey/s, 'workflows must reference templates by key');
assert.doesNotMatch(script, /PurchaseOrderSupplier|InvoiceItem|POAmount|InvoiceTaxRow/, 'generic architecture must not contain document-specific model types');
assert.match(styles, /\.document-coordinate-system \{[^}]*--display-page-width/, 'the viewport must reserve the zoomed display width');
assert.match(styles, /\.document-horizontal-ruler \{[^}]*width: var\(--display-page-width\)/, 'the horizontal ruler must follow the displayed page width');
assert.match(styles, /\.document-vertical-ruler \{[^}]*height: var\(--display-page-height\)/, 'the vertical ruler must follow the displayed page height');
assert.match(styles, /\.document-page \{[^}]*width: var\(--page-width\)[^}]*transform: scale\(var\(--document-zoom\)\)/, 'zoom must be a view transform over canonical page geometry');
assert.match(styles, /\.document-header \{ top: var\(--header-from-top\); \}/, 'header must anchor from the physical page top');
assert.match(styles, /\.document-footer \{ bottom: var\(--footer-from-bottom\); \}/, 'footer must anchor from the physical page bottom');
assert.match(styles, /\.document-body \{ top: max\([^}]*bottom: max\(/, 'body must remain bounded between page-anchored header and footer zones');
assert.match(styles, /\.document-page\.is-design\.has-body-overflow/, 'body overflow must be surfaced safely in Design mode');
assert.match(styles, /\.document-field-icon svg/, 'field rows must render project-owned semantic SVG icons');
assert.match(styles, /\.document-field-group button \{[^}]*grid-template-columns: 28px minmax\(0, 1fr\)/, 'field rows must use a fixed icon column and aligned label column');
assert.match(styles, /\.document-context-marker\.is-column/, 'table column ruler markers must use the contextual selection language');
assert.match(styles, /\.document-vertical-context-marker\.is-position/, 'vertical selection markers must use the contextual purple selection language');
assert.match(styles, /\.document-vertical-context-marker\.is-boundary\.is-bottom\[data-document-row-height-handle\]/, 'row bottom marker must expose vertical resize affordance');
assert.match(styles, /\.document-header, \.document-footer \{[^}]*right: var\(--margin-right\); left: var\(--margin-left\)/, 'anchored header and footer must respect horizontal page margins');
assert.match(styles, /\.document-body \{[^}]*right: var\(--margin-right\);[^}]*left: var\(--margin-left\)/, 'body content must use configured margins as its printable boundary');
assert.match(styles, /\.document-table-block \{[^}]*max-width: 100%/, 'tables must be constrained by their document region');
assert.match(styles, /\.document-table-block table \{[^}]*min-width: 0 !important/, 'document tables must override the application table minimum width');
assert.match(styles, /overflow-wrap: anywhere/, 'long document content must wrap inside page geometry');
assert.match(styles, /\.document-page\.is-preview \.document-table-block:not\(\.has-print-borders\)/, 'preview must hide non-printing table guides');
assert.match(styles, /\.document-page\.is-design \.document-table-block\.is-selected/, 'table selection chrome must remain Design-only');
assert.match(styles, /\.document-page\.is-design \.document-cell\.is-selected/, 'cell selection chrome must remain Design-only');
assert.match(styles, /@media print[\s\S]*@page document-portrait \{ size: A4 portrait;/, 'print output must target A4 portrait geometry');
assert.match(styles, /@page document-landscape \{ size: A4 landscape;/, 'print output must support the same landscape geometry');
assert.doesNotMatch(styles, /@media print \{[\s\S]*body \* \{ visibility: hidden/, 'print layout must remove editor chrome from layout rather than leaving hidden boxes in pagination');
assert.match(styles, /body\.document-designer-open \.app-frame,[\s\S]*min-height: 0 !important/, 'print ancestors must not retain viewport-height layout that creates an extra page');
assert.match(styles, /body\.document-designer-open\.document-print-portrait \{ page: document-portrait; \}/, 'the selected portrait page name must be applied at the print root');
assert.match(styles, /body\.document-designer-open\.document-print-landscape \{ page: document-landscape; \}/, 'the selected landscape page name must be applied at the print root');
assert.match(styles, /\.document-page \{[\s\S]*transform: none !important/, 'print must ignore editor zoom transforms');
assert.match(styles, /@media \(max-width: 800px\)[\s\S]*\.document-designer-shell/, 'designer must retain a scrollable small-screen fallback');

console.log('Document Templates prototype smoke test passed.');
