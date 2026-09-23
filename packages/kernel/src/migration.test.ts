import { describe, expect, it } from 'vitest';
import {
  KernelInvariantError,
  applyReconciliationToMigrationRun,
  approveMigrationPlan,
  createCutoverDecision,
  createMigrationItemResult,
  createMigrationMappingVersion,
  createMigrationPlan,
  createMigrationReconciliationRun,
  createMigrationRun,
  freezeMigrationMappingVersion,
  startMigrationRun,
  asId,
  type CanonicalDataEnvelope,
  type CanonicalObjectIdentity,
  type Decision,
  type ExternalIdentity,
  type MigrationPlan,
  type Person,
  type SourceAuthorityRule
} from './index.js';

const tenantId = asId<'TenantId'>('TENANT-MIG', 'Tenant');
const person: Person = {
  id: asId<'PersonId'>('PERSON-MIG', 'Person'),
  tenantId,
  partyId: asId<'PartyId'>('PARTY-MIG', 'Party'),
  legalName: 'Migration Controller',
  status: 'ACTIVE'
};
const scope: CanonicalObjectIdentity = {
  id: asId<'CanonicalObjectId'>('SCOPE-MIG', 'Scope'),
  tenantId,
  objectType: 'ORGANISATION',
  stableKey: 'ORG:MIGRATION',
  createdAt: '2026-09-23T18:00:00.000Z'
};
const target: CanonicalObjectIdentity = {
  id: asId<'CanonicalObjectId'>('TARGET-MIG', 'Target'),
  tenantId,
  objectType: 'INFORMATION_CONTAINER',
  stableKey: 'DOC:001',
  createdAt: '2026-09-23T18:01:00.000Z'
};
const approval: Decision = {
  id: asId<'DecisionId'>('DEC-MIG-APPROVE', 'Decision'),
  tenantId,
  decisionType: 'MIGRATION_PLAN_APPROVAL',
  subjectObjectId: scope.id,
  outcome: 'APPROVED',
  reason: 'Approved migration.',
  deciderPersonId: person.id,
  decidedAt: '2026-09-23T18:02:00.000Z'
};

function approvedPlan(): MigrationPlan {
  const draft = createMigrationPlan({
    id: asId<'MigrationPlanId'>('PLAN-MIG', 'Migration Plan'),
    tenantId,
    code: 'PLAN',
    name: 'Migration',
    sourceSystem: 'LEGACY',
    targetSystem: 'NUBLOX',
    scopeObjectId: scope.id,
    scopeDefinition: { objectTypes: ['INFORMATION_CONTAINER'] },
    cutoverStrategy: 'PHASED',
    status: 'DRAFT',
    createdByPersonId: person.id,
    createdAt: '2026-09-23T18:00:00.000Z'
  }, scope, person);
  return approveMigrationPlan(draft, approval, '2026-09-23T18:03:00.000Z');
}

describe('governed migration invariants', () => {
  it('requires an approved plan and frozen mapping before execution', () => {
    const plan = approvedPlan();
    const draftMapping = createMigrationMappingVersion({
      id: asId<'MigrationMappingVersionId'>('MAP-MIG', 'Mapping'),
      tenantId,
      migrationPlanId: plan.id,
      version: '1.0',
      sourceSchemaVersion: 'legacy-1',
      targetSchemaVersion: 'nublox-1',
      mappingDefinition: { title: 'name' },
      checksum: 'sha256:mapping',
      status: 'DRAFT',
      createdByPersonId: person.id,
      createdAt: '2026-09-23T18:04:00.000Z'
    }, plan, person);

    expect(() => createMigrationRun({
      id: asId<'MigrationRunId'>('RUN-MIG-DRAFT', 'Run'),
      tenantId,
      migrationPlanId: plan.id,
      mappingVersionId: draftMapping.id,
      runReference: 'RUN-001',
      runType: 'REHEARSAL',
      requestedByPersonId: person.id,
      requestedAt: '2026-09-23T18:05:00.000Z',
      status: 'QUEUED'
    }, plan, draftMapping, person)).toThrow(KernelInvariantError);

    const frozen = freezeMigrationMappingVersion(
      draftMapping,
      person,
      '2026-09-23T18:05:00.000Z'
    );
    const run = createMigrationRun({
      id: asId<'MigrationRunId'>('RUN-MIG', 'Run'),
      tenantId,
      migrationPlanId: plan.id,
      mappingVersionId: frozen.id,
      runReference: 'RUN-002',
      runType: 'PRODUCTION',
      requestedByPersonId: person.id,
      requestedAt: '2026-09-23T18:06:00.000Z',
      status: 'QUEUED'
    }, plan, frozen, person);
    expect(run.status).toBe('QUEUED');
  });

  it('binds item evidence and cutover to verified production reconciliation', () => {
    const plan = approvedPlan();
    const mapping = freezeMigrationMappingVersion(
      createMigrationMappingVersion({
        id: asId<'MigrationMappingVersionId'>('MAP-MIG-2', 'Mapping'),
        tenantId,
        migrationPlanId: plan.id,
        version: '2.0',
        sourceSchemaVersion: 'legacy-1',
        targetSchemaVersion: 'nublox-1',
        mappingDefinition: { title: 'name' },
        checksum: 'sha256:mapping-2',
        status: 'DRAFT',
        createdByPersonId: person.id,
        createdAt: '2026-09-23T18:04:00.000Z'
      }, plan, person),
      person,
      '2026-09-23T18:05:00.000Z'
    );
    const running = startMigrationRun(createMigrationRun({
      id: asId<'MigrationRunId'>('RUN-MIG-2', 'Run'),
      tenantId,
      migrationPlanId: plan.id,
      mappingVersionId: mapping.id,
      runReference: 'RUN-003',
      runType: 'PRODUCTION',
      requestedByPersonId: person.id,
      requestedAt: '2026-09-23T18:06:00.000Z',
      status: 'QUEUED'
    }, plan, mapping, person), '2026-09-23T18:07:00.000Z');

    const envelope: CanonicalDataEnvelope = {
      id: asId<'DataEnvelopeId'>('ENV-MIG', 'Envelope'),
      tenantId,
      direction: 'IMPORT',
      schemaName: 'legacy.document',
      schemaVersion: '1',
      objectType: 'WTDocument',
      stableKey: 'LEG-001',
      payload: { name: 'Document 1' },
      externalSystem: 'LEGACY',
      externalObjectId: 'LEG-001',
      checksum: 'sha256:source',
      createdAt: '2026-09-23T18:08:00.000Z'
    };
    const identity: ExternalIdentity = {
      id: asId<'ExternalIdentityId'>('EXT-MIG', 'External Identity'),
      tenantId,
      canonicalObjectId: target.id,
      externalSystem: 'LEGACY',
      externalObjectType: 'WTDocument',
      externalObjectId: 'LEG-001',
      externalVersion: 'A'
    };
    const item = createMigrationItemResult({
      id: asId<'MigrationItemResultId'>('ITEM-MIG', 'Item'),
      tenantId,
      migrationRunId: running.id,
      sequence: 1,
      sourceSystem: 'LEGACY',
      sourceObjectType: 'WTDocument',
      sourceObjectId: 'LEG-001',
      sourceVersion: 'A',
      sourceEnvelopeId: envelope.id,
      targetCanonicalObjectId: target.id,
      targetVersion: 'A',
      externalIdentityId: identity.id,
      outcome: 'CREATED',
      sourceHash: envelope.checksum,
      targetHash: envelope.checksum,
      recordedAt: '2026-09-23T18:09:00.000Z'
    }, running, plan, envelope, target, identity);
    expect(item.sourceHash).toBe(envelope.checksum);

    const reconciliation = createMigrationReconciliationRun({
      id: asId<'MigrationReconciliationRunId'>('RECRUN-MIG', 'Reconciliation Run'),
      tenantId,
      migrationRunId: running.id,
      checkpoint: 'CUTOVER',
      status: 'RUNNING',
      startedByPersonId: person.id,
      startedAt: '2026-09-23T18:10:00.000Z'
    }, { ...running, status: 'AWAITING_RECONCILIATION', loadCompletedAt: '2026-09-23T18:09:30.000Z' }, person);

    const reconciledRun = applyReconciliationToMigrationRun(
      { ...running, status: 'AWAITING_RECONCILIATION', loadCompletedAt: '2026-09-23T18:09:30.000Z' },
      {
        ...reconciliation,
        status: 'VERIFIED',
        completedAt: '2026-09-23T18:11:00.000Z',
        sourceCount: 1,
        targetCount: 1,
        verifiedCount: 1,
        conflictCount: 0,
        missingCount: 0
      }
    );
    expect(reconciledRun.status).toBe('RECONCILED');

    const authorityRule: SourceAuthorityRule = {
      id: asId<'SourceAuthorityRuleId'>('AUTH-MIG', 'Authority Rule'),
      tenantId,
      code: 'NUBLOX-MASTER',
      name: 'NuBlox master after cutover',
      subjectObjectType: 'INFORMATION_CONTAINER',
      authorityOwner: 'NUBLOX',
      priority: 0,
      effectiveFrom: '2026-09-23T18:12:00.000Z',
      status: 'ACTIVE'
    };
    const cutoverDecision: Decision = {
      id: asId<'DecisionId'>('DEC-CUTOVER', 'Decision'),
      tenantId,
      decisionType: 'MIGRATION_CUTOVER',
      subjectObjectId: scope.id,
      outcome: 'APPROVED',
      reason: 'Verified and approved.',
      deciderPersonId: person.id,
      decidedAt: '2026-09-23T18:12:00.000Z'
    };
    const cutover = createCutoverDecision({
      id: asId<'CutoverDecisionId'>('CUTOVER-MIG', 'Cutover'),
      tenantId,
      migrationPlanId: plan.id,
      migrationRunId: reconciledRun.id,
      reconciliationRunId: reconciliation.id,
      decisionId: cutoverDecision.id,
      outcome: 'APPROVED',
      targetAuthorityRuleId: authorityRule.id,
      decidedByPersonId: person.id,
      decidedAt: '2026-09-23T18:12:00.000Z',
      effectiveAt: '2026-09-23T18:12:00.000Z',
      reason: 'Cut over to NuBlox.'
    }, { ...plan, status: 'ACTIVE' }, reconciledRun, {
      ...reconciliation,
      status: 'VERIFIED',
      completedAt: '2026-09-23T18:11:00.000Z',
      sourceCount: 1,
      targetCount: 1,
      verifiedCount: 1,
      conflictCount: 0,
      missingCount: 0
    }, cutoverDecision, person, authorityRule);
    expect(cutover.outcome).toBe('APPROVED');
  });
});
