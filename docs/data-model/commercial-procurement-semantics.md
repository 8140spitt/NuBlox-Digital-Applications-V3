# Commercial & Procurement Semantics

**Status:** governed logical-model baseline  
**Date:** 17 September 2026  
**Scope:** NuBlox V3 contract, commercial-package, procurement-package, sourcing, award and commitment semantics

## Purpose

This document defines the canonical logical model for contracts, appointments, subcontracts, framework agreements, commercial packages, procurement packages, commercial change, sourcing, award, purchase commitments and receipt evidence.

The machine-readable authority is `app/src/lib/data/commercial-procurement-model.ts`.

## Governing principles

1. **One agreement identity pattern.** Appointment, Subcontract and Framework Agreement are governed Contract types, not parallel agreement-master systems.
2. **Party role is contextual.** Employer/client, contractor, subcontractor, supplier, consultant and guarantor roles reference canonical Party/Organisation identity.
3. **Delivery scope is not commercial scope.** WBS and Work Package remain the delivery structures.
4. **Commercial scope is not procurement scope.** Commercial Package and Procurement Package are separately governed and explicitly mapped.
5. **Procurement Package is not commitment.** A package can result in awards, Purchase Orders and Contracts but is not any of those records.
6. **Contract truth is controlled.** Clauses, obligations, key dates, notices and amendments preserve executed history.
7. **Commercial change is a case, not an edit.** Variation and Compensation Event are governed Commercial Change types; approved change does not silently overwrite Contract truth.
8. **Sourcing is traceable end to end.** Requisition, event, request, response, evaluation, award and commitment remain distinct evidence-bearing objects.
9. **Award is a decision, not a Purchase Order.** Authority is evaluated at Award/commitment execution and the decision basis is retained.
10. **Call-off has one identity.** Procurement and logistics reuse one `Call-off Order`; logistics fulfils it but never creates a parallel call-off master.
11. **Fulfilment evidence is immutable.** Goods/Service Receipt uses a shared receipt-event pattern with correction/reversal rather than destructive overwrite.

## Core semantic structures

### Agreement identity

```text
Contract
  ├─ Contract Party Role → Party
  ├─ Contract Clause
  ├─ Obligation
  ├─ Contract Key Date
  ├─ Contract Notice
  ├─ Commercial Change
  └─ Commercial Claim
```

`Appointment`, `Subcontract` and `Framework Agreement` are Contract types/classifications. Their specialist terminology, contract-form rules, call-off mechanisms and workflows remain configurable without introducing independent agreement masters.

### Delivery, commercial and procurement scope

```text
Project
  ↓
WBS Element
  ↓
Work Package

        ↕ explicit mapping

Commercial Package

        ↕ explicit mapping

Procurement Package
```

These structures answer different questions:

- WBS/Work Package: **what are we delivering?**
- Commercial Package: **how are we grouping/controlling delivery commercially?**
- Procurement Package: **what scope/requirements are we taking to market?**

They must never be merged into one universal package hierarchy.

## Contract-party semantics

`Contract Party Role` is an effective relationship between Contract and Party. It carries role, effectivity and relevant signatory/authority context.

A supplier/subcontractor/customer/consultant role does not create a separate Organisation master. Supplier Relationship uses the shared Party Relationship model.

## Clauses and obligations

`Contract Clause` is controlled contractual content within a Contract/version/amendment. `Obligation` is a structured duty derived from contractual basis.

An Obligation is not a workflow task. Workflow/work items may be created to fulfil, review or evidence an obligation, while the obligation itself remains durable contractual truth.

## Contract key dates and schedule milestones

A `Contract Key Date` is contractual truth. A `Schedule Milestone` is planning truth. They may be mapped but are not the same object.

```text
Contract Key Date  ← explicit mapping →  Schedule Milestone
```

Changing a planning milestone cannot silently change the contractual date.

## Commercial change

Canonical pattern:

```text
Commercial Change
  ├─ type: Change / Variation / Compensation Event / other configured type
  ├─ Contract basis
  ├─ Notice(s)
  ├─ Change Quotation(s)
  ├─ assessment / decision
  └─ resulting Contract amendment/effectivity
```

Contract-form-specific rules are configuration/policy over this identity pattern. This avoids separate change engines for NEC compensation events, variations and other contract mechanisms while preserving their different terminology and rule sets.

## Commercial claims

`Commercial Claim` is a governed assertion of entitlement and requested remedy. The entitlement basis is contextual to the claim/contract, not an independent enterprise master.

Claims retain notices, evidence, submissions, assessments, decisions and dispute escalation history.

## Procurement sourcing chain

```text
Requisition
  ↓
Procurement Package
  ↓
Sourcing Event
  ↓
Sourcing Request (RFQ / RFP)
  ↓
Sourcing Response (Bid / Tender Response)
  ↓
Sourcing Evaluation
  ↓
Award
  ↓
Purchase Order and/or Contract
  ↓
Call-off Order (where the governing commitment supports releases)
  ↓
Procurement Receipt / logistics fulfilment
```

Each transition is traceable. No single mutable procurement record represents the whole process.

## Requisition

Requisition is the authorised internal request to procure before an external commitment exists. Approval uses the shared authority model and does not itself create supplier commitment.

## Sourcing Event, Request and Response

`Sourcing Event` is the governed competition/negotiation context.

`RFQ` and `RFP` are typed `Sourcing Request` records. `Bid Response` and `Tender Response` are typed `Sourcing Response` records. Submitted/issued evidence is retained under controlled version semantics.

## Evaluation and Award

`Sourcing Evaluation` preserves criteria, scores, moderation, reviewer identity, conflicts and recommendation basis. A comparison table is a projection/output of evaluation, not a separate truth source.

`Award` is the authorised procurement decision. It does not equal a Contract, Subcontract or Purchase Order. Award authority is evaluated at execution time and the authority/evaluation snapshot is retained as evidence.

## Purchase Order

Purchase Order is an external commitment. `Purchase Order Line` is a child/value-bearing entity. `Order Amendment` is controlled commitment history.

An approved amendment never silently overwrites the historical committed terms.

## Call-off Order

`Call-off Order` is one governed release identity under a framework, Contract, Purchase Order or other blanket commitment. The BOF-09 procurement occurrence and BOF-10 logistics occurrence are the same business fact.

Commercial/procurement owns the commitment and authority semantics. Inventory/logistics consumes the Call-off Order as demand/fulfilment context for reservation, pick, shipment, delivery and receipt. A logistics workspace must never create its own second call-off master.

## Procurement Receipt

Goods Receipt and Service Receipt use one `Procurement Receipt` event pattern with type-specific acceptance/evidence. A receipt evidences fulfilment; it does not automatically approve a supplier invoice or create an accounting posting.

Corrections use explicit correction/reversal semantics.

## Cross-model relationships

The model relies on previously governed canonical objects:

- `Party` for agreement/supplier identities;
- `Project`, `WBS Element` and `Work Package` for delivery scope;
- `Delegated Authority` for award/commitment authority;
- `Item` for goods/services definitions;
- `Site` and built-environment objects for delivery/receipt location where needed;
- `Information Container` for controlled contractual/sourcing evidence.

## Physical implementation boundary

This logical model does **not** imply:

- one database table per semantic object;
- one universal Contract workflow;
- one hard-coded contract form;
- one-to-one mapping between Work Package and Procurement Package;
- that all external commitments must be Purchase Orders;
- that supplier invoice/accounting semantics are owned by procurement;
- that every commercial change follows identical workflow states.

Physical aggregates, persistence, APIs and workflow must implement these semantics without redefining them.
