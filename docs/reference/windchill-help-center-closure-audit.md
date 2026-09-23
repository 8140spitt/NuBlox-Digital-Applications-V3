# Windchill 12.0.2 Help Center Closure Audit

**Status:** CLOSED FOR NUBLOX ARCHITECTURAL / CAPABILITY BENCHMARKING  
**Target:** PTC Windchill Cloud 12.0.2.0 Help Center  
**Closure date:** 23 September 2026  
**Root:** https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/index.html#page/Windchill_Help_Center%2FWHCCategories.html%23

## Closure rule

This audit is deliberately stricter than a topic-summary exercise.

A Help Center branch is not considered closed until it has a disposition for every architecture-relevant semantic family beneath it. A leaf page does **not** require a new NuBlox object merely because it has its own Windchill page. Leaf pages inherit their parent-family disposition unless they introduce a materially distinct:

- stable identity;
- lifecycle/state machine;
- authority/permission boundary;
- relationship with independent cardinality, effectivity or ownership;
- transaction/consistency boundary;
- historical/provenance requirement;
- integration/source-authority boundary; or
- independently governed operational control.

Installation procedures, command syntax, UI click paths, adapter-specific mappings, vendor SDK/class details, per-CAD-tool exceptions and site-specific configuration catalogues are recorded as implementation/configuration detail after their governing semantic boundary is identified.

## Reconciliation result

The coverage register now contains **58 Windchill evidence families**.

- **WHC-001–043:** core/common/admin/product/project/change/service/supplier/manufacturing/quality/search/reporting/API/integration/operations/customization semantics.
- **WHC-044–046:** explicit Construction & Built Environment gaps, not missing Windchill traversal.
- **WHC-047–051:** physical instances, administrative promotion, retention, collaboration and business rules.
- **WHC-052–058:** previously omitted 12.0.2 product/help families found during final closure: Aerospace & Defense contractual data; Aerospace & Defense CI/DS; Integrated Software Management; STEP/PLM exchange; Office/Desktop integration; Product Analytics integration; Ship Building template.

The top-level reconciliation now contains **45 branches/dispositions**.

## Residuals closed in the final pass

### Type and Attribute Management

Subtype/type inheritance is explicitly treated as a hierarchy, with inheritable property/layout behaviour and relationship constraints. Per-product subtype catalogues are configuration detail, not a missing canonical boundary.

### Templates

The context availability matrix is closed across Site, Organisation, Product, Library, Project and Program, including template types that are deliberately unavailable in Project/Program or only administered from Site/Organisation.

### Object Initialization Rules

Composite-rule behaviour is closed across both object-type and context hierarchies. The `final` and `ignore` controls are explicit precedence controls rather than unresolved defaulting behaviour.

### Change Management

Association-rule cardinality, owning role and required role are explicit. Change Intent, Release Target and mapping-rule precedence are explicit. These close the previously recorded relationship/cardinality/intent residual.

## Previously omitted product/help families

### Aerospace & Defense contractual data

CDRL and SDRL are governed package specialisations carrying contractual delivery metadata/schedule information. CAGE is an organisation identifier scheme. Unincorporated Change preserves approved but deferred change with planned revision incorporation.

### Aerospace & Defense Configuration Items / Design Solutions

The model separates Configuration Item, Design Solution, optional Link Object, Change Directive and generated Change Action. Change actions carry effectivity and are fulfilled by candidate design solutions. The optional link object can represent repeated/placed relationships between a configuration item and design solution.

### Integrated Software Management

Software Part, Software Build, Software Document and Software Configuration Data are governed typed artefacts linked to build, defect and external source-control information. External SCM/build adapters are integration mechanics after those semantic identities are preserved.

### STEP / PLM standards exchange

AP214/AP242/PLCS exchange, EXPRESS schemas, P21/P28 payloads and mapping/reference-data rules are specialisations of governed data exchange and mapping. They do not replace canonical Part/Document/CAD identities.

### Office / Desktop Integration

Office integrations expose existing document creation, edit, checkout/checkin, content and information-page behaviour from external authoring clients. This is an interaction/integration surface, not a new business domain.

### Product Analytics

Environmental compliance, cost and life-cycle analytics appear against governed Part identities when Product Analytics is installed. They are analytic/integration projections and facts, not replacement product masters.

### Ship Building Template

The reviewed 12.0.2 evidence identifies a Ship Building template/classification package dependent on PartsLink/classification. It is therefore recorded as industry template content rather than a separate canonical transaction model.

## CBE gaps remain deliberately open outside Windchill

Windchill does not provide sufficient first-class evidence for:

1. construction commissioning, ITP/test packs, system completion and handover;
2. construction commercial/contract administration;
3. construction site production/field execution.

These are not Windchill research defects. They must be closed against CBE standards and specialist products.

## Authoritative registers

- `windchill-help-center-coverage.csv` — semantic evidence families and status.
- `windchill-help-center-top-level-reconciliation.csv` — Help Center/product branch reconciliation.
- `windchill-help-center-deep-relationship-register.md` — detailed evidence and relationship findings.
- `windchill-to-nublox-requirement-translation.md` — translation rules.
- `windchill-to-nublox-canonical-requirement-matrix.csv` — candidate NuBlox dispositions.

## Closure statement

For NuBlox architecture and capability benchmarking, the Windchill 12.0.2 Help Center study is closed only in the following precise sense:

> Every material semantic/product family identified in the reviewed 12.0.2 Help Center and 12.0.2 product/media inventory has an explicit evidence family or an explicit implementation/template/integration-detail disposition. The three remaining GAP records are outside Windchill's demonstrated semantic scope and are intentionally routed to CBE-specific research.

This closure statement must **not** be interpreted as copying every Windchill UI procedure, vendor API signature, installation command, CAD-adapter exception or customization code sample into NuBlox requirements.
