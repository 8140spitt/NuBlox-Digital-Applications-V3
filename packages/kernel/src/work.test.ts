import { describe, expect, it } from 'vitest';
import {
  KernelInvariantError,
  asId,
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
  retireWorkflowDefinitionVersion,
  startWork,
  type CanonicalObjectIdentity,
  type WorkAssignment,
  type WorkItem,
  type WorkflowDefinition,
  type WorkflowDefinitionVersion,
  type WorkflowInstance
} from './index.js';

const tenantId = asId<'TenantId'>('TENANT-WORK', 'Tenant');

const subject: CanonicalObjectIdentity = {
  id: asId<'CanonicalObjectId'>('OBJ-WORK-1', 'Canonical Object'),
  tenantId,
  objectType: 'DELIVERABLE_ITEM',
  stableKey: 'DEL-1',
  createdAt: '2026-09-20T00:00:00.000Z'
};

const definition: WorkflowDefinition = createWorkflowDefinition({
  id: asId<'WorkflowDefinitionId'>('WF-DEF-1', 'Workflow Definition'),
  tenantId,
  code: 'DELIVERABLE_AUTHORING',
  name: 'Deliverable Authoring',
  status: 'ACTIVE'
});

const version: WorkflowDefinitionVersion = createWorkflowDefinitionVersion(
  {
    id: asId<'WorkflowDefinitionVersionId'>('WF-DEF-V1', 'Workflow Definition Version'),
    tenantId,
    workflowDefinitionId: definition.id,
    version: 1,
    status: 'PUBLISHED',
    effectiveFrom: '2026-09-20T00:00:00.000Z'
  },
  definition
);

const workflow: WorkflowInstance = createWorkflowInstance(
  {
    id: asId<'WorkflowInstanceId'>('WF-I-1', 'Workflow Instance'),
    tenantId,
    workflowDefinitionId: definition.id,
    workflowDefinitionVersionId: version.id,
    subjectObjectId: subject.id,
    subjectVersion: 'A',
    status: 'ACTIVE',
    startedAt: '2026-09-20T10:00:00.000Z'
  },
  definition,
  version,
  subject
);

const work: WorkItem = createWorkItem(
  {
    id: asId<'WorkItemId'>('WORK-1', 'Work Item'),
    tenantId,
    workflowInstanceId: workflow.id,
    workType: 'AUTHOR_DELIVERABLE',
    subjectObjectId: subject.id,
    subjectVersion: 'A',
    title: 'Author drawing A-1001',
    status: 'READY',
    priority: 'NORMAL',
    dueAt: '2026-09-25T17:00:00.000Z',
    sequence: 1
  },
  workflow,
  subject
);

describe('kernel workflow and work invariants', () => {
  it('requires a published Workflow Definition Version to start an instance', () => {
    expect(workflow.status).toBe('ACTIVE');

    expect(() =>
      createWorkflowInstance(
        {
          ...workflow,
          id: asId<'WorkflowInstanceId'>('WF-I-DRAFT', 'Workflow Instance')
        },
        definition,
        { ...version, status: 'DRAFT' },
        subject
      )
    ).toThrow(KernelInvariantError);
  });


  it('publishes and retires Workflow Definition Versions explicitly and enforces effectivity', () => {
    const draft = createWorkflowDefinitionVersion(
      {
        id: asId<'WorkflowDefinitionVersionId'>('WF-DEF-V2', 'Workflow Definition Version'),
        tenantId,
        workflowDefinitionId: definition.id,
        version: 2,
        status: 'DRAFT'
      },
      definition
    );

    const published = publishWorkflowDefinitionVersion(
      draft,
      '2026-10-01T00:00:00.000Z'
    );
    expect(published.status).toBe('PUBLISHED');

    expect(() =>
      createWorkflowInstance(
        {
          ...workflow,
          id: asId<'WorkflowInstanceId'>('WF-I-TOO-EARLY', 'Workflow Instance'),
          workflowDefinitionVersionId: published.id,
          startedAt: '2026-09-30T23:59:59.000Z'
        },
        definition,
        published,
        subject
      )
    ).toThrow(KernelInvariantError);

    const retired = retireWorkflowDefinitionVersion(
      published,
      '2026-10-31T23:59:59.000Z'
    );
    expect(retired.status).toBe('RETIRED');
    expect(() =>
      publishWorkflowDefinitionVersion(retired, '2026-11-01T00:00:00.000Z')
    ).toThrow(KernelInvariantError);
  });

  it('keeps Work Item separate from the subject object and exact subject version', () => {
    expect(work.subjectObjectId).toBe(subject.id);
    expect(work.subjectVersion).toBe('A');
    expect(work.id).not.toBe(subject.id);
  });

  it('assigns, starts and completes Work through explicit state transitions', () => {
    const assignment: WorkAssignment = {
      id: asId<'WorkAssignmentId'>('WORK-ASG-1', 'Work Assignment'),
      tenantId,
      workflowInstanceId: workflow.id,
      workItemId: work.id,
      assigneeType: 'POSITION',
      assigneeId: 'POS-1',
      responsibilityRole: 'RESPONSIBLE',
      assignedAt: '2026-09-20T10:01:00.000Z',
      effectiveFrom: '2026-09-20T10:01:00.000Z',
      status: 'ACTIVE'
    };

    expect(createWorkAssignment(assignment, workflow, work)).toEqual(assignment);

    const assigned = markWorkAssigned(work);
    expect(assigned.status).toBe('ASSIGNED');

    const started = startWork(assigned);
    expect(started.status).toBe('IN_PROGRESS');

    const completed = completeWork(
      started,
      '2026-09-20T14:00:00.000Z',
      'Authoring task complete.'
    );
    expect(completed.status).toBe('COMPLETED');
    expect(completed.completionNote).toBe('Authoring task complete.');

    expect(() => startWork(completed)).toThrow(KernelInvariantError);
  });

  it('does not treat Workflow completion as domain Lifecycle completion', () => {
    const completed = completeWorkflow(
      workflow,
      '2026-09-20T15:00:00.000Z',
      'All workflow work completed.'
    );

    expect(completed.status).toBe('COMPLETED');
    expect(completed.subjectObjectId).toBe(subject.id);
    expect(subject.objectType).toBe('DELIVERABLE_ITEM');
  });


  it('supports controlled cancellation and priority escalation without changing subject truth', () => {
    const escalated = escalateWork(work);
    expect(escalated.priority).toBe('HIGH');

    const urgent = escalateWork(escalated);
    expect(urgent.priority).toBe('URGENT');
    expect(() => escalateWork(urgent)).toThrow(KernelInvariantError);

    const cancelledWork = cancelWork(
      work,
      '2026-09-20T13:00:00.000Z',
      'Work no longer required.'
    );
    expect(cancelledWork.status).toBe('CANCELLED');
    expect(cancelledWork.subjectObjectId).toBe(subject.id);

    const cancelledWorkflow = cancelWorkflow(
      workflow,
      '2026-09-20T13:01:00.000Z',
      'Workflow superseded.'
    );
    expect(cancelledWorkflow.status).toBe('CANCELLED');
    expect(cancelledWorkflow.subjectObjectId).toBe(subject.id);
  });

  it('rejects assignment to completed Work', () => {
    const completed = completeWork(
      startWork(markWorkAssigned(work)),
      '2026-09-20T14:00:00.000Z',
      'Done.'
    );

    expect(() =>
      createWorkAssignment(
        {
          id: asId<'WorkAssignmentId'>('WORK-ASG-LATE', 'Work Assignment'),
          tenantId,
          workflowInstanceId: workflow.id,
          workItemId: completed.id,
          assigneeType: 'PERSON',
          assigneeId: 'PERSON-1',
          responsibilityRole: 'RESPONSIBLE',
          assignedAt: '2026-09-20T14:01:00.000Z',
          effectiveFrom: '2026-09-20T14:01:00.000Z',
          status: 'ACTIVE'
        },
        workflow,
        completed
      )
    ).toThrow(KernelInvariantError);
  });
});
