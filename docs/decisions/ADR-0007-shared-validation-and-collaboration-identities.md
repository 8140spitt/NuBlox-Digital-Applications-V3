# ADR-0007 — Shared Validation & Collaboration Canonical Identities

**Status:** Accepted  
**Date:** 23 September 2026  
**Decision type:** Enterprise Kernel / shared control and collaboration architecture

## Context

The completed PTC Windchill Help Center traversal exposed two capability families that were not fully represented when ADR-0006 was accepted:

1. reusable Business Rules, Rule Sets, association constraints and mapping rules; and
2. Meetings, Discussions, Subscriptions, Notebooks/reference collections and cross-context references.

The evidence is significant because both families are easy to implement incorrectly as local UI features.

Business validation can otherwise become duplicated inside workflow handlers, lifecycle transitions and domain screens.

Collaboration can otherwise be collapsed into Work Items, Decisions, permissions or context hierarchy.

The Windchill-derived canonical acceptance matrix confirms that the material identities below have independent state, evidence/provenance or relationship semantics sufficient to warrant canonical treatment.

## Decision

### 1. Shared validation policy

NuBlox will add the following shared canonical control identities.

#### Top-level canonical identities

- Validation Rule Definition;
- Validation Rule Set;
- Validation Rule Evaluation Run;
- Validation Conflict;
- Relationship Constraint Policy;
- Mapping Policy.

#### Governed child/relationship records

- Validation Rule Set Member;
- Validation Rule Result.

Validation rules are executable governed policy. They may gate lifecycle, workflow, Change, release, acceptance, transaction or domain commands, but they are not themselves those mechanisms.

The following invariants are adopted:

~~~text
Validation Rule != Workflow
Validation Rule != Lifecycle Transition
Validation Rule != UI validation
Relationship Constraint != Permission
Mapping Policy != Migration Mapping instance
~~~

A governed evaluation must retain enough evidence to reconstruct:

~~~text
rule-set identity/version
+ exact evaluated subject/version/configuration
+ evaluation context
+ individual rule results
+ conflicts/waivers/dispositions
+ resulting command or Decision
~~~

### 2. Shared collaboration and contextual reference

NuBlox will add shared collaboration/reference semantics that can be reused across all Functions and Industry Solutions.

#### Top-level canonical identities

- Collaboration Session;
- Discussion Thread;
- Subscription;
- Reference Collection;
- Cross-Context Reference.

#### Governed child records

- Discussion Contribution.

A formal **Meeting** is a governed specialisation of Collaboration Session where agenda, minutes, resolutions, actions or statutory/governance requirements apply.

The following invariants are adopted:

~~~text
Conversation != Work Item
Comment != Decision
Subscription != Permission
Reference Collection != authoritative containment
Cross-Context Reference != context hierarchy
~~~

Collaboration may reference governed Work, Decisions, Deliverables and business objects but cannot silently alter their authoritative state.

### 3. Engine ownership

The existing canonical engine count remains unchanged.

Shared validation extends:

- **NTE-004 — Lifecycle, Validation, Decision & Evidence**

because validation evaluation is a cross-platform control that gates authoritative state-changing commands and produces durable evidence.

Shared collaboration extends:

- **NTE-012 — Meeting, Collaboration & Governance**

which owns reusable collaboration/session/thread primitives and formal governance meeting specialisations.

This does not make collaboration an authority mechanism. NTE-003 remains the owner of Workflow/Work/Assignment and NTE-002 remains the owner of permissions/authority.

### 4. Implementation priority

Validation is a **P0 shared-control dependency** and joins Wave 0A.

Required implementation slice:

- IDs/registry;
- kernel types/factories;
- persistence migration;
- repository;
- versioned rule definitions/rule sets;
- deterministic rule-set membership/order;
- evaluation command/runtime;
- result/conflict evidence;
- relationship constraint evaluation;
- mapping-policy resolution;
- permission/Authority gates;
- audit/outbox;
- automated tests;
- administration/read workspace.

Collaboration is **P1 shared capability** unless a dependent engine requires it earlier.

Required implementation slice:

- Collaboration Session;
- Discussion Thread/Contribution;
- Subscription;
- Reference Collection;
- Cross-Context Reference;
- object/context linking;
- access-aware read/write evaluation;
- notification/event integration;
- audit history;
- user workspace.

## Consequences

### Positive

- lifecycle/change/release/domain engines do not duplicate business-rule frameworks;
- rule evaluations become reconstructable evidence rather than transient UI checks;
- relationship validity is governed explicitly;
- conversations and subscriptions do not become accidental Work or permission systems;
- context networks/references cannot corrupt administrative hierarchy;
- formal meetings can reuse collaboration primitives while retaining governance-specific semantics.

### Costs

- NTE-004 changes from fully implemented to partial until validation runtime exists;
- NTE-012 scope expands beyond board/committee governance;
- rule versioning/evaluation semantics require another persistence and service slice;
- collaboration requires access-aware object linking and notification integration.

## Evidence

- `docs/reference/windchill-collaboration-business-rules-model.md`;
- `docs/reference/windchill-derived-canonical-acceptance-matrix.csv`;
- `docs/reference/windchill-to-nublox-canonical-requirement-matrix.csv`;
- `docs/reference/windchill-translation-implementation-priority-register.csv`;
- `docs/reference/windchill-derived-p0-shared-control-plane-candidate-model.md`.

This ADR promotes the accepted validation and collaboration candidates into governing NuBlox architecture without adopting Windchill product/module boundaries.
