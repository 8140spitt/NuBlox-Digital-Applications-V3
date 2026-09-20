# NuBlox interaction architecture

## Purpose

NuBlox uses one interaction contract across tenant workspaces so a form is not an isolated page implementation. The contract separates responsibility, active working context, draft state, cooperative editing and transactional authority.

## My Work and Task Bar

**My Work** is assignment and queue authority: it answers what the user is responsible for, eligible to execute or awaiting.

**Task Bar** is personal working context: it answers what the user currently has open. A user can keep several business objects open, move between them and retain draft state without changing assignment or business ownership.

A Work Context pins tenant/user identity, context/object type, object ID, optional object version, title/subtitle, tenant route, optional home workspace function, open/closed state and ordering.

## Progressive form contract

Native HTML POST forms and SvelteKit server actions remain the correctness baseline. JavaScript progressively enhances eligible page-action forms from the application shell.

Enhancement may provide pending/submitting state, server validation without unnecessary page reload, preserved field values after validation failure, dirty-state signalling to the Task Bar, recoverable draft persistence when the form opts into a Work Context and explicit conflict presentation.

A form must remain usable when JavaScript is unavailable.

## Drafts

A Work Draft is a recoverable user working copy, not a business aggregate version. It records the Work Context and form key, canonical base version, JSON form payload, monotonically increasing draft version and ACTIVE / APPLIED / DISCARDED lifecycle.

Autosave updates the Draft only. The canonical object changes only through its server command.

## Edit leases

An Edit Lease provides cooperative edit ownership for a finite period. It contains object type and ID, holder identity/Party/display name, opaque lease token, optional Work Context, base object version and acquired/heartbeat/expiry/release timestamps.

Leases are renewed periodically by the active edit view. They expire after heartbeat loss and are explicitly released on successful save, lifecycle command, edit cancellation or page departure when possible.

Leases are not SQL row locks and never justify holding a database transaction open while a human edits a form.

## Conflict safety

A safe mutable command requires both layers where the object uses leases:

1. the edit session owns a valid active lease; and
2. the submitted canonical aggregate version still equals the expected version.

The lease improves human coordination. The aggregate version is the hard lost-update control.

## Party identity origination

Party is a shared canonical identity authority, not a business-role home.

| Business role | Home function |
| --- | --- |
| Client / customer / sales prospect | F07 Sales & Commercial |
| Supplier / subcontractor / consultant supplier | F09 Procurement & Suppliers |
| Employee / worker / candidate | F15 People & Workforce |
| Legal entity / regulator role | F19 Legal & Secretariat |

The home workflow first resolves an existing canonical Party. Only when no suitable identity exists does it call the shared canonical Person/Organisation creation service, passing immutable Party Origination metadata.

The global Party Directory does not expose normal creation of people, organisations or business relationships. Exceptional canonical corrections are an explicit stewardship operation with separate authority and edit-lease protection.

## Implementation rule

New F07+ workbenches adopt this interaction contract by default. Do not introduce workspace-specific draft stores, browser-only edit locks, long-running database locks, duplicate customer/supplier/person masters or client-side-only validation as the authoritative control.
