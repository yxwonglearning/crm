const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const script = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'public/styles.css'), 'utf8');
const attachmentService = fs.readFileSync(path.join(root, 'src/modules/workflows/workflows.attachments.js'), 'utf8');

assert.doesNotMatch(script, /Allowed MIME types/);
assert.match(script, /Allowed file types/);
assert.match(script, /renderWorkflowAttachmentTypePicker/);
assert.match(script, /data-workflow-node-field="attachmentType:/);
assert.match(script, /PDF/);
assert.match(script, /JPG \/ JPEG image/);
assert.match(script, /Word document/);
assert.match(script, /Excel spreadsheet/);
assert.match(script, /Previously configured type/);
assert.match(script, /syncWorkflowAttachmentTypeSummary/);
assert.match(styles, /\.workflow-file-type-picker/);
assert.match(styles, /\.workflow-file-type-options/);
for (const type of [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]) assert.ok(attachmentService.includes(`'${type}'`), `${type} must remain server-allowlisted`);

console.log('Workflow attachment file-type picker smoke checks passed.');
