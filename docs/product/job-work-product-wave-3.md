# Job-to-Work-Product Wave 3 — Professional, Technical, Property & Planning Work

**Status:** third candidate decomposition complete  
**Date:** 20 September 2026  
**Scope:** twenty professional and technical jobs, 200 candidate Work Products  
**Register:** `priority-job-work-product-wave-3.csv`

## Purpose

Wave 3 extends the Job-to-Work-Product challenge into technical design support, geospatial work, land/property surveying, energy assessment, fire engineering, heritage, development planning and transport planning.

The governing test remains:

> **Can the person perform the job and create, develop, review, issue and hand over the controlled work products the job requires?**

All mappings remain `candidate-revalidation`. They are product-definition evidence, not a claim that every statutory, professional-institution or tenant-specific obligation has already been exhaustively captured.

## Wave 3 jobs

| Job archetype | External career | Prior Job Profile treatment | Candidate Work Products |
| --- | ---: | --- | ---: |
| Acoustics Consultant | 1 | no direct profile | 10 |
| Architectural Technician | 4 | no direct profile | 10 |
| Architectural Technologist | 5 | no direct profile | 10 |
| Building Technician | 11 | no direct profile | 10 |
| Cartographer | 15 | no direct profile | 10 |
| Civil Engineering Technician | 19 | no direct profile | 10 |
| Commercial Energy Assessor | 20 | adjacent Energy Manager profile only | 10 |
| Domestic Energy Assessor | 30 | adjacent Energy Manager profile only | 10 |
| Engineering Construction Technician | 33 | no direct profile | 10 |
| Fire Safety Engineer | 37 | no direct profile | 10 |
| General Practice Surveyor | 42 | partial property/lease composition | 10 |
| Geospatial Technician | 43 | no direct profile | 10 |
| Heritage Officer | 47 | no direct profile | 10 |
| Land Surveyor | 50 | no direct profile | 10 |
| Landscape Architect | 51 | no direct profile | 10 |
| Planning and Development Surveyor | 57 | partial capital/property composition | 10 |
| Rural Surveyor | 66 | partial property/lease/disposal composition | 10 |
| Surveying Technician | 76 | no direct profile | 10 |
| Town Planner | 79 | no direct profile | 10 |
| Transport Planner | 81 | adjacent Transport Manager profile only | 10 |

Total: **200 candidate Work Products**.

Together with Waves 1 and 2:

```text
Wave 1: 10 jobs / 118 candidate Work Products
Wave 2: 16 jobs / 165 candidate Work Products
Wave 3: 20 jobs / 200 candidate Work Products

Total:  46 jobs / 483 candidate Work Products
```

---

# 1. Technical design support is not a smaller version of engineering

Architectural Technician, Architectural Technologist, Building Technician, Civil Engineering Technician and Engineering Construction Technician demonstrate a recurring operating pattern:

```text
Requirement / survey
  -> technical drawing / model / schedule
     -> coordination / query
        -> controlled revision
           -> inspection / test
              -> as-built / handover
```

The job may author specialist information in CAD/BIM or engineering tools, but NuBlox still has to own or govern:

- business context;
- Information Container identity;
- exact revision;
- review/check status;
- issue/transmittal;
- change relationship;
- field evidence;
- handover completeness.

A connected authoring adapter is therefore part of the product, not an optional hyperlink.

---

# 2. Geospatial work requires first-class spatial provenance

Cartographer, Geospatial Technician and Land Surveyor expose requirements that a conventional document register does not satisfy.

NuBlox must preserve:

- coordinate reference system / datum;
- survey control;
- spatial extent;
- dataset lineage;
- source/licence;
- geometry revision;
- topology/quality validation;
- map representation;
- dataset exchange;
- archive/handover provenance.

The required experience pattern is:

```text
Map / Spatial Workspace
  + Enterprise Grid
  + Connected Authoring Adapter
  + metadata
  + controlled version / issue
```

Spatial data must link back to canonical Property, Asset, Site, Location and Project identities rather than become a parallel location master.

---

# 3. Energy assessment is a governed calculation-and-certificate chain

Commercial and Domestic Energy Assessor roles are not adequately represented by the existing generic Energy Manager profile.

The professional work chain is materially different:

```text
Instruction
  -> site/dwelling data capture
     -> retained evidence
        -> approved-method calculation/model
           -> rating
              -> recommendations
                 -> QA
                    -> certificate
                       -> lodgement / audit
```

This confirms that NuBlox requires explicit support for:

- assessment datasets;
- calculation provenance;
- approved methodology/software version;
- assessor identity/competence;
- immutable issued certificate;
- correction/supersession;
- lodgement reference;
- audit evidence.

---

# 4. Fire engineering is both specialist design and safety assurance

Fire Safety Engineer crosses technical design, risk, inspection, testing and formal reporting.

The role needs:

- fire strategy;
- specialist analysis/model;
- compliance matrix;
- design review;
- risk/hazard assessment;
- inspection;
- test/commissioning evidence;
- finding/deviation case;
- formal report/submission;
- fire-safety handover information.

This cannot be collapsed into either a generic H&S role or a generic design role.

The Job Profile must compose the required Functional Roles while permission and delegated authority remain independently governed.

---

# 5. Property surveying is cross-functional employment work

General Practice Surveyor, Planning and Development Surveyor and Rural Surveyor demonstrate why a function-derived profile catalogue is not sufficient.

Their work crosses combinations of:

- Property / Asset;
- valuation and appraisal;
- lease/tenancy;
- legal/transaction case;
- investment decision;
- planning constraints;
- inspection;
- reporting;
- acquisition/disposal;
- estate management.

One employable job therefore composes several F01-F29 Functional Roles.

NuBlox must not force the worker to mentally reconstruct their job from separate function menus.

---

# 6. Planning is case, spatial evidence, consultation and decision

Town Planner is a particularly important challenge.

A planning role requires:

```text
Application / Case
  -> policy + spatial constraint assessment
     -> consultation / representation
        -> professional report
           -> decision / recommendation
              -> conditions / obligations
                 -> monitoring / enforcement / appeal
```

This validates reusable Case Workspace, Map/Spatial Workspace, Decision Workspace and controlled submission/reporting primitives.

A project-plan screen is not a planning-case system.

---

# 7. Transport planning reinforces connected analytical authoring

Transport Planner combines:

- survey datasets;
- demand/network models;
- options appraisal;
- transport assessment;
- travel plan;
- consultation;
- mitigation schedule;
- model QA;
- monitoring.

Specialist modelling remains CONNECTED, while NuBlox governs the scenario, dataset, model identity/version, assumptions, validation, issue and downstream planning/project decisions.

---

# 8. J1 architecture finding after Wave 3

Wave 3 strengthens the earlier finding:

> The prior 382 generated Job Profiles are primarily function/sub-function capability profiles, not a complete construction-and-built-environment employment-job architecture.

The gap is now demonstrated across commercial, project, design, engineering, assurance, property, geospatial, planning, energy and field work.

The product architecture must therefore support:

```text
Career
  -> Job Profile
     -> composed Functional Roles
        -> Work Products
           -> Work-Product Families
              -> Authoring Primitives
                 -> Canonical Objects / Aggregates
```

without deriving permissions automatically from the Job Profile.

---

# 9. J1 state after Wave 3

```text
46 job archetypes
483 candidate Work Products
20 Wave-3 jobs mapped
14 Work-Product Families already established
```

J1 is materially advanced but **not yet complete**.

The remaining external-career coverage is concentrated in:

- building trades and fit-out;
- utilities and network field work;
- plant/specialist operations;
- building-services installation/maintenance;
- manufacturing and supply;
- retrofit/energy installation;
- rural/external works;
- specialist access/fabrication roles.

A final J1 field/operations wave should close those remaining career patterns before J2 converts candidate rows into governed Work-Product definitions with exact activity IDs, aggregate ownership, permission/authority rules, lifecycle/version semantics, integration contracts and acceptance references.
