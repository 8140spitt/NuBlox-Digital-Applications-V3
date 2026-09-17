import { describe, expect, it } from 'vitest';
import {
  commercialBoundaries,
  commercialProcurementModel,
  commercialProcurementRelationships,
  commercialProcurementRules,
  validateCommercialProcurementModel
} from './commercial-procurement-model';

describe('commercial and procurement semantic model', () => {
  it('is internally valid and has unique model identifiers', () => {
    expect(validateCommercialProcurementModel()).toBe(true);
    expect(new Set(commercialProcurementModel.map((item) => item.modelId)).size).toBe(commercialProcurementModel.length);
    expect(commercialBoundaries.length).toBeGreaterThanOrEqual(6);
    expect(commercialProcurementRules.length).toBeGreaterThanOrEqual(10);
  });

  it('keeps contract types on one agreement identity pattern', () => {
    const contract = commercialProcurementModel.find((item) => item.modelId === 'CBO-CONTRACT');
    expect(contract?.candidateKeys).toEqual(expect.arrayContaining(['BOF-08-001', 'BOF-08-002', 'BOF-08-003', 'BOF-08-004']));
    expect(contract?.governance.join(' ')).toContain('Appointment');
    expect(contract?.governance.join(' ')).toContain('Subcontract');
    expect(contract?.governance.join(' ')).toContain('Framework Agreement');
  });

  it('keeps delivery, commercial and procurement packages semantically distinct', () => {
    const commercialPackage = commercialProcurementModel.find((item) => item.modelId === 'COM-COMMERCIAL-PACKAGE');
    const procurementPackage = commercialProcurementModel.find((item) => item.modelId === 'COM-PROCUREMENT-PACKAGE');
    expect(commercialPackage?.modelId).not.toBe(procurementPackage?.modelId);
    expect(commercialProcurementRelationships.some((relation) => relation.from === 'DEL-WORK-PACKAGE' && relation.to === 'COM-COMMERCIAL-PACKAGE')).toBe(true);
    expect(commercialProcurementRelationships.some((relation) => relation.from === 'COM-PROCUREMENT-PACKAGE' && relation.to === 'DEL-WORK-PACKAGE')).toBe(true);
  });

  it('separates sourcing decision from commitment and receipt', () => {
    const award = commercialProcurementModel.find((item) => item.modelId === 'PROC-AWARD');
    const po = commercialProcurementModel.find((item) => item.modelId === 'PROC-PURCHASE-ORDER');
    const receipt = commercialProcurementModel.find((item) => item.modelId === 'PROC-RECEIPT');
    expect(award?.kind).toBe('transaction');
    expect(po?.kind).toBe('transaction');
    expect(receipt?.kind).toBe('event-evidence');
    expect(commercialProcurementRelationships.some((relation) => relation.from === 'PROC-AWARD' && relation.to === 'PROC-PURCHASE-ORDER')).toBe(true);
    expect(commercialProcurementRelationships.some((relation) => relation.from === 'PROC-PURCHASE-ORDER' && relation.to === 'PROC-RECEIPT')).toBe(true);
  });

  it('normalises contract-form and sourcing aliases without losing specialist meaning', () => {
    expect(commercialProcurementModel.find((item) => item.modelId === 'COM-COMMERCIAL-CHANGE')?.candidateKeys)
      .toEqual(expect.arrayContaining(['BOF-08-014', 'BOF-08-015', 'BOF-08-016']));
    expect(commercialProcurementModel.find((item) => item.modelId === 'PROC-SOURCING-REQUEST')?.candidateKeys)
      .toEqual(expect.arrayContaining(['BOF-09-009', 'BOF-09-010']));
    expect(commercialProcurementModel.find((item) => item.modelId === 'PROC-SOURCING-RESPONSE')?.candidateKeys)
      .toEqual(expect.arrayContaining(['BOF-09-012', 'BOF-09-013']));
  });
});
