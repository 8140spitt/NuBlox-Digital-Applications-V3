# NuBlox Job-to-Work-Product Architecture

**Status:** governing product architecture  
**Established:** 20 September 2026  
**Applies to:** product completeness, job architecture, Position/Person experience, Home/My Work, Operate/Deliver/Enterprise Data, F01-F29, canonical objects, workbenches and integration boundaries  
**Preserves:** canonical aggregate ownership, permission/authority separation, Enterprise Interaction Architecture and the 29-function capability taxonomy

## Executive decision

NuBlox is complete only when a person employed in a role can use NuBlox to **perform the work they are employed to perform and produce the controlled work products expected from that role**, while preserving enterprise context, authority, evidence and end-to-end handoff.

The governing product question is therefore:

> **If an organisation employs this person tomorrow, can they sit down in NuBlox and perform the job they were hired to do?**

And, for every material output:

> **Can they create, develop, review, approve, issue, hand over and later retrieve the work product expected from that job?**

This product test sits beside — and is stricter than — function, object, route or database coverage.

A function can be architecturally mapped while a worker still cannot do their job.  
A business object can exist while the required professional work product cannot be authored.  
A workflow can exist while the user lacks the calculations, structures, evidence capture or specialist-tool connection required to complete the work.

NuBlox must close those gaps.

---

# 1. Governing traceability model

The existing enterprise-work chain remains:

~~~text
Enterprise Function
  -> Sub-function
     -> Activity
        -> Capability / Process
           -> Canonical Object
              -> Command / Workflow
                 -> Decision / Evidence
~~~

The job/work-product chain is an orthogonal view of the same work:

~~~text
Person
  -> Worker Relationship
     -> Position
        -> Job Profile
           -> Functional Role
              -> Activity / Accountability
                 -> Work Product
                    -> Authoring Experience
                       -> Canonical Object(s)
                          -> Workflow / Decision / Evidence
                             -> Handoff / Business Outcome
~~~

Security remains separate:

~~~text
Access Role / Permission / Scope / Delegated Authority
  -> determines what the person is authorised to see or do
  -> does NOT derive automatically from Job Profile, Position or Career
~~~

The same enterprise work is therefore challenged from three directions:

1. **Function** — what work must the enterprise perform?
2. **Job** — what work must this person perform?
3. **Work product** — what durable output proves the work was actually done?

---

# 2. Concepts that must remain separate

~~~text
Enterprise Function != Functional Role
Functional Role != Job Profile
Job Profile != Position
Position != Person
Career != Job Profile
Job Profile != Access Role
Responsibility != Permission
Permission != Delegated Authority
Activity != Work Product
Work Product != Canonical Object
Canonical Object != Screen
Work Product != File
Representation != Business Truth
Physical Outcome != Digital Record
~~~

These distinctions are non-negotiable.

## 2.1 Career

A **Career** is an external/professional classification such as Quantity Surveyor, Architect, Electrician or Facilities Manager.

A career may map to several NuBlox Job Profiles and levels.

The current National Careers Service construction and built-environment catalogue exposes **84 job profiles**. It is an external coverage source, not NuBlox's internal employment model.

Current source:

https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers

## 2.2 Job Profile

A **Job Profile** is NuBlox's reusable controlled definition of employable work.

It composes Functional Roles and defines, at minimum:

- purpose;
- accountabilities;
- expected work products;
- required knowledge / skills / competencies;
- qualifications / credentials where relevant;
- performance measures;
- source functional-role mappings.

The prior NuBlox generated baseline contains:

- 29 job families;
- 353 Functional Roles;
- 382 candidate Job Profiles;
- 1,510 inherited source activities.

Those are candidate source inputs for V3 revalidation, not proof that the work-product model is complete.

## 2.3 Position

A **Position** is an organisation-specific seat/capacity defined by a Job Profile.

A Position may add local:

- title;
- team / reporting context;
- legal entity;
- location;
- project/programme assignment;
- grade;
- FTE/capacity;
- effective dates.

It does not rewrite the canonical Job Profile.

## 2.4 Work Product

A **Work Product** is a durable output produced, developed, reviewed or issued through professional/operational work.

Examples include:

- strategy;
- business plan;
- board pack;
- decision paper;
- estimate;
- take-off;
- BOQ;
- rate build-up;
- tender comparison;
- contract notice;
- valuation;
- cost report;
- forecast;
- programme;
- WBS;
- design;
- calculation;
- drawing;
- model;
- specification;
- RFI;
- inspection;
- site diary;
- permit;
- test record;
- certificate;
- purchase order;
- invoice;
- timesheet;
- risk assessment;
- audit finding;
- maintenance plan;
- work order;
- condition survey;
- asset handover data.

A Work Product may be:

- a structured canonical business object;
- a controlled snapshot/report generated from several objects;
- an Information Container with one or more representations;
- a structure such as a WBS/BOM/schedule;
- a governed decision/evidence package;
- a connected specialist-authoring artefact.

A file alone is not necessarily the Work Product.

---

# 3. Work-product authoring modes

Every material Work Product must be classified into one of four authoring modes.

## 3.1 NATIVE

NuBlox owns the structured authoring experience and business semantics.

Examples:

- Estimate;
- Purchase Order;
- Cost Forecast;
- Contract Notice;
- Valuation;
- Work Order;
- Site Diary;
- Inspection;
- Timesheet;
- Risk / Control / Finding;
- Maintenance Plan.

The user performs the substantive work in NuBlox.

## 3.2 ASSISTED

NuBlox owns the structured source data and assists generation of a professional output or representation.

Examples:

- formal cost report;
- board paper;
- management report;
- inspection report;
- commercial recommendation;
- certificate;
- client progress report.

The source truth remains structured. PDF/Word/Excel or other rendered output is a representation, not a replacement for the underlying facts.

## 3.3 CONNECTED

A specialist authoring tool performs the specialist content creation while NuBlox governs identity, context, version, status, workflow, relationships, issue/approval, evidence and handoff.

Examples may include:

- Revit model;
- AutoCAD drawing;
- Tekla model;
- Civil 3D model;
- specialist structural-analysis model;
- GIS dataset;
- specialist simulation/model.

NuBlox must make the connected artefact feel like part of the user's job without pretending to be the specialist authoring engine.

## 3.4 INGESTED

The Work Product or data originates outside NuBlox and is brought into governed enterprise use.

Examples:

- supplier catalogue;
- tender return;
- bank statement;
- external survey dataset;
- subcontractor schedule;
- asset handover file;
- external test certificate.

The correct experience is:

~~~text
Source
  -> Staging
     -> Mapping
        -> Validation
           -> Exceptions
              -> Preview
                 -> Authorised Commit / Link
                    -> Provenance
~~~

Raw import never bypasses canonical invariants.

---

# 4. Physical work and real-world outcomes

Construction and built-environment jobs often produce **physical outcomes**, not only digital artefacts.

A bricklayer produces masonry.  
An electrician installs and tests electrical systems.  
A plant operator moves/excavates material.  
A welder creates physical welded joints.  
A maintenance technician repairs equipment.

NuBlox does not claim to perform the physical act.

It must enable and govern the surrounding work:

~~~text
Instruction / Work Package
  -> planned labour / plant / materials
     -> method / permit / safety controls
        -> execution progress
           -> material / time / plant consumption
              -> inspection / test / quality evidence
                 -> defect / exception
                    -> completion / acceptance
                       -> as-built / asset / cost consequences
~~~

For physical roles, the product-completeness test is:

> Can the worker receive, execute, record, evidence and hand over the work they are employed to carry out?

---

# 5. The Job Workbench

A **Job Workbench** is a runtime composition of shared NuBlox capabilities for a Job Profile / Position.

It is **not**:

- a new aggregate;
- a copy of enterprise data;
- a role-specific mini-application;
- a permission grant;
- a replacement for F01-F29;
- a replacement for canonical object workspaces.

It answers:

> **What do I need to do my job?**

The Job Workbench composes:

- My Work;
- current enterprise/project/contract/site/asset context;
- accountabilities;
- work products due/in progress;
- create actions for authorised Work Products;
- role-relevant collections;
- exceptions;
- approvals/decisions;
- connected specialist tools;
- templates / standards / reference data;
- performance measures;
- recent/favourite contexts.

Conceptually:

~~~text
Job Workbench
  =
Job Profile work-product catalogue
  + Position/local responsibility
  + Current business context
  + My Work
  + actual permissions/scopes
  + delegated authority
  + current lifecycle/process state
~~~

Job Profile describes expected work.

Security decides what the current Person may actually execute.

A mismatch between expected work and actual authority should become a visible configuration/control exception, not an implicit permission grant.

---

# 6. Work-product definition contract

Every governed Work Product definition must eventually contain:

| Field | Purpose |
| --- | --- |
| work_product_id | Stable product identity |
| name | Business/professional name |
| family | Work-product family |
| career_mappings | Relevant external careers |
| job_profile_mappings | NuBlox Job Profiles expected to create/review/use it |
| functional_role_mappings | Functional Roles/accountabilities |
| source_activities | Fxx.xx.Axx source activities |
| enterprise_stream | Operate / Deliver / Enterprise Data |
| context_types | Project / Contract / Asset / Organisation etc. |
| authoring_mode | NATIVE / ASSISTED / CONNECTED / INGESTED |
| canonical_object | Primary governed object or projection |
| aggregate_owner | Command-owning aggregate |
| inputs | Required source facts / predecessor products |
| authoring_primitive | Grid / structure / form / viewer / map / workbench etc. |
| lifecycle | Draft/review/approved/issued etc. |
| version_semantics | Revision/version/effectivity rules |
| decision_authority | Required decision/delegated authority |
| evidence | Required completion/approval evidence |
| representation | PDF/XLSX/model/file outputs where applicable |
| downstream_handoff | Consumer/process consequence |
| integration | External authoring/data systems where relevant |
| implementation_state | planned/designed/implemented/verified |
| acceptance_reference | Automated/manual proof that the role can produce it |

Work products must not be invented only to fill a matrix. They require professional/business validation.

---

# 7. Job-profile completeness contract

An approved NuBlox Job Profile is not product-complete until:

1. its accountabilities are mapped to source activities;
2. every material expected Work Product is named explicitly;
3. every Work Product has an authoring mode;
4. every Work Product maps to canonical object/aggregate truth;
5. required calculations / grids / structures / viewers / forms are defined;
6. inputs and predecessor Work Products are known;
7. lifecycle/version rules are known;
8. collaboration and handoffs are known;
9. permission and delegated-authority requirements are known;
10. evidence and audit requirements are known;
11. connected/ingested external-tool boundaries are explicit;
12. the Position-level Job Workbench can surface the required work;
13. a realistic end-to-end role acceptance test proves that a competent person can perform the job.

The current generated 382-profile baseline does **not** yet meet this test.

Its generic expected-output wording is useful seed material but must be decomposed into professional Work Products.

---

# 8. Career completeness contract

The current National Careers Service construction/built-environment list is an external market-coverage lens.

As at 20 September 2026 the official catalogue presents **84 career profiles**.

NuBlox should maintain a governed Career -> Work Product baseline for all 84, while recognising that:

- a Career may map to multiple Job Profiles;
- a tenant Job Profile may use a different title;
- Careers do not grant access;
- professional institutions / statutory regimes may require additional specialist outputs beyond the National Careers Service summary;
- the Career baseline is a challenge to product scope, not the internal employment ontology.

The first imported V3 baseline is:

construction-career-work-product-baseline.csv

Every row begins as **candidate-revalidation**.

---

# 9. Examples

## 9.1 Quantity Surveyor

Representative work-product chain:

~~~text
Project / Contract context
  -> Measurement / Take-off
  -> Estimate / Cost Plan
  -> Rate Build-up
  -> Supplier/Subcontract Enquiry
  -> Tender Comparison
  -> Commercial Recommendation
  -> Budget / Commitment
  -> Change Assessment
  -> Valuation / Application
  -> Forecast
  -> Cost-Value Reconciliation
  -> Cost Report
  -> Final Account
~~~

The user may need:

- Enterprise Grid;
- Estimate structure;
- Contract workspace;
- supplier RFQ integration;
- change workspace;
- valuation/certificate workflow;
- finance/project-cost projections;
- assisted formal reporting.

A Quantity Surveyor job is not covered merely because F07/F09/F14/F27 exist.

## 9.2 Construction Manager / Site Manager

Representative outputs:

~~~text
Work Package Plan
Look-ahead Programme
Daily Plan / Allocation
Site Diary
Progress Record
Material / Delivery Record
Plant / Labour Record
RFI / Technical Query
Inspection Request
Quality Inspection
Defect / Snag
Permit / Safety evidence
Delay / Disruption Record
Progress Report
Handover evidence
~~~

The worker needs a field-appropriate composition of Project, Site, Programme, Work Package, Location, Information, Plant, People, QHSE and Progress.

## 9.3 Architect

Representative outputs:

~~~text
Brief response
Design option
Drawing
BIM model
Specification
Schedule
Design decision
Planning submission
Technical information issue
RFI response
Site review / inspection
Change / revision
Handover information
~~~

NuBlox may author some records natively but should treat CAD/BIM authoring as CONNECTED where specialist authoring systems remain the appropriate tool.

The governing Information Container, classification, revision, issue, approval, relationship and evidence chain remains in NuBlox.

## 9.4 Facilities Manager

Representative outputs:

~~~text
Asset / Property register
Maintenance strategy
PPM plan
Service request
Work order
Inspection
Compliance record
Contractor instruction
SLA/performance review
Budget / lifecycle forecast
Condition assessment
Replacement plan
~~~

This proves that job coverage must continue from capital delivery through operations.

## 9.5 Trade / field operative

Representative digital Work Products:

~~~text
Accepted task/work order
Pre-use / pre-start check
Time / attendance evidence
Material consumption
Plant/tool usage
Progress
Quality check
Photo/evidence
Defect / exception
Test result where applicable
Completion / handover
~~~

The physical installed/built outcome is real-world execution; NuBlox governs the plan, record and evidence.

---

# 10. Relationship to the Enterprise Interaction Architecture

The Enterprise Interaction hierarchy becomes:

~~~text
Tenant / Enterprise
        |
Person / Position / Job Profile
        |
Job Workbench + My Work
        |
Enterprise Context
        |
Operate / Deliver / Enterprise Data
        |
Process / Function / Context Workspace
        |
Work Product Authoring
        |
Collection / Grid / Structure / Map / Viewer / Form
        |
Canonical Object(s)
        |
Action / Decision / Change / Evidence
        |
History / Events / Audit
~~~

A Person may still enter through:

- My Work;
- a Job Workbench;
- Enterprise Search;
- Operate / Deliver / Enterprise Data;
- a Project/Contract/Asset context;
- F01-F29;
- a canonical object relationship.

All paths converge on the same canonical truth.

---

# 11. Product-completeness metrics

NuBlox must track at least four separate coverage measures.

## 11.1 Function coverage

~~~text
29 functions
353 sub-functions
1,510 activities
~~~

Question:

> Is the enterprise work mapped?

## 11.2 Object/runtime coverage

Question:

> Are the required canonical identities, commands, lifecycles and evidence implemented?

## 11.3 Job coverage

Question:

> Can every approved Job Profile perform its accountabilities?

## 11.4 Work-product coverage

Question:

> Can every required Work Product be created/governed through its declared authoring mode?

A green function matrix with red Job/Work-Product coverage is **not a complete product**.

---

# 11A. J1 checkpoint — 20 September 2026

Four job/work-product decomposition waves are now complete.

```text
Wave 1: 10 jobs / 118 candidate Work Products
Wave 2: 16 jobs / 165 candidate Work Products
Wave 3: 20 jobs / 200 candidate Work Products
Wave 4: 49 jobs / 392 candidate Work Products

Total:  95 job archetypes / 875 candidate Work Products
```

Wave 1 established the first cross-functional employment-job challenge across quantity surveying, estimating, project/site management, architecture, building services, building surveying, facilities and procurement.

Wave 2 extends the challenge across contracts, planning, project controls, project accounting, design management, civil/structural engineering, building control, QHSE, asset management, maintenance and field trades.

Wave 3 extends it across technical design support, geospatial and land surveying, energy assessment, fire engineering, property surveying, heritage, development/town planning and transport planning.

Wave 4 closes the remaining external-career patterns across building trades, fit-out, building-services installation/maintenance, utilities and networks, plant/specialist operations, manufacturing/supply, rural/external works and support roles.

A material architecture finding is now explicit: the prior 382 generated Job Profiles are primarily function/sub-function-derived capability profiles. They are useful provenance, but they are **not yet a complete employment-job architecture** for construction and the built environment.

V3 therefore permits one Job Profile to compose Functional Roles from several F01-F29 functions while keeping Job Profile, Position, permission, responsibility and delegated authority distinct.

The 875 candidate Work Products reinforce the reusable [Work-Product Family Taxonomy](work-product-family-taxonomy.md). This taxonomy reduces hundreds of professional outputs into repeatable authoring patterns without introducing a universal runtime Work Product aggregate.

See:

- `job-work-product-wave-1.md`;
- `job-work-product-wave-2.md`;
- `job-work-product-wave-3.md`;
- `job-work-product-wave-4.md`;
- `priority-job-work-product-wave-1.csv`;
- `priority-job-work-product-wave-2.csv`;
- `priority-job-work-product-wave-3.csv`;
- `priority-job-work-product-wave-4.csv`;
- `professional-job-architecture-gap-register.csv`;
- `work-product-family-taxonomy.md`.

External career treatment is **84/84** at candidate-decomposition level, and the inherited internal source inventory is now **382/382 employment-reconciled**.

The source reconciliation produces **374 distinct employment jobs** after true duplicate/lifecycle compositions. Merging the 95 sector Wave archetypes adds 88 jobs that are not exact-title matches, producing a **462-job candidate employment catalogue**.

```text
382 inherited source profiles
  -> 374 distinct reconciled employment jobs
  + 88 additional Wave employment jobs
  = 462 candidate employment jobs
```

The internal employment-reconciliation gate is therefore closed.

**J1 remains open** because employment identity is not Work-Product completeness. The next J1 gate is explicit Work-Product, exact activity, handoff, authoring, canonical-object, lifecycle/evidence and Job Workbench coverage across the 462-job catalogue.

See `job-profile-reconciliation.md`, `job-profile-reconciliation-register.csv`, `employment-job-catalogue.csv` and `employment-job-catalogue.md`.

---

# 12. Implementation programme

## J0 — establish the governed baseline

- adopt this architecture;
- import all 84 current construction/built-environment Career baseline rows;
- import the 382 prior candidate Job Profiles as V3 revalidation inputs;
- preserve source provenance;
- mark generic expected outputs as needing Work-Product decomposition.

## J1 — define Work-Product taxonomy

For every Job Profile:

- identify material Work Products;
- eliminate vague generic outputs;
- map each Work Product to source activities;
- map Career synonyms / professional variants;
- identify input/output handoffs.

## J2 — map product architecture

For every Work Product:

- authoring mode;
- canonical object;
- aggregate owner;
- process/context;
- lifecycle/version semantics;
- permissions/authority;
- evidence;
- downstream consequences.

Unmapped Work Products become explicit product gaps.

## J3 — map authoring experiences

Classify which shared primitives are required:

- Collection View;
- Enterprise Grid;
- Structure Browser;
- Object Workspace;
- focused Form;
- Calculation Workbench;
- Viewer;
- Map/Spatial Workspace;
- Import Workbench;
- Connected Authoring Adapter;
- Assisted Report Generator;
- Field/Mobile composition.

## J4 — Job Workbench runtime

Build role/persona composition from:

~~~text
Position -> Job Profile -> Work Products
+ My Work
+ Current Context
+ Actual Authority
~~~

without duplicating canonical data or deriving permissions from jobs.

## J5 — role acceptance suites

Create executable professional scenarios such as:

- Quantity Surveyor;
- Estimator;
- Project Manager;
- Construction Manager;
- Architect;
- Building Services Engineer;
- Procurement Manager;
- Finance Manager;
- Facilities Manager;
- Building Surveyor;
- Site Supervisor;
- key trade/field roles.

Each scenario must prove real Work Products and end-to-end handoffs.

## J6 — complete construction/built-environment coverage

Do not claim role completeness until:

- every approved internal Job Profile has complete Work-Product coverage;
- all 84 external career profiles have an explicit NuBlox treatment;
- intentional CONNECTED/INGESTED boundaries are documented;
- physical-work roles have complete planning/execution/evidence support;
- material gaps are either implemented or explicitly out of scope.

---

# 13. Immediate development gate

Before adding another major runtime object/screen, ask:

1. Which Job Profiles create/use this?
2. Which accountability/activity does it satisfy?
3. What Work Product is the user actually trying to produce?
4. Is the Work Product NATIVE, ASSISTED, CONNECTED or INGESTED?
5. What canonical object(s) carry its truth?
6. What context must persist?
7. Which authoring primitive does a competent professional need?
8. What calculation/structure/model/data input is required?
9. Who reviews/approves/issues it?
10. What is the downstream handoff?
11. What evidence proves completion?
12. Can the Position-level Job Workbench surface it?
13. Is there an end-to-end acceptance scenario?

If those questions are unanswered, the feature is not sufficiently defined to build.

---

# 14. Governing success test

The V3 success test is expanded to:

> A sophisticated construction/built-environment organisation can define its Positions and Job Profiles, assign people to those Positions, and show that each person can perform the work they are accountable for, produce the required Work Products, collaborate and obtain decisions under the correct authority, hand results into the next business process, and retrieve the evidence behind the outcome — without reconstructing the job across disconnected systems.

That is the standard NuBlox should build toward.
