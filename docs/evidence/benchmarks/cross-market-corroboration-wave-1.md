# Cross-Market Corroboration — SAP Wave 1 Findings

**Status:** governed  
**Date:** 18 September 2026

This record explains why the initially SAP-exposed specialist gaps for advanced logistics, asset reliability and succession/talent were promoted into NuBlox core semantic refinements rather than treated as SAP-specific implementation patterns.

## BG-004 — Advanced warehouse and freight execution

**SAP source:** SAP Extended Warehouse Management / Transportation Management  
**Independent corroboration:**

- Microsoft Dynamics 365 Supply Chain Management — warehouse management supports wave templates, work templates and location directives; transportation management supports loads, rates, routing and inbound/outbound transport.
  - https://learn.microsoft.com/en-us/dynamics365/supply-chain/warehousing/warehouse-management-overview
  - https://learn.microsoft.com/en-us/dynamics365/supply-chain/transportation/transportation-management-overview
- Oracle Warehouse Management — advanced wave management, warehouse execution and labour/inventory operations.
  - https://www.oracle.com/scm/logistics/warehouse-management/

**Decision:** cross-market requirement confirmed.

NuBlox therefore added Handling Unit, Warehouse Wave, Yard/Dock Appointment, Freight Tender and Freight Settlement semantics while retaining Item, Inventory Movement, Shipment, Transport Order, Contract and Finance as authoritative identities.

## BG-005 — Asset reliability, criticality and failure-mode engineering

**SAP source:** SAP Enterprise Asset Management / Asset Performance Management  
**Independent corroboration:**

- IBM Maximo Application Suite / Asset Performance Management — reliability-centred maintenance, failure modes, criticality and predictive/condition-based maintenance.
  - https://www.ibm.com/products/maximo/asset-performance-management
- IFS Cloud / Asset Performance Management — FMECA, criticality, reliability-centred maintenance and predictive maintenance.
  - https://www.ifs.com/solutions/enterprise-asset-management/asset-performance-management

**Decision:** cross-market requirement confirmed.

NuBlox therefore added Asset Criticality Assessment, Failure Mode Definition, Reliability Strategy and Asset Health Position around the existing Asset/Condition/Maintenance/Failure model. No second asset register was introduced.

## BG-006 — Talent, succession and workforce intelligence

**SAP source:** SAP SuccessFactors  
**Independent corroboration:**

- Workday Talent Optimisation — succession planning, talent pipelines and internal mobility.
  - https://www.workday.com/en-us/products/talent-management/talent-optimization.html
- Workday Talent Planning — skills-based workforce modelling and succession planning.
  - https://www.workday.com/en-us/products/adaptive-planning/workforce-planning.html

**Decision:** cross-market requirement confirmed.

NuBlox therefore added Succession Plan, Talent Pool, Talent Pool Membership and Talent Review while preserving canonical Person, Worker Relationship, Position, Career Profile, Skill, Competency and Performance Review identities.

## Governance rule

A specialist capability first exposed by one benchmark provider is not automatically promoted into the NuBlox core.

Promotion requires either:

1. independent corroboration from another credible market-leading platform or applicable standard; or
2. direct proof that the capability is intrinsically required by NuBlox's Construction & Built Environment operating model.

This rule prevents vendor architecture from becoming NuBlox architecture by accumulation.
