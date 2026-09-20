import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let leadService: typeof import('./marketing-lead');
let organisationService: typeof import('./foundation-organisation');
let searchService: typeof import('./runtime-object-search');
let strategyService: typeof import('./strategy-framework');
let objectiveService: typeof import('./strategic-objective');
let informationService: typeof import('./information-container');
let decisionService: typeof import('./work-decision');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  leadService = await import('./marketing-lead');
  organisationService = await import('./foundation-organisation');
  searchService = await import('./runtime-object-search');
  strategyService = await import('./strategy-framework');
  objectiveService = await import('./strategic-objective');
  informationService = await import('./information-container');
  decisionService = await import('./work-decision');
  db = await import('./db');
});

afterAll(async () => {
  await db.closeDbPool();
});

describe('runtime object search', () => {
  it('returns canonical permission-aware object results', async () => {
    const tenant = 'object-search-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const leadId = await leadService.createLead(context, {
      leadRef: 'LEAD-SEARCH-001',
      sourceType: 'WEB',
      prospectName: 'Northstar Search Prospect',
      organisationName: 'Northstar Search Limited',
      needSummary: 'Search foundation proof record'
    });

    const partyId = await organisationService.createOrganisation(context, {
      legalName: 'Northstar Search Holdings Limited',
      tradingName: 'Northstar Holdings',
      registrationNumber: 'NS-SEARCH-001',
      countryCode: 'GB'
    });

    const frameworkId = await strategyService.createStrategyFramework(context, {
      title: 'Atlas Search Strategy',
      purpose: 'Provide a searchable enterprise strategy proof.',
      vision: 'Atlas Search vision',
      mission: 'Atlas Search mission',
      direction: 'Atlas Search direction',
      reviewCadence: 'Quarterly'
    });
    await strategyService.submitStrategyFramework(context, frameworkId);
    const frameworkDecisionId = await decisionService.recordWorkDecision(context, {
      decisionType: 'STRATEGY_FRAMEWORK_REVIEW',
      subjectType: 'STRATEGY_FRAMEWORK',
      subjectId: frameworkId,
      subjectVersion: '1',
      outcome: 'APPROVED',
      reason: 'Approved for runtime search coverage.'
    });
    await strategyService.approveStrategyFramework(context, frameworkId, frameworkDecisionId);
    await strategyService.publishStrategyFramework(context, frameworkId);

    const objectiveId = await objectiveService.createStrategicObjective(context, {
      objectiveRef: 'OBJ-ATLAS-SEARCH',
      frameworkId,
      frameworkVersionNo: 1,
      statement: 'Deliver Atlas Search enterprise outcomes',
      successCriteria: 'Atlas Search canonical objects are discoverable.',
      priority: 'HIGH'
    });

    const informationId = await informationService.createInformationContainer(context, {
      containerRef: 'INFO-ATLAS-SEARCH',
      containerType: 'STRATEGY_EVIDENCE',
      title: 'Atlas Search evidence pack',
      subjectType: 'STRATEGY_FRAMEWORK',
      subjectId: frameworkId
    });

    const results = await searchService.searchRuntimeObjects(context, 'Northstar Search');
    expect(results).toContainEqual(
      expect.objectContaining({
        objectType: 'party',
        objectId: partyId,
        objectLabel: 'Party',
        title: 'Northstar Holdings',
        subtitle: 'Organisation',
        href: '/' + tenant + '/app/objects/party/' + partyId
      })
    );
    expect(results).toContainEqual(
      expect.objectContaining({
        objectType: 'lead',
        objectId: leadId,
        objectLabel: 'Lead',
        reference: 'LEAD-SEARCH-001',
        title: 'Northstar Search Prospect',
        href: '/' + tenant + '/app/objects/lead/' + leadId
      })
    );

    const atlasResults = await searchService.searchRuntimeObjects(context, 'Atlas Search');
    expect(atlasResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          objectType: 'strategy-framework',
          objectId: frameworkId,
          href: '/' + tenant + '/app/objects/strategy-framework/' + frameworkId
        }),
        expect.objectContaining({
          objectType: 'strategic-objective',
          objectId: objectiveId,
          reference: 'OBJ-ATLAS-SEARCH',
          href: '/' + tenant + '/app/objects/strategic-objective/' + objectiveId
        }),
        expect.objectContaining({
          objectType: 'information-container',
          objectId: informationId,
          reference: 'INFO-ATLAS-SEARCH',
          href: '/' + tenant + '/app/objects/information-container/' + informationId
        })
      ])
    );

    const noMarketing = {
      ...context,
      permissions: context.permissions.filter((permission) => permission !== 'marketing.read')
    };
    expect(await searchService.searchRuntimeObjects(noMarketing, 'Northstar Search')).toEqual([
      expect.objectContaining({ objectType: 'party', objectId: partyId })
    ]);

    const noParty = {
      ...context,
      permissions: context.permissions.filter((permission) => permission !== 'party.read')
    };
    expect(await searchService.searchRuntimeObjects(noParty, 'Northstar Search')).toEqual([
      expect.objectContaining({ objectType: 'lead', objectId: leadId })
    ]);

    const noStrategyRead = {
      ...context,
      permissions: context.permissions.filter(
        (permission) =>
          permission !== 'strategy.framework.read' && permission !== 'strategy.objective.read'
      )
    };
    expect(
      (await searchService.searchRuntimeObjects(noStrategyRead, 'Atlas Search')).map(
        (result) => result.objectType
      )
    ).toEqual(['information-container']);

    const noInformationRead = {
      ...context,
      permissions: context.permissions.filter(
        (permission) => permission !== 'information.container.read'
      )
    };
    expect(
      (await searchService.searchRuntimeObjects(noInformationRead, 'Atlas Search')).map(
        (result) => result.objectType
      )
    ).toEqual(expect.arrayContaining(['strategy-framework', 'strategic-objective']));

    const restricted = {
      ...context,
      permissions: context.permissions.filter(
        (permission) => permission !== 'marketing.read' && permission !== 'party.read'
      )
    };
    expect(await searchService.searchRuntimeObjects(restricted, 'Northstar Search')).toEqual([]);
    expect(await searchService.searchRuntimeObjects(context, 'N')).toEqual([]);
  });
});
