# PTC Windchill — Version, Revision, Iteration, View & Configuration Semantics

**Status:** Active benchmark evidence — object-family pass in progress  
**Primary source:** PTC Windchill Cloud 12.0.2.0 Help Center  
**Last updated:** 23 September 2026  
**Purpose:** Separate object identity, master identity, revision, iteration, working copy, view-dependent version and configuration selection before NuBlox defines controlled Work Product version semantics.

> This is reference evidence. It does not automatically establish NuBlox versioning rules.

## 1. Master, revision, iteration and version are different identities

For version-controlled Parts and Documents, Windchill creates a **Master** and an initial **Version**.

Example:

~~~text
Master: DOC-001
  ├── Revision A
  │     ├── A.1
  │     ├── A.2
  │     └── A.3
  └── Revision B
        └── B.1
~~~

PTC defines:

- **Master** — common identity/attributes shared across versions.
- **Revision** — major controlled version branch/level.
- **Iteration** — successive checked-in development states within a revision.
- **Version** — the combination of revision + iteration, such as A.3.

Normal check-out / modification / check-in creates the next **iteration**.

The **Revise** action starts the next **revision**, normally resetting the iteration sequence; e.g. A.2 → B.1.

Therefore a revision is not simply "the next saved file."

## 2. Context changes versioning semantics

PTC states that the versioning rules for Parts, Documents and CAD Documents apply to those created in **Product or Library** contexts.

It also explicitly states that **Documents, CAD Documents and Parts created within Project or Program contexts are not versioned objects**.

This is a significant distinction:

| Context | Part / Document / CAD version semantics |
|---|---|
| Product | Master + revision + iteration |
| Library | Master + revision + iteration |
| Project | Objects created there are not versioned using the Product/Library revision model |
| Program | Objects created there are not versioned using the Product/Library revision model |

Cross-context sharing/PDM checkout must therefore preserve the difference between collaborative Project content and authoritative PDM-controlled Product/Library objects rather than pretending they use one lifecycle/version model.

## 3. Versioning scheme is inherited configuration

Versioning schemes are governed configuration, not hard-coded labels.

PTC supports versioning rules established at Site and optionally specialised at:

- Organisation;
- Product;
- Library.

Object Initialisation Rules can assign a versioning scheme by object type.

The resulting identifier syntax (alphabetic, integer, list-based, state-based or customised) is separate from the semantic distinction between Revision and Iteration.

NuBlox must therefore avoid embedding assumptions such as "revision is always A/B/C" into canonical identity.

## 4. Part Views create independent version branches

Windchill Parts have another axis: **View**.

Views form an administered parent/child hierarchy, for example:

~~~text
Engineering
  └── Manufacturing
        ├── Facility 1
        ├── Facility 2
        └── Facility 3
~~~

A **New View Version**:

- derives a Part version from a parent View;
- initially inherits information including the Part structure;
- can then be modified independently in the child View.

Crucially, the first version in a newly created View begins a **new revision sequence**.

Example from PTC semantics:

~~~text
Engineering View
  Revision B
      ↓ derive new view
Manufacturing View
  Revision A

Engineering can continue B → C → D ...
Manufacturing can continue A → B → C ...
~~~

Each view-dependent version also follows its **own lifecycle process**.

Therefore:

**View != Revision != Lifecycle State.**

## 5. View identity is a configuration dimension, not a UI filter

PTC uses Views to represent semantically different forms of a Part structure such as Engineering and Manufacturing.

A View Version is not just a filtered display of the same revision. It is a separately maintainable version branch derived from a parent View.

For NuBlox this is important evidence for cases where the same governed asset/product/work-product identity needs multiple controlled representations or downstream definitions. Whether NuBlox adopts Windchill-style Views is a later architecture decision.

## 6. CAD Documents participate in the same Product/Library revision framework but relationships can carry forward differently

CAD Documents in Product/Library participate in configured revision/iteration semantics.

However, revising associated objects can have relationship-specific behaviour. PTC documents, for example, configurable carry-forward of Content associations between a Dynamic Document and a Part:

- if only the Dynamic Document is revised, the association is not simply carried to the unrevised Part version;
- if only the Part is revised, the new and old Part versions can retain association to the existing Dynamic Document version;
- if both are revised together, the new versions can receive a new association while old versions retain their historical association.

This demonstrates a critical principle:

**Object versioning and relationship versioning/carry-forward are separate rules.**

NuBlox controlled relationships must therefore define whether they are:

- master-to-master;
- master-to-version;
- version-to-version;
- copied forward on iteration;
- copied forward on revision;
- recalculated by configuration;
- frozen as historical evidence.

## 7. "Latest" is a query/configuration decision, not an object identity

Windchill search/configuration distinguishes:

- all revisions/iterations;
- latest matching version;
- absolute latest version;
- latest iteration of each revision;
- a specific revision;
- a specific iteration.

The exact object selected can therefore depend on query/configuration semantics and access rights.

A relationship or Deliverable record that merely stores "latest" without the governing resolution rule is insufficient for historical reconstruction.

## 8. Configuration selection is separate from version creation

Windchill additionally supports Configuration Specifications and filters such as:

- Latest;
- Baseline;
- As-Stored;
- lifecycle-state criteria;
- View;
- effectivity/applicability in relevant structures.

These mechanisms answer **which existing versions compose a structure/configuration**.

They do not create new revisions or iterations.

This distinction should remain explicit in NuBlox:

~~~text
Version creation
    ≠
Configuration selection
    ≠
Baseline capture
    ≠
Lifecycle release
~~~

## 9. Template definitions can have different version semantics again

Not every governed object family uses Part/Document revision semantics.

For example:

- Workflow Templates are iterated; running process instances remain tied to the template iteration they started with while new instances can use the latest checked-in iteration.
- Life Cycle Templates expose iteration history and are maintained as controlled template iterations.

This reinforces that "versionable" is not one universal behaviour across all business-object families.

## 10. Candidate NuBlox model to test

The benchmark suggests separating:

~~~text
Object Master / Stable Identity
        ↓
Controlled Revision
        ↓
Iteration / Working Evolution
        ↓
Lifecycle State

plus independent dimensions where applicable:

View / Discipline / Downstream Definition
Configuration / Baseline / Effectivity
Representation / Rendition
Relationship carry-forward rules
~~~

A NuBlox Work Product should not need to overload a single version string with all of these meanings.

## 11. Object-family checkpoint

| Object family / situation | Master | Revision | Iteration | View-specific branch | Key exception |
|---|---|---|---|---|---|
| Part in Product/Library | Yes | Yes | Yes | Yes | View branch has independent revision sequence/lifecycle |
| WTDocument in Product/Library | Yes | Yes | Yes | No standard Part-style View | Relationship may resolve to master or version depending link type |
| CAD Document in Product/Library | Version-controlled | Yes | Yes | Not Part View semantics | CAD/Part associations and dependency links have independent carry-forward/build semantics |
| Dynamic Document in Product/Library | Version-controlled | Yes | Yes | Not Part View semantics | Association carry-forward can depend on whether one or both linked objects are revised |
| Part/Document/CAD created in Project/Program | Different model | No Product/Library revision model | No Product/Library revision model | N/A | PTC explicitly says these are not versioned objects |
| Workflow Template | Controlled definition | Not Part-style revision | Iterated | N/A | Running instance remains tied to starting template iteration |
| Life Cycle Template | Controlled definition | Not Part-style revision | Iterated | N/A | Template iteration history is separate from governed object's lifecycle state |

## 12. Remaining work in this research item

The core distinction is now verified, but the fine-tooth-comb object-family pass should still trace:

1. exact revision/iteration semantics for Change objects;
2. Managed Baseline and Managed Collection mutability/version behaviour;
3. Options/Choices/Rules revision families;
4. Quality object versionability;
5. Service-information object versionability;
6. Process Plan / Operation / Resource version semantics;
7. one-off and inserted Part versions;
8. non-latest revise restrictions;
9. exact master-to-master versus master-to-version relationship families;
10. association copy-forward rules across the CAD ↔ Part matrix.

Until those are closed, WHC-017 remains a deep-pass area with explicit residual edge cases rather than a finished exhaustive object-family register.

## Primary PTC sources

- Administering the Versioning of Parts, Documents, and CAD Documents — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WCAdminContextAdminVersionPartDocCADDoc.html
- Creating New View Version — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PMNewViewVersionCreate.html
- Working with Views and View Associations — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ViewAdminViewWorkWith.html
- Configuring the Revision of Associated Items — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WWGMNXAdminConfigRevisionAssocItem.html
- Non-Latest Iterations Using Multiple Criteria — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/LclSrchAdvancedSearchExampleNonLatest.html
