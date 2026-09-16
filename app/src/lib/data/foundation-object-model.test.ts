import { describe, expect, it } from 'vitest';
import { foundationObjectByCandidateKey, foundationObjects, foundationRelationships, validateFoundationObjectModel } from './foundation-object-model';

describe('foundation canonical object model', () => {
  it('has unique governed identities and valid relationship endpoints', () => {
    expect(validateFoundationObjectModel()).toBe(true);
    expect(foundationObjects.length).toBeGreaterThanOrEqual(13);
    expect(foundationRelationships.length).toBeGreaterThanOrEqual(20);
  });

  it('keeps stable identity separate from business numbering and version semantics', () => {
    const project = foundationObjectByCandidateKey('BOF-06-003');
    const contract = foundationObjectByCandidateKey('BOF-08-002');
    const information = foundationObjectByCandidateKey('BOF-07-007');
    const asset = foundationObjectByCandidateKey('BOF-16-016');

    expect(project?.businessIdentifiers).toContain('project/job number');
    expect(project?.versioning.mode).toBe('history-only');
    expect(contract?.versioning.mode).toBe('amendment-controlled');
    expect(information?.versioning.mode).toBe('revision-and-iteration');
    expect(asset?.versioning.mode).toBe('configuration-controlled');
    expect(asset?.lifecycle.states).toContain('In Service');
  });

  it('models shared identity relationships rather than duplicate masters', () => {
    expect(foundationRelationships).toEqual(expect.arrayContaining([
      expect.objectContaining({ from: 'CBO-PERSON', predicate: 'specializes', to: 'CBO-PARTY' }),
      expect.objectContaining({ from: 'CBO-ORGANISATION', predicate: 'specializes', to: 'CBO-PARTY' }),
      expect.objectContaining({ from: 'CBO-ASSET', predicate: 'instance of', to: 'CBO-ITEM' }),
      expect.objectContaining({ from: 'CBO-ASSET', predicate: 'member of', to: 'CBO-SYSTEM' }),
      expect.objectContaining({ from: 'CBO-PROJECT', predicate: 'occurs at', to: 'CBO-SITE' })
    ]));
  });
});
