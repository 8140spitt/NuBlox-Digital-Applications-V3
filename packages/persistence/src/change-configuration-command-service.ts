import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type Baseline,
  type BaselineItem,
  type CanonicalObjectIdentity,
  type Change,
  type ChangeAffectedObject,
  type ChangeDiscrepancy,
  type ChangeDisposition,
  type ChangeImpactAssessment,
  type ChangeImpactLevel,
  type ChangeImplementationAction,
  type ChangeVerification,
  type ChangeVerificationOutcome,
  type ConfigurationItem,
  type Effectivity,
  type EffectivityType,
  type TenantId
} from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlChangeRepository } from './change-repository.js';
import { MySqlInformationRepository } from './information-repository.js';
import { MySqlValidationExecutionService } from './validation-execution-service.js';

interface AuthorityDecisionRow extends RowDataPacket {
  id: string;
  decision_type: string;
  subject_object_id: string;
  outcome: string;
  authority_grant_id: string | null;
  decided_at: Date;
  grant_status: 'ACTIVE' | 'INACTIVE' | null;
  effective_from: Date | null;
  effective_to: Date | null;
}

interface BaselineContextRow extends RowDataPacket {
  context_object_id: string;
}

export class ChangeConfigurationCommandError extends Error {
  constructor(
    message: string,
    readonly code: 'PERMISSION_DENIED' | 'INVALID_INPUT' | 'NOT_FOUND' | 'CONFLICT'
  ) {
    super(message);
    this.name = 'ChangeConfigurationCommandError';
  }
}

function required(value: string | undefined, label: string): string {
  const result = value?.trim() ?? '';
  if (!result) {
    throw new ChangeConfigurationCommandError(`${label} is required.`, 'INVALID_INPUT');
  }
  return result;
}

function optional(value: string | undefined): string | undefined {
  const result = value?.trim() ?? '';
  return result || undefined;
}

function optionalNumber(value: number | string | undefined, label: string): number | undefined {
  if (value === undefined || value === '') return undefined;
  const result = Number(value);
  if (!Number.isFinite(result)) {
    throw new ChangeConfigurationCommandError(`${label} must be a number.`, 'INVALID_INPUT');
  }
  return result;
}

function now(): string {
  return new Date().toISOString();
}

function mapError(error: unknown): never {
  if (error instanceof ChangeConfigurationCommandError) throw error;
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: string }).code;
    if (code === 'ER_DUP_ENTRY') {
      throw new ChangeConfigurationCommandError(
        'An equivalent Change or Configuration record already exists.',
        'CONFLICT'
      );
    }
  }
  if (error instanceof Error) {
    if (/not found|does not exist/i.test(error.message)) {
      throw new ChangeConfigurationCommandError(error.message, 'NOT_FOUND');
    }
    if (/must|required|invalid|cannot|only|same tenant|empty|requires/i.test(error.message)) {
      throw new ChangeConfigurationCommandError(error.message, 'INVALID_INPUT');
    }
  }
  throw error;
}

const DISPOSITIONS = new Set<ChangeDisposition>(['ADD', 'MODIFY', 'REMOVE', 'REVIEW']);
const IMPACT_LEVELS = new Set<ChangeImpactLevel>(['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const VERIFICATION_OUTCOMES = new Set<ChangeVerificationOutcome>(['PASS', 'FAIL', 'PARTIAL']);
const EFFECTIVITY_TYPES = new Set<EffectivityType>([
  'DATE',
  'SERIAL',
  'LOT',
  'UNIT',
  'PROJECT',
  'LOCATION',
  'CUSTOM'
]);

export class MySqlChangeConfigurationCommandService {
  private readonly access: MySqlAccessRepository;
  private readonly changes: MySqlChangeRepository;
  private readonly information: MySqlInformationRepository;
  private readonly validation: MySqlValidationExecutionService;

  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
    this.changes = new MySqlChangeRepository(pool);
    this.information = new MySqlInformationRepository(pool);
    this.validation = new MySqlValidationExecutionService(pool);
  }

  async raiseChange(
    tenantId: TenantId,
    actorPersonId: string,
    input: { code: string; title: string; description: string; changeType: string }
  ): Promise<Change> {
    await this.requireManage(tenantId, actorPersonId);
    const code = required(input.code, 'Change code').toUpperCase();
    const timestamp = now();
    const object: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`CHANGEOBJ-${randomUUID()}`, 'Canonical Object'),
      tenantId,
      objectType: 'CHANGE',
      stableKey: `CHANGE:${code}`,
      createdAt: timestamp
    };
    const change: Change = {
      id: asId<'ChangeId'>(`CHANGE-${randomUUID()}`, 'Change'),
      tenantId,
      canonicalObjectId: object.id,
      code,
      title: required(input.title, 'Change title'),
      description: required(input.description, 'Change description'),
      changeType: required(input.changeType, 'Change type').toUpperCase(),
      status: 'DRAFT',
      raisedByPersonId: actorPersonId as Change['raisedByPersonId'],
      raisedAt: timestamp
    };
    try {
      await this.changes.createChangeWithCanonicalObject(tenantId, object, change, {
        actorPersonId,
        correlationId: 'CHANGE-CONFIGURATION-WORKSPACE'
      });
      return change;
    } catch (error) {
      return mapError(error);
    }
  }

  async startAssessment(tenantId: TenantId, actorPersonId: string, changeId: string): Promise<Change> {
    await this.requireManage(tenantId, actorPersonId);
    try {
      return await this.changes.startAssessment(
        tenantId,
        required(changeId, 'Change') as Change['id'],
        now(),
        this.audit(actorPersonId)
      );
    } catch (error) {
      return mapError(error);
    }
  }

  async addAffectedObject(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      changeId: string;
      subjectObjectId: string;
      subjectVersion?: string;
      disposition: ChangeDisposition;
      rationale: string;
    }
  ): Promise<ChangeAffectedObject> {
    await this.requireManage(tenantId, actorPersonId);
    if (!DISPOSITIONS.has(input.disposition)) {
      throw new ChangeConfigurationCommandError('Change disposition is not supported.', 'INVALID_INPUT');
    }
    const subjectVersion = optional(input.subjectVersion);
    const affected: ChangeAffectedObject = {
      id: asId<'ChangeAffectedObjectId'>(`AFFECT-${randomUUID()}`, 'Change Affected Object'),
      tenantId,
      changeId: required(input.changeId, 'Change') as ChangeAffectedObject['changeId'],
      subjectObjectId: required(input.subjectObjectId, 'Affected canonical object') as ChangeAffectedObject['subjectObjectId'],
      ...(subjectVersion ? { subjectVersion } : {}),
      disposition: input.disposition,
      rationale: required(input.rationale, 'Affected-object rationale')
    };
    try {
      await this.changes.addAffectedObject(tenantId, affected, this.audit(actorPersonId));
      return affected;
    } catch (error) {
      return mapError(error);
    }
  }

  async addImpactAssessment(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      changeId: string;
      domain: string;
      impactLevel: ChangeImpactLevel;
      summary: string;
      costImpact?: number | string;
      scheduleImpactDays?: number | string;
    }
  ): Promise<ChangeImpactAssessment> {
    await this.requireManage(tenantId, actorPersonId);
    if (!IMPACT_LEVELS.has(input.impactLevel)) {
      throw new ChangeConfigurationCommandError('Impact level is not supported.', 'INVALID_INPUT');
    }
    const costImpact = optionalNumber(input.costImpact, 'Cost impact');
    const scheduleImpactDays = optionalNumber(input.scheduleImpactDays, 'Schedule impact');
    const assessment: ChangeImpactAssessment = {
      id: asId<'ChangeImpactAssessmentId'>(`IMPACT-${randomUUID()}`, 'Change Impact Assessment'),
      tenantId,
      changeId: required(input.changeId, 'Change') as ChangeImpactAssessment['changeId'],
      domain: required(input.domain, 'Impact domain').toUpperCase(),
      assessorPersonId: actorPersonId as ChangeImpactAssessment['assessorPersonId'],
      assessedAt: now(),
      impactLevel: input.impactLevel,
      summary: required(input.summary, 'Impact summary'),
      ...(costImpact !== undefined ? { costImpact } : {}),
      ...(scheduleImpactDays !== undefined ? { scheduleImpactDays } : {})
    };
    try {
      await this.changes.addImpactAssessment(tenantId, assessment, this.audit(actorPersonId));
      return assessment;
    } catch (error) {
      return mapError(error);
    }
  }

  async submitForDecision(tenantId: TenantId, actorPersonId: string, changeId: string): Promise<Change> {
    await this.requireManage(tenantId, actorPersonId);
    try {
      return await this.changes.submitForDecision(
        tenantId,
        required(changeId, 'Change') as Change['id'],
        now(),
        this.audit(actorPersonId)
      );
    } catch (error) {
      return mapError(error);
    }
  }

  async applyDecision(
    tenantId: TenantId,
    actorPersonId: string,
    input: { changeId: string; decisionId: string }
  ): Promise<Change> {
    await this.requireManage(tenantId, actorPersonId);
    const changeId = required(input.changeId, 'Change') as Change['id'];
    const decisionId = required(input.decisionId, 'Change Decision');
    try {
      const change = await this.changes.getChange(tenantId, changeId);
      await this.requireAuthorityDecision(
        tenantId,
        decisionId,
        'CHANGE_APPROVAL',
        change.canonicalObjectId,
        ['APPROVED', 'REJECTED']
      );
      return await this.changes.applyDecision(
        tenantId,
        changeId,
        decisionId as NonNullable<Change['decisionId']>,
        this.audit(actorPersonId)
      );
    } catch (error) {
      return mapError(error);
    }
  }

  async startImplementation(tenantId: TenantId, actorPersonId: string, changeId: string): Promise<Change> {
    await this.requireManage(tenantId, actorPersonId);
    try {
      return await this.changes.startImplementation(
        tenantId,
        required(changeId, 'Change') as Change['id'],
        now(),
        this.audit(actorPersonId)
      );
    } catch (error) {
      return mapError(error);
    }
  }

  async createImplementationAction(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      changeId: string;
      actionType: string;
      description: string;
      targetObjectId?: string;
      targetVersion?: string;
    }
  ): Promise<ChangeImplementationAction> {
    await this.requireManage(tenantId, actorPersonId);
    const targetObjectId = optional(input.targetObjectId);
    const targetVersion = optional(input.targetVersion);
    const action: ChangeImplementationAction = {
      id: asId<'ChangeImplementationActionId'>(`CHACT-${randomUUID()}`, 'Change Implementation Action'),
      tenantId,
      changeId: required(input.changeId, 'Change') as ChangeImplementationAction['changeId'],
      actionType: required(input.actionType, 'Action type').toUpperCase(),
      description: required(input.description, 'Action description'),
      ...(targetObjectId ? { targetObjectId: targetObjectId as NonNullable<ChangeImplementationAction['targetObjectId']> } : {}),
      ...(targetVersion ? { targetVersion } : {}),
      status: 'PLANNED'
    };
    try {
      await this.changes.createImplementationAction(tenantId, action, this.audit(actorPersonId));
      return action;
    } catch (error) {
      return mapError(error);
    }
  }

  async startImplementationAction(
    tenantId: TenantId,
    actorPersonId: string,
    actionId: string
  ): Promise<ChangeImplementationAction> {
    await this.requireManage(tenantId, actorPersonId);
    try {
      return await this.changes.startImplementationAction(
        tenantId,
        required(actionId, 'Implementation Action') as ChangeImplementationAction['id'],
        now(),
        this.audit(actorPersonId)
      );
    } catch (error) {
      return mapError(error);
    }
  }

  async completeImplementationAction(
    tenantId: TenantId,
    actorPersonId: string,
    actionId: string
  ): Promise<ChangeImplementationAction> {
    await this.requireManage(tenantId, actorPersonId);
    try {
      return await this.changes.completeImplementationAction(
        tenantId,
        required(actionId, 'Implementation Action') as ChangeImplementationAction['id'],
        now(),
        this.audit(actorPersonId)
      );
    } catch (error) {
      return mapError(error);
    }
  }

  async beginVerification(tenantId: TenantId, actorPersonId: string, changeId: string): Promise<Change> {
    await this.requireManage(tenantId, actorPersonId);
    try {
      return await this.changes.beginVerification(
        tenantId,
        required(changeId, 'Change') as Change['id'],
        now(),
        this.audit(actorPersonId)
      );
    } catch (error) {
      return mapError(error);
    }
  }

  async recordVerification(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      changeId: string;
      outcome: ChangeVerificationOutcome;
      evidenceRecordId?: string;
      notes: string;
    }
  ): Promise<ChangeVerification> {
    await this.requireManage(tenantId, actorPersonId);
    if (!VERIFICATION_OUTCOMES.has(input.outcome)) {
      throw new ChangeConfigurationCommandError('Verification outcome is not supported.', 'INVALID_INPUT');
    }
    const evidenceRecordId = optional(input.evidenceRecordId);
    const verification: ChangeVerification = {
      id: asId<'ChangeVerificationId'>(`VERIFY-${randomUUID()}`, 'Change Verification'),
      tenantId,
      changeId: required(input.changeId, 'Change') as ChangeVerification['changeId'],
      verifierPersonId: actorPersonId as ChangeVerification['verifierPersonId'],
      verifiedAt: now(),
      outcome: input.outcome,
      ...(evidenceRecordId ? { evidenceRecordId: evidenceRecordId as NonNullable<ChangeVerification['evidenceRecordId']> } : {}),
      notes: required(input.notes, 'Verification notes')
    };
    try {
      await this.changes.createVerification(tenantId, verification, this.audit(actorPersonId));
      return verification;
    } catch (error) {
      return mapError(error);
    }
  }

  async createDiscrepancy(
    tenantId: TenantId,
    actorPersonId: string,
    input: { changeId: string; affectedObjectId?: string; description: string }
  ): Promise<ChangeDiscrepancy> {
    await this.requireManage(tenantId, actorPersonId);
    const affectedObjectId = optional(input.affectedObjectId);
    const discrepancy: ChangeDiscrepancy = {
      id: asId<'ChangeDiscrepancyId'>(`DISC-${randomUUID()}`, 'Change Discrepancy'),
      tenantId,
      changeId: required(input.changeId, 'Change') as ChangeDiscrepancy['changeId'],
      ...(affectedObjectId ? { affectedObjectId: affectedObjectId as NonNullable<ChangeDiscrepancy['affectedObjectId']> } : {}),
      description: required(input.description, 'Discrepancy description'),
      status: 'OPEN'
    };
    try {
      await this.changes.createDiscrepancy(tenantId, discrepancy, this.audit(actorPersonId));
      return discrepancy;
    } catch (error) {
      return mapError(error);
    }
  }

  async resolveDiscrepancy(
    tenantId: TenantId,
    actorPersonId: string,
    input: { discrepancyId: string; status: 'RESOLVED' | 'ACCEPTED'; resolution: string }
  ): Promise<ChangeDiscrepancy> {
    await this.requireManage(tenantId, actorPersonId);
    try {
      return await this.changes.resolveDiscrepancy(
        tenantId,
        required(input.discrepancyId, 'Discrepancy') as ChangeDiscrepancy['id'],
        input.status,
        now(),
        required(input.resolution, 'Discrepancy resolution'),
        this.audit(actorPersonId)
      );
    } catch (error) {
      return mapError(error);
    }
  }

  async closeChange(
    tenantId: TenantId,
    actorPersonId: string,
    input: { changeId: string; resultingBaselineId?: string }
  ): Promise<Change> {
    await this.requireManage(tenantId, actorPersonId);
    const resultingBaselineId = optional(input.resultingBaselineId);
    const changeId = required(input.changeId, 'Change') as Change['id'];
    try {
      const change = await this.changes.getChange(tenantId, changeId);
      const validation = await this.validation.evaluateRuleSetForCommand(
        tenantId,
        actorPersonId,
        {
          ruleSetCode: 'CHANGE_CLOSE',
          subjectObjectId: change.canonicalObjectId,
          contextType: 'COMMAND',
          contextId: 'CHANGE_CLOSE',
          subject: {
            objectType: 'CHANGE',
            changeStatus: change.status,
            resultingBaselineId: resultingBaselineId ?? null
          }
        }
      );
      if (validation.blocked) {
        throw new ChangeConfigurationCommandError(
          `Change closure is blocked by governed validation (${validation.conflicts.length} conflict(s)).`,
          'INVALID_INPUT'
        );
      }
      return await this.changes.closeChange(
        tenantId,
        changeId,
        now(),
        resultingBaselineId as Baseline['id'] | undefined,
        this.audit(actorPersonId)
      );
    } catch (error) {
      return mapError(error);
    }
  }

  async createConfigurationItem(
    tenantId: TenantId,
    actorPersonId: string,
    input: { canonicalObjectId: string; code: string; name: string }
  ): Promise<ConfigurationItem> {
    await this.requireManage(tenantId, actorPersonId);
    const item: ConfigurationItem = {
      id: asId<'ConfigurationItemId'>(`CI-${randomUUID()}`, 'Configuration Item'),
      tenantId,
      canonicalObjectId: required(input.canonicalObjectId, 'Canonical object') as ConfigurationItem['canonicalObjectId'],
      code: required(input.code, 'Configuration Item code').toUpperCase(),
      name: required(input.name, 'Configuration Item name'),
      status: 'ACTIVE'
    };
    try {
      await this.information.createConfigurationItem(tenantId, item, this.audit(actorPersonId));
      return item;
    } catch (error) {
      return mapError(error);
    }
  }

  async createBaseline(
    tenantId: TenantId,
    actorPersonId: string,
    input: { contextObjectId: string; code: string; name: string }
  ): Promise<Baseline> {
    await this.requireManage(tenantId, actorPersonId);
    const baseline: Baseline = {
      id: asId<'BaselineId'>(`BL-${randomUUID()}`, 'Baseline'),
      tenantId,
      contextObjectId: required(input.contextObjectId, 'Baseline context object') as Baseline['contextObjectId'],
      code: required(input.code, 'Baseline code').toUpperCase(),
      name: required(input.name, 'Baseline name'),
      status: 'DRAFT'
    };
    try {
      await this.information.createBaseline(tenantId, baseline, this.audit(actorPersonId));
      return baseline;
    } catch (error) {
      return mapError(error);
    }
  }

  async addBaselineItem(
    tenantId: TenantId,
    actorPersonId: string,
    input: { baselineId: string; configurationItemId: string; subjectVersion: string }
  ): Promise<BaselineItem> {
    await this.requireManage(tenantId, actorPersonId);
    const item: BaselineItem = {
      id: asId<'BaselineItemId'>(`BLI-${randomUUID()}`, 'Baseline Item'),
      tenantId,
      baselineId: required(input.baselineId, 'Baseline') as BaselineItem['baselineId'],
      configurationItemId: required(input.configurationItemId, 'Configuration Item') as BaselineItem['configurationItemId'],
      subjectVersion: required(input.subjectVersion, 'Subject version')
    };
    try {
      await this.information.addBaselineItem(tenantId, item, this.audit(actorPersonId));
      return item;
    } catch (error) {
      return mapError(error);
    }
  }

  async establishBaseline(
    tenantId: TenantId,
    actorPersonId: string,
    input: { baselineId: string; decisionId: string }
  ): Promise<Baseline> {
    await this.requireManage(tenantId, actorPersonId);
    const baselineId = required(input.baselineId, 'Baseline') as Baseline['id'];
    const decisionId = required(input.decisionId, 'Baseline establishment Decision');
    try {
      const [rows] = await this.pool.query<BaselineContextRow[]>(
        'SELECT context_object_id FROM baselines WHERE tenant_id = ? AND id = ?',
        [tenantId, baselineId]
      );
      const contextObjectId = rows[0]?.context_object_id;
      if (!contextObjectId) {
        throw new ChangeConfigurationCommandError('Baseline was not found in tenant.', 'NOT_FOUND');
      }
      await this.requireAuthorityDecision(
        tenantId,
        decisionId,
        'BASELINE_ESTABLISHMENT',
        contextObjectId,
        ['APPROVED']
      );
      return await this.information.establishBaseline(
        tenantId,
        baselineId,
        decisionId as NonNullable<Baseline['establishmentDecisionId']>,
        now(),
        this.audit(actorPersonId)
      );
    } catch (error) {
      return mapError(error);
    }
  }

  async supersedeBaseline(
    tenantId: TenantId,
    actorPersonId: string,
    input: { currentBaselineId: string; replacementBaselineId: string }
  ): Promise<Baseline> {
    await this.requireManage(tenantId, actorPersonId);
    try {
      return await this.information.supersedeBaseline(
        tenantId,
        required(input.currentBaselineId, 'Current Baseline') as Baseline['id'],
        required(input.replacementBaselineId, 'Replacement Baseline') as Baseline['id'],
        this.audit(actorPersonId)
      );
    } catch (error) {
      return mapError(error);
    }
  }

  async createEffectivity(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      configurationItemId: string;
      subjectVersion: string;
      effectivityType: EffectivityType;
      scopeType: string;
      scopeId?: string;
      effectiveFrom?: string;
      effectiveTo?: string;
      expression?: string;
    }
  ): Promise<Effectivity> {
    await this.requireManage(tenantId, actorPersonId);
    if (!EFFECTIVITY_TYPES.has(input.effectivityType)) {
      throw new ChangeConfigurationCommandError('Effectivity type is not supported.', 'INVALID_INPUT');
    }
    const scopeId = optional(input.scopeId);
    const effectiveFrom = optional(input.effectiveFrom);
    const effectiveTo = optional(input.effectiveTo);
    const expression = optional(input.expression);
    const effectivity: Effectivity = {
      id: asId<'EffectivityId'>(`EFF-${randomUUID()}`, 'Effectivity'),
      tenantId,
      configurationItemId: required(input.configurationItemId, 'Configuration Item') as Effectivity['configurationItemId'],
      subjectVersion: required(input.subjectVersion, 'Subject version'),
      effectivityType: input.effectivityType,
      scopeType: required(input.scopeType, 'Effectivity scope type').toUpperCase(),
      ...(scopeId ? { scopeId } : {}),
      ...(effectiveFrom ? { effectiveFrom } : {}),
      ...(effectiveTo ? { effectiveTo } : {}),
      ...(expression ? { expression } : {}),
      status: 'ACTIVE'
    };
    try {
      await this.information.createEffectivity(tenantId, effectivity, this.audit(actorPersonId));
      return effectivity;
    } catch (error) {
      return mapError(error);
    }
  }

  private audit(actorPersonId: string) {
    return {
      actorPersonId,
      correlationId: 'CHANGE-CONFIGURATION-WORKSPACE'
    };
  }

  private async requireManage(tenantId: TenantId, actorPersonId: string): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.CONFIGURATION_MANAGE,
      { scopeType: 'TENANT' }
    );
    if (!evaluation.allowed) {
      throw new ChangeConfigurationCommandError(evaluation.reason, 'PERMISSION_DENIED');
    }
  }

  private async requireAuthorityDecision(
    tenantId: TenantId,
    decisionId: string,
    decisionType: string,
    subjectObjectId: string,
    allowedOutcomes: ReadonlyArray<string>
  ): Promise<void> {
    const [rows] = await this.pool.query<AuthorityDecisionRow[]>(
      `SELECT d.id, d.decision_type, d.subject_object_id, d.outcome,
              d.authority_grant_id, d.decided_at, ag.status AS grant_status,
              ag.effective_from, ag.effective_to
         FROM decisions d
         LEFT JOIN authority_grants ag
           ON ag.tenant_id = d.tenant_id AND ag.id = d.authority_grant_id
        WHERE d.tenant_id = ? AND d.id = ?`,
      [tenantId, decisionId]
    );
    const row = rows[0];
    if (!row) {
      throw new ChangeConfigurationCommandError('Decision was not found in tenant.', 'NOT_FOUND');
    }
    if (
      row.decision_type !== decisionType ||
      row.subject_object_id !== subjectObjectId ||
      !allowedOutcomes.includes(row.outcome)
    ) {
      throw new ChangeConfigurationCommandError(
        'Decision does not govern the selected subject or outcome.',
        'INVALID_INPUT'
      );
    }
    if (
      !row.authority_grant_id ||
      row.grant_status !== 'ACTIVE' ||
      !row.effective_from
    ) {
      throw new ChangeConfigurationCommandError(
        'Decision requires an active Authority Grant.',
        'INVALID_INPUT'
      );
    }
    const decidedAt = row.decided_at.getTime();
    if (
      decidedAt < row.effective_from.getTime() ||
      (row.effective_to && decidedAt > row.effective_to.getTime())
    ) {
      throw new ChangeConfigurationCommandError(
        'Decision was made outside the Authority Grant effectivity period.',
        'INVALID_INPUT'
      );
    }
  }
}
