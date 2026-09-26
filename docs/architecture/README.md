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
9. [Canonical Capability & Native Tool Architecture](11-canonical-capability-and-native-tool-architecture.md)
10. [Functional Governance and Functional Delivery](13-functional-governance-and-functional-delivery.md)
11. [Enterprise ERP Composition & Execution Contract](14-enterprise-erp-composition-and-execution-contract.md)
12. [Market Tool Activity Evidence Model](15-market-tool-activity-evidence-model.md)

## Governing proposition

NuBlox governs organisational capability as Functions, assigns that capability to Positions through Human Capital, resolves each signed-in Person's Governance or Delivery working world from their occupied Position, enables work through native NuBlox tools, and controls the resulting enterprise objects, transactions, work products, Decisions, Evidence and Records across functional boundaries.

## Product hierarchy

~~~text
NuBlox Enterprise Operating Platform
|
+-- Enterprise Kernel
+-- Universal Function Model
|   +-- F01-F29 Core Business Functions
|   +-- Industry Functions (CBE D01-D16)
+-- Native Work-Delivery Runtime
+-- Industry Solutions
    +-- Construction & Built Environment
        +-- 16 CBE professional Functions
        +-- 84 Job Profiles
~~~

## Governing user resolution

~~~text
Person
-> Employment
-> occupied Position
-> Function assignment
-> FUNCTIONAL_GOVERNANCE | FUNCTIONAL_DELIVERY
-> Position hierarchy / management scope
-> Work / tools / objects / Decisions / cross-Function interaction
~~~

Contexts such as Project, Contract, Site, Asset, Product and Service are governed work contexts beneath this operating model. They do not create a competing Team or capability taxonomy.

## Canonical capability/tool baseline

The market benchmark is translated into NuBlox-native architecture through:

- [Canonical Capability & Native Tool Architecture](11-canonical-capability-and-native-tool-architecture.md);
- [Market Tool Activity Evidence Model](15-market-tool-activity-evidence-model.md);
- [Typical Activities in Industry Standard Tools](../reference/Typical%20Activities%20in%20industy%20standard%20tools.tsv) — machine-readable market activity evidence, not a competing NuBlox taxonomy;
- [Canonical Native Tool Engine Register](canonical-native-tool-engine-register.csv);
- [353-L2 Native Engine Map](canonical-l2-native-engine-map.csv);
- [1,510-Activity Canonical Capability Map](canonical-activity-capability-map.csv);
- [Native Tool Implementation Gap Register](canonical-native-tool-implementation-gap-register.csv);
- [1,510-Activity ERP Execution Contract](canonical-activity-erp-execution-contract.csv);
- [84-Job CBE ERP Execution Requirement Register](cbe-job-erp-execution-requirement-register.csv);
- [End-to-End ERP Process Spine](enterprise-end-to-end-erp-process-spine.csv);
- [Implementation Waves](../product/canonical-native-tool-implementation-waves.md).

These are the governing bridge between market evidence, the 29 Function/L2/Activity taxonomy, the 84 Construction & Built Environment Job Profiles and implementation-gap planning.

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
