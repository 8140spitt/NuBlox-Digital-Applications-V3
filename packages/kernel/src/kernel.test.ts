import { describe, expect, it } from 'vitest';
import {
  KernelInvariantError,
  asId,
  createAuthorityGrant,
  createCanonicalRelationship,
  createOrganisation,
  createPosition,
  createPositionOccupancy,
  createPerson,
  type AuthorityDefinition,
  type AuthorityGrant,
  type CanonicalObjectIdentity,
  type CanonicalRelationship,
  type JobProfile,
  type OrganisationUnit,
  type Party,
  type Person,
  type Position
} from './index.js';

const tenantId = asId<'TenantId'>('TENANT-1', 'Tenant');
const otherTenantId = asId<'TenantId'>('TENANT-2', 'Tenant');

describe('enterprise kernel identity invariants', () => {
  it('requires Person to specialise a PERSON Party in the same tenant', () => {
    const party: Party = {
      id: asId<'PartyId'>('PARTY-1', 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'A Person',
      status: 'ACTIVE'
    };

    const person: Person = {
      id: asId<'PersonId'>('PERSON-1', 'Person'),
      tenantId,
      partyId: party.id,
      legalName: 'A Person',
      status: 'ACTIVE'
    };

    expect(createPerson(person, party)).toEqual(person);

    expect(() =>
      createPerson(
        person,
        { ...party, tenantId: otherTenantId }
      )
    ).toThrow(KernelInvariantError);
  });

  it('keeps Organisation separate from Party while enforcing the specialisation link', () => {
    const party: Party = {
      id: asId<'PartyId'>('PARTY-ORG', 'Party'),
      tenantId,
      kind: 'ORGANISATION',
      displayName: 'NuBlox Ltd',
      status: 'ACTIVE'
    };

    const organisation = {
      id: asId<'OrganisationId'>('ORG-1', 'Organisation'),
      tenantId,
      partyId: party.id,
      legalName: 'NuBlox Ltd',
      status: 'ACTIVE'
    } as const;

    expect(createOrganisation(organisation, party).partyId).toBe(party.id);
  });

  it('keeps Position and Job Profile separate concepts', () => {
    const unit: OrganisationUnit = {
      id: asId<'OrganisationUnitId'>('UNIT-1', 'Organisation Unit'),
      tenantId,
      organisationId: asId<'OrganisationId'>('ORG-1', 'Organisation'),
      code: 'DESIGN',
      name: 'Design',
      status: 'ACTIVE'
    };

    const profile: JobProfile = {
      id: asId<'JobProfileId'>('JOB-ARCH', 'Job Profile'),
      catalogueScope: 'PLATFORM',
      code: 'ARCH',
      name: 'Architect',
      status: 'ACTIVE'
    };

    const position: Position = {
      id: asId<'PositionId'>('POS-1', 'Position'),
      tenantId,
      organisationUnitId: unit.id,
      jobProfileId: profile.id,
      code: 'ARCH-LEAD',
      title: 'Lead Architect',
      lifecycleStatus: 'APPROVED',
      incumbencyModel: 'SINGLE',
      authorisedFte: 1,
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      status: 'ACTIVE'
    };

    expect(createPosition(position, unit, profile)).toEqual(position);
  });

  it('prevents a Person from occupying a Position in another tenant', () => {
    const position: Position = {
      id: asId<'PositionId'>('POS-1', 'Position'),
      tenantId,
      organisationUnitId: asId<'OrganisationUnitId'>('UNIT-1', 'Organisation Unit'),
      code: 'PM-1',
      title: 'Project Manager',
      lifecycleStatus: 'APPROVED',
      incumbencyModel: 'SINGLE',
      authorisedFte: 1,
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      status: 'ACTIVE'
    };

    const person: Person = {
      id: asId<'PersonId'>('PERSON-1', 'Person'),
      tenantId: otherTenantId,
      partyId: asId<'PartyId'>('PARTY-1', 'Party'),
      legalName: 'Person',
      status: 'ACTIVE'
    };

    expect(() =>
      createPositionOccupancy(
        {
          id: asId<'PositionOccupancyId'>('OCC-1', 'Position Occupancy'),
          tenantId,
          positionId: position.id,
          personId: person.id,
          effectiveFrom: '2026-09-20'
        },
        position,
        person
      )
    ).toThrow(KernelInvariantError);
  });

  it('keeps authority as an explicit scoped grant rather than a permission', () => {
    const definition: AuthorityDefinition = {
      id: asId<'AuthorityDefinitionId'>('AUTH-DEF-1', 'Authority Definition'),
      tenantId,
      code: 'CONTRACT-SIGN',
      name: 'Contract signature authority',
      authorityType: 'CONTRACTUAL',
      unit: 'GBP',
      status: 'ACTIVE'
    };

    const grant: AuthorityGrant = {
      id: asId<'AuthorityGrantId'>('AUTH-GRANT-1', 'Authority Grant'),
      tenantId,
      authorityDefinitionId: definition.id,
      granteeType: 'POSITION',
      granteeId: 'POS-1',
      scopeType: 'ORGANISATION',
      limitValue: 250000,
      effectiveFrom: '2026-09-20',
      status: 'ACTIVE'
    };

    expect(createAuthorityGrant(grant, definition).limitValue).toBe(250000);

    expect(() =>
      createAuthorityGrant({ ...grant, limitValue: -1 }, definition)
    ).toThrow(KernelInvariantError);
  });

  it('only creates canonical relationships within one tenant', () => {
    const from: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>('OBJ-1', 'Canonical Object'),
      tenantId,
      objectType: 'ORGANISATION',
      stableKey: 'ORG-1',
      createdAt: '2026-09-20T00:00:00Z'
    };

    const to: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>('OBJ-2', 'Canonical Object'),
      tenantId,
      objectType: 'ORGANISATION_UNIT',
      stableKey: 'UNIT-1',
      createdAt: '2026-09-20T00:00:00Z'
    };

    const relationship: CanonicalRelationship = {
      id: asId<'CanonicalRelationshipId'>('REL-1', 'Canonical Relationship'),
      tenantId,
      relationshipType: 'ORGANISATION_CONTAINS_UNIT',
      fromObjectId: from.id,
      toObjectId: to.id,
      effectiveFrom: '2026-09-20',
      status: 'ACTIVE'
    };

    expect(createCanonicalRelationship(relationship, from, to)).toEqual(relationship);

    expect(() =>
      createCanonicalRelationship(
        relationship,
        from,
        { ...to, tenantId: otherTenantId }
      )
    ).toThrow(KernelInvariantError);
  });
});
