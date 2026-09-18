# Organisation Change, Transformation & Continuous Improvement Semantics

## Purpose

BOF-26 governs transformation, organisational readiness/adoption and enterprise process improvement while reusing Portfolio, Strategy, PPM, HCM, Communications, Decision/Action, controlled-information and Compliance foundations.

## Transformation architecture

```text
Portfolio
   ↓
Transformation Initiative
   ↓
Change Impact Assessment
   ↓
Readiness / Learning / Communications / Adoption
   ↓
Organisation Transition
```

Transformation Portfolio reuses shared Portfolio.

Transformation Initiative is a distinct change/transformation identity. It may implement a Strategic Initiative and be delivered by a Programme or Project, but those identities remain separate.

Improvement Initiative uses the same initiative pattern with improvement type/scale.

## Impact and stakeholders

Change Impact Assessment is dated evidence against exact current/target scope.

Stakeholder Cohort is a grouping/relationship over canonical Parties, roles or organisation populations. It never creates duplicate Person or Organisation masters.

## Change actions and communications

Change Action reuses shared Decision Action.

Change Communication reuses shared Communication Item.

Message content remains controlled Information Container content.

## Readiness and learning

Readiness Plan coordinates readiness outcomes, actions, communications, learning and acceptance criteria.

Readiness Assessment is separate evidence.

Change Learning Plan is transformation-scoped learning rollout planning.

It does not replace:

- HCM Learning Plan;
- Training Course;
- Training Session;
- Learning Record.

Actual learning/completion remains HCM evidence.

## Organisation transition

Organisation Transition coordinates effective movement from current to target operating state.

It does not recreate Organisation Units, Positions or People. Actual structural changes occur through the authoritative effective-dated organisation/HCM relationships.

## Process architecture

```text
Process Architecture
       ↓
Enterprise Process
       ↓
Process Model
       ↓
Process Version
```

Enterprise Process is the stable identity.

Process Model describes how the process operates.

Process Version is the approved/effective controlled version.

Workflow automation may implement part of a process but does not become the Enterprise Process identity.

## Process ownership and measurement

Process Owner Assignment reuses Responsibility Assignment.

Process Measure reuses enterprise KPI/metric-definition semantics.

Targets, observations and dashboards remain separate from the measure definition.

## Analysis and improvement

```text
Process Version
      ↓
Process Analysis
      ↓
Improvement Opportunity
      ↓
Process Redesign Proposal
      ↓
Decision
      ↓
successor Process Version
      ↓
Transformation / Improvement Initiative
```

Analysis is evidence.

Improvement Opportunity is a case.

Redesign Proposal is a proposal.

Approved redesign creates successor governed process versions; prior versions remain immutable.

## SOP and compliance

Standard Operating Procedure reuses Information Container identity/revision semantics.

Process Compliance Assessment reuses shared Compliance Assessment evidence against exact Process Version, requirements and controls.

## Non-negotiable rules

1. Transformation Portfolio reuses Portfolio.
2. Transformation Initiative is distinct from Strategic Initiative, Programme and Project.
3. Improvement Initiative uses the Transformation Initiative pattern.
4. Change Impact and Readiness Assessments are evidence.
5. Stakeholder Cohort never duplicates Party identity.
6. Change Action and Communication reuse shared enterprise patterns.
7. Change Learning Plan coordinates HCM learning rather than replacing it.
8. Organisation Transition never recreates organisation/person identities.
9. Enterprise Process, Process Model and Process Version remain separate.
10. Approved Process Versions are immutable.
11. Process Owner Assignment reuses Responsibility Assignment.
12. Process Measure reuses enterprise KPI/metric-definition semantics.
13. SOP reuses Information Container.
14. Process Compliance Assessment reuses Compliance Assessment.
15. The F29 workspace governs process architecture/improvement without owning duplicate transactional truth.