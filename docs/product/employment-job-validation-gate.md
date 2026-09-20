# J1 Employment Job Validation Gate

**Status:** governing validation backlog  
**Date:** 20 September 2026  
**Register:** `employment-job-validation-register.csv`

## Coverage position

Candidate Work-Product coverage is complete:

```text
Employment jobs                                  462
Jobs with Work-Product treatment                 462
Candidate / explicit Work Products             2,415
Jobs with stronger exact-activity trace          367
Legacy Waves 1-4 jobs needing activity uplift     95
```

## Why J1 remains open

Coverage answers:

> Does every employment job have a candidate set of material Work Products?

Validation must answer:

> Can NuBlox actually let a Position-holder create, review, approve, issue, maintain, hand off and evidence those Work Products using the correct canonical business truth and authority?

A job is **not J1-validated** until all of the following are resolved.

### 1. Exact activity trace

Every Work Product must map to exact enterprise Activities, not only a function/sub-function label.

### 2. Canonical ownership

Every Work Product must identify the authoritative aggregate/object.

A document representation must not become a shadow master for a canonical business object.

### 3. Lifecycle / version / effectivity

The product needs explicit creation, review, approval, effective-date, revision, supersession, retirement/closure and immutable evidence semantics appropriate to the object.

### 4. Professional responsibility model

For each Work Product:

```text
Accountable Position
Author
Contributor
Reviewer
Decision authority
Recipient / downstream owner
```

These are not automatically the same person.

### 5. Authority and security

```text
Job Profile != Access Role != Permission != Delegated Authority
```

A role cannot approve, post, pay, contract, grant access, certify or dispose merely because the job normally participates in that work.

### 6. Authoring primitive

The intended NuBlox experience must be confirmed:

- Object Workspace;
- Enterprise Grid;
- Structure Browser;
- Calculation Workbench;
- Controlled Document Editor;
- Case / Assessment Workspace;
- Inspection / Test Workbench;
- Change Workspace;
- Decision / Approval;
- Transaction Workspace;
- Execution Record;
- Report / Snapshot;
- Handover / Closeout Package;
- field/mobile experience where required.

### 7. Handoffs

Upstream inputs and downstream consequences must be explicit and testable.

### 8. Position-level Job Workbench

The runtime Job Workbench must compose expected work with:

- Position responsibilities;
- actual scopes;
- actual permissions;
- delegated authority;
- lifecycle/process state;
- My Work / assignments;
- required evidence.

### 9. Executable role acceptance

A representative Position-holder must be able to execute realistic end-to-end scenarios for the job.

## Validation sequencing

### Gate A — legacy uplift

Upgrade the 95 Waves 1-4 jobs to the exact-activity / Work-Product-family standard used by Waves 5-10.

### Gate B — canonical and lifecycle validation

Resolve the architecture-gap register and pin Work Products to canonical aggregates, lifecycle, version/effectivity and evidence rules.

### Gate C — responsibility and authority

Define accountable/author/contributor/reviewer/decision relationships and enforce delegated authority/SoD independently from Job Profile.

### Gate D — Job Workbench / role acceptance

Implement composition and execute role scenarios.

Only after these gates can J1 be declared product-validated.
