# Windchill-Derived P0 Shared Control Plane — Candidate NuBlox Model

**Status:** Candidate architecture input — not yet governing  
**Evidence basis:** Closed PTC Windchill Help Center study plus implementation reconciliation  
**Purpose:** Define the smallest coherent shared-control object model required before implementation of the highest-priority Windchill-derived gaps.

> These identities are vendor-neutral NuBlox candidates. Windchill names and module boundaries are evidence only.

## 1. Why this layer exists

The current kernel already has strong foundations for:

- identity;
- authority;
- permissions;
- lifecycle;
- workflow/work;
- decisions/evidence;
- information revision/iteration;
- baseline/effectivity;
- change;
- integration jobs/outbox;
- external identity;
- migration reconciliation.

The PTC study exposes a further shared-control layer needed to make those foundations consistently governable across all 29 Functions and the CBE industry solution.

The highest-priority missing concerns are:

1. policy scope/inheritance;
2. information security classification/clearance;
3. governed type/attribute metadata;
4. deterministic configuration resolution;
5. exchange package/delivery/receipt/authority transfer;
6. closed-loop integration publication;
7. controlled migration execution;
8. retention/hold/disposition/archive/restore.

These are cross-platform controls. They are not individual Function applications.

---

# 2. Policy scope and inherited control

## Candidate identities

### PolicyScope

Represents a governed scope at which policy can be declared.

Candidate fields:

- id;
- tenantId;
- scopeType;
- scopeObjectId;
- parentPolicyScopeId;
- code;
- name;
- status.

### PolicyDefinition

Represents a reusable policy definition.

Candidate fields:

- id;
- tenantId;
- policyType;
- code;
- name;
- version;
- status;
- effectiveFrom;
- effectiveTo.

### PolicyAssignment

Binds a policy definition to a PolicyScope.

Candidate fields:

- id;
- tenantId;
- policyScopeId;
- policyDefinitionId;
- assignmentMode: INHERIT | OVERRIDE | SUPPLEMENT | BLOCK;
- precedence;
- effectiveFrom;
- effectiveTo.

## Invariant

```text
Context hierarchy
!=
Policy-scope hierarchy
!=
Organisation hierarchy
!=
Object-type hierarchy
```

Effective policy must be reconstructable with provenance:

```text
effective policy
= inherited assignments
+ local supplemental assignments
+ explicit overrides
- blocked inherited assignments
```

A user must be able to determine **why** a policy applied.

---

# 3. Information security classification and clearance

## Candidate identities

### SecurityClassificationScheme

Defines a controlled classification scheme.

### SecurityClassificationLevel

A level/value within that scheme.

### SecurityClassificationAssignment

Classifies an exact governed subject/version.

### ClearanceGrant

Authorises a Person, Position, Team or Organisation participant for classification values/scopes.

### SecurityAccessException

Represents an Agreement/exception-based access route with:

- subject scope;
- participant scope;
- effective dates;
- approval/decision evidence;
- reason;
- status.

## Evaluation rule

Access to classified information must require all applicable controls:

```text
base permission
AND classification clearance
AND scope eligibility
AND effective-date validity
AND any required agreement/exception
```

Visibility is not authority, and clearance is not a substitute for permission.

---

# 4. Governed metadata model

## Candidate identities

### TypeDefinition

Defines a governed business/domain type.

### AttributeDefinition

Defines a reusable governed attribute.

### TypeAttributeAssignment

Associates an attribute to a type with local constraints/requiredness/order.

### ConstraintDefinition

Defines validation constraints.

### EnumerationDefinition / EnumerationValue

Defines controlled value sets.

## Requirements

A TypeDefinition must support:

- parent type;
- object-family compatibility;
- lifecycle policy reference;
- default template reference;
- creation policy reference;
- classification applicability;
- extension/package provenance;
- effective dates/versioning where configuration control requires it.

Metadata must be queryable and governed without requiring a new database schema for every tenant/domain extension.

This does **not** imply an untyped universal entity table. Strong native aggregates remain strongly typed.

---

# 5. Configuration resolution

Current Baseline and Effectivity objects identify governed configuration data but do not yet define the reusable rule that resolves a configuration.

## Candidate identities

### ConfigurationResolutionDefinition

A named versioned configuration-selection policy.

### ConfigurationCriterion

Ordered rule within a definition, for example:

- baseline;
- lifecycle maturity;
- date;
- unit/serial/lot;
- project;
- location;
- as-stored;
- explicit version;
- fallback behaviour.

### ConfigurationResolutionRun

Records execution of a resolution policy.

### ConfigurationResolutionItem

Records the exact selected version/identity and the criterion that resolved it.

## Invariant

A business process that claims to operate against a controlled configuration must be able to reconstruct:

```text
resolution definition/version
+ input context
+ ordered criteria
+ exact selected object versions
+ unresolved/conflict results
+ execution timestamp
```

"Latest" alone is not a reproducible configuration strategy.

---

# 6. Exchange package, delivery and authority

Existing NuBlox Transmittal concepts cover communication/issue but do not yet represent the whole exchange authority graph proven by the package research.

## Candidate identities

### ExchangePackage

Governed collection/snapshot selected for exchange.

### ExchangePackageItem

Exact object/version/representation membership.

### ExchangeDelivery

Outbound transmission event of an ExchangePackage.

### ExchangeRecipient

Recipient and target-system context.

### ReceivedDelivery

Recipient-side control record for receipt, validation, mapping and import.

### ExchangeMapping

Maps source semantics to target semantics, such as:

- context;
- organisation;
- lifecycle;
- classification;
- folder/location;
- type;
- version.

### ExchangeDeltaItem

Captures NEW | CHANGED | MOVED | DELETED | ABSENT semantics relative to a prior delivery/base.

### AuthorityAdoption

Explicit transfer/adoption of master authority.

## Critical invariants

```text
Package != Delivery
Delivery != Receipt
Receipt != Acceptance
Acceptance != Import
Import != Authority transfer
```

Authority transfer requires an explicit governed command/decision.

---

# 7. Closed-loop integration publication

Current `OutboxMessage`, `IntegrationJob`, `CanonicalDataEnvelope` and `ExternalIdentity` are strong transport/runtime foundations.

The missing business-control graph is:

### IntegrationEndpoint

Defines the external business endpoint and capabilities.

### PublicationTransaction

Represents one governed outbound business publication.

### PublicationActivity

Represents object/subtransaction publication within the transaction.

### PublicationAttempt

Represents a transport attempt/retry.

### PublicationAcknowledgement

Records downstream transport/business response.

### PublicationResult

Represents business outcome separately from transport success.

### SourceAuthorityRule

Defines whether NuBlox, target system or another authority owns subsequent master changes.

## Invariant

```text
HTTP/message delivered
!=
business object accepted
!=
downstream transaction completed
```

Retry must operate on an idempotent publication identity, not create a new business transaction accidentally.

---

# 8. Controlled migration execution

Current `MigrationReconciliation` validates source/target correspondence but does not represent the entire controlled migration.

## Candidate identities

### MigrationPlan

Defines source, target, scope, mapping set and cutover strategy.

### MigrationMappingVersion

Immutable mapping/transformation definition used by a run.

### MigrationRun

Execution instance.

### MigrationItemResult

Per-source-object outcome including target identity/version and result.

### MigrationConflict

Explicit unresolved semantic/data conflict.

### MigrationConflictDisposition

Governed resolution/waiver/retry decision.

### MigrationReconciliationRun

Groups reconciliation evidence at a defined migration checkpoint.

### CutoverDecision

Authority-backed decision permitting target system operational authority.

## Invariant

Migration completion requires more than successful inserts:

```text
extract
-> map
-> load
-> reconcile
-> resolve conflicts
-> verify semantic preservation
-> approve cutover
-> establish new authority
```

---

# 9. Retention, hold, disposition, archive and restore

## Candidate identities

### RetentionPolicy

Defines retention requirement by governed subject type/classification/context.

### Hold

Suspends eligible disposition for a governed scope.

### DispositionRule

Defines selection and permissible disposition action.

### DispositionSchedule

Schedules rule evaluation.

### DispositionRun

One execution of disposition policy.

### DispositionItemResult

Per-object outcome including conflict/hold/rejection.

### ArchiveRecord

Evidence that an object/content set was moved to governed archive.

### RestoreRun

Controlled restoration request/execution.

### DestructionEvidence

Irreversible evidence of authorised destruction.

## Invariants

```text
Delete != Disposition
Archive != Backup
Restore != Disaster recovery
Retention expiry != automatic destruction when Hold applies
```

Disposition must retain enough evidence to prove what was evaluated, under which policy/version, by whom/what authority, with what outcome.

---

# 10. Cross-cutting requirements

Every candidate aggregate above must support, where applicable:

- Tenant isolation;
- canonical stable identity;
- explicit context/scope;
- effective dates;
- lifecycle/state;
- Authority-backed commands;
- exact-version Decision linkage where approval is required;
- Event emission;
- Audit/Evidence;
- external identity/provenance;
- idempotent command handling;
- transactional outbox emission.

## Command/query separation

State-changing operations should be explicit domain commands.

Examples:

```text
classifyInformation(...)
grantClearance(...)
resolveConfiguration(...)
freezeExchangePackage(...)
dispatchExchangeDelivery(...)
recordReceivedDelivery(...)
adoptExternalAuthority(...)
publishToEndpoint(...)
recordPublicationAcknowledgement(...)
startMigrationRun(...)
disposeRecords(...)
restoreArchive(...)
```

These must not be implemented as arbitrary unrestricted row updates.

---

# 11. Proposed implementation order

## P0-A — Governed metadata and policy

1. PolicyScope / PolicyAssignment
2. Security Classification / Clearance
3. Type / Attribute / Constraint / Enumeration definitions

## P0-B — Configuration and exchange authority

4. Configuration Resolution Definition / Run
5. Exchange Package / Delivery / Received Delivery / Mapping / Authority Adoption

## P0-C — Integration and migration control

6. Integration Endpoint / Publication Transaction / Acknowledgement
7. Migration Plan / Run / Mapping / Conflict / Cutover

## P0-D — Information governance

8. Retention / Hold / Disposition / Archive / Restore

Each implementation slice must include:

```text
kernel types
-> IDs/registry
-> persistence migration
-> repository
-> command service
-> read projection
-> permissions/authority
-> audit/outbox
-> tests
-> user-executable workspace where appropriate
```

---

# 12. Acceptance gate before governing architecture change

This candidate model should only be promoted into the governing architecture when each proposed identity passes the canonical acceptance test:

- independent stable identity?
- independent lifecycle/state?
- distinct authority boundary?
- relationship/effectivity requiring its own evidence?
- independent historical/provenance requirement?
- transaction boundary?
- cannot be safely represented as a property of an existing aggregate?

Only accepted candidates should then be added to:

- `docs/architecture/07-canonical-object-model.md`;
- the relevant ADRs;
- `packages/kernel/src/registry.ts`;
- persistence migrations and services.
