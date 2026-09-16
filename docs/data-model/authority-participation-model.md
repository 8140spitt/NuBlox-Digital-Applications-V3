# Authority and Participation Model

**Status:** governed logical-model baseline  
**Date:** 16 September 2026  
**Scope:** NuBlox V3 identity-to-action authorization semantics

## Purpose

This model defines how an authenticated NuBlox user becomes an authorised business actor. It deliberately separates authentication, party identity, participation, role, responsibility, delegated authority and policy evaluation.

The machine-readable authority is `app/src/lib/data/authority-participation-model.ts`.

## Core rule

**Authentication is not authorization.**

A `User Identity` proves who is signed in. It does not itself establish business authority. Runtime action availability is derived from the linked Person/Party plus effective Membership, Role Assignment, Responsibility Assignment, Delegated Authority and policy/object context.

```text
User Identity
  -> Person / Party
     -> Membership
        -> Role Assignment
        -> Responsibility Assignment
        -> Delegated Authority (when required)
           -> policy + segregation of duties + object scope/state
              -> allowed actions
```

## Canonical authority concepts

| Model ID | Candidate | Treatment | Meaning |
| --- | --- | --- | --- |
| AUTH-USER-IDENTITY | BOF-01-013 | canonical identity | authenticated platform principal; no business authority by itself |
| AUTH-MEMBERSHIP | BOF-01-012 | canonical relationship | effective participation in organisation/project/context |
| AUTH-PARTY-RELATIONSHIP | BOF-01-016 | canonical relationship | customer/supplier/subcontractor/consultant/etc. relationship between Parties |
| AUTH-ROLE-ASSIGNMENT | BOF-01-018 | canonical relationship | Party assigned to a governed role within explicit scope |
| AUTH-RESPONSIBILITY-ASSIGNMENT | BOF-06-020 | canonical relationship | Party accountable/responsible for a governed object/context |
| AUTH-DELEGATED-AUTHORITY | BOF-01-019 | canonical authorization | approved authority grant constrained by action, scope, value and time |

The BOF-07 Responsibility Assignment occurrence is merged into BOF-06-020 because information-management and project responsibility use the same underlying assignment semantics.

## Authorization evaluation

NuBlox evaluates actions in this order:

1. authenticate an active User Identity;
2. resolve it to canonical Person/Party identity;
3. confirm effective Membership in the relevant tenant/context;
4. evaluate scoped Role Assignments;
5. evaluate Responsibility Assignments where action depends on ownership/accountability;
6. verify Delegated Authority for material decisions/commitments;
7. apply segregation-of-duties, lifecycle-state, record-scope and other policy constraints;
8. expose only actions that pass;
9. re-evaluate server-side at execution and capture authority evidence.

## Delegated authority

A material authority grant must preserve at least:

- grantor or governing authority basis;
- delegate Party;
- authority type/action classes;
- tenant/legal-entity/organisation-unit/project/contract scope as applicable;
- currency and value/quantity limits where applicable;
- valid-from and valid-to;
- approval evidence;
- suspension/revocation/expiry;
- whether sub-delegation is explicitly permitted.

A role such as `Approver` does not imply an unlimited authority level. A person may have UI/workflow permission to process an approval task while still lacking the delegated authority required to approve that particular value, contract, legal entity or project.

## Responsibility versus authority

Responsibility and authority are deliberately distinct.

A Project Manager may be responsible for a Project but have a contract commitment limit. A Quantity Surveyor may be responsible for a valuation while approval must be performed by another authority holder. An Information Manager may own a review process without having authority to approve commercial commitments.

## Segregation of duties

Policies can prevent an actor from performing a combination of actions even when individual assignments exist. Examples include:

- creator cannot be final approver;
- payment preparer cannot release the same payment;
- tender evaluator cannot approve an undeclared conflicted supplier;
- user cannot grant themselves delegated authority;
- authority grantor cannot exceed their own authority unless the governing framework explicitly provides that right.

## F01.01 consequence

The earlier prototype behaviour `if record is IN_REVIEW then show Approve/Return/Reject` is not a valid NuBlox authorization model.

The correct decision is closer to:

```text
record state
+ authenticated User Identity
+ resolved Party/Person
+ effective Membership
+ scoped Role Assignment
+ Responsibility Assignment
+ Delegated Authority when material
+ segregation-of-duties/policy
= available action set
```

The server must re-evaluate the same conditions when the action is executed. Hiding a button is presentation, not security.

## Implementation boundary

This logical model does not yet prescribe a specific authentication provider, RBAC library, policy engine or database layout. Those implementation choices must preserve these semantics, including tenant isolation, effectivity, server-side enforcement and durable authority evidence.
