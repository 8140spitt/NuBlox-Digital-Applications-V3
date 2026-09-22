# PTC Windchill Help Center — Deep Capability & Relationship Register

**Status:** Active evidence register — research in progress  
**Primary source:** PTC Windchill Cloud 12.0.2.0 Help Center  
**Started:** 22 September 2026  
**Purpose:** Reverse-engineer Windchill as a graph of canonical objects, relationships, contexts, participation, inheritance, lifecycle, workflow, access, configuration and evidence before translating any concept into NuBlox architecture.

> This is reference evidence, not NuBlox architecture. A Windchill fact is not automatically a NuBlox design decision.

## Evidence states

- **VERIFIED** — directly supported by PTC Help Center evidence.
- **PROVISIONAL** — supported, but exact scope/variant/version still needs deeper verification.
- **HYPOTHESIS** — possible NuBlox interpretation; not a PTC fact.
- **GAP** — unresolved question requiring further traversal.

## Research rule

For every capability/object, determine:

1. **NODE** — what is the canonical thing?
2. **RELATIONSHIP** — what is it connected to?
3. **CONTEXT** — where can it exist?
4. **OWNER** — who administers/owns it?
5. **PARTICIPATION** — which teams/roles interact?
6. **INHERITANCE** — what inherits from what?
7. **OVERRIDE** — what can specialise locally?
8. **LIFECYCLE** — how does it change state?
9. **WORKFLOW** — who does what?
10. **ACCESS** — who can see/change it?
11. **STRUCTURE** — what contains/references/uses it?
12. **CHANGE** — how is controlled change applied?
13. **EVIDENCE** — what history/audit/version/decision is retained?
14. **CROSS-CONTEXT** — can it be shared/moved/copied/referenced elsewhere?

---

# 1. Context and administration

| ID | Evidence | Status | Source |
|---|---|---|---|
| CTX-001 | Windchill context is the administrative/work framework where data, people and process are brought together. Application contexts include Product, Library, Project and Program. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/DataAccessContextTeam.html |
| CTX-002 | Standard administrative hierarchy is Site → Organisation → application contexts. Standard Windchill does not prove recursive Organisation-context nesting. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WCAdminOviewHierarchyIntegWCSolutions.html |
| CTX-003 | Context administration includes configuration, structure, participation, policy, types/attributes, templates, object-initialisation rules and preferences. | VERIFIED | PTC Windchill 12.0.2.0 Help Center context administration branch |
| CTX-004 | Product, Library, Project and Program are semantically different application contexts, not generic folders. | VERIFIED | PTC Windchill 12.0.2.0 Help Center Product/Library/Project/Program branches |
| CTX-005 | Context hierarchy and policy-domain hierarchy are separate structures. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PolicyAdminContextAbout.html |
| CTX-006 | Business-network relationships between contexts are referential and do not redefine the administrative context hierarchy. | PROVISIONAL | PTC context-network Help Center branch |
| CTX-007 | NuBlox may require a recursive business organisation/unit hierarchy beyond Windchill's standard Site → Organisation context hierarchy. | HYPOTHESIS | Derived NuBlox requirement; not a PTC fact |

## Context distinction to preserve

```text
Administrative/Application Context
≠ Policy Domain
≠ Business Relationship Network
≠ Configuration Context
≠ Design Context
≠ Sourcing Context
```

Windchill uses the word *context* for several different concepts. NuBlox must not collapse them.

---

# 2. Organisation participants, groups, roles and teams

| ID | Evidence | Status | Source |
|---|---|---|---|
| PAR-001 | Organisation Participant and Organisation Context are distinct concepts. The participant represents a business entity/people grouping; the context is an administrative framework. | VERIFIED | PTC Organisation Administration branch |
| PAR-002 | Organisation-level user-defined groups provide reusable organisational membership. | VERIFIED | PTC Organisation Administration / group management branch |
| PAR-003 | Context Teams are specific to an application context and assign participants to roles. Effective capability in context depends on role plus access permissions. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/DataAccessContextTeam.html |
| PAR-004 | Shared Teams are defined at Organisation level and are reusable by application contexts. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/TeamSharedTeamCreate.html |
| PAR-005 | A Shared Team can be locally extendable; a Context Team can therefore be shared-only or shared plus local roles/members. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/TeamSharedTeamCreate.html |
| PAR-006 | Shared-team membership/roles are administered at Organisation level, not inside each Product/Library context using the team. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PDMAdminChp_ManageTeamMembersRoles.html |
| PAR-007 | Windchill provides utilities to migrate local-team membership into Shared Teams, preserving roles. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/TeamCommandUtilAbout.html |
| PAR-008 | Organisation/user-defined groups can feed team-role membership; team/group synchronisation is an explicit mechanism. | VERIFIED | PTC Teams → Synchronizing Teams with User-Defined Groups branch |
| PAR-009 | Context-team roles have system-group semantics that can be targeted by access-control rules and used by workflow/lifecycle resolution. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/TeamRoleGroupAbout.html |
| PAR-010 | Business-object teams are distinct again from Context Teams; lifecycle/workflow-managed objects can resolve effective participants from templates, lifecycle, context team and workflow roles. | VERIFIED | PTC Team Template / Team default behaviour branch |
| PAR-011 | Windchill's Enterprise Organisation template creates capability-like groups including Engineering, Manufacturing, Procurement, Sales, Marketing, Service, Quality Assurance and Facilities. | VERIFIED | PTC Organisation Administration → Context Participation branch |
| PAR-012 | F01–F29 may therefore be closer to enduring organisational capability than to per-context teams; work-context teams may draw participants from those capabilities. | HYPOTHESIS | NuBlox interpretation requiring further validation |

## Current participation model

```text
Permanent organisational grouping/capability
        ↓
Organisation Groups / Roles / Shared Teams
        ↓
Application Context Team
        ↓
Object Team / Workflow role resolution
        ↓
actual participant
```

**Do not yet freeze F01–F29 as Shared Teams, Context Teams or Groups.** The evidence shows these are separate mechanisms.

---

# 3. Shared-team security and policy inheritance

| ID | Evidence | Status | Source |
|---|---|---|---|
| SEC-001 | Creating a Shared Team creates a Shared Team domain under the Organisation /Default domain. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/TeamSharedTeamAccessCtrlRuleAbout.html |
| SEC-002 | Default policy rules in the Shared Team domain include Team Member and Guest permissions. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/TeamSharedTeamAccessCtrlRuleAbout.html |
| SEC-003 | Application-context access policy can therefore be influenced by Shared Team/domain inheritance, not just by direct membership. | VERIFIED | PTC access-control hierarchy + Shared Team domain evidence |
| SEC-004 | Visibility/profile configuration and access permission are separate control dimensions. | VERIFIED | PTC profile/action-visibility branch |
| SEC-005 | Security Labels add information-clearance controls that are conceptually separate from RBAC permissions. | VERIFIED | PTC Security Labels branch |
| SEC-006 | Agreements can provide controlled exceptions to security-label restrictions over participants, objects/contexts, dates and lifecycle. | VERIFIED | PTC Agreements branch |
| SEC-007 | Business authority should remain distinct from permission, UI visibility and information clearance in NuBlox. | HYPOTHESIS | NuBlox architectural inference |

---

# 4. Types, attributes, classification and relationship constraints

| ID | Evidence | Status | Source |
|---|---|---|---|
| TYP-001 | Windchill supports type/subtype hierarchies and inherited type definitions. | VERIFIED | PTC Type and Attribute Management branch |
| TYP-002 | Organisation-defined types/subtypes can be available in child application contexts rather than recreated per Product/Project. | VERIFIED | PTC Type and Attribute Management / context inheritance branch |
| TYP-003 | Classification is a separate taxonomy from object type, with classification nodes, reusable attributes, constraints, units and search/reuse behaviour. | VERIFIED | PTC Classification Administration branch |
| TYP-004 | Association constraints can limit which object types/subtypes may participate in relationships. | VERIFIED | PTC Type and Attribute Management → Association Constraints branch |
| TYP-005 | NuBlox must distinguish object type, classification and relationship type. | HYPOTHESIS | NuBlox architectural inference |

---

# 5. Templates and object initialisation rules

| ID | Evidence | Status | Source |
|---|---|---|---|
| TMP-001 | Windchill has multiple first-class template families: Context, Team, Lifecycle, Workflow, Task Form, Document, CAD Document, Report and others. | VERIFIED | PTC Templates table / administration branches |
| TMP-002 | Context templates establish an initial administrative framework when an application context is created. | VERIFIED | PTC Context creation branch |
| TMP-003 | Project/Program templates can include team roles/members, plan, deliverables, documents, folders/domains, OIRs and preferences. | VERIFIED | PTC Project/Program template branch |
| TMP-004 | Product/Library templates centre on controlled PDM configuration, types, policy, lifecycles, workflows and OIR behaviour. | VERIFIED | PTC Product Design template branch |
| OIR-001 | Object Initialisation Rules establish initial attribute values/display and basic relationships such as lifecycle association. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/OrgAdminChp_ManageOrgOIRs.html |
| OIR-002 | Site OIRs are inherited by Organisation contexts and can be overridden at Organisation level. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/OrgAdminChp_ManageOrgOIRs.html |
| OIR-003 | OIRs participate in defaults such as numbering, folder, lifecycle, team template, version scheme and attributes. | VERIFIED | PTC OIR best-practice branch |
| OIR-004 | Windchill's recurring governance principle is: define high, inherit down, specialise locally where allowed. | VERIFIED pattern | Multiple PTC inheritance mechanisms |
| OIR-005 | NuBlox likely needs a first-class Creation Policy / Effective Configuration service rather than hard-coded per-screen creation logic. | HYPOTHESIS | NuBlox inference |

---

# 6. Lifecycle, workflow, role resolution and release

| ID | Evidence | Status | Source |
|---|---|---|---|
| LFW-001 | Lifecycle state and workflow are distinct but coordinated mechanisms. | VERIFIED | PTC Lifecycle and Workflow branches |
| LFW-002 | Advanced lifecycle phases can carry roles, access-control behaviour and workflow processes. | VERIFIED | PTC Lifecycle Administration branch |
| LFW-003 | Object-team role resolution can combine Team Template participants, lifecycle role mappings, Context Team membership and workflow roles. | VERIFIED | PTC Team Template default-behaviour branch |
| LFW-004 | Promotion is a maturity transition process over checked-in objects and is distinct from Change Management. | VERIFIED | PTC Promotion Request branch |
| LFW-005 | Business-rule validation can gate promotion/change release and surface conflicts. | VERIFIED | PTC Business Rules branch |
| LFW-006 | Electronic signature is separate evidence from lifecycle state itself and can authenticate specific workflow activities. | VERIFIED | PTC Electronic Signature branch |
| LFW-007 | NuBlox should keep technical approval, quality acceptance, disposition acceptance, maturity/release and business authority as distinct decisions. | HYPOTHESIS | NuBlox inference |
| LFW-008 | An Assigned Activity is a workflow-process node that creates one or more user Tasks at runtime; the Task is therefore an execution assignment, not the workflow definition itself. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WFChp_AssignedActivityDefine.html |
| LFW-009 | Workflow activity resource pools can resolve candidate participants from Groups, Team Templates, the Primary Business Object's Context Team, or Roles. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WFTabAactResourcePool.html |
| LFW-010 | Workflow Tasks support acceptance and reassignment; for an Any assignment, accepting one user's Task removes peer Tasks, while All assignments retain each assignee's Task. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/AssignmentsProductTasksTableRef.html |
| LFW-011 | Task reassignment preserves reassignment history/reason, while calendar delegation is a separate temporary-availability mechanism. | VERIFIED | PTC Reassign Task / Delegate Work branches |
| LFW-012 | Workflow routing can emit explicit outcomes and be automatic/conditional or user-selected; route outcomes determine subsequent process paths. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WFRouting.html |
| LFW-013 | Workflow connectors/robots provide orchestration beyond human Tasks, including event/state synchronisation, timers, notifications, expressions and subprocesses. | VERIFIED | PTC Workflow Editor Nodes / Synchronize Robot branches |
| LFW-014 | Workflow process instances retain their Primary Business Object, initiating Context and Process Template identity; administrative process states include Running, Executed, Aborted, Suspended and Terminated. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WFProcessAdminWFProcessTblRef.html |
| LFW-015 | Workflow execution objects follow their own state model (normally Not Started → Running → Executed), independently from the lifecycle state of the Primary Business Object. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WFChp_WFInstanceState.html |
| LFW-016 | Workflow Templates are iterated, not revised; existing running process instances continue against the template iteration they started with while new instances use the latest checked-in iteration. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WFChp_WFIteration.html |
| LFW-017 | Windchill can defer participant resolution until runtime through Set Up Participants activities with constrained role-add/remove permissions and resource pools. | VERIFIED pattern; 12.0.2 branch with later-version detailed corroboration | PTC Workflow Set Up Participants branch |
| LFW-018 | NuBlox therefore needs explicit Workflow Definition/Iteration, Workflow Instance, Activity Definition, Activity Instance, Task Assignment, Participant Resolution, Route/Decision and Process Evidence concepts rather than one generic task table. | HYPOTHESIS | NuBlox inference |
| LFW-019 | Workflow voting/tally logic can evaluate outcomes using Any, All, percentage, numeric-threshold, plurality and related tally functions; manual and manual-exclusive routing distinguish single from multiple user-selected outcomes. | VERIFIED pattern; 12.0.2 branch with later-version detailed corroboration | PTC Workflow Vote Tallies / Routing branches |
| LFW-020 | Task completion is distinct from saving in-progress task input/comments; completion submits the assignee's input to the running workflow. | VERIFIED pattern | PTC Tasks / Task Assistant / change-process task completion branches |
| LFW-021 | Workflow administration exposes process/node health and expression/error detail so failed workflow execution can be diagnosed, restarted or terminated rather than disappearing into generic job failure. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WFProcessAdminWFActivityDetailTblRef.html |
| LFW-022 | Workflow process administration can filter instances by Context, Process Template, Primary Business Object, initiator, dates and health/error state. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WFProcessAdminSearch.html |
| LFW-023 | NuBlox Decision evidence should retain eligible participants, actual actors, route/vote outcome, tally rule, comments/signature where required, acted-on object/version and governing workflow/template iteration. | HYPOTHESIS | NuBlox inference |
| LFW-024 | Ad Hoc Activities allow a designated runtime user to define a group of workflow activities dynamically; Windchill ProjectLink does not support ad-hoc activities. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WFAactAbout.html |
| LFW-025 | Workflow process health distinguishes warnings/errors such as overdue Tasks, suspended nodes, invalid PBO/template/team references, orphaned work items, aborted nodes and stalled queue entries. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WFProcessAdminWFHealthStatus.html |
| LFW-026 | Workflow execution can use pooled/shared queues or template/process-specific dedicated queues for propagation/user-work isolation and performance. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/queuemgmtChp_DedicatedQueues.html |
| LFW-027 | Workflow-authoring authority is distinct from normal context administration because embedded workflow expressions can execute server-side code; Windchill adds trusted administrative-group controls around expression authoring. | VERIFIED; 12.0.2 official PTC non-English detail + Help Center branch | PTC Workflow Creators / Restricting Workflow-Embedded Java Code |
| LFW-028 | Workflow deadlines can drive overdue status, notification and escalation/consequence behaviour; the exact deadline configuration is part of the workflow definition rather than the business object's lifecycle state. | VERIFIED pattern; 12.0.2 Help Center branch with later-version detailed corroboration | PTC Workflow Deadline Tab |
| LFW-029 | Workflow Task/Process history and Voting History are retained alongside object history, allowing reconstruction of process execution and participant decisions. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ObjectOviewInfoTablesHistory.html |




---

# 7. Revision, iteration, workspace and commonspace

| ID | Evidence | Status | Source |
|---|---|---|---|
| VER-001 | Revision, iteration, lifecycle state, working state and view are separate axes. | VERIFIED | PTC version-control branches |
| VER-002 | Check-in creates a new iteration; Revise creates a new revision. | VERIFIED | PTC PDM/Revise branches |
| VER-003 | Workspace is a controlled work-in-progress area; commonspace is the shared authoritative area. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WWGMGenericOverviewCapabilitiesCommonPDM.html |
| VER-004 | Workspace Update resolves objects against the workspace configuration specification and commonspace changes. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WWGMGenericOverviewCapabilitiesCommonPDM.html |
| VER-005 | NuBlox must not treat every save, check-in, revision, promotion and change as the same operation. | HYPOTHESIS | NuBlox inference |

---

# 8. Product structures, CAD and views

| ID | Evidence | Status | Source |
|---|---|---|---|
| STR-001 | Part is a controlled business object distinct from CAD Document. | VERIFIED | PTC Product Structure / CAD association branches |
| STR-002 | Product structure is built from typed parent-child usage relationships. | VERIFIED | PTC Part structure branch |
| STR-003 | Usage relationships and occurrences are distinct; occurrences can represent specific instances/locations/reference designators. | VERIFIED | PTC Part occurrence branch |
| STR-004 | Alternate/substitute/supersede relationships are separate from ordinary usage. | VERIFIED | PTC replacement-parts branch |
| STR-005 | CAD structures and Part structures are separate and connected via associations/build rules. | VERIFIED | PTC CAD-Part relationship branch |
| STR-006 | Engineering and Manufacturing views can represent discipline-specific versions/structures of the same conceptual Part. | VERIFIED | PTC View Administration / MPMLink branches |
| STR-007 | NuBlox should not force design, procurement, manufacturing, construction and asset breakdowns into a single universal tree. | HYPOTHESIS | NuBlox inference |

---

# 9. Baseline, managed collection and configuration resolution

| ID | Evidence | Status | Source |
|---|---|---|---|
| CFG-001 | Baseline is a deliberate point-in-time collection/snapshot and can be protected/locked. | VERIFIED | PTC Baseline branch |
| CFG-002 | Managed Collection differs from Baseline because collection rules can be reapplied/updated. | VERIFIED | PTC Managed Collection branch |
| CFG-003 | Product structures can be dynamically resolved by configuration specifications such as Latest, Baseline, As Stored, As Matured, Change, Date Effectivity and Unit Effectivity. | VERIFIED | PTC configuration-specification branches |
| CFG-004 | As Stored, Baseline and Effectivity are distinct configuration semantics. | VERIFIED | PTC configuration-specification branches |
| CFG-005 | Configuration resolution can combine lifecycle state, effectivity, options/choices, variant rules and structure filters. | VERIFIED | PTC options/configuration branches |
| CFG-006 | NuBlox should model effective structure as a governed query over version/configuration history rather than only a persisted current tree. | HYPOTHESIS | NuBlox inference |

---

# 10. Cross-context sharing and PDM exchange

| ID | Evidence | Status | Source |
|---|---|---|---|
| XCX-001 | Windchill distinguishes Shared, PDM Checkout and Copy when exchanging objects into a Project. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/InteropShareTypes.html |
| XCX-002 | Share gives Project members read-only access to the authoritative source object. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/InteropShareTypes.html |
| XCX-003 | PDM Checkout creates a project-specific editable version while the source remains locked in PDM. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/InteropShareTypes.html |
| XCX-004 | Copy creates an independent object rather than an editable project version of the same authoritative source. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/InteropShareTypes.html |
| XCX-005 | PDM Checkout objects can become Sent to PDM, Deprecated or Abandoned depending on concurrent project activity. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/InteropStates.html |
| XCX-006 | Object identity, authoritative context and contextual visibility/access are separate dimensions. | VERIFIED pattern | Cross-context sharing evidence |
| XCX-007 | NuBlox should distinguish authoritative object, project-visible reference, project-working version and independent copy. | HYPOTHESIS | NuBlox inference |

---

# 11. Change Management and redlines

| ID | Evidence | Status | Source |
|---|---|---|---|
| CHG-001 | Problem Report, Change Request, Change Notice and Change Task are distinct process objects. | VERIFIED | PTC Change Management branch |
| CHG-002 | Change Tasks relate affected, impacted and resulting objects rather than holding only a generic description/status. | VERIFIED | PTC Change Task branch |
| CHG-003 | Change Intent is distinct from the resulting object's release target/state. | VERIFIED | PTC Change Intent branch |
| CHG-004 | Redlines represent proposed structural/object changes before the next authoritative revision is created. | VERIFIED | PTC Redline branch |
| CHG-005 | Concurrent Change Notices can maintain separate redlines against the same released object; later releases trigger synchronisation/suspect-conflict behaviour. | VERIFIED | PTC Redline branch |
| CHG-006 | Disposition of existing/on-order/WIP/finished material is separate from changing the authoritative design. | VERIFIED | PTC Change Disposition branch |
| CHG-007 | NuBlox should preserve current approved state while allowing multiple controlled proposed futures with conflict awareness. | HYPOTHESIS | NuBlox inference |

---

# 12. Manufacturing, downstream transformation and process planning

| ID | Evidence | Status | Source |
|---|---|---|---|
| MFG-001 | Engineering BOM and Manufacturing BOM are separate controlled structures linked through equivalence relationships. | VERIFIED | PTC MPMLink branch |
| MFG-002 | Equivalent links can become out-of-date when upstream engineering changes; downstream reconciliation is explicit. | VERIFIED | PTC equivalence/discrepancy branch |
| MFG-003 | Downstream structure may legitimately differ from upstream structure and can be created/transformed by rules. | VERIFIED | PTC downstream structure generation branch |
| MFG-004 | Process Plan is a separate structure describing operations/sequences and allocations. | VERIFIED | PTC Process Plan branch |
| MFG-005 | Operations can allocate parts/material, work centres, tooling, skills/resources and control characteristics. | VERIFIED | PTC MPMLink operation/resource branches |
| MFG-006 | Alternate BOMs/process definitions can represent alternative production methods. | VERIFIED | PTC Alternate BOM branch |
| MFG-007 | Manufacturing Capability, Standard Operation, Standard Procedure and actual Operation are distinct concepts. | VERIFIED | PTC manufacturing standards/capabilities branch |
| MFG-008 | NuBlox may need a general source → downstream representation → discrepancy → reconciliation kernel capability. | HYPOTHESIS | Repeated Windchill pattern |

---

# 13. Supplier management and sourcing

| ID | Evidence | Status | Source |
|---|---|---|---|
| SUP-001 | OEM Part, Manufacturer Part and Vendor Part are distinct objects connected by sourcing relationships. | VERIFIED | PTC Supplier Management branch |
| SUP-002 | Preferred/Approved/Do Not Use sourcing status belongs to a sourcing relationship rather than globally to the supplier part. | VERIFIED | PTC supplier-part relationship/source-status branches |
| SUP-003 | Sourcing Context qualifies the circumstances under which a sourcing decision applies. | VERIFIED | PTC Supplier Management terminology branch |
| SUP-004 | Supplier Organisation identity is distinct from the OEM's supplier/manufacturer/vendor relationship to that organisation. | VERIFIED | PTC Supplier Management organisation branch |
| SUP-005 | Part Request is a first-class controlled request/workflow that can precede creation/approval of the resulting Part. | VERIFIED | PTC New Part Request branch |
| SUP-006 | Sourcing rules can use supplier, sourcing context and classification to derive sourcing status. | VERIFIED | PTC Sourcing Rules branch |
| SUP-007 | NuBlox should not use a single global supplier.status field to express all approval/qualification/sourcing semantics. | HYPOTHESIS | NuBlox inference |

---

# 14. Project plans, activities and deliverables

| ID | Evidence | Status | Source |
|---|---|---|---|
| PRJ-001 | Project Plan Activity, Workflow Task, Action Item, Change Task and Quality Task are different work concepts. | VERIFIED | PTC Project Management / Workflow / Change / Quality branches |
| PRJ-002 | Project Deliverable is a planned/managed obligation and can reference a governed object as its Subject. | VERIFIED | PTC Deliverable information-page branch |
| PRJ-003 | Deliverable Requirement/Commitment and the controlled Work Product should therefore not be conflated. | HYPOTHESIS | NuBlox inference |
| PRJ-004 | Project templates can instantiate reusable plans, deliverables and team/configuration structures. | VERIFIED | PTC Project template branch |
| PRJ-005 | A Plan can contain hierarchical summary activities, activities, milestones and subplans; plans support scheduling, dependencies, effort, cost and critical-path/status roll-up. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PlanMgmtPlanInfo.html |
| PRJ-006 | Automatic plan execution is state-driven: Project state constrains Plan state, and Plan state constrains Activity state; eligible activities start from schedule/constraints and generate task notifications. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PlanMgmtSchedulingAutoExecution.html |
| PRJ-007 | Project/Program operational state and informational phase are different concepts; project state affects access/execution while phase describes maturity/stage. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ProjMgmtPhaseState.html |
| PRJ-008 | Plan Resources are separate from team membership and may be Windchill Users, Other resources, Windchill Groups or Windchill Team Roles. Team members/roles can automatically create corresponding resources. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PlanMgmtResourceAbout.html |
| PRJ-009 | Resources have capacity/time semantics such as Max Units and can be assigned to activities so work and cost can be tracked. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PlanMgmtResourceAtts.html |
| PRJ-010 | Action Items track issues/tasks within Product, Project or Program contexts but are explicitly not formally tracked in the Plan. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ProjMgmtActItemAbout.html |
| PRJ-011 | Deliverables are tangible/measurable outputs; they can be associated to Plan Activities and can reference a governed Windchill object such as a Document or Part as the Deliverable Subject. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PlanMgmtDeliverableInfoPageRef.html |
| PRJ-012 | Deliverables therefore have planning/obligation semantics independently from the controlled object that embodies the delivered content. | VERIFIED pattern | Deliverable + Subject semantics |
| PRJ-013 | Track New Work connects resource-assignment work/progress to an eligible deliverable activity and governed Subject object, with eligibility constrained by execution state and tracking policy. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PlanMgmtTrackWorkNew.html |
| PRJ-014 | Plan Baseline snapshots the Plan state including Plan objects; this is distinct from product/configuration baselines. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PlanMgmtPlansTable.html |
| PRJ-015 | Plans can be saved/exported as reusable Plan Templates and Windchill supports Microsoft Project interchange. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PlanMgmtPlansTable.html |
| PRJ-016 | NuBlox must keep planned work, resource assignment, workflow task, action item, deliverable obligation and governed Subject/work product as separate but linkable canonical concepts. | HYPOTHESIS | NuBlox inference |
| PRJ-017 | Activity scheduling separates Duration, Work and Resource Units; Windchill calculates the third variable when two are supplied, using working calendars/resource availability. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PlanMgmtSchedCalculation.html |
| PRJ-018 | Activity Task Type determines which scheduling variable is fixed when the schedule changes: Fixed Units, Fixed Work or Fixed Duration. Effort Driven separately determines how adding/removing resources affects work, duration or units. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PlanMgmtTaskTypesAbout.html |
| PRJ-019 | Activity date constraints are explicit scheduling semantics: As Soon As Possible, As Late As Possible, Start No Earlier Than and Must Finish On. Constraint semantics are independent from activity execution state. | VERIFIED; 12.0.2 Help Center branch with later-version exact-content corroboration | PTC Activity Date Constraints |
| PRJ-020 | Predecessor relationships support Finish-to-Start, Start-to-Start, Finish-to-Finish and Start-to-Finish plus positive lag and negative lead. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PlanMgmtPredecessorsAbout.html |
| PRJ-021 | Summary Activity schedule/progress is calculated from child activities: earliest child start, latest child finish, summed work and work-weighted percent complete; the summary completes only when all children complete. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PlanMgmtExampleSummaryActivity.html |
| PRJ-022 | Activity resource assignment types distinguish Single, Pool, Bulk and Shared semantics for individual, group or team-role resources. Pool is accepted by one member; Bulk creates separate split assignments; Shared allows multiple members to contribute to overall completion. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PlanMgmtPlanActivityEdit.html |
| PRJ-023 | Resource capacity is represented through percentage Units against a work calendar, and capacity reporting can identify over-allocation when assignments exceed available units. | VERIFIED pattern; exact 12.0.2 scheduling semantics with later-version Capacity Report corroboration | PTC Activity Schedule Calculation / Capacity Report |
| PRJ-024 | Activity ownership and resource assignment are distinct: Owner is responsible for successful completion and may also be a resource, while Resource Assignment models planned/actual work contribution. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PlanMgmtPlanActivityEdit.html |
| PRJ-025 | Deliverable Activity tracking policies control object-version semantics independently of the activity: Fixed Revision tracks latest iteration of a chosen revision, Latest Revision tracks latest version, and Fixed Subject pins a specific revision/iteration or non-revision object. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PlanMgmtPlanActivityEdit.html |
| PRJ-026 | Deliverable Subject eligibility depends on Plan context. Project activities use objects in the same Project including PDM-shared objects; Program activities use same-Program objects; Product activities may use PLM-context objects but not Project/Program objects. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PlanMgmtPlanActivityEdit.html |
| PRJ-027 | Activities have a Deadline/overdue concept distinct from calculated Estimated Finish; deadline notifications may be sent before/after the deadline and deadline calculation can be administratively customised. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PlanMgmtPlanActivityEdit.html |
| PRJ-028 | Status and Risk are separate from schedule/execution state. Status can be green/yellow/red, Risk is a probability assessment, and status can be manually set or configured for automatic calculation. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PlanMgmtPlanActivityEdit.html |
| PRJ-029 | Plan Status rolls up primarily from critical-path Activity status; Project Status then rolls up from one or more Plans. This status/health hierarchy is different from Project/Plan/Activity execution-state hierarchy. | VERIFIED; 12.0.2 branch with later-version exact-content corroboration | PTC Project Status |
| PRJ-030 | Automatic execution follows Project → Plan → Activity state hierarchy and uses schedule/start constraints/predecessors to start work and issue Tasks. Manual early start can intentionally remove predecessor constraints. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PlanMgmtSchedulingAutoExecution.html |
| PRJ-031 | Track Work captures Actual Work, % Work Complete, Remaining Work, Estimated/Actual Finish, Status and Risk on execution assignments; modifying planned Work/Remaining Work can recalculate the associated Activity schedule. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PlanMgmtTrackWorkNew.html |
| PRJ-032 | Plan Baseline is a special point-in-time snapshot of Plan-related objects and differs from Managed Baseline: plan objects are not ordinarily version controlled, so the Plan Baseline preserves their state at that time. | VERIFIED; exact 12.0.2 branch with later-version detail corroboration | PTC Plan Baselines |
| PRJ-033 | Once created, a Plan Baseline is read-only; comparison can select an active baseline and the Plan Manager may delete an entire baseline but not edit individual baseline members. | VERIFIED pattern; 12.0.2 branch with later-version detailed corroboration | PTC Manage Plan Baselines |
| PRJ-034 | NuBlox planning should keep Schedule Constraint, Dependency, Planned Work, Resource Capacity, Execution State, Status/Risk, Deadline, Actual Work and Baseline Snapshot as independent but coordinated dimensions. | HYPOTHESIS | NuBlox inference |



---

# 15. Quality context, nonconformance, CAPA and audit

| ID | Evidence | Status | Source |
|---|---|---|---|
| QMS-001 | Windchill supports a Quality Context containing first-class Quality process objects. | VERIFIED | PTC Quality Management branch |
| QMS-002 | Nonconformance is a governed process with initiation/evaluation/investigation/disposition/closure stages rather than a generic issue status. | VERIFIED | PTC Nonconformance branch |
| QMS-003 | Nonconformance affected-item data can identify exact Part/version/iteration plus quantity, supplier, PO and lot/serial information. | VERIFIED | PTC Nonconformance service/UI evidence |
| QMS-004 | Affected quantities can be split across different dispositions such as rework, return, scrap and use-as-is. | VERIFIED | PTC Nonconformance disposition branch |
| QMS-005 | Decision authority and execution roles for dispositions are distinct. | VERIFIED | PTC Nonconformance roles branch |
| QMS-006 | Deviation (permission before production) and Waiver (acceptance after nonconforming production) are distinct Variance semantics. | VERIFIED | PTC Variance branch |
| QMS-007 | CAPA is a separate process related to, but not replacing, the originating Nonconformance. | VERIFIED | PTC CAPA/NC association branch |
| QMS-008 | CAPA distinguishes plan, implementation, optional confirmation, effectiveness monitoring and closure. | VERIFIED | PTC CAPA Process Flow branch |
| QMS-009 | Audit Findings can generate/associate Nonconformance and CAPA records. | VERIFIED | PTC Audit branch |
| QMS-010 | NuBlox should distinguish correction, corrective action and verified effectiveness. | HYPOTHESIS | NuBlox inference |

---

# 16. Inspection and control characteristics

| ID | Evidence | Status | Source |
|---|---|---|---|
| INS-001 | Control Characteristic is a governed object/definition that can carry measurable limits and be associated with Parts, Process Plans and Operations. | VERIFIED | PTC MPMLink Control Characteristics branch |
| INS-002 | Inspection requirements can be published downstream to production systems; Windchill is not necessarily the primary shop-floor measurement-capture system. | VERIFIED | PTC MPMLink/ESI evidence |
| INS-003 | Inspection Requirement, Inspection Execution and Inspection Result should remain distinct concepts even if NuBlox ultimately owns all three. | HYPOTHESIS | NuBlox inference |

---

# 17. Physical instances and as-maintained configuration

| ID | Evidence | Status | Source |
|---|---|---|---|
| PHY-001 | Part Instance represents a particular serial/lot-traceable physical product instance. | VERIFIED | PTC Part Instance branch |
| PHY-002 | Part-instance structures can allocate specific child Part Instances and retain start-incorporation dates. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/CIInstanceStructureTabAbout.html |
| PHY-003 | Part Instance structures can be filtered by Latest or Incorporation Date configuration specification. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/CIInstanceIncorporationConfigSpec.html |
| PHY-004 | Physical/as-maintained configuration can evolve independently from the current engineering definition through allocation, replacement and instance revision. | VERIFIED | PTC Part Instance configuration branch |
| PHY-005 | Asset Type/Definition, approved configuration and physical Asset Instance must remain distinct in NuBlox. | HYPOTHESIS | NuBlox inference |
| PHY-006 | NuBlox should be able to reconstruct as-designed/as-approved/as-procured/as-fabricated/as-installed/as-commissioned/as-maintained states. | HYPOTHESIS | CBE application of verified configuration concepts |

---

# 18. Service information and publication

| ID | Evidence | Status | Source |
|---|---|---|---|
| SVC-001 | Information Structure, Publication Structure, Parts List and Service BOM are separate governed structures. | VERIFIED | PTC Service Information Management branch |
| SVC-002 | Publication Structures can be derived from filtered Information Structures while retaining source relationships. | VERIFIED | PTC Service Information branch |
| SVC-003 | Published PDF/HTML/XML/content-bundle representations are not identical to the authoritative information structure. | VERIFIED | PTC Service publishing branch |
| SVC-004 | Options/choices and service effectivity can control which service information applies to a product/instance. | VERIFIED | PTC Service applicability/effectivity branch |
| SVC-005 | Downstream service structures/parts lists can become update-required when source structures change rather than mutating automatically. | VERIFIED | PTC Service update branch |
| SVC-006 | O&M information in NuBlox should be resolvable against actual asset configuration/applicability rather than only attached as static PDFs. | HYPOTHESIS | NuBlox inference |

---

# 19. Packages, deliveries and controlled external exchange

| ID | Evidence | Status | Source |
|---|---|---|---|
| PKG-001 | Package is a governed collection and Delivery is a separate exchange object/action. | VERIFIED | PTC Package Management branch |
| PKG-002 | Specialised package types include Technical Data Package, CDRL, SDRL and Replication Package. | VERIFIED | PTC Package Management branch |
| PKG-003 | Received Delivery is a receiving-side process/object with upload, preview, mapping, import and evidence/logging. | VERIFIED | PTC Received Delivery branch |
| PKG-004 | Receiving-side mapping can translate Context, Owning Organisation, View, Folder, Lifecycle, Security Label and Version semantics. | VERIFIED | PTC Received Delivery mapping branch |
| PKG-005 | Imported package objects can remain locked because the receiving Windchill system is not authoritative for them. | VERIFIED | PTC Received Delivery branch |
| PKG-006 | Full and incremental delivery semantics are different; incremental delivery can communicate moves/deletions relative to a base delivery. | VERIFIED | PTC Package best-practice branch |
| PKG-007 | NuBlox should distinguish transmittal/package definition, delivery event, received delivery and source authority. | HYPOTHESIS | NuBlox inference |

---

# 20. Search, representations, reporting, events and APIs

| ID | Evidence | Status | Source |
|---|---|---|---|
| PLT-001 | Windchill separates database search from indexed metadata/content search. | VERIFIED | PTC Index Search administration branch |
| PLT-002 | Derived representations/viewables are asynchronously published from authoritative objects rather than replacing them. | VERIFIED | PTC Visualization Services branch |
| PLT-003 | Report Definition and Report Instance are distinct concepts where historical executed output may be retained. | VERIFIED | PTC Reporting branch |
| PLT-004 | Audit and subscriptions are driven by meaningful service/domain events rather than only CRUD logging. | VERIFIED | PTC Audit/Subscription branches |
| PLT-005 | Windchill REST Services expose business-domain-oriented OData services rather than one undifferentiated generic record API. | VERIFIED | PTC Windchill REST Services branch |
| PLT-006 | NuBlox integrations should expose bounded capability APIs over canonical objects, with domain events/outbox for asynchronous work. | HYPOTHESIS | NuBlox inference |

---

# 21. Repeating architectural patterns observed

These are **cross-cutting patterns supported by multiple verified Windchill mechanisms**.

## P-01 — Define high, inherit down, specialise locally

Seen in:

- OIRs
- templates
- preferences
- types/attributes
- policy domains
- shared teams
- dynamic-role access rules

## P-02 — Definition is not execution

Seen in:

- Control Characteristic vs inspection result
- Process Plan vs actual operation
- Capability/Standard Procedure vs scheduled work
- Deliverable obligation vs deliverable Subject/work product
- Requirement vs implementation object

## P-03 — Source authority is not contextual visibility

Seen in:

- Product/Library object shared to Project
- PDM Checkout
- Received Delivery
- supplier/client exchange

## P-04 — Downstream is a governed transformation, not a mirror

Seen in:

- eBOM → mBOM
- mBOM → Process Plan
- source BOM → service Parts List
- Information Structure → Publication Structure
- released object → Redline → resulting revision

## P-05 — Upstream change creates impact/discrepancy, not silent downstream mutation

Seen in:

- engineering/manufacturing equivalence
- service update-required state
- redline synchronisation
- PDM project-share out-of-sync state

## P-06 — Relationship often carries the governance

Seen in:

- sourcing status
- usage/occurrence attributes
- trace links
- equivalence
- share relationship
- object associations
- disposition/action links

## P-07 — Identity, location, ownership, access and authority are separate

Seen throughout context, participant, ownership and sharing models.

---

# 22. Current NuBlox hypotheses — not architecture decisions

These are recorded to prevent conversational inference being mistaken for verified source fact.

| ID | Hypothesis | Status |
|---|---|---|
| HYP-001 | F01–F29 represent enduring functional capability structures, not application-context teams themselves. | HYPOTHESIS — increasingly supported, not frozen |
| HYP-002 | Positions/people in Functions supply capability into context-specific roles on Projects/Products/Contracts/Assets. | HYPOTHESIS |
| HYP-003 | NuBlox requires separate Organisation hierarchy, participation structure, context hierarchy and policy hierarchy. | HYPOTHESIS |
| HYP-004 | Contract, Asset, Facility and other CBE-specific context types may be required beyond Windchill's standard Product/Library/Project/Program set. | HYPOTHESIS |
| HYP-005 | Context types should have distinct behaviour/configuration rather than being one generic container with a label. | HYPOTHESIS |
| HYP-006 | NuBlox requires runtime role resolution across governance, context participation, workflow and object teams. | HYPOTHESIS |
| HYP-007 | Deliverable obligation and governed work-product object must be distinct. | HYPOTHESIS |
| HYP-008 | NuBlox requires a canonical provenance/traceability model across requirement → design → sourcing → fabrication → installation → commissioning → asset/service information. | HYPOTHESIS |
| HYP-009 | Source/downstream discrepancy and controlled reconciliation should be a reusable platform capability. | HYPOTHESIS |
| HYP-010 | Asset definition, physical asset instance and as-maintained configuration must be separate canonical concepts. | HYPOTHESIS |

---

# 23. Unresolved gaps

Research must continue before architecture is frozen.

1. Exact Group vs Shared Team vs Context Team use rules across all application-context types.
2. Exact Team Template applicability differences between PDMLink and ProjectLink.
3. Detailed role-resolution precedence and duplicate-role handling.
4. Full policy-domain inheritance/override/composition rules.
5. Context-template content and inheritance matrix by Product/Library/Project/Program.
6. Exact type/subtype inheritance and constraint semantics at Site/Organisation/application context.
7. Full preference locking/override model.
8. Complete revision/iteration/version/view semantics by object family.
9. Full CAD ↔ Part association/build-rule graph.
10. Full configuration-specification/effectivity matrix.
11. Managed Collection vs Baseline vs Package vs Project Baseline relationship details.
12. Change-object optionality and process variants.
13. Redline lifecycle/concurrency/merge detail.
14. Manufacturing discrepancy/equivalence status model.
15. Supplier qualification/relationship lifecycle in depth.
16. Inspection-definition → execution-system integration boundaries.
17. Quality process object graph including Complaint/Customer Experience/Regulatory objects.
18. Part Instance / physical-configuration lifecycle and maintenance-event relationships.
19. Service-product hierarchy and asset-instance applicability in depth.
20. Package/Received Delivery incremental-sync semantics and authority transfer boundaries.
21. Search/classification/reuse behaviour by object family.
22. Audit/e-signature/event retention and immutable-evidence semantics.
23. REST domain catalogue and canonical API boundaries.
24. Migration/export/import semantics across object identity, versions, relationships and security.
25. Every remaining top-level Help Center category not yet represented here.

---


---

# 26. Document Control and training

| ID | Evidence | Status | Source |
|---|---|---|---|
| DOC-001 | Windchill Document Control is a separate quality capability family and can track training against controlled documents such as policies, procedures and work instructions. | VERIFIED | PTC Windchill Quality Management Solutions / Document Control branch |
| DOC-002 | Roles, groups and organisations can be associated with controlled documents for training purposes. | VERIFIED | https://support.ptc.com/help/windchill/plus/r13.1.2.0/en/Windchill_Help_Center/wqCommon/WQCommonVRDTrainingMatrix.html |
| DOC-003 | Training records are distinct objects associated with an assignee and one controlled document. | VERIFIED — later-version English corroboration | https://support.ptc.com/help/windchill/r13.1.2.0/en/Windchill_Help_Center/WCRESTFramework/documentcontroldomain.html |
| DOC-004 | Training validity intervals and late/incomplete monitoring allow controlled information to drive recurring competence evidence. | VERIFIED — later-version English corroboration | https://support.ptc.com/help/windchill/plus/r13.1.2.0/en/Windchill_Help_Center/wqCommon/WQCommonVRDTrainingMatrix.html |
| DOC-005 | NuBlox should be able to connect governed procedures/work instructions to affected roles/positions, training requirements, completion evidence and expiry/retraining. | HYPOTHESIS | NuBlox inference |

---

# 27. Design Control, DHF and approved production/service record

| ID | Evidence | Status | Source |
|---|---|---|---|
| DSC-001 | Windchill Design Control is a separate quality capability family including Design History File, Device Master Record, Design Review and electronic-signature capabilities. | VERIFIED | PTC Windchill Quality Management Solutions branch |
| DSC-002 | Design History File is a managed historical collection/baseline of design-process artifacts related to the product/Part structure, including reference documents, change notices/records, problem reports and variances. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/de/Windchill_Help_Center/WQCommonVRDDesignHistoryFile.html |
| DSC-003 | Objects removed from the current structure can remain represented in the DHF so design progression/maturity remains reconstructable. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/de/Windchill_Help_Center/WQCommonVRDDesignHistoryFile.html |
| DSC-004 | Device Master Record is different from DHF: it contains approved information used to produce/service the product and is not simply kept synchronised with the full design-history collection. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/de/Windchill_Help_Center/WQCommonVRDDesignHistoryFile.html |
| DSC-005 | NuBlox may need separate Design/Project History Evidence and Approved Handover/Asset Operating Record rather than one document collection. | HYPOTHESIS | CBE translation of verified DHF/DMR separation |
| DSC-006 | Design Review is a first-class governed review object used to validate that a product or process meets defined requirements; Windchill distinguishes Design Review and Peer Review types. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ChgMgmtDesignReview.html |
| DSC-007 | Creating a Design Review establishes Review Objects separately from the Design Review itself; the initiating Part is included by default and additional review objects, attachments and associations can be added. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ChgMgmtDesignReview.html |
| DSC-008 | Review Objects can include multiple governed object families such as Parts, Documents, CAD Documents and Dynamic Documents, allowing a formal review to govern a coherent evidence set rather than one file. | VERIFIED pattern; exact 12.0.2 table branch with later-version detailed corroboration | PTC Review Objects Table for Design Reviews |
| DSC-009 | Reviewer participation is resolved through the Design Review workflow's Assign Reviewers task/Set Up Participants capability, so reviewer assignment is process participation rather than a static field on the Part. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ChgMgmtDesignReview.html |
| DSC-010 | Reviewer Task completion can capture comments and electronic-signature evidence; this evidence belongs to the review/process execution and is distinct from the reviewed object's lifecycle state. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ChgMgmtDesignReview.html |
| DSC-011 | Completed Design Review information can be rendered/exported as a summary report containing the completed review details and review evidence. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ChgMgmtDesignReview.html |
| DSC-012 | DHF is a managed-baseline-style historical evidence collection rooted on the current Part revision combination and can retain objects removed from the current product structure so design evolution remains reconstructable. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/de/Windchill_Help_Center/WQCommonVRDDesignHistoryFile.html |
| DSC-013 | DMR is deliberately curated from approved DHF content and is not automatically synchronised with the complete DHF; it represents the approved information used to manufacture/distribute/service the product. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/de/Windchill_Help_Center/WQCommonVRDDesignHistoryFile.html |
| DSC-014 | NuBlox design governance should distinguish Review Definition/Instance, Review Scope, Review Participant/Role, Review Decision/Signature, design-history evidence and the curated approved record used for delivery/operation. | HYPOTHESIS | NuBlox inference |
| DSC-015 | A construction design review should be capable of reviewing an exact multi-object configuration/baseline rather than a loose folder of latest files. | HYPOTHESIS | CBE translation of Design Review + As Stored/Baseline evidence |


---

# 28. Customer Experience and field feedback

| ID | Evidence | Status | Source |
|---|---|---|---|
| CEM-001 | Windchill Customer Experience Management is a distinct quality process used to collect, document, track, trend and report customer-recorded product-quality issues/complaints. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/de/Windchill_Help_Center/WQCEMOview.html |
| CEM-002 | Customer Experience integrates with Parts, BOMs, suppliers, documents and other Windchill quality modules. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/de/Windchill_Help_Center/WQCEMOview.html |
| CEM-003 | Field/customer feedback is therefore a first-class process source that can feed quality investigation/corrective-action processes rather than remaining unstructured correspondence. | VERIFIED pattern | Customer Experience Management evidence |
| CEM-004 | NuBlox should distinguish operational/occupant/client feedback records from NCR/CAPA while preserving traceable escalation between them. | HYPOTHESIS | NuBlox inference |

---

# 29. Regulatory submissions

| ID | Evidence | Status | Source |
|---|---|---|---|
| REG-001 | Windchill Regulatory Master / Regulatory Submission is a separate governed capability family from CAPA, NC, Audit and Customer Experience. | VERIFIED | PTC Windchill 12.0.2.0 solution/module evidence |
| REG-002 | Regulatory Submission records track submissions made to agencies through their workflow/lifecycle state and preserve submission artifacts/content. | VERIFIED — later-version English detail | https://support.ptc.com/help/windchill/plus/r13.1.2.0/en/Windchill_Help_Center/wqregulatorymaster/WQRMWCRegSubmissionProcess.html |
| REG-003 | A Regulatory Submission has Subject relationships to governed objects such as Parts and may have revisions/follow-ups depending on subtype. | VERIFIED — later-version English detail | https://support.ptc.com/help/windchill/plus/r13.1.2.0/en/Windchill_Help_Center/wqregulatorymaster/WQRMCreateNewRegSubmission.html |
| REG-004 | NuBlox should keep statutory/regulatory submission obligation, submission record, submitted content, acknowledgement/response and underlying regulated object separate. | HYPOTHESIS | NuBlox inference |

---

# 30. Construction commissioning, test packs and handover — Windchill gap

**Current evidence finding:** Windchill provides many of the underlying primitives required for commissioning and handover — controlled Documents, Parts/Instances, Process Plans, Control Characteristics, Quality processes, lifecycle/workflow, Packages/Deliveries, acceptance/rejection, baselines and service information — but the Windchill 12.0.2.0 Help Center research to date has **not identified a first-class construction commissioning/test-pack/system-handover object family**.

This must therefore remain a **GAP / NuBlox CBE requirement**, not be marked as covered merely because PLM/QMS primitives exist.

Candidate NuBlox concepts requiring independent CBE research:

```text
Commissioning System / Subsystem
Commissioning Boundary
Inspection & Test Plan
Inspection/Test Requirement
Test Pack
Test Execution
Measured Result
Punch / Snag Item
System Completion
Mechanical Completion
Pre-commissioning
Commissioning
Performance Test
Certificate
Turnover Package
Handover Requirement
Handover Package
Acceptance / Rejection
Asset Information Requirement
As-Built / As-Commissioned Configuration
Outstanding Work / Exception
Final Completion
```

Required trace chain:

```text
Requirement
→ design/configuration
→ installation scope
→ inspection/test requirement
→ test execution/result
→ NCR/exception where needed
→ punch/snag closure
→ completion decision
→ certificate/evidence
→ turnover/handover package
→ recipient acceptance/rejection
→ commissioned physical configuration
→ asset/service information
```

**Status:** GAP — requires benchmarking against construction commissioning/CDE/field-quality market tools and CBE standards, not only Windchill.

---

# 31. Package receipt vs technical acceptance

Windchill Package Delivery provides an explicit recipient response:

- Received
- Accepted
- Rejected

Source: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PackageReceive.html

This is **delivery/receipt acceptance** of the package exchange. It must not automatically be interpreted as:

- technical approval of every contained object;
- quality acceptance of installed work;
- contractual acceptance;
- commissioning acceptance;
- maturity/release of the source objects.

This reinforces the need for NuBlox to model **receipt, technical review, quality acceptance, contractual acceptance and lifecycle release as separate decisions**.



---

# 32. Options, variants and Product Families

| ID | Evidence | Status | Source |
|---|---|---|---|
| VAR-001 | Windchill models configuration using first-class Option, Choice, Choice Rule, Option Set, Configurable Module, Variant Specification and Variant objects rather than requiring a cloned structure for each possible product. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/OptionsObjectTypes.html |
| VAR-002 | An Option represents a configurable product capability and a Choice represents one selectable value for that option. Options can be Design or Sales oriented and can be textual, numeric or Boolean. | VERIFIED | PTC Options and Choices branch / Object Types Used in List-based Option Selection |
| VAR-003 | Choices are lifecycle/change-managed objects and may have effectivity; they can participate in advanced-selection parameter logic. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/OptionsObjectTypes.html |
| VAR-004 | Choice Rules are first-class rule objects. Windchill provides Enable, Include, Exclude and Conditional rules. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/OptionsGlobalRules.html |
| VAR-005 | Choice Rules can be defined globally in the Option Pool or locally in an Option Set. Option Sets can automatically inherit/reference global rules, selectively reuse them, ignore them, and add local rules. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/OptionsSetMappingsManage.html |
| VAR-006 | Editing a local Choice Rule creates a new iteration; the Options and Variants administration model also explicitly provides revision, change-management and promotion support for Choice Rules. | VERIFIED | PTC 12.0.2 Options and Variants Help Center branch |
| VAR-007 | An Option Set is a lifecycle/change-managed collection of options, choices and rules used to define configurations within a Product Family or functional/configurable module. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/OptionsObjectTypes.html |
| VAR-008 | An Option Set must be assigned to a Product/Library/container or configurable part/module to govern choice assignment and filtering. A module-specific Option Set can specialise the option set used by the broader product/context. | VERIFIED | PTC Assigned Option Set branch; exact 12.0.2 TOC with later-version detailed corroboration |
| VAR-009 | Windchill resolves which assigned Option Set applies using an ordered lookup across the configurable module, its context, root configurable module and root context depending on operation. | VERIFIED pattern; exact 12.0.2 branch with later-version detailed corroboration | PTC How Windchill Determines the Assigned Option Set To Use |
| VAR-010 | A Configurable Module is a lifecycle/change-managed organising Part that captures one or more variations of a product function/capability. A top-level configurable end item can act as a Configurable Product. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/OptionsConfigProdCreate.html |
| VAR-011 | Basic and Advanced Expressions can be assigned to Parts, usage links and occurrences to determine whether structure elements are included for a given configuration. | VERIFIED | PTC Options and Variants → Assigning Expressions branch |
| VAR-012 | Advanced Selection Logic adds Parameters and Constraints to configurable modules. Constraint types include Expression, Case Table and External Application. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PMConstraintsTab.html |
| VAR-013 | Advanced-selection parameters can be linked to Option values so user/rule-driven Option selections become inputs to deeper module logic. | VERIFIED pattern; exact 12.0.2 branch with later-version detailed corroboration | PTC Linking Advanced Logic Parameters with Options |
| VAR-014 | The Configure process separates structure/filter criteria, parameter input, preview/reuse matching and creation of a Variant Specification before optionally generating a Variant Part. | VERIFIED | PTC 12.0.2 Creating and Managing Variants branch |
| VAR-015 | A Variant Specification is a governed collection of inputs and selections for a configurable structure; it is distinct from the physical/Part Variant produced from it. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/OptionsVarSpeciDefine.html |
| VAR-016 | Preview compares proposed configuration inputs and resulting structure against existing Variant Specifications and Variant Parts so existing solutions can be reused instead of duplicated. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/OptionsReusingVariantsSpecVariants.html |
| VAR-017 | Variant Specifications support preview, comparison, reconfiguration, copy, revision/change-management and configuration capture; this makes the configuration specification itself a controlled object rather than transient wizard input. | VERIFIED pattern | PTC 12.0.2 Variant Specification branch; later-version detailed revision/change corroboration |
| VAR-018 | A Product Family is a governed hierarchy within a Product or Library context. It may contain nested Product Model Groups, Product Models, managed/standalone Variant Specifications and Variant Baselines. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ProdFamProductFamilyObjects.html |
| VAR-019 | Product Model Group is an organisational grouping level; Product Model is the lowest organisational level and represents a marketable product beneath which Variant Specifications are organised. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ProdFamProductFamilyObjects.html |
| VAR-020 | Managed Variant Specification is created in Product Family context under a Product Model and represents option-filter criteria for a marketable configuration; standalone Variant Specifications can also exist independently and later be inserted/referenced by Product Family structures. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ProdFamProductFamilyObjects.html |
| VAR-021 | Variant Baseline is a prototype/development snapshot associating Variant Specification revisions and selected Part revisions. Baseline member links can themselves carry status/soft attributes. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ProdFamilyVariantBaselineInformationPage.html |
| VAR-022 | Updating a Variant Specification within a Variant Baseline can move it to the latest iteration of the same revision without automatically replacing it with a newer revision. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ProdFamilyVariantBaselineInformationPage.html |
| VAR-023 | The Product Family Matrix Editor compares released and unreleased Variant Specifications/Variants against a shared configurable structure and uses released configuration/variant baselines plus option filters when resolving released variants. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ProdFamilyMatrixEditorPartStructureTable.html |
| VAR-024 | Variant Specification filtering can propagate downstream to Process Plan structures, showing that one configuration definition can constrain more than the engineering BOM. | VERIFIED | PTC 12.0.2 Options/Variants + Manufacturing Process Plan filtering branch |
| VAR-025 | Choice Where Used/traceability identifies the Parts, usage links, CAD/option structures, Option Sets and Choice Rules that depend upon a Choice, so option-model change has explicit impact scope. | VERIFIED | PTC Options and Variants → Where Used Information for a Choice branch |
| VAR-026 | Dynamic Positioning keeps positioning logic separate from overloaded CAD occurrences: Configurable Modules plus Interfaces/Locators and choice expressions resolve the physical placement of selected module variants for visualisation/CAD work. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/OptionsArchEditor.html |
| VAR-027 | A Locator represents a conceptual connection/location on a configurable module and maps generic positioning definitions to coordinate systems exposed by concrete module variants. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PMLocEditorTab.html |
| VAR-028 | NuBlox should distinguish reusable configuration dimensions/options, permissible choices, constraint/rule model, configuration specification, resolved effective structure and realised/released instance/variant. | HYPOTHESIS | NuBlox inference |
| VAR-029 | For repeatable CBE systems and standard designs, NuBlox should prefer a governed configurable definition plus rules/effectivity over cloning entire projects/assets/design structures for every variation. | HYPOTHESIS | CBE translation of verified configuration model |

## Options / variants relationship graph

```text
Product / Library
      │
      ├── Option Pool
      │    ├── Option
      │    │    └── Choice
      │    └── Global Choice Rules
      │
      ├── Option Set
      │    ├── selected Options / Choices
      │    ├── referenced Global Rules
      │    └── Local Rules
      │
      └── Configurable Product / Module
           ├── assigned/inherited Option Set
           ├── Basic / Advanced Expressions
           ├── Parameters
           ├── Constraints
           │    ├── Expression
           │    ├── Case Table
           │    └── External Application
           └── configurable structure
                    │
                    ▼
             Configure / resolve
                    │
           ┌────────┴─────────┐
           ▼                  ▼
  Variant Specification   matching existing
   configuration inputs   Variant/Specification
           │                  │
           └────────┬─────────┘
                    ▼
             Variant / solution
                    │
                    ▼
              Variant Baseline
```

Product Family organises the market/planning view above this configuration model:

```text
Product Family
├── Product Model Group
│   └── Product Model Group ...
└── Product Model
    ├── Managed Variant Specification
    ├── Variant Specification reference
    └── Variant Baseline
```

This is separate from the configurable Part structure itself.



---

# 33. CAD Documents, Part associations and build semantics

| ID | Evidence | Status | Source |
|---|---|---|---|
| CAD-001 | Windchill keeps CAD Documents and Parts as separate governed object structures connected by explicit typed associations; CAD geometry/model identity is not the same canonical thing as the enterprise Part. | VERIFIED | PTC 12.0.2 Managing CAD and Part Relationships branch |
| CAD-002 | CAD-driven design can build an analogous Windchill Part/product structure from checked-in CAD Document structure, while top-down design can work in the opposite direction from Part structure toward CAD structure. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/CADdrivenFlow.html ; PTC Top-down Design branch |
| CAD-003 | Association type controls which information a CAD Document contributes to the Part build. Windchill build rules distinguish Structure, Attribute and Representation build links. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/MCPR_BuildRulesAndLinksOview.html |
| CAD-004 | Owner association participates in Structure + Attribute + Representation build; it is the primary association for CAD information that drives the Part/product definition. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/MCPR_BuildRulesAndLinksOview.html |
| CAD-005 | Contributing Image participates in Attribute + Representation build but not Structure build. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/MCPR_BuildRulesAndLinksOview.html |
| CAD-006 | Image participates in Representation build only. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/MCPR_BuildRulesAndLinksOview.html |
| CAD-007 | Contributing Content participates in Attribute build only. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/MCPR_BuildRulesAndLinksOview.html |
| CAD-008 | Content association does not participate in the Part build process; it is suitable for descriptive/supporting CAD content such as a drawing that describes a Part without defining its product structure. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/MCPR_BuildRulesAndLinksOview.html ; later-version English usage-example corroboration |
| CAD-009 | The term 'contributing' specifically means the associated CAD object can pass attributes into the Part in addition to any representation/structure semantics of its association type. | VERIFIED — later-version English explanatory corroboration | PTC Association Usage Examples |
| CAD-010 | Build is an explicit synchronisation operation between the CAD-side and Part-side definitions. A changed CAD structure can cause the associated Part to be iterated when build changes its governed structure; no Part iteration is created when no build change results. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/MCPR_BuildRulesAndLinksOview.html |
| CAD-011 | Build can be automatic after configured events such as new CAD iteration/check-in or Send to PDM, or manually invoked; build timing is governed independently from ordinary file save. | VERIFIED pattern; exact 12.0.2 branch with later-version detailed corroboration | PTC When to Build |
| CAD-012 | Auto Associate is governed: Windchill can find matching Parts, choose association type, optionally create a Part when no match exists, restrict association types by CAD type/subtype, and control the default location of created Parts. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/MCPR_ControllingCreationOfPartsByAutoAssoc.html ; PTC Auto Associate administration branch |
| CAD-013 | Auto Associate can create a new Part only for configured association classes; out of the box the creation preference defaults to Owner-only for supported CAD tools. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/MCPR_ControllingCreationOfPartsByAutoAssoc.html |
| CAD-014 | Windchill supports explicit comparison between CAD Document structure and Part structure so asynchronous changes/divergence can be reviewed and reconciled instead of silently forcing either structure to win. | VERIFIED | PTC 12.0.2 Comparing CAD Document Structure to Part Structure / Comparing Part Structure to CAD Document Structure branches |
| CAD-015 | Top-down design supports reverse build from Part structure toward CAD Document structure, including optional update of CAD usage links after Part usage changes. | VERIFIED pattern; exact 12.0.2 Top-down branch with later-version detailed corroboration | PTC Building the CAD Structure from the Part Structure / Updating CAD Document Usage Links |
| CAD-016 | A single CAD structure can drive multiple distinct Windchill Part structures through multiple Owner associations where geometry/quantity are shared but enterprise Part attributes such as colour/material/finish differ. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/MCPR_DrivingMultiPartStruc.html |
| CAD-017 | PTC recommends Options and Variants rather than multi-owner associations when product variability becomes highly complex, showing that CAD/Part association and product configuration are separate mechanisms. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/MCPR_DrivingMultiPartStruc.html |
| CAD-018 | Configuration Context is a governed/filterable subset of a larger product structure; Design Context derives the CAD subset relevant to a design task and places the CAD Documents into a workspace for authoring. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/DICAboutDesignContext.html |
| CAD-019 | Design Context therefore represents task-specific design scope, not an administrative Product/Project context and not a copy of the whole product definition. | VERIFIED pattern | Design-in-Context evidence |
| CAD-020 | CAD drawings/models, enterprise Parts/items, representations and physical instances must remain distinct NuBlox concepts linked by typed provenance/definition relationships. | HYPOTHESIS | NuBlox inference |
| CAD-021 | NuBlox technical authoring should distinguish relationships such as DEFINES_STRUCTURE, CONTRIBUTES_ATTRIBUTES, PROVIDES_REPRESENTATION and DESCRIBES rather than treating every drawing/model attachment equivalently. | HYPOTHESIS | NuBlox translation of verified Windchill association/build semantics |
| CAD-022 | A CBE design package/zone/system task may need a task-specific design scope derived from a larger authoritative asset/system structure without cloning that entire structure. | HYPOTHESIS | CBE translation of Configuration Context / Design Context |

## CAD ↔ Part build graph

```text
CAD Document
    │
    ├── OWNER ───────────────► Part
    │     structure
    │     attributes
    │     representation
    │
    ├── CONTRIBUTING IMAGE ─► Part
    │     attributes
    │     representation
    │
    ├── IMAGE ───────────────► Part
    │     representation
    │
    ├── CONTRIBUTING CONTENT ► Part
    │     attributes
    │
    └── CONTENT ─────────────► Part
          descriptive relationship only

CAD Document Structure
        │
        │ build / compare / reconcile
        ▼
Part / Product Structure

Part / Product Structure
        │
        │ reverse build where governed
        ▼
CAD Document Structure
```

The relationship type determines **what authority the CAD object has over the Part definition**. File presence alone does not.



---

# 34. Digital Product Traceability and external requirements

| ID | Evidence | Status | Source |
|---|---|---|---|
| DPT-001 | Windchill Digital Product Traceability links native Windchill traceable objects to requirements/architecture resources whose authoritative records remain in external OSLC systems. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/NewandChanged_12_0_00_WindchillALMIntegration.html |
| DPT-002 | External requirement/architecture resources can be represented to Windchill as remote resource types without importing them as native Windchill product objects. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ChgMgmtRemoteAbout.html |
| DPT-003 | Remote affected objects can participate in local Problem Report, Variance and Change Request affected-object relationships while remaining externally managed. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ChgMgmtRemoteAbout.html |
| DPT-004 | Out-of-the-box trace semantics distinguish Allocate, Satisfy and Implement relationships. Allocate associates high-level requirement intent with high-level Part/assembly scope; Satisfy records that a Windchill object fulfils a remote requirement; Implement links a Windchill object to a remote architecture item. | VERIFIED pattern; exact 12.0.2 DPT branch with later-version detailed corroboration | PTC Traced To / Working with Traces |
| DPT-005 | Windchill models requirement and architecture external resources, plus separate modeled trace-link types, allowing relationship constraints/subtypes rather than a generic URL-only link. | VERIFIED — later-version detailed corroboration of 12.0.2 DPT model | PTC System Compatibility and Requirements |
| DPT-006 | External resource data is fetched/displayed through the connected external system rather than requiring the authoritative requirement content to be duplicated into Windchill. | VERIFIED pattern | DPT Traced To / OSLC integration evidence |
| DPT-007 | DPT supports a Suspect state on trace links. External-resource modification can cause the Windchill trace relationship to be visibly flagged so downstream engineers can assess impact and clear the flag after review. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/NewandChanged_12_0_00_WindchillALMIntegration.html |
| DPT-008 | Trace relationships participate in Windchill version history rather than floating outside version control. Satisfy/Implement changes can create new iterations; trace-link copy-forward behaviour differs by link type. | VERIFIED pattern; later-version detailed corroboration | PTC Working with Traces / Managing Trace Links |
| DPT-009 | Allocate trace semantics are revision-oriented/high-level: the link is propagated across iterations of a revision, whereas Satisfy/Implement are introduced from the iteration where the relationship becomes true and remain visible forward. | VERIFIED — later-version detailed corroboration | PTC Working with Traces |
| DPT-010 | Removing Satisfy/Implement from a later version does not erase the historical relationship from earlier versions; the changed trace state is represented through versioning. | VERIFIED — later-version detailed corroboration | PTC Managing Trace Links |
| DPT-011 | Trace-link management is itself permission/profile controlled; DPT relationship management is not merely unrestricted hyperlink creation. | VERIFIED pattern | PTC DPT profile/action visibility evidence |
| DPT-012 | Remote affected resources have limitations compared with native objects: for example, Windchill business rules are not supported for remote affected object types, and remote objects in Packages are preview-only rather than imported/exported. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ChgMgmtRemoteAbout.html |
| DPT-013 | NuBlox should distinguish Authoritative Requirement, External Resource Reference, typed Trace Relationship, trace version/provenance and Suspect/impact-review state. | HYPOTHESIS | NuBlox inference |
| DPT-014 | NuBlox should be able to retain requirements in specialist authoritative tools while natively governing the typed evidence that a design, calculation, document, asset, test/control characteristic or work product allocates/satisfies/implements that requirement. | HYPOTHESIS | CBE/interoperability translation |
| DPT-015 | Requirement change should create an explicit downstream impact/suspect condition requiring review rather than silently assuming prior satisfaction remains valid. | HYPOTHESIS | NuBlox translation of verified DPT suspect semantics |

## Traceability graph

```text
Authoritative external system
│
├── Requirement Resource
└── Architecture Resource
          │
          │ OSLC / typed trace
          ▼
Windchill Trace Link
├── ALLOCATE
├── SATISFY
└── IMPLEMENT
          │
          ▼
Windchill traceable object/version
Part / Document / Option / Choice /
Resource / Control Characteristic ...
          │
          │ external resource changes
          ▼
SUSPECT TRACE
          │
          ▼
impact review
          │
          ├── relationship still valid → clear suspect
          └── design/change action required
```

The trace is itself governed evidence. It is not equivalent to copying the remote requirement into the local object.


# 24. Source-version policy

The primary target is **Windchill Cloud 12.0.2.0**, matching the Help Center Stephen specified.

Where a specific 12.0.2.0 page is unavailable/indexed poorly, later-version PTC documentation may be used only as **fallback evidence** and must be labelled as such before it is treated as canonical for this study.

---

# 25. Architecture hold

No further NuBlox architecture or implementation should be treated as accepted solely from this register.

Required sequence:

```text
PTC Help Center traversal
        ↓
verified Windchill object/relationship graph
        ↓
gaps / variants / inheritance rules closed
        ↓
NuBlox requirement mapping
        ↓
NuBlox canonical model
        ↓
architecture decisions
        ↓
implementation
```

The current Teams/Contexts experiment already present in the application must therefore be treated as **reversible and non-canonical** until this research closes the relevant gaps.
