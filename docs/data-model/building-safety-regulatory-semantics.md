# Building Safety, Regulatory Control & Statutory Assurance Semantics

## Purpose

BOF-14 governs statutory building-safety and regulatory-control semantics without creating parallel Building, Project, Party/Person, inspection or document masters.

The governing chain is:

```text
Dutyholder Assignment / Competence Evidence
        ↓
Regulator Case
        ↓
Regulatory Application
        ↓
Controlled Regulatory Change
        ↓
Inspection / Finding / Notice
        ↓
Regulatory Decision
        ↓
Completion Evidence / Statutory Certificate
        ↓
Golden Thread Information Set
        ↓
Regulatory Submission
```

## Identity rule

Regulatory context references the existing canonical identities:

- Party / Person / Organisation;
- Project;
- Site / Building / System / Asset;
- Information Container;
- Inspection;
- Decision/evidence;
- Regulatory Regime / Jurisdiction.

A regulator case number or building-control reference is never a replacement for NuBlox canonical identity.

## Dutyholders

Dutyholder Assignment is an effective statutory/regulatory relationship between a Party and defined regulated scope.

It is distinct from:

```text
Dutyholder Assignment
≠ Position
≠ Job Profile
≠ generic Role Assignment
≠ Responsibility Assignment
≠ Permission
≠ Delegated Authority
```

The assignment records role, statutory basis, regulated subject, effectivity and evidence.

Legal/accountability history survives organisational and workflow changes.

## Competence evidence

Regulatory Competence Evidence can reference:

- HCM Person Competence;
- Person Credentials;
- learning/assessment evidence;
- organisational capability evidence;
- declarations and third-party evidence.

The regulatory evidence occurrence is retained because the regulator may need to know **what evidence was relied upon at that time**, even if a credential or competence position later changes.

Competence evidence never creates another Person or Organisation master.

## Regulator Case and application

Regulator Case is the persistent interaction context with a regulator or statutory authority.

Regulatory Application is a distinct case/request within that context.

Building Control Application is a Regulatory Application type, not a second application architecture.

Submitted application information is pinned to exact controlled-information revisions and immutable submission evidence.

## Controlled change

Regulatory Controlled Change governs the regulatory treatment of a change.

It remains distinct from:

- Design Change;
- Commercial Change / Variation / Compensation Event;
- Project change-control workflow;
- Information revision itself.

One technical/design change may have separate commercial and regulatory consequences.

## Regulatory inspection and findings

Regulatory Inspection uses the shared QHSE Inspection pattern.

Additional context includes:

- regulator/authority;
- statutory requirement;
- jurisdiction/regime;
- inspector authority/competence;
- regulated subject.

Regulatory Finding is separate from the inspection occurrence and retains its own response/remediation/closure history.

## Mandatory occurrence reporting

Mandatory Occurrence Report is statutory reporting evidence.

```text
Incident / qualifying condition
        ↓
reportability assessment
        ↓
Mandatory Occurrence Report
        ↓
External / Regulatory Submission
        ↓
authority acknowledgement / follow-up
```

The report is not the underlying Incident.

Corrected/follow-up reports create new retained evidence rather than rewriting the original submission.

## Statutory notices

Statutory Notice is formal regulatory/legal notice evidence with exact issuer, recipient, legal basis, requirements, service evidence and dates.

It is not generic correspondence.

Compliance activity, appeals and regulator decisions remain separate records.

## Regulatory decisions

Regulatory Decision follows the shared immutable Decision semantics:

- exact subject/version;
- outcome;
- reasons;
- conditions;
- decision-maker/body;
- statutory authority basis;
- timestamp.

The decision is evidence. Any Building/Application/Change state transition happens through an explicit domain action consuming the valid decision.

## Completion

Completion Evidence is the evidence set proving required statutory criteria.

Statutory Completion Certificate is the formal regulatory certificate/outcome.

These are explicitly distinct from delivery/commercial completion:

```text
BOF-14 Statutory Completion Certificate
≠
BOF-15 Delivery Completion Certificate
```

Both may concern the same Building/Project milestone, but their issuing authority, legal meaning and evidence basis differ.

## Golden Thread

The Golden Thread is **not one document, folder, database row or duplicate store of all building information**.

NuBlox models it as a governed reconstructable information/evidence set over authoritative records:

```text
Building
 + Dutyholder history
 + Regulatory requirements
 + Controlled information revisions
 + Regulatory controlled changes
 + Inspection / findings
 + Decisions / notices / certificates
 + Asset / safety evidence
 + provenance / audit
        ↓
Golden Thread Information Set
```

Every surfaced fact retains source identity and provenance.

Historic "as-of" views are reconstructable.

A regulatory submission can create an immutable snapshot of the exact Golden Thread source set submitted at that time.

## Regulatory submission

Regulatory Submission reuses the shared External Submission pattern from BOF-27.

The submission records:

- exact content/revision set;
- sender;
- authority/recipient;
- channel;
- timestamp;
- external reference;
- delivery/acknowledgement/status evidence.

A resubmission is a new traceable occurrence.

## Non-negotiable rules

1. Regulation reuses canonical enterprise identities.
2. Dutyholder Assignment is statutory accountability, not generic job/permission state.
3. Competence Evidence retains the exact evidence relied on at the time.
4. Building Control Application is a Regulatory Application type.
5. Regulatory Controlled Change is separate from design and commercial change.
6. Regulatory Inspection reuses shared Inspection semantics.
7. Regulatory Finding is separate from inspection execution.
8. Mandatory Occurrence Report is reporting evidence, not Incident identity.
9. Statutory Notice is formal legal/regulatory evidence, not generic correspondence.
10. Regulatory Decision is immutable evidence and does not silently mutate domain truth.
11. Statutory Completion Certificate and Delivery Completion Certificate remain distinct.
12. Golden Thread is a reconstructable source-linked information set, not a duplicate content repository.
13. Regulatory Submission reuses shared External Submission semantics.
14. Historic regulatory meaning pins exact regime, jurisdiction, configuration and source-information versions.
