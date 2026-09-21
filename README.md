# NuBlox

**NuBlox is an enterprise operating platform.**

This repository is the clean product foundation for NuBlox. It is intentionally not organised around any incumbent ERP, PLM, CDE or project-management product.

NuBlox has three product layers:

1. **Enterprise Kernel** — canonical enterprise objects and shared control services.
2. **Functional Domains** — 29 governed enterprise functions operating on the common kernel.
3. **Industry Solutions** — industry-specific configurations, beginning with Construction & the Built Environment.

A fourth architectural concern, the **Native Work-Delivery Runtime**, turns governed capability into executable work, deliverables, decisions, evidence and controlled records.

## Product architecture

```text
NuBlox Enterprise Operating Platform
├── Enterprise Kernel
│   ├── Canonical object graph
│   ├── Identity, organisation and authority
│   ├── Workflow, lifecycle and change
│   ├── Information, records and baselines
│   └── Events, decisions, evidence and audit
├── Functional Domains
│   ├── 29 governed functions
│   ├── Native domain tools
│   └── Shared cross-domain processes
├── Native Work-Delivery Runtime
│   ├── Deployments and assignments
│   ├── Work and deliverables
│   ├── Review, approval and acceptance
│   └── Evidence and records
└── Industry Solutions
    └── Construction & Built Environment
        ├── 16 delivery domains
        ├── 84 job profiles
        └── Projects, contracts, packages, sites and assets
```

## Repository map

- `docs/architecture/` — governing product architecture.
- `docs/reference/` — external product benchmarks and migration mappings.
- `apps/web/` — clean NuBlox web application shell.

Start with [the architecture index](docs/architecture/README.md).

## Local application

The V3 web application now has a protected tenant shell. Application login identity is deliberately separate from NuBlox Permission, Responsibility and Authority.

```bash
cp .env.example .env
pnpm install
pnpm db:migrate
```

For the first controlled local account, set the `NUBLOX_BOOTSTRAP_*` values shown in `.env.example`, then run:

```bash
pnpm auth:bootstrap
pnpm dev
```

Open the local URL shown by Vite. The public product page remains public; `/app` redirects to `/login` until a valid tenant/person session exists.

Authentication uses a provisioned application account mapped to an active tenant-scoped `Person`, scrypt password hashing and server-side opaque sessions. Public self-registration is intentionally not provided.

## Non-negotiable rule

**NuBlox is the product and the operating environment. External products are benchmarks or migration/import/export sources and targets only. No external application may be required to execute a NuBlox capability or complete a user's work.**
