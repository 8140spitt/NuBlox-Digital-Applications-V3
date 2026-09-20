# NuBlox Work-Product Family Taxonomy

**Status:** governing product-definition taxonomy  
**Established:** 20 September 2026  
**Evidence base:** J1 Waves 1-6 — 205 employment jobs / 1,360 candidate or explicit Work Products; all 84 external careers explicitly treated  
**Purpose:** classify user-visible work products without creating a universal runtime Work Product aggregate

## Governing rule

A Work-Product Family describes **the kind of professional/operational output a user is trying to produce**.

It is an experience and completeness classification.

It does **not** replace:

- canonical domain object identity;
- aggregate ownership;
- lifecycle definition;
- Information Container type;
- workflow;
- permission;
- delegated authority.

The same family can be implemented by different canonical objects in different domains.

Example:

```text
PLAN family
  -> Project Schedule
  -> Maintenance Plan
  -> Procurement Plan
  -> Quality Plan
  -> Environmental Management Plan
```

These remain different domain objects even though users interact with them through related planning patterns.

---

# 1. PLAN / STRATEGY

**Intent:** define an intended future state, policy, approach or coordinated course of action.

Examples:

- Asset Strategy;
- Procurement Strategy;
- Project Management Plan;
- Quality Plan;
- Environmental Management Plan;
- Maintenance Plan;
- Resource Plan;
- Recovery Plan.

Typical experience:

- Object Workspace;
- Structure Browser;
- Enterprise Grid;
- Decision/approval;
- effective dates;
- controlled revision.

Typical lifecycle:

```text
Draft -> Review -> Approved -> Effective -> Superseded / Retired
```

---

# 2. REGISTER / SCHEDULE

**Intent:** maintain a governed structured set of related items, dates, responsibilities or statuses.

Examples:

- Contract Obligation Register;
- Key Date Register;
- Equipment Schedule;
- Deliverable Register;
- Defect Schedule;
- Asset Register;
- Maintenance Schedule.

Typical experience:

- Enterprise Grid;
- filtering/sorting;
- bulk edit;
- saved views;
- import/export;
- relationship drill-through.

A Register must not become a shadow master for canonical identities it references.

---

# 3. STRUCTURE / BREAKDOWN

**Intent:** decompose scope, product, asset or information into governed hierarchy/network.

Examples:

- WBS;
- estimate breakdown;
- BOM/product structure;
- system hierarchy;
- asset hierarchy;
- contract value schedule.

Typical experience:

- Structure Browser;
- tree/grid hybrid;
- drag/reorder where semantically valid;
- effectivity/version control;
- roll-up calculations.

Structure is distinct from workflow and from folder navigation.

---

# 4. CALCULATION / MODEL

**Intent:** derive an analytical, engineering, commercial or financial result from controlled inputs.

Examples:

- estimate;
- rate build-up;
- structural calculation;
- engineering analysis model;
- cost forecast;
- lifecycle cost model;
- earned-value position.

Typical experience:

- Calculation Workbench;
- Enterprise Grid;
- assumption/input management;
- scenario/version control;
- provenance;
- review/check.

Authoring mode may be NATIVE or CONNECTED depending on specialist depth.

---

# 5. CONTROLLED INFORMATION

**Intent:** create or govern information with revision/status/issue semantics.

Examples:

- drawing;
- specification;
- technical schedule;
- model;
- calculation document;
- policy;
- method statement;
- report representation.

Typical experience:

- Object Workspace;
- Viewer Workspace;
- Connected Authoring Adapter;
- revision;
- representation;
- classification;
- review;
- issue/transmittal.

Controlled Information is usually governed through Information Container semantics.

---

# 6. CASE / ASSESSMENT

**Intent:** investigate, assess or resolve a matter requiring evidence, judgement and disposition.

Examples:

- commercial claim;
- compliance case;
- incident investigation;
- NCR;
- warranty claim;
- supplier risk assessment;
- condition assessment.

Typical experience:

- Case Workspace;
- evidence panel;
- participants;
- findings;
- actions;
- decision/disposition;
- timeline.

Case state must not be overloaded onto the underlying subject object.

---

# 7. INSPECTION / TEST

**Intent:** verify a subject against explicit criteria at a defined time/context.

Examples:

- quality inspection;
- statutory inspection;
- electrical test;
- commissioning test;
- plant pre-use check;
- environmental sample/test.

Typical experience:

- Field/Mobile composition;
- checklist/criteria;
- measurement capture;
- photos/evidence;
- pass/fail/observation;
- defect/finding creation;
- signature/competence where required.

Failed evidence is retained; retest creates new evidence.

---

# 8. CHANGE

**Intent:** govern a proposed/required modification and its impact before implementation.

Examples:

- Commercial Change;
- Design Change;
- Project Change;
- configuration change;
- contract amendment proposal.

Typical experience:

- Enterprise Change Workspace;
- change request;
- impact assessment;
- linked objects;
- option/quotation;
- decision;
- implementation;
- verification.

Change is not a direct destructive edit of historical truth.

---

# 9. DECISION / APPROVAL

**Intent:** record an attributable determination under explicit authority.

Examples:

- bid/no-bid;
- award;
- design decision;
- approval;
- investment decision;
- compliance decision;
- disposal decision.

Typical experience:

- Decision Workspace;
- decision basis;
- exact subject/version;
- delegated authority;
- conflicts/separation of duties;
- outcome;
- evidence snapshot.

Workflow may coordinate the decision but does not own the underlying domain state.

---

# 10. TRANSACTION / COMMITMENT

**Intent:** create an economically or operationally meaningful commitment/event.

Examples:

- Purchase Order;
- invoice;
- payment;
- quotation;
- award;
- contract;
- requisition;
- receipt.

Typical experience:

- Object Workspace;
- line-item Enterprise Grid;
- totals/calculations;
- authority;
- immutable issue/post history;
- amendment/correction semantics.

Transaction history must preserve the exact committed/posted position.

---

# 11. EXECUTION RECORD

**Intent:** record authorised work performed in the real world.

Examples:

- Work Order;
- Site Diary;
- Progress Record;
- plant usage;
- material usage;
- service record;
- installation record;
- time record.

Typical experience:

- Field/Mobile composition;
- context-first interaction;
- assigned work;
- start/stop/progress;
- quantities;
- labour/plant/material;
- photos;
- completion;
- exceptions.

Execution Record is distinct from workflow task assignment.

---

# 12. CERTIFICATE / FORMAL ATTESTATION

**Intent:** issue a formal controlled statement supported by retained evidence and signer authority.

Examples:

- electrical certificate;
- quality certificate;
- building-control completion certificate;
- payment certificate;
- professional statement;
- commissioning certificate.

Typical experience:

- Assisted Report Generator;
- exact source evidence;
- signer authority/competence;
- issue/revision;
- immutable issued representation.

A certificate must never exist independently of its supporting source evidence.

---

# 13. REPORT / SNAPSHOT

**Intent:** communicate a governed point-in-time view assembled from authoritative sources.

Examples:

- project status report;
- cost report;
- H&S performance report;
- quality report;
- environmental report;
- asset portfolio report;
- management accounts.

Typical experience:

- Assisted Report Generator;
- period/as-of date;
- source snapshots;
- commentary;
- review/approval;
- issued representation.

The report is not a new source of truth for the facts it summarises.

---

# 14. HANDOVER / CLOSEOUT PACKAGE

**Intent:** transfer a controlled set of objects/evidence between lifecycle stages, organisations or accountabilities.

Examples:

- tender-to-delivery handover;
- project closeout pack;
- asset handover package;
- O&M handover;
- contract closeout;
- regulatory archive.

Typical experience:

- completeness matrix;
- required deliverables;
- exact revisions;
- unresolved exceptions;
- acceptance decision;
- recipient/stewardship transfer.

Handover changes stewardship/status; it must not recreate canonical object identity.

---

# 15. Why the taxonomy matters

The 875 candidate Work Products from J1 Waves 1-4 show that NuBlox does not need 875 bespoke screen patterns.

It needs a smaller set of **world-class authoring primitives** capable of supporting these families while respecting domain semantics.

Conceptually:

```text
Job / Position
  -> required Work Product
     -> Work-Product Family
        -> Authoring Primitive(s)
           -> Canonical Object / Aggregate
              -> Workflow / Decision / Evidence
```

This gives NuBlox a scalable path from hundreds of jobs and thousands of work products to a coherent product experience.

---

# 16. Acceptance rule

Every candidate Work Product entering J2 must declare:

1. Work-Product Family;
2. authoring mode — NATIVE / ASSISTED / CONNECTED / INGESTED;
3. canonical object;
4. aggregate owner;
5. context;
6. authoring primitive;
7. lifecycle/version semantics;
8. authority/permission;
9. evidence;
10. downstream handoff.

A family label alone is not sufficient implementation design.
