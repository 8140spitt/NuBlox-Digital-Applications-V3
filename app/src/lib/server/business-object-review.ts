import { randomUUID } from 'node:crypto';
import { foundationCanonicalization } from '$lib/data/foundation-canonicalization';
import { builtEnvironmentCanonicalization } from '$lib/data/built-environment-canonicalization';
import { commercialProcurementCanonicalization } from '$lib/data/commercial-procurement-canonicalization';
import { itemManufacturingCanonicalization } from '$lib/data/item-manufacturing-canonicalization';
import { inventoryLogisticsCanonicalization } from '$lib/data/inventory-logistics-canonicalization';
import { db } from '$lib/server/db';

export const reviewDecisions = [
  'VALIDATE_OBJECT',
  'MERGE',
  'RENAME',
  'RELATIONSHIP',
  'CHILD',
  'EVENT_EVIDENCE',
  'PROJECTION',
  'REJECT'
] as const;

export type BusinessObjectReviewDecision = (typeof reviewDecisions)[number];

export type BusinessObjectReview = {
  candidateKey: string;
  decision: BusinessObjectReviewDecision;
  proposedCanonicalName: string | null;
  targetCandidateKey: string | null;
  notes: string | null;
  reviewedBy: string;
  reviewedAt: string;
  updatedAt: string;
};

export type BusinessObjectReviewEvent = {
  id: string;
  candidateKey: string;
  decision: BusinessObjectReviewDecision;
  proposedCanonicalName: string | null;
  targetCandidateKey: string | null;
  notes: string | null;
  actor: string;
  contextTenantSlug: string;
  occurredAt: string;
};

export type BusinessObjectReviewInput = {
  decision: BusinessObjectReviewDecision;
  proposedCanonicalName?: string;
  targetCandidateKey?: string;
  notes?: string;
};

const reviewSelect = `
  SELECT candidate_key AS candidateKey, decision,
    proposed_canonical_name AS proposedCanonicalName,
    target_candidate_key AS targetCandidateKey,
    notes, reviewed_by AS reviewedBy, reviewed_at AS reviewedAt, updated_at AS updatedAt
  FROM business_object_reviews
`;

function clean(value?: string) {
  return value?.trim() || null;
}

function now() {
  return new Date().toISOString();
}

function validateInput(candidateKey: string, input: BusinessObjectReviewInput) {
  if (!candidateKey.trim()) throw new Error('Candidate key is required.');
  if (!reviewDecisions.includes(input.decision)) throw new Error('Invalid review decision.');
  if (input.decision === 'MERGE') {
    const target = clean(input.targetCandidateKey);
    if (!target) throw new Error('A merge target is required.');
    if (target === candidateKey) throw new Error('An object cannot be merged into itself.');
  }
  if (input.decision === 'RENAME' && !clean(input.proposedCanonicalName)) {
    throw new Error('A proposed canonical name is required for rename decisions.');
  }
}

export function seedFoundationCanonicalization(contextTenantSlug: string) {
  const actor = 'NuBlox Architecture Baseline';
  const exists = db.prepare('SELECT 1 FROM business_object_reviews WHERE candidate_key = ?');
  const insertReview = db.prepare(`
    INSERT INTO business_object_reviews
      (candidate_key, decision, proposed_canonical_name, target_candidate_key, notes, reviewed_by, reviewed_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertEvent = db.prepare(`
    INSERT INTO business_object_review_events
      (id, candidate_key, decision, proposed_canonical_name, target_candidate_key, notes, actor, context_tenant_slug, occurred_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const governedBaseline = [
    ...foundationCanonicalization,
    ...builtEnvironmentCanonicalization,
    ...commercialProcurementCanonicalization,
    ...itemManufacturingCanonicalization,
    ...inventoryLogisticsCanonicalization
  ];
  let inserted = 0;
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const entry of governedBaseline) {
      if (exists.get(entry.candidateKey)) continue;
      const timestamp = now();
      const decision = entry.decision as BusinessObjectReviewDecision;
      validateInput(entry.candidateKey, {
        decision,
        proposedCanonicalName: entry.proposedCanonicalName,
        targetCandidateKey: entry.targetCandidateKey,
        notes: entry.notes
      });
      const canonicalName = clean(entry.proposedCanonicalName);
      const target = clean(entry.targetCandidateKey);
      const notes = clean(entry.notes);
      insertReview.run(entry.candidateKey, decision, canonicalName, target, notes, actor, timestamp, timestamp);
      insertEvent.run(randomUUID(), entry.candidateKey, decision, canonicalName, target, notes, actor, contextTenantSlug, timestamp);
      inserted += 1;
    }
    db.exec('COMMIT');
    return inserted;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function listBusinessObjectReviews(): BusinessObjectReview[] {
  return db.prepare(`${reviewSelect} ORDER BY updated_at DESC`).all() as unknown as BusinessObjectReview[];
}

export function getBusinessObjectReview(candidateKey: string): BusinessObjectReview | null {
  return (db.prepare(`${reviewSelect} WHERE candidate_key = ?`).get(candidateKey) as BusinessObjectReview | undefined) ?? null;
}

export function listBusinessObjectReviewEvents(candidateKey: string): BusinessObjectReviewEvent[] {
  return db.prepare(`
    SELECT id, candidate_key AS candidateKey, decision,
      proposed_canonical_name AS proposedCanonicalName,
      target_candidate_key AS targetCandidateKey,
      notes, actor, context_tenant_slug AS contextTenantSlug, occurred_at AS occurredAt
    FROM business_object_review_events
    WHERE candidate_key = ?
    ORDER BY occurred_at DESC
  `).all(candidateKey) as unknown as BusinessObjectReviewEvent[];
}

export function saveBusinessObjectReview(
  candidateKey: string,
  input: BusinessObjectReviewInput,
  actor: string,
  contextTenantSlug: string
) {
  validateInput(candidateKey, input);
  const timestamp = now();
  const canonicalName = clean(input.proposedCanonicalName);
  const target = clean(input.targetCandidateKey);
  const notes = clean(input.notes);

  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare(`
      INSERT INTO business_object_reviews
        (candidate_key, decision, proposed_canonical_name, target_candidate_key, notes, reviewed_by, reviewed_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(candidate_key) DO UPDATE SET
        decision = excluded.decision,
        proposed_canonical_name = excluded.proposed_canonical_name,
        target_candidate_key = excluded.target_candidate_key,
        notes = excluded.notes,
        reviewed_by = excluded.reviewed_by,
        reviewed_at = excluded.reviewed_at,
        updated_at = excluded.updated_at
    `).run(candidateKey, input.decision, canonicalName, target, notes, actor, timestamp, timestamp);

    db.prepare(`
      INSERT INTO business_object_review_events
        (id, candidate_key, decision, proposed_canonical_name, target_candidate_key, notes, actor, context_tenant_slug, occurred_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), candidateKey, input.decision, canonicalName, target, notes, actor, contextTenantSlug, timestamp);

    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
