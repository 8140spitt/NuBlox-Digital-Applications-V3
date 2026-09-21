import type { Pool, RowDataPacket } from 'mysql2/promise';
import type { TenantId } from '@nublox/kernel';

interface RequirementRow extends RowDataPacket {
  id: string; code: string; title: string; deliverable_type: string; description: string;
  context_object_id: string; context_type: string; context_key: string;
  authoring_mode: string; required_representation_types: string | string[];
  planned_due_at: Date | null; acceptance_required: number | boolean; status: string;
}
interface ItemRow extends RowDataPacket {
  id: string; requirement_id: string; canonical_object_id: string; context_object_id: string;
  code: string; title: string; deliverable_type: string; status: string;
  planned_at: Date | null; forecast_at: Date | null; actual_at: Date | null;
  governed_output_object_id: string | null; governed_output_version: string | null;
  configuration_item_id: string | null; baseline_id: string | null; linked_change_id: string | null;
}
interface ResponsibilityRow extends RowDataPacket {
  id: string; deliverable_item_id: string; principal_type: string; principal_id: string;
  principal_name: string; responsibility_role: string; effective_from: Date;
  effective_to: Date | null; status: string;
}
interface BindingRow extends RowDataPacket {
  id: string; deliverable_item_id: string; mode: string; provider_key: string;
  authoritative_object_id: string | null; external_identity_id: string | null;
  connected_reference: string | null; created_at: Date; status: string;
}
interface ReviewRow extends RowDataPacket {
  id: string; deliverable_item_id: string; review_type: string; subject_object_id: string;
  subject_version: string | null; reviewer_name: string; reviewed_at: Date; outcome: string;
  comments: string | null; evidence_record_id: string | null;
}
interface ApprovalRow extends RowDataPacket {
  id: string; deliverable_item_id: string; decision_id: string; subject_object_id: string;
  subject_version: string | null; approved_at: Date; decision_outcome: string;
  decider_name: string; authority_grant_id: string | null;
}
interface TransmittalRow extends RowDataPacket {
  id: string; deliverable_item_id: string; issue_reference: string; issue_purpose: string;
  subject_object_id: string; subject_version: string | null; representation_id: string | null;
  issuer_name: string; issued_at: Date; response_required: number | boolean;
}
interface RecipientRow extends RowDataPacket {
  id: string; transmittal_id: string; recipient_party_id: string; recipient_name: string;
  response_required: number | boolean; due_at: Date | null;
  response_id: string | null; responder_name: string | null; response_outcome: string | null;
  response_comments: string | null; responded_at: Date | null; response_evidence_id: string | null;
}
interface ReworkRow extends RowDataPacket {
  id: string; deliverable_item_id: string; trigger_type: string; trigger_id: string;
  previous_subject_object_id: string; previous_subject_version: string | null;
  reason: string; work_item_id: string | null; created_at: Date;
}
interface ConsequenceRow extends RowDataPacket {
  id: string; deliverable_item_id: string; consequence_type: string;
  target_object_id: string | null; target_version: string | null; status: string;
  applied_at: Date | null; evidence_record_id: string | null;
}
interface HistoryRow extends RowDataPacket {
  history_id: number; deliverable_item_id: string; status: string;
  governed_output_object_id: string | null; governed_output_version: string | null;
  recorded_at: Date; note: string | null; actor_name: string | null;
}
interface CanonicalObjectRow extends RowDataPacket {
  id: string; object_type: string; stable_key: string;
}
interface PersonRow extends RowDataPacket {
  id: string; party_id: string; display_name: string;
}
interface PartyRow extends RowDataPacket {
  id: string; display_name: string; kind: string;
}

function jsonArray(value: string | string[]): string[] {
  if (Array.isArray(value)) return value.map(String);
  const parsed = JSON.parse(value) as unknown;
  return Array.isArray(parsed) ? parsed.map(String) : [];
}

export interface DeliverableWorkspaceProjection {
  requirements: Array<{
    id: string; code: string; title: string; deliverableType: string; description: string;
    contextObjectId: string; contextType: string; contextKey: string; authoringMode: string;
    requiredRepresentationTypes: string[]; plannedDueAt?: string; acceptanceRequired: boolean;
    status: string;
    items: Array<{
      id: string; canonicalObjectId: string; contextObjectId: string; code: string; title: string;
      deliverableType: string; status: string; plannedAt?: string; forecastAt?: string; actualAt?: string;
      governedOutputObjectId?: string; governedOutputVersion?: string; configurationItemId?: string;
      baselineId?: string; linkedChangeId?: string;
      authoringBinding?: {
        id: string; mode: string; providerKey: string; authoritativeObjectId?: string;
        externalIdentityId?: string; connectedReference?: string; createdAt: string; status: string;
      };
      responsibilities: Array<{
        id: string; principalType: string; principalId: string; principalName: string;
        responsibilityRole: string; effectiveFrom: string; effectiveTo?: string; status: string;
      }>;
      reviews: Array<{
        id: string; reviewType: string; subjectObjectId: string; subjectVersion?: string;
        reviewerName: string; reviewedAt: string; outcome: string; comments?: string; evidenceRecordId?: string;
      }>;
      approvals: Array<{
        id: string; decisionId: string; subjectObjectId: string; subjectVersion?: string;
        approvedAt: string; decisionOutcome: string; deciderName: string; authorityGrantId?: string;
      }>;
      transmittals: Array<{
        id: string; issueReference: string; issuePurpose: string; subjectObjectId: string;
        subjectVersion?: string; representationId?: string; issuerName: string; issuedAt: string;
        responseRequired: boolean;
        recipients: Array<{
          id: string; recipientPartyId: string; recipientName: string; responseRequired: boolean;
          dueAt?: string; response?: {
            id: string; responderName?: string; outcome: string; comments?: string;
            respondedAt: string; evidenceRecordId?: string;
          };
        }>;
      }>;
      rework: Array<{
        id: string; triggerType: string; triggerId: string; previousSubjectObjectId: string;
        previousSubjectVersion?: string; reason: string; workItemId?: string; createdAt: string;
      }>;
      consequences: Array<{
        id: string; consequenceType: string; targetObjectId?: string; targetVersion?: string;
        status: string; appliedAt?: string; evidenceRecordId?: string;
      }>;
      history: Array<{
        historyId: number; status: string; governedOutputObjectId?: string; governedOutputVersion?: string;
        recordedAt: string; note?: string; actorName?: string;
      }>;
    }>;
  }>;
  canonicalObjects: Array<{ id: string; objectType: string; stableKey: string }>;
  people: Array<{ id: string; partyId: string; displayName: string }>;
  parties: Array<{ id: string; displayName: string; kind: string }>;
  totals: {
    requirements: number; items: number; activeItems: number; inReview: number;
    issued: number; accepted: number; responseActions: number; rework: number;
  };
}

export class MySqlDeliverableReadRepository {
  constructor(private readonly pool: Pool) {}

  async getProjection(tenantId: TenantId): Promise<DeliverableWorkspaceProjection> {
    const [
      requirementsResult, itemsResult, responsibilitiesResult, bindingsResult,
      reviewsResult, approvalsResult, transmittalsResult, recipientsResult,
      reworkResult, consequencesResult, historyResult, objectsResult, peopleResult, partiesResult
    ] = await Promise.all([
      this.pool.query<RequirementRow[]>(
        `SELECT r.id, r.code, r.title, r.deliverable_type, r.description,
                r.context_object_id, co.object_type AS context_type, co.stable_key AS context_key,
                r.authoring_mode, r.required_representation_types, r.planned_due_at,
                r.acceptance_required, r.status
           FROM deliverable_requirements r
           JOIN canonical_objects co ON co.tenant_id = r.tenant_id AND co.id = r.context_object_id
          WHERE r.tenant_id = ? ORDER BY r.code`, [tenantId]
      ),
      this.pool.query<ItemRow[]>(
        `SELECT id, requirement_id, canonical_object_id, context_object_id, code, title,
                deliverable_type, status, planned_at, forecast_at, actual_at,
                governed_output_object_id, governed_output_version, configuration_item_id,
                baseline_id, linked_change_id
           FROM deliverable_items WHERE tenant_id = ? ORDER BY code`, [tenantId]
      ),
      this.pool.query<ResponsibilityRow[]>(
        `SELECT dr.id, dr.deliverable_item_id, dr.principal_type, dr.principal_id,
                COALESCE(p.preferred_name, p.legal_name, pos.title, ou.name, org.trading_name, org.legal_name, dr.principal_id) AS principal_name,
                dr.responsibility_role, dr.effective_from, dr.effective_to, dr.status
           FROM deliverable_responsibilities dr
           LEFT JOIN persons p ON dr.principal_type = 'PERSON' AND p.tenant_id = dr.tenant_id AND p.id = dr.principal_id
           LEFT JOIN positions pos ON dr.principal_type = 'POSITION' AND pos.tenant_id = dr.tenant_id AND pos.id = dr.principal_id
           LEFT JOIN organisation_units ou ON dr.principal_type = 'ORGANISATION_UNIT' AND ou.tenant_id = dr.tenant_id AND ou.id = dr.principal_id
           LEFT JOIN organisations org ON dr.principal_type = 'ORGANISATION' AND org.tenant_id = dr.tenant_id AND org.id = dr.principal_id
          WHERE dr.tenant_id = ? ORDER BY dr.deliverable_item_id, dr.responsibility_role, dr.id`, [tenantId]
      ),
      this.pool.query<BindingRow[]>(
        `SELECT id, deliverable_item_id, mode, provider_key, authoritative_object_id,
                external_identity_id, connected_reference, created_at, status
           FROM deliverable_authoring_bindings WHERE tenant_id = ? ORDER BY deliverable_item_id`, [tenantId]
      ),
      this.pool.query<ReviewRow[]>(
        `SELECT r.id, r.deliverable_item_id, r.review_type, r.subject_object_id, r.subject_version,
                COALESCE(p.preferred_name, p.legal_name) AS reviewer_name, r.reviewed_at,
                r.outcome, r.comments, r.evidence_record_id
           FROM deliverable_reviews r
           JOIN persons p ON p.tenant_id = r.tenant_id AND p.id = r.reviewer_person_id
          WHERE r.tenant_id = ? ORDER BY r.deliverable_item_id, r.reviewed_at DESC`, [tenantId]
      ),
      this.pool.query<ApprovalRow[]>(
        `SELECT a.id, a.deliverable_item_id, a.decision_id, a.subject_object_id, a.subject_version,
                a.approved_at, d.outcome AS decision_outcome,
                COALESCE(p.preferred_name, p.legal_name) AS decider_name, d.authority_grant_id
           FROM deliverable_approvals a
           JOIN decisions d ON d.tenant_id = a.tenant_id AND d.id = a.decision_id
           JOIN persons p ON p.tenant_id = d.tenant_id AND p.id = d.decider_person_id
          WHERE a.tenant_id = ? ORDER BY a.deliverable_item_id, a.approved_at DESC`, [tenantId]
      ),
      this.pool.query<TransmittalRow[]>(
        `SELECT t.id, t.deliverable_item_id, t.issue_reference, t.issue_purpose,
                t.subject_object_id, t.subject_version, t.representation_id,
                COALESCE(p.preferred_name, p.legal_name) AS issuer_name,
                t.issued_at, t.response_required
           FROM transmittals t
           JOIN persons p ON p.tenant_id = t.tenant_id AND p.id = t.issued_by_person_id
          WHERE t.tenant_id = ? ORDER BY t.deliverable_item_id, t.issued_at DESC`, [tenantId]
      ),
      this.pool.query<RecipientRow[]>(
        `SELECT tr.id, tr.transmittal_id, tr.recipient_party_id, p.display_name AS recipient_name,
                tr.response_required, tr.due_at, rr.id AS response_id,
                COALESCE(rp.preferred_name, rp.legal_name) AS responder_name,
                rr.outcome AS response_outcome, rr.comments AS response_comments,
                rr.responded_at, rr.evidence_record_id AS response_evidence_id
           FROM transmittal_recipients tr
           JOIN parties p ON p.tenant_id = tr.tenant_id AND p.id = tr.recipient_party_id
           LEFT JOIN recipient_responses rr ON rr.tenant_id = tr.tenant_id AND rr.transmittal_recipient_id = tr.id
           LEFT JOIN persons rp ON rp.tenant_id = rr.tenant_id AND rp.id = rr.responder_person_id
          WHERE tr.tenant_id = ? ORDER BY tr.transmittal_id, tr.id`, [tenantId]
      ),
      this.pool.query<ReworkRow[]>(
        `SELECT id, deliverable_item_id, trigger_type, trigger_id, previous_subject_object_id,
                previous_subject_version, reason, work_item_id, created_at
           FROM deliverable_rework WHERE tenant_id = ? ORDER BY deliverable_item_id, created_at DESC`, [tenantId]
      ),
      this.pool.query<ConsequenceRow[]>(
        `SELECT id, deliverable_item_id, consequence_type, target_object_id, target_version,
                status, applied_at, evidence_record_id
           FROM deliverable_consequences WHERE tenant_id = ? ORDER BY deliverable_item_id, id`, [tenantId]
      ),
      this.pool.query<HistoryRow[]>(
        `SELECT h.history_id, h.deliverable_item_id, h.status, h.governed_output_object_id,
                h.governed_output_version, h.recorded_at, h.note,
                COALESCE(p.preferred_name, p.legal_name) AS actor_name
           FROM deliverable_item_history h
           LEFT JOIN persons p ON p.tenant_id = h.tenant_id AND p.id = h.actor_person_id
          WHERE h.tenant_id = ? ORDER BY h.deliverable_item_id, h.history_id`, [tenantId]
      ),
      this.pool.query<CanonicalObjectRow[]>(
        `SELECT id, object_type, stable_key FROM canonical_objects
          WHERE tenant_id = ? ORDER BY object_type, stable_key`, [tenantId]
      ),
      this.pool.query<PersonRow[]>(
        `SELECT pe.id, pe.party_id, COALESCE(pe.preferred_name, pe.legal_name) AS display_name
           FROM persons pe WHERE pe.tenant_id = ? AND pe.status = 'ACTIVE' ORDER BY display_name`, [tenantId]
      ),
      this.pool.query<PartyRow[]>(
        `SELECT id, display_name, kind FROM parties
          WHERE tenant_id = ? AND status = 'ACTIVE' ORDER BY display_name`, [tenantId]
      )
    ]);

    const byItem = <T extends { deliverable_item_id: string }>(rows: T[]) => {
      const map = new Map<string, T[]>();
      for (const row of rows) {
        const list = map.get(row.deliverable_item_id) ?? [];
        list.push(row); map.set(row.deliverable_item_id, list);
      }
      return map;
    };
    const responsibilities = byItem(responsibilitiesResult[0]);
    const bindings = new Map(bindingsResult[0].map((row) => [row.deliverable_item_id, row]));
    const reviews = byItem(reviewsResult[0]);
    const approvals = byItem(approvalsResult[0]);
    const transmittals = byItem(transmittalsResult[0]);
    const rework = byItem(reworkResult[0]);
    const consequences = byItem(consequencesResult[0]);
    const histories = byItem(historyResult[0]);

    const recipients = new Map<string, RecipientRow[]>();
    for (const row of recipientsResult[0]) {
      const list = recipients.get(row.transmittal_id) ?? [];
      list.push(row); recipients.set(row.transmittal_id, list);
    }

    const itemsByRequirement = new Map<string, ItemRow[]>();
    for (const row of itemsResult[0]) {
      const list = itemsByRequirement.get(row.requirement_id) ?? [];
      list.push(row); itemsByRequirement.set(row.requirement_id, list);
    }

    const mapItem = (row: ItemRow): DeliverableWorkspaceProjection['requirements'][number]['items'][number] => {
      const binding = bindings.get(row.id);
      return {
        id: row.id, canonicalObjectId: row.canonical_object_id, contextObjectId: row.context_object_id,
        code: row.code, title: row.title, deliverableType: row.deliverable_type, status: row.status,
        ...(row.planned_at ? { plannedAt: row.planned_at.toISOString() } : {}),
        ...(row.forecast_at ? { forecastAt: row.forecast_at.toISOString() } : {}),
        ...(row.actual_at ? { actualAt: row.actual_at.toISOString() } : {}),
        ...(row.governed_output_object_id ? { governedOutputObjectId: row.governed_output_object_id } : {}),
        ...(row.governed_output_version ? { governedOutputVersion: row.governed_output_version } : {}),
        ...(row.configuration_item_id ? { configurationItemId: row.configuration_item_id } : {}),
        ...(row.baseline_id ? { baselineId: row.baseline_id } : {}),
        ...(row.linked_change_id ? { linkedChangeId: row.linked_change_id } : {}),
        ...(binding ? { authoringBinding: {
          id: binding.id, mode: binding.mode, providerKey: binding.provider_key,
          ...(binding.authoritative_object_id ? { authoritativeObjectId: binding.authoritative_object_id } : {}),
          ...(binding.external_identity_id ? { externalIdentityId: binding.external_identity_id } : {}),
          ...(binding.connected_reference ? { connectedReference: binding.connected_reference } : {}),
          createdAt: binding.created_at.toISOString(), status: binding.status
        }} : {}),
        responsibilities: (responsibilities.get(row.id) ?? []).map((r) => ({
          id: r.id, principalType: r.principal_type, principalId: r.principal_id,
          principalName: r.principal_name, responsibilityRole: r.responsibility_role,
          effectiveFrom: r.effective_from.toISOString(),
          ...(r.effective_to ? { effectiveTo: r.effective_to.toISOString() } : {}), status: r.status
        })),
        reviews: (reviews.get(row.id) ?? []).map((r) => ({
          id: r.id, reviewType: r.review_type, subjectObjectId: r.subject_object_id,
          ...(r.subject_version ? { subjectVersion: r.subject_version } : {}),
          reviewerName: r.reviewer_name, reviewedAt: r.reviewed_at.toISOString(), outcome: r.outcome,
          ...(r.comments ? { comments: r.comments } : {}),
          ...(r.evidence_record_id ? { evidenceRecordId: r.evidence_record_id } : {})
        })),
        approvals: (approvals.get(row.id) ?? []).map((a) => ({
          id: a.id, decisionId: a.decision_id, subjectObjectId: a.subject_object_id,
          ...(a.subject_version ? { subjectVersion: a.subject_version } : {}),
          approvedAt: a.approved_at.toISOString(), decisionOutcome: a.decision_outcome,
          deciderName: a.decider_name, ...(a.authority_grant_id ? { authorityGrantId: a.authority_grant_id } : {})
        })),
        transmittals: (transmittals.get(row.id) ?? []).map((t) => ({
          id: t.id, issueReference: t.issue_reference, issuePurpose: t.issue_purpose,
          subjectObjectId: t.subject_object_id, ...(t.subject_version ? { subjectVersion: t.subject_version } : {}),
          ...(t.representation_id ? { representationId: t.representation_id } : {}),
          issuerName: t.issuer_name, issuedAt: t.issued_at.toISOString(), responseRequired: Boolean(t.response_required),
          recipients: (recipients.get(t.id) ?? []).map((rec) => ({
            id: rec.id, recipientPartyId: rec.recipient_party_id, recipientName: rec.recipient_name,
            responseRequired: Boolean(rec.response_required), ...(rec.due_at ? { dueAt: rec.due_at.toISOString() } : {}),
            ...(rec.response_id && rec.response_outcome && rec.responded_at ? { response: {
              id: rec.response_id, ...(rec.responder_name ? { responderName: rec.responder_name } : {}),
              outcome: rec.response_outcome, ...(rec.response_comments ? { comments: rec.response_comments } : {}),
              respondedAt: rec.responded_at.toISOString(),
              ...(rec.response_evidence_id ? { evidenceRecordId: rec.response_evidence_id } : {})
            }} : {})
          }))
        })),
        rework: (rework.get(row.id) ?? []).map((rw) => ({
          id: rw.id, triggerType: rw.trigger_type, triggerId: rw.trigger_id,
          previousSubjectObjectId: rw.previous_subject_object_id,
          ...(rw.previous_subject_version ? { previousSubjectVersion: rw.previous_subject_version } : {}),
          reason: rw.reason, ...(rw.work_item_id ? { workItemId: rw.work_item_id } : {}),
          createdAt: rw.created_at.toISOString()
        })),
        consequences: (consequences.get(row.id) ?? []).map((co) => ({
          id: co.id, consequenceType: co.consequence_type,
          ...(co.target_object_id ? { targetObjectId: co.target_object_id } : {}),
          ...(co.target_version ? { targetVersion: co.target_version } : {}),
          status: co.status, ...(co.applied_at ? { appliedAt: co.applied_at.toISOString() } : {}),
          ...(co.evidence_record_id ? { evidenceRecordId: co.evidence_record_id } : {})
        })),
        history: (histories.get(row.id) ?? []).map((h) => ({
          historyId: Number(h.history_id), status: h.status,
          ...(h.governed_output_object_id ? { governedOutputObjectId: h.governed_output_object_id } : {}),
          ...(h.governed_output_version ? { governedOutputVersion: h.governed_output_version } : {}),
          recordedAt: h.recorded_at.toISOString(), ...(h.note ? { note: h.note } : {}),
          ...(h.actor_name ? { actorName: h.actor_name } : {})
        }))
      };
    };

    const requirements = requirementsResult[0].map((r) => ({
      id: r.id, code: r.code, title: r.title, deliverableType: r.deliverable_type,
      description: r.description, contextObjectId: r.context_object_id, contextType: r.context_type,
      contextKey: r.context_key, authoringMode: r.authoring_mode,
      requiredRepresentationTypes: jsonArray(r.required_representation_types),
      ...(r.planned_due_at ? { plannedDueAt: r.planned_due_at.toISOString() } : {}),
      acceptanceRequired: Boolean(r.acceptance_required), status: r.status,
      items: (itemsByRequirement.get(r.id) ?? []).map(mapItem)
    }));

    const allItems = requirements.flatMap((r) => r.items);
    return {
      requirements,
      canonicalObjects: objectsResult[0].map((o) => ({ id: o.id, objectType: o.object_type, stableKey: o.stable_key })),
      people: peopleResult[0].map((p) => ({ id: p.id, partyId: p.party_id, displayName: p.display_name })),
      parties: partiesResult[0].map((p) => ({ id: p.id, displayName: p.display_name, kind: p.kind })),
      totals: {
        requirements: requirements.length,
        items: allItems.length,
        activeItems: allItems.filter((i) => !['CLOSED', 'CANCELLED'].includes(i.status)).length,
        inReview: allItems.filter((i) => i.status === 'IN_REVIEW').length,
        issued: allItems.filter((i) => i.status === 'ISSUED').length,
        accepted: allItems.filter((i) => i.status === 'ACCEPTED').length,
        responseActions: allItems.flatMap((i) => i.transmittals).flatMap((t) => t.recipients)
          .filter((r) => r.responseRequired && !r.response).length,
        rework: allItems.filter((i) => i.status === 'REWORK').length
      }
    };
  }
}
