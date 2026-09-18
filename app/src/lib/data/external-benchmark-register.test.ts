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
    expect(marketBenchmarkSummary.challengedBenchmarkCount).toBe(23);
    expect(marketBenchmarkSummary.inProgressBenchmarkCount).toBe(0);
    expect(marketBenchmarkSummary.registeredBenchmarkCount).toBe(0);
  });

  it('retains SAP as an enterprise completeness benchmark without making SAP the architecture', () => {
    const sap = externalBenchmarkRegister.find((entry) => entry.id === 'SAP-BUSINESS-SUITE');
    expect(sap?.tier).toBe('mandatory-suite');
    expect(sap?.studyState).toBe('challenged');
    expect(marketBenchmarkSummary.legacySapCapabilityRows).toBe(64);
    expect(marketBenchmarkSummary.sapV3MappedRows).toBe(64);
    expect(marketBenchmarkSummary.sapV3ChallengedRows).toBe(64);
    expect(marketBenchmarkSummary.sapV3ClosedRows).toBe(0);
    expect(marketBenchmarkSummary.benchmarkGapCount).toBe(29);
    expect(marketBenchmarkSummary.benchmarkGapResolvedCount).toBe(29);
    expect(marketBenchmarkSummary.benchmarkGapOpenCount).toBe(0);
    expect(marketBenchmarkSummary.standardsChallengeCount).toBe(12);
    expect(marketBenchmarkSummary.standardsChallengedCount).toBe(12);
    expect(marketBenchmarkSummary.standardsOpenCount).toBe(0);
    expect(marketBenchmarkSummary.rejectedVendorPatternCount).toBe(12);
    expect(marketBenchmarkSummary.rejectedVendorPatternRecordedCount).toBe(12);
    expect(marketBenchmarkSummary.rejectedVendorPatternOpenCount).toBe(0);
    expect(marketBenchmarkSummary.rule).toContain(
      'vendor module boundaries never become automatic NuBlox architecture'
    );
  });

  it('covers enterprise suites and construction/asset specialist depth', () => {
    const ids = new Set(externalBenchmarkRegister.map((entry) => entry.id));
    const states = new Map(externalBenchmarkRegister.map((entry) => [entry.id, entry.studyState]));
    for (const id of [
      'SAP-BUSINESS-SUITE',
      'ORACLE-CLOUD-CX',
      'MICROSOFT-D365',
      'IFS-CLOUD',
      'WORKDAY',
      'PROCORE',
      'AUTODESK-CONSTRUCTION',
      'TRIMBLE-CONSTRUCTION-ONE',
      'HEXAGON-ECOSYS',
      'CAUSEWAY',
      'THINKPROJECT',
      'ASITE-CDE',
      'PTC-WINDCHILL',
      'SIEMENS-TEAMCENTER',
      'BENTLEY-PROJECTWISE-ITWIN',
      'IBM-MAXIMO',
      'PLANON-IWMS',
      'ESRI-ARCGIS',
      'SERVICENOW',
      'DILIGENT-ONE',
      'SALESFORCE',
      'DELTEK-VANTAGEPOINT',
      'SAGE-CONSTRUCTION'
    ]) {
      expect(states.get(id)).toBe('challenged');
    }
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

  it('closes Gate 3 only when every product, standard, gap and rejection decision is governed', () => {
    expect(marketBenchmarkSummary.programmeState).toBe('architecture-challenge-complete');
    expect(externalBenchmarkRegister.every((entry) => entry.studyState === 'challenged')).toBe(
      true
    );
    expect(marketBenchmarkSummary.registeredBenchmarkCount).toBe(0);
    expect(marketBenchmarkSummary.inProgressBenchmarkCount).toBe(0);
  });
});
