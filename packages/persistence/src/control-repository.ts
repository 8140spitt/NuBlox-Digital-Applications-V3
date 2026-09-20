import {
  createBusinessEvent,
  createDecision,
  createEvidenceRecord,
  createLifecycleDefinition,
  createLifecycleStateDefinition,
  createLifecycleTransitionDefinition,
  initialiseObjectLifecycle,
  transitionObjectLifecycle,
  type AuthorityGrant,
  type BusinessEvent,
  type CanonicalObjectIdentity,
  type Decision,
  type EvidenceRecord,
  type LifecycleDefinition,
  type LifecycleStateDefinition,
  type LifecycleTransitionDefinition,
  type ObjectLifecycleState,
  type Person,
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

interface LifecycleDefinitionRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  object_type: string;
  status: LifecycleDefinition['status'];
}

interface LifecycleStateRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  lifecycle_definition_id: string;
  code: string;
  name: string;
  category: LifecycleStateDefinition['category'];
  is_initial: number;
  is_terminal: number;
  status: LifecycleStateDefinition['status'];
}

interface LifecycleTransitionRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  lifecycle_definition_id: string;
  code: string;
  name: string;
  from_state_id: string;
  to_state_id: string;
  requires_decision: number;
  required_decision_type: string | null;
  required_decision_outcome: string | null;
  status: LifecycleTransitionDefinition['status'];
}

interface CanonicalObjectRow extends RowDataPacket {
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

interface AuthorityGrantRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  authority_definition_id: string;
  grantee_type: AuthorityGrant['granteeType'];
  grantee_id: string;
  scope_type: string;
  scope_id: string | null;
  limit_value: string | null;
  effective_from: Date;
  effective_to: Date | null;
  status: AuthorityGrant['status'];
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

interface ObjectLifecycleStateRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  canonical_object_id: string;
  lifecycle_definition_id: string;
  lifecycle_state_id: string;
  subject_version: string | null;
  sequence: number;
  effective_at: Date;
  transition_id: string | null;
  decision_id: string | null;
  row_version: number;
}

function assertTenant(expected: TenantId, actual: TenantId): void {
  if (expected !== actual) {
    throw new Error('Persistence operation crossed tenant boundary.');
  }
}

function databaseDate(value: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date/time value: ${value}`);
  }

  return date;
}

async function writeAudit(
  connection: PoolConnection,
  tenantId: string,
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
}

function mapLifecycleDefinition(row: LifecycleDefinitionRow): LifecycleDefinition {
  return {
    id: row.id as LifecycleDefinition['id'],
    tenantId: row.tenant_id as TenantId,
    code: row.code,
    name: row.name,
    objectType: row.object_type,
    status: row.status
  };
}

function mapLifecycleState(row: LifecycleStateRow): LifecycleStateDefinition {
  return {
    id: row.id as LifecycleStateDefinition['id'],
    tenantId: row.tenant_id as TenantId,
    lifecycleDefinitionId: row.lifecycle_definition_id as LifecycleStateDefinition['lifecycleDefinitionId'],
    code: row.code,
    name: row.name,
    category: row.category,
    initial: Boolean(row.is_initial),
    terminal: Boolean(row.is_terminal),
    status: row.status
  };
}

function mapLifecycleTransition(row: LifecycleTransitionRow): LifecycleTransitionDefinition {
  return {
    id: row.id as LifecycleTransitionDefinition['id'],
    tenantId: row.tenant_id as TenantId,
    lifecycleDefinitionId:
      row.lifecycle_definition_id as LifecycleTransitionDefinition['lifecycleDefinitionId'],
    code: row.code,
    name: row.name,
    fromStateId: row.from_state_id as LifecycleTransitionDefinition['fromStateId'],
    toStateId: row.to_state_id as LifecycleTransitionDefinition['toStateId'],
    requiresDecision: Boolean(row.requires_decision),
    ...(row.required_decision_type
      ? { requiredDecisionType: row.required_decision_type }
      : {}),
    ...(row.required_decision_outcome
      ? { requiredDecisionOutcome: row.required_decision_outcome }
      : {}),
    status: row.status
  };
}

function mapCanonicalObject(row: CanonicalObjectRow): CanonicalObjectIdentity {
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

function mapAuthorityGrant(row: AuthorityGrantRow): AuthorityGrant {
  return {
    id: row.id as AuthorityGrant['id'],
    tenantId: row.tenant_id as TenantId,
    authorityDefinitionId:
      row.authority_definition_id as AuthorityGrant['authorityDefinitionId'],
    granteeType: row.grantee_type,
    granteeId: row.grantee_id,
    scopeType: row.scope_type,
    ...(row.scope_id ? { scopeId: row.scope_id } : {}),
    ...(row.limit_value !== null ? { limitValue: Number(row.limit_value) } : {}),
    effectiveFrom: row.effective_from.toISOString(),
    ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
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

function mapObjectLifecycle(row: ObjectLifecycleStateRow): ObjectLifecycleState {
  return {
    id: row.id as ObjectLifecycleState['id'],
    tenantId: row.tenant_id as TenantId,
    canonicalObjectId: row.canonical_object_id as ObjectLifecycleState['canonicalObjectId'],
    lifecycleDefinitionId:
      row.lifecycle_definition_id as ObjectLifecycleState['lifecycleDefinitionId'],
    lifecycleStateId: row.lifecycle_state_id as ObjectLifecycleState['lifecycleStateId'],
    ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
    sequence: Number(row.sequence),
    effectiveAt: row.effective_at.toISOString(),
    ...(row.transition_id
      ? { transitionId: row.transition_id as NonNullable<ObjectLifecycleState['transitionId']> }
      : {}),
    ...(row.decision_id
      ? { decisionId: row.decision_id as NonNullable<ObjectLifecycleState['decisionId']> }
      : {})
  };
  await writeOutboxEvent(connection, {
    tenantId,
    aggregateType: entityType,
    aggregateId: entityId,
    eventType: `${entityType}.${action}`,
    payload
  });

}

export class MySqlKernelControlRepository {
  constructor(private readonly pool: Pool) {}

  async createLifecycleDefinition(
    tenantId: TenantId,
    definition: LifecycleDefinition,
    audit: AuditContext = {}
  ): Promise<void> {
    assertTenant(tenantId, definition.tenantId);
    createLifecycleDefinition(definition);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO lifecycle_definitions
          (id, tenant_id, code, name, object_type, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          definition.id,
          definition.tenantId,
          definition.code,
          definition.name,
          definition.objectType,
          definition.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(
        connection,
        definition.tenantId,
        'LIFECYCLE_DEFINITION',
        definition.id,
        'CREATED',
        audit,
        definition
      );
    });
  }

  async createLifecycleStateDefinition(
    tenantId: TenantId,
    state: LifecycleStateDefinition,
    audit: AuditContext = {}
  ): Promise<void> {
    assertTenant(tenantId, state.tenantId);
    const definition = await this.requireLifecycleDefinition(
      state.tenantId,
      state.lifecycleDefinitionId
    );
    createLifecycleStateDefinition(state, definition);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO lifecycle_state_definitions
          (id, tenant_id, lifecycle_definition_id, code, name, category, is_initial,
           is_terminal, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          state.id,
          state.tenantId,
          state.lifecycleDefinitionId,
          state.code,
          state.name,
          state.category,
          state.initial,
          state.terminal,
          state.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(
        connection,
        state.tenantId,
        'LIFECYCLE_STATE_DEFINITION',
        state.id,
        'CREATED',
        audit,
        state
      );
    });
  }

  async createLifecycleTransitionDefinition(
    tenantId: TenantId,
    transition: LifecycleTransitionDefinition,
    audit: AuditContext = {}
  ): Promise<void> {
    assertTenant(tenantId, transition.tenantId);
    const [definition, fromState, toState] = await Promise.all([
      this.requireLifecycleDefinition(transition.tenantId, transition.lifecycleDefinitionId),
      this.requireLifecycleState(transition.tenantId, transition.fromStateId),
      this.requireLifecycleState(transition.tenantId, transition.toStateId)
    ]);
    createLifecycleTransitionDefinition(transition, definition, fromState, toState);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO lifecycle_transition_definitions
          (id, tenant_id, lifecycle_definition_id, code, name, from_state_id, to_state_id,
           requires_decision, required_decision_type, required_decision_outcome, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transition.id,
          transition.tenantId,
          transition.lifecycleDefinitionId,
          transition.code,
          transition.name,
          transition.fromStateId,
          transition.toStateId,
          transition.requiresDecision,
          transition.requiredDecisionType ?? null,
          transition.requiredDecisionOutcome ?? null,
          transition.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(
        connection,
        transition.tenantId,
        'LIFECYCLE_TRANSITION_DEFINITION',
        transition.id,
        'CREATED',
        audit,
        transition
      );
    });
  }

  async createDecision(
    tenantId: TenantId,
    decision: Decision,
    audit: AuditContext = {}
  ): Promise<void> {
    assertTenant(tenantId, decision.tenantId);
    const [subject, decider, authorityGrant] = await Promise.all([
      this.requireCanonicalObject(decision.tenantId, decision.subjectObjectId),
      this.requirePerson(decision.tenantId, decision.deciderPersonId),
      decision.authorityGrantId
        ? this.requireAuthorityGrant(decision.tenantId, decision.authorityGrantId)
        : Promise.resolve(undefined)
    ]);
    createDecision(decision, subject, decider, authorityGrant);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO decisions
          (id, tenant_id, decision_type, subject_object_id, subject_version, outcome, reason,
           decider_person_id, authority_grant_id, decided_at, correlation_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          decision.id,
          decision.tenantId,
          decision.decisionType,
          decision.subjectObjectId,
          decision.subjectVersion ?? null,
          decision.outcome,
          decision.reason,
          decision.deciderPersonId,
          decision.authorityGrantId ?? null,
          databaseDate(decision.decidedAt),
          audit.correlationId ?? null
        ]
      );
      await writeAudit(
        connection,
        decision.tenantId,
        'DECISION',
        decision.id,
        'RECORDED',
        audit,
        decision
      );
    });
  }

  async initialiseObjectLifecycle(
    tenantId: TenantId,
    initial: ObjectLifecycleState,
    audit: AuditContext = {}
  ): Promise<void> {
    assertTenant(tenantId, initial.tenantId);
    const [object, definition, state] = await Promise.all([
      this.requireCanonicalObject(initial.tenantId, initial.canonicalObjectId),
      this.requireLifecycleDefinition(initial.tenantId, initial.lifecycleDefinitionId),
      this.requireLifecycleState(initial.tenantId, initial.lifecycleStateId)
    ]);
    initialiseObjectLifecycle(initial, object, definition, state);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO object_lifecycle_states
          (id, tenant_id, canonical_object_id, lifecycle_definition_id, lifecycle_state_id,
           subject_version, sequence, effective_at, transition_id, decision_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
        [
          initial.id,
          initial.tenantId,
          initial.canonicalObjectId,
          initial.lifecycleDefinitionId,
          initial.lifecycleStateId,
          initial.subjectVersion ?? null,
          initial.sequence,
          databaseDate(initial.effectiveAt)
        ]
      );
      await this.insertLifecycleHistory(connection, initial);
      await writeAudit(
        connection,
        initial.tenantId,
        'OBJECT_LIFECYCLE_STATE',
        initial.id,
        'INITIALISED',
        audit,
        initial
      );
    });
  }

  async transitionObjectLifecycle(
    tenantId: TenantId,
    canonicalObjectId: ObjectLifecycleState['canonicalObjectId'],
    transitionId: LifecycleTransitionDefinition['id'],
    input: {
      effectiveAt: string;
      subjectVersion?: string;
      decisionId?: Decision['id'];
      expectedSequence: number;
    },
    audit: AuditContext = {}
  ): Promise<ObjectLifecycleState> {
    return withTransaction(this.pool, async (connection) => {
      const currentRow = await this.requireObjectLifecycleForUpdate(
        connection,
        tenantId,
        canonicalObjectId
      );
      const current = mapObjectLifecycle(currentRow);

      if (current.sequence !== input.expectedSequence) {
        throw new Error('Lifecycle state changed after it was read.');
      }

      const transition = await this.requireLifecycleTransition(
        tenantId,
        transitionId,
        connection
      );
      const [fromState, toState, decision] = await Promise.all([
        this.requireLifecycleState(tenantId, transition.fromStateId, connection),
        this.requireLifecycleState(tenantId, transition.toStateId, connection),
        input.decisionId
          ? this.requireDecision(tenantId, input.decisionId, connection)
          : Promise.resolve(undefined)
      ]);

      const next: ObjectLifecycleState = {
        ...current,
        lifecycleStateId: toState.id,
        ...(input.subjectVersion !== undefined
          ? { subjectVersion: input.subjectVersion }
          : current.subjectVersion !== undefined
            ? { subjectVersion: current.subjectVersion }
            : {}),
        sequence: current.sequence + 1,
        effectiveAt: input.effectiveAt,
        transitionId: transition.id,
        ...(decision ? { decisionId: decision.id } : {})
      };

      transitionObjectLifecycle(
        next,
        current,
        transition,
        fromState,
        toState,
        decision
      );

      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE object_lifecycle_states
            SET lifecycle_state_id = ?,
                subject_version = ?,
                sequence = ?,
                effective_at = ?,
                transition_id = ?,
                decision_id = ?,
                row_version = row_version + 1
          WHERE tenant_id = ?
            AND canonical_object_id = ?
            AND sequence = ?`,
        [
          next.lifecycleStateId,
          next.subjectVersion ?? null,
          next.sequence,
          databaseDate(next.effectiveAt),
          next.transitionId ?? null,
          next.decisionId ?? null,
          tenantId,
          canonicalObjectId,
          current.sequence
        ]
      );

      if (result.affectedRows !== 1) {
        throw new Error('Concurrent Lifecycle transition detected.');
      }

      await this.insertLifecycleHistory(connection, next);
      await writeAudit(
        connection,
        tenantId,
        'OBJECT_LIFECYCLE_STATE',
        next.id,
        'TRANSITIONED',
        audit,
        {
          fromStateId: current.lifecycleStateId,
          toStateId: next.lifecycleStateId,
          transitionId: transition.id,
          decisionId: next.decisionId ?? null,
          sequence: next.sequence,
          subjectVersion: next.subjectVersion ?? null
        }
      );

      return next;
    });
  }

  async recordBusinessEvent(
    tenantId: TenantId,
    event: BusinessEvent,
    audit: AuditContext = {}
  ): Promise<void> {
    assertTenant(tenantId, event.tenantId);
    const [subject, actor] = await Promise.all([
      event.subjectObjectId
        ? this.requireCanonicalObject(event.tenantId, event.subjectObjectId)
        : Promise.resolve(undefined),
      event.actorPersonId
        ? this.requirePerson(event.tenantId, event.actorPersonId)
        : Promise.resolve(undefined)
    ]);
    createBusinessEvent(event, subject, actor);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO business_events
          (id, tenant_id, event_type, aggregate_type, aggregate_id, subject_object_id,
           actor_person_id, correlation_id, occurred_at, payload)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event.id,
          event.tenantId,
          event.eventType,
          event.aggregateType,
          event.aggregateId,
          event.subjectObjectId ?? null,
          event.actorPersonId ?? null,
          event.correlationId ?? audit.correlationId ?? null,
          databaseDate(event.occurredAt),
          event.payload ? JSON.stringify(event.payload) : null
        ]
      );
      await writeAudit(
        connection,
        event.tenantId,
        'BUSINESS_EVENT',
        event.id,
        'RECORDED',
        audit,
        event
      );
    });
  }

  async recordEvidence(
    tenantId: TenantId,
    evidence: EvidenceRecord,
    audit: AuditContext = {}
  ): Promise<void> {
    assertTenant(tenantId, evidence.tenantId);
    const [subject, capturedBy] = await Promise.all([
      this.requireCanonicalObject(evidence.tenantId, evidence.subjectObjectId),
      evidence.capturedByPersonId
        ? this.requirePerson(evidence.tenantId, evidence.capturedByPersonId)
        : Promise.resolve(undefined)
    ]);
    createEvidenceRecord(evidence, subject, capturedBy);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO evidence_records
          (id, tenant_id, evidence_type, subject_object_id, subject_version,
           captured_by_person_id, captured_at, content_reference, integrity_hash, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          evidence.id,
          evidence.tenantId,
          evidence.evidenceType,
          evidence.subjectObjectId,
          evidence.subjectVersion ?? null,
          evidence.capturedByPersonId ?? null,
          databaseDate(evidence.capturedAt),
          evidence.contentReference ?? null,
          evidence.integrityHash ?? null,
          evidence.metadata ? JSON.stringify(evidence.metadata) : null
        ]
      );
      await writeAudit(
        connection,
        evidence.tenantId,
        'EVIDENCE_RECORD',
        evidence.id,
        'RECORDED',
        audit,
        evidence
      );
    });
  }

  async getObjectLifecycleState(
    tenantId: TenantId,
    canonicalObjectId: ObjectLifecycleState['canonicalObjectId']
  ): Promise<ObjectLifecycleState> {
    const [rows] = await this.pool.execute<ObjectLifecycleStateRow[]>(
      `SELECT id, tenant_id, canonical_object_id, lifecycle_definition_id,
              lifecycle_state_id, subject_version, sequence, effective_at,
              transition_id, decision_id, row_version
         FROM object_lifecycle_states
        WHERE tenant_id = ? AND canonical_object_id = ?`,
      [tenantId, canonicalObjectId]
    );
    const row = rows[0];
    if (!row) throw new Error('Object Lifecycle state not found in tenant.');
    return mapObjectLifecycle(row);
  }

  async listObjectLifecycleHistory(
    tenantId: TenantId,
    canonicalObjectId: ObjectLifecycleState['canonicalObjectId']
  ): Promise<ObjectLifecycleState[]> {
    const [rows] = await this.pool.execute<ObjectLifecycleStateRow[]>(
      `SELECT object_lifecycle_state_id AS id, tenant_id, canonical_object_id,
              lifecycle_definition_id, lifecycle_state_id, subject_version, sequence,
              effective_at, transition_id, decision_id, 1 AS row_version
         FROM object_lifecycle_history
        WHERE tenant_id = ? AND canonical_object_id = ?
        ORDER BY sequence`,
      [tenantId, canonicalObjectId]
    );
    return rows.map(mapObjectLifecycle);
  }

  private async insertLifecycleHistory(
    connection: PoolConnection,
    state: ObjectLifecycleState
  ): Promise<void> {
    await connection.execute(
      `INSERT INTO object_lifecycle_history
        (tenant_id, object_lifecycle_state_id, canonical_object_id, lifecycle_definition_id,
         lifecycle_state_id, subject_version, sequence, transition_id, decision_id, effective_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        state.tenantId,
        state.id,
        state.canonicalObjectId,
        state.lifecycleDefinitionId,
        state.lifecycleStateId,
        state.subjectVersion ?? null,
        state.sequence,
        state.transitionId ?? null,
        state.decisionId ?? null,
        databaseDate(state.effectiveAt)
      ]
    );
  }

  private async requireCanonicalObject(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<CanonicalObjectIdentity> {
    const [rows] = await connection.execute<CanonicalObjectRow[]>(
      `SELECT id, tenant_id, object_type, stable_key, created_at
         FROM canonical_objects WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Canonical Object not found in tenant.');
    return mapCanonicalObject(row);
  }

  private async requirePerson(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<Person> {
    const [rows] = await connection.execute<PersonRow[]>(
      `SELECT id, tenant_id, party_id, legal_name, preferred_name, status
         FROM persons WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Person not found in tenant.');
    return mapPerson(row);
  }

  private async requireAuthorityGrant(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<AuthorityGrant> {
    const [rows] = await connection.execute<AuthorityGrantRow[]>(
      `SELECT id, tenant_id, authority_definition_id, grantee_type, grantee_id,
              scope_type, scope_id, limit_value, effective_from, effective_to, status
         FROM authority_grants WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Authority Grant not found in tenant.');
    return mapAuthorityGrant(row);
  }

  private async requireLifecycleDefinition(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<LifecycleDefinition> {
    const [rows] = await connection.execute<LifecycleDefinitionRow[]>(
      `SELECT id, tenant_id, code, name, object_type, status
         FROM lifecycle_definitions WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Lifecycle Definition not found in tenant.');
    return mapLifecycleDefinition(row);
  }

  private async requireLifecycleState(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<LifecycleStateDefinition> {
    const [rows] = await connection.execute<LifecycleStateRow[]>(
      `SELECT id, tenant_id, lifecycle_definition_id, code, name, category,
              is_initial, is_terminal, status
         FROM lifecycle_state_definitions WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Lifecycle State Definition not found in tenant.');
    return mapLifecycleState(row);
  }

  private async requireLifecycleTransition(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<LifecycleTransitionDefinition> {
    const [rows] = await connection.execute<LifecycleTransitionRow[]>(
      `SELECT id, tenant_id, lifecycle_definition_id, code, name, from_state_id,
              to_state_id, requires_decision, required_decision_type,
              required_decision_outcome, status
         FROM lifecycle_transition_definitions WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Lifecycle Transition Definition not found in tenant.');
    return mapLifecycleTransition(row);
  }

  private async requireDecision(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<Decision> {
    const [rows] = await connection.execute<DecisionRow[]>(
      `SELECT id, tenant_id, decision_type, subject_object_id, subject_version,
              outcome, reason, decider_person_id, authority_grant_id, decided_at
         FROM decisions WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Decision not found in tenant.');
    return mapDecision(row);
  }

  private async requireObjectLifecycleForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    canonicalObjectId: ObjectLifecycleState['canonicalObjectId']
  ): Promise<ObjectLifecycleStateRow> {
    const [rows] = await connection.execute<ObjectLifecycleStateRow[]>(
      `SELECT id, tenant_id, canonical_object_id, lifecycle_definition_id,
              lifecycle_state_id, subject_version, sequence, effective_at,
              transition_id, decision_id, row_version
         FROM object_lifecycle_states
        WHERE tenant_id = ? AND canonical_object_id = ?
        FOR UPDATE`,
      [tenantId, canonicalObjectId]
    );
    const row = rows[0];
    if (!row) throw new Error('Object Lifecycle state not found in tenant.');
    return row;
  }
}
