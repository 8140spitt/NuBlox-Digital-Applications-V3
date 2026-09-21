import type { RowDataPacket } from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';
import type { TenantId } from '@nublox/kernel';

interface ChangeRow extends RowDataPacket {
  id: string;
  canonical_object_id: string;
  code: string;
  title: string;
  description: string;
  change_type: string;
  status: string;
  raised_at: Date;
  raised_by_name: string;
  decision_id: string | null;
  decided_at: Date | null;
  resulting_baseline_id: string | null;
  closed_at: Date | null;
}
interface AffectedRow extends RowDataPacket {
  id: string;
  change_id: string;
  subject_object_id: string;
  object_type: string;
  stable_key: string;
  subject_version: string | null;
  disposition: string;
  rationale: string;
}
interface ImpactRow extends RowDataPacket {
  id: string;
  change_id: string;
  domain: string;
  assessor_name: string;
  assessed_at: Date;
  impact_level: string;
  summary: string;
  cost_impact: string | number | null;
  schedule_impact_days: string | number | null;
}
interface ActionRow extends RowDataPacket {
  id: string;
  change_id: string;
  action_type: string;
  description: string;
  target_object_id: string | null;
  target_version: string | null;
  work_item_id: string | null;
  status: string;
  completed_at: Date | null;
}
interface VerificationRow extends RowDataPacket {
  id: string;
  change_id: string;
  verifier_name: string;
  verified_at: Date;
  outcome: string;
  evidence_record_id: string | null;
  notes: string;
}
interface DiscrepancyRow extends RowDataPacket {
  id: string;
  change_id: string;
  affected_object_id: string | null;
  description: string;
  status: string;
  resolved_at: Date | null;
  resolution: string | null;
}
interface HistoryRow extends RowDataPacket {
  history_id: number;
  change_id: string;
  status: string;
  recorded_at: Date;
  decision_id: string | null;
  note: string | null;
  actor_name: string | null;
}
interface ConfigurationItemRow extends RowDataPacket {
  id: string;
  canonical_object_id: string;
  object_type: string;
  stable_key: string;
  code: string;
  name: string;
  status: string;
}
interface BaselineRow extends RowDataPacket {
  id: string;
  context_object_id: string;
  context_object_type: string;
  context_stable_key: string;
  code: string;
  name: string;
  status: string;
  established_at: Date | null;
  establishment_decision_id: string | null;
  superseded_by_baseline_id: string | null;
}
interface BaselineItemRow extends RowDataPacket {
  id: string;
  baseline_id: string;
  configuration_item_id: string;
  configuration_item_code: string;
  configuration_item_name: string;
  subject_version: string;
}
interface EffectivityRow extends RowDataPacket {
  id: string;
  configuration_item_id: string;
  configuration_item_code: string;
  subject_version: string;
  effectivity_type: string;
  scope_type: string;
  scope_id: string | null;
  effective_from: Date | null;
  effective_to: Date | null;
  expression: string | null;
  status: string;
}

export interface ChangeConfigurationProjection {
  changes: Array<{
    id: string;
    canonicalObjectId: string;
    code: string;
    title: string;
    description: string;
    changeType: string;
    status: string;
    raisedAt: string;
    raisedByName: string;
    decisionId?: string;
    decidedAt?: string;
    resultingBaselineId?: string;
    closedAt?: string;
    affectedObjects: Array<{
      id: string;
      subjectObjectId: string;
      objectType: string;
      stableKey: string;
      subjectVersion?: string;
      disposition: string;
      rationale: string;
    }>;
    impactAssessments: Array<{
      id: string;
      domain: string;
      assessorName: string;
      assessedAt: string;
      impactLevel: string;
      summary: string;
      costImpact?: number;
      scheduleImpactDays?: number;
    }>;
    implementationActions: Array<{
      id: string;
      actionType: string;
      description: string;
      targetObjectId?: string;
      targetVersion?: string;
      workItemId?: string;
      status: string;
      completedAt?: string;
    }>;
    verifications: Array<{
      id: string;
      verifierName: string;
      verifiedAt: string;
      outcome: string;
      evidenceRecordId?: string;
      notes: string;
    }>;
    discrepancies: Array<{
      id: string;
      affectedObjectId?: string;
      description: string;
      status: string;
      resolvedAt?: string;
      resolution?: string;
    }>;
    history: Array<{
      historyId: number;
      status: string;
      recordedAt: string;
      decisionId?: string;
      note?: string;
      actorName?: string;
    }>;
  }>;
  configurationItems: Array<{
    id: string;
    canonicalObjectId: string;
    objectType: string;
    stableKey: string;
    code: string;
    name: string;
    status: string;
  }>;
  baselines: Array<{
    id: string;
    contextObjectId: string;
    contextObjectType: string;
    contextStableKey: string;
    code: string;
    name: string;
    status: string;
    establishedAt?: string;
    establishmentDecisionId?: string;
    supersededByBaselineId?: string;
    items: Array<{
      id: string;
      configurationItemId: string;
      configurationItemCode: string;
      configurationItemName: string;
      subjectVersion: string;
    }>;
  }>;
  effectivities: Array<{
    id: string;
    configurationItemId: string;
    configurationItemCode: string;
    subjectVersion: string;
    effectivityType: string;
    scopeType: string;
    scopeId?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    expression?: string;
    status: string;
  }>;
  totals: {
    changes: number;
    openChanges: number;
    configurationItems: number;
    baselines: number;
    establishedBaselines: number;
    effectivities: number;
  };
}

export class MySqlChangeConfigurationReadRepository {
  constructor(private readonly pool: Pool) {}

  async getProjection(tenantId: TenantId): Promise<ChangeConfigurationProjection> {
    const [
      changeResult,
      affectedResult,
      impactResult,
      actionResult,
      verificationResult,
      discrepancyResult,
      historyResult,
      configurationItemResult,
      baselineResult,
      baselineItemResult,
      effectivityResult
    ] = await Promise.all([
      this.pool.query<ChangeRow[]>(
        `SELECT c.id, c.canonical_object_id, c.code, c.title, c.description, c.change_type,
                c.status, c.raised_at, COALESCE(p.preferred_name, p.legal_name) AS raised_by_name,
                c.decision_id, c.decided_at, c.resulting_baseline_id, c.closed_at
           FROM changes c
           JOIN persons p ON p.tenant_id = c.tenant_id AND p.id = c.raised_by_person_id
          WHERE c.tenant_id = ?
          ORDER BY c.raised_at DESC, c.code`,
        [tenantId]
      ),
      this.pool.query<AffectedRow[]>(
        `SELECT a.id, a.change_id, a.subject_object_id, o.object_type, o.stable_key,
                a.subject_version, a.disposition, a.rationale
           FROM change_affected_objects a
           JOIN canonical_objects o ON o.tenant_id = a.tenant_id AND o.id = a.subject_object_id
          WHERE a.tenant_id = ?
          ORDER BY a.change_id, a.id`,
        [tenantId]
      ),
      this.pool.query<ImpactRow[]>(
        `SELECT i.id, i.change_id, i.domain,
                COALESCE(p.preferred_name, p.legal_name) AS assessor_name,
                i.assessed_at, i.impact_level, i.summary, i.cost_impact, i.schedule_impact_days
           FROM change_impact_assessments i
           JOIN persons p ON p.tenant_id = i.tenant_id AND p.id = i.assessor_person_id
          WHERE i.tenant_id = ?
          ORDER BY i.change_id, i.assessed_at DESC`,
        [tenantId]
      ),
      this.pool.query<ActionRow[]>(
        `SELECT id, change_id, action_type, description, target_object_id, target_version,
                work_item_id, status, completed_at
           FROM change_implementation_actions
          WHERE tenant_id = ?
          ORDER BY change_id, id`,
        [tenantId]
      ),
      this.pool.query<VerificationRow[]>(
        `SELECT v.id, v.change_id, COALESCE(p.preferred_name, p.legal_name) AS verifier_name,
                v.verified_at, v.outcome, v.evidence_record_id, v.notes
           FROM change_verifications v
           JOIN persons p ON p.tenant_id = v.tenant_id AND p.id = v.verifier_person_id
          WHERE v.tenant_id = ?
          ORDER BY v.change_id, v.verified_at DESC`,
        [tenantId]
      ),
      this.pool.query<DiscrepancyRow[]>(
        `SELECT id, change_id, affected_object_id, description, status, resolved_at, resolution
           FROM change_discrepancies
          WHERE tenant_id = ?
          ORDER BY change_id, id`,
        [tenantId]
      ),
      this.pool.query<HistoryRow[]>(
        `SELECT h.history_id, h.change_id, h.status, h.recorded_at, h.decision_id, h.note,
                COALESCE(p.preferred_name, p.legal_name) AS actor_name
           FROM change_status_history h
           LEFT JOIN persons p ON p.tenant_id = h.tenant_id AND p.id = h.actor_person_id
          WHERE h.tenant_id = ?
          ORDER BY h.change_id, h.history_id`,
        [tenantId]
      ),
      this.pool.query<ConfigurationItemRow[]>(
        `SELECT ci.id, ci.canonical_object_id, o.object_type, o.stable_key,
                ci.code, ci.name, ci.status
           FROM configuration_items ci
           JOIN canonical_objects o ON o.tenant_id = ci.tenant_id AND o.id = ci.canonical_object_id
          WHERE ci.tenant_id = ?
          ORDER BY ci.code`,
        [tenantId]
      ),
      this.pool.query<BaselineRow[]>(
        `SELECT b.id, b.context_object_id, o.object_type AS context_object_type,
                o.stable_key AS context_stable_key, b.code, b.name, b.status,
                b.established_at, b.establishment_decision_id, b.superseded_by_baseline_id
           FROM baselines b
           JOIN canonical_objects o ON o.tenant_id = b.tenant_id AND o.id = b.context_object_id
          WHERE b.tenant_id = ?
          ORDER BY b.created_at DESC, b.code`,
        [tenantId]
      ),
      this.pool.query<BaselineItemRow[]>(
        `SELECT bi.id, bi.baseline_id, bi.configuration_item_id,
                ci.code AS configuration_item_code, ci.name AS configuration_item_name,
                bi.subject_version
           FROM baseline_items bi
           JOIN configuration_items ci
             ON ci.tenant_id = bi.tenant_id AND ci.id = bi.configuration_item_id
          WHERE bi.tenant_id = ?
          ORDER BY bi.baseline_id, ci.code`,
        [tenantId]
      ),
      this.pool.query<EffectivityRow[]>(
        `SELECT e.id, e.configuration_item_id, ci.code AS configuration_item_code,
                e.subject_version, e.effectivity_type, e.scope_type, e.scope_id,
                e.effective_from, e.effective_to, e.expression, e.status
           FROM effectivities e
           JOIN configuration_items ci
             ON ci.tenant_id = e.tenant_id AND ci.id = e.configuration_item_id
          WHERE e.tenant_id = ?
          ORDER BY ci.code, e.subject_version, e.id`,
        [tenantId]
      )
    ]);

    const affected = new Map<string, ChangeConfigurationProjection['changes'][number]['affectedObjects']>();
    for (const row of affectedResult[0]) {
      const list = affected.get(row.change_id) ?? [];
      list.push({
        id: row.id,
        subjectObjectId: row.subject_object_id,
        objectType: row.object_type,
        stableKey: row.stable_key,
        ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
        disposition: row.disposition,
        rationale: row.rationale
      });
      affected.set(row.change_id, list);
    }

    const impacts = new Map<string, ChangeConfigurationProjection['changes'][number]['impactAssessments']>();
    for (const row of impactResult[0]) {
      const list = impacts.get(row.change_id) ?? [];
      list.push({
        id: row.id,
        domain: row.domain,
        assessorName: row.assessor_name,
        assessedAt: row.assessed_at.toISOString(),
        impactLevel: row.impact_level,
        summary: row.summary,
        ...(row.cost_impact !== null ? { costImpact: Number(row.cost_impact) } : {}),
        ...(row.schedule_impact_days !== null ? { scheduleImpactDays: Number(row.schedule_impact_days) } : {})
      });
      impacts.set(row.change_id, list);
    }

    const actions = new Map<string, ChangeConfigurationProjection['changes'][number]['implementationActions']>();
    for (const row of actionResult[0]) {
      const list = actions.get(row.change_id) ?? [];
      list.push({
        id: row.id,
        actionType: row.action_type,
        description: row.description,
        ...(row.target_object_id ? { targetObjectId: row.target_object_id } : {}),
        ...(row.target_version ? { targetVersion: row.target_version } : {}),
        ...(row.work_item_id ? { workItemId: row.work_item_id } : {}),
        status: row.status,
        ...(row.completed_at ? { completedAt: row.completed_at.toISOString() } : {})
      });
      actions.set(row.change_id, list);
    }

    const verifications = new Map<string, ChangeConfigurationProjection['changes'][number]['verifications']>();
    for (const row of verificationResult[0]) {
      const list = verifications.get(row.change_id) ?? [];
      list.push({
        id: row.id,
        verifierName: row.verifier_name,
        verifiedAt: row.verified_at.toISOString(),
        outcome: row.outcome,
        ...(row.evidence_record_id ? { evidenceRecordId: row.evidence_record_id } : {}),
        notes: row.notes
      });
      verifications.set(row.change_id, list);
    }

    const discrepancies = new Map<string, ChangeConfigurationProjection['changes'][number]['discrepancies']>();
    for (const row of discrepancyResult[0]) {
      const list = discrepancies.get(row.change_id) ?? [];
      list.push({
        id: row.id,
        ...(row.affected_object_id ? { affectedObjectId: row.affected_object_id } : {}),
        description: row.description,
        status: row.status,
        ...(row.resolved_at ? { resolvedAt: row.resolved_at.toISOString() } : {}),
        ...(row.resolution ? { resolution: row.resolution } : {})
      });
      discrepancies.set(row.change_id, list);
    }

    const histories = new Map<string, ChangeConfigurationProjection['changes'][number]['history']>();
    for (const row of historyResult[0]) {
      const list = histories.get(row.change_id) ?? [];
      list.push({
        historyId: Number(row.history_id),
        status: row.status,
        recordedAt: row.recorded_at.toISOString(),
        ...(row.decision_id ? { decisionId: row.decision_id } : {}),
        ...(row.note ? { note: row.note } : {}),
        ...(row.actor_name ? { actorName: row.actor_name } : {})
      });
      histories.set(row.change_id, list);
    }

    const baselineItems = new Map<string, ChangeConfigurationProjection['baselines'][number]['items']>();
    for (const row of baselineItemResult[0]) {
      const list = baselineItems.get(row.baseline_id) ?? [];
      list.push({
        id: row.id,
        configurationItemId: row.configuration_item_id,
        configurationItemCode: row.configuration_item_code,
        configurationItemName: row.configuration_item_name,
        subjectVersion: row.subject_version
      });
      baselineItems.set(row.baseline_id, list);
    }

    const changes = changeResult[0].map((row) => ({
      id: row.id,
      canonicalObjectId: row.canonical_object_id,
      code: row.code,
      title: row.title,
      description: row.description,
      changeType: row.change_type,
      status: row.status,
      raisedAt: row.raised_at.toISOString(),
      raisedByName: row.raised_by_name,
      ...(row.decision_id ? { decisionId: row.decision_id } : {}),
      ...(row.decided_at ? { decidedAt: row.decided_at.toISOString() } : {}),
      ...(row.resulting_baseline_id ? { resultingBaselineId: row.resulting_baseline_id } : {}),
      ...(row.closed_at ? { closedAt: row.closed_at.toISOString() } : {}),
      affectedObjects: affected.get(row.id) ?? [],
      impactAssessments: impacts.get(row.id) ?? [],
      implementationActions: actions.get(row.id) ?? [],
      verifications: verifications.get(row.id) ?? [],
      discrepancies: discrepancies.get(row.id) ?? [],
      history: histories.get(row.id) ?? []
    }));

    return {
      changes,
      configurationItems: configurationItemResult[0].map((row) => ({
        id: row.id,
        canonicalObjectId: row.canonical_object_id,
        objectType: row.object_type,
        stableKey: row.stable_key,
        code: row.code,
        name: row.name,
        status: row.status
      })),
      baselines: baselineResult[0].map((row) => ({
        id: row.id,
        contextObjectId: row.context_object_id,
        contextObjectType: row.context_object_type,
        contextStableKey: row.context_stable_key,
        code: row.code,
        name: row.name,
        status: row.status,
        ...(row.established_at ? { establishedAt: row.established_at.toISOString() } : {}),
        ...(row.establishment_decision_id ? { establishmentDecisionId: row.establishment_decision_id } : {}),
        ...(row.superseded_by_baseline_id ? { supersededByBaselineId: row.superseded_by_baseline_id } : {}),
        items: baselineItems.get(row.id) ?? []
      })),
      effectivities: effectivityResult[0].map((row) => ({
        id: row.id,
        configurationItemId: row.configuration_item_id,
        configurationItemCode: row.configuration_item_code,
        subjectVersion: row.subject_version,
        effectivityType: row.effectivity_type,
        scopeType: row.scope_type,
        ...(row.scope_id ? { scopeId: row.scope_id } : {}),
        ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
        ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
        ...(row.expression ? { expression: row.expression } : {}),
        status: row.status
      })),
      totals: {
        changes: changes.length,
        openChanges: changes.filter((change) => !['CLOSED', 'CANCELLED', 'REJECTED'].includes(change.status)).length,
        configurationItems: configurationItemResult[0].length,
        baselines: baselineResult[0].length,
        establishedBaselines: baselineResult[0].filter((baseline) => baseline.status === 'ESTABLISHED').length,
        effectivities: effectivityResult[0].length
      }
    };
  }
}
