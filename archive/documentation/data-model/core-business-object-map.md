# NuBlox Core Business Object Map

**Status:** design-review baseline  
**Purpose:** show the minimum identity and relationship backbone that the wider Construction & Built Environment object universe must attach to.

This is a conceptual map, not a physical database ERD.

## 1. Enterprise and party identity

```mermaid
graph TD
  T[Tenant] --> EG[Enterprise Group]
  EG --> LE[Legal Entity]
  LE --> OU[Organisation Unit]
  OU --> BR[Branch / Office]
  OU --> TM[Team]

  P[Party] --> PER[Person]
  P --> ORG[Organisation]

  ORG --> PR[Party Relationships]
  PER --> WR[Worker / Employment Relationships]
  PER --> UI[User Identity]
  UI --> M[Membership]
  M --> RA[Role Assignment]
  RA --> DA[Delegated Authority]

  PR --> CUST[Customer Relationship]
  PR --> SUP[Supplier Relationship]
  PR --> SUB[Subcontractor Relationship]
  PR --> CON[Consultant Relationship]
  PR --> PROJ[Project Participation]
```

The same organisation can hold several relationships simultaneously. Customer, supplier, subcontractor and consultant are not duplicate organisation masters.

## 2. Delivery, project and contract context

```mermaid
graph TD
  PF[Portfolio] --> PG[Programme]
  PG --> PJ[Project / Job]
  PJ --> PH[Phase / Stage]
  PJ --> WBS[WBS Element]
  WBS --> WP[Work Package]
  WP --> ACT[Schedule Activity / Milestone]

  PJ --> PP[Project Participation]
  PP --> PARTY[Party / Person]

  PJ --> CT[Contract / Appointment]
  CT --> CP[Commercial / Procurement Package]
  CP --> PO[Purchase Order / Subcontract Commitment]

  CT --> CH[Change / Variation / Compensation Event]
  CT --> VAL[Application / Valuation / Assessment / Certificate]
```

Projects, contracts and packages are related but must not be treated as interchangeable scope structures.

## 3. Built-environment spatial and technical identity

```mermaid
graph TD
  EN[Estate / Network] --> SI[Site]
  SI --> LP[Land / Property]
  SI --> FI[Facility / Building / Infrastructure Entity]
  FI --> LOC[Level / Zone / Space / Linear Segment]
  FI --> SYS[System / Subsystem]
  LOC --> AS[Asset / Component / Maintainable Item]
  SYS --> AS

  AS --> AM[Asset Type / Model]
  AS --> WAR[Warranty]
  AS --> MTR[Meter / Sensor / Condition Point]
  AS --> HIST[Operational / Maintenance History]
```

The physical asset identity survives design, procurement, installation, commissioning, handover, operation, maintenance, refurbishment and disposal.

## 4. Product, material and manufactured definition

```mermaid
graph TD
  ITEM[Product / Material / Service Item] --> SPEC[Item Specification]
  ITEM --> VAR[Variant]
  ITEM --> SUPREL[Supplier-Item Relationship]
  ITEM --> MANREL[Manufacturer Relationship]
  ITEM --> BOM[BOM / Assembly]
  BOM --> COMP[Component Items]
  ITEM --> LOT[Lot / Batch / Serial Identity]

  BOM --> PROD[Production Order]
  PROD --> AMC[As-manufactured Configuration]
  AMC --> ASSET[Installed Asset / Component]
```

Product definition and physical asset identity are related but distinct: a product/model describes what can be made or supplied; an asset/serial instance describes what actually exists in the built environment.

## 5. Information and design identity

```mermaid
graph TD
  IR[Information Requirement] --> DEL[Deliverable]
  DEL --> IC[Information Container]
  IC --> REV[Revision / Iteration]
  REV --> REP[Content / Representation]
  IC --> CLS[Classification / Suitability / Status]
  IC --> TX[Transmittal / Distribution]
  IC --> REL[Project / Location / System / Asset Relationships]

  IC --> DOC[Document]
  IC --> DWG[Drawing]
  IC --> MDL[Model]
  IC --> SPC[Specification]
  IC --> CALC[Calculation]
```

Review/approval tasks are workflow objects acting on the controlled information; they are not the information container itself.

## 6. Procurement, inventory and delivery thread

```mermaid
graph LR
  NEED[Need / Requisition] --> SOURCE[Sourcing / RFQ]
  SOURCE --> AWARD[Award]
  AWARD --> PO[Purchase Order / Subcontract]
  PO --> REC[Goods / Service Receipt]
  REC --> INV[Supplier Invoice]
  INV --> PAY[Payment]

  PO --> ITEM[Item / Service]
  REC --> MOVE[Inventory Movement]
  MOVE --> STOCK[Stock Position Projection]
  REC --> PROJ[Project / Work Package]
```

Stock position is normally a projection from inventory movements, not a second mutable source of truth.

## 7. Commercial and financial recognition

```mermaid
graph LR
  EVT[Operational / Commercial Source Event] --> COM[Commercial Consequence]
  COM --> DOC[Invoice / Valuation / Payment Record]
  DOC --> POST[Accounting Posting]
  POST --> LEDGER[Ledger Entry]
  LEDGER --> REPORT[Financial / Management Projection]
```

Commercial and accounting positions must remain traceable to source evidence. Reporting views are projections unless an approved reporting snapshot is explicitly frozen.

## 8. Work, workflow and domain-state separation

```mermaid
graph TD
  OBJ[Domain Business Object] --> LS[Domain Lifecycle State]
  OBJ --> WF[Workflow Process]
  WF --> WI[Work Item / Assignment]
  WI --> USER[Assigned Person / Role]
  WI --> DEC[Decision / Response Evidence]
  DEC --> TRANS[Requested Domain Transition]
  TRANS --> AUTH[Permission + Authority + Business Rules]
  AUTH --> LS
```

This is the key correction from the F01.01 prototype: workflow coordinates human work, but the domain object owns its business state and validates the transition.

## 9. Evidence and audit backbone

```mermaid
graph TD
  OBJ[Governed Object] --> BE[Business Event]
  OBJ --> AE[Audit Event]
  OBJ --> EV[Evidence Item]
  OBJ --> SIG[Signature / Attestation]
  OBJ --> RET[Retention / Legal Hold]

  BE --> PROV[Provenance / Source Reference]
  AE --> ACTOR[Actor / Identity]
  EV --> IC[Information Container / External Evidence]
```

Evidence links to domain truth; it does not replace structured business state.

## 10. Review principle

Every candidate business object in the generated register must ultimately attach to this backbone or justify a new identity pattern.

If a proposed object cannot answer **what gives it independent identity, what scope owns it, what it relates to, and why it cannot be a relationship/event/version/projection of another object**, it should not be promoted to canonical root status.
