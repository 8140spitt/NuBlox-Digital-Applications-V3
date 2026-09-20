# Construction Delivery Wave — Procore, Autodesk, Trimble, EcoSys, Causeway, Thinkproject and Asite

**Status:** architecture challenge complete  
**Date:** 18 September 2026  
**Scope:** Gate 3 project / construction delivery benchmark wave

This study compares construction-native business outcomes and controls against the governed NuBlox V3 model. Vendor screens, modules and data hierarchies are not copied automatically.

## Procore

**Benchmark state:** challenged

### CON-W2-PROCORE-01 — site diary and field evidence

**Official evidence**

- Project management: https://www.procore.com/project-management
- Site Diary: https://en-gb.support.procore.com/products/online/user-guide/project-level/daily-log
- Site Diary quantities/productivity: https://en-gb.support.procore.com/products/online/user-guide/project-level/daily-log/tutorials/create-quantity-entries
- Labour productivity/timesheets: https://www.procore.com/en-gb/resource-tracking/timesheets

**Finding**

Procore treats the daily site record as a configurable field evidence envelope covering labour, equipment, quantities, productivity, deliveries, safety, photos, delays and work records. It also retains diary change history and allows completed days to be controlled.

NuBlox already governs:

- Daily Site Diary;
- Progress Record;
- Field Labour Record;
- Plant Usage Record;
- Inventory Movement for material use;
- Delivery;
- Photographic / geospatial evidence;
- Incident / QHSE evidence;
- Delivery Constraint;
- completion and handover-readiness evidence.

The NuBlox diary deliberately remains an evidence envelope rather than replacing its referenced domain records.

**Decision**

No new daily-log master.

### CON-W2-PROCORE-02 — production quantity and labour productivity

Procore links budgeted/installed quantities, labour hours and installation rates for productivity control.

**Decision**

Contributes to **BG-020**. NuBlox now governs the Progress Measurement Method and reproducible Project Performance Calculation/Snapshot rather than storing productivity as an independently editable project balance.

### CON-W2-PROCORE-03 — Schedule of Values and progress payment

**Official evidence**

- https://www.procore.com/library/schedule-of-values-explained
- https://support.procore.com/products/online/user-guide/project-level/invoicing/tutorials/create-a-subcontractor-schedule-of-values-ssov

Procore uses a Schedule of Values as the agreed priced breakdown for commitments and progress billing, including line-level quantity/value structures and downstream subcontractor breakdown.

**Decision**

Accepted as **BG-021**.

NuBlox now governs Contract Value Schedule and Contract Value Line, mapped explicitly to WBS/Work Package and Cost Code without becoming either hierarchy.

## Autodesk Construction Cloud / Forma

**Benchmark state:** challenged

**Official evidence**

- https://construction.autodesk.com/
- https://construction.autodesk.com/tools/construction-daily-reports/

Autodesk connects document management, model coordination, RFIs, submittals, daily reports, project issues and bid management.

NuBlox already separates:

- Information Container → Revision → Representation;
- Information Issue / Transmittal / Distribution;
- RFI / Technical Query / Response;
- Submittal;
- Design Review / Review Comment;
- Design Coordination Issue / Clash;
- Design Change;
- Daily Site Diary and field evidence;
- procurement sourcing/evaluation/award.

**Decision**

No new generic CDE, document, RFI, submittal or clash master. Autodesk validates the existing controlled-information model and office-to-field handoff requirements.

## Trimble Construction One / Viewpoint Vista

**Benchmark state:** challenged

**Official evidence**

- Vista overview: https://help.trimble.com/doc/vista/vista/welcome-to-vista
- Job Cost: https://help.trimble.com/doc/vista/vista/costs-and-contracts/job-cost
- Cost projections: https://help.trimble.com/doc/vista/vista/costs-and-contracts/job-cost/costs/enter-cost-projections
- Job Cost / GL integration: https://help.trimble.com/doc/vista/vista/costs-and-contracts/job-cost/job-cost-and-general-ledger

### CON-W2-TRIMBLE-01 — job cost and forecast integration

Vista accumulates estimate, commitment, actual, projected/forecast cost and contract revenue by job/phase/cost type and integrates those positions to accounting, project management, procurement, payroll, equipment and inventory.

**Decision**

Contributes to **BG-020**.

NuBlox retains a different authority model:

- Project/WBS/Work Package = delivery scope;
- Cost Code / Financial Dimension = financial classification;
- Contract / Purchase Order = commitment truth;
- Progress = field/project evidence;
- Ledger Entry = accounting actual;
- Forecast = planning truth;
- Project Controls Performance Snapshot = reconstructed controls view.

The Vista `job → phase → cost type` hierarchy is therefore **not** adopted as a universal NuBlox schema.

## Hexagon EcoSys

**Benchmark state:** challenged

**Official evidence**

- Enterprise Project Performance: https://aliresources.hexagon.com/project-management-control/ecosys-enterprise-projects-performance-software
- Earned Value: https://aliresources.hexagon.com/digital-transformation/foundations-of-good-earned-value-management

### CON-W2-ECOSYS-01 — earned value and enterprise project performance

EcoSys joins budget, change, progress, actual cost, commitments, forecasts and schedule information to calculate earned value, CPI/SPI, productivity and estimate-at-completion measures.

**Decision**

Primary driver for **BG-020**.

NuBlox now governs:

```text
Progress Measurement Method
        ↓
Project Performance Calculation Run
        ↓
Project Controls Performance Snapshot
```

The snapshot may contain PV, EV, AC, SV/CV, SPI/CPI, ETC/EAC, commitments/exposure, forecast cost/value, margin, production productivity and CVR-style positions.

None of those values becomes a shadow ledger or editable source of progress.

## Causeway

**Benchmark state:** challenged

**Official evidence**

- Commercial platform: https://www.causeway.com/commercial
- Project Accounting: https://www.causeway.com/commercial/project-accounting
- NEC contract/project accounting: https://campaign.causeway.com/products/cpa-projects/nec-contracts

### CON-W2-CAUSEWAY-01 — CVR / construction project accounting

Causeway connects labour, plant, material and subcontract cost, budget/value, change, payment applications, earned-value measures, project forecast and real-time CVR.

**Decision**

Contributes to **BG-020**.

Operational source records and finance postings remain separate; CVR is a controlled project-performance projection.

### CON-W2-CAUSEWAY-02 — contract-specific value breakdown

Causeway explicitly allocates cost/value to contract-specific activity or bill-of-quantities structures.

**Decision**

Contributes to **BG-021** Contract Value Schedule/Line.

### CON-W2-CAUSEWAY-03 — NEC target cost

Causeway differentiates recoverable/non-recoverable cost for target-cost calculations and supports contract-specific commercial structures.

**Decision**

Contributes to **BG-022**.

## Thinkproject / CEMAR

**Benchmark state:** challenged

**Official evidence**

- CEMAR / Contracts: https://www.thinkproject.com/products/thinkproject-cemar/
- Custom contract events: https://www.thinkproject.com/products/custom-contract-events/

### CON-W2-THINKPROJECT-01 — NEC/FIDIC event administration

Thinkproject/CEMAR manages contract communications/events, notices, certificates, KPI reports, site diaries and configurable workflows across NEC, FIDIC and other contract types.

NuBlox already governs:

- typed Contract identity;
- Contract Clause / Obligation / Key Date;
- Contract Notice;
- Commercial Change, including Compensation Event / Variation;
- Change Quotation / assessment / decision;
- Commercial Claim / Dispute;
- Payment Application / Valuation / Certificate;
- Daily Site Diary;
- configurable Workflow Definition around—but never replacing—domain truth.

**Decision**

No contract-event mega-object and no contract-form-specific duplicate change engine.

### CON-W2-THINKPROJECT-02 — target cost / pain-gain

Thinkproject explicitly supports pain/gain share as a target-cost contractual mechanism.

**Decision**

Accepted as **BG-022**.

NuBlox now governs Target Cost Baseline, Commercial Share Mechanism and immutable Commercial Share Assessment.

## Asite

**Benchmark state:** challenged

**Official evidence**

- https://www.asite.com/
- https://www.asite.com/blogs/what-is-a-common-data-environment
- https://www.asite.com/en/common-data-environment-cde-report-download

Asite emphasises a shared CDE, version control, secure collaboration, audit trail and ISO 19650-oriented information management.

**Finding**

The benchmark strongly validates NuBlox's existing controlled-information boundaries:

- one stable Information Container identity;
- revision/iteration separate from file representation;
- controlled Issue and Transmittal evidence;
- distribution/acknowledgement;
- information requirements and deliverables;
- RFI/submittal/review/change;
- records/retention;
- explicit Party/permission context.

**Decision**

No Asite-style repository or folder tree becomes canonical architecture. ISO 19650 itself remains a separate standards challenge in Gate 3.

## Oracle construction controls carried into this wave

Oracle was marked challenged during Enterprise Wave 1 but contributes construction-specific findings:

- **BG-017** — Schedule Calendar / Calculation Run / Analysis Snapshot for reproducible CPM;
- **BG-018** — jurisdictional payment-compliance evidence as contextual extension;
- **BG-019** — quantitative Project Risk Simulation / Analysis;
- **BG-021** — Contract Value Schedule / schedule-of-values semantics;
- **BG-022** — NEC-style target/share mechanisms corroborated by Oracle's contract-management depth.

## Construction wave outcome

The construction wave produced three additional core refinement areas beyond the earlier Oracle findings:

### BG-020 — construction performance controls

Governed:

- Progress Measurement Method;
- Project Performance Calculation Run;
- Project Controls Performance Snapshot.

### BG-021 — agreed contract value/payment breakdown

Governed:

- Contract Value Schedule;
- Contract Value Line.

### BG-022 — target-cost and share mechanisms

Governed:

- Target Cost Baseline;
- Commercial Share Mechanism;
- Commercial Share Assessment.

## Deliberate non-adoptions

The challenge explicitly rejects these vendor-shaped architectures as NuBlox canonical authority:

- Procore/Autodesk tool boundaries as domain boundaries;
- Vista's Job/Phase/Cost Type structure as the universal project model;
- a CDE folder/repository hierarchy as business-object identity;
- one mutable project-cost record containing estimate, commitments, actuals and forecast;
- one generic contract-event record replacing Notice, Change, Claim, Certificate, Diary and Decision;
- contract-form-specific parallel change engines.

## Wave status

**Procore:** challenged  
**Autodesk Construction:** challenged  
**Trimble Construction One:** challenged  
**Hexagon EcoSys:** challenged  
**Causeway:** challenged  
**Thinkproject:** challenged  
**Asite:** challenged

The wave is complete at the **semantic / architecture-challenge** level. Runtime journey parity and UI quality remain later implementation proof.
