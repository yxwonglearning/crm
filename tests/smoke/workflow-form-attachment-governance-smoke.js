const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const frontend = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
const markup = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const backend = fs.readFileSync(path.join(root, 'src/modules/workflows/workflows.attachments.js'), 'utf8');

assert.ok(frontend.includes('File upload rules'));
assert.ok(frontend.includes('These rules apply to Attachment fields in the selected form.'));
assert.ok(frontend.includes('Additional supporting files'));
assert.ok(frontend.includes('Shows a separate upload area for files not requested by the form.'));
assert.ok(frontend.includes('workflowAttachmentFieldRules'));
assert.ok(frontend.includes('accept="${escapeHtml(attachmentRules.accept)}"'));
assert.ok(markup.match(/Additional supporting files/g)?.length >= 2);
assert.ok(backend.includes("startsWith('responseAttachment:')"));
assert.ok(backend.includes('const additionalFiles = files.filter'));

console.log('Workflow form attachment governance smoke passed.');
