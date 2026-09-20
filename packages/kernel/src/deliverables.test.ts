import { describe, expect, it } from 'vitest';
import {
  KernelInvariantError,
  asId,
  bindDeliverableOutput,
  closeDeliverable,
  createDecision,
  createDeliverableApproval,
  createDeliverableAuthoringBinding,
  createDeliverableItem,
  createDeliverableRequirement,
  createDeliverableReview,
  createDeliverableRework,
  createRecipientResponse,
  createTransmittal,
  createTransmittalRecipient,
  markDeliverableAccepted,
  markDeliverableApproved,
  markDeliverableIssued,
  markDeliverableRework,
  startDeliverable,
  submitDeliverableForReview,
  type CanonicalObjectIdentity,
  type DeliverableItem,
  type DeliverableRequirement,
  type ExternalIdentity,
  type Party,
  type Person
} from './index.js';

const tenantId = asId<'TenantId'>('TENANT-DELIVERABLE', 'Tenant');

const authorParty: Party = {
  id: asId<'PartyId'>('PARTY-AUTHOR', 'Party'),
  tenantId,
  kind: 'PERSON',
  displayName: 'Deliverable Author',
  status: 'ACTIVE'
};

const author: Person = {
  id: asId<'PersonId'>('PERSON-AUTHOR', 'Person'),
  tenantId,
  partyId: authorParty.id,
  legalName: 'Deliverable Author',
  status: 'ACTIVE'
};

const recipientParty: Party = {
  id: asId<'PartyId'>('PARTY-RECIPIENT', 'Party'),
  tenantId,
  kind: 'ORGANISATION',
  displayName: 'Recipient Organisation',
  status: 'ACTIVE'
};

const project: CanonicalObjectIdentity = {
  id: asId<'CanonicalObjectId'>('PROJECT-DELIVERABLE', 'Canonical Object'),
  tenantId,
  objectType: 'PROJECT',
  stableKey: 'PROJECT-001',
  createdAt: '2026-09-20T09:00:00.000Z'
};

const itemObject: CanonicalObjectIdentity = {
  id: asId<'CanonicalObjectId'>('OBJ-DELIVERABLE-1', 'Canonical Object'),
  tenantId,
  objectType: 'DELIVERABLE_ITEM',
  stableKey: 'DEL-A-1001',
  createdAt: '2026-09-20T09:00:00.000Z'
};

const output: CanonicalObjectIdentity = {
  id: asId<'CanonicalObjectId'>('OBJ-INFO-A1001', 'Canonical Object'),
  tenantId,
  objectType: 'INFORMATION_CONTAINER',
  stableKey: 'A-1001',
  createdAt: '2026-09-20T09:00:00.000Z'
};

const requirement: DeliverableRequirement = createDeliverableRequirement(
  {
    id: asId<'DeliverableRequirementId'>('REQ-A1001', 'Deliverable Requirement'),
    tenantId,
    code: 'REQ-A1001',
    title: 'Ground Floor Plan',
    deliverableType: 'DRAWING',
    description: 'Provide the approved ground floor plan.',
    contextObjectId: project.id,
    authoringMode: 'NATIVE',
    requiredRepresentationTypes: ['PDF'],
    plannedDueAt: '2026-09-30T17:00:00.000Z',
    acceptanceRequired: true,
    status: 'ACTIVE'
  },
  project
);

const planned: DeliverableItem = createDeliverableItem(
  {
    id: asId<'DeliverableItemId'>('DEL-A1001', 'Deliverable Item'),
    tenantId,
    canonicalObjectId: itemObject.id,
    requirementId: requirement.id,
    contextObjectId: project.id,
    code: 'DEL-A1001',
    title: 'Ground Floor Plan',
    deliverableType: 'DRAWING',
    status: 'PLANNED',
    plannedAt: '2026-09-20T10:00:00.000Z'
  },
  itemObject,
  requirement,
  project
);

describe('native Deliverable runtime invariants', () => {
  it('keeps Deliverable Requirement, Item and governed output as separate identities', () => {
    expect(requirement.id).not.toBe(planned.id);
    expect(planned.canonicalObjectId).toBe(itemObject.id);
    expect(planned.governedOutputObjectId).toBeUndefined();

    const inProgress = startDeliverable(planned);
    const bound = bindDeliverableOutput(inProgress, output, 'A');

    expect(bound.governedOutputObjectId).toBe(output.id);
    expect(bound.governedOutputVersion).toBe('A');
    expect(bound.id).not.toBe(output.id);
  });

  it('reviews and approves only the exact governed output version', () => {
    const bound = bindDeliverableOutput(startDeliverable(planned), output, 'A');
    const reviewState = submitDeliverableForReview(bound);

    const review = createDeliverableReview(
      {
        id: asId<'DeliverableReviewId'>('REVIEW-A1001-A', 'Deliverable Review'),
        tenantId,
        deliverableItemId: reviewState.id,
        reviewType: 'CHECK',
        subjectObjectId: output.id,
        subjectVersion: 'A',
        reviewerPersonId: author.id,
        reviewedAt: '2026-09-20T12:00:00.000Z',
        outcome: 'NO_COMMENT'
      },
      reviewState,
      output,
      author
    );
    expect(review.subjectVersion).toBe('A');

    expect(() =>
      createDeliverableReview(
        {
          ...review,
          id: asId<'DeliverableReviewId'>('REVIEW-WRONG-VERSION', 'Deliverable Review'),
          subjectVersion: 'B'
        },
        reviewState,
        output,
        author
      )
    ).toThrow(KernelInvariantError);

    const decision = createDecision(
      {
        id: asId<'DecisionId'>('DEC-A1001-A', 'Decision'),
        tenantId,
        decisionType: 'DELIVERABLE_APPROVAL',
        subjectObjectId: output.id,
        subjectVersion: 'A',
        outcome: 'APPROVED',
        reason: 'Drawing approved for issue.',
        deciderPersonId: author.id,
        decidedAt: '2026-09-20T12:30:00.000Z'
      },
      output,
      author
    );

    const approval = createDeliverableApproval(
      {
        id: asId<'DeliverableApprovalId'>('APP-A1001-A', 'Deliverable Approval'),
        tenantId,
        deliverableItemId: reviewState.id,
        decisionId: decision.id,
        subjectObjectId: output.id,
        subjectVersion: 'A',
        approvedAt: decision.decidedAt
      },
      reviewState,
      output,
      decision
    );

    expect(markDeliverableApproved(reviewState, approval).status).toBe('APPROVED');
  });

  it('distinguishes approval, issue and acceptance', () => {
    const bound = bindDeliverableOutput(startDeliverable(planned), output, 'A');
    const reviewState = submitDeliverableForReview(bound);

    const decision = createDecision(
      {
        id: asId<'DecisionId'>('DEC-ISSUE-A', 'Decision'),
        tenantId,
        decisionType: 'DELIVERABLE_APPROVAL',
        subjectObjectId: output.id,
        subjectVersion: 'A',
        outcome: 'APPROVED',
        reason: 'Approved.',
        deciderPersonId: author.id,
        decidedAt: '2026-09-20T12:30:00.000Z'
      },
      output,
      author
    );

    const approval = createDeliverableApproval(
      {
        id: asId<'DeliverableApprovalId'>('APP-ISSUE-A', 'Deliverable Approval'),
        tenantId,
        deliverableItemId: reviewState.id,
        decisionId: decision.id,
        subjectObjectId: output.id,
        subjectVersion: 'A',
        approvedAt: decision.decidedAt
      },
      reviewState,
      output,
      decision
    );
    const approved = markDeliverableApproved(reviewState, approval);

    const transmittal = createTransmittal(
      {
        id: asId<'TransmittalId'>('TR-A1001-A', 'Transmittal'),
        tenantId,
        deliverableItemId: approved.id,
        issueReference: 'TR-0001',
        issuePurpose: 'FOR CONSTRUCTION',
        subjectObjectId: output.id,
        subjectVersion: 'A',
        issuedByPersonId: author.id,
        issuedAt: '2026-09-20T13:00:00.000Z',
        responseRequired: true
      },
      approved,
      output,
      author
    );
    const issued = markDeliverableIssued(approved, transmittal);
    expect(issued.status).toBe('ISSUED');

    const recipient = createTransmittalRecipient(
      {
        id: asId<'TransmittalRecipientId'>('TR-RECIPIENT-1', 'Transmittal Recipient'),
        tenantId,
        transmittalId: transmittal.id,
        recipientPartyId: recipientParty.id,
        responseRequired: true,
        dueAt: '2026-09-22T17:00:00.000Z'
      },
      transmittal,
      recipientParty
    );

    expect(() =>
      markDeliverableAccepted(issued, requirement, transmittal, [recipient], [])
    ).toThrow(KernelInvariantError);

    const response = createRecipientResponse(
      {
        id: asId<'RecipientResponseId'>('RESPONSE-1', 'Recipient Response'),
        tenantId,
        transmittalRecipientId: recipient.id,
        outcome: 'ACCEPTED',
        respondedAt: '2026-09-21T10:00:00.000Z'
      },
      recipient
    );

    const accepted = markDeliverableAccepted(
      issued,
      requirement,
      transmittal,
      [recipient],
      [response]
    );
    expect(accepted.status).toBe('ACCEPTED');

    const closed = closeDeliverable(
      accepted,
      requirement,
      '2026-09-21T10:01:00.000Z'
    );
    expect(closed.status).toBe('CLOSED');
  });

  it('records rework explicitly against the previous exact output version', () => {
    const bound = bindDeliverableOutput(startDeliverable(planned), output, 'A');
    const reviewState = submitDeliverableForReview(bound);

    const rework = createDeliverableRework(
      {
        id: asId<'DeliverableReworkId'>('REWORK-A1001-A', 'Deliverable Rework'),
        tenantId,
        deliverableItemId: reviewState.id,
        triggerType: 'REVIEW',
        triggerId: 'REVIEW-REVISE-1',
        previousSubjectObjectId: output.id,
        previousSubjectVersion: 'A',
        reason: 'Review comments require revision.',
        createdAt: '2026-09-20T14:00:00.000Z'
      },
      reviewState,
      output
    );

    const reworkState = markDeliverableRework(reviewState, rework);
    expect(reworkState.status).toBe('REWORK');

    const revisionB = bindDeliverableOutput(reworkState, output, 'B');
    expect(revisionB.governedOutputVersion).toBe('B');
    expect(rework.previousSubjectVersion).toBe('A');
  });

  it('governs native, connected and externally authoritative authoring without changing Deliverable identity', () => {
    const native = createDeliverableAuthoringBinding(
      {
        id: asId<'DeliverableAuthoringBindingId'>('AUTHORING-NATIVE', 'Deliverable Authoring Binding'),
        tenantId,
        deliverableItemId: planned.id,
        mode: 'NATIVE',
        providerKey: 'NUBLOX_INFORMATION',
        authoritativeObjectId: output.id,
        createdAt: '2026-09-20T10:00:00.000Z',
        status: 'ACTIVE'
      },
      planned,
      requirement,
      { authoritativeObject: output }
    );
    expect(native.authoritativeObjectId).toBe(output.id);

    const connectedRequirement = createDeliverableRequirement(
      {
        ...requirement,
        id: asId<'DeliverableRequirementId'>('REQ-CONNECTED', 'Deliverable Requirement'),
        code: 'REQ-CONNECTED',
        authoringMode: 'CONNECTED'
      },
      project
    );
    const connectedObject: CanonicalObjectIdentity = {
      ...itemObject,
      id: asId<'CanonicalObjectId'>('OBJ-DEL-CONNECTED', 'Canonical Object'),
      stableKey: 'DEL-CONNECTED'
    };
    const connectedItem = createDeliverableItem(
      {
        ...planned,
        id: asId<'DeliverableItemId'>('DEL-CONNECTED', 'Deliverable Item'),
        canonicalObjectId: connectedObject.id,
        requirementId: connectedRequirement.id,
        code: 'DEL-CONNECTED'
      },
      connectedObject,
      connectedRequirement,
      project
    );
    const connected = createDeliverableAuthoringBinding(
      {
        id: asId<'DeliverableAuthoringBindingId'>('AUTHORING-CONNECTED', 'Deliverable Authoring Binding'),
        tenantId,
        deliverableItemId: connectedItem.id,
        mode: 'CONNECTED',
        providerKey: 'AUTODESK_REVIT',
        connectedReference: 'revit://model/ground-floor-plan',
        createdAt: '2026-09-20T10:00:00.000Z',
        status: 'ACTIVE'
      },
      connectedItem,
      connectedRequirement
    );
    expect(connected.connectedReference).toContain('revit://');

    const externalRequirement = createDeliverableRequirement(
      {
        ...requirement,
        id: asId<'DeliverableRequirementId'>('REQ-EXTERNAL', 'Deliverable Requirement'),
        code: 'REQ-EXTERNAL',
        authoringMode: 'EXTERNAL_AUTHORITATIVE'
      },
      project
    );
    const externalObject: CanonicalObjectIdentity = {
      ...itemObject,
      id: asId<'CanonicalObjectId'>('OBJ-DEL-EXTERNAL', 'Canonical Object'),
      stableKey: 'DEL-EXTERNAL'
    };
    const externalItem = createDeliverableItem(
      {
        ...planned,
        id: asId<'DeliverableItemId'>('DEL-EXTERNAL', 'Deliverable Item'),
        canonicalObjectId: externalObject.id,
        requirementId: externalRequirement.id,
        code: 'DEL-EXTERNAL'
      },
      externalObject,
      externalRequirement,
      project
    );
    const externalIdentity: ExternalIdentity = {
      id: asId<'ExternalIdentityId'>('EXT-WINDCHILL-A1001', 'External Identity'),
      tenantId,
      canonicalObjectId: output.id,
      externalSystem: 'PTC_WINDCHILL',
      externalObjectType: 'WTDocument',
      externalObjectId: 'OR:wt.doc.WTDocument:12345',
      externalVersion: 'A.3'
    };
    const external = createDeliverableAuthoringBinding(
      {
        id: asId<'DeliverableAuthoringBindingId'>('AUTHORING-EXTERNAL', 'Deliverable Authoring Binding'),
        tenantId,
        deliverableItemId: externalItem.id,
        mode: 'EXTERNAL_AUTHORITATIVE',
        providerKey: 'PTC_WINDCHILL',
        externalIdentityId: externalIdentity.id,
        createdAt: '2026-09-20T10:00:00.000Z',
        status: 'ACTIVE'
      },
      externalItem,
      externalRequirement,
      { externalIdentity }
    );
    expect(external.externalIdentityId).toBe(externalIdentity.id);

    expect(() =>
      createDeliverableAuthoringBinding(
        {
          ...external,
          id: asId<'DeliverableAuthoringBindingId'>('AUTHORING-BAD-MODE', 'Deliverable Authoring Binding'),
          mode: 'NATIVE'
        },
        externalItem,
        externalRequirement,
        { externalIdentity }
      )
    ).toThrow(KernelInvariantError);
  });

});
