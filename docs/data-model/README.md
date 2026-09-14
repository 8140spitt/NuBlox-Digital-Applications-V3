# Canonical Data Model

This directory governs the NuBlox V3 canonical information model.

## Principles

- Business meaning is defined before physical schema design.
- Every material business object has one authoritative owner.
- Shared identifiers do not imply shared write ownership.
- Lifecycle state is explicit where business rules depend on it.
- Historical and audit evidence is preserved rather than overwritten when accountability requires it.
- Tenant, organisation, project/programme, asset and other relevant scopes are explicit.
- Reference data and classifications are governed separately from transactional records.
- Documents may support evidence but do not replace structured business state.
- Read models, analytics and search indexes are projections of canonical truth.
- Integration payloads adapt to the canonical model rather than redefining it.

## Initial modelling sequence

1. Tenant and enterprise identity.
2. Organisation structure and legal/business entities.
3. Person, workforce identity and external parties.
4. Customer, supplier and counterparty master data.
5. Portfolio, programme, project and work breakdown context.
6. Contract, package and commercial structures.
7. Asset, property, site, location and information containers.
8. Generic workflow, decision, approval, delegation, evidence and audit primitives.
9. Domain-specific records introduced through validated vertical slices.

No physical table is considered canonical merely because it is created first.
