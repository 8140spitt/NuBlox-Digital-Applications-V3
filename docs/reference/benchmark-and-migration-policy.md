# Reference Architecture, Benchmark & Migration Policy

**Status:** Governing reference-model policy

## Purpose

NuBlox learns from established enterprise platforms without inheriting their product boundaries, schemas or runtime dependencies.

External products may be used as:

- benchmark sources;
- capability references;
- migration sources;
- import/export format references; and
- migration targets where NuBlox data must be exported.

They are not operational components of NuBlox.

## Governing principle

**NuBlox is the product and the unified operating environment.**

Reference products are decomposed into useful concepts, compared against NuBlox requirements, redesigned into the NuBlox canonical model and then implemented natively.

~~~text
Reference product
-> capability decomposition
-> concept / object / lifecycle analysis
-> identify strengths and constraints
-> map to NuBlox canonical concepts
-> redesign for NuBlox product scope
-> implement natively in NuBlox
-> define migration / import / export mapping
-> verify no vendor runtime dependency
~~~

## Native implementation rule

Benchmarking a capability creates a requirement to decide whether NuBlox will provide that capability.

If the capability is in scope, NuBlox must implement the operative user experience natively.

A benchmark product must not become the hidden implementation of a NuBlox capability.

## PTC Windchill reference position

PTC Windchill is a major reference architecture for controlled object, information, product-definition, configuration and change capabilities.

The Windchill study informs NuBlox concepts including:

- stable object identity;
- master / revision / iteration separation;
- controlled object types;
- typed relationships;
- content and Representations;
- Lifecycle;
- Workflow;
- review and approval;
- Change;
- Baselines;
- Configuration;
- Effectivity;
- publication;
- access control; and
- technical authoring/control patterns.

These concepts inform what NuBlox builds natively.

Windchill is **not** the NuBlox operating foundation and is not required at runtime.

## Migration model

Migration is a controlled transfer of business meaning into NuBlox.

For each migrated object family, define:

- source object/class;
- source stable identity;
- source revision/version/iteration semantics;
- source Lifecycle state;
- source relationships;
- source context/container;
- source owner/team/role semantics;
- source access semantics;
- source content/Representations;
- source Baselines/Configuration/Effectivity;
- source Change/history;
- source external references;
- target NuBlox canonical type;
- target relationship model;
- target Lifecycle;
- target provenance;
- migration transformation; and
- reconciliation/validation Evidence.

## Cutover rule

Before cutover, a source platform may be authoritative for the historical data being migrated.

After cutover for a supported capability:

- NuBlox is the authoritative operational system;
- source identifiers may be retained as provenance;
- the source application is not required for ongoing work; and
- new work is created, controlled and completed in NuBlox.

## Migration preservation rule

If a source system distinguished identity, Revision, Iteration, Baseline, Lifecycle, release, Effectivity, relationship or Change, migration must preserve that business meaning rather than flatten it into files and metadata.

## Benchmark programme

NuBlox may benchmark ERP, finance, HR/workforce, procurement, project controls, construction management, CDE/information management, asset management, service management, PLM/configuration management, CRM, analytics and workflow platforms.

Benchmarking asks:

1. What capability exists?
2. What user work does it enable?
3. What objects and relationships underpin it?
4. What Lifecycle/control model is used?
5. What is strong?
6. What is constrained by that product's market or history?
7. What should NuBlox adopt conceptually?
8. What should NuBlox redesign?
9. What must NuBlox implement natively to provide a better unified experience?

## Acceptance test

A reference architecture has been used correctly when:

- NuBlox remains vendor-neutral;
- useful semantics have been preserved;
- the required capability is implemented natively where in scope;
- no external runtime dependency has been introduced;
- migrated data retains provenance and business meaning; and
- users can perform supported work without leaving NuBlox.
