# PTC Windchill — Customization & Extension Boundary Model

**Status:** Reference evidence — deep pass  
**Primary target:** Windchill 12.0.2.0  
**Purpose:** Separate configuration, metadata extension, modeled persistence, server/business logic, API, UI and site-file customization so NuBlox does not collapse every extension into custom code.

> This is Windchill reference evidence, not a NuBlox extension architecture decision.

## 1. Customization is layered

Windchill exposes several materially different extension mechanisms:

```text
Configuration / administration
    preferences, OIRs, types/attributes, profiles, templates, rules
        |
Metadata / soft extension
    subtypes, attributes, enumerations
        |
Modeled business-object extension
    generated/persisted Java business objects and relationships
        |
Server/business logic extension
    services, event listeners, delegates, business rules
        |
API extension
    REST domain/entity/action/function custom configuration
        |
UI extension
    actions, action models, builders, JSP/components, validation
        |
Infrastructure/site customization
    properties, XCONF, service registration, supplied-file tailoring
```

These have different lifecycle, deployment and upgrade risk.

## 2. Configuration is not the same as code customization

Large parts of Windchill behaviour are configurable through governed administration rather than compiled customization, including:

- preferences;
- Type and Attribute Management;
- enumerated values;
- Object Initialization Rules;
- lifecycle/workflow/templates;
- profiles/action visibility;
- access-control rules;
- business-rule objects/configuration.

The extension decision should therefore begin with the least invasive supported mechanism.

## 3. Modeled objects

Windchill models business and administrative concepts as Java objects whose instances can be persisted in the database.

The platform exposes a Modeled Objects report that can show:

- modeled-object metadata;
- persistence mapping from object to database table;
- UML information;
- API/Javadoc links;
- installed custom modeled objects.

Custom modeled objects therefore participate in the platform object model rather than being arbitrary application-side JSON.

## 4. Foundation abstractions and design patterns

The Customization Guide explicitly exposes reusable platform abstractions and patterns including:

- Foundation interfaces/classes;
- Object Reference design pattern;
- Business Service design pattern;
- Master-Iteration design pattern;
- Change abstractions.

The significance is architectural: extension is expected to reuse platform identity/persistence/service patterns where a true modeled extension is required.

## 5. Server/business logic

Windchill supports service-layer extension including:

- service management;
- service event management;
- non-modeled listening services;
- lightweight services;
- custom business data types;
- multi-object operations;
- delegates/hooks in product-specific areas.

A non-modeled listener service has an explicit lifecycle:

```text
Service Interface
 -> Standard Service implementation
 -> compile
 -> service registration
 -> Method Server restart
```

This separates event-driven behaviour from persistence modeling.

## 6. Business Rules

Windchill Business Rules are configurable/persisted rule objects with:

- rule definitions;
- rule sets;
- relationships;
- execution plans;
- result objects;
- custom rule implementations where required.

Business validation is therefore a separate concern from workflow routing and from UI validation.

## 7. REST extension

WRS separates PTC-supplied domain configuration from customer custom configuration.

A customer can extend domain/entity/navigation/action/function behaviour through the supported custom configuration layer rather than editing the vendor domain definition directly.

The base external contract and customer extension contract remain distinguishable.

## 8. UI Action Framework

Windchill's UI Action Framework separates:

- **Action** — executable UI command definition;
- **Action Model** — composition/grouping/placement of actions;
- action visibility;
- validation;
- localization;
- component/table/tree/info-page rendering.

Custom actions live in custom action configuration.

PTC documents an important composition rule:

- custom action definitions for an existing object type augment/override matching actions;
- a custom action model with the same model name can completely override the earlier model.

This makes extension precedence explicit.

## 9. UI placement is not business capability ownership

The same action may be surfaced through:

- information-page menus;
- table toolbars;
- action columns;
- navigation tabs;
- home-page components;
- wizards;
- contextual menus.

Therefore:

```text
Domain Command
!= UI Action definition
!= Action Model / menu placement
!= visibility policy
```

A capability must not be identified solely by where a button appears.

## 10. UI visibility vs permission

Windchill profiles and role visibility can hide actions/areas of the UI.

That is separate from access-control permission.

A hidden action is not proof the participant lacks authority, and a visible action is not itself authorization.

This reinforces the security layering already captured in the access-control reference model.

## 11. Property customization and XCONF

PTC recommends managing site property customization through `site.xconf` / `xconfmanager` rather than directly editing generated/internal property files.

Some internal property/registry files are explicitly documented as files that should not be directly modified.

This creates a source-of-configuration layer from which runtime property files are generated.

## 12. Upgrade-safe customization management

Where PTC-supplied files must be modified, Windchill provides a **safe-area** pattern.

The relevant three versions are:

```text
ptcOrig
    original PTC version before site modification

siteMod
    customer's intended production modification

ptcCurrent
    newer PTC version delivered by maintenance/service pack
```

Upgrade work compares all three so vendor changes can be consciously incorporated into the site modification.

PTC also recommends separate custom locations for resources such as RBINFO tailoring.

Customization therefore carries explicit upgrade/reconciliation debt; it is not equivalent to configuration.

## 13. Extension provenance

A robust extension inventory needs to know at least:

- extension type;
- owning module/domain;
- target object/type/action/service;
- vendor base version;
- custom implementation version;
- deployment unit;
- required restart/regeneration;
- migration/upgrade reconciliation status;
- tests;
- security/permission effects.

Windchill's safe-area and custom configuration patterns provide evidence for treating extension provenance as governed configuration.

## 14. Candidate NuBlox implications

Subject to formal architecture translation:

1. Prefer declarative governed configuration before executable customization.
2. Custom attributes/subtypes must not require bespoke application forks.
3. True new domain concepts require explicit modeled-extension governance.
4. Domain/business commands should be independent of UI placement.
5. UI visibility and authorization must remain separate.
6. Event listeners/hooks must execute through governed extension contracts rather than arbitrary database triggers.
7. Core API contracts and extension API contracts must be distinguishable/versioned.
8. Extension precedence/override behaviour must be deterministic.
9. Every extension must have ownership, version, compatibility and test evidence.
10. Product upgrades must perform explicit three-way reconciliation where core/vendor artifacts have been overridden.
11. Direct modification of generated/internal core artifacts should be prohibited where a supported extension layer exists.
12. Customization debt must be measurable as part of platform governance.

## 15. Distinctions to preserve

```text
Configuration
!= Metadata extension
!= Modeled domain extension
!= Business-rule extension
!= Event/service extension
!= API extension
!= UI extension
!= Core fork

Business permission
!= Profile/UI visibility

Domain Command
!= UI Action
!= Action Model
```

## Primary PTC evidence

- Windchill 12.0.2 Help Center customization tree / Basic Customization:
  https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/middlemap_landingpages/BasicCustomization_LP.html
- Services and Infrastructure Customization:
  https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/CustomizersGuide_section_04_Intro.html
- Action Framework for Windchill Client Architecture:
  https://support.ptc.com/help/windchill/cloud/r12.0.2.0/es/Windchill_Help_Center/WCCG_UICust_AddActionsHook_WCClientArchAction.html
- Home-page action customization example:
  https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WCCG_UICust_AddActionsHook_HomePage.html
- xconfmanager:
  https://support.ptc.com/help/windchill/cloud/r12.0.2.0/fr/Windchill_Help_Center/PropertyCommandUtilUseXconfmanageUtility.html
- Safe-area customization management:
  https://support.ptc.com/help/windchill/cloud/r12.0.2.0/zh_TW/Windchill_Help_Center/WCCG_Oview_ManageCust_SettingUpDirectory.html
- Service-pack safe-area reconciliation:
  https://support.ptc.com/help/windchill/cloud/r12.0.2.0/ko/Windchill_Help_Center/WCCG_Oview_ManageCust_UsingSafeAreaforInstallingServicePack.html
- Upgrade customization incorporation:
  https://support.ptc.com/help/windchill/cloud/r12.0.2.0/es/Windchill_Help_Center/WCUpgrade_IncorporateCustom.html
