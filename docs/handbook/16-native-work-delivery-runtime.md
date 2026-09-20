# 16 — Native Work-Delivery Runtime

**Status:** Governing execution-runtime architecture  
**Effective:** 20 September 2026

## Purpose

The Native Work-Delivery Runtime is the shared execution layer that turns governed enterprise capability into real work performed by real people and organisations in real business contexts.

It is the bridge between:

- governed Functions;
- Industry Solution capability;
- Job Profiles and competence;
- Organisation / Position / Person;
- Project / Contract / Package / Site / Asset;
- work assignments;
- transactions, Decisions and Deliverable Items;
- evidence and controlled records.

## Runtime chain

The generic runtime chain is:

~~~text
Governed capability
-> Process / Activity
-> Deployment
-> Responsibility
-> Assignment
-> Work
-> Output / Transaction / Decision
-> Review / Approval
-> Issue / Execute / Transact
-> Acceptance / Verification
-> Evidence
-> Controlled history
~~~

## Why the runtime is first-class

NuBlox must not reduce enterprise work to:

- a navigation menu;
- generic CRUD forms;
- a file repository;
- workflow steps with no authoritative object;
- permissions without responsibility;
- job titles without competence;
- task completion without a controlled output.

The runtime must preserve why the work exists, who is accountable, what must be produced, which rules apply, which exact state/version was decided upon and what evidence proves completion.

## Runtime objects

Shared runtime concepts include:

- Functional Deployment;
- Deployment Assignment;
- Workflow Instance;
- Work Item;
- Work Assignment;
- Responsibility Assignment;
- Deliverable Requirement;
- Deliverable Item;
- Information Container;
- Review Request;
- Decision;
- Approval;
- Issue / Transmittal;
- Recipient Response;
- Inspection / Verification;
- Evidence;
- Change;
- Baseline.

Not every activity requires every object, but the runtime must support the full controlled chain.

## Deployment before work

A protected assignment should be capable of evaluating applicable deployment conditions such as:

- active organisation relationship;
- Position / engagement validity;
- required Job Profile or capability;
- competence / qualification;
- expiry / revalidation;
- project/site/asset participation;
- responsibility scope;
- availability / allocation;
- required access permission;
- delegated authority;
- financial / contractual / technical threshold;
- segregation-of-duties constraints;
- jurisdiction / site / security requirements.

A failed gate should return a controlled business state such as:

- not assigned;
- not authorised;
- competence missing;
- competence expired;
- approval required;
- segregation-of-duties conflict;
- deployment inactive.

It must not become an unhandled application failure.

## Work and responsibility

Work must be attributable.

NuBlox must be capable of distinguishing:

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

Responsibility is contextual.

A Person may have different responsibilities for different Projects, Packages, Assets or Deliverables.

## Managed output

The runtime must manage what the enterprise expects the work to produce.

Examples include:

- strategy;
- policy;
- drawing;
- model;
- calculation;
- specification;
- estimate;
- BoQ;
- contract;
- purchase order;
- fabricated item;
- installed work;
- inspection result;
- test result;
- permit;
- certificate;
- commissioning record;
- asset record;
- invoice;
- report;
- Decision.

A file can be evidence or representation of an output; it is not automatically the output itself.

## Deliverable Requirement and Deliverable Item

A Deliverable Requirement defines that an output is required.

A Deliverable Item is the managed instance expected to satisfy that requirement.

A Deliverable Item can carry:

- stable identity;
- title/type/classification;
- source requirement or contractual obligation;
- business context;
- responsible organisation / Position / Person;
- author/producer;
- reviewer/checker;
- approver;
- recipient/acceptor;
- planned/forecast/actual dates;
- status;
- revision/version linkage;
- required format/representation;
- dependencies;
- review state;
- issue state;
- acceptance state;
- baseline/configuration relationship;
- linked change;
- downstream consequences.

## Authoring

NuBlox may support work products in three broad ways:

1. **Native authoring** — the work product is created directly in NuBlox.
2. **Connected authoring** — a specialist authoring tool creates content while NuBlox governs identity, responsibility, status, review, issue and evidence.
3. **Externally authoritative output** — another system remains source of record and NuBlox governs the enterprise relationship, required state, provenance and reconciliation.

The governing output identity remains explicit in all three cases.

## Review

Review is performed against an exact subject state.

The system must preserve:

- subject identity;
- subject version/revision;
- review type;
- reviewer;
- comments/findings;
- response;
- outcome;
- time;
- evidence.

A review of revision A does not automatically approve revision B.

## Decision and approval

A Decision is immutable evidence of authorised judgement.

Approval is a type/use of Decision, not merely a state label.

The runtime must distinguish:

- review completed;
- approved;
- released/issued;
- accepted;
- baseline established.

These are not synonyms.

## Issue / transmittal

Issue or transmittal records controlled communication of an output.

The runtime should preserve where applicable:

- issue reference;
- issue purpose;
- exact revision/representation;
- issuing party;
- recipient(s);
- date;
- response requirement;
- response status;
- correspondence/evidence.

## Acceptance

Acceptance is a business response to the issued output.

Possible controlled outcomes can include:

- accepted;
- accepted with comments;
- no objection;
- revise;
- rejected.

Acceptance must be tied to the exact issued subject and recipient context.

Where acceptance is mandatory, successful acceptance can close the Deliverable Item or relevant obligation.

A rejection or revise response can create governed rework.

## Rework

Rework is not a silent overwrite.

When a review, approval or acceptance returns an output for revision, the runtime should preserve:

- previous subject state/version;
- Decision that caused rework;
- reason/comments;
- new Work Item / Assignment;
- resulting revision/version;
- renewed review/approval path where required.

## Downstream consequence

Work completion must be capable of creating or changing authoritative downstream objects.

Examples:

- approved design releases procurement;
- valuation creates commercial/financial consequence;
- accepted material request creates procurement demand;
- passed inspection releases following work;
- commissioned component becomes an operational Asset;
- approved change revises cost, programme, design and configuration;
- accepted handover information completes an information requirement.

## My Work

My Work is a projection of runtime responsibility.

It can include:

- assigned tasks;
- Deliverable Items;
- reviews;
- approvals;
- Decisions;
- exceptions;
- requests;
- overdue work;
- expiring competence;
- blocked work.

My Work is not an independent data store.

## Runtime acceptance test

For a piece of work NuBlox must be able to answer:

- Why does this work exist?
- Which process/function requires it?
- Which business context does it belong to?
- Who is responsible?
- Is the person/organisation deployed and competent?
- What authority is required?
- What output is required?
- What is the current state/version?
- Who must review or approve it?
- What was issued or transacted?
- Who accepted or verified it?
- What changed?
- What downstream consequences occurred?
- What evidence proves the complete history?
