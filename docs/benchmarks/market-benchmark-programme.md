# NuBlox V3 Market Benchmark Programme

**Status:** Gate 3 — in progress  
**Established:** 18 September 2026  
**Scope:** enterprise operating system + Construction & Built Environment depth

## Objective

NuBlox must be challenged against the strongest relevant external systems, not only PTC Windchill.

The governing question is:

> Could a sophisticated organisation that develops, designs, constructs, manufactures, operates and maintains built assets perform the materially relevant outcome natively in NuBlox with equal or better continuity, control and traceability?

The answer is evaluated across the **29 tenant workspaces**, canonical business objects, end-to-end process chains, sector overlays and whole-life asset/project lifecycle.

## Benchmark portfolio

The machine-readable register currently contains **22 benchmark products/suites**. It is intentionally split into two tiers.

### Mandatory enterprise / platform suites

These challenge broad enterprise or lifecycle completeness:

- SAP Cloud ERP / S/4HANA ecosystem, with Ariba, SuccessFactors and related enterprise capabilities;
- Oracle Fusion Cloud Applications + Oracle Construction and Engineering (Primavera, Unifier, Aconex, Textura);
- Microsoft Dynamics 365 Finance / Supply Chain / Project Operations / Field Service / CRM;
- IFS Cloud;
- Workday Financial Management / HCM / Adaptive Planning;
- ServiceNow;
- Procore;
- Autodesk Forma / Autodesk Construction Cloud;
- Bentley ProjectWise / iTwin;
- Trimble Construction One / Viewpoint Vista / ProjectSight;
- IBM Maximo Application Suite;
- PTC Windchill 13.1.2;
- Siemens Teamcenter.

### Specialist depth challengers

These challenge areas where a focused product can expose depth that broad suites underrepresent:

- Salesforce — CRM, sales, service and field-service patterns;
- Diligent — board governance, corporate secretariat, risk/compliance/audit;
- Deltek Vantagepoint — architecture/engineering professional-services ERP and project accounting;
- Asite — CDE, BIM coordination and project information management;
- Thinkproject / CEMAR — contract administration, CDE and built-asset work;
- Hexagon EcoSys — portfolio, project controls and contract performance;
- Planon — property, workplace, facilities and IWMS;
- Sage Intacct Construction / Sage Construction Management — construction finance, job cost and WIP;
- Causeway — estimating, commercial management, workforce, supply chain and infrastructure delivery.

The register is **capability-driven, not a frozen vendor league table**. If another product exposes a materially distinct capability or control relevant to one of the 29 workspaces, it must be added to the benchmark register.

## SAP continuity

The prior NuBlox programme maintained a **64-line SAP capability coverage register**. That register remains valuable because it forces outside-in enterprise completeness across finance, controlling, planning, procurement, supply chain, manufacturing, HCM, assets, real estate, governance and platform capabilities.

V3 carries the register forward under:

`docs/benchmarks/sap-capability-coverage-register.csv`

However:

- the old NuBlox domain and delivery-slice columns are historical provenance;
- SAP module boundaries do not become V3 workspace or aggregate boundaries;
- every SAP benchmark capability must be remapped to the **29 V3 workspaces**, canonical objects and end-to-end chains;
- SAP is a completeness benchmark, not the target architecture.

## Study method

Each benchmark study must produce a version-controlled record containing:

1. **external capability/outcome** — what the product materially enables;
2. **authoritative source** — current vendor documentation/product evidence;
3. **NuBlox workspace(s)** — F01–F29 affected;
4. **canonical object(s)** — authoritative NuBlox records involved;
5. **process chain / lifecycle** — upstream and downstream continuity;
6. **control semantics** — authority, segregation, audit, retention, versioning/effectivity and evidence;
7. **external strength** — what the benchmark does particularly well;
8. **NuBlox state** — covered / partial / absent / intentionally external;
9. **gap decision** — add, refine, integrate, contextualise or reject;
10. **proof** — tests, model changes, journey evidence or explicit no-change rationale.

## Benchmark waves

### Wave 1 — Enterprise backbone

SAP, Oracle, Microsoft, IFS, Workday.

Challenge:

- strategy/planning/performance;
- CRM-to-cash;
- source-to-pay;
- supply chain and inventory;
- manufacturing;
- finance/treasury/tax;
- HCM/workforce;
- master/reference data;
- enterprise controls and analytics.

### Wave 2 — Project and construction delivery

Oracle Construction & Engineering, Procore, Autodesk, Trimble, Hexagon EcoSys, Causeway, Thinkproject, Asite.

Challenge:

- estimating/preconstruction;
- programme/schedule/resource control;
- commercial and contract administration;
- procurement/subcontract;
- CDE/RFI/submittal/document exchange;
- site/field execution;
- quality/safety;
- progress/cost/forecast;
- valuation/payment;
- closeout/handover.

### Wave 3 — Product, engineering and information lifecycle

PTC Windchill, Siemens Teamcenter, Bentley ProjectWise/iTwin, Autodesk.

Challenge:

- requirements;
- controlled information;
- revision/iteration;
- configuration/effectivity;
- design/change;
- BOM/product structure;
- engineering data;
- digital thread/twin;
- handover continuity.

### Wave 4 — Asset, property, facilities and service

IBM Maximo, IFS, Planon, Thinkproject, Microsoft Field Service.

Challenge:

- asset/installed-base identity;
- maintenance strategy/plans/work orders;
- condition/reliability;
- MRO/spares;
- service requests/cases/dispatch;
- warranties;
- estate/space/occupancy;
- lifecycle investment;
- operational handover.

### Wave 5 — Enterprise control and specialist back office

ServiceNow, Diligent, Salesforce, Workday, Deltek, Sage.

Challenge:

- workflow/case/request/decision patterns;
- ITSM/cyber/risk;
- governance/boards/entities;
- customer service;
- professional-services resource/project accounting;
- construction accounting/job cost/WIP;
- people/talent/workforce planning.

## Standards challenge

Software benchmarking is only one half of Gate 3. Applicable standards/reference models must challenge the same canonical model independently, including at minimum:

- ISO 19650 information management;
- buildingSMART IFC/BCF/IDS interoperability;
- ISO 55001 asset management;
- ISO 9001 quality management;
- ISO 45001 occupational health and safety;
- ISO 14001 environmental management;
- ISO/IEC 27001 information security;
- ISO 31000 risk management;
- ISO 22301 business continuity;
- relevant classification/reference systems such as Uniclass;
- applicable contract/regulatory regimes where NuBlox claims native process support.

Standards and legislation define obligations/interoperability expectations; they do not automatically define software aggregates either.

## Gate 3 exit criteria

Gate 3 is not complete until:

- all 29 workspaces have been challenged by at least one relevant external benchmark;
- each mandatory benchmark has a documented capability study;
- specialist benchmark findings are resolved into canonical decisions or explicit integration/contextual treatments;
- the 64 SAP rows have been remapped to V3;
- Windchill is no longer the only deep semantic product study;
- standards/interoperability challenges are documented;
- every accepted benchmark gap has an owner and canonical impact;
- every rejected vendor pattern has a recorded rationale.

Only after this challenge can NuBlox freeze canonical aggregate boundaries with confidence.
