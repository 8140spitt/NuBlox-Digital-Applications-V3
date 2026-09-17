import { describe, expect, it } from 'vitest';
import {
  controlledInformationModel,
  controlledInformationRelationships,
  controlledInformationRules,
  validateControlledInformationModel
} from './controlled-information-model';

describe('controlled information semantic model', () => {
  it('is internally valid and relationship-complete', () => {
    expect(validateControlledInformationModel()).toBe(true);
    expect(new Set(controlledInformationModel.map((entry) => entry.modelId)).size).toBe(controlledInformationModel.length);
    expect(controlledInformationRelationships.length).toBeGreaterThanOrEqual(20);
  });

  it('uses one Information Container identity across document, drawing, model and specification types', () => {
    const container = controlledInformationModel.find((entry) => entry.modelId === 'CBO-INFORMATION-CONTAINER');
    expect(container?.candidateKeys).toEqual(
      expect.arrayContaining(['BOF-07-007', 'BOF-07-008', 'BOF-07-009', 'BOF-07-010', 'BOF-07-011'])
    );
    expect(container?.governance.join(' ')).toContain('not parallel information masters');
  });

  it('separates stable container identity, revision and representation', () => {
    expect(controlledInformationModel.find((entry) => entry.modelId === 'CBO-INFORMATION-CONTAINER')?.kind).toBe('foundation-reference');
    expect(controlledInformationModel.find((entry) => entry.modelId === 'INFO-REVISION')?.kind).toBe('version-structure');
    expect(controlledInformationModel.find((entry) => entry.modelId === 'INFO-REPRESENTATION')?.kind).toBe('representation');
    expect(controlledInformationRules.join(' ')).toContain('file, rendition or native model is a representation');
  });

  it('normalises requirements, queries and coordination issues without losing specialist terminology', () => {
    const requirement = controlledInformationModel.find((entry) => entry.modelId === 'INFO-REQUIREMENT');
    const query = controlledInformationModel.find((entry) => entry.modelId === 'INFO-QUERY');
    const coordination = controlledInformationModel.find((entry) => entry.modelId === 'INFO-COORDINATION-ISSUE');
    expect(requirement?.candidateKeys).toEqual(expect.arrayContaining(['BOF-07-001', 'BOF-07-002', 'BOF-07-003']));
    expect(query?.candidateKeys).toEqual(expect.arrayContaining(['BOF-07-019', 'BOF-07-020']));
    expect(coordination?.candidateKeys).toEqual(expect.arrayContaining(['BOF-07-025', 'BOF-07-026']));
  });

  it('keeps design change technically distinct from commercial change', () => {
    const change = controlledInformationModel.find((entry) => entry.modelId === 'INFO-DESIGN-CHANGE');
    expect(change?.governance.join(' ')).toContain('distinct from Commercial Change');
  });
});
