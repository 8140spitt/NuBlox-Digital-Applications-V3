import { createHash } from 'node:crypto';
import {
  activateMigrationPlan,
  applyCutoverToMigrationPlan,
  applyReconciliationToMigrationRun,
  approveMigrationPlan,
  completeMigrationLoad,
  completeMigrationReconciliationRun,
  createCutoverDecision,
  createMigrationConflict,
  createMigrationConflictDisposition,
  createMigrationItemResult,
  createMigrationMappingVersion,
  createMigrationPlan,
  createMigrationReconciliation,
  createMigrationReconciliationRun,
  createMigrationRun,
  freezeMigrationMappingVersion,
  startMigrationRun,
  type CanonicalDataEnvelope,
  type CanonicalObjectIdentity,
  type CutoverDecision,
  type Decision,
  type ExternalIdentity,
  type IntegrationJob,
  type MigrationConflict,
  type MigrationConflictDisposition,
  type MigrationItemResult,
  type MigrationMappingVersion,
  type MigrationPlan,
  type MigrationReconciliation,
  type MigrationReconciliationRun,
  type MigrationRun,
  type Person,
  type SourceAuthorityRule,
  type TenantId
} from '@nublox/kernel';
import type {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket
} from 'mysql2/promise';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';
import type { AuditContext } from './repository.js';

interface PlanRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  source_system: string;
  target_system: string;
  scope_object_id: string;
  scope_definition: string | Record<string, unknown>;
  cutover_strategy: MigrationPlan['cutoverStrategy'];
  status: MigrationPlan['status'];
  created_by_person_id: string;
  plan_created_at: Date;
  approved_decision_id: string | null;
  approved_at: Date | null;
  row_version: number;
}

interface MappingRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  migration_plan_id: string;
  version: string;
  source_schema_version: string;
  target_schema_version: string;
  mapping_definition: string | Record<string, unknown>;
  checksum: string;
  status: MigrationMappingVersion['status'];
  created_by_person_id: string;
  mapping_created_at: Date;
  frozen_by_person_id: string | null;
  frozen_at: Date | null;
  row_version: number;
}

interface RunRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  migration_plan_id: string;
  mapping_version_id: string;
  run_reference: string;
  run_type: MigrationRun['runType'];
  integration_job_id: string | null;
  requested_by_person_id: string;
  requested_at: Date;
  status: MigrationRun['status'];
  started_at: Date | null;
  load_completed_at: Date | null;
  completed_at: Date | null;
  error_message: string | null;
  active_production_guard_key: string | null;
  row_version: number;
}

interface ItemRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  migration_run_id: string;
  sequence: number;
  source_system: string;
  source_object_type: string;
  source_object_id: string;
  source_version: string | null;
  source_envelope_id: string;
  target_canonical_object_id: string | null;
  target_version: string | null;
  external_identity_id: string | null;
  outcome: MigrationItemResult['outcome'];
  source_hash: string;
  target_hash: string | null;
  message: string | null;
  recorded_at: Date;
}

interface ConflictRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  migration_run_id: string;
  migration_item_result_id: string | null;
  conflict_type: MigrationConflict['conflictType'];
  severity: MigrationConflict['severity'];
  code: string;
  description: string;
  status: MigrationConflict['status'];
  detected_at: Date;
  resolved_at: Date | null;
  row_version: number;
}

interface ReconciliationRunRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  migration_run_id: string;
  checkpoint: MigrationReconciliationRun['checkpoint'];
  status: MigrationReconciliationRun['status'];
  started_by_person_id: string;
  started_at: Date;
  completed_at: Date | null;
  source_count: number | null;
  target_count: number | null;
  verified_count: number | null;
  conflict_count: number | null;
  missing_count: number | null;
  details: string | null;
  row_version: number;
}

interface ReconciliationRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  reconciliation_run_id: string | null;
  external_identity_id: string;
  canonical_object_id: string;
  status: MigrationReconciliation['status'];
  source_hash: string | null;
  target_hash: string | null;
  checked_at: Date;
  details: string | null;
}

interface ObjectRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  object_type: string;
  stable_key: string;
  created_at: Date;
}

interface PersonRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  party_id: string;
  legal_name: string;
  preferred_name: string | null;
  status: Person['status'];
}

interface DecisionRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  decision_type: string;
  subject_object_id: string;
  subject_version: string | null;
  outcome: string;
  reason: string;
  decider_person_id: string;
  authority_grant_id: string | null;
  decided_at: Date;
}

interface EnvelopeRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  direction: CanonicalDataEnvelope['direction'];
  schema_name: string;
  schema_version: string;
  object_type: string;
  stable_key: string;
  payload: string | Record<string, unknown>;
  external_system: string | null;
  external_object_id: string | null;
  checksum: string;
  created_at: Date;
}

interface ExternalIdentityRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  canonical_object_id: string;
  external_system: string;
  external_object_type: string;
  external_object_id: string;
  external_version: string | null;
  source_reference: string | null;
}

interface IntegrationJobRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  job_type: IntegrationJob['jobType'];
  source_system: string | null;
  target_system: string | null;
  requested_by_person_id: string | null;
  requested_at: Date;
  status: IntegrationJob['status'];
  started_at: Date | null;
  completed_at: Date | null;
  cursor_value: string | null;
  result_reference: string | null;
  error_message: string | null;
}

interface AuthorityRuleRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  subject_object_type: string;
  attribute_path: string | null;
  authority_owner: SourceAuthorityRule['authorityOwner'];
  endpoint_id: string | null;
  authority_reference: string | null;
  priority: number;
  effective_from: Date;
  effective_to: Date | null;
  status: SourceAuthorityRule['status'];
}

function sourceIdentityKey(item: MigrationItemResult): string {
  return createHash('sha256')
    .update([
      item.sourceSystem,
      item.sourceObjectType,
      item.sourceObjectId,
      item.sourceVersion ?? ''
    ].join('|'))
    .digest('hex');
}

function dbDate(value: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid date/time value: ${value}`);
  return parsed;
}

function jsonObject(value: string | Record<string, unknown>): Readonly<Record<string, unknown>> {
  const parsed = typeof value === 'string' ? JSON.parse(value) as unknown : value;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Expected JSON object from migration persistence.');
  }
  return parsed as Readonly<Record<string, unknown>>;
}

function mapPlan(row: PlanRow): MigrationPlan {
  return {
    id: row.id as MigrationPlan['id'],
    tenantId: row.tenant_id as TenantId,
    code: row.code,
    name: row.name,
    sourceSystem: row.source_system,
    targetSystem: row.target_system,
    scopeObjectId: row.scope_object_id as MigrationPlan['scopeObjectId'],
    scopeDefinition: jsonObject(row.scope_definition),
    cutoverStrategy: row.cutover_strategy,
    status: row.status,
    createdByPersonId: row.created_by_person_id as MigrationPlan['createdByPersonId'],
    createdAt: row.plan_created_at.toISOString(),
    ...(row.approved_decision_id
      ? { approvedDecisionId: row.approved_decision_id as NonNullable<MigrationPlan['approvedDecisionId']> }
      : {}),
    ...(row.approved_at ? { approvedAt: row.approved_at.toISOString() } : {})
  };
}

function mapMapping(row: MappingRow): MigrationMappingVersion {
  return {
    id: row.id as MigrationMappingVersion['id'],
    tenantId: row.tenant_id as TenantId,
    migrationPlanId: row.migration_plan_id as MigrationMappingVersion['migrationPlanId'],
    version: row.version,
    sourceSchemaVersion: row.source_schema_version,
    targetSchemaVersion: row.target_schema_version,
    mappingDefinition: jsonObject(row.mapping_definition),
    checksum: row.checksum,
    status: row.status,
    createdByPersonId: row.created_by_person_id as MigrationMappingVersion['createdByPersonId'],
    createdAt: row.mapping_created_at.toISOString(),
    ...(row.frozen_by_person_id
      ? { frozenByPersonId: row.frozen_by_person_id as NonNullable<MigrationMappingVersion['frozenByPersonId']> }
      : {}),
    ...(row.frozen_at ? { frozenAt: row.frozen_at.toISOString() } : {})
  };
}

function mapRun(row: RunRow): MigrationRun {
  return {
    id: row.id as MigrationRun['id'],
    tenantId: row.tenant_id as TenantId,
    migrationPlanId: row.migration_plan_id as MigrationRun['migrationPlanId'],
    mappingVersionId: row.mapping_version_id as MigrationRun['mappingVersionId'],
    runReference: row.run_reference,
    runType: row.run_type,
    ...(row.integration_job_id
      ? { integrationJobId: row.integration_job_id as NonNullable<MigrationRun['integrationJobId']> }
      : {}),
    requestedByPersonId: row.requested_by_person_id as MigrationRun['requestedByPersonId'],
    requestedAt: row.requested_at.toISOString(),
    status: row.status,
    ...(row.started_at ? { startedAt: row.started_at.toISOString() } : {}),
    ...(row.load_completed_at ? { loadCompletedAt: row.load_completed_at.toISOString() } : {}),
    ...(row.completed_at ? { completedAt: row.completed_at.toISOString() } : {}),
    ...(row.error_message ? { errorMessage: row.error_message } : {})
  };
}

function mapItem(row: ItemRow): MigrationItemResult {
  return {
    id: row.id as MigrationItemResult['id'],
    tenantId: row.tenant_id as TenantId,
    migrationRunId: row.migration_run_id as MigrationItemResult['migrationRunId'],
    sequence: Number(row.sequence),
    sourceSystem: row.source_system,
    sourceObjectType: row.source_object_type,
    sourceObjectId: row.source_object_id,
    ...(row.source_version ? { sourceVersion: row.source_version } : {}),
    sourceEnvelopeId: row.source_envelope_id as MigrationItemResult['sourceEnvelopeId'],
    ...(row.target_canonical_object_id
      ? { targetCanonicalObjectId: row.target_canonical_object_id as NonNullable<MigrationItemResult['targetCanonicalObjectId']> }
      : {}),
    ...(row.target_version ? { targetVersion: row.target_version } : {}),
    ...(row.external_identity_id
      ? { externalIdentityId: row.external_identity_id as NonNullable<MigrationItemResult['externalIdentityId']> }
      : {}),
    outcome: row.outcome,
    sourceHash: row.source_hash,
    ...(row.target_hash ? { targetHash: row.target_hash } : {}),
    ...(row.message ? { message: row.message } : {}),
    recordedAt: row.recorded_at.toISOString()
  };
}

function mapConflict(row: ConflictRow): MigrationConflict {
  return {
    id: row.id as MigrationConflict['id'],
    tenantId: row.tenant_id as TenantId,
    migrationRunId: row.migration_run_id as MigrationConflict['migrationRunId'],
    ...(row.migration_item_result_id
      ? { migrationItemResultId: row.migration_item_result_id as NonNullable<MigrationConflict['migrationItemResultId']> }
      : {}),
    conflictType: row.conflict_type,
    severity: row.severity,
    code: row.code,
    description: row.description,
    status: row.status,
    detectedAt: row.detected_at.toISOString(),
    ...(row.resolved_at ? { resolvedAt: row.resolved_at.toISOString() } : {})
  };
}

function mapReconciliationRun(row: ReconciliationRunRow): MigrationReconciliationRun {
  return {
    id: row.id as MigrationReconciliationRun['id'],
    tenantId: row.tenant_id as TenantId,
    migrationRunId: row.migration_run_id as MigrationReconciliationRun['migrationRunId'],
    checkpoint: row.checkpoint,
    status: row.status,
    startedByPersonId: row.started_by_person_id as MigrationReconciliationRun['startedByPersonId'],
    startedAt: row.started_at.toISOString(),
    ...(row.completed_at ? { completedAt: row.completed_at.toISOString() } : {}),
    ...(row.source_count !== null ? { sourceCount: Number(row.source_count) } : {}),
    ...(row.target_count !== null ? { targetCount: Number(row.target_count) } : {}),
    ...(row.verified_count !== null ? { verifiedCount: Number(row.verified_count) } : {}),
    ...(row.conflict_count !== null ? { conflictCount: Number(row.conflict_count) } : {}),
    ...(row.missing_count !== null ? { missingCount: Number(row.missing_count) } : {}),
    ...(row.details ? { details: row.details } : {})
  };
}

function mapReconciliation(row: ReconciliationRow): MigrationReconciliation {
  return {
    id: row.id as MigrationReconciliation['id'],
    tenantId: row.tenant_id as TenantId,
    externalIdentityId: row.external_identity_id as MigrationReconciliation['externalIdentityId'],
    canonicalObjectId: row.canonical_object_id as MigrationReconciliation['canonicalObjectId'],
    status: row.status,
    ...(row.source_hash ? { sourceHash: row.source_hash } : {}),
    ...(row.target_hash ? { targetHash: row.target_hash } : {}),
    checkedAt: row.checked_at.toISOString(),
    ...(row.details ? { details: row.details } : {})
  };
}

function mapObject(row: ObjectRow): CanonicalObjectIdentity {
  return {
    id: row.id as CanonicalObjectIdentity['id'],
    tenantId: row.tenant_id as TenantId,
    objectType: row.object_type,
    stableKey: row.stable_key,
    createdAt: row.created_at.toISOString()
  };
}

function mapPerson(row: PersonRow): Person {
  return {
    id: row.id as Person['id'],
    tenantId: row.tenant_id as TenantId,
    partyId: row.party_id as Person['partyId'],
    legalName: row.legal_name,
    ...(row.preferred_name ? { preferredName: row.preferred_name } : {}),
    status: row.status
  };
}

function mapDecision(row: DecisionRow): Decision {
  return {
    id: row.id as Decision['id'],
    tenantId: row.tenant_id as TenantId,
    decisionType: row.decision_type,
    subjectObjectId: row.subject_object_id as Decision['subjectObjectId'],
    ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
    outcome: row.outcome,
    reason: row.reason,
    deciderPersonId: row.decider_person_id as Decision['deciderPersonId'],
    ...(row.authority_grant_id
      ? { authorityGrantId: row.authority_grant_id as NonNullable<Decision['authorityGrantId']> }
      : {}),
    decidedAt: row.decided_at.toISOString()
  };
}

function mapEnvelope(row: EnvelopeRow): CanonicalDataEnvelope {
  return {
    id: row.id as CanonicalDataEnvelope['id'],
    tenantId: row.tenant_id as TenantId,
    direction: row.direction,
    schemaName: row.schema_name,
    schemaVersion: row.schema_version,
    objectType: row.object_type,
    stableKey: row.stable_key,
    payload: jsonObject(row.payload),
    ...(row.external_system ? { externalSystem: row.external_system } : {}),
    ...(row.external_object_id ? { externalObjectId: row.external_object_id } : {}),
    checksum: row.checksum,
    createdAt: row.created_at.toISOString()
  };
}

function mapExternalIdentity(row: ExternalIdentityRow): ExternalIdentity {
  return {
    id: row.id as ExternalIdentity['id'],
    tenantId: row.tenant_id as TenantId,
    canonicalObjectId: row.canonical_object_id as ExternalIdentity['canonicalObjectId'],
    externalSystem: row.external_system,
    externalObjectType: row.external_object_type,
    externalObjectId: row.external_object_id,
    ...(row.external_version ? { externalVersion: row.external_version } : {}),
    ...(row.source_reference ? { sourceReference: row.source_reference } : {})
  };
}

function mapIntegrationJob(row: IntegrationJobRow): IntegrationJob {
  return {
    id: row.id as IntegrationJob['id'],
    tenantId: row.tenant_id as TenantId,
    jobType: row.job_type,
    ...(row.source_system ? { sourceSystem: row.source_system } : {}),
    ...(row.target_system ? { targetSystem: row.target_system } : {}),
    ...(row.requested_by_person_id
      ? { requestedByPersonId: row.requested_by_person_id as NonNullable<IntegrationJob['requestedByPersonId']> }
      : {}),
    requestedAt: row.requested_at.toISOString(),
    status: row.status,
    ...(row.started_at ? { startedAt: row.started_at.toISOString() } : {}),
    ...(row.completed_at ? { completedAt: row.completed_at.toISOString() } : {}),
    ...(row.cursor_value ? { cursor: row.cursor_value } : {}),
    ...(row.result_reference ? { resultReference: row.result_reference } : {}),
    ...(row.error_message ? { errorMessage: row.error_message } : {})
  };
}

function mapAuthorityRule(row: AuthorityRuleRow): SourceAuthorityRule {
  return {
    id: row.id as SourceAuthorityRule['id'],
    tenantId: row.tenant_id as TenantId,
    code: row.code,
    name: row.name,
    subjectObjectType: row.subject_object_type,
    ...(row.attribute_path ? { attributePath: row.attribute_path } : {}),
    authorityOwner: row.authority_owner,
    ...(row.endpoint_id ? { endpointId: row.endpoint_id as NonNullable<SourceAuthorityRule['endpointId']> } : {}),
    ...(row.authority_reference ? { authorityReference: row.authority_reference } : {}),
    priority: Number(row.priority),
    effectiveFrom: row.effective_from.toISOString(),
    ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
    status: row.status
  };
}

async function evidence(
  connection: PoolConnection,
  tenantId: TenantId,
  entityType: string,
  entityId: string,
  action: string,
  audit: AuditContext,
  payload: unknown
): Promise<void> {
  await connection.execute(
    `INSERT INTO kernel_audit_entries
      (tenant_id, entity_type, entity_id, action, actor_person_id, correlation_id, payload)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      tenantId,
      entityType,
      entityId,
      action,
      audit.actorPersonId ?? null,
      audit.correlationId ?? null,
      JSON.stringify(payload)
    ]
  );
  await writeOutboxEvent(connection, {
    tenantId,
    aggregateType: entityType,
    aggregateId: entityId,
    eventType: `${entityType}.${action}`,
    payload
  });
}

export class MySqlMigrationRepository {
  constructor(private readonly pool: Pool) {}

  async createPlan(plan: MigrationPlan, audit: AuditContext = {}): Promise<void> {
    const [scope, creator] = await Promise.all([
      this.requireObject(plan.tenantId, plan.scopeObjectId),
      this.requirePerson(plan.tenantId, plan.createdByPersonId)
    ]);
    createMigrationPlan(plan, scope, creator);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO migration_plans
          (id, tenant_id, code, name, source_system, target_system, scope_object_id,
           scope_definition, cutover_strategy, status, created_by_person_id,
           plan_created_at, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          plan.id, plan.tenantId, plan.code, plan.name, plan.sourceSystem,
          plan.targetSystem, plan.scopeObjectId, JSON.stringify(plan.scopeDefinition),
          plan.cutoverStrategy, plan.status, plan.createdByPersonId,
          dbDate(plan.createdAt), audit.actorPersonId ?? null
        ]
      );
      await evidence(connection, plan.tenantId, 'MIGRATION_PLAN', plan.id, 'CREATED', audit, plan);
    });
  }

  async approvePlan(
    tenantId: TenantId,
    planId: MigrationPlan['id'],
    decisionId: Decision['id'],
    approvedAt: string,
    audit: AuditContext = {}
  ): Promise<MigrationPlan> {
    return withTransaction(this.pool, async (connection) => {
      const planRow = await this.requirePlanRowForUpdate(connection, tenantId, planId);
      const decision = await this.requireDecision(tenantId, decisionId, connection);
      const next = approveMigrationPlan(mapPlan(planRow), decision, approvedAt);
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE migration_plans
            SET status = ?, approved_decision_id = ?, approved_at = ?,
                updated_by_person_id = ?, row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          next.status, decisionId, dbDate(approvedAt), audit.actorPersonId ?? null,
          tenantId, planId, planRow.row_version
        ]
      );
      if (result.affectedRows !== 1) throw new Error('Concurrent Migration Plan approval detected.');
      await evidence(connection, tenantId, 'MIGRATION_PLAN', planId, 'APPROVED', audit, next);
      return next;
    });
  }

  async createMapping(mapping: MigrationMappingVersion, audit: AuditContext = {}): Promise<void> {
    const [plan, creator] = await Promise.all([
      this.requirePlan(mapping.tenantId, mapping.migrationPlanId),
      this.requirePerson(mapping.tenantId, mapping.createdByPersonId)
    ]);
    createMigrationMappingVersion(mapping, plan, creator);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO migration_mapping_versions
          (id, tenant_id, migration_plan_id, version, source_schema_version,
           target_schema_version, mapping_definition, checksum, status,
           created_by_person_id, mapping_created_at, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mapping.id, mapping.tenantId, mapping.migrationPlanId, mapping.version,
          mapping.sourceSchemaVersion, mapping.targetSchemaVersion,
          JSON.stringify(mapping.mappingDefinition), mapping.checksum, mapping.status,
          mapping.createdByPersonId, dbDate(mapping.createdAt),
          audit.actorPersonId ?? null
        ]
      );
      await evidence(connection, mapping.tenantId, 'MIGRATION_MAPPING_VERSION', mapping.id, 'CREATED', audit, mapping);
    });
  }

  async freezeMapping(
    tenantId: TenantId,
    mappingId: MigrationMappingVersion['id'],
    freezerId: Person['id'],
    frozenAt: string,
    audit: AuditContext = {}
  ): Promise<MigrationMappingVersion> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireMappingRowForUpdate(connection, tenantId, mappingId);
      const freezer = await this.requirePerson(tenantId, freezerId, connection);
      const next = freezeMigrationMappingVersion(mapMapping(row), freezer, frozenAt);
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE migration_mapping_versions
            SET status = ?, frozen_by_person_id = ?, frozen_at = ?,
                updated_by_person_id = ?, row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          next.status, freezerId, dbDate(frozenAt), audit.actorPersonId ?? null,
          tenantId, mappingId, row.row_version
        ]
      );
      if (result.affectedRows !== 1) throw new Error('Concurrent Migration Mapping freeze detected.');
      await evidence(connection, tenantId, 'MIGRATION_MAPPING_VERSION', mappingId, 'FROZEN', audit, next);
      return next;
    });
  }

  async createRun(run: MigrationRun, audit: AuditContext = {}): Promise<void> {
    const [plan, mapping, requester, job] = await Promise.all([
      this.requirePlan(run.tenantId, run.migrationPlanId),
      this.requireMapping(run.tenantId, run.mappingVersionId),
      this.requirePerson(run.tenantId, run.requestedByPersonId),
      run.integrationJobId
        ? this.requireIntegrationJob(run.tenantId, run.integrationJobId)
        : Promise.resolve(undefined)
    ]);
    createMigrationRun(run, plan, mapping, requester, job);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO migration_runs
          (id, tenant_id, migration_plan_id, mapping_version_id, run_reference,
           run_type, integration_job_id, requested_by_person_id, requested_at,
           status, active_production_guard_key, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          run.id, run.tenantId, run.migrationPlanId, run.mappingVersionId,
          run.runReference, run.runType, run.integrationJobId ?? null,
          run.requestedByPersonId, dbDate(run.requestedAt), run.status,
          run.runType === 'PRODUCTION' ? run.migrationPlanId : null,
          audit.actorPersonId ?? null
        ]
      );
      await evidence(connection, run.tenantId, 'MIGRATION_RUN', run.id, 'QUEUED', audit, run);
    });
  }

  async startRun(
    tenantId: TenantId,
    runId: MigrationRun['id'],
    startedAt: string,
    audit: AuditContext = {}
  ): Promise<MigrationRun> {
    return withTransaction(this.pool, async (connection) => {
      const runRow = await this.requireRunRowForUpdate(connection, tenantId, runId);
      const planRow = await this.requirePlanRowForUpdate(
        connection,
        tenantId,
        runRow.migration_plan_id as MigrationPlan['id']
      );
      const nextRun = startMigrationRun(mapRun(runRow), startedAt);
      const nextPlan = activateMigrationPlan(mapPlan(planRow));

      const [runResult] = await connection.execute<ResultSetHeader>(
        `UPDATE migration_runs
            SET status = ?, started_at = ?, updated_by_person_id = ?,
                row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          nextRun.status, dbDate(startedAt), audit.actorPersonId ?? null,
          tenantId, runId, runRow.row_version
        ]
      );
      if (runResult.affectedRows !== 1) throw new Error('Concurrent Migration Run start detected.');

      if (nextPlan.status !== planRow.status) {
        const [planResult] = await connection.execute<ResultSetHeader>(
          `UPDATE migration_plans
              SET status = ?, updated_by_person_id = ?,
                  row_version = row_version + 1
            WHERE tenant_id = ? AND id = ? AND row_version = ?`,
          [
            nextPlan.status, audit.actorPersonId ?? null,
            tenantId, nextPlan.id, planRow.row_version
          ]
        );
        if (planResult.affectedRows !== 1) throw new Error('Concurrent Migration Plan activation detected.');
        await evidence(connection, tenantId, 'MIGRATION_PLAN', nextPlan.id, 'ACTIVATED', audit, nextPlan);
      }

      await evidence(connection, tenantId, 'MIGRATION_RUN', runId, 'STARTED', audit, nextRun);
      return nextRun;
    });
  }

  async recordItem(item: MigrationItemResult, audit: AuditContext = {}): Promise<void> {
    const run = await this.requireRun(item.tenantId, item.migrationRunId);
    const plan = await this.requirePlan(item.tenantId, run.migrationPlanId);
    const [envelope, target, identity] = await Promise.all([
      this.requireEnvelope(item.tenantId, item.sourceEnvelopeId),
      item.targetCanonicalObjectId
        ? this.requireObject(item.tenantId, item.targetCanonicalObjectId)
        : Promise.resolve(undefined),
      item.externalIdentityId
        ? this.requireExternalIdentity(item.tenantId, item.externalIdentityId)
        : Promise.resolve(undefined)
    ]);
    createMigrationItemResult(item, run, plan, envelope, target, identity);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO migration_item_results
          (id, tenant_id, migration_run_id, sequence, source_system,
           source_object_type, source_object_id, source_version, source_identity_key,
           source_envelope_id, target_canonical_object_id, target_version,
           external_identity_id, outcome, source_hash, target_hash, message,
           recorded_at, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id, item.tenantId, item.migrationRunId, item.sequence,
          item.sourceSystem, item.sourceObjectType, item.sourceObjectId,
          item.sourceVersion ?? null, sourceIdentityKey(item), item.sourceEnvelopeId,
          item.targetCanonicalObjectId ?? null, item.targetVersion ?? null,
          item.externalIdentityId ?? null, item.outcome, item.sourceHash,
          item.targetHash ?? null, item.message ?? null, dbDate(item.recordedAt),
          audit.actorPersonId ?? null
        ]
      );
      await evidence(connection, item.tenantId, 'MIGRATION_ITEM_RESULT', item.id, item.outcome, audit, item);
    });
  }

  async createConflict(conflict: MigrationConflict, audit: AuditContext = {}): Promise<void> {
    const run = await this.requireRun(conflict.tenantId, conflict.migrationRunId);
    const item = conflict.migrationItemResultId
      ? await this.requireItem(conflict.tenantId, conflict.migrationItemResultId)
      : undefined;
    createMigrationConflict(conflict, run, item);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO migration_conflicts
          (id, tenant_id, migration_run_id, migration_item_result_id,
           conflict_type, severity, code, description, status, detected_at,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          conflict.id, conflict.tenantId, conflict.migrationRunId,
          conflict.migrationItemResultId ?? null, conflict.conflictType,
          conflict.severity, conflict.code, conflict.description,
          conflict.status, dbDate(conflict.detectedAt),
          audit.actorPersonId ?? null, audit.actorPersonId ?? null
        ]
      );
      await evidence(connection, conflict.tenantId, 'MIGRATION_CONFLICT', conflict.id, 'OPENED', audit, conflict);
    });
  }

  async completeLoad(
    tenantId: TenantId,
    runId: MigrationRun['id'],
    completedAt: string,
    audit: AuditContext = {}
  ): Promise<MigrationRun> {
    return withTransaction(this.pool, async (connection) => {
      const runRow = await this.requireRunRowForUpdate(connection, tenantId, runId);
      const [itemRows] = await connection.execute<ItemRow[]>(
        `SELECT id, tenant_id, migration_run_id, sequence, source_system,
                source_object_type, source_object_id, source_version, source_envelope_id,
                target_canonical_object_id, target_version, external_identity_id,
                outcome, source_hash, target_hash, message, recorded_at
           FROM migration_item_results
          WHERE tenant_id = ? AND migration_run_id = ?
          ORDER BY sequence, id
          FOR UPDATE`,
        [tenantId, runId]
      );
      const next = completeMigrationLoad(mapRun(runRow), itemRows.map(mapItem), completedAt);
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE migration_runs
            SET status = ?, load_completed_at = ?,
                active_production_guard_key = ?,
                updated_by_person_id = ?, row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          next.status,
          dbDate(completedAt),
          next.runType === 'PRODUCTION' && next.status === 'AWAITING_RECONCILIATION'
            ? next.migrationPlanId
            : null,
          audit.actorPersonId ?? null,
          tenantId, runId, runRow.row_version
        ]
      );
      if (result.affectedRows !== 1) throw new Error('Concurrent Migration Run load completion detected.');
      await evidence(connection, tenantId, 'MIGRATION_RUN', runId, 'LOAD_COMPLETED', audit, next);
      return next;
    });
  }

  async dispositionConflict(
    disposition: MigrationConflictDisposition,
    audit: AuditContext = {}
  ): Promise<void> {
    await withTransaction(this.pool, async (connection) => {
      const conflictRow = await this.requireConflictRowForUpdate(
        connection,
        disposition.tenantId,
        disposition.migrationConflictId
      );
      const conflict = mapConflict(conflictRow);
      const run = await this.requireRun(disposition.tenantId, conflict.migrationRunId, connection);
      const plan = await this.requirePlan(disposition.tenantId, run.migrationPlanId, connection);
      const [decision, disposer, retryRun] = await Promise.all([
        this.requireDecision(disposition.tenantId, disposition.decisionId, connection),
        this.requirePerson(disposition.tenantId, disposition.disposedByPersonId, connection),
        disposition.retryRunId
          ? this.requireRun(disposition.tenantId, disposition.retryRunId, connection)
          : Promise.resolve(undefined)
      ]);
      createMigrationConflictDisposition(
        disposition, conflict, plan, decision, disposer, retryRun
      );

      await connection.execute(
        `INSERT INTO migration_conflict_dispositions
          (id, tenant_id, migration_conflict_id, disposition, rationale,
           decision_id, disposed_by_person_id, disposed_at, retry_run_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          disposition.id, disposition.tenantId, disposition.migrationConflictId,
          disposition.disposition, disposition.rationale, disposition.decisionId,
          disposition.disposedByPersonId, dbDate(disposition.disposedAt),
          disposition.retryRunId ?? null
        ]
      );
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE migration_conflicts
            SET status = 'DISPOSITIONED', resolved_at = ?, updated_by_person_id = ?,
                row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          dbDate(disposition.disposedAt), audit.actorPersonId ?? null,
          disposition.tenantId, conflict.id, conflictRow.row_version
        ]
      );
      if (result.affectedRows !== 1) throw new Error('Concurrent Migration Conflict disposition detected.');
      await evidence(
        connection, disposition.tenantId, 'MIGRATION_CONFLICT_DISPOSITION',
        disposition.id, disposition.disposition, audit, disposition
      );
    });
  }

  async startReconciliationRun(
    reconciliation: MigrationReconciliationRun,
    audit: AuditContext = {}
  ): Promise<void> {
    const [run, starter] = await Promise.all([
      this.requireRun(reconciliation.tenantId, reconciliation.migrationRunId),
      this.requirePerson(reconciliation.tenantId, reconciliation.startedByPersonId)
    ]);
    createMigrationReconciliationRun(reconciliation, run, starter);

    const [untrackedRows] = await this.pool.execute<RowDataPacket[]>(
      `SELECT i.id
         FROM migration_item_results i
         LEFT JOIN migration_conflicts c
           ON c.tenant_id = i.tenant_id
          AND c.migration_run_id = i.migration_run_id
          AND c.migration_item_result_id = i.id
        WHERE i.tenant_id = ?
          AND i.migration_run_id = ?
          AND i.outcome IN ('FAILED','CONFLICT')
          AND c.id IS NULL
        LIMIT 1`,
      [reconciliation.tenantId, reconciliation.migrationRunId]
    );
    if (untrackedRows.length > 0) {
      throw new Error('Failed or conflicted Migration Item Result must have explicit Migration Conflict evidence before reconciliation.');
    }

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO migration_reconciliation_runs
          (id, tenant_id, migration_run_id, checkpoint, status,
           started_by_person_id, started_at, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reconciliation.id, reconciliation.tenantId,
          reconciliation.migrationRunId, reconciliation.checkpoint,
          reconciliation.status, reconciliation.startedByPersonId,
          dbDate(reconciliation.startedAt), audit.actorPersonId ?? null
        ]
      );
      await evidence(
        connection, reconciliation.tenantId, 'MIGRATION_RECONCILIATION_RUN',
        reconciliation.id, 'STARTED', audit, reconciliation
      );
    });
  }

  async recordReconciliation(
    reconciliationRunId: MigrationReconciliationRun['id'],
    reconciliation: MigrationReconciliation,
    audit: AuditContext = {}
  ): Promise<void> {
    const run = await this.requireReconciliationRun(reconciliation.tenantId, reconciliationRunId);
    if (run.status !== 'RUNNING') {
      throw new Error('Migration Reconciliation evidence can only be recorded while Reconciliation Run is RUNNING.');
    }
    const [identity, object, migrationRun] = await Promise.all([
      this.requireExternalIdentity(reconciliation.tenantId, reconciliation.externalIdentityId),
      this.requireObject(reconciliation.tenantId, reconciliation.canonicalObjectId),
      this.requireRun(reconciliation.tenantId, run.migrationRunId)
    ]);
    createMigrationReconciliation(reconciliation, identity, object);

    const [itemRows] = await this.pool.execute<ItemRow[]>(
      `SELECT id, tenant_id, migration_run_id, sequence, source_system,
              source_object_type, source_object_id, source_version, source_envelope_id,
              target_canonical_object_id, target_version, external_identity_id,
              outcome, source_hash, target_hash, message, recorded_at
         FROM migration_item_results
        WHERE tenant_id = ?
          AND migration_run_id = ?
          AND external_identity_id = ?
          AND target_canonical_object_id = ?
        ORDER BY sequence, id
        LIMIT 1`,
      [
        reconciliation.tenantId,
        migrationRun.id,
        reconciliation.externalIdentityId,
        reconciliation.canonicalObjectId
      ]
    );
    const item = itemRows[0] ? mapItem(itemRows[0]) : undefined;
    if (!item) {
      throw new Error(
        'Migration Reconciliation must reference External Identity and canonical object evidence from the exact Migration Run.'
      );
    }
    if (
      reconciliation.sourceHash !== undefined &&
      reconciliation.sourceHash !== item.sourceHash
    ) {
      throw new Error('Migration Reconciliation sourceHash does not match the Migration Item Result.');
    }
    if (
      reconciliation.targetHash !== undefined &&
      item.targetHash !== undefined &&
      reconciliation.targetHash !== item.targetHash
    ) {
      throw new Error('Migration Reconciliation targetHash does not match the Migration Item Result.');
    }

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO migration_reconciliations
          (id, tenant_id, reconciliation_run_id, external_identity_id,
           canonical_object_id, status, source_hash, target_hash,
           checked_at, details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reconciliation.id, reconciliation.tenantId, reconciliationRunId,
          reconciliation.externalIdentityId, reconciliation.canonicalObjectId,
          reconciliation.status, reconciliation.sourceHash ?? null,
          reconciliation.targetHash ?? null, dbDate(reconciliation.checkedAt),
          reconciliation.details ?? null
        ]
      );
      await evidence(
        connection, reconciliation.tenantId, 'MIGRATION_RECONCILIATION',
        reconciliation.id, reconciliation.status, audit,
        { reconciliationRunId, ...reconciliation }
      );
    });
  }

  async completeReconciliationRun(
    tenantId: TenantId,
    reconciliationRunId: MigrationReconciliationRun['id'],
    completedAt: string,
    details: string | undefined,
    audit: AuditContext = {}
  ): Promise<{ reconciliation: MigrationReconciliationRun; run: MigrationRun }> {
    return withTransaction(this.pool, async (connection) => {
      const recRow = await this.requireReconciliationRunRowForUpdate(
        connection, tenantId, reconciliationRunId
      );
      const [evidenceRows] = await connection.execute<ReconciliationRow[]>(
        `SELECT id, tenant_id, reconciliation_run_id, external_identity_id,
                canonical_object_id, status, source_hash, target_hash,
                checked_at, details
           FROM migration_reconciliations
          WHERE tenant_id = ? AND reconciliation_run_id = ?
          ORDER BY checked_at, id
          FOR UPDATE`,
        [tenantId, reconciliationRunId]
      );
      const [blockingRows] = await connection.execute<Array<RowDataPacket & { total: number }>>(
        `SELECT COUNT(*) AS total
           FROM migration_conflicts
          WHERE tenant_id = ?
            AND migration_run_id = ?
            AND severity = 'BLOCKING'
            AND status = 'OPEN'`,
        [tenantId, recRow.migration_run_id]
      );
      const openBlocking = Number(blockingRows[0]?.total ?? 0);
      const nextReconciliation = completeMigrationReconciliationRun(
        mapReconciliationRun(recRow),
        evidenceRows.map(mapReconciliation),
        openBlocking,
        completedAt,
        details
      );

      const [recUpdate] = await connection.execute<ResultSetHeader>(
        `UPDATE migration_reconciliation_runs
            SET status = ?, completed_at = ?, source_count = ?, target_count = ?,
                verified_count = ?, conflict_count = ?, missing_count = ?,
                details = ?, updated_by_person_id = ?, row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          nextReconciliation.status, dbDate(completedAt),
          nextReconciliation.sourceCount ?? null,
          nextReconciliation.targetCount ?? null,
          nextReconciliation.verifiedCount ?? null,
          nextReconciliation.conflictCount ?? null,
          nextReconciliation.missingCount ?? null,
          nextReconciliation.details ?? null,
          audit.actorPersonId ?? null,
          tenantId, reconciliationRunId, recRow.row_version
        ]
      );
      if (recUpdate.affectedRows !== 1) throw new Error('Concurrent Migration Reconciliation Run completion detected.');

      const runRow = await this.requireRunRowForUpdate(
        connection,
        tenantId,
        recRow.migration_run_id as MigrationRun['id']
      );
      const nextRun = applyReconciliationToMigrationRun(
        mapRun(runRow),
        nextReconciliation
      );
      const [runUpdate] = await connection.execute<ResultSetHeader>(
        `UPDATE migration_runs
            SET status = ?, completed_at = ?,
                active_production_guard_key = ?,
                updated_by_person_id = ?, row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          nextRun.status,
          nextRun.completedAt ? dbDate(nextRun.completedAt) : null,
          nextRun.runType === 'PRODUCTION' &&
            ['QUEUED','RUNNING','AWAITING_RECONCILIATION'].includes(nextRun.status)
            ? nextRun.migrationPlanId
            : null,
          audit.actorPersonId ?? null,
          tenantId, nextRun.id, runRow.row_version
        ]
      );
      if (runUpdate.affectedRows !== 1) throw new Error('Concurrent Migration Run reconciliation update detected.');

      await evidence(
        connection, tenantId, 'MIGRATION_RECONCILIATION_RUN',
        reconciliationRunId, nextReconciliation.status, audit, nextReconciliation
      );
      await evidence(
        connection, tenantId, 'MIGRATION_RUN',
        nextRun.id, nextRun.status, audit, nextRun
      );
      return { reconciliation: nextReconciliation, run: nextRun };
    });
  }

  async recordCutover(
    cutover: CutoverDecision,
    audit: AuditContext = {}
  ): Promise<{ cutover: CutoverDecision; plan: MigrationPlan }> {
    return withTransaction(this.pool, async (connection) => {
      const planRow = await this.requirePlanRowForUpdate(
        connection, cutover.tenantId, cutover.migrationPlanId
      );
      const run = await this.requireRun(cutover.tenantId, cutover.migrationRunId, connection);
      const reconciliation = await this.requireReconciliationRun(
        cutover.tenantId, cutover.reconciliationRunId, connection
      );
      const [decision, decider, authorityRule] = await Promise.all([
        this.requireDecision(cutover.tenantId, cutover.decisionId, connection),
        this.requirePerson(cutover.tenantId, cutover.decidedByPersonId, connection),
        cutover.targetAuthorityRuleId
          ? this.requireAuthorityRule(cutover.tenantId, cutover.targetAuthorityRuleId, connection)
          : Promise.resolve(undefined)
      ]);
      const currentPlan = mapPlan(planRow);
      const [otherProductionRows] = await connection.execute<Array<RowDataPacket & { total: number }>>(
        `SELECT COUNT(*) AS total
           FROM migration_runs
          WHERE tenant_id = ?
            AND migration_plan_id = ?
            AND id <> ?
            AND run_type = 'PRODUCTION'
            AND status IN ('QUEUED','RUNNING','AWAITING_RECONCILIATION')`,
        [cutover.tenantId, cutover.migrationPlanId, cutover.migrationRunId]
      );
      if (Number(otherProductionRows[0]?.total ?? 0) > 0) {
        throw new Error(
          'Cutover cannot proceed while another production Migration Run for the Plan is active.'
        );
      }
      const validated = createCutoverDecision(
        cutover, currentPlan, run, reconciliation, decision, decider, authorityRule
      );
      const nextPlan = applyCutoverToMigrationPlan(currentPlan, validated);

      await connection.execute(
        `INSERT INTO cutover_decisions
          (id, tenant_id, migration_plan_id, migration_run_id,
           reconciliation_run_id, decision_id, outcome,
           target_authority_rule_id, decided_by_person_id,
           decided_at, effective_at, reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          validated.id, validated.tenantId, validated.migrationPlanId,
          validated.migrationRunId, validated.reconciliationRunId,
          validated.decisionId, validated.outcome,
          validated.targetAuthorityRuleId ?? null,
          validated.decidedByPersonId, dbDate(validated.decidedAt),
          validated.effectiveAt ? dbDate(validated.effectiveAt) : null,
          validated.reason
        ]
      );

      if (nextPlan.status !== currentPlan.status) {
        const [planUpdate] = await connection.execute<ResultSetHeader>(
          `UPDATE migration_plans
              SET status = ?, updated_by_person_id = ?,
                  row_version = row_version + 1
            WHERE tenant_id = ? AND id = ? AND row_version = ?`,
          [
            nextPlan.status, audit.actorPersonId ?? null,
            cutover.tenantId, nextPlan.id, planRow.row_version
          ]
        );
        if (planUpdate.affectedRows !== 1) throw new Error('Concurrent Migration Plan cutover completion detected.');
      }

      await evidence(
        connection, cutover.tenantId, 'CUTOVER_DECISION',
        validated.id, validated.outcome, audit, validated
      );
      if (nextPlan.status !== currentPlan.status) {
        await evidence(
          connection, cutover.tenantId, 'MIGRATION_PLAN',
          nextPlan.id, 'COMPLETED', audit, nextPlan
        );
      }
      return { cutover: validated, plan: nextPlan };
    });
  }

  async getEnvelope(
    tenantId: TenantId,
    id: CanonicalDataEnvelope['id']
  ): Promise<CanonicalDataEnvelope | undefined> {
    const [rows] = await this.pool.execute<EnvelopeRow[]>(
      `SELECT id, tenant_id, direction, schema_name, schema_version, object_type,
              stable_key, payload, external_system, external_object_id,
              checksum, created_at
         FROM canonical_data_envelopes
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    return rows[0] ? mapEnvelope(rows[0]) : undefined;
  }

  async getPlan(tenantId: TenantId, id: MigrationPlan['id']): Promise<MigrationPlan | undefined> {
    const [rows] = await this.pool.execute<PlanRow[]>(
      `SELECT id, tenant_id, code, name, source_system, target_system,
              scope_object_id, scope_definition, cutover_strategy, status,
              created_by_person_id, plan_created_at, approved_decision_id,
              approved_at, row_version
         FROM migration_plans WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    return rows[0] ? mapPlan(rows[0]) : undefined;
  }

  async getMapping(tenantId: TenantId, id: MigrationMappingVersion['id']): Promise<MigrationMappingVersion | undefined> {
    const [rows] = await this.pool.execute<MappingRow[]>(
      `SELECT id, tenant_id, migration_plan_id, version, source_schema_version,
              target_schema_version, mapping_definition, checksum, status,
              created_by_person_id, mapping_created_at, frozen_by_person_id,
              frozen_at, row_version
         FROM migration_mapping_versions WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    return rows[0] ? mapMapping(rows[0]) : undefined;
  }

  async getRun(tenantId: TenantId, id: MigrationRun['id']): Promise<MigrationRun | undefined> {
    const [rows] = await this.pool.execute<RunRow[]>(
      `SELECT id, tenant_id, migration_plan_id, mapping_version_id, run_reference,
              run_type, integration_job_id, requested_by_person_id, requested_at,
              status, started_at, load_completed_at, completed_at, error_message,
              active_production_guard_key, row_version
         FROM migration_runs WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    return rows[0] ? mapRun(rows[0]) : undefined;
  }

  async getItem(tenantId: TenantId, id: MigrationItemResult['id']): Promise<MigrationItemResult | undefined> {
    const [rows] = await this.pool.execute<ItemRow[]>(
      `SELECT id, tenant_id, migration_run_id, sequence, source_system,
              source_object_type, source_object_id, source_version, source_envelope_id,
              target_canonical_object_id, target_version, external_identity_id,
              outcome, source_hash, target_hash, message, recorded_at
         FROM migration_item_results WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    return rows[0] ? mapItem(rows[0]) : undefined;
  }

  async getConflict(tenantId: TenantId, id: MigrationConflict['id']): Promise<MigrationConflict | undefined> {
    const [rows] = await this.pool.execute<ConflictRow[]>(
      `SELECT id, tenant_id, migration_run_id, migration_item_result_id,
              conflict_type, severity, code, description, status,
              detected_at, resolved_at, row_version
         FROM migration_conflicts WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    return rows[0] ? mapConflict(rows[0]) : undefined;
  }

  async getReconciliationRun(
    tenantId: TenantId,
    id: MigrationReconciliationRun['id']
  ): Promise<MigrationReconciliationRun | undefined> {
    const [rows] = await this.pool.execute<ReconciliationRunRow[]>(
      `SELECT id, tenant_id, migration_run_id, checkpoint, status,
              started_by_person_id, started_at, completed_at, source_count,
              target_count, verified_count, conflict_count, missing_count,
              details, row_version
         FROM migration_reconciliation_runs WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    return rows[0] ? mapReconciliationRun(rows[0]) : undefined;
  }

  private async requirePlan(
    tenantId: TenantId,
    id: MigrationPlan['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<MigrationPlan> {
    const [rows] = await connection.execute<PlanRow[]>(
      `SELECT id, tenant_id, code, name, source_system, target_system,
              scope_object_id, scope_definition, cutover_strategy, status,
              created_by_person_id, plan_created_at, approved_decision_id,
              approved_at, row_version
         FROM migration_plans WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Migration Plan not found in tenant.');
    return mapPlan(rows[0]);
  }

  private async requireMapping(
    tenantId: TenantId,
    id: MigrationMappingVersion['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<MigrationMappingVersion> {
    const [rows] = await connection.execute<MappingRow[]>(
      `SELECT id, tenant_id, migration_plan_id, version, source_schema_version,
              target_schema_version, mapping_definition, checksum, status,
              created_by_person_id, mapping_created_at, frozen_by_person_id,
              frozen_at, row_version
         FROM migration_mapping_versions WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Migration Mapping Version not found in tenant.');
    return mapMapping(rows[0]);
  }

  private async requireRun(
    tenantId: TenantId,
    id: MigrationRun['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<MigrationRun> {
    const [rows] = await connection.execute<RunRow[]>(
      `SELECT id, tenant_id, migration_plan_id, mapping_version_id, run_reference,
              run_type, integration_job_id, requested_by_person_id, requested_at,
              status, started_at, load_completed_at, completed_at, error_message,
              active_production_guard_key, row_version
         FROM migration_runs WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Migration Run not found in tenant.');
    return mapRun(rows[0]);
  }

  private async requireItem(
    tenantId: TenantId,
    id: MigrationItemResult['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<MigrationItemResult> {
    const [rows] = await connection.execute<ItemRow[]>(
      `SELECT id, tenant_id, migration_run_id, sequence, source_system,
              source_object_type, source_object_id, source_version, source_envelope_id,
              target_canonical_object_id, target_version, external_identity_id,
              outcome, source_hash, target_hash, message, recorded_at
         FROM migration_item_results WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Migration Item Result not found in tenant.');
    return mapItem(rows[0]);
  }

  private async requireReconciliationRun(
    tenantId: TenantId,
    id: MigrationReconciliationRun['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<MigrationReconciliationRun> {
    const [rows] = await connection.execute<ReconciliationRunRow[]>(
      `SELECT id, tenant_id, migration_run_id, checkpoint, status,
              started_by_person_id, started_at, completed_at, source_count,
              target_count, verified_count, conflict_count, missing_count,
              details, row_version
         FROM migration_reconciliation_runs WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Migration Reconciliation Run not found in tenant.');
    return mapReconciliationRun(rows[0]);
  }

  private async requireObject(
    tenantId: TenantId,
    id: CanonicalObjectIdentity['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<CanonicalObjectIdentity> {
    const [rows] = await connection.execute<ObjectRow[]>(
      `SELECT id, tenant_id, object_type, stable_key, created_at
         FROM canonical_objects WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Canonical Object not found in tenant.');
    return mapObject(rows[0]);
  }

  private async requirePerson(
    tenantId: TenantId,
    id: Person['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<Person> {
    const [rows] = await connection.execute<PersonRow[]>(
      `SELECT id, tenant_id, party_id, legal_name, preferred_name, status
         FROM persons WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Person not found in tenant.');
    return mapPerson(rows[0]);
  }

  private async requireDecision(
    tenantId: TenantId,
    id: Decision['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<Decision> {
    const [rows] = await connection.execute<DecisionRow[]>(
      `SELECT id, tenant_id, decision_type, subject_object_id, subject_version,
              outcome, reason, decider_person_id, authority_grant_id, decided_at
         FROM decisions WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Decision not found in tenant.');
    return mapDecision(rows[0]);
  }

  private async requireEnvelope(
    tenantId: TenantId,
    id: CanonicalDataEnvelope['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<CanonicalDataEnvelope> {
    const [rows] = await connection.execute<EnvelopeRow[]>(
      `SELECT id, tenant_id, direction, schema_name, schema_version, object_type,
              stable_key, payload, external_system, external_object_id,
              checksum, created_at
         FROM canonical_data_envelopes WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Canonical Data Envelope not found in tenant.');
    return mapEnvelope(rows[0]);
  }

  private async requireExternalIdentity(
    tenantId: TenantId,
    id: ExternalIdentity['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<ExternalIdentity> {
    const [rows] = await connection.execute<ExternalIdentityRow[]>(
      `SELECT id, tenant_id, canonical_object_id, external_system,
              external_object_type, external_object_id, external_version,
              source_reference
         FROM external_identities WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('External Identity not found in tenant.');
    return mapExternalIdentity(rows[0]);
  }

  private async requireIntegrationJob(
    tenantId: TenantId,
    id: IntegrationJob['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<IntegrationJob> {
    const [rows] = await connection.execute<IntegrationJobRow[]>(
      `SELECT id, tenant_id, job_type, source_system, target_system,
              requested_by_person_id, requested_at, status, started_at,
              completed_at, cursor_value, result_reference, error_message
         FROM integration_jobs WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Integration Job not found in tenant.');
    return mapIntegrationJob(rows[0]);
  }

  private async requireAuthorityRule(
    tenantId: TenantId,
    id: SourceAuthorityRule['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<SourceAuthorityRule> {
    const [rows] = await connection.execute<AuthorityRuleRow[]>(
      `SELECT id, tenant_id, code, name, subject_object_type, attribute_path,
              authority_owner, endpoint_id, authority_reference, priority,
              effective_from, effective_to, status
         FROM source_authority_rules WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Source Authority Rule not found in tenant.');
    return mapAuthorityRule(rows[0]);
  }

  private async requirePlanRowForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: MigrationPlan['id']
  ): Promise<PlanRow> {
    const [rows] = await connection.execute<PlanRow[]>(
      `SELECT id, tenant_id, code, name, source_system, target_system,
              scope_object_id, scope_definition, cutover_strategy, status,
              created_by_person_id, plan_created_at, approved_decision_id,
              approved_at, row_version
         FROM migration_plans WHERE tenant_id = ? AND id = ? FOR UPDATE`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Migration Plan not found in tenant.');
    return rows[0];
  }

  private async requireMappingRowForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: MigrationMappingVersion['id']
  ): Promise<MappingRow> {
    const [rows] = await connection.execute<MappingRow[]>(
      `SELECT id, tenant_id, migration_plan_id, version, source_schema_version,
              target_schema_version, mapping_definition, checksum, status,
              created_by_person_id, mapping_created_at, frozen_by_person_id,
              frozen_at, row_version
         FROM migration_mapping_versions WHERE tenant_id = ? AND id = ? FOR UPDATE`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Migration Mapping Version not found in tenant.');
    return rows[0];
  }

  private async requireRunRowForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: MigrationRun['id']
  ): Promise<RunRow> {
    const [rows] = await connection.execute<RunRow[]>(
      `SELECT id, tenant_id, migration_plan_id, mapping_version_id, run_reference,
              run_type, integration_job_id, requested_by_person_id, requested_at,
              status, started_at, load_completed_at, completed_at, error_message,
              active_production_guard_key, row_version
         FROM migration_runs WHERE tenant_id = ? AND id = ? FOR UPDATE`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Migration Run not found in tenant.');
    return rows[0];
  }

  private async requireConflictRowForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: MigrationConflict['id']
  ): Promise<ConflictRow> {
    const [rows] = await connection.execute<ConflictRow[]>(
      `SELECT id, tenant_id, migration_run_id, migration_item_result_id,
              conflict_type, severity, code, description, status,
              detected_at, resolved_at, row_version
         FROM migration_conflicts WHERE tenant_id = ? AND id = ? FOR UPDATE`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Migration Conflict not found in tenant.');
    return rows[0];
  }

  private async requireReconciliationRunRowForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: MigrationReconciliationRun['id']
  ): Promise<ReconciliationRunRow> {
    const [rows] = await connection.execute<ReconciliationRunRow[]>(
      `SELECT id, tenant_id, migration_run_id, checkpoint, status,
              started_by_person_id, started_at, completed_at, source_count,
              target_count, verified_count, conflict_count, missing_count,
              details, row_version
         FROM migration_reconciliation_runs
        WHERE tenant_id = ? AND id = ? FOR UPDATE`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Migration Reconciliation Run not found in tenant.');
    return rows[0];
  }
}
