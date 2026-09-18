import { describe, expect, it } from 'vitest';
import { legalPrivacyCanonicalization } from './legal-privacy-canonicalization';
import { legalPrivacyModel, legalPrivacyRules, validateLegalPrivacyModel } from './legal-privacy-model';

describe('legal, privacy and records-obligation semantic model', () => {
  it('is internally valid and covers all 21 BOF-22 candidates', () => {
    expect(validateLegalPrivacyModel()).toBe(true);
    const decided = new Set(legalPrivacyCanonicalization.map((x) => x.candidateKey));
    expect(decided.size).toBe(21);
    for (let i=1;i<=21;i+=1) expect(decided.has(`BOF-22-${String(i).padStart(3,'0')}`)).toBe(true);
  });

  it('keeps matter, dispute and proceeding identities distinct', () => {
    expect(legalPrivacyModel.find((x) => x.modelId === 'LEGAL-MATTER')?.kind).toBe('case');
    expect(legalPrivacyModel.find((x) => x.modelId === 'LEGAL-DISPUTE')?.kind).toBe('case');
    expect(legalPrivacyModel.find((x) => x.modelId === 'LEGAL-PROCEEDING')?.canonicalName).toBe('Legal Proceeding');
  });

  it('reuses controlled information for privacy policy', () => {
    const policy = legalPrivacyCanonicalization.find((x) => x.candidateKey === 'BOF-22-011');
    expect(policy?.decision).toBe('MERGE');
    expect(policy?.targetCandidateKey).toBe('BOF-07-007');
  });

  it('keeps processing definition and DPIA evidence separate', () => {
    expect(legalPrivacyModel.find((x) => x.modelId === 'PRIV-PROCESSING-ACTIVITY')?.kind).toBe('processing-definition');
    expect(legalPrivacyCanonicalization.find((x) => x.candidateKey === 'BOF-22-014')?.decision).toBe('EVENT_EVIDENCE');
  });

  it('normalizes privacy breach to privacy incident type', () => {
    const breach = legalPrivacyCanonicalization.find((x) => x.candidateKey === 'BOF-22-018');
    expect(breach?.decision).toBe('MERGE');
    expect(breach?.targetCandidateKey).toBe('BOF-22-019');
    expect(legalPrivacyRules.join(' ')).toContain('Privacy Breach is a Privacy Incident classification');
  });

  it('models international transfer as a relationship and reuses assurance review', () => {
    expect(legalPrivacyCanonicalization.find((x) => x.candidateKey === 'BOF-22-020')?.decision).toBe('RELATIONSHIP');
    const review = legalPrivacyCanonicalization.find((x) => x.candidateKey === 'BOF-22-021');
    expect(review?.decision).toBe('MERGE');
    expect(review?.targetCandidateKey).toBe('BOF-13-014');
  });
});
