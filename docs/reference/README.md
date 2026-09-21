# NuBlox Reference Architectures

This directory contains the detailed benchmark, migration and external-product studies used to test NuBlox capability completeness and interoperability.

Reference material is evidence/input. It does not override the governing architecture under [docs/architecture](../architecture/).

## Governing reference policy

- [Reference Architecture, Benchmark & Migration Policy](benchmark-and-migration-policy.md)

The policy defines how external products are decomposed, compared, mapped, migrated and integrated without allowing vendor schemas or product boundaries to become NuBlox architecture.

## Current reference studies

- [Market Tool & Job Capability Landscape](market-tool-landscape.md) — current market-discovery framework across the 29 enterprise Functions and the Construction & Built Environment specialist-tool layer.
- [Machine-readable Market Tool Register](market-tool-register.csv) — enterprise Function / market-product discovery register.
- [CBE 84-Job Tool Landscape](cbe-job-tool-landscape.md) — all 84 Construction & Built Environment Job Profiles mapped to the initial market-tool universe and native NuBlox requirements.
- [CBE Job Market Tool Matrix](cbe-job-market-tool-matrix.csv) — one governed row per Job Profile preserving existing capabilities, structured records, lifecycle and representative market tools.
- [CBE Job × Tool Capability Register](cbe-job-tool-capability-register.csv) — 570 initial Job × Tool mappings across 84 Job Profiles and 199 distinct products/tools; designed for module/workflow/output-level verification.
- [PTC Windchill 13](windchill.md) — controlled objects, technical information, PLM/configuration/change, publication, integration and migration reference.

## Research progression

```text
29 Functions
-> 353 L2 Sub-functions
-> 1,510 Activities
-> participating CBE Job Profiles
-> job capabilities / tasks
-> market tool
-> product module / workflow
-> input / operation / work product
-> canonical NuBlox object
-> native NuBlox requirement
-> implementation coverage
```

The current Job × Tool register is a discovery baseline, not a claim that every commercial and open-source product worldwide has already been enumerated. Each product/module must be verified against current vendor evidence as the benchmark deepens.

## Architectural boundary

The governing product boundary is [06 — Reference Architecture & Migration](../architecture/06-reference-architecture-and-migration.md).

**NuBlox is the product. External systems are references, integration endpoints or migration sources/targets.**
