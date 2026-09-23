# PTC Windchill — CAD ↔ Part Association, Build & Synchronisation Model

**Status:** Verified benchmark evidence — core matrix closed  
**Primary source:** PTC Windchill Cloud 12.0.2.0 Help Center  
**Last updated:** 23 September 2026  
**Purpose:** Decompose CAD Document ↔ Part associations into their exact structure, attribute, representation, build and synchronisation semantics before translating them into NuBlox technical-information / work-product relationships.

> This is benchmark evidence. CAD/Part terminology is not automatically a NuBlox object model.

## 1. CAD Document and Part are separate governed objects

Windchill distinguishes:

- the CAD-authoring file/model;
- the Windchill **CAD Document** that governs that CAD definition;
- the Windchill **Part** that represents the enterprise/product definition;
- the CAD Document structure;
- the Part/product structure.

Associations connect CAD Documents and Parts. They do not collapse them into one record.

Windchill supports both directions:

~~~text
CAD-driven / bottom-up
CAD structure
   ↓ build
Part structure

Top-down / reverse build
Part structure
   ↓ build
CAD structure
~~~

The association defines what information may participate in the build. The build operation performs synchronisation.

## 2. Association type is semantic authority

Windchill's five core association types encode different contribution semantics.

| Association | Structure contribution | Attribute contribution | Representation contribution | Build participation | Typical semantic |
|---|---:|---:|---:|---:|---|
| Owner | Yes | Yes | Yes | Yes | Primary CAD definition drives the Part |
| Contributing Image | No structure build link | Yes | Yes | Yes | Secondary CAD definition contributes attributes and representation |
| Image | No | No | Yes | Yes | CAD definition contributes representation only |
| Contributing Content | No | Yes | No | Yes | CAD definition contributes attribute information only |
| Content | No | No | No | **No** | Passive/descriptive CAD content |

This means a relationship cannot be modelled merely as `Part has CAD Document`. The **relationship type itself carries authority semantics**.

## 3. Build links are separate from the visible association label

The association type maps to a Build Rule made from one or more build-link capabilities:

- **Structure**
- **Attribute**
- **Representation**

The mapping is:

~~~text
Owner                = Structure + Attribute + Representation
Contributing Image   = Attribute + Representation
Image                = Representation
Contributing Content = Attribute
Content              = no build links
~~~

For Owner associations, the structure build rule can copy selected immediate CAD member relationships into Part usage relationships.

Therefore:

**Association**
≠ **Build Rule**
≠ **Build execution**
≠ **Resulting Part structure**

## 4. Owner is not just “primary file”

Owner is special because it can:

- drive Part structure;
- pass attributes;
- define representation;
- cause child CAD membership to create/update Part usages where child associations permit participation.

A Part cannot simply accept arbitrary competing Owner semantics. Windchill's association UI applies cardinality/compatibility restrictions and prevents unsupported combinations such as creating an additional Owner association where it is not permitted.

This is evidence that relationship cardinality and compatible relationship types are part of the governed schema.

## 5. Build execution has its own trigger and state semantics

A build may be:

- triggered automatically by configured events; or
- requested manually.

Documented trigger patterns include CAD Document iteration/check-in, Send to PDM and changes relevant to the CAD Document master/build rule.

The build service compares what must be transferred. If the Part structure changes, Windchill creates a new Part iteration. If there is no structural change, the Part is not iterated merely because a build ran.

So:

~~~text
CAD iteration
    ↓
possible Build trigger
    ↓
evaluate Build Rule + source state
    ↓
material change?
   ├── no  → retain Part iteration
   └── yes → update structure / iterate Part
~~~

A synchronisation attempt is therefore not itself a new business-object version.

## 6. Relationship changes can themselves affect Part iteration

Associating/disassociating CAD and Part objects is not metadata with zero configuration effect. The relationship participates in governed configuration and may require iteration of the Part.

NuBlox should therefore treat authoritative technical relationships as controlled configuration data, with their own change/evidence semantics.

## 7. CAD-driven and top-down are two different authoring directions

### CAD-driven / bottom-up

The CAD structure is authoritative for selected structure/attribute/representation information. Build rules translate qualifying CAD relationships to the Part structure.

### Top-down / reverse build

The Part structure can be edited first and then used to reconstruct/update the CAD Document structure.

Windchill tracks build intent so not every enterprise Part must appear in CAD. This matters for items such as manufacturing-only structure that should remain excluded from the design CAD assembly.

The reverse-build process can also update CAD Document usage links from Part usage-link changes.

The architecture lesson is not “always bidirectional sync.” It is that **direction, transfer scope and build eligibility are explicit**.

## 8. Deleted occurrences retain synchronisation intent

When a child Part occurrence is removed from a CAD-driven Part structure, Windchill retains deleted-occurrence information relevant to the paired CAD structure.

A deleted occurrence can have build intent such as:

- **Excluded** — do not propagate the deletion to CAD;
- **To Be Built** — propagate the deletion to the CAD model structure on the next build.

Thus deletion in one structure is not automatically destructive deletion in the other structure.

This is a strong pattern for NuBlox federated technical information:

~~~text
source change
   ↓
difference / pending synchronisation
   ↓
explicit propagation disposition
   ↓
target update
   ↓
evidence of applied result
~~~

## 9. Compare is a first-class reconciliation operation

Windchill provides side-by-side CAD Document ↔ Part structure comparison.

Comparison surfaces at least:

- structure differences;
- child differences;
- build status / intended transfer;
- missing or differing associations;
- items to insert, remove or set for build.

Comparison is therefore not a visual convenience; it is a governed reconciliation surface between independently maintained structures.

## 10. Design Context is a different object again

A **Design Context** is not a Product/Project administrative Context and not a CAD/Part association.

It captures a task-relevant subset of CAD models for a known product configuration, derived from a Configuration Context or workspace, and places those CAD Documents into a workspace for authoring.

NuBlox must preserve this distinction:

~~~text
Administrative Work Context
≠ Product Configuration / Configuration Context
≠ Design Context / authoring scope
≠ CAD ↔ Part Association
≠ Build / synchronisation process
~~~

## 11. Candidate NuBlox translation

For drawings, models and other technical deliverables, the benchmark supports separating:

1. **Authoritative Business Object / Work Product**
2. **Authoring Object / Model / File**
3. **Typed Relationship**
4. **Transfer/Build Rule**
5. **Synchronisation Direction**
6. **Synchronisation Eligibility / Status**
7. **Comparison / Reconciliation Result**
8. **Applied Synchronisation Event**
9. **Derived Representation**
10. **Version/configuration provenance**

A plausible generic pattern is:

~~~text
Source Object/Structure
    │
    ├── Typed Authoritative Relationship
    │       └── transfer dimensions
    │            ├── structure
    │            ├── attributes
    │            └── representation
    │
    └── Synchronisation Rule
             ↓
       Compare / Difference
             ↓
       Build / Reconcile
             ↓
       Target Object/Structure
             ↓
       audit + version evidence
~~~

This is a hypothesis to test across BIM, drawings, schedules, specifications, asset data and downstream manufacturing/construction structures. It is not a decision to clone Windchill's Part/CAD schema.

## 12. Research conclusion for WHC-020

The core CAD ↔ Part relationship/build matrix is now closed at canonical semantic level:

- CAD Document and Part are separate governed objects;
- association type encodes contribution authority;
- exact association → build-link matrix is known;
- Content is passive/non-build;
- build execution is separate from association;
- build only iterates target Part when material structure change occurs;
- CAD-driven and reverse/top-down directions are separate;
- compare/reconciliation is explicit;
- deleted occurrences preserve propagation intent;
- Design Context is separate from administrative/configuration contexts.

Remaining low-level CAD-tool and authoring-application exceptions remain integration detail unless they expose a new canonical relationship pattern.

## Primary PTC sources

- Introduction to CAD and Part Relationships — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/MCPR_CADandPartRelationshipIntro.html
- Build Rules and Build Links — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/MCPR_BuildRulesAndLinksOview.html
- When to Build — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/MCPR_WhenToBuild.html
- Managing Part-CAD Document Relationships — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ProEWCIntegAHPartDoc.html
- Managing Deleted Occurrences in a CAD-driven Part Structure — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/DeletedOccMgmtCADdriven.html
- Updating CAD Document Usage Links — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/UpdatingCADDocUsageLinksOnReverseBuild.html
- Design Context Overview — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/DICAboutDesignContext.html
