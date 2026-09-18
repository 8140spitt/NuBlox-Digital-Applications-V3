import { describe, expect, it } from 'vitest';
import {
  benchmarkRefinementModel,
  benchmarkRefinementRules,
  validateBenchmarkRefinementModel
} from './benchmark-refinement-model';

describe('benchmark-driven canonical refinements', () => {
  it('is internally valid and traceable back to accepted benchmark gaps', () => {
    expect(validateBenchmarkRefinementModel()).toBe(true);
    expect(benchmarkRefinementModel.length).toBeGreaterThanOrEqual(40);
  });

  it('adds explicit demand and supply planning without collapsing execution truth', () => {
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'PLN-DEMAND-PLAN')?.kind).toBe('plan');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'PLN-SUPPLY-PLAN')?.kind).toBe('plan');
    expect(benchmarkRefinementRules.join(' ')).toContain('Planning truth remains separate from execution truth');
  });

  it('adds treasury risk semantics without changing ledger or bank evidence truth', () => {
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'TREASURY-EXPOSURE')?.kind).toBe('projection');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'TREASURY-HEDGE-RELATIONSHIP')?.kind).toBe('relationship');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'TREASURY-MARKET-DATA-SNAPSHOT')?.kind).toBe('reference-snapshot');
  });

  it('adds advanced logistics without replacing inventory shipment or finance truth', () => {
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'LOG-HANDLING-UNIT')?.kind).toBe('execution-context');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'LOG-WAREHOUSE-WAVE')?.kind).toBe('plan');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'LOG-FREIGHT-TENDER')?.kind).toBe('transaction');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'LOG-FREIGHT-SETTLEMENT')?.kind).toBe('transaction');
  });

  it('adds reliability engineering around the existing asset model', () => {
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'REL-ASSET-CRITICALITY-ASSESSMENT')?.kind).toBe('event-evidence');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'REL-FAILURE-MODE')?.kind).toBe('definition');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'REL-RELIABILITY-STRATEGY')?.kind).toBe('plan');
  });

  it('adds succession and talent semantics without duplicating people identities', () => {
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'HCM-SUCCESSION-PLAN')?.kind).toBe('plan');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'HCM-TALENT-POOL')?.kind).toBe('execution-context');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'HCM-TALENT-POOL-MEMBERSHIP')?.kind).toBe('relationship');
  });

  it('adds configurable-product semantics without replacing Item Variant or BOM truth', () => {
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'CFG-PRODUCT-CONFIG-MODEL')?.kind).toBe('configuration');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'CFG-CONFIGURATION-RULE')?.kind).toBe('definition');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'CFG-CONFIGURATION-INSTANCE')?.kind).toBe('execution-context');
  });

  it('adds business travel continuity around request trip booking evidence and expense', () => {
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'HCM-TRAVEL-REQUEST')?.kind).toBe('governance-case');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'HCM-BUSINESS-TRIP')?.kind).toBe('execution-context');
  });

  it('adds governed migration and protected non-production data semantics', () => {
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'DATA-MIGRATION-PROJECT')?.kind).toBe('plan');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'DATA-MIGRATION-RUN')?.kind).toBe('event-evidence');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'DATA-TEST-DATA-PROFILE')?.kind).toBe('configuration');
  });

  it('separates product requirements and logical engineering models from information and physical-system identity', () => {
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'ENG-PRODUCT-REQUIREMENT')?.kind).toBe('definition');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'ENG-SYSTEM-MODEL')?.kind).toBe('definition');
  });

  it('adds lease accounting as a financial consequence of canonical lease truth', () => {
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'FIN-LEASE-ACCOUNTING-RECORD')?.kind).toBe('accounting-record');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'FIN-LEASE-VALUATION')?.kind).toBe('event-evidence');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'FIN-LEASE-PAYMENT-SCHEDULE')?.kind).toBe('projection');
  });

  it('adds governed stewardship and reversible merge lineage rather than a second master store', () => {
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'MDG-STEWARDSHIP-CASE')?.kind).toBe('governance-case');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'MDG-DUPLICATE-CANDIDATE')?.kind).toBe('event-evidence');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'MDG-MERGE-DECISION')?.kind).toBe('event-evidence');
    expect(benchmarkRefinementModel.find((entry) => entry.modelId === 'MDG-IDENTITY-REDIRECT')?.kind).toBe('relationship');
  });
});
