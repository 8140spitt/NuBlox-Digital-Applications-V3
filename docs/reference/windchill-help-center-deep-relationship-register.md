# PTC Windchill Help Center — Deep Capability & Relationship Register

**Status:** Active evidence register — research in progress  
**Primary source:** PTC Windchill Cloud 12.0.2.0 Help Center  
**Started:** 22 September 2026  
**Last updated:** 23 September 2026  
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
| SEC-008 | Effective policy ACLs are derived from the policy of the object's domain plus policies of ancestor domains; ad-hoc ACLs are then evaluated alongside those policy ACLs. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/ru/Windchill_Help_Center/AccessControlChp_AccessCtrlPolicyRuleAbout.html |
| SEC-009 | For lifecycle-managed objects, domain + object type + lifecycle state select the applicable policy ACL, while lifecycle/workflow role bindings can contribute object-stored ad-hoc ACL permissions for the duration of a phase/activity. | VERIFIED | https://support.ptc.com/help/windchill/plus/r12.0.2.0/en/Windchill_Help_Center/AccessControlChp_LCManageInfo.html |
| SEC-010 | Foldered objects inherit their associated domain from the parent unless explicitly assigned another domain; moving an inheriting folder can therefore change its effective policy domain, while explicitly assigned domains persist unless remapped during a cross-context move. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/AccessControlChp_WCFolderObjDomainInherit.html |

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
| LFW-030 | With the default role-resolution behaviour, Windchill resolves each lifecycle role in this order: direct Team Template role participants; mapped Team Template role participants; lifecycle-defined participants; additional occupants of the same role from the object's Context Team; workflow-only roles when the workflow starts; and finally unused Team Template roles. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/TeamTemplateAdminDefaultBehavior.html |
| LFW-031 | Team Templates are available in Site, Organisation, Product and Library contexts but the Team Templates view is not available in Windchill ProjectLink; ProjectLink therefore has materially different team-resolution semantics from PDMLink Product/Library contexts. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/TemplatesTableAbout.html |




---

# 7. Revision, iteration, workspace and commonspace

| ID | Evidence | Status | Source |
|---|---|---|---|
| VER-001 | Revision, iteration, lifecycle state, working state and view are separate axes. | VERIFIED | PTC version-control branches |
| VER-002 | Check-in creates a new iteration; Revise creates a new revision. | VERIFIED | PTC PDM/Revise branches |
| VER-003 | Workspace is a controlled work-in-progress area; commonspace is the shared authoritative area. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WWGMGenericOverviewCapabilitiesCommonPDM.html |
| VER-004 | Workspace Update resolves objects against the workspace configuration specification and commonspace changes. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WWGMGenericOverviewCapabilitiesCommonPDM.html |
| VER-005 | NuBlox must not treat every save, check-in, revision, promotion and change as the same operation. | HYPOTHESIS | NuBlox inference |
| VER-006 | A new Part view version inherits the parent-view information/structure at derivation time but can then be modified and maintained separately in the child view. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PMNewViewVersionCreate.html |
| VER-007 | View hierarchy is parent/child with one root view; view-dependent Part versions can be derived down that hierarchy (for example Engineering → Manufacturing → plant views). | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ViewAdminViewWorkWith.html |
| VER-008 | The first version in a new view starts its own revision sequence, independent from the parent view, and each view-dependent version follows its own lifecycle process. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ViewAdminViewWorkWith.html |

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
| STR-008 | CAD↔Part association types carry different build semantics: Owner builds structure + attributes + representation; Contributing Image builds attributes + representation; Image builds representation only; Contributing Content builds attributes only; Content does not participate in the build process. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/MCPR_BuildRulesAndLinksOview.html |
| STR-009 | Build rules can iterate the corresponding Part only when the built structure actually changes; the CAD association/build relationship therefore governs propagation rather than making CAD and Part the same object. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/MCPR_BuildRulesAndLinksOview.html |

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
| CFG-007 | As Stored configuration is created at check-in as a snapshot of the workspace contents used for that checked-in iteration and can later be used to reconstruct/retrieve the same assembly or drawing dependency state. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WWGMInvAdminEnableasStored.html |
| CFG-008 | As Stored is not equivalent to Baseline: As Stored is an automatic authoring/check-in snapshot, while Baseline is an explicit separately managed object created to capture a chosen configuration. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WWGMInvAdminEnableasStored.html |
| CFG-009 | Managed Collection Refresh reapplies the collection options to the initially selected objects and can therefore resolve updated versions/dependencies over time rather than remaining a frozen point-in-time snapshot. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/MgdCollectionInfo.html |
| CFG-010 | Option-filter configuration can independently resolve rule/expression versions by Latest lifecycle state, Date Effectivity, or Unit Effectivity such as serial/MSN or lot/block. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/OptionsConfigSpecRules.html |

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
| SUP-008 | Manufacturer/Vendor supplier objects have lifecycle state; the standard Supplier lifecycle exposes In Work, Released and Canceled states. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/SumaSupplierLifeCycleSet.html |
| SUP-009 | An Organisation can assign a different supplier lifecycle template to Manufacturer/Vendor object types through lifecycle Object Initialisation Rules; newly created suppliers then use that configured lifecycle. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/SumaConfigureLifecycleTemplate.html |
| SUP-010 | Windchill Supplier Management is not supported in Program contexts, reinforcing that capability availability is context-type-specific rather than uniform. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/SumaSuppTabAbout.html |

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
| PKG-008 | Received Delivery mapping explicitly supports Context, Owning Organisation, View, Lifecycle, Folder, Security Label and Version mappings before import into the target system. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ReceivedDeliveryLCMap.html |
| PKG-009 | Windchill import/export supports transformation/mapping rules using special rules, XSL or Java-backed mappings to adapt source data to target-environment semantics and resolve import conflicts. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ExpImpPolicyRulesChp_MapRule.html |
| PKG-010 | Change-management import/export can preserve change-association status plus process and reference links; change objects replicated into a target system remain read-only. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ChgMgmtChgAssocImportExport.html |

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
| PLT-007 | Windchill REST Services exposes domain-specific OData entities/actions such as Document Management structure entities/actions rather than a single generic object endpoint; pagination and expansion depth are centrally configurable framework concerns. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/wrs_generalcapabilities_12_0_2_20.html |
| PLT-008 | Windchill ESI treats a failed downstream publish as a failed release; resubmission creates a new transaction for each failed MES/distribution-target instance and republishes only to the targets that failed, normally sending only objects changed since the last successful publication. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/MES_Impl_TransMgmt_Resubmission.html |
| PLT-009 | ESI resubmission is a new publication transaction rather than replaying a stored downstream transaction payload, preserving Windchill/ESI as the publication source of truth. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/MES_Impl_TransMgmt_Resubmission.html |
| PLT-010 | Windchill ESI result messages carry the source object's federation identifier, downstream object identifier/description, object class and action (create/change/delete/unchanged), enabling per-object/per-target integration outcome correlation rather than only transport-level success/failure. | VERIFIED — official PTC 12.0.2 Help Center, Italian locale where English page was not indexed by the research tool | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/it/Windchill_Help_Center/ESISAPResultService.html |

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



---

# 35. Profiles, UI visibility and preference inheritance

| ID | Evidence | Status | Source |
|---|---|---|---|
| PRF-001 | Standard Profiles are Site/Organisation-managed UI-governance objects that control visibility of actions, interface areas and reusable attributes for associated users, groups and organisations. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ProfileMgmtProfileCreate.html |
| PRF-002 | Profile action visibility is context-sensitive: Product, Project, Library, Program and Global visibility can be configured separately. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ProfileMgmtActionsTableRef.html |
| PRF-003 | Profile attribute visibility is also governed separately through reusable-attribute constraints. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ProfileMgmtSoftAttrTableRef.html |
| PRF-004 | A participant can belong to multiple Standard Profiles; Windchill combines them using the least-restrictive visibility result. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ProfileMgmtAbout.html |
| PRF-005 | Organisation Standard Profiles are peers to Site Standard Profiles unless they share the same name, in which case the Organisation profile overrides the Site profile with that name. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ProfileMgmtProfileCreate.html |
| PRF-006 | Context-level role visibility is distinct from Standard Profile visibility and can override profile visibility within the specific application context. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WCCG_UICust_AddActionsHook_ActionVis.html |
| PRF-007 | Role-based action visibility is explicitly not access-control permission; it governs what appears in the interface for a role in that context. | VERIFIED pattern; 12.0.2 role-visibility branch with later-version explicit wording | PTC Configuring Visibility of Actions for Roles |
| PRF-008 | License Profiles are another separate layer used to expose capabilities associated with Windchill licence entitlements; they are not ordinary Standard Profiles. | VERIFIED pattern; 12.0.2 license-profile branch with later-version detailed corroboration | PTC Managing License Profiles |
| PRF-009 | NuBlox should therefore keep Product/Feature Entitlement, UI Visibility and Operation Permission as separate evaluations. | HYPOTHESIS | NuBlox inference |

| ID | Evidence | Status | Source |
|---|---|---|---|
| PREF-001 | Preference values can be administered at Site, Organisation and application-context levels and may also be available to individual users. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WCAdminContextPrefAdmin.html |
| PREF-002 | Preferences inherit down Site → Organisation → application context when no lower-context value is explicitly set. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WCAdminContextPrefAdmin.html |
| PREF-003 | An application context or user may override an inherited preference when the preference is available at that scope and is not locked above. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WCAdminContextPrefAdmin.html |
| PREF-004 | Preferences can be locked at any administrative level above the user, preventing lower-level overrides. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WCAdminContextPrefAdmin.html |
| PREF-005 | Site/Organisation administrators can delete lower child-instance values for a preference, re-establishing inherited behaviour from the higher context. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WCAdminContextPrefAdmin.html |
| PREF-006 | If no explicit value exists at any applicable context, Windchill falls back to the preference's defined default value. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WCAdminContextPrefAdmin.html |
| PREF-007 | NuBlox likely needs an effective-setting resolver that records value, source scope, inherited/overridden state and lock status rather than copying settings into every child context. | HYPOTHESIS | NuBlox inference |

---

# 36. Security Labels, clearance and Agreements

| ID | Evidence | Status | Source |
|---|---|---|---|
| CLR-001 | Security Labels are evaluated in addition to policy/ad-hoc access-control permissions. Clearance cannot substitute for missing permissions, and permissions cannot substitute for missing label clearance. | VERIFIED; 12.0.2 branch with later-version exact explanatory corroboration | PTC Security Labels and Access Control |
| CLR-002 | A user must be cleared for every restrictive security-label value applied to an object before access is granted. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/SecurityLabelConfigBeforeBegin.html |
| CLR-003 | Authorized participants for a label value may be users, groups or organisations; group-based clearance can be maintained through participant/group membership. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/SecurityLabelAdminAuthParticipantManage.html |
| CLR-004 | A label may be informative rather than restrictive when no authorized participant is configured for its value. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/SecurityLabelConfigBeforeBegin.html |
| CLR-005 | Security-label changes can be configured to apply only to edited versions or across all versions, so classification/clearance state is explicitly version-sensitive. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/SecurityLabelConfigBeforeBegin.html |
| CLR-006 | Agreements provide temporary/exceptional clearance for participants who are not ordinarily authorized for a label value; they still require underlying access-control permission on the object. | VERIFIED pattern; exact 12.0.2 agreement branch with later-version explanatory corroboration | PTC Accessing Objects Through an Agreement |
| CLR-007 | Agreements can be Standard or context-based. Standard agreements authorize selected objects within their scope; context-based agreements can authorize security-labeled objects residing in the agreement's context. | VERIFIED pattern; 12.0.2 agreement branch with later-version detailed corroboration | PTC Agreement Authorized Objects / Creating Agreements |
| CLR-008 | Agreement authorization can be constrained by authorized participants, label values, objects/contexts, object revisions and lifecycle states. | VERIFIED pattern; exact 12.0.2 agreement branch with later-version detailed corroboration | PTC Agreements |
| CLR-009 | Agreement Status is distinct from agreement Lifecycle State. Effective status derives from lifecycle approval plus version, start time, end time and current time, producing Pending, Active, Expired, Superseded or Inactive states. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/AgreementStatus.html |
| CLR-010 | Only the appropriate latest approved Active Agreement can authorize access; expired/superseded/inactive agreements no longer provide clearance even if their historical lifecycle/evidence remains. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/AgreementStatus.html |
| CLR-011 | Agreement start/end dates define the temporal window in which an otherwise approved agreement may become Active. | VERIFIED pattern; 12.0.2 branch with later-version exact-content corroboration | PTC Agreement Starting and Ending Dates |
| CLR-012 | Agreement lifecycle and effective status are therefore separate dimensions: lifecycle governs approval progression while effective status answers whether the agreement is currently in force. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/AgreementStatus.html |
| CLR-013 | Security Labels participate in object creation, history, subscription/audit, copy/save-as/revise/move, import/export, visualization and related integrations rather than being a UI-only marking. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/sublandingpages/SublandingPageSecurityLabel.html |
| CLR-014 | NuBlox information governance should keep operation Permission, information Clearance, UI Visibility, product Entitlement and business Authority distinct, composable controls. | HYPOTHESIS | NuBlox inference |
| CLR-015 | NuBlox temporary controlled-access mechanisms should retain subject, scope, authorised participants, exact governed objects/configurations, permitted classification values, effective period, approval lifecycle and audit evidence rather than merely adding a user to a permanent role. | HYPOTHESIS | NuBlox inference |



---

# 37. Search, indexing and reusable search definitions

| ID | Evidence | Status | Source |
|---|---|---|---|
| SRCH-001 | Windchill has two materially different search engines: database search and optional Windchill Index Search. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WCSysAdminIndexSearchIntro.html |
| SRCH-002 | Index Search searches indexed metadata and primary content, whereas non-indexed keyword search is primarily database/attribute based and cannot full-text search primary content. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/LclSrchAdvancedKeyword.html |
| SRCH-003 | Advanced Search composes object Type, Context, attribute Criteria, keyword criteria and Related Object criteria rather than only free-text search. | VERIFIED | PTC Windchill Search / Advanced Search branch |
| SRCH-004 | Related-object search is a first-class search dimension, reinforcing that relationship graph traversal is part of retrieval rather than only object-local metadata filtering. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/LclSrchAdvancedRelatedObject.html |
| SRCH-005 | Search behaviour is version/iteration aware and indexed search has documented caveats for non-latest iteration queries because indexed keyword filtering and version criteria can be resolved in separate phases. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/LclSrchAdvancedSearchExampleNonLatest.html |
| SRCH-006 | Content mastered in remote vaults is not full-text indexed; attribute search remains available. | VERIFIED | PTC Windchill Index Search architecture/upgrade branch |
| SRCH-007 | Search criteria sets can be saved by users; administrators can also create saved searches and assign them to groups of users. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/CADxDBSearchLclSrchSearchSave.html |
| SRCH-008 | Windchill additionally supports special searches within folders, tables and networks, search history and faceted results. | VERIFIED | PTC Windchill Search branch |
| SRCH-009 | NuBlox should distinguish transactional/object-query search, relationship-aware search and indexed metadata/content search while presenting a coherent search experience. | HYPOTHESIS | NuBlox inference |
| SRCH-010 | Search results must remain security-aware and version/configuration-aware; an index result cannot be treated as the authoritative business-object state by itself. | HYPOTHESIS | NuBlox inference based on Windchill search/version/security separation |

---

# 38. Representations, annotations and publishing

| ID | Evidence | Status | Source |
|---|---|---|---|
| VIS-001 | A Representation is a derived/viewable rendition associated with a governed source object or structure and is separate from that authoritative source definition/content. | VERIFIED | PTC Windchill Visualization Services / Representations branches |
| VIS-002 | An object can have multiple Representations and one may be designated as the Default Representation. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/VisualRepCreateClipboardContent.html |
| VIS-003 | Representations can be created from governed content/structures and submitted as asynchronous Publish Jobs rather than being ordinary synchronous file transformations. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/sis4023.html |
| VIS-004 | Publish Rules govern how publishing output is generated and can control fidelity, output parameters, triggers and post-publish behaviour. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WVSMultiFedConfiguration.html ; PTC WVS Publish Rules branch |
| VIS-005 | Publishing can produce different derived outputs from different governed sources: for example Publication Structures to PDF/XSL/HTML/XML bundles, Parts Lists to graphical structures, and Information Structures to delivery bundles. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/sis7000.html |
| VIS-006 | Publishing jobs are monitored and executed through WVS/VCS/background processing infrastructure with prioritised/shared/dedicated queues and worker/service capacity. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/Manage_WVS_Queues_and_Jobs.html ; https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/VisualAdmin_VCSOview.html |
| VIS-007 | Service publishing supports incremental output using the same publishing rule/configuration specification as the original full publication, showing that derived deliverables can have controlled delta-publication semantics. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/sis7007.html |
| VIS-008 | Representation validity/copy-forward is governed independently from source-object versioning; Windchill can configure when representations/markups are copied forward between iterations without pretending the derivative is the source. | VERIFIED | https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WVSVisualizationCopyForwardProperties.html |
| VIS-009 | Annotations/markups are separate governed collaborative artifacts associated with viewables/representations rather than modifications to the authoritative source geometry/content itself. | VERIFIED pattern | PTC Representations/Annotations and Creo View branches |
| VIS-010 | NuBlox should distinguish Authoritative Content/Model, Representation/Rendition, Publishing Definition/Rule, Publish Job, Published Output and Annotation/Markup. | HYPOTHESIS | NuBlox inference |
| VIS-011 | CBE issue PDFs, model viewables, thumbnails, issued renditions and published O&M outputs should retain source/version/configuration provenance rather than becoming detached duplicate files. | HYPOTHESIS | CBE translation |



---

# 39. Reporting, report definitions and retained report instances

| ID | Evidence | Status | Source |
|---|---|---|---|
| RPT-001 | A Windchill Report is a reusable reporting/query definition that executes against business information and may prompt for runtime input parameters. | VERIFIED | PTC Windchill 12.0.2.0 Report Information Page |
| RPT-002 | A Report object can carry display-context configuration, an input page, resource bundle, reporting-engine selection and report-detail configuration. | VERIFIED | PTC Windchill 12.0.2.0 Report Information Page |
| RPT-003 | ReportTemplate is itself a persistent Windchill business object containing a Query Builder query definition; Windchill APIs executing ReportTemplate queries apply Windchill business logic and access-control processing. | VERIFIED | PTC Query Builder / ReportTemplate 12.0.2.0 branch |
| RPT-004 | A Report Instance is different from the Report definition: it is a snapshot produced when a report is executed at a particular time with particular input parameters, including the output data/formatting from that execution. | VERIFIED | PTC Windchill 12.0.2.0 Viewing a Report Instance |
| RPT-005 | Two Report Instances of the same Report may legitimately differ because the underlying business data changed between executions. | VERIFIED | PTC Windchill 12.0.2.0 Viewing a Report Instance |
| RPT-006 | A Report View saves report-input parameters for repeat execution; it is distinct from the historical output captured by a Report Instance. | VERIFIED | PTC Windchill 12.0.2.0 Viewing a Report Instance |
| RPT-007 | Windchill Business Reporting supports scheduled/recurring execution and delivery in formats including HTML, PDF, Excel, CSV and XML, with delivery mechanisms including email/file/report-view-style outputs. | VERIFIED | PTC Windchill 12.0.2.0 Business Reporting |
| RPT-008 | Query Builder, Info*Engine and optional report-authoring engines provide different report-definition/data-source mechanisms rather than one universal reporting implementation. | VERIFIED | PTC Reporting / Report Authoring branches |
| RPT-009 | Project/Planning reports can exist independently from optional enterprise Business Reporting infrastructure, showing that operational reports and enterprise BI/report-authoring are distinct capability layers. | VERIFIED | PTC Project Planning Reports branch |
| RPT-010 | External/optional business-reporting engines require their own security configuration; their data-access semantics must not be assumed to be identical to Windchill object-level access enforcement unless configured accordingly. | VERIFIED | PTC Windchill Business Reporting security guidance |
| RPT-011 | NuBlox should distinguish Report Definition, saved input/view, Report Execution, retained Report Instance and published/exported Representation. | HYPOTHESIS | NuBlox inference |
| RPT-012 | Governed board, project, regulatory, audit and contractual reports should be able to retain the exact executed output and parameters as evidence rather than relying only on rerunning a live query later. | HYPOTHESIS | NuBlox inference |

---

# 40. Audit framework, events, subscriptions and notification evidence

| ID | Evidence | Status | Source |
|---|---|---|---|
| AUD-001 | Windchill has a dedicated Auditing Event Framework with configurable event recording, security-audit reporting, audit-log purge administration and scheduled purge management. | VERIFIED | PTC Windchill 12.0.2.0 Auditing Event Framework branch |
| AUD-002 | Audit capture is event-driven. Windchill configAudit configuration identifies auditable service/summary events rather than merely recording every database CRUD statement. | VERIFIED | PTC Windchill 12.0.2.0 Sample configAudit.xml |
| AUD-003 | Configurable auditable events include team-role changes, version-control events, association/disassociation, security-label acknowledgements, change implementation, PDM checkout, lifecycle/identity changes, check-in/out, creation/deletion/copy, import/export, content changes, access-policy changes, product-structure changes, security-label changes, team changes, move/share/revise, login/logout, content read/download, representation view, failed authorization and search-audit events. | VERIFIED | PTC Windchill 12.0.2.0 Sample configAudit.xml |
| AUD-004 | Not every event in the sample configuration is necessarily enabled by default; audit policy is explicitly configurable and must distinguish available event types from enabled capture. | VERIFIED | PTC Windchill 12.0.2.0 Sample configAudit.xml |
| AUD-005 | Audit records retain event-time context about the target and actor, including attributes such as user/organisation, object identity/version, context and event-specific additional information. | VERIFIED pattern; 12.0.2 auditing branch with later-version detailed corroboration | PTC Auditing Event Framework / Attributes Captured with Events |
| AUD-006 | Summary Events are meaningful application-level events designed to record higher-level business activity independently from low-level service implementation detail. | VERIFIED pattern; 12.0.2 branch with later-version detailed corroboration | PTC Summary Events |
| AUD-007 | Service Events originate in Windchill's service-event architecture and can be listened to by application services; selected service events can also be enabled for audit capture. | VERIFIED pattern; 12.0.2 branch with later-version detailed corroboration | PTC Service Events |
| AUD-008 | Security Audit Reporting can query retained audit evidence by time, event, organisation, context/context type, object/object type and user, and can export/save audit queries. | VERIFIED pattern; 12.0.2 branch with later-version detailed corroboration | PTC Security Audit Reporting |
| AUD-009 | Audit-log purge is separately administered and itself leaves purge-management history; retention/purge is therefore a governed operational concern rather than implicit database housekeeping. | VERIFIED | PTC Windchill 12.0.2.0 Audit Log Purge Management branch |
| AUD-010 | A Subscription is a user-configured notification interest over an object, folder or context and selected event types. It is not the audit record itself. | VERIFIED | PTC Windchill 12.0.2.0 Subscribe |
| AUD-011 | Subscriptions can target all versions, selected object types within folders/contexts, immediate or digest delivery, subject/message and expiry. | VERIFIED | PTC Windchill 12.0.2.0 Subscribe |
| AUD-012 | Subscription delivery remains access-aware: subscribers generally receive notifications only for objects they are allowed to access, with documented event-specific exceptions such as deletion. | VERIFIED | PTC Windchill 12.0.2.0 Subscribe |
| AUD-013 | Project-plan subscriptions expose domain-specific events such as deadline, owner, percent-complete, risk and status changes, showing that notification events can be business-semantic rather than generic record-update messages. | VERIFIED | PTC Windchill 12.0.2.0 Plan-item subscription events |
| AUD-014 | Notification configuration maps event categories/object types to user-facing notifications and can specialise/override delivery behaviour independently from audit-event retention. | VERIFIED | PTC Windchill 12.0.2.0 Notification Configuration branch |
| AUD-015 | NuBlox should distinguish Domain/Service Event, Audit Record, Subscription, Notification Delivery and Integration Event/Outbox message, even where one business event feeds all of them. | HYPOTHESIS | NuBlox inference |
| AUD-016 | NuBlox audit evidence should capture actor, authority/role where relevant, event type, exact target identity/version/configuration, context, before/after or event-specific payload, timestamp and provenance so historical decisions remain reconstructable. | HYPOTHESIS | NuBlox inference |
| AUD-017 | Audit/event retention should be governed by explicit retention/purge policy and legal/records requirements rather than coupled to transactional-object deletion. | HYPOTHESIS | NuBlox inference |

## Evidence/event separation

```text
Business operation
       │
       ▼
Domain / Service Event
       │
       ├──► Audit Record
       │      durable historical evidence
       │
       ├──► Subscription match
       │      user interest
       │        ↓
       │     Notification
       │
       ├──► Integration / Outbox
       │      downstream system event
       │
       └──► Reporting / analytics input

Report Definition
       │
       ├── saved Report View / parameters
       │
       └── execute at T1
              ↓
         Report Instance
         snapshot of output at T1
```

Audit history and Report Instances solve different evidence problems and should not be collapsed.


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


---

# 41. Research checkpoints

## 23 September 2026 — physical lifecycle, quality and exchange closure pass

This checkpoint records the latest evidence incorporated into this register so the research does not exist only in conversation history.

### Verified areas incorporated

- Quality process boundaries: Nonconformance, Deviation, Waiver, CAPA, disposition, effectiveness verification and release remain separate controls.
- Inspection definition is distinct from inspection execution/result capture; Control Characteristics are governed definitions that can be associated with Parts, Process Plans and Operations.
- Physical Part Instances are separate from design definition and may carry serial/lot identity, allocated child instances and incorporation dates.
- As-maintained physical configuration can evolve independently from the latest engineering definition while retaining historical traceability.
- Supplier identity, supplier relationship and OEM-part ↔ supplier-part sourcing approval are separate governed concepts.
- Manufacturing resources and capabilities are first-class objects rather than free-text task attributes.
- Service Information structures, publication structures, Parts Lists and published representations remain separate governed layers with applicability/effectivity.
- Package/Delivery and Received Delivery preserve source authority and support explicit mapping/import semantics; receipt does not imply technical acceptance.
- Full versus incremental delivery semantics are materially different; incremental delivery can carry moves/deletions relative to a base.
- Construction commissioning/test-pack/handover remains a Windchill coverage gap requiring independent CBE research.

### Current architectural hold

No NuBlox application architecture is to be changed from these findings until the unresolved Help Center gaps are closed and the evidence is translated into a NuBlox canonical object/relationship model.

### Immediate research queue

1. Group vs Shared Team vs Context Team exact use rules by context type.
2. PDMLink vs ProjectLink team-template/role-resolution differences.
3. Policy-domain inheritance and override composition.
4. Revision/iteration/view/configuration semantics by object family.
5. CAD ↔ Part association/build-rule matrix.
6. Configuration/effectivity resolution matrix.
7. Change/redline concurrency and merge semantics.
8. Supplier qualification lifecycle.
9. Physical-instance maintenance-event relationships.
10. Package/Received Delivery authority-transfer edge cases.
11. REST domain catalogue and integration transaction/error/retry behaviour.
12. Remaining Help Center top-level categories not yet represented.


## 23 September 2026 — context, access, configuration and concurrent-change checkpoint

This checkpoint records the next completed evidence wave.

### Evidence incorporated into dedicated reference models

- Context participation now distinguishes Organisation Groups, Shared Teams, application Context Teams, role system groups, Object Teams, Team Templates and runtime workflow participant resolution.
- PDMLink-style Team Template role resolution is separated from ProjectLink, which does not use Team Templates.
- Shared Team reuse is separated from policy inheritance even though a Shared Team creates a policy domain inherited by consuming application contexts.
- Effective access-control composition now includes ancestor-domain inheritance, ancestor-type inheritance, lifecycle-state matching, dynamic-role resolution, Grant/Deny/Absolute Deny precedence, object-specific ad-hoc ACLs and Administrative Lock.
- Product/Library Master → Revision → Iteration semantics are separated from Project/Program object behaviour, and Part View versions are documented as independently revisable/lifecycled branches.
- Managed Baseline, Managed Collection and Plan Baseline are separated by mutability/snapshot semantics.
- Option Set revision behaviour and Service Structure version/regeneration behaviour have been added to the object-family matrix.
- CAD ↔ Part associations are decomposed into five semantic relationship types with explicit Structure / Attribute / Representation build authority.
- Build execution, reverse build, compare/reconciliation, deleted-occurrence propagation state and Design Context are separated from the CAD ↔ Part relationship itself.
- Configuration Specifications now distinguish Latest, As Matured, Baseline, Change, Unit Effectivity, Date Effectivity, Promotion Request and As Stored as separate version-resolution authorities.
- Redlines are now modelled as concurrent proposed-change branches which iterate independently, merge during controlled Revise, synchronize/rebase when another result is released, and raise granular Suspect conflicts instead of using whole-object last-write-wins.

### Dedicated evidence artefacts

- \`windchill-context-team-participation-model.md\`
- \`windchill-context-team-participation-matrix.csv\`
- \`windchill-access-control-composition-model.md\`
- \`windchill-access-control-precedence-matrix.csv\`
- \`windchill-version-configuration-semantics.md\`
- \`windchill-version-object-family-matrix.csv\`
- \`windchill-cad-part-association-build-model.md\`
- \`windchill-cad-part-association-matrix.csv\`
- \`windchill-configuration-effectivity-resolution-model.md\`
- \`windchill-configuration-specification-matrix.csv\`
- \`windchill-change-redline-concurrency-model.md\`
- \`windchill-redline-conflict-resolution-matrix.csv\`

### Refined immediate research queue

1. Package / Received Delivery authority-transfer and downgrade/security edge cases.
2. REST Services complete domain/entity/action catalogue.
3. ESI transaction, source-authority, error and retry semantics.
4. Import/export/migration object/version/security preservation matrix.
5. Quality submodule versionability and remaining version-object-family edge cases.
6. MPMLink Process Plan / Operation / Resource version semantics.
7. Remaining top-level Help Center categories, system operations and customization framework.


### Supplier Management closure note

Windchill Supplier Management has now been decomposed into Supplier/Organisation identity, Supplier lifecycle, OEM/Manufacturer/Vendor Parts, AML/AVL relationship status, Sourcing Context, Sourcing Rule and Part Request. The critical distinction is that a Released Supplier is not equivalent to an Approved supplier-Part source: Preferred / Approved / Do Not Use is contextual relationship state. Comprehensive construction supplier qualification, assessment, audit, compliance, performance and reassessment remains outside the first-class semantics established by this Windchill evidence and is therefore retained as an external-market/CBE gap.


### Physical-instance / as-maintained closure note

Windchill Part Configuration and Part Instance now provide a verified benchmark for definition vs configured state vs serial/lot-traced physical identity, parent/child physical allocation, incorporation dates and occurrence-specific field replacement. This is sufficient to benchmark as-maintained configuration history. The first-class maintenance transaction itself — work orders, PM regimes, inspections, failures, labour/resources, readings and return-to-service — remains outside the semantics established by this branch and is retained as a NuBlox CBE/EAM gap.
