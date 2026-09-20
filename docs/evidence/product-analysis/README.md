# Product Analysis & Traceability Evidence

> **This directory is not the NuBlox product manual.**
>
> Start with the [NuBlox Product Handbook](../handbook/README.md).

This folder preserves product-discovery evidence used to establish the NuBlox Construction & The Built Environment model.

It contains:

- employment/job reconciliation evidence;
- construction-career and work-product baselines;
- Work-Product decomposition waves;
- architecture-gap registers;
- traceability registers;
- stakeholder review material;
- the original V3 product charter.

These files are retained because they explain **why** product decisions were made and allow future checks against source evidence.

They should not be used as the normal route for understanding how NuBlox works.

## Authoritative product documentation

Use:

- [Product Handbook](../handbook/README.md)
- [Product & Enterprise Model](../handbook/01-product-and-enterprise-model.md)
- [People, Jobs & Work](../handbook/02-people-jobs-and-work.md)
- [Operate the Business](../handbook/03-operate-the-business.md)
- [Deliver the Business](../handbook/04-deliver-the-business.md)
- [Enterprise Data & Information](../handbook/05-enterprise-data-and-information.md)
- [Workflow, Authority, Evidence & Experience](../handbook/06-workflow-authority-evidence-and-experience.md)
- [System Architecture](../handbook/07-system-architecture.md)
- [Product State & Roadmap](../handbook/08-product-state-and-roadmap.md)
- [Glossary](../handbook/09-glossary.md)

## Principal evidence registers

The most useful retained evidence is:

- `employment-job-catalogue.csv` — candidate employment-job catalogue;
- `employment-job-validation-register.csv` — job validation backlog;
- `job-profile-reconciliation-architecture-gap-register.csv` — architecture/model gaps exposed by job analysis;
- `job-profile-work-product-coverage-register.csv` — source job/work-product coverage;
- `priority-job-work-product-wave-1.csv` through `priority-job-work-product-wave-10.csv` — Work-Product decomposition evidence;
- `construction-career-work-product-baseline.csv` — external construction/built-environment career baseline.

## Documentation rule

Do not create another discovery/reconciliation wave simply because implementation raises a question.

From this point:

1. update the Handbook when product meaning changes;
2. record a focused ADR when an architectural decision changes;
3. update system/user/admin documentation when runtime behaviour changes;
4. add evidence/register rows only when traceability genuinely requires them.

The discovery programme is retained as evidence; it is no longer the primary product-development loop.
