import { describe, expect, it } from 'vitest';
import { knowledgeRecordsCommunicationsCanonicalization } from './knowledge-records-communications-canonicalization';
import {
  knowledgeRecordsCommunicationsModel,
  knowledgeRecordsCommunicationsRules,
  validateKnowledgeRecordsCommunicationsModel
} from './knowledge-records-communications-model';

describe('knowledge, records, communications and stakeholder semantic model', () => {
  it('is internally valid and covers all 21 BOF-25 candidates', () => {
    expect(validateKnowledgeRecordsCommunicationsModel()).toBe(true);
    const decided = new Set(knowledgeRecordsCommunicationsCanonicalization.map((x) => x.candidateKey));
    expect(decided.size).toBe(21);
    for (let i=1;i<=21;i+=1) expect(decided.has(`BOF-25-${String(i).padStart(3,'0')}`)).toBe(true);
  });

  it('reuses Information Container for controlled knowledge and publication content', () => {
    for (const key of ['BOF-25-001','BOF-25-003','BOF-25-004','BOF-25-014','BOF-25-015','BOF-25-020']) {
      const d = knowledgeRecordsCommunicationsCanonicalization.find((x) => x.candidateKey === key);
      expect(d?.decision).toBe('MERGE');
      expect(d?.targetCandidateKey).toBe('BOF-07-007');
    }
  });

  it('models declared record as a relationship rather than duplicate content', () => {
    const d = knowledgeRecordsCommunicationsCanonicalization.find((x) => x.candidateKey === 'BOF-25-005');
    expect(d?.decision).toBe('RELATIONSHIP');
    expect(d?.proposedCanonicalName).toBe('Record Declaration');
    expect(knowledgeRecordsCommunicationsRules.join(' ')).toContain('never copies the underlying object');
  });

  it('separates disposition request from retention disposition decision', () => {
    expect(knowledgeRecordsCommunicationsCanonicalization.find((x) => x.candidateKey === 'BOF-25-009')?.decision).toBe('VALIDATE_OBJECT');
    expect(knowledgeRecordsCommunicationsRules.join(' ')).toContain('Retention Disposition Decision');
  });

  it('normalizes reputation and public-affairs issues to one case pattern', () => {
    expect(knowledgeRecordsCommunicationsCanonicalization.find((x) => x.candidateKey === 'BOF-25-017')?.proposedCanonicalName).toBe('External Affairs Issue');
    const publicAffairs = knowledgeRecordsCommunicationsCanonicalization.find((x) => x.candidateKey === 'BOF-25-018');
    expect(publicAffairs?.decision).toBe('MERGE');
    expect(publicAffairs?.targetCandidateKey).toBe('BOF-25-017');
  });

  it('treats investor engagement as stakeholder engagement evidence', () => {
    const d = knowledgeRecordsCommunicationsCanonicalization.find((x) => x.candidateKey === 'BOF-25-019');
    expect(d?.decision).toBe('RENAME');
    expect(d?.proposedCanonicalName).toBe('Stakeholder Engagement');
    expect(knowledgeRecordsCommunicationsModel.find((x) => x.modelId === 'KRC-STAKEHOLDER-ENGAGEMENT')?.kind).toBe('event-evidence');
  });
});
