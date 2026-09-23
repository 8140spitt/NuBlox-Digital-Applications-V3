# 07 — Canonical Object Model

**Status:** Governing canonical semantic model  
**Effective:** 20 September 2026

NuBlox operates through one canonical enterprise object graph.

The objective is not one giant table or one universal object type. The objective is one authoritative semantic identity for each enterprise concept, with explicit relationships between concepts.

## Canonical families

### Tenant, Parties and Organisation

- Tenant;
- Party;
- Person;
- Organisation;
- Legal Entity;
- Organisation Unit;
- Position;
- Team;
- Membership;
- employment/engagement;
- Customer relationship;
- Supplier relationship;
- external Party identity.

### Capability and people

- Function;
- Delivery Domain;
- Process;
- Activity;
- Task Definition;
- Job Profile;
- Competence Requirement;
- Competence Evidence;
- Responsibility;
- Functional Deployment;
- Deployment Assignment;
- Authority Assignment.

### Policy, metadata and information security

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

### Commercial and relationship

- Customer;
- Supplier;
- Contract;
- Agreement;
- Appointment;
- Framework;
- Obligation;
- commercial Change;
- valuation / certificate / payment relationship.

### Delivery context

- Portfolio;
- Programme;
- Project;
- Work Package;
- Site;
- Facility;
- Location;
- Space;
- System;
- Asset;
- service context.

### Product, item and configuration

- Item;
- Product;
- Requirement;
- Configuration Item;
- Configuration;
- Baseline;
- Effectivity;
- Configuration Resolution Definition;
- Configuration Resolution Run;
- supplier/manufacturer relationship;
- lot/batch/serial identity.

### Information and outputs

- Deliverable Requirement;
- Deliverable Item;
- Information Container;
- Document;
- Record;
- content/file;
- Representation;
- Classification;
- issue/transmittal;
- recipient response;
- Exchange Package;
- Exchange Delivery;
- Received Delivery;
- Authority Adoption.

### Validation policy and rule evidence

- Validation Rule Definition;
- Validation Rule Set;
- Validation Rule Evaluation Run;
- Validation Conflict;
- Relationship Constraint Policy;
- Mapping Policy;
- Validation Rule Set Member;
- Validation Rule Result.

### Collaboration and contextual reference

- Collaboration Session;
- Meeting;
- Discussion Thread;
- Discussion Contribution;
- Subscription;
- Reference Collection;
- Cross-Context Reference.

### Work and control

- Workflow Definition;
- Workflow Instance;
- Work Item;
- Assignment;
- Lifecycle;
- Change;
- Decision;
- Approval;
- Acceptance;
- Event;
- Evidence;
- Audit Entry;
- Notification.

### Integration, migration and information governance

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
- Retention Policy;
- Hold;
- Disposition Rule;
- Disposition Schedule;
- Disposition Run;
- Archive Record;
- Restore Run;
- Destruction Evidence.

### Transactions

Structured business transactions are first-class objects where applicable, for example:

- quote;
- Sales Order;
- requisition;
- Purchase Order;
- goods receipt;
- invoice;
- payment;
- journal;
- stock movement;
- Work Order.

A PDF Representation does not replace the structured transaction.

## Identity principle

Enterprise identity must survive changes of:

- state;
- Revision;
- Iteration;
- Representation;
- organisational ownership;
- Project context;
- system integration.

Where configuration control is required, a stable Master identity is distinct from Revision and working Iteration.

## One identity, many views

An Organisation may be customer, Supplier, subcontractor, consultant, partner or regulator without becoming several Organisation masters.

A Project may be viewed by Project Management, Commercial, Planning, Design, Procurement, Finance, HSE, Quality and Information Management without being duplicated.

An Asset may originate from design/configuration and later be viewed through commissioning, operations, maintenance, finance and compliance without losing continuity.

## Relationship principle

Relationships are explicit.

A relationship becomes a first-class governed object where relationship identity, role, validity, Authority, Effectivity, scope or Evidence matters.

Examples:

- Organisation supplies Organisation;
- Person occupies Position;
- Job Profile participates in Function;
- Functional Deployment binds Person/Position to Project/Package scope;
- Requirement requires Deliverable Item;
- Deliverable Item represented by Information Container;
- Deliverable Item affects Asset;
- Change affects Requirement/Deliverable/Item/Asset;
- Decision authorises state transition;
- Baseline contains Configuration Item revision.

## Structure principle

Different enterprise structures remain distinct even when they are related:

- Organisation structure;
- Project/WBS;
- Contract/Package structure;
- cost breakdown structure;
- Product/BOM;
- System/Asset hierarchy;
- location/spatial hierarchy;
- process hierarchy;
- information/deliverable structure.

Mappings between structures are explicit relationships, not accidental shared identifiers.

## Deliverable versus information versus physical outcome

A Deliverable Item represents the governed obligation/output identity.

An Information Container manages controlled information identity/revision.

A file is content.

A Representation is a consumable rendered/native form.

A physical Item/Asset is the realised physical object.

Evidence proves an event, result or state.

These may be related but must not be conflated.

## External identity

External identifiers and source references allow NuBlox to interoperate with specialist applications while preserving NuBlox canonical semantics.

External source identity does not automatically become canonical NuBlox identity.

Exchange receipt, acceptance and import do not automatically transfer master authority. Authority Adoption is an explicit governed action.

## Aggregate-root principle

A named canonical identity is not automatically a top-level aggregate root. Child records remain within the parent aggregate unless they require their own independent lifecycle, authority/command boundary, consistency boundary or durable historical identity.

ADR-0006 applies this rule to the shared control-plane families.

## Canonical-model acceptance test

For any important business concept NuBlox must be able to identify:

- its stable identity;
- authoritative source;
- type/classification;
- current state;
- Revision/version/Iteration semantics where required;
- governing relationships;
- operating context;
- responsible Parties;
- relevant Authority;
- linked Work/Decisions/Evidence;
- Change and Baseline history where required;
- external identity/provenance where integrated or migrated.
