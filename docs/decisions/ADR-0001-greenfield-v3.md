# ADR-0001: NuBlox V3 is a greenfield product architecture

- **Status:** Accepted
- **Date:** 2026-09-14

## Context

Earlier NuBlox iterations accumulated valuable business taxonomy, benchmark research, workflows and implementation knowledge, but application structure and user experience evolved unevenly. Reusing that application wholesale would preserve accidental coupling between screens, domains, navigation and historical delivery slices.

The business problem remains valid: NuBlox must support a sophisticated construction and built-environment organisation across a broad enterprise operating model. The implementation therefore needs a clean architectural baseline without discarding validated business knowledge.

## Decision

NuBlox V3 will be developed as a greenfield application and architecture.

Previous repositories may be used as **reference sources** for:

- enterprise-function and sub-function taxonomy;
- business activities and role research;
- SAP and other benchmark mappings;
- validated business rules and terminology;
- lessons from previous workflows, tests and implementation attempts;
- evidence about what worked or failed in the previous UX.

Previous application code, navigation structure, domain boundaries, schemas, permissions and page composition are **not authoritative** for V3. Any element reused in V3 must be independently justified against the V3 product charter and architecture principles.

## Consequences

### Positive

- V3 is free to establish coherent domain and workflow boundaries.
- UX can be designed around work and context rather than inherited routes.
- the canonical data model can be normalised before feature pressure creates duplication;
- permission and audit architecture can be foundational rather than retrofitted;
- old benchmark and taxonomy work remains useful without dictating implementation.

### Costs

- previously implemented features do not count as V3 delivery merely because code exists;
- useful behaviours must be deliberately re-specified and rebuilt or migrated;
- the team must distinguish business truth from implementation history;
- initial visible feature velocity will be lower while foundations are established.

## Guardrail

Copying a legacy file, schema, component, workflow or permission model into V3 requires an explicit reason beyond "it already exists".

The preferred question is: **what is the correct V3 behaviour and ownership model?** Only then should previous implementation be consulted for reusable detail.
