import { describe, expect, it } from 'vitest';
import {
  sharedWorkEvidenceModel,
  sharedWorkEvidenceRelationships,
  sharedWorkEvidenceRules,
  validateSharedWorkEvidenceModel
} from './shared-work-evidence-model';

describe('shared work, decision, evidence and retention semantic model', () => {
  it('is internally valid and covers both candidate families', () => {
    expect(validateSharedWorkEvidenceModel()).toBe(true);
    expect(new Set(sharedWorkEvidenceModel.map((entry) => entry.modelId)).size).toBe(
      sharedWorkEvidenceModel.length
    );
    expect(sharedWorkEvidenceRelationships.length).toBeGreaterThanOrEqual(35);

    const candidateKeys = sharedWorkEvidenceModel.flatMap((entry) => entry.candidateKeys);
    expect(candidateKeys.filter((key) => key.startsWith('BOF-27-'))).toHaveLength(15);
    expect(candidateKeys.filter((key) => key.startsWith('BOF-28-'))).toHaveLength(15);
  });

  it('keeps workflow runtime separate from domain truth', () => {
    expect(
      sharedWorkEvidenceModel.find((entry) => entry.modelId === 'WORK-WORKFLOW-INSTANCE')?.kind
    ).toBe('workflow-runtime');
    expect(sharedWorkEvidenceModel.find((entry) => entry.modelId === 'WORK-WORK-ITEM')?.kind).toBe(
      'work'
    );
    expect(sharedWorkEvidenceRules.join(' ')).toContain(
      'never becomes the authoritative business object'
    );
    expect(sharedWorkEvidenceRules.join(' ')).toContain('Project Schedule Activity');
    expect(sharedWorkEvidenceRules.join(' ')).toContain('Work Order');
  });

  it('separates assignment, delegation and authority', () => {
    expect(sharedWorkEvidenceModel.find((entry) => entry.modelId === 'WORK-ASSIGNMENT')?.kind).toBe(
      'relationship'
    );
    expect(sharedWorkEvidenceModel.find((entry) => entry.modelId === 'WORK-DELEGATION')?.kind).toBe(
      'relationship'
    );
    expect(sharedWorkEvidenceRules.join(' ')).toContain('assignment alone never authorises');
    expect(sharedWorkEvidenceRules.join(' ')).toContain(
      'Work Delegation does not grant Delegated Authority'
    );
    expect(sharedWorkEvidenceRelationships.some((r) => r.to === 'AUTH-DELEGATED-AUTHORITY')).toBe(
      true
    );
  });

  it('separates requests, responses and immutable decisions', () => {
    for (const id of [
      'WORK-REVIEW-REQUEST',
      'WORK-APPROVAL-REQUEST',
      'WORK-DECISION-REQUEST',
      'WORK-REQUEST-RESPONSE',
      'WORK-DECISION'
    ]) {
      expect(sharedWorkEvidenceModel.find((entry) => entry.modelId === id)).toBeTruthy();
    }
    expect(sharedWorkEvidenceModel.find((entry) => entry.modelId === 'WORK-DECISION')?.kind).toBe(
      'decision-evidence'
    );
    expect(sharedWorkEvidenceRules.join(' ')).toContain('Response is not Decision');
  });

  it('distinguishes business, audit, change and transport events', () => {
    expect(
      sharedWorkEvidenceModel.find((entry) => entry.modelId === 'EVID-BUSINESS-EVENT')?.kind
    ).toBe('event-evidence');
    expect(
      sharedWorkEvidenceModel.find((entry) => entry.modelId === 'EVID-AUDIT-EVENT')?.kind
    ).toBe('event-evidence');
    expect(
      sharedWorkEvidenceModel.find((entry) => entry.modelId === 'EVID-CHANGE-EVENT')?.kind
    ).toBe('event-evidence');
    expect(
      sharedWorkEvidenceModel.find((entry) => entry.modelId === 'EVID-OUTBOX-MESSAGE')?.kind
    ).toBe('integration-evidence');
    expect(sharedWorkEvidenceRules.join(' ')).toContain(
      'have different purposes and are not interchangeable'
    );
  });

  it('preserves evidence and prevents disposition under legal hold', () => {
    expect(sharedWorkEvidenceRules.join(' ')).toContain('append-only');
    expect(sharedWorkEvidenceRules.join(' ')).toContain(
      'Active Legal Hold blocks otherwise-eligible disposition'
    );
    expect(
      sharedWorkEvidenceRelationships.some(
        (r) => r.from === 'EVID-RETENTION-DISPOSITION' && r.to === 'EVID-LEGAL-HOLD-LINK'
      )
    ).toBe(true);
    expect(sharedWorkEvidenceModel.find((entry) => entry.modelId === 'EVID-CORRECTION')?.kind).toBe(
      'event-evidence'
    );
    expect(sharedWorkEvidenceModel.find((entry) => entry.modelId === 'EVID-REVERSAL')?.kind).toBe(
      'event-evidence'
    );
  });
});
