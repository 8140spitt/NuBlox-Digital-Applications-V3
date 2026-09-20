# F20 Job Profile Reconciliation — Risk, Compliance & Assurance

**Status:** employment-model reconciliation complete  
**Date:** 20 September 2026  
**Function:** F20 Risk, Compliance, Internal Control & Audit

## Result

All F20 source Job Profiles now have an explicit employment treatment.

Leadership:
- Head of Risk, Compliance & Assurance

Professional employment roles:
- Enterprise Risk Manager
- Risk Analyst
- Risk Manager
- Risk Monitoring Analyst
- Compliance Manager
- Compliance Monitoring Specialist
- Internal Controls Specialist
- Controls Assurance Specialist
- Internal Audit Manager
- Internal Auditor
- Remediation Manager
- Fraud Risk Specialist
- Ethics & Conduct Officer
- Assurance Manager

## Composition decisions

Two source Risk Analyst profiles are composed into one employment job:

```text
F20.02 Risk Identification
F20.03 Risk Assessment
  -> Risk Analyst
```

Two Internal Audit Manager source profiles are composed into one employment job:

```text
F20.10 Internal Audit Planning
F20.12 Audit Reporting
  -> Internal Audit Manager
```

F20.11 Internal Auditor remains distinct because audit execution is independently staffable and requires independence/reviewer separation from audit management.

## Independence principle

Risk, compliance, controls and audit employment profiles do not confer unrestricted access to the subjects they oversee.

NuBlox must separate:

```text
Job Profile
  != subject-system access
  != audit independence
  != case access
  != approval authority
  != remediation ownership
```

Restricted investigations, whistleblowing, fraud and assurance evidence need explicit case/evidence access boundaries.

## Architecture findings

Exact activity review exposed:

- Risk Framework and individual risk records are overloaded into one Risk aggregate.
- Compliance requirement, assessment, breach and remediation are conflated.
- Control identity and point-in-time control testing need separate evidence lifecycle.
- Audit planning, engagement, workpapers/findings/reporting and assurance coordination are overloaded.
- Remediation is incorrectly audit-owned even though findings can originate anywhere.
- Fraud investigation needs a restricted case separate from fraud risk assessment.
- Ethics declarations/conflicts/gifts/whistleblowing are not simply compliance requirements.
- Audit/assurance independence must be governed independently from Job Profile permissions.

See `job-profile-reconciliation-architecture-gap-register.csv`.

## Next F20 product-definition work

For every retained role:

- explicit Work Products;
- exact source activities;
- canonical risk/control/compliance/audit/case objects;
- evidence immutability and retention;
- restricted-case access;
- independence/conflict controls;
- accountable/author/reviewer/approver separation;
- remediation source/handoff semantics;
- Position-level Job Workbench composition;
- executable assurance scenarios.
