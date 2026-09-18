import { describe, expect, it } from 'vitest';
import { foundationCanonicalization } from './foundation-canonicalization';
import { builtEnvironmentCanonicalization } from './built-environment-canonicalization';
import { qhseAssuranceCanonicalization } from './qhse-assurance-canonicalization';
import { siteFieldOperationsCanonicalization } from './site-field-operations-canonicalization';
import {
  siteFieldOperationsModel,
  siteFieldOperationsRules,
  validateSiteFieldOperationsModel
} from './site-field-operations-model';

describe('site, field and construction operations semantic model', () => {
  it('is internally valid and semantically covers all 26 BOF-12 candidates', () => {
    expect(validateSiteFieldOperationsModel()).toBe(true);
    const candidates = new Set(siteFieldOperationsModel.flatMap((x) => x.candidateKeys));
    expect([...candidates].filter((x) => x.startsWith('BOF-12-'))).toHaveLength(26);
  });

  it('has explicit canonicalization decisions for all 26 BOF-12 candidates across governed baselines', () => {
    const decisions = [
      ...foundationCanonicalization,
      ...builtEnvironmentCanonicalization,
      ...qhseAssuranceCanonicalization,
      ...siteFieldOperationsCanonicalization
    ];
    const decided = new Set(decisions.map((x) => x.candidateKey));
    for (let i=1;i<=26;i+=1) {
      const key = 'BOF-12-' + String(i).padStart(3,'0');
      expect(decided.has(key)).toBe(true);
    }
  });

  it('reuses site, stage, zone, permit and isolation identities', () => {
    expect(foundationCanonicalization.find((x) => x.candidateKey === 'BOF-12-001')?.targetCandidateKey).toBe('BOF-16-003');
    expect(foundationCanonicalization.find((x) => x.candidateKey === 'BOF-12-002')?.targetCandidateKey).toBe('BOF-06-007');
    expect(builtEnvironmentCanonicalization.find((x) => x.candidateKey === 'BOF-12-003')?.targetCandidateKey).toBe('BOF-16-010');
    expect(qhseAssuranceCanonicalization.find((x) => x.candidateKey === 'BOF-12-017')?.targetCandidateKey).toBe('BOF-13-021');
    expect(qhseAssuranceCanonicalization.find((x) => x.candidateKey === 'BOF-12-018')?.targetCandidateKey).toBe('BOF-13-022');
  });

  it('reuses progress, inventory, delivery, information, review and evidence patterns', () => {
    expect(siteFieldOperationsCanonicalization.find((x) => x.candidateKey === 'BOF-12-009')?.targetCandidateKey).toBe('BOF-06-016');
    expect(siteFieldOperationsCanonicalization.find((x) => x.candidateKey === 'BOF-12-012')?.targetCandidateKey).toBe('BOF-10-022');
    expect(siteFieldOperationsCanonicalization.find((x) => x.candidateKey === 'BOF-12-013')?.targetCandidateKey).toBe('BOF-10-033');
    expect(siteFieldOperationsCanonicalization.find((x) => x.candidateKey === 'BOF-12-015')?.targetCandidateKey).toBe('BOF-07-007');
    expect(siteFieldOperationsCanonicalization.find((x) => x.candidateKey === 'BOF-12-016')?.targetCandidateKey).toBe('BOF-07-023');
    expect(siteFieldOperationsCanonicalization.find((x) => x.candidateKey === 'BOF-12-022')?.targetCandidateKey).toBe('BOF-28-007');
    expect(siteFieldOperationsCanonicalization.find((x) => x.candidateKey === 'BOF-12-023')?.targetCandidateKey).toBe('BOF-28-007');
  });

  it('converges project and field constraints without collapsing development constraint', () => {
    const projectConstraint = siteFieldOperationsCanonicalization.find((x) => x.candidateKey === 'BOF-06-025');
    const fieldConstraint = siteFieldOperationsCanonicalization.find((x) => x.candidateKey === 'BOF-12-020');
    expect(projectConstraint?.decision).toBe('RENAME');
    expect(projectConstraint?.proposedCanonicalName).toBe('Delivery Constraint');
    expect(fieldConstraint?.decision).toBe('MERGE');
    expect(fieldConstraint?.targetCandidateKey).toBe('BOF-06-025');
    expect(siteFieldOperationsRules.join(' ')).toContain('Development Constraint remains a separate');
  });

  it('keeps field labour operational evidence separate from HCM time/payroll truth', () => {
    expect(siteFieldOperationsCanonicalization.find((x) => x.candidateKey === 'BOF-12-010')?.decision).toBe('EVENT_EVIDENCE');
    expect(siteFieldOperationsRules.join(' ')).toContain('distinct from HCM Attendance');
  });

  it('keeps temporary works control identity separate from product/material Item and permanent Asset', () => {
    const temporaryWorks = siteFieldOperationsCanonicalization.find((x) => x.candidateKey === 'BOF-12-014');
    expect(temporaryWorks?.decision).toBe('RENAME');
    expect(temporaryWorks?.proposedCanonicalName).toBe('Temporary Works Control Item');
    expect(siteFieldOperationsRules.join(' ')).toContain('not canonical Product/Material Item');
  });
});
