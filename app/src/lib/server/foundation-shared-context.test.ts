import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let personService: typeof import('./foundation-person');
let organisationService: typeof import('./foundation-organisation');
let legalEntityService: typeof import('./foundation-legal-entity');
let relationshipService: typeof import('./foundation-party-relationship');
let structureService: typeof import('./organisation-structure');
let authorityService: typeof import('./delegated-authority');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  personService = await import('./foundation-person');
  organisationService = await import('./foundation-organisation');
  legalEntityService = await import('./foundation-legal-entity');
  relationshipService = await import('./foundation-party-relationship');
  structureService = await import('./organisation-structure');
  authorityService = await import('./delegated-authority');
  db = await import('./db');
});

afterAll(async () => {
  await db.closeDbPool();
});

describe('shared foundation relationship, structure and authority aggregates', () => {
  it('governs Party Relationships without duplicating Party masters', async () => {
    const tenant = 'relationship-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);
    const customer = await organisationService.createOrganisation(context, { legalName: 'Customer One Limited' });
    const supplier = await organisationService.createOrganisation(context, { legalName: 'Supplier One Limited' });

    await organisationService.activateOrganisation(context, customer, 1);
    await organisationService.activateOrganisation(context, supplier, 1);

    const id = await relationshipService.createPartyRelationship(context, {
      fromPartyId: customer,
      toPartyId: supplier,
      relationshipType: 'SUPPLIER',
      contextType: 'TENANT'
    });
    let relationship = (await relationshipService.listPartyRelationships(context)).find((item) => item.id === id)!;
    expect(relationship.status).toBe('PROPOSED');
    expect(relationship.relationshipType).toBe('SUPPLIER');

    await relationshipService.activatePartyRelationship(context, id, relationship.version);
    relationship = (await relationshipService.listPartyRelationships(context)).find((item) => item.id === id)!;
    expect(relationship.status).toBe('ACTIVE');

    const parties = await db.queryRows<any>(
      'SELECT id FROM parties WHERE tenant_id = ? AND id IN (?, ?)',
      [context.tenantId, customer, supplier]
    );
    expect(parties).toHaveLength(2);

    const events = await db.queryRows<any>(
      "SELECT aggregate_id AS aggregateId FROM business_events WHERE tenant_id = ? AND aggregate_object_id = ?",
      [context.tenantId, id]
    );
    expect(events.every((event) => event.aggregateId === 'AGG-01-PARTY-RELATIONSHIP')).toBe(true);
  });

  it('maintains effective Organisation Unit hierarchy without cycles', async () => {
    const tenant = 'structure-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const legalEntityId = await organisationService.createOrganisation(context, {
      legalName: 'NuBlox Delivery Limited',
      registrationNumber: 'ORG-' + randomUUID().slice(0, 8),
      countryCode: 'GB'
    });
    await organisationService.activateOrganisation(context, legalEntityId, 1);
    const organisation = await organisationService.getOrganisation(context, legalEntityId);
    await legalEntityService.designateLegalEntity(context, legalEntityId, {
      legalEntityType: 'LIMITED_COMPANY',
      jurisdictionCode: 'GB',
      statutoryIdentifier: 'STAT-' + randomUUID().slice(0, 8),
      accountingCurrency: 'GBP'
    }, organisation.version);

    const divisionId = await structureService.createOrganisationUnit(context, {
      unitCode: 'DIV-' + randomUUID().slice(0, 6),
      name: 'Construction Division',
      unitType: 'DIVISION',
      accountableLegalEntityPartyId: legalEntityId
    });
    const teamId = await structureService.createOrganisationUnit(context, {
      unitCode: 'TEAM-' + randomUUID().slice(0, 6),
      name: 'Project Delivery Team',
      unitType: 'TEAM',
      accountableLegalEntityPartyId: legalEntityId
    });

    await structureService.activateOrganisationUnit(context, divisionId, 1);
    await structureService.activateOrganisationUnit(context, teamId, 1);
    const relationId = await structureService.assignOrganisationUnitParent(context, teamId, divisionId);
    expect(relationId).toBeTruthy();

    const team = (await structureService.listOrganisationUnits(context)).find((unit) => unit.id === teamId)!;
    expect(team.version).toBe(3);
    await expect(structureService.assignOrganisationUnitParent(context, divisionId, teamId))
      .rejects.toThrow('cycle');
  });

  it('enforces approved, effective and value-constrained Delegated Authority', async () => {
    const tenant = 'authority-grant-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);
    const delegatePartyId = await personService.createPerson(context, {
      givenName: 'Amina',
      familyName: 'Approver'
    });

    const id = await authorityService.createDelegatedAuthority(context, {
      delegatePartyId,
      authorityType: 'COMMERCIAL_COMMITMENT',
      basis: 'Board-approved delegation matrix',
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      currencyCode: 'GBP',
      valueLimit: 250000,
      allowSubdelegation: false
    });

    let grant = (await authorityService.listDelegatedAuthorities(context)).find((item) => item.id === id)!;
    expect(grant.status).toBe('DRAFT');
    await authorityService.approveDelegatedAuthority(context, id, grant.version);
    grant = (await authorityService.listDelegatedAuthorities(context)).find((item) => item.id === id)!;
    await authorityService.activateDelegatedAuthority(context, id, grant.version);
    grant = (await authorityService.listDelegatedAuthorities(context)).find((item) => item.id === id)!;
    expect(grant.status).toBe('ACTIVE');

    const withinLimit = await authorityService.findEffectiveDelegatedAuthority(context, {
      delegatePartyId,
      authorityType: 'COMMERCIAL_COMMITMENT',
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      currencyCode: 'GBP',
      value: 100000
    });
    expect(withinLimit?.id).toBe(id);

    const overLimit = await authorityService.findEffectiveDelegatedAuthority(context, {
      delegatePartyId,
      authorityType: 'COMMERCIAL_COMMITMENT',
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      currencyCode: 'GBP',
      value: 300000
    });
    expect(overLimit).toBeNull();

    await authorityService.revokeDelegatedAuthority(context, id, grant.version, 'Delegation withdrawn.');
    expect((await authorityService.listDelegatedAuthorities(context)).find((item) => item.id === id)?.status)
      .toBe('REVOKED');

    const revoked = await authorityService.findEffectiveDelegatedAuthority(context, {
      delegatePartyId,
      authorityType: 'COMMERCIAL_COMMITMENT',
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      currencyCode: 'GBP',
      value: 1000
    });
    expect(revoked).toBeNull();
  });
});
