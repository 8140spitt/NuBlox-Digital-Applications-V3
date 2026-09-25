# HCM world-class capability benchmark

Status: governed implementation benchmark  
Benchmark date: 2026-09-25

## Purpose

NuBlox Human Capital Management is the authoritative workforce system for the Tenant. It must meet the enterprise capability baseline represented by SAP SuccessFactors, Workday HCM and Oracle Fusion Cloud HCM, while integrating workforce authority directly with NuBlox Functions, work, deliverables, competence, permissions and management scope.

This document is an implementation acceptance register, not a marketing comparison.

## Canonical workforce chain

```text
Tenant
-> Organisation / legal employer
-> Organisation Unit
-> Job Architecture
   -> Job Family
   -> Job Sub-family
   -> Job Profile
   -> Career Level / Grade
-> Position Establishment
   -> lifecycle / authorised FTE / vacancy
   -> reporting hierarchy
   -> Function participation
   -> competence / authority / access requirements
-> Person
-> Work Relationship / Employment
-> Position Occupancy
-> user working world / management scope / work
```

Person identity, work relationship, Job Profile, Position, Position Occupancy, access Role, Permission, Responsibility and Authority remain separate canonical concepts.

## External enterprise baseline

### SAP SuccessFactors

Current SAP documentation establishes the following baseline:

- Job Profile Builder maintains job profiles with multiple content types, Families, Sub-Families and Roles.
- Talent Intelligence Hub provides a skills/competency architecture associated with job architecture.
- Position Management maintains authorised positions independently from incumbents, supports vacant positions and drives organisational Job Information.
- Job profile changes can participate in governed approval/acknowledgement workflows.

Sources:
- https://help.sap.com/docs/SAP_SUCCESSFACTORS_PLATFORM/70097a1a469d47a0ae08809e4a240f98/172d1e58be474a0ae08809e4a240f98
- https://help.sap.com/docs/successfactors-employee-central/manage-positions-test-script/business-conditions
- https://help.sap.com/doc/b6f183c4949f4d21b02aa6d384eaab0c/2605/en-US/SF_JPB_Admin_EN.pdf

### Workday

Current Workday documentation describes Job Architecture Hub as a central place to manage job architecture, analyse job-profile quality and understand downstream impacts of changes.

Source:
- https://doc.workday.com/admin-guide/en-us/human-capital-management/staffing/job-catalog/job-architecture-hub/setup-considerations--job-architecture-hub.html

### Oracle Fusion Cloud HCM

Current Oracle documentation establishes enterprise workforce structures including departments, organisation/position trees, locations, jobs, positions, grades, grade rates and grade ladders. Grades can constrain and default assignments through Jobs and Positions and connect into compensation and payroll.

Sources:
- https://docs.oracle.com/en/cloud/saas/human-resources/fawhr/overview-of-workforce-structures.html
- https://docs.oracle.com/en/cloud/saas/talent-management/faitm/how-grades-and-grade-rates-work-with-jobs-positions-assignments.html

## NuBlox mandatory HCM capability domains

| Domain | Required capability |
| --- | --- |
| Core people | Person master, contact/demographic data, identifiers, documents, lifecycle, data privacy and audit |
| Work relationships | Multiple concurrent employments/engagements, assignment identity, legal employer, worker type, effective dating, primary/secondary relationship |
| Organisation design | Organisations, legal employers, business units, organisation units, cost centres, locations, organisation trees and reorganisations |
| Job architecture | Families, sub-families, Job Profiles, career tracks, levels, grades, grade ladders, standard titles, descriptions and governed profile content |
| Position management | Independent authorised Positions, planned/approved/frozen/abolished lifecycle, vacancy, single/shared incumbency, FTE/headcount, effective dating, reporting hierarchy and position inheritance |
| Function integration | Position-to-Function participation for FUNCTIONAL_GOVERNANCE and FUNCTIONAL_DELIVERY; Function hierarchy drives the user's NuBlox working world |
| Skills & competence | Skills, competencies, qualifications, licences, certifications, proficiency/rating models, requirements, evidence, expiry and gap analysis |
| Recruiting | Requisitions, position/headcount demand, candidate CRM, applications through /{tenantSlug}/public, screening, interview, offer, pre-employment and hire conversion |
| Onboarding/offboarding | Tasks, evidence, provisioning dependencies, induction, probation, transfer, termination and access consequences |
| Performance & goals | Objectives, cascading goals, continuous feedback, reviews, calibration, development plans and evidence |
| Talent & succession | Talent pools, potential/readiness, critical positions, succession slates, successors, career paths, internal mobility and talent marketplace |
| Learning | Learning catalogue, programmes, assignments, attendance, assessments, CPD, mandatory training and certification renewal |
| Compensation | Salary structures, grades/ranges, variable pay, allowances, review cycles, budgets, approvals, equity/market positioning and compensation history |
| Benefits | Eligibility, programmes/plans, enrolment, dependants, employer/employee contributions and lifecycle events |
| Time & absence | Calendars, working patterns, time capture, overtime, leave plans, accruals, absence cases and approvals |
| Payroll integration | Payroll-relevant master data, effective-dated change events, calculation inputs/outputs, reconciliation and provider interfaces |
| Workforce planning | Establishment, headcount/FTE plan, demand/supply, vacancies, scenarios, capacity, cost forecasts and variance |
| Employee relations | Cases, grievances, disciplinary processes, investigations, accommodations, evidence, decisions and restricted confidentiality |
| Contingent workforce | Contractors/contingent workers, supplier relationship, engagement dates, access, competence and assignment controls |
| Employee/manager self-service | Personal data, team hierarchy, requests, approvals, delegation, My Work and My Team |
| Analytics | Headcount, FTE, turnover, vacancy, span of control, workforce cost, skills gaps, succession, diversity metrics where lawful, trends and drill-through |
| Global/localisation | Country-specific employment attributes, calendars, statutory identifiers, currencies, languages, time zones and configurable localisation |
| Security & evidence | RBAC/ABAC, position scope, management scope, segregation of duties, audit, approvals, decisions, retention and privacy |
| Metadata/extensibility | Database-driven Thing/field/value/relationship definitions, tenant extensions, enumerations, constraints and effective-dated configuration |
| CBE workforce | Professional disciplines, competence cards, licences, CSCS/industry credentials where applicable, project/site assignment, safety-critical role controls and work-product responsibility |

## NuBlox design requirements that go beyond a conventional HCM silo

1. Position authority must resolve directly into NuBlox Function work, not stop at HR master data.
2. A manager's governed management scope must recursively include subordinate Positions without transferring ownership of subordinate records.
3. Job/Position competence requirements must gate safety-critical or regulated work where configured.
4. Recruitment demand must originate from authorised establishment or explicitly approved non-position demand.
5. A vacant Position remains a first-class organisational object and may retain budget, Function participation, competence requirements, authority and recruitment demand.
6. Job architecture changes must expose downstream impact before approval.
7. Effective-dated organisation, Job, Position and work-relationship changes must support future-dated reorganisations without overwriting history.
8. No HCM concept may implicitly grant Permission or Authority merely because it establishes responsibility or employment.
9. HCM events must publish auditable business events/outbox messages for dependent domains.
10. Tenant UI URLs remain slug-based: `/{tenantSlug}/app` and `/{tenantSlug}/public`.

## Implementation gates

A capability is not considered implemented until:

- canonical kernel types and invariants exist;
- persistence and migrations exist;
- command validation protects temporal and tenant integrity;
- read models expose the capability;
- user-facing workflows exist where the capability is operational;
- permission denial is handled without HTTP 500;
- audit and outbox evidence are written for material changes;
- integration tests prove positive and negative business rules;
- migration/import path is defined where external HCM data is expected;
- CI is green except for separately tracked pre-existing failures that are explicitly evidenced.

## Current implementation focus

1. Work Relationship identity and concurrent employment.
2. Position establishment lifecycle and FTE capacity.
3. Job Architecture: Family -> Sub-family -> Job Profile -> Level/Grade.
4. Position inheritance/override and downstream impact analysis.
5. Skills/competence architecture.
6. Recruiting and public candidate journey.
7. Talent, learning, performance and succession.
8. Compensation, benefits, time/absence and payroll integration.
9. Workforce planning/analytics and employee relations.
