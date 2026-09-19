# Competitive Experience Benchmark — Cross-Suite Findings 01

**Status:** first comparative pass; detailed menu inventories remain in progress  
**Date:** 19 September 2026  
**Purpose:** establish cross-vendor interaction evidence before NuBlox runtime refactoring

## Scope of this pass

This pass intentionally compares products with very different histories and operating models:

- SAP S/4HANA Cloud / Fiori
- Oracle Fusion Cloud Applications
- Microsoft Dynamics 365
- IFS Cloud
- Infor CloudSuite / Infor OS
- Procore
- Oracle Aconex
- Salesforce
- IBM Maximo
- Planon
- Bentley ProjectWise
- Dassault Systèmes 3DEXPERIENCE
- Sage Intacct Construction
- PTC Windchill

This is **not** closure of their menu-by-menu inventories. It records the first stable cross-suite interaction patterns that should already influence NuBlox.

## Source set

Primary official/current documentation used in this pass includes:

- SAP Fiori Launchpad navigation and business-role/space documentation:
  - https://help.sap.com/docs/SAP_S4HANA_CLOUD/4fc8d03390c342da8a60f8ee387bca1a/8d8f9733fe634e6ba4970b36eaa8219a.html
- Oracle Fusion common navigation:
  - https://docs.oracle.com/en/cloud/saas/readiness/common/25d/common25d/25D-common-wn-f39872.htm
  - https://docs.oracle.com/en/cloud/saas/applications-common/25c/oacpr/using-common-features.pdf
- Microsoft Dynamics 365 navigation:
  - https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/user-interface/page-navigation
  - https://learn.microsoft.com/en-us/dynamics365/get-started/navigate
- IFS Cloud Lobby/navigation:
  - https://docs.ifs.com/ifsclouddocs/26r1/lang/en/UserGuide/AboutLobbyPage.htm
- Infor OS Portal/workspaces:
  - https://developer.infor.com/tutorials/portal-and-workspaces
- Procore navigation:
  - https://support.procore.com/getting-started-with-procore/login-and-account-management/tutorials/navigate-procores-tools
- Oracle Aconex:
  - https://help.aconex.com/aconex/our-main-application/using-aconex/
  - https://help.aconex.com/tasks/tour-of-the-tasks-page/
- Salesforce:
  - https://help.salesforce.com/s/articleView?id=xcloud.user_alltabs.htm&language=en_US&type=5
  - https://help.salesforce.com/s/articleView?id=sf.basics_object_page.htm&language=en_US&type=5
  - https://help.salesforce.com/s/articleView?id=sf.console_lex_sales_intro.htm&language=en_US&type=5
- IBM Maximo:
  - https://www.ibm.com/docs/en/masv-and-l/maximo-manage/cd?topic=getting-started
- Planon:
  - https://webhelp.planoncloud.com/en/Fundamentals/Fundamentals_2.pdf
  - https://webhelp.planoncloud.com/en/Fundamentals/c_Elements_panel.html
- Bentley ProjectWise:
  - https://bentleysystems.service-now.com/community?id=kb_article_view&sysparm_article=KB0020585
  - https://bentleysystems.service-now.com/community?id=kb_article_view&sysparm_article=KB0020595
- Dassault Systèmes 3DEXPERIENCE:
  - https://3dswym.3dexperience.3ds.com/wiki/solidworks-news-info/your-first-steps-as-a-platform-user_7cyFR2TjRN6PreAKZbuiwg
- Sage Intacct Construction:
  - https://www.intacct.com/ia/docs/en_GB/help_action/Construction/sage-intacct-construction.htm
- PTC Windchill:
  - https://support.ptc.com/help/windchill/r13.1.2.0/en/index.html

## Finding 1 — mature suites do not rely on one navigation axis

Different vendors expose different combinations of:

- role/persona;
- app/module;
- workspace/work area;
- enterprise or project context;
- object/record;
- task/inbox;
- search;
- favourites/recent.

Examples:

- SAP exposes role-assigned **spaces/pages/apps**;
- Oracle exposes functional groups, **work areas and tasks**;
- Microsoft exposes **dashboard, workspaces, modules, recents and favourites**;
- IFS exposes **Navigator + Lobbies**;
- Salesforce exposes **apps + objects + record pages**;
- Procore exposes **company/project context + discipline/tool navigation**;
- Aconex exposes **project + module + Tasks**.

### NuBlox requirement

The 29 functions cannot remain the sole first-class navigation model.

NuBlox needs at least:

- My Work;
- Operate;
- Deliver;
- Enterprise Data;
- enterprise/context access;
- canonical object access;
- functions;
- administration;
- search.

## Finding 2 — role-aware landing/workspace patterns are nearly universal

SAP business roles drive spaces/pages; Microsoft Workspaces are explicitly activity/persona-oriented; IFS Lobbies are tailored to an individual, role or process; Infor exposes role workspaces; Maximo Start Centers expose relevant applications/actions/records by role.

### NuBlox requirement

Home should not be an architecture dashboard.

Home/My Work should be a role-aware operational surface with:

- attention;
- exceptions;
- approvals;
- active work;
- recent objects;
- relevant contexts;
- entry into the user's common processes.

## Finding 3 — context is explicit in mature construction/project systems

Procore foregrounds company/project switching. Aconex foregrounds the current project and lets users switch projects. ProjectWise uses projects/work areas. Windchill uses contexts.

### NuBlox requirement

A stable context model must be visible in the shell and reusable by pages.

Candidate NuBlox context dimensions include:

- tenant;
- legal entity;
- organisation unit;
- portfolio/programme/project;
- contract;
- site/property/asset;
- customer/supplier where appropriate.

Context is a perspective/filter/authority dimension; it does not create duplicate master data.

## Finding 4 — object collections and object pages are reusable platform primitives

Salesforce explicitly separates object home/list pages from record detail pages. Microsoft commonly starts from lists of records and allows saved/shared views. Windchill information pages collect details, relationships, structure, changes and history around an object. Maximo manages records such as assets, locations, work orders and purchase orders through repeatable application patterns.

### NuBlox requirement

Implement shared primitives for:

- collection/list view;
- split list/object view;
- object workspace;
- related-object panels;
- reusable action availability;
- status/lifecycle;
- history.

The current function-local master/detail implementations should converge on these primitives.

## Finding 5 — enterprise search is not optional

Oracle's current Home with Ask Oracle is explicitly a search/navigation experience across tasks, applications and information. Microsoft provides navigation search. Salesforce provides record search. Windchill and ProjectWise have deep object/document search.

### NuBlox requirement

The current command palette should remain a navigation accelerator, but a separate enterprise search capability is required.

Enterprise search must eventually resolve:

- Party/person/organisation;
- project/programme;
- contract;
- customer/supplier;
- product/item;
- asset/system;
- controlled information;
- work items;
- finance/commercial transactions where permitted.

## Finding 6 — saved working views, recent items and favourites are fundamental productivity tools

Microsoft has favourites/recent/workspaces; Salesforce has list views and pinned views; Procore supports favourite tools; HxGN EAM exposes favourites/search; ProjectWise supports saved searches.

### NuBlox requirement

Add a reusable user-view model covering:

- saved filters;
- saved columns;
- sort/group state;
- context scope;
- pinned/favourite objects or workspaces;
- recent objects;
- optional sharing of governed team views.

## Finding 7 — high-volume data interaction must differ from single-record forms

Mature enterprise tools use lists, structures, editable grids, mass actions and spreadsheet import/export. ProjectWise explicitly supports Excel import/export tooling; Salesforce object homes expose import/manage-record tools; Sage construction operates over WBS/cost structures; Windchill product structures support large structured edits.

### NuBlox requirement

Define a common high-volume data-entry platform capability:

- keyboard navigation;
- copy/paste;
- multi-row create/edit;
- fill down;
- bulk actions;
- validation at cell/row/batch level;
- undo/recovery where safe;
- CSV/XLSX staging;
- import mapping;
- validation/error workbench;
- authorised commit;
- provenance.

Do not implement large BOQs, estimates, schedules, rate tables, assets or product structures as repeated modal forms.

## Finding 8 — product/master/reference/configuration data needs a distinct user experience

SAP exposes master-data specialist roles/spaces. Salesforce objects can have dedicated object homes. Windchill product/part/classification/configuration functions are operational product-data work. Maximo exposes item/inventory/asset records. Planon treats properties/assets/contracts/orders as managed operational records.

### NuBlox requirement

Create a first-class **Enterprise Data** area separate from technical administration:

- Party/customer/supplier;
- Product & Item;
- Resources/plant;
- Asset/System;
- Organisation;
- Finance structures;
- Classification;
- Reference data;
- governed business configuration.

## Finding 9 — business configuration and technical administration are different jobs

Oracle exposes Setup and Maintenance separately from normal work areas. SAP has business process configuration roles/spaces. Windchill has rich lifecycle/type/policy/workflow administration. Maximo separates security/configuration from daily record work.

### NuBlox requirement

Split:

**Enterprise Data**
- business masters and classifications;

**Business Configuration**
- lifecycles;
- numbering;
- workflows;
- approval rules;
- terms;
- calendars;
- templates;

**Technical Administration**
- users/security;
- integrations;
- queues/jobs;
- system health;
- migrations;
- environment/platform settings.

## Finding 10 — workspace/dashboard surfaces should lead into work, not duplicate domain truth

Microsoft defines operational workspaces as activity-oriented pages and explicitly distinguishes them from the underlying forms/data sources. IFS Lobbies are high-level operational views linked to detailed pages. Infor workspaces use widgets and drill-back.

### NuBlox requirement

Operate/Deliver landing pages and function workspaces should contain:

- counters;
- exceptions;
- relevant lists;
- process links;
- analytics;
- shortcuts;

but should link to canonical objects for durable record work.

## Finding 11 — construction systems foreground project delivery context

Aconex modules include Documents, Mail, Workflows, Models, Packages, Cost, Field, Test Plans, Tenders, Supplier Documents, Insights, Archive and Handover. Procore exposes project tools around project context. Sage Construction organizes projects around WBS, commitments, contracts/billing, WIP and compliance.

### NuBlox requirement

"Deliver the Business" must make project/programme/contract contexts feel like coherent operating environments rather than forcing users to navigate separate functions to reconstruct project truth.

## Finding 12 — a shared task surface is a recurring pattern, but task is not domain state

Aconex Tasks consolidates attention across modules. Microsoft surfaces assigned workflow items. Role/workspace products consistently bring exceptions/tasks close to the user's landing page.

### NuBlox requirement

Strengthen My Work as the universal task/approval/exception surface while retaining the existing NuBlox rule:

> Work assignment, permission, delegated authority and domain state are separate.

## Finding 13 — split-view and tabbed working contexts are useful for high-throughput roles

Salesforce's Sales Console combines list/split view with workspace tabs/subtabs. Enterprise products commonly let users retain context while moving through related records.

### NuBlox requirement

The Task Bar should evolve into a genuine working-context system:

- pinned/resumable object contexts;
- safe multi-record work;
- dirty/draft awareness;
- no duplication of the same canonical object solely because it was entered from another function;
- optional split list/object view for high-throughput queues.

## Finding 14 — structure/tree interaction is a distinct primitive

Windchill product structures, ProjectWise work areas/folders/sets, Planon selection levels and enterprise hierarchies all require more than flat tables.

### NuBlox requirement

Add a reusable hierarchical/structure interaction system for:

- organisation;
- WBS;
- schedule breakdown;
- product/BOM;
- asset/system/network;
- document/information structures;
- cost structures;
- package structures.

The hierarchy UI must not imply that unrelated canonical hierarchies are one universal tree.

## Finding 15 — role/app packaging is useful, but product boundaries should remain invisible where possible

SAP spaces, Salesforce apps, 3DEXPERIENCE roles/apps and Infor portal apps package relevant capability for a persona.

### NuBlox requirement

NuBlox may use role/persona navigation presets, but must avoid exposing implementation packaging as if the user were moving between separate products.

Operate, Deliver and Enterprise Data should feel like one enterprise system.

## Initial experience architecture consequence

The cross-suite evidence supports a NuBlox shell closer to:

```text
Home / My Work

Operate
Deliver
Enterprise Data

Contexts
  Projects
  Contracts
  Customers
  Suppliers
  Products & Items
  Assets
  People

Search

Business Functions
  F01-F29

Administration
```

This is a conceptual hierarchy, not a final menu.

## Next detailed passes

The following remain required before experience-benchmark closure:

1. menu inventory for every registered suite;
2. detailed data-entry/import comparison;
3. object-workspace anatomy comparison;
4. product/item/master-data comparison;
5. process/workspace comparison;
6. construction project-context comparison;
7. administration/configuration comparison;
8. mobile/field comparison;
9. quantified NuBlox gap register;
10. Experience System updates and implementation sequencing.

