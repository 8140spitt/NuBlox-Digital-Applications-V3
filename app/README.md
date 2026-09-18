# NuBlox V3 Application

This directory contains the greenfield NuBlox V3 tenant application.

## Current foundation

The application now establishes:

- SvelteKit 5 / TypeScript / pnpm application tooling;
- the shared tenant application shell;
- the canonical 29-function workspace directory;
- F01 — Strategy & Enterprise Planning as the first active workspace;
- F01.01 — Strategy Framework as the first operational persisted business slice;
- canonical Organisation master data as the first shared `AGG-01-PARTY` runtime;
- tenant, User Identity, Membership, Role, Permission and Role Assignment runtime foundations;
- deny-by-default server command permission checks;
- SQLite persistence using the Node 22 built-in `node:sqlite` runtime;
- append-only platform audit evidence with actor/authority snapshots;
- canonical business events plus transactional outbox messages;
- optimistic version control for Organisation master-data commands;
- controlled Draft → Review → Approved → Published Strategy Framework lifecycle transitions using the shared platform authority/evidence spine;
- automatic supersession when a new approved strategy framework is published;
- responsive and accessible baseline layout behaviour.

F02–F29 remain visible as the canonical future workspace set but intentionally non-navigable until each workspace specification is revalidated and implemented.

## Run locally

```bash
pnpm install
pnpm check
pnpm dev
```

Open the URL printed by Vite. The root route redirects to the demonstration tenant at `/perspective-bc/app/functions/f01`.

The local database is created automatically at `app/data/nublox-v3.db`. Set `NUBLOX_DB_PATH` to use another SQLite file.

## Current security boundary

Runtime authorization foundations are now implemented: active tenant, User Identity → Party linkage, effective tenant Membership, Role Assignment, Role Definition and Permission Definition are resolved before protected commands execute. Material commands retain an authority snapshot in audit evidence.

Production authentication is **not yet integrated**. Local development uses a clearly identified development-only principal which is automatically denied when `NODE_ENV=production`. A production identity/session adapter is therefore the next security implementation step; no development identity fallback is permitted in production.

## Engineering rule

The UI is data-driven from canonical workspace definitions. Function workspaces may have different business content, but they use shared shell and interaction primitives rather than creating independent mini-applications.


## Foundation master data

Open `/[tenant]/app/admin/master-data/organisations` to use the first canonical shared master-data runtime. Organisation is implemented once and is intended to be reused by CRM, procurement, contracts, HCM, finance and project delivery through relationships rather than duplicate company masters.
