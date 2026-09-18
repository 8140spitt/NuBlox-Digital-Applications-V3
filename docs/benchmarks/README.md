# External Benchmark Programme

This directory contains the outside-in market and standards challenge for NuBlox V3.

The purpose is **enterprise and built-environment completeness**, not vendor imitation. External products may expose missing outcomes, controls, information semantics, lifecycle depth or user-experience patterns. They do not define NuBlox module boundaries, database schemas, aggregate ownership or workflow architecture.

## Governing artefacts

- `market-benchmark-programme.md` — benchmark scope, method, product set and evidence rules.
- `sap-capability-coverage-register.csv` — the 64-line SAP benchmark register carried forward from the prior NuBlox programme as provenance. Its legacy NuBlox domain/slice columns are not V3 architecture.
- `app/src/lib/data/external-benchmark-register.ts` — machine-checkable V3 benchmark registry mapped to the 29 tenant workspaces.
- `app/src/lib/data/external-benchmark-register.test.ts` — regression gate proving benchmark breadth and 29-workspace coverage.

## Rule

A benchmark finding can result in one of five treatments:

1. **adopt semantic requirement** — NuBlox is missing a real business concept/control;
2. **adopt outcome, not vendor model** — the user/business outcome is required but NuBlox implements it through its canonical architecture;
3. **integration boundary** — the external system remains authoritative for a specialist capability and NuBlox must interoperate cleanly;
4. **contextual extension** — relevant only for defined sectors/business models;
5. **reject vendor-specific pattern** — the external structure is product-specific, duplicative or conflicts with NuBlox canonical principles.

A benchmark is not closed by confirming that a similarly named screen/object exists. Closure requires evidence that the material business outcome, lifecycle, controls, traceability and cross-workspace handoffs are covered.
