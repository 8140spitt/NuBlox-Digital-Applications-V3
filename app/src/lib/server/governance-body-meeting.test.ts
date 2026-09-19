import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let bodyService: typeof import('./governance-body');
let meetingService: typeof import('./governance-body-meeting');
let informationService: typeof import('./information-container');
let decisionService: typeof import('./work-decision');
let personService: typeof import('./foundation-person');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  bodyService = await import('./governance-body');
  meetingService = await import('./governance-body-meeting');
  informationService = await import('./information-container');
  decisionService = await import('./work-decision');
  personService = await import('./foundation-person');
  db = await import('./db');
});

afterAll(async () => {
  await db.closeDbPool();
});

describe('F02 Board and Committee meeting runtime', () => {
  it('snapshots effective membership and separates packs, resolutions and actions', async () => {
    const tenant = 'governance-meeting-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);
    const secretary = await personService.createPerson(context, {
      givenName: 'Board',
      familyName: 'Secretary'
    });
    const member = await personService.createPerson(context, {
      givenName: 'Board',
      familyName: 'Member'
    });

    const bodyId = await bodyService.createGovernanceBody(context, {
      bodyRef: 'BOARD-MEETING-TEST',
      name: 'Meeting Test Board',
      bodyType: 'BOARD',
      mandate: 'Direct enterprise matters.',
      termsOfReference: 'Formal board terms.',
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      membershipRules: 'Chair, secretary and members.',
      quorumRequired: 2,
      chairPartyId: context.actorPartyId,
      secretariatPartyId: secretary,
      members: [
        { partyId: context.actorPartyId, roleKey: 'CHAIR' },
        { partyId: secretary, roleKey: 'SECRETARY' },
        { partyId: member, roleKey: 'MEMBER' }
      ]
    });

    let body = (await bodyService.listGovernanceBodies(context)).find((row) => row.id === bodyId)!;
    await bodyService.transitionGovernanceBody(context, bodyId, body.aggregateVersion, 'CONSTITUTE');
    body = (await bodyService.listGovernanceBodies(context)).find((row) => row.id === bodyId)!;
    await bodyService.transitionGovernanceBody(context, bodyId, body.aggregateVersion, 'ACTIVATE');

    const meetingId = await meetingService.scheduleGovernanceBodyMeeting(context, {
      bodyId,
      meetingRef: 'BOARD-2027-01',
      scheduledAt: '2027-01-20T10:00:00Z',
      locationChannel: 'Boardroom',
      agenda: [
        {
          subject: 'Capital investment',
          purpose: 'Review proposed investment.',
          requiredOutcome: 'DECISION',
          subjectType: 'INVESTMENT_CASE',
          subjectId: 'investment-001',
          subjectVersion: '1'
        }
      ]
    });

    const attendees = await meetingService.listGovernanceBodyMeetingAttendees(context, meetingId);
    expect(attendees.map((row) => row.partyId).sort()).toEqual(
      [context.actorPartyId, secretary, member].sort()
    );

    const containerId = await informationService.createInformationContainer(context, {
      containerRef: 'BOARD-PACK-2027-01',
      containerType: 'BOARD_PACK',
      title: 'Board pack January 2027',
      subjectType: 'GOVERNANCE_MEETING',
      subjectId: meetingId,
      revisionCode: 'P01'
    });

    let container = (await informationService.listInformationContainers(context)).find(
      (row) => row.id === containerId
    )!;
    await informationService.addInformationRepresentation(context, containerId, container.aggregateVersion, {
      representationType: 'PDF',
      contentReference: 's3://nublox-test/board-pack-2027-01.pdf',
      contentMediaType: 'application/pdf',
      sourceFilename: 'board-pack-2027-01.pdf',
      hashAlgorithm: 'SHA256',
      contentHash: 'a'.repeat(64)
    });

    container = (await informationService.listInformationContainers(context)).find(
      (row) => row.id === containerId
    )!;
    await informationService.submitInformationRevision(context, containerId, container.aggregateVersion);

    container = (await informationService.listInformationContainers(context)).find(
      (row) => row.id === containerId
    )!;
    const approvalDecisionId = await decisionService.recordWorkDecision(context, {
      decisionType: 'INFORMATION_REVISION_REVIEW',
      subjectType: 'INFORMATION_CONTAINER',
      subjectId: containerId,
      subjectVersion: '1',
      outcome: 'APPROVED',
      reason: 'Board pack is complete and suitable for issue.'
    });
    await informationService.approveInformationRevision(
      context,
      containerId,
      container.aggregateVersion,
      approvalDecisionId
    );

    container = (await informationService.listInformationContainers(context)).find(
      (row) => row.id === containerId
    )!;
    await informationService.issueInformationRevision(context, containerId, container.aggregateVersion);

    const revision = (await informationService.listInformationRevisions(context, containerId))[0];
    expect(revision.lifecycleStatus).toBe('ISSUED');
    await meetingService.linkGovernanceMeetingInformation(
      context,
      meetingId,
      revision.id,
      'BOARD_PACK'
    );

    await meetingService.recordGovernanceBodyMeetingAttendance(
      context,
      meetingId,
      context.actorPartyId,
      'PRESENT'
    );
    await meetingService.recordGovernanceBodyMeetingAttendance(
      context,
      meetingId,
      secretary,
      'PRESENT'
    );

    let meeting = (await meetingService.listGovernanceBodyMeetings(context, bodyId)).find(
      (row) => row.id === meetingId
    )!;
    await meetingService.conveneGovernanceBodyMeeting(
      context,
      meetingId,
      meeting.aggregateVersion
    );

    const resolutionId = await meetingService.recordGovernanceBodyResolution(context, meetingId, {
      subjectType: 'INVESTMENT_CASE',
      subjectId: 'investment-001',
      subjectVersion: '1',
      outcome: 'APPROVED',
      reason: 'The investment meets the Board-approved case and funding conditions.'
    });

    const action = await meetingService.createGovernanceBodyMeetingAction(context, meetingId, {
      title: 'Implement Board investment resolution',
      instructions: 'Proceed with the approved investment controls and reporting.',
      subjectType: 'INVESTMENT_CASE',
      subjectId: 'investment-001',
      subjectVersion: '1',
      priority: 'HIGH'
    });

    meeting = (await meetingService.listGovernanceBodyMeetings(context, bodyId)).find(
      (row) => row.id === meetingId
    )!;
    await meetingService.completeGovernanceBodyMeeting(
      context,
      meetingId,
      meeting.aggregateVersion,
      'Quorum confirmed, investment approved and implementation action assigned.'
    );

    meeting = (await meetingService.listGovernanceBodyMeetings(context, bodyId)).find(
      (row) => row.id === meetingId
    )!;
    expect(meeting.status).toBe('COMPLETED');
    expect(meeting.meetingType).toBe('BOARD_MEETING');

    const papers = await meetingService.listGovernanceMeetingInformation(context, meetingId);
    expect(papers).toHaveLength(1);
    expect(papers[0].revisionId).toBe(revision.id);
    expect(papers[0].linkRole).toBe('BOARD_PACK');

    expect(
      (await meetingService.listGovernanceBodyMeetingDecisionIds(context, meetingId)).map(
        (row) => row.decisionId
      )
    ).toContain(resolutionId);
    expect(
      (await meetingService.listGovernanceBodyMeetingActionIds(context, meetingId)).map(
        (row) => row.workItemId
      )
    ).toContain(action.workItemId);

    const decision = await db.queryOne<any>(
      'SELECT decision_type AS decisionType FROM work_decisions WHERE id = ?',
      [resolutionId]
    );
    const work = await db.queryOne<any>(
      'SELECT work_type AS workType FROM work_items WHERE id = ?',
      [action.workItemId]
    );
    expect(decision?.decisionType).toBe('GOVERNANCE_BODY_RESOLUTION');
    expect(work?.workType).toBe('GOVERNANCE_BODY_ACTION');
  });
});
