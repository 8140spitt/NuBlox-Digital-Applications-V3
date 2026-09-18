# Canonical Data Model

This directory governs the NuBlox V3 canonical information model.

## Governing artefacts

- `canonical-business-object-discovery.md` — discovery method, modelling rules and the 29 business-object families.
- `canonical-business-object-register.csv` — generated machine-readable candidate-object register.
- `canonical-business-object-duplicates.csv` — exact duplicate-name review queue used to normalize cross-domain concepts.
- `canonical-business-object-summary.md` — generated counts and review sequence.
- `canonical-business-object-normalization-review.md` — first semantic recommendations for duplicate/alias normalization.
- `canonical-model-convergence-audit.md` — machine-checkable convergence and five-lens coverage gate across all 29 discovery families.
- `foundation-canonicalization-baseline.md` — reviewed first-pass decisions for the foundation identity spine.
- `foundation-object-semantics.md` — governed identity, scope, lifecycle, versioning and relationship semantics for the foundation objects.
- `authority-participation-model.md` — governed authentication, membership, role, responsibility and delegated-authority semantics.
- `crm-business-development-semantics.md` — governed market, Party Relationship/account context, Lead, Opportunity, Pursuit, decision, interaction, onboarding and customer-case semantics.
- `delivery-context-semantics.md` — governed Portfolio, Programme, Project, stage, WBS, work-package, schedule, baseline, progress and resource-planning semantics.
- `built-environment-spatial-physical-semantics.md` — governed Estate, Network, Site, land/property, facility/building/infrastructure, spatial, system, asset and component semantics.
- `commercial-procurement-semantics.md` — governed Contract, party-role, obligation, commercial/procurement package, change, sourcing, award, purchase-order and receipt semantics.
- `item-product-manufacturing-semantics.md` — governed Item, specification, variant, catalogue, pricing, BOM, manufacturing definition/process, Lot/Batch/Serial and as-manufactured semantics.
- `inventory-logistics-semantics.md` — governed Warehouse/Store/Bin, reservation, movement, stock-control, shipment, transport, delivery and trade-declaration semantics.
- `controlled-information-semantics.md` — governed Information Requirement, Deliverable, Information Container, revision/representation, issue/transmittal, query, review and design-change semantics.
- `asset-operations-semantics.md` — governed commissioning, handover, maintenance, Work Order, service, failure/defect, warranty, occupancy and whole-life asset-history semantics.
- `finance-accounting-semantics.md` — governed Ledger, AP/AR, settlement, tax, fixed-asset accounting, treasury, project financial-control and immutable posting semantics.
- `shared-work-evidence-semantics.md` — governed Workflow Definition/Instance, Work Item, assignment, request/decision, evidence, audit, correction/reversal, retention, legal-hold and outbox semantics.
- `reference-configuration-semantics.md` — governed reference data, classification, jurisdiction, lifecycle/workflow configuration, permission/authority policy and retention-policy semantics.
- `crm-business-development-semantics.md` — governed market, CRM, Lead, Opportunity, Pursuit, interaction, onboarding and customer-case semantics.
- `estimating-tendering-semantics.md` — governed Estimate/version, breakdown, measurement, build-up/rate, provision, tender-package, adjudication, proposal/quotation and offer-acceptance semantics.
- `people-hcm-semantics.md` — governed Person/Worker Relationship, Position/Job Profile, competence/credential, learning, workforce, time, payroll, recruitment and people-case semantics.
- `qhse-assurance-semantics.md` — governed quality planning, inspection/test, NCR/Defect/CAPA, safe-work controls, incident/investigation, compliance and environmental-assurance semantics.
- `building-safety-regulatory-semantics.md` — governed dutyholder, competence evidence, regulator case/application, controlled change, statutory inspection/finding, occurrence reporting, notices, decisions, completion and golden-thread semantics.
- `sustainability-carbon-semantics.md` — governed carbon methodology/factors, baseline/budget/target, embodied and operational assessment, utility/waste/circularity, EPD/provenance, responsible procurement, biodiversity/environmental measures and social-value semantics.
- `risk-compliance-audit-semantics.md` — governed Enterprise Risk, Risk Assessment/Treatment, regulatory obligation, compliance requirement/assessment/evidence, internal control/testing, assurance planning, audit, remediation and integrity-case semantics.
- `legal-privacy-semantics.md` — governed legal matter/advice/obligation/filing/IP/dispute/proceeding, legal hold/eDiscovery, privacy framework/processing/DPIA, consent/preferences, data-subject rights, privacy incident, international-transfer and assurance semantics.
- `knowledge-records-communications-semantics.md` — governed Knowledge Article/Collection, record declaration/series/file, retention/disposition, communication planning/publication, media/external-affairs and stakeholder-engagement semantics.
- `land-development-investment-semantics.md` — governed development opportunity/business case/appraisal, land option, property-interest, valuation/survey, planning/consent/conditions/obligations and funding-evidence semantics.
- `strategy-governance-performance-semantics.md` — governed strategy framework/objectives/themes/initiatives, business planning/scenarios/assumptions, KPI/target/observation/snapshot, governance bodies/meetings and shared decision/authority semantics.
- `core-business-object-map.md` — conceptual identity and relationship backbone for stakeholder review.
- `../../scripts/generate-business-object-register.mjs` — reproducible source used to generate the register and summary.
- `../product/stakeholder-design-review-2026-09-17.md` — stakeholder review pack for the object-model baseline.

The generated register is a **discovery baseline**, not yet a physical-schema specification. Candidate objects become canonical only after semantic review, deduplication, relationship modelling, lifecycle/version review and cross-workspace/process coverage validation.

## Principles

- Business meaning is defined before physical schema design.
- Every material business object has one authoritative owner.
- The 29 enterprise functions are tenant workspaces that act on shared objects; they do not own duplicate copies of business truth.
- Shared identifiers do not imply shared write ownership.
- Authentication is not authorization; role is not identity; responsibility is not permission; permission is not delegated authority.
- Role is not identity; state is not an object; workflow work is not domain truth.
- Stable identity is separated from revision/version/iteration, representation/content, lifecycle state and effectivity where applicable.
- Lifecycle state is explicit where business rules depend on it.
- Historical and audit evidence is preserved rather than overwritten when accountability requires it.
- Tenant, organisation, project/programme, contract, property/site, asset and other relevant scopes are explicit.
- Prospect, customer and account terminology uses canonical Party/Organisation plus governed Party Relationships rather than duplicate CRM masters.
- Lead, Opportunity and Pursuit are separate commercial identities; Estimate, Proposal, Contract and Project remain separate downstream identities linked by provenance.
- CRM Activity is distinct from Project Schedule Activity, Work Order and shared workflow Work Item; pipeline/forecast snapshots are projections rather than mutable source truth.
- Estimate is a stable identity with controlled versions; Estimate Breakdown is distinct from WBS, finance structures and procurement/commercial packages.
- Take-off and measurement retain exact information-source provenance; build-ups reference shared Items/resources and applied rates retain historical basis.
- Estimating supplier/subcontract market testing reuses shared sourcing semantics; Tender Adjudication remains a separate internal bid decision.
- Proposal/Quotation and Offer Acceptance are separate from internal Estimate truth and from downstream Contract, Sales Order and Project identities.
- Candidate, employee and contractor contexts reuse canonical Person identity; employment/engagement are effective Worker Relationships.
- Position, Job Profile and Role Assignment remain distinct; organisation occupancy/reporting history is effective-dated.
- Skill/Competence definitions, Person Competence, Credentials, Training Sessions and Learning Records remain distinct evidence layers.
- Worker Availability is derived; Attendance, Time Entry, Timesheet and Payroll Result are separate truth layers.
- Payroll/expense financial consequences post through Finance without turning finance into the worker, time or payroll master.
- Quality Plan/ITP definitions remain separate from Inspection/Test execution evidence; Hold/Witness use one Verification Point pattern.
- NCR, Defect and CAPA remain separate semantic layers; Snag is a Defect classification and corrective/preventive work uses one CAPA Action pattern.
- QHSE Risk Assessment, Audit Engagement and Compliance Requirement reuse enterprise-shared semantics rather than local duplicates.
- Method Statement/RAMS use controlled Information Container identity; Permit to Work and Isolation are shared with site operations.
- Near Miss and Pollution Event are Incident classifications; Investigation/Cause/CAPA retain independent evidence and lifecycles.
- Compliance Register is a projection of applicable requirements/evidence, not editable regulatory truth.
- Dutyholder Assignment is statutory accountability context, distinct from organisational position, generic role assignment, permission and delegated authority.
- Building Control Application is a Regulatory Application type; Regulatory Inspection reuses shared QHSE Inspection semantics.
- Regulatory Controlled Change remains distinct from Design Change and Commercial Change.
- Mandatory Occurrence Report is reporting evidence, not Incident identity; Regulatory Decision is immutable attributable evidence.
- Statutory Completion Certificate remains distinct from Delivery Completion Certificate.
- Golden Thread is a reconstructable source-linked information/evidence set, not one document, folder or duplicate truth store.
- Regulatory Submission reuses shared External Submission semantics and pins exact information/evidence versions.
- Sustainability assessments reference canonical Item, Asset, Project, Site, Party, Utility, Waste and financial/commercial truth rather than maintaining parallel masters.
- Carbon Methodology/factor datasets are versioned and published assessments pin exact source versions; baseline, budget, target and assessment remain distinct.
- Embodied carbon uses assessment lines referencing canonical Items; Operational Energy/Carbon derive from shared Utility Consumption evidence.
- Waste Stream, Waste Consignment, Recovery, Reuse and Circularity Assessment remain distinct layers.
- EPD and Material Provenance retain source/version/provenance while preserving Item/Organisation/inventory identity.
- Social Value Commitment, Evidence and Outcome are distinct; Climate/Resilience Risk reuse Enterprise Risk.
- Enterprise Risk identity remains separate from dated Risk Assessments and Treatment Plans; current risk position is derived from retained evidence.
- Regulatory Obligation is source duty while Compliance Requirement is the actionable/testable requirement; assessment and evidence remain separate.
- Internal Control is a persistent controlled definition; Control Test is a dated execution/evidence occurrence against an exact version.
- Audit Plan is an Assurance Plan type; Audit Engagement, Audit Finding and Remediation Action retain independent identities/lifecycles.
- Fraud and Conduct use one restricted Integrity Case architecture; workflow Work Items coordinate remediation but never replace domain truth.
- Legal Matter, Dispute and Legal Proceeding retain separate identities; statutory filing uses immutable External Submission evidence for actual filing occurrences.
- Legal Hold is the preservation instruction while Legal Hold Link places exact records/objects under hold; eDiscovery Collection preserves source provenance and chain of custody.
- Privacy Policy reuses Information Container; Processing Activity is a stable governed processing definition and DPIA is assessment evidence.
- Consent and Preference are distinct evidence histories; Privacy Breach is a Privacy Incident classification with retained notification/breach-decision provenance.
- International Data Transfer is a governed arrangement/relationship; Privacy Assurance Review reuses shared Assurance Review semantics.
- Knowledge Article, Controlled Document, Media Release, Statement and Annual Report reuse canonical Information Container identity/revision semantics.
- Record Declaration overlays authoritative business truth; Record Series/File are classification/aggregation structures rather than copied content or filesystem folders.
- Retention Schedule is policy, Disposition Request is domain request and BOF-28 Retention Disposition Decision remains the immutable disposition outcome; Legal Hold overrides eligibility.
- Communication activity remains separate from its controlled content; Reputation/Public Affairs share one External Affairs Issue case pattern.
- Investor Engagement is typed Stakeholder Engagement evidence linked to canonical Parties; Stakeholder Engagement Plan remains distinct from Communications Plan.
- Development work reuses canonical Site, Land Parcel, Property, Party, Contract and Project identities; Development Opportunity remains distinct from CRM Opportunity.
- Investment Case is a Business Case type; Development Appraisal is decision-support projection and approval uses shared immutable Decision evidence.
- Land Option reuses Contract; Ownership/Occupation are typed Property Interest relationships; Development Constraint remains distinct from Project Delivery Constraint.
- Property Valuation is distinct from BOF-08 contract/payment Valuation; planning Application, Consent and Conditions remain separate layers.
- Planning Obligation reuses Legal Obligation; Survey, Site Appraisal and Funding/Grant Evidence remain attributable evidence around canonical source objects.
- Strategy Framework, Objective, Theme, Initiative and Business Plan remain distinct governed concepts; Strategic Initiative links to delivery vehicles rather than becoming Project/Programme identity.
- KPI Definition, Performance Target, Performance Observation and Performance Snapshot remain separate definition, plan, evidence and projection layers.
- Strategic Review produces separately governed shared Decisions and Decision Actions; BOF-02 and BOF-06 converge on the same enterprise decision/action spine.
- Policy and Governance Record reuse Information Container; Authority Framework is configuration/governance and remains distinct from Delegated Authority, permission, role and assignment.
- WBS/scope, schedule/time, commercial packages, procurement packages, physical assets and controlled information are related structures, not one universal hierarchy.
- Project delivery structure is distinct from permanent built-environment structure; Projects deliver/change Sites, Buildings, Infrastructure, Systems and Assets without owning their whole-life identity.
- Building and linear-infrastructure spatial patterns coexist; NuBlox does not force every sector into one spatial hierarchy.
- Appointment, Subcontract and Framework Agreement are governed Contract types rather than duplicate agreement-master systems.
- Requisition, sourcing, evaluation, Award, commitment and receipt remain separate traceable records; no single mutable procurement record replaces the end-to-end evidence chain.
- Product, material and service are governed Item classifications/behaviours, not separate master-data silos.
- Item definition, Lot/Batch, Serial Identity and installed Asset identity are distinct semantic layers with traceable relationships.
- BOM/product structure is distinct from Project WBS and from permanent Asset/System configuration.
- Manufacturer and supplier identities reuse canonical Party/Organisation records through governed relationships.
- Stock Position is a projection from posted inventory events, reservations and restrictions; it is not independently editable business truth.
- Warehouse, Store and Bin Location form an inventory-storage hierarchy, not a Project/WBS, Site or Asset hierarchy.
- Issue, Return and Transfer are governed Inventory Movement types with immutable posting/correction evidence.
- Pick, Pack, Shipment, Transport Order and Delivery remain distinct logistics execution/evidence records.
- Information Container is the stable business identity; file/rendition/native-model content is a representation of a governed revision/iteration.
- Document, Drawing, Model, Specification, Technical Schedule and Calculation are governed Information Container types unless semantic review proves a genuinely distinct aggregate.
- Information Requirement, Deliverable, Delivery Plan and Information Container are separate identities connected by traceable satisfaction relationships.
- Information Issue and Transmittal are immutable release/exchange evidence, not mutable folders or file copies.
- RFI and Technical Query share one Information Query pattern; Design Change remains technically distinct from Commercial Change.
- CDE/folder structures are collaboration/storage views around canonical information and do not redefine NuBlox business identity.
- Handover changes stewardship and operational state but never recreates System, Asset or Component identity.
- Commissioning evidence is immutable; retest creates new evidence rather than replacing failed or previous evidence.
- Maintenance Strategy, Maintenance Plan, Task Template and Work Order are distinct semantic layers.
- Work Order is operational work and is not a workflow task or Project Schedule Activity.
- Failure is an event; Defect is a governed case; current condition is derived from retained observations/assessments.
- Service Request, Service Case, Service Appointment and Work Order remain separate identities.
- Service History is a rebuildable projection of canonical work/evidence, never independently editable truth.
- Parts Consumption posts through Inventory Movement; operations does not create a separate material truth store.
- Finance references canonical Legal Entity, Party, Project, WBS, Contract, Purchase Order and Asset identities rather than creating finance-owned duplicates.
- Posted Ledger Entries are immutable; correction uses reversal or new adjusting entries with retained source provenance.
- Budget and Forecast are plans; Commitment, Actual, Open Item and Cash positions are derived views and are never independently editable source truth.
- Supplier/Customer Invoice, Payment/Receipt and Bank Transaction evidence remain separate financial records linked by settlement and reconciliation.
- Fixed Asset Accounting Record is separate from the whole-life physical Asset identity and links to it explicitly where applicable.
- Consolidation and elimination preserve source Legal Entity Ledgers; controlled reporting snapshots are projections/evidence rather than substitute Ledgers.
- Workflow Definition/Instance and Work Item coordinate work around canonical subjects; workflow runtime never becomes authoritative domain truth.
- Work Item is distinct from Project Schedule Activity, Work Order, Service Appointment and specialist domain work/cases.
- Work Assignment, responsibility, permission and Delegated Authority remain separate; assignment alone cannot authorise a protected decision.
- Work Delegation never grants Delegated Authority and cannot bypass segregation-of-duties or scope controls.
- Review Request, Approval Request and Decision Request are distinct; Response is not Decision, and Decision is immutable attributable outcome evidence.
- Domain state changes happen through explicit domain commands after business rules, permissions and authority have been validated.
- User interfaces expose the current authorised action rather than the complete workflow/lifecycle graph by default.
- Business Event, Change Event, Audit Event and Outbox Message have distinct semantics and must not collapse into one generic event store contract.
- Evidence, signatures, attestations, corrections and reversals preserve append-only provenance where accountability requires it.
- Active Legal Hold blocks retention disposition without changing the canonical object's business identity or lifecycle.
- Reference/configuration data defines allowable meaning and policy but never becomes transactional truth.
- Historical transactions retain the exact reference/configuration version needed to interpret their original meaning.
- Classification is an overlay on canonical identity; Uniclass and other systems use one System → Release → Code architecture.
- Lifecycle, workflow and Project Stage definitions are versioned configuration; runtime state remains on the governed domain/work object.
- Role Definition is not Role Assignment; Permission Definition is not effective authorization; Delegated Authority Rule is not a Delegated Authority grant.
- Approval Authority Rule is policy rather than Approval Request, Decision or Approval Evidence.
- Retention Rule is policy; Legal Hold and Retention Disposition Decision remain runtime control/evidence.
- Numbering Scheme creates business identifiers but never replaces immutable system identity.
- Canonical completeness is measured against five independent lenses: sector lifecycle, 29 workspaces, specialist overlays, end-to-end chains and external benchmarks.
- Family-level coverage does not imply candidate-level completion; unresolved candidates and partial/candidate-only families remain visible architecture gaps.
- Reference data and classifications are governed separately from transactional records.
- Documents may support evidence but do not replace structured business state.
- Read models, analytics and search indexes are projections of canonical truth.
- Integration payloads adapt to the canonical model rather than redefining it.

## Canonicalization sequence

1. Tenant, party, person, organisation and enterprise identity.
2. Organisation structure, membership, roles and delegated authority.
3. Portfolio, programme, project/job and delivery context.
4. Estate/network, site, land/property, facility/building/infrastructure and spatial context.
5. Contract/appointment/package identity and commercial relationships.
6. Product/material/service and manufactured-product identity.
7. Inventory, warehouse and logistics identity/event semantics.
8. Information-container and controlled-information identity.
9. Physical asset/system/component/maintainable-item identity.
10. Commissioning, handover, maintenance, service and whole-life Asset operations semantics.
11. Finance/accounting identity and immutable recognition semantics.
12. Shared work, workflow, decision, evidence, audit and retention semantics.
13. Reference data, classification, jurisdiction and configuration/policy primitives.
14. Convergence/coverage audit across the 750-candidate universe, all 29 workspaces, lifecycle stages, specialist overlays, E2E chains and external benchmarks.
15. Close candidate-only and partial family gaps before treating physical aggregate/database/API patterns as enterprise-wide authority.
16. Domain transactions, cases, plans and execution records are physically implemented only against accepted canonical semantics.

## Development hold

Broad horizontal application expansion remains constrained until the convergence audit closes material candidate-only and partial-family gaps.

The current F01.01 slice remains a learning prototype. It must not establish platform-wide object, lifecycle, workflow, permissions or versioning patterns by accident.

No physical table, route, screen or API is considered canonical merely because it was implemented first.
