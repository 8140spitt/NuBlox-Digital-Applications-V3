# NuBlox V3 Database Migrations

NuBlox V3 uses **MySQL 8.0+** and forward-only, checksum-protected SQL migrations.

## Commands

From `app/`:

```bash
pnpm db:migrate
pnpm db:status
pnpm db:seed:platform
pnpm db:migrate:test
pnpm db:status:test
```

Production/development migrations use `DATABASE_URL` (or `MYSQL_URL`). Integration tests use `NUBLOX_TEST_DATABASE_URL`; isolated migration tests may use `NUBLOX_TEST_ADMIN_DATABASE_URL` for schema creation/drop while application service tests continue to use the restricted test user.

## Ledger

The migration runner maintains two infrastructure ledgers:

- `schema_migrations` records the migration filename, SHA-256 checksum and successful application timestamp;
- `schema_migration_attempts` records APPLYING / FAILED / APPLIED execution state so partially committed MySQL DDL cannot be retried blindly.

`db:status` reports:

- **APPLIED** — repository checksum matches the applied migration;
- **PENDING** — migration exists in the repository but is not applied;
- **DRIFT** — an applied migration was edited after application;
- **UNKNOWN** — the database records a migration missing from the repository;
- **DIRTY** — an APPLYING or FAILED attempt exists and operator repair is required before another migration run.

Pending, dirty, drift or unknown migrations make `db:status` exit non-zero.

## Rules

1. **Never edit an applied migration.** Add a new numbered migration.
2. Migrations are ordered lexically: `0001_...`, `0002_...`, and so on.
3. Schema change and required data backfill belong in an explicit forward migration.
4. Destructive changes require a staged expand/backfill/contract sequence.
5. Runtime code must not create or alter business tables.
6. Runtime startup verifies that the required migration is present; it does not silently mutate production schema.
7. Each integration-test run first migrates the dedicated test database.
8. MySQL DDL may commit independently. The runner records APPLYING before executing SQL and preserves FAILED/APPLYING state on incomplete execution. A dirty database must be inspected and repaired explicitly before migrations resume; automatic retries are prohibited.
9. Tenant-owned transactional tables carry explicit tenant scope or reach tenant scope through a canonical root with enforced foreign keys.
10. Every physical table must implement an accepted canonical aggregate/object/evidence pattern; database convenience does not redefine the canonical model.

## Migration sequence

- `0001_platform_foundation.sql` — Tenant, Party/Organisation, identity, membership, roles/permissions, platform audit, business events and transactional outbox.
- `0002_strategy_and_architecture_review.sql` — Strategy Framework runtime plus the canonical architecture-review ledger.
- `0003_party_specialisations.sql` — canonical Person and Legal Entity specialisations of Party.
- `0004_outbox_delivery_controls.sql` — claim/retry/lock/failure/dead-letter controls for transactional outbox delivery.
- `0005_tenant_version.sql` — monotonic aggregate versioning for AGG-01-TENANT authority/configuration changes.
- `0006_authentication.sql` — Better Auth users, sessions, accounts and verification persistence, kept separate from NuBlox business authority.
- `0007_foundation_relationship_structure_authority.sql` — Party Relationships, Organisation Units/effective hierarchy and Delegated Authority aggregates.
- `0008_shared_work_runtime.sql` — AGG-27-WORKFLOW runtime for workflow instances, Work Items, assignments, acknowledgements, escalation and governed work-change evidence.
- `0009_authorised_decision_runtime.sql` — immutable AGG-27-DECISION records with exact subject/version and authority evidence.
- `0010_governed_evidence_runtime.sql` — AGG-28-EVIDENCE items with integrity hashes, source references, provenance and independent verification.
- `0011_classification_runtime.sql` — AGG-29-CLASSIFICATION systems, immutable releases and governed release-scoped codes.
- `0012_lifecycle_configuration_runtime.sql` — AGG-29-LIFECYCLE-CONFIG stable definitions with immutable published versions, states and transition rules.
- `0013_authority_configuration_runtime.sql` — AGG-29-AUTHORITY-CONFIG approval and delegated-authority policy rules with immutable published versions.
- `0014_reference_data_runtime.sql` — AGG-29-REFERENCE-DATA typed jurisdictions, currencies, units, tax regimes, contract-form families and versioned calendars.
- `0015_strategy_decision_reference.sql` — F01 Strategy review versions retain immutable AGG-27-DECISION references for governed review outcomes.
- `0016_reference_data_history.sql` — immutable snapshots for every typed reference-data revision plus historical backfill.
- `0017_authority_policy_traceability.sql` — exact published authority-policy rule/version references on protected Decisions and approved Delegated Authority grants.
- `0018_strategic_assumption_runtime.sql` — AGG-02-ASSUMPTION governed strategic assumptions with immutable versions, evidence links and assessment lifecycle.

Future schema changes start at `0033_...`; historical migrations remain immutable.

## Validation and test contract

`pnpm db:validate` verifies contiguous ordering and rejects business-table DDL in runtime server modules. `pnpm test:migrations` creates an isolated temporary MySQL database from `NUBLOX_TEST_DATABASE_URL` credentials, migrates it from zero, reapplies the migration set to prove repeat safety, verifies the migration ledger/checksums, runs the platform/Strategy services against that migrated schema, and drops the temporary database. The configured test database name must contain a standalone `test` segment; production databases are refused.

`pnpm db:seed:platform` idempotently synchronises required platform reference definitions such as the permission catalog after schema migration. It is production-safe and creates no tenant, user or development fixture.

Development bootstrap records are application/test fixtures, not migration content. Migrations establish schema and required structural constraints only; `pnpm db:seed:dev -- <tenant>` remains explicitly development-only.

## Migration 0009 — authorised decision runtime

`0009_authorised_decision_runtime.sql` introduces the immutable `AGG-27-DECISION` runtime. Decisions bind an attributable outcome to an exact subject/version, retain permission/delegated-authority evidence at decision time, and support append-only corrective supersession without editing earlier decisions.

## Migration 0010 — governed evidence runtime

`0010_governed_evidence_runtime.sql` introduces `AGG-28-EVIDENCE`: stable Evidence Items with exact subject/version binding, integrity hashes, immutable source/provenance references, attributable capture and independent verification. Evidence supports domain truth without becoming a duplicate business master.

## Migration 0011 — classification runtime

`0011_classification_runtime.sql` introduces `AGG-29-CLASSIFICATION`: stable Classification Systems, draft-to-published immutable Releases, release-scoped Codes and hierarchical parent-code relationships. Bulk code loading is a governed aggregate command so large taxonomies such as Uniclass can be loaded efficiently without creating a parallel business-master architecture.

## Migration 0012 — lifecycle configuration runtime

`0012_lifecycle_configuration_runtime.sql` introduces `AGG-29-LIFECYCLE-CONFIG`: stable Lifecycle Definition identities, versioned draft/published configurations, state definitions and transition-rule value rows. Published versions are immutable and runtime domain state remains owned by the relevant domain aggregate.

## Migration 0013 — authority configuration runtime

`0013_authority_configuration_runtime.sql` introduces `AGG-29-AUTHORITY-CONFIG`: stable Approval Authority Rule and Delegated Authority Rule identities with draft/published immutable versions, scope/value/effectivity constraints and attributable configuration governance. Policy does not itself grant runtime authority; effective grants remain in `AUTH-DELEGATED-AUTHORITY`.

## Migration 0014 — reference data runtime

`0014_reference_data_runtime.sql` introduces `AGG-29-REFERENCE-DATA` as typed governed reference semantics rather than a generic lookup bucket: Jurisdiction, Currency, Unit of Measure, Tax Regime, Contract Form Family and versioned Calendar configuration. Reference identities are effective-dated/versioned so historical transactions can retain the exact meaning used originally.

## Migration 0015 — Strategy Decision reference

`0015_strategy_decision_reference.sql` replaces free-text review notes as the authoritative F01 review linkage with an explicit foreign-key reference from each Strategy Framework Version to immutable `AGG-27-DECISION` evidence. Domain state transition and Decision evidence remain separate aggregate commands; the domain command validates the exact referenced decision before changing Strategy state.

## Migration 0016 — reference-data history

`0016_reference_data_history.sql` adds immutable version snapshots for typed enterprise reference identities and backfills the existing governed state. Reference revisions use optimistic concurrency and append a snapshot rather than erasing prior meaning; retirement ends effectivity without deleting identity. Calendar configuration remains separately versioned and published with non-overlapping effectivity.

## Migration 0017 — authority-policy traceability

`0017_authority_policy_traceability.sql` makes policy-as-applied explicit. A protected `AGG-27-DECISION` retains the exact published Approval Authority Rule version used, and an approved `AGG-01-AUTHORITY` Delegated Authority retains the exact Delegated Authority Rule version used. Composite foreign keys prevent mismatched rule/version pairs while historical pre-policy records remain valid with null policy references.

## Migration 0018 — strategic assumption runtime

`0018_strategic_assumption_runtime.sql` implements F01.02 Environmental Analysis through `AGG-02-ASSUMPTION`. Stable Strategic Assumption identities retain immutable content versions, confidence, scope/effectivity and optional governed `AGG-28-EVIDENCE` references. Assessment/challenge/invalidation changes lifecycle state without rewriting prior versions; analytical F01.02 activities query the same governed evidence base by lens/category.

## Migration 0019 — strategic objective runtime

`0019_strategic_objective_runtime.sql` implements `AGG-02-OBJECTIVE` for F01.03 Strategic Planning. Each Strategic Objective has a stable identity, immutable content versions, accountable owner, scope/horizon/success criteria and an exact reference to the published Strategy Framework version it supports. Objective lifecycle changes remain independent from Strategy Framework publication and future KPI/target aggregates.

## Migration 0020 — Business Plan runtime

`0020_business_plan_runtime.sql` implements F01.04 Business Planning as a governed `SGP-BUSINESS-PLAN` identity under the existing `AGG-02-STRATEGY` boundary. Every immutable plan version pins exact published Strategy Framework context, exact Strategic Objective versions and exact Strategic Assumption versions. Approval retains immutable `AGG-27-DECISION` evidence; activating a successor version supersedes the previous current baseline without rewriting it. Financial/resource expectations remain planning semantics, not Budget or Forecast truth.

## Migration 0021 — Operating Model runtime

`0021_operating_model_runtime.sql` implements F01.05 Operating Model as structured, versioned Strategy content under `AGG-02-STRATEGY`. Each version preserves current-state and target-state assessments, design principles, centralisation/shared-service choices, target capability definitions and accountability design. The model references but never replaces live Organisation Unit structure. Approval is retained as immutable `AGG-27-DECISION` evidence and activation supersedes prior active versions explicitly.

## Migration 0022 — strategic performance runtime

`0022_performance_runtime.sql` implements F01.06 Goal & KPI Management through `AGG-02-PERFORMANCE`. KPI Definition, Performance Target, Performance Observation and Baseline are separate semantic layers. KPI versions pin governed UOM and exact Strategic Objective versions; targets pin effective KPI versions; observations are immutable evidence occurrences; baselines pin validated observations; variance is computed as a read projection and corrective action delegates to shared `AGG-27-WORK` rather than creating an F01-specific task engine.

## Migration 0023 — Strategic Review / Governance Meeting runtime

`0023_strategic_review_runtime.sql` implements F01.07 through the frozen `AGG-02-GOVERNANCE-MEETING` boundary. Meeting occurrence owns schedule, quorum, attendees, agenda and review findings. Resulting choices remain immutable shared `AGG-27-DECISION` records and follow-up actions remain shared Work Items; linkage tables preserve review context without creating duplicate decision or action masters.

## Migration 0024 — Scenario & foresight runtime

`0024_scenario_runtime.sql` implements F01.08 through `AGG-02-SCENARIO`. Stable Scenario identities retain immutable versions with explicit horizon/scope, drivers, exact Strategic Assumption versions and optional exact KPI projections. Sensitivity analyses and contingency strategies are attributable scenario evidence tied to an exact version. Scenario lifecycle is independent from Forecast Snapshot truth and activation never rewrites decisions made against older Scenario versions.

## Migration 0025 — Governance Body runtime

`0025_governance_body_runtime.sql` implements the `AGG-02-GOVERNANCE` stable Governance Body boundary for F02.01 Board Governance and F02.05 Committee Governance. Boards and committees retain immutable configuration versions and effective-dated Party membership with explicit quorum, chair and secretariat semantics. Membership is governance context only: it does not grant decision authority, permissions or Delegated Authority. Meetings and Decisions remain separate aggregate transactions.

## Migration 0026 — Authority Framework runtime

`0026_authority_framework_runtime.sql` implements F02.02 through the frozen `AGG-02-AUTHORITY-FRAMEWORK` boundary. Stable Authority Framework identities retain immutable governance versions containing authority classes, decision rights, monetary/non-monetary limits, reserved matters, delegation/subdelegation constraints and segregation-of-duties rules. Approval retains immutable shared `AGG-27-DECISION` evidence. The Framework is governance policy: it does not itself grant permission, create Delegated Authority or replace executable `AGG-29-AUTHORITY-CONFIG` policy.

## Migration 0027 — Information Container runtime

`0027_information_container_runtime.sql` implements the frozen `AGG-07-INFORMATION` boundary. Stable Information Container identity survives controlled revisions and representation/file changes. Revisions preserve purpose-of-issue, suitability, subject/context and immutable approval/issue history; representations retain content references and integrity hashes without becoming the information identity. Issued revisions are immutable and later corrections create successor revisions. Shared `AGG-27-DECISION` evidence authorises approval while exchanges, transmittals and workflows remain separate aggregates.

## Migration 0028 — Policy Governance profile runtime

`0028_policy_governance_runtime.sql` implements F02.06 as a governed Policy profile over canonical controlled information. Policy uses the exact `AGG-07-INFORMATION` Information Container identity rather than creating a second document master. `policy_profiles` adds stable policy type while `policy_revision_profiles` pins revision-specific owner, governance body, applicability, scope, effectivity, review date and attestation requirement to the exact immutable Information Revision. Approval, issue and supersession remain owned by the Information Container lifecycle; `AGG-02-POLICY` records policy-specific governance evidence.

## Migration 0029 — restricted Integrity Case runtime

`0029_integrity_case_runtime.sql` implements F02.07 Ethics Governance through the frozen `AGG-21-CASE / INTEGRITY-CASE` boundary. Integrity Cases retain stable restricted case identity, Party subjects, investigation ownership, append-only case journal entries, governed Evidence Item links, immutable Decision links and shared Work Item follow-up. Tenant permission is necessary but insufficient for case visibility: every case query and command also requires an active per-case Party access grant. Case business events intentionally exclude allegation, source and journal content so restricted case narrative is not replicated into the general event/outbox stream.

## Migration 0030 — Governance Meeting controlled-information links

`0030_governance_meeting_information.sql` closes the Board/Committee meeting-information gap without creating a document silo. Governance Meetings reference exact immutable `information_revisions` for agenda, Board/Committee packs, supporting papers and minutes. Only issued revisions may be linked by the runtime, so historic governance evidence retains the exact controlled information reviewed at the meeting. The meeting remains `AGG-02-GOVERNANCE-MEETING`; Information Container identity and revision lifecycle remain owned by `AGG-07-INFORMATION`.


## Migration 0031 — Enterprise Performance Management extensions

`0031_enterprise_performance_runtime.sql` activates F03 without duplicating the F01 performance foundation. `AGG-02-PERFORMANCE` retains canonical KPI Definition, Target, Observation and Baseline identities while F03 adds governed Scorecards/hierarchy, reproducible Performance Snapshots with exact pinned KPI/Observation/Target inputs, recorded snapshot distribution, approved benchmark basis and benefit profiles/validations. F03.04 Management Review reuses `AGG-02-GOVERNANCE-MEETING` and pins exact published Performance Snapshots; resulting choices remain immutable shared `AGG-27-DECISION` records and corrective follow-up remains shared Work.


## Migration 0032 — Corporate Development & M&A runtime

`0032_corporate_development_runtime.sql` activates F04 across the frozen canonical boundaries rather than creating a monolithic deal record. `AGG-04-DEVELOPMENT` owns stable Corporate Development Opportunities and immutable approved Development Appraisal snapshots; `AGG-22-LEGAL` provides restricted Due Diligence Legal Matters with matter-level Party access and seven cross-functional workstreams; `AGG-04-BUSINESS-CASE` provides versioned Transaction, Divestiture and Strategic Partnership decision-support cases that reference exact appraisal/legal evidence and require immutable shared `AGG-27-DECISION` approval; and `AGG-26-TRANSFORMATION` provides reusable post-deal Integration Initiatives and governed workstreams. Sensitive diligence narrative remains inside the Legal Matter boundary and is excluded from general event payloads.
