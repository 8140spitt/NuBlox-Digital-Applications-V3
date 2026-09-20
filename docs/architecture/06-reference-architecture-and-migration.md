# 06 — Reference Architecture, Benchmark & Migration

**Status:** Governing reference-model and migration policy  
**Effective:** 20 September 2026

## Principle

**NuBlox is the product.**

External enterprise products are:

- reference architectures;
- capability benchmarks;
- integration endpoints;
- migration sources/targets;
- interoperability partners.

They are not architectural parents.

## Reference method

For each external platform:

1. decompose its capabilities;
2. identify underlying enterprise concepts;
3. identify useful object semantics and control patterns;
4. identify limitations created by that product's market/history;
5. map concepts to NuBlox canonical objects and runtimes;
6. decide whether NuBlox natively implements, extends, integrates, ingests, synchronises or migrates the capability;
7. preserve source-system identity/provenance where migration/federation requires it;
8. verify vendor-specific schema has not leaked into the NuBlox canonical model.

## Windchill

PTC Windchill is a major reference architecture for controlled object, information, product-definition, Configuration and Change capability.

The reviewed Windchill 13 architecture contributes useful concepts including:

- stable object identity;
- Master / Revision / Iteration separation;
- typed controlled objects;
- typed relationships;
- content and Representations;
- Lifecycle;
- Workflow;
- review and approval;
- Change governance;
- Baselines;
- Configuration;
- Effectivity;
- context/container concepts;
- access control;
- publication;
- history/audit;
- product/document/CAD relationship modelling.

These ideas are redesigned as NuBlox capabilities inside the Enterprise Kernel and relevant domains.

**Windchill is not NuBlox's parent architecture or operating foundation.**

See [the Windchill reference map](../reference/windchill.md).

## NuBlox scope beyond Windchill

NuBlox must govern not only technical product definition and controlled information, but also:

- enterprise identity and Organisation;
- 29 Functional Domains;
- workforce / Position / Person deployment;
- Job Profiles and competence;
- customers and suppliers;
- Contracts and commercial work;
- Project / Package / Site execution;
- finance and transactions;
- procurement;
- workforce and resources;
- quality, HSE and assurance;
- installed physical work;
- commissioning and handover;
- operational Assets;
- service and maintenance;
- cross-domain Decisions and Evidence.

NuBlox therefore generalises strong controlled-object/configuration principles beyond classical PLM.

## Conceptual mapping

Mapping is conceptual, not table-for-table cloning.

| Reference concept | NuBlox interpretation |
| --- | --- |
| stable business identity | canonical object identity |
| Master / Revision / Iteration | stable identity + governed revision/version/iteration semantics appropriate to object type |
| document/CAD/product object | typed canonical object / Information Container / Item / Deliverable relationship |
| typed link | governed typed relationship in canonical object graph |
| Lifecycle | shared governed Lifecycle runtime |
| Workflow | shared Workflow/Work runtime |
| Change object | canonical Change / impact / Decision / implementation chain |
| Baseline | canonical governed Baseline |
| Effectivity | canonical applicability/Effectivity semantics |
| Representation | controlled Representation of authoritative information/object |
| container/context | Tenant / Organisation / Project / Library / Industry Solution context as appropriate |
| team/role | responsibility/deployment/team model; not automatically access role |
| access control | Permission/scope/Authority model |
| publication | Representation/publication service |
| history | Audit, Event, Decision and provenance Evidence |

The NuBlox side of the mapping is the target architecture.

## Non-conflation rules

Reference/migration work must preserve these distinctions:

- NuBlox Function != application silo;
- Job Profile != Person != Position;
- Project Role != access role;
- Permission != delegated Authority;
- Deliverable Item != file;
- Information Container != physical Item/Asset;
- Workflow != Lifecycle;
- Workflow != authoritative business object;
- Approval != release/issue;
- release/issue != acceptance;
- Baseline != folder;
- Configuration != current file revision;
- Organisation context != product structure;
- Project context != Organisation Unit;
- external source object != canonical NuBlox identity.

## System-of-record patterns

Every migrated or integrated object family must use an explicit authority pattern.

### Native NuBlox authoritative

NuBlox owns the canonical record and Lifecycle.

### NuBlox governed extension / relationship

Another tool may author or own a specialist object while NuBlox owns enterprise context such as:

- Requirement;
- Deliverable obligation;
- responsible Position/Person;
- review/approval Decision;
- Project/Package relationship;
- contractual obligation;
- issue/acceptance;
- downstream Asset relationship.

### External authoritative

Another application remains source of record.

NuBlox preserves:

- external system identity;
- external object identity;
- canonical relationship;
- provenance;
- required state;
- reconciliation status;
- relevant Evidence.

## Migration mapping requirements

Migration is not a file copy.

For each source object family define:

- source object/class;
- source stable identity;
- source revision/version/iteration semantics;
- source Lifecycle state;
- source relationships;
- source context/container;
- source owner/team/role semantics;
- source ACL/access semantics;
- source content/Representations;
- source Baselines/Configuration/Effectivity;
- source Change/history;
- source external references;
- target NuBlox canonical type;
- target relationship model;
- target Lifecycle;
- target provenance;
- transformation rules;
- reconciliation/validation Evidence.

## Migration preservation rule

Migration must preserve business meaning.

If the source distinguishes identity, Revision, Iteration, Baseline, Lifecycle, release, Effectivity, relationship or Change, migration must not flatten those into a folder of files plus metadata.

## Wider benchmark set

NuBlox should also be benchmarked across relevant ERP, EAM, PPM, CDE, BIM, ITSM, CRM, HCM, PLM/configuration and analytics platforms including relevant capabilities from SAP, Oracle, IFS, Autodesk, Bentley, Procore, Aconex, ServiceNow and Microsoft ecosystems.

Benchmarking asks:

1. What capability exists?
2. What object semantics underpin it?
3. What Lifecycle/control model is used?
4. What user work does it enable?
5. What is strong?
6. What is constrained by product history/market boundary?
7. What should NuBlox adopt conceptually?
8. What should NuBlox redesign?
9. What additional cross-domain continuity should NuBlox provide?

## Acceptance test

A reference architecture has been used correctly when:

- NuBlox's canonical model remains vendor-neutral;
- useful semantics are preserved;
- product limitations are not copied blindly;
- NuBlox's wider enterprise scope remains coherent;
- migration/integration retains provenance;
- the external product can be replaced without redesigning the NuBlox platform.
