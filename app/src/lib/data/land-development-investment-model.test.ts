import { describe, expect, it } from 'vitest';
import { landDevelopmentInvestmentCanonicalization } from './land-development-investment-canonicalization';
import {
  landDevelopmentInvestmentModel,
  landDevelopmentInvestmentRules,
  validateLandDevelopmentInvestmentModel
} from './land-development-investment-model';

describe('land, development, investment and property acquisition semantic model', () => {
  it('is internally valid and covers all 19 BOF-04 candidates', () => {
    expect(validateLandDevelopmentInvestmentModel()).toBe(true);
    const decided = new Set(landDevelopmentInvestmentCanonicalization.map((x) => x.candidateKey));
    expect(decided.size).toBe(19);
    for (let i=1;i<=19;i+=1) expect(decided.has(`BOF-04-${String(i).padStart(3,'0')}`)).toBe(true);
  });

  it('reuses canonical Land Parcel and Contract identities', () => {
    const parcel = landDevelopmentInvestmentCanonicalization.find((x) => x.candidateKey === 'BOF-04-007');
    expect(parcel?.decision).toBe('MERGE');
    expect(parcel?.targetCandidateKey).toBe('BOF-16-004');

    const option = landDevelopmentInvestmentCanonicalization.find((x) => x.candidateKey === 'BOF-04-005');
    expect(option?.decision).toBe('MERGE');
    expect(option?.targetCandidateKey).toBe('BOF-08-002');
  });

  it('normalizes ownership and occupation to Property Interest', () => {
    for (const key of ['BOF-04-009','BOF-04-010']) {
      const d = landDevelopmentInvestmentCanonicalization.find((x) => x.candidateKey === key);
      expect(d?.decision).toBe('MERGE');
      expect(d?.targetCandidateKey).toBe('BOF-04-008');
    }
  });

  it('distinguishes property valuation from contract valuation', () => {
    const d = landDevelopmentInvestmentCanonicalization.find((x) => x.candidateKey === 'BOF-04-012');
    expect(d?.decision).toBe('RENAME');
    expect(d?.proposedCanonicalName).toBe('Property Valuation');
    expect(landDevelopmentInvestmentRules.join(' ')).toContain('contract/payment Valuation');
  });

  it('separates application, consent and condition', () => {
    expect(landDevelopmentInvestmentModel.find((x) => x.modelId === 'LDI-PLANNING-APPLICATION')?.kind).toBe('case');
    expect(landDevelopmentInvestmentModel.find((x) => x.modelId === 'LDI-PLANNING-CONSENT')?.kind).toBe('authorization');
    expect(landDevelopmentInvestmentCanonicalization.find((x) => x.candidateKey === 'BOF-04-016')?.decision).toBe('CHILD');
  });

  it('reuses shared Legal Obligation for planning obligations', () => {
    const d = landDevelopmentInvestmentCanonicalization.find((x) => x.candidateKey === 'BOF-04-017');
    expect(d?.decision).toBe('MERGE');
    expect(d?.targetCandidateKey).toBe('BOF-22-003');
  });
});
