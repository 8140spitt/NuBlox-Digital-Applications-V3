export type BenchmarkGapDisposition =
  | 'accepted-refinement'
  | 'cross-benchmark-required'
  | 'integration-boundary'
  | 'contextual-extension'
  | 'rejected-vendor-pattern';

export type BenchmarkGapState = 'open' | 'resolved';

export type BenchmarkGap = {
  id: string;
  title: string;
  sourceBenchmarks: string[];
  sourceFindings: string[];
  affectedExternalRows: string[];
  workspaces: string[];
  canonicalFamilies: string[];
  disposition: BenchmarkGapDisposition;
  state: BenchmarkGapState;
  rationale: string;
  requiredOutcome: string;
};

export const benchmarkGapRegister: BenchmarkGap[] = [
  {
    id: 'BG-001',
    title: 'Integrated demand and supply planning semantics',
    sourceBenchmarks: ['SAP-BUSINESS-SUITE'],
    sourceFindings: ['SAP-W1-01', 'SAP-W1-02'],
    affectedExternalRows: ['SAP-1', 'SAP-2', 'SAP-3', 'SAP-22', 'SAP-49', 'SAP-50', 'SAP-53'],
    workspaces: ['F01', 'F03', 'F10', 'F11', 'F27'],
    canonicalFamilies: ['BOF-02', 'BOF-06', 'BOF-10', 'BOF-11'],
    disposition: 'accepted-refinement',
    state: 'open',
    rationale: 'The current model has Business Plan, Scenario, Forecast, Production Plan and Capacity Plan but no explicit governed demand/supply planning identity. This is a cross-enterprise planning need rather than an SAP module artefact.',
    requiredOutcome: 'Define governed Demand Plan and Supply Plan semantics, planning horizon/version/effectivity, demand-source links, constrained/unconstrained supply response, scenario comparison and links to inventory/capacity/finance without creating duplicate operational truth.'
  },
  {
    id: 'BG-002',
    title: 'Treasury exposure, hedging and market-data semantics',
    sourceBenchmarks: ['SAP-BUSINESS-SUITE'],
    sourceFindings: ['SAP-W1-04'],
    affectedExternalRows: ['SAP-4', 'SAP-58'],
    workspaces: ['F14', 'F20'],
    canonicalFamilies: ['BOF-19', 'BOF-21', 'BOF-29'],
    disposition: 'accepted-refinement',
    state: 'open',
    rationale: 'Cash and liquidity forecasting plus Treasury Deal are already governed, but financial exposure, hedge designation/instrument linkage, market-data basis and cash-pooling arrangements are not explicit enough for auditable treasury risk.',
    requiredOutcome: 'Define exposure, hedge relationship/instrument, market-data snapshot/rate source and cash-pool relationships while preserving immutable accounting and bank evidence.'
  },
  {
    id: 'BG-003',
    title: 'Master-data stewardship and reversible merge governance',
    sourceBenchmarks: ['SAP-BUSINESS-SUITE'],
    sourceFindings: ['SAP-W1-05', 'SAP-W1-06'],
    affectedExternalRows: ['SAP-25', 'SAP-26', 'SAP-27'],
    workspaces: ['F02', 'F05', 'F09', 'F17', 'F22', 'F29'],
    canonicalFamilies: ['BOF-01', 'BOF-10', 'BOF-16', 'BOF-24', 'BOF-29'],
    disposition: 'accepted-refinement',
    state: 'open',
    rationale: 'Canonical identities and data-quality rules exist, but stewardship case/change request, duplicate-candidate matching, controlled merge/unmerge and golden-record provenance need explicit governance semantics.',
    requiredOutcome: 'Define stewardship request/case, duplicate-match candidate, merge decision, survivor/redirect lineage, reversible unmerge/correction evidence and stewardship authority without creating a second master-data store.'
  },
  {
    id: 'BG-004',
    title: 'Advanced warehouse and freight execution depth',
    sourceBenchmarks: ['SAP-BUSINESS-SUITE'],
    sourceFindings: ['SAP-W1-07'],
    affectedExternalRows: ['SAP-14', 'SAP-45', 'SAP-53', 'SAP-57', 'SAP-63'],
    workspaces: ['F09', 'F10', 'F12'],
    canonicalFamilies: ['BOF-09', 'BOF-10'],
    disposition: 'cross-benchmark-required',
    state: 'open',
    rationale: 'Core warehouse/inventory/shipment/transport semantics are strong, but SAP exposes handling-unit, wave, yard, slotting, cross-docking, freight tendering and settlement concepts that may be material for sophisticated logistics operations.',
    requiredOutcome: 'Challenge these concepts against Oracle, IFS, Trimble and construction logistics use cases before deciding which are core canonical records, typed execution records, projections or contextual extensions.'
  },
  {
    id: 'BG-005',
    title: 'Asset reliability, criticality and failure-mode semantics',
    sourceBenchmarks: ['SAP-BUSINESS-SUITE'],
    sourceFindings: ['SAP-W1-09'],
    affectedExternalRows: ['SAP-11', 'SAP-29', 'SAP-32'],
    workspaces: ['F12', 'F22'],
    canonicalFamilies: ['BOF-16', 'BOF-17'],
    disposition: 'cross-benchmark-required',
    state: 'open',
    rationale: 'Asset, condition, maintenance plan and work-order semantics are governed, but explicit reliability/criticality/failure-mode engineering is not yet represented as a first-class semantic layer.',
    requiredOutcome: 'Challenge against IBM Maximo, IFS and asset-management standards before deciding the minimum canonical reliability model.'
  },
  {
    id: 'BG-006',
    title: 'Talent, succession and workforce-intelligence depth',
    sourceBenchmarks: ['SAP-BUSINESS-SUITE'],
    sourceFindings: ['SAP-W1-10'],
    affectedExternalRows: ['SAP-20', 'SAP-29', 'SAP-55'],
    workspaces: ['F15', 'F17'],
    canonicalFamilies: ['BOF-18', 'BOF-24'],
    disposition: 'cross-benchmark-required',
    state: 'open',
    rationale: 'The HCM baseline covers recruitment, employment, skills, learning, performance, workforce planning and payroll, but succession/talent-pool and workforce-intelligence concepts may require additional semantics.',
    requiredOutcome: 'Challenge against Workday and Microsoft/SAP HCM outcomes before adding any new identity beyond Career Profile, Skill, Competency, Performance Review and Workforce Plan.'
  }
];

export const benchmarkGapSummary = {
  gapCount: benchmarkGapRegister.length,
  acceptedRefinementCount: benchmarkGapRegister.filter((gap) => gap.disposition === 'accepted-refinement').length,
  crossBenchmarkRequiredCount: benchmarkGapRegister.filter((gap) => gap.disposition === 'cross-benchmark-required').length,
  resolvedCount: benchmarkGapRegister.filter((gap) => gap.state === 'resolved').length,
  openCount: benchmarkGapRegister.filter((gap) => gap.state === 'open').length
};

export function validateBenchmarkGapRegister() {
  if (new Set(benchmarkGapRegister.map((gap) => gap.id)).size !== benchmarkGapRegister.length) return false;
  if (!benchmarkGapRegister.every((gap) => gap.sourceBenchmarks.length > 0 && gap.sourceFindings.length > 0)) return false;
  if (!benchmarkGapRegister.every((gap) => gap.workspaces.length > 0 && gap.canonicalFamilies.length > 0)) return false;
  if (!benchmarkGapRegister.every((gap) => gap.rationale && gap.requiredOutcome)) return false;
  if (benchmarkGapSummary.acceptedRefinementCount !== 3) return false;
  if (benchmarkGapSummary.crossBenchmarkRequiredCount !== 3) return false;
  if (benchmarkGapSummary.resolvedCount !== 0) return false;
  return true;
}
