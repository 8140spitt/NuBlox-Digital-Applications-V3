export type SustainabilityKind =
  | 'controlled-definition'
  | 'reference-source'
  | 'snapshot'
  | 'plan'
  | 'target'
  | 'projection'
  | 'child'
  | 'event-evidence'
  | 'reference'
  | 'declaration'
  | 'commitment'
  | 'shared-reference';

export type SustainabilityDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: SustainabilityKind;
  definition: string;
  identityRule: string;
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type SustainabilityRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  governance: string;
};

const sus = (
  modelId: string,
  candidateKeys: string[],
  canonicalName: string,
  kind: SustainabilityKind,
  definition: string,
  identityRule: string,
  keyData: string[],
  lifecycle: string[],
  governance: string[]
): SustainabilityDefinition => ({ modelId, candidateKeys, canonicalName, kind, definition, identityRule, keyData, lifecycle, governance });

export const sustainabilityCarbonModel: SustainabilityDefinition[] = [
  sus('SUS-CARBON-METHODOLOGY', ['BOF-20-001'], 'Carbon Methodology Definition', 'controlled-definition',
    'Versioned definition of carbon accounting boundaries, scopes, lifecycle modules, allocation rules and reporting conventions.',
    'Stable methodology identity with immutable published versions; assessments pin the exact version used.',
    ['method/version','standard/source','boundary rules','scopes/modules','allocation rules','effective dates'],
    ['Draft','Approved','Published','Superseded','Retired'],
    ['Methodology is configuration, not a carbon result.', 'Historical assessments retain exact methodology version.']),

  sus('SUS-CARBON-FACTOR-SOURCE', ['BOF-20-002'], 'Carbon Factor Source', 'reference-source',
    'Governed provider, dataset or method family from which carbon/emission factors are obtained.',
    'Stable source identity; individual factor entries are versioned and effective observations beneath it.',
    ['source/provider','dataset/version','geography','factor categories','publication/effective dates','provenance'],
    ['Draft','Active','Superseded','Retired'],
    ['Source is not the factor value itself.', 'Calculations pin exact source, dataset, factor and unit basis.']),

  sus('SUS-CARBON-FACTOR', [], 'Carbon Factor Entry', 'reference',
    'Versioned factor converting a defined activity or quantity into greenhouse-gas equivalent under stated context.',
    'Factor identity is scoped to source/dataset/version, factor key, geography/time and unit basis.',
    ['source/version','factor key','activity unit','GHG/unit','scope/module','geography','valid from/to'],
    ['Published','Superseded','Retired'],
    ['Published factors are immutable; corrections create successor entries.', 'Unit and source provenance are mandatory.']),

  sus('SUS-CARBON-BASELINE', ['BOF-20-003'], 'Carbon Baseline Snapshot', 'snapshot',
    'Approved point-in-time carbon baseline for a defined portfolio, project, asset or product scope, period and methodology.',
    'Immutable approved snapshot preserving exact source data, factor set, methodology and boundary used.',
    ['scope/boundary','baseline period','methodology/version','factor set','source-data references','total/by category','approved at'],
    ['Draft','Review','Approved','Superseded'],
    ['Baseline is not live actual carbon truth.', 'Later corrections never silently rewrite an approved baseline.']),

  sus('SUS-CARBON-BUDGET', ['BOF-20-004'], 'Carbon Budget', 'plan',
    'Planned carbon allowance or trajectory allocated across scope, time, stage, package, asset or other governed dimensions.',
    'Stable budget identity with controlled baselines and explicit methodology/metric basis.',
    ['scope','period','metric','allowance/trajectory','allocations','methodology','owner','baseline/version'],
    ['Draft','Review','Approved','Current','Superseded','Closed'],
    ['Carbon Budget is distinct from financial Budget and actual Carbon Assessment.', 'Approved versions remain reconstructable.']),

  sus('SUS-CARBON-TARGET', ['BOF-20-005'], 'Carbon Target', 'target',
    'Governed future performance target or commitment for a carbon metric and defined boundary.',
    'Stable target identity with baseline, target date, trajectory, methodology and accountable owner.',
    ['metric','scope/boundary','baseline','target value','target date','trajectory','owner'],
    ['Proposed','Approved','Active','Achieved','Missed','Superseded','Cancelled'],
    ['Target is not actual performance.', 'Changes preserve target history.']),

  sus('SUS-CARBON-ASSESSMENT', ['BOF-20-006'], 'Carbon Assessment', 'projection',
    'Calculated carbon position for defined scope and period using authoritative activities, quantities and pinned factors/methodology.',
    'Rebuildable calculation with optional immutable published snapshot; source records remain authoritative.',
    ['scope/period','methodology/version','factor entries','source activities/quantities','results','quality/completeness','calculated at'],
    ['Calculated','Reviewed','Published','Superseded'],
    ['Assessment is never independently editable source truth.', 'Published results pin every source and factor version used.']),

  sus('SUS-CARBON-LINE', ['BOF-20-007'], 'Carbon Assessment Line', 'child',
    'Contribution line within a Carbon Assessment for an Item, material, activity, Asset or resource quantity and exact factor/EPD basis.',
    'Line identity is subordinate to an assessment snapshot and references canonical subjects rather than recreating them.',
    ['subject reference','quantity/UOM','lifecycle module','factor/EPD','calculated carbon','source/evidence'],
    ['Calculated','Reviewed','Published'],
    ['Embodied Carbon Item does not become an Item master.', 'Line provenance supports recalculation and audit.']),

  sus('SUS-OP-ENERGY', ['BOF-20-008'], 'Operational Energy Assessment', 'projection',
    'Period and scope energy position derived from meter readings, Utility Consumption and other authoritative energy evidence.',
    'Rebuildable assessment preserving source completeness, normalization and period boundary.',
    ['building/asset/site scope','period','energy type','consumption sources','normalisation','result','quality'],
    ['Calculated','Reviewed','Published','Superseded'],
    ['Operational energy does not duplicate meter or utility source truth.', 'Published assessments pin exact source evidence.']),

  sus('SUS-OP-CARBON', ['BOF-20-009'], 'Operational Carbon Assessment', 'projection',
    'Operational carbon position derived from energy or utility activity plus exact carbon factors and methodology.',
    'Rebuildable assessment with immutable published snapshots linked to authoritative activity evidence.',
    ['scope/period','Utility Consumption','factor entries','methodology','result','quality'],
    ['Calculated','Reviewed','Published','Superseded'],
    ['Operational Carbon is not Utility Consumption.', 'Factor updates do not rewrite historic published assessments.']),

  sus('SUS-UTILITY-CONSUMPTION', ['BOF-20-010'], 'Utility Consumption', 'shared-reference',
    'Sustainability reference to the shared whole-life Utility Consumption event and evidence pattern.',
    'No sustainability-specific consumption identity; exact meter/account/source evidence remains canonical.',
    ['shared consumption reference','utility type','period','quantity/UOM','meter/source','quality'],
    ['Recorded','Verified','Corrected/Superseded'],
    ['BOF-20 reuses BOF-17 Utility Consumption.', 'Assessments consume this evidence rather than re-keying it.']),

  sus('SUS-WASTE-STREAM', ['BOF-20-011'], 'Waste Stream', 'reference',
    'Governed definition and classification of a waste or material flow with regulatory, material and treatment semantics.',
    'Stable stream identity or classification; actual quantities, movements and recovery evidence remain separate.',
    ['stream code/type','material/classification','hazard/regulatory status','treatment options','UOM','effectivity'],
    ['Draft','Active','Superseded','Retired'],
    ['Waste Stream is not Waste Consignment or inventory quantity.', 'Regulatory classification/effectivity is retained.']),

  sus('SUS-RECOVERY', ['BOF-20-012'], 'Material Recovery Record', 'event-evidence',
    'Immutable evidence that a defined material or waste quantity was recovered through a stated route or process.',
    'Occurrence identity preserves source stream, quantity, method, destination/result and supporting evidence.',
    ['waste/material source','quantity/UOM','recovery route','date','destination','resulting status','evidence'],
    ['Recorded','Verified','Invalidated/Corrected'],
    ['Recovery does not destructively alter source evidence.', 'Waste Consignment remains authoritative regulated transfer evidence where applicable.']),

  sus('SUS-REUSE', ['BOF-20-013'], 'Material Reuse Record', 'event-evidence',
    'Immutable evidence that identified material, Item, component or Asset was reused in a defined destination or use.',
    'Occurrence identity links source identity and provenance to destination, quantity and evidence.',
    ['source Item/material/Asset','quantity/UOM','origin','destination/use','date','condition/processing','evidence'],
    ['Recorded','Verified','Invalidated/Corrected'],
    ['Reuse evidence never creates a duplicate Item or Asset.', 'Inventory and Asset movements remain governed by their source domains.']),

  sus('SUS-CIRCULARITY', ['BOF-20-014'], 'Circularity Assessment', 'projection',
    'Calculated circularity position using defined methodology over input material, waste, recovery, reuse and end-of-life evidence.',
    'Rebuildable calculation with immutable published snapshots and exact methodology/source provenance.',
    ['scope/period','methodology','material inputs','waste/recovery/reuse','metrics/results','quality'],
    ['Calculated','Reviewed','Published','Superseded'],
    ['Assessment is not source material-flow truth.', 'Metrics remain reproducible from retained evidence.']),

  sus('SUS-EPD', ['BOF-20-015'], 'Environmental Product Declaration', 'declaration',
    'Governed externally issued environmental declaration for a defined product or material under programme and PCR rules.',
    'Stable declaration identity preserving issuer, programme/PCR, declared unit, product scope, publication/version, validity and content evidence.',
    ['declaration ID','Item/product reference','manufacturer/issuer','programme/PCR','declared unit','modules/results','verification','validity'],
    ['Received','Verified','Effective','Expired','Superseded','Withdrawn'],
    ['EPD references canonical Item and Organisation identity and does not replace either.', 'Declared results remain tied to exact version and unit basis.']),

  sus('SUS-MATERIAL-PROVENANCE', ['BOF-20-016'], 'Material Provenance Record', 'event-evidence',
    'Source-linked evidence describing origin, custody, transformation or certification history for material, Item, Lot, Batch or Serial.',
    'Each provenance assertion references canonical identities and source evidence; provenance does not create product or inventory masters.',
    ['Item/material/lot/batch/serial','origin/source Party/site','process/transformation','custody chain','certifications','dates','evidence'],
    ['Captured','Verified','Superseded/Invalidated'],
    ['Provenance references existing identities.', 'Claims remain attributable and auditable.']),

  sus('SUS-RESPONSIBLE-PROCUREMENT', ['BOF-20-017'], 'Responsible Procurement Assessment', 'projection',
    'Assessment of supplier, sourcing and Item evidence against responsible-procurement criteria for a defined procurement decision or monitoring period.',
    'Assessment snapshot pins criteria, Party/sourcing/item evidence, results and reviewer provenance.',
    ['supplier Party','sourcing context','Items/materials','criteria/method','evidence','results/findings','assessor/date'],
    ['Calculated','Reviewed','Published','Superseded'],
    ['Assessment does not become Supplier Party or Sourcing Evaluation identity.', 'Procurement can consume the result without duplicating evidence.']),

  sus('SUS-BIODIVERSITY-MEASURE', ['BOF-20-018'], 'Biodiversity Measure', 'projection',
    'Measured or calculated biodiversity baseline, position or outcome for a defined Site, Project or land scope.',
    'Measure snapshot references canonical spatial scope and source survey/evidence rather than creating Site or Land identity.',
    ['Site/land/project scope','metric/method','baseline/reference','measurement date','result','source evidence','quality'],
    ['Measured','Reviewed','Published','Superseded'],
    ['Biodiversity Measure is not Site or Land identity.', 'Method/version and spatial boundary are mandatory.']),

  sus('SUS-ENV-MEASURE', ['BOF-20-019'], 'Environmental Measure', 'projection',
    'Generic environmental KPI or position for a governed subject, metric, period and measurement/calculation method.',
    'Rebuildable measure or immutable published snapshot over authoritative source evidence.',
    ['subject/scope','metric','method','period','value/UOM','source evidence','quality'],
    ['Measured/Calculated','Reviewed','Published','Superseded'],
    ['Environmental Measure does not replace QHSE Environmental Aspect, Impact or source monitoring evidence.']),

  sus('SUS-SOCIAL-COMMITMENT', ['BOF-20-020'], 'Social Value Commitment', 'commitment',
    'Governed commitment to deliver defined social-value activity, outcome or metric within scope and time.',
    'Stable commitment identity with accountable owner, beneficiary/context, metric, target and evidence requirements.',
    ['scope/project/contract','commitment type','beneficiary/community','metric/target','period','owner','evidence requirements'],
    ['Proposed','Committed','Active','Completed','Closed','Cancelled'],
    ['Commitment is not evidence or achieved outcome.', 'Contract obligations may reference it without sharing identity.']),

  sus('SUS-SOCIAL-EVIDENCE', ['BOF-20-021'], 'Social Value Evidence', 'event-evidence',
    'Immutable attributable evidence of social-value activity or delivery.',
    'Evidence occurrence references commitment/context, actor, beneficiary, date, quantity/value and verification source.',
    ['commitment/context','activity','actor/Party','beneficiary','date','quantity/value/UOM','source evidence','verification'],
    ['Captured','Verified','Rejected/Invalidated'],
    ['Evidence does not itself claim outcome unless methodology supports it.', 'Beneficiary/privacy constraints are separately governed.']),

  sus('SUS-SOCIAL-OUTCOME', ['BOF-20-022'], 'Social Value Outcome', 'projection',
    'Measured or assessed social-value outcome derived from commitments and retained evidence under an explicit methodology.',
    'Rebuildable calculation with immutable published snapshots and exact source evidence and method.',
    ['scope/period','methodology','commitments','evidence','outcome metric/value','beneficiaries','quality'],
    ['Calculated','Reviewed','Published','Superseded'],
    ['Outcome is not independently editable source truth.', 'Monetised outcome measures remain separate from financial ledger values.']),

  sus('SUS-CLIMATE-RISK', ['BOF-20-023'], 'Climate Risk', 'shared-reference',
    'Sustainability specialization of shared Enterprise Risk for climate-related risk.',
    'No separate risk identity architecture; Enterprise Risk carries climate classification, horizon, scenario and affected scope.',
    ['Enterprise Risk reference','classification','scenario/horizon','affected scope','assessment references'],
    ['Identified','Assessed','Treating','Monitoring','Closed'],
    ['Climate Risk reuses Enterprise Risk.', 'Risk Assessments and treatments remain shared enterprise-risk records.']),

  sus('SUS-RESILIENCE-RISK', ['BOF-20-024'], 'Resilience Risk', 'shared-reference',
    'Sustainability specialization of shared Enterprise Risk for resilience and vulnerability risk.',
    'No separate risk identity architecture; Enterprise Risk carries resilience classification and affected critical scope.',
    ['Enterprise Risk reference','hazard/stressor','scenario/horizon','critical service/Asset/Site','assessment references'],
    ['Identified','Assessed','Treating','Monitoring','Closed'],
    ['Resilience Risk reuses Enterprise Risk.', 'Asset/service evidence remains linked to canonical operational records.']),

  sus('SUS-COST-CARBON-OPTION', ['BOF-20-025'], 'Cost-Carbon Option Assessment', 'projection',
    'Comparative decision-support assessment of alternatives using explicit financial or cost and carbon positions.',
    'Assessment snapshot references exact options, cost sources, carbon assessments, methodology, time basis and assumptions.',
    ['decision context/options','cost source/version','carbon source/version','time horizon','assumptions','comparison results','reviewed at'],
    ['Calculated','Reviewed','Published','Superseded'],
    ['Assessment is not Ledger or Estimate truth and not Carbon source truth.', 'Trade-off weighting remains explicit.'])
];

export const sustainabilityCarbonRelationships: SustainabilityRelationship[] = [
  { id:'SUS-R01', from:'SUS-CARBON-FACTOR', predicate:'published by', to:'SUS-CARBON-FACTOR-SOURCE', cardinality:'many-to-one', governance:'Every factor pins source and dataset version.' },
  { id:'SUS-R02', from:'SUS-CARBON-ASSESSMENT', predicate:'uses methodology', to:'SUS-CARBON-METHODOLOGY', cardinality:'many-to-one', governance:'Exact methodology version is retained.' },
  { id:'SUS-R03', from:'SUS-CARBON-ASSESSMENT', predicate:'contains', to:'SUS-CARBON-LINE', cardinality:'one-to-many', governance:'Lines are subordinate and source-linked.' },
  { id:'SUS-R04', from:'SUS-CARBON-LINE', predicate:'references', to:'CBO-ITEM', cardinality:'many-to-zero-or-one', governance:'Embodied-carbon contribution never duplicates Item.' },
  { id:'SUS-R05', from:'SUS-CARBON-LINE', predicate:'uses', to:'SUS-CARBON-FACTOR', cardinality:'many-to-zero-or-one', governance:'Exact factor and version remain auditable.' },
  { id:'SUS-R06', from:'SUS-CARBON-LINE', predicate:'may use declaration', to:'SUS-EPD', cardinality:'many-to-zero-or-one', governance:'EPD version and declared unit are retained.' },
  { id:'SUS-R07', from:'SUS-CARBON-BASELINE', predicate:'baseline for', to:'SUS-CARBON-TARGET', cardinality:'one-to-many', governance:'Target retains exact approved baseline reference.' },
  { id:'SUS-R08', from:'SUS-CARBON-BUDGET', predicate:'tracks against', to:'SUS-CARBON-TARGET', cardinality:'many-to-one-or-many', governance:'Budget remains separate from target and actual assessment.' },
  { id:'SUS-R09', from:'SUS-OP-ENERGY', predicate:'derived from', to:'OPS-UTILITY-CONSUMPTION', cardinality:'many-to-many', governance:'Consumption evidence remains authoritative.' },
  { id:'SUS-R10', from:'SUS-OP-CARBON', predicate:'derived from', to:'OPS-UTILITY-CONSUMPTION', cardinality:'many-to-many', governance:'Operational carbon references exact consumption sources.' },
  { id:'SUS-R11', from:'SUS-OP-CARBON', predicate:'uses', to:'SUS-CARBON-FACTOR', cardinality:'many-to-many', governance:'Historical factor versions are pinned.' },
  { id:'SUS-R12', from:'SUS-RECOVERY', predicate:'for stream', to:'SUS-WASTE-STREAM', cardinality:'many-to-one', governance:'Stream classification remains separate from recovery evidence.' },
  { id:'SUS-R13', from:'SUS-RECOVERY', predicate:'may reference transfer', to:'QHSE-WASTE-CONSIGNMENT', cardinality:'many-to-zero-or-many', governance:'Regulated waste transfer evidence remains QHSE truth.' },
  { id:'SUS-R14', from:'SUS-REUSE', predicate:'reuses', to:'CBO-ITEM', cardinality:'many-to-zero-or-one', governance:'Reuse references Item identity where applicable.' },
  { id:'SUS-R15', from:'SUS-CIRCULARITY', predicate:'uses', to:'SUS-RECOVERY', cardinality:'many-to-many', governance:'Assessment derives from retained recovery evidence.' },
  { id:'SUS-R16', from:'SUS-CIRCULARITY', predicate:'uses', to:'SUS-REUSE', cardinality:'many-to-many', governance:'Assessment derives from retained reuse evidence.' },
  { id:'SUS-R17', from:'SUS-EPD', predicate:'declares for', to:'CBO-ITEM', cardinality:'many-to-many', governance:'One Item may have multiple declaration versions or manufacturers.' },
  { id:'SUS-R18', from:'SUS-MATERIAL-PROVENANCE', predicate:'describes provenance of', to:'CBO-ITEM', cardinality:'many-to-one', governance:'Item identity remains canonical.' },
  { id:'SUS-R19', from:'SUS-RESPONSIBLE-PROCUREMENT', predicate:'may reference evaluation', to:'PROC-EVALUATION', cardinality:'many-to-zero-or-many', governance:'Sourcing evaluation and sustainability assessment remain separate evidence.' },
  { id:'SUS-R20', from:'SUS-BIODIVERSITY-MEASURE', predicate:'measures scope of', to:'CBO-PROJECT', cardinality:'many-to-zero-or-one', governance:'Project identity is reused; spatial scope may additionally apply.' },
  { id:'SUS-R21', from:'SUS-SOCIAL-EVIDENCE', predicate:'supports', to:'SUS-SOCIAL-COMMITMENT', cardinality:'many-to-one-or-many', governance:'Evidence and commitment remain separate.' },
  { id:'SUS-R22', from:'SUS-SOCIAL-OUTCOME', predicate:'derived from', to:'SUS-SOCIAL-EVIDENCE', cardinality:'many-to-many', governance:'Outcome remains reproducible from retained evidence.' },
  { id:'SUS-R23', from:'SUS-CLIMATE-RISK', predicate:'reuses', to:'RISK-ENTERPRISE-RISK', cardinality:'many-to-one-pattern', governance:'Climate risk is an Enterprise Risk classification and context.' },
  { id:'SUS-R24', from:'SUS-RESILIENCE-RISK', predicate:'reuses', to:'RISK-ENTERPRISE-RISK', cardinality:'many-to-one-pattern', governance:'Resilience risk is an Enterprise Risk classification and context.' },
  { id:'SUS-R25', from:'SUS-COST-CARBON-OPTION', predicate:'compares carbon via', to:'SUS-CARBON-ASSESSMENT', cardinality:'many-to-many', governance:'Exact carbon assessment version is referenced.' },
  { id:'SUS-R26', from:'SUS-COST-CARBON-OPTION', predicate:'may concern', to:'CBO-ASSET', cardinality:'many-to-many', governance:'Option assessment references canonical Asset where applicable.' }
];

export const sustainabilityCarbonRules = [
  'Sustainability references canonical Item, Asset, Project, Site, Party, Utility Consumption, Waste and financial/commercial records rather than creating parallel masters.',
  'Carbon Methodology and factor datasets are versioned definitions and reference data; assessments pin exact versions used.',
  'Carbon Baseline is an immutable snapshot; Carbon Budget and Carbon Target are plans/commitments; Carbon Assessment is calculated performance.',
  'Embodied Carbon Item is an assessment line referencing canonical Item or material identity, never a second Item master.',
  'Operational Energy and Operational Carbon are projections over authoritative consumption and activity evidence.',
  'BOF-20 Utility Consumption reuses the whole-life BOF-17 Utility Consumption event/evidence pattern.',
  'Waste Stream is reference/classification; Waste Consignment, Recovery and Reuse are separate retained evidence.',
  'Circularity Assessment is calculated from material-flow evidence and is not independently editable material truth.',
  'Environmental Product Declaration references Item and Organisation identity and pins exact declaration, version and unit basis.',
  'Material Provenance records origin, custody and transformation evidence without duplicating Item, Lot, Batch, Serial or inventory identity.',
  'Responsible Procurement Assessment is separate from Party/Supplier identity and Sourcing Evaluation while remaining linkable to both.',
  'Biodiversity and Environmental Measures preserve method, spatial boundary, period and source evidence.',
  'Social Value Commitment, Evidence and Outcome are distinct obligation, evidence and assessed-result layers.',
  'Climate Risk and Resilience Risk reuse the shared Enterprise Risk architecture.',
  'Cost-Carbon Option Assessment is decision support over referenced cost and carbon sources; it never becomes either source of truth.'
] as const;

export function validateSustainabilityCarbonModel() {
  const ids = new Set(sustainabilityCarbonModel.map((x) => x.modelId));
  const relIds = new Set(sustainabilityCarbonRelationships.map((x) => x.id));
  const external = new Set(['CBO-ITEM','OPS-UTILITY-CONSUMPTION','QHSE-WASTE-CONSIGNMENT','PROC-EVALUATION','CBO-PROJECT','RISK-ENTERPRISE-RISK','CBO-ASSET']);
  if (ids.size !== sustainabilityCarbonModel.length || relIds.size !== sustainabilityCarbonRelationships.length) return false;
  const candidates = new Set(sustainabilityCarbonModel.flatMap((x) => x.candidateKeys));
  for (let i = 1; i <= 25; i += 1) {
    if (!candidates.has(`BOF-20-${String(i).padStart(3, '0')}`)) return false;
  }
  if (sustainabilityCarbonModel.some((x) => !x.definition || !x.identityRule || !x.governance.length)) return false;
  return sustainabilityCarbonRelationships.every((x) => (ids.has(x.from) || external.has(x.from)) && (ids.has(x.to) || external.has(x.to)));
}
