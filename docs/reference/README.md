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
- [CBE Module/Task Verification Backlog](cbe-job-tool-module-task-backlog.csv) — controlled 570-record backlog for product-module, task, input/output, lifecycle, authority, evidence and format verification.
- [Deep Market Capability Register](market-tool-deep-capability-register.csv) — web-verified module/task benchmark records with explicit native NuBlox requirements.
- [Market Tool Research Programme](market-tool-research-programme.md) — research waves, prioritisation and verification acceptance test.
- [Enterprise Market Module/Task Backlog](enterprise-market-tool-module-task-backlog.csv) — 326 controlled Function × Product research records across F01–F29.
- [Enterprise Deep Capability Register](enterprise-market-tool-deep-capability-register.csv) — web-verified enterprise product module/task operations mapped to Function and candidate L2 sub-function.
- [Enterprise Market Equivalence Classification](enterprise-market-tool-equivalence-classification.csv) — classifies Function × Product relationships as deep anchors, equivalent implementations, new patterns, or pending research.
- [CBE Specialist Capability Pattern Closure](cbe-specialist-capability-pattern-closure.csv) — canonical specialist capability gaps closed using deep-verified market anchors and equivalent-product classification.
- [Market Tool Equivalence Classification](market-tool-equivalence-classification.csv) — separates genuinely different capability patterns from alternative vendor implementations and low-value duplicates.
- [PTC Windchill 13](windchill.md) — controlled objects, technical information, PLM/configuration/change, publication, integration and migration reference.
- [PTC Windchill Help Center — Deep Capability & Relationship Register](windchill-help-center-deep-relationship-register.md) — active fine-tooth-comb decomposition of the Windchill 12.0.2.0 Help Center into canonical objects, relationships, contexts, participation, inheritance, lifecycle, workflow, access, configuration, evidence and unresolved gaps. Verified PTC facts are kept separate from NuBlox hypotheses.
- [PTC Windchill Context, Team, Participation & Policy-Domain Model](windchill-context-team-participation-model.md) — verified decomposition of Organisation groups, Shared Teams, Context Teams, Object Teams, Team Templates, role-system groups, ProjectLink differences and policy-domain inheritance.
- [PTC Windchill Context/Team Participation Matrix](windchill-context-team-participation-matrix.csv) — machine-readable context-type and participation-mechanism crosswalk for Product, Library, Project, Program and administrative contexts.
- [PTC Windchill Access-Control Composition & Precedence Model](windchill-access-control-composition-model.md) — exact domain/type/state ACL derivation, participant resolution, grant/deny/absolute-deny precedence, ad-hoc access and administrative-lock benchmark semantics.
- [PTC Windchill Access-Control Precedence Matrix](windchill-access-control-precedence-matrix.csv) — machine-readable effective-permission conflict and precedence rules.
- [PTC Windchill Help Center Coverage Tracker](windchill-help-center-coverage.csv) — machine-readable research backlog showing deep-pass, partial, pending and genuine CBE-gap capability families.

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
