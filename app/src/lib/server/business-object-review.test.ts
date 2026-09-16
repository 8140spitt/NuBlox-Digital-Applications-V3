import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const directory = mkdtempSync(join(tmpdir(), 'nublox-object-review-'));
process.env.NUBLOX_DB_PATH = join(directory, 'business-object-review.test.db');

let service: typeof import('./business-object-review');

beforeAll(async () => {
  service = await import('./business-object-review');
});

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe('canonical business object review ledger', () => {
  it('persists the current decision and immutable review history', () => {
    service.saveBusinessObjectReview(
      'BOF-16-003',
      { decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Site', notes: 'Stable spatial identity.' },
      'Reviewer One',
      'review-tenant'
    );

    service.saveBusinessObjectReview(
      'BOF-16-003',
      { decision: 'RENAME', proposedCanonicalName: 'Built Environment Site', notes: 'Differentiate from project site usage.' },
      'Reviewer Two',
      'review-tenant'
    );

    const current = service.getBusinessObjectReview('BOF-16-003');
    expect(current?.decision).toBe('RENAME');
    expect(current?.proposedCanonicalName).toBe('Built Environment Site');
    expect(service.listBusinessObjectReviews()).toHaveLength(1);

    const events = service.listBusinessObjectReviewEvents('BOF-16-003');
    expect(events).toHaveLength(2);
    expect(events.map((event) => event.decision)).toEqual(['RENAME', 'VALIDATE_OBJECT']);
    expect(events[0].actor).toBe('Reviewer Two');
  });

  it('requires a merge target and prevents self merge', () => {
    expect(() => service.saveBusinessObjectReview(
      'BOF-09-006',
      { decision: 'MERGE' },
      'Reviewer',
      'review-tenant'
    )).toThrow('A merge target is required.');

    expect(() => service.saveBusinessObjectReview(
      'BOF-09-006',
      { decision: 'MERGE', targetCandidateKey: 'BOF-09-006' },
      'Reviewer',
      'review-tenant'
    )).toThrow('An object cannot be merged into itself.');
  });

  it('seeds the governed foundation baseline without overwriting an existing human decision', () => {
    const inserted = service.seedFoundationCanonicalization('architecture-review');
    expect(inserted).toBeGreaterThan(0);

    const party = service.getBusinessObjectReview('BOF-01-002');
    expect(party?.decision).toBe('VALIDATE_OBJECT');
    expect(party?.proposedCanonicalName).toBe('Party');

    const authority = service.getBusinessObjectReview('BOF-01-019');
    expect(authority?.decision).toBe('VALIDATE_OBJECT');
    expect(authority?.proposedCanonicalName).toBe('Delegated Authority');

    const responsibility = service.getBusinessObjectReview('BOF-06-020');
    expect(responsibility?.decision).toBe('RELATIONSHIP');

    const duplicateResponsibility = service.getBusinessObjectReview('BOF-07-005');
    expect(duplicateResponsibility?.decision).toBe('MERGE');
    expect(duplicateResponsibility?.targetCandidateKey).toBe('BOF-06-020');

    const job = service.getBusinessObjectReview('BOF-06-004');
    expect(job?.decision).toBe('MERGE');
    expect(job?.targetCandidateKey).toBe('BOF-06-003');

    const item = service.getBusinessObjectReview('BOF-10-001');
    expect(item?.decision).toBe('RENAME');
    expect(item?.proposedCanonicalName).toBe('Item');

    const site = service.getBusinessObjectReview('BOF-16-003');
    expect(site?.decision).toBe('RENAME');
    expect(site?.proposedCanonicalName).toBe('Built Environment Site');

    expect(service.seedFoundationCanonicalization('architecture-review')).toBe(0);
  });
});
