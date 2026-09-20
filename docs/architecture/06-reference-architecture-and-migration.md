# 06 — Reference Architecture & Migration

**Status:** Governing architecture boundary  
**Effective:** 20 September 2026

## Principle

**NuBlox is the product.**

External products are reference architectures, benchmarks, integration endpoints and migration sources/targets.

They do not define NuBlox's product architecture, canonical object graph, navigation model or domain boundaries.

## Reference use

NuBlox may study external platforms to understand:

- capability breadth/depth;
- object semantics;
- identity/version models;
- Lifecycle and Workflow;
- Change and Configuration;
- authority/access patterns;
- information/content handling;
- integration/publication;
- migration requirements.

Useful concepts are mapped into NuBlox canonical semantics and redesigned for NuBlox's broader Enterprise Operating Platform scope.

## Windchill

PTC Windchill is a major reference for:

- Master / Revision / Iteration;
- typed controlled objects/relationships;
- technical/product structures;
- Lifecycle and Workflow;
- Change;
- Baseline / Configuration / Effectivity;
- content / Representation / publication;
- context/team/access patterns;
- CAD/PLM integration.

**Windchill is not NuBlox's parent architecture or operating foundation.**

See:

- [PTC Windchill 13 reference study](../reference/windchill.md)
- [Benchmark & migration policy](../reference/benchmark-and-migration-policy.md)

## Authority patterns

Every integration/migration must explicitly choose one of these patterns:

1. **Native NuBlox authoritative** — NuBlox owns canonical identity and Lifecycle.
2. **NuBlox governed extension/relationship** — NuBlox owns enterprise context/obligation/Decision around an externally authored or specialist object.
3. **External authoritative** — another system remains source of record while NuBlox preserves external identity, provenance, canonical relationships and reconciliation state.

Ownership must never move implicitly.

## Migration rule

Migration preserves business meaning.

Controlled source semantics such as identity, Revision, Iteration, Lifecycle, relationship, Change, Baseline, Configuration, Effectivity and provenance must not be flattened into files plus metadata.

## Benchmark rule

Benchmarking informs capability completeness.

It does not dictate NuBlox product boundaries.

NuBlox may benchmark relevant ERP, PLM, EAM, PPM, CDE, BIM, ITSM, CRM, HCM, analytics and workflow platforms while preserving vendor-neutral canonical semantics.
