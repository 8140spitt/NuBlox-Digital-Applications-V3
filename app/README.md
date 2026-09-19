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
- runtime startup schema gating against the latest required forward migration (`0034_product_service_innovation_runtime.sql`);
- append-only platform audit evidence with actor/authority snapshots;
- canonical business events plus transactional outbox messages;
- optimistic version control for Organisation master-data commands;
- controlled Draft → Review → Approved → Published Strategy Framework lifecycle transitions using the shared platform authority/evidence spine;
- automatic supersession when a new approved strategy framework is published;
- responsive and accessible baseline layout behaviour.

F06–F29 remain visible as the canonical governed workspace set and are progressively activated only when their runtime journeys are implemented against the shared aggregates. F01, F02, F03, F04 and F05 now operate against the shared platform and canonical aggregate foundations. Architecture convergence is already complete; runtime implementation and acceptance evidence remain the gate.

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

Open `/[tenant]/app/admin/master-data/organisations` for canonical Party/Organisation master data and `/[tenant]/app/admin/security` for tenant identities, memberships, RBAC and access administration. Organisation is implemented once and reused by CRM, procurement, contracts, HCM, finance and project delivery through governed Party Relationships rather than duplicate company masters.

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
