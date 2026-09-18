export type BenchmarkRejection = {
  id: string;
  pattern: string;
  sourceBenchmarks: string[];
  state: 'recorded';
  rationale: string;
  preservedAuthority: string;
};

export const benchmarkRejectionRegister: BenchmarkRejection[] = [
  {
    id: 'BRJ-001',
    pattern: 'Vendor module boundaries become NuBlox workspace or aggregate boundaries',
    sourceBenchmarks: ['SAP-BUSINESS-SUITE', 'ORACLE-CLOUD-CX', 'MICROSOFT-D365', 'IFS-CLOUD'],
    state: 'recorded',
    rationale:
      'The same durable business identity and end-to-end process routinely spans multiple vendor modules. Copying module boundaries would duplicate masters and break cross-workspace continuity.',
    preservedAuthority: '29 stable tenant workspaces over one canonical cross-functional model.'
  },
  {
    id: 'BRJ-002',
    pattern: 'Workflow task or generic case becomes domain truth',
    sourceBenchmarks: ['SERVICENOW', 'DILIGENT-ONE', 'THINKPROJECT'],
    state: 'recorded',
    rationale:
      'Workflow coordinates work but cannot substitute for Contract Change, Risk, Incident, Decision, RFI, Work Order or other domain records with independent legal/operational meaning.',
    preservedAuthority:
      'Domain object lifecycle and immutable evidence; Work Item/Approval remain orchestration.'
  },
  {
    id: 'BRJ-003',
    pattern: 'CDE folder, file or repository path becomes information identity',
    sourceBenchmarks: [
      'AUTODESK-CONSTRUCTION',
      'ASITE-CDE',
      'BENTLEY-PROJECTWISE-ITWIN',
      'ORACLE-CLOUD-CX'
    ],
    state: 'recorded',
    rationale:
      'Folders and files are storage/navigation constructs. Stable controlled information identity must survive revisions, file replacements, formats and repository changes.',
    preservedAuthority: 'Information Container → Revision/Iteration → Representation.'
  },
  {
    id: 'BRJ-004',
    pattern: 'Job/phase/cost-type hierarchy becomes the universal project model',
    sourceBenchmarks: ['TRIMBLE-CONSTRUCTION-ONE', 'SAGE-CONSTRUCTION', 'DELTEK-VANTAGEPOINT'],
    state: 'recorded',
    rationale:
      'Delivery scope, financial classification, commercial commitment and accounting dimensions have different authority and change rules.',
    preservedAuthority:
      'Project/WBS/Work Package, Cost Code/Financial Dimension, Contract/PO and Ledger remain separately governed.'
  },
  {
    id: 'BRJ-005',
    pattern:
      'One mutable project-cost record holds estimate, commitments, actuals, forecast and earned value',
    sourceBenchmarks: [
      'HEXAGON-ECOSYS',
      'TRIMBLE-CONSTRUCTION-ONE',
      'CAUSEWAY',
      'SAGE-CONSTRUCTION'
    ],
    state: 'recorded',
    rationale:
      'Estimate, Contract/PO commitment, posted actual, Forecast and project-performance projection have different provenance and correction rules; collapsing them destroys auditability.',
    preservedAuthority:
      'Source records remain authoritative; project-controls and WIP/CVR views are reproducible projections.'
  },
  {
    id: 'BRJ-006',
    pattern:
      'Generic PLM master object replaces explicit Item, Information, System or Asset identities',
    sourceBenchmarks: ['PTC-WINDCHILL', 'SIEMENS-TEAMCENTER'],
    state: 'recorded',
    rationale:
      'PLM class hierarchies are useful implementation patterns but do not erase the distinct business semantics of Item, controlled information, engineering models, physical systems and operational assets.',
    preservedAuthority:
      'Stable domain identities with shared revision, effectivity, configuration and change governance.'
  },
  {
    id: 'BRJ-007',
    pattern: 'Digital twin becomes a second physical Asset/System master',
    sourceBenchmarks: ['BENTLEY-PROJECTWISE-ITWIN', 'SIEMENS-TEAMCENTER', 'PTC-WINDCHILL'],
    state: 'recorded',
    rationale:
      'A twin federates models, GIS, telemetry, datasets and operational state around a real-world subject; duplicating the subject creates competing asset truth.',
    preservedAuthority:
      'Canonical Asset/System identity plus Digital Twin Federation Context, bindings and snapshots.'
  },
  {
    id: 'BRJ-008',
    pattern: 'CRM customer/account becomes a second Party master',
    sourceBenchmarks: ['SALESFORCE', 'MICROSOFT-D365'],
    state: 'recorded',
    rationale:
      'Customer, prospect, supplier and stakeholder are roles/relationships around the same real-world Party/Organisation/Person identity.',
    preservedAuthority:
      'Canonical Party plus effective Party Relationships and CRM opportunity/case records.'
  },
  {
    id: 'BRJ-009',
    pattern: 'Field-service or FM asset becomes a second Asset register',
    sourceBenchmarks: ['SALESFORCE', 'IBM-MAXIMO', 'PLANON-IWMS', 'MICROSOFT-D365'],
    state: 'recorded',
    rationale:
      'Construction handover, service, facilities, maintenance and finance must refer to the same whole-life Asset/System identity.',
    preservedAuthority:
      'Canonical Asset/System/Component with installed-base, service, condition and maintenance relationships.'
  },
  {
    id: 'BRJ-010',
    pattern: 'GIS feature ID becomes enterprise Asset, Network or Linear Segment identity',
    sourceBenchmarks: ['ESRI-ARCGIS'],
    state: 'recorded',
    rationale:
      'GIS may be authoritative for spatial/network representation, but platform-specific feature IDs cannot be the only durable enterprise identity across operational, commercial and lifecycle systems.',
    preservedAuthority:
      'Canonical Network/Asset/System/Linear Segment plus external identifiers, mappings and source-aware spatial bindings.'
  },
  {
    id: 'BRJ-011',
    pattern: 'Contract-form-specific duplicate change engines',
    sourceBenchmarks: ['THINKPROJECT', 'CAUSEWAY', 'ORACLE-CLOUD-CX'],
    state: 'recorded',
    rationale:
      'Variation, Compensation Event and comparable mechanisms share durable commercial-change semantics while differing in configured contract rules, notices, time bars and assessment processes.',
    preservedAuthority:
      'Canonical Commercial Change with governed contract-form type/configuration and retained notices/quotes/assessments/decisions.'
  },
  {
    id: 'BRJ-012',
    pattern: 'External classification or exchange schema becomes business-object identity',
    sourceBenchmarks: ['BUILDINGSMART-IFC', 'UNICLASS'],
    state: 'recorded',
    rationale:
      'Interoperability schemas and classification systems are external semantic/reference authorities for exchange or tagging, but their codes/IDs should not replace stable NuBlox business identity.',
    preservedAuthority:
      'Canonical objects plus versioned External Identifier, Classification, Data Mapping and validation provenance.'
  }
];

export const benchmarkRejectionSummary = {
  rejectionCount: benchmarkRejectionRegister.length,
  recordedCount: benchmarkRejectionRegister.filter((entry) => entry.state === 'recorded').length,
  openCount: 0
};

export function validateBenchmarkRejectionRegister() {
  if (benchmarkRejectionRegister.length !== 12) return false;
  if (
    new Set(benchmarkRejectionRegister.map((entry) => entry.id)).size !==
    benchmarkRejectionRegister.length
  )
    return false;
  if (!benchmarkRejectionRegister.every((entry) => entry.sourceBenchmarks.length > 0)) return false;
  if (
    !benchmarkRejectionRegister.every(
      (entry) => entry.rationale && entry.preservedAuthority && entry.state === 'recorded'
    )
  )
    return false;
  if (benchmarkRejectionSummary.recordedCount !== benchmarkRejectionSummary.rejectionCount)
    return false;
  if (benchmarkRejectionSummary.openCount !== 0) return false;
  return true;
}
