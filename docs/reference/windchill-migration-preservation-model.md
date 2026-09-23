# PTC Windchill — Import, Export, Data Loading & Migration Preservation Model

**Status:** Active reference evidence  
**Primary target:** Windchill 12.0.2.0  
**Purpose:** Distinguish operational spreadsheet import, Windchill Import/Export, package exchange and initial/legacy data loading, and identify exactly which semantics are or are not preserved.

> This is Windchill reference evidence, not a NuBlox migration design decision.

## 1. Windchill has several different data-movement mechanisms

They must not be treated as interchangeable.

```text
Spreadsheet Import/Export
    operational bulk create/update of supported business data

Windchill Import/Export
    exchange of supported Windchill objects between existing systems

LoadFromFile / LoadFileSet
    initial/legacy/system data loading using loaders

Package / Received Delivery
    governed exchange with package/delivery/mapping/source-authority semantics

Specialised template/admin import-export
    lifecycle, workflow, context-template and other administration families
```

The supported objects and preservation semantics differ between these paths.

## 2. Spreadsheet import is operational bulk work, not history migration

Windchill's Excel import framework supports worksheets such as:

- PART;
- DOCUMENT;
- BOM;
- AXL / AML-AVL;
- REPLACEMENTS.

The spreadsheet is converted to XML and loaded sequentially.

Import operations execute with the same underlying permissions required to perform the equivalent create/update manually.

Document import can specify values including:

- Type;
- Name;
- Number;
- target Location;
- owning Organisation ID;
- Revision;
- lifecycle State.

BOM import can specify:

- Add/Delete action;
- hierarchy Level;
- part Number;
- trace code;
- owning Organisation;
- target Container;
- parent Revision;
- View;
- Quantity/UOM;
- reference designators.

A BOM import creates a baseline which captures the imported revision configuration.

This is controlled bulk editing. It does not prove preservation of the object's historical event/decision chain.

## 3. Spreadsheet import job is transactional at job level

Each spreadsheet import is represented by an Import Job.

Documented states include:

- Pending;
- Validated;
- Running;
- Completed;
- Canceled;
- Failed.

If the job fails, Windchill rolls back changes made by the import. Cancellation during execution also rolls back changes.

The job retains:

- original spreadsheet;
- validation/error log;
- generated baselines for BOM imports.

The import job is therefore a first-class execution/evidence object, not merely a file upload.

## 4. Windchill Import/Export — object transfer

The Import/Export framework exchanges supported Windchill objects using JAR packages.

It can:

- collect supported high-level objects;
- include object content and supported relationships;
- use date/time filtering;
- apply configuration specifications for structure export;
- apply mapping rules;
- apply context mapping;
- apply policy files;
- surface import conflicts.

The mechanism is not a complete database/history clone.

## 5. Multiple versions vs historical provenance

For core PDMLink objects such as Documents and Parts, the supported-object matrix says **multiple versions and iterations can be exported/imported**.

However, the same matrix separately states that the following are not preserved/exported:

- version history;
- iteration history;
- lifecycle history.

Therefore:

```text
multiple version/iteration records
!=
version/iteration provenance history
```

Migration must explicitly distinguish:

1. migrated governed states/versions; and
2. historical events that explain how those states were reached.

## 6. Context is remapped, not preserved as original location

For Documents, Parts and EPMDocuments, original Location/Context is not exported as preserved placement.

The objects are imported into a **target context**.

This means migration semantics include an explicit target-placement decision:

```text
source context
    -> context mapping / target selection
        -> target context
```

Original context identity therefore needs separate provenance if it matters historically.

## 7. Lifecycle preservation is referential

Documents, Parts and EPMDocuments can carry their associated lifecycle reference.

However:

- the actual lifecycle template is not bundled with each object;
- the target system is expected to contain the corresponding lifecycle template;
- lifecycle templates can be migrated separately through Lifecycle Administration;
- lifecycle history is not exported.

This creates three distinct concepts:

```text
Object lifecycle-template reference
!= Lifecycle Template definition
!= Lifecycle execution/history
```

A migration that restores only the lifecycle state/name has not reproduced lifecycle history.

## 8. Views and configuration dependencies

Part Views can be supported, but the target must already have the corresponding View object.

Configuration Specifications and Baselines are not generally exported as part of normal Part/Document object migration.

Effectivity can be loadable through dedicated loader capability even where it is not supported by ordinary import/export.

Therefore configuration semantics can require a separate dependency/migration wave.

## 9. Change history is not preserved by normal object import/export

The 12.0.2 supported-object table explicitly lists ordinary Change objects and change associations as unsupported for the relevant generic import/export families.

For Parts/Documents, associated Change objects and change history are not exported as part of ordinary object migration.

This means:

```text
migrating the released Part/Document
does not imply
migrating its historical Change authority
```

NuBlox migration must treat Change history/evidence as its own preservation concern.

## 10. Participants and administration data require separate handling

The supported-object matrix separates data loaders from Import/Export.

Examples:

- Users can be loaded but are not exported through ordinary object Import/Export.
- Groups and membership can be loaded but are not exported through ordinary object Import/Export.
- Organisation metadata can be loaded but is not generically exported.
- Domains and access-control rules can be loaded, but generic export support is limited.
- Team Templates can be loaded but are not generically exported.
- Life Cycle Templates and Workflow Templates have their own dedicated administration import/export paths.

Therefore identity/security/bootstrap migration requires ordered prerequisite waves before business-object import.

## 11. Context templates and access configuration

Product/Library context metadata and context teams/access-control rules can be carried as part of Context Template mechanisms.

This is different from migrating runtime object placement or runtime team instances.

A target system can therefore receive an administrative template without reproducing the full operational history of a source context.

## 12. Mapping rules and policy rules

Windchill separates:

- **mapping rules** — modify/translate import/export XML and mappings;
- **policy files** — determine actions applied during import/export;
- **context mapping files** — control destination context mapping;
- import **conflict resolution** — handle collisions/mismatches.

Later official PTC documentation describes policy actions including:

- ignore;
- create new object;
- substitute object;
- unlock and iterate.

This reinforces the separation:

```text
source identity
-> mapping
-> conflict evaluation
-> resolution policy
-> target identity/state
```

Mapping is not equivalent to silent overwrite.

## 13. Import conflicts are first-class outcomes

Import conflicts occur when imported information collides with target-system state.

Documented examples include:

- object already exists;
- target folder missing/inaccessible;
- owning organisation cannot be resolved;
- lifecycle state/template mismatch;
- business-field/type mismatch;
- participant/user/principal cannot be resolved in package import.

Conflict semantics can include:

- automatic failure;
- overridable conflict;
- skip;
- import metadata/content selectively;
- create/map target administration data;
- use prior/default/OIR-derived values.

A migration engine therefore requires explicit conflict disposition evidence.

## 14. Loader vs Import/Export

PTC explicitly distinguishes the intended use:

- **LoadFromFile** — single-file initial/system load;
- **LoadFileSet** — multi-file initial/system load;
- **Import/Export** — exchange between existing Windchill systems.

Different object families are supported by each.

For example, loaders cover administration/bootstrap data that normal object Import/Export does not, including users, organisations, contexts, preferences and various definitions.

Migration architecture must therefore select the transport according to the semantic family being migrated rather than force every object through one generic mechanism.

## 15. Preservation matrix conclusion

The Windchill benchmark proves that successful object transfer is not a sufficient definition of migration completeness.

A complete migration concern set includes at least:

```text
canonical identity
master identity
revision
iteration
current lifecycle state
lifecycle history
object relationships
structure
content
representations
context provenance
target context mapping
organisation ownership
view
configuration
effectivity
change authority/history
participants
teams/roles
access-control semantics
security labels
templates
audit/events/decisions
source provenance
mapping/disposition evidence
import transaction result
```

No single Windchill data-movement mechanism preserves all of these.

## 16. Candidate NuBlox migration principles

Subject to architecture translation:

1. **Migration Run** must be a first-class governed execution object.
2. Every migrated object needs source-system/source-identity provenance.
3. Original source context and target context must both be retained when placement changes.
4. Version records and version-history events are separate migration concerns.
5. Lifecycle state and lifecycle history are separate migration concerns.
6. Change authority/history cannot be inferred from the migrated resulting object.
7. Identity/participant/security prerequisites must be migrated before dependent business objects.
8. Mapping and conflict resolution must produce durable evidence.
9. Failed batch/import execution must support deterministic rollback or compensating semantics.
10. Migration completeness must be tested against semantic preservation, not file/object counts.

## Primary PTC evidence

- 12.0.2.0 Supported Objects: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/it/Windchill_Help_Center/exportimportChp_SupportObjList.html
- 12.0.2.0 Import Job Monitor: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ImExImportJobInfoPage.html
- 12.0.2.0 Spreadsheet import considerations: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ImExPartsProdStructure.html
- 12.0.2.0 Document spreadsheet format: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ImExFileFormatDocuments.html
- 12.0.2.0 BOM spreadsheet format: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ImExFileFormatProdStructures.html
- 12.0.2.0 Export/Import branch: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ExportImportAbout.html
- 12.0.2.0 Loader vs Import/Export branch: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WCDataLoad_IntroWhenUseLoadFromFile.html
- Current PTC corroboration for loader/import-export distinction: https://support.ptc.com/help/windchill/plus/r13.1.2.0/it/Windchill_Help_Center/WCDataLoadGuide/WCDataLoad_IntroWhenUseLoadFromFile.html
- Current PTC corroboration for import conflicts: https://support.ptc.com/help/windchill/plus/r13.1.2.0/en/Windchill_Help_Center/ExpImpPolicyRules_Chp/ExpImpPolicyRulesChp_ConflictMessagesPackages.html
