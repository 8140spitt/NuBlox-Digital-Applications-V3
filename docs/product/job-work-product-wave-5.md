# J1 Work-Product Wave 5 — Enterprise Direction & Growth

**Status:** candidate explicit Work-Product decomposition  
**Date:** 20 September 2026  
**Functions:** F01-F06  
**Jobs:** 55  
**Work Products:** 238

## Why this wave exists

Employment reconciliation answered **who the jobs are**.

Wave 5 begins the next J1 gate: proving **what those employees actually produce**.

This wave covers the enterprise-direction spine:

- F01 Strategy & Enterprise Planning;
- F02 Corporate Governance;
- F03 Enterprise Performance;
- F04 Corporate Development;
- F05 Product, Service & Innovation;
- F06 Marketing & Brand.

Unlike the earlier source-profile baseline, the rows in `priority-job-work-product-wave-5.csv` name concrete professional artefacts and include **exact source Activity IDs**.

## Governing rule

A source activity is not automatically a Work Product.

Activities are grouped into meaningful outputs that a person can create, review, approve, issue, maintain or hand off.

Examples:

```text
Define purpose + vision + mission
  -> Purpose, Vision & Mission Statement

Collect data + calculate metrics + publish dashboard
  -> Performance Observation Dataset
  -> KPI Calculation Run
  -> Performance Dashboard

Structure transaction + negotiate + approve + execute + complete
  -> Transaction Structure Paper
  -> Negotiated Heads of Terms
  -> Transaction Approval Pack
  -> Executed Agreement Set
  -> Transaction Completion Record
```

## Function-head treatment

The six Head-of roles are not modelled as generic “management report” jobs.

Their Work Products represent accountable cross-function outputs such as:

- Enterprise Strategy;
- Corporate Governance Framework;
- Enterprise Performance Framework;
- Corporate Development Pipeline;
- Product / Service Portfolio Strategy;
- Marketing Strategy.

This preserves the distinction between **accountable employment output** and specialist authorship.

## New traceability standard

Wave 5 adds two fields that should become standard for subsequent J1 waves:

- `work_product_family`;
- `exact_activity_ids`.

That creates the trace:

```text
Employment Job
  -> Material Work Product
  -> Work-Product Family
  -> Exact Activities
  -> Candidate canonical objects
  -> Authoring primitive
  -> Evidence
  -> Handoff
```

## Completion impact

Before Wave 5:

```text
95 / 462 candidate jobs had explicit Work-Product treatment
367 remained without explicit decomposition
```

After Wave 5:

```text
150 / 462 candidate jobs have explicit Work-Product treatment
312 remain without explicit decomposition
```

This is **coverage**, not final validation. Wave 5 rows remain candidate-explicit until canonical ownership, lifecycle/effectivity, authority relationships and executable Job Workbench acceptance are completed.

## Important architecture findings

The wave reinforces several already-open model gaps and exposes additional concerns:

1. Board/committee governance needs distinct Meeting, Pack, Minute, Resolution and Action semantics rather than one broad governance object.
2. Strategy / Business Planning currently spans purpose, strategy, annual plans and operating model; these need linked but distinct controlled objects.
3. KPI definitions, observations, period snapshots, variances and benefits are different performance truths.
4. Corporate Development currently overuses Business Case for transaction structure, partnership and divestiture work.
5. Product/Service concept, definition/configuration, offering/item lifecycle and business case need explicit cross-object lineage.
6. Marketing campaign cannot be the canonical owner of every digital channel, content asset, event and communications record.

These should be addressed in canonical-model correction waves rather than hidden inside the Job layer.
