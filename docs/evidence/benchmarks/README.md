# External Benchmark Evidence

> This directory is supporting evidence, not the NuBlox product specification.
>
> Start with the [Product Handbook](../handbook/README.md).

NuBlox was challenged against major ERP, construction, PLM, EAM, CRM, service-management and specialist enterprise products, plus relevant standards/interoperability sources.

The purpose was to expose missing business outcomes, controls, lifecycle depth, information semantics and interaction patterns — **not to copy vendor module structures**.

## Benchmark treatment

A finding may be:

1. adopted as a genuine semantic requirement;
2. adopted as an outcome but implemented through NuBlox architecture;
3. treated as an integration boundary;
4. treated as a contextual/sector extension;
5. deliberately rejected as vendor-specific or duplicative.

## Principal evidence

- `market-benchmark-programme.md`
- `competitive-experience-benchmark-programme.md`
- `competitive-experience-benchmark-register.csv`
- `competitive-experience-cross-suite-findings-01.md`
- `sap-capability-coverage-register.csv`
- `sap-v3-capability-map.csv`
- `standards-interoperability-challenge.md`
- `windchill-13.1.2-reference-model.md`

Detailed wave files are retained for traceability.

## Current rule

Benchmarking is no longer the default product-development loop.

New benchmark work should only be opened when implementation reveals a concrete completeness question or when an external standard/product materially changes a requirement.

Product behaviour belongs in the Handbook; durable architecture choices belong in ADRs; benchmark evidence stays here.
