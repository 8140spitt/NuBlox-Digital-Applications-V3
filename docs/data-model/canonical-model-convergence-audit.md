# Canonical Model Convergence & Coverage Audit

## Purpose

This audit is the architecture gate between NuBlox V3 business-object discovery and physical aggregate/database/API design.

It answers four questions:

1. How much of the 750-candidate discovery universe has an explicit version-controlled canonicalization decision?
2. Which of the 29 discovery families have a governed semantic model, which are partial, and which remain candidate-only?
3. Does the model explicitly cover the five independent completeness lenses required by the discovery programme?
4. What remains open before NuBlox can claim that the enterprise canonical object model is complete?

The machine-checkable source is:

`app/src/lib/data/canonical-coverage-audit.ts`

The interactive architecture view is:

`/[tenant]/app/admin/business-objects/coverage-audit`

## Five governing coverage lenses

The audit follows the canonical discovery programme exactly.

### 1. Sector lifecycle

```text
Market → Lead → Opportunity → Bid → Estimate → Proposal → Quote → Contract
→ Design → Plan → Procure → Produce → Construct → Control → Invoice → Account
→ Handover → Operate → Maintain → Refurbish → Dispose
```

Every stage must be represented by one or more business-object families. This proves lifecycle breadth; it does not prove that every candidate object at that stage is canonical.

### 2. 29 tenant workspaces

Every F01–F29 tenant workspace must have an explicit relationship to the object families it creates, reads, changes or governs.

The current audit is family-to-workspace coverage. The later activity-level convergence pass must map every L2/L3 activity to canonical objects and allowed actions.

### 3. Construction & Built Environment specialist overlays

The audit explicitly covers:

- development;
- design;
- engineering;
- commercial management;
- contracting;
- trades;
- manufacturing;
- infrastructure;
- property/FM;
- retrofit;
- regulation;
- heritage.

These are orthogonal sector overlays. They do not replace the 29 workspace model or create separate master-data silos.

### 4. End-to-end process chains

The model is challenged against all required process chains:

- market-to-contract;
- estimate-to-project-control;
- design-to-approved-information;
- procure-to-pay;
- plan-to-perform;
- change-to-commercial-position;
- valuation-to-cash;
- supplier-progress-to-payment;
- incident/defect/NCR-to-resolution;
- commissioning-to-operation;
- service-request-to-resolution;
- asset-to-retirement;
- hire-to-retire;
- record-to-report.

A chain may cross several workspaces and object families. No workspace owns a duplicate copy of truth simply because it participates in a chain.

### 5. External benchmark/reference models

The external benchmark is now a governed **multi-vendor market programme**, not a Windchill-only study.

The machine-checkable register is:

`app/src/lib/data/external-benchmark-register.ts`

The governing programme is:

`docs/benchmarks/market-benchmark-programme.md`

The current baseline registers **23 relevant products/suites** spanning all **29 tenant workspaces**, including SAP, Oracle, Microsoft, IFS, Workday, ServiceNow, Procore, Autodesk, Bentley, Trimble, IBM Maximo, PTC Windchill, Siemens Teamcenter, Deltek, Asite, Thinkproject/CEMAR, Hexagon EcoSys, Planon, Sage, Causeway, Salesforce and Diligent.

The prior **64-line SAP capability coverage register** is preserved under `docs/benchmarks/sap-capability-coverage-register.csv` as outside-in enterprise-completeness evidence. Its old NuBlox-domain/slice fields are provenance only. The remap is now **64/64 complete** in `docs/benchmarks/sap-v3-capability-map.csv`; detailed capability challenge/closure remains outstanding.

External benchmark coverage is deliberately not treated as complete merely because products are registered or several useful architectural findings have already been adopted. Benchmark systems challenge completeness, semantics, controls and end-to-end user outcomes; vendor module boundaries never become automatic NuBlox architecture.

## Family maturity states

The audit uses three explicit family-level states.

### Governed semantic model

A family has a governed semantic architecture covering its principal identity, relationship, lifecycle/versioning and evidence boundaries. This does **not** mean every candidate occurrence in that family has already received an individual canonicalization decision.

Current governed families:

- BOF-01 Tenant, identity, party and enterprise structure;
- BOF-02 Strategy, governance and enterprise performance;
- BOF-03 Market, CRM, business development and customer;
- BOF-04 Land, development, investment and property acquisition;
- BOF-05 Estimating, measurement, tendering, proposals and sales;
- BOF-06 Portfolio, programme, project and project controls;
- BOF-07 Design, engineering, BIM and information management;
- BOF-08 Contract, appointment and commercial management;
- BOF-09 Procurement, supplier and subcontract sourcing;
- BOF-10 Product, material, catalogue, inventory and logistics;
- BOF-11 Manufacturing, fabrication and off-site production;
- BOF-12 Site, field and construction operations;
- BOF-13 Quality, health, safety, environment and assurance;
- BOF-14 Building safety, regulatory control and statutory assurance;
- BOF-15 Commissioning, completion, handover and closeout;
- BOF-16 Property, estate, space, infrastructure and physical asset;
- BOF-17 Maintenance, facilities, service, warranty and aftercare;
- BOF-18 People, HCM, competence, time, payroll and expenses;
- BOF-19 Finance, accounting, tax, treasury and enterprise performance;
- BOF-20 Sustainability, carbon, energy, circularity and social value;
- BOF-21 Enterprise risk, compliance, internal control and audit;
- BOF-22 Legal, corporate secretariat, privacy and records obligations;
- BOF-23 Business continuity, crisis and physical security;
- BOF-24 IT, data, cyber, analytics and AI;
- BOF-25 Knowledge, document/records management, communications and stakeholder engagement;
- BOF-26 Organisation change, transformation and continuous improvement;
- BOF-27 Shared work, workflow, decision and collaboration;
- BOF-28 Evidence, audit, retention and legal traceability;
- BOF-29 Reference data, classification, jurisdiction and configuration.

### Partial semantic model

There are currently **no partial families**.

### Candidate-only

There are currently **no candidate-only families**.

Every one of the 29 discovery families now has a governed family-level semantic architecture.

Therefore the present family-level maturity split is:

```text
29 governed families
 0 partial families
 0 candidate-only families
29 total families
```

This closes the family-level semantic-convergence backlog. All **750/750 candidate occurrences now also have an explicit version-controlled canonicalization decision**. Physical aggregates/APIs are still not approved until duplicate/alias convergence, benchmark/standards challenge and aggregate-boundary freeze are complete.

## Candidate decision coverage

Candidate decision coverage is computed directly from:

- `app/src/lib/generated/business-object-register.json` — the 750 candidate occurrences; and
- every version-controlled canonicalization baseline under `app/src/lib/data/*-canonicalization.ts`.

The audit deduplicates candidate keys and calculates, per family:

- candidate count;
- decided candidate count;
- undecided candidate count;
- decision coverage percentage.

This means the percentage cannot be raised by editing presentation copy. A baseline decision must exist against a real candidate key in the generated register.

Current candidate-level result:

```text
750 candidate occurrences
750 governed baseline decisions
  0 undecided candidates
100% decision coverage
```

The validation function and automated test now treat 750/750 decision coverage as an architecture invariant. A future candidate added to the register without a corresponding governed decision will fail the convergence audit.

## Duplicate and alias convergence

Cross-family duplicate/alias convergence is now machine-checkable through:

`app/src/lib/data/canonical-alias-convergence-audit.ts`

The audit closes all **26/26 exact duplicate-name groups** from the generated discovery register and the documented near-alias challenge set. It deliberately distinguishes:

- **shared canonical identity** — multiple candidates resolve to one canonical root, such as Site, Zone, Risk Assessment, Procurement Package, Unit of Measure and Call-off Order;
- **explicitly distinct semantics** — the same word is retained only after canonical renaming/semantic separation, such as CRM Activity vs Schedule Activity, Property Valuation vs Commercial Valuation, and Statutory vs Delivery Completion Certificate;
- **governed family patterns** — related concepts reuse common foundations/evidence rules without being collapsed into one master, such as inspections, changes, certificates and domain evidence.

The former duplicate-name queue is therefore a discovery artefact, not an unresolved architecture backlog. Any future exact duplicate group or documented alias challenge that lacks a governed resolution must fail the Gate 2 audit.

## Architecture gate

Physical aggregate/database/API design must not use a family as enterprise-wide authority merely because:

- a route already exists;
- a screen looks complete;
- one workflow has been implemented;
- an external benchmark uses a similar object;
- a candidate name sounds like a database table.

Before a family can be treated as physically authoritative, it must have:

1. governed identity and role/relationship boundaries;
2. lifecycle and version/history semantics where required;
3. workspace usage and write-authority rules;
4. lifecycle/process-chain coverage;
5. evidence/audit/retention implications;
6. financial/commercial/information effects where applicable;
7. reference/classification/jurisdiction overlays;
8. remaining aliases/duplicates resolved;
9. material candidate decisions completed;
10. benchmark/standards challenge completed to the level relevant to that family.

## Immediate convergence queue

The **family-level convergence queue is closed**.

Candidate-level convergence is now also closed at **750/750 decisions**.

The next architecture gates are:

```text
1. Complete the external benchmark / standards challenge
2. Freeze the canonical aggregate boundaries
3. Complete the L2/L3 activity → canonical object/action mapping
4. Only then approve physical schema / API implementation waves
```

The audit must continue to expose benchmark status and must fail if candidate decision coverage ever drops below 100%.
