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

The machine-readable register currently contains **23 benchmark products/suites**. It is intentionally split into two tiers.

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
- Esri ArcGIS / Field Maps / GeoBIM — geospatial infrastructure, field mobility and network/asset context;
- Planon — property, workplace, facilities and IWMS;
- Sage Intacct Construction / Sage Construction Management — construction finance, job cost and WIP;
- Causeway — estimating, commercial management, workforce, supply chain and infrastructure delivery.

The register is **capability-driven, not a frozen vendor league table**. If another product exposes a materially distinct capability or control relevant to one of the 29 workspaces, it must be added to the benchmark register.

## SAP continuity

The prior NuBlox programme maintained a **64-line SAP capability coverage register**. That register remains valuable because it forces outside-in enterprise completeness across finance, controlling, planning, procurement, supply chain, manufacturing, HCM, assets, real estate, governance and platform capabilities.

V3 carries the register forward under:

`docs/benchmarks/sap-capability-coverage-register.csv`

The complete V3 semantic remap is now held in:

`docs/benchmarks/sap-v3-capability-map.csv`

Current SAP benchmark state:

- **64/64** legacy capability rows mapped to V3 workspaces, canonical families/object concepts and process chains;
- **47** classified as native-core outcomes;
- **9** classified as contextual extensions;
- **8** classified as platform enablers;
- **64/64** rows have now been challenged against current SAP capability evidence and NuBlox semantics;
- SAP benchmark state is **challenged**, not runtime-proven/closed;
- **16** architecture findings have governed dispositions: **11 accepted core refinements** and **5 explicit contextual extensions**;
- **0** benchmark-decision gaps remain open from the SAP pass.

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

### Wave 1 — Enterprise backbone — architecture challenge complete

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

### Wave 2 — Project and construction delivery — architecture challenge complete

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
- the 64 SAP rows have been remapped to V3 **and each material capability challenge has a documented outcome/gap decision**;
- Windchill is no longer the only deep semantic product study;
- standards/interoperability challenges are documented;
- every accepted benchmark gap has an owner and canonical impact;
- every rejected vendor pattern has a recorded rationale.

Only after this challenge can NuBlox freeze canonical aggregate boundaries with confidence.

## SAP challenge completion record — 18 September 2026

The SAP benchmark has now completed its **architecture challenge** across all 64 inherited capability rows.

Detailed study records:

- `sap-wave-1-enterprise-backbone.md` — first 39 enterprise-backbone rows;
- `sap-wave-2-specialist-industry-experience.md` — remaining 25 rows;
- `sap-v3-capability-map.csv` — 64/64 row-level V3 remap/challenge state;
- `app/src/lib/data/benchmark-gap-register.ts` — governed findings/dispositions;
- `app/src/lib/data/benchmark-refinement-model.ts` — accepted core semantic refinements.

The SAP pass produced core semantic refinements for integrated planning, treasury risk, master-data stewardship, advanced logistics, reliability engineering, succession/talent, configurable products, business travel, migration/test-data governance, product requirements/systems engineering and lease accounting.

It also explicitly kept usage/subscription billing, public-sector funds management, global-trade compliance depth, sales incentive compensation and merchant/retail/POS mechanics as **contextual extensions** rather than universal core architecture.

This closes SAP as an architectural challenge source. It does **not** claim that all SAP-equivalent runtime features or user journeys are implemented in NuBlox.


## Enterprise and construction wave completion — 18 September 2026

The architecture challenge has now been completed for:

- SAP;
- Oracle Fusion Cloud + Oracle Construction & Engineering;
- Microsoft Dynamics 365;
- IFS Cloud;
- Workday;
- Procore;
- Autodesk Construction Cloud / Forma;
- Trimble Construction One / Viewpoint Vista;
- Hexagon EcoSys;
- Causeway;
- Thinkproject / CEMAR;
- Asite.

Current programme state:

- **12/23** benchmark products/suites challenged;
- **1/23** in progress — PTC Windchill deep semantic study;
- **10/23** queued;
- all **29/29** workspaces remain represented by the benchmark portfolio;
- all benchmark gaps identified so far are governed and resolved architecturally;
- runtime parity is not claimed.

Wave 2 produced additional construction-grade refinements for CPM scheduling, quantitative project risk, reproducible EVM/CVR/productivity analysis, contract value schedules and target-cost share mechanisms.

Detailed records:

- `enterprise-suite-wave-1-oracle-microsoft-ifs-workday.md`;
- `construction-delivery-wave.md`.
