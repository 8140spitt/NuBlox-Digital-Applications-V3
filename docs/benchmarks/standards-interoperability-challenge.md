# Standards and Interoperability Challenge

**Status:** architecture challenge complete  
**Date:** 18 September 2026  
**Scope:** independent standards/reference challenge after completion of all 23 market benchmark suites

This challenge tests whether the NuBlox canonical model can satisfy or integrate the relevant management-system, information-management, openBIM and classification expectations **without** turning standards into software aggregate boundaries.

The machine-readable authority is:

`app/src/lib/data/standards-challenge-register.ts`

## ISO 19650 — information management

**Current reference:** ISO 19650-1:2018 remains current in September 2026; Edition 2 is under development.

**Official source:** https://www.iso.org/standard/68078.html

ISO 19650 applies information-management principles across the whole built-asset lifecycle and addresses exchanging, recording, versioning and organising information among actors.

NuBlox already governs:

- Information Requirement;
- Information Deliverable;
- Information Delivery Plan;
- Information Container;
- Revision / working iteration;
- Representation;
- Issue / purpose / suitability;
- Transmittal / Distribution;
- Review / Comment / Query / Submittal;
- Design Change;
- responsibility/authority;
- record/retention.

**Decision:** covered existing semantics.

Configured ISO 19650 naming/status conventions remain policy/reference configuration. They do not become object identity.

## buildingSMART IFC

**Current reference:** IFC 4.3.2.0 / ISO 16739-1:2024.

**Official sources:**

- https://www.buildingsmart.org/standards/bsi-standards/industry-foundation-classes/
- https://standards.buildingsmart.org/

IFC is a vendor-neutral machine-interpretable description of buildings and infrastructure, including identities, attributes and relationships.

**Decision:** interoperability boundary.

IFC is an exchange/schema representation. IFC entity/GUID values map through governed source-aware mappings to canonical NuBlox Information, Item, System, Asset, Space, Network and classification identities. IFC never becomes the enterprise master solely because it is an exchange standard.

Import/export must preserve:

- IFC schema/release;
- source system/file;
- external object identifier;
- canonical mapping;
- transformation/mapping version;
- validation evidence;
- import/export run provenance.

## buildingSMART BCF

**Current reference:** BCF 3.0.

**Official source:** https://www.buildingsmart.org/standards/bsi-standards/bim-collaboration-format/

BCF exchanges model-based topics/issues, viewpoints, comments, component references, responsibility and status between applications.

**Decision:** interoperability boundary.

BCF topics map to governed NuBlox Coordination Issue / Design Review / Review Comment / Markup / Response semantics and exact Information Revision/Representation references. External BCF topic IDs and statuses remain source/integration provenance.

A BCF topic does not automatically become a Design Change, Contract Change, Defect or workflow task; those consequences are explicit.

## buildingSMART IDS

**Current reference:** IDS 1.0.

**Official source:** https://www.buildingsmart.org/standards/bsi-standards/information-delivery-specification-ids/

IDS provides computer-interpretable requirements for IFC information and enables automated checking.

**Decision:** interoperability boundary.

IDS is a machine-readable representation of governed Information Requirement / acceptance criteria plus validation rules. IDS documents/versions are controlled information. Validation runs/results are attributable evidence and never replace the underlying requirement or source model.

## ISO 55001 — asset management

**Current reference:** ISO 55001:2024.

**Official source:** https://www.iso.org/standard/83054.html

The standard requires an asset-management system aligned to asset-management objectives with planning, implementation, review and continual improvement.

**Decision:** covered existing semantics.

The benchmark is satisfied architecturally through:

- stable Asset/System/Component identity;
- asset objectives/KPIs;
- condition, criticality and reliability;
- Maintenance Strategy/Plan/Work Order;
- lifecycle replacement and Asset Investment Appraisal/Plan;
- enterprise Risk/Control/Audit;
- handover / as-maintained configuration;
- history and retained evidence.

No second "asset management system" aggregate is introduced.

## ISO 9001 — quality management

**Current reference:** ISO 9001:2026, published 16 September 2026.

**Official source:** https://www.iso.org/standard/9001

**Decision:** covered existing semantics.

NuBlox already governs customer/quality requirements, Quality Plan/ITP, inspection/test, NCR/Defect/CAPA, competence, controlled information, process/performance evidence, audit/finding/remediation and continual-improvement actions.

Software coverage does not imply organisational certification.

## ISO 45001 — occupational health and safety

**Current reference:** ISO 45001:2018 remains current; a revision is under development in 2026.

**Official source:** https://www.iso.org/standard/45001

**Decision:** covered existing semantics.

NuBlox already separates Hazard, Risk Assessment/RAMS, Permit, Isolation, competence, observations, Incident/Investigation, controls, Emergency/Continuity, audit and remediation. Health-and-safety risk reuses the enterprise risk architecture rather than creating a second risk register.

## ISO 14001 — environmental management

**Current reference:** ISO 14001:2026.

**Official source:** https://www.iso.org/standard/14001

**Decision:** covered existing semantics.

NuBlox already governs Environmental Aspect/Impact, compliance obligations, Carbon/Resource/Waste evidence, objectives/targets, controls, monitoring/performance, incidents and audit/remediation.

## ISO/IEC 27001 — information security

**Current reference:** ISO/IEC 27001:2022.

**Official source:** https://www.iso.org/standard/27001

**Decision:** covered existing semantics.

NuBlox reuses:

- Enterprise Risk / Risk Assessment;
- Compliance Requirement;
- Internal Control / Control Test;
- Identity / access / privileged access;
- Technology Service / configuration;
- Security Incident;
- data/privacy classification;
- Audit / Finding / Remediation.

Control catalogues are governed definitions/configuration, not separate operational truth.

## ISO 31000 — risk management

**Current reference:** ISO 31000:2018, confirmed current in 2023.

**Official source:** https://www.iso.org/standard/65694.html

**Decision:** covered existing semantics.

Risk Framework, Enterprise Risk, Risk Assessment, Treatment Plan, Control, Decision, Action and retained reassessment history directly support the required identify/analyse/evaluate/treat/monitor/review cycle.

Project, supplier, cyber, climate and resilience risk reuse this shared architecture.

## ISO 22301 — business continuity

**Current reference:** ISO 22301:2019 remains current; Edition 3 is under development in 2026.

**Official source:** https://www.iso.org/standard/75106.html

**Decision:** covered existing semantics.

NuBlox already governs:

- Continuity Strategy;
- Continuity Plan;
- Continuity Exercise;
- crisis/security response;
- Disaster Recovery Plan;
- Disaster Recovery Invocation;
- Risk / Control / Audit / Remediation.

Technology disaster recovery and enterprise continuity remain linked but distinct.

## Uniclass

**Current reference:** NBS Uniclass July 2026 release cycle.

**Official source:** https://uniclass.thenbs.com/

Uniclass provides maintained classification tables spanning complexes, entities, spaces/locations, elements/functions, systems, products, activities, project management, roles, risk, materials, properties and information forms.

**Decision:** reference-data boundary.

NuBlox stores:

- classification source/system;
- table/code;
- release/version;
- label/definition;
- effective assignment;
- external provenance.

Uniclass codes never become Item, Asset, System, Space, Information Container, Work Package or WBS identity.

## Contract and regulatory regimes

The software benchmark programme also challenged construction contract administration through Oracle, Thinkproject/CEMAR, Causeway, Procore and the commercial model.

NuBlox therefore supports a contract-form-neutral architecture in which NEC/FIDIC/JCT-style terminology and mechanisms are configured over stable semantics such as:

- Contract Clause / Obligation / Key Date;
- Contract Notice;
- Commercial Change with typed Variation / Compensation Event;
- quotation / assessment / Decision;
- Claim / Dispute;
- Contract Value Schedule;
- Target Cost Baseline / Share Mechanism / Share Assessment;
- Payment Application / Valuation / Certificate;
- Retention / withholding / pay-less evidence;
- Final Account.

NuBlox does **not** claim that every jurisdiction or contract-form rule is automatically compliant without configured rules, notices, time bars, authority and applicable legal review.

## Standards challenge outcome

**12/12** registered standards/reference challenges are complete.

Decision split:

- **8** covered through existing/shared NuBlox semantics;
- **3** explicit interoperability boundaries — IFC, BCF and IDS;
- **1** reference-data boundary — Uniclass;
- **0** open standards-driven architecture gaps.

The standards challenge therefore validates the existing canonical boundaries rather than adding another set of management-system masters.

## Gate consequence

The external-product challenge and the independent standards/interoperability challenge are both complete at architecture level.

That permits NuBlox to move to the next architecture gate: **canonical aggregate-boundary freeze**.

It does not imply product certification, regulatory approval, or runtime interoperability conformance. Those require implementation, test evidence and—where applicable—formal external assessment.
