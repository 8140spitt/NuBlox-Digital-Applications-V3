# NuBlox Reference Architectures

This directory contains the detailed benchmark, migration and external-product studies used to test NuBlox capability completeness and interoperability.

Reference material is evidence/input. It does not override the governing architecture under [docs/architecture](../architecture/).

## Governing reference policy

- [Reference Architecture, Benchmark & Migration Policy](benchmark-and-migration-policy.md)

The policy defines how external products are decomposed, compared, mapped, migrated and integrated without allowing vendor schemas or product boundaries to become NuBlox architecture.

## Current reference studies

- [Market Tool & Job Capability Landscape](market-tool-landscape.md) — current market-discovery framework across the 29 enterprise Functions and the Construction & Built Environment specialist-tool layer.
- [Machine-readable Market Tool Register](market-tool-register.csv) — product-level discovery register designed to expand through Function → Sub-function → Activity → Job Profile → task → tool → work product → NuBlox requirement.
- [PTC Windchill 13](windchill.md) — controlled objects, technical information, PLM/configuration/change, publication, integration and migration reference.

## Architectural boundary

The governing product boundary is [06 — Reference Architecture & Migration](../architecture/06-reference-architecture-and-migration.md).

**NuBlox is the product. External systems are references, integration endpoints or migration sources/targets.**
