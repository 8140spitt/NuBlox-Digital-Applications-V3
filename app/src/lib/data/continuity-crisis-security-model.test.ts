import { describe, expect, it } from 'vitest';
import { continuityCrisisSecurityCanonicalization } from './continuity-crisis-security-canonicalization';
import {
  continuityCrisisSecurityModel,
  continuityCrisisSecurityRules,
  validateContinuityCrisisSecurityModel
} from './continuity-crisis-security-model';

describe('business continuity, crisis and physical security semantic model', () => {
  it('is internally valid and covers all 15 BOF-23 candidates', () => {
    expect(validateContinuityCrisisSecurityModel()).toBe(true);
    const decided = new Set(continuityCrisisSecurityCanonicalization.map((x) => x.candidateKey));
    expect(decided.size).toBe(15);
    for (let i = 1; i <= 15; i += 1)
      expect(decided.has(`BOF-23-${String(i).padStart(3, '0')}`)).toBe(true);
  });

  it('separates impact assessment, recovery requirement, strategy and plan', () => {
    expect(
      continuityCrisisSecurityModel.find((x) => x.modelId === 'BCM-BUSINESS-IMPACT-ASSESSMENT')
        ?.kind
    ).toBe('event-evidence');
    expect(
      continuityCrisisSecurityModel.find((x) => x.modelId === 'BCM-RECOVERY-REQUIREMENT')?.kind
    ).toBe('requirement');
    expect(
      continuityCrisisSecurityModel.find((x) => x.modelId === 'BCM-CONTINUITY-STRATEGY')?.kind
    ).toBe('strategy');
    expect(
      continuityCrisisSecurityModel.find((x) => x.modelId === 'BCM-CONTINUITY-PLAN')?.kind
    ).toBe('plan');
  });

  it('reuses shared action and communication patterns', () => {
    const action = continuityCrisisSecurityCanonicalization.find(
      (x) => x.candidateKey === 'BOF-23-007'
    );
    expect(action?.decision).toBe('MERGE');
    expect(action?.targetCandidateKey).toBe('BOF-06-024');

    const communication = continuityCrisisSecurityCanonicalization.find(
      (x) => x.candidateKey === 'BOF-23-008'
    );
    expect(communication?.decision).toBe('MERGE');
    expect(communication?.targetCandidateKey).toBe('BOF-25-012');
  });

  it('normalizes visitor passes onto physical access credentials', () => {
    const visitor = continuityCrisisSecurityCanonicalization.find(
      (x) => x.candidateKey === 'BOF-23-011'
    );
    expect(visitor?.decision).toBe('MERGE');
    expect(visitor?.targetCandidateKey).toBe('BOF-23-012');
    expect(
      continuityCrisisSecurityCanonicalization.find((x) => x.candidateKey === 'BOF-23-012')
        ?.proposedCanonicalName
    ).toBe('Physical Access Credential');
  });

  it('reuses enterprise risk assessment for travel and security risk', () => {
    for (const key of ['BOF-23-014', 'BOF-23-015']) {
      const d = continuityCrisisSecurityCanonicalization.find((x) => x.candidateKey === key);
      expect(d?.decision).toBe('MERGE');
      expect(d?.targetCandidateKey).toBe('BOF-21-003');
    }
  });

  it('keeps physical security zone as overlay rather than spatial identity', () => {
    expect(
      continuityCrisisSecurityCanonicalization.find((x) => x.candidateKey === 'BOF-23-010')
        ?.decision
    ).toBe('VALIDATE_OBJECT');
    expect(continuityCrisisSecurityRules.join(' ')).toContain('security-control overlay');
  });
});
