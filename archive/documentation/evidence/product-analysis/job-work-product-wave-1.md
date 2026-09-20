# Job-to-Work-Product Wave 1 — Professional Role Challenge

**Status:** first candidate decomposition complete  
**Date:** 20 September 2026  
**Scope:** ten priority construction/built-environment jobs, 118 candidate Work Products  
**Register:** `priority-job-work-product-wave-1.csv`

## Purpose

This wave tests the new Job-to-Work-Product architecture against jobs that real construction and built-environment organisations employ.

The question is not whether NuBlox has a function, route or object with a related name.

The question is:

> **Can the person perform the job and create the work products the job requires?**

## Wave 1 jobs

| Job archetype | External career baseline | Prior generated Job Profile treatment | Candidate Work Products |
| --- | --- | --- | ---: |
| Quantity Surveyor | Career 60 | no direct sector Job Profile | 14 |
| Estimator | Career 34 | no direct sector Job Profile | 10 |
| Project Manager | internal / sector-wide | split across three F27 profiles | 13 |
| Construction Manager | Career 24 | partial match to Construction Project Manager | 13 |
| Construction Site Supervisor | Career 27 | no direct sector Job Profile | 10 |
| Architect | Career 3 | no sector Architect Job Profile | 14 |
| Building Services Engineer | Career 9 | no direct sector Job Profile | 10 |
| Building Surveyor | Career 10 | no direct sector Job Profile | 10 |
| Facilities Manager | Career 35 | partial match to F22 Facilities Manager | 12 |
| Procurement Manager | internal / sector-wide | spread across F09 lead/strategy/contracts profiles | 12 |

Total: **118 candidate Work Products**.

Every mapping is deliberately marked `candidate-revalidation`. The wave establishes the product scope to validate, not a claim that every professional obligation has already been exhaustively specified.

---

# 1. Primary finding — the 382-profile baseline is not yet an employment-job architecture

The prior generated 382 Job Profiles are valuable, but their construction method is primarily:

```text
Enterprise Function
  -> L2 Sub-function
     -> Functional Role
        -> generated Function Lead / Professional profile
```

That produces strong **functional capability roles**.

It does not automatically produce the jobs that a construction business actually recruits.

For example:

- Quantity Surveyor crosses estimating, sales/commercial, procurement, finance and project control.
- Architect crosses project delivery, controlled information, design review, quality/site inspection and handover.
- Building Services Engineer crosses technical information, Item/product data, commissioning, quality and asset handover.
- Construction Manager crosses project control, site/field work, people/resource allocation, logistics, quality and HSE.
- Building Surveyor crosses property/asset context, professional services, inspection, controlled reporting, maintenance and contract/legal consequences.

A real Job Profile therefore has to be able to **compose Functional Roles from several enterprise functions**.

## Decision

NuBlox now distinguishes:

```text
Functional Role
  = reusable responsibility/capability unit
  = may belong primarily to one F01-F29 sub-function

Job Profile
  = employable definition of work
  = composes one or many Functional Roles
  = may cross many enterprise functions

Position
  = tenant/organisation seat using a Job Profile

Person
  = occupies the Position
```

A Job Profile must never be forced to remain inside one enterprise function simply because the Functional Roles were generated there.

---

# 2. Work-product findings by professional pattern

## 2.1 Commercial / cost roles

Quantity Surveyor and Estimator immediately require platform-grade:

- measurement / take-off;
- estimating;
- resource/rate build-ups;
- supplier/subcontract enquiries;
- tender comparisons;
- adjudication;
- contract-value structures;
- change assessment;
- valuations / payment assessment;
- forecast / CVR;
- cost reporting;
- final account.

This confirms that an end-to-end construction ERP requires **Enterprise Grid + Calculation Workbench + commercial structures**, not ordinary CRUD forms.

## 2.2 Project / site roles

Project Manager, Construction Manager and Site Supervisor require a continuous chain across:

```text
Project / WBS
 -> Schedule
 -> Work Package
 -> Labour / Plant / Material
 -> Site Diary
 -> Progress
 -> Quality / HSE
 -> Information Query
 -> Change / Delay
 -> Handover
```

The project/site experience must therefore be contextual and mobile-capable.

A generic Project record page is nowhere near sufficient.

## 2.3 Design / engineering roles

Architect and Building Services Engineer prove that NuBlox must support both:

- structured native professional records; and
- connected specialist authoring.

Drawings, BIM/design models, engineering calculations and some specifications remain appropriate CONNECTED work products where specialist tools are required.

NuBlox must still govern:

- canonical Information Container identity;
- context;
- revision;
- classification;
- review;
- approval;
- issue/transmittal;
- query/change relationships;
- evidence;
- handover.

Connected authoring is therefore a first-class platform pattern, not an integration afterthought.

## 2.4 Surveying / property roles

Building Surveyor requires:

- spatial/property context;
- mobile inspections;
- condition assessment;
- defect schedules;
- photographs/evidence;
- professional reports;
- contractual/lease context where applicable;
- remedial scopes;
- lifecycle/maintenance planning.

This requires a linked Property/Asset/Spatial + Information + Work architecture.

## 2.5 Facilities / operational roles

Facilities Manager proves that the product has to continue beyond project handover into:

- Asset/Property register stewardship;
- PPM planning;
- Work Orders;
- statutory inspections;
- service contractors;
- SLAs;
- utilities;
- budgets;
- condition;
- lifecycle replacement.

"Project-to-Asset" has to be an actual information/work continuity chain.

## 2.6 Procurement roles

Procurement Manager requires a native chain:

```text
Strategy / Category Plan
 -> Supplier qualification
 -> Procurement Package
 -> Sourcing Event
 -> RFQ / RFP
 -> Bid Response
 -> Evaluation
 -> Award
 -> PO / Subcontract Commitment
 -> Receipt / Invoice
 -> Supplier Performance / Risk
```

The procurement job cannot be reduced to Purchase Orders.

---

# 3. Authoring-mode implications

Wave 1 deliberately uses all four modes.

## NATIVE

Dominant for structured ERP truth:

- estimate;
- schedule;
- cost plan;
- valuation;
- sourcing event;
- inspection;
- Work Order;
- permit;
- progress;
- budget;
- forecast;
- asset/maintenance records.

## ASSISTED

Used where NuBlox structured truth should produce a controlled professional output:

- cost report;
- commercial recommendation;
- project status report;
- survey report;
- certificate/professional statement;
- tender submission;
- facilities performance report.

## CONNECTED

Required where specialist authoring remains appropriate:

- architectural drawings/models;
- MEP models/drawings;
- engineering calculations;
- some specifications;
- as-built specialist models.

## INGESTED

Not dominant in the initial rows but required for inputs such as:

- tender returns;
- supplier data;
- external surveys;
- test certificates;
- handover datasets;
- manufacturer/product feeds.

Later waves must model INGESTED work more explicitly.

---

# 4. Product primitives confirmed by Wave 1

The wave validates the need for these platform primitives:

```text
Job Workbench
My Work
Enterprise Context
Object Workspace
Collection View
Split Work Mode
Enterprise Grid
Calculation Workbench
Structure Browser
Enterprise Change Workspace
Viewer Workspace
Map / Spatial Workspace
Field / Mobile composition
Import Workbench
Connected Authoring Adapter
Assisted Report Generator
Decision Workspace
```

Several of these do not exist in runtime yet.

That is now a product gap, not simply a UX enhancement.

---

# 5. Work-product identity rule

Do not create a universal `work_products` table that duplicates domain truth.

"Work Product" is initially a **product-definition / coverage concept**.

At runtime, its truth may be carried by:

- Estimate;
- Schedule;
- Work Package;
- Information Container;
- Inspection;
- Permit;
- Commercial Change;
- Valuation;
- Work Order;
- Budget;
- Forecast;
- Decision;
- controlled reporting snapshot;
- another canonical business object.

The Job Workbench resolves a Work-Product definition to the relevant object/create/action experience.

Only introduce a separate runtime Work Product aggregate if a later semantic review establishes genuinely independent identity and lifecycle.

---

# 6. Immediate architecture consequences

## 6.1 Do not generate employment Job Profiles one-for-one from L2 functions

The old generated profiles remain provenance and candidate inputs.

Future V3 Job Profiles must support cross-functional composition.

## 6.2 Add Work Products to Job Profile design

A Job Profile needs explicit:

- Functional Roles;
- accountabilities;
- Work Products;
- create/review/approve/use responsibility;
- expected contexts;
- required competence;
- performance measures.

## 6.3 Job Workbench is now a real target runtime primitive

A Quantity Surveyor workbench and Architect workbench are different compositions over shared objects.

They must not become separate data architectures.

## 6.4 Build primitives based on actual work

Wave 1 makes **Enterprise Grid** and **Calculation Workbench** urgent for commercial/project roles.

It makes **Connected Authoring Adapter + Viewer** urgent for design/engineering.

It makes **Field/Mobile + Spatial context** urgent for site/survey/facilities roles.

This gives us a better implementation sequence than simply following F01 through F29.

---

# 7. J1 continuation

Wave 2 should cover the next employment patterns:

- Commercial / Contracts Manager;
- Planner / Project Controls Manager;
- Buyer / Procurement Specialist;
- Finance Manager / Project Accountant;
- Design Manager;
- Civil Engineer;
- Structural Engineer;
- Land Surveyor;
- Building Control Officer;
- Health & Safety Adviser / Manager;
- Quality Manager / Inspector;
- Environmental / Sustainability roles;
- Asset Manager;
- Maintenance Planner / Technician;
- Electrician;
- Plumber;
- Plant Operator;
- key construction trades.

The full J1 gate is not complete until all 84 external career profiles and all approved V3 Job Profiles have explicit Work-Product treatment.
