# NuBlox

**NuBlox is an enterprise operating platform.**

This repository is the clean product foundation for NuBlox. It is intentionally not organised around any incumbent ERP, PLM, CDE or project-management product.

NuBlox has one enterprise platform model:

1. **Enterprise Kernel** — canonical enterprise objects and shared control services.
2. **Functions** — one universal Function model. F01–F29 are Core Business Functions; Industry Solutions may add classified Functions such as CBE D01–D16.
3. **Native Work-Delivery Runtime** — turns governed Function capability into executable work, transactions, work products, decisions, evidence and controlled records.
4. **Industry Solutions** — industry-specific Function definitions, Job Profiles, object types, rules and native capability composition, beginning with Construction & the Built Environment.

## Product architecture

```text
NuBlox Enterprise Operating Platform
├── Enterprise Kernel
│   ├── Canonical object graph
│   ├── Identity, organisation and authority
│   ├── Workflow, lifecycle and change
│   ├── Information, records and baselines
│   └── Events, decisions, evidence and audit
├── Functions
│   ├── F01–F29 Core Business Functions
│   ├── Industry Functions such as CBE D01–D16
│   ├── Native tools
│   └── Shared cross-Function processes
├── Native Work-Delivery Runtime
│   ├── Deployments and assignments
│   ├── Work and deliverables
│   ├── Review, approval and acceptance
│   └── Evidence and records
└── Industry Solutions
    └── Construction & Built Environment
        ├── 16 CBE Functions / professional domains
        ├── 84 Job Profiles
        └── Projects, contracts, packages, sites and assets
```

## User operating model

The signed-in user's primary working world is resolved from Human Capital authority:

```text
Person
→ Employment
→ occupied Position
→ assigned Function
→ Functional Governance | Functional Delivery
→ Position reporting hierarchy / management scope
→ authorised work, tools, objects, decisions and cross-Function handoffs
```

A manager sees their own authorised work plus the work and performance of subordinate Positions within the same governed scope. Contexts such as Project, Contract, Site and Asset refine where work is performed; they do not replace the Function/Position model.

## Repository map

- `docs/architecture/` — governing product architecture.
- `docs/reference/` — external product benchmarks and migration mappings.
- `apps/web/` — clean NuBlox web application shell.

Start with [the architecture index](docs/architecture/README.md).

## Canonical Party Types

NuBlox has exactly four business Party Types:

```text
TENANT
EMPLOYEE
CLIENT
VENDOR_SUPPLIER
```

`PERSON` and `ORGANISATION` are structural identity shapes, not Party Types. Party Types are additive classifications: the same authoritative Organisation may, for example, be both `CLIENT` and `VENDOR_SUPPLIER` without creating duplicate masters.

## Tenant-first web surfaces

NuBlox uses the tenant as the stable business namespace:

```text
/                                 NuBlox public product site
/{tenantSlug}/app                  Private tenant application, e.g. /baesystems/app
/{tenantSlug}/app/auth/sign-in     Tenant employee sign-in
/{tenantSlug}/public               Tenant public site
/{tenantSlug}/public/careers       Tenant careers
/{tenantSlug}/public/candidate     External candidate surface
```

The immutable Tenant ID remains the security/persistence identity and is never part of the normal tenant URL. The slug is human routing metadata derived from the business name by default: `BAE Systems → baesystems → /baesystems/app`. Employee application session cookies are scoped to `/{tenantSlug}/app` and are not sent to the explicit `/{tenantSlug}/public` namespace.

## Authentication foundation

Tenant application authentication is separate from NuBlox business authorisation.

Current authentication controls include:

- tenant-scoped opaque server sessions and path-scoped cookies;
- verified-email requirement for public registrations;
- single-use expiring email-verification challenges;
- single-use password-reset challenges with session revocation after reset;
- retryable identity-message outbox with secret-link purging after delivery;
- persistent HMAC-hashed throttling for login, registration, verification resend and reset requests;
- generic recovery responses that do not disclose whether an account exists.

Production identity-message delivery uses the configured HTTPS delivery webhook. Run `pnpm auth:dispatch-messages` to dispatch one queued batch; production deployment must run that worker/schedule continuously enough for timely security email.

## Local application

The V3 web application now has a protected tenant shell. Application login identity is deliberately separate from NuBlox Permission, Responsibility and Authority.

```bash
cp .env.example .env
# Edit .env, then load it into the shell for database/bootstrap CLI commands.
set -a
source .env
set +a
pnpm install
pnpm db:migrate
```

For the first controlled local account, set the `NUBLOX_BOOTSTRAP_*` values shown in `.env.example`, then run:

```bash
pnpm auth:bootstrap
pnpm dev
```

Open the local URL shown by Vite. The public NuBlox product page remains at `/`. Tenant traffic is explicit: use `/{tenantSlug}/app` for the private application and `/{tenantSlug}/public` for the Tenant public surface.

Public tenant self-registration is available at `/register`. Registration atomically creates the Tenant, authoritative `TENANT` Party and Organisation, the registrant's `EMPLOYEE` Party and Person identity, tenant membership and initial Tenant-administrator access, then establishes the tenant-scoped application session. It deliberately does not fabricate a Job Profile, Position or Position Occupancy.

## Terminal logging

NuBlox includes terminal logging utilities that redact common secrets before writing logs.

- Logs are written to `logs/terminal/`.
- Redaction is handled by `scripts/redact-terminal-log.sh`.
- Start a logged interactive shell with `pnpm terminal:logged`.
- List recent logs with `pnpm terminal:logs`.
- Tail the latest log with `pnpm terminal:tail`.

If you source `scripts/terminal-logging/auto-start-hook.sh` from your `~/.zshrc`, new interactive shells started in this workspace automatically relaunch through the logged terminal wrapper. Set `NUBLOX_TERMINAL_LOGGING_DISABLE=1` to skip this behavior temporarily.

## Non-negotiable rule

**NuBlox is the product and the operating environment. External products are benchmarks or migration/import/export sources and targets only. No external application may be required to execute a NuBlox capability or complete a user's work.**
