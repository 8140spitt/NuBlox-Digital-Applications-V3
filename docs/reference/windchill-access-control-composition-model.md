# PTC Windchill — Access-Control Composition & Precedence Model

**Status:** Verified benchmark evidence — research checkpoint  
**Primary source:** PTC Windchill Cloud/Plus 12.0.2.0 Help Center  
**Last updated:** 23 September 2026  
**Purpose:** Close the core policy-domain inheritance and ACL composition rules before translating Windchill security patterns into NuBlox authority architecture.

> This is benchmark evidence. Windchill permission semantics are not automatically NuBlox design decisions.

## 1. Access is calculated from multiple dimensions

A Windchill policy access-control rule maps:

- **Domain**
- **Object type**
- **Lifecycle state**
- **Participant**
- **Permission consequence** — grant, deny or absolute deny

An object's policy ACL is selected/derived from its effective **domain + type + lifecycle state**.

The applicable policy rule set is not limited to exact matches. Windchill combines:

1. rules from the object's domain;
2. rules inherited from ancestor domains;
3. rules for the object's exact type;
4. rules inherited from ancestor object types;
5. rules applying to the object's current lifecycle state.

Rules with the same participant and permission-consequence type are merged by unioning their permissions.

## 2. Domain and type inheritance are independent axes

A descendant domain inherits policy rules from ancestor domains.

A subtype inherits policy rules defined for its ancestor types.

Therefore a single effective ACL may include policy evidence from both hierarchies:

~~~text
Domain ancestry                     Type ancestry

Site /                              WTObject
  ↓                                    ↓
Organisation /Default               WTDocument
  ↓                                    ↓
Shared Team / PDM / Project         SpecialistDocument
  ↓
Application Context /Default
                                   /
                                  /
              effective rule set
                     ↓
          + lifecycle state
                     ↓
               policy ACL
~~~

NuBlox must not mistake context hierarchy, policy-domain hierarchy and object-type hierarchy for one tree.

## 3. Participant forms

Policy rules can address:

- individual users;
- user-defined groups;
- system groups;
- organisations;
- dynamic roles;
- pseudo roles such as OWNER and ALL;
- logical "all except participant" groupings.

Dynamic roles are resolved to concrete system groups **before ACL generation**.

A context-team dynamic role resolves against the specific Context Team associated with the context whose domain is being evaluated. Merely having the role in a team is not sufficient if the object is associated with a different domain branch that does not inherit the rule.

## 4. Core permission-precedence rules

For a participant, Windchill can calculate at most one merged entry of each consequence type:

- Grant (+)
- Deny (-)
- Absolute Deny (!)

### Net-effect rules

| Situation | Effective result |
|---|---|
| No applicable ACL entry | Null permission set; effectively no access |
| Same participant has Grant and Deny for same permission | Permission not granted |
| Same participant has Grant and Absolute Deny | Permission not granted |
| User receives permission from one group but ordinary Deny from another group | Group grant/deny sets are merged; the denied permission is not effective unless a higher-precedence individual rule changes the result |
| Individual user Grant versus ordinary group/organisation/ALL Deny | Individual Grant wins |
| Individual user Deny versus group/organisation Grant | Individual Deny wins |
| Individual user Absolute Deny versus group/organisation Grant | Absolute Deny wins |
| Group/organisation Absolute Deny versus individual user Grant | Absolute Deny wins |
| OWNER explicit Grant versus ordinary Deny applied to the owner as user/group/organisation | OWNER Grant wins |
| OWNER explicit Grant versus Absolute Deny on the owner/user/group/organisation | Absolute Deny wins |
| Deny against pseudo role OWNER | Ignored |
| Absolute Deny against pseudo roles | Not permitted |
| Absolute Deny against ALL | Not permitted |

Group and organisation grants are unioned. Group and organisation denies are unioned. Group and organisation absolute denies are unioned. These merged sets are then composed with the user's individual entries and applicable pseudo-role entries.

## 5. Absolute Deny is a hard boundary

An ordinary policy Deny can be overridden by an ad-hoc rule and, in some cases, another grant policy rule under Windchill's precedence semantics.

An **Absolute Deny cannot be overridden** by:

- ad-hoc access;
- another policy Grant;
- an individual Grant;
- OWNER Grant.

It remains effective until the Absolute Deny policy itself is removed.

This is materially different from an ordinary Deny and must not be represented as a boolean "allowed=false" without precedence semantics.

## 6. Policy ACL and ad-hoc ACL are different layers

Policy ACLs are derived from shared administrative policy:

~~~text
Domain + ancestor domains
        ×
Object type + ancestor types
        ×
Lifecycle state
        ↓
Policy ACL
~~~

Ad-hoc ACLs are object-specific.

For lifecycle/workflow-managed objects, Windchill can compute object-stored ad-hoc ACLs by binding lifecycle/team/workflow roles to actual participants. These rights can be active only for a lifecycle phase or workflow activity.

Therefore:

- **Policy ACL** = shared rule-driven access for a class of objects.
- **Ad-hoc ACL** = object-specific participant access.
- **Lifecycle/workflow access** = temporary/process-bound ad-hoc access where configured.

The two layers are evaluated together.

## 7. Team participation does not itself equal permission

The path is:

~~~text
Context Team membership
        ↓
Role system group
        ↓
Dynamic role resolution / direct group participation
        ↓
Applicable policy + ad-hoc ACL entries
        ↓
Net permission calculation
~~~

This confirms a key benchmark principle already identified in the Context/Team study:

**Membership, role, business authority and effective permission are separate concepts.**

## 8. Folder/domain association can change policy without changing the object's business type

Foldered objects normally inherit their domain association from their parent.

If a folder/object is explicitly assigned to another domain, it can inherit a materially different policy branch even while remaining in the same Product/Library/Project context.

When an inheriting folder is moved, its effective domain can change with the new parent. An explicitly assigned domain persists unless cross-context movement requires remapping.

This means the effective policy boundary is not safely inferable from the navigation folder path or Context Team alone.

## 9. Administrative lock is an additional restriction layer

Windchill also supports an Administrative Lock that can restrict permissions otherwise granted through access control.

For example, a user may be granted Modify through ACL calculation but the lock can remove the effective ability to modify while applied. Administrative users are also subject to the lock.

This is a separate restriction mechanism from grant/deny/absolute-deny ACL composition.

## 10. Security labels, UI visibility and entitlement remain separate

The access-control model described here is not the whole authorization picture.

Windchill also separates:

- security-label clearance / agreements;
- profile/action visibility;
- licensing/entitlement;
- administrative locks;
- workflow/business authority.

NuBlox should therefore avoid a single overloaded "permission" concept.

## 11. Candidate NuBlox security-evaluation shape

The benchmark suggests that NuBlox should eventually be able to evaluate something conceptually equivalent to:

~~~text
Principal
  + memberships / organisations
  + context participation / roles
  + object / work-item relationship
  + policy inheritance
  + object type
  + lifecycle/workflow state
  + object-specific grants
  + information clearance
  + temporary restrictions
  + business authority
        ↓
Effective Access Decision
        ↓
Decision Evidence / explanation
~~~

The important requirement is **explainability**: the system should be able to state why access was granted or denied, which inherited/local controls participated, and which rule had precedence.

This remains a NuBlox hypothesis until architecture is deliberately accepted.

## 12. Research conclusion for WHC-006

The core Windchill composition model is now sufficiently evidenced to close the previous "unknown inheritance/override composition" gap:

- ancestor-domain policy inheritance — verified;
- ancestor-type rule inheritance — verified;
- lifecycle-state keying — verified;
- participant types — verified;
- dynamic-role resolution — verified;
- Grant / Deny / Absolute Deny precedence — verified;
- OWNER and ALL pseudo-role exceptions — verified;
- policy + ad-hoc composition — verified;
- lifecycle/workflow temporary ad-hoc access — verified;
- folder/domain reassociation effects — verified;
- administrative-lock restriction — verified.

Implementation-specific default rule catalogues remain product configuration detail, not an unresolved canonical semantic.

## Primary PTC sources

- About Access Control Policy Rules — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/AccessControlChp_AccessCtrlPolicyRuleAbout.html
- Deriving ACLs from Access Control Policies — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/AccessControlChp_ACLFromPolicyDerive.html
- How ACLs Work — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/AccessControlChp_HowACLsWork.html
- Using the Absolute Deny Permission — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PolicyAdminAbsoluteDenyUse.html
- Considerations When Resolving Dynamic Roles in Rules — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/AccessControlChp_ConsiderationDynamicRoleResolve.html
- Life Cycle Managed Information — https://support.ptc.com/help/windchill/plus/r12.0.2.0/en/Windchill_Help_Center/AccessControlChp_LCManageInfo.html
- Domain Inheritance for Foldered Objects — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/AccessControlChp_WCFolderObjDomainInherit.html
- Administrative Lock — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/SecurityMgmtAdministrativeLock.html
