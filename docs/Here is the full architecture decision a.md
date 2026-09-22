Here is the full architecture decision as a Markdown document. Save it as `architecture-decision-core29-cbe-bolt-on.md`.

```markdown
# Architecture Decision: Generic Core 29 + CBE Bolt-On

## Decision

The ERP will be built as a **two-layer architecture**:

1. **Core 29 Functions** — sector-agnostic, universal enterprise capabilities
2. **CBE Bolt-On Layer** — Construction & Built Environment specific extensions

This allows the same core product to serve any business, while construction clients get a fully tailored vertical solution.

---

## The Two-Layer Model

```text
┌─────────────────────────────────────────────────────────────┐
│                    CBE BOLT-ON LAYER                        │
│   Construction & Built Environment specific extensions      │
│   (projects, valuations, subcontracts, CDM, BIM, plant...)   │
├─────────────────────────────────────────────────────────────┤
│                    CORE 29 FUNCTIONS                        │
│   Universal enterprise capabilities (F01–F29)               │
│   Works for any business: retail, manufacturing, services...│
└─────────────────────────────────────────────────────────────┘
```

**Principle:** The Core 29 are **sector-agnostic**. They define *what* every enterprise does. The CBE layer defines *how* construction does it.

---

## Why This Works

| Benefit | Explanation |
|---|---|
| **Reusability** | Same core serves construction, manufacturing, retail, professional services |
| **Maintainability** | Core changes are isolated from CBE-specific logic |
| **Extensibility** | New sectors bolt on without touching core |
| **Onboarding** | New CBE clients get core + CBE preconfigured |
| **Product strategy** | "ERP for any business" + vertical packs |
| **Testing** | Core tested once; CBE tested per vertical |
| **Licensing** | Core licence + CBE module licence |

---

## Layer 1: Generic Core 29 (Sector-Agnostic)

Each function has a **generic definition** that any business can use. The activities in the taxonomy are already largely generic — they describe universal enterprise capabilities.

**Examples of generic core:**

| Function | Generic Scope |
|---|---|
| F05 | Product/service lifecycle, ideation, business case, launch, retire |
| F07 | Sales, accounts, opportunities, pipeline, quotes, orders, contracts |
| F09 | Procurement, suppliers, sourcing, contracts, POs, supplier performance |
| F14 | Finance, accounting, treasury, tax, budgeting, reporting |
| F15 | HR, recruitment, payroll, performance, learning, offboarding |
| F22 | Property, facilities, physical assets, maintenance, leases |
| F27 | Portfolio, programme, project management, PMO, resources |

These work whether you're a construction firm, a software company, or a retailer.

---

## Layer 2: CBE Bolt-On Extensions

For each core function, the CBE layer adds:

1. **CBE-specific objects** — entities that only exist in construction
2. **CBE-specific processes** — workflows unique to construction
3. **CBE-specific rules** — compliance, commercial, technical
4. **CBE-specific integrations** — BIM, CDE, estimating, planning

### How Each Core Function Extends

| Core Function | Generic Core | CBE Bolt-On Adds |
|---|---|---|
| **F01 Strategy** | Vision, objectives, KPIs | Order book strategy, framework strategy, bid/no-bid appetite, regional units |
| **F02 Governance** | Board, policies, delegation | Project boards, stage gates, JV governance, CDM duty holders |
| **F03 Performance** | Scorecards, KPIs, variance | CVR, earned value, WIP, cost-to-complete, safety metrics, order book |
| **F04 M&A** | Targets, DD, valuation, integration | Contract portfolio risk, onerous contracts, retentions, plant fleet, key personnel |
| **F05 Product** | Portfolio, ideation, launch, retire | RIBA stages, design deliverables, BIM, MMC, standard details, handover packs |
| **F06 Marketing** | Segments, brand, campaigns, leads | Tender pipelines, planning applications, frameworks, case studies, site visits |
| **F07 Sales** | Accounts, opportunities, quotes, orders | Tenders, bids, ITTs, valuations, applications for payment, variations, claims, retentions |
| **F08 Service** | Onboarding, cases, complaints, support | RFIs, snags, defects, handover, O&M, as-builts, warranties, DLP |
| **F09 Procurement** | Suppliers, sourcing, contracts, POs | Trade packages, subcontracts, prequalification, CIS, plant hire, site orders |
| **F10 Supply Chain** | Demand, S&OP, inventory, logistics | Project BOM, call-off schedules, site stores, laydown, offsite manufacture, waste |
| **F11 Production** | Planning, scheduling, execution, WIP | Offsite manufacture, precast, modular, installation sequencing, factory orders |
| **F12 Service Delivery** | Planning, scheduling, dispatch, field | Maintenance contracts, inspections, statutory testing, commissioning, mobile engineers |
| **F13 Quality** | QA, QC, NCR, CAPA, docs | ITPs, inspection records, test certificates, snags, benchmarks, as-builts |
| **F14 Finance** | GL, AP, AR, treasury, tax, reporting | Contract ledger, WIP, CVR, valuations, retentions, CIS, bonds, guarantees, cost codes |
| **F15 HR** | Recruitment, payroll, performance, L&D | CSCS, competencies, trades, project assignments, CIS, PPE, apprenticeships |
| **F16 IT** | Strategy, architecture, apps, infra, service | BIM, CDE, digital twin, site devices, project systems, IoT sensors |
| **F17 Data** | Governance, MDM, engineering, BI, AI | BIM data, asset data, Uniclass, Omniclass, carbon data, project data lake |
| **F18 Security** | Strategy, policy, IAM, monitoring, IR | Site networks, IoT security, BIM security, CDE access, partner access |
| **F19 Legal** | Advisory, contracts, IP, litigation | Main contracts, subcontracts, appointments, novations, adjudication, SPVs, JVs |
| **F20 Risk** | Framework, identification, assessment, audit | Project risk, site audits, CDM compliance, building safety, insurance, bonds |
| **F21 Privacy** | Governance, PIA, consent, DSR | CCTV, biometric data, site data, employee monitoring |
| **F22 Property** | Asset strategy, maintenance, facilities, leases | Plant, equipment, vehicles, tools, yards, depots, LOLER, PUWER, plant hire |
| **F23 HSE** | H&S, environment, waste, carbon, ESG | CDM, method statements, permits, RIDDOR, COSHH, asbestos, silica, social value |
| **F24 Continuity** | BC, crisis, emergency, security | Site emergency plans, compound security, plant security, theft, vandalism |
| **F25 Communications** | Corporate, internal, media, IR | Community liaison, social value, planning consultation, site communications |
| **F26 Knowledge** | Knowledge, documents, records | Drawings, specifications, BIM, CDE, as-builts, O&M, method statements, ITPs |
| **F27 Projects** | Portfolio, programme, project, PMO | Stage gates, work packages, cost plans, procurement plans, final accounts |
| **F28 Change** | Transformation, impact, adoption | Digital transformation, MMC, net zero, BIM adoption |
| **F29 Process** | Architecture, modelling, improvement | Project processes, site processes, value streams, method statements |

---

## Design Pattern for the Bolt-On

### 1. Extension Points

Each core function exposes **extension points** where CBE can hook in:

```text
Core F07 (Sales)
├── Core: Account, Opportunity, Quote, Order
├── Extension Point: "Order Types"
│   └── CBE adds: Tender, Bid, Valuation, Application for Payment
├── Extension Point: "Pricing Models"
│   └── CBE adds: Bill of Quantities, Schedule of Rates, Dayworks
├── Extension Point: "Contract Terms"
│   └── CBE adds: NEC, JCT, FIDIC, Z clauses
└── Extension Point: "Revenue Recognition"
    └── CBE adds: Progress claims, retentions, WIP
```

### 2. Object Inheritance

```text
Core Object: Order
├── CBE Object: Construction Contract
│   ├── Tender
│   ├── Subcontract
│   ├── Professional Appointment
│   └── Framework Call-Off
```

```text
Core Object: Product
├── CBE Object: Construction Offering
│   ├── New Build
│   ├── Refurbishment
│   ├── Fit-Out
│   └── Infrastructure
```

### 3. Process Overlays

Core process: **Order-to-Cash**

```text
Core: Order → Fulfil → Invoice → Payment
CBE:  Contract Award → Valuation → Application → Certificate → Payment → Retention Release
```

Core process: **Procure-to-Pay**

```text
Core: Requisition → PO → Receipt → Invoice → Payment
CBE:  Package Tender → Subcontract → Site Order → Valuation → Payment → CIS
```

### 4. Compliance Overlays

```text
Core F20: Risk & Compliance
├── CBE: CDM 2015
├── CBE: Building Safety Act
├── CBE: Building Regulations
├── CBE: Planning Conditions
├── CBE: Environmental Permits
└── CBE: Fire Safety
```

---

## Architecture Layers (Technical View)

```text
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                         │
│  Core UI + CBE UI (site app, BIM viewer, estimating)        │
├─────────────────────────────────────────────────────────────┤
│  APPLICATION LAYER                                          │
│  Core Services (F01–F29) + CBE Services (bolt-on modules)   │
├─────────────────────────────────────────────────────────────┤
│  DOMAIN LAYER                                               │
│  Core Domain Models + CBE Domain Extensions                 │
├─────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                 │
│  Core Schema + CBE Schema Extensions                        │
├─────────────────────────────────────────────────────────────┤
│  INTEGRATION LAYER                                          │
│  Core APIs + CBE APIs (BIM, CDE, estimating, planning)      │
└─────────────────────────────────────────────────────────────┘
```

---

## Module Packaging

### Core Modules (sell to any business)

| Module | Functions |
|---|---|
| Strategy & Governance | F01, F02 |
| Performance Management | F03 |
| Corporate Development | F04 |
| Product & Innovation | F05 |
| Marketing & Sales | F06, F07 |
| Customer Service | F08 |
| Procurement | F09 |
| Supply Chain | F10 |
| Manufacturing | F11 |
| Service Delivery | F12 |
| Quality | F13 |
| Finance | F14 |
| HR | F15 |
| IT | F16 |
| Data & AI | F17 |
| Security | F18 |
| Legal | F19 |
| Risk & Audit | F20 |
| Privacy | F21 |
| Property & Assets | F22 |
| HSE | F23 |
| Continuity | F24 |
| Communications | F25 |
| Knowledge | F26 |
| Projects | F27 |
| Change | F28 |
| Process | F29 |

### CBE Bolt-On Modules (sell to construction only)

| Module | Extends |
|---|---|
| **CBE Commercial** | F07, F14 — valuations, applications, variations, claims, retentions, CVR, WIP |
| **CBE Projects** | F27, F05 — RIBA stages, design management, stage gates, work packages, final accounts |
| **CBE Procurement** | F09, F10 — trade packages, subcontracts, CIS, plant hire, site orders |
| **CBE Site Operations** | F11, F12 — site logistics, installation, commissioning, field service |
| **CBE Quality** | F13 — ITPs, inspections, test certificates, snags, benchmarks |
| **CBE HSE** | F23, F24 — CDM, permits, RIDDOR, COSHH, asbestos, site emergency |
| **CBE Digital** | F16, F17 — BIM, CDE, digital twin, IoT, Uniclass |
| **CBE Assets** | F22 — plant, equipment, vehicles, LOLER, PUWER, plant hire |
| **CBE Legal** | F19 — main contracts, subcontracts, novations, adjudication, SPVs |
| **CBE Sustainability** | F23, F25 — carbon, social value, biodiversity, net zero |
| **CBE Client** | F08 — RFIs, snags, handover, O&M, as-builts, warranties, DLP |
| **CBE Workforce** | F15 — CSCS, competencies, trades, project assignments, apprenticeships |

---

## Key Design Rules

1. **Core must never reference CBE** — dependency flows one way only
2. **CBE extends, never modifies** — core objects are inherited, not changed
3. **CBE registers at startup** — bolt-on modules self-register with core
4. **Core APIs are stable** — CBE builds on versioned interfaces
5. **CBE can be disabled** — core works without any bolt-on
6. **Multiple bolt-ons possible** — CBE + Manufacturing + Retail can coexist
7. **Shared services** — both layers use common auth, workflow, audit, notification

---

## Example: How F14 Finance Works in Both Layers

### Core F14 (any business)

```text
Chart of Accounts
Journals
AP / AR
Fixed Assets
Budgeting
Forecasting
Treasury
Tax
Reporting
```

### CBE F14 (construction)

```text
Core F14
+ Contract Ledger
+ Project Cost Codes
+ Cost Value Reconciliation (CVR)
+ WIP Valuation
+ Applications for Payment
+ Interim Valuations
+ Retentions
+ CIS (Construction Industry Scheme)
+ Domestic Reverse Charge VAT
+ Bonds & Guarantees
+ Cost-to-Complete
+ Final Accounts
+ Subcontractor Ledger
+ Plant Cost Allocation
```

A retail company uses Core F14 only. A construction company uses Core F14 + CBE F14.

---

## Example: How F27 Projects Works in Both Layers

### Core F27 (any business)

```text
Portfolio
Programme
Project
Stage Gate
Work Package
Schedule
Budget
Resource Plan
Risk Plan
PMO
```

### CBE F27 (construction)

```text
Core F27
+ RIBA Stages
+ Design Management
+ Procurement Plan
+ Construction Programme
+ Site Establishment
+ Method Statements
+ Commissioning
+ Handover
+ Defects Liability Period
+ Final Account
+ O&M Manuals
+ As-Builts
```

---

## Summary

| Layer | Purpose | Audience | Changes |
|---|---|---|---|
| **Core 29** | Universal enterprise capability | Any business | Slow, stable, versioned |
| **CBE Bolt-On** | Construction-specific extension | Construction only | Faster, vertical-specific |

**The Core 29 stay generic. CBE adds the construction reality on top.**

---

## Next Steps

1. **Produce the formal extension point specification** — for each of the 29 core functions, define exactly where CBE hooks in.
2. **Define the CBE data model** — entities, attributes, relationships for the bolt-on.
3. **Map the CBE processes** — end-to-end flows (tender-to-handover, procure-to-pay, valuation-to-cash).
4. **Design the module packaging** — how CBE modules are bundled and licensed.
5. **Build the integration map** — how CBE modules talk to each other and to core.
```

# CBE Delivery Domains: The Third Axis

Your `deliveryDomains` file introduces a **third organising dimension** to the architecture. This is important — it changes how we package and sell the CBE bolt-on layer.

---

## The Three-Axis Model

```text
┌─────────────────────────────────────────────────────────────┐
│  AXIS 3: DELIVERY DOMAINS (D01–D16)                         │
│  What the CBE firm actually does for clients                │
│  (Architecture, Engineering, Surveying, Trades, Utilities…) │
├─────────────────────────────────────────────────────────────┤
│  AXIS 2: CBE BOLT-ON MODULES                                │
│  Construction-specific extensions to core functions         │
│  (Commercial, Projects, Procurement, HSE, BIM…)             │
├─────────────────────────────────────────────────────────────┤
│  AXIS 1: CORE 29 FUNCTIONS (F01–F29)                        │
│  Universal enterprise capabilities                          │
│  (Finance, HR, Sales, Procurement, IT, Legal…)              │
└─────────────────────────────────────────────────────────────┘
```

| Axis | Question it answers | Granularity | Changes |
|---|---|---|---|
| **Core 29** | What internal capability is needed? | Enterprise function | Slow, stable |
| **CBE Bolt-Ons** | What construction-specific extension applies? | Module | Medium |
| **Delivery Domains** | What service line does the firm deliver? | Industry domain | Fast, market-driven |

**Key insight:** Delivery domains are **service lines**, not internal functions. A single firm may operate several domains (e.g. a multidisciplinary consultancy running D01 + D02 + D03 + D04 + D05). A specialist trade contractor might operate only D07 or D08.

---

## How the Three Axes Combine

A delivery domain is delivered by **activating a set of core functions + CBE bolt-ons**, configured for that domain.

```text
Delivery Domain (e.g. D04 Commercial, Contracts & Cost)
        │
        ├── activates Core Functions:  F01, F02, F03, F04, F07, F09, F13, F14, F19, F20, F27
        │
        ├── activates CBE Bolt-Ons:    CBE Commercial, CBE Projects,
        │                              CBE Procurement, CBE Legal,
        │                              CBE Quality, CBE Client
        │
        └── adds Domain-Specific:      Estimating, BoQ, Take-off,
                                       Cost Planning, QS Workflows,
                                       Contract Administration
```

This means **one ERP instance can host multiple delivery domains**, each with its own module activation, workflows, and terminology — while sharing one core.

---

## Mapping D01–D16 to Core Functions

| Domain | Primary Core Functions | Secondary Core Functions |
|---|---|---|
| **D01 Architecture & Design** | F05, F27, F26 | F06, F07, F13, F16, F17 |
| **D02 Engineering & Technical Design** | F05, F27, F13 | F16, F17, F19, F26 |
| **D03 Surveying, Property & Land** | F03, F05, F22 | F14, F19, F20, F27 |
| **D04 Commercial, Contracts & Cost** | F07, F14, F19, F27 | F03, F09, F13, F20 |
| **D05 Geospatial, Planning & Transport** | F05, F17, F27 | F03, F06, F16, F20 |
| **D06 Site Delivery & Construction Mgmt** | F11, F12, F27 | F09, F13, F15, F22, F23, F24 |
| **D07 Building Trades** | F11, F12, F15 | F07, F09, F13, F22, F23 |
| **D08 Building Services Trades** | F11, F12, F13 | F09, F15, F22, F23 |
| **D09 Energy & Building Performance** | F05, F13, F22, F23 | F03, F07, F09, F17 |
| **D10 Facilities, Property & Asset Ops** | F12, F22 | F03, F08, F09, F13, F20, F23 |
| **D11 Plant, Equipment & Specialist Ops** | F11, F12, F22 | F09, F15, F23, F24 |
| **D12 Utilities & Networks** | F10, F12, F22 | F11, F13, F20, F23, F24 |
| **D13 Heritage, Conservation & Landscape** | F05, F11, F12 | F13, F15, F22, F23, F26 |
| **D14 Supply Chain & Manufacturing** | F09, F10, F11 | F05, F07, F14, F17, F22 |
| **D15 Regulation, Inspection & Compliance** | F13, F20 | F03, F08, F19, F23, F26 |
| **D16 Infrastructure, Land & Rural** | F11, F12, F22 | F09, F10, F13, F15, F23, F24 |

---

## Gap Analysis: Existing CBE Bolt-Ons vs Delivery Domains

The 12 CBE bolt-on modules proposed earlier **do not cover all 16 delivery domains**. Here is the gap:

| Domain | Covered by Existing Modules? | Gap |
|---|---|---|
| D01 Architecture & Design | Partial (CBE Projects, CBE Digital) | Design management, RIBA stages, drawing control weak |
| D02 Engineering & Technical Design | Partial (CBE Projects, CBE Quality) | Structural/civil/MEP design workflows missing |
| D03 Surveying, Property & Land | **No** | Valuation, land, development, rural surveying missing |
| D04 Commercial, Contracts & Cost | Yes (CBE Commercial) | — |
| D05 Geospatial, Planning & Transport | **No** | GIS, planning applications, transport modelling missing |
| D06 Site Delivery & Construction Mgmt | Yes (CBE Site Operations) | — |
| D07 Building Trades | Partial (CBE Site Ops, CBE Workforce) | Trade-specific work orders, snagging missing |
| D08 Building Services Trades | Partial (CBE Site Ops) | MEP jobs, testing, maintenance missing |
| D09 Energy & Building Performance | **No** | Retrofit, renewables, EPC, insulation missing |
| D10 Facilities, Property & Asset Ops | Yes (CBE Assets) | — |
| D11 Plant, Equipment & Specialist Ops | Partial (CBE Assets) | Lifting, access, extraction missing |
| D12 Utilities & Networks | **No** | Roads, gas, water network field ops missing |
| D13 Heritage, Conservation & Landscape | **No** | Conservation, craft, landscape missing |
| D14 Supply Chain & Manufacturing | Partial (CBE Procurement + Core F11) | Merchant, fabrication, fulfilment missing |
| D15 Regulation, Inspection & Compliance | Partial (CBE Quality, CBE HSE) | Regulatory assessment, certification missing |
| D16 Infrastructure, Land & Rural | **No** | Rural contracting, land ops, mobile resources missing |

**Conclusion:** The CBE bolt-on set needs to expand from 12 modules to approximately **20 modules** to properly cover all 16 delivery domains.

---

## Proposed Expanded CBE Bolt-On Module Set

### Tier 1: Horizontal CBE Modules (apply across all domains)

| Module | Extends | Serves Domains |
|---|---|---|
| **CBE Commercial** | F07, F14 | D01–D16 (all) |
| **CBE Projects** | F27, F05 | D01–D16 (all) |
| **CBE Procurement** | F09, F10 | D01–D16 (all) |
| **CBE HSE** | F23, F24 | D01–D16 (all) |
| **CBE Quality** | F13 | D01–D16 (all) |
| **CBE Digital (BIM/CDE)** | F16, F17 | D01, D02, D05, D15 |
| **CBE Legal** | F19 | D01–D16 (all) |
| **CBE Client** | F08 | D01–D16 (all) |
| **CBE Workforce** | F15 | D06–D09, D11, D13, D16 |
| **CBE Assets** | F22 | D06, D10, D11, D12, D16 |
| **CBE Sustainability** | F23, F25 | D09, D13, D15, D16 |

### Tier 2: Domain-Specific CBE Modules (new)

| Module | Serves Domain | Adds |
|---|---|---|
| **CBE Design Management** | D01, D02 | RIBA stages, design responsibility matrix, drawing control, design reviews, clash detection |
| **CBE Surveying & Property** | D03 | Valuations, land registry, development appraisal, rural surveying, property management |
| **CBE Geospatial & Planning** | D05 | GIS, mapping, planning applications, transport modelling, spatial data |
| **CBE Site Operations** | D06 | Site establishment, method statements, permits, site logistics, demolition |
| **CBE Trades** | D07 | Work orders, trade scheduling, materials, installation, snagging |
| **CBE MEP Services** | D08 | MEP jobs, equipment, testing, commissioning, maintenance |
| **CBE Energy & Retrofit** | D09 | Energy assessment, EPC, retrofit, renewables, insulation, PAS 2035 |
| **CBE Facilities & Asset Ops** | D10 | PPM, reactive maintenance, compliance, asset lifecycle |
| **CBE Plant & Specialist Ops** | D11 | Plant, lifting, access, extraction, specialist equipment, LOLER |
| **CBE Utilities & Networks** | D12 | Roads, gas, water, network field ops, permits, reinstatement |
| **CBE Heritage & Landscape** | D13 | Conservation, craft, landscape, heritage compliance |
| **CBE Supply Chain & Manufacturing** | D14 | Merchant stock, fabrication, offsite manufacture, fulfilment |
| **CBE Regulatory & Inspection** | D15 | Regulatory assessment, inspection, decision, certification |
| **CBE Infrastructure & Rural** | D16 | Rural contracting, land operations, mobile resources, field service |

**Total: 11 horizontal + 14 domain-specific = 25 CBE modules**

---

## Domain → Module Activation Matrix

| Domain | Horizontal Modules | Domain-Specific Module |
|---|---|---|
| D01 Architecture & Design | Commercial, Projects, HSE, Quality, Digital, Legal, Client | Design Management |
| D02 Engineering & Technical Design | Commercial, Projects, HSE, Quality, Digital, Legal, Client | Design Management |
| D03 Surveying, Property & Land | Commercial, Projects, HSE, Quality, Legal, Client | Surveying & Property |
| D04 Commercial, Contracts & Cost | Commercial, Projects, Procurement, HSE, Quality, Legal, Client | (Commercial is primary) |
| D05 Geospatial, Planning & Transport | Commercial, Projects, HSE, Quality, Digital, Legal, Client | Geospatial & Planning |
| D06 Site Delivery & Construction Mgmt | Commercial, Projects, Procurement, HSE, Quality, Legal, Client, Workforce, Assets | Site Operations |
| D07 Building Trades | Commercial, Projects, Procurement, HSE, Quality, Legal, Client, Workforce | Trades |
| D08 Building Services Trades | Commercial, Projects, Procurement, HSE, Quality, Legal, Client, Workforce | MEP Services |
| D09 Energy & Building Performance | Commercial, Projects, HSE, Quality, Legal, Client, Workforce, Sustainability | Energy & Retrofit |
| D10 Facilities, Property & Asset Ops | Commercial, Projects, Procurement, HSE, Quality, Legal, Client, Assets | Facilities & Asset Ops |
| D11 Plant, Equipment & Specialist Ops | Commercial, Projects, Procurement, HSE, Quality, Legal, Client, Workforce, Assets | Plant & Specialist Ops |
| D12 Utilities & Networks | Commercial, Projects, Procurement, HSE, Quality, Legal, Client, Assets | Utilities & Networks |
| D13 Heritage, Conservation & Landscape | Commercial, Projects, HSE, Quality, Legal, Client, Workforce, Sustainability | Heritage & Landscape |
| D14 Supply Chain & Manufacturing | Commercial, Projects, Procurement, HSE, Quality, Legal, Client | Supply Chain & Manufacturing |
| D15 Regulation, Inspection & Compliance | Commercial, Projects, HSE, Quality, Digital, Legal, Client, Sustainability | Regulatory & Inspection |
| D16 Infrastructure, Land & Rural | Commercial, Projects, Procurement, HSE, Quality, Legal, Client, Workforce, Assets, Sustainability | Infrastructure & Rural |

---

## Revised Industry Solution Structure

```text
CBE Industry Solution
├── Core 29 Functions (shared with all industries)
│
├── Horizontal CBE Modules (11)
│   ├── CBE Commercial
│   ├── CBE Projects
│   ├── CBE Procurement
│   ├── CBE HSE
│   ├── CBE Quality
│   ├── CBE Digital (BIM/CDE)
│   ├── CBE Legal
│   ├── CBE Client
│   ├── CBE Workforce
│   ├── CBE Assets
│   └── CBE Sustainability
│
└── Domain-Specific CBE Modules (14)
    ├── CBE Design Management         → D01, D02
    ├── CBE Surveying & Property      → D03
    ├── CBE Geospatial & Planning     → D05
    ├── CBE Site Operations           → D06
    ├── CBE Trades                    → D07
    ├── CBE MEP Services              → D08
    ├── CBE Energy & Retrofit         → D09
    ├── CBE Facilities & Asset Ops    → D10
    ├── CBE Plant & Specialist Ops    → D11
    ├── CBE Utilities & Networks      → D12
    ├── CBE Heritage & Landscape      → D13
    ├── CBE Supply Chain & Mfg        → D14
    ├── CBE Regulatory & Inspection   → D15
    └── CBE Infrastructure & Rural    → D16
```

---

## Licensing & Packaging Implications

| Packaging Model | Description | Target Customer |
|---|---|---|
| **Core only** | F01–F29 | Any business |
| **Core + Horizontal CBE** | Core + 11 horizontal modules | Small/mid CBE firm (single domain) |
| **Core + Horizontal + 1 Domain** | Core + horizontals + one domain module | Specialist contractor |
| **Core + Horizontal + Multi-Domain** | Core + horizontals + multiple domain modules | Multidisciplinary firm |
| **Core + Horizontal + All Domains** | Full CBE suite | Large contractor / group |

**Example customers:**
- A **quantity surveying practice** → Core + Horizontal + CBE Commercial (D04)
- A **regional housebuilder** → Core + Horizontal + CBE Site Operations (D06) + CBE Trades (D07)
- A **facilities management firm** → Core + Horizontal + CBE Facilities & Asset Ops (D10) + CBE MEP Services (D08)
- A **multidisciplinary consultancy** → Core + Horizontal + D01 + D02 + D03 + D04 + D05
- A **utility contractor** → Core + Horizontal + CBE Utilities & Networks (D12) + CBE Infrastructure & Rural (D16)

---

## Key Design Rules (Updated)

1. **Core must never reference CBE** — dependency flows one way only
2. **CBE bolt-ons extend, never modify** — core objects are inherited
3. **Delivery domains activate modules** — a domain is a configuration of modules, not a module itself
4. **Domains can overlap** — one firm may run multiple domains on one instance
5. **Modules are independently licensable** — customers pay for what they use
6. **Horizontal modules are shared** — all domains draw on the same horizontal CBE modules
7. **Domain-specific modules are optional** — only activate what the customer delivers
8. **Terminology is domain-configurable** — "job" vs "project" vs "contract" vs "works order" set per domain

---

## Summary

| Layer | Count | Purpose |
|---|---|---|
| **Core Functions** | 29 | Universal enterprise capability |
| **Horizontal CBE Modules** | 11 | Construction-wide extensions |
| **Domain-Specific CBE Modules** | 14 | Service-line extensions |
| **Delivery Domains** | 16 | Market-facing service lines |

**The delivery domains are the commercial packaging layer. The CBE modules are the technical delivery layer. The Core 29 are the foundation.**

---

## Next Steps

1. **Define each domain's workflow catalogue** — end-to-end processes per D01–D16
2. **Specify the activation model** — how domains turn modules on/off at tenant setup
3. **Design the data model per domain** — entities, attributes, relationships
4. **Build the domain-to-module matrix as a config artefact** — machine-readable activation rules
5. **Define cross-domain shared services** — how D01 and D06 share a project, for example
6. **Produce licensing tiers** — commercial packaging per domain combination