# 02 — People, Jobs & Work

## The employment model

NuBlox separates the person from the work structure of the organisation.

```text
Person
  -> Worker Relationship
  -> Position Assignment
  -> Position
  -> Job Profile
  -> Functional Roles
  -> Activities
  -> Work Products
```

### Person

The human identity.

### Worker Relationship

The effective employment, worker, contractor or comparable engagement relationship between the Person and an Organisation.

### Job Profile

A reusable description of a type of employment, for example:

- Quantity Surveyor;
- Project Manager;
- Design Manager;
- Safety Inspector;
- Accounts Payable Specialist;
- Asset Manager.

The Job Profile describes the professional accountability expected of the job.

### Position

A tenant-specific funded/approved organisational seat.

Examples:

- Senior Quantity Surveyor — Project Alpha;
- Regional H&S Manager — Scotland;
- Finance Manager — Infrastructure Division.

A Position may combine responsibilities from more than one reusable Job Profile or Functional Role where organisational design requires it.

### Position Assignment

The effective-dated relationship showing which Person occupies which Position.

## Job Workbench

The Job Workbench answers:

> **What work should this person expect to perform because of the job they occupy?**

It combines:

```text
Job Profile work-product catalogue
+ Position responsibilities
+ organisation/project/contract/asset context
+ actual assignments in My Work
+ actual permissions and scopes
+ delegated authority
+ lifecycle/process state
= Job Workbench
```

The Job Workbench is not another system of record. It is a role-aware composition of canonical work.

## My Work

My Work answers:

> **What needs my attention now?**

It includes, where authorised:

- assigned work items;
- eligible queue work;
- reviews;
- approvals;
- decisions;
- exceptions;
- overdue actions;
- inspections;
- cases;
- requests;
- handoffs.

My Work is driven by runtime responsibility and workflow, not by static menu access.

## Work products

A Work Product is a material output of professional activity.

Examples:

- Cost Plan;
- Project Schedule;
- Risk Assessment;
- Inspection Record;
- Contract;
- Purchase Order;
- Board Pack;
- Financial Statement;
- DPIA;
- Permit to Work;
- Handover Pack.

Activities describe what people do. Work Products describe the governed outputs that the organisation needs.

## Responsibility

A Work Product may involve several distinct responsibilities:

```text
Accountable Position
Author
Contributor
Reviewer
Decision Authority
Recipient / downstream owner
```

These relationships must not be collapsed into a generic 'owner' field.

## Security and authority

Employment and security remain separate.

A person's Job Profile may explain why they normally participate in an activity, but it does not itself grant permission or approval authority.

Runtime authorisation may consider:

- authenticated identity;
- tenant;
- membership;
- access role;
- permission;
- organisation scope;
- project/resource scope;
- record state;
- delegated authority;
- approval thresholds;
- segregation-of-duties rules.

## Example — Quantity Surveyor

A Quantity Surveyor Position may expect work such as:

```text
Prepare cost plan
Assess tender returns
Maintain cost report
Assess change
Value work
Assess payment
Update forecast
Prepare final account
```

Those outputs are surfaced through the Job Workbench and project/commercial context. The Quantity Surveyor sees the same canonical Project, Contract, WBS, Change and Payment records as other authorised functions, but through a commercial perspective.

## Example — Safety Inspector

A Safety Inspector may receive:

```text
Inspection assignment
  -> inspection plan / checklist
  -> site and work-area context
  -> perform inspection
  -> capture evidence
  -> record findings
  -> raise corrective actions
  -> verify closure
```

The Inspection, Finding, Evidence and Corrective Action are governed records, not text embedded in an arbitrary form.
