import { describe, expect, it } from 'vitest';
import { buildingSafetyRegulatoryCanonicalization } from './building-safety-regulatory-canonicalization';
import {
  buildingSafetyRegulatoryModel,
  buildingSafetyRegulatoryRules,
  validateBuildingSafetyRegulatoryModel
} from './building-safety-regulatory-model';

describe('building safety, regulatory control and statutory assurance model', () => {
  it('is internally valid and covers all 15 BOF-14 candidates', () => {
    expect(validateBuildingSafetyRegulatoryModel()).toBe(true);
    const decided = new Set(
      buildingSafetyRegulatoryCanonicalization
        .filter((x) => x.candidateKey.startsWith('BOF-14-'))
        .map((x) => x.candidateKey)
    );
    expect(decided.size).toBe(15);
    for (let i = 1; i <= 15; i += 1)
      expect(decided.has(`BOF-14-${String(i).padStart(3, '0')}`)).toBe(true);
  });

  it('keeps statutory dutyholder context separate from generic identity and permissions', () => {
    const dutyholder = buildingSafetyRegulatoryModel.find(
      (x) => x.modelId === 'REG-DUTYHOLDER-ASSIGNMENT'
    );
    expect(dutyholder?.kind).toBe('relationship');
    expect(dutyholder?.governance.join(' ')).toContain('generic Role Assignment');
    expect(buildingSafetyRegulatoryRules.join(' ')).toContain('permission and delegated authority');
  });

  it('normalizes building control application and regulatory inspection to shared patterns', () => {
    expect(
      buildingSafetyRegulatoryCanonicalization.find((x) => x.candidateKey === 'BOF-14-005')
        ?.targetCandidateKey
    ).toBe('BOF-14-004');
    expect(
      buildingSafetyRegulatoryCanonicalization.find((x) => x.candidateKey === 'BOF-14-007')
        ?.targetCandidateKey
    ).toBe('BOF-13-003');
  });

  it('keeps statutory and delivery completion certificates explicitly distinct', () => {
    const completion = buildingSafetyRegulatoryCanonicalization.find(
      (x) => x.candidateKey === 'BOF-14-013'
    );
    expect(completion?.decision).toBe('RENAME');
    expect(completion?.proposedCanonicalName).toBe('Statutory Completion Certificate');
    expect(buildingSafetyRegulatoryRules.join(' ')).toContain(
      'distinct from Delivery Completion Certificate'
    );
  });

  it('treats golden thread as a projection and regulatory submission as shared submission evidence', () => {
    expect(
      buildingSafetyRegulatoryCanonicalization.find((x) => x.candidateKey === 'BOF-14-014')
        ?.decision
    ).toBe('PROJECTION');
    const submission = buildingSafetyRegulatoryCanonicalization.find(
      (x) => x.candidateKey === 'BOF-14-015'
    );
    expect(submission?.decision).toBe('MERGE');
    expect(submission?.targetCandidateKey).toBe('BOF-27-013');
  });

  it('keeps regulatory decision and mandatory occurrence reporting as evidence', () => {
    expect(
      buildingSafetyRegulatoryCanonicalization.find((x) => x.candidateKey === 'BOF-14-011')
        ?.decision
    ).toBe('EVENT_EVIDENCE');
    expect(
      buildingSafetyRegulatoryCanonicalization.find((x) => x.candidateKey === 'BOF-14-009')
        ?.proposedCanonicalName
    ).toBe('Mandatory Occurrence Report');
  });
});
