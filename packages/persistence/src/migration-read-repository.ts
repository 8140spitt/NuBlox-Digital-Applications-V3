import {
  PLATFORM_PERMISSION_KEYS,
  type TenantId
} from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';

interface PlanRow extends RowDataPacket {
  id: string; code: string; name: string; source_system: string; target_system: string;
  scope_object_id: string; scope_type: string; scope_key: string;
  scope_definition: string | Record<string, unknown>; cutover_strategy: string; status: string;
  creator_name: string; plan_created_at: Date; approved_decision_id: string | null; approved_at: Date | null;
}
interface MappingRow extends RowDataPacket {
  id: string; migration_plan_id: string; version: string; source_schema_version: string;
  target_schema_version: string; mapping_definition: string | Record<string, unknown>;
  checksum: string; status: string; creator_name: string; mapping_created_at: Date;
  freezer_name: string | null; frozen_at: Date | null;
}
interface RunRow extends RowDataPacket {
  id: string; migration_plan_id: string; mapping_version_id: string; run_reference: string;
  run_type: string; integration_job_id: string | null; requester_name: string;
  requested_at: Date; status: string; started_at: Date | null; load_completed_at: Date | null;
  completed_at: Date | null; error_message: string | null;
}
interface ItemRow extends RowDataPacket {
  id: string; migration_run_id: string; sequence: number; source_system: string;
  source_object_type: string; source_object_id: string; source_version: string | null;
  source_envelope_id: string; target_canonical_object_id: string | null;
  target_type: string | null; target_key: string | null; target_version: string | null;
  external_identity_id: string | null; outcome: string; source_hash: string;
  target_hash: string | null; message: string | null; recorded_at: Date;
}
interface ConflictRow extends RowDataPacket {
  id: string; migration_run_id: string; migration_item_result_id: string | null;
  conflict_type: string; severity: string; code: string; description: string;
  status: string; detected_at: Date; resolved_at: Date | null;
}
interface DispositionRow extends RowDataPacket {
  id: string; migration_conflict_id: string; disposition: string; rationale: string;
  decision_id: string; decision_outcome: string; disposer_name: string; disposed_at: Date;
  retry_run_id: string | null;
}
interface ReconciliationRunRow extends RowDataPacket {
  id: string; migration_run_id: string; checkpoint: string; status: string;
  starter_name: string; started_at: Date; completed_at: Date | null;
  source_count: number | null; target_count: number | null; verified_count: number | null;
  conflict_count: number | null; missing_count: number | null; details: string | null;
}
interface ReconciliationRow extends RowDataPacket {
  id: string; reconciliation_run_id: string | null; external_identity_id: string;
  canonical_object_id: string; status: string; source_hash: string | null;
  target_hash: string | null; checked_at: Date; details: string | null;
}
interface CutoverRow extends RowDataPacket {
  id: string; migration_plan_id: string; migration_run_id: string; reconciliation_run_id: string;
  decision_id: string; outcome: string; target_authority_rule_id: string | null;
  authority_rule_code: string | null; decider_name: string; decided_at: Date;
  effective_at: Date | null; reason: string;
}
interface ObjectRow extends RowDataPacket { id: string; object_type: string; stable_key: string; }
interface DecisionRow extends RowDataPacket {
  id: string; decision_type: string; subject_object_id: string; subject_version: string | null;
  outcome: string; reason: string; decider_name: string; decided_at: Date;
}
interface AuthorityRuleRow extends RowDataPacket {
  id: string; code: string; name: string; subject_object_type: string;
  attribute_path: string | null; authority_owner: string; effective_from: Date;
  effective_to: Date | null; status: string;
}
interface JobRow extends RowDataPacket {
  id: string; source_system: string | null; target_system: string | null; status: string;
}
interface EnvelopeRow extends RowDataPacket {
  id: string; schema_name: string; schema_version: string; object_type: string;
  stable_key: string; external_system: string | null; external_object_id: string | null;
  checksum: string; created_at: Date;
}
interface ExternalIdentityRow extends RowDataPacket {
  id: string; canonical_object_id: string; external_system: string;
  external_object_type: string; external_object_id: string; external_version: string | null;
}

function jsonObject(value: string | Record<string, unknown>): Readonly<Record<string, unknown>> {
  const parsed = typeof value === 'string' ? JSON.parse(value) as unknown : value;
  return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
    ? parsed as Readonly<Record<string, unknown>>
    : {};
}

export interface MigrationWorkspaceProjection {
  plans: Array<{
    id: string; code: string; name: string; sourceSystem: string; targetSystem: string;
    scopeObjectId: string; scopeType: string; scopeKey: string;
    scopeDefinition: Readonly<Record<string, unknown>>;
    cutoverStrategy: string; status: string; creatorName: string; createdAt: string;
    approvedDecisionId?: string; approvedAt?: string;
  }>;
  mappings: Array<{
    id: string; migrationPlanId: string; version: string; sourceSchemaVersion: string;
    targetSchemaVersion: string; mappingDefinition: Readonly<Record<string, unknown>>;
    checksum: string; status: string; creatorName: string; createdAt: string;
    freezerName?: string; frozenAt?: string;
  }>;
  runs: Array<{
    id: string; migrationPlanId: string; mappingVersionId: string; runReference: string;
    runType: string; integrationJobId?: string; requesterName: string; requestedAt: string;
    status: string; startedAt?: string; loadCompletedAt?: string; completedAt?: string;
    errorMessage?: string;
  }>;
  items: Array<{
    id: string; migrationRunId: string; sequence: number; sourceSystem: string;
    sourceObjectType: string; sourceObjectId: string; sourceVersion?: string;
    sourceEnvelopeId: string; targetCanonicalObjectId?: string; targetType?: string;
    targetKey?: string; targetVersion?: string; externalIdentityId?: string;
    outcome: string; sourceHash: string; targetHash?: string; message?: string; recordedAt: string;
  }>;
  conflicts: Array<{
    id: string; migrationRunId: string; migrationItemResultId?: string; conflictType: string;
    severity: string; code: string; description: string; status: string; detectedAt: string;
    resolvedAt?: string;
  }>;
  dispositions: Array<{
    id: string; migrationConflictId: string; disposition: string; rationale: string;
    decisionId: string; decisionOutcome: string; disposerName: string; disposedAt: string;
    retryRunId?: string;
  }>;
  reconciliationRuns: Array<{
    id: string; migrationRunId: string; checkpoint: string; status: string; starterName: string;
    startedAt: string; completedAt?: string; sourceCount?: number; targetCount?: number;
    verifiedCount?: number; conflictCount?: number; missingCount?: number; details?: string;
  }>;
  reconciliations: Array<{
    id: string; reconciliationRunId?: string; externalIdentityId: string;
    canonicalObjectId: string; status: string; sourceHash?: string; targetHash?: string;
    checkedAt: string; details?: string;
  }>;
  cutovers: Array<{
    id: string; migrationPlanId: string; migrationRunId: string; reconciliationRunId: string;
    decisionId: string; outcome: string; targetAuthorityRuleId?: string;
    authorityRuleCode?: string; deciderName: string; decidedAt: string;
    effectiveAt?: string; reason: string;
  }>;
  canonicalObjects: Array<{ id: string; objectType: string; stableKey: string }>;
  decisions: Array<{
    id: string; decisionType: string; subjectObjectId: string; subjectVersion?: string;
    outcome: string; reason: string; deciderName: string; decidedAt: string;
  }>;
  authorityRules: Array<{
    id: string; code: string; name: string; subjectObjectType: string; attributePath?: string;
    authorityOwner: string; effectiveFrom: string; effectiveTo?: string; status: string;
  }>;
  integrationJobs: Array<{ id: string; sourceSystem?: string; targetSystem?: string; status: string }>;
  envelopes: Array<{
    id: string; schemaName: string; schemaVersion: string; objectType: string;
    stableKey: string; externalSystem?: string; externalObjectId?: string;
    checksum: string; createdAt: string;
  }>;
  externalIdentities: Array<{
    id: string; canonicalObjectId: string; externalSystem: string; externalObjectType: string;
    externalObjectId: string; externalVersion?: string;
  }>;
  totals: {
    plans: number; activePlans: number; runs: number; blockedRuns: number;
    openBlockingConflicts: number; verifiedReconciliations: number; approvedCutovers: number;
  };
}

export class MigrationReadError extends Error {
  constructor(message: string, readonly code: 'PERMISSION_DENIED') {
    super(message);
    this.name = 'MigrationReadError';
  }
}

export class MySqlMigrationReadRepository {
  private readonly access: MySqlAccessRepository;

  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
  }

  async getProjection(
    tenantId: TenantId,
    actorPersonId: string
  ): Promise<MigrationWorkspaceProjection> {
    await this.requireRead(tenantId, actorPersonId);

    const [
      planResult, mappingResult, runResult, itemResult, conflictResult,
      dispositionResult, recRunResult, recResult, cutoverResult, objectResult,
      decisionResult, authorityResult, jobResult, envelopeResult, identityResult
    ] = await Promise.all([
      this.pool.execute<PlanRow[]>(
        `SELECT p.id, p.code, p.name, p.source_system, p.target_system,
                p.scope_object_id, co.object_type AS scope_type, co.stable_key AS scope_key,
                p.scope_definition, p.cutover_strategy, p.status,
                COALESCE(person.preferred_name, person.legal_name) AS creator_name,
                p.plan_created_at, p.approved_decision_id, p.approved_at
           FROM migration_plans p
           JOIN canonical_objects co
             ON co.tenant_id = p.tenant_id AND co.id = p.scope_object_id
           JOIN persons person
             ON person.tenant_id = p.tenant_id AND person.id = p.created_by_person_id
          WHERE p.tenant_id = ?
          ORDER BY p.plan_created_at DESC, p.code`,
        [tenantId]
      ),
      this.pool.execute<MappingRow[]>(
        `SELECT m.id, m.migration_plan_id, m.version, m.source_schema_version,
                m.target_schema_version, m.mapping_definition, m.checksum, m.status,
                COALESCE(c.preferred_name, c.legal_name) AS creator_name,
                m.mapping_created_at,
                COALESCE(f.preferred_name, f.legal_name) AS freezer_name,
                m.frozen_at
           FROM migration_mapping_versions m
           JOIN persons c ON c.tenant_id = m.tenant_id AND c.id = m.created_by_person_id
           LEFT JOIN persons f ON f.tenant_id = m.tenant_id AND f.id = m.frozen_by_person_id
          WHERE m.tenant_id = ?
          ORDER BY m.migration_plan_id, m.mapping_created_at DESC, m.version`,
        [tenantId]
      ),
      this.pool.execute<RunRow[]>(
        `SELECT r.id, r.migration_plan_id, r.mapping_version_id, r.run_reference,
                r.run_type, r.integration_job_id,
                COALESCE(p.preferred_name, p.legal_name) AS requester_name,
                r.requested_at, r.status, r.started_at, r.load_completed_at,
                r.completed_at, r.error_message
           FROM migration_runs r
           JOIN persons p ON p.tenant_id = r.tenant_id AND p.id = r.requested_by_person_id
          WHERE r.tenant_id = ?
          ORDER BY r.requested_at DESC, r.run_reference`,
        [tenantId]
      ),
      this.pool.execute<ItemRow[]>(
        `SELECT i.id, i.migration_run_id, i.sequence, i.source_system,
                i.source_object_type, i.source_object_id, i.source_version,
                i.source_envelope_id, i.target_canonical_object_id,
                co.object_type AS target_type, co.stable_key AS target_key,
                i.target_version, i.external_identity_id, i.outcome,
                i.source_hash, i.target_hash, i.message, i.recorded_at
           FROM migration_item_results i
           LEFT JOIN canonical_objects co
             ON co.tenant_id = i.tenant_id AND co.id = i.target_canonical_object_id
          WHERE i.tenant_id = ?
          ORDER BY i.migration_run_id, i.sequence, i.id`,
        [tenantId]
      ),
      this.pool.execute<ConflictRow[]>(
        `SELECT id, migration_run_id, migration_item_result_id, conflict_type,
                severity, code, description, status, detected_at, resolved_at
           FROM migration_conflicts
          WHERE tenant_id = ?
          ORDER BY detected_at DESC, id`,
        [tenantId]
      ),
      this.pool.execute<DispositionRow[]>(
        `SELECT d.id, d.migration_conflict_id, d.disposition, d.rationale,
                d.decision_id, decision.outcome AS decision_outcome,
                COALESCE(p.preferred_name, p.legal_name) AS disposer_name,
                d.disposed_at, d.retry_run_id
           FROM migration_conflict_dispositions d
           JOIN decisions decision
             ON decision.tenant_id = d.tenant_id AND decision.id = d.decision_id
           JOIN persons p
             ON p.tenant_id = d.tenant_id AND p.id = d.disposed_by_person_id
          WHERE d.tenant_id = ?
          ORDER BY d.disposed_at DESC, d.id`,
        [tenantId]
      ),
      this.pool.execute<ReconciliationRunRow[]>(
        `SELECT r.id, r.migration_run_id, r.checkpoint, r.status,
                COALESCE(p.preferred_name, p.legal_name) AS starter_name,
                r.started_at, r.completed_at, r.source_count, r.target_count,
                r.verified_count, r.conflict_count, r.missing_count, r.details
           FROM migration_reconciliation_runs r
           JOIN persons p
             ON p.tenant_id = r.tenant_id AND p.id = r.started_by_person_id
          WHERE r.tenant_id = ?
          ORDER BY r.started_at DESC, r.id`,
        [tenantId]
      ),
      this.pool.execute<ReconciliationRow[]>(
        `SELECT id, reconciliation_run_id, external_identity_id,
                canonical_object_id, status, source_hash, target_hash,
                checked_at, details
           FROM migration_reconciliations
          WHERE tenant_id = ? AND reconciliation_run_id IS NOT NULL
          ORDER BY checked_at DESC, id`,
        [tenantId]
      ),
      this.pool.execute<CutoverRow[]>(
        `SELECT c.id, c.migration_plan_id, c.migration_run_id,
                c.reconciliation_run_id, c.decision_id, c.outcome,
                c.target_authority_rule_id, ar.code AS authority_rule_code,
                COALESCE(p.preferred_name, p.legal_name) AS decider_name,
                c.decided_at, c.effective_at, c.reason
           FROM cutover_decisions c
           JOIN persons p
             ON p.tenant_id = c.tenant_id AND p.id = c.decided_by_person_id
           LEFT JOIN source_authority_rules ar
             ON ar.tenant_id = c.tenant_id AND ar.id = c.target_authority_rule_id
          WHERE c.tenant_id = ?
          ORDER BY c.decided_at DESC, c.id`,
        [tenantId]
      ),
      this.pool.execute<ObjectRow[]>(
        `SELECT id, object_type, stable_key
           FROM canonical_objects
          WHERE tenant_id = ?
          ORDER BY object_type, stable_key, id`,
        [tenantId]
      ),
      this.pool.execute<DecisionRow[]>(
        `SELECT d.id, d.decision_type, d.subject_object_id, d.subject_version,
                d.outcome, d.reason,
                COALESCE(p.preferred_name, p.legal_name) AS decider_name,
                d.decided_at
           FROM decisions d
           JOIN persons p
             ON p.tenant_id = d.tenant_id AND p.id = d.decider_person_id
          WHERE d.tenant_id = ?
          ORDER BY d.decided_at DESC, d.id`,
        [tenantId]
      ),
      this.pool.execute<AuthorityRuleRow[]>(
        `SELECT id, code, name, subject_object_type, attribute_path,
                authority_owner, effective_from, effective_to, status
           FROM source_authority_rules
          WHERE tenant_id = ?
          ORDER BY subject_object_type, priority, code`,
        [tenantId]
      ),
      this.pool.execute<JobRow[]>(
        `SELECT id, source_system, target_system, status
           FROM integration_jobs
          WHERE tenant_id = ? AND job_type = 'IMPORT'
          ORDER BY requested_at DESC, id`,
        [tenantId]
      ),
      this.pool.execute<EnvelopeRow[]>(
        `SELECT id, schema_name, schema_version, object_type, stable_key,
                external_system, external_object_id, checksum, created_at
           FROM canonical_data_envelopes
          WHERE tenant_id = ? AND direction = 'IMPORT'
          ORDER BY created_at DESC, id`,
        [tenantId]
      ),
      this.pool.execute<ExternalIdentityRow[]>(
        `SELECT id, canonical_object_id, external_system, external_object_type,
                external_object_id, external_version
           FROM external_identities
          WHERE tenant_id = ?
          ORDER BY external_system, external_object_type, external_object_id`,
        [tenantId]
      )
    ]);

    return {
      plans: planResult[0].map((r) => ({
        id:r.id, code:r.code, name:r.name, sourceSystem:r.source_system,
        targetSystem:r.target_system, scopeObjectId:r.scope_object_id,
        scopeType:r.scope_type, scopeKey:r.scope_key,
        scopeDefinition:jsonObject(r.scope_definition), cutoverStrategy:r.cutover_strategy,
        status:r.status, creatorName:r.creator_name, createdAt:r.plan_created_at.toISOString(),
        ...(r.approved_decision_id ? { approvedDecisionId:r.approved_decision_id } : {}),
        ...(r.approved_at ? { approvedAt:r.approved_at.toISOString() } : {})
      })),
      mappings: mappingResult[0].map((r) => ({
        id:r.id, migrationPlanId:r.migration_plan_id, version:r.version,
        sourceSchemaVersion:r.source_schema_version, targetSchemaVersion:r.target_schema_version,
        mappingDefinition:jsonObject(r.mapping_definition), checksum:r.checksum, status:r.status,
        creatorName:r.creator_name, createdAt:r.mapping_created_at.toISOString(),
        ...(r.freezer_name ? { freezerName:r.freezer_name } : {}),
        ...(r.frozen_at ? { frozenAt:r.frozen_at.toISOString() } : {})
      })),
      runs: runResult[0].map((r) => ({
        id:r.id, migrationPlanId:r.migration_plan_id, mappingVersionId:r.mapping_version_id,
        runReference:r.run_reference, runType:r.run_type,
        ...(r.integration_job_id ? { integrationJobId:r.integration_job_id } : {}),
        requesterName:r.requester_name, requestedAt:r.requested_at.toISOString(), status:r.status,
        ...(r.started_at ? { startedAt:r.started_at.toISOString() } : {}),
        ...(r.load_completed_at ? { loadCompletedAt:r.load_completed_at.toISOString() } : {}),
        ...(r.completed_at ? { completedAt:r.completed_at.toISOString() } : {}),
        ...(r.error_message ? { errorMessage:r.error_message } : {})
      })),
      items: itemResult[0].map((r) => ({
        id:r.id, migrationRunId:r.migration_run_id, sequence:Number(r.sequence),
        sourceSystem:r.source_system, sourceObjectType:r.source_object_type,
        sourceObjectId:r.source_object_id, ...(r.source_version ? {sourceVersion:r.source_version}:{}),
        sourceEnvelopeId:r.source_envelope_id,
        ...(r.target_canonical_object_id ? {targetCanonicalObjectId:r.target_canonical_object_id}:{}),
        ...(r.target_type ? {targetType:r.target_type}:{}), ...(r.target_key ? {targetKey:r.target_key}:{}),
        ...(r.target_version ? {targetVersion:r.target_version}:{}),
        ...(r.external_identity_id ? {externalIdentityId:r.external_identity_id}:{}),
        outcome:r.outcome, sourceHash:r.source_hash, ...(r.target_hash ? {targetHash:r.target_hash}:{}),
        ...(r.message ? {message:r.message}:{}), recordedAt:r.recorded_at.toISOString()
      })),
      conflicts: conflictResult[0].map((r) => ({
        id:r.id, migrationRunId:r.migration_run_id,
        ...(r.migration_item_result_id ? {migrationItemResultId:r.migration_item_result_id}:{}),
        conflictType:r.conflict_type, severity:r.severity, code:r.code, description:r.description,
        status:r.status, detectedAt:r.detected_at.toISOString(),
        ...(r.resolved_at ? {resolvedAt:r.resolved_at.toISOString()}: {})
      })),
      dispositions: dispositionResult[0].map((r) => ({
        id:r.id, migrationConflictId:r.migration_conflict_id, disposition:r.disposition,
        rationale:r.rationale, decisionId:r.decision_id, decisionOutcome:r.decision_outcome,
        disposerName:r.disposer_name, disposedAt:r.disposed_at.toISOString(),
        ...(r.retry_run_id ? {retryRunId:r.retry_run_id}: {})
      })),
      reconciliationRuns: recRunResult[0].map((r) => ({
        id:r.id, migrationRunId:r.migration_run_id, checkpoint:r.checkpoint, status:r.status,
        starterName:r.starter_name, startedAt:r.started_at.toISOString(),
        ...(r.completed_at ? {completedAt:r.completed_at.toISOString()}: {}),
        ...(r.source_count !== null ? {sourceCount:Number(r.source_count)}:{}),
        ...(r.target_count !== null ? {targetCount:Number(r.target_count)}:{}),
        ...(r.verified_count !== null ? {verifiedCount:Number(r.verified_count)}:{}),
        ...(r.conflict_count !== null ? {conflictCount:Number(r.conflict_count)}:{}),
        ...(r.missing_count !== null ? {missingCount:Number(r.missing_count)}:{}),
        ...(r.details ? {details:r.details}: {})
      })),
      reconciliations: recResult[0].map((r) => ({
        id:r.id, ...(r.reconciliation_run_id ? {reconciliationRunId:r.reconciliation_run_id}:{}),
        externalIdentityId:r.external_identity_id, canonicalObjectId:r.canonical_object_id,
        status:r.status, ...(r.source_hash ? {sourceHash:r.source_hash}:{}),
        ...(r.target_hash ? {targetHash:r.target_hash}:{}), checkedAt:r.checked_at.toISOString(),
        ...(r.details ? {details:r.details}: {})
      })),
      cutovers: cutoverResult[0].map((r) => ({
        id:r.id, migrationPlanId:r.migration_plan_id, migrationRunId:r.migration_run_id,
        reconciliationRunId:r.reconciliation_run_id, decisionId:r.decision_id, outcome:r.outcome,
        ...(r.target_authority_rule_id ? {targetAuthorityRuleId:r.target_authority_rule_id}:{}),
        ...(r.authority_rule_code ? {authorityRuleCode:r.authority_rule_code}:{}),
        deciderName:r.decider_name, decidedAt:r.decided_at.toISOString(),
        ...(r.effective_at ? {effectiveAt:r.effective_at.toISOString()}:{}), reason:r.reason
      })),
      canonicalObjects: objectResult[0].map((r)=>({id:r.id,objectType:r.object_type,stableKey:r.stable_key})),
      decisions: decisionResult[0].map((r)=>({
        id:r.id,decisionType:r.decision_type,subjectObjectId:r.subject_object_id,
        ...(r.subject_version?{subjectVersion:r.subject_version}:{}),outcome:r.outcome,
        reason:r.reason,deciderName:r.decider_name,decidedAt:r.decided_at.toISOString()
      })),
      authorityRules: authorityResult[0].map((r)=>({
        id:r.id,code:r.code,name:r.name,subjectObjectType:r.subject_object_type,
        ...(r.attribute_path?{attributePath:r.attribute_path}:{}),authorityOwner:r.authority_owner,
        effectiveFrom:r.effective_from.toISOString(),
        ...(r.effective_to?{effectiveTo:r.effective_to.toISOString()}:{}),status:r.status
      })),
      integrationJobs: jobResult[0].map((r)=>({
        id:r.id,...(r.source_system?{sourceSystem:r.source_system}:{}),
        ...(r.target_system?{targetSystem:r.target_system}:{}),status:r.status
      })),
      envelopes: envelopeResult[0].map((r)=>({
        id:r.id,schemaName:r.schema_name,schemaVersion:r.schema_version,objectType:r.object_type,
        stableKey:r.stable_key,...(r.external_system?{externalSystem:r.external_system}:{}),
        ...(r.external_object_id?{externalObjectId:r.external_object_id}:{}),
        checksum:r.checksum,createdAt:r.created_at.toISOString()
      })),
      externalIdentities: identityResult[0].map((r)=>({
        id:r.id,canonicalObjectId:r.canonical_object_id,externalSystem:r.external_system,
        externalObjectType:r.external_object_type,externalObjectId:r.external_object_id,
        ...(r.external_version?{externalVersion:r.external_version}:{})
      })),
      totals: {
        plans: planResult[0].length,
        activePlans: planResult[0].filter((r)=>r.status==='ACTIVE').length,
        runs: runResult[0].length,
        blockedRuns: runResult[0].filter((r)=>r.status==='BLOCKED').length,
        openBlockingConflicts: conflictResult[0].filter((r)=>r.severity==='BLOCKING'&&r.status==='OPEN').length,
        verifiedReconciliations: recRunResult[0].filter((r)=>r.status==='VERIFIED').length,
        approvedCutovers: cutoverResult[0].filter((r)=>r.outcome==='APPROVED').length
      }
    };
  }

  private async requireRead(tenantId: TenantId, actorPersonId: string): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId, actorPersonId, PLATFORM_PERMISSION_KEYS.MIGRATION_READ, { scopeType: 'TENANT' }
    );
    if (!evaluation.allowed) throw new MigrationReadError(evaluation.reason, 'PERMISSION_DENIED');
  }
}
