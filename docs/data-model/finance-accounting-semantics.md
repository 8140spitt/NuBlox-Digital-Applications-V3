# Finance, Accounting, Treasury & Financial Control Semantics

Status: governed V3 semantic baseline

## Purpose

This model defines how NuBlox records financial effects without creating a second set of enterprise identities inside Finance.

The governing rule is:

> An accounting posting records the financial consequence of business truth; it does not replace the business object that caused it.

Finance therefore references the canonical `Legal Entity`, `Party`, `Project`, `WBS Element`, `Contract`, `Purchase Order`, `Item` and `Asset` identities already governed elsewhere in NuBlox.

## Accounting backbone

```text
Legal Entity
    ↓
Ledger
    ↓
Chart of Accounts
    ↓
Accounting Period
    ↓
Journal
    ↓
Ledger Entry
```

A Ledger is a governed accounting book for one Legal Entity/accounting basis. A Legal Entity may have more than one Ledger where parallel books are required, but those Ledgers never become duplicate enterprise/legal identities.

A posted Ledger Entry is immutable. Correction is performed by reversal or a new correcting/adjusting posting with full provenance. Historical entries are never destructively edited.

## Source truth and accounting effect

Commercial and operational objects remain authoritative for their own meaning:

```text
Contract / Purchase Order / Invoice / Payment
Project / WBS / Asset / Inventory / Service execution
                     ↓
              accounting basis
                     ↓
             Journal / Posting
                     ↓
              Ledger Entries
```

The posting retains the exact source reference, accounting period, account, dimensions, currency, actor and posting time.

Financial Dimensions can point to canonical Project, WBS, Contract, Asset, organisation and other governed identities. They must not create shadow project, contract, supplier, customer or asset masters.

## Accounts payable and receivable

NuBlox separates:

```text
Supplier Invoice / Customer Invoice
              ↓
        Open Item Position
              ↓
Payment / Receipt
              ↓
Settlement Allocation
              ↓
Bank Transaction evidence
              ↓
Reconciliation
```

`Supplier Invoice` is distinct from procurement receipt, commercial valuation, application for payment and payment.

`Customer Invoice` is distinct from Contract, valuation/certificate evidence, revenue recognition and receipt.

Credit and debit notes share one `Financial Adjustment Note` pattern with explicit adjustment direction/type. The original invoice remains historically intact.

`Open Item Position` is a projection from posted source documents and settlements. It is not an independently editable receivable/payable master.

## Banking and treasury

A `Bank Account` is a treasury account identity owned/controlled by a canonical Legal Entity. It is not a GL Account.

A `Payment`/`Receipt` is an internal settlement transaction. A `Bank Transaction` is external cash-movement evidence from a bank statement/feed. `Reconciliation` links these records and retains exceptions without altering source evidence.

Treasury adds:

- Cash Forecast;
- Liquidity Forecast;
- Treasury Facility;
- Treasury Deal;
- derived Cash Position.

Forecasts are versioned/as-of views and must never overwrite actual bank or ledger evidence.

## Tax

Finance reuses the canonical jurisdiction/reference `Tax Code`. Tax codes are not duplicated inside the finance domain.

A `Tax Transaction` records the tax consequence of a source transaction. A `Tax Return` is a governed statutory filing identity with retained submission/amendment evidence.

## Fixed-asset accounting

NuBlox explicitly separates:

```text
Physical Asset
      ↕ optional relationship
Fixed Asset Accounting Record
      ↓
Depreciation Schedule / Run
      ↓
Ledger Entry
```

The physical `Asset` carries whole-life technical, operational, maintenance and sustainability identity. The `Fixed Asset Accounting Record` carries capitalisation, depreciation and accounting carrying value.

Not every physical Asset must be individually capitalised, and not every accounting fixed asset needs to map one-to-one to a physical Asset. The relationship is explicit rather than assumed.

Depreciation, impairment/revaluation and disposal accounting change financial carrying value; they do not change physical Asset condition or operational lifecycle.

## Project and commercial financial control

Financial control compares positions over common canonical dimensions:

```text
Budget
Forecast
Commitment Position
Actual Financial Position
        ↓
Project / WBS / Contract / Cost Code / Cost Centre / period
        ↓
Variance and management reporting
```

A `Commitment Position` is derived from authoritative commercial commitments such as Contracts and Purchase Orders. Finance does not create a second commitment contract.

`Actual Financial Position` is derived from posted Ledger Entries. Budget and Forecast remain planning objects; they never become actual accounting truth.

## Recognition

Financial recognition events capture an attributable accounting treatment based on approved policy and business evidence. Revenue/cost recognition, accrual, prepayment, depreciation and revaluation must retain:

- source business basis;
- policy/rule version;
- calculation/as-of period;
- accounting dimensions;
- generated posting references;
- approval/authority evidence.

Recognition changes accounting position. It must not silently change Contract entitlement, Project progress, Asset condition or operational state.

## Intercompany, consolidation and close

Intercompany transactions reference the same canonical Legal Entities on both sides.

A Consolidation Run reads source Legal Entity Ledgers and applies controlled translation/elimination for group reporting. Eliminations do not rewrite source Ledgers.

The Financial Close Cycle coordinates period-end controls, reconciliations, adjustments and approvals. It is separate from `Accounting Period` state and from workflow-task identity.

## Controlled reporting

A `Controlled Reporting Snapshot` is immutable reporting evidence tied to a defined scope, source Ledgers/data versions, reporting basis and as-of time. It is a reproducible projection/evidence record, not a substitute Ledger.

## Non-negotiable boundaries

1. Finance references canonical Legal Entity, Party, Project, WBS, Contract, Purchase Order and Asset identities.
2. Posted Ledger Entries are immutable; corrections use reversal/new entries.
3. Source business objects remain authoritative for operational/commercial meaning.
4. Invoice is not valuation/application/certificate and is not Payment/Receipt.
5. Bank Transaction evidence is distinct from internal Payment/Receipt records.
6. Budget/Forecast are plans; Commitment/Actual/Cash positions are derived; posted Actuals are not rewritten.
7. Fixed Asset Accounting Record is not physical Asset identity.
8. Tax Code is shared reference/jurisdiction configuration.
9. Consolidation/elimination preserves source entity Ledgers.
10. Reporting snapshots are evidence/projections and never become source accounting truth.
