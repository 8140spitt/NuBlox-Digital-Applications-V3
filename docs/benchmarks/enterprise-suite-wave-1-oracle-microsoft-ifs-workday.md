# Enterprise Suite Wave 1 — Oracle, Microsoft, IFS and Workday

**Status:** architecture challenge complete  
**Date:** 18 September 2026  
**Scope:** Gate 3 enterprise-backbone challenge following completion of the 64-row SAP study

This study compares durable business outcomes, controls and continuity patterns. It does not copy external module boundaries into NuBlox.

## Oracle — Fusion Cloud + Construction & Engineering

**Benchmark state:** challenged

### ENT-W1-ORACLE-01 — CPM scheduling and schedule analysis

**Official evidence**

- Oracle Primavera Cloud: https://www.oracle.com/construction-engineering/primavera-cloud-project-management/
- Oracle Primavera Cloud schedule guidance: https://www.oracle.com/customer-hub/construction-engineering/primavera-cloud/primavera-cloud-getting-started-schedulers/managing-your-schedule/
- Oracle Primavera Cloud calendars: https://www.oracle.com/customer-hub/construction-engineering/primavera-cloud/primavera-cloud-onboarding/primavera-cloud-dictionaries/

**Finding**

NuBlox already governed Project, WBS, Work Package, Schedule, Schedule Activity, Milestone, Dependency, Progress Event and immutable Schedule Baseline. The external challenge exposed a missing reproducibility layer around working calendars and the network calculation itself.

**Decision**

Accepted as **BG-017**.

NuBlox now governs:

- Schedule Calendar;
- Schedule Calculation Run;
- Schedule Analysis Snapshot.

Total/free float, critical/longest-path membership, early/late dates and schedule-health measures are derived planning positions tied to an exact calculation basis. They are not editable flags on Schedule Activity.

### ENT-W1-ORACLE-02 — quantitative schedule/cost risk analysis

**Official evidence**

Oracle Primavera Cloud links risks to schedule activities and supports quantitative cost/schedule simulations and pre/post-response analysis:
https://www.oracle.com/construction-engineering/primavera-cloud-project-management/

**Finding**

The shared Enterprise Risk and Risk Assessment model governs risk identity, assessment and treatment. It did not, however, retain the exact probabilistic-analysis input set, method/version and outcome distribution needed for construction-grade quantitative risk analysis.

**Decision**

Accepted as **BG-019**.

NuBlox now governs:

- Project Risk Simulation Run;
- Project Risk Analysis Snapshot.

The simulation is evidence over existing Risk, Schedule, Forecast and Scenario truth. Its P-values/probability distributions are analytical outcomes, not promises or replacements for the source plans.

### ENT-W1-ORACLE-03 — capital/project controls and connected change

**Official evidence**

Oracle Primavera Unifier connects budgets, contracts, changes, funding, cash flow, approvals, project controls and operational processes:
https://www.oracle.com/construction-engineering/primavera-unifier-project-controls-asset-management/

**Finding**

NuBlox already separates Budget/Forecast/Commitment/Actual, Contract, Commercial Change, Purchase Order, Schedule, valuation/payment and accounting consequences while linking them explicitly. This is the correct semantic direction.

**Decision**

No new universal cost-control master. Unifier validates the need for strong cross-object continuity and explicit before/after change consequence, not a monolithic project-cost object.

### ENT-W1-ORACLE-04 — construction payment compliance

**Official evidence**

Oracle Textura manages construction invoicing/payment, compliance, lien waivers, sworn statements, payment holds and downstream-payment visibility:
https://www.oracle.com/uk/construction-engineering/textura-construction-payment-management/

**Finding**

NuBlox already governs Contract Payment Application, Commercial Valuation, Payment Certificate, withholding/pay-less evidence, Retention, Supplier Invoice/Payment and Compliance Requirement/Evidence. Lien-waiver and sworn-statement controls are jurisdiction-specific legal/payment mechanisms.

**Decision**

Resolved as contextual **BG-018**.

Jurisdictional construction-payment compliance must reuse Contract, valuation/payment, Compliance Requirement, Evidence and Payment truth. Regime-specific waiver/release records are introduced only where the applicable jurisdiction requires them.

### ENT-W1-ORACLE-05 — construction CDE and project record

**Official evidence**

Oracle Aconex provides controlled document registers, strict revision history, configurable workflows, correspondence, model coordination, ITP/test-plan records and an unalterable audit trail:
https://www.oracle.com/construction-engineering/aconex/

**Finding**

This strongly validates NuBlox's existing separation of:

Information Container → Revision → Representation  
Issue / Transmittal / Distribution  
Query / Submittal / Response  
Review / Comment  
Design Coordination Issue  
Design Change  
Evidence / audit / retention

**Decision**

No new generic document or workflow master. NuBlox explicitly rejects copying Aconex's product-specific organization-workspace/data-ownership model into its canonical domain architecture. Multi-organisation rights and provenance are implemented through Party, participation, permissions, issue/distribution and evidence semantics.

## Microsoft Dynamics 365

**Benchmark state:** challenged

### ENT-W1-MS-01 — field execution to project financials

**Official evidence**

Microsoft's current Field Service + Project Operations integration connects Work Order execution, project/project task context, labour/time, material usage, approvals, financial actuals, invoicing and downstream Finance:
https://learn.microsoft.com/en-us/dynamics365/field-service/project-operations-integration

It also explicitly preserves distinct operational and financial ownership depending on deployment:
https://learn.microsoft.com/en-us/dynamics365/field-service/project-operations-integration-inventory

**Finding**

This validates a core NuBlox architecture rule:

Work Order / Field Visit / Material Usage / Time  
→ Project / Work Package context  
→ governed financial consequence / actual  
→ Customer Invoice / ledger posting

Operational records remain authoritative for work performed; finance records the accounting/financial consequence.

**Decision**

No new core semantic gap. Do not collapse Work Order, Schedule Activity, Work Package, Inventory Movement, project actuals and accounting postings into one project-transaction record.

### ENT-W1-MS-02 — source-to-pay continuity

**Official evidence**

Dynamics 365 documents source-to-pay as an end-to-end process spanning procurement, supply chain, project/field and finance:
https://learn.microsoft.com/en-us/dynamics365/guidance/business-processes/source-to-pay-introduction

**Finding**

NuBlox already has Supplier Relationship → qualification → Requisition → Procurement Package → Sourcing → Award → Purchase Order / Contract → Receipt → Supplier Invoice → Payment with explicit Item, inventory and project links.

**Decision**

No new core semantic gap. Continue testing handoffs rather than creating workspace-local copies.

## IFS Cloud

**Benchmark state:** challenged

**Official evidence**

IFS Cloud explicitly spans ERP, EAM, SCM and FSM and positions itself around a unified asset/service lifecycle:
https://www.ifs.com/en/ifs-cloud

**Finding**

IFS independently reinforces the whole-life continuity NuBlox is building:

Item / Asset definition  
→ procurement / inventory  
→ installed Asset  
→ maintenance strategy / plan  
→ Work Order / service execution  
→ parts/material use  
→ condition / failure / reliability  
→ financial consequence / lifecycle planning

The prior cross-market corroboration already caused NuBlox to add Asset Criticality Assessment, Failure Mode Definition, Reliability Strategy and Asset Health Position.

**Decision**

No further core semantic gap at this wave. IFS validates the current separation between Asset identity, maintenance planning, Work Order execution, service case/appointment, inventory and finance.

## Workday

**Benchmark state:** challenged

### ENT-W1-WD-01 — finance, close and consolidation

**Official evidence**

Workday Financial Management supports period close, consolidation, ownership rules, intercompany eliminations, currency translation, reporting and audit trails:
https://www.workday.com/en-gb/products/financial-management/close-consolidate.html

**Finding**

NuBlox already governs Accounting Period/Close Cycle, Ledger, Intercompany Transaction, Consolidation Run, Elimination, currency/exchange-rate semantics and immutable postings.

**Decision**

No new core semantic gap. Runtime close orchestration and localisation remain future implementation proof, not missing canonical identities.

### ENT-W1-WD-02 — workforce/talent planning

**Official evidence**

Workday talent planning uses positions, jobs/skills, scenarios and workforce-gap analysis:
https://www.workday.com/en-gb/products/adaptive-planning/workforce-planning/talent-planning.html

**Finding**

This corroborates NuBlox's existing Worker/Position/Skill/Competency/Workforce Plan model and the benchmark-driven Succession Plan/Talent Pool/Talent Review refinements.

**Decision**

No additional people master or talent silo.

## Wave conclusion

The four-suite challenge is complete at the **architecture/semantic** level.

New governed outcomes arising from this wave:

- **BG-017** — CPM Schedule Calendar / Calculation Run / Analysis Snapshot — accepted and resolved;
- **BG-018** — jurisdictional construction-payment compliance evidence — contextual extension, resolved;
- **BG-019** — quantitative Project Risk Simulation Run / Risk Analysis Snapshot — accepted and resolved.

No new core semantic gap was required from Microsoft, IFS or Workday in this wave; those products materially validated the existing cross-workspace boundaries and prior SAP/cross-market refinements.

This does not claim runtime parity with Oracle, Microsoft, IFS or Workday. It closes their registered **Wave 1 architecture challenge focus**. Runtime proof remains a later implementation/journey concern.
