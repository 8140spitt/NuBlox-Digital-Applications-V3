import { randomUUID } from 'node:crypto';
import { seedDevelopmentTenant } from './development-seed';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let contextService: typeof import('./platform-context');
let organisationService: typeof import('./foundation-organisation');
let personService: typeof import('./foundation-person');
let legalEntityService: typeof import('./foundation-legal-entity');
let tenantAuthority: typeof import('./tenant-authority');
let outboxService: typeof import('./platform-outbox');
let dbModule: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  organisationService = await import('./foundation-organisation');
  personService = await import('./foundation-person');
  legalEntityService = await import('./foundation-legal-entity');
  tenantAuthority = await import('./tenant-authority');
  outboxService = await import('./platform-outbox');
  dbModule = await import('./db');
});

afterAll(async () => {
  await dbModule.closeDbPool();
});

describe('platform foundation runtime on MySQL', () => {
  it('resolves tenant membership and permissions before organisation commands', async () => {
    const tenant = 'foundation-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);
    expect(context.tenantSlug).toBe(tenant);
    expect(context.roleKeys).toContain('tenant-admin');
    expect(context.permissions).toContain('party.create');
    expect(context.permissions).toContain('party.activate');

    const id = await organisationService.createOrganisation(context, {
      legalName: 'Northstar Construction Limited',
      tradingName: 'Northstar Construction',
      registrationNumber: 'NC-' + randomUUID().slice(0, 8),
      countryCode: 'GB'
    });

    let organisation = await organisationService.getOrganisation(context, id);
    expect(organisation.status).toBe('PROPOSED');
    expect(organisation.version).toBe(1);

    await organisationService.activateOrganisation(context, id, organisation.version);
    organisation = await organisationService.getOrganisation(context, id);
    expect(organisation.status).toBe('ACTIVE');
    expect(organisation.version).toBe(2);

    await organisationService.updateOrganisation(
      context,
      id,
      {
        legalName: 'Northstar Construction Limited',
        tradingName: 'Northstar Built Environment',
        registrationNumber: organisation.registrationNumber ?? undefined,
        countryCode: 'GB'
      },
      organisation.version
    );

    organisation = await organisationService.getOrganisation(context, id);
    expect(organisation.displayName).toBe('Northstar Built Environment');
    expect(organisation.version).toBe(3);

    await expect(
      organisationService.updateOrganisation(context, id, { legalName: 'Stale update' }, 2)
    ).rejects.toThrow('changed after you opened it');

    const audit = await organisationService.listOrganisationAudit(context, id);
    expect(audit.map((event) => event.action)).toEqual(
      expect.arrayContaining([
        'ORGANISATION_CREATED',
        'ORGANISATION_ACTIVATED',
        'ORGANISATION_CHANGED'
      ])
    );

    const events = await dbModule.queryRows<any>(
      'SELECT event_type AS eventType, aggregate_id AS aggregateId FROM business_events WHERE tenant_id = ? AND aggregate_object_id = ? ORDER BY occurred_at',
      [context.tenantId, id]
    );
    expect(events).toHaveLength(3);
    expect(events.every((event) => event.aggregateId === 'AGG-01-PARTY')).toBe(true);

    const outbox = await dbModule.queryRows<any>(
      'SELECT status, topic FROM outbox_messages WHERE tenant_id = ? AND business_event_id IN (SELECT id FROM business_events WHERE aggregate_object_id = ?)',
      [context.tenantId, id]
    );
    expect(outbox).toHaveLength(3);
    expect(outbox.every((row) => row.status === 'PENDING')).toBe(true);
  });

  it('keeps tenant data isolated and denies missing permissions', async () => {
    const suffix = randomUUID().slice(0, 8);
    const firstTenant = 'tenant-a-' + suffix;
    const secondTenant = 'tenant-b-' + suffix;
    await seedDevelopmentTenant(firstTenant);
    await seedDevelopmentTenant(secondTenant);
    const first = await contextService.resolveDevelopmentCommandContext(firstTenant);
    const second = await contextService.resolveDevelopmentCommandContext(secondTenant);

    const id = await organisationService.createOrganisation(first, {
      legalName: 'Tenant A Organisation'
    });
    const secondRows = await organisationService.listOrganisations(second);
    expect(secondRows.find((row) => row.id === id)).toBeUndefined();

    const restricted = {
      ...first,
      permissions: first.permissions.filter((permission) => permission !== 'party.create')
    };
    await expect(
      organisationService.createOrganisation(restricted, { legalName: 'Denied' })
    ).rejects.toThrow('Permission denied: party.create');
  });

  it('persists Person and Legal Entity as Party specialisations without duplicate masters', async () => {
    const tenant = 'party-specialisations-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const personId = await personService.createPerson(context, {
      givenName: 'Ada',
      familyName: 'Lovelace',
      preferredName: 'Ada'
    });
    let person = await personService.getPerson(context, personId);
    expect(person.displayName).toBe('Ada');
    expect(person.version).toBe(1);

    await personService.updatePerson(
      context,
      personId,
      {
        givenName: 'Ada',
        familyName: 'Lovelace',
        preferredName: 'Ada Lovelace'
      },
      person.version
    );
    person = await personService.getPerson(context, personId);
    expect(person.version).toBe(2);
    expect(
      (await personService.listPersonAudit(context, personId)).map((event) => event.action)
    ).toEqual(expect.arrayContaining(['PERSON_CREATED', 'PERSON_CHANGED']));

    const organisationId = await organisationService.createOrganisation(context, {
      legalName: 'NuBlox Construction Limited',
      registrationNumber: 'LE-' + randomUUID().slice(0, 8),
      countryCode: 'GB'
    });
    const organisation = await organisationService.getOrganisation(context, organisationId);
    await legalEntityService.designateLegalEntity(
      context,
      organisationId,
      {
        legalEntityType: 'LIMITED_COMPANY',
        jurisdictionCode: 'GB',
        statutoryIdentifier: 'SC-' + randomUUID().slice(0, 8),
        accountingCurrency: 'GBP'
      },
      organisation.version
    );

    const legalEntity = await legalEntityService.getLegalEntity(context, organisationId);
    expect(legalEntity.id).toBe(organisationId);
    expect(legalEntity.version).toBe(organisation.version + 1);
    expect(legalEntity.jurisdictionCode).toBe('GB');

    const partyRows = await dbModule.queryRows<any>(
      'SELECT id, party_type AS partyType FROM parties WHERE tenant_id = ? AND id IN (?, ?)',
      [context.tenantId, personId, organisationId]
    );
    expect(partyRows).toHaveLength(2);
    expect(partyRows.find((row) => row.id === organisationId)?.partyType).toBe('ORGANISATION');
  });

  it('governs tenant membership and role assignment through AGG-01-TENANT commands', async () => {
    const tenant = 'authority-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);
    const personId = await personService.createPerson(context, {
      givenName: 'Grace',
      familyName: 'Hopper'
    });

    const membershipId = await tenantAuthority.grantTenantMembership(context, personId);
    expect(
      (await tenantAuthority.listTenantMemberships(context)).some(
        (item) => item.id === membershipId
      )
    ).toBe(true);

    const roleId = await tenantAuthority.createTenantRole(
      context,
      'party-steward',
      'Party Steward',
      ['party.read', 'party.create', 'party.change']
    );
    const assignmentId = await tenantAuthority.assignTenantRole(context, personId, roleId);
    expect(assignmentId).toBeTruthy();
    expect(
      (await tenantAuthority.listTenantRoles(context)).find((role) => role.id === roleId)
        ?.permissions
    ).toEqual(['party.change', 'party.create', 'party.read']);

    const assignmentRows = await dbModule.queryRows<any>(
      'SELECT assignment_source AS source FROM role_assignments WHERE id = ? AND tenant_id = ?',
      [assignmentId, context.tenantId]
    );
    expect(assignmentRows[0]?.source).toBe('tenant-authority-command');

    await tenantAuthority.revokeTenantMembership(context, membershipId);
    expect(
      (await tenantAuthority.listTenantMemberships(context)).find(
        (item) => item.id === membershipId
      )?.status
    ).toBe('INACTIVE');

    const endedAssignments = await dbModule.queryRows<any>(
      'SELECT status, valid_to AS validTo FROM role_assignments WHERE id = ? AND tenant_id = ?',
      [assignmentId, context.tenantId]
    );
    expect(endedAssignments[0]?.status).toBe('INACTIVE');
    expect(endedAssignments[0]?.validTo).toBeTruthy();

    const tenantEvents = await dbModule.queryRows<any>(
      "SELECT aggregate_version AS aggregateVersion FROM business_events WHERE tenant_id = ? AND aggregate_id = 'AGG-01-TENANT' ORDER BY aggregate_version",
      [context.tenantId]
    );
    expect(tenantEvents.map((row) => row.aggregateVersion)).toEqual([2, 3, 4, 5]);

    const audit = await dbModule.queryRows<any>(
      "SELECT action FROM platform_audit_events WHERE tenant_id = ? AND aggregate_id = 'AGG-01-TENANT'",
      [context.tenantId]
    );
    expect(audit.map((row) => row.action)).toEqual(
      expect.arrayContaining([
        'TENANT_MEMBERSHIP_GRANTED',
        'TENANT_ROLE_CREATED',
        'TENANT_ROLE_ASSIGNED',
        'TENANT_MEMBERSHIP_REVOKED'
      ])
    );
  });

  it('maintains the full tenant role lifecycle without allowing administrative self-lockout', async () => {
    const tenant = 'role-lifecycle-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);
    const personId = await personService.createPerson(context, {
      givenName: 'Evelyn',
      familyName: 'Steward'
    });
    await tenantAuthority.grantTenantMembership(context, personId);

    const roleId = await tenantAuthority.createTenantRole(
      context,
      'commercial-reader',
      'Commercial Reader',
      ['party.read']
    );
    const firstAssignment = await tenantAuthority.assignTenantRole(context, personId, roleId);

    await tenantAuthority.updateTenantRole(context, roleId, {
      name: 'Commercial Data Steward',
      permissions: ['party.read', 'party.change']
    });
    let role = (await tenantAuthority.listTenantRoles(context)).find((item) => item.id === roleId);
    expect(role?.name).toBe('Commercial Data Steward');
    expect(role?.permissions).toEqual(['party.change', 'party.read']);

    await tenantAuthority.deactivateTenantRole(context, roleId);
    role = (await tenantAuthority.listTenantRoles(context)).find((item) => item.id === roleId);
    expect(role?.status).toBe('INACTIVE');
    const firstAssignmentRows = await dbModule.queryRows<any>(
      'SELECT status FROM role_assignments WHERE id = ?',
      [firstAssignment]
    );
    expect(firstAssignmentRows[0]?.status).toBe('INACTIVE');

    await tenantAuthority.reactivateTenantRole(context, roleId);
    const secondAssignment = await tenantAuthority.assignTenantRole(context, personId, roleId);
    expect(secondAssignment).not.toBe(firstAssignment);
    await tenantAuthority.unassignTenantRole(context, secondAssignment);

    const adminRole = (await tenantAuthority.listTenantRoles(context)).find(
      (item) => item.roleKey === 'tenant-admin'
    );
    expect(adminRole).toBeTruthy();
    await expect(tenantAuthority.deactivateTenantRole(context, adminRole!.id)).rejects.toThrow(
      'currently assigned to themselves'
    );
    await expect(
      tenantAuthority.updateTenantRole(context, adminRole!.id, {
        name: adminRole!.name,
        permissions: adminRole!.permissions.filter(
          (permission) => permission !== 'tenant.role.manage'
        )
      })
    ).rejects.toThrow('final tenant.role.manage authority');
  });

  it('claims and publishes transactional outbox messages exactly once per worker claim', async () => {
    const tenant = 'outbox-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);
    const organisationId = await organisationService.createOrganisation(context, {
      legalName: 'Outbox Test Organisation'
    });
    const workerId = 'test-worker-' + randomUUID();
    const delivered: string[] = [];

    const result = await outboxService.publishOutboxBatch(
      workerId,
      async (message) => {
        delivered.push(message.businessEventId);
      },
      100
    );

    expect(result.claimed).toBeGreaterThan(0);
    expect(result.published).toBe(result.claimed);
    expect(result.failed).toBe(0);
    expect(new Set(delivered).size).toBe(delivered.length);

    const rows = await dbModule.queryRows<any>(
      'SELECT status, attempts, published_at AS publishedAt, locked_by AS lockedBy FROM outbox_messages WHERE tenant_id = ? AND business_event_id IN (SELECT id FROM business_events WHERE aggregate_object_id = ?)',
      [context.tenantId, organisationId]
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(
      rows.every(
        (row) =>
          row.status === 'PUBLISHED' &&
          row.attempts === 1 &&
          row.publishedAt &&
          row.lockedBy === null
      )
    ).toBe(true);
  });
});
