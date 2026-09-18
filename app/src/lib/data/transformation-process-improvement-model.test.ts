import { describe, expect, it } from 'vitest';
import { transformationProcessImprovementCanonicalization } from './transformation-process-improvement-canonicalization';
import {
  transformationProcessImprovementModel,
  transformationProcessImprovementRules,
  validateTransformationProcessImprovementModel
} from './transformation-process-improvement-model';

describe('organisation change, transformation and continuous improvement semantic model', () => {
  it('is internally valid and covers all 23 BOF-26 candidates', () => {
    expect(validateTransformationProcessImprovementModel()).toBe(true);
    const decided = new Set(transformationProcessImprovementCanonicalization.map((x) => x.candidateKey));
    expect(decided.size).toBe(23);
    for (let i=1;i<=23;i+=1) {
      const key = 'BOF-26-' + String(i).padStart(3,'0');
      expect(decided.has(key)).toBe(true);
    }
  });

  it('reuses shared portfolio, action and communication semantics', () => {
    expect(transformationProcessImprovementCanonicalization.find((x) => x.candidateKey === 'BOF-26-001')?.targetCandidateKey).toBe('BOF-06-001');
    expect(transformationProcessImprovementCanonicalization.find((x) => x.candidateKey === 'BOF-26-005')?.targetCandidateKey).toBe('BOF-06-024');
    expect(transformationProcessImprovementCanonicalization.find((x) => x.candidateKey === 'BOF-26-006')?.targetCandidateKey).toBe('BOF-25-012');
  });

  it('keeps change learning planning separate from HCM learning truth', () => {
    const d = transformationProcessImprovementCanonicalization.find((x) => x.candidateKey === 'BOF-26-008');
    expect(d?.decision).toBe('RENAME');
    expect(d?.proposedCanonicalName).toBe('Change Learning Plan');
    expect(transformationProcessImprovementRules.join(' ')).toContain('HCM owns Training Course');
  });

  it('models process identity, model and version separately', () => {
    expect(transformationProcessImprovementModel.find((x) => x.modelId === 'PROC-ENTERPRISE-PROCESS')?.kind).toBe('process');
    expect(transformationProcessImprovementModel.find((x) => x.modelId === 'PROC-MODEL')?.kind).toBe('controlled-definition');
    expect(transformationProcessImprovementCanonicalization.find((x) => x.candidateKey === 'BOF-26-015')?.decision).toBe('CHILD');
  });

  it('reuses responsibility, KPI, controlled information and compliance assessment', () => {
    expect(transformationProcessImprovementCanonicalization.find((x) => x.candidateKey === 'BOF-26-016')?.targetCandidateKey).toBe('BOF-06-020');
    expect(transformationProcessImprovementCanonicalization.find((x) => x.candidateKey === 'BOF-26-017')?.targetCandidateKey).toBe('BOF-02-008');
    expect(transformationProcessImprovementCanonicalization.find((x) => x.candidateKey === 'BOF-26-021')?.targetCandidateKey).toBe('BOF-07-007');
    expect(transformationProcessImprovementCanonicalization.find((x) => x.candidateKey === 'BOF-26-022')?.targetCandidateKey).toBe('BOF-21-007');
  });

  it('normalizes improvement initiative onto transformation initiative', () => {
    const d = transformationProcessImprovementCanonicalization.find((x) => x.candidateKey === 'BOF-26-023');
    expect(d?.decision).toBe('MERGE');
    expect(d?.targetCandidateKey).toBe('BOF-26-002');
  });
});
