# ADR-0006 — Shared Control Plane Canonical Identities

**Status:** Accepted  
**Date:** 23 September 2026  
**Decision type:** Enterprise Kernel / canonical control architecture

## Context

The PTC Windchill deep study has now closed the material Help Center object/control families and translated them into vendor-neutral NuBlox requirements.

The governing NuBlox architecture already contains strong shared families for identity, authority, access, lifecycle, workflow, information revision, representation, baseline, effectivity, change, events, evidence, integration runtime and migration reconciliation.

The evidence nevertheless exposes a missing shared-control layer that is required across multiple Functions and Industry Solutions. Without these controls, individual domains would otherwise reinvent metadata, policy, configuration-selection, exchange, integration, migration and retention semantics independently.

The decision is therefore not to copy Windchill objects. It is to accept only the semantic identities that pass the NuBlox canonical-object acceptance test.

## Decision

NuBlox will add the following **canonical control families** to the Enterprise Kernel.

### 1. Policy governance

Top-level canonical identities:

- Policy Scope;
- Policy Definition.

Governed child/relationship records:

- Policy Assignment.

Policy hierarchy and context/organisation hierarchy remain distinct.

Effective policy must retain inheritance/override provenance.

### 2. Information security classification

Top-level canonical identities:

- Security Classification Scheme;
- Security Classification Level;
- Clearance Grant;
- Security Access Exception.

Governed relationship records:

- Security Classification Assignment.

Classification, permission and clearance remain distinct.

### 3. Governed metadata

Top-level canonical identities:

- Type Definition;
- Attribute Definition;
- Constraint Definition;
- Enumeration Definition.

Governed child/relationship records:

- Enumeration Value;
- Type Attribute Assignment.

Strong native aggregates remain strongly typed. Governed metadata exists to support controlled extension, configuration and classification without requiring uncontrolled schema forks.

### 4. Configuration resolution

Top-level canonical identities:

- Configuration Resolution Definition;
- Configuration Resolution Run.

Governed child records:

- Configuration Criterion;
- Configuration Resolution Item.

A controlled configuration must be reproducible from an exact resolution definition/version, input context, ordered criteria and selected object versions.

### 5. Exchange and authority transfer

Top-level canonical identities:

- Exchange Package;
- Exchange Delivery;
- Received Delivery;
- Authority Adoption.

Governed child/relationship records:

- Exchange Package Item;
- Exchange Recipient;
- Exchange Mapping;
- Exchange Delta Item.

The following invariant is adopted:

```text
Package != Delivery
Delivery != Receipt
Receipt != Acceptance
Acceptance != Import
Import != Authority Transfer
```

Authority transfer requires an explicit governed action and retained evidence.

### 6. Closed-loop integration publication

Top-level canonical identities:

- Integration Endpoint;
- Publication Transaction;
- Publication Acknowledgement;
- Source Authority Rule.

Governed child/runtime records:

- Publication Activity;
- Publication Attempt;
- Publication Result.

Transport success and business acceptance remain separate outcomes.

Existing Outbox Message, Integration Job, Data Envelope and External Identity remain runtime/integration primitives and are not replaced.

### 7. Controlled migration

Top-level canonical identities:

- Migration Plan;
- Migration Mapping Version;
- Migration Run;
- Migration Conflict;
- Migration Reconciliation Run;
- Cutover Decision.

Governed child records:

- Migration Item Result;
- Migration Conflict Disposition.

Existing Migration Reconciliation remains useful evidence but is insufficient as the whole migration execution model.

### 8. Records retention and disposition

Top-level canonical identities:

- Retention Policy;
- Hold;
- Disposition Rule;
- Disposition Schedule;
- Disposition Run;
- Archive Record;
- Restore Run;
- Destruction Evidence.

Governed child records:

- Disposition Item Result.

The following invariant is adopted:

```text
Delete != Disposition
Archive != Backup
Restore != Disaster Recovery
```

Retention expiry does not override an effective Hold.

## Deferred from this ADR

The following Windchill-derived candidates remain valid requirements but are not part of this shared-control-plane decision:

- generic Template Definition;
- Object Initialization Policy;
- Preference Definition/effective preference;
- Working Copy / Authoring Session;
- Authoring Association / Build Rule;
- Managed Collection;
- Proposed Change Branch / Redline;
- Saved Query;
- Publication Definition / Rule / Job;
- Report Definition / Report Instance;
- Extension Definition / Extension Package;
- supplier/manufacturing/quality domain aggregates;
- Construction commissioning, commercial administration and field-execution models.

They will be handled through subsequent architecture/domain decisions.

## Aggregate rule

Not every named concept above is a separate aggregate root.

A concept is an aggregate root only when it requires its own independent:

- command boundary;
- lifecycle/state;
- consistency boundary;
- authority decision;
- or retained historical identity.

Child records remain inside their parent aggregate unless implementation evidence later proves an independent boundary.

## Implementation order

### Slice A — policy, security and metadata

1. Policy Scope / Policy Definition / Assignment
2. Security Classification / Clearance / Exception
3. Type / Attribute / Constraint / Enumeration definitions

### Slice B — configuration and exchange

4. Configuration Resolution Definition / Run
5. Exchange Package / Delivery / Received Delivery / Authority Adoption

### Slice C — integration and migration

6. Integration Endpoint / Publication Transaction / Acknowledgement
7. Migration Plan / Run / Mapping / Conflict / Cutover

### Slice D — information governance

8. Retention / Hold / Disposition / Archive / Restore

Each slice must include:

- kernel identifiers/types;
- registry entries;
- persistence migration;
- repository;
- command service;
- read projection;
- permission/authority checks;
- audit/evidence and transactional outbox;
- tests;
- user-executable workspace where the capability is directly administered by users.

## Consequences

### Positive

- shared control semantics are implemented once;
- Function and CBE domains can consume common control infrastructure;
- integration and migration become auditable business processes rather than utility jobs;
- configuration selection becomes deterministic;
- information security and retention become first-class;
- vendor-specific Windchill boundaries are not imported.

### Costs

- the kernel becomes broader;
- several new persistence families and permissions are required;
- migration from existing partial implementations will require compatibility work;
- UI administration for metadata, policy and retention must remain comprehensible rather than exposing raw platform internals.

## Evidence

Primary evidence is recorded under:

- `docs/reference/windchill-help-center-deep-relationship-register.md`;
- `docs/reference/windchill-to-nublox-canonical-requirement-matrix.csv`;
- `docs/reference/windchill-translation-implementation-priority-register.csv`;
- `docs/reference/windchill-derived-p0-shared-control-plane-candidate-model.md`.

This ADR promotes the P0 shared-control candidates from reference evidence into governing NuBlox architecture.
