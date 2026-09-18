import { describe, expect, it } from 'vitest';
import { estimatingTenderingCanonicalization } from './estimating-tendering-canonicalization';
import {
  estimatingTenderingModel,
  estimatingTenderingRelationships,
  estimatingTenderingRules,
  validateEstimatingTenderingModel
} from './estimating-tendering-model';

describe('estimating, measurement, tendering, proposals and sales semantic model', () => {
  it('is internally valid and covers all 23 BOF-05 candidates', () => {
    expect(validateEstimatingTenderingModel()).toBe(true);
    const decided = new Set(estimatingTenderingCanonicalization.map((entry) => entry.candidateKey));
    expect(decided.size).toBe(23);
    for (let i = 1; i <= 23; i += 1) {
      expect(decided.has(`BOF-05-${String(i).padStart(3, '0')}`)).toBe(true);
    }
    expect(estimatingTenderingRelationships.length).toBeGreaterThanOrEqual(18);
  });

  it('keeps estimate versioning subordinate to stable Estimate identity', () => {
    const estimate = estimatingTenderingModel.find((entry) => entry.modelId === 'EST-ESTIMATE');
    const version = estimatingTenderingModel.find((entry) => entry.modelId === 'EST-ESTIMATE-VERSION');
    expect(estimate?.canonicalName).toBe('Estimate');
    expect(version?.kind).toBe('version');
    expect(version?.governance.join(' ')).toContain('not a duplicate Estimate master');
  });

  it('keeps estimating structure separate from delivery, finance and procurement structures', () => {
    const rules = estimatingTenderingRules.join(' ');
    expect(rules).toContain('Estimate Breakdown is not WBS');
    expect(rules).toContain('Procurement Package');
    expect(rules).toContain('GL Account');
    expect(rules).toContain('Tender Package is bid-side scope grouping');
  });

  it('reuses shared sourcing semantics for estimating market testing', () => {
    for (const key of ['BOF-05-014', 'BOF-05-015']) {
      const decision = estimatingTenderingCanonicalization.find((entry) => entry.candidateKey === key);
      expect(decision?.decision).toBe('MERGE');
      expect(decision?.targetCandidateKey).toBe('BOF-09-009');
    }
    for (const key of ['BOF-05-016', 'BOF-05-017']) {
      expect(estimatingTenderingCanonicalization.find((entry) => entry.candidateKey === key)?.targetCandidateKey).toBe('BOF-09-012');
    }
    expect(estimatingTenderingCanonicalization.find((entry) => entry.candidateKey === 'BOF-05-018')?.targetCandidateKey).toBe('BOF-09-014');
  });

  it('normalizes preliminaries and estimate provisions without losing semantics', () => {
    expect(estimatingTenderingCanonicalization.find((entry) => entry.candidateKey === 'BOF-05-010')?.targetCandidateKey).toBe('BOF-05-005');
    expect(estimatingTenderingCanonicalization.find((entry) => entry.candidateKey === 'BOF-05-011')?.proposedCanonicalName).toBe('Estimate Provision');
    expect(estimatingTenderingCanonicalization.find((entry) => entry.candidateKey === 'BOF-05-012')?.targetCandidateKey).toBe('BOF-05-011');
  });

  it('treats adjudication and acceptance as evidence rather than mutable masters', () => {
    expect(estimatingTenderingModel.find((entry) => entry.modelId === 'EST-TENDER-ADJUDICATION')?.kind).toBe('event-evidence');
    expect(estimatingTenderingModel.find((entry) => entry.modelId === 'EST-OFFER-ACCEPTANCE')?.kind).toBe('event-evidence');
  });
});
