# NuBlox V3 Application

This directory contains the greenfield NuBlox V3 tenant application.

## Current foundation

The first runnable slice establishes:

- SvelteKit 5 / TypeScript / pnpm application tooling;
- the shared tenant application shell;
- the canonical 29-function workspace directory;
- F01 — Strategy & Enterprise Planning as the first active workspace;
- the standard workspace anatomy: identity, sub-functions, business journey, platform services, integration and data;
- responsive and accessible baseline layout behaviour.

Only F01 is active. F02–F29 are visible as the canonical future workspace set but intentionally non-navigable until each workspace specification is revalidated and implemented.

## Run locally

```bash
pnpm install
pnpm check
pnpm dev
```

Open the URL printed by Vite. The root route redirects to the current demonstration tenant at `/perspective-bc/app/functions/f01`.

## Engineering rule

The UI is data-driven from canonical workspace definitions. Function workspaces may have different business content, but they use shared shell and interaction primitives rather than creating independent mini-applications.
