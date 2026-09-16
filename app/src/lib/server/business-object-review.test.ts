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
});
