# L2/L3 Canonical Object & Action Map

**Status:** governed — final architecture gate  
**Date:** 18 September 2026  
**Source:** 353 L2 sub-functions / 1,510 activities revalidated from the prior NuBlox functional-role taxonomy  
**Authority:** `app/src/lib/data/activity-object-action-mapping.ts`

This register preserves the enterprise-function depth of the prior programme while mapping it into the V3 canonical architecture. The source taxonomy is business provenance only; old application/module boundaries are not inherited.

## Completion

- **29/29** tenant workspaces mapped;
- **353/353** L2 sub-functions mapped;
- **1,510/1,510** source activities mapped;
- every L2 has one stable primary workspace home;
- every activity resolves to one frozen primary aggregate and one canonical semantic object focus;
- every activity has a command/query action classification;
- authority, decision/approval and evidence requirements are derivable from the mapping;
- cross-workspace dependencies use secondary aggregate references rather than duplicate records;
- **0** unmapped L2s;
- **0** ambiguous L2 routes;
- **0** unknown semantic object IDs;
- **0** invalid aggregate references.

## Action semantics

The machine map uses the governed verbs: create, read, change, submit, review, approve, publish, execute, record, post, issue, receive, allocate, reconcile, close, retire, analyse, monitor, configure and cancel.

A mapped **command** may write only its primary aggregate boundary. Secondary aggregates are references/handoffs and require their own authorised command. Query actions are read-only.

## Workspace map

### F01 — Strategy & Enterprise Planning

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F01.01 | Vision & Purpose | 5 | `AGG-02-STRATEGY` | `SGP-STRATEGY-FRAMEWORK` Strategy / Business Planning | `AGG-02-OBJECTIVE` |
| F01.02 | Environmental Analysis | 6 | `AGG-02-STRATEGY` | `SGP-ASSUMPTION` Strategic Assumption / External Evidence | `AGG-03-OPPORTUNITY` |
| F01.03 | Strategic Planning | 5 | `AGG-02-STRATEGY` | `SGP-STRATEGY-FRAMEWORK` Strategy / Business Planning | `AGG-02-OBJECTIVE` |
| F01.04 | Business Planning | 5 | `AGG-02-STRATEGY` | `SGP-STRATEGY-FRAMEWORK` Strategy / Business Planning | `AGG-02-OBJECTIVE` |
| F01.05 | Operating Model | 5 | `AGG-02-STRATEGY` | `SGP-STRATEGY-FRAMEWORK` Strategy / Business Planning | `AGG-02-OBJECTIVE` |
| F01.06 | Goal & KPI Management | 6 | `AGG-02-PERFORMANCE` | `SGP-KPI-DEFINITION` KPI / Performance | `AGG-02-STRATEGY` |
| F01.07 | Strategic Review | 5 | `AGG-02-GOVERNANCE` | `SGP-GOVERNANCE-MEETING` Strategic Review / Decision | `AGG-02-STRATEGY`, `AGG-27-DECISION` |
| F01.08 | Scenario & Foresight Planning | 4 | `AGG-02-STRATEGY` | `SGP-SCENARIO` Scenario / Assumption | `AGG-02-PERFORMANCE` |

### F02 — Corporate Governance

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F02.01 | Board Governance | 5 | `AGG-02-GOVERNANCE` | `SGP-GOVERNANCE-BODY` Governance Body / Meeting | `AGG-27-DECISION` |
| F02.02 | Governance Framework | 4 | `AGG-02-GOVERNANCE` | `SGP-AUTHORITY-FRAMEWORK` Governance / Authority Framework | `AGG-01-AUTHORITY` |
| F02.03 | Delegation of Authority | 4 | `AGG-01-AUTHORITY` | `AUTH-DELEGATED-AUTHORITY` Delegated Authority | `AGG-29-AUTHORITY-CONFIG` |
| F02.04 | Executive Management | 4 | `AGG-02-GOVERNANCE` | `SGP-GOVERNANCE-MEETING` Executive Governance / Decision | `AGG-27-DECISION`, `AGG-19-LEDGER` |
| F02.05 | Committee Governance | 5 | `AGG-02-GOVERNANCE` | `SGP-GOVERNANCE-BODY` Governance Body / Meeting | `AGG-27-DECISION` |
| F02.06 | Policy Governance | 5 | `AGG-02-GOVERNANCE` | `SGP-POLICY` Policy | `AGG-07-INFORMATION` |
| F02.07 | Ethics Governance | 4 | `AGG-21-RISK` | `INTEGRITY-CASE` Integrity / Ethics Case | `AGG-21-CONTROL` |

### F03 — Enterprise Performance Management

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F03.01 | Performance Framework | 3 | `AGG-02-PERFORMANCE` | `SGP-KPI-DEFINITION` Performance Framework / KPI | — |
| F03.02 | Performance Reporting | 4 | `AGG-02-PERFORMANCE` | `SGP-PERFORMANCE-SNAPSHOT` Performance Snapshot | `AGG-24-DATA` |
| F03.03 | Variance Management | 4 | `AGG-02-PERFORMANCE` | `SGP-PERFORMANCE-OBSERVATION` Performance Observation / Variance | `AGG-27-DECISION` |
| F03.04 | Management Review | 4 | `AGG-02-GOVERNANCE` | `SGP-GOVERNANCE-MEETING` Management Review | `AGG-02-PERFORMANCE`, `AGG-27-DECISION` |
| F03.05 | Benchmarking | 4 | `AGG-02-PERFORMANCE` | `SGP-PERFORMANCE-SNAPSHOT` Performance Snapshot | `AGG-24-DATA` |
| F03.06 | Benefits Realisation | 5 | `AGG-02-PERFORMANCE` | `SGP-PERFORMANCE-TARGET` Benefit / Performance Target | `AGG-26-TRANSFORMATION` |

### F04 — Corporate Development & M&A

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F04.01 | Opportunity Identification | 3 | `AGG-04-DEVELOPMENT` | `LDI-DEVELOPMENT-OPPORTUNITY` Corporate Development Opportunity | `AGG-03-OPPORTUNITY` |
| F04.02 | Valuation | 4 | `AGG-04-DEVELOPMENT` | `LDI-DEVELOPMENT-APPRAISAL` Investment / Development Appraisal | `AGG-19-LEDGER` |
| F04.03 | Due Diligence | 7 | `AGG-22-LEGAL` | `LEGAL-MATTER` Due Diligence Matter | `AGG-21-RISK`, `AGG-04-DEVELOPMENT` |
| F04.04 | Transaction Management | 5 | `AGG-04-DEVELOPMENT` | `LDI-BUSINESS-CASE` Investment / Transaction Business Case | `AGG-22-LEGAL`, `AGG-19-LEDGER`, `AGG-27-DECISION` |
| F04.05 | Integration | 4 | `AGG-26-TRANSFORMATION` | `TRANS-INITIATIVE` Integration / Transformation Initiative | `AGG-01-ORG-STRUCTURE` |
| F04.06 | Divestiture | 5 | `AGG-04-DEVELOPMENT` | `LDI-BUSINESS-CASE` Investment / Transaction Business Case | `AGG-22-LEGAL`, `AGG-19-LEDGER`, `AGG-27-DECISION` |
| F04.07 | Strategic Partnerships | 5 | `AGG-04-DEVELOPMENT` | `LDI-BUSINESS-CASE` Investment / Transaction Business Case | `AGG-22-LEGAL`, `AGG-19-LEDGER`, `AGG-27-DECISION` |

### F05 — Product, Service & Innovation Management

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F05.01 | Portfolio Strategy | 5 | `AGG-04-DEVELOPMENT` | `LDI-BUSINESS-CASE` Product / Service Business Case | `AGG-02-STRATEGY` |
| F05.02 | Market / Customer Needs | 4 | `AGG-03-OPPORTUNITY` | `CRM-MARKET-INSIGHT` Market / Customer Need | `AGG-07-ENGINEERING-REQUIREMENTS` |
| F05.03 | Product / Service Ideation | 5 | `AGG-10-ITEM` | `CBO-ITEM` Product / Service Concept | `AGG-04-DEVELOPMENT` |
| F05.04 | Business Case Development | 5 | `AGG-04-DEVELOPMENT` | `LDI-BUSINESS-CASE` Product / Service Business Case | `AGG-02-STRATEGY` |
| F05.05 | Product / Service Design | 5 | `AGG-10-CONFIGURATION` | `CFG-PRODUCT-CONFIG-MODEL` Product / Service Definition | `AGG-07-ENGINEERING-REQUIREMENTS`, `AGG-07-ENGINEERING-MODEL` |
| F05.06 | Development | 4 | `AGG-10-CONFIGURATION` | `CFG-PRODUCT-CONFIG-MODEL` Product / Service Definition | `AGG-07-ENGINEERING-REQUIREMENTS`, `AGG-07-ENGINEERING-MODEL` |
| F05.07 | Launch Management | 5 | `AGG-10-ITEM` | `CBO-ITEM` Item / Offering | `AGG-03-OPPORTUNITY`, `AGG-10-PLANNING` |
| F05.08 | Lifecycle Management | 4 | `AGG-10-ITEM` | `CBO-ITEM` Item Lifecycle | `AGG-10-CONFIGURATION` |
| F05.09 | Product Retirement | 5 | `AGG-10-ITEM` | `CBO-ITEM` Item Lifecycle | `AGG-10-CONFIGURATION` |
| F05.10 | Innovation Management | 4 | `AGG-04-DEVELOPMENT` | `LDI-BUSINESS-CASE` Product / Service Business Case | `AGG-02-STRATEGY` |

### F06 — Marketing & Brand

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F06.01 | Market Intelligence | 4 | `AGG-03-OPPORTUNITY` | `CRM-MARKET-INSIGHT` Market Insight / Segment | `AGG-24-DATA` |
| F06.02 | Customer Segmentation | 4 | `AGG-03-OPPORTUNITY` | `CRM-MARKET-INSIGHT` Market Insight / Segment | `AGG-24-DATA` |
| F06.03 | Brand Management | 4 | `AGG-25-COMMUNICATIONS` | `KRC-COMMS-PLAN` Brand / Marketing Plan | `AGG-02-STRATEGY` |
| F06.04 | Marketing Strategy | 4 | `AGG-25-COMMUNICATIONS` | `KRC-COMMS-PLAN` Brand / Marketing Plan | `AGG-02-STRATEGY` |
| F06.05 | Campaign Management | 6 | `AGG-25-COMMUNICATIONS` | `KRC-COMMS-CAMPAIGN` Marketing / Communications Campaign | `AGG-07-INFORMATION` |
| F06.06 | Digital Marketing | 6 | `AGG-25-COMMUNICATIONS` | `KRC-COMMS-CAMPAIGN` Marketing / Communications Campaign | `AGG-07-INFORMATION` |
| F06.07 | Content Marketing | 5 | `AGG-25-COMMUNICATIONS` | `KRC-COMMS-CAMPAIGN` Marketing / Communications Campaign | `AGG-07-INFORMATION` |
| F06.08 | Events | 5 | `AGG-25-COMMUNICATIONS` | `KRC-COMMS-CAMPAIGN` Marketing / Communications Campaign | `AGG-07-INFORMATION` |
| F06.09 | Lead Generation | 5 | `AGG-03-OPPORTUNITY` | `CRM-LEAD` Lead | `AGG-25-COMMUNICATIONS` |
| F06.10 | Marketing Analytics | 6 | `AGG-03-OPPORTUNITY` | `CRM-MARKET-INSIGHT` Market Insight / Segment | `AGG-24-DATA` |
| F06.11 | Market Communications | 4 | `AGG-25-COMMUNICATIONS` | `KRC-COMMS-CAMPAIGN` Marketing / Communications Campaign | `AGG-07-INFORMATION` |

### F07 — Sales & Commercial Management

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F07.01 | Sales Strategy | 6 | `AGG-03-OPPORTUNITY` | `CRM-ACCOUNT-PLAN` Sales / Account Plan | `AGG-02-PERFORMANCE` |
| F07.02 | Account Management | 4 | `AGG-03-OPPORTUNITY` | `CRM-ACCOUNT-PLAN` Account / Partner Plan | `AGG-01-PARTY` |
| F07.03 | Opportunity Management | 6 | `AGG-03-OPPORTUNITY` | `CRM-OPPORTUNITY` Opportunity / Pipeline | `AGG-02-PERFORMANCE` |
| F07.04 | Pipeline Management | 4 | `AGG-03-OPPORTUNITY` | `CRM-OPPORTUNITY` Opportunity / Pipeline | `AGG-02-PERFORMANCE` |
| F07.05 | Pricing | 5 | `AGG-10-ITEM` | `ITEM-PRICE-LIST` Price / Commercial Definition | `AGG-05-ESTIMATE` |
| F07.06 | Quotation | 5 | `AGG-05-OFFER` | `EST-QUOTATION` Quotation | `AGG-05-ESTIMATE` |
| F07.07 | Proposal / Bid Management | 5 | `AGG-03-PURSUIT` | `CRM-PURSUIT` Pursuit / Bid | `AGG-05-ESTIMATE`, `AGG-05-OFFER` |
| F07.08 | Contract Negotiation | 6 | `AGG-08-CONTRACT` | `CBO-CONTRACT` Contract | `AGG-22-LEGAL` |
| F07.09 | Sales Order Management | 6 | `AGG-05-OFFER` | `EST-SALES-ORDER` Sales Order | `AGG-08-CONTRACT` |
| F07.10 | Channel / Partner Sales | 5 | `AGG-03-OPPORTUNITY` | `CRM-ACCOUNT-PLAN` Account / Partner Plan | `AGG-01-PARTY` |
| F07.11 | Sales Compensation | 4 | `AGG-18-PAYROLL` | `HCM-COMPENSATION` Sales Compensation | `AGG-19-LEDGER` |
| F07.12 | Sales Forecasting | 4 | `AGG-03-OPPORTUNITY` | `CRM-OPPORTUNITY` Opportunity / Pipeline | `AGG-02-PERFORMANCE` |
| F07.13 | Sales Performance | 6 | `AGG-03-OPPORTUNITY` | `CRM-ACCOUNT-PLAN` Sales / Account Plan | `AGG-02-PERFORMANCE` |

### F08 — Customer Service, Experience & Success

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F08.01 | Customer Onboarding | 5 | `AGG-03-CUSTOMER-CASE` | `CRM-CUSTOMER-ONBOARDING` Customer Onboarding | `AGG-01-PARTY` |
| F08.02 | Customer Enquiry Management | 6 | `AGG-03-CUSTOMER-CASE` | `CRM-CUSTOMER-CASE` Customer Case | `AGG-01-PARTY` |
| F08.03 | Case Management | 6 | `AGG-03-CUSTOMER-CASE` | `CRM-CUSTOMER-CASE` Customer Case | `AGG-01-PARTY` |
| F08.04 | Complaint Management | 5 | `AGG-03-CUSTOMER-CASE` | `CRM-CUSTOMER-CASE` Customer Case | `AGG-01-PARTY` |
| F08.05 | Technical Support | 5 | `AGG-17-SERVICE` | `OPS-SERVICE-CASE` Service Case | `AGG-17-WORK-ORDER` |
| F08.06 | Returns / Refunds | 5 | `AGG-03-CUSTOMER-CASE` | `CRM-CUSTOMER-CASE` Return / Refund Case | `AGG-10-INVENTORY-MOVEMENT`, `AGG-19-AR` |
| F08.07 | Warranty | 4 | `AGG-17-SERVICE` | `OPS-WARRANTY-CLAIM` Warranty Claim | `AGG-16-SPATIAL-ASSET` |
| F08.08 | Customer Success | 4 | `AGG-03-CUSTOMER-CASE` | `CRM-CUSTOMER-CASE` Customer Case | `AGG-01-PARTY` |
| F08.09 | Retention | 4 | `AGG-03-CUSTOMER-CASE` | `CRM-CUSTOMER-CASE` Customer Case | `AGG-01-PARTY` |
| F08.10 | Customer Feedback | 4 | `AGG-03-CUSTOMER-CASE` | `CRM-CUSTOMER-CASE` Customer Case | `AGG-01-PARTY` |
| F08.11 | Customer Knowledge | 4 | `AGG-25-KNOWLEDGE` | `KRC-KNOWLEDGE-ARTICLE` Knowledge Article | `AGG-03-CUSTOMER-CASE` |
| F08.12 | Service-level Management | 4 | `AGG-17-SERVICE` | `OPS-SERVICE-LEVEL` Service Entitlement / SLA | `AGG-08-CONTRACT` |

### F09 — Procurement & Supplier Management

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F09.01 | Procurement Strategy | 4 | `AGG-09-SOURCING` | `COM-PROCUREMENT-PACKAGE` Procurement Strategy / Package | `AGG-02-PERFORMANCE` |
| F09.02 | Category Management | 4 | `AGG-09-SOURCING` | `COM-PROCUREMENT-PACKAGE` Procurement Strategy / Package | `AGG-02-PERFORMANCE` |
| F09.03 | Supplier Discovery | 4 | `AGG-01-PARTY` | `AUTH-PARTY-RELATIONSHIP` Supplier Relationship | `AGG-09-SOURCING` |
| F09.04 | Sourcing | 4 | `AGG-09-SOURCING` | `PROC-SOURCING-EVENT` Sourcing Event | `AGG-01-PARTY` |
| F09.05 | Supplier Negotiation | 5 | `AGG-09-SOURCING` | `PROC-SOURCING-EVENT` Sourcing Event | `AGG-01-PARTY` |
| F09.06 | Contracting | 6 | `AGG-08-CONTRACT` | `CBO-CONTRACT` Supplier Contract | `AGG-09-SOURCING` |
| F09.07 | Supplier Onboarding | 4 | `AGG-01-PARTY` | `AUTH-PARTY-RELATIONSHIP` Supplier Relationship | `AGG-09-SOURCING` |
| F09.08 | Requisitioning | 4 | `AGG-09-SOURCING` | `PROC-REQUISITION` Requisition | — |
| F09.09 | Purchase Ordering | 5 | `AGG-09-PURCHASE-COMMITMENT` | `PROC-PURCHASE-ORDER` Purchase Order | `AGG-08-CONTRACT` |
| F09.10 | Supplier Performance | 5 | `AGG-02-PERFORMANCE` | `SGP-PERFORMANCE-OBSERVATION` Supplier Performance | `AGG-01-PARTY` |
| F09.11 | Supplier Risk | 3 | `AGG-21-RISK` | `RISK-ENTERPRISE-RISK` Supplier Risk | `AGG-01-PARTY` |
| F09.12 | Supplier Relationship Management | 4 | `AGG-01-PARTY` | `AUTH-PARTY-RELATIONSHIP` Supplier Relationship | `AGG-09-SOURCING` |
| F09.13 | Procurement Analytics | 5 | `AGG-09-SOURCING` | `COM-PROCUREMENT-PACKAGE` Procurement Strategy / Package | `AGG-02-PERFORMANCE` |

### F10 — Demand, Supply Chain & Logistics

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F10.01 | Demand Planning | 4 | `AGG-10-PLANNING` | `PLN-DEMAND-PLAN` Demand / Supply Plan | `AGG-10-ITEM` |
| F10.02 | Sales & Operations Planning | 4 | `AGG-10-PLANNING` | `PLN-DEMAND-PLAN` Demand / Supply Plan | `AGG-10-ITEM` |
| F10.03 | Supply Planning | 3 | `AGG-10-PLANNING` | `PLN-DEMAND-PLAN` Demand / Supply Plan | `AGG-10-ITEM` |
| F10.04 | Inventory Planning | 4 | `AGG-10-INVENTORY-MOVEMENT` | `INV-STOCK-POSITION` Inventory / Stock Control | `AGG-10-PLANNING` |
| F10.05 | Material Requirements | 3 | `AGG-10-PLANNING` | `PLN-DEMAND-PLAN` Demand / Supply Plan | `AGG-10-ITEM` |
| F10.06 | Warehouse Management | 7 | `AGG-10-INVENTORY-STORAGE` | `INV-WAREHOUSE` Warehouse / Storage | `AGG-10-INVENTORY-MOVEMENT` |
| F10.07 | Inventory Control | 4 | `AGG-10-INVENTORY-MOVEMENT` | `INV-STOCK-POSITION` Inventory / Stock Control | `AGG-10-PLANNING` |
| F10.08 | Transport Management | 5 | `AGG-10-LOGISTICS` | `LOG-SHIPMENT` Shipment / Logistics | `AGG-10-INVENTORY-MOVEMENT` |
| F10.09 | Distribution | 4 | `AGG-10-LOGISTICS` | `LOG-SHIPMENT` Shipment / Logistics | `AGG-10-INVENTORY-MOVEMENT` |
| F10.10 | Import / Export | 4 | `AGG-10-LOGISTICS` | `LOG-TRADE-DECLARATION` Trade Declaration | `AGG-21-CONTROL` |
| F10.11 | Reverse Logistics | 6 | `AGG-10-LOGISTICS` | `LOG-SHIPMENT` Shipment / Logistics | `AGG-10-INVENTORY-MOVEMENT` |
| F10.12 | Supply Chain Analytics | 5 | `AGG-02-PERFORMANCE` | `SGP-PERFORMANCE-SNAPSHOT` Supply Chain Performance | `AGG-24-DATA` |
| F10.13 | Supply Chain Risk | 4 | `AGG-21-RISK` | `RISK-ENTERPRISE-RISK` Supply Chain Risk | — |

### F11 — Manufacturing / Production Operations

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F11.01 | Production Planning | 4 | `AGG-11-MFG-DEFINITION` | `MFG-DEFINITION` Manufacturing Definition / Plan | `AGG-10-PLANNING` |
| F11.02 | Production Scheduling | 4 | `AGG-11-MFG-DEFINITION` | `MFG-DEFINITION` Manufacturing Definition / Plan | `AGG-10-PLANNING` |
| F11.03 | Material Staging | 4 | `AGG-10-INVENTORY-MOVEMENT` | `INV-MOVEMENT` Material / Packaging Movement | `AGG-11-PRODUCTION` |
| F11.04 | Production Execution | 4 | `AGG-11-PRODUCTION` | `MFG-PRODUCTION-ORDER` Production Order | `AGG-10-INVENTORY-MOVEMENT` |
| F11.05 | Process Control | 3 | `AGG-11-PRODUCTION` | `MFG-PRODUCTION-ORDER` Production Order | `AGG-10-INVENTORY-MOVEMENT` |
| F11.06 | Work-in-progress | 4 | `AGG-11-PRODUCTION` | `MFG-PRODUCTION-ORDER` Production Order | `AGG-10-INVENTORY-MOVEMENT` |
| F11.07 | Packaging | 5 | `AGG-10-INVENTORY-MOVEMENT` | `INV-MOVEMENT` Material / Packaging Movement | `AGG-11-PRODUCTION` |
| F11.08 | Production Reporting | 6 | `AGG-11-PRODUCTION` | `MFG-PRODUCTION-ORDER` Production Order | `AGG-10-INVENTORY-MOVEMENT` |
| F11.09 | Capacity Management | 4 | `AGG-11-MFG-DEFINITION` | `MFG-DEFINITION` Manufacturing Definition / Plan | `AGG-10-PLANNING` |
| F11.10 | Maintenance Coordination | 3 | `AGG-17-WORK-ORDER` | `OPS-WORK-ORDER` Maintenance Work Order | `AGG-11-PRODUCTION` |
| F11.11 | Lean Operations | 4 | `AGG-26-PROCESS` | `PROC-IMPROVEMENT-OPPORTUNITY` Improvement Opportunity | `AGG-11-PRODUCTION` |

### F12 — Service Delivery & Field Operations

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F12.01 | Service Planning | 4 | `AGG-17-SERVICE` | `OPS-SERVICE-CASE` Service Case / Plan | `AGG-18-WORKFORCE` |
| F12.02 | Service Scheduling | 3 | `AGG-17-SERVICE` | `OPS-SERVICE-CASE` Service Case / Plan | `AGG-18-WORKFORCE` |
| F12.03 | Resource Dispatch | 4 | `AGG-17-SERVICE` | `OPS-SERVICE-APPOINTMENT` Service Appointment | `AGG-18-WORKFORCE` |
| F12.04 | Service Execution | 4 | `AGG-17-WORK-ORDER` | `OPS-WORK-ORDER` Work Order | `AGG-12-FIELD-EXECUTION` |
| F12.05 | Field Service | 5 | `AGG-17-WORK-ORDER` | `OPS-WORK-ORDER` Work Order | `AGG-12-FIELD-EXECUTION` |
| F12.06 | Professional Services | 4 | `AGG-06-PROJECT` | `CBO-PROJECT` Project / Professional Service | `AGG-18-WORKFORCE` |
| F12.07 | Service Acceptance | 4 | `AGG-17-SERVICE` | `OPS-SERVICE-ACCEPTANCE` Service Acceptance | — |
| F12.08 | Service Quality | 3 | `AGG-13-QUALITY` | `QHSE-INSPECTION` Service Quality Evidence | `AGG-17-SERVICE` |
| F12.09 | Service Capacity | 3 | `AGG-17-SERVICE` | `OPS-SERVICE-CASE` Service Case / Plan | `AGG-18-WORKFORCE` |
| F12.10 | Service Performance | 5 | `AGG-02-PERFORMANCE` | `SGP-PERFORMANCE-SNAPSHOT` Service Performance | `AGG-17-SERVICE` |

### F13 — Quality Management

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F13.01 | Quality Strategy | 4 | `AGG-13-QUALITY` | `QHSE-QUALITY-PLAN` Quality Plan | — |
| F13.02 | Quality Planning | 3 | `AGG-13-QUALITY` | `QHSE-QUALITY-PLAN` Quality Plan | — |
| F13.03 | Quality Assurance | 3 | `AGG-13-QUALITY` | `QHSE-ITP` Inspection / Assurance Plan | `AGG-09-SOURCING` |
| F13.04 | Quality Control | 5 | `AGG-13-QUALITY` | `QHSE-INSPECTION` Inspection / Test | — |
| F13.05 | Non-conformance | 5 | `AGG-13-NONCONFORMANCE` | `QHSE-NCR` Nonconformance Report | — |
| F13.06 | Corrective / Preventive Action | 4 | `AGG-13-NONCONFORMANCE` | `QHSE-CAPA-CASE` CAPA Case | — |
| F13.07 | Supplier Quality | 3 | `AGG-13-QUALITY` | `QHSE-ITP` Inspection / Assurance Plan | `AGG-09-SOURCING` |
| F13.08 | Quality Documentation | 4 | `AGG-07-INFORMATION` | `CBO-INFORMATION-CONTAINER` Controlled Quality Information | — |
| F13.09 | Continuous Improvement | 4 | `AGG-26-PROCESS` | `PROC-IMPROVEMENT-OPPORTUNITY` Improvement Opportunity | `AGG-13-NONCONFORMANCE` |
| F13.10 | Quality Analytics | 5 | `AGG-02-PERFORMANCE` | `SGP-PERFORMANCE-SNAPSHOT` Quality Performance | — |

### F14 — Finance, Accounting, Treasury & Tax

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F14.01 | Financial Strategy | 3 | `AGG-19-LEDGER` | `FIN-BUDGET` Budget / Forecast / Capex | `AGG-02-STRATEGY` |
| F14.02 | Budgeting | 5 | `AGG-19-LEDGER` | `FIN-BUDGET` Budget / Forecast / Capex | `AGG-02-STRATEGY` |
| F14.03 | Forecasting | 3 | `AGG-19-LEDGER` | `FIN-BUDGET` Budget / Forecast / Capex | `AGG-02-STRATEGY` |
| F14.04 | General Ledger | 4 | `AGG-19-LEDGER` | `FIN-LEDGER` Ledger / Financial Control | — |
| F14.05 | Accounts Payable | 6 | `AGG-19-AP` | `FIN-SUPPLIER-INVOICE` Payable / Expense | `AGG-18-PAYROLL` |
| F14.06 | Accounts Receivable | 4 | `AGG-19-AR` | `FIN-CUSTOMER-INVOICE` Receivable / Customer Balance | — |
| F14.07 | Credit Management | 4 | `AGG-19-AR` | `FIN-CUSTOMER-INVOICE` Receivable / Customer Balance | — |
| F14.08 | Collections | 5 | `AGG-19-AR` | `FIN-CUSTOMER-INVOICE` Receivable / Customer Balance | — |
| F14.09 | Expense Management | 5 | `AGG-19-AP` | `FIN-SUPPLIER-INVOICE` Payable / Expense | `AGG-18-PAYROLL` |
| F14.10 | Fixed Asset Accounting | 5 | `AGG-19-LEDGER` | `FIN-FIXED-ASSET` Fixed Asset Accounting | `AGG-16-SPATIAL-ASSET` |
| F14.11 | Cost Accounting | 3 | `AGG-19-LEDGER` | `FIN-LEDGER` Ledger / Financial Control | — |
| F14.12 | Financial Close | 4 | `AGG-19-LEDGER` | `FIN-LEDGER` Ledger / Financial Control | — |
| F14.13 | Consolidation | 4 | `AGG-19-LEDGER` | `FIN-LEDGER` Ledger / Financial Control | — |
| F14.14 | Financial Reporting | 5 | `AGG-19-LEDGER` | `FIN-LEDGER` Ledger / Financial Control | — |
| F14.15 | Treasury | 5 | `AGG-19-TREASURY` | `FIN-TREASURY-DEAL` Treasury / Cash | `AGG-19-LEDGER` |
| F14.16 | Payments | 5 | `AGG-19-TREASURY` | `FIN-TREASURY-DEAL` Treasury / Cash | `AGG-19-LEDGER` |
| F14.17 | Foreign Exchange | 4 | `AGG-19-TREASURY` | `FIN-TREASURY-DEAL` Treasury / Cash | `AGG-19-LEDGER` |
| F14.18 | Debt & Financing | 4 | `AGG-19-TREASURY` | `FIN-TREASURY-DEAL` Treasury / Cash | `AGG-19-LEDGER` |
| F14.19 | Tax | 6 | `AGG-19-LEDGER` | `FIN-TAX-RETURN` Tax / Statutory Finance | `AGG-29-REFERENCE-DATA` |
| F14.20 | Financial Controls | 4 | `AGG-19-LEDGER` | `FIN-LEDGER` Ledger / Financial Control | — |
| F14.21 | Profitability Analysis | 3 | `AGG-19-LEDGER` | `FIN-BUDGET` Budget / Forecast / Capex | `AGG-02-STRATEGY` |
| F14.22 | Capital Expenditure | 5 | `AGG-19-LEDGER` | `FIN-BUDGET` Budget / Forecast / Capex | `AGG-02-STRATEGY` |

### F15 — Human Resources / Human Capital

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F15.01 | People Strategy | 4 | `AGG-18-WORKFORCE` | `HCM-WORKFORCE-PLAN` Workforce Plan | `AGG-01-ORG-STRUCTURE` |
| F15.02 | Workforce Planning | 4 | `AGG-18-WORKFORCE` | `HCM-WORKFORCE-PLAN` Workforce Plan | `AGG-01-ORG-STRUCTURE` |
| F15.03 | Organisation Design | 4 | `AGG-18-WORKFORCE` | `HCM-WORKFORCE-PLAN` Workforce Plan | `AGG-01-ORG-STRUCTURE` |
| F15.04 | Job Architecture | 4 | `AGG-18-POSITION` | `HCM-JOB-PROFILE` Job Profile / Position | — |
| F15.05 | Recruitment | 7 | `AGG-18-WORKFORCE` | `HCM-VACANCY` Recruitment / Onboarding | `AGG-01-PARTY` |
| F15.06 | Pre-employment | 4 | `AGG-18-WORKFORCE` | `HCM-VACANCY` Recruitment / Onboarding | `AGG-01-PARTY` |
| F15.07 | Onboarding | 4 | `AGG-18-WORKFORCE` | `HCM-VACANCY` Recruitment / Onboarding | `AGG-01-PARTY` |
| F15.08 | Employee Administration | 4 | `AGG-18-WORKFORCE` | `HCM-WORKER-RELATIONSHIP` Worker Relationship / Case | — |
| F15.09 | Time & Attendance | 5 | `AGG-18-WORKFORCE` | `HCM-TIMESHEET` Time / Attendance / Absence | — |
| F15.10 | Payroll | 6 | `AGG-18-PAYROLL` | `HCM-PAYROLL-RUN` Payroll / Compensation | `AGG-19-LEDGER` |
| F15.11 | Compensation | 4 | `AGG-18-PAYROLL` | `HCM-PAYROLL-RUN` Payroll / Compensation | `AGG-19-LEDGER` |
| F15.12 | Benefits | 3 | `AGG-18-PAYROLL` | `HCM-PAYROLL-RUN` Payroll / Compensation | `AGG-19-LEDGER` |
| F15.13 | Performance Management | 5 | `AGG-18-WORKFORCE` | `HCM-PERFORMANCE-REVIEW` Performance Review | `AGG-02-PERFORMANCE` |
| F15.14 | Learning & Development | 5 | `AGG-18-LEARNING` | `HCM-TRAINING-COURSE` Learning / Competence | — |
| F15.15 | Talent Management | 4 | `AGG-18-TALENT` | `HCM-SUCCESSION-PLAN` Talent / Succession | — |
| F15.16 | Employee Engagement | 3 | `AGG-02-PERFORMANCE` | `SGP-PERFORMANCE-SNAPSHOT` People Performance / Engagement | `AGG-18-WORKFORCE` |
| F15.17 | Employee Relations | 4 | `AGG-18-WORKFORCE` | `HCM-WORKER-RELATIONSHIP` Worker Relationship / Case | — |
| F15.18 | Absence Management | 3 | `AGG-18-WORKFORCE` | `HCM-TIMESHEET` Time / Attendance / Absence | — |
| F15.19 | Offboarding | 5 | `AGG-18-WORKFORCE` | `HCM-WORKER-RELATIONSHIP` Worker Relationship / Case | — |
| F15.20 | HR Analytics | 6 | `AGG-02-PERFORMANCE` | `SGP-PERFORMANCE-SNAPSHOT` People Performance / Engagement | `AGG-18-WORKFORCE` |

### F16 — Information Technology

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F16.01 | IT Strategy | 4 | `AGG-24-TECHNOLOGY` | `IT-TECHNOLOGY-SERVICE` Technology Service / Architecture | `AGG-02-STRATEGY` |
| F16.02 | Enterprise Architecture | 3 | `AGG-24-TECHNOLOGY` | `IT-TECHNOLOGY-SERVICE` Technology Service / Architecture | `AGG-02-STRATEGY` |
| F16.03 | Solution Architecture | 4 | `AGG-24-TECHNOLOGY` | `IT-TECHNOLOGY-SERVICE` Technology Service / Architecture | `AGG-02-STRATEGY` |
| F16.04 | Application Management | 6 | `AGG-24-TECHNOLOGY` | `IT-TECHNOLOGY-RESOURCE` Technology Resource / Service | — |
| F16.05 | Software Development | 6 | `AGG-24-TECHNOLOGY` | `IT-TECHNOLOGY-RESOURCE` Technology Resource / Service | — |
| F16.06 | DevOps | 4 | `AGG-24-TECHNOLOGY` | `IT-TECHNOLOGY-RESOURCE` Technology Resource / Service | — |
| F16.07 | Infrastructure | 4 | `AGG-24-TECHNOLOGY` | `IT-TECHNOLOGY-RESOURCE` Technology Resource / Service | — |
| F16.08 | Cloud Management | 4 | `AGG-24-TECHNOLOGY` | `IT-TECHNOLOGY-RESOURCE` Technology Resource / Service | — |
| F16.09 | Network Management | 4 | `AGG-24-TECHNOLOGY` | `IT-TECHNOLOGY-RESOURCE` Technology Resource / Service | — |
| F16.10 | Endpoint Management | 5 | `AGG-24-TECHNOLOGY` | `IT-TECHNOLOGY-RESOURCE` Technology Resource / Service | — |
| F16.11 | Identity Administration | 5 | `AGG-01-AUTHORITY` | `AUTH-USER-IDENTITY` User Identity / Access | `AGG-24-CYBER` |
| F16.12 | IT Service Desk | 6 | `AGG-24-TECHNOLOGY` | `IT-SERVICE-REQUEST` IT Service Request | — |
| F16.13 | Incident Management | 4 | `AGG-24-TECHNOLOGY` | `IT-INCIDENT` IT Incident | — |
| F16.14 | Problem Management | 3 | `AGG-24-TECHNOLOGY` | `IT-PROBLEM` Problem | — |
| F16.15 | Change Management | 6 | `AGG-24-TECHNOLOGY` | `IT-TECHNOLOGY-CHANGE` Technology Change / Release | — |
| F16.16 | Release Management | 5 | `AGG-24-TECHNOLOGY` | `IT-TECHNOLOGY-CHANGE` Technology Change / Release | — |
| F16.17 | Configuration Management | 3 | `AGG-24-TECHNOLOGY` | `IT-TECHNOLOGY-CHANGE` Technology Change / Release | — |
| F16.18 | IT Asset Management | 6 | `AGG-24-TECHNOLOGY` | `IT-TECHNOLOGY-RESOURCE` Technology Resource / Service | — |
| F16.19 | Availability / Capacity | 3 | `AGG-24-TECHNOLOGY` | `IT-TECHNOLOGY-RESOURCE` Technology Resource / Service | — |
| F16.20 | Disaster Recovery | 5 | `AGG-23-CONTINUITY` | `IT-DISASTER-RECOVERY-PLAN` Disaster Recovery Plan | `AGG-24-TECHNOLOGY` |
| F16.21 | Technology Vendor Management | 5 | `AGG-09-SOURCING` | `CBO-CONTRACT` Technology Supplier / Contract | `AGG-24-TECHNOLOGY` |

### F17 — Data, Analytics & AI

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F17.01 | Data Strategy | 4 | `AGG-24-DATA` | `DATA-DOMAIN` Data Domain / Governance | — |
| F17.02 | Data Governance | 4 | `AGG-24-DATA` | `DATA-DOMAIN` Data Domain / Governance | — |
| F17.03 | Data Architecture | 5 | `AGG-24-DATA` | `DATA-DOMAIN` Data Domain / Governance | — |
| F17.04 | Master Data Management | 6 | `AGG-01-MASTER-STEWARDSHIP` | `MDG-STEWARDSHIP-CASE` Master Data Stewardship | — |
| F17.05 | Reference Data | 4 | `AGG-29-REFERENCE-DATA` | `REF-JURISDICTION` Reference Data | — |
| F17.06 | Data Quality | 5 | `AGG-24-DATA` | `DATA-QUALITY-ISSUE` Data Quality Rule / Issue | — |
| F17.07 | Data Engineering | 5 | `AGG-24-DATA` | `DATA-PRODUCT` Data Product / Dataset | — |
| F17.08 | Data Platform | 3 | `AGG-24-DATA` | `DATA-PRODUCT` Data Product / Dataset | — |
| F17.09 | BI / Reporting | 5 | `AGG-24-DATA` | `ANALYTICS-MODEL` Analytics / Reporting | — |
| F17.10 | Analytics | 4 | `AGG-24-DATA` | `ANALYTICS-MODEL` Analytics / Reporting | — |
| F17.11 | Data Science | 4 | `AGG-24-DATA` | `ANALYTICS-MODEL` Analytics / Reporting | — |
| F17.12 | AI Development | 4 | `AGG-24-AI` | `AI-USE-CASE` AI Use Case / Model | `AGG-21-RISK` |
| F17.13 | AI Governance | 5 | `AGG-24-AI` | `AI-USE-CASE` AI Use Case / Model | `AGG-21-RISK` |
| F17.14 | Model Operations | 5 | `AGG-24-AI` | `AI-USE-CASE` AI Use Case / Model | `AGG-21-RISK` |
| F17.15 | Metadata / Catalogue | 4 | `AGG-24-DATA` | `DATA-PRODUCT` Data Product / Dataset | — |
| F17.16 | Data Access | 5 | `AGG-24-DATA` | `DATA-ACCESS-REQUEST` Data Access Request | `AGG-01-AUTHORITY` |
| F17.17 | Data Lifecycle | 5 | `AGG-24-DATA` | `DATA-PRODUCT` Data Product / Dataset | — |

### F18 — Cybersecurity & Information Security

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F18.01 | Security Strategy | 4 | `AGG-24-CYBER` | `SECURITY-POLICY` Security Policy / Architecture | `AGG-21-CONTROL` |
| F18.02 | Security Policy | 4 | `AGG-24-CYBER` | `SECURITY-POLICY` Security Policy / Architecture | `AGG-21-CONTROL` |
| F18.03 | Security Architecture | 3 | `AGG-24-CYBER` | `SECURITY-POLICY` Security Policy / Architecture | `AGG-21-CONTROL` |
| F18.04 | Identity & Access Security | 4 | `AGG-01-AUTHORITY` | `SEC-ACCESS-GRANT` Access / Security Authority | `AGG-24-CYBER` |
| F18.05 | Vulnerability Management | 5 | `AGG-24-CYBER` | `SEC-VULNERABILITY` Vulnerability / Patch | — |
| F18.06 | Patch Security | 5 | `AGG-24-CYBER` | `SEC-VULNERABILITY` Vulnerability / Patch | — |
| F18.07 | Security Monitoring | 4 | `AGG-24-CYBER` | `SEC-SECURITY-ALERT` Security Monitoring / Test | — |
| F18.08 | Security Incident Response | 6 | `AGG-24-CYBER` | `SEC-CYBER-INCIDENT` Cybersecurity Incident | — |
| F18.09 | Threat Intelligence | 4 | `AGG-24-CYBER` | `SEC-SECURITY-ALERT` Security Monitoring / Test | — |
| F18.10 | Penetration Testing | 5 | `AGG-24-CYBER` | `SEC-SECURITY-ALERT` Security Monitoring / Test | — |
| F18.11 | Application Security | 5 | `AGG-24-CYBER` | `SEC-VULNERABILITY` Vulnerability / Patch | — |
| F18.12 | Third-party Security | 4 | `AGG-21-RISK` | `RISK-ENTERPRISE-RISK` Third-party Security Risk | `AGG-09-SOURCING` |
| F18.13 | Security Awareness | 3 | `AGG-18-LEARNING` | `HCM-TRAINING-COURSE` Security Learning / Awareness | — |
| F18.14 | Cryptography | 4 | `AGG-01-AUTHORITY` | `SEC-ACCESS-GRANT` Access / Security Authority | `AGG-24-CYBER` |
| F18.15 | Security Compliance | 4 | `AGG-24-CYBER` | `SECURITY-POLICY` Security Policy / Architecture | `AGG-21-CONTROL` |

### F19 — Legal & Corporate Secretariat

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F19.01 | Legal Advisory | 3 | `AGG-22-LEGAL` | `LEGAL-MATTER` Legal Matter | — |
| F19.02 | Contract Management | 8 | `AGG-08-CONTRACT` | `CBO-CONTRACT` Contract | `AGG-07-INFORMATION` |
| F19.03 | Contract Repository | 4 | `AGG-08-CONTRACT` | `CBO-CONTRACT` Contract | `AGG-07-INFORMATION` |
| F19.04 | Corporate Legal | 4 | `AGG-22-CORPORATE-SECRETARIAT` | `CORP-OFFICE-APPOINTMENT` Corporate Secretariat / Entity Register | `AGG-22-LEGAL` |
| F19.05 | Company Secretariat | 4 | `AGG-22-CORPORATE-SECRETARIAT` | `CORP-OFFICE-APPOINTMENT` Corporate Secretariat / Entity Register | `AGG-22-LEGAL` |
| F19.06 | Intellectual Property | 4 | `AGG-22-LEGAL` | `LEGAL-IP-ASSET` Intellectual Property Asset | — |
| F19.07 | Litigation | 5 | `AGG-22-LEGAL` | `LEGAL-PROCEEDING` Legal Proceeding / Dispute | — |
| F19.08 | Regulatory Legal | 3 | `AGG-22-LEGAL` | `LEGAL-MATTER` Legal Matter | — |
| F19.09 | Employment Legal | 4 | `AGG-22-LEGAL` | `LEGAL-MATTER` Legal Matter | — |
| F19.10 | Legal Spend | 4 | `AGG-22-LEGAL` | `LEGAL-MATTER` Legal Matter | — |
| F19.11 | Legal Hold / EDiscovery | 5 | `AGG-28-RETENTION` | `EVID-LEGAL-HOLD-LINK` Legal Hold / eDiscovery | `AGG-22-LEGAL` |
| F19.12 | Legal Obligations | 3 | `AGG-22-LEGAL` | `LEGAL-OBLIGATION` Legal Obligation | — |

### F20 — Risk, Compliance, Internal Control & Audit

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F20.01 | Risk Framework | 4 | `AGG-21-RISK` | `RISK-ENTERPRISE-RISK` Enterprise Risk / Assessment | — |
| F20.02 | Risk Identification | 3 | `AGG-21-RISK` | `RISK-ENTERPRISE-RISK` Enterprise Risk / Assessment | — |
| F20.03 | Risk Assessment | 4 | `AGG-21-RISK` | `RISK-ENTERPRISE-RISK` Enterprise Risk / Assessment | — |
| F20.04 | Risk Treatment | 5 | `AGG-21-RISK` | `RISK-ENTERPRISE-RISK` Enterprise Risk / Assessment | — |
| F20.05 | Risk Monitoring | 4 | `AGG-21-RISK` | `RISK-ENTERPRISE-RISK` Enterprise Risk / Assessment | — |
| F20.06 | Regulatory Compliance | 4 | `AGG-21-CONTROL` | `COMP-REQUIREMENT` Compliance Requirement / Assessment | — |
| F20.07 | Compliance Monitoring | 4 | `AGG-21-CONTROL` | `COMP-REQUIREMENT` Compliance Requirement / Assessment | — |
| F20.08 | Control Management | 4 | `AGG-21-CONTROL` | `CTRL-INTERNAL-CONTROL` Internal Control / Test | — |
| F20.09 | Control Testing | 4 | `AGG-21-CONTROL` | `CTRL-INTERNAL-CONTROL` Internal Control / Test | — |
| F20.10 | Internal Audit Planning | 3 | `AGG-21-AUDIT` | `AUDIT-ENGAGEMENT` Audit / Assurance | — |
| F20.11 | Audit Execution | 5 | `AGG-21-AUDIT` | `AUDIT-ENGAGEMENT` Audit / Assurance | — |
| F20.12 | Audit Reporting | 4 | `AGG-21-AUDIT` | `AUDIT-ENGAGEMENT` Audit / Assurance | — |
| F20.13 | Issue / Remediation | 5 | `AGG-21-AUDIT` | `AUDIT-FINDING` Finding / Remediation | — |
| F20.14 | Fraud Risk | 3 | `AGG-21-RISK` | `RISK-ENTERPRISE-RISK` Enterprise Risk / Assessment | — |
| F20.15 | Ethics & Conduct | 4 | `AGG-21-CONTROL` | `COMP-REQUIREMENT` Compliance Requirement / Assessment | — |
| F20.16 | Assurance Coordination | 3 | `AGG-21-AUDIT` | `AUDIT-ENGAGEMENT` Audit / Assurance | — |

### F21 — Privacy & Information Governance

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F21.01 | Privacy Governance | 3 | `AGG-22-PRIVACY` | `PRIV-FRAMEWORK` Privacy Framework / Policy | — |
| F21.02 | Processing Inventory | 5 | `AGG-22-PRIVACY` | `PRIV-PROCESSING-ACTIVITY` Processing Activity / DPIA | — |
| F21.03 | Privacy Impact Assessment | 4 | `AGG-22-PRIVACY` | `PRIV-PROCESSING-ACTIVITY` Processing Activity / DPIA | — |
| F21.04 | Consent / Preferences | 3 | `AGG-22-PRIVACY` | `PRIV-CONSENT-EVIDENCE` Consent / Preference Evidence | — |
| F21.05 | Data Subject Rights | 5 | `AGG-22-PRIVACY` | `PRIV-DATA-SUBJECT-REQUEST` Data Subject Request | — |
| F21.06 | Privacy Incidents | 4 | `AGG-22-PRIVACY` | `PRIV-INCIDENT` Privacy Incident | — |
| F21.07 | International Transfers | 3 | `AGG-22-PRIVACY` | `PRIV-PROCESSING-ACTIVITY` Processing Activity / DPIA | — |
| F21.08 | Retention | 3 | `AGG-28-RETENTION` | `EVID-RETENTION-DISPOSITION` Retention / Disposition | `AGG-22-PRIVACY` |
| F21.09 | Privacy Assurance | 3 | `AGG-21-AUDIT` | `AUDIT-ENGAGEMENT` Privacy Assurance Review | `AGG-22-PRIVACY` |

### F22 — Property, Facilities & Physical Assets

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F22.01 | Asset Strategy | 3 | `AGG-16-ASSET-INVESTMENT` | `OPS-ASSET-INVESTMENT-PLAN` Asset Investment Plan | `AGG-19-LEDGER` |
| F22.02 | Capital Planning | 3 | `AGG-16-ASSET-INVESTMENT` | `OPS-ASSET-INVESTMENT-PLAN` Asset Investment Plan | `AGG-19-LEDGER` |
| F22.03 | Asset Acquisition | 5 | `AGG-16-SPATIAL-ASSET` | `CBO-ASSET` Asset / Property Acquisition | `AGG-06-PROJECT`, `AGG-19-LEDGER` |
| F22.04 | Property Acquisition | 4 | `AGG-16-SPATIAL-ASSET` | `CBO-ASSET` Asset / Property Acquisition | `AGG-06-PROJECT`, `AGG-19-LEDGER` |
| F22.05 | Construction / Project Delivery | 6 | `AGG-16-SPATIAL-ASSET` | `CBO-ASSET` Asset / Property Acquisition | `AGG-06-PROJECT`, `AGG-19-LEDGER` |
| F22.06 | Asset Register | 5 | `AGG-16-SPATIAL-ASSET` | `CBO-ASSET` Asset | — |
| F22.07 | Preventive Maintenance | 4 | `AGG-17-WORK-ORDER` | `OPS-WORK-ORDER` Maintenance Work Order | `AGG-17-MAINTENANCE` |
| F22.08 | Reactive Maintenance | 5 | `AGG-17-WORK-ORDER` | `OPS-WORK-ORDER` Maintenance Work Order | `AGG-17-MAINTENANCE` |
| F22.09 | Reliability | 3 | `AGG-17-RELIABILITY` | `REL-RELIABILITY-STRATEGY` Reliability Strategy | — |
| F22.10 | Facilities Operations | 5 | `AGG-17-SERVICE` | `OPS-SERVICE-CASE` Facilities Service Case | `AGG-17-WORKPLACE` |
| F22.11 | Space Management | 3 | `AGG-17-WORKPLACE` | `OPS-WORKPLACE-RESERVATION` Space / Workplace Use | `AGG-16-SPATIAL-ASSET` |
| F22.12 | Lease Management | 4 | `AGG-19-LEASE-ACCOUNTING` | `FIN-LEASE-ACCOUNTING-RECORD` Lease / Lease Accounting | `AGG-08-CONTRACT` |
| F22.13 | Utilities Management | 3 | `AGG-17-SERVICE` | `OPS-UTILITY-ACCOUNT` Utility Account / Consumption | `AGG-20-CARBON` |
| F22.14 | Asset Disposal | 4 | `AGG-16-SPATIAL-ASSET` | `CBO-ASSET` Asset Disposal | `AGG-28-RETENTION` |

### F23 — Health, Safety, Environment & Sustainability

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F23.01 | H&S Management | 4 | `AGG-13-INCIDENT` | `QHSE-INCIDENT` H&S / Incident / Permit | `AGG-21-RISK`, `AGG-13-QUALITY` |
| F23.02 | Hazard Identification | 3 | `AGG-13-INCIDENT` | `QHSE-INCIDENT` H&S / Incident / Permit | `AGG-21-RISK`, `AGG-13-QUALITY` |
| F23.03 | Workplace Inspections | 4 | `AGG-13-INCIDENT` | `QHSE-INCIDENT` H&S / Incident / Permit | `AGG-21-RISK`, `AGG-13-QUALITY` |
| F23.04 | Incident Management | 4 | `AGG-13-INCIDENT` | `QHSE-INCIDENT` H&S / Incident / Permit | `AGG-21-RISK`, `AGG-13-QUALITY` |
| F23.05 | Occupational Health | 3 | `AGG-13-INCIDENT` | `QHSE-INCIDENT` H&S / Incident / Permit | `AGG-21-RISK`, `AGG-13-QUALITY` |
| F23.06 | Permit-to-work | 5 | `AGG-13-INCIDENT` | `QHSE-INCIDENT` H&S / Incident / Permit | `AGG-21-RISK`, `AGG-13-QUALITY` |
| F23.07 | Environmental Management | 3 | `AGG-21-CONTROL` | `QHSE-COMPLIANCE-REQUIREMENT` Environmental Compliance | `AGG-20-CARBON` |
| F23.08 | Waste Management | 6 | `AGG-20-RESOURCE-OUTCOME` | `QHSE-WASTE-CONSIGNMENT` Waste / Resource Evidence | — |
| F23.09 | Carbon Management | 4 | `AGG-20-CARBON` | `SUS-CARBON-ASSESSMENT` Carbon / Sustainability Performance | `AGG-02-PERFORMANCE` |
| F23.10 | Energy Management | 4 | `AGG-20-CARBON` | `SUS-CARBON-ASSESSMENT` Carbon / Sustainability Performance | `AGG-02-PERFORMANCE` |
| F23.11 | Sustainability Strategy | 3 | `AGG-20-CARBON` | `SUS-CARBON-ASSESSMENT` Carbon / Sustainability Performance | `AGG-02-PERFORMANCE` |
| F23.12 | ESG Reporting | 5 | `AGG-20-CARBON` | `SUS-CARBON-ASSESSMENT` Carbon / Sustainability Performance | `AGG-02-PERFORMANCE` |
| F23.13 | Sustainable Supply Chain | 3 | `AGG-20-RESOURCE-OUTCOME` | `SUS-RESPONSIBLE-PROCUREMENT` Responsible Procurement | `AGG-09-SOURCING` |
| F23.14 | Environmental Compliance | 4 | `AGG-21-CONTROL` | `QHSE-COMPLIANCE-REQUIREMENT` Environmental Compliance | `AGG-20-CARBON` |

### F24 — Business Continuity, Crisis & Physical Security

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F24.01 | Business Continuity Governance | 4 | `AGG-23-CONTINUITY` | `BCM-CONTINUITY-PLAN` Continuity / Recovery | `AGG-24-TECHNOLOGY` |
| F24.02 | Business Impact Analysis | 4 | `AGG-23-CONTINUITY` | `BCM-CONTINUITY-PLAN` Continuity / Recovery | `AGG-24-TECHNOLOGY` |
| F24.03 | Continuity Planning | 3 | `AGG-23-CONTINUITY` | `BCM-CONTINUITY-PLAN` Continuity / Recovery | `AGG-24-TECHNOLOGY` |
| F24.04 | Continuity Testing | 4 | `AGG-23-CONTINUITY` | `BCM-CONTINUITY-PLAN` Continuity / Recovery | `AGG-24-TECHNOLOGY` |
| F24.05 | Crisis Management | 4 | `AGG-23-CRISIS` | `BCM-CRISIS` Crisis / Emergency Response | `AGG-25-COMMUNICATIONS` |
| F24.06 | Emergency Response | 4 | `AGG-23-CRISIS` | `BCM-CRISIS` Crisis / Emergency Response | `AGG-25-COMMUNICATIONS` |
| F24.07 | Crisis Communications | 3 | `AGG-23-CRISIS` | `BCM-CRISIS` Crisis / Emergency Response | `AGG-25-COMMUNICATIONS` |
| F24.08 | Disaster Recovery Coordination | 3 | `AGG-23-CONTINUITY` | `BCM-CONTINUITY-PLAN` Continuity / Recovery | `AGG-24-TECHNOLOGY` |
| F24.09 | Physical Security | 4 | `AGG-23-CRISIS` | `SEC-PHYSICAL-SECURITY-INCIDENT` Physical / Travel Security | `AGG-01-AUTHORITY`, `AGG-18-TRAVEL` |
| F24.10 | Visitor Management | 4 | `AGG-23-CRISIS` | `SEC-PHYSICAL-SECURITY-INCIDENT` Physical / Travel Security | `AGG-01-AUTHORITY`, `AGG-18-TRAVEL` |
| F24.11 | Security Investigations | 4 | `AGG-23-CRISIS` | `SEC-PHYSICAL-SECURITY-INCIDENT` Physical / Travel Security | `AGG-01-AUTHORITY`, `AGG-18-TRAVEL` |
| F24.12 | Travel Security | 4 | `AGG-23-CRISIS` | `SEC-PHYSICAL-SECURITY-INCIDENT` Physical / Travel Security | `AGG-01-AUTHORITY`, `AGG-18-TRAVEL` |

### F25 — Communications, Public Affairs & Investor Relations

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F25.01 | Corporate Communications | 3 | `AGG-25-COMMUNICATIONS` | `KRC-COMMS-PLAN` Communications Plan / Item | `AGG-07-INFORMATION` |
| F25.02 | Internal Communications | 4 | `AGG-25-COMMUNICATIONS` | `KRC-COMMS-PLAN` Communications Plan / Item | `AGG-07-INFORMATION` |
| F25.03 | Media Relations | 4 | `AGG-25-COMMUNICATIONS` | `KRC-EXTERNAL-AFFAIRS-ISSUE` External Affairs / Media | `AGG-03-CUSTOMER-CASE` |
| F25.04 | Public Relations | 3 | `AGG-25-COMMUNICATIONS` | `KRC-COMMS-PLAN` Communications Plan / Item | `AGG-07-INFORMATION` |
| F25.05 | Reputation Management | 4 | `AGG-25-COMMUNICATIONS` | `KRC-EXTERNAL-AFFAIRS-ISSUE` External Affairs / Media | `AGG-03-CUSTOMER-CASE` |
| F25.06 | Public Affairs | 3 | `AGG-25-COMMUNICATIONS` | `KRC-EXTERNAL-AFFAIRS-ISSUE` External Affairs / Media | `AGG-03-CUSTOMER-CASE` |
| F25.07 | Government Relations | 4 | `AGG-25-COMMUNICATIONS` | `KRC-EXTERNAL-AFFAIRS-ISSUE` External Affairs / Media | `AGG-03-CUSTOMER-CASE` |
| F25.08 | Investor Relations | 3 | `AGG-25-COMMUNICATIONS` | `KRC-STAKEHOLDER-PLAN` Investor / Stakeholder Engagement | `AGG-19-LEDGER` |
| F25.09 | Annual Reporting | 5 | `AGG-25-COMMUNICATIONS` | `KRC-COMMS-PLAN` Communications Plan / Item | `AGG-07-INFORMATION` |
| F25.10 | Stakeholder Engagement | 4 | `AGG-25-COMMUNICATIONS` | `KRC-STAKEHOLDER-ENGAGEMENT` Stakeholder Engagement | — |
| F25.11 | Community Relations | 3 | `AGG-25-COMMUNICATIONS` | `KRC-STAKEHOLDER-ENGAGEMENT` Stakeholder Engagement | — |
| F25.12 | Crisis Communications | 4 | `AGG-25-COMMUNICATIONS` | `KRC-COMMS-PLAN` Communications Plan / Item | `AGG-07-INFORMATION` |

### F26 — Knowledge, Document & Records Management

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F26.01 | Knowledge Strategy | 3 | `AGG-25-KNOWLEDGE` | `KRC-KNOWLEDGE-ARTICLE` Knowledge Article / Collection | `AGG-24-DATA` |
| F26.02 | Knowledge Capture | 4 | `AGG-25-KNOWLEDGE` | `KRC-KNOWLEDGE-ARTICLE` Knowledge Article / Collection | `AGG-24-DATA` |
| F26.03 | Knowledge Sharing | 4 | `AGG-25-KNOWLEDGE` | `KRC-KNOWLEDGE-ARTICLE` Knowledge Article / Collection | `AGG-24-DATA` |
| F26.04 | Knowledge Maintenance | 4 | `AGG-25-KNOWLEDGE` | `KRC-KNOWLEDGE-ARTICLE` Knowledge Article / Collection | `AGG-24-DATA` |
| F26.05 | Document Management | 6 | `AGG-07-INFORMATION` | `CBO-INFORMATION-CONTAINER` Information Container | — |
| F26.06 | Records Management | 5 | `AGG-25-RECORDS` | `KRC-RECORD-SERIES` Record Series / File | `AGG-28-RETENTION` |
| F26.07 | Controlled Documents | 4 | `AGG-07-INFORMATION` | `CBO-INFORMATION-CONTAINER` Information Container | — |
| F26.08 | Records Retention | 4 | `AGG-25-RECORDS` | `KRC-RECORD-SERIES` Record Series / File | `AGG-28-RETENTION` |
| F26.09 | Enterprise Search | 4 | `AGG-25-KNOWLEDGE` | `KRC-KNOWLEDGE-ARTICLE` Knowledge Article / Collection | `AGG-24-DATA` |
| F26.10 | Lessons Learned | 5 | `AGG-25-KNOWLEDGE` | `KRC-KNOWLEDGE-ARTICLE` Knowledge Article / Collection | `AGG-24-DATA` |

### F27 — Portfolio, Programme & Project Management

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F27.01 | Portfolio Management | 5 | `AGG-06-PROJECT` | `DEL-PORTFOLIO` Portfolio / Programme | `AGG-27-DECISION` |
| F27.02 | Investment Governance | 4 | `AGG-06-PROJECT` | `DEL-PORTFOLIO` Portfolio / Programme | `AGG-27-DECISION` |
| F27.03 | Programme Management | 4 | `AGG-06-PROJECT` | `DEL-PORTFOLIO` Portfolio / Programme | `AGG-27-DECISION` |
| F27.04 | Project Initiation | 5 | `AGG-06-PROJECT` | `CBO-PROJECT` Project | — |
| F27.05 | Project Planning | 4 | `AGG-06-SCHEDULE` | `DEL-SCHEDULE` Project Schedule / Plan | `AGG-06-WBS` |
| F27.06 | Project Execution | 4 | `AGG-06-PROJECT` | `CBO-PROJECT` Project Execution / Close | `AGG-15-HANDOVER` |
| F27.07 | Project Control | 5 | `AGG-06-PROJECT-CONTROLS` | `DEL-PERFORMANCE-CALCULATION-RUN` Project Controls | `AGG-06-SCHEDULE`, `AGG-19-LEDGER` |
| F27.08 | Project Closure | 4 | `AGG-06-PROJECT` | `CBO-PROJECT` Project Execution / Close | `AGG-15-HANDOVER` |
| F27.09 | PMO | 5 | `AGG-06-PROJECT` | `DEL-PORTFOLIO` PMO / Portfolio Governance | `AGG-02-PERFORMANCE` |
| F27.10 | Resource Management | 3 | `AGG-18-WORKFORCE` | `HCM-WORKFORCE-ALLOCATION` Workforce Allocation | `AGG-06-PROJECT` |

### F28 — Change & Transformation Management

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F28.01 | Transformation Strategy | 3 | `AGG-26-TRANSFORMATION` | `TRANS-INITIATIVE` Transformation Initiative | `AGG-02-STRATEGY` |
| F28.02 | Change Impact Assessment | 4 | `AGG-26-TRANSFORMATION` | `TRANS-CHANGE-IMPACT-ASSESSMENT` Change Impact Assessment | — |
| F28.03 | Stakeholder Management | 3 | `AGG-26-TRANSFORMATION` | `TRANS-STAKEHOLDER-COHORT` Change Stakeholder / Communication | `AGG-25-COMMUNICATIONS` |
| F28.04 | Change Communications | 3 | `AGG-26-TRANSFORMATION` | `TRANS-STAKEHOLDER-COHORT` Change Stakeholder / Communication | `AGG-25-COMMUNICATIONS` |
| F28.05 | Training / Readiness | 4 | `AGG-26-TRANSFORMATION` | `TRANS-READINESS-PLAN` Readiness / Adoption | `AGG-18-LEARNING` |
| F28.06 | Adoption Management | 4 | `AGG-26-TRANSFORMATION` | `TRANS-READINESS-PLAN` Readiness / Adoption | `AGG-18-LEARNING` |
| F28.07 | Organisational Transition | 4 | `AGG-26-TRANSFORMATION` | `TRANS-ORGANISATION-TRANSITION` Organisation Transition | `AGG-01-ORG-STRUCTURE` |
| F28.08 | Benefits Tracking | 4 | `AGG-02-PERFORMANCE` | `SGP-PERFORMANCE-TARGET` Benefits Performance | `AGG-26-TRANSFORMATION` |

### F29 — Business Process & Continuous Improvement

| L2 | Work area | Activities | Primary aggregate | Canonical object focus | Cross-aggregate handoffs |
| --- | --- | ---: | --- | --- | --- |
| F29.01 | Process Architecture | 3 | `AGG-26-PROCESS` | `PROC-ENTERPRISE-PROCESS` Enterprise Process | — |
| F29.02 | Process Ownership | 3 | `AGG-26-PROCESS` | `PROC-ENTERPRISE-PROCESS` Enterprise Process | — |
| F29.03 | Process Modelling | 3 | `AGG-26-PROCESS` | `PROC-MODEL` Process Model / Redesign | — |
| F29.04 | Process Analysis | 5 | `AGG-26-PROCESS` | `PROC-ANALYSIS` Process Analysis / Measure | `AGG-02-PERFORMANCE` |
| F29.05 | Process Redesign | 4 | `AGG-26-PROCESS` | `PROC-MODEL` Process Model / Redesign | — |
| F29.06 | SOP Management | 5 | `AGG-07-INFORMATION` | `CBO-INFORMATION-CONTAINER` Controlled SOP | `AGG-26-PROCESS` |
| F29.07 | Workflow Automation | 4 | `AGG-27-WORKFLOW` | `WORK-WORKFLOW-INSTANCE` Workflow / Automation | `AGG-26-PROCESS` |
| F29.08 | Continuous Improvement | 4 | `AGG-26-PROCESS` | `PROC-IMPROVEMENT-OPPORTUNITY` Improvement Opportunity | — |
| F29.09 | Process Compliance | 4 | `AGG-21-CONTROL` | `COMP-ASSESSMENT` Compliance Assessment | `AGG-26-PROCESS` |
| F29.10 | Process Performance | 4 | `AGG-26-PROCESS` | `PROC-ANALYSIS` Process Analysis / Measure | `AGG-02-PERFORMANCE` |

## Detailed activity audit

The complete 1,510-row activity map is stored in:

`docs/data-model/activity-object-action-map.csv`

Each row records the activity ID/name, primary aggregate, canonical object focus, command/query action, approval/decision/evidence flags and secondary aggregate handoffs.

## Architecture consequence

With this mapping complete, the discovery/convergence architecture gates are closed:

1. candidate/family convergence;
2. duplicate/alias convergence;
3. external benchmark and standards challenge;
4. aggregate-boundary freeze;
5. L2/L3 activity → canonical object/action mapping.

Physical schema/API implementation may now proceed **in controlled aggregate-aligned waves**, provided implementation does not redefine these semantics. Any change to workspace home, aggregate ownership, object focus or action authority is an architecture change and must update the machine register and tests first.
