import register from '$lib/generated/business-object-register.json';
import { enterpriseFunctions } from '$lib/enterprise/functions';
import { foundationCanonicalization } from './foundation-canonicalization';
import { builtEnvironmentCanonicalization } from './built-environment-canonicalization';
import { commercialProcurementCanonicalization } from './commercial-procurement-canonicalization';
import { itemManufacturingCanonicalization } from './item-manufacturing-canonicalization';
import { inventoryLogisticsCanonicalization } from './inventory-logistics-canonicalization';
import { controlledInformationCanonicalization } from './controlled-information-canonicalization';
import { assetOperationsCanonicalization } from './asset-operations-canonicalization';
import { financeAccountingCanonicalization } from './finance-accounting-canonicalization';
import { sharedWorkEvidenceCanonicalization } from './shared-work-evidence-canonicalization';
import { referenceConfigurationCanonicalization } from './reference-configuration-canonicalization';
import { crmBusinessDevelopmentCanonicalization } from './crm-business-development-canonicalization';
import { estimatingTenderingCanonicalization } from './estimating-tendering-canonicalization';
import { peopleHcmCanonicalization } from './people-hcm-canonicalization';
import { qhseAssuranceCanonicalization } from './qhse-assurance-canonicalization';
import { buildingSafetyRegulatoryCanonicalization } from './building-safety-regulatory-canonicalization';
import { sustainabilityCarbonCanonicalization } from './sustainability-carbon-canonicalization';

export const sectorLifecycle = [
  'Market', 'Lead', 'Opportunity', 'Bid', 'Estimate', 'Proposal', 'Quote', 'Contract', 'Design', 'Plan',
  'Procure', 'Produce', 'Construct', 'Control', 'Invoice', 'Account', 'Handover', 'Operate', 'Maintain',
  'Refurbish', 'Dispose'
] as const;

export const endToEndChains = [
  'market-to-contract',
  'estimate-to-project-control',
  'design-to-approved-information',
  'procure-to-pay',
  'plan-to-perform',
  'change-to-commercial-position',
  'valuation-to-cash',
  'supplier-progress-to-payment',
  'incident/defect/NCR-to-resolution',
  'commissioning-to-operation',
  'service-request-to-resolution',
  'asset-to-retirement',
  'hire-to-retire',
  'record-to-report'
] as const;

export const specialistOverlays = [
  'development', 'design', 'engineering', 'commercial-management', 'contracting', 'trades',
  'manufacturing', 'infrastructure', 'property-fm', 'retrofit', 'regulation', 'heritage'
] as const;

export type SemanticModelState = 'governed-semantic-model' | 'partial-semantic-model' | 'candidate-only';
export type SectorLifecycleStage = (typeof sectorLifecycle)[number];
export type EndToEndChain = (typeof endToEndChains)[number];
export type SpecialistOverlay = (typeof specialistOverlays)[number];

export type FamilyCoverageDefinition = {
  id: string;
  semanticModelState: SemanticModelState;
  workspaces: string[];
  lifecycleStages: SectorLifecycleStage[];
  processChains: EndToEndChain[];
  overlays: SpecialistOverlay[];
  note: string;
};

const ALL_WORKSPACES = enterpriseFunctions.map((fn) => fn.id);
const ALL_STAGES = [...sectorLifecycle];

export const familyCoverageDefinitions: FamilyCoverageDefinition[] = [
  { id: 'BOF-01', semanticModelState: 'governed-semantic-model', workspaces: ['F02','F15','F16','F19','F20','F27'], lifecycleStages: ['Market','Contract','Construct','Operate','Maintain'], processChains: ['hire-to-retire','record-to-report'], overlays: ['development','contracting','infrastructure','property-fm'], note: 'Foundation identity, Party, organisation, membership and authority spine is governed.' },
  { id: 'BOF-02', semanticModelState: 'candidate-only', workspaces: ['F01','F02','F03'], lifecycleStages: ['Plan','Control','Account'], processChains: ['record-to-report'], overlays: ['development','commercial-management'], note: 'Strategy/governance/EPM candidates still require family-level canonicalization.' },
  { id: 'BOF-03', semanticModelState: 'governed-semantic-model', workspaces: ['F06','F07','F08'], lifecycleStages: ['Market','Lead','Opportunity','Bid','Proposal','Quote','Contract'], processChains: ['market-to-contract'], overlays: ['development','commercial-management','contracting'], note: 'Market insight, Party Relationship/account context, Lead, Opportunity, Pursuit, decision, interaction, onboarding and customer-case semantics are governed.' },
  { id: 'BOF-04', semanticModelState: 'candidate-only', workspaces: ['F04','F14','F19','F22','F27'], lifecycleStages: ['Opportunity','Estimate','Plan','Contract','Design','Construct','Operate','Refurbish','Dispose'], processChains: ['market-to-contract','asset-to-retirement'], overlays: ['development','infrastructure','property-fm','retrofit','regulation','heritage'], note: 'Land, development, investment and acquisition semantics remain to be canonicalized.' },
  { id: 'BOF-05', semanticModelState: 'governed-semantic-model', workspaces: ['F07','F09','F14','F27'], lifecycleStages: ['Bid','Estimate','Proposal','Quote','Contract','Control'], processChains: ['market-to-contract','estimate-to-project-control'], overlays: ['commercial-management','contracting','trades'], note: 'Estimate/version, breakdown, take-off, resource build-up, provisions, tender adjudication and customer-offer semantics are governed with shared sourcing reuse.' },
  { id: 'BOF-06', semanticModelState: 'governed-semantic-model', workspaces: ['F03','F27'], lifecycleStages: ['Plan','Construct','Control','Handover','Refurbish'], processChains: ['estimate-to-project-control','plan-to-perform','change-to-commercial-position'], overlays: ['development','design','engineering','commercial-management','contracting','infrastructure','retrofit'], note: 'Portfolio/programme/project, WBS and schedule semantics are governed; residual candidates still need object-by-object decisions.' },
  { id: 'BOF-07', semanticModelState: 'governed-semantic-model', workspaces: ['F05','F13','F26','F27'], lifecycleStages: ['Design','Plan','Construct','Control','Handover','Operate','Maintain','Refurbish'], processChains: ['design-to-approved-information','commissioning-to-operation'], overlays: ['design','engineering','infrastructure','retrofit','regulation','heritage'], note: 'Controlled information identity, revision, issue and technical-query semantics are governed.' },
  { id: 'BOF-08', semanticModelState: 'governed-semantic-model', workspaces: ['F07','F09','F14','F19','F20','F27'], lifecycleStages: ['Quote','Contract','Construct','Control','Invoice','Account','Handover'], processChains: ['market-to-contract','change-to-commercial-position','valuation-to-cash','supplier-progress-to-payment'], overlays: ['commercial-management','contracting','trades','infrastructure'], note: 'Agreement/commercial package/change and payment-chain semantics are governed.' },
  { id: 'BOF-09', semanticModelState: 'governed-semantic-model', workspaces: ['F09','F10','F14','F27'], lifecycleStages: ['Plan','Procure','Construct','Control','Invoice','Account'], processChains: ['procure-to-pay','supplier-progress-to-payment'], overlays: ['commercial-management','contracting','trades','manufacturing','infrastructure'], note: 'Supplier sourcing, procurement package, award, PO and receipt semantics are governed.' },
  { id: 'BOF-10', semanticModelState: 'governed-semantic-model', workspaces: ['F05','F09','F10','F11','F12','F22'], lifecycleStages: ['Procure','Produce','Construct','Operate','Maintain'], processChains: ['procure-to-pay','plan-to-perform','service-request-to-resolution','asset-to-retirement'], overlays: ['trades','manufacturing','infrastructure','property-fm','retrofit'], note: 'Item identity, traceability, inventory and logistics semantics are governed.' },
  { id: 'BOF-11', semanticModelState: 'governed-semantic-model', workspaces: ['F05','F11','F13'], lifecycleStages: ['Produce','Control','Handover'], processChains: ['plan-to-perform'], overlays: ['manufacturing','trades','infrastructure'], note: 'Manufacturing definition, production execution and as-manufactured configuration are governed.' },
  { id: 'BOF-12', semanticModelState: 'partial-semantic-model', workspaces: ['F12','F13','F23','F27'], lifecycleStages: ['Construct','Control','Handover'], processChains: ['plan-to-perform','incident/defect/NCR-to-resolution'], overlays: ['engineering','contracting','trades','infrastructure','regulation'], note: 'Site/location identities and shared evidence patterns are governed; field-operation transactions still need convergence.' },
  { id: 'BOF-13', semanticModelState: 'governed-semantic-model', workspaces: ['F13','F20','F23','F27'], lifecycleStages: ['Design','Produce','Construct','Control','Handover','Operate','Maintain'], processChains: ['incident/defect/NCR-to-resolution','commissioning-to-operation'], overlays: ['engineering','contracting','trades','manufacturing','infrastructure','property-fm','regulation'], note: 'Quality planning, verification, nonconformance/CAPA, safe-work controls, incidents, compliance and environmental assurance semantics are governed.' },
  { id: 'BOF-14', semanticModelState: 'governed-semantic-model', workspaces: ['F13','F19','F20','F23','F27'], lifecycleStages: ['Design','Construct','Control','Handover','Operate'], processChains: ['design-to-approved-information','incident/defect/NCR-to-resolution','commissioning-to-operation'], overlays: ['design','engineering','infrastructure','regulation','heritage'], note: 'Dutyholder, competence evidence, regulator case/application, controlled change, inspection/finding, mandatory occurrence, notice, decision, completion, golden-thread and submission semantics are governed.' },
  { id: 'BOF-15', semanticModelState: 'governed-semantic-model', workspaces: ['F12','F13','F22','F27'], lifecycleStages: ['Construct','Control','Handover','Operate'], processChains: ['commissioning-to-operation'], overlays: ['engineering','contracting','trades','infrastructure','property-fm','regulation'], note: 'Commissioning, acceptance and handover semantics are governed around persistent System/Asset identity.' },
  { id: 'BOF-16', semanticModelState: 'governed-semantic-model', workspaces: ['F12','F14','F22','F23','F27'], lifecycleStages: ['Design','Construct','Handover','Operate','Maintain','Refurbish','Dispose'], processChains: ['commissioning-to-operation','asset-to-retirement'], overlays: ['development','design','engineering','infrastructure','property-fm','retrofit','heritage'], note: 'Built-environment spatial and physical identity model is governed.' },
  { id: 'BOF-17', semanticModelState: 'governed-semantic-model', workspaces: ['F08','F12','F22','F23'], lifecycleStages: ['Operate','Maintain','Refurbish','Dispose'], processChains: ['service-request-to-resolution','asset-to-retirement','incident/defect/NCR-to-resolution'], overlays: ['property-fm','infrastructure','retrofit','regulation'], note: 'Maintenance, service, warranty, condition and whole-life history semantics are governed.' },
  { id: 'BOF-18', semanticModelState: 'governed-semantic-model', workspaces: ['F15','F27'], lifecycleStages: ['Plan','Construct','Operate','Maintain'], processChains: ['hire-to-retire'], overlays: ['contracting','trades','manufacturing','infrastructure','property-fm'], note: 'Person/worker relationship, position/job, competence/credential, learning, workforce planning, time, payroll, recruitment and employee-case semantics are governed.' },
  { id: 'BOF-19', semanticModelState: 'governed-semantic-model', workspaces: ['F03','F07','F09','F14','F27'], lifecycleStages: ['Estimate','Quote','Contract','Procure','Produce','Construct','Control','Invoice','Account','Operate','Maintain','Dispose'], processChains: ['estimate-to-project-control','procure-to-pay','change-to-commercial-position','valuation-to-cash','supplier-progress-to-payment','record-to-report'], overlays: ['development','commercial-management','contracting','manufacturing','infrastructure','property-fm'], note: 'Finance, accounting, tax, treasury and project financial-control semantics are governed.' },
  { id: 'BOF-20', semanticModelState: 'governed-semantic-model', workspaces: ['F03','F09','F14','F22','F23','F27'], lifecycleStages: ['Estimate','Design','Procure','Produce','Construct','Control','Handover','Operate','Maintain','Refurbish','Dispose'], processChains: ['asset-to-retirement','record-to-report'], overlays: ['development','design','engineering','manufacturing','infrastructure','property-fm','retrofit','regulation'], note: 'Carbon methodology/factors, baseline/budget/target, embodied and operational assessment, utility/waste/circularity, EPD/provenance, responsible procurement, environmental/social-value measures and climate/resilience risk semantics are governed.' },
  { id: 'BOF-21', semanticModelState: 'candidate-only', workspaces: ['F02','F03','F13','F20','F29'], lifecycleStages: ['Plan','Procure','Construct','Control','Operate'], processChains: ['incident/defect/NCR-to-resolution','record-to-report'], overlays: ['commercial-management','contracting','manufacturing','infrastructure','property-fm','regulation'], note: 'Enterprise risk, compliance, control and audit family remains to be canonicalized.' },
  { id: 'BOF-22', semanticModelState: 'partial-semantic-model', workspaces: ['F02','F19','F20','F21','F26'], lifecycleStages: ['Contract','Control','Account','Handover','Operate','Dispose'], processChains: ['record-to-report'], overlays: ['development','commercial-management','contracting','infrastructure','property-fm','regulation','heritage'], note: 'Legal Hold/retention foundations are governed; wider legal, privacy and corporate-secretariat objects remain open.' },
  { id: 'BOF-23', semanticModelState: 'candidate-only', workspaces: ['F16','F18','F24'], lifecycleStages: ['Control','Operate'], processChains: [], overlays: ['infrastructure','property-fm','regulation'], note: 'Continuity, crisis and physical-security family remains to be canonicalized.' },
  { id: 'BOF-24', semanticModelState: 'candidate-only', workspaces: ['F16','F17','F18','F24'], lifecycleStages: ['Plan','Control','Operate','Maintain'], processChains: ['record-to-report'], overlays: ['engineering','manufacturing','infrastructure','property-fm','regulation'], note: 'IT, data, cyber, analytics and AI objects remain a convergence gap.' },
  { id: 'BOF-25', semanticModelState: 'partial-semantic-model', workspaces: ['F06','F21','F25','F26'], lifecycleStages: ['Market','Lead','Opportunity','Contract','Control','Handover','Operate','Dispose'], processChains: ['design-to-approved-information','record-to-report'], overlays: ['development','design','commercial-management','regulation','heritage'], note: 'Information Container/records-retention foundations are governed; knowledge/comms/stakeholder objects remain open.' },
  { id: 'BOF-26', semanticModelState: 'candidate-only', workspaces: ['F01','F03','F15','F28','F29'], lifecycleStages: ['Plan','Construct','Control','Operate','Refurbish'], processChains: ['plan-to-perform','record-to-report'], overlays: ['development','contracting','manufacturing','infrastructure','property-fm','retrofit'], note: 'Transformation, organisation change and process-improvement family remains to be canonicalized.' },
  { id: 'BOF-27', semanticModelState: 'governed-semantic-model', workspaces: ALL_WORKSPACES, lifecycleStages: ALL_STAGES, processChains: [...endToEndChains], overlays: [...specialistOverlays], note: 'Shared work/request/decision primitives are governed cross-workspace and do not replace domain truth.' },
  { id: 'BOF-28', semanticModelState: 'governed-semantic-model', workspaces: ALL_WORKSPACES, lifecycleStages: ALL_STAGES, processChains: [...endToEndChains], overlays: [...specialistOverlays], note: 'Evidence, audit, correction/reversal, retention and outbox primitives are governed cross-workspace.' },
  { id: 'BOF-29', semanticModelState: 'governed-semantic-model', workspaces: ALL_WORKSPACES, lifecycleStages: ALL_STAGES, processChains: [...endToEndChains], overlays: [...specialistOverlays], note: 'Reference, classification, jurisdiction and policy/configuration primitives are governed cross-workspace.' }
];

export const governedCanonicalizationDecisions = [
  ...foundationCanonicalization,
  ...builtEnvironmentCanonicalization,
  ...commercialProcurementCanonicalization,
  ...itemManufacturingCanonicalization,
  ...inventoryLogisticsCanonicalization,
  ...controlledInformationCanonicalization,
  ...assetOperationsCanonicalization,
  ...financeAccountingCanonicalization,
  ...sharedWorkEvidenceCanonicalization,
  ...referenceConfigurationCanonicalization,
  ...crmBusinessDevelopmentCanonicalization,
  ...estimatingTenderingCanonicalization,
  ...peopleHcmCanonicalization,
  ...qhseAssuranceCanonicalization,
  ...buildingSafetyRegulatoryCanonicalization,
  ...sustainabilityCarbonCanonicalization
];

const decisionKeys = new Set(governedCanonicalizationDecisions.map((entry) => entry.candidateKey));
const familyById = new Map(register.families.map((family) => [family.id, family]));

export const familyCoverageAudit = familyCoverageDefinitions.map((definition) => {
  const family = familyById.get(definition.id);
  if (!family) throw new Error(`Unknown business-object family ${definition.id}`);
  const candidates = register.objects.filter((object) => object.family_id === definition.id);
  const decidedCandidateCount = candidates.filter((object) => decisionKeys.has(object.candidate_key)).length;
  const undecidedCandidateCount = candidates.length - decidedCandidateCount;
  return {
    ...definition,
    name: family.name,
    candidateCount: candidates.length,
    decidedCandidateCount,
    undecidedCandidateCount,
    decisionCoveragePct: candidates.length ? Math.round((decidedCandidateCount / candidates.length) * 1000) / 10 : 0
  };
});

const workspaceCoverage = new Set(familyCoverageDefinitions.flatMap((family) => family.workspaces));
const lifecycleCoverage = new Set(familyCoverageDefinitions.flatMap((family) => family.lifecycleStages));
const processCoverage = new Set(familyCoverageDefinitions.flatMap((family) => family.processChains));
const overlayCoverage = new Set(familyCoverageDefinitions.flatMap((family) => family.overlays));

export const convergenceGapFamilies = familyCoverageAudit
  .filter((family) => family.semanticModelState !== 'governed-semantic-model')
  .sort((a, b) => {
    if (a.semanticModelState !== b.semanticModelState) return a.semanticModelState === 'candidate-only' ? -1 : 1;
    return b.undecidedCandidateCount - a.undecidedCandidateCount;
  });

export const coverageAuditSummary = {
  candidateOccurrences: register.summary.candidateOccurrences,
  uniqueCandidateNames: register.summary.uniqueNames,
  duplicateGroups: register.summary.duplicateGroups,
  baselineDecisionCount: decisionKeys.size,
  baselineUndecidedCount: register.objects.length - decisionKeys.size,
  baselineDecisionCoveragePct: Math.round((decisionKeys.size / register.objects.length) * 1000) / 10,
  familyCount: familyCoverageAudit.length,
  governedFamilyCount: familyCoverageAudit.filter((family) => family.semanticModelState === 'governed-semantic-model').length,
  partialFamilyCount: familyCoverageAudit.filter((family) => family.semanticModelState === 'partial-semantic-model').length,
  candidateOnlyFamilyCount: familyCoverageAudit.filter((family) => family.semanticModelState === 'candidate-only').length,
  workspaceCount: enterpriseFunctions.length,
  coveredWorkspaceCount: workspaceCoverage.size,
  lifecycleStageCount: sectorLifecycle.length,
  coveredLifecycleStageCount: lifecycleCoverage.size,
  processChainCount: endToEndChains.length,
  coveredProcessChainCount: processCoverage.size,
  specialistOverlayCount: specialistOverlays.length,
  coveredSpecialistOverlayCount: overlayCoverage.size,
  externalBenchmark: {
    name: 'PTC Windchill 13.1.2',
    requiredDomains: 29,
    state: 'in-progress' as const,
    rule: 'Benchmark findings challenge completeness and semantics but never become automatic NuBlox schema authority.'
  }
};

export function validateCanonicalCoverageAudit() {
  const ids = familyCoverageDefinitions.map((family) => family.id);
  if (ids.length !== 29 || new Set(ids).size !== 29) return false;
  if (register.objects.length !== register.summary.candidateOccurrences) return false;
  if (coverageAuditSummary.coveredWorkspaceCount !== enterpriseFunctions.length) return false;
  if (coverageAuditSummary.coveredLifecycleStageCount !== sectorLifecycle.length) return false;
  if (coverageAuditSummary.coveredProcessChainCount !== endToEndChains.length) return false;
  if (coverageAuditSummary.coveredSpecialistOverlayCount !== specialistOverlays.length) return false;
  if (![...decisionKeys].every((key) => register.objects.some((object) => object.candidate_key === key))) return false;
  return true;
}
