import { describe, expect, it } from 'vitest';
import { sustainabilityCarbonCanonicalization } from './sustainability-carbon-canonicalization';
import {
  sustainabilityCarbonModel,
  sustainabilityCarbonRules,
  validateSustainabilityCarbonModel
} from './sustainability-carbon-model';

describe('sustainability, carbon, energy, circularity and social value model', () => {
  it('is internally valid and covers all 25 BOF-20 candidates', () => {
    expect(validateSustainabilityCarbonModel()).toBe(true);
    const decided = new Set(sustainabilityCarbonCanonicalization.map((x) => x.candidateKey));
    expect(decided.size).toBe(25);
    for (let i = 1; i <= 25; i += 1) {
      expect(decided.has(`BOF-20-${String(i).padStart(3, '0')}`)).toBe(true);
    }
  });

  it('reuses operations utility consumption instead of a sustainability duplicate', () => {
    const decision = sustainabilityCarbonCanonicalization.find((x) => x.candidateKey === 'BOF-20-010');
    expect(decision?.decision).toBe('MERGE');
    expect(decision?.targetCandidateKey).toBe('BOF-17-030');
  });

  it('keeps embodied carbon as an assessment line rather than another Item master', () => {
    expect(sustainabilityCarbonCanonicalization.find((x) => x.candidateKey === 'BOF-20-007')?.decision).toBe('CHILD');
    expect(sustainabilityCarbonRules.join(' ')).toContain('never a second Item master');
  });

  it('separates baseline, budget, target and assessment', () => {
    expect(sustainabilityCarbonModel.find((x) => x.modelId === 'SUS-CARBON-BASELINE')?.kind).toBe('snapshot');
    expect(sustainabilityCarbonModel.find((x) => x.modelId === 'SUS-CARBON-BUDGET')?.kind).toBe('plan');
    expect(sustainabilityCarbonModel.find((x) => x.modelId === 'SUS-CARBON-TARGET')?.kind).toBe('target');
    expect(sustainabilityCarbonModel.find((x) => x.modelId === 'SUS-CARBON-ASSESSMENT')?.kind).toBe('projection');
  });

  it('normalizes climate and resilience risks to Enterprise Risk', () => {
    for (const key of ['BOF-20-023', 'BOF-20-024']) {
      const decision = sustainabilityCarbonCanonicalization.find((x) => x.candidateKey === key);
      expect(decision?.decision).toBe('MERGE');
      expect(decision?.targetCandidateKey).toBe('BOF-21-002');
    }
  });

  it('keeps social-value commitment, evidence and outcome separate', () => {
    expect(sustainabilityCarbonModel.find((x) => x.modelId === 'SUS-SOCIAL-COMMITMENT')?.kind).toBe('commitment');
    expect(sustainabilityCarbonModel.find((x) => x.modelId === 'SUS-SOCIAL-EVIDENCE')?.kind).toBe('event-evidence');
    expect(sustainabilityCarbonModel.find((x) => x.modelId === 'SUS-SOCIAL-OUTCOME')?.kind).toBe('projection');
  });
});
