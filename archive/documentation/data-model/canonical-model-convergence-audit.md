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

The family-to-workspace lens is now supplemented by the governed activity-level map: all 353 L2 sub-functions and all 1,510 source activities have a primary workspace, frozen aggregate, canonical object focus and allowed action classification.

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

`docs/evidence/benchmarks/market-benchmark-programme.md`

The current baseline registers **23 relevant products/suites** spanning all **29 tenant workspaces**, including SAP, Oracle, Microsoft, IFS, Workday, ServiceNow, Procore, Autodesk, Bentley, Trimble, IBM Maximo, PTC Windchill, Siemens Teamcenter, Deltek, Asite, Thinkproject/CEMAR, Hexagon EcoSys, Planon, Sage, Causeway, Salesforce and Diligent.

The prior **64-line SAP capability coverage register** is preserved under `docs/evidence/benchmarks/sap-capability-coverage-register.csv` as outside-in enterprise-completeness evidence. Its old NuBlox-domain/slice fields are provenance only. The V3 remap and architecture challenge are now **64/64 complete** in `docs/evidence/benchmarks/sap-v3-capability-map.csv`: 47 native-core rows, 9 contextual extensions and 8 platform enablers. This is architectural challenge closure, not runtime feature parity.

Gate 3 is now complete at architecture-challenge level: 23/23 market benchmark suites challenged, 29/29 benchmark findings resolved, 12/12 standards/reference challenges completed and 12/12 deliberately rejected vendor patterns documented with rationale. Vendor module boundaries remain non-authoritative, and completion does not imply runtime parity or certification.

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

This closes the family-level semantic-convergence backlog. All **750/750 candidate occurrences now also have an explicit version-controlled canonicalization decision**. Canonical aggregate boundaries are frozen and the L2/L3 activity → canonical object/action mapping is complete. Controlled aggregate-aligned physical schema/API implementation waves are now architecturally authorised.

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


### Benchmark-driven refinements

The closed 750-candidate discovery baseline remains historical provenance. External challenge is permitted to expose durable semantics that were not present in that baseline.

Current SAP-driven/cross-market refinements include:

- integrated Demand Plan / Supply Plan and Planning Exception;
- treasury exposure, hedge, market-data and cash-pool semantics;
- master-data stewardship, duplicate evidence, merge decision and identity redirect;
- handling unit, warehouse wave, yard/dock appointment and freight execution;
- asset criticality, failure-mode and reliability strategy/health semantics;
- succession/talent-pool and talent-review semantics;
- configurable product/service model, characteristics, rules and resolved configurations;
- Travel Request / Business Trip / booking evidence;
- migration and protected test-data governance;
- Product Requirement / Requirement Set and engineering systems-model semantics;
- lease-accounting valuation/schedule consequences.

The machine authority is `app/src/lib/data/benchmark-refinement-model.ts`.

## Canonical aggregate-boundary freeze

Gate 4 is now closed through `app/src/lib/data/canonical-aggregate-boundary-register.ts` and `docs/data-model/canonical-aggregate-boundary-freeze.md`.

Current result:

```text
29/29 families covered
174 frozen logical aggregate boundaries
79/79 benchmark refinements assigned to one aggregate
one-aggregate command transaction rule enforced
```

The freeze defines logical ownership/consistency boundaries, not database/service topology.

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
10. benchmark/standards challenge completed to the level relevant to that family;
11. L2/L3 activities mapped to the owning aggregate/object and permitted action.

## Immediate convergence queue

The **family-level convergence queue is closed**.

Candidate-level convergence is now also closed at **750/750 decisions**.

The architecture convergence queue is now closed:

```text
29/29 workspaces mapped
353/353 L2 sub-functions mapped
1,510/1,510 source activities mapped
174 frozen logical aggregate boundaries
0 ambiguous or unmapped L2 routes
0 invalid object/write placements
```

Controlled aggregate-aligned physical schema/API implementation waves may now proceed. Runtime implementation, permissions, workflow behaviour and acceptance proof remain engineering deliverables rather than architecture-discovery gates.

The audit must continue to expose benchmark status and must fail if candidate decision coverage ever drops below 100%.
