import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type CanonicalObjectIdentity,
  type DeliverableApproval,
  type DeliverableAuthoringBinding,
  type DeliverableConsequence,
  type DeliverableItem,
  type DeliverablePrincipalType,
  type DeliverableRequirement,
  type DeliverableResponsibility,
  type DeliverableReview,
  type DeliverableReviewOutcome,
  type DeliverableReviewType,
  type DeliverableRework,
  type RecipientResponse,
  type RecipientResponseOutcome,
  type TenantId,
  type Transmittal,
  type TransmittalRecipient,
  type WorkResponsibilityRole
} from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlDeliverableRepository } from './deliverable-repository.js';

interface RequirementLookupRow extends RowDataPacket {
  id: string;
  context_object_id: string;
  deliverable_type: string;
  authoring_mode: string;
  status: string;
}
interface DecisionAuthorityRow extends RowDataPacket {
  id: string;
  decision_type: string;
  subject_object_id: string;
  subject_version: string | null;
  outcome: string;
  decided_at: Date;
  authority_grant_id: string | null;
  grant_status: 'ACTIVE' | 'INACTIVE' | null;
  effective_from: Date | null;
  effective_to: Date | null;
}
interface RecipientLookupRow extends RowDataPacket {
  recipient_party_id: string;
}

export class DeliverableCommandError extends Error {
  constructor(
    message: string,
    readonly code: 'PERMISSION_DENIED' | 'INVALID_INPUT' | 'NOT_FOUND' | 'CONFLICT'
  ) {
    super(message);
    this.name = 'DeliverableCommandError';
  }
}

function required(value: string | undefined, label: string): string {
  const result = value?.trim() ?? '';
  if (!result) throw new DeliverableCommandError(`${label} is required.`, 'INVALID_INPUT');
  return result;
}
function optional(value: string | undefined): string | undefined {
  const result = value?.trim() ?? '';
  return result || undefined;
}
function now(): string {
  return new Date().toISOString();
}
function dateValue(value: string | undefined, label: string): string | undefined {
  const raw = optional(value);
  if (!raw) return undefined;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new DeliverableCommandError(`${label} must be a valid date/time.`, 'INVALID_INPUT');
  }
  return parsed.toISOString();
}
function mapError(error: unknown): never {
  if (error instanceof DeliverableCommandError) throw error;
  if (typeof error === 'object' && error !== null && 'code' in error) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      throw new DeliverableCommandError('An equivalent Deliverable record already exists.', 'CONFLICT');
    }
  }
  if (error instanceof Error) {
    if (/not found/i.test(error.message)) {
      throw new DeliverableCommandError(error.message, 'NOT_FOUND');
    }
    if (/must|required|invalid|cannot|only|requires|exact|same tenant|response|authoring|approval/i.test(error.message)) {
      throw new DeliverableCommandError(error.message, 'INVALID_INPUT');
    }
  }
  throw error;
}

const REVIEW_TYPES = new Set<DeliverableReviewType>([
  'AUTHOR_REVIEW', 'PEER_REVIEW', 'CHECK', 'TECHNICAL_REVIEW', 'ASSURANCE', 'CUSTOM'
]);
const REVIEW_OUTCOMES = new Set<DeliverableReviewOutcome>([
  'NO_COMMENT', 'COMMENTS', 'REVISE', 'REJECTED'
]);
const RESPONSE_OUTCOMES = new Set<RecipientResponseOutcome>([
  'ACCEPTED', 'ACCEPTED_WITH_COMMENTS', 'NO_OBJECTION', 'REVISE', 'REJECTED'
]);
const PRINCIPAL_TYPES = new Set<DeliverablePrincipalType>([
  'PERSON', 'POSITION', 'ORGANISATION_UNIT', 'ORGANISATION'
]);
const RESPONSIBILITY_ROLES = new Set<WorkResponsibilityRole>([
  'ACCOUNTABLE', 'RESPONSIBLE', 'CONTRIBUTOR', 'REVIEWER', 'CHECKER',
  'APPROVER', 'ACCEPTOR', 'CONSULTED', 'INFORMED', 'ASSURANCE'
]);

export class MySqlDeliverableCommandService {
  private readonly access: MySqlAccessRepository;
  private readonly deliverables: MySqlDeliverableRepository;

  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
    this.deliverables = new MySqlDeliverableRepository(pool);
  }

  async createRequirement(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      code: string;
      title: string;
      deliverableType: string;
      description: string;
      contextObjectId: string;
      requiredRepresentationTypes: string[];
      plannedDueAt?: string;
      acceptanceRequired: boolean;
    }
  ): Promise<DeliverableRequirement> {
    await this.requireManage(tenantId, actorPersonId);
    const plannedDueAt = dateValue(input.plannedDueAt, 'Planned due date');
    const representations = input.requiredRepresentationTypes.map((value) => value.trim()).filter(Boolean);
    const requirement: DeliverableRequirement = {
      id: asId<'DeliverableRequirementId'>(`DREQ-${randomUUID()}`, 'Deliverable Requirement'),
      tenantId,
      code: required(input.code, 'Requirement code').toUpperCase(),
      title: required(input.title, 'Requirement title'),
      deliverableType: required(input.deliverableType, 'Deliverable type').toUpperCase(),
      description: required(input.description, 'Requirement description'),
      contextObjectId: required(input.contextObjectId, 'Context object') as DeliverableRequirement['contextObjectId'],
      authoringMode: 'NATIVE',
      requiredRepresentationTypes: representations,
      ...(plannedDueAt ? { plannedDueAt } : {}),
      acceptanceRequired: input.acceptanceRequired,
      status: 'ACTIVE'
    };
    try {
      await this.deliverables.createRequirement(tenantId, requirement, this.audit(actorPersonId));
      return requirement;
    } catch (error) {
      return mapError(error);
    }
  }

  async createItem(
    tenantId: TenantId,
    actorPersonId: string,
    input: { requirementId: string; code: string; title: string; plannedAt?: string; forecastAt?: string }
  ): Promise<DeliverableItem> {
    await this.requireManage(tenantId, actorPersonId);
    const requirement = await this.requireRequirement(tenantId, input.requirementId);
    if (requirement.status !== 'ACTIVE') {
      throw new DeliverableCommandError('Deliverable Requirement must be ACTIVE.', 'INVALID_INPUT');
    }
    const code = required(input.code, 'Deliverable Item code').toUpperCase();
    const createdAt = now();
    const plannedAt = dateValue(input.plannedAt, 'Planned date');
    const forecastAt = dateValue(input.forecastAt, 'Forecast date');
    const object: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`DELOBJ-${randomUUID()}`, 'Canonical Object'),
      tenantId,
      objectType: 'DELIVERABLE_ITEM',
      stableKey: `DELIVERABLE:${code}`,
      createdAt
    };
    const item: DeliverableItem = {
      id: asId<'DeliverableItemId'>(`DEL-${randomUUID()}`, 'Deliverable Item'),
      tenantId,
      canonicalObjectId: object.id,
      requirementId: requirement.id as DeliverableItem['requirementId'],
      contextObjectId: requirement.contextObjectId as DeliverableItem['contextObjectId'],
      code,
      title: required(input.title, 'Deliverable Item title'),
      deliverableType: requirement.deliverableType,
      status: 'PLANNED',
      ...(plannedAt ? { plannedAt } : {}),
      ...(forecastAt ? { forecastAt } : {})
    };
    try {
      await this.deliverables.createItemWithCanonicalObject(
        tenantId,
        object,
        item,
        this.audit(actorPersonId)
      );
      return item;
    } catch (error) {
      return mapError(error);
    }
  }

  async createNativeAuthoringBinding(
    tenantId: TenantId,
    actorPersonId: string,
    input: { deliverableItemId: string; authoritativeObjectId: string }
  ): Promise<DeliverableAuthoringBinding> {
    await this.requireManage(tenantId, actorPersonId);
    const binding: DeliverableAuthoringBinding = {
      id: asId<'DeliverableAuthoringBindingId'>(`DAUTH-${randomUUID()}`, 'Deliverable Authoring Binding'),
      tenantId,
      deliverableItemId: required(input.deliverableItemId, 'Deliverable Item') as DeliverableAuthoringBinding['deliverableItemId'],
      mode: 'NATIVE',
      providerKey: 'NUBLOX_INFORMATION',
      authoritativeObjectId: required(input.authoritativeObjectId, 'Authoritative object') as NonNullable<DeliverableAuthoringBinding['authoritativeObjectId']>,
      createdAt: now(),
      status: 'ACTIVE'
    };
    try {
      await this.deliverables.createAuthoringBinding(tenantId, binding, this.audit(actorPersonId));
      return binding;
    } catch (error) {
      return mapError(error);
    }
  }

  async addResponsibility(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      deliverableItemId: string;
      principalType: DeliverablePrincipalType;
      principalId: string;
      responsibilityRole: WorkResponsibilityRole;
      effectiveFrom?: string;
      effectiveTo?: string;
    }
  ): Promise<DeliverableResponsibility> {
    await this.requireManage(tenantId, actorPersonId);
    if (!PRINCIPAL_TYPES.has(input.principalType)) {
      throw new DeliverableCommandError('Deliverable principal type is not supported.', 'INVALID_INPUT');
    }
    if (!RESPONSIBILITY_ROLES.has(input.responsibilityRole)) {
      throw new DeliverableCommandError('Deliverable responsibility role is not supported.', 'INVALID_INPUT');
    }
    const effectiveFrom = dateValue(input.effectiveFrom, 'Effective from') ?? now();
    const effectiveTo = dateValue(input.effectiveTo, 'Effective to');
    const responsibility: DeliverableResponsibility = {
      id: asId<'DeliverableResponsibilityId'>(`DRESP-${randomUUID()}`, 'Deliverable Responsibility'),
      tenantId,
      deliverableItemId: required(input.deliverableItemId, 'Deliverable Item') as DeliverableResponsibility['deliverableItemId'],
      principalType: input.principalType,
      principalId: required(input.principalId, 'Principal'),
      responsibilityRole: input.responsibilityRole,
      effectiveFrom,
      ...(effectiveTo ? { effectiveTo } : {}),
      status: 'ACTIVE'
    };
    try {
      await this.deliverables.addResponsibility(tenantId, responsibility, this.audit(actorPersonId));
      return responsibility;
    } catch (error) {
      return mapError(error);
    }
  }

  async startItem(tenantId: TenantId, actorPersonId: string, itemId: string): Promise<DeliverableItem> {
    await this.requireManage(tenantId, actorPersonId);
    try {
      return await this.deliverables.startItem(
        tenantId,
        required(itemId, 'Deliverable Item') as DeliverableItem['id'],
        now(),
        this.audit(actorPersonId)
      );
    } catch (error) {
      return mapError(error);
    }
  }

  async bindOutput(
    tenantId: TenantId,
    actorPersonId: string,
    input: { itemId: string; outputObjectId: string; outputVersion?: string }
  ): Promise<DeliverableItem> {
    await this.requireManage(tenantId, actorPersonId);
    try {
      return await this.deliverables.bindOutput(
        tenantId,
        required(input.itemId, 'Deliverable Item') as DeliverableItem['id'],
        required(input.outputObjectId, 'Governed output') as CanonicalObjectIdentity['id'],
        optional(input.outputVersion),
        now(),
        this.audit(actorPersonId)
      );
    } catch (error) {
      return mapError(error);
    }
  }

  async submitForReview(
    tenantId: TenantId,
    actorPersonId: string,
    itemId: string
  ): Promise<DeliverableItem> {
    await this.requireManage(tenantId, actorPersonId);
    try {
      return await this.deliverables.submitForReview(
        tenantId,
        required(itemId, 'Deliverable Item') as DeliverableItem['id'],
        now(),
        this.audit(actorPersonId)
      );
    } catch (error) {
      return mapError(error);
    }
  }

  async recordReview(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      itemId: string;
      reviewType: DeliverableReviewType;
      outcome: DeliverableReviewOutcome;
      comments?: string;
      evidenceRecordId?: string;
    }
  ): Promise<DeliverableReview> {
    await this.requireManage(tenantId, actorPersonId);
    if (!REVIEW_TYPES.has(input.reviewType) || !REVIEW_OUTCOMES.has(input.outcome)) {
      throw new DeliverableCommandError('Deliverable review type or outcome is not supported.', 'INVALID_INPUT');
    }
    const item = await this.getItemWithOutput(tenantId, input.itemId);
    const comments = optional(input.comments);
    const evidenceRecordId = optional(input.evidenceRecordId);
    const review: DeliverableReview = {
      id: asId<'DeliverableReviewId'>(`DREV-${randomUUID()}`, 'Deliverable Review'),
      tenantId,
      deliverableItemId: item.id,
      reviewType: input.reviewType,
      subjectObjectId: item.governedOutputObjectId,
      ...(item.governedOutputVersion ? { subjectVersion: item.governedOutputVersion } : {}),
      reviewerPersonId: actorPersonId as DeliverableReview['reviewerPersonId'],
      reviewedAt: now(),
      outcome: input.outcome,
      ...(comments ? { comments } : {}),
      ...(evidenceRecordId ? { evidenceRecordId: evidenceRecordId as NonNullable<DeliverableReview['evidenceRecordId']> } : {})
    };
    try {
      await this.deliverables.recordReview(tenantId, review, this.audit(actorPersonId));
      return review;
    } catch (error) {
      return mapError(error);
    }
  }

  async approve(
    tenantId: TenantId,
    actorPersonId: string,
    input: { itemId: string; decisionId: string }
  ): Promise<DeliverableItem> {
    await this.requireManage(tenantId, actorPersonId);
    const item = await this.getItemWithOutput(tenantId, input.itemId);
    const decision = await this.requireAuthorityDecision(
      tenantId,
      required(input.decisionId, 'Approval Decision'),
      item.governedOutputObjectId,
      item.governedOutputVersion
    );
    const approval: DeliverableApproval = {
      id: asId<'DeliverableApprovalId'>(`DAPP-${randomUUID()}`, 'Deliverable Approval'),
      tenantId,
      deliverableItemId: item.id,
      decisionId: decision.id as DeliverableApproval['decisionId'],
      subjectObjectId: item.governedOutputObjectId,
      ...(item.governedOutputVersion ? { subjectVersion: item.governedOutputVersion } : {}),
      approvedAt: decision.decided_at.toISOString()
    };
    try {
      return await this.deliverables.approve(tenantId, approval, this.audit(actorPersonId));
    } catch (error) {
      return mapError(error);
    }
  }

  async issue(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      itemId: string;
      issueReference: string;
      issuePurpose: string;
      representationId?: string;
      responseRequired: boolean;
    }
  ): Promise<DeliverableItem> {
    await this.requireManage(tenantId, actorPersonId);
    const item = await this.getItemWithOutput(tenantId, input.itemId);
    const representationId = optional(input.representationId);
    const transmittal: Transmittal = {
      id: asId<'TransmittalId'>(`TR-${randomUUID()}`, 'Transmittal'),
      tenantId,
      deliverableItemId: item.id,
      issueReference: required(input.issueReference, 'Issue reference').toUpperCase(),
      issuePurpose: required(input.issuePurpose, 'Issue purpose').toUpperCase(),
      subjectObjectId: item.governedOutputObjectId,
      ...(item.governedOutputVersion ? { subjectVersion: item.governedOutputVersion } : {}),
      ...(representationId ? { representationId: representationId as NonNullable<Transmittal['representationId']> } : {}),
      issuedByPersonId: actorPersonId as Transmittal['issuedByPersonId'],
      issuedAt: now(),
      responseRequired: input.responseRequired
    };
    try {
      return await this.deliverables.issue(tenantId, transmittal, this.audit(actorPersonId));
    } catch (error) {
      return mapError(error);
    }
  }

  async addRecipient(
    tenantId: TenantId,
    actorPersonId: string,
    input: { transmittalId: string; recipientPartyId: string; responseRequired: boolean; dueAt?: string }
  ): Promise<TransmittalRecipient> {
    await this.requireManage(tenantId, actorPersonId);
    const dueAt = dateValue(input.dueAt, 'Recipient due date');
    const recipient: TransmittalRecipient = {
      id: asId<'TransmittalRecipientId'>(`TRR-${randomUUID()}`, 'Transmittal Recipient'),
      tenantId,
      transmittalId: required(input.transmittalId, 'Transmittal') as TransmittalRecipient['transmittalId'],
      recipientPartyId: required(input.recipientPartyId, 'Recipient Party') as TransmittalRecipient['recipientPartyId'],
      responseRequired: input.responseRequired,
      ...(dueAt ? { dueAt } : {})
    };
    try {
      await this.deliverables.addRecipient(tenantId, recipient, this.audit(actorPersonId));
      return recipient;
    } catch (error) {
      return mapError(error);
    }
  }

  async recordResponse(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      recipientId: string;
      outcome: RecipientResponseOutcome;
      comments?: string;
      evidenceRecordId?: string;
    }
  ): Promise<RecipientResponse> {
    await this.requireManage(tenantId, actorPersonId);
    if (!RESPONSE_OUTCOMES.has(input.outcome)) {
      throw new DeliverableCommandError('Recipient response outcome is not supported.', 'INVALID_INPUT');
    }
    const recipientId = required(input.recipientId, 'Transmittal Recipient');
    await this.requireRecipient(tenantId, recipientId);
    const comments = optional(input.comments);
    const evidenceRecordId = optional(input.evidenceRecordId);
    const response: RecipientResponse = {
      id: asId<'RecipientResponseId'>(`TRSP-${randomUUID()}`, 'Recipient Response'),
      tenantId,
      transmittalRecipientId: recipientId as RecipientResponse['transmittalRecipientId'],
      responderPersonId: actorPersonId as NonNullable<RecipientResponse['responderPersonId']>,
      outcome: input.outcome,
      ...(comments ? { comments } : {}),
      respondedAt: now(),
      ...(evidenceRecordId ? { evidenceRecordId: evidenceRecordId as NonNullable<RecipientResponse['evidenceRecordId']> } : {})
    };
    try {
      await this.deliverables.recordResponse(tenantId, response, this.audit(actorPersonId));
      return response;
    } catch (error) {
      return mapError(error);
    }
  }

  async accept(
    tenantId: TenantId,
    actorPersonId: string,
    input: { itemId: string; transmittalId: string }
  ): Promise<DeliverableItem> {
    await this.requireManage(tenantId, actorPersonId);
    try {
      return await this.deliverables.accept(
        tenantId,
        required(input.itemId, 'Deliverable Item') as DeliverableItem['id'],
        required(input.transmittalId, 'Transmittal') as Transmittal['id'],
        now(),
        this.audit(actorPersonId)
      );
    } catch (error) {
      return mapError(error);
    }
  }

  async createRework(
    tenantId: TenantId,
    actorPersonId: string,
    input: { itemId: string; triggerType: 'REVIEW' | 'DECISION' | 'RECIPIENT_RESPONSE'; triggerId: string; reason: string }
  ): Promise<DeliverableItem> {
    await this.requireManage(tenantId, actorPersonId);
    const item = await this.getItemWithOutput(tenantId, input.itemId);
    const rework: DeliverableRework = {
      id: asId<'DeliverableReworkId'>(`DRWK-${randomUUID()}`, 'Deliverable Rework'),
      tenantId,
      deliverableItemId: item.id,
      triggerType: input.triggerType,
      triggerId: required(input.triggerId, 'Rework trigger'),
      previousSubjectObjectId: item.governedOutputObjectId,
      ...(item.governedOutputVersion ? { previousSubjectVersion: item.governedOutputVersion } : {}),
      reason: required(input.reason, 'Rework reason'),
      createdAt: now()
    };
    try {
      return await this.deliverables.createRework(tenantId, rework, this.audit(actorPersonId));
    } catch (error) {
      return mapError(error);
    }
  }

  async createConsequence(
    tenantId: TenantId,
    actorPersonId: string,
    input: { itemId: string; consequenceType: string; targetObjectId?: string; targetVersion?: string; evidenceRecordId?: string }
  ): Promise<DeliverableConsequence> {
    await this.requireManage(tenantId, actorPersonId);
    const targetObjectId = optional(input.targetObjectId);
    const targetVersion = optional(input.targetVersion);
    const evidenceRecordId = optional(input.evidenceRecordId);
    const consequence: DeliverableConsequence = {
      id: asId<'DeliverableConsequenceId'>(`DCON-${randomUUID()}`, 'Deliverable Consequence'),
      tenantId,
      deliverableItemId: required(input.itemId, 'Deliverable Item') as DeliverableConsequence['deliverableItemId'],
      consequenceType: required(input.consequenceType, 'Consequence type').toUpperCase(),
      ...(targetObjectId ? { targetObjectId: targetObjectId as NonNullable<DeliverableConsequence['targetObjectId']> } : {}),
      ...(targetVersion ? { targetVersion } : {}),
      status: 'PENDING',
      ...(evidenceRecordId ? { evidenceRecordId: evidenceRecordId as NonNullable<DeliverableConsequence['evidenceRecordId']> } : {})
    };
    try {
      await this.deliverables.createConsequence(tenantId, consequence, this.audit(actorPersonId));
      return consequence;
    } catch (error) {
      return mapError(error);
    }
  }

  async applyConsequence(
    tenantId: TenantId,
    actorPersonId: string,
    consequenceId: string
  ): Promise<DeliverableConsequence> {
    await this.requireManage(tenantId, actorPersonId);
    try {
      return await this.deliverables.applyConsequence(
        tenantId,
        required(consequenceId, 'Deliverable Consequence') as DeliverableConsequence['id'],
        now(),
        this.audit(actorPersonId)
      );
    } catch (error) {
      return mapError(error);
    }
  }

  async close(tenantId: TenantId, actorPersonId: string, itemId: string): Promise<DeliverableItem> {
    await this.requireManage(tenantId, actorPersonId);
    try {
      return await this.deliverables.close(
        tenantId,
        required(itemId, 'Deliverable Item') as DeliverableItem['id'],
        now(),
        this.audit(actorPersonId)
      );
    } catch (error) {
      return mapError(error);
    }
  }

  private audit(actorPersonId: string) {
    return { actorPersonId, correlationId: 'DELIVERABLE-WORKSPACE' };
  }

  private async requireManage(tenantId: TenantId, actorPersonId: string): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.DELIVERABLE_MANAGE,
      { scopeType: 'TENANT' }
    );
    if (!evaluation.allowed) {
      throw new DeliverableCommandError(evaluation.reason, 'PERMISSION_DENIED');
    }
  }

  private async requireRequirement(tenantId: TenantId, id: string): Promise<RequirementLookupRow> {
    const [rows] = await this.pool.query<RequirementLookupRow[]>(
      `SELECT id, context_object_id, deliverable_type, authoring_mode, status
         FROM deliverable_requirements WHERE tenant_id = ? AND id = ?`,
      [tenantId, required(id, 'Deliverable Requirement')]
    );
    const row = rows[0];
    if (!row) throw new DeliverableCommandError('Deliverable Requirement was not found in tenant.', 'NOT_FOUND');
    if (row.authoring_mode !== 'NATIVE') {
      throw new DeliverableCommandError(
        'This NuBlox command surface currently supports NATIVE Deliverable authoring only.',
        'INVALID_INPUT'
      );
    }
    return row;
  }

  private async getItemWithOutput(tenantId: TenantId, id: string): Promise<
    DeliverableItem & { governedOutputObjectId: NonNullable<DeliverableItem['governedOutputObjectId']> }
  > {
    const item = await this.deliverables.getItem(
      tenantId,
      required(id, 'Deliverable Item') as DeliverableItem['id']
    );
    if (!item.governedOutputObjectId) {
      throw new DeliverableCommandError(
        'Deliverable Item requires an exact governed output before this action.',
        'INVALID_INPUT'
      );
    }
    return item as DeliverableItem & {
      governedOutputObjectId: NonNullable<DeliverableItem['governedOutputObjectId']>;
    };
  }

  private async requireAuthorityDecision(
    tenantId: TenantId,
    decisionId: string,
    subjectObjectId: string,
    subjectVersion?: string
  ): Promise<DecisionAuthorityRow> {
    const [rows] = await this.pool.query<DecisionAuthorityRow[]>(
      `SELECT d.id, d.decision_type, d.subject_object_id, d.subject_version, d.outcome,
              d.decided_at, d.authority_grant_id, ag.status AS grant_status,
              ag.effective_from, ag.effective_to
         FROM decisions d
         LEFT JOIN authority_grants ag
           ON ag.tenant_id = d.tenant_id AND ag.id = d.authority_grant_id
        WHERE d.tenant_id = ? AND d.id = ?`,
      [tenantId, decisionId]
    );
    const row = rows[0];
    if (!row) throw new DeliverableCommandError('Approval Decision was not found in tenant.', 'NOT_FOUND');
    if (
      row.decision_type !== 'DELIVERABLE_APPROVAL' ||
      row.subject_object_id !== subjectObjectId ||
      row.subject_version !== (subjectVersion ?? null) ||
      row.outcome !== 'APPROVED'
    ) {
      throw new DeliverableCommandError(
        'Approval Decision does not govern the exact Deliverable output/version.',
        'INVALID_INPUT'
      );
    }
    if (!row.authority_grant_id || row.grant_status !== 'ACTIVE' || !row.effective_from) {
      throw new DeliverableCommandError(
        'Deliverable approval requires an active Authority Grant.',
        'INVALID_INPUT'
      );
    }
    const decidedAt = row.decided_at.getTime();
    if (
      decidedAt < row.effective_from.getTime() ||
      (row.effective_to && decidedAt > row.effective_to.getTime())
    ) {
      throw new DeliverableCommandError(
        'Deliverable approval Decision was made outside the Authority Grant effectivity period.',
        'INVALID_INPUT'
      );
    }
    return row;
  }

  private async requireRecipient(tenantId: TenantId, recipientId: string): Promise<void> {
    const [rows] = await this.pool.query<RecipientLookupRow[]>(
      'SELECT recipient_party_id FROM transmittal_recipients WHERE tenant_id = ? AND id = ?',
      [tenantId, recipientId]
    );
    if (!rows[0]) {
      throw new DeliverableCommandError('Transmittal Recipient was not found in tenant.', 'NOT_FOUND');
    }
  }
}
