import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let product: typeof import('./product-innovation');
let decisions: typeof import('./work-decision');
let referenceData: typeof import('./reference-data');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  product = await import('./product-innovation');
  decisions = await import('./work-decision');
  referenceData = await import('./reference-data');
  db = await import('./db');
});

afterAll(async () => {
  await db.closeDbPool();
});

describe('F05 Product, Service & Innovation Management', () => {
  it('governs need-to-retirement without duplicating Item, Decision or Work authority', async () => {
    const tenant = 'f05-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const uomId = await referenceData.createUnitOfMeasure(context, {
      unitCode: 'EA',
      symbol: 'ea',
      name: 'Each',
      dimensionKey: 'COUNT'
    });
    const currencyId = await referenceData.createCurrency(context, {
      isoCode: 'GBP',
      name: 'Pound Sterling',
      minorUnits: 2
    });

    const insightId = await product.createMarketInsight(context, {
      insightRef: 'NEED-001',
      insightType: 'CUSTOMER_NEED',
      title: 'Site teams need simpler digital handover',
      subject: 'Built environment delivery teams',
      sourceType: 'CUSTOMER_RESEARCH',
      confidence: 'HIGH',
      geography: 'United Kingdom',
      sector: 'Construction',
      problemStatement: 'Handover evidence is fragmented across disconnected tools.',
      needStatement: 'Teams need a governed reusable digital handover service.',
      desiredOutcome: 'Reduce handover preparation effort and improve traceability.',
      evidenceReference: 'research://f05/customer-need-001'
    });
    let insight = (await product.listMarketInsights(context)).find(
      (item) => item.id === insightId
    )!;
    expect(insight.status).toBe('CAPTURED');
    await product.validateMarketInsight(context, insightId, insight.aggregateVersion);
    insight = (await product.listMarketInsights(context)).find((item) => item.id === insightId)!;
    expect(insight.status).toBe('VALIDATED');

    const itemId = await product.createProductServiceConcept(context, {
      itemNumber: 'NUB-HANDOVER-SVC',
      conceptType: 'SERVICE',
      name: 'NuBlox Digital Handover',
      description: 'Governed handover service using canonical information and asset identities.',
      classificationCode: 'SERVICE.DIGITAL_HANDOVER',
      baseUomId: uomId,
      needSummary: 'Respond to validated digital handover customer need.',
      opportunitySummary: 'Reusable service across construction and asset-operating clients.',
      scoreBasis: { strategicFit: 40, customerValue: 35, feasibility: 25 }
    });

    let item = (await product.listItems(context)).find((candidate) => candidate.id === itemId)!;
    expect(item.status).toBe('DRAFT');
    expect(item.conceptStatus).toBe('CAPTURED');

    await product.assessProductServiceConcept(context, itemId, item.aggregateVersion, {
      assessmentType: 'FEASIBILITY',
      rating: 'HIGH',
      score: 86,
      summary: 'Feasible using existing controlled information and workflow foundations.',
      evidenceReference: 'assessment://f05/feasibility-001'
    });
    item = (await product.listItems(context)).find((candidate) => candidate.id === itemId)!;
    expect(item.conceptStatus).toBe('ASSESSED');

    const conceptDecisionId = await decisions.recordWorkDecision(context, {
      decisionType: 'PRODUCT_SERVICE_CONCEPT_SELECTION',
      subjectType: 'ITEM',
      subjectId: item.id,
      subjectVersion: String(item.aggregateVersion),
      outcome: 'APPROVED',
      reason: 'Concept demonstrates strong customer value, strategic fit and feasibility.'
    });
    await product.applyConceptSelectionDecision(
      context,
      item.id,
      item.aggregateVersion,
      conceptDecisionId
    );
    item = (await product.listItems(context)).find((candidate) => candidate.id === itemId)!;
    expect(item.conceptStatus).toBe('SELECTED');
    expect(item.selectedDecisionId).toBe(conceptDecisionId);

    const configId = await product.createProductConfiguration(context, {
      modelRef: 'CFG-HANDOVER-001',
      itemId,
      title: 'Digital Handover Service Definition',
      definitionScope: 'Core service configuration and delivery characteristics.',
      designSummary: 'Configurable handover service using governed information, review and issue.',
      definition: { servicePattern: 'managed-handover', channels: ['web'] },
      specification: { retention: 'governed', audit: true },
      validationCriteria: 'Validated need traceability and successful service trial are mandatory.',
      prototypeBasis: { prototype: 'tenant pilot' }
    });
    await product.addConfigurationCharacteristic(context, configId, {
      characteristicKey: 'HANDOVER_PACK_TYPE',
      name: 'Handover pack type',
      valueType: 'ENUM',
      required: true,
      allowedValues: ['PROJECT', 'ASSET', 'PORTFOLIO'],
      defaultValue: 'PROJECT'
    });
    await product.addConfigurationRule(context, configId, {
      ruleKey: 'PACK.REQUIRES.CONTROLLED.INFORMATION',
      ruleType: 'CONSTRAINT',
      expression: 'issuedInformationCount > 0',
      severity: 'ERROR'
    });
    await product.linkConfigurationRequirement(context, configId, {
      requirementType: 'MARKET_INSIGHT',
      subjectId: insight.id,
      subjectVersion: String(insight.aggregateVersion),
      traceabilityRole: 'SATISFIES',
      validationStatus: 'VALIDATED'
    });
    await product.recordConfigurationTrial(context, configId, {
      trialRef: 'TRIAL-HANDOVER-001',
      trialType: 'PILOT',
      hypothesis: 'A governed digital handover workflow reduces manual reconciliation.',
      method: 'Run a representative handover pack through the proposed service.',
      successCriteria:
        'All required issued information remains traceable with no duplicate identity.',
      outcome: 'PASS',
      resultSummary: 'Pilot completed successfully with traceable controlled information.',
      evidenceReference: 'trial://f05/handover-pilot-001'
    });

    let configuration = (await product.listProductConfigurations(context, itemId)).find(
      (candidate) => candidate.id === configId
    )!;
    const versions = await product.listProductConfigurationVersions(context, configId);
    expect(
      await product.listProductConfigurationRequirements(context, versions[0].id)
    ).toHaveLength(1);
    expect(await product.listProductConfigurationTrials(context, versions[0].id)).toHaveLength(1);
    await product.releaseProductConfiguration(context, configId, configuration.aggregateVersion);
    configuration = (await product.listProductConfigurations(context, itemId)).find(
      (candidate) => candidate.id === configId
    )!;
    expect(configuration.status).toBe('RELEASED');

    await product.configureItemLaunch(context, itemId, {
      launchPlan: 'Pilot with two delivery teams then release to the tenant catalogue.',
      channelReadiness: 'Digital delivery channel configured.',
      trainingReadiness: 'Service owners and delivery teams briefed.',
      pricingReference: 'pricing://service/digital-handover'
    });
    item = (await product.listItems(context)).find((candidate) => candidate.id === itemId)!;
    await expect(product.launchOffering(context, itemId, item.aggregateVersion)).rejects.toThrow(
      'approved Product / Service Business Case'
    );

    const businessCaseId = await product.createProductBusinessCase(context, {
      caseRef: 'PSC-001',
      caseDomain: 'PRODUCT_SERVICE',
      title: 'Digital Handover Service Investment Case',
      portfolioBucket: 'Digital Delivery Services',
      itemId,
      primaryMarketInsightId: insightId,
      objectivesNeed: 'Fund and launch a reusable governed digital handover service.',
      options: { options: ['do-nothing', 'partner', 'build'] },
      benefits: { clientValue: 'high', repeatability: 'high' },
      costFundingBasis: { buildCost: 175000, runCostAnnual: 80000 },
      risks: { adoption: 'medium', integration: 'low' },
      assumptions: { initialClients: 4 },
      commercialModel: { model: 'subscription-plus-service' },
      routeToMarket: { channels: ['direct', 'project-led'] },
      recommendation: 'Build and launch the governed service.',
      demandForecast: { year1: 4, year2: 12 },
      roi: { paybackMonths: 20 },
      marketBasis: { insightId },
      productScope: { itemId, configurationModelId: configId },
      fundingEnvelope: { amount: 255000, currency: 'GBP' },
      sourceLinks: [
        {
          linkType: 'MARKET_NEED',
          subjectType: 'MARKET_INSIGHT',
          subjectId: insight.id,
          subjectVersion: String(insight.aggregateVersion)
        }
      ]
    });
    let businessCase = (await product.listProductBusinessCases(context, 'PRODUCT_SERVICE')).find(
      (candidate) => candidate.id === businessCaseId
    )!;
    expect(businessCase.itemId).toBe(itemId);

    const decisionSubject = await product.prepareProductBusinessCaseForDecision(
      context,
      businessCaseId,
      businessCase.aggregateVersion
    );
    businessCase = (await product.listProductBusinessCases(context, 'PRODUCT_SERVICE')).find(
      (candidate) => candidate.id === businessCaseId
    )!;
    const investmentDecisionId = await decisions.recordWorkDecision(context, {
      ...decisionSubject,
      outcome: 'APPROVED',
      reason: 'Investment case demonstrates governed need, feasibility and acceptable return.'
    });
    await product.applyProductBusinessCaseDecision(
      context,
      businessCaseId,
      businessCase.aggregateVersion,
      investmentDecisionId,
      'APPROVED'
    );
    businessCase = (await product.listProductBusinessCases(context, 'PRODUCT_SERVICE')).find(
      (candidate) => candidate.id === businessCaseId
    )!;
    expect(businessCase.status).toBe('APPROVED');
    expect(businessCase.approvalDecisionId).toBe(investmentDecisionId);

    item = (await product.listItems(context)).find((candidate) => candidate.id === itemId)!;
    await product.launchOffering(context, itemId, item.aggregateVersion);
    item = (await product.listItems(context)).find((candidate) => candidate.id === itemId)!;
    expect(item.status).toBe('ACTIVE');

    await product.recordItemLifecycleReview(context, itemId, {
      reviewType: 'ADOPTION',
      summary: 'Early adoption is on plan with positive delivery-team feedback.',
      metrics: { activeTeams: 2, satisfaction: 4.5 },
      recommendation: 'Continue rollout and manage enhancements through configuration successors.',
      configurationModelId: configId
    });
    item = (await product.listItems(context)).find((candidate) => candidate.id === itemId)!;

    const innovationCaseId = await product.createProductBusinessCase(context, {
      caseRef: 'INNOV-001',
      caseDomain: 'INNOVATION',
      title: 'Automated handover validation experiment',
      portfolioBucket: 'Digital Innovation',
      itemId,
      primaryMarketInsightId: insightId,
      innovationStage: 'INCUBATION',
      objectivesNeed: 'Test automated completeness validation before expanding the service.',
      options: { experiment: 'rules-assisted-validation' },
      benefits: { quality: 'higher', cycleTime: 'lower' },
      costFundingBasis: { experimentCost: 15000 },
      risks: { falsePositive: 'medium' },
      assumptions: { samplePacks: 10 },
      recommendation: 'Run a controlled experiment.',
      demandForecast: {},
      roi: {},
      marketBasis: { insightId },
      productScope: { itemId },
      fundingEnvelope: { amount: 15000, currency: 'GBP' }
    });
    const innovationVersions = await product.listProductBusinessCaseVersions(
      context,
      innovationCaseId
    );
    const experimentId = await product.createInnovationExperiment(context, {
      businessCaseVersionId: innovationVersions[0].id,
      experimentRef: 'EXP-001',
      title: 'Automated completeness validation',
      hypothesis: 'Rule-assisted validation identifies missing handover evidence before issue.',
      method: 'Run ten representative packs through controlled validation rules.',
      successCriteria:
        'At least 90% of seeded omissions are detected with acceptable false positives.'
    });
    await product.startInnovationExperiment(context, experimentId);
    await product.completeInnovationExperiment(context, experimentId, {
      outcome: 'VALIDATED',
      resultSummary: 'Seeded omissions were detected above the acceptance threshold.',
      evidenceReference: 'experiment://f05/exp-001'
    });
    await product.recordInnovationFunding(context, {
      businessCaseVersionId: innovationVersions[0].id,
      fundingType: 'EXPERIMENT',
      amount: 15000,
      currencyId,
      basis: 'Controlled innovation funding envelope approved for experimentation.',
      status: 'ALLOCATED'
    });
    const experiments = await product.listInnovationExperiments(context, innovationCaseId);
    expect(experiments[0]).toMatchObject({
      id: experimentId,
      status: 'COMPLETED',
      outcome: 'VALIDATED'
    });

    await product.beginItemRetirement(context, itemId, item.aggregateVersion, {
      rationale: 'Successor service will replace the current offering.'
    });
    item = (await product.listItems(context)).find((candidate) => candidate.id === itemId)!;
    expect(item.status).toBe('OBSOLETE');
    await expect(
      product.completeItemRetirement(context, itemId, item.aggregateVersion)
    ).rejects.toThrow('stakeholder notice');

    await product.beginItemRetirement(context, itemId, item.aggregateVersion, {
      rationale: 'Successor service will replace the current offering.',
      stakeholderNoticeReference: 'notice://f05/retirement-001',
      customerMigrationPlan:
        'Migrate active customers to the successor service before support end.',
      supportEndAt: '2027-12-31T17:00:00Z',
      archiveReference: 'archive://f05/digital-handover-v1'
    });
    await product.completeItemRetirement(context, itemId, item.aggregateVersion);
    item = (await product.listItems(context)).find((candidate) => candidate.id === itemId)!;
    expect(item.status).toBe('RETIRED');

    const decisionCount = await db.queryOne<any>(
      "SELECT COUNT(*) AS count FROM work_decisions WHERE tenant_id=? AND decision_type IN ('PRODUCT_SERVICE_CONCEPT_SELECTION','PRODUCT_SERVICE_BUSINESS_CASE_APPROVAL')",
      [context.tenantId]
    );
    expect(Number(decisionCount?.count)).toBe(2);
  });
});
