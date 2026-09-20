# 06 — Reference Architecture & Migration

**Status:** Governing architecture boundary  
**Effective:** 20 September 2026

## Principle

**NuBlox is the product and the operating environment.**

External products are:

- reference architectures;
- capability benchmarks;
- migration sources;
- migration targets where NuBlox data must be exported;
- import/export format references.

They are **not** NuBlox runtime components, operational dependencies, authoring tools or systems of record for capabilities NuBlox claims to provide.

## Reference use

NuBlox studies external platforms to understand:

- capability breadth and depth;
- object semantics;
- identity/version models;
- Lifecycle and Workflow;
- Change and Configuration;
- authority/access patterns;
- information/content handling;
- specialist authoring behaviour;
- migration requirements; and
- data exchange formats.

Useful concepts are redesigned into NuBlox canonical semantics and implemented natively inside the NuBlox platform.

## Windchill

PTC Windchill is a major reference for:

- Master / Revision / Iteration;
- typed controlled objects and relationships;
- technical/product structures;
- Lifecycle and Workflow;
- Change;
- Baseline / Configuration / Effectivity;
- content / Representation / publication;
- context/team/access patterns; and
- CAD/PLM control semantics.

**Windchill is not NuBlox's parent architecture, operating foundation or runtime dependency.**

See:

- [PTC Windchill 13 reference study](../reference/windchill.md)
- [Benchmark & migration policy](../reference/benchmark-and-migration-policy.md)

## Native-capability rule

If NuBlox supports a capability, the user must be able to execute that capability inside NuBlox.

NuBlox therefore cannot close a functional gap by requiring a user to work in SAP, Windchill, Revit, AutoCAD, Aconex, Procore, ServiceNow or another third-party enterprise application.

The reference product may teach us what must be built. It does not become part of the delivered operating experience.

## Migration authority

Migration has two authority states:

1. **Source state** — before cutover, the source platform may contain the authoritative historical data being migrated.
2. **NuBlox state** — after governed migration/cutover for a capability, NuBlox owns the canonical operational record and Lifecycle.

Source identities and history may be retained as provenance. They do not create an ongoing dependency on the source application.

## Migration rule

Migration preserves business meaning.

Controlled source semantics such as identity, Revision, Iteration, Lifecycle, relationship, Change, Baseline, Configuration, Effectivity and provenance must not be flattened into files plus metadata.

## Import/export rule

Import and export exist for business exchange, portability and transition.

They do not create a second operational system.

A user may receive or issue external formats, but the governed NuBlox object, state, responsibility, Decision, workflow, evidence and history remain native to NuBlox.

## Benchmark rule

Benchmarking informs what NuBlox must natively deliver.

It does not justify external runtime dependency and does not dictate NuBlox product boundaries.
