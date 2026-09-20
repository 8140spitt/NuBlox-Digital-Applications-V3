# F22 Job Profile Reconciliation — Property, Facilities & Physical Assets

**Status:** employment-model reconciliation complete  
**Date:** 20 September 2026  
**Function:** F22 Property, Facilities & Physical Assets

## Result

All F22 source Job Profiles now have an explicit employment treatment.

### Leadership

- Head of Property, Facilities & Physical Assets

### Professional employment roles

- Asset Strategy Manager
- Capital Planning Manager
- Asset Acquisition Specialist
- Property Acquisition Manager
- Construction Project Manager
- Asset Information Manager
- Maintenance Planner
- Maintenance Coordinator
- Reliability Engineer
- Facilities Manager
- Space Planning Manager
- Lease Manager
- Utilities Manager
- Asset Disposal Specialist

These are not collapsed into one "Asset Manager" role. Several are independently employable disciplines with different Work Products, authority boundaries, competencies and operating rhythms.

Existing Wave evidence may compose their Functional Roles into broader jobs such as Asset Manager, General Practice Surveyor, Rural Surveyor or Planning and Development Surveyor, but that reuse does not remove the standalone employment role.

## Important role distinctions

### Maintenance Planner vs Maintenance Coordinator

These remain distinct:

```text
Maintenance Planner
  -> preventive strategy / plan / schedule / forward workload

Maintenance Coordinator
  -> reactive fault intake / diagnosis / repair coordination / closure
```

A tenant may combine them in one Position, but the reusable Job Profiles remain separate.

### Asset Acquisition vs Property Acquisition

These remain distinct:

- Asset Acquisition Specialist — equipment/physical-asset specification, procurement, receipt, commissioning and capitalisation.
- Property Acquisition Manager — search, assessment, negotiation and acquisition/lease of property interests.

### Asset Information Manager

Asset Information Manager remains a specialist Job Profile even when its Functional Role contributes to an Asset Manager or project-handover job.

## Canonical-model findings

The activity trace exposed several data-model concerns that must be fixed independently of employment reconciliation:

1. Asset Acquisition workflow is currently overloaded onto the spatial Asset aggregate.
2. Construction / Project Delivery is currently mapped to an Asset / Property Acquisition object rather than a proper project-delivery chain.
3. Lease Management is mapped to Lease Accounting, conflating contractual/property lease truth with accounting measurement.
4. Asset Disposal includes "remove asset record", which conflicts with immutable lifecycle/history requirements.

These are recorded in `job-profile-reconciliation-architecture-gap-register.csv`.

## Next F22 product-definition work

For each retained role:

- explicit Work Products;
- exact source activities;
- canonical aggregate ownership;
- lifecycle/version/effectivity semantics;
- accountabilities and decision authority;
- handoffs into finance, procurement, project delivery, operations and records;
- Position-level Job Workbench composition;
- executable role acceptance scenarios.
