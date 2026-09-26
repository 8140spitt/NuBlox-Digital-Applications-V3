# 15 — Market Tool Activity Evidence Model

**Status:** Governing architecture  
**Effective:** 26 September 2026

## Purpose

NuBlox uses market products and tool classes as evidence of work that enterprises need to perform. Market terminology does **not** define the NuBlox Function, L2 Sub-function or Activity taxonomy.

The primary machine-readable source for generic market-tool activity evidence is:

- `docs/reference/Typical Activities in industy standard tools.tsv`

The source contains tool-class observations such as ERP, EPM, CRM, HCM, QMS, IAM, BIM, PMIS, CAFM and GIS together with the activities those classes commonly manage or coordinate.

The complementary acronym/function/native-mode mapping evidence is governed by:

- `docs/reference/market-tool-acronym-reconciliation.md`

That reconciliation deliberately treats supplied Function Home and Native Mode values as candidate mappings until they are verified against the accepted F01–F29, Enterprise Kernel and CBE D01–D16 architecture. Proposed non-CBE sector-pack identifiers remain reference proposals only.

## Canonical distinction

NuBlox must keep the following concepts separate:

| Concept | Meaning | Authority |
|---|---|---|
| **Market Tool Activity Observation** | A phrase used by a market tool class to describe work it manages or coordinates | Reference evidence only |
| **Market Tool Class Mapping** | Disambiguated acronym/full-name identity with candidate Function Home and Native Mode | Reference evidence pending reconciliation |
| **Capability Pattern** | A normalised reusable work pattern such as scheduling, reporting, approval, inspection, reconciliation or notification | NuBlox architecture |
| **Enterprise Activity** | One of the 1,510 governed Activities under the canonical F01–F29 Function taxonomy | Canonical NuBlox taxonomy |
| **Industry Activity** | Activity executed within an Industry Function such as CBE D01–D16 | Canonical NuBlox taxonomy |
| **Method** | Governed executable specification describing how a canonical Activity is performed | NuBlox runtime/governance |
| **Tool** | Native or connected capability used to execute a Method or Activity | Tool Registry |

The TSV therefore does **not** create a second Activity Register, and an acronym register does **not** create a second Function catalogue.

## Market tool identity

An acronym alone is not a stable identity. Acronyms such as `TMS`, `ERM`, `DMS`, `CLM`, `OMS`, `MDM`, `ALM`, `CRM`, `LMS`, `PMS` and `EMS` have multiple meanings in the evidence set.

The minimum evidence identity is therefore:

```text
acronym
+ full_name
+ horizontal_vertical
+ industry
```

Any reconciliation, import, comparison or generated register must use the disambiguated identity rather than acronym alone.

## Evidence chain

```text
Market tool class
-> disambiguated market tool identity
-> candidate Function/Kernel/industry home
-> candidate execution mode
-> observed activity phrase
-> normalised capability pattern
-> canonical Function / L2 / Activity
-> execution mode
-> Method
-> Tool composition
-> canonical object / transaction / work product
-> Decision / Evidence / Audit
```

This chain allows NuBlox to prove market coverage without allowing vendor, acronym or proposed sector-pack boundaries to become product boundaries.

## Mapping cardinality

Market evidence is not assumed to map one-to-one.

- Many market phrases can map to one canonical Activity.
- One broad market phrase can decompose into several canonical Activities.
- A phrase may resolve to a shared kernel primitive rather than a Function Activity.
- A specialist-authoring phrase may be governed through a K5 connected specialist tool rather than executed natively.
- A regulated or external-authority phrase may be orchestrated rather than executed by NuBlox.

Examples of broad phrases that require semantic resolution rather than literal matching include `reporting`, `scheduling`, `compliance`, `workflow`, `analytics`, `collaboration` and `monitoring`.

## Resolution states

Every observed market activity should eventually resolve to one of these states:

| State | Meaning |
|---|---|
| `EXACT_CANONICAL_ACTIVITY` | Direct semantic match to one canonical Activity |
| `SEMANTIC_EQUIVALENT` | Same work expressed with different market wording |
| `COMPOSITE_ACTIVITY` | Market phrase decomposes into multiple canonical Activities |
| `SHARED_PLATFORM_PRIMITIVE` | Work is provided by the Enterprise Kernel or a shared K1 tool |
| `SPECIALIST_GOVERNED` | Deep specialist work remains in a K5 tool while NuBlox governs output, lifecycle, Authority and Evidence |
| `EXTERNAL_ORCHESTRATED` | NuBlox coordinates an external system, authority or infrastructure service |
| `INDUSTRY_SOLUTION_ACTIVITY` | Work belongs to an Industry Function rather than the universal F-series |
| `GAP_REVIEW_REQUIRED` | No satisfactory canonical home exists yet and architecture review is required |

`GAP_REVIEW_REQUIRED` is the only state that may justify extending the canonical architecture. Market terminology alone is never sufficient justification.

## Execution modes

Resolution must also preserve the NuBlox execution boundary:

- `EXECUTE` — NuBlox performs the work natively.
- `GOVERN` — a specialist tool performs the deep work; NuBlox owns the governed object/output, lifecycle, review, Authority, Evidence and audit.
- `ORCHESTRATE` — NuBlox coordinates an external system or authority and records the governed transaction/evidence.

These modes are orthogonal to the source tool's marketing category. Source-provided mode assignments are evidence hypotheses until reconciled. `NEVER` is treated as a source scope assertion, not a permanent NuBlox architecture primitive unless an accepted architecture decision explicitly establishes that boundary.

## Function-home boundary

Candidate source mappings to F01–F29, Kernel or CBE D01–D16 may be reconciled into the accepted architecture when their semantic fit is verified.

Other proposed industry identifiers such as H/B/I/R/M/Ed/G/T/E/L/Me/Ho/A/N pack codes are not presently canonical NuBlox Functions. They must not be seeded into the Function model, permissions or runtime solely because they occur in reference evidence.

## Relationship to the 1,510-Activity baseline

The canonical source remains:

- `docs/architecture/canonical-activity-capability-map.csv`

Its 1,510 Activities are not replaced, renumbered or renamed by the TSV. The market evidence is used to test whether those Activities, their native engines, shared platform capabilities and Industry Functions collectively cover the work represented by the external tool landscape.

The governing comparison target is therefore:

```text
market evidence coverage
versus
1,510 canonical Activities + kernel/shared capabilities + Industry Functions + governed specialist/external work
```

not:

```text
market activity phrase count
versus
1,510 Activity count
```

## Relationship to Methods and Tool composition

The evidence source helps answer **what work the market expects software to support**. It does not define **how NuBlox performs that work**.

For native execution the chain is:

```text
Canonical Activity
-> published Method version
-> workspace composition
-> K1/K2/K3/K4 tool set
-> object / transaction / work product
-> Decision / Evidence / Audit
```

For specialist work the Method may compose a K5 connected tool while retaining NuBlox governance of the resulting object and evidence.

## CBE interpretation

Construction rows such as BIM, VDC, GIS, PMIS, IWMS, CAFM and CMMS are reference evidence for work that may participate across the accepted CBE D01–D16 Functions. They do not redefine those Function IDs or names.

For example, `BIM` is a market tool/capability class. It is **not** a competing canonical Function named `D02 BIM`. Its activities must be resolved into the existing CBE Function model according to the work being performed and the Job Profile/Position/context executing it.

## Validation

`pnpm architecture:check` validates the TSV as an architecture evidence input. The validation requires:

- the governed five-column TSV schema;
- complete tool identity and activity fields;
- semicolon-delimited activity observations;
- unique disambiguated tool identities (`acronym + full name + scope + industry`);
- explicit detection/reporting of acronyms with multiple full-name meanings;
- both horizontal and vertical tool evidence;
- cross-industry and Construction evidence;
- representative ERP, HCM, IAM, BIM and PMIS tool classes;
- a non-trivial evidence population so accidental truncation is detected.

Structural validation is not a claim that every phrase or supplied Function Home/Native Mode has already been semantically mapped.

## Next reconciliation output

The next controlled generated register should use one row per observed activity phrase and preserve source traceability with at least:

```text
source_tool_acronym
source_tool_name
source_scope
source_industry
source_category
candidate_function_home
candidate_native_mode
function_mapping_state
observed_activity
normalised_capability_pattern
canonical_function_code
canonical_l2_id
canonical_activity_id
resolution_state
execution_mode
native_or_connected_tool_ids
mapping_evidence
review_status
```

That register becomes the auditable bridge from the external tool vocabulary into the NuBlox Activity, Method and Tool architecture.
