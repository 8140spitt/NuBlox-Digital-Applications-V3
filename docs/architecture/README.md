# NuBlox Architecture

This directory is the **governing product architecture** for NuBlox.

NuBlox is the product. Industry solutions configure it. External products inform, integrate with or migrate into/from it.

## Reading order

1. [Product Architecture](01-product-architecture.md)
2. [Enterprise Platform Kernel](02-enterprise-platform-kernel.md)
3. [Functional Domain Framework](03-functional-domain-framework.md)
4. [Native Work-Delivery Runtime](04-native-work-delivery-runtime.md)
5. [Construction & Built Environment Industry Solution](05-construction-built-environment.md)
6. [Reference Architecture, Benchmark & Migration](06-reference-architecture-and-migration.md)
7. [Canonical Object Model](07-canonical-object-model.md)
8. [Architecture Invariants](08-architecture-invariants.md)

## Governing proposition

NuBlox governs organisational capability, deploys that capability through people and operating contexts, enables work through native/connected domain tools, controls resulting enterprise objects and Deliverable Items throughout their Lifecycle, and preserves the Authority, Configuration, Decisions, Evidence and Records required to operate and assure the enterprise.

## Product hierarchy

~~~text
NuBlox Enterprise Operating Platform
|
+-- Enterprise Kernel
+-- Functional Domains (29 governed functions/workspaces)
+-- Native Work-Delivery Runtime
+-- Industry Solutions
    +-- Construction & Built Environment
        +-- 16 Delivery Domains
        +-- 84 Job Profiles
~~~

## Documentation authority

Where documentation conflicts, use this order:

1. accepted Architecture Decisions under [docs/decisions](../decisions/);
2. Architecture Invariants;
3. this architecture set;
4. product roadmap;
5. external/reference studies.

External reference studies never override the NuBlox architecture.

## Reference evidence

Reference studies live under [docs/reference](../reference/).

The current PTC Windchill 13 study is retained as a reference/benchmark/migration source and is explicitly not a foundation layer.

## Architecture tests

A proposed implementation must preserve:

- one canonical enterprise object graph;
- shared kernel runtimes;
- separation of Function, Organisation, Job Profile, Position, Person, Permission and Authority;
- explicit Work/Deliverable/Decision/Evidence chains;
- controlled identity/version/configuration semantics where required;
- Industry Solution reuse of the shared platform;
- vendor-neutral canonical semantics.

Any material exception to an invariant requires an explicit Architecture Decision.
