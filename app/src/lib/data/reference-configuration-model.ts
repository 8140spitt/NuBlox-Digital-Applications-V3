export type ReferenceConfigurationKind =
  'reference' | 'classification' | 'configuration' | 'policy' | 'version' | 'profile';

export type ReferenceConfigurationDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: ReferenceConfigurationKind;
  definition: string;
  identityRule: string;
  scope: string[];
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type ReferenceConfigurationRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  governance: string;
};

export type ReferenceConfigurationBoundary = {
  name: string;
  structure: string;
  purpose: string;
  mustNotBecome: string;
};

const cfg = (
  modelId: string,
  candidateKeys: string[],
  canonicalName: string,
  kind: ReferenceConfigurationKind,
  definition: string,
  identityRule: string,
  keyData: string[],
  governance: string[],
  scope: string[] = ['tenant', 'enterprise'],
  lifecycle: string[] = ['Draft', 'Active', 'Retired']
): ReferenceConfigurationDefinition => ({
  modelId,
  candidateKeys,
  canonicalName,
  kind,
  definition,
  identityRule,
  scope,
  keyData,
  lifecycle,
  governance
});

export const referenceConfigurationModel: ReferenceConfigurationDefinition[] = [
  cfg(
    'REF-JURISDICTION',
    ['BOF-29-001'],
    'Jurisdiction',
    'reference',
    'Legal or regulatory territorial/competence reference used to scope rules, obligations and reporting.',
    'Stable reference identity independent of Sites, Legal Entities and Projects.',
    ['name', 'country/region code', 'parent jurisdiction', 'authority context', 'validity'],
    [
      'Jurisdiction scopes policy applicability; it never becomes a business-entity or location identity.'
    ]
  ),
  cfg(
    'REF-CURRENCY',
    ['BOF-29-002'],
    'Currency',
    'reference',
    'Governed monetary-unit reference shared by commercial, procurement, treasury and accounting.',
    'Stable ISO-aligned identity; code changes/history are governed.',
    ['ISO code', 'name', 'minor units', 'active dates'],
    [
      'Currency is reference truth; monetary amounts retain the exact currency code used at transaction time.'
    ]
  ),
  cfg(
    'REF-EXCHANGE-RATE-SOURCE',
    ['BOF-29-003'],
    'Exchange Rate Source',
    'reference',
    'Definition of the approved provider/source and rate methodology for exchange-rate observations.',
    'Stable source identity distinct from each dated Exchange Rate observation.',
    ['provider', 'rate type', 'method', 'publication cadence', 'provenance'],
    ['Source definition does not become the rate observation itself.']
  ),
  cfg(
    'REF-UOM',
    ['BOF-29-004'],
    'Unit of Measure',
    'reference',
    'Shared measurement-unit definition with dimension and conversion semantics.',
    'Stable unit identity reused by items, quantities, assets, measurements and finance.',
    ['code', 'symbol', 'dimension', 'base unit', 'conversion rule'],
    ['Unit conversions are governed and effective-dated where standards require it.']
  ),
  cfg(
    'REF-CALENDAR',
    ['BOF-29-005'],
    'Calendar',
    'configuration',
    'Reusable working-time/calendar definition for planning, service, labour and operational contexts.',
    'Stable configuration identity with versioned working periods and exceptions.',
    ['timezone', 'working pattern', 'holidays', 'exceptions'],
    ['Calendar is not Schedule; Schedule consumes an approved calendar version.']
  ),
  cfg(
    'REF-FISCAL-CALENDAR',
    ['BOF-29-006'],
    'Fiscal Calendar',
    'configuration',
    'Accounting calendar defining financial years and period structure.',
    'Stable fiscal-calendar identity with immutable published period structure by version.',
    ['year definition', 'period pattern', 'close calendar', 'legal-entity applicability'],
    [
      'Fiscal Calendar remains distinct from general working calendars and Accounting Period runtime state.'
    ]
  ),
  cfg(
    'REF-NUMBERING-SCHEME',
    ['BOF-29-007'],
    'Numbering Scheme',
    'configuration',
    'Versioned policy for generating governed business identifiers.',
    'Stable scheme identity; generated business numbers never replace immutable system IDs.',
    ['prefix/pattern', 'sequence scope', 'reset rule', 'collision rule', 'effective version'],
    ['Identifier generation must be deterministic, auditable and concurrency-safe.']
  ),
  cfg(
    'REF-TAX-REGIME',
    ['BOF-29-008'],
    'Tax Regime',
    'reference',
    'Governed taxation framework applicable within one or more jurisdictions.',
    'Stable regime identity with explicit jurisdiction and effectivity.',
    ['tax type', 'jurisdiction', 'authority', 'effective dates'],
    ['Tax Regime classifies governing tax rules; transactional tax consequence remains separate.']
  ),
  cfg(
    'REF-TAX-CODE',
    ['BOF-29-009'],
    'Tax Code',
    'reference',
    'Effective tax-treatment reference under a Tax Regime.',
    'Stable code identity scoped to regime/jurisdiction and effectivity.',
    ['code', 'tax regime', 'rate/treatment', 'recoverability', 'effective dates'],
    ['Commercial, Procurement and Finance reuse the same Tax Code reference.']
  ),
  cfg(
    'REF-CLASSIFICATION-SYSTEM',
    ['BOF-29-010'],
    'Classification System',
    'classification',
    'Identity of a governed taxonomy/classification system such as Uniclass.',
    'Stable system identity; releases preserve source version and publication provenance.',
    ['name', 'publisher', 'system identifier', 'purpose'],
    ['Classification overlays canonical objects and never becomes their primary identity.']
  ),
  cfg(
    'REF-CLASSIFICATION-RELEASE',
    ['BOF-29-011'],
    'Classification Release',
    'version',
    'Published/versioned release of a Classification System.',
    'Immutable release identity under one Classification System.',
    ['release/version', 'publication date', 'effective dates', 'source digest'],
    [
      'Codes are always resolved against an explicit release; historical assignments remain interpretable.'
    ]
  ),
  cfg(
    'REF-CLASSIFICATION-CODE',
    ['BOF-29-012', 'BOF-29-013'],
    'Classification Code',
    'classification',
    'Reference entry within a Classification Release, including Uniclass codes when the system is Uniclass.',
    'Stable code-within-release identity; code meaning is never inferred without system/release.',
    ['code', 'title', 'parent code', 'release', 'status'],
    [
      'Uniclass is handled through the generic classification model, not a parallel identity architecture.'
    ]
  ),
  cfg(
    'REF-CONTRACT-FORM-FAMILY',
    ['BOF-29-014'],
    'Contract Form Family',
    'reference',
    'Reference family for standard or bespoke contract/appointment forms.',
    'Stable family identity used to classify templates/contracts.',
    ['name', 'publisher/body', 'edition family', 'jurisdiction applicability'],
    ['Contract-form classification never becomes Contract identity.']
  ),
  cfg(
    'REF-CONTRACT-TEMPLATE',
    ['BOF-29-015'],
    'Contract Template',
    'configuration',
    'Version-controlled legal/commercial template used to originate governed Contracts.',
    'Immutable published template version; instantiated Contract retains its own identity and agreed content.',
    ['form family', 'template version', 'clauses/options', 'jurisdiction', 'effective dates'],
    ['Template updates never rewrite existing Contracts.']
  ),
  cfg(
    'REF-LIFECYCLE',
    ['BOF-29-016'],
    'Lifecycle Definition',
    'configuration',
    'Versioned definition of allowed domain lifecycle states and transitions for a governed object type.',
    'Stable definition identity with immutable published versions.',
    ['applies-to type', 'states', 'transition rules', 'published version'],
    ['Runtime object state belongs to the domain object, not to the definition or workflow engine.']
  ),
  cfg(
    'REF-LIFECYCLE-STATE',
    ['BOF-29-017'],
    'Lifecycle State Definition',
    'configuration',
    'Configured state within a Lifecycle Definition.',
    'Identity is scoped to one lifecycle definition/version.',
    ['state key', 'label', 'terminal flag', 'entry/exit constraints'],
    ['State definition is configuration, not a runtime business object.']
  ),
  cfg(
    'REF-WORKFLOW',
    ['BOF-29-018', 'BOF-29-019'],
    'Workflow Definition',
    'configuration',
    'Versioned orchestration definition used by shared workflow runtime.',
    'Stable workflow identity with immutable published versions; template semantics are represented by reusable definitions.',
    ['trigger/context', 'steps', 'routing', 'timeouts', 'version'],
    ['Workflow coordinates work and never owns authoritative domain truth.']
  ),
  cfg(
    'REF-STATUS-CODE',
    ['BOF-29-020'],
    'Status Code',
    'reference',
    'Governed vocabulary entry for contextual non-lifecycle status classification.',
    'Stable code identity scoped to a vocabulary/context.',
    ['code', 'label', 'vocabulary', 'effectivity'],
    ['Status codes supplement explicit domain semantics; they do not replace object lifecycle.']
  ),
  cfg(
    'REF-SUITABILITY-CODE',
    ['BOF-29-021'],
    'Suitability Code',
    'reference',
    'Governed information-suitability/use reference for controlled information exchange.',
    'Stable code identity with standard/source and effectivity.',
    ['code', 'meaning', 'standard/source', 'allowed uses'],
    [
      'Suitability is an information classification and never becomes Information Container identity.'
    ]
  ),
  cfg(
    'REF-INFORMATION-CONTAINER-TYPE',
    ['BOF-29-022'],
    'Information Container Type',
    'reference',
    'Definition of governed information types such as drawing, model, specification or document.',
    'Stable type identity referenced by Information Containers.',
    ['type key', 'name', 'allowed representations', 'metadata rules'],
    ['Type/configuration is not controlled content or a file.']
  ),
  cfg(
    'REF-PROJECT-STAGE',
    ['BOF-29-023'],
    'Project Stage Definition',
    'configuration',
    'Reusable configured delivery-stage/phase definition.',
    'Stable definition identity; Project stage participation is an effective assignment.',
    ['stage code', 'name', 'sequence/hierarchy', 'entry/exit criteria'],
    ['Stage Definition is not Project lifecycle, workflow state or Project identity.']
  ),
  cfg(
    'REF-RETENTION-RULE',
    ['BOF-29-024'],
    'Retention Rule',
    'policy',
    'Versioned rule determining retention trigger, duration, disposition and exceptions.',
    'Stable policy identity with immutable published versions.',
    ['trigger', 'period', 'disposition', 'jurisdiction', 'exceptions'],
    ['Runtime Legal Hold and disposition decisions remain separate evidence/control records.']
  ),
  cfg(
    'REF-APPROVAL-AUTHORITY-RULE',
    ['BOF-29-025'],
    'Approval Authority Rule',
    'policy',
    'Policy determining required authority for protected approval/decision actions.',
    'Stable rule identity evaluated against current subject, scope, amount and actor context.',
    ['action', 'object type', 'scope', 'thresholds', 'required authority'],
    ['A rule is not an Approval Request, Decision or authority grant.']
  ),
  cfg(
    'REF-DELEGATED-AUTHORITY-RULE',
    ['BOF-29-026'],
    'Delegated Authority Rule',
    'policy',
    'Policy governing creation, limits, use and revocation of Delegated Authority grants.',
    'Stable policy identity distinct from each effective grant.',
    ['grant types', 'allowed scope', 'limits', 'duration', 'revocation conditions'],
    ['Work delegation cannot satisfy Delegated Authority policy.']
  ),
  cfg(
    'REF-PERMISSION',
    ['BOF-29-027'],
    'Permission Definition',
    'configuration',
    'Canonical vocabulary of protected actions/resources used by authorization policy.',
    'Stable permission identity independent of any user/role assignment.',
    ['permission key', 'resource/action', 'scope semantics'],
    ['Permission Definition is configuration; effective authorization is contextual evaluation.']
  ),
  cfg(
    'REF-ROLE',
    ['BOF-29-028'],
    'Role Definition',
    'configuration',
    'Reusable role definition describing intended responsibilities and permission composition.',
    'Stable role identity; effective participation is through scoped Role Assignment.',
    ['role key', 'purpose', 'permission set', 'constraints'],
    ['Role is not Person identity, job title, responsibility or delegated authority.']
  ),
  cfg(
    'REF-LOCATION-CLASSIFICATION',
    ['BOF-29-029'],
    'Location Classification Profile',
    'profile',
    'Applicability profile defining classification systems/codes permitted for spatial/location targets.',
    'Stable profile identity; classifications attach to existing spatial identities.',
    ['target types', 'classification systems', 'mandatory/optional rules'],
    ['Classification never replaces Site, Building, Space or other spatial identity.']
  ),
  cfg(
    'REF-ASSET-CLASSIFICATION',
    ['BOF-29-030'],
    'Asset Classification Profile',
    'profile',
    'Applicability profile for System, Asset and Component classification.',
    'Stable profile identity referencing shared classification systems.',
    ['target types', 'classification systems', 'mandatory attributes'],
    ['Classification never creates or duplicates Asset identity.']
  ),
  cfg(
    'REF-COST-CLASSIFICATION',
    ['BOF-29-031'],
    'Cost Classification Profile',
    'profile',
    'Applicability profile for commercial/financial cost classification.',
    'Stable profile identity referencing shared classification systems.',
    ['target contexts', 'classification systems', 'mapping rules'],
    ['Cost classification remains distinct from Cost Code, GL Account and WBS identity.']
  ),
  cfg(
    'REF-WORK-CLASSIFICATION',
    ['BOF-29-032'],
    'Work Classification Profile',
    'profile',
    'Applicability profile for project, operational and workflow work classifications.',
    'Stable profile identity referencing shared classification systems.',
    ['target work types', 'classification systems', 'mapping rules'],
    [
      'Classification does not become Work Package, Schedule Activity, Work Order or Work Item identity.'
    ]
  ),
  cfg(
    'REF-RESOURCE-CLASSIFICATION',
    ['BOF-29-033'],
    'Resource Classification Profile',
    'profile',
    'Applicability profile for labour, plant, capability and resource classifications.',
    'Stable profile identity referencing shared classification systems.',
    ['resource target types', 'classification systems', 'mapping rules'],
    ['Resource classification never duplicates Party, Asset or resource identity.']
  ),
  cfg(
    'REF-REGULATORY-REGIME',
    ['BOF-29-034'],
    'Regulatory Regime',
    'reference',
    'Governed regulatory framework with authority, jurisdiction, applicability and effectivity.',
    'Stable regime identity with versioned/effective requirements references.',
    ['authority/source', 'jurisdiction', 'scope', 'effective dates'],
    ['Regulatory Regime scopes obligations; compliance evidence remains separate.']
  ),
  cfg(
    'REF-EVIDENCE-TYPE',
    ['BOF-29-035'],
    'Evidence Type',
    'reference',
    'Reference definition classifying evidence records/artefacts.',
    'Stable evidence-type identity.',
    ['type key', 'meaning', 'required metadata', 'retention class'],
    ['Evidence Type never substitutes for Evidence Item, provenance or integrity evidence.']
  ),
  cfg(
    'REF-RECORD-TYPE',
    ['BOF-29-036'],
    'Record Type',
    'reference',
    'Reference definition classifying declared records and controlled information for records-management policy.',
    'Stable record-type identity.',
    ['type key', 'declaration rules', 'retention class', 'metadata profile'],
    ['Record Type is classification/configuration, not the retained record itself.']
  ),
  cfg(
    'REF-DATA-RETENTION-CLASS',
    ['BOF-29-037'],
    'Data Retention Class',
    'reference',
    'Reference/policy class used to select retention and handling rules for data, records and evidence.',
    'Stable class identity with jurisdiction/policy mapping.',
    ['class key', 'sensitivity/context', 'retention rules', 'jurisdiction'],
    ['Retention Class is not Legal Hold, disposition or deletion evidence.']
  )
];

export const referenceConfigurationBoundaries: ReferenceConfigurationBoundary[] = [
  {
    name: 'Identity vs classification',
    structure: 'Canonical object → Classification Assignment → System / Release / Code',
    purpose: 'Apply external/internal taxonomies without changing the target identity.',
    mustNotBecome: 'classification code as primary object identity'
  },
  {
    name: 'Definition vs runtime',
    structure: 'Lifecycle / Workflow / Stage Definition → runtime object/context',
    purpose:
      'Keep configuration versioned while runtime truth stays with the domain object/work instance.',
    mustNotBecome: 'configuration table as business state'
  },
  {
    name: 'Policy vs decision',
    structure: 'Authority / Retention / Permission Rule → contextual evaluation → decision/action',
    purpose: 'Separate reusable policy from each attributable business decision.',
    mustNotBecome: 'rule treated as approval, grant or disposition evidence'
  },
  {
    name: 'Reference vs transaction',
    structure: 'Currency / UoM / Tax / Calendar → referenced by transaction',
    purpose: 'Reuse common semantics while retaining transaction-time values and provenance.',
    mustNotBecome: 'mutable reference updates rewriting historical transactions'
  }
];

export const referenceConfigurationRelationships: ReferenceConfigurationRelationship[] = [
  {
    id: 'REF-R01',
    from: 'REF-TAX-REGIME',
    predicate: 'applies within',
    to: 'REF-JURISDICTION',
    cardinality: 'many-to-many',
    governance: 'Effectivity and applicability are explicit.'
  },
  {
    id: 'REF-R02',
    from: 'REF-TAX-CODE',
    predicate: 'belongs to',
    to: 'REF-TAX-REGIME',
    cardinality: 'many-to-one',
    governance: 'Tax Code meaning is resolved under its regime/version/effectivity.'
  },
  {
    id: 'REF-R03',
    from: 'FIN-EXCHANGE-RATE',
    predicate: 'sourced from',
    to: 'REF-EXCHANGE-RATE-SOURCE',
    cardinality: 'many-to-one',
    governance: 'Each observation retains exact source/provenance.'
  },
  {
    id: 'REF-R04',
    from: 'FIN-EXCHANGE-RATE',
    predicate: 'quotes',
    to: 'REF-CURRENCY',
    cardinality: 'many-to-many',
    governance: 'Base/quote currencies are explicit.'
  },
  {
    id: 'REF-R05',
    from: 'REF-CLASSIFICATION-RELEASE',
    predicate: 'release of',
    to: 'REF-CLASSIFICATION-SYSTEM',
    cardinality: 'many-to-one',
    governance: 'Published release is immutable.'
  },
  {
    id: 'REF-R06',
    from: 'REF-CLASSIFICATION-CODE',
    predicate: 'defined in',
    to: 'REF-CLASSIFICATION-RELEASE',
    cardinality: 'many-to-one',
    governance: 'Historical code semantics remain tied to exact release.'
  },
  {
    id: 'REF-R07',
    from: 'REF-CONTRACT-TEMPLATE',
    predicate: 'uses form family',
    to: 'REF-CONTRACT-FORM-FAMILY',
    cardinality: 'many-to-one',
    governance: 'Template version and form-family provenance are retained.'
  },
  {
    id: 'REF-R08',
    from: 'REF-CONTRACT-TEMPLATE',
    predicate: 'applicable in',
    to: 'REF-JURISDICTION',
    cardinality: 'many-to-many',
    governance: 'Jurisdiction applicability is explicit and versioned.'
  },
  {
    id: 'REF-R09',
    from: 'CBO-CONTRACT',
    predicate: 'originated from',
    to: 'REF-CONTRACT-TEMPLATE',
    cardinality: 'many-to-zero/one',
    governance:
      'Contract retains template/version provenance without remaining dynamically bound to later template edits.'
  },
  {
    id: 'REF-R10',
    from: 'REF-LIFECYCLE-STATE',
    predicate: 'state in',
    to: 'REF-LIFECYCLE',
    cardinality: 'many-to-one',
    governance: 'State key is scoped to exact lifecycle version.'
  },
  {
    id: 'REF-R11',
    from: 'WORK-WORKFLOW-INSTANCE',
    predicate: 'instantiated from',
    to: 'REF-WORKFLOW',
    cardinality: 'many-to-one',
    governance: 'Runtime instance pins an exact published definition version.'
  },
  {
    id: 'REF-R12',
    from: 'DEL-STAGE-ASSIGNMENT',
    predicate: 'uses definition',
    to: 'REF-PROJECT-STAGE',
    cardinality: 'many-to-one',
    governance: 'Project-specific stage dates/status remain on assignment.'
  },
  {
    id: 'REF-R13',
    from: 'CBO-INFORMATION-CONTAINER',
    predicate: 'typed by',
    to: 'REF-INFORMATION-CONTAINER-TYPE',
    cardinality: 'many-to-one',
    governance: 'Type controls metadata/behaviour without becoming information identity.'
  },
  {
    id: 'REF-R14',
    from: 'CBO-INFORMATION-CONTAINER',
    predicate: 'classified by suitability',
    to: 'REF-SUITABILITY-CODE',
    cardinality: 'many-to-many',
    governance: 'Assignment retains applicable revision/issue context.'
  },
  {
    id: 'REF-R15',
    from: 'REF-ROLE',
    predicate: 'composes',
    to: 'REF-PERMISSION',
    cardinality: 'many-to-many',
    governance: 'Role composition does not itself assign the role to any Party.'
  },
  {
    id: 'REF-R16',
    from: 'AUTH-ROLE-ASSIGNMENT',
    predicate: 'uses definition',
    to: 'REF-ROLE',
    cardinality: 'many-to-one',
    governance: 'Assignment carries Party, scope and effectivity.'
  },
  {
    id: 'REF-R17',
    from: 'REF-APPROVAL-AUTHORITY-RULE',
    predicate: 'requires',
    to: 'REF-PERMISSION',
    cardinality: 'many-to-many',
    governance: 'Permission remains necessary but may not be sufficient for protected action.'
  },
  {
    id: 'REF-R18',
    from: 'AUTH-DELEGATED-AUTHORITY',
    predicate: 'governed by',
    to: 'REF-DELEGATED-AUTHORITY-RULE',
    cardinality: 'many-to-one',
    governance: 'Grant records actor, scope, limits and validity separately from policy.'
  },
  {
    id: 'REF-R19',
    from: 'REF-RETENTION-RULE',
    predicate: 'applies to class',
    to: 'REF-DATA-RETENTION-CLASS',
    cardinality: 'many-to-many',
    governance: 'Published rule version is retained for disposition evidence.'
  },
  {
    id: 'REF-R20',
    from: 'REF-RETENTION-RULE',
    predicate: 'scoped by',
    to: 'REF-JURISDICTION',
    cardinality: 'many-to-many',
    governance: 'Conflicting/overlapping rules require explicit precedence policy.'
  },
  {
    id: 'REF-R21',
    from: 'REF-EVIDENCE-TYPE',
    predicate: 'defaults to retention class',
    to: 'REF-DATA-RETENTION-CLASS',
    cardinality: 'many-to-zero/one',
    governance: 'Object-specific/legal requirements may override defaults.'
  },
  {
    id: 'REF-R22',
    from: 'REF-RECORD-TYPE',
    predicate: 'defaults to retention class',
    to: 'REF-DATA-RETENTION-CLASS',
    cardinality: 'many-to-one',
    governance: 'Record declaration pins applicable type/policy version.'
  },
  {
    id: 'REF-R23',
    from: 'REF-REGULATORY-REGIME',
    predicate: 'applies within',
    to: 'REF-JURISDICTION',
    cardinality: 'many-to-many',
    governance: 'Applicability and effectivity are explicit.'
  },
  {
    id: 'REF-R24',
    from: 'REF-LOCATION-CLASSIFICATION',
    predicate: 'uses',
    to: 'REF-CLASSIFICATION-SYSTEM',
    cardinality: 'many-to-many',
    governance: 'Profile restricts allowed classifications for spatial targets.'
  },
  {
    id: 'REF-R25',
    from: 'REF-ASSET-CLASSIFICATION',
    predicate: 'uses',
    to: 'REF-CLASSIFICATION-SYSTEM',
    cardinality: 'many-to-many',
    governance: 'Profile restricts allowed classifications for asset targets.'
  },
  {
    id: 'REF-R26',
    from: 'REF-COST-CLASSIFICATION',
    predicate: 'uses',
    to: 'REF-CLASSIFICATION-SYSTEM',
    cardinality: 'many-to-many',
    governance: 'Profile remains distinct from cost accounting structures.'
  },
  {
    id: 'REF-R27',
    from: 'REF-WORK-CLASSIFICATION',
    predicate: 'uses',
    to: 'REF-CLASSIFICATION-SYSTEM',
    cardinality: 'many-to-many',
    governance: 'Profile remains distinct from scope/time/work identities.'
  },
  {
    id: 'REF-R28',
    from: 'REF-RESOURCE-CLASSIFICATION',
    predicate: 'uses',
    to: 'REF-CLASSIFICATION-SYSTEM',
    cardinality: 'many-to-many',
    governance: 'Profile remains distinct from Party/Asset/resource identity.'
  },
  {
    id: 'REF-R29',
    from: 'FIN-LEDGER',
    predicate: 'uses fiscal calendar',
    to: 'REF-FISCAL-CALENDAR',
    cardinality: 'many-to-one',
    governance: 'Ledger periods derive from controlled fiscal configuration.'
  },
  {
    id: 'REF-R30',
    from: 'DEL-SCHEDULE',
    predicate: 'uses calendar',
    to: 'REF-CALENDAR',
    cardinality: 'many-to-many',
    governance: 'Schedule pins calendar/version used for planning calculation.'
  }
];

export const referenceConfigurationRules = [
  'Reference/configuration data defines allowable meaning and policy; it is not transactional truth.',
  'Historical transactions retain the exact reference/configuration version needed to interpret them.',
  'Classification overlays canonical identity and never replaces Party, Project, Site, Asset, Item, Contract, information or work identity.',
  'Uniclass uses the generic Classification System → Release → Code model; there is no separate Uniclass master architecture.',
  'Lifecycle Definition is configuration; runtime lifecycle state remains domain-owned.',
  'Workflow Definition coordinates work but never becomes authoritative domain state.',
  'Project Stage Definition is not Project lifecycle or workflow state.',
  'Role Definition is not Role Assignment; Permission Definition is not authorization; Delegated Authority Rule is not a Delegated Authority grant.',
  'Approval Authority Rule is policy, not an Approval Request, Decision or Approval Evidence.',
  'Retention Rule is policy; Legal Hold and Retention Disposition Decision remain runtime control/evidence.',
  'Numbering Scheme creates business identifiers but never replaces immutable system identity.',
  'Reference updates must not retroactively rewrite historical business meaning.',
  'Jurisdiction and Regulatory Regime scope obligations without becoming organisation/location identities.',
  'Currency, Unit of Measure, Calendar, Tax and classification references are shared across workspaces rather than locally duplicated.'
];

export function validateReferenceConfigurationModel() {
  const ids = new Set(referenceConfigurationModel.map((entry) => entry.modelId));
  if (ids.size !== referenceConfigurationModel.length) return false;
  const candidateKeys = referenceConfigurationModel.flatMap((entry) => entry.candidateKeys);
  const expected = Array.from(
    { length: 37 },
    (_, index) => `BOF-29-${String(index + 1).padStart(3, '0')}`
  );
  if (!expected.every((key) => candidateKeys.includes(key))) return false;
  const external = new Set([
    'FIN-EXCHANGE-RATE',
    'CBO-CONTRACT',
    'WORK-WORKFLOW-INSTANCE',
    'DEL-STAGE-ASSIGNMENT',
    'CBO-INFORMATION-CONTAINER',
    'AUTH-ROLE-ASSIGNMENT',
    'AUTH-DELEGATED-AUTHORITY',
    'FIN-LEDGER',
    'DEL-SCHEDULE'
  ]);
  return referenceConfigurationRelationships.every(
    (relationship) =>
      (ids.has(relationship.from) || external.has(relationship.from)) &&
      (ids.has(relationship.to) || external.has(relationship.to))
  );
}
