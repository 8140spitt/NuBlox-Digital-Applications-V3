import register from '$lib/generated/business-object-register.json';
import { benchmarkRefinementModel } from './benchmark-refinement-model';

export type CanonicalAggregateBoundary = {
  id: string;
  familyId: string;
  rootModelId: string;
  rootName: string;
  ownedMembers: string[];
  projections: string[];
  references: string[];
  writeAuthority: string;
  transactionRule: string;
  invariants: string[];
  state: 'frozen';
};

const agg = (
  id: string,
  familyId: string,
  rootModelId: string,
  rootName: string,
  ownedMembers: string[],
  projections: string[],
  references: string[],
  writeAuthority: string,
  transactionRule: string,
  invariants: string[]
): CanonicalAggregateBoundary => ({
  id,
  familyId,
  rootModelId,
  rootName,
  ownedMembers,
  projections,
  references,
  writeAuthority,
  transactionRule,
  invariants,
  state: 'frozen'
});

export const canonicalAggregateBoundaries: CanonicalAggregateBoundary[] = [
  agg(
    'AGG-01-TENANT',
    'BOF-01',
    'CBO-TENANT',
    'Tenant',
    [],
    [],
    ['CBO-LEGAL-ENTITY', 'CBO-ORGANISATION'],
    'Tenant administration commands only; business workspaces may read tenant context but cannot redefine tenant identity.',
    'Tenant identity/configuration changes commit independently from domain transactions.',
    ['Tenant is an isolation/security/configuration boundary, not a Legal Entity or Organisation.']
  ),
  agg(
    'AGG-01-PARTY',
    'BOF-01',
    'CBO-PARTY',
    'Party',
    ['CBO-PERSON', 'CBO-ORGANISATION', 'CBO-LEGAL-ENTITY'],
    [],
    [],
    'Foundation party/master-data commands.',
    'Identity-changing commands affect one Party identity at a time; external relationships update separately.',
    [
      'Person/Organisation/Legal Entity specialisations reuse Party identity rather than creating CRM/procurement/HCM copies.',
      'External identifiers never replace immutable system identity.'
    ]
  ),
  agg(
    'AGG-01-ORG-STRUCTURE',
    'BOF-01',
    'CBO-ORGANISATION-UNIT',
    'Organisation Unit',
    [],
    [],
    ['CBO-LEGAL-ENTITY', 'CBO-PARTY'],
    'Enterprise-structure administration.',
    'One structure command changes one Organisation Unit or one effective hierarchy relationship.',
    [
      'Division, Branch, Office and Team classifications do not create parallel organisation masters.'
    ]
  ),
  agg(
    'AGG-01-AUTHORITY',
    'BOF-01',
    'AUTH-DELEGATED-AUTHORITY',
    'Delegated Authority',
    [],
    [],
    [
      'AUTH-ROLE-ASSIGNMENT',
      'AUTH-RESPONSIBILITY-ASSIGNMENT',
      'CBO-PARTY',
      'CBO-ORGANISATION-UNIT'
    ],
    'Authorised identity/governance administration only.',
    'Authority grants/revocations are independent effective records; workflow delegation cannot mutate them.',
    ['Role, responsibility, permission and delegated authority remain distinct.']
  ),
  agg(
    'AGG-01-MASTER-STEWARDSHIP',
    'BOF-01',
    'MDG-STEWARDSHIP-CASE',
    'Master Data Stewardship Case',
    ['MDG-DUPLICATE-CANDIDATE', 'MDG-MERGE-DECISION', 'MDG-IDENTITY-REDIRECT'],
    [],
    ['CBO-PARTY', 'CBO-ITEM', 'CBO-ASSET'],
    'Master-data steward commands.',
    'The stewardship case records decision/evidence; application to a master occurs through that master aggregate command.',
    [
      'A match score never merges records automatically.',
      'Merge preserves redirects and provenance.'
    ]
  ),

  agg(
    'AGG-02-STRATEGY',
    'BOF-02',
    'SGP-STRATEGY-FRAMEWORK',
    'Strategy Framework',
    ['SGP-STRATEGIC-THEME'],
    [],
    ['SGP-STRATEGIC-OBJECTIVE', 'SGP-STRATEGIC-INITIATIVE'],
    'Strategy/governance administration.',
    'Framework version publication is one aggregate transaction; linked objectives/initiatives change independently.',
    ['Approved strategy versions are immutable historical reference points.']
  ),
  agg(
    'AGG-02-OBJECTIVE',
    'BOF-02',
    'SGP-STRATEGIC-OBJECTIVE',
    'Strategic Objective',
    [],
    [],
    ['SGP-STRATEGY-FRAMEWORK', 'SGP-KPI-DEFINITION'],
    'Strategy owners.',
    'One objective lifecycle change per transaction.',
    ['Objective identity survives target/KPI changes.']
  ),
  agg(
    'AGG-02-PERFORMANCE',
    'BOF-02',
    'SGP-KPI-DEFINITION',
    'KPI Definition',
    ['SGP-PERFORMANCE-TARGET', 'SGP-PERFORMANCE-OBSERVATION'],
    ['SGP-PERFORMANCE-SNAPSHOT'],
    ['CBO-PROJECT', 'CBO-ASSET'],
    'Performance governance for definitions/targets; observations are attributable evidence.',
    'Definition/target commands remain separate from observation ingestion and snapshot publication.',
    ['KPI definition, target, observation and snapshot are distinct semantic layers.']
  ),
  agg(
    'AGG-02-GOVERNANCE',
    'BOF-02',
    'SGP-GOVERNANCE-BODY',
    'Governance Body',
    [],
    [],
    ['SGP-GOVERNANCE-MEETING', 'WORK-DECISION'],
    'Governance administration.',
    'Body membership/configuration is separate from meeting and decision transactions.',
    ['Governance body does not own shared Decision identity.']
  ),

  agg(
    'AGG-03-OPPORTUNITY',
    'BOF-03',
    'CRM-OPPORTUNITY',
    'Opportunity',
    [],
    ['CRM-PIPELINE-SNAPSHOT', 'CRM-FORECAST-SNAPSHOT'],
    ['CBO-PARTY', 'EST-ESTIMATE', 'CBO-CONTRACT', 'CBO-PROJECT'],
    'CRM/business-development commands.',
    'Opportunity state changes do not atomically create Estimate, Contract or Project; handoffs are explicit.',
    ['Lead, Opportunity and Pursuit remain distinct commercial identities.']
  ),
  agg(
    'AGG-03-PURSUIT',
    'BOF-03',
    'CRM-PURSUIT',
    'Pursuit',
    ['CRM-BID-DECISION'],
    [],
    ['CRM-OPPORTUNITY', 'EST-ESTIMATE'],
    'Bid/business-development commands.',
    'Bid decision evidence is committed with the pursuit decision context; estimate/tender objects remain separate.',
    ['Pursuit does not become Estimate or Tender.']
  ),
  agg(
    'AGG-03-CUSTOMER-CASE',
    'BOF-03',
    'CRM-CUSTOMER-CASE',
    'Customer Case',
    [],
    [],
    ['CBO-PARTY', 'OPS-SERVICE-CASE'],
    'Customer-service commands.',
    'Customer Case may spawn/link service work asynchronously; it does not own Work Orders.',
    ['Customer identity always references canonical Party.']
  ),

  agg(
    'AGG-04-DEVELOPMENT',
    'BOF-04',
    'LDI-DEVELOPMENT-OPPORTUNITY',
    'Development Opportunity',
    ['LDI-DEVELOPMENT-APPRAISAL'],
    [],
    ['CBO-SITE', 'LDI-LAND-PARCEL', 'LDI-BUSINESS-CASE', 'CBO-PROJECT'],
    'Development/investment commands.',
    'Opportunity/appraisal changes are separate from land/property/project masters.',
    ['Development Opportunity is distinct from CRM Opportunity.']
  ),
  agg(
    'AGG-04-PLANNING',
    'BOF-04',
    'LDI-PLANNING-APPLICATION',
    'Planning Application',
    ['LDI-PLANNING-CONDITION'],
    [],
    ['LDI-PLANNING-CONSENT', 'LDI-PLANNING-OBLIGATION', 'CBO-SITE'],
    'Planning/development-control commands.',
    'Application submission/versioning is separate from regulator consent/obligation evidence.',
    [
      'Planning application, consent, condition and obligation remain separate legal/evidence layers.'
    ]
  ),

  agg(
    'AGG-05-ESTIMATE',
    'BOF-05',
    'EST-ESTIMATE',
    'Estimate',
    [
      'EST-ESTIMATE-VERSION',
      'EST-BREAKDOWN-ITEM',
      'EST-TAKEOFF',
      'EST-MEASUREMENT-ITEM',
      'EST-RESOURCE-BUILDUP',
      'EST-RATE',
      'EST-PROVISION'
    ],
    [],
    ['CRM-OPPORTUNITY', 'CBO-ITEM', 'CBO-PROJECT'],
    'Estimating commands.',
    'One Estimate aggregate owns its controlled pricing versions and breakdown basis; downstream commercial records reference frozen versions.',
    [
      'Estimate is the stable identity; Estimate Version is not an independent commercial master.',
      'Breakdown/WBS/Cost Code remain separate structures.'
    ]
  ),
  agg(
    'AGG-05-OFFER',
    'BOF-05',
    'EST-PROPOSAL',
    'Proposal',
    ['EST-QUOTATION', 'EST-OFFER-ACCEPTANCE'],
    [],
    ['EST-ESTIMATE', 'CBO-PARTY', 'CBO-CONTRACT', 'EST-SALES-ORDER'],
    'Tendering/sales-offer commands.',
    'Offer issuance/acceptance is committed independently from downstream Contract/Sales Order creation.',
    ['Internal Estimate truth is never overwritten by issued Proposal/Quotation.']
  ),

  agg(
    'AGG-06-PROJECT',
    'BOF-06',
    'CBO-PROJECT',
    'Project',
    ['DEL-STAGE-ASSIGNMENT'],
    [],
    [
      'DEL-PORTFOLIO',
      'DEL-PROGRAMME',
      'DEL-WBS-ELEMENT',
      'DEL-WORK-PACKAGE',
      'CBO-CONTRACT',
      'CBO-SITE'
    ],
    'Project governance commands.',
    'Project identity/state is one aggregate; WBS, Work Packages and schedules are separately versioned/scalable aggregates.',
    ['Project does not own permanent Site/Asset identity.']
  ),
  agg(
    'AGG-06-WBS',
    'BOF-06',
    'DEL-WBS-ELEMENT',
    'WBS Element',
    [],
    [],
    ['CBO-PROJECT', 'DEL-WORK-PACKAGE', 'FIN-COST-CODE'],
    'Project-controls scope commands.',
    'WBS hierarchy changes are controlled independently from finance classifications and physical asset structure.',
    ['WBS is delivery decomposition, not Cost Code or Asset hierarchy.']
  ),
  agg(
    'AGG-06-SCHEDULE',
    'BOF-06',
    'DEL-SCHEDULE',
    'Schedule',
    [
      'DEL-SCHEDULE-ACTIVITY',
      'DEL-MILESTONE',
      'DEL-SCHEDULE-BASELINE',
      'DEL-SCHEDULE-CALENDAR',
      'DEL-SCHEDULE-CALCULATION-RUN'
    ],
    ['DEL-SCHEDULE-ANALYSIS-SNAPSHOT'],
    ['CBO-PROJECT', 'DEL-WBS-ELEMENT', 'DEL-WORK-PACKAGE'],
    'Project-controls scheduling commands.',
    'Schedule network/version changes commit within one schedule; published analysis is derived from an immutable calculation run.',
    [
      'Baselines are immutable.',
      'Float and critical path are projections, not editable Activity state.'
    ]
  ),
  agg(
    'AGG-06-PROJECT-CONTROLS',
    'BOF-06',
    'DEL-PERFORMANCE-CALCULATION-RUN',
    'Project Controls Calculation',
    ['DEL-PROGRESS-MEASUREMENT-METHOD', 'DEL-RISK-SIMULATION-RUN'],
    ['DEL-PROJECT-PERFORMANCE-SNAPSHOT', 'DEL-RISK-ANALYSIS-SNAPSHOT'],
    ['DEL-SCHEDULE', 'FIN-BUDGET', 'FIN-FORECAST', 'CBO-CONTRACT', 'FIN-LEDGER'],
    'Project-controls calculation services; source records remain owned elsewhere.',
    'Calculation runs pin exact source versions and publish projections without writing back to source aggregates.',
    ['EVM/CVR/risk simulation never becomes a shadow cost ledger.']
  ),

  agg(
    'AGG-07-INFORMATION',
    'BOF-07',
    'CBO-INFORMATION-CONTAINER',
    'Information Container',
    ['INFO-REVISION', 'INFO-REPRESENTATION'],
    [],
    ['INFO-REQUIREMENT', 'INFO-DELIVERABLE', 'INFO-ISSUE', 'INFO-TRANSMITTAL'],
    'Controlled-information commands.',
    'One Information Container aggregate controls its revision/iteration/representation lineage; exchanges and workflow records are separate.',
    ['Issued revisions are immutable.', 'Files/folders are representations/views, not identity.']
  ),
  agg(
    'AGG-07-DELIVERY-REQUIREMENTS',
    'BOF-07',
    'INFO-REQUIREMENT',
    'Information Requirement',
    ['INFO-DELIVERABLE', 'INFO-DELIVERY-PLAN'],
    [],
    ['CBO-INFORMATION-CONTAINER', 'CBO-PROJECT'],
    'Information-management planning commands.',
    'Requirement/deliverable planning does not mutate produced Information Container revisions.',
    ['Requirement, deliverable and produced information remain distinct.']
  ),
  agg(
    'AGG-07-ENGINEERING-REQUIREMENTS',
    'BOF-07',
    'ENG-REQUIREMENT-SET',
    'Requirement Set',
    ['ENG-PRODUCT-REQUIREMENT'],
    [],
    ['ENG-SYSTEM-MODEL', 'CBO-ITEM', 'CBO-SYSTEM'],
    'Engineering requirements commands.',
    'Baselined requirement sets are immutable references; requirements link to design/system realisations across aggregates.',
    ['Product Requirement is distinct from project Information Requirement.']
  ),
  agg(
    'AGG-07-ENGINEERING-MODEL',
    'BOF-07',
    'ENG-SYSTEM-MODEL',
    'Engineering System Model',
    ['ENG-SYSTEM-MODEL-ELEMENT'],
    [],
    ['ENG-REQUIREMENT-SET', 'CBO-ITEM', 'CBO-SYSTEM'],
    'Engineering-model commands.',
    'Model-element edits occur within one model/version; physical realisation links update independently.',
    ['Engineering model is not installed physical System identity.']
  ),
  agg(
    'AGG-07-DESIGN-CHANGE',
    'BOF-07',
    'INFO-DESIGN-CHANGE',
    'Design Change',
    [],
    [],
    ['CBO-INFORMATION-CONTAINER', 'CBO-ITEM', 'CBO-SYSTEM', 'COM-COMMERCIAL-CHANGE'],
    'Design/engineering change commands.',
    'Technical change lifecycle is independent from commercial/regulatory change; consequences link explicitly.',
    ['Design Change never silently mutates Commercial Change.']
  ),

  agg(
    'AGG-08-CONTRACT',
    'BOF-08',
    'CBO-CONTRACT',
    'Contract',
    [
      'COM-CONTRACT-PARTY-ROLE',
      'COM-CONTRACT-CLAUSE',
      'COM-OBLIGATION',
      'COM-KEY-DATE',
      'COM-CONTRACT-VALUE-SCHEDULE',
      'COM-CONTRACT-VALUE-LINE'
    ],
    [],
    ['CBO-PARTY', 'CBO-PROJECT', 'COM-COMMERCIAL-PACKAGE'],
    'Contract/commercial administration.',
    'Contract terms/value schedules version within the contract boundary; notices, changes, claims and payments remain separate legal/evidence aggregates.',
    ['Appointment, Subcontract and Framework are Contract types, not duplicate masters.']
  ),
  agg(
    'AGG-08-COMMERCIAL-CHANGE',
    'BOF-08',
    'COM-COMMERCIAL-CHANGE',
    'Commercial Change',
    ['COM-CHANGE-QUOTATION'],
    [],
    ['CBO-CONTRACT', 'COM-NOTICE', 'WORK-DECISION', 'DEL-SCHEDULE'],
    'Commercial change administration.',
    'A change command affects one Commercial Change case; contract/schedule/ledger consequences occur via explicit commands/events.',
    ['Variation/Compensation Event share one change spine with configured contract rules.']
  ),
  agg(
    'AGG-08-COMMERCIAL-ASSESSMENT',
    'BOF-08',
    'COM-SHARE-ASSESSMENT',
    'Commercial Share Assessment',
    ['COM-TARGET-COST-BASELINE', 'COM-SHARE-MECHANISM'],
    [],
    ['CBO-CONTRACT', 'FIN-ACTUAL-POSITION', 'COM-COMMERCIAL-CHANGE'],
    'Commercial assessment authority.',
    'Assessment pins exact target/formula/source evidence; payment/accounting consequences remain separate.',
    ['Target baseline and share formula changes never rewrite prior assessments.']
  ),
  agg(
    'AGG-08-CLAIM',
    'BOF-08',
    'COM-CLAIM',
    'Commercial Claim',
    [],
    [],
    ['CBO-CONTRACT', 'COM-COMMERCIAL-CHANGE', 'LEGAL-DISPUTE'],
    'Commercial claims administration.',
    'Claim lifecycle is independent from dispute/legal proceeding and payment transactions.',
    ['Claim is not Contract Notice or Dispute identity.']
  ),

  agg(
    'AGG-09-SOURCING',
    'BOF-09',
    'PROC-SOURCING-EVENT',
    'Sourcing Event',
    ['PROC-SOURCING-REQUEST', 'PROC-SOURCING-RESPONSE', 'PROC-EVALUATION', 'PROC-AWARD'],
    [],
    ['PROC-REQUISITION', 'CBO-PARTY', 'COM-PROCUREMENT-PACKAGE'],
    'Procurement sourcing commands.',
    'One sourcing event owns its request/response/evaluation/award evidence; commitment creation occurs separately.',
    ['Supplier master remains canonical Party/Relationship.']
  ),
  agg(
    'AGG-09-PURCHASE-COMMITMENT',
    'BOF-09',
    'PROC-PURCHASE-ORDER',
    'Purchase Order',
    ['PROC-CALLOFF'],
    [],
    ['CBO-PARTY', 'CBO-CONTRACT', 'CBO-ITEM', 'PROC-RECEIPT'],
    'Procurement commitment commands.',
    'PO/call-off changes commit independently from receipt, invoice and payment.',
    ['Receipt, Supplier Invoice and Payment remain separate evidence/finance aggregates.']
  ),

  agg(
    'AGG-10-ITEM',
    'BOF-10',
    'CBO-ITEM',
    'Item',
    [
      'ITEM-SPECIFICATION',
      'ITEM-VARIANT',
      'ITEM-SUBSTITUTION',
      'ITEM-MANUFACTURER-REL',
      'ITEM-SUPPLIER-REL'
    ],
    [],
    ['ITEM-BOM', 'ITEM-CATALOGUE', 'ITEM-PRICE-LIST'],
    'Item/product master commands.',
    'Item identity and controlled definition change independently from stock, orders and assets.',
    ['Product/material/service are Item behaviours/classifications, not separate masters.']
  ),
  agg(
    'AGG-10-CONFIGURATION',
    'BOF-10',
    'CFG-PRODUCT-CONFIG-MODEL',
    'Product Configuration Model',
    [
      'CFG-CHARACTERISTIC-DEFINITION',
      'CFG-CONFIGURATION-RULE',
      'CFG-EFFECTIVITY-STATEMENT',
      'CFG-EFFECTIVITY-ASSIGNMENT',
      'CFG-STRUCTURE-OCCURRENCE'
    ],
    ['CFG-CONFIGURATION-BASELINE'],
    ['CBO-ITEM', 'ITEM-BOM', 'MFG-DEFINITION'],
    'Product/configuration governance.',
    'Published model/rule/effectivity versions are immutable references; resolved configurations pin exact versions.',
    [
      'Effectivity is applicability, not lifecycle state.',
      'Configuration baseline does not become live BOM truth.'
    ]
  ),
  agg(
    'AGG-10-CONFIGURATION-INSTANCE',
    'BOF-10',
    'CFG-CONFIGURATION-INSTANCE',
    'Product Configuration',
    [],
    [],
    ['CFG-PRODUCT-CONFIG-MODEL', 'CBO-ITEM', 'EST-QUOTATION', 'EST-SALES-ORDER'],
    'Commercial/engineering configuration commands.',
    'Accepted configuration becomes immutable evidence for its business context.',
    ['Resolved configuration never rewrites Item Variant or BOM.']
  ),
  agg(
    'AGG-10-INVENTORY-STORAGE',
    'BOF-10',
    'INV-WAREHOUSE',
    'Warehouse',
    ['INV-STORE', 'INV-BIN'],
    [],
    ['CBO-SITE'],
    'Inventory-location administration.',
    'Storage hierarchy changes are separate from inventory movements/stock balances.',
    ['Warehouse hierarchy is not Site/WBS hierarchy.']
  ),
  agg(
    'AGG-10-INVENTORY-MOVEMENT',
    'BOF-10',
    'INV-MOVEMENT',
    'Inventory Movement',
    [],
    ['INV-STOCK-POSITION'],
    ['CBO-ITEM', 'INV-WAREHOUSE', 'TRACE-LOT', 'TRACE-SERIAL', 'CBO-ASSET'],
    'Inventory posting commands.',
    'Each movement is immutable once posted; corrections use explicit reversal/adjustment evidence.',
    ['Stock Position is derived and never edited directly.']
  ),
  agg(
    'AGG-10-LOGISTICS',
    'BOF-10',
    'LOG-SHIPMENT',
    'Shipment',
    [
      'LOG-HANDLING-UNIT',
      'LOG-WAREHOUSE-WAVE',
      'LOG-YARD-DOCK-APPOINTMENT',
      'LOG-FREIGHT-TENDER',
      'LOG-FREIGHT-SETTLEMENT'
    ],
    [],
    ['LOG-TRANSPORT-ORDER', 'LOG-DELIVERY', 'CBO-ITEM', 'CBO-PARTY', 'FIN-SUPPLIER-INVOICE'],
    'Logistics execution commands.',
    'Shipment/freight records coordinate logistics but financial and inventory consequences commit through their owning aggregates.',
    ['Handling units never replace Item/lot/serial identity.']
  ),
  agg(
    'AGG-10-PLANNING',
    'BOF-10',
    'PLN-DEMAND-PLAN',
    'Demand Plan',
    ['PLN-SUPPLY-PLAN', 'PLN-PLANNING-EXCEPTION'],
    [],
    ['CBO-ITEM', 'FIN-FORECAST', 'PROC-PURCHASE-ORDER', 'MFG-PRODUCTION-ORDER'],
    'Integrated planning commands.',
    'Plan versions are immutable comparison points; execution orders are created separately.',
    ['Demand/Supply Plan is expectation, not commitment or actual.']
  ),

  agg(
    'AGG-11-MFG-DEFINITION',
    'BOF-11',
    'MFG-DEFINITION',
    'Manufacturing Definition',
    ['MFG-PROCESS-PLAN'],
    [],
    ['CBO-ITEM', 'ITEM-BOM', 'CFG-CONFIGURATION-BASELINE', 'MFG-WORK-CENTRE'],
    'Manufacturing-engineering commands.',
    'Released manufacturing definitions are versioned independently from production execution.',
    ['Manufacturing definition is not Production Order.']
  ),
  agg(
    'AGG-11-PRODUCTION',
    'BOF-11',
    'MFG-PRODUCTION-ORDER',
    'Production Order',
    ['TRACE-LOT', 'TRACE-BATCH', 'TRACE-SERIAL'],
    ['MFG-AS-MANUFACTURED'],
    ['CBO-ITEM', 'MFG-DEFINITION', 'INV-MOVEMENT'],
    'Manufacturing execution commands.',
    'Production transaction owns execution/tracing context; inventory postings and installed Asset creation occur explicitly.',
    ['As-manufactured state is retained evidence, not Item/BOM mutation.']
  ),

  agg(
    'AGG-12-FIELD-DIARY',
    'BOF-12',
    'FIELD-DAILY-DIARY',
    'Daily Site Diary',
    [],
    [],
    [
      'FIELD-PROGRESS',
      'FIELD-LABOUR',
      'FIELD-PLANT-USAGE',
      'FIELD-MATERIAL-USAGE',
      'FIELD-DELIVERY',
      'QHSE-INCIDENT',
      'CBO-PROJECT',
      'CBO-SITE'
    ],
    'Site management commands.',
    'Diary is an evidence envelope; referenced field records retain independent authority/lifecycle.',
    ['Diary never becomes a shadow progress, labour, plant, inventory or QHSE register.']
  ),
  agg(
    'AGG-12-FIELD-EXECUTION',
    'BOF-12',
    'FIELD-PROGRESS',
    'Field Progress',
    [],
    [],
    [
      'DEL-WORK-PACKAGE',
      'DEL-SCHEDULE-ACTIVITY',
      'HCM-WORKER-RELATIONSHIP',
      'CBO-ASSET',
      'INV-MOVEMENT'
    ],
    'Field execution commands.',
    'Progress/labour/plant/material records are attributable occurrences and do not atomically mutate schedule/finance.',
    ['Field Progress reuses canonical Progress Record semantics.']
  ),
  agg(
    'AGG-12-TEMPORARY-WORKS',
    'BOF-12',
    'FIELD-TEMPORARY-WORKS-ITEM',
    'Temporary Works Control Item',
    ['FIELD-TEMPORARY-WORKS-DESIGN', 'FIELD-TEMPORARY-WORKS-CHECK'],
    [],
    ['CBO-INFORMATION-CONTAINER', 'INFO-DESIGN-REVIEW', 'CBO-SITE'],
    'Temporary-works control commands.',
    'Temporary works control identity owns its design/check evidence but never becomes permanent Asset.',
    ['Temporary works is distinct from Product Item and permanent Asset.']
  ),

  agg(
    'AGG-13-QUALITY',
    'BOF-13',
    'QHSE-ITP',
    'Inspection and Test Plan',
    ['QHSE-VERIFICATION-POINT'],
    [],
    ['QHSE-INSPECTION', 'QHSE-TEST', 'CBO-PROJECT', 'CBO-ASSET'],
    'Quality planning commands.',
    'ITP/version configuration is separate from inspection/test occurrence evidence.',
    ['Hold/Witness points are plan controls, not inspection results.']
  ),
  agg(
    'AGG-13-NONCONFORMANCE',
    'BOF-13',
    'QHSE-NCR',
    'Nonconformance Report',
    [],
    [],
    ['QHSE-DEFECT', 'QHSE-CAPA-CASE', 'CBO-ITEM', 'CBO-ASSET'],
    'Quality assurance commands.',
    'NCR, Defect and CAPA have independent lifecycles and link explicitly.',
    ['Snag is Defect classification, not another aggregate.']
  ),
  agg(
    'AGG-13-INCIDENT',
    'BOF-13',
    'QHSE-INCIDENT',
    'QHSE Incident',
    ['QHSE-INVESTIGATION', 'QHSE-CAUSE'],
    [],
    ['RISK-ENTERPRISE-RISK', 'QHSE-CAPA-CASE'],
    'QHSE incident/investigation commands.',
    'Incident occurrence and investigation evidence are retained; risk/control consequences update separately.',
    ['Near Miss/Pollution Event are Incident types.']
  ),

  agg(
    'AGG-14-REGULATORY-CASE',
    'BOF-14',
    'REG-CASE',
    'Building Safety / Regulatory Case',
    [
      'REG-APPLICATION',
      'REG-INSPECTION',
      'REG-FINDING',
      'REG-STATUTORY-NOTICE',
      'REG-DECISION',
      'REG-SUBMISSION'
    ],
    [],
    ['CBO-SITE', 'CBO-BUILDING', 'CBO-INFORMATION-CONTAINER', 'CBO-PARTY'],
    'Regulatory/building-safety commands.',
    'Case coordinates statutory evidence; application/decision/notice occurrences remain attributable and immutable when issued.',
    ['Regulatory change is distinct from Design and Commercial Change.']
  ),
  agg(
    'AGG-14-GOLDEN-THREAD',
    'BOF-14',
    'REG-GOLDEN-THREAD',
    'Golden Thread',
    [],
    [],
    [
      'CORP-ENTITY-REGISTER-SNAPSHOT',
      'CBO-INFORMATION-CONTAINER',
      'CBO-ASSET',
      'CBO-SYSTEM',
      'EVID-EVIDENCE-ITEM'
    ],
    'Building-safety information governance.',
    'Golden Thread is reconstructed from source-linked records rather than edited as a single document/store.',
    ['Golden Thread never duplicates canonical source truth.']
  ),

  agg(
    'AGG-15-COMMISSIONING',
    'BOF-15',
    'OPS-COMMISSIONING-PLAN',
    'Commissioning Plan',
    ['OPS-COMMISSIONING-ACTIVITY', 'OPS-WITNESS-REQUIREMENT'],
    [],
    ['OPS-COMMISSIONING-EVIDENCE', 'CBO-SYSTEM', 'CBO-ASSET'],
    'Commissioning management commands.',
    'Plan/activity state is separate from immutable test/evidence occurrences.',
    ['Retest creates new evidence rather than overwriting failed evidence.']
  ),
  agg(
    'AGG-15-HANDOVER',
    'BOF-15',
    'OPS-HANDOVER-PACKAGE',
    'Handover Package',
    ['OPS-HANDOVER-ACCEPTANCE'],
    [],
    ['CBO-ASSET', 'CBO-SYSTEM', 'CBO-INFORMATION-CONTAINER', 'CBO-PROJECT'],
    'Handover/closeout commands.',
    'Package/acceptance changes stewardship but does not recreate Asset/System/Information identities.',
    ['Handover is transfer of stewardship/state, not re-identification.']
  ),

  agg(
    'AGG-16-SPATIAL-ASSET',
    'BOF-16',
    'CBO-ASSET',
    'Asset',
    ['BE-COMPONENT'],
    [],
    ['CBO-SYSTEM', 'CBO-SITE', 'BE-SPACE', 'FIN-FIXED-ASSET', 'OPS-AS-MAINTAINED-CONFIGURATION'],
    'Built-environment/asset master commands.',
    'One Asset identity persists across projects, locations, custodians, maintenance and finance treatments.',
    ['No construction/FM/finance/sustainability asset copies.']
  ),
  agg(
    'AGG-16-SYSTEM',
    'BOF-16',
    'CBO-SYSTEM',
    'System',
    [],
    [],
    ['CBO-ASSET', 'BE-NETWORK', 'CBO-SITE'],
    'Built-environment systems administration.',
    'System membership is effective relationship state, not ownership of Asset lifecycle.',
    ['System is physical/functional operational context, not engineering model.']
  ),
  agg(
    'AGG-16-NETWORK',
    'BOF-16',
    'BE-NETWORK',
    'Network',
    [
      'NET-TERMINAL',
      'NET-CONNECTIVITY-RELATIONSHIP',
      'NET-LINEAR-LOCATION-ASSIGNMENT',
      'NET-TRACE-CONFIGURATION',
      'NET-TRACE-RUN'
    ],
    ['NET-TRACE-RESULT'],
    ['BE-LINEAR-SEGMENT', 'CBO-ASSET', 'CBO-SYSTEM'],
    'Infrastructure/network administration and trace services.',
    'Topology/effectivity updates are independent from trace runs and from Asset work transactions.',
    ['GIS identifiers never replace canonical Network/Asset/System identity.']
  ),
  agg(
    'AGG-16-ASSET-INVESTMENT',
    'BOF-16',
    'OPS-ASSET-INVESTMENT-PLAN',
    'Asset Investment Plan',
    ['OPS-ASSET-INTERVENTION-OPTION'],
    ['OPS-ASSET-INVESTMENT-APPRAISAL'],
    ['CBO-ASSET', 'REL-ASSET-HEALTH-POSITION', 'FIN-CAPEX-REQUEST', 'CBO-PROJECT'],
    'Asset strategy/investment governance.',
    'Appraisal/plan decisions do not automatically create Capex Requests, Projects or Work Orders.',
    ['Optimisation is decision support, not investment authority.']
  ),
  agg(
    'AGG-16-DIGITAL-TWIN',
    'BOF-16',
    'TWIN-FEDERATION-CONTEXT',
    'Digital Twin Federation Context',
    ['TWIN-DATA-BINDING'],
    ['TWIN-STATE-SNAPSHOT'],
    ['CBO-ASSET', 'CBO-SYSTEM', 'CBO-INFORMATION-CONTAINER', 'DATA-DATASET', 'BE-NETWORK'],
    'Digital-twin/data federation governance.',
    'Bindings/snapshots reference authoritative sources; source aggregates are never mutated through the twin projection.',
    ['Twin is federation, not second Asset/System master.']
  ),

  agg(
    'AGG-17-MAINTENANCE',
    'BOF-17',
    'OPS-MAINTENANCE-PLAN',
    'Maintenance Plan',
    ['OPS-TASK-TEMPLATE'],
    ['OPS-AS-MAINTAINED-CONFIGURATION', 'OPS-SERVICE-HISTORY'],
    ['CBO-ASSET', 'OPS-WORK-ORDER', 'REL-RELIABILITY-STRATEGY'],
    'Maintenance planning commands.',
    'Plan/template changes are separate from each Work Order and installed-base change.',
    ['Work Order is operational work, not workflow task or schedule activity.']
  ),
  agg(
    'AGG-17-WORK-ORDER',
    'BOF-17',
    'OPS-WORK-ORDER',
    'Work Order',
    [],
    [],
    ['CBO-ASSET', 'CBO-ITEM', 'INV-MOVEMENT', 'HCM-WORKER-RELATIONSHIP', 'OPS-SERVICE-CASE'],
    'Maintenance/service execution commands.',
    'One Work Order transaction controls its operational state; inventory/finance/time consequences post through separate aggregates.',
    ['Parts use posts via Inventory Movement.']
  ),
  agg(
    'AGG-17-SERVICE',
    'BOF-17',
    'OPS-SERVICE-CASE',
    'Service Case',
    ['OPS-SERVICE-APPOINTMENT'],
    [],
    ['OPS-SERVICE-REQUEST', 'OPS-WORK-ORDER', 'CBO-PARTY', 'CBO-ASSET'],
    'Service-management commands.',
    'Case/appointment coordinates work but does not own Asset or Work Order truth.',
    ['Service Request, Case, Appointment and Work Order remain distinct.']
  ),
  agg(
    'AGG-17-RELIABILITY',
    'BOF-17',
    'REL-RELIABILITY-STRATEGY',
    'Reliability Strategy',
    ['REL-FAILURE-MODE', 'REL-ASSET-CRITICALITY-ASSESSMENT'],
    ['REL-ASSET-HEALTH-POSITION'],
    ['CBO-ASSET', 'OPS-MAINTENANCE-PLAN', 'OPS-FAILURE'],
    'Reliability engineering commands.',
    'Strategy/assessment definitions are versioned; health is derived from source condition/failure/work evidence.',
    ['Criticality/health are not editable permanent Asset flags.']
  ),
  agg(
    'AGG-17-WORKPLACE',
    'BOF-17',
    'OPS-WORKPLACE-RESERVATION',
    'Workplace Reservation',
    [],
    [],
    ['BE-SPACE', 'CBO-PARTY', 'HCM-WORKER-RELATIONSHIP'],
    'Facilities/workplace booking commands.',
    'Reservation changes one booking only; occupancy, access and facilities service records remain separate.',
    ['Workplace booking is distinct from inventory reservation and tenancy/occupancy.']
  ),

  agg(
    'AGG-18-WORKFORCE',
    'BOF-18',
    'HCM-WORKER-RELATIONSHIP',
    'Worker Relationship',
    [],
    [],
    ['HCM-PERSON', 'HCM-POSITION', 'CBO-ORGANISATION-UNIT'],
    'HCM employment/engagement commands.',
    'Employment/engagement changes do not mutate Person identity or organisation structure.',
    ['Employee/contractor contexts reuse canonical Person.']
  ),
  agg(
    'AGG-18-POSITION',
    'BOF-18',
    'HCM-POSITION',
    'Position',
    [],
    [],
    ['HCM-JOB-PROFILE', 'CBO-ORGANISATION-UNIT', 'HCM-WORKER-RELATIONSHIP'],
    'HCM position management.',
    'Position definition and worker occupancy/assignment are separate effective records.',
    ['Position, Job Profile and Role Assignment are distinct.']
  ),
  agg(
    'AGG-18-LEARNING',
    'BOF-18',
    'HCM-TRAINING-COURSE',
    'Training Course',
    ['HCM-TRAINING-SESSION'],
    [],
    ['HCM-LEARNING-RECORD', 'HCM-PERSON-COMPETENCE'],
    'Learning/competence administration.',
    'Course/session configuration is separate from Person learning/competence evidence.',
    ['Competence is evidence-based and effective-dated.']
  ),
  agg(
    'AGG-18-PAYROLL',
    'BOF-18',
    'HCM-PAYROLL-RUN',
    'Payroll Run',
    ['HCM-PAYROLL-RESULT'],
    [],
    ['HCM-TIME-ENTRY', 'HCM-TIMESHEET', 'HCM-COMPENSATION', 'FIN-LEDGER'],
    'Payroll execution authority.',
    'Payroll run/results are frozen evidence; finance postings are explicit downstream transactions.',
    ['Payroll never becomes worker/time or finance master.']
  ),
  agg(
    'AGG-18-TALENT',
    'BOF-18',
    'HCM-SUCCESSION-PLAN',
    'Succession Plan',
    ['HCM-TALENT-POOL', 'HCM-TALENT-POOL-MEMBERSHIP', 'HCM-TALENT-REVIEW'],
    [],
    ['HCM-PERSON', 'HCM-POSITION', 'HCM-CAREER-PROFILE'],
    'Restricted talent-management commands.',
    'Talent context updates do not change employment/position assignment automatically.',
    ['Talent data is access-controlled and does not duplicate Person/Worker identity.']
  ),
  agg(
    'AGG-18-TRAVEL',
    'BOF-18',
    'HCM-BUSINESS-TRIP',
    'Business Trip',
    ['HCM-TRAVEL-REQUEST', 'HCM-TRAVEL-BOOKING-EVIDENCE'],
    [],
    ['HCM-PERSON', 'HCM-EXPENSE-CLAIM', 'SEC-TRAVEL-RISK-ASSESSMENT'],
    'Travel/duty-of-care commands.',
    'Travel approval/trip/booking evidence is distinct from Expense Claim and external booking source truth.',
    ['Trip identity survives booking-provider changes.']
  ),

  agg(
    'AGG-19-LEDGER',
    'BOF-19',
    'FIN-LEDGER',
    'Ledger',
    ['FIN-LEDGER-ENTRY'],
    ['FIN-ACTUAL-POSITION'],
    ['CBO-LEGAL-ENTITY', 'FIN-CHART-OF-ACCOUNTS', 'FIN-ACCOUNTING-PERIOD'],
    'Finance posting authority only.',
    'Posted entries are append-only; correction is reversal/adjustment, never in-place business-history rewrite.',
    ['Ledger never owns Party/Project/Contract/Asset identity.']
  ),
  agg(
    'AGG-19-AP',
    'BOF-19',
    'FIN-SUPPLIER-INVOICE',
    'Supplier Invoice',
    [],
    [],
    ['CBO-PARTY', 'PROC-PURCHASE-ORDER', 'PROC-RECEIPT', 'FIN-PAYMENT', 'FIN-LEDGER'],
    'Accounts-payable commands.',
    'Invoice validation and posting is separate from procurement receipt and cash settlement.',
    ['Invoice is not PO/Receipt/Payment.']
  ),
  agg(
    'AGG-19-AR',
    'BOF-19',
    'FIN-CUSTOMER-INVOICE',
    'Customer Invoice',
    [],
    [],
    ['CBO-PARTY', 'CBO-CONTRACT', 'FIN-RECEIPT', 'FIN-LEDGER'],
    'Accounts-receivable commands.',
    'Billing and receipt/allocation are separate transactions.',
    ['Revenue recognition is distinct from billing.']
  ),
  agg(
    'AGG-19-TREASURY',
    'BOF-19',
    'FIN-TREASURY-DEAL',
    'Treasury Deal',
    ['TREASURY-HEDGE-RELATIONSHIP', 'TREASURY-CASH-POOL'],
    ['TREASURY-EXPOSURE', 'TREASURY-MARKET-DATA-SNAPSHOT', 'FIN-CASH-POSITION'],
    ['FIN-BANK-ACCOUNT', 'FIN-CASH-FORECAST', 'FIN-LIQUIDITY-FORECAST'],
    'Treasury authority.',
    'Deals/hedges/arrangements are governed transactions; exposures and positions are derived/published snapshots.',
    ['Exposure never replaces source financial positions.']
  ),
  agg(
    'AGG-19-LEASE-ACCOUNTING',
    'BOF-19',
    'FIN-LEASE-ACCOUNTING-RECORD',
    'Lease Accounting Record',
    ['FIN-LEASE-VALUATION'],
    ['FIN-LEASE-PAYMENT-SCHEDULE'],
    ['CBO-CONTRACT', 'BE-PROPERTY', 'CBO-ASSET', 'FIN-LEDGER'],
    'Finance lease-accounting authority.',
    'Valuation/schedule changes affect accounting record only; contractual Lease/Property truth remains separate.',
    ['Right-of-use/liability records do not become physical Asset or Lease identity.']
  ),
  agg(
    'AGG-19-RECOGNITION',
    'BOF-19',
    'FIN-CONSTRUCTION-WIP-RUN',
    'Construction WIP Calculation Run',
    ['FIN-RECOGNITION-POLICY'],
    ['FIN-CONSTRUCTION-WIP-POSITION'],
    [
      'CBO-CONTRACT',
      'DEL-PROJECT-PERFORMANCE-SNAPSHOT',
      'FIN-FORECAST',
      'FIN-CUSTOMER-INVOICE',
      'FIN-LEDGER'
    ],
    'Finance recognition authority.',
    'WIP/recognition calculations pin source versions; journal/ledger consequences post separately.',
    ['Recognition, project CVR and billing remain separate.']
  ),

  agg(
    'AGG-20-CARBON',
    'BOF-20',
    'SUS-CARBON-ASSESSMENT',
    'Carbon Assessment',
    ['SUS-CARBON-LINE'],
    [],
    ['SUS-CARBON-METHODOLOGY', 'SUS-CARBON-FACTOR', 'CBO-ITEM', 'CBO-ASSET', 'CBO-PROJECT'],
    'Sustainability/carbon assessment commands.',
    'Assessment publication pins methodology/factor/source versions.',
    ['Assessment never creates parallel Item/Asset/Project masters.']
  ),
  agg(
    'AGG-20-RESOURCE-OUTCOME',
    'BOF-20',
    'SUS-SOCIAL-COMMITMENT',
    'Sustainability / Social Commitment',
    ['SUS-SOCIAL-EVIDENCE', 'SUS-SOCIAL-OUTCOME'],
    [],
    ['CBO-PROJECT', 'CBO-CONTRACT', 'CBO-PARTY'],
    'Sustainability/social-value commands.',
    'Commitment, evidence and outcome remain separate lifecycle/evidence layers.',
    ['Climate/resilience risks reuse Enterprise Risk.']
  ),

  agg(
    'AGG-21-RISK',
    'BOF-21',
    'RISK-ENTERPRISE-RISK',
    'Enterprise Risk',
    ['RISK-TREATMENT-PLAN'],
    [],
    ['RISK-ASSESSMENT', 'CTRL-INTERNAL-CONTROL', 'CBO-PROJECT', 'CBO-ASSET'],
    'Risk governance commands.',
    'Risk identity persists; assessments/treatments create new evidence/plans rather than overwriting history.',
    ['Current risk rating is derived from retained assessments.']
  ),
  agg(
    'AGG-21-CONTROL',
    'BOF-21',
    'CTRL-INTERNAL-CONTROL',
    'Internal Control',
    [],
    [],
    ['CTRL-CONTROL-TEST', 'COMP-REQUIREMENT', 'RISK-ENTERPRISE-RISK'],
    'Control/compliance governance.',
    'Control definition/version changes are separate from Control Test occurrence evidence.',
    ['Control is not test evidence.']
  ),
  agg(
    'AGG-21-AUDIT',
    'BOF-21',
    'AUDIT-ENGAGEMENT',
    'Audit Engagement',
    ['AUDIT-FINDING', 'ASSURANCE-REMEDIATION-ACTION'],
    [],
    ['ASSURANCE-PLAN', 'CTRL-INTERNAL-CONTROL', 'COMP-REQUIREMENT'],
    'Independent assurance/audit commands.',
    'Engagement/finding/action lifecycles are retained and cannot be closed by deleting evidence.',
    ['Finding closure requires attributable verification/accepted-risk decision.']
  ),

  agg(
    'AGG-22-LEGAL',
    'BOF-22',
    'LEGAL-MATTER',
    'Legal Matter',
    [],
    [],
    ['LEGAL-DISPUTE', 'LEGAL-PROCEEDING', 'CBO-CONTRACT', 'CBO-PARTY'],
    'Restricted legal commands.',
    'Matter coordinates legal work; Dispute/Proceeding remain separate identities and records.',
    ['Legal evidence/privilege access is need-to-know controlled.']
  ),
  agg(
    'AGG-22-PRIVACY',
    'BOF-22',
    'PRIV-PROCESSING-ACTIVITY',
    'Processing Activity',
    ['PRIV-DPIA'],
    [],
    ['CBO-PARTY', 'DATA-DATASET', 'PRIV-INTERNATIONAL-TRANSFER'],
    'Privacy governance commands.',
    'Processing definition and assessment evidence are versioned separately from Consent/DSR/Incident occurrences.',
    ['Consent and Preference remain separate evidence histories.']
  ),
  agg(
    'AGG-22-CORPORATE-SECRETARIAT',
    'BOF-22',
    'CORP-OFFICE-APPOINTMENT',
    'Corporate Office Appointment',
    [],
    ['CORP-ENTITY-REGISTER-SNAPSHOT'],
    ['CBO-LEGAL-ENTITY', 'CBO-PERSON', 'LEGAL-STATUTORY-FILING'],
    'Corporate-secretariat authority.',
    'Statutory appointment is an effective legal relationship; register is reconstructed from canonical source records.',
    ['Corporate office is not generic role assignment or HCM position.']
  ),

  agg(
    'AGG-23-CONTINUITY',
    'BOF-23',
    'BCM-CONTINUITY-PLAN',
    'Continuity Plan',
    ['BCM-CONTINUITY-STRATEGY', 'BCM-RECOVERY-REQUIREMENT'],
    [],
    ['BCM-BUSINESS-IMPACT-ASSESSMENT', 'IT-DISASTER-RECOVERY-PLAN', 'RISK-ENTERPRISE-RISK'],
    'Business-continuity governance.',
    'Plans/strategies reference current assessments/requirements; exercises/invocations are separate occurrence evidence.',
    ['Technology DR and enterprise continuity remain linked but distinct.']
  ),
  agg(
    'AGG-23-CRISIS',
    'BOF-23',
    'BCM-CRISIS',
    'Crisis',
    ['BCM-CRISIS-ACTION', 'BCM-CRISIS-COMMUNICATION'],
    [],
    ['BCM-EMERGENCY-EVENT', 'QHSE-INCIDENT', 'SEC-PHYSICAL-SECURITY-INCIDENT'],
    'Crisis/security command authority.',
    'Crisis coordinates response but never replaces the triggering incident/emergency/security occurrence.',
    ['Crisis case and Emergency Event are separate.']
  ),

  agg(
    'AGG-24-TECHNOLOGY',
    'BOF-24',
    'IT-TECHNOLOGY-SERVICE',
    'Technology Service',
    [],
    [],
    ['IT-TECHNOLOGY-RESOURCE', 'IT-INCIDENT', 'IT-PROBLEM', 'IT-TECHNOLOGY-CHANGE'],
    'Technology-service administration.',
    'Service identity/configuration remains independent from incident/problem/change records.',
    ['CMDB registration never duplicates authoritative business objects.']
  ),
  agg(
    'AGG-24-DATA',
    'BOF-24',
    'DATA-PRODUCT',
    'Data Product',
    ['DATA-DATASET'],
    [],
    ['DATA-DOMAIN', 'DATA-PIPELINE', 'DATA-QUALITY-RULE', 'DATA-QUALITY-ISSUE'],
    'Data governance/product commands.',
    'Data Product/Dataset versioning and pipelines remain distinct from business-domain source objects.',
    ['Dataset is not a business master merely because analytics consumes it.']
  ),
  agg(
    'AGG-24-CYBER',
    'BOF-24',
    'SEC-CYBER-INCIDENT',
    'Cybersecurity Incident',
    [],
    [],
    ['SEC-VULNERABILITY', 'SEC-SECURITY-ALERT', 'SEC-SECURITY-FINDING', 'RISK-ENTERPRISE-RISK'],
    'Cybersecurity response authority.',
    'Alert/vulnerability/finding may create/link Incident but remain independent evidence/records.',
    ['Cyber risk reuses enterprise Risk semantics.']
  ),
  agg(
    'AGG-24-AI',
    'BOF-24',
    'AI-USE-CASE',
    'AI Use Case',
    ['AI-MODEL'],
    [],
    ['AI-RISK-ASSESSMENT', 'DATA-DATASET', 'RISK-ENTERPRISE-RISK'],
    'AI governance authority.',
    'AI use case/model lifecycle is governed separately from datasets and risk assessments.',
    ['AI model is not source business truth.']
  ),
  agg(
    'AGG-24-DATA-MIGRATION',
    'BOF-24',
    'DATA-MIGRATION-PROJECT',
    'Data Migration Project',
    [
      'DATA-MIGRATION-MAPPING',
      'DATA-MIGRATION-RUN',
      'DATA-TEST-DATA-PROFILE',
      'DATA-TEST-DATA-RUN'
    ],
    [],
    ['DATA-DATASET', 'EVID-PROVENANCE-REFERENCE'],
    'Platform/data-migration governance.',
    'Runs pin approved mappings/profiles and retain provenance; migration never redefines canonical semantics.',
    ['Test data protection is explicit and auditable.']
  ),

  agg(
    'AGG-25-KNOWLEDGE',
    'BOF-25',
    'KRC-KNOWLEDGE-ARTICLE',
    'Knowledge Article',
    [],
    [],
    ['CBO-INFORMATION-CONTAINER', 'KRC-KNOWLEDGE-COLLECTION'],
    'Knowledge management commands.',
    'Knowledge metadata/lifecycle references controlled information where formal content governance is required.',
    ['Knowledge content does not create duplicate controlled-document identity.']
  ),
  agg(
    'AGG-25-RECORDS',
    'BOF-25',
    'KRC-RECORD-SERIES',
    'Record Series',
    ['KRC-RECORD-FILE'],
    [],
    [
      'KRC-RECORD-DECLARATION',
      'KRC-RETENTION-SCHEDULE',
      'EVID-LEGAL-HOLD-LINK',
      'EVID-RETENTION-DISPOSITION'
    ],
    'Records-management governance.',
    'Series/file classify/aggregate record references; source business records remain authoritative.',
    ['Record declaration overlays source truth rather than copying content.']
  ),
  agg(
    'AGG-25-COMMUNICATIONS',
    'BOF-25',
    'KRC-COMMS-PLAN',
    'Communications Plan',
    ['KRC-COMMUNICATION-ITEM'],
    [],
    ['CBO-PARTY', 'KRC-STAKEHOLDER-ENGAGEMENT', 'KRC-EXTERNAL-AFFAIRS-ISSUE'],
    'Communications/stakeholder commands.',
    'Plan/item lifecycle is independent from Party identity and controlled publication content.',
    ['Communication activity and controlled content remain separate.']
  ),

  agg(
    'AGG-26-TRANSFORMATION',
    'BOF-26',
    'TRANS-INITIATIVE',
    'Transformation Initiative',
    [
      'TRANS-CHANGE-IMPACT-ASSESSMENT',
      'TRANS-READINESS-PLAN',
      'TRANS-READINESS-ASSESSMENT',
      'TRANS-ADOPTION-INTERVENTION'
    ],
    [],
    ['DEL-PORTFOLIO', 'CBO-PROJECT', 'CBO-ORGANISATION-UNIT'],
    'Transformation/change management.',
    'Transformation Initiative owns change/readiness evidence but does not replace Strategy Initiative, Programme or Project.',
    ['Actions/communications reuse shared enterprise work/communication semantics.']
  ),
  agg(
    'AGG-26-PROCESS',
    'BOF-26',
    'PROC-ENTERPRISE-PROCESS',
    'Enterprise Process',
    ['PROC-MODEL', 'PROC-VERSION'],
    [],
    [
      'PROC-OWNER-ASSIGNMENT',
      'PROC-MEASURE',
      'PROC-COMPLIANCE-ASSESSMENT',
      'CBO-INFORMATION-CONTAINER'
    ],
    'Process architecture/governance.',
    'Approved Process Versions are immutable; SOP/workflow/measure records remain explicit linked objects.',
    ['Process identity survives model/version/workflow changes.']
  ),

  agg(
    'AGG-27-WORKFLOW',
    'BOF-27',
    'WORK-WORKFLOW-INSTANCE',
    'Workflow Instance',
    [
      'WORK-WORK-ITEM',
      'WORK-ASSIGNMENT',
      'WORK-ACKNOWLEDGEMENT',
      'WORK-ESCALATION',
      'WORK-DUE-DATE-CHANGE',
      'WORK-PRIORITY-CHANGE'
    ],
    [],
    ['WORK-WORKFLOW-DEFINITION', 'CBO-PARTY'],
    'Workflow engine only.',
    'Workflow transaction may mutate workflow runtime state only; domain state changes require explicit domain aggregate commands.',
    ['Workflow tasks never become domain truth.']
  ),
  agg(
    'AGG-27-DECISION',
    'BOF-27',
    'WORK-DECISION',
    'Decision',
    ['WORK-FOLLOW-UP-ACTION'],
    [],
    ['WORK-DECISION-REQUEST', 'WORK-APPROVAL-REQUEST', 'EVID-APPROVAL', 'EVID-SIGNATURE'],
    'Authorised decision service.',
    'Decision is immutable attributable outcome evidence; resulting domain commands occur separately.',
    ['Response is not Decision; approval evidence is not the domain state change.']
  ),

  agg(
    'AGG-28-EVIDENCE',
    'BOF-28',
    'EVID-EVIDENCE-ITEM',
    'Evidence Item',
    ['EVID-PROVENANCE-REFERENCE', 'EVID-SOURCE-REFERENCE'],
    [],
    ['EVID-BUSINESS-EVENT', 'EVID-AUDIT-EVENT', 'EVID-CHANGE-EVENT'],
    'Evidence/audit append authority.',
    'Evidence/events are append-only; correction/reversal creates new evidence preserving causal history.',
    ['Evidence never becomes source aggregate truth.']
  ),
  agg(
    'AGG-28-RETENTION',
    'BOF-28',
    'EVID-RETENTION-DISPOSITION',
    'Retention Disposition Decision',
    ['EVID-LEGAL-HOLD-LINK'],
    [],
    ['KRC-RETENTION-SCHEDULE', 'EVID-ARCHIVE-PACKAGE'],
    'Records/retention authority.',
    'Disposition operates on eligible referenced records; Legal Hold blocks disposition without mutating source business identity.',
    ['Deletion/archival authority is separately evidenced.']
  ),

  agg(
    'AGG-29-CLASSIFICATION',
    'BOF-29',
    'REF-CLASSIFICATION-SYSTEM',
    'Classification System',
    ['REF-CLASSIFICATION-RELEASE', 'REF-CLASSIFICATION-CODE'],
    [],
    ['CBO-ITEM', 'CBO-ASSET', 'BE-SPACE', 'CBO-INFORMATION-CONTAINER'],
    'Reference-data governance.',
    'A release is published immutably; assignments to business objects are effective relationships owned outside the classification aggregate.',
    ['Uniclass/external codes never become business identity.']
  ),
  agg(
    'AGG-29-LIFECYCLE-CONFIG',
    'BOF-29',
    'REF-LIFECYCLE',
    'Lifecycle Definition',
    ['REF-LIFECYCLE-STATE'],
    [],
    ['REF-WORKFLOW', 'REF-STATUS-CODE', 'REF-SUITABILITY-CODE'],
    'Configuration governance.',
    'Configuration versions are immutable once used by historical transactions.',
    ['Runtime lifecycle state remains on the domain aggregate.']
  ),
  agg(
    'AGG-29-AUTHORITY-CONFIG',
    'BOF-29',
    'REF-APPROVAL-AUTHORITY-RULE',
    'Approval Authority Rule',
    [],
    [],
    ['REF-DELEGATED-AUTHORITY-RULE', 'REF-PERMISSION', 'REF-ROLE'],
    'Security/governance configuration administration.',
    'Policy/rule changes do not grant runtime authority until evaluated into effective assignments/grants.',
    ['Permission, role and delegated authority rules are configuration, not runtime assignment.']
  ),
  agg(
    'AGG-29-REFERENCE-DATA',
    'BOF-29',
    'REF-JURISDICTION',
    'Reference Data',
    [],
    [],
    ['REF-CURRENCY', 'REF-UOM', 'REF-CALENDAR', 'REF-TAX-REGIME', 'REF-CONTRACT-FORM-FAMILY'],
    'Reference-data stewardship.',
    'Reference changes are versioned/effective and historical transactions retain the version needed to interpret original meaning.',
    ['Reference data defines meaning; it never becomes transactional truth.']
  ),
  agg(
    'AGG-02-ASSUMPTION',
    'BOF-02',
    'SGP-ASSUMPTION',
    'Assumption',
    [],
    [],
    ['AGG-02-STRATEGY'],
    'Commands for Assumption are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Assumption aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Assumption is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-02-GOVERNANCE-MEETING',
    'BOF-02',
    'SGP-GOVERNANCE-MEETING',
    'Governance Meeting',
    [],
    [],
    ['AGG-02-GOVERNANCE'],
    'Commands for Governance Meeting are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Governance Meeting aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Governance Meeting is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-02-SCENARIO',
    'BOF-02',
    'SGP-SCENARIO',
    'Scenario',
    [],
    [],
    ['AGG-02-STRATEGY'],
    'Commands for Scenario are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Scenario aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Scenario is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-02-AUTHORITY-FRAMEWORK',
    'BOF-02',
    'SGP-AUTHORITY-FRAMEWORK',
    'Authority Framework',
    [],
    [],
    ['AGG-02-GOVERNANCE'],
    'Commands for Authority Framework are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Authority Framework aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Authority Framework is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-02-POLICY',
    'BOF-02',
    'SGP-POLICY',
    'Policy',
    [],
    [],
    ['AGG-02-GOVERNANCE'],
    'Commands for Policy are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Policy aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Policy is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-21-CASE',
    'BOF-21',
    'INTEGRITY-CASE',
    'Integrity Case',
    [],
    [],
    ['AGG-21-RISK'],
    'Commands for Integrity Case are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Integrity Case aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Integrity Case is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-04-BUSINESS-CASE',
    'BOF-04',
    'LDI-BUSINESS-CASE',
    'Business Case',
    [],
    [],
    ['AGG-04-DEVELOPMENT'],
    'Commands for Business Case are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Business Case aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Business Case is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-03-MARKET-INSIGHT',
    'BOF-03',
    'CRM-MARKET-INSIGHT',
    'Market Insight',
    [],
    [],
    ['AGG-03-OPPORTUNITY'],
    'Commands for Market Insight are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Market Insight aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Market Insight is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-25-COMMS-CAMPAIGN',
    'BOF-25',
    'KRC-COMMS-CAMPAIGN',
    'Communications Campaign',
    [],
    [],
    ['AGG-25-COMMUNICATIONS'],
    'Commands for Communications Campaign are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Communications Campaign aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Communications Campaign is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-03-LEAD',
    'BOF-03',
    'CRM-LEAD',
    'Lead',
    [],
    [],
    ['AGG-03-OPPORTUNITY'],
    'Commands for Lead are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Lead aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Lead is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-03-ACCOUNT-PLAN',
    'BOF-03',
    'CRM-ACCOUNT-PLAN',
    'Account Plan',
    [],
    [],
    ['AGG-03-OPPORTUNITY'],
    'Commands for Account Plan are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Account Plan aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Account Plan is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-10-PRICE-LIST',
    'BOF-10',
    'ITEM-PRICE-LIST',
    'Price List',
    [],
    [],
    ['AGG-10-ITEM'],
    'Commands for Price List are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Price List aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Price List is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-05-SALES-ORDER',
    'BOF-05',
    'EST-SALES-ORDER',
    'Sales Order',
    [],
    [],
    ['AGG-05-OFFER'],
    'Commands for Sales Order are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Sales Order aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Sales Order is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-18-COMPENSATION',
    'BOF-18',
    'HCM-COMPENSATION',
    'Compensation Arrangement',
    [],
    [],
    ['AGG-18-PAYROLL'],
    'Commands for Compensation Arrangement are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Compensation Arrangement aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Compensation Arrangement is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-03-CUSTOMER-ONBOARDING',
    'BOF-03',
    'CRM-CUSTOMER-ONBOARDING',
    'Customer Onboarding Case',
    [],
    [],
    ['AGG-03-CUSTOMER-CASE'],
    'Commands for Customer Onboarding Case are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Customer Onboarding Case aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Customer Onboarding Case is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-17-WARRANTY-CLAIM',
    'BOF-17',
    'OPS-WARRANTY-CLAIM',
    'Warranty Claim',
    [],
    [],
    ['AGG-17-SERVICE'],
    'Commands for Warranty Claim are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Warranty Claim aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Warranty Claim is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-17-SERVICE-LEVEL',
    'BOF-17',
    'OPS-SERVICE-LEVEL',
    'Service Entitlement & SLA',
    [],
    [],
    ['AGG-17-SERVICE'],
    'Commands for Service Entitlement & SLA are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Service Entitlement & SLA aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Service Entitlement & SLA is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-09-PROCUREMENT-PACKAGE',
    'BOF-09',
    'COM-PROCUREMENT-PACKAGE',
    'Procurement Package',
    [],
    [],
    ['AGG-09-SOURCING'],
    'Commands for Procurement Package are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Procurement Package aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Procurement Package is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-01-PARTY-RELATIONSHIP',
    'BOF-01',
    'AUTH-PARTY-RELATIONSHIP',
    'Party Relationship',
    [],
    [],
    ['AGG-01-PARTY'],
    'Commands for Party Relationship are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Party Relationship aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Party Relationship is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-09-REQUISITION',
    'BOF-09',
    'PROC-REQUISITION',
    'Requisition',
    [],
    [],
    ['AGG-09-SOURCING'],
    'Commands for Requisition are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Requisition aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Requisition is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-10-TRADE-DECLARATION',
    'BOF-10',
    'LOG-TRADE-DECLARATION',
    'Trade Declaration',
    [],
    [],
    ['AGG-10-LOGISTICS'],
    'Commands for Trade Declaration are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Trade Declaration aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Trade Declaration is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-26-IMPROVEMENT-OPPORTUNITY',
    'BOF-26',
    'PROC-IMPROVEMENT-OPPORTUNITY',
    'Improvement Opportunity',
    [],
    [],
    ['AGG-26-PROCESS'],
    'Commands for Improvement Opportunity are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Improvement Opportunity aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Improvement Opportunity is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-17-SERVICE-ACCEPTANCE',
    'BOF-17',
    'OPS-SERVICE-ACCEPTANCE',
    'Service Acceptance',
    [],
    [],
    ['AGG-17-SERVICE'],
    'Commands for Service Acceptance are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Service Acceptance aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Service Acceptance is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-13-INSPECTION',
    'BOF-13',
    'QHSE-INSPECTION',
    'Inspection',
    [],
    [],
    ['AGG-13-QUALITY'],
    'Commands for Inspection are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Inspection aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Inspection is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-13-QUALITY-PLAN',
    'BOF-13',
    'QHSE-QUALITY-PLAN',
    'Quality Plan',
    [],
    [],
    ['AGG-13-QUALITY'],
    'Commands for Quality Plan are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Quality Plan aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Quality Plan is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-13-CAPA-CASE',
    'BOF-13',
    'QHSE-CAPA-CASE',
    'CAPA Case',
    [],
    [],
    ['AGG-13-NONCONFORMANCE'],
    'Commands for CAPA Case are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One CAPA Case aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'CAPA Case is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-19-BUDGET',
    'BOF-19',
    'FIN-BUDGET',
    'Budget',
    [],
    [],
    ['AGG-19-LEDGER'],
    'Commands for Budget are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Budget aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Budget is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-19-FIXED-ASSET',
    'BOF-19',
    'FIN-FIXED-ASSET',
    'Fixed Asset Accounting Record',
    [],
    [],
    ['AGG-19-LEDGER'],
    'Commands for Fixed Asset Accounting Record are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Fixed Asset Accounting Record aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Fixed Asset Accounting Record is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-19-TAX-RETURN',
    'BOF-19',
    'FIN-TAX-RETURN',
    'Tax Return',
    [],
    [],
    ['AGG-19-LEDGER'],
    'Commands for Tax Return are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Tax Return aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Tax Return is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-18-WORKFORCE-PLAN',
    'BOF-18',
    'HCM-WORKFORCE-PLAN',
    'Workforce Plan',
    [],
    [],
    ['AGG-18-WORKFORCE'],
    'Commands for Workforce Plan are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Workforce Plan aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Workforce Plan is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-18-JOB-PROFILE',
    'BOF-18',
    'HCM-JOB-PROFILE',
    'Job Profile',
    [],
    [],
    ['AGG-18-POSITION'],
    'Commands for Job Profile are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Job Profile aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Job Profile is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-18-VACANCY',
    'BOF-18',
    'HCM-VACANCY',
    'Vacancy',
    [],
    [],
    ['AGG-18-WORKFORCE'],
    'Commands for Vacancy are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Vacancy aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Vacancy is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-18-TIMESHEET',
    'BOF-18',
    'HCM-TIMESHEET',
    'Timesheet',
    [],
    [],
    ['AGG-18-WORKFORCE'],
    'Commands for Timesheet are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Timesheet aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Timesheet is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-18-PERFORMANCE-REVIEW',
    'BOF-18',
    'HCM-PERFORMANCE-REVIEW',
    'Performance Review',
    [],
    [],
    ['AGG-18-WORKFORCE'],
    'Commands for Performance Review are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Performance Review aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Performance Review is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-24-TECHNOLOGY-RESOURCE',
    'BOF-24',
    'IT-TECHNOLOGY-RESOURCE',
    'Technology Resource',
    [],
    [],
    ['AGG-24-TECHNOLOGY'],
    'Commands for Technology Resource are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Technology Resource aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Technology Resource is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-01-USER-IDENTITY',
    'BOF-01',
    'AUTH-USER-IDENTITY',
    'User Identity',
    [],
    [],
    ['AGG-01-AUTHORITY'],
    'Commands for User Identity are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One User Identity aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'User Identity is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-24-SERVICE-REQUEST',
    'BOF-24',
    'IT-SERVICE-REQUEST',
    'IT Service Request',
    [],
    [],
    ['AGG-24-TECHNOLOGY'],
    'Commands for IT Service Request are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One IT Service Request aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'IT Service Request is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-24-INCIDENT',
    'BOF-24',
    'IT-INCIDENT',
    'IT Incident',
    [],
    [],
    ['AGG-24-TECHNOLOGY'],
    'Commands for IT Incident are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One IT Incident aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'IT Incident is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-24-PROBLEM',
    'BOF-24',
    'IT-PROBLEM',
    'Problem',
    [],
    [],
    ['AGG-24-TECHNOLOGY'],
    'Commands for Problem are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Problem aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Problem is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-24-TECHNOLOGY-CHANGE',
    'BOF-24',
    'IT-TECHNOLOGY-CHANGE',
    'Technology Change',
    [],
    [],
    ['AGG-24-TECHNOLOGY'],
    'Commands for Technology Change are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Technology Change aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Technology Change is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-23-DISASTER-RECOVERY-PLAN',
    'BOF-23',
    'IT-DISASTER-RECOVERY-PLAN',
    'Disaster Recovery Plan',
    [],
    [],
    ['AGG-23-CONTINUITY'],
    'Commands for Disaster Recovery Plan are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Disaster Recovery Plan aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Disaster Recovery Plan is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-24-DOMAIN',
    'BOF-24',
    'DATA-DOMAIN',
    'Data Domain',
    [],
    [],
    ['AGG-24-DATA'],
    'Commands for Data Domain are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Data Domain aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Data Domain is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-24-QUALITY-ISSUE',
    'BOF-24',
    'DATA-QUALITY-ISSUE',
    'Data Quality Issue',
    [],
    [],
    ['AGG-24-DATA'],
    'Commands for Data Quality Issue are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Data Quality Issue aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Data Quality Issue is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-24-MODEL',
    'BOF-24',
    'ANALYTICS-MODEL',
    'Analytical Model',
    [],
    [],
    ['AGG-24-DATA'],
    'Commands for Analytical Model are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Analytical Model aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Analytical Model is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-24-ACCESS-REQUEST',
    'BOF-24',
    'DATA-ACCESS-REQUEST',
    'Data Access Request',
    [],
    [],
    ['AGG-24-DATA'],
    'Commands for Data Access Request are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Data Access Request aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Data Access Request is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-24-POLICY',
    'BOF-24',
    'SECURITY-POLICY',
    'Security Policy',
    [],
    [],
    ['AGG-24-CYBER'],
    'Commands for Security Policy are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Security Policy aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Security Policy is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-01-ACCESS-GRANT',
    'BOF-01',
    'SEC-ACCESS-GRANT',
    'Access Grant',
    [],
    [],
    ['AGG-01-AUTHORITY'],
    'Commands for Access Grant are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Access Grant aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Access Grant is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-24-VULNERABILITY',
    'BOF-24',
    'SEC-VULNERABILITY',
    'Vulnerability',
    [],
    [],
    ['AGG-24-CYBER'],
    'Commands for Vulnerability are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Vulnerability aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Vulnerability is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-24-SECURITY-ALERT',
    'BOF-24',
    'SEC-SECURITY-ALERT',
    'Security Alert',
    [],
    [],
    ['AGG-24-CYBER'],
    'Commands for Security Alert are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Security Alert aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Security Alert is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-22-IP-ASSET',
    'BOF-22',
    'LEGAL-IP-ASSET',
    'Intellectual Property Asset',
    [],
    [],
    ['AGG-22-LEGAL'],
    'Commands for Intellectual Property Asset are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Intellectual Property Asset aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Intellectual Property Asset is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-22-PROCEEDING',
    'BOF-22',
    'LEGAL-PROCEEDING',
    'Legal Proceeding',
    [],
    [],
    ['AGG-22-LEGAL'],
    'Commands for Legal Proceeding are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Legal Proceeding aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Legal Proceeding is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-22-OBLIGATION',
    'BOF-22',
    'LEGAL-OBLIGATION',
    'Legal Obligation',
    [],
    [],
    ['AGG-22-LEGAL'],
    'Commands for Legal Obligation are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Legal Obligation aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Legal Obligation is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-21-REQUIREMENT',
    'BOF-21',
    'COMP-REQUIREMENT',
    'Compliance Requirement',
    [],
    [],
    ['AGG-21-CONTROL'],
    'Commands for Compliance Requirement are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Compliance Requirement aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Compliance Requirement is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-22-FRAMEWORK',
    'BOF-22',
    'PRIV-FRAMEWORK',
    'Privacy Framework',
    [],
    [],
    ['AGG-22-PRIVACY'],
    'Commands for Privacy Framework are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Privacy Framework aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Privacy Framework is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-22-CONSENT-EVIDENCE',
    'BOF-22',
    'PRIV-CONSENT-EVIDENCE',
    'Consent Evidence',
    [],
    [],
    ['AGG-22-PRIVACY'],
    'Commands for Consent Evidence are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Consent Evidence aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Consent Evidence is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-22-DATA-SUBJECT-REQUEST',
    'BOF-22',
    'PRIV-DATA-SUBJECT-REQUEST',
    'Data Subject Request',
    [],
    [],
    ['AGG-22-PRIVACY'],
    'Commands for Data Subject Request are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Data Subject Request aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Data Subject Request is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-22-INCIDENT',
    'BOF-22',
    'PRIV-INCIDENT',
    'Privacy Incident',
    [],
    [],
    ['AGG-22-PRIVACY'],
    'Commands for Privacy Incident are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Privacy Incident aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Privacy Incident is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-17-UTILITY-ACCOUNT',
    'BOF-17',
    'OPS-UTILITY-ACCOUNT',
    'Utility Account',
    [],
    [],
    ['AGG-17-SERVICE'],
    'Commands for Utility Account are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Utility Account aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Utility Account is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-21-COMPLIANCE-REQUIREMENT',
    'BOF-21',
    'QHSE-COMPLIANCE-REQUIREMENT',
    'Compliance Requirement',
    [],
    [],
    ['AGG-21-CONTROL'],
    'Commands for Compliance Requirement are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Compliance Requirement aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Compliance Requirement is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-20-WASTE-CONSIGNMENT',
    'BOF-20',
    'QHSE-WASTE-CONSIGNMENT',
    'Waste Consignment',
    [],
    [],
    ['AGG-20-RESOURCE-OUTCOME'],
    'Commands for Waste Consignment are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Waste Consignment aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Waste Consignment is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-20-RESPONSIBLE-PROCUREMENT',
    'BOF-20',
    'SUS-RESPONSIBLE-PROCUREMENT',
    'Responsible Procurement Assessment',
    [],
    [],
    ['AGG-20-RESOURCE-OUTCOME'],
    'Commands for Responsible Procurement Assessment are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Responsible Procurement Assessment aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Responsible Procurement Assessment is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-23-PHYSICAL-SECURITY-INCIDENT',
    'BOF-23',
    'SEC-PHYSICAL-SECURITY-INCIDENT',
    'Physical Security Incident',
    [],
    [],
    ['AGG-23-CRISIS'],
    'Commands for Physical Security Incident are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Physical Security Incident aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Physical Security Incident is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-25-EXTERNAL-AFFAIRS-ISSUE',
    'BOF-25',
    'KRC-EXTERNAL-AFFAIRS-ISSUE',
    'External Affairs Issue',
    [],
    [],
    ['AGG-25-COMMUNICATIONS'],
    'Commands for External Affairs Issue are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One External Affairs Issue aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'External Affairs Issue is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-25-STAKEHOLDER-PLAN',
    'BOF-25',
    'KRC-STAKEHOLDER-PLAN',
    'Stakeholder Engagement Plan',
    [],
    [],
    ['AGG-25-COMMUNICATIONS'],
    'Commands for Stakeholder Engagement Plan are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Stakeholder Engagement Plan aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Stakeholder Engagement Plan is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-25-STAKEHOLDER-ENGAGEMENT',
    'BOF-25',
    'KRC-STAKEHOLDER-ENGAGEMENT',
    'Stakeholder Engagement',
    [],
    [],
    ['AGG-25-COMMUNICATIONS'],
    'Commands for Stakeholder Engagement are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Stakeholder Engagement aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Stakeholder Engagement is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-06-PORTFOLIO',
    'BOF-06',
    'DEL-PORTFOLIO',
    'Portfolio',
    [],
    [],
    ['AGG-06-PROJECT'],
    'Commands for Portfolio are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Portfolio aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Portfolio is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-18-WORKFORCE-ALLOCATION',
    'BOF-18',
    'HCM-WORKFORCE-ALLOCATION',
    'Workforce Allocation',
    [],
    [],
    ['AGG-18-WORKFORCE'],
    'Commands for Workforce Allocation are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Workforce Allocation aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Workforce Allocation is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-26-STAKEHOLDER-COHORT',
    'BOF-26',
    'TRANS-STAKEHOLDER-COHORT',
    'Stakeholder Cohort',
    [],
    [],
    ['AGG-26-TRANSFORMATION'],
    'Commands for Stakeholder Cohort are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Stakeholder Cohort aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Stakeholder Cohort is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-26-ORGANISATION-TRANSITION',
    'BOF-26',
    'TRANS-ORGANISATION-TRANSITION',
    'Organisation Transition',
    [],
    [],
    ['AGG-26-TRANSFORMATION'],
    'Commands for Organisation Transition are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Organisation Transition aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Organisation Transition is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-26-ANALYSIS',
    'BOF-26',
    'PROC-ANALYSIS',
    'Process Analysis',
    [],
    [],
    ['AGG-26-PROCESS'],
    'Commands for Process Analysis are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Process Analysis aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Process Analysis is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-21-ASSESSMENT',
    'BOF-21',
    'COMP-ASSESSMENT',
    'Compliance Assessment',
    [],
    [],
    ['AGG-21-CONTROL'],
    'Commands for Compliance Assessment are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Compliance Assessment aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Compliance Assessment is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-10-STOCK-COUNT',
    'BOF-10',
    'INV-STOCK-COUNT',
    'Stock Count',
    [],
    [],
    ['AGG-10-INVENTORY-MOVEMENT'],
    'Commands for Stock Count are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Stock Count aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Stock Count is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-10-INVENTORY-ADJUSTMENT',
    'BOF-10',
    'INV-ADJUSTMENT',
    'Inventory Adjustment',
    [],
    [],
    ['AGG-10-INVENTORY-MOVEMENT'],
    'Commands for Inventory Adjustment are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Inventory Adjustment aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Inventory Adjustment is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  ),
  agg(
    'AGG-10-INVENTORY-QUARANTINE',
    'BOF-10',
    'INV-QUARANTINE',
    'Inventory Quarantine',
    [],
    [],
    ['AGG-10-INVENTORY-MOVEMENT'],
    'Commands for Inventory Quarantine are authorised through its owning domain; other workspaces reference the stable record and invoke explicit commands.',
    'One Inventory Quarantine aggregate transaction changes one identity/case/relationship at a time; cross-aggregate consequences are explicit events or follow-up commands.',
    [
      'Inventory Quarantine is an independent write boundary because governed L2/L3 activities create, change, approve, execute or close it directly.'
    ]
  )
];

export const activityDrivenAggregateOwnership: Record<string, string> = {
  'SGP-ASSUMPTION': 'AGG-02-ASSUMPTION',
  'SGP-GOVERNANCE-MEETING': 'AGG-02-GOVERNANCE-MEETING',
  'SGP-SCENARIO': 'AGG-02-SCENARIO',
  'SGP-AUTHORITY-FRAMEWORK': 'AGG-02-AUTHORITY-FRAMEWORK',
  'SGP-POLICY': 'AGG-02-POLICY',
  'INTEGRITY-CASE': 'AGG-21-CASE',
  'LDI-BUSINESS-CASE': 'AGG-04-BUSINESS-CASE',
  'CRM-MARKET-INSIGHT': 'AGG-03-MARKET-INSIGHT',
  'KRC-COMMS-CAMPAIGN': 'AGG-25-COMMS-CAMPAIGN',
  'CRM-LEAD': 'AGG-03-LEAD',
  'CRM-ACCOUNT-PLAN': 'AGG-03-ACCOUNT-PLAN',
  'ITEM-PRICE-LIST': 'AGG-10-PRICE-LIST',
  'EST-SALES-ORDER': 'AGG-05-SALES-ORDER',
  'HCM-COMPENSATION': 'AGG-18-COMPENSATION',
  'CRM-CUSTOMER-ONBOARDING': 'AGG-03-CUSTOMER-ONBOARDING',
  'OPS-WARRANTY-CLAIM': 'AGG-17-WARRANTY-CLAIM',
  'OPS-SERVICE-LEVEL': 'AGG-17-SERVICE-LEVEL',
  'COM-PROCUREMENT-PACKAGE': 'AGG-09-PROCUREMENT-PACKAGE',
  'AUTH-PARTY-RELATIONSHIP': 'AGG-01-PARTY-RELATIONSHIP',
  'PROC-REQUISITION': 'AGG-09-REQUISITION',
  'LOG-TRADE-DECLARATION': 'AGG-10-TRADE-DECLARATION',
  'PROC-IMPROVEMENT-OPPORTUNITY': 'AGG-26-IMPROVEMENT-OPPORTUNITY',
  'OPS-SERVICE-ACCEPTANCE': 'AGG-17-SERVICE-ACCEPTANCE',
  'QHSE-INSPECTION': 'AGG-13-INSPECTION',
  'QHSE-QUALITY-PLAN': 'AGG-13-QUALITY-PLAN',
  'QHSE-CAPA-CASE': 'AGG-13-CAPA-CASE',
  'FIN-BUDGET': 'AGG-19-BUDGET',
  'FIN-FIXED-ASSET': 'AGG-19-FIXED-ASSET',
  'FIN-TAX-RETURN': 'AGG-19-TAX-RETURN',
  'HCM-WORKFORCE-PLAN': 'AGG-18-WORKFORCE-PLAN',
  'HCM-JOB-PROFILE': 'AGG-18-JOB-PROFILE',
  'HCM-VACANCY': 'AGG-18-VACANCY',
  'HCM-TIMESHEET': 'AGG-18-TIMESHEET',
  'HCM-PERFORMANCE-REVIEW': 'AGG-18-PERFORMANCE-REVIEW',
  'IT-TECHNOLOGY-RESOURCE': 'AGG-24-TECHNOLOGY-RESOURCE',
  'AUTH-USER-IDENTITY': 'AGG-01-USER-IDENTITY',
  'IT-SERVICE-REQUEST': 'AGG-24-SERVICE-REQUEST',
  'IT-INCIDENT': 'AGG-24-INCIDENT',
  'IT-PROBLEM': 'AGG-24-PROBLEM',
  'IT-TECHNOLOGY-CHANGE': 'AGG-24-TECHNOLOGY-CHANGE',
  'IT-DISASTER-RECOVERY-PLAN': 'AGG-23-DISASTER-RECOVERY-PLAN',
  'DATA-DOMAIN': 'AGG-24-DOMAIN',
  'DATA-QUALITY-ISSUE': 'AGG-24-QUALITY-ISSUE',
  'ANALYTICS-MODEL': 'AGG-24-MODEL',
  'DATA-ACCESS-REQUEST': 'AGG-24-ACCESS-REQUEST',
  'SECURITY-POLICY': 'AGG-24-POLICY',
  'SEC-ACCESS-GRANT': 'AGG-01-ACCESS-GRANT',
  'SEC-VULNERABILITY': 'AGG-24-VULNERABILITY',
  'SEC-SECURITY-ALERT': 'AGG-24-SECURITY-ALERT',
  'LEGAL-IP-ASSET': 'AGG-22-IP-ASSET',
  'LEGAL-PROCEEDING': 'AGG-22-PROCEEDING',
  'LEGAL-OBLIGATION': 'AGG-22-OBLIGATION',
  'COMP-REQUIREMENT': 'AGG-21-REQUIREMENT',
  'PRIV-FRAMEWORK': 'AGG-22-FRAMEWORK',
  'PRIV-CONSENT-EVIDENCE': 'AGG-22-CONSENT-EVIDENCE',
  'PRIV-DATA-SUBJECT-REQUEST': 'AGG-22-DATA-SUBJECT-REQUEST',
  'PRIV-INCIDENT': 'AGG-22-INCIDENT',
  'OPS-UTILITY-ACCOUNT': 'AGG-17-UTILITY-ACCOUNT',
  'QHSE-COMPLIANCE-REQUIREMENT': 'AGG-21-COMPLIANCE-REQUIREMENT',
  'QHSE-WASTE-CONSIGNMENT': 'AGG-20-WASTE-CONSIGNMENT',
  'SUS-RESPONSIBLE-PROCUREMENT': 'AGG-20-RESPONSIBLE-PROCUREMENT',
  'SEC-PHYSICAL-SECURITY-INCIDENT': 'AGG-23-PHYSICAL-SECURITY-INCIDENT',
  'KRC-EXTERNAL-AFFAIRS-ISSUE': 'AGG-25-EXTERNAL-AFFAIRS-ISSUE',
  'KRC-STAKEHOLDER-PLAN': 'AGG-25-STAKEHOLDER-PLAN',
  'KRC-STAKEHOLDER-ENGAGEMENT': 'AGG-25-STAKEHOLDER-ENGAGEMENT',
  'DEL-PORTFOLIO': 'AGG-06-PORTFOLIO',
  'HCM-WORKFORCE-ALLOCATION': 'AGG-18-WORKFORCE-ALLOCATION',
  'TRANS-STAKEHOLDER-COHORT': 'AGG-26-STAKEHOLDER-COHORT',
  'TRANS-ORGANISATION-TRANSITION': 'AGG-26-ORGANISATION-TRANSITION',
  'PROC-ANALYSIS': 'AGG-26-ANALYSIS',
  'COMP-ASSESSMENT': 'AGG-21-ASSESSMENT',
  'INV-STOCK-COUNT': 'AGG-10-STOCK-COUNT',
  'INV-ADJUSTMENT': 'AGG-10-INVENTORY-ADJUSTMENT',
  'INV-QUARANTINE': 'AGG-10-INVENTORY-QUARANTINE',
  'CBO-CONTRACT': 'AGG-08-CONTRACT'
};

export const canonicalAggregateRules = [
  'An independently governed identity, case, plan, transaction or effective relationship is an aggregate root unless this freeze explicitly places it inside another aggregate.',
  'Lines, children, revisions, iterations and aggregate-local configuration/value objects are owned by one aggregate and are never written independently.',
  'Published projections/read models are read-only. They may be rebuilt from source aggregates and may be snapshotted for evidence, but commands never target them as source truth.',
  'Cross-aggregate links use stable identifiers and version/effectivity references. A persistence foreign key does not imply aggregate ownership.',
  'A single command transaction writes one aggregate boundary. Cross-aggregate business outcomes use domain events, outbox messages, workflow/process managers or explicit follow-up commands.',
  'No UI screen, vendor module, workspace, report, CDE folder or integration payload may redefine aggregate ownership.',
  'Append-only accounting, audit, approval, evidence, decision, filing, issue and similar accountability records are corrected by new governed records rather than destructive history edits.',
  'Tenant, Party, Project, Contract, Information Container, Item, Asset/System and other shared masters have one canonical identity reused across all 29 workspaces.',
  'Workflow coordinates domain commands but never owns business state that belongs to another aggregate.',
  'The freeze is a logical consistency boundary, not an instruction to create one database table or service per aggregate.'
] as const;

export const refinementAggregateOwnership: Record<string, string> = {
  'PLN-DEMAND-PLAN': 'AGG-10-PLANNING',
  'PLN-SUPPLY-PLAN': 'AGG-10-PLANNING',
  'PLN-PLANNING-EXCEPTION': 'AGG-10-PLANNING',
  'TREASURY-EXPOSURE': 'AGG-19-TREASURY',
  'TREASURY-HEDGE-RELATIONSHIP': 'AGG-19-TREASURY',
  'TREASURY-MARKET-DATA-SNAPSHOT': 'AGG-19-TREASURY',
  'TREASURY-CASH-POOL': 'AGG-19-TREASURY',
  'MDG-STEWARDSHIP-CASE': 'AGG-01-MASTER-STEWARDSHIP',
  'MDG-DUPLICATE-CANDIDATE': 'AGG-01-MASTER-STEWARDSHIP',
  'MDG-MERGE-DECISION': 'AGG-01-MASTER-STEWARDSHIP',
  'MDG-IDENTITY-REDIRECT': 'AGG-01-MASTER-STEWARDSHIP',
  'LOG-HANDLING-UNIT': 'AGG-10-LOGISTICS',
  'LOG-WAREHOUSE-WAVE': 'AGG-10-LOGISTICS',
  'LOG-YARD-DOCK-APPOINTMENT': 'AGG-10-LOGISTICS',
  'LOG-FREIGHT-TENDER': 'AGG-10-LOGISTICS',
  'LOG-FREIGHT-SETTLEMENT': 'AGG-10-LOGISTICS',
  'REL-ASSET-CRITICALITY-ASSESSMENT': 'AGG-17-RELIABILITY',
  'REL-FAILURE-MODE': 'AGG-17-RELIABILITY',
  'REL-RELIABILITY-STRATEGY': 'AGG-17-RELIABILITY',
  'REL-ASSET-HEALTH-POSITION': 'AGG-17-RELIABILITY',
  'HCM-SUCCESSION-PLAN': 'AGG-18-TALENT',
  'HCM-TALENT-POOL': 'AGG-18-TALENT',
  'HCM-TALENT-POOL-MEMBERSHIP': 'AGG-18-TALENT',
  'HCM-TALENT-REVIEW': 'AGG-18-TALENT',
  'CFG-PRODUCT-CONFIG-MODEL': 'AGG-10-CONFIGURATION',
  'CFG-CHARACTERISTIC-DEFINITION': 'AGG-10-CONFIGURATION',
  'CFG-CONFIGURATION-RULE': 'AGG-10-CONFIGURATION',
  'CFG-CONFIGURATION-INSTANCE': 'AGG-10-CONFIGURATION-INSTANCE',
  'HCM-TRAVEL-REQUEST': 'AGG-18-TRAVEL',
  'HCM-BUSINESS-TRIP': 'AGG-18-TRAVEL',
  'HCM-TRAVEL-BOOKING-EVIDENCE': 'AGG-18-TRAVEL',
  'DATA-MIGRATION-PROJECT': 'AGG-24-DATA-MIGRATION',
  'DATA-MIGRATION-MAPPING': 'AGG-24-DATA-MIGRATION',
  'DATA-MIGRATION-RUN': 'AGG-24-DATA-MIGRATION',
  'DATA-TEST-DATA-PROFILE': 'AGG-24-DATA-MIGRATION',
  'DATA-TEST-DATA-RUN': 'AGG-24-DATA-MIGRATION',
  'ENG-PRODUCT-REQUIREMENT': 'AGG-07-ENGINEERING-REQUIREMENTS',
  'ENG-REQUIREMENT-SET': 'AGG-07-ENGINEERING-REQUIREMENTS',
  'ENG-SYSTEM-MODEL': 'AGG-07-ENGINEERING-MODEL',
  'ENG-SYSTEM-MODEL-ELEMENT': 'AGG-07-ENGINEERING-MODEL',
  'FIN-LEASE-ACCOUNTING-RECORD': 'AGG-19-LEASE-ACCOUNTING',
  'FIN-LEASE-VALUATION': 'AGG-19-LEASE-ACCOUNTING',
  'FIN-LEASE-PAYMENT-SCHEDULE': 'AGG-19-LEASE-ACCOUNTING',
  'DEL-SCHEDULE-CALENDAR': 'AGG-06-SCHEDULE',
  'DEL-SCHEDULE-CALCULATION-RUN': 'AGG-06-SCHEDULE',
  'DEL-SCHEDULE-ANALYSIS-SNAPSHOT': 'AGG-06-SCHEDULE',
  'DEL-RISK-SIMULATION-RUN': 'AGG-06-PROJECT-CONTROLS',
  'DEL-RISK-ANALYSIS-SNAPSHOT': 'AGG-06-PROJECT-CONTROLS',
  'DEL-PROGRESS-MEASUREMENT-METHOD': 'AGG-06-PROJECT-CONTROLS',
  'DEL-PERFORMANCE-CALCULATION-RUN': 'AGG-06-PROJECT-CONTROLS',
  'DEL-PROJECT-PERFORMANCE-SNAPSHOT': 'AGG-06-PROJECT-CONTROLS',
  'COM-CONTRACT-VALUE-SCHEDULE': 'AGG-08-CONTRACT',
  'COM-CONTRACT-VALUE-LINE': 'AGG-08-CONTRACT',
  'COM-TARGET-COST-BASELINE': 'AGG-08-COMMERCIAL-ASSESSMENT',
  'COM-SHARE-MECHANISM': 'AGG-08-COMMERCIAL-ASSESSMENT',
  'COM-SHARE-ASSESSMENT': 'AGG-08-COMMERCIAL-ASSESSMENT',
  'CFG-EFFECTIVITY-STATEMENT': 'AGG-10-CONFIGURATION',
  'CFG-EFFECTIVITY-ASSIGNMENT': 'AGG-10-CONFIGURATION',
  'CFG-CONFIGURATION-BASELINE': 'AGG-10-CONFIGURATION',
  'CFG-STRUCTURE-OCCURRENCE': 'AGG-10-CONFIGURATION',
  'OPS-AS-MAINTAINED-CONFIGURATION': 'AGG-17-MAINTENANCE',
  'TWIN-FEDERATION-CONTEXT': 'AGG-16-DIGITAL-TWIN',
  'TWIN-DATA-BINDING': 'AGG-16-DIGITAL-TWIN',
  'TWIN-STATE-SNAPSHOT': 'AGG-16-DIGITAL-TWIN',
  'OPS-ASSET-INTERVENTION-OPTION': 'AGG-16-ASSET-INVESTMENT',
  'OPS-ASSET-INVESTMENT-APPRAISAL': 'AGG-16-ASSET-INVESTMENT',
  'OPS-ASSET-INVESTMENT-PLAN': 'AGG-16-ASSET-INVESTMENT',
  'NET-TERMINAL': 'AGG-16-NETWORK',
  'NET-CONNECTIVITY-RELATIONSHIP': 'AGG-16-NETWORK',
  'NET-LINEAR-LOCATION-ASSIGNMENT': 'AGG-16-NETWORK',
  'NET-TRACE-CONFIGURATION': 'AGG-16-NETWORK',
  'NET-TRACE-RUN': 'AGG-16-NETWORK',
  'NET-TRACE-RESULT': 'AGG-16-NETWORK',
  'OPS-WORKPLACE-RESERVATION': 'AGG-17-WORKPLACE',
  'CORP-OFFICE-APPOINTMENT': 'AGG-22-CORPORATE-SECRETARIAT',
  'CORP-ENTITY-REGISTER-SNAPSHOT': 'AGG-22-CORPORATE-SECRETARIAT',
  'FIN-RECOGNITION-POLICY': 'AGG-19-RECOGNITION',
  'FIN-CONSTRUCTION-WIP-RUN': 'AGG-19-RECOGNITION',
  'FIN-CONSTRUCTION-WIP-POSITION': 'AGG-19-RECOGNITION'
};

const familyIds = new Set(register.families.map((family) => family.id));
const aggregateIds = new Set(canonicalAggregateBoundaries.map((boundary) => boundary.id));
const refinementIds = new Set(benchmarkRefinementModel.map((entry) => entry.modelId));

export const canonicalAggregateFreezeSummary = {
  familyCount: familyIds.size,
  frozenFamilyCount: new Set(canonicalAggregateBoundaries.map((boundary) => boundary.familyId))
    .size,
  aggregateBoundaryCount: canonicalAggregateBoundaries.length,
  frozenAggregateBoundaryCount: canonicalAggregateBoundaries.filter(
    (boundary) => boundary.state === 'frozen'
  ).length,
  benchmarkRefinementCount: refinementIds.size,
  benchmarkRefinementsAssigned: Object.keys(refinementAggregateOwnership).filter((id) =>
    refinementIds.has(id)
  ).length,
  activityDrivenOwnershipCount: Object.keys(activityDrivenAggregateOwnership).length,
  state: 'frozen' as const
};

export function validateCanonicalAggregateBoundaryFreeze() {
  if (familyIds.size !== 29) return false;
  if (canonicalAggregateFreezeSummary.frozenFamilyCount !== 29) return false;
  if (
    new Set(canonicalAggregateBoundaries.map((boundary) => boundary.id)).size !==
    canonicalAggregateBoundaries.length
  )
    return false;
  if (
    new Set(canonicalAggregateBoundaries.map((boundary) => boundary.rootModelId)).size !==
    canonicalAggregateBoundaries.length
  )
    return false;
  if (!canonicalAggregateBoundaries.every((boundary) => familyIds.has(boundary.familyId)))
    return false;
  if (
    !canonicalAggregateBoundaries.every(
      (boundary) =>
        boundary.state === 'frozen' &&
        boundary.writeAuthority &&
        boundary.transactionRule &&
        boundary.invariants.length > 0
    )
  )
    return false;
  if (
    canonicalAggregateFreezeSummary.frozenAggregateBoundaryCount !==
    canonicalAggregateBoundaries.length
  )
    return false;

  const owned = canonicalAggregateBoundaries.flatMap((boundary) =>
    boundary.ownedMembers.map((member) => [member, boundary.id] as const)
  );
  const projections = canonicalAggregateBoundaries.flatMap((boundary) =>
    boundary.projections.map((projection) => [projection, boundary.id] as const)
  );
  if (new Set(owned.map(([member]) => member)).size !== owned.length) return false;
  if (new Set(projections.map(([projection]) => projection)).size !== projections.length)
    return false;
  if (
    owned.some(([member]) =>
      canonicalAggregateBoundaries.some((boundary) => boundary.rootModelId === member)
    )
  )
    return false;
  if (
    projections.some(
      ([projection]) =>
        canonicalAggregateBoundaries.some((boundary) => boundary.rootModelId === projection) ||
        owned.some(([member]) => member === projection)
    )
  )
    return false;

  if (Object.keys(refinementAggregateOwnership).length !== refinementIds.size) return false;
  if (
    ![...refinementIds].every(
      (id) => refinementAggregateOwnership[id] && aggregateIds.has(refinementAggregateOwnership[id])
    )
  )
    return false;
  if (!Object.keys(refinementAggregateOwnership).every((id) => refinementIds.has(id))) return false;
  if (Object.keys(activityDrivenAggregateOwnership).length !== 75) return false;
  if (
    !Object.entries(activityDrivenAggregateOwnership).every(([modelId, aggregateId]) => {
      const aggregate = canonicalAggregateBoundaries.find(
        (boundary) => boundary.id === aggregateId
      );
      return aggregate?.rootModelId === modelId;
    })
  )
    return false;

  return true;
}
