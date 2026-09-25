# ADR-0009 — Canonical NuBlox Party Types

**Status:** Accepted  
**Date:** 25 September 2026

## Decision

NuBlox has exactly four canonical business Party Types:

~~~text
TENANT
EMPLOYEE
CLIENT
VENDOR_SUPPLIER
~~~

These are business classifications of a Party. They are distinct from the structural identity shape used to specialise Party data into `Person` or `Organisation`.

## Structural identity versus Party Type

~~~text
Party
├── structural identity
│   ├── PERSON
│   └── ORGANISATION
│
└── Party Type
    ├── TENANT
    ├── EMPLOYEE
    ├── CLIENT
    └── VENDOR_SUPPLIER
~~~

`PERSON` and `ORGANISATION` are therefore not NuBlox Party Types.

## Type rules

- `TENANT` classifies the Organisation Party that represents the business operating the NuBlox tenant.
- `EMPLOYEE` classifies a human Party represented by a `Person` inside the tenant workforce.
- `CLIENT` classifies an Organisation Party with a client/customer relationship to the tenant.
- `VENDOR_SUPPLIER` classifies an Organisation Party with a vendor, supplier, subcontractor or other supply relationship to the tenant.

A Party may hold more than one business Party Type where reality requires it. In particular, the same external Organisation may be both `CLIENT` and `VENDOR_SUPPLIER`. NuBlox must not duplicate the Organisation master to express those relationships.

## Tenant Party binding

Each Tenant has one authoritative Tenant Party binding:

~~~text
Tenant
-> TENANT Party
-> Organisation
~~~

The immutable Tenant ID remains the tenancy/security boundary. The Tenant Party is the business identity of the organisation using NuBlox.

## Employee identity

A person who operates as part of the tenant workforce resolves as:

~~~text
EMPLOYEE Party
-> Person
-> Employment
-> Position Occupancy
-> Position
-> Job Profile
-> Function
-> Governance | Delivery work stream
~~~

Creating a Person establishes the `EMPLOYEE` Party Type. Candidate identity remains external and does not become an `EMPLOYEE` Party until the governed hiring transition creates the tenant workforce identity.

## Client and supplier identity

Sales Account creation establishes `CLIENT` on the authoritative Organisation Party.

Supplier Relationship creation establishes `VENDOR_SUPPLIER` on the authoritative Organisation Party.

These types are additive classifications, not separate customer/supplier master records.

## Persistence

Party Type assignments are stored relationally and tenant-scoped. Party Type changes are governed data and are not inferred from page location or UI state.

The existing `parties.kind` field represents structural `PERSON` / `ORGANISATION` shape only and must not be labelled or exposed as Party Type in user-facing experiences.
