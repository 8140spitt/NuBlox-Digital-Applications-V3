import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  asId,
  type CanonicalObjectIdentity,
  type DeliverableApproval,
  type DeliverableAuthoringBinding,
  type DeliverableConsequence,
  type DeliverableItem,
  type DeliverableRequirement,
  type DeliverableResponsibility,
  type DeliverableReview,
  type DeliverableRework,
  type Decision,
  type EvidenceRecord,
  type InformationContainer,
  type InformationIteration,
  type InformationRevision,
  type Party,
  type Person,
  type RecipientResponse,
  type Representation,
  type Tenant,
  type Transmittal,
  type TransmittalRecipient
} from '@nublox/kernel';
import { MySqlKernelControlRepository } from './control-repository.js';
import { createDatabasePool } from './database.js';
import { MySqlDeliverableRepository } from './deliverable-repository.js';
import { MySqlInformationRepository } from './information-repository.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('MySQL native Deliverable runtime', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('preserves requirement, exact-version review/rework, approval, issue, acceptance, consequence and closure', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = `DEL-${Date.now().toString(36)}`;
    const tenantId = asId<'TenantId'>(`TENANT-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const control = new MySqlKernelControlRepository(pool);
    const information = new MySqlInformationRepository(pool);
    const deliverables = new MySqlDeliverableRepository(pool);

    const tenant: Tenant = {
      id: tenantId,
      name: 'Native Deliverable Runtime Test',
      status: 'ACTIVE'
    };
    await kernel.createTenant(tenant);

    const authorParty: Party = {
      id: asId<'PartyId'>(`PARTY-AUTHOR-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Deliverable Author',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, authorParty);

    const author: Person = {
      id: asId<'PersonId'>(`PERSON-AUTHOR-${suffix}`, 'Person'),
      tenantId,
      partyId: authorParty.id,
      legalName: 'Deliverable Author',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, author);

    const recipientParty: Party = {
      id: asId<'PartyId'>(`PARTY-RECIPIENT-${suffix}`, 'Party'),
      tenantId,
      kind: 'ORGANISATION',
      displayName: 'Recipient Organisation',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, recipientParty, {
      actorPersonId: author.id
    });

    const project: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`PROJECT-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'PROJECT',
      stableKey: `PROJECT-${suffix}`,
      createdAt: '2026-09-20T09:00:00.000Z'
    };
    const deliverableObject: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`OBJ-DEL-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'DELIVERABLE_ITEM',
      stableKey: `DEL-A1001-${suffix}`,
      createdAt: '2026-09-20T09:01:00.000Z'
    };
    const informationObject: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`OBJ-INFO-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'INFORMATION_CONTAINER',
      stableKey: `A-1001-${suffix}`,
      createdAt: '2026-09-20T09:02:00.000Z'
    };

    await kernel.createCanonicalObject(tenantId, project, {
      actorPersonId: author.id
    });
    await kernel.createCanonicalObject(tenantId, deliverableObject, {
      actorPersonId: author.id
    });
    await kernel.createCanonicalObject(tenantId, informationObject, {
      actorPersonId: author.id
    });

    const requirement: DeliverableRequirement = {
      id: asId<'DeliverableRequirementId'>(`REQ-${suffix}`, 'Deliverable Requirement'),
      tenantId,
      code: `REQ-A1001-${suffix}`,
      title: 'Ground Floor Plan',
      deliverableType: 'DRAWING',
      description: 'Provide an approved and accepted ground floor plan.',
      functionId: asId<'FunctionId'>('F27', 'Function'),
      contextObjectId: project.id,
      authoringMode: 'NATIVE',
      requiredRepresentationTypes: ['PDF'],
      plannedDueAt: '2026-09-30T17:00:00.000Z',
      acceptanceRequired: true,
      status: 'ACTIVE'
    };
    await deliverables.createRequirement(tenantId, requirement, {
      actorPersonId: author.id,
      correlationId: suffix
    });

    const item: DeliverableItem = {
      id: asId<'DeliverableItemId'>(`ITEM-${suffix}`, 'Deliverable Item'),
      tenantId,
      canonicalObjectId: deliverableObject.id,
      requirementId: requirement.id,
      contextObjectId: project.id,
      code: `DEL-A1001-${suffix}`,
      title: 'Ground Floor Plan',
      deliverableType: 'DRAWING',
      status: 'PLANNED',
      plannedAt: '2026-09-20T10:00:00.000Z'
    };
    await deliverables.createItem(tenantId, item, {
      actorPersonId: author.id,
      correlationId: suffix
    });

    await expect(
      deliverables.startItem(
        tenantId,
        item.id,
        '2026-09-20T10:00:15.000Z',
        { actorPersonId: author.id }
      )
    ).rejects.toThrow('requires an Authoring Binding');

    const authoringBinding: DeliverableAuthoringBinding = {
      id: asId<'DeliverableAuthoringBindingId'>(`AUTHORING-${suffix}`, 'Deliverable Authoring Binding'),
      tenantId,
      deliverableItemId: item.id,
      mode: 'NATIVE',
      providerKey: 'NUBLOX_INFORMATION',
      authoritativeObjectId: informationObject.id,
      createdAt: '2026-09-20T10:00:30.000Z',
      status: 'ACTIVE'
    };
    await deliverables.createAuthoringBinding(
      tenantId,
      authoringBinding,
      { actorPersonId: author.id, correlationId: suffix }
    );

    expect(await deliverables.getAuthoringBinding(tenantId, item.id)).toEqual(
      authoringBinding
    );

    const responsibility: DeliverableResponsibility = {
      id: asId<'DeliverableResponsibilityId'>(`RESP-${suffix}`, 'Deliverable Responsibility'),
      tenantId,
      deliverableItemId: item.id,
      principalType: 'PERSON',
      principalId: author.id,
      responsibilityRole: 'RESPONSIBLE',
      effectiveFrom: '2026-09-20T10:00:00.000Z',
      status: 'ACTIVE'
    };
    await deliverables.addResponsibility(tenantId, responsibility, {
      actorPersonId: author.id
    });

    const container: InformationContainer = {
      id: asId<'InformationContainerId'>(`INFO-${suffix}`, 'Information Container'),
      tenantId,
      canonicalObjectId: informationObject.id,
      containerType: 'DRAWING',
      code: 'A-1001',
      title: 'Ground Floor Plan',
      status: 'ACTIVE'
    };
    await information.createInformationContainer(tenantId, container, {
      actorPersonId: author.id
    });

    const revisionA: InformationRevision = {
      id: asId<'InformationRevisionId'>(`REV-A-${suffix}`, 'Information Revision'),
      tenantId,
      informationContainerId: container.id,
      revision: 'A',
      status: 'DRAFT',
      createdAt: '2026-09-20T10:05:00.000Z'
    };
    await information.createInformationRevision(tenantId, revisionA, {
      actorPersonId: author.id
    });

    const iterationA: InformationIteration = {
      id: asId<'InformationIterationId'>(`ITER-A-${suffix}`, 'Information Iteration'),
      tenantId,
      informationRevisionId: revisionA.id,
      iteration: 1,
      status: 'WORKING',
      createdAt: '2026-09-20T10:06:00.000Z',
      authorPersonId: author.id
    };
    await information.createInformationIteration(tenantId, iterationA, {
      actorPersonId: author.id
    });
    await information.freezeInformationIteration(tenantId, iterationA.id, {
      actorPersonId: author.id
    });

    await deliverables.startItem(
      tenantId,
      item.id,
      '2026-09-20T10:10:00.000Z',
      { actorPersonId: author.id }
    );
    await deliverables.bindOutput(
      tenantId,
      item.id,
      informationObject.id,
      'A',
      '2026-09-20T10:11:00.000Z',
      { actorPersonId: author.id }
    );
    await deliverables.submitForReview(
      tenantId,
      item.id,
      '2026-09-20T10:12:00.000Z',
      { actorPersonId: author.id }
    );

    const reviewA: DeliverableReview = {
      id: asId<'DeliverableReviewId'>(`REVIEW-A-${suffix}`, 'Deliverable Review'),
      tenantId,
      deliverableItemId: item.id,
      reviewType: 'CHECK',
      subjectObjectId: informationObject.id,
      subjectVersion: 'A',
      reviewerPersonId: author.id,
      reviewedAt: '2026-09-20T10:20:00.000Z',
      outcome: 'REVISE',
      comments: 'Coordinate the revised opening layout.'
    };
    await deliverables.recordReview(tenantId, reviewA, {
      actorPersonId: author.id
    });

    const rework: DeliverableRework = {
      id: asId<'DeliverableReworkId'>(`REWORK-${suffix}`, 'Deliverable Rework'),
      tenantId,
      deliverableItemId: item.id,
      triggerType: 'REVIEW',
      triggerId: reviewA.id,
      previousSubjectObjectId: informationObject.id,
      previousSubjectVersion: 'A',
      reason: 'Review comments require revision B.',
      createdAt: '2026-09-20T10:21:00.000Z'
    };
    const reworkState = await deliverables.createRework(
      tenantId,
      rework,
      { actorPersonId: author.id, correlationId: suffix }
    );
    expect(reworkState.status).toBe('REWORK');
    expect(rework.previousSubjectVersion).toBe('A');

    const revisionB: InformationRevision = {
      id: asId<'InformationRevisionId'>(`REV-B-${suffix}`, 'Information Revision'),
      tenantId,
      informationContainerId: container.id,
      revision: 'B',
      status: 'DRAFT',
      createdAt: '2026-09-20T10:30:00.000Z'
    };
    await information.createInformationRevision(tenantId, revisionB, {
      actorPersonId: author.id
    });

    const iterationB: InformationIteration = {
      id: asId<'InformationIterationId'>(`ITER-B-${suffix}`, 'Information Iteration'),
      tenantId,
      informationRevisionId: revisionB.id,
      iteration: 1,
      status: 'WORKING',
      createdAt: '2026-09-20T10:31:00.000Z',
      authorPersonId: author.id
    };
    await information.createInformationIteration(tenantId, iterationB, {
      actorPersonId: author.id
    });
    const frozenB = await information.freezeInformationIteration(
      tenantId,
      iterationB.id,
      { actorPersonId: author.id }
    );

    const representationB: Representation = {
      id: asId<'RepresentationId'>(`REP-B-${suffix}`, 'Representation'),
      tenantId,
      informationIterationId: frozenB.id,
      representationType: 'PDF',
      mediaType: 'application/pdf',
      fileName: 'A-1001-B.pdf',
      contentReference: `urn:nublox:deliverable:${suffix}:B:pdf`,
      integrityHash: 'sha256:revision-b',
      generatedAt: '2026-09-20T10:35:00.000Z'
    };
    await information.createRepresentation(tenantId, representationB, {
      actorPersonId: author.id
    });

    await deliverables.bindOutput(
      tenantId,
      item.id,
      informationObject.id,
      'B',
      '2026-09-20T10:36:00.000Z',
      { actorPersonId: author.id }
    );
    await deliverables.submitForReview(
      tenantId,
      item.id,
      '2026-09-20T10:37:00.000Z',
      { actorPersonId: author.id }
    );

    const reviewB: DeliverableReview = {
      id: asId<'DeliverableReviewId'>(`REVIEW-B-${suffix}`, 'Deliverable Review'),
      tenantId,
      deliverableItemId: item.id,
      reviewType: 'CHECK',
      subjectObjectId: informationObject.id,
      subjectVersion: 'B',
      reviewerPersonId: author.id,
      reviewedAt: '2026-09-20T10:40:00.000Z',
      outcome: 'NO_COMMENT'
    };
    await deliverables.recordReview(tenantId, reviewB, {
      actorPersonId: author.id
    });

    const approvalDecision: Decision = {
      id: asId<'DecisionId'>(`DEC-B-${suffix}`, 'Decision'),
      tenantId,
      decisionType: 'DELIVERABLE_APPROVAL',
      subjectObjectId: informationObject.id,
      subjectVersion: 'B',
      outcome: 'APPROVED',
      reason: 'Revision B approved for controlled issue.',
      deciderPersonId: author.id,
      decidedAt: '2026-09-20T10:45:00.000Z'
    };
    await control.createDecision(tenantId, approvalDecision, {
      actorPersonId: author.id,
      correlationId: suffix
    });

    const approval: DeliverableApproval = {
      id: asId<'DeliverableApprovalId'>(`APP-B-${suffix}`, 'Deliverable Approval'),
      tenantId,
      deliverableItemId: item.id,
      decisionId: approvalDecision.id,
      subjectObjectId: informationObject.id,
      subjectVersion: 'B',
      approvedAt: approvalDecision.decidedAt
    };
    const approved = await deliverables.approve(tenantId, approval, {
      actorPersonId: author.id,
      correlationId: suffix
    });
    expect(approved.status).toBe('APPROVED');

    const releasedB = await information.releaseInformationRevision(
      tenantId,
      revisionB.id,
      frozenB.id,
      '2026-09-20T10:46:00.000Z',
      approvalDecision.id,
      { actorPersonId: author.id, correlationId: suffix }
    );
    expect(releasedB.status).toBe('RELEASED');

    const transmittal: Transmittal = {
      id: asId<'TransmittalId'>(`TR-${suffix}`, 'Transmittal'),
      tenantId,
      deliverableItemId: item.id,
      issueReference: `TR-${suffix}`,
      issuePurpose: 'FOR CONSTRUCTION',
      subjectObjectId: informationObject.id,
      subjectVersion: 'B',
      representationId: representationB.id,
      issuedByPersonId: author.id,
      issuedAt: '2026-09-20T10:50:00.000Z',
      responseRequired: true
    };
    const issued = await deliverables.issue(tenantId, transmittal, {
      actorPersonId: author.id,
      correlationId: suffix
    });
    expect(issued.status).toBe('ISSUED');

    const recipient: TransmittalRecipient = {
      id: asId<'TransmittalRecipientId'>(`TR-RECIPIENT-${suffix}`, 'Transmittal Recipient'),
      tenantId,
      transmittalId: transmittal.id,
      recipientPartyId: recipientParty.id,
      responseRequired: true,
      dueAt: '2026-09-22T17:00:00.000Z'
    };
    await deliverables.addRecipient(tenantId, recipient, {
      actorPersonId: author.id
    });

    await expect(
      deliverables.accept(
        tenantId,
        item.id,
        transmittal.id,
        '2026-09-20T11:00:00.000Z',
        { actorPersonId: author.id }
      )
    ).rejects.toThrow('All response-required recipients must respond');

    const acceptanceEvidence: EvidenceRecord = {
      id: asId<'EvidenceRecordId'>(`EVIDENCE-ACCEPT-${suffix}`, 'Evidence Record'),
      tenantId,
      evidenceType: 'DELIVERABLE_ACCEPTANCE',
      subjectObjectId: informationObject.id,
      subjectVersion: 'B',
      capturedByPersonId: author.id,
      capturedAt: '2026-09-20T11:05:00.000Z',
      contentReference: `urn:nublox:acceptance:${suffix}`,
      integrityHash: 'sha256:acceptance'
    };
    await control.recordEvidence(tenantId, acceptanceEvidence, {
      actorPersonId: author.id
    });

    const response: RecipientResponse = {
      id: asId<'RecipientResponseId'>(`RESPONSE-${suffix}`, 'Recipient Response'),
      tenantId,
      transmittalRecipientId: recipient.id,
      outcome: 'ACCEPTED',
      respondedAt: '2026-09-20T11:06:00.000Z',
      evidenceRecordId: acceptanceEvidence.id
    };
    await deliverables.recordResponse(tenantId, response, {
      actorPersonId: author.id
    });

    const accepted = await deliverables.accept(
      tenantId,
      item.id,
      transmittal.id,
      '2026-09-20T11:07:00.000Z',
      { actorPersonId: author.id, correlationId: suffix }
    );
    expect(accepted.status).toBe('ACCEPTED');

    const consequence: DeliverableConsequence = {
      id: asId<'DeliverableConsequenceId'>(`CONSEQ-${suffix}`, 'Deliverable Consequence'),
      tenantId,
      deliverableItemId: item.id,
      consequenceType: 'RELEASE_DOWNSTREAM_WORK',
      targetObjectId: project.id,
      status: 'PENDING'
    };
    await deliverables.createConsequence(tenantId, consequence, {
      actorPersonId: author.id
    });
    const applied = await deliverables.applyConsequence(
      tenantId,
      consequence.id,
      '2026-09-20T11:08:00.000Z',
      { actorPersonId: author.id }
    );
    expect(applied.status).toBe('APPLIED');

    const closed = await deliverables.close(
      tenantId,
      item.id,
      '2026-09-20T11:10:00.000Z',
      { actorPersonId: author.id, correlationId: suffix }
    );
    expect(closed.status).toBe('CLOSED');
    expect(closed.governedOutputVersion).toBe('B');

    const [historyRows] = await pool.query(
      `SELECT status, governed_output_version
         FROM deliverable_item_history
        WHERE tenant_id = ? AND deliverable_item_id = ?
        ORDER BY history_id`,
      [tenantId, item.id]
    );
    expect((historyRows as Array<{ status: string }>).map((row) => row.status)).toEqual([
      'PLANNED',
      'IN_PROGRESS',
      'IN_PROGRESS',
      'IN_REVIEW',
      'REWORK',
      'REWORK',
      'IN_REVIEW',
      'APPROVED',
      'ISSUED',
      'ACCEPTED',
      'CLOSED'
    ]);
    expect(
      (historyRows as Array<{ governed_output_version: string | null }>).at(-1)
        ?.governed_output_version
    ).toBe('B');

    const [outboxRows] = await pool.query(
      `SELECT event_type
         FROM outbox_messages
        WHERE tenant_id = ?
          AND aggregate_id = ?
          AND aggregate_type = 'DELIVERABLE_ITEM'
        ORDER BY occurred_at, id`,
      [tenantId, item.id]
    );
    expect(outboxRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ event_type: 'DELIVERABLE_ITEM.APPROVED' }),
        expect.objectContaining({ event_type: 'DELIVERABLE_ITEM.ACCEPTED' }),
        expect.objectContaining({ event_type: 'DELIVERABLE_ITEM.CLOSED' })
      ])
    );
  });
});
