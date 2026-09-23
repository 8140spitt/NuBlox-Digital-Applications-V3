import {
  PLATFORM_PERMISSION_KEYS,
  type SecurityClassificationSchemeKind,
  type SecurityPrincipalType,
  type TenantId
} from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';

interface SchemeRow extends RowDataPacket {
  id: string;
  code: string;
  name: string;
  description: string | null;
  scheme_kind: SecurityClassificationSchemeKind;
  status: 'ACTIVE' | 'INACTIVE';
}

interface LevelRow extends RowDataPacket {
  id: string;
  scheme_id: string;
  scheme_code: string;
  code: string;
  name: string;
  description: string | null;
  rank_order: number | null;
  status: 'ACTIVE' | 'INACTIVE';
}

interface AssignmentRow extends RowDataPacket {
  id: string;
  subject_object_id: string;
  object_type: string;
  stable_key: string;
  subject_version: string | null;
  classification_level_id: string;
  scheme_code: string;
  level_code: string;
  level_name: string;
  effective_from: Date;
  effective_to: Date | null;
  status: 'ACTIVE' | 'INACTIVE';
}

interface GrantRow extends RowDataPacket {
  id: string;
  principal_type: SecurityPrincipalType;
  principal_id: string;
  principal_label: string;
  classification_level_id: string;
  scheme_code: string;
  level_code: string;
  level_name: string;
  include_lower_levels: number | boolean;
  scope_type: string;
  scope_id: string | null;
  effective_from: Date;
  effective_to: Date | null;
  status: 'ACTIVE' | 'INACTIVE';
}

interface PersonRow extends RowDataPacket { id: string; label: string; }
interface PositionRow extends RowDataPacket { id: string; label: string; }
interface UnitRow extends RowDataPacket { id: string; label: string; }
interface OrganisationRow extends RowDataPacket { id: string; label: string; }

interface ExceptionRow extends RowDataPacket {
  id: string;
  subject_object_id: string;
  stable_key: string;
  subject_version: string | null;
  principal_type: SecurityPrincipalType;
  principal_id: string;
  classification_level_id: string;
  scheme_code: string;
  level_code: string;
  approval_decision_id: string;
  reason: string;
  effective_from: Date;
  effective_to: Date | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface SecurityClassificationAdministrationProjection {
  principals: Array<{
    type: SecurityPrincipalType;
    id: string;
    label: string;
  }>;
  schemes: Array<{
    id: string;
    code: string;
    name: string;
    description?: string;
    kind: SecurityClassificationSchemeKind;
    status: 'ACTIVE' | 'INACTIVE';
  }>;
  levels: Array<{
    id: string;
    schemeId: string;
    schemeCode: string;
    code: string;
    name: string;
    description?: string;
    rankOrder?: number;
    status: 'ACTIVE' | 'INACTIVE';
  }>;
  assignments: Array<{
    id: string;
    subjectObjectId: string;
    objectType: string;
    stableKey: string;
    subjectVersion?: string;
    classificationLevelId: string;
    schemeCode: string;
    levelCode: string;
    levelName: string;
    effectiveFrom: string;
    effectiveTo?: string;
    status: 'ACTIVE' | 'INACTIVE';
  }>;
  clearances: Array<{
    id: string;
    principalType: SecurityPrincipalType;
    principalId: string;
    principalLabel: string;
    classificationLevelId: string;
    schemeCode: string;
    levelCode: string;
    levelName: string;
    includeLowerLevels: boolean;
    scopeType: string;
    scopeId?: string;
    effectiveFrom: string;
    effectiveTo?: string;
    status: 'ACTIVE' | 'INACTIVE';
  }>;
  exceptions: Array<{
    id: string;
    subjectObjectId: string;
    stableKey: string;
    subjectVersion?: string;
    principalType: SecurityPrincipalType;
    principalId: string;
    classificationLevelId: string;
    schemeCode: string;
    levelCode: string;
    approvalDecisionId: string;
    reason: string;
    effectiveFrom: string;
    effectiveTo?: string;
    status: 'ACTIVE' | 'INACTIVE';
  }>;
}

export class SecurityClassificationAdministrationReadError extends Error {
  constructor(message: string, readonly code: 'PERMISSION_DENIED') {
    super(message);
    this.name = 'SecurityClassificationAdministrationReadError';
  }
}

export class MySqlSecurityClassificationAdministrationReadRepository {
  private readonly access: MySqlAccessRepository;

  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
  }

  async getProjection(
    tenantId: TenantId,
    actorPersonId: string
  ): Promise<SecurityClassificationAdministrationProjection> {
    await this.requireRead(tenantId, actorPersonId);

    const [principals, schemes, levels, assignments, clearances, exceptions] = await Promise.all([
      this.loadPrincipals(tenantId),
      this.pool.execute<SchemeRow[]>(
        `SELECT id, code, name, description, scheme_kind, status
           FROM security_classification_schemes
          WHERE tenant_id = ?
          ORDER BY code, id`,
        [tenantId]
      ),
      this.pool.execute<LevelRow[]>(
        `SELECT scl.id, scl.scheme_id, scs.code AS scheme_code,
                scl.code, scl.name, scl.description, scl.rank_order, scl.status
           FROM security_classification_levels scl
           JOIN security_classification_schemes scs
             ON scs.tenant_id = scl.tenant_id AND scs.id = scl.scheme_id
          WHERE scl.tenant_id = ?
          ORDER BY scs.code, scl.rank_order, scl.code`,
        [tenantId]
      ),
      this.pool.execute<AssignmentRow[]>(
        `SELECT sca.id, sca.subject_object_id, co.object_type, co.stable_key,
                sca.subject_version, sca.classification_level_id,
                scs.code AS scheme_code, scl.code AS level_code, scl.name AS level_name,
                sca.effective_from, sca.effective_to, sca.status
           FROM security_classification_assignments sca
           JOIN canonical_objects co
             ON co.tenant_id = sca.tenant_id AND co.id = sca.subject_object_id
           JOIN security_classification_levels scl
             ON scl.tenant_id = sca.tenant_id AND scl.id = sca.classification_level_id
           JOIN security_classification_schemes scs
             ON scs.tenant_id = scl.tenant_id AND scs.id = scl.scheme_id
          WHERE sca.tenant_id = ?
          ORDER BY co.object_type, co.stable_key, scs.code`,
        [tenantId]
      ),
      this.loadClearances(tenantId),
      this.pool.execute<ExceptionRow[]>(
        `SELECT sae.id, sae.subject_object_id, co.stable_key, sae.subject_version,
                sae.principal_type, sae.principal_id, sae.classification_level_id,
                scs.code AS scheme_code, scl.code AS level_code,
                sae.approval_decision_id, sae.reason,
                sae.effective_from, sae.effective_to, sae.status
           FROM security_access_exceptions sae
           JOIN canonical_objects co
             ON co.tenant_id = sae.tenant_id AND co.id = sae.subject_object_id
           JOIN security_classification_levels scl
             ON scl.tenant_id = sae.tenant_id AND scl.id = sae.classification_level_id
           JOIN security_classification_schemes scs
             ON scs.tenant_id = scl.tenant_id AND scs.id = scl.scheme_id
          WHERE sae.tenant_id = ?
          ORDER BY co.stable_key, scs.code, sae.id`,
        [tenantId]
      )
    ]);

    return {
      principals,
      schemes: schemes[0].map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        ...(row.description ? { description: row.description } : {}),
        kind: row.scheme_kind,
        status: row.status
      })),
      levels: levels[0].map((row) => ({
        id: row.id,
        schemeId: row.scheme_id,
        schemeCode: row.scheme_code,
        code: row.code,
        name: row.name,
        ...(row.description ? { description: row.description } : {}),
        ...(row.rank_order === null ? {} : { rankOrder: Number(row.rank_order) }),
        status: row.status
      })),
      assignments: assignments[0].map((row) => ({
        id: row.id,
        subjectObjectId: row.subject_object_id,
        objectType: row.object_type,
        stableKey: row.stable_key,
        ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
        classificationLevelId: row.classification_level_id,
        schemeCode: row.scheme_code,
        levelCode: row.level_code,
        levelName: row.level_name,
        effectiveFrom: row.effective_from.toISOString(),
        ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
        status: row.status
      })),
      clearances,
      exceptions: exceptions[0].map((row) => ({
        id: row.id,
        subjectObjectId: row.subject_object_id,
        stableKey: row.stable_key,
        ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
        principalType: row.principal_type,
        principalId: row.principal_id,
        classificationLevelId: row.classification_level_id,
        schemeCode: row.scheme_code,
        levelCode: row.level_code,
        approvalDecisionId: row.approval_decision_id,
        reason: row.reason,
        effectiveFrom: row.effective_from.toISOString(),
        ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
        status: row.status
      }))
    };
  }

  private async loadPrincipals(
    tenantId: TenantId
  ): Promise<SecurityClassificationAdministrationProjection['principals']> {
    const [people, positions, units, organisations] = await Promise.all([
      this.pool.execute<PersonRow[]>(
        `SELECT id, COALESCE(preferred_name, legal_name) AS label
           FROM persons
          WHERE tenant_id = ? AND status = 'ACTIVE'
          ORDER BY label, id`,
        [tenantId]
      ),
      this.pool.execute<PositionRow[]>(
        `SELECT id, CONCAT(code, ' — ', title) AS label
           FROM positions
          WHERE tenant_id = ? AND status = 'ACTIVE'
          ORDER BY code, title, id`,
        [tenantId]
      ),
      this.pool.execute<UnitRow[]>(
        `SELECT id, CONCAT(code, ' — ', name) AS label
           FROM organisation_units
          WHERE tenant_id = ? AND status = 'ACTIVE'
          ORDER BY code, name, id`,
        [tenantId]
      ),
      this.pool.execute<OrganisationRow[]>(
        `SELECT id, legal_name AS label
           FROM organisations
          WHERE tenant_id = ? AND status = 'ACTIVE'
          ORDER BY legal_name, id`,
        [tenantId]
      )
    ]);

    return [
      ...people[0].map((row) => ({ type: 'PERSON' as const, id: row.id, label: row.label })),
      ...positions[0].map((row) => ({ type: 'POSITION' as const, id: row.id, label: row.label })),
      ...units[0].map((row) => ({ type: 'ORGANISATION_UNIT' as const, id: row.id, label: row.label })),
      ...organisations[0].map((row) => ({ type: 'ORGANISATION' as const, id: row.id, label: row.label }))
    ];
  }

  private async loadClearances(
    tenantId: TenantId
  ): Promise<SecurityClassificationAdministrationProjection['clearances']> {
    const [rows] = await this.pool.execute<GrantRow[]>(
      `SELECT cg.id, cg.principal_type, cg.principal_id,
              CASE cg.principal_type
                WHEN 'PERSON' THEN COALESCE(p.preferred_name, p.legal_name)
                WHEN 'POSITION' THEN CONCAT(pos.code, ' — ', pos.title)
                WHEN 'ORGANISATION_UNIT' THEN CONCAT(ou.code, ' — ', ou.name)
                WHEN 'ORGANISATION' THEN o.legal_name
                ELSE cg.principal_id
              END AS principal_label,
              cg.classification_level_id, scs.code AS scheme_code,
              scl.code AS level_code, scl.name AS level_name,
              cg.include_lower_levels, cg.scope_type, cg.scope_id,
              cg.effective_from, cg.effective_to, cg.status
         FROM clearance_grants cg
         JOIN security_classification_levels scl
           ON scl.tenant_id = cg.tenant_id AND scl.id = cg.classification_level_id
         JOIN security_classification_schemes scs
           ON scs.tenant_id = scl.tenant_id AND scs.id = scl.scheme_id
         LEFT JOIN persons p
           ON cg.principal_type = 'PERSON' AND p.tenant_id = cg.tenant_id AND p.id = cg.principal_id
         LEFT JOIN positions pos
           ON cg.principal_type = 'POSITION' AND pos.tenant_id = cg.tenant_id AND pos.id = cg.principal_id
         LEFT JOIN organisation_units ou
           ON cg.principal_type = 'ORGANISATION_UNIT' AND ou.tenant_id = cg.tenant_id AND ou.id = cg.principal_id
         LEFT JOIN organisations o
           ON cg.principal_type = 'ORGANISATION' AND o.tenant_id = cg.tenant_id AND o.id = cg.principal_id
        WHERE cg.tenant_id = ?
        ORDER BY principal_label, scs.code, scl.rank_order, scl.code`,
      [tenantId]
    );

    return rows.map((row) => ({
      id: row.id,
      principalType: row.principal_type,
      principalId: row.principal_id,
      principalLabel: row.principal_label,
      classificationLevelId: row.classification_level_id,
      schemeCode: row.scheme_code,
      levelCode: row.level_code,
      levelName: row.level_name,
      includeLowerLevels: Boolean(row.include_lower_levels),
      scopeType: row.scope_type,
      ...(row.scope_id ? { scopeId: row.scope_id } : {}),
      effectiveFrom: row.effective_from.toISOString(),
      ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
      status: row.status
    }));
  }

  private async requireRead(
    tenantId: TenantId,
    actorPersonId: string
  ): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.SECURITY_CLASSIFICATION_READ,
      { scopeType: 'TENANT' }
    );

    if (!evaluation.allowed) {
      throw new SecurityClassificationAdministrationReadError(
        evaluation.reason,
        'PERMISSION_DENIED'
      );
    }
  }
}
