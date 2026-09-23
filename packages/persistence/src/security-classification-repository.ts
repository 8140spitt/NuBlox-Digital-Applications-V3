import {
  createClearanceGrant,
  createSecurityAccessException,
  createSecurityClassificationAssignment,
  createSecurityClassificationLevel,
  createSecurityClassificationScheme,
  evaluateSecurityClassificationAccess,
  type CanonicalObjectId,
  type ClearanceGrant,
  type PolicyScopeId,
  type SecurityAccessException,
  type SecurityClassificationAssignment,
  type SecurityClassificationLevel,
  type SecurityClassificationScheme,
  type SecurityPrincipalReference,
  type TenantId
} from '@nublox/kernel';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';
import type { AuditContext } from './repository.js';

interface SchemeRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description: string | null;
  scheme_kind: SecurityClassificationScheme['kind'];
  status: SecurityClassificationScheme['status'];
}

interface LevelRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  scheme_id: string;
  code: string;
  name: string;
  description: string | null;
  rank_order: number | null;
  status: SecurityClassificationLevel['status'];
}

interface AssignmentRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  subject_object_id: string;
  subject_version: string | null;
  classification_level_id: string;
  effective_from: Date;
  effective_to: Date | null;
  status: SecurityClassificationAssignment['status'];
}

interface GrantRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  principal_type: ClearanceGrant['principalType'];
  principal_id: string;
  classification_level_id: string;
  include_lower_levels: number | boolean;
  scope_type: string;
  scope_id: string | null;
  effective_from: Date;
  effective_to: Date | null;
  status: ClearanceGrant['status'];
  level_code: string;
  level_name: string;
  level_description: string | null;
  rank_order: number | null;
  scheme_id: string;
  scheme_code: string;
  scheme_name: string;
  scheme_description: string | null;
  scheme_kind: SecurityClassificationScheme['kind'];
  scheme_status: SecurityClassificationScheme['status'];
  level_status: SecurityClassificationLevel['status'];
}

interface ExceptionRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  subject_object_id: string;
  subject_version: string | null;
  principal_type: SecurityAccessException['principalType'];
  principal_id: string;
  classification_level_id: string;
  approval_decision_id: string;
  reason: string;
  effective_from: Date;
  effective_to: Date | null;
  status: SecurityAccessException['status'];
}

interface PrincipalContextRow extends RowDataPacket {
  position_id: string;
  organisation_unit_id: string;
  organisation_id: string;
}

interface IdRow extends RowDataPacket {
  id: string;
}

interface AssignmentEvaluationRow extends AssignmentRow {
  level_code: string;
  level_name: string;
  level_description: string | null;
  rank_order: number | null;
  level_status: SecurityClassificationLevel['status'];
  scheme_id: string;
  scheme_code: string;
  scheme_name: string;
  scheme_description: string | null;
  scheme_kind: SecurityClassificationScheme['kind'];
  scheme_status: SecurityClassificationScheme['status'];
}

export interface SecurityClassificationEvaluationItem {
  assignmentId: string;
  schemeId: string;
  schemeCode: string;
  levelId: string;
  levelCode: string;
  allowed: boolean;
  reason: string;
  matchedClearanceGrantId?: string;
  matchedExceptionId?: string;
}

export interface SecuritySubjectAccessEvaluation {
  allowed: boolean;
  reason: string;
  principals: SecurityPrincipalReference[];
  classifications: SecurityClassificationEvaluationItem[];
}

function dbDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date/time value: ${value}`);
  return date;
}

function mapScheme(row: SchemeRow): SecurityClassificationScheme {
  return {
    id: row.id as SecurityClassificationScheme['id'],
    tenantId: row.tenant_id as TenantId,
    code: row.code,
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    kind: row.scheme_kind,
    status: row.status
  };
}

function mapLevel(row: LevelRow): SecurityClassificationLevel {
  return {
    id: row.id as SecurityClassificationLevel['id'],
    tenantId: row.tenant_id as TenantId,
    schemeId: row.scheme_id as SecurityClassificationLevel['schemeId'],
    code: row.code,
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    ...(row.rank_order === null ? {} : { rankOrder: Number(row.rank_order) }),
    status: row.status
  };
}

function mapAssignment(row: AssignmentRow): SecurityClassificationAssignment {
  return {
    id: row.id as SecurityClassificationAssignment['id'],
    tenantId: row.tenant_id as TenantId,
    subjectObjectId: row.subject_object_id as CanonicalObjectId,
    ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
    classificationLevelId:
      row.classification_level_id as SecurityClassificationAssignment['classificationLevelId'],
    effectiveFrom: row.effective_from.toISOString(),
    ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
    status: row.status
  };
}

function mapException(row: ExceptionRow): SecurityAccessException {
  return {
    id: row.id as SecurityAccessException['id'],
    tenantId: row.tenant_id as TenantId,
    subjectObjectId: row.subject_object_id as CanonicalObjectId,
    ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
    principalType: row.principal_type,
    principalId: row.principal_id,
    classificationLevelId:
      row.classification_level_id as SecurityAccessException['classificationLevelId'],
    approvalDecisionId:
      row.approval_decision_id as SecurityAccessException['approvalDecisionId'],
    reason: row.reason,
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

export class MySqlSecurityClassificationRepository {
  constructor(private readonly pool: Pool) {}

  async createScheme(
    scheme: SecurityClassificationScheme,
    audit: AuditContext = {}
  ): Promise<void> {
    createSecurityClassificationScheme(scheme);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO security_classification_schemes
          (id, tenant_id, code, name, description, scheme_kind, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          scheme.id,
          scheme.tenantId,
          scheme.code,
          scheme.name,
          scheme.description ?? null,
          scheme.kind,
          scheme.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await evidence(
        connection,
        scheme.tenantId,
        'SECURITY_CLASSIFICATION_SCHEME',
        scheme.id,
        'CREATED',
        audit,
        scheme
      );
    });
  }

  async createLevel(
    level: SecurityClassificationLevel,
    audit: AuditContext = {}
  ): Promise<void> {
    const scheme = await this.requireScheme(level.tenantId, level.schemeId);
    createSecurityClassificationLevel(level, scheme);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO security_classification_levels
          (id, tenant_id, scheme_id, code, name, description, rank_order, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          level.id,
          level.tenantId,
          level.schemeId,
          level.code,
          level.name,
          level.description ?? null,
          level.rankOrder ?? null,
          level.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await evidence(
        connection,
        level.tenantId,
        'SECURITY_CLASSIFICATION_LEVEL',
        level.id,
        'CREATED',
        audit,
        level
      );
    });
  }

  async assignClassification(
    assignment: SecurityClassificationAssignment,
    audit: AuditContext = {}
  ): Promise<void> {
    const level = await this.requireLevel(
      assignment.tenantId,
      assignment.classificationLevelId
    );
    createSecurityClassificationAssignment(assignment, level);
    await this.requireCanonicalObject(assignment.tenantId, assignment.subjectObjectId);
    await this.requireNoOverlappingClassification(assignment, level.schemeId);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO security_classification_assignments
          (id, tenant_id, subject_object_id, subject_version, classification_level_id,
           effective_from, effective_to, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          assignment.id,
          assignment.tenantId,
          assignment.subjectObjectId,
          assignment.subjectVersion ?? null,
          assignment.classificationLevelId,
          dbDate(assignment.effectiveFrom),
          assignment.effectiveTo ? dbDate(assignment.effectiveTo) : null,
          assignment.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await evidence(
        connection,
        assignment.tenantId,
        'SECURITY_CLASSIFICATION_ASSIGNMENT',
        assignment.id,
        'ASSIGNED',
        audit,
        assignment
      );
    });
  }

  async grantClearance(
    grant: ClearanceGrant,
    audit: AuditContext = {}
  ): Promise<void> {
    const level = await this.requireLevel(grant.tenantId, grant.classificationLevelId);
    const scheme = await this.requireScheme(grant.tenantId, level.schemeId);
    createClearanceGrant(grant, level, scheme);
    await this.requirePrincipal(grant.tenantId, grant.principalType, grant.principalId);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO clearance_grants
          (id, tenant_id, principal_type, principal_id, classification_level_id,
           include_lower_levels, scope_type, scope_id, effective_from, effective_to,
           status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          grant.id,
          grant.tenantId,
          grant.principalType,
          grant.principalId,
          grant.classificationLevelId,
          grant.includeLowerLevels,
          grant.scopeType,
          grant.scopeId ?? null,
          dbDate(grant.effectiveFrom),
          grant.effectiveTo ? dbDate(grant.effectiveTo) : null,
          grant.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await evidence(
        connection,
        grant.tenantId,
        'CLEARANCE_GRANT',
        grant.id,
        'GRANTED',
        audit,
        grant
      );
    });
  }

  async createAccessException(
    exception: SecurityAccessException,
    audit: AuditContext = {}
  ): Promise<void> {
    const level = await this.requireLevel(
      exception.tenantId,
      exception.classificationLevelId
    );
    createSecurityAccessException(exception, level);
    await Promise.all([
      this.requireCanonicalObject(exception.tenantId, exception.subjectObjectId),
      this.requirePrincipal(exception.tenantId, exception.principalType, exception.principalId),
      this.requireSubjectDecision(
        exception.tenantId,
        exception.approvalDecisionId,
        exception.subjectObjectId,
        exception.subjectVersion
      )
    ]);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO security_access_exceptions
          (id, tenant_id, subject_object_id, subject_version, principal_type, principal_id,
           classification_level_id, approval_decision_id, reason, effective_from, effective_to,
           status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          exception.id,
          exception.tenantId,
          exception.subjectObjectId,
          exception.subjectVersion ?? null,
          exception.principalType,
          exception.principalId,
          exception.classificationLevelId,
          exception.approvalDecisionId,
          exception.reason,
          dbDate(exception.effectiveFrom),
          exception.effectiveTo ? dbDate(exception.effectiveTo) : null,
          exception.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await evidence(
        connection,
        exception.tenantId,
        'SECURITY_ACCESS_EXCEPTION',
        exception.id,
        'APPROVED',
        audit,
        exception
      );
    });
  }

  async evaluateForPerson(
    tenantId: TenantId,
    personId: string,
    subjectObjectId: CanonicalObjectId,
    subjectVersion: string | undefined,
    targetScope: { scopeType: string; scopeId?: string },
    evaluatedAt = new Date().toISOString()
  ): Promise<SecuritySubjectAccessEvaluation> {
    const evaluatedDate = dbDate(evaluatedAt);
    const principals = await this.resolvePersonPrincipals(tenantId, personId, evaluatedDate);
    const [assignmentRows] = await this.pool.execute<AssignmentEvaluationRow[]>(
      `SELECT sca.id, sca.tenant_id, sca.subject_object_id, sca.subject_version,
              sca.classification_level_id, sca.effective_from, sca.effective_to, sca.status,
              scl.code AS level_code, scl.name AS level_name,
              scl.description AS level_description, scl.rank_order,
              scl.status AS level_status, scs.id AS scheme_id, scs.code AS scheme_code,
              scs.name AS scheme_name, scs.description AS scheme_description,
              scs.scheme_kind, scs.status AS scheme_status
         FROM security_classification_assignments sca
         JOIN security_classification_levels scl
           ON scl.tenant_id = sca.tenant_id AND scl.id = sca.classification_level_id
         JOIN security_classification_schemes scs
           ON scs.tenant_id = scl.tenant_id AND scs.id = scl.scheme_id
        WHERE sca.tenant_id = ?
          AND sca.subject_object_id = ?
          AND sca.subject_version <=> ?
          AND sca.status = 'ACTIVE'
          AND scl.status = 'ACTIVE'
          AND scs.status = 'ACTIVE'
          AND sca.effective_from <= ?
          AND (sca.effective_to IS NULL OR sca.effective_to >= ?)
        ORDER BY scs.code, scl.rank_order, scl.code`,
      [tenantId, subjectObjectId, subjectVersion ?? null, evaluatedDate, evaluatedDate]
    );

    if (assignmentRows.length === 0) {
      return {
        allowed: true,
        reason: 'The subject has no effective Security Classification Assignment.',
        principals,
        classifications: []
      };
    }

    const byScheme = new Map<string, AssignmentEvaluationRow[]>();
    for (const row of assignmentRows) {
      const list = byScheme.get(row.scheme_id) ?? [];
      list.push(row);
      byScheme.set(row.scheme_id, list);
    }
    const ambiguous = [...byScheme.entries()].find(([, rows]) => rows.length > 1);
    if (ambiguous) {
      return {
        allowed: false,
        reason: `Multiple effective classifications exist for scheme ${ambiguous[0]}.`,
        principals,
        classifications: []
      };
    }

    const [grantRows, exceptionRows] = await Promise.all([
      this.loadClearanceCandidates(tenantId, principals, evaluatedDate),
      this.loadExceptions(
        tenantId,
        principals,
        subjectObjectId,
        subjectVersion,
        evaluatedDate
      )
    ]);

    const clearances = grantRows.map((row) => {
      const scheme: SecurityClassificationScheme = {
        id: row.scheme_id as SecurityClassificationScheme['id'],
        tenantId: row.tenant_id as TenantId,
        code: row.scheme_code,
        name: row.scheme_name,
        ...(row.scheme_description ? { description: row.scheme_description } : {}),
        kind: row.scheme_kind,
        status: row.scheme_status
      };
      const level: SecurityClassificationLevel = {
        id: row.classification_level_id as SecurityClassificationLevel['id'],
        tenantId: row.tenant_id as TenantId,
        schemeId: row.scheme_id as SecurityClassificationLevel['schemeId'],
        code: row.level_code,
        name: row.level_name,
        ...(row.level_description ? { description: row.level_description } : {}),
        ...(row.rank_order === null ? {} : { rankOrder: Number(row.rank_order) }),
        status: row.level_status
      };
      const grant: ClearanceGrant = {
        id: row.id as ClearanceGrant['id'],
        tenantId: row.tenant_id as TenantId,
        principalType: row.principal_type,
        principalId: row.principal_id,
        classificationLevelId:
          row.classification_level_id as ClearanceGrant['classificationLevelId'],
        includeLowerLevels: Boolean(row.include_lower_levels),
        scopeType: row.scope_type,
        ...(row.scope_id ? { scopeId: row.scope_id } : {}),
        effectiveFrom: row.effective_from.toISOString(),
        ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
        status: row.status
      };
      return { grant, level, scheme };
    });
    const exceptions = exceptionRows.map(mapException);

    const classifications: SecurityClassificationEvaluationItem[] = assignmentRows.map(
      (row) => {
        const assignment = mapAssignment(row);
        const scheme: SecurityClassificationScheme = {
          id: row.scheme_id as SecurityClassificationScheme['id'],
          tenantId: row.tenant_id as TenantId,
          code: row.scheme_code,
          name: row.scheme_name,
          ...(row.scheme_description ? { description: row.scheme_description } : {}),
          kind: row.scheme_kind,
          status: row.scheme_status
        };
        const level: SecurityClassificationLevel = {
          id: row.classification_level_id as SecurityClassificationLevel['id'],
          tenantId: row.tenant_id as TenantId,
          schemeId: row.scheme_id as SecurityClassificationLevel['schemeId'],
          code: row.level_code,
          name: row.level_name,
          ...(row.level_description ? { description: row.level_description } : {}),
          ...(row.rank_order === null ? {} : { rankOrder: Number(row.rank_order) }),
          status: row.level_status
        };

        const result = evaluateSecurityClassificationAccess({
          assignment,
          level,
          scheme,
          clearances,
          exceptions,
          principals,
          evaluatedAt,
          targetScopeType: targetScope.scopeType,
          ...(targetScope.scopeId ? { targetScopeId: targetScope.scopeId } : {})
        });

        return {
          assignmentId: assignment.id,
          schemeId: scheme.id,
          schemeCode: scheme.code,
          levelId: level.id,
          levelCode: level.code,
          allowed: result.allowed,
          reason: result.reason,
          ...(result.matchedClearanceGrantId
            ? { matchedClearanceGrantId: result.matchedClearanceGrantId }
            : {}),
          ...(result.matchedExceptionId
            ? { matchedExceptionId: result.matchedExceptionId }
            : {})
        };
      }
    );

    const denied = classifications.find((item) => !item.allowed);
    return {
      allowed: !denied,
      reason: denied
        ? denied.reason
        : 'All effective Security Classification Assignments are covered.',
      principals,
      classifications
    };
  }

  async getScheme(
    tenantId: TenantId,
    schemeId: SecurityClassificationScheme['id']
  ): Promise<SecurityClassificationScheme | undefined> {
    const [rows] = await this.pool.execute<SchemeRow[]>(
      `SELECT id, tenant_id, code, name, description, scheme_kind, status
         FROM security_classification_schemes
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, schemeId]
    );
    return rows[0] ? mapScheme(rows[0]) : undefined;
  }

  async getLevel(
    tenantId: TenantId,
    levelId: SecurityClassificationLevel['id']
  ): Promise<SecurityClassificationLevel | undefined> {
    const [rows] = await this.pool.execute<LevelRow[]>(
      `SELECT id, tenant_id, scheme_id, code, name, description, rank_order, status
         FROM security_classification_levels
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, levelId]
    );
    return rows[0] ? mapLevel(rows[0]) : undefined;
  }

  private async requireScheme(
    tenantId: TenantId,
    schemeId: SecurityClassificationScheme['id']
  ): Promise<SecurityClassificationScheme> {
    const scheme = await this.getScheme(tenantId, schemeId);
    if (!scheme) throw new Error('Security Classification Scheme not found in tenant.');
    return scheme;
  }

  private async requireLevel(
    tenantId: TenantId,
    levelId: SecurityClassificationLevel['id']
  ): Promise<SecurityClassificationLevel> {
    const level = await this.getLevel(tenantId, levelId);
    if (!level) throw new Error('Security Classification Level not found in tenant.');
    return level;
  }

  private async requireCanonicalObject(
    tenantId: TenantId,
    objectId: CanonicalObjectId
  ): Promise<void> {
    const [rows] = await this.pool.execute<IdRow[]>(
      'SELECT id FROM canonical_objects WHERE tenant_id = ? AND id = ?',
      [tenantId, objectId]
    );
    if (!rows[0]) throw new Error('Canonical subject was not found in tenant.');
  }

  private async requirePrincipal(
    tenantId: TenantId,
    principalType: ClearanceGrant['principalType'],
    principalId: string
  ): Promise<void> {
    const tables: Record<ClearanceGrant['principalType'], string> = {
      PERSON: 'persons',
      POSITION: 'positions',
      ORGANISATION_UNIT: 'organisation_units',
      ORGANISATION: 'organisations'
    };
    const table = tables[principalType];
    const [rows] = await this.pool.query<IdRow[]>(
      `SELECT id FROM ${table} WHERE tenant_id = ? AND id = ? AND status = 'ACTIVE'`,
      [tenantId, principalId]
    );
    if (!rows[0]) throw new Error('Clearance principal was not found or is inactive in tenant.');
  }

  private async requireSubjectDecision(
    tenantId: TenantId,
    decisionId: SecurityAccessException['approvalDecisionId'],
    objectId: CanonicalObjectId,
    subjectVersion: string | undefined
  ): Promise<void> {
    const [rows] = await this.pool.execute<IdRow[]>(
      `SELECT id
         FROM decisions
        WHERE tenant_id = ?
          AND id = ?
          AND subject_object_id = ?
          AND subject_version <=> ?`,
      [tenantId, decisionId, objectId, subjectVersion ?? null]
    );
    if (!rows[0]) {
      throw new Error(
        'Security Access Exception requires a Decision for the exact subject and version.'
      );
    }
  }

  private async requireNoOverlappingClassification(
    assignment: SecurityClassificationAssignment,
    schemeId: SecurityClassificationScheme['id']
  ): Promise<void> {
    const from = dbDate(assignment.effectiveFrom);
    const to = assignment.effectiveTo ? dbDate(assignment.effectiveTo) : null;
    const [rows] = await this.pool.execute<IdRow[]>(
      `SELECT sca.id
         FROM security_classification_assignments sca
         JOIN security_classification_levels scl
           ON scl.tenant_id = sca.tenant_id AND scl.id = sca.classification_level_id
        WHERE sca.tenant_id = ?
          AND sca.subject_object_id = ?
          AND sca.subject_version <=> ?
          AND scl.scheme_id = ?
          AND sca.status = 'ACTIVE'
          AND (? IS NULL OR sca.effective_from <= ?)
          AND (sca.effective_to IS NULL OR sca.effective_to >= ?)
        LIMIT 1`,
      [
        assignment.tenantId,
        assignment.subjectObjectId,
        assignment.subjectVersion ?? null,
        schemeId,
        to,
        to,
        from
      ]
    );
    if (rows[0]) {
      throw new Error(
        'An overlapping active classification already exists for this subject/version and scheme.'
      );
    }
  }

  private async resolvePersonPrincipals(
    tenantId: TenantId,
    personId: string,
    evaluatedAt: Date
  ): Promise<SecurityPrincipalReference[]> {
    const [personRows] = await this.pool.execute<IdRow[]>(
      `SELECT id FROM persons
        WHERE tenant_id = ? AND id = ? AND status = 'ACTIVE'`,
      [tenantId, personId]
    );
    if (!personRows[0]) throw new Error('Person was not found or is inactive in tenant.');

    const [rows] = await this.pool.execute<PrincipalContextRow[]>(
      `SELECT p.id AS position_id,
              p.organisation_unit_id,
              ou.organisation_id
         FROM position_occupancies po
         JOIN positions p
           ON p.tenant_id = po.tenant_id AND p.id = po.position_id
         JOIN organisation_units ou
           ON ou.tenant_id = p.tenant_id AND ou.id = p.organisation_unit_id
        WHERE po.tenant_id = ?
          AND po.person_id = ?
          AND po.effective_from <= ?
          AND (po.effective_to IS NULL OR po.effective_to >= ?)
          AND p.status = 'ACTIVE'
          AND ou.status = 'ACTIVE'`,
      [tenantId, personId, evaluatedAt, evaluatedAt]
    );

    const principals = new Map<string, SecurityPrincipalReference>();
    const add = (principal: SecurityPrincipalReference) =>
      principals.set(`${principal.principalType}:${principal.principalId}`, principal);

    add({ principalType: 'PERSON', principalId: personId });
    for (const row of rows) {
      add({ principalType: 'POSITION', principalId: row.position_id });
      add({ principalType: 'ORGANISATION_UNIT', principalId: row.organisation_unit_id });
      add({ principalType: 'ORGANISATION', principalId: row.organisation_id });
    }

    return [...principals.values()];
  }

  private async loadClearanceCandidates(
    tenantId: TenantId,
    principals: ReadonlyArray<SecurityPrincipalReference>,
    evaluatedAt: Date
  ): Promise<GrantRow[]> {
    if (principals.length === 0) return [];
    const principalClause = principals.map(() => '(?, ?)').join(', ');
    const principalArgs = principals.flatMap((item) => [
      item.principalType,
      item.principalId
    ]);

    const [rows] = await this.pool.query<GrantRow[]>(
      `SELECT cg.id, cg.tenant_id, cg.principal_type, cg.principal_id,
              cg.classification_level_id, cg.include_lower_levels,
              cg.scope_type, cg.scope_id, cg.effective_from, cg.effective_to, cg.status,
              scl.code AS level_code, scl.name AS level_name,
              scl.description AS level_description, scl.rank_order,
              scl.status AS level_status, scs.id AS scheme_id, scs.code AS scheme_code,
              scs.name AS scheme_name, scs.description AS scheme_description,
              scs.scheme_kind, scs.status AS scheme_status
         FROM clearance_grants cg
         JOIN security_classification_levels scl
           ON scl.tenant_id = cg.tenant_id AND scl.id = cg.classification_level_id
         JOIN security_classification_schemes scs
           ON scs.tenant_id = scl.tenant_id AND scs.id = scl.scheme_id
        WHERE cg.tenant_id = ?
          AND (cg.principal_type, cg.principal_id) IN (${principalClause})
          AND cg.status = 'ACTIVE'
          AND scl.status = 'ACTIVE'
          AND scs.status = 'ACTIVE'
          AND cg.effective_from <= ?
          AND (cg.effective_to IS NULL OR cg.effective_to >= ?)`,
      [tenantId, ...principalArgs, evaluatedAt, evaluatedAt]
    );
    return rows;
  }

  private async loadExceptions(
    tenantId: TenantId,
    principals: ReadonlyArray<SecurityPrincipalReference>,
    subjectObjectId: CanonicalObjectId,
    subjectVersion: string | undefined,
    evaluatedAt: Date
  ): Promise<ExceptionRow[]> {
    if (principals.length === 0) return [];
    const principalClause = principals.map(() => '(?, ?)').join(', ');
    const principalArgs = principals.flatMap((item) => [
      item.principalType,
      item.principalId
    ]);

    const [rows] = await this.pool.query<ExceptionRow[]>(
      `SELECT id, tenant_id, subject_object_id, subject_version,
              principal_type, principal_id, classification_level_id,
              approval_decision_id, reason, effective_from, effective_to, status
         FROM security_access_exceptions
        WHERE tenant_id = ?
          AND subject_object_id = ?
          AND subject_version <=> ?
          AND (principal_type, principal_id) IN (${principalClause})
          AND status = 'ACTIVE'
          AND effective_from <= ?
          AND (effective_to IS NULL OR effective_to >= ?)`,
      [
        tenantId,
        subjectObjectId,
        subjectVersion ?? null,
        ...principalArgs,
        evaluatedAt,
        evaluatedAt
      ]
    );
    return rows;
  }
}
