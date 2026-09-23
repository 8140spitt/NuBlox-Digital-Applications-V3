import { describe, expect, it } from 'vitest';
import {
  KernelInvariantError,
  asId,
  completeConfigurationResolutionRun,
  createConfigurationCriterion,
  createConfigurationResolutionDefinition,
  createConfigurationResolutionItem,
  createConfigurationResolutionRun
} from './index.js';

const tenantId = asId<'TenantId'>('TENANT-CONFIG-RESOLUTION', 'Tenant');
const definition = createConfigurationResolutionDefinition({
  id: asId<'ConfigurationResolutionDefinitionId'>('CRD-1', 'Configuration Resolution Definition'),
  tenantId,
  code: 'PROJECT-AS-OF',
  name: 'Project as-of configuration',
  version: 1,
  status: 'ACTIVE'
});

describe('configuration resolution invariants', () => {
  it('requires ordered criteria against an active definition', () => {
    const criterion = createConfigurationCriterion({
      id: asId<'ConfigurationCriterionId'>('CRC-1', 'Configuration Criterion'),
      tenantId,
      definitionId: definition.id,
      sequence: 10,
      criterionType: 'BASELINE',
      mandatory: true,
      configuration: {},
      status: 'ACTIVE'
    }, definition);
    expect(criterion.sequence).toBe(10);

    expect(() => createConfigurationCriterion({
      ...criterion,
      id: asId<'ConfigurationCriterionId'>('CRC-BAD', 'Configuration Criterion'),
      sequence: -1
    }, definition)).toThrow(KernelInvariantError);
  });

  it('requires exact item scope and retained completion state', () => {
    const itemId = asId<'ConfigurationItemId'>('CI-1', 'Configuration Item');
    const run = createConfigurationResolutionRun({
      id: asId<'ConfigurationResolutionRunId'>('CRRUN-1', 'Configuration Resolution Run'),
      tenantId,
      definitionId: definition.id,
      contextObjectId: 'PROJECT-1',
      input: {
        configurationItemIds: [itemId],
        evaluatedAt: '2026-09-23T19:00:00.000Z'
      },
      startedAt: '2026-09-23T19:00:00.000Z',
      status: 'RUNNING'
    }, definition);

    const completed = completeConfigurationResolutionRun(
      run,
      'RESOLVED',
      '2026-09-23T19:00:01.000Z'
    );
    expect(completed.status).toBe('RESOLVED');
  });

  it('requires selected version and criterion evidence for resolved items', () => {
    const itemId = asId<'ConfigurationItemId'>('CI-1', 'Configuration Item');
    const runId = asId<'ConfigurationResolutionRunId'>('CRRUN-1', 'Configuration Resolution Run');
    const criterionId = asId<'ConfigurationCriterionId'>('CRC-1', 'Configuration Criterion');

    const item = createConfigurationResolutionItem({
      id: asId<'ConfigurationResolutionItemId'>('CRITEM-1', 'Configuration Resolution Item'),
      tenantId,
      runId,
      configurationItemId: itemId,
      selectedVersion: 'A',
      criterionId,
      status: 'RESOLVED',
      evidence: { source: 'BASELINE' }
    });
    expect(item.selectedVersion).toBe('A');

    expect(() => createConfigurationResolutionItem({
      ...item,
      id: asId<'ConfigurationResolutionItemId'>('CRITEM-BAD', 'Configuration Resolution Item'),
      selectedVersion: undefined
    })).toThrow(KernelInvariantError);
  });
});
