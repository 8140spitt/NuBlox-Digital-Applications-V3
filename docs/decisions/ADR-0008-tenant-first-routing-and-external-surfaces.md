# ADR-0008 — Tenant-first routing, authentication boundary and external surfaces

**Status:** Accepted  
**Date:** 25 September 2026

## Context

NuBlox has three distinct web audiences:

1. people evaluating NuBlox as a product;
2. people operating inside a specific tenant business;
3. external people interacting with that tenant, including job candidates.

The tenant must be explicit in the URL before protected business work is entered. Authentication identity and NuBlox enterprise authorisation remain separate concerns.

## Decision

NuBlox uses a tenant-first URL namespace.

~~~text
nublox.com/
    NuBlox public product / marketing site

nublox.com/{tenantSlug}/
    tenant-controlled public site

nublox.com/{tenantSlug}/careers
    public advertised roles

nublox.com/{tenantSlug}/candidate
    external candidate surface

nublox.com/{tenantSlug}/app/
    private tenant enterprise application

nublox.com/{tenantSlug}/app/auth/sign-in
    tenant-scoped employee authentication

nublox.com/{tenantSlug}/app/auth/sign-out
    tenant-scoped sign-out
~~~

## Tenant identity

TenantId is the immutable security and persistence identity.

tenantSlug is unique, human-readable routing metadata.

Every protected request resolves:

~~~text
URL tenantSlug
-> Tenant
-> immutable TenantId
-> authenticated session TenantId
-> exact match required
~~~

The slug never grants access.

## Session boundary

Employee application cookies are scoped to:

~~~text
/{tenantSlug}/app
~~~

They are not sent to the tenant public site or careers surface.

The server-side session also records the immutable TenantId and resolved tenant slug. A URL/session mismatch is denied and the tenant cookie is cleared.

A non-secret root-scoped tenant routing hint may be used only to redirect legacy bare /app/... links into the tenant namespace. It is never authentication or authorisation evidence.

## External identity

A candidate is not a tenant employee merely because they interact with the tenant public site.

The intended recruitment chain is:

~~~text
advertised Position / vacancy
-> external Candidate
-> Job Application
-> recruitment process
-> accepted offer
-> Person
-> Employment
-> Position Occupancy
~~~

Candidate authentication/session state must remain separate from employee application session state.

## Public publication

Tenant public data is an explicit projection of governed tenant data. Internal data is never public by default.

Future public publication metadata must support deliberate publish/withdraw/expiry and field/view control.

## SvelteKit routing

Tenant-first application URLs are rerouted internally to the existing /app/... route tree. This preserves one implementation of each workspace while the browser address remains tenant-first.

## Consequences

- the tenant is visible and stable in all private application URLs;
- one identity may hold separate sessions in several tenants without sharing an employee session cookie;
- public and candidate traffic does not receive the employee application cookie;
- legacy /app/... links can converge safely by immediate tenant redirect;
- all persistence remains scoped by immutable TenantId rather than slug;
- tenant slugs must exclude NuBlox-reserved platform paths.
