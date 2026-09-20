# Inventory, Warehouse & Logistics Semantics

## Status

Governed NuBlox V3 canonical-model baseline for inventory storage, stock control and logistics execution.

## Core separation

```text
Item definition
  ↓
Lot / Batch / Serial traceability
  ↓
Inventory position and reservation
  ↓
Warehouse → Store → Bin Location
  ↓
Inventory Movement / Count / Adjustment / Quarantine
  ↓
Pick → Pack → Shipment → Transport Order → Delivery
```

These structures are deliberately connected without being collapsed into one hierarchy.

## Governing rules

1. **Item identity is not inventory quantity.** Product/material/service definition remains in the canonical Item model.
2. **Stock Position is derived.** On-hand, available, reserved, quarantined and in-transit balances are projections from immutable posted events and active restrictions/commitments.
3. **Storage hierarchy is inventory-specific.** Warehouse, Store and Bin Location do not become Site, Facility, Project/WBS or Asset hierarchies.
4. **Issue, Return and Transfer are one movement pattern.** Material Issue, Material Return and Stock Transfer are governed Inventory Movement types.
5. **Posted inventory truth is not silently edited.** Corrections use reversal/correction events and retained audit evidence.
6. **Reservation is a relationship.** It commits availability to demand but does not physically move stock.
7. **Quarantine is a restriction case.** It constrains use/availability of inventory while disposition is resolved and does not create a duplicate stock master.
8. **Traceability survives movement.** Item + Lot/Batch/Serial provenance remains connected through procurement, production, storage, shipment, installation and operations.
9. **Logistics records stay distinct.** Pick, Pack, Shipment, Transport Order and Delivery are separate execution/evidence objects.
10. **Delivery and procurement receipt differ.** Proof of delivery does not replace Goods Receipt/Service Receipt where procurement, ownership or accounting semantics require those records.
11. **Call-off is not logistics-owned truth.** Logistics consumes the canonical commercial/procurement `Call-off Order` and must not create a second call-off identity.
12. **Trade declarations are typed compliance records.** Import and Export declarations use the governed Trade Declaration pattern with jurisdictional configuration.

## Canonical constructs

The application model defines Warehouse, Store, Bin Location, Inventory Reservation, Inventory Movement, derived Stock Position, Stock Count, Inventory Adjustment, Inventory Quarantine, Pick, Pack, Shipment, Transport Order, Delivery, Site Logistics Booking and Trade Declaration. `Call-off Order` is referenced from the commercial/procurement model rather than redefined here.

## Inventory truth

A stock balance is reconstructable from business facts:

```text
opening / migration evidence
+ posted receipts/movements
+ production/consumption effects
+ posted adjustments
= physical on-hand

physical on-hand
- active reservations
- active quarantine/restrictions
± in-transit/custody classification
= operational availability projections
```

NuBlox must not store a manually editable `quantity_on_hand` field as independent business truth without a traceable event basis.

## Cross-model references

Inventory and logistics reuse canonical:

- `Item`, `Lot`, `Batch`, `Serial Identity` from the item/manufacturing model;
- `Party` / `Organisation` for supplier, carrier and custodian roles;
- `Site` / `Facility` for physical context;
- `Project`, `WBS` and `Work Package` only as demand/allocation references;
- `Contract`, `Purchase Order`, `Call-off Order`, Goods/Service Receipt and commercial commitments where applicable;
- `Asset` only when an installed/operational asset identity is established through governed registration/installation.

## Physical-schema hold

This document governs semantics, not table design. Physical persistence must preserve event immutability, traceability, tenant/legal-entity scope, UOM integrity, location history, authority and auditability before implementation is treated as canonical.
