import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  asId,
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
import { MySqlOrganisationReadRepository } from './organisation-read-repository.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('organisation structure read projection', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('returns only tenant-scoped Organisation structure and current Position occupancy', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const tenantId = asId<'TenantId'>(`TENANT-ORG-${suffix}`, 'Tenant');
    const otherTenantId = asId<'TenantId'>(`TENANT-OTHER-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const reads = new MySqlOrganisationReadRepository(pool);

    const tenant: Tenant = { id: tenantId, name: 'Organisation Test Tenant', status: 'ACTIVE' };
    const otherTenant: Tenant = { id: otherTenantId, name: 'Other Tenant', status: 'ACTIVE' };
    await kernel.createTenant(tenant);
    await kernel.createTenant(otherTenant);

    const personParty: Party = {
      id: asId<'PartyId'>(`PARTY-P-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Assigned Person',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, personParty);
    const person: Person = {
      id: asId<'PersonId'>(`PERSON-${suffix}`, 'Person'),
      tenantId,
      partyId: personParty.id,
      legalName: 'Assigned Person',
      preferredName: 'Assigned',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, person);

    const unassignedParty: Party = {
      id: asId<'PartyId'>(`PARTY-U-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Unassigned Person',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, unassignedParty);
    const unassignedPerson: Person = {
      id: asId<'PersonId'>(`PERSON-U-${suffix}`, 'Person'),
      tenantId,
      partyId: unassignedParty.id,
      legalName: 'Unassigned Person',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, unassignedPerson);

    const organisationParty: Party = {
      id: asId<'PartyId'>(`PARTY-O-${suffix}`, 'Party'),
      tenantId,
      kind: 'ORGANISATION',
      displayName: 'NuBlox Organisation Test Ltd',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, organisationParty);
    const organisation: Organisation = {
      id: asId<'OrganisationId'>(`ORG-${suffix}`, 'Organisation'),
      tenantId,
      partyId: organisationParty.id,
      legalName: 'NuBlox Organisation Test Limited',
      tradingName: 'NuBlox Organisation Test',
      status: 'ACTIVE'
    };
    await kernel.createOrganisation(tenantId, organisation);

    const unit: OrganisationUnit = {
      id: asId<'OrganisationUnitId'>(`UNIT-${suffix}`, 'Organisation Unit'),
      tenantId,
      organisationId: organisation.id,
      code: 'DELIVERY',
      name: 'Delivery',
      status: 'ACTIVE'
    };
    await kernel.createOrganisationUnit(tenantId, unit);

    const jobProfile: JobProfile = {
      id: asId<'JobProfileId'>(`JOB-${suffix}`, 'Job Profile'),
      catalogueScope: 'TENANT',
      tenantId,
      code: 'PM',
      name: 'Project Manager',
      status: 'ACTIVE'
    };
    await kernel.createJobProfile(jobProfile);

    const position: Position = {
      id: asId<'PositionId'>(`POS-${suffix}`, 'Position'),
      tenantId,
      organisationUnitId: unit.id,
      jobProfileId: jobProfile.id,
      code: 'PM-01',
      title: 'Project Manager',
      lifecycleStatus: 'APPROVED',
      incumbencyModel: 'SINGLE',
      authorisedFte: 1,
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await kernel.createPosition(tenantId, position);

    const occupancy: PositionOccupancy = {
      id: asId<'PositionOccupancyId'>(`OCC-${suffix}`, 'Position Occupancy'),
      tenantId,
      positionId: position.id,
      personId: person.id,
      effectiveFrom: '2026-09-01T00:00:00.000Z'
    };
    await kernel.createPositionOccupancy(tenantId, occupancy);

    const otherOrganisationParty: Party = {
      id: asId<'PartyId'>(`PARTY-OTHER-${suffix}`, 'Party'),
      tenantId: otherTenantId,
      kind: 'ORGANISATION',
      displayName: 'Other Tenant Organisation',
      status: 'ACTIVE'
    };
    await kernel.createParty(otherTenantId, otherOrganisationParty);
    const otherOrganisation: Organisation = {
      id: asId<'OrganisationId'>(`ORG-OTHER-${suffix}`, 'Organisation'),
      tenantId: otherTenantId,
      partyId: otherOrganisationParty.id,
      legalName: 'Other Tenant Organisation',
      status: 'ACTIVE'
    };
    await kernel.createOrganisation(otherTenantId, otherOrganisation);

    const projection = await reads.getStructure(
      tenantId,
      '2026-09-21T12:00:00.000Z'
    );

    expect(projection.totals).toEqual({
      organisations: 1,
      units: 1,
      positions: 1,
      occupiedPositions: 1,
      people: 2,
      unassignedPeople: 1
    });

    expect(projection.organisations).toHaveLength(1);
    expect(projection.organisations[0]?.id).toBe(organisation.id);
    expect(projection.organisations[0]?.units[0]?.id).toBe(unit.id);
    expect(projection.organisations[0]?.units[0]?.positions[0]?.id).toBe(position.id);
    expect(projection.organisations[0]?.units[0]?.positions[0]?.occupants).toEqual([
      expect.objectContaining({
        personId: person.id,
        personName: 'Assigned'
      })
    ]);

    expect(projection.people).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: person.id, hasCurrentPosition: true }),
        expect.objectContaining({ id: unassignedPerson.id, hasCurrentPosition: false })
      ])
    );

    expect(
      projection.organisations.some((item) => item.id === otherOrganisation.id)
    ).toBe(false);
  });
});
