import { describe, expect, it } from 'vitest';
import {
  referenceConfigurationModel,
  referenceConfigurationRelationships,
  referenceConfigurationRules,
  validateReferenceConfigurationModel
} from './reference-configuration-model';

describe('reference and configuration semantic model', () => {
  it('covers all BOF-29 candidates and is internally valid', () => {
    expect(validateReferenceConfigurationModel()).toBe(true);
    expect(new Set(referenceConfigurationModel.map((entry) => entry.modelId)).size).toBe(
      referenceConfigurationModel.length
    );
    const candidates = new Set(referenceConfigurationModel.flatMap((entry) => entry.candidateKeys));
    expect(candidates.size).toBe(37);
    expect(referenceConfigurationRelationships.length).toBeGreaterThanOrEqual(25);
  });

  it('keeps classification as an overlay rather than identity', () => {
    expect(referenceConfigurationRules.join(' ')).toContain(
      'Classification overlays canonical identity'
    );
    expect(
      referenceConfigurationModel.find((entry) => entry.modelId === 'REF-CLASSIFICATION-CODE')
        ?.candidateKeys
    ).toContain('BOF-29-013');
  });

  it('keeps workflow and lifecycle configuration separate from runtime truth', () => {
    expect(
      referenceConfigurationModel.find((entry) => entry.modelId === 'REF-WORKFLOW')?.kind
    ).toBe('configuration');
    expect(
      referenceConfigurationModel.find((entry) => entry.modelId === 'REF-LIFECYCLE')?.kind
    ).toBe('configuration');
    expect(referenceConfigurationRules.join(' ')).toContain(
      'runtime lifecycle state remains domain-owned'
    );
    expect(referenceConfigurationRules.join(' ')).toContain(
      'never becomes authoritative domain state'
    );
  });

  it('separates authority policy from grants and decisions', () => {
    const rules = referenceConfigurationRules.join(' ');
    expect(rules).toContain('Role Definition is not Role Assignment');
    expect(rules).toContain('Delegated Authority Rule is not a Delegated Authority grant');
    expect(rules).toContain('Approval Authority Rule is policy');
  });

  it('uses one generic classification architecture for Uniclass', () => {
    expect(referenceConfigurationRules.join(' ')).toContain(
      'Uniclass uses the generic Classification System'
    );
    expect(
      referenceConfigurationModel.some((entry) => entry.modelId === 'REF-CLASSIFICATION-SYSTEM')
    ).toBe(true);
    expect(
      referenceConfigurationModel.some((entry) => entry.modelId === 'REF-CLASSIFICATION-RELEASE')
    ).toBe(true);
    expect(
      referenceConfigurationModel.some((entry) => entry.modelId === 'REF-CLASSIFICATION-CODE')
    ).toBe(true);
  });
});
