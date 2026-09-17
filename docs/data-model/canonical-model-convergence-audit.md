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

PTC Windchill 13.1.2 remains the first formal external benchmark, with 29 required study domains. Its study status remains **in progress**.

External benchmark coverage is deliberately not treated as complete merely because several useful architectural findings have already been adopted. Benchmark systems challenge completeness and semantics; they never become automatic NuBlox schema authority.

## Family maturity states

The audit uses three explicit family-level states.

### Governed semantic model

A family has a governed semantic architecture covering its principal identity, relationship, lifecycle/versioning and evidence boundaries. This does **not** mean every candidate occurrence in that family has already received an individual canonicalization decision.

Current governed families:

- BOF-01 Tenant, identity, party and enterprise structure;
- BOF-03 Market, CRM, business development and customer;
- BOF-06 Portfolio, programme, project and project controls;
- BOF-07 Design, engineering, BIM and information management;
- BOF-08 Contract, appointment and commercial management;
- BOF-09 Procurement, supplier and subcontract sourcing;
- BOF-10 Product, material, catalogue, inventory and logistics;
- BOF-11 Manufacturing, fabrication and off-site production;
- BOF-15 Commissioning, completion, handover and closeout;
- BOF-16 Property, estate, space, infrastructure and physical asset;
- BOF-17 Maintenance, facilities, service, warranty and aftercare;
- BOF-19 Finance, accounting, tax, treasury and enterprise performance;
- BOF-27 Shared work, workflow, decision and collaboration;
- BOF-28 Evidence, audit, retention and legal traceability;
- BOF-29 Reference data, classification, jurisdiction and configuration.

### Partial semantic model

Some canonical patterns exist and are reusable, but the family is not yet sufficiently governed to approve physical design for the whole family.

Current partial families:

- BOF-12 Site, field and construction operations;
- BOF-13 Quality, health, safety, environment and assurance;
- BOF-22 Legal, corporate secretariat, privacy and records obligations;
- BOF-25 Knowledge, document/records management, communications and stakeholder engagement.

### Candidate-only

Discovery candidates exist, but no complete family-level semantic architecture has yet been accepted.

Current candidate-only families:

- BOF-02 Strategy, governance and enterprise performance;
- BOF-04 Land, development, investment and property acquisition;
- BOF-05 Estimating, measurement, tendering, proposals and sales;
- BOF-14 Building safety, regulatory control and statutory assurance;
- BOF-18 People, HCM, competence, time, payroll and expenses;
- BOF-20 Sustainability, carbon, energy, circularity and social value;
- BOF-21 Enterprise risk, compliance, internal control and audit;
- BOF-23 Business continuity, crisis and physical security;
- BOF-24 IT, data, cyber, analytics and AI;
- BOF-26 Organisation change, transformation and continuous improvement.

Therefore the present maturity split is:

```text
15 governed families
 4 partial families
10 candidate-only families
29 total families
```

This is intentionally visible. The audit must expose incompleteness rather than manufacture a false 100% score.

## Candidate decision coverage

Candidate decision coverage is computed directly from:

- `app/src/lib/generated/business-object-register.json` — the 750 candidate occurrences; and
- every version-controlled canonicalization baseline under `app/src/lib/data/*-canonicalization.ts`.

The audit deduplicates candidate keys and calculates, per family:

- candidate count;
- decided candidate count;
- undecided candidate count;
- decision coverage percentage.

This means the percentage cannot be raised by editing presentation copy. A new baseline decision must exist against a real candidate key in the generated register.

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

The next canonicalization passes should address the remaining candidate-only families in operating-model dependency order, while completing the four partial families. A practical sequence is:

```text
BOF-05 Estimating / Measurement / Tender
BOF-18 People / HCM / Competence / Time
BOF-13 Quality / HSE / Assurance (complete partial family)
BOF-14 Building Safety / Regulatory
BOF-20 Sustainability / Carbon / Energy
BOF-21 Risk / Compliance / Control / Audit
BOF-22 Legal / Privacy / Secretariat (complete partial family)
BOF-25 Knowledge / Records / Communications (complete partial family)
BOF-04 Land / Development / Investment
BOF-02 Strategy / Governance / EPM
BOF-23 Continuity / Crisis / Physical Security
BOF-24 IT / Data / Cyber / AI
BOF-26 Change / Transformation / Process Improvement
BOF-12 Site / Field Operations (complete remaining transactions)
```

The order can be refined by dependency evidence, but no unresolved family should disappear from the audit simply because implementation work starts elsewhere.
