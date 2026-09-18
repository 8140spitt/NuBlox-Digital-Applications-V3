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
    state: 'resolved',
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
    state: 'resolved',
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
    state: 'resolved',
    rationale: 'Canonical identities and data-quality rules exist, but stewardship case/change request, duplicate-candidate matching, controlled merge/unmerge and golden-record provenance need explicit governance semantics.',
    requiredOutcome: 'Define stewardship request/case, duplicate-match candidate, merge decision, survivor/redirect lineage, reversible unmerge/correction evidence and stewardship authority without creating a second master-data store.'
  },
  {
    id: 'BG-004',
    title: 'Advanced warehouse and freight execution depth',
    sourceBenchmarks: ['SAP-BUSINESS-SUITE', 'ORACLE-CLOUD-CX', 'MICROSOFT-D365'],
    sourceFindings: ['SAP-W1-07'],
    affectedExternalRows: ['SAP-14', 'SAP-45', 'SAP-53', 'SAP-57', 'SAP-63'],
    workspaces: ['F09', 'F10', 'F12'],
    canonicalFamilies: ['BOF-09', 'BOF-10'],
    disposition: 'accepted-refinement',
    state: 'resolved',
    rationale: 'Core warehouse/inventory/shipment/transport semantics are strong, but SAP exposes handling-unit, wave, yard, slotting, cross-docking, freight tendering and settlement concepts that may be material for sophisticated logistics operations.',
    requiredOutcome: 'Challenge these concepts against Oracle, IFS, Trimble and construction logistics use cases before deciding which are core canonical records, typed execution records, projections or contextual extensions.'
  },
  {
    id: 'BG-005',
    title: 'Asset reliability, criticality and failure-mode semantics',
    sourceBenchmarks: ['SAP-BUSINESS-SUITE', 'IBM-MAXIMO', 'IFS-CLOUD'],
    sourceFindings: ['SAP-W1-09'],
    affectedExternalRows: ['SAP-11', 'SAP-29', 'SAP-32'],
    workspaces: ['F12', 'F22'],
    canonicalFamilies: ['BOF-16', 'BOF-17'],
    disposition: 'accepted-refinement',
    state: 'resolved',
    rationale: 'Asset, condition, maintenance plan and work-order semantics are governed, but explicit reliability/criticality/failure-mode engineering is not yet represented as a first-class semantic layer.',
    requiredOutcome: 'Challenge against IBM Maximo, IFS and asset-management standards before deciding the minimum canonical reliability model.'
  },
  {
    id: 'BG-006',
    title: 'Talent, succession and workforce-intelligence depth',
    sourceBenchmarks: ['SAP-BUSINESS-SUITE', 'WORKDAY'],
    sourceFindings: ['SAP-W1-10'],
    affectedExternalRows: ['SAP-20', 'SAP-29', 'SAP-55'],
    workspaces: ['F15', 'F17'],
    canonicalFamilies: ['BOF-18', 'BOF-24'],
    disposition: 'accepted-refinement',
    state: 'resolved',
    rationale: 'The HCM baseline covers recruitment, employment, skills, learning, performance, workforce planning and payroll, but succession/talent-pool and workforce-intelligence concepts may require additional semantics.',
    requiredOutcome: 'Challenge against Workday and Microsoft/SAP HCM outcomes before adding any new identity beyond Career Profile, Skill, Competency, Performance Review and Workforce Plan.'
  },
  {
    id: 'BG-007',
    title: 'Subscription and usage-based billing',
    sourceBenchmarks: ['SAP-BUSINESS-SUITE'],
    sourceFindings: ['SAP-W2-01'],
    affectedExternalRows: ['SAP-5'],
    workspaces: ['F08', 'F12', 'F14', 'F22'],
    canonicalFamilies: ['BOF-17', 'BOF-19'],
    disposition: 'contextual-extension',
    state: 'resolved',
    rationale: 'Usage/subscription charging is material for utilities, managed services and consumption-based models but is not universal to every construction/built-environment business.',
    requiredOutcome: 'When enabled, govern subscription/service billing arrangement, metered usage record, rating basis and rated charge while reusing Service Contract/Entitlement, Utility Consumption, Item/Rate and Invoice truth.'
  },
  {
    id: 'BG-008',
    title: 'Public-sector funds and budget availability control',
    sourceBenchmarks: ['SAP-BUSINESS-SUITE'],
    sourceFindings: ['SAP-W2-05'],
    affectedExternalRows: ['SAP-17'],
    workspaces: ['F01', 'F14'],
    canonicalFamilies: ['BOF-02', 'BOF-19'],
    disposition: 'contextual-extension',
    state: 'resolved',
    rationale: 'Fund/funded-program accounting and active budget availability control are essential for public-sector/grant-funded organisations but are not a universal enterprise identity layer.',
    requiredOutcome: 'Provide Fund/Funded Program dimensions, budget-consumption rules and availability-control evidence as a public-sector extension over canonical Budget, Commitment and Actual financial positions.'
  },
  {
    id: 'BG-009',
    title: 'Global trade compliance screening and authorisation',
    sourceBenchmarks: ['SAP-BUSINESS-SUITE'],
    sourceFindings: ['SAP-W2-06'],
    affectedExternalRows: ['SAP-18'],
    workspaces: ['F09', 'F10', 'F20'],
    canonicalFamilies: ['BOF-10', 'BOF-21', 'BOF-29'],
    disposition: 'contextual-extension',
    state: 'resolved',
    rationale: 'Cross-border trade requires sanctioned-party/embargo screening, trade licences/authorisations and customs procedure/preference evidence beyond the existing Trade Declaration.',
    requiredOutcome: 'Provide trade-compliance checks/decisions and trade-authorisation/procedure evidence as a cross-border extension reusing Party, Item, Shipment, Jurisdiction, Classification and Compliance Requirement.'
  },
  {
    id: 'BG-010',
    title: 'Sales incentive and commission management',
    sourceBenchmarks: ['SAP-BUSINESS-SUITE'],
    sourceFindings: ['SAP-W2-07'],
    affectedExternalRows: ['SAP-21'],
    workspaces: ['F07', 'F14', 'F15'],
    canonicalFamilies: ['BOF-03', 'BOF-18', 'BOF-19'],
    disposition: 'contextual-extension',
    state: 'resolved',
    rationale: 'Commission/incentive plans and credited earnings are relevant to defined sales remuneration models but should not become universal HCM/finance structures.',
    requiredOutcome: 'Provide incentive plan, eligibility/crediting, earning/calculation, approval/payment consequence and dispute evidence as an optional sales-performance extension.'
  },
  {
    id: 'BG-011',
    title: 'Retail, POS and omnichannel promotion semantics',
    sourceBenchmarks: ['SAP-BUSINESS-SUITE'],
    sourceFindings: ['SAP-W2-11'],
    affectedExternalRows: ['SAP-33', 'SAP-43', 'SAP-56'],
    workspaces: ['F06', 'F07', 'F09', 'F10', 'F14'],
    canonicalFamilies: ['BOF-03', 'BOF-10', 'BOF-19'],
    disposition: 'contextual-extension',
    state: 'resolved',
    rationale: 'Till/session sale-return-payment, coupon/loyalty and omnichannel promotion mechanics are merchant/retail-specific and should not contaminate core project/construction sales semantics.',
    requiredOutcome: 'Provide a merchant/retail extension over canonical Customer, Item, Price, Inventory, Payment and accounting truth when builders-merchant/distribution scenarios require it.'
  },
  {
    id: 'BG-012',
    title: 'Configurable product and service rule semantics',
    sourceBenchmarks: ['SAP-BUSINESS-SUITE', 'PTC-WINDCHILL', 'SIEMENS-TEAMCENTER'],
    sourceFindings: ['SAP-W2-18'],
    affectedExternalRows: ['SAP-23', 'SAP-37', 'SAP-61'],
    workspaces: ['F05', 'F07', 'F10', 'F11'],
    canonicalFamilies: ['BOF-05', 'BOF-10', 'BOF-11', 'BOF-29'],
    disposition: 'accepted-refinement',
    state: 'resolved',
    rationale: 'Item Variant alone is insufficient for rule-driven configurable products/services across quote, planning, engineering and production. The semantics are cross-vendor PLM/ERP capability rather than SAP-specific.',
    requiredOutcome: 'Govern versioned Product Configuration Model, Characteristics, Configuration Rules and resolved Product Configuration evidence while preserving Item, Variant, BOM, pricing and execution truth.'
  },
  {
    id: 'BG-013',
    title: 'Business travel lifecycle',
    sourceBenchmarks: ['SAP-BUSINESS-SUITE'],
    sourceFindings: ['SAP-W2-16'],
    affectedExternalRows: ['SAP-59'],
    workspaces: ['F14', 'F15', 'F20'],
    canonicalFamilies: ['BOF-18', 'BOF-19', 'BOF-21', 'BOF-23'],
    disposition: 'accepted-refinement',
    state: 'resolved',
    rationale: 'Expense Claim and Travel Risk Assessment do not provide the durable travel request/trip identity needed to connect approval, duty of care, itinerary/booking context and expense.',
    requiredOutcome: 'Govern Travel Request, Business Trip and Travel Booking Evidence while allowing specialist booking platforms to remain integration sources.'
  },
  {
    id: 'BG-014',
    title: 'Data migration and protected test-data governance',
    sourceBenchmarks: ['SAP-BUSINESS-SUITE'],
    sourceFindings: ['SAP-W2-15'],
    affectedExternalRows: ['SAP-54'],
    workspaces: ['F16', 'F17', 'F21', 'F29'],
    canonicalFamilies: ['BOF-22', 'BOF-24', 'BOF-28', 'BOF-29'],
    disposition: 'accepted-refinement',
    state: 'resolved',
    rationale: 'World-class enterprise operation requires governed migration mappings/runs and protected non-production data provisioning with masking/anonymisation evidence.',
    requiredOutcome: 'Govern Migration Project/Mapping/Run and Test Data Provisioning Profile/Run with source-target lineage, simulation/validation, privacy controls and retained audit evidence.'
  },
  {
    id: 'BG-015',
    title: 'Product requirements and systems-engineering traceability',
    sourceBenchmarks: ['SAP-BUSINESS-SUITE', 'PTC-WINDCHILL', 'SIEMENS-TEAMCENTER'],
    sourceFindings: ['SAP-W2-08'],
    affectedExternalRows: ['SAP-23', 'SAP-37'],
    workspaces: ['F05', 'F11', 'F13', 'F26', 'F27'],
    canonicalFamilies: ['BOF-07', 'BOF-10', 'BOF-11', 'BOF-13'],
    disposition: 'accepted-refinement',
    state: 'resolved',
    rationale: 'Product functional/technical requirements and logical systems models are distinct from information-delivery requirements and from installed physical Systems/Assets.',
    requiredOutcome: 'Govern Product Requirement, Requirement Set/baseline, traceability and Engineering System Model/Element semantics with explicit realisation links to Item/Component/System/Asset.'
  },
  {
    id: 'BG-016',
    title: 'Lease-accounting consequence semantics',
    sourceBenchmarks: ['SAP-BUSINESS-SUITE', 'PLANON-IWMS'],
    sourceFindings: ['SAP-W2-04'],
    affectedExternalRows: ['SAP-15', 'SAP-41'],
    workspaces: ['F14', 'F19', 'F22'],
    canonicalFamilies: ['BOF-16', 'BOF-17', 'BOF-19', 'BOF-22'],
    disposition: 'accepted-refinement',
    state: 'resolved',
    rationale: 'Canonical Lease/Property/Occupancy semantics require a separate finance-side lease-accounting layer for IFRS 16/ASC 842-style valuation and postings without conflating physical/property truth with accounting records.',
    requiredOutcome: 'Govern Lease Accounting Record, immutable Lease Valuation and derived Lease Accounting Schedule linked to canonical Lease/Contract and finance postings.'
  },
  {
    id: 'BG-017',
    title: 'CPM schedule calendar, calculation and float/critical-path semantics',
    sourceBenchmarks: ['ORACLE-CLOUD-CX'],
    sourceFindings: ['ENT-W1-ORACLE-01'],
    affectedExternalRows: ['ORACLE-PRIMAVERA-CLOUD'],
    workspaces: ['F27', 'F03'],
    canonicalFamilies: ['BOF-06'],
    disposition: 'accepted-refinement',
    state: 'resolved',
    rationale: 'A world-class construction schedule requires explicit working calendars and reproducible CPM calculation evidence; total/free float and critical/longest-path status are derived planning positions, not editable activity flags.',
    requiredOutcome: 'Govern Schedule Calendar, Schedule Calculation Run and Schedule Analysis Snapshot around the existing Schedule/Activity/Dependency/Baseline model.'
  },
  {
    id: 'BG-018',
    title: 'Jurisdictional construction payment compliance evidence',
    sourceBenchmarks: ['ORACLE-CLOUD-CX'],
    sourceFindings: ['ENT-W1-ORACLE-04'],
    affectedExternalRows: ['ORACLE-TEXTURA'],
    workspaces: ['F07', 'F09', 'F14', 'F19', 'F20', 'F27'],
    canonicalFamilies: ['BOF-08', 'BOF-09', 'BOF-19', 'BOF-21', 'BOF-22'],
    disposition: 'contextual-extension',
    state: 'resolved',
    rationale: 'Textura exposes jurisdiction-specific lien-waiver, sworn-statement, payment-hold and downstream-payment compliance. These are real construction-payment controls but should be configured by jurisdiction/contract regime rather than become universal global payment objects.',
    requiredOutcome: 'Reuse Contract, Payment Application/Valuation/Certificate, Compliance Requirement, Evidence Item, Payment Hold/withholding semantics and jurisdiction policy; add regime-specific waiver/release evidence only where legally applicable.'
  },
  {
    id: 'BG-019',
    title: 'Quantitative project schedule and cost risk analysis',
    sourceBenchmarks: ['ORACLE-CLOUD-CX'],
    sourceFindings: ['ENT-W1-ORACLE-02'],
    affectedExternalRows: ['ORACLE-PRIMAVERA-CLOUD-RISK'],
    workspaces: ['F20', 'F27', 'F03', 'F14'],
    canonicalFamilies: ['BOF-06', 'BOF-19', 'BOF-21'],
    disposition: 'accepted-refinement',
    state: 'resolved',
    rationale: 'Large construction and capital programmes require reproducible probabilistic schedule/cost risk analysis. Existing Risk Assessment and project Schedule/Forecast semantics do not retain quantitative simulation inputs, method versions and outcome distributions.',
    requiredOutcome: 'Govern Project Risk Simulation Run and Project Risk Analysis Snapshot around existing Enterprise Risk/Risk Assessment, Schedule, cost/Forecast and Scenario identities.'
  },
  {
    id: 'BG-020',
    title: 'Construction earned value, productivity, forecast and CVR performance analysis',
    sourceBenchmarks: ['HEXAGON-ECOSYS', 'TRIMBLE-CONSTRUCTION-ONE', 'CAUSEWAY', 'PROCORE'],
    sourceFindings: ['CON-W2-ECOSYS-01', 'CON-W2-TRIMBLE-01', 'CON-W2-CAUSEWAY-01', 'CON-W2-PROCORE-02'],
    affectedExternalRows: ['ECOSYS-EVM', 'TRIMBLE-JOB-COST', 'CAUSEWAY-PROJECT-ACCOUNTING', 'PROCORE-PRODUCTIVITY'],
    workspaces: ['F03', 'F07', 'F12', 'F14', 'F27'],
    canonicalFamilies: ['BOF-06', 'BOF-08', 'BOF-12', 'BOF-19'],
    disposition: 'accepted-refinement',
    state: 'resolved',
    rationale: 'Construction leaders independently converge on time-phased budget/progress/actual/commitment/forecast analysis, earned value, production productivity and cost-value reconciliation. NuBlox has the authoritative source facts but lacked one governed reproducible calculation/snapshot layer.',
    requiredOutcome: 'Govern Progress Measurement Method, Project Performance Calculation Run and Project Controls Performance Snapshot while preserving Progress Record, Budget, Forecast, Contract/Valuation, Commitment and Ledger as source truth.'
  }
];

export const benchmarkGapSummary = {
  gapCount: benchmarkGapRegister.length,
  acceptedRefinementCount: benchmarkGapRegister.filter((gap) => gap.disposition === 'accepted-refinement').length,
  crossBenchmarkRequiredCount: benchmarkGapRegister.filter((gap) => gap.disposition === 'cross-benchmark-required').length,
  contextualExtensionCount: benchmarkGapRegister.filter((gap) => gap.disposition === 'contextual-extension').length,
  resolvedCount: benchmarkGapRegister.filter((gap) => gap.state === 'resolved').length,
  openCount: benchmarkGapRegister.filter((gap) => gap.state === 'open').length
};

export function validateBenchmarkGapRegister() {
  if (new Set(benchmarkGapRegister.map((gap) => gap.id)).size !== benchmarkGapRegister.length) return false;
  if (!benchmarkGapRegister.every((gap) => gap.sourceBenchmarks.length > 0 && gap.sourceFindings.length > 0)) return false;
  if (!benchmarkGapRegister.every((gap) => gap.workspaces.length > 0 && gap.canonicalFamilies.length > 0)) return false;
  if (!benchmarkGapRegister.every((gap) => gap.rationale && gap.requiredOutcome)) return false;
  if (benchmarkGapSummary.acceptedRefinementCount !== 14) return false;
  if (benchmarkGapSummary.crossBenchmarkRequiredCount !== 0) return false;
  if (benchmarkGapSummary.contextualExtensionCount !== 6) return false;
  if (benchmarkGapSummary.resolvedCount !== 20) return false;
  return true;
}
