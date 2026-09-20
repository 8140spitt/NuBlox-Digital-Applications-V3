import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import {
  dbTransaction,
  executeMutation,
  queryOne,
  queryRows,
  type DbExecutor
} from '$lib/server/db';
import { createInformationContainerInTransaction } from '$lib/server/information-container';
import { assertPermission, type CommandContext } from '$lib/server/platform-context';
import { emitBusinessEvent, recordPlatformAudit } from '$lib/server/platform-evidence';
import { assertWorkDecisionReference } from '$lib/server/work-decision';

export type DeliverableRequirement = {
  id: string;
  requirementRef: string;
  title: string;
  description: string | null;
  requirementSourceType: string;
  requirementSourceId: string;
  contextType: string;
  contextId: string;
  functionalDefinitionId: string | null;
  functionalDeploymentId: string | null;
  requiredJobProfileId: string | null;
  requiredJobName: string | null;
  functionCode: string | null;
  functionName: string | null;
  deliverableType: string;
  outputKind: string;
  authoringMode: string;
  disciplineCode: string | null;
  classificationCode: string | null;
  reviewRequired: boolean;
  approvalRequired: boolean;
  acceptanceRequired: boolean;
  plannedStartAt: string | null;
  plannedIssueAt: string | null;
  requiredAcceptanceAt: string | null;
  status: string;
  version: number;
};

export type DeliverableItem = {
  id: string;
  deliverableRef: string;
  requirementId: string;
  requirementRef: string;
  title: string;
  deliverableType: string;
  outputKind: string;
  authoringMode: string;
  contextType: string;
  contextId: string;
  disciplineCode: string | null;
  classificationCode: string | null;
  reviewRequired: boolean;
  approvalRequired: boolean;
  acceptanceRequired: boolean;
  responsibleDeploymentAssignmentId: string | null;
  responsiblePositionId: string | null;
  responsiblePositionName: string | null;
  responsiblePartyId: string | null;
  responsiblePartyName: string | null;
  originatingOrganisationPartyId: string | null;
  originatingOrganisationName: string | null;
  informationContainerId: string | null;
  informationContainerRef: string | null;
  managedObjectType: string | null;
  managedObjectId: string | null;
  currentRevisionLabel: string | null;
  status: string;
  effectiveStatus: string;
  version: number;
  workflowInstanceId: string | null;
  workItemId: string | null;
  workStatus: string | null;
  workVersion: number | null;
  dueAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DeliverableStageDecision = {
  id: string;
  stage: string;
  itemVersion: number;
  revisionLabel: string | null;
  decisionId: string;
  outcome: string;
  reason: string;
  deciderPartyId: string;
  deciderName: string | null;
  decidedAt: string;
};

export type DeliverableIssueRecipient = {
  id: string;
  deliverableIssueId: string;
  issueRef: string;
  revisionLabel: string | null;
  recipientPartyId: string;
  recipientName: string | null;
  recipientRole: string | null;
  responseStatus: string;
  responseDecisionId: string | null;
  responseNote: string | null;
  respondedAt: string | null;
  issuedAt: string;
};

export type DeliverableDeploymentAssignmentOption = {
  id: string;
  functionalDeploymentId: string;
  deploymentReference: string;
  functionCode: string;
  functionName: string;
  jobProfileId: string;
  jobName: string;
  positionId: string | null;
  positionName: string | null;
  personPartyId: string | null;
  personName: string | null;
  organisationPartyId: string | null;
  organisationName: string | null;
  assignmentRole: string;
  status: string;
};

const requirementSelect = `
SELECT r.id,
       r.requirement_ref AS requirementRef,
       r.title,
       r.description,
       r.requirement_source_type AS requirementSourceType,
       r.requirement_source_id AS requirementSourceId,
       r.context_type AS contextType,
       r.context_id AS contextId,
       r.functional_definition_id AS functionalDefinitionId,
       r.functional_deployment_id AS functionalDeploymentId,
       r.required_job_profile_id AS requiredJobProfileId,
       jp.name AS requiredJobName,
       fd.function_code AS functionCode,
       fd.name AS functionName,
       r.deliverable_type AS deliverableType,
       r.output_kind AS outputKind,
       r.authoring_mode AS authoringMode,
       r.discipline_code AS disciplineCode,
       r.classification_code AS classificationCode,
       r.review_required AS reviewRequired,
       r.approval_required AS approvalRequired,
       r.acceptance_required AS acceptanceRequired,
       r.planned_start_at AS plannedStartAt,
       r.planned_issue_at AS plannedIssueAt,
       r.required_acceptance_at AS requiredAcceptanceAt,
       r.status,
       r.version
  FROM deliverable_requirements r
  LEFT JOIN job_profiles jp
    ON jp.id = r.required_job_profile_id
   AND jp.tenant_id = r.tenant_id
  LEFT JOIN functional_definitions fd
    ON fd.id = r.functional_definition_id
   AND fd.tenant_id = r.tenant_id
`;

const itemSelect = `
SELECT di.id,
       di.deliverable_ref AS deliverableRef,
       di.requirement_id AS requirementId,
       dr.requirement_ref AS requirementRef,
       di.title,
       dr.deliverable_type AS deliverableType,
       dr.output_kind AS outputKind,
       dr.authoring_mode AS authoringMode,
       dr.context_type AS contextType,
       dr.context_id AS contextId,
       dr.discipline_code AS disciplineCode,
       dr.classification_code AS classificationCode,
       dr.review_required AS reviewRequired,
       dr.approval_required AS approvalRequired,
       dr.acceptance_required AS acceptanceRequired,
       di.responsible_deployment_assignment_id AS responsibleDeploymentAssignmentId,
       di.responsible_position_id AS responsiblePositionId,
       pos.name AS responsiblePositionName,
       di.responsible_party_id AS responsiblePartyId,
       rp.display_name AS responsiblePartyName,
       di.originating_organisation_party_id AS originatingOrganisationPartyId,
       op.display_name AS originatingOrganisationName,
       di.information_container_id AS informationContainerId,
       ic.container_ref AS informationContainerRef,
       di.managed_object_type AS managedObjectType,
       di.managed_object_id AS managedObjectId,
       di.current_revision_label AS currentRevisionLabel,
       di.status,
       CASE
         WHEN di.status = 'PLANNED' AND wi.status = 'IN_PROGRESS' THEN 'IN_PROGRESS'
         WHEN di.status IN ('PLANNED','IN_PROGRESS') AND wi.status = 'COMPLETED' THEN 'AUTHOR_COMPLETE'
         ELSE di.status
       END AS effectiveStatus,
       di.version,
       di.workflow_instance_id AS workflowInstanceId,
       di.work_item_id AS workItemId,
       wi.status AS workStatus,
       wi.version AS workVersion,
       di.due_at AS dueAt,
       di.accepted_at AS acceptedAt,
       di.created_at AS createdAt,
       di.updated_at AS updatedAt
  FROM deliverable_items di
  JOIN deliverable_requirements dr
    ON dr.id = di.requirement_id
   AND dr.tenant_id = di.tenant_id
  LEFT JOIN positions pos
    ON pos.id = di.responsible_position_id
   AND pos.tenant_id = di.tenant_id
  LEFT JOIN parties rp
    ON rp.id = di.responsible_party_id
   AND rp.tenant_id = di.tenant_id
  LEFT JOIN parties op
    ON op.id = di.originating_organisation_party_id
   AND op.tenant_id = di.tenant_id
  LEFT JOIN information_containers ic
    ON ic.id = di.information_container_id
   AND ic.tenant_id = di.tenant_id
  LEFT JOIN work_items wi
    ON wi.id = di.work_item_id
   AND wi.tenant_id = di.tenant_id
`;

const now = () => new Date().toISOString();

function required(value: string, label: string) {
  const clean = value.trim();
  if (!clean) throw new Error(label + ' is required.');
  return clean;
}

function code(value: string, label: string, max = 191) {
  const clean = required(value, label).toUpperCase();
  if (clean.length > max || !/^[A-Z0-9][A-Z0-9._:-]*$/.test(clean)) {
    throw new Error(label + ' contains unsupported characters.');
  }
  return clean;
}

function optional(value?: string) {
  return value?.trim() || null;
}

function optionalCode(value: string | undefined, label: string, max = 191) {
  return value?.trim() ? code(value, label, max) : null;
}

function dateTime(value: string | undefined, label: string) {
  const clean = value?.trim();
  if (!clean) return null;
  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) throw new Error(label + ' is invalid.');
  return parsed.toISOString();
}

function flag(value: boolean | undefined, fallback: boolean) {
  return value === undefined ? fallback : value;
}

function authoringMode(value: string) {
  const clean = code(value, 'Authoring mode', 32);
  if (!['NATIVE', 'ASSISTED', 'CONNECTED', 'INGESTED'].includes(clean)) {
    throw new Error('Authoring mode must be NATIVE, ASSISTED, CONNECTED or INGESTED.');
  }
  return clean;
}

async function evidence(
  context: CommandContext,
  input: {
    objectType: string;
    objectId: string;
    action: string;
    fromState?: string;
    toState?: string;
    version: number;
    payload?: Record<string, unknown>;
  },
  executor: DbExecutor
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: 'AGG-MANAGED-DELIVERABLE',
      objectType: input.objectType,
      objectId: input.objectId,
      action: input.action,
      fromState: input.fromState,
      toState: input.toState
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId: 'AGG-MANAGED-DELIVERABLE',
      aggregateType: input.objectType,
      aggregateObjectId: input.objectId,
      aggregateVersion: input.version,
      eventType: input.action,
      topic: 'nublox.deliverable',
      payload: input.payload ?? {}
    },
    executor
  );
}

async function canReceiveMyWork(context: CommandContext, partyId: string, executor: DbExecutor) {
  const timestamp = now();
  const row = await queryOne<RowDataPacket & { id: string }>(
    `SELECT m.id
       FROM memberships m
       JOIN parties p
         ON p.id = m.party_id
        AND p.tenant_id = m.tenant_id
      WHERE m.tenant_id = ?
        AND m.party_id = ?
        AND m.context_type = 'TENANT'
        AND m.context_id = ?
        AND m.status = 'ACTIVE'
        AND m.valid_from <= ?
        AND (m.valid_to IS NULL OR m.valid_to > ?)
        AND p.status = 'ACTIVE'
      LIMIT 1`,
    [context.tenantId, partyId, context.tenantId, timestamp, timestamp],
    executor
  );
  return Boolean(row);
}

type LockedDeliverable = {
  id: string;
  title: string;
  status: string;
  version: number;
  workflowInstanceId: string | null;
  workItemId: string | null;
  workStatus: string | null;
  responsiblePartyId: string | null;
  dueAt: string | null;
  currentRevisionLabel: string | null;
  informationContainerId: string | null;
  reviewRequired: boolean;
  approvalRequired: boolean;
  acceptanceRequired: boolean;
};

async function lockDeliverable(
  context: CommandContext,
  deliverableItemId: string,
  executor: DbExecutor
): Promise<LockedDeliverable> {
  const row = await queryOne<RowDataPacket & LockedDeliverable>(
    `SELECT di.id,
            di.title,
            di.status,
            di.version,
            di.workflow_instance_id AS workflowInstanceId,
            di.work_item_id AS workItemId,
            wi.status AS workStatus,
            di.responsible_party_id AS responsiblePartyId,
            di.due_at AS dueAt,
            di.current_revision_label AS currentRevisionLabel,
            di.information_container_id AS informationContainerId,
            dr.review_required AS reviewRequired,
            dr.approval_required AS approvalRequired,
            dr.acceptance_required AS acceptanceRequired
       FROM deliverable_items di
       JOIN deliverable_requirements dr
         ON dr.id = di.requirement_id
        AND dr.tenant_id = di.tenant_id
       LEFT JOIN work_items wi
         ON wi.id = di.work_item_id
        AND wi.tenant_id = di.tenant_id
      WHERE di.id = ?
        AND di.tenant_id = ?
      FOR UPDATE`,
    [deliverableItemId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Deliverable Item not found.');
  return row;
}

function assertExpectedVersion(item: LockedDeliverable, expectedVersion: number) {
  if (item.version !== expectedVersion) {
    throw new Error('Deliverable Item changed after you opened it.');
  }
}

async function createDeliverableReworkItem(
  context: CommandContext,
  item: LockedDeliverable,
  subjectVersion: number,
  executor: DbExecutor
) {
  if (!item.workflowInstanceId) {
    throw new Error('Deliverable authoring Workflow Instance is missing.');
  }
  const workItemId = randomUUID();
  const timestamp = now();
  const canAssign = item.responsiblePartyId
    ? await canReceiveMyWork(context, item.responsiblePartyId, executor)
    : false;
  const workStatus = canAssign ? 'ASSIGNED' : 'READY';

  await executeMutation(
    `INSERT INTO work_items
      (id, tenant_id, workflow_instance_id, work_type, subject_type, subject_id, subject_version,
       title, instructions, status, priority, due_at, version, created_by_party_id,
       completion_note, completed_at, created_at, updated_at)
     VALUES (?, ?, ?, 'DELIVERABLE_REWORK', 'DELIVERABLE_ITEM', ?, ?, ?, ?, ?, 'HIGH', ?,
             1, ?, NULL, NULL, ?, ?)`,
    [
      workItemId,
      context.tenantId,
      item.workflowInstanceId,
      item.id,
      String(subjectVersion),
      'Revise · ' + item.title,
      'Revise the deliverable in response to the recorded review, approval or recipient decision, then complete this work before resubmission.',
      workStatus,
      item.dueAt,
      context.actorPartyId,
      timestamp,
      timestamp
    ],
    executor
  );

  if (canAssign && item.responsiblePartyId) {
    await executeMutation(
      `INSERT INTO work_assignments
        (id, tenant_id, workflow_instance_id, work_item_id, assignee_type, assignee_id,
         assigned_by_party_id, assignment_basis, status, valid_from, valid_to, created_at)
       VALUES (?, ?, ?, ?, 'PARTY', ?, ?, ?, 'ACTIVE', ?, NULL, ?)`,
      [
        randomUUID(),
        context.tenantId,
        item.workflowInstanceId,
        workItemId,
        item.responsiblePartyId,
        context.actorPartyId,
        'Responsible Party retained for governed Deliverable rework.',
        timestamp,
        timestamp
      ],
      executor
    );
  }

  await executeMutation(
    `UPDATE workflow_instances
        SET current_state = 'REWORK',
            version = version + 1,
            updated_at = ?
      WHERE id = ? AND tenant_id = ?`,
    [timestamp, item.workflowInstanceId, context.tenantId],
    executor
  );
  return workItemId;
}

export async function listDeliverableRequirements(
  context: CommandContext,
  input: { contextType?: string; contextId?: string; status?: string } = {}
): Promise<DeliverableRequirement[]> {
  assertPermission(context, 'deliverable.read');
  const clauses = ['r.tenant_id = ?'];
  const params: unknown[] = [context.tenantId];
  if (input.contextType?.trim()) {
    clauses.push('r.context_type = ?');
    params.push(code(input.contextType, 'Context type', 64));
  }
  if (input.contextId?.trim()) {
    clauses.push('r.context_id = ?');
    params.push(input.contextId.trim());
  }
  if (input.status?.trim()) {
    clauses.push('r.status = ?');
    params.push(code(input.status, 'Requirement status', 32));
  }
  return queryRows<RowDataPacket & DeliverableRequirement>(
    requirementSelect +
      ' WHERE ' +
      clauses.join(' AND ') +
      ' ORDER BY r.planned_issue_at IS NULL, r.planned_issue_at, r.requirement_ref',
    params
  );
}

export async function listDeliverableItems(
  context: CommandContext,
  input: { contextType?: string; contextId?: string; status?: string } = {}
): Promise<DeliverableItem[]> {
  assertPermission(context, 'deliverable.read');
  const clauses = ['di.tenant_id = ?'];
  const params: unknown[] = [context.tenantId];
  if (input.contextType?.trim()) {
    clauses.push('dr.context_type = ?');
    params.push(code(input.contextType, 'Context type', 64));
  }
  if (input.contextId?.trim()) {
    clauses.push('dr.context_id = ?');
    params.push(input.contextId.trim());
  }
  if (input.status?.trim()) {
    clauses.push('di.status = ?');
    params.push(code(input.status, 'Deliverable status', 32));
  }
  return queryRows<RowDataPacket & DeliverableItem>(
    itemSelect +
      ' WHERE ' +
      clauses.join(' AND ') +
      ' ORDER BY di.due_at IS NULL, di.due_at, di.deliverable_ref',
    params
  );
}

export async function getDeliverableItem(
  context: CommandContext,
  deliverableItemId: string
): Promise<DeliverableItem> {
  assertPermission(context, 'deliverable.read');
  const row = await queryOne<RowDataPacket & DeliverableItem>(
    itemSelect + ' WHERE di.id = ? AND di.tenant_id = ?',
    [deliverableItemId, context.tenantId]
  );
  if (!row) throw new Error('Deliverable Item not found.');
  return row;
}

export async function listDeliverableDeploymentAssignments(
  context: CommandContext
): Promise<DeliverableDeploymentAssignmentOption[]> {
  assertPermission(context, 'deliverable.read');
  return queryRows<RowDataPacket & DeliverableDeploymentAssignmentOption>(
    `SELECT da.id,
            da.functional_deployment_id AS functionalDeploymentId,
            d.deployment_reference AS deploymentReference,
            fd.function_code AS functionCode,
            fd.name AS functionName,
            da.job_profile_id AS jobProfileId,
            jp.name AS jobName,
            da.position_id AS positionId,
            p.name AS positionName,
            da.person_party_id AS personPartyId,
            pp.display_name AS personName,
            da.organisation_party_id AS organisationPartyId,
            op.display_name AS organisationName,
            da.assignment_role AS assignmentRole,
            da.status
       FROM deployment_assignments da
       JOIN functional_deployments d
         ON d.id = da.functional_deployment_id
        AND d.tenant_id = da.tenant_id
       JOIN functional_definitions fd
         ON fd.id = d.functional_definition_id
        AND fd.tenant_id = d.tenant_id
       JOIN job_profiles jp
         ON jp.id = da.job_profile_id
        AND jp.tenant_id = da.tenant_id
       LEFT JOIN positions p
         ON p.id = da.position_id
        AND p.tenant_id = da.tenant_id
       LEFT JOIN parties pp
         ON pp.id = da.person_party_id
        AND pp.tenant_id = da.tenant_id
       LEFT JOIN parties op
         ON op.id = da.organisation_party_id
        AND op.tenant_id = da.tenant_id
      WHERE da.tenant_id = ?
        AND da.status = 'ACTIVE'
        AND d.status = 'ACTIVE'
      ORDER BY fd.function_type, fd.function_code, jp.name, p.name`,
    [context.tenantId]
  );
}

export async function createManagedDeliverable(
  context: CommandContext,
  input: {
    requirementRef: string;
    deliverableRef: string;
    title: string;
    description?: string;
    requirementSourceType: string;
    requirementSourceId: string;
    contextType: string;
    contextId: string;
    functionalDefinitionId?: string;
    functionalDeploymentId?: string;
    requiredJobProfileId?: string;
    responsibleDeploymentAssignmentId?: string;
    responsiblePartyId?: string;
    originatingOrganisationPartyId?: string;
    deliverableType: string;
    outputKind: string;
    authoringMode: string;
    disciplineCode?: string;
    classificationCode?: string;
    reviewRequired?: boolean;
    approvalRequired?: boolean;
    acceptanceRequired?: boolean;
    plannedStartAt?: string;
    plannedIssueAt?: string;
    requiredAcceptanceAt?: string;
    dueAt?: string;
    createInformationContainer?: boolean;
    initialRevisionCode?: string;
  }
) {
  assertPermission(context, 'deliverable.manage');

  return dbTransaction(async (connection) => {
    const requirementId = randomUUID();
    const itemId = randomUUID();
    const workflowId = randomUUID();
    const workItemId = randomUUID();
    const timestampNow = now();

    let functionalDefinitionId = optional(input.functionalDefinitionId);
    let functionalDeploymentId = optional(input.functionalDeploymentId);
    let requiredJobProfileId = optional(input.requiredJobProfileId);
    let responsibleDeploymentAssignmentId = optional(input.responsibleDeploymentAssignmentId);
    let responsiblePositionId: string | null = null;
    let responsiblePartyId = optional(input.responsiblePartyId);
    let originatingOrganisationPartyId = optional(input.originatingOrganisationPartyId);

    if (responsibleDeploymentAssignmentId) {
      const assignment = await queryOne<
        RowDataPacket & {
          id: string;
          functionalDeploymentId: string;
          functionalDefinitionId: string;
          jobProfileId: string;
          positionId: string | null;
          personPartyId: string | null;
          organisationPartyId: string | null;
        }
      >(
        `SELECT da.id,
                da.functional_deployment_id AS functionalDeploymentId,
                d.functional_definition_id AS functionalDefinitionId,
                da.job_profile_id AS jobProfileId,
                da.position_id AS positionId,
                da.person_party_id AS personPartyId,
                da.organisation_party_id AS organisationPartyId
           FROM deployment_assignments da
           JOIN functional_deployments d
             ON d.id = da.functional_deployment_id
            AND d.tenant_id = da.tenant_id
          WHERE da.id = ?
            AND da.tenant_id = ?
            AND da.status = 'ACTIVE'
            AND d.status = 'ACTIVE'`,
        [responsibleDeploymentAssignmentId, context.tenantId],
        connection
      );
      if (!assignment) throw new Error('Active Functional Deployment assignment not found.');
      if (functionalDeploymentId && functionalDeploymentId !== assignment.functionalDeploymentId) {
        throw new Error(
          'Responsible deployment assignment does not belong to the selected deployment.'
        );
      }
      functionalDeploymentId = assignment.functionalDeploymentId;
      functionalDefinitionId = assignment.functionalDefinitionId;
      requiredJobProfileId = requiredJobProfileId ?? assignment.jobProfileId;
      responsiblePositionId = assignment.positionId;
      responsiblePartyId = responsiblePartyId ?? assignment.personPartyId;
      originatingOrganisationPartyId =
        originatingOrganisationPartyId ?? assignment.organisationPartyId;
    }

    if (functionalDeploymentId && !functionalDefinitionId) {
      const deployment = await queryOne<RowDataPacket & { functionalDefinitionId: string }>(
        `SELECT functional_definition_id AS functionalDefinitionId
           FROM functional_deployments
          WHERE id = ? AND tenant_id = ? AND status IN ('PLANNED','ACTIVE')`,
        [functionalDeploymentId, context.tenantId],
        connection
      );
      if (!deployment) throw new Error('Functional Deployment not found.');
      functionalDefinitionId = deployment.functionalDefinitionId;
    }

    const requirementRef = code(input.requirementRef, 'Requirement reference');
    const deliverableRef = code(input.deliverableRef, 'Deliverable reference');
    const deliverableType = code(input.deliverableType, 'Deliverable type', 128);
    const outputKind = code(input.outputKind, 'Output kind', 64);
    const mode = authoringMode(input.authoringMode);
    const contextType = code(input.contextType, 'Context type', 64);
    const sourceType = code(input.requirementSourceType, 'Requirement source type', 64);
    const plannedStartAt = dateTime(input.plannedStartAt, 'Planned start');
    const plannedIssueAt = dateTime(input.plannedIssueAt, 'Planned issue');
    const requiredAcceptanceAt = dateTime(input.requiredAcceptanceAt, 'Required acceptance');
    const dueAt =
      dateTime(input.dueAt, 'Deliverable due date') ??
      plannedIssueAt ??
      requiredAcceptanceAt ??
      null;

    await executeMutation(
      `INSERT INTO deliverable_requirements
        (id, tenant_id, requirement_ref, title, description, requirement_source_type,
         requirement_source_id, context_type, context_id, functional_definition_id,
         functional_deployment_id, required_job_profile_id, deliverable_type, output_kind,
         authoring_mode, discipline_code, classification_code, review_required, approval_required,
         acceptance_required, planned_start_at, planned_issue_at, required_acceptance_at,
         status, version, created_by_party_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
               'ACTIVE', 1, ?, ?, ?)`,
      [
        requirementId,
        context.tenantId,
        requirementRef,
        required(input.title, 'Deliverable title'),
        optional(input.description),
        sourceType,
        required(input.requirementSourceId, 'Requirement source ID'),
        contextType,
        required(input.contextId, 'Context ID'),
        functionalDefinitionId,
        functionalDeploymentId,
        requiredJobProfileId,
        deliverableType,
        outputKind,
        mode,
        optionalCode(input.disciplineCode, 'Discipline code', 64),
        optional(input.classificationCode),
        flag(input.reviewRequired, true),
        flag(input.approvalRequired, true),
        flag(input.acceptanceRequired, false),
        plannedStartAt,
        plannedIssueAt,
        requiredAcceptanceAt,
        context.actorPartyId,
        timestampNow,
        timestampNow
      ],
      connection
    );

    let informationContainerId: string | null = null;
    if (input.createInformationContainer) {
      informationContainerId = await createInformationContainerInTransaction(
        context,
        {
          containerRef: deliverableRef,
          containerType: 'CONTROLLED_DELIVERABLE',
          title: required(input.title, 'Deliverable title'),
          originatorPartyId: originatingOrganisationPartyId ?? context.actorPartyId,
          subjectType: 'DELIVERABLE_ITEM',
          subjectId: itemId,
          classificationCode: optional(input.classificationCode) ?? undefined,
          revisionCode: input.initialRevisionCode?.trim() || 'P01'
        },
        connection
      );
    }

    const canAssign = responsiblePartyId
      ? await canReceiveMyWork(context, responsiblePartyId, connection)
      : false;
    const workStatus = canAssign ? 'ASSIGNED' : 'READY';

    await executeMutation(
      `INSERT INTO workflow_instances
        (id, tenant_id, definition_key, definition_version, subject_type, subject_id,
         subject_version, started_by_party_id, status, version, current_state, started_at,
         completed_at, completion_reason, created_at, updated_at)
       VALUES (?, ?, 'DELIVERABLE_AUTHORING', '1', 'DELIVERABLE_ITEM', ?, '1', ?,
               'RUNNING', 1, 'AUTHORING', ?, NULL, NULL, ?, ?)`,
      [
        workflowId,
        context.tenantId,
        itemId,
        context.actorPartyId,
        timestampNow,
        timestampNow,
        timestampNow
      ],
      connection
    );

    await executeMutation(
      `INSERT INTO work_items
        (id, tenant_id, workflow_instance_id, work_type, subject_type, subject_id, subject_version,
         title, instructions, status, priority, due_at, version, created_by_party_id,
         completion_note, completed_at, created_at, updated_at)
       VALUES (?, ?, ?, 'DELIVERABLE', 'DELIVERABLE_ITEM', ?, '1', ?, ?, ?, 'NORMAL', ?,
               1, ?, NULL, NULL, ?, ?)`,
      [
        workItemId,
        context.tenantId,
        workflowId,
        itemId,
        'Produce · ' + required(input.title, 'Deliverable title'),
        'Create the required ' +
          deliverableType.replaceAll('_', ' ') +
          ' and complete the authoring work when it is ready for the next governed stage.',
        workStatus,
        dueAt,
        context.actorPartyId,
        timestampNow,
        timestampNow
      ],
      connection
    );

    if (canAssign && responsiblePartyId) {
      await executeMutation(
        `INSERT INTO work_assignments
          (id, tenant_id, workflow_instance_id, work_item_id, assignee_type, assignee_id,
           assigned_by_party_id, assignment_basis, status, valid_from, valid_to, created_at)
         VALUES (?, ?, ?, ?, 'PARTY', ?, ?, ?, 'ACTIVE', ?, NULL, ?)`,
        [
          randomUUID(),
          context.tenantId,
          workflowId,
          workItemId,
          responsiblePartyId,
          context.actorPartyId,
          'Responsible Party from governed Deliverable / Functional Deployment assignment.',
          timestampNow,
          timestampNow
        ],
        connection
      );
    }

    await executeMutation(
      `INSERT INTO deliverable_items
        (id, tenant_id, deliverable_ref, requirement_id, title,
         responsible_deployment_assignment_id, responsible_position_id, responsible_party_id,
         originating_organisation_party_id, information_container_id, managed_object_type,
         managed_object_id, current_revision_label, status, version, workflow_instance_id,
         work_item_id, due_at, accepted_at, supersedes_deliverable_item_id,
         created_by_party_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PLANNED', 1, ?, ?, ?, NULL, NULL, ?, ?, ?)`,
      [
        itemId,
        context.tenantId,
        deliverableRef,
        requirementId,
        required(input.title, 'Deliverable title'),
        responsibleDeploymentAssignmentId,
        responsiblePositionId,
        responsiblePartyId,
        originatingOrganisationPartyId,
        informationContainerId,
        informationContainerId ? 'INFORMATION_CONTAINER' : null,
        informationContainerId,
        input.initialRevisionCode?.trim().toUpperCase() || (informationContainerId ? 'P01' : null),
        workflowId,
        workItemId,
        dueAt,
        context.actorPartyId,
        timestampNow,
        timestampNow
      ],
      connection
    );

    if (
      responsibleDeploymentAssignmentId ||
      responsiblePositionId ||
      responsiblePartyId ||
      originatingOrganisationPartyId
    ) {
      await executeMutation(
        `INSERT INTO deliverable_participants
          (id, tenant_id, deliverable_item_id, participant_role, party_id, position_id,
           organisation_party_id, deployment_assignment_id, status, valid_from, valid_to, created_at)
         VALUES (?, ?, ?, 'ACCOUNTABLE', ?, ?, ?, ?, 'ACTIVE', ?, NULL, ?)`,
        [
          randomUUID(),
          context.tenantId,
          itemId,
          responsiblePartyId,
          responsiblePositionId,
          originatingOrganisationPartyId,
          responsibleDeploymentAssignmentId,
          timestampNow,
          timestampNow
        ],
        connection
      );
    }

    await evidence(
      context,
      {
        objectType: 'deliverable_item',
        objectId: itemId,
        action: 'DELIVERABLE_ITEM_CREATED',
        toState: 'PLANNED',
        version: 1,
        payload: {
          requirementId,
          requirementRef,
          deliverableRef,
          deliverableType,
          outputKind,
          authoringMode: mode,
          functionalDefinitionId,
          functionalDeploymentId,
          requiredJobProfileId,
          responsiblePartyId,
          responsiblePositionId,
          informationContainerId,
          workflowInstanceId: workflowId,
          workItemId,
          workRoutedToMyWork: canAssign
        }
      },
      connection
    );

    return { requirementId, deliverableItemId: itemId, workItemId, workRoutedToMyWork: canAssign };
  });
}

export async function recordDeliverableIssue(
  context: CommandContext,
  deliverableItemId: string,
  expectedVersion: number,
  input: {
    issueRef: string;
    issueType?: string;
    recipientPartyId?: string;
    recipientRole?: string;
    purposeOfIssue?: string;
    suitabilityCode?: string;
  }
) {
  assertPermission(context, 'deliverable.issue');
  return dbTransaction(async (connection) => {
    const item = await queryOne<
      RowDataPacket & {
        id: string;
        status: string;
        version: number;
        informationContainerId: string | null;
        currentRevisionLabel: string | null;
      }
    >(
      `SELECT id,
              status,
              version,
              information_container_id AS informationContainerId,
              current_revision_label AS currentRevisionLabel
         FROM deliverable_items
        WHERE id = ? AND tenant_id = ?
        FOR UPDATE`,
      [deliverableItemId, context.tenantId],
      connection
    );
    if (!item) throw new Error('Deliverable Item not found.');
    if (item.version !== expectedVersion) {
      throw new Error('Deliverable Item changed after you opened it.');
    }
    if (['ACCEPTED', 'SUPERSEDED', 'CANCELLED'].includes(item.status)) {
      throw new Error('This Deliverable Item cannot be issued from its current state.');
    }

    let informationRevisionId: string | null = null;
    let revisionLabel = item.currentRevisionLabel;
    if (item.informationContainerId) {
      const revision = await queryOne<
        RowDataPacket & { id: string; revisionCode: string; lifecycleStatus: string }
      >(
        `SELECT ir.id,
                ir.revision_code AS revisionCode,
                ir.lifecycle_status AS lifecycleStatus
           FROM information_revisions ir
           JOIN information_containers ic
             ON ic.id = ir.container_id
            AND ic.tenant_id = ir.tenant_id
          WHERE ir.tenant_id = ?
            AND ir.container_id = ?
            AND ir.revision_no = ic.current_revision_no`,
        [context.tenantId, item.informationContainerId],
        connection
      );
      if (!revision) throw new Error('Current Information Revision not found.');
      if (revision.lifecycleStatus !== 'ISSUED') {
        throw new Error(
          'Controlled information must be approved and issued before the Deliverable Item can be transmitted.'
        );
      }
      informationRevisionId = revision.id;
      revisionLabel = revision.revisionCode;
    }

    const issueId = randomUUID();
    const timestampNow = now();
    await executeMutation(
      `INSERT INTO deliverable_issues
        (id, tenant_id, deliverable_item_id, issue_ref, issue_type, information_revision_id,
         revision_label, purpose_of_issue, suitability_code, issued_by_party_id,
         issued_at, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ISSUED', ?)`,
      [
        issueId,
        context.tenantId,
        item.id,
        code(input.issueRef, 'Issue reference'),
        input.issueType?.trim().toUpperCase() || 'TRANSMITTAL',
        informationRevisionId,
        revisionLabel,
        optional(input.purposeOfIssue),
        optionalCode(input.suitabilityCode, 'Suitability code', 64),
        context.actorPartyId,
        timestampNow,
        timestampNow
      ],
      connection
    );

    if (input.recipientPartyId?.trim()) {
      const recipient = await queryOne<RowDataPacket & { id: string }>(
        "SELECT id FROM parties WHERE id = ? AND tenant_id = ? AND status = 'ACTIVE'",
        [input.recipientPartyId.trim(), context.tenantId],
        connection
      );
      if (!recipient) throw new Error('Active recipient Party not found.');
      await executeMutation(
        `INSERT INTO deliverable_issue_recipients
          (id, tenant_id, deliverable_issue_id, recipient_party_id, recipient_role,
           response_status, response_decision_id, response_note, responded_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'AWAITING_RESPONSE', NULL, NULL, NULL, ?, ?)`,
        [
          randomUUID(),
          context.tenantId,
          issueId,
          recipient.id,
          optional(input.recipientRole),
          timestampNow,
          timestampNow
        ],
        connection
      );
    }

    const result = await executeMutation(
      `UPDATE deliverable_items
          SET status = 'ISSUED',
              current_revision_label = ?,
              version = version + 1,
              updated_at = ?
        WHERE id = ? AND tenant_id = ? AND version = ?`,
      [revisionLabel, timestampNow, item.id, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Deliverable Item change detected.');

    await evidence(
      context,
      {
        objectType: 'deliverable_item',
        objectId: item.id,
        action: 'DELIVERABLE_ITEM_ISSUED',
        fromState: item.status,
        toState: 'ISSUED',
        version: item.version + 1,
        payload: { issueId, revisionLabel, informationRevisionId }
      },
      connection
    );
    return issueId;
  });
}
