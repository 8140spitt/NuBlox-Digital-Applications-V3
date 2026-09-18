import { describe, expect, it } from 'vitest';
import { functionWorkspaceDirectory, getFunctionWorkspace } from './function-directory';

describe('governed function workspace directory', () => {
  it('covers all 29 functions, 353 subfunctions and 1510 activities', () => {
    expect(functionWorkspaceDirectory).toHaveLength(29);
    expect(functionWorkspaceDirectory.reduce((sum, workspace) => sum + workspace.summary.subfunctionCount, 0)).toBe(353);
    expect(functionWorkspaceDirectory.reduce((sum, workspace) => sum + workspace.summary.activityCount, 0)).toBe(1510);
  });

  it('keeps every activity bound to canonical object, aggregate and authority metadata', () => {
    for (const workspace of functionWorkspaceDirectory) {
      expect(workspace.subfunctions.length).toBeGreaterThan(0);
      for (const subfunction of workspace.subfunctions) {
        expect(subfunction.activities).toHaveLength(subfunction.activityCount);
        for (const activity of subfunction.activities) {
          expect(activity.aggregateId).toMatch(/^AGG-/);
          expect(activity.objectModelId).toBeTruthy();
          expect(activity.objectName).toBeTruthy();
          expect(activity.writeAuthority).toBeTruthy();
        }
      }
    }
  });

  it('resolves function identifiers case-insensitively and rejects unknown functions', () => {
    expect(getFunctionWorkspace('f29')?.id).toBe('F29');
    expect(getFunctionWorkspace('F01')?.summary.activityCount).toBeGreaterThan(0);
    expect(getFunctionWorkspace('F30')).toBeNull();
  });
});
