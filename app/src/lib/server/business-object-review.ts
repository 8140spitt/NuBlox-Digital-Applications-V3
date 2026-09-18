import { randomUUID } from 'node:crypto';
import { foundationCanonicalization } from '$lib/data/foundation-canonicalization';
import { builtEnvironmentCanonicalization } from '$lib/data/built-environment-canonicalization';
import { commercialProcurementCanonicalization } from '$lib/data/commercial-procurement-canonicalization';
import { itemManufacturingCanonicalization } from '$lib/data/item-manufacturing-canonicalization';
import { inventoryLogisticsCanonicalization } from '$lib/data/inventory-logistics-canonicalization';
import { controlledInformationCanonicalization } from '$lib/data/controlled-information-canonicalization';
import { assetOperationsCanonicalization } from '$lib/data/asset-operations-canonicalization';
import { financeAccountingCanonicalization } from '$lib/data/finance-accounting-canonicalization';
import { sharedWorkEvidenceCanonicalization } from '$lib/data/shared-work-evidence-canonicalization';
import { referenceConfigurationCanonicalization } from '$lib/data/reference-configuration-canonicalization';
import { crmBusinessDevelopmentCanonicalization } from '$lib/data/crm-business-development-canonicalization';
import { estimatingTenderingCanonicalization } from '$lib/data/estimating-tendering-canonicalization';
import { peopleHcmCanonicalization } from '$lib/data/people-hcm-canonicalization';
import { qhseAssuranceCanonicalization } from '$lib/data/qhse-assurance-canonicalization';
import { buildingSafetyRegulatoryCanonicalization } from '$lib/data/building-safety-regulatory-canonicalization';
import { sustainabilityCarbonCanonicalization } from '$lib/data/sustainability-carbon-canonicalization';
import { riskComplianceAuditCanonicalization } from '$lib/data/risk-compliance-audit-canonicalization';
import { legalPrivacyCanonicalization } from '$lib/data/legal-privacy-canonicalization';
import { knowledgeRecordsCommunicationsCanonicalization } from '$lib/data/knowledge-records-communications-canonicalization';
import { landDevelopmentInvestmentCanonicalization } from '$lib/data/land-development-investment-canonicalization';
import { strategyGovernancePerformanceCanonicalization } from '$lib/data/strategy-governance-performance-canonicalization';
import { continuityCrisisSecurityCanonicalization } from '$lib/data/continuity-crisis-security-canonicalization';
import { technologyDataCyberAiCanonicalization } from '$lib/data/technology-data-cyber-ai-canonicalization';
import { transformationProcessImprovementCanonicalization } from '$lib/data/transformation-process-improvement-canonicalization';
import { siteFieldOperationsCanonicalization } from '$lib/data/site-field-operations-canonicalization';
import type { RowDataPacket } from 'mysql2/promise';
import { dbTransaction, executeMutation, queryOne, queryRows } from '$lib/server/db';

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

export async function seedFoundationCanonicalization(contextTenantSlug: string) {
  const actor = 'NuBlox Architecture Baseline';
  const governedBaseline = [
    ...foundationCanonicalization,
    ...builtEnvironmentCanonicalization,
    ...commercialProcurementCanonicalization,
    ...itemManufacturingCanonicalization,
    ...inventoryLogisticsCanonicalization,
    ...controlledInformationCanonicalization,
    ...assetOperationsCanonicalization,
    ...financeAccountingCanonicalization,
    ...sharedWorkEvidenceCanonicalization,
    ...referenceConfigurationCanonicalization,
    ...crmBusinessDevelopmentCanonicalization,
    ...estimatingTenderingCanonicalization,
    ...peopleHcmCanonicalization,
    ...qhseAssuranceCanonicalization,
    ...buildingSafetyRegulatoryCanonicalization,
    ...sustainabilityCarbonCanonicalization,
    ...riskComplianceAuditCanonicalization,
    ...legalPrivacyCanonicalization,
    ...knowledgeRecordsCommunicationsCanonicalization,
    ...landDevelopmentInvestmentCanonicalization,
    ...strategyGovernancePerformanceCanonicalization,
    ...continuityCrisisSecurityCanonicalization,
    ...technologyDataCyberAiCanonicalization,
    ...transformationProcessImprovementCanonicalization,
    ...siteFieldOperationsCanonicalization
  ];

  return dbTransaction(async (connection) => {
    let inserted = 0;
    for (const entry of governedBaseline) {
      const exists = await queryOne<RowDataPacket & { candidateKey: string }>(
        'SELECT candidate_key AS candidateKey FROM business_object_reviews WHERE candidate_key = ? LIMIT 1',
        [entry.candidateKey],
        connection
      );
      if (exists) continue;

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

      await executeMutation(
        'INSERT INTO business_object_reviews (candidate_key, decision, proposed_canonical_name, target_candidate_key, notes, reviewed_by, reviewed_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [entry.candidateKey, decision, canonicalName, target, notes, actor, timestamp, timestamp],
        connection
      );
      await executeMutation(
        'INSERT INTO business_object_review_events (id, candidate_key, decision, proposed_canonical_name, target_candidate_key, notes, actor, context_tenant_slug, occurred_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          randomUUID(),
          entry.candidateKey,
          decision,
          canonicalName,
          target,
          notes,
          actor,
          contextTenantSlug,
          timestamp
        ],
        connection
      );
      inserted += 1;
    }
    return inserted;
  });
}

export async function listBusinessObjectReviews(): Promise<BusinessObjectReview[]> {
  return queryRows<RowDataPacket & BusinessObjectReview>(
    reviewSelect + ' ORDER BY updated_at DESC'
  );
}

export async function getBusinessObjectReview(
  candidateKey: string
): Promise<BusinessObjectReview | null> {
  return (
    (await queryOne<RowDataPacket & BusinessObjectReview>(
      reviewSelect + ' WHERE candidate_key = ?',
      [candidateKey]
    )) ?? null
  );
}

export async function listBusinessObjectReviewEvents(
  candidateKey: string
): Promise<BusinessObjectReviewEvent[]> {
  return queryRows<RowDataPacket & BusinessObjectReviewEvent>(
    'SELECT id, candidate_key AS candidateKey, decision, proposed_canonical_name AS proposedCanonicalName, target_candidate_key AS targetCandidateKey, notes, actor, context_tenant_slug AS contextTenantSlug, occurred_at AS occurredAt FROM business_object_review_events WHERE candidate_key = ? ORDER BY occurred_at DESC, id DESC',
    [candidateKey]
  );
}

export async function saveBusinessObjectReview(
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

  return dbTransaction(async (connection) => {
    await executeMutation(
      'INSERT INTO business_object_reviews (candidate_key, decision, proposed_canonical_name, target_candidate_key, notes, reviewed_by, reviewed_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE decision = VALUES(decision), proposed_canonical_name = VALUES(proposed_canonical_name), target_candidate_key = VALUES(target_candidate_key), notes = VALUES(notes), reviewed_by = VALUES(reviewed_by), reviewed_at = VALUES(reviewed_at), updated_at = VALUES(updated_at)',
      [candidateKey, input.decision, canonicalName, target, notes, actor, timestamp, timestamp],
      connection
    );
    await executeMutation(
      'INSERT INTO business_object_review_events (id, candidate_key, decision, proposed_canonical_name, target_candidate_key, notes, actor, context_tenant_slug, occurred_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        randomUUID(),
        candidateKey,
        input.decision,
        canonicalName,
        target,
        notes,
        actor,
        contextTenantSlug,
        timestamp
      ],
      connection
    );
  });
}
