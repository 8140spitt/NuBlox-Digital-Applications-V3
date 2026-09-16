import fs from 'node:fs';
import path from 'node:path';

const families = [
  ['BOF-01', 'Tenant, identity, party and enterprise structure', 'Tenant; Party; Person; Organisation; Legal Entity; Enterprise Group; Organisation Unit; Division; Branch; Office; Team; Membership; User Identity; Contact Point; Address; Party Relationship; Ownership Relationship; Role Assignment; Delegated Authority; External Identifier'],
  ['BOF-02', 'Strategy, governance and enterprise performance', 'Strategy Framework; Strategic Objective; Strategic Theme; Strategic Initiative; Business Plan; Scenario; Assumption; KPI Definition; Target; Performance Observation; Performance Snapshot; Strategic Review; Governance Body; Meeting; Agenda Item; Decision; Action; Policy; Authority Framework; Governance Record'],
  ['BOF-03', 'Market, CRM, business development and customer', 'Market Insight; Market Segment; Account Relationship; Account Plan; Interaction; Activity; Lead; Opportunity; Pursuit; Bid/No-Bid Decision; Pipeline Snapshot; Forecast Snapshot; Customer Onboarding; Customer Case; Complaint; Customer Relationship; Service Relationship'],
  ['BOF-04', 'Land, development, investment and property acquisition', 'Development Opportunity; Investment Case; Business Case; Development Appraisal; Option; Site Appraisal; Land Parcel; Property Interest; Ownership Interest; Occupation Interest; Constraint; Valuation; Survey; Planning Application; Consent; Planning Condition; Planning Obligation; Funding Evidence; Grant Evidence'],
  ['BOF-05', 'Estimating, measurement, tendering, proposals and sales', 'Enquiry; Invitation to Tender; Estimate; Estimate Version; Estimate Breakdown Item; Take-off; Measurement Item; Resource Build-up; Rate; Preliminaries; Allowance; Contingency; Tender Package; Supplier Enquiry; Subcontract Enquiry; Quote Return; Bid Return; Comparison; Tender Adjudication; Proposal; Quotation; Sales Order; Acceptance'],
  ['BOF-06', 'Portfolio, programme, project and project controls', 'Portfolio; Programme; Project; Job; Project Charter; Phase; Stage; WBS Element; Work Package; Task; Activity; Milestone; Schedule; Schedule Baseline; Dependency; Progress Record; Resource Requirement; Resource Allocation; Project Participant; Responsibility Assignment; Project Risk; Issue; Decision; Action; Constraint; Change Request; Status Report; Gate Review; Handover; Closure'],
  ['BOF-07', 'Design, engineering, BIM and information management', 'Information Requirement; Project Information Requirement; Asset Information Requirement; Deliverable; Responsibility Assignment; Information Delivery Plan; Information Container; Document; Drawing; Model; Specification; Technical Schedule; Calculation; Technical Evidence; Revision; Issue; Transmittal; Distribution; RFI; Technical Query; Submittal; Response; Design Review; Review Comment; Coordination Issue; Clash Issue; Design Change; Survey Input; Design Input; Markup; Handover Information Deliverable'],
  ['BOF-08', 'Contract, appointment and commercial management', 'Appointment; Contract; Subcontract; Framework Agreement; Contract Party Role; Contract Clause; Obligation; Key Date; Notice; Correspondence; Commercial Package; Procurement Package; Instruction; Change; Variation; Compensation Event; Quotation for Change; Entitlement; Claim; Application for Payment; Valuation; Assessment; Certificate; Pay-less Record; Withholding Record; Retention; Bond; Guarantee; Insurance Evidence; Daywork Record; Final Account'],
  ['BOF-09', 'Procurement, supplier and subcontract sourcing', 'Supplier Relationship; Supplier Qualification; Approved Supplier Status; Procurement Strategy; Procurement Plan; Procurement Package; Requisition; Sourcing Event; RFQ; RFP; Invitation; Bid Response; Tender Response; Evaluation; Comparison; Award; Purchase Order; Purchase Order Line; Call-off; Delivery Schedule; Subcontract Commitment; Order Amendment; Goods Receipt; Service Receipt; Supplier Performance Review; Supplier Risk; Supplier Dispute; Sourcing Evidence'],
  ['BOF-10', 'Product, material, catalogue, inventory and logistics', 'Product Item; Material Item; Service Item; Item Specification; Variant; Substitution Relationship; Manufacturer Relationship; Supplier-Item Relationship; Catalogue; Price List; Commercial Rate; Unit of Measure; BOM; Assembly; Lot; Batch; Serial Identity; Warehouse; Store; Bin Location; Reservation; Inventory Movement; Material Issue; Material Return; Stock Transfer; Stock Count; Inventory Adjustment; Quarantine; Pick; Pack; Shipment; Transport Order; Delivery; Site Logistics Booking; Call-off; Trade Declaration; Import Declaration; Export Declaration'],
  ['BOF-11', 'Manufacturing, fabrication and off-site production', 'Manufactured Product Definition; Bill of Material; Routing; Process Plan; Work Centre; Production Plan; Production Order; Production Operation; Production Batch; Production Lot; Capacity Plan; Shop-floor Progress Event; Production Quality Record; Production Traceability Record; Scrap Record; Waste Record; As-manufactured Configuration; Production Cost Evidence'],
  ['BOF-12', 'Site, field and construction operations', 'Site; Phase; Zone; Work Area; Site Establishment Record; Mobilisation Record; Access Record; Daily Diary; Field Progress Record; Labour Record; Plant Usage; Material Usage; Delivery Record; Temporary Works Item; Temporary Works Design; Temporary Works Check; Permit to Work; Isolation; Work Instruction; Field Constraint; Field Form; Photographic Evidence; Geospatial Evidence; Site Action; Completion Record; Handover Readiness Record'],
  ['BOF-13', 'Quality, health, safety, environment and assurance', 'Quality Plan; Inspection and Test Plan; Inspection; Test; Hold Point; Witness Point; Nonconformance Report; Defect; Snag; Corrective Action; Preventive Action; CAPA; Audit; Assurance Review; Calibration Record; Quality Certificate; Hazard; Risk Assessment; Method Statement; RAMS; Permit; Isolation; Induction; Briefing; Toolbox Talk; Observation; Near Miss; Incident; Investigation; Cause; Statutory Inspection; Compliance Requirement; Compliance Register; Environmental Aspect; Environmental Impact; Pollution Event; Waste Consignment'],
  ['BOF-14', 'Building safety, regulatory control and statutory assurance', 'Dutyholder Assignment; Competence Evidence; Regulator Case; Regulatory Application; Building Control Application; Controlled Change Record; Regulatory Inspection; Regulatory Finding; Mandatory Occurrence; Statutory Notice; Regulatory Decision; Completion Evidence; Completion Certificate; Golden Thread Record; Regulatory Submission'],
  ['BOF-15', 'Commissioning, completion, handover and closeout', 'Commissioning Plan; Commissioning System; Commissioning Activity; Witness Requirement; Test Result; Inspection Result; Balancing Record; Commissioning Defect; Retest; Readiness Record; Commissioning Certificate; Handover Package; Operations and Maintenance Information; Training Record; Briefing Record; Completion Certificate; Handover Acceptance; Asset Information Delivery; Closeout Evidence'],
  ['BOF-16', 'Property, estate, space, infrastructure and physical asset', 'Estate; Network; Site; Land; Property; Facility; Building; Infrastructure Entity; Level; Zone; Space; Linear Segment; Linear Reference; System; Subsystem; Asset; Component; Maintainable Item; Plant; Equipment; Vehicle; Tool; Asset Type; Asset Model; Meter; Sensor; Condition Point; Warranty; Condition Assessment; Lifecycle Status; Installed-base Relationship'],
  ['BOF-17', 'Maintenance, facilities, service, warranty and aftercare', 'Maintenance Strategy; Maintenance Plan; Task Template; Maintenance Schedule; Work Order; Service Request; Service Case; Service Contract; Entitlement; SLA; Service Appointment; Dispatch; Field Visit; Maintenance Inspection; Failure; Defect; Service History; Parts Consumption; Warranty Claim; Defects Liability Period; Aftercare Period; Service Quote; Service Acceptance; Occupancy Record; Lease Relationship; Licence Relationship; Facilities Request; Soft FM Service; Utility Account; Utility Consumption; Lifecycle Replacement Plan'],
  ['BOF-18', 'People, HCM, competence, time, payroll and expenses', 'Worker Relationship; Employment; Engagement; Position; Job Profile; Reporting Relationship; Career Profile; Skill; Competency; Qualification; Licence; Card; Certification; Training Course; Training Session; Training Record; CPD Record; Workforce Plan; Availability; Shift; Work Pattern; Allocation; Attendance; Time Entry; Timesheet; Absence; Leave; Compensation; Pay Element; Payroll Calendar; Payroll Run; Payroll Result; Payslip; Expense Claim; Vacancy; Candidate; Job Application; Offer; Onboarding; Performance Review; Learning Plan; Employee Relations Case; Offboarding'],
  ['BOF-19', 'Finance, accounting, tax, treasury and enterprise performance', 'Chart of Accounts; GL Account; Financial Dimension; Cost Code; Cost Centre; Profit Centre; Accounting Period; Budget; Forecast; Journal; Journal Line; Ledger Entry; Accounting Posting; Supplier Invoice; Customer Invoice; Credit Note; Debit Note; Payable Open Item; Receivable Open Item; Payment; Receipt; Allocation; Bank Account; Bank Statement; Bank Transaction; Reconciliation; Accrual; Prepayment; Tax Code; Tax Transaction; Tax Return; Fixed Asset; Depreciation Schedule; Depreciation Run; Exchange Rate; Revaluation; Intercompany Transaction; Consolidation Run; Elimination; Close Cycle; Capex Request; Cash Forecast; Liquidity Forecast; Treasury Facility; Treasury Deal; Controlled Reporting Snapshot'],
  ['BOF-20', 'Sustainability, carbon, energy, circularity and social value', 'Carbon Methodology; Carbon Factor Source; Carbon Baseline; Carbon Budget; Carbon Target; Carbon Assessment; Embodied Carbon Item; Operational Energy Record; Operational Carbon Record; Utility Consumption; Waste Stream; Recovery Record; Reuse Record; Circularity Assessment; Environmental Product Declaration; Material Provenance; Responsible Procurement Assessment; Biodiversity Measure; Environmental Measure; Social Value Commitment; Social Value Evidence; Social Value Outcome; Climate Risk; Resilience Risk; Cost-Carbon Option Assessment'],
  ['BOF-21', 'Enterprise risk, compliance, internal control and audit', 'Risk Framework; Enterprise Risk; Risk Assessment; Treatment Plan; Regulatory Obligation; Compliance Requirement; Compliance Assessment; Internal Control; Control Test; Assurance Plan; Audit Plan; Audit Engagement; Audit Finding; Remediation Action; Fraud Case; Conduct Case; Compliance Evidence'],
  ['BOF-22', 'Legal, corporate secretariat, privacy and records obligations', 'Legal Matter; Advice Request; Legal Obligation; Statutory Filing; Intellectual Property Asset; Dispute; Litigation; Regulatory Matter; Legal Hold; eDiscovery Collection; Privacy Policy; Privacy Framework; Processing Activity; DPIA; Consent Evidence; Preference Evidence; Data Subject Request; Privacy Breach; Privacy Incident; International Transfer; Privacy Assurance Review'],
  ['BOF-23', 'Business continuity, crisis and physical security', 'Business Impact Assessment; Continuity Strategy; Continuity Plan; Continuity Exercise; Crisis; Emergency Event; Crisis Action; Crisis Communication; Disaster Recovery Invocation; Physical Security Zone; Visitor Pass; Access Pass; Physical Security Incident; Travel Risk Assessment; Security Risk Assessment'],
  ['BOF-24', 'IT, data, cyber, analytics and AI', 'Technology Service; Application Service; Architecture Decision; Infrastructure Resource; Cloud Resource; Endpoint; Identity Account; IT Service Request; IT Incident; Problem; IT Change Request; Release; Configuration Item; IT Asset; Disaster Recovery Plan; Data Domain; Data Product; Dataset; Reference Dataset; Data Quality Rule; Data Quality Issue; Data Pipeline; Report Definition; Dashboard Definition; Analytical Model; AI Use Case; AI Model; AI Risk Assessment; Data Access Request; Security Policy; Privileged Access Request; Vulnerability; Patch Campaign; Security Alert; Security Incident; Threat Intelligence; Penetration Test; Security Finding'],
  ['BOF-25', 'Knowledge, document/records management, communications and stakeholder engagement', 'Knowledge Article; Knowledge Collection; Controlled Document; Information Container; Declared Record; Record Series; Record File; Retention Schedule; Disposition Request; Lesson Learned; Communications Plan; Communication Item; Media Enquiry; Media Release; Statement; PR Campaign; Reputation Issue; Public Affairs Issue; Investor Engagement; Annual Report; Stakeholder Engagement Plan'],
  ['BOF-26', 'Organisation change, transformation and continuous improvement', 'Transformation Portfolio; Transformation Initiative; Change Impact Assessment; Stakeholder Group; Change Action; Change Communication; Readiness Plan; Training Plan; Readiness Assessment; Adoption Intervention; Organisation Transition; Process Architecture; Enterprise Process; Process Model; Process Version; Process Owner Assignment; Process Measure; Process Analysis; Improvement Opportunity; Redesign Proposal; Standard Operating Procedure; Process Compliance Assessment; Improvement Initiative'],
  ['BOF-27', 'Shared work, workflow, decision and collaboration', 'Work Item; Assignment; Review Request; Approval Request; Decision Request; Acknowledgement; Escalation; Due Date Record; Priority Record; Delegation; Collaboration Invitation; Project Participation Invitation; External Submission; Response; Notification Preference'],
  ['BOF-28', 'Evidence, audit, retention and legal traceability', 'Business Event; Audit Event; Change Event; Approval Evidence; Signature; Attestation; Evidence Item; Provenance Reference; Source Reference; Correction Record; Reversal Record; Archive Package; Retention Disposition; Legal Hold Link; Immutable Outbox Event'],
  ['BOF-29', 'Reference data, classification and jurisdiction configuration', 'Jurisdiction; Currency; Exchange Rate Source; Unit of Measure; Calendar; Fiscal Calendar; Numbering Scheme; Tax Regime; Tax Code; Classification System; Classification Release; Classification Code; Uniclass Reference; Contract Form Family; Contract Template; Lifecycle Definition; Lifecycle State Definition; Workflow Definition; Workflow Template; Status Code; Suitability Code; Document Type; Project Stage Definition; Retention Rule; Approval Authority Rule; Delegated Authority Rule; Permission Definition; Role Definition; Location Classification; Asset Classification; Cost Classification; Work Classification; Resource Classification; Regulatory Regime; Evidence Type; Record Type; Data Retention Class']
];

const semanticKind = (name) => {
  const n = name.toLowerCase();
  if (/(relationship|assignment|membership|interest|participation|allocation|delegation|entitlement|sla)/.test(n)) return 'relationship';
  if (/(invoice|payment|receipt|order|requisition|quotation|award|call-off|application for payment|valuation|journal|transaction|credit note|debit note|posting|accrual|prepayment|transfer)/.test(n)) return 'transaction';
  if (/(case|complaint|incident|dispute|litigation|problem|finding|breach|claim|nonconformance)/.test(n)) return 'case';
  if (/(plan|strategy|schedule|budget|forecast|baseline|framework|programme)/.test(n)) return 'plan';
  if (/(document|drawing|model|specification|calculation|policy|procedure|information container|record|report|statement|submission|transmittal|deliverable|briefing|method statement|ram)/.test(n)) return 'controlled information';
  if (/(work order|work package|production order|inspection|test|activity|task|work item|field visit|dispatch|operation)/.test(n)) return 'work / execution';
  if (/(asset|building|facility|property|site|system|equipment|vehicle|tool|plant|meter|sensor|component|estate|network|space|land|infrastructure)/.test(n)) return 'asset / technical object';
  if (/(event|observation|reading|usage|evidence|result|attestation|signature|history|movement|occurrence)/.test(n)) return 'event / evidence';
  if (/(ledger entry|accounting posting|open item)/.test(n)) return 'ledger / posting';
  if (/(currency|unit of measure|classification|code|jurisdiction|calendar|regime|release|stage definition|evidence type|record type)/.test(n)) return 'reference / classification';
  if (/(rule|definition|template|numbering scheme|authority framework)/.test(n)) return 'configuration / policy';
  if (/(snapshot|kpi|measure|rate|assessment|analysis)/.test(n)) return 'projection / measure';
  if (/(supplier|customer|worker|employment|engagement|role|contact|ownership|occupation)/.test(n)) return 'relationship';
  return 'master / identity';
};

const csv = (value) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const rows = [];
const exactNameIndex = new Map();
for (const [familyId, familyName, objectList] of families) {
  const names = objectList.split(';').map((x) => x.trim()).filter(Boolean);
  names.forEach((name, index) => {
    const row = {
      candidate_key: `${familyId}-${String(index + 1).padStart(3, '0')}`,
      family_id: familyId,
      family_name: familyName,
      canonical_name: name,
      semantic_kind: semanticKind(name),
      maturity: 'candidate',
      source: 'construction-and-built-environment.md + canonical-business-object-discovery.md'
    };
    rows.push(row);
    const key = name.toLowerCase();
    exactNameIndex.set(key, [...(exactNameIndex.get(key) ?? []), row]);
  });
}

const duplicates = [...exactNameIndex.entries()]
  .filter(([, occurrences]) => occurrences.length > 1)
  .sort(([a], [b]) => a.localeCompare(b));

const headers = ['candidate_key', 'family_id', 'family_name', 'canonical_name', 'semantic_kind', 'maturity', 'source'];
const registerCsv = [headers.join(','), ...rows.map((row) => headers.map((h) => csv(row[h])).join(','))].join('\n') + '\n';
const duplicateCsv = [
  'canonical_name,occurrence_count,families,candidate_keys,review_action',
  ...duplicates.map(([name, occurrences]) => [
    occurrences[0].canonical_name,
    occurrences.length,
    occurrences.map((x) => x.family_id).join(' | '),
    occurrences.map((x) => x.candidate_key).join(' | '),
    'normalize to one canonical concept or explicitly distinguish semantics'
  ].map(csv).join(','))
].join('\n') + '\n';

const kindCounts = new Map();
for (const row of rows) kindCounts.set(row.semantic_kind, (kindCounts.get(row.semantic_kind) ?? 0) + 1);

const familySummary = families.map(([familyId, familyName, objectList]) => {
  const count = objectList.split(';').map((x) => x.trim()).filter(Boolean).length;
  return `| ${familyId} | ${familyName} | ${count} |`;
}).join('\n');

const kindSummary = [...kindCounts.entries()].sort((a, b) => b[1] - a[1]).map(([kind, count]) => `| ${kind} | ${count} |`).join('\n');

const summary = `# Canonical Business Object Candidate Register — Generated Summary\n\n**Generated from:** scripts/generate-business-object-register.mjs  \n**Status:** discovery baseline — not yet canonical schema authority  \n\n## Baseline counts\n\n- Candidate object occurrences: **${rows.length}**\n- Exact unique names: **${exactNameIndex.size}**\n- Exact duplicate-name groups requiring normalization: **${duplicates.length}**\n- Business-object discovery families: **${families.length}**\n\nA repeated name across families is not automatically an error. It is a signal to decide whether the same canonical object is reused across contexts or whether the meanings are genuinely distinct and require different names.\n\n## Candidate counts by family\n\n| Family | Discovery family | Candidates |\n| --- | --- | ---: |\n${familySummary}\n\n## Provisional semantic classification\n\nThe semantic kind is generated heuristically to accelerate review; it is **not** authoritative until validated.\n\n| Semantic kind | Count |\n| --- | ---: |\n${kindSummary}\n\n## Review sequence\n\n1. Normalize duplicate names and obvious aliases.\n2. Separate root identities from children, relationships, events, versions and projections.\n3. Establish the core identity graph: party/person/organisation, enterprise structure, project/programme, spatial/location, contract, information container, product/material and physical asset.\n4. Define lifecycle and version semantics by object family rather than using one universal status model.\n5. Map each surviving object to F01–F29 workspaces, whole-life lifecycle stages and end-to-end process chains.\n6. Validate permissions, delegated authority, audit/evidence, retention and commercial/accounting consequences.\n7. Promote only reviewed concepts from **candidate** to **validated** and then **canonical**.\n`;

const root = process.cwd();
const target = path.join(root, 'docs', 'data-model');
fs.mkdirSync(target, { recursive: true });
fs.writeFileSync(path.join(target, 'canonical-business-object-register.csv'), registerCsv);
fs.writeFileSync(path.join(target, 'canonical-business-object-duplicates.csv'), duplicateCsv);
fs.writeFileSync(path.join(target, 'canonical-business-object-summary.md'), summary);

console.log(`Generated ${rows.length} candidate occurrences across ${families.length} families.`);
console.log(`${exactNameIndex.size} exact unique names; ${duplicates.length} duplicate-name groups require review.`);
