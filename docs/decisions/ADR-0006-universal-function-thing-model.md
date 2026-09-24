# ADR-0006 — Universal Function and metadata-driven Thing model

**Status:** Accepted  
**Date:** 24 September 2026

## Decision

NuBlox has one canonical **Function** concept.

The 29 enterprise Functions and the Construction & Built Environment capability areas are both Functions. They differ by classification, not by object model.

- `CORE_BUSINESS` Functions: F01–F29.
- `CBE` Functions: D01–D16.
- Future tenant or industry-specific Functions may use `CUSTOM`.
- A Function may have a parent Function.
- Governance and Delivery are operating sides of a Function, not separate entity types.

CBE remains an Industry Solution because it supplies industry-specific Function definitions, Job Profiles, work-product types and configuration. It does **not** create a second organisational capability concept called a Domain.

## Universal user resolution

Human Capital resolves:

~~~text
Person
-> Employment
-> occupied Position
-> Function
-> Governance or Delivery
-> Position hierarchy / management scope
~~~

The same rule applies to a Sales Executive in F07 and an Architect in D01.

## Metadata-driven object platform

NuBlox uses one metadata-driven object model for configurable business objects:

~~~text
Type Definition
-> Field Definitions / assignments
-> Thing
-> typed Field Values
-> typed Relationships
-> Relationship Field Values
~~~

`canonical_objects` and `canonical_relationships` remain the stable runtime identity graph. Metadata adds type, field, constraint and relationship semantics. Domain-specific relational tables may remain where transactional integrity, calculation, scale or performance requires them, but they participate in the same canonical Thing graph.

## Consequences

1. CBE D01–D16 are seeded into `function_definitions` and classified as `CBE`.
2. Existing `delivery_domains` remains as a compatibility/industry-composition table and references the corresponding Function.
3. Code that specifically measures the original enterprise taxonomy must filter `CORE_BUSINESS`; universal Function views include both families.
4. User-facing Function resolution must come from the database, not the hard-coded 29-function UI catalogue.
5. New configurable object types, fields and relationships should be metadata-defined rather than requiring a bespoke table/page unless strong domain semantics justify dedicated relational persistence.
6. Relationship records may own their own field values and effectivity.
7. Existing ADR-0003 statements that the 16 CBE domains are not Functions, and ADR-0005's separate Core Function Team / Professional Domain Team distinction, are superseded by this decision.

## Superseded rule

The previous invariant **“Delivery Domain != Function”** is withdrawn. The correct invariant is:

> **Function is the universal organisational capability concept; Core Business and CBE are Function families.**
