import { describe, expect, it } from 'vitest';
import { authorityEvaluation, authorityModel, authorityRules, validateAuthorityModel } from './authority-participation-model';

describe('authority and participation model', () => {
  it('has unique governed authority concepts and a deterministic evaluation sequence', () => {
    expect(validateAuthorityModel()).toBe(true);
    expect(authorityModel).toHaveLength(6);
    expect(authorityEvaluation.map((step) => step.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('keeps authentication separate from authorization and authority', () => {
    const identity = authorityModel.find((item) => item.modelId === 'AUTH-USER-IDENTITY');
    const role = authorityModel.find((item) => item.modelId === 'AUTH-ROLE-ASSIGNMENT');
    const delegated = authorityModel.find((item) => item.modelId === 'AUTH-DELEGATED-AUTHORITY');

    expect(identity?.definition).toContain('does not, by itself, confer business authority');
    expect(role?.governance).toContain('Role assignment can enable actions but cannot substitute for delegated financial/commercial authority.');
    expect(delegated?.keyData).toContain('currency/value limit');
    expect(authorityRules).toContain('The server is authoritative; hiding a UI action is never the security boundary.');
  });

  it('treats responsibility as a reusable governed relationship', () => {
    const responsibility = authorityModel.find((item) => item.modelId === 'AUTH-RESPONSIBILITY-ASSIGNMENT');
    expect(responsibility?.candidateKey).toBe('BOF-06-020');
    expect(responsibility?.kind).toBe('relationship');
    expect(responsibility?.scope).toContain('information container');
    expect(responsibility?.scope).toContain('contract');
  });
});
