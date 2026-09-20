# Quality, Health, Safety, Environment & Assurance Semantics

## Purpose

BOF-13 defines the shared quality, HSE, environmental and assurance object model for NuBlox.

The governing architecture is:

```text
Quality / Assurance Definition
Quality Plan → ITP → Verification Point

Execution
Inspection / Test / Calibration / Certificate

Nonconformance
NCR / Defect → CAPA Case → CAPA Action

Safe work
Hazard → Risk Assessment → Method Statement / RAMS
        → Permit to Work → Isolation
        → Safety Briefing Session

Events
Observation → Incident → Investigation → Cause → CAPA

Compliance / Environment
Compliance Requirement → Compliance Register (projection)
Environmental Aspect → Environmental Impact
Incident / Waste Consignment evidence
```

## Core rule

Quality, safety and assurance objects reference canonical Project, Contract, Work Package, Site, System, Asset, Person and Information Container identities. They do not create QHSE-owned duplicates.

## Quality planning and verification

Quality Plan is a governed management plan.

Inspection and Test Plan (ITP) defines exact verification scope, acceptance criteria, responsibilities and points.

Hold Point and Witness Point use one **Verification Point** model with point type.

An approved ITP version is not rewritten by execution. Inspection/Test occurrences reference the exact plan/point version they satisfy.

## Inspection and test

Inspection and Test are execution/evidence records.

Statutory Inspection uses the same Inspection pattern with additional jurisdiction, statutory requirement and competent-person context.

Calibration Record preserves measurement-equipment provenance.

Quality Certificate is evidence linked to exact subject and verification basis; it never replaces the Item, Asset, Work Package or other subject identity.

## NCR, Defect and CAPA

These are deliberately different:

- **NCR** — departure from a requirement and its disposition;
- **Defect** — governed nonconforming physical/functional/quality condition;
- **CAPA Case** — corrective/preventive response and effectiveness process;
- **CAPA Action** — individual corrective or preventive action.

Snag is a Defect type rather than a second defect master.

Corrective Action and Preventive Action use one CAPA Action identity pattern with action type.

## Audit and assurance

QHSE Audit reuses the enterprise **Audit Engagement** pattern.

Assurance Review remains a separate lighter/broader assurance occurrence where the work is not formally an audit.

The distinction is driven by assurance method/governance, not by separate evidence silos.

## Hazard and risk assessment

Hazard is the identified source/potential for harm.

Risk Assessment is a time/context-specific assessment of hazard/risk.

BOF-13 Risk Assessment converges with the enterprise Risk Assessment candidate in BOF-21 so project/safety and enterprise risk use one governed assessment pattern.

Assessment never becomes the Hazard/Risk identity itself.

## Method Statement and RAMS

Method Statement and RAMS use the canonical Information Container model.

```text
Information Container
  type = Method Statement / RAMS
  ↓
controlled revision / status / issue
  ↓
file representations
```

RAMS references the exact Risk Assessment and method basis. A PDF does not become the business object.

## Permit to Work and Isolation

Site operations and QHSE use the same Permit to Work and Isolation identities.

Permit is temporary controlled work authorisation, with defined scope, hazards, controls, validity and handback.

Isolation records exact equipment/system/energy-source isolation points and application/verification/restoration evidence.

Neither can be represented safely as merely a workflow status.

## Induction, briefing and toolbox talks

Induction, Briefing and Toolbox Talk use one typed **Safety Briefing Session** pattern.

The session records:

- type;
- controlled source information/revision;
- presenter;
- date/location;
- participants;
- acknowledgement/outcome.

Person attendance/outcome may generate the HCM Learning Record evidence established in BOF-18.

## Observation, incident and investigation

Observation is immutable source evidence.

Incident is the governed case around an occurrence.

Near Miss is an Incident type where potential harm existed but harmful consequence did not occur.

Pollution Event is an environmental Incident type.

Investigation is separate from Incident and can produce one or more Cause Findings and CAPA cases.

This prevents incident status from being overloaded with investigation/corrective-action state.

## Compliance

Compliance Requirement is shared with BOF-21 enterprise compliance.

Compliance Register is a **projection**, derived from:

- applicable requirements;
- effectivity/jurisdiction;
- responsibility;
- evidence;
- compliance assessments/status.

It must never become a manually maintained second source of regulatory truth.

## Environmental aspects and impacts

Environmental Aspect represents how an activity/product/service can interact with the environment.

Environmental Impact represents the resulting or potential environmental change.

They remain separate from actual environmental incidents.

Waste Consignment is immutable regulated transfer evidence with waste classification, quantity, parties, origin/destination and supporting documentation.

## Non-negotiable rules

1. Quality/HSE objects reuse canonical enterprise identities.
2. Planning/definition and execution/evidence remain separate.
3. Hold and Witness Points use one Verification Point pattern.
4. NCR, Defect and CAPA are not interchangeable.
5. Snag is a Defect type.
6. Corrective and Preventive Action use one CAPA Action pattern.
7. Audit Engagement, Risk Assessment and Compliance Requirement are enterprise-shared patterns.
8. Method Statement/RAMS use controlled Information Container identity.
9. Permit and Isolation are shared across QHSE and site operations.
10. Safety briefings create attendance/learning evidence; they do not create duplicate people records.
11. Near Miss and Pollution Event are Incident classifications.
12. Investigation and Cause findings remain distinct from Incident state.
13. Statutory Inspection is an Inspection with regulatory context.
14. Compliance Register is a projection.
15. Environmental Aspect, Impact and actual Incident are separate concepts.
16. Material assurance actions/decisions preserve actor, authority, timestamp and evidence.
