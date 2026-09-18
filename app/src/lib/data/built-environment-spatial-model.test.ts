import { describe, expect, it } from 'vitest';
import {
  builtEnvironmentModel,
  builtEnvironmentRelationships,
  builtEnvironmentRules,
  validateBuiltEnvironmentModel
} from './built-environment-spatial-model';

describe('built environment spatial and physical model', () => {
  it('has unique governed identities and valid relationship endpoints', () => {
    expect(validateBuiltEnvironmentModel()).toBe(true);
    expect(builtEnvironmentModel.length).toBeGreaterThanOrEqual(15);
    expect(builtEnvironmentRelationships.length).toBeGreaterThanOrEqual(20);
  });

  it('keeps project delivery separate from permanent built environment identity', () => {
    expect(builtEnvironmentRelationships).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'CBO-PROJECT',
          predicate: 'delivers/changes',
          to: 'BE-BUILDING'
        }),
        expect.objectContaining({
          from: 'CBO-PROJECT',
          predicate: 'delivers/changes',
          to: 'BE-INFRASTRUCTURE-ENTITY'
        }),
        expect.objectContaining({
          from: 'CBO-PROJECT',
          predicate: 'delivers/changes',
          to: 'CBO-ASSET'
        })
      ])
    );
    expect(
      builtEnvironmentRules.some(
        (rule) => rule.includes('Project structure') && rule.includes('separate')
      )
    ).toBe(true);
  });

  it('supports both building and linear infrastructure patterns', () => {
    const names = builtEnvironmentModel.map((item) => item.canonicalName);
    expect(names).toEqual(
      expect.arrayContaining([
        'Building',
        'Level',
        'Space',
        'Network',
        'Infrastructure Entity',
        'Linear Segment'
      ])
    );
  });

  it('reuses shared System and Asset identities instead of specialist masters', () => {
    const system = builtEnvironmentModel.find((item) => item.modelId === 'CBO-SYSTEM');
    const asset = builtEnvironmentModel.find((item) => item.modelId === 'CBO-ASSET');
    expect(system?.candidateKeys).toContain('BOF-16-015');
    expect(asset?.candidateKeys).toEqual(
      expect.arrayContaining(['BOF-16-019', 'BOF-16-020', 'BOF-16-025', 'BOF-16-026'])
    );
  });
});
