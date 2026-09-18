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


## BG-004 — Advanced warehouse and freight execution

Independent Oracle/Microsoft corroboration confirmed that sophisticated logistics requires more than Warehouse, Bin, Inventory Movement, Shipment and Transport Order.

NuBlox now governs:

- Handling Unit;
- Warehouse Wave;
- Yard/Dock Appointment;
- Freight Tender;
- Freight Settlement.

These records coordinate execution without replacing Item, inventory, shipment, commercial commitment or finance truth.

## BG-005 — Reliability engineering

IBM Maximo and IFS independently corroborated the SAP-exposed reliability gap.

NuBlox now governs:

- Asset Criticality Assessment;
- Failure Mode Definition;
- Reliability Strategy;
- Asset Health Position.

Criticality and health are evidence/projections, not editable master flags. Reliability strategy guides maintenance planning without becoming the Maintenance Plan or Work Order.

## BG-006 — Succession and talent planning

Workday independently corroborated the need for governed succession/talent semantics.

NuBlox now governs:

- Succession Plan;
- Talent Pool;
- Talent Pool Membership;
- Talent Review.

These reuse Person, Worker Relationship, Position, Career Profile, Skill, Competency and Performance Review. Talent classification never creates another person/workforce master.

## BG-012 — Configurable product and service semantics

NuBlox now governs:

- Product Configuration Model;
- Configuration Characteristic;
- Configuration Rule;
- Product Configuration.

A Product Configuration pins the exact model/rule versions used by a quotation, Sales Order, Production Order or other governed context. Item, Item Variant, BOM, price and execution records remain separate authoritative identities.

## BG-013 — Business travel lifecycle

NuBlox now governs:

- Travel Request;
- Business Trip;
- Travel Booking Evidence.

This closes the semantic chain from travel approval and duty-of-care risk into actual trip context and Expense Claim. Specialist booking providers may remain integration sources.

## BG-014 — Migration and test-data governance

NuBlox now governs:

- Data Migration Project;
- Migration Mapping;
- Data Migration Run;
- Test Data Provisioning Profile;
- Test Data Provisioning Run.

Migration mappings never redefine canonical business semantics to match a legacy system. Non-production data provisioning must retain source/target lineage and governed privacy/masking/anonymisation evidence.

## BG-015 — Product requirements and systems engineering

NuBlox now distinguishes product/technical requirements from information-delivery requirements.

It governs:

- Product Requirement;
- Requirement Set/baseline;
- Engineering System Model;
- Engineering Model Element.

Requirement/model traceability may realise into Item, Component, physical System or Asset, but none of those identities are silently substituted for the engineering model.

## BG-016 — Lease-accounting consequences

Property/lease truth and finance consequences are explicitly separated.

NuBlox now governs:

- Lease Accounting Record;
- Lease Valuation;
- Lease Accounting Schedule.

These reference the canonical Lease/Contract/Property context and create financial consequences without turning right-of-use/liability accounting records into physical assets or rewriting contractual terms.

## Contextual SAP findings retained outside universal core

The SAP challenge also exposed legitimate capabilities that are not universal enough to become NuBlox core semantics:

- BG-007 — subscription/usage-based billing;
- BG-008 — public-sector funds and budget availability control;
- BG-009 — global-trade screening/authorisation depth;
- BG-010 — sales incentive/commission management;
- BG-011 — retail/POS/omnichannel promotion mechanics.

They are governed as contextual extensions in the benchmark gap register. If activated for an applicable business model, they must reuse the canonical identities and controls named in that register rather than create parallel enterprise masters.


## BG-017 — CPM schedule analysis

NuBlox now governs Schedule Calendar, Schedule Calculation Run and Schedule Analysis Snapshot.

Float, early/late dates and critical/longest-path membership are reproducible planning projections pinned to exact Schedule/Activity/Dependency/calendar versions. They are never hidden mutable flags on Schedule Activity.

## BG-019 — quantitative project risk

NuBlox now governs Project Risk Simulation Run and Project Risk Analysis Snapshot.

Probabilistic cost/schedule outcomes retain exact risk, uncertainty, schedule, cost/forecast, scenario and analysis-method inputs. Simulation output never replaces Enterprise Risk, Risk Assessment, Schedule or Forecast truth.

## BG-020 — construction project performance

NuBlox now governs:

- Progress Measurement Method;
- Project Performance Calculation Run;
- Project Controls Performance Snapshot.

This provides a canonical analytical layer for earned value, productivity, PV/EV/AC, CPI/SPI, ETC/EAC, commitments/exposure, forecast cost/value, margin and CVR-style positions.

All metrics remain projections over authoritative Progress Record, Budget, Forecast, Contract/Valuation, commitment and Ledger evidence.

## BG-021 — contract value schedule

NuBlox now governs Contract Value Schedule and Contract Value Line.

These structures represent the agreed commercial/payment breakdown used by Schedule of Values, Activity Schedule, Bill of Quantities and equivalent contract mechanisms. They may map to WBS, Work Package, Cost Code and estimate structures, but they never become those identities.

## BG-022 — target-cost and share mechanisms

NuBlox now governs:

- Target Cost Baseline;
- Commercial Share Mechanism;
- Commercial Share Assessment.

The model supports NEC-style pain/gain and other target/incentive sharing without embedding the calculation as opaque clause text. Approved target versions, formula versions and assessment evidence are retained.

## Construction benchmark governance consequence

Construction vendor products validated several NuBlox decisions rather than forcing new objects:

- Daily Site Diary remains an evidence envelope, not a replacement for Progress/Labour/Plant/Delivery/QHSE truth;
- CDE/document repositories remain representations/views over controlled Information Container identity;
- RFI, Submittal, Review, Coordination Issue and Design Change remain separate records;
- Contract Notice, Commercial Change, Claim, Valuation/Certificate and Diary remain distinct from workflow orchestration;
- Job Cost or cost-sheet structures do not replace WBS, Cost Code, Contract, Commitment or Ledger identity.

## Architecture rule

A benchmark finding may extend the canonical model only when it represents a durable business concept that survives outside the vendor that exposed it.

This mechanism is deliberately separate from the 750-object discovery baseline so the programme never rewrites history or pretends the original discovery was exhaustive.
