# NuBlox V3 Product Architecture

This directory contains the governing product-definition artefacts for NuBlox V3.

## Governing documents

- [V3 Product Charter](v3-product-charter.md) — mission, design premise, product outcomes, quality gates and programme sequence.
- [Job-to-Work-Product Architecture](job-to-work-product-architecture.md) — governs how Job Profiles, Positions, Functional Roles, activities and Work Products become real user capability.
- [Construction Career Work-Product Baseline](construction-career-work-product-baseline.csv) — 84-career external market-coverage seed imported for V3 revalidation.
- [Job Profile Work-Product Coverage Register](job-profile-work-product-coverage-register.csv) — 382 prior candidate Job Profiles imported as explicit work-product decomposition gaps.
- [Stakeholder Design Review — 17 September 2026](stakeholder-design-review-2026-09-17.md) — earlier stakeholder design baseline.

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
