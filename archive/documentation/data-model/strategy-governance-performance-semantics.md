# Strategy, Governance & Enterprise Performance Semantics

## Purpose

BOF-02 governs enterprise strategy, plans, KPI/performance semantics and corporate governance while reusing shared decision, authority, controlled-information and evidence foundations.

The core architecture is:

```text
Strategy Framework
    ↓
Theme / Objective
    ↓
Strategic Initiative
    ↓
Business Plan
    ↓
KPI Definition → Target
    ↓
Performance Observation
    ↓
Performance Snapshot
    ↓
Strategic Review
    ↓
Governance Meeting
    ↓
Decision → Decision Action
```

## Strategy

Strategy Framework is the governed strategic architecture, not merely a strategy PDF.

Strategic Objective is the desired outcome.

Strategic Theme is a grouping/prioritisation context.

Strategic Initiative is the strategic intervention. It may later be delivered by a Programme, Project or Transformation Initiative without becoming that delivery object.

## Business planning

Business Plan translates strategy into period-based objectives, initiatives, resource expectations, financial context and measurable targets.

Approved plan versions are retained as comparison points.

Budget, Forecast and ledger remain authoritative in Finance; the Business Plan references them.

## Scenario and assumption

Scenario is a coherent possible future/planning case.

Assumption is an independently governed proposition used by scenarios, plans, business cases and appraisals.

Consumers pin exact assumption versions. Invalidating an assumption does not rewrite historic decisions.

## Enterprise performance

NuBlox separates four layers:

```text
KPI Definition
      ↓
Performance Target
      ↓
Performance Observation
      ↓
Performance Snapshot
```

KPI Definition defines meaning/formula/unit/source.

Target is planned expectation.

Observation is immutable measured evidence.

Snapshot is a calculated/published position over exact observations and targets.

A dashboard is therefore not a second source of performance truth.

## Strategic review

Strategic Review is a governed review occurrence using exact Strategy/Plan/Snapshot/Scenario/Assumption versions.

Findings and recommendations remain review evidence.

Any resulting Decision and Decision Action are separately governed shared objects.

## Governance body and meetings

Governance Body is a stable board/committee/steering-body context with mandate, membership rules, quorum and authority framework.

It is not an Organisation Unit or Team.

Governance Meeting is an occurrence.

Agenda Item is subordinate to the meeting.

Decision is immutable decision evidence.

Decision Action is follow-up business work.

```text
Governance Body
      ↓
Governance Meeting
      ↓
Agenda Item
      ↓
Decision
      ↓
Decision Action
```

## Shared Decision and Action

BOF-02 and BOF-06 converge onto the same enterprise patterns:

```text
BOF-02 Decision ─┐
                 ├→ shared Decision
BOF-06 Decision ─┘

BOF-02 Action ───┐
                 ├→ shared Decision Action
BOF-06 Action ───┘
```

Meeting minutes do not substitute for structured decision evidence.

Workflow Work Items can coordinate an Action but do not become the Action.

## Policy

Policy is a controlled Information Container profile.

Information Container owns identity, revisions, approvals, issued representations and supersession.

Structured configuration may implement a policy rule, but that configuration does not replace the approved policy record.

## Authority framework

Authority Framework defines:

- authority/decision classes;
- approval rules;
- monetary and non-monetary limits;
- reserved matters;
- delegation/subdelegation rules;
- escalation;
- segregation of duties;
- effectivity.

It is separate from Delegated Authority, which is a specific effective grant to a Party.

It is also separate from permission, role and assignment.

## Governance record

Governance Record is a controlled Information Container profile for approved minutes, resolutions, packs or governance memoranda.

Structured Meeting, Decision and Action records remain authoritative even when also represented in minutes.

Formal-record status is applied through records-management Record Declaration where required.

## Non-negotiable rules

1. Strategy Framework, Objective, Theme, Initiative and Plan remain distinct.
2. Strategic Initiative is not automatically a Programme or Project.
3. Scenario and Assumption are planning context, not observed truth.
4. KPI Definition, Target, Observation and Snapshot are separate semantic layers.
5. Published snapshots are reproducible from retained source observations.
6. Strategic Review is not Decision.
7. Governance Body is not Organisation Unit/Team.
8. Meeting, Agenda Item, Decision and Action remain separate.
9. BOF-02/BOF-06 Decision and Action converge on shared enterprise patterns.
10. Policy and Governance Record reuse Information Container.
11. Authority Framework is not Delegated Authority, permission, role or assignment.
12. Material decisions retain exact subject/version, actor/body, authority basis and timestamp.
