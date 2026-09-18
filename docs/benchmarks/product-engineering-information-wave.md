# Product, Engineering and Information Lifecycle Wave

**Status:** architecture challenge complete  
**Date:** 18 September 2026  
**Scope:** PTC Windchill 13.1.2, Siemens Teamcenter, Bentley ProjectWise/iTwin and previously challenged Autodesk construction/design information patterns

## PTC Windchill 13.1.2

**Benchmark state:** challenged

### PLM-W3-WINDCHILL-00 — stable identity, revision and iteration

**Official evidence**

- Windchill versioning: https://support.ptc.com/help/windchill/plus/r13.1.2.0/en/Windchill_Help_Center/WCAdminContext/WCAdminContextAdminVersionPartDocCADDoc.html
- Windchill document management: https://support.ptc.com/help/windchill/plus/r13.1.2.0/en/Windchill_Help_Center/docmgmt/DocMgmtAbout.html

Windchill separates a persistent master from revisions and iterations. NuBlox already follows the same durable semantic principle where it matters:

- stable Information Container identity;
- controlled major Revision;
- working iterations beneath revisions;
- Representation/file identity below the business information revision;
- stable Item identity with revision/effectivity-governed specifications, BOMs and manufacturing definitions.

**Decision**

Do not import Windchill's generic object class hierarchy. Preserve explicit NuBlox domain identities with shared revision/configuration governance.

### PLM-W3-WINDCHILL-01 — effectivity and configuration specifications

**Official evidence**

- Effectivity: https://support.ptc.com/help/windchill/r13.1.2.0/en/Windchill_Help_Center/changemanagement/ChgMgmtEffectivityAbout.html
- Configuration specifications: https://support.ptc.com/help/windchill/r13.1.2.0/en/Windchill_Help_Center/ccm_oview/CCMOviewPartStructFilterConfigSpec.html
- Baseline configuration specification: https://support.ptc.com/help/windchill/r13.1.2.0/en/Windchill_Help_Center/prodstructure/PMConfigSpecBaseline.html

Windchill can select product structures by latest/released state, baseline, date effectivity, unit/serial effectivity and other configuration filters.

**Finding**

NuBlox previously carried effectivity mainly as attributes on Item Specification, Variant, BOM and Manufacturing Definition. That is insufficient to reproduce exact past/future configurations consistently across domains.

**Decision**

Accepted as **BG-023**.

NuBlox now governs:

- Effectivity Statement;
- Effectivity Assignment;
- Configuration Baseline;
- Product Structure Occurrence.

Effectivity can express date/time, serial/unit, lot/batch, configuration/options and other governed applicability contexts without changing the stable target identity.

### PLM-W3-WINDCHILL-02 — part configuration and as-maintained instance

**Official evidence**

- Configuration/instance overview: https://support.ptc.com/help/windchill/plus/r13.1.2.0/en/Windchill_Help_Center/configsandinstances/CIConfigsAndInstAbout.html
- Part configuration: https://support.ptc.com/help/windchill/r13.1.2.0/en/Windchill_Help_Center/configsandinstances/CIConfigInfoPage.html

Windchill explicitly distinguishes released/configured product structure from serialized in-service configurations that can change independently through maintenance.

**Decision**

Accepted into **BG-024**.

NuBlox now governs As-Maintained Configuration as a projection over canonical Asset/System/Component identity, installed-base relationships and maintenance/replacement evidence. It is distinct from:

- approved design/configuration baseline;
- As-Manufactured Configuration;
- physical Asset identity.

### Options and variants

Windchill's options/choices/configurable structures validate the existing benchmark-driven Product Configuration Model, Characteristic, Configuration Rule and resolved Product Configuration from **BG-012**.

No second options/variants subsystem is introduced.

## Siemens Teamcenter

**Benchmark state:** challenged

### PLM-W3-TEAMCENTER-01 — multi-domain BOM, variants and effectivity

**Official evidence**

- BOM management: https://www.siemens.com/en-gb/products/teamcenter/solutions/bom-bill-of-materials-management/
- Product configuration: https://www.siemens.com/en-gb/products/teamcenter/solutions/product-configuration-management/

Teamcenter combines multi-domain BOM management with release maturity, effectivity, variants and historical configurations/baselines.

**Decision**

Independent corroboration of **BG-023**.

NuBlox retains one canonical Item/BOM identity model while applying shared Effectivity Assignment, Configuration Baseline and occurrence semantics.

### Requirements and systems engineering

**Official evidence**

- https://www.siemens.com/en-gb/products/teamcenter/solutions/requirements-engineering/
- https://www.siemens.com/en-gb/products/teamcenter/solutions/

Teamcenter integrates requirements with configuration, change, tests, manufacturing and the digital thread.

**Decision**

Validates **BG-015** Product Requirement / Requirement Set / Engineering System Model semantics. Requirements remain separate from project Information Requirement and from physical System/Asset identity.

### PLM-W3-TEAMCENTER-02 — digital twin and digital thread

**Official evidence**

- https://www.siemens.com/en-gb/products/teamcenter/

Teamcenter uses digital twins and digital threads to connect product definition, manufacturing, service and related lifecycle information.

**Decision**

Corroborates **BG-024**. NuBlox adopts federation/traceability semantics, not a duplicate product or asset master.

## Bentley ProjectWise / iTwin

**Benchmark state:** challenged

### PLM-W3-BENTLEY-01 — engineering work in progress to digital twin

**Official evidence**

- ProjectWise: https://www.bentley.com/products/projectwise
- Bentley Infrastructure Cloud: https://www.bentley.com/products/bentley-infrastructure-cloud
- ProjectWise powered by iTwin product data: https://www.bentley.com/wp-content/uploads/pds-projectwise-itwin-ltr-en-lr.pdf

Bentley moves beyond file-based engineering work-in-progress toward data-centric design delivery, governed engineering information, federated infrastructure digital twins, geospatial context and lifecycle continuity.

**Finding**

NuBlox already has strong controlled-information, Site/System/Asset, Dataset/Data Product, Sensor/Condition and geospatial/evidence semantics. The missing layer was a governed federation that binds those authoritative sources for a lifecycle purpose.

**Decision**

Accepted as **BG-024**.

NuBlox now governs:

- Digital Twin Federation Context;
- Digital Twin Data Binding;
- Digital Twin State Snapshot;
- As-Maintained Configuration.

A twin is therefore a **federated context/projection**, not a second Asset, System, document repository or telemetry store.

## Change management

Windchill and Teamcenter both provide formal closed-loop change processes.

NuBlox deliberately keeps distinct:

- Product/technical Design Change;
- Commercial Change / Compensation Event / Variation;
- Project Change Request;
- IT Change Request;
- governed Decision / approval / authority evidence;
- resulting new revisions/configuration/effectivity.

A workflow may coordinate any of these, but workflow tasks never become the changed domain truth.

## Quality

PLM quality capabilities reinforce—not replace—the existing NuBlox:

- Quality Plan / ITP;
- Inspection / Test;
- NCR / Defect;
- CAPA;
- Calibration;
- Quality Certificate;
- shared Risk/Compliance/Audit;
- requirement/configuration traceability.

## Wave outcome

New accepted refinements:

### BG-023 — shared configuration governance

- Effectivity Statement;
- Effectivity Assignment;
- Configuration Baseline;
- Product Structure Occurrence.

### BG-024 — whole-life configuration and digital twin

- As-Maintained Configuration;
- Digital Twin Federation Context;
- Digital Twin Data Binding;
- Digital Twin State Snapshot.

## Deliberate non-adoptions

NuBlox does **not** adopt:

- a generic PLM master object replacing explicit domain identities;
- CAD file = product/asset identity;
- PLM folders/contexts as enterprise architecture;
- a second BOM disconnected from the canonical Item/BOM model;
- a digital twin as a duplicate physical Asset register;
- workflow state as domain lifecycle truth.

## Wave status

**PTC Windchill 13.1.2:** challenged  
**Siemens Teamcenter:** challenged  
**Bentley ProjectWise/iTwin:** challenged  
**Autodesk construction/design information:** already challenged during Wave 2

The wave is complete at the **semantic / architecture-challenge** level. Runtime implementation and interoperability proof remain later gates.
