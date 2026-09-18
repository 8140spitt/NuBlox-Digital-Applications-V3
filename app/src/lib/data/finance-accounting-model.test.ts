import { describe, expect, it } from 'vitest';
import {
  financeAccountingModel,
  financeAccountingRelationships,
  financeAccountingRules,
  validateFinanceAccountingModel
} from './finance-accounting-model';

describe('finance and accounting semantic model', () => {
  it('is internally valid and relationship-complete', () => {
    expect(validateFinanceAccountingModel()).toBe(true);
    expect(new Set(financeAccountingModel.map((entry) => entry.modelId)).size).toBe(
      financeAccountingModel.length
    );
    expect(financeAccountingRelationships.length).toBeGreaterThanOrEqual(30);
  });

  it('preserves source business identities instead of creating finance duplicates', () => {
    const rules = financeAccountingRules.join(' ');
    for (const name of ['Legal Entity', 'Party', 'Project', 'WBS', 'Contract', 'Asset'])
      expect(rules).toContain(name);
    expect(financeAccountingRelationships.some((r) => r.to === 'CBO-PROJECT')).toBe(true);
    expect(financeAccountingRelationships.some((r) => r.to === 'CBO-CONTRACT')).toBe(true);
    expect(financeAccountingRelationships.some((r) => r.to === 'CBO-ASSET')).toBe(true);
  });

  it('treats ledger entries as immutable posting evidence', () => {
    expect(financeAccountingModel.find((entry) => entry.modelId === 'FIN-LEDGER-ENTRY')?.kind).toBe(
      'posting-evidence'
    );
    expect(financeAccountingRules.join(' ')).toContain('posted Ledger Entry is immutable');
    expect(financeAccountingRules.join(' ')).toContain('reversal or new adjustment entries');
  });

  it('separates invoices, settlement and external bank evidence', () => {
    expect(
      financeAccountingModel.find((entry) => entry.modelId === 'FIN-SUPPLIER-INVOICE')?.kind
    ).toBe('transaction');
    expect(financeAccountingModel.find((entry) => entry.modelId === 'FIN-PAYMENT')?.kind).toBe(
      'transaction'
    );
    expect(
      financeAccountingModel.find((entry) => entry.modelId === 'FIN-BANK-TRANSACTION')?.kind
    ).toBe('posting-evidence');
    expect(financeAccountingRules.join(' ')).toContain(
      'Bank Transaction is external bank evidence'
    );
  });

  it('separates physical Asset identity from fixed-asset accounting', () => {
    const fixedAsset = financeAccountingModel.find((entry) => entry.modelId === 'FIN-FIXED-ASSET');
    expect(fixedAsset?.canonicalName).toBe('Fixed Asset Accounting Record');
    expect(fixedAsset?.kind).toBe('accounting-record');
    expect(
      financeAccountingRelationships.some(
        (r) => r.from === 'FIN-FIXED-ASSET' && r.to === 'CBO-ASSET'
      )
    ).toBe(true);
  });

  it('keeps plan, commitment, actual and cash positions rebuildable', () => {
    expect(financeAccountingModel.find((entry) => entry.modelId === 'FIN-BUDGET')?.kind).toBe(
      'plan'
    );
    expect(financeAccountingModel.find((entry) => entry.modelId === 'FIN-FORECAST')?.kind).toBe(
      'plan'
    );
    expect(
      financeAccountingModel.find((entry) => entry.modelId === 'FIN-COMMITMENT-POSITION')?.kind
    ).toBe('projection');
    expect(
      financeAccountingModel.find((entry) => entry.modelId === 'FIN-ACTUAL-POSITION')?.kind
    ).toBe('projection');
    expect(
      financeAccountingModel.find((entry) => entry.modelId === 'FIN-CASH-POSITION')?.kind
    ).toBe('projection');
  });
});
