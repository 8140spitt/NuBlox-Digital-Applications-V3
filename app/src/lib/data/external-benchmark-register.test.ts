import { describe, expect, it } from 'vitest';
import {
  externalBenchmarkRegister,
  marketBenchmarkSummary,
  validateExternalBenchmarkRegister
} from './external-benchmark-register';

describe('external market benchmark register', () => {
  it('is internally valid and challenges all 29 tenant workspaces', () => {
    expect(validateExternalBenchmarkRegister()).toBe(true);
    expect(marketBenchmarkSummary.workspaceCount).toBe(29);
    expect(marketBenchmarkSummary.coveredWorkspaceCount).toBe(29);
    expect(marketBenchmarkSummary.benchmarkCount).toBeGreaterThanOrEqual(23);
  });

  it('retains SAP as an enterprise completeness benchmark without making SAP the architecture', () => {
    const sap = externalBenchmarkRegister.find((entry) => entry.id === 'SAP-BUSINESS-SUITE');
    expect(sap?.tier).toBe('mandatory-suite');
    expect(sap?.studyState).toBe('in-progress');
    expect(marketBenchmarkSummary.legacySapCapabilityRows).toBe(64);
    expect(marketBenchmarkSummary.sapV3MappedRows).toBe(64);
    expect(marketBenchmarkSummary.sapV3ChallengedRows).toBe(39);
    expect(marketBenchmarkSummary.sapV3ClosedRows).toBe(0);
    expect(marketBenchmarkSummary.rule).toContain('vendor module boundaries never become automatic NuBlox architecture');
  });

  it('covers enterprise suites and construction/asset specialist depth', () => {
    const ids = new Set(externalBenchmarkRegister.map((entry) => entry.id));
    for (const id of [
      'SAP-BUSINESS-SUITE',
      'ORACLE-CLOUD-CX',
      'MICROSOFT-D365',
      'IFS-CLOUD',
      'PROCORE',
      'AUTODESK-CONSTRUCTION',
      'BENTLEY-PROJECTWISE-ITWIN',
      'TRIMBLE-CONSTRUCTION-ONE',
      'IBM-MAXIMO',
      'PTC-WINDCHILL',
      'SIEMENS-TEAMCENTER',
      'SERVICENOW'
    ]) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it('does not pretend the benchmark programme is complete', () => {
    expect(marketBenchmarkSummary.programmeState).toBe('in-progress');
    expect(externalBenchmarkRegister.some((entry) => entry.studyState === 'registered')).toBe(true);
  });
});
