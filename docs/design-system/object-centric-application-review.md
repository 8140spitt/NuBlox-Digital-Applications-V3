# Object-Centric Application Review

**Status:** governing review and migration decision  
**Review scope:** complete tenant application runtime currently implemented on `main`  
**Decision:** correct the runtime from function-page-centric presentation to object-centric working contexts before broad F07+ expansion

## Executive conclusion

NuBlox's **semantic and transactional architecture is already substantially object-centric**: canonical identities are defined, 174 aggregate boundaries are frozen, all 1,510 activities are mapped to canonical objects/actions, work/evidence/decision services reference subjects explicitly, and Work Context already stores `objectType` and `objectId`.

The **runtime UX is not yet object-centric**.

The implemented application is predominantly a set of function-local master/detail pages. A user selects a record through a query parameter, works with that record inside the current function page, and then repeats the same navigation model elsewhere. That presentation model obscures the strongest part of the V3 architecture: one canonical object may participate in many functions while retaining one identity.

This review therefore changes the governing runtime rule:

> **Functions are business perspectives and entry points. Canonical business objects are the persistent unit of work.**

A function owns neither the identity nor the screen of a shared object merely because that function performs work on it.

## Repository evidence

The review of the current tenant runtime found:

- **86** tenant `+page.svelte` pages;
- **46** pages under the function route tree;
- **38** implemented operational function pages beneath F01-F06;
- **38/38** operational function pages use a selected-record/master-detail presentation;
- **38/38** corresponding operational server pages use URL search parameters to select/filter working records;
- there is **no dynamic canonical object route** beneath the tenant application;
- the only non-tenant dynamic runtime route is `functions/[function]`;
- the new `ObjectHeader.svelte` has **no runtime consumers yet**;
- **64** pages still use the repeated `hero section-card` pattern;
- no runtime object registry currently resolves a canonical `objectType + objectId` to a stable user-facing object workspace.

Representative current URLs select the working record in-place, for example:

```text
/{tenant}/app/functions/f06/leads?lead={id}
```

That is a useful list/detail prototype, but it should not be the final enterprise object-addressing model.

## What object-centric means in NuBlox

Object-centric does **not** mean one database table, route or microservice per aggregate.

It means that once a canonical object exists, the user can treat that object as a stable working context regardless of which function led them to it.

The operating hierarchy becomes:

```text
Tenant
  -> responsibility / search / function perspective
     -> canonical object
        -> permitted actions
        -> relationships
        -> work
        -> decisions / approvals
        -> controlled information / evidence
        -> lifecycle / versions
        -> history
```

Examples:

- a Lead remains the same Lead while Marketing qualifies it and Sales accepts it;
- a Party remains the same Party across CRM, procurement, HCM, finance and legal;
- a Contract remains the same Contract when commercial management, procurement, finance and project teams act on it;
- a Project remains the same Project across programme controls, document management, commercial, QHSE, finance and asset handover;
- an Information Container remains the same controlled information identity while many functions contribute to its lifecycle.

## Governing navigation model

### Function routes are collection / perspective routes

Function work areas remain first-class because NuBlox still has 29 governed enterprise functions.

Their job is to answer questions such as:

- what work exists in this function?
- what requires attention?
- what records are relevant here?
- what business process or L2 activity am I performing?
- what new object may I create or what existing object may I act on?

A function route therefore owns **lists, queues, dashboards, creation entry points and function-specific projections**.

It should not become the permanent identity of a canonical object.

### Object routes are stable working contexts

The target canonical object address is:

```text
/{tenant}/app/objects/{objectType}/{objectId}
```

where:

- `objectType` is a governed runtime object type key;
- `objectId` is the immutable canonical system identity;
- the originating function is context, not identity.

When useful, origin may be carried separately, for example:

```text
/{tenant}/app/objects/lead/{id}?from=F06.09
```

The object must resolve to the same canonical identity when reached from another function.

## Runtime object registry required

The semantic canonical registers are not themselves a runtime object registry.

NuBlox now requires a small runtime registry that maps a governed object type to its UI/runtime contract.

Each registered object type must define at minimum:

- stable runtime type key;
- canonical model ID;
- owning aggregate ID;
- display singular/plural name;
- reference/title/status projection;
- permission required to read the object;
- canonical href builder;
- loader/resolver;
- supported object-workspace sections;
- supported relationship providers;
- whether version/revision semantics apply;
- whether the type can participate in Work Context, Work Item, Decision and Evidence subjects.

The registry must not duplicate domain truth. It is an address/resolution and presentation contract over canonical domain services.

## Canonical object workspace

`ObjectHeader.svelte` becomes the standard identity surface rather than a decorative function-local hero.

An object workspace should expose only sections relevant to the object, selected from the shared grammar:

1. **Overview** — business identity, purpose and current state.
2. **Details** — governed attributes and current version.
3. **Relationships** — typed links to other canonical objects.
4. **Work** — active and historical Work Items / workflow.
5. **Decisions** — approvals, decisions and delegated-authority evidence.
6. **Information / evidence** — controlled information and governed evidence linked to the object.
7. **Versions / revisions** — where the object's semantic contract requires versioning.
8. **History** — attributable audit/business events.
9. **Function-specific views** — specialist projections contributed by authorised functions without creating a second object identity.

Not every object renders every section.

## Cross-functional contribution model

Object-centric NuBlox must avoid two opposite mistakes:

- **function silo:** every function creates its own copy/screen/identity for the record;
- **giant universal screen:** every possible function is permanently expanded on one object page.

The correct model is a **stable object shell with progressive, permission-aware contributions**.

For example, an Opportunity workspace may expose:

- commercial overview;
- account / Party relationships;
- pursuit / bid relationship;
- estimate relationship;
- contract relationship;
- project conversion;
- active work and approvals;
- evidence / documents;
- history.

Marketing and Sales may enter the object from different workspaces, but the object does not split into separate Marketing Opportunity and Sales Opportunity identities.

## My Work must become object-aware

A Work Item already contains:

- `subjectType`;
- `subjectId`;
- optional `subjectVersion`.

The current My Work UI displays those identifiers but does not resolve them into an object workspace.

Target behaviour:

- the Work Item title remains the task;
- the subject resolves to its canonical object;
- opening the subject opens the object workspace;
- the relevant action/tab may be deep-linked;
- completing a Work Item still does not mutate domain state implicitly;
- protected domain decisions continue through the owning aggregate.

## Task Bar must become object-aware

Work Context already stores:

- `objectType`;
- `objectId`;
- optional `objectVersion`;
- `routePath`;
- optional `workspaceFunctionId`.

This is already close to the correct object-centric contract.

The migration rule is:

- object contexts use a canonical object route;
- `workspaceFunctionId` records the perspective the user came from;
- dirty forms remain recoverable;
- the same object should not create multiple unrelated Task Bar contexts solely because the user reached it through different functions.

## Create / edit behaviour

Create remains appropriate inside a function work area because business intent often starts there.

After successful creation:

```text
function create action
  -> owning aggregate command
  -> object identity created
  -> redirect to canonical object workspace
  -> optional originating function retained as context
```

Edits occur in the object workspace or a governed object-specific action route, not in an unrelated list page.

## Permissions and denied state

Object-centric routing must preserve the existing authority model.

The object resolver must distinguish:

- object not found in the current tenant;
- object exists but the actor cannot read it;
- object is readable but a requested section/action is not permitted.

A permission failure must never collapse into a generic server error.

Where appropriate the denied state provides:

- explanation;
- back/home navigation;
- request-access action;
- reference to the object type/reference without exposing protected data.

## Lists and master/detail pages

The current master/detail pattern is not prohibited, but its role changes.

A split list/detail view may remain useful for rapid triage, provided that:

- selecting a record establishes its canonical object URL/state;
- the full record remains independently addressable;
- browser history works;
- My Work, Task Bar and cross-functional links resolve to the same object;
- the split view is a projection of the object workspace, not a second implementation of domain actions.

The current query-parameter-only selection pattern should therefore be retired for canonical records.

## Application-wide migration programme

### Wave O0 — object runtime foundation

Implement before F07 expands materially:

- runtime object-type registry;
- canonical `objectHref()` / object-address utility;
- `/objects/{type}/{id}` route foundation;
- standard object loader/result contract;
- object workspace shell using `ObjectHeader`;
- common subject resolver for Work Item, Decision, Evidence and Work Context;
- shared related-work, decision, evidence and history panels;
- controlled not-found / denied states;
- object-route acceptance tests.

### Wave O1 — prove the pattern on shared/high-value objects

Migrate first:

1. Party / Organisation;
2. Lead;
3. Business Case;
4. Strategy Framework / Strategic Objective;
5. Information Container.

These exercise identity/master data, commercial hand-off, cross-function reuse, lifecycle/versioning and controlled information.

### Wave O2 — convert all current F01-F06 operational surfaces

Convert the **38** existing operational function pages so they become:

- collection/work-area pages; or
- canonical object workspaces/actions.

No function-local canonical record should remain addressable only through a selection query parameter.

### Wave O3 — build F07 onward object-first

F07 Sales & Commercial Management becomes the first function whose new runtime implementation is designed object-first from the beginning.

Priority object chain:

```text
Lead
  -> Opportunity
     -> Pursuit / Bid Decision
        -> Estimate / Proposal
           -> Contract
              -> Project / Sales Order / downstream delivery
```

Each transition is an explicit cross-aggregate hand-off, not a page-to-page copy.

### Wave O4 — cross-enterprise object continuity

Apply the same model to Project, Contract, Information Container, Item, Asset, Work Order, Risk, Invoice, Party and the remaining shared roots as their runtime waves activate.

## Acceptance gate

A runtime canonical object is not complete until all applicable statements are true:

- it has one stable canonical URL;
- it uses immutable object identity, not business reference, as route identity;
- it opens from every relevant function without creating a second UI identity;
- list/queue rows link to that canonical URL;
- My Work can resolve its subject to that URL;
- Task Bar can pin/resume that URL;
- the object header presents type, reference, title and lifecycle status consistently;
- relationships use canonical object identities;
- actions invoke the owning aggregate only;
- permissions are evaluated independently from assignment;
- decisions/approvals retain exact subject/version/authority evidence;
- controlled information/evidence is linked rather than copied;
- audit/history is attributable;
- versions/revisions are explicit where required;
- denied/not-found/conflict states are designed and tested;
- the originating function is retained only as perspective/context.

## Prohibited patterns after this review

Do not introduce new canonical-record UX that:

- selects its only working record through `?lead=`, `?case=`, `?policy=` or equivalent;
- duplicates the same canonical object in two function-local records;
- treats a function URL as the canonical identity of a shared object;
- embeds every lifecycle action permanently on a single long page;
- exposes aggregate IDs as primary user navigation;
- creates a second Party, Project, Contract, Asset, Item or Information master for a function;
- makes Work Item completion silently change domain state;
- makes workflow assignment imply permission or delegated authority;
- adds F07+ record screens before the object runtime foundation exists.

## Immediate architectural consequence

The next implementation task is **not another F07 feature page**.

The next task is Wave O0: make the canonical object model navigable and executable as a first-class runtime concept. Once that foundation is in place, the existing F01-F06 screens can be migrated systematically and F07 can be implemented without repeating the function-page-centric pattern.
