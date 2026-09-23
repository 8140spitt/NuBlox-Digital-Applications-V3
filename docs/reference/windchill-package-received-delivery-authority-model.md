# PTC Windchill — Package, Received Delivery, Mapping & Source-Authority Model

**Status:** Verified benchmark evidence — core exchange/authority semantics closed  
**Primary source:** PTC Windchill Cloud 12.0.2.0 Help Center  
**Last updated:** 23 September 2026  
**Purpose:** Separate Package snapshot, Delivery, Received Delivery, acknowledgement, mapped import, incremental delta handling, local replica state and source authority before NuBlox defines contractual/information exchange and handover semantics.

> This is benchmark evidence. A Windchill package exchange is not automatically a NuBlox contractual handover or transfer of master-data authority.

## 1. Package, Delivery and Received Delivery are different objects/events

Windchill separates:

1. **Package** — the governed collection/snapshot of information selected for exchange.
2. **Delivery** — an outbound transmission/release of package content.
3. **Received Delivery** — the recipient-side governed object used to prepare, preview, map and import received ZIP content.
4. **Imported Objects** — local target-system objects/replicas created or updated from the delivery.
5. **Delivery acknowledgement** — recipient status such as Received, Accepted or Rejected.

These should not be collapsed into one generic "transmittal" row.

## 2. Receipt and acceptance do not transfer object authority

PTC explicitly states that, for objects imported through a Received Delivery, the **sending system is considered the authority** for the shared objects.

The recipient can view and reference the imported information and retains appropriate administrative capabilities, but imported objects are automatically locked against normal local modification.

This produces the authority pattern:

~~~text
Authoritative source system
        ↓
Package snapshot
        ↓
Delivery
        ↓
Recipient acknowledgement
        ↓
Mapped import
        ↓
Controlled target replica/reference
~~~

The recipient's acceptance of the Delivery therefore means acknowledgement/disposition of the exchange, not an automatic change of master-data authority.

For NuBlox, any true transfer of authoritative ownership must be an explicit business event/process in addition to exchange/import.

## 3. Received Delivery is the governed import-control object

The Received Delivery information page is the control point for received ZIP files, manifest information, attachments, preview, mapping, import and import logs/results.

Windchill limits this import workflow to suitable Product/Library contexts and permissions.

This shows that incoming exchange should have its own governed transaction record rather than treating uploaded ZIP files as ordinary attachments.

## 4. Import is governed translation, not blind copying

Target import may require mapping source semantics into the target installation.

The mapping surface includes concepts such as:

- source Context → target Context;
- owning Organisation;
- View;
- lifecycle / lifecycle state;
- folder;
- security labels / values;
- version information / version scheme.

The receiver can preview mapping and conflicts before committing the import.

Therefore a cross-system exchange may preserve business meaning while using different target identifiers/configuration.

NuBlox should retain the mapping provenance used for each exchange/import.

## 5. Context and authority are separate

Imported objects can be mapped into a target Context, but placement in that Context does not make the target Context authoritative for the underlying source-controlled object.

This is especially important for federated projects and supply chains:

~~~text
where the object is stored / visible
        ≠
who is authoritative for its definition
~~~

NuBlox must be able to represent foreign-authority information inside a Project/Contract/Asset Context without implying local ownership of the source definition.

## 6. Lifecycle mapping must not create false target-side authority

PTC recommends mapping imported objects to target lifecycle/workflow configurations that do not introduce ordinary local changes, because later re-imports from the authoritative source can overwrite target-side modifications.

This reveals an exchange-governance principle:

**A replica lifecycle should express receipt/use status without pretending the receiver owns the source object's technical definition.**

NuBlox may therefore need separate state dimensions such as source-object maturity, receipt/import state, local review/acceptance state, local use/reliance state and source-authority status.

## 7. Version mapping is a preservation problem

Preserving source version identity requires compatible or explicitly mapped version schemes.

Version mismatch is not a cosmetic issue. It affects whether the target can reconstruct the source object's version lineage.

A robust NuBlox exchange must therefore preserve source object identity, source version/revision/iteration, source system, import mapping, target identity/version, import event and relationship to previous imported snapshot.

## 8. Security labels require explicit translation

Security-label mapping translates source security labels/values to corresponding target labels/values.

Mapping is governed at Site level and requires suitable permissions.

A particularly important edge case is documented:

**If security labels are enabled on the source system but disabled on the target system, imported objects do not receive the source security labels/values.**

That is a material information-governance risk. NuBlox should not silently downgrade information protection merely because the receiving environment lacks an equivalent label model.

A safer canonical requirement is:

~~~text
source classification
      ↓
explicit target mapping / equivalence
      ↓
valid target clearance policy
      ↓
import permitted

no equivalent mapping
      ↓
quarantine / conflict / explicit authorised exception
~~~

## 9. Incremental deliveries preserve delta semantics

An incremental delivery is relative to a base delivery.

PTC distinguishes at least:

- **New** — object newly included;
- **Changed** — object changed since the base;
- **Deleted** — object deleted on the source;
- **Absent** — object no longer included in the current package snapshot but not necessarily deleted.

Unchanged content need not be resent.

### Deleted

The target import attempts to remove the corresponding imported object. Failures are reported.

### Absent

The target is informed that the object is no longer part of the current package content. Business action may then be required, such as moving it, changing state or otherwise treating it as outside the active delivered set.

**Absent is not the same as Deleted.**

This distinction is highly relevant to contract deliverables, handover sets and controlled data drops.

## 10. Incremental deliveries depend on ordered provenance

An incremental delivery is meaningful only relative to its base and prior exchange sequence.

Imports therefore need ordered provenance:

~~~text
Full Delivery D1
      ↓
Incremental D2
      ↓
Incremental D3
~~~

Applying a later delta without the required base/history can produce incorrect target state.

NuBlox should persist delivery lineage and prevent ambiguous delta application.

## 11. Import may be partial and transactional

Windchill can divide an import into multiple transactions while keeping related objects together.

Some transactions may succeed while another fails and is retried.

This means:

- Delivery received ≠ entire delivery successfully imported.
- Import started ≠ import completed.
- Import completed ≠ every object imported.
- Delivery accepted ≠ import success.
- Import success ≠ transfer of authority.

NuBlox exchange status should represent these independently.

## 12. Re-import can update the target replica

Subsequent deliveries/imports can update imported objects on the target.

Because source remains authoritative, target-side changes are unsafe unless explicitly designed as target-owned extensions.

This suggests two categories for NuBlox:

1. **Source-controlled replica fields/content** — refreshed from source.
2. **Target-local metadata/evidence** — locally owned and preserved separately.

Those ownership boundaries need to be explicit at object/attribute/relationship level.

## 13. Delivery acknowledgement is business communication, not configuration acceptance

Windchill allows the receiving party to mark Delivery status such as Received, Accepted or Rejected, with dates/comments.

This status is evidence about the exchange transaction.

It does not, by itself, mean imported objects are technically approved, imported configuration is released, contractual deliverables are accepted under a contract, source authority has transferred or all content imported successfully.

NuBlox Construction & Built Environment needs those acceptance dimensions separately where applicable.

## 14. Downgrade release is a software/interoperability concern

Windchill includes a concept of **Downgrade Releases** for replication-package compatibility with older target Windchill releases.

This is not a security-classification downgrade and not a business-authority downgrade.

PTC's Windchill 12.0.2 release information indicates the downgraded-delivery feature was disabled in that baseline.

NuBlox must therefore avoid overloading "downgrade" across application-version compatibility, information classification, lifecycle maturity and source authority.

## 15. Candidate NuBlox exchange model

The evidence supports separating:

~~~text
Exchange Definition / Package
        ↓
Frozen Package Manifest
        ↓
Delivery
        ↓
Receipt / Acknowledgement
        ↓
Import Preview
        ↓
Mapping Set
        ↓
Conflict Set
        ↓
Import Execution
        ↓
Imported Replica / Reference
        ↓
Local Review / Acceptance / Use
~~~

with independent authority:

~~~text
Source Authority
      └── remains source unless
          explicit Authority Transfer / Adoption
          is executed and evidenced
~~~

For CBE, this can support design data drops, supplier/subcontractor submissions, CDE exchanges, document transmittals, model exchanges, O&M handover packages, asset-information handover, contract deliverable sets and migration/replication between organisations.

## 16. Required NuBlox distinctions

NuBlox should keep these separate:

- Package membership;
- Package snapshot/version;
- Delivery/transmittal;
- Delivery recipient;
- Delivery receipt;
- Delivery acceptance/rejection;
- import readiness;
- import mapping;
- import conflict;
- import transaction;
- object-level import result;
- source authority;
- local replica identity;
- local technical/business acceptance;
- authority transfer/adoption;
- security-classification mapping;
- version mapping;
- delta lineage.

A single generic "sent/received/accepted" status cannot safely represent all of these.

## 17. Research conclusion for WHC-027

The core Package / Received Delivery authority model is now sufficiently evidenced:

- Package, Delivery and Received Delivery are separate;
- delivery acknowledgement is separate from import;
- import is mapped translation, not blind copy;
- source system remains authoritative for imported shared objects;
- imported objects are locked against normal local mutation;
- re-import can refresh source-controlled content;
- mapping covers Context, Organisation, View, lifecycle, folder, security and version semantics;
- source security labels can be lost if the target has security labels disabled, creating a material governance edge case;
- incremental delivery distinguishes New, Changed, Deleted and Absent;
- incremental imports depend on base/ordering;
- partial transactional import is possible;
- software-version downgrade is distinct from security or authority downgrade.

Remaining package work is implementation/detail-level supported-object coverage rather than the canonical authority-transfer model.

## Primary PTC sources

- Working with Objects Imported Using a Received Delivery — Windchill Cloud 12.0.2.0 Help Center
- Receiving a Package — Windchill Cloud 12.0.2.0 Help Center
- Importing Received Delivery Files — Windchill Cloud 12.0.2.0 Help Center
- Best Practices for Working with Received Deliveries — Windchill Cloud 12.0.2.0 Help Center
- Security Label Mapping — Windchill Cloud 12.0.2.0 Help Center
- Importing Incremental Received Delivery Files — Windchill Cloud 12.0.2.0 Help Center
- View Mapping — Windchill Cloud 12.0.2.0 Help Center
