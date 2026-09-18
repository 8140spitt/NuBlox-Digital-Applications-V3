import { describe, expect, it } from 'vitest';
import {
  canonicalAggregateBoundaries,
  canonicalAggregateFreezeSummary,
  canonicalAggregateRules,
  refinementAggregateOwnership,
  validateCanonicalAggregateBoundaryFreeze
} from './canonical-aggregate-boundary-register';

describe('canonical aggregate-boundary freeze', () => {
  it('freezes aggregate ownership across all 29 canonical families', () => {
    expect(validateCanonicalAggregateBoundaryFreeze()).toBe(true);
    expect(canonicalAggregateFreezeSummary.familyCount).toBe(29);
    expect(canonicalAggregateFreezeSummary.frozenFamilyCount).toBe(29);
    expect(canonicalAggregateFreezeSummary.aggregateBoundaryCount).toBe(174);
    expect(canonicalAggregateFreezeSummary.frozenAggregateBoundaryCount).toBe(canonicalAggregateFreezeSummary.aggregateBoundaryCount);
    expect(canonicalAggregateFreezeSummary.activityDrivenOwnershipCount).toBe(75);
    expect(canonicalAggregateFreezeSummary.state).toBe('frozen');
  });

  it('assigns every benchmark-driven refinement to exactly one frozen aggregate', () => {
    expect(canonicalAggregateFreezeSummary.benchmarkRefinementCount).toBe(79);
    expect(canonicalAggregateFreezeSummary.benchmarkRefinementsAssigned).toBe(79);
    expect(Object.keys(refinementAggregateOwnership)).toHaveLength(79);
  });

  it('prevents aggregate roots and owned members from being reused as competing write boundaries', () => {
    const roots = canonicalAggregateBoundaries.map((boundary) => boundary.rootModelId);
    const owned = canonicalAggregateBoundaries.flatMap((boundary) => boundary.ownedMembers);
    const projections = canonicalAggregateBoundaries.flatMap((boundary) => boundary.projections);
    expect(new Set(roots).size).toBe(roots.length);
    expect(new Set(owned).size).toBe(owned.length);
    expect(new Set(projections).size).toBe(projections.length);
    expect(owned.some((member) => roots.includes(member))).toBe(false);
    expect(projections.some((projection) => roots.includes(projection) || owned.includes(projection))).toBe(false);
  });

  it('requires one-aggregate command transactions and read-only projections', () => {
    expect(canonicalAggregateRules.join(' ')).toContain('single command transaction writes one aggregate boundary');
    expect(canonicalAggregateRules.join(' ')).toContain('Published projections/read models are read-only');
    expect(canonicalAggregateRules.join(' ')).toContain('Workflow coordinates domain commands but never owns business state');
  });
});
