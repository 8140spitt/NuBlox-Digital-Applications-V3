import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  createOrganisation,
  createOrganisationUnit,
  createPerson,
  createPosition,
  createPositionOccupancy,
  type CanonicalObjectIdentity,
  type JobProfile,
  type Organisation,
  type OrganisationUnit,
  type Party,
  type Person,
  type Position,
  type PositionOccupancy,
  type TenantId
} from '@nublox/kernel';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';

interface OrganisationRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  party_id: string;
  legal_name: string;
  trading_name: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

interface UnitRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  organisation_id: string;
  parent_unit_id: string | null;
  code: string;
  name: string;
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

interface PositionRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  organisation_unit_id: string;
  job_profile_id: string | null;
  code: string;
  title: string;
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

interface CanonicalObjectRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  object_type: string;
  stable_key: string;
  created_at: Date;
}

interface CountRow extends RowDataPacket {
  count: number;
}

export interface CreateOrganisationInput {
  legalName: string;
  tradingName?: string;
}

export interface CreateOrganisationUnitInput {
  organisationId: string;
  parentUnitId?: string;
  code: string;
  name: string;
}

export interface CreatePersonInput {
  legalName: string;
  preferredName?: string;
}

export interface CreatePositionInput {
  organisationUnitId: string;
  jobProfileId?: string;
  code: string;
  title: string;
}

export interface AssignPersonToPositionInput {
  positionId: string;
  personId: string;
  effectiveFrom?: string;
}

export class OrganisationCommandError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'PERMISSION_DENIED'
      | 'INVALID_INPUT'
      | 'NOT_FOUND'
      | 'CONFLICT'
  ) {
    super(message);
    this.name = 'OrganisationCommandError';
  }
}

function nonEmpty(value: string | undefined, label: string): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    throw new OrganisationCommandError(`${label} is required.`, 'INVALID_INPUT');
  }
  return trimmed;
}

function optionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? '';
  return trimmed || undefined;
}

function isDuplicateEntry(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error &&
    (error as { code?: string }).code === 'ER_DUP_ENTRY';
}

async function writeAudit(
  connection: PoolConnection,
  tenantId: string,
  entityType: string,
  entityId: string,
  action: string,
  actorPersonId: string,
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
      actorPersonId,
      'ORGANISATION-ADMIN',
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

export class MySqlOrganisationCommandService {
  private readonly access: MySqlAccessRepository;

  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
  }

  async createOrganisation(
    tenantId: TenantId,
    actorPersonId: string,
    input: CreateOrganisationInput
  ): Promise<Organisation> {
    await this.requirePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.ORGANISATION_MANAGE
    );

    const legalName = nonEmpty(input.legalName, 'Legal name');
    const tradingName = optionalText(input.tradingName);
    const party: Party = {
      id: asId<'PartyId'>(`PARTY-${randomUUID()}`, 'Party'),
      tenantId,
      kind: 'ORGANISATION',
      displayName: tradingName ?? legalName,
      status: 'ACTIVE'
    };
    const organisation: Organisation = {
      id: asId<'OrganisationId'>(`ORG-${randomUUID()}`, 'Organisation'),
      tenantId,
      partyId: party.id,
      legalName,
      ...(tradingName ? { tradingName } : {}),
      status: 'ACTIVE'
    };
    createOrganisation(organisation, party);

    try {
      await withTransaction(this.pool, async (connection) => {
        await connection.execute(
          `INSERT INTO parties
            (id, tenant_id, kind, display_name, status, created_by_person_id, updated_by_person_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            party.id,
            tenantId,
            party.kind,
            party.displayName,
            party.status,
            actorPersonId,
            actorPersonId
          ]
        );

        await connection.execute(
          `INSERT INTO organisations
            (id, tenant_id, party_id, legal_name, trading_name, status,
             created_by_person_id, updated_by_person_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            organisation.id,
            tenantId,
            organisation.partyId,
            organisation.legalName,
            organisation.tradingName ?? null,
            organisation.status,
            actorPersonId,
            actorPersonId
          ]
        );

        await this.createCanonicalObject(
          connection,
          tenantId,
          'ORGANISATION',
          organisation.id,
          actorPersonId
        );

        await writeAudit(
          connection,
          tenantId,
          'PARTY',
          party.id,
          'CREATED',
          actorPersonId,
          party
        );
        await writeAudit(
          connection,
          tenantId,
          'ORGANISATION',
          organisation.id,
          'CREATED',
          actorPersonId,
          organisation
        );
      });
    } catch (error) {
      if (isDuplicateEntry(error)) {
        throw new OrganisationCommandError(
          'An Organisation with conflicting identity already exists.',
          'CONFLICT'
        );
      }
      throw error;
    }

    return organisation;
  }

  async createPerson(
    tenantId: TenantId,
    actorPersonId: string,
    input: CreatePersonInput
  ): Promise<Person> {
    await this.requirePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.PEOPLE_MANAGE
    );

    const legalName = nonEmpty(input.legalName, 'Legal name');
    const preferredName = optionalText(input.preferredName);
    const party: Party = {
      id: asId<'PartyId'>(`PARTY-${randomUUID()}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: preferredName ?? legalName,
      status: 'ACTIVE'
    };
    const person: Person = {
      id: asId<'PersonId'>(`PERSON-${randomUUID()}`, 'Person'),
      tenantId,
      partyId: party.id,
      legalName,
      ...(preferredName ? { preferredName } : {}),
      status: 'ACTIVE'
    };
    createPerson(person, party);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO parties
          (id, tenant_id, kind, display_name, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          party.id,
          tenantId,
          party.kind,
          party.displayName,
          party.status,
          actorPersonId,
          actorPersonId
        ]
      );

      await connection.execute(
        `INSERT INTO persons
          (id, tenant_id, party_id, legal_name, preferred_name, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          person.id,
          tenantId,
          person.partyId,
          person.legalName,
          person.preferredName ?? null,
          person.status,
          actorPersonId,
          actorPersonId
        ]
      );

      await this.createCanonicalObject(
        connection,
        tenantId,
        'PERSON',
        person.id,
        actorPersonId
      );

      await writeAudit(
        connection,
        tenantId,
        'PARTY',
        party.id,
        'CREATED',
        actorPersonId,
        party
      );
      await writeAudit(
        connection,
        tenantId,
        'PERSON',
        person.id,
        'CREATED',
        actorPersonId,
        person
      );
    });

    return person;
  }

  async createOrganisationUnit(
    tenantId: TenantId,
    actorPersonId: string,
    input: CreateOrganisationUnitInput
  ): Promise<OrganisationUnit> {
    await this.requirePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.ORGANISATION_MANAGE
    );

    const organisationId = nonEmpty(input.organisationId, 'Organisation');
    const code = nonEmpty(input.code, 'Unit code').toUpperCase();
    const name = nonEmpty(input.name, 'Unit name');
    const parentUnitId = optionalText(input.parentUnitId);

    try {
      return await withTransaction(this.pool, async (connection) => {
        const organisation = await this.requireOrganisation(
          connection,
          tenantId,
          organisationId
        );
        const parent = parentUnitId
          ? await this.requireOrganisationUnit(connection, tenantId, parentUnitId)
          : undefined;

        const unit: OrganisationUnit = {
          id: asId<'OrganisationUnitId'>(
            `UNIT-${randomUUID()}`,
            'Organisation Unit'
          ),
          tenantId,
          organisationId: organisation.id,
          ...(parent ? { parentUnitId: parent.id } : {}),
          code,
          name,
          status: 'ACTIVE'
        };
        createOrganisationUnit(unit, organisation, parent);

        await connection.execute(
          `INSERT INTO organisation_units
            (id, tenant_id, organisation_id, parent_unit_id, code, name, status,
             created_by_person_id, updated_by_person_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            unit.id,
            tenantId,
            unit.organisationId,
            unit.parentUnitId ?? null,
            unit.code,
            unit.name,
            unit.status,
            actorPersonId,
            actorPersonId
          ]
        );

        const organisationObject = await this.ensureCanonicalObject(
          connection,
          tenantId,
          'ORGANISATION',
          organisation.id,
          actorPersonId
        );
        const unitObject = await this.createCanonicalObject(
          connection,
          tenantId,
          'ORGANISATION_UNIT',
          unit.id,
          actorPersonId
        );

        await this.createCanonicalRelationship(
          connection,
          tenantId,
          'ORGANISATION_CONTAINS_UNIT',
          organisationObject,
          unitObject,
          actorPersonId
        );

        await writeAudit(
          connection,
          tenantId,
          'ORGANISATION_UNIT',
          unit.id,
          'CREATED',
          actorPersonId,
          unit
        );

        return unit;
      });
    } catch (error) {
      if (error instanceof OrganisationCommandError) throw error;
      if (isDuplicateEntry(error)) {
        throw new OrganisationCommandError(
          'An Organisation Unit with this code already exists in the Organisation.',
          'CONFLICT'
        );
      }
      throw error;
    }
  }

  async createPosition(
    tenantId: TenantId,
    actorPersonId: string,
    input: CreatePositionInput
  ): Promise<Position> {
    await this.requirePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.ORGANISATION_MANAGE
    );

    const organisationUnitId = nonEmpty(input.organisationUnitId, 'Organisation Unit');
    const code = nonEmpty(input.code, 'Position code').toUpperCase();
    const title = nonEmpty(input.title, 'Position title');
    const jobProfileId = optionalText(input.jobProfileId);

    try {
      return await withTransaction(this.pool, async (connection) => {
        const unit = await this.requireOrganisationUnit(
          connection,
          tenantId,
          organisationUnitId
        );
        const profile = jobProfileId
          ? await this.requireJobProfile(connection, tenantId, jobProfileId)
          : undefined;

        const position: Position = {
          id: asId<'PositionId'>(`POS-${randomUUID()}`, 'Position'),
          tenantId,
          organisationUnitId: unit.id,
          ...(profile ? { jobProfileId: profile.id } : {}),
          code,
          title,
          status: 'ACTIVE'
        };
        createPosition(position, unit, profile);

        await connection.execute(
          `INSERT INTO positions
            (id, tenant_id, organisation_unit_id, job_profile_id, code, title, status,
             created_by_person_id, updated_by_person_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            position.id,
            tenantId,
            position.organisationUnitId,
            position.jobProfileId ?? null,
            position.code,
            position.title,
            position.status,
            actorPersonId,
            actorPersonId
          ]
        );

        const unitObject = await this.ensureCanonicalObject(
          connection,
          tenantId,
          'ORGANISATION_UNIT',
          unit.id,
          actorPersonId
        );
        const positionObject = await this.createCanonicalObject(
          connection,
          tenantId,
          'POSITION',
          position.id,
          actorPersonId
        );
        await this.createCanonicalRelationship(
          connection,
          tenantId,
          'ORGANISATION_UNIT_HAS_POSITION',
          unitObject,
          positionObject,
          actorPersonId
        );

        await writeAudit(
          connection,
          tenantId,
          'POSITION',
          position.id,
          'CREATED',
          actorPersonId,
          position
        );

        return position;
      });
    } catch (error) {
      if (error instanceof OrganisationCommandError) throw error;
      if (isDuplicateEntry(error)) {
        throw new OrganisationCommandError(
          'A Position with this code already exists in the Organisation Unit.',
          'CONFLICT'
        );
      }
      throw error;
    }
  }

  async assignPersonToPosition(
    tenantId: TenantId,
    actorPersonId: string,
    input: AssignPersonToPositionInput
  ): Promise<PositionOccupancy> {
    await this.requirePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.PEOPLE_MANAGE
    );

    const positionId = nonEmpty(input.positionId, 'Position');
    const personId = nonEmpty(input.personId, 'Person');
    const effectiveFrom = input.effectiveFrom
      ? new Date(input.effectiveFrom)
      : new Date();

    if (Number.isNaN(effectiveFrom.getTime())) {
      throw new OrganisationCommandError(
        'Position occupancy effective date is invalid.',
        'INVALID_INPUT'
      );
    }

    return withTransaction(this.pool, async (connection) => {
      const [position, person] = await Promise.all([
        this.requirePosition(connection, tenantId, positionId),
        this.requirePerson(connection, tenantId, personId)
      ]);

      const [existingRows] = await connection.execute<CountRow[]>(
        `SELECT COUNT(*) AS count
           FROM position_occupancies
          WHERE tenant_id = ?
            AND position_id = ?
            AND person_id = ?
            AND (effective_to IS NULL OR effective_to >= ?)`,
        [tenantId, positionId, personId, effectiveFrom]
      );

      if ((existingRows[0]?.count ?? 0) > 0) {
        throw new OrganisationCommandError(
          'This Person already has an overlapping occupancy for the Position.',
          'CONFLICT'
        );
      }

      const occupancy: PositionOccupancy = {
        id: asId<'PositionOccupancyId'>(
          `OCC-${randomUUID()}`,
          'Position Occupancy'
        ),
        tenantId,
        positionId: position.id,
        personId: person.id,
        effectiveFrom: effectiveFrom.toISOString()
      };
      createPositionOccupancy(occupancy, position, person);

      await connection.execute(
        `INSERT INTO position_occupancies
          (id, tenant_id, position_id, person_id, effective_from, effective_to,
           created_by_person_id)
         VALUES (?, ?, ?, ?, ?, NULL, ?)`,
        [
          occupancy.id,
          tenantId,
          occupancy.positionId,
          occupancy.personId,
          effectiveFrom,
          actorPersonId
        ]
      );

      await writeAudit(
        connection,
        tenantId,
        'POSITION_OCCUPANCY',
        occupancy.id,
        'CREATED',
        actorPersonId,
        occupancy
      );

      return occupancy;
    });
  }

  private async requirePermission(
    tenantId: TenantId,
    actorPersonId: string,
    permissionKey: string
  ): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId,
      actorPersonId,
      permissionKey,
      { scopeType: 'TENANT' }
    );

    if (!evaluation.allowed) {
      throw new OrganisationCommandError(
        evaluation.reason,
        'PERMISSION_DENIED'
      );
    }
  }

  private async requireOrganisation(
    connection: PoolConnection,
    tenantId: TenantId,
    id: string
  ): Promise<Organisation> {
    const [rows] = await connection.execute<OrganisationRow[]>(
      `SELECT id, tenant_id, party_id, legal_name, trading_name, status
         FROM organisations
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) {
      throw new OrganisationCommandError(
        'Organisation was not found in the tenant.',
        'NOT_FOUND'
      );
    }

    return {
      id: row.id as Organisation['id'],
      tenantId: row.tenant_id as TenantId,
      partyId: row.party_id as Organisation['partyId'],
      legalName: row.legal_name,
      ...(row.trading_name ? { tradingName: row.trading_name } : {}),
      status: row.status
    };
  }

  private async requireOrganisationUnit(
    connection: PoolConnection,
    tenantId: TenantId,
    id: string
  ): Promise<OrganisationUnit> {
    const [rows] = await connection.execute<UnitRow[]>(
      `SELECT id, tenant_id, organisation_id, parent_unit_id, code, name, status
         FROM organisation_units
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) {
      throw new OrganisationCommandError(
        'Organisation Unit was not found in the tenant.',
        'NOT_FOUND'
      );
    }

    return {
      id: row.id as OrganisationUnit['id'],
      tenantId: row.tenant_id as TenantId,
      organisationId: row.organisation_id as OrganisationUnit['organisationId'],
      ...(row.parent_unit_id
        ? {
            parentUnitId:
              row.parent_unit_id as NonNullable<OrganisationUnit['parentUnitId']>
          }
        : {}),
      code: row.code,
      name: row.name,
      status: row.status
    };
  }

  private async requirePerson(
    connection: PoolConnection,
    tenantId: TenantId,
    id: string
  ): Promise<Person> {
    const [rows] = await connection.execute<PersonRow[]>(
      `SELECT id, tenant_id, party_id, legal_name, preferred_name, status
         FROM persons
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) {
      throw new OrganisationCommandError(
        'Person was not found in the tenant.',
        'NOT_FOUND'
      );
    }

    return {
      id: row.id as Person['id'],
      tenantId: row.tenant_id as TenantId,
      partyId: row.party_id as Person['partyId'],
      legalName: row.legal_name,
      ...(row.preferred_name ? { preferredName: row.preferred_name } : {}),
      status: row.status
    };
  }

  private async requirePosition(
    connection: PoolConnection,
    tenantId: TenantId,
    id: string
  ): Promise<Position> {
    const [rows] = await connection.execute<PositionRow[]>(
      `SELECT id, tenant_id, organisation_unit_id, job_profile_id, code, title, status
         FROM positions
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) {
      throw new OrganisationCommandError(
        'Position was not found in the tenant.',
        'NOT_FOUND'
      );
    }

    return {
      id: row.id as Position['id'],
      tenantId: row.tenant_id as TenantId,
      organisationUnitId:
        row.organisation_unit_id as Position['organisationUnitId'],
      ...(row.job_profile_id
        ? { jobProfileId: row.job_profile_id as NonNullable<Position['jobProfileId']> }
        : {}),
      code: row.code,
      title: row.title,
      status: row.status
    };
  }

  private async requireJobProfile(
    connection: PoolConnection,
    tenantId: TenantId,
    id: string
  ): Promise<JobProfile> {
    const [rows] = await connection.execute<JobProfileRow[]>(
      `SELECT id, catalogue_scope, tenant_id, code, name, status
         FROM job_profiles
        WHERE id = ?
          AND status = 'ACTIVE'
          AND (catalogue_scope = 'PLATFORM' OR tenant_id = ?)`,
      [id, tenantId]
    );
    const row = rows[0];
    if (!row) {
      throw new OrganisationCommandError(
        'Job Profile was not found or is unavailable to the tenant.',
        'NOT_FOUND'
      );
    }

    return {
      id: row.id as JobProfile['id'],
      catalogueScope: row.catalogue_scope,
      ...(row.tenant_id ? { tenantId: row.tenant_id as TenantId } : {}),
      code: row.code,
      name: row.name,
      status: row.status
    };
  }

  private async createCanonicalObject(
    connection: PoolConnection,
    tenantId: TenantId,
    objectType: string,
    stableKey: string,
    actorPersonId: string
  ): Promise<CanonicalObjectIdentity> {
    const object: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`OBJ-${randomUUID()}`, 'Canonical Object'),
      tenantId,
      objectType,
      stableKey,
      createdAt: new Date().toISOString()
    };

    await connection.execute(
      `INSERT INTO canonical_objects
        (id, tenant_id, object_type, stable_key, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [object.id, tenantId, object.objectType, object.stableKey, new Date(object.createdAt)]
    );

    await writeAudit(
      connection,
      tenantId,
      'CANONICAL_OBJECT',
      object.id,
      'CREATED',
      actorPersonId,
      object
    );

    return object;
  }

  private async ensureCanonicalObject(
    connection: PoolConnection,
    tenantId: TenantId,
    objectType: string,
    stableKey: string,
    actorPersonId: string
  ): Promise<CanonicalObjectIdentity> {
    const [rows] = await connection.execute<CanonicalObjectRow[]>(
      `SELECT id, tenant_id, object_type, stable_key, created_at
         FROM canonical_objects
        WHERE tenant_id = ? AND object_type = ? AND stable_key = ?`,
      [tenantId, objectType, stableKey]
    );
    const row = rows[0];

    if (row) {
      return {
        id: row.id as CanonicalObjectIdentity['id'],
        tenantId: row.tenant_id as TenantId,
        objectType: row.object_type,
        stableKey: row.stable_key,
        createdAt: row.created_at.toISOString()
      };
    }

    return this.createCanonicalObject(
      connection,
      tenantId,
      objectType,
      stableKey,
      actorPersonId
    );
  }

  private async createCanonicalRelationship(
    connection: PoolConnection,
    tenantId: TenantId,
    relationshipType: string,
    from: CanonicalObjectIdentity,
    to: CanonicalObjectIdentity,
    actorPersonId: string
  ): Promise<void> {
    const id = `REL-${randomUUID()}`;
    const effectiveFrom = new Date();

    await connection.execute(
      `INSERT INTO canonical_relationships
        (id, tenant_id, relationship_type, from_object_id, to_object_id,
         effective_from, status, metadata, created_by_person_id)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', NULL, ?)`,
      [
        id,
        tenantId,
        relationshipType,
        from.id,
        to.id,
        effectiveFrom,
        actorPersonId
      ]
    );

    await writeAudit(
      connection,
      tenantId,
      'CANONICAL_RELATIONSHIP',
      id,
      'CREATED',
      actorPersonId,
      {
        id,
        tenantId,
        relationshipType,
        fromObjectId: from.id,
        toObjectId: to.id,
        effectiveFrom: effectiveFrom.toISOString(),
        status: 'ACTIVE'
      }
    );
  }
}
