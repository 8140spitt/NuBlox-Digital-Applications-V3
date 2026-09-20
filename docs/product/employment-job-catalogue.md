# Canonical Employment Job Catalogue

**Status:** candidate employment catalogue — employment identity reconciled; J1 Work-Product completeness remains open  
**Date:** 20 September 2026

## Current catalogue

The V3 employment model now reconciles the previous function-generated Job Profile source with the construction and built-environment Work-Product waves.

```text
Inherited source Job Profiles                    382
Distinct employment jobs after reconciliation   374
Wave employment archetypes                       95
Exact-title overlaps with source catalogue         7
Additional Wave employment jobs                   88
----------------------------------------------------
Candidate employment jobs                        462
```

The 382 inherited profiles reduce to 374 employment jobs because genuine lifecycle/duplicate source profiles were composed, including Project Manager, Risk Analyst, Internal Audit Manager, Crisis Communications Manager, Business Process Analyst, Continuous Improvement Specialist and Benefits Realisation.

The Wave catalogue adds construction, engineering, surveying, planning, trade, plant, utilities, field and other sector employment jobs that were not represented by the function-generated source model.

## Exact Wave/source overlaps

- Environmental Manager
- Facilities Manager
- Health & Safety Manager
- Maintenance Planner
- Project Controls Manager
- Project Manager
- Project Planner

Exact-title overlap is intentionally a strict merge rule. Similar but materially different jobs remain separate until their Work Products prove equivalence.

Examples:

- Construction Manager is not automatically collapsed into Construction Project Manager.
- Procurement Manager is not automatically collapsed into Head of Procurement or Procurement Strategy Manager.
- Asset Manager is not automatically collapsed into Asset Strategy Manager.
- Project Accountant is not automatically collapsed into Cost Accountant or Financial Reporting Accountant.

## Governing model

```text
Person
  -> Worker Relationship
  -> Position Assignment
  -> Position
  -> Job Profile / Employment Job
  -> Functional Roles
  -> Activities
  -> Work Products
```

Security remains orthogonal:

```text
Job Profile
  != Access Role
  != Permission
  != Scope
  != Delegated Authority
```

## What is complete

- every one of the 382 inherited source profiles has an employment treatment;
- true duplicate/lifecycle slices are composed rather than surfaced as separate jobs;
- three semantically incorrect generated titles have corrected V3 employment titles;
- all 95 Wave job archetypes are represented;
- all 84 external construction/built-environment careers have candidate Work-Product treatment;
- the combined candidate employment catalogue contains 462 jobs.

## What remains before J1 closes

Employment identity reconciliation is **not** Work-Product completeness.

For every candidate employment job, NuBlox still needs to prove:

1. material Work Products are explicit;
2. source Activities are exact, not merely sub-function references;
3. upstream inputs and downstream handoffs are explicit;
4. accountable/author/contributor/reviewer/decision-authority relationships are explicit;
5. authoring mode and primitive are defined;
6. canonical aggregate/object ownership is exact;
7. lifecycle/version/effectivity/evidence rules are explicit;
8. Position-level Job Workbench composition is possible;
9. role acceptance scenarios prove a worker can perform the job.

The catalogue therefore remains a controlled candidate baseline rather than a claim that all 462 jobs are product-complete.
