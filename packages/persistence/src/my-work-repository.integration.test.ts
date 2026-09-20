import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  asId,
  type CompetenceEvidence,
  type Decision,
  type DeliverableApproval,
  type DeliverableAuthoringBinding,
  type DeliverableItem,
  type DeliverableRequirement,
  type DeliverableResponsibility,
  type Party,
  type Person,
  type Tenant,
  type Transmittal,
  type TransmittalRecipient,
  type WorkAssignment,
  type WorkItem,
  type WorkflowDefinition,
  type WorkflowDefinitionVersion,
  type WorkflowInstance
} from '@nublox/kernel';
import { MySqlKernelControlRepository } from './control-repository.js';
import { createDatabasePool } from './database.js';
import { MySqlDeliverableRepository } from './deliverable-repository.js';
import { MySqlFunctionalRepository } from './functional-repository.js';
import { migrate } from './migrations.js';
import { MySqlMyWorkRepository } from './my-work-repository.js';
import { MySqlKernelRepository } from './repository.js';
import { MySqlWorkRepository } from './work-repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('MySQL unified My Work projection', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('projects work, review, approval, acceptance and competence from authoritative runtime state', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = `MYWORK-${Date.now().toString(36)}`;
    const tenantId = asId<'TenantId'>(`TENANT-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const control = new MySqlKernelControlRepository(pool);
    const functional = new MySqlFunctionalRepository(pool);
    const deliverables = new MySqlDeliverableRepository(pool);
    const work = new MySqlWorkRepository(pool);
    const myWork = new MySqlMyWorkRepository(pool);

    const tenant: Tenant = {
      id: tenantId,
      name: 'Unified My Work Test',
      status: 'ACTIVE'
    };
    await kernel.createTenant(tenant);

    const personParty: Party = {
      id: asId<'PartyId'>(`PARTY-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Unified Worker',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, personParty);

    const person: Person = {
      id: asId<'PersonId'>(`PERSON-${suffix}`, 'Person'),
      tenantId,
      partyId: personParty.id,
      legalName: 'Unified Worker',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, person);

    const project = {
      id: asId<'CanonicalObjectId'>(`PROJECT-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'PROJECT',
      stableKey: `PROJECT-${suffix}`,
      createdAt: '2026-09-20T09:00:00.000Z'
    };
    const deliverableObject = {
      id: asId<'CanonicalObjectId'>(`DEL-OBJ-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'DELIVERABLE_ITEM',
      stableKey: `DEL-${suffix}`,
      createdAt: '2026-09-20T09:01:00.000Z'
    };
    const outputObject = {
      id: asId<'CanonicalObjectId'>(`OUT-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'INFORMATION_CONTAINER',
      stableKey: `OUT-${suffix}`,
      createdAt: '2026-09-20T09:02:00.000Z'
    };

    await kernel.createCanonicalObject(tenantId, project);
    await kernel.createCanonicalObject(tenantId, deliverableObject);
    await kernel.createCanonicalObject(tenantId, outputObject);

    const requirement: DeliverableRequirement = {
      id: asId<'DeliverableRequirementId'>(`REQ-${suffix}`, 'Deliverable Requirement'),
      tenantId,
      code: `REQ-${suffix}`,
      title: 'Coordinated design package',
      deliverableType: 'DRAWING',
      description: 'Produce, review, approve and issue the coordinated design package.',
      contextObjectId: project.id,
      authoringMode: 'NATIVE',
      requiredRepresentationTypes: ['PDF'],
      plannedDueAt: '2026-09-20T11:30:00.000Z',
      acceptanceRequired: true,
      status: 'ACTIVE'
    };
    await deliverables.createRequirement(tenantId, requirement);

    const item: DeliverableItem = {
      id: asId<'DeliverableItemId'>(`ITEM-${suffix}`, 'Deliverable Item'),
      tenantId,
      canonicalObjectId: deliverableObject.id,
      requirementId: requirement.id,
      contextObjectId: project.id,
      code: `ITEM-${suffix}`,
      title: 'Coordinated design package',
      deliverableType: 'DRAWING',
      status: 'PLANNED',
      plannedAt: '2026-09-20T09:10:00.000Z'
    };
    await deliverables.createItem(tenantId, item);

    const authoring: DeliverableAuthoringBinding = {
      id: asId<'DeliverableAuthoringBindingId'>(`AUTHORING-${suffix}`, 'Deliverable Authoring Binding'),
      tenantId,
      deliverableItemId: item.id,
      mode: 'NATIVE',
      providerKey: 'NUBLOX_INFORMATION',
      authoritativeObjectId: outputObject.id,
      createdAt: '2026-09-20T09:11:00.000Z',
      status: 'ACTIVE'
    };
    await deliverables.createAuthoringBinding(tenantId, authoring);

    const reviewer: DeliverableResponsibility = {
      id: asId<'DeliverableResponsibilityId'>(`REVIEWER-${suffix}`, 'Deliverable Responsibility'),
      tenantId,
      deliverableItemId: item.id,
      principalType: 'PERSON',
      principalId: person.id,
      responsibilityRole: 'REVIEWER',
      effectiveFrom: '2026-09-20T09:00:00.000Z',
      status: 'ACTIVE'
    };
    await deliverables.addResponsibility(tenantId, reviewer);

    const approver: DeliverableResponsibility = {
      id: asId<'DeliverableResponsibilityId'>(`APPROVER-${suffix}`, 'Deliverable Responsibility'),
      tenantId,
      deliverableItemId: item.id,
      principalType: 'PERSON',
      principalId: person.id,
      responsibilityRole: 'APPROVER',
      effectiveFrom: '2026-09-20T09:00:00.000Z',
      status: 'ACTIVE'
    };
    await deliverables.addResponsibility(tenantId, approver);

    await deliverables.startItem(
      tenantId,
      item.id,
      '2026-09-20T09:15:00.000Z'
    );
    await deliverables.bindOutput(
      tenantId,
      item.id,
      outputObject.id,
      'A',
      '2026-09-20T09:20:00.000Z'
    );
    await deliverables.submitForReview(
      tenantId,
      item.id,
      '2026-09-20T09:30:00.000Z'
    );

    const competence: CompetenceEvidence = {
      id: asId<'CompetenceEvidenceId'>(`COMP-${suffix}`, 'Competence Evidence'),
      tenantId,
      personId: person.id,
      competenceCode: 'DESIGN_CHECKING',
      attainedLevel: 'COMPETENT',
      issuedAt: '2026-01-01T00:00:00.000Z',
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      effectiveTo: '2026-09-25T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await functional.createCompetenceEvidence(tenantId, competence);

    const workflowDefinition: WorkflowDefinition = {
      id: asId<'WorkflowDefinitionId'>(`WF-D-${suffix}`, 'Workflow Definition'),
      tenantId,
      code: `MYWORK-${suffix}`,
      name: 'Unified Work Test',
      status: 'ACTIVE'
    };
    await work.createWorkflowDefinition(tenantId, workflowDefinition);

    const workflowVersion: WorkflowDefinitionVersion = {
      id: asId<'WorkflowDefinitionVersionId'>(`WF-V-${suffix}`, 'Workflow Definition Version'),
      tenantId,
      workflowDefinitionId: workflowDefinition.id,
      version: 1,
      status: 'PUBLISHED',
      effectiveFrom: '2026-09-20T00:00:00.000Z'
    };
    await work.createWorkflowDefinitionVersion(tenantId, workflowVersion);

    const workflow: WorkflowInstance = {
      id: asId<'WorkflowInstanceId'>(`WF-I-${suffix}`, 'Workflow Instance'),
      tenantId,
      workflowDefinitionId: workflowDefinition.id,
      workflowDefinitionVersionId: workflowVersion.id,
      subjectObjectId: project.id,
      status: 'ACTIVE',
      startedAt: '2026-09-20T09:00:00.000Z'
    };
    await work.startWorkflow(tenantId, workflow);

    const workItem: WorkItem = {
      id: asId<'WorkItemId'>(`WORK-${suffix}`, 'Work Item'),
      tenantId,
      workflowInstanceId: workflow.id,
      workType: 'PROJECT_COORDINATION',
      subjectObjectId: project.id,
      title: 'Coordinate design interfaces',
      status: 'READY',
      priority: 'HIGH',
      dueAt: '2026-09-20T11:00:00.000Z',
      sequence: 1
    };
    await work.createWorkItem(tenantId, workItem);

    const assignment: WorkAssignment = {
      id: asId<'WorkAssignmentId'>(`ASG-${suffix}`, 'Work Assignment'),
      tenantId,
      workflowInstanceId: workflow.id,
      workItemId: workItem.id,
      assigneeType: 'PERSON',
      assigneeId: person.id,
      responsibilityRole: 'RESPONSIBLE',
      assignedAt: '2026-09-20T09:05:00.000Z',
      effectiveFrom: '2026-09-20T09:05:00.000Z',
      status: 'ACTIVE'
    };
    await work.assignWork(tenantId, assignment);

    const reviewQueue = await myWork.listMyWork(
      tenantId,
      person.id,
      '2026-09-20T12:00:00.000Z',
      30
    );

    expect(reviewQueue.map((entry) => entry.kind)).toEqual(
      expect.arrayContaining(['WORK', 'REVIEW', 'APPROVAL', 'COMPETENCE'])
    );
    expect(
      reviewQueue.find((entry) => entry.key === `WORK:${workItem.id}`)
    ).toEqual(
      expect.objectContaining({
        kind: 'WORK',
        isOverdue: true
      })
    );
    expect(
      reviewQueue.find((entry) => entry.key === `REVIEW:${item.id}`)
    ).toEqual(
      expect.objectContaining({
        kind: 'REVIEW',
        subjectVersion: 'A',
        isOverdue: true
      })
    );
    expect(
      reviewQueue.find((entry) => entry.key === `APPROVAL:${item.id}`)
    ).toEqual(
      expect.objectContaining({
        kind: 'APPROVAL',
        subjectVersion: 'A'
      })
    );
    expect(
      reviewQueue.find((entry) => entry.key === `COMPETENCE:${competence.id}`)
    ).toEqual(
      expect.objectContaining({
        kind: 'COMPETENCE',
        isOverdue: false
      })
    );

    const decision: Decision = {
      id: asId<'DecisionId'>(`DEC-${suffix}`, 'Decision'),
      tenantId,
      decisionType: 'DELIVERABLE_APPROVAL',
      subjectObjectId: outputObject.id,
      subjectVersion: 'A',
      outcome: 'APPROVED',
      reason: 'Approved for issue.',
      deciderPersonId: person.id,
      decidedAt: '2026-09-20T12:05:00.000Z'
    };
    await control.createDecision(tenantId, decision);

    const approval: DeliverableApproval = {
      id: asId<'DeliverableApprovalId'>(`APP-${suffix}`, 'Deliverable Approval'),
      tenantId,
      deliverableItemId: item.id,
      decisionId: decision.id,
      subjectObjectId: outputObject.id,
      subjectVersion: 'A',
      approvedAt: decision.decidedAt
    };
    await deliverables.approve(tenantId, approval);

    const transmittal: Transmittal = {
      id: asId<'TransmittalId'>(`TR-${suffix}`, 'Transmittal'),
      tenantId,
      deliverableItemId: item.id,
      issueReference: `TR-${suffix}`,
      issuePurpose: 'FOR ACCEPTANCE',
      subjectObjectId: outputObject.id,
      subjectVersion: 'A',
      issuedByPersonId: person.id,
      issuedAt: '2026-09-20T12:10:00.000Z',
      responseRequired: true
    };
    await deliverables.issue(tenantId, transmittal);

    const recipient: TransmittalRecipient = {
      id: asId<'TransmittalRecipientId'>(`RECIPIENT-${suffix}`, 'Transmittal Recipient'),
      tenantId,
      transmittalId: transmittal.id,
      recipientPartyId: personParty.id,
      responseRequired: true,
      dueAt: '2026-09-20T13:00:00.000Z'
    };
    await deliverables.addRecipient(tenantId, recipient);

    const acceptanceQueue = await myWork.listMyWork(
      tenantId,
      person.id,
      '2026-09-20T12:15:00.000Z',
      30
    );

    expect(
      acceptanceQueue.find((entry) => entry.key === `ACCEPTANCE:${item.id}`)
    ).toEqual(
      expect.objectContaining({
        kind: 'ACCEPTANCE',
        subjectVersion: 'A',
        isOverdue: false
      })
    );
  });
});
