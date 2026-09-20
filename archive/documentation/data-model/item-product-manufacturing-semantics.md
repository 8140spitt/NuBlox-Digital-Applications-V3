# Item, Product, Material & Manufacturing Semantics

Status: **governing V3 logical semantic model**

This document defines how NuBlox represents reusable Item definitions, commercial/catalogue context, product structure, manufacturing definition/execution and physical traceability without creating duplicate masters across estimating, procurement, inventory, manufacturing, project delivery and asset operations.

## Core rule

`Item` is the canonical reusable commercial/technical definition. Product, material and service are governed classifications/behaviours of that identity, not three parallel master-data systems.

```text
Item
├─ Item Specification
├─ Item Variant
├─ Manufacturer-Item Relationship
├─ Supplier-Item Relationship
├─ Catalogue membership
├─ Price / Rate context
└─ Bill of Material
```

An Item is **not** a stock quantity, Lot, Batch, Serial Identity or installed Asset.

## Identity layers

```text
Definition              Item
Configuration           Specification / Variant / BOM / Manufacturing Definition
Traceable quantity      Lot / Batch
Traceable unit          Serial Identity
Operational identity    Asset
```

These layers may be related, but they must not be collapsed into one ID merely because an ERP package historically stores them together.

Example: ten identical pumps can reference one Item definition. They may be received under one or more Lots/serial identities. When specific pumps are installed and require whole-life operational governance, NuBlox can register Assets that reference the originating Item, manufacturer, Lot/Batch/Serial and as-manufactured provenance.

## Product/material/service classification

`Product Item`, `Material Item` and `Service Item` normalize to one `Item` master.

A service Item may behave differently from a physical material Item—for example no stock traceability—but this difference is controlled through type/classification and policy rather than a parallel identity domain.

## Manufacturer and supplier relationships

Manufacturers and suppliers reuse canonical Party/Organisation identity.

```text
Party / Organisation
      ↓ relationship
Manufacturer-Item / Supplier-Item
      ↓
Item
```

The relationship can carry manufacturer part number, supplier SKU, approval/qualification, lead time, ordering constraints and effectivity. External identifiers do not replace NuBlox identity.

## Catalogue and pricing

Catalogue membership is an effective relationship to canonical Items. A Catalogue never duplicates the Item master.

Price Lists are separate effective-dated commercial definitions. Rate/price entries preserve currency, quantity break, context and dates. Historic business transactions retain the price/rate actually applied even when the current Price List changes.

Estimate build-up rates, supplier purchase prices, internal transfer rates and customer sales prices can all reference common Items while remaining distinct commercial facts.

## Unit of Measure

Unit of Measure is shared reference data, not Item-owned master data. The BOF-10 occurrence therefore reuses the canonical BOF-29 Unit of Measure definition.

Recorded transactions preserve their original quantity and UOM. Governed conversions may provide canonical quantities where dimensionally valid.

## Bill of Material

The BOF-10 `BOM` and BOF-11 `Bill of Material` represent one canonical product/material structure.

```text
Parent Item
   ↓
Bill of Material
   ├─ BOM Line → Component Item + quantity/UOM
   ├─ BOM Line → Component Item + quantity/UOM
   └─ BOM Line → Component Item + quantity/UOM
```

Assembly is an Item role/type that may own or use a BOM; it is not a second Assembly master.

A BOM is **not**:

- a Project WBS;
- a Schedule;
- an Asset/System hierarchy;
- the as-installed configuration;
- the as-manufactured configuration.

Those structures can be mapped to the BOM while keeping their own semantics.

## Manufacturing definition

A Manufacturing Definition records the controlled configuration used to produce an Item and links the effective BOM, Manufacturing Process Plan, Work Centres and applicability/effectivity.

Approved Manufacturing Definitions are revision-controlled and immutable. A revised definition supersedes rather than silently changes the prior production basis.

## Process plan and routing

Manufacturing Process Plan defines the operation/routing structure and required production resources. Routing is governed within this pattern rather than treated as another product master.

Process-plan operations are definitions. Actual Production Operations are execution records under Production Orders.

Schedule Activities may relate to production work for project planning, but Schedule Activity and Production Operation are different business objects.

## Work Centre

Work Centre is the production-capacity context used for planning and manufacturing execution. It can reference canonical Organisation Unit, Site and Asset resources.

It does not duplicate those identities.

## Production planning and execution

Production Plan is the planning object for intended production demand/capacity. Production Order is the governed execution order.

```text
Demand / Production Plan
          ↓
Production Order
          ↓
Production Operation(s)
          ↓
Actual material/resource consumption
          ↓
Produced Lot / Batch / Serial identity
          ↓
As-Manufactured Configuration
```

Production Operation is a child/execution step, not a separate Production Order master.

## Lot, Batch and Serial Identity

Lot and Batch are traceability identities associated with Item/provenance. They remain distinct where industry, manufacturing or regulatory semantics require the distinction.

`Production Lot` and `Production Batch` reuse the shared Lot and Batch models rather than creating manufacturing-only identities.

Serial Identity uniquely identifies an Item instance for traceability. It is not automatically an Asset. Asset registration is a governed relationship/transition when installed or operational whole-life identity is required.

## As-manufactured truth

As-Manufactured Configuration captures what was actually produced, including consumed components/materials, Lot/Batch/Serial genealogy, operations/work centres and quality/traceability evidence.

It does not alter the approved Manufacturing Definition or BOM. Any permitted deviation is retained as traceable actual configuration and supporting decision/change evidence.

## Evidence events

Shop-floor Progress Event, Production Quality Record, Production Traceability Record, Scrap Record, Waste Record and Production Cost Evidence are evidence/event facts. They feed projections and downstream processes but do not become duplicate identity masters.

## Relationship to Asset management

```text
Item definition
      ↓ produced/procured as
Lot / Batch / Serial
      ↓ selected / installed / commissioned
Asset
      ↓ retains provenance to
Item + manufacturer + serial + as-manufactured configuration
```

This preserves one whole-life evidence chain from product definition through delivery into operations and maintenance.

## Non-negotiable rules

1. Product, material and service classifications do not create parallel Item masters.
2. Item, inventory quantity, Lot/Batch, Serial Identity and Asset are distinct semantic layers.
3. BOM is distinct from WBS and from the permanent Asset/System hierarchy.
4. Manufacturer/Supplier reuse canonical Party identity.
5. Catalogues and Price Lists reference Items; they do not own duplicate Items.
6. Controlled definitions are revision/effectivity governed and cannot be silently overwritten after approval.
7. Manufacturing execution records the exact definition versions used.
8. Actual produced configuration never rewrites approved definition truth.
9. Traceability survives procurement, production, inventory, installation, project handover and operations.
10. External product/manufacturer/supplier identifiers map to canonical identities rather than redefining them.

## Next dependency

Inventory, warehouse and logistics semantics should now build on these identities: Warehouse/Store/Bin, stock position, reservation, inventory movement, material issue/return, stock transfer/count/adjustment, quarantine, pick/pack/shipment, transport and delivery must reference canonical Item and Lot/Batch/Serial identities rather than introduce another material master.
