import { describe, expect, it } from 'vitest';
import {
  itemManufacturingModel,
  itemManufacturingRelationships,
  itemManufacturingRules,
  validateItemManufacturingModel
} from './item-manufacturing-model';

describe('item and manufacturing semantic model', () => {
  it('is internally valid and relationship-complete', () => {
    expect(validateItemManufacturingModel()).toBe(true);
    expect(new Set(itemManufacturingModel.map((item) => item.modelId)).size).toBe(itemManufacturingModel.length);
    expect(itemManufacturingRelationships.length).toBeGreaterThanOrEqual(15);
  });

  it('uses one Item identity for product, material and service definitions', () => {
    const item = itemManufacturingModel.find((entry) => entry.modelId === 'CBO-ITEM');
    expect(item?.candidateKeys).toEqual(expect.arrayContaining(['BOF-10-001', 'BOF-10-002', 'BOF-10-003']));
    expect(item?.governance.join(' ')).toContain('one Item master');
  });

  it('normalises one BOM across product and manufacturing contexts', () => {
    const bom = itemManufacturingModel.find((entry) => entry.modelId === 'ITEM-BOM');
    expect(bom?.candidateKeys).toEqual(expect.arrayContaining(['BOF-10-013', 'BOF-11-002']));
    expect(bom?.governance.join(' ')).toContain('not the physical Asset hierarchy');
  });

  it('keeps traceability identities separate from Item and Asset identity', () => {
    for (const id of ['TRACE-LOT', 'TRACE-BATCH', 'TRACE-SERIAL']) {
      expect(itemManufacturingModel.find((entry) => entry.modelId === id)?.kind).toBe('traceability-identity');
    }
    expect(itemManufacturingRules.join(' ')).toContain('Lot / Batch / Serial identities preserve provenance');
    expect(itemManufacturingRules.join(' ')).toContain('Asset identity');
  });

  it('keeps manufacturing definition and execution distinct', () => {
    expect(itemManufacturingModel.find((entry) => entry.modelId === 'MFG-DEFINITION')?.kind).toBe('controlled-definition');
    expect(itemManufacturingModel.find((entry) => entry.modelId === 'MFG-PRODUCTION-ORDER')?.kind).toBe('work');
    expect(itemManufacturingModel.find((entry) => entry.modelId === 'MFG-AS-MANUFACTURED')?.kind).toBe('event-evidence');
  });
});
