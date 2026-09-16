# NuBlox V3 Foundation Canonicalization Baseline

**Status:** reviewed architecture baseline  
**Date:** 16 September 2026  
**Scope:** core identities required before broad ERP schema implementation

## Purpose

This baseline records the first governed canonicalization decisions in the NuBlox business-object workbench. These are architecture decisions, not a final physical schema. They establish the identity spine that downstream workspaces, workflows, permissions, evidence and transactions must reuse.

A reviewed object may still require relationship, lifecycle, versioning, scope and implementation detail before promotion to fully canonical/implemented/proven maturity.

## Identity principles

1. One real business identity must not be recreated because several workspaces use it.
2. Party is the common identity abstraction for persons and organisations.
3. Roles such as customer, supplier, subcontractor, consultant and project participant are relationships/context, not duplicate masters.
4. Project is the stable delivery identity; construction usage of `Job` is treated as an alias in this family.
5. Site is one shared spatial/business identity across property, project, field, logistics and asset contexts.
6. Information Container is one governed information identity reused by design/information management and records/knowledge management.
7. Product, material and service catalogue identities converge on one `Item` master with type/classification rather than three independent masters.
8. Asset identity survives design, installation, commissioning, warranty, operation, finance, sustainability, maintenance, modification and retirement.

## Reviewed foundation decisions

| Candidate | Decision | Canonical treatment |
| --- | --- | --- |
| BOF-01-002 Party | Validate | `Party` common identity abstraction |
| BOF-01-003 Person | Validate | `Person` Party specialization |
| BOF-01-004 Organisation | Validate | `Organisation` Party specialization |
| BOF-01-005 Legal Entity | Validate | legally/statutorily accountable organisational specialization linked to the canonical Organisation/Party identity |
| BOF-01-007 Organisation Unit | Validate | internal enterprise structural identity |
| BOF-06-003 Project | Validate | stable delivery/project identity |
| BOF-06-004 Job | Merge | merge into `Project` for the project-controls family |
| BOF-16-003 Site | Validate | canonical shared site/spatial identity |
| BOF-12-001 Site | Merge | merge into BOF-16-003 Site |
| BOF-08-002 Contract | Validate | stable governed agreement identity |
| BOF-07-007 Information Container | Validate | governed information identity with revision/status/issue semantics |
| BOF-25-004 Information Container | Merge | merge into BOF-07-007 |
| BOF-10-001 Product Item | Rename | canonical name `Item` |
| BOF-10-002 Material Item | Merge | merge into `Item` |
| BOF-10-003 Service Item | Merge | merge into `Item` |
| BOF-16-014 System | Validate | canonical technical/functional system identity |
| BOF-16-016 Asset | Validate | canonical whole-life asset identity |

## Initial relationship spine

```text
Party
├── Person
└── Organisation
    ├── Legal Entity
    └── Organisation Unit

Project
├── Site
├── Contract
├── Information Container
├── Item
└── System
    └── Asset
```

The diagram is intentionally conceptual. It does not imply simple parent/child database foreign keys for every relationship. For example, Project–Site, Project–Contract and Project–Information Container may be governed associations with their own context, role, effectivity or history.

## Next modelling questions

Before physical schema implementation, define for each validated foundation object:

- stable identifier and numbering rules;
- aggregate root and relationship boundaries;
- tenant/legal-entity/project/site/asset scope;
- ownership and write authority;
- lifecycle requirements;
- version/revision/iteration semantics;
- effectivity/applicability;
- role and permission model;
- audit/evidence/retention requirements;
- F01–F29 workspace usage;
- external IDs and interoperability mappings.

## Workbench behaviour

The application seeds these baseline decisions only where a candidate has no existing review decision. A human/stakeholder decision already recorded in the workbench is never overwritten by the baseline seed. Every baseline insertion creates the same append-only review-event evidence used for subsequent human decisions.

This permits the governed baseline to be version-controlled while preserving stakeholder changes and decision history in the review ledger.
