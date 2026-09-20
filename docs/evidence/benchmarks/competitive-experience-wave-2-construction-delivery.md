# Competitive Experience Benchmark — Construction Delivery UX Wave 2

**Status:** detailed first pass complete; benchmark rows remain **in progress** until full menu inventories are closed  
**Date:** 19 September 2026  
**Products:** Oracle Construction & Engineering (Aconex, Primavera Cloud, Unifier, Textura); Procore; Autodesk Construction Cloud / Forma; Trimble ProjectSight / Construction One; Sage Construction; Causeway; Thinkproject / CONTRACTS (CEMAR); Asite; Hexagon EcoSys

## Purpose

Wave 2 pressure-tests the emerging NuBlox enterprise experience against construction-native and capital-project platforms.

The central question is:

> When Project, Programme, Contract, Site and commercial delivery are the user's dominant daily contexts, does the NuBlox shell still make sense?

The answer from this first pass is **yes, but with a major refinement**:

> **Project / Programme / Contract / Site must be first-class operating contexts, not merely object destinations hidden under functions.**

The review also reinforces that project delivery software is strongest when it combines:

- context switching;
- personal work / assignments;
- project-level tools;
- durable records;
- structured correspondence;
- project information;
- commercial/cost structures;
- field/mobile work;
- project-level configuration;
- cross-project/portfolio oversight.

---

# Oracle Construction & Engineering

Oracle's construction portfolio deliberately spans multiple specialist experiences rather than one universal screen:

- **Aconex** — project information, correspondence, workflows, models, packages, field, tenders and handover;
- **Primavera Cloud** — portfolio/programme/project planning, schedule, resources, risk, tasks and workflows;
- **Unifier** — capital project/business processes, cost, documents, schedule/fund management;
- **Textura Payment Management** — construction invoicing/payment and compliance workflows.

Official evidence:

- Aconex user-guide module index:  
  https://help.aconex.com/aconex/our-main-application/using-aconex/
- Aconex Tasks page:  
  https://help.aconex.com/tasks/tour-of-the-tasks-page/
- Primavera Cloud What's New topic taxonomy:  
  https://docs.oracle.com/en/industries/construction-engineering/primavera-cloud/pc-wn/wn_2025/index.html
- Unifier Getting Started 26:  
  https://docs.oracle.com/en/industries/construction-engineering/primavera-unifier/26/gettingstartedusers.html
- Unifier Shells:  
  https://docs.oracle.com/cd/F50962_01/help/user/en/10282260.htm
- Unifier Cost Manager:  
  https://docs.oracle.com/cd/E37673_01/English/User_Guides/UnifierHelp/WebHelp/content/unifier_user_guide/cost_manager/cost_manager_overview.htm
- Textura navigation:  
  https://docs.oracle.com/cd/E97085_01/TPMhelp/en/North_America/10310120.htm

## Aconex navigation / work model

Aconex's Tasks page is explicitly described as a home page. It combines:

- current project;
- project switcher;
- projects list;
- items requiring action;
- project-specific shortcuts;
- module navigation.

Current module areas include:

```text
Tasks
Documents
Mail
Workflows
Document Processes
Models
Packages
Cost
Field
Test Plans
Mobile
Tenders / Bids
Supplier Documents
Insights
Project Archives
Handover
```

Aconex Mail is a governed project-correspondence mechanism, including types such as RFIs, and project fields can be added to Mail, Documents, Packages and Field.

### NuBlox conclusions

**1. Project correspondence is a business object, not email decoration.**

NuBlox needs governed correspondence semantics that can support:

- RFI;
- technical query;
- instruction;
- notice;
- response;
- formal communication;
- transmittal;

while preserving contract/process distinctions.

**2. Project-specific metadata must be extensible without corrupting canonical identity.**

Aconex project fields demonstrate a real need for governed extensible attributes at project/context level.

**3. Tasks should consolidate action across project capabilities.**

NuBlox My Work should aggregate project attention across Information, Commercial, QHSE, Procurement, Site and other functions without moving domain state into the work queue.

## Primavera Cloud model

Current Primavera Cloud documentation exposes capability topics including:

```text
Dashboards
Files
Global Admin
Mobile
Navigation
Portfolios
Projects
Reports
Resources
Risk
Schedule
Tasks
Workflows and Forms
```

### NuBlox conclusion

Programme/project-control work requires a dedicated delivery workspace containing schedule, resources, risk, progress and analytics while keeping:

```text
Project
≠ Schedule
≠ Risk
≠ Resource
≠ Workflow
```

This is consistent with the frozen NuBlox aggregate model.

## Unifier shell model

Unifier **Shells** are particularly important. Oracle documents shells as collaboration workspaces that may represent:

- capital projects;
- maintenance projects;
- business portfolios;
- project delivery management;

and may be arranged hierarchically such as:

```text
Region
  -> Properties
     -> Buildings
        -> Projects
```

Each shell may have its own business processes, cost worksheets, reports, dashboards, document repositories and users/groups.

### NuBlox adoption — with stricter semantics

NuBlox needs a comparable **Context Workspace**, but context must never become a new master identity.

Examples:

```text
Project Context
Contract Context
Property Context
Asset Context
Programme Context
```

The context collects relevant records and process views. The canonical objects remain owned by their aggregates.

## Unifier cost management

Unifier Cost Manager demonstrates spreadsheet-like project cost control:

- project/shell cost sheet;
- unique WBS/CBS cost codes;
- budget/cost columns;
- roll-ups from business processes;
- program roll-up;
- Schedule of Values;
- cash flow;
- earned value.

### NuBlox conclusion

Commercial/finance project work absolutely requires high-density tabular interaction. The NuBlox Enterprise Grid is not optional.

## Textura

Textura has different user navigation for:

- general contractors;
- subcontractors;
- owners;
- lower-tier/lien-waiver participants.

### NuBlox conclusion

The same business process may need **counterparty-specific interaction views** while retaining one canonical Contract / Application / Payment / Evidence truth.

---

# Procore

Official evidence:

- navigation:  
  https://support.procore.com/getting-started-with-procore/login-and-account-management/tutorials/navigate-procores-tools
- project-level tools:  
  https://support.procore.com/products/online/user-guide/project-level
- project overview:  
  https://support.procore.com/products/online/user-guide/project-level/project-overview/tutorials/about-the-project-overview
- workflow/tool catalogue:  
  https://support.procore.com/references/workflow-diagrams
- change events:  
  https://support.procore.com/products/online/user-guide/project-level/change-events

## Global/context navigation

Procore foregrounds:

```text
Company
Project
Toolbox
Favourite tools
```

Users can switch project and company. Only accessible projects/tools are shown.

### NuBlox conclusion

This strongly confirms:

> **Project must be a persistent working context in Deliver.**

A project manager should not have to reconstruct their project by navigating F07, F09, F12, F13, F14, F23, F26 and F27 independently.

## Project tool inventory

Current Procore project-level tooling includes, among others:

```text
Home / Project Overview
Bidding / Estimating
Budget
Change Events / Change Orders
Client / Prime Contracts
Commitments
Direct Costs
Invoicing / Progress Billings
RFIs
Submittals
Drawings
Specifications
Documents
Models
Coordination Issues
Correspondence
Schedule
Meetings
Daily Log / Site Diary
Inspections
Observations
Incidents
Punch / Snag List
Forms
Photos
Tasks
Timesheets
Equipment
Materials
```

### NuBlox conclusion

This is exactly the kind of **Project context aggregation** NuBlox needs, but our implementation should not treat these as isolated tools.

They should resolve to canonical domain objects and cross-object relationships.

## Project Overview

Procore Project Overview combines:

- project details;
- project team;
- project message/notes;
- quick creation;
- insights;
- open items;
- project links.

Quick Create includes records such as:

- Change Events;
- Daily Logs;
- Incidents;
- Inspections;
- Observations;
- Punch items;
- RFIs;
- Submittals;
- Tasks;
- Timesheets.

### NuBlox adoption

A Project workspace should provide context-aware **Create** actions for records whose context can be safely defaulted from the Project.

The creation action must still invoke the owning aggregate command.

## Change Event continuity

Procore Change Events connect:

```text
RFI
 -> Change Event
 -> RFQ
 -> Commitment / Subcontract context
 -> Potential Change Order
 -> Contract change
 -> Budget consequence
```

### NuBlox conclusion

Our existing separation of RFI / Commercial Change / Contract / Estimate / Decision should remain, but users need an **end-to-end change journey** that makes the relationships obvious.

## Rejected Procore pattern

Do not implement NuBlox as a toolbox of dozens of independent project apps. Preserve the convenience of Project-level aggregation while providing stronger canonical continuity.

---

# Autodesk Construction Cloud / Forma

Official evidence:

- Autodesk Docs:  
  https://help.autodesk.com/cloudhelp/ENG/Docs/files/About_Autodesk_Docs.html
- Autodesk Build:  
  https://help.autodesk.com/cloudhelp/ENG/Build-About/files/What_is_Build.html
- Cost Management setup:  
  https://help.autodesk.com/cloudhelp/ENU/Build-Cost/files/cost-getting-started/Getting_Started.html

## Platform / product navigation

Autodesk provides a **product picker** to switch among platform capabilities such as Docs, Build, BIM collaboration and Takeoff.

Docs is the common data environment across Autodesk's construction products.

Docs tools include:

```text
Files
Reviews
Transmittals
Issues
Reports
Members
Desktop Connector
Insight
Administration
```

Build adds project delivery capabilities such as:

```text
Issues
Forms
RFIs
Submittals
Meetings
Sheets
Photos
Schedule
Progress tracking
Assets
Cost / change / payment
```

### NuBlox conclusion

NuBlox should **not** copy the product picker.

It should take the positive underlying principle:

> Design, information, field, commercial and asset workflows share a common project/data context.

The user should experience one NuBlox rather than moving between separately branded products.

## Common Data Environment

Autodesk describes Docs as the common data environment that centralises project information across platform offerings.

### NuBlox conclusion

NuBlox should go further:

```text
Information Container
≠ Project
≠ Asset
≠ Contract
```

but those objects must connect seamlessly within one project context.

## Assets through handover

Autodesk Build's Asset capability tracks project assets/equipment from design to commissioning and handover.

### NuBlox conclusion

"Project-to-Asset" must be a first-class end-to-end process in Deliver:

```text
Design / Product
 -> Installed component
 -> Commissioning
 -> Handover
 -> Canonical Asset/System
 -> Maintenance
```

without creating a second asset identity at handover.

---

# Trimble ProjectSight / Construction One

Official evidence:

- ProjectSight navigation:  
  https://help.trimble.com/en-gb/doc/projectsight/projectsight/enterprise/get-started/navigate-projectsight
- current UI anatomy:  
  https://help.trimble.com/doc/projectsight/projectsight/go/basics/user-interface
- panels:  
  https://help.trimble.com/doc/projectsight/projectsight/go/basics/panels
- views:  
  https://help.trimble.com/doc/projectsight/projectsight/go/basics/user-interface/views
- project switching:  
  https://help.trimble.com/doc/projectsight/projectsight/go/projects/working-with-projects
- submittal creation:  
  https://help.trimble.com/doc/projectsight/projectsight/enterprise/records/submittals/create-a-submittal

## UI anatomy

Current ProjectSight explicitly identifies:

```text
Banner
Navigation Toolbar
Project Menu
Content Area
Right-side Panel
```

The project banner allows switching projects. The project menu exposes modules. The content area supports custom views and grid editing. Right-side panels expose information/actions.

### NuBlox conclusion

This is strong evidence for a NuBlox screen anatomy of:

```text
Global shell
Enterprise/project context bar
Workspace/object header
Primary content
Context / utility panel
Task Bar
```

## Assignments panel

ProjectSight's Assignments panel is available on the project dashboard and module pages and consolidates open assignments, due dates and record links.

### NuBlox conclusion

My Work should have both:

- a global enterprise queue;
- contextual embedded views filtered to the active project/contract/object.

The contextual panel must reference the same Work Items, not create project-local task duplicates.

## Custom views

ProjectSight current views support:

- tile/list modes;
- grouping;
- sorting;
- selectable/reorderable columns;
- resizing;
- saved custom views;
- export of the current view to Excel.

### NuBlox conclusion

This reinforces the Saved View + Enterprise Grid platform requirement.

## Draft vs full form

ProjectSight permits creation through a lightweight Create panel or a detailed full form; drafts may relax required-field enforcement until later status.

### NuBlox conclusion

Progressive creation is valuable:

```text
quick capture
 -> draft
 -> complete required governance
 -> submit / activate
```

where business semantics permit it.

---

# Sage Construction / Sage Intacct Construction

Official evidence:

- Sage Construction Management:  
  https://www.sage.com/en-gb/sage-business-cloud/intacct/product-capabilities/extended-capabilities/construction/management/
- Sage Intacct Construction:  
  https://www.sage.com/en-gb/sage-business-cloud/intacct/product-capabilities/extended-capabilities/construction/
- construction product overview:  
  https://www.sage.com/en-us/sage-construction/

## End-to-end model

Sage explicitly positions its construction stack across:

```text
Lead
Bid
Estimate
Awarded Project
Contract
Procurement
Purchase Orders
Change Orders
Project Management
Time
Billing
Job Cost
WIP
Finance
```

Sage Construction Management can create estimates from:

- scratch;
- spreadsheets;
- previous estimates;

and move final estimate details into awarded projects.

### NuBlox conclusion

This directly validates the **Deliver stream** as a continuous business chain rather than a collection of F06/F07/F09/F14 pages.

## Construction finance continuity

Sage Intacct Construction foregrounds:

- committed and actual costs;
- labour/material/plant/subcontract cost;
- project profitability;
- multi-entity finance;
- job costing;
- WIP;
- over/under billing;
- billing;
- close.

### NuBlox conclusion

Project delivery must remain connected to enterprise finance without making the Project aggregate a shadow ledger.

The UX must make the relationship understandable:

```text
Project commercial position
 -> commitments
 -> actual postings
 -> billing
 -> WIP / recognition
 -> ledger
```

## Spreadsheet ingestion

Sage explicitly supports spreadsheet-origin estimates.

### NuBlox conclusion

For construction ERP, Excel/CSV is a legitimate **input channel** that must be governed, not treated as a failure of UX.

---

# Causeway

Official evidence:

- product family:  
  https://www.causeway.com/
- commercial solutions:  
  https://www.causeway.com/commercial
- project accounting:  
  https://www.causeway.com/commercial/project-accounting

## Business grouping

Causeway currently groups solutions broadly around:

```text
Commercial
Workforce
Design
Supply Chain
Infrastructure
```

Commercial spans:

```text
Takeoff
Estimating
Tendering
Project Accounting
Commercial Management
```

Project accounting foregrounds:

- labour;
- plant;
- materials;
- subcontract;
- cost;
- budget;
- value;
- contract types including JCT/NEC.

### NuBlox conclusion

Construction organisations think in **resource/cost categories and contract mechanisms** as much as abstract financial accounts.

NuBlox commercial grids must support the construction cost model without conflating it with the finance ledger.

## Integrated estimating-to-commercial

Causeway positions estimating and project accounting as integrated stages.

### NuBlox conclusion

The Estimate should hand off a frozen/versioned cost basis to Project/Commercial structures rather than becoming mutable project actual-cost truth.

---

# Thinkproject / CONTRACTS (CEMAR)

Official evidence:

- CONTRACTS/CEMAR:  
  https://www.thinkproject.com/products/thinkproject-cemar/
- current CONTRACTS product:  
  https://www.thinkproject.com/products/contracts/
- custom contracts:  
  https://www.thinkproject.com/products/custom-contracts/
- platform model:  
  https://www.thinkproject.com/insights/blog/what-is-thinkproject-platform/

## Contract-centric experience

Thinkproject CONTRACTS is explicitly structured around:

```text
Contract
 -> obligations
 -> events
 -> workflows
 -> deadlines
 -> evidence
 -> approvals
 -> payment
 -> outcome
```

Use cases include:

- instructions;
- variations / compensation events;
- early warnings;
- risk responses;
- payment;
- programme submission;
- notices;
- certificates.

### NuBlox conclusion

This strongly reinforces **Contract Context** as a first-class Deliver workspace.

A user administering NEC/JCT/FIDIC should be able to open:

```text
Contract C-123
```

and see the relevant:

```text
Obligations
Notices
Early Warnings
Instructions
Changes
Quotations
Programme submissions
Applications / assessments
Certificates
Risk
Correspondence
Decisions
Evidence
```

without navigating the 29 functions manually.

## Event-based, not document-based, contract administration

Thinkproject explicitly distinguishes contract execution around events/obligations/workflows from static documents.

### NuBlox conclusion

This aligns strongly with canonical objects:

> PDF/documents are evidence/representations of contractual events; the contractual event itself is structured business truth.

## Contract-type configuration

Thinkproject supports NEC, FIDIC, JCT and bespoke/custom contract workflows.

### NuBlox conclusion

Contract regime belongs in **Business Configuration / Contract configuration**, not in separate duplicated applications.

---

# Asite

Official evidence:

- help-centre catalogue:  
  https://help.asite.com/en/
- Files navigation:  
  https://help.asite.com/en/articles/5335658-files-navigation
- Models navigation:  
  https://help.asite.com/en/articles/5472323-models-navigation
- workflows:  
  https://help.asite.com/en/articles/5496082-getting-started-with-workflows
- form configuration:  
  https://help.asite.com/en/articles/5444301-configure-and-manage-forms-in-a-project

## Platform catalogue

Asite's current help areas expose:

```text
Dashboard
Projects
Project Templates
Files
File Viewer
AppBuilder
Project Forms
Team Collaboration
Workflow Manager
System Tasks
Field
Quality
3D / Models
Business Analytics
Admin
Tender Manager
Contract Manager
Messages
```

### NuBlox conclusion

The breadth reinforces the same Project Context model, but NuBlox should avoid turning every capability into a separate app.

## Files workspace

Files is a central project workspace with:

- project folder/subfolder tree;
- file list;
- metadata columns;
- publish/revise;
- sharing;
- tasks;
- viewer;
- project-form creation;
- model upload;
- priority;
- attributes.

Assigned tasks can appear in a collapsible right-side pane.

### NuBlox conclusion

The right-side **context/utility panel** remains strongly supported.

Controlled information needs high-density lists/tree navigation, metadata and task visibility — not just generic cards.

## Workflow / Forms

Asite allows workflows on files, forms/custom objects with:

- user tasks;
- system tasks;
- event triggers;
- role privileges;
- status changes;
- distributions;
- notifications;
- visibility changes;
- webhooks.

### NuBlox conclusion

NuBlox should preserve stronger domain ownership:

```text
Workflow can coordinate:
  task
  notification
  requested command
  system integration

Workflow does not own:
  Contract state
  Project state
  Asset state
  Invoice state
```

## Potential benchmark caution

Asite permits assigned form tasks to be performed based on task assignment even where the project role would not independently allow the action.

NuBlox must **not** adopt assignment-as-authority. Assignment, permission and delegated authority remain separate.

---

# Hexagon EcoSys

Official evidence:

- EcoSys product:  
  https://aliresources.hexagon.com/project-management-control/ecosys-enterprise-projects-performance-software
- current Projects help:  
  https://docs.hexagonali.com/r/en-US/EcoSys-Projects-Help-4.11/Version-4.11/1268693
- Project Settings:  
  https://docs.hexagonali.com/r/en-US/EcoSys-Projects-Help-4.11/Version-4.11/1268881

## Enterprise project-performance structure

EcoSys positions three connected areas:

```text
Portfolios
Projects
Contracts
```

Projects menu follows project-cost-control process flow and includes:

- project setup;
- project structure;
- original budget;
- current budget;
- commitments;
- changes;
- forecasts;
- actuals / performance;
- approvals/workflow;
- dashboards.

### NuBlox conclusion

The Deliver experience needs a strong **Project Controls perspective** over canonical Project, Schedule, Budget, Forecast, Commitment, Contract and Ledger-related information.

## Project Structure / Cost Control Levels

EcoSys explicitly defines hierarchical Project Structures and cost-control levels where budget, commitment, actual, earned-value and forecast information can be assigned.

### NuBlox conclusion

NuBlox needs to support **multiple structures and mappings**, not one universal project hierarchy.

Existing architecture already distinguishes:

```text
WBS
Cost Code
Contract Value Schedule
Asset hierarchy
Organisation
```

The UX needs a reusable structure browser and explicit mapping tools.

## Budget / forecast / change

EcoSys preserves Original Budget versus Current Budget and subjects changes to workflow/approval. Forecasting has a distinct process and time-phased controls.

### NuBlox conclusion

This reinforces our semantic separation:

```text
Budget baseline
Change
Forecast
Actual
Performance snapshot
```

and the need for a dense project-controls grid rather than a card-first UI.

---

# Cross-suite conclusions from Construction Wave 2

## Pattern L — Project is an operating context, not merely a record

Aconex, Procore, Autodesk, ProjectSight, Unifier, Sage and Asite all foreground the project.

### NuBlox decision

**Project Context becomes a first-class shell capability.**

When active, the user should be able to understand:

```text
Project
Client
Legal entity
Programme
Primary contracts
Site(s)
Stage / status
```

and navigate the project across business capabilities.

## Pattern M — Contract deserves its own operating context

Thinkproject CONTRACTS, Unifier, Procore, Sage and EcoSys all demonstrate deep contract/commercial working models.

### NuBlox decision

**Contract Context becomes first-class**, not merely a tab buried under F07.

## Pattern N — project context and canonical object identity are different layers

A project may show:

- RFIs;
- Contracts;
- Changes;
- Work Items;
- Information;
- Risks;
- Invoices;
- Assets;

but does not own their canonical truth merely because they are visible in the Project workspace.

### NuBlox decision

Formal hierarchy:

```text
Project Context
  -> filtered/cross-domain views
  -> canonical object links
  -> owning aggregate actions
```

## Pattern O — embedded contextual work is essential

Aconex Tasks, ProjectSight Assignments and Asite task panes demonstrate that users need relevant outstanding work **inside the context they are already working in**.

### NuBlox decision

Expose My Work through:

- global My Work;
- Project-filtered My Work;
- Contract-filtered My Work;
- Object-related work.

All are projections of the same work records.

## Pattern P — construction UX needs multiple dense work surfaces

The strongest construction systems rely heavily on:

- registers;
- structured tables;
- cost sheets;
- WBS/CBS trees;
- schedules;
- document trees;
- model viewers;
- commercial event logs;
- assignment lists.

### NuBlox decision

The Experience System needs at least:

```text
Collection View
Enterprise Grid
Hierarchy / Structure Browser
Timeline / Schedule surface
Information Register
Viewer workspace
Object Workspace
Context / Utility Panel
```

Cards cannot be the default representation for enterprise data.

## Pattern Q — project data entry is often high volume

Examples include:

- estimates;
- budget/cost lines;
- WBS/CBS;
- commitments;
- Schedule of Values;
- rates;
- schedule activities;
- document metadata;
- asset/handover registers;
- inspections;
- progress measurements.

### NuBlox decision

Do not proceed deeply into F07-F14 delivery runtimes without the Enterprise Grid + import/staging foundation.

## Pattern R — delivery and finance must feel connected without sharing aggregate ownership

Sage and EcoSys particularly show how important cost/forecast/accounting continuity is.

### NuBlox decision

A Project workspace should expose coherent commercial/financial positions while clearly distinguishing:

- contract/commercial truth;
- project-control forecasts;
- accounting actuals;
- WIP/revenue recognition;
- cash/payment.

## Pattern S — built-environment change is a chain of linked objects

Procore and Thinkproject show strong continuity from issue/event through quotation/approval/change/payment.

### NuBlox decision

Create a **Change-to-Settlement** process view crossing:

```text
Issue / instruction / notice
 -> Change
 -> Impact assessment
 -> Quotation
 -> Decision
 -> Contract consequence
 -> Forecast / budget consequence
 -> valuation/payment
 -> close
```

without merging those aggregates.

## Pattern T — project information must be structured and context-aware

Aconex, Autodesk and Asite all demonstrate deep project information management.

### NuBlox decision

Information Container runtime must support:

- project registers;
- trees/folders as views;
- metadata;
- revision;
- transmittal/exchange;
- workflow/review;
- models;
- related objects;
- issue/change links;
- handover.

## Pattern U — project templates are a major setup accelerator

Autodesk, ProjectSight, Aconex, Asite and Unifier use project templates/configuration patterns.

### NuBlox decision

Introduce governed **Context Templates** later for:

- project type;
- contract regime;
- information requirements;
- default structures;
- workflows;
- classification;
- reporting/views;

without cloning master data.

---

# Updated NuBlox information-architecture hypothesis

After Enterprise Waves 1A/1B and Construction Wave 2, the primary experience should no longer be conceived as a menu of 29 functions.

A stronger model is:

```text
NuBlox
│
├── Home
├── My Work
│
├── Operate
├── Deliver
├── Enterprise Data
│
├── Contexts
│   ├── Projects
│   ├── Programmes
│   ├── Contracts
│   ├── Sites / Properties
│   └── Assets
│
├── Enterprise Search
├── Recent / Favourites
│
├── Business Functions
│   └── F01–F29
│
├── Business Configuration
└── Administration
```

Inside an active project:

```text
Project P-1048
Glasgow Infrastructure Programme

Overview
My Project Work

Commercial
Programme
Procurement
Finance
Information
Design
Site
QHSE
Resources
Risk
Handover
History
```

Those are **project perspectives**, not new aggregate owners.

Inside a contract:

```text
Contract C-1042

Overview
Obligations
Correspondence
Notices
Early Warnings / Risk
Changes
Quotations
Programme submissions
Applications / Payments
Decisions
Information / Evidence
History
```

Again, these are views over canonical objects and processes.

---

# Revised implementation consequence

The previous O0 object-centric runtime foundation remains required, but Wave 2 proves it should be expanded into an **Enterprise Interaction Foundation** before broad F07 expansion.

Minimum foundation:

1. Enterprise Context Contract;
2. Project / Contract context routing;
3. runtime object registry;
4. canonical object route;
5. Workspace shell;
6. Collection View;
7. Enterprise Grid;
8. Hierarchy / Structure Browser;
9. Saved Views / Recent / Favourites;
10. Enterprise Search;
11. global + contextual My Work;
12. Task Bar object/context integration;
13. Object Workspace;
14. Context / Utility Panel;
15. Import / staging framework;
16. Business Configuration separation;
17. denied/not-found/conflict states.

## Next benchmark wave

Product / engineering / information lifecycle must now challenge this model against:

- PTC Windchill;
- Siemens Teamcenter;
- Dassault Systèmes 3DEXPERIENCE / ENOVIA;
- Bentley ProjectWise / iTwin.

The focus is:

> Can the same NuBlox shell handle deep Product/Item data, structures, versions, effectivity, working copies, controlled information and engineering change without reverting to a function-page model?
