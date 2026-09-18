import { describe, expect, it } from 'vitest';
import { foundationCanonicalization } from './foundation-canonicalization';
import {
  deliveryContextModel,
  deliveryContextRelationships,
  deliveryContextRules,
  deliveryStructureBoundaries,
  validateDeliveryContextModel
} from './delivery-context-model';

describe('delivery context semantic model', () => {
  it('has unique governed constructs and valid relationship endpoints', () => {
    expect(validateDeliveryContextModel()).toBe(true);
    expect(deliveryContextModel.length).toBeGreaterThanOrEqual(12);
    expect(deliveryContextRelationships.length).toBeGreaterThanOrEqual(18);
    expect(deliveryStructureBoundaries.length).toBeGreaterThanOrEqual(7);
  });

  it('keeps governance, scope, schedule and physical structures distinct', () => {
    const project = deliveryContextModel.find((item) => item.modelId === 'CBO-PROJECT');
    const wbs = deliveryContextModel.find((item) => item.modelId === 'DEL-WBS-ELEMENT');
    const schedule = deliveryContextModel.find((item) => item.modelId === 'DEL-SCHEDULE');
    const activity = deliveryContextModel.find((item) => item.modelId === 'DEL-SCHEDULE-ACTIVITY');
    const baseline = deliveryContextModel.find((item) => item.modelId === 'DEL-SCHEDULE-BASELINE');

    expect(project?.kind).toBe('foundation-reference');
    expect(wbs?.kind).toBe('scope-structure');
    expect(schedule?.kind).toBe('plan');
    expect(activity?.candidateKeys).toContain('BOF-06-010');
    expect(activity?.candidateKeys).toContain('BOF-06-011');
    expect(baseline?.governance.join(' ')).toContain('immutable');
    expect(deliveryContextRules.join(' ')).toContain('WBS is the scope hierarchy');
  });

  it('connects schedule activities to scope rather than collapsing the structures', () => {
    expect(deliveryContextRelationships).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'DEL-SCHEDULE-ACTIVITY',
          predicate: 'maps to',
          to: 'DEL-WBS-ELEMENT'
        }),
        expect.objectContaining({
          from: 'DEL-SCHEDULE-ACTIVITY',
          predicate: 'executes',
          to: 'DEL-WORK-PACKAGE'
        }),
        expect.objectContaining({
          from: 'DEL-SCHEDULE',
          predicate: 'baselined by',
          to: 'DEL-SCHEDULE-BASELINE'
        })
      ])
    );
  });

  it('records the delivery canonicalization decisions in the architecture baseline', () => {
    const decisions = new Map(
      foundationCanonicalization.map((entry) => [entry.candidateKey, entry])
    );
    expect(decisions.get('BOF-06-001')?.decision).toBe('VALIDATE_OBJECT');
    expect(decisions.get('BOF-06-002')?.decision).toBe('VALIDATE_OBJECT');
    expect(decisions.get('BOF-06-006')?.targetCandidateKey).toBe('BOF-06-007');
    expect(decisions.get('BOF-06-007')?.decision).toBe('RELATIONSHIP');
    expect(decisions.get('BOF-06-010')?.targetCandidateKey).toBe('BOF-06-011');
    expect(decisions.get('BOF-06-019')?.targetCandidateKey).toBe('BOF-01-012');
  });
});
