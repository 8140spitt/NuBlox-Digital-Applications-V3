# ADR-0011 — Metadata-driven Tenant business profile and provisioning

**Status:** Accepted  
**Date:** 25 September 2026

## Context

NuBlox public registration previously created the minimum identity and organisational spine:

- Tenant;
- TENANT Party;
- Organisation;
- root Organisation Unit;
- registrant EMPLOYEE Party;
- Person;
- application identity and Tenant membership;
- Tenant administrator access;
- authentication policy and email-verification challenge.

That establishes who the Tenant is and who may administer it, but it does not describe the business sufficiently to configure the application.

A reviewed Tenant-provisioning design input identifies four configuration dimensions that materially affect ERP configuration:

1. industry / vertical;
2. organisation size and complexity;
3. operating model;
4. regulatory jurisdiction / regime.

It also proposes versioned configuration templates and a progressive registration experience.

These principles are compatible with NuBlox only when they preserve the existing product invariants:

- the 29 Core Business Functions are universal NuBlox enterprise capability;
- Industry Solutions extend the Enterprise Kernel rather than fork it;
- configuration is governed data/metadata;
- business identity, authentication, Permission and Authority remain separate concerns.

## Decision

NuBlox will provision a Tenant from a governed **Tenant Business Profile** and a versioned metadata-driven configuration stack.

The Tenant Business Profile is separate from the immutable Tenant identity. It records the business characteristics used by the configuration resolver.

### Business-profile dimensions

The initial profile captures:

- primary business classification;
- size tier;
- optional exact employee count;
- number of legal entities;
- primary country;
- primary language;
- one or more operating models;
- zero or more explicit regulatory-regime assignments.

Size tiers are:

- `MICRO` — 1–9 employees;
- `SMALL` — 10–49;
- `MEDIUM` — 50–249;
- `LARGE` — 250–999;
- `ENTERPRISE` — 1000+.

The initial operating-model catalogue contains:

- Single-site;
- Multi-site;
- Franchise;
- Project-based;
- Manufacturing;
- Distribution.

These are reference-data definitions, not source-code branches.

## Industry classification != Industry Solution

Industry classification and NuBlox Industry Solution are separate concepts.

A Tenant is classified using a governed business-classification value. An explicit mapping determines which NuBlox Industry Solution or Solutions are applicable.

This permits external classification standards such as NAICS, ISIC, NACE and SIC to be imported as governed reference datasets without making any one external coding system the NuBlox product identity.

The initial NuBlox-owned classification value is:

~~~text
NUBLOX_INDUSTRY:CBE
    -> Construction & Built Environment
    -> Industry Solution CBE
~~~

Authoritative external classification datasets are not fabricated by this ADR. They must be imported/versioned from authoritative sources.

## Core enterprise capability is not a feature flag

Industry and size configuration must not remove the 29 Core Business Functions.

NuBlox therefore does **not** adopt a conventional SaaS rule such as:

~~~text
industry = construction
therefore disable unrelated ERP modules
~~~

Instead:

~~~text
NuBlox Enterprise Core
    always retained

+ Industry Solution configuration
+ size/complexity configuration
+ operating-model configuration
+ regulatory configuration
+ Tenant-specific governed overrides
~~~

A template may configure terminology, metadata, workflows, rules, dashboards, classifications, preferences, specialist capability and seed/reference data. It does not redefine the canonical enterprise identity model or silently remove core capability.

## Configuration templates

Tenant configuration templates are versioned database metadata.

A template has:

- stable identity;
- code and name;
- version;
- kind;
- priority;
- optional Industry Solution binding;
- applicability criteria;
- configuration payload;
- ordered components;
- active/inactive state.

Supported applicability criteria are initially:

- industry classification;
- size tier;
- operating model;
- regulatory regime;
- country.

Template kinds are initially:

- Core;
- Industry;
- Size;
- Operating Model;
- Regulatory;
- Composite.

A template version already applied to a Tenant remains recorded exactly. Publishing a newer template version does not silently rewrite an existing Tenant.

## Configuration components

Templates contain typed components.

Initial component families are:

- Industry Solution;
- Terminology;
- Metadata Package;
- Workflow Template;
- Rule Set;
- Dashboard;
- Classification;
- Preference;
- Specialist Capability;
- Seed Data.

A component reference does not imply that a runtime exists.

A component may be marked applied only when its corresponding execution handler exists and has completed successfully. Declarative configuration must not be represented as executable capability merely because metadata exists.

The first executable component handler is `INDUSTRY_SOLUTION`, which establishes an explicit Tenant-to-Industry-Solution assignment.

## Provisioning evidence

Every registration-driven provisioning operation records:

- exact Tenant Business Profile snapshot;
- exact resolved template identities and versions;
- template applications;
- activated Industry Solutions;
- ordered provisioning steps;
- actor;
- timestamps;
- audit evidence;
- transactional outbox event.

Provisioning is therefore explainable and reproducible rather than being hidden application startup logic.

## Registration experience

Public registration is progressive:

1. Business Identity;
2. Size and Operating Model;
3. Configuration Preview;
4. Administrator Setup.

The registration transaction creates the business/identity spine and the initial governed Tenant configuration atomically. An invalid profile or unresolved mandatory configuration prevents the Tenant registration transaction from being committed.

## Tenant configuration visibility

Authorised users can inspect the effective registration/provisioning provenance at:

~~~text
/{tenantSlug}/app/tenant-configuration
~~~

The view exposes:

- business classification;
- size and complexity;
- operating model;
- jurisdiction/language context;
- active Industry Solutions;
- applied template versions;
- latest provisioning run and steps.

## Future work

The following are explicit subsequent capabilities and are not implied complete by this ADR:

- authoritative NAICS / ISIC / NACE / SIC dataset import and crosswalk management;
- searchable industry taxonomy picker across those standards;
- governed regulatory-regime catalogues and country defaults;
- Tenant settings initializer for currency, timezone, date/number formats and fiscal calendars;
- typed execution handlers for terminology, metadata, workflows, rules, dashboards, preferences and seed packs;
- template preview produced by the server resolver rather than only the registration selection summary;
- Tenant-approved template upgrade/reconciliation workflow;
- governed post-registration edits to the Business Profile and resulting configuration impact assessment;
- explicit dependency/conflict resolution between multiple applicable template components.

## Invariants

1. Tenant identity != Tenant Business Profile.
2. Business classification != Industry Solution.
3. Industry Solution != Core Business Function catalogue.
4. Core Business Functions are not disabled because of Tenant industry classification.
5. Configuration template != source-code branch.
6. Template version applied to a Tenant remains explicit historical evidence.
7. Template metadata != executed capability.
8. Tenant-specific override retains provenance and does not mutate the platform template.
9. Business-profile configuration does not grant Permission or Authority.
10. Provisioning must be attributable and auditable.
