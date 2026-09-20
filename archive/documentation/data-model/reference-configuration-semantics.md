# Reference Data, Classification, Jurisdiction & Configuration Semantics

## Purpose

BOF-29 provides the controlled reference and policy layer used by every NuBlox tenant workspace.

The governing pattern is:

```text
Reference / Configuration Definition
        ↓
Published Version / Effectivity
        ↓
Business Object / Transaction / Work Context references it
        ↓
Runtime state and evidence remain on the business object
```

The central rule is:

> Reference/configuration defines allowable meaning and policy; it is not transactional truth.

## Reference identity and historical meaning

Reference data must have stable identity, explicit source/provenance and effectivity. Transactions and evidence must retain enough version/effectivity context to remain interpretable after reference data changes.

Examples include:

- Jurisdiction;
- Currency;
- Unit of Measure;
- Tax Regime and Tax Code;
- Calendar and Fiscal Calendar;
- Regulatory Regime;
- Status and Suitability codes;
- Evidence Type, Record Type and Data Retention Class.

A reference update must never silently reinterpret a historical Contract, Invoice, measurement, Information Issue, Asset record or evidence item.

## Classification architecture

NuBlox uses one generic pattern:

```text
Classification System
        ↓
Classification Release
        ↓
Classification Code
        ↓
Classification Assignment to canonical object
```

Classification remains an overlay. It does not replace the identity of the classified Party, Project, Site, Building, Item, Asset, Contract, Information Container or work object.

### Uniclass

Uniclass is represented through the same generic model:

```text
Classification System = Uniclass
Classification Release = explicit published version
Classification Code = code within that release
```

There is no parallel `Uniclass master` architecture. Historical assignments retain the exact release required to interpret the code correctly.

Location, Asset, Cost, Work and Resource Classification candidates are normalised as **classification applicability profiles**. They define which systems/codes may be used for particular target types; they do not create duplicate domain masters.

## Lifecycle configuration

`Lifecycle Definition` and `Lifecycle State Definition` define allowed domain state models.

They are configuration only.

```text
Lifecycle Definition/version
        ↓
Domain object references applicable definition/version
        ↓
Current lifecycle state remains domain-owned
```

Workflow runtime must never become the authoritative lifecycle store for all objects.

## Workflow configuration

`Workflow Definition` is versioned orchestration configuration. The former `Workflow Template` candidate is merged into the same governed definition/version model.

A Workflow Instance pins the exact published definition version used at runtime.

Workflow configuration coordinates work around canonical domain objects; it does not own the domain object's business truth.

## Project stage configuration

`Project Stage Definition` is reusable configuration for stage/phase terminology, ordering, hierarchy and entry/exit criteria.

A Project uses an effective `Delivery Stage Assignment` referencing that definition.

Therefore:

```text
Project Stage Definition
    ≠ Project lifecycle
    ≠ Workflow state
    ≠ Project identity
```

## Authority and permission policy

NuBlox keeps policy, assignment, grant and decision distinct:

```text
Role Definition
    ↓
Role Assignment to Party + scope + effectivity

Permission Definition
    ↓
Role/policy composition
    ↓
Contextual authorization evaluation

Delegated Authority Rule
    ↓
Delegated Authority grant

Approval Authority Rule
    ↓
protected action evaluation
    ↓
Approval Request / Decision / Approval Evidence
```

A Role Definition is not a Role Assignment. A Permission Definition is not effective authorization. A Delegated Authority Rule is not the authority grant. An Approval Authority Rule is not an approval decision.

## Retention policy

`Retention Rule` defines policy such as trigger, period, disposition, jurisdiction and exception logic.

Runtime controls/evidence remain separate:

```text
Data Retention Class / Record Type / Evidence Type
        ↓
Retention Rule
        ↓
eligibility evaluation
        ↓
Legal Hold check
        ↓
Retention Disposition Decision
        ↓
execution evidence
```

An active Legal Hold prevents otherwise-eligible disposition.

## Numbering and business identifiers

`Numbering Scheme` governs generation of business identifiers. It can define pattern, prefix, sequence scope and reset behaviour.

Business numbering never becomes system identity. Renumbering or scheme changes must not break canonical references.

## Tax and jurisdiction

`Jurisdiction`, `Tax Regime`, `Tax Code` and `Regulatory Regime` are shared references across Finance, Commercial, Procurement, Legal, Compliance and Project contexts.

They scope obligations and calculation/evaluation rules but do not replace Legal Entity, Site, Contract or Project identities.

## Calendar semantics

`Calendar` defines reusable working-time patterns and exceptions.

`Fiscal Calendar` defines financial year/period structure.

They remain separate from:

- Project Schedule;
- Accounting Period runtime state;
- Work Item due dates;
- Asset maintenance plans.

Those domain objects consume controlled calendar configuration.

## Information configuration

`Information Container Type` replaces the candidate interpretation of `Document Type` as controlled content. It defines metadata/behaviour for governed information types such as drawing, model, specification or document.

`Suitability Code` classifies use/exchange suitability. Neither type nor suitability becomes Information Container identity.

## Contract configuration

`Contract Form Family` classifies standard/bespoke form families.

`Contract Template` is a version-controlled legal/commercial configuration used to originate a Contract. Existing Contracts retain their own identity and agreed terms; publishing a new template version never rewrites them.

## Non-negotiable rules

1. Reference/configuration is not transactional truth.
2. Historical records remain interpretable against exact reference/configuration versions.
3. Classification overlays identity; it never replaces identity.
4. Uniclass uses the generic System → Release → Code model.
5. Lifecycle and workflow definitions are configuration, not runtime domain state.
6. Project Stage Definition is not Project lifecycle or workflow state.
7. Role Definition is not Role Assignment.
8. Permission Definition is not effective authorization.
9. Delegated Authority Rule is not Delegated Authority grant.
10. Approval Authority Rule is not Approval Request, Decision or Approval Evidence.
11. Retention Rule is policy; Legal Hold and Disposition Decision are runtime control/evidence.
12. Numbering Scheme never replaces immutable system identity.
13. Reference updates cannot rewrite historical business meaning.
14. Jurisdiction and regulatory references scope obligations without becoming business/spatial identity.
15. Currency, Unit of Measure, Tax, calendar and classification semantics are shared across all workspaces.

## Candidate normalization summary

All 37 BOF-29 candidates are covered by the governed model.

Key normalisations include:

- `Uniclass Reference` → generic `Classification Code` under explicit Uniclass system/release;
- `Workflow Template` → `Workflow Definition` reusable/versioned model;
- `Document Type` → `Information Container Type`;
- `Location Classification` → `Location Classification Profile`;
- `Asset Classification` → `Asset Classification Profile`;
- `Cost Classification` → `Cost Classification Profile`;
- `Work Classification` → `Work Classification Profile`;
- `Resource Classification` → `Resource Classification Profile`.

This completes the initial canonical foundation sequence through BOF-29 and gives the later physical data model a governed source for reference, classification, policy and configuration semantics.
