# NuBlox V3 Product Architecture

This directory contains the governing product-definition artefacts for NuBlox V3.

## Governing documents

- [V3 Product Charter](v3-product-charter.md) — mission, design premise, product outcomes, quality gates and programme sequence.
- [Job-to-Work-Product Architecture](job-to-work-product-architecture.md) — governs how Job Profiles, Positions, Functional Roles, activities and Work Products become real user capability.
- [Construction Career Work-Product Baseline](construction-career-work-product-baseline.csv) — 84-career external market-coverage seed imported for V3 revalidation.
- [Job Profile Work-Product Coverage Register](job-profile-work-product-coverage-register.csv) — 382 prior candidate Job Profiles imported as explicit work-product decomposition gaps.
- [Priority Job Work-Product Wave 1](priority-job-work-product-wave-1.csv) — 118 candidate Work Products across ten priority employment jobs.
- [Priority Job Work-Product Wave 2](priority-job-work-product-wave-2.csv) — 165 candidate Work Products across sixteen further control, engineering, assurance and field jobs.
- [Priority Job Work-Product Wave 3](priority-job-work-product-wave-3.csv) — 200 candidate Work Products across twenty professional, technical, property, geospatial, energy and planning jobs.
- [Priority Job Work-Product Wave 4](priority-job-work-product-wave-4.csv) — 392 candidate Work Products across the 49 remaining external careers, closing the 84-career candidate coverage baseline.
- [Work-Product Family Taxonomy](work-product-family-taxonomy.md) — shared experience/completeness families evidenced by 875 candidate Work Products across 95 job archetypes.
- [Wave 1 Professional Role Challenge](job-work-product-wave-1.md) — findings from the first cross-functional role decomposition.
- [Wave 2 Controls, Engineering, Assurance & Field Work](job-work-product-wave-2.md) — findings from the second decomposition wave.
- [Wave 3 Professional, Technical, Property & Planning Work](job-work-product-wave-3.md) — findings from the third decomposition wave.
- [Wave 4 Field, Trades, Utilities, Plant & Supply Work](job-work-product-wave-4.md) — closes the remaining external-career decomposition and records the internal-profile reconciliation gate.
- [Professional Job Architecture Gap Register](professional-job-architecture-gap-register.csv) — explicit gaps/partial matches between real sector jobs and the prior function-derived Job Profile baseline.
- [Job Profile Reconciliation Register](job-profile-reconciliation-register.csv) — 382-row working register; 81 source profiles have an employment treatment and 301 remain unresolved.
- [Project Manager Composed Job Profile](composed-job-profile-project-manager.md) — first cross-sub-function employment profile with exact Work-Product/activity trace and explicit activity gaps.
- [F27 Job Profile Reconciliation](job-profile-reconciliation-f27.md) — complete employment-model reconciliation for Portfolio, Programme & Project Management.
- [Job Work-Product Activity Gap Register](job-work-product-activity-gap-register.csv) — source activity gaps exposed by exact job/work-product traceability.
- [Internal Job Profile Reconciliation](job-profile-reconciliation.md) — governing J1 gate for deciding whether each of the 382 inherited profiles is retained, composed, reduced to Functional-Role provenance, superseded or explicitly out of scope.
- [Job Profile Reconciliation Register](job-profile-reconciliation-register.csv) — 382-row working register; 81 source profiles have now been reconciled to an employment treatment and 301 remain unresolved.
- [Stakeholder Design Review — 17 September 2026](stakeholder-design-review-2026-09-17.md) — earlier stakeholder design baseline.

## Current job/work-product checkpoint

- **84 / 84 external careers** have an explicit candidate NuBlox treatment.
- **95 employment-job archetypes** are represented across Waves 1-4.
- **875 candidate Work Products** are decomposed.
- **J1 remains open**: 81 of the 382 prior function-derived candidate Job Profiles now have an employment treatment; 301 still require reconciliation before the catalogue can be declared complete.

## Product completeness model

NuBlox now measures completeness across four distinct lenses:

~~~text
Function coverage
  29 functions / 353 sub-functions / 1,510 activities

Object/runtime coverage
  canonical identity / command / lifecycle / evidence

Job coverage
  can each approved Job Profile perform its accountabilities?

Work-product coverage
  can each required Work Product be created/governed through
  NATIVE / ASSISTED / CONNECTED / INGESTED authoring?
~~~

A feature is not product-complete merely because a route, object or function mapping exists.

The governing user-level test is:

> **If I employ this person tomorrow, can they sit down in NuBlox and perform the job I hired them to do?**
