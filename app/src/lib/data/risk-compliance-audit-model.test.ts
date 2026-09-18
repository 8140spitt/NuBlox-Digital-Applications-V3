import { describe, expect, it } from 'vitest';
import { riskComplianceAuditCanonicalization } from './risk-compliance-audit-canonicalization';
import {
  riskComplianceAuditModel,
  riskComplianceAuditRules,
  validateRiskComplianceAuditModel
} from './risk-compliance-audit-model';

describe('enterprise risk, compliance, internal control and audit model', () => {
  it('is internally valid and covers all 17 BOF-21 candidates', () => {
    expect(validateRiskComplianceAuditModel()).toBe(true);
    const decided = new Set(riskComplianceAuditCanonicalization.map((x) => x.candidateKey));
    expect(decided.size).toBe(17);
    for (let i = 1; i <= 17; i += 1) {
      expect(decided.has(`BOF-21-${String(i).padStart(3, '0')}`)).toBe(true);
    }
  });

  it('separates Risk identity from assessment evidence and treatment planning', () => {
    expect(riskComplianceAuditModel.find((x) => x.modelId === 'RISK-ENTERPRISE-RISK')?.kind).toBe('risk');
    expect(riskComplianceAuditModel.find((x) => x.modelId === 'RISK-ASSESSMENT')?.kind).toBe('event-evidence');
    expect(riskComplianceAuditModel.find((x) => x.modelId === 'RISK-TREATMENT-PLAN')?.kind).toBe('plan');
    expect(riskComplianceAuditRules.join(' ')).toContain('current rating is derived');
  });

  it('separates regulatory obligation, requirement, assessment and evidence', () => {
    expect(riskComplianceAuditModel.find((x) => x.modelId === 'COMP-REGULATORY-OBLIGATION')?.kind).toBe('obligation');
    expect(riskComplianceAuditModel.find((x) => x.modelId === 'COMP-REQUIREMENT')?.kind).toBe('controlled-requirement');
    expect(riskComplianceAuditModel.find((x) => x.modelId === 'COMP-ASSESSMENT')?.kind).toBe('event-evidence');
    expect(riskComplianceAuditModel.find((x) => x.modelId === 'COMP-EVIDENCE')?.kind).toBe('event-evidence');
  });

  it('keeps Internal Control and Control Test distinct', () => {
    expect(riskComplianceAuditCanonicalization.find((x) => x.candidateKey === 'BOF-21-008')?.decision).toBe('VALIDATE_OBJECT');
    expect(riskComplianceAuditCanonicalization.find((x) => x.candidateKey === 'BOF-21-009')?.decision).toBe('EVENT_EVIDENCE');
  });

  it('normalizes Audit Plan onto Assurance Plan while preserving Audit Engagement', () => {
    const auditPlan = riskComplianceAuditCanonicalization.find((x) => x.candidateKey === 'BOF-21-011');
    expect(auditPlan?.decision).toBe('MERGE');
    expect(auditPlan?.targetCandidateKey).toBe('BOF-21-010');
    expect(riskComplianceAuditCanonicalization.find((x) => x.candidateKey === 'BOF-21-012')?.proposedCanonicalName).toBe('Audit Engagement');
  });

  it('normalizes Fraud and Conduct into one Integrity Case pattern', () => {
    expect(riskComplianceAuditCanonicalization.find((x) => x.candidateKey === 'BOF-21-015')?.proposedCanonicalName).toBe('Integrity Case');
    const conduct = riskComplianceAuditCanonicalization.find((x) => x.candidateKey === 'BOF-21-016');
    expect(conduct?.decision).toBe('MERGE');
    expect(conduct?.targetCandidateKey).toBe('BOF-21-015');
  });
});
