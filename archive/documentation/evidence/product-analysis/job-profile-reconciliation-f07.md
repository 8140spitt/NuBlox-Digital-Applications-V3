# F07 Job Profile Reconciliation — Sales & Commercial Management

**Status:** employment-model reconciliation complete  
**Date:** 20 September 2026  
**Function:** F07 Sales & Commercial Management

## Result

All F07 source Job Profiles now have an explicit employment treatment.

Leadership:
- Head of Sales & Commercial

Professional roles:
- Sales Strategy Specialist
- Account Manager
- Business Development Manager
- Pipeline Manager
- Pricing Specialist
- Quotation Specialist
- Bid & Proposal Manager
- Contract Negotiation Specialist
- Sales Order Manager
- Channel / Partner Sales Specialist
- Sales Compensation Specialist
- Sales Forecasting Specialist
- Sales Performance Specialist

These are retained as reusable Job Profiles. A tenant may combine sales-operations specialisms such as pipeline, forecasting and performance into one Position, but NuBlox should not erase the reusable role distinctions.

## Key architecture findings

- Opportunity, pipeline and forecast are currently conflated.
- Sales strategy, account plans, partner plans and performance share an overly broad Account Plan aggregate.
- Sales compensation requires explicit plan/version/calculation/exception/payment authority semantics.

See `job-profile-reconciliation-architecture-gap-register.csv`.

## Next work

Each role now needs explicit Work Products, exact activity mapping, commercial authority, pricing/discount/contract handoffs, lifecycle/version rules and Position-level Job Workbench composition.
