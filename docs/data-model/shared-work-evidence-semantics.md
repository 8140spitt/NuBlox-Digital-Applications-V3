# Shared Work, Workflow, Decision, Evidence, Audit & Retention Semantics

## Purpose

This model defines the reusable platform semantics that coordinate work across all 29 NuBlox tenant workspaces without allowing workflow/runtime state to replace authoritative domain truth.

The governing sequence is:

```text
Canonical Business Object / Case / Transaction
                ↓
        Workflow Instance
                ↓
      Work Item / Request
                ↓
        Response / Decision
                ↓
      Domain Command / Action
                ↓
      Evidence / Audit / Events
                ↓
   Retention / Hold / Disposition
```

The central rule is:

> Workflow coordinates work around business truth. It is not business truth.

## Core distinctions

### Workflow Definition vs Workflow Instance

A Workflow Definition is versioned orchestration configuration. A Workflow Instance is runtime state created from one exact published definition version.

Neither defines the authoritative lifecycle of every domain object. Domain services own valid state transitions for Contracts, Assets, Projects, Invoices, Information Containers and other canonical objects.

### Work Item vs domain work

A shared Work Item is an actionable coordination object. It is deliberately distinct from:

- Project Schedule Activity;
- operational Work Order;
- Service Appointment;
- Commissioning Activity;
- manufacturing execution work;
- the domain case/transaction being acted upon.

The shared Work Item may reference those objects, but it never replaces them.

### Assignment vs responsibility vs permission vs authority

These remain separate:

```text
Work Assignment
    ≠ Responsibility Assignment
    ≠ Role / Permission
    ≠ Delegated Authority
```

Being assigned an approval task does not automatically authorise the assignee to approve it. Protected decisions require the relevant permission plus a valid authority basis in scope at decision time.

Work Delegation is similarly distinct from Delegated Authority. Delegating an inbox/task does not delegate commercial, financial, statutory or contractual signing authority.

## Request and decision model

NuBlox keeps the following identities distinct:

- Review Request — asks for review/evaluation;
- Approval Request — asks for an approval/reject/return decision;
- Decision Request — asks an authorised actor/body to decide a defined question;
- Request Response — attributable response/input to a request;
- Decision — immutable attributable outcome;
- Decision Action — follow-up obligation/work produced by the decision.

A response is not automatically a decision. A decision is not the authoritative domain state change.

The correct pattern is:

```text
Approval Request
    ↓
Response(s)
    ↓
Decision
    ↓
Authority validation
    ↓
Domain command
    ↓
Authoritative business state changes
    ↓
Approval Evidence / Business Event / Audit Event
```

This avoids the common anti-pattern where workflow tables become the real business record.

## Contextual actions and user experience

NuBlox must not expose the entire lifecycle/workflow graph to every user as the primary interface.

Visible actions are resolved from:

```text
current business state
+ current work/request state
+ user identity
+ membership / role / permissions
+ assignment
+ delegated/statutory authority
+ segregation-of-duties rules
+ tenant / object scope
```

The user should see the small set of actions they can actually perform now. Lifecycle history, workflow diagnostics, versions and audit detail remain progressively disclosed.

This principle directly governs later replacement of the temporary F01.01 prototype behaviour.

## Work-control evidence

### Due date and priority

Due Date Change Record and Priority Change Record preserve prior/new values, actor, reason and timestamp. Current routing values are derived from current Work Item state plus retained change history.

Due date and priority do not become domain lifecycle states.

### Escalation

Escalation is retained routing/control evidence. Escalation can re-route or notify work but cannot silently transfer authority.

### Collaboration Invitation

Project Participation Invitation is normalised to the shared Collaboration Invitation pattern. Acceptance may create Project-scoped Membership/participation, but does not automatically create unrestricted permission or authority.

## Evidence model

### Business Event

A Business Event is an immutable semantic occurrence emitted when committed business truth changes or a material business fact occurs.

It must retain:

- event identity and type;
- source canonical object/aggregate;
- source version where relevant;
- tenant/context;
- actor/system;
- occurred-at time;
- correlation and causation identifiers;
- schema/payload version.

The source aggregate remains authoritative.

### Audit Event

Audit Event is append-only accountability/security evidence. It records who/what performed an auditable action, against which target/context, when and with what result.

Audit Event is not the same thing as Business Event.

### Change Event

Change Event preserves attributable before/after evidence for governed mutable state or configuration.

It complements domain history and never becomes the current record itself.

### Approval Evidence

Approval Evidence binds together:

- approval request;
- immutable decision;
- exact subject/version/configuration;
- actor/decision body;
- authority basis;
- timestamp;
- signature/statement where required.

Approval evidence cannot float to a later revision.

### Signature and Attestation

Signature is attributable evidence bound to exact signed content/version or payload digest.

Attestation is an attributable statement that defined facts/conditions are asserted as true under a governing basis.

Neither should be represented as a mutable Boolean flag.

### Evidence Item

Evidence Item provides a generic governed evidence identity for photographs, measurements, files, extracts, statements and similar artefacts. It records provenance, integrity, subject relationships and retention classification.

Evidence supports structured business truth; it does not replace it.

## Provenance and source traceability

Provenance Reference links evidence/derived outputs back to authoritative source objects, versions, datasets or transformations.

Source Reference links NuBlox records to originating external/internal source identifiers without creating duplicate masters.

This gives analytics, AI, integrations and external regulatory exchanges explainable traceability back to source truth.

## Correction and reversal

Corrections and reversals are additive, never destructive.

```text
Original Record
    ↓
Correction Record / Reversal Record
    ↓
New corrective/reversing record
```

The original remains immutable and discoverable. Current interpreted position is derived from the full causal chain.

This rule aligns with financial Ledger Entry immutability and applies more broadly wherever evidential accountability is required.

## Archive, retention and legal hold

### Archive Package

Archive Package is a governed preservation package with:

- exact record/evidence manifest;
- integrity hashes;
- provenance;
- retention classification;
- custody/location;
- sealed package version.

It is not a second operational master or uncontrolled folder.

### Retention Disposition Decision

Disposition is an authorised evidenced decision to retain, transfer, archive or destroy eligible records/evidence under applicable retention rules.

The decision must record exact scope, rule/schedule basis, eligibility, hold evaluation, authority and execution evidence.

### Legal Hold Link

Legal Hold Link is an effective relationship applying preservation hold to exact object/record/evidence scope.

An active hold blocks otherwise-eligible disposition. It does not change the canonical object's business lifecycle or identity.

## Reliable event publication

Outbox Message is the reliable integration-delivery envelope derived from one committed Business Event.

```text
Domain transaction commits
    ├── authoritative domain state
    ├── Business Event
    └── Outbox Message
              ↓
       reliable publication
```

The Outbox Message is transport evidence, not a second authoritative event stream. Retries update delivery-attempt history; they do not create duplicate business effects.

## Candidate normalization decisions

BOF-27 and BOF-28 are fully covered by the governed semantic model.

Important normalisations include:

- `Assignment` → `Work Assignment` relationship;
- `Escalation` → `Escalation Record`;
- `Due Date Record` → immutable `Due Date Change Record`;
- `Priority Record` → immutable `Priority Change Record`;
- `Delegation` → `Work Delegation`, explicitly not Delegated Authority;
- `Project Participation Invitation` → shared Collaboration Invitation pattern;
- generic `Response` → `Request Response`, distinguished from `Information Response`;
- `Attestation` → immutable event/evidence rather than work execution;
- `Retention Disposition` → `Retention Disposition Decision`;
- `Immutable Outbox Event` → `Outbox Message`, making its transport role explicit.

## Non-negotiable architecture rules

1. Workflow coordinates business work but does not own authoritative domain lifecycle/state.
2. Shared Work Item is not Schedule Activity, Work Order or the specialist domain task/case.
3. Assignment does not equal responsibility, permission or authority.
4. Work Delegation never grants Delegated Authority.
5. Review, approval and decision requests are distinct and bind exact subject/version context.
6. Response is not Decision; Decision is immutable evidence.
7. Domain state changes only through explicit domain commands after applicable validation.
8. Approval evidence binds to exact content/version plus authority basis.
9. User interfaces show contextual current actions rather than the whole workflow graph.
10. Business Event, Audit Event, Change Event and Outbox Message remain semantically distinct.
11. Evidence/corrections/reversals are append-only where accountability requires it.
12. Signature/attestation binds to exact subject/content and actor.
13. Archive packages preserve evidence without replacing operational masters.
14. Active Legal Hold blocks disposition.
15. Outbox Message is transport evidence, not authoritative business truth.
16. Tenant/context and actor/system provenance are explicit throughout.

## Implementation consequence

This semantic block is the prerequisite for building a real `My Work` experience and for correcting the F01.01 prototype. The later implementation should resolve permitted current actions from business state + work state + identity + membership + permission + assignment + authority, while keeping workflow diagnostics and audit detail out of the primary task UI unless explicitly requested.
