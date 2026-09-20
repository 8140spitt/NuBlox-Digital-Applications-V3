# 04 — Native Work-Delivery Runtime

**Status:** Governing execution-runtime architecture  
**Effective:** 20 September 2026

## Purpose

The Native Work-Delivery Runtime turns governed capability into performed work.

It bridges:

- Function / Delivery Domain;
- Process / Activity;
- Job Profile and competence;
- Organisation / Organisation Unit;
- Position / Person;
- operating context;
- Functional Deployment;
- Assignment;
- Work;
- Deliverable / Transaction / Decision;
- Review / Approval;
- Issue / Acceptance / Verification;
- Evidence and controlled record.

## Core chain

~~~text
Governed capability
-> Process / Activity
-> Functional Deployment
-> Responsibility
-> Assignment
-> Work
-> Deliverable / Transaction / Decision
-> Review / Approval
-> Issue / Execute / Transact
-> Acceptance / Verification
-> Evidence
-> Controlled history
~~~

## Why the runtime is first-class

NuBlox must not reduce enterprise work to:

- navigation menus;
- generic CRUD forms;
- file repositories;
- workflow steps with no authoritative object;
- permissions without responsibility;
- job titles without competence;
- task completion without a controlled output.

The runtime must preserve why the work exists, who is accountable, what must be produced, which rules apply, which exact state/version was decided upon and what evidence proves completion.

## Functional Deployment

A Functional Deployment binds governed capability to an operating context.

It can constrain:

- Function or Delivery Domain;
- Job Profile / required capability;
- Organisation / Organisation Unit;
- Position and/or Person;
- Portfolio / Programme / Project;
- Contract / Package;
- Site / Facility / Location;
- System / Asset / Service;
- responsibility scope;
- competence requirements;
- delegated Authority;
- effective dates;
- capacity / availability;
- assurance requirements.

Deployment is a controlled runtime object with its own lifecycle/history.

## Deployment gates

Before protected work is assigned or executed, NuBlox must be capable of evaluating applicable gates such as:

- active Organisation membership/engagement;
- valid Position/relationship;
- required Job Profile/capability;
- competence/qualification;
- expiry/revalidation;
- project/site/asset participation;
- responsibility scope;
- allocation/availability;
- Permission and data scope;
- delegated financial/contractual/technical Authority;
- Segregation of Duties;
- jurisdiction/site/security requirements.

Failure must become a controlled business state, not an unhandled server error.

Examples:

- not assigned;
- not authorised;
- competence missing;
- competence expired;
- deployment inactive;
- approval required;
- Segregation-of-Duties conflict.

## Responsibility

NuBlox must distinguish contextual responsibility such as:

- accountable owner;
- responsible performer;
- contributor;
- reviewer;
- checker;
- approver;
- acceptor;
- consulted party;
- informed/distribution party;
- independent assurance party.

Responsibility is contextual and does not itself grant access or Authority.

## Work

Work is an executable obligation.

A Work Item coordinates what must be done, by whom and by when.

A Work Item is not the domain object itself and does not replace domain truth.

Work may produce or affect:

- authoritative business data;
- transaction;
- Deliverable Item;
- Decision;
- Change;
- inspection/test result;
- physical work;
- Evidence.

## Managed outputs

NuBlox must manage what the enterprise expects the work to produce.

Examples include:

- strategy;
- policy;
- drawing;
- model;
- calculation;
- specification;
- estimate;
- BoQ;
- Contract;
- Purchase Order;
- fabricated Item;
- installed work;
- inspection result;
- test result;
- permit;
- certificate;
- commissioning record;
- Asset record;
- invoice;
- report;
- Decision.

A file can be content, Evidence or Representation; it is not automatically the governed output.

## Deliverable Requirement and Deliverable Item

A **Deliverable Requirement** defines that an output is required.

A **Deliverable Item** is the governed instance intended to satisfy that requirement.

A Deliverable Item can carry:

- stable identity;
- title/type/classification;
- source Requirement or contractual obligation;
- operating context;
- responsible Organisation / Position / Person;
- author/producer;
- reviewer/checker;
- approver;
- recipient/acceptor;
- planned/forecast/actual dates;
- current state;
- revision/version linkage;
- required format/Representation;
- dependencies;
- review/approval status;
- issue status;
- acceptance status;
- Baseline / Configuration relationship;
- linked Change;
- downstream consequences.

## Authoring modes

NuBlox may support an output in three broad ways.

### Native authoring

The work product is created directly in NuBlox using native structured tools.

### Connected authoring

A specialist tool creates content while NuBlox governs the required Deliverable identity, responsibility, status, review, issue, acceptance and Evidence.

### External authoritative

Another system remains source of record for the specialist object while NuBlox governs the enterprise relationship, required state, provenance and reconciliation.

The governing output identity remains explicit in all cases.

## Review

Review applies to an exact subject state.

The system preserves:

- subject identity;
- subject version/revision;
- review type;
- reviewer;
- comments/findings;
- response;
- outcome;
- timestamp;
- Evidence.

A review of revision A does not automatically review revision B.

## Decision and Approval

A Decision is attributable immutable evidence.

Approval is a use/type of Decision, not merely a state label.

NuBlox distinguishes:

- review completed;
- approved;
- released/issued;
- accepted;
- Baseline established.

These are not synonyms.

## Issue / Transmittal

Controlled issue preserves, where applicable:

- issue reference;
- purpose of issue;
- exact revision/Representation;
- issuing Party;
- recipient(s);
- date/time;
- response requirement;
- response state;
- correspondence/Evidence.

## Acceptance

Acceptance is a governed business response to an issued output.

Possible outcomes may include:

- accepted;
- accepted with comments;
- no objection;
- revise;
- rejected.

Acceptance is tied to the exact issued subject and recipient context.

Where acceptance is mandatory, successful acceptance may close the Deliverable obligation.

Reject/revise responses may create governed rework.

## Rework

Rework is not a silent overwrite.

The runtime preserves:

- previous subject state/version;
- Decision that caused rework;
- reason/comments;
- new Work Item / Assignment;
- resulting revision/version;
- renewed review/approval route where required.

## Downstream consequence

Completion must be capable of changing downstream business truth.

Examples:

- approved design releases procurement;
- valuation creates commercial/financial consequence;
- material request creates procurement demand;
- passed inspection releases following work;
- commissioned component becomes an operational Asset;
- approved Change revises cost/programme/design/configuration;
- accepted handover information completes an information Requirement.

## My Work

My Work is a projection of runtime responsibility.

It may include:

- assigned Work;
- Deliverable Items;
- reviews;
- approvals;
- Decisions;
- requests;
- exceptions;
- overdue work;
- expiring competence;
- blocked work.

My Work is not an independent master.

## Runtime acceptance test

For any material work NuBlox must answer:

- Why does it exist?
- Which Function/process requires it?
- Which operating context does it belong to?
- Who is responsible?
- Is the Person/Organisation deployed and competent?
- What Authority is required?
- What output is required?
- What is the current state/version?
- Who must review or approve it?
- What was issued/transacted?
- Who accepted or verified it?
- What changed?
- What downstream consequences occurred?
- What Evidence proves the complete history?
