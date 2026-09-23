# Windchill Evidence → NuBlox Canonical Requirement Translation

**Status:** Candidate architecture input — evidence translation, not yet an accepted architecture decision  
**Source evidence:** Closed PTC Windchill 12.0.2.0 architecture/capability study; closure basis recorded in `windchill-help-center-closure-audit.md`  
**Purpose:** Translate verified Windchill semantics into vendor-neutral NuBlox requirements while preventing Windchill product boundaries or schemas from becoming NuBlox architecture.

## 1. Translation rule

The sequence is now:

```text
verified Windchill evidence
    -> semantic pattern
        -> compare with governing NuBlox model
            -> retain / extend / add / reject
                -> canonical architecture decision
                    -> implementation
```

A Windchill object name is never sufficient justification for a NuBlox object.

A new NuBlox canonical identity is justified only when the evidence exposes a materially distinct:

- stable identity;
- lifecycle/state;
- authority boundary;
- relationship with its own scope/effectivity/evidence;
- transaction consistency boundary;
- historical/provenance requirement; or
- operational control that must survive independently of a UI screen or file.

## 2. Disposition classes

### RETAIN

The NuBlox governing architecture already contains the essential semantic boundary.

Examples:

- Lifecycle;
- Workflow;
- Work Item;
- Change;
- Baseline;
- Configuration;
- Effectivity;
- Representation;
- Decision;
- Evidence;
- Audit.

### EXTEND

NuBlox already has the broader family, but the Windchill evidence proves additional first-class semantics or relationships must be made explicit.

Examples:

- Integration -> endpoint / publication attempt / acknowledgement;
- Supplier relationship -> sourcing context / source approval;
- Configuration -> resolution criteria / configuration specification;
- Information -> information/publication/service structures.

### ADD CANDIDATE CANONICAL IDENTITY

The current governing canonical-object register does not clearly name the proven independent identity.

Examples:

- Migration Run;
- Configuration Promotion Run;
- Retention Policy / Disposition Run;
- Exchange Package / Received Delivery;
- Report Definition / Report Instance;
- Saved Configuration Resolution Rule.

These are **candidate requirements** until accepted through architecture decision/update.

### PLATFORM RUNTIME

The concept matters but belongs primarily to the platform operational/control plane rather than the enterprise business-object graph.

Examples:

- Queue;
- worker runtime;
- vault/cache/replica;
- API domain metadata.

### EXTERNAL RESEARCH GAP

Windchill does not contain sufficient first-class semantics and must not be stretched to fill the gap.

This applies to:

- construction commissioning/test packs/system completion/handover;
- construction commercial/contract administration;
- site production/field execution.

## 3. Strong alignment already present

The PTC study strongly validates existing NuBlox architecture choices:

- stable identity is distinct from Revision and Iteration;
- Workflow is distinct from Lifecycle;
- Work Item is execution, not domain truth;
- Change authority is distinct from lifecycle state;
- Baseline is distinct from folder/collection;
- Configuration resolution is distinct from creating a new version;
- Representation is distinct from authoritative source;
- Organisation context is distinct from product/system structure;
- Project context is distinct from Organisation Unit;
- Responsibility, access role, Permission and Authority must not collapse;
- Decision evidence must survive separately from a resulting status value;
- migration must preserve semantics/provenance rather than flattening controlled history into files.

No redesign is required for those invariants.

## 4. Material canonical gaps exposed by the study

### 4.1 Configuration and administrative governance

Windchill's BAC, OIR, Preferences, Templates, metadata and extension frameworks expose a missing cross-platform control family.

NuBlox requires governed identities for at least:

- Type / Attribute Definition;
- Template Definition;
- Object Initialization Policy;
- Preference Definition / Effective Preference;
- Environment;
- Configuration Baseline;
- Configuration Change Set;
- Configuration Promotion / Deployment Run;
- Extension Definition / Extension Package;
- compatibility / upgrade-reconciliation evidence.

These are not ordinary business Changes. They control how the platform behaves.

### 4.2 Integration and external publication

The generic Kernel concept **Integration** is not sufficient by itself to reconstruct closed-loop publication.

Candidate explicit identities:

- Integration Endpoint;
- Publication Transaction;
- Publication Activity;
- outbound Message/Envelope;
- Delivery Receipt;
- downstream Acknowledgement/Business Result;
- integration Mapping;
- source-authority rule.

This preserves the distinction between message transport and downstream business acceptance.

### 4.3 Migration

The architecture correctly states migration principles but does not yet name the execution graph.

Candidate explicit identities:

- Migration Definition/Plan;
- Migration Run;
- Source Object Reference;
- Mapping Rule/Mapping Version;
- Migration Item/Result;
- Conflict;
- Conflict Disposition;
- Reconciliation Result;
- Cutover Decision.

### 4.4 Exchange and transmittal authority

Existing Issue/Transmittal and Recipient Response concepts cover part of the problem.

The Windchill package evidence adds candidate identities for:

- Exchange Package / Collection;
- Delivery;
- Received Delivery / Receipt;
- import Preview;
- import Mapping;
- delta status (new/changed/deleted/absent);
- source-authority relationship;
- explicit Adoption / Authority Transfer.

Receipt or successful import must never silently transfer master authority.

### 4.5 Retention and disposition

The platform names Record and retention requirements, and F21/F26 include retention/disposition capabilities, but the object graph should explicitly support:

- Retention Policy;
- Legal / Regulatory Hold;
- Disposition Rule / Query;
- Disposition Schedule;
- Disposition Run;
- Disposition Item Result;
- Archive Record;
- Restore Run;
- Destruction Evidence.

This is separate from infrastructure backup retention.

### 4.6 Configuration resolution

Baseline, Configuration and Effectivity already exist.

The Windchill evidence adds the missing selection authority:

- Configuration Resolution Rule / Specification;
- saved Navigation/Resolution Criteria;
- ordered filter stack;
- unresolved/fallback rule;
- exact resolved configuration evidence.

A "current revision" is not a configuration specification.

### 4.7 Product/service/manufacturing specialisations

The shared Kernel should remain generic, while domain aggregates can specialise it with:

- Option / Choice / Option Set / Variant Specification;
- Process Plan / Operation / Sequence;
- Manufacturing Resource;
- Control Characteristic;
- Information Structure / Publication Structure / Parts List;
- Sourcing Context / Source Approval;
- Nonconformance / CAPA / Quality Audit;
- Training Assignment / Training Record;
- Report Definition / Saved View / Report Instance.

These should reuse Kernel identity, lifecycle, workflow, Decision, Evidence, Change and configuration controls rather than build parallel frameworks.

## 5. Context and Team translation

Windchill validates the need for context-specific participation and inherited controls, but NuBlox must not clone the Windchill Site -> Organisation -> Product/Library/Project/Program hierarchy.

The NuBlox decision remains broader:

```text
recursive Organisation structure
+
working Context
+
canonical Function / Professional Domain
+
context-specific Team
+
Governance / Delivery
+
Position / Person participation
+
Responsibility
+
Permission
+
Authority
```

Windchill Shared Team / Context Team / Object Team evidence informs participation resolution; it does not replace NuBlox Team identity or the 29 Function / CBE Domain operating model.

## 6. Architecture boundary

This register does **not** authorize implementation changes yet.

The next architecture action is to reconcile candidate identities against:

- Enterprise Kernel ownership;
- Function/domain aggregate ownership;
- platform operational ownership;
- existing persistence aggregates;
- native engine registry;
- migration/cutover needs.

Only then should the governing canonical object model and ADRs be changed.

## 7. Machine-readable mapping

See:

- `windchill-to-nublox-canonical-requirement-matrix.csv`

The matrix deliberately records evidence-derived candidate additions alongside existing NuBlox concepts so that "Windchill has an object" never becomes the reason NuBlox copies it.
