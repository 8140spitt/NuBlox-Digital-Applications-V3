import { describe, expect, it } from 'vitest';
import {
  aliasConvergenceSummary,
  exactDuplicateConvergenceAudit,
  nearAliasConvergenceAudit,
  validateCanonicalAliasConvergenceAudit
} from './canonical-alias-convergence-audit';

describe('canonical duplicate and alias convergence audit', () => {
  it('closes every exact duplicate-name group from the 750-candidate discovery register', () => {
    expect(validateCanonicalAliasConvergenceAudit()).toBe(true);
    expect(aliasConvergenceSummary.exactDuplicateGroups).toBe(26);
    expect(aliasConvergenceSummary.exactDuplicateGroupsResolved).toBe(26);
    expect(aliasConvergenceSummary.unresolvedExactDuplicateGroups).toEqual([]);
    expect(exactDuplicateConvergenceAudit.every((entry) => entry.allBaselineDecided && entry.resolved)).toBe(true);
  });

  it('keeps shared identities shared and same-word/different-meaning concepts distinct', () => {
    const byName = new Map(exactDuplicateConvergenceAudit.map((entry) => [entry.canonicalName, entry]));
    expect(byName.get('Site')?.rootKeys).toHaveLength(1);
    expect(byName.get('Call-off')?.rootKeys).toHaveLength(1);
    expect(byName.get('Risk Assessment')?.rootKeys).toHaveLength(1);
    expect(byName.get('Activity')?.rootKeys.length).toBeGreaterThan(1);
    expect(byName.get('Valuation')?.rootKeys.length).toBeGreaterThan(1);
    expect(byName.get('Completion Certificate')?.rootKeys.length).toBeGreaterThan(1);
  });

  it('closes the documented near-alias challenge set', () => {
    expect(aliasConvergenceSummary.nearAliasChallenges).toBeGreaterThanOrEqual(10);
    expect(aliasConvergenceSummary.nearAliasChallengesResolved).toBe(aliasConvergenceSummary.nearAliasChallenges);
    expect(aliasConvergenceSummary.unresolvedNearAliasChallenges).toEqual([]);
    expect(nearAliasConvergenceAudit.every((entry) => entry.allBaselineDecided && entry.resolved)).toBe(true);
  });

  it('converges known aliases without collapsing materially different concepts', () => {
    const byId = new Map(nearAliasConvergenceAudit.map((entry) => [entry.id, entry]));
    expect(byId.get('bill-of-material')?.rootKeys).toHaveLength(1);
    expect(byId.get('project-job')?.rootKeys).toHaveLength(1);
    expect(byId.get('land-parcel')?.rootKeys).toHaveLength(1);
    expect(byId.get('item-types')?.rootKeys).toHaveLength(1);
    expect(byId.get('permit-to-work')?.rootKeys).toHaveLength(1);
    expect(byId.get('asset-type-model')?.rootKeys.length).toBeGreaterThan(1);
  });
});
