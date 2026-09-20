# Competitive Experience Benchmark — Enterprise UX Wave 1A

**Status:** detailed first pass complete; benchmark rows remain **in progress** until domain-menu inventory is closed  
**Date:** 19 September 2026  
**Products:** SAP S/4HANA Cloud / Fiori; Oracle Fusion Cloud Applications; Microsoft Dynamics 365 Finance & Operations

## Purpose

This review moves beyond capability parity and inspects the actual enterprise interaction model: what appears in global navigation, how role/context is expressed, how users reach work, how lists/records behave, how high-volume data is entered and how configuration is separated from normal work.

The review intentionally does **not** copy vendor module boundaries into NuBlox.

---

# SAP S/4HANA Cloud / Fiori

## Current interaction model reviewed

Current SAP S/4HANA Cloud Public Edition documentation (2608/latest documentation available in September 2026) presents an experience built around:

```text
Business Role
   -> Spaces
      -> Pages
         -> Apps
```

with a personalized **My Home**, launchpad search, App Finder, notifications/to-dos and role-derived access.

Official evidence:

- SAP Fiori navigation bar / spaces:  
  https://help.sap.com/docs/SAP_S4HANA_CLOUD/4fc8d03390c342da8a60f8ee387bca1a/8d8f9733fe634e6ba4970b36eaa8219a.html
- App Finder:  
  https://help.sap.com/docs/btp/sap-fiori-launchpad-for-sap-btp/48a5dbb0308b47d8969485845d5966ae.html
- Current S/4HANA Cloud role/space examples:  
  https://help.sap.com/docs/s4hana-cloud-best-practices/accounting-and-financial-close-group-ledger-us-gaap-2va-sk/roles
- My Home app section:  
  https://help.sap.com/docs/SAP_S4HANA_CLOUD/4fc8d03390c342da8a60f8ee387bca1a/f3fb03713b4748c69f7bc3ca708da97c.html
- My Inbox example:  
  https://help.sap.com/docs/SAP_S4HANA_CLOUD/0bebd08dffca45afa67b1f751199afd0/b85ea08ac1204c0c97eef6c9d5ee71e3.html

## Menu / navigation inventory

| SAP surface | Purpose | NuBlox challenge |
| --- | --- | --- |
| My Home | personalized entry page | Home must be role/work driven |
| To-Dos / My Inbox | tasks and approvals | My Work must aggregate actionable work |
| News | business/enterprise announcements | optional enterprise communication surface |
| Pages | curated role pages | Operate/Deliver/persona pages need curation |
| Apps — Favorites | personally important apps | favourites required |
| Apps — Recently Used | resume recent work | recent objects/workspaces required |
| Apps — Most Used | usage-driven access | potentially useful but secondary |
| Insights Tiles / Cards | lightweight operational insight | landing pages should contain actionable insight, not architecture metrics |
| Navigation bar | role-assigned spaces | stable top-level enterprise navigation |
| Spaces | broad role/domain grouping | analogous to NuBlox enterprise perspectives, not aggregates |
| Pages | subdivisions of a space | contextual/task pages |
| App Finder | discover all permitted applications | NuBlox needs discoverability beyond pinned menu |
| Launchpad search | find apps and business-object search models | enterprise search required |
| Notifications | business-task/request awareness | attention layer required |
| User actions | profile/personalization/settings | common shell utility |
| Business Process Configuration spaces | business configuration | must not be mixed with ordinary data entry |
| Administration spaces | platform administration | separate technical administration |

## Role packaging

SAP explicitly assigns spaces/pages through business roles. Examples in current documentation include:

- General Ledger Accountant -> General Ledger;
- Production Planner -> Production Planning;
- Inventory Manager -> Inventory Management;
- Customer Service Manager -> Service Management;
- Master Data Specialist -> master-data spaces;
- Configuration Expert -> Business Process Configuration;
- Administrator -> Administration.

### NuBlox conclusion

Do not show every enterprise capability equally to every user merely because it exists.

NuBlox should derive default navigation/landing content from:

- role;
- responsibility;
- authority;
- enterprise context;
- recent/favourite work;

without making role assignment itself a permission shortcut.

## Search / discovery

SAP Enterprise Search can search business-object-specific models and navigate from results into the relevant processing app. App Finder separately discovers available apps.

### NuBlox conclusion

Keep two distinct concepts:

1. **command/navigation search** — where can I go?
2. **enterprise object search** — what business object am I looking for?

They may share one visual entry field later, but must resolve different result types cleanly.

## My Home / productivity

SAP My Home demonstrates a useful separation:

- work requiring attention;
- business/news context;
- curated pages;
- favourite/recent/most-used apps;
- insights.

### NuBlox adoption

NuBlox Home should become an operational cockpit, while **My Work** remains the durable task/approval/exception queue.

## Rejected SAP patterns

Do not adopt:

- app-per-task fragmentation as the NuBlox object model;
- SAP-specific transaction/app IDs as information architecture;
- vendor module boundaries as aggregate boundaries;
- role assignment as equivalent to delegated business authority.

---

# Oracle Fusion Cloud Applications

## Current interaction model reviewed

Oracle's newer Redwood-oriented **Home with Ask Oracle** changes global navigation from a classic launcher into a search/suggestion/product-map model.

Official evidence:

- Home with Ask Oracle:  
  https://docs.oracle.com/en/cloud/saas/readiness/common/25d/common25d/25D-common-wn-f39872.htm
- Common features:  
  https://docs.oracle.com/en/cloud/saas/applications-common/25c/oacpr/using-common-features.pdf
- Functional Setup Manager:  
  https://docs.oracle.com/cd/G17387_01/trans/G12422-01/using-functional-setup-manager.pdf
- Assigned setup tasks:  
  https://docs.oracle.com/en/cloud/saas/applications-common/25d/oafsm/enter-setup-data-using-assigned-tasks.html
- Financials implementation functional areas:  
  https://docs.oracle.com/en/cloud/saas/financials/25d/faiac/overview-of-implementing-financials.html
- Reports and Analytics:  
  https://docs.oracle.com/en/cloud/saas/applications-common/26b/faacc/creating-and-administering-analytics-and-reports.pdf

## Global navigation inventory

| Oracle surface | Purpose | NuBlox challenge |
| --- | --- | --- |
| Home with Ask Oracle | search/navigation home | search can be the primary accelerator |
| Search | type-ahead task/app/information discovery | natural-language/synonym navigation may be valuable |
| Product Map | discover accessible functional groups | discoverability of full enterprise capability |
| Functional Groups | broad product/capability grouping | comparable to NuBlox perspectives/functions |
| Work Areas | operational working areas | comparable to NuBlox workspaces/context views |
| Tasks | specific executable activity | actions/process steps rather than permanent object identity |
| Suggestions | frequent/recent destinations | adaptive recents can reduce navigation |
| Favorites and Recent Items | persistent personal shortcuts | NuBlox saved/favourite/recent model required |
| Watchlist | attention/exception awareness | useful for operational threshold/exception monitoring |
| Reports and Analytics | reporting/search/catalog | reports are a distinct artefact class |
| My Enterprise | enterprise-level implementation/configuration | separate enterprise setup surface |
| Offerings | enabled product capabilities | NuBlox does not need product-offering packaging internally |
| New Features | release uptake | potentially relevant to tenant change management |
| Feature Updates | change uptake | technical/business admin concern |
| Enterprise | environment/enterprise settings | tenant/enterprise configuration |
| Setup and Maintenance | functional configuration | business configuration area |
| Assigned Implementation Tasks | setup work queue | setup/change work itself can be assigned/governed |

## Product map hierarchy

Oracle documents:

```text
Product Map
  -> Functional Group
     -> Work Areas / Tasks
```

This is useful because it separates **discovering enterprise capability** from the user's daily shortcuts.

### NuBlox conclusion

The 29 functions can remain available as a full capability directory while the everyday shell prioritizes:

- My Work;
- Operate;
- Deliver;
- Enterprise Data;
- contexts;
- recent/favourite objects.

That resolves the apparent conflict between governed F01-F29 coverage and user-friendly navigation.

## Setup and Maintenance

Oracle's Functional Setup Manager provides a particularly important pattern:

```text
Offering
  -> Functional Area
     -> Setup Task
        -> Scope
           -> Setup Data
```

Tasks can have dependencies, status and notes.

### NuBlox conclusion

**Business Configuration** should be treated as governed work rather than scattered settings pages.

Examples:

- configure payment terms;
- configure lifecycle;
- configure numbering;
- configure project calendar;
- configure workflow;
- configure approval thresholds;
- configure tax/reference rules.

Configuration changes should be scope-aware and auditable.

## Reports / Analytics

Oracle separates reports/analyses from normal transactional work and supports:

- search/filter;
- favourites;
- recent items;
- saved searches;
- folders/catalog;
- creation/edit of report artefacts.

### NuBlox conclusion

Do not make every analytical need another operational dashboard card. NuBlox needs distinct:

- operational list/view;
- analytical projection;
- formal report;
- published snapshot.

## Rejected Oracle patterns

Do not adopt:

- Oracle offering/product packaging as NuBlox architecture;
- setup complexity solely because Oracle exposes it;
- task names as canonical object identities;
- classic/product-specific navigation inconsistencies as a NuBlox pattern.

---

# Microsoft Dynamics 365 Finance & Operations

## Current interaction model reviewed

Microsoft's Finance & Operations navigation model is explicitly documented around:

```text
Dashboard / Initial Page
  + Navigation Pane
      -> Favorites
      -> Recent
      -> Workspaces
      -> Modules
  + Navigation Search
```

Official evidence:

- Navigation concepts:  
  https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/user-interface/page-navigation
- Default dashboard:  
  https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/fin-ops/get-started/default-dashboard
- Saved views:  
  https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/get-started/saved-views
- Personalization:  
  https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/get-started/personalize-user-experience
- Grid capabilities:  
  https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/get-started/grid-capabilities
- Filtering:  
  https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/user-interface/filtering
- Excel add-in:  
  https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/fin-ops/mobile-apps/use-excel-add-in
- Company context:  
  https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/fin-ops/data-entities/company-data

## Menu / navigation inventory

| Dynamics surface | Purpose | NuBlox challenge |
| --- | --- | --- |
| Default Dashboard | initial operational/navigation hub | Home should expose useful enterprise context |
| Current legal entity in header | explicit company context | NuBlox legal-entity context must be visible |
| Apps | related product access | NuBlox should avoid feeling like separate products |
| Workspaces | activity-oriented role pages | strong pattern for Operate/Deliver workspaces |
| Assigned Workflow Items | tasks on landing page | integrate My Work summary |
| Home | return to initial page | expected shell primitive |
| Favorites | user-pinned pages | favourites required |
| Recent | recent pages | recents required |
| Workspaces | role/activity access | operational working perspectives |
| Modules | exhaustive module directory | comparable to F01-F29 full function directory |
| Navigation Search | find pages/workspaces | command navigation search |
| User Options | personalization/preferences | common shell settings |
| Saved Views | named task-specific page states | one of the strongest NuBlox patterns |
| Personalization | add/hide/reorder fields/sections | governed user tailoring |
| Grid / Filter controls | high-volume operational work | major platform requirement |
| Open in Excel | live entity editing | strong high-volume/master-data pattern |
| Export to Excel | one-time extraction | separate from live edit |
| Data Management | staged import/export | governed import architecture |

## Legal-entity context

Microsoft states that Finance & Operations users work in a **single company context**, and most company data is striped by company.

The default dashboard header presents the current legal entity.

### NuBlox conclusion

NuBlox requires persistent context awareness, but should be more flexible than a single mandatory company dimension because built-environment work commonly combines:

- legal entity;
- organisation unit;
- project;
- contract;
- site;
- asset.

The shell should make the active context understandable without pretending all objects are scoped identically.

## Workspaces

Microsoft defines workspaces as **activity-oriented pages** answering a target user's pressing operational questions and allowing frequent tasks.

### NuBlox adoption

This is very close to what NuBlox function/process workspaces should become:

- attention counts;
- filtered lists;
- frequent actions;
- key insight;
- links to durable canonical objects.

A workspace is **not** the object itself.

## Saved views

Dynamics Saved Views combine:

- personalizations;
- filters;
- sorting;
- grouping;
- named views;
- sharing/publishing by role/legal entity;
- exposure inside workspaces.

### NuBlox adoption

This should become a first-class shared platform object.

A NuBlox saved view should eventually retain:

- target collection;
- context;
- filters;
- sorting;
- grouping;
- columns;
- density;
- optional sharing scope.

## High-volume grid

Dynamics currently supports:

- calculated numeric values;
- typing ahead;
- math expressions;
- grouping;
- multiple group levels;
- frozen/autofit/stretch columns;
- bulk editing selected rows;
- paste from Excel;
- cell-range selection/copy;
- filtering and advanced filtering;
- validation on save.

This is materially stronger than the current NuBlox form-heavy pattern.

### NuBlox requirement

A **NuBlox Enterprise Grid** should be an explicit platform deliverable before deep estimating, BOQ, schedule, asset-register, cost-code, rate or product-data runtime expansion.

Minimum target:

```text
keyboard navigation
range selection
copy/paste
multi-row creation
bulk edit
fill/down patterns
row/cell validation
unsaved-state indication
filter
sort
group
freeze
resize
saved views
export
import/staging link
```

## Excel / external high-volume work

Dynamics differentiates:

- **Open in Excel** — connected entity data can be refreshed/edited/published;
- **Export to Excel** — static extraction;
- Data Management Framework — staged bulk import/export.

### NuBlox conclusion

NuBlox should distinguish:

```text
Export view
vs
Bulk editing
vs
Import job
vs
Integration feed
```

They are not the same operation.

## Rejected Dynamics patterns

Do not adopt:

- Dynamics module boundaries as NuBlox aggregates;
- exposing technical form structure to users;
- forcing a universal single-company scope where a business object has legitimate cross-entity/project context;
- Excel as the canonical datastore.

---

# Cross-suite conclusions from Wave 1A

These three systems use different terminology but converge strongly.

## Pattern A — two-speed navigation

Users need:

**fast/relevant**
- role home;
- My Work;
- favourites;
- recent;
- search;
- workspaces;

and

**complete/discoverable**
- product map;
- module/function directory;
- app finder.

### NuBlox decision

Do not force F01-F29 to choose between being **architecturally complete** and **usable**.

Keep both:

```text
Everyday:
My Work / Operate / Deliver / Enterprise Data / Context / Search

Complete capability:
Functions F01-F29
```

## Pattern B — workspace != object

All three suites use landing/work-area/workspace concepts to organize activity.

### NuBlox decision

A workspace is a perspective over work and objects.

A canonical object keeps a stable identity and object workspace independent of the function/process that led to it.

## Pattern C — configuration is governed enterprise work

SAP role-specific business configuration and Oracle Setup and Maintenance both show that configuration is not merely developer administration.

### NuBlox decision

Establish:

```text
Enterprise Data
Business Configuration
Technical Administration
```

as separate concerns.

## Pattern D — high-volume entry is a platform concern

Dynamics provides especially strong evidence that mature ERP users require grids, bulk edit, Excel interoperability and staged data management.

### NuBlox decision

The Experience System must define both:

- **Object Form** for deliberate record work;
- **Enterprise Grid** for high-volume structured data work.

## Pattern E — context must be persistent

Dynamics legal entity is persistent; SAP role/space is persistent; Oracle scopes setup tasks and groups work areas.

### NuBlox decision

Build an enterprise context spine that can represent the dimensions relevant to the current object/process without conflating them.

## Provisional shell target

This wave strengthens the following target:

```text
NuBlox

Home / My Work

Operate
Deliver
Enterprise Data

Contexts / Recents / Favourites
Search

Functions
  F01-F29

Business Configuration
Administration
```

This remains a **design hypothesis**, not yet the final information architecture. Construction and PLM waves must challenge it before implementation freeze.

## Next benchmark work

Wave 1A is not the end of the enterprise-suite review. Remaining work includes:

- SAP domain-space/menu inventory;
- Oracle functional-group/work-area inventory;
- Dynamics module/workspace inventory;
- IFS;
- Infor;
- Workday;
- ServiceNow.

The construction wave must then test whether the enterprise shell remains coherent when Project/Contract/Site are the dominant day-to-day contexts.
