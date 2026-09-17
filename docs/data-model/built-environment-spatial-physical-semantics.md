# Built Environment Spatial & Physical Semantics

**Status:** governed logical-model baseline  
**Date:** 17 September 2026  
**Scope:** NuBlox V3 permanent built-environment context

## Purpose

This document governs the spatial and physical identity model that connects construction delivery to the permanent built environment. The machine-readable authority is `app/src/lib/data/built-environment-spatial-model.ts`.

NuBlox must distinguish the Project structures used to deliver work from the Site, Property, Building, Infrastructure, System and Asset identities that survive after the Project has closed.

## Governing principle

```text
Project / WBS / Schedule
        |
        | delivers, changes, evidences
        v
Permanent built-environment identities
```

A Project can create or modify a Building, Infrastructure Entity, System or Asset, but the Project does not own that object's whole-life identity.

## Canonical patterns

### Estate / property pattern

```text
Estate
  -> Site / Land Parcel
     -> Property
        -> Building / Facility
```

Estate is a management context. Site is a stable spatial/business location. Land Parcel is the governed cadastral/spatial land extent. Property is the real-estate identity. Building is a physical built entity. Facility is an operational/service-delivery place and may occupy one or more Buildings or Infrastructure Entities.

### Building spatial pattern

```text
Building
  -> Level
     -> Space

Zone overlays Space / Level / Site / other extents
```

Zone is deliberately an overlay rather than a mandatory strict hierarchy node.

### Linear infrastructure pattern

```text
Network
  -> Infrastructure Entity
  -> Linear Segment
       -> Linear Reference
```

Road, rail, utility and other networked infrastructure must not be forced into Building -> Level -> Space semantics.

### Technical pattern

```text
System
  -> System (subsystem through hierarchy)
  -> Asset
       -> Component
```

`Subsystem` is another System in hierarchy. `Item` defines the product/material/service; `Asset` is the governed installed or operational instance. Plant, equipment, vehicles, tools, meters and sensors reuse Asset identity when individually managed.

## Key semantic distinctions

- **Site != Project.** Construction mobilisation is a Project-to-Site operating context.
- **Property != Building.** Property is a real-estate identity and may comprise land, buildings or infrastructure.
- **Facility != Building.** Facility is operational; Building is physical.
- **System != spatial hierarchy.** A System can span several Spaces, Buildings or infrastructure extents.
- **Asset != Item.** Item is definition; Asset is an instance with whole-life history.
- **Component != duplicate Asset.** Components are technical/configuration constituents. Where independent whole-life management is required, the physical object is represented by a canonical Asset.
- **Maintainable Item is not a separate physical master.** Maintainability is a designation/relationship applied to Asset or Component.
- **Lifecycle Status is not a business object.** State is governed through lifecycle definitions and state semantics.

## Whole-life continuity

Site, Building, Infrastructure Entity, System and Asset identities survive:

- design and construction;
- commissioning and handover;
- changes of accountable organisation/operator;
- location and configuration changes;
- maintenance and renewal;
- financial treatment changes;
- sustainability/carbon reporting;
- refurbishment and later Projects;
- decommissioning and disposal.

Handover changes responsibility and status; it does not recreate the physical object.

## Relationship/effectivity rules

Relationships that can change over time must preserve effectivity and history. This includes:

- Estate membership;
- Site/parcel/property association;
- Facility accommodation;
- Network membership;
- Zone membership;
- System hierarchy and system-to-asset membership;
- Asset location/linear placement;
- configuration membership;
- Project delivery provenance.

The logical model does not require one physical database table per relationship. The physical persistence design must preserve the semantics, effectivity and auditability.

## Construction delivery linkage

Project/WBS/Schedule structures reference built-environment identities rather than substituting for them.

Examples:

```text
Project A
  -> delivers Building B
  -> installs Asset X
  -> modifies System S

Project B (years later)
  -> refurbishes Building B
  -> replaces Asset X with Asset Y
  -> modifies System S
```

Building B and System S remain the same canonical identities across both Projects. Asset X retains its historical identity after replacement/disposal, and Asset Y receives a new identity.

## Canonicalization decisions

The first built-environment normalization baseline is maintained in `app/src/lib/data/built-environment-canonicalization.ts` and is seeded into the Canonical Business Object Workbench without overwriting stakeholder decisions.

Important normalizations include:

- Development `Land Parcel` -> shared Land Parcel identity;
- construction `Zone` -> shared Zone identity;
- `Subsystem` -> System in hierarchy;
- `Plant`, `Equipment`, `Vehicle`, `Tool`, `Meter`, `Sensor` -> typed/classified Asset where individually governed;
- `Maintainable Item` -> maintainability assignment/designation;
- `Condition Point` -> child/configuration point;
- `Condition Assessment` -> event/evidence;
- `Lifecycle Status` -> state, not an object;
- `Installed-base Relationship` -> governed relationship.

## Physical implementation boundary

This logical model does **not** imply:

- one mandatory hierarchy for all building and infrastructure sectors;
- that every spatial association is a foreign-key parent/child relation;
- that BIM model hierarchy is the canonical business hierarchy;
- that WBS or schedule structure becomes the permanent asset hierarchy;
- separate construction, FM, finance or sustainability asset masters;
- that a binary model/file is the canonical source of asset identity.

Physical aggregates, APIs, events, projections and persistence must implement these semantics without redefining them.
