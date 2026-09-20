# 14 — Enterprise Platform Kernel

**Status:** Governing shared-platform architecture  
**Effective:** 20 September 2026

## Purpose

The Enterprise Kernel is the shared foundation beneath every NuBlox function and every Industry Solution.

Its purpose is to ensure that common enterprise concepts are implemented once, governed consistently and reused everywhere.

## Kernel responsibilities

The Enterprise Kernel owns shared semantics and services for:

1. canonical object identity and relationships;
2. Party, Person and Organisation identity;
3. organisation structure and Position;
4. tenant membership, access and scope;
5. Job Profile, responsibility and deployment linkage;
6. authority, delegation and segregation of duties;
7. workflow, work items and assignments;
8. lifecycle and controlled state transition;
9. Decision and approval evidence;
10. configuration, baseline and change;
11. controlled information, records and representations;
12. business events, audit and provenance;
13. object resolution, search and reference;
14. integration identity and external-source mapping.

## Canonical object graph

NuBlox must behave as a connected enterprise object system.

An authoritative object is identified once and related to other objects through explicit typed relationships.

Examples:

~~~text
Organisation
  -> employs / engages -> Person
  -> contains -> Organisation Unit
  -> supplies -> Customer Organisation
  -> contracts with -> Supplier Organisation

Project
  -> governed by -> Contract
  -> decomposed into -> Work Package
  -> located at -> Site
  -> requires -> Deliverable Item
  -> deploys -> Functional Deployment

Deliverable Item
  -> satisfies -> Requirement
  -> produced by -> Assignment / Person / Organisation
  -> represented by -> Information Container / Revision
  -> reviewed by -> Decision
  -> issued through -> Issue / Transmittal
  -> affects -> Item / System / Asset / Work Package

Asset
  -> installed at -> Location
  -> realised from -> Item / System definition
  -> verified by -> Inspection / Test / Commissioning evidence
  -> maintained by -> Work Order
~~~

The relationship itself may be governed and may carry role, scope, dates, status, authority or configuration meaning.

## Identity and version semantics

NuBlox distinguishes where applicable:

- stable identity;
- mutable business state;
- version;
- revision;
- iteration;
- representation;
- working copy / draft;
- released / issued state;
- effectivity;
- configuration;
- baseline membership;
- supersession.

These concepts are not interchangeable.

For controlled objects, the platform must be able to answer:

- What is the object?
- Which revision/version is current?
- Which exact state was approved?
- Which representation was issued?
- Which baseline includes it?
- Where is it effective?
- What superseded it?
- What changed and why?

## Party, organisation and authority

The kernel separates:

- Party identity;
- Person identity;
- Organisation identity;
- Organisation Unit;
- employment / engagement;
- Job Profile;
- Position;
- Position occupancy;
- team/project role;
- access role;
- permission;
- responsibility;
- delegated authority;
- financial/contractual/technical authority;
- segregation-of-duties constraint.

A Job Profile is not a Person.  
A Position is not a Job Profile.  
A Project Role is not an access role.  
A permission is not an authority delegation.

## Workflow and work

The kernel provides reusable primitives for:

- Workflow Definition;
- Workflow Instance;
- Work Item;
- Assignment;
- queue;
- escalation;
- handoff;
- review request;
- approval request;
- Decision request;
- completion evidence.

Workflow coordinates work around authoritative objects. It does not become the authoritative object itself.

## Lifecycle

A governed object can have a lifecycle appropriate to its type.

Lifecycle transition can depend on:

- current state;
- exact version;
- mandatory metadata;
- required evidence;
- permission;
- scope;
- responsibility;
- competence;
- authority;
- review;
- approval;
- segregation of duties;
- downstream consequences.

## Decisions and authority

An authorised Decision is a first-class immutable record.

A Decision should preserve:

- decision type;
- subject type and identity;
- subject version/revision;
- requested outcome;
- actual outcome;
- decision maker;
- authority basis;
- reason/rationale;
- conditions;
- timestamp;
- evidence;
- correlation/business context.

A lifecycle state such as APPROVED must not be the only surviving evidence that approval occurred.

## Configuration, change and baselines

The kernel supplies reusable configuration-control concepts.

The generic control chain is:

~~~text
identify configuration item
-> establish configuration identity
-> establish approved baseline
-> propose change
-> assess impact
-> obtain authorised decision
-> revise affected definitions / work
-> release / issue
-> implement
-> verify implementation
-> reconcile status
-> establish updated baseline
~~~

Configuration status accounting must be able to reconstruct what was:

- required;
- approved;
- issued;
- purchased/fabricated;
- constructed/installed;
- tested;
- handed over;
- operational at a point in time.

## Information, content and records

The platform distinguishes:

- business object;
- Deliverable Item;
- Information Container;
- content/file;
- representation;
- Record;
- evidence attachment.

A file is not automatically the business object.

A Deliverable Item is the governed obligation/output identity.

An Information Container manages controlled information identity and revision.

A representation may be a PDF, native model, image, report rendering or other consumable form.

A Record is retained evidence of business truth according to retention/legal requirements.

## Events, audit and provenance

The kernel distinguishes:

- authoritative object state;
- audit evidence;
- business event;
- transactional outbox message;
- analytical/search projection.

These may originate from the same transaction but have different purposes.

## External systems

External applications may remain authoritative for a specialist domain.

NuBlox must map them through:

- external system identity;
- external object identity;
- source-of-record status;
- synchronization/integration state;
- transformation rules;
- provenance;
- reconciliation state.

Vendor object models must not become the NuBlox canonical model by accident.

## Kernel rule

A new function or Industry Solution must reuse kernel capabilities wherever the concept is shared.

Creating a second Person, Organisation, Project, workflow engine, approval model, audit framework or document identity because a new domain needs one is an architectural defect.
