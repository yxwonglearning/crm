const crypto = require('crypto');
const { pool } = require('../../database/pool');

function parseJson(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

function json(value, fallback = {}) {
  return JSON.stringify(value === undefined ? fallback : value);
}

function checksum(value) {
  return crypto.createHash('sha256').update(json(value)).digest('hex');
}

function numberOrNull(value) {
  return value === null || value === undefined ? null : Number(value);
}

function safeSqlIdentifier(value) {
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(String(value || ''))) throw new Error('Unsafe source module identifier');
  return `\`${value}\``;
}

function definitionRow(row) {
  return {
    id: Number(row.id),
    workflowKey: row.workflow_key,
    requestPrefix: row.request_prefix,
    nextRequestNumber: Number(row.next_request_number),
    name: row.name,
    description: row.description || '',
    status: row.workflow_status,
    schemaVersion: Number(row.schema_version),
    currentVersion: Number(row.current_version),
    publishedVersionId: numberOrNull(row.published_version_id),
    sourceModuleKey: row.source_module_key,
    requestFormKey: row.request_form_key || '',
    requestFormVersion: numberOrNull(row.request_form_version),
    draftConfig: parseJson(row.draft_config_json, {}),
    createdBy: numberOrNull(row.created_by),
    updatedBy: numberOrNull(row.updated_by),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function versionRow(row) {
  return {
    id: Number(row.id),
    workflowId: Number(row.workflow_id),
    workflowKey: row.workflow_key || '',
    versionNumber: Number(row.version_number),
    schemaVersion: Number(row.schema_version),
    action: row.version_action,
    summary: row.summary || '',
    snapshot: parseJson(row.snapshot_json, {}),
    checksum: row.snapshot_checksum,
    createdBy: numberOrNull(row.created_by),
    publishedBy: numberOrNull(row.published_by),
    createdAt: row.created_at,
    publishedAt: row.published_at
  };
}

function instanceRow(row) {
  return {
    id: Number(row.id),
    requestKey: row.request_key,
    workflowId: Number(row.workflow_id),
    workflowVersionId: Number(row.workflow_version_id),
    workflowKey: row.workflow_key || '',
    workflowName: row.workflow_name || '',
    workflowVersion: numberOrNull(row.workflow_version),
    sourceModuleKey: row.source_module_key,
    sourceRecordId: row.source_record_id,
    sourceRecordVersion: row.source_record_version || '',
    requesterUserId: numberOrNull(row.requester_user_id),
    requesterName: row.requester_name || '',
    requesterEmail: row.requester_email || '',
    status: row.request_status,
    currentStageKey: row.current_stage_key || '',
    lockVersion: Number(row.lock_version),
    terminalReasonCode: row.terminal_reason_code || '',
    terminalRemark: row.terminal_remark || '',
    submittedAt: row.submitted_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function stageRow(row) {
  return {
    id: Number(row.id),
    instanceId: Number(row.instance_id),
    versionStageId: Number(row.version_stage_id),
    snapshotId: Number(row.snapshot_id),
    stageKey: row.stage_key,
    name: row.stage_name || row.name || '',
    stageOrder: Number(row.stage_order),
    status: row.stage_status,
    lockVersion: Number(row.lock_version),
    reasonCode: row.reason_code || '',
    reasonMessage: row.reason_message || '',
    dueAt: row.due_at,
    overdueAt: row.overdue_at,
    activatedAt: row.activated_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function assignmentRow(row) {
  return {
    id: Number(row.id),
    instanceStageId: Number(row.instance_stage_id),
    instanceId: numberOrNull(row.instance_id),
    requestKey: row.request_key || '',
    stageKey: row.stage_key || '',
    stageName: row.stage_name || '',
    approverRuleId: numberOrNull(row.approver_rule_id),
    approverUserId: numberOrNull(row.approver_user_id),
    resolverType: row.resolver_type,
    resolverReference: row.resolver_reference || '',
    approverIdentity: parseJson(row.approver_identity_json, {}),
    status: row.assignment_status,
    authorityEvaluation: parseJson(row.authority_evaluation_json, {}),
    lockVersion: Number(row.lock_version),
    dueAt: row.due_at,
    escalatedAt: row.escalated_at,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function withTransaction(work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function listDefinitions(filters = {}, db = pool) {
  const where = [];
  const values = [];
  if (filters.status && filters.status !== 'all') {
    where.push('workflow_status = ?');
    values.push(filters.status);
  }
  if (filters.sourceModuleKey) {
    where.push('source_module_key = ?');
    values.push(filters.sourceModuleKey);
  }
  if (filters.search) {
    const search = `%${filters.search}%`;
    where.push('(workflow_key LIKE ? OR name LIKE ? OR description LIKE ?)');
    values.push(search, search, search);
  }
  const [rows] = await db.execute(
    `SELECT *
     FROM crm_workflow_definitions
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY updated_at DESC, id DESC`,
    values
  );
  return rows.map(definitionRow);
}

async function findDefinitionByKey(workflowKey, db = pool, options = {}) {
  const [rows] = await db.execute(
    `SELECT * FROM crm_workflow_definitions
     WHERE workflow_key = ? LIMIT 1${options.forUpdate ? ' FOR UPDATE' : ''}`,
    [workflowKey]
  );
  return rows[0] ? definitionRow(rows[0]) : null;
}

async function createDefinition(input, userId = null, db = pool) {
  await db.execute(
    `INSERT INTO crm_workflow_definitions
     (workflow_key, request_prefix, name, description, workflow_status, schema_version, source_module_key,
      request_form_key, request_form_version, draft_config_json, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.workflowKey,
      input.requestPrefix || String(input.workflowKey).replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 20),
      input.name,
      input.description || null,
      input.status || 'draft',
      input.schemaVersion || 1,
      input.sourceModuleKey,
      input.requestFormKey || null,
      input.requestFormVersion || null,
      json(input.draftConfig),
      userId,
      userId
    ]
  );
  return findDefinitionByKey(input.workflowKey, db);
}

async function updateDefinition(workflowKey, input, userId = null, db = pool) {
  const fields = [];
  const values = [];
  const scalarColumns = {
    name: 'name',
    description: 'description',
    status: 'workflow_status',
    schemaVersion: 'schema_version',
    sourceModuleKey: 'source_module_key',
    requestPrefix: 'request_prefix',
    requestFormKey: 'request_form_key',
    requestFormVersion: 'request_form_version'
  };
  for (const [key, column] of Object.entries(scalarColumns)) {
    if (input[key] !== undefined) {
      fields.push(`${column} = ?`);
      values.push(input[key] === '' ? null : input[key]);
    }
  }
  if (input.draftConfig !== undefined) {
    fields.push('draft_config_json = ?');
    values.push(json(input.draftConfig));
  }
  fields.push('updated_by = ?');
  values.push(userId);
  values.push(workflowKey);
  const [result] = await db.execute(
    `UPDATE crm_workflow_definitions SET ${fields.join(', ')} WHERE workflow_key = ?`,
    values
  );
  return result.affectedRows ? findDefinitionByKey(workflowKey, db) : null;
}

async function listVersions(workflowKey, limit = 50, db = pool) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const [rows] = await db.execute(
    `SELECT versions.*, definitions.workflow_key
     FROM crm_workflow_versions versions
     INNER JOIN crm_workflow_definitions definitions ON definitions.id = versions.workflow_id
     WHERE definitions.workflow_key = ?
     ORDER BY versions.version_number DESC
     LIMIT ${safeLimit}`,
    [workflowKey]
  );
  return rows.map(versionRow);
}

async function findVersion(workflowKey, versionId, db = pool) {
  const [rows] = await db.execute(
    `SELECT versions.*, definitions.workflow_key
     FROM crm_workflow_versions versions
     INNER JOIN crm_workflow_definitions definitions ON definitions.id = versions.workflow_id
     WHERE definitions.workflow_key = ? AND versions.id = ? LIMIT 1`,
    [workflowKey, versionId]
  );
  if (!rows[0]) return null;
  const version = versionRow(rows[0]);
  const [stages] = await db.execute(
    `SELECT * FROM crm_workflow_version_stages
     WHERE workflow_version_id = ? ORDER BY stage_order, id`,
    [version.id]
  );
  const stageIds = stages.map((stage) => stage.id);
  let rules = [];
  if (stageIds.length) {
    const [ruleRows] = await db.query(
      `SELECT * FROM crm_workflow_version_approver_rules
       WHERE version_stage_id IN (?) ORDER BY version_stage_id, rule_order, id`,
      [stageIds]
    );
    rules = ruleRows;
  }
  version.stages = stages.map((stage) => ({
    id: Number(stage.id),
    stageKey: stage.stage_key,
    name: stage.name,
    order: Number(stage.stage_order),
    enabled: Boolean(stage.is_enabled),
    condition: parseJson(stage.condition_json, null),
    skipWhenConditionFalse: Boolean(stage.skip_when_condition_false),
    approvalMode: stage.approval_mode,
    selfApprovalPolicy: stage.self_approval_policy,
    decisionPolicy: parseJson(stage.decision_policy_json, {}),
    attachmentPolicy: parseJson(stage.attachment_policy_json, {}),
    slaPolicy: parseJson(stage.sla_policy_json, {}),
    emailPolicy: parseJson(stage.email_policy_json, {}),
    eventPolicy: parseJson(stage.event_policy_json, {}),
    approverRules: rules.filter((rule) => Number(rule.version_stage_id) === Number(stage.id)).map((rule) => ({
      id: Number(rule.id),
      ruleKey: rule.rule_key,
      order: Number(rule.rule_order),
      resolverType: rule.resolver_type,
      resolverReference: rule.resolver_reference || '',
      resolverConfig: parseJson(rule.resolver_config_json, {}),
      authorityCondition: parseJson(rule.authority_condition_json, null)
    }))
  }));
  return version;
}

async function createVersion(workflowKey, entry, userId = null) {
  return withTransaction(async (connection) => {
    const definition = await findDefinitionByKey(workflowKey, connection, { forUpdate: true });
    if (!definition) return null;
    const [rows] = await connection.execute(
      `SELECT COALESCE(MAX(version_number), 0) AS latest
       FROM crm_workflow_versions WHERE workflow_id = ? FOR UPDATE`,
      [definition.id]
    );
    const versionNumber = Math.max(Number(rows[0]?.latest || 0), definition.currentVersion) + 1;
    const snapshot = entry.snapshot || definition.draftConfig;
    const snapshotChecksum = entry.checksum || checksum(snapshot);
    const isPublish = entry.action === 'publish';
    const [result] = await connection.execute(
      `INSERT INTO crm_workflow_versions
       (workflow_id, version_number, schema_version, version_action, summary, snapshot_json,
        snapshot_checksum, created_by, published_by, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        definition.id,
        versionNumber,
        entry.schemaVersion || definition.schemaVersion,
        entry.action || 'checkpoint',
        entry.summary || null,
        json(snapshot),
        snapshotChecksum,
        userId,
        isPublish ? userId : null,
        isPublish ? new Date() : null
      ]
    );
    const versionId = Number(result.insertId);
    for (const [stageIndex, stage] of (entry.stages || snapshot.stages || []).entries()) {
      const [stageResult] = await connection.execute(
        `INSERT INTO crm_workflow_version_stages
         (workflow_version_id, stage_key, name, stage_order, is_enabled, condition_json,
          skip_when_condition_false, approval_mode, self_approval_policy, decision_policy_json,
          attachment_policy_json, sla_policy_json, email_policy_json, event_policy_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          versionId,
          stage.stageKey,
          stage.name,
          stage.order ?? stageIndex,
          stage.enabled === false ? 0 : 1,
          stage.condition ? json(stage.condition) : null,
          stage.skipWhenConditionFalse ? 1 : 0,
          stage.approvalMode || 'all',
          stage.selfApprovalPolicy || 'error',
          json(stage.decisionPolicy),
          json(stage.attachmentPolicy),
          json(stage.slaPolicy),
          json(stage.emailPolicy),
          json(stage.eventPolicy)
        ]
      );
      for (const [ruleIndex, rule] of (stage.approverRules || []).entries()) {
        await connection.execute(
          `INSERT INTO crm_workflow_version_approver_rules
           (version_stage_id, rule_key, rule_order, resolver_type, resolver_reference,
            resolver_config_json, authority_condition_json)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            stageResult.insertId,
            rule.ruleKey,
            rule.order ?? ruleIndex,
            rule.resolverType,
            rule.resolverReference || null,
            json(rule.resolverConfig),
            rule.authorityCondition ? json(rule.authorityCondition) : null
          ]
        );
      }
    }
    await connection.execute(
      `UPDATE crm_workflow_definitions
       SET current_version = ?, published_version_id = ?, workflow_status = ?,
           updated_by = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        versionNumber,
        isPublish ? versionId : definition.publishedVersionId,
        isPublish ? 'published' : definition.status,
        userId,
        definition.id
      ]
    );
    return findVersion(workflowKey, versionId, connection);
  });
}

async function findInstanceByRequestKey(requestKey, db = pool, options = {}) {
  const [rows] = await db.execute(
    `SELECT instances.*, definitions.workflow_key, definitions.name AS workflow_name,
            versions.version_number AS workflow_version,
            requester.name AS requester_name, requester.email AS requester_email
     FROM crm_workflow_instances instances
     INNER JOIN crm_workflow_definitions definitions ON definitions.id = instances.workflow_id
     INNER JOIN crm_workflow_versions versions ON versions.id = instances.workflow_version_id
     LEFT JOIN users requester ON requester.id = instances.requester_user_id
     WHERE instances.request_key = ? LIMIT 1${options.forUpdate ? ' FOR UPDATE' : ''}`,
    [requestKey]
  );
  return rows[0] ? instanceRow(rows[0]) : null;
}

async function findInstanceById(instanceId, db = pool) {
  const [rows] = await db.execute(
    `SELECT instances.*, definitions.workflow_key, definitions.name AS workflow_name,
            versions.version_number AS workflow_version,
            requester.name AS requester_name, requester.email AS requester_email
     FROM crm_workflow_instances instances
     INNER JOIN crm_workflow_definitions definitions ON definitions.id = instances.workflow_id
     INNER JOIN crm_workflow_versions versions ON versions.id = instances.workflow_version_id
     LEFT JOIN users requester ON requester.id = instances.requester_user_id
     WHERE instances.id = ? LIMIT 1`,
    [instanceId]
  );
  return rows[0] ? instanceRow(rows[0]) : null;
}

async function listInstances(filters = {}, db = pool) {
  const where = [];
  const values = [];
  if (filters.requesterUserId) {
    where.push('instances.requester_user_id = ?');
    values.push(filters.requesterUserId);
  }
  if (filters.participantUserId) {
    where.push(`(
      instances.requester_user_id = ?
      OR EXISTS (
        SELECT 1 FROM crm_workflow_instance_stages participant_stages
        INNER JOIN crm_workflow_assignments participant_assignments
          ON participant_assignments.instance_stage_id = participant_stages.id
        WHERE participant_stages.instance_id = instances.id
          AND participant_assignments.approver_user_id = ?
      )
    )`);
    values.push(filters.participantUserId, filters.participantUserId);
  }
  if (filters.status && filters.status !== 'all') {
    where.push('instances.request_status = ?');
    values.push(filters.status);
  }
  if (filters.search) {
    where.push('(instances.request_key LIKE ? OR definitions.name LIKE ?)');
    const search = `%${filters.search}%`;
    values.push(search, search);
  }
  const safeLimit = Math.min(Math.max(Number(filters.limit) || 50, 1), 100);
  const [rows] = await db.execute(
    `SELECT instances.*, definitions.workflow_key, definitions.name AS workflow_name,
            versions.version_number AS workflow_version,
            requester.name AS requester_name, requester.email AS requester_email
     FROM crm_workflow_instances instances
     INNER JOIN crm_workflow_definitions definitions ON definitions.id = instances.workflow_id
     INNER JOIN crm_workflow_versions versions ON versions.id = instances.workflow_version_id
     LEFT JOIN users requester ON requester.id = instances.requester_user_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY instances.updated_at DESC, instances.id DESC
     LIMIT ${safeLimit}`,
    values
  );
  return rows.map(instanceRow);
}

async function createInstance(input, db = pool) {
  const [result] = await db.execute(
    `INSERT INTO crm_workflow_instances
     (request_key, workflow_id, workflow_version_id, source_module_key, source_record_id,
      source_record_version, requester_user_id, request_status, current_stage_key,
      submitted_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.requestKey,
      input.workflowId,
      input.workflowVersionId,
      input.sourceModuleKey,
      String(input.sourceRecordId),
      input.sourceRecordVersion || null,
      input.requesterUserId || null,
      input.status || 'draft',
      input.currentStageKey || null,
      input.submittedAt || null,
      input.completedAt || null
    ]
  );
  return Number(result.insertId);
}

async function allocateRequestKey(workflowKey, db) {
  if (!db || db === pool) {
    throw new Error('Request keys must be allocated inside the submission transaction');
  }
  const definition = await findDefinitionByKey(workflowKey, db, { forUpdate: true });
  if (!definition) return null;
  const requestKey = `${definition.requestPrefix}-${String(definition.nextRequestNumber).padStart(6, '0')}`;
  await db.execute(
    `UPDATE crm_workflow_definitions
     SET next_request_number = next_request_number + 1
     WHERE id = ?`,
    [definition.id]
  );
  return requestKey;
}

async function appendSnapshot(instanceId, entry, db = pool) {
  let revisionNumber = entry.revisionNumber;
  if (!revisionNumber) {
    const [rows] = await db.execute(
      'SELECT COALESCE(MAX(revision_number), 0) + 1 AS next_revision FROM crm_workflow_instance_snapshots WHERE instance_id = ?',
      [instanceId]
    );
    revisionNumber = Number(rows[0]?.next_revision || 1);
  }
  const [result] = await db.execute(
    `INSERT INTO crm_workflow_instance_snapshots
     (instance_id, revision_number, source_record_version, snapshot_json, snapshot_checksum, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      instanceId,
      revisionNumber,
      entry.sourceRecordVersion || null,
      json(entry.snapshot),
      entry.checksum || checksum(entry.snapshot),
      entry.createdBy || null
    ]
  );
  return { id: Number(result.insertId), revisionNumber };
}

async function createInstanceStage(instanceId, entry, db = pool) {
  const [result] = await db.execute(
    `INSERT INTO crm_workflow_instance_stages
     (instance_id, version_stage_id, snapshot_id, stage_key, stage_order, stage_status,
      reason_code, reason_message, due_at, activated_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      instanceId,
      entry.versionStageId,
      entry.snapshotId,
      entry.stageKey,
      entry.stageOrder,
      entry.status || 'waiting',
      entry.reasonCode || null,
      entry.reasonMessage || null,
      entry.dueAt || null,
      entry.activatedAt || null,
      entry.completedAt || null
    ]
  );
  return Number(result.insertId);
}

async function createAssignments(instanceStageId, assignments, db = pool) {
  const ids = [];
  for (const assignment of assignments || []) {
    const [result] = await db.execute(
      `INSERT INTO crm_workflow_assignments
       (instance_stage_id, approver_rule_id, approver_user_id, resolver_type, resolver_reference,
        approver_identity_json, assignment_status, authority_evaluation_json, due_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        instanceStageId,
        assignment.approverRuleId || null,
        assignment.approverUserId || null,
        assignment.resolverType,
        assignment.resolverReference || null,
        json(assignment.approverIdentity),
        assignment.status || 'pending',
        json(assignment.authorityEvaluation),
        assignment.dueAt || null
      ]
    );
    ids.push(Number(result.insertId));
  }
  return ids;
}

async function createInstanceBundle(input) {
  return withTransaction(async (connection) => {
    const requestKey = input.requestKey || await allocateRequestKey(input.workflowKey, connection);
    if (!requestKey) throw new Error('Workflow definition not found while allocating request key');
    const instanceId = await createInstance({ ...input, requestKey }, connection);
    const snapshot = await appendSnapshot(instanceId, {
      revisionNumber: 1,
      sourceRecordVersion: input.sourceRecordVersion,
      snapshot: input.snapshot,
      createdBy: input.requesterUserId
    }, connection);
    const stages = [];
    for (const stage of input.stages || []) {
      const stageId = await createInstanceStage(instanceId, { ...stage, snapshotId: snapshot.id }, connection);
      const assignmentIds = await createAssignments(stageId, stage.assignments, connection);
      for (const decision of stage.autoDecisions || []) {
        const assignmentIndex = Number(decision.assignmentIndex || 0);
        await appendDecision({
          ...decision,
          instanceId,
          instanceStageId: stageId,
          assignmentId: assignmentIds[assignmentIndex] || null,
          snapshotId: snapshot.id,
          idempotencyKey: `${requestKey}:${stage.stageKey}:auto_approve:${assignmentIndex}`
        }, connection);
      }
      for (const [eventIndex, event] of (stage.events || []).entries()) {
        await appendEvent({
          ...event,
          eventKey: event.eventKey || `${requestKey}:${stage.stageKey}:${event.eventType}:${eventIndex}`,
          instanceId,
          instanceStageId: stageId,
          payload: { requestKey, ...(event.payload || {}) }
        }, connection);
      }
      stages.push({ id: stageId, stageKey: stage.stageKey, assignmentIds });
    }
    if (input.recordLock) {
      await acquireRecordLock({
        ...input.recordLock,
        instanceId,
        sourceModuleKey: input.sourceModuleKey,
        sourceRecordId: input.sourceRecordId
      }, connection);
    }
    for (const attachment of input.attachments || []) {
      await appendAttachment({ ...attachment, instanceId, uploadedBy: input.requesterUserId }, connection);
    }
    if (input.event) {
      await appendEvent({
        ...input.event,
        eventKey: input.event.eventKey || `${requestKey}:${input.event.eventType}`,
        instanceId,
        payload: { requestKey, ...(input.event.payload || {}) }
      }, connection);
    }
    if (input.audit) {
      await appendAudit({
        ...input.audit,
        workflowId: input.workflowId,
        instanceId,
        targetKey: requestKey,
        metadata: { requestKey, ...(input.audit.metadata || {}) }
      }, connection);
    }
    if (input.idempotency) {
      await storeIdempotency({
        ...input.idempotency,
        instanceId,
        responseStatus: 201,
        response: { requestKey }
      }, connection);
    }
    return { instance: await findInstanceByRequestKey(requestKey, connection), snapshot, stages };
  });
}

async function listInstanceStages(instanceId, db = pool) {
  const [rows] = await db.execute(
    `SELECT stages.*, version_stages.name AS stage_name
     FROM crm_workflow_instance_stages stages
     INNER JOIN crm_workflow_version_stages version_stages ON version_stages.id = stages.version_stage_id
     WHERE stages.instance_id = ? ORDER BY stages.stage_order, stages.id`,
    [instanceId]
  );
  return rows.map(stageRow);
}

async function listStageAssignments(instanceStageId, db = pool, options = {}) {
  const [rows] = await db.execute(
    `SELECT assignments.*, stages.instance_id, stages.stage_key,
            version_stages.name AS stage_name
     FROM crm_workflow_assignments assignments
     INNER JOIN crm_workflow_instance_stages stages ON stages.id = assignments.instance_stage_id
     INNER JOIN crm_workflow_version_stages version_stages ON version_stages.id = stages.version_stage_id
     WHERE assignments.instance_stage_id = ?
     ORDER BY assignments.id${options.forUpdate ? ' FOR UPDATE' : ''}`,
    [instanceStageId]
  );
  return rows.map(assignmentRow);
}

async function resetAssignment(assignmentId, update, db = pool) {
  const [result] = await db.execute(
    `UPDATE crm_workflow_assignments
     SET approver_rule_id = ?, resolver_type = ?, resolver_reference = ?,
         approver_identity_json = ?, assignment_status = ?, authority_evaluation_json = ?,
         due_at = ?, escalated_at = NULL, decided_at = ?, lock_version = lock_version + 1
     WHERE id = ?`,
    [
      update.approverRuleId || null,
      update.resolverType,
      update.resolverReference || null,
      json(update.approverIdentity),
      update.status || 'pending',
      json(update.authorityEvaluation),
      update.dueAt || null,
      update.decidedAt || null,
      assignmentId
    ]
  );
  return result.affectedRows === 1;
}

async function cancelOpenInstanceWork(instanceId, decidedAt, db = pool) {
  await db.execute(
    `UPDATE crm_workflow_assignments assignments
     INNER JOIN crm_workflow_instance_stages stages ON stages.id = assignments.instance_stage_id
     SET assignments.assignment_status = 'cancelled', assignments.decided_at = ?,
         assignments.lock_version = assignments.lock_version + 1
     WHERE stages.instance_id = ? AND assignments.assignment_status = 'pending'`,
    [decidedAt, instanceId]
  );
  const [result] = await db.execute(
    `UPDATE crm_workflow_instance_stages
     SET stage_status = 'cancelled', completed_at = ?, lock_version = lock_version + 1
     WHERE instance_id = ? AND stage_status IN ('waiting', 'active')`,
    [decidedAt, instanceId]
  );
  return result.affectedRows;
}

async function findActiveStage(instanceId, db = pool, options = {}) {
  const [rows] = await db.execute(
    `SELECT stages.*, version_stages.name AS stage_name, version_stages.approval_mode,
            version_stages.decision_policy_json, version_stages.attachment_policy_json, version_stages.sla_policy_json
     FROM crm_workflow_instance_stages stages
     INNER JOIN crm_workflow_version_stages version_stages ON version_stages.id = stages.version_stage_id
     WHERE stages.instance_id = ? AND stages.stage_status = 'active'
     ORDER BY stages.stage_order LIMIT 1${options.forUpdate ? ' FOR UPDATE' : ''}`,
    [instanceId]
  );
  if (!rows[0]) return null;
  return {
    ...stageRow(rows[0]),
    approvalMode: rows[0].approval_mode || 'all',
    decisionPolicy: parseJson(rows[0].decision_policy_json, {}),
    attachmentPolicy: parseJson(rows[0].attachment_policy_json, {}),
    slaPolicy: parseJson(rows[0].sla_policy_json, {})
  };
}

async function findAssignmentForApprover(instanceStageId, approverUserId, db = pool, options = {}) {
  const [rows] = await db.execute(
    `SELECT * FROM crm_workflow_assignments
     WHERE instance_stage_id = ? AND approver_user_id = ?
     LIMIT 1${options.forUpdate ? ' FOR UPDATE' : ''}`,
    [instanceStageId, approverUserId]
  );
  return rows[0] ? assignmentRow(rows[0]) : null;
}

async function countPendingAssignments(instanceStageId, db = pool) {
  const [rows] = await db.execute(
    "SELECT COUNT(*) AS count FROM crm_workflow_assignments WHERE instance_stage_id = ? AND assignment_status = 'pending'",
    [instanceStageId]
  );
  return Number(rows[0]?.count || 0);
}

async function assignmentCounts(instanceStageId, db = pool) {
  const [rows] = await db.execute(
    `SELECT assignment_status, COUNT(*) AS count FROM crm_workflow_assignments
     WHERE instance_stage_id = ? GROUP BY assignment_status`, [instanceStageId]
  );
  const counts = { pending: 0, approved: 0, rejected: 0, returned: 0, cancelled: 0, total: 0 };
  for (const row of rows) { counts[row.assignment_status] = Number(row.count); counts.total += Number(row.count); }
  return counts;
}

async function findNextWaitingStage(instanceId, afterOrder, db = pool, options = {}) {
  const [rows] = await db.execute(
    `SELECT stages.*, version_stages.name AS stage_name,
            version_stages.decision_policy_json, version_stages.sla_policy_json
     FROM crm_workflow_instance_stages stages
     INNER JOIN crm_workflow_version_stages version_stages ON version_stages.id = stages.version_stage_id
     WHERE stages.instance_id = ? AND stages.stage_status = 'waiting' AND stages.stage_order > ?
     ORDER BY stages.stage_order LIMIT 1${options.forUpdate ? ' FOR UPDATE' : ''}`,
    [instanceId, afterOrder]
  );
  if (!rows[0]) return null;
  return {
    ...stageRow(rows[0]),
    decisionPolicy: parseJson(rows[0].decision_policy_json, {}),
    slaPolicy: parseJson(rows[0].sla_policy_json, {})
  };
}

async function cancelPendingAssignments(instanceStageId, decidedAt, db = pool) {
  const [result] = await db.execute(
    `UPDATE crm_workflow_assignments
     SET assignment_status = 'cancelled', decided_at = ?, lock_version = lock_version + 1
     WHERE instance_stage_id = ? AND assignment_status = 'pending'`,
    [decidedAt, instanceStageId]
  );
  return result.affectedRows;
}

async function transitionInstance(instanceId, expectedLockVersion, update, db = pool) {
  const fields = ['request_status = ?', 'lock_version = lock_version + 1'];
  const values = [update.status];
  const optionalColumns = {
    currentStageKey: 'current_stage_key',
    terminalReasonCode: 'terminal_reason_code',
    terminalRemark: 'terminal_remark',
    submittedAt: 'submitted_at',
    completedAt: 'completed_at'
  };
  for (const [key, column] of Object.entries(optionalColumns)) {
    if (update[key] !== undefined) {
      fields.push(`${column} = ?`);
      values.push(update[key] || null);
    }
  }
  values.push(instanceId, expectedLockVersion);
  const [result] = await db.execute(
    `UPDATE crm_workflow_instances SET ${fields.join(', ')}
     WHERE id = ? AND lock_version = ?`,
    values
  );
  return result.affectedRows === 1;
}

async function transitionInstanceStage(stageId, expectedLockVersion, update, db = pool) {
  const fields = ['stage_status = ?', 'lock_version = lock_version + 1'];
  const values = [update.status];
  const optionalColumns = {
    snapshotId: 'snapshot_id',
    reasonCode: 'reason_code',
    reasonMessage: 'reason_message',
    dueAt: 'due_at',
    overdueAt: 'overdue_at',
    activatedAt: 'activated_at',
    completedAt: 'completed_at'
  };
  for (const [key, column] of Object.entries(optionalColumns)) {
    if (update[key] !== undefined) {
      fields.push(`${column} = ?`);
      values.push(update[key] || null);
    }
  }
  values.push(stageId, expectedLockVersion);
  const [result] = await db.execute(
    `UPDATE crm_workflow_instance_stages SET ${fields.join(', ')}
     WHERE id = ? AND lock_version = ?`,
    values
  );
  return result.affectedRows === 1;
}

async function transitionAssignment(assignmentId, expectedLockVersion, update, db = pool) {
  const fields = ['assignment_status = ?', 'lock_version = lock_version + 1'];
  const values = [update.status];
  for (const [key, column] of Object.entries({ dueAt: 'due_at', escalatedAt: 'escalated_at', decidedAt: 'decided_at' })) {
    if (update[key] !== undefined) {
      fields.push(`${column} = ?`);
      values.push(update[key] || null);
    }
  }
  values.push(assignmentId, expectedLockVersion);
  const [result] = await db.execute(
    `UPDATE crm_workflow_assignments SET ${fields.join(', ')}
     WHERE id = ? AND lock_version = ?`,
    values
  );
  return result.affectedRows === 1;
}

async function appendDecision(entry, db = pool) {
  const [result] = await db.execute(
    `INSERT INTO crm_workflow_decisions
     (instance_id, instance_stage_id, assignment_id, snapshot_id, decision_action,
      actor_user_id, actor_identity_json, remark, response_json, instance_lock_version,
      assignment_lock_version, idempotency_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.instanceId,
      entry.instanceStageId,
      entry.assignmentId || null,
      entry.snapshotId,
      entry.action,
      entry.actorUserId || null,
      json(entry.actorIdentity),
      entry.remark || null,
      json(entry.responses || {}),
      entry.instanceLockVersion,
      entry.assignmentLockVersion ?? null,
      entry.idempotencyKey
    ]
  );
  return Number(result.insertId);
}

async function appendAttachment(entry, db = pool) {
  const [result] = await db.execute(
    `INSERT INTO crm_workflow_attachments
     (instance_id, decision_id, uploaded_by, attachment_purpose, file_name,
      content_type, file_size, storage_key, file_checksum, file_data, scan_status, scan_engine, scan_result, scanned_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [entry.instanceId, entry.decisionId || null, entry.uploadedBy || null, entry.purpose,
      entry.fileName, entry.contentType, entry.fileSize, entry.storageKey, entry.checksum, entry.data,
      entry.scanStatus || 'not_required', entry.scanEngine || null, entry.scanResult || null, entry.scannedAt || null]
  );
  return Number(result.insertId);
}

async function listAttachments(instanceId, db = pool) {
  const [rows] = await db.execute(
    `SELECT id, instance_id, decision_id, uploaded_by, attachment_purpose, file_name,
            content_type, file_size, file_checksum, scan_status, scan_engine, scanned_at, created_at
     FROM crm_workflow_attachments WHERE instance_id = ? ORDER BY created_at, id`,
    [instanceId]
  );
  return rows.map((row) => ({
    id: Number(row.id), instanceId: Number(row.instance_id), decisionId: numberOrNull(row.decision_id),
    uploadedBy: numberOrNull(row.uploaded_by), purpose: row.attachment_purpose,
    fileName: row.file_name, contentType: row.content_type, fileSize: Number(row.file_size),
    checksum: row.file_checksum, scanStatus: row.scan_status, scanEngine: row.scan_engine, scannedAt: row.scanned_at, createdAt: row.created_at
  }));
}

async function findAttachment(instanceId, attachmentId, db = pool) {
  const [rows] = await db.execute(
    `SELECT id, instance_id, decision_id, uploaded_by, attachment_purpose, file_name,
            content_type, file_size, file_checksum, file_data, scan_status, scan_engine, scan_result, scanned_at, created_at
     FROM crm_workflow_attachments WHERE instance_id = ? AND id = ? LIMIT 1`,
    [instanceId, attachmentId]
  );
  if (!rows[0]) return null;
  const item = rows[0];
  return { id: Number(item.id), instanceId: Number(item.instance_id), decisionId: numberOrNull(item.decision_id),
    uploadedBy: numberOrNull(item.uploaded_by), purpose: item.attachment_purpose, fileName: item.file_name,
    contentType: item.content_type, fileSize: Number(item.file_size), checksum: item.file_checksum,
    data: ['clean', 'not_required'].includes(item.scan_status) ? item.file_data : null,
    scanStatus: item.scan_status, scanEngine: item.scan_engine, scanResult: item.scan_result, scannedAt: item.scanned_at, createdAt: item.created_at };
}

async function updateWorkflowSourceFields(moduleKey, recordId, updates, userId, db = pool) {
  const table = safeSqlIdentifier(moduleKey);
  const [rows] = await db.execute(`SELECT custom_fields FROM ${table} WHERE id = ? LIMIT 1 FOR UPDATE`, [recordId]);
  if (!rows[0]) return false;
  const current = parseJson(rows[0].custom_fields, {});
  const [result] = await db.execute(
    `UPDATE ${table} SET custom_fields = ?, updated_by = ? WHERE id = ?`,
    [json({ ...current, ...updates }), userId || null, recordId]
  );
  return result.affectedRows === 1;
}

async function appendWorkflowDetailRows(recordId, rowsByTable, db = pool) {
  for (const [tableName, values] of Object.entries(rowsByTable || {})) {
    const entries = Object.entries(values || {});
    if (!entries.length) continue;
    const columns = ['mainid', ...entries.map(([fieldKey]) => fieldKey)];
    await db.execute(
      `INSERT INTO ${safeSqlIdentifier(tableName)} (${columns.map(safeSqlIdentifier).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
      [recordId, ...entries.map(([, value]) => value)]
    );
  }
  return true;
}

async function acquireRecordLock(entry, db = pool) {
  const [result] = await db.execute(
    `INSERT INTO crm_workflow_record_locks
     (source_module_key, source_record_id, instance_id, lock_scope, locked_fields_json, locked_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      entry.sourceModuleKey,
      String(entry.sourceRecordId),
      entry.instanceId,
      entry.lockScope || 'record',
      entry.lockedFields ? json(entry.lockedFields) : null,
      entry.lockedBy || null
    ]
  );
  return Number(result.insertId);
}

async function findRecordLock(sourceModuleKey, sourceRecordId, db = pool) {
  const [rows] = await db.execute(
    `SELECT locks.*, instances.request_key, instances.request_status
     FROM crm_workflow_record_locks locks
     INNER JOIN crm_workflow_instances instances ON instances.id = locks.instance_id
     WHERE locks.source_module_key = ? AND locks.source_record_id = ? LIMIT 1`,
    [sourceModuleKey, String(sourceRecordId)]
  );
  if (!rows[0]) return null;
  return {
    id: Number(rows[0].id),
    instanceId: Number(rows[0].instance_id),
    requestKey: rows[0].request_key,
    requestStatus: rows[0].request_status,
    sourceModuleKey: rows[0].source_module_key,
    sourceRecordId: rows[0].source_record_id,
    lockScope: rows[0].lock_scope,
    lockedFields: parseJson(rows[0].locked_fields_json, []),
    lockedBy: numberOrNull(rows[0].locked_by),
    createdAt: rows[0].created_at
  };
}

async function releaseRecordLock(instanceId, db = pool) {
  const [result] = await db.execute('DELETE FROM crm_workflow_record_locks WHERE instance_id = ?', [instanceId]);
  return result.affectedRows;
}

async function appendEvent(entry, db = pool) {
  const [result] = await db.execute(
    `INSERT INTO crm_workflow_events
     (event_key, event_type, event_schema_version, instance_id, instance_stage_id,
      decision_id, payload_json, delivery_status, next_attempt_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.eventKey,
      entry.eventType,
      entry.schemaVersion || 1,
      entry.instanceId,
      entry.instanceStageId || null,
      entry.decisionId || null,
      json(entry.payload),
      entry.deliveryStatus || 'pending',
      entry.nextAttemptAt || null
    ]
  );
  return Number(result.insertId);
}

async function listPendingEvents(limit = 50, db = pool) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const [rows] = await db.execute(
    `SELECT * FROM crm_workflow_events
     WHERE delivery_status = 'pending'
        OR (delivery_status = 'failed' AND next_attempt_at IS NOT NULL AND next_attempt_at <= CURRENT_TIMESTAMP)
     ORDER BY created_at, id LIMIT ${safeLimit}`
  );
  return rows.map((row) => ({
    id: Number(row.id),
    eventKey: row.event_key,
    eventType: row.event_type,
    schemaVersion: Number(row.event_schema_version),
    instanceId: Number(row.instance_id),
    instanceStageId: numberOrNull(row.instance_stage_id),
    decisionId: numberOrNull(row.decision_id),
    payload: parseJson(row.payload_json, {}),
    deliveryStatus: row.delivery_status,
    attemptCount: Number(row.attempt_count),
    nextAttemptAt: row.next_attempt_at
  }));
}

async function claimEvent(eventId, db = pool) {
  const [result] = await db.execute(
    `UPDATE crm_workflow_events
     SET delivery_status = 'processing', attempt_count = attempt_count + 1,
         last_error_code = NULL, last_error_message = NULL
     WHERE id = ? AND (delivery_status = 'pending' OR (delivery_status = 'failed' AND next_attempt_at IS NOT NULL AND next_attempt_at <= CURRENT_TIMESTAMP))`,
    [eventId]
  );
  return result.affectedRows === 1;
}

async function markEventDelivered(eventId, db = pool) {
  await db.execute(
    `UPDATE crm_workflow_events SET delivery_status = 'delivered', delivered_at = CURRENT_TIMESTAMP,
      next_attempt_at = NULL, last_error_code = NULL, last_error_message = NULL
     WHERE id = ? AND delivery_status = 'processing'`,
    [eventId]
  );
}

async function markEventFailed(eventId, error, nextAttemptAt, db = pool) {
  await db.execute(
    `UPDATE crm_workflow_events SET delivery_status = 'failed', last_error_code = 'AUTOMATION_FLOW_DELIVERY_FAILED',
      last_error_message = ?, next_attempt_at = ?
     WHERE id = ? AND delivery_status = 'processing'`,
    [String(error || 'Workflow event delivery failed').slice(0, 500), nextAttemptAt || null, eventId]
  );
}

async function storeIdempotency(entry, db = pool) {
  const [result] = await db.execute(
    `INSERT INTO crm_workflow_idempotency_keys
     (command_scope, actor_user_id, actor_key, idempotency_key, request_hash,
      instance_id, decision_id, response_status, response_json, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.commandScope,
      entry.actorUserId || null,
      entry.actorKey,
      entry.idempotencyKey,
      entry.requestHash,
      entry.instanceId || null,
      entry.decisionId || null,
      entry.responseStatus || null,
      entry.response === undefined ? null : json(entry.response),
      entry.expiresAt
    ]
  );
  return Number(result.insertId);
}

async function findIdempotency(commandScope, actorKey, idempotencyKey, db = pool) {
  const [rows] = await db.execute(
    `SELECT * FROM crm_workflow_idempotency_keys
     WHERE command_scope = ? AND actor_key = ? AND idempotency_key = ?
       AND expires_at > CURRENT_TIMESTAMP LIMIT 1`,
    [commandScope, actorKey, idempotencyKey]
  );
  if (!rows[0]) return null;
  return {
    id: Number(rows[0].id),
    requestHash: rows[0].request_hash,
    instanceId: numberOrNull(rows[0].instance_id),
    decisionId: numberOrNull(rows[0].decision_id),
    responseStatus: numberOrNull(rows[0].response_status),
    response: parseJson(rows[0].response_json, null),
    expiresAt: rows[0].expires_at
  };
}

async function appendAudit(entry, db = pool) {
  const [result] = await db.execute(
    `INSERT INTO crm_workflow_audit_logs
     (workflow_id, instance_id, instance_stage_id, actor_user_id, action,
      target_type, target_key, result, reason_code, metadata_json, correlation_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.workflowId || null,
      entry.instanceId || null,
      entry.instanceStageId || null,
      entry.actorUserId || null,
      entry.action,
      entry.targetType || null,
      entry.targetKey || null,
      entry.result,
      entry.reasonCode,
      entry.metadata === undefined ? null : json(entry.metadata),
      entry.correlationId || null
    ]
  );
  return Number(result.insertId);
}

async function listApproverInbox(approverUserId, filters = {}, db = pool) {
  const where = ['assignments.approver_user_id = ?'];
  const values = [approverUserId];
  if (filters.status && filters.status !== 'all') {
    where.push('assignments.assignment_status = ?');
    values.push(filters.status);
  }
  if (filters.overdue === true) where.push('assignments.due_at < CURRENT_TIMESTAMP');
  const safeLimit = Math.min(Math.max(Number(filters.limit) || 50, 1), 100);
  const [rows] = await db.execute(
    `SELECT assignments.*, stages.instance_id, stages.stage_key,
            version_stages.name AS stage_name, instances.request_key,
            instances.source_module_key, instances.source_record_id,
            instances.request_status, instances.requester_user_id
     FROM crm_workflow_assignments assignments
     INNER JOIN crm_workflow_instance_stages stages ON stages.id = assignments.instance_stage_id
     INNER JOIN crm_workflow_version_stages version_stages ON version_stages.id = stages.version_stage_id
     INNER JOIN crm_workflow_instances instances ON instances.id = stages.instance_id
     WHERE ${where.join(' AND ')}
     ORDER BY assignments.due_at IS NULL, assignments.due_at, assignments.created_at
     LIMIT ${safeLimit}`,
    values
  );
  return rows.map((row) => ({
    ...assignmentRow(row),
    sourceModuleKey: row.source_module_key,
    sourceRecordId: row.source_record_id,
    requestStatus: row.request_status,
    requesterUserId: numberOrNull(row.requester_user_id)
  }));
}

async function listSlaCandidates(limit = 200, db = pool) {
  const safeLimit = Math.min(Math.max(Number(limit) || 200, 1), 500);
  const [rows] = await db.execute(
    `SELECT stages.*, version_stages.name AS stage_name, version_stages.sla_policy_json,
            instances.request_key, instances.workflow_id, instances.workflow_version_id,
            definitions.workflow_key, definitions.name AS workflow_name,
            instances.source_module_key, instances.source_record_id, instances.requester_user_id
     FROM crm_workflow_instance_stages stages
     INNER JOIN crm_workflow_instances instances ON instances.id = stages.instance_id
     INNER JOIN crm_workflow_definitions definitions ON definitions.id = instances.workflow_id
     INNER JOIN crm_workflow_version_stages version_stages ON version_stages.id = stages.version_stage_id
     WHERE stages.stage_status = 'active' AND stages.due_at IS NOT NULL
       AND instances.request_status = 'pending'
     ORDER BY stages.due_at, stages.id LIMIT ${safeLimit}`
  );
  return rows.map((row) => ({
    ...stageRow(row), requestKey: row.request_key, workflowId: Number(row.workflow_id),
    workflowVersionId: Number(row.workflow_version_id), workflowKey: row.workflow_key,
    workflowName: row.workflow_name, sourceModuleKey: row.source_module_key,
    sourceRecordId: row.source_record_id, requesterUserId: numberOrNull(row.requester_user_id),
    slaPolicy: parseJson(row.sla_policy_json, {})
  }));
}

async function markStageOverdue(stageId, at, db = pool) {
  const [result] = await db.execute(
    `UPDATE crm_workflow_instance_stages SET overdue_at = COALESCE(overdue_at, ?)
     WHERE id = ? AND stage_status = 'active'`,
    [at, stageId]
  );
  await db.execute(
    `UPDATE crm_workflow_assignments SET escalated_at = COALESCE(escalated_at, ?)
     WHERE instance_stage_id = ? AND assignment_status = 'pending'`,
    [at, stageId]
  );
  return result.affectedRows;
}

async function listWorkflowMonitoring(filters = {}, db = pool) {
  const where = [];
  const values = [];
  if (filters.status && filters.status !== 'all') { where.push('instances.request_status = ?'); values.push(filters.status); }
  if (filters.workflowKey) { where.push('instances.workflow_key = ?'); values.push(filters.workflowKey); }
  if (filters.requester) { where.push('(requester.name LIKE ? OR requester.email LIKE ?)'); const term = `%${filters.requester}%`; values.push(term, term); }
  if (filters.approver) {
    where.push(`EXISTS (
      SELECT 1 FROM crm_workflow_assignments report_assignments
      INNER JOIN users report_approver ON report_approver.id = report_assignments.approver_user_id
      INNER JOIN crm_workflow_instance_stages report_stages ON report_stages.id = report_assignments.instance_stage_id
      WHERE report_stages.instance_id = instances.id AND (report_approver.name LIKE ? OR report_approver.email LIKE ?)
    )`);
    const term = `%${filters.approver}%`; values.push(term, term);
  }
  if (filters.departmentId) { where.push('requester.organization_node_id = ?'); values.push(Number(filters.departmentId)); }
  if (filters.dateFrom) { where.push('COALESCE(instances.submitted_at, instances.created_at) >= ?'); values.push(filters.dateFrom); }
  if (filters.dateTo) { where.push('COALESCE(instances.submitted_at, instances.created_at) < DATE_ADD(?, INTERVAL 1 DAY)'); values.push(filters.dateTo); }
  if (filters.sla === 'overdue') where.push("stages.stage_status = 'active' AND stages.due_at < CURRENT_TIMESTAMP");
  if (filters.sla === 'due_soon') where.push("stages.stage_status = 'active' AND stages.due_at BETWEEN CURRENT_TIMESTAMP AND DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 24 HOUR)");
  if (filters.sla === 'on_track') where.push("stages.stage_status = 'active' AND (stages.due_at IS NULL OR stages.due_at > DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 24 HOUR))");
  if (filters.search) {
    where.push(`(instances.request_key LIKE ? OR definitions.name LIKE ? OR requester.name LIKE ? OR EXISTS (
      SELECT 1 FROM crm_workflow_assignments search_assignments
      INNER JOIN users search_approver ON search_approver.id = search_assignments.approver_user_id
      INNER JOIN crm_workflow_instance_stages search_stages ON search_stages.id = search_assignments.instance_stage_id
      WHERE search_stages.instance_id = instances.id AND search_approver.name LIKE ?
    ))`);
    const term = `%${filters.search}%`; values.push(term, term, term, term);
  }
  const safeLimit = Math.min(Math.max(Number(filters.limit) || 200, 1), 500);
  const [rows] = await db.execute(
    `SELECT instances.id, instances.request_key, definitions.workflow_key, definitions.name AS workflow_name,
            instances.source_module_key, instances.source_record_id, instances.request_status,
            instances.submitted_at, instances.completed_at, requester.name AS requester_name,
            requester.email AS requester_email, requester.organization_node_id AS requester_department_id,
            requester_department.name AS requester_department_name,
            stages.id AS stage_id, stages.stage_key, version_stages.name AS stage_name,
            stages.stage_status, stages.activated_at, stages.due_at, stages.overdue_at,
            GROUP_CONCAT(DISTINCT approver.name ORDER BY approver.name SEPARATOR ', ') AS approver_names,
            MAX(assignments.escalated_at) AS escalated_at,
            GROUP_CONCAT(DISTINCT CONCAT(assignments.id, ':', COALESCE(approver.name, 'Unknown')) ORDER BY assignments.id SEPARATOR '||') AS assignment_options
     FROM crm_workflow_instances instances
     INNER JOIN crm_workflow_definitions definitions ON definitions.id = instances.workflow_id
     LEFT JOIN users requester ON requester.id = instances.requester_user_id
     LEFT JOIN crm_department_nodes requester_department ON requester_department.id = requester.organization_node_id
     LEFT JOIN crm_workflow_instance_stages stages ON stages.instance_id = instances.id
       AND stages.stage_key = instances.current_stage_key
     LEFT JOIN crm_workflow_version_stages version_stages ON version_stages.id = stages.version_stage_id
     LEFT JOIN crm_workflow_assignments assignments ON assignments.instance_stage_id = stages.id AND assignments.assignment_status = 'pending'
     LEFT JOIN users approver ON approver.id = assignments.approver_user_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     GROUP BY instances.id, stages.id, version_stages.name
     ORDER BY CASE WHEN stages.due_at IS NULL THEN 1 ELSE 0 END, stages.due_at, instances.submitted_at DESC
     LIMIT ${safeLimit}`,
    values
  );
  return rows.map((row) => ({
    id: Number(row.id), requestKey: row.request_key, workflowKey: row.workflow_key,
    workflowName: row.workflow_name, sourceModuleKey: row.source_module_key,
    sourceRecordId: row.source_record_id, status: row.request_status,
    requesterName: row.requester_name || '', requesterEmail: row.requester_email || '',
    requesterDepartmentId: numberOrNull(row.requester_department_id), requesterDepartmentName: row.requester_department_name || '',
    submittedAt: row.submitted_at, completedAt: row.completed_at,
    stageId: numberOrNull(row.stage_id), stageKey: row.stage_key || '', stageName: row.stage_name || '',
    stageStatus: row.stage_status || '', activatedAt: row.activated_at, dueAt: row.due_at,
    overdueAt: row.overdue_at, escalatedAt: row.escalated_at,
    approverNames: row.approver_names ? row.approver_names.split(', ') : [],
    assignments: row.assignment_options ? row.assignment_options.split('||').map((value) => { const separator = value.indexOf(':'); return { id: Number(value.slice(0, separator)), approverName: value.slice(separator + 1) }; }) : []
  }));
}

async function findActiveDelegation(delegator, workflowKey, at = new Date(), db = pool) {
  const [rows] = await db.execute(
    `SELECT delegations.*, delegate.id AS delegate_id, delegate.staff_id AS delegate_staff_id,
            delegate.name AS delegate_name, delegate.email AS delegate_email, delegate.role AS delegate_role,
            delegate.status AS delegate_status, delegate.organization_node_id AS delegate_department_id
     FROM crm_workflow_delegations delegations
     INNER JOIN users delegate ON delegate.id = delegations.delegate_user_id
     WHERE delegations.delegator_user_id = ? AND delegations.delegation_status = 'active'
       AND delegations.starts_at <= ? AND delegations.ends_at >= ?
       AND (delegations.workflow_key IS NULL OR delegations.workflow_key = ?)
       AND (delegations.scope_role IS NULL OR delegations.scope_role = ?)
       AND (delegations.scope_department_id IS NULL OR delegations.scope_department_id = ?)
     ORDER BY delegations.workflow_key IS NOT NULL DESC, delegations.created_at DESC LIMIT 1`,
    [delegator.id, at, at, workflowKey, delegator.role || '', delegator.organizationNodeId || null]
  );
  if (!rows[0] || rows[0].delegate_status !== 'active') return null;
  const row = rows[0];
  return { id: Number(row.id), reason: row.reason, delegate: { id: Number(row.delegate_id), staff_id: row.delegate_staff_id,
    name: row.delegate_name, email: row.delegate_email, role: row.delegate_role,
    organization_node_id: numberOrNull(row.delegate_department_id), status: row.delegate_status } };
}

async function listDelegations(filters = {}, db = pool) {
  const where = [];
  const values = [];
  if (filters.status === 'active') where.push("delegations.delegation_status = 'active' AND delegations.ends_at >= CURRENT_TIMESTAMP");
  if (filters.status === 'scheduled') where.push("delegations.delegation_status = 'active' AND delegations.starts_at > CURRENT_TIMESTAMP");
  if (filters.status === 'expired') where.push("delegations.delegation_status = 'active' AND delegations.ends_at < CURRENT_TIMESTAMP");
  if (filters.status === 'cancelled') where.push("delegations.delegation_status = 'cancelled'");
  if (filters.search) { where.push('(delegator.name LIKE ? OR delegate.name LIKE ? OR delegations.reason LIKE ?)'); const term = `%${filters.search}%`; values.push(term, term, term); }
  const [rows] = await db.execute(
    `SELECT delegations.*, delegator.name AS delegator_name, delegator.email AS delegator_email,
            delegate.name AS delegate_name, delegate.email AS delegate_email
     FROM crm_workflow_delegations delegations
     INNER JOIN users delegator ON delegator.id = delegations.delegator_user_id
     INNER JOIN users delegate ON delegate.id = delegations.delegate_user_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY delegations.starts_at DESC, delegations.id DESC LIMIT 300`, values
  );
  return rows.map((row) => ({ id: Number(row.id), delegatorUserId: Number(row.delegator_user_id), delegateUserId: Number(row.delegate_user_id),
    delegatorName: row.delegator_name, delegatorEmail: row.delegator_email, delegateName: row.delegate_name, delegateEmail: row.delegate_email,
    workflowKey: row.workflow_key || '', scopeRole: row.scope_role || '', scopeDepartmentId: numberOrNull(row.scope_department_id),
    startsAt: row.starts_at, endsAt: row.ends_at, reason: row.reason, status: row.delegation_status,
    cancelledAt: row.cancelled_at, createdAt: row.created_at }));
}

async function createDelegation(entry, db = pool) {
  const [result] = await db.execute(
    `INSERT INTO crm_workflow_delegations
     (delegator_user_id, delegate_user_id, workflow_key, scope_role, scope_department_id, starts_at, ends_at, reason, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [entry.delegatorUserId, entry.delegateUserId, entry.workflowKey || null, entry.scopeRole || null,
      entry.scopeDepartmentId || null, entry.startsAt, entry.endsAt, entry.reason, entry.createdBy]
  );
  return Number(result.insertId);
}

async function cancelDelegation(id, userId, db = pool) {
  const [result] = await db.execute(
    `UPDATE crm_workflow_delegations SET delegation_status = 'cancelled', cancelled_by = ?, cancelled_at = CURRENT_TIMESTAMP
     WHERE id = ? AND delegation_status = 'active'`, [userId, id]
  );
  return result.affectedRows;
}

async function findAssignmentById(assignmentId, db = pool, options = {}) {
  const [rows] = await db.execute(
    `SELECT assignments.*, stages.instance_id, stages.stage_key, stages.stage_status, instances.request_key,
            instances.workflow_id, instances.workflow_version_id, instances.source_module_key, instances.source_record_id,
            instances.request_status, version_stages.name AS stage_name
     FROM crm_workflow_assignments assignments
     INNER JOIN crm_workflow_instance_stages stages ON stages.id = assignments.instance_stage_id
     INNER JOIN crm_workflow_instances instances ON instances.id = stages.instance_id
     INNER JOIN crm_workflow_version_stages version_stages ON version_stages.id = stages.version_stage_id
     WHERE assignments.id = ? LIMIT 1${options.forUpdate ? ' FOR UPDATE' : ''}`, [assignmentId]
  );
  return rows[0] ? { ...assignmentRow(rows[0]), workflowId: Number(rows[0].workflow_id), workflowVersionId: Number(rows[0].workflow_version_id),
    sourceModuleKey: rows[0].source_module_key, sourceRecordId: rows[0].source_record_id, requestStatus: rows[0].request_status,
    stageStatus: rows[0].stage_status } : null;
}

async function appendAssignmentTransfer(entry, db = pool) {
  const [result] = await db.execute(
    `INSERT INTO crm_workflow_assignment_transfers
     (instance_id, instance_stage_id, original_assignment_id, replacement_assignment_id, transfer_type,
      delegation_id, original_approver_user_id, replacement_approver_user_id, reason, transferred_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [entry.instanceId, entry.instanceStageId, entry.originalAssignmentId, entry.replacementAssignmentId, entry.transferType,
      entry.delegationId || null, entry.originalApproverUserId || null, entry.replacementApproverUserId, entry.reason, entry.transferredBy || null]
  );
  return Number(result.insertId);
}

async function instanceTimeline(instanceId, db = pool) {
  const [rows] = await db.execute(
    `SELECT decisions.id, 'decision' AS entry_type, decisions.decision_action AS action,
            stages.stage_key, version_stages.name AS stage_name,
            decisions.actor_user_id, decisions.actor_identity_json, decisions.remark, decisions.response_json,
            decisions.created_at, decisions.idempotency_key,
            NULL AS reason_code, NULL AS event_type, NULL AS delivery_status, NULL AS payload_json
     FROM crm_workflow_decisions decisions
     INNER JOIN crm_workflow_instance_stages stages ON stages.id = decisions.instance_stage_id
     INNER JOIN crm_workflow_version_stages version_stages ON version_stages.id = stages.version_stage_id
     WHERE decisions.instance_id = ?
     UNION ALL
     SELECT events.id, 'event' AS entry_type, NULL AS action,
            stages.stage_key, version_stages.name AS stage_name,
            NULL AS actor_user_id, NULL AS actor_identity_json, NULL AS remark, NULL AS response_json,
            events.created_at, events.event_key AS idempotency_key,
            events.last_error_code AS reason_code, events.event_type, events.delivery_status, events.payload_json
     FROM crm_workflow_events events
     LEFT JOIN crm_workflow_instance_stages stages ON stages.id = events.instance_stage_id
     LEFT JOIN crm_workflow_version_stages version_stages ON version_stages.id = stages.version_stage_id
     WHERE events.instance_id = ?
     ORDER BY created_at, id`,
    [instanceId, instanceId]
  );
  return rows.map((row) => ({
    id: Number(row.id),
    type: row.entry_type,
    action: row.action || '',
    eventType: row.event_type || '',
    stageKey: row.stage_key || '',
    stageName: row.stage_name || '',
    actorUserId: numberOrNull(row.actor_user_id),
    actorIdentity: parseJson(row.actor_identity_json, {}),
    remark: row.remark || '',
    responses: parseJson(row.response_json, {}),
    payload: parseJson(row.payload_json, {}),
    reasonCode: row.reason_code || '',
    deliveryStatus: row.delivery_status || '',
    idempotencyKey: row.idempotency_key || '',
    createdAt: row.created_at
  }));
}

async function findLatestSnapshot(instanceId, db = pool) {
  const [rows] = await db.execute(
    `SELECT * FROM crm_workflow_instance_snapshots
     WHERE instance_id = ? ORDER BY revision_number DESC LIMIT 1`,
    [instanceId]
  );
  if (!rows[0]) return null;
  return {
    id: Number(rows[0].id),
    instanceId: Number(rows[0].instance_id),
    revisionNumber: Number(rows[0].revision_number),
    sourceRecordVersion: rows[0].source_record_version || '',
    snapshot: parseJson(rows[0].snapshot_json, {}),
    checksum: rows[0].snapshot_checksum,
    createdBy: numberOrNull(rows[0].created_by),
    createdAt: rows[0].created_at
  };
}

async function userHasInstanceAssignment(instanceId, userId, db = pool) {
  const [rows] = await db.execute(
    `SELECT 1
     FROM crm_workflow_assignments assignments
     INNER JOIN crm_workflow_instance_stages stages ON stages.id = assignments.instance_stage_id
     WHERE stages.instance_id = ? AND assignments.approver_user_id = ?
     LIMIT 1`,
    [instanceId, userId]
  );
  return Boolean(rows[0]);
}

module.exports = {
  parseJson,
  checksum,
  withTransaction,
  listDefinitions,
  findDefinitionByKey,
  createDefinition,
  updateDefinition,
  listVersions,
  findVersion,
  createVersion,
  findInstanceByRequestKey,
  findInstanceById,
  listInstances,
  createInstance,
  allocateRequestKey,
  appendSnapshot,
  createInstanceStage,
  createAssignments,
  createInstanceBundle,
  listInstanceStages,
  listStageAssignments,
  resetAssignment,
  cancelOpenInstanceWork,
  findActiveStage,
  findAssignmentForApprover,
  countPendingAssignments,
  assignmentCounts,
  findNextWaitingStage,
  cancelPendingAssignments,
  transitionInstance,
  transitionInstanceStage,
  transitionAssignment,
  appendDecision,
  appendAttachment,
  listAttachments,
  findAttachment,
  updateWorkflowSourceFields,
  appendWorkflowDetailRows,
  acquireRecordLock,
  findRecordLock,
  releaseRecordLock,
  appendEvent,
  listPendingEvents,
  claimEvent,
  markEventDelivered,
  markEventFailed,
  storeIdempotency,
  findIdempotency,
  appendAudit,
  listApproverInbox,
  listSlaCandidates,
  markStageOverdue,
  listWorkflowMonitoring,
  findActiveDelegation,
  listDelegations,
  createDelegation,
  cancelDelegation,
  findAssignmentById,
  appendAssignmentTransfer,
  instanceTimeline,
  findLatestSnapshot,
  userHasInstanceAssignment
};
