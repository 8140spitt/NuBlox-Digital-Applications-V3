# NuBlox V3 Application

This directory contains the greenfield NuBlox V3 tenant application.

## Current foundation

The application now establishes:

- SvelteKit 5 / TypeScript / pnpm application tooling;
- the shared tenant application shell;
- the canonical 29-function workspace directory;
- F01 — Strategy & Enterprise Planning as the first active workspace;
- F01.01 — Strategy Framework as the first operational persisted business slice;
- SQLite persistence using the Node 22 built-in `node:sqlite` runtime;
- controlled Draft → Review → Approved → Published lifecycle transitions;
- immutable submitted versions, return/rejection decisions and audit evidence;
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

F01.01 records tenant scope in every persisted framework and audit event, but authentication and authorisation are not yet implemented. Audit events therefore use a clearly identified `Development User` actor. This must be replaced by authenticated identity before the slice is considered production-ready.

## Engineering rule

The UI is data-driven from canonical workspace definitions. Function workspaces may have different business content, but they use shared shell and interaction primitives rather than creating independent mini-applications.
