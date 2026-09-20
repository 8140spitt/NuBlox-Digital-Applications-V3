# Asset, Property, Facilities and Service Wave

**Status:** architecture challenge complete  
**Date:** 18 September 2026  
**Scope:** IBM Maximo, Planon IWMS and Esri ArcGIS, with prior IFS / Microsoft Field Service / Thinkproject findings reused as corroboration

## IBM Maximo Application Suite

**Benchmark state:** challenged

### OPS-W4-MAXIMO-00 — asset operations and reliability

**Official evidence**

- Maximo Application Suite: https://www.ibm.com/products/maximo
- Asset Performance Management: https://www.ibm.com/products/maximo/asset-performance-management

Maximo combines EAM, inspections, work management, condition/predictive maintenance, reliability, MRO/inventory and lifecycle planning.

NuBlox already governs:

- Asset / System / Component / installed-base relationship;
- Asset Type / Asset Model;
- Condition Point / Condition Assessment;
- Maintenance Strategy / Plan / Schedule;
- Work Order / Inspection / Failure / Defect;
- Service Request / Case / Appointment / Dispatch / Field Visit;
- parts consumption through Inventory Movement;
- Warranty and service history;
- benchmark-driven Asset Criticality Assessment, Failure Mode Definition, Reliability Strategy and Asset Health Position.

**Decision**

No additional EAM master or Maximo-style asset copy.

### OPS-W4-MAXIMO-01 — asset investment planning

**Official evidence**

- Asset Investment Planning: https://www.ibm.com/products/maximo/asset-investment-planning
- IBM AIP overview: https://www.ibm.com/think/topics/asset-investment-planning

IBM explicitly links asset condition, risk, failure probability, lifecycle cost, intervention options, budget/resource constraints and KPI outcomes to compare investment scenarios and sequence maintain/refurbish/replace decisions.

**Finding**

NuBlox had Lifecycle Replacement Plan and Capex Request but no explicit governed intervention-option appraisal and portfolio-level long-range asset investment decision layer.

**Decision**

Accepted as **BG-025**.

NuBlox now governs:

- Asset Intervention Option;
- Asset Investment Appraisal;
- Asset Investment Plan.

The appraisal reuses Asset Health/Criticality, Enterprise Risk, Scenario/Assumption, Business Case, Budget/Capex and shared Decision evidence. Optimisation output never authorises work by itself.

## Planon IWMS

**Benchmark state:** challenged

**Official evidence**

- Space & Workplace Services: https://planonsoftware.com/uk/software/iwms/space-workplace-services-management/
- Workplace App: https://planonsoftware.com/uk/modules/workplace-app/
- Space & Real Estate Services: https://planonsoftware.com/uk/software/field-services/space-real-estate-services/

Planon combines estate/space/occupancy insight, room and desk reservations, service requests, access, visitor management, service/SLA management and sensor-informed workplace utilisation.

NuBlox already governs:

- Estate / Property / Site / Facility / Building / Level / Zone / Space;
- Occupancy / Lease / Licence;
- Facilities Request / Soft FM Service;
- Service Contract / Entitlement / SLA;
- Service Request / Case / Appointment;
- Visitor Pass and physical-access evidence;
- Utility Consumption;
- sensor/condition evidence;
- lease-accounting consequences from BG-016.

### OPS-W4-PLANON-01 — room/desk/facility reservation

**Finding**

NuBlox had inventory Reservation and Site Logistics Booking but no time-bound workplace reservation identity.

**Decision**

Accepted as **BG-027**.

NuBlox now governs Workplace Reservation over canonical Space/resource and Party/worker identity. It remains distinct from:

- inventory Reservation;
- Site Logistics Booking;
- Occupancy/Tenure;
- access authorization;
- Visitor Pass.

## Esri ArcGIS

**Benchmark state:** challenged

### OPS-W4-ESRI-01 — utility-network topology and trace

**Official evidence**

- Utility Network trace documentation: https://doc.esri.com/en/arcgis-pro/latest/help/data/utility-network/about-tracing-utility-networks.html
- Trace tool: https://doc.esri.com/en/arcgis-pro/latest/tool-reference/utility-networks/trace.html

Esri explicitly distinguishes connectivity from traversability, supports terminal-level internal paths, barriers, subnetworks and trace configurations, and produces reproducible trace result sets.

**Finding**

NuBlox already had Network, System, Asset, Component and Linear Segment identities, but did not explicitly govern topology/connectivity or trace execution/results.

**Decision**

Accepted as **BG-026**.

NuBlox now governs:

- Network Terminal;
- Network Connectivity Relationship;
- Network Trace Configuration;
- Network Trace Run;
- Network Trace Result.

GIS can remain an authoritative spatial/network source where configured, but external feature IDs never replace canonical NuBlox Asset/System/Network identity.

### OPS-W4-ESRI-02 — linear referencing

**Official evidence**

- ArcGIS Linear Referencing announcement: https://www.esri.com/arcgis-blog/products/arcgis-enterprise/announcements/introducing-arcgis-linear-referencing
- Linear referencing toolbox: https://doc.esri.com/en/arcgis-pro/latest/tool-reference/linear-referencing/an-overview-of-the-linear-referencing-toolbox.html

Esri supports measure-based location of assets, condition, events and other characteristics along roads, railways, pipelines and similar linear networks.

**Finding**

NuBlox had Linear Segment and point-like Linear Reference semantics but needed a governed way to assign a subject to a point **or extent** along the network with explicit reference-method/version provenance.

**Decision**

Also resolved through **BG-026** via Linear Location Assignment.

## Relationship to the digital-twin model

The network/linear semantics complement—not replace—the Wave 3 digital-twin federation:

```text
canonical Network / System / Asset / Linear Segment
        ↓
connectivity + linear-location truth
        ↓
authoritative GIS / operational source bindings
        ↓
Digital Twin Federation Context
        ↓
Digital Twin State Snapshot
```

A map or GIS feature never becomes the sole enterprise identity simply because it is visualised spatially.

## Wave outcome

### BG-025 — asset investment planning

- Asset Intervention Option
- Asset Investment Appraisal
- Asset Investment Plan

### BG-026 — infrastructure network and linear location

- Network Terminal
- Network Connectivity Relationship
- Linear Location Assignment
- Network Trace Configuration
- Network Trace Run
- Network Trace Result

### BG-027 — workplace reservation

- Workplace Reservation

## Deliberate non-adoptions

NuBlox does not adopt:

- Maximo's application boundaries as domain boundaries;
- a second FM asset or property register;
- sensor data as Asset identity;
- workspace booking as inventory reservation;
- GIS feature IDs as the enterprise Asset/System/Network identity;
- network trace output as physical network truth;
- a digital twin as a duplicate operational master.

## Wave status

**IBM Maximo:** challenged  
**Planon IWMS:** challenged  
**Esri ArcGIS:** challenged  
**IFS Cloud:** previously challenged  
**Microsoft Dynamics Field Service:** previously challenged  
**Thinkproject asset/work management:** previously challenged

The asset/property/service architecture challenge is complete for the registered Wave 4 portfolio. Runtime implementation and external-system integration proof remain later stages.
