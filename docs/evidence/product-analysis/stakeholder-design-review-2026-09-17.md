# Stakeholder Design Review — NuBlox V3 Canonical Business Object Model

**Review date:** 17 September 2026  
**Status:** design-review baseline  
**Scope:** NuBlox Construction & the Built Environment ERP / operating platform  

## 1. Review objective

The purpose of this review is to agree the architectural foundation of NuBlox before broad feature development continues.

The central proposition is:

> NuBlox must be designed around one canonical business-object model spanning the enterprise and the complete built-environment lifecycle. The 29 enterprise functions are tenant workspaces that act on shared canonical objects; they do not own duplicate copies of business truth.

The review is **not** intended to approve a final physical database schema. It is intended to validate the object universe, the modelling rules and the sequence by which candidate concepts become canonical.

## 2. Why this review is happening now

The F01.01 Strategy Framework prototype proved that a screen can become operational before the underlying platform semantics are mature. In particular, lifecycle, workflow, user task, permission and version semantics were too tightly exposed in the UI.

The corrective decision is to establish the object model first and let lifecycle, workflow, permissions, evidence, APIs and UI compose around authoritative domain objects.

## 3. Governing sector boundary

NuBlox must support both:

- the enterprise: customers, suppliers, finance, people, payroll, procurement, materials, inventory, logistics, manufacturing, property, assets, service, governance and reporting; and
- the built-environment lifecycle: development, planning, design, engineering, estimating, contracting, project delivery, commercial control, site operations, quality, safety, commissioning, handover, operation, maintenance, refurbishment and disposal.

The whole-life thread remains:

**Market → Lead → Opportunity → Bid → Estimate → Proposal → Quote → Contract → Design → Plan → Procure → Produce → Construct → Control → Invoice → Account → Handover → Operate → Maintain → Refurbish → Dispose**

## 4. Candidate-object discovery baseline

The machine-readable baseline is generated from the governing construction-and-built-environment model and the V3 discovery programme.

The generator produces:

- `docs/data-model/canonical-business-object-register.csv`
- `docs/data-model/canonical-business-object-duplicates.csv`
- `docs/data-model/canonical-business-object-summary.md`

The baseline intentionally contains **candidate object occurrences**, not a claim that every listed noun becomes an independent root entity.

The first review task is to reduce this universe by identifying:

- aliases and synonyms;
- duplicate concepts used by several functions;
- roles masquerading as master objects;
- states masquerading as objects;
- lines/children masquerading as aggregate roots;
- versions/revisions masquerading as independent identities;
- events and evidence that should be append-only;
- derived projections that must not become mutable duplicate truth.

## 5. Core identity graph to validate first

The first canonical identities should be reviewed before downstream transactional detail.

### Enterprise identity

- Tenant
- Party
- Person
- Organisation
- Legal Entity
- Enterprise Group
- Organisation Unit
- Team
- User Identity
- Membership
- Role Assignment
- Delegated Authority

### Delivery and commercial identity

- Portfolio
- Programme
- Project / Job
- Contract / Appointment / Subcontract / Framework Agreement
- Procurement / Commercial Package
- WBS Element
- Work Package
- Schedule / Activity / Milestone

### Built-environment and spatial identity

- Estate / Network
- Site
- Land / Property
- Facility / Building / Infrastructure Entity
- Level / Zone / Space / Linear Segment
- System / Subsystem
- Asset / Component / Maintainable Item
- Plant / Equipment / Vehicle / Tool

### Product and information identity

- Product / Material / Service Item
- Product Definition / Assembly / BOM
- Information Container
- Document / Drawing / Model / Specification / Calculation
- Information Requirement / Deliverable

### Financial identity

- Chart of Accounts / GL Account
- Financial Dimension
- Cost Code / Cost Centre / Profit Centre
- Accounting Period
- Journal / Ledger Entry
- Payable / Receivable Open Item
- Bank Account
- Fixed Asset

These identities must be related rather than duplicated when used by different workspaces.

## 6. Modelling rules requiring stakeholder agreement

### Rule A — one real concept, one canonical identity

An organisation may be a customer, supplier, subcontractor, consultant and project participant through governed relationships. NuBlox should not create separate organisation masters for each role.

### Rule B — role is not identity

Customer, supplier, dutyholder, project participant, approver and reviewer are roles or relationships in a defined context unless there is a clear independent business identity.

### Rule C — lifecycle state is not workflow

A domain object owns its business state. Workflow creates tasks/assignments and coordinates people. Completing a task does not bypass the domain transition.

### Rule D — version is not duplicate identity

Stable object identity must be separated from revision, iteration, representation/content version, lifecycle state and effectivity. Different object families may use different version semantics.

### Rule E — evidence is preserved

Material decisions, approvals, submissions, receipts, inspections, postings and corrections retain attributable history. Corrections should normally add evidence rather than erase prior truth.

### Rule F — derived positions are projections

Stock balances, CVR positions, KPI results, dashboards and similar summaries should derive from authoritative records unless a business requirement calls for an approved frozen snapshot.

### Rule G — classification is an overlay

Uniclass, IFC classifications, tax codes, cost codes and asset classifications enrich canonical identity but do not replace it.

## 7. Examples for discussion

### Organisation

Correct model:

`Organisation → Customer Relationship / Supplier Relationship / Subcontractor Relationship / Consultant Relationship / Project Participation`

Not:

`Customer Master + Supplier Master + Subcontractor Master + Consultant Master` for the same organisation.

### Physical asset

Correct model:

`Asset → location + system + commissioning + warranty + maintenance + finance + carbon + service history`

Not separate `Construction Asset`, `Maintenance Asset`, `Finance Asset` and `Sustainability Asset` identities for the same physical thing.

### Purchase order

- Purchase Order = governed transaction / aggregate
- Purchase Order Line = child/value-bearing component
- Approval Assignment = work object
- Approved = lifecycle state
- Committed Spend = derived commercial/financial position

These must not be conflated.

### Controlled information

- Information Container = stable governed identity
- Revision / iteration = version semantics
- Content / representation = file or model payload
- Suitability / status = controlled business state/classification
- Review task = workflow/work item
- Transmittal = issue/distribution event

## 8. Decisions sought at the review

1. Confirm the **business-object-first** direction and development hold on broad feature expansion.
2. Confirm the 29 object-discovery families provide adequate coverage of the Construction & Built Environment operating model.
3. Confirm the modelling rules in section 6.
4. Confirm the core identity graph in section 5 as the first canonicalization sequence.
5. Confirm that external systems such as Windchill, ERP/EAM/project/commercial products and industry standards are completeness/semantic benchmarks, not automatic schema authorities.
6. Identify missing object families or construction-sector concepts before canonicalization begins.

## 9. What stakeholders should challenge

Stakeholders should actively identify:

- any real business concept NuBlox would be unable to represent;
- concepts that are duplicated under different industry names;
- concepts whose meaning changes materially by organisation archetype;
- concepts that need jurisdiction-specific overlays;
- places where project, contract, property, asset and enterprise scopes could be confused;
- objects needing strong revision/effectivity semantics;
- accounting or commercial consequences that must remain traceable to source events;
- built-asset information required at handover that originates earlier in design/procurement/construction;
- regulatory evidence that must survive organisational/project closure.

## 10. Post-review sequence

After the review:

1. normalize duplicate names and aliases;
2. classify each candidate as root, child, relationship, event/evidence, version, reference/configuration or projection;
3. define the core identity graph and relationship cardinalities;
4. define lifecycle and version semantics by object family;
5. map the surviving objects to all F01–F29 workspaces;
6. map objects to whole-life stages and end-to-end process chains;
7. establish permissions, delegated authority, segregation-of-duties, evidence and retention rules;
8. validate finance/commercial consequences and information/asset continuity;
9. promote reviewed concepts from `candidate` to `validated`, then `canonical`;
10. implement physical schema only after the relevant object family is canonical.

## 11. Current application status

F01.01 remains a learning prototype. It must not be used as implicit authority for platform-wide object, lifecycle, workflow, permissions or version architecture.

The canonical business-object model becomes the governing source for future implementation decisions.
