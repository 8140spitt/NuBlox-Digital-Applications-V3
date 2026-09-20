# SAP Wave 1 — Enterprise Backbone Challenge

**Status:** in progress  
**Date:** 18 September 2026  
**Evidence basis:** current SAP product pages plus governed NuBlox V3 semantic models  
**Rows challenged in this wave:** 39/64

This wave deliberately compares **business outcomes and control semantics**, not SAP module names.

## SAP-W1-01 — Integrated business planning and supply planning

**SAP rows:** 1, 22, 53  
**Official source:** https://www.sap.com/uk/products/scm/integrated-business-planning/features.html  
**NuBlox state:** `canonical-refinement-required`

**Finding.** NuBlox has Business Plan, Scenario, Forecast, Production Plan and Capacity Plan semantics, but the 750-object baseline has no explicit governed Demand Plan or Supply Plan identity. SAP IBP also stresses cross-functional financial/operational planning, multilevel supply planning, inventory optimisation and scenario comparison.

**Gate 3 decision.** Add a canonical planning refinement before aggregate freeze: define whether Demand Plan, Supply Plan and planning allocation/exception are governed plan identities, typed plan components or projections. Preserve one scenario/version/effectivity model across finance, supply, production and project demand.

## SAP-W1-02 — Enterprise analytics and integrated planning

**SAP rows:** 2, 3, 35, 49, 50  
**Official source:** https://www.sap.com/uk/products/data-cloud/cloud-analytics.html  
**NuBlox state:** `semantic-baseline-strong-runtime-unproven`

**Finding.** NuBlox already governs KPI Definition, Target, Observation, Snapshot, Scenario, Business Plan, Forecast, Dataset, Report, Dashboard and Analytical Model. SAP's current analytics/planning proposition increases the requirement for unified financial, operational, supply-chain and workforce planning rather than disconnected dashboards.

**Gate 3 decision.** No new generic dashboard master. Refine cross-domain plan/version relationships, driver/assumption provenance and analytical lineage; runtime analytics and planning evidence remain unproven.

## SAP-W1-03 — Financial accounting and controlling

**SAP rows:** 6, 13, 16, 44  
**Official source:** https://www.sap.com/uk/products/erp/grow/finance.html  
**NuBlox state:** `semantic-baseline-strong-runtime-unproven`

**Finding.** The governed finance model already covers ledger, journal/posting, AP/AR, settlement, bank evidence, tax, fixed-asset accounting, budgets/forecasts, intercompany, consolidation and close semantics while retaining operational source truth.

**Gate 3 decision.** Keep the current source-truth/accounting-effect boundary. Challenge next for localisation, revenue/cost recognition policies, intercompany matching, consolidation controls and close orchestration before physical design.

## SAP-W1-04 — Cash, liquidity and treasury risk

**SAP rows:** 4, 58  
**Official source:** https://www.sap.com/uk/products/financial-management/treasury-risk-management.html  
**NuBlox state:** `canonical-refinement-required`

**Finding.** Bank Account, Cash Forecast, Liquidity Forecast, Treasury Facility, Treasury Deal and derived Cash Position are governed. The current register does not explicitly model financial exposure, hedge relationship/instrument, market-data snapshot or cash-pooling arrangement.

**Gate 3 decision.** Refine BOF-19 treasury semantics with exposure/hedge/market-data/cash-pool concepts or explicit relationships where they are required to preserve treasury risk and audit evidence.

## SAP-W1-05 — Procurement, supplier lifecycle and network collaboration

**SAP rows:** 25, 26, 27, 28, 51, 52  
**Official source:** https://www.sap.com/uk/products/business-network/procurement.html  
**NuBlox state:** `semantic-baseline-partial`

**Finding.** NuBlox governs Party/Supplier Relationship, qualification, approved status, sourcing, evaluation, award, Contract, Purchase Order, Call-off and receipt. SAP Business Network adds external trading-partner discovery/onboarding, network document exchange, supplier certifications/risk context, invoicing compliance and working-capital collaboration.

**Gate 3 decision.** Keep supplier identity in Party/Relationship. Add/clarify master-data stewardship and supplier collaboration/channel semantics; treat e-invoice network connectivity and external supplier discovery as integration capabilities rather than duplicate supplier masters.

## SAP-W1-06 — Master data governance

**SAP rows:** 25, 26, 27  
**Official source:** https://www.sap.com/products/data-cloud/master-data-management.html  
**NuBlox state:** `canonical-refinement-required`

**Finding.** NuBlox has canonical Party, Item, Asset and reference-data identities plus Data Quality Rule semantics. SAP MDG's current emphasis on golden records, duplicate matching/merge, governance workflows and stewardship exposes missing explicit stewardship/change-request/merge-unmerge governance in the canonical baseline.

**Gate 3 decision.** Introduce governed master-data stewardship semantics spanning Party, Item, Asset and reference data without creating a second master-data store. Duplicate resolution must preserve merge provenance and reversible governance evidence.

## SAP-W1-07 — Warehouse and transportation execution

**SAP rows:** 14, 45, 53, 57, 63  
**Official source:** https://www.sap.com/uk/products/scm/extended-warehouse-management/features.html  
**NuBlox state:** `semantic-baseline-partial`

**Finding.** Warehouse, Store, Bin, Inventory Movement, Reservation, Pick, Pack, Shipment, Transport Order and Delivery are governed. SAP EWM/TM adds wave planning, handling units, yard/dock operations, labour/resource optimisation, slotting, cross-docking, freight tendering and freight settlement.

**Gate 3 decision.** Retain the current inventory-event truth model. Evaluate Handling Unit, Yard/Dock Appointment, Warehouse Wave/Work Package, Freight Tender and Freight Settlement as specialist execution/transaction concepts before aggregate freeze.

## SAP-W1-08 — Manufacturing and production planning

**SAP rows:** 38, 45, 53  
**Official source:** https://www.sap.com/uk/products/scm/manufacturing.html  
**NuBlox state:** `semantic-baseline-strong-runtime-unproven`

**Finding.** NuBlox already separates Item/BOM, Manufacturing Definition, Process Plan/Routing, Work Centre, Production Plan/Order/Operation, Lot/Batch/Serial, progress/quality evidence and as-manufactured configuration.

**Gate 3 decision.** Preserve definition-versus-execution separation. Challenge next for detailed finite capacity scheduling, shop-floor dispatch, operator/machine data capture and production exception/deviation semantics.

## SAP-W1-09 — Enterprise asset management and maintenance scheduling

**SAP rows:** 11, 29, 32  
**Official source:** https://www.sap.com/uk/products/scm/asset-management-eam.html  
**NuBlox state:** `semantic-baseline-partial`

**Finding.** Asset/System/Component, Condition Point/Assessment, Maintenance Strategy/Plan/Schedule, Work Order, inspection, failure, dispatch and field visit are governed. SAP EAM/resource scheduling increases pressure for reliability/criticality, failure-mode analysis and explicit workload/capacity scheduling.

**Gate 3 decision.** Do not create another asset register. Refine reliability/criticality/failure-mode and maintenance-resource planning semantics around the existing Asset, Work Order, Work Centre/worker and schedule identities.

## SAP-W1-10 — Human capital and workforce management

**SAP rows:** 20, 29, 55  
**Official source:** https://www.sap.com/uk/products/hcm/about-successfactors.html  
**NuBlox state:** `semantic-baseline-partial`

**Finding.** NuBlox covers worker relationship, position/job profile, skills/competence, learning, workforce plan, availability/shift/allocation, time/attendance, leave, compensation/payroll, vacancy/candidate/application/offer/onboarding, performance and offboarding. SAP's current HCM suite also foregrounds talent, workforce intelligence and skills-driven career/succession processes.

**Gate 3 decision.** Keep one Person/Worker spine. Evaluate explicit succession/talent-pool and workforce-intelligence planning semantics; avoid duplicating Career Profile, Skill, Competency or Performance Review.

## SAP-W1-11 — Governance, risk, compliance and assurance

**SAP rows:** 19  
**Official source:** https://www.sap.com/uk/products/financial-management/grc.html  
**NuBlox state:** `semantic-baseline-strong-runtime-unproven`

**Finding.** Risk Framework, Enterprise Risk, Risk Assessment, Compliance Requirement, Internal Control, Control Test, Assurance Plan, Audit Engagement/Finding and remediation are governed. SAP GRC's broader identity/access, cyber/data-protection and trade pillars validate NuBlox's decision to link separate specialist domains rather than force them into one GRC aggregate.

**Gate 3 decision.** No generic GRC mega-object. Preserve shared risk/control/audit semantics with explicit links to F18 Cybersecurity, F21 Privacy and F10/F20 trade compliance.

## SAP-W1-12 — Portfolio, project and resource management

**SAP rows:** 34, 39  
**Official source:** https://www.sap.com/uk/products/scm/project-portfolio-management.html  
**NuBlox state:** `semantic-baseline-strong-runtime-unproven`

**Finding.** NuBlox already governs Portfolio, Programme, Project, stage, WBS, Work Package, Schedule, Activity/Milestone, Baseline, progress, project issue/change/risk and responsibility/resource context. SAP EPPM emphasises portfolio selection, financial/capacity demand, resource matching and integrated project/finance/logistics information.

**Gate 3 decision.** Preserve Project/WBS/Work Package boundaries. Challenge next for portfolio scoring/prioritisation, capacity-demand planning, earned-value/performance projection and resource-fit evidence without merging HCM allocation into project scope truth.

## SAP-W1-13 — Integration, events and platform operations

**SAP rows:** 9, 12, 30, 36, 48, 64  
**Official source:** https://www.sap.com/uk/products/erp.html  
**NuBlox state:** `semantic-baseline-strong-runtime-unproven`

**Finding.** NuBlox has Data Pipeline, event/outbox, workflow/work-item, IT change/release/configuration and evidence semantics. The remaining challenge is operational runtime depth: API lifecycle, integration monitoring, retries/idempotency, migration, observability and supported extension contracts.

**Gate 3 decision.** Keep platform records separate from domain truth. Gate runtime implementation on versioned APIs/events, idempotent integration, operational observability, migration provenance and extension isolation.


## Wave 1 consequence

The SAP remap itself is complete at 64/64, but capability closure is not. This first challenge wave has reviewed 39 unique SAP rows. None are marked closed until the accepted refinements are either incorporated into the canonical model or explicitly rejected/integrated with retained rationale.

The highest-priority canonical refinements exposed by this wave are:

1. integrated Demand Plan / Supply Plan semantics and cross-domain planning versions;
2. treasury exposure / hedge / market-data / cash-pool semantics;
3. master-data stewardship, duplicate match/merge and merge provenance;
4. advanced warehouse/transport concepts where they are materially required;
5. asset reliability/criticality/failure-mode planning;
6. talent/succession semantics where Career Profile/skills/performance do not already satisfy the outcome.

These findings must be resolved before the canonical aggregate-boundary freeze.
