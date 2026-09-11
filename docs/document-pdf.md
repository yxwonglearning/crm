# Document PDF output

## Import from PDF

Admins can start a template with **Import from PDF**. The server accepts a digital A4 PDF of up to 25 consistently oriented pages and 10 MB, validates the extension, MIME type, and `%PDF-` signature, and analyzes it with `pdfjs-dist`. Each source page becomes a separate editable physical page in the same `templateSchema` used by manually created templates. Imported templates save, reload, preview, and download through the existing repository, field resolution, shared renderer, and Chromium PDF worker.

When imported static text or table cells resemble fields in the selected Data Context, the Properties panel may show a deterministic binding suggestion. Suggestions use normalized labels, a small explicit abbreviation set, value shape, declared field type, and table-column context. They never change the template until the administrator accepts one; administrators may keep content static or use the existing field selector instead. Rejected suggestions are suppressed only for the current editing session, and suggestion metadata is never persisted.

The first version groups positioned text into editable text blocks, preserves approximate font size/alignment/indents, detects drawing/image operators for its review summary, conservatively reconstructs aligned multi-row text as an existing table, and identifies likely page-edge header/footer content. Only high-confidence page-edge content is assigned to the canonical header/footer regions; uncertain content stays in the body. Repeating rows are never assumed automatically. Select an imported text block or table cell to bind it through the existing Record/Form, Workflow, or System field lists; table rows can be explicitly marked repeating.

The original PDF remains only as an in-browser object URL for Generated/Original/Overlay review with adjustable opacity. It is not saved in the template, sent back during save, or included in generated output. Closing/reloading the browser ends that comparison reference; the converted template remains independent.

Current import limits are intentional: one A4 page, extractable digital text, no OCR, no password-protected PDFs, no embedded-image conversion, no arbitrary PDF drawing primitive conversion, and approximate flow-layout reconstruction rather than pixel-perfect free positioning. Image and line operators are reported for review, but images are not yet extracted into the canonical PNG/JPEG element source. Multi-page and non-A4 inputs fail without creating an empty template.

Templates are admin-managed in `crm_document_templates`. Record/workflow viewers can preview and download associated documents; a template has no separate ACL. Admins may also render a template without runtime data (unbound fields are blank). Existing local templates are retained as drafts, not uploaded automatically. Save explicitly persists the active template.

## Runtime

The existing Playwright version is a production dependency. Install the matching browser on the server with `npx playwright install chromium --only-shell` (Linux may also require `npx playwright install-deps chromium`). Run as an unprivileged OS user with Chromium sandbox support. Do not disable the sandbox. The additive `src/database/document-templates.sql` is included in the normal migration runner; it can also be applied separately to avoid running unrelated migrations.

Preview and PDF share `public/document-output.js`, the existing template model, physical A4 geometry, and field-resolution service. Chromium exports PDF directly with scale 1, zero browser margins, and no browser-added headers/footers. Editor zoom is not an API input. The existing designer coordinate system and local history remain intact. Browser Print is a convenience action on the shared preview frame.

## API

- `GET /api/document-templates` — admin-only server templates.
- `PUT /api/document-templates/:templateKey` — admin save `{template, revision?}`; optimistic revision conflict returns 409.
- `POST /api/document-templates/available` — authorized template choices for `{recordId, moduleKey}` or `{workflowRequestId}`.
- `POST /api/document-templates/:templateKey/preview` — permitted template/context, resolved server-side.
- `POST /api/document-templates/:templateKey/render-pdf` — `application/pdf` attachment with sanitized filename.

Preview/PDF inputs accept only `recordId`, `workflowRequestId`, and optional `revision`. They reject client record data, HTML, URLs, and zoom. Every request rechecks access; workflow/source mismatch is rejected. Record fields are allowlisted using field permissions; workflow snapshots use existing presentation/field redaction. Responses are not cached.

The worker runs in a fresh cookie-free context, blocks all network requests/service workers, escapes document text, and accepts only inline PNG/JPEG image sources. It allows at most two simultaneous workers and one per user per process, a 15-second launch timeout, 30-second render deadline, 100 pages, 500 instances per repeating row, and a 20 MB PDF result.

## Supported limits and review

Body blocks and table rows paginate; the first non-repeating row is treated as a table heading and repeated on continuation pages. Headers/footers remain in their existing 2.1 cm regions. Page-number/total-page bindings are filled after pagination. A single block/row taller than the body, oversized header/footer, or horizontal overflow fails rather than silently clipping. Split oversized paragraphs into blocks; arbitrary within-paragraph pagination is not implemented.

Only PNG/JPEG data images are supported; the current image insertion UI remains a labelled placeholder unless an image source is stored in the model. Remote/application URL image fetching is intentionally not enabled. Use matching fonts on browser/server for cross-platform fidelity; the existing system-font stack is preserved. Generated date/time is UTC and refreshed per request. Record data may change between Preview and Download; both resolve fresh permitted data, not an immutable business-document snapshot. Automatic final-approval generation remains the existing workflow prototype configuration, not a new background job.

## Focused checks

`node tests/smoke/document-pdf-smoke.js` covers resolution/validation. Add `--render` for real Chromium PDFs, `pdfinfo`, and `pdftotext`; set `PDF_TEST_PYTHON` to a Python executable with pypdf if pdftotext is unavailable. `node tests/smoke/document-pdf-http-smoke.js` covers HTTP authorization/validation/response contracts with isolated fixtures. Browser verification captures Downloads at 50/75/100/125/150% and checks failure preservation. These checks do not replace user visual acceptance or a production security assessment.
