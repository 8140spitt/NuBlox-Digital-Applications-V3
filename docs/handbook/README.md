# NuBlox Construction & The Built Environment — Product Handbook

**Status:** authoritative product description  
**Audience:** business stakeholders, product, design, engineering, implementation, support and assurance

## 1. What NuBlox is

NuBlox Construction & The Built Environment is a **single enterprise-grade software platform that enables a construction and built-environment organisation to operate the business and deliver its work in one governed system**.

It connects corporate management, customers, opportunities, estimating, contracts, projects, programmes, design and information, procurement, construction, commercial management, finance, people, quality, health and safety, assets, facilities, service, governance, risk, legal, data and technology without turning them into disconnected software silos.

The governing product test is:

> **Can a person sit down in NuBlox and perform the job they are employed to do, create the required work products, obtain the necessary decisions, hand work to the next responsible person, and leave complete evidence of the result?**

## 2. The product model

NuBlox joins two views of the enterprise.

### Operate the business

The permanent enterprise machinery that keeps the organisation governed and capable:

- strategy and planning;
- governance and performance;
- finance and treasury;
- people and organisation;
- risk, compliance, legal and privacy;
- quality, HSE and sustainability;
- technology, data and cybersecurity;
- property, assets and facilities;
- communications, knowledge and transformation.

### Deliver the business

The value-delivery chain through which the organisation wins, plans, executes and hands over work:

```text
Market / Client
  -> Lead / Opportunity
  -> Bid / Estimate / Proposal
  -> Contract / Appointment
  -> Portfolio / Programme / Project
  -> Design / Information / Planning
  -> Procurement / Supply Chain
  -> Construction / Field Execution
  -> Commercial / Cost / Change
  -> Quality / HSE / Assurance
  -> Commissioning / Handover
  -> Asset / Facilities / Service
```

Both streams operate on shared **Enterprise Data** rather than copies.

## 3. The human operating model

```text
Person
  -> Worker Relationship
  -> Position
  -> Job Profile
  -> Functional Roles
  -> Activities
  -> Work Products
  -> Canonical Business Objects
  -> Decisions / Evidence / Handoffs
  -> Business Outcomes
```

A Job Profile describes expected professional work. A Position applies that work in a tenant's organisation. A Person occupies a Position through an effective assignment.

Security is deliberately separate:

```text
Job Profile
  != Access Role
  != Permission
  != Scope
  != Delegated Authority
  != Approval Authority
```

## 4. The enterprise application model

The user works through one application shell containing:

- **Home** — enterprise/context overview;
- **My Work** — assigned, eligible, pending and overdue work;
- **Job Workbench** — work expected because of the user's Position and Job Profile;
- **Operate** — persistent enterprise operations;
- **Deliver** — value-delivery processes and contexts;
- **Enterprise Data** — governed master/reference data;
- **Functions** — the complete F01-F29 capability directory;
- **Search** — authorised search across canonical objects;
- **Task Bar** — active personal work contexts and recoverable drafts;
- **Administration** — business configuration, security and technical administration.

Users may enter from their job, a function, a process, a project, search or a related object and still reach the same canonical record.

## 5. Shared work-product experiences

NuBlox does not need a bespoke screen for every work product. It composes a governed set of reusable authoring experiences:

- Object Workspace;
- Collection View;
- Enterprise Grid;
- Structure Browser;
- Plan / Schedule Workspace;
- Calculation / Model Workbench;
- Controlled Information Editor;
- Case / Assessment Workspace;
- Inspection / Test Workbench;
- Change Workspace;
- Decision / Approval Workspace;
- Transaction / Commitment Workspace;
- Execution / Field Record;
- Report / Snapshot;
- Handover / Closeout Package;
- Evidence / History / Relationship panels;
- Viewer and Map / Spatial workspaces where required.

## 6. The 29 business-function workspaces

The function model is the complete capability directory of the enterprise:

| ID | Function |
| --- | --- |
| F01 | Strategy & Enterprise Planning |
| F02 | Corporate Governance |
| F03 | Enterprise Performance Management |
| F04 | Corporate Development & M&A |
| F05 | Product, Service & Innovation Management |
| F06 | Marketing & Brand |
| F07 | Sales & Commercial Management |
| F08 | Customer Service, Experience & Success |
| F09 | Procurement & Supplier Management |
| F10 | Demand, Supply Chain & Logistics |
| F11 | Manufacturing / Production Operations |
| F12 | Service Delivery & Field Operations |
| F13 | Quality Management |
| F14 | Finance, Accounting, Treasury & Tax |
| F15 | Human Resources / Human Capital |
| F16 | Information Technology |
| F17 | Data, Analytics & AI |
| F18 | Cybersecurity & Information Security |
| F19 | Legal & Corporate Secretariat |
| F20 | Risk, Compliance, Internal Control & Audit |
| F21 | Privacy & Information Governance |
| F22 | Property, Facilities & Physical Assets |
| F23 | Health, Safety, Environment & Sustainability |
| F24 | Business Continuity, Crisis & Physical Security |
| F25 | Communications, Public Affairs & Investor Relations |
| F26 | Knowledge, Document & Records Management |
| F27 | Portfolio, Programme & Project Management |
| F28 | Change & Transformation Management |
| F29 | Business Process & Continuous Improvement |

The 29 workspaces are **not 29 separate applications or databases**. They are governed perspectives over shared business truth.

## 7. Handbook chapters

- [01 — Product & Enterprise Model](01-product-and-enterprise-model.md)
- [02 — People, Jobs & Work](02-people-jobs-and-work.md)
- [03 — Operate the Business](03-operate-the-business.md)
- [04 — Deliver the Business](04-deliver-the-business.md)
- [05 — Enterprise Data, Objects & Information](05-enterprise-data-and-information.md)
- [06 — Workflow, Authority, Evidence & Experience](06-workflow-authority-evidence-and-experience.md)
- [07 — System Architecture](07-system-architecture.md)
- [08 — Product State & Roadmap](08-product-state-and-roadmap.md)
- [09 — Glossary](09-glossary.md)

## 8. Supporting evidence

Detailed registers and benchmark material remain in `docs/product/`, `docs/data-model/` and `docs/benchmarks/`. They support traceability but are not required reading to understand how the product works.
