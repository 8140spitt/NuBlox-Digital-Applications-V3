# Competitive Experience Benchmark — Enterprise UX Wave 1B

**Status:** detailed first pass complete; benchmark rows remain **in progress** until domain-menu inventory is closed  
**Date:** 19 September 2026  
**Products:** IFS Cloud; Infor OS / CloudSuite; Workday; ServiceNow AI Platform

## Purpose

Wave 1B challenges the NuBlox enterprise experience against four different interaction philosophies:

- IFS — ERP/EAM/service operations with navigator + role/process lobbies;
- Infor — common portal over multiple ERP applications with workspaces/widgets/context;
- Workday — task/search/person-centred cloud enterprise UX;
- ServiceNow — unified navigation + workspaces + reusable list/record patterns.

This review focuses on the user-facing enterprise shell, work surfaces, object/list patterns, search, context, personalization and administration boundaries. It does not copy vendor module boundaries into NuBlox.

---

# IFS Cloud

## Current interaction model reviewed

IFS Cloud Web provides a persistent shell with:

```text
Top Bar
  -> navigation
  -> search
  -> recent screens
  -> user settings
  -> help

Navigator
  -> pages
  -> sub-levels
  -> record selectors
  -> lobbies

Breadcrumbs
Search Panel
Page / Assistant
Lobby
```

Official evidence:

- IFS Cloud Web UI overview:  
  https://docs.ifs.com/techdocs/26r1/060_development/022_user_interface/030_aurena_dev/010_aurena_overview/
- Lobby Page:  
  https://docs.ifs.com/ifsclouddocs/26r1/lang/en/UserGuide/AboutLobbyPage.htm
- Lobby elements:  
  https://docs.ifs.com/ifsclouddocs/26r1/lang/en/UserGuide/ActivityUsingLobbyElements.htm
- Navigator configuration:  
  https://docs.ifs.com/techdocs/26r1/040_tailoring/225_configuration/250_navigator_configurations/
- Page Help:  
  https://docs.ifs.com/ifsclouddocs/25r2/UserGuide/ActivityPageHelp.htm

## Navigation / workspace inventory

| IFS surface | Purpose | NuBlox challenge |
| --- | --- | --- |
| Top Bar | stable global navigation and utilities | shell must remain stable across domains |
| Navigator | hierarchical access to pages, sub-pages and records | NuBlox needs full capability navigation without forcing it as daily IA |
| Recent screens | resume recent work | recent objects/workspaces required |
| Search Panel | field and advanced page search | context/list search required |
| Breadcrumbs | orientation when navigator is hidden | object/process/context breadcrumb required |
| Page | detailed operational page | comparable to object/list/action surfaces |
| Assistant | guided multi-step interaction | useful for complex creation/configuration journeys |
| My Lobbies | assigned lobby hub | role/process cockpit concept |
| Lobby | operational overview | strong model for Operate/Deliver/function workspaces |
| Lobby counters | exception/volume awareness | attention indicators |
| Lobby lists | actionable record subsets | workspace should lead into canonical objects |
| Lobby graphs/gauges | concise operational insight | analytics should support action |
| Lobby links | shortcuts to pages/lobbies/external resources | curated process navigation |
| Page Parameters | contextual filtering | reusable context propagation |
| Help Panel / Page Help | page-specific guidance | contextual help is a platform primitive |
| Navigator Designer | configurable navigation | tenant/persona navigation can be governed |

IFS explicitly describes a Lobby as a bridge between IFS pages, data sources and Lobby Elements. Elements can be counters, lists, graphs and links and can navigate into operational pages.

### NuBlox conclusion

This is strong evidence for a distinction between:

```text
Workspace / cockpit
    -> shows attention + insight + filtered work
    -> routes to durable objects

Object workspace
    -> owns the record experience
```

Operate and Deliver should therefore use lobby-like operational surfaces without duplicating domain state.

## Navigator as record selector

IFS documents that its Navigator can also behave as a record selector.

### NuBlox conclusion

NuBlox should support fast movement among peer objects without returning to a directory page every time. This can be achieved through:

- split list/object views;
- object-switcher controls where appropriate;
- Task Bar contexts;
- recent/favourite objects.

It should not make the full enterprise hierarchy a permanent giant tree.

## Responsive / device model

IFS Cloud Web is designed for desktop, laptop, tablet and mobile through a responsive component framework.

### NuBlox conclusion

Shared components must have deliberate responsive behaviours. Field/mobile experiences may need specialist page composition, but should retain the same canonical object identity.

## Rejected IFS patterns

Do not adopt:

- IFS page metadata as NuBlox business semantics;
- a universal hierarchical navigator for every task;
- lobby elements as an excuse for dashboard-card proliferation;
- vendor page names as aggregate boundaries.

---

# Infor OS / CloudSuite

## Current interaction model reviewed

Infor OS Portal is a common UI framework across integrated Infor ERP applications.

Current official documentation describes:

```text
Navigation Bar
  -> Home
  -> Navigation Menu
  -> Multiple Tabs
  -> User/Profile

Main Area
  -> Application
  -> Workspace

Smart Panel
  -> Insights
  -> Inbox
  -> Smart Help
  -> contextual widgets

Workspaces
  -> application shortcuts
  -> widgets
  -> role/process content
```

Official evidence:

- Infor OS Portal overview:  
  https://docs.infor.com/inforos/latest/en-us/useradminlib_cloud/inforospug/cover.html
- Portal anatomy:  
  https://docs.infor.com/inforos/latest/en-us/useradminlib_cloud/inforospug/qmb1624566239249.html
- Workspaces/navigation:  
  https://docs.infor.com/depm/2025.x/en-us/depmolh_cloud/workspaces_in_infor_os_portal/rst1635171630440.html
- Example role-based workspace configuration:  
  https://docs.infor.com/ghrtm/2026.x/en-us/ghrtmolh/ghrtmghrug/ubb9457779240568.html
- Example operational workspace:  
  https://docs.infor.com/m3csfsh/latest/en-us/csfshlib/industry_content_fashion/gnz1761804688880.html

## Navigation / workspace inventory

| Infor surface | Purpose | NuBlox challenge |
| --- | --- | --- |
| Home | portal entry | one enterprise entry point |
| Navigation menu | access integrated applications/workspaces | complete capability discovery |
| Multiple tabs | retain concurrent working contexts | validates Task Bar / tabbed work |
| Main area | hosts app or workspace | common shell over different capabilities |
| Smart Panel | contextual side surface | contextual tools should follow the current object/workspace |
| Insights | in-context information | related insight without changing identity |
| Inbox | task/work awareness | universal My Work integration |
| Smart Help | contextual guidance | in-product help |
| Workspaces | shortcuts + relevant widgets | role/process operational cockpit |
| Widgets | small single-purpose information/action surfaces | reusable platform primitives |
| Context widgets | react to current business context | context propagation across tools |
| Workspace catalog | reusable workspace discovery | governed workspace templates |
| Role-based workspaces | persona-oriented default experience | role/persona navigation |
| Content Catalog | add-ons / packaged content | NuBlox should govern extensions separately |

Infor workspaces are explicitly designed to increase productivity by combining application shortcuts and relevant widgets. Current HR examples show workspace ordering and access by role.

### NuBlox conclusion

A workspace can be assembled from reusable, context-aware components while remaining within one stable application shell.

This supports an architecture such as:

```text
Operate workspace
Deliver workspace
Project workspace
Commercial workspace
Finance workspace

all composed from shared:
  attention
  lists
  insight
  process links
  object links
```

without each workspace inventing its own UI system.

## Context propagation

Infor's Smart Panel/context widgets respond to the current application/business context.

### NuBlox conclusion

NuBlox should define a formal **UI Context Contract** so shared panels can know, where permitted:

- current tenant;
- legal entity;
- organisation unit;
- project/programme;
- contract;
- site/asset;
- canonical object;
- originating function/process.

This contract should pass identity/context, not duplicate domain state.

## Multiple tabs

Infor OS explicitly supports multiple tabs in the portal.

### NuBlox conclusion

The existing NuBlox Task Bar is strategically important. It should evolve into controlled concurrent working contexts rather than forcing browser-tab chaos.

## Rejected Infor patterns

Do not adopt:

- separate integrated-product identities visible throughout NuBlox;
- widget proliferation without a coherent object/process hierarchy;
- context widgets as hidden cross-domain write mechanisms;
- portal packaging as canonical architecture.

---

# Workday

## Current interaction model reviewed

Workday's current experience centres on a personalized Home, global navigation/search and My Tasks.

Current official documentation describes Home as a curated entry point with:

- Announcements;
- Awaiting Your Action;
- Important Dates;
- Quick Actions;
- Recommended For You;
- Team Highlights;
- Timely Suggestions;
- Work Tools;
- configurable/custom cards.

Search can return categories such as People, Tasks and Reports, Learning and Articles.

Official evidence:

- Workday Home and Search:  
  https://doc.workday.com/admin-guide/en-us/manage-workday/user-experience/people-experience/home-page/epj1594676779332.html
- Home sections:  
  https://doc.workday.com/admin-guide/en-us/manage-workday/user-experience/people-experience/home-page/rfo1603917895028.html
- Core Concepts and Navigation:  
  https://doc.workday.com/workday-education/en-us/course-manuals/student-for-administrators/core-concepts-and-navigation.html
- Core Navigation:  
  https://doc.workday.com/admin-guide/en-us/manage-workday/tenant-configuration/navigation/pvx1548458610979.html
- Enterprise Search:  
  https://doc.workday.com/admin-guide/en-us/manage-workday/user-experience/people-experience/home-page/concept--enterprise-search.html

## Navigation / work inventory

| Workday surface | Purpose | NuBlox challenge |
| --- | --- | --- |
| Home | personalized role/security-aware landing | Home should be curated and operational |
| Global Navigation Menu | tasks, reports and applications | complete capability access |
| Search | people/tasks/reports/business information | enterprise search |
| Notifications | completed processes/reports/document availability | distinguish notification from actionable work |
| My Tasks | actionable business-process items | My Work |
| All Items | current work stream | operational queue |
| Saved Searches | reusable work/task retrieval | saved views/searches |
| Filters | user-defined task filters | flexible queue views |
| Archive | recent business-process history | work history |
| Favorites | favourite tasks/reports/business objects | favourite objects/actions |
| Workbench | administrator/technical maintenance landing | separate technical administration |
| Sitemap | discover available tasks/reports | complete-capability directory |
| Audit | audit reports/tasks | audit access separate from ordinary transaction pages |
| Quick Actions | frequent task entry | role-based command shortcuts |
| Recommended / Timely Suggestions | contextual/adaptive prompts | useful if transparent and secondary |
| Awaiting Your Action | top attention items | Home summary of My Work |
| Bulk Approvals | approve multiple eligible items | controlled batch decision UX |

## My Tasks

Workday's My Tasks has:

- All Items;
- Saved Searches;
- Filters;
- Archive;
- favourites;
- overdue;
- delegated-to-me filtering;
- sorting;
- bulk approvals when eligible.

### NuBlox conclusion

My Work should mature from a queue into a genuine enterprise work surface with:

- saved filters/views;
- overdue/urgent/delegated perspectives;
- grouping by context/object/process;
- batch action only where the underlying authority/invariant permits it;
- completed/recent work history.

Bulk approval must never bypass independent authority checks on each subject.

## Search

Workday Search supports tasks, reports, people/business objects and type-ahead/predictive results; results remain security-aware.

### NuBlox conclusion

NuBlox enterprise search should combine result types but make them visibly distinct:

```text
Objects
People
Tasks
Reports
Functions / destinations
Help / knowledge
```

Authorization must be applied before protected result detail is disclosed.

## Home vs Workbench

Workday explicitly distinguishes the normal user Home from Workbench for administrators/technical users.

### NuBlox conclusion

This reinforces the separation:

```text
Enterprise Data
Business Configuration
Technical Administration
```

rather than one Administration dumping ground.

## Rejected Workday patterns

Do not adopt:

- HR-centric terminology as universal enterprise IA;
- recommendation algorithms as primary navigation;
- business-process tasks as replacements for canonical domain objects;
- bulk approval without subject-level authority/invariant evaluation.

---

# ServiceNow AI Platform

## Current interaction model reviewed

ServiceNow's current **Next Experience Unified Navigation** provides one global shell across classic applications and configurable workspaces.

Official documentation describes:

```text
Unified Navigation
  -> Logo / landing
  -> Filter
  -> All
  -> Favorites
  -> History
  -> Workspaces
  -> Admin
  -> Contextual app pill
  -> Global Search
  -> Notifications
  -> User preferences
```

Official evidence:

- Unified Navigation — Australia release:  
  https://www.servicenow.com/docs/r/platform-user-interface/using-the-next-experience-global-header.html
- Next Experience overview:  
  https://www.servicenow.com/docs/r/platform-user-interface/next-experience-ui.html
- Configurable Workspace lists:  
  https://www.servicenow.com/docs/r/platform-user-interface/lists-configurable-workspace.html
- Configurable Workspace forms:  
  https://www.servicenow.com/docs/r/platform-user-interface/form-configurable-workspace.html
- Configurable Workspace administration:  
  https://www.servicenow.com/docs/r/platform-user-interface/administering-configurable-workspace.html

## Global navigation inventory

| ServiceNow surface | Purpose | NuBlox challenge |
| --- | --- | --- |
| Landing page | role/task start | operational Home |
| Filter | fast module navigation | command/navigation search |
| All menu | exhaustive applications/modules | full function/capability directory |
| Favorites | user shortcuts | favourites |
| History | recently visited items | recents/history |
| Workspaces | persona/task work surfaces | Operate/Deliver/role workspaces |
| Admin | administration access | separate technical administration |
| Contextual app pill | current application context | explicit context/orientation |
| Global Search | instance-wide search | enterprise search |
| Notifications | attention | notification layer |
| Custom menus | audience-tailored navigation | governed role/persona menu |
| Keyboard shortcuts | rapid navigation | power-user accessibility/productivity |

ServiceNow states that availability of navigation items depends on user access and administrator customization.

### NuBlox conclusion

The global shell should be permission-aware and configurable, but hiding a menu item must not itself be the security control.

## Landing pages

Next Experience landing pages are intended to show role/task-specific information such as lists, analytics and prioritized tasks.

### NuBlox conclusion

NuBlox Home and stream workspaces should do the same: summarize and launch work, not become duplicate domain databases.

## Lists

ServiceNow's Configurable Workspace list page provides:

- contextual list header;
- record list;
- default lists;
- user-created saved lists;
- condition/predicate filtering.

Lists are designed to help agents quickly find and manage records.

### NuBlox conclusion

The NuBlox **Collection View** should be a reusable platform primitive with:

- default governed views;
- personal saved views;
- team/shared views where authorised;
- filters;
- columns;
- sort/group;
- bulk selection/actions;
- deep links into canonical objects.

## Forms / record pages

ServiceNow defines a form as the detail/edit surface for a single record. Standard workspace record pages can combine the form with related lists in tabs. Workspace forms also support unsaved-change warnings.

### NuBlox conclusion

This strongly supports the object-centric grammar:

```text
Object Header
Details / form
Related objects
Work
Decisions
Evidence
History
```

with an explicit dirty-state/draft model.

## Workspaces

ServiceNow Configurable Workspaces are persona/task-oriented experiences built from reusable page/list/form/action components.

### NuBlox conclusion

NuBlox should similarly standardize:

- Workspace Shell;
- Collection View;
- Object Workspace;
- Action/command framework;
- Related-list component;
- activity/history stream;
- side/context panels.

F01-F29 implementations should compose these primitives rather than inventing page architecture locally.

## Rejected ServiceNow patterns

Do not adopt:

- generic table/record semantics as a substitute for canonical business semantics;
- application/module proliferation as NuBlox IA;
- customizable forms that bypass governed canonical invariants;
- workflow/case state becoming the owner of domain state.

---

# Cross-suite conclusions from Wave 1B

## Pattern F — a stable shell can host different operating modes

IFS, Infor and ServiceNow all demonstrate a stable shell over pages/workspaces; Workday uses consistent Home/global navigation/task/search surfaces.

### NuBlox decision

The NuBlox shell should remain stable while users move between:

- Operate;
- Deliver;
- Enterprise Data;
- functions;
- context workspaces;
- canonical objects;
- configuration/admin.

The user should not feel they have opened another product.

## Pattern G — context-aware side surfaces are useful

Infor Smart Panel and ServiceNow contextual navigation demonstrate the value of secondary contextual surfaces.

### NuBlox decision

Reserve a **Context/Utility Panel** pattern for relevant secondary information such as:

- related work;
- help;
- object relationships;
- notifications;
- collaboration;
- provenance;

without crowding the primary object page.

## Pattern H — workspaces are compositions, not business truth

IFS Lobbies, Infor Workspaces and ServiceNow Workspaces all aggregate information/actions from other records and services.

### NuBlox decision

Formalize this rule:

> A workspace may aggregate and initiate work, but durable domain truth remains in canonical objects/aggregates.

## Pattern I — My Work needs saved views, history and delegation awareness

Workday provides especially clear evidence here.

### NuBlox decision

Extend My Work to support:

- default perspectives;
- saved views;
- urgent / overdue;
- delegated work;
- context grouping;
- completed/recent history;
- governed batch actions.

## Pattern J — concurrent working contexts are normal

Infor multi-tab work and ServiceNow workspaces validate the need to retain multiple records/tasks without losing context.

### NuBlox decision

Continue evolving Task Bar rather than reverting to one-page-at-a-time navigation.

## Pattern K — technical administration should visibly separate from normal enterprise work

Workday Workbench, ServiceNow Admin, and vendor configuration surfaces reinforce this.

### NuBlox decision

The emerging top-level separation remains:

```text
Enterprise Data
Business Configuration
Technical Administration
```

## Updated provisional shell hypothesis

After Wave 1A + 1B:

```text
NuBlox

Home
My Work

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
Recent
Favourites

Functions
  F01-F29

Business Configuration
Administration
```

This is still not frozen. Construction-platform benchmarking must now test whether Project/Contract/Site should be stronger global context controls rather than merely destinations.

## Platform primitives now strongly supported by cross-vendor evidence

The enterprise-suite review justifies designing the following NuBlox platform primitives before broad F07+ screen expansion:

1. Enterprise Context Contract;
2. Enterprise Search;
3. Saved View / Favourite / Recent model;
4. Collection View;
5. Enterprise Grid;
6. Object Workspace;
7. Workspace/Cockpit composition;
8. Context/Utility Panel;
9. My Work saved views and history;
10. Task Bar object-context model;
11. Business Configuration workspace;
12. Technical Administration workspace;
13. contextual help;
14. consistent denied/not-found/conflict handling.

## Next benchmark wave

The next review should pressure-test this enterprise model against project-delivery products:

- Oracle Construction & Engineering / Aconex;
- Procore;
- Autodesk Construction Cloud;
- Trimble Construction One / ProjectSight;
- Sage Construction;
- Causeway;
- Thinkproject / CEMAR;
- Asite;
- Hexagon EcoSys.

The central question is:

> Does the shell still make sense when a Project, Contract or Site is the user's dominant day-to-day operating context?
