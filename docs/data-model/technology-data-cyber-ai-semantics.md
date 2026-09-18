# IT, Data, Cyber, Analytics & AI Semantics

## Purpose

BOF-24 governs technology services/operations, configuration management, data governance, analytics, AI and cybersecurity while reusing canonical Asset, Party/User, Decision, Risk, Policy, recovery and evidence foundations.

## Technology service management

```text
Technology Service
    ↓
Technology Resource / Asset
    ↓
Configuration Registration
    ↓
Service Request / Incident / Problem
    ↓
Technology Change
    ↓
Technology Release
```

Application Service is a Technology Service type.

Configuration Item is normalized to **Configuration Registration** over the authoritative Service, Resource, Asset, Dataset/Model or other managed object. The CMDB is therefore a managed configuration view, not a second master-data universe.

Endpoint and IT Asset reuse canonical Asset when independently governed.

## Identity and access

Identity Account is a technical/system account and remains separate from User Identity/Person.

Access follows:

```text
Data Access Request / Privileged Access Request
        ↓
Decision / policy / SoD
        ↓
Access Grant
        ↓
technical provisioning
        ↓
use / revocation evidence
```

Request is not entitlement.

Access Grant is not Role Assignment or Delegated Authority.

Technical privilege never creates business approval authority.

## Disaster recovery

BOF-24 owns **Disaster Recovery Plan**.

The connection to BOF-23 is:

```text
Business Impact Assessment
        ↓
Recovery Requirement
        ↓
Disaster Recovery Plan
        ↓
Disaster Recovery Invocation
```

The plan and invocation remain separate.

## Data management

```text
Data Domain
    ↓
Data Product
    ↓
Dataset
    ↓
Data Quality Rule
    ↓
Data Quality Issue

Dataset → Data Pipeline → Dataset
```

Reference Dataset is a Dataset type/profile, not a parallel data master.

Dataset is logical governed data identity rather than a table, file, bucket or physical copy.

## Analytics

Report Definition and Dashboard Definition are governed semantic/query/visual definitions.

Rendered dashboards and generated report outputs are projections/representations, not source business truth.

Analytical Model is a versioned analytical/statistical model definition/artifact with exact input, calibration/training and validation provenance.

## AI

```text
AI Use Case
      ↓
AI Model / version
      ↓
AI Risk Assessment
      ↓
controls / approval / monitoring
```

Use Case and Model are separate.

AI Risk Assessment reuses enterprise Risk Assessment.

One approved use case does not automatically approve every model/version/deployment.

## Security policy and vulnerability management

Security Policy reuses enterprise Policy/controlled Information Container semantics.

```text
Vulnerability
      ↓
Patch Campaign / mitigation
      ↓
verification / accepted-risk decision
```

Vulnerability is distinct from Security Finding.

## Detection and incident response

```text
Threat Intelligence
        ↓
Security Alert
        ↓
Cybersecurity Incident
        ↓
contain / eradicate / recover
        ↓
Security Finding / Remediation
```

Security Alert is event/evidence and is not automatically an incident.

Cybersecurity Incident remains distinct from:

- routine IT Incident;
- Physical Security Incident;
- Privacy Incident.

A single underlying event can be linked to several specialist cases when legitimately cross-domain.

## Security testing

Penetration Test Engagement is authorized execution against exact scope/rules of engagement.

It produces Security Findings.

Findings may identify Vulnerabilities, but finding and vulnerability remain separate identities.

## Non-negotiable rules

1. Application Service is a Technology Service type.
2. Architecture Decision reuses shared Decision.
3. Configuration Item is a registration/designation over authoritative identities.
4. Endpoint/IT Asset reuse Asset where whole-life governed.
5. Identity Account is not User Identity or business authority.
6. Service Request, Incident, Problem, Technology Change and Release remain distinct.
7. DR Plan is BOF-24; Recovery Requirement/Invocation connect through BOF-23.
8. Data Domain, Data Product and Dataset remain distinct.
9. Reference Dataset is a Dataset type.
10. Rules, quality issues and data corrections are separate.
11. Report/Dashboard/Model definitions never become source business truth.
12. AI Use Case, AI Model and AI Risk Assessment remain separate.
13. Access Request is not Access Grant.
14. Security Policy reuses enterprise Policy.
15. Vulnerability, Alert, Cyber Incident, Threat Intelligence, Penetration Test and Security Finding remain distinct.