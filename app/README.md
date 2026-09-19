# NuBlox V3 Application

This directory contains the greenfield NuBlox V3 tenant application.

## Current foundation

The application now establishes:

- SvelteKit 5 / TypeScript / pnpm application tooling;
- the shared tenant application shell;
- the canonical 29-function workspace directory;
- F01 — Strategy & Enterprise Planning as the first active workspace;
- F02 — Corporate Governance as the second operational workspace, including Governance Bodies, Authority Framework, Delegation of Authority, Executive Management, Policy Governance and restricted Ethics Governance;
- F03 — Enterprise Performance Management as the third operational workspace, including Performance Framework, Reporting, Variance Management, Management Review, Benchmarking and Benefits Realisation;
- F04 — Corporate Development & M&A as the fourth operational workspace, including Opportunity Identification, Valuation, restricted Due Diligence, Transaction Management, Integration, Divestiture and Strategic Partnerships;
- F01.01 — Strategy Framework as the first operational persisted business slice;
- canonical Party / Person / Organisation / Legal Entity master data through the shared `AGG-01-PARTY` runtime;
- Party Relationship, Organisation Unit/effective hierarchy and Delegated Authority shared foundation aggregates;
- tenant, User Identity, Membership, Role, Permission and Role Assignment runtime foundations;
- Better Auth production authentication with tenant-scoped identity mapping and controlled first-administrator bootstrap;
- deny-by-default server command permission checks;
- MySQL 8.0+ persistence through the `mysql2` promise client and pooled prepared statements;
- runtime startup schema gating against the latest required forward migration (`0036_work_context_edit_lease_runtime.sql`);
- append-only platform audit evidence with actor/authority snapshots;
- canonical business events plus transactional outbox messages;
- optimistic version control for Organisation master-data commands;
- controlled Draft → Review → Approved → Published Strategy Framework lifecycle transitions using the shared platform authority/evidence spine;
- automatic supersession when a new approved strategy framework is published;
- responsive and accessible baseline layout behaviour.

F07–F29 remain visible as the canonical governed workspace set and are progressively activated only when their runtime journeys are implemented against the shared aggregates. F01, F02, F03, F04, F05 and F06 now operate against the shared platform and canonical aggregate foundations. Architecture convergence is already complete; runtime implementation and acceptance evidence remain the gate.

## F02 operational baseline

Corporate Governance now runs on the shared canonical platform services rather than workspace-specific authority or evidence mechanisms. Board and Committee governance include governed meeting occurrences, quorum, exact issued meeting-pack revisions, immutable resolutions and shared follow-up Work. Executive Management reuses the same Governance Meeting boundary, Policy Governance profiles controlled Information, and Ethics Governance uses restricted Integrity Cases with explicit per-case need-to-know access.

## F03 operational baseline

Enterprise Performance Management reuses the canonical KPI Definition, Performance Target, Performance Observation and Baseline identities already established by F01. F03 adds governed enterprise Scorecards, reproducible published Performance Snapshots, variance-to-corrective-Work intervention, quorum-controlled Management Reviews, approved benchmark basis and transformation Benefit profiles validated against attributable observations. Published snapshots pin exact governed inputs so later corrections cannot silently rewrite historic dashboards or review evidence.

## F04 operational baseline

Corporate Development & M&A now runs as a connected deal lifecycle over four canonical write boundaries rather than a standalone deal silo. Opportunities and frozen valuation appraisals use `AGG-04-DEVELOPMENT`; Due Diligence uses restricted `AGG-22-LEGAL` Legal Matters with explicit need-to-know access; Transaction, Divestiture and Strategic Partnership cases share the versioned `AGG-04-BUSINESS-CASE` master with exact immutable Decision evidence and executed-agreement completion controls; and post-deal Integration reuses `AGG-26-TRANSFORMATION`. Target organisations reuse canonical Party identities, and finance/legal/project/organisation source records remain authoritative in their own domains.

## Run locally

```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm db:status
pnpm check
pnpm dev
```

Open the URL printed by Vite. The root route redirects to the demonstration tenant at `/perspective-bc/app/functions/f01`.

NuBlox does **not** create application databases implicitly. Copy `.env.example` to `.env`, configure `DATABASE_URL` for your MySQL database and `NUBLOX_TEST_DATABASE_URL` for a separate test database, then apply the tracked migrations before starting the app.

## Current security boundary

Permission denials are treated as controlled HTTP 403 responses and render inside the tenant application shell; missing authority must never surface as an unhandled 500 application failure. A denied tenant member can return home or submit a governed permission access request, which creates an `ACCESS_REQUEST` Work Item assigned to the active `tenant-admin` role for review in My Work. Duplicate open requests for the same actor and permission are suppressed. The request never grants authority by itself; administrators still change RBAC through Security & Authority.

Runtime authorization foundations are now implemented: active tenant, User Identity → Party linkage, effective tenant Membership, Role Assignment, Role Definition and Permission Definition are resolved before protected commands execute. Material commands retain an authority snapshot in audit evidence.

Production authentication is integrated through Better Auth with MySQL-backed users, accounts, sessions and verification records. Authentication does not grant business authority by itself: the authenticated user must map to a tenant-scoped NuBlox User Identity linked to a Party with effective Membership and Role Assignment. Public registration is disabled by default, production has no development-identity fallback, and the first administrator is established explicitly with `pnpm auth:bootstrap`.

## Engineering rule

The UI is data-driven from canonical workspace definitions. Function workspaces may have different business content, but they use shared shell and interaction primitives rather than creating independent mini-applications.

## Foundation master data

Open `/[tenant]/app/admin/master-data/parties` for the canonical Party identity directory and `/[tenant]/app/admin/security` for tenant identities, memberships, RBAC and access administration. Business roles originate in their home functions: clients/customers in F07, suppliers/subcontractors in F09, employees/workers in F15 and legal/regulator roles in F19. The shared Party identity is resolved or created behind those workflows; the Master Data surface is a directory and exceptional stewardship surface, not an alternative onboarding route.

## MySQL migrations

NuBlox V3 targets **MySQL 8.0+**. Schema DDL is no longer embedded in runtime TypeScript.

```bash
pnpm db:migrate
pnpm db:status
```

The runner records SHA-256 checksums in `schema_migrations`. Editing an already-applied migration is treated as drift and fails status checks. Add a new forward migration instead.

For persistence integration tests, configure a dedicated test database and run:

```bash
pnpm db:migrate:test
pnpm test:integration
```

Pure semantic/domain tests remain database-independent:

```bash
pnpm test:domain
```

Run both suites with:

```bash
pnpm test:all
```

See `migrations/README.md` for the migration governance rules.

## F05 operational baseline

Product, Service & Innovation Management now operates across the frozen canonical boundaries rather than as a monolithic PLM application:

- `AGG-03-MARKET-INSIGHT` captures attributable market/customer need evidence with source, as-of and validation context;
- `AGG-10-ITEM` provides one stable Item/Offering identity from concept selection through launch, lifecycle and retirement;
- `AGG-10-CONFIGURATION` provides versioned Product Configuration Models with characteristics, rules, requirement traceability, trials and immutable released versions;
- `AGG-04-BUSINESS-CASE` is reused for Product/Service and Innovation decision support with exact version profiles for demand, ROI, market basis, product scope and funding envelope;
- shared `AGG-27-DECISION` evidence authorises concept selection and investment approval rather than embedding approval flags inside product records;
- Innovation experiments and funding remain evidence against exact Business Case versions and do not become a shadow project, workflow or ledger;
- launch requires selected-concept Decision evidence, an approved Product/Service Business Case, a released Product Configuration and completed operational readiness;
- retirement requires stakeholder notice, customer migration, support-end and archive evidence before the Item can become Retired.

The ten F05 L2 work areas are delivered through six shared operational workbenches so identical canonical objects are not split into duplicate mini-applications.

F05 capability coverage is benchmarked against contemporary SAP Integrated Product Development, PTC Windchill, Siemens Teamcenter and Autodesk Fusion Manage semantics while retaining NuBlox canonical authority boundaries.

## F06 operational baseline

Marketing & Brand now operates across shared canonical authorities rather than as a separate customer-profile or content-management silo:

- `AGG-03-MARKET-INSIGHT` is shared with F05 for attributable market/customer research, trends and observations; F06 does not create a second market-intelligence master;
- Market Segment definitions are effective-dated/versioned overlays on Party, Party Relationship and Lead identities; Campaigns pin exact active segment versions so historical audience intent remains reproducible;
- `AGG-25-COMMUNICATIONS` owns versioned Brand/Marketing Communications Plans and Communication Items, while approved content/assets remain exact issued `AGG-07-INFORMATION` revisions;
- `AGG-25-COMMS-CAMPAIGN` owns stable multi-channel Campaign identity, exact plan/audience/content context, approval Decision, lifecycle and event execution;
- Plan and Campaign approvals remain immutable shared `AGG-27-DECISION` records bound to exact versions;
- the F06 Privacy slice records immutable Consent and Preference Evidence events under `AGG-22-PRIVACY`; outbound delivery evaluates current evidence at execution time and does not use a mutable campaign opt-out flag;
- `AGG-03-LEAD` owns unresolved early commercial demand, source provenance, enrichment, scoring, nurture, qualification and an exact-version Sales handoff. Lead does not become Party or Opportunity implicitly;
- Marketing Analytics snapshots are immutable/reproducible evidence that pin the exact delivery-event, Lead, campaign-measurement and segment-membership source sets used to derive reach, conversion, CAC and ROMI;
- Events reuse the Communications Campaign boundary and retain governed registration, attendance, supplier-reference and outcome evidence.

The eleven F06 L2 areas are delivered through six integrated workbenches: Intelligence & Segmentation, Brand & Marketing Strategy, Campaign Studio, Events, Lead Generation and Marketing Analytics. Contemporary SAP Emarsys and Adobe Journey Optimizer patterns were used as capability benchmarks for segmentation, multi-channel orchestration, approval, automation and optimisation, while NuBlox retains its own canonical authority model.

F06 acceptance is gated by clean migration replay, domain/service tests, Svelte/type checks, repository formatting and production build on the exact main commit.

## Cross-cutting interaction baseline

Migration `0036_work_context_edit_lease_runtime.sql` establishes the application-wide interaction model used before F07 and all later workspaces:

- **Task Bar / Work Context** records what the current user is actively working on and allows multiple open items to be revisited independently of My Work assignment queues.
- **Progressive form enhancement** is mounted at the application shell: native POST forms and server actions remain authoritative without JavaScript, while enhanced clients preserve field state and expose pending/error/conflict states.
- **Recoverable Work Drafts** persist a user's form payload against an explicit base version. Drafts never mutate the canonical aggregate until a governed command is committed.
- **Edit Leases** provide short-lived cooperative editing ownership with heartbeat, expiry and release. They are application coordination records, not long-running SQL row locks.
- **Aggregate/version checks remain the hard lost-update barrier** even when a valid edit lease exists.
- Organisation stewardship demonstrates the complete pattern: starting an edit pins the Organisation to the Task Bar, acquires a lease, autosaves a draft, blocks another user from editing, and still commits against the exact canonical version.
- Party/Organisation creation is no longer exposed from global Master Data. Canonical identity creation remains a low-level shared service called by the owning business workflow with immutable Party origination metadata.

**My Work answers “what am I responsible for?”; the Task Bar answers “what am I working on now?”** They are deliberately separate concepts.
