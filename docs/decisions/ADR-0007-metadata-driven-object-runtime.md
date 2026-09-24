# ADR-0007 — Metadata-driven NuBlox Object runtime

**Status:** Accepted  
**Date:** 24 September 2026

## Decision

NuBlox business object behaviour is resolved from governed database metadata through a stable runtime façade. NuBlox does not generate JavaScript source files or make generated source code the system of record.

The runtime model is:

~~~text
Type Definition
-> effective inherited Fields
-> Defaults / Constraints / Cardinality
-> Lifecycle / Transitions
-> Relationship Types
-> NuBlox ObjectFactory
-> runtime NuBloxObject class
-> canonical Thing identity and values
~~~

`MySqlNuBloxObjectFactory.define(type)` resolves the current effective Type Definition and returns a named runtime JavaScript class. Field definitions are exposed as property accessors while persistence continues to use stable metadata assignment identifiers.

Example:

~~~ts
const ChangeRequest = await factory.define('CHANGE_REQUEST');

const request = new ChangeRequest({
  number: 'CR-000123',
  title: 'Update hydraulic pump'
});

await request.save();
await request.submit();
~~~

`CHANGE_REQUEST` and its fields and lifecycle transitions do not need a bespoke source-code domain class for that API to exist.

## Runtime semantics

The runtime provides:

- metadata-derived field properties;
- local type/required validation before persistence;
- database-enforced defaults, constraints and cardinality;
- single- and multi-value field persistence;
- atomic replacement of existing field values;
- stable-key derivation from `NUMBER`, `CODE` or `ID` when available;
- display-name derivation from common semantic fields when available;
- reload / refresh from the canonical Thing graph;
- relationship inspection;
- lifecycle transitions by metadata transition code;
- generated ergonomic lifecycle methods such as `SUBMIT -> submit()` and `APPROVE -> approve()`;
- JSON projection independent of the underlying storage layout.

Database validation remains authoritative. Runtime validation exists for immediate developer/user feedback and may not weaken or bypass persistence constraints.

## Native authority rule

A runtime class is not a second master-data system.

If a Type has `creationPolicyReference = NATIVE_AUTHORITY`, the ObjectFactory may load and extend its canonical Thing identity but may not generically create that identity.

For example:

~~~text
Organisation authoritative service
-> organisations
-> canonical object
-> ORGANISATION Type binding
-> ObjectFactory.load(...)
~~~

The following is prohibited:

~~~text
ObjectFactory
-> generic ORGANISATION creation
-> canonical object with no authoritative organisation record
~~~

The same rule applies to Person, Position and every future shared object that declares a native source of authority.

## Property mapping

Metadata codes remain the durable contract. JavaScript property names are a runtime convenience.

Examples:

~~~text
TITLE         -> title
CUSTOMER_NAME -> customerName
TOTAL_VALUE   -> totalValue
~~~

The runtime rejects property-name collisions rather than silently shadowing another field or a core `NuBloxObject` method.

## Lifecycle

When a Type has a lifecycle, its active transition definitions are projected into the runtime definition. A transition method is available only where the transition is valid from the object's current lifecycle state.

Transitions that require a governed Decision continue to require that Decision; the generated method does not bypass control-spine rules.

## Authorisation boundary

The current generic runtime deliberately reuses the existing governed Thing command path, which is protected by metadata-management authority.

That is safe but intentionally restrictive.

The next authorisation step is to introduce Type-defined business actions and action permission policies so that:

~~~text
metadata administration
!=
ordinary business object execution
~~~

A user must be able to edit an Opportunity, Change Request, Asset or other business Thing because their position/function/authority permits that business action, not because they can administer metadata.

Until that action-authorisation model exists, the runtime must not weaken the existing permission checks.

## Consequences

1. New configurable business object types do not require bespoke JavaScript classes.
2. Native transactional aggregates may retain dedicated relational persistence where justified.
3. All configurable and native-bound objects still participate in one canonical Thing graph.
4. Object behaviour can evolve through governed metadata without generated-source deployment.
5. UI factories, API schemas, forms and automation can consume the same runtime definition in subsequent slices.
6. Business action authorisation is the next required boundary before the ObjectFactory becomes the ordinary end-user mutation API across all Functions.
