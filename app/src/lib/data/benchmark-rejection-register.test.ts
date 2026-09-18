import { describe, expect, it } from 'vitest';
import {
  benchmarkRejectionRegister,
  benchmarkRejectionSummary,
  validateBenchmarkRejectionRegister
} from './benchmark-rejection-register';

describe('benchmark vendor-pattern rejection governance', () => {
  it('records every deliberate non-adoption with rationale and preserved authority', () => {
    expect(validateBenchmarkRejectionRegister()).toBe(true);
    expect(benchmarkRejectionSummary.rejectionCount).toBe(12);
    expect(benchmarkRejectionSummary.recordedCount).toBe(12);
    expect(benchmarkRejectionSummary.openCount).toBe(0);
    expect(benchmarkRejectionRegister.every((entry) => entry.rationale.length > 0)).toBe(true);
    expect(benchmarkRejectionRegister.every((entry) => entry.preservedAuthority.length > 0)).toBe(
      true
    );
  });

  it('explicitly rejects duplicate identity and shadow-ledger patterns', () => {
    expect(benchmarkRejectionRegister.some((entry) => entry.id === 'BRJ-007')).toBe(true);
    expect(benchmarkRejectionRegister.some((entry) => entry.id === 'BRJ-009')).toBe(true);
    expect(benchmarkRejectionRegister.some((entry) => entry.id === 'BRJ-005')).toBe(true);
  });
});
