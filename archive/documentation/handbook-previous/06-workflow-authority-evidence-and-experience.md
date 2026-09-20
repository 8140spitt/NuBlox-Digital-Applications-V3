# 06 — Workflow, Authority, Evidence & Experience

## Workflow

Workflow coordinates work around canonical business objects.

Core shared concepts include:

- Workflow Definition;
- Workflow Instance;
- Work Item;
- Assignment;
- Review Request;
- Approval Request;
- Decision Request;
- Response;
- Decision;
- Handoff.

A Work Item is not the same thing as a Project Schedule Activity or Work Order.

Workflow never becomes the authoritative business object merely because it coordinates the action.

## Lifecycle

Important objects progress through controlled states.

A lifecycle transition may require:

- valid current state;
- required fields/evidence;
- permission;
- authority;
- review/approval;
- segregation of duties;
- effective dates;
- downstream actions.

NuBlox models business transitions, not unrestricted CRUD.

## Decisions

A decision is immutable attributable evidence of an authorised outcome.

It records, where relevant:

- subject;
- decision;
- actor;
- authority basis;
- threshold/scope;
- rationale;
- conditions;
- timestamp;
- affected objects;
- evidence.

A response is not automatically a decision.

## Permissions and delegated authority

Authorisation is contextual.

```text
Authenticated User
 -> Party
 -> Tenant Membership
 -> Access Role / Permission
 -> Scope
 -> resource/state checks
 -> Delegated Authority / Approval Authority
 -> SoD checks
 -> command allowed or denied
```

Assignment never creates permission.

Delegating work never creates delegated approval authority.

## Denied states

A user lacking authority must receive a controlled denied experience, not a server error.

Where appropriate, the user should see:

- why the action is unavailable;
- the relevant context/object;
- safe navigation back/home;
- request-access route;
- required permission/authority language.

## Evidence and audit

Material actions generate durable evidence.

The system distinguishes:

- domain/business state;
- business event;
- audit event;
- evidence attachment/record;
- outbox/integration delivery state.

These are related but not interchangeable.

For implemented material commands, authoritative state, audit evidence, business-event evidence and transactional outbox state are intended to commit consistently.

## Drafts and editing

A personal Work Draft is not a canonical object version.

Autosave may preserve the user's working form data while the authoritative object remains unchanged until a valid command succeeds.

Edit leases support cooperative editing, while optimistic object versions remain the hard lost-update control.

## My Work vs Task Bar

**My Work** = responsibility/queue authority.

**Task Bar** = personal active working context.

A user can have an object open without being its accountable owner, and can be accountable for work that is not currently open.

## Object Workspace

The canonical object opens consistently regardless of entry point.

Typical workspace sections may include:

- overview;
- details;
- structure;
- related work;
- documents/evidence;
- decisions;
- relationships;
- history;
- available commands.

## Progressive disclosure

The common path stays light.

The UI should show:

1. current context;
2. current state;
3. primary next action;
4. important exceptions;
5. relevant evidence/history on demand.

Users should not be forced to understand the entire workflow graph just to perform today's task.

## High-volume work

High-volume operational work uses appropriate experiences:

- Enterprise Grid;
- bulk edit;
- import;
- saved views;
- filtering;
- validation;
- row/batch exceptions.

Repeated single-record forms are not an acceptable default for enterprise data entry.

## Field/mobile

Field experiences prioritise:

- today's assignments;
- site/location/asset;
- steps/checklists;
- readings;
- inspections;
- photos/evidence;
- time/material;
- completion/sign-off.

They operate on the same canonical objects as desktop.
