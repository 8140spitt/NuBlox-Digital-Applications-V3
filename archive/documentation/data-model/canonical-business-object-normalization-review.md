# Canonical Business Object Duplicate & Alias Convergence

**Status:** governed — Gate 2 closed  
**Closure date:** 18 September 2026  
**Discovery input:** `canonical-business-object-duplicates.csv`  
**Machine-checkable authority:** `app/src/lib/data/canonical-alias-convergence-audit.ts`

## Purpose

The generated 750-candidate register contains 26 exact duplicate-name groups plus a wider set of aliases and near-aliases. Duplicate spelling alone is not a reason to merge concepts. Gate 2 requires every collision to resolve to one of three outcomes:

1. **shared canonical identity** — the candidates represent the same business fact and converge on one canonical root;
2. **explicitly distinct semantics** — similar/same words represent materially different identities, lifecycles or authority and are given explicit canonical meaning;
3. **governed family pattern** — related domain objects reuse shared foundations/evidence rules without being collapsed into one generic master.

The executable audit verifies every exact duplicate group has a governed outcome and that the documented near-alias challenges remain covered by version-controlled canonicalisation decisions.

## Exact duplicate-name closure

| Discovery collision | Governed outcome |
| --- | --- |
| Action | **Shared:** Decision Action |
| Activity | **Distinct:** CRM Activity vs Schedule Activity |
| Allocation | **Distinct:** Workforce Allocation vs Settlement Allocation |
| Call-off | **Shared:** one Call-off Order owned by commercial/procurement and consumed by logistics |
| Comparison | **Shared:** Sourcing Evaluation |
| Completion Certificate | **Distinct:** Statutory Completion Certificate vs Delivery Completion Certificate |
| Compliance Requirement | **Shared:** enterprise Compliance Requirement |
| Constraint | **Distinct:** Development Constraint vs Delivery Constraint |
| Decision | **Shared:** immutable Decision evidence |
| Defect | **Shared:** one governed Defect case identity |
| Entitlement | **Distinct:** Claim Entitlement Basis vs Service Entitlement |
| Information Container | **Shared:** controlled Information Container identity |
| Isolation | **Shared:** QHSE-governed Isolation |
| Issue | **Distinct:** Project Issue vs Information Issue |
| Phase | **Shared:** Delivery Stage Assignment pattern |
| Procurement Package | **Shared:** one Procurement Package |
| Response | **Distinct:** Information Response vs Request Response |
| Responsibility Assignment | **Shared:** contextual Responsibility Assignment |
| Risk Assessment | **Shared:** Risk Assessment evidence pattern |
| Site | **Shared:** built-environment Site identity |
| Tax Code | **Shared:** jurisdictional Tax Code reference |
| Training Record | **Shared:** Person Learning Record |
| Unit of Measure | **Shared:** Unit of Measure reference |
| Utility Consumption | **Shared:** Utility Consumption evidence |
| Valuation | **Distinct:** Property Valuation vs Commercial Valuation |
| Zone | **Shared:** spatial Zone identity |

Result: **26/26 exact duplicate groups resolved.**

## Near-alias challenge closure

The Gate 2 audit also governs representative near-alias families that cannot be found by exact string matching alone.

| Challenge | Governed outcome |
| --- | --- |
| BOM / Bill of Material | one Bill of Material structure |
| Project / Job | Job is an industry alias for Project in project controls |
| Land / Land Parcel | one Land Parcel identity |
| Product / Material / Service Item | one typed/classified Item identity |
| Asset Type / Asset Model | deliberately distinct definition layers |
| Permit / Permit to Work | one QHSE Permit to Work identity consumed by field operations |
| Inspection variants | shared Inspection pattern where semantics align; specialist execution/result evidence remains explicit |
| Change variants | Project, Design, Commercial, Regulatory and Technology change retain domain authority; Change Event is evidence |
| Evidence variants | domain evidence retains meaning while sharing evidence/provenance foundations |
| Certificate/certification variants | authority and legal/business basis remain explicit; no universal certificate master |
| Risk variants | Enterprise Risk and Risk Assessment are shared foundations with specialist context/methods |

## Governing rules

- Never merge because names look similar.
- Never split the same real-world/business identity merely because different workspaces use it.
- A shared root requires compatible identity, lifecycle, version/effectivity, ownership, permissions and evidence semantics.
- Where business meaning differs, canonical naming must make the distinction explicit.
- Shared evidence/workflow primitives coordinate domain truth but never replace it.
- Reference/classification overlays do not create parallel master identities.
- Every merge must retain provenance from the original discovery candidate key.
- A future duplicate or near-alias without an explicit governed outcome reopens Gate 2 and must fail the convergence audit.

## Architecture consequence

Duplicate/alias convergence is now closed, but this does **not** authorize physical schema/API implementation. Remaining gates are:

1. external benchmark / standards challenge;
2. canonical aggregate-boundary freeze;
3. L2/L3 activity → canonical object/action mapping;
4. physical schema/API implementation waves only after those gates are satisfied.
