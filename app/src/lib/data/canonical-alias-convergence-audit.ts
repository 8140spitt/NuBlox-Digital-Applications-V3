import register from '$lib/generated/business-object-register.json';
import { governedCanonicalizationDecisions } from './canonical-coverage-audit';

export type ConvergenceStrategy = 'shared-canonical' | 'explicitly-distinct' | 'governed-pattern';

export type ExactDuplicateResolution = {
  canonicalName: string;
  strategy: Exclude<ConvergenceStrategy, 'governed-pattern'>;
  outcome: string;
};

export type NearAliasChallenge = {
  id: string;
  label: string;
  candidateKeys: string[];
  strategy: ConvergenceStrategy;
  outcome: string;
};

export const exactDuplicateResolutions: ExactDuplicateResolution[] = [
  {
    canonicalName: 'Action',
    strategy: 'shared-canonical',
    outcome: 'Governance and project actions converge on Decision Action.'
  },
  {
    canonicalName: 'Activity',
    strategy: 'explicitly-distinct',
    outcome: 'CRM Activity and Schedule Activity retain different identity/lifecycle semantics.'
  },
  {
    canonicalName: 'Allocation',
    strategy: 'explicitly-distinct',
    outcome: 'Workforce Allocation and finance Settlement Allocation are separate relationships.'
  },
  {
    canonicalName: 'Call-off',
    strategy: 'shared-canonical',
    outcome: 'Procurement and logistics reuse one Call-off Order identity.'
  },
  {
    canonicalName: 'Comparison',
    strategy: 'shared-canonical',
    outcome: 'Estimating/procurement comparison converges on governed Sourcing Evaluation.'
  },
  {
    canonicalName: 'Completion Certificate',
    strategy: 'explicitly-distinct',
    outcome:
      'Statutory Completion Certificate and Delivery Completion Certificate remain legally distinct.'
  },
  {
    canonicalName: 'Compliance Requirement',
    strategy: 'shared-canonical',
    outcome: 'QHSE reuses the enterprise Compliance Requirement.'
  },
  {
    canonicalName: 'Constraint',
    strategy: 'explicitly-distinct',
    outcome: 'Development Constraint and Delivery Constraint have different scope and lifecycle.'
  },
  {
    canonicalName: 'Decision',
    strategy: 'shared-canonical',
    outcome: 'Governance and project controls reuse one immutable Decision evidence pattern.'
  },
  {
    canonicalName: 'Defect',
    strategy: 'shared-canonical',
    outcome: 'Quality, commissioning and operations reuse one governed Defect case identity.'
  },
  {
    canonicalName: 'Entitlement',
    strategy: 'explicitly-distinct',
    outcome: 'Claim Entitlement Basis and Service Entitlement retain different business meaning.'
  },
  {
    canonicalName: 'Information Container',
    strategy: 'shared-canonical',
    outcome:
      'Design/information and records management reuse one controlled Information Container identity.'
  },
  {
    canonicalName: 'Isolation',
    strategy: 'shared-canonical',
    outcome: 'Field operations and QHSE reuse one governed Isolation record/evidence chain.'
  },
  {
    canonicalName: 'Issue',
    strategy: 'explicitly-distinct',
    outcome: 'Project Issue and Information Issue are different case/event semantics.'
  },
  {
    canonicalName: 'Phase',
    strategy: 'shared-canonical',
    outcome: 'Project and field Phase converge on the Delivery Stage Assignment pattern.'
  },
  {
    canonicalName: 'Procurement Package',
    strategy: 'shared-canonical',
    outcome: 'Commercial and procurement workspaces reuse one Procurement Package.'
  },
  {
    canonicalName: 'Response',
    strategy: 'explicitly-distinct',
    outcome: 'Information Response and generic Request Response remain context-specific evidence.'
  },
  {
    canonicalName: 'Responsibility Assignment',
    strategy: 'shared-canonical',
    outcome: 'Project and information management reuse one contextual Responsibility Assignment.'
  },
  {
    canonicalName: 'Risk Assessment',
    strategy: 'shared-canonical',
    outcome: 'QHSE and enterprise risk reuse the governed Risk Assessment evidence pattern.'
  },
  {
    canonicalName: 'Site',
    strategy: 'shared-canonical',
    outcome: 'Field operations consumes the canonical built-environment Site identity.'
  },
  {
    canonicalName: 'Tax Code',
    strategy: 'shared-canonical',
    outcome: 'Finance reuses the shared jurisdictional Tax Code reference.'
  },
  {
    canonicalName: 'Training Record',
    strategy: 'shared-canonical',
    outcome: 'Handover training converges on the Person Learning Record.'
  },
  {
    canonicalName: 'Unit of Measure',
    strategy: 'shared-canonical',
    outcome: 'Item/inventory reuses the shared Unit of Measure reference.'
  },
  {
    canonicalName: 'Utility Consumption',
    strategy: 'shared-canonical',
    outcome: 'Operations and sustainability reuse one Utility Consumption evidence pattern.'
  },
  {
    canonicalName: 'Valuation',
    strategy: 'explicitly-distinct',
    outcome:
      'Property Valuation and Commercial Valuation retain different subjects, bases and lifecycles.'
  },
  {
    canonicalName: 'Zone',
    strategy: 'shared-canonical',
    outcome: 'Field operations reuses the canonical spatial Zone identity.'
  }
];

export const nearAliasChallenges: NearAliasChallenge[] = [
  {
    id: 'bill-of-material',
    label: 'BOM / Bill of Material',
    candidateKeys: ['BOF-10-013', 'BOF-11-002'],
    strategy: 'shared-canonical',
    outcome: 'One Bill of Material structure is reused by item/product and manufacturing contexts.'
  },
  {
    id: 'project-job',
    label: 'Project / Job',
    candidateKeys: ['BOF-06-003', 'BOF-06-004'],
    strategy: 'shared-canonical',
    outcome: 'Job is an industry alias for Project in project controls.'
  },
  {
    id: 'land-parcel',
    label: 'Land / Land Parcel',
    candidateKeys: ['BOF-04-007', 'BOF-16-004'],
    strategy: 'shared-canonical',
    outcome: 'Development work reuses the canonical Land Parcel identity.'
  },
  {
    id: 'item-types',
    label: 'Product / Material / Service Item',
    candidateKeys: ['BOF-10-001', 'BOF-10-002', 'BOF-10-003'],
    strategy: 'shared-canonical',
    outcome: 'One Item identity is typed/classified for product, material and service uses.'
  },
  {
    id: 'asset-type-model',
    label: 'Asset Type / Asset Model',
    candidateKeys: ['BOF-16-023', 'BOF-16-024'],
    strategy: 'explicitly-distinct',
    outcome:
      'Asset Type is a reusable classification/technical definition; Asset Model is a version-controlled model/template definition.'
  },
  {
    id: 'permit-to-work',
    label: 'Permit / Permit to Work',
    candidateKeys: ['BOF-12-017', 'BOF-13-021'],
    strategy: 'shared-canonical',
    outcome: 'Site operations consumes the QHSE-governed Permit to Work identity.'
  },
  {
    id: 'inspection-family',
    label: 'Inspection variants',
    candidateKeys: ['BOF-13-003', 'BOF-13-031', 'BOF-14-007', 'BOF-15-006', 'BOF-17-014'],
    strategy: 'governed-pattern',
    outcome:
      'Statutory/regulatory inspection reuse the shared Inspection pattern; commissioning result and maintenance inspection remain attributable execution/evidence records.'
  },
  {
    id: 'change-family',
    label: 'Change variants',
    candidateKeys: [
      'BOF-06-026',
      'BOF-07-027',
      'BOF-08-014',
      'BOF-14-006',
      'BOF-24-011',
      'BOF-28-003'
    ],
    strategy: 'governed-pattern',
    outcome:
      'Project, design, commercial, regulatory and technology changes retain domain authority; Change Event is shared immutable evidence rather than a generic change master.'
  },
  {
    id: 'evidence-family',
    label: 'Evidence variants',
    candidateKeys: ['BOF-07-014', 'BOF-09-028', 'BOF-14-012', 'BOF-21-017', 'BOF-28-007'],
    strategy: 'governed-pattern',
    outcome:
      'Domain evidence retains business meaning while reusing common evidence/provenance rules; Evidence Item never replaces domain truth.'
  },
  {
    id: 'certificate-family',
    label: 'Certificate / certification variants',
    candidateKeys: [
      'BOF-08-023',
      'BOF-13-016',
      'BOF-14-013',
      'BOF-15-011',
      'BOF-15-016',
      'BOF-18-013'
    ],
    strategy: 'governed-pattern',
    outcome:
      'Payment, quality, statutory completion, commissioning, delivery completion and person certification remain explicit evidence types with separate authority/basis.'
  },
  {
    id: 'risk-family',
    label: 'Risk and specialist risk assessments',
    candidateKeys: [
      'BOF-06-021',
      'BOF-09-026',
      'BOF-20-023',
      'BOF-20-024',
      'BOF-21-002',
      'BOF-21-003',
      'BOF-23-014',
      'BOF-23-015',
      'BOF-24-028'
    ],
    strategy: 'governed-pattern',
    outcome:
      'Project, supplier, climate and resilience risks reuse Enterprise Risk; specialist assessments reuse Risk Assessment with contextual methods and scope.'
  }
];

const decisionMap = new Map(
  governedCanonicalizationDecisions.map((decision) => [decision.candidateKey, decision])
);

function rootCandidateKey(candidateKey: string) {
  const seen = new Set<string>();
  let current = candidateKey;
  while (!seen.has(current)) {
    seen.add(current);
    const decision = decisionMap.get(current);
    if (decision?.decision !== 'MERGE' || !decision.targetCandidateKey) return current;
    current = decision.targetCandidateKey;
  }
  throw new Error(`Canonical merge cycle detected from ${candidateKey}`);
}

function duplicateCandidateKeys(candidateKeys: string) {
  return candidateKeys
    .split('|')
    .map((key) => key.trim())
    .filter(Boolean);
}

const exactResolutionByName = new Map(
  exactDuplicateResolutions.map((resolution) => [resolution.canonicalName, resolution])
);

export const exactDuplicateConvergenceAudit = register.duplicates.map((duplicate) => {
  const resolution = exactResolutionByName.get(duplicate.canonical_name);
  const candidateKeys = duplicateCandidateKeys(duplicate.candidate_keys);
  const rootKeys = [...new Set(candidateKeys.map(rootCandidateKey))];
  const allBaselineDecided = candidateKeys.every((key) => decisionMap.has(key));
  const resolved =
    Boolean(resolution) &&
    allBaselineDecided &&
    (resolution?.strategy === 'shared-canonical' ? rootKeys.length === 1 : rootKeys.length > 1);
  return {
    canonicalName: duplicate.canonical_name,
    candidateKeys,
    families: duplicate.families,
    strategy: resolution?.strategy ?? null,
    outcome: resolution?.outcome ?? null,
    rootKeys,
    allBaselineDecided,
    resolved
  };
});

export const nearAliasConvergenceAudit = nearAliasChallenges.map((challenge) => {
  const rootKeys = [...new Set(challenge.candidateKeys.map(rootCandidateKey))];
  const allBaselineDecided = challenge.candidateKeys.every((key) => decisionMap.has(key));
  const structurallyConsistent =
    challenge.strategy === 'shared-canonical'
      ? rootKeys.length === 1
      : challenge.strategy === 'explicitly-distinct'
        ? rootKeys.length > 1
        : true;
  return {
    ...challenge,
    rootKeys,
    allBaselineDecided,
    resolved: allBaselineDecided && structurallyConsistent
  };
});

export const aliasConvergenceSummary = {
  exactDuplicateGroups: register.duplicates.length,
  exactDuplicateGroupsResolved: exactDuplicateConvergenceAudit.filter((entry) => entry.resolved)
    .length,
  nearAliasChallenges: nearAliasConvergenceAudit.length,
  nearAliasChallengesResolved: nearAliasConvergenceAudit.filter((entry) => entry.resolved).length,
  unresolvedExactDuplicateGroups: exactDuplicateConvergenceAudit
    .filter((entry) => !entry.resolved)
    .map((entry) => entry.canonicalName),
  unresolvedNearAliasChallenges: nearAliasConvergenceAudit
    .filter((entry) => !entry.resolved)
    .map((entry) => entry.id)
};

export function validateCanonicalAliasConvergenceAudit() {
  if (register.duplicates.length !== 26) return false;
  if (exactDuplicateResolutions.length !== register.duplicates.length) return false;
  if (
    new Set(exactDuplicateResolutions.map((entry) => entry.canonicalName)).size !==
    exactDuplicateResolutions.length
  )
    return false;
  if (
    !register.duplicates.every((duplicate) => exactResolutionByName.has(duplicate.canonical_name))
  )
    return false;
  if (aliasConvergenceSummary.exactDuplicateGroupsResolved !== register.duplicates.length)
    return false;
  if (aliasConvergenceSummary.nearAliasChallengesResolved !== nearAliasChallenges.length)
    return false;
  return true;
}
