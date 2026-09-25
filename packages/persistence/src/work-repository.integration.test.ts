import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  asId,
  type CanonicalObjectIdentity,
  type EvidenceRecord,
  type JobProfile,
  type Organisation,
  type OrganisationUnit,
  type Party,
  type Person,
  type Position,
  type PositionOccupancy,
  type Tenant,
  type WorkAssignment,
  type WorkItem,
  type WorkflowDefinition,
  type WorkflowDefinitionVersion,
  type WorkflowInstance
} from '@nublox/kernel';
import { MySqlKernelControlRepository } from './control-repository.js';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';
import { MySqlWorkRepository } from './work-repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('MySQL shared workflow and work runtime', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('coordinates assigned work, My Work, history, escalation, evidence and workflow completion without changing subject lifecycle', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = `WORK-${Date.now().toString(36)}`;
    const tenantId = asId<'TenantId'>(`TENANT-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const control = new MySqlKernelControlRepository(pool);
    const work = new MySqlWorkRepository(pool);

    const tenant: Tenant = {
      id: tenantId,
      name: 'Workflow Runtime Test',
      status: 'ACTIVE'
    };
    await kernel.createTenant(tenant);

    const personParty: Party = {
      id: asId<'PartyId'>(`PARTY-P-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Workflow Worker',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, personParty);

    const person: Person = {
      id: asId<'PersonId'>(`PERSON-${suffix}`, 'Person'),
      tenantId,
      partyId: personParty.id,
      legalName: 'Workflow Worker',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, person);

    const organisationParty: Party = {
      id: asId<'PartyId'>(`PARTY-O-${suffix}`, 'Party'),
      tenantId,
      kind: 'ORGANISATION',
      displayName: 'Workflow Test Ltd',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, organisationParty, {
      actorPersonId: person.id
    });

    const organisation: Organisation = {
      id: asId<'OrganisationId'>(`ORG-${suffix}`, 'Organisation'),
      tenantId,
      partyId: organisationParty.id,
      legalName: 'Workflow Test Ltd',
      status: 'ACTIVE'
    };
    await kernel.createOrganisation(tenantId, organisation, {
      actorPersonId: person.id
    });

    const unit: OrganisationUnit = {
      id: asId<'OrganisationUnitId'>(`UNIT-${suffix}`, 'Organisation Unit'),
      tenantId,
      organisationId: organisation.id,
      code: 'DESIGN',
      name: 'Design',
      status: 'ACTIVE'
    };
    await kernel.createOrganisationUnit(tenantId, unit, {
      actorPersonId: person.id
    });

    const profile: JobProfile = {
      id: asId<'JobProfileId'>(`JOB-${suffix}`, 'Job Profile'),
      catalogueScope: 'TENANT',
      tenantId,
      code: 'DESIGNER',
      name: 'Designer',
      status: 'ACTIVE'
    };
    await kernel.createJobProfile(profile, { actorPersonId: person.id });

    const position: Position = {
      id: asId<'PositionId'>(`POS-${suffix}`, 'Position'),
      tenantId,
      organisationUnitId: unit.id,
      jobProfileId: profile.id,
      code: 'DESIGN-01',
      title: 'Designer',
      lifecycleStatus: 'APPROVED',
      incumbencyModel: 'SINGLE',
      authorisedFte: 1,
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await kernel.createPosition(tenantId, position, {
      actorPersonId: person.id
    });

    const occupancy: PositionOccupancy = {
      id: asId<'PositionOccupancyId'>(`OCC-${suffix}`, 'Position Occupancy'),
      tenantId,
      positionId: position.id,
      personId: person.id,
      effectiveFrom: '2026-09-01T00:00:00.000Z'
    };
    await kernel.createPositionOccupancy(tenantId, occupancy, {
      actorPersonId: person.id
    });

    const subject: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`OBJ-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'DELIVERABLE_ITEM',
      stableKey: `A-1001-${suffix}`,
      createdAt: '2026-09-20T09:00:00.000Z'
    };
    await kernel.createCanonicalObject(tenantId, subject, {
      actorPersonId: person.id
    });

    const definition: WorkflowDefinition = {
      id: asId<'WorkflowDefinitionId'>(`WF-D-${suffix}`, 'Workflow Definition'),
      tenantId,
      code: `DELIVERABLE-AUTHORING-${suffix}`,
      name: 'Deliverable Authoring',
      status: 'ACTIVE'
    };
    await work.createWorkflowDefinition(tenantId, definition, {
      actorPersonId: person.id
    });

    const version: WorkflowDefinitionVersion = {
      id: asId<'WorkflowDefinitionVersionId'>(`WF-DV-${suffix}`, 'Workflow Definition Version'),
      tenantId,
      workflowDefinitionId: definition.id,
      version: 1,
      status: 'PUBLISHED',
      effectiveFrom: '2026-09-20T00:00:00.000Z'
    };
    await work.createWorkflowDefinitionVersion(tenantId, version, {
      actorPersonId: person.id
    });

    const workflow: WorkflowInstance = {
      id: asId<'WorkflowInstanceId'>(`WF-I-${suffix}`, 'Workflow Instance'),
      tenantId,
      workflowDefinitionId: definition.id,
      workflowDefinitionVersionId: version.id,
      subjectObjectId: subject.id,
      subjectVersion: 'A',
      status: 'ACTIVE',
      startedAt: '2026-09-20T10:00:00.000Z'
    };
    await work.startWorkflow(tenantId, workflow, {
      actorPersonId: person.id,
      correlationId: suffix
    });

    const firstWork: WorkItem = {
      id: asId<'WorkItemId'>(`WORK-1-${suffix}`, 'Work Item'),
      tenantId,
      workflowInstanceId: workflow.id,
      workType: 'AUTHOR_DELIVERABLE',
      subjectObjectId: subject.id,
      subjectVersion: 'A',
      title: 'Author drawing A-1001',
      status: 'READY',
      priority: 'NORMAL',
      dueAt: '2026-09-20T11:00:00.000Z',
      sequence: 1
    };
    await work.createWorkItem(tenantId, firstWork, {
      actorPersonId: person.id
    });

    const secondWork: WorkItem = {
      id: asId<'WorkItemId'>(`WORK-2-${suffix}`, 'Work Item'),
      tenantId,
      workflowInstanceId: workflow.id,
      workType: 'CHECK_DELIVERABLE',
      subjectObjectId: subject.id,
      subjectVersion: 'A',
      title: 'Check drawing A-1001',
      status: 'READY',
      priority: 'HIGH',
      sequence: 2
    };
    await work.createWorkItem(tenantId, secondWork, {
      actorPersonId: person.id
    });

    const assignment: WorkAssignment = {
      id: asId<'WorkAssignmentId'>(`ASG-${suffix}`, 'Work Assignment'),
      tenantId,
      workflowInstanceId: workflow.id,
      workItemId: firstWork.id,
      assigneeType: 'POSITION',
      assigneeId: position.id,
      responsibilityRole: 'RESPONSIBLE',
      assignedAt: '2026-09-20T10:05:00.000Z',
      effectiveFrom: '2026-09-20T10:05:00.000Z',
      status: 'ACTIVE'
    };
    const assigned = await work.assignWork(tenantId, assignment, {
      actorPersonId: person.id
    });
    expect(assigned.status).toBe('ASSIGNED');

    const myWork = await work.listMyWork(
      tenantId,
      person.id,
      '2026-09-20T12:00:00.000Z'
    );
    expect(myWork).toHaveLength(1);
    expect(myWork[0]?.workItem.id).toBe(firstWork.id);
    expect(myWork[0]?.assignedThrough).toBe('POSITION');
    expect(myWork[0]?.responsibilityRole).toBe('RESPONSIBLE');
    expect(myWork[0]?.isOverdue).toBe(true);

    await work.startWorkItem(
      tenantId,
      firstWork.id,
      '2026-09-20T12:01:00.000Z',
      { actorPersonId: person.id }
    );
    await work.blockWorkItem(
      tenantId,
      firstWork.id,
      '2026-09-20T12:05:00.000Z',
      'Awaiting technical input.',
      { actorPersonId: person.id }
    );
    await work.resumeWorkItem(
      tenantId,
      firstWork.id,
      '2026-09-20T12:10:00.000Z',
      { actorPersonId: person.id }
    );

    const escalated = await work.escalateWorkItem(
      tenantId,
      firstWork.id,
      '2026-09-20T12:15:00.000Z',
      'Overdue deliverable.',
      { actorPersonId: person.id }
    );
    expect(escalated.priority).toBe('HIGH');

    const completed = await work.completeWorkItem(
      tenantId,
      firstWork.id,
      '2026-09-20T13:00:00.000Z',
      'Drawing authored and checked for completeness.',
      { actorPersonId: person.id, correlationId: suffix }
    );
    expect(completed.status).toBe('COMPLETED');

    const evidence: EvidenceRecord = {
      id: asId<'EvidenceRecordId'>(`EVIDENCE-${suffix}`, 'Evidence'),
      tenantId,
      evidenceType: 'WORK_COMPLETION',
      subjectObjectId: subject.id,
      subjectVersion: 'A',
      capturedByPersonId: person.id,
      capturedAt: '2026-09-20T13:01:00.000Z',
      contentReference: `urn:nublox:work:${firstWork.id}`,
      integrityHash: 'sha256:workflow-work-test'
    };
    await control.recordEvidence(tenantId, evidence, {
      actorPersonId: person.id,
      correlationId: suffix
    });
    await work.linkCompletionEvidence(
      tenantId,
      firstWork.id,
      evidence.id,
      { actorPersonId: person.id, correlationId: suffix }
    );

    await expect(
      work.completeWorkflow(
        tenantId,
        workflow.id,
        '2026-09-20T13:10:00.000Z',
        'Workflow complete.',
        { actorPersonId: person.id }
      )
    ).rejects.toThrow('Workflow cannot complete while open Work Items remain.');

    await work.cancelWorkItem(
      tenantId,
      secondWork.id,
      '2026-09-20T13:11:00.000Z',
      'Checker task no longer required.',
      { actorPersonId: person.id }
    );

    const workflowCompleted = await work.completeWorkflow(
      tenantId,
      workflow.id,
      '2026-09-20T13:12:00.000Z',
      'All required work is closed.',
      { actorPersonId: person.id, correlationId: suffix }
    );
    expect(workflowCompleted.status).toBe('COMPLETED');

    const [lifecycleRows] = await pool.query(
      'SELECT COUNT(*) AS count FROM object_lifecycle_states WHERE tenant_id = ? AND canonical_object_id = ?',
      [tenantId, subject.id]
    );
    expect(Number((lifecycleRows as Array<{ count: number }>)[0]?.count)).toBe(0);

    const [historyRows] = await pool.query(
      `SELECT status, note
         FROM work_item_history
        WHERE tenant_id = ? AND work_item_id = ?
        ORDER BY history_id`,
      [tenantId, firstWork.id]
    );
    expect((historyRows as Array<{ status: string }>).map((row) => row.status)).toEqual([
      'READY',
      'ASSIGNED',
      'IN_PROGRESS',
      'BLOCKED',
      'IN_PROGRESS',
      'IN_PROGRESS',
      'COMPLETED'
    ]);

    const [evidenceLinks] = await pool.query(
      `SELECT evidence_record_id
         FROM work_completion_evidence
        WHERE tenant_id = ? AND work_item_id = ?`,
      [tenantId, firstWork.id]
    );
    expect(evidenceLinks).toEqual([
      expect.objectContaining({ evidence_record_id: evidence.id })
    ]);
  });

  it('cancels open Work coherently when an active Workflow is cancelled', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = `CANCEL-${Date.now().toString(36)}`;
    const tenantId = asId<'TenantId'>(`TENANT-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const work = new MySqlWorkRepository(pool);

    await kernel.createTenant({
      id: tenantId,
      name: 'Workflow Cancellation Test',
      status: 'ACTIVE'
    });

    const subject: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`OBJ-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'PROJECT',
      stableKey: `PROJECT-${suffix}`,
      createdAt: '2026-09-20T09:00:00.000Z'
    };
    await kernel.createCanonicalObject(tenantId, subject);

    const definition: WorkflowDefinition = {
      id: asId<'WorkflowDefinitionId'>(`WF-D-${suffix}`, 'Workflow Definition'),
      tenantId,
      code: `PROJECT-WORK-${suffix}`,
      name: 'Project Work',
      status: 'ACTIVE'
    };
    await work.createWorkflowDefinition(tenantId, definition);

    const version: WorkflowDefinitionVersion = {
      id: asId<'WorkflowDefinitionVersionId'>(`WF-V-${suffix}`, 'Workflow Definition Version'),
      tenantId,
      workflowDefinitionId: definition.id,
      version: 1,
      status: 'PUBLISHED'
    };
    await work.createWorkflowDefinitionVersion(tenantId, version);

    const workflow: WorkflowInstance = {
      id: asId<'WorkflowInstanceId'>(`WF-I-${suffix}`, 'Workflow Instance'),
      tenantId,
      workflowDefinitionId: definition.id,
      workflowDefinitionVersionId: version.id,
      subjectObjectId: subject.id,
      status: 'ACTIVE',
      startedAt: '2026-09-20T10:00:00.000Z'
    };
    await work.startWorkflow(tenantId, workflow);

    const workItem: WorkItem = {
      id: asId<'WorkItemId'>(`WORK-${suffix}`, 'Work Item'),
      tenantId,
      workflowInstanceId: workflow.id,
      workType: 'PROJECT_TASK',
      subjectObjectId: subject.id,
      title: 'Open project task',
      status: 'READY',
      priority: 'NORMAL',
      sequence: 1
    };
    await work.createWorkItem(tenantId, workItem);

    const cancelled = await work.cancelWorkflow(
      tenantId,
      workflow.id,
      '2026-09-20T10:30:00.000Z',
      'Project work superseded.'
    );
    expect(cancelled.status).toBe('CANCELLED');

    const cancelledWork = await work.getWorkItem(tenantId, workItem.id);
    expect(cancelledWork.status).toBe('CANCELLED');
  });
});
