# Functional Governance and Functional Delivery

**Status:** Governing operating model  
**Effective:** 25 September 2026  
**Supersedes:** deployment-first wording in earlier architecture where it conflicts with ADR-0006 and the HCM Position authority spine.

## Purpose

Every NuBlox Function has two operating sides:

- **FUNCTIONAL_GOVERNANCE** — how the Function is defined, controlled, assured, resourced and improved.
- **FUNCTIONAL_DELIVERY** — the work the Function performs and the business or professional outcomes it produces.

Function is universal. This applies to F01–F29 Core Business Functions and to D01–D16 CBE Functions.

## Primary Human Capital authority chain

The ordinary user's NuBlox working world is resolved through Human Capital:

~~~text
Person
-> Employment
-> occupied Position
-> Position-to-Function assignment
   -> FUNCTIONAL_GOVERNANCE
   or
   -> FUNCTIONAL_DELIVERY
-> Position reporting hierarchy / management scope
~~~

This is the primary organisational operating model.

A separate deployment object is **not required merely to establish the user's Function world**.

The Position-to-Function assignment is effective-dated and may identify a primary Function. HCM remains authoritative for Organisation, Organisation Unit, Position, Job Profile, occupancy and reporting relationships.

## What the Function assignment means

The assignment answers:

- which Function the Position operates in;
- whether the Position performs Governance or Delivery;
- when the assignment is effective;
- whether it is primary for the Position.

It does **not** by itself grant:

- Permission;
- responsibility for every object in the Function;
- approval or commercial Authority;
- competence;
- unrestricted tenant visibility.

Those remain separate governed concepts.

## Functional Governance

Functional Governance controls the capability itself.

Typical work includes:

- mandate and ownership;
- policy and standards;
- process architecture;
- methods and templates;
- controlled classifications and metadata;
- competence standards;
- authority thresholds;
- segregation of duties;
- lifecycle/workflow rules;
- assurance and audit;
- KPIs/KRIs;
- retention;
- improvement and governed change.

Governance produces real governed work products and Decisions. It is not merely configuration text.

## Functional Delivery

Functional Delivery performs the capability.

Depending on the Function this may include:

- transactions;
- planning;
- calculation and analysis;
- professional authoring;
- sales and commercial work;
- procurement;
- accounting;
- design;
- field/site work;
- inspection and test;
- service delivery;
- review and Decision;
- physical execution;
- work products and Deliverables;
- cross-Function handoffs.

Examples:

- F07 Sales Delivery owns customer relationship, opportunity, pipeline, bid/proposal and sales execution capability.
- F14 Finance Delivery performs journals, billing, payments, reconciliation, close and reporting.
- D01 Architecture Delivery performs briefing, design, drawings, models, schedules, specifications, coordination and technical review.

## Position hierarchy and management waterfall

Reporting lines are relationships between Positions.

A manager's authorised operational view resolves from:

~~~text
manager Position
-> own authorised scope
+ direct subordinate Positions
+ deeper subordinate Positions
-> Function work / objects / performance
~~~

The hierarchy is recursive.

The manager does not become the owner of subordinate records. Ownership remains with the relevant Position or Person; the hierarchy provides management scope subject to Permission, information classification, object scope and other controls.

This is the governing rule behind dashboards such as Sales pipeline roll-up.

## Contextual work

Function establishes **what capability the Position performs**.

Context establishes **where, for whom or against what subject particular work is performed**.

Examples include:

- Project;
- Programme;
- Contract;
- Appointment;
- Package;
- Site;
- Facility;
- Asset;
- Product;
- Service;
- Opportunity.

A contextual assignment may be used where responsibility, capacity, dates or scope need explicit governance.

For example:

~~~text
Person: Jane Smith
Position: Senior Architect
Primary Function: D01 Architecture
Purpose: FUNCTIONAL_DELIVERY

Contextual work:
  Project Alpha
  -> Design Package A
  -> responsible architect
  -> assigned drawings / models / specifications
~~~

The Project does not redefine Jane's Function.

## Job Profile relationship

A Job Profile describes reusable expectations for the work a Position may perform.

It may define:

- responsibilities;
- competence;
- qualifications;
- typical activities;
- work products;
- assurance responsibilities;
- native tool requirements.

A Position may reference a Job Profile. A Person occupies the Position.

Job Profile is therefore distinct from Person, Position, Function, Permission and Authority.

## CBE operating model

ADR-0006 makes D01–D16 CBE-classified Functions rather than a competing canonical Domain type.

The same chain therefore applies to a Sales Executive and an Architect:

~~~text
Sales Executive
Person -> Position -> F07 -> FUNCTIONAL_DELIVERY

Architect
Person -> Position -> D01 -> FUNCTIONAL_DELIVERY
~~~

The CBE Industry Solution supplies the D01–D16 Function definitions, 84 Job Profiles, specialist work-product types, tools, controls and configuration.

Legacy Delivery Domain records may remain as compatibility/industry-composition projections but do not define a second user authority model.

## Cross-Function interaction

The user's primary Function world does not isolate them from the rest of the enterprise.

Cross-Function interaction occurs through:

- shared authoritative business objects;
- Work and assignments;
- reviews and Decisions;
- process handoffs;
- Projects / Contracts / Assets / other Contexts;
- My Work;
- explicit permissions and responsibilities.

A Sales user should not see every Finance or Procurement screen by default. They see the Finance or Procurement interaction required by the business object or process they are participating in.

## Relationship to Permission, Responsibility, Authority and Competence

These concepts are deliberately separate:

- **Function assignment** — what organisational capability the Position operates in and on which side.
- **Responsibility** — what the Person/Position is accountable or responsible for.
- **Permission** — what actions/data the principal may access.
- **Authority** — what the principal may approve, decide or commit.
- **Competence** — whether the principal is qualified/capable for governed work.
- **Contextual assignment** — where or against what subject responsibility is being exercised.

No one concept silently grants the others.

## User experience rule

After login, NuBlox resolves the occupied Position and primary Function assignment.

The ordinary user's primary destination is **My Function**.

That workspace composes:

- relevant Function tools;
- current work;
- business objects and transactions;
- work products / Deliverables;
- reviews and Decisions;
- exceptions;
- performance;
- records and evidence;
- only the cross-Function interactions required by their work.

If the Position manages other Positions, **My Team** adds subordinate work/performance roll-up.

**My Work** remains the cross-Function attention surface.

## Invariants

1. Function is the universal organisational capability concept.
2. Core Business and CBE are Function families, not competing capability entity types.
3. Person != Position != Job Profile != Function.
4. Position-to-Function assignment establishes Governance or Delivery purpose.
5. A separate Deployment is not mandatory for primary Function membership.
6. Context qualifies work; it does not replace the Function/Position authority chain.
7. Employment or Function assignment does not itself grant Permission or Authority.
8. Reporting hierarchy provides recursive management scope without changing record ownership.
9. Cross-Function work uses shared objects and explicit handoffs rather than duplicate masters.
10. HCM is authoritative for the workforce chain that resolves the user's primary NuBlox world.
