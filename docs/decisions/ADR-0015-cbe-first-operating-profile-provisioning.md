# ADR-0015 — CBE-first operating-profile provisioning

**Status:** Accepted  
**Date:** 26 September 2026

## Context

NuBlox already has the universal F01–F29 Core Business Function taxonomy, the D01–D16 Construction & Built Environment (CBE) Function taxonomy, metadata-driven Tenant configuration templates, Industry Solutions and governed provisioning evidence.

The first production validation path is a small CBE professional consultancy. That makes a focused consultancy operating profile more valuable than continuing to expose every canonical Function as if every Tenant needs every Function on day one.

The canonical taxonomy remains correct. The sequencing and Tenant relevance model needed to become explicit.

## Decision

NuBlox will implement a **CBE-first operating-profile resolver** alongside the existing generic Tenant provisioning service.

It uses four intake dimensions:

1. primary CBE business archetype;
2. whether the organisation directly employs operatives/trades doing physical work;
3. contractual position;
4. existing NuBlox size tier/headcount.

The CBE v1 archetypes are:

- `CON` — consultancy/advisory;
- `MC` — main contractor;
- `SUB` — specialist contractor/subcontractor;
- `SUP` — supplier/distributor/hire;
- `CLI` — client/developer/asset owner.

Contractual position is authoritative when it conflicts with the descriptive archetype:

- `ADVISORY` -> `CON`;
- `PRIME` -> `MC`;
- `PACKAGE` -> `SUB`;
- `EMPLOYER` -> `CLI`.

The existing NuBlox size tiers map to the quick configuration bands:

- `MICRO` -> `T1`;
- `SMALL` -> `T2`;
- `MEDIUM` -> `T3`;
- `LARGE` and `ENTERPRISE` -> `T4`.

The versioned provisioning code is deterministic, for example:

`CBE.V1.CON.ADVISORY.NOOPS.T2`

## Canonical taxonomy is retained

This decision does **not** renumber or replace any Function.

- F01–F29 remain the canonical Core Business Functions.
- D01–D16 remain the canonical CBE Functions already defined in NuBlox.
- Platform administration, identity, access control, workflow, evidence and audit remain shared platform capabilities rather than invented business Functions.
- Payroll, recruitment, learning, time/attendance and performance remain HCM sub-functions/capabilities where the canonical taxonomy already places them.

The resolver stores Tenant relevance as configuration state:

- `DEFAULT_ENABLED`;
- `AVAILABLE_DISABLED`;
- `HIDDEN_NOT_APPLICABLE`.

A state does not delete a canonical Function from NuBlox.

## CBE lookup policy

CBE v1 is deliberately data-driven but not prematurely sector-generic.

The resolver uses:

1. a CBE base Function rule set;
2. cumulative size capability adders;
3. a CBE archetype-to-canonical-Function rule matrix.

Direct employment of operatives is an additional physical-delivery modifier.

This is the first real Industry Solution instance. A generic multi-sector intake engine will not be introduced until a second materially different Industry Solution provides evidence for the abstraction.

## Consultancy reference profile

A `SMALL` CBE consultancy with an `ADVISORY` appointment and no directly employed operatives resolves to 13 Functions enabled by default:

- F07 Sales & Commercial Management
- F09 Procurement & Supplier Management
- F14 Finance, Accounting, Treasury & Tax
- F15 Human Resources / Human Capital
- F19 Legal & Corporate Secretariat
- F23 Health, Safety, Environment & Sustainability
- F25 Communications, Public Affairs & Investor Relations
- F26 Knowledge, Document & Records Management
- F27 Portfolio, Programme & Project Management
- D01 Architecture & Design
- D03 Surveying, Property & Land
- D04 Commercial, Contracts & Cost
- D15 Regulation, Inspection & Compliance

T2 additionally recommends the existing HCM sub-functions for Time & Attendance, Payroll and Performance Management.

The remaining Functions remain available or hidden/not-applicable according to the profile rather than being removed from the platform.

## First workflow validation

The reference consultancy implementation sequence must prove the platform against actual professional-service work:

`client request -> appointment -> survey/assessment -> draft deliverable -> internal review -> issue -> acceptance/decision -> invoice`

Priority deliverable objects include survey reports, specifications, cost plans and compliance/Principal Designer documentation.

## Consequences

1. Tenant onboarding can produce a concise, auditable operating recommendation instead of an undifferentiated 45-Function surface.
2. The recommendation is versioned and reproducible.
3. Tenant overrides can be governed independently of the canonical Function catalogue.
4. Function enablement is a configuration concern, not a pricing-module boundary.
5. The CBE consultancy path becomes the first concrete proof of the kernel, Work-Delivery Runtime and deliverable lifecycle.
6. Further sector abstraction is deferred until a second Industry Solution exists.
