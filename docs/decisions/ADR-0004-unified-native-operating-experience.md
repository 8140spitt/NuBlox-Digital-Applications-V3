# ADR-0004 — NuBlox Is a Unified Native Operating Experience

**Status:** Accepted  
**Date:** 20 September 2026

## Context

NuBlox is intended to be one unified enterprise operating platform.

Architecture wording that allowed external applications to remain authoritative, provide connected authoring, or execute part of a NuBlox-managed process would produce a federated toolchain rather than a unified product.

That is not the target.

## Decision

**Every supported NuBlox capability must be executable natively inside NuBlox.**

A user performing a NuBlox-supported Function or Job Profile must not be required to leave NuBlox and use another enterprise application to create, edit, transact, approve, control or complete the work.

This applies across:

- the 29 governed enterprise Functions;
- the Native Work-Delivery Runtime;
- Industry Solutions;
- the 84 Construction & Built Environment Job Profiles; and
- every controlled work product or transaction required to perform those jobs.

## External products

External products may be used only as:

- reference architectures;
- capability benchmarks;
- migration sources;
- migration/export targets;
- import/export format sources; and
- historical provenance references.

They are not part of the NuBlox runtime operating model.

## Native authoring consequence

Where a supported job requires specialist authoring, NuBlox must provide that authoring capability natively.

Examples include:

- drawings;
- BIM/models;
- technical calculations;
- specifications;
- schedules;
- estimates and cost plans;
- programmes;
- commercial transactions;
- inspections and test records;
- asset information;
- finance transactions;
- HR/workforce administration; and
- other role-specific work products.

The existence of an incumbent specialist product does not justify handing the work out of NuBlox.

## Migration consequence

A source platform may be authoritative before migration cutover.

After cutover for a NuBlox-supported capability:

- NuBlox owns the canonical operational record;
- new work occurs in NuBlox;
- source identifiers/history may remain as provenance; and
- ongoing use of the source application is not required.

## User-experience acceptance test

The architecture fails this decision if a normal user journey says, in effect:

> "Go to another application to do this part, then come back to NuBlox."

A compliant journey remains inside NuBlox from assignment through execution, authoring, review, Decision, approval, transaction, issue/acceptance, evidence and history.

## Superseded interpretation

Any prior wording that treats connected authoring, external authoritative systems, runtime integration with incumbent enterprise applications, or federation as the intended operating model for an in-scope NuBlox capability is superseded by this decision.
