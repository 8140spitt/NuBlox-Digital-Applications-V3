# Knowledge, Records, Communications & Stakeholder Engagement Semantics

## Purpose

BOF-25 governs reusable organisational knowledge, records-management overlays, retention/disposition, communications/publication and stakeholder engagement.

The governing rule is:

> Records and communications operate around authoritative enterprise truth; they do not create a second content repository or copy business objects into a records silo.

## Knowledge

Knowledge Article is a controlled Information Container profile.

Lesson Learned is a typed Knowledge Article with source context, observation, recommendation, applicability and validation metadata.

Knowledge Collection is a curated collection of references. It never copies article content.

## Controlled information

These all reuse the canonical Information Container:

- Knowledge Article;
- Controlled Document;
- Media Release;
- Statement;
- Annual Report.

The content identity, revisions, iterations, representations, issue/publication and supersession history remain governed once.

## Declared records

Declared Record is normalized to **Record Declaration**.

A declaration identifies an existing authoritative object, Information Container, transaction or Evidence Item as a record and associates it with:

- Record Type;
- Record Series / Record File aggregation;
- Retention Schedule / class;
- declaration time/actor;
- business context;
- security/handling.

The authoritative object is not copied.

## Record Series and Record File

Record Series is a controlled classification/records-series definition.

Record File is normalized to **Record File Aggregation**: a grouping of record declarations for a case, subject, period or activity.

It is not a binary file and not a filesystem folder.

## Retention and disposition

Retention Schedule is versioned policy.

Record Type and Data Retention Class remain shared reference/configuration.

Disposition follows:

```text
Record Declaration
      ↓
retention rule + trigger
      ↓
eligibility check
      ↓
Legal Hold check
      ↓
Disposition Request
      ↓
Retention Disposition Decision
      ↓
execution / archive / transfer / destruction evidence
```

Legal Hold always prevents destructive disposition while in force.

## Communications

Communications Plan defines objectives, audiences, key messages, channels, activities, owners, timing and measures.

Communication Item is the planned/executed communication activity.

Its content is a separate exact Information Container revision.

This prevents the message and the act of distributing it from becoming one overloaded record.

## Media

Media Enquiry is an inbound case/request.

Media Release and Statement are controlled Information Container types.

The enquiry can link to exact approved response/publication content while preserving source, deadline, owner and response evidence.

## Campaigns and external affairs

PR Campaign is normalized to **Communications Campaign**.

Reputation Issue and Public Affairs Issue use one **External Affairs Issue** case architecture with explicit issue type.

Underlying legal, regulatory, project or customer facts remain authoritative in their source domains.

## Stakeholder engagement

Investor Engagement is normalized to a typed **Stakeholder Engagement** occurrence.

Each occurrence retains canonical Party participants, purpose, time/channel, subjects, commitments/actions and evidence.

Stakeholder Engagement Plan is distinct from Communications Plan because stakeholder engagement includes consultation, relationship-building, commitments and feedback beyond outbound messaging.

## Annual report

Annual Report is a controlled Information Container type.

Financial, sustainability and other reported positions remain authoritative in Finance, Sustainability and other source domains.

The Annual Report pins the exact approved source/reporting snapshots and published revision without becoming those source ledgers/measures.

## Non-negotiable rules

1. Knowledge and records do not create a second content repository.
2. Knowledge Article, Controlled Document and publication content reuse Information Container.
3. Lesson Learned is a knowledge type, not a second lessons database.
4. Record Declaration overlays source truth; it never copies source objects.
5. Record Series/File are classification/aggregation structures, not storage folders.
6. Retention Schedule is policy; disposition is separately requested, decided and evidenced.
7. Legal Hold overrides disposition eligibility.
8. Communication activity and communication content are distinct.
9. Reputation/Public Affairs issues share one typed issue architecture.
10. Investor Engagement is Stakeholder Engagement evidence around canonical Parties.
11. Published content is immutable by revision; corrections preserve prior publication evidence.
12. Privacy, privilege, retention, security classification and access remain independent governance dimensions.
