# Enterprise Control and Specialist Back Office Wave

**Status:** architecture challenge complete  
**Date:** 18 September 2026  
**Scope:** ServiceNow, Diligent, Salesforce, Deltek Vantagepoint and Sage Construction

## ServiceNow

**Benchmark state:** challenged

**Official evidence**

- ITSM: https://www.servicenow.com/products/itsm.html
- Problem management: https://www.servicenow.com/uk/products/itsm/what-is-problem-management.html

ServiceNow currently unifies service request, incident, problem and change management on one platform.

NuBlox already governs distinct:

- Technology Service / Application Service;
- IT Request / Service Request;
- Incident;
- Problem;
- IT Change Request;
- Release / deployment / configuration evidence;
- shared Work Item / Approval / Decision / notification patterns;
- cyber/security/privacy/risk records separately from ITSM workflow.

**Decision**

No generic ServiceNow-style task table becomes NuBlox domain truth. IT Request, Incident, Problem and IT Change remain distinct records with their own semantics; workflow coordinates them without replacing them.

## Diligent

**Benchmark state:** challenged

**Official evidence**

- Diligent Entities: https://www.diligent.com/products/entities
- Diligent GRC: https://www.diligent.com/gb

Diligent Entities centralises legal-entity data, ownership, directors/officers, filings and corporate records; Diligent's wider platform connects board/governance, risk, audit and compliance.

NuBlox already governs:

- Legal Entity;
- Organisation / Party / Person;
- Ownership Relationship;
- External Identifier;
- Governance Body / Meeting / Decision / Action;
- Authority Framework / Delegated Authority;
- Statutory Filing;
- Enterprise Risk / Control / Audit / Compliance Requirement.

### CTRL-W5-DILIGENT-01 — statutory corporate office

**Finding**

A formal director/company-secretary/officer appointment is not adequately represented by generic Role Assignment or HCM Position because it carries jurisdictional legal-office and filing provenance.

**Decision**

Accepted as **BG-028**.

NuBlox now governs:

- Corporate Office Appointment;
- Corporate Entity Register Snapshot.

The snapshot is a reproducible statutory/read model over canonical entity, ownership, office and filing truth; it never becomes another Legal Entity master.

## Salesforce

**Benchmark state:** challenged

**Official evidence**

- Service Cloud: https://www.salesforce.com/products/service-cloud/features/
- Field Service: https://www.salesforce.com/service/field-service-management/guide/

Salesforce joins customer cases, omnichannel service, knowledge, routing, field-service scheduling, work orders, skills, assets and inventory context.

NuBlox already governs:

- Party/Customer Relationship;
- CRM Activity / Lead / Opportunity;
- Customer Case;
- Service Request / Service Case;
- Service Entitlement / SLA;
- Work Order / Field Visit / Dispatch;
- Asset / installed-base context;
- Item/inventory movement;
- Worker Skill/Competency;
- knowledge/controlled information.

**Decision**

No new customer-service or field-service master. Salesforce validates the current handoff from customer case/entitlement into field work, inventory use and service history while preserving separate source identities.

## Deltek Vantagepoint

**Benchmark state:** challenged

**Official evidence**

- Vantagepoint ERP: https://www.deltek.com/products/erp/vantagepoint/
- Resource Management: https://www.deltek.com/products/erp/vantagepoint/resource-management/
- Accounting / Financial Management: https://www.deltek.com/products/erp/vantagepoint/accounting-and-financial-management/product-tour/

Deltek connects pursuit, project setup, staff capacity/utilisation, project delivery, time/expense, billing, forecasting and financial performance for architecture/engineering/professional-services firms.

### Resource planning

NuBlox already has:

- Resource Requirement;
- Workforce Plan;
- Worker Availability;
- Workforce Allocation;
- Skill / Competency / Person Competence;
- Time Entry / Timesheet;
- project/WBS/Activity context.

**Decision**

No separate resource-booking master is required. Tentative/confirmed assignment semantics can be represented through Workforce Allocation lifecycle/configuration while Worker Availability remains derived.

### CTRL-W5-DELTEK-02 — billing and recognition

Deltek explicitly connects project WIP, billing and project-financial recognition while keeping project delivery and accounting linked.

**Decision**

Corroborates **BG-029** with Sage. Billing, WIP and accounting recognition remain distinct.

## Sage Construction

**Benchmark state:** challenged

**Official evidence**

- Sage Intacct Construction: https://www.sage.com/en-gb/sage-business-cloud/intacct/product-capabilities/extended-capabilities/construction/
- Sage Construction: https://www.sage.com/en-gb/industry/construction/
- Revenue Recognition: https://www.sage.com/en-gb/sage-business-cloud/intacct/product-capabilities/extended-capabilities/revenue-recognition/
- Project Costing/Billing: https://www.sage.com/en-gb/sage-business-cloud/intacct/product-capabilities/extended-capabilities/project-costing/

Sage explicitly supports committed/actual construction cost, job costing, WIP by job/sub-job, over/under billing, revenue recognition, retention billing and multi-entity finance. Sage also states revenue recognition is kept separate from billing.

### CTRL-W5-SAGE-01 — construction WIP

**Finding**

NuBlox already has Contract, Contract Value Schedule, Progress/Project Performance Snapshot, Actual/Commitment/Forecast positions, Customer Invoice and immutable Ledger postings. The missing accounting layer was a governed recognition policy and reproducible WIP calculation/position.

**Decision**

Accepted as **BG-029**.

NuBlox now governs:

- Financial Recognition Policy;
- Construction WIP Calculation Run;
- Construction WIP Position.

WIP may show earned/recognised revenue, recognised cost, margin, billed-to-date, unbilled/contract asset and overbilling/contract liability positions.

It remains distinct from:

- CVR / project-controls performance;
- Customer Invoice / receivable billing;
- Contract value;
- posted Ledger Entries.

## Wave outcome

New accepted refinements:

### BG-028 — corporate statutory governance

- Corporate Office Appointment;
- Corporate Entity Register Snapshot.

### BG-029 — construction WIP and recognition

- Financial Recognition Policy;
- Construction WIP Calculation Run;
- Construction WIP Position.

No additional core semantic gaps were required from ServiceNow, Salesforce or Deltek resource planning because the relevant NuBlox identities already exist and preserve stronger source-truth boundaries.

## Deliberate non-adoptions

NuBlox does not adopt:

- one generic workflow/task table as enterprise domain truth;
- a CRM customer copy separate from Party/Relationship;
- a field-service asset copy separate from canonical Asset;
- an A&E resource-planning person/project copy;
- WIP as a mutable project-cost ledger;
- entity-management software as a second Legal Entity master.

## Wave status

**ServiceNow:** challenged  
**Diligent:** challenged  
**Salesforce:** challenged  
**Deltek Vantagepoint:** challenged  
**Sage Construction:** challenged

All **23/23** registered market benchmark products/suites have now completed architecture-level challenge. Runtime feature parity remains explicitly unclaimed.
