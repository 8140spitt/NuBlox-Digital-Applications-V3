# NuBlox Market Tool Master Map

**Status:** Canonical market-tool discovery entry point  
**Effective:** 23 September 2026  
**Scope:** 29 enterprise Functions plus 16 Construction & Built Environment professional Domains  
**Machine-readable master register:** [market-tool-master-register.csv](market-tool-master-register.csv)

## Purpose

This is the single entry point for answering:

> For each NuBlox enterprise Function and CBE professional Domain, which current market products enable the work, which jobs/capabilities use them, what work products are involved, and where is the deeper verification evidence?

The master register does **not** replace the detailed benchmark files. It normalises their canonical Function and Domain/Job relationship records into one searchable index and preserves a pointer to the authoritative source record.

## Current consolidated coverage

- **29 / 29 enterprise Functions**
- **326 canonical enterprise Function × Product records**
- **303 distinct enterprise products across those Function records**
- **16 / 16 CBE professional Domains**
- **570 CBE Job × Tool records**
- **199 distinct CBE specialist products/tools**
- **896 canonical consolidated market relationship records**

### Count semantics

`market-tool-register.csv` currently contains 366 rows in total: **326 ENTERPRISE_FUNCTION** rows and **40 CBE_SPECIALIST** cross-function discovery seeds. The 40 specialist seed rows are deliberately **not duplicated** into this master register because CBE is represented here by the richer 570-row Job × Tool capability register mapped to D01-D16.

## Governing hierarchy

```text
NuBlox Market Benchmark
|
+-- Enterprise Functions F01-F29
|   +-- L2 sub-functions / activities
|   +-- accountable roles and jobs
|   +-- market products and modules
|   +-- operations / tasks
|   +-- work products / transactions / evidence
|   +-- NuBlox canonical capability requirements
|
+-- CBE Professional Domains D01-D16
    +-- Job Profiles
    +-- specialist capabilities
    +-- market products and professional engines
    +-- operations / tasks
    +-- structured work products
    +-- NuBlox canonical capability requirements
```

## Enterprise Function coverage

| Function | Function name | Function × Product records | Distinct products |
| --- | --- | ---: | ---: |
| F01 | Strategy & Enterprise Planning | 10 | 10 |
| F02 | Corporate Governance | 7 | 7 |
| F03 | Enterprise Performance Management | 11 | 11 |
| F04 | Corporate Development & M&A | 8 | 8 |
| F05 | Product, Service & Innovation Management | 10 | 10 |
| F06 | Marketing & Brand | 10 | 10 |
| F07 | Sales & Commercial Management | 10 | 10 |
| F08 | Customer Service, Experience & Success | 10 | 10 |
| F09 | Procurement & Supplier Management | 10 | 10 |
| F10 | Demand, Supply Chain & Logistics | 10 | 10 |
| F11 | Manufacturing / Production Operations | 10 | 10 |
| F12 | Service Delivery & Field Operations | 10 | 10 |
| F13 | Quality Management | 12 | 12 |
| F14 | Finance, Accounting, Treasury & Tax | 15 | 15 |
| F15 | Human Resources / Human Capital | 12 | 12 |
| F16 | Information Technology | 12 | 12 |
| F17 | Data, Analytics & AI | 14 | 14 |
| F18 | Cybersecurity & Information Security | 14 | 14 |
| F19 | Legal & Corporate Secretariat | 12 | 12 |
| F20 | Risk, Compliance, Internal Control & Audit | 10 | 10 |
| F21 | Privacy & Information Governance | 8 | 8 |
| F22 | Property, Facilities & Physical Assets | 12 | 12 |
| F23 | Health, Safety, Environment & Sustainability | 14 | 14 |
| F24 | Business Continuity, Crisis & Physical Security | 11 | 11 |
| F25 | Communications, Public Affairs & Investor Relations | 9 | 9 |
| F26 | Knowledge, Document & Records Management | 17 | 17 |
| F27 | Portfolio, Programme & Project Management | 17 | 17 |
| F28 | Change & Transformation Management | 9 | 9 |
| F29 | Business Process & Continuous Improvement | 12 | 12 |

## CBE Professional Domain coverage

| Domain | Domain name | Job Profiles | Job × Tool records | Distinct tools |
| --- | --- | ---: | ---: | ---: |
| D01 | Architecture & Design | 4 | 41 | 20 |
| D02 | Engineering & Technical Design | 8 | 60 | 39 |
| D03 | Surveying, Property & Land | 6 | 40 | 24 |
| D04 | Commercial, Contracts & Cost | 3 | 23 | 14 |
| D05 | Geospatial, Planning & Transport | 5 | 31 | 21 |
| D06 | Site Delivery & Construction Management | 4 | 29 | 14 |
| D07 | Building Trades | 16 | 105 | 25 |
| D08 | Building Services Trades | 9 | 63 | 28 |
| D09 | Energy & Building Performance | 5 | 28 | 24 |
| D10 | Facilities, Property & Asset Operations | 2 | 14 | 11 |
| D11 | Plant, Equipment & Specialist Operations | 8 | 47 | 27 |
| D12 | Utilities & Networks | 3 | 19 | 11 |
| D13 | Heritage, Conservation & Landscape | 5 | 34 | 21 |
| D14 | Supply Chain & Manufacturing | 4 | 24 | 20 |
| D15 | Regulation, Inspection & Compliance | 1 | 6 | 6 |
| D16 | Infrastructure, Land & Rural | 1 | 6 | 6 |

## Evidence chain

The master register is an **index layer**. Use these sources for deeper evidence.

### Enterprise

1. [Market Tool Register](market-tool-register.csv) — Function × Product discovery spine; the canonical enterprise subset is `market_layer=ENTERPRISE_FUNCTION`.
2. [Enterprise Market Module/Task Backlog](enterprise-market-tool-module-task-backlog.csv) — controlled Function × Product research backlog.
3. [Enterprise Deep Capability Register](enterprise-market-tool-deep-capability-register.csv) — verified module/task operations, inputs, outputs, lifecycle, authority, audit and integration semantics.
4. [Enterprise Market Equivalence Classification](enterprise-market-tool-equivalence-classification.csv) — deep anchors versus equivalent product patterns.

### Construction & Built Environment

1. [CBE Job Market Tool Matrix](cbe-job-market-tool-matrix.csv) — 84 Job Profiles with Domain, capability, work-product and representative-tool context.
2. [CBE Job × Tool Capability Register](cbe-job-tool-capability-register.csv) — Job × Tool relationship spine used by this master register.
3. [CBE Module/Task Verification Backlog](cbe-job-tool-module-task-backlog.csv) — detailed product/module verification backlog.
4. [Deep Market Capability Register](market-tool-deep-capability-register.csv) — verified specialist module/task capability evidence.
5. [CBE Specialist Capability Pattern Closure](cbe-specialist-capability-pattern-closure.csv) — canonical capability-pattern closure.
6. The 40 `CBE_SPECIALIST` rows retained in [Market Tool Register](market-tool-register.csv) remain historical/discovery evidence but are not the canonical Domain/Job relationship spine.

## Master register semantics

Each row in `market-tool-master-register.csv` identifies one canonical market relationship and carries:

- scope type and canonical Function/Domain;
- Function participation;
- CBE Job Profile where applicable;
- market category, vendor and product/tool;
- capability/job work and structured work products where available;
- lifecycle stages where available;
- evidence URL and verification status;
- the source record ID and source register.

The detailed source registers remain authoritative for research-specific fields. This master file exists so the benchmark can always be discovered from one place.

## Architectural rule

Market tools are benchmark evidence, migration/interoperability sources and capability tests. Product menus and vendor schemas do not define NuBlox architecture. A native NuBlox capability is justified by materially different work, controlled objects, transactions, lifecycle, authority, evidence or interoperability semantics.

## Maintenance rule

Whenever an `ENTERPRISE_FUNCTION` Product relationship or CBE Job × Tool relationship is added or removed, regenerate this master register and update the counts in this map in the same change.
