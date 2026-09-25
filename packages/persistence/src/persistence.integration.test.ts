import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  asId,
  type AuthorityDefinition,
  type AuthorityGrant,
  type CanonicalObjectIdentity,
  type CanonicalRelationship,
  type JobProfile,
  type Organisation,
  type OrganisationUnit,
  type Party,
  type Person,
  type Position,
  type PositionOccupancy,
  type Tenant
} from '@nublox/kernel';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('MySQL enterprise kernel persistence', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('persists the canonical identity spine with audit attribution', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const tenantId = asId<'TenantId'>(`TENANT-${suffix}`, 'Tenant');
    const tenant: Tenant = { id: tenantId, name: 'NuBlox Test Tenant', status: 'ACTIVE' };
    const repository = new MySqlKernelRepository(pool);

    await repository.createTenant(tenant, { correlationId: `TEST-${suffix}` });

    const personParty: Party = {
      id: asId<'PartyId'>(`PARTY-P-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Stephen Test',
      status: 'ACTIVE'
    };
    await repository.createParty(tenantId, personParty);

    const person: Person = {
      id: asId<'PersonId'>(`PERSON-${suffix}`, 'Person'),
      tenantId,
      partyId: personParty.id,
      legalName: 'Stephen Test',
      status: 'ACTIVE'
    };
    await repository.createPerson(tenantId, person);

    const organisationParty: Party = {
      id: asId<'PartyId'>(`PARTY-O-${suffix}`, 'Party'),
      tenantId,
      kind: 'ORGANISATION',
      displayName: 'NuBlox Test Ltd',
      status: 'ACTIVE'
    };
    await repository.createParty(tenantId, organisationParty, { actorPersonId: person.id });

    const organisation: Organisation = {
      id: asId<'OrganisationId'>(`ORG-${suffix}`, 'Organisation'),
      tenantId,
      partyId: organisationParty.id,
      legalName: 'NuBlox Test Ltd',
      status: 'ACTIVE'
    };
    await repository.createOrganisation(tenantId, organisation, { actorPersonId: person.id });

    const unit: OrganisationUnit = {
      id: asId<'OrganisationUnitId'>(`UNIT-${suffix}`, 'Organisation Unit'),
      tenantId,
      organisationId: organisation.id,
      code: 'DESIGN',
      name: 'Design',
      status: 'ACTIVE'
    };
    await repository.createOrganisationUnit(tenantId, unit, { actorPersonId: person.id });

    const jobProfile: JobProfile = {
      id: asId<'JobProfileId'>(`JOB-${suffix}`, 'Job Profile'),
      catalogueScope: 'TENANT',
      tenantId,
      code: 'ARCH',
      name: 'Architect',
      status: 'ACTIVE'
    };
    await repository.createJobProfile(jobProfile, { actorPersonId: person.id });

    const position: Position = {
      id: asId<'PositionId'>(`POS-${suffix}`, 'Position'),
      tenantId,
      organisationUnitId: unit.id,
      jobProfileId: jobProfile.id,
      code: 'ARCH-01',
      title: 'Architect',
      lifecycleStatus: 'APPROVED',
      incumbencyModel: 'SINGLE',
      authorisedFte: 1,
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await repository.createPosition(tenantId, position, { actorPersonId: person.id });

    const occupancy: PositionOccupancy = {
      id: asId<'PositionOccupancyId'>(`OCC-${suffix}`, 'Position Occupancy'),
      tenantId,
      positionId: position.id,
      personId: person.id,
      effectiveFrom: '2026-09-20T00:00:00.000Z'
    };
    await repository.createPositionOccupancy(tenantId, occupancy, { actorPersonId: person.id });

    const authorityDefinition: AuthorityDefinition = {
      id: asId<'AuthorityDefinitionId'>(`AUTH-D-${suffix}`, 'Authority Definition'),
      tenantId,
      code: 'CONTRACT-SIGN',
      name: 'Contract signature authority',
      authorityType: 'CONTRACTUAL',
      unit: 'GBP',
      status: 'ACTIVE'
    };
    await repository.createAuthorityDefinition(tenantId, authorityDefinition, { actorPersonId: person.id });

    const authorityGrant: AuthorityGrant = {
      id: asId<'AuthorityGrantId'>(`AUTH-G-${suffix}`, 'Authority Grant'),
      tenantId,
      authorityDefinitionId: authorityDefinition.id,
      granteeType: 'POSITION',
      granteeId: position.id,
      scopeType: 'ORGANISATION',
      scopeId: organisation.id,
      limitValue: 100000,
      effectiveFrom: '2026-09-20T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await repository.createAuthorityGrant(tenantId, authorityGrant, { actorPersonId: person.id });

    const orgObject: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`OBJ-O-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'ORGANISATION',
      stableKey: organisation.id,
      createdAt: '2026-09-20T00:00:00.000Z'
    };
    const unitObject: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`OBJ-U-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'ORGANISATION_UNIT',
      stableKey: unit.id,
      createdAt: '2026-09-20T00:00:00.000Z'
    };
    await repository.createCanonicalObject(tenantId, orgObject, { actorPersonId: person.id });
    await repository.createCanonicalObject(tenantId, unitObject, { actorPersonId: person.id });

    const relationship: CanonicalRelationship = {
      id: asId<'CanonicalRelationshipId'>(`REL-${suffix}`, 'Canonical Relationship'),
      tenantId,
      relationshipType: 'ORGANISATION_CONTAINS_UNIT',
      fromObjectId: orgObject.id,
      toObjectId: unitObject.id,
      effectiveFrom: '2026-09-20T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await repository.createCanonicalRelationship(tenantId, relationship, { actorPersonId: person.id });

    const [auditRows] = await pool.query(
      'SELECT action, actor_person_id FROM kernel_audit_entries WHERE tenant_id = ?',
      [tenantId]
    );

    expect(Array.isArray(auditRows)).toBe(true);
    expect((auditRows as Array<{ action: string }>).length).toBeGreaterThanOrEqual(12);
    expect((auditRows as Array<{ actor_person_id: string | null }>).some((row) => row.actor_person_id === person.id)).toBe(true);
  });

  it('rejects cross-tenant persistence through the repository boundary', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = `X-${randomUUID().replaceAll('-', '').slice(0, 12)}`;
    const tenantA = asId<'TenantId'>(`TENANT-A-${suffix}`, 'Tenant');
    const tenantB = asId<'TenantId'>(`TENANT-B-${suffix}`, 'Tenant');
    const repository = new MySqlKernelRepository(pool);

    await repository.createTenant({ id: tenantA, name: 'A', status: 'ACTIVE' });
    await repository.createTenant({ id: tenantB, name: 'B', status: 'ACTIVE' });

    const party: Party = {
      id: asId<'PartyId'>(`PARTY-${suffix}`, 'Party'),
      tenantId: tenantB,
      kind: 'PERSON',
      displayName: 'Cross Tenant',
      status: 'ACTIVE'
    };

    await expect(repository.createParty(tenantA, party)).rejects.toThrow(
      'Persistence operation crossed tenant boundary.'
    );
  });
});
