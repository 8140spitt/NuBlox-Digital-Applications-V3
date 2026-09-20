# Windchill 13.1.2 Reference Model for NuBlox V3

## Purpose

PTC Windchill 13.1.2 is a formal benchmark source for NuBlox V3. It is not an implementation template and is not authoritative for NuBlox product architecture. The objective is to understand the complete operating model, object model, lifecycle/workflow model, permission model, information architecture, administration model and extension model so that NuBlox can adopt proven concepts where they improve control, usability or traceability and deliberately reject patterns that do not fit the NuBlox product.

Primary source: PTC Windchill 13.1.2 Help Center: https://support.ptc.com/help/windchill/r13.1.2.0/en/index.html#page/Windchill_Help_Center/WHCCategories.html

## Governing study rule

No statement that "Windchill does X" becomes a NuBlox design rule unless the behaviour has been traced to the Windchill 13.1.2 documentation and mapped to a NuBlox requirement. Every adopted pattern must preserve NuBlox's own tenant, 29-workspace and built-environment operating model.

## Coverage domains

The Windchill study must cover, at minimum:

1. Navigation, home, contexts, search, folders, tables, information pages and personal work.
2. Business object model, attributes, relationships, content, attachments and configurable links.
3. Identity, context teams, roles, groups, organizations, access control, security labels and delegation.
4. Object versions, revisions, iterations, working copies, check-out/check-in, baselines and history.
5. Life cycles, states, phases, gates, transitions, templates, promotion and release behaviour.
6. Workflow templates, activities, assignments, routing, voting, review, approval, reassignment, escalation, signatures and process administration.
7. Configuration management, product structures, BOMs, occurrences, effectivity, options, variants and configuration specifications.
8. Change management including problem reports, change requests, change notices/tasks, implementation, variances and change traceability.
9. Document and content management, document structures, publication and records/history behaviour.
10. CAD/PDM and Workgroup Manager concepts, workspaces, representations and visualization.
11. Project/program/plan management, deliverables, resources, assignments and collaboration.
12. Packages, technical data exchange, import/export and external collaboration.
13. Manufacturing/MPMLink concepts, manufacturing structures, process plans, operations and resources.
14. Supplier management, approved manufacturer/vendor concepts and part requests.
15. Quality management, CAPA, nonconformance, customer experience, regulatory submissions and training tracking.
16. Service information management, service structures, parts lists, applicability, replacements and publishing.
17. Classification, PartsLink, search, similar-part and taxonomy behaviour.
18. Reporting, analytics, table views, query/report administration and dashboards.
19. Site, organization, product, library, project and program administration.
20. Type and attribute administration, object initialization rules, numbering/naming and templates.
21. Life cycle and workflow administration, process health, execution controls and exception handling.
22. Preferences, properties, context inheritance, policy hierarchy and administrative override behaviour.
23. Licensing, entitlement and feature visibility.
24. REST services, integrations, external systems and enterprise interoperability.
25. Customization architecture, supported extension points, UI customization, business logic customization and upgrade-safe extensibility.
26. Installation, deployment, upgrade, update, migration, rehost, monitoring and operational administration.
27. Security architecture, authentication, SSO, audit, electronic signatures and compliance controls.
28. Role-specific behaviour for end users, engineers, administrators and customizers.
29. Next Generation UI patterns and how PTC is evolving legacy interaction patterns.

## Initial confirmed architectural findings

### Life cycle and workflow are separate concerns

Windchill distinguishes the life cycle of a business object from workflow execution. Advanced life cycles can associate workflows with phases or gates, but the workflow process that moves work through those phases is a separate process concept. NuBlox must make the same conceptual separation: object state is not the user task interface.

### Actions are contextual, not globally exposed

Windchill information pages expose applicable actions according to object status, access and role/team context. Tasks similarly expose actions according to task status and user access. NuBlox must not render every theoretically possible transition to every user.

### Tasks are first-class work objects

A Windchill task is an assigned work object. My Tasks represents work that requires the current user's action, and completed work leaves that active queue. NuBlox should treat review/approval work as assignments/tasks surfaced in My Work, not as a permanent lifecycle control panel on every business-object page.

### Object status is compact contextual information

Windchill surfaces state/status through attributes, indicators and relevant links rather than displaying the entire underlying state machine as the primary UI. NuBlox should show the current state and exceptional state information while keeping the full lifecycle model behind the interaction layer.

### Information pages are object-centric collection points

Windchill information pages combine object identity, relevant actions, attributes and related information, with configurable tabs. This is a useful reference for NuBlox object workspaces/details, although NuBlox should apply a lighter, more task-focused interaction model.

### Versioning and working copies are distinct from life-cycle approval

Windchill distinguishes version/revision/iteration behaviour, working copies and check-out/check-in from life-cycle state. NuBlox must avoid using a single status field as a substitute for content versioning, editing locks, approval state and publication state.

### Access is multi-dimensional

Windchill access combines policy/ad-hoc access controls, roles/teams and, where applicable, security labels. NuBlox's eventual action-availability calculation must likewise consider tenant/context, role, assignment, object state, permissions, authority and any additional information-security constraints.

## Immediate consequence for F01.01

The current F01.01 Strategy Framework UI must be revised before further horizontal implementation:

- remove the always-visible Draft → Review → Approved → Published lifecycle strip;
- move review/approval work into assigned task behaviour;
- show only actions available to the current user in the current state;
- present current status compactly rather than exposing the state machine;
- make version/history/audit secondary evidence surfaces rather than permanent primary panels;
- separate content versioning from workflow/lifecycle state;
- introduce identity, assignment, permissions and delegated authority before treating approval as production behaviour.

## Study status

This document establishes the benchmark scope and records only findings already verified against the Windchill 13.1.2 Help Center. Coverage is intentionally not marked complete until each domain has been reviewed and mapped to NuBlox.