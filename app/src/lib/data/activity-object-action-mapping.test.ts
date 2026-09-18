import { describe, expect, it } from 'vitest';
import {
  activityObjectActionMappings,
  activityObjectActionSummary,
  l2AggregateRoutes,
  ambiguousSubfunctions,
  unmappedSubfunctions,
  validateActivityObjectActionMapping
} from './activity-object-action-mapping';

describe('L2/L3 activity to canonical object/action mapping', () => {
  it('maps every source function, L2 sub-function and activity', () => {
    expect(validateActivityObjectActionMapping()).toBe(true);
    expect(activityObjectActionSummary.sourceFunctionCount).toBe(29);
    expect(activityObjectActionSummary.sourceSubfunctionCount).toBe(353);
    expect(activityObjectActionSummary.sourceActivityCount).toBe(1510);
    expect(activityObjectActionSummary.mappedFunctionCount).toBe(29);
    expect(activityObjectActionSummary.mappedSubfunctionCount).toBe(353);
    expect(activityObjectActionSummary.mappedActivityCount).toBe(1510);
    expect(unmappedSubfunctions).toEqual([]);
    expect(ambiguousSubfunctions).toEqual([]);
  });

  it('routes every L2 rule to a frozen aggregate and every activity to a canonical object focus', () => {
    expect(activityObjectActionSummary.invalidAggregateRouteCount).toBe(0);
    expect(activityObjectActionSummary.invalidObjectPlacementCount).toBe(0);
    expect(activityObjectActionSummary.unsafeProjectionCommandCount).toBe(0);
    expect(activityObjectActionSummary.invalidObjectModelRouteCount).toBe(0);
    expect(activityObjectActionSummary.ambiguousSubfunctionCount).toBe(0);
    expect(l2AggregateRoutes.length).toBeGreaterThanOrEqual(150);
    expect(activityObjectActionMappings.every((entry) => entry.aggregateId.startsWith('AGG-'))).toBe(true);
    expect(activityObjectActionMappings.every((entry) => entry.objectModelId.length > 0)).toBe(true);
  });

  it('encodes command/query and authority/evidence semantics', () => {
    expect(activityObjectActionSummary.commandCount).toBeGreaterThan(0);
    expect(activityObjectActionSummary.queryCount).toBeGreaterThan(0);
    expect(activityObjectActionSummary.approvalControlledCount).toBeGreaterThan(0);
    expect(activityObjectActionSummary.decisionControlledCount).toBeGreaterThan(0);
    expect(activityObjectActionMappings.every((entry) => entry.writeAuthority.length > 0)).toBe(true);
    expect(activityObjectActionMappings.every((entry) => entry.transactionRule.length > 0)).toBe(true);
  });

  it('preserves one stable primary workspace home per L2', () => {
    const homes = new Map<string, Set<string>>();
    for (const entry of activityObjectActionMappings) {
      if (!homes.has(entry.subfunctionId)) homes.set(entry.subfunctionId, new Set());
      homes.get(entry.subfunctionId)?.add(entry.functionId);
    }
    expect([...homes.values()].every((functions) => functions.size === 1)).toBe(true);
  });
});
