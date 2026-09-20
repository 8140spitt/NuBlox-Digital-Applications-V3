# F27 Job Profile Reconciliation — Portfolio, Programme & Project Management

**Status:** employment-model reconciliation complete  
**Date:** 20 September 2026  
**Function:** F27 Portfolio, Programme & Project Management

## Result

The inherited F27 source catalogue contains one function lead and ten professional source profiles.

V3 reconciles these into:

```text
Leadership:
- Head of Portfolio, Programme & Project Management

Professional employment jobs:
- Portfolio Manager
- Investment Governance Manager
- Programme Manager
- Project Manager
- Project Planner
- Project Controls Manager
- PMO Manager
- Portfolio Resource Manager
```

The three source profiles titled Project Manager are not retained as separate jobs:

```text
F27.04 Project Initiation  \
F27.06 Project Execution   >  JOB-PM Project Manager
F27.08 Project Closure    /
```

Their Functional Roles and exact activity provenance remain available to the composed employment profile.

## Reconciliation table

| Source profile | Treatment |
| --- | --- |
| JP-F27-FUNCTION-LEAD | retain Head of Portfolio, Programme & Project Management |
| JP-F27.01-PROFESSIONAL | retain Portfolio Manager |
| JP-F27.02-PROFESSIONAL | retain Investment Governance Manager |
| JP-F27.03-PROFESSIONAL | retain Programme Manager |
| JP-F27.04-PROFESSIONAL | supersede standalone profile; compose into Project Manager |
| JP-F27.05-PROFESSIONAL | retain Project Planner |
| JP-F27.06-PROFESSIONAL | supersede standalone profile; compose into Project Manager |
| JP-F27.07-PROFESSIONAL | retain Project Controls Manager |
| JP-F27.08-PROFESSIONAL | supersede standalone profile; compose into Project Manager |
| JP-F27.09-PROFESSIONAL | retain PMO Manager |
| JP-F27.10-PROFESSIONAL | retain Portfolio Resource Manager |

## Important design consequence

The function taxonomy remains the source of enterprise-work truth, but the employment model is not forced into one sub-function per job.

For example, Project Manager accountability crosses initiation, planning, execution, control, resource interfaces and closure while specialist Job Profiles such as Project Planner and Project Controls Manager remain independently employable.

## Activity gaps exposed

The composed Project Manager trace identified six activity/semantic gaps:

1. explicit WBS create/structure/baseline/change activity;
2. explicit Project Change lifecycle;
3. controlled Project Status Report / period snapshot activity;
4. versioned Project Forecast activity;
5. project-governance meeting/decision activity distinct from Board/Committee governance;
6. explicit Schedule Baseline approval/version/effectivity semantics.

These are recorded in `job-work-product-activity-gap-register.csv`.

## Next F27 work

Employment reconciliation is complete, but product definition is not.

Each retained F27 Job Profile must now receive:

- explicit Work Products;
- exact activity mappings;
- canonical aggregate/object mappings;
- lifecycle/version semantics;
- accountable/author/reviewer/decision-authority relationships;
- Position-level Job Workbench composition;
- role acceptance scenarios.
