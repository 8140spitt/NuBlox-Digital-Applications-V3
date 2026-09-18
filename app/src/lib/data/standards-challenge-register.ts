import register from '$lib/generated/business-object-register.json';
import { enterpriseFunctions } from '$lib/enterprise/functions';

export type StandardsChallengeDecision =
  | 'covered-existing-semantics'
  | 'interoperability-boundary'
  | 'reference-data-boundary';

export type StandardsChallengeEntry = {
  id: string;
  name: string;
  currentReference: string;
  category: string[];
  officialSource: string;
  workspaces: string[];
  canonicalFamilies: string[];
  decision: StandardsChallengeDecision;
  state: 'challenged';
  finding: string;
  architectureDecision: string;
};

export const standardsChallengeRegister: StandardsChallengeEntry[] = [
  {
    id: 'ISO-19650',
    name: 'ISO 19650 information management',
    currentReference: 'ISO 19650-1:2018 current; Edition 2 draft under development in 2026',
    category: ['information-management', 'bim', 'whole-life'],
    officialSource: 'https://www.iso.org/standard/68078.html',
    workspaces: ['F05', 'F17', 'F26', 'F27'],
    canonicalFamilies: ['BOF-07', 'BOF-25', 'BOF-29'],
    decision: 'covered-existing-semantics',
    state: 'challenged',
    finding: 'Whole-life information management requires explicit information requirements, delivery planning, controlled information identity/version/issue, responsibility, status/suitability, exchange and retained records.',
    architectureDecision: 'NuBlox already separates Information Requirement, Deliverable, Delivery Plan, Information Container, Revision, Representation, Issue, Transmittal, Distribution, review/change and record/retention semantics. ISO 19650 status/naming conventions remain configurable policy/reference data rather than business-object identity.'
  },
  {
    id: 'BUILDINGSMART-IFC',
    name: 'buildingSMART Industry Foundation Classes',
    currentReference: 'IFC 4.3.2.0 / ISO 16739-1:2024',
    category: ['openbim', 'interoperability', 'built-asset-data'],
    officialSource: 'https://www.buildingsmart.org/standards/bsi-standards/industry-foundation-classes/',
    workspaces: ['F05', 'F16', 'F17', 'F22', 'F26', 'F27', 'F29'],
    canonicalFamilies: ['BOF-07', 'BOF-16', 'BOF-24', 'BOF-29'],
    decision: 'interoperability-boundary',
    state: 'challenged',
    finding: 'IFC provides vendor-neutral machine-interpretable built-asset descriptions including object identity, attributes and relationships.',
    architectureDecision: 'IFC is an external exchange/schema representation. IFC GUIDs and entities map to canonical NuBlox Information, Item/System/Asset/Space and classification identities through governed mappings; they never replace NuBlox business identity. Import/export retains schema version, source, mapping and validation provenance.'
  },
  {
    id: 'BUILDINGSMART-BCF',
    name: 'buildingSMART BIM Collaboration Format',
    currentReference: 'BCF 3.0',
    category: ['openbim', 'coordination', 'issue-exchange'],
    officialSource: 'https://www.buildingsmart.org/standards/bsi-standards/bim-collaboration-format/',
    workspaces: ['F05', 'F13', 'F26', 'F27'],
    canonicalFamilies: ['BOF-07', 'BOF-13', 'BOF-29'],
    decision: 'interoperability-boundary',
    state: 'challenged',
    finding: 'BCF exchanges model-based topics/issues, viewpoints, component references, comments, responsibilities and status between applications.',
    architectureDecision: 'BCF topics map to governed Coordination Issue/Review/Comment/Markup semantics and exact model/revision references. External BCF topic/component identifiers remain integration provenance; BCF workflow state does not become canonical design/change truth.'
  },
  {
    id: 'BUILDINGSMART-IDS',
    name: 'buildingSMART Information Delivery Specification',
    currentReference: 'IDS 1.0',
    category: ['openbim', 'information-requirements', 'validation'],
    officialSource: 'https://www.buildingsmart.org/standards/bsi-standards/information-delivery-specification-ids/',
    workspaces: ['F05', 'F13', 'F17', 'F26', 'F29'],
    canonicalFamilies: ['BOF-07', 'BOF-13', 'BOF-24', 'BOF-29'],
    decision: 'interoperability-boundary',
    state: 'challenged',
    finding: 'IDS expresses machine-readable IFC information requirements and supports automated compliance checking.',
    architectureDecision: 'IDS is a machine-readable representation of governed Information Requirement/acceptance criteria plus validation rules. IDS files/versions are controlled information; validation results are attributable evidence and never replace the underlying requirement or source model.'
  },
  {
    id: 'ISO-55001',
    name: 'ISO 55001 asset management system',
    currentReference: 'ISO 55001:2024',
    category: ['asset-management', 'management-system', 'whole-life'],
    officialSource: 'https://www.iso.org/standard/83054.html',
    workspaces: ['F01', 'F20', 'F22', 'F27'],
    canonicalFamilies: ['BOF-02', 'BOF-16', 'BOF-17', 'BOF-21'],
    decision: 'covered-existing-semantics',
    state: 'challenged',
    finding: 'Asset management requires policy/objectives, risk-based lifecycle planning, controlled asset information, performance evaluation and continual improvement.',
    architectureDecision: 'NuBlox covers stable Asset/System identity, condition/criticality/reliability, maintenance, lifecycle investment appraisal/plan, risk/control/audit, KPI/performance and whole-life handover/history. No second asset-management-system master is introduced.'
  },
  {
    id: 'ISO-9001',
    name: 'ISO 9001 quality management system',
    currentReference: 'ISO 9001:2026',
    category: ['quality', 'management-system', 'continual-improvement'],
    officialSource: 'https://www.iso.org/standard/9001',
    workspaces: ['F13', 'F20', 'F21', 'F25', 'F27'],
    canonicalFamilies: ['BOF-13', 'BOF-21', 'BOF-25'],
    decision: 'covered-existing-semantics',
    state: 'challenged',
    finding: 'Quality management requires controlled processes/documented information, competence, operational control, performance evaluation, audit, nonconformity/corrective action and continual improvement.',
    architectureDecision: 'NuBlox already governs Quality Plan/ITP, inspection/test, NCR/Defect/CAPA, competence, controlled information, KPI, audit/finding/remediation and process-improvement evidence. Certification is not inferred from software coverage.'
  },
  {
    id: 'ISO-45001',
    name: 'ISO 45001 occupational health and safety management system',
    currentReference: 'ISO 45001:2018 current; revision draft under development in 2026',
    category: ['health-safety', 'management-system', 'risk'],
    officialSource: 'https://www.iso.org/standard/45001',
    workspaces: ['F12', 'F20', 'F23', 'F27'],
    canonicalFamilies: ['BOF-12', 'BOF-13', 'BOF-21', 'BOF-23'],
    decision: 'covered-existing-semantics',
    state: 'challenged',
    finding: 'OH&S management requires hazard identification, risk assessment/control, worker competence/participation, incident investigation, emergency preparedness, monitoring and improvement.',
    architectureDecision: 'NuBlox covers Hazard/Risk Assessment/RAMS, permits/isolations, competence, observations/incidents/investigations, emergency/continuity records, controls/audit and remediation. No safety-specific duplicate Risk engine is required.'
  },
  {
    id: 'ISO-14001',
    name: 'ISO 14001 environmental management system',
    currentReference: 'ISO 14001:2026',
    category: ['environment', 'management-system', 'compliance'],
    officialSource: 'https://www.iso.org/standard/14001',
    workspaces: ['F20', 'F22', 'F23', 'F27'],
    canonicalFamilies: ['BOF-13', 'BOF-20', 'BOF-21'],
    decision: 'covered-existing-semantics',
    state: 'challenged',
    finding: 'Environmental management requires aspects/impacts, compliance obligations, objectives, operational controls, monitoring, emergency response and continual improvement.',
    architectureDecision: 'NuBlox already governs environmental Aspect/Impact, Carbon/Resource/Waste records, Compliance Requirement, objectives/targets, operational evidence, incidents, audit/remediation and performance snapshots. ISO management-system evidence reuses shared controls rather than another environmental workflow engine.'
  },
  {
    id: 'ISO-IEC-27001',
    name: 'ISO/IEC 27001 information security management system',
    currentReference: 'ISO/IEC 27001:2022',
    category: ['information-security', 'cybersecurity', 'management-system'],
    officialSource: 'https://www.iso.org/standard/27001',
    workspaces: ['F18', 'F20', 'F21', 'F24', 'F29'],
    canonicalFamilies: ['BOF-21', 'BOF-24', 'BOF-29'],
    decision: 'covered-existing-semantics',
    state: 'challenged',
    finding: 'Information-security governance requires risk-based controls, asset/data/service context, access governance, security incidents, monitoring, assurance and continual improvement.',
    architectureDecision: 'NuBlox reuses Enterprise Risk/Assessment, Compliance Requirement, Internal Control/Test, identity/access/configuration, Security Incident, Technology Service, data/privacy classifications and Audit/Remediation. Control catalogues remain versioned reference/governance definitions.'
  },
  {
    id: 'ISO-31000',
    name: 'ISO 31000 risk management',
    currentReference: 'ISO 31000:2018 current and confirmed 2023',
    category: ['risk', 'governance', 'decision-support'],
    officialSource: 'https://www.iso.org/standard/65694.html',
    workspaces: ['F01', 'F03', 'F20', 'F27'],
    canonicalFamilies: ['BOF-02', 'BOF-06', 'BOF-21'],
    decision: 'covered-existing-semantics',
    state: 'challenged',
    finding: 'Risk management requires a framework/process for identification, analysis, evaluation, treatment, monitoring, review and communication across organisational contexts.',
    architectureDecision: 'NuBlox already separates Risk Framework, Enterprise Risk, Risk Assessment, Treatment Plan, controls, actions, review and immutable decisions. Project/supplier/cyber/climate/resilience specialisations reuse the same risk identity architecture.'
  },
  {
    id: 'ISO-22301',
    name: 'ISO 22301 business continuity management system',
    currentReference: 'ISO 22301:2019 current; Edition 3 committee draft under development in 2026',
    category: ['business-continuity', 'resilience', 'crisis'],
    officialSource: 'https://www.iso.org/standard/75106.html',
    workspaces: ['F20', 'F23', 'F24', 'F27'],
    canonicalFamilies: ['BOF-21', 'BOF-23', 'BOF-24'],
    decision: 'covered-existing-semantics',
    state: 'challenged',
    finding: 'Business continuity requires impact/risk understanding, continuity strategies/plans, response/recovery arrangements, exercises, review and continual improvement.',
    architectureDecision: 'NuBlox already governs Continuity Strategy, Continuity Plan, Continuity Exercise, crisis/security response, Disaster Recovery Plan/Invocation, Risk/Control/Audit and corrective actions. Technology disaster recovery remains linked but distinct from enterprise continuity.'
  },
  {
    id: 'UNICLASS',
    name: 'Uniclass construction classification',
    currentReference: 'NBS Uniclass tables, July 2026 release cycle',
    category: ['classification', 'reference-data', 'construction'],
    officialSource: 'https://uniclass.thenbs.com/',
    workspaces: ['F05', 'F10', 'F12', 'F17', 'F22', 'F26', 'F27', 'F29'],
    canonicalFamilies: ['BOF-07', 'BOF-10', 'BOF-16', 'BOF-29'],
    decision: 'reference-data-boundary',
    state: 'challenged',
    finding: 'Uniclass provides maintained construction classification tables for entities, spaces/locations, elements/functions, systems, products, activities, roles, project management, risk, properties and forms of information.',
    architectureDecision: 'Uniclass is governed external Reference Data/Classification. NuBlox stores source system, table/code, version/release and effective assignment relationships; classification codes never become Item, Asset, Space, System, Information Container or WBS identity.'
  }
];

const validWorkspaces = new Set(enterpriseFunctions.map((entry) => entry.id));
const validFamilies = new Set(register.families.map((entry) => entry.id));

export const standardsChallengeSummary = {
  standardCount: standardsChallengeRegister.length,
  challengedCount: standardsChallengeRegister.filter((entry) => entry.state === 'challenged').length,
  coveredExistingCount: standardsChallengeRegister.filter((entry) => entry.decision === 'covered-existing-semantics').length,
  interoperabilityBoundaryCount: standardsChallengeRegister.filter((entry) => entry.decision === 'interoperability-boundary').length,
  referenceDataBoundaryCount: standardsChallengeRegister.filter((entry) => entry.decision === 'reference-data-boundary').length,
  openCount: 0,
  state: 'architecture-challenge-complete' as const
};

export function validateStandardsChallengeRegister() {
  if (standardsChallengeRegister.length !== 12) return false;
  if (new Set(standardsChallengeRegister.map((entry) => entry.id)).size !== standardsChallengeRegister.length) return false;
  if (!standardsChallengeRegister.every((entry) => entry.officialSource.startsWith('https://'))) return false;
  if (!standardsChallengeRegister.every((entry) => entry.workspaces.length > 0 && entry.workspaces.every((id) => validWorkspaces.has(id)))) return false;
  if (!standardsChallengeRegister.every((entry) => entry.canonicalFamilies.length > 0 && entry.canonicalFamilies.every((id) => validFamilies.has(id)))) return false;
  if (!standardsChallengeRegister.every((entry) => entry.finding && entry.architectureDecision && entry.state === 'challenged')) return false;
  if (standardsChallengeSummary.challengedCount !== standardsChallengeSummary.standardCount) return false;
  if (standardsChallengeSummary.openCount !== 0) return false;
  return true;
}
