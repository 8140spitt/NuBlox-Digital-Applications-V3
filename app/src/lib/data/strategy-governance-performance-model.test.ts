import { describe, expect, it } from 'vitest';
import { strategyGovernancePerformanceCanonicalization } from './strategy-governance-performance-canonicalization';
import {
  strategyGovernancePerformanceModel,
  strategyGovernancePerformanceRules,
  validateStrategyGovernancePerformanceModel
} from './strategy-governance-performance-model';

describe('strategy, governance and enterprise performance semantic model', () => {
  it('is internally valid and covers all 20 BOF-02 candidates', () => {
    expect(validateStrategyGovernancePerformanceModel()).toBe(true);
    const decided = new Set(
      strategyGovernancePerformanceCanonicalization.map((x) => x.candidateKey)
    );
    expect(decided.size).toBe(20);
    for (let i = 1; i <= 20; i += 1)
      expect(decided.has(`BOF-02-${String(i).padStart(3, '0')}`)).toBe(true);
  });

  it('separates KPI definition, target, observation and snapshot', () => {
    expect(
      strategyGovernancePerformanceModel.find((x) => x.modelId === 'SGP-KPI-DEFINITION')?.kind
    ).toBe('metric-definition');
    expect(
      strategyGovernancePerformanceModel.find((x) => x.modelId === 'SGP-PERFORMANCE-TARGET')?.kind
    ).toBe('target');
    expect(
      strategyGovernancePerformanceModel.find((x) => x.modelId === 'SGP-PERFORMANCE-OBSERVATION')
        ?.kind
    ).toBe('event-evidence');
    expect(
      strategyGovernancePerformanceModel.find((x) => x.modelId === 'SGP-PERFORMANCE-SNAPSHOT')?.kind
    ).toBe('projection');
  });

  it('converges governance Decision and Action onto shared project/shared-work candidates', () => {
    const decision = strategyGovernancePerformanceCanonicalization.find(
      (x) => x.candidateKey === 'BOF-02-016'
    );
    expect(decision?.decision).toBe('MERGE');
    expect(decision?.targetCandidateKey).toBe('BOF-06-023');

    const action = strategyGovernancePerformanceCanonicalization.find(
      (x) => x.candidateKey === 'BOF-02-017'
    );
    expect(action?.decision).toBe('MERGE');
    expect(action?.targetCandidateKey).toBe('BOF-06-024');
  });

  it('reuses controlled information for Policy and Governance Record', () => {
    for (const key of ['BOF-02-018', 'BOF-02-020']) {
      const d = strategyGovernancePerformanceCanonicalization.find((x) => x.candidateKey === key);
      expect(d?.decision).toBe('MERGE');
      expect(d?.targetCandidateKey).toBe('BOF-07-007');
    }
  });

  it('keeps authority framework separate from delegated authority', () => {
    const d = strategyGovernancePerformanceCanonicalization.find(
      (x) => x.candidateKey === 'BOF-02-019'
    );
    expect(d?.decision).toBe('VALIDATE_OBJECT');
    expect(d?.proposedCanonicalName).toBe('Authority Framework');
    expect(strategyGovernancePerformanceRules.join(' ')).toContain(
      'Delegated Authority is a specific grant'
    );
  });

  it('keeps governance meeting layers distinct', () => {
    expect(
      strategyGovernancePerformanceModel.find((x) => x.modelId === 'SGP-GOVERNANCE-BODY')?.kind
    ).toBe('governance-context');
    expect(
      strategyGovernancePerformanceModel.find((x) => x.modelId === 'SGP-GOVERNANCE-MEETING')?.kind
    ).toBe('governance-event');
    expect(
      strategyGovernancePerformanceCanonicalization.find((x) => x.candidateKey === 'BOF-02-015')
        ?.decision
    ).toBe('CHILD');
  });
});
