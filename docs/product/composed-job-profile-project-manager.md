# Composed Employment Job Profile — Project Manager

**Status:** J1 candidate composed employment profile  
**Date:** 20 September 2026  
**Employment archetype:** `JOB-PM`  
**Supersedes as standalone Job Profiles:** `JP-F27.04-PROFESSIONAL`, `JP-F27.06-PROFESSIONAL`, `JP-F27.08-PROFESSIONAL`  
**Retains:** their Functional Role and activity provenance  
**Work-Product map:** `job-profile-activity-map-project-manager.csv`

## Decision

The inherited source model created three separate Job Profiles all titled **Project Manager**:

- F27.04 Project Initiation;
- F27.06 Project Execution;
- F27.08 Project Closure.

These are not three employment jobs.

They are lifecycle slices of one reusable Project Manager employment profile.

V3 therefore composes them into one Job Profile while preserving their Functional Roles and source activities.

```text
Project Manager
  -> Project Initiation Functional Role
  -> Project Planning/accountability interfaces
  -> Project Execution Functional Role
  -> Project Control/accountability interfaces
  -> Resource Management interfaces
  -> Project Closure Functional Role
```

The Job Profile does not automatically grant any permissions or delegated authority.

## Purpose

Accountably establish, plan, coordinate, control and close a project so that approved scope and outcomes are delivered through governed resources, information, cost, schedule, risk, decisions and evidence.

## Core accountabilities

1. establish project scope, objectives, sponsorship and stakeholder context;
2. establish the project governance and management basis;
3. ensure scope is decomposed into a governed delivery structure;
4. ensure schedule, budget and resource plans are established;
5. coordinate authorised execution and delivery;
6. maintain visibility of progress, risk, issues, decisions and actions;
7. ensure changes are assessed and governed before implementation;
8. maintain a current project forecast and status position;
9. secure required decisions and escalations under the correct authority;
10. obtain acceptance and complete controlled project closeout.

## Material Work Products

| Work Product | PM relationship | Exact activity state |
| --- | --- | --- |
| Project Charter / Initiation Record | accountable | mapped |
| Stakeholder / Responsibility Plan | accountable | partial |
| Project Management Plan | accountable | composite mapped |
| Work Breakdown Structure | accountable; may delegate authoring | **activity gap** |
| Project Schedule | accountable; planner may author | mapped |
| Project Budget | accountable; controls/finance may author | mapped |
| Resource Plan | accountable; resource functions may fulfil | mapped |
| Risk / Issue / Decision / Action Register | accountable | partial |
| Project Change Control | accountable | **activity gap** |
| Progress / Status Report | accountable | **activity gap** |
| Project Forecast | accountable | **activity gap** |
| Meeting / Decision Record | accountable for project governance | **activity gap** |
| Project Acceptance / Closure Pack | accountable | mapped |

## Important employment-model consequence

A Project Manager being accountable for a Work Product does not mean they are always its specialist author.

Examples:

- Project Planner may author the detailed schedule;
- Project Controls Manager may maintain cost/schedule control and forecast calculations;
- Finance may own ledger/budget posting truth;
- resource managers may perform allocation;
- contract/commercial specialists may own contractual change consequences.

The Job Workbench must therefore distinguish:

```text
Expected Work Product
  -> accountable Position
  -> author/contributor
  -> reviewer
  -> decision authority
  -> actual permissions/scopes
```

This is materially safer than deriving permissions from the Job Profile.

## Activity-taxonomy findings

Exact Work-Product tracing identified several gaps in the existing enterprise activity catalogue.

### GAP-PM-001 — Work Breakdown Structure

`AGG-06-WBS` exists as a secondary aggregate to F27.05 Project Planning, but no explicit activity creates, structures, baselines or changes a WBS.

### GAP-PM-002 — Project Change Control

F27.07.A01 “Manage scope” is insufficient to represent a governed Project Change lifecycle:

```text
Request -> impact -> option -> decision -> implementation -> verification
```

### GAP-PM-003 — Project Status Reporting

F27.06.A03 monitors progress, but no Project activity explicitly creates and issues a controlled period/status snapshot.

### GAP-PM-004 — Project Forecast

Project-control activities provide budget, schedule and risk inputs but no explicit project-forecast activity/version lifecycle exists.

### GAP-PM-005 — Project Governance Meeting / Decision

F02 Board and Committee Governance cannot be reused as a semantic substitute for routine Project governance meetings and decisions.

## Reconciliation result

```text
JP-F27.04-PROFESSIONAL  -> source Functional Role provenance
JP-F27.06-PROFESSIONAL  -> source Functional Role provenance
JP-F27.08-PROFESSIONAL  -> source Functional Role provenance
                           |
                           v
                    JOB-PM Project Manager
```

The three inherited source Job Profiles are therefore **superseded as standalone employment profiles**, not deleted as provenance.

## Next J1 actions

1. add/validate the missing project activities above;
2. pin each Work Product to exact canonical aggregate ownership;
3. define lifecycle/version semantics;
4. define accountable/author/reviewer/decision-authority relationships;
5. assign a governed V3 Job Profile identity once the Job Profile master schema is implemented;
6. create the Position-level Project Manager Job Workbench contract;
7. build the end-to-end Project Manager acceptance scenario.
