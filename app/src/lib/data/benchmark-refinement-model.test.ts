import { describe, expect, it } from 'vitest';
import {
  benchmarkRefinementModel,
  benchmarkRefinementRules,
  validateBenchmarkRefinementModel
} from './benchmark-refinement-model';

describe('benchmark-driven canonical refinements', () => {
  it('is internally valid and traceable back to accepted benchmark gaps', () => {
    expect(validateBenchmarkRefinementModel()).toBe(true);
    expect(benchmarkRefinementModel.length).toBeGreaterThanOrEqual(10);
  });

  it('adds explicit demand and supply planning without collapsing execution truth', () => {
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'PLN-DEMAND-PLAN')?.kind).toBe('plan');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'PLN-SUPPLY-PLAN')?.kind).toBe('plan');
    expect(benchmarkRefinementRules.join(' ')).toContain('Planning truth remains separate from execution truth');
  });

  it('adds treasury risk semantics without changing ledger or bank evidence truth', () => {
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'TREASURY-EXPOSURE')?.kind).toBe('projection');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'TREASURY-HEDGE-RELATIONSHIP')?.kind).toBe('relationship');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'TREASURY-MARKET-DATA-SNAPSHOT')?.kind).toBe('reference-snapshot');
  });

  it('adds governed stewardship and reversible merge lineage rather than a second master store', () => {
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'MDG-STEWARDSHIP-CASE')?.kind).toBe('governance-case');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'MDG-DUPLICATE-CANDIDATE')?.kind).toBe('event-evidence');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'MDG-MERGE-DECISION')?.kind).toBe('event-evidence');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'MDG-IDENTITY-REDIRECT')?.kind).toBe('relationship');
  });
});
