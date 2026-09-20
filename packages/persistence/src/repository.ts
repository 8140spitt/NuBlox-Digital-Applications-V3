import {
  createAuthorityGrant,
  createCanonicalRelationship,
  createDelegation,
  createOrganisation,
  createOrganisationUnit,
  createPosition,
  createPositionOccupancy,
  createPerson,
  type AuthorityDefinition,
  type AuthorityGrant,
  type CanonicalObjectIdentity,
  type CanonicalRelationship,
  type Delegation,
  type JobProfile,
  type Organisation,
  type OrganisationUnit,
  type Party,
  type Person,
  type Position,
  type PositionOccupancy,
  type Tenant,
  type TenantId
} from '@nublox/kernel';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';

export interface AuditContext {
  actorPersonId?: string;
  correlationId?: string;
}

interface PartyRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  kind: 'PERSON' | 'ORGANISATION';
  display_name: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface OrganisationRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  party_id: string;
  legal_name: string;
  trading_name: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

interface OrganisationUnitRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  organisation_id: string;
  parent_unit_id: string | null;
  code: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface JobProfileRow extends RowDataPacket {
  id: string;
  catalogue_scope: 'PLATFORM' | 'TENANT';
  tenant_id: string | null;
  code: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface PositionRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  organisation_unit_id: string;
  job_profile_id: string | null;
  code: string;
  title: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface PersonRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  party_id: string;
  legal_name: string;
  preferred_name: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

interface AuthorityDefinitionRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  authority_type: AuthorityDefinition['authorityType'];
  unit: string | null;
  status: 'ACTIVE' | 'INACTIVE';
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
  status: 'ACTIVE' | 'INACTIVE';
}

interface CanonicalObjectRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  object_type: string;
  stable_key: string;
  created_at: Date;
}

function assertTenant(expected: TenantId, actual: TenantId): void {
  if (expected !== actual) {
    throw new Error('Persistence operation crossed tenant boundary.');
  }
}

function auditColumns(audit: AuditContext): [string | null, string | null] {
  return [audit.actorPersonId ?? null, audit.correlationId ?? null];
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
  const [actorPersonId, correlationId] = auditColumns(audit);
  await connection.execute(
    `INSERT INTO kernel_audit_entries
      (tenant_id, entity_type, entity_id, action, actor_person_id, correlation_id, payload)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [tenantId, entityType, entityId, action, actorPersonId, correlationId, JSON.stringify(payload)]
  );
}

export class MySqlKernelRepository {
  constructor(private readonly pool: Pool) {}

  async createTenant(tenant: Tenant, audit: AuditContext = {}): Promise<void> {
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO tenants (id, name, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?)`,
        [tenant.id, tenant.name, tenant.status, audit.actorPersonId ?? null, audit.actorPersonId ?? null]
      );
      await writeAudit(connection, tenant.id, 'TENANT', tenant.id, 'CREATED', audit, tenant);
    });
  }

  async createParty(tenantId: TenantId, party: Party, audit: AuditContext = {}): Promise<void> {
    assertTenant(tenantId, party.tenantId);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO parties
          (id, tenant_id, kind, display_name, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [party.id, party.tenantId, party.kind, party.displayName, party.status, audit.actorPersonId ?? null, audit.actorPersonId ?? null]
      );
      await writeAudit(connection, party.tenantId, 'PARTY', party.id, 'CREATED', audit, party);
    });
  }

  async createPerson(tenantId: TenantId, person: Person, audit: AuditContext = {}): Promise<void> {
    assertTenant(tenantId, person.tenantId);
    const party = await this.requireParty(person.tenantId, person.partyId);
    createPerson(person, party);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO persons
          (id, tenant_id, party_id, legal_name, preferred_name, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [person.id, person.tenantId, person.partyId, person.legalName, person.preferredName ?? null, person.status, audit.actorPersonId ?? null, audit.actorPersonId ?? null]
      );
      await writeAudit(connection, person.tenantId, 'PERSON', person.id, 'CREATED', audit, person);
    });
  }

  async createOrganisation(
    tenantId: TenantId,
    organisation: Organisation,
    audit: AuditContext = {}
  ): Promise<void> {
    assertTenant(tenantId, organisation.tenantId);
    const party = await this.requireParty(organisation.tenantId, organisation.partyId);
    createOrganisation(organisation, party);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO organisations
          (id, tenant_id, party_id, legal_name, trading_name, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [organisation.id, organisation.tenantId, organisation.partyId, organisation.legalName, organisation.tradingName ?? null, organisation.status, audit.actorPersonId ?? null, audit.actorPersonId ?? null]
      );
      await writeAudit(connection, organisation.tenantId, 'ORGANISATION', organisation.id, 'CREATED', audit, organisation);
    });
  }

  async createOrganisationUnit(
    tenantId: TenantId,
    unit: OrganisationUnit,
    audit: AuditContext = {}
  ): Promise<void> {
    assertTenant(tenantId, unit.tenantId);
    const organisation = await this.requireOrganisation(unit.tenantId, unit.organisationId);
    const parent = unit.parentUnitId
      ? await this.requireOrganisationUnit(unit.tenantId, unit.parentUnitId)
      : undefined;
    createOrganisationUnit(unit, organisation, parent);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO organisation_units
          (id, tenant_id, organisation_id, parent_unit_id, code, name, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [unit.id, unit.tenantId, unit.organisationId, unit.parentUnitId ?? null, unit.code, unit.name, unit.status, audit.actorPersonId ?? null, audit.actorPersonId ?? null]
      );
      await writeAudit(connection, unit.tenantId, 'ORGANISATION_UNIT', unit.id, 'CREATED', audit, unit);
    });
  }

  async createJobProfile(profile: JobProfile, audit: AuditContext = {}): Promise<void> {
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO job_profiles
          (id, catalogue_scope, tenant_id, code, name, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [profile.id, profile.catalogueScope, profile.tenantId ?? null, profile.code, profile.name, profile.status, audit.actorPersonId ?? null, audit.actorPersonId ?? null]
      );

      if (profile.tenantId) {
        await writeAudit(connection, profile.tenantId, 'JOB_PROFILE', profile.id, 'CREATED', audit, profile);
      }
    });
  }

  async createPosition(tenantId: TenantId, position: Position, audit: AuditContext = {}): Promise<void> {
    assertTenant(tenantId, position.tenantId);
    const unit = await this.requireOrganisationUnit(position.tenantId, position.organisationUnitId);
    const profile = position.jobProfileId ? await this.requireJobProfile(position.jobProfileId) : undefined;
    createPosition(position, unit, profile);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO positions
          (id, tenant_id, organisation_unit_id, job_profile_id, code, title, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [position.id, position.tenantId, position.organisationUnitId, position.jobProfileId ?? null, position.code, position.title, position.status, audit.actorPersonId ?? null, audit.actorPersonId ?? null]
      );
      await writeAudit(connection, position.tenantId, 'POSITION', position.id, 'CREATED', audit, position);
    });
  }

  async createPositionOccupancy(
    tenantId: TenantId,
    occupancy: PositionOccupancy,
    audit: AuditContext = {}
  ): Promise<void> {
    assertTenant(tenantId, occupancy.tenantId);
    const position = await this.requirePosition(occupancy.tenantId, occupancy.positionId);
    const person = await this.requirePerson(occupancy.tenantId, occupancy.personId);
    createPositionOccupancy(occupancy, position, person);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO position_occupancies
          (id, tenant_id, position_id, person_id, effective_from, effective_to, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [occupancy.id, occupancy.tenantId, occupancy.positionId, occupancy.personId, databaseDate(occupancy.effectiveFrom), occupancy.effectiveTo ? databaseDate(occupancy.effectiveTo) : null, audit.actorPersonId ?? null]
      );
      await writeAudit(connection, occupancy.tenantId, 'POSITION_OCCUPANCY', occupancy.id, 'CREATED', audit, occupancy);
    });
  }

  async createAuthorityDefinition(
    tenantId: TenantId,
    definition: AuthorityDefinition,
    audit: AuditContext = {}
  ): Promise<void> {
    assertTenant(tenantId, definition.tenantId);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO authority_definitions
          (id, tenant_id, code, name, authority_type, unit, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [definition.id, definition.tenantId, definition.code, definition.name, definition.authorityType, definition.unit ?? null, definition.status, audit.actorPersonId ?? null, audit.actorPersonId ?? null]
      );
      await writeAudit(connection, definition.tenantId, 'AUTHORITY_DEFINITION', definition.id, 'CREATED', audit, definition);
    });
  }

  async createAuthorityGrant(
    tenantId: TenantId,
    grant: AuthorityGrant,
    audit: AuditContext = {}
  ): Promise<void> {
    assertTenant(tenantId, grant.tenantId);
    const definition = await this.requireAuthorityDefinition(grant.tenantId, grant.authorityDefinitionId);
    createAuthorityGrant(grant, definition);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO authority_grants
          (id, tenant_id, authority_definition_id, grantee_type, grantee_id, scope_type, scope_id, limit_value, effective_from, effective_to, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [grant.id, grant.tenantId, grant.authorityDefinitionId, grant.granteeType, grant.granteeId, grant.scopeType, grant.scopeId ?? null, grant.limitValue ?? null, databaseDate(grant.effectiveFrom), grant.effectiveTo ? databaseDate(grant.effectiveTo) : null, grant.status, audit.actorPersonId ?? null, audit.actorPersonId ?? null]
      );
      await writeAudit(connection, grant.tenantId, 'AUTHORITY_GRANT', grant.id, 'CREATED', audit, grant);
    });
  }

  async createDelegation(tenantId: TenantId, delegation: Delegation, audit: AuditContext = {}): Promise<void> {
    assertTenant(tenantId, delegation.tenantId);
    const grant = await this.requireAuthorityGrant(delegation.tenantId, delegation.authorityGrantId);
    await this.requirePerson(delegation.tenantId, delegation.delegatedByPersonId);
    await this.requirePerson(delegation.tenantId, delegation.delegatedToPersonId);
    createDelegation(delegation, grant);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO delegations
          (id, tenant_id, authority_grant_id, delegated_by_person_id, delegated_to_person_id, effective_from, effective_to, reason, status, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [delegation.id, delegation.tenantId, delegation.authorityGrantId, delegation.delegatedByPersonId, delegation.delegatedToPersonId, databaseDate(delegation.effectiveFrom), delegation.effectiveTo ? databaseDate(delegation.effectiveTo) : null, delegation.reason, delegation.status, audit.actorPersonId ?? null]
      );
      await writeAudit(connection, delegation.tenantId, 'DELEGATION', delegation.id, 'CREATED', audit, delegation);
    });
  }

  async createCanonicalObject(
    tenantId: TenantId,
    object: CanonicalObjectIdentity,
    audit: AuditContext = {}
  ): Promise<void> {
    assertTenant(tenantId, object.tenantId);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO canonical_objects (id, tenant_id, object_type, stable_key, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [object.id, object.tenantId, object.objectType, object.stableKey, databaseDate(object.createdAt)]
      );
      await writeAudit(connection, object.tenantId, 'CANONICAL_OBJECT', object.id, 'CREATED', audit, object);
    });
  }

  async createCanonicalRelationship(
    tenantId: TenantId,
    relationship: CanonicalRelationship,
    audit: AuditContext = {}
  ): Promise<void> {
    assertTenant(tenantId, relationship.tenantId);
    const from = await this.requireCanonicalObject(relationship.tenantId, relationship.fromObjectId);
    const to = await this.requireCanonicalObject(relationship.tenantId, relationship.toObjectId);
    createCanonicalRelationship(relationship, from, to);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO canonical_relationships
          (id, tenant_id, relationship_type, from_object_id, to_object_id, effective_from, effective_to, status, metadata, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [relationship.id, relationship.tenantId, relationship.relationshipType, relationship.fromObjectId, relationship.toObjectId, databaseDate(relationship.effectiveFrom), relationship.effectiveTo ? databaseDate(relationship.effectiveTo) : null, relationship.status, relationship.metadata ? JSON.stringify(relationship.metadata) : null, audit.actorPersonId ?? null]
      );
      await writeAudit(connection, relationship.tenantId, 'CANONICAL_RELATIONSHIP', relationship.id, 'CREATED', audit, relationship);
    });
  }

  private async requireParty(tenantId: TenantId, id: string): Promise<Party> {
    const [rows] = await this.pool.execute<PartyRow[]>(
      'SELECT id, tenant_id, kind, display_name, status FROM parties WHERE tenant_id = ? AND id = ?',
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Party not found in tenant.');
    return { id: row.id as Party['id'], tenantId: row.tenant_id as TenantId, kind: row.kind, displayName: row.display_name, status: row.status };
  }

  private async requirePerson(tenantId: TenantId, id: string): Promise<Person> {
    const [rows] = await this.pool.execute<PersonRow[]>(
      'SELECT id, tenant_id, party_id, legal_name, preferred_name, status FROM persons WHERE tenant_id = ? AND id = ?',
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Person not found in tenant.');
    return {
      id: row.id as Person['id'],
      tenantId: row.tenant_id as TenantId,
      partyId: row.party_id as Person['partyId'],
      legalName: row.legal_name,
      ...(row.preferred_name ? { preferredName: row.preferred_name } : {}),
      status: row.status
    };
  }

  private async requireOrganisation(tenantId: TenantId, id: string): Promise<Organisation> {
    const [rows] = await this.pool.execute<OrganisationRow[]>(
      'SELECT id, tenant_id, party_id, legal_name, trading_name, status FROM organisations WHERE tenant_id = ? AND id = ?',
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Organisation not found in tenant.');
    return {
      id: row.id as Organisation['id'],
      tenantId: row.tenant_id as TenantId,
      partyId: row.party_id as Organisation['partyId'],
      legalName: row.legal_name,
      ...(row.trading_name ? { tradingName: row.trading_name } : {}),
      status: row.status
    };
  }

  private async requireOrganisationUnit(tenantId: TenantId, id: string): Promise<OrganisationUnit> {
    const [rows] = await this.pool.execute<OrganisationUnitRow[]>(
      'SELECT id, tenant_id, organisation_id, parent_unit_id, code, name, status FROM organisation_units WHERE tenant_id = ? AND id = ?',
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Organisation Unit not found in tenant.');
    return {
      id: row.id as OrganisationUnit['id'],
      tenantId: row.tenant_id as TenantId,
      organisationId: row.organisation_id as OrganisationUnit['organisationId'],
      ...(row.parent_unit_id ? { parentUnitId: row.parent_unit_id as NonNullable<OrganisationUnit['parentUnitId']> } : {}),
      code: row.code,
      name: row.name,
      status: row.status
    };
  }

  private async requireJobProfile(id: string): Promise<JobProfile> {
    const [rows] = await this.pool.execute<JobProfileRow[]>(
      'SELECT id, catalogue_scope, tenant_id, code, name, status FROM job_profiles WHERE id = ?',
      [id]
    );
    const row = rows[0];
    if (!row) throw new Error('Job Profile not found.');
    return {
      id: row.id as JobProfile['id'],
      catalogueScope: row.catalogue_scope,
      ...(row.tenant_id ? { tenantId: row.tenant_id as TenantId } : {}),
      code: row.code,
      name: row.name,
      status: row.status
    };
  }

  private async requirePosition(tenantId: TenantId, id: string): Promise<Position> {
    const [rows] = await this.pool.execute<PositionRow[]>(
      'SELECT id, tenant_id, organisation_unit_id, job_profile_id, code, title, status FROM positions WHERE tenant_id = ? AND id = ?',
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Position not found in tenant.');
    return {
      id: row.id as Position['id'],
      tenantId: row.tenant_id as TenantId,
      organisationUnitId: row.organisation_unit_id as Position['organisationUnitId'],
      ...(row.job_profile_id ? { jobProfileId: row.job_profile_id as NonNullable<Position['jobProfileId']> } : {}),
      code: row.code,
      title: row.title,
      status: row.status
    };
  }

  private async requireAuthorityDefinition(tenantId: TenantId, id: string): Promise<AuthorityDefinition> {
    const [rows] = await this.pool.execute<AuthorityDefinitionRow[]>(
      'SELECT id, tenant_id, code, name, authority_type, unit, status FROM authority_definitions WHERE tenant_id = ? AND id = ?',
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Authority Definition not found in tenant.');
    return {
      id: row.id as AuthorityDefinition['id'],
      tenantId: row.tenant_id as TenantId,
      code: row.code,
      name: row.name,
      authorityType: row.authority_type,
      ...(row.unit ? { unit: row.unit } : {}),
      status: row.status
    };
  }

  private async requireAuthorityGrant(tenantId: TenantId, id: string): Promise<AuthorityGrant> {
    const [rows] = await this.pool.execute<AuthorityGrantRow[]>(
      `SELECT id, tenant_id, authority_definition_id, grantee_type, grantee_id, scope_type, scope_id,
              limit_value, effective_from, effective_to, status
       FROM authority_grants WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Authority Grant not found in tenant.');
    return {
      id: row.id as AuthorityGrant['id'],
      tenantId: row.tenant_id as TenantId,
      authorityDefinitionId: row.authority_definition_id as AuthorityGrant['authorityDefinitionId'],
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

  private async requireCanonicalObject(tenantId: TenantId, id: string): Promise<CanonicalObjectIdentity> {
    const [rows] = await this.pool.execute<CanonicalObjectRow[]>(
      'SELECT id, tenant_id, object_type, stable_key, created_at FROM canonical_objects WHERE tenant_id = ? AND id = ?',
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Canonical Object not found in tenant.');
    return {
      id: row.id as CanonicalObjectIdentity['id'],
      tenantId: row.tenant_id as TenantId,
      objectType: row.object_type,
      stableKey: row.stable_key,
      createdAt: row.created_at.toISOString()
    };
  }
}
