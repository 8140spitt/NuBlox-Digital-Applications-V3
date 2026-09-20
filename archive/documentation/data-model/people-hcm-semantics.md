# People, HCM, Competence, Time, Payroll & Expenses Semantics

## Purpose

BOF-18 governs the people and workforce object model while preserving the canonical Party/Person identity already established in the foundation.

The governing identity chain is:

```text
Person
  ↓
Worker Relationship
  ↓
Position assignment
  ↓
Position
  ↓
Job Profile
```

Recruitment, competence, learning, time, payroll and expenses all reference that same Person.

The central rule is:

> Candidate, employee, contractor, learner, manager, timesheet submitter and expense claimant are contexts around one Person identity, not separate people masters.

## Person and Worker Relationship

Person is the canonical human identity.

Worker Relationship represents the effective legal/operational relationship with an employing or engaging Organisation/Legal Entity.

Employment and contingent/contractor engagement are Worker Relationship types.

A Person can therefore have:

- more than one historical employment;
- re-employment after leaving;
- concurrent relationships where lawful/required;
- a candidate history before employment;
- learning and credential history that survives employment changes.

Ending employment never deletes or recreates the Person.

## Position, Job Profile and Role

These concepts must remain separate:

```text
Person
  └─ occupies → Position
                  └─ defined by → Job Profile

Role Assignment
  = contextual business role/responsibility/permission context
  ≠ Position
  ≠ Job Profile
  ≠ job title
```

Position is an organisational seat/capacity and can exist while vacant.

Job Profile is a reusable controlled definition of employable work, family, grade/level, responsibilities, capability requirements and expected Work Products.

A Job Profile may compose Functional Roles from several enterprise functions. NuBlox must not force a real employment job to remain inside one F01-F29 function simply because a Functional Role has a primary functional home.

Examples include Quantity Surveyor, Architect, Construction Manager, Building Surveyor and Facilities Manager: each may perform governed activities across multiple functions while retaining one Job Profile/Position identity.

The Job Profile therefore defines **expected work**, not authority. Permission, scope, responsibility assignment and delegated authority remain separately governed.

See `docs/evidence/product-analysis/job-to-work-product-architecture.md`.

Reporting Relationship is an effective organisational relationship. It does not grant approval authority or system permissions.

## Competence architecture

NuBlox separates definition, evidence and current attainment:

```text
Skill Definition
Competence Definition
        ↓
Person Competence
        ↑
Credential / Learning / Assessment evidence
```

Person Competence records the assessed level, assessor, evidence and validity period.

Training attendance does not automatically prove competence.

### Credentials

Qualification, Licence, Card and Certification share a **Person Credential** identity pattern.

Credential type preserves specialist rules such as:

- issuing body;
- jurisdiction;
- class/category;
- credential/reference number;
- verification;
- issue date;
- expiry;
- suspension/revocation;
- renewal/recertification;
- evidence.

One credential model avoids four parallel person-qualification databases while retaining type-specific governance.

## Learning and CPD

```text
Training Course
      ↓
Training Session
      ↓
Learning Record
      ↓
may evidence Person Competence
```

Training Course is reusable controlled content.

Training Session is a scheduled occurrence.

Learning Record is actual person evidence.

CPD records and commissioning/handover training evidence reuse Learning Record semantics.

## Workforce planning and allocation

Workforce Plan models future demand/supply and capability/capacity.

Workforce Allocation is an effective allocation of worker capacity to an organisational/project/team/location/shift context.

It is explicitly distinct from:

- Finance Settlement Allocation;
- Project-controls Resource Allocation;
- Responsibility Assignment;
- Position occupancy.

These structures can be mapped where the business meaning overlaps, but identity is not silently reused.

## Availability, shifts and work patterns

Worker Availability is a **projection**, not a mutable field.

It is derived from, among other things:

```text
Work Pattern
+ published Shift
- approved Leave
- actual/planned Absence
- Workforce Allocations
- restrictions
= Worker Availability
```

This allows scheduling and field/service operations to consume availability without becoming the authority for employment/time truth.

## Attendance, time and timesheets

NuBlox separates three layers:

```text
Attendance Record
    observed presence evidence

Time Entry
    declared/classified work time

Timesheet
    controlled period submission/approval envelope
```

Clock data is not automatically payable time.

Time Entry is not automatically attendance.

Approved time corrections preserve the original record and adjustment history.

Project, WBS, activity and cost dimensions are references to canonical business objects/classifications rather than HCM-owned copies.

## Leave and absence

Leave Request is the planned/requested record and decision.

Absence Record is the actual period of absence.

```text
Leave Request → approval
      ↓
availability/planning effect
      ↓
actual Absence Record where applicable
```

The two remain linked but distinct.

## Compensation and payroll

Compensation Arrangement stores effective worker terms such as salary/rate basis, currency, frequency and applicable Pay Elements.

Pay Element is governed calculation/configuration.

```text
Worker Relationship
      ↓
Compensation Arrangement
      ↓
Payroll Run
      ↓
Payroll Result
      ↓
Finance Journal / Payment
```

Payroll Result is immutable worker/pay-period evidence of earnings, deductions, tax, employer costs and net pay.

Corrections use adjustment/reversal/successor results.

Finance receives financial consequences; Finance does not become the payroll or worker master.

### Payslip

Payslip is controlled information generated from Payroll Result.

It therefore uses the canonical Information Container/revision/representation architecture.

A PDF payslip is a representation of controlled information, not payroll calculation truth.

## Expenses

Expense Claim is a governed worker claim containing lines, receipts/evidence, policy validation, approval and settlement provenance.

Expense Claim is distinct from:

- Finance Payment;
- Ledger Entry;
- bank evidence.

Approval and settlement remain independently auditable.

## Recruitment

```text
Position / workforce need
      ↓
Vacancy
      ↓
Person
      ↓
Job Application
      ↓
Employment Offer
      ↓
Worker Relationship
      ↓
Worker Onboarding Case
```

Candidate is a recruitment context of Person.

NuBlox does not maintain a second Candidate identity that later has to be merged into an Employee identity.

Employment Offer is not Worker Relationship. Accepted offer triggers explicit relationship creation.

## Performance, learning and employee relations

Performance Review is attributable review evidence, not Person identity or a permission decision.

Learning Plan is prospective development planning; Learning Record is actual evidence.

Employee Relations Case is a restricted-governance case with explicit access, audit, evidence and retention controls.

## Offboarding

Worker Offboarding Case coordinates:

- end-of-engagement actions;
- access removal requests;
- equipment/property return;
- knowledge transfer;
- final time/pay/expenses;
- legal/document obligations.

Offboarding does not delete Person, historical assignments, decisions, project responsibility or audit evidence.

Actual access/authority revocation occurs through the authoritative identity/authority controls.

## Non-negotiable rules

1. One Person identity survives every recruitment, employment, engagement and offboarding event.
2. Employment/engagement are Worker Relationships, not Person states.
3. Position, Job Profile and Role Assignment are distinct concepts.
4. Position occupancy, reporting and allocation history is effective-dated.
5. Skills/competence definitions are separate from Person attainment.
6. Training completion is evidence, not automatic competence.
7. Qualification/Licence/Card/Certification use one typed credential pattern.
8. Availability is derived, never independently editable truth.
9. Attendance, Time Entry and Timesheet remain distinct.
10. Leave Request and actual Absence remain distinct.
11. Compensation terms/configuration remain separate from Payroll Result.
12. Payroll Results are immutable evidence; corrections are explicit.
13. Payslips are controlled information representations of payroll results.
14. Candidate is a Person context, not a duplicate person master.
15. Onboarding/offboarding workflows never substitute for identity, permission or delegated-authority decisions.
16. Sensitive people/payroll/ER evidence requires scoped access, audit and retention governance.
