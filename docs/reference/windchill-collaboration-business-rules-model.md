# PTC Windchill Collaboration & Business Rules Model

**Status:** Reference evidence  
**Primary target:** Windchill Cloud 12.0.2.0 Help Center  
**Purpose:** Close two Help Center capability families that cut across contexts, workflow, change and user collaboration.

> This is Windchill evidence. It does not automatically define NuBlox architecture.

# 1. Collaboration object families

Windchill separates several collaboration mechanisms instead of treating all communication as workflow tasks.

## Meetings

A Project/Program context can support scheduled team meetings. Meeting capability includes:

- meeting records;
- participants;
- agenda;
- meeting minutes;
- hosting/joining;
- cancellation.

A meeting is therefore a collaboration/event object, not the same object as a workflow activity or assigned task.

## Discussions

Discussions contain **Topics** and **Comments**.

Important semantics:

- a Topic is a top-level subject heading;
- Topics can carry participant associations;
- access to the underlying object/context still governs whether a participant can view/contribute;
- comments can contain attachments and links;
- comments can be saved as draft before publication;
- users can subscribe to a topic/comment for notifications.

Therefore:

```text
Discussion
  -> Topic
      -> Comment
          -> Attachment
          -> Link
```

Participation and subscription are separate concerns.

## Notebooks

Windchill Notebooks provide personal/contextual organisation of:

- links to Windchill objects;
- uploaded files;
- notebook folders.

Notebook structure is therefore a user/context information-organising surface, not authoritative containment of the referenced business object.

## Context Networks

A Network is a referential structure connecting contexts.

A **context reference** can be organised into network folders and moved without moving the target context itself.

Therefore:

```text
Network folder containment
!=
administrative context hierarchy
!=
business-object containment
```

This supports the existing Windchill research conclusion that context-network relationships are referential rather than administrative-parent relationships.

# 2. Collaboration distinctions

Windchill evidence supports the following separation:

| Concern | Windchill mechanism | Key distinction |
|---|---|---|
| Scheduled collaboration | Meeting | event/session, not workflow task |
| Subject conversation | Discussion Topic | conversation grouping |
| Contribution | Comment | user-authored collaboration record |
| Awareness | Subscription | notification interest, not authority |
| Personal/context reference organisation | Notebook | reference/file organisation, not object ownership |
| Cross-context discovery/relationship | Network / Context Reference | reference graph, not context hierarchy |

This is important because a single generic "activity feed" cannot faithfully replace these semantics.

# 3. Business Rule object model

Windchill Business Rules are reusable validation controls that can be evaluated independently or invoked as part of workflow/change/promotion processes.

The Help Center distinguishes:

- **Business Rule** — an executable validation definition;
- **Business Rule Set** — an administered grouping/order of rules;
- **Business Rule Set hierarchy** — composition of rule sets;
- **Business Rule execution** — evaluation against target objects;
- **Business Rule Set result / conflict** — retained evaluation outcome;
- **Change Association Rules** — constraints on valid change-object relationships;
- **Mapping Rules** — mappings such as change intent -> release target/state.

These concepts must not be collapsed into a workflow transition.

```text
Workflow / command
      |
      v
Business Rule Set
      |
      +--> Rule A
      +--> Rule B
      +--> Rule C
      |
      v
Evaluation Results
      |
      +--> pass
      +--> conflict(s)
```

# 4. Delivered rule examples

Windchill 12.0.2 documents delivered rules including:

- Checkout Rule;
- Attribute Rule;
- Release Target Rule;
- BOM Release Rule.

The semantics illustrate reusable release/readiness validation:

- ensure objects are not improperly checked out;
- validate required/allowed attribute values;
- ensure resulting objects have valid target lifecycle/release states;
- ensure first-level BOM dependants satisfy release requirements.

Rule failure produces explicit rule conflicts that can be viewed and resolved.

# 5. Association and mapping rules

Change Association Rules govern which object-to-object relationships are valid in Change Management.

They are administered at Site level and, when enabled, Organisation level. Organisation rules can take precedence over Site rules.

Mapping Rules separately map concepts including:

- change intent -> release target;
- affected-object type -> allowed change intent;
- object/change semantics -> release state.

Therefore:

```text
association validity
!=
business validation
!=
workflow routing
!=
lifecycle transition
!=
mapping/defaulting policy
```

# 6. NuBlox candidate implications

Subject to the later NuBlox translation stage, the Windchill evidence supports these candidate principles:

1. **Conversation is not Work.** Meetings/discussions/comments should be able to reference governed Work and objects without becoming the authority for their state.
2. **Subscriptions are interest, not permission.** Notification registration must not confer access or authority.
3. **Cross-context networks are references.** They must not silently rewrite organisational/project hierarchy.
4. **Validation policy should be first-class.** Release/readiness/business checks should be reusable governed rules, not duplicated inside UI handlers or workflows.
5. **Rule results should be evidence.** Failed/passed evaluations should be reconstructable for the exact object/version/configuration evaluated.
6. **Association policy is separate from object state.** The platform needs governed constraints on which relationships can be created, independent of lifecycle state.
7. **Rules require scope and precedence.** Site/tenant-wide and organisation/context-specialised policy must have explicit override/precedence semantics.

# 7. Primary PTC evidence

- Creating Topics: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/DiscussionsTopicCreate.html
- Creating a Meeting: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/MeetingCreate.html
- Notebooks: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/NotebookFileUpload.html
- Moving a Context Reference: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/NetworkContextRefMove.html
- About Projects and Programs: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ContextsProjectAbout.html
- Business Rules Available: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ChgMgmtBusRulesAvailablefRef.html
- Change Association Rules: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/BusRulesChangeAssocRulesTableRef.html
- Mapping Rules for Change Management: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WCCG_BusLogicCust_ChangeMgmt_BusRulesMappingDefine.html
