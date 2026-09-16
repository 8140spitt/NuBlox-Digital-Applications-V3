# NuBlox V3 Canonical Business Object Discovery Programme

**Status:** Governing discovery programme  
**Scope:** NuBlox Construction & the Built Environment ERP / operating platform  
**Primary sector source:** `NuBlox-Digital-Applications/docs/construction-and-built-environment.md`  
**Purpose:** establish the complete canonical business-object universe before further domain implementation, workflow design or workspace expansion.

## 1. Product decision

NuBlox V3 will be designed **business-object first**.

The 29 enterprise functions are tenant workspaces. They do not own duplicate copies of business truth. A business object may be created, viewed, changed or acted on from several workspaces, but there is one canonical identity and one authoritative ownership model for that business concept.

Before materially expanding application functionality, V3 must establish:

1. the canonical business objects required to operate a sophisticated construction and built-environment enterprise;
2. the relationships between those objects;
3. which apparent concepts are roles, classifications, states, lines, versions, events or projections rather than independent root objects;
4. object identity and numbering rules;
5. object scope: tenant, legal entity, organisation unit, project/programme, contract, asset, property, site or other context;
6. ownership and write authority;
7. lifecycle semantics where applicable;
8. revision/version/iteration semantics where applicable;
9. permissions and delegated-authority implications;
10. evidence, audit and retention requirements;
11. cross-workspace usage;
12. accounting, commercial, operational and information consequences;
13. external identifiers and interoperability boundaries.

No screen, route, table or API becomes the definition of a business object merely because it was implemented first.

## 2. What counts as a business object

A **business object** is an identifiable business concept whose state, relationships or evidence matters independently to the enterprise.

Business objects are not synonymous with database tables.

NuBlox must distinguish at least these semantic kinds:

| Kind | Meaning | Examples |
| --- | --- | --- |
| Master / identity | relatively durable identity used by many processes | party, organisation, person, asset, property, material item |
| Relationship | governed relationship between canonical identities | supplier relationship, customer relationship, employment, project participation, ownership interest |
| Transaction | economically or operationally meaningful commitment/event | purchase order, invoice, payment, goods receipt, quotation |
| Case | a matter requiring investigation/resolution | complaint, NCR, incident, legal matter, service case |
| Plan | an approved or working intended future state | business plan, programme, maintenance plan, procurement plan |
| Controlled information | governed information with revision/status/issue semantics | drawing, specification, model, calculation, policy |
| Work / execution | authorised work to be performed | work package, production order, work order, inspection |
| Asset / technical object | long-lived physical or logical thing with operational history | building, system, asset, equipment, vehicle, tool |
| Event / evidence | attributable occurrence or evidence, commonly append-only | inspection result, meter reading, goods movement, audit event |
| Ledger / posting | immutable or controlled financial/commercial recognition | journal entry, cost posting, receivable/payable open item |
| Reference / classification | governed code set or external/reference semantics | currency, UOM, Uniclass release, tax code, jurisdiction |
| Configuration / policy | tenant-governed rule affecting behaviour | numbering rule, approval authority, retention rule, lifecycle definition |
| Projection / measure | derived view, not primary truth unless frozen as an approved snapshot | stock balance, CVR position, KPI result, dashboard measure |

The classification is semantic. One implementation may require several relational tables to represent one business object, while some tables will represent children, links, history or projections rather than business objects.

## 3. Non-negotiable modelling rules

### 3.1 One real concept, one canonical identity

Do not create duplicate masters because different workspaces use different terminology.

Examples:

- one organisation can simultaneously have customer, prospect, supplier, subcontractor, consultant, regulator and project-participant relationships;
- one person can be a user, worker, project participant, competent person and contact through separate governed relationships;
- one physical asset can participate in project delivery, commissioning, warranty, maintenance, finance and sustainability processes without becoming separate assets.

### 3.2 Role is not identity

Customer, supplier, subcontractor, consultant, dutyholder and project participant are normally roles or relationships applied to a party/organisation/person in a defined context.

They are not automatically separate master records.

### 3.3 State is not an object

`Draft`, `Approved`, `Issued`, `In service`, `Closed` and similar values describe an object's state. They do not become independent business objects merely because workflows refer to them.

### 3.4 Work is separate from domain truth

A review task, approval assignment or corrective action can be represented by common Work Kernel semantics, but completion of that work item does not automatically mutate the authoritative domain object unless the domain transition succeeds.

### 3.5 Version is not duplicate identity

Where governed revision is required, separate:

- stable business identity;
- revision / major business version;
- iteration / working version where needed;
- representation/content version;
- lifecycle/status of the applicable version;
- supersession and effectivity.

The exact model may differ by object family. A contract, drawing, strategy, product definition and physical asset do not necessarily use identical version semantics.

### 3.6 Evidence is preserved

Material decisions, approvals, submissions, receipts, inspections, postings and corrections must preserve attributable history. Correction should normally add controlled evidence rather than erase prior business truth.

### 3.7 Derived positions are not duplicated mutable truth

Balances, stock positions, CVR positions, performance summaries and dashboards should normally derive from authoritative source records/ledgers. Freeze a snapshot only where there is a business reason to preserve an approved reporting position.

### 3.8 Classification is an overlay

Uniclass, IFC classifications, accounting structures, asset classes, cost codes and jurisdictional code sets must not replace canonical identity.

## 4. Required business-object families

The governing Construction & Built Environment model requires the object-discovery programme to cover all of the following families. These families are discovery groupings, not software modules and not substitutes for the 29 function workspaces.

### BOF-01 — Tenant, identity, party and enterprise structure

Candidate root concepts include tenant, party, person, organisation, legal entity, enterprise group, organisation unit, division, branch, office, team, membership, user identity, contact point, address, party relationship, ownership relationship, role assignment, delegated authority and external identifier.

### BOF-02 — Strategy, governance and enterprise performance

Strategy framework, strategic objective, strategic theme, strategic initiative, business plan, scenario, assumption, KPI definition, target, performance observation/snapshot, strategic review, governance body, meeting, agenda item, decision, action, policy, authority framework and governance record.

### BOF-03 — Market, CRM, business development and customer

Market insight, segment, account relationship, account plan, interaction/activity, lead, opportunity, pursuit, bid/no-bid decision, pipeline/forecast snapshot, customer onboarding, customer case, complaint and customer/service relationship.

### BOF-04 — Land, development, investment and property acquisition

Development opportunity, investment/business case, development appraisal, option, site appraisal, land parcel, property interest, ownership/occupation interest, constraint, valuation, survey, planning application, consent, planning condition, obligation and funding/grant evidence.

### BOF-05 — Estimating, measurement, tendering, proposals and sales

Enquiry/ITT, estimate, estimate version, estimate breakdown item, take-off, measurement item, resource build-up, rate, preliminaries, allowance/contingency, tender package, supplier/subcontract enquiry, quote/bid return, comparison, tender adjudication, proposal, quotation, sales order and acceptance.

### BOF-06 — Portfolio, programme, project and project controls

Portfolio, programme, project/job, project charter, phase/stage, WBS element, work package, task/activity, milestone, schedule, schedule baseline, dependency, progress record, resource requirement/allocation, participant/responsibility assignment, project risk, issue, decision, action, constraint, change request, status report, gate review, handover and closure.

### BOF-07 — Design, engineering, BIM and information management

Information requirement, project/asset information requirement, deliverable, responsibility assignment, information-delivery plan, information container, document, drawing, model, specification, technical schedule, calculation, technical evidence, revision/issue, transmittal, distribution, RFI, technical query, submittal, response, design review, review comment, coordination issue, clash/issue, design change, survey/design input, markup and handover information deliverable.

### BOF-08 — Contract, appointment and commercial management

Appointment, contract, subcontract, framework agreement, contract party role, contract clause, obligation, key date, notice, correspondence, commercial/procurement package, instruction, change/variation/compensation event, quotation for change, entitlement/claim, application for payment, valuation, assessment, certificate, pay-less/withholding record, retention, bond, guarantee, insurance evidence, daywork record and final account.

### BOF-09 — Procurement, supplier and subcontract sourcing

Supplier relationship, supplier qualification, approved status, procurement strategy/plan, procurement package, requisition, sourcing event, RFQ/RFP, invitation, bid/tender response, evaluation/comparison, award, purchase order, order line, call-off, delivery schedule, subcontract commitment, order amendment, goods/service receipt, supplier performance review, supplier risk, dispute and sourcing evidence.

### BOF-10 — Product, material, catalogue, inventory and logistics

Product/material/service item, item specification, variant, substitution relationship, manufacturer relationship, supplier-item relationship, catalogue, price list, commercial rate, UOM, BOM/assembly, lot, batch, serial identity, warehouse, store, bin/location, reservation, inventory movement, issue, return, transfer, stock count, adjustment, quarantine, pick, pack, shipment, transport order, delivery, site logistics booking, call-off and trade/import/export declaration.

### BOF-11 — Manufacturing, fabrication and off-site production

Manufactured product definition, BOM, routing/process plan, work centre, production plan, production order, production operation, production batch/lot, capacity plan, shop-floor progress event, quality/traceability record, scrap/waste record, as-manufactured configuration and production cost evidence.

### BOF-12 — Site, field and construction operations

Site, phase, zone, work area, site establishment/mobilisation record, access record, daily diary, field progress record, labour record, plant usage, material usage, delivery record, temporary-works item, temporary-works design/check, permit to work, isolation, work instruction, field constraint, field form, photographic/geospatial evidence, site action, completion record and handover-readiness record.

### BOF-13 — Quality, health, safety, environment and assurance

Quality plan, ITP, inspection, test, hold/witness point, NCR, defect, snag, CAPA, audit, assurance review, calibration record, quality certificate, hazard, risk assessment, method statement/RAMS, permit, isolation, induction, briefing/toolbox talk, observation, near miss, incident, investigation, cause, statutory inspection, compliance requirement/register, environmental aspect, environmental impact, pollution event, waste consignment and corrective action.

### BOF-14 — Building safety, regulatory control and statutory assurance

Dutyholder assignment, competence evidence, regulator case/application, building-control application, controlled-change record, inspection/finding, mandatory occurrence, statutory notice, regulatory decision, completion evidence/certificate, golden-thread record and jurisdiction-specific regulatory submission.

### BOF-15 — Commissioning, completion, handover and closeout

Commissioning plan, commissioning system, commissioning activity, witness requirement, test/inspection result, balancing record, commissioning defect/retest, readiness record, commissioning certificate, handover package, O&M information, training/briefing record, completion certificate, handover acceptance, asset-information delivery and closeout evidence.

### BOF-16 — Property, estate, space, infrastructure and physical asset

Estate/network, site, land/property, facility, building/infrastructure entity, level, zone, space, linear segment/reference, system, subsystem, asset, component, maintainable item, plant, equipment, vehicle, tool, asset type/model, meter, sensor, condition point, warranty, condition assessment, lifecycle status and installed-base relationship.

### BOF-17 — Maintenance, facilities, service, warranty and aftercare

Maintenance strategy, maintenance plan, task template, maintenance schedule, work order, service request/case, service contract, entitlement/SLA, appointment, dispatch, field visit, maintenance inspection, failure/defect, service history, parts consumption, warranty claim, defects-liability/aftercare period, service quote, service acceptance, occupancy record, lease/licence relationship, facilities request, soft-FM service, utility account/consumption and lifecycle replacement plan.

### BOF-18 — People, HCM, competence, time, payroll and expenses

Worker relationship, employment/engagement, position, job profile, reporting relationship, career/profile, skill, competency, qualification, licence, card/certification, training course/session, training record, CPD record, workforce plan, availability, shift/work pattern, allocation, attendance, time entry, timesheet, absence/leave, compensation, pay element, payroll calendar/run/result, payslip, expense claim, vacancy, candidate, application, offer, onboarding, performance review, learning plan, employee-relations case and offboarding.

### BOF-19 — Finance, accounting, tax, treasury and enterprise performance

Chart of accounts, GL account, financial dimension, cost code, cost centre, profit centre, accounting period, budget, forecast, journal, journal line, ledger entry/posting, supplier invoice, customer invoice, credit/debit note, payable/receivable open item, payment, receipt, allocation, bank account, bank statement/transaction, reconciliation, accrual, prepayment, tax code, tax transaction/return, fixed asset, depreciation schedule/run, exchange rate, revaluation, intercompany transaction, consolidation run, elimination, close cycle, capex request, cash/liquidity forecast, treasury facility/deal and controlled reporting snapshot.

### BOF-20 — Sustainability, carbon, energy, circularity and social value

Carbon methodology/factor source, carbon baseline, carbon budget, target, carbon assessment, embodied-carbon item, operational-energy/carbon record, utility consumption, waste stream, recovery/reuse record, circularity assessment, environmental product declaration, material provenance, responsible-procurement assessment, biodiversity/environmental measure, social-value commitment, social-value evidence/outcome, climate/resilience risk and cost-carbon option assessment.

### BOF-21 — Enterprise risk, compliance, internal control and audit

Risk framework, risk, risk assessment, treatment plan, regulatory obligation, compliance requirement/assessment, internal control, control test, assurance plan, audit plan, audit engagement, audit finding, remediation action, fraud/conduct case and compliance evidence.

### BOF-22 — Legal, corporate secretariat, privacy and records obligations

Legal matter, advice request, legal obligation, statutory filing, intellectual-property asset, dispute/litigation, regulatory matter, legal hold, eDiscovery collection, privacy policy/framework, processing activity, DPIA, consent/preference evidence, data-subject request, privacy breach/incident, international transfer and privacy assurance review.

### BOF-23 — Business continuity, crisis and physical security

Business-impact assessment, continuity strategy/plan, continuity exercise, crisis, emergency event, crisis action/communication, disaster-recovery invocation, physical-security zone, visitor/access pass, physical-security incident and travel/security risk assessment.

### BOF-24 — IT, data, cyber, analytics and AI

Technology/application service, architecture decision, infrastructure/cloud resource, endpoint, identity account, IT service request, incident, problem, change request, release, configuration item, IT asset, DR plan, data domain, data product/dataset, reference dataset, data-quality rule/issue, data pipeline, report/dashboard definition, analytical model, AI use case, AI model, AI risk assessment, data access request, security policy, privileged-access request, vulnerability, patch campaign, security alert/incident, threat intelligence, penetration test and security finding.

### BOF-25 — Knowledge, document/records management, communications and stakeholder engagement

Knowledge article, knowledge collection, controlled document/information container, declared record, record series/file, retention schedule, disposition request, lesson learned, communications plan, communication item, media enquiry, release/statement, PR campaign, reputation issue, public-affairs issue, investor engagement, annual report and stakeholder-engagement plan.

### BOF-26 — Organisation change, transformation and continuous improvement

Transformation portfolio/initiative, change-impact assessment, stakeholder group, change action, change communication, readiness/training plan, readiness assessment, adoption intervention, organisation transition, process architecture, enterprise process, process model/version, process-owner assignment, process measure, process analysis, improvement opportunity, redesign proposal, SOP, process-compliance assessment and improvement initiative.

### BOF-27 — Shared work, workflow, decision and collaboration objects

Work item/task, assignment, review request, approval request, decision request, acknowledgement, escalation, due-date/priority record, delegation, collaboration invitation, project participation invitation, external submission, response and notification preference.

These support domain execution but do not replace the state of the object being acted upon.

### BOF-28 — Evidence, audit, retention and legal traceability

Business event, audit event, change event, approval evidence, signature/attestation, evidence item, provenance/source reference, correction/reversal record, archive package, retention disposition, legal-hold link and immutable event/outbox record.

### BOF-29 — Reference data, classification and jurisdiction configuration

Jurisdiction, currency, exchange-rate source, UOM, calendar, fiscal calendar, numbering scheme, tax regime/code, classification system, classification release/code, Uniclass reference, contract-form family/template, lifecycle definition, workflow definition, authority/approval matrix, retention policy, regional configuration pack, measurement standard, carbon methodology and interoperability identifier scheme.

## 5. The discovery register must not reproduce V2 mistakes

The V2 object-template registry is discovery evidence only.

Before promoting an old candidate into the V3 canonical register, ask:

1. Is this a genuine independent business identity, or a role/relationship on another object?
2. Is this a root object, a child/line, a version, a state, an event or a projection?
3. Does it exist independently outside one function workspace?
4. What creates it and what consumes it?
5. Does it have independent lifecycle, permissions, retention or numbering?
6. Does a sector standard or contractual practice require stable identity/revision?
7. Can two old objects be unified without losing business meaning?
8. Would unification incorrectly combine concepts with different legal/accounting/technical consequences?

Examples requiring deliberate correction/validation include:

- `supplier` should normally resolve to organisation/party + supplier relationship/qualification rather than a duplicate organisation master;
- `customer` should normally resolve to organisation/party + customer/account relationship;
- `subcontractor` is a contextual commercial/project relationship, not another company master;
- project/site/asset locations need an explicit spatial model rather than arbitrary strings;
- document, drawing and model require common information-container semantics but may need specialised subtypes/representations;
- physical fixed asset, operational asset and accounting fixed-asset recognition are related but not automatically the same object;
- project change, contract change and design change are related change concepts with different authorities and consequences and must not be collapsed casually;
- a Work Kernel approval task is not the approval state of the domain object itself.

## 6. Required register fields

Every candidate canonical business object must eventually be recorded with at least:

- stable object key;
- canonical name;
- aliases / industry terminology;
- object family;
- semantic kind;
- definition and business purpose;
- authoritative owner/capability;
- owning scope;
- parent/aggregate root where applicable;
- stable identifier/numbering requirement;
- tenant/legal-entity/project/contract/asset/location scope;
- key relationships;
- lifecycle required?;
- lifecycle states/transitions reference;
- version/revision/iteration required?;
- effectivity/applicability rules;
- permissions/actions;
- delegated-authority/value-limit implications;
- segregation-of-duties implications;
- evidence/audit requirements;
- retention/legal-hold implications;
- accounting/commercial consequences;
- information/document consequences;
- reporting grain and key measures;
- classification/reference-data overlays;
- jurisdiction overlays;
- external identifiers/integration mappings;
- workspaces that create/use the object;
- source requirements/evidence;
- maturity: candidate / validated / canonical / implemented / proven.

## 7. Coverage method

Object discovery will be performed against five independent lenses so that the model is not biased by a single taxonomy:

1. **Sector lifecycle:** Market → Lead → Opportunity → Bid → Estimate → Proposal → Quote → Contract → Design → Plan → Procure → Produce → Construct → Control → Invoice → Account → Handover → Operate → Maintain → Refurbish → Dispose.
2. **29 enterprise function workspaces:** every L2/L3 activity must map to the objects it creates, reads, changes or governs.
3. **Construction & Built Environment specialist overlays:** development, design, engineering, commercial management, contracting, trades, manufacturing, infrastructure, property/FM, retrofit, regulation and heritage.
4. **End-to-end process chains:** market-to-contract, estimate-to-project-control, design-to-approved-information, procure-to-pay, plan-to-perform, change-to-commercial-position, valuation-to-cash, supplier-progress-to-payment, incident/defect/NCR-to-resolution, commissioning-to-operation, service-request-to-resolution, asset-to-retirement, hire-to-retire and record-to-report.
5. **External benchmark/reference models:** Windchill, major ERP/EAM/project/commercial systems and applicable standards are used to challenge completeness and semantics, never as automatic schema authority.

A business-object family is not considered complete until all five lenses have been checked.

## 8. Immediate programme sequence

1. Build the machine-readable **candidate object register** from this family map, the governing sector model, the F01–F29 taxonomy and V2 discovery evidence.
2. Deduplicate aliases and convert false masters into relationships/subtypes where appropriate.
3. Establish the core identity graph first: party/person/organisation, enterprise structure, location/spatial context, project/programme, contract, information container and asset/product identities.
4. Establish shared relationship patterns and scope semantics.
5. Define object identity vs version/iteration/history rules by family.
6. Map every object to the 29 workspaces that create/use/govern it.
7. Map every object to whole-life lifecycle stages and end-to-end processes.
8. Validate finance/commercial consequences and information/evidence consequences.
9. Validate sector overlays and standards.
10. Only then promote objects from `candidate` to `canonical` and begin physical schema implementation.

## 9. Development hold

Until the initial canonical object register and core identity/relationship model are reviewed, avoid broad horizontal application expansion.

The current F01.01 slice is useful as a learning prototype, but it must not establish platform-wide object, workflow or versioning patterns by accident.

The next implementation authority is the canonical business-object register, not the existing screen structure.
