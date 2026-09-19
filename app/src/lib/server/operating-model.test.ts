import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let strategy: typeof import('./strategy-framework');
let model: typeof import('./operating-model');
let decision: typeof import('./work-decision');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  strategy = await import('./strategy-framework');
  model = await import('./operating-model');
  decision = await import('./work-decision');
  db = await import('./db');
});
afterAll(async () => {
  await db.closeDbPool();
});

describe('F01.05 Operating Model runtime', () => {
  it('preserves versioned target capabilities/accountabilities and governed approval', async () => {
    const tenant = 'operating-model-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const frameworkId = await strategy.createStrategyFramework(context, {
      title: 'Operating Model Strategy',
      purpose: 'Guide target operating model.',
      vision: 'Integrated delivery.',
      mission: 'Deliver through clear capabilities.',
      direction: 'Standardise core services and accountabilities.',
      reviewCadence: 'Annual'
    });
    await strategy.submitStrategyFramework(context, frameworkId);
    const strategyDecision = await decision.recordWorkDecision(context, {
      decisionType: 'STRATEGY_FRAMEWORK_REVIEW',
      subjectType: 'STRATEGY_FRAMEWORK',
      subjectId: frameworkId,
      subjectVersion: '1',
      outcome: 'APPROVED',
      reason: 'Approved for operating-model design.'
    });
    await strategy.approveStrategyFramework(context, frameworkId, strategyDecision);
    await strategy.publishStrategyFramework(context, frameworkId);

    const modelId = await model.createOperatingModel(context, {
      modelRef: 'TOM-2027',
      name: '2027 Target Operating Model',
      frameworkId,
      frameworkVersionNo: 1,
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      currentStateSummary: 'Fragmented functional delivery with duplicated support activity.',
      targetStateSummary: 'Integrated operating model with common controls and shared services.',
      designPrinciples: 'Customer outcome ownership; common data; clear decision rights.',
      centralisationModel: 'Enterprise standards centralised; delivery accountability federated.',
      sharedServiceRequirements:
        'Finance operations, people services, technology service desk and data platform.',
      organisationModelReference: 'target-org-model-2027',
      changeInitiativesSummary:
        'Establish shared services, simplify governance and implement capability ownership.',
      capabilities: [
        {
          capabilityKey: 'CAP-DIGITAL-DELIVERY',
          name: 'Digital Delivery',
          description: 'Integrated information and delivery control.',
          criticality: 'CRITICAL',
          deliveryModel: 'CENTRALISED'
        },
        {
          capabilityKey: 'CAP-PROJECT-DELIVERY',
          name: 'Project Delivery',
          description: 'Client-facing project execution.',
          criticality: 'CRITICAL',
          deliveryModel: 'DECENTRALISED'
        }
      ],
      accountabilities: [
        {
          accountabilityKey: 'ACC-DIGITAL',
          responsibility: 'Own enterprise digital delivery capability.',
          accountableRoleKey: 'CHIEF-DIGITAL-OFFICER',
          decisionRights: 'Set platform standards and approve enterprise digital controls.'
        },
        {
          accountabilityKey: 'ACC-DELIVERY',
          responsibility: 'Own project-delivery performance.',
          accountableRoleKey: 'COO',
          decisionRights: 'Set delivery operating standards and intervene on material variance.'
        }
      ]
    });

    let current = (await model.listOperatingModels(context)).find((row) => row.id === modelId)!;
    expect(current.status).toBe('DRAFT');
    let version = (await model.listOperatingModelVersions(context, modelId))[0];
    expect(await model.listOperatingModelCapabilities(context, version.id)).toHaveLength(2);
    expect(await model.listOperatingModelAccountabilities(context, version.id)).toHaveLength(2);

    await model.submitOperatingModel(context, modelId, current.aggregateVersion);
    current = (await model.listOperatingModels(context)).find((row) => row.id === modelId)!;
    const approvalDecision = await decision.recordWorkDecision(context, {
      decisionType: 'OPERATING_MODEL_APPROVAL',
      subjectType: 'OPERATING_MODEL',
      subjectId: modelId,
      subjectVersion: String(current.currentVersionNo),
      outcome: 'APPROVED',
      reason: 'Target Operating Model approved.'
    });
    await model.approveOperatingModel(context, modelId, current.aggregateVersion, approvalDecision);
    current = (await model.listOperatingModels(context)).find((row) => row.id === modelId)!;
    await model.activateOperatingModel(context, modelId, current.aggregateVersion);
    current = (await model.listOperatingModels(context)).find((row) => row.id === modelId)!;
    expect(current.status).toBe('ACTIVE');

    await model.reviseOperatingModel(context, modelId, current.aggregateVersion, {
      currentStateSummary: 'Shared-service mobilisation underway.',
      targetStateSummary: 'Integrated model with stronger regional delivery accountability.',
      designPrinciples: 'Customer outcome ownership; common data; subsidiarity.',
      centralisationModel: 'Enterprise platforms centralised; operations regionally accountable.',
      sharedServiceRequirements: 'Finance, people, technology, data and procurement services.',
      organisationModelReference: 'target-org-model-2028',
      changeInitiativesSummary:
        'Complete shared-service mobilisation and regional accountability design.',
      capabilities: [
        {
          capabilityKey: 'CAP-DIGITAL-DELIVERY',
          name: 'Digital Delivery',
          description: 'Integrated information and delivery control.',
          criticality: 'CRITICAL',
          deliveryModel: 'SHARED_SERVICE'
        }
      ],
      accountabilities: [
        {
          accountabilityKey: 'ACC-DIGITAL',
          responsibility: 'Own enterprise digital delivery capability.',
          accountableRoleKey: 'CHIEF-DIGITAL-OFFICER',
          decisionRights: 'Set platform standards and service levels.'
        }
      ]
    });
    current = (await model.listOperatingModels(context)).find((row) => row.id === modelId)!;
    expect(current.status).toBe('DRAFT');
    expect(current.currentVersionNo).toBe(2);
    const versions = await model.listOperatingModelVersions(context, modelId);
    expect(versions.map((v) => [v.versionNo, v.lifecycleStatus])).toEqual([
      [2, 'DRAFT'],
      [1, 'ACTIVE']
    ]);

    const events = await db.queryRows<any>(
      "SELECT aggregate_version AS aggregateVersion FROM business_events WHERE tenant_id=? AND aggregate_id='AGG-02-STRATEGY' AND aggregate_type='OperatingModel' AND aggregate_object_id=? ORDER BY aggregate_version",
      [context.tenantId, modelId]
    );
    expect(events.map((row) => Number(row.aggregateVersion))).toEqual([1, 2, 3, 4, 5]);
  });
});
