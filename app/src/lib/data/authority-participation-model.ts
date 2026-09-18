export type AuthorityModelKind = 'identity' | 'relationship' | 'authorization';

export type AuthorityModelDefinition = {
  modelId: string;
  candidateKey: string;
  canonicalName: string;
  kind: AuthorityModelKind;
  definition: string;
  systemIdentity: string;
  scope: string[];
  keyData: string[];
  lifecycle: string[];
  effectivity: string;
  governance: string[];
};

export type AuthorityEvaluationStep = {
  order: number;
  name: string;
  rule: string;
};

export const authorityModel: AuthorityModelDefinition[] = [
  {
    modelId: 'AUTH-USER-IDENTITY',
    candidateKey: 'BOF-01-013',
    canonicalName: 'User Identity',
    kind: 'identity',
    definition:
      'The authenticated NuBlox principal. It proves who is signed in but does not, by itself, confer business authority.',
    systemIdentity:
      'Immutable user/principal identifier linked to the relevant Person/Party and identity-provider subject identifiers.',
    scope: ['tenant', 'identity provider'],
    keyData: [
      'linked Person/Party',
      'identity-provider subject',
      'authentication status',
      'account status'
    ],
    lifecycle: ['Invited', 'Active', 'Suspended', 'Disabled', 'Closed'],
    effectivity:
      'Account access and identity-provider links are auditable and effective-dated where required.',
    governance: [
      'Authentication and business authorization remain separate.',
      'A User Identity cannot directly own a commercial or statutory responsibility that belongs to a Party/Person.',
      'Suspending a User Identity does not delete the linked Person or business history.'
    ]
  },
  {
    modelId: 'AUTH-MEMBERSHIP',
    candidateKey: 'BOF-01-012',
    canonicalName: 'Membership',
    kind: 'relationship',
    definition:
      'An effective-dated participation relationship placing a Party within an Organisation, Organisation Unit, Project or other governed context.',
    systemIdentity: 'Immutable membership relationship ID.',
    scope: ['tenant', 'organisation', 'organisation unit', 'project'],
    keyData: ['subject Party', 'context object', 'membership type', 'valid from/to', 'status'],
    lifecycle: ['Proposed', 'Active', 'Suspended', 'Ended'],
    effectivity:
      'Every membership has explicit valid-from/valid-to semantics or a recorded open-ended period.',
    governance: [
      'Membership establishes participation, not unlimited permission.',
      'External parties can be members of a Project or collaboration context without becoming internal employees.',
      'Ended memberships remain historically queryable.'
    ]
  },
  {
    modelId: 'AUTH-PARTY-RELATIONSHIP',
    candidateKey: 'BOF-01-016',
    canonicalName: 'Party Relationship',
    kind: 'relationship',
    definition:
      'A governed relationship between Parties, such as customer, supplier, subcontractor, consultant, partner or regulator relationship.',
    systemIdentity: 'Immutable relationship ID linking two canonical Party identities.',
    scope: ['tenant', 'legal entity', 'commercial context'],
    keyData: ['from Party', 'to Party', 'relationship type', 'status', 'valid from/to'],
    lifecycle: ['Proposed', 'Active', 'Suspended', 'Ended'],
    effectivity:
      'Role and relationship status are effective-dated and may differ by Legal Entity or commercial context.',
    governance: [
      'Commercial roles do not create duplicate Organisation masters.',
      'Supplier/customer qualification states belong to the relationship or specialist qualification object, not Party identity.',
      'A Party may hold several simultaneous relationship types.'
    ]
  },
  {
    modelId: 'AUTH-ROLE-ASSIGNMENT',
    candidateKey: 'BOF-01-018',
    canonicalName: 'Role Assignment',
    kind: 'relationship',
    definition:
      'An effective-dated assignment of a Party to a governed functional/security role within an explicit scope.',
    systemIdentity: 'Immutable role-assignment ID.',
    scope: [
      'tenant',
      'workspace',
      'organisation unit',
      'project',
      'contract',
      'site',
      'object class'
    ],
    keyData: ['subject Party', 'role code', 'scope type/id', 'valid from/to', 'assignment source'],
    lifecycle: ['Proposed', 'Active', 'Suspended', 'Ended'],
    effectivity:
      'Assignments are effective-dated; inherited scope must be explicit and policy-governed.',
    governance: [
      'Role is not job title, position or identity.',
      'Role assignment can enable actions but cannot substitute for delegated financial/commercial authority.',
      'No role inheritance or scope cascade is assumed unless a policy explicitly defines it.'
    ]
  },
  {
    modelId: 'AUTH-RESPONSIBILITY-ASSIGNMENT',
    candidateKey: 'BOF-06-020',
    canonicalName: 'Responsibility Assignment',
    kind: 'relationship',
    definition:
      'A governed assignment making a Party accountable, responsible, consulted, informed or otherwise responsible for a specific business object or context.',
    systemIdentity: 'Immutable responsibility-assignment ID.',
    scope: [
      'tenant',
      'project',
      'information container',
      'contract',
      'asset',
      'any governed object'
    ],
    keyData: [
      'subject Party',
      'target object',
      'responsibility type',
      'valid from/to',
      'source/basis'
    ],
    lifecycle: ['Proposed', 'Active', 'Superseded', 'Ended'],
    effectivity:
      'Responsibilities are effective-dated so accountability at any historical point can be reconstructed.',
    governance: [
      'Responsibility is distinct from permission.',
      'One generic assignment pattern is reused across projects, information management and other domains.',
      'Accountability changes never overwrite the historic responsible party.'
    ]
  },
  {
    modelId: 'AUTH-DELEGATED-AUTHORITY',
    candidateKey: 'BOF-01-019',
    canonicalName: 'Delegated Authority',
    kind: 'authorization',
    definition:
      'A governed grant of decision or commitment authority from an authorised source to a Party, constrained by action, scope, value and time.',
    systemIdentity: 'Immutable authority-grant ID with retained revocation/history evidence.',
    scope: [
      'tenant',
      'legal entity',
      'organisation unit',
      'project',
      'contract',
      'authority framework'
    ],
    keyData: [
      'grantor/basis',
      'delegate Party',
      'authority type',
      'scope',
      'currency/value limit',
      'valid from/to',
      'revocation status'
    ],
    lifecycle: ['Draft', 'Approved', 'Active', 'Suspended', 'Revoked', 'Expired'],
    effectivity:
      'Authority is never valid outside its approved dates, scope, action types or monetary/quantitative limits.',
    governance: [
      'Approval permission alone is not sufficient for material decisions.',
      'Authority is evaluated at execution time, not merely when a task was assigned.',
      'Delegation never cascades onward unless the governing authority framework explicitly permits sub-delegation.',
      'The authority basis used for every material decision is captured as durable evidence.'
    ]
  }
];

export const authorityEvaluation: AuthorityEvaluationStep[] = [
  {
    order: 1,
    name: 'Authenticate',
    rule: 'Resolve an active User Identity and trusted authentication context.'
  },
  {
    order: 2,
    name: 'Resolve actor',
    rule: 'Resolve the User Identity to its canonical Person/Party; authentication alone grants no business action.'
  },
  {
    order: 3,
    name: 'Check participation',
    rule: 'Confirm applicable tenant/context Membership and that it is currently effective.'
  },
  {
    order: 4,
    name: 'Evaluate role',
    rule: 'Evaluate effective Role Assignments against the requested workspace/action and object scope.'
  },
  {
    order: 5,
    name: 'Evaluate responsibility',
    rule: 'Where the action depends on ownership or assignment, resolve effective Responsibility Assignments.'
  },
  {
    order: 6,
    name: 'Evaluate authority',
    rule: 'For material decisions/commitments, verify Delegated Authority type, scope, effective dates and value limits.'
  },
  {
    order: 7,
    name: 'Apply policy',
    rule: 'Apply segregation-of-duties, lifecycle-state, record-scope, tenant and other policy constraints. Default is deny.'
  },
  {
    order: 8,
    name: 'Present actions',
    rule: 'Only actions passing the evaluation are shown as actionable UI controls.'
  },
  {
    order: 9,
    name: 'Enforce and evidence',
    rule: 'Re-evaluate server-side on execution and persist actor, assignments, authority basis, scope and decision evidence.'
  }
];

export const authorityRules = [
  'Authentication is not authorization.',
  'Role is not identity and is not a job title.',
  'Responsibility does not automatically grant permission.',
  'Permission does not automatically grant delegated financial/commercial authority.',
  'All scoped assignments and grants are effective-dated and historically reconstructable.',
  'Segregation-of-duties rules can prohibit self-review/self-approval even where other permissions exist.',
  'The server is authoritative; hiding a UI action is never the security boundary.',
  'Authorization decisions are deny-by-default and evaluated against current object state and scope.',
  'A material action records an authority snapshot/evidence trail so later changes to roles or delegation do not rewrite history.'
];

export function validateAuthorityModel() {
  const ids = new Set<string>();
  const candidates = new Set<string>();
  for (const item of authorityModel) {
    if (!item.modelId || ids.has(item.modelId))
      throw new Error(`Duplicate authority model ID: ${item.modelId}`);
    if (!item.candidateKey || candidates.has(item.candidateKey))
      throw new Error(`Duplicate authority candidate: ${item.candidateKey}`);
    if (!item.scope.length || !item.keyData.length || !item.governance.length)
      throw new Error(`Incomplete authority definition: ${item.modelId}`);
    ids.add(item.modelId);
    candidates.add(item.candidateKey);
  }
  const orders = authorityEvaluation.map((step) => step.order);
  if (orders.some((value, index) => value !== index + 1))
    throw new Error('Authority evaluation steps must be sequential.');
  return true;
}
