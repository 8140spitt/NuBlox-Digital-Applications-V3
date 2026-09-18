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
    expect(coverageAuditSummary.governedFamilyCount).toBe(29);
    expect(coverageAuditSummary.partialFamilyCount).toBe(0);
    expect(coverageAuditSummary.candidateOnlyFamilyCount).toBe(0);
    expect(coverageAuditSummary.governedFamilyCount + coverageAuditSummary.partialFamilyCount + coverageAuditSummary.candidateOnlyFamilyCount).toBe(29);
  });

  it('proves every candidate in the real register has a governed baseline decision', () => {
    expect(coverageAuditSummary.candidateOccurrences).toBe(750);
    expect(coverageAuditSummary.baselineDecisionCount).toBe(750);
    expect(coverageAuditSummary.baselineUndecidedCount).toBe(0);
    expect(coverageAuditSummary.baselineDecisionCoveragePct).toBe(100);
    expect(new Set(governedCanonicalizationDecisions.map((entry) => entry.candidateKey)).size).toBe(750);
  });

  it('proves the external benchmark and standards architecture challenge is complete', () => {
    expect(coverageAuditSummary.externalBenchmark.requiredDomains).toBe(29);
    expect(coverageAuditSummary.externalBenchmark.registeredBenchmarks).toBeGreaterThanOrEqual(23);
    expect(coverageAuditSummary.externalBenchmark.legacySapCapabilityRows).toBe(64);
    expect(coverageAuditSummary.externalBenchmark.sapV3MappedRows).toBe(64);
    expect(coverageAuditSummary.externalBenchmark.sapV3ChallengedRows).toBe(64);
    expect(coverageAuditSummary.externalBenchmark.sapV3ClosedRows).toBe(0);
    expect(coverageAuditSummary.externalBenchmark.challengedBenchmarks).toBe(23);
    expect(coverageAuditSummary.externalBenchmark.registeredBenchmarksPending).toBe(0);
    expect(coverageAuditSummary.externalBenchmark.inProgressBenchmarks).toBe(0);
    expect(coverageAuditSummary.externalBenchmark.benchmarkGapCount).toBe(29);
    expect(coverageAuditSummary.externalBenchmark.benchmarkGapResolvedCount).toBe(29);
    expect(coverageAuditSummary.externalBenchmark.benchmarkGapOpenCount).toBe(0);
    expect(coverageAuditSummary.externalBenchmark.standardsChallengeCount).toBe(12);
    expect(coverageAuditSummary.externalBenchmark.standardsChallengedCount).toBe(12);
    expect(coverageAuditSummary.externalBenchmark.standardsOpenCount).toBe(0);
    expect(coverageAuditSummary.externalBenchmark.rejectedVendorPatternCount).toBe(12);
    expect(coverageAuditSummary.externalBenchmark.rejectedVendorPatternRecordedCount).toBe(12);
    expect(coverageAuditSummary.externalBenchmark.rejectedVendorPatternOpenCount).toBe(0);
    expect(coverageAuditSummary.externalBenchmark.state).toBe('architecture-challenge-complete');
  });

  it('keeps known convergence gaps visible while promoting governed families', () => {
    const states = new Map(familyCoverageAudit.map((family) => [family.id, family.semanticModelState]));
    expect(states.get('BOF-03')).toBe('governed-semantic-model');
    expect(states.get('BOF-05')).toBe('governed-semantic-model');
    expect(states.get('BOF-12')).toBe('governed-semantic-model');
    expect(states.get('BOF-13')).toBe('governed-semantic-model');
    expect(states.get('BOF-14')).toBe('governed-semantic-model');
    expect(states.get('BOF-20')).toBe('governed-semantic-model');
    expect(states.get('BOF-21')).toBe('governed-semantic-model');
    expect(states.get('BOF-22')).toBe('governed-semantic-model');
    expect(states.get('BOF-25')).toBe('governed-semantic-model');
    expect(states.get('BOF-04')).toBe('governed-semantic-model');
    expect(states.get('BOF-02')).toBe('governed-semantic-model');
    expect(states.get('BOF-23')).toBe('governed-semantic-model');
    expect(states.get('BOF-24')).toBe('governed-semantic-model');
    expect(states.get('BOF-26')).toBe('governed-semantic-model');
    expect(states.get('BOF-18')).toBe('governed-semantic-model');
    expect(states.get('BOF-27')).toBe('governed-semantic-model');
    expect(states.get('BOF-29')).toBe('governed-semantic-model');
  });
});
