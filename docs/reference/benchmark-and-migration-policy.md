# Reference Architecture, Benchmark & Migration Policy

**Status:** Governing reference-model policy  

## Purpose

NuBlox must learn from established enterprise platforms without inheriting their product boundaries or allowing their schemas to become the NuBlox architecture.

External products may be used as:

- benchmark sources;
- capability references;
- migration sources;
- integration targets;
- interoperability partners.

They are not architectural parents.

## Governing principle

**NuBlox is the product.**

Reference products are decomposed into useful concepts, compared against NuBlox requirements, redesigned into the NuBlox canonical model and then extended where NuBlox's product scope requires more.

The process is:

~~~text
Reference product
-> capability decomposition
-> concept / object / lifecycle analysis
-> identify strengths and constraints
-> map to NuBlox canonical concepts
-> redesign for NuBlox product scope
-> define migration / integration mapping
-> verify no vendor-specific semantic leakage
~~~

## PTC Windchill reference position

PTC Windchill is a major reference architecture for NuBlox's controlled object, information, product-definition, configuration and change capabilities.

The reviewed Windchill 13 architecture model provides valuable reference concepts around:

- stable object identity;
- master / revision / iteration separation;
- controlled object types;
- typed object relationships;
- content and representations;
- lifecycle;
- workflow;
- review and approval;
- change governance;
- baselines;
- configuration management;
- effectivity;
- context/container concepts;
- access control;
- publication;
- history/audit;
- product/document/CAD relationship modelling.

These concepts inform the NuBlox Enterprise Kernel.

Windchill is **not** the NuBlox operating foundation.

## Where NuBlox intentionally extends beyond Windchill

NuBlox has a broader product responsibility.

NuBlox must govern not only technical product definition and controlled information, but also:

- enterprise identity and organisation;
- 29 functional domains;
- workforce / Position / Person deployment;
- Job Profiles and competence;
- customer and supplier relationships;
- contracts and commercial work;
- Project / Package / Site execution;
- finance and transactions;
- procurement;
- workforce and resource operations;
- quality, HSE and assurance;
- installed physical work;
- commissioning and handover;
- operational Assets;
- service and maintenance;
- cross-domain Decisions and evidence.

Therefore NuBlox must generalise the strongest controlled-object principles beyond classical PLM.

## Reference concepts versus canonical NuBlox concepts

The mapping principle is conceptual, not table-for-table cloning.

| Reference concept | NuBlox interpretation |
| --- | --- |
| stable business identity | canonical object identity |
| master / revision / iteration | identity + controlled revision/version/iteration semantics appropriate to object type |
| document/CAD/product object | typed canonical object / Information Container / Item / Deliverable relationship |
| typed links | governed typed relationship in the canonical object graph |
| lifecycle | reusable governed lifecycle state model |
| workflow | shared Native Work-Delivery Runtime |
| change object | canonical Change / impact / Decision / implementation chain |
| baseline | canonical governed Baseline |
| effectivity | canonical applicability/effectivity semantics where required |
| representation | controlled Representation of authoritative object/information |
| container/context | NuBlox Tenant / Organisation / Project / Library / Industry Solution context as appropriate |
| role/team | NuBlox responsibility/deployment/team model; not automatically an access role |
| access control | tenant/scope/permission/authority model |
| publication | rendering/representation/publication service |
| history | audit, business event, Decision and provenance evidence |

The right-hand side is the target architecture.

## Non-conflation rules derived from the study

The following distinctions are architectural invariants:

- NuBlox Function != application silo;
- Job Profile != Person;
- Job Profile != Position;
- Project Role != access role;
- permission != delegated authority;
- Deliverable Item != file;
- Information Container != physical Item/Asset;
- lifecycle != workflow;
- workflow != business object;
- approval != release;
- release != acceptance;
- baseline != folder;
- configuration != current file revision;
- organisation context != product structure;
- Project context != Organisation Unit;
- external source object != canonical NuBlox identity.

## System-of-record mapping

For migration and integration, each source object/class must be assigned an authority pattern.

### Native NuBlox authoritative

NuBlox owns the canonical record and lifecycle.

Examples can include:

- Organisation;
- Person / Position;
- Functional Deployment;
- Deliverable Requirement;
- Deliverable Item;
- enterprise Decision;
- shared Workflow/Work;
- Project/Contract objects where NuBlox is deployed as source of record.

### NuBlox governed extension / relationship

NuBlox may own enterprise context around an externally authored or specialist object.

Examples:

- requirement that an external CAD model must be produced;
- responsible Position/Person;
- review/approval Decision;
- project/package relationship;
- contractual obligation;
- issue/acceptance;
- downstream Asset relationship.

### External authoritative

Another application remains source of record for the specialist object.

NuBlox preserves:

- external system;
- external identity;
- canonical relationship;
- provenance;
- required state;
- reconciliation status;
- relevant evidence.

This allows coexistence during migration and where a specialist tool should remain in use.

## Migration mapping requirements

A migration from a source platform must not be treated as a file copy.

For each migrated object family, define:

- source object/class;
- source stable identity;
- source revision/version/iteration semantics;
- source lifecycle state;
- source relationships;
- source context/container;
- source owner/team/role semantics;
- source ACL/access semantics;
- source content/representations;
- source baselines/configuration/effectivity;
- source change/history;
- source external references;
- target NuBlox canonical type;
- target relationship model;
- target lifecycle;
- target provenance;
- migration transformation;
- reconciliation/validation evidence.

## Migration preservation rule

Migration must preserve business meaning.

If a source system distinguished:

- identity;
- revision;
- iteration;
- baseline;
- lifecycle;
- release;
- effectivity;
- relationship;
- change;

then migration must not flatten those concepts into a folder of files and metadata.

## Benchmark programme

Windchill is one reference.

NuBlox capability benchmarking may also assess relevant enterprise products across areas such as:

- ERP;
- finance;
- HR/workforce;
- procurement;
- Project controls;
- construction management;
- CDE/information management;
- asset management;
- service management;
- PLM/configuration management;
- CRM;
- analytics;
- integration;
- workflow/case management.

Benchmarking asks:

1. What capability exists?
2. What object semantics underpin it?
3. What lifecycle/control model is used?
4. What user work does it enable?
5. What is strong?
6. What is constrained by that product's history or market boundary?
7. What should NuBlox adopt conceptually?
8. What should NuBlox redesign?
9. What additional cross-domain continuity should NuBlox provide?

## Windchill study disposition

The existing Windchill architecture study remains valuable evidence.

Its future documentation role is:

- reference architecture;
- capability comparison;
- conceptual source;
- migration mapping input.

Its role is **not**:

- NuBlox platform architecture;
- NuBlox domain boundary definition;
- NuBlox navigation model;
- NuBlox canonical schema.

## Acceptance test

A reference architecture has been used correctly when:

- NuBlox's canonical model remains vendor-neutral;
- useful semantics have been preserved;
- product limitations have not been copied blindly;
- NuBlox's wider enterprise scope remains coherent;
- source objects can be migrated or integrated without losing provenance;
- the reference product can be replaced without redesigning the NuBlox platform.
