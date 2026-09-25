import { invariant } from './errors.js';
import type {
  AuthorityDefinition,
  AuthorityGrant,
  CanonicalObjectIdentity,
  CanonicalRelationship,
  Delegation,
  JobProfile,
  Organisation,
  OrganisationUnit,
  Party,
  PartyTypeAssignment,
  Person,
  Position,
  PositionOccupancy
} from './model.js';

function assertSameTenant(expected: string, actual: string, label: string) {
  invariant(expected === actual, `${label} must belong to the same tenant.`);
}

function assertDateOrder(from: string, to: string | undefined, label: string) {
  if (to) {
    invariant(
      Date.parse(to) >= Date.parse(from),
      `${label} effectiveTo must not be earlier than effectiveFrom.`
    );
  }
}

export function createPartyTypeAssignment(
  input: PartyTypeAssignment,
  party: Party
): PartyTypeAssignment {
  assertSameTenant(input.tenantId, party.tenantId, 'Party Type assignment and Party');
  invariant(input.partyId === party.id, 'Party Type assignment must reference the supplied Party.');

  if (input.partyType === 'EMPLOYEE') {
    invariant(party.kind === 'PERSON', 'EMPLOYEE Party Type requires a PERSON structural Party.');
  } else {
    invariant(
      party.kind === 'ORGANISATION',
      `${input.partyType} Party Type requires an ORGANISATION structural Party.`
    );
  }

  return Object.freeze({ ...input });
}

export function createPerson(input: Person, party: Party): Person {
  assertSameTenant(input.tenantId, party.tenantId, 'Person and Party');
  invariant(party.kind === 'PERSON', 'Person must use a structurally PERSON Party identity.');
  invariant(input.partyId === party.id, 'Person partyId must reference the supplied Party.');
  return Object.freeze({ ...input });
}

export function createOrganisation(input: Organisation, party: Party): Organisation {
  assertSameTenant(input.tenantId, party.tenantId, 'Organisation and Party');
  invariant(party.kind === 'ORGANISATION', 'Organisation must use a structurally ORGANISATION Party identity.');
  invariant(
    input.partyId === party.id,
    'Organisation partyId must reference the supplied Party.'
  );
  return Object.freeze({ ...input });
}

export function createOrganisationUnit(
  input: OrganisationUnit,
  organisation: Organisation,
  parent?: OrganisationUnit
): OrganisationUnit {
  assertSameTenant(input.tenantId, organisation.tenantId, 'Organisation Unit and Organisation');
  invariant(
    input.organisationId === organisation.id,
    'Organisation Unit must reference the supplied Organisation.'
  );

  if (parent) {
    assertSameTenant(input.tenantId, parent.tenantId, 'Organisation Unit and parent');
    invariant(parent.id === input.parentUnitId, 'parentUnitId must reference the supplied parent.');
    invariant(
      parent.organisationId === organisation.id,
      'Parent Organisation Unit must belong to the same Organisation.'
    );
  } else {
    invariant(!input.parentUnitId, 'A root Organisation Unit must not specify parentUnitId.');
  }

  return Object.freeze({ ...input });
}

export function createPosition(
  input: Position,
  unit: OrganisationUnit,
  jobProfile?: JobProfile
): Position {
  assertSameTenant(input.tenantId, unit.tenantId, 'Position and Organisation Unit');
  invariant(
    input.organisationUnitId === unit.id,
    'Position must reference the supplied Organisation Unit.'
  );

  if (jobProfile) {
    invariant(input.jobProfileId === jobProfile.id, 'Position must reference the supplied Job Profile.');

    if (jobProfile.catalogueScope === 'TENANT') {
      invariant(!!jobProfile.tenantId, 'Tenant Job Profile must specify tenantId.');
      assertSameTenant(input.tenantId, jobProfile.tenantId, 'Position and tenant Job Profile');
    }
  } else {
    invariant(!input.jobProfileId, 'Position cannot reference a Job Profile that was not supplied.');
  }

  return Object.freeze({ ...input });
}

export function createPositionOccupancy(
  input: PositionOccupancy,
  position: Position,
  person: Person
): PositionOccupancy {
  assertSameTenant(input.tenantId, position.tenantId, 'Position Occupancy and Position');
  assertSameTenant(input.tenantId, person.tenantId, 'Position Occupancy and Person');
  invariant(input.positionId === position.id, 'Position Occupancy must reference the supplied Position.');
  invariant(input.personId === person.id, 'Position Occupancy must reference the supplied Person.');
  assertDateOrder(input.effectiveFrom, input.effectiveTo, 'Position Occupancy');
  return Object.freeze({ ...input });
}

export function createAuthorityGrant(
  input: AuthorityGrant,
  definition: AuthorityDefinition
): AuthorityGrant {
  assertSameTenant(input.tenantId, definition.tenantId, 'Authority Grant and definition');
  invariant(
    input.authorityDefinitionId === definition.id,
    'Authority Grant must reference the supplied Authority Definition.'
  );

  if (input.limitValue !== undefined) {
    invariant(Number.isFinite(input.limitValue), 'Authority limitValue must be finite.');
    invariant(input.limitValue >= 0, 'Authority limitValue must not be negative.');
  }

  assertDateOrder(input.effectiveFrom, input.effectiveTo, 'Authority Grant');
  return Object.freeze({ ...input });
}

export function createDelegation(input: Delegation, grant: AuthorityGrant): Delegation {
  assertSameTenant(input.tenantId, grant.tenantId, 'Delegation and Authority Grant');
  invariant(input.authorityGrantId === grant.id, 'Delegation must reference the supplied Authority Grant.');
  invariant(
    input.delegatedByPersonId !== input.delegatedToPersonId,
    'Delegation must transfer authority to a different Person.'
  );
  assertDateOrder(input.effectiveFrom, input.effectiveTo, 'Delegation');
  return Object.freeze({ ...input });
}

export function createCanonicalRelationship(
  input: CanonicalRelationship,
  from: CanonicalObjectIdentity,
  to: CanonicalObjectIdentity
): CanonicalRelationship {
  assertSameTenant(input.tenantId, from.tenantId, 'Relationship and source object');
  assertSameTenant(input.tenantId, to.tenantId, 'Relationship and target object');
  invariant(input.fromObjectId === from.id, 'Relationship fromObjectId must reference the source object.');
  invariant(input.toObjectId === to.id, 'Relationship toObjectId must reference the target object.');
  invariant(from.id !== to.id, 'Canonical relationship must not relate an object to itself.');
  assertDateOrder(input.effectiveFrom, input.effectiveTo, 'Canonical Relationship');
  return Object.freeze({ ...input });
}
