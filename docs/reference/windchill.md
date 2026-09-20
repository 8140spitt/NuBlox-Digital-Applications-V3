# PTC Windchill 13 — NuBlox Reference Map

**Status:** Reference architecture / benchmark / migration source  
**Reviewed source:** PTC_Windchill_13_Architecture(4).drawio  
**Review date:** 20 September 2026

## Position

PTC Windchill is a major source of architectural ideas for controlled enterprise objects, technical information, product definition, Lifecycle, Change, Configuration and publication.

It is **not** a NuBlox foundation layer, product boundary or parent architecture.

NuBlox absorbs useful concepts, redesigns them into the Enterprise Kernel and extends them across a much broader enterprise operating scope.

## What the 16-page study contains

The reviewed Draw.io study is not only an infrastructure diagram.

### Pages 1–4 — platform/runtime architecture

These pages describe the runtime/deployment view of Windchill, including client/web access, application/method-server processing, persistence/content/search services, background processing, publication and specialist authoring/CAD integration patterns.

NuBlox uses this section as an infrastructure/integration reference only.

### Pages 5–10 — controlled object and PLM semantics

These pages describe the more important conceptual architecture:

- controlled Part/Item-like objects;
- Documents and CAD/technical information;
- content and Representations;
- stable identity;
- Master / Revision / Iteration concepts;
- typed object relationships;
- product/document structures;
- Lifecycle;
- Workflow;
- review/approval;
- Change governance;
- Baselines;
- Configuration;
- Effectivity;
- contexts/containers;
- teams/roles/access;
- publication/history.

These concepts strongly influence NuBlox kernel semantics, but are generalised beyond PLM.

### Page 11 — enterprise representation boundaries

The study distinguishes different structural concerns rather than treating every business grouping as the same kind of application/container.

This reinforces the NuBlox rule that:

- Organisation structure;
- Project/Programme context;
- Product/System structure;
- reusable libraries;
- teams/roles;
- access scope;

are distinct concepts that may be related but must not be conflated.

### Pages 12–15 — NuBlox translation

The study then deliberately translates the reference concepts into NuBlox concerns, including:

- governed enterprise Functions;
- Construction Delivery Domains;
- Job Profiles;
- Functional Deployment;
- operating context;
- responsibilities;
- Work;
- Deliverables;
- controlled relationships.

This is where the study stops being a Windchill diagram and becomes a NuBlox design exploration.

### Page 16 — system-of-record mapping

The final mapping distinguishes:

1. objects/semantics NuBlox should own natively;
2. NuBlox-governed relationships/context around specialist or external objects;
3. objects that may remain authoritative in external enterprise systems.

That pattern is retained in the governing migration architecture.

## Concepts to retain and redesign

| Windchill/reference concept family | NuBlox treatment |
| --- | --- |
| stable object identity | canonical object identity |
| Master / Revision / Iteration | governed identity/revision/iteration semantics by object type |
| WTDocument / EPMDocument-style controlled information | typed Information Containers, Representations and domain objects |
| product structures | canonical Item/System/Asset structures and governed relationships |
| typed links | first-class governed relationships |
| Lifecycle | shared Lifecycle runtime |
| Workflow | shared Workflow/Work runtime |
| review / approval | exact-version review and immutable Decision evidence |
| Change objects | shared Change runtime with domain-specific Change types |
| Baselines | shared Baseline / Configuration runtime |
| Effectivity | shared Effectivity semantics |
| contexts / teams / roles | Tenant/Organisation/Project context + deployment/responsibility/authority model |
| content / Representations | Information and Representation services |
| publication | Representation/publication services |
| CAD integration | connected-authoring adapters |
| access control | contextual Permission/scope/Authority model |
| packages / collections | governed collections, transmittals and exchange packages |
| history | Audit, Event, Decision and provenance Evidence |

## What NuBlox deliberately does not inherit

NuBlox does not inherit Windchill's product boundary.

The NuBlox platform must also cover:

- enterprise identity/organisation;
- the 29 governed Functions;
- Job Profiles and competence;
- Position/Person deployment;
- customers/suppliers;
- Contracts/commercial work;
- finance;
- procurement;
- workforce/resource operation;
- Project/Site delivery;
- physical installed work;
- HSE/quality/assurance;
- commissioning/handover;
- Asset/service/maintenance;
- enterprise Decisions and cross-domain Evidence.

Nor does NuBlox assume that Windchill container/context types should become NuBlox application boundaries.

## Key distinctions confirmed by the study

The study reinforces these NuBlox invariants:

- Function != department != application context;
- Job Profile != Person != Position != access role;
- Deliverable Item != file;
- Information Container != physical Item/System/Asset;
- Master identity != Revision != Iteration;
- Workflow != Lifecycle;
- Lifecycle != Change Authority;
- Review != Approval != issue/release != Acceptance;
- Baseline != folder;
- Organisation context != Product structure;
- Project context != Organisation Unit.

## System-of-record patterns

### Native NuBlox authoritative

NuBlox owns canonical identity, state and Lifecycle.

### NuBlox governed extension / relationship

NuBlox owns the enterprise obligation/context/Decision around a specialist or externally authored object.

Example: an external CAD model can remain authored in a specialist tool while NuBlox owns the Deliverable Requirement, responsible deployment, review/approval Decision, issue/Acceptance and Project/Asset relationships.

### External authoritative

Another platform remains source of record.

NuBlox preserves external identity, provenance, canonical relationship, required state and reconciliation Evidence.

## Migration use

Windchill migration must preserve semantic history rather than copy only files.

Mappings should preserve where relevant:

- stable identity;
- Master / Revision / Iteration;
- Lifecycle;
- relationships;
- content/Representations;
- context;
- team/role/access semantics;
- Change;
- Baseline;
- Configuration;
- Effectivity;
- history/provenance.

The target is the NuBlox canonical model, not a cloned Windchill schema.

## Required restructuring of the architecture diagram

The current 16-page source remains valuable study evidence, but its future presentation must be reorganised so NuBlox—not Windchill—is the centre of the architecture.

The governing diagram structure is:

1. **NuBlox Product Architecture** — Enterprise Operating Platform and product layers.
2. **Enterprise Platform Kernel** — canonical objects, identity, Organisation, Authority, Lifecycle, Workflow, Change, Baseline, information, Decision, Evidence and audit.
3. **Functional / Domain Framework** — 29 governed Functions, native tools, policies/processes and cross-domain operation.
4. **Native Work-Delivery Runtime** — deployment, assignment, Work, Deliverable, review, Decision, approval, issue, Acceptance and Evidence.
5. **Construction & Built Environment Industry Solution** — 16 Delivery Domains, 84 Job Profiles and construction-specific contexts/outputs.
6. **Windchill Capability Comparison & Migration Mapping** — retained Windchill concepts, gaps, redesign choices, system-of-record decisions and migration mappings.

The original Windchill infrastructure/object/control pages therefore move into section 6 as reference evidence. They do not appear above or around NuBlox as a parent/foundation layer.

## Improvement direction

NuBlox takes the strongest controlled-object/configuration ideas from PLM and applies them across one Enterprise Operating Platform that also governs:

- organisational capability;
- people/competence;
- Authority;
- cross-functional business operation;
- executable Work;
- commercial/financial transactions;
- Project/Asset delivery;
- physical outcomes;
- Evidence and assurance.

That broader continuity is the design objective.
