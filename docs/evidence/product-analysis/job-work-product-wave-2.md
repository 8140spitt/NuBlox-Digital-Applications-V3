# Job-to-Work-Product Wave 2 — Controls, Engineering, Assurance & Field Work

**Status:** second candidate decomposition complete  
**Date:** 20 September 2026  
**Scope:** sixteen priority jobs, 165 candidate Work Products  
**Register:** `priority-job-work-product-wave-2.csv`

## Purpose

Wave 2 extends the Job-to-Work-Product challenge into commercial contracts, project controls, finance, design management, engineering, regulatory assurance, QHSE, asset management, maintenance and field trades.

The governing question remains:

> **Can the person perform the job and create the controlled work products the job requires?**

All mappings are `candidate-revalidation`. They are product-design evidence, not a claim that every professional/statutory obligation has already been exhaustively captured.

## Wave 2 jobs

| Job archetype | External career | Prior Job Profile treatment | Candidate Work Products |
| --- | --- | --- | ---: |
| Construction Contracts Manager | Career 22 | three partial profiles across F07/F19 | 11 |
| Project Planner | internal | direct F27 profile | 10 |
| Project Controls Manager | internal | direct F27 profile | 12 |
| Project Accountant | internal | three finance profiles | 10 |
| Design Manager | internal / sector-wide | no direct profile | 12 |
| Civil Engineer | Career 18 | no direct profile | 10 |
| Structural Engineer | Career 75 | no direct profile | 10 |
| Building Control Officer | Career 8 | no direct profile | 10 |
| Health & Safety Manager | internal / sector-wide | four F23 profiles | 11 |
| Quality Manager | internal / sector-wide | several F13 profiles | 10 |
| Environmental Manager | internal / sector-wide | two F23 profiles | 10 |
| Asset Manager | internal / sector-wide | three F22 profiles | 11 |
| Maintenance Planner | internal | direct + adjacent F22 profiles | 10 |
| Electrician | Career 32 | no direct profile | 10 |
| Plumber | Career 59 | no direct profile | 10 |
| Construction Plant Operator | Career 26 | no direct profile | 8 |

Total: **165 candidate Work Products**.

Together with Wave 1, J1 has now decomposed **26 priority jobs into 283 candidate Work Products**.

---

# 1. Contracts and commercial control

Construction Contracts Manager confirms that contract management is not one editable Contract form.

The job requires a connected set of durable work products:

```text
Contract
  -> Party Roles
  -> Clauses / Obligations
  -> Key Dates
  -> Notices / Correspondence
  -> Instructions
  -> Commercial Changes
  -> Claims
  -> Applications / Valuations / Certificates
  -> Amendments
  -> Risk / Exception Reporting
  -> Final Account / Closeout
```

NuBlox must preserve the distinction between contractual truth, schedule truth, workflow tasks and finance consequences.

---

# 2. Planning and project controls

Project Planner and Project Controls Manager demonstrate that project controls needs several independent but connected structures:

```text
Scope          WBS / Work Package
Time           Schedule / Activity / Milestone / Dependency
Baseline       immutable Schedule Baseline
Progress       dated Progress Record
Cost           Budget / Commitment / Actual / Accrual
Forecast       versioned Forecast
Risk           Risk / quantified contingency
Change         Project / Commercial Change
Reporting      controlled period snapshot
```

A Gantt screen or cost table on its own is not project controls.

This confirms that **Structure Browser, Enterprise Grid and Calculation Workbench** are mandatory platform primitives.

---

# 3. Project accounting

Project Accountant exposes another cross-functional employment job.

The work crosses:

- project/WBS financial dimensions;
- budget and forecast;
- AP/AR coding;
- accruals/prepayments;
- journal/posting;
- project cost reconciliation;
- period close;
- project financial reporting.

Finance must continue to reference canonical Project, WBS, Contract, Purchase Order and Party identities rather than maintain shadow finance masters.

---

# 4. Design management and engineering

Design Manager, Civil Engineer and Structural Engineer reinforce two different requirements.

## 4.1 Design management is primarily coordination/governance

The Design Manager needs native NuBlox work products for:

- responsibility;
- information requirements;
- delivery plans;
- design programme/interfaces;
- design review;
- coordination issues;
- decisions;
- RFIs/technical queries;
- design change;
- issue/transmittal;
- assurance;
- handover readiness.

## 4.2 Specialist engineering authoring remains CONNECTED where appropriate

Civil and Structural Engineers need specialist authoring for:

- engineering calculations;
- analysis models;
- technical drawings/models;
- some specifications.

NuBlox must still govern the exact:

```text
Information Container
  -> revision
  -> representation
  -> review/check
  -> status
  -> issue/transmittal
  -> query/change
  -> evidence
  -> handover
```

Connected authoring cannot mean an uncontrolled hyperlink to an external file.

---

# 5. Regulatory and assurance roles

Building Control Officer, Health & Safety Manager and Quality Manager require **case, evidence and decision** patterns rather than generic task workflow.

Recurring structures include:

- requirement/application/case;
- inspection plan;
- inspection/test;
- finding/defect/NCR;
- notice;
- investigation;
- CAPA;
- decision;
- certificate;
- regulatory submission;
- controlled report.

This validates the need for reusable:

- Case Workspace;
- Decision Workspace;
- Field/Mobile composition;
- Viewer Workspace;
- Assisted Report Generator.

---

# 6. Environmental management

Environmental Manager proves that sustainability/environmental work must retain operational evidence rather than live only in ESG reporting.

The role requires:

```text
Environmental Management Plan
  -> Aspect / Impact
  -> Permit / Requirement
  -> Inspection
  -> Monitoring / Sampling
  -> Waste Consignment
  -> Incident
  -> Corrective Action
  -> Regulatory Return
  -> Performance Report
```

Environmental reports are downstream views of governed operational evidence.

---

# 7. Asset and maintenance roles

Asset Manager and Maintenance Planner reinforce the whole-life boundary:

```text
Project delivery
  -> System / Asset
  -> Handover Acceptance
  -> Asset Strategy
  -> Criticality / Condition
  -> Maintenance Strategy
  -> Maintenance Plan
  -> Task Template
  -> Maintenance Schedule
  -> Work Order
  -> Failure / Defect / Condition
  -> Lifecycle Replacement
  -> Disposal
```

Handover does not create a second FM asset identity.

Maintenance Work Order is not a workflow Work Item and not a Project Schedule Activity.

---

# 8. Field trades and plant operations

Electrician, Plumber and Construction Plant Operator are important because they test whether NuBlox supports the actual worker, not only managers and office professionals.

The field experience must make it practical to:

- receive/accept work;
- establish site/asset/location context;
- verify competence/permission where relevant;
- complete pre-start/pre-use checks;
- record materials and plant usage;
- capture measurements/tests;
- record defects/failures;
- produce certificates where required;
- capture progress/completion;
- update installed Asset/System evidence;
- record incidents;
- hand work into billing, maintenance and asset history.

That requires **Field/Mobile composition** with offline/resilient interaction as a first-class design target.

A desktop CRUD page is not adequate field support.

---

# 9. New product-level findings

## 9.1 Employment Job Profiles must support cross-functional composition

Wave 2 strengthens the Wave 1 finding.

Direct function-derived profiles are useful for roles such as Project Planner, but jobs such as Project Accountant, Contracts Manager, H&S Manager and Asset Manager naturally compose several Functional Roles.

## 9.2 Workbench composition should follow the job, not the module

A Project Controls Manager should not have to reconstruct the job by navigating separately through Project, Finance, Risk and Contract modules.

The Job Workbench should compose those views over shared truth.

## 9.3 Professional authoring primitives are now a build dependency

Across 283 Wave 1+2 Work Products, the repeated primitives are no longer optional UX ideas:

```text
Enterprise Grid
Calculation Workbench
Structure Browser
Case Workspace
Decision Workspace
Enterprise Change Workspace
Viewer Workspace
Field / Mobile composition
Connected Authoring Adapter
Assisted Report Generator
Import Workbench
```

## 9.4 NuBlox needs work-product families

The detailed rows show stable work-product families emerging:

- Plan / Strategy;
- Register / Schedule;
- Calculation / Model;
- Controlled Information;
- Case / Assessment;
- Inspection / Test;
- Change;
- Decision;
- Transaction / Commitment;
- Execution Record;
- Certificate;
- Report / Snapshot;
- Handover / Closeout.

These are **experience/completeness families**, not a replacement for canonical domain object types.

---

# 10. J1 state after Wave 2

```text
Wave 1: 10 jobs / 118 candidate Work Products
Wave 2: 16 jobs / 165 candidate Work Products

Total:  26 jobs / 283 candidate Work Products
```

This is still a partial sector baseline.

The next waves should close the remaining professional, technician, plant, trade, property, infrastructure, energy and specialist career patterns before J1 is marked complete.

J2 must then convert the candidate mappings into governed Work-Product definitions with exact activity IDs, aggregate ownership, permissions/authority, lifecycle/version semantics, integration boundaries and acceptance references.
