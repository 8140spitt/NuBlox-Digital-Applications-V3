import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let organisationService: typeof import('./foundation-organisation');
let personService: typeof import('./foundation-person');
let workContextService: typeof import('./work-context');
let leaseService: typeof import('./edit-lease');
let originationService: typeof import('./party-origination');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  organisationService = await import('./foundation-organisation');
  personService = await import('./foundation-person');
  workContextService = await import('./work-context');
  leaseService = await import('./edit-lease');
  originationService = await import('./party-origination');
  db = await import('./db');
});

afterAll(async () => {
  await db.closeDbPool();
});

describe('work context, draft, edit lease and Party origination runtime', () => {
  it('protects a shared Organisation edit while preserving personal working state', async () => {
    const tenant = 'work-context-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const first = await contextService.resolveDevelopmentCommandContext(tenant);

    const organisationId = await organisationService.createOrganisation(
      first,
      {
        legalName: 'Northstar Client Limited',
        tradingName: 'Northstar',
        registrationNumber: 'SC-LEASE-001',
        countryCode: 'GB'
      },
      {
        originFunctionId: 'F07',
        originObjectType: 'CLIENT_ONBOARDING',
        originObjectId: 'CLIENT-001',
        originReference: 'F07 client onboarding test',
        stewardFunctionId: 'F07'
      }
    );

    const origination = await originationService.getPartyOrigination(first, organisationId);
    expect(origination).toMatchObject({
      originFunctionId: 'F07',
      originObjectType: 'CLIENT_ONBOARDING',
      originObjectId: 'CLIENT-001',
      stewardFunctionId: 'F07'
    });

    const workContext = await workContextService.openWorkContext(first, {
      contextKey: 'ORGANISATION:' + organisationId,
      contextType: 'OBJECT',
      objectType: 'ORGANISATION',
      objectId: organisationId,
      objectVersion: 1,
      title: 'Northstar',
      subtitle: 'Canonical Organisation identity',
      routePath:
        '/' +
        tenant +
        '/app/admin/master-data/organisations?organisation=' +
        encodeURIComponent(organisationId),
      workspaceFunctionId: 'F07'
    });

    await workContextService.saveWorkDraft(first, {
      workContextId: workContext.id,
      formKey: 'organisation-stewardship',
      baseVersion: 1,
      payload: {
        legalName: 'Northstar Client Limited',
        tradingName: 'Northstar Construction',
        countryCode: 'GB'
      }
    });
    await workContextService.saveWorkDraft(first, {
      workContextId: workContext.id,
      formKey: 'organisation-stewardship',
      baseVersion: 1,
      payload: {
        legalName: 'Northstar Client Limited',
        tradingName: 'Northstar Construction Group',
        countryCode: 'GB'
      }
    });

    const draft = await workContextService.getWorkDraft(
      first,
      workContext.id,
      'organisation-stewardship'
    );
    expect(draft).toMatchObject({
      status: 'ACTIVE',
      baseVersion: '1',
      draftVersion: 2
    });
    expect(draft?.payload.tradingName).toBe('Northstar Construction Group');

    const firstLease = await leaseService.acquireEditLease(first, {
      objectType: 'ORGANISATION',
      objectId: organisationId,
      workContextId: workContext.id,
      baseVersion: 1
    });
    expect(firstLease.acquired).toBe(true);
    if (!firstLease.acquired) throw new Error('First editor failed to acquire lease.');

    const secondPartyId = await personService.createPerson(first, {
      givenName: 'Second',
      familyName: 'Editor'
    });
    const secondIdentityId = randomUUID();
    const timestamp = new Date().toISOString();
    await db.executeMutation(
      `INSERT INTO user_identities
        (id,tenant_id,party_id,provider,provider_subject,display_name,status,created_at,updated_at)
       VALUES (?,?,?,?,?,?,'ACTIVE',?,?)`,
      [
        secondIdentityId,
        first.tenantId,
        secondPartyId,
        'TEST',
        'second-editor-' + secondIdentityId,
        'Second Editor',
        timestamp,
        timestamp
      ]
    );

    const second: typeof first = {
      ...first,
      userIdentityId: secondIdentityId,
      actorPartyId: secondPartyId,
      actorDisplayName: 'Second Editor',
      correlationId: randomUUID()
    };

    expect(await workContextService.listOpenWorkContexts(second)).toEqual([]);

    const blocked = await leaseService.acquireEditLease(second, {
      objectType: 'ORGANISATION',
      objectId: organisationId,
      baseVersion: 1
    });
    expect(blocked.acquired).toBe(false);
    if (blocked.acquired) throw new Error('Second editor unexpectedly acquired lease.');
    expect(blocked.lease.holderDisplayName).toBe(first.actorDisplayName);

    await expect(
      organisationService.updateOrganisation(
        first,
        organisationId,
        {
          legalName: 'Northstar Client Limited',
          tradingName: 'Invalid token change',
          registrationNumber: 'SC-LEASE-001',
          countryCode: 'GB'
        },
        1,
        randomUUID()
      )
    ).rejects.toThrow('edit');

    await leaseService.heartbeatEditLease(
      first,
      'ORGANISATION',
      organisationId,
      firstLease.lease.leaseToken
    );

    await organisationService.updateOrganisation(
      first,
      organisationId,
      {
        legalName: 'Northstar Client Limited',
        tradingName: 'Northstar Construction Group',
        registrationNumber: 'SC-LEASE-001',
        countryCode: 'GB'
      },
      1,
      firstLease.lease.leaseToken
    );

    await workContextService.markWorkDraftApplied(
      first,
      workContext.id,
      'organisation-stewardship'
    );
    await leaseService.releaseEditLease(
      first,
      'ORGANISATION',
      organisationId,
      firstLease.lease.leaseToken,
      'Test editor committed Organisation stewardship.'
    );

    const updated = (await organisationService.listOrganisations(first)).find(
      (item) => item.id === organisationId
    );
    expect(updated).toMatchObject({
      version: 2,
      tradingName: 'Northstar Construction Group'
    });

    const appliedDraft = await workContextService.getWorkDraft(
      first,
      workContext.id,
      'organisation-stewardship'
    );
    expect(appliedDraft?.status).toBe('APPLIED');

    const secondLease = await leaseService.acquireEditLease(second, {
      objectType: 'ORGANISATION',
      objectId: organisationId,
      baseVersion: 2
    });
    expect(secondLease.acquired).toBe(true);
    if (secondLease.acquired) {
      await leaseService.releaseEditLease(
        second,
        'ORGANISATION',
        organisationId,
        secondLease.lease.leaseToken
      );
    }

    await workContextService.closeWorkContext(first, workContext.id);
    expect(await workContextService.listOpenWorkContexts(first)).toEqual([]);
  });
});
