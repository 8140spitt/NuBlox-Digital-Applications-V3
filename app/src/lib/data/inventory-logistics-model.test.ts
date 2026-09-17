import { describe, expect, it } from 'vitest';
import {
  inventoryLogisticsModel,
  inventoryLogisticsRelationships,
  inventoryLogisticsRules,
  validateInventoryLogisticsModel
} from './inventory-logistics-model';

describe('inventory and logistics semantic model', () => {
  it('is internally valid and relationship-complete', () => {
    expect(validateInventoryLogisticsModel()).toBe(true);
    expect(new Set(inventoryLogisticsModel.map((item) => item.modelId)).size).toBe(inventoryLogisticsModel.length);
    expect(inventoryLogisticsRelationships.length).toBeGreaterThanOrEqual(15);
  });

  it('keeps stock position as a projection rather than mutable truth', () => {
    const position = inventoryLogisticsModel.find((entry) => entry.modelId === 'INV-STOCK-POSITION');
    expect(position?.kind).toBe('projection');
    expect(position?.governance.join(' ')).toContain('calculated from posted movements');
  });

  it('normalises issue return and transfer into inventory movement', () => {
    const movement = inventoryLogisticsModel.find((entry) => entry.modelId === 'INV-MOVEMENT');
    expect(movement?.candidateKeys).toEqual(expect.arrayContaining(['BOF-10-022', 'BOF-10-023', 'BOF-10-024', 'BOF-10-025']));
    expect(inventoryLogisticsRules.join(' ')).toContain('Issue, Return and Transfer are Inventory Movement types');
  });

  it('keeps storage hierarchy separate from project and asset structures', () => {
    expect(inventoryLogisticsRules.join(' ')).toContain('Warehouse, Store and Bin');
    expect(inventoryLogisticsRules.join(' ')).toContain('Project/WBS');
    expect(inventoryLogisticsRules.join(' ')).toContain('Asset hierarchies');
  });

  it('keeps shipment transport and delivery distinct', () => {
    expect(inventoryLogisticsModel.find((entry) => entry.modelId === 'LOG-SHIPMENT')?.kind).toBe('transaction');
    expect(inventoryLogisticsModel.find((entry) => entry.modelId === 'LOG-TRANSPORT-ORDER')?.kind).toBe('transaction');
    expect(inventoryLogisticsModel.find((entry) => entry.modelId === 'LOG-DELIVERY')?.kind).toBe('event-evidence');
  });
});
