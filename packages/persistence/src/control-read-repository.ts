import type { Pool, RowDataPacket } from 'mysql2/promise';
import type { TenantId } from '@nublox/kernel';

interface DefinitionRow extends RowDataPacket {
  id: string;
  code: string;
  name: string;
  object_type: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface StateRow extends RowDataPacket {
  id: string;
  lifecycle_definition_id: string;
  code: string;
  name: string;
  category: string;
  is_initial: number | boolean;
  is_terminal: number | boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

interface TransitionRow extends RowDataPacket {
  id: string;
  lifecycle_definition_id: string;
  code: string;
  name: string;
  from_state_id: string;
  to_state_id: string;
  requires_decision: number | boolean;
  required_decision_type: string | null;
  required_decision_outcome: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

interface ObjectStateRow extends RowDataPacket {
  canonical_object_id: string;
  object_type: string;
  stable_key: string;
  lifecycle_definition_id: string;
  lifecycle_definition_name: string;
  lifecycle_state_id: string;
  lifecycle_state_name: string;
  subject_version: string | null;
  sequence: number;
  effective_at: Date;
}

interface DecisionRow extends RowDataPacket {
  id: string;
  decision_type: string;
  subject_object_id: string;
  subject_version: string | null;
  object_type: string;
  stable_key: string;
  outcome: string;
  reason: string;
  decider_person_id: string;
  decider_name: string;
  authority_grant_id: string | null;
  decided_at: Date;
}

interface EvidenceRow extends RowDataPacket {
  id: string;
  evidence_type: string;
  subject_object_id: string;
  subject_version: string | null;
  object_type: string;
  stable_key: string;
  captured_by_person_id: string | null;
  captured_by_name: string | null;
  captured_at: Date;
  content_reference: string | null;
  integrity_hash: string | null;
}

interface AuditRow extends RowDataPacket {
  id: number;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_person_id: string | null;
  actor_name: string | null;
  correlation_id: string | null;
  created_at: Date;
}

export interface ControlLifecycleDefinitionView {
  id: string;
  code: string;
  name: string;
  objectType: string;
  status: 'ACTIVE' | 'INACTIVE';
  states: Array<{
    id: string;
    code: string;
    name: string;
    category: string;
    initial: boolean;
    terminal: boolean;
    status: 'ACTIVE' | 'INACTIVE';
  }>;
  transitions: Array<{
    id: string;
    code: string;
    name: string;
    fromStateId: string;
    toStateId: string;
    requiresDecision: boolean;
    requiredDecisionType?: string;
    requiredDecisionOutcome?: string;
    status: 'ACTIVE' | 'INACTIVE';
  }>;
}

export interface ControlProjection {
  lifecycleDefinitions: ControlLifecycleDefinitionView[];
  objectStates: Array<{
    canonicalObjectId: string;
    objectType: string;
    stableKey: string;
    lifecycleDefinitionId: string;
    lifecycleDefinitionName: string;
    lifecycleStateId: string;
    lifecycleStateName: string;
    subjectVersion?: string;
    sequence: number;
    effectiveAt: string;
  }>;
  decisions: Array<{
    id: string;
    decisionType: string;
    subjectObjectId: string;
    subjectVersion?: string;
    objectType: string;
    stableKey: string;
    outcome: string;
    reason: string;
    deciderPersonId: string;
    deciderName: string;
    authorityGrantId?: string;
    decidedAt: string;
  }>;
  evidence: Array<{
    id: string;
    evidenceType: string;
    subjectObjectId: string;
    subjectVersion?: string;
    objectType: string;
    stableKey: string;
    capturedByPersonId?: string;
    capturedByName?: string;
    capturedAt: string;
    contentReference?: string;
    integrityHash?: string;
  }>;
  audit: Array<{
    id: number;
    entityType: string;
    entityId: string;
    action: string;
    actorPersonId?: string;
    actorName?: string;
    correlationId?: string;
    createdAt: string;
  }>;
  totals: {
    lifecycleDefinitions: number;
    governedObjects: number;
    decisions: number;
    evidenceRecords: number;
    auditEntries: number;
  };
}

export class MySqlControlReadRepository {
  constructor(private readonly pool: Pool) {}

  async getControlProjection(
    tenantId: TenantId,
    limit = 100
  ): Promise<ControlProjection> {
    const safeLimit = Math.max(1, Math.min(500, Math.floor(limit)));

    const [definitionResult, stateResult, transitionResult, objectStateResult, decisionResult, evidenceResult, auditResult] =
      await Promise.all([
        this.pool.query<DefinitionRow[]>(
          `SELECT id, code, name, object_type, status
             FROM lifecycle_definitions
            WHERE tenant_id = ?
            ORDER BY status = 'ACTIVE' DESC, object_type, code`,
          [tenantId]
        ),
        this.pool.query<StateRow[]>(
          `SELECT id, lifecycle_definition_id, code, name, category,
                  is_initial, is_terminal, status
             FROM lifecycle_state_definitions
            WHERE tenant_id = ?
            ORDER BY lifecycle_definition_id, is_initial DESC, code`,
          [tenantId]
        ),
        this.pool.query<TransitionRow[]>(
          `SELECT id, lifecycle_definition_id, code, name, from_state_id, to_state_id,
                  requires_decision, required_decision_type, required_decision_outcome, status
             FROM lifecycle_transition_definitions
            WHERE tenant_id = ?
            ORDER BY lifecycle_definition_id, code`,
          [tenantId]
        ),
        this.pool.query<ObjectStateRow[]>(
          `SELECT ols.canonical_object_id, co.object_type, co.stable_key,
                  ols.lifecycle_definition_id, ld.name AS lifecycle_definition_name,
                  ols.lifecycle_state_id, lsd.name AS lifecycle_state_name,
                  ols.subject_version, ols.sequence, ols.effective_at
             FROM object_lifecycle_states ols
             JOIN canonical_objects co
               ON co.tenant_id = ols.tenant_id AND co.id = ols.canonical_object_id
             JOIN lifecycle_definitions ld
               ON ld.tenant_id = ols.tenant_id AND ld.id = ols.lifecycle_definition_id
             JOIN lifecycle_state_definitions lsd
               ON lsd.tenant_id = ols.tenant_id
              AND lsd.lifecycle_definition_id = ols.lifecycle_definition_id
              AND lsd.id = ols.lifecycle_state_id
            WHERE ols.tenant_id = ?
            ORDER BY ols.effective_at DESC
            LIMIT ${safeLimit}`,
          [tenantId]
        ),
        this.pool.query<DecisionRow[]>(
          `SELECT d.id, d.decision_type, d.subject_object_id, d.subject_version,
                  co.object_type, co.stable_key, d.outcome, d.reason,
                  d.decider_person_id,
                  COALESCE(p.preferred_name, p.legal_name) AS decider_name,
                  d.authority_grant_id, d.decided_at
             FROM decisions d
             JOIN canonical_objects co
               ON co.tenant_id = d.tenant_id AND co.id = d.subject_object_id
             JOIN persons p
               ON p.tenant_id = d.tenant_id AND p.id = d.decider_person_id
            WHERE d.tenant_id = ?
            ORDER BY d.decided_at DESC
            LIMIT ${safeLimit}`,
          [tenantId]
        ),
        this.pool.query<EvidenceRow[]>(
          `SELECT e.id, e.evidence_type, e.subject_object_id, e.subject_version,
                  co.object_type, co.stable_key, e.captured_by_person_id,
                  CASE WHEN p.id IS NULL THEN NULL ELSE COALESCE(p.preferred_name, p.legal_name) END AS captured_by_name,
                  e.captured_at, e.content_reference, e.integrity_hash
             FROM evidence_records e
             JOIN canonical_objects co
               ON co.tenant_id = e.tenant_id AND co.id = e.subject_object_id
             LEFT JOIN persons p
               ON p.tenant_id = e.tenant_id AND p.id = e.captured_by_person_id
            WHERE e.tenant_id = ?
            ORDER BY e.captured_at DESC
            LIMIT ${safeLimit}`,
          [tenantId]
        ),
        this.pool.query<AuditRow[]>(
          `SELECT a.id, a.entity_type, a.entity_id, a.action, a.actor_person_id,
                  CASE WHEN p.id IS NULL THEN NULL ELSE COALESCE(p.preferred_name, p.legal_name) END AS actor_name,
                  a.correlation_id, a.created_at
             FROM kernel_audit_entries a
             LEFT JOIN persons p
               ON p.tenant_id = a.tenant_id AND p.id = a.actor_person_id
            WHERE a.tenant_id = ?
            ORDER BY a.created_at DESC, a.id DESC
            LIMIT ${safeLimit}`,
          [tenantId]
        )
      ]);

    const definitions = definitionResult[0];
    const states = stateResult[0];
    const transitions = transitionResult[0];

    return {
      lifecycleDefinitions: definitions.map((definition) => ({
        id: definition.id,
        code: definition.code,
        name: definition.name,
        objectType: definition.object_type,
        status: definition.status,
        states: states
          .filter((state) => state.lifecycle_definition_id === definition.id)
          .map((state) => ({
            id: state.id,
            code: state.code,
            name: state.name,
            category: state.category,
            initial: Boolean(state.is_initial),
            terminal: Boolean(state.is_terminal),
            status: state.status
          })),
        transitions: transitions
          .filter((transition) => transition.lifecycle_definition_id === definition.id)
          .map((transition) => ({
            id: transition.id,
            code: transition.code,
            name: transition.name,
            fromStateId: transition.from_state_id,
            toStateId: transition.to_state_id,
            requiresDecision: Boolean(transition.requires_decision),
            ...(transition.required_decision_type ? { requiredDecisionType: transition.required_decision_type } : {}),
            ...(transition.required_decision_outcome ? { requiredDecisionOutcome: transition.required_decision_outcome } : {}),
            status: transition.status
          }))
      })),
      objectStates: objectStateResult[0].map((row) => ({
        canonicalObjectId: row.canonical_object_id,
        objectType: row.object_type,
        stableKey: row.stable_key,
        lifecycleDefinitionId: row.lifecycle_definition_id,
        lifecycleDefinitionName: row.lifecycle_definition_name,
        lifecycleStateId: row.lifecycle_state_id,
        lifecycleStateName: row.lifecycle_state_name,
        ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
        sequence: Number(row.sequence),
        effectiveAt: row.effective_at.toISOString()
      })),
      decisions: decisionResult[0].map((row) => ({
        id: row.id,
        decisionType: row.decision_type,
        subjectObjectId: row.subject_object_id,
        ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
        objectType: row.object_type,
        stableKey: row.stable_key,
        outcome: row.outcome,
        reason: row.reason,
        deciderPersonId: row.decider_person_id,
        deciderName: row.decider_name,
        ...(row.authority_grant_id ? { authorityGrantId: row.authority_grant_id } : {}),
        decidedAt: row.decided_at.toISOString()
      })),
      evidence: evidenceResult[0].map((row) => ({
        id: row.id,
        evidenceType: row.evidence_type,
        subjectObjectId: row.subject_object_id,
        ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
        objectType: row.object_type,
        stableKey: row.stable_key,
        ...(row.captured_by_person_id ? { capturedByPersonId: row.captured_by_person_id } : {}),
        ...(row.captured_by_name ? { capturedByName: row.captured_by_name } : {}),
        capturedAt: row.captured_at.toISOString(),
        ...(row.content_reference ? { contentReference: row.content_reference } : {}),
        ...(row.integrity_hash ? { integrityHash: row.integrity_hash } : {})
      })),
      audit: auditResult[0].map((row) => ({
        id: Number(row.id),
        entityType: row.entity_type,
        entityId: row.entity_id,
        action: row.action,
        ...(row.actor_person_id ? { actorPersonId: row.actor_person_id } : {}),
        ...(row.actor_name ? { actorName: row.actor_name } : {}),
        ...(row.correlation_id ? { correlationId: row.correlation_id } : {}),
        createdAt: row.created_at.toISOString()
      })),
      totals: {
        lifecycleDefinitions: definitions.length,
        governedObjects: objectStateResult[0].length,
        decisions: decisionResult[0].length,
        evidenceRecords: evidenceResult[0].length,
        auditEntries: auditResult[0].length
      }
    };
  }
}
