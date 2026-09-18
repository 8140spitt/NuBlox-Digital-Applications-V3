import { describe, expect, it } from 'vitest';
import {
  benchmarkGapRegister,
  benchmarkGapSummary,
  validateBenchmarkGapRegister
} from './benchmark-gap-register';

describe('benchmark gap governance', () => {
  it('keeps benchmark findings as explicit controlled architecture decisions', () => {
    expect(validateBenchmarkGapRegister()).toBe(true);
    expect(benchmarkGapSummary.gapCount).toBe(6);
    expect(benchmarkGapSummary.resolvedCount).toBe(3);
    expect(benchmarkGapSummary.openCount).toBe(3);
  });

  it('accepts only the cross-enterprise semantic gaps that are already justified', () => {
    expect(benchmarkGapSummary.acceptedRefinementCount).toBe(3);
    expect(benchmarkGapRegister.filter((gap) => gap.disposition === 'accepted-refinement').every((gap) => gap.state === 'resolved')).toBe(true);
    expect(benchmarkGapRegister.find((gap) => gap.id === 'BG-001')?.disposition).toBe('accepted-refinement');
    expect(benchmarkGapRegister.find((gap) => gap.id === 'BG-002')?.disposition).toBe('accepted-refinement');
    expect(benchmarkGapRegister.find((gap) => gap.id === 'BG-003')?.disposition).toBe('accepted-refinement');
  });

  it('requires corroboration before adopting specialist depth that could be vendor-specific', () => {
    expect(benchmarkGapSummary.crossBenchmarkRequiredCount).toBe(3);
    for (const id of ['BG-004', 'BG-005', 'BG-006']) {
      expect(benchmarkGapRegister.find((gap) => gap.id === id)?.disposition).toBe('cross-benchmark-required');
    }
  });
});
