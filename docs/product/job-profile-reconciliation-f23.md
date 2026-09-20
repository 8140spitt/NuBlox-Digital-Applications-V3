# F23 Job Profile Reconciliation — HSE & Sustainability

**Status:** employment-model reconciliation complete  
**Date:** 20 September 2026  
**Function:** F23 Health, Safety, Environment & Sustainability

## Result

All F23 source Job Profiles now have an explicit employment treatment.

### Leadership

- Head of HSE & Sustainability

### Professional employment roles

- Health & Safety Manager
- Health & Safety Risk Specialist
- Safety Inspector
- Safety Incident Investigator
- Occupational Health Specialist
- Permit-to-Work Coordinator
- Environmental Manager
- Waste Management Specialist
- Carbon Manager
- Energy Manager
- Sustainability Manager
- ESG Reporting Specialist
- Sustainable Procurement Specialist
- Environmental Compliance Specialist

The shared HSE/sustainability function does not imply a single generic role. These are materially different jobs with different Work Products, evidence, competence and regulatory consequences.

## Important role distinctions

### H&S Manager / Risk Specialist / Inspector / Investigator

These remain separate reusable Job Profiles:

```text
H&S Manager
  -> framework / policy / objectives / responsibilities

H&S Risk Specialist
  -> hazards / risk / controls

Safety Inspector
  -> inspection / findings / corrective actions

Safety Incident Investigator
  -> incident / investigation / root cause / action
```

A smaller tenant may assign several Job Profiles to one Position. NuBlox should not erase the distinctions in the reusable employment model.

### Energy Manager vs Energy Assessors

Energy Manager remains a distinct employment role from Commercial Energy Assessor and Domestic Energy Assessor.

The Wave 3 assessment roles require regulated assessment/certificate/lodgement work that an Energy Manager does not automatically perform.

### Carbon / Sustainability / ESG

Carbon Manager, Sustainability Manager and ESG Reporting Specialist remain distinct:

- Carbon Manager owns emissions/baseline/target/reduction work;
- Sustainability Manager owns broader sustainability objectives, initiatives and commitments;
- ESG Reporting Specialist owns metric collection, validation, calculation, disclosure and assurance support.

## Canonical-model findings

Employment reconciliation exposed an important problem: distinct HSE/sustainability jobs are currently being forced onto overly broad aggregates.

Key examples:

1. H&S framework, hazards, inspections, occupational health and permit-to-work are all mapped to the Incident aggregate/object family.
2. Occupational-health data requires explicit privacy/access/retention separation from incident and permit data.
3. Carbon, energy, sustainability strategy and ESG reporting are all mapped to the Carbon aggregate, despite materially different semantics.
4. Environmental management work is mapped almost entirely to Compliance Requirement, conflating environmental aspects/impacts/controls with external compliance obligations.

These are architecture gaps, not reasons to merge the jobs.

## Next F23 product-definition work

For each retained role:

- explicit Work Products and evidence;
- exact activity mapping;
- domain-correct canonical aggregates;
- competence/licence constraints where applicable;
- authority and separation-of-duties rules;
- privacy/retention constraints for occupational-health information;
- reporting/assurance provenance;
- Position-level Job Workbench composition;
- executable role acceptance scenarios.
