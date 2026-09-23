# PTC Windchill — Context, Team, Participation and Policy-Domain Model

**Status:** Verified benchmark evidence — research checkpoint  
**Primary source:** PTC Windchill Cloud 12.0.2.0 Help Center  
**Last updated:** 23 September 2026  
**Purpose:** Close the Group vs Shared Team vs Context Team vs Object Team distinction, document PDMLink/ProjectLink role-resolution differences, and capture the relationship between team reuse and policy-domain inheritance before any NuBlox architecture is frozen.

> This is benchmark evidence. It does not, by itself, make a NuBlox architecture decision.

## 1. Context is not a business function

Windchill defines three general context levels:

- **Site** — the single top-level administrative context.
- **Organisation** — an administrative context beneath Site.
- **Application Context** — one of Product, Library, Project or Program beneath an Organisation.

An application context is a governed work container bringing together information, participation and process. It is not a business-function classification.

For NuBlox research this means F01–F29 must not be treated as Windchill-style context types merely because they are user-facing functional workspaces.

## 2. Participation mechanisms are separate concepts

| Mechanism | Defined/owned at | Purpose | Reuse / scope | Relationship to access and work |
|---|---|---|---|---|
| User-defined Group | Site or Organisation / directory | Stable collection of participants | Reusable | May be used in teams and access-control rules; group membership changes can flow into team participation |
| Organisation Role vocabulary | Organisation | Defines roles available for application-context participation | Reusable within the organisation | Provides role semantics; it is not itself a team |
| Shared Team | Organisation | Reusable roles + members for multiple application contexts | Reusable by child application contexts in the same organisation | Creates a Shared Team policy domain; may be locally extendable |
| Context Team | Product / Library / Project / Program | People/groups assigned to roles for one application context | Context-specific | Drives context participation; each role has a system group usable by policy access control |
| Role System Group | Generated for a role | Materialises effective role membership | Context/team-specific | Can be targeted by access-control policy |
| Team Members System Group | Generated per application context | Contains invited context-team members | Context-specific | Provides broad context membership grouping; Guest is excluded |
| Object Team | Individual lifecycle/workflow-managed business object | Resolves actual participants for that object | Object-specific | Combines role sources used by lifecycle/workflow execution |
| Team Template | Site / Organisation / Product / Library in PDMLink-style use | Reusable participant/actor-to-role mapping | Inherited/visible down the administrative hierarchy | Participates in object-team role resolution; **ProjectLink does not use team templates** |
| Workflow resource/role resolution | Workflow instance/activity | Resolves candidates/actors for runtime work | Process-instance-specific | Produces actual task/decision participants from governed role sources |

These mechanisms must not be collapsed into one generic Team table.

## 3. Application-context team matrix

| Context type | Context Team | Standard manager role | Shared Team | Local extension | Team Template administration | Object-team role resolution |
|---|---|---|---|---|---|---|
| Product | Yes | Product Manager | Supported | Supported when Shared Team permits | Yes | Yes |
| Library | Yes | Library Manager | Supported | Supported when Shared Team permits | Yes | Yes |
| Project | Yes | Project Manager | Supported | Supported when Shared Team permits | No ProjectLink Team Template use | Project execution relies on context/project participation rather than the PDMLink Team Template mechanism |
| Program | Yes | Program Manager | Supported | Supported when Shared Team permits | No ProjectLink Team Template use | Program/project participation model; do not assume PDMLink Team Template semantics |
| Organisation | No application Context Team | Organisation administration | **Owns Shared Teams** | N/A | May administer Team Templates | Supplies reusable groups, roles, teams and policy |
| Site | No application Context Team | Site administration | Can administer Shared Teams across organisations | N/A | May administer Team Templates | Top-level administration/policy |

A Context Team may be:

1. local only;
2. Shared Team only; or
3. Shared Team plus local roles/members when the Shared Team is marked locally extendable.

The user who creates an application context is assigned its manager role. The manager role has special authority for organising the context and managing participation.

## 4. Shared Team semantics

A Shared Team is more than a reusable membership list.

Verified behaviour:

- it is created in an Organisation context;
- it contains roles and members managed centrally;
- it can be enabled for use by application contexts;
- it can optionally permit local extension;
- the creator becomes a Shared Team Manager;
- later membership/role changes are maintained centrally and apply to contexts using the Shared Team;
- the Context Team consuming it may therefore consist solely of the Shared Team or of Shared Team + local participation.

Ordinary context-creation configuration establishes whether the application context uses a Shared Team. Administrative utilities also exist for controlled retrofit/migration scenarios, so this must not be modelled as an immutable creation-time-only relationship.

## 5. Roles generate access-control groups

Windchill does not treat a role merely as descriptive metadata.

For a Context Team or Team Template role, Windchill creates a corresponding system group. Users placed in the role are added to that system group. Policy Administration can then target those role system groups.

Each application context also has a system-maintained **Team Members** group containing invited team members. Windchill additionally maintains system groups representing the organisations of team members.

This produces an important separation:

~~~text
Role definition
    ↓
Role assignment
    ↓
System role group membership
    ↓
Policy access-control evaluation
~~~

Role, membership and permission are connected but remain distinct concepts.

## 6. Team Template / lifecycle / Context Team role-resolution order

For the default Windchill lifecycle-role resolution behaviour, the Help Center documents the following order:

1. If a lifecycle role exists in the Team Template, participants/actor from the Team Template resolve the role and override lifecycle mapping for that role.
2. Otherwise, if the lifecycle role maps to an existing Team Template role, the participants of that Team Template role are used.
3. Otherwise, the lifecycle role is resolved from the lifecycle definition.
4. Participants in the object's Context Team who hold the same role are added if not already present.
5. Roles used by the related workflow that are not already in the object team are added when the workflow starts.
6. Team Template roles not used by the lifecycle are also added.

Therefore the **Object Team is an execution-time/consolidated participation object**, not a synonym for the Context Team.

### ProjectLink difference

PTC explicitly states that **Windchill ProjectLink does not use Team Templates**. This is a material semantic difference.

NuBlox must therefore avoid designing one universal team-template mechanism and assuming that Product/Library PDM role-resolution semantics automatically describe Project/Program collaborative execution.

## 7. Policy-domain inheritance is coupled to context/team configuration

For application contexts without a Shared Team:

| Application-context configuration | Default parent policy domain |
|---|---|
| Private Product / Library / Project / Program | Organisation /Private |
| Public Product / Library | Organisation /Default/PDM |
| Public Project / Program | Organisation /Default/Project |

For application contexts using a Shared Team:

~~~text
Organisation /Default
    └── Shared Team Domain
          └── Application Context /Default
~~~

The Shared Team domain:

- is created as a child of the Organisation /Default domain;
- has the same name as the Shared Team;
- carries default access-control rules;
- becomes the inheritance parent for the /Default domain of application contexts that use that Shared Team.

This is architecturally significant: **participation reuse and policy inheritance are related but not identical concerns**. A NuBlox equivalent must make both relationships explicit rather than inferring permission directly from Team membership.

## 8. Default Shared Team policy evidence

Windchill 12.0.2.0 creates default rules in the Shared Team domain including:

- Team Members: Read and Download on WTObject;
- Team Members: Read, Modify and Create on WfExecutionObject;
- Guest: Read and Download on WTObject.

These are Windchill defaults, not proposed NuBlox permissions. The important benchmark pattern is that a reusable participation definition can have a governed policy-domain layer inherited by consuming work contexts.

## 9. NuBlox translation — hypotheses to test, not frozen architecture

The Windchill evidence supports the following NuBlox hypotheses for the next architecture pass:

1. **F01–F29 are not Context types.** They describe enduring enterprise capabilities/functions.
2. A **canonical Function definition** should remain stable and reusable rather than being cloned for every Product, Project, Asset or other governed work context.
3. A **context-specific participation assignment** should express how a Function/Domain capability participates in a particular work context.
4. Persistent organisational capability and local delivery participation are therefore different objects/relationships.
5. An object/process may need a separate **effective participant set** resolved from context participation, workflow/lifecycle rules and explicit assignments.
6. Permission, business authority, role membership, UI visibility and information clearance must remain separate controls.
7. Shared participation must not silently imply recursive organisation membership or universal permission inheritance.
8. Policy inheritance must retain provenance: source domain/policy, inherited value, local specialisation and effective result.

A useful candidate conceptual shape is:

~~~text
Canonical Function / Domain
        ↓
Organisation capability participation
        ↓
Application / Work Context participation
        ↓
Object / Process participant resolution
        ↓
Actual Task / Decision actor
~~~

This is intentionally a hypothesis. It does **not** freeze F01–F29 as Windchill Shared Teams, Context Teams or Groups.

## 10. Architecture hold

No application implementation or ADR should be treated as validated solely because it resembles Windchill.

The next evidence sequence remains:

~~~text
Windchill evidence
→ exact relationship rules
→ NuBlox requirements
→ canonical NuBlox object/relationship model
→ architecture decision
→ implementation
~~~

## Primary PTC sources

- Context Teams — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/DataAccessContextTeam.html
- About Roles and Groups — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/TeamRoleGroupAbout.html
- Creating a Shared Team — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/TeamSharedTeamCreate.html
- Shared Team Access Control Rules — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/TeamSharedTeamAccessCtrlRuleAbout.html
- Team Template Default Behaviour — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/TeamTemplateAdminDefaultBehavior.html
- Best Practices for Using Team Templates — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/TeamTemplateAdminBestPractice.html
- Context Configuration — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WCAdminContextContextAdminItemContextConfig.html

Where a later Help Center page is used to clarify a product-version presentation detail, it must remain corroboration rather than silently replacing the 12.0.2.0 evidence baseline.
