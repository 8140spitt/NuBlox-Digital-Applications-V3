# Business Continuity, Crisis & Physical Security Semantics

## Purpose

BOF-23 governs business continuity, crisis management and physical security while reusing enterprise Risk, Party, Site, Asset, Decision, Action, Communication and evidence foundations.

## Continuity architecture

```text
Business Impact Assessment
        ↓
Recovery Requirement
        ↓
Continuity Strategy
        ↓
Continuity Plan
        ↓
Continuity Exercise / Invocation
        ↓
Improvement Action
```

Business Impact Assessment is dated evidence.

Recovery Requirement carries RTO/RPO/MTPD or equivalent service-recovery requirements.

Continuity Strategy selects resilience/recovery approaches.

Continuity Plan is executable planning.

These are not interchangeable.

## Crisis and emergency event

```text
Emergency Event
      ↓
Crisis
      ↓
Decision
      ↓
Crisis Action
      ↓
Crisis Communication
```

Emergency Event is occurrence evidence.

Crisis is the response/coordination case.

Crisis Action reuses shared Decision Action.

Crisis Communication reuses Communication Item, with controlled content retained separately.

## Crisis organisation

Crisis teams do not create duplicate people/team records.

They reuse canonical Parties together with Role Assignment, Responsibility Assignment and, where required, Delegated Authority.

Attendance/assignment alone never creates material decision authority.

## Disaster recovery

Disaster Recovery Invocation is an occurrence against an exact BOF-24 Disaster Recovery Plan/version.

Business continuity and technology disaster recovery are linked but remain semantically distinct.

Recovery Requirement from BOF-23 can set objectives that BOF-24 technology DR must satisfy.

## Physical security zones

Physical Security Zone is a security-control overlay across canonical physical extents.

It may cover Sites, Buildings, Levels, Spaces or other spatial Zones but never creates another physical hierarchy.

## Access credentials and events

Visitor Pass and Access Pass converge onto **Physical Access Credential**.

Visitor Pass is a typed temporary credential.

Credential authorization and actual access evidence are separate:

```text
Person / Party
      ↓
Physical Access Credential
      ↓
permitted Security Zones
      ↓
Physical Access Event
```

Physical Access Event is immutable evidence of entry, exit, denial or checkpoint use.

## Physical security incidents

Physical Security Incident is a governed case covering intrusion, theft, threat/violence, access breach and suspicious activity.

It remains distinct from Cyber Security Incident, Privacy Incident and QHSE Incident, but all may reference shared underlying occurrence evidence where one event spans domains.

## Risk assessments

Travel Risk Assessment and Security Risk Assessment reuse the shared BOF-21 Risk Assessment architecture.

Persistent/material exposures can also link to Enterprise Risk.

## Non-negotiable rules

1. BIA, Recovery Requirement, Continuity Strategy and Continuity Plan remain separate.
2. Exercises and invocations are occurrence evidence against exact plan versions.
3. Emergency Event is not Crisis.
4. Crisis Action/Communication reuse shared enterprise patterns.
5. Crisis-team roles reuse Party/role/responsibility/authority foundations.
6. Technology Disaster Recovery Plan remains BOF-24-owned; BOF-23 records the invocation.
7. Physical Security Zone overlays canonical spatial identity.
8. Visitor Pass is a Physical Access Credential type.
9. Credential authorization and Physical Access Event evidence are separate.
10. Physical Security Incident is separate from cyber/privacy/QHSE incident cases while occurrence facts can be linked.
11. Travel/Security risk assessments reuse enterprise Risk Assessment.
12. Site, Asset, Party, Decision, Action, Communication and evidence are never duplicated by the continuity/security domain.
