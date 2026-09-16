# Canonical Business Object Normalization Review

**Status:** pre-review recommendations  
**Review date:** 17 September 2026  
**Input:** `canonical-business-object-duplicates.csv`  

The first generated candidate register exposes 26 exact duplicate-name groups. This document records the initial semantic recommendation for stakeholder review. These recommendations are not yet final canonical decisions.

## 1. Strong candidates for one shared canonical concept

These duplicates appear to describe the same business concept reused by several functions. The preferred direction is one canonical identity with contextual relationships and workspace-specific views.

| Candidate | Appears in | Initial recommendation |
| --- | --- | --- |
| Site | site/field operations; property/asset | one canonical spatial/site identity; construction operations act on the same site used by property and asset contexts |
| Zone | site/field operations; property/asset | one canonical spatial zone/location concept, with type/classification and parent location controlling meaning |
| Procurement Package | commercial; procurement | one canonical procurement/commercial package, with commercial and sourcing views rather than duplicate package masters |
| Information Container | design/information; records management | one canonical governed information-container identity; records-management status/retention are overlays on the same controlled information |
| Unit of Measure | product/inventory; reference configuration | one canonical reference-data concept |
| Tax Code | finance; reference configuration | one canonical governed tax-code reference concept, scoped by tax regime/jurisdiction/effectivity |
| Training Record | commissioning/handover; HCM | one canonical evidence record of training/briefing participation; project/asset context links it to commissioning/handover where applicable |
| Compliance Requirement | QHSE; enterprise compliance | one canonical requirement/obligation model or common supertype with domain classification; avoid separate copies of the same requirement |
| Isolation | field operations; HSE | one canonical controlled-work isolation record; safety rules govern its lifecycle and site operations consume it |
| Completion Certificate | regulatory; commissioning/handover | one certificate identity where it is genuinely the same certificate; certificate type/jurisdiction/source distinguish regulatory and contractual certificates |
| Call-off | procurement; logistics | one call-off commitment/request identity linked to the governing order/framework and downstream delivery/logistics |
| Utility Consumption | facilities/service; sustainability | one measured consumption event/series feeding operational, financial and sustainability views |

## 2. Same word, likely different canonical semantics

These should **not** be merged merely because the words match. They need explicit names or subtype/supertype modelling.

| Candidate | Collision | Initial recommendation |
| --- | --- | --- |
| Activity | CRM activity vs project schedule activity | distinguish `Business Interaction/CRM Activity` from `Schedule Activity`; they have different identity, time, dependency and completion semantics |
| Allocation | workforce/resource allocation vs accounting allocation | distinguish `Resource Allocation` from `Financial Allocation`; different aggregates and accounting consequences |
| Valuation | property valuation vs contract/payment valuation | distinguish `Property Valuation` from `Contract Valuation/Payment Valuation`; do not share lifecycle or monetary basis |
| Entitlement | contract/commercial entitlement vs service entitlement | distinguish `Commercial Entitlement/Claim Basis` from `Service Entitlement`; potentially common abstract concept only if useful |
| Issue | project issue vs information/design issue | distinguish `Project Issue` from `Information/Coordination Issue`; allow common issue-management interface if required |
| Phase | project phase vs site/construction phase | likely relate both to a common phase/stage classification, but preserve whether the phase is a project governance stage or a physical/site execution subdivision |
| Response | technical/submittal response vs generic workflow response | domain response belongs to the governed domain exchange; workflow response is work/task evidence and must not replace it |
| Risk Assessment | HSE task/risk assessment vs enterprise risk assessment | share risk concepts/reference scales where useful but preserve materially different assessment structures and regulatory evidence |
| Defect | quality/construction defect vs service/asset failure defect | consider one `Defect` case with context/type if lifecycle/evidence can be generalized; otherwise explicit construction-quality and operational-service subtypes |
| Constraint | development/site constraint vs project-control constraint | consider one contextual `Constraint` supertype only if source, impact, ownership and resolution semantics align |

## 3. Shared platform concepts requiring deliberate abstraction

These duplicates could become shared platform-level objects, but only after confirming that a generic object does not erase domain meaning.

| Candidate | Initial recommendation |
| --- | --- |
| Decision | evaluate one attributable `Decision` object with decision type, authority, governed-object link and evidence; domain state transition remains authoritative |
| Action | evaluate one accountable `Action` object with owner, due date, status and source context; avoid using it as a substitute for domain work orders/tasks |
| Responsibility Assignment | likely one contextual assignment pattern linking party/person/role to governed object and responsibility type |
| Comparison | likely a shared analysis pattern only at UI/service level; estimate/tender and procurement comparisons may need distinct governed snapshots |

## 4. Review tests for every duplicate or alias

Before two concepts are merged, answer:

1. Do they represent the same real-world/business identity?
2. Can one stable identifier survive every context in which the concept is used?
3. Do they have compatible lifecycle semantics?
4. Do they have compatible version/effectivity semantics?
5. Do they have compatible ownership and permission rules?
6. Do they require the same audit/evidence and retention treatment?
7. Would merging them create fields that are meaningless in one context?
8. Would splitting them force people to re-key or reconcile the same business fact?

If the answers point in different directions, prefer explicit relationship/subtype modelling over either blind merging or blind duplication.

## 5. Known alias normalization still to perform

Exact-name duplicate detection is only the first pass. The register also contains likely aliases and near-duplicates that need semantic review, including examples such as:

- `BOM` and `Bill of Material`;
- `Project` and `Job`;
- `Land Parcel` and `Land`;
- `Product Item`, `Material Item`, `Service Item` and broader item/master semantics;
- `Asset Type` / `Asset Model` and product/manufacturer definitions;
- `Permit`, `Permit to Work` and jurisdictional/statutory permit concepts;
- `Inspection`, `Maintenance Inspection`, `Regulatory Inspection` and `Statutory Inspection`;
- `Change`, `Change Request`, `Design Change`, `Controlled Change Record`, `IT Change Request` and contract change/variation semantics;
- `Evidence Item`, `Technical Evidence`, `Compliance Evidence`, `Sourcing Evidence`, `Completion Evidence` and domain-specific evidence relationships;
- `Certificate`, `Quality Certificate`, `Commissioning Certificate`, `Completion Certificate`, `Certification` and card/licence evidence;
- `Risk`, `Project Risk`, `Supplier Risk`, `Climate Risk`, `Resilience Risk` and security risk concepts.

These must be reviewed by business meaning, not string similarity alone.

## 6. Recommendation for the stakeholder review

Do not ask stakeholders to approve 724 names one by one.

Ask them to validate:

1. the object families and missing concepts;
2. the core identity graph;
3. the modelling rules;
4. representative normalization decisions from sections 1–3;
5. the rule that detailed canonicalization proceeds family-by-family after the review.

This allows tomorrow's session to establish architectural direction without pretending the complete semantic model can be finalized in one meeting.
