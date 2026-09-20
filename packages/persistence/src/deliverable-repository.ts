import {
  bindDeliverableOutput,
  closeDeliverable,
  createDeliverableApproval,
  createDeliverableConsequence,
  createDeliverableItem,
  createDeliverableRequirement,
  createDeliverableResponsibility,
  createDeliverableReview,
  createDeliverableRework,
  createRecipientResponse,
  createTransmittal,
  createTransmittalRecipient,
  markDeliverableAccepted,
  markDeliverableApproved,
  markDeliverableConsequenceApplied,
  markDeliverableIssued,
  markDeliverableRework,
  startDeliverable,
  submitDeliverableForReview,
  type CanonicalObjectIdentity,
  type Decision,
  type DeliverableApproval,
  type DeliverableConsequence,
  type DeliverableItem,
  type DeliverableRequirement,
  type DeliverableResponsibility,
  type DeliverableReview,
  type DeliverableRework,
  type FunctionDefinition,
  type FunctionalDeployment,
  type Organisation,
  type OrganisationUnit,
  type Party,
  type Person,
  type Position,
  type ProcessDefinition,
  type RecipientResponse,
  type SubFunctionDefinition,
  type TaskDefinition,
  type TenantId,
  type Transmittal,
  type TransmittalRecipient
} from '@nublox/kernel';
import type {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket
} from 'mysql2/promise';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';
import type { AuditContext } from './repository.js';

interface RequirementRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  code: string;
  title: string;
  deliverable_type: string;
  description: string;
  function_id: string | null;
  sub_function_id: string | null;
  process_definition_id: string | null;
  task_definition_id: string | null;
  functional_deployment_id: string | null;
  source_requirement_object_id: string | null;
  source_requirement_version: string | null;
  context_object_id: string;
  authoring_mode: DeliverableRequirement['authoringMode'];
  required_representation_types: string | string[];
  planned_due_at: Date | null;
  acceptance_required: number | boolean;
  status: DeliverableRequirement['status'];
}

interface ItemRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  canonical_object_id: string;
  requirement_id: string;
  context_object_id: string;
  functional_deployment_id: string | null;
  code: string;
  title: string;
  deliverable_type: string;
  status: DeliverableItem['status'];
  planned_at: Date | null;
  forecast_at: Date | null;
  actual_at: Date | null;
  governed_output_object_id: string | null;
  governed_output_version: string | null;
  configuration_item_id: string | null;
  baseline_id: string | null;
  linked_change_id: string | null;
  row_version: number;
}

interface TransmittalRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  deliverable_item_id: string;
  issue_reference: string;
  issue_purpose: string;
  subject_object_id: string;
  subject_version: string | null;
  representation_id: string | null;
  issued_by_person_id: string;
  issued_at: Date;
  response_required: number | boolean;
}

interface RecipientRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  transmittal_id: string;
  recipient_party_id: string;
  response_required: number | boolean;
  due_at: Date | null;
}

interface ResponseRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  transmittal_recipient_id: string;
  responder_person_id: string | null;
  outcome: RecipientResponse['outcome'];
  comments: string | null;
  responded_at: Date;
  evidence_record_id: string | null;
}

interface ConsequenceRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  deliverable_item_id: string;
  consequence_type: string;
  target_object_id: string | null;
  target_version: string | null;
  status: DeliverableConsequence['status'];
  applied_at: Date | null;
  evidence_record_id: string | null;
  row_version: number;
}

interface CanonicalObjectRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  object_type: string;
  stable_key: string;
  created_at: Date;
}

interface PersonRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  party_id: string;
  legal_name: string;
  preferred_name: string | null;
  status: Person['status'];
}

interface PartyRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  kind: Party['kind'];
  display_name: string;
  status: Party['status'];
}

interface FunctionRow extends RowDataPacket {
  id: string;
  code: string;
  name: string;
  status: FunctionDefinition['status'];
}

interface SubFunctionRow extends RowDataPacket {
  id: string;
  function_id: string;
  code: string;
  name: string;
  sequence: number;
  status: SubFunctionDefinition['status'];
}

interface ProcessRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  function_id: string;
  sub_function_id: string | null;
  code: string;
  name: string;
  purpose: string;
  status: ProcessDefinition['status'];
}

interface TaskRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  process_definition_id: string;
  functional_activity_id: string | null;
  code: string;
  name: string;
  instructions: string | null;
  sequence: number;
  status: TaskDefinition['status'];
}

interface DeploymentRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  function_id: string;
  sub_function_id: string | null;
  organisation_id: string;
  organisation_unit_id: string | null;
  context_type: FunctionalDeployment['contextType'];
  context_object_id: string | null;
  scope_description: string;
  effective_from: Date;
  effective_to: Date | null;
  status: FunctionalDeployment['status'];
}

interface DecisionRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  decision_type: string;
  subject_object_id: string;
  subject_version: string | null;
  outcome: string;
  reason: string;
  decider_person_id: string;
  authority_grant_id: string | null;
  decided_at: Date;
}

function databaseDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date/time value: ${value}`);
  return date;
}

function jsonArray(value: string | string[]): string[] {
  if (Array.isArray(value)) return value.map(String);
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) throw new Error('Expected JSON array.');
  return parsed.map(String);
}

async function writeAudit(
  connection: PoolConnection,
  tenantId: string,
  entityType: string,
  entityId: string,
  action: string,
  audit: AuditContext,
  payload: unknown
): Promise<void> {
  await connection.execute(
    `INSERT INTO kernel_audit_entries
      (tenant_id, entity_type, entity_id, action, actor_person_id, correlation_id, payload)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      tenantId,
      entityType,
      entityId,
      action,
      audit.actorPersonId ?? null,
      audit.correlationId ?? null,
      JSON.stringify(payload)
    ]
  );
  await writeOutboxEvent(connection, {
    tenantId,
    aggregateType: entityType,
    aggregateId: entityId,
    eventType: `${entityType}.${action}`,
    payload
  });
}

function mapRequirement(row: RequirementRow): DeliverableRequirement {
  return {
    id: row.id as DeliverableRequirement['id'],
    tenantId: row.tenant_id as TenantId,
    code: row.code,
    title: row.title,
    deliverableType: row.deliverable_type,
    description: row.description,
    ...(row.function_id ? { functionId: row.function_id as NonNullable<DeliverableRequirement['functionId']> } : {}),
    ...(row.sub_function_id ? { subFunctionId: row.sub_function_id as NonNullable<DeliverableRequirement['subFunctionId']> } : {}),
    ...(row.process_definition_id ? { processDefinitionId: row.process_definition_id as NonNullable<DeliverableRequirement['processDefinitionId']> } : {}),
    ...(row.task_definition_id ? { taskDefinitionId: row.task_definition_id as NonNullable<DeliverableRequirement['taskDefinitionId']> } : {}),
    ...(row.functional_deployment_id ? { functionalDeploymentId: row.functional_deployment_id as NonNullable<DeliverableRequirement['functionalDeploymentId']> } : {}),
    ...(row.source_requirement_object_id ? { sourceRequirementObjectId: row.source_requirement_object_id as NonNullable<DeliverableRequirement['sourceRequirementObjectId']> } : {}),
    ...(row.source_requirement_version ? { sourceRequirementVersion: row.source_requirement_version } : {}),
    contextObjectId: row.context_object_id as DeliverableRequirement['contextObjectId'],
    authoringMode: row.authoring_mode,
    requiredRepresentationTypes: Object.freeze(jsonArray(row.required_representation_types)),
    ...(row.planned_due_at ? { plannedDueAt: row.planned_due_at.toISOString() } : {}),
    acceptanceRequired: Boolean(row.acceptance_required),
    status: row.status
  };
}

function mapItem(row: ItemRow): DeliverableItem {
  return {
    id: row.id as DeliverableItem['id'],
    tenantId: row.tenant_id as TenantId,
    canonicalObjectId: row.canonical_object_id as DeliverableItem['canonicalObjectId'],
    requirementId: row.requirement_id as DeliverableItem['requirementId'],
    contextObjectId: row.context_object_id as DeliverableItem['contextObjectId'],
    ...(row.functional_deployment_id ? { functionalDeploymentId: row.functional_deployment_id as NonNullable<DeliverableItem['functionalDeploymentId']> } : {}),
    code: row.code,
    title: row.title,
    deliverableType: row.deliverable_type,
    status: row.status,
    ...(row.planned_at ? { plannedAt: row.planned_at.toISOString() } : {}),
    ...(row.forecast_at ? { forecastAt: row.forecast_at.toISOString() } : {}),
    ...(row.actual_at ? { actualAt: row.actual_at.toISOString() } : {}),
    ...(row.governed_output_object_id ? { governedOutputObjectId: row.governed_output_object_id as NonNullable<DeliverableItem['governedOutputObjectId']> } : {}),
    ...(row.governed_output_version ? { governedOutputVersion: row.governed_output_version } : {}),
    ...(row.configuration_item_id ? { configurationItemId: row.configuration_item_id as NonNullable<DeliverableItem['configurationItemId']> } : {}),
    ...(row.baseline_id ? { baselineId: row.baseline_id as NonNullable<DeliverableItem['baselineId']> } : {}),
    ...(row.linked_change_id ? { linkedChangeId: row.linked_change_id as NonNullable<DeliverableItem['linkedChangeId']> } : {})
  };
}

function mapTransmittal(row: TransmittalRow): Transmittal {
  return {
    id: row.id as Transmittal['id'],
    tenantId: row.tenant_id as TenantId,
    deliverableItemId: row.deliverable_item_id as Transmittal['deliverableItemId'],
    issueReference: row.issue_reference,
    issuePurpose: row.issue_purpose,
    subjectObjectId: row.subject_object_id as Transmittal['subjectObjectId'],
    ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
    ...(row.representation_id ? { representationId: row.representation_id as NonNullable<Transmittal['representationId']> } : {}),
    issuedByPersonId: row.issued_by_person_id as Transmittal['issuedByPersonId'],
    issuedAt: row.issued_at.toISOString(),
    responseRequired: Boolean(row.response_required)
  };
}

function mapRecipient(row: RecipientRow): TransmittalRecipient {
  return {
    id: row.id as TransmittalRecipient['id'],
    tenantId: row.tenant_id as TenantId,
    transmittalId: row.transmittal_id as TransmittalRecipient['transmittalId'],
    recipientPartyId: row.recipient_party_id as TransmittalRecipient['recipientPartyId'],
    responseRequired: Boolean(row.response_required),
    ...(row.due_at ? { dueAt: row.due_at.toISOString() } : {})
  };
}

function mapResponse(row: ResponseRow): RecipientResponse {
  return {
    id: row.id as RecipientResponse['id'],
    tenantId: row.tenant_id as TenantId,
    transmittalRecipientId: row.transmittal_recipient_id as RecipientResponse['transmittalRecipientId'],
    ...(row.responder_person_id ? { responderPersonId: row.responder_person_id as NonNullable<RecipientResponse['responderPersonId']> } : {}),
    outcome: row.outcome,
    ...(row.comments ? { comments: row.comments } : {}),
    respondedAt: row.responded_at.toISOString(),
    ...(row.evidence_record_id ? { evidenceRecordId: row.evidence_record_id as NonNullable<RecipientResponse['evidenceRecordId']> } : {})
  };
}

function mapConsequence(row: ConsequenceRow): DeliverableConsequence {
  return {
    id: row.id as DeliverableConsequence['id'],
    tenantId: row.tenant_id as TenantId,
    deliverableItemId: row.deliverable_item_id as DeliverableConsequence['deliverableItemId'],
    consequenceType: row.consequence_type,
    ...(row.target_object_id ? { targetObjectId: row.target_object_id as NonNullable<DeliverableConsequence['targetObjectId']> } : {}),
    ...(row.target_version ? { targetVersion: row.target_version } : {}),
    status: row.status,
    ...(row.applied_at ? { appliedAt: row.applied_at.toISOString() } : {}),
    ...(row.evidence_record_id ? { evidenceRecordId: row.evidence_record_id as NonNullable<DeliverableConsequence['evidenceRecordId']> } : {})
  };
}

function mapObject(row: CanonicalObjectRow): CanonicalObjectIdentity {
  return {
    id: row.id as CanonicalObjectIdentity['id'],
    tenantId: row.tenant_id as TenantId,
    objectType: row.object_type,
    stableKey: row.stable_key,
    createdAt: row.created_at.toISOString()
  };
}

function mapPerson(row: PersonRow): Person {
  return {
    id: row.id as Person['id'],
    tenantId: row.tenant_id as TenantId,
    partyId: row.party_id as Person['partyId'],
    legalName: row.legal_name,
    ...(row.preferred_name ? { preferredName: row.preferred_name } : {}),
    status: row.status
  };
}

function mapParty(row: PartyRow): Party {
  return {
    id: row.id as Party['id'],
    tenantId: row.tenant_id as TenantId,
    kind: row.kind,
    displayName: row.display_name,
    status: row.status
  };
}

function mapFunction(row: FunctionRow): FunctionDefinition {
  return { id: row.id as FunctionDefinition['id'], code: row.code, name: row.name, status: row.status };
}

function mapSubFunction(row: SubFunctionRow): SubFunctionDefinition {
  return {
    id: row.id as SubFunctionDefinition['id'],
    functionId: row.function_id as SubFunctionDefinition['functionId'],
    code: row.code,
    name: row.name,
    sequence: Number(row.sequence),
    status: row.status
  };
}

function mapProcess(row: ProcessRow): ProcessDefinition {
  return {
    id: row.id as ProcessDefinition['id'],
    tenantId: row.tenant_id as TenantId,
    functionId: row.function_id as ProcessDefinition['functionId'],
    ...(row.sub_function_id ? { subFunctionId: row.sub_function_id as NonNullable<ProcessDefinition['subFunctionId']> } : {}),
    code: row.code,
    name: row.name,
    purpose: row.purpose,
    status: row.status
  };
}

function mapTask(row: TaskRow): TaskDefinition {
  return {
    id: row.id as TaskDefinition['id'],
    tenantId: row.tenant_id as TenantId,
    processDefinitionId: row.process_definition_id as TaskDefinition['processDefinitionId'],
    ...(row.functional_activity_id ? { functionalActivityId: row.functional_activity_id as NonNullable<TaskDefinition['functionalActivityId']> } : {}),
    code: row.code,
    name: row.name,
    ...(row.instructions ? { instructions: row.instructions } : {}),
    sequence: Number(row.sequence),
    status: row.status
  };
}

function mapDeployment(row: DeploymentRow): FunctionalDeployment {
  return {
    id: row.id as FunctionalDeployment['id'],
    tenantId: row.tenant_id as TenantId,
    functionId: row.function_id as FunctionalDeployment['functionId'],
    ...(row.sub_function_id ? { subFunctionId: row.sub_function_id as NonNullable<FunctionalDeployment['subFunctionId']> } : {}),
    organisationId: row.organisation_id as FunctionalDeployment['organisationId'],
    ...(row.organisation_unit_id ? { organisationUnitId: row.organisation_unit_id as NonNullable<FunctionalDeployment['organisationUnitId']> } : {}),
    contextType: row.context_type,
    ...(row.context_object_id ? { contextObjectId: row.context_object_id as NonNullable<FunctionalDeployment['contextObjectId']> } : {}),
    scopeDescription: row.scope_description,
    effectiveFrom: row.effective_from.toISOString(),
    ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
    status: row.status
  };
}

function mapDecision(row: DecisionRow): Decision {
  return {
    id: row.id as Decision['id'],
    tenantId: row.tenant_id as TenantId,
    decisionType: row.decision_type,
    subjectObjectId: row.subject_object_id as Decision['subjectObjectId'],
    ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
    outcome: row.outcome,
    reason: row.reason,
    deciderPersonId: row.decider_person_id as Decision['deciderPersonId'],
    ...(row.authority_grant_id ? { authorityGrantId: row.authority_grant_id as NonNullable<Decision['authorityGrantId']> } : {}),
    decidedAt: row.decided_at.toISOString()
  };
}

export class MySqlDeliverableRepository {
  constructor(private readonly pool: Pool) {}

  async createRequirement(
    tenantId: TenantId,
    requirement: DeliverableRequirement,
    audit: AuditContext = {}
  ): Promise<void> {
    if (requirement.tenantId !== tenantId) throw new Error('Persistence operation crossed tenant boundary.');

    const [context, fn, sf, process, task, deployment, source] = await Promise.all([
      this.requireObject(tenantId, requirement.contextObjectId),
      requirement.functionId ? this.requireFunction(requirement.functionId) : Promise.resolve(undefined),
      requirement.subFunctionId ? this.requireSubFunction(requirement.subFunctionId) : Promise.resolve(undefined),
      requirement.processDefinitionId ? this.requireProcess(tenantId, requirement.processDefinitionId) : Promise.resolve(undefined),
      requirement.taskDefinitionId ? this.requireTask(tenantId, requirement.taskDefinitionId) : Promise.resolve(undefined),
      requirement.functionalDeploymentId ? this.requireDeployment(tenantId, requirement.functionalDeploymentId) : Promise.resolve(undefined),
      requirement.sourceRequirementObjectId ? this.requireObject(tenantId, requirement.sourceRequirementObjectId) : Promise.resolve(undefined)
    ]);

    createDeliverableRequirement(requirement, context, {
      ...(fn ? { functionDefinition: fn } : {}),
      ...(sf ? { subFunction: sf } : {}),
      ...(process ? { process } : {}),
      ...(task ? { task } : {}),
      ...(deployment ? { deployment } : {}),
      ...(source ? { sourceRequirement: source } : {})
    });

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO deliverable_requirements
          (id, tenant_id, code, title, deliverable_type, description, function_id,
           sub_function_id, process_definition_id, task_definition_id,
           functional_deployment_id, source_requirement_object_id,
           source_requirement_version, context_object_id, authoring_mode,
           required_representation_types, planned_due_at, acceptance_required,
           status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          requirement.id, requirement.tenantId, requirement.code, requirement.title,
          requirement.deliverableType, requirement.description,
          requirement.functionId ?? null, requirement.subFunctionId ?? null,
          requirement.processDefinitionId ?? null, requirement.taskDefinitionId ?? null,
          requirement.functionalDeploymentId ?? null,
          requirement.sourceRequirementObjectId ?? null,
          requirement.sourceRequirementVersion ?? null, requirement.contextObjectId,
          requirement.authoringMode, JSON.stringify(requirement.requiredRepresentationTypes),
          requirement.plannedDueAt ? databaseDate(requirement.plannedDueAt) : null,
          requirement.acceptanceRequired, requirement.status,
          audit.actorPersonId ?? null, audit.actorPersonId ?? null
        ]
      );
      await writeAudit(connection, tenantId, 'DELIVERABLE_REQUIREMENT', requirement.id, 'CREATED', audit, requirement);
    });
  }

  async createItem(
    tenantId: TenantId,
    item: DeliverableItem,
    audit: AuditContext = {}
  ): Promise<void> {
    if (item.tenantId !== tenantId) throw new Error('Persistence operation crossed tenant boundary.');
    const [object, requirement, context, deployment] = await Promise.all([
      this.requireObject(tenantId, item.canonicalObjectId),
      this.requireRequirement(tenantId, item.requirementId),
      this.requireObject(tenantId, item.contextObjectId),
      item.functionalDeploymentId ? this.requireDeployment(tenantId, item.functionalDeploymentId) : Promise.resolve(undefined)
    ]);
    createDeliverableItem(item, object, requirement, context, deployment);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO deliverable_items
          (id, tenant_id, canonical_object_id, requirement_id, context_object_id,
           functional_deployment_id, code, title, deliverable_type, status,
           planned_at, forecast_at, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id, item.tenantId, item.canonicalObjectId, item.requirementId,
          item.contextObjectId, item.functionalDeploymentId ?? null, item.code,
          item.title, item.deliverableType, item.status,
          item.plannedAt ? databaseDate(item.plannedAt) : null,
          item.forecastAt ? databaseDate(item.forecastAt) : null,
          audit.actorPersonId ?? null, audit.actorPersonId ?? null
        ]
      );
      await this.insertHistory(connection, item, item.plannedAt ?? new Date().toISOString(), 'Deliverable Item created.', audit);
      await writeAudit(connection, tenantId, 'DELIVERABLE_ITEM', item.id, 'CREATED', audit, item);
    });
  }

  async startItem(
    tenantId: TenantId,
    itemId: DeliverableItem['id'],
    at: string,
    audit: AuditContext = {}
  ): Promise<DeliverableItem> {
    return this.transitionItem(tenantId, itemId, at, 'STARTED', 'Deliverable execution started.', startDeliverable, audit);
  }

  async bindOutput(
    tenantId: TenantId,
    itemId: DeliverableItem['id'],
    outputObjectId: CanonicalObjectIdentity['id'],
    outputVersion: string | undefined,
    at: string,
    audit: AuditContext = {}
  ): Promise<DeliverableItem> {
    databaseDate(at);
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireItemForUpdate(connection, tenantId, itemId);
      const current = mapItem(row);
      const output = await this.requireObject(tenantId, outputObjectId, connection);
      const next = bindDeliverableOutput(current, output, outputVersion);
      await this.updateItem(connection, row, next, audit);
      await this.insertHistory(connection, next, at, 'Governed output bound to Deliverable Item.', audit);
      await writeAudit(connection, tenantId, 'DELIVERABLE_ITEM', itemId, 'OUTPUT_BOUND', audit, {
        outputObjectId,
        outputVersion: outputVersion ?? null
      });
      return next;
    });
  }

  async submitForReview(
    tenantId: TenantId,
    itemId: DeliverableItem['id'],
    at: string,
    audit: AuditContext = {}
  ): Promise<DeliverableItem> {
    return this.transitionItem(
      tenantId, itemId, at, 'SUBMITTED_FOR_REVIEW',
      'Deliverable submitted for review.', submitDeliverableForReview, audit
    );
  }

  async addResponsibility(
    tenantId: TenantId,
    responsibility: DeliverableResponsibility,
    audit: AuditContext = {}
  ): Promise<void> {
    if (responsibility.tenantId !== tenantId) throw new Error('Persistence operation crossed tenant boundary.');
    const [item, principal] = await Promise.all([
      this.requireItem(tenantId, responsibility.deliverableItemId),
      this.requirePrincipal(tenantId, responsibility.principalType, responsibility.principalId)
    ]);
    createDeliverableResponsibility(responsibility, item, principal);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO deliverable_responsibilities
          (id, tenant_id, deliverable_item_id, principal_type, principal_id,
           responsibility_role, effective_from, effective_to, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          responsibility.id, responsibility.tenantId, responsibility.deliverableItemId,
          responsibility.principalType, responsibility.principalId,
          responsibility.responsibilityRole, databaseDate(responsibility.effectiveFrom),
          responsibility.effectiveTo ? databaseDate(responsibility.effectiveTo) : null,
          responsibility.status, audit.actorPersonId ?? null, audit.actorPersonId ?? null
        ]
      );
      await writeAudit(connection, tenantId, 'DELIVERABLE_RESPONSIBILITY', responsibility.id, 'CREATED', audit, responsibility);
    });
  }

  async recordReview(
    tenantId: TenantId,
    review: DeliverableReview,
    audit: AuditContext = {}
  ): Promise<void> {
    if (review.tenantId !== tenantId) throw new Error('Persistence operation crossed tenant boundary.');
    const [item, subject, reviewer] = await Promise.all([
      this.requireItem(tenantId, review.deliverableItemId),
      this.requireObject(tenantId, review.subjectObjectId),
      this.requirePerson(tenantId, review.reviewerPersonId)
    ]);
    if (review.evidenceRecordId) await this.requireEvidence(tenantId, review.evidenceRecordId);
    createDeliverableReview(review, item, subject, reviewer);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO deliverable_reviews
          (id, tenant_id, deliverable_item_id, review_type, subject_object_id,
           subject_version, reviewer_person_id, reviewed_at, outcome, comments,
           evidence_record_id, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          review.id, review.tenantId, review.deliverableItemId, review.reviewType,
          review.subjectObjectId, review.subjectVersion ?? null, review.reviewerPersonId,
          databaseDate(review.reviewedAt), review.outcome, review.comments ?? null,
          review.evidenceRecordId ?? null, audit.actorPersonId ?? null
        ]
      );
      await writeAudit(connection, tenantId, 'DELIVERABLE_REVIEW', review.id, 'RECORDED', audit, review);
    });
  }

  async approve(
    tenantId: TenantId,
    approval: DeliverableApproval,
    audit: AuditContext = {}
  ): Promise<DeliverableItem> {
    if (approval.tenantId !== tenantId) throw new Error('Persistence operation crossed tenant boundary.');

    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireItemForUpdate(connection, tenantId, approval.deliverableItemId);
      const current = mapItem(row);
      const [subject, decision] = await Promise.all([
        this.requireObject(tenantId, approval.subjectObjectId, connection),
        this.requireDecision(tenantId, approval.decisionId, connection)
      ]);
      createDeliverableApproval(approval, current, subject, decision);
      const next = markDeliverableApproved(current, approval);

      await connection.execute(
        `INSERT INTO deliverable_approvals
          (id, tenant_id, deliverable_item_id, decision_id, subject_object_id,
           subject_version, approved_at, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          approval.id, approval.tenantId, approval.deliverableItemId, approval.decisionId,
          approval.subjectObjectId, approval.subjectVersion ?? null,
          databaseDate(approval.approvedAt), audit.actorPersonId ?? null
        ]
      );
      await this.updateItem(connection, row, next, audit);
      await this.insertHistory(connection, next, approval.approvedAt, 'Deliverable approved by immutable Decision.', audit);
      await writeAudit(connection, tenantId, 'DELIVERABLE_ITEM', current.id, 'APPROVED', audit, approval);
      return next;
    });
  }

  async issue(
    tenantId: TenantId,
    transmittal: Transmittal,
    audit: AuditContext = {}
  ): Promise<DeliverableItem> {
    if (transmittal.tenantId !== tenantId) throw new Error('Persistence operation crossed tenant boundary.');

    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireItemForUpdate(connection, tenantId, transmittal.deliverableItemId);
      const current = mapItem(row);
      const [subject, issuer] = await Promise.all([
        this.requireObject(tenantId, transmittal.subjectObjectId, connection),
        this.requirePerson(tenantId, transmittal.issuedByPersonId, connection)
      ]);
      if (transmittal.representationId) {
        await this.validateRepresentationExactSubject(
          connection, tenantId, transmittal.representationId,
          transmittal.subjectObjectId, transmittal.subjectVersion
        );
      }
      createTransmittal(transmittal, current, subject, issuer);
      const next = markDeliverableIssued(current, transmittal);

      await connection.execute(
        `INSERT INTO transmittals
          (id, tenant_id, deliverable_item_id, issue_reference, issue_purpose,
           subject_object_id, subject_version, representation_id, issued_by_person_id,
           issued_at, response_required, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transmittal.id, transmittal.tenantId, transmittal.deliverableItemId,
          transmittal.issueReference, transmittal.issuePurpose, transmittal.subjectObjectId,
          transmittal.subjectVersion ?? null, transmittal.representationId ?? null,
          transmittal.issuedByPersonId, databaseDate(transmittal.issuedAt),
          transmittal.responseRequired, audit.actorPersonId ?? null
        ]
      );
      await this.updateItem(connection, row, next, audit);
      await this.insertHistory(connection, next, transmittal.issuedAt, `Issued as ${transmittal.issueReference} for ${transmittal.issuePurpose}.`, audit);
      await writeAudit(connection, tenantId, 'TRANSMITTAL', transmittal.id, 'ISSUED', audit, transmittal);
      return next;
    });
  }

  async addRecipient(
    tenantId: TenantId,
    recipient: TransmittalRecipient,
    audit: AuditContext = {}
  ): Promise<void> {
    if (recipient.tenantId !== tenantId) throw new Error('Persistence operation crossed tenant boundary.');
    const [transmittal, party] = await Promise.all([
      this.requireTransmittal(tenantId, recipient.transmittalId),
      this.requireParty(tenantId, recipient.recipientPartyId)
    ]);
    createTransmittalRecipient(recipient, transmittal, party);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO transmittal_recipients
          (id, tenant_id, transmittal_id, recipient_party_id, response_required,
           due_at, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          recipient.id, recipient.tenantId, recipient.transmittalId,
          recipient.recipientPartyId, recipient.responseRequired,
          recipient.dueAt ? databaseDate(recipient.dueAt) : null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(connection, tenantId, 'TRANSMITTAL_RECIPIENT', recipient.id, 'ADDED', audit, recipient);
    });
  }

  async recordResponse(
    tenantId: TenantId,
    response: RecipientResponse,
    audit: AuditContext = {}
  ): Promise<void> {
    if (response.tenantId !== tenantId) throw new Error('Persistence operation crossed tenant boundary.');
    const [recipient, responder] = await Promise.all([
      this.requireRecipient(tenantId, response.transmittalRecipientId),
      response.responderPersonId ? this.requirePerson(tenantId, response.responderPersonId) : Promise.resolve(undefined)
    ]);
    if (response.evidenceRecordId) await this.requireEvidence(tenantId, response.evidenceRecordId);
    createRecipientResponse(response, recipient, responder);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO recipient_responses
          (id, tenant_id, transmittal_recipient_id, responder_person_id,
           outcome, comments, responded_at, evidence_record_id, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          response.id, response.tenantId, response.transmittalRecipientId,
          response.responderPersonId ?? null, response.outcome, response.comments ?? null,
          databaseDate(response.respondedAt), response.evidenceRecordId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(connection, tenantId, 'RECIPIENT_RESPONSE', response.id, 'RECORDED', audit, response);
    });
  }

  async accept(
    tenantId: TenantId,
    itemId: DeliverableItem['id'],
    transmittalId: Transmittal['id'],
    at: string,
    audit: AuditContext = {}
  ): Promise<DeliverableItem> {
    databaseDate(at);
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireItemForUpdate(connection, tenantId, itemId);
      const current = mapItem(row);
      const [requirement, transmittal, recipients, responses] = await Promise.all([
        this.requireRequirement(tenantId, current.requirementId, connection),
        this.requireTransmittal(tenantId, transmittalId, connection),
        this.listRecipients(connection, tenantId, transmittalId),
        this.listResponsesForTransmittal(connection, tenantId, transmittalId)
      ]);
      const next = markDeliverableAccepted(current, requirement, transmittal, recipients, responses);
      await this.updateItem(connection, row, next, audit);
      await this.insertHistory(connection, next, at, 'Mandatory recipient acceptance complete.', audit);
      await writeAudit(connection, tenantId, 'DELIVERABLE_ITEM', itemId, 'ACCEPTED', audit, {
        transmittalId,
        responseIds: responses.map((response) => response.id)
      });
      return next;
    });
  }

  async createRework(
    tenantId: TenantId,
    rework: DeliverableRework,
    audit: AuditContext = {}
  ): Promise<DeliverableItem> {
    if (rework.tenantId !== tenantId) throw new Error('Persistence operation crossed tenant boundary.');
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireItemForUpdate(connection, tenantId, rework.deliverableItemId);
      const current = mapItem(row);
      const previous = await this.requireObject(tenantId, rework.previousSubjectObjectId, connection);
      await this.requireReworkTrigger(connection, tenantId, current.id, rework.triggerType, rework.triggerId);
      if (rework.workItemId) await this.requireWork(connection, tenantId, rework.workItemId);
      createDeliverableRework(rework, current, previous);
      const next = markDeliverableRework(current, rework);

      await connection.execute(
        `INSERT INTO deliverable_rework
          (id, tenant_id, deliverable_item_id, trigger_type, trigger_id,
           previous_subject_object_id, previous_subject_version, reason,
           work_item_id, created_at, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          rework.id, rework.tenantId, rework.deliverableItemId, rework.triggerType,
          rework.triggerId, rework.previousSubjectObjectId,
          rework.previousSubjectVersion ?? null, rework.reason,
          rework.workItemId ?? null, databaseDate(rework.createdAt),
          audit.actorPersonId ?? null
        ]
      );
      await this.updateItem(connection, row, next, audit);
      await this.insertHistory(connection, next, rework.createdAt, `Rework required: ${rework.reason}`, audit);
      await writeAudit(connection, tenantId, 'DELIVERABLE_REWORK', rework.id, 'CREATED', audit, rework);
      return next;
    });
  }

  async close(
    tenantId: TenantId,
    itemId: DeliverableItem['id'],
    actualAt: string,
    audit: AuditContext = {}
  ): Promise<DeliverableItem> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireItemForUpdate(connection, tenantId, itemId);
      const current = mapItem(row);
      const requirement = await this.requireRequirement(tenantId, current.requirementId, connection);
      const next = closeDeliverable(current, requirement, actualAt);
      await this.updateItem(connection, row, next, audit);
      await this.insertHistory(connection, next, actualAt, 'Deliverable obligation closed.', audit);
      await writeAudit(connection, tenantId, 'DELIVERABLE_ITEM', itemId, 'CLOSED', audit, next);
      return next;
    });
  }

  async createConsequence(
    tenantId: TenantId,
    consequence: DeliverableConsequence,
    audit: AuditContext = {}
  ): Promise<void> {
    if (consequence.tenantId !== tenantId) throw new Error('Persistence operation crossed tenant boundary.');
    const [item, target] = await Promise.all([
      this.requireItem(tenantId, consequence.deliverableItemId),
      consequence.targetObjectId ? this.requireObject(tenantId, consequence.targetObjectId) : Promise.resolve(undefined)
    ]);
    if (consequence.evidenceRecordId) await this.requireEvidence(tenantId, consequence.evidenceRecordId);
    createDeliverableConsequence(consequence, item, target);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO deliverable_consequences
          (id, tenant_id, deliverable_item_id, consequence_type, target_object_id,
           target_version, status, evidence_record_id, created_by_person_id,
           updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          consequence.id, consequence.tenantId, consequence.deliverableItemId,
          consequence.consequenceType, consequence.targetObjectId ?? null,
          consequence.targetVersion ?? null, consequence.status,
          consequence.evidenceRecordId ?? null,
          audit.actorPersonId ?? null, audit.actorPersonId ?? null
        ]
      );
      await writeAudit(connection, tenantId, 'DELIVERABLE_CONSEQUENCE', consequence.id, 'CREATED', audit, consequence);
    });
  }

  async applyConsequence(
    tenantId: TenantId,
    consequenceId: DeliverableConsequence['id'],
    appliedAt: string,
    audit: AuditContext = {}
  ): Promise<DeliverableConsequence> {
    return withTransaction(this.pool, async (connection) => {
      const [rows] = await connection.execute<ConsequenceRow[]>(
        `SELECT id, tenant_id, deliverable_item_id, consequence_type,
                target_object_id, target_version, status, applied_at,
                evidence_record_id, row_version
           FROM deliverable_consequences
          WHERE tenant_id = ? AND id = ?
          FOR UPDATE`,
        [tenantId, consequenceId]
      );
      const row = rows[0];
      if (!row) throw new Error('Deliverable Consequence not found in tenant.');
      const next = markDeliverableConsequenceApplied(mapConsequence(row), appliedAt);
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE deliverable_consequences
            SET status = ?, applied_at = ?, row_version = row_version + 1,
                updated_by_person_id = ?
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          next.status, databaseDate(appliedAt), audit.actorPersonId ?? null,
          tenantId, consequenceId, row.row_version
        ]
      );
      if (result.affectedRows !== 1) throw new Error('Concurrent Deliverable Consequence update detected.');
      await writeAudit(connection, tenantId, 'DELIVERABLE_CONSEQUENCE', consequenceId, 'APPLIED', audit, next);
      return next;
    });
  }

  async getItem(tenantId: TenantId, itemId: DeliverableItem['id']): Promise<DeliverableItem> {
    return this.requireItem(tenantId, itemId);
  }

  private async transitionItem(
    tenantId: TenantId,
    itemId: DeliverableItem['id'],
    at: string,
    action: string,
    note: string,
    transition: (item: DeliverableItem) => DeliverableItem,
    audit: AuditContext
  ): Promise<DeliverableItem> {
    databaseDate(at);
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireItemForUpdate(connection, tenantId, itemId);
      const next = transition(mapItem(row));
      await this.updateItem(connection, row, next, audit);
      await this.insertHistory(connection, next, at, note, audit);
      await writeAudit(connection, tenantId, 'DELIVERABLE_ITEM', itemId, action, audit, next);
      return next;
    });
  }

  private async updateItem(
    connection: PoolConnection,
    currentRow: ItemRow,
    next: DeliverableItem,
    audit: AuditContext
  ): Promise<void> {
    const [result] = await connection.execute<ResultSetHeader>(
      `UPDATE deliverable_items
          SET status = ?, actual_at = ?, governed_output_object_id = ?,
              governed_output_version = ?, configuration_item_id = ?,
              baseline_id = ?, linked_change_id = ?,
              row_version = row_version + 1, updated_by_person_id = ?
        WHERE tenant_id = ? AND id = ? AND row_version = ?`,
      [
        next.status, next.actualAt ? databaseDate(next.actualAt) : null,
        next.governedOutputObjectId ?? null, next.governedOutputVersion ?? null,
        next.configurationItemId ?? null, next.baselineId ?? null,
        next.linkedChangeId ?? null, audit.actorPersonId ?? null,
        next.tenantId, next.id, currentRow.row_version
      ]
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Deliverable Item update detected.');
  }

  private async insertHistory(
    connection: PoolConnection,
    item: DeliverableItem,
    at: string,
    note: string,
    audit: AuditContext
  ): Promise<void> {
    await connection.execute(
      `INSERT INTO deliverable_item_history
        (tenant_id, deliverable_item_id, status, governed_output_object_id,
         governed_output_version, recorded_at, note, actor_person_id, correlation_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.tenantId, item.id, item.status, item.governedOutputObjectId ?? null,
        item.governedOutputVersion ?? null, databaseDate(at), note,
        audit.actorPersonId ?? null, audit.correlationId ?? null
      ]
    );
  }

  private async requireRequirement(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<DeliverableRequirement> {
    const [rows] = await connection.execute<RequirementRow[]>(
      `SELECT id, tenant_id, code, title, deliverable_type, description,
              function_id, sub_function_id, process_definition_id, task_definition_id,
              functional_deployment_id, source_requirement_object_id,
              source_requirement_version, context_object_id, authoring_mode,
              required_representation_types, planned_due_at, acceptance_required, status
         FROM deliverable_requirements WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Deliverable Requirement not found in tenant.');
    return mapRequirement(row);
  }

  private async requireItem(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<DeliverableItem> {
    const [rows] = await connection.execute<ItemRow[]>(
      `SELECT id, tenant_id, canonical_object_id, requirement_id, context_object_id,
              functional_deployment_id, code, title, deliverable_type, status,
              planned_at, forecast_at, actual_at, governed_output_object_id,
              governed_output_version, configuration_item_id, baseline_id,
              linked_change_id, row_version
         FROM deliverable_items WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Deliverable Item not found in tenant.');
    return mapItem(row);
  }

  private async requireItemForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: string
  ): Promise<ItemRow> {
    const [rows] = await connection.execute<ItemRow[]>(
      `SELECT id, tenant_id, canonical_object_id, requirement_id, context_object_id,
              functional_deployment_id, code, title, deliverable_type, status,
              planned_at, forecast_at, actual_at, governed_output_object_id,
              governed_output_version, configuration_item_id, baseline_id,
              linked_change_id, row_version
         FROM deliverable_items WHERE tenant_id = ? AND id = ?
         FOR UPDATE`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Deliverable Item not found in tenant.');
    return row;
  }

  private async requireObject(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<CanonicalObjectIdentity> {
    const [rows] = await connection.execute<CanonicalObjectRow[]>(
      'SELECT id, tenant_id, object_type, stable_key, created_at FROM canonical_objects WHERE tenant_id = ? AND id = ?',
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Canonical Object not found in tenant.');
    return mapObject(row);
  }

  private async requirePerson(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<Person> {
    const [rows] = await connection.execute<PersonRow[]>(
      'SELECT id, tenant_id, party_id, legal_name, preferred_name, status FROM persons WHERE tenant_id = ? AND id = ?',
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Person not found in tenant.');
    return mapPerson(row);
  }

  private async requireParty(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<Party> {
    const [rows] = await connection.execute<PartyRow[]>(
      'SELECT id, tenant_id, kind, display_name, status FROM parties WHERE tenant_id = ? AND id = ?',
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Party not found in tenant.');
    return mapParty(row);
  }

  private async requireFunction(id: string): Promise<FunctionDefinition> {
    const [rows] = await this.pool.execute<FunctionRow[]>(
      'SELECT id, code, name, status FROM function_definitions WHERE id = ?', [id]
    );
    const row = rows[0];
    if (!row) throw new Error('Function Definition not found.');
    return mapFunction(row);
  }

  private async requireSubFunction(id: string): Promise<SubFunctionDefinition> {
    const [rows] = await this.pool.execute<SubFunctionRow[]>(
      'SELECT id, function_id, code, name, sequence, status FROM sub_function_definitions WHERE id = ?', [id]
    );
    const row = rows[0];
    if (!row) throw new Error('Sub-function Definition not found.');
    return mapSubFunction(row);
  }

  private async requireProcess(tenantId: TenantId, id: string): Promise<ProcessDefinition> {
    const [rows] = await this.pool.execute<ProcessRow[]>(
      `SELECT id, tenant_id, function_id, sub_function_id, code, name, purpose, status
         FROM process_definitions WHERE tenant_id = ? AND id = ?`, [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Process Definition not found in tenant.');
    return mapProcess(row);
  }

  private async requireTask(tenantId: TenantId, id: string): Promise<TaskDefinition> {
    const [rows] = await this.pool.execute<TaskRow[]>(
      `SELECT id, tenant_id, process_definition_id, functional_activity_id,
              code, name, instructions, sequence, status
         FROM task_definitions WHERE tenant_id = ? AND id = ?`, [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Task Definition not found in tenant.');
    return mapTask(row);
  }

  private async requireDeployment(tenantId: TenantId, id: string): Promise<FunctionalDeployment> {
    const [rows] = await this.pool.execute<DeploymentRow[]>(
      `SELECT id, tenant_id, function_id, sub_function_id, organisation_id,
              organisation_unit_id, context_type, context_object_id, scope_description,
              effective_from, effective_to, status
         FROM functional_deployments WHERE tenant_id = ? AND id = ?`, [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Functional Deployment not found in tenant.');
    return mapDeployment(row);
  }

  private async requireDecision(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<Decision> {
    const [rows] = await connection.execute<DecisionRow[]>(
      `SELECT id, tenant_id, decision_type, subject_object_id, subject_version,
              outcome, reason, decider_person_id, authority_grant_id, decided_at
         FROM decisions WHERE tenant_id = ? AND id = ?`, [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Decision not found in tenant.');
    return mapDecision(row);
  }

  private async requirePrincipal(
    tenantId: TenantId,
    type: DeliverableResponsibility['principalType'],
    id: string
  ): Promise<Person | Position | OrganisationUnit | Organisation> {
    const table =
      type === 'PERSON' ? 'persons' :
      type === 'POSITION' ? 'positions' :
      type === 'ORGANISATION_UNIT' ? 'organisation_units' : 'organisations';

    const [rows] = await this.pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${table} WHERE tenant_id = ? AND id = ?`, [tenantId, id]
    );
    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) throw new Error('Deliverable Responsibility principal not found in tenant.');

    if (type === 'PERSON') return mapPerson(row as unknown as PersonRow);
    if (type === 'POSITION') {
      return {
        id: String(row.id) as Position['id'],
        tenantId: String(row.tenant_id) as TenantId,
        organisationUnitId: String(row.organisation_unit_id) as Position['organisationUnitId'],
        ...(row.job_profile_id ? { jobProfileId: String(row.job_profile_id) as NonNullable<Position['jobProfileId']> } : {}),
        code: String(row.code),
        title: String(row.title),
        status: row.status as Position['status']
      };
    }
    if (type === 'ORGANISATION_UNIT') {
      return {
        id: String(row.id) as OrganisationUnit['id'],
        tenantId: String(row.tenant_id) as TenantId,
        organisationId: String(row.organisation_id) as OrganisationUnit['organisationId'],
        ...(row.parent_unit_id ? { parentUnitId: String(row.parent_unit_id) as NonNullable<OrganisationUnit['parentUnitId']> } : {}),
        code: String(row.code),
        name: String(row.name),
        status: row.status as OrganisationUnit['status']
      };
    }
    return {
      id: String(row.id) as Organisation['id'],
      tenantId: String(row.tenant_id) as TenantId,
      partyId: String(row.party_id) as Organisation['partyId'],
      legalName: String(row.legal_name),
      ...(row.trading_name ? { tradingName: String(row.trading_name) } : {}),
      status: row.status as Organisation['status']
    };
  }

  private async requireTransmittal(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<Transmittal> {
    const [rows] = await connection.execute<TransmittalRow[]>(
      `SELECT id, tenant_id, deliverable_item_id, issue_reference, issue_purpose,
              subject_object_id, subject_version, representation_id,
              issued_by_person_id, issued_at, response_required
         FROM transmittals WHERE tenant_id = ? AND id = ?`, [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Transmittal not found in tenant.');
    return mapTransmittal(row);
  }

  private async requireRecipient(tenantId: TenantId, id: string): Promise<TransmittalRecipient> {
    const [rows] = await this.pool.execute<RecipientRow[]>(
      `SELECT id, tenant_id, transmittal_id, recipient_party_id, response_required, due_at
         FROM transmittal_recipients WHERE tenant_id = ? AND id = ?`, [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Transmittal Recipient not found in tenant.');
    return mapRecipient(row);
  }

  private async listRecipients(
    connection: PoolConnection,
    tenantId: TenantId,
    transmittalId: string
  ): Promise<TransmittalRecipient[]> {
    const [rows] = await connection.execute<RecipientRow[]>(
      `SELECT id, tenant_id, transmittal_id, recipient_party_id, response_required, due_at
         FROM transmittal_recipients
        WHERE tenant_id = ? AND transmittal_id = ?
        ORDER BY id`, [tenantId, transmittalId]
    );
    return rows.map(mapRecipient);
  }

  private async listResponsesForTransmittal(
    connection: PoolConnection,
    tenantId: TenantId,
    transmittalId: string
  ): Promise<RecipientResponse[]> {
    const [rows] = await connection.execute<ResponseRow[]>(
      `SELECT rr.id, rr.tenant_id, rr.transmittal_recipient_id,
              rr.responder_person_id, rr.outcome, rr.comments,
              rr.responded_at, rr.evidence_record_id
         FROM recipient_responses rr
         JOIN transmittal_recipients tr
           ON tr.tenant_id = rr.tenant_id
          AND tr.id = rr.transmittal_recipient_id
        WHERE rr.tenant_id = ? AND tr.transmittal_id = ?
        ORDER BY rr.responded_at, rr.id`, [tenantId, transmittalId]
    );
    return rows.map(mapResponse);
  }

  private async requireEvidence(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<void> {
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM evidence_records WHERE tenant_id = ? AND id = ?', [tenantId, id]
    );
    if (!rows[0]) throw new Error('Evidence Record not found in tenant.');
  }

  private async requireWork(connection: PoolConnection, tenantId: TenantId, id: string): Promise<void> {
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM work_items WHERE tenant_id = ? AND id = ?', [tenantId, id]
    );
    if (!rows[0]) throw new Error('Work Item not found in tenant.');
  }

  private async requireReworkTrigger(
    connection: PoolConnection,
    tenantId: TenantId,
    itemId: string,
    type: DeliverableRework['triggerType'],
    triggerId: string
  ): Promise<void> {
    let query: string;
    let params: string[];
    if (type === 'REVIEW') {
      query = 'SELECT id FROM deliverable_reviews WHERE tenant_id = ? AND deliverable_item_id = ? AND id = ?';
      params = [tenantId, itemId, triggerId];
    } else if (type === 'DECISION') {
      query = `SELECT d.id
                 FROM decisions d
                 JOIN deliverable_items di
                   ON di.tenant_id = d.tenant_id
                  AND di.id = ?
                WHERE d.tenant_id = ?
                  AND d.id = ?
                  AND d.subject_object_id = di.governed_output_object_id
                  AND d.subject_version <=> di.governed_output_version`;
      params = [itemId, tenantId, triggerId];
    } else {
      query = `SELECT rr.id
                 FROM recipient_responses rr
                 JOIN transmittal_recipients tr
                   ON tr.tenant_id = rr.tenant_id
                  AND tr.id = rr.transmittal_recipient_id
                 JOIN transmittals t
                   ON t.tenant_id = tr.tenant_id
                  AND t.id = tr.transmittal_id
                WHERE rr.tenant_id = ?
                  AND t.deliverable_item_id = ?
                  AND rr.id = ?`;
      params = [tenantId, itemId, triggerId];
    }
    const [rows] = await connection.execute<RowDataPacket[]>(query, params);
    if (!rows[0]) throw new Error('Deliverable Rework trigger is not valid for this Item.');
  }

  private async validateRepresentationExactSubject(
    connection: PoolConnection,
    tenantId: TenantId,
    representationId: string,
    subjectObjectId: string,
    subjectVersion: string | undefined
  ): Promise<void> {
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT r.id
         FROM representations r
         JOIN information_iterations ii
           ON ii.tenant_id = r.tenant_id
          AND ii.id = r.information_iteration_id
         JOIN information_revisions ir
           ON ir.tenant_id = ii.tenant_id
          AND ir.id = ii.information_revision_id
         JOIN information_containers ic
           ON ic.tenant_id = ir.tenant_id
          AND ic.id = ir.information_container_id
        WHERE r.tenant_id = ?
          AND r.id = ?
          AND ic.canonical_object_id = ?
          AND ir.revision <=> ?`,
      [tenantId, representationId, subjectObjectId, subjectVersion ?? null]
    );
    if (!rows[0]) {
      throw new Error('Representation does not represent the exact issued subject/version.');
    }
  }
}
