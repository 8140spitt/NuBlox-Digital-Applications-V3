import {
  blockWork,
  cancelWork,
  cancelWorkflow,
  completeWork,
  completeWorkflow,
  createWorkAssignment,
  createWorkItem,
  createWorkflowDefinition,
  createWorkflowDefinitionVersion,
  createWorkflowInstance,
  escalateWork,
  markWorkAssigned,
  publishWorkflowDefinitionVersion,
  resumeWork,
  retireWorkflowDefinitionVersion,
  startWork,
  type CanonicalObjectIdentity,
  type EvidenceRecordId,
  type MyWorkProjectionItem,
  type TenantId,
  type WorkAssignment,
  type WorkAssigneeType,
  type WorkItem,
  type WorkflowDefinition,
  type WorkflowDefinitionVersion,
  type WorkflowInstance
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

interface WorkflowDefinitionRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description: string | null;
  status: WorkflowDefinition['status'];
}

interface WorkflowVersionRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  workflow_definition_id: string;
  version: number;
  status: WorkflowDefinitionVersion['status'];
  effective_from: Date | null;
  effective_to: Date | null;
}

interface WorkflowInstanceRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  workflow_definition_id: string;
  workflow_definition_version_id: string;
  subject_object_id: string;
  subject_version: string | null;
  status: WorkflowInstance['status'];
  started_at: Date;
  completed_at: Date | null;
  completion_reason: string | null;
  row_version: number;
}

interface WorkItemRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  workflow_instance_id: string;
  work_type: string;
  subject_object_id: string;
  subject_version: string | null;
  title: string;
  instructions: string | null;
  status: WorkItem['status'];
  priority: WorkItem['priority'];
  due_at: Date | null;
  sequence: number;
  completion_note: string | null;
  completed_at: Date | null;
  row_version: number;
}

interface CanonicalObjectRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  object_type: string;
  stable_key: string;
  created_at: Date;
}

interface PrincipalRow extends RowDataPacket {
  id: string;
  tenant_id: string;
}

interface EvidenceRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  subject_object_id: string;
  subject_version: string | null;
}

interface CountRow extends RowDataPacket {
  count: number | string;
}

interface MyWorkRow extends WorkItemRow {
  assignment_id: string;
  responsibility_role: WorkAssignment['responsibilityRole'];
  assignee_type: WorkAssigneeType;
}

function databaseDate(value: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date/time value: ${value}`);
  }

  return date;
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
}

function mapWorkflowDefinition(row: WorkflowDefinitionRow): WorkflowDefinition {
  return {
    id: row.id as WorkflowDefinition['id'],
    tenantId: row.tenant_id as TenantId,
    code: row.code,
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    status: row.status
  };
}

function mapWorkflowVersion(row: WorkflowVersionRow): WorkflowDefinitionVersion {
  return {
    id: row.id as WorkflowDefinitionVersion['id'],
    tenantId: row.tenant_id as TenantId,
    workflowDefinitionId:
      row.workflow_definition_id as WorkflowDefinitionVersion['workflowDefinitionId'],
    version: Number(row.version),
    status: row.status,
    ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
    ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {})
  };
}

function mapWorkflowInstance(row: WorkflowInstanceRow): WorkflowInstance {
  return {
    id: row.id as WorkflowInstance['id'],
    tenantId: row.tenant_id as TenantId,
    workflowDefinitionId:
      row.workflow_definition_id as WorkflowInstance['workflowDefinitionId'],
    workflowDefinitionVersionId:
      row.workflow_definition_version_id as WorkflowInstance['workflowDefinitionVersionId'],
    subjectObjectId: row.subject_object_id as WorkflowInstance['subjectObjectId'],
    ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
    status: row.status,
    startedAt: row.started_at.toISOString(),
    ...(row.completed_at ? { completedAt: row.completed_at.toISOString() } : {}),
    ...(row.completion_reason ? { completionReason: row.completion_reason } : {})
  };
}

function mapWorkItem(row: WorkItemRow): WorkItem {
  return {
    id: row.id as WorkItem['id'],
    tenantId: row.tenant_id as TenantId,
    workflowInstanceId: row.workflow_instance_id as WorkItem['workflowInstanceId'],
    workType: row.work_type,
    subjectObjectId: row.subject_object_id as WorkItem['subjectObjectId'],
    ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
    title: row.title,
    ...(row.instructions ? { instructions: row.instructions } : {}),
    status: row.status,
    priority: row.priority,
    ...(row.due_at ? { dueAt: row.due_at.toISOString() } : {}),
    sequence: Number(row.sequence),
    ...(row.completion_note ? { completionNote: row.completion_note } : {}),
    ...(row.completed_at ? { completedAt: row.completed_at.toISOString() } : {})
  };
}

function mapCanonicalObject(row: CanonicalObjectRow): CanonicalObjectIdentity {
  return {
    id: row.id as CanonicalObjectIdentity['id'],
    tenantId: row.tenant_id as TenantId,
    objectType: row.object_type,
    stableKey: row.stable_key,
    createdAt: row.created_at.toISOString()
  };
  await writeOutboxEvent(connection, {
    tenantId,
    aggregateType: entityType,
    aggregateId: entityId,
    eventType: `${entityType}.${action}`,
    payload
  });

}

export class MySqlWorkRepository {
  constructor(private readonly pool: Pool) {}

  async createWorkflowDefinition(
    tenantId: TenantId,
    definition: WorkflowDefinition,
    audit: AuditContext = {}
  ): Promise<void> {
    if (definition.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    createWorkflowDefinition(definition);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO workflow_definitions
          (id, tenant_id, code, name, description, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          definition.id,
          definition.tenantId,
          definition.code,
          definition.name,
          definition.description ?? null,
          definition.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(
        connection,
        definition.tenantId,
        'WORKFLOW_DEFINITION',
        definition.id,
        'CREATED',
        audit,
        definition
      );
    });
  }

  async createWorkflowDefinitionVersion(
    tenantId: TenantId,
    version: WorkflowDefinitionVersion,
    audit: AuditContext = {}
  ): Promise<void> {
    if (version.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const definition = await this.requireWorkflowDefinition(
      version.tenantId,
      version.workflowDefinitionId
    );
    createWorkflowDefinitionVersion(version, definition);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO workflow_definition_versions
          (id, tenant_id, workflow_definition_id, version, status,
           effective_from, effective_to, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          version.id,
          version.tenantId,
          version.workflowDefinitionId,
          version.version,
          version.status,
          version.effectiveFrom ? databaseDate(version.effectiveFrom) : null,
          version.effectiveTo ? databaseDate(version.effectiveTo) : null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(
        connection,
        version.tenantId,
        'WORKFLOW_DEFINITION_VERSION',
        version.id,
        'CREATED',
        audit,
        version
      );
    });
  }

  async publishWorkflowDefinitionVersion(
    tenantId: TenantId,
    versionId: WorkflowDefinitionVersion['id'],
    effectiveFrom: string,
    audit: AuditContext = {}
  ): Promise<WorkflowDefinitionVersion> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireWorkflowDefinitionVersionForUpdate(
        connection,
        tenantId,
        versionId
      );
      const current = mapWorkflowVersion(row);
      const next = publishWorkflowDefinitionVersion(current, effectiveFrom);

      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE workflow_definition_versions
            SET status = ?, effective_from = ?
          WHERE tenant_id = ? AND id = ? AND status = 'DRAFT'`,
        [next.status, databaseDate(effectiveFrom), tenantId, versionId]
      );
      if (result.affectedRows !== 1) {
        throw new Error('Concurrent Workflow Definition Version publication detected.');
      }

      await writeAudit(
        connection,
        tenantId,
        'WORKFLOW_DEFINITION_VERSION',
        versionId,
        'PUBLISHED',
        audit,
        next
      );
      return next;
    });
  }

  async retireWorkflowDefinitionVersion(
    tenantId: TenantId,
    versionId: WorkflowDefinitionVersion['id'],
    effectiveTo: string,
    audit: AuditContext = {}
  ): Promise<WorkflowDefinitionVersion> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireWorkflowDefinitionVersionForUpdate(
        connection,
        tenantId,
        versionId
      );
      const current = mapWorkflowVersion(row);
      const next = retireWorkflowDefinitionVersion(current, effectiveTo);

      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE workflow_definition_versions
            SET status = ?, effective_to = ?
          WHERE tenant_id = ? AND id = ? AND status = 'PUBLISHED'`,
        [next.status, databaseDate(effectiveTo), tenantId, versionId]
      );
      if (result.affectedRows !== 1) {
        throw new Error('Concurrent Workflow Definition Version retirement detected.');
      }

      await writeAudit(
        connection,
        tenantId,
        'WORKFLOW_DEFINITION_VERSION',
        versionId,
        'RETIRED',
        audit,
        next
      );
      return next;
    });
  }

  async startWorkflow(
    tenantId: TenantId,
    workflow: WorkflowInstance,
    audit: AuditContext = {}
  ): Promise<void> {
    if (workflow.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }

    const [definition, version, subject] = await Promise.all([
      this.requireWorkflowDefinition(workflow.tenantId, workflow.workflowDefinitionId),
      this.requireWorkflowDefinitionVersion(
        workflow.tenantId,
        workflow.workflowDefinitionVersionId
      ),
      this.requireCanonicalObject(workflow.tenantId, workflow.subjectObjectId)
    ]);

    createWorkflowInstance(workflow, definition, version, subject);

    const at = databaseDate(workflow.startedAt);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO workflow_instances
          (id, tenant_id, workflow_definition_id, workflow_definition_version_id,
           subject_object_id, subject_version, status, started_at,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          workflow.id,
          workflow.tenantId,
          workflow.workflowDefinitionId,
          workflow.workflowDefinitionVersionId,
          workflow.subjectObjectId,
          workflow.subjectVersion ?? null,
          workflow.status,
          at,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await this.insertWorkflowHistory(
        connection,
        workflow,
        workflow.startedAt,
        'Workflow started.',
        audit
      );
      await writeAudit(
        connection,
        workflow.tenantId,
        'WORKFLOW_INSTANCE',
        workflow.id,
        'STARTED',
        audit,
        workflow
      );
    });
  }

  async createWorkItem(
    tenantId: TenantId,
    workItem: WorkItem,
    audit: AuditContext = {}
  ): Promise<void> {
    if (workItem.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }

    const [workflow, subject] = await Promise.all([
      this.requireWorkflowInstance(workItem.tenantId, workItem.workflowInstanceId),
      this.requireCanonicalObject(workItem.tenantId, workItem.subjectObjectId)
    ]);
    createWorkItem(workItem, workflow, subject);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO work_items
          (id, tenant_id, workflow_instance_id, work_type, subject_object_id,
           subject_version, title, instructions, status, priority, due_at, sequence,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          workItem.id,
          workItem.tenantId,
          workItem.workflowInstanceId,
          workItem.workType,
          workItem.subjectObjectId,
          workItem.subjectVersion ?? null,
          workItem.title,
          workItem.instructions ?? null,
          workItem.status,
          workItem.priority,
          workItem.dueAt ? databaseDate(workItem.dueAt) : null,
          workItem.sequence,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await this.insertWorkHistory(
        connection,
        workItem,
        new Date().toISOString(),
        'Work created.',
        audit
      );
      await writeAudit(
        connection,
        workItem.tenantId,
        'WORK_ITEM',
        workItem.id,
        'CREATED',
        audit,
        workItem
      );
    });
  }

  async assignWork(
    tenantId: TenantId,
    assignment: WorkAssignment,
    audit: AuditContext = {}
  ): Promise<WorkItem> {
    if (assignment.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }

    return withTransaction(this.pool, async (connection) => {
      const workflow = await this.requireWorkflowInstance(
        assignment.tenantId,
        assignment.workflowInstanceId,
        connection
      );
      const row = await this.requireWorkItemForUpdate(
        connection,
        assignment.tenantId,
        assignment.workItemId
      );
      const current = mapWorkItem(row);

      await this.requireAssignee(
        assignment.tenantId,
        assignment.assigneeType,
        assignment.assigneeId,
        connection
      );
      createWorkAssignment(assignment, workflow, current);

      await connection.execute(
        `INSERT INTO work_assignments
          (id, tenant_id, workflow_instance_id, work_item_id, assignee_type, assignee_id,
           responsibility_role, assigned_at, effective_from, effective_to, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          assignment.id,
          assignment.tenantId,
          assignment.workflowInstanceId,
          assignment.workItemId,
          assignment.assigneeType,
          assignment.assigneeId,
          assignment.responsibilityRole,
          databaseDate(assignment.assignedAt),
          databaseDate(assignment.effectiveFrom),
          assignment.effectiveTo ? databaseDate(assignment.effectiveTo) : null,
          assignment.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );

      let next = current;
      if (current.status === 'READY') {
        next = markWorkAssigned(current);
        await this.updateWorkItem(connection, current, next, audit);
        await this.insertWorkHistory(
          connection,
          next,
          assignment.assignedAt,
          'Work assigned.',
          audit
        );
      }

      await writeAudit(
        connection,
        assignment.tenantId,
        'WORK_ASSIGNMENT',
        assignment.id,
        'ASSIGNED',
        audit,
        assignment
      );

      return next;
    });
  }

  async startWorkItem(
    tenantId: TenantId,
    workItemId: WorkItem['id'],
    at: string,
    audit: AuditContext = {}
  ): Promise<WorkItem> {
    return this.transitionWorkItem(
      tenantId,
      workItemId,
      at,
      'STARTED',
      'Work started.',
      startWork,
      audit
    );
  }

  async blockWorkItem(
    tenantId: TenantId,
    workItemId: WorkItem['id'],
    at: string,
    reason: string,
    audit: AuditContext = {}
  ): Promise<WorkItem> {
    if (!reason.trim()) throw new Error('Block reason is required.');
    return this.transitionWorkItem(
      tenantId,
      workItemId,
      at,
      'BLOCKED',
      reason,
      blockWork,
      audit
    );
  }

  async resumeWorkItem(
    tenantId: TenantId,
    workItemId: WorkItem['id'],
    at: string,
    audit: AuditContext = {}
  ): Promise<WorkItem> {
    return this.transitionWorkItem(
      tenantId,
      workItemId,
      at,
      'RESUMED',
      'Work resumed.',
      resumeWork,
      audit
    );
  }

  async completeWorkItem(
    tenantId: TenantId,
    workItemId: WorkItem['id'],
    completedAt: string,
    completionNote: string,
    audit: AuditContext = {}
  ): Promise<WorkItem> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireWorkItemForUpdate(connection, tenantId, workItemId);
      const current = mapWorkItem(row);
      const next = completeWork(current, completedAt, completionNote);
      await this.updateWorkItem(connection, current, next, audit);
      await this.insertWorkHistory(connection, next, completedAt, completionNote, audit);
      await writeAudit(
        connection,
        tenantId,
        'WORK_ITEM',
        workItemId,
        'COMPLETED',
        audit,
        next
      );
      return next;
    });
  }

  async cancelWorkItem(
    tenantId: TenantId,
    workItemId: WorkItem['id'],
    cancelledAt: string,
    reason: string,
    audit: AuditContext = {}
  ): Promise<WorkItem> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireWorkItemForUpdate(connection, tenantId, workItemId);
      const current = mapWorkItem(row);
      const next = cancelWork(current, cancelledAt, reason);
      await this.updateWorkItem(connection, current, next, audit);
      await this.insertWorkHistory(connection, next, cancelledAt, reason, audit);
      await writeAudit(
        connection,
        tenantId,
        'WORK_ITEM',
        workItemId,
        'CANCELLED',
        audit,
        { reason }
      );
      return next;
    });
  }

  async escalateWorkItem(
    tenantId: TenantId,
    workItemId: WorkItem['id'],
    at: string,
    reason: string,
    audit: AuditContext = {}
  ): Promise<WorkItem> {
    if (!reason.trim()) throw new Error('Escalation reason is required.');
    databaseDate(at);

    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireWorkItemForUpdate(connection, tenantId, workItemId);
      const current = mapWorkItem(row);
      const next = escalateWork(current);

      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE work_items
            SET priority = ?, row_version = row_version + 1, updated_by_person_id = ?
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          next.priority,
          audit.actorPersonId ?? null,
          tenantId,
          workItemId,
          row.row_version
        ]
      );
      if (result.affectedRows !== 1) {
        throw new Error('Concurrent Work Item update detected.');
      }

      await this.insertWorkHistory(
        connection,
        next,
        at,
        `Priority escalated from ${current.priority} to ${next.priority}. ${reason}`,
        audit
      );
      await writeAudit(
        connection,
        tenantId,
        'WORK_ITEM',
        workItemId,
        'ESCALATED',
        audit,
        { fromPriority: current.priority, toPriority: next.priority, reason }
      );
      return next;
    });
  }

  async completeWorkflow(
    tenantId: TenantId,
    workflowInstanceId: WorkflowInstance['id'],
    completedAt: string,
    completionReason: string,
    audit: AuditContext = {}
  ): Promise<WorkflowInstance> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireWorkflowInstanceForUpdate(
        connection,
        tenantId,
        workflowInstanceId
      );
      const current = mapWorkflowInstance(row);

      const [counts] = await connection.execute<CountRow[]>(
        `SELECT COUNT(*) AS count
           FROM work_items
          WHERE tenant_id = ?
            AND workflow_instance_id = ?
            AND status NOT IN ('COMPLETED', 'CANCELLED')`,
        [tenantId, workflowInstanceId]
      );
      if (Number(counts[0]?.count ?? 0) > 0) {
        throw new Error('Workflow cannot complete while open Work Items remain.');
      }

      const next = completeWorkflow(current, completedAt, completionReason);
      await this.updateWorkflowInstance(connection, row, next, audit);
      await this.insertWorkflowHistory(
        connection,
        next,
        completedAt,
        completionReason,
        audit
      );
      await writeAudit(
        connection,
        tenantId,
        'WORKFLOW_INSTANCE',
        workflowInstanceId,
        'COMPLETED',
        audit,
        next
      );
      return next;
    });
  }

  async cancelWorkflow(
    tenantId: TenantId,
    workflowInstanceId: WorkflowInstance['id'],
    cancelledAt: string,
    reason: string,
    audit: AuditContext = {}
  ): Promise<WorkflowInstance> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireWorkflowInstanceForUpdate(
        connection,
        tenantId,
        workflowInstanceId
      );
      const current = mapWorkflowInstance(row);
      const next = cancelWorkflow(current, cancelledAt, reason);

      const [openRows] = await connection.execute<WorkItemRow[]>(
        `SELECT id, tenant_id, workflow_instance_id, work_type, subject_object_id,
                subject_version, title, instructions, status, priority, due_at, sequence,
                completion_note, completed_at, row_version
           FROM work_items
          WHERE tenant_id = ?
            AND workflow_instance_id = ?
            AND status NOT IN ('COMPLETED', 'CANCELLED')
          FOR UPDATE`,
        [tenantId, workflowInstanceId]
      );

      for (const openRow of openRows) {
        const openWork = mapWorkItem(openRow);
        const cancelledWork = cancelWork(openWork, cancelledAt, reason);
        await this.updateWorkItem(connection, openWork, cancelledWork, audit);
        await this.insertWorkHistory(
          connection,
          cancelledWork,
          cancelledAt,
          `Workflow cancelled: ${reason}`,
          audit
        );
      }

      await this.updateWorkflowInstance(connection, row, next, audit);
      await this.insertWorkflowHistory(connection, next, cancelledAt, reason, audit);
      await writeAudit(
        connection,
        tenantId,
        'WORKFLOW_INSTANCE',
        workflowInstanceId,
        'CANCELLED',
        audit,
        { reason, cancelledOpenWorkItems: openRows.length }
      );
      return next;
    });
  }

  async linkCompletionEvidence(
    tenantId: TenantId,
    workItemId: WorkItem['id'],
    evidenceRecordId: EvidenceRecordId,
    audit: AuditContext = {}
  ): Promise<void> {
    await withTransaction(this.pool, async (connection) => {
      const row = await this.requireWorkItemForUpdate(connection, tenantId, workItemId);
      const work = mapWorkItem(row);
      if (work.status !== 'COMPLETED') {
        throw new Error('Completion Evidence can only be linked to completed Work.');
      }

      const evidence = await this.requireEvidence(
        tenantId,
        evidenceRecordId,
        connection
      );
      if (evidence.subject_object_id !== work.subjectObjectId) {
        throw new Error('Completion Evidence must reference the same subject as the Work Item.');
      }
      const evidenceVersion = evidence.subject_version ?? undefined;
      if (evidenceVersion !== work.subjectVersion) {
        throw new Error('Completion Evidence must reference the exact Work Item subject version.');
      }

      await connection.execute(
        `INSERT INTO work_completion_evidence
          (tenant_id, work_item_id, evidence_record_id, linked_by_person_id)
         VALUES (?, ?, ?, ?)`,
        [
          tenantId,
          workItemId,
          evidenceRecordId,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(
        connection,
        tenantId,
        'WORK_ITEM',
        workItemId,
        'EVIDENCE_LINKED',
        audit,
        { evidenceRecordId }
      );
    });
  }

  async listMyWork(
    tenantId: TenantId,
    personId: string,
    evaluatedAt = new Date().toISOString()
  ): Promise<MyWorkProjectionItem[]> {
    const at = databaseDate(evaluatedAt);
    const person = await this.findPrincipal(tenantId, 'PERSON', personId);
    if (!person) return [];

    const [rows] = await this.pool.execute<MyWorkRow[]>(
      `SELECT
          wi.id, wi.tenant_id, wi.workflow_instance_id, wi.work_type,
          wi.subject_object_id, wi.subject_version, wi.title, wi.instructions,
          wi.status, wi.priority, wi.due_at, wi.sequence, wi.completion_note,
          wi.completed_at, wi.row_version,
          wa.id AS assignment_id, wa.responsibility_role, wa.assignee_type
         FROM work_assignments wa
         JOIN work_items wi
           ON wi.tenant_id = wa.tenant_id
          AND wi.id = wa.work_item_id
        WHERE wa.tenant_id = ?
          AND wa.status = 'ACTIVE'
          AND wa.effective_from <= ?
          AND (wa.effective_to IS NULL OR wa.effective_to >= ?)
          AND wi.status NOT IN ('COMPLETED', 'CANCELLED')
          AND (
            (wa.assignee_type = 'PERSON' AND wa.assignee_id = ?)
            OR
            (wa.assignee_type = 'POSITION' AND wa.assignee_id IN (
              SELECT po.position_id
                FROM position_occupancies po
               WHERE po.tenant_id = ?
                 AND po.person_id = ?
                 AND po.effective_from <= ?
                 AND (po.effective_to IS NULL OR po.effective_to >= ?)
            ))
            OR
            (wa.assignee_type = 'ORGANISATION_UNIT' AND wa.assignee_id IN (
              SELECT DISTINCT p.organisation_unit_id
                FROM position_occupancies po
                JOIN positions p
                  ON p.tenant_id = po.tenant_id
                 AND p.id = po.position_id
               WHERE po.tenant_id = ?
                 AND po.person_id = ?
                 AND po.effective_from <= ?
                 AND (po.effective_to IS NULL OR po.effective_to >= ?)
                 AND p.status = 'ACTIVE'
            ))
          )
        ORDER BY
          CASE wa.assignee_type
            WHEN 'PERSON' THEN 1
            WHEN 'POSITION' THEN 2
            ELSE 3
          END,
          CASE wi.priority
            WHEN 'URGENT' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'NORMAL' THEN 3
            ELSE 4
          END,
          wi.due_at IS NULL,
          wi.due_at,
          wi.sequence`,
      [
        tenantId,
        at,
        at,
        personId,
        tenantId,
        personId,
        at,
        at,
        tenantId,
        personId,
        at,
        at
      ]
    );

    const seen = new Set<string>();
    const result: MyWorkProjectionItem[] = [];
    const evaluatedTime = Date.parse(evaluatedAt);

    for (const row of rows) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      const workItem = mapWorkItem(row);
      result.push({
        workItem,
        assignmentId: row.assignment_id as MyWorkProjectionItem['assignmentId'],
        responsibilityRole: row.responsibility_role,
        assignedThrough: row.assignee_type,
        isOverdue: Boolean(
          workItem.dueAt && Date.parse(workItem.dueAt) < evaluatedTime
        )
      });
    }

    return result;
  }

  async getWorkItem(
    tenantId: TenantId,
    workItemId: WorkItem['id']
  ): Promise<WorkItem> {
    const [rows] = await this.pool.execute<WorkItemRow[]>(
      `SELECT id, tenant_id, workflow_instance_id, work_type, subject_object_id,
              subject_version, title, instructions, status, priority, due_at, sequence,
              completion_note, completed_at, row_version
         FROM work_items
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, workItemId]
    );
    const row = rows[0];
    if (!row) throw new Error('Work Item not found in tenant.');
    return mapWorkItem(row);
  }

  private async transitionWorkItem(
    tenantId: TenantId,
    workItemId: WorkItem['id'],
    at: string,
    auditAction: string,
    note: string,
    transition: (work: WorkItem) => WorkItem,
    audit: AuditContext
  ): Promise<WorkItem> {
    databaseDate(at);

    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireWorkItemForUpdate(connection, tenantId, workItemId);
      const current = mapWorkItem(row);
      const next = transition(current);
      await this.updateWorkItem(connection, current, next, audit);
      await this.insertWorkHistory(connection, next, at, note, audit);
      await writeAudit(
        connection,
        tenantId,
        'WORK_ITEM',
        workItemId,
        auditAction,
        audit,
        next
      );
      return next;
    });
  }

  private async updateWorkItem(
    connection: PoolConnection,
    current: WorkItem,
    next: WorkItem,
    audit: AuditContext
  ): Promise<void> {
    const [rows] = await connection.execute<WorkItemRow[]>(
      `SELECT row_version
         FROM work_items
        WHERE tenant_id = ? AND id = ?
        FOR UPDATE`,
      [current.tenantId, current.id]
    );
    const rowVersion = rows[0]?.row_version;
    if (rowVersion === undefined) throw new Error('Work Item not found in tenant.');

    const [result] = await connection.execute<ResultSetHeader>(
      `UPDATE work_items
          SET status = ?, priority = ?, completion_note = ?, completed_at = ?,
              row_version = row_version + 1, updated_by_person_id = ?
        WHERE tenant_id = ? AND id = ? AND row_version = ?`,
      [
        next.status,
        next.priority,
        next.completionNote ?? null,
        next.completedAt ? databaseDate(next.completedAt) : null,
        audit.actorPersonId ?? null,
        current.tenantId,
        current.id,
        rowVersion
      ]
    );
    if (result.affectedRows !== 1) {
      throw new Error('Concurrent Work Item update detected.');
    }
  }

  private async updateWorkflowInstance(
    connection: PoolConnection,
    currentRow: WorkflowInstanceRow,
    next: WorkflowInstance,
    audit: AuditContext
  ): Promise<void> {
    const [result] = await connection.execute<ResultSetHeader>(
      `UPDATE workflow_instances
          SET status = ?, completed_at = ?, completion_reason = ?,
              row_version = row_version + 1, updated_by_person_id = ?
        WHERE tenant_id = ? AND id = ? AND row_version = ?`,
      [
        next.status,
        next.completedAt ? databaseDate(next.completedAt) : null,
        next.completionReason ?? null,
        audit.actorPersonId ?? null,
        next.tenantId,
        next.id,
        currentRow.row_version
      ]
    );
    if (result.affectedRows !== 1) {
      throw new Error('Concurrent Workflow Instance update detected.');
    }
  }

  private async insertWorkHistory(
    connection: PoolConnection,
    work: WorkItem,
    at: string,
    note: string,
    audit: AuditContext
  ): Promise<void> {
    await connection.execute(
      `INSERT INTO work_item_history
        (tenant_id, work_item_id, status, recorded_at, note,
         actor_person_id, correlation_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        work.tenantId,
        work.id,
        work.status,
        databaseDate(at),
        note,
        audit.actorPersonId ?? null,
        audit.correlationId ?? null
      ]
    );
  }

  private async insertWorkflowHistory(
    connection: PoolConnection,
    workflow: WorkflowInstance,
    at: string,
    reason: string,
    audit: AuditContext
  ): Promise<void> {
    await connection.execute(
      `INSERT INTO workflow_instance_history
        (tenant_id, workflow_instance_id, status, recorded_at, reason,
         actor_person_id, correlation_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        workflow.tenantId,
        workflow.id,
        workflow.status,
        databaseDate(at),
        reason,
        audit.actorPersonId ?? null,
        audit.correlationId ?? null
      ]
    );
  }

  private async requireWorkflowDefinition(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<WorkflowDefinition> {
    const [rows] = await connection.execute<WorkflowDefinitionRow[]>(
      `SELECT id, tenant_id, code, name, description, status
         FROM workflow_definitions WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Workflow Definition not found in tenant.');
    return mapWorkflowDefinition(row);
  }

  private async requireWorkflowDefinitionVersionForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: string
  ): Promise<WorkflowVersionRow> {
    const [rows] = await connection.execute<WorkflowVersionRow[]>(
      `SELECT id, tenant_id, workflow_definition_id, version, status,
              effective_from, effective_to
         FROM workflow_definition_versions
        WHERE tenant_id = ? AND id = ?
        FOR UPDATE`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Workflow Definition Version not found in tenant.');
    return row;
  }

  private async requireWorkflowDefinitionVersion(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<WorkflowDefinitionVersion> {
    const [rows] = await connection.execute<WorkflowVersionRow[]>(
      `SELECT id, tenant_id, workflow_definition_id, version, status,
              effective_from, effective_to
         FROM workflow_definition_versions
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Workflow Definition Version not found in tenant.');
    return mapWorkflowVersion(row);
  }

  private async requireWorkflowInstance(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<WorkflowInstance> {
    const [rows] = await connection.execute<WorkflowInstanceRow[]>(
      `SELECT id, tenant_id, workflow_definition_id, workflow_definition_version_id,
              subject_object_id, subject_version, status, started_at, completed_at,
              completion_reason, row_version
         FROM workflow_instances
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Workflow Instance not found in tenant.');
    return mapWorkflowInstance(row);
  }

  private async requireWorkflowInstanceForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: string
  ): Promise<WorkflowInstanceRow> {
    const [rows] = await connection.execute<WorkflowInstanceRow[]>(
      `SELECT id, tenant_id, workflow_definition_id, workflow_definition_version_id,
              subject_object_id, subject_version, status, started_at, completed_at,
              completion_reason, row_version
         FROM workflow_instances
        WHERE tenant_id = ? AND id = ?
        FOR UPDATE`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Workflow Instance not found in tenant.');
    return row;
  }

  private async requireCanonicalObject(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<CanonicalObjectIdentity> {
    const [rows] = await connection.execute<CanonicalObjectRow[]>(
      `SELECT id, tenant_id, object_type, stable_key, created_at
         FROM canonical_objects WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Canonical Object not found in tenant.');
    return mapCanonicalObject(row);
  }

  private async requireWorkItemForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: string
  ): Promise<WorkItemRow> {
    const [rows] = await connection.execute<WorkItemRow[]>(
      `SELECT id, tenant_id, workflow_instance_id, work_type, subject_object_id,
              subject_version, title, instructions, status, priority, due_at, sequence,
              completion_note, completed_at, row_version
         FROM work_items
        WHERE tenant_id = ? AND id = ?
        FOR UPDATE`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Work Item not found in tenant.');
    return row;
  }

  private async requireAssignee(
    tenantId: TenantId,
    assigneeType: WorkAssigneeType,
    assigneeId: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<void> {
    const table =
      assigneeType === 'PERSON'
        ? 'persons'
        : assigneeType === 'POSITION'
          ? 'positions'
          : 'organisation_units';
    const [rows] = await connection.execute<PrincipalRow[]>(
      `SELECT id, tenant_id FROM ${table} WHERE tenant_id = ? AND id = ?`,
      [tenantId, assigneeId]
    );
    if (!rows[0]) throw new Error('Work assignee not found in tenant.');
  }

  private async findPrincipal(
    tenantId: TenantId,
    assigneeType: WorkAssigneeType,
    assigneeId: string
  ): Promise<PrincipalRow | undefined> {
    const table =
      assigneeType === 'PERSON'
        ? 'persons'
        : assigneeType === 'POSITION'
          ? 'positions'
          : 'organisation_units';
    const [rows] = await this.pool.execute<PrincipalRow[]>(
      `SELECT id, tenant_id FROM ${table} WHERE tenant_id = ? AND id = ?`,
      [tenantId, assigneeId]
    );
    return rows[0];
  }

  private async requireEvidence(
    tenantId: TenantId,
    evidenceRecordId: EvidenceRecordId,
    connection: PoolConnection
  ): Promise<EvidenceRow> {
    const [rows] = await connection.execute<EvidenceRow[]>(
      `SELECT id, tenant_id, subject_object_id, subject_version
         FROM evidence_records WHERE tenant_id = ? AND id = ?`,
      [tenantId, evidenceRecordId]
    );
    const row = rows[0];
    if (!row) throw new Error('Evidence Record not found in tenant.');
    return row;
  }
}
