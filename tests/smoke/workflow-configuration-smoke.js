const assert = require('assert/strict');
const { pool } = require('../../src/database/pool');
const service = require('../../src/modules/workflows/workflows.service');

const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const workflowKey = `smoke_config_${suffix}`;
const cloneKey = `smoke_config_clone_${suffix}`;

async function deleteDefinition(key) {
  const [definitions] = await pool.execute(
    'SELECT id FROM crm_workflow_definitions WHERE workflow_key = ? LIMIT 1',
    [key]
  );
  if (!definitions[0]) return;
  const workflowId = definitions[0].id;
  const [versions] = await pool.execute(
    'SELECT id FROM crm_workflow_versions WHERE workflow_id = ?',
    [workflowId]
  );
  const versionIds = versions.map((version) => version.id);
  if (versionIds.length) {
    await pool.query(
      `DELETE rules FROM crm_workflow_version_approver_rules rules
       INNER JOIN crm_workflow_version_stages stages ON stages.id = rules.version_stage_id
       WHERE stages.workflow_version_id IN (?)`,
      [versionIds]
    );
    await pool.query(
      'DELETE FROM crm_workflow_version_stages WHERE workflow_version_id IN (?)',
      [versionIds]
    );
  }
  await pool.execute(
    'UPDATE crm_workflow_definitions SET published_version_id = NULL WHERE id = ?',
    [workflowId]
  );
  await pool.execute('DELETE FROM crm_workflow_versions WHERE workflow_id = ?', [workflowId]);
  await pool.execute('DELETE FROM crm_workflow_definitions WHERE id = ?', [workflowId]);
}

async function main() {
  try {
    const [users] = await pool.execute(
      "SELECT id, name, email, role FROM users WHERE status = 'active' AND role = 'admin' ORDER BY id LIMIT 1"
    );
    assert.ok(users[0], 'Workflow configuration smoke requires one active user');
    const user = users[0];

    const created = await service.createDefinition({
      workflowKey,
      name: 'Workflow configuration smoke',
      description: 'Starts invalid so structured validation can be verified.',
      sourceModuleKey: 'customers',
      requestFormKey: 'add',
      requestFormVersion: 1,
      config: {
        trigger: { type: 'manual_submit' },
        stages: []
      }
    }, user);
    assert.equal(created.definition.status, 'draft');
    assert.equal(created.check.valid, false);
    assert.ok(created.check.errors.some((finding) => finding.code === 'WORKFLOW_CONFIG_STAGE_REQUIRED'));

    await assert.rejects(
      service.publishDefinition(workflowKey, {}, user),
      (error) => error.statusCode === 422
        && error.details?.code === 'WORKFLOW_PUBLISH_VALIDATION_FAILED'
        && error.details?.check?.valid === false
    );

    const updated = await service.updateDefinition(workflowKey, {
      description: 'Valid configuration for service smoke coverage.',
      config: {
        trigger: {
          type: 'manual_submit',
          requiredPermission: 'workflow.submit'
        },
        recordPolicy: {
          lockScope: 'record',
          snapshotFields: []
        },
        stages: [{
          stageKey: 'supervisor',
          name: 'Supervisor Approval',
          approvalMode: 'all',
          selfApprovalPolicy: 'error',
          decisionPolicy: { approvalRemark: 'optional' },
          attachmentPolicy: { mode: 'disabled' },
          slaPolicy: {
            enabled: true,
            duration: 24,
            unit: 'hours',
            reminderOffsets: [12]
          },
          eventPolicy: {
            events: ['workflow.stage.started', 'workflow.approved'],
            payloadFields: ['workflowKey', 'requestKey', 'stageKey', 'requestStatus']
          },
          approverRules: [{
            ruleKey: 'specific_user',
            resolverType: 'user',
            resolverReference: String(user.id)
          }]
        }],
        builderGraph: {
          nodes: [
            { id: 'start', type: 'start', x: 60, y: 200, presentation: { formKey: 'add', formName: 'Customer request', mode: 'request', fieldKeys: [], inheritDefault: true } },
            { id: 'stage:supervisor', type: 'approval', stageKey: 'supervisor', x: 300, y: 200, presentation: { formKey: 'add', formName: 'Supervisor review', mode: 'review', fieldKeys: [] }, responsePresentation: { formKey: 'add', formName: 'Supervisor response', fields: [] } },
            { id: 'end', type: 'end', x: 540, y: 200, presentation: { formKey: 'add', formName: 'Completed request', mode: 'result', fieldKeys: [] } }
          ],
          edges: [
            { id: 'edge:start:supervisor', from: 'start', to: 'stage:supervisor', outcome: 'submit' },
            { id: 'edge:supervisor:end', from: 'stage:supervisor', to: 'end', outcome: 'approved' }
          ]
        },
        eventPolicy: {
          events: ['workflow.submitted', 'workflow.completed'],
          payloadFields: ['workflowKey', 'requestKey', 'sourceRecordId', 'requestStatus']
        }
      }
    }, user);
    assert.equal(updated.check.valid, true, JSON.stringify(updated.check.findings));
    assert.equal(updated.check.errors.length, 0);
    assert.equal(updated.definition.draftConfig.builderGraph.nodes.length, 3);
    assert.equal(updated.definition.draftConfig.builderGraph.edges[1].outcome, 'approved');
    assert.equal(updated.definition.draftConfig.builderGraph.nodes[1].presentation.formName, 'Supervisor review');
    assert.equal(updated.definition.draftConfig.builderGraph.nodes[1].responsePresentation.formName, 'Supervisor response');

    const ambiguousConfig = structuredClone(updated.definition.draftConfig);
    ambiguousConfig.builderGraph.edges.push({ id: 'edge:start:end', from: 'start', to: 'end', outcome: 'continue' });
    const ambiguous = await service.updateDefinition(workflowKey, { config: ambiguousConfig }, user);
    assert.equal(ambiguous.check.valid, false);
    assert.ok(ambiguous.check.errors.some((finding) => finding.code === 'WORKFLOW_CONFIG_ROUTE_BRANCH_AMBIGUOUS'));
    await service.updateDefinition(workflowKey, { config: updated.definition.draftConfig }, user);

    const unsafeAttachmentConfig = structuredClone(updated.definition.draftConfig);
    unsafeAttachmentConfig.builderGraph.nodes[0].attachmentPolicy = {
      mode: 'required', allowedTypes: ['text/html'], maxFileSize: 1024, maxFileCount: 1, actions: ['approval']
    };
    const unsafeAttachments = await service.updateDefinition(workflowKey, { config: unsafeAttachmentConfig }, user);
    assert.equal(unsafeAttachments.check.valid, false);
    assert.ok(unsafeAttachments.check.errors.some((finding) => finding.code === 'WORKFLOW_CONFIG_ATTACHMENT_TYPE_UNSAFE'));
    assert.ok(unsafeAttachments.check.errors.some((finding) => finding.code === 'WORKFLOW_CONFIG_ATTACHMENT_ACTION_INVALID'));
    await service.updateDefinition(workflowKey, { config: updated.definition.draftConfig }, user);

    await assert.rejects(
      service.updateDefinition(workflowKey, { workflowKey: `${workflowKey}_changed` }, user),
      (error) => error.statusCode === 409 && error.details?.code === 'WORKFLOW_CONFIG_KEY_IMMUTABLE'
    );

    const checked = await service.checkDefinition(workflowKey);
    assert.equal(checked.check.valid, true);

    const checkpoint = await service.checkpointDefinition(
      workflowKey,
      { summary: 'Reviewed valid configuration' },
      user
    );
    assert.equal(checkpoint.version.action, 'checkpoint');
    assert.equal(checkpoint.version.versionNumber, 1);

    const published = await service.publishDefinition(
      workflowKey,
      { summary: 'Published valid configuration' },
      user
    );
    assert.equal(published.check.valid, true);
    assert.equal(published.definition.status, 'published');
    assert.equal(published.version.action, 'publish');
    assert.equal(published.version.versionNumber, 2);
    assert.equal(published.version.stages[0].stageKey, 'supervisor');

    const versions = await service.listVersions(workflowKey);
    assert.equal(versions.versions.length, 2);
    const fetchedVersion = await service.getVersion(workflowKey, published.version.id);
    assert.equal(fetchedVersion.version.snapshot.workflowKey, workflowKey);
    assert.equal(fetchedVersion.version.snapshot.builderGraph.nodes[1].presentation.formKey, 'add');

    const cloned = await service.cloneDefinition(workflowKey, {
      workflowKey: cloneKey,
      name: 'Workflow configuration smoke clone'
    }, user);
    assert.equal(cloned.definition.status, 'draft');
    assert.equal(cloned.check.valid, true);
    assert.equal(cloned.definition.publishedVersionId, null);
    assert.notEqual(cloned.definition.requestPrefix, published.definition.requestPrefix);
    assert.match(cloned.definition.requestPrefix, /^[A-Z][A-Z0-9]{1,19}$/);

    const archived = await service.archiveDefinition(cloneKey, user);
    assert.equal(archived.definition.status, 'archived');
    await assert.rejects(
      service.updateDefinition(cloneKey, { name: 'Blocked edit' }, user),
      (error) => error.statusCode === 409 && error.details?.code === 'WORKFLOW_CONFIG_ARCHIVED'
    );

    const listed = await service.listDefinitions({ search: suffix });
    assert.ok(listed.definitions.some((item) => item.workflowKey === workflowKey));
    assert.ok(listed.definitions.some((item) => item.workflowKey === cloneKey));

    process.stdout.write('Workflow configuration service smoke passed.\n');
  } finally {
    await deleteDefinition(cloneKey);
    await deleteDefinition(workflowKey);
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
