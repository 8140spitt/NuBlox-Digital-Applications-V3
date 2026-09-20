import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let deliverableService: typeof import('./managed-deliverable');
let workService: typeof import('./shared-work');
let decisionService: typeof import('./work-decision');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  deliverableService = await import('./managed-deliverable');
  workService = await import('./shared-work');
  decisionService = await import('./work-decision');
  db = await import('./db');
});

afterAll(async () => {
  await db.closeDbPool();
});

describe('managed deliverable governance runtime', () => {
  it('enforces review and approval before issue and closes required recipient acceptance', async () => {
    const tenant = 'deliverable-governance-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);
    const suffix = randomUUID().slice(0, 8).toUpperCase();

    const created = await deliverableService.createManagedDeliverable(context, {
      requirementRef: 'REQ-' + suffix,
      deliverableRef: 'DEL-' + suffix,
      title: 'Ground Floor General Arrangement',
      description: 'Governed deliverable lifecycle acceptance proof.',
      requirementSourceType: 'CONTRACT',
      requirementSourceId: 'CONTRACT-' + suffix,
      contextType: 'PROJECT',
      contextId: 'PROJECT-' + suffix,
      responsiblePartyId: context.actorPartyId,
      deliverableType: 'DRAWING',
      outputKind: 'DESIGN_INFORMATION',
      authoringMode: 'CONNECTED',
      reviewRequired: true,
      approvalRequired: true,
      acceptanceRequired: true,
      createInformationContainer: false
    });

    let item = await deliverableService.getDeliverableItem(context, created.deliverableItemId);
    expect(item.status).toBe('PLANNED');
    expect(item.workStatus).toBe('ASSIGNED');
    expect(item.reviewRequired).toBe(true);
    expect(item.approvalRequired).toBe(true);
    expect(item.acceptanceRequired).toBe(true);

    await expect(
      deliverableService.recordDeliverableIssue(context, item.id, item.version, {
        issueRef: 'ISSUE-EARLY-' + suffix,
        recipientPartyId: context.actorPartyId
      })
    ).rejects.toThrow('Authoring or rework must be completed before issue');

    await workService.completeWorkItem(
      context,
      created.workItemId,
      1,
      'Authoring completed and ready for governed review.'
    );

    item = await deliverableService.getDeliverableItem(context, item.id);
    expect(item.effectiveStatus).toBe('AUTHOR_COMPLETE');

    await expect(
      deliverableService.recordDeliverableIssue(context, item.id, item.version, {
        issueRef: 'ISSUE-BYPASS-' + suffix,
        recipientPartyId: context.actorPartyId
      })
    ).rejects.toThrow('Required review and approval must be completed before issue');

    await deliverableService.submitDeliverableForReview(context, item.id, item.version);
    item = await deliverableService.getDeliverableItem(context, item.id);
    expect(item.status).toBe('IN_REVIEW');
    expect(item.version).toBe(2);

    const reviewDecisionId = await decisionService.recordWorkDecision(context, {
      decisionType: 'DELIVERABLE_REVIEW',
      subjectType: 'DELIVERABLE_ITEM',
      subjectId: item.id,
      subjectVersion: String(item.version),
      outcome: 'APPROVED',
      reason: 'Technical review completed with no blocking comments.'
    });
    await deliverableService.applyDeliverableReviewDecision(
      context,
      item.id,
      item.version,
      reviewDecisionId,
      'APPROVED'
    );

    item = await deliverableService.getDeliverableItem(context, item.id);
    expect(item.status).toBe('REVIEWED');
    expect(item.version).toBe(3);

    await expect(
      deliverableService.recordDeliverableIssue(context, item.id, item.version, {
        issueRef: 'ISSUE-PRE-APPROVAL-' + suffix,
        recipientPartyId: context.actorPartyId
      })
    ).rejects.toThrow('Required review and approval must be completed before issue');

    await deliverableService.submitDeliverableForApproval(context, item.id, item.version);
    item = await deliverableService.getDeliverableItem(context, item.id);
    expect(item.status).toBe('IN_APPROVAL');
    expect(item.version).toBe(4);

    const approvalDecisionId = await decisionService.recordWorkDecision(context, {
      decisionType: 'DELIVERABLE_APPROVAL',
      subjectType: 'DELIVERABLE_ITEM',
      subjectId: item.id,
      subjectVersion: String(item.version),
      outcome: 'APPROVED',
      reason: 'Approved for controlled issue.'
    });
    await deliverableService.applyDeliverableApprovalDecision(
      context,
      item.id,
      item.version,
      approvalDecisionId,
      'APPROVED'
    );

    item = await deliverableService.getDeliverableItem(context, item.id);
    expect(item.status).toBe('APPROVED');
    expect(item.version).toBe(5);

    const issueId = await deliverableService.recordDeliverableIssue(
      context,
      item.id,
      item.version,
      {
        issueRef: 'T-' + suffix,
        issueType: 'TRANSMITTAL',
        recipientPartyId: context.actorPartyId,
        recipientRole: 'CLIENT',
        purposeOfIssue: 'FOR ACCEPTANCE'
      }
    );
    expect(issueId).toBeTruthy();

    item = await deliverableService.getDeliverableItem(context, item.id);
    expect(item.status).toBe('ISSUED');
    expect(item.version).toBe(6);

    const recipients = await deliverableService.listDeliverableIssueRecipients(context, item.id);
    expect(recipients).toHaveLength(1);
    expect(recipients[0].responseStatus).toBe('AWAITING_RESPONSE');

    const acceptanceDecisionId = await decisionService.recordWorkDecision(context, {
      decisionType: 'DELIVERABLE_ACCEPTANCE',
      subjectType: 'DELIVERABLE_ISSUE_RECIPIENT',
      subjectId: recipients[0].id,
      subjectVersion: recipients[0].revisionLabel ?? undefined,
      outcome: 'ACCEPTED',
      reason: 'Recipient accepted the issued deliverable.'
    });
    await deliverableService.recordDeliverableRecipientResponse(
      context,
      recipients[0].id,
      acceptanceDecisionId,
      'ACCEPTED',
      'Accepted without comment.'
    );

    item = await deliverableService.getDeliverableItem(context, item.id);
    expect(item.status).toBe('ACCEPTED');
    expect(item.version).toBe(7);
    expect(item.acceptedAt).toBeTruthy();

    const decisions = await deliverableService.listDeliverableStageDecisions(context, item.id);
    expect(decisions.map((decision) => [decision.stage, decision.outcome])).toEqual([
      ['APPROVAL', 'APPROVED'],
      ['REVIEW', 'APPROVED']
    ]);

    const acceptedRecipients = await deliverableService.listDeliverableIssueRecipients(
      context,
      item.id
    );
    expect(acceptedRecipients[0].responseStatus).toBe('ACCEPTED');
    expect(acceptedRecipients[0].responseDecisionId).toBe(acceptanceDecisionId);

    const events = await db.queryRows<any>(
      "SELECT event_type AS eventType FROM business_events WHERE tenant_id = ? AND aggregate_id = 'AGG-MANAGED-DELIVERABLE' AND aggregate_object_id = ? ORDER BY occurred_at, id",
      [context.tenantId, item.id]
    );
    expect(events.map((event) => event.eventType)).toEqual(
      expect.arrayContaining([
        'DELIVERABLE_ITEM_CREATED',
        'DELIVERABLE_REVIEW_REQUESTED',
        'DELIVERABLE_REVIEW_COMPLETED',
        'DELIVERABLE_APPROVAL_REQUESTED',
        'DELIVERABLE_APPROVED',
        'DELIVERABLE_ITEM_ISSUED',
        'DELIVERABLE_RECIPIENT_RESPONSE_RECORDED'
      ])
    );
  });
});
