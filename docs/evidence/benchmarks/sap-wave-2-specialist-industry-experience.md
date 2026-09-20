# SAP Wave 2 — Specialist, Industry and Experience Challenge

**Status:** challenge complete  
**Date:** 18 September 2026  
**Rows challenged in this wave:** 25/64  
**Cumulative SAP challenge:** 64/64

This wave closes the remaining SAP capability-analysis queue. It distinguishes core canonical semantics from contextual sector extensions and platform/experience requirements.

## SAP-W2-01 — Usage/subscription billing

**SAP rows:** 5  
**Official source:** https://help.sap.com/docs/subscription-billing/feature-overview/usage-data  
**NuBlox state:** `contextual-gap`

**Finding.** SAP Subscription Billing explicitly treats measured/forecast usage records and rating as billing inputs. NuBlox has Service Contract/Entitlement, Utility Consumption and invoices but no explicit subscription/usage-rating layer.

**Gate 3 decision.** Record a contextual service/utility billing extension for subscription agreement, usage record and rated charge. Do not force recurring/usage billing into every NuBlox business model.

## SAP-W2-02 — CRM and customer service

**SAP rows:** 7, 8  
**Official source:** https://www.sap.com/uk/products/crm/service-cloud/features.html  
**NuBlox state:** `baseline-strong`

**Finding.** Party Relationship, Lead, Opportunity, CRM Activity, Customer Case, Service Request/Case, entitlement, SLA, appointment/dispatch and field work already provide the durable semantics behind SAP Sales/Service Cloud outcomes.

**Gate 3 decision.** No new canonical identity. Runtime omnichannel/AI guidance remains a later experience/integration concern.

## SAP-W2-03 — Environment, health and safety

**SAP rows:** 10  
**Official source:** https://www.sap.com/products/scm/environmental-management-software/features.html  
**NuBlox state:** `baseline-strong`

**Finding.** NuBlox already governs hazards, risk assessments, method statements/RAMS, permits, isolation, observations, incidents/investigations, environmental aspects/impacts, waste and shared compliance obligations/evidence.

**Gate 3 decision.** No new generic EHS master. Preserve shared compliance/risk/evidence architecture.

## SAP-W2-04 — Real estate, occupancy and lease accounting

**SAP rows:** 15, 41  
**Official source:** https://www.sap.com/uk/products/financial-management/real-estate-facilities-management.html  
**NuBlox state:** `canonical-refinement-required`

**Finding.** Property/Estate/Site/Facility/Building/Space, Occupancy, Lease/Licence and service/facilities semantics are governed. SAP's current real-estate proposition also explicitly joins lease contracts to IFRS 16/ASC 842 valuation and financial postings.

**Gate 3 decision.** Add a finance-side Lease Accounting Record/valuation schedule relationship to canonical Lease/Contract truth. Do not turn accounting right-of-use/liability records into physical Property/Asset identity.

## SAP-W2-05 — Public-sector funds management

**SAP rows:** 17  
**Official source:** https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/d56edf94353d4beeabb7f9b90adf081a/62e8cc53a8b77214e10000000a174cb4-576.html  
**NuBlox state:** `contextual-gap`

**Finding.** Budget, commitment and actual semantics exist, but SAP Funds Management adds Fund/Funded Program dimensions and active budget availability control for public-sector/funded organisations.

**Gate 3 decision.** Keep this a contextual public-sector extension with Fund/Funded Program and Budget Availability Control semantics when required.

## SAP-W2-06 — Global trade compliance

**SAP rows:** 18  
**Official source:** https://www.sap.com/uk/products/financial-management/global-trade-management.html  
**NuBlox state:** `contextual-gap`

**Finding.** Trade Declaration, classification, jurisdiction, shipment and compliance requirements exist. SAP GTS adds sanctioned-party screening, embargo/license checks, customs procedures and free-trade preference management.

**Gate 3 decision.** Define a contextual trade-compliance extension for screening decisions, trade authorisations/licenses and customs procedure/preference evidence; reuse Party, Item, Shipment and compliance identities.

## SAP-W2-07 — Incentive and commission management

**SAP rows:** 21  
**Official source:** https://www.sap.com/uk/products/crm/incentive-compensation-management.html  
**NuBlox state:** `contextual-gap`

**Finding.** Compensation/Pay Element, performance and sales outcomes exist, but there is no explicit sales incentive plan, credited earning/commission calculation or compensation dispute semantics.

**Gate 3 decision.** Keep incentive compensation as a contextual sales/HCM extension with governed plan, earning/calculation and dispute evidence.

## SAP-W2-08 — Product requirements, systems engineering and PLM

**SAP rows:** 23, 37  
**Official source:** https://www.sap.com/products/scm/integrated-product-development/features.html  
**NuBlox state:** `canonical-refinement-required`

**Finding.** Item/Specification/BOM, manufacturing definition, controlled information and Design Change are strong. SAP Integrated Product Development exposes a distinct durable requirements/traceability and systems-model layer that the current 750 baseline does not explicitly represent.

**Gate 3 decision.** Add Product Requirement/Requirement Set, traceability relationships and governed System Model/Model Element semantics without confusing them with Information Requirement or physical System/Asset identity.

## SAP-W2-09 — Library and controlled documentation

**SAP rows:** 24  
**Official source:** https://www.sap.com/uk/products/scm/plm-r-d-engineering.html  
**NuBlox state:** `baseline-strong`

**Finding.** Information Container, revision, representation, issue/transmittal, controlled document, declared record, retention and knowledge semantics already provide the governed library/document foundation.

**Gate 3 decision.** No separate library master or vendor-style document silo.

## SAP-W2-10 — Oil and gas industry depth

**SAP rows:** 31  
**Official source:** https://www.sap.com/industries/oil-gas-energy.html  
**NuBlox state:** `contextual-extension`

**Finding.** SAP's industry proposition emphasises asset strategy, risk-based criticality, predictive maintenance and remote field work. The newly added reliability/criticality refinements plus Site/Network/Asset/Work Order/Permit/Isolation semantics cover the reusable core.

**Gate 3 decision.** Keep oil-and-gas-specific production/accounting/regulatory patterns as a sector extension over shared asset, field, HSE and finance truth.

## SAP-W2-11 — Retail, POS and trade promotions

**SAP rows:** 33, 43, 56  
**Official source:** https://www.sap.com/uk/products/crm/pos-customer-checkout.html  
**NuBlox state:** `contextual-gap`

**Finding.** NuBlox has Item, Price List/Rate, Sales Order, inventory movement, payment/receipt and customer identities. SAP POS/promotion products add till/session/cashier sale-return-payment flows, gift/loyalty/coupon and omnichannel promotion rule semantics.

**Gate 3 decision.** Define a contextual merchant/retail extension rather than polluting core construction sales semantics.

## SAP-W2-12 — Quality management

**SAP rows:** 40  
**Official source:** https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/9905622a5c1f49ba84e9076fc83a9c2c/e2f8f94be737403696eeea0e2be80d87.html  
**NuBlox state:** `baseline-strong`

**Finding.** Quality Plan, ITP, Inspection, Test, hold/witness points, NCR, Defect, CAPA, Calibration, certificates and audit/assurance are governed. The benchmark-driven Failure Mode definition also supports quality FMEA-style analysis without copying SAP inspection-lot architecture.

**Gate 3 decision.** No new generic quality master is required.

## SAP-W2-13 — Sales, guided offers and order-to-cash

**SAP rows:** 42, 46  
**Official source:** https://help.sap.com/docs/PRODUCT_ID/7b24a64d9d0941bda1afa753263d9e39/7b3838f51e604520b34d6f6c9c96af9f.html  
**NuBlox state:** `baseline-strong`

**Finding.** Opportunity, Estimate, Proposal, Quotation, Acceptance, Sales Order, Delivery, Customer Invoice and Receipt already preserve quote-to-order-to-delivery-to-cash truth. Product configuration refinement will strengthen configurable offers.

**Gate 3 decision.** No universal mutable sales document. Keep each legal/commercial/fulfilment/financial stage explicit.

## SAP-W2-14 — Service parts planning

**SAP rows:** 47  
**Official source:** https://www.sap.com/uk/products/scm/extended-service-parts-planning.html  
**NuBlox state:** `baseline-strengthened`

**Finding.** The newly governed Demand Plan/Supply Plan plus Item, inventory position, reservation, warehouse/logistics, Asset, Maintenance Plan and Work Order provide the core semantics for service-parts planning.

**Gate 3 decision.** Multi-echelon optimisation is a planning method/projection, not a new master identity.

## SAP-W2-15 — Test data and data migration

**SAP rows:** 54  
**Official source:** https://help.sap.com/docs/SAP_S4HANA_CLOUD/d5699934e7004d048c4801b552f3b013/474c2b423bb8413091fd4de76cb9eec9.html  
**NuBlox state:** `canonical-refinement-required`

**Finding.** Dataset, Data Pipeline, data quality, privacy and audit semantics exist, but no explicit governed Migration Project/Run/Mapping or non-production test-data provisioning/masking semantics exist.

**Gate 3 decision.** Add migration and test-data governance records, including source/target scope, mappings, simulation/validation evidence, masking policy and provenance.

## SAP-W2-16 — Business travel and expense

**SAP rows:** 59  
**Official source:** https://www.sap.com/uk/products/financial-management/travel-and-expense-management.html  
**NuBlox state:** `canonical-refinement-required`

**Finding.** Expense Claim and Travel Risk Assessment exist, but there is no durable Travel Request/Business Trip identity linking approval, itinerary/booking context, duty-of-care risk, expense and reimbursement.

**Gate 3 decision.** Add Travel Request and Business Trip semantics; booking supplier records may remain integration references while NuBlox retains governance/risk/expense continuity.

## SAP-W2-17 — Enterprise UX

**SAP rows:** 60  
**Official source:** https://www.sap.com/uk/products/technology-platform/fiori.html  
**NuBlox state:** `experience-requirement`

**Finding.** SAP Fiori's role-based, adaptive, coherent and accessible design system is an experience benchmark rather than a business-object benchmark.

**Gate 3 decision.** Record UX consistency/accessibility/task-context requirements in the design system; do not create canonical domain objects for UI patterns.

## SAP-W2-18 — Variant and configurable-product management

**SAP rows:** 61  
**Official source:** https://www.sap.com/products/scm/s4hana-cloud-for-advanced-variant-configuration.html  
**NuBlox state:** `canonical-refinement-required`

**Finding.** NuBlox has Item Variant, Specification, BOM, Rate/Price and manufacturing definitions, but not an explicit versioned configuration model/profile, characteristic/value model or constraint/rule set driving valid configurations across quote, planning and production.

**Gate 3 decision.** Add configurable-product semantics while preserving Item, Item Variant, BOM and actual configured execution/asset identities.

## SAP-W2-19 — Vehicle Management System

**SAP rows:** 62  
**Official source:** https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/f340785101c548c9beeda9284efd18a0/60dcc353b677b44ce10000000a174cb4.html  
**NuBlox state:** `contextual-correction`

**Finding.** Current SAP documentation identifies VMS as an automotive importer/OEM/dealer process spanning procurement, sales, rework, returns and vehicle tracking, not generic enterprise fleet maintenance.

**Gate 3 decision.** Correct the legacy interpretation: keep automotive importer/dealer VMS as a contextual sector extension over Vehicle, Item/configuration, purchase/sales orders, logistics, invoice and service identities.


## Wave 2 architecture consequence

The SAP benchmark is now **64/64 challenged**. The challenge does not mean SAP functionality has been copied or that runtime implementation exists.

New durable core refinements identified by this wave are:

1. lease-accounting consequence semantics linked to canonical Lease/Contract truth;
2. product requirements, systems-model and traceability semantics;
3. configurable-product model/characteristic/rule semantics;
4. migration/test-data governance semantics;
5. Travel Request / Business Trip continuity.

Contextual extension decisions are retained for:

- subscription/usage charging;
- public-sector funds and availability control;
- global trade compliance;
- incentive compensation;
- retail/POS/promotions;
- oil-and-gas-specific processes;
- automotive importer/dealer VMS.

UX is governed as a design-system/product-quality benchmark, not a canonical business-object family.
