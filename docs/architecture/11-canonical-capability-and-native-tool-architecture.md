# 11 — Canonical Capability & Native Tool Architecture

**Status:** Governing capability/tool architecture baseline  
**Effective:** 21 September 2026  
**Scope:** NuBlox Digital Applications V3 — 29 enterprise Functions, 353 L2 Sub-functions, 1,510 Activities and the Construction & Built Environment Industry Solution

## Purpose

The market benchmark is complete enough to stop designing NuBlox from vendor suites, product menus or generic ERP categories.

This architecture converts verified market operations into **canonical NuBlox capabilities and reusable native tool engines**.

The governing derivation chain is:

~~~text
Market capability / professional operation
-> canonical NuBlox capability
-> canonical business objects and relationships
-> required native tool engine
-> Function / L2 / Activity ownership
-> participating Job Profiles
-> lifecycle / responsibility / Authority / Evidence
-> workspace interaction
-> implementation gap
-> implementation wave
~~~

External products remain benchmark, migration and interoperability evidence. They do not define NuBlox runtime boundaries.

## Architecture rule

A new canonical capability or native tool engine is justified only when the work introduces a materially different:

- operation, calculation, optimisation or professional authoring behaviour;
- authoritative business object, transaction or managed output;
- lifecycle/status model;
- responsibility, review, approval or delegated Authority model;
- audit/Evidence requirement; or
- interoperability/migration semantic.

Alternative vendor implementations of the same operative pattern do **not** create duplicate NuBlox modules.

## Definitions

### Canonical capability

A **Canonical Capability** is a vendor-neutral statement of work that NuBlox must be able to perform.

Examples:

- build and compare strategic scenarios;
- create and approve a Purchase Order;
- execute a physical inventory count;
- author and revise a controlled technical drawing;
- calculate earned value and forecast Estimate at Completion;
- model a BPMN process and execute an approved workflow;
- inspect installed work and raise a non-conformance.

### Native tool engine

A **Native Tool Engine** is a reusable executable NuBlox capability that performs one or more canonical capabilities on the shared object graph.

An engine is not a workspace. The same engine may be composed into many Functions, Industry Solution views and Job Profile experiences.

### Workspace tool composition

A Function workspace is a governed composition of engines, records, queues, dashboards, Work and Decisions relevant to that Function.

A Job Profile experience is a contextual composition of the same platform engines according to HCM-managed Position, Position-to-Function assignment, reporting scope, operating context, responsibility, competence and Authority.

## Native execution requirement

Architecture Invariants 34–43 apply.

For a capability claimed as supported by NuBlox:

- users must be able to create, edit, transact, calculate, review, approve and complete the work inside NuBlox;
- the authoritative structured object must remain in NuBlox after governed cutover;
- external files may be imported/exported as exchange formats;
- external systems may be migration sources/targets;
- external applications may not be required runtime components.

This applies equally to enterprise transactions and professional Construction & Built Environment authoring.

## Engine classes

### A — Platform control engines

Shared engines used by every Function and Industry Solution:

- tenant, Party, Organisation, Position and identity;
- permissions, scope, Responsibility and Authority;
- Position-to-Function assignment, optional contextual assignment and Work Assignment;
- Workflow, Work Item and My Work;
- Lifecycle, Decision, approval and Evidence;
- Information, Revision, Representation and records;
- Change, Configuration, Baseline and Effectivity;
- Deliverable Requirement, Deliverable Item, issue/transmittal and Acceptance;
- events, notification, audit, search and portability/integration.

These engines are not duplicated inside functional modules.

### B — Transaction engines

Structured operational truth, including:

- lead/opportunity/quote/order;
- requisition/sourcing/Purchase Order;
- inventory, warehouse and logistics transactions;
- production/work orders;
- customer/service cases;
- journals, invoices, payments and cash;
- payroll and workforce transactions;
- maintenance/work orders;
- project/commercial transactions.

### C — Planning, optimisation and analytical engines

Native structured planning and calculation, including:

- strategy and scenario planning;
- budgeting, forecasting and performance;
- demand/supply/capacity optimisation;
- scheduling and resource planning;
- portfolio optimisation;
- project controls, CPM and earned value;
- estimating, cost planning and lifecycle costing;
- risk, assurance and sustainability analytics.

### D — Professional authoring engines

Native creation of specialist work products, including:

- documents, controlled technical information and specifications;
- CAD/BIM/model authoring;
- parametric and computational design;
- engineering calculation/analysis;
- survey/geospatial/reality-capture processing;
- take-off, measurement, estimating and BoQ authoring;
- programme/4D planning;
- process/BPMN/DMN modelling;
- reports, presentations and governed publishing.

### E — Field, production and assurance engines

Execution at the point of work, including:

- field service and dispatch;
- manufacturing/fabrication execution;
- inspection, test and quality control;
- HSE, permits and incidents;
- site production and progress;
- commissioning and handover;
- maintenance and asset operations.

### F — Data, automation and AI engines

Cross-platform intelligence, including:

- enterprise search;
- data integration and transformation;
- master/reference data;
- data catalogue and lineage;
- BI/semantic analytics;
- process mining;
- rules/decision automation;
- ML/AI development, deployment, monitoring and governance.

## Canonical native-engine baseline

The machine-readable baseline is maintained in
[canonical-native-tool-engine-register.csv](canonical-native-tool-engine-register.csv).

The baseline establishes stable engine IDs so later L2, Activity, Job Profile and implementation mappings can refer to reusable capabilities rather than vendor products.

## 29-Function composition

| Function | Primary native engine composition |
| --- | --- |
| **F01 Strategy & Enterprise Planning** | strategy/scenario planning; enterprise planning; KPI/performance; portfolio alignment; analytics |
| **F02 Corporate Governance** | board/committee governance; policy; delegated Authority; Decision/action tracking; controlled publication |
| **F03 Enterprise Performance Management** | scorecards; planning/forecasting; variance; benefits; benchmarking; management reporting |
| **F04 Corporate Development & M&A** | opportunity/target pipeline; valuation; due diligence; virtual deal room; transaction/integration/separation planning |
| **F05 Product, Service & Innovation Management** | portfolio/roadmap; requirements; idea/innovation; business case; product/service definition; configuration/change/lifecycle |
| **F06 Marketing & Brand** | market intelligence; segmentation; campaign/content; digital channels; events; lead generation; attribution |
| **F07 Sales & Commercial Management** | CRM/account/opportunity; pricing; CPQ/quotation; bid/proposal; sales order; partner/commission; forecasting |
| **F08 Customer Service, Experience & Success** | onboarding; omni-channel enquiry/case; complaint; technical support; returns/warranty; success/retention; SLA/knowledge |
| **F09 Procurement & Supplier Management** | spend/category; supplier master/onboarding; sourcing/RFx; negotiation; contracting; requisition/PO; supplier performance/risk |
| **F10 Demand, Supply Chain & Logistics** | demand/S&OP/supply planning; MRP; inventory; warehouse; transport; distribution; customs; reverse logistics |
| **F11 Manufacturing / Production Operations** | production planning/scheduling; MES/work orders; material staging; WIP; process control; packaging; production performance |
| **F12 Service Delivery & Field Operations** | service planning; appointment/scheduling/dispatch; field execution; professional services; acceptance; capacity/performance |
| **F13 Quality Management** | quality planning; inspection/test; audit; non-conformance; CAPA; supplier quality; controlled quality records |
| **F14 Finance, Accounting, Treasury & Tax** | ledger/accounting; AP/AR; billing; cash/treasury; tax; fixed assets; close/consolidation; financial planning/reporting |
| **F15 Human Resources / Human Capital** | organisation/workforce; recruitment/onboarding; time/absence; payroll; performance; learning; talent; reward; employee relations |
| **F16 Information Technology** | service catalogue; incident/request/problem/change; CMDB; endpoint/cloud/platform operations; DevOps/service portfolio |
| **F17 Data, Analytics & AI** | integration; lakehouse/warehouse; transformation; MDM; catalogue/lineage; BI; data science; AI/MLOps/governance |
| **F18 Cybersecurity & Information Security** | IAM/PAM; asset/exposure; vulnerability/patch; SIEM/SOC; incident response; threat/app security; cryptography/compliance |
| **F19 Legal & Corporate Secretariat** | legal matter; CLM; entity/statutory records; IP; litigation/eDiscovery; legal spend; obligation management |
| **F20 Risk, Compliance, Internal Control & Audit** | risk; regulatory obligations; controls/testing; audit; issues/remediation; ethics/conduct; assurance mapping |
| **F21 Privacy & Information Governance** | RoPA/data map; DPIA; consent/preferences; data-subject rights; breach; transfer; retention/disposition |
| **F22 Property, Facilities & Physical Assets** | asset/property master; capital planning; lease/space; maintenance/EAM; facilities service; utilities; reliability/performance |
| **F23 Health, Safety, Environment & Sustainability** | HSE risk; inspections; incidents; permit-to-work; occupational health; environment/waste; carbon/energy/ESG/LCA |
| **F24 Business Continuity, Crisis & Physical Security** | BIA; continuity/recovery plans; exercises; crisis activation; mass notification; access/visitor/video/security incident |
| **F25 Communications, Public Affairs & Investor Relations** | content/publishing; media/PR monitoring; stakeholder/government engagement; IR events/disclosures/CRM; reputation |
| **F26 Knowledge, Document & Records Management** | knowledge authoring; document/version/review; records/retention/legal hold; enterprise search; technical CDE/transmittals |
| **F27 Portfolio, Programme & Project Management** | portfolio/investment; programme/project; WBS/schedule/resource; cost/change/project controls; 4D/EVM; project execution |
| **F28 Change & Transformation Management** | transformation portfolio/roadmap; impact; stakeholder; communications; training/readiness; digital adoption; benefits |
| **F29 Business Process & Continuous Improvement** | process architecture; BPMN/DMN; process repository; mining/conformance; redesign; automation/orchestration; CI/benefits |

## Construction & Built Environment composition

The Industry Solution composes enterprise engines with additional professional engines required for the 84 Job Profiles.

The canonical specialist families include:

- technical CDE and controlled design information;
- CAD/BIM/model authoring and coordination;
- parametric/computational design;
- discipline engineering analysis and calculation;
- geospatial/survey/reality capture;
- specification authoring;
- take-off, measurement, estimating, cost planning and BoQ;
- construction contract/commercial administration;
- CPM, project controls, 4D and earned value;
- site production, field evidence and progress;
- fabrication/off-site production;
- inspection/test/quality/HSE;
- commissioning, handover and asset-information authoring;
- digital twin and operational asset information.

A specialist engine may participate in several Functions and Job Profiles. For example, native BIM authoring participates in F05, F13, F22, F26 and F27 while remaining one canonical engine.

## Capability-to-object rule

Every canonical capability must identify its authoritative object model.

The object may be:

1. an existing Kernel object;
2. an extension/specialisation of an existing canonical family; or
3. a new canonical aggregate justified by distinct identity, lifecycle, invariants or transactional consistency.

A screen, form or report is never sufficient justification for a new aggregate.

## Capability-to-control rule

Every material capability must declare:

- initiating responsibility;
- operating context and data scope;
- required Permission;
- required competence where applicable;
- delegated Authority where applicable;
- lifecycle states/transitions;
- review/check/approval/acceptance route;
- immutable Decision/Evidence requirements;
- audit and retention;
- exception/rework behaviour.

These controls reuse the Enterprise Kernel rather than being reimplemented inside tools.

## Capability-to-output rule

Every material operation must identify its controlled result as one or more of:

- canonical master data;
- business transaction;
- managed Deliverable Item;
- technical/professional model;
- calculation/analysis result;
- Decision/approval;
- issued/accepted information;
- physical-work Evidence;
- inspection/test result;
- configuration/baseline effect;
- report/KPI/analytical projection.

The output must remain traceable to the Work, actor, source state and governing context that produced it.

## Interaction model

NuBlox should present engines contextually rather than as a catalogue of disconnected apps.

~~~text
Tenant
-> Function workspace
   -> L2 Sub-function
      -> queue / plan / register / board / model / transaction view
      -> canonical object
      -> native tool action
      -> Work / review / Decision
      -> controlled output

Person
-> My Work
   -> assignment
   -> contextual native tool
   -> exact subject/object
   -> complete work
   -> evidence / downstream consequence
~~~

The same canonical engine may therefore appear in:

- a Function workspace;
- a Project/Contract/Site/Asset context;
- a Job Profile workbench;
- My Work;
- a cross-functional process journey.

## L2 and Activity mapping contract

The next machine-readable derivation must map every one of the 353 L2 Sub-functions and 1,510 Activities to:

- one or more canonical capability IDs;
- one or more native engine IDs;
- authoritative canonical object/aggregate;
- managed output;
- participating Job Profiles;
- lifecycle/Authority/Evidence pattern;
- implementation state.

No L2 or Activity is considered implementation-covered merely because a neighbouring screen exists.

## Implementation states

Canonical capabilities and engines use the following implementation states:

- **IMPLEMENTED_PLATFORM** — shared runtime exists and is production architecture;
- **IMPLEMENTED_DOMAIN_CORE** — authoritative domain capability exists;
- **PARTIAL** — some authoritative semantics exist but operative capability is incomplete;
- **TO_BUILD** — architecture is defined but native capability is not implemented;
- **RESEARCH_REQUIRED** — benchmark evidence is insufficient to freeze canonical semantics.

The completed market benchmark means the architecture should now minimise **RESEARCH_REQUIRED** and expose real implementation gaps instead.

## Delivery sequence

1. Freeze engine registry and naming.
2. Map 353 L2 Sub-functions to engine IDs and canonical objects.
3. Map 1,510 Activities to executable canonical capabilities.
4. Overlay all 84 CBE Job Profiles and their required professional operations.
5. Reconcile against implemented aggregates/services/UI.
6. Produce the canonical capability gap register.
7. Order implementation waves by shared dependency and end-to-end business outcome.
8. Implement each wave on the shared Kernel with migrations, tests and complete workspace interactions.

## Acceptance test

For every Function, L2 Sub-function, Activity and supported Job Profile, NuBlox must be able to answer:

- What real work is performed?
- Which canonical capability performs it?
- Which native engine executes it?
- Which authoritative object does it create or change?
- Which managed output results?
- Which lifecycle and workflow apply?
- Who is responsible?
- What Permission, competence and Authority are required?
- Which review/approval/acceptance is required?
- What Evidence proves the work?
- Which other Functions/contexts consume the result?
- Is the capability implemented, partial or still to build?

If any of those answers are absent, the capability is not architecturally or operationally complete.
