import { describe, expect, it } from 'vitest';
import {
  sapV3BenchmarkRows,
  sapV3BenchmarkSummary,
  validateSapV3BenchmarkMap
} from './sap-v3-benchmark-audit';

describe('SAP V3 benchmark remap', () => {
  it('maps all 64 legacy SAP capability rows into V3 semantics', () => {
    expect(validateSapV3BenchmarkMap()).toBe(true);
    expect(sapV3BenchmarkSummary.rowCount).toBe(64);
    expect(new Set(sapV3BenchmarkRows.map((row) => row.sapNo)).size).toBe(64);
  });

  it('replaces legacy module ownership with explicit V3 workspace and canonical-family mappings', () => {
    expect(sapV3BenchmarkRows.every((row) => row.workspaces.length > 0)).toBe(true);
    expect(sapV3BenchmarkRows.every((row) => row.canonicalFamilies.length > 0)).toBe(true);
    expect(sapV3BenchmarkRows.every((row) => row.canonicalObjects.length > 0)).toBe(true);
    expect(sapV3BenchmarkRows.every((row) => row.processChains.length > 0)).toBe(true);
  });

  it('keeps contextual and platform capabilities explicit rather than forcing them into core domain ownership', () => {
    expect(sapV3BenchmarkSummary.nativeCoreCount).toBe(47);
    expect(sapV3BenchmarkSummary.contextualExtensionCount).toBe(9);
    expect(sapV3BenchmarkSummary.platformEnablerCount).toBe(8);
  });

  it('does not claim the capability challenge is complete just because the remap is complete', () => {
    expect(sapV3BenchmarkSummary.mappedRowCount).toBe(0);
    expect(sapV3BenchmarkSummary.challengedRowCount).toBe(64);
    expect(sapV3BenchmarkSummary.closedRowCount).toBe(0);
    expect(sapV3BenchmarkSummary.state).toBe('remapped-awaiting-capability-challenge');
  });
});
