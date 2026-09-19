import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let development: typeof import('./corporate-development');
let dueDiligence: typeof import('./due-diligence');
let transformation: typeof import('./transformation-initiative');
let decision: typeof import('./work-decision');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  development = await import('./corporate-development');
  dueDiligence = await import('./due-diligence');
  transformation = await import('./transformation-initiative');
  decision = await import('./work-decision');
  db = await import('./db');
});

afterAll(async () => {
  await db.closeDbPool();
});

describe('F04 Corporate Development & M&A runtime', () => {
  it('preserves canonical deal boundaries from opportunity through integration', async () => {
    const tenant = 'corporate-development-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const opportunityId = await development.createDevelopmentOpportunity(context, {
      opportunityRef: 'CD-OPP-001',
      opportunityType: 'ACQUISITION',
      title: 'Acquire regional specialist contractor',
      developmentThesis:
        'Add specialist capability, improve regional density and create cross-selling opportunities.',
      sourceType: 'STRATEGIC_PIPELINE',
      sourceReference: 'strategy://growth-theme/regional-specialism',
      sponsorPartyId: context.actorPartyId,
      scopeDescription: 'UK specialist contractor acquisition opportunity.'
    });

    let opportunity = (await development.listDevelopmentOpportunities(context)).find(
      (row) => row.id === opportunityId
    )!;
    expect(opportunity.status).toBe('IDENTIFIED');

    await development.assessDevelopmentOpportunity(
      context,
      opportunityId,
      opportunity.aggregateVersion,
      {
        assessmentType: 'SCREENING',
        recommendation: 'PROCEED',
        assessmentSummary:
          'Passes size, geography, sector, capability and initial risk screening criteria.'
      }
    );
    opportunity = (await development.listDevelopmentOpportunities(context)).find(
      (row) => row.id === opportunityId
    )!;
    await development.assessDevelopmentOpportunity(
      context,
      opportunityId,
      opportunity.aggregateVersion,
      {
        assessmentType: 'STRATEGIC_FIT',
        strategicFitRating: 'HIGH',
        recommendation: 'PROCEED',
        assessmentSummary:
          'Strong alignment with capability strategy and target operating-model direction.'
      }
    );
    opportunity = (await development.listDevelopmentOpportunities(context)).find(
      (row) => row.id === opportunityId
    )!;
    expect(opportunity.status).toBe('EVALUATING');
    expect(await development.listDevelopmentOpportunityAssessments(context, opportunityId)).toHaveLength(
      2
    );

    const appraisalId = await development.createDevelopmentAppraisal(context, {
      opportunityId,
      appraisalRef: 'CD-VAL-001',
      scenarioName: 'Base case',
      asOfAt: '2026-09-19T12:00:00Z',
      sourceBasis: {
        managementAccounts: 'evidence://target/fy26-management-accounts',
        forecast: 'evidence://target/fy27-forecast'
      },
      assumptions: {
        purchasePrice: 28000000,
        debtFreeCashFree: true,
        discountRatePercent: 11
      },
      synergyAssumptions: {
        annualRunRate: 3200000,
        realisationYears: 3
      },
      valuationMetrics: {
        enterpriseValue: 28000000,
        equityValue: 24750000,
        irrPercent: 18.4,
        paybackYears: 4.3
      },
      sensitivity: {
        downside: { irrPercent: 11.2 },
        upside: { irrPercent: 24.6 }
      }
    });
    let appraisal = (await development.listDevelopmentAppraisals(context, opportunityId)).find(
      (row) => row.id === appraisalId
    )!;
    await development.reviewDevelopmentAppraisal(context, appraisalId, appraisal.aggregateVersion);
    appraisal = (await development.listDevelopmentAppraisals(context, opportunityId)).find(
      (row) => row.id === appraisalId
    )!;
    await development.approveDevelopmentAppraisalSnapshot(
      context,
      appraisalId,
      appraisal.aggregateVersion
    );
    appraisal = (await development.listDevelopmentAppraisals(context, opportunityId)).find(
      (row) => row.id === appraisalId
    )!;
    expect(appraisal.status).toBe('APPROVED_SNAPSHOT');

    opportunity = (await development.listDevelopmentOpportunities(context)).find(
      (row) => row.id === opportunityId
    )!;
    const matterId = await dueDiligence.createDueDiligenceMatter(context, {
      matterRef: 'DD-001',
      title: 'Acquisition due diligence',
      opportunityId,
      opportunityVersion: opportunity.aggregateVersion,
      scopeSummary:
        'Financial, operational, technology, people, legal, tax and commercial/risk due diligence.',
      ownerPartyId: context.actorPartyId,
      privilegeClassification: 'PRIVILEGED',
      confidentialityClassification: 'STRICTLY_CONFIDENTIAL'
    });

    let matter = (await dueDiligence.listDueDiligenceMatters(context)).find(
      (row) => row.id === matterId
    )!;
    let workstreams = await dueDiligence.listDueDiligenceWorkstreams(context, matterId);
    expect(workstreams.map((row) => row.workstreamType).sort()).toEqual([
      'COMMERCIAL_RISK',
      'FINANCE',
      'LEGAL',
      'OPERATIONS',
      'PEOPLE',
      'TAX',
      'TECHNOLOGY'
    ]);

    for (const workstream of workstreams) {
      await dueDiligence.updateDueDiligenceWorkstream(
        context,
        matterId,
        workstream.workstreamType,
        workstream.aggregateVersion,
        {
          status: 'COMPLETE',
          riskRating: workstream.workstreamType === 'LEGAL' ? 'MEDIUM' : 'LOW',
          findingsSummary:
            'Sensitive diligence finding for ' + workstream.workstreamType + ' retained in the restricted matter.',
          conclusion: 'Diligence workstream complete with identified mitigations.',
          evidenceReference: 'evidence://due-diligence/' + workstream.workstreamType.toLowerCase()
        }
      );
    }
    matter = (await dueDiligence.listDueDiligenceMatters(context)).find(
      (row) => row.id === matterId
    )!;
    await dueDiligence.completeDueDiligenceMatter(context, matterId, matter.aggregateVersion);
    matter = (await dueDiligence.listDueDiligenceMatters(context)).find(
      (row) => row.id === matterId
    )!;
    expect(matter.status).toBe('RESOLVED');

    const sensitiveEvents = await db.queryRows<
      import('mysql2/promise').RowDataPacket & { payloadJson: string }
    >(
      "SELECT payload_json AS payloadJson FROM business_events WHERE tenant_id=? AND aggregate_id='AGG-22-LEGAL'",
      [context.tenantId]
    );
    expect(sensitiveEvents.length).toBeGreaterThan(0);
    expect(sensitiveEvents.map((row) => String(row.payloadJson)).join('\n')).not.toContain(
      'Sensitive diligence finding'
    );

    const businessCaseId = await development.createBusinessCase(context, {
      caseRef: 'CD-BC-001',
      caseType: 'TRANSACTION',
      title: 'Regional specialist contractor acquisition',
      sponsorPartyId: context.actorPartyId,
      developmentOpportunityId: opportunityId,
      objectivesNeed: 'Acquire specialist capability and accelerate strategic regional growth.',
      options: {
        options: ['Acquire 100%', 'Acquire majority stake', 'Do not transact'],
        preferred: 'Acquire 100%'
      },
      benefits: {
        strategic: ['Capability adjacency', 'Regional density'],
        financial: ['Cross-selling', 'Procurement leverage']
      },
      costFundingBasis: {
        purchasePrice: 28000000,
        transactionCosts: 1500000,
        integrationFunding: 2200000
      },
      risks: {
        principal: ['Customer concentration', 'Integration execution', 'Key-person retention']
      },
      assumptions: {
        completion: '2027-Q1',
        debtFreeCashFree: true
      },
      transactionStructure: {
        structure: 'SHARE_PURCHASE',
        consideration: 'CASH_AT_COMPLETION_PLUS_DEFERRED'
      },
      negotiatedTerms: {
        exclusivity: true,
        warrantyInsurance: true
      },
      recommendation: 'Proceed to final approval and execution.',
      appraisalId,
      legalMatterId: matterId
    });

    let businessCase = (await development.listBusinessCases(context)).find(
      (row) => row.id === businessCaseId
    )!;
    await development.prepareBusinessCaseForDecision(
      context,
      businessCaseId,
      businessCase.aggregateVersion
    );
    businessCase = (await development.listBusinessCases(context)).find(
      (row) => row.id === businessCaseId
    )!;
    expect(businessCase.status).toBe('DECISION_REQUIRED');

    const decisionId = await decision.recordWorkDecision(context, {
      decisionType: 'CORPORATE_DEVELOPMENT_BUSINESS_CASE_APPROVAL',
      subjectType: 'BUSINESS_CASE',
      subjectId: businessCaseId,
      subjectVersion: String(businessCase.currentVersionNo),
      outcome: 'APPROVED',
      reason:
        'Approved following reviewed valuation, completed due diligence and negotiated transaction terms.'
    });
    await development.applyBusinessCaseDecision(
      context,
      businessCaseId,
      businessCase.aggregateVersion,
      decisionId
    );
    businessCase = (await development.listBusinessCases(context)).find(
      (row) => row.id === businessCaseId
    )!;
    expect(businessCase.status).toBe('APPROVED');
    expect(businessCase.approvalDecisionId).toBe(decisionId);

    await expect(
      development.closeBusinessCase(context, businessCaseId, businessCase.aggregateVersion)
    ).rejects.toThrow('requires at least one executed agreement reference');

    await development.recordBusinessCaseAgreement(context, businessCaseId, {
      agreementRole: 'SHARE_PURCHASE_AGREEMENT',
      subjectType: 'INFORMATION_REVISION',
      subjectId: 'spa-issued-revision-001',
      subjectVersion: '1',
      executionStatus: 'EXECUTED',
      executionReference: 'signature-platform://envelope/001',
      executedAt: '2027-01-31T16:00:00Z'
    });

    const integrationId = await transformation.createIntegrationInitiative(context, {
      initiativeRef: 'INT-001',
      title: 'Regional specialist contractor integration',
      businessCaseId,
      purposeOutcomes:
        'Integrate the acquired organisation while preserving operational continuity and strategic value.',
      sponsorPartyId: context.actorPartyId,
      ownerPartyId: context.actorPartyId,
      affectedScope: 'Organisation, systems, policy and operating interfaces.',
      benefitsSummary: 'Deliver approved business-case synergies and capability outcomes.',
      impactsSummary: 'Organisation structure, technology estate and enterprise policy alignment.',
      readinessCriteria: 'Day-one governance, access, payroll, finance and operational continuity ready.',
      adoptionCriteria: 'Target organisation, systems and policy arrangements sustained in operation.'
    });

    let integration = (await transformation.listIntegrationInitiatives(context)).find(
      (row) => row.id === integrationId
    )!;
    for (const action of ['ASSESS', 'PRIORITISE', 'APPROVE', 'MOBILISE', 'ACTIVATE'] as const) {
      await transformation.transitionIntegrationInitiative(
        context,
        integrationId,
        integration.aggregateVersion,
        action
      );
      integration = (await transformation.listIntegrationInitiatives(context)).find(
        (row) => row.id === integrationId
      )!;
    }
    expect(integration.status).toBe('ACTIVE');

    workstreams = await transformation.listIntegrationWorkstreams(context, integrationId);
    for (const workstream of workstreams) {
      await transformation.updateIntegrationWorkstream(
        context,
        integrationId,
        workstream.workstreamType,
        workstream.aggregateVersion,
        {
          status: 'COMPLETED',
          progressPercent: 100
        }
      );
    }
    integration = (await transformation.listIntegrationInitiatives(context)).find(
      (row) => row.id === integrationId
    )!;
    await transformation.transitionIntegrationInitiative(
      context,
      integrationId,
      integration.aggregateVersion,
      'COMPLETE'
    );
    integration = (await transformation.listIntegrationInitiatives(context)).find(
      (row) => row.id === integrationId
    )!;
    expect(integration.status).toBe('COMPLETED');

    businessCase = (await development.listBusinessCases(context)).find(
      (row) => row.id === businessCaseId
    )!;
    await development.closeBusinessCase(context, businessCaseId, businessCase.aggregateVersion);
    businessCase = (await development.listBusinessCases(context)).find(
      (row) => row.id === businessCaseId
    )!;
    expect(businessCase.status).toBe('CLOSED');
    expect(await development.listBusinessCaseAgreements(context, businessCaseId)).toHaveLength(1);

    const divestitureId = await development.createBusinessCase(context, {
      caseRef: 'CD-DIV-001',
      caseType: 'DIVESTITURE',
      title: 'Non-core operation disposal',
      objectivesNeed: 'Separate and dispose of a non-core operating activity.',
      options: { preferred: 'Controlled carve-out and sale' },
      benefits: { strategic: ['Sharper portfolio focus'] },
      costFundingBasis: { separationBudget: 750000 },
      risks: { principal: ['TSA dependency', 'Data separation'] },
      assumptions: { targetCompletion: '2027-Q4' },
      transactionStructure: { perimeter: 'Defined operating business and associated assets' },
      negotiatedTerms: {},
      recommendation: 'Develop carve-out business case.',
      sponsorPartyId: context.actorPartyId
    });
    const partnershipId = await development.createBusinessCase(context, {
      caseRef: 'CD-PART-001',
      caseType: 'STRATEGIC_PARTNERSHIP',
      title: 'Digital delivery strategic alliance',
      objectivesNeed: 'Establish a governed alliance for digital delivery capability.',
      options: { preferred: 'Non-equity strategic alliance' },
      benefits: { strategic: ['Capability access', 'Joint market proposition'] },
      costFundingBasis: { annualCommitment: 500000 },
      risks: { principal: ['IP boundary', 'Exclusivity'] },
      assumptions: { initialTermYears: 3 },
      transactionStructure: { structure: 'STRATEGIC_ALLIANCE' },
      negotiatedTerms: { governance: 'JOINT_STEERING_BODY' },
      recommendation: 'Proceed to alliance negotiation.',
      sponsorPartyId: context.actorPartyId
    });

    expect((await development.listBusinessCases(context, 'DIVESTITURE')).map((row) => row.id)).toContain(
      divestitureId
    );
    expect(
      (await development.listBusinessCases(context, 'STRATEGIC_PARTNERSHIP')).map((row) => row.id)
    ).toContain(partnershipId);
  });
});
