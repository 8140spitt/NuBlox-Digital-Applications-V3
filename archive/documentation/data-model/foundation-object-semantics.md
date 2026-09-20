# Foundation Object Semantics

**Status:** governed logical-model baseline  
**Date:** 16 September 2026  
**Scope:** NuBlox V3 foundation canonical objects

## Purpose

This document governs the first detailed semantic contracts for the NuBlox canonical object spine. It follows the foundation canonicalization baseline and defines stable identity, business identifiers, scope, lifecycle, version/history semantics and the principal cross-object relationships before physical persistence is designed.

The machine-readable authority for these definitions is `app/src/lib/data/foundation-object-model.ts`.

## Governing rules

1. **System identity is immutable.** Business numbers, names, classifications and relationships may change without changing the canonical object identity.
2. **Business identifiers are not primary identity.** Project number, contract number, item number, document number, asset tag and similar references are governed attributes/identifier records.
3. **Object lifecycle is not workflow.** Review, approval and task assignment do not become lifecycle states unless they represent a real state of the domain object.
4. **Project stage is not Project identity.** Design, construction, handover and similar stages are classifications/gates associated with one stable Project.
5. **Version semantics are object-specific.** Party/Person/Organisation use audited history; Legal Entity/Organisation Unit/Site rely heavily on effectivity; Contract uses controlled amendments; Information Container and Item may use revision/iteration; System/Asset use configuration history.
6. **Relationships carry context.** Role, responsibility, effectivity, authority, provenance and other contextual meaning belongs on relationships where appropriate rather than on duplicated masters.
7. **Whole-life identities survive handover.** Site, System and Asset are not recreated when responsibility passes from project delivery to operations.

## Foundation objects

| Model ID | Canonical object | Identity rule | Primary semantic treatment |
| --- | --- | --- | --- |
| CBO-TENANT | Tenant | immutable platform scope ID | platform root; configuration separately governed |
| CBO-PARTY | Party | stable tenant Party ID | common identity abstraction |
| CBO-PERSON | Person | stable Person ID linked to Party | natural-person specialization |
| CBO-ORGANISATION | Organisation | stable Organisation ID linked to Party | organisation specialization independent of customer/supplier roles |
| CBO-LEGAL-ENTITY | Legal Entity | stable Legal Entity ID linked to Organisation | statutory/accounting specialization |
| CBO-ORGANISATION-UNIT | Organisation Unit | stable structural ID | effective-dated enterprise structure |
| CBO-PROJECT | Project | stable Project ID | delivery identity; `Job` is an alias in project-controls context |
| CBO-SITE | Site | stable Site ID | shared spatial identity across delivery and operations |
| CBO-CONTRACT | Contract | stable Contract ID | agreement identity with controlled amendments |
| CBO-INFORMATION-CONTAINER | Information Container | stable container ID | revision/iteration-controlled information identity |
| CBO-ITEM | Item | stable Item ID | shared product/material/service definition |
| CBO-SYSTEM | System | stable System ID | configuration-controlled technical/functional system |
| CBO-ASSET | Asset | stable Asset ID | whole-life asset identity |

## Version/history patterns

### History only

Party, Person, Organisation and Project keep one stable identity. Attribute changes are auditable; separate controlled objects such as project baselines or plans carry their own version semantics.

### Effective dated

Legal Entity, Organisation Unit and Site use effective dating for changes such as registrations, hierarchy, accountability, boundaries and relationships. Historical truth is preserved.

### Amendment controlled

Contract identity remains stable. Executed terms are frozen and later commercial/legal change is represented by amendments, variations and related evidence rather than silent overwrite.

### Revision and iteration

Information Container separates stable identity, governed revision/business issue, working iteration and file/representation. Item uses controlled revisions when its technical/commercial definition requires them; simple price/supplier changes remain separate/effective-dated relationships.

### Configuration controlled

System and Asset retain stable identity while membership, location, configuration, condition and ownership/accountability change through controlled history and effectivity.

## Principal relationship rules

The baseline relationship graph is deliberately logical rather than a relational schema.

- Person **specializes** Party.
- Organisation **specializes** Party.
- Legal Entity **specializes** Organisation.
- Organisation Unit is **part of** Organisation and may be **accountable to** a Legal Entity.
- Project is **accountable to** a Legal Entity, **delivered by** Organisation Units and **occurs at** one or more Sites.
- Contract has Parties through a governed **Contract Party Role** relationship and may span one or more Projects.
- Information Container may describe/evidence Project, Site, Contract, System and Asset without duplicating those identities.
- Asset may be an **instance of** Item, **member of** System, **located at** Site and retain **delivery provenance** to Project.
- System is located in a Site/spatial context and maintains configuration-controlled Asset membership.

The complete edge set and cardinality guidance are maintained in `foundationRelationships` within the machine-readable model.

## Lifecycle boundary examples

### Project

`Proposed → Approved → Active → On Hold → Completed → Closed / Cancelled`

Design/construction/handover stages are separate from this lifecycle.

### Contract

`Draft → Negotiation → Executed → Effective → Suspended → Expired / Terminated → Closed`

Approval tasks and commercial claims are not Contract lifecycle states.

### Information Container

`Work in Progress → In Review → Shared → Published → Superseded → Archived`

Suitability, purpose of issue and security classification remain separate attributes.

### Asset

`Planned → Ordered → Received → Installed → Commissioning → In Service → Out of Service → Decommissioned → Disposed`

Condition, maintenance status, warranty status and accounting status remain separate dimensions.

## Physical implementation boundary

This logical model does **not** imply:

- one database table per canonical object;
- direct foreign keys for every relationship;
- one universal status enum;
- one universal version/revision engine;
- that every relationship is a simple join table;
- that one workspace owns shared identity.

Physical aggregates, commands, persistence boundaries, events and read models must implement these semantics without redefining them.
