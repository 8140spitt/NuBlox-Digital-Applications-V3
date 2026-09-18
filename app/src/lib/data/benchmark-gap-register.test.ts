import { describe, expect, it } from 'vitest';
import {
  benchmarkGapRegister,
  benchmarkGapSummary,
  validateBenchmarkGapRegister
} from './benchmark-gap-register';

describe('benchmark gap governance', () => {
  it('keeps benchmark findings as explicit controlled architecture decisions', () => {
    expect(validateBenchmarkGapRegister()).toBe(true);
    expect(benchmarkGapSummary.gapCount).toBe(16);
    expect(benchmarkGapSummary.resolvedCount).toBe(16);
    expect(benchmarkGapSummary.openCount).toBe(0);
  });

  it('accepts only the cross-enterprise semantic gaps that are already justified', () => {
    expect(benchmarkGapSummary.acceptedRefinementCount).toBe(11);
    expect(benchmarkGapSummary.contextualExtensionCount).toBe(5);
    expect(benchmarkGapRegister.filter((gap) => gap.disposition === 'accepted-refinement').every((gap) => gap.state === 'resolved')).toBe(true);
    expect(benchmarkGapRegister.find((gap) => gap.id === 'BG-001')?.disposition).toBe('accepted-refinement');
    expect(benchmarkGapRegister.find((gap) => gap.id === 'BG-002')?.disposition).toBe('accepted-refinement');
    expect(benchmarkGapRegister.find((gap) => gap.id === 'BG-003')?.disposition).toBe('accepted-refinement');
  });

  it('records cross-market corroboration before promoting previously vendor-sensitive gaps', () => {
    expect(benchmarkGapSummary.crossBenchmarkRequiredCount).toBe(0);
    for (const id of ['BG-004', 'BG-005', 'BG-006']) {
      const gap = benchmarkGapRegister.find((entry) => entry.id === id);
      expect(gap?.disposition).toBe('accepted-refinement');
      expect(gap?.state).toBe('resolved');
      expect((gap?.sourceBenchmarks.length ?? 0)).toBeGreaterThanOrEqual(2);
    }
  });
});
