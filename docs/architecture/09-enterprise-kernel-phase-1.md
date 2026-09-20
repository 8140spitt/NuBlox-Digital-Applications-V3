# 09 — Enterprise Kernel Phase 1: Canonical Identity Spine

**Status:** Implemented foundation  
**Effective:** 20 September 2026

## Purpose

Phase 1 establishes the first executable kernel boundary beneath every NuBlox function and Industry Solution.

The implementation lives in `packages/kernel` so the model is shared by the whole product rather than owned by the web UI or by any one Function.

## Implemented concepts

### Tenant boundary

Every tenant-owned kernel record carries `tenantId`.

Cross-tenant relationships, occupancies, authority grants and specialisations are rejected by kernel invariants.

### Party and specialisations

`Party` is the canonical enterprise party identity.

`Person` and `Organisation` are explicit specialisations of Party rather than unrelated duplicate identities.

This supports one shared relationship model while preserving person-specific and organisation-specific attributes.

### Organisation structure

`OrganisationUnit` represents governed organisational structure.

Parent/child units must belong to the same Organisation.

### Job Profile, Position and Person

The kernel keeps these distinct:

- `JobProfile` — governed capability profile;
- `Position` — organisational seat;
- `Person` — human party;
- `PositionOccupancy` — effective-dated relationship between Person and Position.

A Position may reference a Job Profile. That does not make the Job Profile the Position or the Person.

### Authority

Authority is modelled separately from permission.

`AuthorityDefinition` describes a kind of decision authority.

`AuthorityGrant` gives that authority to a Person, Position or Organisation Unit for a defined scope, period and optional quantitative limit.

`Delegation` is a separate effective-dated transfer of an existing authority grant.

A UI permission alone can never prove contractual, financial, technical, operational or governance authority.

### Canonical object identity and relationships

`CanonicalObjectIdentity` provides a stable tenant-scoped identity for governed enterprise objects.

`CanonicalRelationship` links two canonical objects using an explicit relationship type and effective period.

The kernel rejects cross-tenant relationships and self-relationships.

## Executable invariants

Automated tests currently verify:

- Person must specialise a PERSON Party;
- Organisation must specialise an ORGANISATION Party;
- specialisation cannot cross tenant boundaries;
- Position and Job Profile remain separate;
- Position Occupancy cannot cross tenant boundaries;
- Authority limits cannot be negative;
- Authority is an explicit scoped grant, not a permission;
- canonical relationships cannot cross tenants.

## Next persistence slice

The next implementation slice will persist this model with:

- canonical identifiers;
- temporal/effective dating;
- uniqueness constraints;
- tenant isolation;
- immutable audit attribution;
- schema migrations;
- transaction boundaries; and
- repository/service APIs.

Persistence must implement this model rather than redefine it.
