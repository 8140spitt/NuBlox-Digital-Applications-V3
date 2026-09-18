import { describe, expect, it } from 'vitest';
import {
  coverageAuditSummary,
  endToEndChains,
  familyCoverageAudit,
  governedCanonicalizationDecisions,
  sectorLifecycle,
  specialistOverlays,
  validateCanonicalCoverageAudit
} from './canonical-coverage-audit';

describe('canonical model convergence and coverage audit', () => {
  it('is internally valid across all five governing coverage lenses', () => {
    expect(validateCanonicalCoverageAudit()).toBe(true);
    expect(familyCoverageAudit).toHaveLength(29);
    expect(coverageAuditSummary.workspaceCount).toBe(29);
    expect(coverageAuditSummary.coveredWorkspaceCount).toBe(29);
    expect(coverageAuditSummary.coveredLifecycleStageCount).toBe(sectorLifecycle.length);
    expect(coverageAuditSummary.coveredProcessChainCount).toBe(endToEndChains.length);
    expect(coverageAuditSummary.coveredSpecialistOverlayCount).toBe(specialistOverlays.length);
  });

  it('keeps the audit honest about model maturity', () => {
    expect(coverageAuditSummary.governedFamilyCount).toBe(26);
    expect(coverageAuditSummary.partialFamilyCount).toBe(1);
    expect(coverageAuditSummary.candidateOnlyFamilyCount).toBe(2);
    expect(coverageAuditSummary.governedFamilyCount + coverageAuditSummary.partialFamilyCount + coverageAuditSummary.candidateOnlyFamilyCount).toBe(29);
  });

  it('measures candidate decision coverage from the real register and governed baselines', () => {
    expect(coverageAuditSummary.candidateOccurrences).toBe(750);
    expect(coverageAuditSummary.baselineDecisionCount).toBeGreaterThan(0);
    expect(coverageAuditSummary.baselineDecisionCount).toBeLessThan(coverageAuditSummary.candidateOccurrences);
    expect(coverageAuditSummary.baselineUndecidedCount).toBe(coverageAuditSummary.candidateOccurrences - coverageAuditSummary.baselineDecisionCount);
    expect(new Set(governedCanonicalizationDecisions.map((entry) => entry.candidateKey)).size).toBe(coverageAuditSummary.baselineDecisionCount);
  });

  it('does not pretend the external benchmark study is complete', () => {
    expect(coverageAuditSummary.externalBenchmark.requiredDomains).toBe(29);
    expect(coverageAuditSummary.externalBenchmark.state).toBe('in-progress');
  });

  it('keeps known convergence gaps visible while promoting governed families', () => {
    const states = new Map(familyCoverageAudit.map((family) => [family.id, family.semanticModelState]));
    expect(states.get('BOF-03')).toBe('governed-semantic-model');
    expect(states.get('BOF-05')).toBe('governed-semantic-model');
    expect(states.get('BOF-12')).toBe('partial-semantic-model');
    expect(states.get('BOF-13')).toBe('governed-semantic-model');
    expect(states.get('BOF-14')).toBe('governed-semantic-model');
    expect(states.get('BOF-20')).toBe('governed-semantic-model');
    expect(states.get('BOF-21')).toBe('governed-semantic-model');
    expect(states.get('BOF-22')).toBe('governed-semantic-model');
    expect(states.get('BOF-25')).toBe('governed-semantic-model');
    expect(states.get('BOF-04')).toBe('governed-semantic-model');
    expect(states.get('BOF-02')).toBe('governed-semantic-model');
    expect(states.get('BOF-23')).toBe('governed-semantic-model');
    expect(states.get('BOF-18')).toBe('governed-semantic-model');
    expect(states.get('BOF-27')).toBe('governed-semantic-model');
    expect(states.get('BOF-29')).toBe('governed-semantic-model');
  });
});
