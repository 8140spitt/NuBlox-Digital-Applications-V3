# Competitive Experience Benchmark — Specialist Enterprise UX Wave 5

**Status:** detailed first pass complete; full menu-inventory closure remains a separate evidence task  
**Date:** 19 September 2026  
**Products:** Salesforce Lightning; Deltek Vantagepoint; Diligent One; Oracle NetSuite; Unit4 ERP / ERPx

## Purpose

Wave 5 closes the first comparative experience pass with products that challenge areas not fully exposed by broad ERP, construction, PLM or EAM suites:

- CRM/object-centric record work;
- high-throughput split/console work;
- architecture/engineering project accounting;
- governance, audit, risk and board-style oversight;
- role-centre ERP;
- people/project-centric enterprise work;
- saved searches and personalized workspaces;
- executive/management oversight.

The major conclusion is:

> **NuBlox should combine stable canonical objects with role/context workspaces and high-throughput collection views, rather than forcing users to choose between object-centricity and process/role-centricity.**

---

# Salesforce Lightning

Official evidence:

- Lightning navigation:  
  https://help.salesforce.com/s/articleView?id=home&language=en_US&type=5
- Navigate Salesforce:  
  https://help.salesforce.com/s/articleView?id=xcloud.user_alltabs.htm&language=en_US&type=5
- Object home pages:  
  https://help.salesforce.com/s/articleView?id=sf.basics_object_page.htm&language=en_US&type=5
- List views:  
  https://help.salesforce.com/s/articleView?id=xcloud.basics_navigate_list_views.htm&language=en_US&type=5
- record page views:  
  https://help.salesforce.com/s/articleView?id=sf.customize_records_record_page_view.htm&language=en_US&type=5
- Lightning Sales Console:  
  https://help.salesforce.com/s/articleView?id=sf.console_lex_sales_intro.htm&language=en_US&type=5
- Lightning Console:  
  https://help.salesforce.com/s/articleView?id=console_lex_intro.htm&language=en_US&type=5
- app navigation items:  
  https://help.salesforce.com/s/articleView?id=platform.customize_lex_nav_menus_create.htm&language=en_US&type=5

## Navigation model

Salesforce Lightning commonly exposes:

```text
App Launcher
 -> App
    -> navigation items
       -> Object Home / feature
          -> List View
             -> Record Page
```

The global UI also includes search, profile/personal settings, Setup for administrators and access to other apps.

### NuBlox conclusion

This is strong evidence that:

```text
Business Function / Perspective
 -> Collection
    -> Canonical Object
```

is a natural interaction chain.

NuBlox should not copy the Salesforce "app" abstraction. Operate, Deliver, Enterprise Data and F01-F29 provide the perspectives; collections and objects remain shared.

## Object Home / collection model

Salesforce object home pages support:

- selectable list views;
- recent records;
- create;
- import/manage-record tools;
- reports/charts.

List views support:

- pinned default;
- create/edit/share;
- multi-column sorting;
- filters;
- search within view;
- charts;
- table / Kanban / tile / split display;
- inline field editing.

### NuBlox conclusion

The **Collection View** should not be a fixed table component. It needs a view model supporting:

```text
Table
Split
Board / Kanban where domain-valid
Tile only where genuinely useful
```

with a common saved-filter/column/sort model.

Kanban must not be applied indiscriminately to objects that do not have a meaningful ordered state model.

## Record pages

Salesforce record pages distinguish:

- Full view;
- Grouped view;
- details;
- related lists;
- configurable tabs/columns;
- actions.

### NuBlox conclusion

This reinforces the object workspace grammar:

```text
Object Header
Overview / Details
Relationships
Work
Decisions
Evidence / Information
Versions where applicable
History
Domain-specific sections
```

but NuBlox should be stricter about canonical semantics than a general CRM platform.

## Console / split view

Salesforce Console supports:

- split list + current workspace;
- persistent workspace tabs;
- related-record subtabs;
- list-to-record high-throughput processing.

### NuBlox conclusion

This is a strong model for:

- My Work queues;
- lead/opportunity processing;
- supplier onboarding;
- invoice review;
- service cases;
- inspections/exceptions;
- administrative record queues.

NuBlox should support **high-throughput split mode** as an optional composition of Collection View + Object Workspace, while Task Bar preserves broader cross-context work.

## Rejected Salesforce patterns

Do not adopt:

- one generic custom-object model as a substitute for governed aggregate semantics;
- app proliferation;
- arbitrary record-page customization that bypasses business invariants;
- Kanban as a universal representation.

---

# Deltek Vantagepoint

Official evidence:

- current release stream:  
  https://help.deltek.com/product/Vantagepoint/ReleaseNotes/
- Projects Hub (2025.2 help):  
  https://help.deltek.com/product/vantagepoint/2025.2/st_projectshub.html
- project details:  
  https://help.deltek.com/Product/Vantagepoint/7.2/ST_Hubs_Projects_Projects.html
- detail/list views:  
  https://help.deltek.com/Product/Vantagepoint/7.2/ic_all_info_center_detail_and_list_views.html
- project dashboard:  
  https://help.deltek.com/Product/Vantagepoint/7.1/ST_Hubs_Projects_Dashboard.html
- dashboard:  
  https://help.deltek.com/Product/Vantagepoint/7.2/Dashboard.html
- project dashboard search/navigation:  
  https://help.deltek.com/Product/Vantagepoint/7.2/ST_Proj_DashboardTab.html

Deltek's release-notes service shows Vantagepoint 2026.4 as the current release stream on 15 September 2026. Some stable interaction help pages continue under prior-version URLs, so this study treats the documented interaction pattern as evidence without claiming every screen is unchanged in 2026.4.

## Projects Hub as persistent project context

The Projects Hub explicitly connects project:

- dashboard;
- project record;
- billing terms;
- planning/accounting information;
- project review;
- WBS levels.

Critically, Deltek documents that when a project — or a lower-level WBS element — is selected in one Projects Hub application, that selection is retained when switching to another related application.

### NuBlox conclusion

This is powerful evidence for **context persistence**:

```text
Current Project
Current WBS element where relevant
 -> preserved across project perspectives
```

without changing canonical object identity.

Project context should survive navigation between:

- commercial;
- finance;
- programme;
- resources;
- procurement;
- information;

where the target view supports that context.

## Detail view vs list view

Vantagepoint hubs support:

- Detail View — one record, tabbed fields;
- List View — multiple records in an editable grid;
- column selection/reordering;
- full-screen grid;
- saved/ad-hoc search;
- bulk update;
- explicit multi-record save.

### NuBlox conclusion

This is one of the clearest patterns for a shared NuBlox **Collection / Grid / Object** grammar.

Users should be able to choose:

```text
analyse many
edit many
work one
```

without entering three unrelated page systems.

## Search navigation controls

Deltek's search/navigation controls support:

- saved searches;
- standard/personal/shared/complex searches;
- record paging;
- selected record sets;
- switching list/detail views.

### NuBlox conclusion

Saved Views and Search Sets should become reusable platform concepts and may also provide peer-record navigation inside a collection.

## Dashboard

Vantagepoint dashboards combine:

- hub-record dashparts;
- favourite reports;
- My Activities;
- links;
- frequently used applications;
- role/access-specific content.

### NuBlox conclusion

Role dashboards are useful, but should remain **entry/attention surfaces**, not the canonical record experience.

## Project pursuit continuity

The Projects Hub can also manage projects/contracts being pursued, track pursuit costs and begin project planning.

### NuBlox conclusion

This reinforces continuity:

```text
Opportunity / Pursuit
 -> Proposed Project / Delivery model
 -> Award
 -> Live Project
```

but NuBlox should preserve separate Lead/Opportunity/Pursuit/Contract/Project identities and explicit handoffs.

## Rejected Deltek patterns

Do not adopt:

- project-centricity as the universal enterprise model;
- the same record identity for pursuit and delivered Project where our canonical model requires explicit handoff;
- dashboard composition as a substitute for durable object workspaces.

---

# Diligent One

Official evidence:

- current global navigation:  
  https://help.diligentoneplatform.com/helpdocs/d1p/en-us/Content/get_started/launchpad/new-global-nav.htm
- platform home layout:  
  https://help.diligentoneplatform.com/helpdocs/d1p/en-us/Content/get_started/launchpad/launchpad-layout.htm
- September 2026 release notes:  
  https://help.diligentoneplatform.com/helpdocs/d1p/en-us/Content/release_notes/release-notes-platform-general.htm
- Audit getting started:  
  https://help.diligentoneplatform.com/helpdocs/d1p/en-us/Content/audit/getting_started.htm
- Projects navigation:  
  https://help.diligentoneplatform.com/helpdocs/d1p/en-us/Content/projects/getting_started/getting_started.html
- Risk Manager records:  
  https://help.diligentoneplatform.com/helpdocs/d1p/en-us/Content/risk_manager/viewing-rm-records.htm
- Projects activity logging:  
  https://help.diligentoneplatform.com/helpdocs/d1p/en-us/Content/projects/scheduling_tracking/tracking/tracking_changes_with_activity_logging.html

## Current global navigation

Diligent One introduced a new global navigation in September 2026 with:

```text
Top navigation
Organization
App switcher
Help & resources
Organization settings
Profile/preferences
```

Application-specific navigation remains within each app.

### NuBlox conclusion

A stable enterprise shell with context-sensitive second-level navigation remains the right approach.

The useful Diligent pattern is:

```text
global enterprise frame
 -> specialist governed workspace
```

The pattern to reject is exposing every specialist capability as a separately branded application.

## Organisation context

The platform home displays the current organization and supports organization switching where the user has access.

### NuBlox conclusion

Enterprise/legal-entity context needs visible treatment, especially for governance, finance and authority, but must remain a typed context dimension rather than a generic tenant switch.

## Audit

Diligent Audit home combines:

- navigation;
- role-sensitive widgets;
- recent activity;
- actions;
- audit universe;
- risk assessment;
- audit planning;
- audits/issues/remediation.

### NuBlox conclusion

Governance work needs first-class durable objects:

```text
Audit Universe / Scope
Assessment
Audit Plan
Audit
Finding
Issue
Action / Remediation
Evidence
```

rather than a generic checklist page.

## Projects app

Diligent project dashboards expose:

- project phase/status;
- recent activity;
- My Tasks;
- project overview;
- planning;
- fieldwork;
- reports;
- reviews;
- issues;
- time/budget;
- requests.

### NuBlox conclusion

A domain workspace should show both **object state and assigned work** together, while work assignment remains a separate identity.

## Risk Manager

Risk Manager consolidates issues and records including:

- Control Assessment;
- Risk Assessment;
- Risk Mitigation;
- custom records;

with workflow statuses and due/progress information.

### NuBlox conclusion

Risk, Control, Assessment, Issue and Mitigation must remain distinct canonical concepts even if surfaced together.

## Audit trail

Diligent provides recent activity and item-level history, including changed-field before/after views.

### NuBlox conclusion

Object History must be a standard workspace section where the domain requires mutable records:

```text
who
when
command/action
changed fields / relationship changes
reason / decision where applicable
source
version
```

with immutable evidence and event provenance behind it.

## Rejected Diligent patterns

Do not adopt:

- app boundaries as NuBlox business boundaries;
- configurable custom records in place of governed domain concepts;
- governance dashboards that hide the underlying evidence/object chain.

---

# Oracle NetSuite

Official evidence:

- Centers Overview:  
  https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_N131898.html
- Standard Centers:  
  https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N132466.html
- Dashboards Overview:  
  https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_N576403.html
- center tabs:  
  https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N2890512.html
- Global Search:  
  https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_8124535945.html
- inline search editing:  
  https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N641270.html
- saved search as view:  
  https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N679407.html
- saved-search audience:  
  https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N678294.html
- Project 360:  
  https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_0517061639.html

## Role Centers

NetSuite dynamically presents a **Center** based on the user's role.

Standard centers include:

- Accounting;
- Classic;
- E-Commerce;
- Engineering;
- Executive;
- Marketing;
- Project;
- Sales;
- Shipping;
- Support;
- System Administrator.

A Center contains role-relevant tabbed pages and dashboards.

### NuBlox conclusion

This validates **role-persona curation** but also shows the danger of role-specific information architectures becoming separate mental models.

NuBlox should let roles influence:

- Home;
- default Operate/Deliver views;
- favourites;
- collections;
- available actions;

while preserving one common enterprise object/context model.

## Dashboards / portlets

NetSuite dashboards can appear throughout the role Center and are composed from portlets containing real-time data, lists and actions.

Users can personalize dashboards; administrators can publish dashboards.

### NuBlox conclusion

NuBlox should distinguish:

```text
Personal workspace preferences
Team / role workspace templates
Governed enterprise defaults
```

and avoid letting dashboard personalization alter business truth.

## Global Search

NetSuite Global Search finds records throughout account data and supports:

- record prefixes/types;
- auto suggest;
- custom fields;
- permission-aware results;
- help search;
- inline editing for eligible single-record-type result sets.

### NuBlox conclusion

Enterprise Search should eventually support direct **search-to-work**:

```text
find object
 -> open object
or
 -> operate on homogeneous result set
```

but only where bulk/inline actions are safe.

## Saved Searches as a platform primitive

NetSuite Saved Searches can be:

- private;
- public;
- audience-restricted by role/department/subsidiary/group;
- reused as list views;
- reused in dashboard list portlets;
- made default views;
- audited.

### NuBlox conclusion

This materially strengthens the design for **Saved View** as a durable user/team configuration object.

A NuBlox saved view should support:

- owner;
- target collection;
- query/filter;
- fields/columns;
- sort/group;
- context scope;
- audience/sharing;
- default/pinned status;
- usage/audit where appropriate.

## Project 360

NetSuite provides Project 360 through several role Centers rather than only Project Center.

### NuBlox conclusion

A canonical context/object should be reachable from multiple persona perspectives without acquiring multiple identities or duplicate screens.

## Rejected NetSuite patterns

Do not adopt:

- role Center as separate object architecture;
- portlet-heavy dashboards as the default working surface;
- inline edits from search results unless command invariants/permissions can be enforced safely.

---

# Unit4 ERP / ERPx

Official evidence:

- Unit4 ERP Workspaces:  
  https://info.unit4.com/U4D-WB-Workspaces_LP-On-Demand.html
- Unit4 ERP product-guide workspace material:  
  https://info.unit4.com/rs/400-HYB-295/images/unit4-erp-product-guide-area-fundamentals.pdf
- current 2026 project-management positioning:  
  https://www.unit4.com/blog/future-project-management-professional-services-firms
- ERPx Common API domain:  
  https://develop.unit4cloud.com/erpx/reference/common/
- Unit4 service descriptions:  
  https://www.unit4.com/service-descriptions

## Role/context workspaces

Unit4 describes Workspaces as role-based experiences exposing:

- KPIs/reports;
- workflow tasks;
- relevant navigation/actions;
- data based on system rights, role and personal requirements.

The documented workspace model can be driven by a **context value**, with examples including:

- project;
- customer;
- supplier;
- fund;
- employee;
- department.

A portfolio can list the context values for which the user has responsibility.

### NuBlox conclusion

This is one of the closest external patterns to the architecture we have converged on:

```text
Context Portfolio
 -> Context Workspace
    -> views / actions / objects
```

For NuBlox:

```text
Projects
 -> Project P-1048
Contracts
 -> Contract C-1042
Assets
 -> Asset AHU-144
Suppliers
 -> ABC Civils
```

with the same platform grammar.

## Project Workspace

Unit4's Project Workspace model provides a project-centric 360-degree overview with documented groupings such as:

- Overview;
- Planning;
- Billing;

and links to project, manager, customer, budgets/forecasts and invoices.

Current Unit4 professional-services positioning continues to emphasize ERPx Workspaces for real-time project performance, KPIs, overruns, resources and financial clarity.

### NuBlox conclusion

The Project Context should be able to combine:

- enterprise data;
- people/resources;
- operational delivery;
- project control;
- finance/commercial consequences;

without creating a monolithic Project aggregate.

## Platform configuration

Current Unit4 ERPx APIs expose common configuration concepts including:

- companies;
- chart/accounts;
- posting dimensions;
- attributes;
- structures;
- dashboards;
- KPIs;
- notifications;
- roles;
- portfolios;
- workflow definitions/limits/substitution;
- contextual action setups;
- document/archive/reference concepts.

### NuBlox conclusion

The business-configuration area will need coherent governance around enterprise structures and workflow rules, but the benchmark reinforces that configuration should be a reusable platform service rather than hard-coded function settings.

## Rejected Unit4 patterns

Do not adopt:

- project/customer/supplier workspace context as a substitute for canonical object identity;
- unrestricted configurable attributes;
- generic workflow configuration that can mutate domain state without owning commands;
- portfolio/dashboard presentation as the sole access path to business records.

---

# Cross-suite conclusions from Specialist Wave 5

## Pattern AL — object-centric and role/process-centric are complementary

Salesforce is strongly object-centric. Unit4 is strongly context/workspace-centric. NetSuite is role-centre-centric. Deltek is project-hub-centric. Diligent is governance-workspace-centric.

All can be reconciled by the NuBlox model:

```text
Role / My Work
 -> Context / Process / Function workspace
    -> Collection
       -> Canonical Object
          -> Action / relationship / evidence
```

### NuBlox decision

Do not choose only one of:

- role;
- process;
- function;
- context;
- object.

Use each at the layer where it answers a different user question.

## Pattern AM — split collection/object work is a core productivity pattern

Salesforce Console and Deltek List/Detail views both support rapid work across many records while retaining one active record.

### NuBlox decision

Add **Split Work Mode** as a standard composition:

```text
Collection View | Object Workspace
```

for appropriate high-throughput processes.

## Pattern AN — saved search/view is enterprise infrastructure

Salesforce, Deltek and NetSuite all provide durable saved working sets/views.

### NuBlox decision

Saved View is no longer optional UX polish. It is part of the core enterprise interaction foundation.

## Pattern AO — context persistence reduces navigation cost

Deltek preserves Project/WBS selection across project applications. Unit4 uses explicit context values. NetSuite Project 360 can be reached from multiple role centres.

### NuBlox decision

Context must persist where semantically valid across workspace transitions.

It must also be visible enough that a user cannot accidentally act under the wrong legal entity/project/contract context.

## Pattern AP — role personalization must not fragment enterprise truth

NetSuite Centers, Unit4 Workspaces and Salesforce Apps all curate navigation by role.

### NuBlox decision

Separate:

```text
what exists
what I can access
what is relevant to my role
what I have personally pinned
```

They are four different concerns.

## Pattern AQ — governance needs object/evidence depth, not only workflow

Diligent reinforces the importance of durable Audit, Finding, Risk, Control, Assessment, Issue and Action identities plus history.

### NuBlox decision

Operate the Business must be as object-centric and evidence-rich as Deliver the Business.

## Pattern AR — executive/management overview should be projection, not another truth

All five products expose dashboard/overview concepts.

### NuBlox decision

Management surfaces should derive from canonical facts and reproducible analytical positions, with drill-through to their source objects.

---

# First-pass benchmark convergence

Across the five experience waves, the external products now consistently support a NuBlox interaction hierarchy of:

```text
Tenant / Enterprise
        |
Role + My Work
        |
Enterprise Context
        |
Operate / Deliver / Enterprise Data
        |
Process / Function / Context Workspace
        |
Collection / Structure / Grid / Map
        |
Canonical Object
        |
Action / Decision / Change / Evidence
        |
History / Events / Audit
```

No benchmark establishes that users should navigate a sophisticated enterprise solely through departmental/function pages.

No benchmark establishes that every object should be shown in one universal generic form.

The strongest systems combine multiple interaction modes over a stable underlying record model.

---

# Experience benchmark next gate

The first cross-suite experience challenge is now broad enough to consolidate.

The next governing artefact should be the:

> **NuBlox Enterprise Interaction Architecture**

It must turn the cross-suite evidence into:

1. final product-level information architecture;
2. shell/context/navigation contract;
3. workspace/collection/object interaction grammar;
4. Enterprise Data model in the UX;
5. high-volume entry/import contract;
6. Product/Structure/Viewer/Spatial patterns;
7. My Work/Task Bar model;
8. Business Configuration/Admin separation;
9. responsive/mobile/field principles;
10. implementation waves and acceptance gates.

Detailed menu inventories can continue as evidence refinement, but they should no longer block establishing the platform interaction foundation.
