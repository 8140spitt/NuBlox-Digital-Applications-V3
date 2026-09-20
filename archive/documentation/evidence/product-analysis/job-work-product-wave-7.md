# J1 Work-Product Wave 7 — Production, Service, Quality & Finance

**Status:** candidate explicit Work-Product decomposition  
**Date:** 20 September 2026  
**Functions:** F11-F14  
**Jobs:** 57  
**Work Products:** 244

Wave 7 covers:

- F11 Manufacturing / Production Operations;
- F12 Service Delivery & Field Operations;
- F13 Quality Management;
- F14 Finance, Accounting, Treasury & Tax.

It uses the exact-activity traceability standard introduced in Waves 5-6.

## Critical modelling decisions

### Manufacturing

Production Plan, Work Order release, execution, WIP, process controls, packaging, capacity and lean improvement are treated as related but distinct operational outputs.

Production reporting does not become the production transaction itself.

### Service / Field

Service Plan, Appointment, Dispatch, Work Order, field inspection/test, customer acceptance and billing handoff are distinct.

This is the foundation for a proper mobile/field execution experience.

### Quality

Quality Strategy, Quality Plan, Inspection/Test, NCR, CAPA, Supplier Quality, controlled quality information and certificates remain separate governed outputs.

The composed Continuous Improvement Specialist carries both **F13.09 and F29.08** source-activity provenance.

### Finance

The wave explicitly separates:

```text
Budget != Forecast
Journal != Reconciliation != Close
Ledger != Financial Statement
Invoice != Payment
Credit Decision != Collection Action
Cash Position != Payment Run != FX Hedge != Debt Facility
Tax Calculation != Tax Filing
Control Definition != Control Execution != Certification
Capital Investment Request != Investment Approval
```

Job Profile accountability never grants journal posting, payment, credit, write-off, tax filing, hedge execution, financing or investment authority.

## Coverage impact

```text
Before Wave 7: 205 / 462 jobs had Work-Product treatment
Wave 7:        +57 jobs / 244 Work Products
After Wave 7: 262 / 462 jobs have Work-Product treatment
Remaining:    200 jobs
```

All Wave 7 rows remain candidate-explicit pending canonical ownership, lifecycle/effectivity, authority/SoD and Job Workbench acceptance validation.
