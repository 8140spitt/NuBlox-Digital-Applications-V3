# PTC Windchill — Business Administrative Change Promotion Model

**Status:** Reference evidence — deep pass  
**Primary target:** Windchill 12.0.2.0  
**Purpose:** Capture Windchill's governed promotion of administrative/configuration changes across development, integration, test and production systems.

> This is Windchill reference evidence, not a NuBlox deployment decision.

## 1. BAC is configuration promotion, not business-data migration

Windchill Business Administrative Change (BAC) Promotion moves supported **administrative objects** from a source environment into downstream environments.

The governing flow is:

```text
source environment
  -> register target
  -> establish baseline (synchronised mode)
  -> modify/test administrative objects
  -> detect/preview delta
  -> export BAC package
  -> move package
  -> target import
  -> mapping/conflict resolution
  -> import transaction + report
```

This differs from:

- ordinary business-object import/export;
- Package / Received Delivery exchange;
- application code deployment;
- database cloning/rehosting.

## 2. Environment topology is explicit

PTC describes development, integration, pre-production/test and production environments as different systems.

In synchronized deployments, a baseline is established before administrative changes are made. Subsequent exports contain administrative changes since the baseline/previous export.

This establishes:

```text
administrative object
+
environment identity
+
baseline
+
delta
+
target identity
```

as separate concepts.

## 3. Supported administrative object families

The BAC branch includes administrative/configuration families such as:

- policy access-control rules;
- profiles;
- Object Initialization Rules;
- preferences;
- lifecycle templates;
- workflow process templates;
- type definitions;
- measurement systems / quantities of measure;
- global/modeled enumerations;
- reusable attributes;
- document/report/task-form templates;
- visualization configuration;
- context templates;
- shared table views / client tabs;
- versioning schemes;
- business rules/rule sets where supported.

Support varies between command-line and UI mechanisms and by release.

Referenced participants/contexts and other dependencies must already exist on the target or be mapped/resolved.

## 4. Baseline and delta semantics

For synchronized systems, the baseline is the point from which administrative changes are tracked.

An export is not simply "all configuration":

```text
baseline
  -> created/modified/deleted admin objects
      -> selected delta
          -> export package
```

Selective/development modes allow different collection behaviour.

The source/target environments should remain configuration-compatible; BAC is not a cross-release schema-conversion mechanism.

## 5. Mapping

Target identities can differ from source identities.

BAC supports mappings for concerns including:

- contexts;
- users;
- groups;
- attribute values.

Mapping is therefore part of the governed promotion transaction, not ad-hoc post-import repair.

## 6. Conflict resolution

Import can encounter administrative conflicts.

PTC supports:

- default conflict resolutions;
- saved/reused resolutions;
- bundled resolutions;
- bundled or external mapping files;
- Event Management interaction for unresolved conflicts.

Conflict resolution is durable deployment evidence and must be distinguishable from the promoted administrative object itself.

## 7. Import transaction and report

BAC import produces a report regardless of success.

The report includes information such as:

- received-delivery/package identity;
- package name/version;
- source repository;
- object type;
- object identity;
- import status;
- search mechanism;
- conflicts;
- failure reasons.

This makes configuration promotion auditable as an execution transaction.

## 8. Administrative authority

BAC uses explicit package creator/importer privileges and still requires authority to read exported objects and create/modify imported objects.

Therefore:

```text
can package configuration
!=
can author configuration
!=
can import configuration
```

Deployment authority and administrative-object authority are related but distinct.

## 9. Target objects remain managed after import

BAC promotion creates/updates administrative objects on the target. They are not immutable imported replicas.

The production administrative object becomes normal target-system configuration and can subsequently be governed there, subject to the chosen environment-management process.

## 10. Candidate NuBlox implications

Subject to architecture translation:

1. Tenant/platform configuration requires first-class **Configuration Change** identity.
2. Configuration promotion requires explicit **Environment**, **Baseline**, **Change Set/Package** and **Deployment Run** identities.
3. Runtime/business data migration and configuration promotion must be different pipelines.
4. Production configuration should be promoted from controlled lower environments rather than manually recreated.
5. Mapping and conflict resolution must be durable evidence.
6. Environment compatibility/version constraints must be validated before promotion.
7. Administrative-object dependencies must be resolved before applying a change set.
8. Promotion permissions must be separate from configuration-authoring permissions.
9. Each deployment must retain source version, target, package/checksum, mappings, conflicts, result and operator.
10. Roll-forward/rollback strategy must be explicit; a deployment package is not equivalent to database backup.

## 11. Distinctions to preserve

```text
Business Data Change
!= Administrative Configuration Change
!= Code Change

Configuration Baseline
!= Product Baseline
!= Database Backup

Configuration Package
!= Business Exchange Package

Author Configuration
!= Approve Configuration
!= Promote Configuration
!= Apply Configuration
```

## Primary PTC evidence

- Business Administrative Change Promotion:
  https://support.ptc.com/help/windchill/cloud/r12.0.2.0/ru/Windchill_Help_Center/BACPOview.html
- Complex Windchill Deployments:
  https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/BACPComplexWCDeploy.html
- Import Changes Command:
  https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/BACPImportCmd.html
- BAC Utility:
  https://support.ptc.com/help/windchill/cloud/r12.0.2.0/fr/Windchill_Help_Center/BACUtility.html
- BAC UI introduction / supported administrative examples:
  https://support.ptc.com/help/windchill/cloud/r12.0.2.0/it/Windchill_Help_Center/NewandChanged_12_0_10_BACUtility.html
- BAC specification XML selection:
  https://support.ptc.com/help/windchill/cloud/r12.0.2.0/es/Windchill_Help_Center/BACPSpecXMLCreate.html
