# PTC Windchill — Part Configuration, Physical Instance & As-Maintained State Model

**Status:** Verified benchmark evidence — core physical-instance/configuration semantics mapped; maintenance-event gap identified  
**Primary source:** PTC Windchill Cloud 12.0.2.0 Help Center; current PTC pages used only as labelled corroboration where the 12.0.2 content page is not fully indexed  
**Last updated:** 23 September 2026  
**Purpose:** Separate design/product Part identity, resolved Part Configuration, serial/lot-traced Part Instance, allocation, incorporation and field replacement before NuBlox defines physical Asset and as-maintained configuration semantics.

> This is benchmark evidence. Windchill Part Instance is not automatically the NuBlox Asset model.

## 1. Product definition, configuration and physical instance are separate

Windchill distinguishes at least:

1. **Part / Part Version** — governed product/design definition.
2. **Part Configuration** — a selected/configured set of Part versions and occurrence overrides.
3. **Part Instance** — a uniquely traceable physical/assembled instance, identified by serial number and/or lot number.

A Part Instance can be created from a Part Configuration or directly from a traceable Part and can later be associated to a configuration.

~~~text
Part Master / definition
      ↓
Part Version(s)
      ↓
Part Configuration
      ↓
Part Instance
(serial / lot physical identity)
~~~

## 2. Part Configuration captures a resolved product definition

A Part Configuration can capture selected Part versions, full or partial configuration, occurrence-specific overrides and exceptions to the normal configuration specification.

For an untraced Part, Windchill can explicitly assign a different Part version into a Part Configuration.

For a specific occurrence, an **Override Part Version** can record a field replacement of only that occurrence. PTC's documented example replaces one failed Bearing occurrence at A.1 with C.2 while other occurrences remain at the original definition.

The resulting modified configuration can then be associated with a new Part Instance version, capturing the field modification.

## 3. Part Instance represents the physical traceable item

A Part Instance represents an assembled physical product uniquely identified by serial number, lot number or configured trace-code combination.

Relevant instance information includes:

- Base Part;
- Part Configuration;
- Manufacturer ID where enabled;
- serial/lot identity;
- Estimated Incorporation Date;
- Start Incorporation Date;
- End Incorporation Date.

This is closer to an asset/unit identity than a Part revision.

## 4. Allocation connects physical child instances into a physical parent

Part-instance allocation identifies the actual serial/lot-controlled child instances installed/used in a higher-level physical instance.

A fully described traceable assembly therefore has physical-instance allocation relationships underneath the parent instance.

Windchill can allocate a newly created child Part Instance, allocate an existing Part Instance, deallocate where permitted and show parent/child allocation relationships.

~~~text
Part Usage in design/configuration
          ↓ traceability requirement
Physical Parent Part Instance
          ↓ allocation
Physical Child Part Instance
(serial/lot)
~~~

Allocation and design structure are distinct.

## 5. Incorporation gives physical configuration a temporal validity axis

Windchill tracks incorporation dates on Part Instances.

The Part Instance configuration specification supports:

- **Latest** — latest Part Instance version, optionally constrained by lifecycle state;
- **Incorporation Date** — resolve Part Instance versions in effect at a specified Start or Estimated incorporation date.

The instance itself can carry Estimated Incorporation Date, Start Incorporation Date and End Incorporation Date.

Therefore physical configuration can be resolved by time-in-effect, independently of design revision creation dates.

## 6. Field replacement is configuration history, not just editing the asset row

Windchill's occurrence override pattern demonstrates an as-maintained principle:

- a physical occurrence fails or changes;
- a different Part version is selected for that occurrence;
- a new configuration is captured;
- the physical Part Instance obtains a new version associated with that changed configuration.

The physical identity can therefore remain the same while its configuration evolves.

~~~text
Asset / Part Instance S/N 123
   Version 1
      Bearing occurrence → Bearing A.1
   Version 2
      Bearing occurrence → Bearing C.2
~~~

That is materially different from revising the underlying generic Bearing definition.

## 7. Incorporation constrains later modification/deletion

Once a Part Configuration has been used to create a Part Instance that is later incorporated, some configuration-editing operations are no longer available.

Similarly, a Part Instance can be deleted only when it has not been incorporated, has not been allocated into a higher-level Part Instance and the user has permission.

This shows that physical use/incorporation is a governance boundary, not merely an informational date.

## 8. Instance-related evidence is broader than structure

Part Instance information supports related information such as instance-specific documents, associated Change objects, revision/history timeline and allocation relationships.

A final inspection report is a documented example of a document related to a specific Part Instance version.

This supports a distinction between generic Part documentation, configuration evidence and physical-instance/version evidence.

## 9. As-maintained configuration is not the same as a maintenance event

The reviewed Part Configuration / Part Instance branch provides first-class semantics for:

- serial/lot physical identity;
- actual child-instance allocation;
- incorporation/effective time;
- configuration changes;
- occurrence-level replacements;
- instance-version history;
- related change objects/documents.

It does **not** establish a comprehensive first-class maintenance-management transaction model covering:

- maintenance work order;
- preventive maintenance plan/task;
- inspection round;
- defect/failure event;
- fault diagnosis;
- labour/time booking;
- tool/resource usage;
- spare-part issue/consumption;
- meter/condition reading;
- maintenance instruction/job plan;
- permit/isolation;
- service interval;
- warranty claim;
- maintenance cost;
- maintenance backlog;
- completion/return-to-service;
- statutory inspection/certification.

A replacement can be represented in the resulting physical configuration, but the business event that caused/performed the replacement is not equivalent to the configuration change itself.

## 10. Candidate NuBlox Asset model

The Windchill evidence strongly supports separating:

~~~text
Asset Type / Product Definition
        ↓
Controlled Definition Version
        ↓
Configuration / applicability
        ↓
Physical Asset / Instance identity
        ↓
Physical Configuration Version
        ├── installed component instances
        ├── incorporation/effective period
        ├── location/position
        └── evidence
~~~

from:

~~~text
Maintenance / Inspection / Failure Event
        ↓
work execution
        ↓
parts/resources/labour/evidence
        ↓
configuration consequence
        ↓
new As-Maintained Asset Configuration
~~~

The second chain is a NuBlox/CBE/FM requirement that must be benchmarked against EAM/CMMS/asset-management systems, not inferred from Windchill Part Instances.

## 11. Construction & Built Environment translation

The pattern maps naturally to building/system/equipment type definition, installed asset/equipment serial identity, parent/child system decomposition, installed component instance, commissioning/incorporation date, replacement history, effective/as-maintained configuration by date and asset-specific test/certificate/manual records.

But CBE also requires spatial/location hierarchy, commissioning/system-completion events, maintenance regimes and operational work history beyond Windchill's first-class instance/configuration semantics.

## 12. Research conclusion

The physical-instance/configuration pattern is now sufficiently clear for benchmark purposes:

- Part definition != Part Configuration != Part Instance;
- physical identity is serial/lot traceable;
- physical child-instance allocation is explicit;
- incorporation gives versions temporal in-effect semantics;
- occurrence-level field replacements can evolve physical configuration without changing the generic Part definition;
- incorporated/allocated state constrains deletion/configuration editing;
- instance-specific documents/change/history exist;
- comprehensive maintenance-event semantics remain a genuine CBE/EAM gap.

## Primary PTC sources

- Part Instance Configuration Specification — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/CIInstanceIncorporationConfigSpec.html
- Part Instance Structure Tab — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/CIInstanceStructureTabAbout.html
- Assigning a Part Version in a Part Configuration — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/CIConfigAssignVersion.html
- Overriding a Part Occurrence in a Part Configuration — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/CIConfigOverideOccurrence.html
- Deleting a Part Instance — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/CIInstanceDelete.html
- Current PTC Part Instance Information Page and allocation/create pages used only as corroboration for identity/attribute presentation where the equivalent 12.0.2 page is not fully indexed.
