# External Benchmark Programme

This directory contains the outside-in market and standards challenge for NuBlox V3.

The purpose is **enterprise and built-environment completeness**, not vendor imitation. External products may expose missing outcomes, controls, information semantics, lifecycle depth or user-experience patterns. They do not define NuBlox module boundaries, database schemas, aggregate ownership or workflow architecture.

## Governing artefacts

- `market-benchmark-programme.md` — benchmark scope, method, product set and evidence rules.
- `sap-capability-coverage-register.csv` — the 64-line SAP benchmark register carried forward from the prior NuBlox programme as provenance. Its legacy NuBlox domain/slice columns are not V3 architecture.
- `sap-v3-capability-map.csv` — governed 64/64 V3 remap and completed SAP architecture-challenge classification across F01–F29 workspaces, canonical object families/concepts and end-to-end chains.
- `app/src/lib/generated/sap-v3-benchmark-map.json` — machine-readable form of the SAP V3 remap.
- `app/src/lib/data/sap-v3-benchmark-audit.ts` — invariant proving every SAP row has valid V3 semantic mappings.
- `sap-wave-1-enterprise-backbone.md` — detailed current-SAP challenge for the first 39 rows.
- `sap-wave-2-specialist-industry-experience.md` — detailed current-SAP challenge for the remaining 25 rows.
- `app/src/lib/data/benchmark-gap-register.ts` — governed architecture decisions arising from benchmark findings.
- `app/src/lib/data/benchmark-refinement-model.ts` — durable core semantics accepted from benchmark evidence.
- `enterprise-suite-wave-1-oracle-microsoft-ifs-workday.md` — enterprise-suite architecture challenge after SAP.
- `construction-delivery-wave.md` — construction-native challenge across Procore, Autodesk, Trimble, EcoSys, Causeway, Thinkproject and Asite.
- `product-engineering-information-wave.md` — Windchill, Teamcenter and Bentley configuration/digital-thread challenge.
- `asset-property-service-wave.md` — Maximo, Planon and Esri asset/property/network challenge.
- `enterprise-control-specialist-wave.md` — ServiceNow, Diligent, Salesforce, Deltek and Sage specialist back-office challenge.
- `standards-interoperability-challenge.md` — ISO/openBIM/Uniclass independent standards challenge.
- `app/src/lib/data/external-benchmark-register.ts` — machine-checkable V3 benchmark registry mapped to the 29 tenant workspaces.
- `app/src/lib/data/external-benchmark-register.test.ts` — regression gate proving benchmark breadth and 29-workspace coverage.
- `app/src/lib/data/standards-challenge-register.ts` — machine-checkable standards/interoperability challenge.
- `app/src/lib/data/benchmark-rejection-register.ts` — deliberate vendor-pattern non-adoptions with recorded rationale and preserved NuBlox authority.

## Rule

A benchmark finding can result in one of five treatments:

1. **adopt semantic requirement** — NuBlox is missing a real business concept/control;
2. **adopt outcome, not vendor model** — the user/business outcome is required but NuBlox implements it through its canonical architecture;
3. **integration boundary** — the external system remains authoritative for a specialist capability and NuBlox must interoperate cleanly;
4. **contextual extension** — relevant only for defined sectors/business models;
5. **reject vendor-specific pattern** — the external structure is product-specific, duplicative or conflicts with NuBlox canonical principles.

A benchmark is not closed by confirming that a similarly named screen/object exists. Closure requires evidence that the material business outcome, lifecycle, controls, traceability and cross-workspace handoffs are covered.
