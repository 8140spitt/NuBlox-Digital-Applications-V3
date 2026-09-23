# PTC Windchill REST Services — Domain, Entity and Transaction Model

**Status:** Active reference evidence  
**Primary target:** Windchill REST Services 2.0 associated with the Windchill 12.0.2 study  
**Purpose:** Record the API architecture and integration semantics that must be understood before translating Windchill integration patterns into NuBlox.

> This is Windchill reference evidence, not a NuBlox design decision.

## 1. Core architecture

Windchill REST Services (WRS) is a separately versioned module that exposes Windchill capabilities through OData.

The fundamental hierarchy is:

```text
WRS servlet
  -> Domain
      -> Entity Set
          -> Entity
              -> Structural properties
              -> Navigation properties
              -> Bound functions
              -> Bound actions
      -> Unbound functions
      -> Unbound actions
```

A **domain** is an OData service representing a functionally bounded area of the Windchill schema. Domains expose Windchill object types and collections as OData entity types and entity sets.

The API model is therefore not a direct table-oriented persistence API.

## 2. Runtime discovery

The service is discoverable at runtime:

```text
/Windchill/servlet/odata/
    -> installed domains

/Windchill/servlet/odata/<Domain>/
    -> entity sets in that domain

/Windchill/servlet/odata/<Domain>/$metadata
    -> complete EDM/CSDL for entities, relationships and operations
```

The domain metadata is the authoritative machine-readable contract for the domain version installed on a particular Windchill system.

Not every entity has a top-level entity set. Some entities are reachable only through navigation from another entity.

Example semantic pattern:

```text
Part
  -> Uses
      -> PartUse
```

This distinction is important: **object existence does not imply an independent collection endpoint**.

## 3. Domain catalogue — WRS 2.0

PTC documents the following domain families in WRS 2.0:

| Domain family | Functional boundary |
|---|---|
| Product Management | Parts, product structures/BOM and related product data |
| Document Management | WTDocument-style managed documents |
| Windchill Administration | Administration/security audit |
| Data Administration | Containers including Organisations, Products, Libraries and Projects |
| Principal Management | Users and groups |
| Common | Shared utility entity types |
| Navigation Criteria | Product-structure filtering/navigation criteria |
| Dynamic Document Management | Dynamic documents |
| Parts List Management | Service parts lists and list items |
| Service Information Management | Service-information objects and structures |
| Quality Management System | Quality-management entities |
| Nonconformance | NC process objects |
| CAPA | Corrective/preventive action objects |
| Customer Experience Management | Customer-experience quality objects |
| Regulatory Master | Regulatory master data |
| Audit | Quality audit objects |
| Info*Engine System | Info*Engine tasks |
| Factory | Factory/manufacturing data |
| Manufacturing Process Management | Process plans and manufacturing process data |
| Change Management | Change-management objects |
| Classification Structure | Classification trees/nodes |
| Saved Search | Saved searches |
| Visualization | Representations/visualisation services |
| Product Platform Management | Options and variants |
| CAD Document Management | CAD/EPM document data |
| Effectivity Management | Effectivity |
| Event Management | Events |
| Supplier Management | Supplier/sourcing data |
| Workflow | Workflow/work items |
| Windchill | Cross-cutting Windchill operations |
| UDI | Unique Device Identification |

Some domains are available only when the corresponding Windchill solution/module is installed.

## 4. Entity semantics

An entity configuration can define:

- structural properties;
- navigation properties;
- inherited Windchill capabilities;
- bound functions;
- bound actions;
- subtype exposure/exclusion;
- custom processing hooks.

PTC domain configuration is stored separately from customer customisation. PTC explicitly recommends extending domains through the custom configuration path rather than editing the PTC-supplied configuration, because vendor updates can overwrite the supplied files.

This establishes a useful separation between:

```text
vendor domain contract
    +
customer extension contract
```

rather than modifying the base contract in place.

## 5. Actions vs functions

The OData distinction is material:

- **functions** are operations used to calculate/retrieve information;
- **actions** can change entity/system state and are invoked using POST.

Actions may be bound to a particular entity type or may be unbound.

Example: the Workflow domain exposes state-changing Workitem operations such as completing and saving a Workitem.

Therefore an API operation such as:

```text
CompleteWorkitem
```

is not equivalent to updating arbitrary Workitem fields. It represents a governed domain command.

## 6. CRUD and navigation

Entity sets support normal OData operations where enabled:

- GET — retrieve;
- POST — create;
- PATCH/PUT — update where supported;
- DELETE — delete where supported.

Object-reference identity is used as the key for Windchill entities.

Relationships are navigated through OData navigation paths rather than requiring clients to reconstruct joins.

This reinforces the distinction:

```text
entity identity
!=
entity-set membership
!=
relationship navigation
!=
domain command
```

## 7. Batch and transaction semantics

WRS supports `$batch`.

A batch may contain:

1. independent requests; and
2. **change sets**.

Independent requests are processed separately; failure of one does not inherently roll back the others.

A change set is an **atomic Windchill transaction**:

```text
request A
request B
request C
    |
    +-- any request fails
            -> entire change set fails
            -> earlier modifications are rolled back
```

PTC also supports Content-ID references between parts of a batch so a later operation can consume identity/property information returned by an earlier operation.

This is a stronger semantic boundary than simply sending many HTTP requests at once.

## 8. Error contract

Documented WRS response semantics include:

| HTTP | Meaning in WRS |
|---|---|
| 200 | successful retrieval/operation returning content |
| 201 | resource successfully created |
| 204 | successful update/delete/action with no response body |
| 400 | malformed or unprocessable client request |
| 403 | request understood but caller lacks required permission |
| 404 | requested domain version/navigation/entity is unavailable |
| 500 | unexpected runtime processing failure |
| 501 | valid OData request whose requested functionality is not implemented |

A permission failure is therefore semantically **403**, not an internal-server failure.

## 9. Versioning

WRS has its own release cycle and domain APIs can have independent versions.

PTC records domain-specific version changes where entity placement, mandatory properties, action/parameter naming or exposed behaviour changes.

Therefore integration compatibility must be assessed at least across:

```text
Windchill product version
+
WRS module version
+
domain API version
+
installed optional modules
+
customer domain extensions
```

A single "Windchill version" is insufficient to describe the external API contract.

## 10. Evidence implications for NuBlox

The Windchill benchmark supports the following **candidate** NuBlox principles, still subject to the architecture translation stage:

1. APIs should expose canonical domain objects and commands, not persistence tables.
2. Read models, navigations and state-changing commands should remain semantically distinct.
3. Machine-readable API metadata/versioning should make installed capability discoverable.
4. Cross-object transactional commands require an explicit atomic boundary.
5. Permission denial must remain distinguishable from application/runtime failure.
6. Extension mechanisms should augment a stable base contract instead of modifying vendor/core definitions in place.
7. Capability availability should be discoverable rather than assumed.

## 11. Open research items

WHC-039 remains open until these are completed:

- significant entity-set catalogue for every WRS 2.0 domain;
- bound/unbound action catalogue;
- bound/unbound function catalogue;
- common navigation/capability inheritance matrix;
- endpoint availability by optional Windchill module;
- domain version matrix across the WRS release associated with Windchill 12.0.2;
- authentication/nonce/security behaviour;
- pagination/query and concurrency semantics;
- exact retry/idempotency guidance for state-changing operations.

## Primary PTC evidence

- Windchill REST Services overview: https://support.ptc.com/help/windchill_rest_services/r2.0/en/windchill_rest_services/WCCG_RESTAPIsWRS.html
- Accessing Domains: https://support.ptc.com/help/windchill_rest_services/r2.1/en/windchill_rest_services/WCCG_RESTAPIsAccess.html
- WRS 2.0 Help Center: https://support.ptc.com/help/windchill_rest_services/r2.0/en/windchill_rest_services.html
- Product Management Domain: https://support.ptc.com/help/windchill_rest_services/r2.0/en/windchill_rest_services/prodmgmtdomain.html
- Configuring Entities: https://support.ptc.com/help/windchill_rest_services/r2.1/en/windchill_rest_services/WCCG_RESTAPIsConfiguingEntitiesInADomain.html
- Processing Batch Requests: https://support.ptc.com/help/windchill_rest_services/r2.7/en/windchill_rest_services/WCCG_RESTAPIsBatchSupport.html
- HTTP Status Codes: https://support.ptc.com/help/windchill_rest_services/r2.1/en/windchill_rest_services/wccg_rest_error_codes.html

## Source-version note

Where the WRS 2.0 Help Center index exposes only incomplete text for a specific framework behaviour, a later PTC WRS page has been used only where it documents the same framework concept. Those items must remain version-checked as the domain/action catalogue is completed.
