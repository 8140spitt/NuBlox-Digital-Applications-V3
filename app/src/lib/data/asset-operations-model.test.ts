import { describe, expect, it } from 'vitest';
import {
  assetOperationsModel,
  assetOperationsRelationships,
  assetOperationsRules,
  validateAssetOperationsModel
} from './asset-operations-model';

describe('asset operations semantic model', () => {
  it('is internally valid and relationship-complete', () => {
    expect(validateAssetOperationsModel()).toBe(true);
    expect(new Set(assetOperationsModel.map((entry) => entry.modelId)).size).toBe(
      assetOperationsModel.length
    );
    expect(assetOperationsRelationships.length).toBeGreaterThanOrEqual(20);
  });

  it('preserves System and Asset identity through commissioning and handover', () => {
    expect(assetOperationsRules.join(' ')).toContain(
      'does not recreate System, Asset or Component identity'
    );
    expect(assetOperationsRelationships.some((r) => r.to === 'CBO-SYSTEM')).toBe(true);
    expect(assetOperationsRelationships.some((r) => r.to === 'CBO-ASSET')).toBe(true);
  });

  it('separates maintenance definition from execution', () => {
    expect(
      assetOperationsModel.find((entry) => entry.modelId === 'OPS-MAINTENANCE-PLAN')?.kind
    ).toBe('plan');
    expect(assetOperationsModel.find((entry) => entry.modelId === 'OPS-TASK-TEMPLATE')?.kind).toBe(
      'controlled-definition'
    );
    expect(assetOperationsModel.find((entry) => entry.modelId === 'OPS-WORK-ORDER')?.kind).toBe(
      'work'
    );
  });

  it('keeps failure, defect and history semantically distinct', () => {
    expect(assetOperationsModel.find((entry) => entry.modelId === 'OPS-FAILURE')?.kind).toBe(
      'event-evidence'
    );
    expect(assetOperationsModel.find((entry) => entry.modelId === 'OPS-DEFECT')?.kind).toBe('case');
    expect(
      assetOperationsModel.find((entry) => entry.modelId === 'OPS-SERVICE-HISTORY')?.kind
    ).toBe('projection');
    expect(assetOperationsRules.join(' ')).toContain(
      'Failure is an event; Defect is a governed case'
    );
  });

  it('keeps service intake, coordination, appointment and work separate', () => {
    for (const id of [
      'OPS-SERVICE-REQUEST',
      'OPS-SERVICE-CASE',
      'OPS-SERVICE-APPOINTMENT',
      'OPS-WORK-ORDER'
    ]) {
      expect(assetOperationsModel.find((entry) => entry.modelId === id)).toBeTruthy();
    }
    expect(assetOperationsRules.join(' ')).toContain('remain separate identities');
  });
});
