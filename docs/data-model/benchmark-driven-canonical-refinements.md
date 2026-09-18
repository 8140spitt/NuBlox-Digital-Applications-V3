# Benchmark-Driven Canonical Refinements

**Status:** governed V3 semantic extension  
**Date:** 18 September 2026  
**Origin:** Gate 3 external benchmark programme

The original 750-object discovery register remains the historical discovery baseline. External benchmarking is allowed to expose materially missing business semantics after that baseline is closed.

Those additions are governed separately so NuBlox can distinguish:

- discovery-origin canonicalisation decisions;
- benchmark-driven canonical refinements;
- vendor-specific patterns that were reviewed but rejected or left contextual.

The machine-readable authority is:

app/src/lib/data/benchmark-refinement-model.ts

## BG-001 — Integrated demand and supply planning

SAP's current integrated-planning challenge exposed a real missing planning layer between strategic/financial planning and procurement/production execution.

~~~text
Scenario / Assumptions
       ↓
Demand Plan
       ↓
Supply Plan
       ↓
Planning Exception / Decision
       ↓
Procurement / Production / Inventory / Service execution
~~~

### Demand Plan

Demand Plan is a versioned statement of expected demand by governed subject, horizon, location/context and scenario.

It is not a Sales Order, Requisition, Inventory Reservation, Production Order or actual consumption.

### Supply Plan

Supply Plan is the governed planned response to demand using inventory, procurement, production, capacity or service supply.

It is not an execution commitment or transaction. Approved Demand/Supply Plan versions remain immutable comparison points. Replanning creates successor versions.

### Planning Exception

Planning Exception is evidence that a demand/supply/capacity constraint or infeasibility requires review. It never becomes an operational Incident or workflow task.

## BG-002 — Treasury risk semantics

NuBlox already governed Bank Account, Cash Forecast, Liquidity Forecast, Treasury Facility, Treasury Deal and Cash Position.

The benchmark has now added the missing risk layer:

~~~text
source financial positions
       ↓
Financial Exposure
       ↓
Hedge Relationship ↔ Treasury Deal / instrument
       ↓
effectiveness / valuation
       ↑
Market Data Snapshot

Bank Accounts
       ↓
Cash Pool Arrangement
~~~

Financial Exposure is a derived/as-of financial-risk position. It never replaces source Ledgers, invoices, Contracts, forecasts or bank evidence.

Hedge Relationship records the governed designation between exposure and hedge instrument/deal. Accounting consequences remain separate.

Market Data Snapshot pins the exact immutable observations used by valuation/risk decisions.

Cash Pool Arrangement is an effective relationship across existing Bank Accounts and Legal Entities; it does not create alternative bank or company identities.

## BG-003 — Master-data stewardship and merge provenance

Canonical identity without governance of change and duplicate resolution is insufficient.

NuBlox now governs:

~~~text
Duplicate Match Candidate
       ↓
Master Data Stewardship Case
       ↓
Master Merge Decision
       ↓
Master Identity Redirect
~~~

A Stewardship Case coordinates create/change/correct/merge/split/retire actions around existing canonical masters. It is not another master-data database.

A Duplicate Match Candidate is evidence only. Confidence from a rule/model cannot itself merge records.

A Master Merge Decision requires immutable decision/authority evidence identifying the survivor and source records.

Master Identity Redirect keeps historic/source identities resolvable to the survivor with retained provenance. Correction/unmerge uses governed successor/reversal evidence rather than destructive edit.

## Architecture rule

A benchmark finding may extend the canonical model only when it represents a durable business concept that survives outside the vendor that exposed it.

This mechanism is deliberately separate from the 750-object discovery baseline so the programme never rewrites history or pretends the original discovery was exhaustive.
