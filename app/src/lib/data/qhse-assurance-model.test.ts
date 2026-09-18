import { describe, expect, it } from 'vitest';
import { qhseAssuranceCanonicalization } from './qhse-assurance-canonicalization';
import { qhseAssuranceModel, qhseAssuranceRelationships, qhseAssuranceRules, validateQhseAssuranceModel } from './qhse-assurance-model';

describe('quality, HSE, environment and assurance semantic model', () => {
  it('is internally valid and covers every BOF-13 candidate', () => {
    expect(validateQhseAssuranceModel()).toBe(true);
    const decided = new Set(qhseAssuranceCanonicalization.map((x) => x.candidateKey));
    for (let i = 1; i <= 37; i += 1) expect(decided.has(`BOF-13-${String(i).padStart(3,'0')}`)).toBe(true);
    expect(qhseAssuranceRelationships.length).toBeGreaterThanOrEqual(20);
  });

  it('normalizes field permit and isolation onto shared QHSE identities', () => {
    expect(qhseAssuranceCanonicalization.find((x) => x.candidateKey === 'BOF-12-017')?.targetCandidateKey).toBe('BOF-13-021');
    expect(qhseAssuranceCanonicalization.find((x) => x.candidateKey === 'BOF-12-018')?.targetCandidateKey).toBe('BOF-13-022');
  });

  it('keeps NCR, Defect and CAPA distinct while normalizing snag/actions', () => {
    expect(qhseAssuranceModel.find((x) => x.modelId === 'QHSE-NCR')?.kind).toBe('case');
    expect(qhseAssuranceModel.find((x) => x.modelId === 'QHSE-DEFECT')?.kind).toBe('case');
    expect(qhseAssuranceModel.find((x) => x.modelId === 'QHSE-CAPA-CASE')?.kind).toBe('case');
    expect(qhseAssuranceCanonicalization.find((x) => x.candidateKey === 'BOF-13-009')?.targetCandidateKey).toBe('BOF-13-008');
    expect(qhseAssuranceCanonicalization.find((x) => x.candidateKey === 'BOF-13-011')?.targetCandidateKey).toBe('BOF-13-010');
  });

  it('reuses shared enterprise risk, audit and compliance semantics', () => {
    expect(qhseAssuranceCanonicalization.find((x) => x.candidateKey === 'BOF-13-018')?.targetCandidateKey).toBe('BOF-21-003');
    expect(qhseAssuranceCanonicalization.find((x) => x.candidateKey === 'BOF-13-013')?.targetCandidateKey).toBe('BOF-21-012');
    expect(qhseAssuranceCanonicalization.find((x) => x.candidateKey === 'BOF-13-032')?.targetCandidateKey).toBe('BOF-21-006');
  });

  it('treats method statement and RAMS as controlled information', () => {
    for (const key of ['BOF-13-019','BOF-13-020']) {
      const d = qhseAssuranceCanonicalization.find((x) => x.candidateKey === key);
      expect(d?.decision).toBe('MERGE');
      expect(d?.targetCandidateKey).toBe('BOF-07-007');
    }
    expect(qhseAssuranceRules.join(' ')).toContain('controlled Information Container types');
  });

  it('treats compliance register as projection and incident specializations consistently', () => {
    expect(qhseAssuranceCanonicalization.find((x) => x.candidateKey === 'BOF-13-033')?.decision).toBe('PROJECTION');
    expect(qhseAssuranceCanonicalization.find((x) => x.candidateKey === 'BOF-13-027')?.targetCandidateKey).toBe('BOF-13-028');
    expect(qhseAssuranceCanonicalization.find((x) => x.candidateKey === 'BOF-13-036')?.targetCandidateKey).toBe('BOF-13-028');
  });
});
