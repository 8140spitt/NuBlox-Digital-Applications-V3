# Market Tool Acronym Reconciliation

**Status:** Controlled reference-evidence reconciliation  
**Effective:** 26 September 2026  
**Source basis:** `NuBlox Master Acronym Register — CSV-Ready` supplied for the market-tool evidence programme

## Purpose

This note governs how the supplied market-tool acronym register is used by NuBlox without allowing acronym labels, vendor/tool categories or proposed sector-pack identifiers to silently redefine the canonical Function architecture.

The source is valuable because it adds two candidate mapping dimensions to the market-tool evidence set:

- **Function Home** — proposed NuBlox Function/Kernel/industry home for the tool class;
- **Native Mode** — proposed `EXECUTE`, `GOVERN`, `ORCHESTRATE` or `NEVER` treatment.

These are reference mappings until reconciled against accepted NuBlox architecture.

## Canonical identity rule

An acronym alone is never a stable tool-class identity because several acronyms have multiple meanings. The evidence identity must therefore use at least:

```text
acronym
+ full_name
+ horizontal_vertical
+ industry
```

Examples include `TMS` (transportation, talent, treasury), `ERM` (enterprise risk, enterprise resource), `DMS` (document, distribution, donor) and `CLM` (contract lifecycle, claims).

## Source population audit

The row-level tables and the source summary do not currently reconcile.

| Measure | Row-level tables | Source summary | Reconciliation state |
|---|---:|---:|---|
| Total tool rows | 212 | 202 | `SOURCE_SUMMARY_MISMATCH` |
| Horizontal rows | 116 | 137 | `SOURCE_SUMMARY_MISMATCH` |
| Vertical rows | 96 | 65 | `SOURCE_SUMMARY_MISMATCH` |
| Acronyms with more than one full-name meaning in the row-level tables | 12 | 15 | `SOURCE_SUMMARY_MISMATCH` |
| Explicit `EXECUTE` rows | 84 | ~130 | `NOT_COMPARABLE__84_VERTICAL_ROWS_HAVE_NO_EXPLICIT_MODE` |
| Explicit `GOVERN` rows | 24 | ~25 | `NOT_COMPARABLE__VERTICAL_MODES_PARTIAL` |
| Explicit `ORCHESTRATE` rows | 17 | ~20 | `NOT_COMPARABLE__VERTICAL_MODES_PARTIAL` |
| Explicit `NEVER` rows | 3 | ~3 | `SOURCE_MATCHES_EXPLICIT_ROWS` |

The 212-row total is consistent with the current machine-readable `Typical Activities in industy standard tools.tsv` evidence population. The summary figures must not be used as canonical totals until the source itself is corrected or regenerated from its row-level data.

## Duplicate-acronym reconciliation

The row-level tables contain 12 acronyms with genuinely different full-name meanings:

```text
ALM
CLM
CRM
DMS
DRP
EMS
ERM
LMS
MDM
OMS
PMS
TMS
```

The source's duplicate-acronym section additionally mentions `GIS` and `DAM`, but those repeat the same full-name meaning across industries rather than introducing a second meaning. It also lists `POS = Point of Service` and `LMS = Logistics Management`, which are not present as row-level entries in the supplied main tables. Those entries therefore remain unmaterialised reference notes, not register rows.

## Function-home authority

Candidate Function Home values are interpreted as follows:

| Source mapping | NuBlox treatment |
|---|---|
| `F01`–`F29` | Candidate mapping to an existing Core Business Function; verify semantic fit before acceptance |
| `Kernel` | Candidate mapping to shared Enterprise Kernel capability; verify it is not business work requiring a Function Activity |
| `D01`–`D16` | Candidate mapping to an existing CBE-classified Function under ADR-0006 |
| combinations such as `F27 + D03` | Candidate multi-Function participation; does not create a new Function |
| proposed `H*`, `B*`, `I*`, `R*`, `M*`, `Ed*`, `G*`, `T*`, `E*`, `L*`, `Me*`, `Ho*`, `A*`, `N*` pack identifiers | Reference-sector proposals only; **not canonical NuBlox Functions** unless separately accepted through architecture governance |
| `Out of scope` | Source scope assertion only; not a permanent product decision without an accepted NuBlox architecture decision |

Only F01–F29 and the currently accepted CBE D01–D16 Function families are established by the present governing architecture. Other industry-pack identifiers must not be seeded into `function_definitions`, used for permission resolution, or exposed as canonical Functions merely because they appear in this evidence source.

## Native-mode authority

`EXECUTE`, `GOVERN` and `ORCHESTRATE` align with the NuBlox execution boundary, but each source assignment is still a mapping hypothesis:

- `EXECUTE` — NuBlox performs the business work natively;
- `GOVERN` — specialist execution may occur elsewhere while NuBlox controls the governed object/output, lifecycle, Authority, Evidence and audit;
- `ORCHESTRATE` — NuBlox coordinates an external system/service/authority and records the governed transaction/evidence.

`NEVER` is not treated as an architecture primitive. A source row marked `NEVER` is an out-of-scope proposal and requires accepted product/architecture governance before becoming permanent scope policy.

## Relationship to market activity evidence

The acronym register and the activity TSV represent complementary evidence layers:

```text
market tool-class identity
-> disambiguated meaning
-> candidate Function/Kernel/industry home
-> candidate native mode
-> observed market activity phrase(s)
-> normalised capability pattern
-> canonical Function / L2 / Activity
-> Method
-> native or connected Tool composition
-> governed object / transaction / work product
-> Decision / Evidence / Audit
```

The acronym mapping never replaces the 1,510 canonical Activities. It narrows the semantic search space for reconciling market observations to those Activities and to accepted Industry Functions/kernel capabilities.

## Reconciliation acceptance states

A future machine-readable mapping register should classify each tool-class mapping using one of:

- `ACCEPTED_CORE_FUNCTION_MAPPING`
- `ACCEPTED_CBE_FUNCTION_MAPPING`
- `ACCEPTED_KERNEL_MAPPING`
- `MULTI_FUNCTION_PARTICIPATION`
- `REFERENCE_SECTOR_PROPOSAL`
- `NATIVE_MODE_REVIEW_REQUIRED`
- `SCOPE_DECISION_REQUIRED`
- `MAPPING_GAP_REVIEW_REQUIRED`

No proposed sector identifier or source mode becomes executable product metadata until its row reaches an accepted state.

## Required machine-readable join

The controlled reconciliation register should eventually contain:

```text
source_tool_acronym
source_tool_name
source_scope
source_industry
source_category
candidate_function_home
candidate_native_mode
function_mapping_state
canonical_function_codes
observed_activity
canonical_activity_ids
resolution_state
native_or_connected_tool_ids
mapping_evidence
review_status
```

This creates one auditable path from market terminology to the NuBlox Function, Activity, Method and Tool architecture without introducing a parallel taxonomy.
