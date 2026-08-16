const assert = require('assert/strict');
const attachments = require('../../src/modules/workflows/workflows.attachments');
const runtime = require('../../src/modules/workflows/workflows.runtime');

const textFile = (name = 'note.txt', value = 'evidence') => ({
  originalname: name,
  mimetype: 'text/plain',
  buffer: Buffer.from(value)
});

const policy = {
  mode: 'required',
  allowedTypes: ['text/plain'],
  maxFileSize: 32,
  maxFileCount: 2,
  actions: ['submission']
};

assert.throws(
  () => attachments.validateFiles([], policy, 'submission'),
  (error) => error.details.code === 'WORKFLOW_ATTACHMENT_REQUIRED'
);
assert.throws(
  () => attachments.validateFiles([textFile()], { ...policy, mode: 'disabled' }, 'submission'),
  (error) => error.details.code === 'WORKFLOW_ATTACHMENT_DISABLED'
);
assert.throws(
  () => attachments.validateFiles([{ originalname: 'page.html', mimetype: 'text/html', buffer: Buffer.from('<script>') }], policy, 'submission'),
  (error) => error.details.code === 'WORKFLOW_ATTACHMENT_TYPE_DENIED'
);
assert.throws(
  () => attachments.validateFiles([textFile('large.txt', 'x'.repeat(33))], policy, 'submission'),
  (error) => error.details.code === 'WORKFLOW_ATTACHMENT_SIZE_EXCEEDED'
);
assert.throws(
  () => attachments.validateFiles([textFile('1.txt'), textFile('2.txt'), textFile('3.txt')], policy, 'submission'),
  (error) => error.details.code === 'WORKFLOW_ATTACHMENT_COUNT_EXCEEDED'
);

const [validated] = attachments.validateFiles([textFile('../safe.txt')], policy, 'submission');
assert.equal(validated.fileName, 'safe.txt');
assert.equal(validated.fileSize, 8);
assert.match(validated.checksum, /^[a-f0-9]{64}$/);
assert.equal(validated.data.toString(), 'evidence');

const hashInput = { sourceModuleKey: 'customers', sourceRecordId: 1 };
assert.notEqual(
  runtime.submissionHash({ ...hashInput, attachments: [textFile('same.txt', 'alpha')] }),
  runtime.submissionHash({ ...hashInput, attachments: [textFile('same.txt', 'bravo')] }),
  'Equal-sized files with different content must not share an idempotency hash'
);

console.log('Workflow attachment policy smoke passed.');
