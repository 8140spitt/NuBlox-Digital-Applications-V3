# PTC Windchill — Supplier Identity, Lifecycle, Sourcing Context & AML/AVL Model

**Status:** Verified benchmark evidence — core Supplier Management semantics closed; broader qualification gap identified  
**Primary source:** PTC Windchill Cloud 12.0.2.0 Help Center  
**Last updated:** 23 September 2026  
**Purpose:** Separate supplier identity, supplier lifecycle, supplier-part identity, OEM↔supplier-part relationships, contextual sourcing status, sourcing rules and Part Request workflow before translating supplier governance into NuBlox.

> This is benchmark evidence. Windchill Supplier Management is not the complete NuBlox supplier/procurement model.

## 1. Supplier identity is linked to an Organisation but is not the same concept

Creating a Supplier requires specifying a **supplier Organisation**, either by selecting an existing Organisation or, where authorised, creating one.

The Supplier then has its own supplier attributes and Supplier Information Page.

The Supplier Information Page exposes:

- supplier attributes;
- contacts;
- related documents;
- supplied Parts;
- lifecycle state.

Therefore the benchmark distinguishes:

~~~text
Organisation / legal-business participant
        ↓ represented as / linked to
Supplier
        ↓
Manufacturer or Vendor role/type
~~~

NuBlox should not overload Organisation identity, commercial relationship, supplier qualification and sourcing approval into one record.

## 2. Supplier has its own lifecycle

Windchill Supplier Management allows the Supplier lifecycle state to be set to:

- **In Work**
- **Released**
- **Canceled**

This lifecycle applies to the supplier record itself.

It does **not** mean that every Part from that supplier is approved for every product, geography or sourcing condition.

## 3. Manufacturer and Vendor Parts are separate from OEM Parts

Windchill distinguishes:

- OEM Part;
- Manufacturer Part;
- Vendor Part;
- Manufacturer/Vendor Supplier identity.

An OEM Part may be associated with multiple Manufacturer Parts. Manufacturer Parts can in turn relate to Vendor Parts, and Windchill also supports direct OEM-to-Vendor relationships.

These relationships form the AML/AVL sourcing graph.

The supplier relationship must therefore not be reduced to a free-text manufacturer name on an OEM Part.

## 4. Sourcing status belongs to the part relationship

The sourcing status ranks the supplier Part in relation to the OEM Part.

Default statuses include:

- **Preferred**
- **Approved**
- **Do Not Use**

The status is applied to the relationship between associated Parts, not to the Supplier globally.

This is one of the most important Supplier Management distinctions:

~~~text
Supplier lifecycle
      ≠
Supplier-Part lifecycle
      ≠
OEM ↔ Supplier-Part sourcing status
~~~

A Supplier can be Released while a particular Manufacturer/Vendor Part relationship is Approved, Preferred or Do Not Use depending on context.

## 5. Sourcing Context makes approval conditional

A **Sourcing Context** allows an AML/AVL to be maintained for a specific set of conditions.

PTC examples include:

- geographic location of a production facility;
- particular product line within a product family.

The system provides a default Sourcing Context and allows additional contexts/subtypes/attributes.

Therefore sourcing approval is contextual:

~~~text
OEM Part
   +
Supplier Part
   +
Sourcing Context
   ↓
Sourcing Status
~~~

This is materially different from a single global supplier approval flag.

## 6. Sourcing Rules automate default and bulk status assignment

Sourcing Rules can evaluate criteria such as:

- Supplier;
- Sourcing Context;
- classification node where Classification is installed.

Rules can:

- set default sourcing status for new AML/AVL entries meeting the criteria;
- be executed against existing supplier Parts to update sourcing status.

A Sourcing Rule itself has execution state such as:

- Active;
- Disabled;
- Executing.

The rule is therefore distinct from the resulting sourcing status.

## 7. AML and AVL are contextual relationship sets

The Approved Manufacturer Part List and Approved Vendor Part List are not merely lists of organisations.

They represent approved/preferred/do-not-use supplier-Part relationships for OEM Parts under a Sourcing Context.

This implies at least four identities:

1. OEM Part
2. Supplier Part
3. Supplier
4. Sourcing Context

with a governed relationship carrying sourcing status.

## 8. Part Request is a separate governed process

Windchill also has a **Part Request** object/process for controlled creation of new Parts.

The Part Request:

- is a first-class tracked object;
- launches workflow tasks;
- has a lifecycle;
- is iterated on check-out/edit;
- can be revised after rejection/change;
- uses Team, Lifecycle, Workflow and Object Initialisation templates;
- can require approved supplier Parts and supporting technical documentation before resulting OEM Part release.

This is not the same thing as Supplier lifecycle or AML/AVL status.

It provides evidence for a governed demand-to-approved-part process.

## 9. Authority is separated

Supplier Management separates administrative authority:

- Site Administrator;
- Organisation Administrator;
- Sourcing Administrator;
- General User.

The Sourcing Administrator can maintain supplier data, define Sourcing Contexts, create/execute sourcing rules and manage sourcing-related information.

General users can perform selected AML/AVL/status/Part Request operations depending on permissions.

Thus supplier governance should not be represented as generic CRUD access.

## 10. What Windchill does not prove as a complete supplier qualification model

The reviewed Windchill Supplier Management Help Center establishes:

- Supplier identity;
- Supplier lifecycle;
- contacts/documents;
- manufacturer/vendor Parts;
- OEM ↔ supplier-Part relationships;
- Sourcing Context;
- contextual sourcing status;
- sourcing rules;
- AML/AVL;
- Part Request workflow.

It does **not** establish a first-class, comprehensive supplier qualification/assessment model covering all of the following as governed canonical objects/processes:

- prequalification questionnaire;
- financial assessment;
- insurance validation/expiry;
- health & safety assessment;
- competence/certification;
- quality-system certification;
- ESG/sustainability assessment;
- sanctions/compliance screening;
- modern-slavery due diligence;
- supplier audit;
- corrective action from supplier audit;
- performance scorecard;
- periodic reassessment;
- framework/category qualification;
- project-specific onboarding;
- approved supplier scope by service/work category;
- qualification expiry/suspension/reinstatement.

Some of these may be implementable with generic Windchill documents, lifecycle, workflow and attributes, but the Supplier Management evidence does not justify claiming they are first-class supplier-domain semantics.

For NuBlox Construction & the Built Environment, this remains a genuine domain requirement to benchmark against procurement/SRM and construction supply-chain systems.

## 11. Candidate NuBlox supplier graph

The benchmark supports testing a graph such as:

~~~text
Organisation / Party
      ↓
Supplier Relationship
      ├── lifecycle / commercial standing
      ├── contacts / documents
      └── qualification records
             ↓
Supplier Capability / Scope
             ↓
Supplier Product / Service / Resource
             ↓
Sourcing / Procurement Context
             ↓
Approval / Preference / Restriction
             ↓
Project / Contract / Asset use
~~~

For physical products/components, the Windchill pattern additionally provides:

~~~text
Internal/OEM Item
      ↔
Supplier Item
      ↔
Supplier
      +
Sourcing Context
      ↓
Sourcing Status
~~~

NuBlox should preserve the distinction between **supplier qualification** and **item/source approval**.

## 12. Research conclusion for WHC-029

The core Windchill Supplier Management model is now closed sufficiently for benchmark purposes:

- Supplier ↔ Organisation distinction verified;
- Supplier lifecycle verified;
- Manufacturer/Vendor/OEM Part separation verified;
- relationship-scoped sourcing status verified;
- context-dependent AML/AVL verified;
- Sourcing Rules verified;
- Part Request as separate lifecycle/workflow object verified;
- broader supplier qualification/assessment is confirmed as a NuBlox/CBE benchmark gap rather than silently inferred.

The next supplier research should therefore move outside Windchill to market-leading SRM/procurement/construction vendor-management systems for the missing qualification, assessment, performance and compliance semantics.

## Primary PTC sources

- Suppliers — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/SumaSuppListPageAbout.html
- Creating a New Supplier — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/SumaSupplierCreate.html
- Supplier Information Page — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/SumaSuppDetailsPageAbout.html
- Setting the Supplier Life Cycle — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/SumaSupplierLifeCycleSet.html
- Sourcing Contexts — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/SumaContextPageAbout.html
- Sourcing Rules — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/SumaRulesPageAbout.html
- Modifying the Sourcing Status — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/SumaSourceStatusUpdate.html
- Tasks and Administrative Privileges — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/SUMA_TaskAdminPriv.html
- Overview of the Part Request Process — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/SUMA_NPRAbout.html
- Templates Used with the Part Request Process — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/SumaNPRConfigureTemplates.html
