import { describe, expect, it } from 'vitest';
import { technologyDataCyberAiCanonicalization } from './technology-data-cyber-ai-canonicalization';
import {
  technologyDataCyberAiModel,
  technologyDataCyberAiRules,
  validateTechnologyDataCyberAiModel
} from './technology-data-cyber-ai-model';

describe('IT, data, cyber, analytics and AI semantic model', () => {
  it('is internally valid and covers all 38 BOF-24 candidates', () => {
    expect(validateTechnologyDataCyberAiModel()).toBe(true);
    const decided = new Set(technologyDataCyberAiCanonicalization.map((x) => x.candidateKey));
    expect(decided.size).toBe(38);
    for (let i=1;i<=38;i+=1) {
      const key = 'BOF-24-' + String(i).padStart(3,'0');
      expect(decided.has(key)).toBe(true);
    }
  });

  it('converges application service onto technology service', () => {
    const d = technologyDataCyberAiCanonicalization.find((x) => x.candidateKey === 'BOF-24-002');
    expect(d?.decision).toBe('MERGE');
    expect(d?.targetCandidateKey).toBe('BOF-24-001');
  });

  it('uses shared Decision, Asset, Risk Assessment and Policy semantics', () => {
    expect(technologyDataCyberAiCanonicalization.find((x) => x.candidateKey === 'BOF-24-003')?.targetCandidateKey).toBe('BOF-06-023');
    expect(technologyDataCyberAiCanonicalization.find((x) => x.candidateKey === 'BOF-24-006')?.targetCandidateKey).toBe('BOF-16-016');
    expect(technologyDataCyberAiCanonicalization.find((x) => x.candidateKey === 'BOF-24-014')?.targetCandidateKey).toBe('BOF-16-016');
    expect(technologyDataCyberAiCanonicalization.find((x) => x.candidateKey === 'BOF-24-028')?.targetCandidateKey).toBe('BOF-21-003');
    expect(technologyDataCyberAiCanonicalization.find((x) => x.candidateKey === 'BOF-24-030')?.targetCandidateKey).toBe('BOF-02-018');
  });

  it('models Configuration Item as registration over authoritative identity', () => {
    const d = technologyDataCyberAiCanonicalization.find((x) => x.candidateKey === 'BOF-24-013');
    expect(d?.decision).toBe('RELATIONSHIP');
    expect(d?.proposedCanonicalName).toBe('Configuration Registration');
    expect(technologyDataCyberAiRules.join(' ')).toContain('CMDB is not a duplicate master-data universe');
  });

  it('normalizes Reference Dataset to Dataset', () => {
    const d = technologyDataCyberAiCanonicalization.find((x) => x.candidateKey === 'BOF-24-019');
    expect(d?.decision).toBe('MERGE');
    expect(d?.targetCandidateKey).toBe('BOF-24-018');
  });

  it('separates access requests from grants', () => {
    expect(technologyDataCyberAiModel.find((x) => x.modelId === 'DATA-ACCESS-REQUEST')?.kind).toBe('request');
    expect(technologyDataCyberAiModel.find((x) => x.modelId === 'SEC-PRIVILEGED-ACCESS-REQUEST')?.kind).toBe('request');
    expect(technologyDataCyberAiModel.find((x) => x.modelId === 'SEC-ACCESS-GRANT')?.kind).toBe('authorization');
  });

  it('keeps routine IT incidents and cyber incidents distinct', () => {
    expect(technologyDataCyberAiModel.find((x) => x.modelId === 'IT-INCIDENT')?.kind).toBe('case');
    expect(technologyDataCyberAiCanonicalization.find((x) => x.candidateKey === 'BOF-24-035')?.proposedCanonicalName).toBe('Cybersecurity Incident');
  });
});
