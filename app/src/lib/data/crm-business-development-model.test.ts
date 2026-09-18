import { describe, expect, it } from 'vitest';
import { crmBusinessDevelopmentCanonicalization } from './crm-business-development-canonicalization';
import {
  crmBusinessDevelopmentModel,
  crmRelationships,
  crmRules,
  validateCrmBusinessDevelopmentModel
} from './crm-business-development-model';

describe('CRM and business development semantic model', () => {
  it('is internally valid and covers all BOF-03 candidates', () => {
    expect(validateCrmBusinessDevelopmentModel()).toBe(true);
    const decided = new Set(
      crmBusinessDevelopmentCanonicalization.map((entry) => entry.candidateKey)
    );
    expect(decided.size).toBe(17);
    for (let i = 1; i <= 17; i += 1) {
      expect(decided.has(`BOF-03-${String(i).padStart(3, '0')}`)).toBe(true);
    }
    expect(crmRelationships.length).toBeGreaterThanOrEqual(12);
  });

  it('does not create duplicate customer/account organisation masters', () => {
    const rules = crmRules.join(' ');
    expect(rules).toContain(
      'Prospect, customer and account terminology never creates duplicate Party or Organisation masters'
    );
    for (const key of ['BOF-03-003', 'BOF-03-016', 'BOF-03-017']) {
      const decision = crmBusinessDevelopmentCanonicalization.find(
        (entry) => entry.candidateKey === key
      );
      expect(decision?.decision).toBe('MERGE');
      expect(decision?.targetCandidateKey).toBe('BOF-01-016');
    }
  });

  it('keeps Lead, Opportunity and Pursuit separate', () => {
    expect(
      crmBusinessDevelopmentModel.find((entry) => entry.modelId === 'CRM-LEAD')?.canonicalName
    ).toBe('Lead');
    expect(
      crmBusinessDevelopmentModel.find((entry) => entry.modelId === 'CRM-OPPORTUNITY')
        ?.canonicalName
    ).toBe('Opportunity');
    expect(
      crmBusinessDevelopmentModel.find((entry) => entry.modelId === 'CRM-PURSUIT')?.canonicalName
    ).toBe('Pursuit');
    expect(crmRules.join(' ')).toContain('Lead, Opportunity and Pursuit are separate identities');
  });

  it('keeps CRM work separate from project, service and shared workflow work', () => {
    const activity = crmBusinessDevelopmentModel.find((entry) => entry.modelId === 'CRM-ACTIVITY');
    expect(activity?.kind).toBe('work');
    expect(activity?.governance.join(' ')).toContain('Project Schedule Activity');
    expect(activity?.governance.join(' ')).toContain('Work Order');
    expect(activity?.governance.join(' ')).toContain('Work Item');
  });

  it('treats decisions and interactions as evidence and forecasts as projections', () => {
    expect(
      crmBusinessDevelopmentModel.find((entry) => entry.modelId === 'CRM-BID-DECISION')?.kind
    ).toBe('event-evidence');
    expect(
      crmBusinessDevelopmentModel.find((entry) => entry.modelId === 'CRM-INTERACTION')?.kind
    ).toBe('event-evidence');
    expect(
      crmBusinessDevelopmentModel.find((entry) => entry.modelId === 'CRM-PIPELINE-SNAPSHOT')?.kind
    ).toBe('projection');
    expect(
      crmBusinessDevelopmentModel.find((entry) => entry.modelId === 'CRM-FORECAST-SNAPSHOT')?.kind
    ).toBe('projection');
  });

  it('normalizes Complaint into Customer Case', () => {
    const complaint = crmBusinessDevelopmentCanonicalization.find(
      (entry) => entry.candidateKey === 'BOF-03-015'
    );
    expect(complaint?.decision).toBe('MERGE');
    expect(complaint?.targetCandidateKey).toBe('BOF-03-014');
  });
});
