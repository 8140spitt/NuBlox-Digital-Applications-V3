# 02 — Enterprise Platform Kernel

**Status:** Governing shared-platform architecture  
**Effective:** 20 September 2026

## Purpose

The Enterprise Kernel is the common substrate beneath every NuBlox function and Industry Solution.

Its purpose is to implement shared enterprise concepts once, preserve one authoritative meaning for each concept and provide reusable control runtimes across the product.

## Kernel capability groups

### Identity, party and organisation

- Tenant;
- Party;
- Person;
- Organisation;
- Legal Entity;
- Organisation Unit;
- Position;
- Team;
- Membership;
- employment / engagement;
- Customer relationship;
- Supplier relationship;
- external Party identity.

### Responsibility, authority and access

- Job Profile;
- Responsibility;
- Project / delivery role;
- access role;
- Permission;
- scope;
- Authority;
- Delegation;
- Decision Right;
- financial / contractual / technical thresholds;
- Segregation of Duties;
- Competence Constraint;
- Contextual Access Policy.

The kernel keeps these concepts separate.

**Job Profile != Person != Position != Project Role != access role != Permission != Authority.**

### Governed policy, metadata and information security

- Policy Scope;
- Policy Definition;
- Policy Assignment;
- Security Classification Scheme;
- Security Classification Level;
- Security Classification Assignment;
- Clearance Grant;
- Security Access Exception;
- Type Definition;
- Attribute Definition;
- Constraint Definition;
- Enumeration Definition / Value;
- Type Attribute Assignment.

Policy scope, Organisation hierarchy, context hierarchy and object-type hierarchy are distinct structures. Effective policy and security decisions retain inheritance, override and exception provenance.

### Enterprise operating context

- Portfolio;
- Programme;
- Project;
- Contract;
- Agreement;
- Work Package;
- Site;
- Facility;
- Location / Space;
- System;
- Asset;
- Product;
- Item;
- Service.

### Controlled information and configuration

- Requirement;
- Deliverable Requirement;
- Deliverable Item;
- Information Container;
- Document;
- Record;
- content/file;
- Representation;
- Master Identity;
- Revision;
- Iteration;
- Classification;
- governed Relationship;
- Baseline;
- Configuration;
- Effectivity;
- Configuration Resolution Definition / Run;
- Exchange Package / Delivery / Received Delivery;
- Authority Adoption;
- supersession.

### Integration, migration and records governance

- Integration Endpoint;
- Publication Transaction;
- Publication Acknowledgement;
- Source Authority Rule;
- Migration Plan;
- Migration Mapping Version;
- Migration Run;
- Migration Conflict;
- Migration Reconciliation Run;
- Cutover Decision;
- Extension Definition;
- Extension Package Version;
- Extension Component;
- Extension Compatibility Assessment;
- Extension Reconciliation Run;
- Configuration Environment;
- Configuration Baseline;
- Configuration Change Set;
- Configuration Promotion Run;
- Configuration Promotion Conflict;
- Retention Policy;
- Hold;
- Disposition Rule / Schedule / Run;
- Archive Record;
- Restore Run;
- Destruction Evidence.

Existing runtime primitives such as Outbox Message, Integration Job, Data Envelope and Migration Reconciliation support these canonical controls; they do not replace their business/control identities.

### Validation policy

- Validation Rule Definition;
- Validation Rule Set;
- Validation Rule Set Member;
- Validation Rule Evaluation Run;
- Validation Rule Result;
- Validation Conflict;
- Relationship Constraint Policy;
- Mapping Policy.

Validation policy is reusable governed control. It may gate Lifecycle, Workflow, Change, release, acceptance and domain commands, but it does not replace those mechanisms.

### Collaboration and contextual reference

- Collaboration Session;
- Meeting specialisation;
- Discussion Thread;
- Discussion Contribution;
- Subscription;
- Reference Collection;
- Cross-Context Reference.

Collaboration references governed objects and contexts without becoming authoritative Work, Decision, Permission or containment.

### Control runtimes

- Workflow;
- Lifecycle;
- Work Item;
- Assignment;
- Change;
- Decision;
- Approval;
- Event;
- Evidence;
- Audit;
- Notification;
- Integration;
- Transactional Outbox.

## Canonical object graph

NuBlox is a connected enterprise object system.

Authoritative objects are identified once and connected through explicit governed relationships.

Examples:

~~~text
Organisation
  -> employs / engages -> Person
  -> contains -> Organisation Unit
  -> occupies Position -> Person
  -> contracts with -> Organisation

Project
  -> governed by -> Contract
  -> decomposed into -> Work Package
  -> located at -> Site
  -> requires -> Deliverable Item
  -> deploys -> Functional Deployment

Deliverable Item
  -> satisfies -> Requirement
  -> produced through -> Work / Assignment
  -> represented by -> Information Container / Representation
  -> reviewed / approved by -> Decision
  -> issued through -> Issue / Transmittal
  -> accepted by -> Recipient Response / Decision
  -> affects -> Work Package / Item / System / Asset

Asset
  -> installed at -> Location
  -> realised from -> Item / System definition
  -> verified by -> Inspection / Test / Commissioning evidence
  -> maintained through -> Work
~~~

A relationship becomes a first-class governed object where identity, role, validity, scope, authority, effectivity or evidence matters.

## Identity and version semantics

Where configuration control is required, NuBlox distinguishes:

- stable identity;
- current mutable state;
- version;
- revision;
- iteration;
- working draft / working copy;
- Representation;
- release / issue;
- Effectivity;
- Configuration;
- Baseline membership;
- supersession.

These are not interchangeable.

For a controlled object NuBlox should be able to answer:

- What is the object?
- Which revision/version is current?
- Which exact state was reviewed or approved?
- Which Representation was issued?
- Which Baseline includes it?
- Where/when is it effective?
- What superseded it?
- What changed, why and under whose authority?

## Workflow versus lifecycle

Workflow coordinates work around authoritative objects.

Lifecycle governs an authoritative object's state.

Workflow state does not replace lifecycle state.

A lifecycle transition can require:

- valid current state/version;
- mandatory information;
- permission/scope;
- assigned responsibility;
- competence;
- delegated authority;
- review;
- approval;
- Segregation of Duties;
- evidence;
- downstream actions.

## Decision

A Decision is attributable immutable evidence.

It preserves subject identity and exact subject version/revision separately from the domain state transition it authorises or records.

A status value such as APPROVED must not be the only surviving evidence that approval occurred.

## Configuration, Change and Baselines

The reusable control chain is:

~~~text
identify configuration item
-> establish identity
-> establish approved baseline
-> propose change
-> assess impact
-> obtain authorised Decision
-> revise affected definition/work
-> release / issue
-> implement
-> verify implementation
-> reconcile status
-> establish updated baseline
~~~

Configuration status accounting must support reconstruction of what was required, approved, issued, procured/fabricated, constructed/installed, tested, handed over and operational at a point in time.

A controlled configuration is resolved using an explicit Configuration Resolution Definition and must retain the exact criteria, inputs and selected object versions used by a Resolution Run. "Latest" is not sufficient where a reproducible configuration is required.

## Information, content and records

NuBlox distinguishes:

- business object;
- Deliverable Item;
- Information Container;
- file/content;
- Representation;
- Record;
- Evidence.

A file is not automatically the business object.

A Deliverable Item is the governed obligation/output identity.

An Information Container manages controlled information identity/revision.

A Representation is a consumable form such as PDF, native model, image or generated report.

A Record is retained evidence of business truth according to retention/legal requirements.

Retention, legal Hold, Disposition, Archive and Restore are governed controls. Delete is not Disposition; Archive is not Backup; Restore is not disaster recovery.

## Events, audit and provenance

NuBlox distinguishes:

- authoritative object state;
- audit evidence;
- business Event;
- transactional outbox message;
- search/analytical projection.

They may originate from one transaction but serve different purposes.

## External data boundary

NuBlox does not depend on external applications to execute supported enterprise capabilities.

External products may appear only at the platform boundary for:

- migration into NuBlox;
- controlled import of source data;
- controlled export of NuBlox data or representations; and
- historical provenance.

After migration into a NuBlox-owned capability, NuBlox is the authoritative operational system for that capability. External source identities may be retained as provenance, but an external application must not remain necessary to create, edit, approve, transact, control or complete the work.

Vendor schemas must not become the NuBlox canonical model.

For governed exchange, Package, Delivery, Receipt, Acceptance, Import and Authority Transfer are separate states/events. Import or acknowledgement never transfers master authority implicitly.

## Kernel rule

A functional domain or Industry Solution may extend a kernel concept through governed types, attributes, policies, relationships and behaviour.

It must not create a competing enterprise identity or a parallel workflow/approval/audit framework for a concept already owned by the kernel.
