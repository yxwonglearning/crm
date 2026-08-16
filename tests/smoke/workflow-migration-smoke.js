const assert = require('assert/strict');
const { pool } = require('../../src/database/pool');
const { config } = require('../../src/shared/config');

const expectedTables = [
  'crm_workflow_definitions',
  'crm_workflow_versions',
  'crm_workflow_version_stages',
  'crm_workflow_version_approver_rules',
  'crm_workflow_instances',
  'crm_workflow_instance_snapshots',
  'crm_workflow_instance_stages',
  'crm_workflow_assignments',
  'crm_workflow_decisions',
  'crm_workflow_attachments',
  'crm_workflow_record_locks',
  'crm_workflow_events',
  'crm_workflow_idempotency_keys',
  'crm_workflow_audit_logs'
  ,'crm_workflow_delegations',
  'crm_workflow_assignment_transfers'
];

async function main() {
  try {
    const [tables] = await pool.execute(
      `SELECT TABLE_NAME AS tableName
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'crm_workflow_%'`,
      [config.db.database]
    );
    const tableNames = new Set(tables.map((row) => row.tableName));
    for (const tableName of expectedTables) {
      assert.ok(tableNames.has(tableName), `Expected migration table ${tableName}`);
    }

    const [columns] = await pool.execute(
      `SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName, COLUMN_TYPE AS columnType
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (?, ?, ?, ?, ?, ?, ?)`,
      [
        config.db.database,
        'crm_workflow_definitions',
        'crm_workflow_instances',
        'crm_workflow_instance_stages',
        'crm_workflow_decisions',
        'crm_workflow_attachments',
        'crm_workflow_events',
        'crm_workflow_idempotency_keys'
      ]
    );
    const columnMap = new Map(columns.map((row) => [`${row.tableName}.${row.columnName}`, row.columnType]));
    assert.match(columnMap.get('crm_workflow_definitions.workflow_status') || '', /draft.*published.*archived/);
    assert.ok(columnMap.has('crm_workflow_definitions.request_prefix'));
    assert.ok(columnMap.has('crm_workflow_definitions.next_request_number'));
    assert.match(columnMap.get('crm_workflow_instances.request_status') || '', /draft.*pending.*returned.*approved.*rejected.*withdrawn.*cancelled/);
    assert.match(columnMap.get('crm_workflow_instance_stages.stage_status') || '', /waiting.*active.*approved.*rejected.*returned.*skipped.*auto_approved.*cancelled/);
    assert.ok(columnMap.has('crm_workflow_events.event_key'));
    assert.ok(columnMap.has('crm_workflow_decisions.response_json'));
    assert.ok(columnMap.has('crm_workflow_attachments.file_data'));
    assert.ok(columnMap.has('crm_workflow_idempotency_keys.actor_key'));

    const [actionFlowColumns] = await pool.execute(
      `SELECT COLUMN_NAME AS columnName FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'crm_action_flow_executions' AND COLUMN_NAME = 'trigger_event_key'`,
      [config.db.database]
    );
    assert.equal(actionFlowColumns.length, 1, 'Expected Automation Flow workflow-event idempotency key');

    const [indexes] = await pool.execute(
      `SELECT TABLE_NAME AS tableName, INDEX_NAME AS indexName, NON_UNIQUE AS nonUnique
       FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = ? AND INDEX_NAME IN (?, ?, ?, ?, ?, ?)`,
      [
        config.db.database,
        'crm_workflow_definitions_key_unique',
        'crm_workflow_definitions_request_prefix_unique',
        'crm_workflow_instances_request_key_unique',
        'crm_workflow_record_locks_source_unique',
        'crm_workflow_events_key_unique',
        'crm_workflow_idempotency_scope_unique'
      ]
    );
    const uniqueIndexes = new Set(
      indexes.filter((row) => Number(row.nonUnique) === 0).map((row) => `${row.tableName}.${row.indexName}`)
    );
    assert.ok(uniqueIndexes.has('crm_workflow_definitions.crm_workflow_definitions_key_unique'));
    assert.ok(uniqueIndexes.has('crm_workflow_definitions.crm_workflow_definitions_request_prefix_unique'));
    assert.ok(uniqueIndexes.has('crm_workflow_instances.crm_workflow_instances_request_key_unique'));
    assert.ok(uniqueIndexes.has('crm_workflow_record_locks.crm_workflow_record_locks_source_unique'));
    assert.ok(uniqueIndexes.has('crm_workflow_events.crm_workflow_events_key_unique'));
    assert.ok(uniqueIndexes.has('crm_workflow_idempotency_keys.crm_workflow_idempotency_scope_unique'));
    const [eventExecutionIndexes] = await pool.execute(
      `SELECT NON_UNIQUE AS nonUnique FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'crm_action_flow_executions' AND INDEX_NAME = 'crm_action_flow_executions_event_unique'`,
      [config.db.database]
    );
    assert.ok(eventExecutionIndexes.some((row) => Number(row.nonUnique) === 0), 'Expected unique workflow-event execution index');

    const [constraints] = await pool.execute(
      `SELECT TABLE_NAME AS tableName, CONSTRAINT_NAME AS constraintName
       FROM information_schema.REFERENTIAL_CONSTRAINTS
       WHERE CONSTRAINT_SCHEMA = ? AND CONSTRAINT_NAME IN (?, ?, ?, ?)`,
      [
        config.db.database,
        'crm_workflow_definitions_published_version_fk',
        'crm_workflow_instances_version_fk',
        'crm_workflow_decisions_assignment_fk',
        'crm_workflow_events_decision_fk'
      ]
    );
    const constraintNames = new Set(constraints.map((row) => `${row.tableName}.${row.constraintName}`));
    assert.ok(constraintNames.has('crm_workflow_definitions.crm_workflow_definitions_published_version_fk'));
    assert.ok(constraintNames.has('crm_workflow_instances.crm_workflow_instances_version_fk'));
    assert.ok(constraintNames.has('crm_workflow_decisions.crm_workflow_decisions_assignment_fk'));
    assert.ok(constraintNames.has('crm_workflow_events.crm_workflow_events_decision_fk'));

    process.stdout.write('Workflow migration smoke passed.\n');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
