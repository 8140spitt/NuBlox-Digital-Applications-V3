import { describe, expect, it } from 'vitest';
import { peopleHcmCanonicalization } from './people-hcm-canonicalization';
import {
  peopleHcmModel,
  peopleHcmRelationships,
  peopleHcmRules,
  validatePeopleHcmModel
} from './people-hcm-model';

describe('people, HCM, competence, time, payroll and expenses semantic model', () => {
  it('is internally valid and covers all 43 BOF-18 candidates', () => {
    expect(validatePeopleHcmModel()).toBe(true);
    const decided = new Set(peopleHcmCanonicalization.map((entry) => entry.candidateKey));
    expect(decided.size).toBe(43);
    for (let i = 1; i <= 43; i += 1) {
      expect(decided.has(`BOF-18-${String(i).padStart(3, '0')}`)).toBe(true);
    }
    expect(peopleHcmRelationships.length).toBeGreaterThanOrEqual(30);
  });

  it('reuses canonical Person for workers and candidates', () => {
    const candidate = peopleHcmCanonicalization.find(
      (entry) => entry.candidateKey === 'BOF-18-036'
    );
    expect(candidate?.decision).toBe('MERGE');
    expect(candidate?.targetCandidateKey).toBe('BOF-01-003');
    expect(peopleHcmRules.join(' ')).toContain('Person is the canonical human identity');
  });

  it('separates Position, Job Profile and business Role Assignment', () => {
    expect(peopleHcmModel.find((entry) => entry.modelId === 'HCM-POSITION')?.canonicalName).toBe(
      'Position'
    );
    expect(peopleHcmModel.find((entry) => entry.modelId === 'HCM-JOB-PROFILE')?.canonicalName).toBe(
      'Job Profile'
    );
    expect(peopleHcmRules.join(' ')).toContain('Role Assignment');
  });

  it('keeps competence definition, learning evidence and person attainment separate', () => {
    expect(
      peopleHcmModel.find((entry) => entry.modelId === 'HCM-COMPETENCE-DEFINITION')?.kind
    ).toBe('controlled-definition');
    expect(peopleHcmModel.find((entry) => entry.modelId === 'HCM-LEARNING-RECORD')?.kind).toBe(
      'event-evidence'
    );
    expect(peopleHcmModel.find((entry) => entry.modelId === 'HCM-PERSON-COMPETENCE')?.kind).toBe(
      'relationship'
    );
    expect(peopleHcmRules.join(' ')).toContain(
      'Learning completion never automatically proves competence'
    );
  });

  it('normalizes credential types and CPD/training records', () => {
    for (const key of ['BOF-18-011', 'BOF-18-012', 'BOF-18-013']) {
      expect(
        peopleHcmCanonicalization.find((entry) => entry.candidateKey === key)?.targetCandidateKey
      ).toBe('BOF-18-010');
    }
    expect(
      peopleHcmCanonicalization.find((entry) => entry.candidateKey === 'BOF-18-017')
        ?.targetCandidateKey
    ).toBe('BOF-18-016');
  });

  it('keeps attendance, time and payroll as separate truth layers', () => {
    expect(peopleHcmModel.find((entry) => entry.modelId === 'HCM-ATTENDANCE')?.kind).toBe(
      'event-evidence'
    );
    expect(peopleHcmModel.find((entry) => entry.modelId === 'HCM-TIME-ENTRY')?.kind).toBe(
      'transaction'
    );
    expect(peopleHcmModel.find((entry) => entry.modelId === 'HCM-TIMESHEET')?.kind).toBe(
      'transaction'
    );
    expect(peopleHcmModel.find((entry) => entry.modelId === 'HCM-PAYROLL-RESULT')?.kind).toBe(
      'event-evidence'
    );
  });

  it('treats availability as projection and payslip as controlled information', () => {
    expect(
      peopleHcmCanonicalization.find((entry) => entry.candidateKey === 'BOF-18-019')?.decision
    ).toBe('PROJECTION');
    const payslip = peopleHcmCanonicalization.find((entry) => entry.candidateKey === 'BOF-18-033');
    expect(payslip?.decision).toBe('MERGE');
    expect(payslip?.targetCandidateKey).toBe('BOF-07-007');
  });
});
