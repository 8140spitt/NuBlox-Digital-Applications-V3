# Legal, Corporate Secretariat, Privacy & Records-Obligation Semantics

## Purpose

BOF-22 governs legal matters, statutory/corporate filings, legal preservation, privacy governance and data-subject rights while reusing canonical Party, Person, Contract, Project, Information Container and evidence identities.

## Legal matter architecture

```text
Legal Matter
  ├─ Legal Advice Request
  ├─ Dispute
  │    └─ Legal Proceeding
  ├─ Statutory Filing
  ├─ Legal Hold
  │    └─ Legal Hold Link → exact records/objects
  └─ eDiscovery Collection
```

Legal Matter is context, not a replacement for the Contract, Project, Party or regulator case it concerns.

## Obligations

NuBlox preserves source meaning:

- Contract Obligation — contractual duty from Contract/Clause.
- Regulatory Obligation — regulator/regulation/licence/permit duty.
- Legal Obligation — residual court, fiduciary, statutory or other legal duty not already represented by those specialised sources.

All can drive actionable Compliance Requirements.

## Statutory and corporate filings

Statutory Filing governs filing type, legal entity/subject, authority, due date/period, required content and status.

Each actual filing submission uses immutable External Submission evidence with the exact content/revision set and external reference.

## Intellectual property

Intellectual Property Asset is a governed intangible legal-right identity with type, owner, jurisdiction, application/registration, dates, licence/transfer context and status.

It is distinct from Finance Fixed Asset although finance may reference it.

## Legal holds and eDiscovery

Legal Hold is the preservation instruction.

Legal Hold Link is the relationship placing exact business objects, records or evidence under the hold.

eDiscovery Collection is a governed collection snapshot with source/custodian scope, collection method, integrity/hash, chain of custody and production/export provenance.

It never replaces the live source data.

## Privacy policy and framework

Privacy Policy is a controlled Information Container type, with standard revision, approval, issue and supersession semantics.

Privacy Framework is the versioned governance model defining principles, roles, lawful-basis approach, DPIA thresholds, control expectations and review rules.

## Processing activity

Processing Activity is the stable RoPA-style business definition of personal-data processing.

It captures controller/legal entity, purpose, data-subject categories, personal-data categories, lawful basis, recipients/processors, systems/datasets, retention, transfers and controls.

It is not one execution event and not a Dataset.

## DPIA

Data Protection Impact Assessment is dated/versioned assessment evidence around a Processing Activity, technology/project or material change.

Reassessment creates successor evidence. Prior assessments are not overwritten.

## Consent and preference

Consent Evidence and Preference Evidence are immutable change/event evidence.

Current consent/preference position is derived from retained valid events.

Preference is not consent unless the applicable legal/business rule explicitly says so.

## Data-subject requests

Data Subject Request is a governed rights-request case covering identity verification, request type/scope, searches, exceptions, decisions, disclosure/actions and statutory deadlines.

It is not a generic Work Item.

## Privacy incident and breach

Privacy Incident is the broad incident case.

Privacy Breach is a classification when breach criteria are met.

The breach determination, regulator/data-subject notification decision and timing remain retained evidence.

## International transfers

International Data Transfer Arrangement is an effective relationship/configuration between exporter/importer, Processing Activity, jurisdictions and transfer mechanism.

It is not one runtime network/data-transfer event.

## Privacy assurance

Privacy Assurance Review reuses the shared Assurance Review pattern. Formal internal/external audit continues to use Audit Engagement.

## Non-negotiable rules

1. Legal/privacy objects reuse canonical Party, Person, Contract, Project and controlled-information identities.
2. Legal Matter, Dispute and Legal Proceeding remain distinct.
3. Contract, Regulatory and residual Legal Obligations preserve source authority.
4. Filing case and actual external submission evidence remain separate.
5. Legal Hold and Legal Hold Link are separate instruction and relationship layers.
6. eDiscovery Collection is an immutable/source-linked collection snapshot.
7. Privacy Policy uses controlled Information Container semantics.
8. Processing Activity is a stable processing definition, not execution telemetry.
9. DPIA is assessment evidence.
10. Consent and Preference evidence remain distinct event histories.
11. Privacy Breach is a Privacy Incident classification.
12. International Transfer is a governed arrangement, not one runtime data movement.
13. Privacy review reuses shared assurance semantics.
14. Privilege, privacy sensitivity, hold, retention and access controls remain independently enforceable.
