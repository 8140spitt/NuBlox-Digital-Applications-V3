# Controlled Information & Document Semantics

## Status

Governing V3 semantic model for controlled design, engineering, BIM and information-management identities.

## Purpose

This model prevents NuBlox from treating files, folders, document types, reviews and CDE structures as interchangeable business objects. It establishes one stable governed information identity that can survive authoring-format changes, revisions, issue/transmittal events, handover and operational reuse.

## Canonical identity stack

```text
Information Container                 stable business identity
    ↓
Information Container Revision        governed business revision
    ↓
Working iteration                     controlled working history
    ↓
Information Representation            PDF / IFC / DWG / XLSX / image / native model / rendition
```

A file name, storage path or external CDE identifier may be a business/integration identifier. It is never the canonical identity by itself.

## Requirements and delivery

```text
Information Requirement
    ↓
Information Deliverable
    ↓
Information Delivery Plan
    ↓
accepted Information Container revision(s)
```

`Project Information Requirement` and `Asset Information Requirement` are governed requirement types/scope. `Handover Information Deliverable` is a typed deliverable. These specialist terms remain visible in NuBlox without creating parallel master-data engines.

## Information Container types

The following candidate concepts use the canonical `Information Container` identity pattern:

- Document
- Drawing
- Model
- Specification
- Technical Schedule
- Calculation

They may have different validation, authoring, viewing and metadata behaviour, but they do not become independent identity systems merely because their media or discipline differs.

## Revision and representation

A revision belongs to one Information Container. It does not exist as a free-standing document master.

Published/issued revisions are immutable. Corrections or changes create controlled successor history. Multiple representations can exist for one revision, for example a native model plus IFC and PDF viewables.

## Issue and exchange

```text
Information Container Revision
        ↓
Information Issue
        ↓
Transmittal
        ↓
recipient / acknowledgement evidence
```

`Information Issue` captures release purpose, suitability/status, audience and timestamp. `Transmittal` records the exchange. Distribution rules identify intended recipients/access but are not evidence that transmission occurred.

## Queries, submittals and responses

`RFI` and `Technical Query` use one canonical `Information Query` case pattern with configurable query type and contractual significance.

An `Information Submittal` references exact submitted revisions. The submission case does not own duplicate copies of those revisions.

An `Information Response` is immutable issued evidence tied to the originating query, submittal or review request. A response can cause further change, but it does not silently alter design, contract or baseline truth.

## Review and coordination

`Design Review` references the exact revisions assessed. `Review Comment` is an attributable child record with response/resolution history.

`Coordination Issue` and `Clash Issue` normalize to one `Design Coordination Issue` pattern. A clash viewpoint or screenshot is evidence/representation, not the coordination-issue identity.

## Design change

`Design Change` is technically distinct from `Commercial Change`.

A design change may trigger a commercial change, schedule impact, procurement action or rework, but those consequences remain separate governed objects/relationships. Approved technical change produces controlled successor information/configuration rather than overwriting published information.

## Design inputs

`Survey Input` is a typed `Design Input`. Design outputs retain provenance to the exact source requirement, survey, calculation, model or other information revision used.

## Handover and operations

Handover does not recreate information or asset identities.

```text
Project design information
      ↓
accepted / published revision
      ↓
linked to canonical Asset / System / Site
      ↓
operational use and future revision history
```

The same Information Container can therefore remain traceable from design through construction, commissioning, handover, maintenance and future change.

## Non-negotiable rules

1. Information Container is stable business identity; files/renditions are representations.
2. Revision/iteration is version structure, not a new master record.
3. Published/issued revisions are immutable.
4. Document, Drawing, Model, Specification, Technical Schedule and Calculation are governed Information Container types unless later semantic review proves a distinct aggregate is necessary.
5. Purpose of issue, suitability/status, security classification and revision are explicit metadata.
6. Information Requirement, Deliverable, Delivery Plan and Container remain separate identities.
7. Responsibility uses the shared Authority & Participation model.
8. Information Issue and Transmittal are immutable release/exchange evidence.
9. RFI and Technical Query use one Information Query pattern.
10. Submittal references exact revisions and does not duplicate information identity.
11. Review comments, markups and responses preserve attribution/history without mutating the reviewed revision.
12. Clash Issue is a type of Design Coordination Issue.
13. Design Change and Commercial Change are separate but linkable.
14. CDE/folder structures are views/containers around canonical information, not the canonical domain model.
15. Handover preserves Information Container and Asset identity across the project-to-operations boundary.
