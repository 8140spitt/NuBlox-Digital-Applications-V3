# CRM, Business Development & Customer Semantics

## Purpose

This model governs BOF-03 and establishes how NuBlox represents market intelligence, commercial funnel progression, customer/account context and customer matters without creating duplicate Party or Organisation masters.

The governing pattern is:

```text
Party / Organisation
        ↓
Party Relationship
        ↓
Lead → Opportunity → Pursuit
        ↓
Bid / No-Bid Decision
        ↓
Estimate / Proposal / Contract / Project references
        ↓
Customer Onboarding / Interaction / Customer Case
```

The central rule is:

> Prospect, customer and account terminology describes commercial context around canonical Parties. It does not create parallel organisation masters.

## Party and account identity

NuBlox already has canonical `Party`, `Person`, `Organisation` and `Party Relationship` semantics.

Therefore:

```text
Account Relationship
Customer Relationship
Service Relationship
        ↓
Party Relationship + explicit type/context/effectivity
```

An Organisation can simultaneously be a prospect, customer, supplier, subcontractor, consultant or project participant through governed relationships. CRM never duplicates the Organisation to represent those roles.

`Account Plan` is a versioned plan for one Party Relationship/account context. The account plan does not establish identity.

## Commercial funnel

### Lead

A Lead is an early commercial signal or prospective demand. It can be captured before complete Party resolution.

Lead lifecycle may include:

```text
New → Qualifying → Qualified / Disqualified → Converted / Closed
```

When enough identity information exists, the Lead resolves to canonical Party/relationship records. Conversion preserves provenance and creates or links the appropriate Opportunity.

### Opportunity

An Opportunity is a qualified commercial possibility. It has its own stable identity and commercial context.

It is explicitly distinct from:

- Pursuit;
- Estimate;
- Proposal;
- Quotation;
- Contract;
- Project.

Winning an Opportunity does not mean renaming that Opportunity into a Contract or Project.

### Pursuit

A Pursuit is the active governed effort to win an Opportunity. It coordinates strategy, team, win themes, competitors, actions and downstream tender activity.

```text
Opportunity ≠ Pursuit
```

An Opportunity can exist before the enterprise commits resources to a Pursuit.

### Bid / No-Bid Decision

The Bid/No-Bid Decision is immutable attributable evidence bound to the exact Opportunity/Pursuit context.

It records:

- decision outcome;
- decision actor/body;
- decision criteria;
- conditions;
- authority basis;
- timestamp;
- subject version/context.

A protected decision requires applicable permission, delegated/statutory authority and segregation-of-duties checks. The decision evidence does not itself bypass downstream domain rules.

## CRM work versus other work

`CRM Activity` represents business-development/customer work such as follow-up, pursuit action or account-plan action.

It is explicitly distinct from:

```text
CRM Activity
    ≠ Project Schedule Activity
    ≠ Work Order
    ≠ Service Appointment
    ≠ shared workflow Work Item
```

The underlying domain object remains authoritative. Assignment of a CRM Activity does not automatically grant approval or commercial authority.

## Market intelligence and segmentation

`Market Insight` is attributable evidence/analysis with source and as-of context. It is not a market master.

`Market Segment` is governed classification/segmentation configuration. It can classify Party Relationships, Opportunities or market contexts while preserving underlying identity.

Segment criteria and meaning are effective-dated/versioned where required so historical reporting remains interpretable.

## Interactions

`Customer Interaction` is append-only attributable evidence of meetings, calls, messages, visits or similar interactions.

It records participants, channel, occurred-at time, subject links and evidence. Correction creates attributable history instead of destructively rewriting prior interaction evidence.

## Pipeline and forecasting

`Pipeline Snapshot` and `Sales Forecast Snapshot` are projections.

```text
Lead / Opportunity / Pursuit truth
        ↓
calculation / selection rules
        ↓
Pipeline / Forecast position
```

Live positions remain derived. A snapshot may be frozen for reporting, governance or forecast accountability, in which case it retains the exact source population, rule/scenario version and as-of time.

A snapshot is never an independently edited substitute for Opportunity truth.

## Customer onboarding

`Customer Onboarding Case` coordinates checks and evidence required to establish or activate a customer relationship in a defined Legal Entity/context.

Typical concerns can include commercial approval, legal/compliance checks, tax/payment terms, contacts and operational setup.

Completion of onboarding may permit an explicit Party Relationship transition. The onboarding case itself does not create a duplicate customer master.

## Customer cases and complaints

`Customer Case` is the shared governed case pattern for customer matters requiring investigation, response or resolution.

`Complaint` is a typed Customer Case rather than a parallel case architecture.

The case may reference Contract, Service, Asset, Invoice or other canonical domain objects, but closing the case never rewrites those objects directly without their own valid domain command.

## Downstream conversion

The commercial chain is provenance-driven:

```text
Lead
 → Opportunity
 → Pursuit
 → Bid decision
 → Estimate / Tender / Proposal
 → Contract
 → Project where applicable
```

Each material downstream concept has its own identity. NuBlox links them rather than changing one mutable record's meaning as it moves through the lifecycle.

## Canonicalization decisions

All 17 BOF-03 candidates are covered by the governed baseline.

Key normalisations are:

- `Account Relationship` → shared `Party Relationship`;
- `Customer Relationship` → shared `Party Relationship`;
- `Service Relationship` → shared `Party Relationship`;
- `Activity` → `CRM Activity`;
- `Interaction` → immutable `Customer Interaction` evidence;
- `Bid/No-Bid Decision` → immutable decision evidence;
- `Pipeline Snapshot` → projection;
- `Forecast Snapshot` → `Sales Forecast Snapshot` projection;
- `Customer Onboarding` → `Customer Onboarding Case`;
- `Complaint` → typed `Customer Case`.

## Non-negotiable rules

1. Prospect/customer/account terminology never duplicates Party or Organisation identity.
2. Account, customer and service relationships reuse Party Relationship with explicit type and scope.
3. Lead, Opportunity and Pursuit remain separate identities.
4. Opportunity is not Contract, Project, Estimate or Proposal identity.
5. CRM Activity is not Project Schedule Activity, Work Order or shared workflow Work Item.
6. Bid/No-Bid Decision is immutable attributable evidence and protected decisions require authority validation.
7. Pipeline and forecast positions are projections, not mutable source truth.
8. Customer Onboarding is a case/process around relationship activation, not a customer master.
9. Complaint is a typed Customer Case.
10. Interaction evidence is attributable and historically preserved.
11. Downstream commercial/project identities are linked through provenance, never identity mutation.
12. Privacy, retention, tenant/legal-entity scope and access policy apply to customer/contact information and interaction evidence.
