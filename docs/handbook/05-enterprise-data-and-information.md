# 05 — Enterprise Data, Objects & Information

## Canonical data model

NuBlox is object-centric.

A business function, page or workflow does not define data ownership. Canonical business objects carry business truth.

Examples include:

- Tenant;
- Party;
- Person;
- Organisation;
- Worker Relationship;
- Job Profile;
- Position;
- Project;
- Contract;
- Work Package;
- Site;
- Property;
- Asset;
- Item;
- Supplier relationship;
- Estimate;
- Purchase Order;
- Invoice;
- Payment;
- Risk;
- Inspection;
- Work Order;
- Information Container;
- Decision.

## Identity, version and state

NuBlox does not use one generic 'version' concept.

Where applicable, it distinguishes:

```text
Stable identity
Revision / version / iteration
Lifecycle state
Configuration
Effectivity
Representation
Working draft
Published / issued evidence
```

## Party model

Party is the canonical identity foundation.

```text
Party
  -> Person
  -> Organisation
```

Customer, supplier, subcontractor, consultant, partner, regulator and similar concepts are relationships/roles around the same Party identity.

## Project and delivery context

Project, Programme, Contract, WBS, Work Package, Site, Property and Asset are distinct identities.

'Project-related' does not mean 'owned by Project'.

## Product / Item / material

NuBlox distinguishes:

- Item identity;
- specification;
- manufacturer/supplier references;
- variant/configuration;
- structure/BOM where relevant;
- commercial price/cost references;
- stock/inventory;
- serial/lot/batch;
- installed asset identity.

A material Item is not the same object as the physical installed Asset created from it.

## Information and documents

Documents are evidence and controlled information, not the entire data model.

A controlled Information Container may include:

- stable information identity;
- revisions;
- representations/files;
- classification;
- status;
- authors/reviewers;
- issue/effective date;
- transmittal/publication;
- supersession;
- retention/record overlay.

Structured business state remains structured.

For example, a Purchase Order may have a PDF representation, but the PDF is not the authoritative PO transaction.

## Records

A Record is a governance/evidence treatment of authoritative information.

Retention rules, record declarations, legal holds and disposition decisions must not create copied shadow masters.

Legal hold takes precedence over ordinary disposition while preserving the underlying business object's identity.

## Reference and classification data

NuBlox governs shared:

- units;
- currencies;
- calendars;
- classifications;
- jurisdictions;
- lifecycle definitions;
- workflow definitions;
- numbering;
- reason/status codes;
- contract/regulatory references;
- taxonomies.

Historical transactions retain enough reference/version provenance to remain interpretable.

## Structures

Different structures are not collapsed into one hierarchy.

Examples:

- organisation structure;
- project WBS;
- programme hierarchy;
- asset/system hierarchy;
- product/BOM structure;
- location/spatial hierarchy;
- cost breakdown;
- process hierarchy.

Mappings between them are explicit.

## Search and projections

Search indexes, dashboards and reporting models are projections.

They may denormalise data for usability or performance, but they never become competing systems of record.

Search must security-trim results using source-object authorisation.
