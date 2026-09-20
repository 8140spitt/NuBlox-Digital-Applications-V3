import { describe, expect, it } from 'vitest';
import {
  KernelInvariantError,
  agreeCommercialFinalAccount,
  approveCommercialForecast,
  approveCostPlanVersion,
  asId,
  certifyCommercialValuation,
  closeCommercialFinalAccount,
  closeCommercialVariation,
  createCommercialFinalAccount,
  createCommercialForecast,
  createCommercialForecastLine,
  createCommercialValuation,
  createCommercialValuationLine,
  createCommercialVariation,
  createCommercialVariationDecision,
  createCommercialVariationLine,
  createCommercialVariationVersion,
  createCostPlan,
  createCostPlanLine,
  createCostPlanVersion,
  createProjectCostCode,
  issueCommercialVariationVersion,
  submitCommercialValuation,
  supersedeCostPlanVersion,
  type CanonicalObjectIdentity,
  type CommercialVariation,
  type Decision
} from './index.js';

const tenantId = asId<'TenantId'>('TENANT-COMMERCIAL', 'Tenant');

const project: CanonicalObjectIdentity = {
  id: asId<'CanonicalObjectId'>('PROJECT-COMMERCIAL', 'Canonical Object'),
  tenantId,
  objectType: 'PROJECT',
  stableKey: 'PROJECT-001',
  createdAt: '2026-09-20T09:00:00.000Z'
};

const costPlanObject: CanonicalObjectIdentity = {
  id: asId<'CanonicalObjectId'>('OBJECT-COST-PLAN', 'Canonical Object'),
  tenantId,
  objectType: 'COST_PLAN',
  stableKey: 'CP-001',
  createdAt: '2026-09-20T09:01:00.000Z'
};

const variationObject: CanonicalObjectIdentity = {
  id: asId<'CanonicalObjectId'>('OBJECT-VARIATION', 'Canonical Object'),
  tenantId,
  objectType: 'COMMERCIAL_VARIATION',
  stableKey: 'V-001',
  createdAt: '2026-09-20T09:02:00.000Z'
};

const valuationObject: CanonicalObjectIdentity = {
  id: asId<'CanonicalObjectId'>('OBJECT-VALUATION', 'Canonical Object'),
  tenantId,
  objectType: 'COMMERCIAL_VALUATION',
  stableKey: 'VAL-001',
  createdAt: '2026-09-20T09:03:00.000Z'
};

const forecastObject: CanonicalObjectIdentity = {
  id: asId<'CanonicalObjectId'>('OBJECT-FORECAST', 'Canonical Object'),
  tenantId,
  objectType: 'COMMERCIAL_FORECAST',
  stableKey: 'FC-001',
  createdAt: '2026-09-20T09:04:00.000Z'
};

const finalAccountObject: CanonicalObjectIdentity = {
  id: asId<'CanonicalObjectId'>('OBJECT-FINAL-ACCOUNT', 'Canonical Object'),
  tenantId,
  objectType: 'COMMERCIAL_FINAL_ACCOUNT',
  stableKey: 'FA-001',
  createdAt: '2026-09-20T09:05:00.000Z'
};

const deciderPersonId = asId<'PersonId'>('PERSON-COMMERCIAL', 'Person');

function decision(
  id: string,
  decisionType: string,
  subjectObjectId: CanonicalObjectIdentity['id'],
  subjectVersion: string | undefined,
  outcome = 'APPROVED'
): Decision {
  return {
    id: asId<'DecisionId'>(id, 'Decision'),
    tenantId,
    decisionType,
    subjectObjectId,
    ...(subjectVersion ? { subjectVersion } : {}),
    outcome,
    reason: 'Governed commercial decision.',
    deciderPersonId,
    decidedAt: '2026-09-20T12:00:00.000Z'
  };
}

describe('construction commercial control invariants', () => {
  it('governs a versioned cost plan with decimal money and exact approval Decision', () => {
    const code = createProjectCostCode(
      {
        id: asId<'ProjectCostCodeId'>('COST-CODE-01', 'Project Cost Code'),
        tenantId,
        projectObjectId: project.id,
        code: '03.01',
        name: 'Structural steel',
        category: 'MATERIAL',
        status: 'ACTIVE'
      },
      project
    );

    const plan = createCostPlan(
      {
        id: asId<'CostPlanId'>('COST-PLAN-1', 'Cost Plan'),
        tenantId,
        canonicalObjectId: costPlanObject.id,
        projectObjectId: project.id,
        code: 'CP-001',
        title: 'Project Cost Plan',
        status: 'ACTIVE'
      },
      costPlanObject,
      project
    );

    const version = createCostPlanVersion(
      {
        id: asId<'CostPlanVersionId'>('COST-PLAN-V1', 'Cost Plan Version'),
        tenantId,
        costPlanId: plan.id,
        version: 1,
        status: 'DRAFT',
        currency: 'GBP',
        createdAt: '2026-09-20T10:00:00.000Z'
      },
      plan
    );

    expect(
      createCostPlanLine(
        {
          id: asId<'CostPlanLineId'>('COST-PLAN-L1', 'Cost Plan Line'),
          tenantId,
          costPlanVersionId: version.id,
          costCodeId: code.id,
          description: 'Structural steel allowance',
          amount: '125000.2500'
        },
        version,
        code
      ).amount
    ).toBe('125000.2500');

    expect(() =>
      createCostPlanLine(
        {
          id: asId<'CostPlanLineId'>('COST-PLAN-BAD', 'Cost Plan Line'),
          tenantId,
          costPlanVersionId: version.id,
          costCodeId: code.id,
          description: 'Invalid binary-style precision',
          amount: '1.12345'
        },
        version,
        code
      )
    ).toThrow(KernelInvariantError);

    const approved = approveCostPlanVersion(
      version,
      plan,
      decision(
        'DEC-COST-PLAN',
        'COST_PLAN_APPROVAL',
        costPlanObject.id,
        '1'
      )
    );
    expect(approved.status).toBe('APPROVED');
    expect(supersedeCostPlanVersion(approved).status).toBe('SUPERSEDED');

    expect(() =>
      createCostPlanLine(
        {
          id: asId<'CostPlanLineId'>('COST-PLAN-LATE', 'Cost Plan Line'),
          tenantId,
          costPlanVersionId: approved.id,
          costCodeId: code.id,
          description: 'Late mutation',
          amount: '1.0000'
        },
        approved,
        code
      )
    ).toThrow(KernelInvariantError);
  });

  it('keeps submitted variation value separate from the accepted commercial Decision value', () => {
    const variation: CommercialVariation = createCommercialVariation(
      {
        id: asId<'CommercialVariationId'>('VAR-1', 'Commercial Variation'),
        tenantId,
        canonicalObjectId: variationObject.id,
        projectObjectId: project.id,
        code: 'V-001',
        title: 'Client layout change',
        side: 'REVENUE',
        status: 'OPEN'
      },
      variationObject,
      project
    );

    const version = createCommercialVariationVersion(
      {
        id: asId<'CommercialVariationVersionId'>('VAR-V1', 'Commercial Variation Version'),
        tenantId,
        variationId: variation.id,
        version: 1,
        status: 'DRAFT',
        currency: 'GBP',
        submittedAmount: '10000.0000',
        createdAt: '2026-09-20T10:00:00.000Z'
      },
      variation
    );

    expect(
      createCommercialVariationLine(
        {
          id: asId<'CommercialVariationLineId'>('VAR-L1', 'Commercial Variation Line'),
          tenantId,
          variationVersionId: version.id,
          description: 'Additional design and construction work',
          amount: '10000.0000'
        },
        version
      ).amount
    ).toBe('10000.0000');

    const issued = issueCommercialVariationVersion(
      version,
      '2026-09-20T11:00:00.000Z'
    );
    const immutableDecision = decision(
      'DEC-VAR',
      'COMMERCIAL_VARIATION_DECISION',
      variationObject.id,
      '1',
      'PARTIALLY_ACCEPTED'
    );
    const variationDecision = createCommercialVariationDecision(
      {
        id: asId<'CommercialVariationDecisionId'>('VAR-DECISION-1', 'Commercial Variation Decision'),
        tenantId,
        variationVersionId: issued.id,
        decisionId: immutableDecision.id,
        outcome: 'PARTIALLY_ACCEPTED',
        decidedAmount: '9000.0000',
        decidedAt: immutableDecision.decidedAt
      },
      variation,
      issued,
      immutableDecision
    );

    expect(issued.submittedAmount).toBe('10000.0000');
    expect(variationDecision.decidedAmount).toBe('9000.0000');
    expect(closeCommercialVariation(variation, variationDecision).status).toBe('CLOSED');
  });

  it('keeps valuation application/certification separate and snapshots forecast judgment', () => {
    const application = createCommercialValuation(
      {
        id: asId<'CommercialValuationId'>('VAL-1', 'Commercial Valuation'),
        tenantId,
        canonicalObjectId: valuationObject.id,
        projectObjectId: project.id,
        kind: 'CLIENT_APPLICATION',
        status: 'DRAFT',
        currency: 'GBP',
        valuationDate: '2026-09-20T00:00:00.000Z'
      },
      valuationObject,
      project
    );

    const submitted = submitCommercialValuation(application);
    expect(submitted.status).toBe('SUBMITTED');

    const certified = certifyCommercialValuation(
      submitted,
      decision(
        'DEC-VAL',
        'COMMERCIAL_VALUATION_CERTIFICATION',
        valuationObject.id,
        undefined
      )
    );
    expect(certified.status).toBe('CERTIFIED');

    expect(
      createCommercialValuationLine(
        {
          id: asId<'CommercialValuationLineId'>('VAL-L1', 'Commercial Valuation Line'),
          tenantId,
          valuationId: application.id,
          description: 'Cumulative measured work',
          cumulativeAmount: '250000.0000'
        },
        application
      ).cumulativeAmount
    ).toBe('250000.0000');

    const forecast = createCommercialForecast(
      {
        id: asId<'CommercialForecastId'>('FC-1', 'Commercial Forecast'),
        tenantId,
        canonicalObjectId: forecastObject.id,
        projectObjectId: project.id,
        reportingCutoffAt: '2026-09-30T23:59:59.000Z',
        currency: 'GBP',
        status: 'DRAFT',
        forecastRevenue: '1500000.0000'
      },
      forecastObject,
      project
    );

    const code = createProjectCostCode(
      {
        id: asId<'ProjectCostCodeId'>('COST-CODE-FC', 'Project Cost Code'),
        tenantId,
        projectObjectId: project.id,
        code: '04',
        name: 'MEP',
        category: 'SUBCONTRACT',
        status: 'ACTIVE'
      },
      project
    );

    const line = createCommercialForecastLine(
      {
        id: asId<'CommercialForecastLineId'>('FC-L1', 'Commercial Forecast Line'),
        tenantId,
        forecastId: forecast.id,
        costCodeId: code.id,
        controlBudget: '500000.0000',
        actualCost: '200000.0000',
        remainingCommitment: '150000.0000',
        approvedChange: '25000.0000',
        pendingChangeExposure: '10000.0000',
        forecastToComplete: '275000.0000'
      },
      forecast,
      code
    );
    expect(Number(line.actualCost) + Number(line.forecastToComplete)).toBe(475000);

    const approvedForecast = approveCommercialForecast(
      forecast,
      decision(
        'DEC-FC',
        'COMMERCIAL_FORECAST_APPROVAL',
        forecastObject.id,
        undefined
      )
    );
    expect(approvedForecast.status).toBe('APPROVED');
  });

  it('requires an immutable Decision before agreeing a final account', () => {
    const finalAccount = createCommercialFinalAccount(
      {
        id: asId<'CommercialFinalAccountId'>('FA-1', 'Commercial Final Account'),
        tenantId,
        canonicalObjectId: finalAccountObject.id,
        projectObjectId: project.id,
        currency: 'GBP',
        agreedAmount: '1495000.0000',
        status: 'DRAFT'
      },
      finalAccountObject,
      project
    );

    const agreed = agreeCommercialFinalAccount(
      finalAccount,
      decision(
        'DEC-FA',
        'COMMERCIAL_FINAL_ACCOUNT_AGREEMENT',
        finalAccountObject.id,
        undefined
      )
    );
    expect(agreed.status).toBe('AGREED');
    expect(closeCommercialFinalAccount(agreed).status).toBe('CLOSED');
  });
});
